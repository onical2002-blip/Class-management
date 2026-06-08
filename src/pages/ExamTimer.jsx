import React, { useState, useEffect } from 'react';
import MainContent from '../components/Layout/MainContent';
import { useClass } from '../context/ClassContext';
import './ExamTimer.css';

const ExamTimer = () => {
  const { currentClass } = useClass();
  const [examMode, setExamMode] = useState(true); // true = Exam Mode, false = Class Mode
  const [expected, setExpected] = useState(() => {
    return parseInt(localStorage.getItem('exam_expected') || currentClass.totalStudents) || 29;
  });
  const [actual, setActual] = useState(() => {
    return parseInt(localStorage.getItem('exam_actual') || currentClass.totalStudents) || 29;
  });

  // Schedule form state
  const [examContent, setExamContent] = useState('');
  const [startTime, setStartTime] = useState('15:15');
  const [endTime, setEndTime] = useState('15:55');
  const [selectedPeriod, setSelectedPeriod] = useState('');

  // Stateful periods from localStorage
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

  const handlePeriodSelect = (periodId) => {
    setSelectedPeriod(periodId);
    if (!periodId) return;
    const period = periods.find(p => p.id === periodId);
    if (period && period.time && period.time.includes('-')) {
      const [start, end] = period.time.split('-').map(s => s.trim());
      const formatTime = (t) => {
        const parts = t.split(':');
        if (parts.length === 2) {
          return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
        }
        return t;
      };
      setStartTime(formatTime(start));
      setEndTime(formatTime(end));
    }
  };

  // Reminders state
  const [reminders, setReminders] = useState(() => {
    return localStorage.getItem('exam_reminders') || '1. 先寫班級、姓名、座號\n2. 答案卡畫記要清晰\n3. 最後五分鐘仔細檢查，不要提早交卷。';
  });

  // Schedules list
  const [schedules, setSchedules] = useState(() => {
    const saved = localStorage.getItem('exam_schedules');
    return saved ? JSON.parse(saved) : [];
  });

  // History logs
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('exam_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Active dashboard state
  const [isActiveRunning, setIsActiveRunning] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Simple countdown timer for Class Time Mode
  const [classTimeLeft, setClassTimeLeft] = useState(600); // 10 mins
  const [classTimeRunning, setClassTimeRunning] = useState(false);

  // Sync state
  useEffect(() => {
    localStorage.setItem('exam_expected', expected);
  }, [expected]);

  useEffect(() => {
    localStorage.setItem('exam_actual', actual);
  }, [actual]);

  useEffect(() => {
    localStorage.setItem('exam_reminders', reminders);
  }, [reminders]);

  useEffect(() => {
    localStorage.setItem('exam_schedules', JSON.stringify(schedules));
  }, [schedules]);

  useEffect(() => {
    localStorage.setItem('exam_history', JSON.stringify(history));
  }, [history]);

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Class Time Mode simple timer tick
  useEffect(() => {
    let interval = null;
    if (classTimeRunning && classTimeLeft > 0) {
      interval = setInterval(() => {
        setClassTimeLeft(t => {
          if (t <= 1) {
            setClassTimeRunning(false);
            playBeeps();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [classTimeRunning, classTimeLeft]);

  // Audio synthesize utility
  const playBeeps = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const now = audioCtx.currentTime;
      const playBeep = (time, duration, freq) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.4, time + 0.05);
        gain.gain.setValueAtTime(0.4, time + duration - 0.05);
        gain.gain.linearRampToValueAtTime(0, time + duration);
        osc.start(time);
        osc.stop(time + duration);
      };
      playBeep(now, 0.25, 600);
      playBeep(now + 0.3, 0.25, 600);
      playBeep(now + 0.6, 0.5, 800);
    } catch(e) {
      console.error(e);
    }
  };

  // Time conversion helpers
  const timeToSeconds = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 3600 + m * 60;
  };

  const secondsToTimeString = (secs) => {
    const h = Math.floor(secs / 3600).toString().padStart(2, '0');
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const getSystemSeconds = (d) => {
    return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
  };

  // Add Exam Schedule
  const handleAddSchedule = () => {
    if (!examContent.trim()) {
      alert("請輸入考試內容！");
      return;
    }
    const newSchedule = {
      id: Date.now(),
      content: examContent.trim(),
      startTime,
      endTime,
    };
    setSchedules(prev => [...prev, newSchedule].sort((a, b) => {
      return timeToSeconds(a.startTime) - timeToSeconds(b.startTime);
    }));
    setExamContent('');
    setSelectedPeriod('');
  };

  // Clear schedules
  const handleClearSchedules = () => {
    if (window.confirm("確定清空所有考試時程？")) {
      setSchedules([]);
    }
  };

  // Clear history
  const handleClearHistory = () => {
    setHistory([]);
  };

  // Get active exam details based on system clock
  const getExamDetails = () => {
    const nowSecs = getSystemSeconds(currentTime);
    
    // Find if there is an ongoing exam
    const ongoing = schedules.find(s => {
      const start = timeToSeconds(s.startTime);
      const end = timeToSeconds(s.endTime);
      return nowSecs >= start && nowSecs < end;
    });

    if (ongoing) {
      const start = timeToSeconds(ongoing.startTime);
      const end = timeToSeconds(ongoing.endTime);
      const total = end - start;
      const elapsed = nowSecs - start;
      const remaining = end - nowSecs;
      const progress = Math.min(100, Math.max(0, (elapsed / total) * 100));

      return {
        state: 'ongoing',
        title: ongoing.content,
        startTime: ongoing.startTime,
        endTime: ongoing.endTime,
        timeLeftStr: secondsToTimeString(remaining),
        remainingSecs: remaining,
        progress,
      };
    }

    // Find if there is an upcoming exam
    const upcoming = schedules.find(s => {
      const start = timeToSeconds(s.startTime);
      return nowSecs < start;
    });

    if (upcoming) {
      const start = timeToSeconds(upcoming.startTime);
      const remaining = start - nowSecs;
      return {
        state: 'upcoming',
        title: upcoming.content,
        startTime: upcoming.startTime,
        timeLeftStr: secondsToTimeString(remaining),
        remainingSecs: remaining,
      };
    }

    return {
      state: 'finished',
      title: '所有考試已結束',
    };
  };

  // Monitor exams to add history or ring
  const details = getExamDetails();
  const [lastExamState, setLastExamState] = useState(details.state);
  const [lastExamTitle, setLastExamTitle] = useState(details.title);

  useEffect(() => {
    if (isActiveRunning) {
      // Alarm when transition to finished
      if (details.state === 'finished' && lastExamState === 'ongoing') {
        playBeeps();
        // Add to history
        const log = {
          id: Date.now(),
          time: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
          event: `考試結束：${lastExamTitle}`,
        };
        setHistory(prev => [log, ...prev]);
      }
      
      // Alarm when transition to ongoing
      if (details.state === 'ongoing' && lastExamState === 'upcoming') {
        playBeeps();
        const log = {
          id: Date.now(),
          time: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
          event: `考試開始：${details.title}`,
        };
        setHistory(prev => [log, ...prev]);
      }

      setLastExamState(details.state);
      setLastExamTitle(details.title);
    }
  }, [details.state, details.title, isActiveRunning]);

  // Format simple countdown time
  const formatSimpleTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Active dashboard rendering
  if (isActiveRunning) {
    return (
      <MainContent 
        title="段考桌面模式進行中"
        subtitle="螢幕已鎖定在考試介面，系統將自動比對時間推演考程並於鈴響警示。"
        actions={
          <button className="btn btn-outline" onClick={() => setIsActiveRunning(false)}>
            返回考程設定
          </button>
        }
      >
        <div className="active-dashboard-grid">
          {/* Main Display Box */}
          <div className="et-giant-card glass-card">
            <div className="active-header">
              <span className="exam-status-pill">{details.state === 'ongoing' ? '考試中' : details.state === 'upcoming' ? '即將開始' : '已結束'}</span>
              <div className="clock-large">
                目前時間：<strong>{currentTime.toLocaleTimeString('zh-TW', { hour12: false })}</strong>
              </div>
            </div>

            <div className="exam-main-title">
              {details.title}
            </div>

            {details.state !== 'finished' && (
              <>
                <div className="giant-timer-label">
                  {details.state === 'ongoing' ? '剩餘時間' : '距離開始還有'}
                </div>
                <div className="giant-timer-display">
                  {details.timeLeftStr}
                </div>
              </>
            )}

            {details.state === 'ongoing' && (
              <div className="progress-container">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${details.progress}%` }}></div>
                </div>
                <div className="progress-percentage">
                  考程進度 {Math.round(details.progress)}% | {details.startTime} ~ {details.endTime}
                </div>
              </div>
            )}
          </div>

          {/* Right Column details */}
          <div className="active-sidebar-panel">
            {/* Attendance display */}
            <div className="et-card glass-card attendance-status">
              <h3>應考狀態</h3>
              <div className="active-stat-row">
                <div className="active-stat"><strong>{expected}</strong><span>應到</span></div>
                <div className="active-stat"><strong>{actual}</strong><span>實到</span></div>
                <div className="active-stat danger"><strong>{expected - actual}</strong><span>缺席</span></div>
              </div>
            </div>

            {/* Reminders Card */}
            <div className="et-card glass-card reminders-chalk">
              <h3>考試小叮嚀</h3>
              <div className="reminders-text">
                {reminders}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Overview Lists */}
        <div className="active-bottom-bar">
          <div className="active-list glass-card">
            <h4>今日考程表</h4>
            <div className="schedules-mini-list">
              {schedules.map((s) => {
                const nowSecs = getSystemSeconds(currentTime);
                const isPast = nowSecs >= timeToSeconds(s.endTime);
                const isActive = nowSecs >= timeToSeconds(s.startTime) && nowSecs < timeToSeconds(s.endTime);
                return (
                  <div key={s.id} className={`schedule-mini-item ${isPast ? 'past' : ''} ${isActive ? 'active' : ''}`}>
                    <span className="time">{s.startTime} - {s.endTime}</span>
                    <span className="title">{s.content}</span>
                    <span className="status">{isPast ? '已結束' : isActive ? '進行中' : '即將進行'}</span>
                  </div>
                );
              })}
              {schedules.length === 0 && <p>未設定考程</p>}
            </div>
          </div>

          <div className="active-list glass-card">
            <h4>考程事件日誌</h4>
            <div className="logs-mini-list">
              {history.map((log) => (
                <div key={log.id} className="log-mini-item">
                  <span className="log-time">[{log.time}]</span>
                  <span className="log-event">{log.event}</span>
                </div>
              ))}
              {history.length === 0 && <p className="empty-text">無考程紀錄</p>}
            </div>
          </div>
        </div>
      </MainContent>
    );
  }

  // Setup Form View
  return (
    <MainContent 
      title="考試與段考計時"
      subtitle="段考模式與課堂時間模式已整合在班級工作台內，切換功能不會開啟新分頁。"
      actions={
        <div className="mode-toggle">
          <button 
            className={`mode-btn ${examMode ? 'active' : ''}`} 
            onClick={() => setExamMode(true)}
          >
            段考模式
          </button>
          <button 
            className={`mode-btn ${!examMode ? 'active' : ''}`} 
            onClick={() => setExamMode(false)}
          >
            課堂時間模式
          </button>
        </div>
      }
    >
      {examMode ? (
        /* ==================== Exam Mode ==================== */
        <div className="exam-setup-container">
          <div className="et-top-row">
            {/* Attendance Card */}
            <div className="et-card glass-card attendance-card">
              <div className="card-header">
                <span className="card-tag">ATTENDANCE</span>
                <h3>今日出缺席</h3>
              </div>
              <div className="attendance-inputs">
                <div className="input-group">
                  <label>應到</label>
                  <input 
                    type="number" 
                    value={expected} 
                    onChange={e => setExpected(Math.max(0, parseInt(e.target.value) || 0))} 
                  />
                </div>
                <div className="input-group">
                  <label>實到</label>
                  <input 
                    type="number" 
                    value={actual} 
                    onChange={e => setActual(Math.max(0, parseInt(e.target.value) || 0))} 
                  />
                </div>
              </div>
              <button 
                className="btn btn-primary btn-full-width start-exam-btn"
                onClick={() => {
                  if (schedules.length === 0) {
                    alert("請先新增至少一個考程時程！");
                    return;
                  }
                  setIsActiveRunning(true);
                }}
              >
                一鍵開啟段考模式
              </button>
            </div>

            {/* Schedule Setup Card */}
            <div className="et-card glass-card schedule-card">
              <div className="card-header">
                <span className="card-tag">SCHEDULE SETUP</span>
                <h3>新增考程</h3>
              </div>
              
              <div className="form-group">
                <label>考試內容</label>
                <input 
                  type="text" 
                  placeholder="例如：數學第一單元" 
                  value={examContent}
                  onChange={e => setExamContent(e.target.value)}
                  className="et-input" 
                />
              </div>

              <div className="form-group">
                <label>選擇課表節次 (自動帶入時間)</label>
                <select 
                  className="et-input"
                  value={selectedPeriod}
                  onChange={e => handlePeriodSelect(e.target.value)}
                >
                  <option value="" disabled hidden>-- 選擇節次 --</option>
                  {periods.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.time})
                    </option>
                  ))}
                </select>
              </div>

              <div className="time-inputs-row">
                <div className="form-group">
                  <label>開始</label>
                  <input 
                    type="time" 
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="et-input time-input" 
                  />
                </div>
                <div className="form-group">
                  <label>結束</label>
                  <input 
                    type="time" 
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="et-input time-input" 
                  />
                </div>
              </div>

              <button className="btn btn-accent add-schedule-btn" onClick={handleAddSchedule}>
                新增考程
              </button>
            </div>

            {/* Reminder Card */}
            <div className="et-card glass-card reminder-card">
              <div className="card-header">
                <span className="card-tag">REMINDER</span>
                <h3>考試小叮嚀</h3>
              </div>
              <textarea 
                className="et-textarea" 
                placeholder="例如：先寫姓名、答案卡畫記清楚、最後五分鐘檢查。"
                value={reminders}
                onChange={e => setReminders(e.target.value)}
              ></textarea>
            </div>
          </div>

          <div className="et-bottom-lists">
            {/* Exam Schedule List */}
            <div className="et-list-card glass-card">
              <div className="list-header">
                <h3>考試時程</h3>
                <button className="btn btn-outline btn-small round-btn" onClick={handleClearSchedules}>
                  清空
                </button>
              </div>
              {schedules.length === 0 ? (
                <div className="empty-state">
                  <h4>尚未建立考程</h4>
                  <p>新增至少一個考程後即可啟動段考模式。</p>
                </div>
              ) : (
                <div className="schedules-table-container">
                  <table className="schedules-table">
                    <thead>
                      <tr>
                        <th>考程編號</th>
                        <th>考試內容</th>
                        <th>開始時間</th>
                        <th>結束時間</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedules.map((s, idx) => (
                        <tr key={s.id}>
                          <td>{idx + 1}</td>
                          <td><strong>{s.content}</strong></td>
                          <td>{s.startTime}</td>
                          <td>{s.endTime}</td>
                          <td>
                            <button 
                              className="btn btn-small btn-outline btn-danger-hover"
                              onClick={() => setSchedules(prev => prev.filter(x => x.id !== s.id))}
                            >
                              刪除
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Usage History */}
            <div className="et-list-card glass-card">
              <div className="list-header">
                <h3>使用紀錄</h3>
                <button className="btn btn-outline btn-small round-btn" onClick={handleClearHistory}>
                  清除
                </button>
              </div>
              {history.length === 0 ? (
                <div className="empty-state-small">尚無紀錄</div>
              ) : (
                <div className="history-logs-container">
                  {history.map((log) => (
                    <div key={log.id} className="history-log-item">
                      <span className="time">{log.time}</span>
                      <span className="event">{log.event}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ==================== Class Time Mode ==================== */
        <div className="class-timer-container glass-card">
          <div className="class-timer-header">
            <span className="card-tag">CLASS TIME COUNTDOWN</span>
            <h3>課堂自訂倒數</h3>
          </div>
          
          <div className="class-timer-display-box">
            <div className="class-timer-digits">
              {formatSimpleTime(classTimeLeft)}
            </div>
            
            <div className="class-timer-adjust-btns">
              <button className="btn btn-glass" onClick={() => setClassTimeLeft(prev => Math.max(0, prev - 60))}>- 1分</button>
              <button className="btn btn-glass" onClick={() => setClassTimeLeft(prev => prev + 60)}>+ 1分</button>
              <button className="btn btn-glass" onClick={() => setClassTimeLeft(prev => Math.max(0, prev - 10))}>- 10秒</button>
              <button className="btn btn-glass" onClick={() => setClassTimeLeft(prev => prev + 10)}>+ 10秒</button>
            </div>
          </div>

          <div className="class-timer-controls">
            <button 
              className={`btn btn-large ${classTimeRunning ? 'btn-accent' : 'btn-primary'}`} 
              onClick={() => setClassTimeRunning(!classTimeRunning)}
            >
              {classTimeRunning ? '暫停計時' : '開始倒數'}
            </button>
            <button 
              className="btn btn-large btn-glass" 
              onClick={() => { setClassTimeLeft(600); setClassTimeRunning(false); }}
            >
              重置 (10分)
            </button>
          </div>
        </div>
      )}
    </MainContent>
  );
};

export default ExamTimer;
