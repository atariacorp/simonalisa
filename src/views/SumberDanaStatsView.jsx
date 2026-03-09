import React from 'react';
import SectionTitle from './components/SectionTitle';
import GeminiAnalysis from './components/GeminiAnalysis';
import Pagination from './components/Pagination';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Download, Filter, TrendingUp, TrendingDown, DollarSign, Target, Info, AlertTriangle, CheckCircle, Eye, EyeOff, Layers } from 'lucide-react';
import { formatCurrency } from './utils/formatCurrency';

// Custom Tooltip dengan desain modern
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 min-w-[240px] z-50">
                <p className="font-bold text-gray-800 dark:text-gray-100 text-sm mb-3 border-b border-gray-100 dark:border-gray-800 pb-2 max-w-[250px] break-words">{label || payload[0].name}</p>
                {payload.map((entry, index) => (
                    <div key={`item-${index}`} className="flex justify-between items-center text-xs mb-2">
                        <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.payload?.fill }}></div>
                            {entry.name || 'Nilai'}
                        </span>
                        <span className="font-bold text-gray-800 dark:text-gray-200">
                            {entry.name?.toLowerCase().includes('persen') || entry.dataKey === 'penyerapan'
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

// --- UPDATED: SumberDanaStatsView dengan Glassmorphism Modern ---
const SumberDanaStatsView = ({ data, theme, namaPemda, userRole, selectedYear }) => {
    const { anggaran, realisasi, realisasiNonRkud } = data;
    
    const [selectedSkpd, setSelectedSkpd] = React.useState('Semua SKPD');
    const [selectedSubKegiatan, setSelectedSubKegiatan] = React.useState('Semua Sub Kegiatan');
    const [selectedSumberDana, setSelectedSumberDana] = React.useState('Semua Sumber Dana');
    const [selectedRekening, setSelectedRekening] = React.useState('Semua Rekening');
    
    const [statsData, setStatsData] = React.useState([]);
    const [currentPage, setCurrentPage] = React.useState(1);
    const [chartView, setChartView] = React.useState('pie'); // 'pie' atau 'bar'
    const [showSummary, setShowSummary] = React.useState(true);
    const [expandedRows, setExpandedRows] = React.useState(new Set());
    
    const ITEMS_PER_PAGE = 10;

    // Warna untuk visualisasi
    const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

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
                    anggaran: 0,
                    realisasi: 0,
                });
            }
            dataMap.get(key).anggaran += item.nilai || 0;
        });
        
        // 2. Map Realization (aggregated by SKPD + Rekening for robustness)
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
        return statsData.filter(item => {
            const skpdMatch = selectedSkpd === 'Semua SKPD' || item.skpd === selectedSkpd;
            const subKegiatanMatch = selectedSubKegiatan === 'Semua Sub Kegiatan' || item.subKegiatan === selectedSubKegiatan;
            const sumberDanaMatch = selectedSumberDana === 'Semua Sumber Dana' || item.sumberDana === selectedSumberDana;
            const rekeningMatch = selectedRekening === 'Semua Rekening' || item.rekening === selectedRekening;
            return skpdMatch && subKegiatanMatch && sumberDanaMatch && rekeningMatch;
        });
    }, [statsData, selectedSkpd, selectedSubKegiatan, selectedSumberDana, selectedRekening]);
    
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

    // Statistik Ringkasan
    const summaryStats = React.useMemo(() => {
        const totalAnggaran = filteredData.reduce((sum, item) => sum + item.anggaran, 0);
        const totalRealisasi = filteredData.reduce((sum, item) => sum + item.realisasi, 0);
        const totalSisa = totalAnggaran - totalRealisasi;
        const rataPenyerapan = totalAnggaran > 0 ? (totalRealisasi / totalAnggaran) * 100 : 0;
        
        const highPerformer = filteredData.filter(item => item.persentase >= 80).length;
        const mediumPerformer = filteredData.filter(item => item.persentase >= 50 && item.persentase < 80).length;
        const lowPerformer = filteredData.filter(item => item.persentase < 50).length;
        
        return {
            totalAnggaran,
            totalRealisasi,
            totalSisa,
            rataPenyerapan,
            highPerformer,
            mediumPerformer,
            lowPerformer,
            totalItems: filteredData.length
        };
    }, [filteredData]);

    // --- Pagination & Reset Effects ---
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const paginatedData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handlePageChange = (page) => {
        if (page > 0 && page <= totalPages) setCurrentPage(page);
    };
    
    React.useEffect(() => { 
        setSelectedSubKegiatan('Semua Sub Kegiatan'); 
        setSelectedSumberDana('Semua Sumber Dana'); 
        setSelectedRekening('Semua Rekening'); 
        setCurrentPage(1); 
    }, [selectedSkpd]);
    
    React.useEffect(() => { 
        setSelectedSumberDana('Semua Sumber Dana'); 
        setSelectedRekening('Semua Rekening'); 
        setCurrentPage(1); 
    }, [selectedSubKegiatan]);

    const toggleRow = (index) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(index)) {
            newExpanded.delete(index);
        } else {
            newExpanded.add(index);
        }
        setExpandedRows(newExpanded);
    };

    // --- Handlers ---
    const handleDownloadExcel = () => {
        if (!window.XLSX) { alert("Pustaka unduh Excel tidak tersedia."); return; }
        if (filteredData.length === 0) { alert("Tidak ada data untuk diunduh."); return; }

        const dataForExport = filteredData.map(item => ({
            'SKPD/OPD': item.skpd,
            'Sub Kegiatan': item.subKegiatan,
            'Sumber Dana': item.sumberDana,
            'Nama Rekening': item.rekening,
            'Anggaran (Rp)': item.anggaran,
            'Realisasi (Rp)': item.realisasi,
            'Sisa Anggaran (Rp)': item.sisaAnggaran,
            'Penyerapan (%)': item.persentase.toFixed(2),
            'Status': item.persentase >= 80 ? 'Tinggi' : item.persentase >= 50 ? 'Sedang' : 'Rendah'
        }));

        const worksheet = window.XLSX.utils.json_to_sheet(dataForExport);
        const workbook = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(workbook, worksheet, "Data Sumber Dana");
        
        const filename = `Statistik_Sumber_Dana_${selectedSkpd === 'Semua SKPD' ? 'Semua_SKPD' : selectedSkpd.substring(0,20)}_${selectedYear}.xlsx`;
        window.XLSX.writeFile(workbook, filename);
    };
    
    const getAnalysisPrompt = (customQuery) => {
        if (customQuery) return `Berdasarkan data, analisis: "${customQuery}"`;
        
        const focus = selectedSkpd === 'Semua SKPD' ? 'keseluruhan APBD' : `SKPD ${selectedSkpd}`;
        const subActivityFocus = selectedSubKegiatan !== 'Semua Sub Kegiatan' ? `pada Sub Kegiatan: "${selectedSubKegiatan}"` : '';
        
        // Find top performers
        const topPerformers = filteredData
            .filter(d => d.anggaran > 100000000)
            .sort((a, b) => b.persentase - a.persentase)
            .slice(0, 3)
            .map(d => `- **${d.subKegiatan}** (${d.sumberDana}): ${d.persentase.toFixed(1)}% (Rp ${formatCurrency(d.realisasi)} dari Rp ${formatCurrency(d.anggaran)})`)
            .join('\n');
        
        // Find low absorption items to highlight issues
        const issues = filteredData
            .filter(d => d.anggaran > 100000000 && d.persentase < 40)
            .slice(0, 3)
            .map(d => `- **${d.subKegiatan}** (${d.sumberDana}): ${d.persentase.toFixed(1)}% (Sisa: ${formatCurrency(d.sisaAnggaran)})`)
            .join('\n');

        return `
            Anda adalah seorang analis keuangan daerah ahli. Lakukan analisis mendalam mengenai efektivitas penggunaan Sumber Dana untuk **${focus}** ${subActivityFocus} pada tahun ${selectedYear}.
            
            ### RINGKASAN EKSEKUTIF
            - **Total Anggaran Terfilter**: ${formatCurrency(summaryStats.totalAnggaran)}
            - **Total Realisasi**: ${formatCurrency(summaryStats.totalRealisasi)} (${summaryStats.rataPenyerapan.toFixed(2)}%)
            - **Sisa Anggaran**: ${formatCurrency(summaryStats.totalSisa)}
            - **Distribusi Kinerja**: Tinggi (≥80%): ${summaryStats.highPerformer} | Sedang (50-79%): ${summaryStats.mediumPerformer} | Rendah (<50%): ${summaryStats.lowPerformer}
            
            ### KINERJA TERTINGGI
            ${topPerformers || '- Tidak ada data dengan anggaran > 100 Juta'}
            
            ### PERLU PERHATIAN (Penyerapan <40%)
            ${issues || '- Tidak ada data dengan penyerapan rendah'}
            
            Fokuskan analisis pada:
            1.  **Kesesuaian Alokasi**: Apakah alokasi sumber dana (DAU, DAK, dll) sudah sesuai dengan karakteristik sub kegiatan?
            2.  **Identifikasi Hambatan**: Analisis penyebab rendahnya penyerapan pada item-item yang perlu perhatian.
            3.  **Rekomendasi Strategis**: Berikan rekomendasi konkret untuk percepatan penyerapan sisa anggaran dan optimalisasi penggunaan sumber dana di masa mendatang.
        `;
    };

    return (
        <div className="space-y-6">
            <SectionTitle>STATISTIK SUMBER DANA PER SKPD & SUB KEGIATAN</SectionTitle>
            
            {/* Executive Dashboard */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-900/20 border border-purple-100 dark:border-purple-800/50 shadow-[0_8px_32px_rgba(0,0,0,0.12)] mb-6">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-indigo-400/10 to-blue-400/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
                
                <div className="relative p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                            <Layers className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Analisis Sumber Dana</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {selectedSkpd === 'Semua SKPD' ? 'Seluruh SKPD/OPD' : selectedSkpd}
                                {selectedSubKegiatan !== 'Semua Sub Kegiatan' && ` • ${selectedSubKegiatan.substring(0, 50)}...`}
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

            <GeminiAnalysis 
                getAnalysisPrompt={getAnalysisPrompt} 
                disabledCondition={statsData.length === 0} 
                theme={theme}
                interactivePlaceholder="Analisis penyerapan DAK pada kegiatan fisik..."
                userRole={userRole}
            />
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                {/* Filter Section */}
                <div className="p-6 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {/* SKPD Filter */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                                <Filter size={12} /> SKPD/OPD
                            </label>
                            <select value={selectedSkpd} onChange={(e) => setSelectedSkpd(e.target.value)} className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                                <option>🏢 Semua SKPD</option>
                                {skpdList.map(skpd => <option key={skpd} value={skpd}>{skpd}</option>)}
                            </select>
                        </div>

                        {/* Sub Kegiatan Filter */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Sub Kegiatan</label>
                            <select value={selectedSubKegiatan} onChange={(e) => setSelectedSubKegiatan(e.target.value)} className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                                <option>📋 Semua Sub Kegiatan</option>
                                {subKegiatanList.map(sub => <option key={sub} value={sub}>{sub.length > 40 ? sub.substring(0,40)+'...' : sub}</option>)}
                            </select>
                        </div>

                        {/* Sumber Dana Filter */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Sumber Dana</label>
                            <select value={selectedSumberDana} onChange={(e) => setSelectedSumberDana(e.target.value)} className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                                <option>💰 Semua Sumber Dana</option>
                                {sumberDanaList.map(dana => <option key={dana} value={dana}>{dana}</option>)}
                            </select>
                        </div>

                        {/* Rekening Filter */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Rekening</label>
                            <select value={selectedRekening} onChange={(e) => setSelectedRekening(e.target.value)} className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                                <option>📊 Semua Rekening</option>
                                {rekeningList.map(rek => <option key={rek} value={rek}>{rek.length > 30 ? rek.substring(0,30)+'...' : rek}</option>)}
                            </select>
                        </div>

                        {/* Download Button */}
                        <div className="flex items-end gap-2">
                            <button 
                                onClick={() => setShowSummary(!showSummary)} 
                                className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-sm flex items-center justify-center gap-1"
                                title={showSummary ? 'Sembunyikan Ringkasan' : 'Tampilkan Ringkasan'}
                            >
                                {showSummary ? <EyeOff size={16} /> : <Eye size={16} />}
                                Ringkasan
                            </button>
                            <button 
                                onClick={handleDownloadExcel} 
                                disabled={filteredData.length === 0} 
                                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                <Download size={16}/> Excel
                            </button>
                        </div>
                    </div>
                </div>

                {/* Summary Chart Section */}
                {showSummary && selectedSkpd !== 'Semua SKPD' && summaryBySumberDana.length > 0 && (
                    <div className="p-6 bg-gradient-to-br from-purple-50/30 to-transparent dark:from-purple-900/10 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-purple-500" />
                                Komposisi Sumber Dana: {selectedSkpd}
                            </h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setChartView('pie')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                        chartView === 'pie' 
                                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400' 
                                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                    }`}
                                >
                                    Pie Chart
                                </button>
                                <button
                                    onClick={() => setChartView('bar')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                        chartView === 'bar' 
                                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400' 
                                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                    }`}
                                >
                                    Bar Chart
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                            {/* Summary Table */}
                            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-xl border border-white/40 dark:border-gray-700/50 overflow-hidden">
                                <div className="max-h-[300px] overflow-y-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                                        <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400">Sumber Dana</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400">Anggaran</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400">Realisasi</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400">%</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {summaryBySumberDana.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                    <td className="px-4 py-2 text-gray-800 dark:text-gray-200">{item.name}</td>
                                                    <td className="px-4 py-2 text-right text-indigo-600 dark:text-indigo-400 font-medium">{formatCurrency(item.anggaran)}</td>
                                                    <td className="px-4 py-2 text-right text-emerald-600 dark:text-emerald-400 font-medium">{formatCurrency(item.realisasi)}</td>
                                                    <td className="px-4 py-2 text-right">
                                                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                                                            item.penyerapan >= 80 ? 'bg-green-100 text-green-700' :
                                                            item.penyerapan >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-red-100 text-red-700'
                                                        }`}>
                                                            {item.penyerapan.toFixed(1)}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Chart */}
                            <div className="h-[300px] bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-xl border border-white/40 dark:border-gray-700/50 p-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    {chartView === 'pie' ? (
                                        <PieChart>
                                            <Pie 
                                                data={summaryBySumberDana} 
                                                dataKey="anggaran" 
                                                nameKey="name" 
                                                cx="50%" 
                                                cy="50%" 
                                                outerRadius={100}
                                                label={({name, percent}) => `${(percent * 100).toFixed(0)}%`}
                                                labelLine={{ stroke: 'rgba(128,128,128,0.3)', strokeWidth: 1 }}
                                            >
                                                {summaryBySumberDana.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend wrapperStyle={{fontSize: '11px'}} />
                                        </PieChart>
                                    ) : (
                                        <BarChart data={summaryBySumberDana} layout="vertical" margin={{ left: 80 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(128,128,128,0.1)" />
                                            <XAxis type="number" tickFormatter={(val) => `${(val / 1e9).toFixed(1)}M`} />
                                            <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar dataKey="anggaran" fill="#6366F1" name="Anggaran" radius={[0, 4, 4, 0]} />
                                            <Bar dataKey="realisasi" fill="#10B981" name="Realisasi" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    )}
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Table */}
                <div className="p-6">
                    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">SKPD / Sub Kegiatan</th>
                                    <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sumber Dana</th>
                                    <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rekening</th>
                                    <th className="px-4 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Anggaran</th>
                                    <th className="px-4 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Realisasi</th>
                                    <th className="px-4 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sisa</th>
                                    <th className="px-4 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">%</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                                {paginatedData.map((item, index) => {
                                    const isExpanded = expandedRows.has(index);
                                    return (
                                        <React.Fragment key={index}>
                                            <tr 
                                                onClick={() => toggleRow(index)}
                                                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="font-semibold text-gray-900 dark:text-white">{item.skpd}</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-md break-words">
                                                        {isExpanded ? item.subKegiatan : item.subKegiatan.length > 60 ? item.subKegiatan.substring(0,60) + '...' : item.subKegiatan}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{item.sumberDana}</td>
                                                <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-xs break-words">{item.rekening}</td>
                                                <td className="px-4 py-3 text-right font-medium text-indigo-600 dark:text-indigo-400 whitespace-nowrap">{formatCurrency(item.anggaran)}</td>
                                                <td className="px-4 py-3 text-right font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{formatCurrency(item.realisasi)}</td>
                                                <td className="px-4 py-3 text-right font-bold text-orange-600 dark:text-orange-400 whitespace-nowrap">{formatCurrency(item.sisaAnggaran)}</td>
                                                <td className="px-4 py-3 text-right whitespace-nowrap">
                                                    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                                                        item.persentase >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                        item.persentase >= 50 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                    }`}>
                                                        {item.persentase.toFixed(1)}%
                                                    </span>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr className="bg-gray-50 dark:bg-gray-800/30">
                                                    <td colSpan="7" className="px-4 py-3">
                                                        <div className="text-sm">
                                                            <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Detail Sub Kegiatan:</p>
                                                            <p className="text-gray-600 dark:text-gray-400 break-words">{item.subKegiatan}</p>
                                                            <div className="mt-2 flex flex-wrap gap-4 text-xs">
                                                                <span className="flex items-center gap-1">
                                                                    <Target size={12} className="text-indigo-500" />
                                                                    Target: {formatCurrency(item.anggaran)}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <TrendingUp size={12} className="text-emerald-500" />
                                                                    Realisasi: {formatCurrency(item.realisasi)}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <AlertTriangle size={12} className="text-orange-500" />
                                                                    Sisa: {formatCurrency(item.sisaAnggaran)}
                                                                </span>
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
                                        <td colSpan="7" className="text-center py-12 text-gray-500">
                                            <div className="flex flex-col items-center gap-2">
                                                <Info className="w-8 h-8 text-gray-400" />
                                                <p>Tidak ada data yang cocok dengan filter yang dipilih.</p>
                                                <p className="text-sm text-gray-400">Coba ubah filter atau pilih SKPD lain</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {totalPages > 1 && (
                        <div className="mt-6">
                            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} theme={theme} />
                        </div>
                    )}
                </div>

                {/* Footer Notes */}
                <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                            Total {filteredData.length} item
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
                            Klik baris untuk detail sub kegiatan
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SumberDanaStatsView;
