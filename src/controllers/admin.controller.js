const adminService = require('../services/admin.service');
const { asyncHandler } = require('../utils/async-handler');

const getOverview = asyncHandler(async (_req, res) => {
  const data = await adminService.getAdminOverview();
  res.json({ success: true, data });
});

const listQuestions = asyncHandler(async (_req, res) => {
  const data = await adminService.listQuestions();
  res.json({ success: true, data });
});

const createQuestion = asyncHandler(async (req, res) => {
  const data = await adminService.createQuestion(req.body);
  res.status(201).json({ success: true, data });
});

const updateQuestion = asyncHandler(async (req, res) => {
  const data = await adminService.updateQuestion(req.params.id, req.body);
  res.json({ success: true, data });
});

const deleteQuestion = asyncHandler(async (req, res) => {
  const data = await adminService.deleteQuestion(req.params.id);
  res.json({ success: true, data });
});

const uploadQuestionImage = asyncHandler(async (req, res) => {
  const data = adminService.resolveUploadedImage(req.file);
  res.status(201).json({ success: true, data });
});

const getSettings = asyncHandler(async (_req, res) => {
  const data = await adminService.getSettings();
  res.json({ success: true, data });
});

const updateSettings = asyncHandler(async (req, res) => {
  const data = await adminService.updateSettings(req.body);
  res.json({ success: true, data });
});

const createGrant = asyncHandler(async (req, res) => {
  const data = await adminService.createAdminGrant(req.body);
  res.status(201).json({ success: true, data });
});

const deleteGrant = asyncHandler(async (req, res) => {
  const data = await adminService.deleteAdminGrant(req.params.id);
  res.json({ success: true, data });
});

module.exports = {
  getOverview,
  listQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  uploadQuestionImage,
  getSettings,
  updateSettings,
  createGrant,
  deleteGrant
};
