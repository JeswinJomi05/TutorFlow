const asyncHandler = require('../utils/asyncHandler');
const StudentProfile = require('../models/StudentProfile');
const Session = require('../models/Session');
const ApiError = require('../utils/apiError');

/**
 * @desc    Get authenticated student's profile
 * @route   GET /api/students/me
 * @access  Private (Student only)
 */
const getMyProfile = asyncHandler(async (req, res) => {
  // Always derive student ID from verified req.user._id
  const profile = await StudentProfile.findOne({
    userId: req.user._id,
  }).populate('tutorId', 'name email');

  if (!profile) {
    throw ApiError.notFound('Student profile not found for this account');
  }

  return res.status(200).json({
    success: true,
    data: {
      ...profile.toObject(),
      account: {
        _id: req.user._id,
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
    },
  });
});

/**
 * @desc    Get all sessions for authenticated student
 * @route   GET /api/students/sessions
 * @access  Private (Student only)
 */
const getMySessions = asyncHandler(async (req, res) => {
  // Only query sessions belonging strictly to req.user._id
  const sessions = await Session.find({
    studentId: req.user._id,
  })
    .populate('tutorId', 'name email')
    .sort({ scheduledAt: 1 });

  return res.status(200).json({
    success: true,
    count: sessions.length,
    data: sessions,
  });
});

/**
 * @desc    Get homework assigned to authenticated student from completed/ai_reviewed sessions
 * @route   GET /api/students/homework
 * @access  Private (Student only)
 */
const getMyHomework = asyncHandler(async (req, res) => {
  // Filter sessions that have homework assigned
  const sessionsWithHomework = await Session.find({
    studentId: req.user._id,
    status: { $in: ['completed', 'ai_reviewed'] },
    'aiReview.homework.0': { $exists: true },
  })
    .populate('tutorId', 'name email')
    .sort({ scheduledAt: -1 });

  const homeworkList = sessionsWithHomework.flatMap((session) =>
    (session.aiReview.homework || []).map((task, index) => ({
      id: `${session._id}_hw_${index}`,
      taskId: index + 1,
      sessionId: session._id,
      sessionTopic: session.topic,
      sessionDate: session.scheduledAt,
      tutorName: session.tutorId?.name || 'Tutor',
      taskDescription: task,
      nextSessionSuggestion: session.aiReview.nextSessionSuggestion || '',
      summary: session.aiReview.summary || '',
    }))
  );

  return res.status(200).json({
    success: true,
    count: homeworkList.length,
    data: homeworkList,
  });
});

module.exports = {
  getMyProfile,
  getMySessions,
  getMyHomework,
};
