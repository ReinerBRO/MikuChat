import React, { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { Live2DModel } from 'pixi-live2d-display';

// Expose PIXI to window for the plugin to work
if (typeof window !== 'undefined') {
    (window as any).PIXI = PIXI;
}

interface Live2DAvatarProps {
    className?: string;
}

const Live2DAvatar: React.FC<Live2DAvatarProps> = ({ className }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const appRef = useRef<PIXI.Application | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        let mounted = true;

        const initLive2D = async () => {
            try {
                // Initialize Pixi Application with safer settings
                const pixiApp = new PIXI.Application({
                    view: canvasRef.current!,
                    backgroundAlpha: 0,
                    autoDensity: true,
                    antialias: true,
                    resolution: 1, // Fixed resolution to avoid issues
                    width: 300,
                    height: 400,
                });

                appRef.current = pixiApp;

                // Load Live2D Model with timeout
                const modelUrl = 'https://cdn.jsdelivr.net/gh/Eikanya/Live2d-model/Live2D/Miku/Miku.model.json';

                const loadPromise = Live2DModel.from(modelUrl);
                const timeoutPromise = new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('Model load timeout')), 15000)
                );

                const mikuModel = await Promise.race([loadPromise, timeoutPromise]);

                if (!mounted) {
                    pixiApp.destroy(true);
                    return;
                }

                pixiApp.stage.addChild(mikuModel);

                // Scale and Position
                const scaleX = 300 / mikuModel.width;
                const scaleY = 400 / mikuModel.height;
                const scale = Math.min(scaleX, scaleY) * 0.8;

                mikuModel.scale.set(scale);
                mikuModel.x = (300 - mikuModel.width * scale) / 2;
                mikuModel.y = 400 - mikuModel.height * scale;

                // Enable interaction (optional)
                mikuModel.on('hit', (hitAreas: string[]) => {
                    if (hitAreas.includes('body')) {
                        mikuModel.motion('tap_body');
                    }
                });

                setLoading(false);
            } catch (err) {
                console.error('Failed to load Live2D model:', err);
                if (mounted) {
                    setError('Failed to load avatar');
                    setLoading(false);
                }
            }
        };

        initLive2D();

        return () => {
            mounted = false;
            if (appRef.current) {
                appRef.current.destroy(true, { children: true });
                appRef.current = null;
            }
        };
    }, []);

    if (error) {
        return (
            <div className={`relative ${className} flex items-center justify-center`}>
                <div className="text-xs text-slate-400 text-center p-4">
                    <div className="mb-2">😢</div>
                    <div>Avatar unavailable</div>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative ${className}`}>
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-lg">
                    <div className="text-xs text-miku animate-pulse">Loading Miku...</div>
                </div>
            )}
            <canvas ref={canvasRef} className="pointer-events-auto" />
        </div>
    );
};

export default Live2DAvatar;
