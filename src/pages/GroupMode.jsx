import React, { useState } from 'react';
import MainContent from '../components/Layout/MainContent';
import { useClass } from '../context/ClassContext';
import { Minus, Plus, X } from 'lucide-react';
import './GroupMode.css';

const GroupMode = () => {
  const { students, groups, generateRandomGroups, clearGroups, addPoint, setGroups, setStudents } = useClass();
  const [groupCount, setGroupCount] = useState(4);
  const [showPodium, setShowPodium] = useState(false);

  const sortedGroups = [...groups].sort((a, b) => b.score - a.score);
  const firstPlace = sortedGroups[0] || null;
  const secondPlace = sortedGroups[1] || null;
  const thirdPlace = sortedGroups[2] || null;

  const formatStudentDisplayName = (student) => {
    const defaultName = `${student.id}號`;
    if (student.name === defaultName) {
      return defaultName;
    }
    return `${student.id}號 ${student.name}`;
  };

  const unassignedStudents = students.filter(s => s.groupId === null);

  const handleGenerate = () => {
    if (groupCount > 0) {
      generateRandomGroups(groupCount);
    }
  };

  const addGroupScore = (groupId, amount) => {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, score: g.score + amount } : g));
  };

  // Drag and Drop Logic
  const handleDragStart = (e, studentId) => {
    e.dataTransfer.setData('studentId', studentId.toString());
  };

  const handleDrop = (e, targetGroupId) => {
    e.preventDefault();
    const studentId = parseInt(e.dataTransfer.getData('studentId'));
    if (!isNaN(studentId)) {
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, groupId: targetGroupId } : s));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <MainContent 
      title="小組操作台"
      subtitle="分組、同組每人加減分、個人加減分、小組競賽分與排行榜集中在同一頁，適合課堂中快速操作。"
      actions={
        <div className="group-stats">
          <span className="stat-badge">小組 {groups.length}</span>
          <span className="stat-badge">已分組 {students.length - unassignedStudents.length} / {students.length}</span>
          <span className="stat-badge warning">未分組 {unassignedStudents.length}</span>
        </div>
      }
    >
      <div className="gm-container">
        {/* Left Panel: Settings & Unassigned */}
        <div className="gm-sidebar glass-card">
          <div className="gm-section">
            <label>小組數量</label>
            <input 
              type="number" 
              value={groupCount} 
              onChange={e => setGroupCount(parseInt(e.target.value) || 0)}
              className="gm-input"
            />
            <button className="btn btn-accent btn-full" onClick={handleGenerate}>隨機平均分組</button>
            <button className="btn btn-outline btn-full" onClick={clearGroups}>清空分組</button>
          </div>

          <div className="gm-section">
            <div className="section-header">
              <h4>未分組學生</h4>
              <span className="count">{unassignedStudents.length} 人</span>
            </div>
            <div 
              className="unassigned-list"
              onDrop={(e) => handleDrop(e, null)}
              onDragOver={handleDragOver}
              style={{ minHeight: '100px', paddingBottom: '20px' }}
            >
              {unassignedStudents.map(student => (
                <div 
                  key={student.id} 
                  className="unassigned-item"
                  draggable
                  onDragStart={(e) => handleDragStart(e, student.id)}
                  style={{ cursor: 'grab' }}
                >
                  <div className="student-info">
                    <span className="id">{formatStudentDisplayName(student)}</span>
                    <span className="score">{student.points}分</span>
                  </div>
                  <div className="quick-actions">
                    <button className="q-btn minus" onClick={() => addPoint(student.id, -1)}><Minus size={14} /></button>
                    <button className="q-btn plus" onClick={() => addPoint(student.id, 1)}><Plus size={14} /></button>
                  </div>
                </div>
              ))}
              {unassignedStudents.length === 0 && <p className="empty-text">所有學生已分組</p>}
            </div>
          </div>
        </div>

        {/* Main Panel: Groups */}
        <div className="gm-main">
          <div className="gm-header">
            <h3>小組與組員</h3>
            <span className="help-text">可拖曳學生移動小組</span>
          </div>
          
          <div className="groups-grid">
            {groups.map(group => {
              const groupMembers = students.filter(s => s.groupId === group.id);
              return (
                <div 
                  key={group.id} 
                  className="group-card glass-panel"
                  onDrop={(e) => handleDrop(e, group.id)}
                  onDragOver={handleDragOver}
                >
                  <div className="group-card-header">
                    <div className="group-title">
                      <span className="group-badge">第 {group.id} 組</span>
                      <h4>{groupMembers.length} 位組員</h4>
                    </div>
                    <div className="group-score-display">
                      <span className="label">小組分</span>
                      <span className="score">{group.score}</span>
                    </div>
                  </div>

                  <div className="group-controls">
                    <div className="control-row">
                      <span className="control-label">同組每人</span>
                      <div className="btn-group">
                        <button className="btn point-action minus" onClick={() => groupMembers.forEach(m => addPoint(m.id, -1))}>-1</button>
                        <button className="btn point-action plus" onClick={() => groupMembers.forEach(m => addPoint(m.id, 1))}>+1</button>
                        <button className="btn point-action plus-more" onClick={() => groupMembers.forEach(m => addPoint(m.id, 3))}>+3</button>
                      </div>
                    </div>
                    <div className="control-row">
                      <span className="control-label">小組競賽</span>
                      <div className="btn-group">
                        <button className="btn point-action minus alt" onClick={() => addGroupScore(group.id, -1)}>-1</button>
                        <button className="btn point-action plus alt" onClick={() => addGroupScore(group.id, 1)}>+1</button>
                        <button className="btn point-action plus-more alt" onClick={() => addGroupScore(group.id, 3)}>+3</button>
                      </div>
                    </div>
                  </div>

                  <div className="group-members-area">
                    {groupMembers.length > 0 ? (
                      <div className="member-chips">
                        {groupMembers.map(m => (
                          <div 
                            key={m.id} 
                            className="member-chip"
                            draggable
                            onDragStart={(e) => handleDragStart(e, m.id)}
                            style={{ cursor: 'grab' }}
                          >
                            {formatStudentDisplayName(m)} ({m.points})
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="drop-zone">拖曳學生到第 {group.id} 組</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel: Ranking */}
        <div className="gm-ranking glass-card">
          <div className="ranking-header">
            <h3>小組排行榜</h3>
            <button className="btn btn-accent btn-small" onClick={() => setShowPodium(true)}>頒獎台</button>
          </div>
          <div className="ranking-list">
            {[...groups].sort((a, b) => b.score - a.score).map((group, idx) => {
              const membersCount = students.filter(s => s.groupId === group.id).length;
              const groupTotalPoints = students.filter(s => s.groupId === group.id).reduce((sum, s) => sum + s.points, 0);
              return (
                <div key={group.id} className="ranking-item">
                  <div className="rank-info">
                    <strong>#{idx + 1} {group.name}</strong>
                    <span>{membersCount} 人 / 組員總分 {groupTotalPoints}</span>
                  </div>
                  <div className="rank-score">{group.score}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Podium Modal */}
      {showPodium && (
        <div className="podium-backdrop" onClick={() => setShowPodium(false)}>
          <div className="podium-modal" onClick={e => e.stopPropagation()}>
            <div className="podium-header">
              <h3 className="podium-title">🏆 小組積分儀表板</h3>
              <button className="podium-close-btn" onClick={() => setShowPodium(false)}>
                <X size={18} />
              </button>
            </div>
            
            <div className="podium-stage-container">
              {groups.length === 0 ? (
                <div className="podium-empty">尚無小組積分資料，請先進行分組！</div>
              ) : (
                <>
                  {/* Left: 2nd Place */}
                  {secondPlace ? (
                    <div className="podium-bar silver">
                      <span className="podium-medal">🥈</span>
                      <span className="podium-name">{secondPlace.name}</span>
                      <span className="podium-score">{secondPlace.score}</span>
                    </div>
                  ) : (
                    <div style={{ flex: 1, maxWidth: '140px' }} />
                  )}

                  {/* Center: 1st Place */}
                  {firstPlace ? (
                    <div className="podium-bar gold">
                      <span className="podium-medal">🥇</span>
                      <span className="podium-name">{firstPlace.name}</span>
                      <span className="podium-score">{firstPlace.score}</span>
                    </div>
                  ) : (
                    <div style={{ flex: 1, maxWidth: '140px' }} />
                  )}

                  {/* Right: 3rd Place */}
                  {thirdPlace ? (
                    <div className="podium-bar bronze">
                      <span className="podium-medal">🥉</span>
                      <span className="podium-name">{thirdPlace.name}</span>
                      <span className="podium-score">{thirdPlace.score}</span>
                    </div>
                  ) : (
                    <div style={{ flex: 1, maxWidth: '140px' }} />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </MainContent>
  );
};

export default GroupMode;
