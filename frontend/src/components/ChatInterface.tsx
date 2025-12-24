import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedAvatar from './AnimatedAvatar';
import Live2DAvatar from './Live2DAvatar';
import CyberVisualizer from './CyberVisualizer';
import ErrorBoundary from './ErrorBoundary';
import { useGame } from '../context/GameContext';
import { Send, Image as ImageIcon, Music, Palette, Home, Zap, Flower2, Lock } from 'lucide-react';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'miku';
    image?: string;
    audioUrl?: string;
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

// Helper to strip emotion tags from text
const cleanMessageText = (text: string) => {
    return text.replace(/^\[([a-zA-Z]+)\]\s*/i, '');
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({
    activeSessionId,
    onSessionCreated,
    currentUser,
    showAvatar = true,
    avatarMode = 'simple',
    live2dModelUrl = '/live2d/miku/miku_pro_jp/runtime/miku_sample_t04.model3.json'
}) => {
    // LINK TO GAME CONTEXT
    const { triggerInteraction, equippedItems, ownedItems, equipItem } = useGame();

    // Use equipped background as source of truth
    // Default to 'bedroom' if nothing equipped or invalid
    const currentBg = equippedItems.background || 'bedroom';

    const [messages, setMessages] = useState<Message[]>([{
        id: 'welcome',
        text: "你好！我是Miku，今天想聊些什么呢？🎵",
        sender: 'miku',
        timestamp: new Date(),
    }]);

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
    const [ttsEnabled, setTtsEnabled] = useState(true);
    const [currentEmotion, setCurrentEmotion] = useState<string>('NORMAL');
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Background UI State
    const [showBgSelector, setShowBgSelector] = useState(false);

    const chatContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load messages logic
    useEffect(() => {
        const loadSessionMessages = async () => {
            if (activeSessionId) {
                try {
                    const response = await fetch(`http://localhost:8000/api/sessions/${activeSessionId}/messages`);
                    const data = await response.json();
                    const loadedMessages = data.messages.map((msg: any, index: number) => ({
                        id: `${activeSessionId}-${index}`,
                        text: cleanMessageText(msg.content),
                        sender: msg.role === 'user' ? 'user' : 'miku',
                        timestamp: new Date(msg.timestamp)
                    }));
                    setMessages(loadedMessages);
                } catch (error) {
                    console.error('Error loading session messages:', error);
                    setMessages([]);
                }
            } else {
                setMessages([{
                    id: 'welcome',
                    text: "你好！我是Miku，今天想聊些什么呢？🎵",
                    sender: 'miku',
                    timestamp: new Date(),
                }]);
            }
        };
        loadSessionMessages();
    }, [activeSessionId]);

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
        triggerInteraction('chat');

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
            if (imageToSend) formData.append('image', imageToSend);
            formData.append('enable_tts', ttsEnabled.toString());
            if (activeSessionId) formData.append('session_id', activeSessionId);

            const response = await fetch('http://localhost:8000/api/chat', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Failed to send message');

            const data = await response.json();
            if (data.session_id && !activeSessionId) onSessionCreated(data.session_id);

            // Extract emotion tag logic
            const emotionMatch = data.response.match(/^\[([A-Z]+)\]/);
            if (emotionMatch) {
                setCurrentEmotion(emotionMatch[1]);
            }
            const cleanText = cleanMessageText(data.response);

            const mikuReply: Message = {
                id: (Date.now() + 1).toString(),
                text: cleanText,
                sender: 'miku',
                timestamp: new Date(),
                audioUrl: data.audio_url
            };

            setMessages(prev => [...prev, mikuReply]);

            if (data.audio_url) {
                const audio = new Audio(`http://localhost:8000${data.audio_url}`);
                audio.onplay = () => setIsSpeaking(true);
                audio.onended = () => {
                    setIsSpeaking(false);
                    setCurrentEmotion('NORMAL');
                };
                audio.play().catch(e => { console.error("Audio error:", e); setIsSpeaking(false); });
            }
        } catch (error) {
            console.error("Error sending message:", error);
            const errorMessage: Message = {
                id: Date.now().toString(),
                text: "Gomenne! Server error. 😣",
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
        return saved !== null ? saved === 'true' : false;
    });

    const [avatarScale, setAvatarScale] = useState(() => {
        const saved = localStorage.getItem('miku_avatar_scale');
        return saved !== null ? parseFloat(saved) : 1.0;
    });

    const [chatAvatarUrl, setChatAvatarUrl] = useState(() => {
        return localStorage.getItem('miku_chat_avatar_url') || '/miku_avatar_1.jpg';
    });

    // Listen for localStorage changes (from Settings)
    useEffect(() => {
        const handleStorageChange = () => {
            const url = localStorage.getItem('miku_chat_avatar_url');
            if (url) setChatAvatarUrl(url);
        };
        window.addEventListener('storage', handleStorageChange);
        // Also check on focus in case changed in same window
        window.addEventListener('focus', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('focus', handleStorageChange);
        };
    }, []);

    const handleToggleAvatarPanel = () => {
        const newState = !avatarPanelCollapsed;
        setAvatarPanelCollapsed(newState);
        localStorage.setItem('miku_avatar_panel_collapsed', newState.toString());
    };

    const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newScale = parseFloat(e.target.value);
        setAvatarScale(newScale);
        localStorage.setItem('miku_avatar_scale', newScale.toString());
    };

    // Background Map (Moved inside component or kept outside)
    const backgrounds: Record<string, string> = {
        bedroom: '/backgrounds/miku_room.png',
        cyber_room: '/backgrounds/miku_cyber_room.png',
        japanese_room: '/backgrounds/miku_japanese_room.png'
    };

    const handleSwitchBg = (id: string) => {
        if (ownedItems.includes(id)) {
            equipItem('background', id);
            setShowBgSelector(false);
        }
    };

    return (
        <div className="flex h-full gap-4 relative z-10">
            {/* Left Sidebar - Avatar */}
            {showAvatar && !avatarPanelCollapsed && (
                <div className="w-[340px] shrink-0 flex flex-col relative transition-all duration-300">
                    <div className="rounded-2xl p-4 h-full flex items-center justify-center relative overflow-hidden border-4 border-white shadow-xl shadow-miku/10 bg-gradient-to-b from-[#f0fdfa] to-[#ccfbf1]">

                        {/* 8-BIT DECORATIONS - CORNERS */}
                        <div className="absolute top-2 left-2 w-6 h-6 border-t-4 border-l-4 border-miku opacity-50 z-20 pointer-events-none"></div>
                        <div className="absolute top-2 right-2 w-6 h-6 border-t-4 border-r-4 border-miku opacity-50 z-20 pointer-events-none"></div>
                        <div className="absolute bottom-2 left-2 w-6 h-6 border-b-4 border-l-4 border-miku opacity-50 z-20 pointer-events-none"></div>
                        <div className="absolute bottom-2 right-2 w-6 h-6 border-b-4 border-r-4 border-miku opacity-50 z-20 pointer-events-none"></div>

                        {/* BACKGROUND LAYER */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentBg}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.5 }}
                                className="absolute inset-0 z-0 overflow-hidden rounded-xl"
                            >
                                <img
                                    src={backgrounds[currentBg] || backgrounds['bedroom']}
                                    alt="Miku Room"
                                    className="w-full h-full object-cover opacity-90 transition-transform duration-[20s] hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-miku/5 mix-blend-overlay"></div>
                                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-white/30 to-transparent"></div>

                                {/* Dark Mode Overlay for Cyber Room */}
                                {currentBg === 'cyber_room' && (
                                    <div className="absolute inset-0 bg-blue-900/10 mix-blend-multiply"></div>
                                )}

                                {/* Warm Overlay for Japanese Room */}
                                {currentBg === 'japanese_room' && (
                                    <div className="absolute inset-0 bg-amber-500/5 mix-blend-overlay"></div>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        {/* REACTIVE PARTICLES */}
                        <CyberVisualizer
                            isActive={isSpeaking || isTyping}
                            className={`z-10 mix-blend-screen transition-opacity duration-500 ${currentBg === 'japanese_room' ? 'opacity-40' : 'opacity-90'}`}
                        />

                        {/* --- UI CONTROLS --- */}

                        {/* Close Button */}
                        <button
                            onClick={handleToggleAvatarPanel}
                            className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-white text-miku rounded-lg transition-all z-40 shadow-sm border border-miku/20"
                            title="Hide Avatar"
                        >
                            <span className="font-bold text-lg">×</span>
                        </button>

                        {/* Theme Selector Button (Top Left) */}
                        <div className="absolute top-4 left-4 z-40">
                            <button
                                onClick={() => setShowBgSelector(!showBgSelector)}
                                className="p-2 bg-white/50 hover:bg-white text-miku rounded-lg transition-all shadow-sm border border-miku/20"
                                title="Change Background"
                            >
                                <Palette size={20} />
                            </button>

                            {/* Theme Menu */}
                            <AnimatePresence>
                                {showBgSelector && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9, y: -10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                                        className="absolute top-12 left-0 w-48 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-miku/20 p-2 flex flex-col gap-2"
                                    >
                                        <div className="text-xs font-bold text-slate-400 px-2 pb-1 border-b border-slate-100">BACKGROUNDS</div>

                                        {/* Bedroom (Always owned) */}
                                        <button
                                            onClick={() => handleSwitchBg('bedroom')}
                                            className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${currentBg === 'bedroom' ? 'bg-miku/20 text-miku-dark' : 'hover:bg-slate-100'}`}
                                        >
                                            <div className="w-8 h-8 rounded bg-[#ccfbf1] flex items-center justify-center border border-miku/30">
                                                <Home size={14} className="text-miku" />
                                            </div>
                                            <span className="text-sm font-medium">Bedroom</span>
                                        </button>

                                        {/* Cyber Room */}
                                        {ownedItems.includes('cyber_room') ? (
                                            <button
                                                onClick={() => handleSwitchBg('cyber_room')}
                                                className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${currentBg === 'cyber_room' ? 'bg-cyan-100 text-cyan-700' : 'hover:bg-slate-100'}`}
                                            >
                                                <div className="w-8 h-8 rounded bg-cyan-900 flex items-center justify-center border border-cyan-500">
                                                    <Zap size={14} className="text-cyan-400" />
                                                </div>
                                                <span className="text-sm font-medium">Future Apt.</span>
                                            </button>
                                        ) : null}

                                        {/* Japanese Room */}
                                        {ownedItems.includes('japanese_room') ? (
                                            <button
                                                onClick={() => handleSwitchBg('japanese_room')}
                                                className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${currentBg === 'japanese_room' ? 'bg-amber-100 text-amber-800' : 'hover:bg-slate-100'}`}
                                            >
                                                <div className="w-8 h-8 rounded bg-amber-900 flex items-center justify-center border border-amber-500">
                                                    <Flower2 size={14} className="text-amber-400" />
                                                </div>
                                                <span className="text-sm font-medium">Tea Room</span>
                                            </button>
                                        ) : null}

                                        {!ownedItems.includes('cyber_room') && !ownedItems.includes('japanese_room') && (
                                            <div className="p-2 text-xs text-slate-400 text-center italic">
                                                Visit Shop to unlock more!
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Avatar */}
                        <div className="relative z-10 flex flex-col items-center justify-end h-full w-full pb-8 group pointer-events-none">
                            <div className="pointer-events-auto" style={{ transform: `scale(${avatarScale})`, transition: 'transform 0.3s ease', transformOrigin: 'bottom center' }}>
                                <ErrorBoundary>
                                    {avatarMode === 'live2d' ? (
                                        <Live2DAvatar
                                            className="w-[300px] h-[450px]"
                                            modelUrl={live2dModelUrl}
                                            emotion={currentEmotion}
                                            isSpeaking={isSpeaking}
                                        />
                                    ) : (
                                        <AnimatedAvatar className="w-[280px] h-[280px]" />
                                    )}
                                </ErrorBoundary>
                            </div>

                            {/* Scale Slider */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[80%] opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0 pointer-events-auto">
                                <div className="bg-white/80 backdrop-blur-md rounded-xl p-3 shadow-lg border border-miku/20 flex items-center gap-3">
                                    <span className="text-xs font-bold text-miku whitespace-nowrap">SCALE</span>
                                    <input
                                        type="range"
                                        min="0.5"
                                        max="1.3"
                                        step="0.05"
                                        value={avatarScale}
                                        onChange={handleScaleChange}
                                        className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-miku"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Right Side - Chat (Unchanged) */}
            <div className="flex flex-col flex-1 min-w-0 relative">
                {/* ... (Header and Chat Area unchanged) ... */}
                <header className="flex items-center justify-between p-4 glass-panel rounded-t-2xl mb-4 shrink-0 relative z-20">
                    <div className="flex items-center gap-3">
                        {avatarPanelCollapsed && (
                            <button
                                onClick={handleToggleAvatarPanel}
                                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-miku/20 to-blue-500/20 border-2 border-miku/50 rounded-xl hover:from-miku/30 hover:to-blue-500/30 hover:border-miku transition-all hover:scale-105 shadow-md"
                                title="Show Avatar Panel"
                            >
                                <span className="text-2xl">🎤</span>
                                <span className="text-sm font-medium text-miku">显示 Miku</span>
                            </button>
                        )}
                        <div className="w-12 h-12 rounded-full bg-miku border-2 border-white overflow-hidden relative">
                            <img src={chatAvatarUrl} alt="Miku" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h1 className="text-xl font-display font-bold text-theme-text">初音ミク</h1>
                            <p className="text-xs text-miku-dark flex items-center gap-1">
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                <span>{currentStatus.emoji}</span>
                                {currentStatus.text}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Music className="text-miku animate-bounce" />
                    </div>
                </header>

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
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                                    <div className="bg-miku/10 border border-miku/30 p-3 rounded-2xl rounded-tl-none flex gap-1">
                                        <span className="w-2 h-2 bg-miku rounded-full animate-bounce"></span>
                                        <span className="w-2 h-2 bg-miku rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                        <span className="w-2 h-2 bg-miku rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="glass-panel rounded-2xl p-2 flex items-end gap-2 shrink-0 relative z-20">
                    <button onClick={() => fileInputRef.current?.click()} className="p-3 text-miku hover:text-miku-dark hover:bg-miku/10 rounded-xl" title="Upload Image">
                        <ImageIcon size={20} />
                    </button>
                    <div className="relative group">
                        <button onClick={() => setTtsEnabled(!ttsEnabled)} className={`p-3 rounded-xl transition-all ${ttsEnabled ? 'text-miku bg-miku/10' : 'text-theme-muted hover:text-miku/70'}`}>
                            <Music size={20} className={ttsEnabled ? "animate-pulse" : ""} />
                        </button>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={(e) => e.target.files && setSelectedImage(e.target.files[0])} className="hidden" accept="image/*" />
                    <div className="flex-1 bg-tech-panel/50 rounded-xl p-2 border border-slate-200 focus-within:border-miku transition-colors flex flex-col">
                        {selectedImage && (
                            <div className="flex items-center justify-between bg-slate-100 p-1 rounded mb-1 text-xs">
                                <span className="truncate max-w-[200px]">{selectedImage.name}</span>
                                <button onClick={() => setSelectedImage(null)} className="text-red-400 hover:text-red-300">×</button>
                            </div>
                        )}
                        <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={handleKeyPress} placeholder="Type a message to Miku..." className="bg-transparent border-none focus:ring-0 text-theme-text resize-none h-10 max-h-32 py-2 px-1 w-full placeholder-theme-muted" rows={1} />
                    </div>
                    <button onClick={handleSendMessage} disabled={!inputText.trim() && !selectedImage} className="p-3 bg-gradient-to-r from-miku to-blue-500 rounded-xl text-white shadow-lg hover:shadow-miku/40 transform hover:-translate-y-1 transition-all disabled:opacity-50">
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;
