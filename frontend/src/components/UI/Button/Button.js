import React from 'react';
import './Button.css';

const Button = ({ 
  children, 
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  icon, // Nova prop para ícones
  iconPosition = 'left', // 'left' ou 'right'
  ...props 
}) => {
  return (
    <button
      type={type}
      className={`btn btn--${variant} btn--${size} ${loading ? 'btn--loading' : ''} ${icon ? 'btn--with-icon' : ''}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && <div className="btn__spinner"></div>}
      
      {icon && iconPosition === 'left' && (
        <span className="btn__icon btn__icon--left">{icon}</span>
      )}
      
      <span className="btn__content">{children}</span>
      
      {icon && iconPosition === 'right' && (
        <span className="btn__icon btn__icon--right">{icon}</span>
      )}
    </button>
  );
};

export default Button;