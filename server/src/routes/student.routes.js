const express = require('express');
const {
  getMyProfile,
  getMySessions,
  getMyHomework,
} = require('../controllers/student.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

const router = express.Router();

// Apply auth and role protection to all student routes
router.use(requireAuth, requireRole('student'));

router.get('/me', getMyProfile);
router.get('/sessions', getMySessions);
router.get('/homework', getMyHomework);

module.exports = router;
