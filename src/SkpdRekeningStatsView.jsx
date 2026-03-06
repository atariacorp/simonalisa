import React from 'react';
import SectionTitle from './SectionTitle';
import GeminiAnalysis from './GeminiAnalysis';
import Pagination from './Pagination';
import { ChevronDown, ChevronUp, Search, Download, TrendingUp, TrendingDown, Target, DollarSign, Info, AlertTriangle, CheckCircle, Eye, EyeOff, Filter, BarChart3, PieChart, Layers, FileText, HelpCircle } from 'lucide-react';
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

const SkpdRekeningStatsView = ({ data, theme, namaPemda, userCanUseAi, selectedYear }) => {
    const { anggaran, realisasi, realisasiNonRkud } = data;
    const [selectedSkpd, setSelectedSkpd] = React.useState('Semua SKPD');
    const [rekeningStats, setRekeningStats] = React.useState([]);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [sortOrder, setSortOrder] = React.useState('sisa-desc');
    const [currentPage, setCurrentPage] = React.useState(1);
    const [chartType, setChartType] = React.useState('bar'); // 'bar' atau 'composed'
    const [viewMode, setViewMode] = React.useState('card'); // 'card' atau 'table'
    const [showFilters, setShowFilters] = React.useState(true);
    const [showInfo, setShowInfo] = React.useState(true); // State untuk info panel
    
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const [startMonth, setStartMonth] = React.useState(months[0]);
    const [endMonth, setEndMonth] = React.useState(months[months.length - 1]);
    const ITEMS_PER_PAGE = 10;
    
    const [expandedRekening, setExpandedRekening] = React.useState(null);

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
        for (const month in realisasi) { combinedRealisasi[month] = (realisasi[month] || []).map(item => normalizeRealisasiItem(item, false)); }
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
                performanceCategory: persentase >= 80 ? 'high' : persentase >= 50 ? 'medium' : 'low'
            };
        });

        setRekeningStats(stats);
    }, [selectedSkpd, anggaran, realisasi, realisasiNonRkud, startMonth, endMonth]);
    
    // Statistik Ringkasan
    const summaryStats = React.useMemo(() => {
        const totalAnggaran = rekeningStats.reduce((sum, item) => sum + item.totalAnggaran, 0);
        const totalRealisasi = rekeningStats.reduce((sum, item) => sum + item.totalRealisasi, 0);
        const totalSisa = totalAnggaran - totalRealisasi;
        const rataPenyerapan = totalAnggaran > 0 ? (totalRealisasi / totalAnggaran) * 100 : 0;
        
        const highPerformer = rekeningStats.filter(item => item.persentase >= 80).length;
        const mediumPerformer = rekeningStats.filter(item => item.persentase >= 50 && item.persentase < 80).length;
        const lowPerformer = rekeningStats.filter(item => item.persentase < 50).length;
        
        const topSisa = [...rekeningStats].sort((a, b) => b.sisaAnggaran - a.sisaAnggaran).slice(0, 3);
        const topRealisasi = [...rekeningStats].sort((a, b) => b.totalRealisasi - a.totalRealisasi).slice(0, 3);
        
        return {
            totalAnggaran,
            totalRealisasi,
            totalSisa,
            rataPenyerapan,
            highPerformer,
            mediumPerformer,
            lowPerformer,
            topSisa,
            topRealisasi,
            totalItems: rekeningStats.length
        };
    }, [rekeningStats]);
    
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

    // Data untuk chart
    const chartData = React.useMemo(() => {
        return sortedAndFilteredData.slice(0, 15).map(item => ({
            name: item.rekening.length > 30 ? item.rekening.substring(0, 30) + '...' : item.rekening,
            fullName: item.rekening,
            Anggaran: item.totalAnggaran / 1e9, // Konversi ke Miliar
            Realisasi: item.totalRealisasi / 1e9,
            Persentase: item.persentase,
            Sisa: item.sisaAnggaran / 1e9
        }));
    }, [sortedAndFilteredData]);

    const totalPages = Math.ceil(sortedAndFilteredData.length / ITEMS_PER_PAGE);
    const paginatedData = sortedAndFilteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    
    const handlePageChange = (page) => {
        if (page > 0 && page <= totalPages) setCurrentPage(page);
    };
    
    React.useEffect(() => {
        setCurrentPage(1);
        setExpandedRekening(null);
    }, [searchTerm, selectedSkpd, startMonth, endMonth, sortOrder]);
    
    // --- Fitur Download Excel ---
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
                'Anggaran (Rp)': item.totalAnggaran,
                'Realisasi (Rp)': item.totalRealisasi,
                'Sisa Anggaran (Rp)': item.sisaAnggaran,
                'Penyerapan (%)': item.persentase.toFixed(2),
                'Kategori Kinerja': item.performanceCategory === 'high' ? 'Tinggi' : item.performanceCategory === 'medium' ? 'Sedang' : 'Rendah',
                'Jumlah SKPD': item.skpdList.length,
                'Jumlah Sumber Dana': item.sumberDanaList.length
            }));

            const worksheet = window.XLSX.utils.json_to_sheet(dataForExport);
            const workbook = window.XLSX.utils.book_new();
            window.XLSX.utils.book_append_sheet(workbook, worksheet, "Statistik Rekening");
            
            const fileName = `Statistik_Rekening_${selectedSkpd.replace(/ /g, "_")}_${selectedYear}.xlsx`;
            window.XLSX.writeFile(workbook, fileName);
        } catch (err) {
            console.error("Error creating Excel file:", err);
            alert("Gagal membuat file Excel.");
        }
    };

    const getAnalysisPrompt = (customQuery) => {
        if (customQuery) {
            return `Berdasarkan data rekening SKPD, berikan analisis untuk permintaan berikut: "${customQuery}"`;
        }
        
        const focus = selectedSkpd === 'Semua SKPD' ? 'keseluruhan APBD' : `SKPD: **${selectedSkpd}**`;
        const top5Sisa = sortedAndFilteredData.slice(0, 5).map(s => `- **${s.rekening}** (${s.kodeRekening}): Sisa ${formatCurrency(s.sisaAnggaran)} (${s.persentase.toFixed(2)}%)`).join('\n');
        const top5Realisasi = sortedAndFilteredData.sort((a,b) => b.totalRealisasi - a.totalRealisasi).slice(0, 3).map(s => `- **${s.rekening}**: Realisasi ${formatCurrency(s.totalRealisasi)}`).join('\n');
        const lowPerformers = sortedAndFilteredData.filter(s => s.persentase < 40 && s.totalAnggaran > 100000000).slice(0, 3).map(s => `- **${s.rekening}**: ${s.persentase.toFixed(2)}% (Sisa: ${formatCurrency(s.sisaAnggaran)})`).join('\n');
        
        const period = startMonth === endMonth ? startMonth : `periode ${startMonth} - ${endMonth}`;
        
        return `
            Sebagai analis keuangan senior untuk ${namaPemda || 'pemerintah daerah'} tahun ${selectedYear}, lakukan analisis mendalam terhadap kinerja penyerapan anggaran per rekening untuk **${focus}** pada **${period}**.
            
            ### RINGKASAN EKSEKUTIF
            - **Total Anggaran**: ${formatCurrency(summaryStats.totalAnggaran)}
            - **Total Realisasi**: ${formatCurrency(summaryStats.totalRealisasi)} (${summaryStats.rataPenyerapan.toFixed(2)}%)
            - **Total Sisa Anggaran**: ${formatCurrency(summaryStats.totalSisa)}
            - **Distribusi Kinerja**: 
                - Tinggi (≥80%): ${summaryStats.highPerformer} rekening
                - Sedang (50-79%): ${summaryStats.mediumPerformer} rekening
                - Rendah (<50%): ${summaryStats.lowPerformer} rekening
            
            ### 5 REKENING DENGAN SISA ANGGARAN TERBESAR
            ${top5Sisa}
            
            ### REKENING DENGAN PENYERAPAN RENDAH (<40%)
            ${lowPerformers || '- Tidak ada rekening dengan penyerapan rendah'}
            
            Berikan analisis mendalam mengenai:
            1.  **Identifikasi Masalah**: Mengapa rekening-rekening tertentu memiliki sisa anggaran besar? Apakah karena perencanaan, kendala pengadaan, atau faktor lainnya?
            2.  **Pola Belanja**: Apakah ada pola tertentu dalam rekening dengan realisasi tinggi? (misalnya belanja rutin vs belanja modal)
            3.  **Rekomendasi Strategis**: 
                - Tindakan jangka pendek untuk menekan sisa anggaran
                - Rekomendasi untuk perencanaan tahun depan
                - Rekening mana yang perlu mendapat perhatian khusus dari pimpinan
        `;
    };

    const toggleRincian = (rekening) => {
        setExpandedRekening(prev => (prev === rekening ? null : rekening));
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

    return (
        <div className="space-y-6">
            <SectionTitle>STATISTIK REKENING PER SKPD</SectionTitle>
            
            {/* INFO PANEL UNTUK PIMPINAN - FITUR BARU */}
            {showInfo && (
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-gray-800 dark:to-amber-900/20 border border-amber-200 dark:border-amber-800/50 shadow-lg mb-6">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-400/10 to-yellow-400/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                    
                    <div className="relative p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl shadow-lg shrink-0">
                                    <FileText className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                                        Informasi Eksekutif: Statistik Rekening Per SKPD
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl">
                                        Menu ini menyajikan analisis mendalam terhadap seluruh rekening belanja, baik untuk seluruh SKPD maupun per SKPD tertentu. 
                                        Pimpinan dapat memantau kinerja penyerapan anggaran per rekening, mengidentifikasi rekening dengan sisa anggaran terbesar, 
                                        serta melihat distribusi penggunaan rekening di berbagai SKPD dan sumber dana.
                                    </p>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                        <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-xl border border-white/40 p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Target className="w-4 h-4 text-indigo-600" />
                                                <span className="font-semibold text-sm">Apa yang bisa dipantau?</span>
                                            </div>
                                            <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                                                <li>• Realisasi per rekening vs pagu</li>
                                                <li>• Sisa anggaran per rekening</li>
                                                <li>• Distribusi rekening per SKPD</li>
                                                <li>• Sumber dana setiap rekening</li>
                                            </ul>
                                        </div>
                                        
                                        <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-xl border border-white/40 p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <TrendingUp className="w-4 h-4 text-emerald-600" />
                                                <span className="font-semibold text-sm">Indikator Kinerja</span>
                                            </div>
                                            <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                                                <li>• 🟢 Tinggi: ≥80% (Aman)</li>
                                                <li>• 🟡 Sedang: 50-79% (Perhatikan)</li>
                                                <li>• 🔴 Rendah: {'<'}50% (Intervensi)</li>
                                            </ul>
                                        </div>
                                        
                                        <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-xl border border-white/40 p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Download className="w-4 h-4 text-purple-600" />
                                                <span className="font-semibold text-sm">Fitur Unggulan</span>
                                            </div>
                                            <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                                                <li>• Filter multi-kriteria</li>
                                                <li>• Download Excel dengan metadata</li>
                                                <li>• Card view & Table view</li>
                                                <li>• Rincian per SKPD & sumber dana</li>
                                            </ul>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4 flex items-center gap-2 text-xs bg-white/40 dark:bg-gray-900/40 p-2 rounded-lg">
                                        <HelpCircle size={14} className="text-amber-600" />
                                        <span className="text-gray-700 dark:text-gray-300">
                                            <span className="font-bold">Tips Penggunaan:</span> Gunakan filter SKPD untuk fokus pada unit tertentu, 
                                            urutkan berdasarkan "Sisa Anggaran Tertinggi" untuk mengetahui rekening yang perlu percepatan realisasi, 
                                            dan klik baris rekening untuk melihat rincian per SKPD.
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowInfo(false)}
                                className="p-1 hover:bg-white/50 rounded-lg transition-colors"
                                title="Tutup panel informasi"
                            >
                                <EyeOff size={18} className="text-gray-500" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Tombol untuk menampilkan kembali info panel jika ditutup */}
            {!showInfo && (
                <button
                    onClick={() => setShowInfo(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors text-sm mb-4"
                >
                    <FileText size={16} />
                    Tampilkan Informasi Eksekutif
                </button>
            )}
            
            {/* Executive Dashboard */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-900 dark:to-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 shadow-[0_8px_32px_rgba(0,0,0,0.12)] mb-6">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-400/10 to-blue-400/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-emerald-400/10 to-teal-400/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
                
                <div className="relative p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl shadow-lg">
                            <Layers className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Analisis Rekening Belanja</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {selectedSkpd === 'Semua SKPD' ? 'Seluruh SKPD/OPD' : selectedSkpd}
                                {searchTerm && ` • Filter: "${searchTerm}"`}
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
                disabledCondition={rekeningStats.length === 0} 
                theme={theme} 
                interactivePlaceholder="Analisis rekening dengan sisa anggaran terbesar..." 
                userCanUseAi={userCanUseAi} 
            />
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                {/* Filter Section */}
                <div className="p-6 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                            <Filter size={16} />
                            {showFilters ? 'Sembunyikan Filter' : 'Tampilkan Filter'}
                        </button>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setViewMode('card')}
                                className={`p-2 rounded-lg transition-all ${
                                    viewMode === 'card' 
                                        ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' 
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
                                        ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' 
                                        : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                }`}
                                title="Table View"
                            >
                                <BarChart3 size={18} />
                            </button>
                            <button
                                onClick={() => setChartType(chartType === 'bar' ? 'composed' : 'bar')}
                                className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                title={chartType === 'bar' ? 'Tampilkan Composed Chart' : 'Tampilkan Bar Chart'}
                            >
                                {chartType === 'bar' ? <PieChart size={18} /> : <BarChart3 size={18} />}
                            </button>
                        </div>
                    </div>

                    {showFilters && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">SKPD/OPD</label>
                                <select value={selectedSkpd} onChange={(e) => setSelectedSkpd(e.target.value)} className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                    <option value="Semua SKPD">🏢 Semua SKPD</option>
                                    {skpdList.map(skpd => <option key={skpd} value={skpd}>{skpd}</option>)}
                                </select>
                            </div>
                            
                            <div className="relative">
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Cari Rekening</label>
                                <input type="text" placeholder="Nama/Kode Rekening..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                <Search className="absolute left-3 top-8 text-gray-400" size={16}/>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Dari Bulan</label>
                                <select value={startMonth} onChange={e => setStartMonth(e.target.value)} className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
                                    {months.map(month => <option key={`start-${month}`} value={month}>{month}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Sampai Bulan</label>
                                <select value={endMonth} onChange={e => setEndMonth(e.target.value)} className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
                                    {months.map(month => <option key={`end-${month}`} value={month}>{month}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Urutkan</label>
                                <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
                                    <option value="sisa-desc">Sisa Anggaran Tertinggi</option>
                                    <option value="sisa-asc">Sisa Anggaran Terendah</option>
                                    <option value="realisasi-desc">Realisasi Tertinggi</option>
                                    <option value="realisasi-asc">Realisasi Terendah</option>
                                    <option value="anggaran-desc">Anggaran Tertinggi</option>
                                    <option value="persentase-desc">Penyerapan Tertinggi</option>
                                    <option value="persentase-asc">Penyerapan Terendah</option>
                                    <option value="nama-asc">Nama Rekening (A-Z)</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Chart Section */}
                {chartData.length > 0 && (
                    <div className="p-6 bg-gradient-to-br from-indigo-50/30 to-transparent dark:from-indigo-900/10 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-indigo-500" />
                            Grafik Perbandingan Rekening (Top 15)
                        </h3>
                        <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-xl p-4 border border-white/40 dark:border-gray-700/50">
                            <ResponsiveContainer width="100%" height={400}>
                                {chartType === 'bar' ? (
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
                                        <YAxis yAxisId="left" tickFormatter={(val) => `${val}M`} tick={{ fontSize: 11 }} />
                                        <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tickFormatter={(val) => `${val}%`} tick={{ fontSize: 11 }} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                                        <Bar yAxisId="left" dataKey="Anggaran" fill="url(#anggaranGradient)" name="Anggaran (M)" barSize={20} />
                                        <Bar yAxisId="left" dataKey="Realisasi" fill="url(#realisasiGradient)" name="Realisasi (M)" barSize={20} />
                                    </BarChart>
                                ) : (
                                    <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
                                        <defs>
                                            <linearGradient id="composedAnggaran" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#6366F1" stopOpacity={0.8}/>
                                                <stop offset="100%" stopColor="#818CF8" stopOpacity={0.8}/>
                                            </linearGradient>
                                            <linearGradient id="composedSisa" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.8}/>
                                                <stop offset="100%" stopColor="#FBBF24" stopOpacity={0.8}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
                                        <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} height={80} tick={{ fontSize: 10 }} />
                                        <YAxis yAxisId="left" tickFormatter={(val) => `${val}M`} tick={{ fontSize: 11 }} />
                                        <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tickFormatter={(val) => `${val}%`} tick={{ fontSize: 11 }} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                                        <Bar yAxisId="left" dataKey="Anggaran" fill="url(#composedAnggaran)" name="Anggaran (M)" barSize={20} />
                                        <Bar yAxisId="left" dataKey="Sisa" fill="url(#composedSisa)" name="Sisa (M)" barSize={20} />
                                        <Line yAxisId="right" type="monotone" dataKey="Persentase" stroke="#EF4444" name="Penyerapan (%)" strokeWidth={3} dot={{ r: 4 }} />
                                    </ComposedChart>
                                )}
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Main Content - Cards or Table */}
                <div className="p-6">
                    {viewMode === 'card' ? (
                        /* Card View */
                        <div className="space-y-4">
                            {paginatedData.map(item => (
                                <div key={item.rekening} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-lg transition-all">
                                    {/* Header */}
                                    <div className="p-5">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h4 className="font-bold text-gray-800 dark:text-white">{item.rekening}</h4>
                                                    {getPerformanceBadge(item.persentase)}
                                                </div>
                                                <div className="flex flex-wrap gap-3 text-xs">
                                                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full font-mono">
                                                        {item.kodeRekening}
                                                    </span>
                                                    <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full">
                                                        {item.sumberDanaList.length} Sumber Dana
                                                    </span>
                                                    <span className="px-2 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full">
                                                        {item.skpdList.length} SKPD
                                                    </span>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => toggleRincian(item.rekening)} 
                                                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                {expandedRekening === item.rekening ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                            </button>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="mt-4">
                                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                                                <span>Realisasi: {formatCurrency(item.totalRealisasi)}</span>
                                                <span>Pagu: {formatCurrency(item.totalAnggaran)}</span>
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
                                            <div className="flex justify-between text-xs mt-2">
                                                <span className="text-emerald-600 dark:text-emerald-400">
                                                    <TrendingUp size={12} className="inline mr-1" />
                                                    Realisasi: {((item.totalRealisasi / item.totalAnggaran) * 100).toFixed(1)}%
                                                </span>
                                                <span className="text-orange-600 dark:text-orange-400">
                                                    <DollarSign size={12} className="inline mr-1" />
                                                    Sisa: {formatCurrency(item.sisaAnggaran)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {expandedRekening === item.rekening && (
                                        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-5">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Rincian per SKPD */}
                                                <div>
                                                    <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1">
                                                        <Layers size={16} className="text-indigo-500" />
                                                        Rincian per SKPD:
                                                    </h5>
                                                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                                        {item.skpdList.length > 0 ? (
                                                            item.skpdList.map(skpdDetail => (
                                                                <div key={skpdDetail.skpd} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                                                    <p className="font-bold text-gray-800 dark:text-gray-200 text-sm mb-2">{skpdDetail.skpd}</p>
                                                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                                                        <div>
                                                                            <p className="text-gray-500">Anggaran</p>
                                                                            <p className="font-semibold text-indigo-600">{formatCurrency(skpdDetail.anggaran)}</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-gray-500">Realisasi</p>
                                                                            <p className="font-semibold text-emerald-600">{formatCurrency(skpdDetail.realisasi)}</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-gray-500">Sisa</p>
                                                                            <p className="font-semibold text-orange-600">{formatCurrency(skpdDetail.sisa)}</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-gray-500">Penyerapan</p>
                                                                            <p className={`font-semibold ${
                                                                                skpdDetail.persen >= 80 ? 'text-emerald-600' :
                                                                                skpdDetail.persen >= 50 ? 'text-amber-600' : 'text-rose-600'
                                                                            }`}>
                                                                                {skpdDetail.persen.toFixed(1)}%
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <p className="text-gray-500 text-sm">Tidak ada data SKPD</p>
                                                        )}
                                                    </div>
                                                </div>

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
                                                                        <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                                                                        <span className="text-gray-700 dark:text-gray-300">{sd}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <p className="text-gray-500 text-sm">Tidak ada sumber dana teridentifikasi</p>
                                                        )}
                                                    </div>

                                                    {/* Quick Stats */}
                                                    <div className="mt-4 grid grid-cols-2 gap-3">
                                                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg">
                                                            <p className="text-xs text-indigo-600 dark:text-indigo-400">Total SKPD</p>
                                                            <p className="text-xl font-bold text-indigo-700 dark:text-indigo-300">{item.skpdList.length}</p>
                                                        </div>
                                                        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg">
                                                            <p className="text-xs text-emerald-600 dark:text-emerald-400">Rata-rata per SKPD</p>
                                                            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                                                                {formatCurrency(item.totalAnggaran / (item.skpdList.length || 1))}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* Table View */
                        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Kode Rekening</th>
                                        <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nama Rekening</th>
                                        <th className="px-4 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Anggaran</th>
                                        <th className="px-4 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Realisasi</th>
                                        <th className="px-4 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sisa</th>
                                        <th className="px-4 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">%</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                                    {paginatedData.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer" onClick={() => toggleRincian(item.rekening)}>
                                            <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">{item.kodeRekening}</td>
                                            <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200 max-w-md break-words">{item.rekening}</td>
                                            <td className="px-4 py-3 text-right font-medium text-indigo-600 dark:text-indigo-400 whitespace-nowrap">{formatCurrency(item.totalAnggaran)}</td>
                                            <td className="px-4 py-3 text-right font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{formatCurrency(item.totalRealisasi)}</td>
                                            <td className="px-4 py-3 text-right font-medium text-orange-600 dark:text-orange-400 whitespace-nowrap">{formatCurrency(item.sisaAnggaran)}</td>
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
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {sortedAndFilteredData.length === 0 && (
                        <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                <Info className="w-10 h-10 text-gray-400" />
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 font-medium">Tidak ada data rekening yang ditemukan</p>
                            {searchTerm && (
                                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Coba hapus filter pencarian "{searchTerm}"</p>
                            )}
                        </div>
                    )}
                    
                    {totalPages > 1 && (
                        <div className="mt-6">
                            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} theme={theme} />
                        </div>
                    )}
                </div>

                {/* Download Button & Footer - PASTIKAN TOMBOL INI ADA */}
                <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                            Total {sortedAndFilteredData.length} rekening
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                            Realisasi: {summaryStats.rataPenyerapan.toFixed(1)}%
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                            Sisa: {formatCurrency(summaryStats.totalSisa)}
                        </span>
                    </div>
                    
                    {/* TOMBOL DOWNLOAD EXCEL - PASTIKAN INI ADA DAN TERLIHAT */}
                    <button 
                        onClick={handleDownloadExcel} 
                        disabled={sortedAndFilteredData.length === 0} 
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <Download size={18} />
                        Download Excel
                        <span className="ml-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                            {sortedAndFilteredData.length}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SkpdRekeningStatsView;