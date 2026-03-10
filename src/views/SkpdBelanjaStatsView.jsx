import React, { useState, useMemo, useEffect } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
    ResponsiveContainer, PieChart as RePieChart, Pie, Cell 
} from 'recharts';
import { 
    Search, TrendingUp, AlertTriangle, CheckCircle, Info, 
    BarChart3, LayoutGrid, List, ChevronLeft, ChevronRight,
    Bot, Sparkles, Loader2, RefreshCw, Activity, Target
} from 'lucide-react';

// --- UTILITIES & CONSTANTS ---
const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};
import GeminiAnalysis from './components/GeminiAnalysis';

// Pindahkan array months ke luar komponen untuk mencegah infinite loop (re-render re-allocation)
const MONTHS_ARRAY = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

// --- SUB-COMPONENTS ---

const SectionTitle = ({ children }) => (
    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 border-b-2 border-blue-500 pb-2 inline-block">
        {children}
    </h2>
);

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-center gap-2 mt-8">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                        return (
                            <button
                                key={page}
                                onClick={() => onPageChange(page)}
                                className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                                    currentPage === page
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                            >
                                {page}
                            </button>
                        );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return <span key={page} className="text-gray-400">...</span>;
                    }
                    return null;
                })}
            </div>
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
                <ChevronRight className="w-5 h-5" />
            </button>
        </div>
    );
};

// --- MAIN VIEW COMPONENT ---

