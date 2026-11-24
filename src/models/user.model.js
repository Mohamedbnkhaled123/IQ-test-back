const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    normalizedName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    normalizedPhone: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    age: { type: Number, required: true, min: 0 },
    occupation: { type: String, required: true, trim: true },
    hobbies: { type: String, required: true, trim: true },
    selfIqRating: {
      type: String,
      enum: ['ذكاء عالي', 'ذكاء متوسط', 'أقل من المتوسط'],
      required: true
    },
    completedAttemptsCount: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

userSchema.index({ normalizedName: 1, normalizedPhone: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
