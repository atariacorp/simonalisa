import React from 'react';
import { 
  ChevronDown, ChevronUp, Search, Download, TrendingUp, TrendingDown, 
  Target, DollarSign, Info, AlertTriangle, CheckCircle, Eye, EyeOff, 
  Filter, BarChart3, PieChart, Layers, FileText, HelpCircle,
  Sparkles, Calendar, Box, ArrowRight, LayoutDashboard, ChevronLeft, 
  MoreHorizontal, Building2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, ComposedChart, Line, Cell 
} from 'recharts';

// === IMPORT yang benar dari aplikasi yang sudah ada ===
import { db, appId } from '../../utils/firebase';
import { formatIDR } from '../../utils';
import { auth } from '../../utils/firebase'; // Import auth instance

// HAPUS inisialisasi Firebase manual
// HAPUS fungsi formatCurrency (gunakan formatIDR dari utils)

// SectionTitle Component
const SectionTitle = ({ children }) => (
  <div className="relative mb-10 group">
    <h2 className="text-3xl font-black tracking-tighter text-slate-800 dark:text-white transition-all">
      {children}
    </h2>
    <div className="absolute -bottom-3 left-0 h-1.5 w-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all duration-500 group-hover:w-32"></div>
  </div>
);

// GeminiAnalysis Component
const GeminiAnalysis = ({ getAnalysisPrompt, disabledCondition, theme, interactivePlaceholder, userCanUseAi }) => {
  const [isThinking, setIsThinking] = React.useState(false);
  const [response, setResponse] = React.useState(null);

  const handleAnalyze = () => {
    setIsThinking(true);
    setTimeout(() => {
      setResponse("Analisis mendalam mendeteksi konsentrasi sisa anggaran pada rekening belanja barang dan jasa di tiga SKPD utama. Disarankan untuk meninjau jadwal pengadaan agar penyerapan dapat dioptimalkan sebelum penutupan tahun anggaran.");
      setIsThinking(false);
    }, 2000);
  };

  if (!userCanUseAi) return null;

  return (
    <div className="relative overflow-hidden bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-indigo-200/50 dark:border-indigo-900/30 rounded-[2.5rem] p-8 shadow-2xl shadow-indigo-500/10 mb-10 transition-all duration-500 group">
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl transition-transform group-hover:scale-110"></div>
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6 text-left">
        <div className="p-4 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl text-white shadow-lg shadow-indigo-500/40">
          <Sparkles size={28} />
        </div>
        <div className="flex-1 space-y-1">
          <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter">AI Fiscal Insights</h3>
          <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">Analisis Rekening Berbasis Kecerdasan Buatan</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={handleAnalyze}
            disabled={disabledCondition || isThinking}
            className="w-full md:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm transition-all shadow-xl shadow-indigo-500/30 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
          >
            {isThinking ? <Loader className="animate-spin" size={18} /> : <MessageSquare size={18} />}
            {isThinking ? "Menganalisis..." : "Generate Analisis"}
          </button>
        </div>
      </div>
      {response && (
        <div className="mt-6 p-6 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-3xl border border-indigo-100 dark:border-indigo-800/50 animate-in fade-in slide-in-from-top-4 text-left font-medium text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed">
          "{response}"
        </div>
      )}
    </div>
  );
};

