import express from 'express';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import fs from 'fs';

import path from 'path';
import pdf from 'pdf-parse';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { JWT } from 'google-auth-library'; // ✅ Import JWT properly

const router = express.Router();

router.post('/store_appointment_details', async (req, res) => {
 
    res.sendStatus(200);
});


router.post('/fetch_service_data', async (req, res) => {
 
    res.sendStatus(200);
});

// ✅ Properly export the router
export { router };