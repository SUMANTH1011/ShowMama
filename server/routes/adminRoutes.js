import express from 'express';
import { protectAdmin } from '../middleware/auth.js';
import { isAdmin ,getDashboardStats,getAllBookings,getAllShows} from '../controllers/adminController.js';

const adminRoter=express.Router();

adminRoter.get('/is-admin',protectAdmin,isAdmin);
adminRoter.get('/dashboard',protectAdmin,getDashboardStats);
adminRoter.get('/all-shows',protectAdmin,getAllShows);
adminRoter.get('/all-bookings',protectAdmin,getAllBookings);
export default adminRoter;
