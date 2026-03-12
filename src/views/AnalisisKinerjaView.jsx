import React from 'react';
import { 
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
    Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
    Loader, ChevronsUpDown, ChevronDown, TrendingUp, 
    AlertCircle, CheckCircle, Info, Scale, Activity,
    Bot, Sparkles, Eye, EyeOff, BarChart3, LineChart,
    ArrowUpRight, ArrowDownRight, Calendar, Building2,
    Users, Target, Zap, Clock, Award, Crown, Briefcase,
    Lightbulb, Gauge, Brain, Coins, Rocket, Star, Medal, Trophy,
    Shield, AlertOctagon, Layers, Database, PieChart, FileText,
    Hash, CreditCard, Globe, BookOpen, FolderTree, ListTree,
    GitBranch, Map, Compass, Flag, Sparkle, TrendingUpDown,
    Percent, BadgePercent, Wallet, Receipt, Landmark, PiggyBank,
    Layers as LayersIcon, GitCompare, Sigma, Divide, Minus, Plus,
    Gem, Diamond, Flower2
} from 'lucide-react';

import SectionTitle from '../components/SectionTitle';
import GeminiAnalysis from '../components/GeminiAnalysis';
import { db, auth } from '../utils/firebase';
import { collection, onSnapshot, query, getDocs } from 'firebase/firestore';
import { formatCurrency } from '../utils/formatCurrency';

