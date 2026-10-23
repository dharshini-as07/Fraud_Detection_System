const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    sender: {
      type: String,
      required: [true, 'Sender name or identifier is required'],
      trim: true
    },
    receiver: {
      type: String,
      required: [true, 'Receiver name is required'],
      trim: true
    },
    amount: {
      type: Number,
      required: [true, 'Transaction amount is required'],
      min: [1, 'Amount must be greater than 0']
    },
    beneficiary: {
      type: String,
      required: [true, 'Beneficiary account or UPI ID is required'],
      trim: true
    },
    deviceId: {
      type: String,
      required: [true, 'Device ID is required'],
      trim: true
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    riskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    riskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'LOW'
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'BLOCKED', 'REVIEW'],
      default: 'PENDING'
    },
    suspiciousReasons: {
      type: [String],
      default: []
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false
  }
);

module.exports = mongoose.model('Transaction', transactionSchema);
