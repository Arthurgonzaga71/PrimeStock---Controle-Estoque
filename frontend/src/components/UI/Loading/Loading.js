import React from 'react';
import './Loading.css';

const Loading = ({ 
  size = 'medium',
  type = 'spinner',
  text = 'Carregando...' 
}) => {
  return (
    <div className={`loading loading--${size} loading--${type}`}>
      <div className="loading__animation">
        {type === 'spinner' && <div className="loading__spinner"></div>}
        {type === 'dots' && (
          <div className="loading__dots">
            <div className="loading__dot"></div>
            <div className="loading__dot"></div>
            <div className="loading__dot"></div>
          </div>
        )}
        {type === 'pulse' && <div className="loading__pulse"></div>}
      </div>
      {text && <span className="loading__text">{text}</span>}
    </div>
  );
};

export default Loading;