const express = require('express');
const {
  getBuildings,
  getBuildingById,
  createBuilding,
  updateBuilding,
  deleteBuilding,
  searchBuildings,
} = require('../controllers/buildingController');
const { protect } = require('../middlewares/auth');
const { checkRole } = require('../middlewares/roleCheck');
const { approval } = require('../middlewares/approvalMiddleware');

const router = express.Router();

// Общие маршруты (доступны всем авторизованным)
router.get('/', protect, approval, getBuildings);
router.get('/search', protect, approval, searchBuildings);
router.get('/:id', protect, approval, getBuildingById);

// Маршруты только для админа
router.post('/', protect, checkRole('admin'), createBuilding);
router.put('/:id', protect, checkRole('admin'), updateBuilding);
router.delete('/:id', protect, checkRole('admin'), deleteBuilding);

module.exports = router;