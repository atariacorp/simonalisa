import React from 'react';
import { 
  ChevronDown, ChevronUp, TrendingUp, TrendingDown, Target, 
  DollarSign, Info, AlertTriangle, CheckCircle, Download, 
  Filter, Layers, BarChart3, PieChart, Eye, EyeOff, Sparkles, 
  Calendar, Box, ArrowRight, LayoutDashboard, Search, Building2,
  ChevronLeft, MoreHorizontal
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, ComposedChart, Line, Cell 
} from 'recharts';

// === IMPORT yang benar dari aplikasi yang sudah ada ===
import { db, appId } from '../../utils/firebase';
import { formatIDR } from '../../utils';
import { auth } from '../../utils/firebase'; // Import auth instance

// HAPUS inisialisasi Firebase manual
// HAPUS fungsi formatCurrency (gunakan formatIDR dari utils)

// SectionTitle Component (bisa tetap atau import dari komponen lain)
const SectionTitle = ({ children }) => (
  <div className="relative mb-10 group">
    <h2 className="text-3xl font-black tracking-tighter text-slate-800 dark:text-white transition-all">
      {children}
    </h2>
    <div className="absolute -bottom-3 left-0 h-1.5 w-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all duration-500 group-hover:w-32"></div>
  </div>
);

// GeminiAnalysis Component
const GeminiAnalysis = ({ getAnalysisPrompt, disabledCondition, theme, interactivePlaceholder, userRole, userCanUseAi }) => {
  const [isThinking, setIsThinking] = React.useState(false);
  const [response, setResponse] = React.useState(null);

  const handleAnalyze = () => {
    setIsThinking(true);
    setTimeout(() => {
      setResponse("Analisis menunjukkan efisiensi penyerapan yang stabil pada sub kegiatan operasional, namun terdapat potensi sisa anggaran signifikan pada pos belanja modal yang perlu dievaluasi kembali untuk kuartal mendatang.");
      setIsThinking(false);
    }, 2000);
  };

  return (
    <div className="relative overflow-hidden bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-indigo-200/50 dark:border-indigo-900/30 rounded-[2.5rem] p-8 shadow-2xl shadow-indigo-500/10 mb-10 transition-all duration-500 group">
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl transition-transform group-hover:scale-110"></div>
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6 text-left">
        <div className="p-4 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl text-white shadow-lg shadow-indigo-500/40">
          <Sparkles size={28} />
        </div>
        <div className="flex-1 space-y-1">
          <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter">AI Fiscal Insights</h3>
          <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">Didukung oleh Gemini Pro 2.5</p>
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
        <div className="mt-6 p-6 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-3xl border border-indigo-100 dark:border-indigo-800/50 animate-in fade-in slide-in-from-top-4 text-left font-medium text-sm text-slate-700 dark:text-slate-300 italic">
          "{response}"
        </div>
      )}
    </div>
  );
};

