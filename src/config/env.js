const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const env = {
  port: Number(process.env.PORT) || 5000,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/iq_quiz',
  jwtSecret: process.env.JWT_SECRET || 'dev_iq_quiz_jwt_secret_change_in_prod',
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'Admin@2026',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.5-flash',
  instapayHandle: process.env.INSTAPAY_HANDLE || 'iqtest@instapay',
  instapayPhone: process.env.INSTAPAY_PHONE || '01000000000',
  walletNumber: process.env.WALLET_NUMBER || '01000000000',
  walletProvider: process.env.WALLET_PROVIDER || 'Vodafone Cash',
  adminWhatsapp: process.env.ADMIN_WHATSAPP || '201000000000',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  freePreviewMode: process.env.EXAM_FREE_PREVIEW_MODE === 'true',
  adminNoPasswordMode: process.env.ADMIN_NO_PASSWORD_MODE === 'true'
};

module.exports = { env };
