const crypto = require('crypto');
const asyncHandler = require('../utils/asyncHandler');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const { emitOrderUpdate } = require('../sockets');

// Simulated card processor. In production this would call out to a real gateway
// (Stripe, Braintree, etc.) — kept as a pure/local function so the rest of the
// payment flow (order updates, receipts, sockets) doesn't need to change when a
// real gateway is wired in.
function processCardPayment({ cardNumber, expiry, cvv }) {
  if (!cardNumber || !expiry || !cvv) {
    return { approved: false, reason: 'Missing card details' };
  }
  const digitsOnly = cardNumber.replace(/\s+/g, '');
  if (!/^\d{12,19}$/.test(digitsOnly)) {
    return { approved: false, reason: 'Invalid card number' };
  }
  // Simulated decline for a well-known "always declines" test number.
  if (digitsOnly === '0000000000000000') {
    return { approved: false, reason: 'Card declined' };
  }
  return {
    approved: true,
    last4: digitsOnly.slice(-4),
    brand: digitsOnly.startsWith('4') ? 'Visa' : digitsOnly.startsWith('5') ? 'Mastercard' : 'Card',
    transactionId: `CARD-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
  };
}

// @route POST /api/payments  (staff/admin process cash, or customer/staff pays by card)
const createPayment = asyncHandler(async (req, res) => {
  const { orderId, method, cardNumber, expiry, cvv, tenderedAmount } = req.body;

  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (order.paymentStatus === 'paid') {
    return res.status(400).json({ message: 'Order has already been paid' });
  }
  if (!['cash', 'card'].includes(method)) {
    return res.status(400).json({ message: "method must be 'cash' or 'card'" });
  }

  let payment;

  if (method === 'card') {
    const result = processCardPayment({ cardNumber, expiry, cvv });
    if (!result.approved) {
      payment = await Payment.create({
        order: order._id,
        method: 'card',
        amount: order.grandTotal,
        status: 'failed',
        transactionId: `CARD-FAIL-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
        processedBy: req.user._id,
      });
      return res.status(402).json({ message: result.reason, payment });
    }

    payment = await Payment.create({
      order: order._id,
      method: 'card',
      amount: order.grandTotal,
      status: 'completed',
      transactionId: result.transactionId,
      cardBrand: result.brand,
      cardLast4: result.last4,
      processedBy: req.user._id,
    });
  } else {
    const tendered = Number(tenderedAmount);
    if (!tendered || tendered < order.grandTotal) {
      return res.status(400).json({ message: 'Tendered cash amount is less than the order total' });
    }
    payment = await Payment.create({
      order: order._id,
      method: 'cash',
      amount: order.grandTotal,
      status: 'completed',
      transactionId: `CASH-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
      tenderedAmount: tendered,
      changeDue: Number((tendered - order.grandTotal).toFixed(2)),
      processedBy: req.user._id,
    });
  }

  order.payment = payment._id;
  order.paymentStatus = 'paid';
  await order.save();

  const populated = await order.populate('table', 'number');
  emitOrderUpdate(populated);

  res.status(201).json({ payment, order: populated });
});

// @route GET /api/payments  (admin — payment history / reconciliation)
const listPayments = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.method) filter.method = req.query.method;
  if (req.query.status) filter.status = req.query.status;
  const payments = await Payment.find(filter)
    .populate({ path: 'order', select: 'orderNumber grandTotal' })
    .sort({ createdAt: -1 })
    .limit(200);
  res.json(payments);
});

module.exports = { createPayment, listPayments };
