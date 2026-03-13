import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Area, Line, Sector
} from 'recharts';
import {
  ArrowDownCircle, Receipt, Globe, MinusCircle, Loader, Loader2,
  CalendarClock, Bot, Sparkles, AlertTriangle, RefreshCw,
  Activity, CheckCircle, ChevronRight, Info, LayoutGrid, Lightbulb,
  PieChart as PieChartIcon
} from 'lucide-react';

// --- UTILITIES & CONSTANTS ---
const formatCurrency = (value) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);
};

const MONTHS_ARRAY = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

// --- SUB-COMPONENTS ---

const SectionTitle = ({ children }) => (
  <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 border-b-2 border-blue-500 pb-2 inline-block">
    {children}
  </h2>
);
// Warna untuk chart
const ECHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];


const StatCard = ({ icon, title, target, realisasi, percentage, colorClass, rkud, nonRkud, rkudPercentage, nonRkudPercentage }) => {
  const colorStyles = {
    blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', bar: 'bg-blue-500' },
    red: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400', bar: 'bg-red-500' },
    green: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400', bar: 'bg-green-500' },
    gray: { bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', bar: 'bg-gray-500' },
  };

  const style = colorStyles[colorClass] || colorStyles.blue;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-transparent to-${style.bar}/10 rounded-bl-full -z-10 opacity-50 group-hover:scale-110 transition-transform`}></div>
      
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${style.bg}`}>
          {icon}
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${style.bg} ${style.text}`}>
          {percentage.toFixed(1)}%
        </div>
      </div>
      
      <h3 className="text-gray-500 dark:text-gray-400 text-sm font-semibold mb-1 uppercase tracking-wider">{title}</h3>
      <div className="mb-4">
        <p className="text-2xl md:text-3xl font-black text-gray-800 dark:text-white mb-1">
          {formatCurrency(realisasi)}
        </p>
        <p className="text-xs text-gray-400 font-medium">
          dari Pagu: <span className="text-gray-600 dark:text-gray-300 font-semibold">{formatCurrency(target)}</span>
        </p>
      </div>

      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mb-2 overflow-hidden flex">
        {rkud !== undefined && nonRkud !== undefined ? (
          <>
            <div className={`h-full ${style.bar}`} style={{ width: `${Math.min(rkudPercentage, 100)}%` }}></div>
            <div className="h-full bg-orange-400" style={{ width: `${Math.min(nonRkudPercentage, 100)}%` }}></div>
          </>
        ) : (
          <div className={`h-full ${style.bar} transition-all duration-1000 ease-out`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
        )}
      </div>

      {rkud !== undefined && nonRkud !== undefined && (
        <div className="flex justify-between text-[10px] md:text-xs font-medium mt-2">
          <span className="flex items-center gap-1 text-gray-500">
            <span className={`w-2 h-2 rounded-full ${style.bar}`}></span>
            RKUD: {formatCurrency(rkud)}
          </span>
          <span className="flex items-center gap-1 text-gray-500">
            <span className="w-2 h-2 rounded-full bg-orange-400"></span>
            Non: {formatCurrency(nonRkud)}
          </span>
        </div>
      )}
    </div>
  );
};

const CustomHeatmap = ({ data }) => {
  if (!data || !data.opd || data.opd.length === 0) return null;

  const getColorClass = (val) => {
    if (val === 0) return 'bg-gray-50 dark:bg-gray-800/50 text-transparent border-gray-100 dark:border-gray-700';
    if (val < 20) return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
    if (val < 50) return 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800';
    if (val < 80) return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
    return 'bg-green-500 dark:bg-green-600 text-white border-green-600 dark:border-green-700';
  };

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="min-w-[800px]">
        {/* Header Bulan */}
        <div className="flex mb-2">
          <div className="w-1/3 shrink-0 pr-4 font-bold text-gray-500 text-sm uppercase tracking-wider flex items-end">
            Nama SKPD
          </div>
          <div className="w-2/3 flex gap-1">
            {data.months.map(month => (
              <div key={month} className="flex-1 text-center font-semibold text-xs text-gray-500 pb-2 border-b border-gray-200 dark:border-gray-700">
                {month}
              </div>
            ))}
          </div>
        </div>

        {/* Rows OPD */}
        <div className="space-y-1">
          {data.opd.map((opdName, rowIndex) => (
            <div key={opdName} className="flex group hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors items-center">
              <div className="w-1/3 shrink-0 pr-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 line-clamp-1 truncate" title={opdName}>
                {opdName}
              </div>
              <div className="w-2/3 flex gap-1 h-8">
                {data.values[rowIndex].map((val, colIndex) => (
                  <div 
                    key={`${rowIndex}-${colIndex}`} 
                    className={`flex-1 flex items-center justify-center rounded text-[10px] font-bold border transition-transform hover:scale-110 cursor-help ${getColorClass(val)}`}
                    title={`${opdName} - ${data.months[colIndex]}: ${val}%`}
                  >
                    {val > 0 ? `${val}%` : ''}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-8 flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500">
          <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-gray-50 border border-gray-200"></div> 0% (Belum Ada)</span>
          <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-100 border border-red-200"></div> &lt; 20% (Kritis)</span>
          <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-orange-100 border border-orange-200"></div> 20 - 49% (Rendah)</span>
          <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-200"></div> 50 - 79% (Sedang)</span>
          <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-green-500 border border-green-600"></div> ≥ 80% (Tinggi)</span>
        </div>
      </div>
    </div>
  );
};

const GeminiAnalysis = ({ getAnalysisPrompt, disabledCondition, userCanUseAi, allData }) => {
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

const generateAnalysis = async () => {
  if (disabledCondition) return;
  
  setLoading(true);
  setError(null);

  const prompt = getAnalysisPrompt("", allData);

  try {
    
const response = await fetch('/api/gemini', { 
    method: 'POST', // WAJIB POST
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        contents: [{ 
            parts: [{ text: prompt }] 
        }]
    })
});

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Gagal menghubungi AI");
    }

    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    setAnalysis(text || "Gagal menghasilkan analisis.");

  } catch (err) {
    setError(err.message || "Gagal menghubungi layanan AI.");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-900 dark:to-indigo-900/20 p-6 md:p-8 rounded-3xl border border-indigo-100 dark:border-indigo-900/50 mb-8 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-indigo-500/30 shadow-lg">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-xl text-gray-800 dark:text-gray-100 flex items-center gap-2">
              AI Insight: Analisis Eksekutif
              <Sparkles className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Ringkasan cerdas performa APBD berdasarkan data terkini</p>
          </div>
        </div>
        <button
          onClick={generateAnalysis}
          disabled={loading || disabledCondition || (userCanUseAi === false)}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
            loading || disabledCondition || (userCanUseAi === false)
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-xl hover:-translate-y-0.5 active:scale-95'
          }`}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
          {analysis ? 'Analisis Ulang' : 'Mulai Analisis AI'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-2xl mb-4 text-sm font-medium border border-red-200 dark:border-red-800">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {analysis ? (
        <div className="prose prose-indigo dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap bg-white/70 dark:bg-gray-800/70 p-6 rounded-2xl backdrop-blur-md border border-white/50 dark:border-gray-700/50 shadow-inner">
          {analysis}
        </div>
      ) : (
        !loading && (
          <div className="bg-white/50 dark:bg-gray-800/50 p-6 rounded-2xl border border-dashed border-indigo-200 dark:border-indigo-800/50 text-center">
            <Info className="w-8 h-8 text-indigo-400 mx-auto mb-2 opacity-50" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Belum ada analisis yang dibuat. Tekan tombol di atas untuk memerintahkan AI menganalisis data keuangan secara otomatis.
            </p>
          </div>
        )
      )}
      
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <p className="text-indigo-600 dark:text-indigo-400 font-bold animate-pulse">Sedang merumuskan evaluasi dan rekomendasi strategis...</p>
        </div>
      )}
    </div>
  );
};

