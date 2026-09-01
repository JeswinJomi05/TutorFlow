import { useState } from 'react';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import './PasswordInput.css';

export default function PasswordInput({
  id = 'password',
  label = 'Password',
  placeholder = 'Enter your password',
  value,
  onChange,
  onFocus,
  onBlur,
  error,
  disabled = false,
  autoComplete = 'current-password',
}) {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = (e) => {
    e.preventDefault();
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="password-input-wrapper">
      <div className="password-label-row">
        <label htmlFor={id} className="input-label">
          {label}
        </label>
      </div>
      <div
        className={`password-container ${error ? 'is-error' : ''} ${
          disabled ? 'is-disabled' : ''
        }`}
      >
        <span className="password-leading-icon">
          <Lock size={18} />
        </span>
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          disabled={disabled}
          autoComplete={autoComplete}
          className="password-element"
        />
        <button
          type="button"
          className="password-toggle"
          onClick={togglePasswordVisibility}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          title={showPassword ? 'Hide password' : 'Show password'}
          disabled={disabled}
          tabIndex={0}
        >
          {showPassword ? (
            <EyeOff size={18} className="password-icon" />
          ) : (
            <Eye size={18} className="password-icon" />
          )}
        </button>
      </div>
      {error && (
        <div className="input-error-message animate-fade-in" role="alert">
          <AlertCircle size={14} className="input-error-icon" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
