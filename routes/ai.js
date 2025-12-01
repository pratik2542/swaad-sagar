const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// Basic AI generate endpoint. This will try to call an upstream Gemini REST endpoint if
// GEMINI_API_KEY is configured. If not configured or if the request fails, it returns
// a simple mocked response to keep the UI functional.

const GEMINI_KEY = process.env.GEMINI_API_KEY;

router.post('/analytics-chat', auth, admin, async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ message: 'Missing question' });

  if (!GEMINI_KEY) {
    return res.json({ answer: "AI is not configured (missing API key)." });
  }

  try {
    // 1. Gather Context Data
    const [
      totalOrders,
      totalRevenueResult,
      lowStockProducts,
      topSellingProducts,
      recentOrders
    ] = await Promise.all([
      Order.countDocuments(),
      Order.aggregate([{ $group: { _id: null, total: { $sum: "$totalAmount" } } }]),
      Product.find({ stock: { $lte: 10 } }).select('name stock').limit(10),
      Order.aggregate([
        { $unwind: "$items" },
        { $group: { _id: "$items.productId", name: { $first: "$items.name" }, sold: { $sum: "$items.quantity" } } },
        { $sort: { sold: -1 } },
        { $limit: 5 }
      ]),
      Order.find().sort({ createdAt: -1 }).limit(5).select('status totalAmount createdAt shippingAddress.name')
    ]);

    const totalRevenue = totalRevenueResult[0]?.total || 0;

    const contextData = {
      summary: {
        totalOrders,
        totalRevenue,
        lowStockCount: lowStockProducts.length
      },
      lowStockItems: lowStockProducts.map(p => `${p.name} (${p.stock})`),
      topProducts: topSellingProducts.map(p => `${p.name} (${p.sold} sold)`),
      recentOrders: recentOrders.map(o => `Order by ${o.shippingAddress?.name || 'Unknown'} for ₹${o.totalAmount} (${o.status})`)
    };

    const prompt = `
      You are an intelligent data analyst for "Swaad Sagar", an Indian snack shop.
      Here is the current business data:
      ${JSON.stringify(contextData, null, 2)}

      User Question: "${question}"

      Answer the user's question concisely and professionally based ONLY on the data provided above.
      If the answer cannot be derived from the data, say so politely.
      Do not make up data.
      Format the answer in Markdown if needed (e.g. bold for numbers).
    `;

    // 2. Call Gemini
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Gemini API Error Body:', errorBody);
      throw new Error(`Gemini API error: ${response.status} - ${errorBody}`);
    }

    const data = await response.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate an answer.";

    res.json({ answer });

  } catch (err) {
    console.error('Analytics chat error details:', err);
    res.status(500).json({ message: 'Failed to process question', error: err.message });
  }
});

router.post('/generate', async (req, res) => {
  const { prompt, type } = req.body || {};
  if (!prompt) return res.status(400).json({ message: 'Missing prompt' });

  // If GEMINI key is not set, return a canned response
  if (!GEMINI_KEY) {
    return res.json({ text: `Mock response for prompt: ${prompt.substring(0, 120)}...` });
  }

  // Use Google Gemini API (gemini-2.0-flash model)
  try {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;
    
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
