import { Inngest } from "inngest";
import User from "../models/User.js";
import connectDB from "../configs/db.js";
import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";


export const inngest = new Inngest({ id: "showmama" });
/* ================= USER CREATED ================= */
const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    await connectDB();
    console.log("DB name:", mongoose.connection.db.databaseName);

      const {
        id,
        first_name,
        last_name,
        email_addresses,
        image_url,
      } = event.data
      const userData = {
        _id: id,
        name: `${first_name ?? ""} ${last_name ?? ""}`.trim(), 
        email: email_addresses[0].email_address,
        image: image_url,
      };
      await User.create(userData);
      return { success: true };
}
);

/* ================= USER DELETED ================= */
const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-from-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    await connectDB();
   const { id } = event.data;
   await User.findByIdAndDelete(id);
   return { success: true };
  }
);

/* ================= USER UPDATED ================= */
const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    await connectDB();

   const {
        id,
        first_name,
        last_name,
        email_addresses,
        image_url,
      } = event.data
    const userData = {
        _id: id,
        name: `${first_name ?? ""} ${last_name ?? ""}`.trim(), 
        email: email_addresses[0].email_address,
      image: image_url,
      };
    await User.findByIdAndUpdate(id, userData, { new: true });
    return { success: true };
  }
);


const releaseSeatsAndDeleteBooking=inngest.createFunction(
  {id:'release-seats-and-delete-booking'},
  {event:'app/checkpayment'},
  async({event,step})=>{
    const tenMinsLater=new Date(Date.now()+10*60*1000);
    await step.sleepUntil('wait-for-10-mins', tenMinsLater);

    await step.run('check-payment-status', async()=>{
      const {bookingId}=event.data.bookingId;
      const booking=await Booking.findById(bookingId);

      if(!booking.isPaid){
        // Release the seats
        const show=await Show.findById(booking.show);
        booking.bookedSeats.forEach(seat=>{
          delete show.occupiedSeats[seat];
        });
        show.markModified('occupiedSeats');
        await show.save();
        await Booking.findByIdAndDelete(booking._id);
      }
    })
  }
)


export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdation,
  releaseSeatsAndDeleteBooking
];
 