// --- CUSTOM TOOLTIP UNTUK CHART SUMBER DANA ---
const CustomSumberDanaTooltip = ({ active, payload, totalAnggaran }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const percentPagu = totalAnggaran > 0 ? ((data.value / totalAnggaran) * 100).toFixed(2) : 0;
    const percentRealisasi = data.value > 0 ? ((data.realisasi / data.value) * 100).toFixed(2) : 0;

    return (
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl p-5 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 min-w-[280px] z-50 relative">
        <div className="flex items-center gap-3 mb-4 border-b border-gray-100 dark:border-gray-800 pb-3">
          <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: payload[0].payload.fill }}></div>
          <p className="font-bold text-gray-800 dark:text-gray-100 text-sm max-w-[220px] break-words line-clamp-2">{data.name}</p>
        </div>
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-gray-500 dark:text-gray-400 font-medium">Pagu Anggaran</span>
              <span className="font-bold text-gray-800 dark:text-gray-200">{formatCurrency(data.value)}</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
              <div className="bg-blue-400 h-1.5 rounded-full" style={{ width: `${Math.min(percentPagu, 100)}%` }}></div>
            </div>
            <p className="text-right text-[10px] text-gray-400 mt-1">{percentPagu}% dari Total Pagu</p>
          </div>

          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-gray-500 dark:text-gray-400 font-medium">Nilai Realisasi</span>
              <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(data.realisasi)}</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
              <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${Math.min(percentRealisasi, 100)}%` }}></div>
            </div>
            <p className="text-right text-[10px] text-gray-400 mt-1">Serapan: {percentRealisasi}%</p>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// --- CUSTOM LEGEND UNTUK CHART SUMBER DANA AGAR RAPI ---
const renderCustomLegend = (props) => {
  const { payload } = props;
  return (
    <div className="max-h-[400px] overflow-y-auto pr-2 space-y-3 flex flex-col justify-center scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
      {payload.map((entry, index) => (
        <div key={`item-${index}`} className="flex items-start gap-3 cursor-help group" title={`${entry.value} - Pagu: ${formatCurrency(entry.payload.value)}`}>
          <div className="w-3.5 h-3.5 rounded-full shrink-0 mt-0.5 group-hover:scale-125 transition-transform" style={{ backgroundColor: entry.color }}></div>
          <span className="text-xs text-gray-600 dark:text-gray-400 font-medium leading-snug break-words line-clamp-3 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// --- MAIN VIEW COMPONENT ---

const DashboardView = ({ data = {}, theme, selectedYear, namaPemda, lastUpdate, userRole, includeNonRKUD, totalRealisasiNonRKUD = 0, userCanUseAi }) => {
  const { anggaran, pendapatan, penerimaanPembiayaan, pengeluaranPembiayaan, realisasi, realisasiPendapatan, realisasiNonRkud } = data;
  const [activeTab, setActiveTab] = useState('overview');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [showAnalysis, setShowAnalysis] = useState(true);
  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(-1);
  };
  if (!anggaran || !pendapatan || !realisasi || !realisasiPendapatan) {
    return (
      <div className="flex flex-col justify-center items-center h-96 gap-4">
        <Loader className="animate-spin text-blue-500" size={48} />
        <p className="text-gray-500 font-medium animate-pulse">Memuat Data Dashboard Eksekutif...</p>
      </div>
    );
  }
  
  const lastUpdateString = lastUpdate 
    ? new Date(lastUpdate).toLocaleDateString('id-ID', {
        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute:'2-digit'
      }) + ' WIB'
    : 'Belum Tersedia';
  
  const {
      totalAnggaran,
      totalPendapatan,
      totalRealisasiBelanja,
      totalGabunganBelanja,
      totalRealisasiPendapatan,
      totalPenerimaanPembiayaan,
      totalPengeluaranPembiayaan
  } = useMemo(() => {
      const totalAnggaran = (anggaran || []).reduce((sum, item) => sum + (item.nilai || 0), 0);
      const totalPendapatan = (pendapatan || []).reduce((sum, item) => sum + (item.nilai || 0), 0);
      
      const totalRealisasiBelanja = Object.values(realisasi || {}).flat().reduce((sum, item) => sum + (item.nilai || 0), 0);
      const totalGabunganBelanja = includeNonRKUD ? totalRealisasiBelanja + totalRealisasiNonRKUD : totalRealisasiBelanja;
      
      const totalRealisasiPendapatan = Object.values(realisasiPendapatan || {}).flat().reduce((sum, item) => sum + (item.nilai || 0), 0);
      const totalPenerimaanPembiayaan = (penerimaanPembiayaan || []).reduce((sum, item) => sum + (item.nilai || 0), 0);
      const totalPengeluaranPembiayaan = (pengeluaranPembiayaan || []).reduce((sum, item) => sum + (item.nilai || 0), 0);

      return {
          totalAnggaran, totalPendapatan, totalRealisasiBelanja,
          totalGabunganBelanja, totalRealisasiPendapatan, totalPenerimaanPembiayaan, totalPengeluaranPembiayaan
      };
  }, [anggaran, pendapatan, penerimaanPembiayaan, pengeluaranPembiayaan, realisasi, realisasiPendapatan, includeNonRKUD, totalRealisasiNonRKUD]);
  
  // ============= HEATMAP DATA =============
  const heatmapData = useMemo(() => {
    if (!realisasi || Object.keys(realisasi).length === 0) return null;

    const bulanTersedia = Object.keys(realisasi);
    const mappingBulan = {
      'Januari': 0, 'Februari': 1, 'Maret': 2, 'April': 3, 'Mei': 4, 'Juni': 5,
      'Juli': 6, 'Agustus': 7, 'September': 8, 'Oktober': 9, 'November': 10, 'Desember': 11
    };
    
    const bulanTerurut = bulanTersedia.sort((a, b) => mappingBulan[a] - mappingBulan[b]);
    const bulanDisplay = {
      'Januari': 'Jan', 'Februari': 'Feb', 'Maret': 'Mar', 'April': 'Apr',
      'Mei': 'Mei', 'Juni': 'Jun', 'Juli': 'Jul', 'Agustus': 'Agu',
      'September': 'Sep', 'Oktober': 'Okt', 'November': 'Nov', 'Desember': 'Des'
    };
    const months = bulanTerurut.map(b => bulanDisplay[b] || b.substring(0, 3));

    const skpdSet = new Set();
    Object.entries(realisasi).forEach(([bulan, items]) => {
      if (Array.isArray(items)) {
        items.forEach(item => {
          if (item.NamaSKPD) skpdSet.add(item.NamaSKPD);
        });
      }
    });

    const skpdList = Array.from(skpdSet).slice(0, 15);
    if (skpdList.length === 0) return null;
    
    const paguPerSKPD = {};
    (anggaran || []).forEach(item => {
      const skpd = item.NamaSKPD || 'Tanpa SKPD';
      paguPerSKPD[skpd] = (paguPerSKPD[skpd] || 0) + (item.nilai || 0);
    });
    
    const values = skpdList.map(skpd => {
      let akumulasi = 0;
      const pagu = paguPerSKPD[skpd] || 0;
      
      const nilaiPerBulan = bulanTerurut.map((namaBulan) => {
        const bulanKey = namaBulan;
        const bulanItems = realisasi[bulanKey] || [];
        
        const realisasiBulanIni = bulanItems
          .filter(item => item.NamaSKPD === skpd)
          .reduce((sum, item) => sum + (item.nilai || 0), 0);
        
        akumulasi += realisasiBulanIni;
        
        if (pagu > 0 && akumulasi > 0) {
          const persentase = (akumulasi / pagu) * 100;
          if (persentase < 1 && persentase > 0) return 1;
          return Math.min(100, Math.round(persentase));
        }
        return 0;
      });
      return nilaiPerBulan;
    });

    return { months, opd: skpdList, values };
  }, [realisasi, anggaran]);
  
  const penyerapanAnggaranPercentage = totalAnggaran > 0 ? (totalGabunganBelanja / totalAnggaran) * 100 : 0;
  const pencapaianPendapatanPercentage = totalPendapatan > 0 ? (totalRealisasiPendapatan / totalPendapatan) * 100 : 0;
  const penyerapanRkudPercentage = totalAnggaran > 0 ? (totalRealisasiBelanja / totalAnggaran) * 100 : 0;
  const penyerapanNonRkudPercentage = totalAnggaran > 0 ? (totalRealisasiNonRKUD / totalAnggaran) * 100 : 0;

  // ============= PERBAIKAN DATA SUMBER DANA =============
  // Menghimpun Pagu dan Realisasi sekaligus dengan fallback key yang lebih luas
  const sumberDanaData = useMemo(() => {
    const danaMap = new Map();

    
    // Mapping Pagu Anggaran
    (anggaran || []).forEach(item => {
        // Cek berbagai kemungkinan nama key dari API Backend
        const sumber = item.NamaSumberDana || item.SumberDana || item.sumber_dana || item.sumberDana || 'Tidak Diketahui';
        if (!danaMap.has(sumber)) danaMap.set(sumber, { name: sumber, value: 0, realisasi: 0 });
        danaMap.get(sumber).value += (item.nilai || 0);
    });

    // Mapping Realisasi RKUD
    Object.values(realisasi || {}).flat().forEach(item => {
        const sumber = item.NamaSumberDana || item.SumberDana || item.sumber_dana || item.sumberDana || 'Tidak Diketahui';
        if (!danaMap.has(sumber)) {
            danaMap.set(sumber, { name: sumber, value: 0, realisasi: 0 });
        }
        danaMap.get(sumber).realisasi += (item.nilai || item.realisasi || 0);
    });

    // Mapping Realisasi Non-RKUD
    if (realisasiNonRkud) {
        Object.values(realisasiNonRkud || {}).flat().forEach(item => {
            const sumber = item.NamaSumberDana || item.SumberDana || item.sumber_dana || item.sumberDana || 'Tidak Diketahui';
            if (!danaMap.has(sumber)) {
                danaMap.set(sumber, { name: sumber, value: 0, realisasi: 0 });
            }
            danaMap.get(sumber).realisasi += (item.nilai || item.realisasi || 0);
        });
    }

    return Array.from(danaMap.values()).sort((a, b) => b.value - a.value);
  }, [anggaran, realisasi, realisasiNonRkud]);

  // Data untuk grafik APBD utama
const apbdChartData = useMemo(() => {
    return [
        {
            name: 'Pendapatan',
            Target: totalPendapatan,
            Realisasi: totalRealisasiPendapatan
        },
        {
            name: 'Belanja',
            Target: totalAnggaran,
            Realisasi: totalGabunganBelanja
        },
        {
            name: 'Pembiayaan Netto',
            Target: totalPenerimaanPembiayaan - totalPengeluaranPembiayaan,
            Realisasi: 0 // Realisasi pembiayaan mungkin perlu disesuaikan
        }
    ];
}, [totalPendapatan, totalRealisasiPendapatan, totalAnggaran, totalGabunganBelanja, totalPenerimaanPembiayaan, totalPengeluaranPembiayaan]);

  const anggaranPerSkpd = useMemo(() => {
    const skpdMap = new Map();
    (anggaran || []).forEach(item => {
        const skpd = item.NamaSKPD || 'Tanpa SKPD';
        const currentValue = skpdMap.get(skpd) || 0;
        skpdMap.set(skpd, currentValue + (item.nilai || 0));
    });
    return Array.from(skpdMap, ([NamaSKPD, nilai]) => ({ NamaSKPD, nilai }))
                .sort((a, b) => b.nilai - a.nilai);
  }, [anggaran]);
  
  const pendapatanPerOpd = useMemo(() => {
    const opdMap = new Map();
    (pendapatan || []).forEach(item => {
        const opd = item.NamaOPD || 'Tanpa OPD';
        const currentValue = opdMap.get(opd) || 0;
        opdMap.set(opd, currentValue + (item.nilai || 0));
    });
    return Array.from(opdMap, ([NamaOPD, nilai]) => ({ NamaOPD, nilai }))
                .sort((a, b) => b.nilai - a.nilai);
  }, [pendapatan]);

  const getDashboardAnalysisPrompt = (query, allData) => {
  // Data sudah diterima dari props allData
  const { 
    totalPendapatan, 
    totalRealisasiPendapatan, 
    totalAnggaran, 
    totalGabunganBelanja,
    totalRealisasiBelanja,
    totalRealisasiNonRKUD 
  } = allData;
  
  const persenPendapatan = totalPendapatan > 0 ? ((totalRealisasiPendapatan / totalPendapatan) * 100).toFixed(2) : 0;
  const persenBelanja = totalAnggaran > 0 ? ((totalGabunganBelanja / totalAnggaran) * 100).toFixed(2) : 0;
  const sisaAnggaran = totalAnggaran - totalGabunganBelanja;
  
  // Jika user mengirim query khusus
  if (query && query.trim() !== '') {
    return `Jawab pertanyaan ini berdasarkan data APBD ${namaPemda || 'Pemerintah Daerah'} tahun ${selectedYear}:
    
    DATA TERKINI:
    - Pendapatan: Target ${formatCurrency(totalPendapatan)} | Realisasi ${formatCurrency(totalRealisasiPendapatan)} (${persenPendapatan}%)
    - Belanja: Pagu ${formatCurrency(totalAnggaran)} | Realisasi ${formatCurrency(totalGabunganBelanja)} (${persenBelanja}%)
    - Sisa Anggaran: ${formatCurrency(sisaAnggaran)}
    
    PERTANYAAN: ${query}
    
    Berikan jawaban yang spesifik, profesional, dan berdasarkan data di atas.`;
  }
  
  // Analisis default (tanpa query)
  return `ANALISIS EKSEKUTIF APBD ${namaPemda || 'Pemerintah Daerah'} TAHUN ${selectedYear}

