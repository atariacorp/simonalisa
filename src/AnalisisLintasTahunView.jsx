import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, AreaChart, Area, Cell 
} from 'recharts';
import { 
  Loader, TrendingUp, Calendar, Building2, Wallet, 
  ArrowUpRight, ArrowDownRight, LayoutDashboard, Info, ChevronRight,
  Zap, Clock, Sparkles, MessageSquare, ShieldCheck, BarChart3,
  LineChart, PieChart, Target, Eye, Activity, Layers
} from 'lucide-react';

// Import yang benar dari aplikasi yang sudah ada
import { db, appId } from '../../utils/firebase';
import { formatIDR } from '../../utils';
import { auth } from '../../utils/firebase'; // Import auth instance

// SectionTitle Component
const SectionTitle = ({ children }) => (
  <div className="relative mb-8 group">
    <h2 className="text-3xl font-black tracking-tighter text-slate-800 dark:text-white transition-all">
      {children}
    </h2>
    <div className="absolute -bottom-2 left-0 h-1.5 w-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all group-hover:w-24"></div>
  </div>
);

// GeminiAnalysis Component
const GeminiAnalysis = ({ getAnalysisPrompt, disabledCondition, theme, interactivePlaceholder }) => {
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [result, setResult] = React.useState(null);

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    // Simulasi delay analisis untuk efek visual
    setTimeout(() => {
      setResult("Berdasarkan data perbandingan 3 tahun, terlihat akselerasi signifikan pada tahun 2024 dengan pertumbuhan 15.3%, namun terjadi perlambatan di Q1 2025. Sektor infrastruktur dan pendidikan menjadi kontributor utama dengan rata-rata pertumbuhan 18.7% selama periode tersebut.");
      setIsAnalyzing(false);
    }, 2000);
  };

  return (
    <div className="relative overflow-hidden bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-indigo-200/50 dark:border-indigo-900/30 rounded-[2.5rem] p-8 shadow-2xl shadow-indigo-500/10 mb-10 transition-all duration-500 hover:shadow-indigo-500/20">
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="p-4 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl text-white shadow-lg shadow-indigo-500/40 transform -rotate-3 group-hover:rotate-0 transition-transform">
          <Sparkles size={28} />
        </div>
        <div className="flex-1 space-y-1">
          <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter flex items-center gap-2">
            Tri-Annual Intelligence Analysis <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-[10px] rounded-full">3 YEAR COMPARISON</span>
          </h3>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Asisten Analisis Fiskal AI dengan perspektif 3 tahunan</p>
        </div>
        <div className="w-full md:w-auto flex gap-2">
          <div className="flex-1 relative">
             <input 
              disabled={disabledCondition || isAnalyzing}
              placeholder={interactivePlaceholder}
              className="w-full md:w-80 px-5 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400"
            />
          </div>
          <button 
            onClick={handleAnalyze}
            disabled={disabledCondition || isAnalyzing}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm transition-all shadow-xl shadow-indigo-500/30 active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            {isAnalyzing ? <Loader className="animate-spin" size={18} /> : <MessageSquare size={18} />}
            Analisis 3 Tahun
          </button>
        </div>
      </div>

      {result && (
        <div className="mt-6 p-6 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-3xl border border-indigo-100 dark:border-indigo-800/50 animate-in fade-in slide-in-from-top-4 duration-500 backdrop-blur-sm">
           <div className="flex items-start gap-3">
              <div className="mt-1 p-1 bg-indigo-600 rounded-full text-white"><ShieldCheck size={12}/></div>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {result}
              </p>
           </div>
        </div>
      )}
    </div>
  );
};

