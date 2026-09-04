const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Authentication middleware that verifies JWT from Authorization header or HTTP-only cookies
 * Attaches verified user object to req.user
 */
const requireAuth = asyncHandler(async (req, res, next) => {
  let token = null;

  // 1. Check Authorization Bearer header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  // 2. Check HTTP-only cookie
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // 3. Fallback header
  else if (req.headers['x-auth-token']) {
    token = req.headers['x-auth-token'];
  }

  if (!token) {
    throw ApiError.unauthorized('Authentication required. No token provided.');
  }

  try {
    const secret = process.env.JWT_SECRET || 'tutorflow_super_secret_jwt_key_development_2026';
    const decoded = jwt.verify(token, secret);

    const userId = decoded.userId || decoded.id;
    if (!userId) {
      throw ApiError.unauthorized('Invalid token payload.');
    }

    // Query database for fresh user status (excluding password)
    const user = await User.findById(userId).select('-password');
    

    if (!user) {
      throw ApiError.unauthorized('User associated with this token no longer exists.');
    }

    if (!user.isActive) {
      throw ApiError.unauthorized('User account has been deactivated.');
    }

    // Attach verified user to request
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Session has expired. Please log in again.');
    }
    if (error.name === 'JsonWebTokenError') {
      throw ApiError.unauthorized('Invalid authentication token.');
    }
    throw ApiError.unauthorized('Authentication failed.');
  }
});

module.exports = {
  requireAuth,
};
