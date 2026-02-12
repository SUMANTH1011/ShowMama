Full-Stack MERN Movie Ticket Booking Platform


ShowMama is a production-ready movie ticket booking platform built using the MERN stack.
It supports secure authentication, Stripe payments, background job processing, automated emails, and an admin dashboard for managing shows.

🚀 Live Demo

🌐 Frontend: https://showmama.vercel.app/

🌐 Backend API: 

✨ Features
👤 User Features

🔐 Secure Authentication (Clerk)

🎬 Browse Now Playing Movies

❤️ Add Movies to Favorites

🎟 Seat Selection & Ticket Booking

💳 Stripe Checkout Integration

📩 Booking Confirmation Emails (Resend)

⏰ Automated Show Reminder Emails (Inngest)

📄 View Booking History

🛠 Admin Features

➕ Add Shows (Date & Time)

💰 Set Show Price

🗑 Delete Shows

🎥 Manage Movie Listings

📊 Dashboard Controls

🏗 Tech Stack
Frontend

React (Vite)

TailwindCSS

Axios

Clerk Authentication

Backend

Node.js

Express.js

MongoDB Atlas

Mongoose

Stripe API

Resend (Email Service)

Inngest (Background Jobs)

Deployment

Vercel (Frontend + Serverless Backend)

MongoDB Atlas (Cloud Database)

📂 Project Structure
showmama/
│
├── client/                 # React Frontend
│   ├── components/
│   ├── pages/
│   ├── context/
│   └── ...
│
├── server/                 # Express Backend
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── inngest/
│   ├── configs/
│   └── server.js
│
└── README.md

⚙️ Environment Variables
🔹 Backend (.env)
PORT=5000

MONGO_URI=your_mongodb_connection_string

CLERK_SECRET_KEY=your_clerk_secret
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

RESEND_API_KEY=your_resend_api_key
SENDER_EMAIL=no-reply@yourdomain.com

🔹 Frontend (.env)
VITE_BACKEND_URL=https://your-backend-url.vercel.app
VITE_CURRENCY=₹

🗄 Database Schema
Movie

_id

title

poster_path

release_date

vote_average

vote_count

Show

movie (ObjectId → Movie)

showTime (Date)

showPrice

occupiedSeats

Booking

user

show

bookedSeats

amount

paymentStatus

🔄 Background Jobs (Inngest)
🎟 Booking Confirmation

Triggered when:

app/show.booked


Sends confirmation email.

⏰ Show Reminder

Runs every 8 hours:

cron: 0 */8 * * *


Sends reminder emails before show time.

📢 New Show Notification

Triggered when:

app/show.added


Notifies all users about new shows.

💳 Stripe Payment Flow

User selects seats

Backend creates Stripe Checkout session

User completes payment

Stripe Webhook verifies payment

Booking status updated

Inngest triggers confirmation email

📧 Email Integration (Resend)
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: process.env.SENDER_EMAIL,
  to: userEmail,
  subject: "🎬 Booking Confirmed",
  html: "<h1>Your ticket is confirmed!</h1>"
});

🧪 Running Locally
1️⃣ Clone Repository
git clone https://github.com/yourusername/showmama.git
cd showmama

2️⃣ Install Dependencies
Frontend
cd client
npm install
npm run dev

Backend
cd server
npm install
npm run dev

🚀 Deployment Guide
Backend (Vercel)

Add environment variables

Ensure MongoDB Atlas IP whitelist includes:

0.0.0.0/0


Deploy server folder

Frontend (Vercel)

Add VITE_BACKEND_URL

Deploy client folder

Redeploy after adding env variables

🛡 Security

Clerk JWT authentication

Protected admin routes

Stripe webhook signature verification

MongoDB connection caching for serverless

Environment variable protection

📈 Future Improvements

🤖 AI-based Movie Recommendations

📊 Analytics Dashboard

🎟 Real-time Seat Availability

📱 Mobile App Version

🎬 Trailer Integration

👨‍💻 Author

Sumanth Reddy
Full Stack MERN Developer

📜 License

MIT License
