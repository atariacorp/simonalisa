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
    FolderTree, ListTree, GitBranch, Layers as LayersIcon, Map, Compass,
    Flag, Medal, Trophy, Sparkles, GitMerge, Sparkle,
    TrendingUpDown, PieChart as PieChartIcon, Percent, BadgePercent,
    Wallet, Receipt, Landmark, PiggyBank, Layers3 as Layers3Icon, GitCompare,
    Sigma, Divide, Minus, Plus, Equal, Infinity, CircleDot,
    Gem, Diamond, Flower2
} from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';

const SkpdSubKegiatanStatsView = ({ data, theme, namaPemda, userRole, selectedYear }) => {
    const { anggaran, realisasi, realisasiNonRkud } = data;
    const [selectedSkpd, setSelectedSkpd] = React.useState('');
    const [selectedSubUnit, setSelectedSubUnit] = React.useState('Semua Sub Unit');
    
    const [subKegiatanStats, setSubKegiatanStats] = React.useState([]);
    const [currentPage, setCurrentPage] = React.useState(1);
    const [expandedRows, setExpandedRows] = React.useState(new globalThis.Set());
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const [startMonth, setStartMonth] = React.useState(months[0]);
    const [endMonth, setEndMonth] = React.useState(months[months.length - 1]);
    const ITEMS_PER_PAGE = 10;

    // ===== STATE UNTUK TOGGLE ANALISIS AI DAN INFO EKSEKUTIF =====
    const [showExecutiveInfo, setShowExecutiveInfo] = React.useState(true);
    const [showAnalysis, setShowAnalysis] = React.useState(true);
    const [showDetails, setShowDetails] = React.useState(true);
    // ===== END STATE =====

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

        const statsMap = new globalThis.Map();
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
                    rekenings: new globalThis.Map(),
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
            const rekenings = Array.from(data.rekenings?.entries?.() || []).map(([rekening, values]) => ({
                rekening,
                ...values,
                persentase: values.anggaran > 0 ? (values.realisasi / values.anggaran) * 100 : 0
            }));
            return {
                ...data,
                sumberDanaList: Array.from(data.sumberDanaSet),
                rekenings,
                persentase: data.totalAnggaran > 0 ? (data.totalRealisasi / data.totalAnggaran) * 100 : 0
            };
        }).sort((a, b) => b.totalAnggaran - a.totalAnggaran);

        setSubKegiatanStats(finalStats);

    }, [selectedSkpd, selectedSubUnit, anggaran, realisasi, realisasiNonRkud, startMonth, endMonth]);

    // === EXECUTIVE SUMMARY DATA - ENHANCED ===
    const executiveSummary = React.useMemo(() => {
        if (!selectedSkpd || !subKegiatanStats.length) return null;
        
        const totalAnggaran = subKegiatanStats.reduce((sum, item) => sum + item.totalAnggaran, 0);
        const totalRealisasi = subKegiatanStats.reduce((sum, item) => sum + item.totalRealisasi, 0);
        const totalSisa = totalAnggaran - totalRealisasi;
        const rataPenyerapan = totalAnggaran > 0 ? (totalRealisasi / totalAnggaran) * 100 : 0;
        
        // Sub kegiatan dengan anggaran terbesar
        const topSubKegiatan = subKegiatanStats.slice(0, 5).map(item => ({
            nama: item.subKegiatan,
            kode: item.kodeSubKegiatan,
            anggaran: item.totalAnggaran,
            realisasi: item.totalRealisasi,
            penyerapan: item.persentase,
            sisa: item.totalAnggaran - item.totalRealisasi,
            rasio: item.totalAnggaran > 0 ? (item.totalRealisasi / item.totalAnggaran * 100).toFixed(1) : 0
        }));
        
        // Sub kegiatan dengan penyerapan tertinggi
        const highPerformerSubKegiatan = subKegiatanStats
            .filter(item => item.totalAnggaran > 10000000 && item.persentase > 85)
            .sort((a, b) => b.persentase - a.persentase)
            .slice(0, 3)
            .map(item => ({
                nama: item.subKegiatan,
                kode: item.kodeSubKegiatan,
                anggaran: item.totalAnggaran,
                penyerapan: item.persentase,
                realisasi: item.totalRealisasi
            }));
        
        // Sub kegiatan dengan penyerapan terendah (risiko tinggi)
        const highRiskSubKegiatan = subKegiatanStats
            .filter(item => item.totalAnggaran > 50000000 && item.persentase < 40) // >50jt dan <40%
            .sort((a, b) => a.persentase - b.persentase)
            .slice(0, 5)
            .map(item => ({
                nama: item.subKegiatan,
                kode: item.kodeSubKegiatan,
                anggaran: item.totalAnggaran,
                penyerapan: item.persentase,
                sisa: item.totalAnggaran - item.totalRealisasi
            }));
        
        // Sub kegiatan dengan penyerapan kritis
        const criticalRiskSubKegiatan = subKegiatanStats
            .filter(item => item.totalAnggaran > 50000000 && item.persentase < 20)
            .sort((a, b) => a.persentase - b.persentase)
            .slice(0, 3)
            .map(item => ({
                nama: item.subKegiatan,
                kode: item.kodeSubKegiatan,
                anggaran: item.totalAnggaran,
                penyerapan: item.persentase,
                sisa: item.totalAnggaran - item.totalRealisasi
            }));
        
        // Rekening yang sering muncul
        const allRekenings = subKegiatanStats.flatMap(item => item.rekenings);
        const topRekenings = allRekenings
            .sort((a, b) => b.anggaran - a.anggaran)
            .slice(0, 5)
            .map(item => item.rekening);
        
        // Sumber dana yang dominan
        const sumberDanaCount = {};
        subKegiatanStats.forEach(item => {
            item.sumberDanaList.forEach(sd => {
                sumberDanaCount[sd] = (sumberDanaCount[sd] || 0) + 1;
            });
        });
        const topSumberDana = Object.entries(sumberDanaCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([nama, count]) => ({ nama, count }));
        
        // Statistik tambahan
        const rataRataPerKegiatan = totalAnggaran / subKegiatanStats.length;
        const medianAnggaran = [...subKegiatanStats].sort((a, b) => a.totalAnggaran - b.totalAnggaran)[Math.floor(subKegiatanStats.length / 2)]?.totalAnggaran || 0;
        
        // Distribusi risiko
        const lowRisk = subKegiatanStats.filter(item => item.persentase >= 85).length;
        const mediumRisk = subKegiatanStats.filter(item => item.persentase >= 50 && item.persentase < 85).length;
        const highRisk = subKegiatanStats.filter(item => item.persentase >= 30 && item.persentase < 50).length;
        const criticalRisk = subKegiatanStats.filter(item => item.persentase < 30).length;
        
        return {
            totalAnggaran,
            totalRealisasi,
            totalSisa,
            rataPenyerapan,
            topSubKegiatan,
            highPerformerSubKegiatan,
            highRiskSubKegiatan,
            criticalRiskSubKegiatan,
            highRiskCount: highRiskSubKegiatan.length,
            criticalRiskCount: criticalRiskSubKegiatan.length,
            highPerformerCount: highPerformerSubKegiatan.length,
            totalItems: subKegiatanStats.length,
            topRekenings,
            topSumberDana,
            selectedSkpd,
            selectedSubUnit: selectedSubUnit === 'Semua Sub Unit' ? 'Semua Sub Unit' : selectedSubUnit,
            rataRataPerKegiatan,
            medianAnggaran,
            lowRisk,
            mediumRisk,
            highRisk,
            criticalRisk
        };
    }, [subKegiatanStats, selectedSkpd, selectedSubUnit]);

    const totalPages = Math.ceil(subKegiatanStats.length / ITEMS_PER_PAGE);
    const paginatedData = subKegiatanStats.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handlePageChange = (page) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const toggleRow = (subKegiatanKey) => {
        const newExpandedRows = new globalThis.Set(expandedRows);
        if (newExpandedRows.has(subKegiatanKey)) {
            newExpandedRows.delete(subKegiatanKey);
        } else {
            newExpandedRows.add(subKegiatanKey);
        }
        setExpandedRows(newExpandedRows);
    };

    React.useEffect(() => {
        setCurrentPage(1);
        setExpandedRows(new globalThis.Set());
        setSelectedSubUnit('Semua Sub Unit');
    }, [selectedSkpd, startMonth, endMonth]);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [selectedSubUnit]);

    const handleDownloadExcel = () => {
        if (!subKegiatanStats || subKegiatanStats.length === 0) {
            alert("Tidak ada data untuk diunduh.");
            return;
        }
        if (!window.XLSX) {
            alert("Pustaka unduh Excel tidak tersedia.");
            return;
        }

        try {
            const dataForExport = subKegiatanStats.map(item => ({
                'Kode Sub Kegiatan': item.kodeSubKegiatan,
                'Nama Sub Kegiatan': item.subKegiatan,
                'Total Anggaran': item.totalAnggaran,
                'Total Realisasi': item.totalRealisasi,
                'Sisa Anggaran': item.totalAnggaran - item.totalRealisasi,
                'Penyerapan (%)': item.persentase.toFixed(2),
                'Kategori Risiko': item.persentase >= 85 ? 'Rendah' : item.persentase >= 50 ? 'Sedang' : item.persentase >= 30 ? 'Tinggi' : 'Kritis',
                'Jumlah Sumber Dana': item.sumberDanaList.length,
                'Jumlah Rekening': item.rekenings.length
            }));

            const worksheet = window.XLSX.utils.json_to_sheet(dataForExport);
            const workbook = window.XLSX.utils.book_new();
            window.XLSX.utils.book_append_sheet(workbook, worksheet, "Sub Kegiatan");
            
            const fileName = `SubKegiatan_${selectedSkpd.replace(/ /g, "_")}_(${startMonth}-${endMonth}).xlsx`;
            window.XLSX.writeFile(workbook, fileName);
        } catch (err) {
            console.error("Error creating Excel file:", err);
            alert("Gagal membuat file Excel.");
        }
    };

    const getAnalysisPrompt = (query, allData) => {
        if (query && query.trim() !== '') {
            return `Berdasarkan data sub kegiatan SKPD, jawab pertanyaan ini: ${query}`;
        }
        
        if (!selectedSkpd) return "Pilih SKPD untuk dianalisis.";
        
        const top5 = executiveSummary?.topSubKegiatan?.map((item, i) => 
            `${i+1}. **${item.nama}** (${item.kode}): Anggaran ${formatCurrency(item.anggaran)}, Realisasi ${formatCurrency(item.realisasi)} (${item.penyerapan.toFixed(2)}%)`
        ).join('\n') || '- Tidak ada data';
        
        const highRisk = executiveSummary?.highRiskSubKegiatan?.map((item, i) => 
            `${i+1}. **${item.nama}** (${item.kode}): Anggaran ${formatCurrency(item.anggaran)}, Penyerapan ${item.penyerapan.toFixed(2)}%, Sisa ${formatCurrency(item.sisa)}`
        ).join('\n') || '- Tidak ada data berisiko tinggi';
        
        const criticalRisk = executiveSummary?.criticalRiskSubKegiatan?.map((item, i) => 
            `${i+1}. **${item.nama}** (${item.kode}): Anggaran ${formatCurrency(item.anggaran)}, Penyerapan ${item.penyerapan.toFixed(2)}%, Sisa ${formatCurrency(item.sisa)} **KRITIS**`
        ).join('\n') || '- Tidak ada data berisiko kritis';
        
        const highPerformer = executiveSummary?.highPerformerSubKegiatan?.map((item, i) => 
            `${i+1}. **${item.nama}** (${item.kode}): Penyerapan ${item.penyerapan.toFixed(2)}%, Realisasi ${formatCurrency(item.realisasi)}`
        ).join('\n') || '- Tidak ada data';
        
        const period = startMonth === endMonth ? startMonth : `periode ${startMonth} - ${endMonth}`;
        
        return `ANALISIS SUB KEGIATAN SKPD
INSTANSI: ${namaPemda || 'Pemerintah Daerah'}
TAHUN ANGGARAN: ${selectedYear}
SKPD: **${selectedSkpd}**
SUB UNIT: ${selectedSubUnit}
PERIODE: ${period}

DATA RINGKAS EKSEKUTIF:
- Total Anggaran: ${formatCurrency(executiveSummary?.totalAnggaran || 0)}
- Total Realisasi: ${formatCurrency(executiveSummary?.totalRealisasi || 0)} (${executiveSummary?.rataPenyerapan.toFixed(2)}%)
- Sisa Anggaran: ${formatCurrency(executiveSummary?.totalSisa || 0)}
- Jumlah Sub Kegiatan: ${executiveSummary?.totalItems || 0}
- Rata-rata per Kegiatan: ${formatCurrency(executiveSummary?.rataRataPerKegiatan || 0)}
- Median Anggaran: ${formatCurrency(executiveSummary?.medianAnggaran || 0)}

DISTRIBUSI RISIKO:
- Risiko Rendah (≥85%): ${executiveSummary?.lowRisk || 0} kegiatan
- Risiko Sedang (50-84%): ${executiveSummary?.mediumRisk || 0} kegiatan
- Risiko Tinggi (30-49%): ${executiveSummary?.highRisk || 0} kegiatan
- Risiko Kritis (<30%): ${executiveSummary?.criticalRisk || 0} kegiatan

SUB KEGIATAN DENGAN KINERJA TERBAIK:
${highPerformer}

SUB KEGIATAN DENGAN ALOKASI TERBESAR:
${top5}

SUB KEGIATAN DENGAN RISIKO TINGGI (Penyerapan <40%, Anggaran >50jt):
${highRisk}

SUB KEGIATAN DENGAN RISIKO KRITIS (Penyerapan <20%, Anggaran >50jt):
${criticalRisk}

BERIKAN ANALISIS MENDALAM MENGENAI:
1. EVALUASI MAKRO: Bagaimana efektivitas pelaksanaan sub kegiatan secara keseluruhan?
2. IDENTIFIKASI RISIKO: Analisis ${executiveSummary?.highRiskCount || 0} sub kegiatan dengan risiko tinggi dan ${executiveSummary?.criticalRiskCount || 0} dengan risiko kritis. Apa penyebab rendahnya penyerapan?
3. ANALISIS KONSENTRASI: Apakah ada ketergantungan pada sumber dana atau rekening tertentu?
4. REKOMENDASI STRATEGIS: 3 langkah konkret untuk meningkatkan penyerapan pada sub kegiatan bermasalah.
5. POIN RAPAT PIMPINAN: 3 poin penting yang harus disampaikan dalam evaluasi program/kegiatan.

Gunakan bahasa profesional, langsung ke inti, dengan pendekatan strategis untuk pengambilan keputusan.`;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-10">
            <SectionTitle>Statistik Sub Kegiatan & Rekening per SKPD</SectionTitle>
            
            {/* === EXECUTIVE DASHBOARD - INFORMASI UNTUK PIMPINAN (WARNA ABU-ABU GELAP) === */}
            {showExecutiveInfo && executiveSummary && (
                <div className="relative overflow-hidden bg-gradient-to-br from-[#464649] via-[#5a5a5e] to-[#6e6e72] rounded-3xl p-10 text-white shadow-2xl border border-white/10 group mb-8">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -mr-40 -mt-40 transition-transform duration-1000 group-hover:scale-110"></div>
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#464649]/20 rounded-full blur-[80px] -ml-32 -mb-32"></div>
                    <div className="absolute top-20 left-40 w-40 h-40 bg-[#5a5a5e]/20 rounded-full blur-[60px]"></div>
                    
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
                        <Trophy size={140} className="text-gray-300" />
                    </div>
                    
                    <div className="relative z-10">
                        {/* Header */}
                        <div className="flex items-center gap-5 mb-6 border-b border-white/20 pb-6">
                            <div className="p-5 bg-gradient-to-br from-[#464649] via-[#5a5a5e] to-[#6e6e72] rounded-2xl shadow-lg shadow-[#464649]/30">
                                <Diamond size={40} className="text-white" />
                            </div>
                            <div className="flex-1">
                                <div className="inline-flex items-center gap-3 px-5 py-2 bg-white/20 backdrop-blur-2xl rounded-full text-sm font-black tracking-[0.3em] uppercase border border-white/30 mb-3">
                                    <Sparkles size={16} className="text-gray-300 animate-pulse" /> 
                                    EXECUTIVE STRATEGIC DASHBOARD
                                </div>
                                <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight">
                                    RINGKASAN EKSEKUTIF <br/>
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-400 text-5xl md:text-6xl drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">
                                        SUB KEGIATAN SKPD
                                    </span>
                                </h2>
                                <p className="text-lg text-white/80 mt-2 max-w-3xl">
                                    Analisis komprehensif sub kegiatan dan rekening untuk optimalisasi program dan mitigasi risiko
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
                                    <Coins size={22} className="text-gray-300" />
                                    <p className="text-xs font-bold uppercase text-gray-300 tracking-wider">Total Anggaran</p>
                                </div>
                                <p className="text-2xl md:text-3xl font-black text-white">{formatCurrency(executiveSummary.totalAnggaran)}</p>
                                <p className="text-xs text-gray-300/70 mt-1">Keseluruhan pagu</p>
                            </div>
                            <div className="bg-black/30 backdrop-blur-xl rounded-xl p-5 border border-white/20 hover:bg-black/40 transition-all">
                                <div className="flex items-center gap-3 mb-2">
                                    <TrendingUp size={22} className="text-emerald-400" />
                                    <p className="text-xs font-bold uppercase text-gray-300 tracking-wider">Total Realisasi</p>
                                </div>
                                <p className="text-2xl md:text-3xl font-black text-emerald-300">{formatCurrency(executiveSummary.totalRealisasi)}</p>
                                <p className="text-xs text-gray-300/70 mt-1">{executiveSummary.rataPenyerapan.toFixed(1)}% dari anggaran</p>
                            </div>
                            <div className="bg-black/30 backdrop-blur-xl rounded-xl p-5 border border-white/20 hover:bg-black/40 transition-all">
                                <div className="flex items-center gap-3 mb-2">
                                    <Gauge size={22} className="text-purple-400" />
                                    <p className="text-xs font-bold uppercase text-gray-300 tracking-wider">Rata-rata Penyerapan</p>
                                </div>
                                <p className="text-2xl md:text-3xl font-black text-purple-300">{executiveSummary.rataPenyerapan.toFixed(1)}%</p>
                                <p className="text-xs text-gray-300/70 mt-1">Seluruh kegiatan</p>
                            </div>
                            <div className="bg-black/30 backdrop-blur-xl rounded-xl p-5 border border-white/20 hover:bg-black/40 transition-all">
                                <div className="flex items-center gap-3 mb-2">
                                    <Layers size={22} className="text-blue-400" />
                                    <p className="text-xs font-bold uppercase text-gray-300 tracking-wider">Jumlah Kegiatan</p>
                                </div>
                                <p className="text-2xl md:text-3xl font-black text-blue-300">{executiveSummary.totalItems}</p>
                                <p className="text-xs text-gray-300/70 mt-1">Sub kegiatan</p>
                            </div>
                        </div>

                        {/* 3 Card Utama - DIPERBESAR */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                            {/* Card 1: Distribusi Risiko */}
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
                                            <span className="text-sm text-gray-200">Rendah (≥85%)</span>
                                        </div>
                                        <span className="font-bold text-white text-base">{executiveSummary.lowRisk}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                            <span className="text-sm text-gray-200">Sedang (50-84%)</span>
                                        </div>
                                        <span className="font-bold text-white text-base">{executiveSummary.mediumRisk}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                                            <span className="text-sm text-gray-200">Tinggi (30-49%)</span>
                                        </div>
                                        <span className="font-bold text-white text-base">{executiveSummary.highRisk}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                            <span className="text-sm text-gray-200">Kritis (30%)</span>
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

                            {/* Card 2: Top Kegiatan Unggulan */}
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all group/card">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-4 bg-emerald-500/30 rounded-xl group-hover/card:scale-110 transition-transform">
                                        <Trophy size={28} className="text-emerald-200" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-emerald-200 uppercase tracking-wider">KEGIATAN UNGGULAN</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {executiveSummary.highPerformerSubKegiatan.slice(0, 3).map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <span className="w-5 h-5 rounded-full bg-gradient-to-r from-[#464649] to-[#5a5a5e] text-white text-xs font-black text-center flex items-center justify-center">
                                                    {idx+1}
                                                </span>
                                                <span className="text-sm text-gray-200 truncate max-w-[150px]" title={item.nama}>
                                                    {item.nama.substring(0, 25)}...
                                                </span>
                                            </div>
                                            <span className="font-bold text-emerald-300 text-base">{item.penyerapan.toFixed(1)}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Card 3: Top Sumber Dana */}
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all group/card">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-4 bg-blue-500/30 rounded-xl group-hover/card:scale-110 transition-transform">
                                        <Database size={28} className="text-blue-200" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-blue-200 uppercase tracking-wider">SUMBER DANA DOMINAN</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {executiveSummary.topSumberDana.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                                            <span className="text-sm text-gray-200 truncate max-w-[180px]">
                                                {idx+1}. {item.nama.substring(0, 20)}...
                                            </span>
                                            <span className="font-bold text-gray-300 text-base">{item.count} kegiatan</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Top Sub Kegiatan Table - DIPERBESAR */}
                        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 mb-8">
                            <h3 className="text-xl font-black text-white mb-4 flex items-center gap-3">
                                <ListTree size={22} className="text-gray-300" /> 
                                TOP 5 SUB KEGIATAN DENGAN ANGGARAN TERBESAR
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-sm font-bold text-gray-300 mb-3 px-3">
                                <div className="col-span-2">NAMA SUB KEGIATAN</div>
                                <div className="text-right">ANGGARAN</div>
                                <div className="text-right">REALISASI</div>
                                <div className="text-right">PENYERAPAN</div>
                            </div>
                            <div className="space-y-2">
                                {executiveSummary.topSubKegiatan.map((item, idx) => (
                                    <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all border border-white/10">
                                        <div className="col-span-2 text-white font-medium truncate" title={item.nama}>
                                            <span className="inline-block w-6 h-6 rounded-full bg-gradient-to-r from-[#464649] to-[#5a5a5e] text-white text-sm font-black text-center mr-2">
                                                {idx+1}
                                            </span>
                                            {item.nama.length > 50 ? item.nama.substring(0,50)+'...' : item.nama}
                                        </div>
                                        <div className="text-right text-lg font-bold text-gray-300">{formatCurrency(item.anggaran)}</div>
                                        <div className="text-right text-lg font-bold text-emerald-300">{formatCurrency(item.realisasi)}</div>
                                        <div className="text-right">
                                            <span className={`text-base font-black px-4 py-2 rounded-lg inline-block ${
                                                item.penyerapan >= 85 ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50' :
                                                item.penyerapan >= 50 ? 'bg-[#464649]/50 text-gray-300 border border-[#464649]/50' :
                                                item.penyerapan >= 30 ? 'bg-orange-500/30 text-orange-300 border border-orange-500/50' :
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
                        <div className="flex items-start gap-5 text-base bg-gradient-to-r from-[#464649]/80 to-[#5a5a5e]/80 p-6 rounded-2xl border border-[#464649]/30 backdrop-blur-sm">
                            <div className="p-4 bg-gradient-to-br from-[#464649] to-[#5a5a5e] rounded-xl shadow-lg shrink-0">
                                <Lightbulb size={32} className="text-white" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-xl font-black text-white flex items-center gap-2">
                                    <Sparkles size={20} className="text-gray-300" />
                                    CATATAN EKSEKUTIF
                                </p>
                                <p className="text-base leading-relaxed text-gray-200">
                                    <span className="font-bold text-white">PRIORITAS UTAMA:</span> Terdapat <span className="font-black text-gray-300 text-lg">{executiveSummary.criticalRisk}</span> sub kegiatan dengan risiko kritis (penyerapan &lt;30%) dan 
                                    <span className="font-black text-orange-300 text-lg ml-1">{executiveSummary.highRisk}</span> dengan risiko tinggi (30-49%). 
                                    Fokus pada sub kegiatan <span className="font-bold text-white">{executiveSummary.criticalRiskSubKegiatan[0]?.nama || 'bermasalah'}</span> yang menyisakan sisa 
                                    <span className="font-black text-gray-300 text-lg ml-1">{formatCurrency(executiveSummary.criticalRiskSubKegiatan[0]?.sisa || 0)}</span>. 
                                    Sub kegiatan unggulan <span className="font-bold text-white">{executiveSummary.highPerformerSubKegiatan[0]?.nama || 'unggulan'}</span> mencapai penyerapan 
                                    <span className="font-black text-emerald-300 text-lg ml-1">{executiveSummary.highPerformerSubKegiatan[0]?.penyerapan.toFixed(1) || 0}%</span>.
                                </p>
                                <p className="text-sm text-gray-300/80 mt-2 italic">
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
                    className="mb-6 px-8 py-4 bg-gradient-to-r from-[#464649] to-[#5a5a5e] text-white rounded-xl font-bold text-base flex items-center gap-3 shadow-xl hover:shadow-2xl transition-all group hover:scale-105"
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
                {showAnalysis && selectedSkpd && subKegiatanStats.length > 0 && (
                    <div className="text-xs text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-2 bg-white/30 dark:bg-gray-800/30 p-2 rounded-lg">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#464649] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#464649]"></span>
                        </span>
                        <span>Sub Kegiatan: {subKegiatanStats.length} | Penyerapan: {executiveSummary?.rataPenyerapan.toFixed(1)}% | Risiko Kritis: {executiveSummary?.criticalRisk}</span>
                    </div>
                )}
                
                {/* Komponen GeminiAnalysis dengan Conditional Rendering */}
                {showAnalysis && (
                    <GeminiAnalysis 
                        getAnalysisPrompt={getAnalysisPrompt} 
                        disabledCondition={!selectedSkpd || subKegiatanStats.length === 0} 
                        theme={theme}
                        interactivePlaceholder="Analisis sub kegiatan infrastruktur..."
                        userRole={userRole}
                        allData={{
                            selectedSkpd,
                            selectedSubUnit,
                            startMonth,
                            endMonth,
                            executiveSummary,
                            topSubKegiatan: executiveSummary?.topSubKegiatan
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
                            <div className="w-1.5 h-6 bg-gradient-to-b from-[#464649] to-[#5a5a5e] rounded-full"></div>
                            PANEL ANALISIS SUB KEGIATAN
                        </h3>
                        <div className="flex items-center gap-2">
                            {selectedSkpd && (
                                <button
                                    onClick={() => setShowDetails(!showDetails)}
                                    className="p-2.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl hover:bg-white dark:hover:bg-gray-700 transition-all"
                                    title={showDetails ? 'Sembunyikan Detail' : 'Tampilkan Detail'}
                                >
                                    {showDetails ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* SKPD Filter */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                <Building2 size={14} className="text-[#464649]" /> SKPD
                            </label>
                            <select
                                value={selectedSkpd}
                                onChange={(e) => setSelectedSkpd(e.target.value)}
                                className="w-full px-4 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#464649]/50 transition-all text-sm font-medium"
                            >
                                <option value="">-- Pilih SKPD --</option>
                                {skpdList.map(skpd => <option key={skpd} value={skpd}>{skpd}</option>)}
                            </select>
                        </div>

                        {/* Sub Unit Filter */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                <Layers size={14} className="text-purple-500" /> Sub Unit
                            </label>
                            <select
                                value={selectedSubUnit}
                                onChange={(e) => setSelectedSubUnit(e.target.value)}
                                disabled={!selectedSkpd || subUnitList.length === 0}
                                className="w-full px-4 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#464649]/50 transition-all text-sm font-medium disabled:opacity-50"
                            >
                                <option value="Semua Sub Unit">📋 Semua Sub Unit</option>
                                {subUnitList.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                            </select>
                        </div>

                        {/* Month Range */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                <Calendar size={14} className="text-blue-500" /> Periode
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <select value={startMonth} onChange={e => setStartMonth(e.target.value)} className="w-full px-3 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#464649]/50 transition-all text-sm">
                                    {months.map(month => <option key={`start-${month}`} value={month}>{month.substring(0,3)}</option>)}
                                </select>
                                <select value={endMonth} onChange={e => setEndMonth(e.target.value)} className="w-full px-3 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#464649]/50 transition-all text-sm">
                                    {months.map(month => <option key={`end-${month}`} value={month}>{month.substring(0,3)}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Download Button */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                <Download size={14} className="text-emerald-500" /> Ekspor Data
                            </label>
                            <button 
                                onClick={handleDownloadExcel} 
                                disabled={!selectedSkpd || subKegiatanStats.length === 0} 
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#464649] to-[#5a5a5e] text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Download size={18} /> Download Excel
                                <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-lg text-xs">
                                    {subKegiatanStats.length}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                {selectedSkpd ? (
                    <div className="p-8">
                        {subKegiatanStats.length > 0 ? (
                            <div className="space-y-4">
                                {paginatedData.map(item => {
                                    const subKegiatanKey = `${item.subKegiatan}-${item.kodeSubKegiatan}`;
                                    return (
                                        <div key={subKegiatanKey} className="border border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 duration-300">
                                            {/* Header */}
                                            <div onClick={() => toggleRow(subKegiatanKey)} className="flex flex-col lg:flex-row lg:items-center p-5 cursor-pointer bg-gradient-to-r from-transparent to-white/20 dark:to-gray-800/20 hover:bg-[#464649]/10 dark:hover:bg-[#464649]/20 transition-colors">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs px-2 py-1 bg-[#464649]/20 dark:bg-[#464649]/30 text-[#464649] dark:text-gray-300 rounded-lg font-mono">
                                                            {item.kodeSubKegiatan}
                                                        </span>
                                                        {item.sumberDanaList.length > 0 && (
                                                            <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg">
                                                                {item.sumberDanaList.length} sumber dana
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h4 className="font-black text-gray-900 dark:text-white text-base leading-tight group-hover:text-[#464649] transition-colors">
                                                        {item.subKegiatan}
                                                    </h4>
                                                </div>
                                                
                                                <div className="flex items-center gap-4 mt-3 lg:mt-0">
                                                    <div className="w-48">
                                                        <div className="flex justify-between text-xs mb-1">
                                                            <span className="text-gray-500">Realisasi</span>
                                                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{item.persentase.toFixed(1)}%</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                                            <div 
                                                                className={`h-full rounded-full ${
                                                                    item.persentase >= 85 ? 'bg-gradient-to-r from-emerald-500 to-green-500' :
                                                                    item.persentase >= 50 ? 'bg-gradient-to-r from-[#464649] to-[#5a5a5e]' :
                                                                    item.persentase >= 30 ? 'bg-gradient-to-r from-orange-500 to-red-500' :
                                                                    'bg-gradient-to-r from-red-500 to-rose-500'
                                                                }`}
                                                                style={{ width: `${Math.min(item.persentase, 100)}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="text-right min-w-[120px]">
                                                        <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(item.totalAnggaran)}</p>
                                                        <p className="text-xs text-gray-500">Total Anggaran</p>
                                                    </div>
                                                    
                                                    <div className="text-right min-w-[120px]">
                                                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(item.totalRealisasi)}</p>
                                                        <p className="text-xs text-gray-500">Total Realisasi</p>
                                                    </div>
                                                    
                                                    <button className="p-2.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl hover:bg-white dark:hover:bg-gray-700 transition-all ml-2">
                                                        {expandedRows.has(subKegiatanKey) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Expanded Details */}
                                            {expandedRows.has(subKegiatanKey) && showDetails && (
                                                <div className="bg-gradient-to-b from-gray-50/50 to-white/50 dark:from-gray-800/50 dark:to-gray-900/50 p-5 border-t border-gray-200/50 dark:border-gray-700/50">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        {/* Sumber Dana */}
                                                        <div>
                                                            <h5 className="font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                                                                <Database size={16} className="text-[#464649]" /> Sumber Dana
                                                            </h5>
                                                            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50 dark:border-gray-700/50">
                                                                <ul className="list-disc list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                                                    {item.sumberDanaList.length > 0 ? item.sumberDanaList.map(sd => (
                                                                        <li key={sd} className="break-words">{sd}</li>
                                                                    )) : <li className="text-gray-500">Tidak ada data sumber dana</li>}
                                                                </ul>
                                                            </div>
                                                        </div>

                                                        {/* Rincian Rekening */}
                                                        <div>
                                                            <h5 className="font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                                                                <FileText size={16} className="text-purple-500" /> Rincian Rekening
                                                            </h5>
                                                            <div className="overflow-x-auto rounded-lg border border-gray-200/50 dark:border-gray-700/50">
                                                                <table className="min-w-full">
                                                                    <thead className="bg-gray-100/80 dark:bg-gray-800/80">
                                                                        <tr>
                                                                            <th className="px-4 py-2 text-left text-xs font-bold text-gray-600 dark:text-gray-300">Nama Rekening</th>
                                                                            <th className="px-4 py-2 text-right text-xs font-bold text-gray-600 dark:text-gray-300">Anggaran</th>
                                                                            <th className="px-4 py-2 text-right text-xs font-bold text-gray-600 dark:text-gray-300">Realisasi</th>
                                                                            <th className="px-4 py-2 text-right text-xs font-bold text-gray-600 dark:text-gray-300">%</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
                                                                        {item.rekenings.slice(0, 5).map(rek => (
                                                                            <tr key={rek.rekening} className="hover:bg-[#464649]/10 dark:hover:bg-[#464649]/20">
                                                                                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 max-w-xs break-words">
                                                                                    {rek.rekening}
                                                                                </td>
                                                                                <td className="px-4 py-2 text-right text-sm text-indigo-600 dark:text-indigo-400">
                                                                                    {formatCurrency(rek.anggaran)}
                                                                                </td>
                                                                                <td className="px-4 py-2 text-right text-sm text-emerald-600 dark:text-emerald-400">
                                                                                    {formatCurrency(rek.realisasi)}
                                                                                </td>
                                                                                <td className="px-4 py-2 text-right text-sm">
                                                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                                                        rek.persentase >= 85 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                                                        rek.persentase >= 50 ? 'bg-[#464649]/20 text-[#464649] dark:bg-[#464649]/30 dark:text-gray-300' :
                                                                                        rek.persentase >= 30 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                                                                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                                                    }`}>
                                                                                        {rek.persentase.toFixed(1)}%
                                                                                    </span>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                        {item.rekenings.length > 5 && (
                                                                            <tr>
                                                                                <td colSpan="4" className="text-center py-2 text-xs text-gray-500">
                                                                                    ... dan {item.rekenings.length - 5} rekening lainnya
                                                                                </td>
                                                                            </tr>
                                                                        )}
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
                            <div className="text-center py-16 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl">
                                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center">
                                    <FolderTree className="w-10 h-10 text-gray-400" />
                                </div>
                                <p className="text-xl font-bold text-gray-600 dark:text-gray-400 mb-2">
                                    Tidak ada data sub kegiatan
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-500">
                                    Coba ubah filter atau pilih SKPD lain
                                </p>
                            </div>
                        )}

                        {/* Pagination */}
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
                ) : (
                    <div className="p-16 text-center">
                        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-[#464649]/20 to-[#5a5a5e]/20 dark:from-[#464649]/30 dark:to-[#5a5a5e]/30 rounded-full flex items-center justify-center">
                            <Building2 className="w-12 h-12 text-[#464649] dark:text-[#5a5a5e]" />
                        </div>
                        <p className="text-xl font-bold text-gray-600 dark:text-gray-400 mb-2">
                            Pilih SKPD untuk Memulai
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 max-w-md mx-auto">
                            Silakan pilih SKPD dari daftar untuk melihat statistik sub kegiatan dan rincian rekening
                        </p>
                    </div>
                )}

                {/* Footer Notes */}
                {selectedSkpd && subKegiatanStats.length > 0 && (
                    <div className="px-8 py-5 bg-gradient-to-r from-gray-50/50 to-transparent dark:from-gray-800/50 border-t border-gray-200/50 dark:border-gray-700/50">
                        <div className="flex flex-wrap gap-6 text-xs">
                            <span className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-gradient-to-r from-[#464649] to-[#5a5a5e] rounded-full shadow-lg"></div>
                                <span className="font-medium text-gray-600 dark:text-gray-400">
                                    Total {subKegiatanStats.length} sub kegiatan
                                </span>
                            </span>
                            <span className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full shadow-lg"></div>
                                <span className="font-medium text-gray-600 dark:text-gray-400">
                                    {subKegiatanStats.reduce((sum, item) => sum + item.sumberDanaList.length, 0)} sumber dana
                                </span>
                            </span>
                            <span className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-gradient-to-r from-[#464649] to-[#5a5a5e] rounded-full shadow-lg"></div>
                                <span className="font-medium text-gray-600 dark:text-gray-400">
                                    {subKegiatanStats.reduce((sum, item) => sum + item.rekenings.length, 0)} rekening
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

export default SkpdSubKegiatanStatsView;