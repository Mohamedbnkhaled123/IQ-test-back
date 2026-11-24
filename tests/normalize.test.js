const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeDigits,
  normalizeArabicText,
  normalizePhone,
  calculateAge,
  calculateNextAttemptPrice,
  isValidInputConstraint
} = require('../src/utils/normalize.util');

describe('normalize.util', () => {
  it('normalizes Arabic text, diacritics, alef/taa/yaa, and Arabic-Indic digits', () => {
    assert.equal(normalizeDigits('٠١٢٣٤٥٦٧٨٩'), '0123456789');
    assert.equal(normalizeArabicText('أَحْمَدُ إِبْرَاهِيم آية مُتَمَيِّزَةٌ'), 'احمد ابراهيم ايه متميزه');
    assert.equal(normalizeArabicText('الصف السادس!'), 'الصف السادس');
    assert.equal(normalizeArabicText('١٣'), '13');
  });

  it('normalizes Egyptian phone numbers across formats', () => {
    assert.equal(normalizePhone('01012345678'), '01012345678');
    assert.equal(normalizePhone('+201012345678'), '01012345678');
    assert.equal(normalizePhone('00201012345678'), '01012345678');
    assert.equal(normalizePhone('٠١٠١٢٣٤٥٦٧٨'), '01012345678');
  });

  it('calculates exact age from dateOfBirth', () => {
    const ref = new Date('2026-06-15T00:00:00Z');
    assert.equal(calculateAge('1996-06-15', ref), 30);
    assert.equal(calculateAge('1996-06-16', ref), 29);
  });

  it('enforces capped retake pricing 250 -> 500 -> 500 (never exponential)', () => {
    assert.equal(calculateNextAttemptPrice(0, 250, 2), 250);
    assert.equal(calculateNextAttemptPrice(1, 250, 2), 500);
    assert.equal(calculateNextAttemptPrice(2, 250, 2), 500);
    assert.equal(calculateNextAttemptPrice(10, 250, 2), 500);
    assert.equal(calculateNextAttemptPrice(1, 300, 2), 600);
  });

  it('validates inputConstraint rules correctly', () => {
    assert.equal(isValidInputConstraint('١٢٣', 'numbers_only'), true);
    assert.equal(isValidInputConstraint('12abc', 'numbers_only'), false);
    assert.equal(isValidInputConstraint('المفاتيح', 'letters_only'), true);
    assert.equal(isValidInputConstraint('قلم 2', 'letters_only'), false);
    assert.equal(isValidInputConstraint('الصف 6', 'any'), true);
  });
});
