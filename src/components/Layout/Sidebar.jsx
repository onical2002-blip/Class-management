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
  const { 
    currentClass, 
    googleUser, 
    loginWithGoogle, 
    logoutGoogle, 
    syncToCloud, 
    syncFromCloud, 
    syncStatus 
  } = useClass();
  const [showSettings, setShowSettings] = useState(false);

  const handleGoogleLogin = () => {
    loginWithGoogle().catch(err => {
      console.error(err);
      alert("登入失敗: " + (err.message || "請確認 Client ID 設定與網路連線。"));
    });
  };

  return (
    <div 
      className="sidebar-container" 
      style={{ width: `${width}px`, minWidth: `${width}px` }}
    >
      {/* Profile Section */}
      <div className="profile-section">
        {!googleUser ? (
          <>
            <div className="profile-card">
              <div className="avatar-placeholder">班</div>
              <div className="profile-info">
                <h3>班級管理</h3>
                <p>本機端教師工作台</p>
              </div>
            </div>
            <button 
              className="btn btn-outline" 
              onClick={handleGoogleLogin}
              style={{ borderRadius: '20px', fontSize: '12px', padding: '6px', width: '100%', marginTop: '8px' }}
            >
              Google 登入
            </button>
          </>
        ) : (
          <>
            <div className="profile-card">
              <img 
                src={googleUser.picture} 
                alt={googleUser.name} 
                style={{ width: '40px', height: '40px', borderRadius: '50%' }} 
              />
              <div className="profile-info">
                <h3 style={{ fontSize: '13px', fontWeight: 'bold' }}>{googleUser.name}</h3>
                <p style={{ color: '#2ecc71', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', margin: 0 }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2ecc71', display: 'inline-block' }}></span>
                  已登入雲端 {syncStatus === 'syncing' ? '(同步中...)' : ''}
                </p>
              </div>
            </div>
            <div className="google-actions-row" style={{ display: 'flex', gap: '6px', width: '100%', marginTop: '8px' }}>
              <button 
                className="btn btn-glass btn-small" 
                onClick={() => syncToCloud()} 
                style={{ flex: 1, padding: '4px', fontSize: '11px', whiteSpace: 'nowrap' }}
                title="儲存本機變更至雲端硬碟"
              >
                儲存雲端
              </button>
              <button 
                className="btn btn-glass btn-small" 
                onClick={() => syncFromCloud()} 
                style={{ flex: 1, padding: '4px', fontSize: '11px', whiteSpace: 'nowrap' }}
                title="從雲端載入最新進度"
              >
                載入雲端
              </button>
              <button 
                className="btn btn-outline btn-small" 
                onClick={logoutGoogle} 
                style={{ padding: '4px 8px', fontSize: '11px', color: '#e74c3c', borderColor: '#f9d5d5', whiteSpace: 'nowrap' }}
              >
                登出
              </button>
            </div>
          </>
        )}
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
