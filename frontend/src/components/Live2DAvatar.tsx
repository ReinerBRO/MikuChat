import React, { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';

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
                // PIXI v6 Application constructor takes options
                console.log('Creating PIXI Application...');
                const pixiApp = new PIXI.Application({
                    view: canvasRef.current!,
                    backgroundAlpha: 0, // Transparent again
                    autoDensity: true,
                    antialias: true,
                    resolution: 1,
                    width: 300,
                    height: 400,
                    autoStart: true,
                    // CRITICAL: Disable events to prevent Live2D from using interaction plugin
                    eventMode: 'none' as any,
                    eventFeatures: {
                        move: false,
                        globalMove: false,
                        click: false,
                        wheel: false
                    } as any
                });

                console.log('Canvas dimensions:', {
                    width: canvasRef.current!.width,
                    height: canvasRef.current!.height,
                    clientWidth: canvasRef.current!.clientWidth,
                    clientHeight: canvasRef.current!.clientHeight
                });

                appRef.current = pixiApp;
                console.log('PIXI renderer type:', pixiApp.renderer.type === 1 ? 'WebGL' : 'Canvas');
                console.log('PIXI Application created successfully');

                // Force a render to ensure it's drawing
                pixiApp.renderer.render(pixiApp.stage);

                // Load Live2D Model
                console.log('Loading model from:', modelUrl);
                const loadPromise = Live2DModel.from(modelUrl);
                const timeoutPromise = new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('Model load timeout')), 30000)
                );

                const mikuModel = await Promise.race([loadPromise, timeoutPromise]);
                console.log('Model loaded successfully');

                // CRITICAL: Monkey-patch to prevent Live2D from registering interaction
                // The Live2D SDK tries to call manager.on() which doesn't exist in newer PIXI
                const modelForPatch = mikuModel as any;
                if (modelForPatch.registerInteraction) {
                    modelForPatch.registerInteraction = () => {
                        console.log('Blocked registerInteraction call');
                    };
                }
                // Also patch the internal model if it exists
                if (modelForPatch.internalModel && modelForPatch.internalModel.registerInteraction) {
                    modelForPatch.internalModel.registerInteraction = () => {
                        console.log('Blocked internalModel.registerInteraction call');
                    };
                }

                if (!mounted) {
                    console.log('Component unmounted during load, destroying...');
                    try {
                        pixiApp.destroy(false);
                    } catch (e) {
                        console.error('Error destroying pixiApp during init:', e);
                    }
                    try {
                        mikuModel.destroy();
                    } catch (e) {
                        console.error('Error destroying mikuModel during init:', e);
                    }
                    return;
                }

                // Cast to any to avoid type mismatch issues between PIXI versions
                pixiApp.stage.addChild(mikuModel as any);

                // Force immediate render
                pixiApp.renderer.render(pixiApp.stage);

                console.log('Stage children count:', pixiApp.stage.children.length);
                console.log('Model in stage:', pixiApp.stage.children.includes(mikuModel as any));
                console.log('Stage bounds:', pixiApp.stage.getBounds());

                // Check texture loading
                const modelAny = mikuModel as any;
                if (modelAny.internalModel && modelAny.internalModel.textures) {
                    console.log('Textures:', modelAny.internalModel.textures.length);
                    modelAny.internalModel.textures.forEach((tex: any, i: number) => {
                        console.log(`Texture ${i} loaded:`, tex.valid, 'baseTexture:', tex.baseTexture?.valid);
                    });
                } else {
                    console.log('No textures found on model');
                }

                // Scale and Position
                // Note: mikuModel.width/height ALREADY reflect the new scale after .set(scale)
                // So we should NOT multiply by scale again.

                // 1. Calculate scale based on original size
                const currentWidth = mikuModel.width; // This is size at scale 1
                const currentHeight = mikuModel.height;

                const scaleX = 300 / currentWidth;
                const scaleY = 400 / currentHeight;
                const scale = Math.min(scaleX, scaleY) * 0.9;

                mikuModel.scale.set(scale);

                // 2. Center based on NEW size
                // mikuModel.width is now updated to (originalWidth * scale)
                mikuModel.x = (300 - mikuModel.width) / 2;

                // Align to bottom
                mikuModel.y = 400 - mikuModel.height;

                // Log available motions
                if (modelAny.internalModel && modelAny.internalModel.motionManager) {
                    console.log('Motion manager:', modelAny.internalModel.motionManager);
                    console.log('Motion groups:', modelAny.internalModel.motionManager.definitions);
                }

                // Simplify interaction - just play a random motion on click
                const handleCanvasClick = (event: MouseEvent) => {
                    console.log('=== Canvas clicked! ===');

                    // Try to play different motions
                    const motionsToTry = [
                        'TapBody', 'tap_body', 'Tap', 'tap',
                        'Idle', 'idle',
                        'Flick', 'flick',
                        'Shake', 'shake',
                        null // null means play random motion
                    ];

                    const randomMotion = motionsToTry[Math.floor(Math.random() * motionsToTry.length)];
                    console.log('Trying to play motion:', randomMotion);

                    try {
                        if (typeof modelAny.motion === 'function') {
                            modelAny.motion(randomMotion);
                            console.log('✓ Motion triggered:', randomMotion);
                        } else {
                            console.error('motion() method not available');
                        }
                    } catch (e) {
                        console.error('Failed to play motion:', e);
                    }
                };

                clickHandlerRef.current = handleCanvasClick;
                canvasRef.current!.addEventListener('click', handleCanvasClick);
                canvasRef.current!.style.cursor = 'pointer';

                console.log('Canvas cursor:', canvasRef.current!.style.cursor);
                console.log('Click handler attached');

                // Test motion on load
                console.log('Testing motion...');
                if (typeof (mikuModel as any).motion === 'function') {
                    try {
                        (mikuModel as any).motion('idle');
                        console.log('✓ Motion test successful');
                    } catch (e) {
                        console.error('✗ Motion test failed:', e);
                    }
                }

                setLoading(false);
                console.log('Live2D setup complete!');
            } catch (err) {
                console.error('Failed to load Live2D model:', err);
                if (mounted) {
                    const errorMessage = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
                    setError(errorMessage);
                    setLoading(false);
                }
            }
        };

        initLive2D();

        return () => {
            mounted = false;

            // Remove canvas click listener
            if (canvasRef.current && clickHandlerRef.current) {
                canvasRef.current.removeEventListener('click', clickHandlerRef.current);
                clickHandlerRef.current = null;
            }

            if (appRef.current) {
                console.log('Cleaning up Live2DAvatar...');
                try {
                    // Do NOT remove the view (canvas) from DOM, let React handle it
                    appRef.current.destroy(false, { children: true });
                } catch (e) {
                    console.error('Error destroying PIXI app:', e);
                }
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
