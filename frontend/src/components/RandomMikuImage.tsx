import React, { useState, useEffect } from 'react';
import { RefreshCw, ExternalLink, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MikuImageData {
    image_url: string;
    source_url: string;
    tags: string[];
    width: number;
    height: number;
    rating: string;
}

const RandomMikuImage: React.FC = () => {
    const [imageData, setImageData] = useState<MikuImageData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchRandomImage = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('http://localhost:8000/api/random-miku-image');
            const data = await response.json();

            if (data.error || !data.image_url) {
                setError('Failed to load image');
            } else {
                setImageData(data);
            }
        } catch (err) {
            setError('Network error');
            console.error('Error fetching random Miku image:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRandomImage();
    }, []);

    return (
        <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-3 border border-miku/20">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-theme-text flex items-center gap-1">
                    <Heart size={14} className="text-miku fill-miku" />
                    每日 Miku
                </h3>
                <button
                    onClick={fetchRandomImage}
                    disabled={loading}
                    className="p-1 hover:bg-miku/10 rounded transition-colors disabled:opacity-50"
                    title="刷新图片"
                >
                    <RefreshCw size={14} className={`text-miku ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <AnimatePresence mode="wait">
                {loading && !imageData && (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="aspect-square bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center"
                    >
                        <RefreshCw className="animate-spin text-miku" size={24} />
                    </motion.div>
                )}

                {error && !imageData && (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="aspect-square bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center text-xs text-red-500 p-2 text-center"
                    >
                        {error}
                    </motion.div>
                )}

                {imageData && (
                    <motion.div
                        key={imageData.image_url}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="space-y-2"
                    >
                        <div className="relative group rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700">
                            <img
                                src={imageData.image_url}
                                alt="Random Miku"
                                className="w-full h-auto object-cover"
                                loading="lazy"
                                onError={(e) => {
                                    e.currentTarget.src = '/miku_avatar.png';
                                }}
                            />
                            <a
                                href={imageData.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute inset-0 bg-black/0 hover:bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <ExternalLink className="text-white" size={24} />
                            </a>
                        </div>

                        <div className="flex flex-wrap gap-1">
                            {imageData.tags.slice(0, 3).map((tag, index) => (
                                <span
                                    key={index}
                                    className="text-[10px] px-1.5 py-0.5 bg-miku/10 text-miku-dark rounded"
                                >
                                    {tag.replace(/_/g, ' ')}
                                </span>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default RandomMikuImage;
