const mcqStrategy = require('./mcq.strategy');
const textStrategy = require('./text.strategy');
const memoryGridStrategy = require('./memory-grid.strategy');
const canvasStrategy = require('./canvas.strategy');
const { aggregatePersonality } = require('./personality.aggregator');

const STRATEGIES = {
  mcq: mcqStrategy,
  text: textStrategy,
  memory_grid: memoryGridStrategy,
  canvas_connect: canvasStrategy
};

function calculateIqScore(rawScore, maxScore, settings = {}) {
  const minScale = Number(settings.iqScaleMin ?? 70);
  const maxScale = Number(settings.iqScaleMax ?? 145);
  if (!maxScore || maxScore <= 0) {
    return minScale;
  }
  const computed = Math.round(minScale + (rawScore / maxScore) * (maxScale - minScale));
  return Math.max(minScale, Math.min(maxScale, computed));
}

function classifyIq(iqScore, settings = {}) {
  const lowMax = Number(settings?.iqBands?.lowMax ?? 89);
  const averageMax = Number(settings?.iqBands?.averageMax ?? 115);
  if (iqScore <= lowMax) return 'أقل من المتوسط';
  if (iqScore <= averageMax) return 'ذكاء متوسط';
  return 'ذكاء عالي';
}

function initSectionScores() {
  return {
    section1: { earned: 0, max: 0 },
    section2: { earned: 0, max: 0 },
    section3: { earned: 0, max: 0 }
  };
}

function gradeSingleQuestion(question, submission) {
  if (question.questionType === 'memory_preview') {
    return { isCorrect: true, earnedPoints: 0, selectedOption: null };
  }
  const strategy = STRATEGIES[question.questionType];
  if (!strategy) {
    return { isCorrect: false, earnedPoints: 0, selectedOption: null };
  }
  return strategy.grade(question, submission);
}

function buildGradedAnswer(question, submission, result) {
  const rawAnswer = submission.selectedOptionKey
    ?? submission.selectedCellIndex
    ?? submission.solved
    ?? submission.answer
    ?? null;
  return {
    questionId: question._id,
    section: question.section,
    questionType: question.questionType,
    answer: rawAnswer,
    isCorrect: result.isCorrect,
    earnedPoints: result.earnedPoints
  };
}

function scoreExam({ questions, answers, settings }) {
  const answerMap = new Map(
    (Array.isArray(answers) ? answers : []).map((a) => [String(a.questionId), a])
  );
  const sectionScores = initSectionScores();
  const gradedAnswers = [];
  const personalityOptions = [];
  let rawScore = 0;
  let maxScore = 0;

  for (const question of questions) {
    const submission = answerMap.get(String(question._id)) || {};
    const result = gradeSingleQuestion(question, submission);
    const pts = Number(question.points) || 0;
    if (question.section >= 1 && question.section <= 3) {
      const key = `section${question.section}`;
      sectionScores[key].earned += result.earnedPoints;
      sectionScores[key].max += pts;
      rawScore += result.earnedPoints;
      maxScore += pts;
    } else if (question.section === 4 && result.selectedOption) {
      personalityOptions.push(result.selectedOption);
    }
    gradedAnswers.push(buildGradedAnswer(question, submission, result));
  }

  const iqScore = calculateIqScore(rawScore, maxScore, settings);
  return {
    gradedAnswers,
    sectionScores,
    rawScore,
    maxScore,
    iqScore,
    iqClassification: classifyIq(iqScore, settings),
    personalityProfile: aggregatePersonality(personalityOptions)
  };
}

module.exports = { calculateIqScore, classifyIq, scoreExam };
