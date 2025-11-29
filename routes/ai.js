const express = require('express');
const router = express.Router();

// Basic AI generate endpoint. This will try to call an upstream Gemini REST endpoint if
// GEMINI_API_KEY is configured. If not configured or if the request fails, it returns
// a simple mocked response to keep the UI functional.

const GEMINI_KEY = process.env.GEMINI_API_KEY;

router.post('/generate', async (req, res) => {
  const { prompt, type } = req.body || {};
  if (!prompt) return res.status(400).json({ message: 'Missing prompt' });

  // If GEMINI key is not set, return a canned response
  if (!GEMINI_KEY) {
    return res.json({ text: `Mock response for prompt: ${prompt.substring(0, 120)}...` });
  }

  // Use Google Gemini API (gemini-pro model)
  try {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GEMINI_KEY}`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn('Gemini API call failed', response.status, errorText);
      return res.json({ text: `AI service temporarily unavailable. Please try again.` });
    }

    const data = await response.json();
    
    // Extract text from Gemini response
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
    
    return res.json({ text: generatedText });
  } catch (err) {
    console.error('AI generate error', err);
    return res.json({ text: `Mock response (error contacting AI): ${prompt.substring(0, 120)}...` });
  }
});

module.exports = router;
