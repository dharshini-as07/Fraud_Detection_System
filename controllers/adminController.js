const Transaction = require('../models/Transaction');
const Alert = require('../models/Alert');
const User = require('../models/User');

// @desc    Get Admin Dashboard summary stats and metrics
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
const getAdminDashboard = async (req, res) => {
  try {
    const totalTransactions = await Transaction.countDocuments();
    const lowRiskCount = await Transaction.countDocuments({ riskLevel: 'LOW' });
    const mediumRiskCount = await Transaction.countDocuments({ riskLevel: 'MEDIUM' });
    const highRiskCount = await Transaction.countDocuments({ riskLevel: 'HIGH' });
    
    // Status counts
    const approvedCount = await Transaction.countDocuments({ status: 'APPROVED' });
    const reviewCount = await Transaction.countDocuments({ status: 'REVIEW' });
    const blockedCount = await Transaction.countDocuments({ status: 'BLOCKED' });

    // Alerts counts
    const totalAlerts = await Alert.countDocuments();
    const pendingAlerts = await Alert.countDocuments({ status: 'NEW' });
    const totalUsers = await User.countDocuments({ role: 'customer' });

    // Recent 5 transactions
    const recentTransactions = await Transaction.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Recent 5 alerts
    const recentAlerts = await Alert.find()
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return res.status(200).json({
      success: true,
      stats: {
        totalTransactions,
        lowRiskCount,
        mediumRiskCount,
        highRiskCount,
        approvedCount,
        reviewCount,
        blockedCount,
        totalAlerts,
        pendingAlerts,
        totalUsers
      },
      recentTransactions,
      recentAlerts
    });
  } catch (error) {
    console.error('[AdminController] Dashboard stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving admin dashboard statistics'
    });
  }
};

// @desc    Get all transactions with search and filters
// @route   GET /api/admin/transactions
// @access  Private (Admin)
const getAllTransactions = async (req, res) => {
  try {
    const { search, status, riskLevel } = req.query;

    const query = {};

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (riskLevel && riskLevel !== 'ALL') {
      query.riskLevel = riskLevel;
    }

    if (search) {
      query.$or = [
        { transactionId: { $regex: search, $options: 'i' } },
        { sender: { $regex: search, $options: 'i' } },
        { receiver: { $regex: search, $options: 'i' } },
        { beneficiary: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    const transactions = await Transaction.find(query)
      .populate('userId', 'name email phone')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: transactions.length,
      transactions
    });
  } catch (error) {
    console.error('[AdminController] GetAllTransactions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving all transactions'
    });
  }
};

// @desc    Get all alerts with status and risk filters
// @route   GET /api/admin/alerts
// @access  Private (Admin)
const getAllAlerts = async (req, res) => {
  try {
    const { status, riskLevel } = req.query;

    const query = {};

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (riskLevel && riskLevel !== 'ALL') {
      query.riskLevel = riskLevel;
    }

    const alerts = await Alert.find(query)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: alerts.length,
      alerts
    });
  } catch (error) {
    console.error('[AdminController] GetAllAlerts error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving alerts'
    });
  }
};

// @desc    Admin manually approves a transaction
// @route   PUT /api/admin/transactions/:id/approve
// @access  Private (Admin)
const approveTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    transaction.status = 'APPROVED';
    transaction.reviewedBy = req.user._id;
    transaction.reviewedAt = new Date();
    await transaction.save();

    // Mark corresponding alerts as RESOLVED
    await Alert.updateMany(
      { transactionId: transaction.transactionId },
      { status: 'RESOLVED', reviewedAt: new Date() }
    );

    // Broadcast update via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('transaction_updated', {
        transactionId: transaction.transactionId,
        status: 'APPROVED',
        reviewedAt: transaction.reviewedAt
      });
    }

    return res.status(200).json({
      success: true,
      message: `Transaction ${transaction.transactionId} has been manually APPROVED by compliance`,
      transaction
    });
  } catch (error) {
    console.error('[AdminController] ApproveTransaction error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error approving transaction'
    });
  }
};

// @desc    Admin manually blocks a transaction
// @route   PUT /api/admin/transactions/:id/block
// @access  Private (Admin)
const blockTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    transaction.status = 'BLOCKED';
    transaction.reviewedBy = req.user._id;
    transaction.reviewedAt = new Date();
    await transaction.save();

    // Mark corresponding alerts as RESOLVED
    await Alert.updateMany(
      { transactionId: transaction.transactionId },
      { status: 'RESOLVED', reviewedAt: new Date() }
    );

    // Broadcast update via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('transaction_updated', {
        transactionId: transaction.transactionId,
        status: 'BLOCKED',
        reviewedAt: transaction.reviewedAt
      });
    }

    return res.status(200).json({
      success: true,
      message: `Transaction ${transaction.transactionId} has been BLOCKED due to fraud compliance`,
      transaction
    });
  } catch (error) {
    console.error('[AdminController] BlockTransaction error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error blocking transaction'
    });
  }
};

// @desc    Admin marks an alert as REVIEWED or RESOLVED
// @route   PUT /api/admin/alerts/:id/review
// @access  Private (Admin)
const reviewAlert = async (req, res) => {
  try {
    const { status } = req.body; // 'REVIEWED' or 'RESOLVED'
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    alert.status = status || 'REVIEWED';
    alert.reviewedAt = new Date();
    await alert.save();

    return res.status(200).json({
      success: true,
      message: `Alert marked as ${alert.status}`,
      alert
    });
  } catch (error) {
    console.error('[AdminController] ReviewAlert error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating alert'
    });
  }
};

module.exports = {
  getAdminDashboard,
  getAllTransactions,
  getAllAlerts,
  approveTransaction,
  blockTransaction,
  reviewAlert
};
