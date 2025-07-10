// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import { GoogleGenerativeAI } from "@google/generative-ai";
import multer from "multer";

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const personaPrompt = `You are a Senior Cultural Inclusivity & Design Ethics Specialist at a global creative agency. Your expertise lies in ensuring visual materials are impeccably inclusive and free from cultural insensitivity. You proactively identify inappropriate elements and propose constructive solutions for global brand perception.`;

const upload = multer({ storage: multer.memoryStorage() });

app.post("/analyze", async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
    }

    const fullPrompt = `${personaPrompt}\n\n ${prompt}`;
    console.log(fullPrompt);

    try {
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();
        res.json({ result: text });
    } catch (err) {
        console.error("Error from Gemini:", err);
        res.status(500).json({ error: "Failed to generate content" });
    }
});

app.post("/analyze-image", upload.single("image"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No image uploaded" });
    }

    const base64Image = req.file.buffer.toString("base64");
    const promptText = `${personaPrompt}\n\nThe user uploaded an image. Analyze it for potential cultural, symbolic or ethical issues that might arise in different countries or business contexts.`;

    const parts = [
        promptText,
        {
            inlineData: {
                mimeType: req.file.mimetype,
                data: base64Image
            }
        }
    ];

    console.log(promptText);

    try {
        const result = await model.generateContent(parts);
        const text = result.response.text();
        res.json({ result: text });
    } catch (err) {
        console.error("Gemini image error:", err);
        res.status(500).json({ error: "Failed to analyze image" });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
