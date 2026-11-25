const { connectDB } = require('../src/config/db');
const app = require('../src/app');

const PUBLIC_NO_DB_PATHS = ['/', '/api/health', '/api/auth/config'];

module.exports = async (req, res) => {
  const pathOnly = (req.url || '/').split('?')[0];
  if (!PUBLIC_NO_DB_PATHS.includes(pathOnly) && !pathOnly.startsWith('/exam-images/')) {
    try {
      await connectDB();
    } catch (err) {
      return res.status(503).json({
        success: false,
        message: 'تعذر الاتصال بقاعدة البيانات، يرجى مراجعة إعدادات MONGODB_URI في Vercel',
        code: 'DB_CONNECTION_FAILED',
        detail: err?.message || 'Database connection failed'
      });
    }
  }
  return app(req, res);
};
