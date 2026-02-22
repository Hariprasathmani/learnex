import 'dotenv/config'; // 👈 1. Import to load .env variables
import express from 'express';
// Note: 'node-fetch' isn't needed for modern Node.js, 
// but we'll keep it for compatibility or older environments.
// If using Node >= 18, you can use built-in 'fetch'.
import fetch from 'node-fetch'; 
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// ----------------------
// 2. SECURITY FIX: Get API Key from environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 

// Basic check to ensure the key is loaded
if (!GEMINI_API_KEY) {
    console.error("FATAL ERROR: GEMINI_API_KEY is not set in environment variables. Please check your .env file.");
    process.exit(1);
}

// Model URL using the corrected, current model (gemini-2.5-flash)
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
// ----------------------


// Add this route for GET /
app.get('/', (req, res) => {
    res.send('Gemini proxy server is running. POST to /chat with { "user_message": "your text" }');
});

app.post('/chat', async (req, res) => {
    // 3. Destructure with a default value in case of missing body (for robustness)
    const { user_message } = req.body || {};
    
    if (!user_message) {
        return res.status(400).json({ error: 'Missing user_message in request body.' });
    }

    try {
        const requestBody = {
            contents: [{ parts: [{ text: user_message }] }]
        };
        console.log("Gemini Request Body:", JSON.stringify(requestBody, null, 2));

        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        let data;
        if (response.ok) {
            data = await response.json();
        } else {
            // Your existing robust error handling remains
            const errorText = await response.text();
            console.error("Gemini API Error Status:", response.status);
            console.error("Gemini API Error Body:", errorText);
            
            // Check if the error body is valid JSON to send back structured data
            try {
                const errorJson = JSON.parse(errorText);
                return res.status(response.status).json({ error: 'Gemini API error', details: errorJson });
            } catch (e) {
                // If not JSON, send the raw text
                return res.status(response.status).json({ error: 'Gemini API error', details: errorText });
            }
        }

        console.log("Gemini Response:", JSON.stringify(data, null, 2));

        // Extract response safely
        let answer = data?.candidates?.[0]?.content?.parts?.[0]?.text || 
                     "Sorry, I am currently unable to respond.";

        // 4. Cleaned up response format (still mimics the original structure)
        res.json({ choices: [{ message: { content: answer } }] });
    } catch (err) {
        console.error("Internal Server Error:", err);
        res.status(500).json({ error: 'Server error: Failed to fetch from external API.' });
    }
});

const port = 3001;
app.listen(port, () => {
    console.log(`✅ Gemini chatbot proxy running at http://localhost:${port}`);
});