require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
const connectDB = require('./config/db');
const { initializeSocket } = require('./websocket/socket');
const logger = require('./utils/logger');
const errorHandler = require('./middlewares/errorHandler');

// Маршруты
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const buildingRoutes = require('./routes/buildingRoutes');
const floorRoutes = require('./routes/floorRoutes');
const alarmRoutes = require('./routes/alarmRoutes');
const alarmHistoryRoutes = require('./routes/alarmHistoryRoutes');
const brigadeRoutes = require('./routes/brigadeRoutes');
const changeRoutes = require('./routes/changeRoutes');

// Подключение к базе данных
connectDB();

// Инициализация приложения
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Логирование запросов в режиме разработки
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Статический каталог для загруженных файлов
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Маршруты API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/buildings', buildingRoutes);
app.use('/api/floors', floorRoutes);
app.use('/api/alarms', alarmRoutes);
app.use('/api/alarm-history', alarmHistoryRoutes);
app.use('/api/brigades', brigadeRoutes);
app.use('/api/changes', changeRoutes);

// Стандартный маршрут
app.get('/', (req, res) => {
  res.json({ message: 'Fire Alarm System API' });
});

// Обработка ошибок
app.use(errorHandler);

// Создание HTTP сервера
const server = http.createServer(app);

// Инициализация WebSocket
initializeSocket(server)
  .then(() => {
    logger.info('WebSocket server initialized successfully');
  })
  .catch((error) => {
    logger.error(`Failed to initialize WebSocket server: ${error.message}`);
  });

// Запуск сервера
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Обработка необработанных исключений
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});

// Обработка необработанных отклонений промисов
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});