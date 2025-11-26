import React, { useState } from 'react';
import Sidebar from './Sidebar';
import NavigationRail from './NavigationRail';
import MusicPlayer from './MusicPlayer';

interface ChatSession {
    id: string;
    name: string;
    created_at: string;
    last_message_at: string;
    message_count: number;
}

interface DashboardLayoutProps {
    children: React.ReactNode;
    onOpenSettings?: () => void;
    sessions: ChatSession[];
    activeSessionId: string | null;
    onSelectSession: (sessionId: string) => void;
    onNewChat: () => void;
    onDeleteSession: (sessionId: string) => void;
    onLogout: () => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
    children,
    onOpenSettings,
    sessions,
    activeSessionId,
    onSelectSession,
    onNewChat,
    onDeleteSession,
    onLogout
}) => {
    const [activeTab, setActiveTab] = useState<'chat' | 'music' | 'settings'>('chat');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() =>
        localStorage.getItem('miku_sidebar_collapsed') === 'true'
    );

    const handleTabChange = (tab: 'chat' | 'music' | 'settings') => {
        if (tab === 'settings') {
            if (onOpenSettings) onOpenSettings();
        } else {
            setActiveTab(tab);
        }
    };

    const handleToggleSidebar = () => {
        const newState = !sidebarCollapsed;
        setSidebarCollapsed(newState);
        localStorage.setItem('miku_sidebar_collapsed', newState.toString());
    };

    return (
        <div className="flex h-screen p-4 gap-4">
            <NavigationRail
                activeTab={activeTab}
                onTabChange={handleTabChange}
                onLogout={onLogout}
            />

            {/* Chat View */}
            <div className={`contents ${activeTab === 'chat' ? '' : 'hidden'}`}>
                <Sidebar
                    sessions={sessions}
                    activeSessionId={activeSessionId}
                    onSelectSession={onSelectSession}
                    onNewChat={onNewChat}
                    onDeleteSession={onDeleteSession}
                    collapsed={sidebarCollapsed}
                    onToggleCollapse={handleToggleSidebar}
                />
                <main className="flex-1 h-full min-w-0">
                    {children}
                </main>
            </div>

            {/* Music View / Player */}
            {/* When in music mode, this div takes up the space. When in chat mode, it's hidden/collapsed but MusicPlayer (mini) is fixed. */}
            <div className={activeTab === 'music' ? 'flex-1 h-full min-w-0' : ''}>
                <MusicPlayer viewMode={activeTab === 'music' ? 'full' : 'mini'} />
            </div>
        </div>
    );
};

export default DashboardLayout;
