const { getIo } = require('./socket');
const logger = require('../utils/logger');

// Отправка уведомления о срабатывании тревоги
const notifyAlarmTriggered = (alarmData) => {
  try {
    const io = getIo();
    if (!io) {
      logger.error('Socket.IO not initialized');
      return;
    }
    
    // Отправка всем диспетчерам
    io.to('role:dispatcher').emit('alarm-triggered', alarmData);
    
    // Отправка всем администраторам
    io.to('role:admin').emit('alarm-triggered', alarmData);
    
    // Отправка всем подписанным на это здание
    io.to(`building:${alarmData.buildingId}`).emit('alarm-triggered', alarmData);
    
    logger.info(`Alarm triggered notification sent: ${JSON.stringify(alarmData)}`);
  } catch (error) {
    logger.error(`Error sending alarm triggered notification: ${error.message}`);
  }
};

// Отправка уведомления о назначении бригады
const notifyBrigadeAssigned = (assignmentData) => {
  try {
    const io = getIo();
    if (!io) {
      logger.error('Socket.IO not initialized');
      return;
    }
    
    // Отправка бригаде
    io.to(`brigade:${assignmentData.brigadeId}`).emit('brigade-assigned', assignmentData);
    
    // Отправка диспетчерам
    io.to('role:dispatcher').emit('brigade-assigned', assignmentData);
    
    logger.info(`Brigade assignment notification sent: ${JSON.stringify(assignmentData)}`);
  } catch (error) {
    logger.error(`Error sending brigade assignment notification: ${error.message}`);
  }
};

// Отправка уведомления об обновлении статуса бригады
const notifyBrigadeStatusUpdated = (statusData) => {
  try {
    const io = getIo();
    if (!io) {
      logger.error('Socket.IO not initialized');
      return;
    }
    
    // Отправка всем диспетчерам
    io.to('role:dispatcher').emit('brigade-status-updated', statusData);
    
    // Отправка самой бригаде
    io.to(`brigade:${statusData.brigadeId}`).emit('brigade-status-updated', statusData);
    
    logger.info(`Brigade status update notification sent: ${JSON.stringify(statusData)}`);
  } catch (error) {
    logger.error(`Error sending brigade status update notification: ${error.message}`);
  }
};

// Отправка уведомления об одобрении/отклонении запроса на изменение
const notifyChangeRequestProcessed = (changeData) => {
  try {
    const io = getIo();
    if (!io) {
      logger.error('Socket.IO not initialized');
      return;
    }
    
    // Отправка пользователю, создавшему запрос
    io.to(`user:${changeData.requestedBy}`).emit('change-request-processed', changeData);
    
    logger.info(`Change request processed notification sent: ${JSON.stringify({
      id: changeData._id,
      status: changeData.status,
      requestedBy: changeData.requestedBy,
    })}`);
  } catch (error) {
    logger.error(`Error sending change request processed notification: ${error.message}`);
  }
};

module.exports = {
  notifyAlarmTriggered,
  notifyBrigadeAssigned,
  notifyBrigadeStatusUpdated,
  notifyChangeRequestProcessed,
};