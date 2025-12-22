import React, { useState, useEffect } from 'react';
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
    { id: 'negi_shake', name: '葱葱奶昔', description: '回复 20 点心情', cost: 10, icon: <Zap size={24} />, category: 'consumable', image: '/shop/negi_shake.png' },
    { id: 'cake', name: '草莓蛋糕', description: '回复 50 点心情, +5 好感度', cost: 30, icon: <Star size={24} />, category: 'consumable', image: '/shop/strawberry_cake.png' },
    { id: 'cyber_room', name: '未来公寓', description: 'Miku 的高科技房间', cost: 200, icon: <ImageIcon size={24} />, category: 'background', image: '/backgrounds/miku_cyber_room.png' },
    { id: 'japanese_room', name: '和风茶室', description: '宁静的日式庭院', cost: 250, icon: <ImageIcon size={24} />, category: 'background', image: '/backgrounds/miku_japanese_room.png' },
    { id: 'outfit_school', name: 'JK 制服', description: '经典的校园造型', cost: 500, icon: <Star size={24} />, category: 'outfit', image: '/shop/outfit_school.png' },
    { id: 'song_worldismine', name: '世界第一公主殿下', description: 'Miku 的经典名曲', cost: 50, icon: <Music size={24} />, category: 'music', image: '/shop/song_worldismine.png' },
];

const Shop: React.FC = () => {
    const { negiCoins, addCoins, changeMood, addAffinity, unlockItem, equipItem, ownedItems, equippedItems, addNotification, playVoice } = useGame();
    const [activeCategory, setActiveCategory] = useState<'all' | 'consumable' | 'customization'>('all');

    // Play Welcome Voice on mount
    useEffect(() => {
        playVoice('/audio/welcome_shop.wav');
    }, []);

    const handleBuy = (item: ShopItem) => {
        if (ownedItems.includes(item.id)) {
            // Equip item
            if (item.category === 'outfit' || item.category === 'background') {
                equipItem(item.category, item.id);
                addNotification(`已装备 ${item.name}!`, 'success');
            }
            return;
        }

        if (negiCoins >= item.cost) {
            addCoins(-item.cost);
            // Apply effects
            if (item.id === 'negi_shake') changeMood(20);
            if (item.id === 'cake') {
                changeMood(50);
                addAffinity(5);
            }

            // Unlock if not consumable
            if (item.category !== 'consumable') {
                unlockItem(item.id);
                // Auto-equip
                if (item.category === 'outfit' || item.category === 'background') {
                    equipItem(item.category, item.id);
                }
            }

            addNotification(`购买了 ${item.name}!`, 'success');
        } else {
            addNotification("葱葱币不足", 'warning');
        }
    };

    const filteredItems = ITEMS.filter(item => {
        if (activeCategory === 'all') return true;
        if (activeCategory === 'consumable') return item.category === 'consumable' || item.category === 'music';
        if (activeCategory === 'customization') return item.category === 'outfit' || item.category === 'background';
        return true;
    });

    return (
        <div className="h-full flex flex-col p-6 overflow-hidden">
            <header className="mb-8 flex-shrink-0">
                <div className="flex items-center gap-3 mb-2">
                    <ShoppingBag className="text-miku" size={32} />
                    <h1 className="text-3xl font-display font-bold text-slate-800">葱葱商店</h1>
                </div>
                <p className="text-slate-500">在这里使用你的葱葱币兑换礼物吧！</p>

                <div className="flex gap-2 mt-6">
                    <button
                        onClick={() => setActiveCategory('all')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeCategory === 'all' ? 'bg-miku text-white shadow-lg shadow-miku/30' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                    >
                        全部
                    </button>
                    <button
                        onClick={() => setActiveCategory('consumable')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeCategory === 'consumable' ? 'bg-miku text-white shadow-lg shadow-miku/30' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                    >
                        消耗品
                    </button>
                    <button
                        onClick={() => setActiveCategory('customization')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeCategory === 'customization' ? 'bg-miku text-white shadow-lg shadow-miku/30' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                    >
                        个性化
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                    {filteredItems.map(item => {
                        const isOwned = ownedItems.includes(item.id);
                        const isEquipped = equippedItems.outfit === item.id || equippedItems.background === item.id;

                        return (
                            <div key={item.id} className="bg-white rounded-[2rem] p-4 flex flex-col gap-4 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-transparent hover:border-miku/20 group">
                                <div className="aspect-square bg-slate-50 rounded-3xl flex items-center justify-center relative overflow-hidden group-hover:bg-miku/5 transition-colors">
                                    {item.image ? (
                                        <img src={item.image} alt={item.name} className="w-[80%] h-[80%] object-contain drop-shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3" />
                                    ) : (
                                        <div className="text-miku/20">{item.icon}</div>
                                    )}
                                    {isEquipped && (
                                        <div className="absolute top-3 right-3 bg-miku text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                                            使用中
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-bold text-lg text-slate-800">{item.name}</h3>
                                        <span className="flex items-center text-sm font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                                            {item.cost} <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-miku to-green-300 ml-1"></div>
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-400 font-medium">{item.description}</p>
                                </div>
                                <button
                                    onClick={() => handleBuy(item)}
                                    disabled={!isOwned && negiCoins < item.cost}
                                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${isOwned
                                        ? isEquipped
                                            ? 'bg-green-100 text-green-600 cursor-default'
                                            : 'bg-miku/10 text-miku hover:bg-miku hover:text-white'
                                        : negiCoins >= item.cost
                                            ? 'bg-gradient-to-r from-miku to-teal-400 text-white shadow-lg shadow-miku/20 hover:shadow-miku/40 hover:scale-[1.02]'
                                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        }`}
                                >
                                    {isOwned
                                        ? isEquipped ? '已装备' : '装备'
                                        : '立即购买'
                                    }
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Shop;
