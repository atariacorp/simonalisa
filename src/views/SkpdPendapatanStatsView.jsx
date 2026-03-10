import React from 'react';
import SectionTitle from './components/SectionTitle';
import GeminiAnalysis from './components/GeminiAnalysis';
import Pagination from './components/Pagination';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Line, Cell } from 'recharts';
import { 
  Search, TrendingUp, TrendingDown, Target, DollarSign, Calendar, 
  Filter, Download, Eye, EyeOff, AlertTriangle, CheckCircle, Info,
  Award, Crown, Briefcase, Users, Lightbulb, Activity, Zap,
  ChevronRight, Sparkles, LayoutDashboard, PieChart, ArrowUpRight,
  ArrowDownRight, Shield, AlertOctagon, Layers, BarChart3
} from 'lucide-react';
import { formatCurrency } from './utils/formatCurrency';

// Custom Tooltip dengan desain modern dan glassmorphism
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl p-5 rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] border border-white/50 dark:border-gray-700/50 min-w-[280px] z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-2 mb-3 border-b border-gray-100 dark:border-gray-800 pb-2">
                    <div className="w-1.5 h-6 bg-gradient-to-b from-teal-500 to-emerald-500 rounded-full"></div>
                    <p className="font-black text-sm text-gray-800 dark:text-white uppercase tracking-tight max-w-[220px] break-words">
                        {label}
                    </p>
                </div>
                {payload.map((entry, index) => (
                    <div key={`item-${index}`} className="flex justify-between items-center text-xs mb-2 group/item hover:bg-gray-50 dark:hover:bg-gray-800/50 p-1 rounded-lg transition-colors">
                        <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 font-medium">
                            <div className="w-2 h-2 rounded-full shadow-lg" style={{ backgroundColor: entry.color, boxShadow: `0 0 10px ${entry.color}` }}></div>
                            {entry.name}
                        </span>
                        <span className="font-black text-gray-900 dark:text-white tabular-nums">
                            {entry.name?.toLowerCase().includes('persen') 
                                ? `${Number(entry.value).toFixed(1)}%`
                                : formatCurrency(entry.value)}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

// --- ENHANCED: SkpdPendapatanStatsView Component with Executive Dashboard & Modern Design ---
const SkpdPendapatanStatsView = ({ data, theme, namaPemda, userRole, selectedYear }) => {
    const { pendapatan, realisasiPendapatan } = data;
    const [selectedSkpd, setSelectedSkpd] = React.useState('Semua SKPD');
    const [searchTerm, setSearchTerm] = React.useState(""); 
    const [currentPage, setCurrentPage] = React.useState(1);
    const [chartType, setChartType] = React.useState('bar'); // 'bar' atau 'composed'
    const [showProjection, setShowProjection] = React.useState(true);
    const [sortBy, setSortBy] = React.useState('target'); // 'target', 'realisasi', 'persentase'
    const [sortOrder, setSortOrder] = React.useState('desc');
    const [viewMode, setViewMode] = React.useState('table'); // 'table' atau 'card'
    const [showExecutiveInfo, setShowExecutiveInfo] = React.useState(true);
    const [showAnalysis, setShowAnalysis] = React.useState(true);
    
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const [startMonth, setStartMonth] = React.useState(months[0]);
    const [endMonth, setEndMonth] = React.useState(months[months.length - 1]);
    const ITEMS_PER_PAGE = 10;
    
    const lastMonthWithData = React.useMemo(() => {
        if (!realisasiPendapatan) return months[0];
        for (let i = months.length - 1; i >= 0; i--) {
            if (realisasiPendapatan[months[i]] && realisasiPendapatan[months[i]].length > 0) {
                return months[i];
            }
        }
        return months[0];
    }, [realisasiPendapatan]);

    const [projectionMonth, setProjectionMonth] = React.useState(lastMonthWithData);

    React.useEffect(() => {
        setProjectionMonth(lastMonthWithData);
    }, [lastMonthWithData]);

    const skpdList = React.useMemo(() => {
        if (!pendapatan) return [];
        const skpds = new Set(pendapatan.map(item => item.NamaOPD).filter(Boolean));
        return Array.from(skpds).sort();
    }, [pendapatan]);

    const stats = React.useMemo(() => {
        if (!pendapatan || !realisasiPendapatan) return { chartData: [], tableData: [] };
        
        const startIndex = months.indexOf(startMonth);
        const endIndex = months.indexOf(endMonth);
        const selectedMonths = months.slice(startIndex, endIndex + 1);
        const allRealisasiForPeriod = selectedMonths.map(month => realisasiPendapatan[month] || []).flat();

        const dataToProcess = {
            pendapatan: selectedSkpd === 'Semua SKPD'
                ? pendapatan
                : pendapatan.filter(item => item.NamaOPD === selectedSkpd),
            realisasi: selectedSkpd === 'Semua SKPD'
                ? allRealisasiForPeriod
                : allRealisasiForPeriod.filter(item => item.SKPD === selectedSkpd),
        };

        const targetMap = new Map();
        dataToProcess.pendapatan.forEach(item => {
            const rekening = item.NamaAkun || 'Lain-lain';
            targetMap.set(rekening, (targetMap.get(rekening) || 0) + item.nilai);
        });

        const realisasiMap = new Map();
        dataToProcess.realisasi.forEach(item => {
            const rekening = item.NamaRekening || 'Lain-lain';
            realisasiMap.set(rekening, (realisasiMap.get(rekening) || 0) + item.nilai);
        });

        const allRekeningKeys = new Set([...targetMap.keys(), ...realisasiMap.keys()]);

        let combinedData = Array.from(allRekeningKeys).map(rekening => ({
            name: rekening.length > 30 ? rekening.substring(0, 30) + '...' : rekening,
            fullName: rekening,
            Target: targetMap.get(rekening) || 0,
            Realisasi: realisasiMap.get(rekening) || 0,
            persentase: targetMap.get(rekening) > 0 
                ? ((realisasiMap.get(rekening) || 0) / targetMap.get(rekening)) * 100 
                : 0
        }));
        
        // Filter pencarian
        if (searchTerm) {
            combinedData = combinedData.filter(item => 
                item.fullName.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        // Sorting
        combinedData.sort((a, b) => {
            let aVal, bVal;
            if (sortBy === 'target') { aVal = a.Target; bVal = b.Target; }
            else if (sortBy === 'realisasi') { aVal = a.Realisasi; bVal = b.Realisasi; }
            else { aVal = a.persentase; bVal = b.persentase; }
            
            return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
        });
        
        const chartData = combinedData.slice(0, 15);

        const tableData = combinedData.map(item => ({
            sumberPendapatan: item.fullName,
            totalTarget: item.Target,
            totalRealisasi: item.Realisasi,
            persentase: item.persentase,
            shortName: item.name
        }));

        return { chartData, tableData };
    }, [pendapatan, realisasiPendapatan, selectedSkpd, startMonth, endMonth, searchTerm, sortBy, sortOrder]);

    const projectionData = React.useMemo(() => {
        if (!pendapatan || !realisasiPendapatan) return null;
        
        let filteredPendapatan = selectedSkpd === 'Semua SKPD'
            ? pendapatan
            : pendapatan.filter(item => item.NamaOPD === selectedSkpd);
            
        if (searchTerm) {
            filteredPendapatan = filteredPendapatan.filter(item => 
                (item.NamaAkun || '').toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        const totalTarget = filteredPendapatan.reduce((sum, item) => sum + (item.nilai || 0), 0);
        
        const projectionMonthIndex = months.indexOf(projectionMonth);
        const monthsPassed = projectionMonthIndex + 1;
        const monthsRemaining = 12 - monthsPassed;
        const passedMonths = months.slice(0, monthsPassed);

        let relevantRealisasi = passedMonths
            .map(month => realisasiPendapatan[month] || [])
            .flat()
            .filter(item => selectedSkpd === 'Semua SKPD' || item.SKPD === selectedSkpd);
            
        if (searchTerm) {
            relevantRealisasi = relevantRealisasi.filter(item => 
                (item.NamaRekening || '').toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        const realisasiHinggaSaatIni = relevantRealisasi.reduce((sum, item) => sum + (item.nilai || 0), 0);
        const rataRataBulanan = monthsPassed > 0 ? realisasiHinggaSaatIni / monthsPassed : 0;
        const proyeksiSisaBulan = rataRataBulanan * monthsRemaining;
        const proyeksiAkhirTahun = realisasiHinggaSaatIni + proyeksiSisaBulan;
        const persenProyeksi = totalTarget > 0 ? (proyeksiAkhirTahun / totalTarget) * 100 : 0;
        
        // Kategori risiko proyeksi
        let riskCategory = 'aman';
        let riskColor = 'from-emerald-500 to-green-500';
        let riskIcon = <CheckCircle className="w-5 h-5 text-white" />;
        
        if (persenProyeksi < 70) {
            riskCategory = 'kritis';
            riskColor = 'from-rose-500 to-red-500';
            riskIcon = <AlertTriangle className="w-5 h-5 text-white" />;
        } else if (persenProyeksi < 85) {
            riskCategory = 'waspada';
            riskColor = 'from-amber-500 to-yellow-500';
            riskIcon = <Info className="w-5 h-5 text-white" />;
        }

        return { 
            totalTarget, 
            realisasiHinggaSaatIni, 
            proyeksiAkhirTahun, 
            persenProyeksi,
            monthsPassed,
            monthsRemaining,
            riskCategory,
            riskColor,
            riskIcon
        };

    }, [pendapatan, realisasiPendapatan, selectedSkpd, projectionMonth, searchTerm]);

    // === EXECUTIVE SUMMARY DATA ===
    const executiveSummary = React.useMemo(() => {
        if (!stats.tableData.length) return null;
        
        const totalTarget = stats.tableData.reduce((sum, item) => sum + item.totalTarget, 0);
        const totalRealisasi = stats.tableData.reduce((sum, item) => sum + item.totalRealisasi, 0);
        const rataRataPersentase = totalTarget > 0 ? (totalRealisasi / totalTarget) * 100 : 0;
        
        // Sumber pendapatan dengan kinerja terbaik
        const topPerformers = [...stats.tableData]
            .sort((a, b) => b.persentase - a.persentase)
            .slice(0, 3);
        
        // Sumber pendapatan dengan kinerja terendah
        const lowPerformers = [...stats.tableData]
            .sort((a, b) => a.persentase - b.persentase)
            .slice(0, 3);
        
        // Sumber pendapatan dengan kontribusi terbesar
        const topContributors = [...stats.tableData]
            .sort((a, b) => b.totalRealisasi - a.totalRealisasi)
            .slice(0, 3);
        
        // Analisis gap
        const totalGap = totalTarget - totalRealisasi;
        const gapPercentage = totalTarget > 0 ? (totalGap / totalTarget) * 100 : 0;
        
        return {
            totalTarget,
            totalRealisasi,
            totalGap,
            gapPercentage,
            rataRataPersentase,
            topPerformers,
            lowPerformers,
            topContributors,
            totalItems: stats.tableData.length
        };
    }, [stats.tableData]);

    const totalPages = Math.ceil(stats.tableData.length / ITEMS_PER_PAGE);
    const paginatedData = stats.tableData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handlePageChange = (page) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page);
        }
    };
    
    React.useEffect(() => {
        setCurrentPage(1);
    }, [selectedSkpd, startMonth, endMonth, searchTerm, sortBy, sortOrder]);

    const handleSort = (type) => {
        if (sortBy === type) {
            setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
        } else {
            setSortBy(type);
            setSortOrder('desc');
        }
    };

    const getAnalysisPrompt = (query, allData) => {
    // Jika user mengirim query khusus
    if (query && query.trim() !== '') {
        return `Berdasarkan data pendapatan SKPD, jawab pertanyaan ini: ${query}`;
    }
    
    // Analisis default
    if (stats.tableData.length === 0) return "Data tidak cukup untuk dianalisis.";
    
    const totalTarget = executiveSummary?.totalTarget || 0;
    const totalRealisasi = executiveSummary?.totalRealisasi || 0;
    const rataRataPersentase = executiveSummary?.rataRataPersentase || 0;
    
    const top5 = stats.tableData.slice(0, 5);
    const low5 = stats.tableData.filter(item => item.persentase < 50).slice(0, 3);
    
    const period = startMonth === endMonth ? startMonth : `${startMonth} - ${endMonth}`;
    const filterContext = searchTerm ? `dengan filter "${searchTerm}"` : '';
    
    return `ANALISIS PENDAPATAN SKPD
TAHUN: ${selectedYear}
SKPD: ${selectedSkpd === 'Semua SKPD' ? 'Semua SKPD' : selectedSkpd}
PERIODE: ${period} ${filterContext}

DATA RINGKAS:
- Total Target Pendapatan: ${formatCurrency(totalTarget)}
- Total Realisasi: ${formatCurrency(totalRealisasi)} (${rataRataPersentase.toFixed(2)}%)
- Sisa Target: ${formatCurrency(executiveSummary?.totalGap || 0)}
- Distribusi Kinerja: Tinggi (${executiveSummary?.highPerformer || 0}), Sedang (${executiveSummary?.mediumPerformer || 0}), Rendah (${executiveSummary?.lowPerformer || 0})

PROYEKSI AKHIR TAHUN:
- Realisasi s/d ${projectionMonth}: ${formatCurrency(projectionData?.realisasiHinggaSaatIni || 0)}
- Proyeksi Akhir Tahun: ${formatCurrency(projectionData?.proyeksiAkhirTahun || 0)} (${projectionData?.persenProyeksi.toFixed(2)}%)
- Status Risiko: ${projectionData?.riskCategory === 'kritis' ? '⚠️ KRITIS' : projectionData?.riskCategory === 'waspada' ? '⚡ WASPADA' : '✅ AMAN'}

SUMBER PENDAPATAN DENGAN KINERJA TERTINGGI:
${top5.map((item, i) => `${i+1}. ${item.sumberPendapatan}: ${item.persentase.toFixed(2)}% (Target: ${formatCurrency(item.totalTarget)}, Realisasi: ${formatCurrency(item.totalRealisasi)})`).join('\n')}

SUMBER PENDAPATAN DENGAN KINERJA RENDAH (<50%):
${low5.length > 0 ? low5.map((item, i) => `${i+1}. ${item.sumberPendapatan}: ${item.persentase.toFixed(2)}%`).join('\n') : '- Tidak ada data dengan kinerja rendah'}

BERIKAN ANALISIS MENDALAM MENGENAI:
1. Kinerja Pencapaian Target: Identifikasi sumber pendapatan dengan kinerja optimal dan yang bermasalah.
2. Risiko Pendapatan: Analisis risiko berdasarkan proyeksi akhir tahun (${projectionData?.riskCategory}).
3. Rekomendasi Strategis: 3 langkah konkret untuk optimalisasi pendapatan di sisa tahun.
4. Peringatan Dini: Poin penting untuk rapat pimpinan.

Gunakan bahasa profesional, langsung ke inti, tanpa basa-basi.`;
};

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-10">
            <SectionTitle>STATISTIK PENDAPATAN PER SKPD</SectionTitle>
            
            {/* === EXECUTIVE DASHBOARD - INFORMASI UNTUK PIMPINAN === */}
            {showExecutiveInfo && executiveSummary && (
                <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-700 to-indigo-900 rounded-3xl p-8 text-white shadow-2xl border border-white/10 group mb-8">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -mr-40 -mt-40 transition-transform duration-1000 group-hover:scale-110"></div>
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-400/10 rounded-full blur-[80px] -ml-32 -mb-32"></div>
                    
                    {/* Crown Icon for Leadership */}
                    <div className="absolute top-8 right-12 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Crown size={120} className="text-yellow-400" />
                    </div>
                    
                    <div className="relative z-10">
                        {/* Header */}
                        <div className="flex items-center gap-4 mb-6 border-b border-white/20 pb-6">
                            <div className="p-4 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl shadow-lg shadow-yellow-500/30">
                                <Briefcase size={32} className="text-white" />
                            </div>
                            <div>
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black tracking-[0.2em] uppercase border border-white/30 mb-2">
                                    <Eye size={12} className="text-yellow-300" /> EXECUTIVE DASHBOARD
                                </div>
                                <h2 className="text-3xl font-black tracking-tighter leading-tight">
                                    RINGKASAN EKSEKUTIF PENDAPATAN <br/>
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">TAHUN {selectedYear}</span>
                                </h2>
                            </div>
                            <button 
                                onClick={() => setShowExecutiveInfo(false)}
                                className="ml-auto p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                                title="Sembunyikan"
                            >
                                <EyeOff size={20} />
                            </button>
                        </div>

                        {/* 3 Card Utama - Kinerja */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                            {/* Card 1: Capaian Keseluruhan */}
                            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 border border-white/20 hover:bg-white/15 transition-all">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 bg-emerald-500/30 rounded-xl">
                                        <Target size={24} className="text-emerald-200" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-emerald-200">TARGET VS REALISASI</p>
                                        <p className="text-2xl font-black text-white">
                                            {executiveSummary.rataRataPersentase.toFixed(1)}%
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-indigo-200">Target:</span>
                                        <span className="font-bold text-white">{formatCurrency(executiveSummary.totalTarget)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-indigo-200">Realisasi:</span>
                                        <span className="font-bold text-emerald-300">{formatCurrency(executiveSummary.totalRealisasi)}</span>
                                    </div>
                                    <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden mt-2">
                                        <div 
                                            className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full"
                                            style={{ width: `${Math.min(executiveSummary.rataRataPersentase, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Gap Analysis */}
                            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 border border-white/20 hover:bg-white/15 transition-all">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 bg-amber-500/30 rounded-xl">
                                        <AlertOctagon size={24} className="text-amber-200" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-amber-200">GAP ANALISIS</p>
                                        <p className="text-2xl font-black text-white">
                                            {executiveSummary.gapPercentage.toFixed(1)}%
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-indigo-200">Total Gap:</span>
                                        <span className="font-bold text-amber-300">{formatCurrency(executiveSummary.totalGap)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-indigo-200">Jumlah Sumber:</span>
                                        <span className="font-bold text-white">{executiveSummary.totalItems} item</span>
                                    </div>
                                    <div className="mt-2 p-2 bg-black/20 rounded-xl">
                                        <p className="text-xs text-indigo-200">
                                            {executiveSummary.gapPercentage > 20 
                                                ? '⚠️ Gap signifikan, perlu evaluasi intensif'
                                                : executiveSummary.gapPercentage > 10
                                                ? '📊 Gap moderat, optimalkan penagihan'
                                                : '✅ Gap minimal, kinerja baik'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Card 3: Proyeksi Akhir Tahun */}
                            {projectionData && (
                                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 border border-white/20 hover:bg-white/15 transition-all">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`p-3 rounded-xl bg-gradient-to-r ${projectionData.riskColor}`}>
                                            {projectionData.riskCategory === 'aman' 
                                                ? <CheckCircle size={24} className="text-white" />
                                                : projectionData.riskCategory === 'waspada'
                                                ? <Info size={24} className="text-white" />
                                                : <AlertTriangle size={24} className="text-white" />
                                            }
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-indigo-200">PROYEKSI AKHIR TAHUN</p>
                                            <p className="text-2xl font-black text-white">
                                                {projectionData.persenProyeksi.toFixed(1)}%
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-indigo-200">Proyeksi:</span>
                                            <span className="font-bold text-white">{formatCurrency(projectionData.proyeksiAkhirTahun)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-indigo-200">Sisa {projectionData.monthsRemaining} bln:</span>
                                            <span className="font-bold text-amber-300">{formatCurrency(projectionData.proyeksiAkhirTahun - projectionData.realisasiHinggaSaatIni)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Grid Insight untuk Pimpinan */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            {/* Top Performers */}
                            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                                <div className="flex items-center gap-2 mb-3">
                                    <Award size={18} className="text-yellow-400" />
                                    <h3 className="font-bold text-sm uppercase tracking-wider text-yellow-300">Kinerja Tertinggi</h3>
                                </div>
                                <div className="space-y-2">
                                    {executiveSummary.topPerformers.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
                                            <span className="text-xs font-medium text-indigo-200 truncate max-w-[200px]">
                                                {idx+1}. {item.sumberPendapatan}
                                            </span>
                                            <span className="text-xs font-bold text-emerald-400">
                                                {item.persentase.toFixed(1)}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Low Performers */}
                            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                                <div className="flex items-center gap-2 mb-3">
                                    <AlertTriangle size={18} className="text-rose-400" />
                                    <h3 className="font-bold text-sm uppercase tracking-wider text-rose-300">Perlu Perhatian</h3>
                                </div>
                                <div className="space-y-2">
                                    {executiveSummary.lowPerformers.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
                                            <span className="text-xs font-medium text-indigo-200 truncate max-w-[200px]">
                                                {idx+1}. {item.sumberPendapatan}
                                            </span>
                                            <span className="text-xs font-bold text-rose-400">
                                                {item.persentase.toFixed(1)}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                            <div className="bg-black/20 rounded-xl p-3 border border-white/10">
                                <p className="text-[10px] font-bold uppercase text-indigo-300">Total Sumber</p>
                                <p className="text-xl font-black text-white">{executiveSummary.totalItems}</p>
                            </div>
                            <div className="bg-black/20 rounded-xl p-3 border border-white/10">
                                <p className="text-[10px] font-bold uppercase text-indigo-300">Periode</p>
                                <p className="text-sm font-black text-white">{startMonth} - {endMonth}</p>
                            </div>
                            <div className="bg-black/20 rounded-xl p-3 border border-white/10">
                                <p className="text-[10px] font-bold uppercase text-indigo-300">Fokus SKPD</p>
                                <p className="text-sm font-black text-white truncate">{selectedSkpd}</p>
                            </div>
                            <div className="bg-black/20 rounded-xl p-3 border border-white/10">
                                <p className="text-[10px] font-bold uppercase text-indigo-300">Kinerja Rata2</p>
                                <p className="text-xl font-black text-emerald-300">{executiveSummary.rataRataPersentase.toFixed(1)}%</p>
                            </div>
                        </div>

                        {/* Executive Note */}
                        <div className="mt-6 flex items-center gap-3 text-sm bg-purple-900/30 p-4 rounded-2xl border border-purple-500/30">
                            <Lightbulb size={20} className="text-yellow-300 flex-shrink-0" />
                            <p className="text-xs leading-relaxed text-indigo-100">
                                <span className="font-bold text-white">CATATAN EKSEKUTIF:</span> Fokus pada sumber pendapatan dengan kinerja rendah. 
                                Optimalkan {executiveSummary.lowPerformers[0]?.sumberPendapatan || 'pendapatan utama'} yang masih di bawah target. 
                                Proyeksi akhir tahun menunjukkan {projectionData?.riskCategory === 'aman' ? 'kinerja positif' : 'perlu evaluasi intensif'}.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {!showExecutiveInfo && (
                <button 
                    onClick={() => setShowExecutiveInfo(true)}
                    className="mb-6 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                >
                    <Eye size={18} /> Tampilkan Executive Dashboard
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
  {showAnalysis && stats.tableData.length > 0 && (
    <div className="text-xs text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-2 bg-white/30 dark:bg-gray-800/30 p-2 rounded-lg">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
      </span>
      <span>SKPD: {selectedSkpd} | Total Sumber: {stats.tableData.length} | Serapan: {executiveSummary?.rataRataPersentase.toFixed(1)}%</span>
    </div>
  )}
  
  {/* Komponen GeminiAnalysis dengan Conditional Rendering */}
  {showAnalysis && (
    <GeminiAnalysis 
      getAnalysisPrompt={getAnalysisPrompt} 
      disabledCondition={stats.tableData.length === 0} 
      userCanUseAi={userRole !== 'viewer'}
      allData={{
        selectedSkpd,
        startMonth,
        endMonth,
        projectionMonth,
        executiveSummary,
        projectionData,
        topItems: stats.tableData.slice(0, 5)
      }}
    />
  )}
</div>

            {/* Projection Card dengan Glassmorphism */}
            {projectionData && showProjection && (
                <div className="relative overflow-hidden rounded-3xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl shadow-2xl border border-white/50 dark:border-gray-700/50 group hover:shadow-3xl transition-all duration-500">
                    <div className={`absolute top-0 right-0 w-40 h-40 rounded-bl-full bg-gradient-to-br ${projectionData.riskColor} opacity-10 group-hover:opacity-20 transition-opacity`}></div>
                    
                    <div className="p-8">
                        <div className="flex flex-col md:flex-row justify-between items-start mb-6">
                            <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-xl bg-gradient-to-r ${projectionData.riskColor} shadow-lg`}>
                                    {projectionData.riskIcon}
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-800 dark:text-white">Proyeksi Pendapatan Akhir Tahun</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Berdasarkan realisasi hingga {projectionMonth}
                                        {searchTerm && <span className="ml-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs">Filter: "{searchTerm}"</span>}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mt-3 md:mt-0">
                                <button
                                    onClick={() => setShowProjection(!showProjection)}
                                    className="p-2.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl hover:bg-white dark:hover:bg-gray-700 transition-all"
                                    title={showProjection ? 'Sembunyikan' : 'Tampilkan'}
                                >
                                    {showProjection ? <EyeOff size={18} className="text-gray-600 dark:text-gray-300" /> : <Eye size={18} />}
                                </button>
                                <div className="flex items-center gap-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <Calendar size={16} className="text-teal-500" />
                                    <select
                                        value={projectionMonth}
                                        onChange={(e) => setProjectionMonth(e.target.value)}
                                        className="text-sm font-medium bg-transparent focus:outline-none cursor-pointer"
                                    >
                                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-xl p-5 border border-white/50 dark:border-gray-700/50 transition-all hover:scale-105 duration-300">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Target Tahunan</p>
                                <p className="text-xl font-black text-gray-800 dark:text-white">{formatCurrency(projectionData.totalTarget)}</p>
                            </div>
                            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-xl p-5 border border-white/50 dark:border-gray-700/50 transition-all hover:scale-105 duration-300">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Realisasi s/d {projectionMonth}</p>
                                <p className="text-xl font-black text-teal-600 dark:text-teal-400">{formatCurrency(projectionData.realisasiHinggaSaatIni)}</p>
                                <p className="text-xs text-gray-400 mt-1">{projectionData.monthsPassed} bulan</p>
                            </div>
                            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-xl p-5 border border-white/50 dark:border-gray-700/50 transition-all hover:scale-105 duration-300">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Proyeksi Akhir Tahun</p>
                                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(projectionData.proyeksiAkhirTahun)}</p>
                            </div>
                            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-xl p-5 border border-white/50 dark:border-gray-700/50 transition-all hover:scale-105 duration-300">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Potensi Capaian</p>
                                <div className="flex items-center gap-2">
                                    <p className="text-2xl font-black text-teal-600 dark:text-teal-400">{projectionData.persenProyeksi.toFixed(1)}%</p>
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${projectionData.riskColor} text-white shadow-lg`}>
                                        {projectionData.riskCategory === 'kritis' ? 'KRITIS' : 
                                         projectionData.riskCategory === 'waspada' ? 'WASPADA' : 'AMAN'}
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-xl p-5 border border-white/50 dark:border-gray-700/50 transition-all hover:scale-105 duration-300 flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Sisa Bulan</p>
                                    <p className="text-2xl font-black text-gray-800 dark:text-white">{projectionData.monthsRemaining}</p>
                                </div>
                                <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${projectionData.riskColor} flex items-center justify-center shadow-xl`}>
                                    {projectionData.riskIcon}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Card - Glassmorphism Enhanced */}
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/50 dark:border-gray-700/50 overflow-hidden transition-all duration-500 hover:shadow-3xl">
                {/* Filter Section - Glassmorphism */}
                <div className="p-8 bg-gradient-to-r from-white/50 to-white/30 dark:from-gray-800/50 dark:to-gray-900/50 border-b border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-black text-gray-800 dark:text-white flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-gradient-to-b from-teal-500 to-emerald-500 rounded-full"></div>
                            PANEL ANALISIS PENDAPATAN
                        </h3>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setViewMode(viewMode === 'table' ? 'card' : 'table')}
                                className="p-2.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl hover:bg-white dark:hover:bg-gray-700 transition-all"
                                title={viewMode === 'table' ? 'Tampilan Card' : 'Tampilan Tabel'}
                            >
                                {viewMode === 'table' ? <LayoutDashboard size={18} /> : <BarChart3 size={18} />}
                            </button>
                            <button
                                onClick={() => setChartType(chartType === 'bar' ? 'composed' : 'bar')}
                                className="px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl hover:bg-white dark:hover:bg-gray-700 transition-all text-sm font-medium flex items-center gap-2"
                            >
                                {chartType === 'bar' ? <BarChart3 size={16} /> : <PieChart size={16} />}
                                {chartType === 'bar' ? 'Bar Chart' : 'Composed Chart'}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">SKPD/OPD</label>
                            <div className="relative group">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-500 group-hover:scale-110 transition-transform" size={18} />
                                <select
                                    value={selectedSkpd}
                                    onChange={(e) => setSelectedSkpd(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="Semua SKPD">🏢 Semua SKPD</option>
                                    {skpdList.map(skpd => <option key={skpd} value={skpd}>{skpd}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pencarian</label>
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-teal-500 transition-colors" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Ketik kata kunci..." 
                                    value={searchTerm} 
                                    onChange={(e) => setSearchTerm(e.target.value)} 
                                    className="w-full pl-10 pr-4 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all" 
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Dari Bulan</label>
                            <select value={startMonth} onChange={e => setStartMonth(e.target.value)} className="w-full px-4 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all">
                                {months.map(month => <option key={`start-${month}`} value={month}>{month}</option>)}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sampai Bulan</label>
                            <select value={endMonth} onChange={e => setEndMonth(e.target.value)} className="w-full px-4 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all">
                                {months.map(month => <option key={`end-${month}`} value={month}>{month}</option>)}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Urutkan</label>
                            <div className="flex gap-2">
                                <select
                                    value={sortBy}
                                    onChange={(e) => handleSort(e.target.value)}
                                    className="flex-1 px-4 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
                                >
                                    <option value="target">Target</option>
                                    <option value="realisasi">Realisasi</option>
                                    <option value="persentase">Persentase</option>
                                </select>
                                <button
                                    onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                                    className="px-3 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-700 transition-all"
                                >
                                    {sortOrder === 'desc' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chart Section - Enhanced */}
                {stats.chartData.length > 0 && (
                    <div className="p-8 bg-gradient-to-br from-teal-50/30 via-white/30 to-transparent dark:from-teal-900/10 dark:via-gray-900/30">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="p-2 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl shadow-lg">
                                <TrendingUp className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-lg font-black text-gray-800 dark:text-white">Komposisi Pendapatan (Top 15)</h3>
                            <span className="ml-auto text-xs px-3 py-1 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-full">
                                {stats.chartData.length} item
                            </span>
                        </div>
                        <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-md rounded-2xl p-6 border border-white/50 dark:border-gray-700/50">
                            <ResponsiveContainer width="100%" height={450}>
                                {chartType === 'bar' ? (
                                    <BarChart data={stats.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
                                        <defs>
                                            <linearGradient id="targetGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#6366F1" stopOpacity={0.9}/>
                                                <stop offset="100%" stopColor="#818CF8" stopOpacity={0.9}/>
                                            </linearGradient>
                                            <linearGradient id="realisasiGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#10B981" stopOpacity={0.9}/>
                                                <stop offset="100%" stopColor="#34D399" stopOpacity={0.9}/>
                                            </linearGradient>
                                            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                                                <feMerge>
                                                    <feMergeNode in="coloredBlur"/>
                                                    <feMergeNode in="SourceGraphic"/>
                                                </feMerge>
                                            </filter>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.1)" vertical={false} />
                                        <XAxis 
                                            dataKey="name" 
                                            angle={-45} 
                                            textAnchor="end" 
                                            interval={0} 
                                            tick={{ fontSize: 9, fontWeight: 500, fill: '#64748b' }}
                                            height={100}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis 
                                            tickFormatter={(val) => `${(val / 1e9).toFixed(1)}M`} 
                                            tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} />
                                        <Legend 
                                            verticalAlign="top" 
                                            height={40}
                                            iconType="circle"
                                            wrapperStyle={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
                                        />
                                        <Bar 
                                            dataKey="Target" 
                                            fill="url(#targetGradient)" 
                                            name="Target" 
                                            radius={[8, 8, 0, 0]} 
                                            barSize={25} 
                                            animationDuration={2000}
                                            filter="url(#glow)"
                                        />
                                        <Bar 
                                            dataKey="Realisasi" 
                                            fill="url(#realisasiGradient)" 
                                            name="Realisasi" 
                                            radius={[8, 8, 0, 0]} 
                                            barSize={25} 
                                            animationDuration={2500}
                                            filter="url(#glow)"
                                        />
                                    </BarChart>
                                ) : (
                                    <ComposedChart data={stats.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
                                        <defs>
                                            <linearGradient id="composedTarget" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#6366F1" stopOpacity={0.9}/>
                                                <stop offset="100%" stopColor="#818CF8" stopOpacity={0.9}/>
                                            </linearGradient>
                                            <linearGradient id="composedRealisasi" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#10B981" stopOpacity={0.9}/>
                                                <stop offset="100%" stopColor="#34D399" stopOpacity={0.9}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.1)" vertical={false} />
                                        <XAxis 
                                            dataKey="name" 
                                            angle={-45} 
                                            textAnchor="end" 
                                            interval={0} 
                                            tick={{ fontSize: 9, fontWeight: 500, fill: '#64748b' }}
                                            height={100}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis 
                                            yAxisId="left"
                                            tickFormatter={(val) => `${(val / 1e9).toFixed(1)}M`} 
                                            tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis 
                                            yAxisId="right"
                                            orientation="right"
                                            domain={[0, 100]}
                                            tickFormatter={(val) => `${val}%`}
                                            tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} />
                                        <Legend 
                                            verticalAlign="top" 
                                            height={40}
                                            iconType="circle"
                                            wrapperStyle={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
                                        />
                                        <Bar yAxisId="left" dataKey="Target" fill="url(#composedTarget)" name="Target" barSize={20} radius={[4, 4, 0, 0]} />
                                        <Bar yAxisId="left" dataKey="Realisasi" fill="url(#composedRealisasi)" name="Realisasi" barSize={20} radius={[4, 4, 0, 0]} />
                                        <Line 
                                            yAxisId="right" 
                                            type="monotone" 
                                            dataKey="persentase" 
                                            stroke="#F59E0B" 
                                            name="Persentase (%)" 
                                            strokeWidth={4} 
                                            dot={{ r: 6, fill: '#F59E0B', strokeWidth: 2, stroke: '#fff' }}
                                            activeDot={{ r: 8 }}
                                            animationDuration={3000}
                                        />
                                    </ComposedChart>
                                )}
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Table/Card Section */}
                <div className="p-8">
                    {stats.tableData.length > 0 ? (
                        <>
                            {viewMode === 'table' ? (
                                <div className="overflow-x-auto rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                                    <table className="min-w-full">
                                        <thead>
                                            <tr className="bg-gradient-to-r from-gray-50/80 to-white/80 dark:from-gray-800/80 dark:to-gray-900/80">
                                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sumber Pendapatan</th>
                                                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">Target Tahunan</th>
                                                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">Realisasi</th>
                                                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">%</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {paginatedData.map((item, index) => (
                                                <tr key={index} className="hover:bg-teal-500/5 transition-colors group">
                                                    <td className="px-6 py-4 text-sm text-gray-800 dark:text-gray-200 max-w-md break-words">
                                                        {item.sumberPendapatan}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-right font-medium text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                                                        {formatCurrency(item.totalTarget)}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-right font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                                        {formatCurrency(item.totalRealisasi)}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-right whitespace-nowrap">
                                                        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                                                            item.persentase >= 90 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                            item.persentase >= 70 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                        }`}>
                                                            {item.persentase.toFixed(1)}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {paginatedData.map((item, index) => (
                                        <div 
                                            key={index} 
                                            className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-2xl p-6 border border-white/50 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400 font-mono mb-2 inline-block">
                                                        {item.sumberPendapatan.substring(0, 30)}...
                                                    </span>
                                                    <h4 className="text-sm font-bold text-gray-800 dark:text-white mt-2">
                                                        {item.sumberPendapatan.length > 50 
                                                            ? item.sumberPendapatan.substring(0, 50) + '...' 
                                                            : item.sumberPendapatan}
                                                    </h4>
                                                </div>
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-black ${
                                                    item.persentase >= 90 ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                                                    item.persentase >= 70 ? 'bg-gradient-to-br from-yellow-500 to-amber-600' :
                                                    'bg-gradient-to-br from-red-500 to-rose-600'
                                                }`}>
                                                    {item.persentase.toFixed(0)}%
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-500 dark:text-gray-400">Target:</span>
                                                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(item.totalTarget)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-500 dark:text-gray-400">Realisasi:</span>
                                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(item.totalRealisasi)}</span>
                                                </div>
                                                <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full ${
                                                            item.persentase >= 90 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                                                            item.persentase >= 70 ? 'bg-gradient-to-r from-yellow-500 to-amber-500' :
                                                            'bg-gradient-to-r from-red-500 to-rose-500'
                                                        }`}
                                                        style={{ width: `${Math.min(item.persentase, 100)}%` }}
                                                    ></div>
                                                </div>
                                                <div className="flex justify-end">
                                                    <span className="text-xs text-gray-400">
                                                        Gap: {formatCurrency(item.totalTarget - item.totalRealisasi)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

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
                        </>
                    ) : (
                        <div className="text-center py-20 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl">
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center">
                                <Info className="w-12 h-12 text-gray-400" />
                            </div>
                            <p className="text-xl font-bold text-gray-600 dark:text-gray-400 mb-2">
                                Tidak ada data pendapatan
                            </p>
                            {searchTerm && (
                                <p className="text-sm text-gray-500 dark:text-gray-500">
                                    Coba hapus filter pencarian "{searchTerm}"
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Notes - Glassmorphism */}
                {stats.tableData.length > 0 && (
                    <div className="px-8 py-5 bg-gradient-to-r from-gray-50/50 to-transparent dark:from-gray-800/50 border-t border-gray-200/50 dark:border-gray-700/50">
                        <div className="flex flex-wrap gap-6 text-xs">
                            <span className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full shadow-lg"></div>
                                <span className="font-medium text-gray-600 dark:text-gray-400">Total {stats.tableData.length} sumber pendapatan</span>
                            </span>
                            <span className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-lg"></div>
                                <span className="font-medium text-gray-600 dark:text-gray-400">
                                    Realisasi: {stats.tableData.length > 0 
                                        ? (stats.tableData.reduce((sum, item) => sum + item.totalRealisasi, 0) / 
                                           stats.tableData.reduce((sum, item) => sum + item.totalTarget, 0) * 100).toFixed(1) 
                                        : 0}%
                                </span>
                            </span>
                            <span className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full shadow-lg"></div>
                                <span className="font-medium text-gray-600 dark:text-gray-400">Periode: {startMonth} - {endMonth}</span>
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Download Button - Glassmorphism */}
            <div className="flex justify-end">
                <button 
                    onClick={() => {/* handle download */}}
                    disabled={stats.tableData.length === 0}
                    className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                    <Download size={18} className="group-hover:scale-110 transition-transform" />
                    Download Laporan Excel
                    <span className="ml-2 px-2 py-1 bg-white/20 rounded-lg text-xs">
                        {stats.tableData.length} item
                    </span>
                </button>
            </div>
        </div>
    );
};

export default SkpdPendapatanStatsView;
