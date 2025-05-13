const mongoose = require('mongoose');

const alarmHistorySchema = mongoose.Schema(
  {
    buildingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Building',
      required: true,
    },
    floorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Floor',
      required: true,
    },
    alarmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FireAlarm',
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  }
);

// Индексы для быстрого поиска
alarmHistorySchema.index({ buildingId: 1 });
alarmHistorySchema.index({ alarmId: 1 });
alarmHistorySchema.index({ timestamp: -1 });

const AlarmHistory = mongoose.model('AlarmHistory', alarmHistorySchema);

module.exports = AlarmHistory;