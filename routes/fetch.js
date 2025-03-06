import express from 'express';
import fs from 'fs';
import 'dotenv/config';

const router = express.Router();

// Function to load the latest college database
const getCollegeDatabase = () => {
  try {
    const data = fs.readFileSync('college_database.json', 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading college database:', error);
    return [];
  }
};

// API endpoint to fetch filtered colleges
router.post('/fetch', async (req, res) => {
    console.log('Incoming College Fetch Request!');

    try {
        let { location, budget, branches } = req.body;
        
        // Ensure budget is treated as an integer
        if (typeof budget === "string") {
            budget = parseInt(budget);
        }

        // Ensure branches is an array, even if sent as a string
        if (typeof branches === "string") {
            try {
                branches = JSON.parse(branches);
            } catch (error) {
                branches = [branches]; // If parsing fails, treat it as a single branch
            }
        }

        const colleges = getCollegeDatabase();

        // Log the equivalent cURL command
        const curlCommand = `curl -X POST http://localhost:3000/fetch \\
     -H "Content-Type: application/json" \\
     -d '${JSON.stringify(req.body)}'`;

        console.log("Equivalent cURL Command:\n", curlCommand);

        const filteredColleges = colleges.filter(college => {
            const matchesLocation = location ? college.Location.toLowerCase() === location.toLowerCase() : true;
            const matchesBudget = budget ? parseInt(college["Course Fee"]) <= budget : true;

            const matchesBranch = branches && Array.isArray(branches)
                ? branches.some(branch =>
                    college["Branches Available"]
                        .split(',')
                        .map(b => b.trim().toLowerCase())
                        .includes(branch.trim().toLowerCase()))
                : true;

            console.log(`College: ${college["College Name"]}`);
            console.log(`Location: ${college.Location} | Given: ${location} | Match: ${matchesLocation}`);
            console.log(`Course Fee: ${college["Course Fee"]} | Given Budget: ${budget} | Match: ${matchesBudget}`);
            console.log(`Branches: ${college["Branches Available"]} | Given: ${branches} | Match: ${matchesBranch}`);
            console.log('----------------------------------------');

            return matchesLocation && matchesBudget && matchesBranch;
        });

        console.log(`Filtered Colleges Found: ${filteredColleges.length}`);
        res.status(200).json(filteredColleges);
    } catch (error) {
        console.error('Error fetching college data:', error);
        res.status(500).json({ error: 'Failed to fetch college data' });
    }
});

export { router };
