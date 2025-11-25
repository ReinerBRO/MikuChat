import React from 'react';
import ChatSessionList from './ChatSessionList';
import RandomMikuImage from './RandomMikuImage';

interface ChatSession {
    id: string;
    name: string;
    created_at: string;
    last_message_at: string;
    message_count: number;
}

interface SidebarProps {
    onOpenSettings?: () => void; // Kept as optional but unused for now to avoid breaking parent usage if not updated everywhere, but actually DashboardLayout passes it. Wait, DashboardLayout passes it to Sidebar?
    // DashboardLayout passes it to Sidebar in the chat view.
    // So I should keep it in the interface but maybe remove the usage?
    // Actually, I removed the button that uses it.
    // If I remove it from props, I must update DashboardLayout too.
    // DashboardLayout passes `onOpenSettings={onOpenSettings}` to Sidebar.
    // So I should keep it in props to avoid type error in DashboardLayout, or update DashboardLayout.
    // Let's update DashboardLayout to NOT pass it to Sidebar if Sidebar doesn't need it.
    // But for now, to fix lint "unused", I can just remove it from destructuring or keep it and suppress?
    // Better: Remove it from Sidebar props and update DashboardLayout.
    sessions: ChatSession[];
    activeSessionId: string | null;
    onSelectSession: (sessionId: string) => void;
    onNewChat: () => void;
    onDeleteSession: (sessionId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
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
            <div className="flex-1 overflow-hidden mb-4">
                <ChatSessionList
                    sessions={sessions}
                    activeSessionId={activeSessionId}
                    onSelectSession={onSelectSession}
                    onNewChat={onNewChat}
                    onDeleteSession={onDeleteSession}
                />
            </div>

            {/* Random Miku Image */}
            <div className="mb-4">
                <RandomMikuImage />
            </div>

            {/* Bottom Actions - Moved to NavigationRail */}
            {/* <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                    onClick={onOpenSettings}
                    className="w-full flex items-center gap-3 p-2 rounded-xl text-slate-500 hover:bg-black/5 hover:text-slate-800 transition-all"
                >
                    <Settings size={18} />
                    <span className="text-sm font-medium">Settings</span>
                </button>
            </div> */}
        </div>
    );
};

export default Sidebar;
