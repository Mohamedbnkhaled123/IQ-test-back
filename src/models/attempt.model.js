const mongoose = require('mongoose');

const sectionScoreSchema = new mongoose.Schema(
  {
    earned: { type: Number, default: 0 },
    max: { type: Number, default: 0 }
  },
  { _id: false }
);

const attemptSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    attemptNumber: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ['in_progress', 'submitted'], default: 'in_progress' },
    grantId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamGrant', required: true },
    grantSource: {
      type: String,
      enum: ['self_purchase', 'user_purchase', 'admin_complimentary', 'manual_admin'],
      required: true
    },
    purchasedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    answers: { type: [mongoose.Schema.Types.Mixed], default: [] },
    sectionScores: {
      section1: { type: sectionScoreSchema, default: () => ({ earned: 0, max: 0 }) },
      section2: { type: sectionScoreSchema, default: () => ({ earned: 0, max: 0 }) },
      section3: { type: sectionScoreSchema, default: () => ({ earned: 0, max: 0 }) }
    },
    rawScore: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    iqScore: { type: Number, default: 70 },
    iqClassification: { type: String, default: '' },
    personalityProfile: {
      type: [{ traitName: String, traitValue: String }],
      default: []
    },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

attemptSchema.index({ userId: 1, createdAt: -1 });
attemptSchema.index({ purchasedByUserId: 1, createdAt: -1 });

module.exports = mongoose.model('Attempt', attemptSchema);
