import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainContent from '../components/Layout/MainContent';
import SettingsModal from '../components/Layout/SettingsModal';
import { useClass } from '../context/ClassContext';
import { Minus, Plus, Edit2 } from 'lucide-react';
import './PointsSystem.css';

const PointsSystem = () => {
  const navigate = useNavigate();
  const { currentClass, students, setStudents, addPoint, addPointToAll, addNewStudent } = useClass();
  const [showSettings, setShowSettings] = useState(false);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'settlement'
  const [calculatedScores, setCalculatedScores] = useState(null);

  const formatStudentDisplayName = (student) => {
    const defaultName = `${student.id}號`;
    if (student.name === defaultName) {
      return defaultName;
    }
    return `${student.id}號 ${student.name}`;
  };

  const renameStudent = (studentId) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    const newName = prompt(`修改座號 ${studentId} 學生姓名:`, student.name);
    if (newName !== null) {
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, name: newName.trim() || `${s.id}號` } : s));
    }
  };

  const handleAddStudent = () => {
    const name = prompt("請輸入學生姓名 (留空則自動編號):");
    if (name !== null) {
      addNewStudent(name);
    }
  };

  const handleCalculateScores = () => {
    const maxPoints = Math.max(...students.map(s => s.points));
    const newCalculated = {};
    
    students.forEach(s => {
      let score = 80;
      if (maxPoints > 0 && s.points > 0) {
        score = 80 + Math.round((s.points / maxPoints) * 20);
      } else if (s.points < 0) {
        score = Math.max(60, 80 + s.points * 2);
      }
      newCalculated[s.id] = score;
    });
    setCalculatedScores(newCalculated);
  };

  const handleCopyGradesList = () => {
    const text = students.map(s => {
      const displayName = formatStudentDisplayName(s);
      const score = calculatedScores && calculatedScores[s.id] !== undefined ? `${calculatedScores[s.id]}` : '-';
      return `${displayName}\t${s.points}\t${score}`;
    }).join('\n');
    
    navigator.clipboard.writeText(`姓名/座號\t累積淨分\t平時成績\n${text}`)
      .then(() => alert("成績名單已成功複製到剪貼簿，可直接貼上至 Excel！"))
      .catch(err => alert("複製失敗: " + err));
  };

  const handleResetAllPoints = () => {
    if (window.confirm("確定要將全班學生的分數歸零並完成本期結算嗎？此動作無法復原。")) {
      setStudents(prev => prev.map(s => ({ ...s, points: 0 })));
      setCalculatedScores(null);
    }
  };

  const pointsHeaderExtra = (
    <div className="points-header-tabs">
      <button 
        className={`points-tab-btn ${viewMode === 'cards' ? 'active' : ''}`}
        onClick={() => setViewMode('cards')}
      >
        個人計分
      </button>
      <button 
        className="points-tab-btn" 
        onClick={() => navigate('/group')}
      >
        分組分數
      </button>
      <button 
        className={`points-tab-btn ${viewMode === 'settlement' ? 'active' : ''}`}
        onClick={() => setViewMode('settlement')}
      >
        成績結算
      </button>
      <button 
        className="points-tab-btn" 
        onClick={() => navigate('/group')}
      >
        前往分組模式
      </button>
      <button 
        className="points-tab-btn" 
        onClick={() => setShowSettings(true)}
      >
        編輯班級名單
      </button>
      <button 
        className="points-tab-btn" 
        onClick={() => navigate('/exam-timer')}
      >
        一鍵考試模式
      </button>
    </div>
  );

  const topbarActions = viewMode === 'cards' ? (
    <>
      <button className="btn btn-glass" onClick={() => addPointToAll(1)}>全班 +1</button>
      <button className="btn btn-glass" onClick={() => addPointToAll(-1)}>全班 -1</button>
      <button className="btn btn-glass" onClick={() => navigate('/group')}>前往分組模式</button>
      <button className="btn btn-accent" onClick={handleAddStudent}>新增學生</button>
    </>
  ) : (
    <>
      <button className="btn btn-glass" onClick={() => navigate('/group')}>前往分組模式</button>
      <button className="btn btn-accent calculate-grades-btn" onClick={handleCalculateScores}>計算平時成績</button>
      <button className="btn btn-glass" onClick={handleCopyGradesList}>複製成績名單</button>
      <button className="btn btn-glass" onClick={handleResetAllPoints}>重設所有分數</button>
    </>
  );

  return (
    <>
      <MainContent 
        title={currentClass.name}
        subtitle="班級加分與平時分數結算系統，支援組員積分連動。"
        headerExtra={pointsHeaderExtra}
        actions={topbarActions}
      >
        {viewMode === 'cards' ? (
          <div className="points-grid">
            {students.map((student) => (
              <div key={student.id} className="student-card glass-card">
                <div className="student-card-header">
                  <span className="student-name">{formatStudentDisplayName(student)}</span>
                  <button className="edit-btn" onClick={() => renameStudent(student.id)} title="修改學生姓名">
                    <Edit2 size={12} />
                  </button>
                </div>
                
                <div className="student-score" style={{ color: student.points < 0 ? '#e74c3c' : 'var(--primary)' }}>
                  {student.points}
                </div>
                
                <div className="student-actions">
                  <button className="point-btn minus" onClick={() => addPoint(student.id, -1)}>
                    <Minus size={16} />
                  </button>
                  <button className="point-btn plus" onClick={() => addPoint(student.id, 1)}>
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="settlement-container glass-card">
            <table className="settlement-table">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>座號/姓名</th>
                  <th style={{ width: '30%' }}>累積淨分</th>
                  <th style={{ width: '30%' }}>平時成績 (80-100分級)</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const score = calculatedScores && calculatedScores[student.id] !== undefined
                    ? `${calculatedScores[student.id]}分`
                    : '-';
                  return (
                    <tr key={student.id}>
                      <td>{formatStudentDisplayName(student)}</td>
                      <td className="net-points">{student.points}</td>
                      <td className={`final-grade ${score !== '-' ? 'calculated' : ''}`}>{score}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </MainContent>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
};

export default PointsSystem;
