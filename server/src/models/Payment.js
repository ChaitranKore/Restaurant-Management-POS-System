const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    method: { type: String, enum: ['cash', 'card'], required: true },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
    transactionId: { type: String, required: true, unique: true },
    // card-only metadata (never store full card numbers/CVV — this is a simulated gateway)
    cardBrand: { type: String, default: '' },
    cardLast4: { type: String, default: '' },
    // cash-only metadata
    tenderedAmount: { type: Number },
    changeDue: { type: Number },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
