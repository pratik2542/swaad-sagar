const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const mongoose = require('mongoose');

router.get('/products', auth, admin, async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

router.get('/orders', auth, admin, async (req, res) => {
  try {
    const { status, q, from, to } = req.query;
    const query = {};
    if (status) query.status = status;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    // handle search q: try email -> userId, or ObjectId match against order _id or userId
    if (q) {
      const trimmed = q.trim();
      console.log(`Search query: "${q}" (trimmed: "${trimmed}")`);
      // if it looks like an email, try case-insensitive lookup
      if (trimmed.includes('@')) {
        const user = await User.findOne({ email: { $regex: `^${trimmed}$`, $options: 'i' } }).select('_id').lean();
        if (user) {
          query.userId = user._id;
        } else {
          // no exact email match; fallback will be handled by query builder
        }
      } else if (/^[0-9a-fA-F]{24}$/.test(trimmed)) {
        // exact ObjectId match for order id or userId
        try {
          const objId = mongoose.Types.ObjectId(trimmed);
          query.$or = [{ _id: objId }, { userId: objId }];
        } catch (e) {
          // ignore
        }
      }
      // For partial matches, we'll use the query builder below
    }
    // debug: print query so admins can see how search was interpreted
    console.debug('Admin orders query:', JSON.stringify(query));
    let orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email contact')
      .populate('items.productId', 'imageUrl')
      .populate('statusHistory.updatedBy', 'name email')
      .lean();

    // Apply additional filtering if q is provided and not already handled
    if (q) {
      const trimmed = q.trim();
      if (!trimmed.includes('@') && !/^[0-9a-fA-F]{24}$/.test(trimmed)) {
        // Partial search - filter results client-side for now
        orders = orders.filter(order => {
          const idMatch = String(order._id).toLowerCase().startsWith(trimmed.toLowerCase());
          const nameMatch = (order.shippingAddress?.name || '').toLowerCase().includes(trimmed.toLowerCase());
          const itemMatch = (order.items || []).some(item => (item.name || '').toLowerCase().includes(trimmed.toLowerCase()));
          return idMatch || nameMatch || itemMatch;
        });
      }
    }

    // orders = orders.lean();

    // Print all order IDs for debugging
    console.log('All order IDs:');
    orders.forEach(order => {
      console.log(`Order ID: ${order._id} (short: ${String(order._id).slice(0,8)})`);
    });

    res.json(orders);
  } catch (err) {
    console.error('Admin get orders failed', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Debug helper: show recent orders with raw userId and its JS type - admin only
router.get('/debug-orders', auth, admin, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).limit(50).lean();
    const simplified = orders.map(o => ({
      _id: o._id,
      userIdValue: o.userId,
      userIdType: typeof o.userId,
      createdAt: o.createdAt,
      itemsCount: (o.items || []).length,
      totalAmount: o.totalAmount
    }));
    res.json(simplified);
  } catch (err) {
    console.error('debug-orders failed', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: update order status with optional reason
router.put('/orders/:id', auth, admin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminReason } = req.body;
    if (!status) return res.status(400).json({ message: 'Status is required' });
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Prevent updates on cancelled or delivered orders
    if (order.status === 'Cancelled' || order.status === 'Delivered') {
      return res.status(400).json({ message: 'Cannot update a completed order' });
    }

    // Update status and admin reason (admin cannot modify user reason)
    order.status = status;
    if (adminReason !== undefined) {
      order.adminReason = adminReason;
    }

    // Add to status history
    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({
      status,
      reason: adminReason || '',
      updatedBy: req.user.id,
      updatedAt: new Date()
    });

    await order.save();

    res.json({ success: true, order });
  } catch (err) {
    console.error('Admin update order failed', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/analytics', auth, admin, async (req, res) => {
  try {
    // Get all orders with populated data
    const orders = await Order.find().populate('userId', 'name email').populate('items.productId', 'name category imageUrl').lean();

    // Calculate basic metrics
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const totalOrders = orders.length;
    const uniqueCustomers = new Set(orders.map(order => order.userId?._id?.toString()).filter(Boolean)).size;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Repeat customers analysis
    const customerOrderCounts = {};
    orders.forEach(order => {
      if (order.userId) {
        const customerId = order.userId._id.toString();
        if (!customerOrderCounts[customerId]) {
          customerOrderCounts[customerId] = {
            customer: order.userId,
            orders: [],
            totalSpent: 0
          };
        }
        customerOrderCounts[customerId].orders.push(order);
        customerOrderCounts[customerId].totalSpent += order.totalAmount || 0;
      }
    });

    const repeatCustomers = Object.values(customerOrderCounts)
      .filter(customer => customer.orders.length > 1)
      .map(customer => ({
        name: customer.customer.name,
        email: customer.customer.email,
        orderCount: customer.orders.length,
        totalSpent: customer.totalSpent,
        lastOrder: Math.max(...customer.orders.map(o => new Date(o.createdAt)))
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10); // Top 10 repeat customers

    // Category analytics
    const categoryStats = {};
    orders.forEach(order => {
      order.items?.forEach(item => {
        const category = item.productId?.category || 'Uncategorized';
        if (!categoryStats[category]) {
          categoryStats[category] = {
            category,
            revenue: 0,
            orderCount: 0,
            itemsSold: 0
          };
        }
        categoryStats[category].revenue += (item.price * item.quantity) || 0;
        categoryStats[category].itemsSold += item.quantity || 0;
      });
    });

    // Count orders per category
    orders.forEach(order => {
      const categoriesInOrder = new Set(order.items?.map(item => item.productId?.category || 'Uncategorized').filter(Boolean));
      categoriesInOrder.forEach(category => {
        if (categoryStats[category]) {
          categoryStats[category].orderCount += 1;
        }
      });
    });

    const categoryAnalytics = Object.values(categoryStats)
      .sort((a, b) => b.revenue - a.revenue);

    // Top products
    const productStats = {};
    orders.forEach(order => {
      order.items?.forEach(item => {
        const productId = item.productId?._id?.toString();
        if (productId) {
          if (!productStats[productId]) {
            productStats[productId] = {
              id: productId,
              name: item.productId?.name || 'Unknown Product',
              category: item.productId?.category || 'Uncategorized',
              imageUrl: item.productId?.imageUrl,
              unitsSold: 0,
              revenue: 0
            };
          }
          productStats[productId].unitsSold += item.quantity || 0;
          productStats[productId].revenue += (item.price * item.quantity) || 0;
        }
      });
    });

    const topProducts = Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Status distribution
    const statusCounts = {};
    orders.forEach(order => {
      const status = order.status || 'Placed';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count
    }));

    // Monthly trends (last 12 months)
    const monthlyRevenue = {};
    const monthlyOrders = {};

    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      monthlyRevenue[monthKey] = 0;
      monthlyOrders[monthKey] = 0;
    }

    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const monthKey = orderDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

      if (monthlyRevenue.hasOwnProperty(monthKey)) {
        monthlyRevenue[monthKey] += order.totalAmount || 0;
        monthlyOrders[monthKey] += 1;
      }
    });

    const monthlyRevenueData = Object.entries(monthlyRevenue).map(([month, revenue]) => ({
      month,
      revenue
    }));

    const monthlyOrdersData = Object.entries(monthlyOrders).map(([month, count]) => ({
      month,
      count
    }));

    res.json({
      totalRevenue,
      totalOrders,
      uniqueCustomers,
      averageOrderValue,
      repeatCustomers,
      categoryAnalytics,
      topProducts,
      statusDistribution,
      monthlyRevenue: monthlyRevenueData,
      monthlyOrders: monthlyOrdersData
    });
  } catch (err) {
    console.error('Admin analytics failed', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
