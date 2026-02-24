const { validationResult } = require('express-validator');

/**
 * Middleware to collect express-validator errors and return a 422 if any exist.
 * Place this AFTER your validation chain in route definitions.
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
        });
    }
    next();
};

module.exports = { validate };
