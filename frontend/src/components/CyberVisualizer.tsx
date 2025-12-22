import React, { useEffect, useRef } from 'react';

interface CyberVisualizerProps {
    isActive: boolean;
    className?: string;
}

const CyberVisualizer: React.FC<CyberVisualizerProps> = ({ isActive, className = '' }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let time = 0;

        const particles: {
            x: number;
            y: number;
            size: number;
            vx: number;
            vy: number;
            color: string;
            life: number;
            maxLife: number
        }[] = [];

        const COLORS = ['#39c5bb', '#ff00ff', '#ffffff', '#22aaff'];

        const resize = () => {
            const parent = canvas.parentElement;
            if (parent) {
                canvas.width = parent.offsetWidth;
                canvas.height = parent.offsetHeight;
            }
        };
        window.addEventListener('resize', resize);
        resize();

        const spawnParticle = (forceActive: boolean = false, initial: boolean = false) => {
            const width = canvas.width;
            const height = canvas.height;

            // If initial, spawn anywhere vertically. If running, spawn at bottom.
            const x = Math.random() * width;
            const y = initial ? Math.random() * height : height + 10;

            const size = Math.floor(Math.random() * 5 + 3) * 2; // Bigger sizes: 6, 8, 10, 12, 14

            const speed = forceActive ? Math.random() * 3 + 2 : Math.random() * 1.5 + 0.5;
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.5; // Slight cone

            particles.push({
                x,
                y,
                size,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                life: 0,
                maxLife: 300 // Ensure they reach the top
            });
        };

        // Pre-warm particles so screen isn't empty
        for (let i = 0; i < 30; i++) spawnParticle(false, true);

        const render = () => {
            time++;
            const width = canvas.width;
            const height = canvas.height;

            ctx.clearRect(0, 0, width, height);

            // Spawn Rate
            // Active: Spawn often (every 2 frames)
            // Idle: Spawn moderate (every 10 frames)
            const spawnRate = isActive ? 2 : 10;
            if (time % spawnRate === 0) {
                spawnParticle(isActive);
                if (isActive) spawnParticle(isActive); // Double spawn when active
            }

            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];

                p.x += p.vx;
                p.y += p.vy;
                p.life++;

                // Jitter
                if (isActive && Math.random() > 0.8) {
                    p.x += (Math.random() - 0.5) * 6;
                } else if (Math.random() > 0.95) {
                    p.x += (Math.random() - 0.5) * 2;
                }

                ctx.fillStyle = p.color;

                // Fade
                const alpha = Math.min(1, 1.5 - (p.life / p.maxLife)); // Stay visible longer
                ctx.globalAlpha = alpha;

                ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);

                // Simple Shadow/Glow
                if (isActive) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.fillRect(Math.floor(p.x - 2), Math.floor(p.y - 2), p.size + 4, p.size + 4);
                }

                if (p.life >= p.maxLife || p.x < -50 || p.x > width + 50 || p.y < -50) {
                    particles.splice(i, 1);
                }
            }
            ctx.globalAlpha = 1.0;

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [isActive]);

    return (
        <canvas
            ref={canvasRef}
            className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
        />
    );
};

export default CyberVisualizer;
