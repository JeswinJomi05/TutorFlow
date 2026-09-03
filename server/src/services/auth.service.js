const User = require('../models/User');
const ApiError = require('../utils/apiError');
const { generateToken, getCookieOptions } = require('../utils/generateToken');
/**
 * Authenticate user credentials and issue token
 * @param {Object} credentials - { email, password, role }
 * @returns {Promise<Object>}
 */
const loginUser = async ({ email, password, role }) => {
  if (!email || !password) {
    throw ApiError.badRequest('Email and password are required');
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Find user and explicitly select password
  const user = await User.findOne({ email: normalizedEmail }).select('+password');



  if (!user) {
    console.log(user)
    throw ApiError.unauthorized('Invalid email or password'+ user);
  }

  if (!user.isActive) {
    throw ApiError.unauthorized('Account is deactivated. Please contact your administrator.');
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Verify requested role matches actual database role
  if (role && user.role !== role) {
    throw ApiError.unauthorized('User role does not match requested role');
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate JWT token
  const token = generateToken(user);
  const cookieOptions = getCookieOptions();

  // Prepare safe user object
  const safeUser = {
    _id: user._id,
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    tutorId: user.tutorId,
    createdAt: user.createdAt,
  };

  return {
    token,
    user: safeUser,
    cookieOptions,
  };
};

module.exports = {
  loginUser,
};
