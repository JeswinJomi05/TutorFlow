import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  Clock, 
  Award, 
  LogOut, 
  PlusCircle, 
  Video, 
  CheckCircle2, 
  BookOpen 
} from 'lucide-react';
import authService from '../services/authService';
import './Dashboard.css';

export default function TutorDashboard() {
  const navigate = useNavigate();
  const user = authService.getUser() || {
    name: 'Prof. Sarah Jenkins',
    email: 'sarah.tutor@tutorflow.com',
  };

  useEffect(() => {
    const role = authService.getUserRole();
    if (role !== 'tutor' || !authService.isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const upcomingSessions = [
    {
      id: 1,
      studentName: 'Alex Rivera',
      subject: 'AP Calculus BC: Derivatives & Integrals',
      time: 'Today, 4:00 PM',
      duration: '60 min',
      avatar: 'AR',
    },
    {
      id: 2,
      studentName: 'Maya Lin',
      subject: 'Organic Chemistry: Reaction Mechanisms',
      time: 'Tomorrow, 2:30 PM',
      duration: '45 min',
      avatar: 'ML',
    },
    {
      id: 3,
      studentName: 'David Chen',
      subject: 'Physics: Electromagnetism & Waves',
      time: 'Wed, 5:00 PM',
      duration: '60 min',
      avatar: 'DC',
    },
  ];

  return (
    <div className="dashboard-container">
      {/* Top Navbar */}
      <header className="dashboard-navbar">
        <div className="nav-brand-group">
          <div className="nav-logo-badge">TF</div>
          <span className="nav-brand-title">TutorFlow</span>
          <span className="nav-role-tag">Tutor Portal</span>
        </div>

        <div className="nav-user-actions">
          <div className="user-profile-badge">
            <div className="avatar-circle">SJ</div>
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
        <section className="dashboard-hero-banner">
          <div className="hero-banner-content">
            <h1 className="hero-banner-title">Welcome back, {user.name.split(' ')[0]}! 👋</h1>
            <p className="hero-banner-subtitle">
              You have <strong>3 tutoring sessions</strong> scheduled this week. Your next lesson starts in 2 hours with Alex Rivera.
            </p>
          </div>
          <button className="hero-quick-action-btn">
            <PlusCircle size={18} />
            <span>Schedule Session</span>
          </button>
        </section>

        {/* Metric Cards */}
        <section className="metrics-grid" aria-label="Key Tutor Metrics">
          <div className="metric-card">
            <div className="metric-icon-box">
              <Users size={24} />
            </div>
            <div className="metric-info">
              <span className="metric-label">Active Students</span>
              <span className="metric-value">18</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon-box accent-green">
              <Calendar size={24} />
            </div>
            <div className="metric-info">
              <span className="metric-label">Sessions Completed</span>
              <span className="metric-value">142</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon-box accent-blue">
              <Clock size={24} />
            </div>
            <div className="metric-info">
              <span className="metric-label">Total Teaching Hours</span>
              <span className="metric-value">210 hrs</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon-box accent-yellow">
              <Award size={24} />
            </div>
            <div className="metric-info">
              <span className="metric-label">Tutor Rating</span>
              <span className="metric-value">4.96 ★</span>
            </div>
          </div>
        </section>

        {/* Sessions & Activity Split */}
        <div className="dashboard-grid-sections">
          {/* Upcoming Sessions */}
          <section className="dashboard-panel">
            <div className="panel-header">
              <h2 className="panel-title">Upcoming Tutoring Sessions</h2>
              <a href="#all-sessions" className="panel-action-link">View All Calendar</a>
            </div>

            <div className="sessions-list">
              {upcomingSessions.map((session) => (
                <div key={session.id} className="session-item-card">
                  <div className="session-left">
                    <div className="session-avatar">{session.avatar}</div>
                    <div className="session-details">
                      <span className="session-subject">{session.subject}</span>
                      <span className="session-person">Student: {session.studentName}</span>
                    </div>
                  </div>
                  <div className="session-right">
                    <span className="session-time-pill">
                      <Clock size={13} /> {session.time}
                    </span>
                    <button className="join-session-btn" title="Launch Video Classroom">
                      <Video size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                      Launch
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Recent Student Updates */}
          <aside className="dashboard-panel">
            <div className="panel-header">
              <h2 className="panel-title">Recent Activity</h2>
            </div>

            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-bullet"></div>
                <div>
                  <p className="activity-text"><strong>Alex Rivera</strong> submitted homework for Calculus.</p>
                  <p className="activity-time">25 mins ago</p>
                </div>
              </div>

              <div className="activity-item">
                <div className="activity-bullet"></div>
                <div>
                  <p className="activity-text"><strong>Maya Lin</strong> confirmed next session for Chemistry.</p>
                  <p className="activity-time">2 hours ago</p>
                </div>
              </div>

              <div className="activity-item">
                <div className="activity-bullet"></div>
                <div>
                  <p className="activity-text"><strong>David Chen</strong> completed practice quiz with 94% score.</p>
                  <p className="activity-time">Yesterday</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
