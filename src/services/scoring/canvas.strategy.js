function gradeCanvasConnect(question, submission) {
  const solved = submission?.solved === true
    || submission?.answer === true
    || submission?.answer === 'solved';
  const earnedPoints = solved ? Number(question.points) || 0 : 0;
  return { isCorrect: solved, earnedPoints };
}

module.exports = { grade: gradeCanvasConnect };
