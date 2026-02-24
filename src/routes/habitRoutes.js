const express = require('express');
const router = express.Router();

const {
    createHabit,
    getHabits,
    getHabit,
    updateHabit,
    deleteHabit,
    habitValidation,
} = require('../controllers/habitController');
const { completeHabit, getHabitLogs } = require('../controllers/trackingController');
const { getHabitProgress } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// All habit routes are protected
router.use(protect);

// Core CRUD
router.route('/')
    .get(getHabits)
    .post(habitValidation, validate, createHabit);

router.route('/:id')
    .get(getHabit)
    .put(habitValidation, validate, updateHabit)
    .delete(deleteHabit);

// Daily tracking
router.post('/:id/complete', completeHabit);
router.get('/:id/logs', getHabitLogs);

// Per-habit progress
router.get('/:id/progress', getHabitProgress);

module.exports = router;
