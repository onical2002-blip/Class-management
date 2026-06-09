import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useClass } from '../../context/ClassContext';
import { Trash2, Plus, Users, Save, X } from 'lucide-react';
import './SettingsModal.css';

const SettingsModal = ({ onClose }) => {
  const { 
    currentClass, 
    setCurrentClass, 
    students, 
    setStudents,
    googleClientId,
    setGoogleClientId
  } = useClass();

  // Modal State
  const [className, setClassName] = useState(currentClass.name);
  const [clientIdInput, setClientIdInput] = useState(googleClientId);
  const [maxSeats, setMaxSeats] = useState(() => {
    if (students.length === 0) return 30;
    const maxId = Math.max(...students.map(s => s.id));
    const standardOptions = [20, 30, 35, 40, 45, 50];
    const matched = standardOptions.find(opt => opt >= maxId);
    return matched || 30;
  });
  
  // Local list of seats representing 1 to maxSeats
  const [seatConfig, setSeatConfig] = useState([]);

  // Batch import text state
  const [batchText, setBatchText] = useState('');

  // Resizable & Draggable state
  const [size, setSize] = useState({ width: 720, height: 600 });
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Initialize seat configurations from current students
  useEffect(() => {
    const config = [];
    for (let i = 1; i <= maxSeats; i++) {
      const existingStudent = students.find(s => s.id === i);
      config.push({
        id: i,
        active: !!existingStudent,
        name: existingStudent ? existingStudent.name : `${i}號`,
        points: existingStudent ? existingStudent.points : 0,
        groupId: existingStudent ? existingStudent.groupId : null,
      });
    }
    setSeatConfig(config);
  }, [maxSeats, students]);

  // Handle Seat toggle
  const toggleSeat = (id) => {
    setSeatConfig(prev => prev.map(seat => {
      if (seat.id === id) {
        return { ...seat, active: !seat.active };
      }
      return seat;
    }));
  };

  // Handle Seat Name change
  const handleNameChange = (id, newName) => {
    setSeatConfig(prev => prev.map(seat => {
      if (seat.id === id) {
        return { ...seat, name: newName };
      }
      return seat;
    }));
  };

  // Batch Import logic
  const handleBatchImport = () => {
    if (!batchText.trim()) {
      alert("請先輸入學生姓名名單！");
      return;
    }
    const names = batchText.trim().split(/[\s,，\n]+/).filter(Boolean);
    
    let updatedConfig = [...seatConfig];
    let activeSeatIndices = updatedConfig
      .map((seat, idx) => ({ seat, idx }))
      .filter(x => x.seat.active)
      .map(x => x.idx);

    if (names.length > activeSeatIndices.length) {
      const neededCount = names.length - activeSeatIndices.length;
      let activated = 0;
      for (let i = 0; i < updatedConfig.length; i++) {
        if (!updatedConfig[i].active) {
          updatedConfig[i].active = true;
          activated++;
          if (activated >= neededCount) break;
        }
      }
      activeSeatIndices = updatedConfig
        .map((seat, idx) => ({ seat, idx }))
        .filter(x => x.seat.active)
        .map(x => x.idx);
    }

    names.forEach((name, i) => {
      if (i < activeSeatIndices.length) {
        const targetIdx = activeSeatIndices[i];
        updatedConfig[targetIdx].name = name;
      }
    });

    setSeatConfig(updatedConfig);
    setBatchText('');
    alert(`已成功批次匯入 ${names.length} 位學生姓名！`);
  };

  // Export Data
  const handleExportData = () => {
    const backup = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key && (
          key.startsWith('class_') ||
          key.startsWith('blackboard_') ||
          key.startsWith('zhuyin_') ||
          key.startsWith('exam_') ||
          key.startsWith('random_')
        )
      ) {
        backup[key] = localStorage.getItem(key);
      }
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `classroom_hub_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import Data
  const handleImportData = (e) => {
    const fileReader = new FileReader();
    const file = e.target.files[0];
    if (!file) return;
    
    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (Object.keys(parsed).length === 0) {
          alert("備份檔案格式不正確或為空！");
          return;
        }
        if (window.confirm("匯入備份將會覆蓋目前的班級名單、加分紀錄、課表及黑板內容，確定要匯入嗎？")) {
          Object.keys(parsed).forEach(key => {
            localStorage.setItem(key, parsed[key]);
          });
          alert("匯入成功！即將自動重新整理網頁...");
          window.location.reload();
        }
      } catch (err) {
        alert("讀取備份檔案失敗: " + err.message);
      }
    };
    fileReader.readAsText(file);
  };

  // Save Settings
  const handleSave = () => {
    if (!className.trim()) {
      alert("請輸入班級名稱！");
      return;
    }

    const newStudents = seatConfig
      .filter(seat => seat.active)
      .map(seat => ({
        id: seat.id,
        name: seat.name.trim() || `${seat.id}號`,
        points: seat.points,
        groupId: seat.groupId,
      }));

    setStudents(newStudents);
    setGoogleClientId(clientIdInput.trim());
    setCurrentClass({
      name: className.trim(),
      totalStudents: newStudents.length,
      absentStudents: currentClass.absentStudents
    });

    onClose();
  };

  // Dragging logic for header
  const handleDragStart = (e) => {
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select') || e.target.closest('textarea')) return;
    
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = position.x;
    const initialY = position.y;

    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      setPosition({
        x: initialX + dx,
        y: initialY + dy
      });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Resizing logic for handle
  const handleResizeStart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = size.width;
    const startHeight = size.height;

    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      
      const minWidth = 450;
      const minHeight = 400;
      const maxWidth = window.innerWidth * 0.96;
      const maxHeight = window.innerHeight * 0.95;
      
      setSize({
        width: Math.min(maxWidth, Math.max(minWidth, startWidth + dx)),
        height: Math.min(maxHeight, Math.max(minHeight, startHeight + dy))
      });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return createPortal(
    <div className="modal-backdrop visible">
      <div 
        className="modal-card settings-modal-card"
        style={{
          width: `${size.width}px`,
          height: `${size.height}px`,
          transform: `translate(${position.x}px, ${position.y}px)`,
          position: 'relative'
        }}
      >
        {/* Header (Draggable) */}
        <div 
          className="settings-modal-header" 
          onMouseDown={handleDragStart}
          style={{ cursor: 'move', userSelect: 'none' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={20} color="var(--manager-accent)" />
            <h3>班級與學生名單設定</h3>
          </div>
          <button className="close-modal-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div className="settings-modal-body">
          {/* Class Info */}
          <div className="settings-section glass-panel">
            <h4>基本設定</h4>
            <div className="settings-row">
              <div className="field flex-1">
                <label>班級名稱</label>
                <input 
                  type="text" 
                  value={className} 
                  onChange={e => setClassName(e.target.value)} 
                  placeholder="例如：8年2班"
                />
              </div>
              <div className="field" style={{ width: '120px' }}>
                <label>座號範圍 (最大)</label>
                <select 
                  value={maxSeats} 
                  onChange={e => setMaxSeats(parseInt(e.target.value))}
                  className="max-seats-select"
                >
                  <option value="20">20 號</option>
                  <option value="30">30 號</option>
                  <option value="35">35 號</option>
                  <option value="40">40 號</option>
                  <option value="45">45 號</option>
                  <option value="50">50 號</option>
                </select>
              </div>
            </div>
            <div className="settings-row" style={{ marginTop: '12px' }}>
              <div className="field flex-1">
                <label>Google API Client ID (雲端同步專用)</label>
                <input 
                  type="text" 
                  value={clientIdInput} 
                  onChange={e => setClientIdInput(e.target.value)} 
                  placeholder="請填入您的 Google OAuth 用戶端 ID 以啟用 Google 雲端硬碟同步功能"
                />
              </div>
            </div>
          </div>

          {/* Data Backup */}
          <div className="settings-section glass-panel">
            <h4>資料備份與轉移 (跨電腦同步)</h4>
            <p className="section-desc" style={{ fontSize: '11px', color: 'var(--manager-muted)', marginBottom: '8px', lineHeight: '1.4' }}>
              若您想在別台電腦（例如學校與家裡）使用相同的班級名單、課表、分數與黑板內容，請點擊「匯出資料備份」存檔，並在另一台電腦的設定中點擊「匯入備份檔案」即可。
            </p>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button className="btn btn-glass btn-small" onClick={handleExportData}>
                📥 匯出資料備份
              </button>
              <label className="btn btn-glass btn-small" style={{ cursor: 'pointer', margin: 0, display: 'inline-flex', alignItems: 'center' }}>
                📤 匯入備份檔案
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleImportData} 
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>

          {/* Batch Import */}
          <div className="settings-section glass-panel">
            <h4>批次匯入學生姓名</h4>
            <div className="batch-import-area">
              <textarea 
                value={batchText}
                onChange={e => setBatchText(e.target.value)}
                placeholder="請貼上學生名單，姓名之間請用空格、逗號或換行分隔。例如：張小明 李小華 王大同..."
                className="batch-textarea"
              />
              <button 
                className="btn btn-accent btn-small"
                onClick={handleBatchImport}
                style={{ alignSelf: 'flex-end', marginTop: '8px' }}
              >
                批次套用姓名
              </button>
            </div>
          </div>

          {/* Seats Grid */}
          <div className="settings-section">
            <div className="section-header-row">
              <h4>座號名冊與啟用狀態</h4>
              <span className="subtitle-hint">勾選代表該座號有學生，可修改姓名；取消勾選則為空號。</span>
            </div>
            
            <div className="seats-grid-list">
              {seatConfig.map((seat) => (
                <div key={seat.id} className={`seat-editor-row ${seat.active ? 'active' : ''}`}>
                  <label className="checkbox-container">
                    <input 
                      type="checkbox" 
                      checked={seat.active} 
                      onChange={() => toggleSeat(seat.id)}
                    />
                    <span className="checkmark"></span>
                    <span className="seat-no">{seat.id} 號</span>
                  </label>
                  
                  <input 
                    type="text" 
                    value={seat.name}
                    onChange={(e) => handleNameChange(seat.id, e.target.value)}
                    disabled={!seat.active}
                    className="seat-name-input"
                    placeholder="未啟用"
                  />
                  
                  {seat.active && (
                    <button 
                      className="seat-delete-btn" 
                      onClick={() => toggleSeat(seat.id)}
                      title="停用此座號"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="settings-modal-footer">
          <div className="summary-info">
            啟用學生人數：<strong>{seatConfig.filter(s => s.active).length}</strong> 位
          </div>
          <div className="footer-btns">
            <button className="btn btn-outline" onClick={onClose}>
              取消
            </button>
            <button className="btn btn-primary btn-save" onClick={handleSave}>
              <Save size={16} /> 儲存設定
            </button>
          </div>
        </div>

        {/* Resize Handle */}
        <div className="modal-resize-handle" onMouseDown={handleResizeStart}></div>
      </div>
    </div>,
    document.body
  );
};

export default SettingsModal;
