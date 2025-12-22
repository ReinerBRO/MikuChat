import React, { useEffect, useRef, useState, Suspense } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, OrbitControls, ContactShadows, Html, useProgress } from '@react-three/drei';
import * as THREE from 'three';
import { Loader2, AlertCircle, RefreshCw, Box } from 'lucide-react';
import { useGame } from '../context/GameContext';

function Loader() {
    const { progress } = useProgress();
    return (
        <Html center>
            <div className="flex flex-col items-center gap-2 text-miku bg-white/90 p-4 rounded-xl backdrop-blur-md shadow-xl border-2 border-miku/20">
                <Loader2 className="w-8 h-8 animate-spin text-miku" />
                <p className="text-sm font-bold font-mono">{progress.toFixed(0)}% LOADING</p>
            </div>
        </Html>
    );
}

function Model({ url, currentAction, onLoadAnimations, ...props }: any) {
    const group = useRef<THREE.Group>(null);
    const { scene, animations } = useGLTF(url) as any;
    const { actions, names } = useAnimations(animations, group);

    useEffect(() => {
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

// 8-Bit Floating Particles
function PixelParticles() {
    const group = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (group.current) {
            group.current.rotation.y = state.clock.getElapsedTime() * 0.05;
            group.current.children.forEach((child, i) => {
                child.position.y += Math.sin(state.clock.getElapsedTime() + i) * 0.002;
            });
        }
    });

    return (
        <group ref={group}>
            {[...Array(24)].map((_, i) => (
                <mesh key={i} position={[
                    (Math.random() - 0.5) * 8,
                    Math.random() * 3 + 0.5,
                    (Math.random() - 0.5) * 6
                ]}>
                    <boxGeometry args={[0.08, 0.08, 0.08]} />
                    <meshStandardMaterial
                        color={Math.random() > 0.6 ? "#39c5bb" : (Math.random() > 0.5 ? "#ffb7c5" : "#ffffff")}
                        emissive={Math.random() > 0.6 ? "#39c5bb" : "#ffb7c5"}
                        emissiveIntensity={1.5}
                    />
                </mesh>
            ))}
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
    render() {
        if (this.state.hasError) {
            return (
                <Html center>
                    <div className="bg-red-50 text-red-500 p-4 rounded-xl max-w-md border border-red-200 shadow-lg">
                        <h3 className="font-bold mb-2">3D Error</h3>
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
            camera.position.set(0, 0.8, 4.5);
            controlsRef.current.target.set(0, 0.8, 0);
            controlsRef.current.update();
        }
    }, [camera, controlsRef]);
    return null;
}

export default function Miku3D() {
    const { triggerInteraction } = useGame();
    const [animations, setAnimations] = useState<string[]>([]);
    const [currentAnimation, setCurrentAnimation] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [resetKey, setResetKey] = useState(0);
    const controlsRef = useRef<any>(null);

    const handleResetCamera = () => {
        setResetKey(prev => prev + 1);
    };

    const playAnimation = (anim: string) => {
        setCurrentAnimation(anim);
        triggerInteraction('touch');
    };

    return (
        <div className="w-full h-full relative bg-gradient-to-b from-[#f0fdfa] to-[#ccfbf1] rounded-2xl overflow-hidden min-h-[500px] border-[3px] border-white shadow-xl shadow-miku/10 group">

            {/* 8-Bit / Tech UI Decor */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-miku/50 z-10" />
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-miku/50 z-10" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-miku/50 z-10" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-miku/50 z-10" />

            {error ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-4">
                    <AlertCircle className="w-12 h-12 text-pink-400" />
                    <p className="font-bold">Failed to load 3D model</p>
                    <p className="text-sm opacity-50">{error}</p>
                </div>
            ) : (
                <Canvas
                    key={`miku-3d-canvas-v8-${resetKey}`}
                    shadows
                    camera={{ position: [0, 0.8, 4.5], fov: 40 }}
                    onError={(e: any) => setError(e.message || 'Unknown error')}
                    className="cursor-move"
                >
                    <CameraSetup controlsRef={controlsRef} />

                    {/* Bright Electronic Environment */}
                    <color attach="background" args={['#f0fdfa']} />
                    <fog attach="fog" args={['#f0fdfa', 5, 12]} />

                    {/* Lights - High Key for brightness */}
                    <ambientLight intensity={1.5} />
                    <directionalLight
                        position={[5, 8, 5]}
                        intensity={1.2}
                        castShadow
                        shadow-normalBias={0.04}
                    />
                    <spotLight position={[-5, 5, 2]} intensity={0.8} color="#39c5bb" />
                    <pointLight position={[2, 4, -2]} intensity={0.5} color="#ffb7c5" />

                    {/* Cyber Grid Floor */}
                    <gridHelper args={[20, 20, 0x39c5bb, 0xafdcd8]} position={[0, -0.01, 0]} />
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
                        <planeGeometry args={[20, 20]} />
                        <meshBasicMaterial color="#e0f2fe" opacity={0.4} transparent />
                    </mesh>

                    {/* Floating 8-Bit Particles */}
                    <PixelParticles />

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

                    <ContactShadows resolution={1024} scale={8} blur={2.5} opacity={0.3} color="#39c5bb" />
                    <OrbitControls
                        ref={controlsRef}
                        makeDefault
                        enablePan={true}
                        minPolarAngle={0}
                        maxPolarAngle={Math.PI / 2 - 0.1}
                        minDistance={2}
                        maxDistance={8}
                        target={[0, 0.8, 0]}
                    />
                </Canvas>
            )}

            {/* Controls Overlay - Glass Style */}
            <div className="absolute bottom-4 left-4 right-4 bg-white/80 backdrop-blur-md p-4 rounded-xl flex flex-col gap-2 border border-white shadow-sm transition-opacity hover:opacity-100 opacity-90">
                <div className="flex justify-between items-center mb-1">
                    <h3 className="text-slate-700 text-xs font-bold font-mono tracking-widest uppercase">
                        Animations
                    </h3>
                    <button
                        onClick={handleResetCamera}
                        className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-miku bg-slate-100 hover:bg-miku/10 px-2 py-1 rounded transition-colors"
                    >
                        <RefreshCw className="w-3 h-3" />
                        RESET VIEW
                    </button>
                </div>
                <div className="flex flex-wrap gap-2 justify-center max-h-32 overflow-y-auto custom-scrollbar">
                    {animations.length > 0 ? (
                        animations.map(anim => (
                            <button
                                key={anim}
                                onClick={() => playAnimation(anim)}
                                className={`px-3 py-1.5 rounded-md text-[10px] font-bold tracking-wide transition-all uppercase border ${currentAnimation === anim
                                    ? 'bg-miku text-white border-miku shadow-md'
                                    : 'bg-white text-slate-500 border-slate-200 hover:border-miku hover:text-miku'
                                    }`}
                            >
                                {anim}
                            </button>
                        ))
                    ) : (
                        <div className="text-slate-400 text-xs flex items-center gap-2 py-2 font-mono">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            INITIALIZING...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Preload the model
useGLTF.preload('/models/miku.glb');
