import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedAvatar from './AnimatedAvatar';
import Live2DAvatar from './Live2DAvatar';
import ErrorBoundary from './ErrorBoundary';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'miku';
    image?: string;
    timestamp: Date;
}

interface ChatInterfaceProps {
    activeSessionId: string | null;
    onSessionCreated: (sessionId: string) => void;
    currentUser: string;
    showAvatar?: boolean;
    avatarMode?: 'simple' | 'live2d';
    live2dModelUrl?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
    activeSessionId,
    onSessionCreated,
    currentUser,
    showAvatar = true,
    avatarMode = 'simple',
    live2dModelUrl = '/live2d/miku/miku_pro_jp/runtime/miku_sample_t04.model3.json'
}) => {
    const [messages, setMessages] = useState<Message[]>([{
        id: 'welcome',
        text: "Hello Master! I'm Miku. What shall we talk about today? 🎵",
        sender: 'miku',
        timestamp: new Date(),
    }]);

    // Load messages when session changes
    useEffect(() => {
        const loadSessionMessages = async () => {
            if (activeSessionId) {
                try {
                    const response = await fetch(`http://localhost:8000/api/sessions/${activeSessionId}/messages`);
                    const data = await response.json();

                    // Convert backend messages to frontend format
                    const loadedMessages = data.messages.map((msg: any, index: number) => ({
                        id: `${activeSessionId}-${index}`,
                        text: msg.content,
                        sender: msg.role === 'user' ? 'user' : 'miku',
                        timestamp: new Date(msg.timestamp)
                    }));

                    setMessages(loadedMessages);
                } catch (error) {
                    console.error('Error loading session messages:', error);
                    setMessages([]);
                }
            } else {
                // Show welcome message for new chat
                setMessages([{
                    id: 'welcome',
                    text: "Hello Master! I'm Miku. What shall we talk about today? 🎵",
                    sender: 'miku',
                    timestamp: new Date(),
                }]);
            }
        };

        loadSessionMessages();
    }, [activeSessionId]);

    // Random status messages
    const statusMessages = [
        { text: '练舞中', emoji: '💃' },
        { text: '吃大葱中', emoji: '🥬' },
        { text: '写歌中', emoji: '🎵' },
        { text: '睡觉中', emoji: '😴' },
        { text: '演唱会中', emoji: '🎤' },
        { text: '录音中', emoji: '🎙️' },
        { text: '摸鱼中', emoji: '🐟' },
        { text: '追剧中', emoji: '📺' },
        { text: '打游戏中', emoji: '🎮' },
        { text: '喝奶茶中', emoji: '🧋' },
        { text: 'Online', emoji: '💚' }
    ];

    const [currentStatus] = useState(() =>
        statusMessages[Math.floor(Math.random() * statusMessages.length)]
    );

    const [inputText, setInputText] = useState('');
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [isTyping, setIsTyping] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSendMessage = async () => {
        if (!inputText.trim() && !selectedImage) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            text: inputText,
            sender: 'user',
            image: selectedImage ? URL.createObjectURL(selectedImage) : undefined,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, newMessage]);
        setInputText('');
        const imageToSend = selectedImage;
        setSelectedImage(null);
        setIsTyping(true);

        try {
            const formData = new FormData();
            formData.append('text', newMessage.text);
            formData.append('username', currentUser);
            if (imageToSend) {
                formData.append('image', imageToSend);
            }

            // Add session_id if exists
            if (activeSessionId) {
                formData.append('session_id', activeSessionId);
            }

            // Prepare history (last 3 rounds = last 6 messages, excluding the current new one)
            const historyMessages = messages
                .slice(-6) // Get last 6 messages
                .filter(msg => !msg.image) // Filter out messages with images for now (text-only history)
                .map(msg => ({
                    role: msg.sender === 'user' ? 'user' : 'model',
                    content: msg.text
                }));

            formData.append('history', JSON.stringify(historyMessages));

            const response = await fetch('http://localhost:8000/api/chat', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();

            // If a new session was created, notify parent
            if (data.session_id && !activeSessionId) {
                onSessionCreated(data.session_id);
            }

            const mikuReply: Message = {
                id: (Date.now() + 1).toString(),
                text: data.response,
                sender: 'miku',
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, mikuReply]);
        } catch (error) {
            console.error("Error sending message:", error);
            const errorMessage: Message = {
                id: Date.now().toString(),
                text: "Gomenne! I couldn't reach the server. Please check your connection or the backend console. 😣",
                sender: 'miku',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const [avatarPanelCollapsed, setAvatarPanelCollapsed] = useState(() => {
        const saved = localStorage.getItem('miku_avatar_panel_collapsed');
        return saved !== null ? saved === 'true' : true; // Default to collapsed
    });

    const [avatarScale, setAvatarScale] = useState(() => {
        const saved = localStorage.getItem('miku_avatar_scale');
        return saved !== null ? parseFloat(saved) : 1.0; // Default to 1.0 (100%)
    });

    const handleToggleAvatarPanel = () => {
        const newState = !avatarPanelCollapsed;
        console.log('Toggle Avatar Panel:', { current: avatarPanelCollapsed, new: newState });
        setAvatarPanelCollapsed(newState);
        localStorage.setItem('miku_avatar_panel_collapsed', newState.toString());
    };

    const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newScale = parseFloat(e.target.value);
        setAvatarScale(newScale);
        localStorage.setItem('miku_avatar_scale', newScale.toString());
    };

    // Debug log
    console.log('ChatInterface render - avatarPanelCollapsed:', avatarPanelCollapsed, 'showAvatar:', showAvatar);

    return (
        <div className="flex h-full gap-4 relative z-10">
            {/* Left Sidebar - Avatar */}
            {showAvatar && !avatarPanelCollapsed && (
                <div className="w-[340px] shrink-0 flex flex-col relative">
                    <div className="glass-panel rounded-2xl p-4 h-full flex items-center justify-center relative overflow-hidden">
                        {/* Vaporwave 3D Background - Inside Avatar Panel */}
                        <div className="absolute inset-0 pointer-events-none">
                            {/* 3D Grid Floor - Less dense */}
                            <div className="absolute inset-0 opacity-15" style={{
                                background: `
                                    linear-gradient(0deg, transparent 24%, rgba(93, 217, 210, 0.3) 25%, rgba(93, 217, 210, 0.3) 26%, transparent 27%, transparent 74%, rgba(93, 217, 210, 0.3) 75%, rgba(93, 217, 210, 0.3) 76%, transparent 77%, transparent),
                                    linear-gradient(90deg, transparent 24%, rgba(93, 217, 210, 0.25) 25%, rgba(93, 217, 210, 0.25) 26%, transparent 27%, transparent 74%, rgba(93, 217, 210, 0.25) 75%, rgba(93, 217, 210, 0.25) 76%, transparent 77%, transparent)
                                `,
                                backgroundSize: '80px 80px',
                                transform: 'perspective(400px) rotateX(60deg)',
                                transformOrigin: 'center bottom',
                                height: '150%',
                                top: '-25%'
                            }}></div>

                            {/* Pixel Stars - Lighter */}
                            <div className="absolute inset-0 opacity-30" style={{
                                backgroundImage: `
                                    radial-gradient(2px 2px at 20% 30%, rgba(93, 217, 210, 0.4), transparent),
                                    radial-gradient(1px 1px at 60% 70%, rgba(93, 217, 210, 0.3), transparent),
                                    radial-gradient(1px 1px at 80% 20%, rgba(160, 240, 237, 0.4), transparent),
                                    radial-gradient(2px 2px at 40% 80%, rgba(93, 217, 210, 0.35), transparent)
                                `,
                                backgroundSize: '150px 150px, 200px 200px, 180px 180px, 160px 160px',
                                animation: 'twinkle 3s ease-in-out infinite'
                            }}></div>

                            {/* Neon Glow Orbs - Lighter */}
                            <div className="absolute top-[20%] left-[10%] w-[150px] h-[150px] bg-miku/15 rounded-full blur-[60px] animate-pulse-glow"></div>
                            <div className="absolute bottom-[20%] right-[10%] w-[120px] h-[120px] bg-miku-light/15 rounded-full blur-[60px] animate-pulse-glow" style={{ animationDelay: '1.5s' }}></div>

                            {/* Scanlines - Much lighter */}
                            <div className="absolute inset-0 opacity-3" style={{
                                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(93, 217, 210, 0.2) 2px, rgba(93, 217, 210, 0.2) 4px)',
                                animation: 'scanlines 8s linear infinite'
                            }}></div>

                            {/* Floating Particles with Connections */}
                            <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
                                {/* Generate connection lines between nearby particles */}
                                {(() => {
                                    const particles = Array.from({ length: 15 }, (_, i) => ({
                                        id: i,
                                        x: Math.random() * 100,
                                        y: Math.random() * 100
                                    }));

                                    const lines = [];
                                    for (let i = 0; i < particles.length; i++) {
                                        for (let j = i + 1; j < particles.length; j++) {
                                            const dx = particles[i].x - particles[j].x;
                                            const dy = particles[i].y - particles[j].y;
                                            const distance = Math.sqrt(dx * dx + dy * dy);

                                            // Connect if distance is less than 25%
                                            if (distance < 25) {
                                                lines.push(
                                                    <line
                                                        key={`line-${i}-${j}`}
                                                        x1={`${particles[i].x}%`}
                                                        y1={`${particles[i].y}%`}
                                                        x2={`${particles[j].x}%`}
                                                        y2={`${particles[j].y}%`}
                                                        stroke="rgba(93, 217, 210, 0.2)"
                                                        strokeWidth="1"
                                                        opacity={0.5 * (1 - distance / 25)}
                                                    />
                                                );
                                            }
                                        }
                                    }
                                    return lines;
                                })()}
                            </svg>

                            {/* Floating Square Particles */}
                            {[...Array(15)].map((_, i) => (
                                <div
                                    key={i}
                                    style={{
                                        position: 'absolute',
                                        left: `${Math.random() * 100}%`,
                                        top: `${Math.random() * 100}%`,
                                        width: i % 3 === 0 ? '6px' : '4px',
                                        height: i % 3 === 0 ? '6px' : '4px',
                                        backgroundColor: i % 2 === 0 ? 'rgba(93, 217, 210, 0.6)' : 'rgba(160, 240, 237, 0.5)',
                                        boxShadow: '0 0 8px rgba(93, 217, 210, 0.4)',
                                        animation: `float ${3 + Math.random() * 3}s ease-in-out infinite`,
                                        animationDelay: `${Math.random() * 2}s`,
                                        zIndex: 2
                                    }}
                                ></div>
                            ))}
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={handleToggleAvatarPanel}
                            className="absolute top-4 right-4 p-2 hover:bg-miku/10 rounded-lg transition-colors z-40"
                            title="Hide Avatar"
                        >
                            ←
                        </button>

                        {/* Avatar - Above background */}
                        <div className="relative z-10 flex flex-col items-center gap-4 w-full group">
                            <div style={{ transform: `scale(${avatarScale})`, transition: 'transform 0.3s ease' }}>
                                <ErrorBoundary>
                                    {avatarMode === 'live2d' ? (
                                        <Live2DAvatar className="w-[300px] h-[400px]" modelUrl={live2dModelUrl} />
                                    ) : (
                                        <AnimatedAvatar className="w-[280px] h-[280px]" />
                                    )}
                                </ErrorBoundary>
                            </div>

                            {/* Scale Slider - Only visible on hover */}
                            <div className="w-full px-4 mt-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="glass-panel rounded-lg p-3 space-y-2">
                                    <div className="flex items-center justify-between text-xs text-miku">
                                        <span>🔍 Size</span>
                                        <span className="font-mono">{Math.round(avatarScale * 100)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0.5"
                                        max="1.5"
                                        step="0.1"
                                        value={avatarScale}
                                        onChange={handleScaleChange}
                                        className="w-full h-2 bg-gradient-to-r from-miku/30 to-blue-500/30 rounded-lg appearance-none cursor-pointer
                                                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                                                   [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-miku 
                                                   [&::-webkit-slider-thumb]:to-blue-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg
                                                   [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full 
                                                   [&::-moz-range-thumb]:bg-gradient-to-r [&::-moz-range-thumb]:from-miku [&::-moz-range-thumb]:to-blue-500 
                                                   [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-lg"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Right Side - Chat */}
            <div className="flex flex-col flex-1 min-w-0 relative">
                {/* Header */}
                <header className="flex items-center justify-between p-4 glass-panel rounded-t-2xl mb-4 shrink-0 relative z-20">
                    <div className="flex items-center gap-3">
                        {/* Show Avatar button when collapsed */}
                        {avatarPanelCollapsed && (
                            <button
                                onClick={handleToggleAvatarPanel}
                                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-miku/20 to-blue-500/20 border-2 border-miku/50 rounded-xl hover:from-miku/30 hover:to-blue-500/30 hover:border-miku transition-all hover:scale-105 shadow-md"
                                title="Show Avatar Panel"
                            >
                                <span className="text-2xl">🎤</span>
                                <span className="text-sm font-medium text-miku">Show Miku</span>
                            </button>
                        )}
                        <div className="w-12 h-12 rounded-full bg-miku border-2 border-white overflow-hidden relative">
                            <img src="/miku_avatar.png" alt="Miku" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h1 className="text-xl font-display font-bold text-theme-text">Hatsune Miku</h1>
                            <p className="text-xs text-miku-dark flex items-center gap-1">
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                <span>{currentStatus.emoji}</span>
                                {currentStatus.text}
                            </p>
                        </div>
                    </div>
                    <Music className="text-miku animate-bounce" />
                </header>

                {/* Chat Area */}
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto glass-panel rounded-2xl p-4 mb-4 space-y-4 custom-scrollbar relative">
                    <div className="relative z-10">
                        <AnimatePresence>
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[70%] ${msg.sender === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                                        <div
                                            className={`p-3 rounded-2xl ${msg.sender === 'user'
                                                ? 'bg-magenta/10 border border-magenta/30 text-theme-text rounded-tr-none'
                                                : 'bg-miku/10 border border-miku/30 text-theme-text rounded-tl-none'
                                                }`}
                                        >
                                            {msg.image && (
                                                <img src={msg.image} alt="Uploaded" className="max-w-full rounded-lg mb-2 border border-white/20" />
                                            )}
                                            <p className="whitespace-pre-wrap">{msg.text}</p>
                                        </div>
                                        <span className="text-[10px] text-theme-muted mt-1 px-1">
                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}

                            {isTyping && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex justify-start"
                                >
                                    <div className="bg-miku/10 border border-miku/30 p-3 rounded-2xl rounded-tl-none flex gap-1">
                                        <span className="w-2 h-2 bg-miku rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                        <span className="w-2 h-2 bg-miku rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                        <span className="w-2 h-2 bg-miku rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Input Area */}
                <div className="glass-panel rounded-2xl p-2 flex items-end gap-2 shrink-0 relative z-20">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 text-miku hover:text-miku-dark hover:bg-miku/10 rounded-xl transition-colors"
                    >
                        <ImageIcon size={20} />
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => e.target.files && setSelectedImage(e.target.files[0])}
                        className="hidden"
                        accept="image/*"
                    />

                    <div className="flex-1 bg-tech-panel/50 rounded-xl p-2 border border-slate-200 focus-within:border-miku transition-colors flex flex-col">
                        {selectedImage && (
                            <div className="flex items-center justify-between bg-slate-100 p-1 rounded mb-1 text-xs">
                                <span className="truncate max-w-[200px]">{selectedImage.name}</span>
                                <button onClick={() => setSelectedImage(null)} className="text-red-400 hover:text-red-300">×</button>
                            </div>
                        )}
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Type a message to Miku..."
                            className="bg-transparent border-none focus:ring-0 text-theme-text resize-none h-10 max-h-32 py-2 px-1 w-full placeholder-theme-muted"
                            rows={1}
                        />
                    </div>

                    <button
                        onClick={handleSendMessage}
                        disabled={!inputText.trim() && !selectedImage}
                        className="p-3 bg-gradient-to-r from-miku to-blue-500 rounded-xl text-white shadow-lg shadow-miku/20 hover:shadow-miku/40 transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;
