const asyncHandler = require('../utils/asyncHandler');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const MenuItem = require('../models/MenuItem');

const DAY_MS = 24 * 60 * 60 * 1000;

/** Midnight local time, `daysAgo` days back. */
function startOfDay(daysAgo = 0) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setTime(date.getTime() - daysAgo * DAY_MS);
  return date;
}

/**
 * Aggregations are grouped in the restaurant's timezone rather than UTC. A
 * restaurant's "today" is the day its staff are working, and the dashboard is
 * read by people standing in that building — bucketing by UTC would push the
 * evening service into the wrong day for much of the world. Set TZ (or
 * RESTAURANT_TZ) on the server to match the venue; it otherwise falls back to
 * whatever the process is running in.
 */
const TIMEZONE = process.env.RESTAURANT_TZ || process.env.TZ || '';

/**
 * MongoDB's date operators return null if *any* argument is null, and the
 * driver serialises an explicit `undefined` as null. Passing
 * `timezone: undefined` therefore collapses every document into a single null
 * bucket instead of grouping by day — so the key has to be omitted entirely
 * when there's no timezone to apply.
 */
function withTimezone(args) {
  return TIMEZONE ? { ...args, timezone: TIMEZONE } : args;
}

function localDayExpr(field) {
  return { $dateToString: withTimezone({ format: '%Y-%m-%d', date: field }) };
}

/** The same day key as `localDayExpr`, computed in Node so the two can be joined. */
function localDayKey(date) {
  return date.toLocaleDateString('en-CA', TIMEZONE ? { timeZone: TIMEZONE } : undefined);
}

// @route GET /api/dashboard/stats  (admin + staff)
const getStats = asyncHandler(async (req, res) => {
  const startOfToday = startOfDay(0);
  const startOfYesterday = startOfDay(1);
  const startOfWindow = startOfDay(6); // today plus the previous 6 days

  const [
    todayOrders,
    yesterdayOrders,
    activeOrders,
    revenueAgg,
    yesterdayRevenueAgg,
    paymentMethodAgg,
    topItems,
    revenueSeriesAgg,
    ordersByHourAgg,
    statusBreakdown,
    totalMenuItems,
  ] = await Promise.all([
    Order.countDocuments({ createdAt: { $gte: startOfToday } }),
    Order.countDocuments({ createdAt: { $gte: startOfYesterday, $lt: startOfToday } }),
    Order.countDocuments({ status: { $in: ['pending', 'confirmed', 'preparing', 'ready'] } }),

    Payment.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: startOfToday } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Payment.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: startOfYesterday, $lt: startOfToday } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
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

    // Revenue per day for the last 7 days — the dashboard's trend chart.
    Payment.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: startOfWindow } } },
      {
        $group: {
          _id: localDayExpr('$createdAt'),
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // Orders per hour of the current service day — shows the rush.
    Order.aggregate([
      { $match: { createdAt: { $gte: startOfToday } } },
      {
        $group: {
          _id: { $hour: withTimezone({ date: '$createdAt' }) },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    Order.aggregate([
      { $match: { createdAt: { $gte: startOfToday } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),

    MenuItem.countDocuments(),
  ]);

  const todayRevenue = revenueAgg[0]?.total || 0;
  const yesterdayRevenue = yesterdayRevenueAgg[0]?.total || 0;

  // Zero-fill both series. A chart that silently omits quiet days implies the
  // restaurant was closed rather than merely slow, and the x-axis stops being
  // evenly spaced.
  const revenueByDay = Object.fromEntries(revenueSeriesAgg.map((d) => [d._id, d]));
  const revenueSeries = Array.from({ length: 7 }, (_, index) => {
    const date = startOfDay(6 - index);
    const key = localDayKey(date); // YYYY-MM-DD, matching $dateToString
    return {
      date: key,
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      total: revenueByDay[key]?.total ?? 0,
      count: revenueByDay[key]?.count ?? 0,
    };
  });

  const ordersByHourMap = Object.fromEntries(ordersByHourAgg.map((d) => [d._id, d.count]));
  // Restaurants don't trade at 4am; showing 24 near-empty bars wastes the chart.
  const ordersByHour = Array.from({ length: 17 }, (_, index) => {
    const hour = index + 7; // 07:00 through 23:00
    return { hour, label: `${((hour + 11) % 12) + 1}${hour < 12 ? 'a' : 'p'}`, count: ordersByHourMap[hour] ?? 0 };
  });

  res.json({
    todayOrders,
    yesterdayOrders,
    activeOrders,
    todayRevenue,
    yesterdayRevenue,
    todayPaymentsCount: revenueAgg[0]?.count || 0,
    paymentBreakdown: paymentMethodAgg,
    topItemsToday: topItems,
    revenueSeries,
    ordersByHour,
    statusBreakdown,
    totalMenuItems,
  });
});

module.exports = { getStats };
