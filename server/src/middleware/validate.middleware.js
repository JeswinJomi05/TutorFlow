const { validationResult } = require('express-validator');
const ApiError = require('../utils/apiError');

/**
 * Middleware to execute express-validator rules and format validation errors
 * @param {Array} validations - Array of validation chains
 * @returns {Function} Express middleware handler
 */
const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const extractedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value,
    }));

    const firstErrorMessage = extractedErrors[0]?.message || 'Validation failed';
    return next(new ApiError(400, firstErrorMessage, extractedErrors));
  };
};

module.exports = {
  validate,
};
