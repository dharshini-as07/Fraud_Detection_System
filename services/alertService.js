const Alert = require('../models/Alert');

/**
 * Creates a fraud alert record and broadcasts it in real-time via Socket.IO
 * 
 * @param {Object} params
 * @param {Object} params.transaction - Saved transaction object
 * @param {Object} params.user - User object (sender)
 * @param {Number} params.riskScore - Risk score (0-100)
 * @param {String} params.riskLevel - 'LOW', 'MEDIUM', 'HIGH'
 * @param {Array} params.reasons - Suspicious reasons list
 * @param {Object} params.io - Socket.io instance
 * @returns {Promise<Object>} Created alert document
 */
const createFraudAlert = async ({ transaction, user, riskScore, riskLevel, reasons, io }) => {
  try {
    // Only generate alerts for MEDIUM and HIGH risk levels
    if (riskLevel === 'LOW') {
      return null;
    }

    const message = riskLevel === 'HIGH'
      ? `High-risk transaction detected! Immediate intervention recommended.`
      : `Suspicious transaction detected under manual review threshold.`;

    const alert = await Alert.create({
      transactionId: transaction.transactionId,
      userId: user._id,
      riskScore,
      riskLevel,
      message,
      reasons,
      status: 'NEW',
      createdAt: new Date()
    });

    // Populate user details for real-time payload
    const alertPayload = {
      _id: alert._id,
      transactionId: transaction.transactionId,
      userId: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone
      },
      transaction: {
        amount: transaction.amount,
        sender: transaction.sender,
        receiver: transaction.receiver,
        beneficiary: transaction.beneficiary,
        location: transaction.location,
        deviceId: transaction.deviceId,
        status: transaction.status,
        timestamp: transaction.timestamp
      },
      riskScore,
      riskLevel,
      message,
      reasons,
      status: alert.status,
      createdAt: alert.createdAt
    };

    // Emit real-time Socket.IO event to all admins
    if (io) {
      console.log(`[Socket.IO] Emitting 'fraud_alert' for ${transaction.transactionId} (${riskLevel} risk)`);
      io.to('admin_room').emit('fraud_alert', alertPayload);
      // Also emit to general broadcast to ensure connected dashboards receive it
      io.emit('new_fraud_alert', alertPayload);
    }

    return alert;
  } catch (error) {
    console.error('[AlertService] Error creating fraud alert:', error);
    throw error;
  }
};

module.exports = {
  createFraudAlert
};
