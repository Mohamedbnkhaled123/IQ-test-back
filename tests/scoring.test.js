const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { scoreExam, calculateIqScore, classifyIq } = require('../src/services/scoring/scoring.engine');
const { PERSONALITY_TRAITS } = require('../src/services/scoring/personality.aggregator');

function makeSection4Questions(q3Active = false, q5Active = false) {
  const mkMcq = (id, order, optAImpacts, optBImpacts, isActive = true) => ({
    _id: id, section: 4, order, questionType: 'mcq', points: 0, isActive,
    options: [
      { key: 'a', label: 'A', isCorrect: false, traitImpacts: optAImpacts },
      { key: 'b', label: 'B', isCorrect: false, traitImpacts: optBImpacts }
    ]
  });
  return [
    mkMcq('s4q1', 1, [{ traitName: 'المسئولية', traitValue: 'عالية', priority: 'primary' }], [{ traitName: 'المسئولية', traitValue: 'منخفضة', priority: 'primary' }]),
    mkMcq('s4q2', 2, [{ traitName: 'اتخاذ القرار', traitValue: 'يستمع للآخرين', priority: 'primary' }, { traitName: 'التمركز حول الذات', traitValue: 'منخفض', priority: 'fallback' }], [{ traitName: 'اتخاذ القرار', traitValue: 'فردي', priority: 'primary' }, { traitName: 'التمركز حول الذات', traitValue: 'عالي', priority: 'fallback' }]),
    mkMcq('s4q3', 3, [{ traitName: 'التمركز حول الذات', traitValue: 'منخفض', priority: 'primary' }], [{ traitName: 'التمركز حول الذات', traitValue: 'عالي', priority: 'primary' }], q3Active),
    mkMcq('s4q4', 4, [{ traitName: 'المسيطر على الشخصية', traitValue: 'العقل', priority: 'primary' }], [{ traitName: 'المسيطر على الشخصية', traitValue: 'المشاعر', priority: 'primary' }]),
    mkMcq('s4q5', 5, [{ traitName: 'التمركز حول الذات', traitValue: 'منخفض', priority: 'primary' }], [{ traitName: 'التمركز حول الذات', traitValue: 'عالي', priority: 'primary' }], q5Active),
    mkMcq('s4q6', 6, [{ traitName: 'التعبير الكتابي', traitValue: 'عالي', priority: 'primary' }], [{ traitName: 'التعبير الكتابي', traitValue: 'منخفض', priority: 'primary' }]),
    mkMcq('s4q7', 7, [{ traitName: 'الذكاء', traitValue: 'اجتماعي', priority: 'primary' }], [{ traitName: 'الذكاء', traitValue: 'شخصي', priority: 'primary' }]),
    mkMcq('s4q8', 8, [{ traitName: 'المواقف الطارئة', traitValue: 'استغلال الفرص', priority: 'primary' }], [{ traitName: 'المواقف الطارئة', traitValue: 'محدد', priority: 'primary' }]),
    mkMcq('s4q9', 9, [{ traitName: 'نوع الشخصية', traitValue: 'متواضعة', priority: 'primary' }], [{ traitName: 'نوع الشخصية', traitValue: 'مغرورة', priority: 'primary' }]),
    mkMcq('s4q10', 10, [{ traitName: 'الثبات الانفعالي', traitValue: 'عالي', priority: 'primary' }], [{ traitName: 'الثبات الانفعالي', traitValue: 'منخفض', priority: 'primary' }]),
    mkMcq('s4q11', 11, [{ traitName: 'تقدير الآخرين', traitValue: 'عالي', priority: 'primary' }], [{ traitName: 'تقدير الآخرين', traitValue: 'منخفض', priority: 'primary' }])
  ].filter((q) => q.isActive);
}

describe('scoring.engine & personality.aggregator', () => {
  it('computes IQ scale 70-145 and classifies bands accurately', () => {
    assert.equal(calculateIqScore(0, 61), 70);
    assert.equal(calculateIqScore(61, 61), 145);
    assert.equal(calculateIqScore(30.5, 61), 108);
    assert.equal(classifyIq(89), 'أقل من المتوسط');
    assert.equal(classifyIq(90), 'ذكاء متوسط');
    assert.equal(classifyIq(115), 'ذكاء متوسط');
    assert.equal(classifyIq(116), 'ذكاء عالي');
  });

  it('grades mcq, text, memory_grid, and canvas_connect strategies', () => {
    const questions = [
      { _id: 'q1', section: 1, questionType: 'text', inputConstraint: 'numbers_only', points: 2, acceptedAnswers: ['12'] },
      { _id: 'q2', section: 1, questionType: 'memory_preview', points: 0 },
      { _id: 'q3', section: 1, questionType: 'memory_grid', points: 2, gridConfig: { rows: 2, cols: 3, correctCellIndex: 1 } },
      { _id: 'q4', section: 1, questionType: 'canvas_connect', points: 2 },
      { _id: 'q5', section: 2, questionType: 'text', inputConstraint: 'letters_only', points: 2, acceptedAnswers: ['عود الثقاب'] },
      { _id: 'q6', section: 3, questionType: 'mcq', points: 3, options: [{ key: 'a', isCorrect: false }, { key: 'c', isCorrect: true }] }
    ];
    const answers = [
      { questionId: 'q1', answer: '١٢' },
      { questionId: 'q3', selectedCellIndex: 1 },
      { questionId: 'q4', solved: true },
      { questionId: 'q5', answer: 'عود الثقاب' },
      { questionId: 'q6', selectedOptionKey: 'c' }
    ];
    const res = scoreExam({ questions, answers, settings: {} });
    assert.equal(res.rawScore, 11);
    assert.equal(res.maxScore, 11);
    assert.equal(res.iqScore, 145);
    assert.equal(res.sectionScores.section1.earned, 6);
    assert.equal(res.sectionScores.section2.earned, 2);
    assert.equal(res.sectionScores.section3.earned, 3);
  });

  it('uses fallback for التمركز حول الذات when Q3/Q5 inactive, and overrides with primary when active', () => {
    const fallbackAnswers = [
      { questionId: 's4q1', selectedOptionKey: 'a' },
      { questionId: 's4q2', selectedOptionKey: 'b' },
      { questionId: 's4q4', selectedOptionKey: 'a' },
      { questionId: 's4q6', selectedOptionKey: 'a' },
      { questionId: 's4q7', selectedOptionKey: 'a' },
      { questionId: 's4q8', selectedOptionKey: 'a' },
      { questionId: 's4q9', selectedOptionKey: 'a' },
      { questionId: 's4q10', selectedOptionKey: 'a' },
      { questionId: 's4q11', selectedOptionKey: 'a' }
    ];
    const resFallback = scoreExam({ questions: makeSection4Questions(false, false), answers: fallbackAnswers });
    assert.equal(resFallback.personalityProfile.length, PERSONALITY_TRAITS.length);
    const egoFallback = resFallback.personalityProfile.find((t) => t.traitName === 'التمركز حول الذات');
    assert.equal(egoFallback.traitValue, 'عالي');

    const activeAnswers = [...fallbackAnswers, { questionId: 's4q3', selectedOptionKey: 'a' }];
    const resPrimary = scoreExam({ questions: makeSection4Questions(true, false), answers: activeAnswers });
    const egoPrimary = resPrimary.personalityProfile.find((t) => t.traitName === 'التمركز حول الذات');
    assert.equal(egoPrimary.traitValue, 'منخفض');
  });
});