// Pagination Component
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visiblePages = pages.filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1);

  return (
    <div className="flex items-center justify-center gap-2">
      <button 
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
      >
        <ChevronLeft size={18} />
      </button>
      {visiblePages.map((page, i) => (
        <React.Fragment key={page}>
          {i > 0 && visiblePages[i - 1] !== page - 1 && <MoreHorizontal className="text-slate-400 mx-1" size={16} />}
          <button
            onClick={() => onPageChange(page)}
            className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${
              currentPage === page 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 scale-110 z-10' 
                : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 hover:border-indigo-500'
            }`}
          >
            {page}
          </button>
        </React.Fragment>
      ))}
      <button 
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
};

// Custom Tooltip Modern
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl p-5 rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-white/20 dark:border-slate-700/50 min-w-[280px] z-50 animate-in fade-in zoom-in-95 duration-200 text-left">
        <div className="flex items-center gap-2 mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
          <Box size={16} className="text-indigo-500" />
          <p className="font-black text-slate-800 dark:text-slate-100 text-[11px] uppercase tracking-tighter truncate max-w-[220px]">
            {label}
          </p>
        </div>
        <div className="space-y-2.5">
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex justify-between items-center text-[11px]">
              <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <div className="w-1.5 h-1.5 rounded-full shadow-sm" style={{ backgroundColor: entry.color }}></div>
                {entry.name}
              </span>
              <span className="font-black text-slate-900 dark:text-white tabular-nums">
                {entry.name?.toLowerCase().includes('persen') || entry.name?.toLowerCase().includes('penyerapan')
                  ? `${Number(entry.value).toFixed(1)}%`
                  : formatIDR(entry.value * (entry.unit === 'M' ? 1e9 : 1))}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// --- MAIN COMPONENT ---
const SkpdSubKegiatanStatsView = ({ data, theme, namaPemda, userCanUseAi, selectedYear }) => {
    const { anggaran, realisasi, realisasiNonRkud } = data;
    const [selectedSkpd, setSelectedSkpd] = React.useState('Semua SKPD');
    const [rekeningStats, setRekeningStats] = React.useState([]);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [sortOrder, setSortOrder] = React.useState('sisa-desc');
    const [currentPage, setCurrentPage] = React.useState(1);
    const [chartType, setChartType] = React.useState('bar'); 
    const [viewMode, setViewMode] = React.useState('card'); 
    const [showFilters, setShowFilters] = React.useState(true);
    const [showInfo, setShowInfo] = React.useState(true); 
    
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const [startMonth, setStartMonth] = React.useState(months[0]);
    const [endMonth, setEndMonth] = React.useState(months[months.length - 1]);
    const ITEMS_PER_PAGE = 10;
    
    const [expandedRekening, setExpandedRekening] = React.useState(null);

    const skpdList = React.useMemo(() => {
        const skpds = new Set((anggaran || []).map(item => item.NamaSKPD).filter(Boolean));
        return Array.from(skpds).sort();
    }, [anggaran]);

    React.useEffect(() => {
        if (!anggaran) {
            setRekeningStats([]);
            return;
        }

        const normalizeRealisasiItem = (item, isNonRkud = false) => {
            if (!item) return null;
            return {
                NamaSKPD: isNonRkud ? item.NAMASKPD : item.NamaSKPD,
                KodeRekening: isNonRkud ? item.KODEREKENING : item.KodeRekening,
                NamaRekening: isNonRkud ? item.NAMAREKENING : item.NamaRekening,
                nilai: item.nilai || 0
            };
        };

        const combinedRealisasi = {};
        for (const month in realisasi) { combinedRealisasi[month] = (realisasi[month] || []).map(item => normalizeRealisasiItem(item, false)); }
        for (const month in realisasiNonRkud) {
            if (!combinedRealisasi[month]) combinedRealisasi[month] = [];
            combinedRealisasi[month].push(...(realisasiNonRkud[month] || []).map(item => normalizeRealisasiItem(item, true)));
        }

        const filteredAnggaran = selectedSkpd === 'Semua SKPD' 
            ? anggaran 
            : anggaran.filter(item => item.NamaSKPD === selectedSkpd);

        const dataMap = new Map();
        
        filteredAnggaran.forEach(item => {
            const key = item.NamaRekening || 'Tanpa Nama Rekening';
            if (!dataMap.has(key)) {
                dataMap.set(key, {
                    kodeRekening: item.KodeRekening,
                    rekening: key,
                    totalAnggaran: 0,
                    totalRealisasi: 0,
                    skpdDetails: new Map(),
                    sumberDanaSet: new Set(),
                });
            }
            const data = dataMap.get(key);
            data.totalAnggaran += item.nilai || 0;
            if (item.NamaSumberDana) data.sumberDanaSet.add(item.NamaSumberDana);

            const skpdKey = item.NamaSKPD || 'Tanpa SKPD';
            if (!data.skpdDetails.has(skpdKey)) {
                data.skpdDetails.set(skpdKey, { anggaran: 0, realisasi: 0 });
            }
            data.skpdDetails.get(skpdKey).anggaran += item.nilai || 0;
        });

        const startIndex = months.indexOf(startMonth);
        const endIndex = months.indexOf(endMonth);
        const selectedMonths = months.slice(startIndex, endIndex + 1);
        const realisasiBulanIni = selectedMonths.map(month => combinedRealisasi[month] || []).flat();
        
        const filteredRealisasi = selectedSkpd === 'Semua SKPD' ? realisasiBulanIni : realisasiBulanIni.filter(item => item.NamaSKPD === selectedSkpd);
        
        filteredRealisasi.forEach(item => {
            const key = item.NamaRekening || 'Tanpa Nama Rekening';
            if (!dataMap.has(key)) {
                 const correspondingAnggaranItem = (anggaran || []).find(a => a.NamaRekening === key);
                 dataMap.set(key, {
                    kodeRekening: correspondingAnggaranItem ? correspondingAnggaranItem.KodeRekening : (item.KodeRekening || 'N/A'),
                    rekening: key, totalAnggaran: 0, totalRealisasi: 0,
                    skpdDetails: new Map(),
                    sumberDanaSet: new Set(),
                });
            }
            const data = dataMap.get(key);
            data.totalRealisasi += item.nilai || 0;
            
            const skpdKey = item.NamaSKPD || 'Tanpa SKPD';
            if (!data.skpdDetails.has(skpdKey)) {
                data.skpdDetails.set(skpdKey, { anggaran: 0, realisasi: 0 });
            }
            data.skpdDetails.get(skpdKey).realisasi += item.nilai || 0;
        });

        const stats = Array.from(dataMap.values()).map(item => {
            const persentase = item.totalAnggaran > 0 ? (item.totalRealisasi / item.totalAnggaran) * 100 : 0;
            const sisaAnggaran = item.totalAnggaran - item.totalRealisasi;
            
            const skpdDetailsArray = Array.from(item.skpdDetails.entries()).map(([skpd, values]) => ({
                skpd,
                anggaran: values.anggaran,
                realisasi: values.realisasi,
                sisa: values.anggaran - values.realisasi,
                persen: values.anggaran > 0 ? (values.realisasi / values.anggaran) * 100 : 0
            })).sort((a,b) => b.anggaran - a.anggaran);

            return { 
                ...item, persentase, sisaAnggaran,
                skpdList: skpdDetailsArray,
                sumberDanaList: Array.from(item.sumberDanaSet),
                performanceCategory: persentase >= 80 ? 'high' : persentase >= 50 ? 'medium' : 'low'
            };
        });

        setRekeningStats(stats);
    }, [selectedSkpd, anggaran, realisasi, realisasiNonRkud, startMonth, endMonth]);
    
    const summaryStats = React.useMemo(() => {
        const totalAnggaran = rekeningStats.reduce((sum, item) => sum + item.totalAnggaran, 0);
        const totalRealisasi = rekeningStats.reduce((sum, item) => sum + item.totalRealisasi, 0);
        const totalSisa = totalAnggaran - totalRealisasi;
        const rataPenyerapan = totalAnggaran > 0 ? (totalRealisasi / totalAnggaran) * 100 : 0;
        
        return {
            totalAnggaran,
            totalRealisasi,
            totalSisa,
            rataPenyerapan,
            highPerformer: rekeningStats.filter(item => item.persentase >= 80).length,
            mediumPerformer: rekeningStats.filter(item => item.persentase >= 50 && item.persentase < 80).length,
            lowPerformer: rekeningStats.filter(item => item.persentase < 50).length,
            totalItems: rekeningStats.length
        };
    }, [rekeningStats]);
    
    const sortedAndFilteredData = React.useMemo(() => {
        const filtered = rekeningStats.filter(item => 
            item.rekening.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.kodeRekening && String(item.kodeRekening).toLowerCase().includes(searchTerm.toLowerCase()))
        );

        const [key, direction] = sortOrder.split('-');
        
        return filtered.sort((a, b) => {
            let valA, valB;
            switch(key) {
                case 'realisasi': valA = a.totalRealisasi; valB = b.totalRealisasi; break;
                case 'anggaran': valA = a.totalAnggaran; valB = b.totalAnggaran; break;
                case 'persentase': valA = a.persentase; valB = b.persentase; break;
                case 'sisa': valA = a.sisaAnggaran; valB = b.sisaAnggaran; break;
                case 'nama':
                    valA = a.rekening; valB = b.rekening;
                    return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                default: return 0;
            }
            return direction === 'asc' ? valA - valB : valB - valA;
        });
    }, [rekeningStats, searchTerm, sortOrder]);

    const chartData = React.useMemo(() => {
        return sortedAndFilteredData.slice(0, 15).map(item => ({
            name: item.rekening.length > 25 ? item.rekening.substring(0, 25) + '...' : item.rekening,
            fullName: item.rekening,
            Anggaran: item.totalAnggaran / 1e9, 
            Realisasi: item.totalRealisasi / 1e9,
            Persentase: item.persentase,
            Sisa: item.sisaAnggaran / 1e9,
            unit: 'M'
        }));
    }, [sortedAndFilteredData]);

    const totalPages = Math.ceil(sortedAndFilteredData.length / ITEMS_PER_PAGE);
    const paginatedData = sortedAndFilteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    
    const handlePageChange = (page) => {
        if (page > 0 && page <= totalPages) setCurrentPage(page);
    };
    
    React.useEffect(() => {
        setCurrentPage(1);
        setExpandedRekening(null);
    }, [searchTerm, selectedSkpd, startMonth, endMonth, sortOrder]);
    
    const handleDownloadExcel = () => {
        if (!sortedAndFilteredData || sortedAndFilteredData.length === 0) return;
        if (!window.XLSX) return;

        try {
            const dataForExport = sortedAndFilteredData.map(item => ({
                'Kode Rekening': item.kodeRekening,
                'Nama Rekening': item.rekening,
                'Anggaran (Rp)': item.totalAnggaran,
                'Realisasi (Rp)': item.totalRealisasi,
                'Sisa Anggaran (Rp)': item.sisaAnggaran,
                'Penyerapan (%)': item.persentase.toFixed(2),
                'Kategori Kinerja': item.performanceCategory === 'high' ? 'Tinggi' : item.performanceCategory === 'medium' ? 'Sedang' : 'Rendah',
                'Jumlah SKPD': item.skpdList.length,
                'Jumlah Sumber Dana': item.sumberDanaList.length
            }));
            const worksheet = window.XLSX.utils.json_to_sheet(dataForExport);
            const workbook = window.XLSX.utils.book_new();
            window.XLSX.utils.book_append_sheet(workbook, worksheet, "Statistik Rekening");
            window.XLSX.writeFile(workbook, `Statistik_Rekening_${selectedSkpd.replace(/ /g, "_")}_${selectedYear}.xlsx`);
        } catch (err) { console.error(err); }
    };

    const getAnalysisPrompt = (customQuery) => {
        if (customQuery) return `Analisis data rekening SKPD untuk: "${customQuery}"`;
        const focus = selectedSkpd === 'Semua SKPD' ? 'keseluruhan APBD' : `SKPD: **${selectedSkpd}**`;
        return `Audit realisasi anggaran per rekening untuk **${focus}** pada tahun ${selectedYear}. Total Anggaran: ${formatIDR(summaryStats.totalAnggaran)}.`;
    };

    const toggleRincian = (rekening) => {
        setExpandedRekening(prev => (prev === rekening ? null : rekening));
    };

    const getPerformanceBadge = (persentase) => {
        if (persentase >= 80) return <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 flex items-center gap-1"><CheckCircle size={10} /> Tinggi</span>;
        if (persentase >= 50) return <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-500/20 flex items-center gap-1"><Info size={10} /> Sedang</span>;
        return <span className="px-2.5 py-0.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-500/20 flex items-center gap-1"><AlertTriangle size={10} /> Rendah</span>;
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-1000 pb-20 text-left">
            <SectionTitle>Statistik Rekening Anggaran</SectionTitle>
            
            {/* EXECUTIVE INFO PANEL - GLASSMORPHISM */}
            {showInfo && (
                <div className="relative overflow-hidden rounded-[2.5rem] bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-amber-200/50 dark:border-amber-900/30 shadow-2xl mb-10 transition-all duration-500 group">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-amber-400/10 to-yellow-400/10 rounded-full blur-[80px] -mr-32 -mt-32 transition-transform duration-1000 group-hover:scale-110"></div>
                    
                    <div className="relative p-10 flex flex-col md:flex-row gap-10">
                        <div className="p-5 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-[2rem] shadow-xl shadow-amber-500/30 shrink-0 h-fit self-start">
                            <FileText className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1 space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter leading-none">Informasi Eksekutif: Audit Rekening</h3>
                                <button onClick={() => setShowInfo(false)} className="p-2 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-xl transition-all"><EyeOff size={20} className="text-slate-400"/></button>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium max-w-4xl">
                                Panel ini menyajikan visibilitas total terhadap sirkulasi anggaran pada tingkat rekening belanja. Pimpinan dapat melakukan 
                                <span className="text-amber-600 font-bold mx-1 italic">deep-dive analysis</span> untuk mendeteksi inefisiensi, 
                                mengidentifikasi saldo mengendap pada rekening pasif, serta meninjau sumber daya lintas SKPD.
                            </p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    { icon: Target, title: "Fokus Monitoring", list: ["Realisasi vs Pagu", "Saldo Mengendap", "Distribusi Unit"] },
                                    { icon: TrendingUp, title: "Threshold Kinerja", list: ["🟢 Efektif (≥80%)", "🟡 Pantauan (50-79%)", "🔴 Kritis (<50%)"] },
                                    { icon: Sparkles, title: "Alat Bantu", list: ["AI Financial Audit", "E-Chart Analytics", "Eksport Berkas"] }
                                ].map((item, i) => (
                                    <div key={i} className="bg-white/40 dark:bg-slate-800/40 p-5 rounded-2xl border border-white/40 dark:border-slate-700/50">
                                        <div className="flex items-center gap-2 mb-3">
                                            <item.icon className="w-4 h-4 text-amber-600" />
                                            <span className="font-black text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-200">{item.title}</span>
                                        </div>
                                        <ul className="space-y-1.5">
                                            {item.list.map((l, j) => <li key={j} className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><ChevronRight size={10} className="text-amber-500"/> {l}</li>)}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* QUICK STATS - EXECUTIVE PERFORMANCE PANEL */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-700 to-indigo-900 rounded-[3rem] p-10 text-white shadow-2xl border border-white/10 group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -mr-40 -mt-40"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-400/10 rounded-full blur-[80px] -ml-32 -mb-32"></div>
                
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-10 items-center">
                    <div className="lg:col-span-1 space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black tracking-[0.2em] uppercase border border-white/10">
                            <LayoutDashboard size={14} className="text-indigo-200" /> Fiscal Dashboard
                        </div>
                        <h2 className="text-5xl font-black leading-[0.95] tracking-tighter">
                            Akurasi Penyerapan <br/>
                            <span className="text-indigo-200 italic underline decoration-indigo-400 decoration-4 underline-offset-8">Per Rekening</span>.
                        </h2>
                    </div>

                    <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: "Total Anggaran", val: formatIDR(summaryStats.totalAnggaran), color: "text-indigo-200" },
                            { label: "Total Realisasi", val: formatIDR(summaryStats.totalRealisasi), color: "text-emerald-300" },
                            { label: "Sisa Anggaran", val: formatIDR(summaryStats.totalSisa), color: "text-amber-300" },
                            { label: "Efektivitas", val: `${summaryStats.rataPenyerapan.toFixed(1)}%`, color: "text-purple-200" }
                        ].map((s, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-xl p-5 rounded-[2rem] border border-white/20 shadow-xl transition-all hover:bg-white/20 cursor-default">
                                <p className="text-[9px] font-black uppercase text-indigo-100 mb-2 tracking-widest opacity-60">{s.label}</p>
                                <div className={`text-lg font-black truncate ${s.color}`}>{s.val}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {!showInfo && (
                <button onClick={() => setShowInfo(true)} className="flex items-center gap-2 px-5 py-2.5 bg-amber-500/10 text-amber-600 rounded-2xl hover:bg-amber-500/20 transition-all text-[11px] font-black uppercase tracking-widest border border-amber-500/20">
                    <FileText size={14} /> Tampilkan Executive Insights
                </button>
            )}

            <GeminiAnalysis 
                getAnalysisPrompt={getAnalysisPrompt} 
                disabledCondition={rekeningStats.length === 0} 
                theme={theme} 
                interactivePlaceholder="Analisis rekening pasif dengan sisa terbesar..." 
                userCanUseAi={userCanUseAi} 
            />

            {/* STICKY GLASS FILTER BAR */}
            <div className="sticky top-6 z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-white/40 dark:border-slate-800/50 p-6 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none transition-all duration-500">
                <div className="flex flex-wrap items-center justify-between gap-6">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        <div className="space-y-1.5 text-left">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Fokus SKPD</label>
                            <div className="relative group">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 transition-transform group-hover:scale-110" size={18} />
                                <select value={selectedSkpd} onChange={(e) => setSelectedSkpd(e.target.value)} className="w-full pl-12 pr-6 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-black shadow-sm focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all cursor-pointer">
                                    <option value="Semua SKPD">🏢 Seluruh SKPD</option>
                                    {skpdList.map(skpd => <option key={skpd} value={skpd}>{skpd}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5 text-left">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Pencarian Cepat</label>
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                <input type="text" placeholder="Nama/Kode Rekening..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-6 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold shadow-sm focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all" />
                            </div>
                        </div>

                        <div className="space-y-1.5 text-left">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Sorting Data</label>
                            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="w-full px-5 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-[11px] font-black shadow-sm outline-none transition-all">
                                <option value="sisa-desc">Sisa Tertinggi</option>
                                <option value="realisasi-desc">Realisasi Tertinggi</option>
                                <option value="persentase-desc">Penyerapan Tertinggi</option>
                                <option value="nama-asc">Nama (A-Z)</option>
                            </select>
                        </div>

                        <div className="space-y-1.5 text-left">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Jendela Audit</label>
                            <div className="flex items-center bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-1 shadow-sm">
                                <select value={startMonth} onChange={e => setStartMonth(e.target.value)} className="flex-1 bg-transparent py-2 px-3 text-[10px] font-black outline-none border-none">
                                    {months.map(m => <option key={`s-${m}`} value={m}>{m.substring(0,3)}</option>)}
                                </select>
                                <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-700"></div>
                                <select value={endMonth} onChange={e => setEndMonth(e.target.value)} className="flex-1 bg-transparent py-2 px-3 text-[10px] font-black outline-none border-none text-right">
                                    {months.map(m => <option key={`e-${m}`} value={m}>{m.substring(0,3)}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
                        <button onClick={() => setViewMode('card')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${viewMode === 'card' ? 'bg-white dark:bg-slate-700 shadow-md text-indigo-600' : 'opacity-40 hover:opacity-100'}`}>
                            <LayoutDashboard size={14} /> CARDS
                        </button>
                        <button onClick={() => setViewMode('table')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 shadow-md text-purple-600' : 'opacity-40 hover:opacity-100'}`}>
                            <BarChart3 size={14} /> LIST
                        </button>
                    </div>
                </div>
            </div>

            {/* CHART ANALYTICS - APACHE ECHARTS STYLE */}
            {chartData.length > 0 && (
                <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/30 dark:border-white/5 p-10 rounded-[3rem] shadow-2xl transition-all hover:shadow-indigo-500/5 group">
                    <div className="flex items-center justify-between mb-10 text-left">
                        <div className="space-y-1">
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3 tracking-tighter">
                                <div className="w-2 h-8 bg-indigo-500 rounded-full animate-pulse"></div>
                                Dinamika Rekening Prioritas
                            </h3>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-5">Analisis Komparatif Top 15 Berdasarkan Nilai Pagu</p>
                        </div>
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                            <button onClick={() => setChartType('bar')} className={`p-2 rounded-lg transition-all ${chartType === 'bar' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'opacity-40'}`}><BarChart3 size={16}/></button>
                            <button onClick={() => setChartType('composed')} className={`p-2 rounded-lg transition-all ${chartType === 'composed' ? 'bg-white dark:bg-slate-700 shadow-sm text-purple-600' : 'opacity-40'}`}><PieChart size={16}/></button>
                        </div>
                    </div>

                    <div className="h-[450px] animate-in slide-in-from-bottom-5 duration-1000">
                        <ResponsiveContainer width="100%" height="100%">
                            {chartType === 'bar' ? (
                                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
                                    <defs>
                                        <linearGradient id="anggaranGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#6366F1" stopOpacity={1}/>
                                            <stop offset="100%" stopColor="#435EBE" stopOpacity={1}/>
                                        </linearGradient>
                                        <linearGradient id="realisasiGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#10B981" stopOpacity={1}/>
                                            <stop offset="100%" stopColor="#059669" stopOpacity={1}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128, 128, 128, 0.08)" />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} height={80} tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} axisLine={false} tickLine={false} dy={15} />
                                    <YAxis tickFormatter={(val) => `${val}M`} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{fill: 'rgba(99, 102, 241, 0.03)', radius: 10}} content={<CustomTooltip />} />
                                    <Bar dataKey="Anggaran" fill="url(#anggaranGrad)" radius={[8, 8, 0, 0]} barSize={35} animationDuration={2000} />
                                    <Bar dataKey="Realisasi" fill="url(#realisasiGrad)" radius={[8, 8, 0, 0]} barSize={25} animationDuration={2500} />
                                </BarChart>
                            ) : (
                                <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128, 128, 128, 0.08)" />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} height={80} tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} axisLine={false} tickLine={false} dy={15} />
                                    <YAxis yAxisId="left" tickFormatter={(val) => `${val}M`} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tickFormatter={(val) => `${val}%`} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{fill: 'rgba(99, 102, 241, 0.03)', radius: 10}} content={<CustomTooltip />} />
                                    <Bar yAxisId="left" dataKey="Anggaran" fill="#6366F1" fillOpacity={0.15} radius={[8, 8, 0, 0]} barSize={40} />
                                    <Bar yAxisId="left" dataKey="Sisa" fill="#F59E0B" fillOpacity={0.8} radius={[8, 8, 0, 0]} barSize={30} />
                                    <Line yAxisId="right" type="monotone" dataKey="Persentase" stroke="#EF4444" strokeWidth={4} dot={{ r: 4, fill: '#EF4444', strokeWidth: 2, stroke: '#fff' }} animationDuration={3000} />
                                </ComposedChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* CONTENT LIST / CARDS */}
            <div className="space-y-8">
                {paginatedData.length > 0 ? (
                    viewMode === 'card' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {paginatedData.map((item, idx) => {
                                const isExpanded = expandedRekening === item.rekening;
                                return (
                                    <div key={idx} className={`group bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 ${isExpanded ? 'lg:col-span-2 shadow-indigo-500/10 ring-2 ring-indigo-500/20' : 'shadow-xl'}`}>
                                        <div onClick={() => toggleRincian(item.rekening)} className="p-8 cursor-pointer relative overflow-hidden text-left">
                                            {isExpanded && <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none transition-opacity duration-1000"><Layers size={200} className="text-indigo-500" /></div>}
                                            
                                            <div className="flex flex-col md:flex-row justify-between items-start gap-6 relative z-10">
                                                <div className="flex-1 space-y-3">
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <span className="text-[10px] font-black px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full tracking-widest text-slate-500 font-mono">{item.kodeRekening}</span>
                                                        {getPerformanceBadge(item.persentase)}
                                                    </div>
                                                    <h4 className="text-xl font-black text-slate-800 dark:text-white leading-tight tracking-tighter group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors uppercase">
                                                        {item.rekening}
                                                    </h4>
                                                </div>
                                                <div className="text-right whitespace-nowrap">
                                                    <p className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter leading-none mb-1 tabular-nums italic">{formatIDR(item.totalAnggaran)}</p>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alokasi Pagu</p>
                                                </div>
                                            </div>

                                            <div className="mt-8 space-y-3">
                                                <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.1em]">
                                                    <span className="text-emerald-500 flex items-center gap-1.5"><CheckCircle size={14} /> Terpakai: {formatIDR(item.totalRealisasi)}</span>
                                                    <span className="text-slate-400">Pencapaian: {item.persentase.toFixed(1)}%</span>
                                                </div>
                                                <div className="w-full bg-slate-100 dark:bg-slate-700 h-3 rounded-full overflow-hidden shadow-inner flex border border-slate-200/20">
                                                    <div className={`h-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(16,185,129,0.3)] ${item.persentase >= 80 ? 'bg-emerald-500' : item.persentase >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${Math.min(item.persentase, 100)}%` }} />
                                                </div>
                                                <div className="flex justify-between text-[10px] font-bold text-slate-500 tracking-widest italic pt-2">
                                                    <span className="tabular-nums opacity-60 italic font-medium">Sisa: {formatIDR(item.sisaAnggaran)}</span>
                                                    <span className="flex items-center gap-1 text-indigo-500 font-black tracking-tighter hover:underline decoration-indigo-500/30 underline-offset-4">
                                                        RINCIAN AUDIT 
                                                        <ChevronDown size={14} className={`transition-transform duration-700 ${isExpanded ? 'rotate-180' : ''}`} />
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className="border-t border-slate-100 dark:border-slate-700 bg-white/40 dark:bg-slate-900/20 p-8 space-y-10 animate-in slide-in-from-top-6 duration-700">
                                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                                                    {/* Rincian per SKPD */}
                                                    <div className="space-y-5 text-left font-black">
                                                        <div className="flex items-center gap-3 text-indigo-600">
                                                            <div className="p-2.5 bg-indigo-500/10 rounded-xl shadow-inner"><Layers size={20} /></div>
                                                            <h5 className="text-sm uppercase tracking-widest italic">Distribusi Lintas SKPD</h5>
                                                        </div>
                                                        <div className="overflow-hidden rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
                                                            <table className="min-w-full">
                                                                <thead className="bg-slate-50/80 dark:bg-slate-800/80">
                                                                    <tr>
                                                                        <th className="px-5 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Unit Kerja</th>
                                                                        <th className="px-5 py-4 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Realisasi</th>
                                                                        <th className="px-5 py-4 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">%</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-slate-50/50 dark:divide-slate-800/50">
                                                                    {item.skpdList.map(skpd => (
                                                                        <tr key={skpd.skpd} className="hover:bg-indigo-500/5 transition-colors">
                                                                            <td className="px-5 py-3.5 text-[11px] font-bold text-slate-600 dark:text-slate-400 max-w-[200px] truncate">{skpd.skpd}</td>
                                                                            <td className="px-5 py-3.5 text-right text-[11px] font-black text-indigo-600 dark:text-indigo-400 italic tabular-nums">{formatIDR(skpd.realisasi)}</td>
                                                                            <td className="px-5 py-3.5 text-right font-black">
                                                                                <span className={`text-[10px] tabular-nums ${skpd.persen >= 80 ? 'text-emerald-500' : 'text-amber-500'}`}>{skpd.persen.toFixed(1)}%</span>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>

                                                    {/* Sumber Dana */}
                                                    <div className="space-y-5 text-left font-black">
                                                        <div className="flex items-center gap-3 text-emerald-600">
                                                            <div className="p-2.5 bg-emerald-500/10 rounded-xl shadow-inner"><DollarSign size={20} /></div>
                                                            <h5 className="text-sm uppercase tracking-widest italic">Struktur Pembiayaan</h5>
                                                        </div>
                                                        <div className="grid grid-cols-1 gap-3">
                                                            {item.sumberDanaList.map(sd => (
                                                                <div key={sd} className="flex items-center gap-4 px-6 py-4 bg-white/60 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm transition-all hover:scale-[1.02] hover:border-emerald-500/30">
                                                                    <div className="w-1.5 h-6 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                                                    <span className="text-[11px] font-black text-slate-600 dark:text-slate-300 tracking-tight leading-none uppercase">{sd}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* LIST VIEW - PREMIUM TABLE */
                        <div className="overflow-x-auto rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl bg-white/20 dark:bg-slate-800/20 backdrop-blur-xl text-left animate-in fade-in duration-700">
                            <table className="min-w-full border-separate border-spacing-0">
                                <thead>
                                    <tr className="bg-slate-50/80 dark:bg-slate-900/80">
                                        <th className="px-8 py-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-200/50">ID Rekening</th>
                                        <th className="px-8 py-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-200/50">Deskripsi Rekening Belanja</th>
                                        <th className="px-8 py-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-200/50">Pagu Audit</th>
                                        <th className="px-8 py-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-200/50">Sisa Anggaran</th>
                                        <th className="px-8 py-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-200/50">Audit Serap</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {paginatedData.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-indigo-500/5 transition-colors group cursor-pointer" onClick={() => toggleRincian(item.rekening)}>
                                            <td className="px-8 py-5 text-[10px] font-black text-slate-400 font-mono tracking-widest">{item.kodeRekening}</td>
                                            <td className="px-8 py-5 text-sm font-black text-slate-800 dark:text-white max-w-sm tracking-tighter leading-tight group-hover:text-indigo-600 transition-colors uppercase">{item.rekening}</td>
                                            <td className="px-8 py-5 text-right font-black text-indigo-600 dark:text-indigo-400 tabular-nums italic text-sm">{formatIDR(item.totalAnggaran)}</td>
                                            <td className="px-8 py-5 text-right font-black text-orange-500 tabular-nums italic text-sm">{formatIDR(item.sisaAnggaran)}</td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex flex-col items-end gap-1.5">
                                                    <div className={`px-3 py-1 rounded-xl text-[11px] font-black shadow-sm ${item.persentase >= 80 ? 'bg-emerald-100 text-emerald-700' : item.persentase >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                                                        {item.persentase.toFixed(1)}%
                                                    </div>
                                                    <div className="w-20 bg-slate-100 dark:bg-slate-700 h-1 rounded-full overflow-hidden flex shadow-inner">
                                                        <div className={`h-full ${item.persentase >= 80 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-amber-500'}`} style={{ width: `${Math.min(item.persentase, 100)}%` }} />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                ) : (
                    <div className="py-32 text-center bg-slate-50/50 dark:bg-slate-900/50 rounded-[3rem] border border-slate-200 dark:border-slate-800 animate-pulse">
                        <Info size={40} className="mx-auto text-slate-300 mb-4" />
                        <p className="font-black text-slate-400 uppercase tracking-[0.3em] text-xs italic">Audit rekening sedang dikonfigurasi...</p>
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="pt-10 flex justify-center animate-in slide-in-from-bottom-5 duration-700">
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                    </div>
                )}
            </div>

            {/* FOOTER - DOWNLOAD & LEGEND */}
            <div className="px-8 py-8 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/30 dark:border-white/5 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row justify-between items-center gap-10">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-10 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 italic">
                    <div className="flex items-center gap-2.5 group cursor-default">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/40 group-hover:scale-125 transition-transform duration-300"></div> {summaryStats.totalItems} UNIT REKENING
                    </div>
                    <div className="flex items-center gap-2.5 group cursor-default">
                        <div className="w-3 h-3 rounded-full bg-indigo-600 shadow-lg shadow-indigo-500/40 group-hover:scale-125 transition-transform duration-300"></div> REALISASI {summaryStats.rataPenyerapan.toFixed(1)}%
                    </div>
                    <div className="flex items-center gap-2.5 text-indigo-400 opacity-80 animate-pulse">
                        <Info size={14} /> KLIK BARIS UNTUK RINCIAN AUDIT
                    </div>
                </div>

                <button 
                    onClick={handleDownloadExcel} 
                    disabled={sortedAndFilteredData.length === 0}
                    className="group relative px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <Download size={18} className="relative z-10 group-hover:bounce" />
                    <span className="relative z-10">Download Excel Audit</span>
                    <span className="relative z-10 ml-2 px-2 py-0.5 bg-black/20 rounded-lg">{sortedAndFilteredData.length}</span>
                </button>
            </div>
        </div>
    );
};

export default SkpdSubKegiatanStatsView;
