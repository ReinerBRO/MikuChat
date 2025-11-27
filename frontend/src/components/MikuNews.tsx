import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Newspaper, Calendar, ExternalLink, Music, Ticket, ShoppingBag, Gamepad2, Users, Sparkles, Loader2 } from 'lucide-react';

interface NewsItem {
    id: string;
    title: string;
    content: string;
    category: string;
    source: string;
    publishTime: string;
    url: string;
    thumbnail?: string;
}

const categories = [
    { name: '全部', icon: Sparkles, color: 'text-miku' },
    { name: '演唱会/活动', icon: Ticket, color: 'text-pink-500' },
    { name: '新曲发布', icon: Music, color: 'text-purple-500' },
    { name: '周边商品', icon: ShoppingBag, color: 'text-blue-500' },
    { name: '游戏更新', icon: Gamepad2, color: 'text-green-500' },
    { name: '社区动态', icon: Users, color: 'text-orange-500' },
];

export default function MikuNews() {
    const [selectedCategory, setSelectedCategory] = useState('全部');
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/news');
                if (!response.ok) {
                    throw new Error('Failed to fetch news');
                }
                const data = await response.json();
                setNews(data.news || []);
            } catch (err) {
                console.error('Error fetching news:', err);
                setError('无法获取新闻，请检查后端服务是否运行');
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, []);

    const filteredNews = selectedCategory === '全部'
        ? news
        : news.filter(item => item.category === selectedCategory);

    const getCategoryIcon = (categoryName: string) => {
        const category = categories.find(c => c.name === categoryName);
        return category ? category.icon : Newspaper;
    };

    const getCategoryColor = (categoryName: string) => {
        const category = categories.find(c => c.name === categoryName);
        return category ? category.color : 'text-miku';
    };

    return (
        <div className="h-full flex flex-col bg-tech-bg">
            {/* Header */}
            <header className="glass-panel rounded-2xl p-6 mb-6 shrink-0">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-miku to-blue-500 flex items-center justify-center">
                        <Newspaper className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-display font-bold text-theme-text">Miku News</h1>
                        <p className="text-sm text-theme-text-muted">初音未来最新资讯</p>
                    </div>
                </div>

                {/* Category Filter */}
                <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
                    {categories.map((category) => {
                        const Icon = category.icon;
                        const isSelected = selectedCategory === category.name;

                        return (
                            <motion.button
                                key={category.name}
                                onClick={() => setSelectedCategory(category.name)}
                                className={`
                                    flex items-center gap-2 px-4 py-2 rounded-xl shrink-0 transition-all
                                    ${isSelected
                                        ? 'bg-gradient-to-r from-miku/20 to-blue-500/20 border-2 border-miku'
                                        : 'glass-panel hover:bg-miku/5'
                                    }
                                `}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Icon className={`w-4 h-4 ${isSelected ? 'text-miku' : category.color}`} />
                                <span className={`text-sm font-medium ${isSelected ? 'text-miku' : 'text-theme-text'}`}>
                                    {category.name}
                                </span>
                            </motion.button>
                        );
                    })}
                </div>
            </header>

            {/* News List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 text-miku">
                        <Loader2 className="w-8 h-8 animate-spin mb-2" />
                        <p>正在获取最新Miku资讯...</p>
                    </div>
                ) : error ? (
                    <div className="glass-panel rounded-2xl p-12 text-center">
                        <Newspaper className="w-16 h-16 text-red-400 mx-auto mb-4 opacity-50" />
                        <p className="text-red-400">{error}</p>
                    </div>
                ) : filteredNews.length === 0 ? (
                    <div className="glass-panel rounded-2xl p-12 text-center">
                        <Newspaper className="w-16 h-16 text-theme-text-muted mx-auto mb-4 opacity-50" />
                        <p className="text-theme-text-muted">暂无{selectedCategory}相关新闻</p>
                    </div>
                ) : (
                    filteredNews.map((item, index) => {
                        const CategoryIcon = getCategoryIcon(item.category);
                        const categoryColor = getCategoryColor(item.category);

                        return (
                            <motion.article
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="glass-panel rounded-2xl overflow-hidden hover:shadow-lg transition-shadow group"
                            >
                                <div className="flex flex-col md:flex-row">
                                    {/* Thumbnail */}
                                    {item.thumbnail && (
                                        <div className="md:w-1/3 h-48 md:h-auto relative overflow-hidden">
                                            <img
                                                src={item.thumbnail}
                                                alt={item.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                                        </div>
                                    )}

                                    {/* Content */}
                                    <div className="flex-1 p-6">
                                        {/* Category Badge */}
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-miku/10 to-blue-500/10 border border-miku/30`}>
                                                <CategoryIcon className={`w-3.5 h-3.5 ${categoryColor}`} />
                                                <span className={`text-xs font-medium ${categoryColor}`}>
                                                    {item.category}
                                                </span>
                                            </div>
                                            <span className="text-xs text-theme-text-muted">
                                                {item.source}
                                            </span>
                                        </div>

                                        {/* Title */}
                                        <h2 className="text-xl font-bold text-theme-text mb-3 group-hover:text-miku transition-colors">
                                            {item.title}
                                        </h2>

                                        {/* Content Preview */}
                                        <p className="text-sm text-theme-text-muted mb-4 line-clamp-2">
                                            {item.content}
                                        </p>

                                        {/* Footer */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-xs text-theme-text-muted">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>{item.publishTime}</span>
                                            </div>

                                            <a
                                                href={item.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-miku/20 to-blue-500/20 hover:from-miku/30 hover:to-blue-500/30 border border-miku/50 hover:border-miku transition-all group/link"
                                            >
                                                <span className="text-sm font-medium text-miku">查看详情</span>
                                                <ExternalLink className="w-3.5 h-3.5 text-miku group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </motion.article>
                        );
                    })
                )}
            </div>
        </div>
    );
}
