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
    sessions: ChatSession[];
    activeSessionId: string | null;
    onSelectSession: (sessionId: string) => void;
    onNewChat: () => void;
    onDeleteSession: (sessionId: string) => void;
    collapsed?: boolean;
    onToggleCollapse?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    sessions,
    activeSessionId,
    onSelectSession,
    onNewChat,
    onDeleteSession,
    collapsed = false,
    onToggleCollapse
}) => {
    return (
        <div className={`h-full glass-panel rounded-2xl flex flex-col p-4 mr-4 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
            {/* Logo Area with Toggle */}
            <div className="flex items-center justify-between mb-6 px-2">
                {!collapsed && (
                    <>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-miku to-magenta rounded-lg flex items-center justify-center font-bold text-white">
                                M
                            </div>
                            <h1 className="text-xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-miku to-magenta">
                                MikuChat
                            </h1>
                        </div>
                    </>
                )}
                {onToggleCollapse && (
                    <button
                        onClick={onToggleCollapse}
                        className="p-2 hover:bg-miku/10 rounded-lg transition-colors"
                        title={collapsed ? "Expand" : "Collapse"}
                    >
                        {collapsed ? '→' : '←'}
                    </button>
                )}
            </div>

            {/* Chat Sessions */}
            {!collapsed && (
                <>
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
                </>
            )}
        </div>
    );
};

export default Sidebar;