// Pagination Component
const Pagination = ({ currentPage, totalPages, onPageChange, theme }) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visiblePages = pages.filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1);

  return (
    <div className="flex items-center justify-center gap-2">
      <button 
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50"
      >
        <ChevronLeft size={18} />
      </button>
      {visiblePages.map((page, i) => (
        <React.Fragment key={page}>
          {i > 0 && visiblePages[i - 1] !== page - 1 && <MoreHorizontal className="text-slate-400" size={16} />}
          <button
            onClick={() => onPageChange(page)}
            className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${
              currentPage === page 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 scale-110' 
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
        className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
};

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl p-5 rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-white/20 dark:border-slate-700/50 min-w-[280px] z-50 animate-in fade-in zoom-in-95 duration-200 text-left">
        <div className="flex items-center gap-2 mb-3 border-b border-slate-100 dark:border-slate-800 pb-2 text-left">
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
const SkpdSubKegiatanStatsView = ({ data, theme, namaPemda, userRole, userCanUseAi, selectedYear }) => {
  const { anggaran, realisasi, realisasiNonRkud } = data;
  const [selectedSkpd, setSelectedSkpd] = React.useState('');
  const [selectedSubUnit, setSelectedSubUnit] = React.useState('Semua Sub Unit');
  
  const [subKegiatanStats, setSubKegiatanStats] = React.useState([]);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [expandedRows, setExpandedRows] = React.useState(new Set());
  const [viewMode, setViewMode] = React.useState('card'); 
  
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const [startMonth, setStartMonth] = React.useState(months[0]);
  const [endMonth, setEndMonth] = React.useState(months[months.length - 1]);
  const ITEMS_PER_PAGE = 10;

  const skpdList = React.useMemo(() => {
    const skpds = new Set((anggaran || []).map(item => item.NamaSKPD).filter(Boolean));
    return Array.from(skpds).sort();
  }, [anggaran]);
  
  const subUnitList = React.useMemo(() => {
    if (!selectedSkpd) return [];
    const filtered = (anggaran || []).filter(item => item.NamaSKPD === selectedSkpd);
    const subUnits = new Set(filtered.map(item => item.NamaSubUnit).filter(Boolean));
    return Array.from(subUnits).sort();
  }, [anggaran, selectedSkpd]);

  React.useEffect(() => {
    if (!selectedSkpd) {
      setSubKegiatanStats([]);
      return;
    }

    const normalizeRealisasiItem = (item, isNonRkud = false) => {
      if (!item) return null;
      return {
        NamaSKPD: isNonRkud ? item.NAMASKPD : item.NamaSKPD,
        NamaSubUnit: isNonRkud ? item.NAMASUBSKPD : item.NamaSubUnit,
        KodeSubKegiatan: isNonRkud ? item.KODESUBKEGIATAN : item.KodeSubKegiatan,
        NamaSubKegiatan: isNonRkud ? item.NAMASUBKEGIATAN : item.NamaSubKegiatan,
        NamaRekening: isNonRkud ? item.NAMAREKENING : item.NamaRekening,
        nilai: item.nilai || 0
      };
    };
    
    const combinedRealisasi = {};
    for (const month in realisasi) {
      combinedRealisasi[month] = (realisasi[month] || []).map(item => normalizeRealisasiItem(item, false));
    }
    for (const month in realisasiNonRkud) {
      if (!combinedRealisasi[month]) combinedRealisasi[month] = [];
      combinedRealisasi[month].push(...(realisasiNonRkud[month] || []).map(item => normalizeRealisasiItem(item, true)));
    }

    const statsMap = new Map();
    const startIndex = months.indexOf(startMonth);
    const endIndex = months.indexOf(endMonth);
    const selectedMonths = months.slice(startIndex, endIndex + 1);
    const realisasiBulanIni = selectedMonths.map(month => combinedRealisasi[month] || []).flat();

    let filteredAnggaran = (anggaran || []).filter(item => item.NamaSKPD === selectedSkpd);
    if (selectedSubUnit !== 'Semua Sub Unit') {
      filteredAnggaran = filteredAnggaran.filter(item => item.NamaSubUnit === selectedSubUnit);
    }
    
    let filteredRealisasi = realisasiBulanIni.filter(item => item.NamaSKPD === selectedSkpd);
    if (selectedSubUnit !== 'Semua Sub Unit') {
      filteredRealisasi = filteredRealisasi.filter(item => item.NamaSubUnit === selectedSubUnit);
    }
    
    filteredAnggaran.forEach(item => {
      const key = `${item.NamaSKPD}|${item.KodeSubKegiatan}`; 
      const rekeningKey = item.NamaRekening || 'Tanpa Nama Rekening';

      if (!statsMap.has(key)) {
        statsMap.set(key, {
          kodeSubKegiatan: item.KodeSubKegiatan,
          subKegiatan: item.NamaSubKegiatan || 'Tanpa Sub Kegiatan',
          totalAnggaran: 0,
          totalRealisasi: 0,
          rekenings: new Map(),
          sumberDanaSet: new Set()
        });
      }

      const subKegiatanData = statsMap.get(key);
      subKegiatanData.totalAnggaran += item.nilai || 0;
      if (item.NamaSumberDana) {
        subKegiatanData.sumberDanaSet.add(item.NamaSumberDana);
      }

      if (!subKegiatanData.rekenings.has(rekeningKey)) {
        subKegiatanData.rekenings.set(rekeningKey, { anggaran: 0, realisasi: 0 });
      }
      subKegiatanData.rekenings.get(rekeningKey).anggaran += item.nilai || 0;
    });

    filteredRealisasi.forEach(item => {
      const key = `${item.NamaSKPD}|${item.KodeSubKegiatan}`;
      const rekeningKey = item.NamaRekening || 'Tanpa Nama Rekening';

      if (statsMap.has(key)) {
        const subKegiatanData = statsMap.get(key);
        subKegiatanData.totalRealisasi += item.nilai || 0;

        if (subKegiatanData.rekenings.has(rekeningKey)) {
          subKegiatanData.rekenings.get(rekeningKey).realisasi += item.nilai || 0;
        }
      }
    });

    const finalStats = Array.from(statsMap.values()).map(data => {
      const rekenings = Array.from(data.rekenings.entries()).map(([rekening, values]) => ({
        rekening,
        ...values,
        persentase: values.anggaran > 0 ? (values.realisasi / values.anggaran) * 100 : 0
      }));
      return {
        ...data,
        sumberDanaList: Array.from(data.sumberDanaSet),
        rekenings,
        persentase: data.totalAnggaran > 0 ? (data.totalRealisasi / data.totalAnggaran) * 100 : 0,
        sisaAnggaran: data.totalAnggaran - data.totalRealisasi,
        performanceCategory: data.totalAnggaran > 0 
          ? (data.totalRealisasi / data.totalAnggaran) * 100 >= 80 ? 'high' 
            : (data.totalRealisasi / data.totalAnggaran) * 100 >= 50 ? 'medium' : 'low'
          : 'low'
      };
    }).sort((a, b) => b.totalAnggaran - a.totalAnggaran);

    setSubKegiatanStats(finalStats);

  }, [selectedSkpd, selectedSubUnit, anggaran, realisasi, realisasiNonRkud, startMonth, endMonth]);

  const summaryStats = React.useMemo(() => {
    if (subKegiatanStats.length === 0) return null;
    
    const totalAnggaran = subKegiatanStats.reduce((sum, item) => sum + item.totalAnggaran, 0);
    const totalRealisasi = subKegiatanStats.reduce((sum, item) => sum + item.totalRealisasi, 0);
    const rataPenyerapan = totalAnggaran > 0 ? (totalRealisasi / totalAnggaran) * 100 : 0;
    
    return {
      totalAnggaran,
      totalRealisasi,
      totalSisa: totalAnggaran - totalRealisasi,
      rataPenyerapan,
      highPerformer: subKegiatanStats.filter(item => item.persentase >= 80).length,
      mediumPerformer: subKegiatanStats.filter(item => item.persentase >= 50 && item.persentase < 80).length,
      lowPerformer: subKegiatanStats.filter(item => item.persentase < 50).length,
      totalRekening: subKegiatanStats.reduce((sum, item) => sum + item.rekenings.length, 0),
      totalSumberDana: new Set(subKegiatanStats.flatMap(item => item.sumberDanaList)).size,
      totalItems: subKegiatanStats.length
    };
  }, [subKegiatanStats]);

  const chartData = React.useMemo(() => {
    return subKegiatanStats.slice(0, 15).map(item => ({
      name: item.subKegiatan.length > 25 ? item.subKegiatan.substring(0, 25) + '...' : item.subKegiatan,
      fullName: item.subKegiatan,
      Anggaran: item.totalAnggaran / 1e9,
      Realisasi: item.totalRealisasi / 1e9,
      Persentase: item.persentase,
      unit: 'M'
    }));
  }, [subKegiatanStats]);

  const totalPages = Math.ceil(subKegiatanStats.length / ITEMS_PER_PAGE);
  const paginatedData = subKegiatanStats.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) setCurrentPage(page);
  };

  const toggleRow = (subKegiatanKey) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(subKegiatanKey)) newExpandedRows.delete(subKegiatanKey);
    else newExpandedRows.add(subKegiatanKey);
    setExpandedRows(newExpandedRows);
  };

  React.useEffect(() => {
    setCurrentPage(1);
    setExpandedRows(new Set());
    setSelectedSubUnit('Semua Sub Unit');
  }, [selectedSkpd, startMonth, endMonth]);

  const handleDownloadExcel = () => {
    if (!subKegiatanStats || subKegiatanStats.length === 0) return;
    if (!window.XLSX) return;

    try {
      const dataForExport = subKegiatanStats.flatMap(item => 
        item.rekenings.map(rek => ({
          'SKPD/OPD': selectedSkpd,
          'Sub Unit': selectedSubUnit,
          'Kode Sub Kegiatan': item.kodeSubKegiatan,
          'Nama Sub Kegiatan': item.subKegiatan,
          'Nama Rekening': rek.rekening,
          'Anggaran (Rp)': rek.anggaran,
          'Realisasi (Rp)': rek.realisasi,
          'Sisa (Rp)': rek.anggaran - rek.realisasi,
          'Penyerapan (%)': rek.persentase.toFixed(2),
          'Sumber Dana': item.sumberDanaList.join(', ')
        }))
      );
      const worksheet = window.XLSX.utils.json_to_sheet(dataForExport);
      const workbook = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(workbook, worksheet, "Sub Kegiatan");
      window.XLSX.writeFile(workbook, `Sub_Kegiatan_${selectedSkpd.replace(/ /g, "_")}_${selectedYear}.xlsx`);
    } catch (err) { console.error(err); }
  };

  const getPerformanceBadge = (persentase) => {
    if (persentase >= 80) return <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 flex items-center gap-1"><CheckCircle size={10} /> Tinggi</span>;
    if (persentase >= 50) return <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-500/20 flex items-center gap-1"><Info size={10} /> Sedang</span>;
    return <span className="px-2.5 py-0.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-500/20 flex items-center gap-1"><AlertTriangle size={10} /> Rendah</span>;
  };

  const getAnalysisPrompt = (customQuery) => {
    if (customQuery) return `Berdasarkan data sub kegiatan SKPD, berikan analisis untuk: "${customQuery}"`;
    if (!selectedSkpd) return "Pilih SKPD untuk dianalisis.";
    return `Analis kinerja penyerapan anggaran per Sub Kegiatan untuk SKPD: **${selectedSkpd}** pada tahun ${selectedYear}. Total Anggaran: ${formatIDR(summaryStats?.totalAnggaran)}.`;
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 pb-20 text-left">
      <SectionTitle>Statistik Sub Kegiatan & Rekening</SectionTitle>
      
      {/* EXECUTIVE HEADER PANEL */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-700 to-indigo-900 rounded-[2.5rem] p-10 text-white shadow-2xl border border-white/10 group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -mr-40 -mt-40 transition-transform duration-1000 group-hover:scale-110"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-400/10 rounded-full blur-[80px] -ml-32 -mb-32"></div>
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-10 items-center">
          <div className="lg:col-span-2 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black tracking-[0.2em] uppercase border border-white/10 shadow-lg">
              <LayoutDashboard size={14} className="text-indigo-200 animate-pulse" /> Performance Analytics Portal
            </div>
            <h2 className="text-5xl font-black leading-[0.95] tracking-tighter">
              Bedah Kinerja <br/>
              <span className="text-indigo-200 underline decoration-indigo-400 decoration-4 underline-offset-8 italic">Sub Kegiatan</span>.
            </h2>
            <p className="text-indigo-100/90 text-sm max-w-2xl leading-relaxed font-medium">
              Eksplorasi mendalam hingga level rekening belanja. Pantau distribusi sumber dana, efektivitas penyerapan per unit, dan identifikasi potensi sisa anggaran secara real-time.
            </p>
          </div>

          {selectedSkpd && summaryStats && (
            <div className="flex flex-col gap-4 animate-in slide-in-from-right duration-700">
              <div className="bg-white/10 backdrop-blur-xl p-5 rounded-[2rem] border border-white/20 shadow-xl">
                <p className="text-[10px] font-black uppercase text-indigo-200 mb-1 tracking-widest flex items-center gap-2">
                  <TrendingUp size={14} /> Efektivitas Total
                </p>
                <div className="text-3xl font-black">{summaryStats.rataPenyerapan.toFixed(1)}%</div>
              </div>
              <div className="bg-emerald-500/20 backdrop-blur-xl p-5 rounded-[2rem] border border-emerald-500/20 shadow-xl">
                <p className="text-[10px] font-black uppercase text-emerald-200 mb-1 tracking-widest flex items-center gap-2">
                  <Target size={14} /> Realisasi Fiskal
                </p>
                <div className="text-2xl font-black truncate">{formatIDR(summaryStats.totalRealisasi)}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <GeminiAnalysis 
        getAnalysisPrompt={getAnalysisPrompt} 
        disabledCondition={!selectedSkpd || subKegiatanStats.length === 0} 
        theme={theme}
        interactivePlaceholder="Gunakan AI untuk mendeteksi anomali penyerapan..."
        userRole={userRole}
        userCanUseAi={userCanUseAi}
      />

      {/* STICKY GLASS FILTER BAR */}
      <div className="sticky top-6 z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-white/40 dark:border-slate-800/50 p-6 rounded-[2rem] shadow-2xl shadow-slate-200/50 dark:shadow-none transition-all duration-500">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Perangkat Daerah</label>
              <div className="relative group">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 transition-transform group-hover:scale-110" size={18} />
                <select 
                  value={selectedSkpd} 
                  onChange={(e) => setSelectedSkpd(e.target.value)}
                  className="w-full pl-12 pr-6 py-3.5 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-black shadow-sm focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all cursor-pointer"
                >
                  <option value="">🏢 Pilih SKPD</option>
                  {skpdList.map(skpd => <option key={skpd} value={skpd}>{skpd}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Sub Unit Kerja</label>
              <div className="relative group">
                <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-500" size={18} />
                <select 
                  value={selectedSubUnit} 
                  onChange={(e) => setSelectedSubUnit(e.target.value)}
                  disabled={!selectedSkpd || subUnitList.length === 0}
                  className="w-full pl-12 pr-6 py-3.5 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-black shadow-sm focus:ring-4 focus:ring-purple-500/20 outline-none transition-all disabled:opacity-30"
                >
                  <option>📋 Semua Sub Unit</option>
                  {subUnitList.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Jendela Waktu</label>
              <div className="flex items-center bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-1 shadow-sm">
                <select value={startMonth} onChange={e => setStartMonth(e.target.value)} className="flex-1 bg-transparent py-2.5 px-3 text-[11px] font-black outline-none border-none">
                  {months.map(m => <option key={`s-${m}`} value={m}>{m.substring(0,3)}</option>)}
                </select>
                <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-700"></div>
                <select value={endMonth} onChange={e => setEndMonth(e.target.value)} className="flex-1 bg-transparent py-2.5 px-3 text-[11px] font-black outline-none border-none text-right">
                  {months.map(m => <option key={`e-${m}`} value={m}>{m.substring(0,3)}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
            <button 
              onClick={() => setViewMode('card')} 
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${viewMode === 'card' ? 'bg-white dark:bg-slate-700 shadow-md text-indigo-600' : 'opacity-40 hover:opacity-100'}`}
            >
              <LayoutDashboard size={14} /> CARDS
            </button>
            <button 
              onClick={() => setViewMode('table')} 
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 shadow-md text-purple-600' : 'opacity-40 hover:opacity-100'}`}
            >
              <BarChart3 size={14} /> LIST
            </button>
          </div>
        </div>
      </div>

      {selectedSkpd && chartData.length > 0 && (
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/30 dark:border-white/5 p-10 rounded-[3rem] shadow-2xl transition-all hover:shadow-indigo-500/5 group">
          <div className="flex items-center justify-between mb-10 text-left">
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3 tracking-tighter">
                <div className="w-2 h-8 bg-indigo-500 rounded-full animate-pulse"></div>
                Distribusi Anggaran Utama
              </h3>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-5">Perbandingan Top 15 Sub Kegiatan (Miliar Rp)</p>
            </div>
            <button onClick={handleDownloadExcel} className="p-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-500/30 transition-all hover:-translate-y-1 active:scale-95">
              <Download size={20} />
            </button>
          </div>

          <div className="h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#435EBE" stopOpacity={1}/>
                  </linearGradient>
                  <linearGradient id="realGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#059669" stopOpacity={1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128, 128, 128, 0.08)" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} height={80} tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} axisLine={false} tickLine={false} dy={15} />
                <YAxis tickFormatter={(val) => `${val}M`} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: 'rgba(99, 102, 241, 0.03)', radius: 10}} content={<CustomTooltip />} />
                <Legend wrapperStyle={{paddingTop: '40px', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em'}} iconType="circle" />
                <Bar dataKey="Anggaran" fill="url(#barGrad)" radius={[10, 10, 0, 0]} barSize={40} animationDuration={2000} />
                <Bar dataKey="Realisasi" fill="url(#realGrad)" radius={[10, 10, 0, 0]} barSize={30} animationDuration={2500} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* CONTENT LIST / CARDS */}
      <div className="space-y-6">
        {!selectedSkpd ? (
          <div className="py-32 text-center bg-slate-50/50 dark:bg-slate-900/50 rounded-[3rem] border border-dashed border-slate-300 dark:border-slate-700">
            <Search size={48} className="mx-auto text-slate-300 mb-6 animate-bounce" />
            <p className="text-xl font-black text-slate-400 tracking-tighter uppercase">Silakan Pilih Perangkat Daerah</p>
            <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-[0.3em]">Gunakan filter di atas untuk memulai audit data</p>
          </div>
        ) : subKegiatanStats.length > 0 ? (
          viewMode === 'card' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {paginatedData.map((item, idx) => {
                const key = `${item.subKegiatan}-${item.kodeSubKegiatan}`;
                const isExpanded = expandedRows.has(key);
                return (
                  <div key={key} className={`group bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 ${isExpanded ? 'lg:col-span-2 shadow-indigo-500/10 ring-2 ring-indigo-500/20' : 'shadow-xl'}`}>
                    <div onClick={() => toggleRow(key)} className="p-8 cursor-pointer relative overflow-hidden text-left">
                      {isExpanded && <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none transition-opacity duration-1000"><Layers size={200} className="text-indigo-500" /></div>}
                      
                      <div className="flex flex-col md:flex-row justify-between items-start gap-6 relative z-10">
                        <div className="flex-1 space-y-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="text-[10px] font-black px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full tracking-widest text-slate-500 font-mono">{item.kodeSubKegiatan}</span>
                            {getPerformanceBadge(item.persentase)}
                          </div>
                          <h4 className="text-xl font-black text-slate-800 dark:text-white leading-tight tracking-tighter group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {item.subKegiatan}
                          </h4>
                        </div>
                        <div className="text-right whitespace-nowrap">
                          <p className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter leading-none mb-1 tabular-nums">{formatIDR(item.totalAnggaran)}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alokasi Pagu</p>
                        </div>
                      </div>

                      <div className="mt-8 space-y-3">
                        <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.1em]">
                          <span className="text-emerald-500 flex items-center gap-1.5"><CheckCircle size={14} /> Terpakai: {formatIDR(item.totalRealisasi)}</span>
                          <span className="text-slate-400">Pencapaian: {item.persentase.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 h-3 rounded-full overflow-hidden shadow-inner flex border border-slate-200/20">
                          <div 
                            className={`h-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(16,185,129,0.3)] ${item.persentase >= 80 ? 'bg-emerald-500' : item.persentase >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                            style={{ width: `${Math.min(item.persentase, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-500 tracking-widest italic pt-2">
                          <span className="tabular-nums opacity-60 italic font-medium">Sisa: {formatIDR(item.sisaAnggaran)}</span>
                          <span className="flex items-center gap-1 text-indigo-500 font-black tracking-tighter hover:underline decoration-indigo-500/30 underline-offset-4">
                            RINCIAN REKENING 
                            <ChevronDown size={14} className={`transition-transform duration-700 ${isExpanded ? 'rotate-180' : ''}`} />
                          </span>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-slate-100 dark:border-slate-700 bg-white/40 dark:bg-slate-900/20 p-8 space-y-10 animate-in slide-in-from-top-6 duration-700">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                          {/* Sumber Dana */}
                          <div className="space-y-5 text-left font-black">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl shadow-inner"><DollarSign size={20} /></div>
                              <h5 className="text-sm uppercase tracking-widest italic text-slate-600 dark:text-slate-300">Struktur Pembiayaan</h5>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                              {item.sumberDanaList.map(sd => (
                                <div key={sd} className="flex items-center gap-3 px-5 py-4 bg-white/60 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm transition-all hover:scale-[1.02] hover:border-emerald-500/30">
                                  <div className="w-1.5 h-6 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                  <span className="text-[11px] font-black text-slate-600 dark:text-slate-300 tracking-tight leading-none uppercase">{sd}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Rincian Rekening */}
                          <div className="space-y-5 text-left font-black">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-indigo-500/10 text-indigo-600 rounded-xl shadow-inner"><Layers size={20} /></div>
                              <h5 className="text-sm uppercase tracking-widest italic text-slate-600 dark:text-slate-300">Breakdown Belanja</h5>
                            </div>
                            <div className="overflow-hidden rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
                              <table className="min-w-full">
                                <thead className="bg-slate-50/80 dark:bg-slate-800/80">
                                  <tr>
                                    <th className="px-5 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Deskripsi Uraian</th>
                                    <th className="px-5 py-4 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Volume Fiskal</th>
                                    <th className="px-5 py-4 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Serap %</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50/50 dark:divide-slate-800/50">
                                  {item.rekenings.map(rek => (
                                    <tr key={rek.rekening} className="hover:bg-indigo-500/5 transition-colors">
                                      <td className="px-5 py-3.5 text-[11px] font-bold text-slate-600 dark:text-slate-400 max-w-[180px] truncate">{rek.rekening}</td>
                                      <td className="px-5 py-3.5 text-right text-[11px] font-black text-slate-800 dark:text-white italic tabular-nums">{formatIDR(rek.realisasi)}</td>
                                      <td className="px-5 py-3.5 text-right font-black">
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] tabular-nums shadow-sm ${rek.persentase >= 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                          {rek.persentase.toFixed(1)}%
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
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
            /* LIST VIEW TABLE */
            <div className="overflow-x-auto rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl bg-white/20 dark:bg-slate-800/20 backdrop-blur-xl text-left">
              <table className="min-w-full border-separate border-spacing-0">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-900/80">
                    <th className="px-8 py-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-200/50">ID SubKeg</th>
                    <th className="px-8 py-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-200/50">Uraian Pekerjaan / Sub Kegiatan</th>
                    <th className="px-8 py-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-200/50">Pagu Definitif</th>
                    <th className="px-8 py-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-200/50">Audit Serap</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-indigo-500/5 transition-colors group cursor-pointer" onClick={() => toggleRow(`${item.subKegiatan}-${item.kodeSubKegiatan}`)}>
                      <td className="px-8 py-5 text-[10px] font-black text-slate-400 font-mono tracking-widest">{item.kodeSubKegiatan}</td>
                      <td className="px-8 py-5 text-sm font-black text-slate-800 dark:text-white max-w-sm tracking-tighter leading-tight group-hover:text-indigo-600 transition-colors uppercase">{item.subKegiatan}</td>
                      <td className="px-8 py-5 text-right font-black text-indigo-600 dark:text-indigo-400 tabular-nums italic text-sm">{formatIDR(item.totalAnggaran)}</td>
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
            <p className="font-black text-slate-400 uppercase tracking-[0.3em] text-xs italic">Data unit kerja sedang dikonfigurasi...</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="pt-10 flex justify-center animate-in slide-in-from-bottom-5 duration-700">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} theme={theme} />
          </div>
        )}
      </div>

      {/* FOOTER LEGEND */}
      {selectedSkpd && summaryStats && (
        <div className="flex flex-wrap items-center justify-center gap-10 py-12 border-t border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">
          <div className="flex items-center gap-2.5 group cursor-default">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/40 group-hover:scale-125 transition-transform duration-300"></div> {summaryStats.totalItems} UNIT SUB KEGIATAN
          </div>
          <div className="flex items-center gap-2.5 group cursor-default">
            <div className="w-3 h-3 rounded-full bg-indigo-600 shadow-lg shadow-indigo-500/40 group-hover:scale-125 transition-transform duration-300"></div> {summaryStats.totalRekening} ITEM TRANSAKSI
          </div>
          <div className="flex items-center gap-2.5 group cursor-default">
            <div className="w-3 h-3 rounded-full bg-purple-600 shadow-lg shadow-purple-500/40 group-hover:scale-125 transition-transform duration-300"></div> {summaryStats.totalSumberDana} SUMBER PEMBIAYAAN
          </div>
          <div className="flex items-center gap-2.5 text-indigo-400 opacity-80 animate-pulse">
            <Info size={14} /> KLIK KARTU UNTUK AUDIT REKENING
          </div>
        </div>
      )}
    </div>
  );
};

export default SkpdSubKegiatanStatsView;