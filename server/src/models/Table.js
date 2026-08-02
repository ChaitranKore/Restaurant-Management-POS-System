const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema(
  {
    number: { type: Number, required: true, unique: true },
    capacity: { type: Number, required: true, min: 1, default: 4 },
    status: {
      type: String,
      enum: ['available', 'occupied', 'reserved'],
      default: 'available',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Table', tableSchema);
