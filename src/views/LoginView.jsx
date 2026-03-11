import React, { useState, useEffect } from 'react';
import { 
    Loader, Mail, Lock, Eye, EyeOff, LogIn, 
    Info, X, Code, Calendar, Phone, Mail as MailIcon 
} from 'lucide-react';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from '../utils/firebase';
import { brandingConfig } from '../assets/config/branding';

const LoginView = ({ theme }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showDevInfo, setShowDevInfo] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            if (rememberMe) {
                localStorage.setItem('rememberedEmail', email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }
        } catch (err) {
            setError("Gagal login. Periksa kembali email dan password Anda.");
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const remembered = localStorage.getItem('rememberedEmail');
        if (remembered) {
            setEmail(remembered);
            setRememberMe(true);
        }
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
            {/* Animated Background */}
            <div className="absolute inset-0">
                <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
            </div>

            {/* Developer Info Modal */}
            {showDevInfo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                    <div className="relative w-full max-w-md animate-slideUp">
                        {/* Glassmorphism Modal Card */}
                        <div className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
                            {/* Header with gradient */}
                            <div className="relative h-24 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                                <button
                                    onClick={() => setShowDevInfo(false)}
                                    className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-md transition-colors text-white"
                                >
                                    <X size={18} />
                                </button>
                                <div className="absolute -bottom-8 left-6">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 shadow-xl">
                                        <div className="w-full h-full rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
                                            <Code className="w-8 h-8 text-white" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="pt-12 pb-6 px-6">
                                <h3 className="text-2xl font-bold text-white mb-6">Informasi Developer</h3>
                                
                                {/* App Info Card */}
                                <div className="backdrop-blur-sm bg-white/5 rounded-2xl border border-white/10 p-5 mb-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                                            <Info className="w-4 h-4 text-indigo-300" />
                                        </div>
                                        <span className="text-sm font-medium text-indigo-200">Tentang Aplikasi</span>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center py-2 border-b border-white/10">
                                            <span className="text-sm text-gray-300">Nama Aplikasi</span>
                                            <span className="text-sm font-bold text-white">SIMONALISA</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-white/10">
                                            <span className="text-sm text-gray-300">Versi</span>
                                            <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">
                                                4.0
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Info Card */}
                                <div className="backdrop-blur-sm bg-white/5 rounded-2xl border border-white/10 p-5 mb-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                                <MailIcon className="w-4 h-4 text-emerald-300" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs text-gray-400">Email Developer</p>
                                                <a href="mailto:atariacorp@gmail.com" className="text-sm font-medium text-white hover:text-indigo-300 transition-colors">
                                                    atariacorp@gmail.com
                                                </a>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                                <Phone className="w-4 h-4 text-blue-300" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs text-gray-400">Nomor HP</p>
                                                <a href="tel:085234859011" className="text-sm font-medium text-white hover:text-indigo-300 transition-colors">
                                                    0852 3485 9011
                                                </a>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                                <Calendar className="w-4 h-4 text-purple-300" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs text-gray-400">Copyright</p>
                                                <p className="text-sm font-medium text-white">
                                                    @atariacorp2026
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Note */}
                                <p className="text-xs text-center text-gray-400">
                                    Aplikasi ini dikembangkan untuk monitoring dan analisis APBD
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Login Card */}
            <div className="relative w-full max-w-md p-4">
                <div className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5">
                            <div className="w-full h-full rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
                                <span className="text-3xl font-bold text-white">
                                    {brandingConfig?.text?.loginTitle?.[0] || 'S'}
                                </span>
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            {brandingConfig?.text?.loginTitle || 'SIMONALISA'}
                        </h1>
                        <p className="text-indigo-100">
                            {brandingConfig?.text?.loginSubtitle || 'Sistem Monitoring Analisa Anggaran Daerah'}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl backdrop-blur">
                            <p className="text-sm text-white text-center">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60" size={20} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                                    placeholder="Email"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60" size={20} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-12 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                                    placeholder="Password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 text-white/80">
                                <input 
                                    type="checkbox" 
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="rounded bg-white/20 border-white/30" 
                                />
                                <span>Ingat saya</span>
                            </label>
                            <a href="#" className="text-white/80 hover:text-white">Lupa password?</a>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-white hover:bg-white/90 text-indigo-900 font-bold rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? <Loader className="animate-spin" size={20} /> : <LogIn size={20} />}
                            {isLoading ? 'Memproses...' : 'Masuk'}
                        </button>
                    </form>

                    {/* Developer Info Link */}
                    <div className="mt-6 text-center">
                        <button
                            onClick={() => setShowDevInfo(true)}
                            className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors focus:outline-none"
                        >
                            <Info size={16} />
                            Informasi Developer
                        </button>
                    </div>

                    {/* Footer */}
                    <p className="mt-6 text-center text-xs text-white/40">
                        &copy; 2026 {brandingConfig?.text?.loginTitle || 'SIMONALISA'}. All rights reserved.
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes blob {
                    0%, 100% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-slideUp {
                    animation: slideUp 0.4s ease-out;
                }
            `}</style>
        </div>
    );
};

export default LoginView;
