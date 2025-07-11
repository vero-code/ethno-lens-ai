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

    const { country, businessType } = req.body;

    if (!country || !businessType) {
        return res.status(400).json({ error: "Country and business type are required." });
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
