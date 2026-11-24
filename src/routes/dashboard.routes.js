const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { requireUser } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', requireUser, dashboardController.getDashboard);

module.exports = router;
