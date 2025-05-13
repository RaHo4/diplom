const express = require('express');
const {
  getAlarmsByBuilding,
  getAlarmsByFloor,
  addAlarm,
  updateAlarm,
  deleteAlarm,
  updateAlarmStatus,
  getActiveAlarms,
} = require('../controllers/alarmController');
const { protect } = require('../middlewares/auth');
const { checkRole } = require('../middlewares/roleCheck');
const { approval } = require('../middlewares/approvalMiddleware');

const router = express.Router();

// Общие маршруты (доступны всем авторизованным)
router.get('/building/:buildingId', protect, approval, getAlarmsByBuilding);
router.get('/floor/:floorId', protect, approval, getAlarmsByFloor);
router.get('/active', protect, approval, getActiveAlarms);

// Маршруты для админа и дежурного
router.post('/', protect, approval, checkRole('admin', 'duty'), addAlarm);
router.put('/:id', protect, approval, checkRole('admin', 'duty'), updateAlarm);
router.delete('/:id', protect, approval, checkRole('admin', 'duty'), deleteAlarm);

// Маршрут для обновления статуса (используется также для симуляции тревоги)
router.put('/:id/status', protect, approval, updateAlarmStatus);

module.exports = router;