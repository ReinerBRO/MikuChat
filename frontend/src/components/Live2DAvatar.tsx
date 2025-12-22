import React, { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { useGame } from '../context/GameContext';

interface Live2DAvatarProps {
    className?: string;
    modelUrl: string;
    emotion?: string;
    isSpeaking?: boolean;
}

const Live2DAvatar: React.FC<Live2DAvatarProps> = ({ className, modelUrl, emotion, isSpeaking }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const appRef = useRef<PIXI.Application | null>(null);
    const modelRef = useRef<any>(null);
    const clickHandlerRef = useRef<((event: MouseEvent) => void) | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { triggerInteraction } = useGame();
    const triggerInteractionRef = useRef(triggerInteraction);

    useEffect(() => {
        triggerInteractionRef.current = triggerInteraction;
    }, [triggerInteraction]);

    // Handle Emotion/Motion Synergy
    useEffect(() => {
        if (!modelRef.current || !emotion) return;

        const emotionToMotion: Record<string, string> = {
            'HAPPY': 'Tap',
            'MOTIVATED': 'Tap',
            'ANGRY': 'Flick',
            'SURPRISED': 'FlickUp',
            'EMPATHY': 'Idle',
            'NORMAL': 'Idle'
        };

        const motionGroup = emotionToMotion[emotion] || 'Idle';
        try {
            if (typeof modelRef.current.motion === 'function') {
                modelRef.current.motion(motionGroup);
            }
        } catch (e) {
            console.error('Emotion motion error:', e);
        }
    }, [emotion]);

    // Manual Expression Control (Param-based)
    useEffect(() => {
        if (!modelRef.current) return;

        const applyExpressions = () => {
            const coreModel = modelRef.current.internalModel.coreModel;
            if (!coreModel) return;

            // Only override expressions for strong emotions. 
            // For NORMAL/Idle states, let the motion file control the face (avoid overriding the smile!).
            if (!emotion || emotion === 'NORMAL' || emotion === 'EMPATHY') {
                return;
            }

            // Default values
            let cheek = 0;
            let mouthForm = 0;
            let eyeSmile = 0;
            let browY = 0;

            let shouldApply = false;

            switch (emotion) {
                case 'HAPPY':
                    mouthForm = 1.0;
                    eyeSmile = 1.0;
                    cheek = 0.2;
                    shouldApply = true;
                    break;
                case 'MOTIVATED':
                    cheek = 0.8;
                    mouthForm = 0.5;
                    shouldApply = true;
                    break;
                case 'ANGRY':
                    mouthForm = -1.0;
                    browY = -1.0;
                    shouldApply = true;
                    break;
                case 'SURPRISED':
                    browY = 1.0;
                    mouthForm = -0.3;
                    shouldApply = true;
                    break;
                default:
                    break;
            }

            if (shouldApply) {
                // Apply to model only if we have a specific expression to enforce
                coreModel.setParameterValueById('ParamCheek', cheek);
                coreModel.setParameterValueById('ParamMouthForm', mouthForm);
                coreModel.setParameterValueById('ParamEyeLSmile', eyeSmile);
                coreModel.setParameterValueById('ParamEyeRSmile', eyeSmile);
                coreModel.setParameterValueById('ParamBrowLY', browY);
                coreModel.setParameterValueById('ParamBrowRY', browY);
            }
        };

        // Add to ticker to ensure it overrides motion-defined parameters
        const ticker = PIXI.Ticker.shared;
        const tickHandler = () => applyExpressions();
        ticker.add(tickHandler);

        return () => {
            ticker.remove(tickHandler);
        };
    }, [emotion]);

    // Handle Mouth Lip-Sync (Smooth natural simulation)
    useEffect(() => {
        if (!modelRef.current || !isSpeaking) {
            if (modelRef.current?.internalModel?.coreModel) {
                modelRef.current.internalModel.coreModel.setParameterValueById('ParamMouthOpenY', 0);
            }
            return;
        }

        let frameId: number;
        let startTime = Date.now();

        const animateMouth = () => {
            if (modelRef.current?.internalModel?.coreModel) {
                const elapsed = Date.now() - startTime;

                // Use a combination of sine waves to simulate more natural speech patterns
                // Speed is much slower than raw requestAnimationFrame
                const baseWave = Math.sin(elapsed * 0.012);
                const noiseWave = Math.sin(elapsed * 0.025) * 0.3;

                // Combine and normalize to 0.0 - 1.0 range
                let mouthValue = (baseWave + noiseWave + 0.8) * 0.5;

                // Clamp and add some jitter for realism
                mouthValue = Math.max(0, Math.min(1.0, mouthValue));

                // Occasionally 'snap' mouth more closed to simulate syllables
                if (Math.sin(elapsed * 0.005) < -0.8) mouthValue *= 0.2;

                modelRef.current.internalModel.coreModel.setParameterValueById('ParamMouthOpenY', mouthValue);
            }
            frameId = requestAnimationFrame(animateMouth);
        };

        animateMouth();
        return () => cancelAnimationFrame(frameId);
    }, [isSpeaking]);

    useEffect(() => {
        // console.log('Live2DAvatar mounted, modelUrl:', modelUrl);
        if (!canvasRef.current) return;

        let mounted = true;
        let pixiApp: PIXI.Application | null = null;
        let mikuModel: any = null;

        setLoading(true);
        setError(null);

        const initLive2D = async () => {
            // Small delay to allow previous contexts to be GC'd if rapidly reloading
            await new Promise(resolve => setTimeout(resolve, 100));
            if (!mounted) return;

            try {
                if (typeof window !== 'undefined') {
                    (window as any).PIXI = PIXI;
                }

                const { Live2DModel } = await import('pixi-live2d-display');

                // Check for too many contexts?
                // Create Application
                pixiApp = new PIXI.Application({
                    view: canvasRef.current!,
                    backgroundAlpha: 0,
                    autoDensity: true,
                    antialias: true,
                    resolution: window.devicePixelRatio || 1,
                    width: 300,
                    height: 400,
                    autoStart: true,
                });

                appRef.current = pixiApp;

                mikuModel = await Live2DModel.from(modelUrl);

                if (!mounted) {
                    // If unmounted during load, destroy immediately
                    if (pixiApp) pixiApp.destroy(false, { children: true, texture: true });
                    if (mikuModel) mikuModel.destroy();
                    return;
                }

                modelRef.current = mikuModel;
                pixiApp.stage.addChild(mikuModel as any);

                // Scale and Position
                const scale = Math.min(300 / mikuModel.width, 400 / mikuModel.height) * 0.9;
                mikuModel.scale.set(scale);
                mikuModel.x = (300 - mikuModel.width) / 2;
                mikuModel.y = 400 - mikuModel.height;

                // Mouse Tracking Logic
                const onMouseMove = (e: MouseEvent) => {
                    if (!mikuModel || !canvasRef.current) return;
                    if (mikuModel.focus) {
                        mikuModel.focus(e.clientX, e.clientY);
                    }
                };

                window.addEventListener('mousemove', onMouseMove);

                const handleCanvasClick = () => {
                    if (triggerInteractionRef.current) triggerInteractionRef.current('touch');
                    try {
                        const motions = ['Tap', 'Flick', 'FlickUp', 'Idle'];
                        const randomMotion = motions[Math.floor(Math.random() * motions.length)];
                        (mikuModel as any).motion(randomMotion);
                    } catch (e) { console.warn('Motion trigger failed', e); }
                };

                clickHandlerRef.current = handleCanvasClick;
                canvasRef.current!.addEventListener('click', handleCanvasClick);
                canvasRef.current!.style.cursor = 'pointer';

                setLoading(false);

                // Event Listener Cleanup for this instance
                return () => {
                    window.removeEventListener('mousemove', onMouseMove);
                    if (canvasRef.current && clickHandlerRef.current) {
                        canvasRef.current.removeEventListener('click', clickHandlerRef.current);
                    }
                };

            } catch (err: any) {
                console.error('Live2D init error:', err);
                if (mounted) {
                    // Check for WebGL context loss specific error
                    if (String(err).includes("checkMaxIfStatementsInShader") || String(err).includes("gl")) {
                        setError("显卡忙不过来了...请刷新页面试试 (WebGL Context Lost)");
                    } else {
                        setError(String(err));
                    }
                    setLoading(false);
                    // Cleanup partially created stuff
                    if (pixiApp) {
                        try { pixiApp.destroy(false); } catch (e) { }
                        appRef.current = null;
                    }
                }
            }
        };

        const cleanupListeners = initLive2D();

        return () => {
            mounted = false;

            // Wait for listeners if they are pending (Promise)
            if (cleanupListeners && typeof (cleanupListeners as any).then === 'function') {
                (cleanupListeners as any).then((cleanup: any) => cleanup && cleanup());
            }

            // Strict Destruction
            if (modelRef.current) {
                try { modelRef.current.destroy(); } catch (e) {
                    // Ignore destroy errors on already destroyed models
                }
                modelRef.current = null;
            }

            if (appRef.current) {
                try {
                    // Destroy app but keep canvas (false)
                    appRef.current.destroy(false, { children: true, texture: true });
                } catch (e) {
                    console.error('PIXI destroy error:', e);
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
                    <div>Avatar Error</div>
                    <div className="text-[10px] mt-1 text-red-400 max-w-[200px] break-all opacity-5">{error}</div>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative ${className} flex items-center justify-center`}>
            <canvas ref={canvasRef} />
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-3xl">
                    <div className="text-miku animate-pulse">Initializing...</div>
                </div>
            )}
        </div>
    );
};

export default Live2DAvatar;
