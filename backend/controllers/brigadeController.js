const FireBrigade = require('../models/FireBrigade');
const User = require('../models/User');
const Building = require('../models/Building');
const { io } = require('../websocket/socket');

// @desc    Получение всех бригад
// @route   GET /api/brigades
// @access  Private/Admin/Dispatcher
const getBrigades = async (req, res) => {
  try {
    const brigades = await FireBrigade.find()
      .populate('members', 'username firstName lastName')
      .populate('currentAssignment.buildingId', 'name address')
      .populate('currentAssignment.assignedBy', 'username firstName lastName');
    
    res.json({ success: true, brigades });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при получении бригад',
      error: error.message
    });
  }
};

// @desc    Получение бригады по ID
// @route   GET /api/brigades/:id
// @access  Private/Admin/Dispatcher
const getBrigadeById = async (req, res) => {
  try {
    const brigade = await FireBrigade.findById(req.params.id)
      .populate('members', 'username firstName lastName')
      .populate('currentAssignment.buildingId', 'name address')
      .populate('currentAssignment.assignedBy', 'username firstName lastName');
    
    if (brigade) {
      res.json({ success: true, brigade });
    } else {
      res.status(404).json({ 
        success: false, 
        message: 'Бригада не найдена' 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при получении бригады',
      error: error.message
    });
  }
};

// @desc    Создание бригады
// @route   POST /api/brigades
// @access  Private/Admin/Dispatcher
const createBrigade = async (req, res) => {
  try {
    const { name, members } = req.body;
    
    // Проверка существования пользователей и их ролей
    if (members && members.length > 0) {
      const users = await User.find({ _id: { $in: members } });
      
      // Проверка, что все ID существуют
      if (users.length !== members.length) {
        return res.status(400).json({ 
          success: false, 
          message: 'Один или несколько пользователей не найдены' 
        });
      }
      
      // Проверка, что все пользователи имеют роль firefighter
      const nonFirefighters = users.filter(user => user.role !== 'firefighter');
      if (nonFirefighters.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Все члены бригады должны иметь роль "firefighter"' 
        });
      }
    }
    
    const brigade = await FireBrigade.create({
      name,
      members: members || [],
      isAvailable: true,
    });
    
    res.status(201).json({ 
      success: true, 
      brigade,
      message: 'Бригада успешно создана'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при создании бригады',
      error: error.message
    });
  }
};

// @desc    Обновление бригады
// @route   PUT /api/brigades/:id
// @access  Private/Admin/Dispatcher
const updateBrigade = async (req, res) => {
  try {
    const { name, members } = req.body;
    
    const brigade = await FireBrigade.findById(req.params.id);
    
    if (!brigade) {
      return res.status(404).json({ 
        success: false, 
        message: 'Бригада не найдена' 
      });
    }
    
    // Проверка существования пользователей и их ролей
    if (members && members.length > 0) {
      const users = await User.find({ _id: { $in: members } });
      
      // Проверка, что все ID существуют
      if (users.length !== members.length) {
        return res.status(400).json({ 
          success: false, 
          message: 'Один или несколько пользователей не найдены' 
        });
      }
      
      // Проверка, что все пользователи имеют роль firefighter
      const nonFirefighters = users.filter(user => user.role !== 'firefighter');
      if (nonFirefighters.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Все члены бригады должны иметь роль "firefighter"' 
        });
      }
      
      brigade.members = members;
    }
    
    if (name) {
      brigade.name = name;
    }
    
    const updatedBrigade = await brigade.save();
    
    res.json({ 
      success: true, 
      brigade: updatedBrigade,
      message: 'Бригада успешно обновлена'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при обновлении бригады',
      error: error.message
    });
  }
};

// @desc    Удаление бригады
// @route   DELETE /api/brigades/:id
// @access  Private/Admin
const deleteBrigade = async (req, res) => {
  try {
    const brigade = await FireBrigade.findById(req.params.id);
    
    if (!brigade) {
      return res.status(404).json({ 
        success: false, 
        message: 'Бригада не найдена' 
      });
    }
    
    // Проверка, не назначена ли бригада на вызов
    if (brigade.currentAssignment.buildingId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Невозможно удалить бригаду, которая назначена на вызов' 
      });
    }
    
    await brigade.remove();
    
    res.json({ 
      success: true, 
      message: 'Бригада успешно удалена' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при удалении бригады',
      error: error.message
    });
  }
};

