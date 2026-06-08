import React, { useState, useEffect } from 'react';
import MainContent from '../components/Layout/MainContent';
import { useClass } from '../context/ClassContext';
import './RandomTimer.css';

const RandomTimer = () => {
  const { currentClass, students } = useClass();
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [youtubeEnabled, setYoutubeEnabled] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState(() => {
    return localStorage.getItem('random_timer_youtube_url') || '';
  });
  const [isProjecting, setIsProjecting] = useState(false);
  
  // Picker State
  const [pickedStudent, setPickedStudent] = useState(null);
  const [pickerMode, setPickerMode] = useState('student'); // 'student' or 'group'
  const [noRepeat, setNoRepeat] = useState(false);
  const [pickedList, setPickedList] = useState([]);

  // Sync YouTube url to localStorage
  useEffect(() => {
    localStorage.setItem('random_timer_youtube_url', youtubeUrl);
  }, [youtubeUrl]);

  // Audio Synthesizer Beeps
  const playAlarmSound = () => {
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
        gain.gain.linearRampToValueAtTime(0.5, time + 0.05);
        gain.gain.setValueAtTime(0.5, time + duration - 0.05);
        gain.gain.linearRampToValueAtTime(0, time + duration);
        osc.start(time);
        osc.stop(time + duration);
      };
      playBeep(now, 0.3, 800);
      playBeep(now + 0.4, 0.3, 800);
      playBeep(now + 0.8, 0.6, 1000);
    } catch (e) {
      console.error(e);
    }
  };

  // Timer Logic
  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            setIsRunning(false);
            playAlarmSound();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const setTimer = (minutes) => {
    setTimeLeft(minutes * 60);
    setIsRunning(false);
  };

  const handleCustomTime = () => {
    const minsStr = prompt("請輸入自訂計時時間（單位：分鐘，例：8，或 分:秒，例：2:30）：", "5");
    if (!minsStr) return;
    
    if (minsStr.includes(':')) {
      const [m, s] = minsStr.split(':').map(Number);
      if (!isNaN(m) && !isNaN(s)) {
        setTimeLeft(m * 60 + s);
        setIsRunning(false);
      }
    } else {
      const m = parseInt(minsStr, 10);
      if (!isNaN(m) && m > 0) {
        setTimeLeft(m * 60);
        setIsRunning(false);
      }
    }
  };

  // YouTube Link Parser
  const getYoutubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Picker Logic
  const pickRandom = () => {
    if (students.length === 0) return;
    
    let available = students;
    
    if (pickerMode === 'student') {
      if (noRepeat) {
        available = students.filter(s => !pickedList.includes(s.id));
        if (available.length === 0) {
          alert("所有學生都已抽過！請重置名單。");
          return;
        }
      }
      
      const randomIndex = Math.floor(Math.random() * available.length);
      const selected = available[randomIndex];
      
      setPickedStudent(selected);
      if (noRepeat) {
        setPickedList(prev => [...prev, selected.id]);
      }
    } else {
      // Group picker mode
      const groupsCount = Math.max(1, Math.max(...students.map(s => s.groupId || 0)));
      if (groupsCount <= 1) {
        alert("目前沒有足夠的分組資料！請先至「分組模式」進行分組。");
        return;
      }
      const randomGroup = Math.floor(Math.random() * groupsCount) + 1;
      setPickedStudent({ name: `第 ${randomGroup} 組`, id: `G${randomGroup}` });
    }
  };

  const resetPicker = () => {
    setPickedStudent(null);
    setPickedList([]);
  };

  const ytVideoId = getYoutubeId(youtubeUrl);

  return (
    <MainContent 
      title="抽籤與課堂計時"
      subtitle="名單綁定目前班級，可直接用於點名、問答、分組前暖身與課堂倒數。"
      actions={<div className="class-badge-small">{currentClass.name} | {currentClass.totalStudents} 位學生</div>}
    >
      <div className="rt-container">
        {/* Timer Section */}
        <div className="rt-panel glass-card">
          <div className="rt-header">
            <span className="rt-tag">COUNTDOWN</span>
            <h3>課堂計時器</h3>
            <span className={`status-badge ${isRunning ? 'running' : ''}`}>
              {isRunning ? '計時中' : '待命'}
            </span>
          </div>

          <div className="timer-display">
            {formatTime(timeLeft)}
          </div>

          <div className="timer-quick-btns">
            <button className="btn btn-glass" onClick={() => setTimer(3)}>3分</button>
            <button className="btn btn-glass" onClick={() => setTimer(5)}>5分</button>
            <button className="btn btn-glass" onClick={() => setTimer(10)}>10分</button>
            <button className="btn btn-glass" onClick={() => setTimer(15)}>15分</button>
          </div>

          <div className="youtube-toggle-area glass-panel">
            <div className="yt-toggle-row">
              <div>
                <strong>YouTube 影片背景</strong>
                <p>開啟後投影時影片放大，倒數縮小</p>
              </div>
              <label className="switch">
                <input type="checkbox" checked={youtubeEnabled} onChange={() => setYoutubeEnabled(!youtubeEnabled)} />
                <span className="slider round"></span>
              </label>
            </div>
            {youtubeEnabled && (
              <input 
                type="text" 
                className="yt-input" 
                placeholder="貼上 youtube.com/watch?... 或 youtu.be/..." 
                value={youtubeUrl}
                onChange={e => setYoutubeUrl(e.target.value)}
              />
            )}
          </div>

          <div className="timer-actions">
            <button className="btn btn-accent" onClick={() => {
              if (timeLeft === 0) {
                setTimer(5); // default to 5 min if 0
              }
              setIsRunning(!isRunning);
            }}>
              {isRunning ? '暫停' : '開始'}
            </button>
            <button className="btn btn-glass" onClick={() => setIsProjecting(true)}>投影倒數</button>
            <button className="btn btn-glass" onClick={() => { setTimeLeft(0); setIsRunning(false); }}>重設</button>
            <button className="btn btn-glass" onClick={handleCustomTime}>自訂</button>
          </div>
        </div>

        {/* Random Picker Section */}
        <div className="rt-panel glass-card">
          <div className="rt-header">
            <span className="rt-tag">RANDOM PICKER</span>
            <h3>班級抽籤</h3>
            <span className="status-badge">{currentClass.totalStudents} 人</span>
          </div>

          <div className="picker-tabs">
            <button className={`picker-tab ${pickerMode === 'student' ? 'active' : ''}`} onClick={() => setPickerMode('student')}>學生抽籤</button>
            <button className={`picker-tab ${pickerMode === 'group' ? 'active' : ''}`} onClick={() => setPickerMode('group')}>分組抽籤</button>
          </div>

          {pickerMode === 'student' && (
            <div className="picker-settings">
              <div className="no-repeat-toggle">
                <div>
                  <strong>不重複抽籤</strong>
                  <p>每人限中一次 ({pickedList.length}/{students.length})</p>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={noRepeat} onChange={() => setNoRepeat(!noRepeat)} />
                  <span className="slider round"></span>
                </label>
              </div>
              <button className="btn btn-glass btn-small" onClick={() => setPickedList([])}>重置抽籤名單</button>
            </div>
          )}

          <div className="picker-display">
            <div className="picker-circle">
              {pickedStudent ? pickedStudent.name : '等待抽籤'}
            </div>
          </div>

          <div className="picker-source">
            <div className="source-label">名單來源</div>
            <h4>{currentClass.name}</h4>
          </div>

          <div className="picker-actions">
            <button className="btn btn-primary" onClick={pickRandom} style={{ flex: 2, backgroundColor: '#c0392b' }}>開始抽籤</button>
            <button className="btn btn-glass" onClick={resetPicker} style={{ flex: 1 }}>清除結果</button>
          </div>
        </div>
      </div>

      {/* Projection Mode Fullscreen Overlay */}
      {isProjecting && (
        <div className="timer-projection-overlay">
          {youtubeEnabled && ytVideoId ? (
            /* YouTube Large, Timer Small */
            <div className="projection-youtube-layout">
              <div className="youtube-player-area">
                <iframe 
                  width="100%" 
                  height="100%" 
                  src={`https://www.youtube.com/embed/${ytVideoId}?autoplay=1&mute=1&loop=1&playlist=${ytVideoId}`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              
              <div className="mini-timer-panel glass-card">
                <div className="mini-timer-digits">{formatTime(timeLeft)}</div>
                <div className="projection-controls">
                  <button className="proj-btn" onClick={() => setIsRunning(!isRunning)}>
                    {isRunning ? '⏸ 暫停' : '▶ 開始'}
                  </button>
                  <button className="proj-btn close-btn" onClick={() => setIsProjecting(false)}>
                    關閉投影
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Giant Timer Center */
            <div className="projection-timer-layout">
              <div className="giant-timer-digits">
                {formatTime(timeLeft)}
              </div>
              <div className="projection-timer-status">
                {isRunning ? '計時進行中' : '計時已暫停'}
              </div>
              
              <div className="projection-actions-bar">
                <button className="btn btn-large btn-glass" onClick={() => setTimer(3)}>3分</button>
                <button className="btn btn-large btn-glass" onClick={() => setTimer(5)}>5分</button>
                <button className="btn btn-large btn-glass" onClick={() => setTimer(10)}>10分</button>
                <button className="btn btn-large btn-glass" onClick={() => setIsRunning(!isRunning)}>
                  {isRunning ? '暫停' : '開始'}
                </button>
                <button className="btn btn-large btn-glass" onClick={() => setTimeLeft(0)}>重設</button>
                <button className="btn btn-large btn-accent close-btn" onClick={() => setIsProjecting(false)}>
                  關閉投影
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </MainContent>
  );
};

export default RandomTimer;
