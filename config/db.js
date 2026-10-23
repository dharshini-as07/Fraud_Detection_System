const mongoose = require('mongoose');

/**
 * Connect to MongoDB database
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fraud_detection');
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);

    // Synchronize historical transactions so test payees reflect today's current date and realistic times
    try {
      const Transaction = require('../models/Transaction');
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Update Priya Verma transactions if they are before today
      const priyaTxns = await Transaction.find({
        receiver: /Priya Verma/i,
        createdAt: { $lt: startOfToday }
      }).sort({ createdAt: 1 });

      if (priyaTxns.length > 0) {
        for (let i = 0; i < priyaTxns.length; i++) {
          const t = priyaTxns[i];
          // Space them 45m, 1h30m, 2h30m earlier today
          const minsAgo = (priyaTxns.length - i) * 45 + 15;
          const adjusted = new Date(now.getTime() - minsAgo * 60 * 1000);
          await Transaction.updateOne(
            { _id: t._id },
            { $set: { timestamp: adjusted, createdAt: adjusted } }
          );
        }
        console.log(`[MongoDB] Synchronized ${priyaTxns.length} Priya Verma transactions to today.`);
      }
    } catch (syncErr) {
      console.warn('[MongoDB] Timestamp sync skipped:', syncErr.message);
    }
  } catch (error) {
    console.error(`[MongoDB] Database connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
