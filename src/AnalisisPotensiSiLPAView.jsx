import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Coins, 
  Calendar, 
  PieChart,
  Bot,
  Sparkles,
  Loader2,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  Eye,
  EyeOff,
  Info,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  BarChart3,
  Download,
  FileText,
  Zap
} from 'lucide-react';

// --- UTILITIES ---
const formatCurrency = (value) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// --- SUB-COMPONENTS ---

const SectionTitle = ({ children }) => (
  <div className="relative mb-12 group">
    <div className="flex items-center gap-4">
      <div className="h-12 w-1.5 bg-gradient-to-b from-indigo-600 via-purple-600 to-transparent rounded-full" />
      <h2 className="text-4xl font-black tracking-tighter text-slate-800 dark:text-white transition-all duration-500 group-hover:tracking-tight">
        {children}
      </h2>
    </div>
    <div className="absolute -bottom-4 left-6 h-1 w-24 bg-gradient-to-r from-indigo-600/50 to-transparent rounded-full transition-all duration-700 group-hover:w-48"></div>
  </div>
);

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visiblePages = pages.filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 mt-10">
      <button 
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className="p-3 rounded-2xl bg-white/40 dark:bg-gray-800/40 backdrop-blur-md border border-white/20 dark:border-gray-700/30 disabled:opacity-20 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all shadow-sm group"
      >
        <ChevronsLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
      </button>
      
      <div className="flex items-center gap-2 p-1.5 bg-white/30 dark:bg-gray-900/30 backdrop-blur-xl rounded-[1.5rem] border border-white/20 dark:border-gray-700/30 shadow-inner">
        {visiblePages.map((page, i) => (
          <React.Fragment key={page}>
            {i > 0 && visiblePages[i - 1] !== page - 1 && (
              <span className="text-slate-400 px-1 font-black">···</span>
            )}
            <button
              onClick={() => onPageChange(page)}
              className={`w-11 h-11 rounded-xl font-black text-sm transition-all duration-500 ${
                currentPage === page 
                  ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-[0_8px_20px_-6px_rgba(79,70,229,0.6)] scale-105 z-10' 
                  : 'text-slate-500 hover:bg-white/50 dark:hover:bg-gray-800/50 hover:text-indigo-600'
              }`}
            >
              {page}
            </button>
          </React.Fragment>
        ))}
      </div>
      
      <button 
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className="p-3 rounded-2xl bg-white/40 dark:bg-gray-800/40 backdrop-blur-md border border-white/20 dark:border-gray-700/30 disabled:opacity-20 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all shadow-sm group"
      >
        <ChevronsRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
      </button>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/80 dark:bg-gray-950/90 backdrop-blur-3xl p-6 rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] border border-white/40 dark:border-gray-800/50 min-w-[320px] z-50 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex flex-col gap-1 mb-4 border-b border-gray-100/50 dark:border-gray-800/50 pb-4">
          <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.2em]">Data Detail SKPD</p>
          <p className="font-black text-base text-gray-900 dark:text-white leading-tight break-words">
            {label}
          </p>
        </div>
        <div className="space-y-3">
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex justify-between items-center group/item transition-all hover:translate-x-1">
              <span className="flex items-center gap-3 text-gray-600 dark:text-gray-400 font-bold text-xs uppercase tracking-wider">
                <div className="w-3 h-3 rounded-full shadow-[0_0_12px_rgba(0,0,0,0.1)]" style={{ 
                  background: `linear-gradient(135deg, ${entry.color}, white)`,
                  boxShadow: `0 0 15px ${entry.color}44` 
                }}></div>
                {entry.name}
              </span>
              <span className="font-black text-sm text-gray-950 dark:text-white tabular-nums tracking-tighter">
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-gray-100/30 dark:border-gray-800/30 flex justify-between items-center">
             <span className="text-[10px] text-gray-400 font-bold italic">PROYEKSI AKHIR TAHUN</span>
             <Sparkles className="w-3 h-3 text-yellow-500 animate-pulse" />
        </div>
      </div>
    );
  }
  return null;
};