// @desc    Назначение бригады на вызов
// @route   PUT /api/brigades/:id/assign
// @access  Private/Dispatcher
const assignBrigade = async (req, res) => {
  try {
    const { buildingId } = req.body;
    
    const brigade = await FireBrigade.findById(req.params.id);
    
    if (!brigade) {
      return res.status(404).json({ 
        success: false, 
        message: 'Бригада не найдена' 
      });
    }
    
    // Проверка доступности бригады
    if (!brigade.isAvailable) {
      return res.status(400).json({ 
        success: false, 
        message: 'Бригада не доступна для назначения' 
      });
    }
    
    // Проверка существования здания
    const building = await Building.findById(buildingId);
    if (!building) {
      return res.status(404).json({ 
        success: false, 
        message: 'Здание не найдено' 
      });
    }
    
    // Проверка статуса здания
    if (building.status !== 'fire') {
      return res.status(400).json({ 
        success: false, 
        message: 'В здании нет активной пожарной тревоги' 
      });
    }
    
    // Назначение бригады
    brigade.currentAssignment = {
      buildingId,
      assignedAt: Date.now(),
      assignedBy: req.user._id,
      status: 'en-route',
    };
    brigade.isAvailable = false;
    
    const updatedBrigade = await brigade.save();
    
    // Уведомление через WebSocket
    io.emit('brigade-assigned', {
      brigadeId: brigade._id,
      buildingId,
      status: 'en-route',
    });
    
    res.json({ 
      success: true, 
      brigade: updatedBrigade,
      message: 'Бригада успешно назначена на вызов'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при назначении бригады',
      error: error.message
    });
  }
};

// @desc    Обновление статуса бригады
// @route   PUT /api/brigades/:id/status
// @access  Private/Firefighter/Dispatcher
const updateBrigadeStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['en-route', 'on-site', 'returning', 'available'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Неверный статус' 
      });
    }
    
    const brigade = await FireBrigade.findById(req.params.id);
    
    if (!brigade) {
      return res.status(404).json({ 
        success: false, 
        message: 'Бригада не найдена' 
      });
    }
    
    // Проверка, является ли пользователь членом бригады или диспетчером
    const isMember = brigade.members.some(member => member.toString() === req.user._id.toString());
    const isDispatcher = req.user.role === 'dispatcher';
    
    if (!isMember && !isDispatcher) {
      return res.status(403).json({ 
        success: false, 
        message: 'Только члены бригады или диспетчеры могут обновлять статус' 
      });
    }
    
    // Проверка, назначена ли бригада на вызов
    if (!brigade.currentAssignment.buildingId && status !== 'available') {
      return res.status(400).json({ 
        success: false, 
        message: 'Бригада не назначена на вызов' 
      });
    }
    
    // Обновление статуса
    if (status === 'available') {
      // Сброс назначения
      brigade.currentAssignment = {
        buildingId: null,
        assignedAt: null,
        assignedBy: null,
        status: 'available',
      };
      brigade.isAvailable = true;
    } else {
      brigade.currentAssignment.status = status;
    }
    
    const updatedBrigade = await brigade.save();
    
    // Уведомление через WebSocket
    io.emit('brigade-status-updated', {
      brigadeId: brigade._id,
      buildingId: brigade.currentAssignment.buildingId,
      status,
    });
    
    res.json({ 
      success: true, 
      brigade: updatedBrigade,
      message: 'Статус бригады успешно обновлен'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при обновлении статуса бригады',
      error: error.message
    });
  }
};

// @desc    Получение доступных бригад
// @route   GET /api/brigades/available
// @access  Private/Dispatcher
const getAvailableBrigades = async (req, res) => {
  try {
    const brigades = await FireBrigade.find({ isAvailable: true })
      .populate('members', 'username firstName lastName');
    
    res.json({ 
      success: true, 
      brigades,
      count: brigades.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при получении доступных бригад',
      error: error.message
    });
  }
};

module.exports = {
  getBrigades,
  getBrigadeById,
  createBrigade,
  updateBrigade,
  deleteBrigade,
  assignBrigade,
  updateBrigadeStatus,
  getAvailableBrigades,
};