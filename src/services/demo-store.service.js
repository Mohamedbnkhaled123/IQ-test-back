const zlib = require('zlib');
const { DEFAULT_SETTINGS, EXAM_QUESTIONS } = require('../seed/seed-exam');
const { normalizeArabicText, normalizePhone, calculateAge } = require('../utils/normalize.util');
const { toUserDTO } = require('../utils/sanitizer.util');

const store = {
  settings: { ...DEFAULT_SETTINGS, iqBands: { ...DEFAULT_SETTINGS.iqBands } },
  questions: EXAM_QUESTIONS.map((q, idx) => ({ ...q, _id: `demo_q_${idx + 1}` })),
  users: [],
  attempts: new Map(),
  grants: [],
  payments: []
};

function findOrCreateDemoUser(payload) {
  const normalizedName = normalizeArabicText(payload.name);
  const normalizedPhone = normalizePhone(payload.phone);
  let user = store.users.find((u) => u.normalizedName === normalizedName && u.normalizedPhone === normalizedPhone);
  if (!user) {
    user = {
      _id: `demo_u_${Date.now()}`,
      name: payload.name.trim(),
      normalizedName,
      phone: payload.phone.trim(),
      normalizedPhone,
      dateOfBirth: new Date(payload.dateOfBirth),
      age: calculateAge(payload.dateOfBirth),
      occupation: payload.occupation.trim(),
      hobbies: payload.hobbies.trim(),
      selfIqRating: payload.selfIqRating,
      completedAttemptsCount: 0,
      createdAt: new Date()
    };
    store.users.unshift(user);
  }
  return user;
}

function findDemoUser(name, phone) {
  const normalizedName = normalizeArabicText(name);
  const normalizedPhone = normalizePhone(phone);
  return store.users.find((u) => u.normalizedName === normalizedName && u.normalizedPhone === normalizedPhone) || null;
}

function resolveUserFromTokenPayload(payload) {
  const existing = store.users.find((u) => u._id === payload.userId);
  if (existing) return existing;
  if (!payload.userProfile) return null;
  const p = payload.userProfile;
  return {
    _id: p._id,
    name: p.name,
    normalizedName: normalizeArabicText(p.name),
    phone: p.phone,
    normalizedPhone: normalizePhone(p.phone),
    age: p.age,
    occupation: p.occupation,
    hobbies: p.hobbies,
    selfIqRating: p.selfIqRating,
    completedAttemptsCount: p.completedAttemptsCount || 0
  };
}

function encodeDemoResultId(resultDto) {
  const packed = zlib.deflateRawSync(JSON.stringify(resultDto)).toString('base64url');
  return `demo.${packed}`;
}

function decodeDemoResultId(attemptId) {
  if (!attemptId || !attemptId.startsWith('demo.')) return null;
  try {
    const raw = zlib.inflateRawSync(Buffer.from(attemptId.slice(5), 'base64url')).toString('utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getDemoAdminOverview() {
  const attempts = Array.from(store.attempts.values());
  return {
    stats: {
      totalUsers: store.users.length,
      totalAttempts: attempts.length,
      availableGrants: store.grants.filter((g) => g.status === 'available').length,
      totalPayments: store.payments.length,
      totalRevenue: 0
    },
    settings: store.settings,
    users: store.users.map(toUserDTO),
    attempts,
    grants: store.grants,
    payments: store.payments
  };
}

module.exports = {
  store,
  findOrCreateDemoUser,
  findDemoUser,
  resolveUserFromTokenPayload,
  encodeDemoResultId,
  decodeDemoResultId,
  getDemoAdminOverview
};
