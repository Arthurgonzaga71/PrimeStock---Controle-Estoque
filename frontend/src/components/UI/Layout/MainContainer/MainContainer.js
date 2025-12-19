import React from 'react';
import './MainContainer.css';

const MainContainer = ({ children, className = '' }) => {
  return (
    <main className={`main-container ${className}`}>
      <div className="main-content">
        {children}
      </div>
    </main>
  );
};

export default MainContainer;