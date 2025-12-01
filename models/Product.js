const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  unit: { type: String, default: 'gm' }, // gm, kg, ml, l, pack, pc
  quantityValue: { type: Number, default: 0 },
  imageUrl: { type: String, default: '' }, // Now stores base64 data URI (e.g., data:image/png;base64,...)
  category: { type: String, default: 'General' },
  keywords: { type: [String], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
