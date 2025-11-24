import React, { useState, useEffect } from 'react';
import { X, Moon, Sun, Monitor, Sliders } from 'lucide-react';

interface SettingsProps {
    isOpen: boolean;
    onClose: () => void;
    currentTheme: string;
    onThemeChange: (theme: string) => void;
    bgOpacity: number;
    onOpacityChange: (opacity: number) => void;
}

const Settings: React.FC<SettingsProps> = ({
    isOpen,
    onClose,
    currentTheme,
    onThemeChange,
    bgOpacity,
    onOpacityChange
}) => {
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
