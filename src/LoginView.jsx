import React, { useState } from 'react';
import { Loader, LogIn } from 'lucide-react';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from './firebase';

const LoginView = ({ theme }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // onAuthStateChanged akan menangani redirect
        } catch (err) {
            setError("Gagal login. Periksa kembali email dan password Anda.");
            console.error("Login error:", err);
            setIsLoading(false);
        }
    };

    return (
        <div className={`min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 ${theme}`}>
            <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                <div className="text-center">
                    {/* LOGO DITAMBAHKAN DI SINI */}
                    <img 
                        src="/logo.png" 
                        alt="Logo Kota Medan" 
                        className="w-24 h-24 mx-auto mb-4"
                    />
                    <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        Sistem Informasi Analisa APBD Kota Medan
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Silakan login untuk melanjutkan
                    </p>
                </div>
                <form className="space-y-6" onSubmit={handleLogin}>
                    <div>
                        <label htmlFor="email" className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">
                            Alamat Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="nama@email.com"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="********"
                        />
                    </div>
                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <Loader className="animate-spin mr-2" size={20} /> : <LogIn className="mr-2" size={20} />}
                            {isLoading ? 'Memproses...' : 'Login'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginView;