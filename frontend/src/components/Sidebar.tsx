import React from 'react';
import { Settings, User } from 'lucide-react';
import ChatSessionList from './ChatSessionList';

interface ChatSession {
    id: string;
    name: string;
    created_at: string;
    last_message_at: string;
    message_count: number;
}

interface SidebarProps {
    onOpenSettings?: () => void;
    sessions: ChatSession[];
    activeSessionId: string | null;
    onSelectSession: (sessionId: string) => void;
    onNewChat: () => void;
    onDeleteSession: (sessionId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    onOpenSettings,
    sessions,
    activeSessionId,
    onSelectSession,
    onNewChat,
    onDeleteSession
}) => {
    return (
        <div className="w-64 h-full glass-panel rounded-2xl flex flex-col p-4 mr-4">
            {/* Logo Area */}
            <div className="flex items-center gap-2 mb-6 px-2">
                <div className="w-8 h-8 bg-gradient-to-br from-miku to-magenta rounded-lg flex items-center justify-center font-bold text-white">
                    M
                </div>
                <h1 className="text-xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-miku to-magenta">
                    MikuChat
                </h1>
            </div>

            {/* Chat Sessions */}
            <div className="flex-1 overflow-hidden">
                <ChatSessionList
                    sessions={sessions}
                    activeSessionId={activeSessionId}
                    onSelectSession={onSelectSession}
                    onNewChat={onNewChat}
                    onDeleteSession={onDeleteSession}
                />
            </div>

            {/* Bottom Actions */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
                <button
                    onClick={onOpenSettings}
                    className="w-full flex items-center gap-3 p-2 rounded-xl text-slate-500 hover:bg-black/5 hover:text-slate-800 transition-all"
                >
                    <Settings size={18} />
                    <span className="text-sm font-medium">Settings</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
