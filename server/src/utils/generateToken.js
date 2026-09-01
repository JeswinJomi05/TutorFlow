const jwt = require('jsonwebtoken');

/**
 * Generate signed JWT token
 * @param {Object} user - User document or payload object
 * @returns {string} Signed JWT
 */
const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'tutorflow_super_secret_jwt_key_development_2026';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  const payload = {
    userId: user._id || user.id,
    id: user._id || user.id,
    role: user.role,
    email: user.email,
  };

  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Get cookie options for secure HTTP-only token transmission
 * @returns {Object} Cookie options
 */
const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const days = parseInt(process.env.COOKIE_EXPIRES_IN || '7', 10);

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: days * 24 * 60 * 60 * 1000,
  };
};

module.exports = {
  generateToken,
  getCookieOptions,
};
