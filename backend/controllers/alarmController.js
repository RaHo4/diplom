const FireAlarm = require('../models/FireAlarm');
const Building = require('../models/Building');
const Floor = require('../models/Floor');
const AlarmHistory = require('../models/AlarmHistory');
const PendingChange = require('../models/PendingChange');
const { io } = require('../websocket/socket');

// @desc    Получение всех извещателей здания
// @route   GET /api/alarms/building/:buildingId
// @access  Private
const getAlarmsByBuilding = async (req, res) => {
  try {
    const { buildingId } = req.params;
    
    // Проверка существования здания
    const building = await Building.findById(buildingId);
    if (!building) {
      return res.status(404).json({ 
        success: false, 
        message: 'Здание не найдено' 
      });
    }
    
    const alarms = await FireAlarm.find({ buildingId });
    
    res.json({ success: true, alarms });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при получении извещателей',
      error: error.message
    });
  }
};

// @desc    Получение всех извещателей этажа
// @route   GET /api/alarms/floor/:floorId
// @access  Private
const getAlarmsByFloor = async (req, res) => {
  try {
    const { floorId } = req.params;
    
    // Проверка существования этажа
    const floor = await Floor.findById(floorId);
    if (!floor) {
      return res.status(404).json({ 
        success: false, 
        message: 'Этаж не найден' 
      });
    }
    
    const alarms = await FireAlarm.find({ floorId });
    
    res.json({ success: true, alarms });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при получении извещателей',
      error: error.message
    });
  }
};

// @desc    Добавление извещателя
// @route   POST /api/alarms
// @access  Private/Admin/Duty
const addAlarm = async (req, res) => {
  try {
    const { buildingId, floorId, name, status, coordinates } = req.body;
    
    // Проверка существования здания
    const building = await Building.findById(buildingId);
    if (!building) {
      return res.status(404).json({ 
        success: false, 
        message: 'Здание не найдено' 
      });
    }
    
    // Проверка существования этажа
    const floor = await Floor.findById(floorId);
    if (!floor) {
      return res.status(404).json({ 
        success: false, 
        message: 'Этаж не найден' 
      });
    }
    
    // Проверка принадлежности этажа к зданию
    if (floor.buildingId.toString() !== buildingId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Этаж не принадлежит указанному зданию' 
      });
    }
    
    // Роль дежурного требует подтверждения администратором
    if (req.user.role === 'duty') {
      const pendingChange = await PendingChange.create({
        type: 'alarm-position',
        buildingId,
        floorId,
        changes: {
          action: 'add',
          data: {
            name,
            status,
            coordinates,
          }
        },
        requestedBy: req.user._id,
        status: 'pending',
      });
      
      return res.status(201).json({ 
        success: true, 
        pendingChange,
        message: 'Запрос на добавление извещателя отправлен на рассмотрение администратору'
      });
    }
    
    // Администратор добавляет без подтверждения
    const alarm = await FireAlarm.create({
      buildingId,
      floorId,
      name,
      status,
      coordinates,
      lastUpdated: Date.now(),
    });
    
    res.status(201).json({ 
      success: true, 
      alarm,
      message: 'Извещатель успешно добавлен'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при добавлении извещателя',
      error: error.message
    });
  }
};

// @desc    Обновление извещателя
// @route   PUT /api/alarms/:id
// @access  Private/Admin/Duty
const updateAlarm = async (req, res) => {
  try {
    const { name, status, coordinates } = req.body;
    
    const alarm = await FireAlarm.findById(req.params.id);
    
    if (!alarm) {
      return res.status(404).json({ 
        success: false, 
        message: 'Извещатель не найден' 
      });
    }
    
    // Роль дежурного требует подтверждения администратором
    if (req.user.role === 'duty') {
      const pendingChange = await PendingChange.create({
        type: 'alarm-position',
        buildingId: alarm.buildingId,
        floorId: alarm.floorId,
        alarmId: alarm._id,
        changes: {
          action: 'update',
          data: {
            name: name || alarm.name,
            status: status || alarm.status,
            coordinates: coordinates || alarm.coordinates,
          }
        },
        requestedBy: req.user._id,
        status: 'pending',
      });
      
      return res.json({ 
        success: true, 
        pendingChange,
        message: 'Запрос на обновление извещателя отправлен на рассмотрение администратору'
      });
    }
    
    // Администратор обновляет без подтверждения
    if (name) alarm.name = name;
    if (status) alarm.status = status;
    if (coordinates) alarm.coordinates = coordinates;
    
    alarm.lastUpdated = Date.now();
    
    const updatedAlarm = await alarm.save();
    
    res.json({ 
      success: true, 
      alarm: updatedAlarm,
      message: 'Извещатель успешно обновлен'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при обновлении извещателя',
      error: error.message
    });
  }
};

