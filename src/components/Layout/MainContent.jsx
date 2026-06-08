import React from 'react';
import { useClass } from '../../context/ClassContext';
import './MainContent.css';

const MainContent = ({ children, title, subtitle, actions, headerExtra, className }) => {
  const { currentClass } = useClass();
  
  // If no explicit title is provided, default to current class name
  const displayTitle = title || currentClass.name;

  return (
    <div className={`main-content-wrapper ${className || ''}`}>
      <div className="page-bg"></div>
      
      <div className="topbar">
        <div className="topbar-header">
          <div className="hub-label">CLASSROOM HUB</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap', marginTop: '4px' }}>
            <h1 style={{ margin: 0 }}>{displayTitle}</h1>
            {headerExtra}
          </div>
          {subtitle && <div className="topbar-subtitle">{subtitle}</div>}
        </div>
        
        {actions && (
          <div className="topbar-actions">
            {actions}
          </div>
        )}
      </div>
      
      <div className="page-container">
        {children}
      </div>
    </div>
  );
};

export default MainContent;
