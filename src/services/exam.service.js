const Question = require('../models/question.model');
const Attempt = require('../models/attempt.model');
const User = require('../models/user.model');
const ExamGrant = require('../models/exam-grant.model');
const { env } = require('../config/env');
const { AppError } = require('../utils/app-error');
const { toStudentQuestionDTO, toFinalResultDTO } = require('../utils/sanitizer.util');
const { getOrCreateSettings, reserveAvailableGrant, consumeGrant, createGrant } = require('./grant.service');
const { scoreExam } = require('./scoring/scoring.engine');
const { store, encodeDemoResultId, decodeDemoResultId } = require('./demo-store.service');

function startDemoExam(user) {
  const activeQuestions = store.questions.filter((q) => q.isActive !== false);
  return {
    attemptId: `demo_pending_${Date.now()}`,
    grantId: 'demo_grant',
    startedAt: new Date(),
    examTitle: store.settings.examTitle,
    questions: activeQuestions.map(toStudentQuestionDTO)
  };
}

function submitDemoExam(user, answers) {
  const activeQuestions = store.questions.filter((q) => q.isActive !== false);
  const scored = scoreExam({ questions: activeQuestions, answers, settings: store.settings });
  user.completedAttemptsCount = (user.completedAttemptsCount || 0) + 1;
  const resultDto = {
    attemptId: '',
    examineeName: user.name,
    attemptNumber: user.completedAttemptsCount,
    submittedAt: new Date(),
    sectionScores: scored.sectionScores,
    rawScore: scored.rawScore,
    maxScore: scored.maxScore,
    iqScore: scored.iqScore,
    iqClassification: scored.iqClassification,
    personalityProfile: scored.personalityProfile
  };
  const attemptId = encodeDemoResultId(resultDto);
  resultDto.attemptId = attemptId;
  store.attempts.set(attemptId, resultDto);
  return { attemptId };
}

async function reserveOrCreatePreviewGrant(user, GrantModel, deps) {
  let grant = await reserveAvailableGrant(user.normalizedName, user.normalizedPhone, GrantModel);
  const allowFreePreview = deps.freePreviewMode ?? (!deps.ExamGrant && env.freePreviewMode);
  if (!grant && allowFreePreview) {
    await createGrant({
      nomineeName: user.name,
      nomineePhone: user.phone,
      source: 'admin_complimentary',
      amountPaid: 0
    });
    grant = await reserveAvailableGrant(user.normalizedName, user.normalizedPhone, GrantModel);
  }
  if (!grant) {
    throw new AppError('يرجى إتمام الدفع أو الحصول على تذكرة اختبار قبل البدء', 402, 'PAYMENT_REQUIRED');
  }
  return grant;
}

async function startExam(user, deps = {}) {
  if (env.demoNoDbMode && !deps.ExamGrant) {
    return startDemoExam(user);
  }
  const GrantModel = deps.ExamGrant || ExamGrant;
  const QuestionModel = deps.Question || Question;
  const AttemptModel = deps.Attempt || Attempt;
  const getSettingsFn = deps.getOrCreateSettings || getOrCreateSettings;

  const grant = await reserveOrCreatePreviewGrant(user, GrantModel, deps);
  try {
    const [settings, questions] = await Promise.all([
      getSettingsFn(),
      QuestionModel.find({ isActive: true }).sort({ section: 1, order: 1 })
    ]);
    const attempt = await AttemptModel.create({
      userId: user._id,
      attemptNumber: (user.completedAttemptsCount || 0) + 1,
      status: 'in_progress',
      grantId: grant._id,
      grantSource: grant.source,
      purchasedByUserId: grant.source === 'user_purchase' ? grant.buyerUserId : null,
      startedAt: new Date()
    });
    return {
      attemptId: attempt._id,
      grantId: grant._id,
      startedAt: attempt.startedAt,
      examTitle: settings.examTitle,
      questions: questions.map(toStudentQuestionDTO)
    };
  } catch (err) {
    await GrantModel.findByIdAndUpdate(grant._id, { $set: { status: 'available' } });
    throw err;
  }
}

async function submitExam(user, attemptId, answers, deps = {}) {
  if (env.demoNoDbMode && !deps.Attempt && String(attemptId).startsWith('demo_')) {
    return submitDemoExam(user, answers);
  }
  const AttemptModel = deps.Attempt || Attempt;
  const QuestionModel = deps.Question || Question;
  const UserModel = deps.User || User;
  const GrantModel = deps.ExamGrant || ExamGrant;
  const getSettingsFn = deps.getOrCreateSettings || getOrCreateSettings;

  const attempt = await AttemptModel.findOne({ _id: attemptId, userId: user._id });
  if (!attempt) throw new AppError('محاولة الاختبار غير موجودة', 404, 'NOT_FOUND');
  if (attempt.status === 'submitted') {
    throw new AppError('تم تسليم هذا الاختبار بالفعل', 409, 'ALREADY_SUBMITTED');
  }

  const [settings, questions] = await Promise.all([
    getSettingsFn(),
    QuestionModel.find({ isActive: true }).sort({ section: 1, order: 1 })
  ]);
  const scored = scoreExam({ questions, answers, settings });

  Object.assign(attempt, {
    answers: scored.gradedAnswers,
    sectionScores: scored.sectionScores,
    rawScore: scored.rawScore,
    maxScore: scored.maxScore,
    iqScore: scored.iqScore,
    iqClassification: scored.iqClassification,
    personalityProfile: scored.personalityProfile,
    status: 'submitted',
    submittedAt: new Date()
  });
  await attempt.save();
  await Promise.all([
    consumeGrant(attempt.grantId, attempt._id, GrantModel),
    UserModel.findByIdAndUpdate(user._id, { $inc: { completedAttemptsCount: 1 } })
  ]);
  return { attemptId: attempt._id };
}

async function getAttemptResult(user, attemptId) {
  if (env.demoNoDbMode) {
    const cached = store.attempts.get(attemptId) || decodeDemoResultId(attemptId);
    if (!cached) throw new AppError('النتيجة غير موجودة', 404, 'NOT_FOUND');
    return { ...cached, attemptId };
  }
  const attempt = await Attempt.findById(attemptId).populate('userId', 'name');
  if (!attempt) throw new AppError('النتيجة غير موجودة', 404, 'NOT_FOUND');
  const ownerId = attempt.userId?._id?.toString() || attempt.userId?.toString();
  const buyerId = attempt.purchasedByUserId?.toString();
  const requesterId = user._id.toString();
  if (ownerId !== requesterId && buyerId !== requesterId) {
    throw new AppError('غير مصرح بعرض هذه النتيجة', 403, 'FORBIDDEN');
  }
  if (attempt.status !== 'submitted') {
    throw new AppError('لم يتم تسليم الاختبار بعد', 400, 'NOT_SUBMITTED');
  }
  return toFinalResultDTO(attempt, attempt.userId);
}

module.exports = { startExam, submitExam, getAttemptResult };
