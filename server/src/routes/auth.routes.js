const express = require('express');
const { body } = require('express-validator');
const { login, getMe, logout } = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = express.Router();

// Validation rules
const loginValidation = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  body('role')
    .optional()
    .isIn(['tutor', 'student'])
    .withMessage('Role must be either tutor or student'),
];

// Routes
router.post('/login', validate(loginValidation), login);
router.get('/me', requireAuth, getMe);
router.post('/logout', logout);

module.exports = router;
