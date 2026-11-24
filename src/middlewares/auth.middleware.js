const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { env } = require('../config/env');
const { AppError } = require('../utils/app-error');
const { asyncHandler } = require('../utils/async-handler');

function extractBearerToken(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    throw new AppError('يرجى تسجيل الدخول للمتابعة', 401, 'UNAUTHORIZED');
  }
  return header.slice(7).trim();
}

function verifyToken(token) {
  try {
    return jwt.verify(token, env.jwtSecret);
  } catch {
    throw new AppError('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً', 401, 'INVALID_TOKEN');
  }
}

const requireUser = asyncHandler(async (req, _res, next) => {
  const token = extractBearerToken(req);
  const payload = verifyToken(token);
  if (payload.role !== 'user' || !payload.userId) {
    throw new AppError('صلاحية غير كافية', 403, 'FORBIDDEN');
  }
  const user = await User.findById(payload.userId);
  if (!user) {
    throw new AppError('المستخدم غير موجود', 401, 'UNAUTHORIZED');
  }
  req.user = user;
  next();
});

const requireAdmin = (req, _res, next) => {
  const token = extractBearerToken(req);
  const payload = verifyToken(token);
  if (payload.role !== 'admin') {
    return next(new AppError('صلاحية الأدمن مطلوبة', 403, 'FORBIDDEN'));
  }
  req.admin = { username: payload.username };
  return next();
};

module.exports = { requireUser, requireAdmin };
