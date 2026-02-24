const express = require('express');
const router = express.Router();

const { getDashboard } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

// GET /api/dashboard  (Protected)
router.get('/', protect, getDashboard);

module.exports = router;
