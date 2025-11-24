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
    onLogout
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
