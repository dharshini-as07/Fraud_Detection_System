const express = require('express');
const router = express.Router();
const {
  getAdminDashboard,
  getAllTransactions,
  getAllAlerts,
  approveTransaction,
  blockTransaction,
  reviewAlert
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

// All admin routes require valid authentication and 'admin' role
router.use(protect, requireAdmin);

router.get('/dashboard', getAdminDashboard);
router.get('/transactions', getAllTransactions);
router.get('/alerts', getAllAlerts);
router.put('/transactions/:id/approve', approveTransaction);
router.put('/transactions/:id/block', blockTransaction);
router.put('/alerts/:id/review', reviewAlert);

module.exports = router;
