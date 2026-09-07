import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, CheckCircle2, Award, LogOut, Video, Clock, FileText, Loader2,
  X, RefreshCw, Sparkles, Lightbulb, Circle, CheckCircle,
  BookMarked, CalendarDays, User, ChevronRight, ArrowLeft,
} from 'lucide-react';
import authService from '../services/authService';
import studentService from '../services/studentService';
import './Dashboard.css';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(authService.getUser() || { name: 'Student', email: '' });
  const [profile, setProfile] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState({ profile: true, sessions: true, homework: true });
  const [errors, setErrors] = useState({});
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedHomework, setSelectedHomework] = useState(null);
  const [completedHomework, setCompletedHomework] = useState(() => {
    try {
      const stored = localStorage.getItem('tf_completed_homework');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [homeworkFilter, setHomeworkFilter] = useState('all');

  const toggleHomeworkCompletion = (taskId, e) => {
    e?.stopPropagation();
    setCompletedHomework((prev) => {
      const updated = prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId];
      try { localStorage.setItem('tf_completed_homework', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  useEffect(() => {
    const role = authService.getUserRole();
    if (role !== 'student' || !authService.isAuthenticated()) { navigate('/login'); return; }
    loadData();
  }, [navigate]);

  async function loadData() {
    setLoading({ profile: true, sessions: true, homework: true });
    setErrors({});
    const requests = [
      ['profile', authService.getMe().then((r) => r.user && setCurrentUser(r.user)), 'Unable to load your profile.'],
      ['profile', studentService.getProfile().then((r) => setProfile(r.data)), 'Unable to load your profile.'],
      ['sessions', studentService.getSessions().then((r) => setSessions(r.data || [])), 'Unable to load sessions.'],
      ['homework', studentService.getHomework().then((r) => setHomework(r.data || [])), 'Unable to load homework.'],
    ];
    await Promise.all(requests.map(async ([section, request, message]) => {
      try { await request; }
      catch { setErrors((p) => ({ ...p, [section]: message })); }
      finally { setLoading((p) => ({ ...p, [section]: false })); }
    }));
  }

  const handleLogout = () => { authService.logout(); navigate('/login'); };
  const getInitials = (name = '') => name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2) || 'ST';
  const formatTime = (iso) => {
    const d = new Date(iso);
    return (
      d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) +
      ' \u00b7 ' +
      d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    );
  };

  const upcomingSessions = sessions
    .filter((s) => s.status === 'in_progress' || (s.status === 'scheduled' && new Date(s.scheduledAt) >= new Date()))
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  const completedSessions = sessions.filter((s) => s.status === 'completed' || s.status === 'ai_reviewed');
  const tutor = profile?.tutorId;
  const liveSession = sessions.find((s) => s.status === 'in_progress');

  const completedCount = homework.filter((t) => completedHomework.includes(t.id)).length;
  const filteredHomework = homework.filter((t) => {
    if (homeworkFilter === 'pending') return !completedHomework.includes(t.id);
    if (homeworkFilter === 'completed') return completedHomework.includes(t.id);
    return true;
  });
  const progressPct = homework.length ? Math.round((completedCount / homework.length) * 100) : 0;
  const sessionHw = (session) =>
    homework.filter((t) => String(t.sessionId) === String(session?._id || session?.id));

  return (
    <div className="dashboard-container">
      {/* Navbar */}
      <header className="dashboard-navbar">
        <div className="nav-brand-group">
          <div className="nav-logo-badge">TF</div>
          <span className="nav-brand-title">TutorFlow</span>
          <span className="nav-role-tag" style={{ backgroundColor: '#FCF9E0', color: '#854D0E' }}>Student Portal</span>
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
          <button onClick={handleLogout} className="logout-nav-button" title="Log out">
            <LogOut size={16} /><span>Sign Out</span>
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        {/* Hero Banner */}
        <section className="dashboard-hero-banner" style={{ background: 'linear-gradient(135deg, #2A0864 0%, #3E0F8D 100%)' }}>
          <div className="hero-banner-content">
            <h1 className="hero-banner-title">
              Welcome back, {(currentUser?.name || 'Student').split(' ')[0]}! &#x1F680;
            </h1>
            <p className="hero-banner-subtitle">
              {profile?.tutorId?.name ? (
                <>Assigned Tutor: <strong>{tutor.name}</strong> &bull; Subject: <strong>{profile.subject}</strong></>
              ) : (
                <>No tutor assigned yet.</>
              )}
            </p>
          </div>
          <button
            className="hero-quick-action-btn"
            onClick={() => liveSession && setSelectedSession(liveSession)}
            disabled={!liveSession}
            title={liveSession ? 'Open your live session' : 'No live study room is available'}
          >
            <Video size={18} /><span>Join Study Room</span>
          </button>
        </section>

        {errors.profile && (
          <div className="student-notice student-state-error">
            {errors.profile}
            <button onClick={loadData}><RefreshCw size={15} /> Retry</button>
          </div>
        )}

        {/* Metric Cards */}
        <section className="metrics-grid" aria-label="Key Student Metrics">
          <div className="metric-card">
            <div className="metric-icon-box"><BookOpen size={24} /></div>
            <div className="metric-info">
              <span className="metric-label">Enrolled Subject</span>
              <span className="metric-value">{loading.profile ? 'Loading...' : profile?.subject || 'Not set'}</span>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon-box accent-green"><CheckCircle2 size={24} /></div>
            <div className="metric-info">
              <span className="metric-label">Total Sessions</span>
              <span className="metric-value">{loading.sessions ? '...' : sessions.length}</span>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon-box accent-yellow"><Award size={24} /></div>
            <div className="metric-info">
              <span className="metric-label">Current Level</span>
              <span className="metric-value">{loading.profile ? '...' : profile?.currentLevel || 'Not set'}</span>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon-box accent-blue"><FileText size={24} /></div>
            <div className="metric-info">
              <span className="metric-label">Homework Progress</span>
              <span className="metric-value">{loading.homework ? '...' : `${completedCount}/${homework.length}`}</span>
            </div>
          </div>
        </section>

        {/* Two-Column Grid */}
        <div className="dashboard-grid-sections">
          {/* Sessions */}
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
                <div className="student-state student-state-error">
                  {errors.sessions}<button onClick={loadData}><RefreshCw size={15} /> Retry</button>
                </div>
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
                        <Clock size={13} /> {formatTime(session.scheduledAt)}
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

          {/* Homework Panel */}
          <aside className="dashboard-panel" style={{ padding: 0, overflow: 'hidden', gap: 0 }}>
            <div className="panel-header" style={{ padding: '18px 20px', borderBottom: '1px solid var(--color-border-light)' }}>
              <h2 className="panel-title">Homework</h2>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                {loading.homework ? '\u2026' : `${homework.length} Task${homework.length !== 1 ? 's' : ''}`}
              </span>
            </div>

            {loading.homework ? (
              <div className="student-state"><Loader2 size={20} className="animate-spin" />Loading homework...</div>
            ) : errors.homework ? (
              <div className="student-state student-state-error">
                {errors.homework}<button onClick={loadData}><RefreshCw size={15} /> Retry</button>
              </div>
            ) : homework.length === 0 ? (
              <div className="student-state" style={{ flexDirection: 'column', gap: '6px' }}>
                <BookMarked size={28} style={{ color: 'var(--color-text-light)' }} />
                <span style={{ fontSize: '13px' }}>No homework assigned yet.</span>
              </div>
            ) : (
              <>
                {/* Progress Bar */}
                <div className="homework-progress-box">
                  <div className="homework-progress-info">
                    <span>{completedCount} of {homework.length} completed</span>
                    <span style={{ color: progressPct === 100 ? '#059669' : 'var(--color-text-muted)' }}>
                      {progressPct}%
                    </span>
                  </div>
                  <div className="homework-progress-bar">
                    <div className="homework-progress-fill" style={{ width: `${progressPct}%` }} />
                  </div>
                </div>

                {/* Filters */}
                <div className="homework-filter-row">
                  {['all', 'pending', 'completed'].map((f) => (
                    <button
                      key={f}
                      className={`homework-filter-btn${homeworkFilter === f ? ' active' : ''}`}
                      onClick={() => setHomeworkFilter(f)}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                      {f === 'pending' && ` (${homework.length - completedCount})`}
                      {f === 'completed' && ` (${completedCount})`}
                    </button>
                  ))}
                </div>

                {/* Task List */}
                <div style={{ overflowY: 'auto', maxHeight: '360px' }}>
                  {filteredHomework.length === 0 ? (
                    <div className="student-state" style={{ minHeight: '80px', fontSize: '13px' }}>
                      No {homeworkFilter} tasks.
                    </div>
                  ) : (
                    filteredHomework.map((task) => {
                      const isDone = completedHomework.includes(task.id);
                      return (
                        <div
                          key={task.id}
                          className={`homework-task-card${isDone ? ' is-done' : ''}`}
                          onClick={() => setSelectedHomework(task)}
                          style={{ cursor: 'pointer' }}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && setSelectedHomework(task)}
                          aria-label={`Open homework: ${task.task}`}
                        >
                          <button
                            className={`homework-check-button${isDone ? ' completed' : ''}`}
                            onClick={(e) => toggleHomeworkCompletion(task.id, e)}
                            title={isDone ? 'Mark as pending' : 'Mark as done'}
                            aria-label={isDone ? 'Mark homework as pending' : 'Mark homework as done'}
                          >
                            {isDone ? <CheckCircle size={20} /> : <Circle size={20} />}
                          </button>
                          <div className="homework-task-body">
                            <p className={`homework-task-title${isDone ? ' strikethrough' : ''}`}>{task.task}</p>
                            {task.taskDescription && task.taskDescription !== task.task && (
                              <p className="homework-task-desc">{task.taskDescription}</p>
                            )}
                            <div className="homework-meta-row">
                              <span className="homework-session-pill">
                                <BookMarked size={10} /> {task.sessionTopic}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span className={`diff-badge ${task.difficulty || 'medium'}`}>{task.difficulty || 'medium'}</span>
                                <ChevronRight size={14} style={{ color: 'var(--color-text-light)' }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </aside>
        </div>

        {/* Past Session Notes */}
        <section className="dashboard-panel notes-panel">
          <div className="panel-header"><h2 className="panel-title">Past Session Notes</h2></div>
          {loading.sessions ? (
            <div className="student-state"><Loader2 size={20} className="animate-spin" />Loading notes...</div>
          ) : completedSessions.length ? (
            <div className="notes-list">
              {completedSessions.map((session) => {
                const hw = sessionHw(session);
                return (
                  <article className="note-card" key={session._id || session.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <strong>{profile?.subject || session.topic}</strong>
                      {session.aiReview?.summary && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, background: '#F3E8FF', color: '#6B21A8', padding: '2px 8px', borderRadius: '12px' }}>
                          <Sparkles size={11} /> AI Evaluated
                        </span>
                      )}
                    </div>
                    <span>Tutor: {session.tutorId?.name || 'Assigned Tutor'}</span>
                    <time>{formatTime(session.scheduledAt)}</time>
                    <h3>Session Notes</h3>
                    <p>{session.notes || 'No notes were recorded for this session.'}</p>
                    {session.aiReview?.summary && (
                      <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed var(--color-border-light)', fontSize: '12.5px' }}>
                        <strong style={{ color: 'var(--color-primary-dark)', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                          <Sparkles size={12} /> AI Feedback:
                        </strong>
                        <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--color-text-muted)' }}>{session.aiReview.summary}</p>
                      </div>
                    )}
                    {hw.length > 0 && (
                      <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed var(--color-border-light)' }}>
                        <strong style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Homework ({hw.length})
                        </strong>
                        {hw.slice(0, 2).map((t) => (
                          <div
                            key={t.id}
                            onClick={() => setSelectedHomework(t)}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', cursor: 'pointer', fontSize: '12.5px' }}
                          >
                            {completedHomework.includes(t.id)
                              ? <CheckCircle size={13} color="#10B981" />
                              : <Circle size={13} color="var(--color-text-light)" />}
                            <span style={{ textDecoration: completedHomework.includes(t.id) ? 'line-through' : 'none', color: completedHomework.includes(t.id) ? 'var(--color-text-muted)' : 'inherit' }}>
                              {t.task}
                            </span>
                          </div>
                        ))}
                        {hw.length > 2 && (
                          <button
                            onClick={() => {
                              const sess = sessions.find((s) => String(s._id || s.id) === String(hw[0].sessionId));
                              if (sess) setSelectedSession(sess);
                            }}
                            style={{ marginTop: '6px', fontSize: '11.5px', color: 'var(--color-primary-dark)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            +{hw.length - 2} more <ChevronRight size={12} />
                          </button>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="student-empty">No completed sessions yet.</div>
          )}
        </section>
      </main>

      {/* ── Session Detail Modal ── */}
      {selectedSession && (
        <div className="student-modal-backdrop" role="presentation" onClick={() => setSelectedSession(null)}>
          <section
            className="student-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="session-details-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <span className="eyebrow">Session details</span>
                <h2 id="session-details-title">{profile?.subject || selectedSession.topic}</h2>
              </div>
              <button className="modal-close" onClick={() => setSelectedSession(null)} aria-label="Close session details">
                <X size={20} />
              </button>
            </div>

            <dl className="session-detail-grid">
              <div><dt>Tutor</dt><dd>{selectedSession.tutorId?.name || 'Assigned Tutor'}</dd></div>
              <div><dt>Date</dt><dd>{new Date(selectedSession.scheduledAt).toLocaleDateString()}</dd></div>
              <div><dt>Time</dt><dd>{new Date(selectedSession.scheduledAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</dd></div>
              <div><dt>Status</dt><dd><span className={`student-status ${selectedSession.status}`}>{selectedSession.status.replace('_', ' ')}</span></dd></div>
            </dl>

            <div className="session-topic"><strong>Topic</strong><p>{selectedSession.topic}</p></div>

            {completedSessions.some((s) => (s._id || s.id) === (selectedSession._id || selectedSession.id)) && (
              <div className="session-topic">
                <strong>Session notes</strong>
                <p>{selectedSession.notes || 'No notes were recorded for this session.'}</p>
              </div>
            )}

            {/* Homework for this session */}
            {(() => {
              const hw = sessionHw(selectedSession);
              if (!hw.length) return null;
              return (
                <div className="session-topic">
                  <strong style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BookMarked size={14} color="var(--color-primary-dark)" />
                    Assigned Homework ({hw.length})
                  </strong>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                    {hw.map((task) => {
                      const isDone = completedHomework.includes(task.id);
                      return (
                        <div
                          key={task.id}
                          className="modal-homework-item"
                          style={{ cursor: 'pointer', opacity: isDone ? 0.78 : 1 }}
                          onClick={() => { setSelectedSession(null); setSelectedHomework(task); }}
                        >
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 600, textDecoration: isDone ? 'line-through' : 'none', color: 'var(--color-text-dark)' }}>
                              {task.task}
                            </p>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <span className={`diff-badge ${task.difficulty || 'medium'}`}>{task.difficulty || 'medium'}</span>
                              {isDone && <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>&#x2713; Done</span>}
                            </div>
                          </div>
                          <button
                            className={`homework-check-button${isDone ? ' completed' : ''}`}
                            onClick={(e) => { e.stopPropagation(); toggleHomeworkCompletion(task.id, e); }}
                            title={isDone ? 'Mark as pending' : 'Mark as done'}
                          >
                            {isDone ? <CheckCircle size={20} /> : <Circle size={20} />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {selectedSession.aiReview?.summary && (
              <div className="session-topic" style={{ background: '#FAF8FE', padding: '12px', borderRadius: '8px', border: '1px solid #EFE9FE', marginTop: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary-dark)', fontWeight: 700, fontSize: '12px', marginBottom: '4px' }}>
                  <Sparkles size={14} /> AI Session Evaluation
                </div>
                <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5 }}>{selectedSession.aiReview.summary}</p>
              </div>
            )}
            {selectedSession.aiReview?.nextSessionSuggestion && (
              <div className="session-topic" style={{ background: '#FEF9C3', padding: '12px', borderRadius: '8px', border: '1px solid #FDE047', marginTop: '10px', color: '#713F12' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '12px', marginBottom: '4px' }}>
                  <Lightbulb size={14} color="#A16207" /> Next Session Focus
                </div>
                <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5 }}>{selectedSession.aiReview.nextSessionSuggestion}</p>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ── Homework Detail Modal ── */}
      {selectedHomework && (
        <div className="student-modal-backdrop" role="presentation" onClick={() => setSelectedHomework(null)}>
          <section
            className="student-modal homework-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="hw-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #3E0F8D, #9564DD)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <BookMarked size={18} color="white" />
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                    Homework Task
                  </span>
                  <h2 id="hw-modal-title" style={{ marginTop: '2px', fontSize: '18px', lineHeight: 1.3, color: 'var(--color-text-dark)' }}>
                    {selectedHomework.task}
                  </h2>
                </div>
              </div>
              <button className="modal-close" onClick={() => setSelectedHomework(null)} aria-label="Close homework detail">
                <X size={20} />
              </button>
            </div>

            {/* Badges */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <span className={`diff-badge ${selectedHomework.difficulty || 'medium'}`} style={{ padding: '4px 12px', fontSize: '12px' }}>
                {selectedHomework.difficulty || 'medium'} difficulty
              </span>
              <span className={`student-status ${completedHomework.includes(selectedHomework.id) ? 'done' : 'pending'}`} style={{ padding: '4px 12px', fontSize: '12px' }}>
                {completedHomework.includes(selectedHomework.id) ? '&#x2713; Completed' : 'Pending'}
              </span>
            </div>

            {/* Description */}
            {selectedHomework.taskDescription && selectedHomework.taskDescription !== selectedHomework.task && (
              <div className="hw-detail-section">
                <p className="hw-section-label">Description</p>
                <p className="hw-section-body">{selectedHomework.taskDescription}</p>
              </div>
            )}

            {/* Meta Info Grid */}
            <div className="hw-detail-section hw-meta-grid">
              <div className="hw-meta-item">
                <CalendarDays size={14} color="var(--color-primary-dark)" />
                <div>
                  <span className="hw-meta-label">Session Date</span>
                  <span className="hw-meta-value">{formatTime(selectedHomework.sessionDate)}</span>
                </div>
              </div>
              <div className="hw-meta-item">
                <BookOpen size={14} color="var(--color-primary-dark)" />
                <div>
                  <span className="hw-meta-label">Topic</span>
                  <span className="hw-meta-value">{selectedHomework.sessionTopic}</span>
                </div>
              </div>
              <div className="hw-meta-item">
                <User size={14} color="var(--color-primary-dark)" />
                <div>
                  <span className="hw-meta-label">Assigned by</span>
                  <span className="hw-meta-value">{selectedHomework.tutorName}</span>
                </div>
              </div>
            </div>

            {/* AI Summary */}
            {selectedHomework.summary && (
              <div className="hw-detail-section" style={{ background: '#FAF8FE', padding: '14px', borderRadius: '10px', border: '1px solid #EFE9FE' }}>
                <p className="hw-section-label" style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--color-primary-dark)' }}>
                  <Sparkles size={13} /> AI Session Evaluation
                </p>
                <p className="hw-section-body" style={{ fontStyle: 'italic', color: 'var(--color-text-muted)', marginTop: '6px' }}>
                  {selectedHomework.summary}
                </p>
              </div>
            )}

            {/* Next Session Focus */}
            {selectedHomework.nextSessionSuggestion && (
              <div className="hw-detail-section" style={{ background: '#FEF9C3', padding: '14px', borderRadius: '10px', border: '1px solid #FDE047', color: '#713F12' }}>
                <p className="hw-section-label" style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#A16207' }}>
                  <Lightbulb size={13} /> Next Session Focus
                </p>
                <p className="hw-section-body" style={{ marginTop: '6px' }}>{selectedHomework.nextSessionSuggestion}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--color-border-light)' }}>
              <button
                onClick={(e) => toggleHomeworkCompletion(selectedHomework.id, e)}
                className={completedHomework.includes(selectedHomework.id) ? 'hw-action-btn hw-btn-undo' : 'hw-action-btn hw-btn-done'}
              >
                {completedHomework.includes(selectedHomework.id)
                  ? <><Circle size={16} /> Mark as Pending</>
                  : <><CheckCircle size={16} /> Mark as Done</>}
              </button>
              <button
                onClick={() => {
                  const sess = sessions.find((s) => String(s._id || s.id) === String(selectedHomework.sessionId));
                  if (sess) { setSelectedHomework(null); setSelectedSession(sess); }
                }}
                className="hw-action-btn hw-btn-session"
              >
                <ArrowLeft size={16} /> View Session
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
