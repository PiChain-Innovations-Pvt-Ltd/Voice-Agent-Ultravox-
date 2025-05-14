// fetch_txts.js
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
let combinedText = ''; // Combined .txt content

// Combine both text files
const extractTextFiles = async () => {
    const txtFiles = [
        { path: path.join(__dirname, "discharge_instructions.txt"), label: "Discharge Instructions" },
        { path: path.join(__dirname, "demo_script.txt"), label: "Demo Script" }
    ];

    let contents = [];

    for (let file of txtFiles) {
        try {
            const fileText = fs.readFileSync(file.path, "utf-8");
            contents.push(`--- ${file.label} ---\n${fileText.trim()}`);
        } catch (err) {
            console.error(`❌ Error reading ${file.label}:`, err);
            contents.push(`--- ${file.label} ---\n[Error loading content]`);
        }
    }

    combinedText = contents.join("\n\n");
    console.log("📄 Extracted Text Content:\n", combinedText.slice(0, 500) + "...");
};

await extractTextFiles();

router.post('/fetch_txt', async (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Missing query" });

    const prompt = `
You are an AI follow-up agent for MedSetGo. Use the following data to answer queries:

${combinedText}

User Query: "${query}"
Answer:
    `;

    res.json({ response: prompt.trim() });
});

export { router };
