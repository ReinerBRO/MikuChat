import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, SkipBack, Music, Search, Volume2, VolumeX, Upload, X, Trash2 } from 'lucide-react';
import { useGame } from '../context/GameContext';

interface Song {
    name: string;
    url: string;
    type: 'local' | 'online';
    id?: string;
    duration?: number;
    uploader?: string;
    cover?: string;
}

interface MusicPlayerProps {
    viewMode: 'mini' | 'full';
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({ viewMode }) => {
    const { playVoice } = useGame();
    const [localSongs, setLocalSongs] = useState<Song[]>([]);
    const [onlineSongs, setOnlineSongs] = useState<Song[]>([]);
    const [currentLocalIndex, setCurrentLocalIndex] = useState<number>(-1);
    const [currentOnlineIndex, setCurrentOnlineIndex] = useState<number>(-1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [mode, setMode] = useState<'local' | 'online'>('local');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Song[]>([]);
    const [volume, setVolume] = useState(0.5);
    const [isMuted, setIsMuted] = useState(false);

    // Upload State
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadCover, setUploadCover] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [onlineHydrated, setOnlineHydrated] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const onlinePlaylistKey = 'miku_online_playlist';
    const onlineIndexKey = 'miku_online_playlist_index';
    const getPlaylistUsername = () => localStorage.getItem('miku_user') || 'User';

    const activeSongs = mode === 'local' ? localSongs : onlineSongs;
    const activeIndex = mode === 'local' ? currentLocalIndex : currentOnlineIndex;

    useEffect(() => {
        const loadOnlinePlaylist = async () => {
            let sanitized: Song[] = [];
            let nextIndex = -1;

            try {
                const username = getPlaylistUsername();
                const response = await fetch(`http://localhost:8000/api/music/online_playlist?username=${encodeURIComponent(username)}`);
                if (response.ok) {
                    const data = await response.json();
                    if (Array.isArray(data.songs)) {
                        sanitized = data.songs
                            .filter((item: any) => item && item.id && item.name)
                            .map((item: any) => ({
                                name: item.name,
                                url: item.url || '',
                                type: 'online',
                                id: item.id,
                                duration: item.duration,
                                uploader: item.uploader,
                                cover: item.cover
                            }));
                    }
                    if (typeof data.current_index === 'number') {
                        nextIndex = data.current_index;
                    }
                }
            } catch (error) {
                console.error('Failed to load online playlist from server:', error);
            }

            if (sanitized.length === 0) {
                const saved = localStorage.getItem(onlinePlaylistKey);
                if (saved) {
                    try {
                        const parsed = JSON.parse(saved);
                        if (Array.isArray(parsed)) {
                            sanitized = parsed
                                .filter((item) => item && item.id && item.name)
                                .map((item) => ({
                                    name: item.name,
                                    url: item.url || '',
                                    type: 'online',
                                    id: item.id,
                                    duration: item.duration,
                                    uploader: item.uploader,
                                    cover: item.cover
                                }));
                        }
                    } catch (error) {
                        console.error('Failed to parse online playlist:', error);
                    }
                }
            }

            if (nextIndex === -1) {
                const savedIndex = localStorage.getItem(onlineIndexKey);
                const parsedIndex = savedIndex !== null ? Number.parseInt(savedIndex, 10) : -1;
                nextIndex = parsedIndex;
            }

            const clampedIndex = sanitized.length > 0
                ? Math.min(Number.isNaN(nextIndex) || nextIndex < 0 ? 0 : nextIndex, sanitized.length - 1)
                : -1;

            setOnlineSongs(sanitized);
            setCurrentOnlineIndex(clampedIndex);
            setOnlineHydrated(true);
        };

        loadOnlinePlaylist();
    }, []);

    useEffect(() => {
        if (!onlineHydrated) return;
        const nextIndex = onlineSongs.length > 0
            ? Math.min(currentOnlineIndex === -1 ? 0 : currentOnlineIndex, onlineSongs.length - 1)
            : -1;
        if (nextIndex !== currentOnlineIndex) {
            setCurrentOnlineIndex(nextIndex);
            return;
        }

        localStorage.setItem(onlinePlaylistKey, JSON.stringify(onlineSongs));
        localStorage.setItem(onlineIndexKey, nextIndex.toString());

        const saveOnlinePlaylist = async () => {
            try {
                const username = getPlaylistUsername();
                await fetch('http://localhost:8000/api/music/online_playlist', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username,
                        songs: onlineSongs,
                        current_index: nextIndex
                    })
                });
            } catch (error) {
                console.error('Failed to save online playlist:', error);
            }
        };

