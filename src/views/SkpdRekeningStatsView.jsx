// --- UPDATED: SkpdRekeningStatsView dengan Multi-Select Chart, Sub Kegiatan Details, & Executive Dashboard Interaktif ---
import React from 'react';
import SectionTitle from '../components/SectionTitle';
import GeminiAnalysis from '../components/GeminiAnalysis';
import Pagination from '../components/Pagination';
import { db, auth } from '../utils/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { 
    TrendingUp, DollarSign, Calendar, Filter, Search, Download,
    Eye, EyeOff, AlertTriangle, CheckCircle, Info, Award, Crown,
    Briefcase, Lightbulb, Activity, Zap, Target, Building2,
    Layers, BarChart3, Shield, ShieldAlert, AlertOctagon, Gauge, Brain, Coins,
    Scale, Rocket, Star, Users, Database, PieChart, ChevronUp,
    ChevronDown, FileText, Hash, CreditCard, ArrowUpRight,
    ArrowDownRight, Clock, Lock, Unlock, Globe, BookOpen,
    Sparkles, Trophy, Medal, Gem, Diamond, Flower2, Sparkle,
    TrendingUpDown, PieChart as PieChartIcon, Percent, BadgePercent,
    Wallet, Receipt, Landmark, PiggyBank, Layers3, GitCompare,
    Sigma, Divide, Minus, Plus, Equal, Infinity, CircleDot,
    MousePointer, ZoomIn, Check, CheckSquare, Square, Trash2,
    CalendarDays, BarChart as BarChartIcon, LineChart, TrendingUp as TrendingUpIcon,
    Maximize2, Minimize2, List, Grid, PieChart as PieChartIcon2
} from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Line, ComposedChart, PieChart as RePieChart, Pie, Legend } from 'recharts';

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
    const [expandedSubKegiatan, setExpandedSubKegiatan] = React.useState({});

    const [showExecutiveInfo, setShowExecutiveInfo] = React.useState(true);
    const [showAnalysis, setShowAnalysis] = React.useState(true);
    
    const [selectedRekenings, setSelectedRekenings] = React.useState([]);
    const [showSelectionPanel, setShowSelectionPanel] = React.useState(false);
    const [selectAll, setSelectAll] = React.useState(false);
    
    const [rekeningSearchTerm, setRekeningSearchTerm] = React.useState("");
    
    const [chartRekenings, setChartRekenings] = React.useState([]);
    const [showChartPanel, setShowChartPanel] = React.useState(false);
    const [chartType, setChartType] = React.useState('bar');
    
    const [drillDownRekening, setDrillDownRekening] = React.useState(null);
    const [showTooltip, setShowTooltip] = React.useState(null);
    const [hoveredCard, setHoveredCard] = React.useState(null);
    const [isExporting, setIsExporting] = React.useState(false);
    const [dashboardView, setDashboardView] = React.useState('summary');

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
                nilai: item.nilai || 0,
                bulan: isNonRkud ? item.BULAN : item.bulan,
                bulanIndex: isNonRkud ? months.indexOf(item.BULAN) : months.indexOf(item.bulan)
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
                    realisasiPerBulan: new Array(12).fill(0),
                    skpdDetails: new Map(),
                    sumberDanaSet: new Set(),
                    subKegiatanDetails: new Map(),
                });
            }
            const data = dataMap.get(key);
            data.totalAnggaran += item.nilai || 0;
            if (item.NamaSumberDana) data.sumberDanaSet.add(item.NamaSumberDana);
            
            if (item.NamaSubKegiatan) {
                const subKey = item.NamaSubKegiatan;
                if (!data.subKegiatanDetails.has(subKey)) {
                    data.subKegiatanDetails.set(subKey, {
                        nama: item.NamaSubKegiatan,
                        anggaran: 0,
                        realisasi: 0,
                        kodeSubKegiatan: item.KodeSubKegiatan || '-'
                    });
                }
                data.subKegiatanDetails.get(subKey).anggaran += item.nilai || 0;
            }

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
                    realisasiPerBulan: new Array(12).fill(0),
                    skpdDetails: new Map(),
                    sumberDanaSet: new Set(),
                    subKegiatanDetails: new Map(),
                });
            }
            const data = dataMap.get(key);
            const bulanIndex = item.bulanIndex !== undefined ? item.bulanIndex : months.indexOf(item.bulan);
            if (bulanIndex >= 0 && bulanIndex < 12) {
                data.realisasiPerBulan[bulanIndex] += item.nilai || 0;
            }
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

            const subKegiatanArray = Array.from(item.subKegiatanDetails.entries()).map(([nama, detail]) => ({
                nama: detail.nama,
                kode: detail.kodeSubKegiatan,
                anggaran: detail.anggaran,
                realisasi: detail.realisasi,
                persen: detail.anggaran > 0 ? (detail.realisasi / detail.anggaran) * 100 : 0,
                sisa: detail.anggaran - detail.realisasi
            })).sort((a, b) => b.anggaran - a.anggaran);

            let maxRealisasi = 0;
            let bestMonthIndex = -1;
            item.realisasiPerBulan.forEach((value, idx) => {
                if (value > maxRealisasi) {
                    maxRealisasi = value;
                    bestMonthIndex = idx;
                }
            });

            return { 
                ...item, persentase, sisaAnggaran,
                skpdList: skpdDetailsArray,
                sumberDanaList: Array.from(item.sumberDanaSet),
                subKegiatanList: subKegiatanArray,
                subKegiatanCount: item.subKegiatanDetails.size,
                realisasiPerBulan: item.realisasiPerBulan,
                bestMonth: bestMonthIndex !== -1 ? months[bestMonthIndex] : null,
                bestMonthValue: maxRealisasi
            };
        });

        setRekeningStats(stats);
    }, [selectedSkpd, anggaran, realisasi, realisasiNonRkud, startMonth, endMonth]);
    
    const filteredData = React.useMemo(() => {
        let filtered = rekeningStats;
        if (drillDownRekening) {
            filtered = filtered.filter(item => item.rekening === drillDownRekening);
        }
        if (searchTerm) {
            filtered = filtered.filter(item => 
                item.rekening.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.kodeRekening && String(item.kodeRekening).toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }
        if (selectedRekenings.length > 0 && !drillDownRekening) {
            filtered = filtered.filter(item => selectedRekenings.includes(item.rekening));
        }
        return filtered;
    }, [rekeningStats, searchTerm, drillDownRekening, selectedRekenings]);
    
    const filteredRekeningForSelection = React.useMemo(() => {
        if (!rekeningSearchTerm) return rekeningStats;
        return rekeningStats.filter(item => 
            item.rekening.toLowerCase().includes(rekeningSearchTerm.toLowerCase()) ||
            (item.kodeRekening && String(item.kodeRekening).toLowerCase().includes(rekeningSearchTerm.toLowerCase()))
        );
    }, [rekeningStats, rekeningSearchTerm]);
    
    const getChartDataForRekenings = React.useMemo(() => {
        if (chartRekenings.length === 0) return [];
        const chartDataMap = new Map();
        months.forEach((month, idx) => {
            chartDataMap.set(month, { bulan: month.substring(0, 3) });
        });
        chartRekenings.forEach(rekeningName => {
            const rekening = rekeningStats.find(r => r.rekening === rekeningName);
            if (rekening && rekening.realisasiPerBulan) {
                months.forEach((month, idx) => {
                    const data = chartDataMap.get(month);
                    data[rekeningName] = rekening.realisasiPerBulan[idx] || 0;
                });
            }
        });
        return Array.from(chartDataMap.values());
    }, [chartRekenings, rekeningStats]);
    
    const chartBestMonths = React.useMemo(() => {
        const result = {};
        chartRekenings.forEach(rekeningName => {
            const rekening = rekeningStats.find(r => r.rekening === rekeningName);
            if (rekening && rekening.bestMonth) {
                result[rekeningName] = { bulan: rekening.bestMonth, nilai: rekening.bestMonthValue };
            }
        });
        return result;
    }, [chartRekenings, rekeningStats]);
    
    const addToChart = (rekeningName) => {
        if (!chartRekenings.includes(rekeningName)) {
            setChartRekenings(prev => [...prev, rekeningName]);
        }
        setShowChartPanel(true);
    };
    
    const removeFromChart = (rekeningName) => {
        setChartRekenings(prev => prev.filter(r => r !== rekeningName));
    };
    
    const clearChart = () => {
        setChartRekenings([]);
        setShowChartPanel(false);
    };
    
    const sortedAndFilteredData = React.useMemo(() => {
        const [key, direction] = sortOrder.split('-');
        return [...filteredData].sort((a, b) => {
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
    }, [filteredData, sortOrder]);

    const handleSelectRekening = (rekeningName) => {
        setSelectedRekenings(prev => {
            if (prev.includes(rekeningName)) {
                return prev.filter(r => r !== rekeningName);
            } else {
                return [...prev, rekeningName];
            }
        });
        setDrillDownRekening(null);
    };
    
    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedRekenings([]);
            setSelectAll(false);
        } else {
            const allRekeningNames = filteredRekeningForSelection.map(r => r.rekening);
            setSelectedRekenings(allRekeningNames);
            setSelectAll(true);
        }
    };
    
    const handleClearSelection = () => {
        setSelectedRekenings([]);
        setSelectAll(false);
        setDrillDownRekening(null);
    };
    
    const handleRekeningClick = (rekeningName) => {
        if (drillDownRekening === rekeningName) {
            setDrillDownRekening(null);
        } else {
            setDrillDownRekening(rekeningName);
            setSelectedRekenings([]);
            setSelectAll(false);
        }
        setCurrentPage(1);
        setTimeout(() => {
            document.getElementById('rekening-table')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };
    
    const resetDrillDown = () => {
        setDrillDownRekening(null);
        setSelectedRekenings([]);
        setSelectAll(false);
        setSearchTerm('');
    };
    
    const quickActionFocusTopRekening = () => {
        if (executiveSummary?.topRekening[0]) {
            handleRekeningClick(executiveSummary.topRekening[0].nama);
        }
    };
    
    const quickActionFocusHighRisk = () => {
        if (executiveSummary?.highRiskRekening[0]) {
            handleRekeningClick(executiveSummary.highRiskRekening[0].nama);
        }
    };
    
    const quickActionFocusHighPerformer = () => {
        if (executiveSummary?.highPerformerRekening[0]) {
            handleRekeningClick(executiveSummary.highPerformerRekening[0].nama);
        }
    };
    
    const quickActionSelectCriticalRisks = () => {
        const criticalRekeningNames = rekeningStats
            .filter(item => item.persentase < 30 && item.totalAnggaran > 50000000)
            .map(item => item.rekening);
        setSelectedRekenings(criticalRekeningNames);
        setDrillDownRekening(null);
        setSelectAll(false);
        setTimeout(() => {
            document.getElementById('rekening-table')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };
    
    const quickActionAddTopToChart = () => {
        const topRekeningNames = executiveSummary?.topRekening?.slice(0, 3).map(r => r.nama) || [];
        setChartRekenings(prev => [...new Set([...prev, ...topRekeningNames])]);
        setShowChartPanel(true);
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
    
    const exportToPDF = async () => {
        const element = document.getElementById('executive-dashboard');
        if (!element) return;
        setIsExporting(true);
        try {
            const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#1a1a2e', logging: false });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(`Executive_Summary_Rekening_${selectedYear || 'Tahun'}.pdf`);
        } catch (error) {
            console.error('Error exporting PDF:', error);
            alert('Gagal mengekspor PDF. Silakan coba lagi.');
        } finally {
            setIsExporting(false);
        }
    };
    
    const getTrendInfo = (current, previous) => {
        if (!previous || previous === 0) return { icon: <Activity size={12} className="text-gray-400" />, text: 'belum ada data', color: 'text-gray-400', diff: 0 };
        const diff = current - previous;
        if (diff > 5) return { icon: <TrendingUp size={12} className="text-green-400" />, text: `+${diff.toFixed(1)}%`, color: 'text-green-400', diff };
        if (diff < -5) return { icon: <TrendingDown size={12} className="text-red-400" />, text: `${diff.toFixed(1)}%`, color: 'text-red-400', diff };
        return { icon: <Minus size={12} className="text-yellow-400" />, text: 'stabil', color: 'text-yellow-400', diff };
    };
    
    const executiveSummary = React.useMemo(() => {
        if (!rekeningStats.length) return null;
        
        const totalAnggaran = rekeningStats.reduce((sum, item) => sum + item.totalAnggaran, 0);
        const totalRealisasi = rekeningStats.reduce((sum, item) => sum + item.totalRealisasi, 0);
        const totalSisa = totalAnggaran - totalRealisasi;
        const rataPenyerapan = totalAnggaran > 0 ? (totalRealisasi / totalAnggaran) * 100 : 0;
        
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
                bestMonth: item.bestMonth,
                bestMonthValue: item.bestMonthValue
            }));
        
        const highRiskRekening = rekeningStats
            .filter(item => item.totalAnggaran > 50000000 && item.persentase < 40)
            .sort((a, b) => a.persentase - b.persentase)
            .slice(0, 5)
            .map(item => ({
                nama: item.rekening,
                kode: item.kodeRekening,
                anggaran: item.totalAnggaran,
                penyerapan: item.persentase,
                sisa: item.sisaAnggaran,
                bestMonth: item.bestMonth
            }));
        
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
        
        const highestSisaRekening = [...rekeningStats]
            .sort((a, b) => b.sisaAnggaran - a.sisaAnggaran)
            .slice(0, 3)
            .map(item => ({
                nama: item.rekening,
                kode: item.kodeRekening,
                sisa: item.sisaAnggaran,
                penyerapan: item.persentase,
            }));
        
        const rekening5Digit = rekeningStats.filter(item => item.kodeRekening && item.kodeRekening.split('.').length >= 5);
        const belanjaOperasi = rekening5Digit.filter(item => item.kodeRekening?.startsWith('5.1')).reduce((sum, item) => sum + item.totalAnggaran, 0);
        const belanjaModal = rekening5Digit.filter(item => item.kodeRekening?.startsWith('5.2')).reduce((sum, item) => sum + item.totalAnggaran, 0);
        const belanjaTakTerduga = rekening5Digit.filter(item => item.kodeRekening?.startsWith('5.3')).reduce((sum, item) => sum + item.totalAnggaran, 0);
        
        const rataRataPerRekening = totalAnggaran / rekeningStats.length;
        
        const lowRisk = rekeningStats.filter(item => item.persentase >= 85).length;
        const mediumRisk = rekeningStats.filter(item => item.persentase >= 50 && item.persentase < 85).length;
        const highRisk = rekeningStats.filter(item => item.persentase >= 30 && item.persentase < 50).length;
        const criticalRisk = rekeningStats.filter(item => item.persentase < 30).length;
        
        const sortedByAnggaran = [...rekeningStats].sort((a, b) => b.totalAnggaran - a.totalAnggaran);
        let cumulative = 0;
        let paretoIndex = 0;
        for (let i = 0; i < sortedByAnggaran.length; i++) {
            cumulative += sortedByAnggaran[i].totalAnggaran;
            if (cumulative >= totalAnggaran * 0.8) {
                paretoIndex = i + 1;
                break;
            }
        }
        
        const recommendations = [];
        if (criticalRisk > 0) recommendations.push(`Segera evaluasi ${criticalRisk} rekening dengan penyerapan kritis (<30%)`);
        if (highRisk > 0) recommendations.push(`Pantau ${highRisk} rekening berisiko tinggi (30-49%)`);
        if (belanjaModal / totalAnggaran < 0.3) recommendations.push(`Pertimbangkan peningkatan alokasi belanja modal untuk infrastruktur`);
        if (belanjaOperasi / totalAnggaran > 0.7) recommendations.push(`Evaluasi efisiensi belanja operasi yang mendominasi (${((belanjaOperasi / totalAnggaran) * 100).toFixed(1)}%)`);
        
        return {
            totalAnggaran, totalRealisasi, totalSisa, rataPenyerapan,
            topRekening, highRiskRekening, highPerformerRekening, highestSisaRekening,
            totalItems: rekeningStats.length, selectedItems: selectedRekenings.length,
            belanjaOperasi, belanjaModal, belanjaTakTerduga,
            selectedSkpd: selectedSkpd === 'Semua SKPD' ? 'Seluruh SKPD' : selectedSkpd,
            rataRataPerRekening, lowRisk, mediumRisk, highRisk, criticalRisk,
            paretoCount: paretoIndex, recommendations,
            chartRekeningsCount: chartRekenings.length
        };
    }, [rekeningStats, selectedSkpd, selectedRekenings, chartRekenings]);

    const totalPages = Math.ceil(sortedAndFilteredData.length / ITEMS_PER_PAGE);
    const paginatedData = sortedAndFilteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    
    const handlePageChange = (page) => {
        if (page > 0 && page <= totalPages) setCurrentPage(page);
    };
    
    React.useEffect(() => {
        setCurrentPage(1);
        setExpandedRekening(null);
    }, [searchTerm, selectedSkpd, startMonth, endMonth, sortOrder, selectedRekenings, drillDownRekening]);

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
                'Bulan Realisasi Tertinggi': item.bestMonth,
                'Nilai Realisasi Tertinggi': item.bestMonthValue,
                'Jumlah SKPD': item.skpdList.length,
                'Jumlah Sumber Dana': item.sumberDanaList.length,
                'Jumlah Sub Kegiatan': item.subKegiatanCount
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
        const drillFocus = drillDownRekening ? `FOKUS PADA REKENING: ${drillDownRekening}` : '';
        const top5 = executiveSummary?.topRekening?.map((s, i) => `${i+1}. **${s.nama}** (${s.kode}): ${formatCurrency(s.anggaran)} (${s.penyerapan.toFixed(2)}%) - Realisasi tertinggi ${s.bestMonth || 'N/A'}`).join('\n') || '- Tidak ada data';
        const period = startMonth === endMonth ? startMonth : `periode ${startMonth} - ${endMonth}`;
        return `ANALISIS STATISTIK REKENING\nINSTANSI: ${namaPemda || 'Pemerintah Daerah'}\nTAHUN ANGGARAN: ${selectedYear}\nSKPD: ${focus}\nPERIODE: ${period}\n${drillFocus}\n\nDATA RINGKAS EKSEKUTIF:\n- Total Anggaran: ${formatCurrency(executiveSummary?.totalAnggaran || 0)}\n- Total Realisasi: ${formatCurrency(executiveSummary?.totalRealisasi || 0)} (${executiveSummary?.rataPenyerapan.toFixed(2)}%)\n- Sisa Anggaran: ${formatCurrency(executiveSummary?.totalSisa || 0)}\n- Jumlah Rekening: ${executiveSummary?.totalItems || 0} rekening\n\nREKENING DENGAN ANGGARAN TERBESAR:\n${top5}\n\nBERIKAN ANALISIS MENDALAM MENGENAI pola realisasi dan rekomendasi strategis.`;
    };

    const toggleRincian = (rekening) => {
        setExpandedRekening(prev => (prev === rekening ? null : rekening));
    };
    
    const toggleSubKegiatan = (rekeningName) => {
        setExpandedSubKegiatan(prev => ({ ...prev, [rekeningName]: !prev[rekeningName] }));
    };

    const CHART_COLORS = ['#56238f', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

    if (!rekeningStats.length && anggaran?.length > 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-[#56238f] border-t-transparent rounded-full animate-spin mx-auto mb-3 md:mb-4"></div>
                    <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">Memproses data rekening...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 md:space-y-8 animate-in fade-in duration-700 pb-6 md:pb-10">
            <SectionTitle>Statistik Rekening per SKPD</SectionTitle>
            
            {showExecutiveInfo && executiveSummary && (
                <div id="executive-dashboard" className="relative overflow-hidden bg-gradient-to-br from-[#56238f] via-[#6a2fa8] to-[#7e3bc1] rounded-xl md:rounded-3xl p-3 md:p-8 text-white shadow-2xl border border-white/10 group mb-4 md:mb-8">
                    <div className="absolute top-0 right-0 w-48 h-48 md:w-96 md:h-96 bg-white/10 rounded-full blur-[60px] md:blur-[100px] -mr-20 md:-mr-40 -mt-20 md:-mt-40"></div>
                    <div className="absolute bottom-0 left-0 w-40 h-40 md:w-80 md:h-80 bg-[#56238f]/20 rounded-full blur-[50px] md:blur-[80px] -ml-16 md:-ml-32 -mb-16 md:-mb-32"></div>
                    <div className="absolute top-4 right-4 md:top-8 md:right-12 opacity-10"><Trophy size={60} className="md:w-[140px] md:h-[140px] text-yellow-300" /></div>
                    
                    <div className="relative z-10">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-5 mb-4 md:mb-6 border-b border-white/20 pb-3 md:pb-6">
                            <div className="flex items-center gap-3 md:gap-5">
                                <div className="p-2 md:p-5 bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-400 rounded-xl md:rounded-2xl">
                                    <Landmark size={20} className="md:w-9 md:h-9 text-white" />
                                </div>
                                <div>
                                    <div className="inline-flex items-center gap-1 md:gap-2 px-2 py-0.5 md:px-5 md:py-2 bg-white/20 backdrop-blur-2xl rounded-full text-[8px] md:text-xs font-black tracking-[0.15em] md:tracking-[0.3em] uppercase border border-white/30 mb-1 md:mb-3">
                                        <Sparkles size={8} className="md:w-4 md:h-4 text-yellow-300 animate-pulse" /> 
                                        EXECUTIVE DASHBOARD
                                    </div>
                                    <h2 className="text-sm md:text-4xl lg:text-5xl font-black tracking-tighter leading-tight">
                                        RINGKASAN EKSEKUTIF <br/>
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-300 text-base md:text-5xl lg:text-6xl">
                                            ANALISIS REKENING
                                        </span>
                                    </h2>
                                    <p className="text-[10px] md:text-lg text-white/80 mt-0.5 md:mt-2 max-w-3xl">Analisis komprehensif belanja per rekening untuk optimalisasi anggaran dan mitigasi risiko fiskal</p>
                                </div>
                            </div>
                            <div className="flex gap-1 md:gap-2 self-end md:self-auto">
                                <div className="flex bg-black/30 rounded-lg md:rounded-xl p-0.5 md:p-1">
                                    <button onClick={() => setDashboardView('summary')} className={`px-2 md:px-3 py-0.5 md:py-1.5 rounded-md md:rounded-lg text-[8px] md:text-xs font-medium transition-all ${dashboardView === 'summary' ? 'bg-white/20' : 'hover:bg-white/10'}`}>Ringkasan</button>
                                    <button onClick={() => setDashboardView('risk')} className={`px-2 md:px-3 py-0.5 md:py-1.5 rounded-md md:rounded-lg text-[8px] md:text-xs font-medium transition-all ${dashboardView === 'risk' ? 'bg-white/20' : 'hover:bg-white/10'}`}>Risiko</button>
                                    <button onClick={() => setDashboardView('performance')} className={`px-2 md:px-3 py-0.5 md:py-1.5 rounded-md md:rounded-lg text-[8px] md:text-xs font-medium transition-all ${dashboardView === 'performance' ? 'bg-white/20' : 'hover:bg-white/10'}`}>Kinerja</button>
                                </div>
                                <button onClick={exportToPDF} disabled={isExporting} className="p-1.5 md:p-3 bg-white/10 hover:bg-white/20 rounded-lg md:rounded-xl"><FileText size={12} className="md:w-5 md:h-5" /></button>
                                <button onClick={() => setShowExecutiveInfo(false)} className="p-1.5 md:p-3 bg-white/10 hover:bg-white/20 rounded-lg md:rounded-xl"><EyeOff size={12} className="md:w-5 md:h-5" /></button>
                            </div>
                        </div>

                        {dashboardView === 'summary' && (
                            <>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-1.5 md:gap-4 mb-3 md:mb-6">
                                    <div className="bg-black/30 rounded-lg md:rounded-xl p-1.5 md:p-4"><div className="flex items-center gap-0.5 md:gap-1 mb-0 md:mb-1"><Coins size={10} className="md:w-5 md:h-5 text-yellow-400" /><p className="text-[8px] md:text-xs font-bold uppercase">Anggaran</p></div><p className="text-[10px] md:text-xl lg:text-2xl font-bold break-words">{formatCurrency(executiveSummary.totalAnggaran)}</p></div>
                                    <div className="bg-black/30 rounded-lg md:rounded-xl p-1.5 md:p-4"><div className="flex items-center gap-0.5 md:gap-1 mb-0 md:mb-1"><TrendingUp size={10} className="md:w-5 md:h-5 text-emerald-400" /><p className="text-[8px] md:text-xs font-bold uppercase">Realisasi</p></div><p className="text-[10px] md:text-xl lg:text-2xl font-bold text-emerald-300 break-words">{formatCurrency(executiveSummary.totalRealisasi)}</p><p className="hidden md:block text-[10px]">{executiveSummary.rataPenyerapan.toFixed(1)}%</p></div>
                                    <div className="bg-black/30 rounded-lg md:rounded-xl p-1.5 md:p-4"><div className="flex items-center gap-0.5 md:gap-1 mb-0 md:mb-1"><Gauge size={10} className="md:w-5 md:h-5 text-purple-400" /><p className="text-[8px] md:text-xs font-bold uppercase">Penyerapan</p></div><p className="text-[10px] md:text-xl lg:text-2xl font-bold text-purple-300">{executiveSummary.rataPenyerapan.toFixed(1)}%</p></div>
                                    <div className="bg-black/30 rounded-lg md:rounded-xl p-1.5 md:p-4 cursor-pointer hover:bg-black/40 transition-all" onClick={quickActionSelectCriticalRisks}><div className="flex items-center gap-0.5 md:gap-1 mb-0 md:mb-1"><AlertOctagon size={10} className="md:w-5 md:h-5 text-rose-400" /><p className="text-[8px] md:text-xs font-bold uppercase">Risiko</p></div><p className="text-[10px] md:text-xl lg:text-2xl font-bold text-rose-300">{executiveSummary.criticalRisk}</p><p className="hidden md:block text-[10px]">Klik filter</p></div>
                                    <div className="bg-black/30 rounded-lg md:rounded-xl p-1.5 md:p-4"><div className="flex items-center gap-0.5 md:gap-1 mb-0 md:mb-1"><Hash size={10} className="md:w-5 md:h-5 text-blue-400" /><p className="text-[8px] md:text-xs font-bold uppercase">Rekening</p></div><p className="text-[10px] md:text-xl lg:text-2xl font-bold text-blue-300">{executiveSummary.totalItems}</p></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 mb-3 md:mb-6">
                                    <div className="bg-white/10 rounded-lg md:rounded-xl p-2 md:p-4"><h4 className="text-[10px] md:text-sm font-bold mb-1 md:mb-2 flex items-center gap-1 md:gap-2"><FileText size={10} className="md:w-4 md:h-4" /> TOP REKENING</h4>{executiveSummary.topRekening.slice(0, 3).map((item, i) => <div key={i} className="flex justify-between text-[8px] md:text-xs py-0.5 md:py-1 border-b border-white/10"><span className="truncate">{i+1}. {item.nama.substring(0, 25)}</span><span className="font-bold">{((item.anggaran / executiveSummary.totalAnggaran) * 100).toFixed(1)}%</span></div>)}</div>
                                    <div className="bg-white/10 rounded-lg md:rounded-xl p-2 md:p-4"><h4 className="text-[10px] md:text-sm font-bold mb-1 md:mb-2 flex items-center gap-1 md:gap-2"><AlertTriangle size={10} className="md:w-4 md:h-4 text-rose-400" /> RISIKO</h4>{executiveSummary.highRiskRekening.slice(0, 3).map((item, i) => <div key={i} className="flex justify-between text-[8px] md:text-xs py-0.5 md:py-1 border-b border-white/10"><span className="truncate">{i+1}. {item.nama.substring(0, 25)}</span><span className="font-bold text-rose-300">{item.penyerapan.toFixed(1)}%</span></div>)}</div>
                                    <div className="bg-white/10 rounded-lg md:rounded-xl p-2 md:p-4"><h4 className="text-[10px] md:text-sm font-bold mb-1 md:mb-2 flex items-center gap-1 md:gap-2"><Award size={10} className="md:w-4 md:h-4 text-emerald-400" /> UNGGULAN</h4>{executiveSummary.highPerformerRekening.slice(0, 3).map((item, i) => <div key={i} className="flex justify-between text-[8px] md:text-xs py-0.5 md:py-1 border-b border-white/10"><span className="truncate">{i+1}. {item.nama.substring(0, 25)}</span><span className="font-bold text-emerald-300">{item.penyerapan.toFixed(1)}%</span></div>)}</div>
                                </div>
                            </>
                        )}

                        {dashboardView === 'risk' && (
                            <div className="space-y-2 md:space-y-4 mb-3 md:mb-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 md:gap-4 mb-2 md:mb-4">
                                    <div className="bg-black/30 rounded-lg md:rounded-xl p-2 md:p-4 text-center"><div className="text-sm md:text-3xl font-bold text-emerald-300">{executiveSummary.lowRisk}</div><p className="text-[8px] md:text-xs">Rendah (≥85%)</p></div>
                                    <div className="bg-black/30 rounded-lg md:rounded-xl p-2 md:p-4 text-center"><div className="text-sm md:text-3xl font-bold text-yellow-300">{executiveSummary.mediumRisk}</div><p className="text-[8px] md:text-xs">Sedang (50-84%)</p></div>
                                    <div className="bg-black/30 rounded-lg md:rounded-xl p-2 md:p-4 text-center"><div className="text-sm md:text-3xl font-bold text-orange-300">{executiveSummary.highRisk}</div><p className="text-[8px] md:text-xs">Tinggi (30-49%)</p></div>
                                    <div className="bg-black/30 rounded-lg md:rounded-xl p-2 md:p-4 text-center cursor-pointer hover:bg-black/40" onClick={quickActionSelectCriticalRisks}><div className="text-sm md:text-3xl font-bold text-rose-300">{executiveSummary.criticalRisk}</div><p className="text-[8px] md:text-xs">Kritis (&lt;30%)</p></div>
                                </div>
                                <div className="bg-white/10 rounded-lg md:rounded-xl p-2 md:p-4"><h4 className="text-[10px] md:text-sm font-bold mb-1 md:mb-2">Rekening Risiko Kritis</h4>{executiveSummary.highRiskRekening.map((item, i) => <div key={i} className="flex flex-wrap justify-between items-center text-[8px] md:text-sm py-1 md:py-2 border-b border-white/10"><span className="truncate flex-1">{i+1}. {item.nama.substring(0, 30)}</span><span className="text-rose-300 font-bold mx-2">{item.penyerapan.toFixed(1)}%</span><button onClick={() => handleRekeningClick(item.nama)} className="text-[8px] md:text-xs bg-white/20 px-1.5 md:px-2 py-0.5 rounded">Analisis</button></div>)}</div>
                            </div>
                        )}

                        {dashboardView === 'performance' && (
                            <div className="space-y-2 md:space-y-4 mb-3 md:mb-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                                    <div className="bg-white/10 rounded-lg md:rounded-xl p-2 md:p-4"><h4 className="text-[10px] md:text-sm font-bold mb-1 md:mb-2 flex items-center gap-1 md:gap-2"><PieChartIcon2 size={10} className="md:w-4 md:h-4" /> Distribusi</h4><div className="space-y-0.5 md:space-y-2"><div className="flex justify-between text-[8px] md:text-xs"><span>Operasi (5.1)</span><span className="font-bold">{((executiveSummary.belanjaOperasi / executiveSummary.totalAnggaran) * 100).toFixed(1)}%</span></div><div className="flex justify-between text-[8px] md:text-xs"><span>Modal (5.2)</span><span className="font-bold">{((executiveSummary.belanjaModal / executiveSummary.totalAnggaran) * 100).toFixed(1)}%</span></div><div className="flex justify-between text-[8px] md:text-xs"><span>Tak Terduga (5.3)</span><span className="font-bold">{((executiveSummary.belanjaTakTerduga / executiveSummary.totalAnggaran) * 100).toFixed(1)}%</span></div></div></div>
                                    <div className="bg-white/10 rounded-lg md:rounded-xl p-2 md:p-4"><h4 className="text-[10px] md:text-sm font-bold mb-1 md:mb-2 flex items-center gap-1 md:gap-2"><Lightbulb size={10} className="md:w-4 md:h-4" /> Rekomendasi</h4><ul className="space-y-0.5 md:space-y-1 text-[8px] md:text-xs">{executiveSummary.recommendations.slice(0, 3).map((rec, i) => <li key={i} className="flex items-start gap-0.5 md:gap-1"><span className="text-yellow-300">•</span><span>{rec}</span></li>)}</ul></div>
                                </div>
                                <div className="bg-white/10 rounded-lg md:rounded-xl p-2 md:p-4"><h4 className="text-[10px] md:text-sm font-bold mb-1 md:mb-2 flex items-center gap-1 md:gap-2"><TrendingUpIcon size={10} className="md:w-4 md:h-4" /> Unggulan</h4><div className="grid grid-cols-1 md:grid-cols-3 gap-1.5 md:gap-3">{executiveSummary.highPerformerRekening.map((item, i) => <div key={i} className="bg-white/5 rounded-lg p-1.5 md:p-2"><p className="font-bold text-[8px] md:text-xs truncate">{item.nama}</p><p className="text-emerald-300 font-bold text-[8px] md:text-sm">{item.penyerapan.toFixed(1)}%</p></div>)}</div></div>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-1.5 md:gap-3 pt-3 md:pt-6 border-t border-white/20">
                            <button onClick={quickActionFocusTopRekening} className="px-2 md:px-4 py-1 md:py-2.5 bg-white/20 rounded-lg md:rounded-xl text-[8px] md:text-sm font-medium hover:bg-white/30 flex items-center gap-0.5 md:gap-2"><Target size={10} className="md:w-3.5 md:h-3.5" /> Analisis</button>
                            <button onClick={quickActionFocusHighRisk} className="px-2 md:px-4 py-1 md:py-2.5 bg-rose-500/30 rounded-lg md:rounded-xl text-[8px] md:text-sm font-medium hover:bg-rose-500/40 flex items-center gap-0.5 md:gap-2"><AlertTriangle size={10} className="md:w-3.5 md:h-3.5" /> Risiko</button>
                            <button onClick={quickActionAddTopToChart} className="px-2 md:px-4 py-1 md:py-2.5 bg-emerald-500/30 rounded-lg md:rounded-xl text-[8px] md:text-sm font-medium hover:bg-emerald-500/40 flex items-center gap-0.5 md:gap-2"><BarChartIcon size={10} className="md:w-3.5 md:h-3.5" /> Chart</button>
                            <button onClick={quickActionSelectCriticalRisks} className="px-2 md:px-4 py-1 md:py-2.5 bg-red-500/30 rounded-lg md:rounded-xl text-[8px] md:text-sm font-medium hover:bg-red-500/40 flex items-center gap-0.5 md:gap-2"><ShieldAlert size={10} className="md:w-3.5 md:h-3.5" /> Pilih Risiko</button>
                            <button onClick={quickActionTriggerAI} className="px-2 md:px-4 py-1 md:py-2.5 bg-purple-500/30 rounded-lg md:rounded-xl text-[8px] md:text-sm font-medium hover:bg-purple-500/40 flex items-center gap-0.5 md:gap-2"><Brain size={10} className="md:w-3.5 md:h-3.5" /> AI</button>
                            {drillDownRekening && <button onClick={resetDrillDown} className="px-2 md:px-4 py-1 md:py-2.5 bg-gray-500/30 rounded-lg md:rounded-xl text-[8px] md:text-sm font-medium flex items-center gap-0.5 md:gap-2"><ZoomIn size={10} className="md:w-3.5 md:h-3.5" /> Reset</button>}
                        </div>
                    </div>
                </div>
            )}

            {!showExecutiveInfo && (
                <button onClick={() => setShowExecutiveInfo(true)} className="mb-4 md:mb-6 px-4 md:px-8 py-2 md:py-4 bg-gradient-to-r from-[#56238f] to-[#6a2fa8] text-white rounded-lg md:rounded-xl font-bold text-xs md:text-base flex items-center gap-2 shadow-xl hover:shadow-2xl transition-all">
                    <Eye size={14} className="md:w-5 md:h-5" /> TAMPILKAN DASHBOARD
                </button>
            )}

            <div className="relative">
                <div className="flex justify-end mb-2">
                    <button onClick={() => setShowAnalysis(!showAnalysis)} className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1 md:py-2 text-[10px] md:text-sm font-medium bg-white/50 rounded-lg md:rounded-xl hover:bg-white transition-all">
                        {showAnalysis ? <>🗂️ Sembunyikan AI</> : <>🤖 Tampilkan AI</>}
                    </button>
                </div>
                {showAnalysis && (
                    <GeminiAnalysis getAnalysisPrompt={getAnalysisPrompt} disabledCondition={rekeningStats.length === 0} theme={theme} interactivePlaceholder="Analisis belanja operasi dan modal..." userCanUseAi={userCanUseAi} allData={{ selectedSkpd, executiveSummary, drillDownRekening }} />
                )}
            </div>

            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl rounded-xl md:rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
                <div className="p-3 md:p-6 bg-gradient-to-r from-white/50 to-white/30 border-b">
                    <div className="flex items-center justify-between mb-3 md:mb-4 flex-wrap gap-2">
                        <h3 className="text-xs md:text-base font-black text-gray-800 flex items-center gap-1 md:gap-2"><div className="w-0.5 h-3 md:w-1 md:h-5 bg-gradient-to-b from-[#56238f] to-[#6a2fa8] rounded-full"></div>PANEL ANALISIS</h3>
                        <div className="flex gap-1 md:gap-2">
                            <button onClick={() => setShowChartPanel(!showChartPanel)} className={`flex items-center gap-0.5 md:gap-1 px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[9px] md:text-xs font-medium transition-all ${showChartPanel ? 'bg-[#56238f] text-white' : 'bg-[#56238f]/10 text-[#56238f]'}`}><BarChartIcon size={12} className="md:w-4 md:h-4" /> Chart ({chartRekenings.length})</button>
                            <button onClick={() => setShowSelectionPanel(!showSelectionPanel)} className="flex items-center gap-0.5 md:gap-1 px-2 md:px-3 py-1 md:py-1.5 bg-[#56238f]/10 text-[#56238f] rounded-lg text-[9px] md:text-xs font-medium"><CheckSquare size={12} className="md:w-4 md:h-4" /> Pilih</button>
                        </div>
                    </div>

                    {showSelectionPanel && (
                        <div className="mb-4 md:mb-5 p-2 md:p-4 bg-white/80 rounded-lg md:rounded-xl border border-gray-200">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2 md:mb-3">
                                <h4 className="font-bold text-gray-700 text-[10px] md:text-sm flex items-center gap-1 md:gap-2"><CheckSquare size={12} className="md:w-4 md:h-4" /> Pilih Rekening</h4>
                                <div className="flex flex-wrap gap-1 md:gap-2">
                                    <div className="relative"><Search size={10} className="absolute left-1.5 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Cari..." value={rekeningSearchTerm} onChange={(e) => setRekeningSearchTerm(e.target.value)} className="pl-6 pr-2 py-0.5 md:py-1 text-[9px] md:text-xs border rounded-lg w-32 md:w-48" /></div>
                                    <button onClick={handleSelectAll} className="px-1.5 md:px-3 py-0.5 md:py-1 text-[8px] md:text-xs bg-purple-100 rounded-lg">Semua</button>
                                    <button onClick={handleClearSelection} className="px-1.5 md:px-3 py-0.5 md:py-1 text-[8px] md:text-xs bg-gray-100 rounded-lg">Hapus</button>
                                </div>
                            </div>
                            <div className="max-h-32 md:max-h-48 overflow-y-auto border rounded-lg">
                                <div className="grid grid-cols-1 gap-0.5 p-1">
                                    {filteredRekeningForSelection.slice(0, 30).map(item => (
                                        <label key={item.rekening} className="flex items-center gap-1 p-1 hover:bg-gray-100 rounded cursor-pointer text-[8px] md:text-xs">
                                            <input type="checkbox" checked={selectedRekenings.includes(item.rekening)} onChange={() => handleSelectRekening(item.rekening)} className="rounded" />
                                            <span className="truncate flex-1">{item.rekening.length > 30 ? item.rekening.substring(0, 30) + '...' : item.rekening}</span>
                                            <span className="text-[7px] md:text-[10px] text-gray-400">{formatCurrency(item.totalAnggaran)}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="mt-1 md:mt-2 text-[8px] md:text-xs text-gray-500">Terpilih {selectedRekenings.length} rekening</div>
                        </div>
                    )}

                    {showChartPanel && (
                        <div className="mb-4 md:mb-5 p-2 md:p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg md:rounded-xl border border-purple-200">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2 md:mb-3">
                                <div className="flex items-center gap-1 md:gap-2"><BarChartIcon size={14} className="md:w-5 md:h-5 text-[#56238f]" /><h4 className="font-bold text-gray-800 text-[10px] md:text-sm">Chart Realisasi</h4><span className="text-[8px] md:text-xs bg-[#56238f] text-white px-1 md:px-2 py-0.5 rounded-full">{chartRekenings.length}</span></div>
                                <div className="flex gap-1 md:gap-2">
                                    <div className="flex bg-gray-200 rounded-lg p-0.5"><button onClick={() => setChartType('bar')} className={`px-1.5 md:px-2 py-0.5 text-[8px] md:text-xs rounded ${chartType === 'bar' ? 'bg-white shadow' : ''}`}>Bar</button><button onClick={() => setChartType('line')} className={`px-1.5 md:px-2 py-0.5 text-[8px] md:text-xs rounded ${chartType === 'line' ? 'bg-white shadow' : ''}`}>Line</button></div>
                                    {chartRekenings.length > 0 && <button onClick={clearChart} className="px-1.5 md:px-2 py-0.5 text-[8px] md:text-xs bg-red-100 text-red-600 rounded-lg">Clear</button>}
                                </div>
                            </div>
                            {chartRekenings.length > 0 && (
                                <div className="flex flex-wrap gap-1 md:gap-2 mb-2 md:mb-3">
                                    {chartRekenings.map((rek, idx) => (
                                        <div key={rek} className="flex items-center gap-0.5 md:gap-1 bg-white/80 rounded-full px-1.5 md:px-2 py-0.5 text-[8px] md:text-xs"><div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}></div><span className="truncate max-w-[80px] md:max-w-[150px]">{rek.length > 15 ? rek.substring(0, 15) + '...' : rek}</span><button onClick={() => removeFromChart(rek)} className="text-gray-400 hover:text-red-500">×</button></div>
                                    ))}
                                </div>
                            )}
                            {chartRekenings.length > 0 ? (
                                <div className="h-48 md:h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        {chartType === 'bar' ? (
                                            <BarChart data={getChartDataForRekenings}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                                <XAxis dataKey="bulan" tick={{ fontSize: 8 }} />
                                                <YAxis tickFormatter={(v) => formatCurrency(v).substring(0, 3) + (v >= 1000000000 ? 'M' : v >= 1000000 ? 'JT' : '')} />
                                                <Tooltip formatter={(v) => formatCurrency(v)} />
                                                {chartRekenings.map((rek, idx) => (<Bar key={rek} dataKey={rek} fill={CHART_COLORS[idx % CHART_COLORS.length]} name={rek.length > 20 ? rek.substring(0, 20) + '...' : rek} />))}
                                            </BarChart>
                                        ) : (
                                            <ComposedChart data={getChartDataForRekenings}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="bulan" tick={{ fontSize: 8 }} />
                                                <YAxis tickFormatter={(v) => formatCurrency(v).substring(0, 3) + (v >= 1000000000 ? 'M' : v >= 1000000 ? 'JT' : '')} />
                                                <Tooltip formatter={(v) => formatCurrency(v)} />
                                                {chartRekenings.map((rek, idx) => (<Line key={rek} type="monotone" dataKey={rek} stroke={CHART_COLORS[idx % CHART_COLORS.length]} name={rek.length > 20 ? rek.substring(0, 20) + '...' : rek} strokeWidth={2} dot={{ r: 2 }} />))}
                                            </ComposedChart>
                                        )}
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-32 md:h-48 flex items-center justify-center text-gray-400 text-[9px] md:text-sm bg-white/50 rounded-lg"><BarChartIcon size={20} className="md:w-8 md:h-8 mx-auto mb-1 opacity-50" /><p>Pilih rekening dari daftar</p></div>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-1.5 md:gap-3">
                        <div><label className="text-[8px] md:text-[10px] font-bold text-gray-500 uppercase">SKPD</label><select value={selectedSkpd} onChange={(e) => { setSelectedSkpd(e.target.value); handleClearSelection(); }} className="w-full px-1.5 md:px-3 py-1.5 md:py-2 text-[9px] md:text-sm bg-white/80 rounded-lg md:rounded-xl border border-gray-200"><option value="Semua SKPD">Semua</option>{skpdList.map(skpd => <option key={skpd} value={skpd}>{skpd}</option>)}</select></div>
                        <div><label className="text-[8px] md:text-[10px] font-bold text-gray-500 uppercase">Cari</label><input type="text" placeholder="Rekening..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-5 md:pl-8 pr-1.5 md:pr-3 py-1.5 md:py-2 text-[9px] md:text-sm bg-white/80 rounded-lg md:rounded-xl border border-gray-200" /></div>
                        <div><label className="text-[8px] md:text-[10px] font-bold text-gray-500 uppercase">Periode</label><div className="grid grid-cols-2 gap-0.5 md:gap-1"><select value={startMonth} onChange={e => setStartMonth(e.target.value)} className="px-1 md:px-2 py-1.5 md:py-2 text-[8px] md:text-xs bg-white/80 rounded-lg border">{months.map(m => <option key={m} value={m}>{m.substring(0,3)}</option>)}</select><select value={endMonth} onChange={e => setEndMonth(e.target.value)} className="px-1 md:px-2 py-1.5 md:py-2 text-[8px] md:text-xs bg-white/80 rounded-lg border">{months.map(m => <option key={m} value={m}>{m.substring(0,3)}</option>)}</select></div></div>
                        <div><label className="text-[8px] md:text-[10px] font-bold text-gray-500 uppercase">Urut</label><select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="w-full px-1.5 md:px-3 py-1.5 md:py-2 text-[9px] md:text-sm bg-white/80 rounded-lg md:rounded-xl border"><option value="realisasi-desc">Realisasi Tertinggi</option><option value="anggaran-desc">Anggaran Tertinggi</option><option value="persentase-desc">Penyerapan Tertinggi</option></select></div>
                        <div className="flex items-end gap-0.5 md:gap-1"><button onClick={handleDownloadExcel} disabled={sortedAndFilteredData.length === 0} className="flex-1 flex items-center justify-center gap-0.5 md:gap-1 px-1.5 md:px-3 py-1.5 md:py-2 text-[9px] md:text-sm bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg md:rounded-xl font-bold"><Download size={10} className="md:w-4 md:h-4" /> Excel</button>{selectedRekenings.length > 0 && <button onClick={handleClearSelection} className="px-2 md:px-3 py-1.5 md:py-2 bg-gray-200 rounded-lg md:rounded-xl"><Trash2 size={10} className="md:w-4 md:h-4" /></button>}</div>
                    </div>
                </div>

                <div id="rekening-table" className="p-2 md:p-5">
                    <div className="space-y-1.5 md:space-y-3">
                        {paginatedData.map(item => (
                            <div key={item.rekening} className={`border rounded-lg md:rounded-xl transition-all hover:shadow-md ${selectedRekenings.includes(item.rekening) ? 'border-[#56238f] bg-[#56238f]/5' : 'border-gray-200/50 bg-white/50'}`}>
                                <div className="p-2 md:p-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-center gap-0.5 md:gap-1.5 mb-0.5 md:mb-1">
                                                <input type="checkbox" checked={selectedRekenings.includes(item.rekening)} onChange={() => handleSelectRekening(item.rekening)} className="rounded w-3 h-3 md:w-4 md:h-4" />
                                                <span className="text-[8px] md:text-xs px-1 md:px-2 py-0.5 bg-purple-100 text-purple-700 rounded font-mono">{item.kodeRekening || 'N/A'}</span>
                                                {item.sumberDanaList.length > 0 && <span className="text-[8px] md:text-xs px-1 md:px-2 py-0.5 bg-indigo-100 rounded">{item.sumberDanaList.length} sumber</span>}
                                                <button onClick={() => addToChart(item.rekening)} className="text-[8px] md:text-xs px-1 md:px-2 py-0.5 bg-blue-100 text-blue-700 rounded">📊 Chart</button>
                                                <button onClick={() => handleRekeningClick(item.rekening)} className="text-[8px] md:text-xs px-1 md:px-2 py-0.5 bg-amber-100 text-amber-700 rounded">🔍 Analisis</button>
                                                {item.bestMonth && <span className="text-[8px] md:text-xs px-1 md:px-2 py-0.5 bg-green-100 text-green-700 rounded flex items-center gap-0.5"><CalendarDays size={8} className="md:w-3 md:h-3" /> {item.bestMonth}</span>}
                                            </div>
                                            <h4 className="font-bold text-gray-900 text-[10px] md:text-sm">{item.rekening.length > 50 ? item.rekening.substring(0, 50) + '...' : item.rekening}</h4>
                                        </div>
                                        <button onClick={() => toggleRincian(item.rekening)} className="p-0.5 md:p-1.5 bg-white/80 rounded-lg">{expandedRekening === item.rekening ? <ChevronUp size={12} className="md:w-4 md:h-4" /> : <ChevronDown size={12} className="md:w-4 md:h-4" />}</button>
                                    </div>
                                    
                                    <div className="mt-1.5 md:mt-3">
                                        <div className="flex justify-between text-[8px] md:text-[10px] text-gray-600 mb-0.5 md:mb-1">
                                            <span>Realisasi: <span className="font-bold text-emerald-600">{formatCurrency(item.totalRealisasi)}</span></span>
                                            <span>Pagu: <span className="font-bold text-indigo-600">{formatCurrency(item.totalAnggaran)}</span></span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3 md:h-5 overflow-hidden">
                                            <div className={`h-3 md:h-5 rounded-full flex items-center justify-end pr-1 md:pr-2 text-white text-[7px] md:text-[10px] font-bold ${item.persentase >= 85 ? 'bg-gradient-to-r from-emerald-500 to-green-500' : item.persentase >= 50 ? 'bg-gradient-to-r from-yellow-500 to-amber-500' : 'bg-gradient-to-r from-red-500 to-rose-500'}`} style={{ width: `${Math.min(item.persentase, 100)}%` }}>{item.persentase.toFixed(1)}%</div>
                                        </div>
                                        <div className="flex justify-between mt-0.5 md:mt-1 text-[7px] md:text-[10px]"><span className="text-gray-500">Sisa:</span><span className="font-bold text-amber-600">{formatCurrency(item.sisaAnggaran)}</span></div>
                                    </div>
                                </div>
                                
                                {expandedRekening === item.rekening && (
                                    <div className="border-t p-2 md:p-4 bg-gradient-to-b from-gray-50/50 to-white/50">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 text-[9px] md:text-sm">
                                            <div>
                                                <h5 className="font-bold text-gray-800 mb-1 md:mb-2 text-[9px] md:text-xs flex items-center gap-1"><Building2 size={10} className="md:w-4 md:h-4 text-purple-500" /> SKPD</h5>
                                                <div className="space-y-1 md:space-y-2 max-h-36 md:max-h-48 overflow-y-auto">
                                                    {item.skpdList.length > 0 ? item.skpdList.slice(0, 3).map(skpdDetail => (
                                                        <div key={skpdDetail.skpd} className="bg-white/60 rounded p-1 md:p-2 border">
                                                            <p className="font-bold text-[8px] md:text-xs mb-0.5 md:mb-1">{skpdDetail.skpd.length > 25 ? skpdDetail.skpd.substring(0, 25) + '...' : skpdDetail.skpd}</p>
                                                            <div className="grid grid-cols-3 gap-0.5 md:gap-1 text-[7px] md:text-[10px]">
                                                                <div><span className="text-gray-500">Anggaran:</span><p className="font-bold text-indigo-600">{formatCurrency(skpdDetail.anggaran)}</p></div>
                                                                <div><span className="text-gray-500">Realisasi:</span><p className="font-bold text-emerald-600">{formatCurrency(skpdDetail.realisasi)}</p></div>
                                                                <div><span className="text-gray-500">Penyerapan:</span><p className={`font-bold ${skpdDetail.persen >= 85 ? 'text-green-600' : skpdDetail.persen >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{skpdDetail.persen.toFixed(1)}%</p></div>
                                                            </div>
                                                        </div>
                                                    )) : <p className="text-gray-500 text-center py-1 text-[8px] md:text-xs">Tidak ada data</p>}
                                                </div>
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-gray-800 mb-1 md:mb-2 text-[9px] md:text-xs flex items-center gap-1"><Layers size={10} className="md:w-4 md:h-4 text-teal-500" /> Sub Kegiatan</h5>
                                                <div className="bg-white/60 rounded p-1 md:p-2 border max-h-36 md:max-h-48 overflow-y-auto">
                                                    {item.subKegiatanList.length > 0 ? (
                                                        <div className="space-y-1 md:space-y-2">
                                                            {item.subKegiatanList.slice(0, 3).map((sub, idx) => (
                                                                <div key={idx} className="border-b border-gray-100 pb-1 last:border-0">
                                                                    <p className="text-[8px] md:text-xs font-medium text-gray-800">{sub.nama.length > 50 ? sub.nama.substring(0, 50) + '...' : sub.nama}</p>
                                                                    <div className="grid grid-cols-3 gap-0.5 md:gap-1 mt-0.5 md:mt-1 text-[7px] md:text-[10px]">
                                                                        <div><span className="text-gray-500">Anggaran:</span><p className="font-bold text-indigo-600">{formatCurrency(sub.anggaran)}</p></div>
                                                                        <div><span className="text-gray-500">Realisasi:</span><p className="font-bold text-emerald-600">{formatCurrency(sub.realisasi)}</p></div>
                                                                        <div><span className="text-gray-500">Penyerapan:</span><p className={`font-bold ${sub.persen >= 85 ? 'text-green-600' : sub.persen >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{sub.persen.toFixed(1)}%</p></div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : <p className="text-gray-500 text-center py-1 text-[8px] md:text-xs">Tidak ada data</p>}
                                                </div>
                                                <div className="mt-1 md:mt-2 text-right">
                                                    <button onClick={() => addToChart(item.rekening)} className="text-[8px] md:text-xs px-1.5 md:px-3 py-0.5 md:py-1 bg-blue-500 text-white rounded-lg">+ Chart</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        
                        {sortedAndFilteredData.length === 0 && (
                            <div className="text-center py-8 md:py-12 bg-white/50 rounded-xl md:rounded-2xl"><Database className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-1 text-gray-400" /><p className="font-bold text-gray-600 text-xs md:text-sm">Tidak ada data rekening</p></div>
                        )}
                    </div>

                    {totalPages > 1 && <div className="mt-4 md:mt-6"><Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} theme={theme} /></div>}
                </div>

                {sortedAndFilteredData.length > 0 && (
                    <div className="px-2 md:px-5 py-1.5 md:py-3 bg-gradient-to-r from-gray-50/50 to-transparent border-t">
                        <div className="flex flex-wrap gap-2 md:gap-3 text-[7px] md:text-[10px]">
                            <span className="flex items-center gap-0.5 md:gap-1"><div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-[#56238f] rounded-full"></div>Total {sortedAndFilteredData.length} rekening</span>
                            <span className="flex items-center gap-0.5 md:gap-1"><div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-emerald-500 rounded-full"></div>Penyerapan: {executiveSummary?.rataPenyerapan.toFixed(1)}%</span>
                            <span className="flex items-center gap-0.5 md:gap-1"><div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-red-500 rounded-full"></div>Risiko: {executiveSummary?.criticalRisk}</span>
                            {chartRekenings.length > 0 && <span className="flex items-center gap-0.5 md:gap-1"><div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-blue-500 rounded-full"></div>Chart: {chartRekenings.length}</span>}
                        </div>
                    </div>
                )}
            </div>
            
            <style>{`@keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} } .animate-float { animation: float 6s ease-in-out infinite; }`}</style>
        </div>
    );
};

export default SkpdRekeningStatsView;