import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Disc, Play, Pause, SkipForward, SkipBack, Music, Search, Globe, Folder, Volume2, VolumeX, Upload, X } from 'lucide-react';

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
    onToggleView?: () => void;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({ viewMode, onToggleView }) => {
    const [songs, setSongs] = useState<Song[]>([]);
    const [currentSongIndex, setCurrentSongIndex] = useState<number>(-1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [mode, setMode] = useState<'local' | 'online'>('local');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Song[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [volume, setVolume] = useState(0.5);
    const [isMuted, setIsMuted] = useState(false);

    // Upload State
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadCover, setUploadCover] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (mode === 'local') {
            fetchLocalSongs();
        }
    }, [mode]);

    useEffect(() => {
        if (currentSongIndex >= 0 && songs[currentSongIndex]) {
            if (audioRef.current) {
                const song = songs[currentSongIndex];
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
    }, [currentSongIndex, songs]);

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

    const fetchLocalSongs = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/music');
            const data = await response.json();
            if (data.music) {
                setSongs(data.music);
                if (currentSongIndex === -1 && data.music.length > 0) {
                    setCurrentSongIndex(0);
                }
            }
        } catch (error) {
            console.error('Error fetching music:', error);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
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
        } finally {
            setIsSearching(false);
        }
    };

    const playOnlineSong = (song: Song) => {
        const existingIndex = songs.findIndex(s => s.id === song.id);
        if (existingIndex !== -1) {
            setCurrentSongIndex(existingIndex);
        } else {
            const newSongs = [...songs, song];
            setSongs(newSongs);
            setCurrentSongIndex(newSongs.length - 1);
        }
        setIsPlaying(true);
    };

    const togglePlay = () => setIsPlaying(!isPlaying);

    const nextSong = () => {
        if (songs.length === 0) return;
        setCurrentSongIndex((prev) => (prev + 1) % songs.length);
    };

    const prevSong = () => {
        if (songs.length === 0) return;
        setCurrentSongIndex((prev) => (prev - 1 + songs.length) % songs.length);
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
                                    <h3 className="text-xl font-bold text-theme-text">Upload Music</h3>
                                    <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-500 mb-1">Music File (Required)</label>
                                        <input
                                            type="file"
                                            accept=".mp3,.wav,.ogg,.mp4,.m4a,.flac"
                                            onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                                            className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-miku/10 file:text-miku hover:file:bg-miku/20"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-500 mb-1">Cover Image (Optional)</label>
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
                                        Cancel
                                    </button>
                                    <button
                                        onClick={submitUpload}
                                        disabled={!uploadFile || isUploading}
                                        className="px-4 py-2 bg-miku text-white rounded-lg hover:bg-miku-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {isUploading ? 'Uploading...' : 'Upload'}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-display font-bold text-theme-text flex items-center gap-2">
                        <Music className="text-miku" /> Music Station
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsUploadModalOpen(true)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-miku/10 text-miku hover:bg-miku/20 rounded-lg text-sm font-medium transition-colors"
                        >
                            <Upload size={16} /> Upload
                        </button>
                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                            <button onClick={() => setMode('local')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'local' ? 'bg-white dark:bg-slate-700 text-miku shadow-sm' : 'text-slate-500'}`}>Local</button>
                            <button onClick={() => setMode('online')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'online' ? 'bg-white dark:bg-slate-700 text-miku shadow-sm' : 'text-slate-500'}`}>Online</button>
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
                                    {songs[currentSongIndex]?.cover ? (
                                        <img
                                            src={songs[currentSongIndex].cover.startsWith('/music/')
                                                ? `http://localhost:8000${songs[currentSongIndex].cover}`
                                                : songs[currentSongIndex].cover}
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
                            <h3 className="text-xl font-bold text-theme-text truncate">{songs[currentSongIndex]?.name || "No Song Selected"}</h3>
                            <p className="text-sm text-theme-muted truncate">{songs[currentSongIndex]?.uploader || "Unknown Artist"}</p>
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
                                        placeholder="Search Bilibili..."
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
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">Current Playlist</h3>
                            {songs.length === 0 ? (
                                <div className="text-center py-10 text-slate-400">No songs in playlist</div>
                            ) : (
                                <div className="space-y-1">
                                    {songs.map((song, index) => (
                                        <div
                                            key={index}
                                            onClick={() => { setCurrentSongIndex(index); setIsPlaying(true); }}
                                            className={`p-3 rounded-xl cursor-pointer transition-all flex items-center gap-3 ${currentSongIndex === index ? 'bg-miku text-white shadow-md' : 'hover:bg-white/60 text-slate-700'
                                                }`}
                                        >
                                            <div className="w-6 text-center text-xs opacity-70">{index + 1}</div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium truncate">{song.name}</div>
                                                <div className={`text-xs truncate ${currentSongIndex === index ? 'text-white/80' : 'text-slate-400'}`}>{song.uploader || 'Unknown'}</div>
                                            </div>
                                            {currentSongIndex === index && isPlaying && (
                                                <div className="flex gap-0.5 items-end h-3">
                                                    <div className="w-1 bg-white animate-[music-bar_0.5s_ease-in-out_infinite]" />
                                                    <div className="w-1 bg-white animate-[music-bar_0.7s_ease-in-out_infinite]" />
                                                    <div className="w-1 bg-white animate-[music-bar_0.4s_ease-in-out_infinite]" />
                                                </div>
                                            )}
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
    return (
        <div className="fixed top-6 right-6 z-50 flex flex-col items-end">
            <audio ref={audioRef} onEnded={handleEnded} onError={(e) => console.error("Audio error:", e)} />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/90 backdrop-blur-md p-3 rounded-full shadow-lg border border-miku/20 flex items-center gap-3 pr-5"
            >
                <motion.div
                    className={`w-10 h-10 rounded-full bg-black flex items-center justify-center border-2 border-slate-700 relative ${isPlaying ? 'animate-spin-slow' : ''}`}
                    style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
                >
                    <div className="w-3 h-3 rounded-full bg-miku border border-white" />
                </motion.div>

                <div className="flex flex-col max-w-[120px]">
                    <span className="text-xs font-bold text-slate-700 truncate">{songs[currentSongIndex]?.name || "Miku Player"}</span>
                    <span className="text-[10px] text-slate-400 truncate">{isPlaying ? "Playing..." : "Paused"}</span>
                </div>

                <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
                    <button onClick={togglePlay} className="text-miku hover:scale-110 transition-transform">
                        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                    </button>
                    <button onClick={nextSong} className="text-slate-400 hover:text-miku transition-colors">
                        <SkipForward size={16} />
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default MusicPlayer;
