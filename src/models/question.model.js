const mongoose = require('mongoose');

const traitImpactSchema = new mongoose.Schema(
  {
    traitName: { type: String, required: true, trim: true },
    traitValue: { type: String, required: true, trim: true },
    priority: { type: String, enum: ['primary', 'fallback'], default: 'primary' }
  },
  { _id: false }
);

const optionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    isCorrect: { type: Boolean, default: false },
    traitImpacts: { type: [traitImpactSchema], default: [] }
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    section: { type: Number, required: true, min: 1, max: 4 },
    sectionTitle: { type: String, required: true, trim: true },
    order: { type: Number, required: true, min: 1 },
    prompt: { type: String, required: true, trim: true },
    imageUrl: { type: String, default: null },
    questionType: {
      type: String,
      enum: ['mcq', 'text', 'memory_preview', 'memory_grid', 'canvas_connect'],
      required: true
    },
    inputConstraint: {
      type: String,
      enum: ['any', 'numbers_only', 'letters_only'],
      default: 'any'
    },
    timeLimitSeconds: { type: Number, required: true, min: 1 },
    points: { type: Number, default: 0, min: 0 },
    acceptedAnswers: { type: [String], default: [] },
    options: { type: [optionSchema], default: [] },
    gridConfig: {
      rows: { type: Number, default: 2 },
      cols: { type: Number, default: 3 },
      correctCellIndex: { type: Number, default: null }
    },
    canvasConfig: {
      colors: { type: [String], default: [] },
      requiredPairs: { type: Number, default: 4 }
    },
    isActive: { type: Boolean, default: true },
    adminNote: { type: String, default: '', trim: true }
  },
  { timestamps: true }
);

questionSchema.index({ section: 1, order: 1 });

module.exports = mongoose.model('Question', questionSchema);
