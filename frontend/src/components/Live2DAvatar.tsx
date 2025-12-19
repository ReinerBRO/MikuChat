import React, { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { useGame } from '../context/GameContext';

interface Live2DAvatarProps {
    className?: string;
    modelUrl: string;
}

const Live2DAvatar: React.FC<Live2DAvatarProps> = ({ className, modelUrl }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const appRef = useRef<PIXI.Application | null>(null);
    const clickHandlerRef = useRef<((event: MouseEvent) => void) | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { triggerInteraction } = useGame();
    const triggerInteractionRef = useRef(triggerInteraction);

    useEffect(() => {
        triggerInteractionRef.current = triggerInteraction;
    }, [triggerInteraction]);

    useEffect(() => {
        console.log('Live2DAvatar mounted, modelUrl:', modelUrl);
        if (!canvasRef.current) return;

        let mounted = true;
        setLoading(true);
        setError(null);

        const initLive2D = async () => {
            console.log('Starting initLive2D...');
            try {
                // Expose PIXI to window for the plugin to work
                if (typeof window !== 'undefined') {
                    console.log('Exposing PIXI to window');
                    (window as any).PIXI = PIXI;
                }

                // Dynamically import pixi-live2d-display
                console.log('Importing pixi-live2d-display...');
                const { Live2DModel } = await import('pixi-live2d-display');
                console.log('pixi-live2d-display imported');

                // Initialize Pixi Application
                console.log('Creating PIXI Application...');
                const pixiApp = new PIXI.Application({
                    view: canvasRef.current!,
                    backgroundAlpha: 0,
                    autoDensity: true,
                    antialias: true,
                    resolution: 1,
                    width: 300,
                    height: 400,
                    autoStart: true,
                    eventMode: 'none' as any,
                    eventFeatures: {
                        move: false,
                        globalMove: false,
                        click: false,
                        wheel: false
                    } as any
                });

                appRef.current = pixiApp;

                // Load Live2D Model
                console.log('Loading model from:', modelUrl);
                const loadPromise = Live2DModel.from(modelUrl);
                const timeoutPromise = new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('Model load timeout')), 30000)
                );

                const mikuModel = await Promise.race([loadPromise, timeoutPromise]);

                // Monkey-patch interaction
                const modelForPatch = mikuModel as any;
                if (modelForPatch.registerInteraction) modelForPatch.registerInteraction = () => { };
                if (modelForPatch.internalModel && modelForPatch.internalModel.registerInteraction) {
                    modelForPatch.internalModel.registerInteraction = () => { };
                }

                if (!mounted) {
                    pixiApp.destroy(false);
                    mikuModel.destroy();
                    return;
                }

                pixiApp.stage.addChild(mikuModel as any);
                pixiApp.renderer.render(pixiApp.stage);

                // Scale and Position
                const currentWidth = mikuModel.width;
                const currentHeight = mikuModel.height;
                const scaleX = 300 / currentWidth;
                const scaleY = 400 / currentHeight;
                const scale = Math.min(scaleX, scaleY) * 0.9;

                mikuModel.scale.set(scale);
                mikuModel.x = (300 - mikuModel.width) / 2;
                mikuModel.y = 400 - mikuModel.height;

                // Handle clicks with Game Context
                const modelAny = mikuModel as any;
                const handleCanvasClick = (event: MouseEvent) => {
                    console.log('=== Canvas clicked! ===');

                    // Trigger game interaction!
                    triggerInteractionRef.current('touch');

                    // Play Animation
                    const motionsToTry = ['TapBody', 'tap_body', 'Tap', 'tap', 'Idle', 'idle', 'Flick', 'flick', null];
                    const randomMotion = motionsToTry[Math.floor(Math.random() * motionsToTry.length)];

                    try {
                        if (typeof modelAny.motion === 'function') {
                            modelAny.motion(randomMotion);
                        }
                    } catch (e) {
                        console.error('Failed to play motion:', e);
                    }
                };

                clickHandlerRef.current = handleCanvasClick;
                canvasRef.current!.addEventListener('click', handleCanvasClick);
                canvasRef.current!.style.cursor = 'pointer';

                setLoading(false);
            } catch (err) {
                console.error('Failed to load Live2D model:', err);
                if (mounted) {
                    setError(err instanceof Error ? `${err.name}: ${err.message}` : String(err));
                    setLoading(false);
                }
            }
        };

        initLive2D();

        return () => {
            mounted = false;
            if (canvasRef.current && clickHandlerRef.current) {
                canvasRef.current.removeEventListener('click', clickHandlerRef.current);
            }
            if (appRef.current) {
                try {
                    appRef.current.destroy(false, { children: true });
                } catch (e) { console.error(e); }
                appRef.current = null;
            }
        };
    }, [modelUrl]);

    if (error) {
        return (
            <div className={`relative ${className} flex items-center justify-center`}>
                <div className="text-xs text-slate-400 text-center p-4">
                    <div className="mb-2">😢</div>
                    <div>Avatar unavailable</div>
                    <div className="text-[10px] mt-1 text-red-400 max-w-[250px] break-all font-mono bg-slate-100 p-1 rounded">
                        {error}
                    </div>
                    <div className="text-[9px] text-slate-300 mt-1">{new Date().toLocaleTimeString()}</div>
                    <div className="text-[10px] mt-1 opacity-50 truncate max-w-[200px]">{modelUrl}</div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`relative ${className} flex items-center justify-center`}
            onClick={(e) => {
                console.log('>>> DIV clicked! Target:', e.target, 'Current:', e.currentTarget);
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    pointerEvents: 'auto',
                    position: 'relative',
                    zIndex: 10
                }}
                onClick={(e) => {
                    console.log('>>> CANVAS clicked directly!');
                    e.stopPropagation();
                }}
            />
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-3xl">
                    <div className="text-miku animate-pulse">Loading...</div>
                </div>
            )}
        </div>
    );
};

export default Live2DAvatar;
