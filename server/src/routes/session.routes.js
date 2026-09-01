const express = require('express');
const { body, param } = require('express-validator');
const {
  createSession,
  getSessionById,
  updateSessionStatus,
  updateSessionNotes,
} = require('../controllers/session.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = express.Router();

// Require authentication on all session routes
router.use(requireAuth);

// Validation rules
const createSessionValidation = [
  body('studentId')
    .notEmpty()
    .withMessage('Student ID is required')
    .isMongoId()
    .withMessage('Invalid student ID format'),
  body('scheduledAt')
    .notEmpty()
    .withMessage('Scheduled date/time is required')
    .isISO8601()
    .withMessage('Scheduled date must be a valid ISO 8601 date string'),
  body('topic')
    .trim()
    .notEmpty()
    .withMessage('Session topic is required')
    .isLength({ max: 200 })
    .withMessage('Topic cannot exceed 200 characters'),
];

const updateStatusValidation = [
  param('sessionId').isMongoId().withMessage('Invalid session ID format'),
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['scheduled', 'in_progress', 'completed', 'ai_reviewed'])
    .withMessage('Invalid status value. Allowed: scheduled, in_progress, completed, ai_reviewed'),
];

const sessionIdParamValidation = [
  param('sessionId').isMongoId().withMessage('Invalid session ID format'),
];

// Session routes
router.post('/', requireRole('tutor'), validate(createSessionValidation), createSession);
router.get('/:sessionId', validate(sessionIdParamValidation), getSessionById);
router.patch('/:sessionId/status', requireRole('tutor'), validate(updateStatusValidation), updateSessionStatus);
router.patch('/:sessionId/notes', requireRole('tutor'), validate(sessionIdParamValidation), updateSessionNotes);

module.exports = router;
