import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { ShoppingBag, Star, Zap, Image as ImageIcon, Music } from 'lucide-react';

interface ShopItem {
    id: string;
    name: string;
    description: string;
    cost: number;
    icon: React.ReactNode;
    category: 'consumable' | 'outfit' | 'background' | 'music';
    image?: string;
}

const ITEMS: ShopItem[] = [
    { id: 'negi_shake', name: 'Negi Shake', description: 'Restores 20 Mood', cost: 10, icon: <Zap size={24} />, category: 'consumable', image: '/shop/negi_shake.png' },
    { id: 'cake', name: 'Strawberry Cake', description: 'Restores 50 Mood, +5 Affinity', cost: 30, icon: <Star size={24} />, category: 'consumable', image: '/shop/strawberry_cake.png' },
    { id: 'bg_vaporwave', name: 'Vaporwave BG', description: 'Retro aesthetic', cost: 100, icon: <ImageIcon size={24} />, category: 'background', image: '/shop/bg_vaporwave.png' },
    { id: 'bg_stage', name: 'Stage Live', description: 'Live concert stage', cost: 200, icon: <ImageIcon size={24} />, category: 'background', image: '/shop/bg_stage.png' },
    { id: 'outfit_school', name: 'School Uniform', description: 'Classic look', cost: 500, icon: <Star size={24} />, category: 'outfit', image: '/shop/outfit_school.png' },
    { id: 'song_worldismine', name: 'World is Mine', description: 'Classic hit song', cost: 50, icon: <Music size={24} />, category: 'music', image: '/shop/song_worldismine.png' },
];

const Shop: React.FC = () => {
    const { negiCoins, addCoins, changeMood, addAffinity } = useGame();
    const [activeCategory, setActiveCategory] = useState<'all' | 'consumable' | 'customization'>('all');

    const handleBuy = (item: ShopItem) => {
        if (negiCoins >= item.cost) {
            addCoins(-item.cost);
            // Apply effects
            if (item.id === 'negi_shake') changeMood(20);
            if (item.id === 'cake') {
                changeMood(50);
                addAffinity(5);
            }
            alert(`You bought ${item.name}!`);
        } else {
            alert("Not enough NegiCoins!");
        }
    };

    const filteredItems = ITEMS.filter(item => {
        if (activeCategory === 'all') return true;
        if (activeCategory === 'consumable') return item.category === 'consumable';
        if (activeCategory === 'customization') return ['outfit', 'background', 'music'].includes(item.category);
        return true;
    });

    return (
        <div className="h-full flex flex-col p-6 overflow-hidden">
            <header className="mb-8">
                <h1 className="text-3xl font-display font-bold text-theme-text flex items-center gap-3">
                    <ShoppingBag className="text-miku" />
                    Negi Store
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Spend your hard-earned NegiCoins here!</p>
            </header>

            {/* Categories */}
            <div className="flex gap-4 mb-6">
                {['all', 'consumable', 'customization'].map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat as any)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeCategory === cat
                            ? 'bg-miku text-white shadow-lg shadow-miku/20'
                            : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                    >
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                ))}
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-20">
                {filteredItems.map(item => (
                    <div key={item.id} className="glass-panel p-4 rounded-2xl flex flex-col gap-3 group hover:border-miku/50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                            {item.image ? (
                                <div className="w-full aspect-square bg-slate-50 dark:bg-slate-700/50 rounded-xl overflow-hidden mb-2 relative group-hover:shadow-lg transition-all">
                                    <div className="absolute inset-0 bg-miku/5 group-hover:bg-miku/0 transition-colors" />
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-300"
                                    />
                                </div>
                            ) : (
                                <div className="w-full aspect-square bg-miku/10 rounded-xl flex items-center justify-center text-miku group-hover:scale-105 transition-transform mb-2">
                                    {item.icon}
                                </div>
                            )}
                        </div>
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-theme-text">{item.name}</h3>
                                <p className="text-xs text-slate-500">{item.description}</p>
                            </div>
                            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-mono font-bold text-slate-600 dark:text-slate-300 shrink-0">
                                {item.cost} 🪙
                            </span>
                        </div>

                        <button
                            onClick={() => handleBuy(item)}
                            disabled={negiCoins < item.cost}
                            className={`mt-auto w-full py-2 rounded-xl text-sm font-bold transition-all ${negiCoins >= item.cost
                                ? 'bg-miku text-white hover:bg-miku-dark shadow-md hover:shadow-lg'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                        >
                            {negiCoins >= item.cost ? 'Buy Now' : 'Need More Negi'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Shop;
