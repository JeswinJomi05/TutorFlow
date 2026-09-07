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
          { step: 1, title: 'Concept Foundations', description: 'Review of basic derivatives and antiderivatives' },
          { step: 2, title: 'Slope Fields', description: 'Introduction to slope fields and sketching solution curves' },
          { step: 3, title: 'Analytical Separation', description: 'Separation of variables method with worked examples' },
          { step: 4, title: 'Guided Practice', description: 'Quick-fire student practice and recap' },
        ],
        practiceQuestions: [
          { question: 'Find the general solution to dy/dx = 2xy', difficulty: 'easy' },
          { question: 'Given dy/dx = x/y with y(0) = 2, find the particular solution', difficulty: 'medium' },
          { question: 'Sketch the slope field for dy/dx = x - y at 9 grid points', difficulty: 'hard' },
        ],
        generatedAt: new Date(),
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
        learningObjectives: [
          'Identify implicit rates of change with respect to time (t)',
          'Formulate geometric relations between variables',
          'Differentiate implicitly with respect to time',
        ],
        lessonOutline: [
          { step: 1, title: 'Warm-up', description: 'Pythagoras-based related rates review' },
          { step: 2, title: 'Conical Tank Modeling', description: 'Volume formula and similar triangles ratio setup' },
          { step: 3, title: 'Implicit Differentiation', description: 'Differentiating with respect to time t' },
          { step: 4, title: 'Synthesis & Review', description: 'Independent problem solving by student' },
        ],
        practiceQuestions: [
          { question: 'A 13ft ladder slips down a wall at 2ft/s. How fast is base sliding when top is 12ft?', difficulty: 'medium' },
          { question: 'Water leaks from a conical tank at 2 m^3/min. Find rate of water level drop.', difficulty: 'hard' },
          { question: 'Radius of a circle increases at 3 cm/s. Find rate of area increase when r = 5 cm.', difficulty: 'easy' },
        ],
        generatedAt: new Date(),
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
        learningObjectives: [
          'Apply Fundamental Theorem of Calculus Part 1 and Part 2',
          'Evaluate definite integrals analytically',
          'Interpret area accumulation geometrically',
        ],
        lessonOutline: [
          { step: 1, title: 'Review', description: 'Area under curves and Riemann sum limits' },
          { step: 2, title: 'FTC Part 1', description: 'Concept breakdown of accumulation functions' },
          { step: 3, title: 'FTC Part 2', description: 'Evaluation of definite integrals algebraically' },
          { step: 4, title: 'Practice Sets', description: 'Polynomial and trigonometric definite integrals' },
        ],
        practiceQuestions: [
          { question: 'Evaluate integral from 1 to 4 of (3x^2 - 2x + 1) dx', difficulty: 'easy' },
          { question: 'Find derivative of g(x) = integral from 0 to x^2 of sqrt(1 + t^3) dt', difficulty: 'medium' },
          { question: 'Compute net signed area between f(x) = x^3 - 3x and x-axis on [-2, 2]', difficulty: 'hard' },
        ],
        generatedAt: new Date(Date.now() - 2 * 86400000),
      },
      aiReview: {
        summary: 'Alex achieved a 90% accuracy rate on definite integral problem sets. Good grasp of FTC principles with minor arithmetic checks needed on fraction operations.',
        homework: [
          { task: 'Textbook Practice', description: 'Complete Chapter 4 Exercises #12-28 (Evens) in Calculus textbook', difficulty: 'medium' },
          { task: 'AP Free Response', description: 'Solve 2 AP Classroom Free Response Questions on Accumulation Functions', difficulty: 'hard' },
          { task: 'Identity Review', description: 'Review trigonometry derivative identities before next session', difficulty: 'easy' },
        ],
        nextSessionSuggestion: 'Proceed to U-Substitution and change of variables in definite integrals.',
        generatedAt: new Date(Date.now() - 2 * 86400000),
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
