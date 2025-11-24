import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Star, Music, Sparkles } from 'lucide-react';

interface LandingPageProps {
    onEnter: () => void;
}

interface ClickEffect {
    id: number;
    x: number;
    y: number;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
    const [text, setText] = useState('');
    const fullText = 'INITIALIZING MIKU_OS...';
    const [showButton, setShowButton] = useState(false);
    const [clicks, setClicks] = useState<ClickEffect[]>([]);

    useEffect(() => {
        let currentIndex = 0;
        const interval = setInterval(() => {
            if (currentIndex <= fullText.length) {
                setText(fullText.slice(0, currentIndex));
                currentIndex++;
            } else {
                clearInterval(interval);
                setShowButton(true);
            }
        }, 150);

        return () => clearInterval(interval);
    }, []);

    const handleBackgroundClick = (e: React.MouseEvent) => {
        const newClick = {
            id: Date.now(),
            x: e.clientX,
            y: e.clientY
        };
        setClicks(prev => [...prev, newClick]);

        // Remove the click effect after animation
        setTimeout(() => {
            setClicks(prev => prev.filter(click => click.id !== newClick.id));
        }, 1000);
    };

    return (
        <div
            onClick={handleBackgroundClick}
            className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center overflow-hidden font-pixel text-slate-700 cursor-pointer"
        >
            {/* Pixel Art Background Pattern */}
            <div className="absolute inset-0 bg-pixel-pattern opacity-50 pointer-events-none" />

            {/* Click Effects (Leeks) */}
            <AnimatePresence>
                {clicks.map(click => (
                    <motion.div
                        key={click.id}
                        initial={{ opacity: 1, scale: 0.5, rotate: -45, x: click.x, y: click.y }}
                        animate={{ opacity: 0, scale: 1.5, rotate: 45, y: click.y - 100 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="absolute pointer-events-none text-4xl z-40"
                        style={{ left: 0, top: 0 }} // Positioning handled by motion initial/animate
                    >
                        🥬
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Floating Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{ y: [0, -20, 0], rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/4 left-1/4 text-miku/30"
                >
                    <Music size={48} />
                </motion.div>
                <motion.div
                    animate={{ y: [0, 20, 0], rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-1/4 right-1/4 text-magenta/30"
                >
                    <Heart size={48} />
                </motion.div>
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/3 right-1/3 text-yellow-400/40"
                >
                    <Star size={32} />
                </motion.div>
            </div>

            {/* Main Content */}
            <div className="relative z-50 flex flex-col items-center gap-8 pointer-events-none">
                {/* Title */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="relative"
                >
                    <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-miku via-miku-light to-miku animate-pulse">
                        MikuChat
                    </h1>
                    {/* Pixel Shadow */}
                    <h1 className="absolute top-1 left-1 text-6xl md:text-8xl font-bold tracking-tighter text-slate-200 -z-10">
                        MikuChat
                    </h1>

                    {/* Cute Sparkles */}
                    <Sparkles className="absolute -top-6 -right-6 text-yellow-400 animate-bounce-slow" size={40} />
                </motion.div>

                {/* Typing Text */}
                <div className="h-8 flex items-center gap-2 text-xl md:text-2xl text-slate-500">
                    <Heart size={20} className="text-magenta animate-pulse" fill="currentColor" />
                    <span>{text}</span>
                    <span className="animate-pulse text-miku">|</span>
                </div>

                {/* Enter Button */}
                {showButton && (
                    <div className="pointer-events-auto">
                        <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ scale: 1.05, rotate: [-1, 1, -1, 0] }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onEnter();
                            }}
                            className="mt-8 px-12 py-4 bg-white border-4 border-miku text-miku rounded-2xl shadow-[4px_4px_0px_0px_rgba(93,217,210,0.5)] hover:shadow-[2px_2px_0px_0px_rgba(93,217,210,0.8)] hover:translate-y-[2px] hover:translate-x-[2px] transition-all duration-200 group relative overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center gap-3 text-xl font-bold">
                                START <Star size={20} className="fill-current" />
                            </span>
                        </motion.button>
                    </div>
                )}
            </div>

            {/* Footer Status */}
            <div className="absolute bottom-8 text-xs text-slate-400 font-pixel flex gap-2 items-center pointer-events-none">
                <span>Made with</span>
                <Heart size={12} className="text-red-400 fill-current" />
                <span>for You</span>
            </div>
        </div>
    );
};

export default LandingPage;
