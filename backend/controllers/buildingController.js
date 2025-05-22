const Building = require('../models/Building');
const Floor = require('../models/Floor');
const FireAlarm = require('../models/FireAlarm');

// @desc    Получение всех зданий
// @route   GET /api/buildings
// @access  Private
const getBuildings = async (req, res) => {
  try {
    const buildings = await Building.find()
      .populate('createdBy', 'username firstName lastName')
      .populate('dutyOfficers', 'username firstName lastName');
    
    res.json({ success: true, buildings });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при получении зданий',
      error: error.message
    });
  }
};

// @desc    Получение здания по ID
// @route   GET /api/buildings/:id
// @access  Private
const getBuildingById = async (req, res) => {
  try {
    const building = await Building.findById(req.params.id)
      .populate('createdBy', 'username firstName lastName')
      .populate('dutyOfficers', 'username firstName lastName');
    
    if (building) {
      res.json({ success: true, building });
    } else {
      res.status(404).json({ 
        success: false, 
        message: 'Здание не найдено' 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при получении здания',
      error: error.message
    });
  }
};

// @desc    Создание здания
// @route   POST /api/buildings
// @access  Private/Admin
const createBuilding = async (req, res) => {
  try {
    const { name, address, floors, dutyOfficers } = req.body;

    console.log(req.body);
    
    const building = await Building.create({
      name,
      address,
      floors,
      dutyOfficers: dutyOfficers || [],
      createdBy: req.user._id,
      status: 'normal',
    });
    
    res.status(201).json({ 
      success: true, 
      building,
      message: 'Здание успешно создано'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при создании здания',
      error: error.message
    });
  }
};

// @desc    Обновление здания
// @route   PUT /api/buildings/:id
// @access  Private/Admin
const updateBuilding = async (req, res) => {
  try {
    const { name, address, floors, status, dutyOfficers } = req.body;
    
    const building = await Building.findById(req.params.id);
    
    if (building) {
      building.name = name || building.name;
      building.address = address || building.address;
      building.floors = floors || building.floors;
      building.status = status || building.status;
      
      if (dutyOfficers) {
        building.dutyOfficers = dutyOfficers;
      }
      
      const updatedBuilding = await building.save();
      
      res.json({ 
        success: true, 
        building: updatedBuilding,
        message: 'Здание успешно обновлено'
      });
    } else {
      res.status(404).json({ 
        success: false, 
        message: 'Здание не найдено' 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при обновлении здания',
      error: error.message
    });
  }
};

// @desc    Удаление здания
// @route   DELETE /api/buildings/:id
// @access  Private/Admin
const deleteBuilding = async (req, res) => {
  try {
    const building = await Building.findById(req.params.id);
    
    if (building) {
      // Удаление всех связанных этажей
      await Floor.deleteMany({ buildingId: building._id });
      
      // Удаление всех связанных извещателей
      await FireAlarm.deleteMany({ buildingId: building._id });
      
      // Удаление здания
      await building.remove();
      
      res.json({ 
        success: true, 
        message: 'Здание и все связанные данные удалены' 
      });
    } else {
      res.status(404).json({ 
        success: false, 
        message: 'Здание не найдено' 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при удалении здания',
      error: error.message
    });
  }
};

// @desc    Поиск зданий по адресу
// @route   GET /api/buildings/search
// @access  Private
const searchBuildings = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ 
        success: false, 
        message: 'Необходимо указать поисковый запрос' 
      });
    }
    
    const buildings = await Building.find({
      $text: { $search: query }
    })
      .populate('createdBy', 'username firstName lastName')
      .populate('dutyOfficers', 'username firstName lastName');
    
    res.json({ 
      success: true, 
      buildings,
      count: buildings.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при поиске зданий',
      error: error.message
    });
  }
};

module.exports = {
  getBuildings,
  getBuildingById,
  createBuilding,
  updateBuilding,
  deleteBuilding,
  searchBuildings,
};