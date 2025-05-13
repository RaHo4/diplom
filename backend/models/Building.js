const mongoose = require('mongoose');

const buildingSchema = mongoose.Schema(
  {
    address: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    floors: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ['normal', 'fire', 'maintenance'],
      default: 'normal',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    dutyOfficers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
  {
    timestamps: true,
  }
);

// Индекс для поиска по адресу
buildingSchema.index({ address: 'text', name: 'text' });

const Building = mongoose.model('Building', buildingSchema);

module.exports = Building;