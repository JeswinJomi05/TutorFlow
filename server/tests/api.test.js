require('dotenv').config();
const mongoose = require('mongoose');
const app = require('../src/app');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const StudentProfile = require('../src/models/StudentProfile');
const Session = require('../src/models/Session');

const PORT = 5099; // Test port
const BASE_URL = `http://localhost:${PORT}/api`;

let server;
let tutorToken = '';
let studentToken = '';
let secondaryTutorToken = '';
let createdStudentId = '';
let createdSessionId = '';

const logPass = (title) => console.log(`  \x1b[32m✔ PASS\x1b[0m : ${title}`);
const logFail = (title, err) => {
  console.error(`  \x1b[31m✖ FAIL\x1b[0m : ${title}`);
  if (err) console.error('    Error:', err);
};

const runTests = async () => {
  console.log('\n==============================================');
  console.log(' STARTING TUTORFLOW COMPREHENSIVE BACKEND TESTS');
  console.log('==============================================\n');

  let passed = 0;
  let failed = 0;

  const testCase = async (name, fn) => {
    try {
      await fn();
      logPass(name);
      passed++;
    } catch (error) {
      logFail(name, error.message || error);
      failed++;
    }
  };

  try {
    await connectDB();

    // Start ephemeral server
    await new Promise((resolve) => {
      server = app.listen(PORT, () => {
        console.log(`[Test Runner] Test server listening on port ${PORT}\n`);
        resolve();
      });
    });

    // ----------------------------------------------------
    // 1. Health Check
    // ----------------------------------------------------
    await testCase('1. GET /api/health - Service health check', async () => {
      const res = await fetch(`${BASE_URL}/health`);
      const data = await res.json();
      if (res.status !== 200 || !data.success) {
        throw new Error(`Expected 200, got ${res.status}: ${JSON.stringify(data)}`);
      }
    });

    // ----------------------------------------------------
    // 2. Tutor Login
    // ----------------------------------------------------
    await testCase('2. POST /api/auth/login - Tutor login with valid credentials', async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'tutor@tutorflow.com',
          password: 'Tutor@123',
          role: 'tutor',
        }),
      });
      const data = await res.json();
      if (res.status !== 200 || !data.token || data.user.role !== 'tutor') {
        throw new Error(`Login failed: ${JSON.stringify(data)}`);
      }
      if (data.user.password) {
        throw new Error('Security violation: Password leaked in response');
      }
      tutorToken = data.token;
    });

    // ----------------------------------------------------
    // 3. Student Login
    // ----------------------------------------------------
    await testCase('3. POST /api/auth/login - Student login with valid credentials', async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'student@tutorflow.com',
          password: 'Student@123',
          role: 'student',
        }),
      });
      const data = await res.json();
      if (res.status !== 200 || !data.token || data.user.role !== 'student') {
        throw new Error(`Login failed: ${JSON.stringify(data)}`);
      }
      if (data.user.password) {
        throw new Error('Security violation: Password leaked in response');
      }
      studentToken = data.token;
    });

    // ----------------------------------------------------
    // 4. Role Mismatch Rejection
    // ----------------------------------------------------
    await testCase('4. POST /api/auth/login - Reject login when selected role mismatches DB role', async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'student@tutorflow.com',
          password: 'Student@123',
          role: 'tutor', // Intentionally mismatched
        }),
      });
      const data = await res.json();
      if (res.status !== 401 || data.success !== false) {
        throw new Error(`Expected 401 Unauthorized, got ${res.status}: ${JSON.stringify(data)}`);
      }
    });

    // ----------------------------------------------------
    // 5. Authenticated Get Me
    // ----------------------------------------------------
    await testCase('5. GET /api/auth/me - Retrieve authenticated user info from token', async () => {
      const res = await fetch(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${tutorToken}` },
      });
      const data = await res.json();
      if (res.status !== 200 || data.user.email !== 'tutor@tutorflow.com') {
        throw new Error(`Expected tutor user info, got ${res.status}: ${JSON.stringify(data)}`);
      }
    });

    // ----------------------------------------------------
    // 6. Tutor Creates Student
    // ----------------------------------------------------
    await testCase('6. POST /api/tutors/students - Tutor creates new student and profile', async () => {
      const uniqueSuffix = Date.now();
      const res = await fetch(`${BASE_URL}/tutors/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tutorToken}`,
        },
        body: JSON.stringify({
          name: `Test Student ${uniqueSuffix}`,
          email: `teststudent_${uniqueSuffix}@tutorflow.com`,
          password: 'TemporaryPass@123',
          subject: 'Physics',
          currentLevel: 'Grade 12',
          learningGoals: 'Master Quantum Mechanics',
          weakAreas: 'Wave particle duality',
        }),
      });
      const data = await res.json();
      if (res.status !== 201 || !data.data?.student?._id || !data.data?.profile?._id) {
        throw new Error(`Failed to create student: ${JSON.stringify(data)}`);
      }
      createdStudentId = data.data.student._id;
    });

    // ----------------------------------------------------
    // 7. Tutor Gets Students List
    // ----------------------------------------------------
    await testCase('7. GET /api/tutors/students - Tutor retrieves own students', async () => {
      const res = await fetch(`${BASE_URL}/tutors/students`, {
        headers: { Authorization: `Bearer ${tutorToken}` },
      });
      const data = await res.json();
      if (res.status !== 200 || !Array.isArray(data.data) || data.data.length < 1) {
        throw new Error(`Failed to retrieve tutor students: ${JSON.stringify(data)}`);
      }
    });

    // ----------------------------------------------------
    // 8. Tutor Gets Student By ID
    // ----------------------------------------------------
    await testCase('8. GET /api/tutors/students/:studentId - Tutor gets student detail & profile', async () => {
      const res = await fetch(`${BASE_URL}/tutors/students/${createdStudentId}`, {
        headers: { Authorization: `Bearer ${tutorToken}` },
      });
      const data = await res.json();
      if (res.status !== 200 || data.data?.student?._id !== createdStudentId) {
        throw new Error(`Failed to retrieve student details: ${JSON.stringify(data)}`);
      }
    });

    // ----------------------------------------------------
    // 9. Student Gets Own Profile
    // ----------------------------------------------------
    await testCase('9. GET /api/students/me - Student retrieves own profile', async () => {
      const res = await fetch(`${BASE_URL}/students/me`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const data = await res.json();
      if (res.status !== 200 || !data.data?.subject) {
        throw new Error(`Failed to get student profile: ${JSON.stringify(data)}`);
      }
    });

    // ----------------------------------------------------
    // 10. Tutor Creates Session
    // ----------------------------------------------------
    const sessionTime = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
    await testCase('10. POST /api/sessions - Tutor schedules a new tutoring session', async () => {
      const res = await fetch(`${BASE_URL}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tutorToken}`,
        },
        body: JSON.stringify({
          studentId: createdStudentId,
          scheduledAt: sessionTime,
          topic: 'Electromagnetism & Faraday Law',
        }),
      });
      const data = await res.json();
      if (res.status !== 201 || !data.data?._id || data.data.status !== 'scheduled') {
        throw new Error(`Failed to create session: ${JSON.stringify(data)}`);
      }
      createdSessionId = data.data._id;
    });

    // ----------------------------------------------------
    // 11. Double-Booking Prevention (409 Conflict)
    // ----------------------------------------------------
    await testCase('11. POST /api/sessions - Reject double-booking session at conflicting time (409 Conflict)', async () => {
      const res = await fetch(`${BASE_URL}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tutorToken}`,
        },
        body: JSON.stringify({
          studentId: createdStudentId,
          scheduledAt: sessionTime, // Same timestamp
          topic: 'Conflicting Double-Booked Session',
        }),
      });
      const data = await res.json();
      if (res.status !== 409) {
        throw new Error(`Expected 409 Conflict, got ${res.status}: ${JSON.stringify(data)}`);
      }
    });

    // ----------------------------------------------------
    // 12. Invalid Session Lifecycle Transition (Skip state)
    // ----------------------------------------------------
    await testCase('12. PATCH /api/sessions/:id/status - Reject skipping lifecycle state (scheduled -> completed)', async () => {
      const res = await fetch(`${BASE_URL}/sessions/${createdSessionId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tutorToken}`,
        },
        body: JSON.stringify({ status: 'completed' }), // Cannot skip in_progress
      });
      const data = await res.json();
      if (res.status !== 400) {
        throw new Error(`Expected 400 Bad Request, got ${res.status}: ${JSON.stringify(data)}`);
      }
    });

    // ----------------------------------------------------
    // 13. Valid State Transition: scheduled -> in_progress
    // ----------------------------------------------------
    await testCase('13. PATCH /api/sessions/:id/status - Transition: scheduled -> in_progress', async () => {
      const res = await fetch(`${BASE_URL}/sessions/${createdSessionId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tutorToken}`,
        },
        body: JSON.stringify({ status: 'in_progress' }),
      });
      const data = await res.json();
      if (res.status !== 200 || data.data?.status !== 'in_progress') {
        throw new Error(`Expected in_progress status, got ${res.status}: ${JSON.stringify(data)}`);
      }
    });

    // ----------------------------------------------------
    // 14. Update Notes in progress
    // ----------------------------------------------------
    await testCase('14. PATCH /api/sessions/:id/notes - Update live notes during in_progress status', async () => {
      const res = await fetch(`${BASE_URL}/sessions/${createdSessionId}/notes`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tutorToken}`,
        },
        body: JSON.stringify({
          notes: 'Worked on magnetic flux equations and Lenz law demonstrations.',
        }),
      });
      const data = await res.json();
      if (res.status !== 200 || !data.data?.notes.includes('magnetic flux')) {
        throw new Error(`Failed to update notes: ${JSON.stringify(data)}`);
      }
    });

    // ----------------------------------------------------
    // 15. Transition: in_progress -> completed
    // ----------------------------------------------------
    await testCase('15. PATCH /api/sessions/:id/status - Transition: in_progress -> completed', async () => {
      const res = await fetch(`${BASE_URL}/sessions/${createdSessionId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tutorToken}`,
        },
        body: JSON.stringify({ status: 'completed' }),
      });
      const data = await res.json();
      if (res.status !== 200 || data.data?.status !== 'completed') {
        throw new Error(`Expected completed status, got ${res.status}: ${JSON.stringify(data)}`);
      }
    });

    // ----------------------------------------------------
    // 16. Notes become Read-Only after completed
    // ----------------------------------------------------
    await testCase('16. PATCH /api/sessions/:id/notes - Reject editing notes after session is completed (Read-only)', async () => {
      const res = await fetch(`${BASE_URL}/sessions/${createdSessionId}/notes`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tutorToken}`,
        },
        body: JSON.stringify({
          notes: 'Attempting to illegally overwrite completed session notes.',
        }),
      });
      const data = await res.json();
      if (res.status !== 400) {
        throw new Error(`Expected 400 Bad Request, got ${res.status}: ${JSON.stringify(data)}`);
      }
    });

    // ----------------------------------------------------
    // 17. Transition: completed -> ai_reviewed with homework
    // ----------------------------------------------------
    await testCase('17. PATCH /api/sessions/:id/status - Transition: completed -> ai_reviewed with AI feedback & homework', async () => {
      const res = await fetch(`${BASE_URL}/sessions/${createdSessionId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tutorToken}`,
        },
        body: JSON.stringify({
          status: 'ai_reviewed',
          aiReview: {
            summary: 'Great comprehension of induction formulas.',
            homework: ['Solve Chapter 8 problems #1-10', 'Review induction circuit diagrams'],
            nextSessionSuggestion: 'Cover AC circuits and transformers.',
          },
        }),
      });
      const data = await res.json();
      if (res.status !== 200 || data.data?.status !== 'ai_reviewed') {
        throw new Error(`Expected ai_reviewed status, got ${res.status}: ${JSON.stringify(data)}`);
      }
    });

    // ----------------------------------------------------
    // 18. Student Role Authorization Guard
    // ----------------------------------------------------
    await testCase('18. Security: Student cannot access Tutor endpoints (403 Forbidden)', async () => {
      const res = await fetch(`${BASE_URL}/tutors/students`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const data = await res.json();
      if (res.status !== 403) {
        throw new Error(`Expected 403 Forbidden, got ${res.status}: ${JSON.stringify(data)}`);
      }
    });

    // ----------------------------------------------------
    // 19. Cross-Tutor Data Isolation Guard
    // ----------------------------------------------------
    await testCase('19. Security: Secondary tutor cannot access primary tutor student data (Data Isolation)', async () => {
      // Create secondary tutor
      const secondTutorEmail = `other_tutor_${Date.now()}@tutorflow.com`;
      const secondTutor = await User.create({
        name: 'Secondary Tutor',
        email: secondTutorEmail,
        password: 'Password@123',
        role: 'tutor',
      });

      const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: secondTutorEmail,
          password: 'Password@123',
          role: 'tutor',
        }),
      });
      const loginData = await loginRes.json();
      secondaryTutorToken = loginData.token;

      // Attempt to access primary tutor's student
      const accessRes = await fetch(`${BASE_URL}/tutors/students/${createdStudentId}`, {
        headers: { Authorization: `Bearer ${secondaryTutorToken}` },
      });
      const accessData = await accessRes.json();

      if (accessRes.status !== 404 && accessRes.status !== 403) {
        throw new Error(`Data leak! Other tutor accessed student: ${JSON.stringify(accessData)}`);
      }
    });

    // ----------------------------------------------------
    // 20. Student gets homework
    // ----------------------------------------------------
    await testCase('20. GET /api/students/homework - Student gets homework tasks from completed sessions', async () => {
      const res = await fetch(`${BASE_URL}/students/homework`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const data = await res.json();
      if (res.status !== 200 || !Array.isArray(data.data)) {
        throw new Error(`Failed to retrieve homework: ${JSON.stringify(data)}`);
      }
    });

    console.log('\n==============================================');
    console.log(` TEST RESULTS SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('==============================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('[Runner Error]', err);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
    await mongoose.connection.close();
    console.log('[Test Runner] Finished and connections closed.');
  }
};

runTests();
