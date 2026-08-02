const asyncHandler = require('../utils/asyncHandler');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');
const generateOrderNumber = require('../utils/orderNumber');
const { emitToKitchen, emitOrderUpdate } = require('../sockets');

const TAX_RATE = 0.05;

// @route POST /api/orders
// @access customer (own order) or staff/admin (order taken on behalf of a walk-in/table)
const createOrder = asyncHandler(async (req, res) => {
  const { items, table, orderType, guestName, notes } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Order must contain at least one item' });
  }

  // Never trust client-supplied prices — re-price every line from the menu.
  const menuIds = items.map((i) => i.menuItem);
  const menuItems = await MenuItem.find({ _id: { $in: menuIds } });
  const menuById = new Map(menuItems.map((m) => [String(m._id), m]));

  const orderItems = [];
  let subtotal = 0;

  for (const line of items) {
    const menuItem = menuById.get(String(line.menuItem));
    if (!menuItem) {
      return res.status(400).json({ message: `Menu item ${line.menuItem} not found` });
    }
    if (!menuItem.isAvailable) {
      return res.status(400).json({ message: `${menuItem.name} is currently unavailable` });
    }
    const quantity = Math.max(1, parseInt(line.quantity, 10) || 1);
    subtotal += menuItem.price * quantity;
    orderItems.push({
      menuItem: menuItem._id,
      name: menuItem.name,
      price: menuItem.price,
      quantity,
      notes: line.notes || '',
    });
  }

  let tableDoc = null;
  if (table) {
    tableDoc = await Table.findById(table);
    if (!tableDoc) return res.status(400).json({ message: 'Table not found' });
  }

  const tax = Number((subtotal * TAX_RATE).toFixed(2));
  const grandTotal = Number((subtotal + tax).toFixed(2));

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    customer: req.user.role === 'customer' ? req.user._id : undefined,
    guestName: req.user.role !== 'customer' ? guestName || '' : '',
    table: tableDoc ? tableDoc._id : undefined,
    orderType: orderType === 'takeaway' ? 'takeaway' : 'dine-in',
    items: orderItems,
    subtotal,
    taxRate: TAX_RATE,
    tax,
    grandTotal,
    createdBy: req.user._id,
    notes: notes || '',
    statusHistory: [{ status: 'pending', by: req.user._id }],
  });

  if (tableDoc && order.orderType === 'dine-in') {
    tableDoc.status = 'occupied';
    await tableDoc.save();
  }

  const populated = await order.populate('table', 'number');

  // Real-time kitchen order routing: push the new order straight to the KDS/admin views.
  emitToKitchen('order:new', populated);

  res.status(201).json(populated);
});

// @route GET /api/orders  (staff/admin — all orders, optionally filtered by status)
const listOrders = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const orders = await Order.find(filter)
    .populate('table', 'number')
    .populate('customer', 'name email')
    .sort({ createdAt: -1 })
    .limit(200);
  res.json(orders);
});

// @route GET /api/orders/my  (customer — their own order history)
const listMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ customer: req.user._id })
    .populate('table', 'number')
    .sort({ createdAt: -1 });
  res.json(orders);
});

// @route GET /api/orders/:id
const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('table', 'number')
    .populate('customer', 'name email');
  if (!order) return res.status(404).json({ message: 'Order not found' });

  const isOwner = order.customer && String(order.customer._id) === String(req.user._id);
  const isStaff = ['admin', 'staff'].includes(req.user.role);
  if (!isOwner && !isStaff) {
    return res.status(403).json({ message: 'Not authorized to view this order' });
  }

  res.json(order);
});

const VALID_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['served'],
  served: ['completed'],
  completed: [],
  cancelled: [],
};

// @route PATCH /api/orders/:id/status  (staff/admin)
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  const allowed = VALID_TRANSITIONS[order.status] || [];
  if (!allowed.includes(status)) {
    return res.status(400).json({
      message: `Cannot move order from '${order.status}' to '${status}'`,
    });
  }

  order.status = status;
  order.statusHistory.push({ status, by: req.user._id });
  await order.save();

  if (status === 'completed' && order.table) {
    await Table.findByIdAndUpdate(order.table, { status: 'available' });
  }

  const populated = await order.populate('table', 'number');

  // Broadcast to kitchen/admin displays and to the customer tracking their order.
  emitOrderUpdate(populated);

  res.json(populated);
});

module.exports = { createOrder, listOrders, listMyOrders, getOrder, updateOrderStatus };
