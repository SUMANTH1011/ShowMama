import { Inngest } from "inngest";
import User from "../models/User.js";

export const inngest = new Inngest({ id: "showmama" });

/* ================= USER CREATED ================= */
const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event }) => {
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

export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdation,
];
 