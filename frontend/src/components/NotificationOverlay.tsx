import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { Heart, Info, AlertTriangle } from 'lucide-react';

const NotificationOverlay: React.FC = () => {
    const { notifications, removeNotification } = useGame();

    return (
        <div className="fixed top-24 right-4 z-50 flex flex-col gap-2 pointer-events-none">
            <AnimatePresence>
                {notifications.map((notification) => (
                    <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 50, scale: 0.9 }}
                        className="pointer-events-auto"
                        onClick={() => removeNotification(notification.id)}
                    >
                        <div className={`
                            flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-md
                            ${notification.type === 'success' ? 'bg-miku/10 border-miku/30 text-miku-dark' : ''}
                            ${notification.type === 'info' ? 'bg-blue-500/10 border-blue-500/30 text-blue-600' : ''}
                            ${notification.type === 'warning' ? 'bg-red-500/10 border-red-500/30 text-red-600' : ''}
                        `}>
                            {notification.type === 'success' && <Heart className="w-5 h-5 fill-current" />}
                            {notification.type === 'info' && <Info className="w-5 h-5" />}
                            {notification.type === 'warning' && <AlertTriangle className="w-5 h-5" />}

                            <span className="font-medium text-sm">{notification.message}</span>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default NotificationOverlay;
