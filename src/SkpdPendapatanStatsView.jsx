import React from 'react';
import SectionTitle from './SectionTitle';
import GeminiAnalysis from './GeminiAnalysis';
import Pagination from './Pagination';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Line, Cell } from 'recharts';
import { Search, TrendingUp, TrendingDown, Target, DollarSign, Calendar, Filter, Download, Eye, EyeOff, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { formatCurrency } from './formatCurrency';

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
                            {formatCurrency(entry.value)}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

// --- UPDATED: SkpdPendapatanStatsView Component with Modern Design ---
const SkpdPendapatanStatsView = ({ data, theme, namaPemda, userRole, selectedYear }) => {
    const { pendapatan, realisasiPendapatan } = data;
    const [selectedSkpd, setSelectedSkpd] = React.useState('Semua SKPD');
    const [searchTerm, setSearchTerm] = React.useState(""); 
    const [currentPage, setCurrentPage] = React.useState(1);
    const [chartType, setChartType] = React.useState('bar'); // 'bar' atau 'composed'
    const [showProjection, setShowProjection] = React.useState(true);
    const [sortBy, setSortBy] = React.useState('target'); // 'target', 'realisasi', 'persentase'
    const [sortOrder, setSortOrder] = React.useState('desc');
    
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const [startMonth, setStartMonth] = React.useState(months[0]);
    const [endMonth, setEndMonth] = React.useState(months[months.length - 1]);
    const ITEMS_PER_PAGE = 10;
    
    const lastMonthWithData = React.useMemo(() => {
        if (!realisasiPendapatan) return months[0];
        for (let i = months.length - 1; i >= 0; i--) {
            if (realisasiPendapatan[months[i]] && realisasiPendapatan[months[i]].length > 0) {
                return months[i];
            }
        }
        return months[0];
    }, [realisasiPendapatan]);

    const [projectionMonth, setProjectionMonth] = React.useState(lastMonthWithData);

    React.useEffect(() => {
        setProjectionMonth(lastMonthWithData);
    }, [lastMonthWithData]);

    const skpdList = React.useMemo(() => {
        if (!pendapatan) return [];
        const skpds = new Set(pendapatan.map(item => item.NamaOPD).filter(Boolean));
        return Array.from(skpds).sort();
    }, [pendapatan]);

    const stats = React.useMemo(() => {
        if (!pendapatan || !realisasiPendapatan) return { chartData: [], tableData: [] };
        
        const startIndex = months.indexOf(startMonth);
        const endIndex = months.indexOf(endMonth);
        const selectedMonths = months.slice(startIndex, endIndex + 1);
        const allRealisasiForPeriod = selectedMonths.map(month => realisasiPendapatan[month] || []).flat();

        const dataToProcess = {
            pendapatan: selectedSkpd === 'Semua SKPD'
                ? pendapatan
                : pendapatan.filter(item => item.NamaOPD === selectedSkpd),
            realisasi: selectedSkpd === 'Semua SKPD'
                ? allRealisasiForPeriod
                : allRealisasiForPeriod.filter(item => item.SKPD === selectedSkpd),
        };

        const targetMap = new Map();
        dataToProcess.pendapatan.forEach(item => {
            const rekening = item.NamaAkun || 'Lain-lain';
            targetMap.set(rekening, (targetMap.get(rekening) || 0) + item.nilai);
        });

        const realisasiMap = new Map();
        dataToProcess.realisasi.forEach(item => {
            const rekening = item.NamaRekening || 'Lain-lain';
            realisasiMap.set(rekening, (realisasiMap.get(rekening) || 0) + item.nilai);
        });

        const allRekeningKeys = new Set([...targetMap.keys(), ...realisasiMap.keys()]);

        let combinedData = Array.from(allRekeningKeys).map(rekening => ({
            name: rekening.length > 30 ? rekening.substring(0, 30) + '...' : rekening,
            fullName: rekening,
            Target: targetMap.get(rekening) || 0,
            Realisasi: realisasiMap.get(rekening) || 0,
            persentase: targetMap.get(rekening) > 0 
                ? ((realisasiMap.get(rekening) || 0) / targetMap.get(rekening)) * 100 
                : 0
        }));
        
        // Filter pencarian
        if (searchTerm) {
            combinedData = combinedData.filter(item => 
                item.fullName.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        // Sorting
        combinedData.sort((a, b) => {
            let aVal, bVal;
            if (sortBy === 'target') { aVal = a.Target; bVal = b.Target; }
            else if (sortBy === 'realisasi') { aVal = a.Realisasi; bVal = b.Realisasi; }
            else { aVal = a.persentase; bVal = b.persentase; }
            
            return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
        });
        
        const chartData = combinedData.slice(0, 15);

        const tableData = combinedData.map(item => ({
            sumberPendapatan: item.fullName,
            totalTarget: item.Target,
            totalRealisasi: item.Realisasi,
            persentase: item.persentase,
            shortName: item.name
        }));

        return { chartData, tableData };
    }, [pendapatan, realisasiPendapatan, selectedSkpd, startMonth, endMonth, searchTerm, sortBy, sortOrder]);

    const projectionData = React.useMemo(() => {
        if (!pendapatan || !realisasiPendapatan) return null;
        
        let filteredPendapatan = selectedSkpd === 'Semua SKPD'
            ? pendapatan
            : pendapatan.filter(item => item.NamaOPD === selectedSkpd);
            
        if (searchTerm) {
            filteredPendapatan = filteredPendapatan.filter(item => 
                (item.NamaAkun || '').toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        const totalTarget = filteredPendapatan.reduce((sum, item) => sum + (item.nilai || 0), 0);
        
        const projectionMonthIndex = months.indexOf(projectionMonth);
        const monthsPassed = projectionMonthIndex + 1;
        const monthsRemaining = 12 - monthsPassed;
        const passedMonths = months.slice(0, monthsPassed);

        let relevantRealisasi = passedMonths
            .map(month => realisasiPendapatan[month] || [])
            .flat()
            .filter(item => selectedSkpd === 'Semua SKPD' || item.SKPD === selectedSkpd);
            
        if (searchTerm) {
            relevantRealisasi = relevantRealisasi.filter(item => 
                (item.NamaRekening || '').toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        const realisasiHinggaSaatIni = relevantRealisasi.reduce((sum, item) => sum + (item.nilai || 0), 0);
        const rataRataBulanan = monthsPassed > 0 ? realisasiHinggaSaatIni / monthsPassed : 0;
        const proyeksiSisaBulan = rataRataBulanan * monthsRemaining;
        const proyeksiAkhirTahun = realisasiHinggaSaatIni + proyeksiSisaBulan;
        const persenProyeksi = totalTarget > 0 ? (proyeksiAkhirTahun / totalTarget) * 100 : 0;
        
        // Kategori risiko proyeksi
        let riskCategory = 'aman';
        let riskColor = 'from-emerald-500 to-green-500';
        let riskIcon = <CheckCircle className="w-5 h-5 text-white" />;
        
        if (persenProyeksi < 70) {
            riskCategory = 'kritis';
            riskColor = 'from-rose-500 to-red-500';
            riskIcon = <AlertTriangle className="w-5 h-5 text-white" />;
        } else if (persenProyeksi < 85) {
            riskCategory = 'waspada';
            riskColor = 'from-amber-500 to-yellow-500';
            riskIcon = <Info className="w-5 h-5 text-white" />;
        }

        return { 
            totalTarget, 
            realisasiHinggaSaatIni, 
            proyeksiAkhirTahun, 
            persenProyeksi,
            monthsPassed,
            monthsRemaining,
            riskCategory,
            riskColor,
            riskIcon
        };

    }, [pendapatan, realisasiPendapatan, selectedSkpd, projectionMonth, searchTerm]);

    const totalPages = Math.ceil(stats.tableData.length / ITEMS_PER_PAGE);
    const paginatedData = stats.tableData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handlePageChange = (page) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page);
        }
    };
    
    React.useEffect(() => {
        setCurrentPage(1);
    }, [selectedSkpd, startMonth, endMonth, searchTerm, sortBy, sortOrder]);

    const handleSort = (type) => {
        if (sortBy === type) {
            setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
        } else {
            setSortBy(type);
            setSortOrder('desc');
        }
    };

    const getAnalysisPrompt = (customQuery) => {
        if (customQuery) {
            return `Berdasarkan data statistik pendapatan, berikan analisis untuk permintaan berikut: "${customQuery}"`;
        }
        
        const topSources = stats.tableData.slice(0, 5).map(s => {
            const persen = s.persentase.toFixed(2);
            const status = s.persentase >= 90 ? '✓' : s.persentase >= 70 ? '⚠️' : '🔴';
            return `- ${status} **${s.sumberPendapatan}**: Target ${formatCurrency(s.totalTarget)}, Realisasi ${formatCurrency(s.totalRealisasi)} (${persen}%)`;
        }).join('\n');
        
        const lowSources = stats.tableData.slice(-3).reverse().map(s => {
            const persen = s.persentase.toFixed(2);
            return `- **${s.sumberPendapatan}**: ${persen}%`;
        }).join('\n');
        
        const period = startMonth === endMonth ? startMonth : `periode ${startMonth} - ${endMonth}`;
        const filterContext = searchTerm ? `dengan filter kata kunci "${searchTerm}"` : '';
        
        return `
            Anda adalah seorang analis keuangan ahli untuk ${namaPemda || 'pemerintah daerah'} tahun ${selectedYear}. 
            Lakukan analisis terhadap kinerja pendapatan ${selectedSkpd === 'Semua SKPD' ? 'Daerah' : selectedSkpd} pada **${period}** ${filterContext}.
            
            ### RINGKASAN EKSEKUTIF
            - **Total Target Pendapatan**: ${formatCurrency(projectionData?.totalTarget || 0)}
            - **Realisasi s/d ${projectionMonth}**: ${formatCurrency(projectionData?.realisasiHinggaSaatIni || 0)}
            - **Proyeksi Akhir Tahun**: ${formatCurrency(projectionData?.proyeksiAkhirTahun || 0)} (${projectionData?.persenProyeksi.toFixed(2)}%)
            - **Bulan dengan Data**: ${projectionData?.monthsPassed || 0} bulan
            - **Sisa Bulan**: ${projectionData?.monthsRemaining || 0} bulan
            
            ### 5 SUMBER PENDAPATAN DENGAN NILAI TERTINGGI:
            ${topSources}
            
            ### SUMBER PENDAPATAN DENGAN KINERJA TERENDAH:
            ${lowSources}
            
            Berikan analisis mendalam mengenai:
            1.  **Kinerja Pencapaian Target**: Sumber pendapatan mana yang mencapai target dengan baik dan mana yang perlu perhatian khusus.
            2.  **Risiko Pendapatan**: Berdasarkan proyeksi, apakah ada risiko pendapatan tidak mencapai target? (${projectionData?.riskCategory === 'kritis' ? 'Risiko tinggi' : projectionData?.riskCategory === 'waspada' ? 'Perlu waspada' : 'Aman'})
            3.  **Rekomendasi Strategis**: Berikan 3 rekomendasi konkret untuk optimalisasi pendapatan di sisa tahun anggaran dan perencanaan tahun depan.
        `;
    };

    return (
        <div className="space-y-6">
            <SectionTitle>STATISTIK PENDAPATAN PER SKPD</SectionTitle>
            
            {/* Executive Dashboard */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-gray-900 dark:to-teal-900/20 border border-teal-100 dark:border-teal-800/50 shadow-[0_8px_32px_rgba(0,0,0,0.12)] mb-6">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-teal-400/10 to-emerald-400/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
                
                <div className="relative p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl shadow-lg">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Analisis Pendapatan Daerah</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {selectedSkpd === 'Semua SKPD' ? 'Seluruh SKPD/OPD' : selectedSkpd}
                                {searchTerm && ` • Filter: "${searchTerm}"`}
                            </p>
                        </div>
                    </div>
                    
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-xl border border-white/40 dark:border-gray-700/50 p-4">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Total Sumber Pendapatan</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.tableData.length}</p>
                        </div>
                        <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-xl border border-white/40 dark:border-gray-700/50 p-4">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Rata-rata Realisasi</p>
                            <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                                {stats.tableData.length > 0 
                                    ? (stats.tableData.reduce((sum, item) => sum + item.persentase, 0) / stats.tableData.length).toFixed(1) 
                                    : 0}%
                            </p>
                        </div>
                        <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-xl border border-white/40 dark:border-gray-700/50 p-4">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Total Target</p>
                            <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                                {formatCurrency(stats.tableData.reduce((sum, item) => sum + item.totalTarget, 0))}
                            </p>
                        </div>
                        <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-xl border border-white/40 dark:border-gray-700/50 p-4">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Total Realisasi</p>
                            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(stats.tableData.reduce((sum, item) => sum + item.totalRealisasi, 0))}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <GeminiAnalysis 
                getAnalysisPrompt={getAnalysisPrompt} 
                disabledCondition={stats.tableData.length === 0} 
                theme={theme}
                interactivePlaceholder="Analisis target pendapatan dari retribusi..."
                userRole={userRole}
            />

            {/* Projection Card dengan Glassmorphism */}
            {projectionData && showProjection && (
                <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700">
                    <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full bg-gradient-to-br ${projectionData.riskColor} opacity-10`}></div>
                    
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row justify-between items-start mb-4">
                            <div className="flex items-center gap-2">
                                <Target className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Proyeksi Pendapatan Akhir Tahun</h3>
                                {searchTerm && (
                                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full">
                                        Filter: "{searchTerm}"
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-2 md:mt-0">
                                <button
                                    onClick={() => setShowProjection(!showProjection)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    title={showProjection ? 'Sembunyikan' : 'Tampilkan'}
                                >
                                    {showProjection ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} className="text-gray-400" />
                                    <select
                                        value={projectionMonth}
                                        onChange={(e) => setProjectionMonth(e.target.value)}
                                        className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 bg-transparent focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    >
                                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Target Tahunan</p>
                                <p className="text-xl font-bold text-gray-800 dark:text-white">{formatCurrency(projectionData.totalTarget)}</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Realisasi s/d {projectionMonth}</p>
                                <p className="text-xl font-bold text-gray-800 dark:text-white">{formatCurrency(projectionData.realisasiHinggaSaatIni)}</p>
                                <p className="text-xs text-gray-400">{projectionData.monthsPassed} bulan</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Proyeksi Akhir Tahun</p>
                                <p className="text-xl font-bold text-teal-600 dark:text-teal-400">{formatCurrency(projectionData.proyeksiAkhirTahun)}</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Potensi Capaian</p>
                                <div className="flex items-center gap-2">
                                    <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">{projectionData.persenProyeksi.toFixed(1)}%</p>
                                    <div className={`px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${projectionData.riskColor} text-white`}>
                                        {projectionData.riskCategory === 'kritis' ? 'KRITIS' : 
                                         projectionData.riskCategory === 'waspada' ? 'WASPADA' : 'AMAN'}
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Sisa Bulan</p>
                                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{projectionData.monthsRemaining}</p>
                                </div>
                                <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${projectionData.riskColor} flex items-center justify-center shadow-lg`}>
                                    {projectionData.riskIcon}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                {/* Filter Section */}
                <div className="p-6 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">SKPD/OPD</label>
                            <select
                                value={selectedSkpd}
                                onChange={(e) => setSelectedSkpd(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                            >
                                <option value="Semua SKPD">🏢 Semua SKPD</option>
                                {skpdList.map(skpd => <option key={skpd} value={skpd}>{skpd}</option>)}
                            </select>
                        </div>

                        <div className="relative">
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Cari Sumber Pendapatan</label>
                            <input 
                                type="text" 
                                placeholder="Ketik kata kunci..." 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)} 
                                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" 
                            />
                            <Search className="absolute left-3 top-8 text-gray-400" size={16}/>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Dari Bulan</label>
                            <select value={startMonth} onChange={e => setStartMonth(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
                                {months.map(month => <option key={`start-${month}`} value={month}>{month}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Sampai Bulan</label>
                            <select value={endMonth} onChange={e => setEndMonth(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
                                {months.map(month => <option key={`end-${month}`} value={month}>{month}</option>)}
                            </select>
                        </div>

                        <div className="flex items-end gap-2">
                            <button
                                onClick={() => setChartType(chartType === 'bar' ? 'composed' : 'bar')}
                                className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-sm font-medium"
                            >
                                {chartType === 'bar' ? '📊 Bar Chart' : '📈 Composed Chart'}
                            </button>
                        </div>
                    </div>

                    {/* Sorting Buttons */}
                    <div className="flex flex-wrap gap-2 mt-4">
                        <button
                            onClick={() => handleSort('target')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                sortBy === 'target' 
                                    ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400' 
                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                            }`}
                        >
                            Target {sortBy === 'target' && (sortOrder === 'desc' ? '↓' : '↑')}
                        </button>
                        <button
                            onClick={() => handleSort('realisasi')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                sortBy === 'realisasi' 
                                    ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400' 
                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                            }`}
                        >
                            Realisasi {sortBy === 'realisasi' && (sortOrder === 'desc' ? '↓' : '↑')}
                        </button>
                        <button
                            onClick={() => handleSort('persentase')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                sortBy === 'persentase' 
                                    ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400' 
                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                            }`}
                        >
                            Persentase {sortBy === 'persentase' && (sortOrder === 'desc' ? '↓' : '↑')}
                        </button>
                    </div>
                </div>

                {/* Chart Section */}
                {stats.chartData.length > 0 && (
                    <div className="p-6 bg-gradient-to-br from-teal-50/30 to-transparent dark:from-teal-900/10">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-teal-500" />
                            Komposisi Pendapatan (Top 15)
                        </h3>
                        <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-xl p-4 border border-white/40 dark:border-gray-700/50">
                            <ResponsiveContainer width="100%" height={400}>
                                {chartType === 'bar' ? (
                                    <BarChart data={stats.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
                                        <defs>
                                            <linearGradient id="targetGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#6366F1" stopOpacity={0.8}/>
                                                <stop offset="100%" stopColor="#818CF8" stopOpacity={0.8}/>
                                            </linearGradient>
                                            <linearGradient id="realisasiGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#10B981" stopOpacity={0.8}/>
                                                <stop offset="100%" stopColor="#34D399" stopOpacity={0.8}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.1)" />
                                        <XAxis 
                                            dataKey="name" 
                                            angle={-45} 
                                            textAnchor="end" 
                                            interval={0} 
                                            tick={{ fontSize: 10, fill: '#64748b' }}
                                            height={100}
                                        />
                                        <YAxis 
                                            tickFormatter={(val) => `${(val / 1e9).toFixed(1)}M`} 
                                            tick={{ fontSize: 11, fill: '#64748b' }}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend 
                                            verticalAlign="top" 
                                            height={36}
                                            iconType="circle"
                                        />
                                        <Bar dataKey="Target" fill="url(#targetGradient)" name="Target" radius={[4, 4, 0, 0]} barSize={20} />
                                        <Bar dataKey="Realisasi" fill="url(#realisasiGradient)" name="Realisasi" radius={[4, 4, 0, 0]} barSize={20} />
                                    </BarChart>
                                ) : (
                                    <ComposedChart data={stats.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
                                        <defs>
                                            <linearGradient id="composedTarget" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#6366F1" stopOpacity={0.8}/>
                                                <stop offset="100%" stopColor="#818CF8" stopOpacity={0.8}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.1)" />
                                        <XAxis 
                                            dataKey="name" 
                                            angle={-45} 
                                            textAnchor="end" 
                                            interval={0} 
                                            tick={{ fontSize: 10, fill: '#64748b' }}
                                            height={100}
                                        />
                                        <YAxis 
                                            yAxisId="left"
                                            tickFormatter={(val) => `${(val / 1e9).toFixed(1)}M`} 
                                            tick={{ fontSize: 11, fill: '#64748b' }}
                                        />
                                        <YAxis 
                                            yAxisId="right"
                                            orientation="right"
                                            domain={[0, 100]}
                                            tickFormatter={(val) => `${val}%`}
                                            tick={{ fontSize: 11, fill: '#64748b' }}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend verticalAlign="top" height={36} iconType="circle" />
                                        <Bar yAxisId="left" dataKey="Target" fill="url(#composedTarget)" name="Target" barSize={20} />
                                        <Bar yAxisId="left" dataKey="Realisasi" fill="#10B981" name="Realisasi" barSize={20} />
                                        <Line yAxisId="right" type="monotone" dataKey="persentase" stroke="#F59E0B" name="Persentase (%)" strokeWidth={3} dot={{ r: 4 }} />
                                    </ComposedChart>
                                )}
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Table Section */}
                <div className="p-6">
                    {stats.tableData.length > 0 ? (
                        <>
                            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-800">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sumber Pendapatan</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Target Tahunan</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Realisasi</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">%</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                                        {paginatedData.map((item, index) => (
                                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <td className="px-6 py-4 text-sm text-gray-800 dark:text-gray-200 max-w-md break-words">
                                                    {item.sumberPendapatan}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-right font-medium text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                                                    {formatCurrency(item.totalTarget)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-right font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                                    {formatCurrency(item.totalRealisasi)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-right whitespace-nowrap">
                                                    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                                                        item.persentase >= 90 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                        item.persentase >= 70 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                    }`}>
                                                        {item.persentase.toFixed(1)}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {totalPages > 1 && (
                                <div className="mt-6">
                                    <Pagination 
                                        currentPage={currentPage} 
                                        totalPages={totalPages} 
                                        onPageChange={handlePageChange} 
                                        theme={theme} 
                                    />
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                <Info className="w-10 h-10 text-gray-400" />
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 font-medium">
                                Tidak ada data pendapatan untuk ditampilkan
                            </p>
                            {searchTerm && (
                                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                                    Coba hapus filter pencarian "{searchTerm}"
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Notes */}
                <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                            Total {stats.tableData.length} sumber pendapatan
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                            Realisasi: {stats.tableData.length > 0 
                                ? (stats.tableData.reduce((sum, item) => sum + item.totalRealisasi, 0) / 
                                   stats.tableData.reduce((sum, item) => sum + item.totalTarget, 0) * 100).toFixed(1) 
                                : 0}%
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                            Periode: {startMonth} - {endMonth}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SkpdPendapatanStatsView;