import React, { useState, useEffect } from 'react';
import MainContent from '../components/Layout/MainContent';
import { useClass } from '../context/ClassContext';
import { Printer, RotateCcw, Edit, X, Check } from 'lucide-react';
import './ClassSchedule.css';

const PRESET_SUBJECTS = [
  '國語', '數學', '英語', '自然', '社會', 
  '體育', '音樂', '美術', '電腦', '健康', 
  '班會', '社團', '彈性', '閱讀', '本土語'
];

const WEEKDAYS = [
  { id: 1, name: '星期一' },
  { id: 2, name: '星期二' },
  { id: 3, name: '星期三' },
  { id: 4, name: '星期四' },
  { id: 5, name: '星期五' }
];

const PERIODS = [
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

const ClassSchedule = () => {
  const { currentClass } = useClass();
  
  // Stateful Periods
  const [periods, setPeriods] = useState(() => {
    const saved = localStorage.getItem('class_schedule_periods');
    if (saved) return JSON.parse(saved);
    return PERIODS;
  });

  const [schedule, setSchedule] = useState(() => {
    const saved = localStorage.getItem('class_schedule');
    if (saved) return JSON.parse(saved);
    
    // Default empty schedule
    const initial = {};
    WEEKDAYS.forEach(day => {
      periods.forEach(period => {
        if (period.isBreak) {
          initial[`${day.id}_${period.id}`] = period.name;
        } else {
          initial[`${day.id}_${period.id}`] = '';
        }
      });
    });
    return initial;
  });

  // Editor Modal States
  const [editingCell, setEditingCell] = useState(null); // { dayId, periodId, value }
  const [customSubject, setCustomSubject] = useState('');

  const [editingPeriod, setEditingPeriod] = useState(null); // { id, name, time }
  const [tempPeriodName, setTempPeriodName] = useState('');
  const [tempPeriodTime, setTempPeriodTime] = useState('');

  useEffect(() => {
    localStorage.setItem('class_schedule', JSON.stringify(schedule));
  }, [schedule]);

  useEffect(() => {
    localStorage.setItem('class_schedule_periods', JSON.stringify(periods));
  }, [periods]);

  const handleCellClick = (dayId, period) => {
    if (period.isBreak) return; // Do not edit lunch breaks
    const cellKey = `${dayId}_${period.id}`;
    setEditingCell({
      dayId,
      periodId: period.id,
      periodName: period.name,
      dayName: WEEKDAYS.find(w => w.id === dayId).name,
      value: schedule[cellKey] || ''
    });
    setCustomSubject('');
  };

  const handleSaveCell = (value) => {
    if (!editingCell) return;
    const cellKey = `${editingCell.dayId}_${editingCell.periodId}`;
    setSchedule(prev => ({
      ...prev,
      [cellKey]: value.trim()
    }));
    setEditingCell(null);
  };

  const handleIndexCellClick = (period) => {
    setEditingPeriod(period);
    setTempPeriodName(period.name);
    setTempPeriodTime(period.time);
  };

  const handleSavePeriod = () => {
    if (!tempPeriodName.trim()) {
      alert("節次名稱不能為空！");
      return;
    }
    setPeriods(prev => prev.map(p => p.id === editingPeriod.id ? { ...p, name: tempPeriodName.trim(), time: tempPeriodTime.trim() } : p));
    setEditingPeriod(null);
  };

  const handleClearSchedule = () => {
    if (window.confirm('確定要清空所有課表科目嗎？')) {
      const cleared = {};
      WEEKDAYS.forEach(day => {
        periods.forEach(period => {
          if (period.isBreak) {
            cleared[`${day.id}_${period.id}`] = period.name;
          } else {
            cleared[`${day.id}_${period.id}`] = '';
          }
        });
      });
      setSchedule(cleared);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <MainContent 
      title="班級課程表"
      subtitle="設定週一至週五的課表，點擊科目欄位填寫，或點擊左側「節次/時間」進行修改節次與時間。"
      actions={
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-glass" onClick={handlePrint}>
            <Printer size={16} /> 列印課表
          </button>
          <button className="btn btn-outline" onClick={handleClearSchedule}>
            <RotateCcw size={16} /> 重設課表
          </button>
        </div>
      }
    >
      <div className="schedule-board-wrapper">
        <div className="schedule-table-card glass-panel" id="schedule-print-area">
          <div className="schedule-header-info">
            <span className="info-tag">CLASS TIMETABLE</span>
            <h2>{currentClass.name} 班級課表</h2>
          </div>
          
          <div className="schedule-grid-table">
            {/* Header row */}
            <div className="schedule-row header-row">
              <div className="schedule-cell index-col">節次 / 時間</div>
              {WEEKDAYS.map(day => (
                <div key={day.id} className="schedule-cell day-col">{day.name}</div>
              ))}
            </div>

            {/* Time Slots rows */}
            {periods.map(period => (
              <div 
                key={period.id} 
                className={`schedule-row ${period.isBreak ? 'break-row' : 'period-row'}`}
              >
                <div 
                  className="schedule-cell index-col interactive"
                  onClick={() => handleIndexCellClick(period)}
                  style={{ cursor: 'pointer' }}
                  title="點擊編輯此節次與時間"
                >
                  <span className="p-name" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {period.name} <Edit size={11} style={{ opacity: 0.6 }} />
                  </span>
                  <span className="p-time">{period.time}</span>
                </div>
                
                {WEEKDAYS.map(day => {
                  const cellKey = `${day.id}_${period.id}`;
                  const subjectValue = schedule[cellKey] || '';
                  
                  return (
                    <div 
                      key={day.id}
                      className={`schedule-cell subject-col ${period.isBreak ? 'disabled' : 'interactive'} ${subjectValue ? 'filled' : 'empty'}`}
                      onClick={() => handleCellClick(day.id, period)}
                    >
                      <span className="subject-text">{subjectValue || (period.isBreak ? '' : '—')}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Cell Modal Overlay */}
      {editingCell && (
        <div className="modal-backdrop visible">
          <div className="modal-card schedule-edit-modal">
            <div className="modal-header-simple">
              <h3>填寫 {editingCell.dayName} · {editingCell.periodName}</h3>
              <button className="close-btn" onClick={() => setEditingCell(null)}>
                <X size={18} />
              </button>
            </div>
            
            <div className="modal-body-simple">
              {/* Presets List */}
              <div className="presets-section">
                <label className="section-label">常用科目快選</label>
                <div className="presets-grid">
                  {PRESET_SUBJECTS.map(subject => (
                    <button 
                      key={subject}
                      className={`preset-item-btn ${editingCell.value === subject ? 'active' : ''}`}
                      onClick={() => handleSaveCell(subject)}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Input */}
              <div className="custom-input-section">
                <label className="section-label">自訂科目名稱</label>
                <div className="input-group">
                  <input 
                    type="text" 
                    placeholder="請輸入其他科目 (例如：自修/彈性)"
                    value={customSubject !== '' ? customSubject : editingCell.value}
                    onChange={e => setCustomSubject(e.target.value)}
                    className="custom-subject-field"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        handleSaveCell(customSubject !== '' ? customSubject : editingCell.value);
                      }
                    }}
                  />
                  <button 
                    className="btn btn-accent btn-icon"
                    onClick={() => handleSaveCell(customSubject !== '' ? customSubject : editingCell.value)}
                  >
                    <Check size={18} /> 確定
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-footer-simple">
              <button 
                className="btn btn-outline" 
                onClick={() => handleSaveCell('')}
                style={{ color: '#e74c3c', borderColor: '#e74c3c' }}
              >
                清除此節課
              </button>
              <button className="btn btn-glass" onClick={() => setEditingCell(null)}>
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Period Modal Overlay */}
      {editingPeriod && (
        <div className="modal-backdrop visible">
          <div className="modal-card schedule-edit-modal">
            <div className="modal-header-simple">
              <h3>編輯節次與時間</h3>
              <button className="close-btn" onClick={() => setEditingPeriod(null)}>
                <X size={18} />
              </button>
            </div>
            
            <div className="modal-body-simple">
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="section-label">節次名稱</label>
                <input 
                  type="text" 
                  value={tempPeriodName}
                  onChange={e => setTempPeriodName(e.target.value)}
                  className="custom-subject-field"
                  placeholder="例如：第一節"
                />
              </div>
              
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px' }}>
                <label className="section-label">上課時間範圍</label>
                <input 
                  type="text" 
                  value={tempPeriodTime}
                  onChange={e => setTempPeriodTime(e.target.value)}
                  className="custom-subject-field"
                  placeholder="例如：08:45 - 09:25"
                />
              </div>
            </div>
            
            <div className="modal-footer-simple">
              <button className="btn btn-glass" onClick={() => setEditingPeriod(null)}>
                取消
              </button>
              <button className="btn btn-accent" onClick={handleSavePeriod}>
                儲存變更
              </button>
            </div>
          </div>
        </div>
      )}
    </MainContent>
  );
};

export default ClassSchedule;
