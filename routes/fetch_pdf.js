import express from 'express';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { JWT } from 'google-auth-library'; // ✅ Import JWT properly
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
let pdfContent = ''; // Stores full raw PDF content (for AI)
let pdfOriginalContent = ''; // Stores original content (for webhook)
const app = express();
app.use(express.json()); // Middleware to parse JSON requests

const SHEET_ID = process.env.GOOGLE_SHEET_ID; // Google Sheet ID
const SERVICE_ACCOUNT_JSON = process.env.GOOGLE_SERVICE_ACCOUNT_KEY 
    ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
    : null; // Ensure it’s not undefined

if (!SHEET_ID || !SERVICE_ACCOUNT_JSON) {
    console.error("❌ Missing required environment variables for Google Sheets.");
    process.exit(1); // Exit if variables are missing
}

async function storeUserDetails(name, phoneNumber, selectedClass, day) {
    try {
        // ✅ Use JWT-based authentication
        const auth = new JWT({
            email: SERVICE_ACCOUNT_JSON.client_email,
            key: SERVICE_ACCOUNT_JSON.private_key,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const doc = new GoogleSpreadsheet(SHEET_ID, auth); // ✅ Pass auth object
        await doc.loadInfo(); // Load sheet info

        const sheet = doc.sheetsByIndex[0]; // Use first sheet
        await sheet.addRow({ Name: name, "Phone Number": phoneNumber, Class: selectedClass, Day: day });

        console.log(`✅ Data stored successfully! Name: ${name}, Phone: ${phoneNumber}, Class: ${selectedClass}, Day: ${day}`);
        return { success: true, message: 'User details stored successfully!' };
    } catch (error) {
        console.error('❌ Error storing data:', error);
        return { success: false, message: 'Failed to store user details' };
    }
}

export { storeUserDetails };

// Function to extract full text from PDFs
const extractPDFs = async () => {
    const pdfFiles = [
        { path: path.join(__dirname, "Physique 57 - Brand Infomation_2025.pdf"), label: "Workout Information" },
        { path: path.join(__dirname, "p57 - BLR Schedule - Q1-1.pdf"), label: "Class Schedule" }
    ];

    let fullText = [];
    let originalText = [];

    for (let file of pdfFiles) {
        try {
            const filePath = path.resolve(__dirname, file.path);
            console.log(`Processing file: ${filePath}`);

            if (!fs.existsSync(filePath)) {
                console.error(`❌ File not found: ${filePath}`);
                fullText.push(`${file.label}: [File not found]`);
                originalText.push(`${file.label}: [File not found]`);
                continue;
            }

            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdf(dataBuffer);

            // Store original text for webhook
            originalText.push(`--- ${file.label} ---\n${data.text.trim()}\n`);

            // Replace variations of "BARRE" with "Bar" (for AI response)
            const cleanedText = data.text.replace(/BARRE|Barre|barre/g, "Bar");
            fullText.push(`--- ${file.label} ---\n${cleanedText.trim()}\n`);
        } catch (error) {
            console.error(`❌ Error reading ${file.path}:`, error);
            fullText.push(`${file.label}: [Error loading content]`);
            originalText.push(`${file.label}: [Error loading content]`);
        }
    }

    pdfContent = fullText.join("\n"); // Store modified text for AI
    // pdfOriginalContent = originalText.join("\n"); // Store original text for webhook
    console.log("📄 Extracted PDF Content for AI:\n", pdfContent);
    // console.log("📄 Extracted PDF Original Content for Webhook:\n", pdfOriginalContent);
};

extractPDFs(); // Run at startup

// API to return full PDF data for AI searching
router.post('/fetch_pdf', async (req, res) => {
    console.log('📥 Incoming Fetch Request!');
    
    const { query } = req.body;
    if (!query) {
        return res.status(400).json({ error: "Missing 'query' in request body" });
    }

    const prompt = `
    You are an AI assistant for Physique 57.
    Answer questions using the following full-text extracted from PDFs.

    --- PDF FULL TEXT ---
    ${pdfContent || "[No PDF data available]"}
    --- END ---

    User Query: "${query}"
    Answer:
    `;

    res.json({ response: prompt.trim() });
});

router.post('/store_user_details', async (req, res) => {
    const { name, phoneNumber, selectedClass, day } = req.body;

    if (!name || !phoneNumber || !selectedClass || !day) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await storeUserDetails(name, phoneNumber, selectedClass, day);

    res.status(result.success ? 200 : 500).json(result);
    res.sendStatus(200);
});

// ✅ Properly export the router
export { router };
