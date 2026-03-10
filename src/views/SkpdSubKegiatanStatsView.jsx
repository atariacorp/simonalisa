import React, { useState, useMemo, useEffect } from 'react';
import { 
  ChevronDown, ChevronUp, TrendingUp, TrendingDown, Target, 
  DollarSign, Info, AlertTriangle, CheckCircle, Download, 
  Filter, Layers, BarChart3, PieChart, Eye, EyeOff, Sparkles, 
  Calendar, Box, ArrowRight, LayoutDashboard, Search, Building2,
  ChevronLeft, ChevronRight, MoreHorizontal, Loader2, MessageSquare,
  Zap, ArrowUpRight
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, ComposedChart, Line, Cell 
} from 'recharts';

// === IMPORT sesuai struktur aplikasi Anda ===
import { db, appId } from '../../utils/firebase';
import { formatIDR } from '../../utils';
import { auth } from '../../utils/firebase';
import GeminiAnalysis from '../components/GeminiAnalysis';
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
    <div className="flex items-center justify-center gap-3 mt-12">
      <button 
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="p-3 rounded-2xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/30 disabled:opacity-20 hover:bg-indigo-50 transition-all shadow-sm"
      >
        <ChevronLeft size={18} />
      </button>
      <div className="flex items-center gap-2 p-1.5 bg-white/30 dark:bg-slate-900/30 backdrop-blur-xl rounded-[1.5rem] border border-slate-200/50 dark:border-slate-700/30 shadow-inner">
        {visiblePages.map((page, i) => (
          <React.Fragment key={page}>
            {i > 0 && visiblePages[i - 1] !== page - 1 && <MoreHorizontal className="text-slate-400 px-1" size={16} />}
            <button
              onClick={() => onPageChange(page)}
              className={`w-11 h-11 rounded-xl font-black text-sm transition-all duration-500 ${
                currentPage === page 
                  ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-lg shadow-indigo-500/40 scale-105 z-10' 
                  : 'text-slate-500 hover:bg-white/50 hover:text-indigo-600'
              }`}
            >
              {page}
            </button>
          </React.Fragment>
        ))}
      </div>
      <button 
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="p-3 rounded-2xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/30 disabled:opacity-20 hover:bg-indigo-50 transition-all shadow-sm"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/80 dark:bg-slate-950/90 backdrop-blur-3xl p-6 rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] border border-white/40 dark:border-white/5 min-w-[320px] z-50 animate-in fade-in zoom-in-95 duration-300 text-left">
        <div className="flex flex-col gap-1 mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.2em]">Audit Sub Kegiatan</p>
          <p className="font-black text-base text-slate-800 dark:text-white leading-tight break-words">
            {label}
          </p>
        </div>
        <div className="space-y-3">
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex justify-between items-center group/item transition-all hover:translate-x-1">
              <span className="flex items-center gap-3 text-slate-600 dark:text-slate-400 font-bold text-xs uppercase tracking-wider">
                <div className="w-3 h-3 rounded-full shadow-lg" style={{ 
                  background: `linear-gradient(135deg, ${entry.color}, white)`,
                  boxShadow: `0 0 15px ${entry.color}44` 
                }}></div>
                {entry.name}
              </span>
              <span className="font-black text-sm text-slate-950 dark:text-white tabular-nums tracking-tighter">
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
  const [selectedSkpd, setSelectedSkpd] = useState('');
  const [selectedSubUnit, setSelectedSubUnit] = useState('Semua Sub Unit');
  
  const [subKegiatanStats, setSubKegiatanStats] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [viewMode, setViewMode] = useState('card'); 
  const [showAnalysis, setShowAnalysis] = useState(true);
  
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const [startMonth, setStartMonth] = useState(months[0]);
  const [endMonth, setEndMonth] = useState(months[months.length - 1]);
  const ITEMS_PER_PAGE = 10;

  const skpdList = useMemo(() => {
    const skpds = new Set((anggaran || []).map(item => item.NamaSKPD).filter(Boolean));
    return Array.from(skpds).sort();
  }, [anggaran]);
  
  const subUnitList = useMemo(() => {
    if (!selectedSkpd) return [];
    const filtered = (anggaran || []).filter(item => item.NamaSKPD === selectedSkpd);
    const subUnits = new Set(filtered.map(item => item.NamaSubUnit).filter(Boolean));
    return Array.from(subUnits).sort();
  }, [anggaran, selectedSkpd]);

  useEffect(() => {
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

  const summaryStats = useMemo(() => {
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

  const chartData = useMemo(() => {
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

  useEffect(() => {
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
    if (persentase >= 80) return <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 flex items-center gap-2"><CheckCircle size={12} /> Kinerja Tinggi</span>;
    if (persentase >= 50) return <span className="px-3 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-500/20 flex items-center gap-2"><Info size={12} /> Kinerja Sedang</span>;
    return <span className="px-3 py-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-rose-500/20 flex items-center gap-2"><AlertTriangle size={12} /> Kinerja Rendah</span>;
  };

  const getAnalysisPrompt = (query, allData) => {
    // Jika user mengirim query khusus
    if (query && query.trim() !== '') {
        return `Berdasarkan data sub kegiatan SKPD, jawab pertanyaan ini: ${query}`;
    }
    
    // Analisis default
    if (!selectedSkpd) return "Pilih SKPD untuk dianalisis.";
    if (subKegiatanStats.length === 0) return "Data tidak cukup untuk dianalisis.";
    
    const top5 = subKegiatanStats.slice(0, 5);
    const low5 = subKegiatanStats.filter(item => item.persentase < 50).slice(0, 3);
    
    return `ANALISIS SUB KEGIATAN SKPD
SKPD: ${selectedSkpd}
TAHUN: ${selectedYear}
PERIODE: ${startMonth} - ${endMonth}

DATA RINGKAS:
- Total Anggaran: ${formatIDR(summaryStats?.totalAnggaran || 0)}
- Total Realisasi: ${formatIDR(summaryStats?.totalRealisasi || 0)}
- Rata-rata Penyerapan: ${summaryStats?.rataPenyerapan.toFixed(1)}%
- Distribusi Kinerja: Tinggi (${summaryStats?.highPerformer || 0}), Sedang (${summaryStats?.mediumPerformer || 0}), Rendah (${summaryStats?.lowPerformer || 0})

SUB KEGIATAN DENGAN KINERJA TERTINGGI:
${top5.map((item, i) => `${i+1}. ${item.subKegiatan}: ${item.persentase.toFixed(1)}% (Anggaran: ${formatIDR(item.totalAnggaran)}, Realisasi: ${formatIDR(item.totalRealisasi)})`).join('\n')}

SUB KEGIATAN DENGAN KINERJA RENDAH (<50%):
${low5.length > 0 ? low5.map((item, i) => `${i+1}. ${item.subKegiatan}: ${item.persentase.toFixed(1)}%`).join('\n') : '- Tidak ada data dengan kinerja rendah'}

BERIKAN ANALISIS MENDALAM MENGENAI:
1. Evaluasi Kinerja: Identifikasi sub kegiatan dengan kinerja optimal dan yang bermasalah.
2. Identifikasi Masalah: Analisis penyebab rendahnya penyerapan pada sub kegiatan dengan kinerja <50%.
3. Rekomendasi Strategis: 3 langkah konkret untuk meningkatkan kinerja.
4. Peringatan Dini: Poin penting untuk rapat pimpinan terkait optimalisasi anggaran.

Gunakan bahasa profesional, langsung ke inti, tanpa basa-basi.`;
};

  return (
    <div className="space-y-12 animate-in fade-in duration-1000 pb-20 text-left bg-slate-50/30 dark:bg-transparent">
      <SectionTitle>Statistik Sub Kegiatan & Rekening</SectionTitle>
      
      {/* EXECUTIVE HEADER PANEL - PREMIUM GLASS */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-black rounded-[3.5rem] p-12 text-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white/5 group">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[150px] -mr-96 -mt-96 transition-all duration-1000 group-hover:bg-indigo-500/20"></div>
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
          <div className="lg:col-span-2 space-y-8">
            <div className="inline-flex items-center gap-3 px-5 py-2 bg-white/10 backdrop-blur-2xl rounded-full text-[11px] font-black tracking-[0.4em] uppercase border border-white/20 shadow-lg animate-pulse">
              <Zap size={14} className="text-yellow-400" /> Deep Dive Performance Analytics
            </div>
            <h2 className="text-4xl lg:text-6xl font-black leading-[0.95] tracking-tighter mb-4">
              BEDAH KINERJA <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 italic underline decoration-indigo-500/50 decoration-8 underline-offset-8">SUB KEGIATAN</span>.
            </h2>
            <p className="text-slate-400 font-medium max-w-2xl text-lg leading-relaxed">
              Eksplorasi mendalam hingga level rekening belanja. Pantau distribusi sumber dana, efektivitas penyerapan per unit, dan identifikasi anomali fiskal secara real-time.
            </p>
          </div>

          {selectedSkpd && summaryStats && (
            <div className="grid grid-cols-1 gap-5 animate-in slide-in-from-right-8 duration-1000">
              <div className="bg-white/5 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/10 transition-all hover:translate-y-[-5px] hover:bg-white/[0.08]">
                <p className="text-[10px] font-black uppercase text-indigo-400 mb-2 tracking-[0.3em] flex items-center gap-2">
                  <TrendingUp size={16} /> EFISIENSI AGREGAT
                </p>
                <div className="text-5xl font-black tracking-tighter">{summaryStats.rataPenyerapan.toFixed(1)}%</div>
              </div>
              <div className="bg-white/5 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/10 transition-all hover:translate-y-[-5px] hover:bg-white/[0.08]">
                <p className="text-[10px] font-black uppercase text-emerald-400 mb-2 tracking-[0.3em] flex items-center gap-2">
                  <Target size={16} /> REALISASI FISKAL
                </p>
                <div className="text-3xl font-black truncate tracking-tight">{formatIDR(summaryStats.totalRealisasi)}</div>
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
  {showAnalysis && selectedSkpd && subKegiatanStats.length > 0 && (
    <div className="text-xs text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-2 bg-white/30 dark:bg-gray-800/30 p-2 rounded-lg">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
      </span>
      <span>SKPD: {selectedSkpd} | Sub Unit: {selectedSubUnit} | Total Sub Kegiatan: {subKegiatanStats.length}</span>
    </div>
  )}
  
  {/* Komponen GeminiAnalysis dengan Conditional Rendering */}
  {showAnalysis && (
    <GeminiAnalysis 
      getAnalysisPrompt={getAnalysisPrompt} 
      disabledCondition={!selectedSkpd || subKegiatanStats.length === 0} 
      userCanUseAi={userCanUseAi}
      allData={{
        selectedSkpd,
        selectedSubUnit,
        startMonth,
        endMonth,
        summaryStats,
        topItems: subKegiatanStats.slice(0, 5)
      }}
    />
  )}
</div>

      {/* STICKY GLASS FILTER BAR */}
      <div className="sticky top-6 z-50 bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl border border-white/40 dark:border-white/5 p-8 rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] transition-all duration-700">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2 text-left group">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-2">Perangkat Daerah</label>
              <div className="relative">
                <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500 group-hover:scale-110 transition-transform" size={20} />
                <select 
                  value={selectedSkpd} 
                  onChange={(e) => setSelectedSkpd(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-white/60 dark:bg-gray-950/60 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 rounded-2xl text-sm font-black shadow-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all cursor-pointer appearance-none"
                >
                  <option value="">🏢 PILIH SKPD / OPD</option>
                  {skpdList.map(skpd => <option key={skpd} value={skpd}>{skpd}</option>)}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                    <ChevronDown size={18} />
                </div>
              </div>
            </div>

            <div className="space-y-2 text-left group">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-2">Sub Unit Kerja</label>
              <div className="relative">
                <Layers className="absolute left-5 top-1/2 -translate-y-1/2 text-purple-500" size={20} />
                <select 
                  value={selectedSubUnit} 
                  onChange={(e) => setSelectedSubUnit(e.target.value)}
                  disabled={!selectedSkpd || subUnitList.length === 0}
                  className="w-full pl-14 pr-6 py-4 bg-white/60 dark:bg-gray-950/60 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 rounded-2xl text-sm font-black shadow-sm focus:ring-4 focus:ring-purple-500/10 outline-none transition-all disabled:opacity-30 appearance-none"
                >
                  <option>📋 SEMUA SUB UNIT</option>
                  {subUnitList.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                    <ChevronDown size={18} />
                </div>
              </div>
            </div>

            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-2">Jendela Waktu Audit</label>
              <div className="flex items-center bg-white/60 dark:bg-gray-950/60 border border-slate-200/50 dark:border-white/10 rounded-2xl p-1.5 shadow-sm">
                <select value={startMonth} onChange={e => setStartMonth(e.target.value)} className="flex-1 bg-transparent py-2.5 px-4 text-[11px] font-black outline-none border-none appearance-none cursor-pointer">
                  {months.map(m => <option key={`s-${m}`} value={m}>{m.substring(0,3)}</option>)}
                </select>
                <div className="w-[1px] h-6 bg-slate-200 dark:bg-white/10"></div>
                <select value={endMonth} onChange={e => setEndMonth(e.target.value)} className="flex-1 bg-transparent py-2.5 px-4 text-[11px] font-black outline-none border-none text-right appearance-none cursor-pointer">
                  {months.map(m => <option key={`e-${m}`} value={m}>{m.substring(0,3)}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="flex bg-slate-100/50 dark:bg-white/5 p-2 rounded-[1.5rem] border border-slate-200/50 dark:border-white/10 shadow-inner">
            <button 
              onClick={() => setViewMode('card')} 
              className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all ${viewMode === 'card' ? 'bg-white dark:bg-gray-800 shadow-lg text-indigo-600' : 'opacity-40 hover:opacity-100 uppercase'}`}
            >
              <LayoutDashboard size={16} /> CARDS
            </button>
            <button 
              onClick={() => setViewMode('table')} 
              className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all ${viewMode === 'table' ? 'bg-white dark:bg-gray-800 shadow-lg text-purple-600' : 'opacity-40 hover:opacity-100 uppercase'}`}
            >
              <BarChart3 size={16} /> LIST VIEW
            </button>
          </div>
        </div>
      </div>

      {/* CHART SECTION - APACHE ECHARTS STYLE */}
      {selectedSkpd && chartData.length > 0 && (
        <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-3xl border border-white/50 dark:border-white/5 p-12 rounded-[3.5rem] shadow-[0_60px_100px_-30px_rgba(0,0,0,0.1)] group">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12 text-left">
            <div className="space-y-2">
              <h3 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-4 tracking-tighter leading-none">
                <div className="w-2.5 h-10 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full animate-pulse shadow-[0_0_20px_rgba(99,102,241,0.4)]"></div>
                Distribusi Anggaran Utama
              </h3>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] ml-6">PERBANDINGAN TOP 15 SUB KEGIATAN (MILIAR RP)</p>
            </div>
            <button onClick={handleDownloadExcel} className="flex items-center gap-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_15px_30px_-10px_rgba(16,185,129,0.5)] transition-all hover:-translate-y-1 active:scale-95">
              <Download size={20} /> UNDUH DATA EXCEL
            </button>
          </div>

          <div className="bg-white/40 dark:bg-gray-950/40 backdrop-blur-3xl rounded-[2.5rem] p-10 border border-white/50 dark:border-white/5 shadow-inner">
            <div className="h-[550px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 120 }} barGap={12}>
                  <defs>
                    <linearGradient id="barAnggaran" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.85}/>
                      <stop offset="100%" stopColor="#818CF8" stopOpacity={0.4}/>
                    </linearGradient>
                    <linearGradient id="barRealisasi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.95}/>
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.5}/>
                    </linearGradient>
                    <filter id="shadow">
                      <feDropShadow dx="0" dy="8" stdDeviation="12" floodOpacity="0.15"/>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="rgba(148, 163, 184, 0.08)" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    interval={0} 
                    height={120} 
                    tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b', letterSpacing: '-0.2px' }} 
                    axisLine={{ stroke: 'rgba(148, 163, 184, 0.1)', strokeWidth: 2 }} 
                    tickLine={false} 
                    dy={15} 
                  />
                  <YAxis 
                    tickFormatter={(val) => `${val}M`} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <Tooltip 
                    cursor={{fill: 'rgba(79, 70, 229, 0.03)', radius: 15}} 
                    content={<CustomTooltip />} 
                  />
                  <Legend 
                    verticalAlign="top" 
                    align="right"
                    height={60}
                    iconType="rect"
                    iconSize={14}
                    wrapperStyle={{ paddingTop: '0px', paddingBottom: '30px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }} 
                  />
                  <Bar dataKey="Anggaran" fill="url(#barAnggaran)" name="Pagu PPA" radius={[12, 12, 4, 4]} barSize={40} filter="url(#shadow)" />
                  <Bar dataKey="Realisasi" fill="url(#barRealisasi)" name="Realisasi Kas" radius={[12, 12, 4, 4]} barSize={40} filter="url(#shadow)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT GRID - PREMIUM CARDS */}
      <div className="space-y-10">
        {!selectedSkpd ? (
          <div className="py-40 text-center bg-white/40 dark:bg-gray-900/40 backdrop-blur-3xl rounded-[4rem] border border-dashed border-slate-300 dark:border-white/10 shadow-xl group">
            <div className="w-24 h-24 mx-auto mb-8 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 duration-700">
                <Search size={48} className="text-slate-300 dark:text-slate-600 animate-pulse" />
            </div>
            <p className="text-2xl font-black text-slate-400 dark:text-slate-500 tracking-tighter uppercase">Menunggu Input Audit</p>
            <p className="text-[10px] font-black text-slate-400 mt-4 uppercase tracking-[0.4em] opacity-60">Gunakan filter cerdas di atas untuk memulai analisis</p>
          </div>
        ) : subKegiatanStats.length > 0 ? (
          viewMode === 'card' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {paginatedData.map((item, idx) => {
                const key = `${item.subKegiatan}-${item.kodeSubKegiatan}`;
                const isExpanded = expandedRows.has(key);
                return (
                  <div key={key} className={`group bg-white/40 dark:bg-gray-900/40 backdrop-blur-3xl border border-white/50 dark:border-white/5 rounded-[3rem] overflow-hidden transition-all duration-700 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] hover:translate-y-[-10px] ${isExpanded ? 'lg:col-span-2 shadow-[0_50px_100px_-20px_rgba(79,70,229,0.2)] ring-2 ring-indigo-500/20' : 'shadow-2xl shadow-slate-200/50 dark:shadow-none'}`}>
                    <div onClick={() => toggleRow(key)} className="p-10 cursor-pointer relative overflow-hidden text-left">
                      {isExpanded && <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none transition-opacity duration-1000 rotate-12"><Layers size={250} className="text-indigo-500" /></div>}
                      
                      <div className="flex flex-col md:flex-row justify-between items-start gap-8 relative z-10">
                        <div className="flex-1 space-y-4">
                          <div className="flex flex-wrap items-center gap-4">
                            <span className="text-[10px] font-black px-4 py-2 bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 rounded-xl tracking-[0.2em] text-slate-500 font-mono italic">{item.kodeSubKegiatan}</span>
                            {getPerformanceBadge(item.persentase)}
                          </div>
                          <h4 className="text-2xl font-black text-slate-800 dark:text-white leading-tight tracking-tighter group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-all duration-500">
                            {item.subKegiatan}
                          </h4>
                        </div>
                        <div className="text-right whitespace-nowrap bg-slate-900/5 dark:bg-white/5 p-6 rounded-[2rem] border border-white/10">
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 opacity-60">ALOKASI PAGU</p>
                          <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-none tabular-nums">{formatIDR(item.totalAnggaran)}</p>
                        </div>
                      </div>

                      <div className="mt-10 space-y-4">
                        <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.2em]">
                          <span className="text-emerald-500 flex items-center gap-2"><CheckCircle size={16} /> REALISASI: {formatIDR(item.totalRealisasi)}</span>
                          <span className="text-slate-400">EFISIENSI: {item.persentase.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-gray-800 h-4 rounded-full overflow-hidden shadow-inner flex border border-white/10">
                          <div 
                            className={`h-full transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(16,185,129,0.3)] ${item.persentase >= 80 ? 'bg-gradient-to-r from-emerald-500 to-green-600' : item.persentase >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-600' : 'bg-gradient-to-r from-rose-500 to-rose-700'}`}
                            style={{ width: `${Math.min(item.persentase, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center pt-4">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">Sisa Anggaran</span>
                            <span className="text-sm font-black text-rose-500 tabular-nums italic">{formatIDR(item.sisaAnggaran)}</span>
                          </div>
                          <button className="flex items-center gap-3 px-6 py-3 bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-indigo-500/20 hover:bg-indigo-600 hover:text-white transition-all">
                            RINCIAN REKENING 
                            <ChevronDown size={16} className={`transition-transform duration-700 ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-slate-100/50 dark:border-white/5 bg-slate-900/[0.02] dark:bg-black/20 p-10 space-y-12 animate-in slide-in-from-top-12 duration-1000">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-16">
                          {/* Sumber Dana Section */}
                          <div className="space-y-6 text-left">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl shadow-inner border border-emerald-500/20 font-black tracking-widest"><DollarSign size={24} /></div>
                              <h5 className="text-lg font-black tracking-tighter text-slate-700 dark:text-slate-300 uppercase">Struktur Pembiayaan</h5>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                              {item.sumberDanaList.map(sd => (
                                <div key={sd} className="group/sd flex items-center gap-4 px-6 py-5 bg-white/60 dark:bg-gray-800/60 rounded-[1.5rem] border border-slate-100 dark:border-white/5 shadow-sm transition-all hover:translate-x-2 hover:border-emerald-500/30">
                                  <div className="w-1.5 h-8 bg-emerald-500 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.5)] transition-all group-hover/sd:h-10"></div>
                                  <span className="text-xs font-black text-slate-600 dark:text-slate-300 tracking-tight leading-tight uppercase italic">{sd}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Rincian Rekening Section */}
                          <div className="space-y-6 text-left font-black">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-2xl shadow-inner border border-indigo-500/20 tracking-widest"><Layers size={24} /></div>
                              <h5 className="text-lg font-black tracking-tighter text-slate-700 dark:text-slate-300 uppercase">Audit Level Rekening</h5>
                            </div>
                            <div className="overflow-hidden rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-2xl bg-white/40 dark:bg-gray-900/60 backdrop-blur-3xl">
                              <div className="overflow-x-auto">
                                <table className="min-w-full border-collapse">
                                  <thead>
                                    <tr className="bg-slate-900/5 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                                      <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Uraian Belanja</th>
                                      <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Realisasi</th>
                                      <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Serap %</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                    {item.rekenings.map(rek => (
                                      <tr key={rek.rekening} className="hover:bg-indigo-500/[0.04] transition-colors group/row">
                                        <td className="px-8 py-4 text-[11px] font-bold text-slate-600 dark:text-slate-400 max-w-[200px] truncate leading-tight group-hover/row:text-indigo-600 transition-colors uppercase">{rek.rekening}</td>
                                        <td className="px-8 py-4 text-right text-[11px] font-black text-slate-800 dark:text-white italic tabular-nums">{formatIDR(rek.realisasi)}</td>
                                        <td className="px-8 py-4 text-right font-black">
                                          <div className={`inline-flex items-center justify-center min-w-[50px] px-3 py-1.5 rounded-xl text-[10px] tabular-nums shadow-sm border ${rek.persentase >= 80 ? 'bg-emerald-100/50 text-emerald-700 border-emerald-200' : 'bg-amber-100/50 text-amber-700 border-amber-200'}`}>
                                            {rek.persentase.toFixed(1)}%
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
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
            /* LIST VIEW TABLE - MODERN MINIMALIST */
            <div className="overflow-hidden rounded-[3.5rem] border border-slate-200/50 dark:border-white/5 shadow-2xl bg-white/40 dark:bg-gray-900/40 backdrop-blur-3xl transition-all hover:shadow-[0_80px_120px_-30px_rgba(0,0,0,0.15)]">
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-900/5 dark:bg-white/5 text-left border-b border-gray-100 dark:border-white/10">
                      <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Kode Anggaran</th>
                      <th className="px-10 py-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Sub Kegiatan / Uraian</th>
                      <th className="px-10 py-8 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Pagu PPA</th>
                      <th className="px-10 py-8 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Penyerapan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {paginatedData.map((item, idx) => (
                      <tr key={idx} className="hover:bg-indigo-500/[0.04] transition-all group cursor-pointer duration-300" onClick={() => toggleRow(`${item.subKegiatan}-${item.kodeSubKegiatan}`)}>
                        <td className="px-10 py-7 text-[10px] font-black text-slate-400 font-mono tracking-widest italic opacity-60">{item.kodeSubKegiatan}</td>
                        <td className="px-10 py-7 text-sm font-black text-slate-800 dark:text-white max-w-sm tracking-tighter leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-all uppercase">{item.subKegiatan}</td>
                        <td className="px-10 py-7 text-right font-black text-indigo-600 dark:text-indigo-400 tabular-nums italic text-base tracking-tighter">{formatIDR(item.totalAnggaran)}</td>
                        <td className="px-10 py-7 text-right">
                          <div className="flex flex-col items-end gap-2.5">
                            <div className={`px-4 py-1.5 rounded-xl text-[11px] font-black tracking-widest shadow-sm border ${item.persentase >= 80 ? 'bg-emerald-500 text-white border-emerald-600' : item.persentase >= 50 ? 'bg-amber-400 text-amber-950 border-amber-500' : 'bg-rose-500 text-white border-rose-600'}`}>
                              {item.persentase.toFixed(1)}%
                            </div>
                            <div className="w-24 bg-slate-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden flex shadow-inner border border-white/5">
                              <div className={`h-full transition-all duration-1000 ${item.persentase >= 80 ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]' : 'bg-amber-500'}`} style={{ width: `${Math.min(item.persentase, 100)}%` }} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          <div className="py-40 text-center bg-white/40 dark:bg-gray-900/40 backdrop-blur-3xl rounded-[4rem] border border-dashed border-slate-300 dark:border-white/10 animate-pulse">
            <Info size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-6" />
            <p className="font-black text-slate-400 uppercase tracking-[0.4em] text-xs italic">Menyiapkan Database Performa Unit...</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="pt-12 flex justify-center animate-in slide-in-from-bottom-8 duration-1000">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
          </div>
        )}
      </div>

      {/* FOOTER METRICS PANEL */}
      {selectedSkpd && summaryStats && (
        <div className="mt-20 p-10 bg-gradient-to-r from-indigo-900 to-slate-900 rounded-[3rem] border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]">
            <div className="flex flex-wrap items-center justify-between gap-12">
                <div className="flex flex-wrap items-center gap-12">
                    {[
                        { label: 'Cakupan Sub Kegiatan', value: summaryStats.totalItems, color: 'emerald', icon: Layers },
                        { label: 'Populasi Transaksi', value: summaryStats.totalRekening, color: 'indigo', icon: BarChart3 },
                        { label: 'Basis Pembiayaan', value: summaryStats.totalSumberDana, color: 'purple', icon: DollarSign }
                    ].map((stat, i) => (
                        <div key={i} className="flex flex-col gap-2 group cursor-default">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-2 group-hover:text-white transition-colors">
                                <stat.icon size={12} className={`text-${stat.color}-400`} /> {stat.label}
                            </p>
                            <div className="flex items-center gap-4">
                                <div className={`w-3 h-3 rounded-full bg-${stat.color}-500 shadow-[0_0_15px_#6366F1]`}></div>
                                <p className="text-3xl font-black text-white leading-none tracking-tighter">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex items-center gap-4 px-8 py-4 bg-white/5 rounded-2xl border border-white/10 group cursor-pointer hover:bg-white/10 transition-all">
                     <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                         <Info size={20} className="text-indigo-400 animate-pulse" />
                     </div>
                     <p className="text-[10px] font-black text-indigo-200 tracking-[0.2em] uppercase leading-tight">
                        Klik Kartu untuk <br/> Audit Rekening
                     </p>
                     <ArrowUpRight size={20} className="text-indigo-500 ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </div>
            </div>
        </div>
      )}
      
      <style>{`
        .shadow-inner {
            box-shadow: inset 0 2px 8px 0 rgba(0, 0, 0, 0.05);
        }
        @keyframes pulse-soft {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
        .animate-progress-glow {
            animation: pulse-soft 2s infinite ease-in-out;
        }
        select option {
            background-color: #0f172a;
            color: #f8fafc;
        }
      `}</style>
    </div>
  );
};

export default SkpdSubKegiatanStatsView;
