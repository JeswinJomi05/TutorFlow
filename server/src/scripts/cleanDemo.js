require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Session = require('../models/Session');

const removeDemoAccounts = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tutorflow';

  console.log('[Cleanup] Connecting to database...');
  await mongoose.connect(mongoUri);
  console.log('[Cleanup] Connected successfully.');

  try {
    const demoEmails = ['tutor@tutorflow.com', 'student@tutorflow.com'];
    const demoUsers = await User.find({ email: { $in: demoEmails } });
    const demoUserIds = demoUsers.map((u) => u._id);

    console.log(`[Cleanup] Found ${demoUsers.length} demo user(s) to remove:`, demoUsers.map((u) => u.email));

    if (demoUserIds.length > 0) {
      const profileResult = await StudentProfile.deleteMany({
        $or: [
          { userId: { $in: demoUserIds } },
          { tutorId: { $in: demoUserIds } },
        ],
      });
      console.log(`[Cleanup] Removed ${profileResult.deletedCount} linked StudentProfile record(s).`);

      const sessionResult = await Session.deleteMany({
        $or: [
          { tutorId: { $in: demoUserIds } },
          { studentId: { $in: demoUserIds } },
        ],
      });
      console.log(`[Cleanup] Removed ${sessionResult.deletedCount} linked Session record(s).`);

      const userResult = await User.deleteMany({ email: { $in: demoEmails } });
      console.log(`[Cleanup] Removed ${userResult.deletedCount} demo User record(s).`);
    } else {
      console.log('[Cleanup] No demo users found in database.');
    }

    console.log('[Cleanup] Demo student and demo tutor successfully removed from database.');
  } catch (error) {
    console.error('[Cleanup Error] Failed to remove demo accounts:', error);
  } finally {
    await mongoose.connection.close();
    console.log('[Cleanup] Database connection closed.');
  }
};

removeDemoAccounts();
