const express = require('express');
const { param } = require('express-validator');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const { generateSessionPlan, generateSessionReview, generateProgressSummary } = require('../controllers/ai.controller');

const router = express.Router();
const idValidation = [param('sessionId').isMongoId().withMessage('Invalid session ID format')];
const studentValidation = [param('studentId').isMongoId().withMessage('Invalid student ID format')];

router.use(requireAuth, requireRole('tutor'));
router.post('/session-plan/:sessionId', validate(idValidation), generateSessionPlan);
router.post('/session-review/:sessionId', validate(idValidation), generateSessionReview);
router.get('/progress/:studentId', validate(studentValidation), generateProgressSummary);

module.exports = router;