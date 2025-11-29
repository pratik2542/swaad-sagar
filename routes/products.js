const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// list products
router.get('/', async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// get single
router.get('/:id', async (req, res) => {
  const p = await Product.findById(req.params.id);
  if(!p) return res.status(404).json({ message: 'Not found' });
  res.json(p);
});

// admin create
router.post('/', auth, admin, async (req, res) => {
  const product = await Product.create(req.body);
  res.json(product);
});

// admin update
router.put('/:id', auth, admin, async (req, res) => {
  const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

// admin delete
router.delete('/:id', auth, admin, async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;
