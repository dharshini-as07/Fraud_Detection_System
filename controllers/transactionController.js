const Transaction = require('../models/Transaction');
const { calculateRisk } = require('../services/fraudDetection');
const { createFraudAlert } = require('../services/alertService');

/**
 * Generate readable transaction ID: TXN + Timestamp snippet + random 4 digits
 */
const generateTransactionId = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `TXN${timestamp}${random}`;
};

// @desc    Create and process a financial transaction
// @route   POST /api/transactions
// @access  Private (Customer)
const createTransaction = async (req, res) => {
  try {
    const { receiver, beneficiary, amount, location, deviceId } = req.body;

    // Validate inputs
    if (!receiver || !beneficiary || !amount || !location || !deviceId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide receiver, beneficiary, amount, location, and deviceId'
      });
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Transaction amount must be a positive number'
      });
    }

    // 1. Retrieve user's previous transaction history
    const userHistory = await Transaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    // 2. Prepare transaction payload for rule evaluation
    const transactionPayload = {
      sender: req.user.name,
      receiver: receiver.trim(),
      beneficiary: beneficiary.trim(),
      amount: parsedAmount,
      location: location.trim(),
      deviceId: deviceId.trim(),
      timestamp: new Date()
    };

    // 3. Run Fraud Detection Rule Engine
    const {
      riskScore,
      riskLevel,
      status,
      suspiciousReasons,
      ruleBreakdown
    } = calculateRisk(transactionPayload, userHistory);

    // 4. Save transaction in MongoDB
    const transactionId = generateTransactionId();
    const transaction = await Transaction.create({
      transactionId,
      userId: req.user._id,
      sender: req.user.name,
      receiver: receiver.trim(),
      amount: parsedAmount,
      beneficiary: beneficiary.trim(),
      deviceId: deviceId.trim(),
      location: location.trim(),
      timestamp: transactionPayload.timestamp,
      riskScore,
      riskLevel,
      status,
      suspiciousReasons,
      createdAt: transactionPayload.timestamp
    });

    // 5. If MEDIUM or HIGH risk, create alert and emit real-time Socket.IO notification
    let alert = null;
    if (riskLevel === 'MEDIUM' || riskLevel === 'HIGH') {
      const io = req.app.get('io');
      alert = await createFraudAlert({
        transaction,
        user: req.user,
        riskScore,
        riskLevel,
        reasons: suspiciousReasons,
        io
      });
    }

    let message = 'Transaction processed successfully';
    if (status === 'APPROVED') {
      message = 'Transaction successfully approved and processed';
    } else if (status === 'REVIEW') {
      message = 'Transaction held for manual compliance review due to suspicious indicators';
    } else if (status === 'BLOCKED') {
      message = 'Transaction blocked immediately due to high fraud risk evaluation';
    }

    return res.status(201).json({
      success: true,
      message,
      transaction,
      alert,
      ruleBreakdown
    });
  } catch (error) {
    console.error('[TransactionController] CreateTransaction error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error creating transaction'
    });
  }
};

// @desc    Get user's transactions with search and filter
// @route   GET /api/transactions
// @access  Private (Customer)
const getMyTransactions = async (req, res) => {
  try {
    const { search, status, riskLevel } = req.query;

    const query = { userId: req.user._id };

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (riskLevel && riskLevel !== 'ALL') {
      query.riskLevel = riskLevel;
    }

    if (search) {
      query.$or = [
        { transactionId: { $regex: search, $options: 'i' } },
        { receiver: { $regex: search, $options: 'i' } },
        { beneficiary: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: transactions.length,
      transactions
    });
  } catch (error) {
    console.error('[TransactionController] GetMyTransactions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving transactions'
    });
  }
};

// @desc    Get single transaction by ID
// @route   GET /api/transactions/:id
// @access  Private
const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate('reviewedBy', 'name email');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Check authorization: customer can only view their own transactions; admin can view all
    if (
      req.user.role !== 'admin' &&
      transaction.userId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this transaction'
      });
    }

    return res.status(200).json({
      success: true,
      transaction
    });
  } catch (error) {
    console.error('[TransactionController] GetTransactionById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving transaction details'
    });
  }
};

module.exports = {
  createTransaction,
  getMyTransactions,
  getTransactionById
};
