import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useClass } from '../../context/ClassContext';
import { Home, ClipboardList, Calendar, PlusCircle, CheckSquare, Users, Timer, Clock, Settings } from 'lucide-react';
import SettingsModal from './SettingsModal';
import './Sidebar.css';

const navItems = [
  { path: '/', label: '首頁', icon: Home, color: '#f39c12' },
  { path: '/blackboard', label: '班級黑板', icon: ClipboardList, color: '#3498db' },
  { path: '/schedule', label: '班級課表', icon: Calendar, color: '#8e44ad' },
  { path: '/points', label: '加分系統', icon: PlusCircle, color: '#e74c3c' },
  { path: '/homework', label: '作業訂正', icon: CheckSquare, color: '#9b59b6' },
  { path: '/group', label: '分組模式', icon: Users, color: '#2ecc71' },
  { path: '/random-timer', label: '抽籤計時', icon: Timer, color: '#e67e22' },
  { path: '/exam-timer', label: '考試計時', icon: Clock, color: '#1abc9c' },
];

const Sidebar = ({ width }) => {
  const { currentClass } = useClass();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div 
      className="sidebar-container" 
      style={{ width: `${width}px`, minWidth: `${width}px` }}
    >
      {/* Profile Section */}
      <div className="profile-section">
        <div className="profile-card">
          <div className="avatar-placeholder">班</div>
          <div className="profile-info">
            <h3>班級管理</h3>
            <p>本機端教師工作台</p>
          </div>
        </div>
        <button className="btn btn-outline" style={{ borderRadius: '20px', fontSize: '12px', padding: '6px' }}>
          Google 登入
        </button>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.05)', margin: '4px 0' }} />

      {/* Current Class Section */}
      <div className="current-class-section">
        <div className="section-label">目前班級</div>
        <div className="class-card" style={{ cursor: 'pointer' }} onClick={() => setShowSettings(true)} title="點擊修改班級設定">
          <div className="class-card-label">正在使用</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0 }}>{currentClass.name}</h2>
            <Settings size={14} color="#999" />
          </div>
          <p style={{ marginTop: '8px' }}>{currentClass.totalStudents} 位學生 · 待辦 {currentClass.absentStudents}</p>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="section-label">功能</div>
      <div className="nav-menu">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <item.icon size={18} color={item.color} className="icon-container" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      <button className="nav-item settings-btn" onClick={() => setShowSettings(true)}>
        <Settings size={18} />
        <span>設定</span>
      </button>

      {/* Settings Modal */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
};

export default Sidebar;