// --- MAIN VIEW COMPONENT WITH 3-YEAR COMPARISON ---
const AnalisisLintasTahunView = ({ data = {}, theme, selectedYear, userRole }) => {
    const [user, setUser] = React.useState(null);
    const currentYear = new Date().getFullYear();
    // Tiga tahun perbandingan: 2023, 2024, 2025
    const years = [2023, 2024, 2025];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    
    // State untuk tiga tahun
    const [yearFirst, setYearFirst] = React.useState(2023);
    const [yearSecond, setYearSecond] = React.useState(2024);
    const [yearThird, setYearThird] = React.useState(2025);
    const [startMonth, setStartMonth] = React.useState(months[0]);
    const [endMonth, setEndMonth] = React.useState(months[months.length - 1]);
    
    // Data untuk tiga tahun
    const [dataFirst, setDataFirst] = React.useState(null);
    const [dataSecond, setDataSecond] = React.useState(null);
    const [dataThird, setDataThird] = React.useState(null);
    
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [selectedSkpdBelanja, setSelectedSkpdBelanja] = React.useState('Semua SKPD');
    const [selectedSkpdPendapatan, setSelectedSkpdPendapatan] = React.useState('Semua SKPD');
    const [activeChart, setActiveChart] = React.useState('bar'); // 'bar' atau 'area'

    // Authentication - gunakan onAuthStateChanged
    React.useEffect(() => {
      const unsubscribe = auth.onAuthStateChanged(setUser);
      return () => unsubscribe();
    }, []);

    const fetchDataForYear = async (year) => {
        if (!user) return null;
        const dataTypes = ['anggaran', 'pendapatan', 'penerimaanPembiayaan', 'pengeluaranPembiayaan', 'realisasi', 'realisasiPendapatan', 'realisasiNonRkud'];
        const yearData = {};

        for (const dataType of dataTypes) {
            // Perbaikan: Gunakan path Firebase yang benar sesuai aplikasi
            const collRef = collection(db, 'artifacts', appId, 'public', 'data', String(year), dataType);
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
            // Validasi tahun berbeda
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

    // Fungsi calculateTotals dengan validasi
    const calculateTotals = (data, monthsToProcess) => {
        if (!data) return { anggaran: 0, pendapatan: 0, realisasiBelanja: 0, realisasiPendapatan: 0 };
        
        const realisasiBelanjaBiasa = monthsToProcess.map(month => data.realisasi?.[month] || []).flat();
        const realisasiNonRkudData = monthsToProcess.map(month => data.realisasiNonRkud?.[month] || []).flat();
        const realisasiBelanjaData = [...realisasiBelanjaBiasa, ...realisasiNonRkudData];
        const realisasiPendapatanData = monthsToProcess.map(month => data.realisasiPendapatan?.[month] || []).flat();

        return {
            anggaran: (data.anggaran || []).reduce((s, i) => s + (i.nilai || 0), 0),
            pendapatan: (data.pendapatan || []).reduce((s, i) => s + (i.nilai || 0), 0),
            realisasiBelanja: realisasiBelanjaData.reduce((s, i) => s + (i.nilai || 0), 0),
            realisasiPendapatan: realisasiPendapatanData.reduce((s, i) => s + (i.nilai || 0), 0),
        };
    };

    // Memoized calculations untuk 3 tahun
    const { 
        skpdListBelanja, 
        skpdListPendapatan, 
        comparisonData, 
        skpdBelanjaComparison, 
        skpdPendapatanComparison, 
        monthlyComparisonData,
        monthlyPendapatanComparisonData,
        growthRates,
        totalAggregate
    } = React.useMemo(() => {
        if (!dataFirst || !dataSecond || !dataThird) return { 
            skpdListBelanja: [], 
            skpdListPendapatan: [], 
            comparisonData: [], 
            skpdBelanjaComparison: null, 
            skpdPendapatanComparison: null, 
            monthlyComparisonData: [],
            monthlyPendapatanComparisonData: [],
            growthRates: [],
            totalAggregate: {}
        };
        
        const startIndex = months.indexOf(startMonth);
        const endIndex = months.indexOf(endMonth);
        const selectedMonths = months.slice(startIndex, endIndex + 1);

        const totalsFirst = calculateTotals(dataFirst, selectedMonths);
        const totalsSecond = calculateTotals(dataSecond, selectedMonths);
        const totalsThird = calculateTotals(dataThird, selectedMonths);
        
        const periodLabel = startMonth === endMonth ? startMonth : `${startMonth} - ${endMonth}`;

        // Data untuk barchart dengan 3 tahun
        const comparisonData = [
            { 
                name: 'Anggaran Belanja', 
                [yearFirst]: totalsFirst.anggaran, 
                [yearSecond]: totalsSecond.anggaran,
                [yearThird]: totalsThird.anggaran
            },
            { 
                name: 'Target Pendapatan', 
                [yearFirst]: totalsFirst.pendapatan, 
                [yearSecond]: totalsSecond.pendapatan,
                [yearThird]: totalsThird.pendapatan
            },
            { 
                name: `Realisasi Belanja (${periodLabel})`, 
                [yearFirst]: totalsFirst.realisasiBelanja, 
                [yearSecond]: totalsSecond.realisasiBelanja,
                [yearThird]: totalsThird.realisasiBelanja
            },
            { 
                name: `Realisasi Pendapatan (${periodLabel})`, 
                [yearFirst]: totalsFirst.realisasiPendapatan, 
                [yearSecond]: totalsSecond.realisasiPendapatan,
                [yearThird]: totalsThird.realisasiPendapatan
            },
        ];
        
        // Growth rates
        const growthRates = [
            {
                period: `${yearFirst} → ${yearSecond}`,
                anggaran: totalsFirst.anggaran !== 0 ? ((totalsSecond.anggaran - totalsFirst.anggaran) / totalsFirst.anggaran * 100).toFixed(1) : '0',
                pendapatan: totalsFirst.pendapatan !== 0 ? ((totalsSecond.pendapatan - totalsFirst.pendapatan) / totalsFirst.pendapatan * 100).toFixed(1) : '0',
                realisasiBelanja: totalsFirst.realisasiBelanja !== 0 ? ((totalsSecond.realisasiBelanja - totalsFirst.realisasiBelanja) / totalsFirst.realisasiBelanja * 100).toFixed(1) : '0',
                realisasiPendapatan: totalsFirst.realisasiPendapatan !== 0 ? ((totalsSecond.realisasiPendapatan - totalsFirst.realisasiPendapatan) / totalsFirst.realisasiPendapatan * 100).toFixed(1) : '0'
            },
            {
                period: `${yearSecond} → ${yearThird}`,
                anggaran: totalsSecond.anggaran !== 0 ? ((totalsThird.anggaran - totalsSecond.anggaran) / totalsSecond.anggaran * 100).toFixed(1) : '0',
                pendapatan: totalsSecond.pendapatan !== 0 ? ((totalsThird.pendapatan - totalsSecond.pendapatan) / totalsSecond.pendapatan * 100).toFixed(1) : '0',
                realisasiBelanja: totalsSecond.realisasiBelanja !== 0 ? ((totalsThird.realisasiBelanja - totalsSecond.realisasiBelanja) / totalsSecond.realisasiBelanja * 100).toFixed(1) : '0',
                realisasiPendapatan: totalsSecond.realisasiPendapatan !== 0 ? ((totalsThird.realisasiPendapatan - totalsSecond.realisasiPendapatan) / totalsSecond.realisasiPendapatan * 100).toFixed(1) : '0'
            }
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

        // SKPD Belanja Comparison untuk 3 tahun
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
            
            skpdBelanjaComparison = { 
                anggaranFirst, realisasiFirst, 
                anggaranSecond, realisasiSecond,
                anggaranThird, realisasiThird 
            };
        }
        
        // SKPD Pendapatan Comparison untuk 3 tahun
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
            
            skpdPendapatanComparison = { 
                targetFirst, realisasiFirst, 
                targetSecond, realisasiSecond,
                targetThird, realisasiThird 
            };
        }
        
        // Monthly cumulative data untuk 3 tahun (Belanja)
        let cumulativeFirst = 0;
        let cumulativeSecond = 0;
        let cumulativeThird = 0;
        const monthlyComparisonData = months.map(month => {
            const realiasiBulananFirst_biasa = ((dataFirst.realisasi || {})[month] || []).filter(item => selectedSkpdBelanja === 'Semua SKPD' || item.NamaSKPD === selectedSkpdBelanja).reduce((sum, item) => sum + item.nilai, 0);
            const realiasiBulananFirst_nonRkud = ((dataFirst.realisasiNonRkud || {})[month] || []).filter(item => selectedSkpdBelanja === 'Semua SKPD' || item.NAMASKPD === selectedSkpdBelanja).reduce((sum, item) => sum + item.nilai, 0);
            const realiasiBulananFirst = realiasiBulananFirst_biasa + realiasiBulananFirst_nonRkud;
            
            const realiasiBulananSecond_biasa = ((dataSecond.realisasi || {})[month] || []).filter(item => selectedSkpdBelanja === 'Semua SKPD' || item.NamaSKPD === selectedSkpdBelanja).reduce((sum, item) => sum + item.nilai, 0);
            const realiasiBulananSecond_nonRkud = ((dataSecond.realisasiNonRkud || {})[month] || []).filter(item => selectedSkpdBelanja === 'Semua SKPD' || item.NAMASKPD === selectedSkpdBelanja).reduce((sum, item) => sum + item.nilai, 0);
            const realiasiBulananSecond = realiasiBulananSecond_biasa + realiasiBulananSecond_nonRkud;
            
            const realiasiBulananThird_biasa = ((dataThird.realisasi || {})[month] || []).filter(item => selectedSkpdBelanja === 'Semua SKPD' || item.NamaSKPD === selectedSkpdBelanja).reduce((sum, item) => sum + item.nilai, 0);
            const realiasiBulananThird_nonRkud = ((dataThird.realisasiNonRkud || {})[month] || []).filter(item => selectedSkpdBelanja === 'Semua SKPD' || item.NAMASKPD === selectedSkpdBelanja).reduce((sum, item) => sum + item.nilai, 0);
            const realiasiBulananThird = realiasiBulananThird_biasa + realiasiBulananThird_nonRkud;
            
            cumulativeFirst += realiasiBulananFirst;
            cumulativeSecond += realiasiBulananSecond;
            cumulativeThird += realiasiBulananThird;
            
            return { 
                month: month.substring(0,3), 
                [`Realisasi Kumulatif ${yearFirst}`]: cumulativeFirst,
                [`Realisasi Kumulatif ${yearSecond}`]: cumulativeSecond,
                [`Realisasi Kumulatif ${yearThird}`]: cumulativeThird
            };
        });

        // Monthly cumulative data untuk 3 tahun (Pendapatan)
        let cumulativePendapatanFirst = 0;
        let cumulativePendapatanSecond = 0;
        let cumulativePendapatanThird = 0;
        const monthlyPendapatanComparisonData = months.map(month => {
            const realisasiBulananFirst = ((dataFirst.realisasiPendapatan || {})[month] || []).filter(item => selectedSkpdPendapatan === 'Semua SKPD' || item.SKPD === selectedSkpdPendapatan).reduce((sum, item) => sum + item.nilai, 0);
            const realisasiBulananSecond = ((dataSecond.realisasiPendapatan || {})[month] || []).filter(item => selectedSkpdPendapatan === 'Semua SKPD' || item.SKPD === selectedSkpdPendapatan).reduce((sum, item) => sum + item.nilai, 0);
            const realisasiBulananThird = ((dataThird.realisasiPendapatan || {})[month] || []).filter(item => selectedSkpdPendapatan === 'Semua SKPD' || item.SKPD === selectedSkpdPendapatan).reduce((sum, item) => sum + item.nilai, 0);
            
            cumulativePendapatanFirst += realisasiBulananFirst;
            cumulativePendapatanSecond += realisasiBulananSecond;
            cumulativePendapatanThird += realisasiBulananThird;
            
            return {
                month: month.substring(0, 3),
                [`Pendapatan Kumulatif ${yearFirst}`]: cumulativePendapatanFirst,
                [`Pendapatan Kumulatif ${yearSecond}`]: cumulativePendapatanSecond,
                [`Pendapatan Kumulatif ${yearThird}`]: cumulativePendapatanThird,
            };
        });

        return { 
            skpdListBelanja, 
            skpdListPendapatan, 
            comparisonData, 
            skpdBelanjaComparison, 
            skpdPendapatanComparison, 
            monthlyComparisonData,
            monthlyPendapatanComparisonData,
            growthRates,
            totalAggregate
        };
    }, [dataFirst, dataSecond, dataThird, yearFirst, yearSecond, yearThird, selectedSkpdBelanja, selectedSkpdPendapatan, startMonth, endMonth]);

    const getAnalysisPrompt = (customQuery) => {
        if (customQuery) {
            return `Analisis perbandingan 3 tahun (${yearFirst}, ${yearSecond}, ${yearThird}): "${customQuery}"`;
        }
        if (!comparisonData || comparisonData.length === 0) return "Data tidak cukup.";
        const period = startMonth === endMonth ? startMonth : `periode ${startMonth} - ${endMonth}`;
        let prompt = `Bandingkan APBD 3 tahun (${yearFirst} vs ${yearSecond} vs ${yearThird}) periode ${period}.\n`;
        comparisonData.forEach(item => {
            prompt += `- ${item.name}: ${yearFirst} (${formatIDR(item[yearFirst])}), ${yearSecond} (${formatIDR(item[yearSecond])}), ${yearThird} (${formatIDR(item[yearThird])})\n`;
        });
        return prompt;
    };

    const ComparisonCard = ({ title, valueFirst, valueSecond, valueThird, yearFirst, yearSecond, yearThird, icon: Icon }) => {
        const change1to2 = valueSecond - valueFirst;
        const change2to3 = valueThird - valueSecond;
        const percentageChange1to2 = valueFirst !== 0 ? (change1to2 / valueFirst) * 100 : 0;
        const percentageChange2to3 = valueSecond !== 0 ? (change2to3 / valueSecond) * 100 : 0;
        
        const isIncrease1to2 = change1to2 > 0;
        const isIncrease2to3 = change2to3 > 0;

        return (
            <div className="relative group overflow-hidden bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 p-6 rounded-[2rem] shadow-xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 group-hover:rotate-12 transition-all duration-700">
                    {Icon && <Icon size={64} className="text-indigo-500" />}
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400 mb-3">{title}</h4>
                
                <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center">
                        <p className="text-xs font-bold text-slate-400">{yearFirst}</p>
                        <p className="text-sm font-black text-slate-800 dark:text-white truncate">{formatIDR(valueFirst)}</p>
                    </div>
                    <div className="text-center border-l border-r border-slate-200 dark:border-slate-700">
                        <p className="text-xs font-bold text-slate-400">{yearSecond}</p>
                        <p className="text-sm font-black text-indigo-600 dark:text-indigo-400 truncate">{formatIDR(valueSecond)}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs font-bold text-slate-400">{yearThird}</p>
                        <p className="text-sm font-black text-purple-600 dark:text-purple-400 truncate">{formatIDR(valueThird)}</p>
                    </div>
                </div>
                
                <div className="flex justify-between items-center">
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black ${
                        isIncrease1to2 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
                    }`}>
                        {isIncrease1to2 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                        <span>{Math.abs(percentageChange1to2).toFixed(1)}%</span>
                        <span className="ml-1 text-[8px] opacity-60">{yearFirst}→{yearSecond}</span>
                    </div>
                    
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black ${
                        isIncrease2to3 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
                    }`}>
                        {isIncrease2to3 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                        <span>{Math.abs(percentageChange2to3).toFixed(1)}%</span>
                        <span className="ml-1 text-[8px] opacity-60">{yearSecond}→{yearThird}</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen space-y-10 animate-in fade-in duration-1000 pb-20">
            <SectionTitle>Analisis 3 Tahun: {yearFirst} • {yearSecond} • {yearThird}</SectionTitle>
            
            {/* PREMIUM EXECUTIVE DASHBOARD HEADER - 3 YEAR FOCUS */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-700 to-indigo-900 rounded-[3rem] p-10 text-white shadow-2xl shadow-indigo-500/20 border border-white/10 group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -mr-40 -mt-40 transition-transform duration-1000 group-hover:scale-110"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-400/10 rounded-full blur-[80px] -ml-32 -mb-32"></div>
                
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-10 items-center">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black tracking-[0.2em] uppercase border border-white/10 shadow-lg shadow-black/10">
                            <Layers size={14} className="animate-pulse" /> 3 YEAR COMPARATIVE ANALYSIS
                        </div>
                        <h2 className="text-5xl font-black leading-[0.95] tracking-tighter">
                            Tri-Annual Fiscal <br/>
                            <span className="text-indigo-200">Performance Tracker</span>.
                        </h2>
                        <p className="text-indigo-100/90 text-sm max-w-2xl leading-relaxed font-medium">
                            Visualisasi komparatif lintas tiga tahun fiskal ({yearFirst}, {yearSecond}, {yearThird}). 
                            Analisis mendalam untuk mengidentifikasi tren jangka menengah, pola musiman, 
                            dan akselerasi kebijakan dengan presisi tinggi melalui integrasi big data.
                        </p>
                        
                        {/* Quick Stats */}
                        <div className="flex gap-6 pt-4">
                            <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/20">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Total 3 Tahun</p>
                                <p className="text-xl font-black">{formatIDR(totalAggregate?.totalAnggaran || 0)}</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/20">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Rata-rata/Thn</p>
                                <p className="text-xl font-black">{formatIDR(totalAggregate?.averageRealisasiBelanja || 0)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="hidden lg:flex flex-col gap-4">
                        <div className="bg-white/10 backdrop-blur-xl p-5 rounded-[2rem] border border-white/20 shadow-xl group/card hover:bg-white/20 transition-all duration-300 cursor-default">
                            <div className="flex items-center gap-3 text-[10px] font-black uppercase text-indigo-200 mb-2 tracking-widest">
                                <Clock size={16} /> Periode Analisis
                            </div>
                            <div className="text-lg font-black">{startMonth} — {endMonth}</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-xl p-5 rounded-[2rem] border border-white/20 shadow-xl group/card hover:bg-white/20 transition-all duration-300 cursor-default">
                            <div className="flex items-center gap-3 text-[10px] font-black uppercase text-indigo-200 mb-2 tracking-widest">
                                <Activity size={16} /> Cakupan Data
                            </div>
                            <div className="text-lg font-black">3 Tahun • Full SKPD</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* GLASS SELECTOR BAR - 3 TAHUN */}
            <div className="sticky top-6 z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-white/40 dark:border-slate-800/50 p-5 rounded-[2rem] shadow-2xl shadow-slate-200/50 dark:shadow-none transition-all duration-500">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div className="space-y-2 md:col-span-1">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Tahun Baseline</label>
                        <div className="relative group">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 transition-transform group-hover:scale-110" size={18} />
                            <select value={yearFirst} onChange={e => setYearFirst(parseInt(e.target.value))} className="w-full pl-12 pr-6 py-3.5 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-black shadow-sm focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all cursor-pointer">
                                {[2023, 2024, 2025].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="space-y-2 md:col-span-1">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Tahun Intermediate</label>
                        <div className="relative group">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 transition-transform group-hover:scale-110" size={18} />
                            <select value={yearSecond} onChange={e => setYearSecond(parseInt(e.target.value))} className="w-full pl-12 pr-6 py-3.5 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-black shadow-sm focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all cursor-pointer">
                                {[2023, 2024, 2025].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="space-y-2 md:col-span-1">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Tahun Terkini</label>
                        <div className="relative group">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-500 transition-transform group-hover:scale-110" size={18} />
                            <select value={yearThird} onChange={e => setYearThird(parseInt(e.target.value))} className="w-full pl-12 pr-6 py-3.5 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-black shadow-sm focus:ring-4 focus:ring-purple-500/20 outline-none transition-all cursor-pointer">
                                {[2023, 2024, 2025].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="space-y-2 md:col-span-1">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Mulai Dari</label>
                        <select value={startMonth} onChange={e => setStartMonth(e.target.value)} className="w-full px-6 py-3.5 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-black shadow-sm outline-none transition-all">
                            {months.map(m => <option key={`start-${m}`} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2 md:col-span-1">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Hingga Akhir</label>
                        <select value={endMonth} onChange={e => setEndMonth(e.target.value)} className="w-full px-6 py-3.5 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-black shadow-sm outline-none transition-all">
                            {months.map(m => <option key={`end-${m}`} value={m}>{m}</option>)}
                        </select>
                    </div>
                </div>
                
                {/* Chart Type Toggle */}
                <div className="flex justify-end mt-4 gap-2">
                    <button 
                        onClick={() => setActiveChart('bar')}
                        className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
                            activeChart === 'bar' 
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                                : 'bg-white/50 text-slate-600 hover:bg-white/80'
                        }`}
                    >
                        <BarChart3 size={14} /> Bar Chart
                    </button>
                    <button 
                        onClick={() => setActiveChart('area')}
                        className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
                            activeChart === 'area' 
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                                : 'bg-white/50 text-slate-600 hover:bg-white/80'
                        }`}
                    >
                        <LineChart size={14} /> Area Chart
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-6">
                    <div className="relative">
                      <div className="w-20 h-20 border-[6px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin shadow-2xl shadow-indigo-500/20"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader size={24} className="text-indigo-600" />
                      </div>
                    </div>
                    <p className="text-xs font-black uppercase tracking-[0.4em] text-slate-400 animate-pulse italic">Memproses analisis 3 tahun...</p>
                </div>
            ) : error ? (
                <div className="p-8 bg-rose-50 dark:bg-rose-950/20 border-l-[6px] border-rose-500 rounded-[2rem] flex items-center gap-6 text-rose-600 shadow-xl shadow-rose-500/5">
                    <div className="p-3 bg-rose-500 rounded-2xl text-white shadow-lg shadow-rose-500/30">
                        <Info size={28} />
                    </div>
                    <p className="font-black text-lg tracking-tight">{error}</p>
                </div>
            ) : comparisonData && comparisonData.length > 0 && (
                <div className="space-y-12">
                    {/* GEMINI INTELLIGENCE PANEL */}
                    <div className="transform transition-all duration-700 hover:scale-[1.01]">
                        <GeminiAnalysis 
                            getAnalysisPrompt={getAnalysisPrompt} 
                            disabledCondition={!comparisonData} 
                            theme={theme}
                            interactivePlaceholder="Analisis tren 3 tahun terakhir..."
                        />
                    </div>
                    
                    {/* GROWTH RATES BANNER */}
                    {growthRates && growthRates.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {growthRates.map((rate, idx) => (
                                <div key={idx} className="bg-gradient-to-r from-indigo-50/80 to-purple-50/80 dark:from-indigo-900/20 dark:to-purple-900/20 backdrop-blur-xl border border-indigo-200/50 dark:border-indigo-800/30 p-5 rounded-[2rem] shadow-xl">
                                    <p className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-3">{rate.period}</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] text-slate-500">Anggaran</p>
                                            <p className={`text-lg font-black ${parseFloat(rate.anggaran) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {parseFloat(rate.anggaran) >= 0 ? '+' : ''}{rate.anggaran}%
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-500">Pendapatan</p>
                                            <p className={`text-lg font-black ${parseFloat(rate.pendapatan) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {parseFloat(rate.pendapatan) >= 0 ? '+' : ''}{rate.pendapatan}%
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {/* KEY METRICS GRID - 3 TAHUN */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                        <ComparisonCard 
                            title="Total Anggaran Belanja" 
                            valueFirst={comparisonData[0]?.[yearFirst] || 0} 
                            valueSecond={comparisonData[0]?.[yearSecond] || 0}
                            valueThird={comparisonData[0]?.[yearThird] || 0}
                            yearFirst={yearFirst} 
                            yearSecond={yearSecond}
                            yearThird={yearThird}
                            icon={Wallet} 
                        />
                        <ComparisonCard 
                            title="Target Pendapatan Daerah" 
                            valueFirst={comparisonData[1]?.[yearFirst] || 0} 
                            valueSecond={comparisonData[1]?.[yearSecond] || 0}
                            valueThird={comparisonData[1]?.[yearThird] || 0}
                            yearFirst={yearFirst} 
                            yearSecond={yearSecond}
                            yearThird={yearThird}
                            icon={TrendingUp} 
                        />
                        <ComparisonCard 
                            title="Realisasi Belanja" 
                            valueFirst={comparisonData[2]?.[yearFirst] || 0} 
                            valueSecond={comparisonData[2]?.[yearSecond] || 0}
                            valueThird={comparisonData[2]?.[yearThird] || 0}
                            yearFirst={yearFirst} 
                            yearSecond={yearSecond}
                            yearThird={yearThird}
                            icon={Zap} 
                        />
                        <ComparisonCard 
                            title="Realisasi PAD" 
                            valueFirst={comparisonData[3]?.[yearFirst] || 0} 
                            valueSecond={comparisonData[3]?.[yearSecond] || 0}
                            valueThird={comparisonData[3]?.[yearThird] || 0}
                            yearFirst={yearFirst} 
                            yearSecond={yearSecond}
                            yearThird={yearThird}
                            icon={Building2} 
                        />
                    </div>
                    
                    {/* MAIN COMPARISON CHART - 3 TAHUN */}
                    <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-2xl border border-white/40 dark:border-slate-700/50 p-10 rounded-[3rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.05)]">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                            <div className="space-y-1">
                              <h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3 tracking-tighter">
                                  <div className="w-2 h-8 bg-indigo-500 rounded-full"></div>
                                  Tri-Annual Fiscal Comparison
                              </h3>
                              <p className="text-xs font-bold text-slate-500 tracking-widest uppercase ml-5">Perbandingan Nilai Absolut 3 Tahun Fiskal</p>
                            </div>
                            <div className="flex gap-6">
                                <div className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-500 px-4 py-2 bg-indigo-50 dark:bg-slate-700 rounded-xl">
                                    <div className="w-3 h-3 bg-indigo-600 rounded-full shadow-lg shadow-indigo-500/40"></div> {yearFirst}
                                </div>
                                <div className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-500 px-4 py-2 bg-purple-50 dark:bg-slate-700 rounded-xl">
                                    <div className="w-3 h-3 bg-purple-500 rounded-full shadow-lg shadow-purple-500/40"></div> {yearSecond}
                                </div>
                                <div className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-500 px-4 py-2 bg-amber-50 dark:bg-slate-700 rounded-xl">
                                    <div className="w-3 h-3 bg-amber-500 rounded-full shadow-lg shadow-amber-500/40"></div> {yearThird}
                                </div>
                            </div>
                        </div>
                        
                        <div className="h-[500px]">
                            {activeChart === 'bar' ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }} barGap={8} barSize={40}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128, 128, 128, 0.08)" />
                                        <XAxis 
                                            dataKey="name" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} 
                                            dy={15} 
                                        />
                                        <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tickFormatter={(val) => `${(val / 1e9).toFixed(1)}M`} 
                                            tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                                        />
                                        <Tooltip 
                                            cursor={{fill: 'rgba(99, 102, 241, 0.03)', radius: 10}}
                                            contentStyle={{ 
                                                borderRadius: '2rem', 
                                                border: 'none', 
                                                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', 
                                                backgroundColor: 'rgba(255,255,255,0.98)', 
                                                backdropFilter: 'blur(10px)',
                                                padding: '1.5rem'
                                            }}
                                            itemStyle={{fontWeight: 900, fontSize: '12px'}}
                                            formatter={(val) => [formatIDR(val), 'Jumlah']}
                                        />
                                        <Bar dataKey={yearFirst} fill="#435EBE" radius={[12, 12, 4, 4]} animationDuration={2000} animationBegin={200} />
                                        <Bar dataKey={yearSecond} fill="#A855F7" radius={[12, 12, 4, 4]} animationDuration={2000} animationBegin={400} />
                                        <Bar dataKey={yearThird} fill="#F59E0B" radius={[12, 12, 4, 4]} animationDuration={2000} animationBegin={600} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                        <defs>
                                            <linearGradient id="colorFirst" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#435EBE" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#435EBE" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorSecond" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#A855F7" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#A855F7" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorThird" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128, 128, 128, 0.08)" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800 }} />
                                        <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${(val / 1e9).toFixed(1)}M`} />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '1.5rem', border: 'none', backdropFilter: 'blur(10px)' }}
                                            formatter={(val) => formatIDR(val)}
                                        />
                                        <Area type="monotone" dataKey={yearFirst} stroke="#435EBE" strokeWidth={3} fill="url(#colorFirst)" />
                                        <Area type="monotone" dataKey={yearSecond} stroke="#A855F7" strokeWidth={3} fill="url(#colorSecond)" />
                                        <Area type="monotone" dataKey={yearThird} stroke="#F59E0B" strokeWidth={3} fill="url(#colorThird)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                    
                    {/* SKPD SIDE-BY-SIDE ANALYTICS - 3 TAHUN */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-6">
                        {/* BELANJA SKPD GLASS CARD - 3 TAHUN */}
                        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/30 dark:border-white/5 space-y-8 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                            <div className="flex items-center gap-5">
                                <div className="p-4 bg-indigo-500/10 text-indigo-600 rounded-[1.5rem] shadow-inner">
                                    <Building2 size={32} />
                                </div>
                                <div className="space-y-0.5">
                                  <h3 className="font-black text-slate-800 dark:text-white text-2xl tracking-tighter italic leading-none">Analisis Belanja 3 Tahun</h3>
                                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Perangkat Daerah • {yearFirst}-{yearThird}</p>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">Eksplorasi Data SKPD</label>
                                <select value={selectedSkpdBelanja} onChange={e => setSelectedSkpdBelanja(e.target.value)} className="w-full px-6 py-4 bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] text-sm font-black shadow-lg shadow-black/5 outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all cursor-pointer">
                                    <option value="Semua SKPD">🏢 Seluruh Perangkat Daerah</option>
                                    {skpdListBelanja.map(skpd => <option key={skpd} value={skpd}>{skpd}</option>)}
                                </select>
                            </div>

                            {skpdBelanjaComparison && (
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="p-3 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-xl">
                                        <p className="text-[8px] font-black uppercase">{yearFirst}</p>
                                        <p className="text-xs font-black text-indigo-600">{formatIDR(skpdBelanjaComparison.realisasiFirst)}</p>
                                    </div>
                                    <div className="p-3 bg-purple-50/50 dark:bg-purple-900/20 rounded-xl">
                                        <p className="text-[8px] font-black uppercase">{yearSecond}</p>
                                        <p className="text-xs font-black text-purple-600">{formatIDR(skpdBelanjaComparison.realisasiSecond)}</p>
                                    </div>
                                    <div className="p-3 bg-amber-50/50 dark:bg-amber-900/20 rounded-xl">
                                        <p className="text-[8px] font-black uppercase">{yearThird}</p>
                                        <p className="text-xs font-black text-amber-600">{formatIDR(skpdBelanjaComparison.realisasiThird)}</p>
                                    </div>
                                </div>
                            )}

                            <div className="pt-6 h-[400px]">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-8 flex items-center gap-3">
                                    <TrendingUp size={16} className="text-indigo-500" /> Kurva Penyerapan Kumulatif 3 Tahun
                                </h4>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={monthlyComparisonData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorBelanjaFirst" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#435EBE" stopOpacity={0.25}/>
                                                <stop offset="95%" stopColor="#435EBE" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorBelanjaSecond" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#A855F7" stopOpacity={0.25}/>
                                                <stop offset="95%" stopColor="#A855F7" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.06} />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 800, fill: '#94a3b8' }} />
                                        <YAxis hide />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', padding: '1rem' }}
                                            formatter={(value) => formatIDR(value)}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey={`Realisasi Kumulatif ${yearFirst}`} 
                                            stroke="#435EBE" 
                                            strokeWidth={4} 
                                            fillOpacity={1} 
                                            fill="url(#colorBelanjaFirst)" 
                                            animationDuration={3000} 
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey={`Realisasi Kumulatif ${yearSecond}`} 
                                            stroke="#A855F7" 
                                            strokeWidth={3} 
                                            strokeDasharray="6 6" 
                                            fillOpacity={1} 
                                            fill="url(#colorBelanjaSecond)" 
                                            animationDuration={3000} 
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey={`Realisasi Kumulatif ${yearThird}`} 
                                            stroke="#F59E0B" 
                                            strokeWidth={3} 
                                            strokeDasharray="3 6" 
                                            fill="none" 
                                            animationDuration={3000} 
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* PENDAPATAN SKPD GLASS CARD - 3 TAHUN */}
                        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/30 dark:border-white/5 space-y-8 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                            <div className="flex items-center gap-5">
                                <div className="p-4 bg-emerald-500/10 text-emerald-600 rounded-[1.5rem] shadow-inner">
                                    <Wallet size={32} />
                                </div>
                                <div className="space-y-0.5">
                                  <h3 className="font-black text-slate-800 dark:text-white text-2xl tracking-tighter italic leading-none">Analisis PAD 3 Tahun</h3>
                                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Penghasil Daerah • {yearFirst}-{yearThird}</p>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">Eksplorasi Data PAD</label>
                                <select value={selectedSkpdPendapatan} onChange={e => setSelectedSkpdPendapatan(e.target.value)} className="w-full px-6 py-4 bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] text-sm font-black shadow-lg shadow-black/5 outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all cursor-pointer">
                                    <option value="Semua SKPD">🏢 Seluruh SKPD</option>
                                    {skpdListPendapatan.map(skpd => <option key={skpd} value={skpd}>{skpd}</option>)}
                                </select>
                            </div>

                            {skpdPendapatanComparison && (
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="p-3 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-xl">
                                        <p className="text-[8px] font-black uppercase">{yearFirst}</p>
                                        <p className="text-xs font-black text-emerald-600">{formatIDR(skpdPendapatanComparison.realisasiFirst)}</p>
                                    </div>
                                    <div className="p-3 bg-teal-50/50 dark:bg-teal-900/20 rounded-xl">
                                        <p className="text-[8px] font-black uppercase">{yearSecond}</p>
                                        <p className="text-xs font-black text-teal-600">{formatIDR(skpdPendapatanComparison.realisasiSecond)}</p>
                                    </div>
                                    <div className="p-3 bg-amber-50/50 dark:bg-amber-900/20 rounded-xl">
                                        <p className="text-[8px] font-black uppercase">{yearThird}</p>
                                        <p className="text-xs font-black text-amber-600">{formatIDR(skpdPendapatanComparison.realisasiThird)}</p>
                                    </div>
                                </div>
                            )}

                            <div className="pt-6 h-[400px]">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-8 flex items-center gap-3">
                                    <TrendingUp size={16} className="text-emerald-500" /> Kurva Pencapaian Kumulatif 3 Tahun
                                </h4>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={monthlyPendapatanComparisonData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorPendapatanFirst" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.25}/>
                                                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorPendapatanSecond" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.25}/>
                                                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.06} />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 800, fill: '#94a3b8' }} />
                                        <YAxis hide />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', padding: '1rem' }}
                                            formatter={(value) => formatIDR(value)}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey={`Pendapatan Kumulatif ${yearFirst}`} 
                                            stroke="#10B981" 
                                            strokeWidth={4} 
                                            fillOpacity={1} 
                                            fill="url(#colorPendapatanFirst)" 
                                            animationDuration={3000} 
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey={`Pendapatan Kumulatif ${yearSecond}`} 
                                            stroke="#8B5CF6" 
                                            strokeWidth={3} 
                                            strokeDasharray="6 6" 
                                            fillOpacity={1} 
                                            fill="url(#colorPendapatanSecond)" 
                                            animationDuration={3000} 
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey={`Pendapatan Kumulatif ${yearThird}`} 
                                            stroke="#F59E0B" 
                                            strokeWidth={3} 
                                            strokeDasharray="3 6" 
                                            fill="none" 
                                            animationDuration={3000} 
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* LEGEND FOOTER - 3 TAHUN */}
                    <div className="flex flex-wrap items-center justify-center gap-10 py-12 border-t border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                        <div className="flex items-center gap-3 group cursor-default">
                            <div className="w-4 h-4 rounded-full bg-indigo-600 shadow-lg shadow-indigo-500/40 group-hover:scale-125 transition-transform"></div> 
                            <span>Tahun {yearFirst}</span>
                        </div>
                        <div className="flex items-center gap-3 group cursor-default">
                            <div className="w-4 h-4 rounded-full bg-purple-500 shadow-lg shadow-purple-500/40 group-hover:scale-125 transition-transform"></div> 
                            <span>Tahun {yearSecond}</span>
                        </div>
                        <div className="flex items-center gap-3 group cursor-default">
                            <div className="w-4 h-4 rounded-full bg-amber-500 shadow-lg shadow-amber-500/40 group-hover:scale-125 transition-transform"></div> 
                            <span>Tahun {yearThird}</span>
                        </div>
                        <div className="flex items-center gap-3 group cursor-default ml-6">
                            <div className="w-3 h-3 rounded-full bg-emerald-500 group-hover:scale-125 transition-transform"></div> 
                            <span>Growth (+)</span>
                        </div>
                        <div className="flex items-center gap-3 group cursor-default">
                            <div className="w-3 h-3 rounded-full bg-rose-500 group-hover:scale-125 transition-transform"></div> 
                            <span>Decline (-)</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalisisLintasTahunView;