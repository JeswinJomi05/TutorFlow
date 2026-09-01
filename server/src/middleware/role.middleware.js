const ApiError = require('../utils/apiError');

/**
 * Reusable Role-Based Access Control (RBAC) middleware
 * Enforces that authenticated req.user matches one of the allowed roles
 * @param {...string} allowedRoles - 'tutor', 'student', etc.
 * @returns {Function} Express middleware
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('User not authenticated'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access denied. Requires one of [${allowedRoles.join(', ')}] roles, but user is '${req.user.role}'`
        )
      );
    }

    next();
  };
};

module.exports = {
  requireRole,
};
