import React, { useState, useEffect, useMemo } from 'react';
import SectionTitle from './components/SectionTitle';
import GeminiAnalysis from './components/GeminiAnalysis';
import Pagination from './components/Pagination';
import { 
    ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, Legend, ResponsiveContainer, Area
} from 'recharts';
import { 
    Download, ChevronDown, ChevronRight, Search, 
    ArrowUpDown, Wallet, TrendingUp, Activity, Layers
} from 'lucide-react';
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from './utils/firebase';
import { formatCurrency } from './utils/formatCurrency';

// --- STYLING CONSTANTS FOR GLASSMORPHISM ---
const glassCard = "bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-white/50 dark:border-gray-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] rounded-2xl";
const glassInput = "bg-white/50 dark:bg-gray-800/50 backdrop-blur-md border border-gray-200/80 dark:border-gray-600/50 focus:ring-2 focus:ring-indigo-500/50 rounded-xl outline-none transition-all duration-300";

const LaporanTematikView = ({ data, theme, namaPemda, userRole, selectedYear }) => {
    const { anggaran, realisasi } = data;
    const [selectedTematik, setSelectedTematik] = useState('spm');
    const [refData, setRefData] = useState([]);
    const [reportData, setReportData] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [summaryData, setSummaryData] = useState({ pagu: 0, realisasi: 0, percentage: 0 }); 
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedRows, setExpandedRows] = useState(new Set());
    
    // --- NEW FEATURES STATE ---
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'pagu', direction: 'desc' });
    const [performanceStats, setPerformanceStats] = useState({ green: 0, yellow: 0, red: 0 });
    
    const ITEMS_PER_PAGE = 15;

    const tematikOptions = {
        spm: { title: 'Standar Pelayanan Minimal', dbKey: 'spm', color: 'from-blue-500/20 to-indigo-500/20', iconColor: 'text-indigo-500' },
        stunting: { title: 'Penurunan Stunting', dbKey: 'stunting', color: 'from-emerald-500/20 to-teal-500/20', iconColor: 'text-emerald-500' },
        kemiskinan: { title: 'Penghapusan Kemiskinan Ekstrim', dbKey: 'kemiskinan', color: 'from-orange-500/20 to-red-500/20', iconColor: 'text-orange-500' },
        inflasi: { title: 'Pengendalian Inflasi', dbKey: 'inflasi', color: 'from-purple-500/20 to-pink-500/20', iconColor: 'text-purple-500' },
        pengawasan: { title: 'Alokasi Unsur Pengawasan', dbKey: 'pengawasan', color: 'from-slate-500/20 to-gray-500/20', iconColor: 'text-slate-500' }
    };

    // ==========================================
    // LOGIKA ASLI - TIDAK DIUBAH SAMA SEKALI
    // ==========================================
    useEffect(() => {
        const dbKey = tematikOptions[selectedTematik].dbKey;
        const dataRef = collection(db, "publicData", String(selectedYear), `referensi-${dbKey}`);
        const unsubscribe = onSnapshot(query(dataRef), (snapshot) => {
            let fetchedData = [];
            snapshot.forEach(doc => {
                if (Array.isArray(doc.data().rows)) {
                    fetchedData.push(...doc.data().rows);
                }
            });
            setRefData(fetchedData);
        }, (err) => {
            console.error(`Error fetching ${dbKey} reference:`, err);
            setRefData([]);
        });
        return () => unsubscribe();
    }, [selectedYear, selectedTematik]);

    useEffect(() => {
        if (!anggaran.length || !refData.length) {
            setReportData([]);
            setChartData([]);
            setSummaryData({ pagu: 0, realisasi: 0, percentage: 0 });
            setPerformanceStats({ green: 0, yellow: 0, red: 0 });
            return;
        }

        const totalAPBD = anggaran.reduce((sum, item) => sum + (item.nilai || 0), 0);
        const allRealisasi = Object.values(realisasi).flat();
        const refCodes = new Set(refData.map(item => String(item['KODE SUB KEGIATAN']).trim()));
        
        let filteredAnggaran = anggaran.filter(item => item && refCodes.has(String(item.KodeSubKegiatan).trim()));
        let filteredRealisasi = allRealisasi.filter(realItem => realItem && refCodes.has(String(realItem.KodeSubKegiatan).trim()));

        if (selectedTematik === 'pengawasan') {
            const isInspektorat = (item) => 
                (item.NamaSKPD && item.NamaSKPD.toLowerCase().includes('inspektorat')) ||
                (item.NamaSubUnit && item.NamaSubUnit.toLowerCase().includes('inspektorat'));
            
            filteredAnggaran = filteredAnggaran.filter(isInspektorat);
            filteredRealisasi = filteredRealisasi.filter(isInspektorat);
        }
        
        const subKegiatanMap = new Map();

        filteredAnggaran.forEach(item => {
            const key = `${item.NamaSKPD}|${item.NamaSubKegiatan}`;
            if (!subKegiatanMap.has(key)) {
                subKegiatanMap.set(key, {
                    skpd: item.NamaSKPD,
                    subKegiatan: item.NamaSubKegiatan,
                    pagu: 0,
                    realisasi: 0,
                    details: new Map()
                });
            }

            const entry = subKegiatanMap.get(key);
            entry.pagu += item.nilai || 0;
            
            const detailKey = item.NamaRekening;
            if (!entry.details.has(detailKey)) {
                entry.details.set(detailKey, {
                    rekening: item.NamaRekening,
                    anggaran: 0,
                    realisasi: 0
                });
            }
            entry.details.get(detailKey).anggaran += item.nilai || 0;
        });
        
        filteredRealisasi.forEach(realItem => {
            const key = `${realItem.NamaSKPD}|${realItem.NamaSubKegiatan}`;
            if (subKegiatanMap.has(key)) {
                const entry = subKegiatanMap.get(key);
                entry.realisasi += realItem.nilai || 0;
                
                const detailKey = realItem.NamaRekening;
                 if (entry.details.has(detailKey)) {
                    entry.details.get(detailKey).realisasi += realItem.nilai || 0;
                }
            }
        });
        
        const finalData = Array.from(subKegiatanMap.values()).map(item => ({
            ...item,
            details: Array.from(item.details.values()).map(d => ({...d, persentase: d.anggaran > 0 ? (d.realisasi / d.anggaran) * 100 : 0})),
            persentase: item.pagu > 0 ? (item.realisasi / item.pagu) * 100 : 0
        })).sort((a, b) => b.pagu - a.pagu);

        setReportData(finalData);
        
        // Calculate Stats for AI and UI
        let stats = { green: 0, yellow: 0, red: 0 };
        let totalPaguTematik = 0;
        let totalRealisasiTematik = 0;
        
        finalData.forEach(item => {
            totalPaguTematik += item.pagu;
            totalRealisasiTematik += item.realisasi;
            if (item.persentase >= 80) stats.green++;
            else if (item.persentase >= 50) stats.yellow++;
            else stats.red++;
        });

        const percentage = totalAPBD > 0 ? (totalPaguTematik / totalAPBD) * 100 : 0;
        setSummaryData({ pagu: totalPaguTematik, realisasi: totalRealisasiTematik, percentage: percentage });
        setPerformanceStats(stats);

        const finalChartData = finalData
            .map(item => ({
                name: item.subKegiatan.length > 30 ? item.subKegiatan.substring(0, 30) + '...' : item.subKegiatan,
                Pagu: item.pagu,
                Realisasi: item.realisasi,
            }))
            .sort((a, b) => b.Pagu - a.Pagu)
            .slice(0, 15);
        setChartData(finalChartData);

    }, [anggaran, realisasi, refData, selectedTematik]);
    // ==========================================

    // --- NEW LOGIC: SEARCH & SORT ---
    const filteredAndSortedData = useMemo(() => {
        let result = [...reportData];
        
        if (searchTerm) {
            const lowercasedSearch = searchTerm.toLowerCase();
            result = result.filter(item => 
                item.subKegiatan.toLowerCase().includes(lowercasedSearch) ||
                item.skpd.toLowerCase().includes(lowercasedSearch)
            );
        }

        result.sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
            if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [reportData, searchTerm, sortConfig]);

    // Reset pagination on search/sort
    useEffect(() => { setCurrentPage(1); }, [searchTerm, sortConfig]);

    const totalPages = Math.ceil(filteredAndSortedData.length / ITEMS_PER_PAGE);
    const paginatedData = filteredAndSortedData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handlePageChange = (page) => {
        if (page > 0 && page <= totalPages) setCurrentPage(page);
    };

    const handleSort = (key) => {
        let direction = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };
    
    const toggleRow = (key) => {
        const newExpandedRows = new Set(expandedRows);
        if (newExpandedRows.has(key)) newExpandedRows.delete(key);
        else newExpandedRows.add(key);
        setExpandedRows(newExpandedRows);
    };

    const handleDownloadExcel = () => {
        if (!reportData || reportData.length === 0) {
            alert("Tidak ada data untuk diunduh.");
            return;
        }
        if (!window.XLSX) {
            alert("Pustaka unduh Excel tidak tersedia.");
            return;
        }

        try {
            const dataForExport = reportData.flatMap(item => 
                item.details.map(d => ({
                    'Sub Unit': item.skpd,
                    'Sub Kegiatan': item.subKegiatan,
                    'Nama Rekening': d.rekening,
                    'Anggaran': d.anggaran,
                    'Realisasi': d.realisasi,
                    'Persentase (%)': d.persentase.toFixed(2),
                }))
            );

            const worksheet = window.XLSX.utils.json_to_sheet(dataForExport);
            const workbook = window.XLSX.utils.book_new();
            window.XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Tematik");
            
            const fileName = `Laporan_Tematik_${tematikOptions[selectedTematik].title.replace(/ /g, "_")}_${selectedYear}.xlsx`;
            window.XLSX.writeFile(workbook, fileName);
        } catch (err) {
            console.error("Error creating Excel file:", err);
            alert("Gagal membuat file Excel.");
        }
    };

    const currentTagConfig = tematikOptions[selectedTematik];
    
    // --- UPDATED: Enhanced AI Prompt with New Stats ---
    const getAnalysisPrompt = (customQuery) => {
        if (customQuery) {
            return `Berdasarkan data laporan tematik untuk "${currentTagConfig.title}", berikan analisis untuk permintaan berikut: "${customQuery}"`;
        }
        if (reportData.length === 0) return "Data tidak cukup untuk analisis.";
        
        const top5 = reportData.slice(0, 5).map(item => `- **${item.subKegiatan}** (${item.skpd}): Pagu ${formatCurrency(item.pagu)}, Realisasi ${formatCurrency(item.realisasi)} (${item.persentase.toFixed(2)}%)`).join('\n');
        
        return `
            Anda adalah seorang analis kebijakan publik senior untuk ${namaPemda || 'Pemerintah Daerah'}. 
            Lakukan analisis strategis terhadap alokasi dan realisasi anggaran untuk tema prioritas: **${currentTagConfig.title}** pada tahun ${selectedYear}.

            ### Ringkasan Eksekutif:
            - **Total Anggaran Teridentifikasi**: ${formatCurrency(summaryData.pagu)}
            - **Total Realisasi Terdistribusi**: ${formatCurrency(summaryData.realisasi)}
            - **Tingkat Penyerapan Keseluruhan**: ${(summaryData.pagu > 0 ? (summaryData.realisasi / summaryData.pagu) * 100 : 0).toFixed(2)}%
            - **Distribusi Kinerja SKPD**: ${performanceStats.green} kegiatan berkinerja baik (>80%), ${performanceStats.yellow} sedang (50-80%), dan ${performanceStats.red} berkinerja kurang (<50%).

            ### 5 Sub Kegiatan dengan Alokasi Terbesar:
            ${top5}

            Berikan analisis mengenai:
            1.  **Evaluasi Postur Anggaran**: Apakah prioritas alokasi (Top 5) sudah selaras dan terdistribusi efektif untuk mendukung capaian indikator makro tema ini?
            2.  **Analisis Anomali & Bottleneck**: Berdasarkan sebaran kinerja, identifikasi kemungkinan penyebab ${performanceStats.red} kegiatan yang serapannya lambat.
            3.  **Rekomendasi Taktis**: Berikan 3 rekomendasi *actionable* yang spesifik untuk mempercepat realisasi anggaran ini dalam waktu dekat.
        `;
    };

    // Helper for visual indicators
    const getProgressColor = (percent) => {
        if (percent >= 80) return 'from-emerald-400 to-emerald-500';
        if (percent >= 50) return 'from-amber-400 to-amber-500';
        return 'from-rose-400 to-rose-500';
    };
    
    const getTextColor = (percent) => {
        if (percent >= 80) return 'text-emerald-600 dark:text-emerald-400';
        if (percent >= 50) return 'text-amber-600 dark:text-amber-400';
        return 'text-rose-600 dark:text-rose-400';
    };

    // Custom Tooltip for ECharts vibe
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-white/40 dark:border-gray-700 p-4 rounded-xl shadow-xl">
                    <p className="font-bold text-gray-800 dark:text-white mb-3 text-sm">{label}</p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center gap-3 mb-1">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                            <span className="text-gray-600 dark:text-gray-300 text-sm font-medium">{entry.name}:</span>
                            <span className="text-gray-900 dark:text-white font-bold ml-auto">{formatCurrency(entry.value)}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6 animate-fade-in font-sans">
            <SectionTitle>Analisis Laporan Tematik</SectionTitle>
            
            <GeminiAnalysis 
                getAnalysisPrompt={getAnalysisPrompt}
                disabledCondition={reportData.length === 0}
                theme={theme}
                userRole={userRole}
                interactivePlaceholder={`Analisis AI untuk ${currentTagConfig.title}...`}
            />

            {/* --- CONTROLS SECTION (GLASSMORPHISM) --- */}
            <div className={`${glassCard} p-4 flex flex-col md:flex-row gap-4 justify-between items-center relative z-20`}>
                <div className="flex-1 w-full md:max-w-xs relative group">
                    <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-indigo-500 transition-colors" size={18} />
                    <select
                        value={selectedTematik}
                        onChange={(e) => setSelectedTematik(e.target.value)}
                        className={`${glassInput} w-full pl-11 pr-10 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 appearance-none cursor-pointer`}
                    >
                        {Object.entries(tematikOptions).map(([key, value]) => (
                            <option key={key} value={key} className="bg-white dark:bg-gray-800">{value.title}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                </div>

                <div className="flex-1 w-full md:max-w-md relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-indigo-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Cari Sub Kegiatan atau SKPD..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`${glassInput} w-full pl-11 pr-4 py-3 text-sm text-gray-700 dark:text-gray-200`}
                    />
                </div>

                <button
                    onClick={handleDownloadExcel}
                    disabled={reportData.length === 0}
                    className="w-full md:w-auto flex-shrink-0 flex items-center justify-center px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02]"
                >
                    <Download size={18} className="mr-2" />
                    Export Data
                </button>
            </div>

            {/* --- SUMMARY CARDS (MODERNIZED) --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                <div className={`${glassCard} p-6 relative overflow-hidden group`}>
                    <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                        <Wallet size={100} className="text-blue-500" />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-blue-100/50 dark:bg-blue-900/30 rounded-xl backdrop-blur-sm">
                            <Wallet size={20} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Total Anggaran (Pagu)</p>
                    </div>
                    <p className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">{formatCurrency(summaryData.pagu)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium bg-gray-100/50 dark:bg-gray-800/50 inline-block px-2 py-1 rounded-md">
                        {summaryData.percentage.toFixed(2)}% dari Total APBD
                    </p>
                </div>

                <div className={`${glassCard} p-6 relative overflow-hidden group`}>
                    <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                        <Activity size={100} className="text-emerald-500" />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-emerald-100/50 dark:bg-emerald-900/30 rounded-xl backdrop-blur-sm">
                            <Activity size={20} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Realisasi Terserap</p>
                    </div>
                    <p className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">{formatCurrency(summaryData.realisasi)}</p>
                    
                    {/* Glowing Progress Bar */}
                    <div className="w-full bg-gray-200/50 dark:bg-gray-700/50 rounded-full h-1.5 mt-4 overflow-hidden">
                        <div 
                            className={`h-full bg-gradient-to-r ${getProgressColor(summaryData.pagu > 0 ? (summaryData.realisasi / summaryData.pagu) * 100 : 0)} shadow-[0_0_10px_rgba(16,185,129,0.5)]`}
                            style={{ width: `${Math.min(100, summaryData.pagu > 0 ? (summaryData.realisasi / summaryData.pagu) * 100 : 0)}%` }}
                        ></div>
                    </div>
                </div>

                <div className={`p-6 rounded-2xl relative overflow-hidden group shadow-lg bg-gradient-to-br ${currentTagConfig.color} border border-white/20 backdrop-blur-xl`}>
                    <div className="absolute inset-0 bg-white/10 dark:bg-black/10"></div>
                    <div className="absolute top-0 right-0 p-4 opacity-20 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                        <TrendingUp size={100} className="text-white" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-sm font-semibold text-gray-800 dark:text-white/90">Persentase Serapan</p>
                        </div>
                        <h3 className="text-4xl font-black text-gray-900 dark:text-white drop-shadow-sm mb-4">
                            {(summaryData.pagu > 0 ? (summaryData.realisasi / summaryData.pagu) * 100 : 0).toFixed(2)}%
                        </h3>
                        <div className="flex gap-3 text-xs font-bold text-gray-800 dark:text-white/90 bg-white/20 dark:bg-black/20 p-2 rounded-lg backdrop-blur-md w-fit">
                            <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5 shadow-[0_0_5px_#34d399]"></span> {performanceStats.green}</span>
                            <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-amber-400 mr-1.5 shadow-[0_0_5px_#fbbf24]"></span> {performanceStats.yellow}</span>
                            <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-rose-400 mr-1.5 shadow-[0_0_5px_#fb7185]"></span> {performanceStats.red}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- ECHARTS-STYLE COMPOSED CHART --- */}
            {chartData.length > 0 && (
                <div className={`${glassCard} p-6 relative z-0`}>
                    <div className="mb-6 flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Komparasi Top 15 Alokasi Anggaran</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={420}>
                        <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 90 }}>
                            <defs>
                                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.8}/>
                                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                                </linearGradient>
                                <filter id="glow">
                                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                                    <feMerge>
                                        <feMergeNode in="coloredBlur"/>
                                        <feMergeNode in="SourceGraphic"/>
                                    </feMerge>
                                </filter>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                            <XAxis 
                                dataKey="name" 
                                angle={-45} 
                                textAnchor="end" 
                                interval={0} 
                                tick={{ fontSize: 10, fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }} 
                                axisLine={false}
                                tickLine={false}
                                dy={10}
                            />
                            <YAxis 
                                tickFormatter={(val) => `${(val / 1e9).toFixed(0)}M`} 
                                tick={{ fontSize: 11, fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }} 
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{fill: theme === 'dark' ? '#374151' : '#f3f4f6', opacity: 0.4}} />
                            <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: '20px' }} iconType="circle" />
                            <Bar 
                                dataKey="Pagu" 
                                name="Alokasi Pagu" 
                                fill="url(#barGradient)" 
                                radius={[6, 6, 0, 0]} 
                                barSize={40} 
                            />
                            <Line 
                                type="monotone" 
                                name="Realisasi" 
                                dataKey="Realisasi" 
                                stroke="#10b981" 
                                strokeWidth={3} 
                                dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: theme === 'dark' ? '#1f2937' : '#fff' }} 
                                activeDot={{ r: 7, fill: '#fff', stroke: '#10b981', strokeWidth: 3 }} 
                                style={{ filter: 'url(#glow)' }} // ECharts glow effect
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* --- ADVANCED DATA LIST --- */}
            <div className={`${glassCard} overflow-hidden`}>
                {/* Header Controls for List */}
                <div className="flex justify-between items-center p-5 border-b border-gray-100/50 dark:border-gray-700/50 bg-gray-50/30 dark:bg-gray-800/30">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">Rincian Kegiatan Terkait</h3>
                    <div className="flex gap-2 text-sm font-medium">
                        <button onClick={() => handleSort('pagu')} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors ${sortConfig.key === 'pagu' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/30' : 'text-gray-500 dark:text-gray-400'}`}>
                            Pagu <ArrowUpDown size={14} />
                        </button>
                        <button onClick={() => handleSort('persentase')} className={`hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors ${sortConfig.key === 'persentase' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/30' : 'text-gray-500 dark:text-gray-400'}`}>
                            Serapan <ArrowUpDown size={14} />
                        </button>
                    </div>
                </div>

                <div className="divide-y divide-gray-100/50 dark:divide-gray-700/50">
                    {paginatedData.length > 0 ? (
                        paginatedData.map(item => {
                            const rowKey = `${item.skpd}-${item.subKegiatan}`;
                            const isExpanded = expandedRows.has(rowKey);
                            
                            return (
                                <div key={rowKey} className={`group transition-all duration-300 ${isExpanded ? 'bg-indigo-50/20 dark:bg-indigo-900/10' : 'hover:bg-gray-50/40 dark:hover:bg-gray-800/40'}`}>
                                    <div onClick={() => toggleRow(rowKey)} className="p-5 cursor-pointer">
                                        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                                            {/* Data Text */}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-1 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{item.subKegiatan}</h4>
                                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                    <Layers size={12} /> {item.skpd}
                                                </p>
                                            </div>
                                            
                                            {/* Values */}
                                            <div className="flex w-full lg:w-auto items-center justify-between lg:justify-end gap-6 md:gap-8">
                                                <div className="text-left md:text-right">
                                                    <p className="text-[10px] font-bold tracking-wider text-gray-400 dark:text-gray-500 uppercase mb-0.5">Pagu</p>
                                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{formatCurrency(item.pagu)}</p>
                                                </div>
                                                <div className="text-left md:text-right">
                                                    <p className="text-[10px] font-bold tracking-wider text-gray-400 dark:text-gray-500 uppercase mb-0.5">Realisasi</p>
                                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{formatCurrency(item.realisasi)}</p>
                                                </div>
                                                
                                                {/* Modern Progress Pill */}
                                                <div className="hidden sm:block w-32">
                                                    <div className="flex justify-between items-end mb-1">
                                                        <span className="text-[10px] font-bold tracking-wider text-gray-400 dark:text-gray-500 uppercase">Serapan</span>
                                                        <span className={`text-xs font-black ${getTextColor(item.persentase)}`}>
                                                            {item.persentase.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-gray-200/50 dark:bg-gray-700/50 rounded-full h-2">
                                                        <div 
                                                            className={`h-2 rounded-full bg-gradient-to-r ${getProgressColor(item.persentase)}`}
                                                            style={{ width: `${Math.min(100, item.persentase)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                                
                                                <div className={`p-2 rounded-xl transition-transform duration-300 ${isExpanded ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400 rotate-180' : 'bg-gray-100/80 text-gray-500 dark:bg-gray-800/80 dark:text-gray-400 group-hover:bg-indigo-50 dark:group-hover:bg-gray-700'}`}>
                                                    <ChevronDown size={18} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Mobile Progress Bar (Visible only on small screens) */}
                                        <div className="sm:hidden w-full mt-4 flex items-center gap-3">
                                            <div className="w-full bg-gray-200/50 dark:bg-gray-700/50 rounded-full h-1.5">
                                                <div className={`h-1.5 rounded-full bg-gradient-to-r ${getProgressColor(item.persentase)}`} style={{ width: `${Math.min(100, item.persentase)}%` }}></div>
                                            </div>
                                            <span className={`text-xs font-bold ${getTextColor(item.persentase)}`}>{item.persentase.toFixed(1)}%</span>
                                        </div>
                                    </div>

                                    {/* Expanded Detail View */}
                                    {isExpanded && (
                                        <div className="p-5 pt-0 animate-in fade-in slide-in-from-top-4 duration-300">
                                            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden shadow-inner">
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full">
                                                        <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200/50 dark:border-gray-700/50">
                                                            <tr>
                                                                <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rincian Rekening</th>
                                                                <th className="px-5 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Anggaran</th>
                                                                <th className="px-5 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Realisasi</th>
                                                                <th className="px-5 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Capaian</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100/50 dark:divide-gray-800/50">
                                                        {item.details.map((d, i) => (
                                                            <tr key={i} className="hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors">
                                                                <td className="px-5 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                                                                        {d.rekening}
                                                                    </div>
                                                                </td>
                                                                <td className="px-5 py-3 text-right text-sm text-gray-600 dark:text-gray-400">{formatCurrency(d.anggaran)}</td>
                                                                <td className="px-5 py-3 text-right text-sm text-gray-600 dark:text-gray-400">{formatCurrency(d.realisasi)}</td>
                                                                <td className="px-5 py-3 text-center">
                                                                    <div className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 shadow-sm ${getTextColor(d.persentase)}`}>
                                                                        {d.persentase.toFixed(2)}%
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })
                    ) : (
                        <div className="text-center py-20">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100/50 dark:bg-gray-800/50 mb-4 text-gray-400">
                                <Search size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Data Tidak Ditemukan</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                                {searchTerm ? "Coba gunakan kata kunci pencarian yang berbeda." : "Pastikan Anda sudah mengunggah file referensi yang sesuai untuk tahun yang dipilih."}
                            </p>
                        </div>
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="p-4 border-t border-gray-100/50 dark:border-gray-700/50">
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} theme={theme} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default LaporanTematikView;
