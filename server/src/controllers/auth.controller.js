const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/auth.service');
const { getCookieOptions } = require('../utils/generateToken');

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;

  const { token, user, cookieOptions } = await authService.loginUser({
    email,
    password,
    role,
  });

  // Attach HTTP-only cookie for secure browser sessions
  res.cookie('token', token, cookieOptions);

  return res.status(200).json({
    success: true,
    token,
    user,
    message: 'Login successful',
  });
});

/**
 * @desc    Get current authenticated user details
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  return res.status(200).json({
    success: true,
    user: {
      _id: req.user._id,
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      tutorId: req.user.tutorId,
      createdAt: req.user.createdAt,
    },
  });
});


/**
 * @desc    Log out user and clear auth cookie
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  const cookieOptions = getCookieOptions();
  res.clearCookie('token', cookieOptions);

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

module.exports = {
  login,
  getMe,
  logout,
};
