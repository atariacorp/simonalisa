import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, AreaChart, Area, Cell, Line, ComposedChart,
  LineChart
} from 'recharts';
import { 
  Loader, TrendingUp, Calendar, Building2, Wallet, 
  ArrowUpRight, ArrowDownRight, LayoutDashboard, Info, ChevronRight,
  Zap, Clock, Sparkles, MessageSquare, ShieldCheck, BarChart3,
  LineChart as LineChartIcon, PieChart, Target, Eye, Activity, Layers,
  AlertTriangle, CheckCircle, Gauge, Brain, Download, Filter,
  Table as TableIcon, Grid3x3, TrendingDown, DollarSign, Landmark,
  PiggyBank, Percent, BadgePercent, ChartNoAxesCombined, 
  ChartLine, ChartBar, ChartPie, ChartScatter, Presentation,
  Heart, Search, X 
} from 'lucide-react';

// Import utilities
import { db, auth } from '../utils/firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import { formatIDR } from '../utils/formatCurrency';
import GeminiAnalysis from '../components/GeminiAnalysis';

// ============= UTILITIES & CONSTANTS =============
const SectionTitle = ({ children }) => (
  <div className="relative mb-8 group">
    <h2 className="text-3xl font-black tracking-tighter text-slate-800 dark:text-white transition-all">
      {children}
    </h2>
    <div className="absolute -bottom-2 left-0 h-1.5 w-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all group-hover:w-24"></div>
  </div>
);

const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

