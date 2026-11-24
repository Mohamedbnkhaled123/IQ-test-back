const authService = require('../services/auth.service');
const { asyncHandler } = require('../utils/async-handler');

const register = asyncHandler(async (req, res) => {
  const data = await authService.registerUser(req.body);
  res.status(201).json({ success: true, data });
});

const login = asyncHandler(async (req, res) => {
  const data = await authService.loginUser(req.body);
  res.json({ success: true, data });
});

const adminLogin = asyncHandler(async (req, res) => {
  const data = authService.loginAdmin(req.body);
  res.json({ success: true, data });
});

const getConfig = asyncHandler(async (_req, res) => {
  const data = authService.getAuthConfig();
  res.json({ success: true, data });
});

module.exports = { register, login, adminLogin, getConfig };
