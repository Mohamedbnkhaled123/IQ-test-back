const { GoogleGenAI } = require('@google/genai');
const { env } = require('../config/env');
const { getPaymentConfig } = require('../config/payment.config');

const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash';

function buildReceiptPrompt({ method, expectedAmount, config }) {
  const receiverInfo = method === 'instapay'
    ? `InstaPay handle: ${config.instapayHandle} or phone: ${config.instapayPhone}`
    : `Egyptian Mobile Wallet (${config.walletProvider}): ${config.walletNumber}`;

  return [
    'You are a strict financial receipt fraud-detection system for Egyptian InstaPay and Mobile Wallets.',
    `Expected payment method: ${method}. Expected receiver: ${receiverInfo}. Expected minimum amount: ${expectedAmount} EGP.`,
    'Analyze the attached receipt image carefully for:',
    '1. Is it an authentic InstaPay or Egyptian Telecom Wallet (Vodafone/Orange/Etisalat/WE Cash) completed transfer receipt?',
    '2. Are there signs of Photoshop, AI generation, distorted Arabic glyphs, mismatched font weights, or pasted boxes over numbers?',
    '3. Does the receiver match the expected receiver above? Does the transferred amount equal or exceed the expected amount?',
    '4. Extract the exact numeric detectedAmount and unique transaction referenceId.',
    'Respond ONLY with JSON matching this exact schema:',
    '{"isLikelyAuthentic":boolean,"aiConfidence":number,"detectedAmount":number,"detectedMethod":"instapay"|"wallet"|"other","receiverMismatch":boolean,"transactionStatus":"completed"|"pending"|"failed"|"unknown","referenceId":string|null,"reason":string}',
    'Write "reason" in clear polite Arabic explaining acceptance or the specific rejection issue.'
  ].join('\n');
}

function normalizeGeminiResult(parsed, expectedMethod) {
  const confidence = Number(parsed?.aiConfidence) || 0;
  const detectedAmount = Number(parsed?.detectedAmount) || 0;
  const ref = parsed?.referenceId ? String(parsed.referenceId).trim() : null;
  const methodMismatch = parsed?.detectedMethod && parsed.detectedMethod !== expectedMethod;
  const notCompleted = parsed?.transactionStatus && parsed.transactionStatus !== 'completed';
  const receiverMismatch = Boolean(parsed?.receiverMismatch) || Boolean(methodMismatch);
  const isLikelyAuthentic = Boolean(parsed?.isLikelyAuthentic) && !notCompleted;
  return {
    isLikelyAuthentic,
    aiConfidence: Math.max(0, Math.min(1, confidence)),
    detectedAmount,
    receiverMismatch,
    referenceId: ref || null,
    reason: parsed?.reason || (isLikelyAuthentic ? 'تم التحقق من الإيصال بنجاح' : 'تعذر التحقق من صحة الإيصال')
  };
}

async function verifyReceiptWithGemini({ buffer, mimetype, method, expectedAmount, client = null }) {
  if (!client && (!env.geminiApiKey || env.geminiApiKey === 'your_gemini_api_key_here')) {
    return {
      isLikelyAuthentic: false,
      aiConfidence: 0,
      detectedAmount: 0,
      receiverMismatch: false,
      referenceId: null,
      reason: 'خدمة التحقق التلقائي غير مفعلة حالياً، يرجى التواصل عبر واتساب للتفعيل اليدوي'
    };
  }
  const ai = client || new GoogleGenAI({ apiKey: env.geminiApiKey });
  const model = env.geminiModel || DEFAULT_GEMINI_MODEL;
  const prompt = buildReceiptPrompt({ method, expectedAmount, config: getPaymentConfig() });
  const response = await ai.models.generateContent({
    model,
    contents: [
      prompt,
      { inlineData: { mimeType: mimetype, data: buffer.toString('base64') } }
    ],
    config: { responseMimeType: 'application/json', temperature: 0.1 }
  });
  const rawText = typeof response.text === 'string' ? response.text : '{}';
  const parsed = JSON.parse(rawText);
  return normalizeGeminiResult(parsed, method);
}

module.exports = { verifyReceiptWithGemini, DEFAULT_GEMINI_MODEL };
