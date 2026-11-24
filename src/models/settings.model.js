const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    singletonKey: { type: String, default: 'GLOBAL_SETTINGS', unique: true },
    examTitle: {
      type: String,
      default: 'اختبار الذكاء وتحليل الشخصية (من عمر 25 لما فوق 40 عام)',
      trim: true
    },
    baseExamPrice: { type: Number, default: 250, min: 0 },
    retakeMultiplier: { type: Number, default: 2, min: 1 },
    iqScaleMin: { type: Number, default: 70 },
    iqScaleMax: { type: Number, default: 145 },
    iqBands: {
      lowMax: { type: Number, default: 89 },
      averageMax: { type: Number, default: 115 }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
