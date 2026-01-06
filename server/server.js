import express from 'express';
import cors from 'cors';
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js"
import 'dotenv/config';
import db from './configs/db.js';
import { clerkMiddleware } from '@clerk/express'

const app = express();
const port=3000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(clerkMiddleware())

// Api Routes
app.get('/',(req,res)=>res.send('Server is up and running'));
app.use('/api/inngest',serve({ client: inngest, functions }));

// Listen to server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});