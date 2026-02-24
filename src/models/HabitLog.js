const mongoose = require('mongoose');

const habitLogSchema = new mongoose.Schema(
    {
        habitId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Habit',
            required: [true, 'Habit ID is required'],
            index: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            index: true,
        },
        // Stored as a plain YYYY-MM-DD string (UTC) to ensure date-only uniqueness
        completedDate: {
            type: String,
            required: [true, 'Completed date is required'],
            match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'],
        },
    },
    { timestamps: true }
);

// Compound unique index: one log per habit per day
habitLogSchema.index({ habitId: 1, completedDate: 1 }, { unique: true });

module.exports = mongoose.model('HabitLog', habitLogSchema);
