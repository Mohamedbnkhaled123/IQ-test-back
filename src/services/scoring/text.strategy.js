const { normalizeArabicText, isValidInputConstraint } = require('../../utils/normalize.util');

function gradeText(question, submission) {
  const rawAnswer = String(submission?.answer ?? '').trim();
  if (!rawAnswer || !isValidInputConstraint(rawAnswer, question.inputConstraint)) {
    return { isCorrect: false, earnedPoints: 0 };
  }
  const normalizedInput = normalizeArabicText(rawAnswer);
  if (!normalizedInput) {
    return { isCorrect: false, earnedPoints: 0 };
  }
  const accepted = Array.isArray(question.acceptedAnswers) ? question.acceptedAnswers : [];
  const isCorrect = accepted.some((ans) => normalizeArabicText(ans) === normalizedInput);
  const earnedPoints = isCorrect ? Number(question.points) || 0 : 0;
  return { isCorrect, earnedPoints };
}

module.exports = { grade: gradeText };
