import React from 'react';
import './Input.css';

const Input = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  success,
  disabled = false,
  required = false,
  icon,
  helperText,
  ...props
}) => {
  return (
    <div className="input-group">
      {label && (
        <label className="input-label">
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}
      
      <div className={`input-container ${error ? 'input-container--error' : ''} ${success ? 'input-container--success' : ''} ${disabled ? 'input-container--disabled' : ''}`}>
        {icon && <span className="input-icon">{icon}</span>}
        
        <input
          type={type}
          className="input"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          {...props}
        />
        
        {success && !error && (
          <span className="input-status input-status--success">✓</span>
        )}
        
        {error && (
          <span className="input-status input-status--error">!</span>
        )}
      </div>

      <div className="input-footer">
        {helperText && !error && (
          <span className="input-helper">{helperText}</span>
        )}
        {error && <span className="input-error">{error}</span>}
      </div>
    </div>
  );
};

export default Input;