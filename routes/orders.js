const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const mongoose = require('mongoose');

router.post('/', auth, async (req, res) => {
  const { shippingAddress } = req.body;
  // normalize user id from token (handle cases where payload uses id, _id, or weird object shapes)
  const rawUserId = (req.user && (req.user.id || req.user._id || req.user.userId)) || null;
  if (!rawUserId) {
    console.error('Place order: missing user id in token payload', req.user);
    return res.status(401).json({ message: 'Unauthorized' });
  }

  let userObjectId = null;
  try {
    userObjectId = mongoose.Types.ObjectId(String(rawUserId));
  } catch (e) {
    // don't fail hard here — some tokens may have non-ObjectId ids (or unexpected formats)
    console.warn('Place order: unable to coerce token id to ObjectId, will try raw id. id=', String(rawUserId), 'type=', typeof rawUserId);
    userObjectId = null;
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // try to find the user using the normalized ObjectId when possible, otherwise use the raw id
    const findBy = userObjectId || String(rawUserId);
    const user = await User.findById(findBy).session(session).populate('cart.productId');
    if (!user || user.cart.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Cart empty' });
    }

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
      items.push({ productId: product._id, name: product.name, price: product.price, quantity: cartItem.quantity });
      total += product.price * cartItem.quantity;
    }

    const orderUserId = userObjectId || String(rawUserId);
    const order = await Order.create([{
      userId: orderUserId,
      items,
      totalAmount: total,
      shippingAddress,
      status: 'Placed'
    }], { session });

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

router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    let userObjectId = null;
    try { userObjectId = mongoose.Types.ObjectId(userId); } catch (e) { userObjectId = null; }
    // build query to match ObjectId when possible, otherwise fall back to raw id
    const query = userObjectId ? { $or: [{ userId: userObjectId }, { userId: userId }] } : { userId: userId };
    const orders = await Order.find(query).sort({ createdAt: -1 }).populate('statusHistory.updatedBy', 'name email').lean();
    console.debug('GET /orders: found', orders.length, 'orders for userId', userId, 'objectIdPresent=', !!userObjectId);
    return res.json(orders);
  } catch (err) {
    console.error('Failed to fetch orders for user', req.user && req.user.id, err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Allow user to cancel their own order until it's shipped
router.put('/:id/cancel', auth, async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body || {};
  const rawUserId = (req.user && (req.user.id || req.user._id || req.user.userId)) || null;
  let userObjectId = null;
  try { userObjectId = mongoose.Types.ObjectId(String(rawUserId)); } catch (e) { userObjectId = null; }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const order = await Order.findById(id).session(session);
    if (!order) { await session.abortTransaction(); session.endSession(); return res.status(404).json({ message: 'Order not found' }); }

    // check ownership (or admin)
    const isOwner = (userObjectId && order.userId && order.userId.equals && order.userId.equals(userObjectId)) || (String(order.userId) === String(rawUserId));
    if (!isOwner && !req.user.isAdmin) {
      await session.abortTransaction(); session.endSession();
      return res.status(403).json({ message: 'Forbidden' });
    }

    // disallow cancelling after shipped/delivered or already cancelled
    const forbiddenStatuses = ['Shipped', 'Delivered', 'Cancelled'];
    if (forbiddenStatuses.includes(order.status)) {
      await session.abortTransaction(); session.endSession();
      return res.status(400).json({ message: `Cannot cancel order with status ${order.status}` });
    }

    // restore product stock
    for (const item of order.items || []) {
      try {
        const product = await Product.findById(item.productId).session(session);
        if (product) {
          product.stock = (product.stock || 0) + (item.quantity || 0);
          await product.save({ session });
        }
      } catch (e) {
        console.warn('Failed to restore stock for product', item.productId, e);
        // continue restoring other items
      }
    }

    // append history and set status
    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({ status: 'Cancelled', reason: reason || 'Cancelled by user', updatedBy: userObjectId || String(rawUserId), updatedAt: new Date() });
    order.status = 'Cancelled';
    if (reason) order.userReason = reason;
    await order.save({ session });

    await session.commitTransaction();
    session.endSession();
    return res.json({ success: true, order });
  } catch (err) {
    await session.abortTransaction(); session.endSession();
    console.error('Cancel order failed', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
