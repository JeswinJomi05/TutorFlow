import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, TrendingUp, Users, Star, Sparkles, ShieldCheck } from 'lucide-react';
import LoginForm from '../components/LoginForm';
import './LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSuccess = (role) => {
    setIsLoading(false);
    if (role === 'tutor') {
      navigate('/tutor/dashboard');
    } else {
      navigate('/student/dashboard');
    }
  };

  return (
    <div className="login-page">
      {/* Left Section - Hero & Branding Showcase */}
      <section className="login-left-section" aria-label="Brand Overview">
        {/* Ambient Glowing Background Orbs */}
        <div className="ambient-glow orb-1"></div>
        <div className="ambient-glow orb-2"></div>
        <div className="ambient-grid"></div>

        <div className="left-content">
          {/* Header Brand Badge */}
          <div className="brand-header">
            <div className="logo-circle">
              <span className="logo-letters">TF</span>
            </div>
            <div className="brand-title-group">
              <h1 className="brand-heading">TutorFlow</h1>
              <span className="brand-badge">
                <Sparkles size={11} className="badge-sparkle" /> Modern EdTech
              </span>
            </div>
          </div>

          {/* Hero Tagline */}
          <div className="brand-hero-text">
            <h2 className="brand-message-primary">
              Smarter sessions.
              <br />
              <span className="brand-highlight">Better learning.</span>
            </h2>
            <p className="brand-supporting-text">
              The unified workspace for tutors and students to stay seamlessly connected, 
              scheduled, and on track for academic success.
            </p>
          </div>

          {/* Value Propositions */}
          <div className="feature-cards-grid">
            <div className="feature-item">
              <div className="feature-icon-wrapper">
                <Calendar size={18} />
              </div>
              <div className="feature-text">
                <h3>Smart Scheduling</h3>
                <p>Automated reminders and instant session booking</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon-wrapper">
                <TrendingUp size={18} />
              </div>
              <div className="feature-text">
                <h3>Progress Analytics</h3>
                <p>Track homework milestones and mastery metrics</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon-wrapper">
                <Users size={18} />
              </div>
              <div className="feature-text">
                <h3>Seamless Collaboration</h3>
                <p>Shared whiteboard notes and interactive lessons</p>
              </div>
            </div>
          </div>

          {/* Social Proof Testimonial Pill */}
          <div className="social-proof-banner">
            <div className="stars-row">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} className="star-icon" fill="currentColor" />
              ))}
            </div>
            <p className="social-proof-text">
              <strong>4.9 / 5</strong> rating from 10,000+ educators & students
            </p>
          </div>

          {/* Trust footer */}
          <div className="left-footer">
            <ShieldCheck size={14} />
            <span>FERPA & COPPA Compliant • Privacy First</span>
          </div>
        </div>
      </section>

      {/* Right Section - Login Form */}
      <main className="login-right-section" aria-label="Login Form">
        <LoginForm onLoginSuccess={handleLoginSuccess} isLoading={isLoading} />
      </main>
    </div>
  );
}
