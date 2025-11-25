import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Disc, Play, Pause, SkipForward, SkipBack, Music, Search, Globe, Folder } from 'lucide-react';

interface Song {
    name: string;
    url: string;
    type: 'local' | 'online';
    id?: string;
    duration?: number;
    uploader?: string;
}

const MusicPlayer: React.FC = () => {
    const [songs, setSongs] = useState<Song[]>([]);
    const [currentSongIndex, setCurrentSongIndex] = useState<number>(-1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [mode, setMode] = useState<'local' | 'online'>('local');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Song[]>([]);
    const [isSearching, setIsSearching] = useState(false);

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
                    uploader: r.uploader
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
        // Add to playlist if not present
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

    const togglePlay = () => {
        setIsPlaying(!isPlaying);
    };

    const nextSong = () => {
        if (songs.length === 0) return;
        setCurrentSongIndex((prev) => (prev + 1) % songs.length);
    };

    const prevSong = () => {
        if (songs.length === 0) return;
        setCurrentSongIndex((prev) => (prev - 1 + songs.length) % songs.length);
    };

    const handleEnded = () => {
        nextSong();
    };

    return (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
            <audio
                ref={audioRef}
                onEnded={handleEnded}
                onError={(e) => console.error("Audio error:", e)}
            />

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="mb-4 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-miku/20 w-80 max-h-[500px] flex flex-col"
                    >
                        {/* Mode Switcher */}
                        <div className="flex bg-slate-100 rounded-lg p-1 mb-4">
                            <button
                                onClick={() => setMode('local')}
                                className={`flex-1 py-1 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1 ${mode === 'local' ? 'bg-white text-miku shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <Folder size={14} /> Local
                            </button>
                            <button
                                onClick={() => setMode('online')}
                                className={`flex-1 py-1 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1 ${mode === 'online' ? 'bg-white text-miku shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <Globe size={14} /> Online
                            </button>
                        </div>

                        {mode === 'online' && (
                            <div className="mb-4">
                                <form onSubmit={handleSearch} className="relative">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search YouTube..."
                                        className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:border-miku focus:ring-1 focus:ring-miku outline-none"
                                    />
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                </form>

                                <div className="mt-2 max-h-40 overflow-y-auto space-y-1 custom-scrollbar">
                                    {isSearching ? (
                                        <div className="text-center py-4 text-xs text-slate-400">Searching...</div>
                                    ) : searchResults.length > 0 ? (
                                        searchResults.map((song) => (
                                            <button
                                                key={song.id}
                                                onClick={() => playOnlineSong(song)}
                                                className="w-full text-left p-2 hover:bg-miku/10 rounded-lg group transition-colors flex items-center gap-2"
                                            >
                                                <div className="w-8 h-8 bg-slate-200 rounded flex items-center justify-center flex-shrink-0">
                                                    <Music size={14} className="text-slate-400 group-hover:text-miku" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-xs font-medium text-slate-700 truncate">{song.name}</div>
                                                    <div className="text-[10px] text-slate-400 truncate">{song.uploader}</div>
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="text-center py-4 text-xs text-slate-400">No results</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Vinyl Visual */}
                        <div className="relative w-48 h-48 mx-auto mb-4 flex-shrink-0">
                            <motion.div
                                animate={{ rotate: isPlaying ? 360 : 0 }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatType: "loop" }}
                                className="w-full h-full rounded-full bg-black flex items-center justify-center shadow-lg border-4 border-gray-800"
                                style={{
                                    background: 'conic-gradient(from 0deg, #111 0%, #333 10%, #111 20%, #333 30%, #111 40%, #333 50%, #111 60%, #333 70%, #111 80%, #333 90%, #111 100%)'
                                }}
                            >
                                {/* Label */}
                                <div className="w-16 h-16 rounded-full bg-miku flex items-center justify-center border-2 border-white overflow-hidden">
                                    {songs[currentSongIndex]?.type === 'online' ? (
                                        <Globe size={24} className="text-white" />
                                    ) : (
                                        <Music size={24} className="text-white" />
                                    )}
                                </div>
                            </motion.div>
                            {/* Tone Arm */}
                            <div className="absolute top-0 right-0 w-2 h-24 bg-gray-400 origin-top rotate-12 rounded-full shadow-md" style={{ transform: isPlaying ? 'rotate(25deg)' : 'rotate(0deg)', transition: 'transform 0.5s' }} />
                        </div>

                        {/* Song Info */}
                        <div className="text-center mb-4 overflow-hidden">
                            <h3 className="font-bold text-slate-800 truncate text-sm">
                                {songs[currentSongIndex]?.name || "No Song Selected"}
                            </h3>
                            {songs[currentSongIndex]?.uploader && (
                                <p className="text-xs text-slate-500 truncate">{songs[currentSongIndex].uploader}</p>
                            )}
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-center gap-4">
                            <button onClick={prevSong} className="p-2 text-slate-600 hover:text-miku transition-colors">
                                <SkipBack size={20} />
                            </button>
                            <button
                                onClick={togglePlay}
                                className="w-10 h-10 rounded-full bg-miku text-white flex items-center justify-center shadow-lg hover:bg-miku-dark transition-colors"
                            >
                                {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
                            </button>
                            <button onClick={nextSong} className="p-2 text-slate-600 hover:text-miku transition-colors">
                                <SkipForward size={20} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsExpanded(!isExpanded)}
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${isPlaying ? 'bg-miku text-white animate-pulse-slow' : 'bg-white text-slate-600 hover:text-miku'
                    }`}
            >
                <Disc size={24} className={isPlaying ? 'animate-spin-slow' : ''} />
            </motion.button>
        </div>
    );
};

export default MusicPlayer;
