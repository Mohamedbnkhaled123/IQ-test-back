const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    buyerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    paymentType: {
      type: String,
      enum: ['self_purchase', 'bulk_purchase'],
      required: true
    },
    expectedAmount: { type: Number, required: true, min: 0 },
    detectedAmount: { type: Number, default: 0 },
    method: { type: String, enum: ['instapay', 'wallet'], required: true },
    referenceId: { type: String, trim: true, unique: true, sparse: true },
    isLikelyAuthentic: { type: Boolean, default: false },
    aiConfidence: { type: Number, default: 0 },
    aiReason: { type: String, default: '', trim: true },
    status: { type: String, enum: ['verified', 'rejected'], required: true }
  },
  { timestamps: true }
);

paymentSchema.index({ buyerUserId: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
