const { body } = require('express-validator');
const Habit = require('../models/Habit');
const HabitLog = require('../models/HabitLog');

// ─── Validation Rules ────────────────────────────────────────────────────────

exports.habitValidation = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Title is required')
        .isLength({ max: 100 })
        .withMessage('Title cannot exceed 100 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description cannot exceed 500 characters'),
];

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * @desc    Create a new habit
 * @route   POST /api/habits
 * @access  Protected
 */
exports.createHabit = async (req, res, next) => {
    try {
        const { title, description } = req.body;
        const habit = await Habit.create({
            userId: req.user._id,
            title,
            description,
        });
        res.status(201).json({ success: true, habit });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Get all active habits for the logged-in user
 * @route   GET /api/habits
 * @access  Protected
 */
exports.getHabits = async (req, res, next) => {
    try {
        const habits = await Habit.find({
            userId: req.user._id,
            isActive: true,
        }).sort({ createdAt: -1 });

        // For each habit, check if completed today
        const today = new Date().toISOString().split('T')[0];
        const habitIds = habits.map((h) => h._id);
        const todayLogs = await HabitLog.find({
            habitId: { $in: habitIds },
            userId: req.user._id,
            completedDate: today,
        });

        const completedTodaySet = new Set(todayLogs.map((l) => l.habitId.toString()));

        const habitsWithStatus = habits.map((h) => ({
            ...h.toObject(),
            completedToday: completedTodaySet.has(h._id.toString()),
        }));

        res.status(200).json({ success: true, count: habits.length, habits: habitsWithStatus });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Get single habit by ID
 * @route   GET /api/habits/:id
 * @access  Protected
 */
exports.getHabit = async (req, res, next) => {
    try {
        const habit = await Habit.findOne({
            _id: req.params.id,
            userId: req.user._id,
            isActive: true,
        });

        if (!habit) {
            return res
                .status(404)
                .json({ success: false, message: 'Habit not found.' });
        }

        const today = new Date().toISOString().split('T')[0];
        const log = await HabitLog.findOne({
            habitId: habit._id,
            userId: req.user._id,
            completedDate: today,
        });

        res.status(200).json({
            success: true,
            habit: { ...habit.toObject(), completedToday: !!log },
        });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Update a habit (title and/or description)
 * @route   PUT /api/habits/:id
 * @access  Protected
 */
exports.updateHabit = async (req, res, next) => {
    try {
        const { title, description } = req.body;

        const habit = await Habit.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id, isActive: true },
            { title, description },
            { new: true, runValidators: true }
        );

        if (!habit) {
            return res
                .status(404)
                .json({ success: false, message: 'Habit not found.' });
        }

        res.status(200).json({ success: true, habit });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Delete a habit (soft-delete: sets isActive = false)
 * @route   DELETE /api/habits/:id
 * @access  Protected
 */
exports.deleteHabit = async (req, res, next) => {
    try {
        const habit = await Habit.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id, isActive: true },
            { isActive: false },
            { new: true }
        );

        if (!habit) {
            return res
                .status(404)
                .json({ success: false, message: 'Habit not found.' });
        }

        res
            .status(200)
            .json({ success: true, message: 'Habit deleted successfully.' });
    } catch (err) {
        next(err);
    }
};
