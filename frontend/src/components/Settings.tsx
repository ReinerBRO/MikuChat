import React, { useState, useEffect } from 'react';
import { X, Moon, Sun, Monitor, Sliders, User, LogOut } from 'lucide-react';

interface SettingsProps {
    isOpen: boolean;
    onClose: () => void;
    currentTheme: string;
    onThemeChange: (theme: string) => void;
    bgOpacity: number;
    onOpacityChange: (opacity: number) => void;
    currentUser: string;
    onUsernameChange: (newUsername: string) => void;
    onLogout: () => void;
    showAvatar: boolean;
    onShowAvatarChange: (show: boolean) => void;
    avatarMode: 'simple' | 'live2d';
    onAvatarModeChange: (mode: 'simple' | 'live2d') => void;
    live2dModelUrl: string;
    onLive2dModelUrlChange: (url: string) => void;
}

const Settings: React.FC<SettingsProps> = ({
    isOpen,
    onClose,
    currentTheme,
    onThemeChange,
    bgOpacity,
    onOpacityChange,
    currentUser,
    onUsernameChange,
    onLogout,
    showAvatar,
    onShowAvatarChange,
    avatarMode,
    onAvatarModeChange,
    live2dModelUrl,
    onLive2dModelUrlChange
}) => {
    const [editingUsername, setEditingUsername] = useState(false);
    const [newUsername, setNewUsername] = useState(currentUser);

    useEffect(() => {
        setNewUsername(currentUser);
    }, [currentUser]);
    const handleSaveUsername = () => {
        if (newUsername.trim()) {
            onUsernameChange(newUsername.trim());
            setEditingUsername(false);
        }
    };

    const handleCancelEdit = () => {
        setNewUsername(currentUser);
        setEditingUsername(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-miku/30 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Sliders size={20} className="text-miku" />
                        Settings
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                    >
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* User Profile */}
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-3 flex items-center gap-2">
                            <User size={16} className="text-miku" />
                            User Profile
                        </label>
                        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 space-y-3">
                            <div>
                                <span className="text-xs text-slate-500 dark:text-slate-400">Username</span>
                                {editingUsername ? (
                                    <div className="flex gap-2 mt-1">
                                        <input
                                            type="text"
                                            value={newUsername}
                                            onChange={(e) => setNewUsername(e.target.value)}
                                            className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:border-miku focus:ring-2 focus:ring-miku/20 outline-none"
                                            placeholder="Enter new username"
                                        />
                                        <button
                                            onClick={handleSaveUsername}
                                            className="px-3 py-2 bg-miku text-white rounded-lg hover:bg-miku-dark transition-colors text-sm font-medium"
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={handleCancelEdit}
                                            className="px-3 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors text-sm font-medium"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-slate-800 dark:text-white font-medium">{currentUser}</span>
                                        <button
                                            onClick={() => setEditingUsername(true)}
                                            className="text-xs text-miku hover:text-miku-dark transition-colors font-medium"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => {
                                    onLogout();
                                    onClose();
                                }}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors font-medium text-sm"
                            >
                                <LogOut size={16} />
                                Logout
                            </button>
                        </div>
                    </div>

                    {/* Theme Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-3">
                            Theme
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                onClick={() => onThemeChange('light')}
                                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${currentTheme === 'light'
                                    ? 'border-miku bg-miku/10 text-miku-dark'
                                    : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-miku/50'
                                    }`}
                            >
                                <Sun size={24} />
                                <span className="text-xs font-medium">Light</span>
                            </button>
                            <button
                                onClick={() => onThemeChange('dark')}
                                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${currentTheme === 'dark'
                                    ? 'border-miku bg-miku/10 text-miku-dark'
                                    : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-miku/50'
                                    }`}
                            >
                                <Moon size={24} />
                                <span className="text-xs font-medium">Dark</span>
                            </button>
                            <button
                                onClick={() => onThemeChange('cyber')}
                                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${currentTheme === 'cyber'
                                    ? 'border-miku bg-miku/10 text-miku-dark'
                                    : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-miku/50'
                                    }`}
                            >
                                <Monitor size={24} />
                                <span className="text-xs font-medium">Cyber</span>
                            </button>
                        </div>
                    </div>

                    {/* Background Opacity */}
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-3">
                            Background Opacity
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={bgOpacity}
                            onChange={(e) => onOpacityChange(Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-miku"
                        />
                        <div className="flex justify-between text-xs text-slate-400 mt-1">
                            <span>Transparent</span>
                            <span>Solid</span>
                        </div>
                    </div>

                    {/* Avatar Visibility */}
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                            Show Avatar
                        </label>
                        <button
                            onClick={() => onShowAvatarChange(!showAvatar)}
                            className={`w-12 h-6 rounded-full transition-colors relative ${showAvatar ? 'bg-miku' : 'bg-slate-300 dark:bg-slate-600'
                                }`}
                        >
                            <div
                                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${showAvatar ? 'translate-x-6' : 'translate-x-0'
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Avatar Mode */}
                    {showAvatar && (
                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-3">
                                Avatar Style
                            </label>
                            <div className="flex bg-slate-100 dark:bg-slate-700/50 rounded-xl p-1">
                                <button
                                    onClick={() => onAvatarModeChange('simple')}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${avatarMode === 'simple'
                                        ? 'bg-white dark:bg-slate-600 text-miku shadow-sm'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                                        }`}
                                >
                                    Simple
                                </button>
                                <button
                                    onClick={() => onAvatarModeChange('live2d')}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${avatarMode === 'live2d'
                                        ? 'bg-white dark:bg-slate-600 text-miku shadow-sm'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                                        }`}
                                >
                                    Live2D
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Custom Live2D Model URL */}
                    {showAvatar && avatarMode === 'live2d' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-3">
                                Live2D Model URL
                            </label>
                            <input
                                type="text"
                                value={live2dModelUrl}
                                onChange={(e) => onLive2dModelUrlChange(e.target.value)}
                                placeholder="https://..."
                                className="w-full px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700/50 border-none focus:ring-2 focus:ring-miku text-slate-700 dark:text-slate-200 text-sm mb-2"
                            />
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                <button
                                    onClick={() => onLive2dModelUrlChange('/live2d/miku/miku_pro_jp/runtime/miku_sample_t04.model3.json')}
                                    className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs text-slate-600 dark:text-slate-400 hover:bg-miku hover:text-white transition-colors whitespace-nowrap"
                                >
                                    Miku (Local)
                                </button>
                                <button
                                    onClick={() => onLive2dModelUrlChange('https://raw.githubusercontent.com/guansss/pixi-live2d-display/master/test/assets/haru/haru_greeter_t03.model3.json')}
                                    className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs text-slate-600 dark:text-slate-400 hover:bg-miku hover:text-white transition-colors whitespace-nowrap"
                                >
                                    Haru (Test)
                                </button>
                                <button
                                    onClick={() => onLive2dModelUrlChange('https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/shizuku/shizuku.model.json')}
                                    className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs text-slate-600 dark:text-slate-400 hover:bg-miku hover:text-white transition-colors whitespace-nowrap"
                                >
                                    Shizuku
                                </button>
                            </div>
                            <p className="text-xs text-slate-400">
                                Enter a direct link to a model.json or model3.json file.
                            </p>
                        </div>
                    )}
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-miku text-white rounded-xl hover:bg-miku-dark transition-colors font-medium"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
