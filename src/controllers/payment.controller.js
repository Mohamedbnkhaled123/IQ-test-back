const paymentService = require('../services/payment.service');
const { asyncHandler } = require('../utils/async-handler');

const getPaymentInfo = asyncHandler(async (_req, res) => {
  const data = await paymentService.getPaymentInfo();
  res.json({ success: true, data });
});

const verifySelf = asyncHandler(async (req, res) => {
  const data = await paymentService.verifySelfPayment(req.user, {
    method: req.body.method,
    file: req.file
  });
  res.status(201).json({ success: true, data });
});

const verifyBulk = asyncHandler(async (req, res) => {
  const data = await paymentService.verifyBulkPayment(req.user, {
    method: req.body.method,
    nominees: req.body.nominees,
    file: req.file
  });
  res.status(201).json({ success: true, data });
});

module.exports = { getPaymentInfo, verifySelf, verifyBulk };
