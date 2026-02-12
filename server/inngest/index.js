import { Inngest } from 'inngest';
import { clerkClient } from '@clerk/express';
import User from '../models/User.js';
import connectDB from '../configs/db.js';
import mongoose, { set } from 'mongoose';
import Booking from '../models/Booking.js';
import Show from '../models/Show.js';
import sendEmail from '../configs/nodeMailer.js';

export const inngest = new Inngest({ id: 'showmama' });
/* ================= USER CREATED ================= */
const syncUserCreation = inngest.createFunction(
  { id: 'sync-user-from-clerk' },
  { event: 'clerk/user.created' },
  async ({ event }) => {
    await connectDB();
    console.log('DB name:', mongoose.connection.db.databaseName);

    const { id, first_name, last_name, email_addresses, image_url } =
      event.data;
    const userData = {
      _id: id,
      name: `${first_name ?? ''} ${last_name ?? ''}`.trim(),
      email: email_addresses[0].email_address,
      image: image_url,
    };
    await User.create(userData);
    return { success: true };
  }
);

/* ================= USER DELETED ================= */
const syncUserDeletion = inngest.createFunction(
  { id: 'delete-user-from-clerk' },
  { event: 'clerk/user.deleted' },
  async ({ event }) => {
    await connectDB();
    const { id } = event.data;
    await User.findByIdAndDelete(id);
    return { success: true };
  }
);

/* ================= USER UPDATED ================= */
const syncUserUpdation = inngest.createFunction(
  { id: 'update-user-from-clerk' },
  { event: 'clerk/user.updated' },
  async ({ event }) => {
    await connectDB();

    const { id, first_name, last_name, email_addresses, image_url } =
      event.data;
    const userData = {
      _id: id,
      name: `${first_name ?? ''} ${last_name ?? ''}`.trim(),
      email: email_addresses[0].email_address,
      image: image_url,
    };
    await User.findByIdAndUpdate(id, userData, { new: true });
    return { success: true };
  }
);

const releaseSeatsAndDeleteBooking = inngest.createFunction(
  { id: 'release-seats-and-delete-booking' },
  { event: 'app/checkpayment' },
  async ({ event, step }) => {
    await connectDB();
    const tenMinsLater = new Date(Date.now() + 10 * 60 * 1000);
    await step.sleepUntil('wait-for-10-mins', tenMinsLater);

    await step.run('check-payment-status', async () => {
      const { bookingId } = event.data;

      if (!bookingId) {
        console.log('No bookingId received');
        return;
      }

      const booking = await Booking.findById(bookingId);

      if (!booking) {
        console.log('Booking already deleted or not found');
        return;
      }

      if (booking.isPaid) {
        console.log('Booking already paid, nothing to release');
        return;
      }

      const show = await Show.findById(booking.show);

      if (!show) {
        console.log('Show not found');
        return;
      }

      // Release seats
      booking.bookedSeats.forEach((seat) => {
        delete show.occupiedSeats[seat];
      });

      show.markModified('occupiedSeats');
      await show.save();

      await Booking.findByIdAndDelete(booking._id);

      console.log('Seats released and booking deleted');
    });
  }
);

// Inggest function to send email to user after successful payment

