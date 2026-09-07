import { useEffect, useState } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Save, 
  Sparkles, 
  CheckCircle2, 
  ListOrdered, 
  HelpCircle, 
  BookOpen, 
  Lightbulb, 
  Play, 
  CheckSquare, 
  RefreshCw,
  Clock,
  Calendar,
  AlertCircle,
  X,
  Hash
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import tutorService from '../services/tutorService';
import TutorLayout, { Button, EmptyState, ErrorState, Loading, PageHeader, StatusBadge } from '../components/TutorLayout';
import { formatDate, formatTime, getError } from '../components/tutorUtils';
import './TutorPages.css';

const resourceId = (item) => item?._id || item?.id;

function AiBadge({ label = 'Gemini AI' }) {
  return (
    <span className="ai-badge">
      <Sparkles size={12} />
      {label}
    </span>
  );
}

function SessionRows({ sessions, onOpen }) {
  return (
    <div className="session-list">
      {sessions.map((session) => (
        <button
          className="session-row"
          key={resourceId(session)}
          onClick={() => onOpen(resourceId(session))}
          type="button"
        >
          <div>
            <strong>{session.topic}</strong>
            <span>{session.studentId?.name || 'Student'}</span>
          </div>
          <div>
            <span>{formatDate(session.scheduledAt)} · {formatTime(session.scheduledAt)}</span>
            <StatusBadge status={session.status} />
          </div>
        </button>
      ))}
    </div>
  );
}

/**
 * Modal dialog to ask the tutor for the number of homework questions to generate
 */
function HomeworkConfigModal({ isOpen, onClose, onConfirm, initialCount = 3, topic, isGenerating }) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    if (isOpen) {
      setCount(initialCount);
    }
  }, [isOpen, initialCount]);

  if (!isOpen) return null;

  const quickOptions = [1, 2, 3, 4, 5];

  return (
    <div className="hw-modal-backdrop" onClick={onClose} role="presentation">
      <div 
        className="hw-modal-dialog" 
        onClick={(e) => e.stopPropagation()} 
        role="dialog" 
        aria-labelledby="hw-modal-title"
      >
        <div className="hw-modal-header">
          <div className="hw-modal-title-wrap">
            <div className="hw-modal-icon">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 id="hw-modal-title" className="hw-modal-title">Generate AI Homework & Review</h3>
              <p className="hw-modal-sub">Personalized practice assignment for {topic || 'this session'}</p>
            </div>
          </div>
          <button type="button" className="hw-modal-close" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        <div className="hw-modal-body">
          <div className="hw-question-prompt">
            <label className="hw-prompt-label">
              How many homework questions would you like to generate?
            </label>
            <p className="hw-prompt-desc">
              Select the desired number of practice problems Gemini should create for the student:
            </p>

            {/* Quick Pill Buttons */}
            <div className="hw-quick-options">
              {quickOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`hw-pill-button ${count === opt ? 'selected' : ''}`}
                  onClick={() => setCount(opt)}
                >
                  <span className="hw-pill-number">{opt}</span>
                  <span className="hw-pill-text">{opt === 1 ? 'Question' : 'Questions'}</span>
                  {opt === 3 && <span className="hw-pill-rec">Standard</span>}
                </button>
              ))}
            </div>

            {/* Custom Stepper */}
            <div className="hw-custom-stepper-wrap">
              <span className="hw-stepper-label">Or adjust count (1-10):</span>
              <div className="hw-stepper-control">
                <button
                  type="button"
                  className="hw-stepper-btn"
                  onClick={() => setCount((c) => Math.max(1, c - 1))}
                  disabled={count <= 1}
                  aria-label="Decrease question count"
                >
                  -
                </button>
                <span className="hw-stepper-val">{count}</span>
                <button
                  type="button"
                  className="hw-stepper-btn"
                  onClick={() => setCount((c) => Math.min(10, c + 1))}
                  disabled={count >= 10}
                  aria-label="Increase question count"
                >
                  +
                </button>
              </div>
            </div>

            {/* Information Callout */}
            <div className="hw-info-callout">
              <BookOpen size={15} color="var(--color-primary-dark)" />
              <span>
                Gemini will craft <strong>{count} {count === 1 ? 'concrete problem' : 'concrete problems'}</strong> tailored to <em>{topic || 'the session topic'}</em> with step-by-step guidance hints and difficulty grading.
              </span>
            </div>
          </div>
        </div>

        <div className="hw-modal-footer">
          <Button variant="secondary" onClick={onClose} disabled={isGenerating}>
            Cancel
          </Button>
          <button
            type="button"
            className="tf-button ai-button"
            onClick={() => onConfirm(count)}
            disabled={isGenerating}
          >
            <Sparkles size={16} className={isGenerating ? 'animate-spin' : ''} />
            {isGenerating ? 'Generating...' : `Generate ${count} Homework ${count === 1 ? 'Question' : 'Questions'}`}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Rich AI Lesson Plan Card Component
 */
