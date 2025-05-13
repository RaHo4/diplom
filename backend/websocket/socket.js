const socketIo = require('socket.io');
const { createAdapter } = require('@socket.io/mongo-adapter');
const { MongoClient } = require('mongodb');
const logger = require('../utils/logger');

let io;

const initializeSocket = async (server) => {
  try {
    // Подключение к MongoDB для адаптера Socket.IO
    const mongoClient = new MongoClient(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    await mongoClient.connect();
    
    const mongoCollection = mongoClient.db('fire_alarm_db').collection('socket.io-adapter-events');
    
    // Создание индекса для MongoDB адаптера
    await mongoCollection.createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: 3600 }
    );
    
    // Инициализация Socket.IO
    io = socketIo(server, {
      cors: {
        origin: process.env.CLIENT_URL || '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });
    
    // Применение MongoDB адаптера для масштабирования
    io.adapter(createAdapter(mongoCollection));
    
    // Обработка соединений
    io.on('connection', (socket) => {
      logger.info(`New WebSocket connection: ${socket.id}`);
      
      // Аутентификация
      socket.on('authenticate', (token) => {
        try {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          
          // Сохранение userId и role в объекте сокета
          socket.userId = decoded.id;
          socket.userRole = decoded.role;
          
          // Присоединение к комнате по роли
          socket.join(`role:${decoded.role}`);
          
          logger.info(`Socket ${socket.id} authenticated as userId: ${socket.userId}, role: ${socket.userRole}`);
          
          socket.emit('authenticated', { userId: socket.userId, role: socket.userRole });
        } catch (error) {
          logger.error(`Socket ${socket.id} authentication failed: ${error.message}`);
          socket.emit('authentication_error', { message: 'Authentication failed' });
        }
      });
      
      // Подписка на определенное здание
      socket.on('subscribe_building', (buildingId) => {
        if (socket.userId) {
          socket.join(`building:${buildingId}`);
          logger.info(`Socket ${socket.id} subscribed to building: ${buildingId}`);
        }
      });
      
      // Отписка от здания
      socket.on('unsubscribe_building', (buildingId) => {
        socket.leave(`building:${buildingId}`);
        logger.info(`Socket ${socket.id} unsubscribed from building: ${buildingId}`);
      });
      
      // Подписка на бригаду (для пожарных)
      socket.on('subscribe_brigade', (brigadeId) => {
        if (socket.userId && socket.userRole === 'firefighter') {
          socket.join(`brigade:${brigadeId}`);
          logger.info(`Socket ${socket.id} subscribed to brigade: ${brigadeId}`);
        }
      });
      
      // Отключение
      socket.on('disconnect', () => {
        logger.info(`WebSocket disconnected: ${socket.id}`);
      });
    });
    
    logger.info('WebSocket server initialized');
  } catch (error) {
    logger.error(`Error initializing WebSocket server: ${error.message}`);
    throw error;
  }
};

module.exports = {
  initializeSocket,
  getIo: () => io,
  io: io,
};