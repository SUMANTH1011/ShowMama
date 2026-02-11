import Stripe from 'stripe';
import show from '../models/Show.js';
import Booking from '../models/Booking.js';
import { inngest } from '../inngest/index.js';

export const checkSeatAvailability = async (showId, seats) => {
  try {
    const showData = await show.findById(showId);
    if (!showData) return false;

    const occupiedSeats = showData.occupiedSeats || {};

    if (!seats || seats.length === 0) return false;

    const isAnySeatTaken = seats.some((seat) => occupiedSeats[seat]);

    return !isAnySeatTaken;
  } catch (err) {
    console.error('Check Seat Availability Error:', err);
    return false;
  }
};

export const createBooking = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { showId, seats } = req.body;
    const { origin } = req.headers;

    // Check seat availability
    const isAvailable = await checkSeatAvailability(showId, seats);
    if (!isAvailable) {
      return res
        .status(400)
        .json({ success: false, message: 'Selected seats are already booked' });
    }
    // Get show details
    const showData = await show.findById(showId).populate('movie');
    if (!showData) {
      return res
        .status(404)
        .json({ success: false, message: 'Show not found' });
    }
    // Create booking
    const booking = await Booking.create({
      user: userId,
      show: showId,
      amount: showData.showPrice * seats.length,
      bookedSeats: seats,
      isPaid: false,
    });
    if (!showData.occupiedSeats) {
      showData.occupiedSeats = {};
    }
    seats.map((seat) => {
      showData.occupiedSeats[seat] = userId;
    });
    showData.markModified('occupiedSeats');
    await showData.save();

    // Stripe Gateway Initialization
    const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

    const line_items=[{
        price_data:{
            currency:'usd',
            product_data:{
                name:showData.movie.title,
            },
            unit_amount:Math.floor(booking.amount)*10,
        },
        quantity:1,
    }]
    const session =await stripeInstance.checkout.sessions.create({
        success_url: `${origin}/loading/my-bookings`,
        cancel_url: `${origin}/my-bookings`,
        line_items:line_items,
        mode:'payment', 
        metadata:{
            bookingId:booking._id.toString(),
        },
        expires_at:Math.floor(Date.now()/1000)+60*60, 
    })
    booking.paymentLink=session.url;
    await booking.save();

    await inngest.send({
      name: 'app/checkpayment',
      data: {
        bookingId: booking._id.toString(),
      },
    })
    res
      .status(201)
      .json({
        success: true,
       url: session.url,
        bookingId: booking._id,
      });
  } catch (err) {
    console.error('Create Booking Error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getOccupiedSeats = async (req, res) => {
  try {
    const { showId } = req.params;

    const bookings = await Booking.find({ show: showId });

    const occupiedSeats = bookings.flatMap(
      (booking) => booking.bookedSeats
    );

    res.status(200).json({
      success: true,
      occupiedSeats
    });

  } catch (err) {
    console.error("Get Occupied Seats Error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

