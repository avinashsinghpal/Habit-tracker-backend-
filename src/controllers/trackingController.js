const Habit = require('../models/Habit');
const HabitLog = require('../models/HabitLog');

/**
 * @desc    Mark a habit as completed for today (idempotent check)
 * @route   POST /api/habits/:id/complete
 * @access  Protected
 */
exports.completeHabit = async (req, res, next) => {
    try {
        // Verify habit belongs to user
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

        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        // Check if already completed today
        const existing = await HabitLog.findOne({
            habitId: habit._id,
            userId: req.user._id,
            completedDate: today,
        });

        if (existing) {
            return res.status(409).json({
                success: false,
                message: 'Habit already completed for today.',
                completedAt: existing.createdAt,
            });
        }

        const log = await HabitLog.create({
            habitId: habit._id,
            userId: req.user._id,
            completedDate: today,
        });

        res.status(200).json({
            success: true,
            message: 'Habit marked as completed for today! 🎉',
            log,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Get all completion logs for a specific habit
 * @route   GET /api/habits/:id/logs
 * @access  Protected
 */
exports.getHabitLogs = async (req, res, next) => {
    try {
        const habit = await Habit.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!habit) {
            return res
                .status(404)
                .json({ success: false, message: 'Habit not found.' });
        }

        const logs = await HabitLog.find({
            habitId: habit._id,
            userId: req.user._id,
        }).sort({ completedDate: -1 });

        res.status(200).json({
            success: true,
            count: logs.length,
            logs,
        });
    } catch (err) {
        next(err);
    }
};
