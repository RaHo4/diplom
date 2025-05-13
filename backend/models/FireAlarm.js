const mongoose = require('mongoose');

const fireAlarmSchema = mongoose.Schema(
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
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['normal', 'alarm', 'fault', 'disabled'],
      default: 'normal',
    },
    coordinates: {
      x: {
        type: Number,
        required: true,
      },
      y: {
        type: Number,
        required: true,
      },
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  }
);

// Индексы для быстрого поиска по зданию и этажу
fireAlarmSchema.index({ buildingId: 1 });
fireAlarmSchema.index({ floorId: 1 });
fireAlarmSchema.index({ status: 1 });

const FireAlarm = mongoose.model('FireAlarm', fireAlarmSchema);

module.exports = FireAlarm;