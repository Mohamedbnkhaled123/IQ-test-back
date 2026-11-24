const express = require('express');
const examController = require('../controllers/exam.controller');
const { requireUser } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { submitExamSchema } = require('../validators/exam.validator');

const router = express.Router();

router.post('/start', requireUser, examController.startExam);
router.post('/:attemptId/submit', requireUser, validate(submitExamSchema), examController.submitExam);
router.get('/:attemptId/result', requireUser, examController.getResult);

module.exports = router;
