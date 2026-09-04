const asyncHandler = require('../utils/asyncHandler');
const Session = require('../models/Session');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const {
  validateStatusTransition,
  validateNotesEditable,
  checkSchedulingConflict,
} = require('../services/session.service');

/**
 * @desc    Tutor creates a new scheduled session
 * @route   POST /api/sessions
 * @access  Private (Tutor only)
 */
const createSession = asyncHandler(async (req, res) => {
  const { studentId, scheduledAt, topic } = req.body;

  // 1. Verify student exists and belongs to this tutor
  const student = await User.findOne({
    _id: studentId,
    role: 'student',
    tutorId: req.user._id,
  });

  if (!student) {
    throw ApiError.badRequest('Invalid student. Student not found or does not belong to you.');
  }

  // 2. Check for tutor scheduling conflicts
  const parsedDate = new Date(scheduledAt);
  if (Number.isNaN(parsedDate.getTime()) || parsedDate <= new Date()) {
    throw ApiError.badRequest('Session date and time must be in the future');
  }

  await checkSchedulingConflict(req.user._id, parsedDate);

  // 3. Create Session with tutorId locked to authenticated user
  const session = await Session.create({
    tutorId: req.user._id,
    studentId: student._id,
    scheduledAt: parsedDate,
    topic,
    status: 'scheduled',
  });

  const populatedSession = await Session.findById(session._id)
    .populate('studentId', 'name email')
    .populate('tutorId', 'name email');

  return res.status(201).json({
    success: true,
    message: 'Session scheduled successfully',
    data: populatedSession,
  });
});

const getSessions = asyncHandler(async (req, res) => {
  const sessions = await Session.find({ tutorId: req.user._id })
    .populate('studentId', 'name email')
    .sort({ scheduledAt: 1 });

  return res.status(200).json({ success: true, count: sessions.length, data: sessions });
});

/**
 * @desc    Get session details by ID (enforcing ownership)
 * @route   GET /api/sessions/:sessionId
 * @access  Private (Tutor or assigned Student)
 */
const getSessionById = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  const session = await Session.findById(sessionId)
    .populate('studentId', 'name email')
    .populate('tutorId', 'name email');

  if (!session) {
    throw ApiError.notFound('Session not found');
  }

  // Enforce role-based data isolation
  const isAssignedTutor =
    req.user.role === 'tutor' &&
    session.tutorId._id.toString() === req.user._id.toString();

  const isAssignedStudent =
    req.user.role === 'student' &&
    session.studentId._id.toString() === req.user._id.toString();

  if (!isAssignedTutor && !isAssignedStudent) {
    throw ApiError.forbidden('Access denied: You do not have permission to view this session');
  }

  return res.status(200).json({
    success: true,
    data: session,
  });
});

/**
 * @desc    Update session lifecycle status
 * @route   PATCH /api/sessions/:sessionId/status
 * @access  Private (Tutor only)
 */
const updateSessionStatus = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { status } = req.body;

  if (!status) {
    throw ApiError.badRequest("Status field is required (e.g., 'in_progress' or 'completed')");
  }

  const session = await Session.findById(sessionId);

  if (!session) {
    throw ApiError.notFound('Session not found');
  }

  // Verify tutor owns this session
  if (session.tutorId.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Access denied: You can only update your own sessions');
  }

  // Enforce centralized state machine validation
  validateStatusTransition(session.status, status);

  // Update status
  session.status = status;

  await session.save();

  const updatedSession = await Session.findById(session._id)
    .populate('studentId', 'name email')
    .populate('tutorId', 'name email');

  return res.status(200).json({
    success: true,
    message: `Session status successfully updated to '${status}'`,
    data: updatedSession,
  });
});

/**
 * @desc    Update session notes (only during 'in_progress' state)
 * @route   PATCH /api/sessions/:sessionId/notes
 * @access  Private (Tutor only)
 */
const updateSessionNotes = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { notes } = req.body;

  if (notes === undefined || notes === null) {
    throw ApiError.badRequest('Notes content is required');
  }

  const session = await Session.findById(sessionId);

  if (!session) {
    throw ApiError.notFound('Session not found');
  }

  // Verify tutor owns this session
  if (session.tutorId.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Access denied: You can only update your own sessions');
  }

  // Enforce lifecycle constraint: notes are editable ONLY in 'in_progress' status
  validateNotesEditable(session.status);

  session.notes = notes;
  await session.save();

  return res.status(200).json({
    success: true,
    message: 'Session notes updated successfully',
    data: session,
  });
});

module.exports = {
  createSession,
  getSessions,
  getSessionById,
  updateSessionStatus,
  updateSessionNotes,
};
