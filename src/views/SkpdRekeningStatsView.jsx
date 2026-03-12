import React from 'react';
import SectionTitle from '../components/SectionTitle';
import GeminiAnalysis from '../components/GeminiAnalysis';
import Pagination from '../components/Pagination';
import { db, auth } from '../utils/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { 
    TrendingUp, DollarSign, Calendar, Filter, Search, Download,
    Eye, EyeOff, AlertTriangle, CheckCircle, Info, Award, Crown,
    Briefcase, Lightbulb, Activity, Zap, Target, Building2,
    Layers, BarChart3, Shield, AlertOctagon, Gauge, Brain, Coins,
    Scale, Rocket, Star, Users, Database, PieChart, ChevronUp,
    ChevronDown, FileText, Hash, CreditCard, ArrowUpRight,
    ArrowDownRight, Clock, Lock, Unlock, Globe, BookOpen,
    Sparkles, Trophy, Medal, Gem, Diamond, Flower2, Sparkle,
    TrendingUpDown, PieChart as PieChartIcon, Percent, BadgePercent,
    Wallet, Receipt, Landmark, PiggyBank, Layers3, GitCompare,
    Sigma, Divide, Minus, Plus, Equal, Infinity, CircleDot
} from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';

const SkpdRekeningStatsView = ({ data, theme, namaPemda, userCanUseAi, selectedYear }) => {
    const { anggaran, realisasi, realisasiNonRkud } = data;
    const [selectedSkpd, setSelectedSkpd] = React.useState('Semua SKPD');
    const [rekeningStats, setRekeningStats] = React.useState([]);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [sortOrder, setSortOrder] = React.useState('realisasi-desc');
    const [currentPage, setCurrentPage] = React.useState(1);
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const [startMonth, setStartMonth] = React.useState(months[0]);
    const [endMonth, setEndMonth] = React.useState(months[months.length - 1]);
    const ITEMS_PER_PAGE = 10;
    
    const [expandedRekening, setExpandedRekening] = React.useState(null);

    // ===== STATE UNTUK TOGGLE ANALISIS AI DAN INFO EKSEKUTIF =====
    const [showExecutiveInfo, setShowExecutiveInfo] = React.useState(true);
    const [showAnalysis, setShowAnalysis] = React.useState(true);
    // ===== END STATE =====

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
        for (const month in realisasi) { 
            combinedRealisasi[month] = (realisasi[month] || []).map(item => normalizeRealisasiItem(item, false)); 
        }
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
            };
        });

        setRekeningStats(stats);
    }, [selectedSkpd, anggaran, realisasi, realisasiNonRkud, startMonth, endMonth]);
    
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

    // === EXECUTIVE SUMMARY DATA - ENHANCED ===
    const executiveSummary = React.useMemo(() => {
        if (!rekeningStats.length) return null;
        
        const totalAnggaran = rekeningStats.reduce((sum, item) => sum + item.totalAnggaran, 0);
        const totalRealisasi = rekeningStats.reduce((sum, item) => sum + item.totalRealisasi, 0);
        const totalSisa = totalAnggaran - totalRealisasi;
        const rataPenyerapan = totalAnggaran > 0 ? (totalRealisasi / totalAnggaran) * 100 : 0;
        
        // Rekening dengan anggaran terbesar
        const topRekening = [...rekeningStats]
            .sort((a, b) => b.totalAnggaran - a.totalAnggaran)
            .slice(0, 5)
            .map(item => ({
                nama: item.rekening,
                kode: item.kodeRekening,
                anggaran: item.totalAnggaran,
                realisasi: item.totalRealisasi,
                penyerapan: item.persentase,
                sisa: item.sisaAnggaran,
                rasio: item.totalAnggaran > 0 ? (item.totalRealisasi / item.totalAnggaran * 100).toFixed(1) : 0
            }));
        
        // Rekening dengan penyerapan terendah (risiko tinggi)
        const highRiskRekening = rekeningStats
            .filter(item => item.totalAnggaran > 50000000 && item.persentase < 40) // >50jt dan <40%
            .sort((a, b) => a.persentase - b.persentase)
            .slice(0, 5)
            .map(item => ({
                nama: item.rekening,
                kode: item.kodeRekening,
                anggaran: item.totalAnggaran,
                penyerapan: item.persentase,
                sisa: item.sisaAnggaran,
                rasio: item.totalAnggaran > 0 ? (item.totalRealisasi / item.totalAnggaran * 100).toFixed(1) : 0
            }));
        
        // Rekening dengan penyerapan tertinggi
        const highPerformerRekening = rekeningStats
            .filter(item => item.totalAnggaran > 10000000 && item.persentase > 85)
            .sort((a, b) => b.persentase - a.persentase)
            .slice(0, 3)
            .map(item => ({
                nama: item.rekening,
                kode: item.kodeRekening,
                anggaran: item.totalAnggaran,
                penyerapan: item.persentase,
                realisasi: item.totalRealisasi
            }));
        
        // Distribusi berdasarkan jenis rekening (estimasi)
        const rekening5Digit = rekeningStats.filter(item => item.kodeRekening && item.kodeRekening.split('.').length >= 5);
        const belanjaOperasi = rekening5Digit.filter(item => item.kodeRekening?.startsWith('5.1')).reduce((sum, item) => sum + item.totalAnggaran, 0);
        const belanjaModal = rekening5Digit.filter(item => item.kodeRekening?.startsWith('5.2')).reduce((sum, item) => sum + item.totalAnggaran, 0);
        const belanjaTakTerduga = rekening5Digit.filter(item => item.kodeRekening?.startsWith('5.3')).reduce((sum, item) => sum + item.totalAnggaran, 0);
        
        // Statistik tambahan
        const rataRataPerRekening = totalAnggaran / rekeningStats.length;
        const medianAnggaran = [...rekeningStats].sort((a, b) => a.totalAnggaran - b.totalAnggaran)[Math.floor(rekeningStats.length / 2)]?.totalAnggaran || 0;
        
        // Distribusi risiko
        const lowRisk = rekeningStats.filter(item => item.persentase >= 85).length;
        const mediumRisk = rekeningStats.filter(item => item.persentase >= 50 && item.persentase < 85).length;
        const highRisk = rekeningStats.filter(item => item.persentase < 50).length;
        const criticalRisk = rekeningStats.filter(item => item.persentase < 30).length;
        
        return {
            totalAnggaran,
            totalRealisasi,
            totalSisa,
            rataPenyerapan,
            topRekening,
            highRiskRekening,
            highPerformerRekening,
            highRiskCount: highRiskRekening.length,
            highPerformerCount: highPerformerRekening.length,
            totalItems: rekeningStats.length,
            filteredItems: sortedAndFilteredData.length,
            belanjaOperasi,
            belanjaModal,
            belanjaTakTerduga,
            selectedSkpd: selectedSkpd === 'Semua SKPD' ? 'Seluruh SKPD' : selectedSkpd,
            rataRataPerRekening,
            medianAnggaran,
            lowRisk,
            mediumRisk,
            highRisk,
            criticalRisk
        };
    }, [rekeningStats, sortedAndFilteredData, selectedSkpd]);

    const totalPages = Math.ceil(sortedAndFilteredData.length / ITEMS_PER_PAGE);
    const paginatedData = sortedAndFilteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    
    const handlePageChange = (page) => {
        if (page > 0 && page <= totalPages) setCurrentPage(page);
    };
    
    React.useEffect(() => {
        setCurrentPage(1);
        setExpandedRekening(null);
    }, [searchTerm, selectedSkpd, startMonth, endMonth, sortOrder]);
    
    // --- Fitur Baru: Fungsi untuk Download Excel ---
    const handleDownloadExcel = () => {
        if (!sortedAndFilteredData || sortedAndFilteredData.length === 0) {
            alert("Tidak ada data untuk diunduh.");
            return;
        }
        if (!window.XLSX) {
            alert("Pustaka unduh Excel tidak tersedia.");
            return;
        }

        try {
            const dataForExport = sortedAndFilteredData.map(item => ({
                'Kode Rekening': item.kodeRekening,
                'Nama Rekening': item.rekening,
                'Anggaran Tahunan': item.totalAnggaran,
                'Realisasi': item.totalRealisasi,
                'Sisa Anggaran': item.sisaAnggaran,
                'Penyerapan (%)': item.persentase.toFixed(2),
                'Jumlah SKPD': item.skpdList.length,
                'Jumlah Sumber Dana': item.sumberDanaList.length
            }));

            const worksheet = window.XLSX.utils.json_to_sheet(dataForExport);
            const workbook = window.XLSX.utils.book_new();
            window.XLSX.utils.book_append_sheet(workbook, worksheet, "Statistik Rekening");
            
            const fileName = `Statistik_Rekening_${selectedSkpd.replace(/ /g, "_")}_(${startMonth}-${endMonth}).xlsx`;
            window.XLSX.writeFile(workbook, fileName);
        } catch (err) {
            console.error("Error creating Excel file:", err);
            alert("Gagal membuat file Excel.");
        }
    };

    const getAnalysisPrompt = (query, allData) => {
        if (query && query.trim() !== '') {
            return `Berdasarkan data rekening SKPD, jawab pertanyaan ini: ${query}`;
        }
        
        const focus = selectedSkpd === 'Semua SKPD' ? 'keseluruhan APBD' : `SKPD: **${selectedSkpd}**`;
        const top5 = executiveSummary?.topRekening?.map((s, i) => 
            `${i+1}. **${s.nama}** (${s.kode}): Anggaran ${formatCurrency(s.anggaran)}, Realisasi ${formatCurrency(s.realisasi)} (${s.penyerapan.toFixed(2)}%)`
        ).join('\n') || '- Tidak ada data';
        
        const highRisk = executiveSummary?.highRiskRekening?.map((s, i) => 
            `${i+1}. **${s.nama}** (${s.kode}): Anggaran ${formatCurrency(s.anggaran)}, Penyerapan ${s.penyerapan.toFixed(2)}%, Sisa ${formatCurrency(s.sisa)}`
        ).join('\n') || '- Tidak ada data berisiko tinggi';
        
        const highPerformer = executiveSummary?.highPerformerRekening?.map((s, i) => 
            `${i+1}. **${s.nama}** (${s.kode}): Penyerapan ${s.penyerapan.toFixed(2)}%, Realisasi ${formatCurrency(s.realisasi)}`
        ).join('\n') || '- Tidak ada data';
        
        const period = startMonth === endMonth ? startMonth : `periode ${startMonth} - ${endMonth}`;
        
        return `ANALISIS STATISTIK REKENING
INSTANSI: ${namaPemda || 'Pemerintah Daerah'}
TAHUN ANGGARAN: ${selectedYear}
SKPD: ${focus}
PERIODE: ${period}

DATA RINGKAS EKSEKUTIF:
- Total Anggaran: ${formatCurrency(executiveSummary?.totalAnggaran || 0)}
- Total Realisasi: ${formatCurrency(executiveSummary?.totalRealisasi || 0)} (${executiveSummary?.rataPenyerapan.toFixed(2)}%)
- Sisa Anggaran: ${formatCurrency(executiveSummary?.totalSisa || 0)}
- Jumlah Rekening: ${executiveSummary?.totalItems || 0} rekening
- Rata-rata per Rekening: ${formatCurrency(executiveSummary?.rataRataPerRekening || 0)}
- Median Anggaran: ${formatCurrency(executiveSummary?.medianAnggaran || 0)}

DISTRIBUSI BELANJA:
- Belanja Operasi (5.1.x): ${formatCurrency(executiveSummary?.belanjaOperasi || 0)} (${executiveSummary?.belanjaOperasi ? ((executiveSummary.belanjaOperasi / executiveSummary.totalAnggaran) * 100).toFixed(1) : 0}%)
- Belanja Modal (5.2.x): ${formatCurrency(executiveSummary?.belanjaModal || 0)} (${executiveSummary?.belanjaModal ? ((executiveSummary.belanjaModal / executiveSummary.totalAnggaran) * 100).toFixed(1) : 0}%)
- Belanja Tak Terduga (5.3.x): ${formatCurrency(executiveSummary?.belanjaTakTerduga || 0)} (${executiveSummary?.belanjaTakTerduga ? ((executiveSummary.belanjaTakTerduga / executiveSummary.totalAnggaran) * 100).toFixed(1) : 0}%)

DISTRIBUSI RISIKO:
- Rendah Risiko (≥85%): ${executiveSummary?.lowRisk || 0} rekening
- Sedang Risiko (50-84%): ${executiveSummary?.mediumRisk || 0} rekening
- Tinggi Risiko (30-49%): ${executiveSummary?.highRisk || 0} rekening
- Kritis (<30%): ${executiveSummary?.criticalRisk || 0} rekening

REKENING DENGAN ANGGARAN TERBESAR:
${top5}

REKENING DENGAN KINERJA TERBAIK:
${highPerformer}

REKENING DENGAN RISIKO TINGGI (Penyerapan <40%, Anggaran >50jt):
${highRisk}

BERIKAN ANALISIS MENDALAM MENGENAI:
1. EVALUASI MAKRO: Bagaimana pola belanja berdasarkan jenis rekening? Apakah proporsi belanja operasi, modal, dan tak terduga sudah ideal?
2. IDENTIFIKASI RISIKO: Analisis ${executiveSummary?.highRiskCount || 0} rekening dengan risiko tinggi dan ${executiveSummary?.criticalRisk || 0} rekening dengan risiko kritis. Apa penyebab rendahnya penyerapan?
3. ANALISIS KONSENTRASI: Apakah ada ketergantungan berlebih pada beberapa rekening tertentu?
4. REKOMENDASI STRATEGIS: 3 langkah konkret untuk meningkatkan penyerapan pada rekening bermasalah dan mempertahankan kinerja rekening unggulan.
5. POIN RAPAT PIMPINAN: 3 poin penting yang harus disampaikan dalam evaluasi keuangan.

Gunakan bahasa profesional, langsung ke inti, dengan pendekatan strategis untuk pengambilan keputusan.`;
    };

    const toggleRincian = (rekening) => {
        setExpandedRekening(prev => (prev === rekening ? null : rekening));
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-10">
            <SectionTitle>Statistik Rekening per SKPD</SectionTitle>
            
            {/* === EXECUTIVE DASHBOARD - INFORMASI UNTUK PIMPINAN (WARNA PURPLE/VIOLET) === */}
            {showExecutiveInfo && executiveSummary && (
                <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-600 rounded-3xl p-10 text-white shadow-2xl border border-white/10 group mb-8">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -mr-40 -mt-40 transition-transform duration-1000 group-hover:scale-110"></div>
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-400/10 rounded-full blur-[80px] -ml-32 -mb-32"></div>
                    <div className="absolute top-20 left-40 w-40 h-40 bg-purple-400/10 rounded-full blur-[60px]"></div>
                    
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
                        <Trophy size={140} className="text-yellow-300" />
                    </div>
                    
                    <div className="relative z-10">
                        {/* Header */}
                        <div className="flex items-center gap-5 mb-6 border-b border-white/20 pb-6">
                            <div className="p-5 bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-400 rounded-2xl shadow-lg shadow-amber-500/30">
                                <Diamond size={40} className="text-white" />
                            </div>
                            <div className="flex-1">
                                <div className="inline-flex items-center gap-3 px-5 py-2 bg-white/20 backdrop-blur-2xl rounded-full text-sm font-black tracking-[0.3em] uppercase border border-white/30 mb-3">
                                    <Sparkles size={16} className="text-yellow-300 animate-pulse" /> 
                                    EXECUTIVE STRATEGIC DASHBOARD
                                </div>
                                <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight">
                                    RINGKASAN EKSEKUTIF <br/>
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-300 text-5xl md:text-6xl">
                                        STATISTIK REKENING
                                    </span>
                                </h2>
                                <p className="text-lg text-white/80 mt-2 max-w-3xl">
                                    Analisis komprehensif belanja per rekening untuk optimalisasi anggaran dan mitigasi risiko fiskal
                                </p>
                            </div>
                            <button 
                                onClick={() => setShowExecutiveInfo(false)}
                                className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/20"
                                title="Sembunyikan"
                            >
                                <EyeOff size={22} />
                            </button>
                        </div>

                        {/* Quick Stats Bar - DIPERBESAR */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <div className="bg-black/30 backdrop-blur-xl rounded-xl p-5 border border-white/20 hover:bg-black/40 transition-all">
                                <div className="flex items-center gap-3 mb-2">
                                    <Coins size={22} className="text-yellow-400" />
                                    <p className="text-xs font-bold uppercase text-purple-200 tracking-wider">Total Anggaran</p>
                                </div>
                                <p className="text-2xl md:text-3xl font-black text-white">{formatCurrency(executiveSummary.totalAnggaran)}</p>
                                <p className="text-xs text-purple-200/70 mt-1">Keseluruhan pagu</p>
                            </div>
                            <div className="bg-black/30 backdrop-blur-xl rounded-xl p-5 border border-white/20 hover:bg-black/40 transition-all">
                                <div className="flex items-center gap-3 mb-2">
                                    <TrendingUp size={22} className="text-emerald-400" />
                                    <p className="text-xs font-bold uppercase text-purple-200 tracking-wider">Total Realisasi</p>
                                </div>
                                <p className="text-2xl md:text-3xl font-black text-emerald-300">{formatCurrency(executiveSummary.totalRealisasi)}</p>
                                <p className="text-xs text-purple-200/70 mt-1">{executiveSummary.rataPenyerapan.toFixed(1)}% dari anggaran</p>
                            </div>
                            <div className="bg-black/30 backdrop-blur-xl rounded-xl p-5 border border-white/20 hover:bg-black/40 transition-all">
                                <div className="flex items-center gap-3 mb-2">
                                    <Gauge size={22} className="text-purple-400" />
                                    <p className="text-xs font-bold uppercase text-purple-200 tracking-wider">Rata-rata Penyerapan</p>
                                </div>
                                <p className="text-2xl md:text-3xl font-black text-purple-300">{executiveSummary.rataPenyerapan.toFixed(1)}%</p>
                                <p className="text-xs text-purple-200/70 mt-1">Seluruh rekening</p>
                            </div>
                            <div className="bg-black/30 backdrop-blur-xl rounded-xl p-5 border border-white/20 hover:bg-black/40 transition-all">
                                <div className="flex items-center gap-3 mb-2">
                                    <Hash size={22} className="text-blue-400" />
                                    <p className="text-xs font-bold uppercase text-purple-200 tracking-wider">Jumlah Rekening</p>
                                </div>
                                <p className="text-2xl md:text-3xl font-black text-blue-300">{executiveSummary.totalItems}</p>
                                <p className="text-xs text-purple-200/70 mt-1">Item anggaran</p>
                            </div>
                        </div>

                        {/* 3 Card Utama - DIPERBESAR */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                            {/* Card 1: Distribusi Belanja */}
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all group/card">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-4 bg-purple-500/30 rounded-xl group-hover/card:scale-110 transition-transform">
                                        <PieChartIcon size={28} className="text-purple-200" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-purple-200 uppercase tracking-wider">DISTRIBUSI BELANJA</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
                                        <span className="text-sm text-purple-100">Operasi (5.1)</span>
                                        <div className="text-right">
                                            <span className="font-bold text-white text-base">{formatCurrency(executiveSummary.belanjaOperasi)}</span>
                                            <span className="text-xs text-purple-200 ml-2">
                                                ({executiveSummary.belanjaOperasi ? ((executiveSummary.belanjaOperasi / executiveSummary.totalAnggaran) * 100).toFixed(1) : 0}%)
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
                                        <span className="text-sm text-purple-100">Modal (5.2)</span>
                                        <div className="text-right">
                                            <span className="font-bold text-white text-base">{formatCurrency(executiveSummary.belanjaModal)}</span>
                                            <span className="text-xs text-purple-200 ml-2">
                                                ({executiveSummary.belanjaModal ? ((executiveSummary.belanjaModal / executiveSummary.totalAnggaran) * 100).toFixed(1) : 0}%)
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
                                        <span className="text-sm text-purple-100">Tak Terduga (5.3)</span>
                                        <div className="text-right">
                                            <span className="font-bold text-white text-base">{formatCurrency(executiveSummary.belanjaTakTerduga)}</span>
                                            <span className="text-xs text-purple-200 ml-2">
                                                ({executiveSummary.belanjaTakTerduga ? ((executiveSummary.belanjaTakTerduga / executiveSummary.totalAnggaran) * 100).toFixed(1) : 0}%)
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Distribusi Risiko */}
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all group/card">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-4 bg-rose-500/30 rounded-xl group-hover/card:scale-110 transition-transform">
                                        <AlertOctagon size={28} className="text-rose-200" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-rose-200 uppercase tracking-wider">DISTRIBUSI RISIKO</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                            <span className="text-sm text-purple-100">Rendah (≥85%)</span>
                                        </div>
                                        <span className="font-bold text-white text-base">{executiveSummary.lowRisk}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                            <span className="text-sm text-purple-100">Sedang (50-84%)</span>
                                        </div>
                                        <span className="font-bold text-white text-base">{executiveSummary.mediumRisk}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                                            <span className="text-sm text-purple-100">Tinggi (30-49%)</span>
                                        </div>
                                        <span className="font-bold text-white text-base">{executiveSummary.highRisk}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                            <span className="text-sm text-purple-100">Kritis (30%)</span>
                                        </div>
                                        <span className="font-bold text-white text-base">{executiveSummary.criticalRisk}</span>
                                    </div>
                                </div>
                                <div className="mt-3 flex h-2 gap-1">
                                    <div className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-l-full" style={{ width: `${(executiveSummary.lowRisk / executiveSummary.totalItems) * 100}%` }}></div>
                                    <div className="h-full bg-gradient-to-r from-yellow-500 to-amber-500" style={{ width: `${(executiveSummary.mediumRisk / executiveSummary.totalItems) * 100}%` }}></div>
                                    <div className="h-full bg-gradient-to-r from-orange-500 to-red-500" style={{ width: `${(executiveSummary.highRisk / executiveSummary.totalItems) * 100}%` }}></div>
                                    <div className="h-full bg-gradient-to-r from-red-500 to-rose-500 rounded-r-full" style={{ width: `${(executiveSummary.criticalRisk / executiveSummary.totalItems) * 100}%` }}></div>
                                </div>
                            </div>

                            {/* Card 3: Top Rekening */}
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all group/card">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-4 bg-emerald-500/30 rounded-xl group-hover/card:scale-110 transition-transform">
                                        <Award size={28} className="text-emerald-200" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-emerald-200 uppercase tracking-wider">TOP REKENING</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {executiveSummary.topRekening.slice(0, 3).map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <span className="w-5 h-5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-black text-center flex items-center justify-center">
                                                    {idx+1}
                                                </span>
                                                <span className="text-sm text-purple-100 truncate max-w-[150px]" title={item.nama}>
                                                    {item.nama.substring(0, 25)}...
                                                </span>
                                            </div>
                                            <span className="font-bold text-emerald-300 text-base">{item.penyerapan.toFixed(1)}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Top Rekening Table - DIPERBESAR */}
                        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 mb-8">
                            <h3 className="text-xl font-black text-white mb-4 flex items-center gap-3">
                                <FileText size={22} className="text-amber-400" /> 
                                TOP 5 REKENING DENGAN ANGGARAN TERBESAR
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-sm font-bold text-purple-200 mb-3 px-3">
                                <div className="col-span-2">NAMA REKENING</div>
                                <div className="text-right">ANGGARAN</div>
                                <div className="text-right">REALISASI</div>
                                <div className="text-right">PENYERAPAN</div>
                            </div>
                            <div className="space-y-2">
                                {executiveSummary.topRekening.map((item, idx) => (
                                    <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all border border-white/10">
                                        <div className="col-span-2 text-white font-medium truncate" title={item.nama}>
                                            <span className="inline-block w-6 h-6 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-black text-center mr-2">
                                                {idx+1}
                                            </span>
                                            {item.nama.length > 50 ? item.nama.substring(0,50)+'...' : item.nama}
                                        </div>
                                        <div className="text-right text-lg font-bold text-purple-200">{formatCurrency(item.anggaran)}</div>
                                        <div className="text-right text-lg font-bold text-emerald-300">{formatCurrency(item.realisasi)}</div>
                                        <div className="text-right">
                                            <span className={`text-base font-black px-4 py-2 rounded-lg inline-block ${
                                                item.penyerapan >= 85 ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50' :
                                                item.penyerapan >= 50 ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50' :
                                                'bg-rose-500/30 text-rose-300 border border-rose-500/50'
                                            }`}>
                                                {item.penyerapan.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Executive Note - DIPERBESAR */}
                        <div className="flex items-start gap-5 text-base bg-gradient-to-r from-purple-800/50 to-violet-800/50 p-6 rounded-2xl border border-purple-500/30 backdrop-blur-sm">
                            <div className="p-4 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl shadow-lg shrink-0">
                                <Lightbulb size={32} className="text-white" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-xl font-black text-white flex items-center gap-2">
                                    <Sparkles size={20} className="text-yellow-300" />
                                    CATATAN EKSEKUTIF
                                </p>
                                <p className="text-base leading-relaxed text-purple-100">
                                    <span className="font-bold text-white">PRIORITAS UTAMA:</span> Terdapat <span className="font-black text-yellow-300 text-lg">{executiveSummary.criticalRisk}</span> rekening dengan risiko kritis (penyerapan &lt;30%) dan 
                                    <span className="font-black text-orange-300 text-lg ml-1">{executiveSummary.highRisk}</span> rekening dengan risiko tinggi (30-49%). 
                                    Fokus pada rekening <span className="font-bold text-white">{executiveSummary.highRiskRekening[0]?.nama || 'bermasalah'}</span> yang menyisakan sisa 
                                    <span className="font-black text-amber-300 text-lg ml-1">{formatCurrency(executiveSummary.highRiskRekening[0]?.sisa || 0)}</span>. 
                                    Belanja operasi mendominasi dengan <span className="font-black text-emerald-300 text-lg">{executiveSummary.belanjaOperasi ? ((executiveSummary.belanjaOperasi / executiveSummary.totalAnggaran) * 100).toFixed(1) : 0}%</span> dari total anggaran.
                                </p>
                                <p className="text-sm text-purple-200/80 mt-2 italic">
                                    * Rekomendasi strategis tersedia pada fitur Analisis AI di bawah
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!showExecutiveInfo && (
                <button 
                    onClick={() => setShowExecutiveInfo(true)}
                    className="mb-6 px-8 py-4 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl font-bold text-base flex items-center gap-3 shadow-xl hover:shadow-2xl transition-all group hover:scale-105"
                >
                    <Eye size={22} className="group-hover:scale-110 transition-transform" /> 
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
                {showAnalysis && rekeningStats.length > 0 && (
                    <div className="text-xs text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-2 bg-white/30 dark:bg-gray-800/30 p-2 rounded-lg">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                        </span>
                        <span>Total Rekening: {rekeningStats.length} | Penyerapan: {executiveSummary?.rataPenyerapan.toFixed(1)}% | Risiko Kritis: {executiveSummary?.criticalRisk}</span>
                    </div>
                )}
                
                {/* Komponen GeminiAnalysis dengan Conditional Rendering */}
                {showAnalysis && (
                    <GeminiAnalysis 
                        getAnalysisPrompt={getAnalysisPrompt} 
                        disabledCondition={rekeningStats.length === 0} 
                        theme={theme}
                        interactivePlaceholder="Analisis belanja operasi dan modal..."
                        userCanUseAi={userCanUseAi}
                        allData={{
                            selectedSkpd,
                            startMonth,
                            endMonth,
                            executiveSummary,
                            topRekening: executiveSummary?.topRekening,
                            highRiskRekening: executiveSummary?.highRiskRekening
                        }}
                    />
                )}
            </div>

            {/* Main Card */}
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/50 dark:border-gray-700/50 overflow-hidden transition-all duration-500 hover:shadow-3xl">
                {/* Filter Section */}
                <div className="p-8 bg-gradient-to-r from-white/50 to-white/30 dark:from-gray-800/50 dark:to-gray-900/50 border-b border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-black text-gray-800 dark:text-white flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-gradient-to-b from-purple-500 to-violet-500 rounded-full"></div>
                            PANEL ANALISIS REKENING
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* SKPD Filter */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                <Building2 size={14} className="text-purple-500" /> SKPD
                            </label>
                            <select 
                                value={selectedSkpd} 
                                onChange={(e) => setSelectedSkpd(e.target.value)} 
                                className="w-full px-4 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm font-medium"
                            >
                                <option value="Semua SKPD">🏢 Semua SKPD</option>
                                {skpdList.map(skpd => <option key={skpd} value={skpd}>{skpd}</option>)}
                            </select>
                        </div>

                        {/* Search Filter */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                <Search size={14} className="text-emerald-500" /> Pencarian
                            </label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder="Cari Nama/Kode Rekening..." 
                                    value={searchTerm} 
                                    onChange={(e) => setSearchTerm(e.target.value)} 
                                    className="w-full pl-10 pr-4 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all" 
                                />
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                            </div>
                        </div>

                        {/* Month Range */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                <Calendar size={14} className="text-purple-500" /> Periode
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <select value={startMonth} onChange={e => setStartMonth(e.target.value)} className="w-full px-3 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm">
                                    {months.map(month => <option key={`start-${month}`} value={month}>{month.substring(0,3)}</option>)}
                                </select>
                                <select value={endMonth} onChange={e => setEndMonth(e.target.value)} className="w-full px-3 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm">
                                    {months.map(month => <option key={`end-${month}`} value={month}>{month.substring(0,3)}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Sort Order */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                <BarChart3 size={14} className="text-amber-500" /> Urutkan
                            </label>
                            <select 
                                value={sortOrder} 
                                onChange={(e) => setSortOrder(e.target.value)} 
                                className="w-full px-4 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
                            >
                                <option value="realisasi-desc">Realisasi Tertinggi</option>
                                <option value="realisasi-asc">Realisasi Terendah</option>
                                <option value="anggaran-desc">Anggaran Tertinggi</option>
                                <option value="anggaran-asc">Anggaran Terendah</option>
                                <option value="persentase-desc">Penyerapan Tertinggi (%)</option>
                                <option value="persentase-asc">Penyerapan Terendah (%)</option>
                                <option value="sisa-desc">Sisa Anggaran Tertinggi</option>
                                <option value="sisa-asc">Sisa Anggaran Terendah</option>
                                <option value="nama-asc">Nama Rekening (A-Z)</option>
                            </select>
                        </div>
                    </div>

                    {/* Download Button */}
                    <div className="flex justify-end mt-4">
                        <button 
                            onClick={handleDownloadExcel} 
                            disabled={sortedAndFilteredData.length === 0} 
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Download size={18} /> Download Excel
                            <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-lg text-xs">
                                {sortedAndFilteredData.length}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Cards Section */}
                <div className="p-8">
                    <div className="space-y-4">
                        {paginatedData.map(item => (
                            <div key={item.rekening} className="border border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl transition-all hover:shadow-xl hover:-translate-y-1 duration-300">
                                <div className="p-5">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg font-mono">
                                                    {item.kodeRekening || 'N/A'}
                                                </span>
                                                {item.sumberDanaList.length > 0 && (
                                                    <span className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg">
                                                        {item.sumberDanaList.length} sumber dana
                                                    </span>
                                                )}
                                            </div>
                                            <h4 className="font-black text-gray-900 dark:text-white text-base leading-tight group-hover:text-purple-600 transition-colors">
                                                {item.rekening}
                                            </h4>
                                        </div>
                                        <button 
                                            onClick={() => toggleRincian(item.rekening)} 
                                            className="p-2.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl hover:bg-white dark:hover:bg-gray-700 transition-all ml-4"
                                        >
                                            {expandedRekening === item.rekening ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                        </button>
                                    </div>
                                    
                                    <div className="mt-4">
                                        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1.5">
                                            <span>Realisasi: <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(item.totalRealisasi)}</span></span>
                                            <span>Pagu: <span className="font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(item.totalAnggaran)}</span></span>
                                        </div>
                                        
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6 relative overflow-hidden">
                                            <div 
                                                className={`h-6 rounded-full flex items-center justify-end pr-3 text-white text-xs font-bold ${
                                                    item.persentase >= 85 ? 'bg-gradient-to-r from-emerald-500 to-green-500' :
                                                    item.persentase >= 50 ? 'bg-gradient-to-r from-yellow-500 to-amber-500' :
                                                    'bg-gradient-to-r from-red-500 to-rose-500'
                                                }`} 
                                                style={{ width: `${Math.min(item.persentase, 100)}%` }}
                                            >
                                                {item.persentase.toFixed(1)}%
                                            </div>
                                        </div>
                                        
                                        <div className="flex justify-between mt-2 text-xs">
                                            <span className="text-gray-500 dark:text-gray-400">Sisa Anggaran:</span>
                                            <span className="font-bold text-amber-600 dark:text-amber-400">{formatCurrency(item.sisaAnggaran)}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {expandedRekening === item.rekening && (
                                    <div className="border-t border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-b from-gray-50/50 to-white/50 dark:from-gray-800/50 dark:to-gray-900/50 p-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                                            <div>
                                                <h5 className="font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                                                    <Building2 size={16} className="text-purple-500" /> Rincian per SKPD
                                                </h5>
                                                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                                    {item.skpdList.length > 0 ? item.skpdList.map(skpdDetail => (
                                                        <div key={skpdDetail.skpd} className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-3 border border-gray-200/50 dark:border-gray-700/50">
                                                            <p className="font-bold text-gray-900 dark:text-white text-sm mb-2">{skpdDetail.skpd}</p>
                                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                                <div>
                                                                    <span className="text-gray-500">Anggaran:</span>
                                                                    <p className="font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(skpdDetail.anggaran)}</p>
                                                                </div>
                                                                <div>
                                                                    <span className="text-gray-500">Realisasi:</span>
                                                                    <p className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(skpdDetail.realisasi)}</p>
                                                                </div>
                                                                <div>
                                                                    <span className="text-gray-500">Sisa:</span>
                                                                    <p className="font-bold text-amber-600 dark:text-amber-400">{formatCurrency(skpdDetail.sisa)}</p>
                                                                </div>
                                                                <div>
                                                                    <span className="text-gray-500">Penyerapan:</span>
                                                                    <p className={`font-bold ${
                                                                        skpdDetail.persen >= 85 ? 'text-green-600' :
                                                                        skpdDetail.persen >= 50 ? 'text-yellow-600' :
                                                                        'text-red-600'
                                                                    }`}>{skpdDetail.persen.toFixed(1)}%</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )) : <p className="text-gray-500 text-center py-4">Tidak ada data per SKPD</p>}
                                                </div>
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                                                    <Database size={16} className="text-indigo-500" /> Sumber Dana
                                                </h5>
                                                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50 dark:border-gray-700/50">
                                                    <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                                                        {item.sumberDanaList.length > 0 ? item.sumberDanaList.map(sd => (
                                                            <li key={sd} className="text-sm">{sd}</li>
                                                        )) : <li className="text-gray-500">Tidak ada data sumber dana</li>}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        
                        {sortedAndFilteredData.length === 0 && (
                            <div className="text-center py-16 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl">
                                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center">
                                    <Database className="w-10 h-10 text-gray-400" />
                                </div>
                                <p className="text-xl font-bold text-gray-600 dark:text-gray-400 mb-2">
                                    Tidak ada data rekening
                                </p>
                                {searchTerm && (
                                    <p className="text-sm text-gray-500 dark:text-gray-500">
                                        Coba hapus filter pencarian "{searchTerm}"
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

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
                </div>

                {/* Footer Notes */}
                {sortedAndFilteredData.length > 0 && (
                    <div className="px-8 py-5 bg-gradient-to-r from-gray-50/50 to-transparent dark:from-gray-800/50 border-t border-gray-200/50 dark:border-gray-700/50">
                        <div className="flex flex-wrap gap-6 text-xs">
                            <span className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full shadow-lg"></div>
                                <span className="font-medium text-gray-600 dark:text-gray-400">
                                    Total {sortedAndFilteredData.length} rekening
                                </span>
                            </span>
                            <span className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full shadow-lg"></div>
                                <span className="font-medium text-gray-600 dark:text-gray-400">
                                    Penyerapan: {executiveSummary?.rataPenyerapan.toFixed(1)}%
                                </span>
                            </span>
                            <span className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full shadow-lg"></div>
                                <span className="font-medium text-gray-600 dark:text-gray-400">
                                    Risiko Kritis: {executiveSummary?.criticalRisk}
                                </span>
                            </span>
                        </div>
                    </div>
                )}
            </div>
            
            <style>{`
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

export default SkpdRekeningStatsView;