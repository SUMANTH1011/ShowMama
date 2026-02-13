

// API to check if user is admin

import Booking from "../models/Booking.js";
import show from "../models/Show.js";
import User from "../models/User.js";
import connectDB from "../configs/db.js";


export const isAdmin=async(req,res)=>{
    res.json({ success: true, isAdmin: true, message: "User is admin" });
}
// API to get dashboard stats
export const getDashboardStats=async(req,res)=>{
    try{
        await connectDB();
        const bookings=await Booking.find({isPaid:true});
        const activeShows=await show.find({showDateTime:{$gte:new Date()}}).populate('movie');
        const totalUsers=await User.countDocuments();
        const dashboardStats={
            totalBookings:bookings.length,
            totalRevenue:bookings.reduce((acc,booking)=>acc+booking.amount,0),
            totalUsers:totalUsers,
            activeShows:activeShows
        };
        res.json({ success: true, dashboardStats });
    }
    catch(err){
        console.error("Get Dashboard Stats Error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

// API to get all shows 
export const getAllShows=async(req,res)=>{
    try{
        await connectDB();
        const shows=await show.find({showDateTime:{$gte:new Date()}}).populate('movie').sort({showDateTime:1});
        res.json({ success: true, shows });
    }
    catch(err){
        console.error("Get All Shows Error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

// API to get all bookings
export const getAllBookings=async(req,res)=>{
    try{
        await connectDB();
        const bookings=await Booking.find({}).populate('user').populate({
            path:'show',
            populate:{
                path:'movie'
            }
        }).sort({createdAt:-1});
        res.json({ success: true, bookings });
    }
    catch(err){
        console.error("Get All Bookings Error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}