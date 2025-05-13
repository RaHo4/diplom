const express = require('express');
const {
  getFloorsByBuilding,
  getFloorById,
  addFloor,
  updateFloor,
  deleteFloor,
} = require('../controllers/floorController');
const { protect } = require('../middlewares/auth');
const { checkRole } = require('../middlewares/roleCheck');
const { approval } = require('../middlewares/approvalMiddleware');

const router = express.Router();

// Общие маршруты (доступны всем авторизованным)
router.get('/building/:buildingId', protect, approval, getFloorsByBuilding);
router.get('/:id', protect, approval, getFloorById);

// Маршруты только для админа
router.post('/', protect, approval, checkRole('admin'), addFloor);
router.put('/:id', protect, approval, checkRole('admin'), updateFloor);
router.delete('/:id', protect, approval, checkRole('admin'), deleteFloor);

module.exports = router;