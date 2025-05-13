const mongoose = require('mongoose');

const floorSchema = mongoose.Schema(
  {
    buildingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Building',
      required: true,
    },
    floorNumber: {
      type: Number,
      required: true,
    },
    planImagePath: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['normal', 'fire', 'maintenance'],
      default: 'normal',
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  }
);

// Составной уникальный индекс для пары buildingId-floorNumber
floorSchema.index({ buildingId: 1, floorNumber: 1 }, { unique: true });

const Floor = mongoose.model('Floor', floorSchema);

module.exports = Floor;