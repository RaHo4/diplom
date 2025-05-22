const Floor = require("../models/Floor");
const Building = require("../models/Building");
const FireAlarm = require("../models/FireAlarm");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Настройка загрузки изображений
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "./uploads/floors";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(
      null,
      `building_${req.body.buildingId}_floor_${
        req.body.floorNumber
      }_${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 5MB максимальный размер
  },
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(
        new Error("Только изображения (jpeg, jpg, png) допустимы для загрузки!")
      );
    }
  },
}).single("planImage");

// @desc    Получение всех этажей здания
// @route   GET /api/floors/building/:buildingId
// @access  Private
const getFloorsByBuilding = async (req, res) => {
  try {
    const { buildingId } = req.params;

    // Проверка существования здания
    const building = await Building.findById(buildingId);
    if (!building) {
      return res.status(404).json({
        success: false,
        message: "Здание не найдено",
      });
    }

    const floors = await Floor.find({ buildingId }).sort("floorNumber");

    res.json({ success: true, floors });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Ошибка при получении этажей",
      error: error.message,
    });
  }
};

// @desc    Получение этажа по ID
// @route   GET /api/floors/:id
// @access  Private
const getFloorById = async (req, res) => {
  try {
    const floor = await Floor.findById(req.params.id);

    if (floor) {
      res.json({ success: true, floor });
    } else {
      res.status(404).json({
        success: false,
        message: "Этаж не найден",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Ошибка при получении этажа",
      error: error.message,
    });
  }
};

// @desc    Добавление этажа
// @route   POST /api/floors
// @access  Private/Admin
const addFloor = async (req, res) => {
  try {
    upload(req, res, async function (err) {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      // console.log(req.body._parts);

      const { buildingId, floorNumber } = req.body;

      // console.log(image, buildingId, floorNumber);

      // Проверка существования здания
      const building = await Building.findById(buildingId);
      if (!building) {
        return res.status(404).json({
          success: false,
          message: "Здание не найдено",
        });
      }

      // Проверка номера этажа
      if (floorNumber <= 0 || floorNumber > building.floors) {
        return res.status(400).json({
          success: false,
          message: `Номер этажа должен быть от 1 до ${building.floors}`,
        });
      }

      // Проверка, не существует ли уже этаж с таким номером в здании
      const existingFloor = await Floor.findOne({ buildingId, floorNumber });
      if (existingFloor) {
        return res.status(400).json({
          success: false,
          message: "Этаж с таким номером уже существует в данном здании",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Необходимо загрузить план этажа",
        });
      }

      const floor = await Floor.create({
        buildingId,
        floorNumber,
        planImagePath: req.file.path,
        status: "normal",
      });

      res.status(201).json({
        success: true,
        floor,
        message: "Этаж успешно добавлен",
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Ошибка при добавлении этажа",
      error: error.message,
    });
  }
};

// @desc    Обновление этажа
// @route   PUT /api/floors/:id
// @access  Private/Admin
const updateFloor = async (req, res) => {
  try {
    upload(req, res, async function (err) {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      const floor = await Floor.findById(req.params.id);

      if (!floor) {
        return res.status(404).json({
          success: false,
          message: "Этаж не найден",
        });
      }

      const { status } = req.body;

      if (status) {
        floor.status = status;
      }

      console.log(req.file);

      // Обновление плана этажа, если был загружен новый
      if (req.file) {
        // Удаление старого файла
        if (floor.planImagePath && fs.existsSync(floor.planImagePath)) {
          fs.unlinkSync(floor.planImagePath);
        }

        floor.planImagePath = req.file.path;
      }

      floor.updatedAt = Date.now();

      const updatedFloor = await floor.save();

      res.json({
        success: true,
        floor: updatedFloor,
        message: "Этаж успешно обновлен",
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Ошибка при обновлении этажа",
      error: error.message,
    });
  }
};

// @desc    Удаление этажа
// @route   DELETE /api/floors/:id
// @access  Private/Admin
const deleteFloor = async (req, res) => {
  try {
    const floor = await Floor.findById(req.params.id);

    if (!floor) {
      return res.status(404).json({
        success: false,
        message: "Этаж не найден",
      });
    }

    // Удаление файла плана этажа
    if (floor.planImagePath && fs.existsSync(floor.planImagePath)) {
      fs.unlinkSync(floor.planImagePath);
    }

    // Удаление всех извещателей на этаже
    await FireAlarm.deleteMany({ floorId: floor._id });

    // Удаление этажа
    await floor.remove();

    res.json({
      success: true,
      message: "Этаж и все связанные данные удалены",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Ошибка при удалении этажа",
      error: error.message,
    });
  }
};

module.exports = {
  getFloorsByBuilding,
  getFloorById,
  addFloor,
  updateFloor,
  deleteFloor,
};
