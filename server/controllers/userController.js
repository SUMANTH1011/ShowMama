import { clerkClient } from "@clerk/express";
import Booking from "../models/Booking.js";
import Movie from "../models/Movie.js";


// API Controller Functions to Get User Bookings
export const getUserBookings = async (req, res) => {
    try
    {
        const user=req.auth().userId;
        const bookings=await Booking.find({user}).populate({
            path:'show',
            populate:{ 
                path:'movie'
            }
        }).sort({createdAt:-1});
        res.json({ success: true, bookings})
    }
    catch (err) {
        console.error("Get User Bookings Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
}

// API Controller Function to Update Favorite Movie in Clerk User Metadata
export const updateFavoriteMovie = async (req, res) => {
    try{
        const {movieId}=req.body;
        const {userId}=req.auth().userId;
        const user=await clerkClient.users.getUser(userId);

        if(!user.privateMetadata.favorites){
            user.privateMetadata.favorites=[];
        }
        if(!user.privateMetadata.favorites.includes(movieId)){
            user.privateMetadata.favorites.push(movieId);
        }
        else{
            user.privateMetadata.favorites=user.privateMetadata.favorites.filter(id=>id!==movieId);
        }
        await clerkClient.users.updateUserMetadata(userId,{privateMetadata:user.privateMetadata});
        res.json({ success: true, message: "Favorites updated successfully" });
    }
    catch(err){
        console.error("Update Favorite Movie Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
}

// API Controller Function to Get Favorite Movies from Clerk User Metadata
export const getFavoriteMovies = async (req, res) => {
    try{
        const user=await clerkClient.users.getUser(req.auth().userId);
        const favorites=user.privateMetadata.favorites;
        const movies=await Movie.find({_id:{$in:favorites}})
        res.json({ success: true, movies });
    }
    catch(err){
        console.error("Get Favorite Movies Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
}