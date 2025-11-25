import React from 'react';
import Sidebar from './Sidebar';

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
}

import MusicPlayer from './MusicPlayer';

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
    children,
    onOpenSettings,
    sessions,
    activeSessionId,
    onSelectSession,
    onNewChat,
    onDeleteSession
}) => {
    return (
        <div className="flex h-screen p-4 gap-4">
            <Sidebar
                onOpenSettings={onOpenSettings}
                sessions={sessions}
                activeSessionId={activeSessionId}
                onSelectSession={onSelectSession}
                onNewChat={onNewChat}
                onDeleteSession={onDeleteSession}
            />
            <main className="flex-1 h-full min-w-0">
                {children}
            </main>
            <MusicPlayer />
        </div>
    );
};

export default DashboardLayout;
