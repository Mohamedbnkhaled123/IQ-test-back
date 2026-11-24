function gradeMemoryGrid(question, submission) {
  const raw = submission?.selectedCellIndex ?? submission?.answer;
  if (raw === null || raw === undefined || raw === '') {
    return { isCorrect: false, earnedPoints: 0 };
  }
  const selectedIndex = Number(raw);
  const expectedIndex = question?.gridConfig?.correctCellIndex;
  const isCorrect = Number.isInteger(selectedIndex)
    && expectedIndex !== null
    && expectedIndex !== undefined
    && selectedIndex === Number(expectedIndex);
  const earnedPoints = isCorrect ? Number(question.points) || 0 : 0;
  return { isCorrect, earnedPoints };
}

module.exports = { grade: gradeMemoryGrid };
