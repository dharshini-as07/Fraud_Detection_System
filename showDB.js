require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Transaction = require('./models/Transaction');
const Alert = require('./models/Alert');

const showDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fraud_detection';
    console.log('\n================================================================');
    console.log(`📊 CONNECTING TO MONGODB: ${mongoUri}`);
    console.log('================================================================');

    await mongoose.connect(mongoUri);

    console.log('✅ Connected successfully!\n');

    // 1. USERS COLLECTION
    const users = await User.find().select('-password').lean();
    console.log(`👤 USERS COLLECTION (${users.length} total):`);
    console.log('----------------------------------------------------------------');
    if (users.length === 0) {
      console.log('No users found.');
    } else {
      console.table(
        users.map((u) => ({
          Name: u.name,
          Email: u.email,
          Phone: u.phone || 'N/A',
          Role: u.role,
          Created: new Date(u.createdAt).toLocaleDateString()
        }))
      );
    }

    // 2. TRANSACTIONS COLLECTION
    const transactions = await Transaction.find().lean();
    console.log(`\n💳 TRANSACTIONS COLLECTION (${transactions.length} total):`);
    console.log('----------------------------------------------------------------');
    if (transactions.length === 0) {
      console.log('No transactions recorded yet.');
    } else {
      console.table(
        transactions.map((t) => ({
          TxnID: t.transactionId,
          Sender: t.sender,
          Receiver: t.receiver,
          Amount: `₹${Number(t.amount).toLocaleString('en-IN')}`,
          'Risk Score': `${t.riskScore}/100`,
          'Risk Level': t.riskLevel,
          Status: t.status,
          Location: t.location,
          Device: t.deviceId
        }))
      );
    }

    // 3. ALERTS COLLECTION
    const alerts = await Alert.find().lean();
    console.log(`\n🚨 ALERTS COLLECTION (${alerts.length} total):`);
    console.log('----------------------------------------------------------------');
    if (alerts.length === 0) {
      console.log('No fraud alerts generated yet.');
    } else {
      console.table(
        alerts.map((a) => ({
          AlertID: String(a._id).slice(-6),
          TxnID: a.transactionId,
          'Risk Score': `${a.riskScore}/100`,
          'Risk Level': a.riskLevel,
          Status: a.status,
          Reasons: (a.reasons || []).join('; ')
        }))
      );
    }

    console.log('\n================================================================');
    console.log('✨ Summary:');
    console.log(`• Users:        ${users.length}`);
    console.log(`• Transactions: ${transactions.length}`);
    console.log(`• Fraud Alerts: ${alerts.length}`);
    console.log('================================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error viewing database:', err.message);
    process.exit(1);
  }
};

showDatabase();
