const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: String,
  price: Number,
  quantity: Number
});

const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [OrderItemSchema],
  totalAmount: Number,
  shippingAddress: {
    name: String,
    house: String,
    landmark: String,
    address: String,
    city: String,
    postalCode: String
  },
  status: { type: String, default: 'Placed' },
  // Separate reasons for user and admin
  userReason: { type: String, default: '' }, // Reason provided by user when placing/cancelling order
  adminReason: { type: String, default: '' }, // Reason provided by admin when updating status
  // history of status changes with optional reasons and who updated
  statusHistory: [
    {
      status: String,
      reason: String,
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      updatedAt: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);