const SkpdBelanjaStatsView = ({ data = {}, theme, namaPemda, selectedYear }) => {
    const { anggaran = [], realisasi = {}, realisasiNonRkud = {} } = data;
    
    const [currentPage, setCurrentPage] = useState(1);
    const [skpdStats, setSkpdStats] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: 'persentase', direction: 'desc' });
    const [viewMode, setViewMode] = useState('list');
    
    const [startMonth, setStartMonth] = useState(MONTHS_ARRAY[0]);
    const [endMonth, setEndMonth] = useState(MONTHS_ARRAY[MONTHS_ARRAY.length - 1]);
    const [showAnalysis, setShowAnalysis] = useState(true);

    const ITEMS_PER_PAGE = 12;

    const COLORS = {
        high: '#10B981',    
        medium: '#F59E0B',  
        low: '#EF4444',     
        anggaran: '#435EBE',
        realisasi: '#10B981'
    };

    useEffect(() => {
        const anggaranMap = new Map();
        (anggaran || []).forEach(item => {
            const skpd = item.NamaSKPD || 'Tanpa SKPD';
            anggaranMap.set(skpd, (anggaranMap.get(skpd) || 0) + item.nilai);
        });

        const startIndex = MONTHS_ARRAY.indexOf(startMonth);
        const endIndex = MONTHS_ARRAY.indexOf(endMonth);
        
        const actualStart = Math.min(startIndex, endIndex);
        const actualEnd = Math.max(startIndex, endIndex);
        const selectedMonths = MONTHS_ARRAY.slice(actualStart, actualEnd + 1);

        const normalizeRealisasiItem = (item, isNonRkud = false) => {
            if (!item) return null;
            return {
                NamaSKPD: isNonRkud ? item.NAMASKPD : item.NamaSKPD,
                nilai: item.nilai || 0,
                bulan: item.month || null
            };
        };
        
        const combinedRealisasi = [];
        selectedMonths.forEach(month => {
            if (realisasi && realisasi[month]) {
                combinedRealisasi.push(...realisasi[month].map(item => normalizeRealisasiItem(item, false)));
            }
            if (realisasiNonRkud && realisasiNonRkud[month]) {
                combinedRealisasi.push(...realisasiNonRkud[month].map(item => normalizeRealisasiItem(item, true)));
            }
        });

        const realisasiMap = new Map();
        combinedRealisasi.forEach(item => {
            if (!item) return;
            const skpd = item.NamaSKPD || 'Tanpa SKPD';
            realisasiMap.set(skpd, (realisasiMap.get(skpd) || 0) + item.nilai);
        });

        const stats = Array.from(anggaranMap.keys()).map(skpd => {
            const totalAnggaran = anggaranMap.get(skpd) || 0;
            const totalRealisasi = realisasiMap.get(skpd) || 0;
            const persentase = totalAnggaran > 0 ? (totalRealisasi / totalAnggaran) * 100 : 0;
            
            let performanceCategory = 'low';
            if (persentase >= 80) performanceCategory = 'high';
            else if (persentase >= 50) performanceCategory = 'medium';
            
            const sisaAnggaran = totalAnggaran - totalRealisasi;
            
            return { 
                skpd, 
                totalAnggaran, 
                totalRealisasi, 
                persentase,
                sisaAnggaran,
                performanceCategory
            };
        });

        setSkpdStats(stats);
    }, [anggaran, realisasi, realisasiNonRkud, startMonth, endMonth]);

    const totalStats = useMemo(() => {
        if (skpdStats.length === 0) return null;
        
        const totalAnggaran = skpdStats.reduce((sum, item) => sum + item.totalAnggaran, 0);
        const totalRealisasi = skpdStats.reduce((sum, item) => sum + item.totalRealisasi, 0);
        const totalSisa = skpdStats.reduce((sum, item) => sum + item.sisaAnggaran, 0);
        const rataRataPersentase = totalAnggaran > 0 ? (totalRealisasi / totalAnggaran) * 100 : 0;
        
        const highPerformers = skpdStats.filter(item => item.performanceCategory === 'high').length;
        const mediumPerformers = skpdStats.filter(item => item.performanceCategory === 'medium').length;
        const lowPerformers = skpdStats.filter(item => item.performanceCategory === 'low').length;
        
        const top5 = [...skpdStats].sort((a, b) => b.persentase - a.persentase).slice(0, 5);
        const bottom5 = [...skpdStats].sort((a, b) => a.persentase - b.persentase).slice(0, 5);
        
        return {
            totalAnggaran,
            totalRealisasi,
            totalSisa,
            rataRataPersentase,
            highPerformers,
            mediumPerformers,
            lowPerformers,
            top5,
            bottom5
        };
    }, [skpdStats]);

    const filteredData = useMemo(() => {
        let data = skpdStats.filter(item => 
            item.skpd.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        if (sortConfig.key) {
            data = [...data].sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        
        return data;
    }, [skpdStats, searchTerm, sortConfig]);

    const chartData = useMemo(() => {
        return filteredData.slice(0, 15).map(item => ({
            name: item.skpd.length > 20 ? item.skpd.substring(0, 20) + '...' : item.skpd,
            fullName: item.skpd,
            anggaran: item.totalAnggaran / 1e9, 
            realisasi: item.totalRealisasi / 1e9,
            persentase: Number(item.persentase.toFixed(2)),
            category: item.performanceCategory
        }));
    }, [filteredData]);

    const performancePieData = totalStats ? [
        { name: 'Kinerja Tinggi (≥80%)', value: totalStats.highPerformers, color: '#10B981' },
        { name: 'Kinerja Sedang (50-79%)', value: totalStats.mediumPerformers, color: '#F59E0B' },
        { name: 'Kinerja Rendah (<50%)', value: totalStats.lowPerformers, color: '#EF4444' }
    ].filter(d => d.value > 0) : [];

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const paginatedData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handlePageChange = (page) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page);
        }
    };
    
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, startMonth, endMonth, sortConfig]);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const getAnalysisPrompt = (query, allData) => {
    // Jika user mengirim query khusus
    if (query && query.trim() !== '') {
        return `Berdasarkan data realisasi belanja SKPD, jawab pertanyaan ini: ${query}`;
    }
    
    // Analisis default
    if (!totalStats) return "Data tidak cukup untuk dianalisis.";
    
    const period = startMonth === endMonth ? startMonth : `periode ${startMonth} - ${endMonth}`;
    const top5 = totalStats.top5 || [];
    const bottom5 = totalStats.bottom5 || [];
    
    return `ANALISIS REALISASI BELANJA SKPD
TAHUN: ${selectedYear}
PERIODE: ${period}

DATA RINGKAS:
- Total Pagu Anggaran: ${formatCurrency(totalStats.totalAnggaran)}
- Total Realisasi: ${formatCurrency(totalStats.totalRealisasi)} (${totalStats.rataRataPersentase.toFixed(2)}%)
- Sisa Anggaran: ${formatCurrency(totalStats.totalSisa)}
- Distribusi Kinerja: Tinggi (${totalStats.highPerformers}), Sedang (${totalStats.mediumPerformers}), Rendah (${totalStats.lowPerformers})

SKPD DENGAN KINERJA TERTINGGI:
${top5.map((item, i) => `${i+1}. ${item.skpd}: ${item.persentase.toFixed(2)}% (Pagu: ${formatCurrency(item.totalAnggaran)}, Realisasi: ${formatCurrency(item.totalRealisasi)})`).join('\n')}

SKPD DENGAN KINERJA TERENDAH:
${bottom5.map((item, i) => `${i+1}. ${item.skpd}: ${item.persentase.toFixed(2)}%`).join('\n')}

BERIKAN ANALISIS MENDALAM MENGENAI:
1. Evaluasi Kinerja: Identifikasi SKPD dengan kinerja optimal dan yang bermasalah.
2. Identifikasi Masalah: Analisis penyebab rendahnya penyerapan pada SKPD dengan kinerja rendah.
3. Rekomendasi Strategis: 3 langkah konkret untuk meningkatkan kinerja penyerapan.
4. Peringatan Dini: Poin penting untuk rapat pimpinan terkait percepatan realisasi.

Gunakan bahasa profesional, langsung ke inti, tanpa basa-basi.`;
};

    const getPerformanceBadge = (category) => {
        if (category === 'high') {
            return <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 rounded-full text-xs font-bold flex items-center gap-1.5"><CheckCircle size={14} /> TINGGI</span>;
        } else if (category === 'medium') {
            return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300 rounded-full text-xs font-bold flex items-center gap-1.5"><Info size={14} /> SEDANG</span>;
        } else {
            return <span className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 rounded-full text-xs font-bold flex items-center gap-1.5"><AlertTriangle size={14} /> RENDAH</span>;
        }
    };

    return (
        <div className="space-y-6 p-2 md:p-6 max-w-full">
            <SectionTitle>Statistik Anggaran vs Realisasi Belanja</SectionTitle>
            
            {/* DASHBOARD EKSEKUTIF */}
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl shadow-xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <Activity className="w-64 h-64" />
                </div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-xl uppercase tracking-wider">Dashboard Kinerja Penyerapan</h3>
                            <p className="text-blue-100 text-sm">Pemantauan realisasi anggaran SKPD tahun {selectedYear || new Date().getFullYear()}</p>
                        </div>
                    </div>
                    
                    {totalStats && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl hover:bg-white/20 transition-all">
                                <p className="text-blue-100 text-xs font-semibold uppercase mb-1">Rata-rata Penyerapan</p>
                                <p className="text-3xl font-black text-white">{totalStats.rataRataPersentase.toFixed(2)}%</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl hover:bg-white/20 transition-all">
                                <p className="text-blue-100 text-xs font-semibold uppercase mb-1">Total Realisasi</p>
                                <p className="text-xl md:text-2xl font-black text-green-300">{formatCurrency(totalStats.totalRealisasi)}</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl hover:bg-white/20 transition-all">
                                <p className="text-blue-100 text-xs font-semibold uppercase mb-1">Sisa Anggaran</p>
                                <p className="text-xl md:text-2xl font-black text-yellow-300">{formatCurrency(totalStats.totalSisa)}</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl hover:bg-white/20 transition-all">
                                <p className="text-blue-100 text-xs font-semibold uppercase mb-1">Distribusi SKPD</p>
                                <div className="flex items-center gap-3 text-sm font-bold">
                                    <span className="text-green-300" title="Tinggi">{totalStats.highPerformers}T</span>
                                    <span className="text-yellow-300" title="Sedang">{totalStats.mediumPerformers}S</span>
                                    <span className="text-red-300" title="Rendah">{totalStats.lowPerformers}R</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

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
  {showAnalysis && skpdStats.length > 0 && totalStats && (
    <div className="text-xs text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-2 bg-white/30 dark:bg-gray-800/30 p-2 rounded-lg">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
      </span>
      <span>Total SKPD: {skpdStats.length} | Rata-rata: {totalStats.rataRataPersentase.toFixed(1)}% | Periode: {startMonth} - {endMonth}</span>
    </div>
  )}
  
  {/* Komponen GeminiAnalysis dengan Conditional Rendering */}
  {showAnalysis && (
    <GeminiAnalysis 
      getAnalysisPrompt={getAnalysisPrompt} 
      disabledCondition={skpdStats.length === 0} 
      userCanUseAi={true}
      allData={{
        totalStats,
        startMonth,
        endMonth,
        selectedYear,
        viewMode
      }}
    />
  )}
</div>
            
            <div className="bg-white dark:bg-gray-800 p-4 md:p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700">
                {/* FILTER & CONTROLS SECTION */}
                <div className="flex flex-col xl:flex-row gap-6 mb-8 justify-between items-end">
                    
                    <div className="w-full xl:w-1/3 relative">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Pencarian SKPD</label>
                        <input 
                            type="text"
                            placeholder="Ketik nama SKPD..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                        <Search className="absolute left-4 top-10 text-gray-400" size={20}/>
                    </div>
                    
                    <div className="w-full xl:w-1/3">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Periode Data</label>
                        <div className="grid grid-cols-2 gap-3">
                            <select value={startMonth} onChange={e => setStartMonth(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500">
                                {MONTHS_ARRAY.map(month => <option key={`start-${month}`} value={month}>Dari: {month}</option>)}
                            </select>
                            <select value={endMonth} onChange={e => setEndMonth(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500">
                                {MONTHS_ARRAY.map(month => <option key={`end-${month}`} value={month}>Sampai: {month}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    <div className="w-full xl:w-auto flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
                        <button onClick={() => setViewMode('list')} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'}`}>
                            <List size={18} /> List
                        </button>
                        <button onClick={() => setViewMode('grid')} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'}`}>
                            <LayoutGrid size={18} /> Grid
                        </button>
                        <button onClick={() => setViewMode('chart')} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${viewMode === 'chart' ? 'bg-white dark:bg-gray-700 shadow text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'}`}>
                            <BarChart3 size={18} /> Grafik
                        </button>
                    </div>
                </div>

                {/* VIEW MODE: CHART */}
                {viewMode === 'chart' && chartData.length > 0 && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 lg:col-span-1 flex flex-col items-center justify-center">
                                <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-2">
                                    <Target className="w-5 h-5 text-blue-500" />
                                    Distribusi Kinerja
                                </h3>
                                <div className="w-full">
                                    <ResponsiveContainer width="99%" height={250}>
                                        <RePieChart>
                                            <Pie
                                                data={performancePieData}
                                                cx="50%" cy="50%"
                                                innerRadius={60} outerRadius={90}
                                                paddingAngle={5}
                                                dataKey="value"
                                                stroke="none"
                                                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                                            >
                                                {performancePieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                            <Legend verticalAlign="bottom" height={36}/>
                                        </RePieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 lg:col-span-2">
                                <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-6">Pagu vs Realisasi (Top 15)</h3>
                                <div className="w-full">
                                    <ResponsiveContainer width="99%" height={350}>
                                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} />
                                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{fontSize: 11, fill: '#6b7280'}} interval={0} />
                                            <YAxis yAxisId="left" tickFormatter={(val) => `${val}M`} tick={{fontSize: 12, fill: '#6b7280'}} />
                                            <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tickFormatter={(val) => `${val}%`} tick={{fontSize: 12, fill: '#6b7280'}} />
                                            <Tooltip 
                                                cursor={{fill: 'rgba(0,0,0,0.05)'}}
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                formatter={(value, name) => [name === 'Persentase' ? `${value}%` : `${value} Miliar`, name]}
                                                labelFormatter={(label) => chartData.find(d => d.name === label)?.fullName || label}
                                            />
                                            <Legend wrapperStyle={{paddingTop: '20px'}}/>
                                            <Bar yAxisId="left" dataKey="anggaran" fill={COLORS.anggaran} name="Pagu (M)" radius={[4,4,0,0]} barSize={20} />
                                            <Bar yAxisId="left" dataKey="realisasi" fill={COLORS.realisasi} name="Realisasi (M)" radius={[4,4,0,0]} barSize={20} />
                                            <Bar yAxisId="right" dataKey="persentase" fill={COLORS.medium} name="Persentase" radius={[4,4,0,0]} barSize={20} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* VIEW MODE: LIST ATAU GRID */}
                {(viewMode === 'list' || viewMode === 'grid') && (
                    <div className="mb-6 flex flex-wrap gap-2 items-center bg-gray-50 dark:bg-gray-800/50 p-2 rounded-xl">
                        <span className="text-sm font-semibold text-gray-500 mr-2 ml-2">Urutkan:</span>
                        {[
                            { key: 'skpd', label: 'Nama SKPD' },
                            { key: 'persentase', label: '% Penyerapan' },
                            { key: 'totalAnggaran', label: 'Total Pagu' }
                        ].map(sortBtn => (
                            <button
                                key={sortBtn.key}
                                onClick={() => handleSort(sortBtn.key)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    sortConfig.key === sortBtn.key 
                                        ? 'bg-blue-600 text-white shadow-md' 
                                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                                }`}
                            >
                                {sortBtn.label} {sortConfig.key === sortBtn.key && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </button>
                        ))}
                    </div>
                )}

                {viewMode === 'list' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        {paginatedData.map((item, index) => (
                            <div key={item.skpd} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between md:justify-start gap-4 mb-3">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 font-bold text-sm shrink-0">
                                                {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                                            </div>
                                            <h4 className="font-bold text-gray-800 dark:text-gray-200 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                {item.skpd}
                                            </h4>
                                            <div className="md:hidden">
                                                {getPerformanceBadge(item.performanceCategory)}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 mt-2">
                                            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                                        item.performanceCategory === 'high' ? 'bg-green-500' :
                                                        item.performanceCategory === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                                                    }`} 
                                                    style={{ width: `${Math.min(item.persentase, 100)}%` }}
                                                />
                                            </div>
                                            <div className="hidden md:block shrink-0">
                                                {getPerformanceBadge(item.performanceCategory)}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-wrap md:flex-nowrap gap-4 md:gap-8 md:pl-8 mt-4 md:mt-0 border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-700 pt-4 md:pt-0">
                                        <div className="flex-1 md:flex-none md:text-right min-w-[110px]">
                                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Pagu</p>
                                            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{formatCurrency(item.totalAnggaran)}</p>
                                        </div>
                                        <div className="flex-1 md:flex-none md:text-right min-w-[110px]">
                                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Realisasi</p>
                                            <p className="text-sm font-bold text-green-600 dark:text-green-400">{formatCurrency(item.totalRealisasi)}</p>
                                        </div>
                                        <div className="flex-1 md:flex-none md:text-right min-w-[80px]">
                                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Serapan</p>
                                            <p className={`text-xl font-black ${
                                                item.performanceCategory === 'high' ? 'text-green-600 dark:text-green-400' :
                                                item.performanceCategory === 'medium' ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                                            }`}>
                                                {item.persentase.toFixed(1)}%
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {viewMode === 'grid' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-300">
                        {paginatedData.map((item, index) => (
                            <div key={item.skpd} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-5 rounded-3xl shadow-sm hover:shadow-xl transition-all flex flex-col h-full">
                                <div className="flex justify-between items-start mb-4 gap-3">
                                    <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200 line-clamp-3 flex-1 leading-snug">
                                        <span className="text-blue-500 mr-2 font-black">#{ (currentPage - 1) * ITEMS_PER_PAGE + index + 1 }</span>
                                        {item.skpd}
                                    </h4>
                                </div>
                                
                                <div className="mt-auto space-y-4">
                                    <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl space-y-2">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-semibold text-gray-500">Pagu</span>
                                            <span className="font-bold text-gray-700 dark:text-gray-300">{formatCurrency(item.totalAnggaran)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs border-t border-gray-200 dark:border-gray-700 pt-2">
                                            <span className="font-semibold text-gray-500">Realisasi</span>
                                            <span className="font-bold text-green-600">{formatCurrency(item.totalRealisasi)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs border-t border-gray-200 dark:border-gray-700 pt-2">
                                            <span className="font-semibold text-gray-500">Sisa</span>
                                            <span className="font-bold text-orange-500">{formatCurrency(item.sisaAnggaran)}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-end mb-2">
                                            {getPerformanceBadge(item.performanceCategory)}
                                            <p className="text-lg font-black text-gray-800 dark:text-white leading-none">{item.persentase.toFixed(1)}%</p>
                                        </div>
                                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-1000 ${
                                                    item.performanceCategory === 'high' ? 'bg-green-500' :
                                                    item.performanceCategory === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                                                }`} 
                                                style={{ width: `${Math.min(item.persentase, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {filteredData.length === 0 && (
                    <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/30 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
                        <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                            <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-1">Tidak ada data</p>
                        <p className="text-gray-500 text-sm">Coba ubah kata kunci pencarian atau rentang bulan</p>
                    </div>
                )}

                <Pagination 
                    currentPage={currentPage} 
                    totalPages={totalPages} 
                    onPageChange={handlePageChange} 
                />

                <div className="mt-10 flex flex-wrap justify-center gap-4 text-xs font-semibold text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-green-500"></div> Kinerja Tinggi (≥80%)</span>
                    <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div> Kinerja Sedang (50-79%)</span>
                    <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500"></div> Kinerja Rendah (&lt;50%)</span>
                </div>
            </div>
        </div>
    );
};

export default SkpdBelanjaStatsView;
