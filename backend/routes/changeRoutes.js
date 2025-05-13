const express = require('express');
const {
  getChanges,
  getChangeById,
  approveChange,
  rejectChange,
} = require('../controllers/changeController');
const { protect } = require('../middlewares/auth');
const { checkRole } = require('../middlewares/roleCheck');

const router = express.Router();

// Маршруты только для админа
router.get('/', protect, checkRole('admin'), getChanges);
router.get('/:id', protect, checkRole('admin'), getChangeById);
router.put('/:id/approve', protect, checkRole('admin'), approveChange);
router.put('/:id/reject', protect, checkRole('admin'), rejectChange);

module.exports = router;