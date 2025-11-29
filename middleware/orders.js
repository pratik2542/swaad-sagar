const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const mongoose = require('mongoose');

// Place order
router.post('/', auth, async (req, res) => {
  const { shippingAddress } = req.body;
  const userId = req.user.id;

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const user = await User.findById(userId).session(session).populate('cart.productId');
    if (!user || user.cart.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Cart empty' });
    }

    // Validate stock and reduce
    let total = 0;
    const items = [];
    for (const cartItem of user.cart) {
      const product = await Product.findById(cartItem.productId._id).session(session);
      if (!product || product.stock < cartItem.quantity) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: `Not enough stock for ${cartItem.productId.name}` });
      }
      product.stock -= cartItem.quantity;
      await product.save({ session });
      items.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: cartItem.quantity
      });
      total += product.price * cartItem.quantity;
    }

    // Create order
    const order = await Order.create([{
      userId,
      items,
      totalAmount: total,
      shippingAddress,
      status: 'Placed'
    }], { session });

    // Clear cart
    user.cart = [];
    await user.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json(order[0]);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's orders
router.get('/', auth, async (req, res) => {
  const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json(orders);
});

module.exports = router;