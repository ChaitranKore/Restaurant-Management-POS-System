const mongoose = require('mongoose');

const ORDER_STATUSES = [
  'pending', // just placed, awaiting kitchen confirmation
  'confirmed', // accepted by staff, routed to kitchen
  'preparing', // kitchen is cooking
  'ready', // ready to be served/picked up
  'served', // delivered to customer/table
  'completed', // fully closed out (paid + served)
  'cancelled',
];

const orderItemSchema = new mongoose.Schema(
  {
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    notes: { type: String, default: '' },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    at: { type: Date, default: Date.now },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    guestName: { type: String, default: '' },
    table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table' },
    orderType: { type: String, enum: ['dine-in', 'takeaway'], default: 'dine-in' },
    items: { type: [orderItemSchema], required: true, validate: (v) => v.length > 0 },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending' },
    statusHistory: { type: [statusHistorySchema], default: [] },
    subtotal: { type: Number, required: true, min: 0 },
    taxRate: { type: Number, default: 0.05 },
    tax: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    paymentStatus: { type: String, enum: ['unpaid', 'paid', 'refunded'], default: 'unpaid' },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

orderSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
module.exports.ORDER_STATUSES = ORDER_STATUSES;