DATA RINGKAS:
┌────────────────────────────┬─────────────────┬─────────────────┬──────────┐
│ Komponen                   │ Target/Pagu     │ Realisasi       │ % Capaian│
├────────────────────────────┼─────────────────┼─────────────────┼──────────┤
│ Pendapatan Daerah          │ ${formatCurrency(totalPendapatan)} │ ${formatCurrency(totalRealisasiPendapatan)} │ ${persenPendapatan}%     │
│ Belanja Daerah             │ ${formatCurrency(totalAnggaran)} │ ${formatCurrency(totalGabunganBelanja)} │ ${persenBelanja}%     │
│ Sisa Anggaran (SiLPA)      │ -               │ ${formatCurrency(sisaAnggaran)} │ -        │
└────────────────────────────┴─────────────────┴─────────────────┴──────────┘

RINCIAN BELANJA:
- Realisasi RKUD: ${formatCurrency(totalRealisasiBelanja)} (${totalAnggaran > 0 ? ((totalRealisasiBelanja/totalAnggaran)*100).toFixed(2) : 0}%)
- Realisasi Non RKUD: ${formatCurrency(totalRealisasiNonRKUD)} (${totalAnggaran > 0 ? ((totalRealisasiNonRKUD/totalAnggaran)*100).toFixed(2) : 0}%)

