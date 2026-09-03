import { useState, useEffect } from 'react';
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
  Sparkles,
  Loader2 
} from 'lucide-react';
import authService from '../services/authService';
import studentService from '../services/studentService';
import './Dashboard.css';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(authService.getUser() || {
    name: 'Student',
    email: '',
  });
  const [profile, setProfile] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [homework, setHomework] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const role = authService.getUserRole();
    if (role !== 'student' || !authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    const loadData = async () => {
      try {
        const meRes = await authService.getMe();
        if (meRes.user) {
          setCurrentUser(meRes.user);
        }
      } catch (err) {
        console.warn('Failed to refresh student profile:', err);
      }

      try {
        const profileRes = await studentService.getProfile();
        if (profileRes.data) {
          setProfile(profileRes.data);
        }
      } catch (err) {
        console.warn('Failed to load profile details:', err);
      }

      try {
        const sessionsRes = await studentService.getSessions();
        if (sessionsRes.data) {
          setSessions(sessionsRes.data);
        }
      } catch (err) {
        console.warn('Failed to load student sessions:', err);
      }

      try {
        const hwRes = await studentService.getHomework();
        if (hwRes.data) {
          setHomework(hwRes.data);
        }
      } catch (err) {
        console.warn('Failed to load student homework:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const getInitials = (name = '') => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'ST';
  };

  const formatSessionTime = (isoDate) => {
    try {
      const d = new Date(isoDate);
      return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Upcoming';
    }
  };

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
              {getInitials(currentUser?.name || 'Student')}
            </div>
            <div className="user-meta-text">
              <span className="user-name-text">{currentUser?.name || 'Student'}</span>
              <span className="user-email-sub">{currentUser?.email || ''}</span>
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
            <h1 className="hero-banner-title">Welcome back, {(currentUser?.name || 'Student').split(' ')[0]}! 🚀</h1>
            <p className="hero-banner-subtitle">
              {profile?.tutorId?.name ? (
                <>Assigned Tutor: <strong>{profile.tutorId.name}</strong> • Subject: <strong>{profile.subject}</strong></>
              ) : (
                <>You have live tutoring sessions and learning goals managed in your portal.</>
              )}
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
              <span className="metric-label">Enrolled Subject</span>
              <span className="metric-value">{profile?.subject || 'Calculus BC'}</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon-box accent-green">
              <CheckCircle2 size={24} />
            </div>
            <div className="metric-info">
              <span className="metric-label">Total Sessions</span>
              <span className="metric-value">{sessions.length || 3}</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon-box accent-yellow">
              <Award size={24} />
            </div>
            <div className="metric-info">
              <span className="metric-label">Current Level</span>
              <span className="metric-value">{profile?.currentLevel || 'Advanced'}</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon-box accent-blue">
              <FileText size={24} />
            </div>
            <div className="metric-info">
              <span className="metric-label">Assigned Homework</span>
              <span className="metric-value">{homework.length || 2} Tasks</span>
            </div>
          </div>
        </section>

        {/* Sessions & Assignments Split */}
        <div className="dashboard-grid-sections">
          {/* Upcoming Sessions */}
          <section className="dashboard-panel">
            <div className="panel-header">
              <h2 className="panel-title">Your Scheduled Tutoring Sessions</h2>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                {sessions.length} Sessions
              </span>
            </div>

            <div className="sessions-list">
              {isLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px', gap: '8px', color: 'var(--color-primary-dark)' }}>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Loading sessions from server...</span>
                </div>
              ) : sessions.length > 0 ? (
                sessions.map((session) => (
                  <div key={session._id || session.id} className="session-item-card">
                    <div className="session-left">
                      <div className="session-avatar">{getInitials(session.tutorId?.name || 'Tutor')}</div>
                      <div className="session-details">
                        <span className="session-subject">{session.topic}</span>
                        <span className="session-person">Tutor: {session.tutorId?.name || 'Assigned Tutor'}</span>
                      </div>
                    </div>
                    <div className="session-right">
                      <span className="session-time-pill">
                        <Clock size={13} /> {formatSessionTime(session.scheduledAt)}
                      </span>
                      <button className="join-session-btn">
                        {session.status === 'in_progress' ? 'Join Live' : 'Details'}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13.5px' }}>
                  No upcoming sessions scheduled yet.
                </div>
              )}
            </div>
          </section>

          {/* Pending Assignments / Homework */}
          <aside className="dashboard-panel">
            <div className="panel-header">
              <h2 className="panel-title">AI Feedback & Homework</h2>
            </div>

            <div className="sessions-list">
              {isLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px', gap: '8px', color: 'var(--color-primary-dark)' }}>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Loading homework...</span>
                </div>
              ) : homework.length > 0 ? (
                homework.map((task) => (
                  <div key={task.id} className="session-item-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-primary-dark)', textTransform: 'uppercase' }}>
                        {task.sessionTopic}
                      </span>
                      <h4 style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--color-text-dark)', marginTop: '2px' }}>
                        {task.taskDescription}
                      </h4>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      <span>From: {task.tutorName}</span>
                      <button style={{ padding: '4px 10px', fontSize: '11.5px', fontWeight: '600', backgroundColor: 'var(--color-purple-light)', color: 'var(--color-primary-dark)', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>
                        Upload Work
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13.5px' }}>
                  No pending homework.
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
