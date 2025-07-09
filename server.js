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
    console.log("-> /analyze-image: Request received.");

    if (!req.file) {
        console.log("-> /analyze-image: No file uploaded.");
        return res.status(400).json({ error: "No image uploaded" });
    }

    console.log("-> /analyze-image: File received. Name:", req.file.originalname, "MIME:", req.file.mimetype, "Size:", req.file.size);

    const base64Image = req.file.buffer.toString("base64");
    console.log("-> /analyze-image: Image converted to Base64.");

    const parts = [
        `${personaPrompt}\n\nThe user uploaded an image. Analyze it for potential cultural, symbolic or ethical issues that might arise in different countries or business contexts.`,
        {
            inlineData: {
                mimeType: req.file.mimetype,
                data: base64Image
            }
        }
    ];

    try {
        console.log("-> /analyze-image: Sending request to Gemini for image analysis.");
        const result = await model.generateContent(parts);
        const text = result.response.text();
        console.log("<- /analyze-image: Received response from Gemini. Sending to client.");
        res.json({ result: text });
    } catch (err) {
        console.error("Gemini image error:", err);
        res.status(500).json({ error: "Failed to analyze image" });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
