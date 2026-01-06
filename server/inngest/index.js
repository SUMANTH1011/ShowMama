import { Inngest } from "inngest";
import {createUser,deleteUserById,updateUserById} from '../models/User.js';

export const inngest = new Inngest({ id: "showmama" });
// Inngest Functions to save user data to a database 
const syncUserCreation=inngest.createFunction(
    {id:'sync-user-from-clerk'},
    {event:'clerk/user.created'},
    async ({event})=>{
        const {id,first_name,last_name,email_addresses,image_url}=event.data;
        // Save user to database
        const userData={
            id:id,
            email:email_addresses[0].email_address,
            name:first_name+' '+last_name,
            image:image_url
        }
        await createUser(userData);
         return { success: true };
    }
)

// Inngest Functions to delete user data from a database
const syncUserDeletion=inngest.createFunction(
    {id:'delete-user-from-clerk'},
    {event:'clerk/user.deleted'},
    async ({event})=>{
        const {id}=event.data;
        await deleteUserById(id);
         return { success: true };
    }
)

// Inngest Function to update user data in a database (optional, not implemented here)
const syncUserUpdation=inngest.createFunction(
    {id:'update-user-from-clerk'},
    {event:'clerk/user.updated'},
    async ({event})=>{
    const {id,first_name,last_name,email_addresses,image_url}=event.data;
    const userData={
            id:id,
            email:email_addresses[0].email_address,
            name:first_name+' '+last_name,
            image:image_url
        }
        await updateUserById(id,userData);
         return { success: true };
    }
)
export const functions = [syncUserCreation,syncUserDeletion,syncUserUpdation];