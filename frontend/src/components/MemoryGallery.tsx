import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Sparkles, BookHeart, Heart, ChevronLeft, ChevronRight, PenTool, Star, Music, Cloud, Clock, MessageCircle } from 'lucide-react';
import { useGame } from '../context/GameContext';

interface Moment {
    id: string;
    content: string;
    timestamp: string;
    importance: number;
}

interface DayNode {
    summary: string;
    moments: Moment[];
}

interface GalleryData {
    first_encounter: string;
    days: { [key: string]: DayNode };
}

interface MikuInnerWorldProps {
    username: string;
    onClose: () => void;
}

// --- Custom Sticker Component ---
const Sticker: React.FC<{ icon: React.ReactNode, color: string, rotate?: number, delay?: number }> = ({ icon, color, rotate = 0, delay = 0 }) => (
    <motion.div
        initial={{ scale: 0, rotate: rotate - 10 }}
        animate={{ scale: 1, rotate: rotate }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay }}
        className={`relative inline-flex items-center justify-center p-3 rounded-2xl shadow-[0_4px_0_rgba(0,0,0,0.1)] border-2 border-white`}
        style={{ backgroundColor: color }}
    >
        <div className="text-white drop-shadow-md">
            {icon}
        </div>
        {/* Shine effect */}
        <div className="absolute top-1 left-1 w-1/3 h-1/3 bg-white/30 rounded-full blur-[1px]"></div>
    </motion.div>
);

