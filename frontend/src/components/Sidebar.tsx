import React from 'react';
import { Home, MessageSquare, Settings, User, Heart, Activity, Folder } from 'lucide-react';

const Sidebar: React.FC = () => {
    const menuItems = [
        { icon: Home, label: 'Dashboard', active: false },
        { icon: MessageSquare, label: 'Chat', active: true },
        { icon: Folder, label: 'Memories', active: false },
        { icon: User, label: 'Profile', active: false },
        { icon: Settings, label: 'Settings', active: false },
    ];

    return (
        <div className="w-64 h-full glass-panel rounded-2xl flex flex-col p-4 mr-4">
            {/* Logo Area */}
            <div className="flex items-center gap-2 mb-8 px-2">
                <div className="w-8 h-8 bg-gradient-to-br from-miku to-magenta rounded-lg flex items-center justify-center font-bold text-white">
                    M
                </div>
                <h1 className="text-xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-miku to-magenta">
                    MikuChat
                </h1>
            </div>

            {/* Menu */}
            <nav className="flex-1 space-y-2">
                {menuItems.map((item, index) => (
                    <button
                        key={index}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${item.active
                                ? 'bg-miku/20 text-miku border border-miku/50 shadow-[0_0_15px_rgba(57,197,187,0.2)]'
                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <item.icon size={20} />
                        <span className="font-medium">{item.label}</span>
                    </button>
                ))}
            </nav>

            {/* Stats Widget */}
            <div className="mt-auto bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">Sync Ratio</span>
                    <span className="text-xs text-miku font-bold">98%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden mb-4">
                    <div className="w-[98%] h-full bg-gradient-to-r from-miku to-blue-500 rounded-full animate-pulse"></div>
                </div>

                <div className="flex items-center gap-2 text-xs text-magenta">
                    <Heart size={12} className="fill-current" />
                    <span>Mood: Happy</span>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
