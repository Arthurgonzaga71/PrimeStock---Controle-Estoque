import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import './ThemeToggle.css';

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button 
      className={`theme-toggle ${isDark ? 'dark' : 'light'}`}
      onClick={toggleTheme}
      aria-label={`Mudar para tema ${isDark ? 'claro' : 'escuro'}`}
    >
      <div className="toggle-track">
        <div className="toggle-thumb">
          {isDark ? '🌙' : '☀️'}
        </div>
      </div>
      <span className="toggle-label">
        {isDark ? 'Modo Escuro' : 'Modo Claro'}
      </span>
    </button>
  );
};

export default ThemeToggle;