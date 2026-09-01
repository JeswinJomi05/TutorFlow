import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Calendar, 
  CheckCircle2, 
  Award, 
  LogOut, 
  Video, 
  Clock, 
  FileText, 
  Sparkles 
} from 'lucide-react';
import authService from '../services/authService';
import './Dashboard.css';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const user = authService.getUser() || {
    name: 'Alex Rivera',
    email: 'alex.student@tutorflow.com',
  };

  useEffect(() => {
    const role = authService.getUserRole();
    if (role !== 'student' || !authService.isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const studentSessions = [
    {
      id: 1,
      tutorName: 'Prof. Sarah Jenkins',
      subject: 'AP Calculus BC: Derivatives & Integrals',
      time: 'Today, 4:00 PM',
      avatar: 'SJ',
    },
    {
      id: 2,
      tutorName: 'Dr. Marcus Vance',
      subject: 'AP Physics C: Mechanics & Force',
      time: 'Thursday, 3:00 PM',
      avatar: 'MV',
    },
  ];

  const pendingAssignments = [
    {
      id: 1,
      title: 'Problem Set 4: Integration by Parts',
      due: 'Tomorrow at 11:59 PM',
      course: 'Calculus BC',
    },
    {
      id: 2,
      title: 'Physics Lab Report: Rotational Dynamics',
      due: 'Friday at 5:00 PM',
      course: 'Physics C',
    },
  ];

  return (
    <div className="dashboard-container">
      {/* Top Navbar */}
      <header className="dashboard-navbar">
        <div className="nav-brand-group">
          <div className="nav-logo-badge">TF</div>
          <span className="nav-brand-title">TutorFlow</span>
          <span className="nav-role-tag" style={{ backgroundColor: '#FCF9E0', color: '#854D0E' }}>
            Student Portal
          </span>
        </div>

        <div className="nav-user-actions">
          <div className="user-profile-badge">
            <div className="avatar-circle" style={{ background: 'linear-gradient(135deg, #3E0F8D, #9564DD)', color: 'white' }}>
              AR
            </div>
            <div className="user-meta-text">
              <span className="user-name-text">{user.name}</span>
              <span className="user-email-sub">{user.email}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="logout-nav-button"
            title="Log out"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Hero Welcome Banner */}
        <section className="dashboard-hero-banner" style={{ background: 'linear-gradient(135deg, #2A0864 0%, #3E0F8D 100%)' }}>
          <div className="hero-banner-content">
            <h1 className="hero-banner-title">Welcome back, {user.name.split(' ')[0]}! 🚀</h1>
            <p className="hero-banner-subtitle">
              You have an upcoming session in <strong>2 hours</strong> with Prof. Sarah Jenkins for Calculus BC.
            </p>
          </div>
          <button className="hero-quick-action-btn">
            <Video size={18} />
            <span>Join Study Room</span>
          </button>
        </section>

        {/* Metric Cards */}
        <section className="metrics-grid" aria-label="Key Student Metrics">
          <div className="metric-card">
            <div className="metric-icon-box">
              <BookOpen size={24} />
            </div>
            <div className="metric-info">
              <span className="metric-label">Enrolled Subjects</span>
              <span className="metric-value">4 Courses</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon-box accent-green">
              <CheckCircle2 size={24} />
            </div>
            <div className="metric-info">
              <span className="metric-label">Completed Sessions</span>
              <span className="metric-value">28</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon-box accent-yellow">
              <Award size={24} />
            </div>
            <div className="metric-info">
              <span className="metric-label">Average Quiz Score</span>
              <span className="metric-value">94.8%</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon-box accent-blue">
              <FileText size={24} />
            </div>
            <div className="metric-info">
              <span className="metric-label">Due Assignments</span>
              <span className="metric-value">2 Pending</span>
            </div>
          </div>
        </section>

        {/* Sessions & Assignments Split */}
        <div className="dashboard-grid-sections">
          {/* Upcoming Sessions */}
          <section className="dashboard-panel">
            <div className="panel-header">
              <h2 className="panel-title">Your Scheduled Tutoring Sessions</h2>
              <a href="#book-session" className="panel-action-link">+ Book New Session</a>
            </div>

            <div className="sessions-list">
              {studentSessions.map((session) => (
                <div key={session.id} className="session-item-card">
                  <div className="session-left">
                    <div className="session-avatar">{session.avatar}</div>
                    <div className="session-details">
                      <span className="session-subject">{session.subject}</span>
                      <span className="session-person">Tutor: {session.tutorName}</span>
                    </div>
                  </div>
                  <div className="session-right">
                    <span className="session-time-pill">
                      <Clock size={13} /> {session.time}
                    </span>
                    <button className="join-session-btn">
                      Join Call
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Pending Assignments */}
          <aside className="dashboard-panel">
            <div className="panel-header">
              <h2 className="panel-title">Pending Homework</h2>
            </div>

            <div className="sessions-list">
              {pendingAssignments.map((assignment) => (
                <div key={assignment.id} className="session-item-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-primary-dark)', textTransform: 'uppercase' }}>
                      {assignment.course}
                    </span>
                    <h4 style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--color-text-dark)', marginTop: '2px' }}>
                      {assignment.title}
                    </h4>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', fontSize: '12px', color: 'var(--color-error)' }}>
                    <span>Due: {assignment.due}</span>
                    <button style={{ padding: '4px 10px', fontSize: '11.5px', fontWeight: '600', backgroundColor: 'var(--color-purple-light)', color: 'var(--color-primary-dark)', borderRadius: '4px' }}>
                      Upload Work
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
