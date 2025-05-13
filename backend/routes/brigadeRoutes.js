const express = require('express');
const {
  getBrigades,
  getBrigadeById,
  createBrigade,
  updateBrigade,
  deleteBrigade,
  assignBrigade,
  updateBrigadeStatus,
  getAvailableBrigades,
} = require('../controllers/brigadeController');
const { protect } = require('../middlewares/auth');
const { checkRole } = require('../middlewares/roleCheck');
const { approval } = require('../middlewares/approvalMiddleware');

const router = express.Router();

// Маршруты для админа и диспетчера
router.get('/', protect, approval, checkRole('admin', 'dispatcher'), getBrigades);
router.get('/available', protect, approval, checkRole('dispatcher'), getAvailableBrigades);
router.get('/:id', protect, approval, checkRole('admin', 'dispatcher'), getBrigadeById);

// Маршруты только для админа
router.post('/', protect, checkRole('admin'), createBrigade);
router.put('/:id', protect, checkRole('admin'), updateBrigade);
router.delete('/:id', protect, checkRole('admin'), deleteBrigade);

// Маршрут только для диспетчера
router.put('/:id/assign', protect, approval, checkRole('dispatcher'), assignBrigade);

// Маршрут для пожарных и диспетчера
router.put('/:id/status', approval, protect, updateBrigadeStatus);

module.exports = router;