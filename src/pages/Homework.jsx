import React, { useState, useEffect } from 'react';
import MainContent from '../components/Layout/MainContent';
import { useClass } from '../context/ClassContext';
import './Homework.css';

const Homework = () => {
  const { students } = useClass();
  
  const [homeworks, setHomeworks] = useState(() => {
    const saved = localStorage.getItem('class_homeworks');
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [activeHwId, setActiveHwId] = useState(null);

  useEffect(() => {
    localStorage.setItem('class_homeworks', JSON.stringify(homeworks));
  }, [homeworks]);

  const handleAddHomework = () => {
    const title = prompt("請輸入新作業名稱 (例如：國語習作第一課):");
    if (!title) return;

    const newHw = {
      id: Date.now(),
      title,
      date: new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'numeric', day: 'numeric' }),
      statuses: students.reduce((acc, s) => {
        acc[s.id] = 0; // Default to 0 (未繳交)
        return acc;
      }, {})
    };

    setHomeworks(prev => [newHw, ...prev]);
  };

  const cycleStatus = (hwId, studentId) => {
    setHomeworks(prev => prev.map(hw => {
      if (hw.id === hwId) {
        const currentStatus = hw.statuses[studentId] || 0;
        const nextStatus = (currentStatus + 1) % 4;
        return {
          ...hw,
          statuses: { ...hw.statuses, [studentId]: nextStatus }
        };
      }
      return hw;
    }));
  };

  const setAllStatus = (hwId, statusValue) => {
    setHomeworks(prev => prev.map(hw => {
      if (hw.id === hwId) {
        const updatedStatuses = { ...hw.statuses };
        students.forEach(s => {
          updatedStatuses[s.id] = statusValue;
        });
        return {
          ...hw,
          statuses: updatedStatuses
        };
      }
      return hw;
    }));
  };

  const getStats = (hw) => {
    const total = students.length;
    const stats = { 0: 0, 1: 0, 2: 0, 3: 0 };
    Object.values(hw.statuses).forEach(status => {
      stats[status] = (stats[status] || 0) + 1;
    });
    
    const completePercent = total > 0 ? Math.round((stats[3] / total) * 100) : 0;
    return { ...stats, completePercent, total };
  };

  const getStatusLabel = (code) => {
    switch(code) {
      case 0: return { label: '未繳交', class: 'st-0' };
      case 1: return { label: '已繳交', class: 'st-1' };
      case 2: return { label: '待訂正', class: 'st-2' };
      case 3: return { label: '已完成', class: 'st-3' };
      default: return { label: '未繳交', class: 'st-0' };
    }
  };

  if (activeHwId) {
    const activeHw = homeworks.find(h => h.id === activeHwId);
    if (!activeHw) return null;
    const stats = getStats(activeHw);

    return (
      <MainContent 
        title="作業訂正明細"
        subtitle="點擊學生卡片即可切換狀態：未繳交、已繳交、待訂正、已完成。"
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-glass btn-small" onClick={() => setAllStatus(activeHw.id, 1)}>一鍵已繳交</button>
            <button className="btn btn-glass btn-small" onClick={() => setAllStatus(activeHw.id, 0)}>一鍵未繳交</button>
            <button className="btn btn-outline" onClick={() => setActiveHwId(null)}>返回清單</button>
          </div>
        }
      >
        <div className="hw-detail-header glass-card">
          <div className="hw-detail-title-area">
            <span className="hw-tag">HOMEWORK CHECK</span>
            <h2>{activeHw.title}</h2>
            <p>點擊學生卡片即可切換狀態：未繳交、已繳交、待訂正、已完成。</p>
          </div>
          <div className="hw-detail-progress">
            <div className="progress-circle">
              <span className="pc-percent">{stats.completePercent}%</span>
              <span className="pc-label">已完成</span>
            </div>
          </div>
        </div>

        <div className="hw-status-summary">
          <div className="status-box box-0"><span className="label">未繳交</span><span className="count">{stats[0]}</span></div>
          <div className="status-box box-1"><span className="label">已繳交</span><span className="count">{stats[1]}</span></div>
          <div className="status-box box-2"><span className="label">待訂正</span><span className="count">{stats[2]}</span></div>
          <div className="status-box box-3"><span className="label">已完成</span><span className="count">{stats[3]}</span></div>
        </div>

        <div className="hw-students-grid">
          {students.map(student => {
            const status = activeHw.statuses[student.id] || 0;
            const statusInfo = getStatusLabel(status);
            return (
              <div 
                key={student.id} 
                className={`hw-student-card ${statusInfo.class}`}
                onClick={() => cycleStatus(activeHw.id, student.id)}
              >
                <div className="student-number">{student.id}</div>
                <div className="student-name">{student.name}</div>
                <div className="student-status-badge">{statusInfo.label}</div>
              </div>
            );
          })}
        </div>
      </MainContent>
    );
  }

  return (
    <MainContent 
      title="作業訂正"
      subtitle="用清單追蹤未繳交、待訂正與完成狀態。"
      actions={
        <div className="hw-actions">
          <button className="btn btn-outline">播放作業表</button>
          <button className="btn btn-outline">匯出學生報告</button>
          <button className="btn btn-accent" onClick={handleAddHomework}>新增作業</button>
        </div>
      }
    >
      <div className="hw-grid">
        {homeworks.length === 0 && (
          <div style={{ color: 'var(--text-muted)' }}>尚無作業，請點擊上方按鈕新增。</div>
        )}
        {homeworks.map(hw => {
          const stats = getStats(hw);
          return (
            <div key={hw.id} className="hw-card glass-card" onClick={() => setActiveHwId(hw.id)} style={{ cursor: 'pointer' }}>
              <div className="hw-card-header">
                <span className="hw-date">{hw.date}</span>
                {stats.completePercent === 100 && stats.total > 0 && <span className="hw-badge success">全數完成</span>}
              </div>
              
              <h3 className="hw-title">{hw.title}</h3>
              
              <div className="hw-progress-container">
                <div className="hw-progress-bar">
                  <div className="hw-progress-fill" style={{ width: `${stats.completePercent}%` }}></div>
                </div>
                <div className="hw-progress-text">
                  <span>完成 {stats.completePercent}%</span>
                  <span>共 {stats.total} 人</span>
                </div>
              </div>

              <div className="hw-status-grid">
                <div className="status-box box-0">
                  <span className="label">未繳交</span>
                  <span className="count">{stats[0]}</span>
                </div>
                <div className="status-box box-1">
                  <span className="label">已繳交</span>
                  <span className="count">{stats[1]}</span>
                </div>
                <div className="status-box box-2">
                  <span className="label">待訂正</span>
                  <span className="count">{stats[2]}</span>
                </div>
                <div className="status-box box-3">
                  <span className="label">已完成</span>
                  <span className="count">{stats[3]}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </MainContent>
  );
};

export default Homework;
