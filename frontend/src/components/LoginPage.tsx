import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Heart, Sparkles } from 'lucide-react';

interface LoginPageProps {
    onLogin: (username: string, password: string, rememberMe: boolean) => { success: boolean; error?: string };
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!username.trim()) {
            setError('Please enter your username');
            return;
        }

        if (!password.trim()) {
            setError('Please enter your password');
            return;
        }

        setError('');
        const result = onLogin(username, password, rememberMe);

        if (!result.success && result.error) {
            setError(result.error);
        }
    };

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-miku-light via-white to-blue-50 z-50 flex items-center justify-center overflow-hidden font-pixel">
            {/* Background decorations */}
            <div className="absolute inset-0 bg-pixel-pattern opacity-30 pointer-events-none" />

            {/* Floating elements */}
            <motion.div
                animate={{ y: [0, -20, 0], rotate: [0, 10, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/4 left-1/4 text-miku/30"
            >
                <Sparkles size={48} />
            </motion.div>
            <motion.div
                animate={{ y: [0, 20, 0], rotate: [0, -10, 10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-1/4 right-1/4 text-magenta/30"
            >
                <Heart size={48} />
            </motion.div>

            {/* Login Card */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full max-w-md mx-4"
            >
                <div className="glass-panel rounded-3xl p-8 shadow-2xl border-2 border-miku/20">
                    {/* Title */}
                    <div className="text-center mb-8">
                        <motion.div
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-miku via-miku-dark to-miku mb-2">
                                Welcome Back!
                            </h1>
                        </motion.div>
                        <p className="text-slate-500 text-sm">Login to continue your chat with Miku 💙</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Username */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Username
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-miku" size={20} />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:border-miku focus:ring-2 focus:ring-miku/20 outline-none transition-all"
                                    placeholder="Enter your username"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-miku" size={20} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:border-miku focus:ring-2 focus:ring-miku/20 outline-none transition-all"
                                    placeholder="Enter your password"
                                />
                            </div>
                        </div>

                        {/* Remember Me */}
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="rememberMe"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="w-4 h-4 text-miku border-slate-300 rounded focus:ring-miku"
                            />
                            <label htmlFor="rememberMe" className="ml-2 text-sm text-slate-600">
                                Remember me (auto-login next time)
                            </label>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg"
                            >
                                {error}
                            </motion.div>
                        )}

                        {/* Submit Button */}
                        <motion.button
                            type="submit"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-3 bg-gradient-to-r from-miku to-miku-dark text-white font-bold rounded-xl shadow-lg shadow-miku/30 hover:shadow-miku/50 transition-all"
                        >
                            Login
                        </motion.button>
                    </form>

                    {/* Footer */}
                    <div className="mt-6 text-center text-xs text-slate-400">
                        <p>First time? Just enter any username and password!</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
