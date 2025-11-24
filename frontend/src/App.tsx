import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import DashboardLayout from './components/DashboardLayout';
import Settings from './components/Settings';

interface ChatSession {
  id: string;
  name: string;
  created_at: string;
  last_message_at: string;
  message_count: number;
}

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('miku_theme') || 'light');
  const [bgOpacity, setBgOpacity] = useState(() => parseInt(localStorage.getItem('miku_bg_opacity') || '50'));
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
  }, [theme, bgOpacity]);

  useEffect(() => {
    // Load sessions on mount
    fetchSessions();
  }, []);

  useEffect(() => {
    // Save active session
    if (activeSessionId) {
      localStorage.setItem('miku_active_session', activeSessionId);
    }
  }, [activeSessionId]);

  const fetchSessions = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/sessions');
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
      await fetch(`http://localhost:8000/api/sessions/${sessionId}`, {
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
        >
          <ChatInterface
            activeSessionId={activeSessionId}
            onSessionCreated={handleSessionCreated}
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
      />
    </div>
  );
}

export default App;
