import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  CheckCircle2, 
  Award, 
  LogOut, 
  Video, 
  Clock, 
  FileText, 
  Loader2,
  X,
  RefreshCw
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
  const [loading, setLoading] = useState({ profile: true, sessions: true, homework: true });
  const [errors, setErrors] = useState({});
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    const role = authService.getUserRole();
    if (role !== 'student' || !authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    loadData();
  }, [navigate]);

  async function loadData() {
    setLoading({ profile: true, sessions: true, homework: true });
    setErrors({});
    const requests = [
      ['profile', authService.getMe().then((result) => result.user && setCurrentUser(result.user)), 'Unable to load your profile.'],
      ['profile', studentService.getProfile().then((result) => setProfile(result.data)), 'Unable to load your profile.'],
      ['sessions', studentService.getSessions().then((result) => setSessions(result.data || [])), 'Unable to load sessions.'],
      ['homework', studentService.getHomework().then((result) => setHomework(result.data || [])), 'Unable to load homework.'],
    ];

    await Promise.all(requests.map(async ([section, request, message]) => {
      try {
        await request;
      } catch {
        setErrors((previous) => ({ ...previous, [section]: message }));
      } finally {
        setLoading((previous) => ({ ...previous, [section]: false }));
      }
    }));
  }

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
    const d = new Date(isoDate);
    return `${d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} · ${d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
  };

  const upcomingSessions = sessions
    .filter((session) => session.status === 'in_progress' || (session.status === 'scheduled' && new Date(session.scheduledAt) >= new Date()))
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  const completedSessions = sessions.filter((session) => session.status === 'completed' || session.status === 'ai_reviewed');
  const tutor = profile?.tutorId;
  const liveSession = sessions.find((session) => session.status === 'in_progress');

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
                <>Assigned Tutor: <strong>{tutor.name}</strong> • Subject: <strong>{profile.subject}</strong></>
              ) : (
                <>No tutor assigned yet.</>
              )}
            </p>
          </div>
          <button className="hero-quick-action-btn" onClick={() => liveSession && setSelectedSession(liveSession)} disabled={!liveSession} title={liveSession ? 'Open your live session' : 'No live study room is available'}>
            <Video size={18} />
            <span>Join Study Room</span>
          </button>
        </section>

        {errors.profile && <div className="student-notice student-state-error">{errors.profile}<button onClick={loadData}><RefreshCw size={15} /> Retry</button></div>}

        {/* Metric Cards */}
        <section className="metrics-grid" aria-label="Key Student Metrics">
          <div className="metric-card">
            <div className="metric-icon-box">
              <BookOpen size={24} />
            </div>
            <div className="metric-info">
              <span className="metric-label">Enrolled Subject</span>
                <span className="metric-value">{loading.profile ? 'Loading...' : profile?.subject || 'Not set'}</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon-box accent-green">
              <CheckCircle2 size={24} />
            </div>
            <div className="metric-info">
              <span className="metric-label">Total Sessions</span>
              <span className="metric-value">{loading.sessions ? '...' : sessions.length}</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon-box accent-yellow">
              <Award size={24} />
            </div>
            <div className="metric-info">
              <span className="metric-label">Current Level</span>
              <span className="metric-value">{loading.profile ? '...' : profile?.currentLevel || 'Not set'}</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon-box accent-blue">
              <FileText size={24} />
            </div>
            <div className="metric-info">
              <span className="metric-label">Assigned Homework</span>
              <span className="metric-value">{loading.homework ? '...' : `${homework.length} Tasks`}</span>
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
              {loading.sessions ? (
                <div className="student-state"><Loader2 size={20} className="animate-spin" />Loading sessions...</div>
              ) : errors.sessions ? (
                <div className="student-state student-state-error">{errors.sessions}<button onClick={loadData}><RefreshCw size={15} /> Retry</button></div>
              ) : upcomingSessions.length > 0 ? (
                upcomingSessions.map((session) => (
                  <div key={session._id || session.id} className="session-item-card">
                    <div className="session-left">
                      <div className="session-avatar">{getInitials(session.tutorId?.name || 'Tutor')}</div>
                      <div className="session-details">
                        <span className="session-subject">{profile?.subject || session.topic}</span>
                        <span className="session-person">Tutor: {session.tutorId?.name || 'Assigned Tutor'}</span>
                      </div>
                    </div>
                    <div className="session-right">
                      <span className="session-time-pill">
                        <Clock size={13} /> {formatSessionTime(session.scheduledAt)}
                      </span>
                      <span className={`student-status ${session.status}`}>{session.status.replace('_', ' ')}</span>
                      <button className="join-session-btn" onClick={() => setSelectedSession(session)}>
                        {session.status === 'in_progress' ? 'Join Live' : 'Details'}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13.5px' }}>
                  No upcoming sessions scheduled.
                </div>
              )}
            </div>
          </section>

          {/* Pending Assignments / Homework */}
          <aside className="dashboard-panel">
            <div className="panel-header">
              <h2 className="panel-title">Homework</h2>
            </div>

            <div className="sessions-list">
              {loading.homework ? (
                <div className="student-state"><Loader2 size={20} className="animate-spin" />Loading homework...</div>
              ) : errors.homework ? (
                <div className="student-state student-state-error">{errors.homework}<button onClick={loadData}><RefreshCw size={15} /> Retry</button></div>
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
                        <span className="student-status pending">Pending</span>
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

        <section className="dashboard-panel notes-panel">
          <div className="panel-header"><h2 className="panel-title">Past Session Notes</h2></div>
          {loading.sessions ? <div className="student-state"><Loader2 size={20} className="animate-spin" />Loading notes...</div> : completedSessions.length ? (
            <div className="notes-list">{completedSessions.map((session) => <article className="note-card" key={session._id || session.id}>
              <strong>{profile?.subject || session.topic}</strong><span>Tutor: {session.tutorId?.name || 'Assigned Tutor'}</span><time>{formatSessionTime(session.scheduledAt)}</time><h3>Session Notes</h3><p>{session.notes || 'No notes were recorded for this session.'}</p>
            </article>)}</div>
          ) : <div className="student-empty">No completed sessions yet.</div>}
        </section>
      </main>

      {selectedSession && <div className="student-modal-backdrop" role="presentation" onClick={() => setSelectedSession(null)}><section className="student-modal" role="dialog" aria-modal="true" aria-labelledby="session-details-title" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header"><div><span className="eyebrow">Session details</span><h2 id="session-details-title">{profile?.subject || selectedSession.topic}</h2></div><button className="modal-close" onClick={() => setSelectedSession(null)} aria-label="Close session details"><X size={20} /></button></div>
        <dl className="session-detail-grid"><div><dt>Tutor</dt><dd>{selectedSession.tutorId?.name || 'Assigned Tutor'}</dd></div><div><dt>Date</dt><dd>{new Date(selectedSession.scheduledAt).toLocaleDateString()}</dd></div><div><dt>Time</dt><dd>{new Date(selectedSession.scheduledAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</dd></div><div><dt>Status</dt><dd><span className={`student-status ${selectedSession.status}`}>{selectedSession.status.replace('_', ' ')}</span></dd></div></dl>
        <div className="session-topic"><strong>Topic</strong><p>{selectedSession.topic}</p></div>
        {completedSessions.some((session) => (session._id || session.id) === (selectedSession._id || selectedSession.id)) && <div className="session-topic"><strong>Session notes</strong><p>{selectedSession.notes || 'No notes were recorded for this session.'}</p></div>}
      </section></div>}
    </div>
  );
}
