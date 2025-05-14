import express from 'express';
import 'dotenv/config'

const port = 3009;
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

// Import our routes and mount them
import { router as plivoRoutes } from './routes/plivo.js';
import { router as twilioRoutes } from './routes/twilio.js';
import { router as makeRoutes } from './routes/make.js';
import { router as fetchpdfRoutes } from './routes/fetch_txts.js';
import { router as followupRoutes } from './routes/store_followup.js';

app.use('/medsetgo/', followupRoutes);
app.use('/plivo/', plivoRoutes);
app.use('/twilio/', twilioRoutes);
app.use('/make/', makeRoutes);
app.use('/medsetgo/', fetchpdfRoutes);


// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});