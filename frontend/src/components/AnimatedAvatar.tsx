import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface AnimatedAvatarProps {
    className?: string;
}

const AnimatedAvatar: React.FC<AnimatedAvatarProps> = ({ className }) => {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isClicked, setIsClicked] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;

                // Calculate offset from center (normalized to -1 to 1)
                const offsetX = (e.clientX - centerX) / (rect.width / 2);
                const offsetY = (e.clientY - centerY) / (rect.height / 2);

                setMousePos({ x: offsetX * 10, y: offsetY * 10 }); // Max 10px movement
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const handleClick = () => {
        setIsClicked(true);
        setTimeout(() => setIsClicked(false), 600);
    };

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <motion.div
                className="relative cursor-pointer"
                onClick={handleClick}
                animate={{
                    y: [0, -10, 0],
                    scale: isClicked ? [1, 1.1, 1] : 1,
                    x: mousePos.x,
                }}
                transition={{
                    y: {
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    },
                    scale: {
                        duration: 0.6,
                        ease: "easeOut"
                    },
                    x: {
                        duration: 0.3,
                        ease: "easeOut"
                    }
                }}
            >
                {/* Avatar Image */}
                <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-miku/30 shadow-lg shadow-miku/20">
                    <img
                        src="/miku_avatar.png"
                        alt="Miku"
                        className="w-full h-full object-cover"
                    />

                    {/* Shine effect overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Click hearts animation */}
                {isClicked && (
                    <>
                        <motion.div
                            initial={{ opacity: 1, y: 0, scale: 0 }}
                            animate={{ opacity: 0, y: -50, scale: 1.5 }}
                            transition={{ duration: 0.6 }}
                            className="absolute top-1/4 left-1/4 text-3xl"
                        >
                            💙
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 1, y: 0, scale: 0 }}
                            animate={{ opacity: 0, y: -50, scale: 1.5 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="absolute top-1/4 right-1/4 text-3xl"
                        >
                            💚
                        </motion.div>
                    </>
                )}
            </motion.div>

            {/* Decorative elements */}
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -top-4 -right-4 text-4xl opacity-70"
            >
                ✨
            </motion.div>
            <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute -bottom-4 -left-4 text-4xl opacity-70"
            >
                🎵
            </motion.div>
        </div>
    );
};

export default AnimatedAvatar;
