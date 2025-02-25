import express from 'express';
import 'dotenv/config'

const port = 3000;
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

// Import our routes and mount them
import { router as twilioRoutes } from './routes/twilio.js';
import { router as makeRoutes } from './routes/make.js';

app.use('/twilio/', twilioRoutes);
app.use('/make/', makeRoutes);


// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});