process.env.NODE_ENV = 'test';
process.env.EXAM_FREE_PREVIEW_MODE = 'false';
process.env.ADMIN_NO_PASSWORD_MODE = 'false';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const User = require('../src/models/user.model');
const ExamGrant = require('../src/models/exam-grant.model');
const { env } = require('../src/config/env');
const { DEFAULT_GEMINI_MODEL } = require('../src/services/gemini-receipt.service');
const { toStudentQuestionDTO, toFinalResultDTO } = require('../src/utils/sanitizer.util');
const { startExam, submitExam } = require('../src/services/exam.service');
const { evaluateAndRecordPayment } = require('../src/services/payment.service');
const { uploadReceipt, uploadQuestionImage } = require('../src/middlewares/upload.middleware');

describe('Security, DTOs, Grants, Payments, and Multer RAM-only checks', () => {
  it('strips sensitive fields from student questions and final results', () => {
    const qDto = toStudentQuestionDTO({
      _id: 'q1', section: 1, sectionTitle: 'S1', order: 1, prompt: 'P',
      questionType: 'memory_grid', timeLimitSeconds: 7, points: 2,
      acceptedAnswers: ['secret'], adminNote: 'internal',
      options: [{ key: 'a', label: 'A', isCorrect: true, traitImpacts: [{ traitName: 't', traitValue: 'v' }] }],
      gridConfig: { rows: 2, cols: 3, correctCellIndex: 1 }
    });
    assert.equal('acceptedAnswers' in qDto, false);
    assert.equal('adminNote' in qDto, false);
    assert.equal('isCorrect' in qDto.options[0], false);
    assert.equal('traitImpacts' in qDto.options[0], false);
    assert.equal('correctCellIndex' in qDto.gridConfig, false);

    const resDto = toFinalResultDTO({
      _id: 'a1', attemptNumber: 1, submittedAt: new Date(),
      answers: [{ questionId: 'q1', answer: 'secret', isCorrect: true }],
      sectionScores: {}, rawScore: 10, maxScore: 20, iqScore: 108, iqClassification: 'ذكاء متوسط',
      personalityProfile: [{ traitName: 'الذكاء', traitValue: 'اجتماعي' }]
    }, { name: 'أحمد' });
    assert.equal('answers' in resDto, false);
    assert.equal(resDto.examineeName, 'أحمد');
  });

  it('returns 402 PAYMENT_REQUIRED from POST /api/exam/start when no available grant exists', async () => {
    const origFindById = User.findById;
    const origFindOneAndUpdate = ExamGrant.findOneAndUpdate;
    User.findById = async (id) => ({ _id: id, normalizedName: 'احمد', normalizedPhone: '01012345678', completedAttemptsCount: 0 });
    ExamGrant.findOneAndUpdate = async () => null;
    const token = jwt.sign({ role: 'user', userId: 'u1' }, env.jwtSecret);
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    try {
      const { port } = server.address();
      const resp = await fetch(`http://127.0.0.1:${port}/api/exam/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const body = await resp.json();
      assert.equal(resp.status, 402);
      assert.equal(body.success, false);
      assert.equal(body.code, 'PAYMENT_REQUIRED');
    } finally {
      User.findById = origFindById;
      ExamGrant.findOneAndUpdate = origFindOneAndUpdate;
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('reserves grant atomically available -> in_use -> consumed and increments user attempts', async () => {
    let grantState = 'available';
    let userIncrements = 0;
    const MockGrant = {
      findOneAndUpdate: async (query, update) => {
        assert.equal(query.status, 'available');
        assert.equal(update.$set.status, 'in_use');
        grantState = 'in_use';
        return { _id: 'g1', source: 'self_purchase', status: grantState };
      },
      findByIdAndUpdate: async (_id, update) => {
        grantState = update.$set.status;
        return { _id: 'g1', status: grantState };
      }
    };
    const mockAttempt = { _id: 'att1', userId: 'u1', grantId: 'g1', status: 'in_progress', save: async () => {} };
    const MockAttempt = {
      create: async (doc) => ({ ...doc, _id: 'att1' }),
      findOne: async () => mockAttempt
    };
    const MockQuestion = {
      find: () => ({ sort: async () => [{ _id: 'q1', section: 1, sectionTitle: 'S1', order: 1, prompt: 'P', questionType: 'text', points: 2, acceptedAnswers: ['12'], timeLimitSeconds: 7 }] })
    };
    const MockUser = {
      findByIdAndUpdate: async (_id, upd) => { userIncrements += upd.$inc.completedAttemptsCount; }
    };
    const user = { _id: 'u1', normalizedName: 'احمد', normalizedPhone: '01012345678', completedAttemptsCount: 0 };

    const started = await startExam(user, {
      ExamGrant: MockGrant, Question: MockQuestion, Attempt: MockAttempt,
      getOrCreateSettings: async () => ({ examTitle: 'Test' })
    });
    assert.equal(started.attemptId, 'att1');
    assert.equal(grantState, 'in_use');

    await submitExam(user, 'att1', [{ questionId: 'q1', answer: '12' }], {
      ExamGrant: MockGrant, Question: MockQuestion, Attempt: MockAttempt, User: MockUser,
      getOrCreateSettings: async () => ({ iqScaleMin: 70, iqScaleMax: 145, iqBands: { lowMax: 89, averageMax: 115 } })
    });
    assert.equal(grantState, 'consumed');
    assert.equal(userIncrements, 1);
  });

  it('rejects duplicate referenceId with 409 and low-confidence receipts with 422 + whatsappUrl', async () => {
    const user = { _id: 'u1', name: 'أحمد', phone: '01012345678' };
    const file = { buffer: Buffer.from('fake-img'), mimetype: 'image/jpeg' };
    const seenRefs = new Set(['REF-123']);
    const MockPayment = {
      findOne: async ({ referenceId }) => (seenRefs.has(referenceId) ? { _id: 'p0', referenceId } : null),
      create: async (doc) => ({ ...doc, _id: 'p1' })
    };

    await assert.rejects(
      () => evaluateAndRecordPayment({
        user, method: 'instapay', expectedAmount: 250, paymentType: 'self_purchase', file,
        deps: {
          Payment: MockPayment,
          verifyReceiptWithGemini: async () => ({
            isLikelyAuthentic: true, aiConfidence: 0.95, detectedAmount: 250, receiverMismatch: false, referenceId: 'REF-123', reason: 'ok'
          })
        }
      }),
      (err) => err.statusCode === 409 && err.code === 'DUPLICATE_REFERENCE_ID'
    );

    await assert.rejects(
      () => evaluateAndRecordPayment({
        user, method: 'wallet', expectedAmount: 250, paymentType: 'self_purchase', file,
        deps: {
          Payment: MockPayment,
          verifyReceiptWithGemini: async () => ({
            isLikelyAuthentic: false, aiConfidence: 0.4, detectedAmount: 250, receiverMismatch: false, referenceId: 'REF-NEW', reason: 'صورة غير واضحة'
          })
        }
      }),
      (err) => err.statusCode === 422 && Boolean(err.extra.whatsappUrl) && err.extra.reason === 'صورة غير واضحة'
    );
  });

  it('enforces RAM-only multer memoryStorage for receipts and gemini-3.5-flash default', () => {
    assert.equal(uploadReceipt.storage.constructor.name, 'MemoryStorage');
    assert.equal(uploadQuestionImage.storage.constructor.name, 'DiskStorage');
    assert.equal(DEFAULT_GEMINI_MODEL, 'gemini-3.5-flash');
    assert.equal(env.geminiModel, 'gemini-3.5-flash');
  });

  it('exposes /api/auth/config and enforces strict admin credentials when ADMIN_NO_PASSWORD_MODE=false', async () => {
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    try {
      const { port } = server.address();
      const cfgResp = await fetch(`http://127.0.0.1:${port}/api/auth/config`);
      const cfgBody = await cfgResp.json();
      assert.equal(cfgResp.status, 200);
      assert.deepEqual(cfgBody.data, { freePreviewMode: false, adminNoPasswordMode: false });

      const emptyResp = await fetch(`http://127.0.0.1:${port}/api/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      assert.equal(emptyResp.status, 401);

      const badResp = await fetch(`http://127.0.0.1:${port}/api/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'wrong-password' })
      });
      assert.equal(badResp.status, 401);

      env.adminNoPasswordMode = true;
      const demoResp = await fetch(`http://127.0.0.1:${port}/api/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const demoBody = await demoResp.json();
      assert.equal(demoResp.status, 200);
      assert.equal(demoBody.success, true);
      assert.equal(jwt.verify(demoBody.data.token, env.jwtSecret).role, 'admin');
    } finally {
      env.adminNoPasswordMode = false;
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
