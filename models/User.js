const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, default: 1 }
});

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  name: { type: String, default: '' },
  contact: { type: String, default: '' },
  isAdmin: { type: Boolean, default: false },
  defaultAddress: {
    house: String,
    landmark: String,
    address: String,
    city: String,
    postalCode: String
  },
  cart: { type: [CartItemSchema], default: [] },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
