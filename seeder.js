const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Transaction = require('./models/Transaction');
const Alert = require('./models/Alert');

dotenv.config();

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fraud_detection';
    await mongoose.connect(mongoUri);
    console.log('[Seeder] Connected to MongoDB database...');

    // Clear existing collections
    await User.deleteMany({});
    await Transaction.deleteMany({});
    await Alert.deleteMany({});
    console.log('[Seeder] Cleared previous database records.');

    // 1. Create Default Admin User
    const admin = await User.create({
      name: 'System Compliance Admin',
      email: 'admin@frauddetection.com',
      phone: '+91 98765 43210',
      password: 'Admin@12345',
      role: 'admin'
    });

    // 2. Create Default Customer User
    const customer = await User.create({
      name: 'Aditi Sharma',
      email: 'customer@example.com',
      phone: '+91 91234 56789',
      password: 'Customer@12345',
      role: 'customer'
    });

    console.log('[Seeder] Test Accounts Created:');
    console.log('  👑 Admin:    admin@frauddetection.com / Admin@12345');
    console.log('  👤 Customer: customer@example.com / Customer@12345');

    // 3. Create Historical Baseline Transactions for Customer
    // (Historical baseline allows the rule engine to calculate average spend, device, and locations)
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);

    const historicalTransactions = [
      {
        transactionId: 'TXN1001',
        userId: customer._id,
        sender: customer.name,
        receiver: 'Priya Verma',
        amount: 2500,
        beneficiary: 'ACC-SBI-1001',
        deviceId: 'DEV-MAC-CHROME-01',
        location: 'Mumbai, India',
        timestamp: threeDaysAgo,
        riskScore: 0,
        riskLevel: 'LOW',
        status: 'APPROVED',
        suspiciousReasons: [],
        createdAt: threeDaysAgo
      },
      {
        transactionId: 'TXN1002',
        userId: customer._id,
        sender: customer.name,
        receiver: 'Electricity Utility Board',
        amount: 1850,
        beneficiary: 'ACC-MSEB-4004',
        deviceId: 'DEV-MAC-CHROME-01',
        location: 'Mumbai, India',
        timestamp: twoDaysAgo,
        riskScore: 0,
        riskLevel: 'LOW',
        status: 'APPROVED',
        suspiciousReasons: [],
        createdAt: twoDaysAgo
      },
      {
        transactionId: 'TXN1003',
        userId: customer._id,
        sender: customer.name,
        receiver: 'Priya Verma',
        amount: 3200,
        beneficiary: 'ACC-SBI-1001',
        deviceId: 'DEV-MAC-CHROME-01',
        location: 'Mumbai, India',
        timestamp: oneDayAgo,
        riskScore: 0,
        riskLevel: 'LOW',
        status: 'APPROVED',
        suspiciousReasons: [],
        createdAt: oneDayAgo
      }
    ];

    await Transaction.insertMany(historicalTransactions);
    console.log('[Seeder] 3 Baseline Historical Transactions created (Avg ~₹2,500).');

    // 4. Create Pre-evaluated Sample Transactions for Demonstration
    // Sample MEDIUM Risk Transaction
    const medTxnTime = new Date(Date.now() - 40 * 60 * 1000); // 40 mins ago
    const mediumTxn = await Transaction.create({
      transactionId: 'TXN1004',
      userId: customer._id,
      sender: customer.name,
      receiver: 'Apex Gadgets Store',
      amount: 45000,
      beneficiary: 'ACC-ICICI-8888',
      deviceId: 'DEV-WIN-EDGE-02',
      location: 'Mumbai, India',
      timestamp: medTxnTime,
      riskScore: 60,
      riskLevel: 'MEDIUM',
      status: 'REVIEW',
      suspiciousReasons: [
        'Unusual transaction amount: ₹45,000 is significantly higher than user average (₹2,517)',
        'New beneficiary: First-time transfer to receiver \'Apex Gadgets Store\' (ACC-ICICI-8888)',
        'Unrecognized device: Transaction initiated from unverified device (DEV-WIN-EDGE-02)'
      ],
      createdAt: medTxnTime
    });

    await Alert.create({
      transactionId: mediumTxn.transactionId,
      userId: customer._id,
      riskScore: 60,
      riskLevel: 'MEDIUM',
      message: 'Suspicious transaction detected under manual review threshold.',
      reasons: mediumTxn.suspiciousReasons,
      status: 'NEW',
      createdAt: medTxnTime
    });

    // Sample HIGH Risk Transaction
    const highTxnTime = new Date(Date.now() - 10 * 60 * 1000); // 10 mins ago
    const highTxn = await Transaction.create({
      transactionId: 'TXN1005',
      userId: customer._id,
      sender: customer.name,
      receiver: 'Crypto Overseas Exchange',
      amount: 125000,
      beneficiary: 'OFFSHORE-9999-SWIFT',
      deviceId: 'DEV-LINUX-OPERA-03',
      location: 'Moscow, Russia',
      timestamp: highTxnTime,
      riskScore: 90,
      riskLevel: 'HIGH',
      status: 'BLOCKED',
      suspiciousReasons: [
        'Unusual transaction amount: ₹1,25,000 is significantly higher than user average (₹2,517)',
        'Rapid repeated transactions: 2 transactions detected within a 5-minute window',
        'New beneficiary: First-time transfer to receiver \'Crypto Overseas Exchange\' (OFFSHORE-9999-SWIFT)',
        'Unrecognized device: Transaction initiated from unverified device (DEV-LINUX-OPERA-03)',
        'Unusual location: Transaction initiated from \'Moscow, Russia\', differing from recent geographic profile'
      ],
      createdAt: highTxnTime
    });

    await Alert.create({
      transactionId: highTxn.transactionId,
      userId: customer._id,
      riskScore: 90,
      riskLevel: 'HIGH',
      message: 'High-risk transaction detected! Immediate intervention recommended.',
      reasons: highTxn.suspiciousReasons,
      status: 'NEW',
      createdAt: highTxnTime
    });

    console.log('[Seeder] Sample Demonstration Transactions & Alerts created (1 MEDIUM, 1 HIGH).');
    console.log('[Seeder] Database seeding completed successfully! ✨');
    process.exit(0);
  } catch (error) {
    console.error('[Seeder] Error during database seeding:', error);
    process.exit(1);
  }
};

seedDatabase();
