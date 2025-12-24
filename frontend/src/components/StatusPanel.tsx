import React, { useState, useRef, useEffect } from 'react';
import { Heart, Coins, Smile, GripHorizontal, ChevronUp, ChevronDown } from 'lucide-react';
import { useGame, AFFINITY_LEVELS } from '../context/GameContext';

const StatusPanel = () => {
    const { affinity, negiCoins, mood, currentLevel } = useGame();

    // Draggable state
    const [position, setPosition] = useState(() => {
        const saved = localStorage.getItem('miku_status_panel_pos');
        return saved ? JSON.parse(saved) : { x: 20, y: 20 };
    });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const panelRef = useRef<HTMLDivElement>(null);

    // Collapsed state
    const [isCollapsed, setIsCollapsed] = useState(() => {
        return localStorage.getItem('miku_status_panel_collapsed') === 'true';
    });

    // Save position to localStorage
    useEffect(() => {
        localStorage.setItem('miku_status_panel_pos', JSON.stringify(position));
    }, [position]);

    // Save collapsed state
    useEffect(() => {
        localStorage.setItem('miku_status_panel_collapsed', String(isCollapsed));
    }, [isCollapsed]);

    // Handle drag
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!panelRef.current) return;
        setIsDragging(true);
        const rect = panelRef.current.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            setPosition({
                x: e.clientX - dragOffset.x,
                y: e.clientY - dragOffset.y
            });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset]);

    // Calculate progress to next level
    const nextLevel = AFFINITY_LEVELS.find(l => l.level === currentLevel.level + 1);
    const prevLevelMin = currentLevel.min;
    const nextLevelMin = nextLevel ? nextLevel.min : (prevLevelMin + 100);

    const progress = Math.min(100, Math.max(0,
        ((affinity - prevLevelMin) / (nextLevelMin - prevLevelMin)) * 100
    ));

    return (
        <div
            ref={panelRef}
            className="fixed z-40 select-none"
            style={{ left: position.x, top: position.y }}
        >
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden min-w-[180px]">
                {/* Drag Handle & Collapse Toggle */}
                <div
                    className="flex items-center justify-between px-2 py-1.5 bg-slate-100/80 dark:bg-slate-700/80 cursor-move border-b border-slate-200 dark:border-slate-600"
                    onMouseDown={handleMouseDown}
                >
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                        <GripHorizontal size={14} />
                        <span>状态</span>
                    </div>
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        {isCollapsed ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronUp size={14} className="text-slate-400" />}
                    </button>
                </div>

                {/* Content */}
                {!isCollapsed && (
                    <div className="p-3 flex flex-col gap-2">
                        {/* Affinity Row */}
                        <div className="flex flex-col gap-1">
                            <div className="flex justify-between items-center text-xs">
                                <div className="flex items-center gap-1 font-bold">
                                    <Heart className={`w-3 h-3 ${currentLevel.color} fill-current`} />
                                    <span className="dark:text-white">Lv.{currentLevel.level} {currentLevel.title}</span>
                                </div>
                                <span className="text-slate-500">{affinity} / {nextLevelMin}</span>
                            </div>
                            {/* Progress Bar */}
                            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-pink-400 to-rose-500`}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>

                        <div className="h-px bg-slate-100 dark:bg-slate-700 my-0.5" />

                        {/* Stats Row */}
                        <div className="flex justify-between items-center">
                            {/* Coins */}
                            <div className="flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-lg">
                                <Coins className="w-3.5 h-3.5" />
                                <span>{negiCoins}</span>
                            </div>

                            {/* Mood */}
                            <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
                                <Smile className={`w-3.5 h-3.5 ${mood < 30 ? 'text-blue-400' : mood > 80 ? 'text-amber-400' : 'text-slate-400'}`} />
                                <span>{mood}% 心情</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatusPanel;
