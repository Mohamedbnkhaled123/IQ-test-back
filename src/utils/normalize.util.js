const ARABIC_INDIC_MAP = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
};

function normalizeDigits(value) {
  return String(value ?? '').replace(/[٠-٩۰-۹]/g, (ch) => ARABIC_INDIC_MAP[ch] || ch);
}

function normalizeArabicText(value) {
  return normalizeDigits(value)
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function normalizePhone(phone) {
  let digits = normalizeDigits(phone).replace(/\D/g, '');
  if (digits.startsWith('0020') && digits.length === 14) {
    digits = `0${digits.slice(4)}`;
  } else if (digits.startsWith('20') && digits.length === 12) {
    digits = `0${digits.slice(2)}`;
  } else if (digits.startsWith('1') && digits.length === 10) {
    digits = `0${digits}`;
  }
  return digits;
}

function calculateAge(dateOfBirth, referenceDate = new Date()) {
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) {
    return 0;
  }
  let age = referenceDate.getUTCFullYear() - dob.getUTCFullYear();
  const monthDiff = referenceDate.getUTCMonth() - dob.getUTCMonth();
  const dayDiff = referenceDate.getUTCDate() - dob.getUTCDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }
  return Math.max(0, age);
}

function calculateNextAttemptPrice(completedAttemptsCount, baseExamPrice = 250, retakeMultiplier = 2) {
  const base = Number(baseExamPrice) || 250;
  const mult = Number(retakeMultiplier) || 2;
  return Number(completedAttemptsCount) >= 1 ? base * mult : base;
}

function isValidInputConstraint(value, constraint = 'any') {
  const raw = String(value ?? '').trim();
  if (!raw || constraint === 'any') {
    return true;
  }
  const normalized = normalizeDigits(raw);
  if (constraint === 'numbers_only') {
    return /^\d+$/.test(normalized.replace(/\s+/g, ''));
  }
  if (constraint === 'letters_only') {
    return !/\d/.test(normalized);
  }
  return true;
}

module.exports = {
  normalizeDigits,
  normalizeArabicText,
  normalizePhone,
  calculateAge,
  calculateNextAttemptPrice,
  isValidInputConstraint
};
