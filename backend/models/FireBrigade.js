const mongoose = require('mongoose');

const fireBrigadeSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    members: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    currentAssignment: {
      buildingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Building',
        default: null,
      },
      assignedAt: {
        type: Date,
        default: null,
      },
      assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      status: {
        type: String,
        enum: ['en-route', 'on-site', 'returning', 'available'],
        default: 'available',
      },
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  }
);

// Индексы
fireBrigadeSchema.index({ isAvailable: 1 });
fireBrigadeSchema.index({ 'currentAssignment.status': 1 });

const FireBrigade = mongoose.model('FireBrigade', fireBrigadeSchema);

module.exports = FireBrigade;