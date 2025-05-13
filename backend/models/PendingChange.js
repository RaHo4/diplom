const mongoose = require('mongoose');

const pendingChangeSchema = mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['alarm-position', 'building-plan', 'floor-plan'],
      required: true,
    },
    buildingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Building',
      required: true,
    },
    floorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Floor',
      default: null,
    },
    alarmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FireAlarm',
      default: null,
    },
    changes: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  }
);

// Индексы
pendingChangeSchema.index({ status: 1 });
pendingChangeSchema.index({ buildingId: 1 });
pendingChangeSchema.index({ requestedBy: 1 });

const PendingChange = mongoose.model('PendingChange', pendingChangeSchema);

module.exports = PendingChange;