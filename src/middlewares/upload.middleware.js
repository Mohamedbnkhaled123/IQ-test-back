const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { AppError } = require('../utils/app-error');

const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_SIZE_BYTES = 6 * 1024 * 1024;
const EXAM_IMAGES_DIR = path.resolve(__dirname, '../../public/exam-images');

function imageFileFilter(_req, file, cb) {
  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
    return cb(new AppError('صيغة الصورة غير مدعومة. المسموح: JPG, PNG, WEBP فقط', 400, 'INVALID_FILE_TYPE'));
  }
  return cb(null, true);
}

const receiptStorage = multer.memoryStorage();

const uploadReceipt = multer({
  storage: receiptStorage,
  limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
  fileFilter: imageFileFilter
});

const questionImageStorage = multer.diskStorage({
  destination(_req, _file, cb) {
    fs.mkdirSync(EXAM_IMAGES_DIR, { recursive: true });
    cb(null, EXAM_IMAGES_DIR);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.jpg';
    cb(null, `q_${Date.now()}_${Math.round(Math.random() * 1e6)}${safeExt}`);
  }
});

const uploadQuestionImage = multer({
  storage: questionImageStorage,
  limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
  fileFilter: imageFileFilter
});

module.exports = {
  uploadReceipt,
  uploadQuestionImage,
  EXAM_IMAGES_DIR
};
