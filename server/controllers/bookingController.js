import show from "../models/Show.js";
import Booking from "../models/Booking.js";

export const checkSeatAvailability = async (showId,selectedSeats) => {
    try
    {
        const showData=await show.findById(showId);
        if(!showData) return { success: false, message: "Show not found" };

        const occupiedSeats=showData.occupiedSeats || {};

        const isAnySeatTaken=selectedSeats.some(seat=>occupiedSeats[seat]);
        return !isAnySeatTaken;
    }
    catch(err)
    {
        console.error("Check Seat Availability Error:", err);
        return { success: false, message: "Internal server error" };
    }
}

export const createBooking=async(req,res)=>{
    try{
        const {userId}=req.auth();
        const {showId, selectedSeats}=req.body;
        const {origin}=req.headers;

        // Check seat availability
        const isAvailable=await checkSeatAvailability(showId,selectedSeats);
        if(!isAvailable){
            return res.status(400).json({ success: false, message: "Selected seats are already booked" });
        }
        // Get show details
        const showData=await show.findById(showId).populate('movie');
        if(!showData){
            return res.status(404).json({ success: false, message: "Show not found" });
        }
        // Create booking 
        const booking= await Booking.create({
            user:userId,
            show:showId,
            amount:showData.showPrice * selectedSeats.length,
            bookedSeats:selectedSeats,
            isPaid:false,
        });
        selectedSeats.map((seat)=>{
            showData.occupiedSeats[seat]=userId;
        })
        showData.markModified('occupiedSeats');
        await showData.save();

        // Stripe Gateway Initialization

        res.status(201).json({ success: true, message: "Booking created successfully", bookingId: booking._id });
    }
    catch(err){
        console.error("Create Booking Error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const getOccupiedSeats=async(req,res)=>{
    try{
        const {showId}=req.params;
        const showData=await show.findById(showId);
        if(!showData){
            return res.status(404).json({ success: false, message: "Show not found" });
        }
        const occupiedSeats=Object.keys(showData.occupiedSeats) || {};
        res.status(200).json({ success: true, occupiedSeats });
    }
    catch(err){
        console.error("Get Occupied Seats Error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}