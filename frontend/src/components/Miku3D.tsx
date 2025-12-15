import React, { useEffect, useRef, useState, Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { useGLTF, useAnimations, OrbitControls, ContactShadows, Html, useProgress } from '@react-three/drei';
import * as THREE from 'three';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

function Loader() {
    const { progress } = useProgress();
    return (
        <Html center>
            <div className="flex flex-col items-center gap-2 text-white bg-black/50 p-4 rounded-xl backdrop-blur-md">
                <Loader2 className="w-8 h-8 animate-spin text-miku" />
                <p className="text-sm font-medium">{progress.toFixed(0)}% loaded</p>
            </div>
        </Html>
    );
}

function Model({ url, currentAction, onLoadAnimations, ...props }: any) {
    const group = useRef<THREE.Group>(null);
    const { scene, animations } = useGLTF(url) as any;
    const { actions, names } = useAnimations(animations, group);

    useEffect(() => {
        console.log('Available animations:', names);
        if (onLoadAnimations) {
            onLoadAnimations(names);
        }
    }, [names, onLoadAnimations]);

    useEffect(() => {
        if (currentAction && actions[currentAction]) {
            Object.values(actions).forEach((action: any) => action?.fadeOut(0.5));
            const action = actions[currentAction];
            if (action) {
                action.reset().fadeIn(0.5).play();
            }
        }
    }, [currentAction, actions]);

    return (
        <group ref={group} {...props} dispose={null}>
            <primitive object={scene} />
        </group>
    );
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode, fallback: React.ReactNode }, { hasError: boolean, error: any }> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error: any) {
        return { hasError: true, error };
    }
    componentDidCatch(error: any, errorInfo: any) {
        console.error("3D Error:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <Html center>
                    <div className="bg-red-900/90 text-white p-4 rounded-xl max-w-md">
                        <h3 className="font-bold mb-2">Rendering Error</h3>
                        <p className="text-sm font-mono">{this.state.error?.message}</p>
                    </div>
                </Html>
            );
        }
        return this.props.children;
    }
}

function CameraSetup({ controlsRef }: { controlsRef: any }) {
    const { camera } = useThree();

    useEffect(() => {
        if (controlsRef.current) {
            // Force initial view: 0.2m height, 4m distance
            camera.position.set(0, 0.2, 4.0);
            controlsRef.current.target.set(0, 0.2, 0);
            controlsRef.current.update();
        }
    }, [camera, controlsRef]);

    return null;
}

export default function Miku3D() {
    const [animations, setAnimations] = useState<string[]>([]);
    const [currentAnimation, setCurrentAnimation] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [resetKey, setResetKey] = useState(0);
    const controlsRef = useRef<any>(null);

    const handleResetCamera = () => {
        setResetKey(prev => prev + 1);
    };

    return (
        <div className="w-full h-full relative bg-gradient-to-br from-miku/5 to-blue-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl overflow-hidden min-h-[500px] border border-white/20 shadow-inner">
            {error ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70 gap-4">
                    <AlertCircle className="w-12 h-12 text-red-400" />
                    <p>Failed to load 3D model</p>
                    <p className="text-sm text-white/30">{error}</p>
                </div>
            ) : (
                <Canvas
                    key={`miku-3d-canvas-v7-${resetKey}`}
                    shadows
                    camera={{ position: [0, 0.2, 4.0], fov: 45 }}
                    onError={(e: any) => setError(e.message || 'Unknown error')}
                >
                    <CameraSetup controlsRef={controlsRef} />

                    {/* Lights */}
                    <ambientLight intensity={0.8} />
                    <hemisphereLight intensity={0.5} groundColor="#000000" />
                    <directionalLight
                        position={[5, 10, 5]}
                        intensity={1.5}
                        castShadow
                        shadow-bias={-0.0001}
                    />
                    <spotLight position={[-5, 5, 5]} intensity={1} angle={0.3} />

                    <ErrorBoundary fallback={null}>
                        <Suspense fallback={<Loader />}>
                            <Model
                                url="/models/miku.glb"
                                currentAction={currentAnimation}
                                onLoadAnimations={setAnimations}
                                position={[0, 0, 0]}
                            />
                        </Suspense>
                    </ErrorBoundary>

                    <ContactShadows resolution={1024} scale={10} blur={1} opacity={0.5} far={10} color="#39c5bb" />
                    <OrbitControls
                        ref={controlsRef}
                        makeDefault
                        enablePan={true}
                        minPolarAngle={0}
                        maxPolarAngle={Math.PI / 2}
                        minDistance={0.2}
                        maxDistance={10}
                        target={[0, 0.2, 0]}
                    />
                </Canvas>
            )}

            {/* Controls Overlay */}
            <div className="absolute bottom-4 left-4 right-4 glass-panel p-4 rounded-xl flex flex-col gap-2">
                <div className="flex justify-between items-center mb-1">
                    <h3 className="text-white text-sm font-bold">动作控制 / Animations</h3>
                    <button
                        onClick={handleResetCamera}
                        className="flex items-center gap-1 text-xs text-white/70 hover:text-white bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition-colors"
                    >
                        <RefreshCw className="w-3 h-3" />
                        重置视角
                    </button>
                </div>
                <div className="flex flex-wrap gap-2 justify-center max-h-32 overflow-y-auto custom-scrollbar">
                    {animations.length > 0 ? (
                        animations.map(anim => (
                            <button
                                key={anim}
                                onClick={() => setCurrentAnimation(anim)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${currentAnimation === anim
                                    ? 'bg-miku text-white shadow-lg shadow-miku/30'
                                    : 'bg-white/10 text-white hover:bg-white/20'
                                    }`}
                            >
                                {anim}
                            </button>
                        ))
                    ) : (
                        <div className="text-white/50 text-sm flex items-center gap-2 py-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading model & animations...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Preload the model
useGLTF.preload('/models/miku.glb');
