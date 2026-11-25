const Settings = require('../models/settings.model');
const ExamGrant = require('../models/exam-grant.model');
const Attempt = require('../models/attempt.model');
const { env } = require('../config/env');
const { normalizeArabicText, normalizePhone, calculateNextAttemptPrice } = require('../utils/normalize.util');
const { toUserDTO, toFinalResultDTO } = require('../utils/sanitizer.util');
const { store } = require('./demo-store.service');

async function getOrCreateSettings() {
  if (env.demoNoDbMode) return store.settings;
  let settings = await Settings.findOne({ singletonKey: 'GLOBAL_SETTINGS' });
  if (!settings) {
    settings = await Settings.create({ singletonKey: 'GLOBAL_SETTINGS' });
  }
  return settings;
}

async function findAvailableGrant(normalizedName, normalizedPhone) {
  return ExamGrant.findOne({
    normalizedName,
    normalizedPhone,
    status: 'available'
  }).sort({ createdAt: 1 });
}

async function reserveAvailableGrant(normalizedName, normalizedPhone, model = ExamGrant) {
  return model.findOneAndUpdate(
    { normalizedName, normalizedPhone, status: 'available' },
    { $set: { status: 'in_use' } },
    { new: true, sort: { createdAt: 1 } }
  );
}

async function consumeGrant(grantId, attemptId, model = ExamGrant) {
  return model.findByIdAndUpdate(
    grantId,
    { $set: { status: 'consumed', attemptId, consumedAt: new Date() } },
    { new: true }
  );
}

async function createGrant({ nomineeName, nomineePhone, source, buyerUserId = null, paymentId = null, amountPaid = 0 }) {
  return ExamGrant.create({
    nomineeName: nomineeName.trim(),
    normalizedName: normalizeArabicText(nomineeName),
    nomineePhone: nomineePhone.trim(),
    normalizedPhone: normalizePhone(nomineePhone),
    source,
    buyerUserId,
    paymentId,
    amountPaid,
    status: 'available'
  });
}

function formatPurchasedGrant(grant) {
  const attempt = grant.attemptId && grant.attemptId.status === 'submitted'
    ? toFinalResultDTO(grant.attemptId, { name: grant.nomineeName })
    : null;
  return {
    _id: grant._id,
    nomineeName: grant.nomineeName,
    nomineePhone: grant.nomineePhone,
    status: grant.status,
    source: grant.source,
    amountPaid: grant.amountPaid,
    createdAt: grant.createdAt,
    consumedAt: grant.consumedAt,
    attempt
  };
}

async function getDashboardData(user) {
  const settings = await getOrCreateSettings();
  if (env.demoNoDbMode) {
    const baseExamPrice = settings.baseExamPrice;
    const retakePrice = baseExamPrice * settings.retakeMultiplier;
    const myAttempts = Array.from(store.attempts.values()).filter((a) => a.examineeName === user.name);
    return {
      user: toUserDTO(user),
      hasAvailableGrant: true,
      availableGrant: { _id: 'demo_grant', status: 'available', source: 'admin_complimentary', amountPaid: 0 },
      nextAttemptPrice: calculateNextAttemptPrice(user.completedAttemptsCount || 0, baseExamPrice, settings.retakeMultiplier),
      baseExamPrice,
      retakePrice,
      myAttempts,
      purchasedGrants: []
    };
  }
  const [availableGrant, attempts, purchased] = await Promise.all([
    findAvailableGrant(user.normalizedName, user.normalizedPhone),
    Attempt.find({ userId: user._id, status: 'submitted' }).sort({ submittedAt: -1 }),
    ExamGrant.find({ buyerUserId: user._id, source: 'user_purchase' })
      .populate('attemptId')
      .sort({ createdAt: -1 })
  ]);
  const baseExamPrice = settings.baseExamPrice;
  const retakePrice = baseExamPrice * settings.retakeMultiplier;
  const nextAttemptPrice = calculateNextAttemptPrice(
    user.completedAttemptsCount,
    baseExamPrice,
    settings.retakeMultiplier
  );
  return {
    user: toUserDTO(user),
    hasAvailableGrant: Boolean(availableGrant) || env.freePreviewMode,
    availableGrant,
    nextAttemptPrice,
    baseExamPrice,
    retakePrice,
    myAttempts: attempts.map((a) => toFinalResultDTO(a, user)),
    purchasedGrants: purchased.map(formatPurchasedGrant)
  };
}

module.exports = {
  getOrCreateSettings,
  findAvailableGrant,
  reserveAvailableGrant,
  consumeGrant,
  createGrant,
  getDashboardData
};
