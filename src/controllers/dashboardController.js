const Habit = require('../models/Habit');
const HabitLog = require('../models/HabitLog');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Get the last N calendar days as YYYY-MM-DD strings (most recent first).
 */
const getLastNDays = (n) => {
    const days = [];
    for (let i = 0; i < n; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().split('T')[0]);
    }
    return days; // [today, yesterday, ...]
};

/**
 * Calculate the current streak (consecutive days with ≥1 completion).
 * Uses an ordered array of unique completed dates (most recent first).
 */
const calculateStreak = (uniqueDatesDesc) => {
    if (!uniqueDatesDesc.length) return 0;

    const today = new Date().toISOString().split('T')[0];
    let streak = 0;
    let expected = today;

    for (const date of uniqueDatesDesc) {
        if (date === expected) {
            streak++;
            const d = new Date(expected);
            d.setDate(d.getDate() - 1);
            expected = d.toISOString().split('T')[0];
        } else {
            break;
        }
    }
    return streak;
};

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * @desc    Overall dashboard stats for the logged-in user
 * @route   GET /api/dashboard
 * @access  Protected
 */
exports.getDashboard = async (req, res, next) => {
    try {
        const userId = req.user._id;

        // All active habits
        const habits = await Habit.find({ userId, isActive: true });
        const totalHabits = habits.length;

        if (totalHabits === 0) {
            return res.status(200).json({
                success: true,
                stats: {
                    totalHabits: 0,
                    completedToday: 0,
                    completionPercentageToday: 0,
                    currentStreak: 0,
                    longestStreak: 0,
                    totalCompletions: 0,
                    weeklyProgress: [],
                },
            });
        }

        const habitIds = habits.map((h) => h._id);
        const last7Days = getLastNDays(7);
        const today = last7Days[0];

        // Completions in the last 7 days
        const recentLogs = await HabitLog.find({
            userId,
            habitId: { $in: habitIds },
            completedDate: { $in: last7Days },
        });

        // Today's completions
        const todayLogs = recentLogs.filter((l) => l.completedDate === today);
        const completedToday = new Set(todayLogs.map((l) => l.habitId.toString())).size;
        const completionPercentageToday =
            totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;

        // Weekly progress chart data: [{date, completed, total}]
        const weeklyProgress = last7Days.reverse().map((date) => {
            const dayLogs = recentLogs.filter((l) => l.completedDate === date);
            const uniqueCompleted = new Set(dayLogs.map((l) => l.habitId.toString())).size;
            return { date, completed: uniqueCompleted, total: totalHabits };
        });

        // Current streak: look at all-time logs for consecutive days with ≥1 completion
        const allLogs = await HabitLog.find({ userId, habitId: { $in: habitIds } });
        const uniqueDatesSet = new Set(allLogs.map((l) => l.completedDate));
        const uniqueDatesDesc = [...uniqueDatesSet].sort((a, b) =>
            b.localeCompare(a)
        );
        const currentStreak = calculateStreak(uniqueDatesDesc);

        // Total completions all time
        const totalCompletions = allLogs.length;

        // Longest streak calculation
        let longestStreak = 0;
        let tempStreak = 0;
        const allDatesAsc = [...uniqueDatesSet].sort((a, b) => a.localeCompare(b));
        for (let i = 0; i < allDatesAsc.length; i++) {
            if (i === 0) {
                tempStreak = 1;
            } else {
                const prev = new Date(allDatesAsc[i - 1]);
                const curr = new Date(allDatesAsc[i]);
                const diff = (curr - prev) / (1000 * 60 * 60 * 24);
                if (diff === 1) {
                    tempStreak++;
                } else {
                    tempStreak = 1;
                }
            }
            if (tempStreak > longestStreak) longestStreak = tempStreak;
        }

        res.status(200).json({
            success: true,
            stats: {
                totalHabits,
                completedToday,
                completionPercentageToday,
                currentStreak,
                longestStreak,
                totalCompletions,
                weeklyProgress, // Array of 7 items [{date, completed, total}]
            },
        });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Progress data for a single habit (chart-ready)
 * @route   GET /api/habits/:id/progress
 * @access  Protected
 */
exports.getHabitProgress = async (req, res, next) => {
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

        const allLogs = await HabitLog.find({
            habitId: habit._id,
            userId: req.user._id,
        }).sort({ completedDate: -1 });

        const totalCompletions = allLogs.length;

        // Streak for this habit
        const datesDesc = allLogs.map((l) => l.completedDate);
        const currentStreak = calculateStreak(datesDesc);

        // Days since habit was created
        const daysSinceCreation = Math.max(
            1,
            Math.floor((Date.now() - new Date(habit.createdAt)) / (1000 * 60 * 60 * 24)) + 1
        );
        const completionRate = Math.round((totalCompletions / daysSinceCreation) * 100);

        // Last 7-day breakdown
        const last7Days = getLastNDays(7);
        const logsSet = new Set(allLogs.map((l) => l.completedDate));
        const weeklyProgress = last7Days.reverse().map((date) => ({
            date,
            completed: logsSet.has(date),
        }));

        // Full log history (all dates)
        const allCompletedDates = allLogs.map((l) => l.completedDate);

        res.status(200).json({
            success: true,
            habit: {
                id: habit._id,
                title: habit.title,
                description: habit.description,
                createdAt: habit.createdAt,
            },
            progress: {
                totalCompletions,
                currentStreak,
                daysSinceCreation,
                completionRate: Math.min(completionRate, 100), // cap at 100%
                weeklyProgress,
                allCompletedDates,
            },
        });
    } catch (err) {
        next(err);
    }
};
