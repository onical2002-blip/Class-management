import React, { useState, useEffect, useRef } from 'react';
import MainContent from '../components/Layout/MainContent';
import { useClass } from '../context/ClassContext';
import { parseLineToZhuyin, getZhuyinForChar } from '../utils/zhuyin';
import './Blackboard.css';

const Blackboard = () => {
  const { students } = useClass();

  // Tab State
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('blackboard_active_tab') || 'contact';
  });

  // Date State
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // Zhuyin State
  const [zhuyinEnabled, setZhuyinEnabled] = useState(() => {
    const saved = localStorage.getItem('blackboard_zhuyin_enabled');
    return saved !== 'false';
  });

  // Duty State
  const [dutyCount, setDutyCount] = useState(2);
  const [duty1, setDuty1] = useState(() => localStorage.getItem('blackboard_duty1') || '1');
  const [duty2, setDuty2] = useState(() => localStorage.getItem('blackboard_duty2') || '2');

  // Content State
  const [contactContent, setContactContent] = useState(() => {
    return localStorage.getItem('blackboard_content_contact') || '一、國語第八課生字\n二、數學習作4-1\n三、明天穿運動服';
  });
  const [todoContent, setTodoContent] = useState(() => {
    return localStorage.getItem('blackboard_content_todo') || '1. 訂正國語五題\n2. 訂正數學隨堂\n3. 準備明天游泳用具';
  });

  // Layout Controls State
  const [layoutEnabled, setLayoutEnabled] = useState(true);
  const [chineseSize, setChineseSize] = useState(26);
  const [lineSpacing, setLineSpacing] = useState(1.55);
  const [columnGap, setColumnGap] = useState(18);
  const [zhuyinSize, setZhuyinSize] = useState(9);
  const [zhuyinSpacing, setZhuyinSpacing] = useState(1.10);
  const [zhuyinSqueeze, setZhuyinSqueeze] = useState(0.10);
  const [fullscreenChineseSize, setFullscreenChineseSize] = useState(() => {
    const saved = localStorage.getItem('blackboard_fullscreen_chinese_size');
    return saved ? parseInt(saved, 10) : 120;
  });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Zhuyin Correction Modal
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [zhuyinOverrides, setZhuyinOverrides] = useState(() => {
    const saved = localStorage.getItem('zhuyin_overrides');
    return saved ? JSON.parse(saved) : {};
  });

  // Board Resolution State
  const boardRef = useRef(null);
  const [boardResolution, setBoardResolution] = useState({ width: 821, height: 450 });

  // Persist State
  useEffect(() => {
    localStorage.setItem('blackboard_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('blackboard_zhuyin_enabled', zhuyinEnabled);
  }, [zhuyinEnabled]);

  useEffect(() => {
    localStorage.setItem('blackboard_duty1', duty1);
  }, [duty1]);

  useEffect(() => {
    localStorage.setItem('blackboard_duty2', duty2);
  }, [duty2]);

  useEffect(() => {
    localStorage.setItem('blackboard_content_contact', contactContent);
  }, [contactContent]);

  useEffect(() => {
    localStorage.setItem('blackboard_content_todo', todoContent);
  }, [todoContent]);

  useEffect(() => {
    localStorage.setItem('zhuyin_overrides', JSON.stringify(zhuyinOverrides));
  }, [zhuyinOverrides]);

  useEffect(() => {
    localStorage.setItem('blackboard_fullscreen_chinese_size', fullscreenChineseSize);
  }, [fullscreenChineseSize]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Track board size
  useEffect(() => {
    if (!boardRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setBoardResolution({
          width: Math.round(entry.contentRect.width),
          height: Math.round(entry.contentRect.height),
        });
      }
    });
    resizeObserver.observe(boardRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Handlers
  const handlePrevDate = () => {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    setDate(d.toISOString().split('T')[0]);
  };

  const handleNextDate = () => {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    setDate(d.toISOString().split('T')[0]);
  };

  const resetLayoutDefaults = () => {
    setChineseSize(26);
    setLineSpacing(1.55);
    setColumnGap(18);
    setZhuyinSize(9);
    setZhuyinSpacing(1.10);
    setZhuyinSqueeze(0.10);
    setFullscreenChineseSize(120);
  };

  // Chinese formatted date with weekday
  const formatChineseDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const dateVal = d.getDate();
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const weekday = weekdays[d.getDay()];
    return `${year} 年 ${month} 月 ${dateVal} 日 (${weekday})`;
  };

  // Convert date to vertical string, e.g. "六月七日星期日"
  const getVerticalDateString = (dateStr) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const months = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
    const days = [
      '一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
      '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
      '二十一', '二十二', '二十三', '二十四', '二十五', '二十六', '二十seven', '二十八', '二十九', '三十', '三十一'
    ];
    // Fix typo in "二十seven" -> "二十七"
    days[26] = '二十七';
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    
    const mStr = months[d.getMonth()] + '月';
    const dStr = days[d.getDate() - 1] + '日';
    const wStr = weekdays[d.getDay()];
    
    return mStr + dStr + wStr;
  };

  const getStudentName = (seatNo) => {
    const s = students.find(x => x.id === parseInt(seatNo));
    return s ? s.name : seatNo ? `${seatNo}號` : '—';
  };

  const getDutyDisplayName = (seatNo) => {
    if (!seatNo) return '—';
    const clean = seatNo.toString().trim();
    if (!clean) return '—';
    if (clean.endsWith('號')) {
      return clean;
    }
    return `${clean}號`;
  };

  const renderUprightDigits = (text) => {
    if (!text) return '—';
    const regex = /(\d+)/g;
    const parts = text.split(regex);
    return parts.map((part, index) => {
      if (/^\d+$/.test(part)) {
        return (
          <span key={index} className="upright-digit" style={{ writingMode: 'horizontal-tb', display: 'inline-block' }}>
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // Fullscreen toggle
  const handleFullscreen = () => {
    const board = document.getElementById('chalkboard-element');
    if (board) {
      if (!document.fullscreenElement) {
        board.requestFullscreen().catch(err => {
          alert(`無法切換全螢幕: ${err.message}`);
        });
      } else {
        document.exitFullscreen();
      }
    }
  };

  // Current Content
  const currentContent = activeTab === 'contact' ? contactContent : todoContent;
  const setCurrentContent = activeTab === 'contact' ? setContactContent : setTodoContent;

  // Process text columns
  const dateLine = getVerticalDateString(date);
  const parsedDateColumn = parseLineToZhuyin(dateLine);
  
  const contentLines = currentContent.split('\n');
  const parsedContentColumns = contentLines.map(line => parseLineToZhuyin(line));

  // Get all unique Chinese characters in current text to show in Correction Modal
  const getUniqueChineseChars = () => {
    const chars = new Set();
    const allText = dateLine + currentContent;
    for (let char of allText) {
      if (/[\u4e00-\u9fa5]/.test(char)) {
        chars.add(char);
      }
    }
    return Array.from(chars);
  };

  // Render a character element
  const renderChar = (item, idx) => {
    if (item.type === 'horizontal') {
      return (
        <span key={idx} className="char-item horizontal-text">
          {item.text}
        </span>
      );
    }
    
    if (item.type === 'chinese') {
      const displayZhuyin = zhuyinOverrides[item.char] !== undefined 
        ? zhuyinOverrides[item.char] 
        : item.zhuyin;

      return (
        <ruby key={idx} className="char-item ruby-char">
          {item.char}
          {zhuyinEnabled && displayZhuyin && (
            <rt>{displayZhuyin}</rt>
          )}
        </ruby>
      );
    }
    
    // Spaces or punctuation
    return (
      <span key={idx} className="char-item punctuation-char">
        {item.char}
      </span>
    );
  };

  // Layout styling variables
  const ratio = isFullscreen ? (fullscreenChineseSize / chineseSize) : 1;
  const currentChineseSize = isFullscreen ? fullscreenChineseSize : chineseSize;
  const currentZhuyinSize = isFullscreen ? Math.round(zhuyinSize * ratio) : zhuyinSize;
  const currentColumnGap = isFullscreen ? Math.round(columnGap * ratio) : columnGap;
  const currentDividerMargin = isFullscreen ? Math.max(4, Math.round(4 * ratio)) : 4;

  const dutySize = isFullscreen ? Math.max(12, Math.round(16 * ratio)) : 16;
  const dutyBoxBottom = isFullscreen ? Math.max(8, Math.round(12 * ratio)) : 12;
  const dutyBoxLeft = isFullscreen ? Math.max(8, Math.round(12 * ratio)) : 12;
  const dutyBoxBorderWidth = isFullscreen ? Math.max(1, Math.round(2 * ratio)) : 2;
  const dutyBoxRadius = isFullscreen ? Math.max(4, Math.round(8 * ratio)) : 8;
  const dutyBoxPaddingTopBottom = isFullscreen ? Math.max(6, Math.round(12 * ratio)) : 12;
  const dutyBoxPaddingLeftRight = isFullscreen ? Math.max(4, Math.round(8 * ratio)) : 8;
  const dutyBoxGap = isFullscreen ? Math.max(6, Math.round(12 * ratio)) : 12;
  const dutyBoxLetterSpacing = isFullscreen ? Math.max(2, Math.round(4 * ratio)) : 4;

  const chalkboardStyle = layoutEnabled ? {
    '--chinese-size': `${currentChineseSize}px`,
    '--line-spacing': `${(lineSpacing - 1.2) * 1.2}em`,
    '--column-gap': `${currentColumnGap}px`,
    '--zhuyin-size': `${currentZhuyinSize}px`,
    '--zhuyin-spacing': `${(zhuyinSpacing - 1.0) * 0.4}em`,
    '--zhuyin-squeeze': `${1.0 + zhuyinSqueeze}`,
    '--zhuyin-offset': `${zhuyinSpacing}`, // used directly in absolute left mapping
    '--divider-margin': `${currentDividerMargin}px`,
    '--duty-size': `${dutySize}px`,
    '--duty-box-bottom': `${dutyBoxBottom}px`,
    '--duty-box-left': `${dutyBoxLeft}px`,
    '--duty-box-border-width': `${dutyBoxBorderWidth}px`,
    '--duty-box-radius': `${dutyBoxRadius}px`,
    '--duty-box-padding': `${dutyBoxPaddingTopBottom}px ${dutyBoxPaddingLeftRight}px`,
    '--duty-box-gap': `${dutyBoxGap}px`,
    '--duty-box-letter-spacing': `${dutyBoxLetterSpacing}px`,
  } : {};

  return (
    <MainContent 
      title="班級黑板"
      subtitle="直式注音黑板，提供自動拼音注音、聲調定位與英數字旋轉自動排版。"
    >
      <div className="bb-container">
        {/* Left Control Panel */}
        <div className="bb-controls-grid">
          {/* Tabs */}
          <div className="bb-tabs glass-card">
            <button 
              className={`bb-tab-btn ${activeTab === 'contact' ? 'active' : ''}`}
              onClick={() => setActiveTab('contact')}
            >
              <strong>聯絡簿黑板</strong>
              <span>保存每日內容</span>
            </button>
            <button 
              className={`bb-tab-btn ${activeTab === 'todo' ? 'active' : ''}`}
              onClick={() => setActiveTab('todo')}
            >
              <strong>課堂代辦黑板</strong>
              <span>分享暫存</span>
            </button>
          </div>

          {/* Date Setup */}
          <div className="bb-card glass-card">
            <div className="card-header">
              <span className="card-title">今日日期</span>
              <button 
                className={`zhuyin-toggle-btn ${zhuyinEnabled ? 'enabled' : ''}`}
                onClick={() => setZhuyinEnabled(!zhuyinEnabled)}
              >
                <span className="dot"></span> 注音{zhuyinEnabled ? '開啟' : '關閉'}
              </button>
            </div>
            
            <div className="date-picker-row">
              <button className="date-arrow-btn" onClick={handlePrevDate}>◀</button>
              <input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)} 
                className="date-input-field" 
              />
              <button className="date-arrow-btn" onClick={handleNextDate}>▶</button>
            </div>
            <div className="date-formatted-label">
              {formatChineseDate(date)}
            </div>
          </div>

          {/* Duty Students */}
          <div className="bb-card glass-card">
            <div className="card-header">
              <span className="card-title">值日生</span>
              <div className="duty-count-badge">
                人數 <strong>{dutyCount}</strong>
              </div>
            </div>
            <div className="duty-inputs-row">
              <div className="duty-input-group">
                <label>第 1 位</label>
                <input 
                  type="text" 
                  placeholder="座號" 
                  value={duty1} 
                  onChange={e => setDuty1(e.target.value)} 
                  className="seat-input"
                />
              </div>
              <div className="duty-input-group">
                <label>第 2 位</label>
                <input 
                  type="text" 
                  placeholder="座號" 
                  value={duty2} 
                  onChange={e => setDuty2(e.target.value)} 
                  className="seat-input"
                />
              </div>
            </div>
          </div>

          {/* Editor */}
          <div className="bb-card glass-card editor-card">
            <div className="card-header">
              <span className="card-title">聯絡簿內容</span>
              <button 
                className="btn btn-accent btn-small correction-modal-trigger"
                onClick={() => setShowCorrectionModal(true)}
              >
                注音修正
              </button>
            </div>
            <textarea 
              value={currentContent}
              onChange={e => setCurrentContent(e.target.value)}
              className="chalkboard-textarea"
              placeholder="輸入聯絡簿內容，換行即為換直欄"
            />
            <span className="editor-hint">
              換行即為換直欄，英文與數字會自動旋轉為橫排。
            </span>
          </div>

          {/* Layout Controls */}
          <div className="bb-card glass-card layout-controls-card">
            <div className="card-header">
              <span className="card-title">排版調節</span>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={layoutEnabled} 
                  onChange={() => setLayoutEnabled(!layoutEnabled)} 
                />
                <span className="slider round"></span>
              </label>
            </div>

            {layoutEnabled && (
              <div className="sliders-list">
                <div className="slider-group">
                  <div className="slider-label">
                    <span>中文大小</span>
                    <strong>{chineseSize}px</strong>
                  </div>
                  <input 
                    type="range" 
                    min="16" 
                    max="48" 
                    value={chineseSize} 
                    onChange={e => setChineseSize(parseInt(e.target.value))} 
                    className="layout-slider"
                  />
                </div>

                <div className="slider-group">
                  <div className="slider-label">
                    <span>全螢幕中文大小</span>
                    <strong>{fullscreenChineseSize}px</strong>
                  </div>
                  <input 
                    type="range" 
                    min="30" 
                    max="300" 
                    value={fullscreenChineseSize} 
                    onChange={e => setFullscreenChineseSize(parseInt(e.target.value))} 
                    className="layout-slider"
                  />
                </div>

                <div className="slider-group">
                  <div className="slider-label">
                    <span>行高字距</span>
                    <strong>{lineSpacing.toFixed(2)}x</strong>
                  </div>
                  <input 
                    type="range" 
                    min="1.0" 
                    max="2.5" 
                    step="0.05"
                    value={lineSpacing} 
                    onChange={e => setLineSpacing(parseFloat(e.target.value))} 
                    className="layout-slider"
                  />
                </div>

                <div className="slider-group">
                  <div className="slider-label">
                    <span>直欄間距</span>
                    <strong>{columnGap}px</strong>
                  </div>
                  <input 
                    type="range" 
                    min="5" 
                    max="50" 
                    value={columnGap} 
                    onChange={e => setColumnGap(parseInt(e.target.value))} 
                    className="layout-slider"
                  />
                </div>

                <div className="slider-group">
                  <div className="slider-label">
                    <span>注音大小</span>
                    <strong>{zhuyinSize}px</strong>
                  </div>
                  <input 
                    type="range" 
                    min="6" 
                    max="18" 
                    value={zhuyinSize} 
                    onChange={e => setZhuyinSize(parseInt(e.target.value))} 
                    className="layout-slider"
                  />
                </div>

                <div className="slider-group">
                  <div className="slider-label">
                    <span>注音間距</span>
                    <strong>{zhuyinSpacing.toFixed(2)}</strong>
                  </div>
                  <input 
                    type="range" 
                    min="0.50" 
                    max="2.00" 
                    step="0.05"
                    value={zhuyinSpacing} 
                    onChange={e => setZhuyinSpacing(parseFloat(e.target.value))} 
                    className="layout-slider"
                  />
                </div>

                <div className="slider-group">
                  <div className="slider-label">
                    <span>注音擠壓</span>
                    <strong>{zhuyinSqueeze.toFixed(2)}</strong>
                  </div>
                  <input 
                    type="range" 
                    min="-0.50" 
                    max="0.50" 
                    step="0.05"
                    value={zhuyinSqueeze} 
                    onChange={e => setZhuyinSqueeze(parseFloat(e.target.value))} 
                    className="layout-slider"
                  />
                </div>

                <button 
                  className="btn btn-outline btn-full-width reset-layout-btn"
                  onClick={resetLayoutDefaults}
                >
                  ↺ 重設為預設值
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Chalkboard Display */}
        <div className="bb-chalkboard-container">
          <div className="chalkboard-header-row">
            <span className="chalkboard-tag">CONTACT BOOK</span>
            <h3 className="chalkboard-title">
              {activeTab === 'contact' ? '聯絡簿黑板' : '課堂代辦黑板'}
            </h3>
          </div>

          <div 
            id="chalkboard-element" 
            className="chalkboard-slate"
            style={chalkboardStyle}
            ref={boardRef}
          >
            {/* Fullscreen Button */}
            <button className="chalkboard-fullscreen-btn" onClick={handleFullscreen}>
              ⛶ 全螢幕模式
            </button>

            {/* Blackboard Board Inner */}
            <div className="chalkboard-inner-content">
              <div className="vertical-columns-container">
                {/* Date Column (Far Right) */}
                <div className="vertical-line-col date-col">
                  {parsedDateColumn.map((charItem, charIdx) => renderChar(charItem, charIdx))}
                </div>

                {/* Vertical Divider Line */}
                <div className="vertical-divider-line"></div>

                {/* Content Columns */}
                {parsedContentColumns.map((col, colIdx) => (
                  <div key={colIdx} className="vertical-line-col">
                    {col.map((charItem, charIdx) => renderChar(charItem, charIdx))}
                  </div>
                ))}
              </div>

              {/* Duty Board (Bottom Left) */}
              <div className="board-duty-chalk">
                <div className="duty-chalk-title">值日生</div>
                <div className="duty-chalk-names">
                  <div className="name-entry">{renderUprightDigits(getDutyDisplayName(duty1))}</div>
                  <div className="name-entry">{renderUprightDigits(getDutyDisplayName(duty2))}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Under-board Details */}
          <div className="chalkboard-details">
            <span>★ 中文大小: {layoutEnabled ? `${currentChineseSize}px` : '預設'}</span>
            <span>★ 注音大小: {layoutEnabled ? `${currentZhuyinSize}px` : '預設'}</span>
            <span>★ 看板解析度: {boardResolution.width} × {boardResolution.height} px</span>
            <span>★ 聯絡簿：本機保存</span>
          </div>
        </div>
      </div>

      {/* Zhuyin Correction Modal */}
      {showCorrectionModal && (
        <div className="modal-backdrop visible">
          <div className="modal-card correction-modal">
            <h3 className="modal-title">注音手動修正</h3>
            <p className="modal-desc">此清單列出目前文字中的所有中文字，您可以點擊輸入框自訂特定字的注音，系統將會儲存並覆寫預設發音。</p>
            
            <div className="correction-grid">
              {getUniqueChineseChars().map((char) => {
                const currentOverride = zhuyinOverrides[char] || '';
                const defaultZhuyin = getZhuyinForChar(char);
                return (
                  <div key={char} className="correction-item">
                    <span className="char-display">{char}</span>
                    <div className="char-input-group">
                      <input 
                        type="text" 
                        placeholder={defaultZhuyin || '無注音'} 
                        value={currentOverride}
                        onChange={(e) => {
                          const val = e.target.value;
                          setZhuyinOverrides(prev => {
                            const updated = { ...prev };
                            if (val === '') {
                              delete updated[char];
                            } else {
                              updated[char] = val;
                            }
                            return updated;
                          });
                        }}
                        className="zhuyin-override-input"
                      />
                    </div>
                  </div>
                );
              })}
              {getUniqueChineseChars().length === 0 && (
                <div className="empty-chars">目前聯絡簿中沒有中文字。</div>
              )}
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-outline" 
                onClick={() => {
                  setZhuyinOverrides({});
                  localStorage.removeItem('zhuyin_overrides');
                }}
              >
                重設所有修正
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => setShowCorrectionModal(false)}
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}
    </MainContent>
  );
};

export default Blackboard;
