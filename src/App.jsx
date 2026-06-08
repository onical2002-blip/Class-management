import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ClassProvider } from './context/ClassContext';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './pages/Dashboard';
import PointsSystem from './pages/PointsSystem';
import RandomTimer from './pages/RandomTimer';
import ExamTimer from './pages/ExamTimer';
import Blackboard from './pages/Blackboard';
import Homework from './pages/Homework';
import GroupMode from './pages/GroupMode';
import ClassSchedule from './pages/ClassSchedule';

function App() {
  const [sidebarWidth, setSidebarWidth] = useState(260);

  const handleMouseDown = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (moveEvent) => {
      const newWidth = Math.max(200, Math.min(450, startWidth + (moveEvent.clientX - startX)));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <ClassProvider>
      <Router>
        <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
          <Sidebar width={sidebarWidth} />
          <div
            className="sidebar-resizer"
            onMouseDown={handleMouseDown}
            style={{
              width: '8px',
              cursor: 'col-resize',
              zIndex: 100,
              background: 'rgba(140, 110, 88, 0.03)',
              borderLeft: '1px solid rgba(140, 110, 88, 0.08)',
              borderRight: '1px solid rgba(140, 110, 88, 0.08)',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(140, 110, 88, 0.15)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(140, 110, 88, 0.03)'}
          />
          <div style={{ flex: 1, height: '100vh', overflow: 'auto', position: 'relative' }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/blackboard" element={<Blackboard />} />
              <Route path="/schedule" element={<ClassSchedule />} />
              <Route path="/points" element={<PointsSystem />} />
              <Route path="/homework" element={<Homework />} />
              <Route path="/group" element={<GroupMode />} />
              <Route path="/random-timer" element={<RandomTimer />} />
              <Route path="/exam-timer" element={<ExamTimer />} />
            </Routes>
          </div>
        </div>
      </Router>
    </ClassProvider>
  );
}

export default App;
