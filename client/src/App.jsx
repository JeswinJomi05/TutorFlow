import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import TutorDashboard from './pages/TutorDashboard';
import StudentDashboard from './pages/StudentDashboard';
import { AddStudentPage, SessionsPage, StudentProfilePage, ScheduleSessionPage, SessionDetailPage, StudentsPage } from './pages/TutorPages';
import ProtectedRoute from './components/ProtectedRoute';
import authService from './services/authService';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={<LoginPage />}
        />
        <Route
          path="/tutor/dashboard"
          element={
            <ProtectedRoute requiredRole="tutor">
              <TutorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute requiredRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/tutor/students" element={<ProtectedRoute requiredRole="tutor"><StudentsPage /></ProtectedRoute>} />
        <Route path="/tutor/students/new" element={<ProtectedRoute requiredRole="tutor"><AddStudentPage /></ProtectedRoute>} />
        <Route path="/tutor/students/:studentId" element={<ProtectedRoute requiredRole="tutor"><StudentProfilePage /></ProtectedRoute>} />
        <Route path="/tutor/sessions" element={<ProtectedRoute requiredRole="tutor"><SessionsPage /></ProtectedRoute>} />
        <Route path="/tutor/sessions/new" element={<ProtectedRoute requiredRole="tutor"><ScheduleSessionPage /></ProtectedRoute>} />
        <Route path="/tutor/sessions/:sessionId" element={<ProtectedRoute requiredRole="tutor"><SessionDetailPage /></ProtectedRoute>} />
        <Route
          path="/"
          element={
            authService.isAuthenticated() ? (
              <Navigate
                to={
                  authService.getUserRole() === 'tutor'
                    ? '/tutor/dashboard'
                    : '/student/dashboard'
                }
                replace
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
