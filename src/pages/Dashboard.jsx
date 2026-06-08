import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainContent from '../components/Layout/MainContent';
import { useClass } from '../context/ClassContext';
import { ClipboardList, PlusCircle, CheckSquare, Users, Clock, Calendar } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentClass, students } = useClass();

  // Load Blackboard Content for Preview
  const [blackboardContent, setBlackboardContent] = useState('');
  useEffect(() => {
    const saved = localStorage.getItem('blackboard_content_contact');
    if (saved) {
      setBlackboardContent(saved);
    }
  }, []);

  // Load Schedule for Today
  const [schedule, setSchedule] = useState({});
  useEffect(() => {
    const saved = localStorage.getItem('class_schedule');
    if (saved) {
      setSchedule(JSON.parse(saved));
    }
  }, []);

  // Load Periods state dynamically
  const [periods, setPeriods] = useState(() => {
    const saved = localStorage.getItem('class_schedule_periods');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'morning', name: '晨會/晨讀', time: '08:00 - 08:40', isBreak: false },
      { id: '1', name: '第一節', time: '08:45 - 09:25', isBreak: false },
      { id: '2', name: '第二節', time: '09:35 - 10:15', isBreak: false },
      { id: '3', name: '第三節', time: '10:25 - 11:05', isBreak: false },
      { id: '4', name: '第四節', time: '11:15 - 11:55', isBreak: false },
      { id: 'noon', name: '午餐/午休', time: '12:00 - 13:10', isBreak: true },
      { id: '5', name: '第五節', time: '13:20 - 14:00', isBreak: false },
      { id: '6', name: '第六節', time: '14:10 - 14:50', isBreak: false },
      { id: '7', name: '第七節', time: '15:00 - 15:40', isBreak: false },
      { id: '8', name: '第八節', time: '15:50 - 16:30', isBreak: false },
    ];
  });

  // Calculate pending homeworks
  const [pendingHomeworkCount, setPendingHomeworkCount] = useState(0);
  useEffect(() => {
    const savedHws = localStorage.getItem('class_homeworks');
    if (savedHws) {
      const hws = JSON.parse(savedHws);
      if (hws.length > 0) {
        // Count unsubmitted (0) or correction-needed (2) across all active homeworks
        let count = 0;
        hws.forEach(hw => {
          Object.values(hw.statuses).forEach(status => {
            if (status === 0 || status === 2) {
              count++;
            }
          });
        });
        setPendingHomeworkCount(count);
      }
    }
  }, []);

  // Grouping status
  const unassignedStudents = students.filter(s => s.groupId === null);
  const isGrouped = students.length > 0 && unassignedStudents.length < students.length;

  const fastAccessCards = [
    { title: '班級黑板', desc: '寫聯絡簿、課堂代辦，適合投影到教室前方。', icon: ClipboardList, path: '/blackboard', color: '#3498db', bg: '#ecf6fd' },
    { title: '班級課表', desc: '規劃課堂科目，可即時高亮當前上課節次。', icon: Calendar, path: '/schedule', color: '#8e44ad', bg: '#f5eff8' },
    { title: '加分系統', desc: '幫學生或小組加分，快速累積平時表現。', icon: PlusCircle, path: '/points', color: '#e74c3c', bg: '#fdf0ed' },
    { title: '作業訂正', desc: '看誰未交、誰要訂正、誰已經完成。', icon: CheckSquare, path: '/homework', color: '#9b59b6', bg: '#f5eff8' },
    { title: '分組模式', desc: '整理座號與小組，臨時活動也能快速分組。', icon: Users, path: '/group', color: '#2ecc71', bg: '#eafaf1' },
  ];

  // Dynamic Date string for banner
  const getBannerDate = () => {
    const d = new Date();
    const month = d.getMonth() + 1;
    const dateVal = d.getDate();
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    return `${month}月${dateVal}日 ${weekdays[d.getDay()]}`;
  };

  // Get current weekday dayId for timetable (1-5, defaults to 1 on weekends)
  const getTodayDayId = () => {
    const today = new Date().getDay();
    return today === 0 || today === 6 ? 1 : today;
  };

  const getWeekdayName = (id) => {
    const names = { 1: '星期一', 2: '星期二', 3: '星期三', 4: '星期四', 5: '星期五' };
    return names[id] || '星期一';
  };

  // Determine active period ID based on current hour/minute dynamically comparing to periods time range
  const getCurrentPeriodId = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const timeVal = hours * 60 + minutes;

    for (let p of periods) {
      if (!p.time || !p.time.includes('-')) continue;
      const [startStr, endStr] = p.time.split('-').map(s => s.trim());
      const [sh, sm] = startStr.split(':').map(Number);
      const [eh, em] = endStr.split(':').map(Number);
      
      if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) continue;
      const startTimeVal = sh * 60 + sm;
      const endTimeVal = eh * 60 + em;
      
      if (timeVal >= startTimeVal && timeVal < endTimeVal) {
        return p.id;
      }
    }
    return null;
  };

  const blackboardLines = blackboardContent.trim() ? blackboardContent.split('\n') : [];
  const currentPeriodId = getCurrentPeriodId();
  const todayDayId = getTodayDayId();
  const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6;

  return (
    <MainContent 
      title="今天要做什麼？" 
      subtitle="先確認左側目前班級，再從下方大按鈕進入黑板、加分、作業、分組或考試計時。"
      className="pokemon-theme"
    >
      <div className="dashboard-banner glass-panel">
        <div className="banner-content">
          <div className="banner-date">{getBannerDate()}</div>
          <h2>{currentClass.name}</h2>
          <p>這裡只放每天最常用的入口與提醒。要換班級，請點左側目前班級。</p>
          <div className="banner-actions">
            <button className="btn btn-accent" onClick={() => navigate('/blackboard')}>開黑板</button>
            <button className="btn btn-glass" onClick={() => navigate('/homework')}>查作業</button>
            <button className="btn btn-glass" onClick={() => navigate('/random-timer')}>抽籤/倒數</button>
          </div>
        </div>
      </div>

      <div className="dashboard-widgets">
        {/* Reminders widget */}
        <div className="widget-card glass-card">
          <div className="widget-header">
            <span className="widget-tag">TODAY</span>
            <h3>待處理提醒</h3>
          </div>
          <div className="reminder-list">
            <div className="reminder-item">
              <span>今日黑板{blackboardLines.length > 0 ? '已填寫' : '尚未填寫'}</span>
              <span className={`badge ${blackboardLines.length > 0 ? 'badge-success' : 'badge-warning'}`}>
                {blackboardLines.length > 0 ? '已完成' : '待填寫'}
              </span>
            </div>
            <div className="reminder-item">
              <span>作業待處理</span>
              <span className={`badge ${pendingHomeworkCount > 0 ? 'badge-warning' : 'badge-success'}`}>
                {pendingHomeworkCount} 人次
              </span>
            </div>
            <div className="reminder-item">
              <span>分組狀態</span>
              <span className={`badge ${isGrouped ? 'badge-success' : 'badge-info'}`}>
                {isGrouped ? '已分組' : '未分組'}
              </span>
            </div>
          </div>
        </div>

        {/* Timetable widget */}
        <div className="widget-card glass-card">
          <div className="widget-header">
            <span className="widget-tag">TIMETABLE</span>
            <h3>今日課表 ({getWeekdayName(todayDayId)})</h3>
            <button className="btn btn-outline" style={{ marginLeft: 'auto', padding: '4px 12px' }} onClick={() => navigate('/schedule')}>
              設定
            </button>
          </div>
          <div className="dashboard-schedule-preview">
            {periods.map(period => {
              const cellKey = `${todayDayId}_${period.id}`;
              const subject = schedule[cellKey] || '—';
              const isActive = period.id === currentPeriodId && !isWeekend;
              const displayTime = period.time.split('-')[0]?.trim() || '';
              
              return (
                <div key={period.id} className={`schedule-preview-row ${isActive ? 'active' : ''}`}>
                  <span className="p-time">{displayTime}</span>
                  <span className="p-name">{period.name}</span>
                  <span className="p-subject">{subject}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Blackboard Preview widget */}
        <div className="widget-card glass-card">
          <div className="widget-header">
            <span className="widget-tag">BLACKBOARD</span>
            <h3>今日黑板預覽</h3>
            <button className="btn btn-outline" style={{ marginLeft: 'auto', padding: '4px 12px' }} onClick={() => navigate('/blackboard')}>
              {blackboardLines.length > 0 ? '查看' : '填寫'}
            </button>
          </div>
          {blackboardLines.length > 0 ? (
            <div className="dashboard-blackboard-preview">
              <ul className="preview-list">
                {blackboardLines.map((line, idx) => (
                  <li key={idx}><strong>{line}</strong></li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="blackboard-preview empty">
              今天還沒有聯絡簿內容。
            </div>
          )}
        </div>
      </div>

      <div className="fast-access-grid">
        {fastAccessCards.map((card, idx) => (
          <div key={idx} className="access-card glass-card" onClick={() => navigate(card.path)}>
            <div className="access-icon" style={{ backgroundColor: card.bg, color: card.color }}>
              <card.icon size={24} />
            </div>
            <h4>{card.title}</h4>
            <p>{card.desc}</p>
          </div>
        ))}
      </div>
    </MainContent>
  );
};

export default Dashboard;
