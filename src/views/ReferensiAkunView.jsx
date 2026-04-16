import React, { useState, useEffect, useMemo, useCallback } from 'react';
import SectionTitle from '../components/SectionTitle';
import GeminiAnalysis from '../components/GeminiAnalysis';
import Pagination from '../components/Pagination';
import { 
    Upload, Search, Eye, EyeOff, AlertTriangle, CheckCircle, Info, 
    Award, Crown, Briefcase, Lightbulb, Activity, Zap, Target, 
    Database, FileText, Hash, CreditCard, Download, Calendar,
    TrendingUp, Gauge, Coins, Layers, BarChart3, PieChart,
    Sparkles, Trophy, Medal, Gem, Diamond, Flower2, Sparkle,
    Building2, Users, Shield, AlertOctagon, BookOpen, GitBranch,
    FolderTree, ListTree, ChevronDown, ChevronUp,
    Wallet  
} from 'lucide-react';
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from '../utils/firebase';
import { formatCurrency } from '../utils/formatCurrency';

// --- REFACTORED ReferensiAkunView Component ---
const ReferensiAkunView = ({ theme, userRole, selectedYear, onUpload }) => {
    const [selectedRef, setSelectedRef] = React.useState('pendapatan');
    const [data, setData] = React.useState([]);
    const [error, setError] = React.useState('');
    const [uploadProgress, setUploadProgress] = React.useState('');
    const [isUploading, setIsUploading] = React.useState(false);
    const fileInputRef = React.useRef(null);
    
    // ===== STATE UNTUK SEARCH, PAGINATION, DAN FILTER =====
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(15);
    
    // ===== STATE UNTUK TOGGLE ANALISIS AI DAN INFO EKSEKUTIF =====
    const [showExecutiveInfo, setShowExecutiveInfo] = useState(true);
    const [showAnalysis, setShowAnalysis] = useState(true);
    // ===== END STATE =====

    const refOptions = {
        pendapatan: { 
            title: 'Referensi Pendapatan', 
            dbKey: 'pendapatan',
            previewHeaders: ['Kode Rekening', 'Uraian Rekening'],
            description: 'Data referensi kode rekening untuk pendapatan daerah',
            icon: <CreditCard className="w-6 h-6" />,
            color: 'emerald'
        },
        belanja: { 
            title: 'Referensi Belanja', 
            dbKey: 'belanja',
            previewHeaders: ['Kode Rekening', 'Uraian Rekening'],
            description: 'Data referensi kode rekening untuk belanja daerah',
            icon: <Wallet className="w-6 h-6" />,
            color: 'blue'
        },
    };

    const currentRefConfig = refOptions[selectedRef];

    useEffect(() => {
        setData([]);
        setError('');
        const dataRef = collection(db, "publicData", String(selectedYear), `referensi-${currentRefConfig.dbKey}`);
        const unsubscribe = onSnapshot(query(dataRef), (snapshot) => {
            let fetchedData = [];
            snapshot.forEach(doc => {
                if (Array.isArray(doc.data().rows)) {
                    fetchedData.push(...doc.data().rows);
                }
            });
            setData(fetchedData);
        }, (err) => {
            console.error(`Error fetching ${selectedRef} reference:`, err);
            setData([]);
            setError(`Gagal memuat data untuk ${currentRefConfig.title}.`);
        });
        return () => unsubscribe();
    }, [selectedYear, selectedRef]);

    // ===== FILTER DATA BERDASARKAN SEARCH TERM =====
    const filteredData = useMemo(() => {
        if (!searchTerm) return data;
        
        return data.filter(item => {
            return Object.values(item).some(val => 
                String(val).toLowerCase().includes(searchTerm.toLowerCase())
            );
        });
    }, [data, searchTerm]);

    // ===== PAGINATION =====
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * itemsPerPage, 
        currentPage * itemsPerPage
    );

    const handlePageChange = (page) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedRef]);

    // ===== EXECUTIVE SUMMARY DATA =====
    const executiveSummary = useMemo(() => {
        if (!data.length) return null;
        
        const totalItems = data.length;
        const uniqueCodes = new Set(data.map(item => 
            item[currentRefConfig.previewHeaders[0]] || item['Kode Rekening'] || item['kode rekening']
        )).size;
        
        // Analisis struktur kode rekening
        const codeStructure = {};
        data.forEach(item => {
            const code = item[currentRefConfig.previewHeaders[0]] || item['Kode Rekening'] || item['kode rekening'];
            if (code && typeof code === 'string') {
                const prefix = code.split('.')[0];
                codeStructure[prefix] = (codeStructure[prefix] || 0) + 1;
            }
        });
        
        const topPrefixes = Object.entries(codeStructure)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([prefix, count]) => ({ prefix, count }));
        
        return {
            totalItems,
            uniqueCodes,
            topPrefixes,
            dataQuality: data.length > 0 ? 'Baik' : 'Perlu Upload',
            lastUpdate: new Date().toLocaleDateString('id-ID')
        };
    }, [data, currentRefConfig]);

    // ===== FUNGSI ANALYSIS PROMPT =====
    const getAnalysisPrompt = useCallback((query, allData) => {
        if (query && query.trim() !== '') {
            return `Berdasarkan data referensi akun ${currentRefConfig.title}, jawab pertanyaan ini: ${query}`;
        }
        
        if (data.length === 0) return "Data tidak cukup untuk dianalisis.";
        
        const totalItems = data.length;
        const sampleData = data.slice(0, 5);
        const codeAnalysis = executiveSummary?.topPrefixes?.map(p => 
            `- Kode dengan prefiks ${p.prefix}: ${p.count} item`
        ).join('\n') || '- Belum ada analisis prefiks';
        
        return `ANALISIS REFERENSI AKUN KODE REKENING
TAHUN: ${selectedYear}
JENIS REFERENSI: ${currentRefConfig.title}

DATA RINGKAS:
- Total Item Referensi: ${totalItems} item
- Kode Unik: ${executiveSummary?.uniqueCodes || 0} kode
- Kualitas Data: ${executiveSummary?.dataQuality || 'Baik'}
- Update Terakhir: ${executiveSummary?.lastUpdate || '-'}

STRUKTUR KODE REKENING:
${codeAnalysis}

CONTOH DATA (5 ITEM PERTAMA):
${sampleData.map((item, i) => {
    const code = item[currentRefConfig.previewHeaders[0]] || item['Kode Rekening'] || item['kode rekening'] || '-';
    const name = item[currentRefConfig.previewHeaders[1]] || item['Uraian Rekening'] || item['uraian rekening'] || '-';
    return `- ${code}: ${name}`;
}).join('\n')}

BERIKAN ANALISIS MENDALAM MENGENAI:
1. Kualitas Data: Apakah data referensi ini sudah lengkap dan konsisten?
2. Struktur Kode: Identifikasi pola kode rekening yang muncul.
3. Rekomendasi: Saran untuk optimalisasi penggunaan data referensi ini.

Gunakan bahasa profesional, langsung ke inti, tanpa basa-basi.`;
    }, [currentRefConfig, data, executiveSummary, selectedYear]);

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setError('');
        setUploadProgress('Membaca file...');
        setIsUploading(true);
        const fileExtension = file.name.split('.').pop().toLowerCase();

        const parseAndUpload = (jsonData) => {
            if (!jsonData || jsonData.length === 0) {
                setError("File tidak berisi data.");
                setIsUploading(false);
                return;
            }
            
            const headers = Object.keys(jsonData[0]).map(h => h.toLowerCase().trim());
            const hasKode = headers.some(h => h.includes('kode') || h.includes('code'));
            const hasNama = headers.some(h => h.includes('uraian') || h.includes('nama') || h.includes('description'));

            if (!hasKode || !hasNama) {
                setError("File harus memiliki kolom yang mengandung 'kode' dan 'uraian'/'nama'.");
                setIsUploading(false);
                return;
            }

            onUpload(jsonData, selectedRef, setUploadProgress)
                .then(() => {
                    setUploadProgress('Unggah selesai!');
                    setTimeout(() => setUploadProgress(''), 3000);
                })
                .catch((err) => {
                    setError(`Gagal mengunggah data: ${err.message}`);
                    setUploadProgress('');
                })
                .finally(() => setIsUploading(false));
        };

        if (fileExtension === 'csv' || file.name.endsWith('.csv')) {
            if (!window.Papa) { 
                setError("Pustaka PapaParse (CSV) tidak tersedia."); 
                setIsUploading(false); 
                return; 
            }
            window.Papa.parse(file, {
                header: true, 
                skipEmptyLines: true,
                complete: (results) => {
                    if (results.errors.length) {
                        setError("Gagal memproses file CSV: " + results.errors[0].message);
                    } else {
                        parseAndUpload(results.data);
                    }
                },
                error: (err) => setError("Terjadi kesalahan fatal saat memproses file CSV: " + err.message)
            });
        } else if (['xlsx', 'xls'].includes(fileExtension)) {
            if (!window.XLSX) { 
                setError("Pustaka SheetJS (Excel) tidak tersedia."); 
                setIsUploading(false); 
                return; 
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const workbook = window.XLSX.read(e.target.result, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const json = window.XLSX.utils.sheet_to_json(worksheet);
                    parseAndUpload(json);
                } catch (err) {
                    console.error(err);
                    setError("Gagal memproses file Excel: " + err.message);
                    setIsUploading(false);
                }
            };
            reader.readAsBinaryString(file);
        } else {
            setError("Format file tidak didukung. Harap unggah file CSV atau Excel.");
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-10">
            <SectionTitle>Referensi Akun Kode Rekening</SectionTitle>
            
            {/* === EXECUTIVE DASHBOARD - INFORMASI UNTUK PIMPINAN === */}
            {showExecutiveInfo && executiveSummary && (
                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-10 text-white shadow-2xl border border-white/10 group mb-8">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -mr-40 -mt-40 transition-transform duration-1000 group-hover:scale-110"></div>
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-400/10 rounded-full blur-[80px] -ml-32 -mb-32"></div>
                    <div className="absolute top-20 left-40 w-40 h-40 bg-cyan-400/10 rounded-full blur-[60px]"></div>
                    
                    {/* Animated Particles */}
                    <div className="absolute inset-0 overflow-hidden">
                        {[...Array(15)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute rounded-full bg-white/5 animate-float"
                                style={{
                                    width: `${Math.random() * 6 + 3}px`,
                                    height: `${Math.random() * 6 + 3}px`,
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 10}s`,
                                    animationDuration: `${Math.random() * 20 + 10}s`
                                }}
                            />
                        ))}
                    </div>
                    
                    {/* Crown Icon for Leadership */}
                    <div className="absolute top-8 right-12 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Trophy size={140} className="text-yellow-300" />
                    </div>
                    
                    <div className="relative z-10">
                        {/* Header */}
                        <div className="flex items-center gap-5 mb-6 border-b border-white/20 pb-6">
                            <div className="p-5 bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-400 rounded-2xl shadow-lg shadow-amber-500/30">
                                <Database size={40} className="text-white" />
                            </div>
                            <div className="flex-1">
                                <div className="inline-flex items-center gap-3 px-5 py-2 bg-white/20 backdrop-blur-2xl rounded-full text-sm font-black tracking-[0.3em] uppercase border border-white/30 mb-3">
                                    <Sparkles size={16} className="text-yellow-300 animate-pulse" /> 
                                    EXECUTIVE DASHBOARD
                                </div>
                                <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight">
                                    RINGKASAN EKSEKUTIF <br/>
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-300 text-5xl md:text-6xl">
                                        REFERENSI AKUN
                                    </span>
                                </h2>
                                <p className="text-lg text-white/80 mt-2 max-w-3xl">
                                    {currentRefConfig.description}
                                </p>
                            </div>
                            <button 
                                onClick={() => setShowExecutiveInfo(false)}
                                className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/20"
                                title="Sembunyikan"
                            >
                                <EyeOff size={22} />
                            </button>
                        </div>

                        {/* Quick Stats - DIPERBESAR */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="bg-black/30 backdrop-blur-xl rounded-xl p-5 border border-white/20 hover:bg-black/40 transition-all">
                                <div className="flex items-center gap-3 mb-2">
                                    <Database size={22} className="text-yellow-400" />
                                    <p className="text-xs font-bold uppercase text-emerald-200 tracking-wider">Total Item</p>
                                </div>
                                <p className="text-3xl md:text-4xl font-black text-white">{executiveSummary.totalItems}</p>
                                <p className="text-xs text-emerald-200/70 mt-1">data referensi</p>
                            </div>
                            <div className="bg-black/30 backdrop-blur-xl rounded-xl p-5 border border-white/20 hover:bg-black/40 transition-all">
                                <div className="flex items-center gap-3 mb-2">
                                    <Hash size={22} className="text-emerald-400" />
                                    <p className="text-xs font-bold uppercase text-emerald-200 tracking-wider">Kode Unik</p>
                                </div>
                                <p className="text-3xl md:text-4xl font-black text-emerald-300">{executiveSummary.uniqueCodes}</p>
                                <p className="text-xs text-emerald-200/70 mt-1">kode rekening berbeda</p>
                            </div>
                            <div className="bg-black/30 backdrop-blur-xl rounded-xl p-5 border border-white/20 hover:bg-black/40 transition-all">
                                <div className="flex items-center gap-3 mb-2">
                                    <Calendar size={22} className="text-purple-400" />
                                    <p className="text-xs font-bold uppercase text-emerald-200 tracking-wider">Update Terakhir</p>
                                </div>
                                <p className="text-2xl md:text-3xl font-black text-purple-300">{executiveSummary.lastUpdate}</p>
                                <p className="text-xs text-emerald-200/70 mt-1">data tersedia</p>
                            </div>
                        </div>

                        {/* Top Prefixes */}
                        {executiveSummary.topPrefixes.length > 0 && (
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 mb-6">
                                <h3 className="text-xl font-black text-white mb-4 flex items-center gap-3">
                                    <Layers size={22} className="text-amber-400" /> 
                                    STRUKTUR KODE REKENING
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {executiveSummary.topPrefixes.map((item, idx) => (
                                        <div key={idx} className="bg-white/5 rounded-xl p-4 text-center">
                                            <p className="text-2xl font-black text-amber-300 mb-1">{item.prefix}</p>
                                            <p className="text-sm text-emerald-200">{item.count} item</p>
                                            <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden mt-2">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                                                    style={{ width: `${(item.count / executiveSummary.totalItems) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Executive Note */}
                        <div className="flex items-start gap-5 text-base bg-gradient-to-r from-emerald-800/50 to-teal-800/50 p-6 rounded-2xl border border-emerald-500/30 backdrop-blur-sm">
                            <div className="p-4 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl shadow-lg shrink-0">
                                <Lightbulb size={32} className="text-white" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-xl font-black text-white flex items-center gap-2">
                                    <Sparkles size={20} className="text-yellow-300" />
                                    EXECUTIVE SUMMARY
                                </p>
                                <p className="text-base leading-relaxed text-emerald-100">
                                    <span className="font-bold text-white">RINGKASAN:</span> Data referensi {currentRefConfig.title} memiliki 
                                    <span className="font-black text-yellow-300 text-lg mx-1">{executiveSummary.totalItems}</span> item dengan 
                                    <span className="font-black text-emerald-300 text-lg mx-1">{executiveSummary.uniqueCodes}</span> kode unik. 
                                    Struktur kode didominasi oleh prefiks 
                                    {executiveSummary.topPrefixes.map((p, i) => (
                                        <span key={i} className="font-black text-amber-300 mx-1">{p.prefix}</span>
                                    ))}
                                    yang mencakup {executiveSummary.topPrefixes.reduce((acc, p) => acc + p.count, 0)} item.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!showExecutiveInfo && (
                <button 
                    onClick={() => setShowExecutiveInfo(true)}
                    className="mb-6 px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold text-base flex items-center gap-3 shadow-xl hover:shadow-2xl transition-all group hover:scale-105"
                >
                    <Eye size={22} className="group-hover:scale-110 transition-transform" /> 
                    TAMPILKAN EXECUTIVE DASHBOARD
                </button>
            )}

            {/* AI Analysis Section dengan Toggle */}
            <div className="relative">
                <div className="flex justify-end mb-2">
                    <button
                        onClick={() => setShowAnalysis(!showAnalysis)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 bg-white/50 dark:bg-gray-800/50 rounded-xl hover:bg-white dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700"
                    >
                        {showAnalysis ? (
                            <>🗂️ Sembunyikan Analisis AI</>
                        ) : (
                            <>🤖 Tampilkan Analisis AI</>
                        )}
                    </button>
                </div>
                
                {/* Indikator Data */}
                {showAnalysis && data.length > 0 && (
                    <div className="text-xs text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-2 bg-white/30 dark:bg-gray-800/30 p-2 rounded-lg">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span>{currentRefConfig.title} | Total Data: {data.length} item | Kode Unik: {executiveSummary?.uniqueCodes}</span>
                    </div>
                )}
                
                {/* Komponen GeminiAnalysis dengan Conditional Rendering */}
                {showAnalysis && (
                    <GeminiAnalysis 
                        getAnalysisPrompt={getAnalysisPrompt} 
                        disabledCondition={data.length === 0} 
                        userCanUseAi={userRole === 'admin'}
                        allData={{
                            data: data.slice(0, 10),
                            totalItems: data.length,
                            selectedRef,
                            config: currentRefConfig
                        }}
                    />
                )}
            </div>

            {/* Main Card */}
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/50 dark:border-gray-700/50 overflow-hidden transition-all duration-500 hover:shadow-3xl">
                {/* Header with Type Selection */}
                <div className="p-8 bg-gradient-to-r from-white/50 to-white/30 dark:from-gray-800/50 dark:to-gray-900/50 border-b border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg">
                                {selectedRef === 'pendapatan' ? (
                                    <CreditCard size={24} className="text-white" />
                                ) : (
                                    <Wallet size={24} className="text-white" />
                                )}
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-800 dark:text-white">
                                    {currentRefConfig.title}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {currentRefConfig.description}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex gap-3">
                            <select
                                value={selectedRef}
                                onChange={(e) => setSelectedRef(e.target.value)}
                                className="px-4 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm font-medium"
                            >
                                <option value="pendapatan">💰 Referensi Pendapatan</option>
                                <option value="belanja">💳 Referensi Belanja</option>
                            </select>
                            
                            <button
                                onClick={() => fileInputRef.current.click()}
                                disabled={isUploading || userRole !== 'admin'}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                <Upload size={18} className="group-hover:scale-110 transition-transform" />
                                {isUploading ? 'Mengunggah...' : 'Unggah Excel'}
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".csv, .xlsx, .xls"
                                onChange={handleFileUpload}
                            />
                        </div>
                    </div>
                    
                    {/* Upload Progress & Error Messages */}
                    {userRole !== 'admin' && (
                        <div className="mt-4 p-3 bg-yellow-50/50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200/50 dark:border-yellow-800/50">
                            <p className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-2">
                                <Shield size={14} /> Hanya Admin yang dapat mengunggah data referensi.
                            </p>
                        </div>
                    )}
                    
                    {error && (
                        <div className="mt-4 p-3 bg-rose-50/50 dark:bg-rose-900/20 rounded-xl border border-rose-200/50 dark:border-rose-800/50">
                            <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                                <AlertTriangle size={14} /> {error}
                            </p>
                        </div>
                    )}
                    
                    {uploadProgress && (
                        <div className="mt-4 p-3 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200/50 dark:border-emerald-800/50">
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                                <div className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                                {uploadProgress}
                            </p>
                        </div>
                    )}
                </div>

                {/* Search and Table Section */}
                <div className="p-8">
                    {/* Search Bar */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg shadow-md">
                                <FileText size={20} className="text-white" />
                            </div>
                            <h3 className="font-black text-lg text-gray-800 dark:text-white">
                                Data Referensi
                            </h3>
                            <span className="text-xs bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm px-3 py-1 rounded-full">
                                {filteredData.length} item
                            </span>
                        </div>
                        
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Cari kode atau uraian rekening..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                        <table className="min-w-full">
                            <thead>
                                <tr className="bg-gradient-to-r from-gray-50/80 to-white/80 dark:from-gray-800/80 dark:to-gray-900/80">
                                    {currentRefConfig.previewHeaders.map(header => (
                                        <th key={header} className="px-6 py-4 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {paginatedData.length > 0 ? paginatedData.map((item, index) => (
                                    <tr key={index} className="hover:bg-emerald-500/5 transition-colors group">
                                        {currentRefConfig.previewHeaders.map(header => {
                                            // Cari key yang cocok dengan header
                                            const headerLower = header.toLowerCase().replace(/\s/g, '');
                                            const key = Object.keys(item).find(k => 
                                                k.toLowerCase().replace(/\s/g, '').includes(headerLower) ||
                                                headerLower.includes(k.toLowerCase().replace(/\s/g, ''))
                                            ) || Object.keys(item)[0];
                                            
                                            return (
                                                <td key={header} className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 font-mono">
                                                    {item[key] || '-'}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={currentRefConfig.previewHeaders.length} className="text-center py-12 text-gray-500 font-bold">
                                            {searchTerm ? "Tidak ada data yang cocok dengan pencarian." : "Belum ada data referensi."}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-8">
                            <Pagination 
                                currentPage={currentPage} 
                                totalPages={totalPages} 
                                onPageChange={handlePageChange} 
                                theme={theme} 
                            />
                        </div>
                    )}
                </div>

                {/* Footer Notes */}
                {data.length > 0 && (
                    <div className="px-8 py-5 bg-gradient-to-r from-gray-50/50 to-transparent dark:from-gray-800/50 border-t border-gray-200/50 dark:border-gray-700/50">
                        <div className="flex flex-wrap gap-6 text-xs">
                            <span className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full shadow-lg"></div>
                                <span className="font-medium text-gray-600 dark:text-gray-400">
                                    Total {data.length} item referensi
                                </span>
                            </span>
                            <span className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-lg"></div>
                                <span className="font-medium text-gray-600 dark:text-gray-400">
                                    {executiveSummary?.uniqueCodes || 0} kode unik
                                </span>
                            </span>
                            <span className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full shadow-lg"></div>
                                <span className="font-medium text-gray-600 dark:text-gray-400">
                                    Update: {executiveSummary?.lastUpdate}
                                </span>
                            </span>
                        </div>
                    </div>
                )}
            </div>
            
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0) translateX(0); }
                    25% { transform: translateY(-10px) translateX(6px); }
                    50% { transform: translateY(-5px) translateX(-6px); }
                    75% { transform: translateY(-15px) translateX(4px); }
                }
                .animate-float {
                    animation: float linear infinite;
                }
            `}</style>
        </div>
    );
};

export default ReferensiAkunView;