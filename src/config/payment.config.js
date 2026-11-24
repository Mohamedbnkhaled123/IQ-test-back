const { env } = require('./env');

function getPaymentConfig() {
  return {
    instapayHandle: env.instapayHandle,
    instapayPhone: env.instapayPhone,
    walletNumber: env.walletNumber,
    walletProvider: env.walletProvider,
    whatsappNumber: env.adminWhatsapp
  };
}

function buildWhatsappUrl({ name = '', phone = '', expectedAmount = 0, reason = '' }) {
  const cleanPhone = String(env.adminWhatsapp).replace(/[^\d]/g, '');
  const lines = [
    'مرحباً، أواجه مشكلة في تفعيل اختبار الذكاء بعد الدفع:',
    name ? `الاسم: ${name}` : '',
    phone ? `رقم الهاتف: ${phone}` : '',
    expectedAmount ? `المبلغ المطلوب: ${expectedAmount} ج.م` : '',
    reason ? `السبب: ${reason}` : ''
  ].filter(Boolean);
  const text = encodeURIComponent(lines.join('\n'));
  return `https://wa.me/${cleanPhone}?text=${text}`;
}

module.exports = { getPaymentConfig, buildWhatsappUrl };
