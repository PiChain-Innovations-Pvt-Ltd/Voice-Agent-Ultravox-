import express from 'express';
import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
let pdfContent = ''; // Stores full raw PDF content (for AI)
let pdfOriginalContent = ''; // Stores original content (for webhook)

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
    pdfOriginalContent = originalText.join("\n"); // Store original text for webhook
    console.log("📄 Extracted PDF Content for AI:\n", pdfContent);
    console.log("📄 Extracted PDF Original Content for Webhook:\n", pdfOriginalContent);
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

// ✅ Properly export the router
export { router };
