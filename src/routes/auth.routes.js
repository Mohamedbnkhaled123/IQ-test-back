const express = require('express');
const authController = require('../controllers/auth.controller');
const { validate } = require('../middlewares/validate.middleware');
const { registerSchema, loginSchema, adminLoginSchema } = require('../validators/auth.validator');

const router = express.Router();

router.get('/config', authController.getConfig);
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/admin/login', validate(adminLoginSchema), authController.adminLogin);

module.exports = router;
