import express from 'express';
import 'dotenv/config'

const port = 3004;
const app = express();

app.use(express.json({ limit: '50mb' })); // or whatever size you expect
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Import our routes and mount them
import { router as plivoRoutes } from './routes/plivo.js';
import { router as makeRoutes } from './routes/make.js';
import { router as fetchRoutes } from './routes/fetch.js';
import { router as fetchpdfRoutes } from './routes/fetch_pdf.js';
import { router as store_routes } from './routes/store.js';
import { router as fetchLeadRoutes } from './routes/fetch_leads.js';
app.use('/plivo/', plivoRoutes);
app.use('/college/', fetchRoutes);
app.use('/make/', makeRoutes);
app.use('/phys/', fetchpdfRoutes);
app.use('/honda/', store_routes)
app.use('/mahe/', fetchLeadRoutes);


// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
