import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// Definitions for levels
export const AFFINITY_LEVELS = [
    { level: 1, min: 0, title: 'Stranger', color: 'text-gray-400' },
    { level: 2, min: 20, title: 'Acquaintance', color: 'text-blue-400' },
    { level: 3, min: 50, title: 'Friend', color: 'text-green-400' },
    { level: 4, min: 80, title: 'Bestie', color: 'text-pink-400' },
    { level: 5, min: 100, title: 'Soulmate', color: 'text-red-500' }, // Endless
];

interface GameState {
    affinity: number;
    negiCoins: number;
    mood: number; // 0-100
}

interface Notification {
    id: string;
    message: string;
    type: 'success' | 'info' | 'warning';
}

interface GameContextType extends GameState {
    addAffinity: (amount: number) => void;
    addCoins: (amount: number) => void;
    changeMood: (amount: number) => void;
    currentLevel: typeof AFFINITY_LEVELS[0];
    triggerInteraction: (type: 'chat' | 'touch' | 'gift') => void;
    notifications: Notification[];
    removeNotification: (id: string) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const INITIAL_STATE: GameState = {
    affinity: 0,
    negiCoins: 50, // Initial bonus
    mood: 80,
};

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Load from local storage or use initial
    const [state, setState] = useState<GameState>(() => {
        const saved = localStorage.getItem('miku_game_state');
        return saved ? JSON.parse(saved) : INITIAL_STATE;
    });

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [lastInteraction, setLastInteraction] = useState<Record<string, number>>({});

    // Save to local storage whenever state changes
    useEffect(() => {
        localStorage.setItem('miku_game_state', JSON.stringify(state));
    }, [state]);

    const addNotification = (message: string, type: 'success' | 'info' | 'warning' = 'info') => {
        const id = Date.now().toString() + Math.random().toString();
        setNotifications(prev => [...prev, { id, message, type }]);

        // Auto remove after 3 seconds
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 3000);
    };

    const removeNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const addAffinity = (amount: number) => {
        setState(prev => ({
            ...prev,
            affinity: Math.max(0, prev.affinity + amount)
        }));
    };

    const addCoins = (amount: number) => {
        setState(prev => ({
            ...prev,
            negiCoins: Math.max(0, prev.negiCoins + amount)
        }));
    };

    const changeMood = (amount: number) => {
        setState(prev => ({
            ...prev,
            mood: Math.min(100, Math.max(0, prev.mood + amount))
        }));
    };

    const triggerInteraction = (type: 'chat' | 'touch' | 'gift') => {
        const now = Date.now();
        const lastTime = lastInteraction[type] || 0;
        let cooldown = 0;

        if (type === 'touch') cooldown = 5000; // 5 seconds for touch
        if (type === 'gift') cooldown = 1000;

        if (now - lastTime < cooldown) {
            if (type === 'touch') {
                // Optional: warn about touching too much?
                // addNotification("Miku needs some space!", 'warning');
            }
            return;
        }

        setLastInteraction(prev => ({ ...prev, [type]: now }));

        // Core game loop logic here
        switch (type) {
            case 'chat':
                addAffinity(1);
                addCoins(1);
                changeMood(0.5);
                // Chat is subtle, maybe no notification or just for coins?
                // addNotification("+1 NegiCoin", 'success'); 
                break;
            case 'touch':
                if (state.mood > 20) {
                    addAffinity(2);
                    addCoins(2);
                    changeMood(1);
                    addNotification("Miku liked that! +2 Affinity", 'success');
                } else {
                    addAffinity(-1);
                    changeMood(-2);
                    addNotification("Miku is annoyed...", 'warning');
                }
                break;
            case 'gift':
                // Handled by shop usually, but generic hook
                break;
        }
    };

    const currentLevel = AFFINITY_LEVELS.slice().reverse().find(l => state.affinity >= l.min) || AFFINITY_LEVELS[0];

    return (
        <GameContext.Provider value={{
            ...state,
            addAffinity,
            addCoins,
            changeMood,
            currentLevel,
            triggerInteraction,
            notifications,
            removeNotification
        }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGame = () => {
    const context = useContext(GameContext);
    if (context === undefined) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
};
