const AlarmHistory = require('../models/AlarmHistory');
const Building = require('../models/Building');

// @desc    Получение истории тревог здания
// @route   GET /api/alarm-history/building/:buildingId
// @access  Private
const getAlarmHistoryByBuilding = async (req, res) => {
  try {
    const { buildingId } = req.params;
    const { startDate, endDate, status } = req.query;
    
    // Проверка существования здания
    const building = await Building.findById(buildingId);
    if (!building) {
      return res.status(404).json({ 
        success: false, 
        message: 'Здание не найдено' 
      });
    }
    
    // Базовый фильтр по зданию
    let query = { buildingId };
    
    // Фильтр по дате
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }
    
    // Фильтр по статусу
    if (status) {
      query.status = status;
    }
    
    const history = await AlarmHistory.find(query)
      .populate('floorId', 'floorNumber')
      .populate('alarmId', 'name type')
      .populate('resolvedBy', 'username firstName lastName')
      .sort({ timestamp: -1 });
    
    res.json({ 
      success: true, 
      history,
      count: history.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при получении истории тревог',
      error: error.message
    });
  }
};

// @desc    Получение общей истории тревог
// @route   GET /api/alarm-history
// @access  Private/Admin/Dispatcher
const getAlarmHistory = async (req, res) => {
  try {
    const { startDate, endDate, status, buildingId } = req.query;
    
    // Базовый фильтр
    let query = {};
    
    // Фильтр по зданию
    if (buildingId) {
      query.buildingId = buildingId;
    }
    
    // Фильтр по дате
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }
    
    // Фильтр по статусу
    if (status) {
      query.status = status;
    }
    
    const history = await AlarmHistory.find(query)
      .populate('buildingId', 'name address')
      .populate('floorId', 'floorNumber')
      .populate('alarmId', 'name type')
      .populate('resolvedBy', 'username firstName lastName')
      .sort({ timestamp: -1 })
      .limit(100); // Ограничение выборки для производительности
    
    res.json({ 
      success: true, 
      history,
      count: history.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при получении истории тревог',
      error: error.message
    });
  }
};

// @desc    Разрешение тревоги
// @route   PUT /api/alarm-history/:id/resolve
// @access  Private/Admin/Dispatcher/Duty
const resolveAlarm = async (req, res) => {
  try {
    const alarmHistory = await AlarmHistory.findById(req.params.id);
    
    if (!alarmHistory) {
      return res.status(404).json({ 
        success: false, 
        message: 'Запись истории тревог не найдена' 
      });
    }
    
    // Проверка, не разрешена ли уже тревога
    if (alarmHistory.resolvedAt) {
      return res.status(400).json({ 
        success: false, 
        message: 'Тревога уже разрешена' 
      });
    }
    
    alarmHistory.resolvedAt = Date.now();
    alarmHistory.resolvedBy = req.user._id;
    
    const updatedAlarmHistory = await alarmHistory.save();
    
    // Обновление статуса извещателя, если тревога
    if (alarmHistory.status === 'alarm') {
      const FireAlarm = require('../models/FireAlarm');
      const alarm = await FireAlarm.findById(alarmHistory.alarmId);
      
      if (alarm && alarm.status === 'alarm') {
        alarm.status = 'normal';
        alarm.lastUpdated = Date.now();
        await alarm.save();
      }
    }
    
    res.json({ 
      success: true, 
      alarmHistory: updatedAlarmHistory,
      message: 'Тревога успешно разрешена'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при разрешении тревоги',
      error: error.message
    });
  }
};

module.exports = {
  getAlarmHistoryByBuilding,
  getAlarmHistory,
  resolveAlarm,
};