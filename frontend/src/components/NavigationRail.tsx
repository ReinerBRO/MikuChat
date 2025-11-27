import React from 'react';
import { MessageCircle, Music, Settings, LogOut, Newspaper } from 'lucide-react';
import { motion } from 'framer-motion';

interface NavigationRailProps {
    activeTab: 'chat' | 'music' | 'news' | 'settings';
    onTabChange: (tab: 'chat' | 'music' | 'news' | 'settings') => void;
    onLogout: () => void;
}

const NavigationRail: React.FC<NavigationRailProps> = ({ activeTab, onTabChange, onLogout }) => {
    const navItems = [
        { id: 'chat', icon: MessageCircle, label: 'Chat' },
        { id: 'music', icon: Music, label: 'Music' },
        { id: 'news', icon: Newspaper, label: 'News' },
        { id: 'settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <div className="w-16 h-full glass-panel rounded-2xl flex flex-col items-center py-6 gap-6 mr-4 shrink-0">
            {/* Logo Placeholder */}
            <div className="w-10 h-10 bg-gradient-to-br from-miku to-magenta rounded-xl flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-miku/20 mb-4">
                M
            </div>

            {/* Nav Items */}
            <div className="flex-1 flex flex-col gap-4 w-full px-2">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onTabChange(item.id as any)}
                        className={`relative w-full aspect-square rounded-xl flex items-center justify-center transition-all group ${activeTab === item.id
                                ? 'bg-miku text-white shadow-lg shadow-miku/30'
                                : 'text-slate-400 hover:bg-white/50 hover:text-miku-dark'
                            }`}
                        title={item.label}
                    >
                        <item.icon size={24} />
                        {activeTab === item.id && (
                            <motion.div
                                layoutId="active-indicator"
                                className="absolute -right-1 w-1 h-8 bg-miku rounded-l-full"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Logout */}
            <button
                onClick={onLogout}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
                title="Logout"
            >
                <LogOut size={20} />
            </button>
        </div>
    );
};

export default NavigationRail;
