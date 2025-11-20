// index.js - Groq backend for Student Tutor AI

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // node-fetch@2

const app = express();

// --- CONFIG (.env se) ---
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const APP_SECRET = process.env.APP_SECRET || 'my_super_secret_value_ChangeMe';
const PORT = process.env.PORT || 8080;

if (!GROQ_API_KEY) {
  console.warn('⚠️ GROQ_API_KEY .env me missing hai!');
}

// CORS: sab origin allow (Android WebView = file://, null origin, etc.)
app.use(cors());
app.use(express.json());

// simple health check
app.get('/ping', (req, res) => {
  res.json({ ok: true, message: 'Backend running 👋' });
});

// --- MAIN ROUTE ---
app.post('/api/generate', async (req, res) => {
  try {
    // secret check
    const headerSecret = req.headers['x-app-secret'];
    if (headerSecret !== APP_SECRET) {
      console.warn('❌ Invalid APP_SECRET from client:', headerSecret);
      return res.status(401).json({ error: 'Invalid secret' });
    }

    const { prompt } = req.body || {};
    console.log('📩 Incoming prompt:', prompt);

    if (!prompt) {
      return res.status(400).json({ error: 'prompt is required' });
    }

    // --- Groq OpenAI-style call ---
    const url = 'https://api.groq.com/openai/v1/chat/completions';

    const body = {
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'You are a helpful tutor AI.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 512,
    };

    const groqRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!groqRes.ok) {
      const text = await groqRes.text();
      console.error('❌ Groq error:', groqRes.status, text);
      return res
        .status(500)
        .json({ error: 'Groq API error', detail: text });
    }

    const data = await groqRes.json();
    const answer =
      data.choices?.[0]?.message?.content ||
      'Sorry, I could not generate an answer.';

    console.log('✅ Sending answer back to client');
    res.json({ text: answer });
  } catch (err) {
    console.error('🔥 Backend exception:', err);
    res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
});

// --- START SERVER ---
// 0.0.0.0 = har interface (wifi IP, localhost sab)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
