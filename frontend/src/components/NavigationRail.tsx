import { MessageSquare, Music, Settings, LogOut, Newspaper, Box, ShoppingBag, BookHeart } from 'lucide-react';
import { motion } from 'framer-motion';

interface NavigationRailProps {
    activeTab: 'chat' | 'news' | 'music' | 'settings' | '3d' | 'shop' | 'memories';
    onTabChange: (tab: 'chat' | 'news' | 'music' | 'settings' | '3d' | 'shop' | 'memories') => void;
    onLogout: () => void;
}

export default function NavigationRail({ activeTab, onTabChange, onLogout }: NavigationRailProps) {
    const navItems = [
        { id: 'chat', icon: MessageSquare, label: 'Chat' },
        { id: 'news', icon: Newspaper, label: 'News' },
        { id: 'music', icon: Music, label: 'Music' },
        { id: 'memories', icon: BookHeart, label: 'Inner World' },
        { id: '3d', icon: Box, label: '3D Miku' },
        { id: 'shop', icon: ShoppingBag, label: 'Shop' },
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
}