const sendBookingConfirmationEmail = inngest.createFunction(
  { id: 'send-booking-confirmation-email' },
  { event: 'app/show.booked' },
  async ({ event, step }) => {
    await connectDB();
    const { bookingId } = event.data;

    const booking = await Booking.findById(bookingId).populate({
      path: 'show',
      populate: { path: 'movie', model: 'Movie', select: 'title' },
    });

    if (!booking) {
      console.log('Booking not found');
      return;
    }

    // 🔥 Fetch user from Clerk
    const clerkUser = await clerkClient.users.getUser(booking.user);

    if (!clerkUser) {
      console.log('Clerk user not found');
      return;
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress;
    const name = clerkUser.firstName || 'User';

    if (!email) {
      console.log('User has no email');
      return;
    }

    await step.run('send confirmation email', async () => {
      await sendEmail({
        to: email,
        subject: `🎬 Booking Confirmed – ${booking.show.movie.title}`,
        body: `
      <div style="font-family: Arial, sans-serif; padding:20px;">
        <h2>🎟 Booking Confirmed!</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Your tickets for <strong>${booking.show.movie.title}</strong> have been booked.</p>
        <p><strong>Seats:</strong> ${booking.bookedSeats.join(', ')}</p>
        <p><strong>Total Amount:</strong> $${booking.amount}</p>
        <p>Enjoy your movie! 🍿</p>
      </div>
    `,
      });
    });
  }
);

// Inngest Function to send Remainder

const sendBookingReminderEmail = inngest.createFunction(
  { id: 'send-booking-reminder-email' },
  { cron: '0 */8 * * *' }, // Every 8 hours
  async ({ step }) => {
    await connectDB();

    const now = new Date();
    const in8Hours = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const windowStart = new Date(in8Hours.getTime() - 10 * 60 * 1000);

    // 🔹 Step 1: Prepare reminder tasks
    const reminderTasks = await step.run('prepare-reminder-task', async () => {
      const shows = await Show.find({
        showTime: { $gte: windowStart, $lte: in8Hours },
      }).populate('movie');

      const tasks = [];

      for (const show of shows) {
        if (!show.movie || !show.occupiedSeats) continue;

        const userIds = [...new Set(Object.keys(show.occupiedSeats))];
        if (userIds.length === 0) continue;

        const users = await User.find({
          _id: { $in: userIds },
        }).select('name email');

        for (const user of users) {
          if (!user.email) continue;

          tasks.push({
            userEmail: user.email,
            userName: user.name,
            movieTitle: show.movie.title,
            showTime: show.showTime,
          });
        }
      }

      return tasks;
    });

    if (!reminderTasks || reminderTasks.length === 0) {
      return { sent: 0, message: 'No reminders to send' };
    }

    // 🔹 Step 2: Send Emails
    const results = await step.run('send-all-reminders', async () => {
      return await Promise.allSettled(
        reminderTasks.map(async (task) => {
          await sendEmail({
            to: task.userEmail,
            subject: `🎬 Reminder – ${task.movieTitle}`,
            body: `
              <div style="font-family: Arial, sans-serif; padding:20px;">
                <h2>⏰ Movie Reminder</h2>
                <p>Hi <strong>${task.userName}</strong>,</p>
                <p>
                  Your movie <strong>${task.movieTitle}</strong> is scheduled at 
                  <strong>${new Date(task.showTime).toLocaleString()}</strong>.
                </p>
                <p>Enjoy your movie! 🍿</p>
              </div>
            `,
          });
        })
      );
    });

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.length - sent;

    return {
      sent,
      failed,
      message: `Reminders sent: ${sent}, failed: ${failed}`,
    };
  }
);

const sendNewShowNotification = inngest.createFunction(
  { id: "send-new-show-notification" },
  { event: "app/show.added" },
  async ({ event, step }) => {
    await connectDB();

    const { movieTitle, showTime } = event.data;

    // 🔹 Step 1: Fetch Users
    const users = await step.run("fetch-users", async () => {
      return await User.find({}).select("name email");
    });

    if (!users || users.length === 0) {
      return { sent: 0, message: "No users found" };
    }

    // 🔹 Step 2: Send Emails in Parallel
    const results = await step.run("send-notifications", async () => {
      return await Promise.allSettled(
        users.map((user) => {
          if (!user.email) return;

          return sendEmail({
            to: user.email,
            subject: `🎬 New Show Added – ${movieTitle}`,
            body: `
              <div style="font-family: Arial, sans-serif; padding:20px;">
                <h2>🎬 New Show Added</h2>
                <p>Hi <strong>${user.name}</strong>,</p>
                <p>A new show has been added:</p>
                <p><strong>${movieTitle}</strong></p>
                <p>
                  Show Time: 
                  <strong>${new Date(showTime).toLocaleString()}</strong>
                </p>
                <p>Book your seats now! 🍿</p>
              </div>
            `,
          });
        })
      );
    });

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.length - sent;

    return {
      sent,
      failed,
      message: `Notifications sent: ${sent}, failed: ${failed}`,
    };
  }
);


export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdation,
  releaseSeatsAndDeleteBooking,
  sendBookingConfirmationEmail,
  sendBookingReminderEmail,
  sendNewShowNotification,
];
