import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'miku';
    image?: string;
    timestamp: Date;
}

const ChatInterface: React.FC = () => {
    // Persistence Logic
    const [messages, setMessages] = useState<Message[]>(() => {
        const saved = localStorage.getItem('miku_chat_history');
        if (saved) {
            return JSON.parse(saved, (key, value) => {
                if (key === 'timestamp') return new Date(value);
                return value;
            });
        }
        return [{
            id: 'welcome',
            text: "Hello Master! I'm Miku. What shall we talk about today? 🎵",
            sender: 'miku',
            timestamp: new Date(),
        }];
    });

    useEffect(() => {
        localStorage.setItem('miku_chat_history', JSON.stringify(messages));
    }, [messages]);

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
            if (imageToSend) {
                formData.append('image', imageToSend);
            }

            const response = await fetch('http://localhost:8000/api/chat', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            const mikuReply: Message = {
                id: (Date.now() + 1).toString(),
                text: data.response,
                sender: 'miku',
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, mikuReply]);
        } catch (error) {
            console.error("Error sending message:", error);
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

    return (
        <div className="flex flex-col h-full relative z-10">
            {/* Header */}
            <header className="flex items-center justify-between p-4 glass-panel rounded-t-2xl mb-4 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-miku border-2 border-white overflow-hidden relative">
                        <img src="/miku_avatar.png" alt="Miku" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <h1 className="text-xl font-display font-bold text-white">Hatsune Miku</h1>
                        <p className="text-xs text-miku-light flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                            Online
                        </p>
                    </div>
                </div>
                <Music className="text-miku animate-bounce" />
            </header>

            {/* Chat Area */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto glass-panel rounded-2xl p-4 mb-4 space-y-4 custom-scrollbar">
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
                                            ? 'bg-magenta/20 border border-magenta/50 text-white rounded-tr-none'
                                            : 'bg-miku/20 border border-miku/50 text-white rounded-tl-none'
                                        }`}
                                >
                                    {msg.image && (
                                        <img src={msg.image} alt="Uploaded" className="max-w-full rounded-lg mb-2 border border-white/20" />
                                    )}
                                    <p className="whitespace-pre-wrap">{msg.text}</p>
                                </div>
                                <span className="text-[10px] text-slate-400 mt-1 px-1">
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {isTyping && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                    >
                        <div className="bg-miku/20 border border-miku/50 p-3 rounded-2xl rounded-tl-none flex gap-1">
                            <span className="w-2 h-2 bg-miku rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2 h-2 bg-miku rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2 h-2 bg-miku rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Input Area */}
            <div className="glass-panel rounded-2xl p-2 flex items-end gap-2 shrink-0">
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 text-miku hover:text-white hover:bg-miku/20 rounded-xl transition-colors"
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

                <div className="flex-1 bg-slate-800/50 rounded-xl p-2 border border-slate-700 focus-within:border-miku transition-colors flex flex-col">
                    {selectedImage && (
                        <div className="flex items-center justify-between bg-slate-700/50 p-1 rounded mb-1 text-xs">
                            <span className="truncate max-w-[200px]">{selectedImage.name}</span>
                            <button onClick={() => setSelectedImage(null)} className="text-red-400 hover:text-red-300">×</button>
                        </div>
                    )}
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Type a message to Miku..."
                        className="bg-transparent border-none focus:ring-0 text-white resize-none h-10 max-h-32 py-2 px-1 w-full"
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
    );
};

export default ChatInterface;
