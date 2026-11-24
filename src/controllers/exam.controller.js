const examService = require('../services/exam.service');
const { asyncHandler } = require('../utils/async-handler');

const startExam = asyncHandler(async (req, res) => {
  const data = await examService.startExam(req.user);
  res.status(201).json({ success: true, data });
});

const submitExam = asyncHandler(async (req, res) => {
  const data = await examService.submitExam(req.user, req.params.attemptId, req.body.answers);
  res.json({ success: true, data });
});

const getResult = asyncHandler(async (req, res) => {
  const data = await examService.getAttemptResult(req.user, req.params.attemptId);
  res.json({ success: true, data });
});

module.exports = { startExam, submitExam, getResult };
