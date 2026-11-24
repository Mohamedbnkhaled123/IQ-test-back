const grantService = require('../services/grant.service');
const { asyncHandler } = require('../utils/async-handler');

const getDashboard = asyncHandler(async (req, res) => {
  const data = await grantService.getDashboardData(req.user);
  res.json({ success: true, data });
});

module.exports = { getDashboard };
