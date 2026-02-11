import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js";
import { clerkMiddleware } from "@clerk/express";
import showRouter from './routes/showRoutes.js';
import bookingRouter from "./routes/bookingRoutes.js";
import adminRoter from "./routes/adminRoutes.js";
import userRouter from "./routes/userRoutes.js";

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(clerkMiddleware());

// 🔥 MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Error:", err));

// API Routes
app.get("/", (req, res) => res.send("Server is up and running"));
app.use("/api/inngest", serve({ client: inngest, functions }));
app.use('/api/show', showRouter);
app.use('/api/booking',bookingRouter);
app.use('/api/admin',adminRoter)
app.use('/api/user',userRouter);

app.listen(port, () =>
  console.log(`Server is running on http://localhost:${port}`)
);

export default app;
