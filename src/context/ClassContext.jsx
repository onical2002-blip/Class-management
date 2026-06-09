import React, { createContext, useState, useEffect, useContext } from 'react';

const ClassContext = createContext();

const googleDriveSearchFile = async (token) => {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='classroom_hub_sync_data.json' and trashed=false&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  return data.files && data.files.length > 0 ? data.files[0].id : null;
};

const googleDriveDownloadFile = async (token, fileId) => {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return await res.json();
};

const googleDriveUpdateFile = async (token, fileId, content) => {
  await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(content)
  });
};

const googleDriveCreateFile = async (token, content) => {
  const metaRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'classroom_hub_sync_data.json',
      mimeType: 'application/json'
    })
  });
  const metaData = await metaRes.json();
  const fileId = metaData.id;
  if (!fileId) throw new Error("建立檔案失敗");
  await googleDriveUpdateFile(token, fileId, content);
  return fileId;
};

const collectAppData = () => {
  const backup = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
      key.startsWith('class_') ||
      key.startsWith('blackboard_') ||
      key.startsWith('zhuyin_') ||
      key.startsWith('exam_') ||
      key.startsWith('random_')
    )) {
      backup[key] = localStorage.getItem(key);
    }
  }
  return backup;
};

const loadAppData = (backup) => {
  Object.keys(backup).forEach(key => {
    localStorage.setItem(key, backup[key]);
  });
};

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
  
  const [googleUser, setGoogleUser] = useState(() => {
    const saved = sessionStorage.getItem('google_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [googleClientId, setGoogleClientId] = useState(() => {
    return localStorage.getItem('google_client_id') || '';
  });
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle', 'syncing', 'success', 'error'

  useEffect(() => {
    localStorage.setItem('google_client_id', googleClientId);
  }, [googleClientId]);

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

  const loginWithGoogle = (clientId) => {
    return new Promise((resolve, reject) => {
      const activeClientId = clientId || googleClientId;
      if (!activeClientId) {
        reject(new Error("未設定 Google Client ID"));
        return;
      }
      if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
        reject(new Error("Google 登入套件尚未載入，請確認網路連線。"));
        return;
      }
      
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: activeClientId,
          scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile',
          callback: async (response) => {
            if (response.error !== undefined) {
              reject(response);
              return;
            }
            
            const token = response.access_token;
            setSyncStatus('syncing');
            try {
              const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${token}` }
              });
              const profile = await userRes.json();
              
              const userObj = {
                name: profile.name,
                picture: profile.picture,
                token: token
              };
              
              setGoogleUser(userObj);
              sessionStorage.setItem('google_user', JSON.stringify(userObj));
              setSyncStatus('success');
              
              // Automatically sync from cloud to check if backup exists
              const fileId = await googleDriveSearchFile(token);
              if (fileId) {
                if (window.confirm(`登入成功！在您的 Google 雲端硬碟中找到備份資料，是否立即載入載入？\n(這會覆蓋此瀏覽器目前的本機資料)`)) {
                  const appData = await googleDriveDownloadFile(token, fileId);
                  if (appData && Object.keys(appData).length > 0) {
                    loadAppData(appData);
                    alert("已成功從雲端載入最新資料！即將自動重新整理網頁...");
                    window.location.reload();
                  }
                }
              } else {
                // If no backup file exists, upload current data to establish sync
                await googleDriveCreateFile(token, collectAppData());
              }
              
              resolve(userObj);
            } catch (err) {
              setSyncStatus('error');
              reject(err);
            }
          },
        });
        tokenClient.requestAccessToken();
      } catch (err) {
        reject(err);
      }
    });
  };

  const logoutGoogle = () => {
    setGoogleUser(null);
    sessionStorage.removeItem('google_user');
    setSyncStatus('idle');
  };

  const syncToCloud = async (token) => {
    const activeToken = token || (googleUser ? googleUser.token : null);
    if (!activeToken) return;
    
    setSyncStatus('syncing');
    try {
      const fileId = await googleDriveSearchFile(activeToken);
      const appData = collectAppData();
      if (fileId) {
        await googleDriveUpdateFile(activeToken, fileId, appData);
      } else {
        await googleDriveCreateFile(activeToken, appData);
      }
      setSyncStatus('success');
      alert("已成功將資料同步至您的 Google 雲端硬碟！");
    } catch (err) {
      console.error(err);
      setSyncStatus('error');
      alert("同步至雲端失敗: " + err.message);
    }
  };

  const syncFromCloud = async (token) => {
    const activeToken = token || (googleUser ? googleUser.token : null);
    if (!activeToken) return;
    
    setSyncStatus('syncing');
    try {
      const fileId = await googleDriveSearchFile(activeToken);
      if (fileId) {
        const appData = await googleDriveDownloadFile(activeToken, fileId);
        if (appData && Object.keys(appData).length > 0) {
          loadAppData(appData);
          setSyncStatus('success');
          alert("已成功從雲端載入最新資料！即將自動重新整理網頁...");
          window.location.reload();
        } else {
          setSyncStatus('success');
          alert("雲端備份檔案為空，無法載入。");
        }
      } else {
        setSyncStatus('success');
        alert("雲端硬碟中找不到任何備份檔案，請先點擊「儲存至雲端」上傳資料。");
      }
    } catch (err) {
      console.error(err);
      setSyncStatus('error');
      alert("從雲端載入失敗: " + err.message);
    }
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
    clearGroups,
    googleUser,
    setGoogleUser,
    googleClientId,
    setGoogleClientId,
    loginWithGoogle,
    logoutGoogle,
    syncToCloud,
    syncFromCloud,
    syncStatus
  };

  return <ClassContext.Provider value={value}>{children}</ClassContext.Provider>;
};

export const useClass = () => useContext(ClassContext);

