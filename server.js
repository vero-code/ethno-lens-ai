// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const systemPrompt = `
        You are a cultural design advisor helping graphic designers identify potential cultural sensitivities 
        or issues in visual designs across different countries.
        
        Please analyze the following design concept. Answer very briefly.
        
        Are there any cultural, ethical, or symbolic concerns associated with this concept in the given cultural context? 
        If yes, explain why and suggest appropriate alternatives. Be precise but concise.
    `;

app.post("/analyze", async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
    }

    const fullPrompt = `${systemPrompt}\n\nDesign: "${prompt}"`;

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

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