BERIKAN ANALISIS MENDALAM MENGENAI:
1. Peringatan Utama (Early Warning): Identifikasi 1-2 risiko fiskal paling kritis berdasarkan data di atas.
2. Evaluasi Kinerja: Apakah realisasi pendapatan dan belanja sesuai dengan target?
3. Rekomendasi Strategis: 3 langkah konkret yang harus diambil oleh Kepala Daerah/Sekda.
4. Catatan Tambahan: Poin penting lainnya untuk rapat pimpinan.

Gunakan bahasa profesional, langsung ke inti, tanpa basa-basi.`;
};

  const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 8}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          cornerRadius={6}
          style={{ filter: `drop-shadow(0px 4px 10px ${fill}60)`, zIndex: 10 }}
        />
      </g>
    );
  };

  return (
    <div className="space-y-8 max-w-full p-2 md:p-6 bg-gray-50/30 dark:bg-transparent min-h-screen">
        {/* DEFINISI GRADIENT SVG UNTUK EFEK MODERN ECHARTS */}
        <svg width="0" height="0">
          <defs>
            <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#94A3B8" stopOpacity={0.8}/>
              <stop offset="100%" stopColor="#94A3B8" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorRealisasi" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity={1}/>
              <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.4}/>
            </linearGradient>
            <linearGradient id="colorHorizontalBarRed" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FCA5A5" stopOpacity={0.8}/>
              <stop offset="100%" stopColor="#EF4444" stopOpacity={1}/>
            </linearGradient>
            <linearGradient id="colorHorizontalBarGreen" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6EE7B7" stopOpacity={0.8}/>
              <stop offset="100%" stopColor="#10B981" stopOpacity={1}/>
            </linearGradient>
          </defs>
        </svg>

        {/* BANNER STATUS UPDATE */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 rounded-3xl p-6 shadow-xl shadow-blue-500/20 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mt-20 -mr-20"></div>
          
          <div className="flex items-center gap-5 relative z-10">
             <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner">
                <CalendarClock className="w-8 h-8 md:w-10 md:h-10 text-white" />
             </div>
             <div>
                <p className="text-blue-100 text-sm md:text-base font-medium uppercase tracking-widest mb-1 flex items-center gap-2">
                  <Activity size={16} /> Status Data Dashboard
                </p>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight flex flex-col md:flex-row md:items-center gap-2">
                  Terakhir Diperbarui: 
                  <span className="text-yellow-300 drop-shadow-sm">{lastUpdateString}</span>
                </h2>
             </div>
          </div>
          
          <div className="relative z-10 w-full md:w-auto flex items-center justify-center gap-3 bg-black/20 hover:bg-black/30 transition-colors px-6 py-3 rounded-xl backdrop-blur-sm border border-white/10">
             <div className="relative flex h-3 w-3">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
             </div>
             <span className="text-sm font-bold tracking-wide">SINKRONISASI AKTIF</span>
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
  
  {/* Indikator Data Terbaru */}
  {lastUpdate && showAnalysis && (
    <div className="text-xs text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-2 bg-white/30 dark:bg-gray-800/30 p-2 rounded-lg">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
      </span>
      <span>Data diperbarui: {new Date(lastUpdate).toLocaleString('id-ID', {
        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
      })} WIB</span>
    </div>
  )}
  
  {/* Komponen GeminiAnalysis dengan Conditional Rendering */}
  {showAnalysis && (
    <GeminiAnalysis 
        getAnalysisPrompt={getDashboardAnalysisPrompt} 
        disabledCondition={totalAnggaran === 0 && totalPendapatan === 0} 
        userCanUseAi={userCanUseAi}
        allData={{
            totalPendapatan,
            totalRealisasiPendapatan,
            totalAnggaran,
            totalGabunganBelanja,
            totalRealisasiBelanja,
            totalRealisasiNonRKUD
        }}
    />
  )}
</div>

        {/* TAB NAVIGASI */}
        <div className="flex justify-center md:justify-start mb-8">
          <div className="bg-white dark:bg-gray-800 p-1.5 rounded-2xl inline-flex shadow-sm border border-gray-100 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 py-2.5 px-6 rounded-xl font-bold text-sm transition-all duration-300 ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Activity size={18} /> Ringkasan Eksekutif
            </button>
            <button
              onClick={() => setActiveTab('heatmap')}
              className={`flex items-center gap-2 py-2.5 px-6 rounded-xl font-bold text-sm transition-all duration-300 ${
                activeTab === 'heatmap'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <LayoutGrid size={18} /> Heatmap SKPD
            </button>
          </div>
        </div>

        {/* KONTEN */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'overview' ? (
            /* ===== TAB OVERVIEW ===== */
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                <StatCard 
                    icon={<ArrowDownCircle size={28} />}
                    title="Pendapatan Daerah"
                    target={totalPendapatan}
                    realisasi={totalRealisasiPendapatan}
                    percentage={pencapaianPendapatanPercentage}
                    colorClass="blue"
                />
                <StatCard 
                    icon={<Receipt size={28} />}
                    title="Belanja Daerah"
                    target={totalAnggaran}
                    realisasi={totalGabunganBelanja}
                    percentage={penyerapanAnggaranPercentage}
                    colorClass="red"
                    rkud={totalRealisasiBelanja}
                    nonRkud={totalRealisasiNonRKUD}
                    rkudPercentage={penyerapanRkudPercentage}
                    nonRkudPercentage={penyerapanNonRkudPercentage}
                />
                <StatCard 
                    icon={<Globe size={28} />}
                    title="Penerimaan Pembiayaan"
                    target={totalPenerimaanPembiayaan}
                    realisasi={0}
                    percentage={0}
                    colorClass="gray"
                />
                <StatCard 
                    icon={<MinusCircle size={28} />}
                    title="Pengeluaran Pembiayaan"
                    target={totalPengeluaranPembiayaan}
                    realisasi={0}
                    percentage={0}
                    colorClass="green"
                />
              </div>

              {/* Grafik APBD Utama */}
              <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 mb-8">
                  <h3 className="text-xl font-black text-gray-800 dark:text-white mb-6 flex items-center gap-3 border-l-4 border-blue-500 pl-4">
                    Struktur Anggaran vs Realisasi APBD
                  </h3>
                  <div className="w-full">
                    <ResponsiveContainer width="99%" height={450}>
                        <ComposedChart data={apbdChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128, 128, 128, 0.15)" />
                            <XAxis dataKey="name" tick={{ fontSize: 13, fontWeight: 600, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} dy={10} />
                            <YAxis tickFormatter={(val) => `${(val / 1e9).toFixed(1)} M`} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                            <Tooltip 
                              formatter={(value) => [formatCurrency(value), '']} 
                              cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                              contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend wrapperStyle={{paddingTop: '20px', fontWeight: 600, color: '#475569'}} iconType="circle"/>
                            
                            {/* Background Bar (Target) */}
                            <Bar dataKey="Target" fill="url(#colorTarget)" name="Target/Pagu" radius={[6, 6, 0, 0]} barSize={50} />
                            {/* Foreground Bar (Realisasi) inside the Target */}
                            <Bar dataKey="Realisasi" fill="url(#colorRealisasi)" name="Realisasi" radius={[6, 6, 0, 0]} barSize={50} />
                            
                            {/* Line overlay to indicate a continuous trend/marker if needed */}
                            <Line type="monotone" dataKey="Realisasi" stroke="#2563EB" strokeWidth={3} dot={{ r: 6, fill: '#2563EB', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 8 }} name="Tren Realisasi" />
                        </ComposedChart>
                    </ResponsiveContainer>
                  </div>
              </div>

              {/* Grid Charts Bawah */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700">
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                        <span className="w-2 h-6 bg-red-500 rounded-full inline-block shadow-sm shadow-red-500/50"></span>
                        Anggaran Belanja per SKPD (Top 10)
                      </h3>
                      <div className="w-full">
                        <ResponsiveContainer width="99%" height={450}>
                            <BarChart data={anggaranPerSkpd.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="5 5" horizontal={false} stroke="rgba(128, 128, 128, 0.15)" />
                                <XAxis type="number" tickFormatter={(val) => `${(val / 1e9).toFixed(0)}M`} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis type="category" dataKey="NamaSKPD" tick={{ fontSize: 11, fontWeight: 600, fill: '#475569', width: 110 }} interval={0} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                                <Tooltip 
                                  formatter={(value) => [formatCurrency(value), 'Anggaran']}
                                  cursor={{ fill: 'rgba(239, 68, 68, 0.05)' }}
                                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 4px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="nilai" name="Anggaran" fill="url(#colorHorizontalBarRed)" radius={[0, 6, 6, 0]} barSize={18} />
                            </BarChart>
                        </ResponsiveContainer>
                      </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700">
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                        <span className="w-2 h-6 bg-green-500 rounded-full inline-block shadow-sm shadow-green-500/50"></span>
                        Target Pendapatan per OPD (Top 10)
                      </h3>
                      <div className="w-full">
                        <ResponsiveContainer width="99%" height={450}>
                            <BarChart data={pendapatanPerOpd.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="5 5" horizontal={false} stroke="rgba(128, 128, 128, 0.15)" />
                                <XAxis type="number" tickFormatter={(val) => `${(val / 1e9).toFixed(0)}M`} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis type="category" dataKey="NamaOPD" tick={{ fontSize: 11, fontWeight: 600, fill: '#475569', width: 110 }} interval={0} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                                <Tooltip 
                                  formatter={(value) => [formatCurrency(value), 'Target']}
                                  cursor={{ fill: 'rgba(16, 185, 129, 0.05)' }}
                                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 4px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="nilai" name="Target Pendapatan" fill="url(#colorHorizontalBarGreen)" radius={[0, 6, 6, 0]} barSize={18} />
                            </BarChart>
                        </ResponsiveContainer>
                      </div>
                  </div>
              </div>

              {/* Sumber Dana Chart (ECharts Modern Rounded Donut Style) */}
              <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 mt-8">
                  <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 border-b border-gray-100 dark:border-gray-700 pb-4">
                    <div>
                      <h3 className="text-xl font-black text-gray-800 dark:text-white flex items-center gap-3">
                        <PieChartIcon className="text-purple-500 w-6 h-6" />
                        Pagu & Realisasi Berdasarkan Sumber Dana
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 ml-9">
                        Sorot (hover) potongan grafik untuk melihat detail pagu, realisasi, dan persentase serapan
                      </p>
                    </div>
                  </div>
                  
                  <div className="w-full flex justify-center relative">
                    <ResponsiveContainer width="99%" height={450}>
                        <PieChart>
                            <Tooltip content={<CustomSumberDanaTooltip totalAnggaran={totalAnggaran} />} />
                            <Legend 
                              content={renderCustomLegend}
                              layout="vertical" 
                              verticalAlign="middle" 
                              align="right"
                              wrapperStyle={{ width: '55%', right: 0, top: '50%', transform: 'translateY(-50%)' }}
                            />
                            <Pie
                              data={sumberDanaData}
                              cx="35%"
                              cy="50%"
                              innerRadius={110}
                              outerRadius={160}
                              paddingAngle={4}
                              cornerRadius={6}
                              dataKey="value"
                              stroke="none"
                              labelLine={false}
                              activeIndex={activeIndex}
                              activeShape={renderActiveShape}
                              onMouseEnter={onPieEnter}
                              onMouseLeave={onPieLeave}
                            >
                                {sumberDanaData.map((entry, index) => (
                                    <Cell 
                                      key={`cell-${index}`} 
                                      fill={ECHART_COLORS[index % ECHART_COLORS.length]} 
                                      style={{ outline: 'none', transition: 'all 0.3s ease', cursor: 'pointer' }}
                                    />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    
                    {/* Inner Label for Donut Center */}
                    <div className="absolute top-1/2 left-[35%] -translate-x-1/2 -translate-y-1/2 pointer-events-none text-center flex flex-col items-center justify-center">
                        <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Pagu</p>
                        <p className="text-lg md:text-xl font-black text-gray-800 dark:text-white leading-tight">
                            {formatCurrency(totalAnggaran)}
                        </p>
                    </div>
                  </div>
              </div>
            </>
          ) : (
            /* ===== TAB HEATMAP ===== */
            <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-gray-100 dark:border-gray-700 pb-6">
                <div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <Activity className="text-blue-500" />
                    Heatmap Penyerapan per SKPD
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Visualisasi tren kumulatif realisasi anggaran {selectedYear ? `Tahun ${selectedYear}` : ''}
                  </p>
                </div>
              </div>

              {/* Tambahan Penjelasan Eksekutif */}
              <div className="mb-8 bg-blue-50/60 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 p-6 rounded-2xl">
                 <h4 className="flex items-center gap-2 font-bold text-blue-800 dark:text-blue-300 mb-3 text-lg">
                    <Lightbulb className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    Panduan Strategis Eksekutif (Bupati/Walikota/Sekda)
                 </h4>
                 <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-2 ml-1 leading-relaxed">
                    <li>
                      <strong className="text-gray-900 dark:text-gray-100">Deteksi Dini Masalah:</strong> Perhatikan SKPD dengan rentetan warna <span className="inline-block px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-bold mx-1">Merah (&lt; 20%)</span> atau <span className="inline-block px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-bold mx-1">Oranye</span> yang bertahan melewati kuartal kedua/ketiga. Ini indikasi kuat terhambatnya eksekusi kegiatan.
                    </li>
                    <li>
                      <strong className="text-gray-900 dark:text-gray-100">Analisis Tren Stagnan:</strong> Jika persentase bulan ke bulan tidak berubah (atau hanya naik tipis), SKPD kemungkinan terkendala proses lelang, kendala teknis administrasi, atau penagihan yang menumpuk di akhir tahun.
                    </li>
                    <li>
                      <strong className="text-gray-900 dark:text-gray-100">Tindak Lanjut Rapim:</strong> Gunakan data dari blok berwarna ini sebagai bahan evaluasi kinerja SKPD secara objektif dalam Rapat Pimpinan. Kepala SKPD dengan penyerapan dominan merah memerlukan intervensi langsung.
                    </li>
                 </ul>
              </div>

              {heatmapData && heatmapData.opd.length > 0 ? (
                <CustomHeatmap data={heatmapData} />
              ) : (
                <div className="text-center py-24 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                  <div className="mx-auto w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle className="w-8 h-8 text-orange-400" />
                  </div>
                  <p className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Data Realisasi Bulanan Belum Tersedia
                  </p>
                  <p className="text-sm text-gray-500 max-w-md mx-auto">
                    Sistem membutuhkan data realisasi per SKPD beserta rincian bulannya untuk memetakan tren heatmap penyerapan.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
    </div>
  );
};

export default DashboardView;
