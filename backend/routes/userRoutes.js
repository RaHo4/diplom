const express = require('express');
const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getPendingUsers,
  approveUser,
} = require('../controllers/userController');
const { protect } = require('../middlewares/auth');
const { checkRole } = require('../middlewares/roleCheck');

const router = express.Router();

// Маршруты только для админа
router.get('/', protect, checkRole('admin'), getUsers);
router.get('/pending', protect, checkRole('admin'), getPendingUsers);
router.put('/approve/:id', protect, checkRole('admin'), approveUser);
router.get('/:id', protect, checkRole('admin'), getUserById);
router.put('/:id', protect, checkRole('admin'), updateUser);
router.delete('/:id', protect, checkRole('admin'), deleteUser);

module.exports = router;