const PendingChange = require('../models/PendingChange');
const Building = require('../models/Building');
const Floor = require('../models/Floor');
const FireAlarm = require('../models/FireAlarm');

// @desc    Получение всех запросов на изменение
// @route   GET /api/changes
// @access  Private/Admin
const getChanges = async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    const changes = await PendingChange.find(query)
      .populate('buildingId', 'name address')
      .populate('floorId', 'floorNumber')
      .populate('requestedBy', 'username firstName lastName')
      .populate('reviewedBy', 'username firstName lastName')
      .sort({ requestedAt: -1 });
    
    res.json({ 
      success: true, 
      changes,
      count: changes.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при получении запросов на изменение',
      error: error.message
    });
  }
};

// @desc    Получение запроса на изменение по ID
// @route   GET /api/changes/:id
// @access  Private/Admin
const getChangeById = async (req, res) => {
  try {
    const change = await PendingChange.findById(req.params.id)
      .populate('buildingId', 'name address')
      .populate('floorId', 'floorNumber')
      .populate('alarmId', 'name type coordinates')
      .populate('requestedBy', 'username firstName lastName')
      .populate('reviewedBy', 'username firstName lastName');
    
    if (change) {
      res.json({ success: true, change });
    } else {
      res.status(404).json({ 
        success: false, 
        message: 'Запрос на изменение не найден' 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при получении запроса на изменение',
      error: error.message
    });
  }
};

// @desc    Утверждение запроса на изменение
// @route   PUT /api/changes/:id/approve
// @access  Private/Admin
const approveChange = async (req, res) => {
  try {
    const change = await PendingChange.findById(req.params.id);
    
    if (!change) {
      return res.status(404).json({ 
        success: false, 
        message: 'Запрос на изменение не найден' 
      });
    }
    
    // Проверка, не обработан ли уже запрос
    if (change.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Запрос уже обработан' 
      });
    }
    
    // Обработка в зависимости от типа изменения
    let result;
    
    switch (change.type) {
      case 'alarm-position':
        result = await handleAlarmPositionChange(change, true);
        break;
      case 'building-plan':
        result = await handleBuildingPlanChange(change, true);
        break;
      case 'floor-plan':
        result = await handleFloorPlanChange(change, true);
        break;
      default:
        return res.status(400).json({ 
          success: false, 
          message: 'Неизвестный тип изменения' 
        });
    }
    
    if (!result.success) {
      return res.status(result.statusCode || 400).json({ 
        success: false, 
        message: result.message 
      });
    }
    
    // Обновление статуса запроса
    change.status = 'approved';
    change.reviewedBy = req.user._id;
    change.reviewedAt = Date.now();
    
    const updatedChange = await change.save();
    
    res.json({ 
      success: true, 
      change: updatedChange,
      message: 'Запрос на изменение утвержден'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при утверждении запроса на изменение',
      error: error.message
    });
  }
};

// @desc    Отклонение запроса на изменение
// @route   PUT /api/changes/:id/reject
// @access  Private/Admin
const rejectChange = async (req, res) => {
  try {
    const { reason } = req.body;
    
    const change = await PendingChange.findById(req.params.id);
    
    if (!change) {
      return res.status(404).json({ 
        success: false, 
        message: 'Запрос на изменение не найден' 
      });
    }
    
    // Проверка, не обработан ли уже запрос
    if (change.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Запрос уже обработан' 
      });
    }
    
    // Обновление статуса запроса
    change.status = 'rejected';
    change.reviewedBy = req.user._id;
    change.reviewedAt = Date.now();
    
    if (reason) {
      change.rejectionReason = reason;
    }
    
    const updatedChange = await change.save();
    
    res.json({ 
      success: true, 
      change: updatedChange,
      message: 'Запрос на изменение отклонен'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при отклонении запроса на изменение',
      error: error.message
    });
  }
};

// Вспомогательные функции для обработки разных типов изменений

// Обработка изменения позиции извещателя
const handleAlarmPositionChange = async (change, isApproved) => {
  try {
    if (!isApproved) return { success: true };
    
    const { action, data } = change.changes;
    
    switch (action) {
      case 'add':
        // Добавление нового извещателя
        await FireAlarm.create({
          buildingId: change.buildingId,
          floorId: change.floorId,
          name: data.name,
          type: data.type,
          status: 'normal',
          coordinates: data.coordinates,
          lastUpdated: Date.now(),
        });
        break;
      
      case 'update':
        // Обновление существующего извещателя
        const alarm = await FireAlarm.findById(change.alarmId);
        
        if (!alarm) {
          return {
            success: false,
            message: 'Извещатель не найден',
            statusCode: 404,
          };
        }
        
        alarm.name = data.name;
        alarm.type = data.type;
        alarm.coordinates = data.coordinates;
        alarm.lastUpdated = Date.now();
        
        await alarm.save();
        break;
      
      case 'delete':
        // Удаление извещателя
        const alarmToDelete = await FireAlarm.findById(change.alarmId);
        
        if (!alarmToDelete) {
          return {
            success: false,
            message: 'Извещатель не найден',
            statusCode: 404,
          };
        }
        
        await alarmToDelete.remove();
        break;
      
      default:
        return {
          success: false,
          message: 'Неизвестное действие',
          statusCode: 400,
        };
    }
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      statusCode: 500,
    };
  }
};

// Обработка изменения плана здания
const handleBuildingPlanChange = async (change, isApproved) => {
  try {
    if (!isApproved) return { success: true };
    
    const { action, data } = change.changes;
    
    switch (action) {
      case 'update':
        // Обновление здания
        const building = await Building.findById(change.buildingId);
        
        if (!building) {
          return {
            success: false,
            message: 'Здание не найдено',
            statusCode: 404,
          };
        }
        
        if (data.name) building.name = data.name;
        if (data.address) building.address = data.address;
        if (data.floors) building.floors = data.floors;
        if (data.status) building.status = data.status;
        if (data.dutyOfficers) building.dutyOfficers = data.dutyOfficers;
        
        await building.save();
        break;
      
      default:
        return {
          success: false,
          message: 'Неизвестное действие',
          statusCode: 400,
        };
    }
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      statusCode: 500,
    };
  }
};

// Обработка изменения плана этажа
const handleFloorPlanChange = async (change, isApproved) => {
  try {
    if (!isApproved) return { success: true };
    
    const { action, data } = change.changes;
    
    switch (action) {
      case 'update':
        // Обновление этажа
        const floor = await Floor.findById(change.floorId);
        
        if (!floor) {
          return {
            success: false,
            message: 'Этаж не найден',
            statusCode: 404,
          };
        }
        
        if (data.planImagePath) floor.planImagePath = data.planImagePath;
        if (data.status) floor.status = data.status;
        
        floor.updatedAt = Date.now();
        
        await floor.save();
        break;
      
      default:
        return {
          success: false,
          message: 'Неизвестное действие',
          statusCode: 400,
        };
    }
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      statusCode: 500,
    };
  }
};

module.exports = {
  getChanges,
  getChangeById,
  approveChange,
  rejectChange,
};