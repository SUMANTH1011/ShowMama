import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js"
import connectDB from './configs/db.js';
import { clerkMiddleware } from '@clerk/express'

const app = express();
const port=3000;

await connectDB();
// Middleware
app.use(express.json());
app.use(cors());
app.use(clerkMiddleware())

// Api Routes
app.get('/',(req,res)=>res.send('Server is up and running'));
app.use('/api/inngest',serve({ client: inngest, functions }));
app.listen(port,()=>console.log(`Server is running on port http://localhost:${port}`));
export default app;