function AiLessonPlanCard({ plan, onRegenerate, isRegenerating, canRegenerate = false }) {
  if (!plan || (!plan.learningObjectives?.length && !plan.lessonOutline?.length && !plan.practiceQuestions?.length)) {
    return null;
  }

  return (
    <section className="ai-card" aria-label="AI Session Preparation Plan">
      <div className="ai-card-header">
        <div className="ai-header-left">
          <div className="ai-header-icon">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="ai-card-title">AI Session Preparation Plan</h3>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AiBadge label="Gemini 3.6 Plan" />
          {canRegenerate && (
            <Button 
              variant="secondary" 
              onClick={onRegenerate} 
              disabled={isRegenerating}
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              <RefreshCw size={13} className={isRegenerating ? 'animate-spin' : ''} />
              {isRegenerating ? 'Updating...' : 'Regenerate Plan'}
            </Button>
          )}
        </div>
      </div>

      <div className="ai-card-body">
        {/* 1. Learning Objectives */}
        {plan.learningObjectives?.length > 0 && (
          <div>
            <h4 className="ai-subheading">
              <CheckCircle2 size={15} color="var(--color-primary-dark)" />
              Key Learning Objectives
            </h4>
            <div className="ai-objectives-grid">
              {plan.learningObjectives.map((obj, idx) => (
                <div key={idx} className="ai-objective-item">
                  <CheckSquare size={16} />
                  <span>{obj}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. Step-by-Step Lesson Outline */}
        {plan.lessonOutline?.length > 0 && (
          <div>
            <h4 className="ai-subheading">
              <ListOrdered size={15} color="var(--color-primary-dark)" />
              Structured Lesson Outline
            </h4>
            <div className="ai-outline-timeline">
              {plan.lessonOutline.map((step, idx) => (
                <div key={idx} className="ai-step-card">
                  <span className="ai-step-badge">Step {step.step || idx + 1}</span>
                  <div className="ai-step-content">
                    <strong>{step.title}</strong>
                    <p>{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Progressively Challenging Practice Questions */}
        {plan.practiceQuestions?.length > 0 && (
          <div>
            <h4 className="ai-subheading">
              <HelpCircle size={15} color="var(--color-primary-dark)" />
              Practice Questions & Checks for Understanding
            </h4>
            <div className="ai-questions-grid">
              {plan.practiceQuestions.map((q, idx) => {
                const diff = (q.difficulty || 'medium').toLowerCase();
                return (
                  <div key={idx} className="ai-question-card">
                    <p>{q.question || q}</p>
                    <span className={`diff-tag ${diff}`}>
                      {diff}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Rich AI Session Review & Homework Card Component
 */
function AiSessionReviewCard({ review, onRegenerate, isRegenerating, canRegenerate = false }) {
  if (!review || (!review.summary && !review.homework?.length && !review.nextSessionSuggestion)) {
    return null;
  }

  return (
    <section className="ai-card" aria-label="AI Session Review and Homework">
      <div className="ai-card-header">
        <div className="ai-header-left">
          <div className="ai-header-icon" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
            <BookOpen size={18} />
          </div>
          <div>
            <h3 className="ai-card-title">AI Session Review & Homework</h3>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AiBadge label="Gemini Evaluated" />
          {canRegenerate && (
            <Button 
              variant="secondary" 
              onClick={onRegenerate} 
              disabled={isRegenerating}
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              <RefreshCw size={13} className={isRegenerating ? 'animate-spin' : ''} />
              {isRegenerating ? 'Re-analyzing...' : 'Regenerate Review'}
            </Button>
          )}
        </div>
      </div>

      <div className="ai-card-body">
        {/* 1. Summary of Session Progress */}
        {review.summary && (
          <div>
            <h4 className="ai-subheading">Session Assessment</h4>
            <div className="ai-summary-callout">
              {review.summary}
            </div>
          </div>
        )}

        {/* 2. Assigned Homework Tasks */}
        {review.homework?.length > 0 && (
          <div>
            <h4 className="ai-subheading">
              <BookOpen size={15} color="var(--color-primary-dark)" />
              Personalized Homework Tasks
            </h4>
            <div className="ai-homework-grid">
              {review.homework.map((hw, idx) => {
                const title = typeof hw === 'string' ? hw : (hw.task || hw.description || 'Assignment');
                const desc = typeof hw === 'object' && hw.description ? hw.description : '';
                const diff = (typeof hw === 'object' && hw.difficulty ? hw.difficulty : 'medium').toLowerCase();
                return (
                  <div key={idx} className="ai-homework-card">
                    <div>
                      <strong>{title}</strong>
                      {desc && desc !== title && <p>{desc}</p>}
                    </div>
                    <span className={`diff-tag ${diff}`}>
                      {diff}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Next Session Focus Suggestion */}
        {review.nextSessionSuggestion && (
          <div>
            <h4 className="ai-subheading">
              <Lightbulb size={15} color="#A16207" />
              Recommended Focus for Next Session
            </h4>
            <div className="ai-next-card">
              <Lightbulb size={18} />
              <span>{review.nextSessionSuggestion}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Session Detail Page (Interactive State Machine + AI Integration)
 */
export function SessionDetailPage() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [error, setError] = useState('');
  const [aiError, setAiError] = useState('');
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [homeworkCount, setHomeworkCount] = useState(3);
  const [showHwModal, setShowHwModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    tutorService.getSessionById(sessionId)
      .then((response) => {
        setSession(response.data);
        setNotes(response.data.notes || '');
      })
      .catch((err) => setError(getError(err, 'Session not found.')));
  }, [sessionId]);

  if (!session) {
    return (
      <TutorLayout>
        {error ? <ErrorState message={error} /> : <Loading label="Loading session..." />}
      </TutorLayout>
    );
  }

  const startSession = async () => {
    try {
      const response = await tutorService.updateSessionStatus(sessionId, 'in_progress');
      setSession(response.data);
    } catch (err) {
      setError(getError(err, 'Unable to start session.'));
    }
  };

  const saveNotes = async () => {
    setSavingNotes(true);
    try {
      const response = await tutorService.updateSessionNotes(sessionId, notes);
      setSession(response.data);
    } catch (err) {
      setError(getError(err, 'Unable to save notes.'));
    } finally {
      setSavingNotes(false);
    }
  };

  const completeSession = async () => {
    if (!window.confirm('Complete this session? Once marked completed, the lesson notes become permanently read-only and ready for AI review.')) {
      return;
    }
    try {
      if (notes && notes.trim() && notes !== session.notes) {
        await tutorService.updateSessionNotes(sessionId, notes);
      }
      const response = await tutorService.updateSessionStatus(sessionId, 'completed');
      setSession(response.data);
    } catch (err) {
      setError(getError(err, 'Unable to complete session.'));
    }
  };

  const generatePlan = async () => {
    setAiLoading(true);
    setAiError('');
    try {
      const response = await tutorService.generateSessionPlan(sessionId);
      setSession((current) => ({ ...current, aiPlan: response.data }));
    } catch (err) {
      setAiError(getError(err, 'Unable to generate session plan with Gemini. Please try again.'));
    } finally {
      setAiLoading(false);
    }
  };

  const generateReview = async (count = homeworkCount) => {
    setShowHwModal(false);
    setAiLoading(true);
    setAiError('');
    try {
      const response = await tutorService.generateSessionReview(sessionId, { homeworkCount: count });
      setSession((current) => ({ ...current, ...response.data }));
    } catch (err) {
      setAiError(getError(err, 'Unable to generate AI review. Please try again.'));
    } finally {
      setAiLoading(false);
    }
  };

  const hasPlan = session.aiPlan && (
    (session.aiPlan.learningObjectives?.length > 0) ||
    (session.aiPlan.lessonOutline?.length > 0) ||
    (session.aiPlan.practiceQuestions?.length > 0) ||
    session.aiPlan.generatedAt
  );

  const hasReview = session.aiReview && (
    session.aiReview.summary ||
    session.aiReview.homework?.length > 0 ||
    session.aiReview.nextSessionSuggestion ||
    session.aiReview.generatedAt
  );

  return (
    <TutorLayout>
      <button className="back-link" onClick={() => navigate(-1)} type="button">
        <ArrowLeft size={16} />
        Back
      </button>

      <PageHeader
        eyebrow="Session Workspace"
        title={session.topic}
        description={`${session.studentId?.name || 'Student'} · ${formatDate(session.scheduledAt)} at ${formatTime(session.scheduledAt)}`}
        action={<StatusBadge status={session.status} />}
      />

      {error && <div className="form-error" style={{ marginBottom: '20px' }}>{error}</div>}
      {aiError && (
        <div className="form-error" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} />
          {aiError}
        </div>
      )}

      {/* Main Session Control Panel */}
      <div className="detail-panel">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h2 style={{ margin: 0 }}>Live Session Notes</h2>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            {session.status === 'in_progress' ? '● Active Live Editing' : (session.status === 'scheduled' ? 'Scheduled' : '🔒 Read-Only')}
          </span>
        </div>

        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          readOnly={session.status !== 'in_progress'}
          placeholder={
            session.status === 'scheduled'
              ? 'Notes will become editable once you click "Start Session".'
              : 'Record key concepts covered, student responses, strengths, and areas needing reinforcement...'
          }
        />

        {/* State Transition Actions */}
        <div className="detail-actions">
          {session.status === 'scheduled' && (
            <>
              <Button onClick={startSession}>
                <Play size={16} />
                Start Session
              </Button>
              <button
                type="button"
                className="tf-button ai-button"
                onClick={generatePlan}
                disabled={aiLoading}
              >
                <Sparkles size={16} className={aiLoading ? 'animate-spin' : ''} />
                {aiLoading ? 'Generating Plan...' : (hasPlan ? 'Regenerate AI Plan' : 'Generate AI Session Plan')}
              </button>
            </>
          )}

          {session.status === 'in_progress' && (
            <>
              <Button variant="secondary" onClick={saveNotes} disabled={savingNotes}>
                <Save size={16} />
                {savingNotes ? 'Saving...' : 'Save Notes'}
              </Button>
              <Button onClick={completeSession}>
                <CheckCircle2 size={16} />
                Complete Session
              </Button>
            </>
          )}

          {session.status === 'completed' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start' }}>
              {!notes.trim() && (
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                  ℹ️ Notes were not entered during the live session. Gemini will formulate the review using the session topic and preparation plan.
                </span>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="tf-button ai-button"
                  onClick={() => setShowHwModal(true)}
                  disabled={aiLoading}
                >
                  <Sparkles size={16} className={aiLoading ? 'animate-spin' : ''} />
                  {aiLoading ? 'Analyzing Session with Gemini...' : 'Generate AI Review & Homework'}
                </button>
                <button 
                  type="button" 
                  className="hw-count-badge-btn"
                  onClick={() => setShowHwModal(true)}
                  disabled={aiLoading}
                  title="Configure number of homework questions"
                >
                  <span>Questions to generate:</span>
                  <strong>{homeworkCount}</strong>
                </button>
              </div>
            </div>
          )}

          {session.status === 'ai_reviewed' && (
            <div className="read-only-notice">
              <CheckCircle2 size={15} color="#10B981" />
              Session completed and AI review generated.
            </div>
          )}
        </div>
      </div>

      {/* Render AI Session Review & Homework (Available once ai_reviewed) - PLACED ABOVE AI Session Preparation Plan */}
      {session.status === 'ai_reviewed' && hasReview && (
        <AiSessionReviewCard
          review={session.aiReview}
          canRegenerate={true}
          onRegenerate={() => setShowHwModal(true)}
          isRegenerating={aiLoading}
        />
      )}

      {/* Render AI Session Preparation Plan (Available during scheduled, in_progress, and completed states) */}
      {hasPlan && (
        <AiLessonPlanCard
          plan={session.aiPlan}
          canRegenerate={session.status === 'scheduled'}
          onRegenerate={generatePlan}
          isRegenerating={aiLoading}
        />
      )}

      {/* Homework Generation Question Count Modal */}
      <HomeworkConfigModal
        isOpen={showHwModal}
        onClose={() => setShowHwModal(false)}
        onConfirm={(count) => {
          setHomeworkCount(count);
          generateReview(count);
        }}
        initialCount={homeworkCount}
        topic={session.topic}
        isGenerating={aiLoading}
      />
    </TutorLayout>
  );
}

/**
 * Student Profile Page (Student Details + Session History + AI Progress Summary)
 */
export function StudentProfilePage() {
  const { studentId } = useParams();
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [aiError, setAiError] = useState('');
  const [summary, setSummary] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    tutorService.getStudentById(studentId)
      .then((response) => setResult(response.data))
      .catch((err) => setError(getError(err, 'Student not found.')));
  }, [studentId]);

  if (!result) {
    return (
      <TutorLayout>
        {error ? <ErrorState message={error} /> : <Loading label="Loading student profile..." />}
      </TutorLayout>
    );
  }

  const { student, profile, sessions } = result;

  const generateProgress = async () => {
    setLoadingAi(true);
    setAiError('');
    try {
      const response = await tutorService.generateProgressSummary(studentId);
      setSummary(response.data.summary);
    } catch (err) {
      setAiError(getError(err, 'Unable to generate progress summary with Gemini.'));
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <TutorLayout>
      <Link className="back-link" to="/tutor/students">
        <ArrowLeft size={16} />
        Back to Students
      </Link>

      <PageHeader
        eyebrow="Student Profile"
        title={student.name}
        description={`${profile?.subject || 'Student'} · ${profile?.currentLevel || ''}`}
        action={
          <Button onClick={() => navigate(`/tutor/sessions/new?studentId=${studentId}`)}>
            <Plus size={17} />
            Schedule Session
          </Button>
        }
      />

      <section className="profile-grid">
        {/* Left Column: Academic Profile + AI Progress Analysis */}
        <div className="info-panel">
          <h2>Student Information</h2>
          <dl>
            <dt>Subject</dt>
            <dd>{profile?.subject || 'Not specified'}</dd>

            <dt>Current Level</dt>
            <dd>{profile?.currentLevel || 'Not specified'}</dd>

            <dt>Learning Goals</dt>
            <dd>{profile?.learningGoals || 'No learning goals recorded.'}</dd>

            <dt>Weak Areas</dt>
            <dd>{profile?.weakAreas || 'No weak areas recorded.'}</dd>
          </dl>

          {/* AI Progress Intelligence Box */}
          <div className="ai-progress-box">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '14.5px', fontWeight: 700, color: 'var(--color-primary-deep)' }}>
                AI Learning Progress
              </h3>
              <AiBadge label="Gemini Analysis" />
            </div>

            <p style={{ fontSize: '12.5px', color: 'var(--color-text-muted)', marginBottom: '14px', lineHeight: 1.45 }}>
              Synthesizes historical sessions, notes, and homework mastery trends into a comprehensive progress evaluation.
            </p>

            <button
              type="button"
              className="tf-button ai-button"
              onClick={generateProgress}
              disabled={loadingAi}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <Sparkles size={16} className={loadingAi ? 'animate-spin' : ''} />
              {loadingAi ? 'Analyzing Student Progress...' : 'Generate Progress Summary'}
            </button>

            {aiError && (
              <div className="form-error" style={{ marginTop: '12px' }}>
                {aiError}
              </div>
            )}

            {summary && (
              <div className="ai-progress-summary-text">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--color-primary-dark)', fontWeight: 700, fontSize: '12px' }}>
                  <Sparkles size={14} />
                  Gemini Progress Evaluation
                </div>
                {summary}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Session History */}
        <div className="info-panel">
          <h2>Session History ({sessions.length})</h2>
          {sessions.length ? (
            <SessionRows
              sessions={sessions}
              onOpen={(id) => navigate(`/tutor/sessions/${id}`)}
            />
          ) : (
            <EmptyState
              title="No sessions yet"
              text="Schedule the first 1-on-1 tutoring session with this student."
              action={
                <Button onClick={() => navigate(`/tutor/sessions/new?studentId=${studentId}`)}>
                  <Plus size={16} />
                  Schedule Now
                </Button>
              }
            />
          )}
        </div>
      </section>
    </TutorLayout>
  );
}
