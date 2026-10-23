const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    riskScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    riskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    reasons: {
      type: [String],
      required: true
    },
    status: {
      type: String,
      enum: ['NEW', 'REVIEWED', 'RESOLVED'],
      default: 'NEW',
      index: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    reviewedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: false
  }
);

module.exports = mongoose.model('Alert', alertSchema);