const GeminiAnalysis = ({ getAnalysisPrompt, disabledCondition, theme, selectedYear, userRole }) => {
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(true);

  const generateAnalysis = async () => {
    if (disabledCondition) return;
    
    setLoading(true);
    setError(null);
    const apiKey = ""; 
    const prompt = getAnalysisPrompt("Berikan analisis mendalam mengenai potensi SiLPA tahun berjalan berdasarkan data yang ada, identifikasi SKPD berisiko tinggi, dan berikan rekomendasi mitigasi.");

    const fetchWithRetry = async (url, options, retries = 5, backoff = 1000) => {
      try {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
      } catch (err) {
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, backoff));
          return fetchWithRetry(url, options, retries - 1, backoff * 2);
        }
        throw err;
      }
    };

    try {
      const result = await fetchWithRetry(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            systemInstruction: { 
              parts: [{ text: `Anda adalah pakar keuangan daerah di Indonesia. Analisis data berdasarkan PP 12/2019. Gunakan bahasa yang profesional namun mudah dimengerti oleh ${userRole}.` }] 
            }
          })
        }
      );

      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      setAnalysis(text || "Gagal menghasilkan analisis.");
    } catch (err) {
      setError("Gagal menghubungi AI. Silakan coba lagi nanti.");
    } finally {
      setLoading(false);
    }
  };

  if (!showAnalysis) {
    return (
      <button
        onClick={() => setShowAnalysis(true)}
        className="mb-10 px-8 py-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-800 text-white rounded-[1.5rem] font-black text-sm flex items-center gap-3 shadow-[0_15px_30px_-10px_rgba(79,70,229,0.5)] hover:shadow-[0_20px_40px_-10px_rgba(79,70,229,0.6)] transition-all active:scale-95 group"
      >
        <div className="p-1.5 bg-white/20 rounded-lg group-hover:rotate-12 transition-transform">
          <Bot size={20} />
        </div> 
        AKTIFKAN INTELEGENSIA BUATAN
      </button>
    );
  }

  return (
    <div className="relative overflow-hidden bg-white/40 dark:bg-gray-900/40 backdrop-blur-3xl border border-white/40 dark:border-white/5 rounded-[3rem] p-10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] mb-12 transition-all duration-1000 group">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 transition-all duration-1000 group-hover:bg-indigo-500/10"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>
      
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 rounded-2xl text-white shadow-[0_10px_25px_-5px_rgba(79,70,229,0.5)] transform -rotate-2 group-hover:rotate-0 transition-transform duration-500">
              <Bot className="w-8 h-8" />
            </div>
            <div>
              <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.3em] mb-1">Advanced Reasoning Module</p>
              <h3 className="font-black text-2xl text-gray-900 dark:text-white flex items-center gap-3 tracking-tighter leading-none">
                AI Strategic Insight
                <div className="flex gap-1">
                    <Sparkles className="w-4 h-4 text-yellow-500 fill-yellow-500 animate-pulse" />
                    <Zap className="w-4 h-4 text-indigo-400 fill-indigo-400 animate-bounce delay-75" />
                </div>
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAnalysis(false)}
              className="p-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md rounded-2xl hover:bg-white dark:hover:bg-gray-700 transition-all border border-white/20 shadow-sm"
              title="Sembunyikan"
            >
              <EyeOff size={18} className="text-gray-500" />
            </button>
            <button
              onClick={generateAnalysis}
              disabled={loading || disabledCondition}
              className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                loading || disabledCondition 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-[0_10px_25px_-8px_rgba(79,70,229,0.5)] hover:shadow-[0_15px_35px_-8px_rgba(79,70,229,0.6)] active:scale-95'
              }`}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {analysis ? 'Re-Generate Analysis' : 'Initialize Analysis'}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-4 p-5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl mb-6 text-sm font-bold animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            {error}
          </div>
        )}

        {analysis ? (
          <div className="relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-transparent opacity-30 rounded-full"></div>
            <div className="prose prose-indigo dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap pl-8 text-base font-medium animate-in fade-in slide-in-from-left-4 duration-1000">
              {analysis}
            </div>
          </div>
        ) : (
          !loading && (
            <div className="p-8 bg-indigo-50/50 dark:bg-indigo-950/20 backdrop-blur-md rounded-[2rem] border border-dashed border-indigo-200 dark:border-indigo-900/50 transition-all group-hover:border-indigo-400">
              <p className="text-gray-500 dark:text-gray-400 italic text-sm text-center leading-loose">
                Sistem siap melakukan analisis prediktif. <br/>
                <span className="font-black text-indigo-600 dark:text-indigo-400 not-italic uppercase tracking-widest text-[10px]">Klik tombol di atas untuk memulai pemrosesan data.</span>
              </p>
            </div>
          )
        )}
        
        {loading && (
          <div className="flex flex-col items-center py-16 gap-6 bg-white/20 dark:bg-black/20 backdrop-blur-3xl rounded-[2.5rem] border border-white/30 dark:border-white/5 animate-pulse">
            <div className="relative">
                <Loader2 className="w-16 h-16 text-indigo-500 animate-spin" />
                <div className="absolute inset-0 bg-indigo-400 blur-3xl opacity-20 animate-pulse"></div>
            </div>
            <div className="text-center space-y-2">
                <p className="text-indigo-600 dark:text-indigo-400 text-xl font-black tracking-tighter uppercase">Menjalankan Algoritma Proyeksi</p>
                <p className="text-gray-500 dark:text-gray-400 text-xs font-bold tracking-[0.3em] animate-bounce">MENGANALISIS RISIKO SILPA DAERAH...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- MAIN VIEW COMPONENT ---

const AnalisisPotensiSiLPAView = ({ data = {}, theme, selectedYear, userRole }) => {
    const { 
        anggaran = [], 
        realisasi = {}, 
        realisasiNonRkud = {} 
    } = data;

// TEMPATKAN INI DI BARIS PERTAMA SETELAH const AnalisisPotensiSiLPAView = ({ data, theme, selectedYear, userRole }) => {
console.log('🔥🔥🔥 INI VERSI BARU - HARUSNYA MUNCUL DI CONSOLE 🔥🔥🔥');
alert('🚨🚨🚨 INI VERSI BARU DENGAN EXECUTIVE DASHBOARD!');

    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    const COLORS = {
        anggaran: '#6366F1',
        realisasi: '#10B981',
        proyeksi: '#F59E0B',
        silpa: '#F43F5E'
    };

    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [showFilters, setShowFilters] = useState(true);
    const [showExecutiveInfo, setShowExecutiveInfo] = useState(true);

    const lastMonthWithData = useMemo(() => {
        for (let i = months.length - 1; i >= 0; i--) {
            const hasRkud = realisasi[months[i]] && realisasi[months[i]].length > 0;
            const hasNonRkud = realisasiNonRkud[months[i]] && realisasiNonRkud[months[i]].length > 0;
            if (hasRkud || hasNonRkud) return months[i];
        }
        return months[0];
    }, [realisasi, realisasiNonRkud, months]);

    const [projectionMonth, setProjectionMonth] = useState(lastMonthWithData);
    const [riskLevel, setRiskLevel] = useState('semua');
    
    useEffect(() => {
        setProjectionMonth(lastMonthWithData);
    }, [lastMonthWithData]);

    const silpaData = useMemo(() => {
        const skpdAnggaranMap = new Map();
        (anggaran || []).forEach(item => {
            const skpd = item.NamaSKPD || 'Tanpa SKPD';
            skpdAnggaranMap.set(skpd, (skpdAnggaranMap.get(skpd) || 0) + item.nilai);
        });

        const projectionMonthIndex = months.indexOf(projectionMonth);
        const monthsPassed = projectionMonthIndex + 1;
        const monthsRemaining = 12 - monthsPassed;
        const passedMonths = months.slice(0, monthsPassed);

        const skpdRealisasiMap = new Map();
        passedMonths.forEach(month => {
            (realisasi[month] || []).forEach(item => {
                const skpd = item.NamaSKPD || 'Tanpa SKPD';
                skpdRealisasiMap.set(skpd, (skpdRealisasiMap.get(skpd) || 0) + item.nilai);
            });
            (realisasiNonRkud[month] || []).forEach(item => {
                const skpd = item.NAMASKPD || 'Tanpa SKPD';
                skpdRealisasiMap.set(skpd, (skpdRealisasiMap.get(skpd) || 0) + item.nilai);
            });
        });

        const tableData = Array.from(skpdAnggaranMap.keys()).map(skpd => {
            const totalAnggaran = skpdAnggaranMap.get(skpd) || 0;
            const realisasiHinggaSaatIni = skpdRealisasiMap.get(skpd) || 0;
            
            const rataRataBulanan = monthsPassed > 0 ? realisasiHinggaSaatIni / monthsPassed : 0;
            const proyeksiSisaBulan = rataRataBulanan * monthsRemaining;
            const proyeksiAkhirTahun = realisasiHinggaSaatIni + proyeksiSisaBulan;
            
            const potensiSiLPA = Math.max(0, totalAnggaran - proyeksiAkhirTahun);
            const persenSiLPA = totalAnggaran > 0 ? (potensiSiLPA / totalAnggaran) * 100 : 0;
            
            let riskCategory = 'aman';
            if (persenSiLPA >= 20) riskCategory = 'kritis';
            else if (persenSiLPA >= 10) riskCategory = 'waspada';

            return { 
                skpd, 
                totalAnggaran, 
                realisasiHinggaSaatIni, 
                proyeksiAkhirTahun, 
                potensiSiLPA, 
                persenSiLPA,
                riskCategory
            };
        }).sort((a, b) => b.potensiSiLPA - a.potensiSiLPA);
        
        const totals = tableData.reduce((acc, curr) => ({
            totalAnggaran: acc.totalAnggaran + curr.totalAnggaran,
            potensiSiLPA: acc.potensiSiLPA + curr.potensiSiLPA,
        }), { totalAnggaran: 0, potensiSiLPA: 0 });
        
        const filteredBySearch = tableData.filter(item => 
            item.skpd.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        const filteredByRisk = riskLevel === 'semua' 
            ? filteredBySearch 
            : filteredBySearch.filter(item => item.riskCategory === riskLevel);
            
        const chartData = filteredByRisk.slice(0, 10);

        return { 
            tableData: filteredByRisk,
            rawTableData: tableData,
            totals, 
            chartData,
            monthsPassed,
            monthsRemaining
        };
    }, [anggaran, realisasi, realisasiNonRkud, projectionMonth, riskLevel, searchTerm, months]);

    const totalPages = Math.ceil(silpaData.tableData.length / itemsPerPage);
    const paginatedData = silpaData.tableData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, riskLevel]);

    const getAnalysisPrompt = (customQuery) => {
        return `Data Potensi SiLPA untuk tahun ${selectedYear}: 
        Total Pagu: ${formatCurrency(silpaData.totals.totalAnggaran)}, 
        Estimasi SiLPA: ${formatCurrency(silpaData.totals.potensiSiLPA)} (${((silpaData.totals.potensiSiLPA / silpaData.totals.totalAnggaran) * 100).toFixed(2)}%).
        Bulan berjalan: ${projectionMonth}.
        SKPD Teratas dengan SiLPA: ${silpaData.chartData.slice(0, 3).map(d => `${d.skpd}: ${d.persenSiLPA.toFixed(1)}%`).join(', ')}.
        Pertanyaan: ${customQuery}`;
    };

    const handleDownloadExcel = () => {
        if (!silpaData.tableData || silpaData.tableData.length === 0) return;
        if (!window.XLSX) {
            alert('Library XLSX belum tersedia.');
            return;
        }

        try {
            const dataForExport = silpaData.tableData.map(item => ({
                'SKPD/OPD': item.skpd,
                'Pagu Anggaran (Rp)': item.totalAnggaran,
                'Realisasi (Rp)': item.realisasiHinggaSaatIni,
                'Proyeksi Akhir Tahun (Rp)': item.proyeksiAkhirTahun,
                'Potensi SiLPA (Rp)': item.potensiSiLPA,
                'Persentase SiLPA (%)': item.persenSiLPA.toFixed(2),
                'Tingkat Risiko': item.riskCategory === 'kritis' ? 'Kritis' : item.riskCategory === 'waspada' ? 'Waspada' : 'Aman'
            }));
            
            const worksheet = window.XLSX.utils.json_to_sheet(dataForExport);
            const workbook = window.XLSX.utils.book_new();
            window.XLSX.utils.book_append_sheet(workbook, worksheet, "Potensi SiLPA");
            window.XLSX.writeFile(workbook, `Potensi_SiLPA_${selectedYear}.xlsx`);
        } catch (err) {
            console.error(err);
            alert('Gagal mengunduh file Excel.');
        }
    };

    return (
        <div className="space-y-12 max-w-full p-4 md:p-8 animate-in fade-in duration-1000 pb-20 bg-slate-50/30 dark:bg-transparent">
            <SectionTitle>Analisis Potensi SiLPA</SectionTitle>
            
            {/* EXECUTIVE INFO PANEL - PREMIUM GLASS */}
            {showExecutiveInfo && (
                <div className="relative overflow-hidden rounded-[3.5rem] bg-gradient-to-br from-indigo-950 via-slate-900 to-black p-12 text-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white/5 group mb-12">
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[150px] -mr-96 -mt-96 transition-all duration-1000 group-hover:bg-indigo-500/20"></div>
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] -ml-80 -mb-80"></div>
                    
                    <div className="relative z-10">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-8 mb-12 border-b border-white/10 pb-10">
                            <div className="p-6 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 rounded-[2rem] shadow-[0_20px_50px_-10px_rgba(99,102,241,0.6)] transform -rotate-3 transition-all duration-700 group-hover:rotate-0">
                                <TrendingUp size={48} className="text-white" />
                            </div>
                            <div className="flex-1">
                                <div className="inline-flex items-center gap-3 px-5 py-2 bg-white/10 backdrop-blur-2xl rounded-full text-[11px] font-black tracking-[0.4em] uppercase border border-white/20 mb-4 animate-pulse">
                                    <Zap size={14} className="text-yellow-400" /> Executive Strategic Intelligence
                                </div>
                                <h2 className="text-4xl lg:text-6xl font-black tracking-tighter leading-[0.9] mb-4">
                                    ESTIMASI SISA ANGGARAN <br/>
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">FISKAL {selectedYear}</span>
                                </h2>
                                <p className="text-slate-400 font-medium max-w-2xl text-lg leading-relaxed">
                                    Visualisasi cerdas untuk memitigasi penumpukan dana di akhir tahun anggaran melalui analisis proyeksi realisasi linier.
                                </p>
                            </div>
                            <button 
                                onClick={() => setShowExecutiveInfo(false)}
                                className="self-start lg:self-center p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all hover:scale-110 active:scale-90"
                                title="Sembunyikan"
                            >
                                <EyeOff size={24} className="text-slate-400" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Card 1 */}
                            <div className="relative overflow-hidden bg-white/5 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/10 transition-all duration-500 hover:translate-y-[-8px] hover:bg-white/[0.08] group/card">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/card:opacity-30 transition-opacity">
                                    <Coins size={80} />
                                </div>
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-6">Total Pagu Fiscal</p>
                                <div className="flex flex-col gap-1">
                                    <p className="text-3xl font-black text-white tracking-tighter">
                                        {formatCurrency(silpaData.totals.totalAnggaran)}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-500 w-full animate-progress-slow"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card 2 */}
                            <div className="relative overflow-hidden bg-white/5 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/10 transition-all duration-500 hover:translate-y-[-8px] hover:bg-white/[0.08] group/card">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/card:opacity-30 transition-opacity">
                                    <AlertTriangle size={80} />
                                </div>
                                <p className="text-[10px] font-black text-rose-400 uppercase tracking-[0.3em] mb-6">Potensi SiLPA (Estimasi)</p>
                                <div className="flex flex-col gap-1">
                                    <p className="text-3xl font-black text-white tracking-tighter">
                                        {formatCurrency(silpaData.totals.potensiSiLPA)}
                                    </p>
                                    <div className="flex items-center justify-between mt-3 px-3 py-1.5 bg-rose-500/20 rounded-xl border border-rose-500/30">
                                        <span className="text-[10px] font-black text-rose-300">RASIO KRITIS</span>
                                        <span className="text-lg font-black text-rose-100">
                                            {silpaData.totals.totalAnggaran > 0 
                                                ? ((silpaData.totals.potensiSiLPA / silpaData.totals.totalAnggaran) * 100).toFixed(2) 
                                                : 0}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Card 3 */}
                            <div className="relative overflow-hidden bg-white/5 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/10 transition-all duration-500 hover:translate-y-[-8px] hover:bg-white/[0.08] group/card">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/card:opacity-30 transition-opacity">
                                    <Calendar size={80} />
                                </div>
                                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-6">Analisis Per-Bulan</p>
                                <div className="flex flex-col gap-1">
                                    <p className="text-3xl font-black text-white tracking-tighter">Bulan Ke-{silpaData.monthsPassed || 0}</p>
                                    <div className="flex items-center justify-between mt-3 px-4 py-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
                                        <span className="text-[10px] font-black text-emerald-300 uppercase">Sisa Periode</span>
                                        <span className="text-lg font-black text-emerald-100">{silpaData.monthsRemaining || 0} BULAN</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 flex flex-col md:flex-row md:items-center gap-6 text-sm bg-white/5 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/10 group-hover:border-indigo-500/30 transition-colors">
                            <div className="p-4 bg-indigo-500/20 rounded-2xl flex-shrink-0">
                                <Info size={32} className="text-indigo-300" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-black text-white uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
                                    Quick Summary Assessment
                                    <div className="h-1 w-1 bg-indigo-500 rounded-full animate-ping"></div>
                                </p>
                                <p className="text-slate-400 font-medium text-base leading-relaxed">
                                    Berdasarkan tren realisasi hingga bulan <span className="text-white font-black underline decoration-indigo-500">{projectionMonth}</span>, 
                                    estimasi sisa anggaran (SiLPA) diprediksi mencapai <span className="text-indigo-400 font-black">{((silpaData.totals.potensiSiLPA / silpaData.totals.totalAnggaran) * 100).toFixed(2)}%</span>. 
                                    Diperlukan evaluasi mendalam pada SKPD dengan tingkat penyerapan di bawah ambang batas linier.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!showExecutiveInfo && (
                <button 
                    onClick={() => setShowExecutiveInfo(true)}
                    className="mb-10 px-10 py-5 bg-gradient-to-r from-slate-800 to-black text-white rounded-[2rem] font-black text-sm flex items-center gap-4 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] hover:shadow-[0_25px_50px_-10px_rgba(0,0,0,0.4)] transition-all active:scale-95 group"
                >
                    <div className="p-2 bg-indigo-500 rounded-xl group-hover:scale-110 transition-transform">
                        <Eye size={20} />
                    </div>
                    TAMPILKAN DASHBOARD EKSEKUTIF
                </button>
            )}

            <GeminiAnalysis 
                getAnalysisPrompt={getAnalysisPrompt}
                disabledCondition={!silpaData.tableData || silpaData.tableData.length === 0}
                theme={theme}
                selectedYear={selectedYear}
                userRole={userRole}
            />
            
            <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-3xl rounded-[3.5rem] shadow-[0_60px_100px_-30px_rgba(0,0,0,0.1)] border border-white/50 dark:border-white/5 overflow-hidden transition-all duration-700 hover:shadow-[0_80px_120px_-30px_rgba(0,0,0,0.15)]">
                {/* Controls & Summary */}
                <div className="p-10 bg-gradient-to-r from-white/30 to-transparent dark:from-white/5 border-b border-gray-100 dark:border-white/5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.4em]">Integrated Intelligence</p>
                            <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter leading-none flex items-center gap-4">
                                Strategic Analysis Panel
                                <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10B981]"></div>
                            </h3>
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`p-4 rounded-2xl transition-all duration-500 border ${
                                showFilters 
                                ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/30' 
                                : 'bg-white/50 dark:bg-gray-800/50 text-gray-500 border-gray-100 dark:border-gray-700 hover:bg-white'
                            }`}
                        >
                            <Filter size={24} className={showFilters ? 'animate-pulse' : ''} />
                        </button>
                    </div>

                    {showFilters && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-top-4 duration-700">
                            {[
                                { label: 'Proyeksi Bulan', icon: Calendar, value: projectionMonth, onChange: setProjectionMonth, options: months, color: 'indigo' },
                                { label: 'Tingkat Risiko', icon: AlertTriangle, value: riskLevel, onChange: setRiskLevel, options: [
                                    {v:'semua', l:'Semua SKPD'}, {v:'kritis', l:'Kritis (> 20%)'}, {v:'waspada', l:'Waspada (10-20%)'}, {v:'aman', l:'Aman (< 10%)'}
                                ], color: 'rose' },
                                { label: 'Limit Tampilan', icon: Layers, value: itemsPerPage, onChange: (v) => {setItemsPerPage(Number(v)); setCurrentPage(1);}, options: [
                                    {v:5, l:'5 Per Halaman'}, {v:10, l:'10 Per Halaman'}, {v:20, l:'20 Per Halaman'}, {v:50, l:'50 Per Halaman'}
                                ], color: 'purple' }
                            ].map((filter, i) => (
                                <div key={i} className="space-y-2 group">
                                    <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                                        <filter.icon size={14} className={`text-${filter.color}-500 transition-transform group-hover:scale-110`} /> {filter.label}
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={filter.value}
                                            onChange={(e) => filter.onChange(e.target.value)}
                                            className="w-full px-5 py-4 bg-white/60 dark:bg-gray-950/60 backdrop-blur-xl border border-gray-100 dark:border-gray-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer font-bold text-sm"
                                        >
                                            {filter.options.map(opt => (
                                                <option key={typeof opt === 'string' ? opt : opt.v} value={typeof opt === 'string' ? opt : opt.v}>
                                                    {typeof opt === 'string' ? opt : opt.l}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-30">
                                            <ChevronRight size={16} className="rotate-90" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            <div className="space-y-2 group">
                                <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                                    <Search size={14} className="text-teal-500 transition-transform group-hover:scale-110" /> Cari SKPD/OPD
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Ketik identitas SKPD..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-14 pr-5 py-4 bg-white/60 dark:bg-gray-950/60 backdrop-blur-xl border border-gray-100 dark:border-gray-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-bold text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Data Visual - APACHE ECHARTS STYLE */}
                {silpaData.chartData && silpaData.chartData.length > 0 ? (
                    <div className="p-10">
                        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
                            <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                                <BarChart3 className="w-6 h-6 text-indigo-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                                    Visualisasi Penumpukan Anggaran (Top 10)
                                </h3>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Estimasi SiLPA dibandingkan Pagu Total</p>
                            </div>
                        </div>
                        
                        <div className="bg-white/40 dark:bg-gray-950/40 backdrop-blur-3xl rounded-[2.5rem] p-10 border border-white/50 dark:border-white/5 shadow-inner">
                            <div className="h-[550px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart 
                                        data={silpaData.chartData} 
                                        margin={{ top: 20, right: 30, left: 40, bottom: 100 }}
                                        barGap={12}
                                    >
                                        <defs>
                                            <linearGradient id="barAnggaran" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.85}/>
                                                <stop offset="100%" stopColor="#818CF8" stopOpacity={0.4}/>
                                            </linearGradient>
                                            <linearGradient id="barSilpa" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#F43F5E" stopOpacity={0.95}/>
                                                <stop offset="100%" stopColor="#FB7185" stopOpacity={0.5}/>
                                            </linearGradient>
                                            <filter id="shadow">
                                                <feDropShadow dx="0" dy="8" stdDeviation="12" floodOpacity="0.2"/>
                                            </filter>
                                        </defs>
                                        <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="rgba(148, 163, 184, 0.08)" />
                                        <XAxis 
                                            dataKey="skpd" 
                                            angle={-35} 
                                            textAnchor="end" 
                                            interval={0} 
                                            height={120} 
                                            tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b', letterSpacing: '-0.2px' }}
                                            axisLine={{ stroke: 'rgba(148, 163, 184, 0.1)', strokeWidth: 2 }}
                                            tickLine={false}
                                        />
                                        <YAxis 
                                            tickFormatter={(val) => `${(val / 1e9).toFixed(1)}M`} 
                                            tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip 
                                            content={<CustomTooltip />} 
                                            cursor={{ fill: 'rgba(79, 70, 229, 0.03)' }}
                                        />
                                        <Legend 
                                            verticalAlign="top" 
                                            align="right"
                                            height={60}
                                            iconType="rect"
                                            iconSize={14}
                                            wrapperStyle={{ paddingTop: '0px', paddingBottom: '30px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}
                                        />
                                        <Bar 
                                            dataKey="totalAnggaran" 
                                            fill="url(#barAnggaran)" 
                                            name="Pagu Total" 
                                            radius={[12, 12, 4, 4]} 
                                            barSize={40}
                                            filter="url(#shadow)"
                                        />
                                        <Bar 
                                            dataKey="potensiSiLPA" 
                                            fill="url(#barSilpa)" 
                                            name="Potensi SiLPA" 
                                            radius={[12, 12, 4, 4]} 
                                            barSize={40}
                                            filter="url(#shadow)"
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="py-32 flex flex-col items-center justify-center opacity-40">
                         <div className="p-8 bg-gray-100 dark:bg-gray-800 rounded-full mb-6">
                            <Search size={64} className="text-gray-400" />
                         </div>
                         <p className="font-black text-xl tracking-tighter uppercase text-gray-500">Query Tidak Menemukan Hasil</p>
                         <p className="text-sm font-bold text-gray-400 mt-2">Coba sesuaikan parameter filter pencarian anda.</p>
                    </div>
                )}

                {/* Detailed Table - MODERN LIST STYLE */}
                <div className="p-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                        <div className="flex items-center gap-5">
                            <div className="w-2.5 h-10 bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.4)]"></div>
                            <div>
                                <h3 className="font-black text-2xl text-gray-900 dark:text-white tracking-tighter">
                                    Matriks Rincian Estimasi
                                </h3>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Dataset SKPD Terpilih ({silpaData.tableData.length})</p>
                            </div>
                        </div>
                        <button
                            onClick={handleDownloadExcel}
                            disabled={silpaData.tableData.length === 0}
                            className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-[0_15px_30px_-10px_rgba(16,185,129,0.5)] transition-all disabled:opacity-20 active:scale-95"
                        >
                            <Download size={18} /> EKSPOR (.XLSX)
                        </button>
                    </div>

                    <div className="overflow-hidden rounded-[2.5rem] border border-gray-100 dark:border-white/5 bg-white/30 dark:bg-gray-950/30 backdrop-blur-2xl shadow-2xl">
                        <div className="overflow-x-auto">
                            <table className="min-w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-900/5 dark:bg-white/5 text-left border-b border-gray-100 dark:border-white/5">
                                        <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Identitas SKPD</th>
                                        <th className="px-10 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Pagu PPA</th>
                                        <th className="px-10 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Estimasi SiLPA</th>
                                        <th className="px-10 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Rasio</th>
                                        <th className="px-10 py-6 text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Risk Assessment</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                    {paginatedData.length > 0 ? paginatedData.map((item, idx) => (
                                        <tr key={item.skpd} className="hover:bg-indigo-500/[0.04] transition-all group duration-300">
                                            <td className="px-10 py-7">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-gray-900 dark:text-white leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                        {item.skpd}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">Verified Official Source</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-7 text-right">
                                                <span className="text-sm font-bold text-gray-900 dark:text-slate-300 tabular-nums tracking-tighter">
                                                    {formatCurrency(item.totalAnggaran)}
                                                </span>
                                            </td>
                                            <td className="px-10 py-7 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 tabular-nums tracking-tighter">
                                                        {formatCurrency(item.potensiSiLPA)}
                                                    </span>
                                                    <div className="w-16 h-1 bg-gray-100 dark:bg-gray-800 rounded-full mt-1.5 overflow-hidden">
                                                        <div 
                                                            className="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
                                                            style={{ width: `${Math.min(100, item.persenSiLPA)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-7 text-right">
                                                <span className="text-base font-black text-gray-900 dark:text-white tabular-nums tracking-tighter">
                                                    {item.persenSiLPA.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="px-10 py-7 text-center">
                                                <span className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-black tracking-[0.2em] uppercase border shadow-sm transition-all group-hover:scale-105 ${
                                                    item.riskCategory === 'kritis' 
                                                        ? 'bg-rose-500 text-white border-rose-600 shadow-rose-500/20' 
                                                        : item.riskCategory === 'waspada' 
                                                            ? 'bg-amber-400 text-amber-950 border-amber-500 shadow-amber-500/20' 
                                                            : 'bg-emerald-500 text-white border-emerald-600 shadow-emerald-500/20'
                                                }`}>
                                                    {item.riskCategory === 'kritis' && <AlertCircle size={14} className="animate-pulse" />}
                                                    {item.riskCategory === 'waspada' && <AlertTriangle size={14} />}
                                                    {item.riskCategory === 'aman' && <CheckCircle2 size={14} />}
                                                    {item.riskCategory}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : null}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <Pagination 
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />

                    {/* Meta Stats Panel */}
                    {silpaData.tableData.length > 0 && (
                        <div className="mt-12 p-8 bg-gradient-to-r from-indigo-900 to-slate-900 rounded-[2.5rem] border border-white/10 shadow-2xl">
                            <div className="flex flex-wrap items-center justify-between gap-8">
                                <div className="flex flex-wrap items-center gap-10">
                                    {[
                                        { label: 'Total Database', value: silpaData.tableData.length, color: 'indigo' },
                                        { label: 'Indikasi Kritis', value: silpaData.tableData.filter(d => d.riskCategory === 'kritis').length, color: 'rose' },
                                        { label: 'Status Waspada', value: silpaData.tableData.filter(d => d.riskCategory === 'waspada').length, color: 'amber' },
                                        { label: 'Status Aman', value: silpaData.tableData.filter(d => d.riskCategory === 'aman').length, color: 'emerald' }
                                    ].map((stat, i) => (
                                        <div key={i} className="flex flex-col gap-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.label}</p>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2.5 h-2.5 rounded-full bg-${stat.color}-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]`}></div>
                                                <p className="text-2xl font-black text-white leading-none tracking-tighter">{stat.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-2xl border border-white/10">
                                     <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                                         <Zap size={16} className="text-indigo-400 animate-pulse" />
                                     </div>
                                     <p className="text-[10px] font-black text-indigo-200 tracking-[0.1em]">DATA UPDATED: REALTIME PROJECTED</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <style>{`
                @keyframes progress-slow {
                    0% { width: 0%; opacity: 0.5; }
                    50% { width: 100%; opacity: 1; }
                    100% { width: 100%; opacity: 1; }
                }
                .animate-progress-slow {
                    animation: progress-slow 3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .shadow-3xl {
                    box-shadow: 0 50px 100px -20px rgba(0, 0, 0, 0.25);
                }
            `}</style>
        </div>
    );
};

export default AnalisisPotensiSiLPAView;