const MikuInnerWorld: React.FC<MikuInnerWorldProps> = ({ username, onClose }) => {
    const { playVoice } = useGame();
    const [data, setData] = useState<GalleryData | null>(null);
    const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log("Miku Diary: Refreshing Data..."); // DEBUG LOG
        fetch(`http://localhost:8000/api/gallery?username=${username}`)
            .then(res => res.json())
            .then(d => {
                setData(d);
                setLoading(false);
                const days = Object.keys(d.days || {});
                if (days.length > 0) {
                    setSelectedDateKey(days.sort().reverse()[0]);
                }
            })
            .catch(e => {
                console.error("Failed to fetch diary:", e);
                setLoading(false);
            });
    }, [username]);

    useEffect(() => {
        playVoice('/audio/peek_diary.wav');
    }, []);

    const sortedDates = data ? Object.keys(data.days).sort((a, b) => b.localeCompare(a)) : [];
    const currentDay = (selectedDateKey && data?.days[selectedDateKey]) || null;

    const handlePrevDay = () => {
        if (!selectedDateKey || !sortedDates.length) return;
        const idx = sortedDates.indexOf(selectedDateKey);
        if (idx < sortedDates.length - 1) {
            setSelectedDateKey(sortedDates[idx + 1]);
        }
    };

    const handleNextDay = () => {
        if (!selectedDateKey || !sortedDates.length) return;
        const idx = sortedDates.indexOf(selectedDateKey);
        if (idx > 0) {
            setSelectedDateKey(sortedDates[idx - 1]);
        }
    };

    const formatTime = (ts: string) => {
        try {
            if (ts.includes('T')) return ts.split('T')[1].split('.')[0].slice(0, 5);
            return ts.split(' ')[1]?.slice(0, 5) || ts;
        } catch { return ts; }
    };

    if (loading) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-[#f0f8ff] relative z-50">
                <div className="relative">
                    <Sticker icon={<Sparkles size={32} />} color="#39c5bb" rotate={10} />
                </div>
                <span className="text-xl font-display font-bold mt-6 text-miku-dark tracking-widest animate-pulse">少女祈祷中...</span>
            </div>
        );
    }

    if (!data || sortedDates.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-[#f8fcfc] relative z-50 p-8 text-center overflow-hidden">
                <div className="absolute top-20 left-20 animate-bounce duration-[2000ms]">
                    <Sticker icon={<Cloud size={32} />} color="#a0d8ef" rotate={-10} />
                </div>

                <div className="mb-8 relative">
                    <div className="absolute inset-0 bg-miku/20 blur-2xl rounded-full"></div>
                    <BookHeart size={100} className="text-miku relative z-10 drop-shadow-xl" />
                </div>

                <h2 className="text-3xl font-bold text-slate-700 mb-4 font-display">
                    Miku 的秘密日记
                </h2>

                <p className="max-w-md text-slate-500 mb-10 leading-relaxed font-medium">
                    日记本还是空白的呢...<br />
                    就像未被踩过的雪地一样。<br />
                    多和 <span className="text-miku font-bold">Miku</span> 聊聊天，<br />
                    一起创造属于我们的可爱回忆吧！✨
                </p>

                <button
                    onClick={onClose}
                    className="px-8 py-3 rounded-full bg-miku text-white font-bold shadow-[0_4px_0_#2a9c94] active:shadow-none active:translate-y-1 transition-all"
                >
                    💖 开始第一篇日记
                </button>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-[#eef6f6] overflow-hidden relative font-sans">
            {/* Header */}
            <header className="flex-shrink-0 px-6 py-4 bg-white shadow-sm border-b border-miku/10 flex justify-between items-center z-20">
                <div className="flex items-center gap-4">
                    <Sticker icon={<BookHeart size={20} />} color="#39c5bb" rotate={-5} />
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Miku 的秘密日记</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Memory Storage</p>
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
                    <X size={24} />
                </button>
            </header>

            <div className="flex-1 flex overflow-hidden relative">

                {/* SIDEBAR - TIMELINE */}
                <div className="w-64 bg-white border-r border-dashed border-slate-200 flex-shrink-0 flex flex-col z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                    <div className="p-6 pb-2">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Calendar size={14} /> 时间轴
                        </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                        {sortedDates.map((date, index) => {
                            const isSelected = selectedDateKey === date;
                            return (
                                <button
                                    key={date}
                                    onClick={() => setSelectedDateKey(date)}
                                    className={`w-full group relative pl-8 pr-4 py-3 rounded-xl transition-all text-left border-2 ${isSelected
                                            ? 'bg-blue-50 border-blue-200'
                                            : 'bg-transparent border-transparent hover:bg-slate-50'
                                        }`}
                                >
                                    {/* Timeline line connecting dots */}
                                    {index !== sortedDates.length - 1 && (
                                        <div className="absolute left-[19px] top-8 bottom-[-8px] w-0.5 bg-slate-200"></div>
                                    )}

                                    {/* Dot */}
                                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 z-10 transition-all ${isSelected
                                            ? 'bg-blue-400 border-blue-400 scale-125'
                                            : 'bg-white border-slate-300 group-hover:border-blue-300'
                                        }`}></div>

                                    <span className={`text-sm font-bold font-mono ${isSelected ? 'text-blue-500' : 'text-slate-500'}`}>
                                        {date}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* MAIN CONTENT */}
                <div className="flex-1 overflow-y-auto bg-[#f4f9f9]">
                    <div className="max-w-4xl mx-auto p-8 pb-24">

                        {/* Date Navigation Header */}
                        <div className="flex items-center justify-between mb-8">
                            <button onClick={handlePrevDay} disabled={sortedDates.indexOf(selectedDateKey!) === sortedDates.length - 1} className="p-3 bg-white rounded-full shadow-sm text-slate-400 hover:text-miku disabled:opacity-30 transition-all">
                                <ChevronLeft />
                            </button>

                            <div className="flex flex-col items-center">
                                <motion.div
                                    key={selectedDateKey}
                                    initial={{ y: -10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="bg-white px-6 py-2 rounded-full shadow-sm border border-slate-100 flex items-center gap-3"
                                >
                                    <Clock size={16} className="text-slate-400" />
                                    <span className="text-xl font-bold text-slate-700 font-mono tracking-tight">{selectedDateKey}</span>
                                </motion.div>
                            </div>

                            <button onClick={handleNextDay} disabled={sortedDates.indexOf(selectedDateKey!) === 0} className="p-3 bg-white rounded-full shadow-sm text-slate-400 hover:text-miku disabled:opacity-30 transition-all">
                                <ChevronRight />
                            </button>
                        </div>

                        {currentDay && (
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={selectedDateKey}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden relative"
                                >
                                    {/* Notebook Binding Effect */}
                                    <div className="absolute left-0 top-0 bottom-0 w-8 bg-[url('https://www.transparenttextures.com/patterns/notebook.png')] opacity-10 border-r border-slate-100"></div>

                                    {/* Summary Card */}
                                    <div className="p-8 pl-14 relative border-b border-dashed border-slate-100 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
                                        <div className="flex items-start gap-4">
                                            <div className="mt-1">
                                                <Sticker icon={<PenTool size={18} />} color="#60a5fa" rotate={-10} delay={0.1} />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-xs font-bold text-blue-400 mb-2 uppercase tracking-wide">今日心情</h3>
                                                <p className="text-slate-700 text-lg font-medium leading-relaxed italic">
                                                    "{currentDay.summary}"
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Entries Timeline - CLEAN & FIXED */}
                                    <div className="p-8 pl-8 md:pl-10 relative">

                                        {/* Main Vertical Line */}
                                        <div className="absolute left-[39px] top-6 bottom-6 w-0.5 bg-slate-200"></div>

                                        <div className="space-y-10">
                                            {currentDay.moments.map((moment, index) => {
                                                const isSpecial = moment.importance > 5;
                                                const MomentIcon = isSpecial ? Heart : Sparkles;

                                                return (
                                                    <motion.div
                                                        key={moment.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: index * 0.1 }}
                                                        className="relative pl-14 group"
                                                    >
                                                        {/* Node Dot on Line */}
                                                        <div className={`absolute left-[32px] top-6 w-4 h-4 rounded-full border-[3px] border-white z-10 transition-all duration-300 group-hover:scale-125 shadow-sm ${isSpecial ? 'bg-pink-400 ring-4 ring-pink-50' : 'bg-miku ring-4 ring-slate-50'
                                                            }`}></div>

                                                        {/* Content Card (No complex CSS tails) */}
                                                        <div className={`relative p-5 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border ${isSpecial
                                                                ? 'bg-gradient-to-br from-pink-50/50 to-white border-pink-100'
                                                                : 'bg-white border-slate-100 hover:border-miku/30'
                                                            }`}>
                                                            {/* Header Row: Time + Icon */}
                                                            <div className="flex justify-between items-center mb-3">
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`px-2.5 py-1 rounded-md text-xs font-bold font-mono ${isSpecial ? 'bg-pink-100 text-pink-500' : 'bg-slate-100 text-slate-500'
                                                                        }`}>
                                                                        {formatTime(moment.timestamp)}
                                                                    </div>
                                                                </div>
                                                                <MomentIcon size={14} className={`${isSpecial ? 'text-pink-300' : 'text-slate-200'} group-hover:text-miku transition-colors`} />
                                                            </div>

                                                            {/* Text Content */}
                                                            <p className="text-slate-700 font-medium leading-relaxed">
                                                                {moment.content}
                                                            </p>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Simple Footer Decoration */}
                                    {currentDay.moments.length > 2 && (
                                        <div className="absolute bottom-6 right-6 opacity-80 rotate-12">
                                            <Star size={32} className="text-yellow-200 fill-yellow-200" />
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MikuInnerWorld;
