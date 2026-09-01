const express = require('express');
const { body, param } = require('express-validator');
const {
  createStudent,
  getStudents,
  getStudentById,
} = require('../controllers/tutor.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = express.Router();

// Apply auth and role protection to all tutor routes
router.use(requireAuth, requireRole('tutor'));

// Validation for student creation
const createStudentValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Student name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Student email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Temporary password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Subject is required'),
  body('currentLevel')
    .trim()
    .notEmpty()
    .withMessage('Current level is required'),
  body('learningGoals')
    .optional()
    .trim(),
  body('weakAreas')
    .optional()
    .trim(),
];

const studentIdParamValidation = [
  param('studentId')
    .isMongoId()
    .withMessage('Invalid student ID format'),
];

// Routes
router.post('/students', validate(createStudentValidation), createStudent);
router.get('/students', getStudents);
router.get('/students/:studentId', validate(studentIdParamValidation), getStudentById);

module.exports = router;
