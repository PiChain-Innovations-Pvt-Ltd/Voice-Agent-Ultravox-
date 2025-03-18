import express from 'express';
import 'dotenv/config'

const port = 3000;
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

// Import our routes and mount them
import { router as plivoRoutes } from './routes/plivo.js';
import { router as makeRoutes } from './routes/make.js';
import { router as fetchRoutes } from './routes/fetch.js';
import { router as fetchpdfRoutes } from './routes/fetch_pdf.js';

app.use('/plivo/', plivoRoutes);
app.use('/college/', fetchRoutes);
app.use('/make/', makeRoutes);
app.use('/phys/', fetchpdfRoutes);


// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
