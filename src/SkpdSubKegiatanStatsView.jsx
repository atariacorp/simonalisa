import React from 'react';
import SectionTitle from './SectionTitle';
import GeminiAnalysis from './GeminiAnalysis';
import Pagination from './Pagination';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Target, DollarSign, Info, AlertTriangle, CheckCircle, Download, Filter, Layers, BarChart3, PieChart, Eye, EyeOff } from 'lucide-react';
import { formatCurrency } from './formatCurrency';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Line, Cell } from 'recharts';

// Custom Tooltip dengan desain modern
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 min-w-[240px] z-50">
                <p className="font-bold text-gray-800 dark:text-gray-100 text-sm mb-3 border-b border-gray-100 dark:border-gray-800 pb-2 max-w-[250px] break-words">{label}</p>
                {payload.map((entry, index) => (
                    <div key={`item-${index}`} className="flex justify-between items-center text-xs mb-2">
                        <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                            {entry.name}
                        </span>
                        <span className="font-bold text-gray-800 dark:text-gray-200">
                            {entry.name?.toLowerCase().includes('persen') || entry.name?.toLowerCase().includes('penyerapan')
                                ? `${Number(entry.value).toFixed(1)}%`
                                : formatCurrency(entry.value)}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

// --- GANTI SELURUH KOMPONEN DI BAWAH INI DENGAN VERSI YANG SUDAH DISEMPURNAKAN ---
const SkpdSubKegiatanStatsView = ({ data, theme, namaPemda, userRole, userCanUseAi, selectedYear }) => {
    const { anggaran, realisasi, realisasiNonRkud } = data;
    const [selectedSkpd, setSelectedSkpd] = React.useState('');
    const [selectedSubUnit, setSelectedSubUnit] = React.useState('Semua Sub Unit');
    
    const [subKegiatanStats, setSubKegiatanStats] = React.useState([]);
    const [currentPage, setCurrentPage] = React.useState(1);
    const [expandedRows, setExpandedRows] = React.useState(new Set());
    const [chartType, setChartType] = React.useState('bar'); // 'bar' atau 'composed'
    const [viewMode, setViewMode] = React.useState('card'); // 'card' atau 'table'
    const [showFilters, setShowFilters] = React.useState(true);
    
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const [startMonth, setStartMonth] = React.useState(months[0]);
    const [endMonth, setEndMonth] = React.useState(months[months.length - 1]);
    const ITEMS_PER_PAGE = 10;

    // Warna untuk visualisasi
    const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

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

    // Statistik Ringkasan
    const summaryStats = React.useMemo(() => {
        if (subKegiatanStats.length === 0) return null;
        
        const totalAnggaran = subKegiatanStats.reduce((sum, item) => sum + item.totalAnggaran, 0);
        const totalRealisasi = subKegiatanStats.reduce((sum, item) => sum + item.totalRealisasi, 0);
        const totalSisa = totalAnggaran - totalRealisasi;
        const rataPenyerapan = totalAnggaran > 0 ? (totalRealisasi / totalAnggaran) * 100 : 0;
        
        const highPerformer = subKegiatanStats.filter(item => item.persentase >= 80).length;
        const mediumPerformer = subKegiatanStats.filter(item => item.persentase >= 50 && item.persentase < 80).length;
        const lowPerformer = subKegiatanStats.filter(item => item.persentase < 50).length;
        
        const totalRekening = subKegiatanStats.reduce((sum, item) => sum + item.rekenings.length, 0);
        const totalSumberDana = new Set(subKegiatanStats.flatMap(item => item.sumberDanaList)).size;
        
        const top5Sisa = [...subKegiatanStats].sort((a, b) => b.sisaAnggaran - a.sisaAnggaran).slice(0, 3);
        const lowPerformers = subKegiatanStats.filter(item => item.persentase < 40 && item.totalAnggaran > 100000000).slice(0, 3);
        
        return {
            totalAnggaran,
            totalRealisasi,
            totalSisa,
            rataPenyerapan,
            highPerformer,
            mediumPerformer,
            lowPerformer,
            totalRekening,
            totalSumberDana,
            totalItems: subKegiatanStats.length,
            top5Sisa,
            lowPerformers
        };
    }, [subKegiatanStats]);

    // Data untuk chart
    const chartData = React.useMemo(() => {
        return subKegiatanStats.slice(0, 15).map(item => ({
            name: item.subKegiatan.length > 30 ? item.subKegiatan.substring(0, 30) + '...' : item.subKegiatan,
            fullName: item.subKegiatan,
            Anggaran: item.totalAnggaran / 1e9,
            Realisasi: item.totalRealisasi / 1e9,
            Persentase: item.persentase,
            Sisa: item.sisaAnggaran / 1e9
        }));
    }, [subKegiatanStats]);

    const totalPages = Math.ceil(subKegiatanStats.length / ITEMS_PER_PAGE);
    const paginatedData = subKegiatanStats.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handlePageChange = (page) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const toggleRow = (subKegiatanKey) => {
        const newExpandedRows = new Set(expandedRows);
        if (newExpandedRows.has(subKegiatanKey)) {
            newExpandedRows.delete(subKegiatanKey);
        } else {
            newExpandedRows.add(subKegiatanKey);
        }
        setExpandedRows(newExpandedRows);
    };

    React.useEffect(() => {
        setCurrentPage(1);
        setExpandedRows(new Set());
        setSelectedSubUnit('Semua Sub Unit');
    }, [selectedSkpd, startMonth, endMonth]);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [selectedSubUnit]);

    // Fungsi untuk Download Excel
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
            
            const fileName = `Sub_Kegiatan_${selectedSkpd.replace(/ /g, "_")}_${selectedYear}.xlsx`;
            window.XLSX.writeFile(workbook, fileName);
        } catch (err) {
            console.error("Error creating Excel file:", err);
            alert("Gagal membuat file Excel.");
        }
    };

    // Fungsi untuk mendapatkan badge kinerja
    const getPerformanceBadge = (persentase) => {
        if (persentase >= 80) {
            return <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle size={12} /> Tinggi</span>;
        } else if (persentase >= 50) {
            return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full text-xs font-medium flex items-center gap-1"><Info size={12} /> Sedang</span>;
        } else {
            return <span className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full text-xs font-medium flex items-center gap-1"><AlertTriangle size={12} /> Rendah</span>;
        }
    };

    const getAnalysisPrompt = (customQuery) => {
        if (customQuery) {
            return `Berdasarkan data sub kegiatan SKPD, berikan analisis untuk permintaan berikut: "${customQuery}"`;
        }
        if (!selectedSkpd) return "Pilih SKPD untuk dianalisis.";
        
        const top5 = subKegiatanStats.slice(0, 5).map(s => `- **${s.subKegiatan}**: Pagu ${formatCurrency(s.totalAnggaran)}, Realisasi ${formatCurrency(s.totalRealisasi)} (${s.persentase.toFixed(2)}%) - Sisa ${formatCurrency(s.sisaAnggaran)}`).join('\n');
        const low5 = subKegiatanStats.filter(s => s.persentase < 40 && s.totalAnggaran > 100000000).slice(0, 3).map(s => `- **${s.subKegiatan}**: ${s.persentase.toFixed(2)}% (Sisa: ${formatCurrency(s.sisaAnggaran)})`).join('\n');
        const period = startMonth === endMonth ? startMonth : `periode ${startMonth} - ${endMonth}`;
        
        return `
            Sebagai analis keuangan senior untuk ${namaPemda || 'pemerintah daerah'} tahun ${selectedYear}, lakukan analisis mendalam terhadap kinerja penyerapan anggaran per Sub Kegiatan untuk SKPD: **${selectedSkpd}** pada **${period}**.
            
            ### RINGKASAN EKSEKUTIF
            - **Total Anggaran SKPD**: ${formatCurrency(summaryStats?.totalAnggaran || 0)}
            - **Total Realisasi**: ${formatCurrency(summaryStats?.totalRealisasi || 0)} (${summaryStats?.rataPenyerapan.toFixed(2)}%)
            - **Total Sisa Anggaran**: ${formatCurrency(summaryStats?.totalSisa || 0)}
            - **Distribusi Kinerja**: 
                - Tinggi (≥80%): ${summaryStats?.highPerformer || 0} sub kegiatan
                - Sedang (50-79%): ${summaryStats?.mediumPerformer || 0} sub kegiatan
                - Rendah (<50%): ${summaryStats?.lowPerformer || 0} sub kegiatan
            - **Total Rekening**: ${summaryStats?.totalRekening || 0} item
            - **Total Sumber Dana**: ${summaryStats?.totalSumberDana || 0} jenis
            
            ### 5 SUB KEGIATAN DENGAN ANGGARAN TERBESAR
            ${top5}
            
            ### SUB KEGIATAN DENGAN PENYERAPAN RENDAH (<40%)
            ${low5 || '- Tidak ada sub kegiatan dengan penyerapan rendah'}
            
            Berikan analisis mendalam mengenai:
            1.  **Identifikasi Masalah**: Mengapa sub kegiatan tertentu memiliki sisa anggaran besar? Apakah karena perencanaan, kendala teknis, atau faktor lainnya?
            2.  **Pola Belanja**: Apakah ada pola tertentu dalam sub kegiatan dengan realisasi tinggi? (misalnya kegiatan rutin vs kegiatan fisik)
            3.  **Rekomendasi Strategis Eksekutif**:
                - Tindakan jangka pendek untuk menekan sisa anggaran di sisa tahun
                - Rekomendasi untuk perencanaan tahun depan
                - Sub kegiatan mana yang perlu mendapat perhatian khusus dari pimpinan
                - Strategi optimalisasi sumber dana untuk kegiatan prioritas
        `;
    };

    return (
        <div className="space-y-6">
            <SectionTitle>STATISTIK SUB KEGIATAN & REKENING PER SKPD</SectionTitle>
            
            {/* Executive Dashboard - Hanya muncul jika SKPD dipilih */}
            {selectedSkpd && summaryStats && (
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-green-900/20 border border-green-100 dark:border-green-800/50 shadow-[0_8px_32px_rgba(0,0,0,0.12)] mb-6">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-green-400/10 to-emerald-400/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
                    
                    <div className="relative p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg">
                                <Layers className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Analisis Sub Kegiatan: {selectedSkpd}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {selectedSubUnit !== 'Semua Sub Unit' ? selectedSubUnit : 'Semua Sub Unit'}
                                </p>
                            </div>
                        </div>
                        
                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-xl border border-white/40 dark:border-gray-700/50 p-4">
                                <p className="text-xs text-gray-500 dark:text-gray-400">Total Anggaran</p>
                                <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(summaryStats.totalAnggaran)}</p>
                            </div>
                            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-xl border border-white/40 dark:border-gray-700/50 p-4">
                                <p className="text-xs text-gray-500 dark:text-gray-400">Total Realisasi</p>
                                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(summaryStats.totalRealisasi)}</p>
                            </div>
                            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-xl border border-white/40 dark:border-gray-700/50 p-4">
                                <p className="text-xs text-gray-500 dark:text-gray-400">Sisa Anggaran</p>
                                <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{formatCurrency(summaryStats.totalSisa)}</p>
                            </div>
                            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-xl border border-white/40 dark:border-gray-700/50 p-4">
                                <p className="text-xs text-gray-500 dark:text-gray-400">Rata-rata Penyerapan</p>
                                <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{summaryStats.rataPenyerapan.toFixed(1)}%</p>
                            </div>
                        </div>

                        {/* Performance Distribution */}
                        <div className="mt-4 flex flex-wrap gap-3">
                            <span className="flex items-center gap-1 px-3 py-1.5 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-full border border-white/20 text-xs">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                                Kinerja Tinggi: {summaryStats.highPerformer}
                            </span>
                            <span className="flex items-center gap-1 px-3 py-1.5 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-full border border-white/20 text-xs">
                                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                                Kinerja Sedang: {summaryStats.mediumPerformer}
                            </span>
                            <span className="flex items-center gap-1 px-3 py-1.5 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-full border border-white/20 text-xs">
                                <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
                                Kinerja Rendah: {summaryStats.lowPerformer}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            <GeminiAnalysis 
                getAnalysisPrompt={getAnalysisPrompt} 
                disabledCondition={!selectedSkpd || subKegiatanStats.length === 0} 
                theme={theme}
                interactivePlaceholder="Analisis sub kegiatan tentang pembangunan jalan..."
                userRole={userRole}
                userCanUseAi={userCanUseAi}
            />
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                {/* Filter Section */}
                <div className="p-6 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400 hover:underline"
                        >
                            <Filter size={16} />
                            {showFilters ? 'Sembunyikan Filter' : 'Tampilkan Filter'}
                        </button>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setViewMode('card')}
                                className={`p-2 rounded-lg transition-all ${
                                    viewMode === 'card' 
                                        ? 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400' 
                                        : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                }`}
                                title="Card View"
                            >
                                <Layers size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`p-2 rounded-lg transition-all ${
                                    viewMode === 'table' 
                                        ? 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400' 
                                        : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                }`}
                                title="Table View"
                            >
                                <BarChart3 size={18} />
                            </button>
                            {selectedSkpd && subKegiatanStats.length > 0 && (
                                <button
                                    onClick={handleDownloadExcel}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors text-sm"
                                >
                                    <Download size={16} />
                                    Excel
                                </button>
                            )}
                        </div>
                    </div>

                    {showFilters && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">SKPD/OPD</label>
                                <select
                                    value={selectedSkpd}
                                    onChange={(e) => setSelectedSkpd(e.target.value)}
                                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                >
                                    <option value="">🏢 Pilih SKPD</option>
                                    {skpdList.map(skpd => <option key={skpd} value={skpd}>{skpd}</option>)}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Sub Unit</label>
                                <select
                                    value={selectedSubUnit}
                                    onChange={(e) => setSelectedSubUnit(e.target.value)}
                                    disabled={!selectedSkpd || subUnitList.length === 0}
                                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                                >
                                    <option>📋 Semua Sub Unit</option>
                                    {subUnitList.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Dari</label>
                                    <select value={startMonth} onChange={e => setStartMonth(e.target.value)} className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
                                        {months.map(month => <option key={`start-${month}`} value={month}>{month.substring(0,3)}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Sampai</label>
                                    <select value={endMonth} onChange={e => setEndMonth(e.target.value)} className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
                                        {months.map(month => <option key={`end-${month}`} value={month}>{month.substring(0,3)}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Chart Section - Hanya muncul jika ada data */}
                {selectedSkpd && chartData.length > 0 && (
                    <div className="p-6 bg-gradient-to-br from-green-50/30 to-transparent dark:from-green-900/10 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-green-500" />
                            Grafik Perbandingan Sub Kegiatan (Top 15)
                        </h3>
                        <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-xl p-4 border border-white/40 dark:border-gray-700/50">
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
                                    <defs>
                                        <linearGradient id="anggaranGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#6366F1" stopOpacity={0.8}/>
                                            <stop offset="100%" stopColor="#818CF8" stopOpacity={0.8}/>
                                        </linearGradient>
                                        <linearGradient id="realisasiGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#10B981" stopOpacity={0.8}/>
                                            <stop offset="100%" stopColor="#34D399" stopOpacity={0.8}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} height={80} tick={{ fontSize: 10 }} />
                                    <YAxis tickFormatter={(val) => `${val}M`} tick={{ fontSize: 11 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                                    <Bar dataKey="Anggaran" fill="url(#anggaranGradient)" name="Anggaran (M)" barSize={20} />
                                    <Bar dataKey="Realisasi" fill="url(#realisasiGradient)" name="Realisasi (M)" barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <div className="p-6">
                    {selectedSkpd ? (
                        subKegiatanStats.length > 0 ? (
                            viewMode === 'card' ? (
                                /* Card View */
                                <div className="space-y-4">
                                    {paginatedData.map(item => {
                                        const subKegiatanKey = `${item.subKegiatan}-${item.kodeSubKegiatan}`;
                                        return (
                                            <div key={subKegiatanKey} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-lg transition-all">
                                                {/* Header */}
                                                <div onClick={() => toggleRow(subKegiatanKey)} className="p-5 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-700/50">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <h4 className="font-bold text-gray-800 dark:text-white">{item.subKegiatan}</h4>
                                                                {getPerformanceBadge(item.persentase)}
                                                            </div>
                                                            <div className="flex flex-wrap gap-2 text-xs">
                                                                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full font-mono">
                                                                    {item.kodeSubKegiatan}
                                                                </span>
                                                                <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full">
                                                                    {item.rekenings.length} Rekening
                                                                </span>
                                                                <span className="px-2 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full">
                                                                    {item.sumberDanaList.length} Sumber Dana
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-bold text-gray-800 dark:text-white">{formatCurrency(item.totalAnggaran)}</p>
                                                            <p className="text-xs text-gray-500">Total Anggaran</p>
                                                        </div>
                                                        <button className="ml-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                                                            {expandedRows.has(subKegiatanKey) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                        </button>
                                                    </div>

                                                    {/* Progress Bar */}
                                                    <div className="mt-4">
                                                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                                                            <span>Realisasi: {formatCurrency(item.totalRealisasi)}</span>
                                                            <span>Sisa: {formatCurrency(item.sisaAnggaran)}</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 relative overflow-hidden">
                                                            <div 
                                                                className={`h-4 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                                                                    item.persentase >= 80 ? 'bg-gradient-to-r from-emerald-500 to-green-500' :
                                                                    item.persentase >= 50 ? 'bg-gradient-to-r from-amber-500 to-yellow-500' :
                                                                    'bg-gradient-to-r from-rose-500 to-red-500'
                                                                }`} 
                                                                style={{ width: `${Math.min(item.persentase, 100)}%` }}
                                                            >
                                                                {item.persentase >= 20 && `${item.persentase.toFixed(1)}%`}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Expanded Details */}
                                                {expandedRows.has(subKegiatanKey) && (
                                                    <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-5">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                            {/* Sumber Dana */}
                                                            <div>
                                                                <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1">
                                                                    <DollarSign size={16} className="text-emerald-500" />
                                                                    Sumber Dana:
                                                                </h5>
                                                                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                                                                    {item.sumberDanaList.length > 0 ? (
                                                                        <ul className="space-y-2">
                                                                            {item.sumberDanaList.map(sd => (
                                                                                <li key={sd} className="flex items-center gap-2 text-sm">
                                                                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                                                                    <span className="text-gray-700 dark:text-gray-300">{sd}</span>
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    ) : (
                                                                        <p className="text-gray-500 text-sm">Tidak ada sumber dana</p>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Rincian Rekening */}
                                                            <div>
                                                                <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1">
                                                                    <Layers size={16} className="text-indigo-500" />
                                                                    Rincian Rekening:
                                                                </h5>
                                                                <div className="overflow-x-auto max-h-60 rounded-lg border border-gray-200 dark:border-gray-700">
                                                                    <table className="min-w-full">
                                                                        <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0">
                                                                            <tr>
                                                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Nama Rekening</th>
                                                                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Anggaran</th>
                                                                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Realisasi</th>
                                                                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">%</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                                            {item.rekenings.map(rek => (
                                                                                <tr key={rek.rekening} className="hover:bg-gray-100/50 dark:hover:bg-gray-800/50">
                                                                                    <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 max-w-xs break-words">{rek.rekening}</td>
                                                                                    <td className="px-3 py-2 text-right text-sm text-indigo-600 dark:text-indigo-400">{formatCurrency(rek.anggaran)}</td>
                                                                                    <td className="px-3 py-2 text-right text-sm text-emerald-600 dark:text-emerald-400">{formatCurrency(rek.realisasi)}</td>
                                                                                    <td className="px-3 py-2 text-right">
                                                                                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                                                                                            rek.persentase >= 80 ? 'bg-green-100 text-green-700' :
                                                                                            rek.persentase >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                                                                            'bg-red-100 text-red-700'
                                                                                        }`}>
                                                                                            {rek.persentase.toFixed(1)}%
                                                                                        </span>
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
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
                                /* Table View */
                                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                                        <thead className="bg-gray-50 dark:bg-gray-800">
                                            <tr>
                                                <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase">Kode</th>
                                                <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase">Sub Kegiatan</th>
                                                <th className="px-4 py-4 text-right text-xs font-bold text-gray-500 uppercase">Anggaran</th>
                                                <th className="px-4 py-4 text-right text-xs font-bold text-gray-500 uppercase">Realisasi</th>
                                                <th className="px-4 py-4 text-right text-xs font-bold text-gray-500 uppercase">Sisa</th>
                                                <th className="px-4 py-4 text-right text-xs font-bold text-gray-500 uppercase">%</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                                            {paginatedData.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer" onClick={() => toggleRow(`${item.subKegiatan}-${item.kodeSubKegiatan}`)}>
                                                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.kodeSubKegiatan}</td>
                                                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200 max-w-md break-words">{item.subKegiatan}</td>
                                                    <td className="px-4 py-3 text-right font-medium text-indigo-600 dark:text-indigo-400">{formatCurrency(item.totalAnggaran)}</td>
                                                    <td className="px-4 py-3 text-right font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(item.totalRealisasi)}</td>
                                                    <td className="px-4 py-3 text-right font-medium text-orange-600 dark:text-orange-400">{formatCurrency(item.sisaAnggaran)}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                                                            item.persentase >= 80 ? 'bg-green-100 text-green-700' :
                                                            item.persentase >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-red-100 text-red-700'
                                                        }`}>
                                                            {item.persentase.toFixed(1)}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )
                        ) : (
                            <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                    <Info className="w-10 h-10 text-gray-400" />
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 font-medium">Tidak ada data sub kegiatan untuk filter ini</p>
                            </div>
                        )
                    ) : (
                        <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                <Layers className="w-10 h-10 text-gray-400" />
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 font-medium">Silakan pilih SKPD untuk melihat statistik sub kegiatan</p>
                        </div>
                    )}
                    
                    {totalPages > 1 && (
                        <div className="mt-6">
                            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} theme={theme} />
                        </div>
                    )}
                </div>

                {/* Footer */}
                {selectedSkpd && summaryStats && (
                    <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                Total {subKegiatanStats.length} sub kegiatan
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                                Realisasi: {summaryStats.rataPenyerapan.toFixed(1)}%
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                                Sisa: {formatCurrency(summaryStats.totalSisa)}
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                Klik baris untuk detail rekening
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SkpdSubKegiatanStatsView;