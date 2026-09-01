const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Session = require('../models/Session');
const ApiError = require('../utils/apiError');

/**
 * @desc    Tutor creates a new student account and profile
 * @route   POST /api/tutors/students
 * @access  Private (Tutor only)
 */
const createStudent = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    subject,
    currentLevel,
    learningGoals,
    weakAreas,
  } = req.body;

  const normalizedEmail = email.toLowerCase().trim();

  // 1. Check if user with this email already exists
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw ApiError.conflict(`A user with email '${normalizedEmail}' already exists`);
  }

  // 2. Create Student User - automatically locked to req.user._id (never from req.body)
  const student = await User.create({
    name,
    email: normalizedEmail,
    password,
    role: 'student',
    tutorId: req.user._id,
    isActive: true,
  });

  // 3. Create Student Profile
  const profile = await StudentProfile.create({
    userId: student._id,
    tutorId: req.user._id,
    name,
    subject,
    currentLevel,
    learningGoals: learningGoals || '',
    weakAreas: weakAreas || '',
  });

  return res.status(201).json({
    success: true,
    message: 'Student account and profile created successfully',
    data: {
      student: {
        _id: student._id,
        id: student._id,
        name: student.name,
        email: student.email,
        role: student.role,
        tutorId: student.tutorId,
        createdAt: student.createdAt,
      },
      profile,
    },
  });
});

/**
 * @desc    Get all students belonging to the authenticated tutor
 * @route   GET /api/tutors/students
 * @access  Private (Tutor only)
 */
const getStudents = asyncHandler(async (req, res) => {
  // Query strictly enforces role: student AND tutorId: req.user._id
  const students = await User.find({
    role: 'student',
    tutorId: req.user._id,
  })
    .select('-password')
    .sort({ createdAt: -1 });

  // Attach associated profiles
  const studentIds = students.map((s) => s._id);
  const profiles = await StudentProfile.find({ userId: { $in: studentIds } });

  const profileMap = new Map();
  profiles.forEach((p) => profileMap.set(p.userId.toString(), p));

  const enrichedStudents = students.map((student) => ({
    _id: student._id,
    id: student._id,
    name: student.name,
    email: student.email,
    role: student.role,
    tutorId: student.tutorId,
    createdAt: student.createdAt,
    profile: profileMap.get(student._id.toString()) || null,
  }));

  return res.status(200).json({
    success: true,
    count: enrichedStudents.length,
    data: enrichedStudents,
  });
});

/**
 * @desc    Get student details by ID (verified ownership)
 * @route   GET /api/tutors/students/:studentId
 * @access  Private (Tutor only)
 */
const getStudentById = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  // Strict ownership query: must match studentId, role='student', AND tutorId = req.user._id
  const student = await User.findOne({
    _id: studentId,
    role: 'student',
    tutorId: req.user._id,
  }).select('-password');

  if (!student) {
    throw ApiError.notFound('Student not found');
  }

  const profile = await StudentProfile.findOne({
    userId: student._id,
    tutorId: req.user._id,
  });

  const recentSessions = await Session.find({
    tutorId: req.user._id,
    studentId: student._id,
  })
    .sort({ scheduledAt: -1 })
    .limit(10);

  return res.status(200).json({
    success: true,
    data: {
      student,
      profile,
      sessions: recentSessions,
    },
  });
});

module.exports = {
  createStudent,
  getStudents,
  getStudentById,
};
