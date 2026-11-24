function sanitizeOptions(options) {
  if (!Array.isArray(options)) {
    return [];
  }
  return options.map((opt) => ({
    key: opt.key,
    label: opt.label
  }));
}

function sanitizeGridConfig(gridConfig) {
  if (!gridConfig) {
    return null;
  }
  return {
    rows: gridConfig.rows,
    cols: gridConfig.cols
  };
}

function sanitizeCanvasConfig(canvasConfig) {
  if (!canvasConfig) {
    return null;
  }
  return {
    colors: Array.isArray(canvasConfig.colors) ? [...canvasConfig.colors] : [],
    requiredPairs: canvasConfig.requiredPairs
  };
}

function toStudentQuestionDTO(question) {
  const dto = {
    _id: question._id,
    section: question.section,
    sectionTitle: question.sectionTitle,
    order: question.order,
    prompt: question.prompt,
    imageUrl: question.imageUrl || null,
    questionType: question.questionType,
    inputConstraint: question.inputConstraint || 'any',
    timeLimitSeconds: question.timeLimitSeconds,
    points: question.points,
    options: sanitizeOptions(question.options)
  };
  if (question.questionType === 'memory_grid') {
    dto.gridConfig = sanitizeGridConfig(question.gridConfig);
  }
  if (question.questionType === 'canvas_connect') {
    dto.canvasConfig = sanitizeCanvasConfig(question.canvasConfig);
  }
  return dto;
}

function toFinalResultDTO(attempt, user) {
  const examineeName = (user && user.name) || (attempt.userId && attempt.userId.name) || '';
  return {
    attemptId: attempt._id,
    examineeName,
    attemptNumber: attempt.attemptNumber,
    submittedAt: attempt.submittedAt,
    sectionScores: attempt.sectionScores,
    rawScore: attempt.rawScore,
    maxScore: attempt.maxScore,
    iqScore: attempt.iqScore,
    iqClassification: attempt.iqClassification,
    personalityProfile: Array.isArray(attempt.personalityProfile)
      ? attempt.personalityProfile.map((item) => ({
          traitName: item.traitName,
          traitValue: item.traitValue
        }))
      : []
  };
}

function toUserDTO(user) {
  return {
    _id: user._id,
    name: user.name,
    phone: user.phone,
    dateOfBirth: user.dateOfBirth,
    age: user.age,
    occupation: user.occupation,
    hobbies: user.hobbies,
    selfIqRating: user.selfIqRating,
    completedAttemptsCount: user.completedAttemptsCount,
    createdAt: user.createdAt
  };
}

module.exports = {
  toStudentQuestionDTO,
  toFinalResultDTO,
  toUserDTO
};
