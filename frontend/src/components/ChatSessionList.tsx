import React, { useState } from 'react';
import { Plus, MessageSquare, Trash2, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatSession {
    id: string;
    name: string;
    created_at: string;
    last_message_at: string;
    message_count: number;
}

interface ChatSessionListProps {
    sessions: ChatSession[];
    activeSessionId: string | null;
    onSelectSession: (sessionId: string) => void;
    onNewChat: () => void;
    onDeleteSession: (sessionId: string) => void;
}

const ChatSessionList: React.FC<ChatSessionListProps> = ({
    sessions,
    activeSessionId,
    onSelectSession,
    onNewChat,
    onDeleteSession
}) => {
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const handleDelete = (sessionId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (deleteConfirm === sessionId) {
            onDeleteSession(sessionId);
            setDeleteConfirm(null);
        } else {
            setDeleteConfirm(sessionId);
            setTimeout(() => setDeleteConfirm(null), 3000);
        }
    };

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="flex flex-col h-full">
            {/* New Chat Button */}
            <button
                onClick={onNewChat}
                className="w-full mb-4 p-3 bg-gradient-to-r from-miku to-blue-500 text-white rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-miku/30 transition-all"
            >
                <Plus size={20} />
                <span className="font-medium">New Chat</span>
            </button>

            {/* Session List */}
            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                <AnimatePresence>
                    {sessions.map((session) => (
                        <motion.div
                            key={session.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className={`group relative p-3 rounded-xl cursor-pointer transition-all ${activeSessionId === session.id
                                    ? 'bg-miku/10 border border-miku/30 shadow-[0_0_15px_rgba(93,217,210,0.1)]'
                                    : 'hover:bg-tech-panel/50 border border-transparent'
                                }`}
                            onClick={() => onSelectSession(session.id)}
                        >
                            <div className="flex items-start gap-2">
                                <MessageSquare size={16} className="text-miku mt-1 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-medium text-theme-text truncate">
                                        {session.name}
                                    </h3>
                                    <p className="text-xs text-theme-muted mt-1">
                                        {formatTime(session.last_message_at)} · {session.message_count} msgs
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => handleDelete(session.id, e)}
                                    className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-all ${deleteConfirm === session.id
                                            ? 'bg-red-500 text-white'
                                            : 'hover:bg-red-500/10 text-red-400'
                                        }`}
                                    title={deleteConfirm === session.id ? 'Click again to confirm' : 'Delete'}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {sessions.length === 0 && (
                    <div className="text-center text-theme-muted text-sm py-8">
                        No chats yet. Start a new one! 💬
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatSessionList;
