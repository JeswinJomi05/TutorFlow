const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Session = require('../models/Session');
const { validateStatusTransition } = require('../services/session.service');
const geminiService = require('../services/gemini.service');

const historyFor = (tutorId, studentId, excludeId) => Session.find({ tutorId, studentId, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })
  .sort({ scheduledAt: -1 }).limit(10).select('topic scheduledAt status notes aiPlan aiReview').lean();

const ownedSession = async (sessionId, tutorId) => {
  const session = await Session.findOne({ _id: sessionId, tutorId });
  if (!session) throw ApiError.notFound('Session not found');
  return session;
};

const ownedStudent = async (studentId, tutorId) => {
  const student = await User.findOne({ _id: studentId, role: 'student', tutorId }).select('_id name');
  if (!student) throw ApiError.notFound('Student not found');
  let profile = await StudentProfile.findOne({ userId: student._id, tutorId });
  if (!profile) {
    profile = await StudentProfile.findOne({ userId: student._id });
  }
  if (!profile) {
    profile = await StudentProfile.create({
      userId: student._id,
      tutorId,
      name: student.name,
      subject: 'General Tutoring',
      currentLevel: 'Standard',
      learningGoals: 'Improve academic performance and conceptual understanding',
      weakAreas: '',
    });
  }
  return { student, profile };
};

const generateSessionPlan = asyncHandler(async (req, res) => {
  const session = await ownedSession(req.params.sessionId, req.user._id);
  if (session.status !== 'scheduled') throw ApiError.badRequest('Session plans can only be generated for scheduled sessions');
  const studentId = session.studentId?._id || session.studentId;
  const { profile } = await ownedStudent(studentId, req.user._id);
  const pastSessions = await historyFor(req.user._id, studentId, session._id);
  const plan = await geminiService.generateSessionPlan({ profile, session, pastSessions });
  session.aiPlan = { ...plan, generatedAt: new Date() };
  await session.save();
  return res.status(200).json({ success: true, data: session.aiPlan });
});

const generateSessionReview = asyncHandler(async (req, res) => {
  const session = await ownedSession(req.params.sessionId, req.user._id);
  if (session.status !== 'completed' && session.status !== 'ai_reviewed') {
    throw ApiError.badRequest('AI reviews can only be generated for completed sessions');
  }

  let notesToUse = (req.body?.notes && req.body.notes.trim()) || (session.notes && session.notes.trim());
  if (!notesToUse) {
    const objectives = session.aiPlan?.learningObjectives?.join(', ');
    notesToUse = objectives
      ? `Completed session covering ${session.topic}. Objectives: ${objectives}. Student engaged with lesson practice.`
      : `Completed lesson on ${session.topic}. Student reviewed core concepts.`;
    session.notes = notesToUse;
  }

  const studentId = session.studentId?._id || session.studentId;
  const { profile } = await ownedStudent(studentId, req.user._id);
  const previousSessions = await historyFor(req.user._id, studentId, session._id);
  const homeworkCount = req.body?.homeworkCount ? parseInt(req.body.homeworkCount, 10) : 3;
  const review = await geminiService.generateSessionReview({ profile, session, previousSessions, homeworkCount });
  validateStatusTransition(session.status, 'ai_reviewed');
  session.aiReview = { ...review, generatedAt: new Date() };
  session.status = 'ai_reviewed';
  await session.save();
  return res.status(200).json({ success: true, data: { aiReview: session.aiReview, status: session.status } });
});

const generateProgressSummary = asyncHandler(async (req, res) => {
  const { profile } = await ownedStudent(req.params.studentId, req.user._id);
  const sessions = await historyFor(req.user._id, profile.userId);
  const summary = await geminiService.generateProgressSummary({ profile, sessions });
  return res.status(200).json({ success: true, data: summary });
});

module.exports = { generateSessionPlan, generateSessionReview, generateProgressSummary };