// @desc    Удаление извещателя
// @route   DELETE /api/alarms/:id
// @access  Private/Admin
const deleteAlarm = async (req, res) => {
  try {
    const alarm = await FireAlarm.findById(req.params.id);
    
    if (!alarm) {
      return res.status(404).json({ 
        success: false, 
        message: 'Извещатель не найден' 
      });
    }
    
    // Роль дежурного требует подтверждения администратором
    if (req.user.role === 'duty') {
      const pendingChange = await PendingChange.create({
        type: 'alarm-position',
        buildingId: alarm.buildingId,
        floorId: alarm.floorId,
        alarmId: alarm._id,
        changes: {
          action: 'delete',
        },
        requestedBy: req.user._id,
        status: 'pending',
      });
      
      return res.json({ 
        success: true, 
        pendingChange,
        message: 'Запрос на удаление извещателя отправлен на рассмотрение администратору'
      });
    }
    
    // Администратор удаляет без подтверждения
    await alarm.deleteOne();
    
    res.json({ 
      success: true, 
      message: 'Извещатель успешно удален' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при удалении извещателя',
      error: error.message
    });
  }
};

// @desc    Обновление статуса извещателя
// @route   PUT /api/alarms/:id/status
// @access  Private
const updateAlarmStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['normal', 'alarm', 'fault', 'disabled'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Неверный статус' 
      });
    }
    
    const alarm = await FireAlarm.findById(req.params.id);
    
    if (!alarm) {
      return res.status(404).json({ 
        success: false, 
        message: 'Извещатель не найден' 
      });
    }
    
    const oldStatus = alarm.status;
    alarm.status = status;
    alarm.lastUpdated = Date.now();
    
    const updatedAlarm = await alarm.save();
    
    // Запись в историю, если статус изменился
    if (oldStatus !== status) {
      const historyRecord = await AlarmHistory.create({
        buildingId: alarm.buildingId,
        floorId: alarm.floorId,
        alarmId: alarm._id,
        status,
        timestamp: Date.now(),
      });
      
      // Если статус сменился на 'alarm', обновить статус этажа и здания
      if (status === 'alarm') {
        const floor = await Floor.findById(alarm.floorId);
        floor.status = 'fire';
        await floor.save();
        
        const building = await Building.findById(alarm.buildingId);
        building.status = 'fire';
        await building.save();
        
        // Отправка уведомления через WebSocket
        io.emit('alarm-triggered', {
          alarmId: alarm._id,
          buildingId: alarm.buildingId,
          floorId: alarm.floorId,
          status: 'alarm',
        });
      }
    }
    
    res.json({ 
      success: true, 
      alarm: updatedAlarm,
      message: 'Статус извещателя успешно обновлен'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при обновлении статуса извещателя',
      error: error.message
    });
  }
};

// @desc    Получение активных тревог
// @route   GET /api/alarms/active
// @access  Private
const getActiveAlarms = async (req, res) => {
  try {
    const alarms = await FireAlarm.find({ status: 'alarm' })
      .populate('buildingId', 'name address status')
      .populate('floorId', 'floorNumber status');
    
    res.json({ 
      success: true, 
      alarms,
      count: alarms.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при получении активных тревог',
      error: error.message
    });
  }
};

module.exports = {
  getAlarmsByBuilding,
  getAlarmsByFloor,
  addAlarm,
  updateAlarm,
  deleteAlarm,
  updateAlarmStatus,
  getActiveAlarms,
};