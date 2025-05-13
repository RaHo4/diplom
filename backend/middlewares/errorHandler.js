const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  // Логирование ошибки
  logger.error(`${err.name}: ${err.message}`);
  
  // Проверка ошибок MongoDB
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      message: errors.join(', ')
    });
  }

  // Ошибка дублирования (например, уникальные email/username)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} уже используется`
    });
  }

  // Ошибка CastError (некорректный ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Некорректный ID: ${err.value}`
    });
  }

  // Общая ошибка
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Ошибка сервера'
  });
};

module.exports = errorHandler;