const express = require('express');
const adminController = require('../controllers/admin.controller');
const { requireAdmin } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { uploadQuestionImage } = require('../middlewares/upload.middleware');
const {
  questionPayloadSchema,
  updateQuestionSchema,
  updateSettingsSchema,
  createGrantSchema
} = require('../validators/admin.validator');

const router = express.Router();

router.use(requireAdmin);

router.get('/overview', adminController.getOverview);
router.get('/questions', adminController.listQuestions);
router.post('/questions', validate(questionPayloadSchema), adminController.createQuestion);
router.put('/questions/:id', validate(updateQuestionSchema), adminController.updateQuestion);
router.delete('/questions/:id', adminController.deleteQuestion);
router.post('/questions/upload-image', uploadQuestionImage.single('image'), adminController.uploadQuestionImage);
router.get('/settings', adminController.getSettings);
router.put('/settings', validate(updateSettingsSchema), adminController.updateSettings);
router.post('/grants', validate(createGrantSchema), adminController.createGrant);
router.delete('/grants/:id', adminController.deleteGrant);

module.exports = router;
