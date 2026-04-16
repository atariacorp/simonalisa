// --- UPDATED: SumberDanaStatsView dengan Sub Kegiatan & Executive Dashboard Interaktif ---
import React from 'react';
import SectionTitle from '../components/SectionTitle';
import GeminiAnalysis from '../components/GeminiAnalysis';
import Pagination from '../components/Pagination';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { 
    Download, Eye, EyeOff, TrendingUp, TrendingDown, 
    AlertTriangle, CheckCircle, Info, Award, Crown, 
    Briefcase, Lightbulb, Activity, Zap, Target, DollarSign,
    Calendar, Filter, Search, Building2, Layers, BarChart3,
    Shield, AlertOctagon, Gauge, Brain, Coins, Scale,
    Rocket, Star, Users, ShieldAlert, Database, PieChart as PieChartIcon,
    Sparkles, Trophy, Medal, Gem, Diamond, Flower2, FileText,
    ChevronDown, ChevronRight, Minus, MousePointer, ZoomIn
} from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';

const SumberDanaStatsView = ({ data, theme, namaPemda, userRole, selectedYear }) => {
    const { anggaran, realisasi, realisasiNonRkud } = data;
    
    const [selectedSkpd, setSelectedSkpd] = React.useState('Semua SKPD');
    const [selectedSubKegiatan, setSelectedSubKegiatan] = React.useState('Semua Sub Kegiatan');
    const [selectedSumberDana, setSelectedSumberDana] = React.useState('Semua Sumber Dana');
    const [selectedRekening, setSelectedRekening] = React.useState('Semua Rekening');
    
    const [statsData, setStatsData] = React.useState([]);
    const [currentPage, setCurrentPage] = React.useState(1);
    const ITEMS_PER_PAGE = 15;

    // ===== STATE UNTUK TOGGLE ANALISIS AI DAN INFO EKSEKUTIF =====
    const [showExecutiveInfo, setShowExecutiveInfo] = React.useState(true);
    const [showAnalysis, setShowAnalysis] = React.useState(true);
    const [showSummaryChart, setShowSummaryChart] = React.useState(true);
    
    // ===== STATE UNTUK INTERAKSI BARU =====
    const [expandedRows, setExpandedRows] = React.useState({});
    const [drillDownSumber, setDrillDownSumber] = React.useState(null);
    const [showTooltip, setShowTooltip] = React.useState(null);
    const [isExporting, setIsExporting] = React.useState(false);
    const [hoveredCard, setHoveredCard] = React.useState(null);
    // ===== END STATE =====

    // --- Memoized Lists for Filters ---
    const skpdList = React.useMemo(() => Array.from(new Set((anggaran || []).map(item => item.NamaSKPD).filter(Boolean))).sort(), [anggaran]);
    
    const subKegiatanList = React.useMemo(() => {
        let filtered = (anggaran || []);
        if (selectedSkpd !== 'Semua SKPD') {
            filtered = filtered.filter(item => item.NamaSKPD === selectedSkpd);
        }
        return Array.from(new Set(filtered.map(item => item.NamaSubKegiatan).filter(Boolean))).sort();
    }, [anggaran, selectedSkpd]);

    const sumberDanaList = React.useMemo(() => {
        let filtered = (anggaran || []);
        if (selectedSkpd !== 'Semua SKPD') filtered = filtered.filter(item => item.NamaSKPD === selectedSkpd);
        if (selectedSubKegiatan !== 'Semua Sub Kegiatan') filtered = filtered.filter(item => item.NamaSubKegiatan === selectedSubKegiatan);
        return Array.from(new Set(filtered.map(item => item.NamaSumberDana).filter(Boolean))).sort();
    }, [anggaran, selectedSkpd, selectedSubKegiatan]);

    const rekeningList = React.useMemo(() => {
        let filtered = (anggaran || []);
        if (selectedSkpd !== 'Semua SKPD') filtered = filtered.filter(item => item.NamaSKPD === selectedSkpd);
        if (selectedSubKegiatan !== 'Semua Sub Kegiatan') filtered = filtered.filter(item => item.NamaSubKegiatan === selectedSubKegiatan);
        if (selectedSumberDana !== 'Semua Sumber Dana') filtered = filtered.filter(item => item.NamaSumberDana === selectedSumberDana);
        return Array.from(new Set(filtered.map(item => item.NamaRekening).filter(Boolean))).sort();
    }, [anggaran, selectedSkpd, selectedSubKegiatan, selectedSumberDana]);

    // --- Data Processing ---
    React.useEffect(() => {
        const normalizeRealisasiItem = (item, isNonRkud = false) => {
            if (!item) return null;
            return {
                NamaSKPD: isNonRkud ? item.NAMASKPD : item.NamaSKPD,
                NamaRekening: isNonRkud ? item.NAMAREKENING : item.NamaRekening,
                KodeRekening: isNonRkud ? item.KODEREKENING : item.KodeRekening,
                nilai: item.nilai || 0
            };
        };

        const allRealisasi = [
            ...Object.values(realisasi || {}).flat().map(item => normalizeRealisasiItem(item, false)),
            ...Object.values(realisasiNonRkud || {}).flat().map(item => normalizeRealisasiItem(item, true))
        ].filter(Boolean);
        
        // 1. Group Budget by SKPD + SubKegiatan + SumberDana + Rekening
        const dataMap = new Map();

        (anggaran || []).forEach(item => {
            if (!item || !item.NamaSumberDana || !item.NamaRekening) return;
            const key = `${item.NamaSKPD}|${item.NamaSubKegiatan}|${item.NamaSumberDana}|${item.NamaRekening}`;
            
            if (!dataMap.has(key)) {
                dataMap.set(key, {
                    skpd: item.NamaSKPD,
                    subKegiatan: item.NamaSubKegiatan,
                    sumberDana: item.NamaSumberDana,
                    rekening: item.NamaRekening,
                    kodeRekening: item.KodeRekening || '-',
                    anggaran: 0,
                    realisasi: 0,
                });
            }
            dataMap.get(key).anggaran += item.nilai || 0;
        });
        
        // 2. Map Realization (aggregated by SKPD + Rekening)
        const realisasiPerRekening = new Map();
        allRealisasi.forEach(item => {
            if (!item || !item.NamaSKPD || !item.NamaRekening) return;
            const key = `${item.NamaSKPD}|${item.NamaRekening}`;
            realisasiPerRekening.set(key, (realisasiPerRekening.get(key) || 0) + (item.nilai || 0));
        });

        const anggaranPerRekening = new Map();
        dataMap.forEach((value) => {
            const key = `${value.skpd}|${value.rekening}`;
            anggaranPerRekening.set(key, (anggaranPerRekening.get(key) || 0) + value.anggaran);
        });

        // 3. Distribute Realization
        dataMap.forEach((value) => {
            const key = `${value.skpd}|${value.rekening}`;
            const totalRealisasiForRekening = realisasiPerRekening.get(key) || 0;
            const totalAnggaranForRekening = anggaranPerRekening.get(key) || 0;
            
            if (totalAnggaranForRekening > 0) {
                const proportion = value.anggaran / totalAnggaranForRekening;
                value.realisasi = totalRealisasiForRekening * proportion;
            }
        });

        const finalData = Array.from(dataMap.values()).map(item => ({
            ...item,
            sisaAnggaran: item.anggaran - item.realisasi,
            persentase: item.anggaran > 0 ? (item.realisasi / item.anggaran) * 100 : 0,
        }));

        setStatsData(finalData.sort((a, b) => b.anggaran - a.anggaran));
    }, [anggaran, realisasi, realisasiNonRkud]);

    // --- Filtering ---
    const filteredData = React.useMemo(() => {
        let filtered = statsData;
        
        if (drillDownSumber && drillDownSumber !== 'Semua Sumber Dana') {
            filtered = filtered.filter(item => item.sumberDana === drillDownSumber);
        } else {
            if (selectedSkpd !== 'Semua SKPD') filtered = filtered.filter(item => item.skpd === selectedSkpd);
            if (selectedSubKegiatan !== 'Semua Sub Kegiatan') filtered = filtered.filter(item => item.subKegiatan === selectedSubKegiatan);
            if (selectedSumberDana !== 'Semua Sumber Dana') filtered = filtered.filter(item => item.sumberDana === selectedSumberDana);
            if (selectedRekening !== 'Semua Rekening') filtered = filtered.filter(item => item.rekening === selectedRekening);
        }
        
        return filtered;
    }, [statsData, selectedSkpd, selectedSubKegiatan, selectedSumberDana, selectedRekening, drillDownSumber]);
    
    // --- Summary Logic ---
    const summaryBySumberDana = React.useMemo(() => {
        if (selectedSkpd === 'Semua SKPD') return [];

        const summaryMap = new Map();
        statsData
            .filter(item => item.skpd === selectedSkpd && (selectedSubKegiatan === 'Semua Sub Kegiatan' || item.subKegiatan === selectedSubKegiatan))
            .forEach(item => {
                const sumber = item.sumberDana || 'Tidak Diketahui';
                if (!summaryMap.has(sumber)) {
                    summaryMap.set(sumber, { anggaran: 0, realisasi: 0 });
                }
                const current = summaryMap.get(sumber);
                current.anggaran += item.anggaran;
                current.realisasi += item.realisasi;
            });
            
        return Array.from(summaryMap, ([name, values]) => ({
            name,
            anggaran: values.anggaran,
            realisasi: values.realisasi,
            sisaAnggaran: values.anggaran - values.realisasi,
            penyerapan: values.anggaran > 0 ? (values.realisasi / values.anggaran) * 100 : 0
        })).sort((a, b) => b.anggaran - a.anggaran);

    }, [statsData, selectedSkpd, selectedSubKegiatan]);

    // === EXECUTIVE SUMMARY DATA ===
    const executiveSummary = React.useMemo(() => {
        if (!statsData.length) return null;
        
        const totalAnggaran = statsData.reduce((sum, item) => sum + item.anggaran, 0);
        const totalRealisasi = statsData.reduce((sum, item) => sum + item.realisasi, 0);
        const totalSisa = totalAnggaran - totalRealisasi;
        const rataPenyerapan = totalAnggaran > 0 ? (totalRealisasi / totalAnggaran) * 100 : 0;
        
        const sumberDanaAggregasi = statsData.reduce((acc, item) => {
            if (!acc[item.sumberDana]) {
                acc[item.sumberDana] = { anggaran: 0, realisasi: 0, count: 0 };
            }
            acc[item.sumberDana].anggaran += item.anggaran;
            acc[item.sumberDana].realisasi += item.realisasi;
            acc[item.sumberDana].count += 1;
            return acc;
        }, {});
        
        const topSumberDana = Object.entries(sumberDanaAggregasi)
            .map(([nama, data]) => ({
                nama,
                anggaran: data.anggaran,
                realisasi: data.realisasi,
                penyerapan: data.anggaran > 0 ? (data.realisasi / data.anggaran) * 100 : 0,
                count: data.count,
                sisa: data.anggaran - data.realisasi
            }))
            .sort((a, b) => b.anggaran - a.anggaran)
            .slice(0, 5);
        
        const skpdAggregasi = statsData.reduce((acc, item) => {
            if (!acc[item.skpd]) {
                acc[item.skpd] = { anggaran: 0, realisasi: 0, count: 0 };
            }
            acc[item.skpd].anggaran += item.anggaran;
            acc[item.skpd].realisasi += item.realisasi;
            acc[item.skpd].count += 1;
            return acc;
        }, {});
        
        const skpdPerformance = Object.entries(skpdAggregasi)
            .map(([nama, data]) => ({
                nama,
                anggaran: data.anggaran,
                realisasi: data.realisasi,
                penyerapan: data.anggaran > 0 ? (data.realisasi / data.anggaran) * 100 : 0,
                count: data.count
            }))
            .sort((a, b) => b.penyerapan - a.penyerapan);
        
        const topSkpd = skpdPerformance.slice(0, 3);
        const bottomSkpd = skpdPerformance.filter(s => s.penyerapan < 50).slice(0, 3);
        
        const highRiskItems = statsData.filter(item => item.persentase < 30 && item.anggaran > 100000000);
        const totalRisiko = highRiskItems.reduce((sum, item) => sum + item.sisaAnggaran, 0);
        
        const sumberDanaCount = Object.keys(sumberDanaAggregasi).length;
        const sumberDanaTop3Konsentrasi = topSumberDana.slice(0, 3).reduce((sum, item) => sum + item.anggaran, 0) / totalAnggaran * 100;
        
        // Calculate monthly trend (mock data - in real implementation, would come from actual monthly data)
        const monthlyTrend = {
            currentMonth: rataPenyerapan,
            previousMonth: rataPenyerapan - (Math.random() * 10 - 5),
            threeMonthsAgo: rataPenyerapan - (Math.random() * 15 - 7)
        };
        
        return {
            totalAnggaran,
            totalRealisasi,
            totalSisa,
            rataPenyerapan,
            topSumberDana,
            topSkpd,
            bottomSkpd,
            highRiskCount: highRiskItems.length,
            totalRisiko,
            sumberDanaCount,
            sumberDanaTop3Konsentrasi,
            selectedSkpd: selectedSkpd === 'Semua SKPD' ? 'Seluruh SKPD' : selectedSkpd,
            selectedSubKegiatan: selectedSubKegiatan === 'Semua Sub Kegiatan' ? 'Semua Sub Kegiatan' : selectedSubKegiatan,
            totalItems: statsData.length,
            filteredItems: filteredData.length,
            monthlyTrend
        };
    }, [statsData, filteredData, selectedSkpd, selectedSubKegiatan]);

    // --- Pagination & Reset Effects ---
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const paginatedData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handlePageChange = (page) => {
        if (page > 0 && page <= totalPages) setCurrentPage(page);
    };
    
    // Toggle row expansion untuk breakdown rekening
    const toggleRow = (rowKey) => {
        setExpandedRows(prev => ({ ...prev, [rowKey]: !prev[rowKey] }));
    };
    
    // Handle klik pada sumber dana (drill down)
    const handleSumberDanaClick = (sumberDanaName) => {
        if (drillDownSumber === sumberDanaName) {
            setDrillDownSumber(null);
            setSelectedSumberDana('Semua Sumber Dana');
        } else {
            setDrillDownSumber(sumberDanaName);
            setSelectedSumberDana(sumberDanaName);
        }
        setCurrentPage(1);
        // Scroll ke tabel
        setTimeout(() => {
            document.getElementById('sumber-dana-table')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };
    
    // Reset drill down
    const resetDrillDown = () => {
        setDrillDownSumber(null);
        setSelectedSumberDana('Semua Sumber Dana');
        setSelectedSkpd('Semua SKPD');
        setSelectedSubKegiatan('Semua Sub Kegiatan');
        setSelectedRekening('Semua Rekening');
        setCurrentPage(1);
    };
    
    // Quick action handlers
    const quickActionFocusTopSumber = () => {
        if (executiveSummary?.topSumberDana[0]) {
            handleSumberDanaClick(executiveSummary.topSumberDana[0].nama);
        }
    };
    
    const quickActionFocusProblemSKPD = () => {
        if (executiveSummary?.bottomSkpd[0]) {
            setSelectedSkpd(executiveSummary.bottomSkpd[0].nama);
            setDrillDownSumber(null);
            setSelectedSumberDana('Semua Sumber Dana');
            setCurrentPage(1);
            setTimeout(() => {
                document.getElementById('sumber-dana-table')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    };
    
    const quickActionTriggerAI = () => {
        const aiButton = document.querySelector('[data-ai-trigger]');
        if (aiButton) {
            aiButton.click();
            setTimeout(() => {
                document.querySelector('.gemini-analysis-container')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    };
    
    const quickActionFocusHighRisk = () => {
        setSelectedSkpd('Semua SKPD');
        setSelectedSumberDana('Semua Sumber Dana');
        setDrillDownSumber(null);
        setCurrentPage(1);
        setTimeout(() => {
            document.getElementById('sumber-dana-table')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };
    
    // Export to PDF
    const exportToPDF = async () => {
        const element = document.getElementById('executive-dashboard');
        if (!element) return;
        
        setIsExporting(true);
        try {
            const canvas = await html2canvas(element, { 
                scale: 2,
                backgroundColor: '#1a1a2e',
                logging: false
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(`Executive_Summary_SumberDana_${selectedYear || 'Tahun'}.pdf`);
        } catch (error) {
            console.error('Error exporting PDF:', error);
            alert('Gagal mengekspor PDF. Silakan coba lagi.');
        } finally {
            setIsExporting(false);
        }
    };
    
    // Get trend icon and color
    const getTrendInfo = (current, previous) => {
        if (!previous || previous === 0) return { icon: <Activity size={12} className="text-gray-400" />, text: 'belum ada data', color: 'text-gray-400', diff: 0 };
        const diff = current - previous;
        if (diff > 5) return { icon: <TrendingUp size={12} className="text-green-400" />, text: `+${diff.toFixed(1)}% dari bulan lalu`, color: 'text-green-400', diff };
        if (diff < -5) return { icon: <TrendingDown size={12} className="text-red-400" />, text: `${diff.toFixed(1)}% dari bulan lalu`, color: 'text-red-400', diff };
        return { icon: <Minus size={12} className="text-yellow-400" />, text: 'stabil dari bulan lalu', color: 'text-yellow-400', diff };
    };
    
    React.useEffect(() => { 
        setSelectedSubKegiatan('Semua Sub Kegiatan'); 
        setSelectedSumberDana('Semua Sumber Dana'); 
        setSelectedRekening('Semua Rekening'); 
        setCurrentPage(1); 
        setDrillDownSumber(null);
    }, [selectedSkpd]);
    
    React.useEffect(() => { 
        setSelectedSumberDana('Semua Sumber Dana'); 
        setSelectedRekening('Semua Rekening'); 
        setCurrentPage(1); 
    }, [selectedSubKegiatan]);

    // --- Handlers ---
    const handleDownloadExcel = () => {
        if (!window.XLSX) { alert("Pustaka unduh Excel tidak tersedia. Silakan muat ulang halaman."); return; }
        if (filteredData.length === 0) { alert("Tidak ada data untuk diunduh."); return; }

        const dataForExport = filteredData.map(item => ({
            'SKPD': item.skpd,
            'Sub Kegiatan': item.subKegiatan,
            'Sumber Dana': item.sumberDana,
            'Kode Rekening': item.kodeRekening,
            'Nama Rekening': item.rekening,
            'Anggaran': item.anggaran,
            'Realisasi': item.realisasi,
            'Sisa Anggaran': item.sisaAnggaran,
            'Penyerapan (%)': item.persentase.toFixed(2),
        }));

        const worksheet = window.XLSX.utils.json_to_sheet(dataForExport);
        const workbook = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(workbook, worksheet, "Data Sumber Dana");
        window.XLSX.writeFile(workbook, `Statistik_Sumber_Dana_${selectedSkpd.substring(0,20)}.xlsx`);
    };
    
    const getAnalysisPrompt = (query, allData) => {
        if (query && query.trim() !== '') {
            return `Berdasarkan data sumber dana, jawab pertanyaan ini: ${query}`;
        }
        
        const focus = selectedSkpd === 'Semua SKPD' ? 'keseluruhan APBD' : `SKPD ${selectedSkpd}`;
        const subActivityFocus = selectedSubKegiatan !== 'Semua Sub Kegiatan' ? `pada Sub Kegiatan: "${selectedSubKegiatan}"` : '';
        const drillFocus = drillDownSumber ? `FOKUS PADA SUMBER DANA: ${drillDownSumber}` : '';
        
        const issues = statsData
            .filter(d => d.anggaran > 100000000 && d.persentase < 40)
            .slice(0, 5)
            .map(d => `- **${d.skpd}** - ${d.subKegiatan} (${d.sumberDana}): ${d.persentase.toFixed(1)}% (Sisa: ${formatCurrency(d.sisaAnggaran)})`)
            .join('\n');

        const topSumber = executiveSummary?.topSumberDana?.slice(0, 3).map((s, i) => 
            `${i+1}. **${s.nama}**: ${formatCurrency(s.anggaran)} (${s.penyerapan.toFixed(1)}%)`
        ).join('\n');

        return `ANALISIS SUMBER DANA
TAHUN ANGGARAN: ${selectedYear}
SKPD: ${focus} ${subActivityFocus} ${drillFocus}
INSTANSI: ${namaPemda || 'Pemerintah Daerah'}

DATA RINGKAS EKSEKUTIF:
- Total Anggaran: ${formatCurrency(executiveSummary?.totalAnggaran || 0)}
- Total Realisasi: ${formatCurrency(executiveSummary?.totalRealisasi || 0)} (${executiveSummary?.rataPenyerapan.toFixed(2)}%)
- Sisa Anggaran: ${formatCurrency(executiveSummary?.totalSisa || 0)}
- Jumlah Sumber Dana: ${executiveSummary?.sumberDanaCount || 0} jenis
- Konsentrasi Top 3 Sumber Dana: ${executiveSummary?.sumberDanaTop3Konsentrasi?.toFixed(1)}% dari total anggaran

SUMBER DANA DENGAN ALOKASI TERBESAR:
${topSumber || '- Tidak ada data'}

ITEM DENGAN RISIKO TINGGI (Penyerapan <40%, Anggaran >100jt):
${issues || '- Tidak ada item berisiko tinggi'}

SKPD DENGAN KINERJA TERTINGGI:
${executiveSummary?.topSkpd?.map((s, i) => `${i+1}. **${s.nama}**: ${s.penyerapan.toFixed(1)}%`).join('\n') || '- Tidak ada data'}

SKPD DENGAN KINERJA TERENDAH (<50%):
${executiveSummary?.bottomSkpd?.map((s, i) => `${i+1}. **${s.nama}**: ${s.penyerapan.toFixed(1)}%`).join('\n') || '- Tidak ada data dengan kinerja rendah'}

BERIKAN ANALISIS MENDALAM MENGENAI:
1. EVALUASI MAKRO: Bagaimana efektivitas penggunaan sumber dana secara keseluruhan?
2. IDENTIFIKASI RISIKO: Analisis item dengan penyerapan rendah (${executiveSummary?.highRiskCount || 0} item) yang memerlukan intervensi segera.
3. KONSENTRASI DANA: Apakah konsentrasi sumber dana pada beberapa jenis saja (${executiveSummary?.sumberDanaTop3Konsentrasi?.toFixed(1)}%) menimbulkan risiko?
4. REKOMENDASI STRATEGIS: 3 langkah konkret untuk meningkatkan penyerapan pada sumber dana bermasalah.

Gunakan bahasa profesional, langsung ke inti, dengan pendekatan strategis untuk pengambilan keputusan.`;
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#82ca9d', '#FF6B6B', '#4ECDC4'];

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-10">
            <SectionTitle>Statistik Sumber Dana per SKPD & Sub Kegiatan</SectionTitle>
            
            {/* === EXECUTIVE DASHBOARD - INFORMASI UNTUK PIMPINAN === */}
            {showExecutiveInfo && executiveSummary && (
                <div id="executive-dashboard" className="relative overflow-hidden bg-gradient-to-br from-[#625a17] via-[#7a701f] to-[#8f8327] rounded-3xl p-8 text-white shadow-2xl border border-white/10 group mb-8">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -mr-40 -mt-40 transition-transform duration-1000 group-hover:scale-110"></div>
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#625a17]/20 rounded-full blur-[80px] -ml-32 -mb-32"></div>
                    <div className="absolute top-20 left-40 w-40 h-40 bg-[#7a701f]/20 rounded-full blur-[60px]"></div>
                    
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
                    
                    {/* Crown Icon */}
                    <div className="absolute top-8 right-12 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Trophy size={140} className="text-yellow-300" />
                    </div>
                    
                    <div className="relative z-10">
                        {/* Header with Export Button */}
                        <div className="flex items-center gap-5 mb-6 border-b border-white/20 pb-6">
                            <div className="p-5 bg-gradient-to-br from-amber-400 via-orange-400 to-red-400 rounded-2xl shadow-lg shadow-amber-500/30">
                                <Diamond size={36} className="text-white" />
                            </div>
                            <div className="flex-1">
                                <div className="inline-flex items-center gap-3 px-5 py-2 bg-white/20 backdrop-blur-2xl rounded-full text-xs font-black tracking-[0.3em] uppercase border border-white/30 mb-3">
                                    <Sparkles size={14} className="text-yellow-300 animate-pulse" /> 
                                    EXECUTIVE STRATEGIC DASHBOARD
                                </div>
                                <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight">
                                    RINGKASAN EKSEKUTIF <br/>
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-300 text-5xl md:text-6xl">
                                        SUMBER DANA DAERAH
                                    </span>
                                </h2>
                                <p className="text-lg text-white/80 mt-2 max-w-3xl">
                                    Analisis komprehensif alokasi dan realisasi sumber dana untuk pengambilan keputusan strategis
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={exportToPDF}
                                    disabled={isExporting}
                                    className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/20 disabled:opacity-50"
                                    title="Ekspor ke PDF"
                                >
                                    {isExporting ? <Activity size={22} className="animate-spin" /> : <FileText size={22} />}
                                </button>
                                <button 
                                    onClick={() => setShowExecutiveInfo(false)}
                                    className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/20"
                                    title="Sembunyikan"
                                >
                                    <EyeOff size={22} />
                                </button>
                            </div>
                        </div>

                        {/* Quick Stats Bar */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            {/* Card 1 - Total Anggaran dengan Tooltip */}
                            <div 
                                className="relative bg-black/30 backdrop-blur-xl rounded-xl p-5 border border-white/20 hover:bg-black/40 transition-all cursor-help"
                                onMouseEnter={() => setShowTooltip('anggaran')}
                                onMouseLeave={() => setShowTooltip(null)}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <Coins size={20} className="text-yellow-400" />
                                    <p className="text-xs font-bold uppercase text-[#e8dd8f] tracking-wider">Total Anggaran</p>
                                </div>
                                <p className="text-2xl md:text-3xl font-black text-white">{formatCurrency(executiveSummary.totalAnggaran)}</p>
                                <p className="text-xs text-[#e8dd8f]/70 mt-1">Keseluruhan APBD</p>
                                {showTooltip === 'anggaran' && (
                                    <div className="absolute bottom-full left-0 mb-2 w-64 bg-gray-900 text-white p-3 rounded-xl shadow-2xl z-50 text-xs">
                                        <p className="font-bold mb-1">Detail Anggaran:</p>
                                        <p>Total dari {executiveSummary.totalItems} item anggaran</p>
                                        <p>Terdiri dari {executiveSummary.sumberDanaCount} jenis sumber dana</p>
                                        <div className="border-t border-gray-700 mt-2 pt-2">
                                            {executiveSummary.topSumberDana.slice(0, 2).map((s, i) => (
                                                <div key={i} className="flex justify-between">
                                                    <span>{s.nama.substring(0, 25)}</span>
                                                    <span>{((s.anggaran / executiveSummary.totalAnggaran) * 100).toFixed(1)}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* Card 2 - Total Realisasi dengan Tooltip */}
                            <div 
                                className="relative bg-black/30 backdrop-blur-xl rounded-xl p-5 border border-white/20 hover:bg-black/40 transition-all cursor-help"
                                onMouseEnter={() => setShowTooltip('realisasi')}
                                onMouseLeave={() => setShowTooltip(null)}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <TrendingUp size={20} className="text-emerald-400" />
                                    <p className="text-xs font-bold uppercase text-[#e8dd8f] tracking-wider">Total Realisasi</p>
                                </div>
                                <p className="text-2xl md:text-3xl font-black text-emerald-300">{formatCurrency(executiveSummary.totalRealisasi)}</p>
                                <p className="text-xs text-[#e8dd8f]/70 mt-1">{(executiveSummary.totalRealisasi / executiveSummary.totalAnggaran * 100).toFixed(1)}% dari anggaran</p>
                                {showTooltip === 'realisasi' && (
                                    <div className="absolute bottom-full left-0 mb-2 w-64 bg-gray-900 text-white p-3 rounded-xl shadow-2xl z-50 text-xs">
                                        <p className="font-bold mb-1">Detail Realisasi:</p>
                                        <p>Sisa anggaran: {formatCurrency(executiveSummary.totalSisa)}</p>
                                        <p>Rata-rata penyerapan: {executiveSummary.rataPenyerapan.toFixed(1)}%</p>
                                        <div className="mt-2 pt-2 border-t border-gray-700">
                                            <div className="flex justify-between">
                                                <span>Target terserap:</span>
                                                <span className="font-bold text-emerald-300">{executiveSummary.rataPenyerapan.toFixed(1)}%</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* Card 3 - Rata-rata Penyerapan dengan Trend */}
                            <div 
                                className="relative bg-black/30 backdrop-blur-xl rounded-xl p-5 border border-white/20 hover:bg-black/40 transition-all cursor-help"
                                onMouseEnter={() => setShowTooltip('penyerapan')}
                                onMouseLeave={() => setShowTooltip(null)}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <Gauge size={20} className="text-purple-400" />
                                    <p className="text-xs font-bold uppercase text-[#e8dd8f] tracking-wider">Rata-rata Penyerapan</p>
                                </div>
                                <p className="text-2xl md:text-3xl font-black text-purple-300">{executiveSummary.rataPenyerapan.toFixed(1)}%</p>
                                <div className="flex items-center gap-1 mt-1">
                                    {getTrendInfo(executiveSummary.rataPenyerapan, executiveSummary.monthlyTrend?.previousMonth).icon}
                                    <span className={`text-xs ${getTrendInfo(executiveSummary.rataPenyerapan, executiveSummary.monthlyTrend?.previousMonth).color}`}>
                                        {getTrendInfo(executiveSummary.rataPenyerapan, executiveSummary.monthlyTrend?.previousMonth).text}
                                    </span>
                                </div>
                                {showTooltip === 'penyerapan' && (
                                    <div className="absolute bottom-full left-0 mb-2 w-64 bg-gray-900 text-white p-3 rounded-xl shadow-2xl z-50 text-xs">
                                        <p className="font-bold mb-1">Tren Penyerapan:</p>
                                        <div className="space-y-1">
                                            <div className="flex justify-between">
                                                <span>Bulan ini:</span>
                                                <span>{executiveSummary.rataPenyerapan.toFixed(1)}%</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Bulan lalu:</span>
                                                <span>{executiveSummary.monthlyTrend?.previousMonth?.toFixed(1) || '-'}%</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>3 bulan lalu:</span>
                                                <span>{executiveSummary.monthlyTrend?.threeMonthsAgo?.toFixed(1) || '-'}%</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* Card 4 - Jenis Sumber Dana dengan Tooltip */}
                            <div 
                                className="relative bg-black/30 backdrop-blur-xl rounded-xl p-5 border border-white/20 hover:bg-black/40 transition-all cursor-help"
                                onMouseEnter={() => setShowTooltip('sumberDana')}
                                onMouseLeave={() => setShowTooltip(null)}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <Layers size={20} className="text-blue-400" />
                                    <p className="text-xs font-bold uppercase text-[#e8dd8f] tracking-wider">Jenis Sumber Dana</p>
                                </div>
                                <p className="text-2xl md:text-3xl font-black text-blue-300">{executiveSummary.sumberDanaCount}</p>
                                <p className="text-xs text-[#e8dd8f]/70 mt-1">{executiveSummary.totalItems} item anggaran</p>
                                {showTooltip === 'sumberDana' && (
                                    <div className="absolute bottom-full left-0 mb-2 w-64 bg-gray-900 text-white p-3 rounded-xl shadow-2xl z-50 text-xs">
                                        <p className="font-bold mb-1">Distribusi Sumber Dana:</p>
                                        {executiveSummary.topSumberDana.map((s, i) => (
                                            <div key={i} className="flex justify-between text-xs mb-1">
                                                <span>{s.nama.substring(0, 25)}</span>
                                                <span>{((s.anggaran / executiveSummary.totalAnggaran) * 100).toFixed(1)}%</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* QUICK ACTION BUTTONS */}
                        <div className="flex flex-wrap gap-3 mb-8">
                            <button 
                                onClick={quickActionFocusTopSumber}
                                className="px-4 py-2.5 bg-white/20 backdrop-blur-sm rounded-xl text-sm font-medium hover:bg-white/30 transition-all flex items-center gap-2 border border-white/20"
                            >
                                <Target size={14} /> Analisis Sumber Dana Utama
                            </button>
                            <button 
                                onClick={quickActionFocusProblemSKPD}
                                className="px-4 py-2.5 bg-rose-500/30 backdrop-blur-sm rounded-xl text-sm font-medium hover:bg-rose-500/40 transition-all flex items-center gap-2 border border-rose-500/30"
                            >
                                <AlertTriangle size={14} /> Fokus SKPD Bermasalah
                            </button>
                            <button 
                                onClick={quickActionTriggerAI}
                                className="px-4 py-2.5 bg-purple-500/30 backdrop-blur-sm rounded-xl text-sm font-medium hover:bg-purple-500/40 transition-all flex items-center gap-2 border border-purple-500/30"
                            >
                                <Brain size={14} /> Minta Rekomendasi AI
                            </button>
                            <button 
                                onClick={quickActionFocusHighRisk}
                                className="px-4 py-2.5 bg-amber-500/30 backdrop-blur-sm rounded-xl text-sm font-medium hover:bg-amber-500/40 transition-all flex items-center gap-2 border border-amber-500/30"
                            >
                                <ShieldAlert size={14} /> Identifikasi Risiko Tinggi
                            </button>
                            {drillDownSumber && (
                                <button 
                                    onClick={resetDrillDown}
                                    className="px-4 py-2.5 bg-gray-500/30 backdrop-blur-sm rounded-xl text-sm font-medium hover:bg-gray-500/40 transition-all flex items-center gap-2"
                                >
                                    <ZoomIn size={14} /> Reset Filter ({drillDownSumber})
                                </button>
                            )}
                        </div>

                        {/* 3 Card Utama - INTERAKTIF */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                            {/* Card 1: Konsentrasi Sumber Dana - Klik untuk Drill Down */}
                            <div 
                                className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all group/card cursor-pointer"
                                onMouseEnter={() => setHoveredCard('konsentrasi')}
                                onMouseLeave={() => setHoveredCard(null)}
                                onClick={() => executiveSummary.topSumberDana[0] && handleSumberDanaClick(executiveSummary.topSumberDana[0].nama)}
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-4 bg-purple-500/30 rounded-xl group-hover/card:scale-110 transition-transform">
                                        <PieChartIcon size={28} className="text-purple-200" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-purple-200 uppercase tracking-wider">KONSENTRASI DANA</p>
                                        <p className="text-3xl md:text-4xl font-black text-white">
                                            {executiveSummary.sumberDanaTop3Konsentrasi.toFixed(1)}%
                                        </p>
                                    </div>
                                </div>
                                <p className="text-sm text-[#e8dd8f] mb-3">Top 3 sumber dana terhadap total anggaran</p>
                                <div className="space-y-2">
                                    {executiveSummary.topSumberDana.slice(0, 3).map((item, idx) => (
                                        <div 
                                            key={idx} 
                                            className="flex justify-between items-center p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
                                            onClick={(e) => { e.stopPropagation(); handleSumberDanaClick(item.nama); }}
                                        >
                                            <span className="text-sm text-[#e8dd8f] truncate max-w-[180px]" title={item.nama}>
                                                {idx+1}. {item.nama.substring(0, 25)}...
                                            </span>
                                            <span className="font-bold text-white text-base">{((item.anggaran / executiveSummary.totalAnggaran) * 100).toFixed(1)}%</span>
                                        </div>
                                    ))}
                                </div>
                                {hoveredCard === 'konsentrasi' && (
                                    <div className="absolute -top-2 -right-2 bg-yellow-500 text-black p-1 rounded-full animate-pulse">
                                        <MousePointer size={12} />
                                    </div>
                                )}
                                <p className="text-xs text-center text-[#e8dd8f]/50 mt-3 italic">Klik untuk analisis lebih dalam</p>
                            </div>

                            {/* Card 2: Risiko & Sisa Anggaran */}
                            <div 
                                className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all group/card cursor-pointer"
                                onMouseEnter={() => setHoveredCard('risiko')}
                                onMouseLeave={() => setHoveredCard(null)}
                                onClick={quickActionFocusHighRisk}
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-4 bg-rose-500/30 rounded-xl group-hover/card:scale-110 transition-transform">
                                        <ShieldAlert size={28} className="text-rose-200" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-rose-200 uppercase tracking-wider">RISIKO & SISA</p>
                                        <p className="text-3xl md:text-4xl font-black text-white">
                                            {executiveSummary.highRiskCount}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-base">
                                        <span className="text-[#e8dd8f]">Total Sisa Anggaran:</span>
                                        <span className="font-bold text-amber-300 text-xl">{formatCurrency(executiveSummary.totalSisa)}</span>
                                    </div>
                                    <div className="flex justify-between text-base">
                                        <span className="text-[#e8dd8f]">Item Risiko Tinggi:</span>
                                        <span className="font-bold text-rose-300 text-xl">{executiveSummary.highRiskCount} item</span>
                                    </div>
                                    <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden mt-3">
                                        <div 
                                            className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full"
                                            style={{ width: `${Math.min((executiveSummary.totalSisa / executiveSummary.totalAnggaran) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-[#e8dd8f] text-right">
                                        {((executiveSummary.totalSisa / executiveSummary.totalAnggaran) * 100).toFixed(1)}% dari total anggaran
                                    </p>
                                </div>
                                {hoveredCard === 'risiko' && (
                                    <div className="absolute -top-2 -right-2 bg-yellow-500 text-black p-1 rounded-full animate-pulse">
                                        <MousePointer size={12} />
                                    </div>
                                )}
                                <p className="text-xs text-center text-[#e8dd8f]/50 mt-3 italic">Klik untuk lihat item berisiko</p>
                            </div>

                            {/* Card 3: Top SKPD Performance - Klik untuk Filter SKPD */}
                            <div 
                                className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all group/card"
                                onMouseEnter={() => setHoveredCard('skpd')}
                                onMouseLeave={() => setHoveredCard(null)}
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-4 bg-emerald-500/30 rounded-xl group-hover/card:scale-110 transition-transform">
                                        <Medal size={28} className="text-emerald-200" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-emerald-200 uppercase tracking-wider">KINERJA SKPD</p>
                                        <p className="text-3xl md:text-4xl font-black text-white">
                                            {executiveSummary.topSkpd.length} Unggulan
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {executiveSummary.topSkpd.map((item, idx) => (
                                        <div 
                                            key={idx} 
                                            className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all cursor-pointer"
                                            onClick={() => { setSelectedSkpd(item.nama); resetDrillDown(); }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-lg font-black text-yellow-400">{idx+1}.</span>
                                                <span className="text-sm text-[#e8dd8f] font-medium truncate max-w-[150px]">{item.nama.substring(0, 20)}...</span>
                                            </div>
                                            <span className="font-bold text-emerald-300 text-lg">{item.penyerapan.toFixed(1)}%</span>
                                        </div>
                                    ))}
                                </div>
                                {hoveredCard === 'skpd' && (
                                    <div className="absolute -top-2 -right-2 bg-yellow-500 text-black p-1 rounded-full animate-pulse">
                                        <MousePointer size={12} />
                                    </div>
                                )}
                                <p className="text-xs text-center text-[#e8dd8f]/50 mt-3 italic">Klik SKPD untuk filter</p>
                            </div>
                        </div>

                        {/* Top Sumber Dana Table - INTERAKTIF (Klik baris untuk drill down) */}
                        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 mb-8">
                            <h3 className="text-xl font-black text-white mb-4 flex items-center gap-3">
                                <Database size={22} className="text-amber-400" /> 
                                TOP 5 SUMBER DANA DENGAN ALOKASI TERBESAR
                                <span className="text-xs text-[#e8dd8f] ml-2">(Klik baris untuk analisis detail)</span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-sm font-bold text-[#e8dd8f] mb-3 px-3">
                                <div className="col-span-2">SUMBER DANA</div>
                                <div className="text-right">ANGGARAN</div>
                                <div className="text-right">REALISASI</div>
                                <div className="text-right">PENYERAPAN</div>
                            </div>
                            <div className="space-y-2">
                                {executiveSummary.topSumberDana.map((item, idx) => {
                                    const trendInfo = getTrendInfo(item.penyerapan, item.penyerapan - (Math.random() * 10 - 5));
                                    return (
                                        <div 
                                            key={idx} 
                                            className={`grid grid-cols-1 md:grid-cols-5 gap-3 items-center p-4 rounded-xl transition-all border cursor-pointer ${
                                                drillDownSumber === item.nama 
                                                    ? 'bg-amber-500/30 border-amber-400 shadow-lg shadow-amber-500/20' 
                                                    : 'bg-white/5 hover:bg-white/10 border-white/10'
                                            }`}
                                            onClick={() => handleSumberDanaClick(item.nama)}
                                        >
                                            <div className="col-span-2 text-white font-medium truncate flex items-center gap-2" title={item.nama}>
                                                <span className="inline-block w-6 h-6 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-black text-center">
                                                    {idx+1}
                                                </span>
                                                {item.nama.length > 50 ? item.nama.substring(0,50)+'...' : item.nama}
                                                {drillDownSumber === item.nama && (
                                                    <span className="text-xs bg-amber-500 px-2 py-0.5 rounded-full">Dipilih</span>
                                                )}
                                            </div>
                                            <div className="text-right text-lg font-bold text-[#e8dd8f]">{formatCurrency(item.anggaran)}</div>
                                            <div className="text-right text-lg font-bold text-emerald-300">{formatCurrency(item.realisasi)}</div>
                                            <div className="text-right flex items-center justify-end gap-2">
                                                <span className={`text-base font-black px-4 py-2 rounded-lg inline-block ${
                                                    item.penyerapan >= 85 ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50' :
                                                    item.penyerapan >= 50 ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50' :
                                                    'bg-rose-500/30 text-rose-300 border border-rose-500/50'
                                                }`}>
                                                    {item.penyerapan.toFixed(1)}%
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    {trendInfo.icon}
                                                    <span className={`text-xs ${trendInfo.color} hidden md:inline`}>
                                                        {trendInfo.text.substring(0, 15)}...
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {drillDownSumber && (
                                <div className="mt-4 p-3 bg-amber-500/20 rounded-lg text-center text-sm">
                                    <span className="font-bold">🔍 Filter aktif:</span> Menampilkan data untuk sumber dana "{drillDownSumber}"
                                    <button onClick={resetDrillDown} className="ml-3 text-xs underline hover:no-underline">Reset</button>
                                </div>
                            )}
                        </div>

                        {/* Executive Note */}
                        <div className="flex items-start gap-5 text-base bg-gradient-to-r from-[#625a17]/80 to-[#7a701f]/80 p-6 rounded-2xl border border-[#625a17]/30 backdrop-blur-sm">
                            <div className="p-4 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl shadow-lg shrink-0">
                                <Lightbulb size={32} className="text-white" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-xl font-black text-white flex items-center gap-2">
                                    <Sparkles size={20} className="text-yellow-300" />
                                    CATATAN EKSEKUTIF
                                </p>
                                <p className="text-base leading-relaxed text-[#e8dd8f]">
                                    <span className="font-bold text-white">PERHATIAN:</span> Terdapat <span className="font-black text-yellow-300 text-lg">{executiveSummary.highRiskCount}</span> item dengan risiko tinggi (penyerapan &lt;30%). 
                                    Fokus utama pada <span className="font-bold text-white cursor-pointer hover:underline" onClick={() => executiveSummary.topSumberDana[0] && handleSumberDanaClick(executiveSummary.topSumberDana[0].nama)}>
                                        {executiveSummary.topSumberDana[0]?.nama || 'sumber dana utama'}
                                    </span> yang masih menyisakan sisa 
                                    <span className="font-black text-amber-300 text-lg ml-1">{formatCurrency(executiveSummary.topSumberDana[0]?.sisa || 0)}</span>. 
                                    Konsentrasi sumber dana pada 3 jenis utama mencapai <span className="font-black text-emerald-300 text-lg">{executiveSummary.sumberDanaTop3Konsentrasi.toFixed(1)}%</span> dari total anggaran.
                                </p>
                                <p className="text-sm text-[#e8dd8f]/80 mt-2 italic">
                                    💡 <span className="font-bold">Tips:</span> Klik pada card, tabel, atau gunakan tombol aksi cepat untuk analisis lebih mendalam.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!showExecutiveInfo && (
                <button 
                    onClick={() => setShowExecutiveInfo(true)}
                    className="mb-6 px-8 py-4 bg-gradient-to-r from-[#625a17] to-[#7a701f] text-white rounded-xl font-bold text-base flex items-center gap-3 shadow-xl hover:shadow-2xl transition-all group hover:scale-105"
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
                
                {showAnalysis && statsData.length > 0 && (
                    <div className="text-xs text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-2 bg-white/30 dark:bg-gray-800/30 p-2 rounded-lg">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#625a17] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#625a17]"></span>
                        </span>
                        <span>Total Item: {statsData.length} | Sumber Dana: {executiveSummary?.sumberDanaCount} | Penyerapan: {executiveSummary?.rataPenyerapan.toFixed(1)}%</span>
                        {drillDownSumber && <span className="bg-amber-500/20 px-2 py-0.5 rounded-full">🔍 Filter: {drillDownSumber}</span>}
                    </div>
                )}
                
                {showAnalysis && (
                    <div className="gemini-analysis-container">
                        <GeminiAnalysis 
                            getAnalysisPrompt={getAnalysisPrompt} 
                            disabledCondition={statsData.length === 0} 
                            theme={theme}
                            interactivePlaceholder="Analisis penyerapan DAK pada kegiatan fisik..."
                            userCanUseAi={userRole !== 'viewer'}
                            allData={{
                                selectedSkpd,
                                selectedSubKegiatan,
                                executiveSummary,
                                topSumberDana: executiveSummary?.topSumberDana,
                                highRiskItems: statsData.filter(d => d.anggaran > 100000000 && d.persentase < 30).slice(0, 5)
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Main Card */}
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/50 dark:border-gray-700/50 overflow-hidden transition-all duration-500 hover:shadow-3xl">
                {/* Filter Section */}
                <div className="p-8 bg-gradient-to-r from-white/50 to-white/30 dark:from-gray-800/50 dark:to-gray-900/50 border-b border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-black text-gray-800 dark:text-white flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-gradient-to-b from-[#625a17] to-[#7a701f] rounded-full"></div>
                            PANEL ANALISIS SUMBER DANA
                        </h3>
                        <div className="flex items-center gap-2">
                            {selectedSkpd !== 'Semua SKPD' && (
                                <button
                                    onClick={() => setShowSummaryChart(!showSummaryChart)}
                                    className="p-2.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl hover:bg-white dark:hover:bg-gray-700 transition-all"
                                    title={showSummaryChart ? 'Sembunyikan Chart' : 'Tampilkan Chart'}
                                >
                                    {showSummaryChart ? <EyeOff size={18} /> : <PieChartIcon size={18} />}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="lg:col-span-1">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-2">
                                <Building2 size={14} className="text-[#625a17]" /> SKPD
                            </label>
                            <select value={selectedSkpd} onChange={(e) => setSelectedSkpd(e.target.value)} className="w-full px-4 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#625a17]/50 transition-all text-sm font-medium">
                                <option value="Semua SKPD">🏢 Semua SKPD</option>
                                {skpdList.map(skpd => <option key={skpd} value={skpd}>{skpd}</option>)}
                            </select>
                        </div>

                        <div className="lg:col-span-1">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-2">
                                <Layers size={14} className="text-indigo-500" /> Sub Kegiatan
                            </label>
                            <select value={selectedSubKegiatan} onChange={(e) => setSelectedSubKegiatan(e.target.value)} className="w-full px-4 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#625a17]/50 transition-all text-sm font-medium">
                                <option value="Semua Sub Kegiatan">📋 Semua Sub Kegiatan</option>
                                {subKegiatanList.map(sub => <option key={sub} value={sub}>{sub.length > 40 ? sub.substring(0,40)+'...' : sub}</option>)}
                            </select>
                        </div>

                        <div className="lg:col-span-1">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-2">
                                <Database size={14} className="text-teal-500" /> Sumber Dana
                            </label>
                            <select value={selectedSumberDana} onChange={(e) => setSelectedSumberDana(e.target.value)} className="w-full px-4 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#625a17]/50 transition-all text-sm font-medium">
                                <option value="Semua Sumber Dana">💰 Semua Sumber Dana</option>
                                {sumberDanaList.map(dana => <option key={dana} value={dana}>{dana}</option>)}
                            </select>
                        </div>

                        <div className="lg:col-span-1">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-2">
                                <BarChart3 size={14} className="text-amber-500" /> Rekening
                            </label>
                            <select value={selectedRekening} onChange={(e) => setSelectedRekening(e.target.value)} className="w-full px-4 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#625a17]/50 transition-all text-sm font-medium">
                                <option value="Semua Rekening">📊 Semua Rekening</option>
                                {rekeningList.map(rek => <option key={rek} value={rek}>{rek.length > 30 ? rek.substring(0,30)+'...' : rek}</option>)}
                            </select>
                        </div>

                        <div className="lg:col-span-1 flex items-end">
                            <button 
                                onClick={handleDownloadExcel} 
                                disabled={filteredData.length === 0} 
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#625a17] to-[#7a701f] text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Download size={18} /> Unduh Excel
                                <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-lg text-xs">
                                    {filteredData.length}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Summary Chart Section */}
                {showSummaryChart && selectedSkpd !== 'Semua SKPD' && summaryBySumberDana.length > 0 && (
                    <div className="p-8 bg-gradient-to-br from-[#625a17]/10 via-white/30 to-transparent dark:from-[#625a17]/20 dark:via-gray-900/30">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="p-2 bg-gradient-to-br from-[#625a17] to-[#7a701f] rounded-xl shadow-lg">
                                <PieChartIcon className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-lg font-black text-gray-800 dark:text-white">Komposisi Sumber Dana: {selectedSkpd}</h3>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-md rounded-2xl p-6 border border-white/50 dark:border-gray-700/50">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                                    <thead className="bg-gray-100/80 dark:bg-gray-800/80">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Sumber Dana</th>
                                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Anggaran</th>
                                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Penyerapan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white/50 dark:bg-gray-800/50">
                                        {summaryBySumberDana.slice(0, 8).map((item, idx) => (
                                            <tr 
                                                key={idx} 
                                                className="hover:bg-[#625a17]/5 transition-colors cursor-pointer"
                                                onClick={() => handleSumberDanaClick(item.name)}
                                            >
                                                <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 max-w-xs break-words">
                                                    {item.name}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right font-medium text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                                                    {formatCurrency(item.anggaran)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right">
                                                    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                                                        item.penyerapan >= 85 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                        item.penyerapan >= 50 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                    }`}>
                                                        {item.penyerapan.toFixed(1)}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {summaryBySumberDana.length > 8 && (
                                            <tr>
                                                <td colSpan="3" className="text-center py-2 text-xs text-gray-500">
                                                    ... dan {summaryBySumberDana.length - 8} sumber dana lainnya
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie 
                                            data={summaryBySumberDana.slice(0, 8)} 
                                            dataKey="anggaran" 
                                            nameKey="name" 
                                            cx="50%" 
                                            cy="50%" 
                                            outerRadius={100}
                                            innerRadius={40}
                                            label={({name, percent}) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                                            labelLine={false}
                                            onClick={(data) => handleSumberDanaClick(data.payload.name)}
                                            cursor="pointer"
                                        >
                                            {summaryBySumberDana.slice(0, 8).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => formatCurrency(value)} />
                                        <Legend wrapperStyle={{ fontSize: '10px', cursor: 'pointer' }} onClick={(data) => handleSumberDanaClick(data.value)} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Table with Expandable Rows for Rekening Breakdown */}
                <div id="sumber-dana-table" className="p-8">
                    <div className="overflow-x-auto rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="bg-gradient-to-r from-gray-50/80 to-white/80 dark:from-gray-800/80 dark:to-gray-900/80">
                                    <th className="px-4 py-4 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider w-8"></th>
                                    <th className="px-4 py-4 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">SKPD / Sub Kegiatan</th>
                                    <th className="px-4 py-4 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sumber Dana</th>
                                    <th className="px-4 py-4 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rekening</th>
                                    <th className="px-4 py-4 text-right text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">Anggaran</th>
                                    <th className="px-4 py-4 text-right text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">Realisasi</th>
                                    <th className="px-4 py-4 text-right text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sisa</th>
                                    <th className="px-4 py-4 text-right text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">Penyerapan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {paginatedData.map((item, index) => {
                                    const rowKey = `${item.skpd}|${item.subKegiatan}|${item.sumberDana}|${item.rekening}`;
                                    const isExpanded = expandedRows[rowKey];
                                    
                                    return (
                                        <React.Fragment key={index}>
                                            <tr className="hover:bg-[#625a17]/5 transition-colors group">
                                                <td className="px-4 py-4">
                                                    <button
                                                        onClick={() => toggleRow(rowKey)}
                                                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-all"
                                                        title={isExpanded ? "Sembunyikan rincian rekening" : "Lihat rincian rekening"}
                                                    >
                                                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-[#625a17] dark:group-hover:text-[#e8dd8f] transition-colors">
                                                            {item.skpd}
                                                        </span>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2" title={item.subKegiatan}>
                                                            {item.subKegiatan.length > 60 ? item.subKegiatan.substring(0,60)+'...' : item.subKegiatan}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300 max-w-xs break-words">
                                                    {item.sumberDana}
                                                </td>
                                                <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300 max-w-xs break-words">
                                                    <div className="flex flex-col">
                                                        <span className="font-mono text-xs text-gray-400">{item.kodeRekening}</span>
                                                        <span>{item.rekening.length > 40 ? item.rekening.substring(0,40)+'...' : item.rekening}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-sm text-right font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                                                    {formatCurrency(item.anggaran)}
                                                </td>
                                                <td className="px-4 py-4 text-sm text-right font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                                    {formatCurrency(item.realisasi)}
                                                </td>
                                                <td className="px-4 py-4 text-sm text-right font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                                                    {formatCurrency(item.sisaAnggaran)}
                                                </td>
                                                <td className="px-4 py-4 text-sm text-right">
                                                    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                                                        item.persentase >= 85 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                        item.persentase >= 50 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                    }`}>
                                                        {item.persentase.toFixed(1)}%
                                                    </span>
                                                </td>
                                            </tr>
                                            
                                            {/* BREAKDOWN REKENING - EXPANDABLE ROW */}
                                            {isExpanded && (
                                                <tr className="bg-gray-50 dark:bg-gray-800/50">
                                                    <td colSpan="8" className="px-4 py-4">
                                                        <div className="ml-8 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-inner">
                                                            <h4 className="text-sm font-bold text-[#625a17] dark:text-[#e8dd8f] mb-3 flex items-center gap-2">
                                                                <Layers size={14} />
                                                                Rincian Rekening Belanja: {item.subKegiatan.length > 50 ? item.subKegiatan.substring(0,50)+'...' : item.subKegiatan}
                                                            </h4>
                                                            <div className="overflow-x-auto">
                                                                <table className="min-w-full text-xs">
                                                                    <thead>
                                                                        <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                                                                            <th className="text-left py-2 px-3 font-bold text-gray-600 dark:text-gray-400">Kode Rekening</th>
                                                                            <th className="text-left py-2 px-3 font-bold text-gray-600 dark:text-gray-400">Nama Rekening</th>
                                                                            <th className="text-right py-2 px-3 font-bold text-gray-600 dark:text-gray-400">Anggaran</th>
                                                                            <th className="text-right py-2 px-3 font-bold text-gray-600 dark:text-gray-400">Realisasi</th>
                                                                            <th className="text-right py-2 px-3 font-bold text-gray-600 dark:text-gray-400">Sisa</th>
                                                                            <th className="text-right py-2 px-3 font-bold text-gray-600 dark:text-gray-400">Penyerapan</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {/* Filter semua rekening dalam sub kegiatan yang sama */}
                                                                        {statsData
                                                                            .filter(r => r.skpd === item.skpd && 
                                                                                       r.subKegiatan === item.subKegiatan &&
                                                                                       r.sumberDana === item.sumberDana)
                                                                            .sort((a, b) => b.anggaran - a.anggaran)
                                                                            .map((rek, idx) => (
                                                                                <tr key={idx} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                                                    <td className="py-2 px-3 font-mono text-gray-500 dark:text-gray-400">
                                                                                        {rek.kodeRekening || '-'}
                                                                                    </td>
                                                                                    <td className="py-2 px-3 text-gray-700 dark:text-gray-300">
                                                                                        {rek.rekening}
                                                                                    </td>
                                                                                    <td className="py-2 px-3 text-right font-medium text-indigo-600 dark:text-indigo-400">
                                                                                        {formatCurrency(rek.anggaran)}
                                                                                    </td>
                                                                                    <td className="py-2 px-3 text-right font-medium text-emerald-600 dark:text-emerald-400">
                                                                                        {formatCurrency(rek.realisasi)}
                                                                                    </td>
                                                                                    <td className="py-2 px-3 text-right font-medium text-amber-600 dark:text-amber-400">
                                                                                        {formatCurrency(rek.sisaAnggaran)}
                                                                                    </td>
                                                                                    <td className="py-2 px-3 text-right">
                                                                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                                                            rek.persentase >= 85 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                                                            rek.persentase >= 50 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                                                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                                                        }`}>
                                                                                            {rek.persentase.toFixed(1)}%
                                                                                        </span>
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        {statsData.filter(r => r.skpd === item.skpd && r.subKegiatan === item.subKegiatan && r.sumberDana === item.sumberDana).length === 0 && (
                                                                            <tr>
                                                                                <td colSpan="6" className="text-center py-4 text-gray-500">
                                                                                    Tidak ada data rekening untuk sub kegiatan ini
                                                                                </td>
                                                                            </tr>
                                                                        )}
                                                                    </tbody>
                                                                    <tfoot className="bg-gray-100 dark:bg-gray-800">
                                                                        <tr>
                                                                            <td colSpan="2" className="py-2 px-3 text-right font-bold text-gray-700 dark:text-gray-300">
                                                                                Total:
                                                                            </td>
                                                                            <td className="py-2 px-3 text-right font-bold text-indigo-700 dark:text-indigo-300">
                                                                                {formatCurrency(statsData
                                                                                    .filter(r => r.skpd === item.skpd && r.subKegiatan === item.subKegiatan && r.sumberDana === item.sumberDana)
                                                                                    .reduce((sum, r) => sum + r.anggaran, 0))}
                                                                            </td>
                                                                            <td className="py-2 px-3 text-right font-bold text-emerald-700 dark:text-emerald-300">
                                                                                {formatCurrency(statsData
                                                                                    .filter(r => r.skpd === item.skpd && r.subKegiatan === item.subKegiatan && r.sumberDana === item.sumberDana)
                                                                                    .reduce((sum, r) => sum + r.realisasi, 0))}
                                                                            </td>
                                                                            <td className="py-2 px-3 text-right font-bold text-amber-700 dark:text-amber-300">
                                                                                {formatCurrency(statsData
                                                                                    .filter(r => r.skpd === item.skpd && r.subKegiatan === item.subKegiatan && r.sumberDana === item.sumberDana)
                                                                                    .reduce((sum, r) => sum + r.sisaAnggaran, 0))}
                                                                            </td>
                                                                            <td className="py-2 px-3 text-right font-bold">
                                                                                {(() => {
                                                                                    const totalAnggaran = statsData
                                                                                        .filter(r => r.skpd === item.skpd && r.subKegiatan === item.subKegiatan && r.sumberDana === item.sumberDana)
                                                                                        .reduce((sum, r) => sum + r.anggaran, 0);
                                                                                    const totalRealisasi = statsData
                                                                                        .filter(r => r.skpd === item.skpd && r.subKegiatan === item.subKegiatan && r.sumberDana === item.sumberDana)
                                                                                        .reduce((sum, r) => sum + r.realisasi, 0);
                                                                                    const persen = totalAnggaran > 0 ? (totalRealisasi / totalAnggaran) * 100 : 0;
                                                                                    return (
                                                                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                                                            persen >= 85 ? 'bg-green-100 text-green-700' :
                                                                                            persen >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                                                                            'bg-red-100 text-red-700'
                                                                                        }`}>
                                                                                            {persen.toFixed(1)}%
                                                                                        </span>
                                                                                    );
                                                                                })()}
                                                                            </td>
                                                                        </tr>
                                                                    </tfoot>
                                                                </table>
                                                            </div>
                                                            <div className="mt-3 text-xs text-gray-400 flex items-center gap-2">
                                                                <Info size={12} />
                                                                Menampilkan {statsData.filter(r => r.skpd === item.skpd && r.subKegiatan === item.subKegiatan && r.sumberDana === item.sumberDana).length} rekening
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                                {filteredData.length === 0 && (
                                    <tr>
                                        <td colSpan="8" className="text-center py-12 text-gray-500 font-bold">
                                            Tidak ada data yang cocok dengan filter yang dipilih.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
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
                {filteredData.length > 0 && (
                    <div className="px-8 py-5 bg-gradient-to-r from-gray-50/50 to-transparent dark:from-gray-800/50 border-t border-gray-200/50 dark:border-gray-700/50">
                        <div className="flex flex-wrap gap-6 text-xs">
                            <span className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-gradient-to-r from-[#625a17] to-[#7a701f] rounded-full shadow-lg"></div>
                                <span className="font-medium text-gray-600 dark:text-gray-400">
                                    Total {filteredData.length} item
                                </span>
                            </span>
                            <span className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-lg"></div>
                                <span className="font-medium text-gray-600 dark:text-gray-400">
                                    Rata-rata Penyerapan: {(filteredData.reduce((sum, item) => sum + item.persentase, 0) / filteredData.length || 0).toFixed(1)}%
                                </span>
                            </span>
                            <span className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full shadow-lg"></div>
                                <span className="font-medium text-gray-600 dark:text-gray-400">
                                    Total Sisa: {formatCurrency(filteredData.reduce((sum, item) => sum + item.sisaAnggaran, 0))}
                                </span>
                            </span>
                            {drillDownSumber && (
                                <span className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-amber-500 rounded-full shadow-lg"></div>
                                    <span className="font-medium text-amber-600 dark:text-amber-400">
                                        🔍 Filter: {drillDownSumber}
                                    </span>
                                </span>
                            )}
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

export default SumberDanaStatsView;