import { Inngest } from 'inngest';
import User from '../models/User.js';
import connectDB from '../configs/db.js';
import mongoose from 'mongoose';
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

    await sendEmail({
      to: email,
      subject: `🎬 Booking Confirmed – ${booking.show.movie.title}`,
      body: `
      <div style="font-family: Arial, sans-serif; background-color:#f9f9f9; padding:20px;">
        <div style="max-width:600px; margin:auto; background:white; padding:25px; border-radius:8px; box-shadow:0 4px 10px rgba(0,0,0,0.05);">
          
          <h2 style="color:#e50914;">🎟 Booking Confirmed!</h2>
          
          <p>Hi <strong>${name}</strong>,</p>
          
          <p>
            Your tickets for <strong>${booking.show.movie.title}</strong> have been successfully booked.
          </p>

          <hr/>

          <p><strong>Seats:</strong> ${booking.bookedSeats.join(', ')}</p>
          <p><strong>Total Amount:</strong> $${booking.amount}</p>

          <hr/>

          <p>Please arrive 15 minutes early and show this email at entry.</p>

          <p>🍿 Enjoy your movie with <strong>ShowMama</strong>!</p>
        </div>
      </div>
      `,
    });
  }
);

export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdation,
  releaseSeatsAndDeleteBooking,
  sendBookingConfirmationEmail,
];
