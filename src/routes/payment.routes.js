const express = require('express');
const paymentController = require('../controllers/payment.controller');
const { requireUser } = require('../middlewares/auth.middleware');
const { uploadReceipt } = require('../middlewares/upload.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { verifySelfSchema, verifyBulkSchema } = require('../validators/payment.validator');

const router = express.Router();

router.get('/info', paymentController.getPaymentInfo);
router.post(
  '/verify-self',
  requireUser,
  uploadReceipt.single('receipt'),
  validate(verifySelfSchema),
  paymentController.verifySelf
);
router.post(
  '/verify-bulk',
  requireUser,
  uploadReceipt.single('receipt'),
  validate(verifyBulkSchema),
  paymentController.verifyBulk
);

module.exports = router;
