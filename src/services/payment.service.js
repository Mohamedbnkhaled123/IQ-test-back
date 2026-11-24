const Payment = require('../models/payment.model');
const { AppError } = require('../utils/app-error');
const { calculateNextAttemptPrice } = require('../utils/normalize.util');
const { getPaymentConfig, buildWhatsappUrl } = require('../config/payment.config');
const { getOrCreateSettings, createGrant } = require('./grant.service');
const { verifyReceiptWithGemini } = require('./gemini-receipt.service');

async function getPaymentInfo() {
  const settings = await getOrCreateSettings();
  const config = getPaymentConfig();
  return {
    ...config,
    baseExamPrice: settings.baseExamPrice,
    retakeMultiplier: settings.retakeMultiplier,
    retakePrice: settings.baseExamPrice * settings.retakeMultiplier
  };
}

function buildRejectionReason(ai, expectedAmount) {
  if (ai.receiverMismatch) return 'بيانات المستلم في الإيصال لا تطابق رقم الاستلام المعتمد';
  if (ai.detectedAmount < expectedAmount) return `المبلغ المحول (${ai.detectedAmount}) أقل من المطلوب (${expectedAmount} ج.م)`;
  if (!ai.isLikelyAuthentic || ai.aiConfidence < 0.75) return ai.reason || 'لم يتم التأكد من صحة الإيصال';
  return ai.reason || 'تعذر التحقق من الإيصال';
}

async function assertNoDuplicateReference(referenceId, PaymentModel = Payment) {
  if (!referenceId) return;
  const existing = await PaymentModel.findOne({ referenceId: String(referenceId).trim() });
  if (existing) {
    throw new AppError('تم استخدام رقم العملية المرجعي هذا من قبل', 409, 'DUPLICATE_REFERENCE_ID');
  }
}

async function evaluateAndRecordPayment({ user, method, expectedAmount, paymentType, file, deps = {} }) {
  if (!file || !file.buffer) {
    throw new AppError('يرجى إرفاق صورة إيصال التحويل', 400, 'RECEIPT_REQUIRED');
  }
  const verifyFn = deps.verifyReceiptWithGemini || verifyReceiptWithGemini;
  const PaymentModel = deps.Payment || Payment;
  const ai = await verifyFn({ buffer: file.buffer, mimetype: file.mimetype, method, expectedAmount });
  await assertNoDuplicateReference(ai.referenceId, PaymentModel);

  const isRejected = !ai.isLikelyAuthentic || ai.aiConfidence < 0.75 || ai.detectedAmount < expectedAmount || ai.receiverMismatch;
  const reason = isRejected ? buildRejectionReason(ai, expectedAmount) : ai.reason;
  const paymentDoc = {
    buyerUserId: user._id,
    paymentType,
    expectedAmount,
    detectedAmount: ai.detectedAmount,
    method,
    isLikelyAuthentic: ai.isLikelyAuthentic,
    aiConfidence: ai.aiConfidence,
    aiReason: reason,
    status: isRejected ? 'rejected' : 'verified'
  };
  if (ai.referenceId) paymentDoc.referenceId = ai.referenceId;

  const payment = await PaymentModel.create(paymentDoc);
  if (isRejected) {
    const whatsappUrl = buildWhatsappUrl({ name: user.name, phone: user.phone, expectedAmount, reason });
    throw new AppError(reason, 422, 'RECEIPT_REJECTED', { reason, whatsappUrl });
  }
  return payment;
}

async function verifySelfPayment(user, { method, file }) {
  const settings = await getOrCreateSettings();
  const expectedAmount = calculateNextAttemptPrice(
    user.completedAttemptsCount,
    settings.baseExamPrice,
    settings.retakeMultiplier
  );
  const payment = await evaluateAndRecordPayment({
    user, method, expectedAmount, paymentType: 'self_purchase', file
  });
  const grant = await createGrant({
    nomineeName: user.name,
    nomineePhone: user.phone,
    source: 'self_purchase',
    buyerUserId: user._id,
    paymentId: payment._id,
    amountPaid: expectedAmount
  });
  return { payment, grant };
}

async function verifyBulkPayment(user, { method, nominees, file }) {
  const settings = await getOrCreateSettings();
  const unitPrice = settings.baseExamPrice;
  const expectedAmount = nominees.length * unitPrice;
  const payment = await evaluateAndRecordPayment({
    user, method, expectedAmount, paymentType: 'bulk_purchase', file
  });
  const grants = await Promise.all(
    nominees.map((nominee) => createGrant({
      nomineeName: nominee.name,
      nomineePhone: nominee.phone,
      source: 'user_purchase',
      buyerUserId: user._id,
      paymentId: payment._id,
      amountPaid: unitPrice
    }))
  );
  return { payment, grants };
}

module.exports = {
  getPaymentInfo,
  assertNoDuplicateReference,
  evaluateAndRecordPayment,
  verifySelfPayment,
  verifyBulkPayment
};
