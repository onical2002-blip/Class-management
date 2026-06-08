import React, { createContext, useState, useEffect, useContext } from 'react';

const ClassContext = createContext();

// Mock Data Initializer
const initializeStudents = () => {
  const saved = localStorage.getItem('class_students');
  if (saved) return JSON.parse(saved);
  return Array.from({ length: 29 }, (_, i) => ({
    id: i + 1,
    name: `${i + 1}號`,
    points: 0,
    groupId: null,
  }));
};

const initializeClassInfo = () => {
  const saved = localStorage.getItem('class_info');
  if (saved) return JSON.parse(saved);
  return {
    name: '8年2班',
    totalStudents: 29,
    absentStudents: 0
  };
};

export const ClassProvider = ({ children }) => {
  const [currentClass, setCurrentClass] = useState(initializeClassInfo);
  const [students, setStudents] = useState(initializeStudents);
  const [groups, setGroups] = useState(() => {
    const saved = localStorage.getItem('class_groups');
    return saved ? JSON.parse(saved) : [];
  });

  // Persist to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('class_info', JSON.stringify(currentClass));
  }, [currentClass]);

  useEffect(() => {
    localStorage.setItem('class_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('class_groups', JSON.stringify(groups));
  }, [groups]);

  // Point System Functions
  const addPoint = (studentId, amount = 1) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, points: s.points + amount } : s));
  };

  const addPointToAll = (amount = 1) => {
    setStudents(prev => prev.map(s => ({ ...s, points: s.points + amount })));
  };

  const addNewStudent = (name) => {
    setStudents(prev => {
      const newId = prev.length > 0 ? Math.max(...prev.map(s => s.id)) + 1 : 1;
      return [...prev, { id: newId, name: name || `${newId}號`, points: 0, groupId: null }];
    });
    setCurrentClass(prev => ({ ...prev, totalStudents: prev.totalStudents + 1 }));
  };

  const updateClassInfo = (name, total, absent) => {
    setCurrentClass({ name, totalStudents: total, absentStudents: absent });
  };

  // Group Functions
  const generateRandomGroups = (groupCount) => {
    let availableStudents = [...students];
    // Fisher-Yates shuffle
    for (let i = availableStudents.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableStudents[i], availableStudents[j]] = [availableStudents[j], availableStudents[i]];
    }

    const newGroups = Array.from({ length: groupCount }, (_, i) => ({
      id: i + 1,
      name: `第 ${i + 1} 組`,
      score: 0,
    }));

    let currentStudentList = [...students];
    
    // Assign students to groups round-robin
    availableStudents.forEach((student, index) => {
      const groupId = (index % groupCount) + 1;
      const studentIndex = currentStudentList.findIndex(s => s.id === student.id);
      currentStudentList[studentIndex] = { ...student, groupId };
    });

    setGroups(newGroups);
    setStudents(currentStudentList);
  };

  const clearGroups = () => {
    setGroups([]);
    setStudents(prev => prev.map(s => ({ ...s, groupId: null })));
  };

  const value = {
    currentClass,
    setCurrentClass,
    students,
    setStudents,
    groups,
    setGroups,
    addPoint,
    addPointToAll,
    addNewStudent,
    updateClassInfo,
    generateRandomGroups,
    clearGroups
  };

  return <ClassContext.Provider value={value}>{children}</ClassContext.Provider>;
};

export const useClass = () => useContext(ClassContext);