        saveOnlinePlaylist();
    }, [onlineSongs, currentOnlineIndex, onlineHydrated]);

    useEffect(() => {
        if (mode === 'local') {
            fetchLocalSongs();
        }
    }, [mode]);

    useEffect(() => {
        if (activeIndex >= 0 && activeSongs[activeIndex]) {
            if (audioRef.current) {
                const song = activeSongs[activeIndex];
                if (song.type === 'online') {
                    audioRef.current.src = `http://localhost:8000/api/music/stream/${song.id}`;
                } else {
                    audioRef.current.src = `http://localhost:8000${song.url}`;
                }

                if (isPlaying) {
                    audioRef.current.play().catch(e => console.error("Play failed:", e));
                }
            }
        }
    }, [activeIndex, activeSongs]);

    useEffect(() => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.play().catch(e => console.error("Play failed:", e));
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : volume;
        }
    }, [volume, isMuted]);

    // Play Welcome Voice when entering Full View
    useEffect(() => {
        if (viewMode === 'full') {
            playVoice('/audio/welcome_music.wav');
        }
    }, [viewMode]);

    const fetchLocalSongs = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/music');
            const data = await response.json();
            if (data.music) {
                setLocalSongs(data.music);
                setCurrentLocalIndex((prev) => {
                    if (data.music.length === 0) return -1;
                    if (prev === -1) return 0;
                    return Math.min(prev, data.music.length - 1);
                });
            }
        } catch (error) {
            console.error('Error fetching music:', error);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        try {
            const response = await fetch(`http://localhost:8000/api/music/search?q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();
            if (data.results) {
                const results = data.results.map((r: any) => ({
                    name: r.title,
                    url: '',
                    type: 'online',
                    id: r.id,
                    duration: r.duration,
                    uploader: r.uploader,
                    cover: r.cover
                }));
                setSearchResults(results);
            }
        } catch (error) {
            console.error('Search error:', error);
        }
    };

    const playOnlineSong = (song: Song) => {
        setOnlineSongs((prev) => {
            const existingIndex = prev.findIndex(s => s.id === song.id);
            if (existingIndex !== -1) {
                setCurrentOnlineIndex(existingIndex);
                return prev;
            }
            const newSongs = [...prev, song];
            setCurrentOnlineIndex(newSongs.length - 1);
            return newSongs;
        });
        setIsPlaying(true);
    };

    const togglePlay = () => setIsPlaying(!isPlaying);

    const updateActiveIndex = (updater: (prev: number) => number) => {
        if (mode === 'local') {
            setCurrentLocalIndex(updater);
        } else {
            setCurrentOnlineIndex(updater);
        }
    };

    const setActiveIndex = (index: number) => {
        if (mode === 'local') {
            setCurrentLocalIndex(index);
        } else {
            setCurrentOnlineIndex(index);
        }
    };

    const nextSong = () => {
        if (activeSongs.length === 0) return;
        updateActiveIndex((prev) => (prev + 1) % activeSongs.length);
    };

    const prevSong = () => {
        if (activeSongs.length === 0) return;
        updateActiveIndex((prev) => (prev - 1 + activeSongs.length) % activeSongs.length);
    };

    const handleEnded = () => nextSong();

    const submitUpload = async () => {
        if (!uploadFile) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', uploadFile);
        if (uploadCover) {
            formData.append('cover', uploadCover);
        }

        try {
            const response = await fetch('http://localhost:8000/api/music/upload', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                setIsUploadModalOpen(false);
                setUploadFile(null);
                setUploadCover(null);
                fetchLocalSongs(); // Refresh list
            } else {
                console.error("Upload failed");
            }
        } catch (error) {
            console.error("Upload error:", error);
        } finally {
            setIsUploading(false);
        }
    };

    const removeSongAtIndex = (index: number, listType: 'local' | 'online') => {
        const setList = listType === 'local' ? setLocalSongs : setOnlineSongs;
        const setIndex = listType === 'local' ? setCurrentLocalIndex : setCurrentOnlineIndex;
        setList(prev => {
            const next = prev.filter((_, i) => i !== index);
            setIndex(curr => {
                if (curr === -1) return -1;
                if (index < curr) return curr - 1;
                if (index === curr) {
                    return next.length ? Math.min(curr, next.length - 1) : -1;
                }
                return curr;
            });
            if (listType === mode && next.length === 0) {
                setIsPlaying(false);
            }
            return next;
        });
    };

    const deleteLocalSong = async (song: Song, index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (song.type !== 'local') return;
        if (!window.confirm(`删除本地歌曲 "${song.name}"？`)) return;

        try {
            const response = await fetch(`http://localhost:8000/api/music/${encodeURIComponent(song.name)}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                console.error('Delete failed:', response.statusText);
                return;
            }

            removeSongAtIndex(index, 'local');
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const removeOnlineSong = (song: Song, index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (song.type !== 'online') return;
        if (!window.confirm(`从列表移除 "${song.name}"？`)) return;
        removeSongAtIndex(index, 'online');
    };

    // Render Full View
    if (viewMode === 'full') {
        return (
            <div className="w-full h-full glass-panel rounded-2xl p-6 flex flex-col overflow-hidden relative">
                <audio ref={audioRef} onEnded={handleEnded} onError={(e) => console.error("Audio error:", e)} />

                {/* Upload Modal */}
                <AnimatePresence>
                    {isUploadModalOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-white/20"
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-bold text-theme-text">上传音乐</h3>
                                    <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-500 mb-1">音乐文件（必选）</label>
                                        <input
                                            type="file"
                                            accept=".mp3,.wav,.ogg,.mp4,.m4a,.flac"
                                            onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                                            className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-miku/10 file:text-miku hover:file:bg-miku/20"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-500 mb-1">封面图片（可选）</label>
                                        <input
                                            type="file"
                                            accept=".jpg,.jpeg,.png,.gif,.webp"
                                            onChange={(e) => setUploadCover(e.target.files ? e.target.files[0] : null)}
                                            className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-magenta/10 file:text-magenta hover:file:bg-magenta/20"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        onClick={() => setIsUploadModalOpen(false)}
                                        className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                    >
                                        取消
                                    </button>
                                    <button
                                        onClick={submitUpload}
                                        disabled={!uploadFile || isUploading}
                                        className="px-4 py-2 bg-miku text-white rounded-lg hover:bg-miku-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {isUploading ? '上传中...' : '上传'}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-display font-bold text-theme-text flex items-center gap-2">
                        <Music className="text-miku" /> 音乐站
                    </h2>
                    <div className="flex gap-2">
                            <button
                                onClick={() => setIsUploadModalOpen(true)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-miku/10 text-miku hover:bg-miku/20 rounded-lg text-sm font-medium transition-colors"
                            >
                                <Upload size={16} /> 上传
                            </button>
                            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                                <button onClick={() => setMode('local')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'local' ? 'bg-white dark:bg-slate-700 text-miku shadow-sm' : 'text-slate-500'}`}>本地</button>
                                <button onClick={() => setMode('online')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'online' ? 'bg-white dark:bg-slate-700 text-miku shadow-sm' : 'text-slate-500'}`}>在线</button>
                            </div>
                        </div>
                    </div>

                <div className="flex-1 flex gap-6 min-h-0">
                    {/* Left: Player & Visuals */}
                    <div className="w-1/3 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6">
                        <div className="relative w-64 h-64 mb-8">
                            <motion.div
                                className={`w-full h-full rounded-full bg-black flex items-center justify-center shadow-2xl border-4 border-gray-800 ${isPlaying ? 'animate-spin-slow' : ''}`}
                                style={{
                                    background: 'conic-gradient(from 0deg, #111 0%, #333 10%, #111 20%, #333 30%, #111 40%, #333 50%, #111 60%, #333 70%, #111 80%, #333 90%, #111 100%)',
                                    animationPlayState: isPlaying ? 'running' : 'paused'
                                }}
                            >
                                <div className="w-24 h-24 rounded-full bg-miku flex items-center justify-center border-4 border-white overflow-hidden">
                                    {activeSongs[activeIndex]?.cover ? (
                                        <img
                                            src={activeSongs[activeIndex].cover.startsWith('/music/')
                                                ? `http://localhost:8000${activeSongs[activeIndex].cover}`
                                                : activeSongs[activeIndex].cover}
                                            alt="Cover"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <Music size={40} className="text-white" />
                                    )}
                                </div>
                            </motion.div>
                            {/* Tone Arm */}
                            <div className="absolute -top-4 -right-4 w-4 h-32 bg-gray-400 origin-top rotate-12 rounded-full shadow-lg z-10" style={{ transform: isPlaying ? 'rotate(25deg)' : 'rotate(0deg)', transition: 'transform 0.5s' }} />
                        </div>

                        <div className="text-center mb-6 w-full">
                            <h3 className="text-xl font-bold text-theme-text truncate">{activeSongs[activeIndex]?.name || "No Song Selected"}</h3>
                            <p className="text-sm text-theme-muted truncate">{activeSongs[activeIndex]?.uploader || "Unknown Artist"}</p>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-6 mb-6">
                            <button onClick={prevSong} className="p-3 text-slate-600 hover:text-miku transition-colors"><SkipBack size={28} /></button>
                            <button onClick={togglePlay} className="w-16 h-16 rounded-full bg-miku text-white flex items-center justify-center shadow-lg hover:bg-miku-dark transition-transform hover:scale-105">
                                {isPlaying ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
                            </button>
                            <button onClick={nextSong} className="p-3 text-slate-600 hover:text-miku transition-colors"><SkipForward size={28} /></button>
                        </div>

                        {/* Volume */}
                        <div className="flex items-center gap-2 w-full max-w-[200px]">
                            <button onClick={() => setIsMuted(!isMuted)} className="text-slate-400 hover:text-miku">
                                {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                            </button>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={isMuted ? 0 : volume}
                                onChange={(e) => {
                                    setVolume(parseFloat(e.target.value));
                                    setIsMuted(false);
                                }}
                                className="flex-1 h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-miku"
                            />
                        </div>
                    </div>

                    {/* Right: Playlist / Search */}
                    <div className="flex-1 flex flex-col min-h-0">
                        {mode === 'online' && (
                            <div className="mb-4">
                                <form onSubmit={handleSearch} className="relative">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="搜索 Bilibili..."
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-miku focus:ring-2 focus:ring-miku/20 outline-none bg-white/50"
                                    />
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                </form>
                                {searchResults.length > 0 && (
                                    <div className="mt-2 max-h-60 overflow-y-auto custom-scrollbar bg-white/80 rounded-xl shadow-sm p-2">
                                        {searchResults.map((song) => (
                                            <button
                                                key={song.id}
                                                onClick={() => playOnlineSong(song)}
                                                className="w-full text-left p-3 hover:bg-miku/10 rounded-lg group transition-colors flex items-center gap-3"
                                            >
                                                <div className="w-10 h-10 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0">
                                                    {song.cover ? (
                                                        <img
                                                            src={song.cover.startsWith('/music/')
                                                                ? `http://localhost:8000${song.cover}`
                                                                : song.cover}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <Music className="m-2 text-slate-400" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-medium text-slate-700 truncate">{song.name}</div>
                                                    <div className="text-xs text-slate-400 truncate">{song.uploader}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white/50 rounded-2xl p-2">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">当前播放列表</h3>
                            {activeSongs.length === 0 ? (
                                <div className="text-center py-10 text-slate-400">播放列表为空</div>
                            ) : (
                                <div className="space-y-1">
                                    {activeSongs.map((song, index) => (
                                        <div
                                            key={index}
                                            onClick={() => { setActiveIndex(index); setIsPlaying(true); }}
                                            className={`p-3 rounded-xl cursor-pointer transition-all flex items-center gap-3 ${activeIndex === index ? 'bg-miku text-white shadow-md' : 'hover:bg-white/60 text-slate-700'
                                                }`}
                                        >
                                            <div className="w-6 text-center text-xs opacity-70">{index + 1}</div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium truncate">{song.name}</div>
                                                <div className={`text-xs truncate ${activeIndex === index ? 'text-white/80' : 'text-slate-400'}`}>{song.uploader || 'Unknown'}</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {activeIndex === index && isPlaying && (
                                                    <div className="flex gap-0.5 items-end h-3">
                                                        <div className="w-1 bg-white animate-[music-bar_0.5s_ease-in-out_infinite]" />
                                                        <div className="w-1 bg-white animate-[music-bar_0.7s_ease-in-out_infinite]" />
                                                        <div className="w-1 bg-white animate-[music-bar_0.4s_ease-in-out_infinite]" />
                                                    </div>
                                                )}
                                                {song.type === 'local' && (
                                                    <button
                                                        onClick={(e) => deleteLocalSong(song, index, e)}
                                                        className={`p-1 rounded transition-colors ${activeIndex === index ? 'text-white/80 hover:text-white' : 'text-slate-400 hover:text-red-500 hover:bg-red-500/10'}`}
                                                        title="删除本地歌曲"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                                {song.type === 'online' && (
                                                    <button
                                                        onClick={(e) => removeOnlineSong(song, index, e)}
                                                        className={`p-1 rounded transition-colors ${activeIndex === index ? 'text-white/80 hover:text-white' : 'text-slate-400 hover:text-red-500 hover:bg-red-500/10'}`}
                                                        title="从列表移除"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Mini View (Top Right Widget)
    // Make the container itself fixed, but allow the inner card to be dragged
    return (
        <div className="fixed top-6 right-6 z-50 pointer-events-none">
            {/* pointer-events-none on container so it doesn't block clicks when player is moved away, 
                but we need pointer-events-auto on the player itself */}
            <audio ref={audioRef} onEnded={handleEnded} onError={(e) => console.error("Audio error:", e)} />

            <motion.div
                drag
                dragMomentum={false}
                initial={{ opacity: 0, scale: 0.9, x: 0, y: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                whileDrag={{ scale: 1.05, cursor: "grabbing" }}
                className="pointer-events-auto bg-white/90 backdrop-blur-md p-3 rounded-full shadow-lg border border-miku/20 flex items-center gap-3 pr-5 cursor-move hover:shadow-xl transition-shadow"
            >
                <motion.div
                    className={`w-10 h-10 rounded-full bg-black flex items-center justify-center border-2 border-slate-700 relative ${isPlaying ? 'animate-spin-slow' : ''}`}
                    style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
                >
                    <div className="w-3 h-3 rounded-full bg-miku border border-white" />
                </motion.div>

                <div className="flex flex-col max-w-[120px]">
                    <span className="text-xs font-bold text-slate-700 truncate">{activeSongs[activeIndex]?.name || "Miku Player"}</span>
                    <span className="text-xs text-slate-400 truncate font-mono">{isPlaying ? "NOW PLAYING" : "PAUSED"}</span>
                </div>

                <div className="flex items-center gap-2 border-l border-slate-200 pl-3" onPointerDown={(e) => e.stopPropagation()}>
                    {/* Stop propagation on buttons so dragging doesn't start when clicking buttons if needed, 
                        though framer motion usually handles this well. Adding just in case. */}
                    <button onClick={togglePlay} className="text-miku hover:scale-110 transition-transform p-1">
                        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                    </button>
                    <button onClick={nextSong} className="text-slate-400 hover:text-miku transition-colors p-1">
                        <SkipForward size={16} />
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default MusicPlayer;
