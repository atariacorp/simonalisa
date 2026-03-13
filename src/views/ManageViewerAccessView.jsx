// src/views/ManageViewerAccessView.jsx
import React, { useState, useEffect } from 'react';
import SectionTitle from '../components/SectionTitle';
import GeminiAnalysis from '../components/GeminiAnalysis';
import { 
    Users, Search, Save, Check, X, Eye, EyeOff,
    Shield, UserCog, Building2, AlertCircle, CheckCircle,
    Loader, RefreshCw, Lock, Unlock, Globe, Filter
} from 'lucide-react';
import { db } from '../utils/firebase';
import { collection, getDocs, doc, getDoc, setDoc, query, where } from 'firebase/firestore';
import { userService } from '../services/userService';
import { logActivity } from '../utils/logActivity';

const ManageViewerAccessView = ({ theme, selectedYear, userRole }) => {
    const [viewers, setViewers] = useState([]);
    const [allSKPD, setAllSKPD] = useState([]);
    const [selectedViewer, setSelectedViewer] = useState(null);
    const [selectedSKPD, setSelectedSKPD] = useState([]);
    const [canViewAll, setCanViewAll] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [skpdSearchTerm, setSkpdSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loadingSKPD, setLoadingSKPD] = useState(false);

    // Fetch semua viewer
    useEffect(() => {
        const fetchViewers = async () => {
            if (userRole !== 'admin') return;
            
            setLoading(true);
            try {
                const viewersList = await userService.getUsersByRole('viewer');
                setViewers(viewersList);
                
                // Ambil juga akses masing-masing viewer
                const viewersWithAccess = await Promise.all(
                    viewersList.map(async (viewer) => {
                        const access = await userService.getSKPDAccess(viewer.uid);
                        return {
                            ...viewer,
                            ...access
                        };
                    })
                );
                setViewers(viewersWithAccess);
            } catch (error) {
                console.error('Error fetching viewers:', error);
                setError('Gagal mengambil data viewer');
            } finally {
                setLoading(false);
            }
        };

        fetchViewers();
    }, [userRole]);

    // Fetch semua SKPD dari data anggaran
    const fetchAllSKPD = async () => {
        setLoadingSKPD(true);
        try {
            const skpdList = await userService.getAllSKPD(selectedYear);
            setAllSKPD(skpdList);
        } catch (error) {
            console.error('Error fetching SKPD:', error);
            setError('Gagal mengambil daftar SKPD');
        } finally {
            setLoadingSKPD(false);
        }
    };

    // Load akses viewer yang dipilih
    const loadViewerAccess = async (viewer) => {
        setSelectedViewer(viewer);
        setCanViewAll(viewer.canViewAllSKPD || false);
        setSelectedSKPD(viewer.allowedSKPD || []);
        setSkpdSearchTerm('');
        
        // Fetch SKPD jika belum ada
        if (allSKPD.length === 0) {
            await fetchAllSKPD();
        }
    };

    // Toggle pilih semua SKPD
    const toggleSelectAll = () => {
        if (selectedSKPD.length === filteredSKPD.length) {
            setSelectedSKPD([]);
        } else {
            setSelectedSKPD(filteredSKPD.map(s => s));
        }
    };

    // Toggle SKPD individual
    const toggleSKPD = (skpd) => {
        setSelectedSKPD(prev =>
            prev.includes(skpd)
                ? prev.filter(s => s !== skpd)
                : [...prev, skpd]
        );
    };

    // Simpan akses
    const handleSaveAccess = async () => {
        if (!selectedViewer) return;
        
        setSaving(true);
        setError('');
        setSuccess('');
        
        try {
            await userService.updateSKPDAccess(selectedViewer.uid, {
                canViewAllSKPD: canViewAll,
                allowedSKPD: canViewAll ? [] : selectedSKPD
            });
            
            // Update state viewer
            setViewers(prev => prev.map(v => 
                v.uid === selectedViewer.uid 
                    ? { ...v, canViewAllSKPD: canViewAll, allowedSKPD: canViewAll ? [] : selectedSKPD }
                    : v
            ));
            
            setSuccess('Akses berhasil disimpan!');
            await logActivity('Update Akses Viewer', { 
                viewerEmail: selectedViewer.email,
                canViewAll: canViewAll,
                skpdCount: selectedSKPD.length 
            });
            
            // Reset success message after 3 seconds
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            console.error('Error saving access:', error);
            setError('Gagal menyimpan akses');
        } finally {
            setSaving(false);
        }
    };

    // Filter SKPD berdasarkan pencarian
    const filteredSKPD = allSKPD.filter(skpd =>
        skpd.toLowerCase().includes(skpdSearchTerm.toLowerCase())
    );

    // Filter viewers berdasarkan pencarian
    const filteredViewers = viewers.filter(viewer =>
        viewer.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Gemini Analysis Prompt
    const getAnalysisPrompt = (customQuery) => {
        if (customQuery) {
            return `Berdasarkan data akses viewer, berikan analisis untuk: "${customQuery}"`;
        }
        
        const totalViewers = viewers.length;
        const viewersWithAllAccess = viewers.filter(v => v.canViewAllSKPD).length;
        const totalSKPDAccess = viewers.reduce((sum, v) => sum + (v.allowedSKPD?.length || 0), 0);
        
        return `
            Anda adalah seorang konsultan manajemen akses sistem. Analisis data akses viewer berikut:

            ### STATISTIK AKSES VIEWER
            - **Total Viewer**: ${totalViewers} pengguna
            - **Viewer dengan Akses Semua SKPD**: ${viewersWithAllAccess} pengguna
            - **Rata-rata SKPD per Viewer**: ${totalViewers ? (totalSKPDAccess / totalViewers).toFixed(1) : 0} SKPD
            - **Total SKPD Tersedia**: ${allSKPD.length} SKPD

            Berikan analisis dan rekomendasi mengenai:
            1. **Keamanan Akses**: Apakah pemberian akses "Semua SKPD" sudah tepat?
            2. **Efisiensi**: Saran untuk mengelola akses viewer secara lebih efisien.
            3. **Best Practice**: Rekomendasi pola pemberian akses berdasarkan struktur organisasi.
        `;
    };

    if (userRole !== 'admin') {
        return (
            <div className="p-6">
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 text-center">
                    <Shield className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-amber-700 dark:text-amber-300">Akses Dibatasi</h3>
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                        Halaman ini hanya dapat diakses oleh Administrator.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <SectionTitle>KELOLA AKSES VIEWER</SectionTitle>

            {/* Gemini Analysis */}
            <GeminiAnalysis 
                getAnalysisPrompt={getAnalysisPrompt}
                disabledCondition={false}
                theme={theme}
                interactivePlaceholder="Analisis pola akses viewer..."
                userCanUseAi={userRole === 'admin'}
            />

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Daftar Viewer */}
                <div className="lg:col-span-1">
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-gray-700/30 shadow-xl overflow-hidden">
                        <div className="p-5 border-b border-white/30 dark:border-gray-700/30">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                    <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Daftar Viewer</h3>
                            </div>
                            
                            {/* Search Viewer */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Cari viewer..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                />
                            </div>
                        </div>

                        <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[500px] overflow-y-auto">
                            {loading ? (
                                <div className="p-8 text-center">
                                    <Loader className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">Memuat data...</p>
                                </div>
                            ) : filteredViewers.length === 0 ? (
                                <div className="p-8 text-center">
                                    <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">Tidak ada viewer</p>
                                </div>
                            ) : (
                                filteredViewers.map(viewer => (
                                    <button
                                        key={viewer.uid}
                                        onClick={() => loadViewerAccess(viewer)}
                                        className={`w-full p-4 text-left hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors ${
                                            selectedViewer?.uid === viewer.uid 
                                                ? 'bg-indigo-50/50 dark:bg-indigo-900/20 border-l-4 border-indigo-500' 
                                                : ''
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
                                                {viewer.email?.[0]?.toUpperCase() || 'V'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-800 dark:text-white truncate">
                                                    {viewer.email}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {viewer.canViewAllSKPD ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs rounded-full">
                                                            <Globe size={10} /> Semua SKPD
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                                                            <Building2 size={10} /> {viewer.allowedSKPD?.length || 0} SKPD
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Panel Pengaturan Akses */}
                <div className="lg:col-span-2">
                    {selectedViewer ? (
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-gray-700/30 shadow-xl p-6">
                            {/* Header */}
                            <div className="flex items-center gap-4 pb-5 mb-5 border-b border-white/30 dark:border-gray-700/30">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                                    {selectedViewer.email?.[0]?.toUpperCase() || 'V'}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                                        {selectedViewer.email}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Atur akses SKPD untuk viewer ini
                                    </p>
                                </div>
                                <div className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium">
                                    Viewer
                                </div>
                            </div>

                            {/* Success/Error Messages */}
                            {error && (
                                <div className="mb-5 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg flex items-center gap-2">
                                    <AlertCircle size={16} className="text-rose-500" />
                                    <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
                                </div>
                            )}
                            
                            {success && (
                                <div className="mb-5 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2">
                                    <CheckCircle size={16} className="text-emerald-500" />
                                    <p className="text-sm text-emerald-700 dark:text-emerald-300">{success}</p>
                                </div>
                            )}

                            {/* Opsi View All */}
                            <div className="mb-6 p-5 bg-gray-50/50 dark:bg-gray-900/50 rounded-xl">
                                <label className="flex items-center justify-between cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                                            {canViewAll ? (
                                                <Unlock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                            ) : (
                                                <Lock className="w-5 h-5 text-gray-400" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800 dark:text-white">Akses ke SEMUA SKPD</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Jika diaktifkan, viewer dapat melihat semua data SKPD tanpa batasan
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCanViewAll(!canViewAll);
                                            if (!canViewAll) setSelectedSKPD([]);
                                        }}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                            canViewAll ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                                        }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                canViewAll ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </label>
                            </div>

                            {/* Pilih SKPD (jika tidak view all) */}
                            {!canViewAll && (
                                <>
                                    {/* Search and Select All */}
                                    <div className="mb-4 flex items-center gap-3">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                type="text"
                                                placeholder="Cari SKPD..."
                                                value={skpdSearchTerm}
                                                onChange={(e) => setSkpdSearchTerm(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2.5 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                            />
                                        </div>
                                        <button
                                            onClick={toggleSelectAll}
                                            className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl transition-colors text-sm font-medium flex items-center gap-2"
                                        >
                                            <Filter size={16} />
                                            {selectedSKPD.length === filteredSKPD.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                                        </button>
                                    </div>

                                    {/* Daftar SKPD */}
                                    {loadingSKPD ? (
                                        <div className="p-8 text-center border rounded-xl">
                                            <Loader className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-2" />
                                            <p className="text-sm text-gray-500">Memuat daftar SKPD...</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto p-3 border rounded-xl bg-gray-50/30 dark:bg-gray-900/30">
                                                {filteredSKPD.map(skpd => (
                                                    <button
                                                        key={skpd}
                                                        onClick={() => toggleSKPD(skpd)}
                                                        className={`flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                                                            selectedSKPD.includes(skpd)
                                                                ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                                                                : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 border border-transparent'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                            <Building2 size={16} className="shrink-0" />
                                                            <span className="text-sm truncate">{skpd}</span>
                                                        </div>
                                                        {selectedSKPD.includes(skpd) && (
                                                            <Check size={16} className="text-indigo-600 shrink-0" />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Info jumlah terpilih */}
                                            <div className="mt-3 flex items-center justify-between text-sm">
                                                <p className="text-gray-500 dark:text-gray-400">
                                                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">{selectedSKPD.length}</span> dari {filteredSKPD.length} SKPD terpilih
                                                </p>
                                                {filteredSKPD.length < allSKPD.length && (
                                                    <p className="text-xs text-gray-400">
                                                        Menampilkan {filteredSKPD.length} dari {allSKPD.length} SKPD
                                                    </p>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </>
                            )}

                            {/* Tombol Simpan */}
                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    onClick={() => setSelectedViewer(null)}
                                    className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleSaveAccess}
                                    disabled={saving || (!canViewAll && selectedSKPD.length === 0)}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving ? (
                                        <Loader size={18} className="animate-spin" />
                                    ) : (
                                        <Save size={18} />
                                    )}
                                    {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-gray-700/30 shadow-xl p-12 text-center">
                            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                                Belum Ada Viewer Dipilih
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                                Pilih viewer dari daftar di samping untuk mengatur akses SKPD mereka.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Info */}
            <div className="mt-6 text-xs text-gray-400 dark:text-gray-500 text-center border-t border-gray-200 dark:border-gray-700 pt-4">
                <span className="mx-2">👁️ Viewer hanya bisa melihat data SKPD yang diberikan akses</span>
                <span className="mx-2">🔒 Admin dan Editor memiliki akses ke semua SKPD</span>
            </div>
        </div>
    );
};

export default ManageViewerAccessView;