import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, Plus, Users, CheckCircle, RefreshCw, Clock } from 'lucide-react';
import authService from '../services/authService';
import tutorService from '../services/tutorService';
import TutorLayout, { Button, EmptyState, ErrorState, Loading, PageHeader, StatusBadge } from '../components/TutorLayout';
import { formatDate, formatTime, getError } from '../components/tutorUtils';
import './TutorPages.css';
import './TutorDashboard.css';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function MetricCard({ icon: Icon, label, value, accent }) {
  return (
    <div className={`metric-card${accent ? ` metric-card--${accent}` : ''}`}>
      <div className="metric-icon">
        <Icon size={20} />
      </div>
      <div>
        <span>{label}</span>
        <strong>{value ?? '—'}</strong>
      </div>
    </div>
  );
}

export default function TutorDashboard() {
  const [students, setStudents] = useState(null);
  const [sessions, setSessions] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();
  const user = authService.getUser() || {};

  const loadDashboard = useCallback(async (silent = false) => {
    if (!silent) {
      setStudents(null);
      setSessions(null);
      setError('');
    }
    setRefreshing(true);
    try {
      const [studentRes, sessionRes] = await Promise.all([
        tutorService.getStudents(),
        tutorService.getSessions(),
      ]);
      setStudents(studentRes.data || []);
      setSessions(sessionRes.data || []);
      setError('');
    } catch (err) {
      setError(getError(err, 'Unable to load dashboard. Please try again.'));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Silently refresh when user returns to the tab
  useEffect(() => {
    const handleFocus = () => {
      if (students !== null) loadDashboard(true);
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [students, loadDashboard]);

  if (students === null || sessions === null) {
    return <TutorLayout><Loading label="Loading dashboard..." /></TutorLayout>;
  }

  if (error && students === null) {
    return (
      <TutorLayout>
        <ErrorState message={error} />
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
          <Button onClick={() => loadDashboard()}>Retry</Button>
        </div>
      </TutorLayout>
    );
  }

  const upcoming = sessions
    .filter((s) => s.status === 'scheduled' || s.status === 'in_progress')
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

  const todayCount = upcoming.filter(
    (s) => new Date(s.scheduledAt).toDateString() === new Date().toDateString()
  ).length;

  const completedCount = sessions.filter((s) => s.status === 'completed').length;

  const firstName = (user.name || 'Tutor').split(' ')[0];

  return (
    <TutorLayout>
      <div className="dashboard-header-row">
        <PageHeader
          eyebrow="Tutor dashboard"
          title={`${getGreeting()}, ${firstName}`}
          description="Here's an overview of your students and upcoming sessions."
          action={
            <div className="dashboard-actions">
              <button
                className={`refresh-btn${refreshing ? ' refreshing' : ''}`}
                onClick={() => loadDashboard(true)}
                title="Refresh dashboard"
                disabled={refreshing}
              >
                <RefreshCw size={15} />
              </button>
              <Button onClick={() => navigate('/tutor/sessions/new')}>
                <Plus size={17} />
                Schedule Session
              </Button>
            </div>
          }
        />
      </div>

      {error && (
        <div className="dashboard-notice dashboard-notice--warn">
          {error}
          <button onClick={() => loadDashboard(true)}>Retry</button>
        </div>
      )}

      <section className="metrics-grid">
        <MetricCard icon={Users} label="Total Students" value={students.length} />
        <MetricCard icon={CalendarDays} label="Upcoming Sessions" value={upcoming.length} accent="purple" />
        <MetricCard icon={Clock} label="Today's Sessions" value={todayCount} accent="yellow" />
        <MetricCard icon={CheckCircle} label="Completed Sessions" value={completedCount} accent="green" />
      </section>

      <section className="info-panel dashboard-section">
        <div className="section-heading">
          <h2>Upcoming Sessions</h2>
          <Link className="text-link" to="/tutor/sessions">View all</Link>
        </div>
        {upcoming.length ? (
          <div className="session-list">
            {upcoming.slice(0, 5).map((session) => (
              <Link
                className="session-row"
                key={session._id}
                to={`/tutor/sessions/${session._id}`}
              >
                <div>
                  <strong>{session.studentId?.name || 'Student'}</strong>
                  <span>{session.topic}</span>
                </div>
                <div>
                  <span>{formatDate(session.scheduledAt)} · {formatTime(session.scheduledAt)}</span>
                  <StatusBadge status={session.status} />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No upcoming sessions"
            text="Schedule a session to get started."
            action={<Button onClick={() => navigate('/tutor/sessions/new')}>Schedule Session</Button>}
          />
        )}
      </section>

      <section className="info-panel dashboard-section">
        <div className="section-heading">
          <h2>Students</h2>
          <Link className="text-link" to="/tutor/students">View all</Link>
        </div>
        {students.length ? (
          <div className="data-list">
            {students.slice(0, 4).map((student) => (
              <Link className="data-row" key={student._id} to={`/tutor/students/${student._id}`}>
                <div>
                  <strong>{student.name}</strong>
                  <span>{student.profile?.subject} · {student.profile?.currentLevel}</span>
                </div>
                <span className="text-link">View Profile →</span>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No students yet"
            text="Add a student to start managing their sessions."
            action={
              <Button onClick={() => navigate('/tutor/students/new')}>
                <Plus size={17} />Add Student
              </Button>
            }
          />
        )}
      </section>
    </TutorLayout>
  );
}