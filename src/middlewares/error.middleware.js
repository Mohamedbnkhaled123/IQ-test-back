const multer = require('multer');
const { AppError } = require('../utils/app-error');

function formatDuplicateError(err) {
  const keys = Object.keys(err.keyPattern || err.keyValue || {});
  if (keys.includes('referenceId')) {
    return {
      statusCode: 409,
      message: 'تم استخدام رقم العملية المرجعي هذا من قبل',
      code: 'DUPLICATE_REFERENCE_ID'
    };
  }
  return {
    statusCode: 409,
    message: 'هذه البيانات مسجلة بالفعل',
    code: 'DUPLICATE_KEY'
  };
}

function errorMiddleware(err, _req, res, _next) {
  if (err instanceof AppError) {
    const body = { success: false, message: err.message };
    if (err.code) body.code = err.code;
    if (err.extra && typeof err.extra === 'object') Object.assign(body, err.extra);
    return res.status(err.statusCode).json(body);
  }
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'حجم الصورة يتجاوز الحد الأقصى المسموح (6 ميجابايت)'
      : 'خطأ في رفع الملف';
    return res.status(400).json({ success: false, message, code: 'UPLOAD_ERROR' });
  }
  if (err && err.code === 11000) {
    const dup = formatDuplicateError(err);
    return res.status(dup.statusCode).json({ success: false, message: dup.message, code: dup.code });
  }
  if (err && err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'معرف غير صالح', code: 'INVALID_ID' });
  }
  const statusCode = err?.statusCode || 500;
  const message = err?.message || 'حدث خطأ غير متوقع في الخادم';
  return res.status(statusCode).json({ success: false, message });
}

module.exports = { errorMiddleware };
