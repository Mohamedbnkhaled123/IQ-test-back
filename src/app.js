const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { env } = require('./config/env');
const { errorMiddleware } = require('./middlewares/error.middleware');
const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const examRoutes = require('./routes/exam.routes');
const paymentRoutes = require('./routes/payment.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();
const frontendDist = path.resolve(__dirname, '../../iq test front/dist/frontend/browser');

app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use('/exam-images', express.static(path.resolve(__dirname, '../public/exam-images')));

app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/exam', examRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

app.use('/api/*', (_req, res) => {
  res.status(404).json({ success: false, message: 'المسار المطلوب غير موجود', code: 'NOT_FOUND' });
});

if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'المسار المطلوب غير موجود', code: 'NOT_FOUND' });
  });
}

app.use(errorMiddleware);

module.exports = app;
