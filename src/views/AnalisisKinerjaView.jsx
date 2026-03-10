import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, LineChart, Line, AreaChart, Area, Cell,
  ComposedChart, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { 
  Loader, TrendingUp, Calendar, Building2, Wallet, 
  ArrowUpRight, ArrowDownRight, LayoutDashboard, Info, ChevronRight,
  Zap, Clock, Sparkles, MessageSquare, Award, ChevronDown, ChevronsUpDown,
  Layout, Table as TableIcon, Filter, Target, Crown, Eye, Lightbulb,
  Briefcase, Users, TrendingUp as TrendingUpIcon, AlertCircle, CheckCircle2
} from 'lucide-react';

// === IMPORT yang benar dari aplikasi yang sudah ada ===
import { db, appId } from '../../utils/firebase';
import { formatIDR } from '../../utils';
import { auth } from '../../utils/firebase'; // Import auth instance
import GeminiAnalysis from '../components/GeminiAnalysis';

// === DEBUG: TAMBAHKAN INI DI BARIS PERTAMA FILE ===
console.log('🔥🔥🔥 ANALISIS KINERJA VIEW DIMUAT - VERSI DENGAN PANEL EKSEKUTIF 🔥🔥🔥');
console.log('Timestamp:', new Date().toISOString());

// ==================== SECTION TITLE COMPONENT ====================
const SectionTitle = ({ children }) => (
  <div className="relative mb-8 group">
    <h2 className="text-3xl font-black tracking-tighter text-slate-800 dark:text-white transition-all">
      {children}
    </h2>
    <div className="absolute -bottom-2 left-0 h-1.5 w-12 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full transition-all group-hover:w-24"></div>
  </div>
);

