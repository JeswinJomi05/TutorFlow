import { AlertCircle } from 'lucide-react';
import './InputField.css';

export default function InputField({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  onFocus,
  onBlur,
  error,
  disabled = false,
  icon: Icon,
  autoComplete,
}) {
  return (
    <div className="input-field-wrapper">
      {label && (
        <label htmlFor={id} className="input-label">
          {label}
        </label>
      )}
      <div className={`input-container ${Icon ? 'has-icon' : ''} ${error ? 'is-error' : ''} ${disabled ? 'is-disabled' : ''}`}>
        {Icon && (
          <span className="input-leading-icon">
            <Icon size={18} />
          </span>
        )}
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          disabled={disabled}
          autoComplete={autoComplete}
          className="input-element"
        />
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