// ============= FUNGSI STATISTIK =============
const calculateLinearRegression = (data) => {
  // data: array of { x: number (month index), y: number (realization) }
  const n = data.length;
  if (n < 2) return null;
  
  const sumX = data.reduce((sum, d) => sum + d.x, 0);
  const sumY = data.reduce((sum, d) => sum + d.y, 0);
  const sumXY = data.reduce((sum, d) => sum + d.x * d.y, 0);
  const sumX2 = data.reduce((sum, d) => sum + d.x * d.x, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return { slope, intercept };
};

const calculateRunRateProjection = (monthlyData, targetYearly) => {
  const realizedMonths = monthlyData.filter(v => v > 0).length;
  if (realizedMonths === 0) return { projection: 0, variance: 0, variancePercent: 0 };
  
  const totalRealized = monthlyData.reduce((a, b) => a + b, 0);
  const monthlyAverage = totalRealized / realizedMonths;
  const annualProjection = monthlyAverage * 12;
  
  return {
    projection: annualProjection,
    variance: annualProjection - targetYearly,
    variancePercent: targetYearly > 0 ? ((annualProjection - targetYearly) / targetYearly) * 100 : 0
  };
};

const calculateGiniCoefficient = (values) => {
  // Sederhana: rasio antara jumlah nilai tertinggi vs total
  if (!values || values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  let numerator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (i + 1) * sorted[i];
  }
  const sum = sorted.reduce((a, b) => a + b, 0);
  if (sum === 0) return 0;
  const gini = (2 * numerator) / (n * sum) - (n + 1) / n;
  return Math.max(0, Math.min(1, gini));
};

// ============= SUB-COMPONENTS =============
const VarianceCard = ({ title, target, realization, projection, formatFn }) => {
  const variance = realization - target;
  const variancePercent = target !== 0 ? (variance / target) * 100 : 0;
  const projectionVariance = projection - target;
  const projectionVariancePercent = target !== 0 ? (projectionVariance / target) * 100 : 0;
  
  return (
    <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-5 rounded-2xl border border-white/30 dark:border-white/5">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-3">{title}</p>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-[8px] text-slate-400">Target</p>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{formatFn(target)}</p>
        </div>
        <div>
          <p className="text-[8px] text-slate-400">Realisasi</p>
          <p className="text-xs font-bold text-indigo-600">{formatFn(realization)}</p>
        </div>
        <div>
          <p className="text-[8px] text-slate-400">Proyeksi</p>
          <p className="text-xs font-bold text-amber-600">{formatFn(projection)}</p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div className={`flex items-center gap-1 text-[9px] font-bold ${variance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {variance >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
          {Math.abs(variancePercent).toFixed(1)}% dari target
        </div>
        <div className={`flex items-center gap-1 text-[9px] font-bold ${projectionVariance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          Proyeksi: {projectionVariance >= 0 ? '+' : ''}{projectionVariancePercent.toFixed(1)}%
        </div>
      </div>
    </div>
  );
};

const EffectivenessCard = ({ capitalExpenditure, operationalExpenditure, totalExpenditure }) => {
  const capitalRatio = totalExpenditure > 0 ? (capitalExpenditure / totalExpenditure) * 100 : 0;
  const operationalRatio = totalExpenditure > 0 ? (operationalExpenditure / totalExpenditure) * 100 : 0;
  
  let status = { text: '', color: '', icon: null };
  if (capitalRatio >= 30) {
    status = { text: 'Investasi infrastruktur sangat baik', color: 'text-emerald-600', icon: <CheckCircle size={14} /> };
  } else if (capitalRatio >= 20) {
    status = { text: 'Investasi infrastruktur cukup', color: 'text-amber-600', icon: <Activity size={14} /> };
  } else {
    status = { text: 'Belanja operasi mendominasi, perlu perhatian', color: 'text-rose-600', icon: <AlertTriangle size={14} /> };
  }
  
  return (
    <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-5 rounded-2xl border border-white/30 dark:border-white/5">
      <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
        <Gauge size={12} /> Efektivitas Belanja
      </h4>
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-[10px] mb-1">
            <span>Belanja Modal</span>
            <span className="font-bold">{capitalRatio.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${Math.min(capitalRatio, 100)}%` }}></div>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[10px] mb-1">
            <span>Belanja Operasi</span>
            <span className="font-bold">{operationalRatio.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${Math.min(operationalRatio, 100)}%` }}></div>
          </div>
        </div>
        <div className={`flex items-center gap-2 text-[9px] font-bold ${status.color} pt-2 border-t border-slate-200 dark:border-slate-700`}>
          {status.icon}
          {status.text}
        </div>
      </div>
    </div>
  );
};

const HealthIndicator = ({ label, value, description, status }) => {
  const statusColors = {
    good: 'bg-emerald-500',
    warning: 'bg-amber-500',
    critical: 'bg-rose-500'
  };
  
  return (
    <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-4 rounded-xl border border-white/30">
      <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-xl font-black text-slate-800 dark:text-white">{value}</p>
      <p className="text-[9px] text-slate-500 mt-1">{description}</p>
      <div className={`w-2 h-2 rounded-full mt-2 ${statusColors[status] || 'bg-slate-400'}`}></div>
    </div>
  );
};

const PivotTableView = ({ data, years, formatFn }) => {
  const [rowDimension, setRowDimension] = React.useState('skpd');
  const [colDimension, setColDimension] = React.useState('year');
  const [valueMetric, setValueMetric] = React.useState('realisasi');
  const [searchTerm, setSearchTerm] = React.useState('');
  
  // Generate pivot data based on selections
  const pivotData = React.useMemo(() => {
    if (!data || !data.skpdList) return [];
    
    let filtered = [...data.skpdList];
    if (searchTerm) {
      filtered = filtered.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    return filtered.slice(0, 20).map(skpd => {
      const row = { skpd: skpd.name };
      years.forEach(year => {
        const yearData = data.yearData[year]?.find(s => s.name === skpd.name);
        if (valueMetric === 'realisasi') {
          row[year] = yearData?.realisasi || 0;
        } else {
          row[year] = yearData?.anggaran || 0;
        }
      });
      return row;
    });
  }, [data, years, valueMetric, searchTerm]);
  
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 items-center">
        <select value={valueMetric} onChange={e => setValueMetric(e.target.value)} className="px-3 py-1.5 text-xs bg-white/60 rounded-xl border border-slate-200">
          <option value="realisasi">Realisasi</option>
          <option value="anggaran">Anggaran</option>
        </select>
        <div className="relative flex-1 max-w-xs">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Cari SKPD..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-8 pr-3 py-1.5 text-xs bg-white/60 rounded-xl border border-slate-200" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800">
              <th className="px-3 py-2 text-left font-bold">SKPD</th>
              {years.map(year => <th key={year} className="px-3 py-2 text-right font-bold">{year}</th>)}
            </tr>
          </thead>
          <tbody>
            {pivotData.map((row, idx) => (
              <tr key={idx} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-3 py-2 font-medium">{row.skpd}</td>
                {years.map(year => (
                  <td key={year} className="px-3 py-2 text-right font-mono">
                    {formatFn(row[year])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============= MAIN COMPONENT =============
const AnalisisLintasTahunView = ({ data = {}, theme, selectedYear, userRole }) => {
  const [user, setUser] = React.useState(null);
  const years = [2024, 2025, 2026];
  const [yearFirst, setYearFirst] = React.useState(2024);
  const [yearSecond, setYearSecond] = React.useState(2025);
  const [yearThird, setYearThird] = React.useState(2026);
  const [startMonth, setStartMonth] = React.useState(months[0]);
  const [endMonth, setEndMonth] = React.useState(months[months.length - 1]);
  const [showAnalysis, setShowAnalysis] = React.useState(true);
  const [activeChart, setActiveChart] = React.useState('bar');
  const [activeInsightTab, setActiveInsightTab] = React.useState('variance');
  
  const [dataFirst, setDataFirst] = React.useState(null);
  const [dataSecond, setDataSecond] = React.useState(null);
  const [dataThird, setDataThird] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [selectedSkpdBelanja, setSelectedSkpdBelanja] = React.useState('Semua SKPD');
  const [selectedSkpdPendapatan, setSelectedSkpdPendapatan] = React.useState('Semua SKPD');

  // Authentication
  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  const fetchDataForYear = async (year) => {
    if (!user) return null;
    const dataTypes = ['anggaran', 'pendapatan', 'penerimaanPembiayaan', 'pengeluaranPembiayaan', 'realisasi', 'realisasiPendapatan', 'realisasiNonRkud'];
    const yearData = {};

    for (const dataType of dataTypes) {
      const collRef = collection(db, "publicData", String(year), dataType);
      const snapshot = await getDocs(query(collRef));
      let data = [];
      snapshot.forEach(doc => {
        data = [...data, ...doc.data().data];
      });
      
      if (dataType === 'realisasi' || dataType === 'realisasiPendapatan' || dataType === 'realisasiNonRkud') {
        const monthlyData = data.reduce((acc, item) => {
          const month = item.month || 'Lainnya';
          if (!acc[month]) acc[month] = [];
          acc[month].push(item);
          return acc;
        }, {});
        yearData[dataType] = monthlyData;
      } else {
        yearData[dataType] = data;
      }
    }
    return yearData;
  };

  React.useEffect(() => {
    const loadThreeYearData = async () => {
      if (yearFirst === yearSecond || yearFirst === yearThird || yearSecond === yearThird) {
        setError("Silakan pilih tiga tahun yang berbeda untuk perbandingan.");
        setDataFirst(null); setDataSecond(null); setDataThird(null);
        return;
      }
      setError(''); setIsLoading(true);
      try {
        const [fetchedDataFirst, fetchedDataSecond, fetchedDataThird] = await Promise.all([
          fetchDataForYear(yearFirst),
          fetchDataForYear(yearSecond),
          fetchDataForYear(yearThird)
        ]);
        setDataFirst(fetchedDataFirst); 
        setDataSecond(fetchedDataSecond);
        setDataThird(fetchedDataThird);
      } catch (e) {
        console.error("Error fetching comparison data:", e);
        setError("Gagal memuat data perbandingan 3 tahun.");
      } finally {
        setIsLoading(false);
      }
    };
    if(user) { loadThreeYearData(); }
  }, [yearFirst, yearSecond, yearThird, user]);

  const calculateTotals = (data, monthsToProcess) => {
    if (!data) return { anggaran: 0, pendapatan: 0, realisasiBelanja: 0, realisasiPendapatan: 0, 
                        capitalExpenditure: 0, operationalExpenditure: 0, skpdDetails: [] };
    
    const realisasiBelanjaBiasa = monthsToProcess.map(month => data.realisasi?.[month] || []).flat();
    const realisasiNonRkudData = monthsToProcess.map(month => data.realisasiNonRkud?.[month] || []).flat();
    const realisasiBelanjaData = [...realisasiBelanjaBiasa, ...realisasiNonRkudData];
    const realisasiPendapatanData = monthsToProcess.map(month => data.realisasiPendapatan?.[month] || []).flat();
    
    // Hitung belanja modal dan operasi (berdasarkan kode rekening)
    const anggaranItems = data.anggaran || [];
    let capitalExpenditure = 0;
    let operationalExpenditure = 0;
    const skpdMap = new Map();
    
    anggaranItems.forEach(item => {
      const nilai = item.nilai || 0;
      const kodeRekening = item.KodeRekening || '';
      const skpd = item.NamaSKPD || 'Tanpa SKPD';
      
      // Estimasi: kode 5.2.x untuk belanja modal, 5.1.x untuk operasi
      if (kodeRekening.startsWith('5.2')) {
        capitalExpenditure += nilai;
      } else if (kodeRekening.startsWith('5.1')) {
        operationalExpenditure += nilai;
      }
      
      if (!skpdMap.has(skpd)) {
        skpdMap.set(skpd, { name: skpd, anggaran: 0, realisasi: 0 });
      }
      skpdMap.get(skpd).anggaran += nilai;
    });
    
    realisasiBelanjaData.forEach(item => {
      const skpd = item.NamaSKPD || item.NAMASKPD || 'Tanpa SKPD';
      if (skpdMap.has(skpd)) {
        skpdMap.get(skpd).realisasi += item.nilai || 0;
      }
    });
    
    return {
      anggaran: anggaranItems.reduce((s, i) => s + (i.nilai || 0), 0),
      pendapatan: (data.pendapatan || []).reduce((s, i) => s + (i.nilai || 0), 0),
      realisasiBelanja: realisasiBelanjaData.reduce((s, i) => s + (i.nilai || 0), 0),
      realisasiPendapatan: realisasiPendapatanData.reduce((s, i) => s + (i.nilai || 0), 0),
      capitalExpenditure,
      operationalExpenditure,
      skpdDetails: Array.from(skpdMap.values())
    };
  };

  const getMonthlyData = (data, selectedSkpd, monthsToProcess) => {
    if (!data) return Array(12).fill(0);
    return monthsToProcess.map(month => {
      const biasa = ((data.realisasi || {})[month] || [])
        .filter(item => selectedSkpd === 'Semua SKPD' || item.NamaSKPD === selectedSkpd)
        .reduce((sum, item) => sum + (item.nilai || 0), 0);
      const nonRkud = ((data.realisasiNonRkud || {})[month] || [])
        .filter(item => selectedSkpd === 'Semua SKPD' || item.NAMASKPD === selectedSkpd)
        .reduce((sum, item) => sum + (item.nilai || 0), 0);
      return biasa + nonRkud;
    });
  };

  const {
    totalsFirst, totalsSecond, totalsThird,
    comparisonData, growthRates, totalAggregate,
    skpdListBelanja, skpdListPendapatan,
    skpdBelanjaComparison, skpdPendapatanComparison,
    monthlyComparisonData, monthlyPendapatanComparisonData,
    projectionData, capitalRatio, giniCoefficient,
    healthIndicators, forecastData
  } = React.useMemo(() => {
    if (!dataFirst || !dataSecond || !dataThird) return { 
      totalsFirst: {}, totalsSecond: {}, totalsThird: {},
      comparisonData: [], growthRates: [], totalAggregate: {},
      skpdListBelanja: [], skpdListPendapatan: [],
      skpdBelanjaComparison: null, skpdPendapatanComparison: null,
      monthlyComparisonData: [], monthlyPendapatanComparisonData: [],
      projectionData: null, capitalRatio: 0, giniCoefficient: 0,
      healthIndicators: {}, forecastData: []
    };
    
    const startIndex = months.indexOf(startMonth);
    const endIndex = months.indexOf(endMonth);
    const selectedMonths = months.slice(startIndex, endIndex + 1);
    const monthIndices = selectedMonths.map(m => months.indexOf(m)).filter(i => i >= 0);

    const totalsFirst = calculateTotals(dataFirst, selectedMonths);
    const totalsSecond = calculateTotals(dataSecond, selectedMonths);
    const totalsThird = calculateTotals(dataThird, selectedMonths);
    
    const periodLabel = startMonth === endMonth ? startMonth : `${startMonth} - ${endMonth}`;

    // Data untuk chart
    const comparisonData = [
      { name: 'Anggaran Belanja', [yearFirst]: totalsFirst.anggaran, [yearSecond]: totalsSecond.anggaran, [yearThird]: totalsThird.anggaran },
      { name: 'Target Pendapatan', [yearFirst]: totalsFirst.pendapatan, [yearSecond]: totalsSecond.pendapatan, [yearThird]: totalsThird.pendapatan },
      { name: `Realisasi Belanja (${periodLabel})`, [yearFirst]: totalsFirst.realisasiBelanja, [yearSecond]: totalsSecond.realisasiBelanja, [yearThird]: totalsThird.realisasiBelanja },
      { name: `Realisasi Pendapatan (${periodLabel})`, [yearFirst]: totalsFirst.realisasiPendapatan, [yearSecond]: totalsSecond.realisasiPendapatan, [yearThird]: totalsThird.realisasiPendapatan },
    ];

    // Growth rates
    const growthRates = [
      { period: `${yearFirst} → ${yearSecond}`, anggaran: totalsFirst.anggaran !== 0 ? ((totalsSecond.anggaran - totalsFirst.anggaran) / totalsFirst.anggaran * 100).toFixed(1) : '0', pendapatan: totalsFirst.pendapatan !== 0 ? ((totalsSecond.pendapatan - totalsFirst.pendapatan) / totalsFirst.pendapatan * 100).toFixed(1) : '0', realisasiBelanja: totalsFirst.realisasiBelanja !== 0 ? ((totalsSecond.realisasiBelanja - totalsFirst.realisasiBelanja) / totalsFirst.realisasiBelanja * 100).toFixed(1) : '0', realisasiPendapatan: totalsFirst.realisasiPendapatan !== 0 ? ((totalsSecond.realisasiPendapatan - totalsFirst.realisasiPendapatan) / totalsFirst.realisasiPendapatan * 100).toFixed(1) : '0' },
      { period: `${yearSecond} → ${yearThird}`, anggaran: totalsSecond.anggaran !== 0 ? ((totalsThird.anggaran - totalsSecond.anggaran) / totalsSecond.anggaran * 100).toFixed(1) : '0', pendapatan: totalsSecond.pendapatan !== 0 ? ((totalsThird.pendapatan - totalsSecond.pendapatan) / totalsSecond.pendapatan * 100).toFixed(1) : '0', realisasiBelanja: totalsSecond.realisasiBelanja !== 0 ? ((totalsThird.realisasiBelanja - totalsSecond.realisasiBelanja) / totalsSecond.realisasiBelanja * 100).toFixed(1) : '0', realisasiPendapatan: totalsSecond.realisasiPendapatan !== 0 ? ((totalsThird.realisasiPendapatan - totalsSecond.realisasiPendapatan) / totalsSecond.realisasiPendapatan * 100).toFixed(1) : '0' }
    ];

    // Total aggregate
    const totalAggregate = {
      totalAnggaran: totalsFirst.anggaran + totalsSecond.anggaran + totalsThird.anggaran,
      totalPendapatan: totalsFirst.pendapatan + totalsSecond.pendapatan + totalsThird.pendapatan,
      totalRealisasiBelanja: totalsFirst.realisasiBelanja + totalsSecond.realisasiBelanja + totalsThird.realisasiBelanja,
      totalRealisasiPendapatan: totalsFirst.realisasiPendapatan + totalsSecond.realisasiPendapatan + totalsThird.realisasiPendapatan,
      averageRealisasiBelanja: (totalsFirst.realisasiBelanja + totalsSecond.realisasiBelanja + totalsThird.realisasiBelanja) / 3,
      averageRealisasiPendapatan: (totalsFirst.realisasiPendapatan + totalsSecond.realisasiPendapatan + totalsThird.realisasiPendapatan) / 3
    };

    // SKPD Lists
    const skpdListBelanja = Array.from(new Set([
      ...(dataFirst.anggaran?.map(d => d.NamaSKPD) || []), 
      ...(dataSecond.anggaran?.map(d => d.NamaSKPD) || []),
      ...(dataThird.anggaran?.map(d => d.NamaSKPD) || [])
    ])).filter(Boolean).sort();
    
    const skpdListPendapatan = Array.from(new Set([
      ...(dataFirst.pendapatan?.map(d => d.NamaOPD) || []), 
      ...(dataSecond.pendapatan?.map(d => d.NamaOPD) || []),
      ...(dataThird.pendapatan?.map(d => d.NamaOPD) || [])
    ])).filter(Boolean).sort();

    // SKPD Belanja Comparison
    let skpdBelanjaComparison = null;
    if(selectedSkpdBelanja && selectedSkpdBelanja !== 'Semua SKPD') {
      const realisasiFirstData = [...selectedMonths.map(month => dataFirst.realisasi?.[month] || []).flat(), ...selectedMonths.map(month => dataFirst.realisasiNonRkud?.[month] || []).flat()];
      const realisasiSecondData = [...selectedMonths.map(month => dataSecond.realisasi?.[month] || []).flat(), ...selectedMonths.map(month => dataSecond.realisasiNonRkud?.[month] || []).flat()];
      const realisasiThirdData = [...selectedMonths.map(month => dataThird.realisasi?.[month] || []).flat(), ...selectedMonths.map(month => dataThird.realisasiNonRkud?.[month] || []).flat()];

      const anggaranFirst = (dataFirst.anggaran || []).filter(d => d.NamaSKPD === selectedSkpdBelanja).reduce((s, i) => s + i.nilai, 0);
      const realisasiFirst = realisasiFirstData.filter(d => (d.NamaSKPD || d.NAMASKPD) === selectedSkpdBelanja).reduce((s, i) => s + i.nilai, 0);
      const anggaranSecond = (dataSecond.anggaran || []).filter(d => d.NamaSKPD === selectedSkpdBelanja).reduce((s, i) => s + i.nilai, 0);
      const realisasiSecond = realisasiSecondData.filter(d => (d.NamaSKPD || d.NAMASKPD) === selectedSkpdBelanja).reduce((s, i) => s + i.nilai, 0);
      const anggaranThird = (dataThird.anggaran || []).filter(d => d.NamaSKPD === selectedSkpdBelanja).reduce((s, i) => s + i.nilai, 0);
      const realisasiThird = realisasiThirdData.filter(d => (d.NamaSKPD || d.NAMASKPD) === selectedSkpdBelanja).reduce((s, i) => s + i.nilai, 0);
      
      skpdBelanjaComparison = { anggaranFirst, realisasiFirst, anggaranSecond, realisasiSecond, anggaranThird, realisasiThird };
    }

    // SKPD Pendapatan Comparison
    let skpdPendapatanComparison = null;
    if(selectedSkpdPendapatan && selectedSkpdPendapatan !== 'Semua SKPD') {
      const realisasiFirstData = selectedMonths.map(month => dataFirst.realisasiPendapatan?.[month] || []).flat();
      const realisasiSecondData = selectedMonths.map(month => dataSecond.realisasiPendapatan?.[month] || []).flat();
      const realisasiThirdData = selectedMonths.map(month => dataThird.realisasiPendapatan?.[month] || []).flat();
      
      const targetFirst = (dataFirst.pendapatan || []).filter(d => d.NamaOPD === selectedSkpdPendapatan).reduce((s, i) => s + i.nilai, 0);
      const realisasiFirst = realisasiFirstData.filter(d => d.SKPD === selectedSkpdPendapatan).reduce((s, i) => s + i.nilai, 0);
      const targetSecond = (dataSecond.pendapatan || []).filter(d => d.NamaOPD === selectedSkpdPendapatan).reduce((s, i) => s + i.nilai, 0);
      const realisasiSecond = realisasiSecondData.filter(d => d.SKPD === selectedSkpdPendapatan).reduce((s, i) => s + i.nilai, 0);
      const targetThird = (dataThird.pendapatan || []).filter(d => d.NamaOPD === selectedSkpdPendapatan).reduce((s, i) => s + i.nilai, 0);
      const realisasiThird = realisasiThirdData.filter(d => d.SKPD === selectedSkpdPendapatan).reduce((s, i) => s + i.nilai, 0);
      
      skpdPendapatanComparison = { targetFirst, realisasiFirst, targetSecond, realisasiSecond, targetThird, realisasiThird };
    }

    // Monthly cumulative data
    let cumulativeFirst = 0, cumulativeSecond = 0, cumulativeThird = 0;
    const monthlyComparisonData = months.map(month => {
      const realiasiBulananFirst = ((dataFirst.realisasi || {})[month] || []).filter(item => selectedSkpdBelanja === 'Semua SKPD' || item.NamaSKPD === selectedSkpdBelanja).reduce((sum, item) => sum + item.nilai, 0) + ((dataFirst.realisasiNonRkud || {})[month] || []).filter(item => selectedSkpdBelanja === 'Semua SKPD' || item.NAMASKPD === selectedSkpdBelanja).reduce((sum, item) => sum + item.nilai, 0);
      const realiasiBulananSecond = ((dataSecond.realisasi || {})[month] || []).filter(item => selectedSkpdBelanja === 'Semua SKPD' || item.NamaSKPD === selectedSkpdBelanja).reduce((sum, item) => sum + item.nilai, 0) + ((dataSecond.realisasiNonRkud || {})[month] || []).filter(item => selectedSkpdBelanja === 'Semua SKPD' || item.NAMASKPD === selectedSkpdBelanja).reduce((sum, item) => sum + item.nilai, 0);
      const realiasiBulananThird = ((dataThird.realisasi || {})[month] || []).filter(item => selectedSkpdBelanja === 'Semua SKPD' || item.NamaSKPD === selectedSkpdBelanja).reduce((sum, item) => sum + item.nilai, 0) + ((dataThird.realisasiNonRkud || {})[month] || []).filter(item => selectedSkpdBelanja === 'Semua SKPD' || item.NAMASKPD === selectedSkpdBelanja).reduce((sum, item) => sum + item.nilai, 0);
      
      cumulativeFirst += realiasiBulananFirst;
      cumulativeSecond += realiasiBulananSecond;
      cumulativeThird += realiasiBulananThird;
      
      return { month: month.substring(0,3), [`Realisasi Kumulatif ${yearFirst}`]: cumulativeFirst, [`Realisasi Kumulatif ${yearSecond}`]: cumulativeSecond, [`Realisasi Kumulatif ${yearThird}`]: cumulativeThird };
    });

    let cumulativePendapatanFirst = 0, cumulativePendapatanSecond = 0, cumulativePendapatanThird = 0;
    const monthlyPendapatanComparisonData = months.map(month => {
      const realisasiBulananFirst = ((dataFirst.realisasiPendapatan || {})[month] || []).filter(item => selectedSkpdPendapatan === 'Semua SKPD' || item.SKPD === selectedSkpdPendapatan).reduce((sum, item) => sum + item.nilai, 0);
      const realisasiBulananSecond = ((dataSecond.realisasiPendapatan || {})[month] || []).filter(item => selectedSkpdPendapatan === 'Semua SKPD' || item.SKPD === selectedSkpdPendapatan).reduce((sum, item) => sum + item.nilai, 0);
      const realisasiBulananThird = ((dataThird.realisasiPendapatan || {})[month] || []).filter(item => selectedSkpdPendapatan === 'Semua SKPD' || item.SKPD === selectedSkpdPendapatan).reduce((sum, item) => sum + item.nilai, 0);
      
      cumulativePendapatanFirst += realisasiBulananFirst;
      cumulativePendapatanSecond += realisasiBulananSecond;
      cumulativePendapatanThird += realisasiBulananThird;
      
      return { month: month.substring(0,3), [`Pendapatan Kumulatif ${yearFirst}`]: cumulativePendapatanFirst, [`Pendapatan Kumulatif ${yearSecond}`]: cumulativePendapatanSecond, [`Pendapatan Kumulatif ${yearThird}`]: cumulativePendapatanThird };
    });

    // Proyeksi Run Rate untuk tahun berjalan
    const monthlyDataThird = getMonthlyData(dataThird, 'Semua SKPD', months);
    const projectionData = calculateRunRateProjection(monthlyDataThird, totalsThird.anggaran);
    
    // Rasio belanja modal
    const totalExpenditure = totalsThird.capitalExpenditure + totalsThird.operationalExpenditure;
    const capitalRatio = totalExpenditure > 0 ? (totalsThird.capitalExpenditure / totalExpenditure) * 100 : 0;
    
    // Koefisien Gini untuk pemerataan anggaran
    const anggaranValues = totalsThird.skpdDetails.map(d => d.anggaran).filter(v => v > 0);
    const giniCoefficient = calculateGiniCoefficient(anggaranValues);
    
    // Indikator kesehatan fiskal
    const healthIndicators = {
      fiscalCapacity: totalAggregate.totalPendapatan > 0 ? (totalAggregate.totalRealisasiPendapatan / totalAggregate.totalPendapatan) * 100 : 0,
      spendingEfficiency: totalsThird.anggaran > 0 ? (totalsThird.realisasiBelanja / totalsThird.anggaran) * 100 : 0,
      capitalAllocation: capitalRatio,
      revenueGrowth: parseFloat(growthRates[1]?.pendapatan || 0)
    };
    
    // Forecast data untuk 3 bulan ke depan (linear regression)
    const monthlyDataPoints = monthlyDataThird.map((val, idx) => ({ x: idx, y: val })).filter(d => d.y > 0);
    const regression = calculateLinearRegression(monthlyDataPoints);
    const forecastData = [];
    if (regression) {
      const lastMonth = monthlyDataThird.length - 1;
      for (let i = 1; i <= 3; i++) {
        const forecastMonth = lastMonth + i;
        if (forecastMonth < 12) {
          forecastData.push({
            month: months[forecastMonth].substring(0, 3),
            forecast: Math.max(0, regression.slope * forecastMonth + regression.intercept),
            actual: monthlyDataThird[forecastMonth] || 0
          });
        }
      }
    }

    return { 
      totalsFirst, totalsSecond, totalsThird,
      comparisonData, growthRates, totalAggregate,
      skpdListBelanja, skpdListPendapatan,
      skpdBelanjaComparison, skpdPendapatanComparison,
      monthlyComparisonData, monthlyPendapatanComparisonData,
      projectionData, capitalRatio, giniCoefficient,
      healthIndicators, forecastData
    };
  }, [dataFirst, dataSecond, dataThird, yearFirst, yearSecond, yearThird, selectedSkpdBelanja, selectedSkpdPendapatan, startMonth, endMonth]);

  const getAnalysisPrompt = (query, allData) => {
    if (query && query.trim() !== '') {
      return `Berdasarkan data perbandingan 3 tahun (${yearFirst}, ${yearSecond}, ${yearThird}), jawab pertanyaan ini: ${query}`;
    }
    if (!comparisonData || comparisonData.length === 0) return "Data tidak cukup untuk dianalisis.";
    
    const period = startMonth === endMonth ? startMonth : `periode ${startMonth} - ${endMonth}`;
    
    return `ANALISIS LINTAS TAHUN APBD
PERIODE: ${yearFirst} - ${yearSecond} - ${yearThird}
RENTANG ANALISIS: ${period}

DATA RINGKAS 3 TAHUN:
${comparisonData.map(item => `- ${item.name}: ${yearFirst} (${formatIDR(item[yearFirst])}), ${yearSecond} (${formatIDR(item[yearSecond])}), ${yearThird} (${formatIDR(item[yearThird])})`).join('\n')}

PERTUMBUHAN TAHUNAN:
${growthRates?.map(rate => `- ${rate.period}: Anggaran ${rate.anggaran}%, Pendapatan ${rate.pendapatan}%, Realisasi Belanja ${rate.realisasiBelanja}%`).join('\n') || '- Data pertumbuhan tidak tersedia'}

INDIKATOR KESEHATAN FISKAL:
- Kapasitas Fiskal: ${healthIndicators.fiscalCapacity?.toFixed(1)}%
- Efisiensi Belanja: ${healthIndicators.spendingEfficiency?.toFixed(1)}%
- Alokasi Belanja Modal: ${healthIndicators.capitalAllocation?.toFixed(1)}%
- Pertumbuhan Pendapatan: ${healthIndicators.revenueGrowth?.toFixed(1)}%
- Koefisien Gini (Pemerataan): ${giniCoefficient.toFixed(3)} (0=merata, 1=timpang)

PROYEKSI AKHIR TAHUN ${yearThird}:
- Proyeksi Realisasi: ${formatIDR(projectionData?.projection || 0)}
- Target Tahunan: ${formatIDR(totalsThird?.anggaran || 0)}
- Varians: ${projectionData?.variancePercent?.toFixed(1)}%

BERIKAN ANALISIS MENDALAM MENGENAI:
1. TREN 3 TAHUNAN: Identifikasi pola pertumbuhan atau penurunan yang signifikan.
2. KESEHATAN FISKAL: Evaluasi berdasarkan indikator di atas.
3. PERINGATAN DINI: Poin-poin yang perlu diwaspadai untuk perencanaan tahun depan.
4. REKOMENDASI STRATEGIS: 3 langkah konkret berdasarkan analisis.

Gunakan bahasa profesional, langsung ke inti, tanpa basa-basi.`;
  };

  const ComparisonCard = ({ title, valueFirst, valueSecond, valueThird, yearFirst, yearSecond, yearThird, icon: Icon }) => {
    const change1to2 = valueSecond - valueFirst;
    const change2to3 = valueThird - valueSecond;
    const percentageChange1to2 = valueFirst !== 0 ? (change1to2 / valueFirst) * 100 : 0;
    const percentageChange2to3 = valueSecond !== 0 ? (change2to3 / valueSecond) * 100 : 0;
    const isIncrease1to2 = change1to2 > 0;
    const isIncrease2to3 = change2to3 > 0;

    return (
      <div className="relative group overflow-hidden bg-white/30 dark:bg-slate-800/30 backdrop-blur-2xl border border-white/40 dark:border-slate-700/50 p-6 rounded-2xl shadow-xl transition-all hover:shadow-2xl hover:-translate-y-1">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-indigo-500/10 group-hover:via-purple-500/10 group-hover:to-pink-500/10 transition-all duration-700"></div>
        <div className="absolute top-3 right-3 p-2 opacity-10 group-hover:opacity-20"><Icon size={60} className="text-indigo-500" /></div>
        <h4 className="text-[9px] font-black uppercase tracking-wider text-slate-500 mb-3">{title}</h4>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div><p className="text-[10px] text-slate-400">{yearFirst}</p><p className="text-sm font-black text-slate-800 dark:text-white">{formatIDR(valueFirst)}</p></div>
          <div><p className="text-[10px] text-slate-400">{yearSecond}</p><p className="text-sm font-black text-indigo-600">{formatIDR(valueSecond)}</p></div>
          <div><p className="text-[10px] text-slate-400">{yearThird}</p><p className="text-sm font-black text-purple-600">{formatIDR(valueThird)}</p></div>
        </div>
        <div className="flex justify-between">
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold ${isIncrease1to2 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
            {isIncrease1to2 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}{Math.abs(percentageChange1to2).toFixed(1)}%
          </div>
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold ${isIncrease2to3 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
            {isIncrease2to3 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}{Math.abs(percentageChange2to3).toFixed(1)}%
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6">
        <div className="relative"><div className="w-20 h-20 border-6 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div><div className="absolute inset-0 flex items-center justify-center"><Loader size={24} className="text-indigo-600" /></div></div>
        <p className="text-xs font-black uppercase tracking-wider text-slate-400 animate-pulse">Memproses analisis 3 tahun...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-rose-50 dark:bg-rose-950/20 border-l-4 border-rose-500 rounded-2xl flex items-center gap-4 text-rose-600">
        <div className="p-2 bg-rose-500 rounded-xl text-white"><Info size={20} /></div>
        <p className="font-bold">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-8 animate-in fade-in duration-700 pb-20">
      <SectionTitle>Analisis 3 Tahun: {yearFirst} • {yearSecond} • {yearThird}</SectionTitle>

      {/* HEADER BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-900 to-indigo-900 rounded-3xl p-8 text-white shadow-2xl border border-white/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl -ml-40 -mb-40"></div>
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/10 rounded-full text-[10px] font-black tracking-wider uppercase border border-white/20">
              <Sparkles size={14} className="text-yellow-400" /> TRI-ANNUAL COMPARATIVE ANALYSIS
            </div>
            <h2 className="text-3xl lg:text-5xl font-black leading-tight tracking-tighter">
              Tri-Annual Fiscal <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">Performance Tracker</span>
            </h2>
            <p className="text-indigo-100/80 text-sm max-w-2xl">Visualisasi komparatif lintas tiga tahun fiskal dengan analisis mendalam untuk identifikasi tren jangka menengah.</p>
            <div className="flex flex-wrap gap-4">
              <div className="bg-white/5 backdrop-blur-2xl px-4 py-2 rounded-xl"><p className="text-[9px] uppercase text-indigo-300">Total 3 Tahun</p><p className="text-lg font-black">{formatIDR(totalAggregate?.totalAnggaran || 0)}</p></div>
              <div className="bg-white/5 backdrop-blur-2xl px-4 py-2 rounded-xl"><p className="text-[9px] uppercase text-indigo-300">Rata-rata/Thn</p><p className="text-lg font-black">{formatIDR(totalAggregate?.averageRealisasiBelanja || 0)}</p></div>
              <div className="bg-white/5 backdrop-blur-2xl px-4 py-2 rounded-xl"><p className="text-[9px] uppercase text-indigo-300">Periode</p><p className="text-lg font-black">{startMonth} — {endMonth}</p></div>
            </div>
          </div>
          <div className="hidden lg:flex flex-col gap-3">
            <div className="bg-white/5 backdrop-blur-3xl p-4 rounded-2xl">
              <div className="flex items-center gap-2 text-[9px] font-black uppercase text-indigo-300"><Gauge size={12} /> Koefisien Gini</div>
              <div className="text-2xl font-black">{giniCoefficient.toFixed(3)}</div>
              <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2"><div className="bg-gradient-to-r from-emerald-500 to-amber-500 h-1.5 rounded-full" style={{ width: `${giniCoefficient * 100}%` }}></div></div>
              <p className="text-[9px] text-indigo-300/70 mt-1">{giniCoefficient < 0.3 ? 'Pemerataan baik' : giniCoefficient < 0.5 ? 'Pemerataan cukup' : 'Konsentrasi tinggi'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* YEAR SELECTOR */}
      <div className="sticky top-4 z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-white/40 p-4 rounded-2xl shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div><label className="text-[9px] font-black uppercase text-slate-500">Tahun Baseline</label><select value={yearFirst} onChange={e => setYearFirst(parseInt(e.target.value))} className="w-full px-4 py-2.5 bg-white/50 rounded-xl text-sm font-bold border border-slate-200">{years.map(y => <option key={y} value={y}>{y}</option>)}</select></div>
          <div><label className="text-[9px] font-black uppercase text-slate-500">Tahun Intermediate</label><select value={yearSecond} onChange={e => setYearSecond(parseInt(e.target.value))} className="w-full px-4 py-2.5 bg-white/50 rounded-xl text-sm font-bold border border-slate-200">{years.map(y => <option key={y} value={y}>{y}</option>)}</select></div>
          <div><label className="text-[9px] font-black uppercase text-slate-500">Tahun Terkini</label><select value={yearThird} onChange={e => setYearThird(parseInt(e.target.value))} className="w-full px-4 py-2.5 bg-white/50 rounded-xl text-sm font-bold border border-slate-200">{years.map(y => <option key={y} value={y}>{y}</option>)}</select></div>
          <div><label className="text-[9px] font-black uppercase text-slate-500">Mulai Dari</label><select value={startMonth} onChange={e => setStartMonth(e.target.value)} className="w-full px-4 py-2.5 bg-white/50 rounded-xl text-sm font-bold border border-slate-200">{months.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
          <div><label className="text-[9px] font-black uppercase text-slate-500">Hingga Akhir</label><select value={endMonth} onChange={e => setEndMonth(e.target.value)} className="w-full px-4 py-2.5 bg-white/50 rounded-xl text-sm font-bold border border-slate-200">{months.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
        </div>
        <div className="flex justify-end mt-3 gap-2">
          <button onClick={() => setActiveChart('bar')} className={`px-4 py-2 rounded-xl text-[10px] font-bold flex items-center gap-1 ${activeChart === 'bar' ? 'bg-indigo-600 text-white' : 'bg-white/50'}`}><BarChart3 size={12} /> Bar</button>
          <button onClick={() => setActiveChart('area')} className={`px-4 py-2 rounded-xl text-[10px] font-bold flex items-center gap-1 ${activeChart === 'area' ? 'bg-indigo-600 text-white' : 'bg-white/50'}`}><LineChartIcon size={12} /> Area</button>
        </div>
      </div>

      {/* AI ANALYSIS */}
      <div className="relative">
        <div className="flex justify-end mb-2"><button onClick={() => setShowAnalysis(!showAnalysis)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white/50 rounded-xl hover:bg-white transition-all">{showAnalysis ? '🗂️ Sembunyikan AI' : '🤖 Tampilkan AI'}</button></div>
        {showAnalysis && (<GeminiAnalysis getAnalysisPrompt={getAnalysisPrompt} disabledCondition={!comparisonData} userCanUseAi={userRole !== 'viewer'} allData={{ yearFirst, yearSecond, yearThird, comparisonData, growthRates, totalAggregate, healthIndicators, projectionData }} />)}
      </div>

      {/* INSIGHTS TABS */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'variance', label: 'Varians & Proyeksi', icon: <Target size={14} /> },
          { id: 'effectiveness', label: 'Efektivitas Belanja', icon: <Gauge size={14} /> },
          { id: 'health', label: 'Kesehatan Fiskal', icon: <Heart size={14} /> },
          { id: 'forecast', label: 'Forecast', icon: <LineChartIcon size={14} /> },
          { id: 'pivot', label: 'Pivot Table', icon: <TableIcon size={14} /> }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveInsightTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeInsightTab === tab.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>{tab.icon}{tab.label}</button>
        ))}
      </div>

      {/* INSIGHTS CONTENT */}
      <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl p-6 rounded-3xl border border-white/30">
        {activeInsightTab === 'variance' && totalsThird && (
          <div className="space-y-4">
            <h3 className="text-sm font-black flex items-center gap-2"><Target size={16} /> Analisis Varians & Proyeksi {yearThird}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <VarianceCard title="Anggaran Belanja" target={totalsThird.anggaran} realization={totalsThird.realisasiBelanja} projection={projectionData?.projection || 0} formatFn={formatIDR} />
              <VarianceCard title="Pendapatan Daerah" target={totalsThird.pendapatan} realization={totalsThird.realisasiPendapatan} projection={0} formatFn={formatIDR} />
              <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-900/20 p-5 rounded-2xl border border-amber-200">
                <p className="text-[10px] font-black uppercase text-amber-600">Early Warning</p>
                {projectionData?.variancePercent < -10 ? (
                  <p className="text-sm font-bold text-rose-600 mt-2">⚠️ Risiko tidak tercapainya target belanja</p>
                ) : projectionData?.variancePercent > 10 ? (
                  <p className="text-sm font-bold text-emerald-600 mt-2">✅ Potensi over-achievement belanja</p>
                ) : (
                  <p className="text-sm font-bold text-amber-600 mt-2">📊 Proyeksi masih dalam koridor target</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeInsightTab === 'effectiveness' && totalsThird && (
          <EffectivenessCard capitalExpenditure={totalsThird.capitalExpenditure} operationalExpenditure={totalsThird.operationalExpenditure} totalExpenditure={totalsThird.capitalExpenditure + totalsThird.operationalExpenditure} />
        )}

        {activeInsightTab === 'health' && (
          <div className="space-y-4">
            <h3 className="text-sm font-black flex items-center gap-2"><Heart size={16} /> Indikator Kesehatan Fiskal</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <HealthIndicator label="Kapasitas Fiskal" value={`${healthIndicators.fiscalCapacity?.toFixed(1)}%`} description="Pendapatan vs Target" status={healthIndicators.fiscalCapacity >= 80 ? 'good' : healthIndicators.fiscalCapacity >= 50 ? 'warning' : 'critical'} />
              <HealthIndicator label="Efisiensi Belanja" value={`${healthIndicators.spendingEfficiency?.toFixed(1)}%`} description="Realisasi vs Pagu" status={healthIndicators.spendingEfficiency >= 85 ? 'good' : healthIndicators.spendingEfficiency >= 70 ? 'warning' : 'critical'} />
              <HealthIndicator label="Belanja Modal" value={`${healthIndicators.capitalAllocation?.toFixed(1)}%`} description="Dari total belanja" status={healthIndicators.capitalAllocation >= 30 ? 'good' : healthIndicators.capitalAllocation >= 20 ? 'warning' : 'critical'} />
              <HealthIndicator label="Pertumbuhan PAD" value={`${healthIndicators.revenueGrowth?.toFixed(1)}%`} description="Tahunan" status={healthIndicators.revenueGrowth >= 5 ? 'good' : healthIndicators.revenueGrowth >= 0 ? 'warning' : 'critical'} />
            </div>
          </div>
        )}

        {activeInsightTab === 'forecast' && forecastData.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-black flex items-center gap-2"><LineChartIcon size={16} /> Forecast 3 Bulan ke Depan (Regresi Linear)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={v => formatIDR(v).substring(0, 4)} />
                  <Tooltip formatter={v => formatIDR(v)} />
                  <Bar dataKey="actual" fill="#94A3B8" name="Aktual" />
                  <Line type="monotone" dataKey="forecast" stroke="#F59E0B" strokeWidth={3} name="Forecast" strokeDasharray="5 5" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-slate-500 text-center">*Forecast menggunakan metode regresi linear dari data 3 bulan terakhir</p>
          </div>
        )}

        {activeInsightTab === 'pivot' && totalsThird && (
          <PivotTableView data={{ skpdList: totalsThird.skpdDetails, yearData: { [yearFirst]: totalsFirst.skpdDetails, [yearSecond]: totalsSecond.skpdDetails, [yearThird]: totalsThird.skpdDetails } }} years={[yearFirst, yearSecond, yearThird]} formatFn={formatIDR} />
        )}
      </div>

      {/* MAIN COMPARISON CHART */}
      <div className="bg-white/30 dark:bg-slate-800/30 backdrop-blur-2xl p-6 rounded-3xl shadow-2xl border border-white/50">
        <div className="flex flex-wrap justify-between items-center mb-6">
          <h3 className="text-lg font-black flex items-center gap-2"><BarChart3 size={18} /> Tri-Annual Fiscal Comparison</h3>
          <div className="flex gap-2">
            <button onClick={() => setActiveChart('bar')} className={`px-4 py-2 rounded-xl text-xs font-bold ${activeChart === 'bar' ? 'bg-indigo-600 text-white' : 'bg-white/50'}`}><BarChart3 size={14} /> Bar</button>
            <button onClick={() => setActiveChart('area')} className={`px-4 py-2 rounded-xl text-xs font-bold ${activeChart === 'area' ? 'bg-indigo-600 text-white' : 'bg-white/50'}`}><LineChartIcon size={14} /> Area</button>
          </div>
        </div>
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {activeChart === 'bar' ? (
              <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600 }} />
                <YAxis tickFormatter={v => `${(v / 1e9).toFixed(1)}M`} />
                <Tooltip formatter={v => formatIDR(v)} contentStyle={{ borderRadius: '1rem', border: 'none', backdropFilter: 'blur(10px)' }} />
                <Legend />
                <Bar dataKey={String(yearFirst)} fill="#435EBE" name={String(yearFirst)} radius={[6, 6, 0, 0]} barSize={40} />
                <Bar dataKey={String(yearSecond)} fill="#A855F7" name={String(yearSecond)} radius={[6, 6, 0, 0]} barSize={40} />
                <Bar dataKey={String(yearThird)} fill="#F59E0B" name={String(yearThird)} radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            ) : (
              <AreaChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <defs>
                  <linearGradient id="gradFirst" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#435EBE" stopOpacity={0.3}/><stop offset="100%" stopColor="#435EBE" stopOpacity={0}/></linearGradient>
                  <linearGradient id="gradSecond" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#A855F7" stopOpacity={0.3}/><stop offset="100%" stopColor="#A855F7" stopOpacity={0}/></linearGradient>
                  <linearGradient id="gradThird" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F59E0B" stopOpacity={0.3}/><stop offset="100%" stopColor="#F59E0B" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600 }} />
                <YAxis tickFormatter={v => `${(v / 1e9).toFixed(1)}M`} />
                <Tooltip formatter={v => formatIDR(v)} />
                <Legend />
                <Area type="monotone" dataKey={String(yearFirst)} stroke="#435EBE" strokeWidth={3} fill="url(#gradFirst)" name={String(yearFirst)} />
                <Area type="monotone" dataKey={String(yearSecond)} stroke="#A855F7" strokeWidth={3} fill="url(#gradSecond)" name={String(yearSecond)} />
                <Area type="monotone" dataKey={String(yearThird)} stroke="#F59E0B" strokeWidth={3} fill="url(#gradThird)" name={String(yearThird)} />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* SKPD COMPARISON SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl p-6 rounded-3xl border border-white/30">
          <div className="flex items-center gap-3 mb-4"><Building2 size={20} className="text-indigo-600" /><h3 className="font-black">Analisis Belanja SKPD 3 Tahun</h3></div>
          <select value={selectedSkpdBelanja} onChange={e => setSelectedSkpdBelanja(e.target.value)} className="w-full px-4 py-3 bg-white/60 rounded-xl text-sm font-bold mb-4 border border-slate-200">{skpdListBelanja.map(s => <option key={s} value={s}>{s}</option>)}</select>
          {skpdBelanjaComparison && (
            <div className="grid grid-cols-3 gap-2 text-center mb-4">
              <div className="p-2 bg-indigo-50 rounded-xl"><p className="text-[9px] font-black">{yearFirst}</p><p className="text-xs font-bold text-indigo-600">{formatIDR(skpdBelanjaComparison.realisasiFirst)}</p></div>
              <div className="p-2 bg-purple-50 rounded-xl"><p className="text-[9px] font-black">{yearSecond}</p><p className="text-xs font-bold text-purple-600">{formatIDR(skpdBelanjaComparison.realisasiSecond)}</p></div>
              <div className="p-2 bg-amber-50 rounded-xl"><p className="text-[9px] font-black">{yearThird}</p><p className="text-xs font-bold text-amber-600">{formatIDR(skpdBelanjaComparison.realisasiThird)}</p></div>
            </div>
          )}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyComparisonData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={v => formatIDR(v).substring(0, 4)} />
                <Tooltip formatter={v => formatIDR(v)} />
                <Area type="monotone" dataKey={`Realisasi Kumulatif ${yearFirst}`} stroke="#435EBE" strokeWidth={3} fill="url(#gradFirst)" name={String(yearFirst)} />
                <Area type="monotone" dataKey={`Realisasi Kumulatif ${yearSecond}`} stroke="#A855F7" strokeWidth={3} fill="url(#gradSecond)" name={String(yearSecond)} />
                <Area type="monotone" dataKey={`Realisasi Kumulatif ${yearThird}`} stroke="#F59E0B" strokeWidth={3} fill="url(#gradThird)" name={String(yearThird)} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl p-6 rounded-3xl border border-white/30">
          <div className="flex items-center gap-3 mb-4"><Wallet size={20} className="text-emerald-600" /><h3 className="font-black">Analisis Pendapatan SKPD 3 Tahun</h3></div>
          <select value={selectedSkpdPendapatan} onChange={e => setSelectedSkpdPendapatan(e.target.value)} className="w-full px-4 py-3 bg-white/60 rounded-xl text-sm font-bold mb-4 border border-slate-200">{skpdListPendapatan.map(s => <option key={s} value={s}>{s}</option>)}</select>
          {skpdPendapatanComparison && (
            <div className="grid grid-cols-3 gap-2 text-center mb-4">
              <div className="p-2 bg-emerald-50 rounded-xl"><p className="text-[9px] font-black">{yearFirst}</p><p className="text-xs font-bold text-emerald-600">{formatIDR(skpdPendapatanComparison.realisasiFirst)}</p></div>
              <div className="p-2 bg-teal-50 rounded-xl"><p className="text-[9px] font-black">{yearSecond}</p><p className="text-xs font-bold text-teal-600">{formatIDR(skpdPendapatanComparison.realisasiSecond)}</p></div>
              <div className="p-2 bg-amber-50 rounded-xl"><p className="text-[9px] font-black">{yearThird}</p><p className="text-xs font-bold text-amber-600">{formatIDR(skpdPendapatanComparison.realisasiThird)}</p></div>
            </div>
          )}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyPendapatanComparisonData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={v => formatIDR(v).substring(0, 4)} />
                <Tooltip formatter={v => formatIDR(v)} />
                <Area type="monotone" dataKey={`Pendapatan Kumulatif ${yearFirst}`} stroke="#10B981" strokeWidth={3} fill="url(#gradFirst)" name={String(yearFirst)} />
                <Area type="monotone" dataKey={`Pendapatan Kumulatif ${yearSecond}`} stroke="#8B5CF6" strokeWidth={3} fill="url(#gradSecond)" name={String(yearSecond)} />
                <Area type="monotone" dataKey={`Pendapatan Kumulatif ${yearThird}`} stroke="#F59E0B" strokeWidth={3} fill="url(#gradThird)" name={String(yearThird)} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* LEGEND */}
      <div className="flex flex-wrap items-center justify-center gap-6 py-6 border-t border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-400">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-600"></div>Tahun {yearFirst}</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500"></div>Tahun {yearSecond}</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div>Tahun {yearThird}</div>
        <div className="flex items-center gap-2 ml-4"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>Growth (+)</div>
        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-500"></div>Decline (-)</div>
      </div>

      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .animate-float { animation: float 6s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default AnalisisLintasTahunView;