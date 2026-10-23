const express = require('express');
const router = express.Router();
const {
  createTransaction,
  getMyTransactions,
  getTransactionById
} = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createTransaction);
router.get('/', protect, getMyTransactions);
router.get('/:id', protect, getTransactionById);

module.exports = router;
