const User = require('../models/user.model');
const Question = require('../models/question.model');
const ExamGrant = require('../models/exam-grant.model');
const Attempt = require('../models/attempt.model');
const Payment = require('../models/payment.model');
const { AppError } = require('../utils/app-error');
const { toUserDTO, toFinalResultDTO } = require('../utils/sanitizer.util');
const { getOrCreateSettings, createGrant } = require('./grant.service');

async function getAdminOverview() {
  const [users, attempts, grants, payments, settings] = await Promise.all([
    User.find().sort({ createdAt: -1 }),
    Attempt.find({ status: 'submitted' }).populate('userId', 'name phone').sort({ submittedAt: -1 }),
    ExamGrant.find().sort({ createdAt: -1 }),
    Payment.find().populate('buyerUserId', 'name phone').sort({ createdAt: -1 }),
    getOrCreateSettings()
  ]);
  const totalRevenue = payments
    .filter((p) => p.status === 'verified')
    .reduce((sum, p) => sum + (Number(p.expectedAmount) || 0), 0);
  return {
    stats: {
      totalUsers: users.length,
      totalAttempts: attempts.length,
      availableGrants: grants.filter((g) => g.status === 'available').length,
      totalPayments: payments.length,
      totalRevenue
    },
    settings,
    users: users.map(toUserDTO),
    attempts: attempts.map((a) => toFinalResultDTO(a, a.userId)),
    grants,
    payments
  };
}

async function listQuestions() {
  return Question.find().sort({ section: 1, order: 1 });
}

async function createQuestion(payload) {
  return Question.create(payload);
}

async function updateQuestion(questionId, payload) {
  const updated = await Question.findByIdAndUpdate(questionId, payload, { new: true, runValidators: true });
  if (!updated) throw new AppError('السؤال غير موجود', 404, 'NOT_FOUND');
  return updated;
}

async function deleteQuestion(questionId) {
  const deleted = await Question.findByIdAndDelete(questionId);
  if (!deleted) throw new AppError('السؤال غير موجود', 404, 'NOT_FOUND');
  return { deletedId: deleted._id };
}

async function getSettings() {
  return getOrCreateSettings();
}

async function updateSettings(payload) {
  const settings = await getOrCreateSettings();
  Object.assign(settings, payload);
  await settings.save();
  return settings;
}

async function createAdminGrant(payload) {
  return createGrant({
    nomineeName: payload.nomineeName,
    nomineePhone: payload.nomineePhone,
    source: payload.source || 'admin_complimentary',
    amountPaid: payload.amountPaid || 0
  });
}

async function deleteAdminGrant(grantId) {
  const grant = await ExamGrant.findById(grantId);
  if (!grant) throw new AppError('التذكرة غير موجودة', 404, 'NOT_FOUND');
  if (grant.status !== 'available') {
    throw new AppError('لا يمكن حذف تذكرة مستخدمة أو قيد الاستخدام', 400, 'GRANT_IN_USE');
  }
  await grant.deleteOne();
  return { deletedId: grantId };
}

function resolveUploadedImage(file) {
  if (!file || !file.filename) {
    throw new AppError('يرجى اختيار صورة صالحة للرفع', 400, 'IMAGE_REQUIRED');
  }
  return { imageUrl: `/exam-images/${file.filename}` };
}

module.exports = {
  getAdminOverview,
  listQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getSettings,
  updateSettings,
  createAdminGrant,
  deleteAdminGrant,
  resolveUploadedImage
};
