const express = require('express');
const {
  getAlarmHistoryByBuilding,
  getAlarmHistory,
  resolveAlarm,
} = require('../controllers/alarmHistoryController');
const { protect } = require('../middlewares/auth');
const { checkRole } = require('../middlewares/roleCheck');
const { approval } = require('../middlewares/approvalMiddleware');

const router = express.Router();

// Маршрут для дежурного
router.get('/building/:buildingId', protect, approval, getAlarmHistoryByBuilding);

// Маршрут для админа и диспетчера
router.get('/', protect, approval, checkRole('admin', 'dispatcher'), getAlarmHistory);

// Маршрут для разрешения тревоги
router.put('/:id/resolve', protect, approval, resolveAlarm);

module.exports = router;