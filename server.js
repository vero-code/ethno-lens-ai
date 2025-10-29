// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import multer from "multer";
import { supabase } from './src/db/client.js';
import { checkUserLimit, getUserUsage } from './src/db/limits.js';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// --- Initializing clients ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// --- Constants ---
const personaPrompt = `You are a Senior Cultural Inclusivity & Design Ethics Specialist at a global creative agency. Your expertise lies in ensuring visual materials are impeccably inclusive and free from cultural insensitivity. You proactively identify inappropriate elements and propose constructive solutions for global brand perception.`;

const upload = multer({ storage: multer.memoryStorage() });

app.get("/", (req, res) => {
    res.send("EthnoLens AI Server is running!");
});

app.get("/usage/:userId", async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
    }

    try {
        const usage = await getUserUsage(supabase, userId);
        res.json(usage);
    } catch (err) {
        console.error("Error getting user usage:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// --- REQUEST HANDLERS ---
app.post("/analyze", async (req, res) => {
    const { prompt, userId } = req.body;

    if (!prompt) return res.status(400).json({ error: "Prompt is required" });
    if (!userId) return res.status(400).json({ error: "User ID is required" });

    try {
        const limitCheck = await checkUserLimit(supabase, userId);
        if (!limitCheck.allowed) {
            return res.status(429).json({ error: limitCheck.message });
        }

        const fullPrompt = `${personaPrompt}\n\n${prompt}\n\nFinally, on a new line at the very end, provide a "Cultural Sensitivity Score" from 0 (very high risk) to 100 (very low risk) based on your analysis. The line must start with "SCORE:" followed by the number. For example: SCORE: 85`;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();

        let analysisText = text;
        let score = null;
        const scoreMatch = text.match(/SCORE:\s*(\d+)/);
        if (scoreMatch && scoreMatch[1]) {
            score = parseInt(scoreMatch[1], 10);
            analysisText = text.replace(/SCORE:\s*(\d+)/, "").trim();
        }

        res.json({ result: analysisText, score: score });
    } catch (err) {
        console.error("Server error during text analysis:", err);
        res.status(500).json({ error: "An internal server error occurred." });
    }
});

app.post("/analyze-image", upload.single("image"), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No image uploaded" });

    const { country, businessType, userId } = req.body;

    if (!country || !businessType) return res.status(400).json({ error: "Country and business type are required." });
    if (!userId) return res.status(400).json({ error: "User ID is required." });

    try {
        const limitCheck = await checkUserLimit(supabase, userId);
        if (!limitCheck.allowed) {
            return res.status(429).json({ error: limitCheck.message });
        }

        const base64Image = req.file.buffer.toString("base64");
        const promptText = `${personaPrompt}\n\nAnalyze the provided image for potential cultural, symbolic or ethical issues. This image is intended for ${country} with a business type of "${businessType}". Identify any culturally insensitive or inappropriate elements and suggest changes to promote inclusive visual solutions suitable for a diverse international audience, with a focus on cultural appropriateness for ${country}. In the first sentence, give a short answer whether this element should be used in the selected country.`;

        const parts = [
            promptText,
            {
                inlineData: {
                    mimeType: req.file.mimetype,
                    data: base64Image
                }
            }
        ];

        const result = await model.generateContent(parts);
        const text = result.response.text();
        res.json({ result: text });
    } catch (err) {
        console.error("Server error during image analysis:", err);
        res.status(500).json({ error: "An internal server error occurred." });
    }
});

app.post("/log-premium-click", async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
    }

    try {
        const { error } = await supabase
            .from('premium_interest_clicks')
            .insert([{ user_id: userId }]);

        if (error) throw error;

        res.status(200).json({ message: "Click logged successfully" });
    } catch (err) {
        console.error("Error logging premium click:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});