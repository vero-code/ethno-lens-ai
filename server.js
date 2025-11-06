// server.js
import fs from 'fs';
import https from 'https';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import multer from 'multer';
import { supabase } from './src/db/client.js';
import {
  checkUserAccess,
  recordUserUsage,
  getUserUsage,
} from './src/db/limits.js';
import { createPendingOp, consumePendingOp } from './src/db/pendingOps.js';

dotenv.config();
const app = express();

const PORT = process.env.PORT || 3000;
const IS_RENDER = !!process.env.RENDER;
const LOCAL_HTTPS = process.env.LOCAL_HTTPS === 'true' && !IS_RENDER;

app.set('trust proxy', 1);
app.use((req, res, next) => {
  const origin = req.headers.origin;  
  const allowedOrigins = [
    'https://express.adobe.com',
    'https://new.express.adobe.com',
  ];
  
  const isAdobeAddons = origin && /^https:\/\/[a-z0-9]+\.wxp\.adobe-addons\.com$/.test(origin);
  const isLocalhost = origin && origin.startsWith('https://localhost:');
  const isNullOrigin = !origin || origin === 'null';
  
  if (isNullOrigin || allowedOrigins.includes(origin) || isAdobeAddons || isLocalhost) {
    res.header('Access-Control-Allow-Origin', origin && origin !== 'null' ? origin : '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');

    if (origin && origin !== 'null') { res.header('Access-Control-Allow-Credentials', 'true'); }
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    return next();
  }

  return res.status(403).json({ error: 'Origin not allowed' });
});

app.use(express.json({ limit: '10mb' }));

// --- Initializing clients ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// --- Constants ---
const personaPrompt = `You are a Senior Cultural Inclusivity & Design Ethics Specialist at a global creative agency. Your expertise lies in ensuring visual materials are impeccably inclusive and free from cultural insensitivity. You proactively identify inappropriate elements and propose constructive solutions for global brand perception.`;

const upload = multer({ storage: multer.memoryStorage() });

// --- Health & warmup ---
app.get('/healthz', (_req, res) => res.status(200).json({ ok: true }));
app.get('/warmup', (_req, res) => res.status(200).send('ok'));

app.get('/', (req, res) => {
  res.send('EthnoLens AI Server is running!');
});

app.get('/usage/:userId', async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const usage = await getUserUsage(supabase, userId);
    res.json(usage);
  } catch (err) {
    console.error('Error getting user usage:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- REQUEST HANDLERS ---
app.post('/analyze', async (req, res) => {
  const { prompt, userId } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
  if (!userId) return res.status(400).json({ error: 'User ID is required' });

  try {
    const limit = await checkUserAccess(supabase, userId);
    if (!limit.allowed) return res.status(429).json({ error: limit.message });

    const fullPrompt = `${personaPrompt}\n\n${prompt}\n\nFinally, on a new line at the very end, provide a "Cultural Sensitivity Score" from 0 (very high risk) to 100 (very low risk) based on your analysis. The line must start with "SCORE:" followed by the number. For example: SCORE: 85`;
    const result = await model.generateContent(fullPrompt);
    const text = await result.response.text();

    //const text = 'Test';
    //await new Promise(r => setTimeout(r, 5000));

    let analysisText = text;
    let score = null;
    const scoreMatch = text.match(/SCORE:\s*(\d+)/);
    if (scoreMatch && scoreMatch[1]) {
      score = parseInt(scoreMatch[1], 10);
      analysisText = text.replace(/SCORE:\s*(\d+)/, '').trim();
    }

    const opId = await createPendingOp(supabase, userId);

    return res.json({ result: analysisText, score, opId, usageCommitted: false });
  } catch (err) {
    console.error('Server error during /analyze:', err);
    if (!res.headersSent) return res.status(500).json({ error: 'An internal server error occurred.' });
  }
});

app.post('/analyze-image', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

  const { country, businessType, userId } = req.body;

  if (!country || !businessType)
    return res.status(400).json({ error: 'Country and business type are required.' });
  if (!userId) return res.status(400).json({ error: 'User ID is required.' });

  try {
    const limit = await checkUserAccess(supabase, userId);
    if (!limit.allowed)return res.status(429).json({ error: limit.message });

    const base64Image = req.file.buffer.toString('base64');
    const promptText = `${personaPrompt}\n\nAnalyze the provided image for potential cultural, symbolic or ethical issues. This image is intended for ${country} with a business type of "${businessType}". Identify any culturally insensitive or inappropriate elements and suggest changes to promote inclusive visual solutions suitable for a diverse international audience, with a focus on cultural appropriateness for ${country}. In the first sentence, give a short answer whether this element should be used in the selected country.`;

    const parts = [
      promptText,
      {
        inlineData: {
          mimeType: req.file.mimetype,
          data: base64Image,
        },
      },
    ];

    const result = await model.generateContent(parts);
    const text = await result.response.text();
    //const text = 'Test';
    //await new Promise(r => setTimeout(r, 5000));

    const opId = await createPendingOp(supabase, userId);

    return res.json({ result: text, opId, usageCommitted: false });
  } catch (err) {
    console.error('Server error during image analysis:', err);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
});

app.post('/log-premium-click', async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const { error } = await supabase
      .from('premium_interest_clicks')
      .insert([{ user_id: userId }]);

    if (error) throw error;

    res.status(200).json({ message: 'Click logged successfully' });
  } catch (err) {
    console.error('Error logging premium click:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/usage/confirm', async (req, res) => {
  const { userId, opId } = req.body || {};
  if (!userId || !opId) return res.status(400).json({ error: 'userId and opId are required' });

  try {
    const limitSnapshot = await checkUserAccess(supabase, userId);

    await consumePendingOp(supabase, userId, opId, limitSnapshot, recordUserUsage);

    return res.json({ ok: true });
  } catch (e) {
    console.error('Confirmation error:', e);
    return res.status(404).json({ error: 'Operation not found or expired' });
  }
});

function startServer() {
  if (LOCAL_HTTPS) {
    const keyPath = './localhost-key.pem';
    const certPath = './localhost.pem';

    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      const key  = fs.readFileSync(keyPath);
      const cert = fs.readFileSync(certPath);
      https.createServer({ key, cert }, app).listen(PORT, () => {
        console.log(`API listening (LOCAL HTTPS) on https://localhost:${PORT}`);
      });
      return;
    } else {
      console.warn('[WARN] LOCAL_HTTPS=true, but no local certificates were found. Falling back to HTTP.');
    }
  }

  app.listen(PORT, () => {
    console.log(`API listening on http://0.0.0.0:${PORT} (HTTP${IS_RENDER ? ' via Render proxy TLS' : ''})`);
  });
}

startServer();
