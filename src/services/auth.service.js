const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { env } = require('../config/env');
const { AppError } = require('../utils/app-error');
const { normalizeArabicText, normalizePhone, calculateAge } = require('../utils/normalize.util');
const { toUserDTO } = require('../utils/sanitizer.util');

function signUserToken(user) {
  return jwt.sign(
    { role: 'user', userId: user._id.toString() },
    env.jwtSecret,
    { expiresIn: '7d' }
  );
}

async function registerUser(payload) {
  const normalizedName = normalizeArabicText(payload.name);
  const normalizedPhone = normalizePhone(payload.phone);
  if (!normalizedName || normalizedPhone.length < 8) {
    throw new AppError('يرجى إدخال اسم ورقم تليفون صحيحين', 400, 'INVALID_IDENTITY');
  }
  let user = await User.findOne({ normalizedName, normalizedPhone });
  if (!user) {
    user = await User.create({
      name: payload.name.trim(),
      normalizedName,
      phone: payload.phone.trim(),
      normalizedPhone,
      dateOfBirth: new Date(payload.dateOfBirth),
      age: calculateAge(payload.dateOfBirth),
      occupation: payload.occupation.trim(),
      hobbies: payload.hobbies.trim(),
      selfIqRating: payload.selfIqRating
    });
  }
  return { token: signUserToken(user), user: toUserDTO(user) };
}

async function loginUser({ name, phone }) {
  const normalizedName = normalizeArabicText(name);
  const normalizedPhone = normalizePhone(phone);
  const user = await User.findOne({ normalizedName, normalizedPhone });
  if (!user) {
    throw new AppError('لم يتم العثور على حساب مطابق، يرجى التسجيل أولاً', 404, 'USER_NOT_FOUND');
  }
  return { token: signUserToken(user), user: toUserDTO(user) };
}

function getAuthConfig() {
  return {
    freePreviewMode: env.freePreviewMode,
    adminNoPasswordMode: env.adminNoPasswordMode
  };
}

function loginAdmin({ username = '', password = '' } = {}) {
  if (!env.adminNoPasswordMode) {
    if (!username || !password || username !== env.adminUsername || password !== env.adminPassword) {
      throw new AppError('بيانات دخول الأدمن غير صحيحة', 401, 'INVALID_CREDENTIALS');
    }
  }
  const adminUsername = env.adminUsername;
  const token = jwt.sign({ role: 'admin', username: adminUsername }, env.jwtSecret, { expiresIn: '12h' });
  return { token, admin: { username: adminUsername } };
}

module.exports = { registerUser, loginUser, loginAdmin, getAuthConfig };
