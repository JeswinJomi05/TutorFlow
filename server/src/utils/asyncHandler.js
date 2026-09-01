/**
 * Higher-order function to catch unhandled async errors and pass them to the express error handler
 * @param {Function} fn - Async express controller function
 * @returns {Function} Express middleware handler
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
