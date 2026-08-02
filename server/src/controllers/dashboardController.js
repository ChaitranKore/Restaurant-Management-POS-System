const asyncHandler = require('../utils/asyncHandler');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const MenuItem = require('../models/MenuItem');

// @route GET /api/dashboard/stats  (admin)
const getStats = asyncHandler(async (req, res) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [todayOrders, activeOrders, revenueAgg, paymentMethodAgg, topItems] = await Promise.all([
    Order.countDocuments({ createdAt: { $gte: startOfToday } }),
    Order.countDocuments({ status: { $in: ['pending', 'confirmed', 'preparing', 'ready'] } }),
    Payment.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: startOfToday } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Payment.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: startOfToday } } },
      { $group: { _id: '$method', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: startOfToday } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.name', quantity: { $sum: '$items.quantity' } } },
      { $sort: { quantity: -1 } },
      { $limit: 5 },
    ]),
  ]);

  res.json({
    todayOrders,
    activeOrders,
    todayRevenue: revenueAgg[0]?.total || 0,
    todayPaymentsCount: revenueAgg[0]?.count || 0,
    paymentBreakdown: paymentMethodAgg,
    topItemsToday: topItems,
    totalMenuItems: await MenuItem.countDocuments(),
  });
});

module.exports = { getStats };
