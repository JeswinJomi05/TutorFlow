require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Session = require('../models/Session');

const seedDatabase = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tutorflow';

  console.log('[Seed] Connecting to database...');
  await mongoose.connect(mongoUri);
  console.log('[Seed] Connected successfully.');

  try {
    // 1. Seed or Upsert Tutor Account
    const tutorEmail = 'tutor@tutorflow.com';
    let tutor = await User.findOne({ email: tutorEmail });

    if (!tutor) {
      tutor = await User.create({
        name: 'Prof. Sarah Jenkins',
        email: tutorEmail,
        password: 'Tutor@123',
        role: 'tutor',
        tutorId: null,
        isActive: true,
      });
      console.log(`[Seed] Created Tutor: ${tutor.name} (${tutor.email})`);
    } else {
      tutor.name = 'Prof. Sarah Jenkins';
      tutor.password = 'Tutor@123';
      tutor.role = 'tutor';
      tutor.tutorId = null;
      tutor.isActive = true;
      await tutor.save();
      console.log(`[Seed] Updated existing Tutor: ${tutor.name} (${tutor.email})`);
    }

    // 2. Seed or Upsert Student Account
    const studentEmail = 'student@tutorflow.com';
    let student = await User.findOne({ email: studentEmail });

    if (!student) {
      student = await User.create({
        name: 'Alex Rivera',
        email: studentEmail,
        password: 'Student@123',
        role: 'student',
        tutorId: tutor._id,
        isActive: true,
      });
      console.log(`[Seed] Created Student: ${student.name} (${student.email})`);
    } else {
      student.name = 'Alex Rivera';
      student.password = 'Student@123';
      student.role = 'student';
      student.tutorId = tutor._id;
      student.isActive = true;
      await student.save();
      console.log(`[Seed] Updated existing Student: ${student.name} (${student.email})`);
    }

    // 3. Seed or Upsert StudentProfile
    let profile = await StudentProfile.findOne({ userId: student._id });

    if (!profile) {
      profile = await StudentProfile.create({
        userId: student._id,
        tutorId: tutor._id,
        name: student.name,
        subject: 'Mathematics & AP Calculus',
        currentLevel: 'Grade 11 / AP Calculus BC',
        learningGoals: 'Master integration techniques and prepare for AP Exam with score 5.',
        weakAreas: 'Trigonometric substitutions and optimization word problems.',
      });
      console.log(`[Seed] Created StudentProfile for ${student.name}`);
    } else {
      profile.tutorId = tutor._id;
      profile.name = student.name;
      profile.subject = 'Mathematics & AP Calculus';
      profile.currentLevel = 'Grade 11 / AP Calculus BC';
      profile.learningGoals = 'Master integration techniques and prepare for AP Exam with score 5.';
      profile.weakAreas = 'Trigonometric substitutions and optimization word problems.';
      await profile.save();
      console.log(`[Seed] Updated existing StudentProfile for ${student.name}`);
    }

    // 4. Seed Sample Sessions
    await Session.deleteMany({ tutorId: tutor._id, studentId: student._id });

    const now = new Date();
    const futureDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days from now
    const pastDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago

    // Session 1: Upcoming Scheduled Session
    await Session.create({
      tutorId: tutor._id,
      studentId: student._id,
      topic: 'Differential Equations & Slope Fields',
      scheduledAt: futureDate,
      status: 'scheduled',
      notes: '',
      aiPlan: {
        learningObjectives: [
          'Understand separation of variables for first-order ODEs',
          'Construct and interpret slope fields graphically',
          'Solve exponential growth and decay initial value problems',
        ],
        lessonOutline: [
          '10 min: Review of basic derivatives and antiderivatives',
          '20 min: Introduction to slope fields and sketching solution curves',
          '20 min: Analytical separation of variables method with worked examples',
          '10 min: Quick-fire student practice and recap',
        ],
        practiceQuestions: [
          'Find the general solution to dy/dx = 2xy',
          'Given dy/dx = x/y with y(0) = 2, find the particular solution',
          'Sketch the slope field for dy/dx = x - y at 9 grid points',
        ],
      },
    });

    // Session 2: In-Progress Session
    await Session.create({
      tutorId: tutor._id,
      studentId: student._id,
      topic: 'Calculus Applications: Related Rates',
      scheduledAt: now,
      status: 'in_progress',
      notes: 'Currently working through ladder and inverted conical tank problem sets. Student showed quick understanding of geometric constraints.',
      aiPlan: {
        learningObjectives: ['Identify implicit rates of change with respect to time (t)'],
        lessonOutline: ['Warm up with Pythagoras-based related rates', 'Solve conical tank draining problem'],
        practiceQuestions: ['A 13ft ladder slips down a vertical wall at 2ft/s. How fast is the base sliding when top is 12ft high?'],
      },
    });

    // Session 3: Completed & AI Reviewed Session
    await Session.create({
      tutorId: tutor._id,
      studentId: student._id,
      topic: 'Fundamental Theorem of Calculus & Definite Integrals',
      scheduledAt: pastDate,
      status: 'ai_reviewed',
      notes: 'Covered area under curves, Riemann sum limits, and FTC Part 1 & 2. Alex demonstrated solid mastery of polynomial integration.',
      aiPlan: {
        learningObjectives: ['Apply Fundamental Theorem of Calculus Part 1 and Part 2'],
        lessonOutline: ['Concept breakdown of accumulation functions', 'Evaluation of definite integrals algebraically'],
        practiceQuestions: ['Evaluate integral from 1 to 4 of (3x^2 - 2x + 1) dx'],
      },
      aiReview: {
        summary: 'Alex achieved a 90% accuracy rate on definite integral problem sets. Good grasp of FTC principles with minor arithmetic checks needed on fraction operations.',
        homework: [
          'Complete Chapter 4 Exercises #12-28 (Evens) in Calculus textbook',
          'Solve 2 AP Classroom Free Response Questions on Accumulation Functions',
          'Review trigonometry derivative identities before next session',
        ],
        nextSessionSuggestion: 'Proceed to U-Substitution and change of variables in definite integrals.',
      },
    });

    console.log('[Seed] Created 3 sample sessions across lifecycle states (scheduled, in_progress, ai_reviewed)');
    console.log('\n==============================================');
    console.log(' SEEDING COMPLETED SUCCESSFULLY');
    console.log(' Tutor Credentials   : tutor@tutorflow.com / Tutor@123');
    console.log(' Student Credentials : student@tutorflow.com / Student@123');
    console.log('==============================================\n');
  } catch (error) {
    console.error('[Seed Error] Failed to seed database:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('[Seed] Database connection closed.');
  }
};

seedDatabase();
