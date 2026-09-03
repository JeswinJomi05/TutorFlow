import { useState } from 'react';
import { Mail, Lock, ShieldCheck, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import InputField from './InputField';
import PasswordInput from './PasswordInput';
import RoleSelector from './RoleSelector';
import authService from '../services/authService';
import './LoginForm.css';

const roleContent = {
  tutor: {
    heading: 'Welcome back, Tutor',
    subheading: 'Log in to manage your scheduled sessions, student track records, and lesson plans.',
  },
  student: {
    heading: 'Welcome back, Student',
    subheading: 'Log in to view upcoming tutoring sessions, assignments, and homework feedback.',
  },
};

export default function LoginForm({ onLoginSuccess, isLoading: parentLoading }) {
  const [selectedRole, setSelectedRole] = useState('tutor');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLoading = parentLoading || isSubmitting;

  const validateEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setErrors({});
    setGeneralError('');
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: '' }));
    }
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!validateEmail(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setGeneralError('');
    setIsSubmitting(true);

    try {
      const data = await authService.login(email.trim(), password, selectedRole);
      setIsSubmitting(false);
      if (onLoginSuccess) {
        onLoginSuccess(selectedRole, data);
      }
    } catch (err) {
      setIsSubmitting(false);
      console.error('Login error:', err);
      setGeneralError(
        err.message || 'Authentication failed. Please check your credentials.'
      );
    }
  };

  const content = roleContent[selectedRole];

  return (
    <div className="login-card animate-fade-in">
      {/* Mobile Branding Header */}
      <div className="login-header-mobile">
        <div className="logo-mobile-badge">TF</div>
        <div className="logo-mobile-info">
          <h1 className="logo-mobile-text">TutorFlow</h1>
          <span className="logo-mobile-tagline">Learning & Session Hub</span>
        </div>
      </div>

      {/* Welcome Heading */}
      <div className="welcome-section">
        <h2 className="welcome-heading">{content.heading}</h2>
        <p className="welcome-subheading">{content.subheading}</p>
      </div>

      {/* Role Selector */}
      <RoleSelector selectedRole={selectedRole} onRoleChange={handleRoleChange} />

      {/* General Error Message */}
      {generalError && (
        <div className="error-banner animate-fade-in" role="alert">
          <AlertCircle size={18} className="error-banner-icon" />
          <span>{generalError}</span>
        </div>
      )}

      {/* Main Login Form */}
      <form className="login-form" onSubmit={handleSubmit} noValidate>
        <div className="form-fields">
          <InputField
            label="Email address"
            id="email"
            type="email"
            placeholder="e.g. yourname@domain.com"
            value={email}
            onChange={handleEmailChange}
            error={errors.email}
            disabled={isLoading}
            icon={Mail}
            autoComplete="email"
          />

          <PasswordInput
            id="password"
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChange={handlePasswordChange}
            error={errors.password}
            disabled={isLoading}
          />
        </div>

        {/* Options Row: Remember Me & Forgot Password */}
        <div className="form-options-row">
          <label className="remember-checkbox-label">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isLoading}
              className="remember-checkbox"
            />
            <span>Remember me</span>
          </label>
          <a
            href="#forgot-password"
            className="forgot-password-link"
            onClick={(e) => {
              e.preventDefault();
              alert('Password reset link will be sent to your registered email.');
            }}
          >
            Forgot password?
          </a>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="login-submit-button"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <span>Sign In as {selectedRole === 'tutor' ? 'Tutor' : 'Student'}</span>
              <ArrowRight size={18} className="submit-arrow" />
            </>
          )}
        </button>
      </form>

      {/* Security Footer */}
      <div className="security-footer">
        <ShieldCheck size={16} className="security-icon" />
        <span>End-to-end 256-bit encrypted authentication</span>
      </div>
    </div>
  );
}
