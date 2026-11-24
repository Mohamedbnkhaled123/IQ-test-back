function gradeMcq(question, submission) {
  const selectedKey = String(
    submission?.selectedOptionKey ?? submission?.answer ?? ''
  ).trim();
  const options = Array.isArray(question.options) ? question.options : [];
  const selectedOption = options.find((opt) => opt.key === selectedKey) || null;
  const isCorrect = Boolean(selectedOption && selectedOption.isCorrect);
  const earnedPoints = isCorrect ? Number(question.points) || 0 : 0;
  return { isCorrect, earnedPoints, selectedOption };
}

module.exports = { grade: gradeMcq };
