const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

router.get('/', auth, async (req, res) => {
  const user = await User.findById(req.user.id).populate('cart.productId');
  res.json(user.cart || []);
});

router.post('/', auth, async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const user = await User.findById(req.user.id);
  const item = user.cart.find(i => i.productId.toString() === productId);
  if (item) {
    item.quantity += quantity;
  } else {
    user.cart.push({ productId, quantity });
  }
  await user.save();
  res.json(user.cart);
});

router.put('/:productId', auth, async (req, res) => {
  const { quantity } = req.body;
  const user = await User.findById(req.user.id);
  const idx = user.cart.findIndex(i => i.productId.toString() === req.params.productId);
  if (idx === -1) return res.status(404).json({ message: 'Item not found' });
  user.cart[idx].quantity = quantity;
  await user.save();
  res.json(user.cart);
});

router.delete('/:productId', auth, async (req, res) => {
  const user = await User.findById(req.user.id);
  user.cart = user.cart.filter(i => i.productId.toString() !== req.params.productId);
  await user.save();
  res.json({ success: true });
});

module.exports = router;
