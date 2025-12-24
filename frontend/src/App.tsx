import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import DashboardLayout from './components/DashboardLayout';
import Settings from './components/Settings';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';

interface ChatSession {
  id: string;
  name: string;
  created_at: string;
  last_message_at: string;
  message_count: number;
}

function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [theme, setTheme] = useState(() => localStorage.getItem('miku_theme') || 'light');
  const [bgOpacity, setBgOpacity] = useState(() => parseInt(localStorage.getItem('miku_bg_opacity') || '50'));
  const [showAvatar, setShowAvatar] = useState(() => localStorage.getItem('miku_show_avatar') !== 'false');
  const [avatarMode, setAvatarMode] = useState<'simple' | 'live2d'>(() => (localStorage.getItem('miku_avatar_mode') as 'simple' | 'live2d') || 'live2d');
  const [live2dModelUrl, setLive2dModelUrl] = useState(() => localStorage.getItem('miku_live2d_model_url') || '/live2d/miku/miku_pro_jp/runtime/miku_sample_t04.model3.json');
  const [chatAvatarUrl, setChatAvatarUrl] = useState(() => localStorage.getItem('miku_chat_avatar_url') || '/miku_avatar_1.jpg');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() =>
    localStorage.getItem('miku_active_session') || null
  );

  useEffect(() => {
    // Apply theme class to body
    document.body.className = '';
    if (theme === 'dark') document.body.classList.add('theme-dark');
    if (theme === 'cyber') document.body.classList.add('theme-cyber');

    // Apply opacity variable
    document.documentElement.style.setProperty('--glass-opacity', (bgOpacity / 100).toString());

    // Save settings
    localStorage.setItem('miku_theme', theme);
    localStorage.setItem('miku_bg_opacity', bgOpacity.toString());
    localStorage.setItem('miku_show_avatar', showAvatar.toString());
    localStorage.setItem('miku_avatar_mode', avatarMode);
    localStorage.setItem('miku_live2d_model_url', live2dModelUrl);
    localStorage.setItem('miku_chat_avatar_url', chatAvatarUrl);
  }, [theme, bgOpacity, showAvatar, avatarMode, live2dModelUrl, chatAvatarUrl]);

  // Auto-migrate to local model if using the old broken CDN
  useEffect(() => {
    const oldUrl = 'https://cdn.jsdelivr.net/gh/evrstr/live2d-widget-models/live2d_evrstr/miku/model.json';
    if (live2dModelUrl === oldUrl) {
      setLive2dModelUrl('/live2d/miku/miku_pro_jp/runtime/miku_sample_t04.model3.json');
    }
  }, [live2dModelUrl]);

  useEffect(() => {
    // Check for auto-login via backend API (file-based persistence)
    const checkAutoLogin = async () => {
      try {
        const response = await fetch('/api/user');
        const data = await response.json();

        console.log('[DEBUG] Auto-login API check:', {
          hasUsername: !!data.username,
          hasPassword: !!data.password,
          rememberMe: data.rememberMe
        });

        if (data.username && data.password && data.rememberMe) {
          console.log('[DEBUG] Auto-login 成功，用户:', data.username);
          setCurrentUser(data.username);
          setIsAuthenticated(true);
          // Also sync to localStorage for other features
          localStorage.setItem('miku_user', data.username);
          localStorage.setItem('miku_password', data.password);
          localStorage.setItem('miku_remember_me', 'true');
        } else {
          console.log('[DEBUG] Auto-login 条件不满足');
        }
      } catch (error) {
        console.log('[DEBUG] Auto-login API 请求失败:', error);
      }
    };

    checkAutoLogin();
  }, []);

  // Load sessions when user is authenticated
  useEffect(() => {
    if (currentUser && isAuthenticated) {
      fetchSessions();
    }
  }, [currentUser, isAuthenticated]);

  useEffect(() => {
    // Save active session
    if (activeSessionId) {
      localStorage.setItem('miku_active_session', activeSessionId);
    }
  }, [activeSessionId]);

  const fetchSessions = async () => {
    if (!currentUser) return;

    try {
      const response = await fetch(`http://localhost:8000/api/sessions?username=${encodeURIComponent(currentUser)}`);
      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const handleNewChat = () => {
    setActiveSessionId(null);
    localStorage.removeItem('miku_active_session');
  };

  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await fetch(`http://localhost:8000/api/sessions/${sessionId}?username=${encodeURIComponent(currentUser)}`, {
        method: 'DELETE'
      });

      // Refresh sessions
      await fetchSessions();

      // If deleted session was active, clear it
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        localStorage.removeItem('miku_active_session');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const handleSessionCreated = (sessionId: string) => {
    setActiveSessionId(sessionId);
    fetchSessions();
  };

  const handleLogin = (username: string, password: string, rememberMe: boolean) => {
    // Check if this is a returning user
    const savedUser = localStorage.getItem('miku_user');
    const savedPassword = localStorage.getItem('miku_password');

    // If user exists, validate password
    if (savedUser && savedUser === username) {
      if (savedPassword !== password) {
        // Password mismatch - return error
        return { success: false, error: 'Incorrect password' };
      }
    }

    // Login successful
    setCurrentUser(username);
    setIsAuthenticated(true);

    console.log('[DEBUG] 登录处理，rememberMe =', rememberMe);

    // Save to localStorage for compatibility
    localStorage.setItem('miku_user', username);
    localStorage.setItem('miku_password', password);
    if (rememberMe) {
      localStorage.setItem('miku_remember_me', 'true');
    } else {
      localStorage.removeItem('miku_remember_me');
    }

    // Save to backend API for file-based persistence (works across app restarts)
    fetch('/api/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, rememberMe })
    }).then(() => {
      console.log('[DEBUG] 已保存登录信息到后端文件');
    }).catch(err => {
      console.log('[DEBUG] 后端保存失败:', err);
    });

    return { success: true };
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser('');
    localStorage.removeItem('miku_user');
    localStorage.removeItem('miku_password');
    localStorage.removeItem('miku_remember_me');
  };

  const handleUsernameChange = (newUsername: string) => {
    setCurrentUser(newUsername);
    const rememberMe = localStorage.getItem('miku_remember_me') === 'true';
    if (rememberMe) {
      localStorage.setItem('miku_user', newUsername);
    }
  };

  if (showLanding) {
    return <LandingPage onEnter={() => setShowLanding(false)} />;
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className={`min-h-screen bg-tech-bg relative overflow-hidden font-sans text-theme-text transition-colors duration-300`}>
      {/* Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Hexagonal Grid Overlay */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(rgb(var(--color-miku-dark)) 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
        </div>

        {/* Glowing Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-miku/20 rounded-full blur-[100px] animate-pulse-glow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-magenta/20 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 h-screen">
        <DashboardLayout
          onOpenSettings={() => setIsSettingsOpen(true)}
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          onDeleteSession={handleDeleteSession}
          onLogout={handleLogout}
          currentUser={currentUser}
        >
          <ChatInterface
            activeSessionId={activeSessionId}
            onSessionCreated={handleSessionCreated}
            currentUser={currentUser}
            showAvatar={showAvatar}
            avatarMode={avatarMode}
            live2dModelUrl={live2dModelUrl}
          />
        </DashboardLayout>
      </div>

      <Settings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentTheme={theme}
        onThemeChange={setTheme}
        bgOpacity={bgOpacity}
        onOpacityChange={setBgOpacity}
        currentUser={currentUser}
        onUsernameChange={handleUsernameChange}
        onLogout={handleLogout}
        showAvatar={showAvatar}
        onShowAvatarChange={setShowAvatar}
        avatarMode={avatarMode}
        onAvatarModeChange={setAvatarMode}
        live2dModelUrl={live2dModelUrl}
        onLive2dModelUrlChange={setLive2dModelUrl}
      />
    </div>
  );
}

export default App;