// --- Analisis Kinerja View ---
const AnalisisKinerjaView = ({ theme, user, selectedYear, namaPemda }) => {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    const [yearA, setYearA] = React.useState(selectedYear);
    const [yearB, setYearB] = React.useState(selectedYear - 1);
    const [startMonth, setStartMonth] = React.useState(months[0]);
    const [endMonth, setEndMonth] = React.useState(months[months.length - 1]);
    const [analysisType, setAnalysisType] = React.useState('Belanja'); // 'Belanja' atau 'Pendapatan'
    const [dataA, setDataA] = React.useState(null);
    const [dataB, setDataB] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [sortConfig, setSortConfig] = React.useState({ key: 'kinerjaA', direction: 'descending' });
    const [selectedSkpd, setSelectedSkpd] = React.useState('Semua SKPD');
    
    // ===== STATE UNTUK TOGGLE ANALISIS AI DAN INFO EKSEKUTIF =====
    const [showAnalysis, setShowAnalysis] = React.useState(true);
    const [showExecutiveInfo, setShowExecutiveInfo] = React.useState(true);
    // ===== END STATE =====

    // 1. Memperbarui fungsi untuk mengambil data realisasiNonRkud
    const fetchDataForYear = async (year) => {
        if (!user) return null;
        const dataTypes = ['anggaran', 'pendapatan', 'realisasi', 'realisasiPendapatan', 'realisasiNonRkud'];
        const yearData = {};
        for (const dataType of dataTypes) {
            const collRef = collection(db, "publicData", String(year), dataType);
            const snapshot = await getDocs(query(collRef));
            let data = [];
            snapshot.forEach(doc => { data = [...data, ...doc.data().data]; });
            // Menambahkan realisasiNonRkud ke dalam logika data bulanan
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
                setError("Silakan pilih dua tahun yang berbeda untuk perbandingan.");
                setDataA(null); setDataB(null);
                return;
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

    const { performanceData, skpdList, radarData, summaryStats } = React.useMemo(() => {
        if (!dataA || !dataB) return { performanceData: [], skpdList: [], radarData: [], summaryStats: {} };

            let skpdMap = {};
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
        if (!skpdMap[skpdName]) {
            skpdMap[skpdName] = { skpd: skpdName };
        }
        const skpd = skpdMap[skpdName];
        if (analysisType === 'Belanja') {
            skpd[`pagu${year}`] = (skpd[`pagu${year}`] || 0) + (item.nilai || 0);
        } else {
            skpd[`target${year}`] = (skpd[`target${year}`] || 0) + (item.nilai || 0);
        }
    });

    realisasiData.forEach(item => {
        const skpdName = item.NamaSKPD || item.SKPD || item.NAMASKPD || 'Tanpa SKPD/OPD';
        if (!skpdMap[skpdName]) {
            skpdMap[skpdName] = { skpd: skpdName };
        }
        const skpd = skpdMap[skpdName];
        skpd[`realisasi${year}`] = (skpd[`realisasi${year}`] || 0) + (item.nilai || 0);
    });
};

        processData(dataA, 'A', analysisType);
        processData(dataB, 'B', analysisType);
        
        const skpdList = Object.keys(skpdMap).sort();

        const performanceData = Object.values(skpdMap).map(skpd => {
            if (analysisType === 'Belanja') {
                const paguA = skpd.paguA || 0;
                const realisasiA = skpd.realisasiA || 0;
                const paguB = skpd.paguB || 0;
                const realisasiB = skpd.realisasiB || 0;
                return {
                    ...skpd, paguA, realisasiA, paguB, realisasiB,
                    kinerjaA: paguA > 0 ? (realisasiA / paguA) * 100 : 0,
                    kinerjaB: paguB > 0 ? (realisasiB / paguB) * 100 : 0,
                    selisihKinerja: (paguA > 0 ? (realisasiA / paguA) * 100 : 0) - (paguB > 0 ? (realisasiB / paguB) * 100 : 0),
                    kategori: (paguA > 0 ? (realisasiA / paguA) * 100 : 0) >= 85 ? 'Tinggi' : 
                              (paguA > 0 ? (realisasiA / paguA) * 100 : 0) >= 50 ? 'Sedang' : 'Rendah'
                };
            } else { // Pendapatan
                const targetA = skpd.targetA || 0;
                const realisasiA = skpd.realisasiA || 0;
                const targetB = skpd.targetB || 0;
                const realisasiB = skpd.realisasiB || 0;
                return {
                    ...skpd, targetA, realisasiA, targetB, realisasiB,
                    kinerjaA: targetA > 0 ? (realisasiA / targetA) * 100 : 0,
                    kinerjaB: targetB > 0 ? (realisasiB / targetB) * 100 : 0,
                    selisihKinerja: (targetA > 0 ? (realisasiA / targetA) * 100 : 0) - (targetB > 0 ? (realisasiB / targetB) * 100 : 0),
                    kategori: (targetA > 0 ? (realisasiA / targetA) * 100 : 0) >= 85 ? 'Tinggi' : 
                              (targetA > 0 ? (realisasiA / targetA) * 100 : 0) >= 50 ? 'Sedang' : 'Rendah'
                };
            }
        });
        
        // Hitung statistik ringkasan
        const skpdWithKinerja = performanceData.filter(s => s.kinerjaA > 0 || s.kinerjaB > 0);
        const avgKinerjaA = skpdWithKinerja.reduce((sum, s) => sum + s.kinerjaA, 0) / (skpdWithKinerja.length || 1);
        const avgKinerjaB = skpdWithKinerja.reduce((sum, s) => sum + s.kinerjaB, 0) / (skpdWithKinerja.length || 1);
        const totalPaguA = performanceData.reduce((sum, s) => sum + (s.paguA || 0), 0);
        const totalPaguB = performanceData.reduce((sum, s) => sum + (s.paguB || 0), 0);
        const totalRealisasiA = performanceData.reduce((sum, s) => sum + (s.realisasiA || 0), 0);
        const totalRealisasiB = performanceData.reduce((sum, s) => sum + (s.realisasiB || 0), 0);
        
        // Kategori kinerja
        const kinerjaTinggi = performanceData.filter(s => s.kinerjaA >= 85).length;
        const kinerjaSedang = performanceData.filter(s => s.kinerjaA >= 50 && s.kinerjaA < 85).length;
        const kinerjaRendah = performanceData.filter(s => s.kinerjaA < 50).length;
        const kinerjaKritis = performanceData.filter(s => s.kinerjaA < 30).length;
        
        // Peningkatan tertinggi dan penurunan tertinggi
        const peningkatanTertinggi = [...performanceData].sort((a, b) => b.selisihKinerja - a.selisihKinerja).slice(0, 3);
        const penurunanTertinggi = [...performanceData].sort((a, b) => a.selisihKinerja - b.selisihKinerja).slice(0, 3);
        
        const summaryStats = {
            totalSKPD: performanceData.length,
            avgKinerjaA,
            avgKinerjaB,
            kinerjaChange: avgKinerjaA - avgKinerjaB,
            totalPaguA,
            totalPaguB,
            totalRealisasiA,
            totalRealisasiB,
            skpdMeningkat: performanceData.filter(s => s.kinerjaA > s.kinerjaB).length,
            skpdMenurun: performanceData.filter(s => s.kinerjaA < s.kinerjaB).length,
            skpdStabil: performanceData.filter(s => Math.abs(s.kinerjaA - s.kinerjaB) < 5).length,
            skpdTerbaik: performanceData.sort((a, b) => b.kinerjaA - a.kinerjaA)[0],
            skpdTerburuk: performanceData.sort((a, b) => a.kinerjaA - b.kinerjaA)[0],
            kinerjaTinggi,
            kinerjaSedang,
            kinerjaRendah,
            kinerjaKritis,
            peningkatanTertinggi,
            penurunanTertinggi
        };

        let radarData = [];
        if (selectedSkpd !== 'Semua SKPD') {
            const skpdData = performanceData.find(d => d.skpd === selectedSkpd);
            if (skpdData) {
                const targetLabel = analysisType === 'Belanja' ? 'Pagu' : 'Target';
                radarData = [
                    { subject: targetLabel, A: skpdData[analysisType === 'Belanja' ? 'paguA' : 'targetA'], B: skpdData[analysisType === 'Belanja' ? 'paguB' : 'targetB'], fullMark: Math.max(skpdData[analysisType === 'Belanja' ? 'paguA' : 'targetA'], skpdData[analysisType === 'Belanja' ? 'paguB' : 'targetB']) * 1.1 },
                    { subject: 'Realisasi', A: skpdData.realisasiA, B: skpdData.realisasiB, fullMark: Math.max(skpdData.realisasiA, skpdData.realisasiB) * 1.1 },
                    { subject: 'Kinerja (%)', A: skpdData.kinerjaA, B: skpdData.kinerjaB, fullMark: 100 },
                ];
            }
        }

        return { performanceData, skpdList, radarData, summaryStats };

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
    
    const getAnalysisPrompt = (query, allData) => {
        if (query && query.trim() !== '') {
            return `Berdasarkan data kinerja ${analysisType} tahun ${yearA} vs ${yearB} untuk periode ${startMonth}-${endMonth}, jawab pertanyaan ini: ${query}`;
        }
        
        if (sortedData.length === 0) return "Data tidak cukup untuk analisis.";
        
        const top5 = sortedData.slice(0, 5);
        const bottom5 = sortedData.slice(-5).reverse();
        const period = startMonth === endMonth ? startMonth : `periode ${startMonth} - ${endMonth}`;

        const formatItem = (item) => analysisType === 'Belanja'
            ? `- **${item.skpd}**: Kinerja ${yearA}: ${item.kinerjaA.toFixed(2)}%, Kinerja ${yearB}: ${item.kinerjaB.toFixed(2)}% (Δ ${item.selisihKinerja > 0 ? '+' : ''}${item.selisihKinerja.toFixed(2)} pp)`
            : `- **${item.skpd}**: Kinerja ${yearA}: ${item.kinerjaA.toFixed(2)}%, Kinerja ${yearB}: ${item.kinerjaB.toFixed(2)}% (Δ ${item.selisihKinerja > 0 ? '+' : ''}${item.selisihKinerja.toFixed(2)} pp)`;

        const formatPeningkatan = (item) => `- **${item.skpd}**: ${item.selisihKinerja > 0 ? '+' : ''}${item.selisihKinerja.toFixed(2)} pp (${item.kinerjaA.toFixed(2)}% vs ${item.kinerjaB.toFixed(2)}%)`;

        return `ANALISIS KINERJA SKPD/OPD
INSTANSI: ${namaPemda || 'Pemerintah Daerah'}
JENIS ANALISIS: ${analysisType}
PERIODE: ${yearA} vs ${yearB} (${period})

RINGKASAN EKSEKUTIF:
- Total SKPD Dianalisis: ${summaryStats.totalSKPD}
- Rata-rata Kinerja ${yearA}: ${summaryStats.avgKinerjaA.toFixed(2)}%
- Rata-rata Kinerja ${yearB}: ${summaryStats.avgKinerjaB.toFixed(2)}%
- Perubahan Rata-rata: ${(summaryStats.kinerjaChange > 0 ? '+' : '')}${summaryStats.kinerjaChange.toFixed(2)} poin persentase
- SKPD dengan Peningkatan Kinerja: ${summaryStats.skpdMeningkat} SKPD
- SKPD dengan Penurunan Kinerja: ${summaryStats.skpdMenurun} SKPD
- SKPD dengan Kinerja Stabil: ${summaryStats.skpdStabil} SKPD

DISTRIBUSI KINERJA (${yearA}):
- Kinerja Tinggi (≥85%): ${summaryStats.kinerjaTinggi} SKPD
- Kinerja Sedang (50-84%): ${summaryStats.kinerjaSedang} SKPD
- Kinerja Rendah (<50%): ${summaryStats.kinerjaRendah} SKPD
- Kinerja Kritis (<30%): ${summaryStats.kinerjaKritis} SKPD

${summaryStats.skpdTerbaik ? `SKPD DENGAN KINERJA TERTINGGI ${yearA}: **${summaryStats.skpdTerbaik.skpd}** (${summaryStats.skpdTerbaik.kinerjaA.toFixed(2)}%)` : ''}
${summaryStats.skpdTerburuk ? `SKPD DENGAN KINERJA TERENDAH ${yearA}: **${summaryStats.skpdTerburuk.skpd}** (${summaryStats.skpdTerburuk.kinerjaA.toFixed(2)}%)` : ''}

${selectedSkpd !== 'Semua SKPD' ? `FOKUS ANALISIS: **${selectedSkpd}**` : ''}

PENINGKATAN KINERJA TERTINGGI (${yearA} vs ${yearB}):
${summaryStats.peningkatanTertinggi.map(formatPeningkatan).join('\n')}

PENURUNAN KINERJA TERTINGGI (${yearA} vs ${yearB}):
${summaryStats.penurunanTertinggi.map(formatPeningkatan).join('\n')}

5 SKPD DENGAN KINERJA TERTINGGI (${yearA}):
${top5.map(formatItem).join('\n')}

5 SKPD DENGAN KINERJA TERENDAH (${yearA}):
${bottom5.map(formatItem).join('\n')}

BERIKAN ANALISIS MENDALAM MENGENAI:
1. Evaluasi Makro: Bagaimana tren kinerja ${analysisType} secara keseluruhan? Apakah terjadi peningkatan atau penurunan signifikan?
2. Identifikasi Anomali: SKPD mana yang menunjukkan perubahan kinerja paling drastis (peningkatan/penurunan > 20 pp)? Apa implikasinya?
3. Analisis Distribusi: Bagaimana sebaran kinerja SKPD? Apakah banyak SKPD dalam kategori rendah/kritis?
4. Rekomendasi Strategis: 3 langkah konkret untuk meningkatkan kinerja SKPD berkinerja rendah dan mempertahankan/meningkatkan kinerja SKPD unggulan.
5. Catatan untuk Rapat Pimpinan: 3 poin penting yang perlu disampaikan dalam evaluasi triwulan/semester.

Gunakan bahasa profesional, langsung ke inti, tanpa basa-basi.`;
    };
    
    const renderSortIcon = (key) => {
        if (sortConfig.key !== key) return <ChevronsUpDown size={14} className="ml-1 text-gray-400" />;
        return sortConfig.direction === 'ascending' ? <ChevronDown size={14} className="ml-1" /> : <ChevronDown size={14} className="ml-1 transform rotate-180" />;
    };

    const renderGrowth = (valA, valB) => {
        const change = valA - valB;
        if (valA === 0 && valB === 0) return <span className="text-gray-500">-</span>;
        const color = change >= 0 ? 'text-green-500' : 'text-red-500';
        return <span className={`font-black ${color}`}>{change > 0 ? '+' : ''}{change.toFixed(2)} pp</span>;
    };
    
    const renderKategori = (kategori) => {
        if (kategori === 'Tinggi') return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Tinggi</span>;
        if (kategori === 'Sedang') return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">Sedang</span>;
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">Rendah</span>;
    };
    
    const tableHeaders = analysisType === 'Belanja'
        ? [
            { key: 'skpd', label: 'Nama SKPD' },
            { key: 'paguB', label: `Pagu ${yearB}` },
            { key: 'paguA', label: `Pagu ${yearA}` },
            { key: 'realisasiB', label: `Realisasi ${yearB}` },
            { key: 'realisasiA', label: `Realisasi ${yearA}` },
            { key: 'kinerjaB', label: `Penyerapan ${yearB}` },
            { key: 'kinerjaA', label: `Penyerapan ${yearA}` },
            { key: 'growth', label: 'Perubahan' },
            { key: 'kategori', label: 'Kategori' },
          ]
        : [
            { key: 'skpd', label: 'Nama SKPD/OPD' },
            { key: 'targetB', label: `Target ${yearB}` },
            { key: 'targetA', label: `Target ${yearA}` },
            { key: 'realisasiB', label: `Realisasi ${yearB}` },
            { key: 'realisasiA', label: `Realisasi ${yearA}` },
            { key: 'kinerjaB', label: `Capaian ${yearB}` },
            { key: 'kinerjaA', label: `Capaian ${yearA}` },
            { key: 'growth', label: 'Perubahan' },
            { key: 'kategori', label: 'Kategori' },
          ];

    return (
        <div className="space-y-8 max-w-full p-4 md:p-6 animate-in fade-in duration-1000 pb-20 bg-slate-50/30 dark:bg-transparent">
            <SectionTitle>Analisis Kinerja SKPD</SectionTitle>
            
            {/* EXECUTIVE INFO PANEL - PREMIUM GLASS - DIPERBESAR */}
            {showExecutiveInfo && summaryStats && summaryStats.totalSKPD > 0 && (
                <div className="relative overflow-hidden rounded-[3.5rem] bg-gradient-to-br from-indigo-950 via-slate-900 to-black p-12 text-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white/5 group mb-12">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[150px] -mr-96 -mt-96 transition-all duration-1000 group-hover:bg-indigo-500/20"></div>
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] -ml-80 -mb-80"></div>
                    <div className="absolute top-20 left-40 w-40 h-40 bg-yellow-500/5 rounded-full blur-[60px]"></div>
                    
                    {/* Animated Particles */}
                    <div className="absolute inset-0 overflow-hidden">
                        {[...Array(15)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute rounded-full bg-white/5 animate-float"
                                style={{
                                    width: `${Math.random() * 6 + 3}px`,
                                    height: `${Math.random() * 6 + 3}px`,
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 10}s`,
                                    animationDuration: `${Math.random() * 20 + 10}s`
                                }}
                            />
                        ))}
                    </div>
                    
                    {/* Crown Icon for Leadership */}
                    <div className="absolute top-8 right-12 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Trophy size={140} className="text-yellow-400" />
                    </div>
                    
                    <div className="relative z-10">
                        {/* Header */}
                        <div className="flex flex-col lg:flex-row lg:items-center gap-8 mb-12 border-b border-white/10 pb-10">
                            <div className="p-8 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 rounded-[2rem] shadow-[0_20px_50px_-10px_rgba(99,102,241,0.6)] transform -rotate-3 transition-all duration-700 group-hover:rotate-0">
                                <Activity size={64} className="text-white" />
                            </div>
                            <div className="flex-1">
                                <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-2xl rounded-full text-sm font-black tracking-[0.3em] uppercase border border-white/20 mb-4 animate-pulse">
                                    <Sparkles size={18} className="text-yellow-400" /> EXECUTIVE PERFORMANCE DASHBOARD
                                </div>
                                <h2 className="text-5xl lg:text-7xl font-black tracking-tighter leading-[0.9] mb-4">
                                    EVALUASI KINERJA SKPD <br/>
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 text-5xl lg:text-7xl">
                                        {yearA} vs {yearB}
                                    </span>
                                </h2>
                                <p className="text-slate-400 font-medium max-w-3xl text-xl leading-relaxed">
                                    Analisis komparatif kinerja {analysisType === 'Belanja' ? 'penyerapan anggaran' : 'pencapaian pendapatan'} 
                                    antar SKPD untuk mengidentifikasi area unggulan dan tantangan strategis.
                                </p>
                            </div>
                            <button 
                                onClick={() => setShowExecutiveInfo(false)}
                                className="self-start lg:self-center p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all hover:scale-110 active:scale-90"
                                title="Sembunyikan"
                            >
                                <EyeOff size={28} className="text-slate-400" />
                            </button>
                        </div>

                        {/* Quick Stats - DIPERBESAR */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all">
                                <div className="flex items-center gap-3 mb-2">
                                    <Building2 size={24} className="text-indigo-400" />
                                    <p className="text-xs font-bold uppercase text-indigo-200 tracking-wider">Total SKPD</p>
                                </div>
                                <p className="text-3xl md:text-4xl font-black text-white">{summaryStats.totalSKPD}</p>
                                <p className="text-xs text-indigo-200/70 mt-1">Teranalisis</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all">
                                <div className="flex items-center gap-3 mb-2">
                                    <TrendingUp size={24} className="text-emerald-400" />
                                    <p className="text-xs font-bold uppercase text-indigo-200 tracking-wider">Rata-rata {yearA}</p>
                                </div>
                                <p className="text-3xl md:text-4xl font-black text-emerald-300">{summaryStats.avgKinerjaA.toFixed(2)}%</p>
                                <p className="text-xs text-indigo-200/70 mt-1">
                                    <span className={summaryStats.kinerjaChange >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
                                        {summaryStats.kinerjaChange >= 0 ? '↑' : '↓'} {Math.abs(summaryStats.kinerjaChange).toFixed(2)} pp
                                    </span> vs {yearB}
                                </p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all">
                                <div className="flex items-center gap-3 mb-2">
                                    <Users size={24} className="text-purple-400" />
                                    <p className="text-xs font-bold uppercase text-indigo-200 tracking-wider">Distribusi</p>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden flex">
                                        <div className="h-full bg-emerald-500" style={{ width: `${(summaryStats.kinerjaTinggi / summaryStats.totalSKPD) * 100}%` }}></div>
                                        <div className="h-full bg-yellow-500" style={{ width: `${(summaryStats.kinerjaSedang / summaryStats.totalSKPD) * 100}%` }}></div>
                                        <div className="h-full bg-orange-500" style={{ width: `${((summaryStats.kinerjaRendah - summaryStats.kinerjaKritis) / summaryStats.totalSKPD) * 100}%` }}></div>
                                        <div className="h-full bg-red-500" style={{ width: `${(summaryStats.kinerjaKritis / summaryStats.totalSKPD) * 100}%` }}></div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                                    <div><span className="text-emerald-300 font-black">{summaryStats.kinerjaTinggi}</span> <span className="text-indigo-200">Tinggi</span></div>
                                    <div><span className="text-yellow-300 font-black">{summaryStats.kinerjaSedang}</span> <span className="text-indigo-200">Sedang</span></div>
                                    <div><span className="text-orange-300 font-black">{summaryStats.kinerjaRendah - summaryStats.kinerjaKritis}</span> <span className="text-indigo-200">Rendah</span></div>
                                    <div><span className="text-red-300 font-black">{summaryStats.kinerjaKritis}</span> <span className="text-indigo-200">Kritis</span></div>
                                </div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all">
                                <div className="flex items-center gap-3 mb-2">
                                    <TrendingUp size={24} className="text-amber-400" />
                                    <p className="text-xs font-bold uppercase text-indigo-200 tracking-wider">Perubahan</p>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-2xl font-black text-emerald-300">{summaryStats.skpdMeningkat}</p>
                                        <p className="text-xs text-indigo-200">Meningkat</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-rose-300">{summaryStats.skpdMenurun}</p>
                                        <p className="text-xs text-indigo-200">Menurun</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-blue-300">{summaryStats.skpdStabil}</p>
                                        <p className="text-xs text-indigo-200">Stabil</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Top Performers & Bottom Performers - DIPERBESAR */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            {/* Top Performers */}
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-xl">
                                        <Award size={24} className="text-white" />
                                    </div>
                                    <h3 className="text-xl font-black text-white">Kinerja Tertinggi {yearA}</h3>
                                </div>
                                <div className="space-y-3">
                                    {performanceData.sort((a, b) => b.kinerjaA - a.kinerjaA).slice(0, 3).map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <span className="w-7 h-7 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-sm font-black flex items-center justify-center">
                                                    {idx+1}
                                                </span>
                                                <span className="text-white font-medium truncate max-w-[200px]" title={item.skpd}>
                                                    {item.skpd}
                                                </span>
                                            </div>
                                            <span className="font-black text-emerald-300 text-lg">{item.kinerjaA.toFixed(2)}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Bottom Performers */}
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 bg-gradient-to-r from-rose-500 to-red-500 rounded-xl">
                                        <AlertCircle size={24} className="text-white" />
                                    </div>
                                    <h3 className="text-xl font-black text-white">Perlu Perhatian {yearA}</h3>
                                </div>
                                <div className="space-y-3">
                                    {performanceData.sort((a, b) => a.kinerjaA - b.kinerjaA).slice(0, 3).map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <span className="w-7 h-7 rounded-full bg-gradient-to-r from-rose-500 to-red-500 text-white text-sm font-black flex items-center justify-center">
                                                    {idx+1}
                                                </span>
                                                <span className="text-white font-medium truncate max-w-[200px]" title={item.skpd}>
                                                    {item.skpd}
                                                </span>
                                            </div>
                                            <span className="font-black text-rose-300 text-lg">{item.kinerjaA.toFixed(2)}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Biggest Improvers & Decliners */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            {/* Biggest Improvers */}
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl">
                                        <ArrowUpRight size={24} className="text-white" />
                                    </div>
                                    <h3 className="text-xl font-black text-white">Peningkatan Tertinggi</h3>
                                </div>
                                <div className="space-y-3">
                                    {summaryStats.peningkatanTertinggi.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <span className="w-7 h-7 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 text-white text-sm font-black flex items-center justify-center">
                                                    {idx+1}
                                                </span>
                                                <span className="text-white font-medium truncate max-w-[180px]" title={item.skpd}>
                                                    {item.skpd}
                                                </span>
                                            </div>
                                            <span className="font-black text-emerald-300 text-lg">+{item.selisihKinerja.toFixed(2)} pp</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Biggest Decliners */}
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 bg-gradient-to-r from-rose-500 to-red-500 rounded-xl">
                                        <ArrowDownRight size={24} className="text-white" />
                                    </div>
                                    <h3 className="text-xl font-black text-white">Penurunan Tertinggi</h3>
                                </div>
                                <div className="space-y-3">
                                    {summaryStats.penurunanTertinggi.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <span className="w-7 h-7 rounded-full bg-gradient-to-r from-rose-500 to-red-500 text-white text-sm font-black flex items-center justify-center">
                                                    {idx+1}
                                                </span>
                                                <span className="text-white font-medium truncate max-w-[180px]" title={item.skpd}>
                                                    {item.skpd}
                                                </span>
                                            </div>
                                            <span className="font-black text-rose-300 text-lg">{item.selisihKinerja.toFixed(2)} pp</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Executive Summary Note - DIPERBESAR */}
                        <div className="flex items-start gap-5 text-base bg-gradient-to-r from-indigo-800/50 to-purple-800/50 p-6 rounded-2xl border border-indigo-500/30 backdrop-blur-sm">
                            <div className="p-4 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl shadow-lg shrink-0">
                                <Lightbulb size={32} className="text-white" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-xl font-black text-white flex items-center gap-2">
                                    <Sparkles size={20} className="text-yellow-300" />
                                    EXECUTIVE SUMMARY
                                </p>
                                <p className="text-base leading-relaxed text-indigo-100">
                                    <span className="font-bold text-white">RINGKASAN EKSEKUTIF:</span> Dari {summaryStats.totalSKPD} SKPD yang dianalisis, 
                                    <span className="font-black text-emerald-300 text-lg mx-1">{summaryStats.skpdMeningkat}</span> SKPD mengalami peningkatan kinerja, 
                                    <span className="font-black text-rose-300 text-lg mx-1">{summaryStats.skpdMenurun}</span> SKPD menurun, dan 
                                    <span className="font-black text-blue-300 text-lg mx-1">{summaryStats.skpdStabil}</span> SKPD stabil. 
                                    Rata-rata kinerja {analysisType === 'Belanja' ? 'penyerapan' : 'pencapaian'} 
                                    <span className="font-black text-white text-lg mx-1">{summaryStats.avgKinerjaA.toFixed(2)}%</span> pada {yearA}, 
                                    {summaryStats.kinerjaChange >= 0 ? ' meningkat ' : ' menurun '} 
                                    <span className={`font-black ${summaryStats.kinerjaChange >= 0 ? 'text-emerald-300' : 'text-rose-300'} text-lg`}>
                                        {Math.abs(summaryStats.kinerjaChange).toFixed(2)} pp
                                    </span> dari {yearB}.
                                </p>
                                <p className="text-sm text-indigo-200/80 mt-2 italic">
                                    * Terdapat {summaryStats.kinerjaKritis} SKPD dalam kategori kritis (&lt;30%) yang memerlukan intervensi segera.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!showExecutiveInfo && (
                <button 
                    onClick={() => setShowExecutiveInfo(true)}
                    className="mb-10 px-10 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-[2rem] font-black text-base flex items-center gap-4 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] hover:shadow-[0_25px_50px_-10px_rgba(0,0,0,0.4)] transition-all active:scale-95 group"
                >
                    <div className="p-2 bg-indigo-500 rounded-xl group-hover:scale-110 transition-transform">
                        <Eye size={22} />
                    </div>
                    TAMPILKAN EXECUTIVE DASHBOARD
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
                {showAnalysis && sortedData && sortedData.length > 0 && (
                    <div className="text-xs text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-2 bg-white/30 dark:bg-gray-800/30 p-2 rounded-lg">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        <span>{analysisType} | {yearA} vs {yearB} | {sortedData.length} SKPD | Periode: {startMonth}-{endMonth}</span>
                    </div>
                )}
                
                {/* Komponen GeminiAnalysis dengan Conditional Rendering */}
                {showAnalysis && (
                    <GeminiAnalysis 
                        getAnalysisPrompt={getAnalysisPrompt} 
                        disabledCondition={sortedData.length === 0} 
                        userCanUseAi={true}
                        allData={{
                            yearA,
                            yearB,
                            startMonth,
                            endMonth,
                            analysisType,
                            namaPemda,
                            summaryStats,
                            sortedData
                        }}
                    />
                )}
            </div>

            {/* Filter Panel */}
            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/40 dark:border-gray-800/50 shadow-xl transition-all duration-700">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div className="space-y-2 group">
                        <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                            <Calendar size={16} className="text-indigo-500 transition-transform group-hover:scale-110" /> Tahun A
                        </label>
                        <select value={yearA} onChange={e => setYearA(parseInt(e.target.value))} className="w-full px-5 py-4 bg-white/60 dark:bg-gray-950/60 backdrop-blur-xl border border-gray-100 dark:border-gray-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-bold text-base">
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2 group">
                        <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                            <Calendar size={16} className="text-purple-500 transition-transform group-hover:scale-110" /> Tahun B
                        </label>
                        <select value={yearB} onChange={e => setYearB(parseInt(e.target.value))} className="w-full px-5 py-4 bg-white/60 dark:bg-gray-950/60 backdrop-blur-xl border border-gray-100 dark:border-gray-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-bold text-base">
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2 group">
                        <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                            <BarChart3 size={16} className="text-emerald-500 transition-transform group-hover:scale-110" /> Jenis Analisis
                        </label>
                        <select value={analysisType} onChange={e => setAnalysisType(e.target.value)} className="w-full px-5 py-4 bg-white/60 dark:bg-gray-950/60 backdrop-blur-xl border border-gray-100 dark:border-gray-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-bold text-base">
                            <option value="Belanja">Belanja (Penyerapan)</option>
                            <option value="Pendapatan">Pendapatan (Pencapaian)</option>
                        </select>
                    </div>
                    <div className="space-y-2 group">
                        <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                            <Building2 size={16} className="text-amber-500 transition-transform group-hover:scale-110" /> Filter SKPD
                        </label>
                        <select value={selectedSkpd} onChange={e => setSelectedSkpd(e.target.value)} className="w-full px-5 py-4 bg-white/60 dark:bg-gray-950/60 backdrop-blur-xl border border-gray-100 dark:border-gray-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-bold text-base">
                            <option value="Semua SKPD">🏢 Semua SKPD</option>
                            {skpdList.map(skpd => <option key={skpd} value={skpd}>{skpd}</option>)}
                        </select>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 group">
                        <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                            <Calendar size={16} className="text-blue-500 transition-transform group-hover:scale-110" /> Dari Bulan
                        </label>
                        <select value={startMonth} onChange={e => setStartMonth(e.target.value)} className="w-full px-5 py-4 bg-white/60 dark:bg-gray-950/60 backdrop-blur-xl border border-gray-100 dark:border-gray-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-bold text-base">
                            {months.map(m => <option key={`start-${m}`} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2 group">
                        <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                            <Calendar size={16} className="text-purple-500 transition-transform group-hover:scale-110" /> Sampai Bulan
                        </label>
                        <select value={endMonth} onChange={e => setEndMonth(e.target.value)} className="w-full px-5 py-4 bg-white/60 dark:bg-gray-950/60 backdrop-blur-xl border border-gray-100 dark:border-gray-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-bold text-base">
                            {months.map(m => <option key={`end-${m}`} value={m}>{m}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {isLoading && (
                <div className="flex flex-col items-center justify-center py-32 gap-6">
                    <div className="relative">
                        <div className="w-20 h-20 border-[6px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin shadow-2xl shadow-indigo-500/20"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader size={24} className="text-indigo-600" />
                        </div>
                    </div>
                    <p className="text-xs font-black uppercase tracking-[0.4em] text-slate-400 animate-pulse italic">Memproses data kinerja...</p>
                </div>
            )}
            
            {error && (
                <div className="p-8 bg-rose-50 dark:bg-rose-950/20 border-l-[6px] border-rose-500 rounded-[2rem] flex items-center gap-6 text-rose-600 shadow-xl shadow-rose-500/5">
                    <div className="p-3 bg-rose-500 rounded-2xl text-white shadow-lg shadow-rose-500/30">
                        <AlertCircle size={28} />
                    </div>
                    <p className="font-black text-lg tracking-tight">{error}</p>
                </div>
            )}
            
            {!isLoading && !error && (
                <>
                    {/* Radar Chart untuk SKPD Tertentu */}
                    {selectedSkpd !== 'Semua SKPD' && radarData.length > 0 && (
                        <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/40 dark:border-gray-800/50 shadow-xl mb-8">
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3 border-l-4 border-indigo-500 pl-4">
                                Analisis Head-to-Head: {selectedSkpd}
                            </h3>
                            <div className="h-[450px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                        <PolarGrid stroke="rgba(128, 128, 128, 0.15)" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} tickFormatter={(value, index) => index === 2 ? `${value}%` : ''} />
                                        <Tooltip 
                                            formatter={(value, name, props) => {
                                                if (props.payload.subject === 'Kinerja (%)') return `${value.toFixed(2)}%`;
                                                return formatCurrency(value);
                                            }}
                                            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '1rem', border: '1px solid #f1f5f9', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Legend 
                                            verticalAlign="top" 
                                            align="right"
                                            height={60}
                                            iconType="circle"
                                            iconSize={10}
                                            wrapperStyle={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', paddingBottom: '20px' }}
                                        />
                                        <Radar name={String(yearA)} dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                                        <Radar name={String(yearB)} dataKey="B" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Tabel Kinerja - DIPERBESAR DAN DIRAPIKAN */}
                    <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/40 dark:border-gray-800/50 shadow-xl overflow-hidden">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                            <div className="flex items-center gap-5">
                                <div className="w-2.5 h-10 bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.4)]"></div>
                                <div>
                                    <h3 className="font-black text-3xl text-gray-900 dark:text-white tracking-tighter">
                                        Matriks Kinerja {analysisType}
                                    </h3>
                                    <p className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] mt-1">
                                        {sortedData.length} SKPD Terpilih | Tahun {yearA} vs {yearB}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-800">
                            <table className="min-w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-900/10 dark:bg-white/10 text-left border-b border-gray-100 dark:border-gray-800">
                                        {tableHeaders.map(header => (
                                            <th 
                                                key={header.key} 
                                                onClick={() => header.key !== 'growth' && header.key !== 'kategori' && requestSort(header.key)} 
                                                className={`px-6 py-5 text-xs font-black text-gray-600 dark:text-gray-300 uppercase tracking-[0.15em] ${
                                                    header.key !== 'growth' && header.key !== 'kategori' ? 'cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400' : ''
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {header.label}
                                                    {header.key !== 'growth' && header.key !== 'kategori' && renderSortIcon(header.key)}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {sortedData.map((item) => (
                                        <tr key={item.skpd} className="hover:bg-indigo-500/[0.02] transition-all group duration-300">
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-base font-black text-gray-900 dark:text-white leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                        {item.skpd}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <span className="text-base font-bold text-gray-900 dark:text-slate-300 tabular-nums">
                                                    {formatCurrency(analysisType === 'Belanja' ? item.paguB : item.targetB)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <span className="text-base font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                                                    {formatCurrency(analysisType === 'Belanja' ? item.paguA : item.targetA)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <span className="text-base font-bold text-gray-900 dark:text-slate-300 tabular-nums">
                                                    {formatCurrency(item.realisasiB)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                                    {formatCurrency(item.realisasiA)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <span className={`text-base font-black tabular-nums ${
                                                    item.kinerjaB > 85 ? 'text-emerald-600' : 
                                                    item.kinerjaB < 50 ? 'text-rose-600' : 
                                                    'text-gray-900 dark:text-white'
                                                }`}>
                                                    {item.kinerjaB.toFixed(2)}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <span className={`text-base font-black tabular-nums ${
                                                    item.kinerjaA > 85 ? 'text-emerald-600' : 
                                                    item.kinerjaA < 50 ? 'text-rose-600' : 
                                                    'text-indigo-600 dark:text-indigo-400'
                                                }`}>
                                                    {item.kinerjaA.toFixed(2)}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-right font-black">
                                                {renderGrowth(item.kinerjaA, item.kinerjaB)}
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                {renderKategori(item.kategori)}
                                            </td>
                                        </tr>
                                    ))}
                                    {sortedData.length === 0 && (
                                        <tr>
                                            <td colSpan={tableHeaders.length} className="text-center py-12 text-gray-500 font-bold text-base">
                                                Tidak ada data untuk ditampilkan.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
            
            <style>{`
                @keyframes progress-slow {
                    0% { width: 0%; opacity: 0.5; }
                    50% { width: 100%; opacity: 1; }
                    100% { width: 100%; opacity: 1; }
                }
                .animate-progress-slow {
                    animation: progress-slow 3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0) translateX(0); }
                    25% { transform: translateY(-10px) translateX(6px); }
                    50% { transform: translateY(-5px) translateX(-6px); }
                    75% { transform: translateY(-15px) translateX(4px); }
                }
                .animate-float {
                    animation: float linear infinite;
                }
            `}</style>
        </div>
    );
};

export default AnalisisKinerjaView;