import express from 'express';
import 'dotenv/config'

const port = 3003;
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

// Import our routes and mount them
import { router as plivoRoutes } from './routes/plivo.js';
import { router as makeRoutes } from './routes/make.js';
import { router as fetchpdfRoutes } from './routes/fetch_pdf.js';
import { router as store_routes } from './routes/store.js';
import { router as fetchLeadRoutes } from './routes/fetch_leads.js';


app.use('/plivo/', plivoRoutes);
app.use('/make/', makeRoutes);
app.use('/', fetchpdfRoutes);
app.use('/', store_routes)
app.use('/upes/', fetchLeadRoutes);



// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
