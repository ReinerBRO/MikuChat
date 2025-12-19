import React from 'react';
import { Heart, Coins, Smile } from 'lucide-react';
import { useGame, AFFINITY_LEVELS } from '../context/GameContext';

const StatusPanel = () => {
    const { affinity, negiCoins, mood, currentLevel } = useGame();

    // Calculate progress to next level
    const nextLevel = AFFINITY_LEVELS.find(l => l.level === currentLevel.level + 1);
    const prevLevelMin = currentLevel.min;
    const nextLevelMin = nextLevel ? nextLevel.min : (prevLevelMin + 100); // Infinite scaling logic if maxed

    // Progress within current level
    const progress = Math.min(100, Math.max(0,
        ((affinity - prevLevelMin) / (nextLevelMin - prevLevelMin)) * 100
    ));

    return (
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-xl p-3 shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col gap-2 min-w-[200px]">
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

            <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />

            {/* Stats Row */}
            <div className="flex justify-between items-center">
                {/* Coins */}
                <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-lg">
                    <Coins className="w-4 h-4" />
                    <span>{negiCoins}</span>
                </div>

                {/* Mood */}
                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <Smile className={`w-4 h-4 ${mood < 30 ? 'text-blue-400' : mood > 80 ? 'text-amber-400' : 'text-slate-400'}`} />
                    <span>{mood}% Mood</span>
                </div>
            </div>
        </div>
    );
};

export default StatusPanel;
