const mongoose = require('mongoose');

const examGrantSchema = new mongoose.Schema(
  {
    nomineeName: { type: String, required: true, trim: true },
    normalizedName: { type: String, required: true, trim: true },
    nomineePhone: { type: String, required: true, trim: true },
    normalizedPhone: { type: String, required: true, trim: true },
    source: {
      type: String,
      enum: ['self_purchase', 'user_purchase', 'admin_complimentary', 'manual_admin'],
      required: true
    },
    buyerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },
    amountPaid: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['available', 'in_use', 'consumed'],
      default: 'available'
    },
    attemptId: { type: mongoose.Schema.Types.ObjectId, ref: 'Attempt', default: null },
    consumedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

examGrantSchema.index({ normalizedName: 1, normalizedPhone: 1, status: 1 });

module.exports = mongoose.model('ExamGrant', examGrantSchema);