// --- Komponen Grafik Kombinasi (STYLE UPDATED) ---
const CombinationChart = ({ data, yearA, yearB, analysisType }) => {
  const COLORS = ['#435EBE', '#10B981', '#F59E0B', '#6366F1', '#EC4899', '#8B5CF6'];
  
  const chartData = data.map(item => {
    if (analysisType === 'Belanja') {
      return {
        name: item.skpd.length > 20 ? item.skpd.substring(0, 20) + '...' : item.skpd,
        skpdFull: item.skpd,
        [`pagu${yearA}`]: item.paguA / 1e9,
        [`realisasi${yearA}`]: item.realisasiA / 1e9,
        [`persen${yearA}`]: item.kinerjaA,
        [`pagu${yearB}`]: item.paguB / 1e9,
        [`realisasi${yearB}`]: item.realisasiB / 1e9,
        [`persen${yearB}`]: item.kinerjaB,
      };
    } else {
      return {
        name: item.skpd.length > 20 ? item.skpd.substring(0, 20) + '...' : item.skpd,
        skpdFull: item.skpd,
        [`target${yearA}`]: item.targetA / 1e9,
        [`realisasi${yearA}`]: item.realisasiA / 1e9,
        [`persen${yearA}`]: item.kinerjaA,
        [`target${yearB}`]: item.targetB / 1e9,
        [`realisasi${yearB}`]: item.realisasiB / 1e9,
        [`persen${yearB}`]: item.kinerjaB,
      };
    }
  }).slice(0, 15);

  return (
    <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-2xl border border-white/40 dark:border-slate-700/50 p-8 rounded-[3rem] shadow-2xl mt-10 animate-in zoom-in-95 duration-500">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-2 h-8 bg-purple-500 rounded-full"></div>
        <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tighter italic">
          Komposisi {analysisType} <span className="text-purple-600">{yearA}</span> vs <span className="text-slate-400">{yearB}</span>
        </h3>
      </div>
      
      <div className="h-[550px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128, 128, 128, 0.08)" />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              interval={0} 
              height={80}
              tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              yAxisId="left"
              tickFormatter={(val) => `${val}M`} 
              tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              domain={[0, 100]}
              tickFormatter={(val) => `${val}%`}
              tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              cursor={{fill: 'rgba(99, 102, 241, 0.03)', radius: 12}}
              contentStyle={{ 
                borderRadius: '2rem', border: 'none', 
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.2)', 
                backgroundColor: 'rgba(255,255,255,0.98)', 
                backdropFilter: 'blur(10px)',
                padding: '1.5rem'
              }}
              formatter={(value, name) => {
                if (name.includes('persen')) return [`${value.toFixed(2)}%`, 'Efektivitas'];
                return [formatIDR(value * 1e9), 'Volume'];
              }}
            />
            <Legend verticalAlign="top" height={50} iconType="circle" wrapperStyle={{paddingBottom: '20px', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em'}} />
            
            <Bar yAxisId="left" dataKey={analysisType === 'Belanja' ? `pagu${yearA}` : `target${yearA}`} name={`Volume ${yearA}`} radius={[8, 8, 0, 0]} barSize={25}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
              ))}
            </Bar>
            
            <Bar yAxisId="left" dataKey={`realisasi${yearA}`} name={`Realisasi ${yearA}`} radius={[8, 8, 0, 0]} barSize={15} fill="#10B981" animationDuration={2000} />
            
            <Line yAxisId="right" type="monotone" dataKey={`persen${yearA}`} name={`% Kinerja ${yearA}`} stroke="#8B5CF6" strokeWidth={4} dot={{ r: 4, fill: '#8B5CF6', strokeWidth: 2, stroke: '#fff' }} animationDuration={3000} />
            <Line yAxisId="right" type="monotone" dataKey={`persen${yearB}`} name={`% Kinerja ${yearB}`} stroke="#94A3B8" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3, fill: '#94A3B8' }} animationDuration={3000} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10">
        {[
          { label: `Pagu ${yearA}`, val: data.reduce((s, i) => s + (analysisType === 'Belanja' ? i.paguA : i.targetA), 0), color: 'text-indigo-600', bg: 'bg-indigo-50/50' },
          { label: `Realisasi ${yearA}`, val: data.reduce((s, i) => s + i.realisasiA, 0), color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
          { label: `Pagu ${yearB}`, val: data.reduce((s, i) => s + (analysisType === 'Belanja' ? i.paguB : i.targetB), 0), color: 'text-slate-600', bg: 'bg-slate-50/50' },
          { label: `Realisasi ${yearB}`, val: data.reduce((s, i) => s + i.realisasiB, 0), color: 'text-orange-600', bg: 'bg-orange-50/50' }
        ].map((stat, idx) => (
          <div key={idx} className={`${stat.bg} p-5 rounded-3xl border border-white/50 text-left transition-transform hover:scale-105`}>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{stat.label}</p>
            <p className={`text-sm font-black ${stat.color} truncate`}>{formatIDR(stat.val)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- MAIN ANALISIS KINERJA VIEW ---
const AnalisisKinerjaView = ({ data = {}, theme, selectedYear, userRole }) => {
    const [user, setUser] = React.useState(null);
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    const [yearA, setYearA] = React.useState(selectedYear || 2024);
    const [yearB, setYearB] = React.useState((selectedYear || 2024) - 1);
    const [startMonth, setStartMonth] = React.useState(months[0]);
    const [endMonth, setEndMonth] = React.useState(months[months.length - 1]);
    const [analysisType, setAnalysisType] = React.useState('Belanja');
    const [dataA, setDataA] = React.useState(null);
    const [dataB, setDataB] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [sortConfig, setSortConfig] = React.useState({ key: 'kinerjaA', direction: 'descending' });
    const [selectedSkpd, setSelectedSkpd] = React.useState('Semua SKPD');
    const [viewMode, setViewMode] = React.useState('table');
    const [showAnalysis, setShowAnalysis] = React.useState(true);

    // Auth - gunakan onAuthStateChanged
    React.useEffect(() => {
      const unsubscribe = auth.onAuthStateChanged(setUser);
      return () => unsubscribe();
    }, []);

    // Perbaiki fetchDataForYear - gunakan path Firebase yang benar
    const fetchDataForYear = async (year) => {
        if (!user) return null;
        const dataTypes = ['anggaran', 'pendapatan', 'realisasi', 'realisasiPendapatan', 'realisasiNonRkud'];
        const yearData = {};
        
        for (const dataType of dataTypes) {
            // Perbaikan: Gunakan path yang benar sesuai aplikasi
            const collRef = collection(db, 'artifacts', appId, 'public', 'data', String(year), dataType);
            const snapshot = await getDocs(query(collRef));
            let data = [];
            snapshot.forEach(doc => { 
                data = [...data, ...doc.data().data]; 
            });
            
            if (dataType === 'realisasi' || dataType === 'realisasiPendapatan' || dataType === 'realisasiNonRkud') {
                yearData[dataType] = data.reduce((acc, item) => {
                    const month = item.month || 'Lainnya';
                    if (!acc[month]) acc[month] = [];
                    acc[month].push(item);
                    return acc;
                }, {});
            } else { 
                yearData[dataType] = data; 
            }
        }
        return yearData;
    };

    React.useEffect(() => {
        const loadComparisonData = async () => {
            if (yearA === yearB) {
                setError("Silakan pilih dua tahun yang berbeda.");
                setDataA(null); setDataB(null); return;
            }
            setError(''); setIsLoading(true);
            try {
                const [fetchedDataA, fetchedDataB] = await Promise.all([fetchDataForYear(yearA), fetchDataForYear(yearB)]);
                setDataA(fetchedDataA); setDataB(fetchedDataB);
            } catch (e) { 
                console.error("Error fetching comparison data:", e);
                setError("Gagal memuat data perbandingan."); 
            } finally { 
                setIsLoading(false); 
            }
        };
        if (user) { loadComparisonData(); }
    }, [yearA, yearB, user]);

    const { performanceData, skpdList, radarData } = React.useMemo(() => {
        if (!dataA || !dataB) return { performanceData: [], skpdList: [], radarData: [] };

        let skpdMap = new Map();
        const processData = (data, year, type) => {
            const startIndex = months.indexOf(startMonth);
            const endIndex = months.indexOf(endMonth);
            const selectedMonths = months.slice(startIndex, endIndex + 1);

            let realisasiData = [];
            if (type === 'Belanja') {
                const realisasiBiasa = selectedMonths.map(month => data.realisasi?.[month] || []).flat();
                const realisasiNonRkudData = selectedMonths.map(month => data.realisasiNonRkud?.[month] || []).flat();
                realisasiData = [...realisasiBiasa, ...realisasiNonRkudData];
            } else {
                realisasiData = selectedMonths.map(month => data.realisasiPendapatan?.[month] || []).flat();
            }

            const targetData = data[type === 'Belanja' ? 'anggaran' : 'pendapatan'] || [];
            targetData.forEach(item => {
                const skpdName = item.NamaSKPD || item.NamaOPD || 'Tanpa SKPD/OPD';
                if (!skpdMap.has(skpdName)) skpdMap.set(skpdName, { skpd: skpdName });
                const skpd = skpdMap.get(skpdName);
                if (type === 'Belanja') {
                    skpd[`pagu${year}`] = (skpd[`pagu${year}`] || 0) + (item.nilai || 0);
                } else {
                    skpd[`target${year}`] = (skpd[`target${year}`] || 0) + (item.nilai || 0);
                }
            });

            realisasiData.forEach(item => {
                const skpdName = item.NamaSKPD || item.SKPD || item.NAMASKPD || 'Tanpa SKPD/OPD';
                if (!skpdMap.has(skpdName)) skpdMap.set(skpdName, { skpd: skpdName });
                const skpd = skpdMap.get(skpdName);
                skpd[`realisasi${year}`] = (skpd[`realisasi${year}`] || 0) + (item.nilai || 0);
            });
        };

        processData(dataA, 'A', analysisType);
        processData(dataB, 'B', analysisType);
        
        const skpdList = Array.from(skpdMap.keys()).sort();

        const performanceData = Array.from(skpdMap.values()).map(skpd => {
            if (analysisType === 'Belanja') {
                const paguA = skpd.paguA || 0;
                const realisasiA = skpd.realisasiA || 0;
                const paguB = skpd.paguB || 0;
                const realisasiB = skpd.realisasiB || 0;
                return {
                    ...skpd, paguA, realisasiA, paguB, realisasiB,
                    kinerjaA: paguA > 0 ? (realisasiA / paguA) * 100 : 0,
                    kinerjaB: paguB > 0 ? (realisasiB / paguB) * 100 : 0,
                };
            } else {
                const targetA = skpd.targetA || 0;
                const realisasiA = skpd.realisasiA || 0;
                const targetB = skpd.targetB || 0;
                const realisasiB = skpd.realisasiB || 0;
                return {
                    ...skpd, targetA, realisasiA, targetB, realisasiB,
                    kinerjaA: targetA > 0 ? (realisasiA / targetA) * 100 : 0,
                    kinerjaB: targetB > 0 ? (realisasiB / targetB) * 100 : 0,
                };
            }
        });
        
        let radarData = [];
        if (selectedSkpd !== 'Semua SKPD') {
            const skpdData = performanceData.find(d => d.skpd === selectedSkpd);
            if (skpdData) {
                const targetLabel = analysisType === 'Belanja' ? 'Pagu' : 'Target';
                radarData = [
                    { subject: targetLabel, A: skpdData[analysisType === 'Belanja' ? 'paguA' : 'targetA'], B: skpdData[analysisType === 'Belanja' ? 'paguB' : 'targetB'] },
                    { subject: 'Realisasi', A: skpdData.realisasiA, B: skpdData.realisasiB },
                    { subject: 'Efektivitas (%)', A: skpdData.kinerjaA, B: skpdData.kinerjaB },
                ];
            }
        }
        return { performanceData, skpdList, radarData };
    }, [dataA, dataB, analysisType, startMonth, endMonth, selectedSkpd]);

    const sortedData = React.useMemo(() => {
        let dataToDisplay = performanceData;
        if (selectedSkpd !== 'Semua SKPD') {
            dataToDisplay = performanceData.filter(item => item.skpd === selectedSkpd);
        }
        if (sortConfig.key) {
            return [...dataToDisplay].sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return dataToDisplay;
    }, [performanceData, sortConfig, selectedSkpd]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    // Perbaiki fungsi getAnalysisPrompt untuk komponen universal
const getAnalysisPrompt = (query, allData) => {
    // Jika user mengirim query khusus
    if (query && query.trim() !== '') {
        return `Berdasarkan data kinerja ${analysisType} tahun ${yearA} vs ${yearB}, jawab pertanyaan ini: ${query}`;
    }
    
    // Analisis default
    if (sortedData.length === 0) return "Data tidak cukup untuk dianalisis.";
    
    const top5 = sortedData.slice(0, 5);
    const low5 = sortedData.slice(-5).reverse();
    
    return `ANALISIS KINERJA PERANGKAT DAERAH
TAHUN: ${yearA} (Fokus) vs ${yearB} (Benchmark)
Jenis Analisis: ${analysisType}

DATA RINGKAS:
- Total SKPD/OPD: ${skpdList.length}
- Periode Analisis: ${startMonth} - ${endMonth}

SKPD DENGAN KINERJA TERTINGGI:
${top5.map((item, i) => `${i+1}. ${item.skpd}: ${item.kinerjaA.toFixed(2)}% (${analysisType === 'Belanja' ? 'Pagu' : 'Target'}: ${formatIDR(item.paguA || item.targetA)}, Realisasi: ${formatIDR(item.realisasiA)})`).join('\n')}

SKPD DENGAN KINERJA TERENDAH:
${low5.map((item, i) => `${i+1}. ${item.skpd}: ${item.kinerjaA.toFixed(2)}% (Delta: ${(item.kinerjaA - item.kinerjaB).toFixed(2)} pp)`).join('\n')}

BERIKAN ANALISIS MENDALAM MENGENAI:
1. Peringatan Utama (Early Warning): Identifikasi SKPD dengan kinerja sangat rendah (<50%) dan penurunan signifikan.
2. Evaluasi Kinerja: Bandingkan kinerja tahun ${yearA} dengan ${yearB}. Apakah terjadi peningkatan atau penurunan secara umum?
3. Rekomendasi Strategis: 3 langkah konkret untuk meningkatkan kinerja SKPD dengan kinerja rendah.
4. Catatan Tambahan: Poin penting lainnya untuk rapat pimpinan.

Gunakan bahasa profesional, langsung ke inti, tanpa basa-basi.`;
};

    const renderSortIcon = (key) => {
        if (sortConfig.key !== key) return <ChevronsUpDown size={14} className="ml-1 opacity-30" />;
        return sortConfig.direction === 'ascending' ? <ChevronDown size={14} className="ml-1 text-purple-600" /> : <ChevronDown size={14} className="ml-1 transform rotate-180 text-purple-600" />;
    };

    return (
        <div className="min-h-screen space-y-10 animate-in fade-in duration-1000 pb-20 text-left">
            <SectionTitle>Analisis Kinerja Perangkat Daerah</SectionTitle>
            
            {/* PANEL INFORMASI UNTUK PIMPINAN - PREMIUM EXECUTIVE BRIEFING */}
            <div className="relative overflow-hidden bg-gradient-to-br from-purple-700 via-indigo-800 to-slate-900 rounded-[3rem] p-8 text-white shadow-2xl border border-white/20 group">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-[100px] -mr-40 -mt-40"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-400/10 rounded-full blur-[80px] -ml-32 -mb-32"></div>
                <div className="absolute top-20 left-20 w-40 h-40 bg-yellow-500/5 rounded-full blur-[60px]"></div>
                
                {/* Crown Icon for Leadership */}
                <div className="absolute top-8 right-12 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Crown size={120} className="text-yellow-400" />
                </div>
                
                <div className="relative z-10">
                    {/* Header dengan ikon eksekutif */}
                    <div className="flex items-center gap-4 mb-6 border-b border-white/20 pb-6">
                        <div className="p-4 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl shadow-lg shadow-yellow-500/30">
                            <Briefcase size={32} className="text-white" />
                        </div>
                        <div>
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black tracking-[0.2em] uppercase border border-white/30 mb-2">
                                <Eye size={12} className="text-yellow-300" /> EXECUTIVE DASHBOARD
                            </div>
                            <h2 className="text-3xl font-black tracking-tighter leading-tight">
                                ARAHAN DAN EVALUASI <br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">KINERJA PERANGKAT DAERAH</span>
                            </h2>
                        </div>
                    </div>

                    {/* 3 Card Utama untuk Pimpinan */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                        {/* Card 1: Tujuan Menu */}
                        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 border border-white/20 hover:bg-white/15 transition-all group/card">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-purple-500/30 rounded-xl">
                                    <Target size={20} className="text-purple-200" />
                                </div>
                                <h3 className="font-black text-sm uppercase tracking-wider">TUJUAN ANALISIS</h3>
                            </div>
                            <p className="text-sm text-purple-100 leading-relaxed">
                                Menu ini dirancang untuk <span className="font-black text-white">membantu pimpinan</span> dalam memantau efektivitas kinerja seluruh Perangkat Daerah secara komparatif antar tahun.
                            </p>
                            <ul className="mt-3 space-y-2 text-xs text-purple-200">
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 size={14} className="text-green-300 mt-0.5 flex-shrink-0" />
                                    <span>Identifikasi SKPD dengan kinerja optimal dan perlu pendampingan</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 size={14} className="text-green-300 mt-0.5 flex-shrink-0" />
                                    <span>Evaluasi tren pertumbuhan realisasi vs pagu/target dalam persentase</span>
                                </li>
                            </ul>
                        </div>

                        {/* Card 2: Panduan Membaca Data */}
                        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 border border-white/20 hover:bg-white/15 transition-all group/card">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-blue-500/30 rounded-xl">
                                    <Lightbulb size={20} className="text-blue-200" />
                                </div>
                                <h3 className="font-black text-sm uppercase tracking-wider">PANDUAN MEMBACA DATA</h3>
                            </div>
                            <p className="text-sm text-purple-100 leading-relaxed mb-3">
                                Fokus pada 3 indikator utama:
                            </p>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                    <span className="text-xs font-bold text-purple-200">Kinerja &gt; 85%</span>
                                    <span className="text-xs px-2 py-1 bg-emerald-500/30 rounded-full text-emerald-200 font-black">OPTIMAL</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                    <span className="text-xs font-bold text-purple-200">Kinerja 50-85%</span>
                                    <span className="text-xs px-2 py-1 bg-yellow-500/30 rounded-full text-yellow-200 font-black">PROGRES</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                    <span className="text-xs font-bold text-purple-200">Kinerja &lt; 50%</span>
                                    <span className="text-xs px-2 py-1 bg-rose-500/30 rounded-full text-rose-200 font-black">BUTUH ATENSI</span>
                                </div>
                            </div>
                        </div>

                        {/* Card 3: Insight Cepat */}
                        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 border border-white/20 hover:bg-white/15 transition-all group/card">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-amber-500/30 rounded-xl">
                                    <TrendingUpIcon size={20} className="text-amber-200" />
                                </div>
                                <h3 className="font-black text-sm uppercase tracking-wider">INSIGHT CEPAT</h3>
                            </div>
                            <p className="text-sm text-purple-100 leading-relaxed mb-2">
                                Perhatikan kolom <span className="font-black text-white">Delta (pp)</span> untuk melihat pertumbuhan kinerja.
                            </p>
                            <div className="flex items-center gap-2 bg-white/5 p-3 rounded-xl">
                                <ArrowUpRight size={20} className="text-emerald-400" />
                                <div>
                                    <p className="text-xs font-black text-emerald-300">Positif Delta</p>
                                    <p className="text-[10px] text-purple-200">Peningkatan efektivitas</p>
                                </div>
                                <ArrowDownRight size={20} className="text-rose-400 ml-2" />
                                <div>
                                    <p className="text-xs font-black text-rose-300">Negatif Delta</p>
                                    <p className="text-[10px] text-purple-200">Perlu evaluasi</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Row untuk Pimpinan */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div className="bg-black/20 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                            <p className="text-[10px] font-black uppercase tracking-wider text-purple-300">Total SKPD</p>
                            <p className="text-xl font-black text-white">{skpdList.length}</p>
                        </div>
                        <div className="bg-black/20 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                            <p className="text-[10px] font-black uppercase tracking-wider text-purple-300">Periode Analisis</p>
                            <p className="text-lg font-black text-white">{startMonth} - {endMonth}</p>
                        </div>
                        <div className="bg-black/20 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                            <p className="text-[10px] font-black uppercase tracking-wider text-purple-300">Tahun Fokus</p>
                            <p className="text-xl font-black text-white">{yearA}</p>
                        </div>
                        <div className="bg-black/20 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                            <p className="text-[10px] font-black uppercase tracking-wider text-purple-300">Benchmark</p>
                            <p className="text-xl font-black text-white">{yearB}</p>
                        </div>
                    </div>

                    {/* Executive Note */}
                    <div className="mt-6 flex items-center gap-3 text-sm text-purple-200 bg-purple-900/30 p-4 rounded-2xl border border-purple-500/30">
                        <AlertCircle size={20} className="text-yellow-300 flex-shrink-0" />
                        <p className="text-xs leading-relaxed">
                            <span className="font-black text-white">CATATAN EKSEKUTIF:</span> Gunakan filter "Unit Kerja" untuk analisis mendalam per SKPD. 
                            Grafik radar menampilkan perbandingan head-to-head antara tahun {yearA} dan {yearB}. 
                            Klik header tabel untuk mengurutkan data berdasarkan indikator yang diinginkan.
                        </p>
                    </div>
                </div>
            </div>
            
            {/* SELEKTOR GLASS BAR */}
            <div className="sticky top-6 z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-white/40 dark:border-slate-800/50 p-6 rounded-[2.5rem] shadow-2xl flex flex-wrap gap-6 items-center transition-all duration-500">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">Tahun Fokus</label>
                        <select value={yearA} onChange={e => setYearA(parseInt(e.target.value))} className="w-full px-4 py-2.5 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-black focus:ring-4 focus:ring-purple-500/20 outline-none">
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">Benchmark</label>
                        <select value={yearB} onChange={e => setYearB(parseInt(e.target.value))} className="w-full px-4 py-2.5 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-black focus:ring-4 focus:ring-purple-500/20 outline-none">
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">Analisis</label>
                        <select value={analysisType} onChange={e => setAnalysisType(e.target.value)} className="w-full px-4 py-2.5 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-black focus:ring-4 focus:ring-purple-500/20 outline-none">
                            <option>Belanja</option><option>Pendapatan</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">Mulai Dari</label>
                        <select value={startMonth} onChange={e => setStartMonth(e.target.value)} className="w-full px-4 py-2.5 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-black outline-none">
                            {months.map(m => <option key={`start-${m}`} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">Sampai Akhir</label>
                        <select value={endMonth} onChange={e => setEndMonth(e.target.value)} className="w-full px-4 py-2.5 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-black outline-none">
                            {months.map(m => <option key={`end-${m}`} value={m}>{m}</option>)}
                        </select>
                    </div>
                </div>
                
                {/* View Toggle */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
                    <button onClick={() => setViewMode('table')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 shadow-md' : 'opacity-40 hover:opacity-100'}`}>
                        <TableIcon size={14} /> TABEL
                    </button>
                    <button onClick={() => setViewMode('chart')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${viewMode === 'chart' ? 'bg-white dark:bg-slate-700 shadow-md text-purple-600' : 'opacity-40 hover:opacity-100'}`}>
                        <Layout size={14} /> GRAFIK
                    </button>
                </div>
            </div>

            {/* GEMINI INTELLIGENCE */}
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
  
  {/* Komponen GeminiAnalysis dengan Conditional Rendering */}
  {showAnalysis && (
    <GeminiAnalysis 
      getAnalysisPrompt={getAnalysisPrompt} 
      disabledCondition={sortedData.length === 0} 
      userCanUseAi={userRole !== 'viewer'} // Sesuaikan dengan role user
      allData={{
        analysisType,
        yearA,
        yearB,
        startMonth,
        endMonth,
        skpdList: skpdList.length,
        totalData: sortedData.length
      }}
    />
  )}
</div>

            <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/30 dark:border-white/5 p-8 rounded-[3rem] shadow-2xl space-y-8">
                {/* SKPD Search/Filter */}
                <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors">
                        <Filter size={20} />
                    </div>
                    <select value={selectedSkpd} onChange={e => setSelectedSkpd(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] text-sm font-black shadow-lg shadow-black/5 outline-none focus:ring-4 focus:ring-purple-500/20 transition-all cursor-pointer">
                        <option>Semua SKPD</option>
                        {skpdList.map(skpd => <option key={skpd} value={skpd}>{skpd}</option>)}
                    </select>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader className="animate-spin text-purple-500" size={48} />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Mengkalkulasi...</p>
                    </div>
                ) : error ? (
                    <div className="p-8 bg-rose-50 dark:bg-rose-950/20 border-l-[6px] border-rose-500 rounded-[2rem] flex items-center gap-6 text-rose-600 shadow-xl shadow-rose-500/5">
                        <div className="p-3 bg-rose-500 rounded-2xl text-white shadow-lg shadow-rose-500/30">
                            <Info size={28} />
                        </div>
                        <p className="font-black text-lg tracking-tight">{error}</p>
                    </div>
                ) : (
                    <>
                        {/* Head-to-Head Radar */}
                        {selectedSkpd !== 'Semua SKPD' && radarData.length > 0 && (
                            <div className="p-8 bg-purple-500/5 rounded-[2.5rem] border border-purple-500/20 animate-in slide-in-from-bottom-5 duration-700">
                                <h3 className="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center justify-center gap-3 italic">
                                    <Target size={24} className="text-purple-500" /> Head-to-Head Analysis: {selectedSkpd}
                                </h3>
                                <div className="h-[400px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                            <PolarGrid strokeOpacity={0.1} />
                                            <PolarAngleAxis dataKey="subject" tick={{fontSize: 10, fontWeight: 900}} />
                                            <Radar name={String(yearA)} dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.5} />
                                            <Radar name={String(yearB)} dataKey="B" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.3} />
                                            <Tooltip contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'}} />
                                            <Legend />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        {/* View Content */}
                        {viewMode === 'chart' ? (
                            <CombinationChart data={sortedData} yearA={yearA} yearB={yearB} analysisType={analysisType} />
                        ) : (
                            <div className="overflow-x-auto rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl bg-white/20 dark:bg-slate-800/20">
                                <table className="min-w-full border-separate border-spacing-0">
                                    <thead>
                                        <tr className="bg-slate-100/50 dark:bg-slate-800/50">
                                            {(analysisType === 'Belanja' ? [
                                                { key: 'skpd', label: 'Unit Kerja' },
                                                { key: 'paguB', label: `Pagu ${yearB}` },
                                                { key: 'paguA', label: `Pagu ${yearA}` },
                                                { key: 'realisasiB', label: `Real. ${yearB}` },
                                                { key: 'realisasiA', label: `Real. ${yearA}` },
                                                { key: 'kinerjaB', label: `${yearB} (%)` },
                                                { key: 'kinerjaA', label: `${yearA} (%)` },
                                                { key: 'growth', label: 'Delta (pp)' },
                                            ] : [
                                                { key: 'skpd', label: 'Unit Penghasil' },
                                                { key: 'targetB', label: `Tgt ${yearB}` },
                                                { key: 'targetA', label: `Tgt ${yearA}` },
                                                { key: 'realisasiB', label: `Real. ${yearB}` },
                                                { key: 'realisasiA', label: `Real. ${yearA}` },
                                                { key: 'kinerjaB', label: `${yearB} (%)` },
                                                { key: 'kinerjaA', label: `${yearA} (%)` },
                                                { key: 'growth', label: 'Delta (pp)' },
                                            ]).map((header) => (
                                                <th key={header.key} onClick={() => header.key !== 'growth' && requestSort(header.key)} className="px-6 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer hover:bg-slate-200/50 transition-colors">
                                                    <div className="flex items-center whitespace-nowrap">
                                                        {header.label} {header.key !== 'growth' && renderSortIcon(header.key)}
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {sortedData.map((item, idx) => {
                                            const growth = item.kinerjaA - item.kinerjaB;
                                            return (
                                                <tr key={idx} className="hover:bg-purple-500/5 transition-colors group">
                                                    <td className="px-6 py-4 text-xs font-black text-slate-700 dark:text-slate-200 max-w-xs">{item.skpd}</td>
                                                    <td className="px-6 py-4 text-[11px] font-bold text-slate-500 text-right">{formatIDR(analysisType === 'Belanja' ? item.paguB : item.targetB)}</td>
                                                    <td className="px-6 py-4 text-[11px] font-black text-indigo-600 text-right">{formatIDR(analysisType === 'Belanja' ? item.paguA : item.targetA)}</td>
                                                    <td className="px-6 py-4 text-[11px] font-bold text-slate-500 text-right">{formatIDR(item.realisasiB)}</td>
                                                    <td className="px-6 py-4 text-[11px] font-black text-emerald-600 text-right">{formatIDR(item.realisasiA)}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="text-[11px] font-bold opacity-40">{item.kinerjaB.toFixed(1)}%</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className={`px-2 py-1 rounded-lg text-[11px] font-black inline-block ${item.kinerjaA > 85 ? 'bg-emerald-100 text-emerald-700' : item.kinerjaA < 50 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                                                            {item.kinerjaA.toFixed(1)}%
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className={`text-[11px] font-black ${growth >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                            {growth >= 0 ? '+' : ''}{growth.toFixed(2)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                {sortedData.length === 0 && <div className="py-20 text-center text-xs font-black uppercase text-slate-400 tracking-widest italic">Data tidak ditemukan</div>}
                            </div>
                        )}
                    </>
                )}
            </div>
            
            {/* Footer Legend */}
            <div className="flex flex-wrap items-center justify-center gap-8 py-8 border-t border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> Optimal (≥85%)</div>
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div> Progres (50-85%)</div>
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div> Perlu Atensi (≤50%)</div>
                <div className="flex items-center gap-2 ml-4"><div className="w-4 h-0.5 border-t-2 border-dashed border-slate-400"></div> Benchmark {yearB}</div>
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-purple-600"></div> Tahun Fokus {yearA}</div>
            </div>
        </div>
    );
};

export default AnalisisKinerjaView;
