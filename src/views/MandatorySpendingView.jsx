import React, { useState, useMemo, useEffect } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
    ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis, Cell, ComposedChart,
    LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
    Users, Building2, GraduationCap, AlertTriangle, CheckCircle, Info, 
    Bot, Sparkles, Loader2, RefreshCw, LayoutGrid, Lightbulb, Scale, 
    HardHat, BookOpen, Activity, Download, DollarSign, Target, Eye, EyeOff,
    Award, Crown, Briefcase, Zap, Gauge, Brain, Coins, Rocket, Medal, Trophy,
    ArrowUpRight, ArrowDownRight, Clock, Shield, AlertOctagon, TrendingUp,
    TrendingDown, PieChart as PieChartIcon, Sliders, Calculator, FileSpreadsheet,
    Printer, Save, X, Plus, Minus, Settings, BarChart3, LineChart as LineChartIcon,
    Search, ChevronUp, ChevronDown
} from 'lucide-react';

// ==============================================================================
// IMPORT FIREBASE
// ==============================================================================
import { collection, onSnapshot } from "firebase/firestore";
import { db } from '../utils/firebase'; 
import GeminiAnalysis from '../components/GeminiAnalysis';
import Pagination from '../components/Pagination';

// --- UTILITIES ---
const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value || 0);
};

const formatCompactCurrency = (value) => {
    if (value >= 1e12) return `${(value / 1e12).toFixed(2)} T`;
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)} M`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)} JT`;
    return formatCurrency(value);
};

// --- EXPORT TO EXCEL UTILITY ---
const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) return;
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => {
        return Object.values(obj).map(val => {
            let formattedVal = val;
            if (typeof val === 'string') {
                formattedVal = `"${val.replace(/"/g, '""')}"`;
            }
            return formattedVal;
        }).join(',');
    });
    
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// ==============================================================================
// KOMPONEN PIVOT TABLE BELANJA PEGAWAI PER SKPD
// ==============================================================================
const PivotTablePegawai = ({ data, totalAPBD, threshold, selectedYear, onExport }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'persentase', direction: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    
    if (!data || data.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/30 rounded-2xl">
                <Info size={32} className="mx-auto text-gray-400 mb-3" />
                <p className="text-gray-500">Belum ada data belanja pegawai per SKPD</p>
            </div>
        );
    }
    
    // Hitung persentase per SKPD
    const processedData = data.map(item => ({
        ...item,
        persentase: totalAPBD > 0 ? (item.totalBelanjaPegawai / totalAPBD) * 100 : 0,
        batasMaksimal: (threshold / 100) * totalAPBD,
        selisih: item.totalBelanjaPegawai - ((threshold / 100) * totalAPBD),
        status: item.totalBelanjaPegawai > ((threshold / 100) * totalAPBD) ? 'melebihi' : 'sesuai'
    })).sort((a, b) => b.totalBelanjaPegawai - a.totalBelanjaPegawai);
    
    // Filter berdasarkan pencarian
    const filteredData = processedData.filter(item =>
        item.NamaSKPD.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Sorting
    const sortedData = [...filteredData].sort((a, b) => {
        if (sortConfig.key === 'persentase') {
            return sortConfig.direction === 'desc' ? b.persentase - a.persentase : a.persentase - b.persentase;
        }
        if (sortConfig.key === 'totalBelanjaPegawai') {
            return sortConfig.direction === 'desc' ? b.totalBelanjaPegawai - a.totalBelanjaPegawai : a.totalBelanjaPegawai - b.totalBelanjaPegawai;
        }
        if (sortConfig.key === 'NamaSKPD') {
            return sortConfig.direction === 'desc' 
                ? b.NamaSKPD.localeCompare(a.NamaSKPD) 
                : a.NamaSKPD.localeCompare(b.NamaSKPD);
        }
        return 0;
    });
    
    // Pagination
    const totalPages = Math.ceil(sortedData.length / itemsPerPage);
    const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    
    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
        setCurrentPage(1);
    };
    
    const handleExport = () => {
        const exportData = processedData.map(item => ({
            'SKPD': item.NamaSKPD,
            'Total Belanja Pegawai': item.totalBelanjaPegawai,
            'Persentase terhadap APBD (%)': item.persentase.toFixed(2),
            'Batas Maksimal (30%)': item.batasMaksimal,
            'Status': item.status === 'melebihi' ? 'MELEBIHI BATAS' : 'SESUAI',
            'Nilai Kelebihan': item.selisih > 0 ? item.selisih : 0
        }));
        exportToCSV(exportData, `Pivot_Belanja_Pegawai_${selectedYear}`);
    };
    
    // Hitung total kelebihan
    const totalKelebihan = processedData.reduce((sum, item) => sum + (item.selisih > 0 ? item.selisih : 0), 0);
    
    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari SKPD..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white/80 dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:ring-2 focus:ring-indigo-500/50"
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors"
                    >
                        <Download size={16} /> Download Excel
                    </button>
                </div>
            </div>
            
            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
                <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-amber-800 dark:text-amber-300">Total Kelebihan Belanja Pegawai dari Batas 30%</span>
                    <span className="text-xl font-black text-red-600">{formatCurrency(totalKelebihan)}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: `${Math.min((totalKelebihan / totalAPBD) * 100, 100)}%` }}></div>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">
                    Total kelebihan ini perlu dikurangi agar belanja pegawai sesuai batas maksimal 30%
                </p>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                <table className="min-w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800/80">
                        <tr>
                            <th onClick={() => handleSort('NamaSKPD')} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600">
                                SKPD {sortConfig.key === 'NamaSKPD' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                            </th>
                            <th onClick={() => handleSort('totalBelanjaPegawai')} className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600">
                                Total Belanja Pegawai {sortConfig.key === 'totalBelanjaPegawai' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                            </th>
                            <th onClick={() => handleSort('persentase')} className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600">
                                % terhadap APBD {sortConfig.key === 'persentase' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Kelebihan (jika ada)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {paginatedData.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-200">
                                    {item.NamaSKPD}
                                 </td>
                                <td className="px-4 py-3 text-sm text-right font-bold text-indigo-600 dark:text-indigo-400">
                                    {formatCurrency(item.totalBelanjaPegawai)}
                                 </td>
                                <td className="px-4 py-3 text-sm text-right font-mono">
                                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                                        item.persentase > threshold ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                    }`}>
                                        {item.persentase.toFixed(2)}%
                                    </span>
                                 </td>
                                <td className="px-4 py-3 text-sm text-center">
                                    {item.status === 'melebihi' ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold">
                                            <AlertTriangle size={12} /> MELEBIHI
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold">
                                            <CheckCircle size={12} /> SESUAI
                                        </span>
                                    )}
                                 </td>
                                <td className="px-4 py-3 text-sm text-right font-bold text-red-600">
                                    {item.selisih > 0 ? formatCurrency(item.selisih) : '-'}
                                 </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {totalPages > 1 && (
                <div className="mt-4">
                    <Pagination 
                        currentPage={currentPage} 
                        totalPages={totalPages} 
                        onPageChange={setCurrentPage} 
                    />
                </div>
            )}
        </div>
    );
};

// ==============================================================================
// KOMPONEN TAB REKOMENDASI (APA YANG PERLU DIKURANGI/DITAMBAHKAN)
// ==============================================================================
const RekomendasiTab = ({ data, totalAPBD, threshold, selectedYear, type }) => {
    const [selectedLevel, setSelectedLevel] = useState('moderat');
    const [showSimulation, setShowSimulation] = useState(false);
    
    if (!data) return null;
    
    const currentPercentage = data.percentage;
    const currentNominal = type === 'pegawai' ? data.belanjaPegawaiUntukPerhitungan : 
                           type === 'infrastruktur' ? data.belanjaInfrastruktur : 
                           data.belanjaPendidikan;
    
    const targetNominal = (threshold / 100) * totalAPBD;
    const selisihNominal = targetNominal - currentNominal;
    const perluDitambah = selisihNominal > 0;
    const perluDikurangi = selisihNominal < 0;
    
    // Kategori belanja yang bisa dikurangi (untuk pegawai)
    const categoriesToReduce = [
        { name: 'Belanja Perjalanan Dinas', estimasi: totalAPBD * 0.02, prioritas: 'Rendah', rekomendasi: 'Efisiensi perjalanan dinas yang tidak prioritas' },
        { name: 'Belanja ATK dan Perlengkapan Kantor', estimasi: totalAPBD * 0.015, prioritas: 'Rendah', rekomendasi: 'Pengadaan terpusat dan digitalisasi' },
        { name: 'Belanja Pemeliharaan Rutin', estimasi: totalAPBD * 0.025, prioritas: 'Sedang', rekomendasi: 'Prioritaskan pemeliharaan yang mendesak' },
        { name: 'Belanja Honorarium Non-ASN', estimasi: totalAPBD * 0.02, prioritas: 'Sedang', rekomendasi: 'Optimalisasi penggunaan ASN' },
        { name: 'Belanja Jasa Konsultan', estimasi: totalAPBD * 0.01, prioritas: 'Rendah', rekomendasi: 'Gunakan tenaga ahli internal' },
        { name: 'Belanja Makanan dan Minuman', estimasi: totalAPBD * 0.008, prioritas: 'Rendah', rekomendasi: 'Efisiensi rapat dan kegiatan' },
        { name: 'Belanja Cetak dan Penggandaan', estimasi: totalAPBD * 0.005, prioritas: 'Rendah', rekomendasi: 'Digitalisasi dokumen' },
    ];
    
    // Kategori belanja yang bisa ditambah (untuk infrastruktur/pendidikan)
    const categoriesToAdd = [
        { name: 'Pembangunan Gedung Sekolah', estimasi: totalAPBD * 0.03, prioritas: 'Tinggi', rekomendasi: 'Prioritas pembangunan di daerah terpencil' },
        { name: 'Rehabilitasi Ruang Kelas', estimasi: totalAPBD * 0.02, prioritas: 'Tinggi', rekomendasi: 'Fokus pada kondisi darurat' },
        { name: 'Pengadaan Sarana Prasarana', estimasi: totalAPBD * 0.025, prioritas: 'Sedang', rekomendasi: 'Sesuaikan dengan kebutuhan' },
        { name: 'Peningkatan Jalan', estimasi: totalAPBD * 0.04, prioritas: 'Tinggi', rekomendasi: 'Prioritas jalan strategis' },
        { name: 'Pengembangan Infrastruktur', estimasi: totalAPBD * 0.035, prioritas: 'Sedang', rekomendasi: 'Dukung pertumbuhan ekonomi' },
    ];
    
    // Faktor level rekomendasi
    const levelFactor = {
        ekstrim: 1.3,
        moderat: 1.0,
        toleran: 0.7
    };
    
    const faktor = levelFactor[selectedLevel] || 1.0;
    const targetPenyesuaian = Math.abs(selisihNominal) * faktor;
    
    // Pilih kategori berdasarkan tipe
    const categories = type === 'pegawai' ? categoriesToReduce : categoriesToAdd;
    const needAction = type === 'pegawai' ? perluDikurangi : perluDitambah;
    
    // Hitung total estimasi dari kategori
    const totalEstimasi = categories.reduce((sum, cat) => sum + cat.estimasi, 0);
    
    // Filter kategori yang relevan dengan target penyesuaian
    let cumulative = 0;
    const recommendedCategories = categories.filter(cat => {
        if (cumulative >= targetPenyesuaian) return false;
        cumulative += cat.estimasi;
        return true;
    });
    
    return (
        <div className="space-y-6">
            {/* Level Selector */}
            <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-2xl">
                <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                    <Sliders size={18} className="text-indigo-600" />
                    Pilih Level Rekomendasi
                </h4>
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { id: 'ekstrim', label: '⚠️ EKSTRIM', desc: 'Penyesuaian agresif, dampak besar', color: 'red' },
                        { id: 'moderat', label: '⚖️ MODERAT', desc: 'Penyesuaian seimbang', color: 'blue' },
                        { id: 'toleran', label: '🛡️ TOLERAN', desc: 'Penyesuaian minimal', color: 'green' }
                    ].map(level => (
                        <button
                            key={level.id}
                            onClick={() => setSelectedLevel(level.id)}
                            className={`p-4 rounded-xl text-center transition-all ${
                                selectedLevel === level.id
                                    ? level.id === 'ekstrim' ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' :
                                      level.id === 'moderat' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' :
                                      'bg-green-500 text-white shadow-lg shadow-green-500/30'
                                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100'
                            }`}
                        >
                            <p className="text-sm font-bold">{level.label}</p>
                            <p className="text-[10px] mt-1 opacity-80">{level.desc}</p>
                        </button>
                    ))}
                </div>
            </div>
            
            {/* Status Kepatuhan */}
            <div className={`p-6 rounded-2xl ${needAction ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200' : 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200'}`}>
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Status Kepatuhan</p>
                        <p className={`text-2xl font-black ${needAction ? 'text-amber-700' : 'text-emerald-700'}`}>
                            {needAction 
                                ? (type === 'pegawai' ? '⚠️ MELEBIHI BATAS MAKSIMAL' : '📉 BELUM MENCAPAI BATAS MINIMAL')
                                : '✅ SESUAI KETENTUAN'}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                            {type === 'pegawai' 
                                ? `Belanja pegawai ${currentPercentage.toFixed(2)}% dari total APBD`
                                : `Alokasi ${type === 'infrastruktur' ? 'infrastruktur' : 'pendidikan'} ${currentPercentage.toFixed(2)}% dari total APBD`}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-medium text-gray-500">Target {type === 'pegawai' ? 'Maksimal' : 'Minimal'}</p>
                        <p className="text-3xl font-black text-indigo-600">{threshold}%</p>
                        <p className="text-sm text-gray-500">dari total APBD</p>
                    </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-800">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Selisih yang perlu {needAction ? (type === 'pegawai' ? 'dikurangi' : 'ditambah') : 'disesuaikan'}</span>
                        <span className={`text-xl font-black ${needAction ? 'text-amber-700' : 'text-emerald-700'}`}>
                            {formatCurrency(Math.abs(selisihNominal))}
                        </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                        <span className="text-sm font-medium">Target Penyesuaian ({selectedLevel.toUpperCase()})</span>
                        <span className="text-xl font-black text-blue-600">
                            {formatCurrency(targetPenyesuaian)}
                        </span>
                    </div>
                </div>
            </div>
            
            {/* Rekomendasi Spesifik */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-5 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700">
                    <h4 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        <Target size={18} className="text-indigo-600" />
                        {type === 'pegawai' 
                            ? 'Rekomendasi Belanja yang Perlu DIKURANGI' 
                            : `Rekomendasi Belanja yang Perlu DITAMBAHKAN untuk ${type === 'infrastruktur' ? 'Infrastruktur' : 'Pendidikan'}`}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                        Berdasarkan level {selectedLevel.toUpperCase()}, berikut adalah prioritas penyesuaian:
                    </p>
                </div>
                <div className="p-5 space-y-3">
                    {recommendedCategories.map((cat, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:shadow-md transition-all">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">
                                        {idx + 1}
                                    </span>
                                    <p className="font-semibold text-gray-800 dark:text-gray-200">{cat.name}</p>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                        cat.prioritas === 'Tinggi' ? 'bg-red-100 text-red-700' :
                                        cat.prioritas === 'Sedang' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-green-100 text-green-700'
                                    }`}>
                                        Prioritas {cat.prioritas}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 ml-8">{cat.rekomendasi}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-bold text-indigo-600">{formatCurrency(cat.estimasi)}</p>
                                <p className="text-xs text-gray-400">estimasi</p>
                            </div>
                        </div>
                    ))}
                    
                    {recommendedCategories.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            <CheckCircle size={32} className="mx-auto mb-2 text-green-500" />
                            <p>Tidak ada rekomendasi penyesuaian yang diperlukan</p>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Tombol Simulasi */}
            <button
                onClick={() => setShowSimulation(!showSimulation)}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:from-purple-700 hover:to-indigo-700 transition-all"
            >
                <Calculator size={18} />
                {showSimulation ? 'Sembunyikan Simulasi APBD' : 'Lihat Simulasi APBD What-If'}
            </button>
            
            {/* Simulasi APBD What-If */}
            {showSimulation && (
                <SimulasiAPBD 
                    totalAPBD={totalAPBD}
                    currentNominal={currentNominal}
                    targetNominal={targetNominal}
                    threshold={threshold}
                    type={type}
                    selectedYear={selectedYear}
                />
            )}
        </div>
    );
};

// ==============================================================================
// KOMPONEN SIMULASI APBD (WHAT-IF ANALYSIS)
// ==============================================================================
const SimulasiAPBD = ({ totalAPBD, currentNominal, targetNominal, threshold, type, selectedYear }) => {
    const [adjustmentPercentage, setAdjustmentPercentage] = useState(0);
    const [customAdjustment, setCustomAdjustment] = useState(0);
    
    const needIncrease = targetNominal > currentNominal;
    const selisih = Math.abs(targetNominal - currentNominal);
    
    const handlePercentageChange = (e) => {
        const val = parseFloat(e.target.value);
        setAdjustmentPercentage(val);
        setCustomAdjustment((val / 100) * totalAPBD);
    };
    
    const handleCustomChange = (e) => {
        const val = parseFloat(e.target.value) || 0;
        setCustomAdjustment(val);
        setAdjustmentPercentage((val / totalAPBD) * 100);
    };
    
    const newNominal = needIncrease 
        ? currentNominal + customAdjustment 
        : currentNominal - customAdjustment;
    const newPercentage = totalAPBD > 0 ? (newNominal / totalAPBD) * 100 : 0;
    const isCompliant = needIncrease 
        ? newPercentage >= threshold 
        : newPercentage <= threshold;
    
    // Dampak terhadap komponen lain
    const impactOnOtherSpending = customAdjustment;
    const newSilpa = totalAPBD - (currentNominal + (needIncrease ? customAdjustment : -customAdjustment));
    
    return (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-6 rounded-2xl border border-indigo-200 dark:border-indigo-800">
            <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <Calculator size={18} className="text-indigo-600" />
                Simulasi APBD What-If
            </h4>
            <p className="text-sm text-gray-600 mb-4">
                Sesuaikan nilai di bawah untuk melihat skenario pemenuhan mandatory spending
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Slider */}
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-2">
                            Penyesuaian (% dari total APBD)
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="10"
                            step="0.1"
                            value={adjustmentPercentage}
                            onChange={handlePercentageChange}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between mt-1 text-xs text-gray-500">
                            <span>0%</span>
                            <span>2.5%</span>
                            <span>5%</span>
                            <span>7.5%</span>
                            <span>10%</span>
                        </div>
                    </div>
                    
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-2">
                            Nilai Penyesuaian (Rp)
                        </label>
                        <input
                            type="number"
                            value={customAdjustment}
                            onChange={handleCustomChange}
                            className="w-full px-4 py-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-sm"
                        />
                    </div>
                </div>
                
                {/* Hasil Simulasi */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Alokasi {type === 'pegawai' ? 'Belanja Pegawai' : (type === 'infrastruktur' ? 'Infrastruktur' : 'Pendidikan')} Baru</span>
                        <span className="text-lg font-bold text-indigo-600">{formatCurrency(newNominal)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Persentase Baru</span>
                        <span className={`text-lg font-bold ${isCompliant ? 'text-green-600' : 'text-red-600'}`}>
                            {newPercentage.toFixed(2)}%
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Status Kepatuhan</span>
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${isCompliant ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {isCompliant ? '✅ MEMENUHI' : '❌ BELUM MEMENUHI'}
                        </span>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Dampak pada Belanja Lain</span>
                            <span className="text-md font-bold text-amber-600">{formatCurrency(impactOnOtherSpending)}</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                            <span className="text-sm text-gray-600">Estimasi SiLPA Baru</span>
                            <span className={`text-md font-bold ${newSilpa >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(newSilpa)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <p className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                    <Info size={14} className="shrink-0 mt-0.5" />
                    Simulasi ini bersifat ilustrasi. Keputusan final harus mempertimbangkan prioritas pembangunan daerah, kapasitas fiskal, dan regulasi terkait.
                </p>
            </div>
        </div>
    );
};

// ==============================================================================
// KOMPONEN REKOMENDASI CARD (MODAL)
// ==============================================================================
const RekomendasiCard = ({ data, type, onClose }) => {
    const [activeSubTab, setActiveSubTab] = useState('rekomendasi');
    
    if (!data) return null;
    
    const threshold = type === 'pegawai' ? 30 : type === 'infrastruktur' ? 40 : 20;
    const totalAPBD = data.totalAPBD;
    
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
                {/* Header */}
                <div className={`sticky top-0 z-10 p-6 bg-gradient-to-r ${
                    type === 'pegawai' ? 'from-red-600 to-orange-600' :
                    type === 'infrastruktur' ? 'from-blue-600 to-cyan-600' :
                    'from-emerald-600 to-teal-600'
                } text-white rounded-t-3xl`}>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white/20 rounded-2xl">
                                {type === 'pegawai' ? <Users size={28} /> : 
                                 type === 'infrastruktur' ? <HardHat size={28} /> : 
                                 <GraduationCap size={28} />}
                            </div>
                            <div>
                                <h3 className="text-2xl font-black tracking-tight">
                                    REKOMENDASI PEMENUHAN {type.toUpperCase()}
                                </h3>
                                <p className="text-white/80 text-sm mt-1">
                                    Analisis strategis penyesuaian APBD untuk memenuhi mandatory spending
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </div>
                
                {/* Tab Navigation */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
                    <button
                        onClick={() => setActiveSubTab('rekomendasi')}
                        className={`py-3 px-4 text-sm font-bold transition-all ${
                            activeSubTab === 'rekomendasi'
                                ? 'border-b-2 border-indigo-600 text-indigo-600'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Target size={16} className="inline mr-2" />
                        Rekomendasi
                    </button>
                    <button
                        onClick={() => setActiveSubTab('simulasi')}
                        className={`py-3 px-4 text-sm font-bold transition-all ${
                            activeSubTab === 'simulasi'
                                ? 'border-b-2 border-indigo-600 text-indigo-600'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Calculator size={16} className="inline mr-2" />
                        Simulasi APBD
                    </button>
                    {type === 'pegawai' && (
                        <button
                            onClick={() => setActiveSubTab('pivot')}
                            className={`py-3 px-4 text-sm font-bold transition-all ${
                                activeSubTab === 'pivot'
                                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <FileSpreadsheet size={16} className="inline mr-2" />
                            Pivot SKPD
                        </button>
                    )}
                </div>
                
                {/* Content */}
                <div className="p-6">
                    {activeSubTab === 'rekomendasi' && (
                        <RekomendasiTab 
                            data={data}
                            totalAPBD={totalAPBD}
                            threshold={threshold}
                            selectedYear={new Date().getFullYear()}
                            type={type}
                        />
                    )}
                    
                    {activeSubTab === 'simulasi' && (
                        <SimulasiAPBD 
                            totalAPBD={totalAPBD}
                            currentNominal={type === 'pegawai' ? data.belanjaPegawaiUntukPerhitungan : 
                                           type === 'infrastruktur' ? data.belanjaInfrastruktur : 
                                           data.belanjaPendidikan}
                            targetNominal={(threshold / 100) * totalAPBD}
                            threshold={threshold}
                            type={type}
                            selectedYear={new Date().getFullYear()}
                        />
                    )}
                    
                    {activeSubTab === 'pivot' && type === 'pegawai' && (
                        <PivotTablePegawai 
                            data={data.skpdDetails || []}
                            totalAPBD={totalAPBD}
                            threshold={threshold}
                            selectedYear={new Date().getFullYear()}
                        />
                    )}
                </div>
                
                {/* Footer */}
                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-b-3xl border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                            Tutup
                        </button>
                        <button
                            onClick={() => {
                                const exportData = {
                                    type,
                                    totalAPBD,
                                    currentPercentage: data.percentage,
                                    threshold,
                                    needAdjustment: type === 'pegawai' ? data.percentage > threshold : data.percentage < threshold
                                };
                                alert('Fitur download rekomendasi akan segera tersedia');
                            }}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
                        >
                            <Download size={18} /> Download Rekomendasi
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ==============================================================================
// KOMPONEN MODERN ANALYSIS CARD (YANG SUDAH ADA)
// ==============================================================================
const SectionTitle = ({ children }) => (
    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 border-b-2 border-indigo-500 pb-2 inline-block">
        {children}
    </h2>
);

const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 min-w-[240px] z-50">
                <p className="font-bold text-gray-800 dark:text-gray-100 text-sm mb-3 border-b border-gray-100 dark:border-gray-800 pb-2 max-w-[250px] break-words">{label}</p>
                {payload.map((entry, index) => (
                    <div key={`item-${index}`} className="flex flex-col mb-2 last:mb-0">
                        <div className="flex justify-between items-center text-xs mb-1 gap-4">
                            <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 font-medium">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                                {entry.name}
                            </span>
                            <span className="font-bold text-gray-800 dark:text-gray-200">
                                {entry.name.includes('%') || entry.name.toLowerCase().includes('penyerapan') 
                                    ? `${Number(entry.value).toFixed(2)}%` 
                                    : formatCurrency(entry.value)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const ModernAnalysisCard = ({ title, data, threshold, type, getAnalysisPrompt, namaPemda, selectedYear, userCanUseAi, regulationText }) => {
    const [showAnalysis, setShowAnalysis] = useState(true);
    
    let isCompliant = false;
    let colorClass = '';
    
    if (type === 'pegawai') {
        isCompliant = data.percentage <= threshold;
        colorClass = isCompliant ? '#10B981' : '#EF4444';
    } else {
        isCompliant = data.percentage >= threshold;
        colorClass = isCompliant ? '#10B981' : '#F59E0B';
    }

    const gaugeData = [{ name: title, value: data.percentage, fill: colorClass }];
    
    const topItems = [...(data.detailItems || [])]
        .sort((a, b) => b.pagu - a.pagu)
        .slice(0, 15)
        .map(item => ({
            ...item,
            chartName: item.NamaSubKegiatan?.length > 30 ? item.NamaSubKegiatan.substring(0, 30) + '...' : item.NamaSubKegiatan,
        }));

    const handleDownloadExcel = () => {
        if (!data.detailItems || data.detailItems.length === 0) return;
        
        const exportData = data.detailItems.map(item => ({
            'SKPD': item.NamaSKPD,
            'Sub Unit': item.NamaSubUnit,
            'Kode Sub Kegiatan': item.KodeSubKegiatan,
            'Nama Sub Kegiatan': item.NamaSubKegiatan,
            'Pagu Anggaran': item.pagu,
            'Realisasi': item.realisasi,
            'Sisa Anggaran': item.sisa,
            'Penyerapan (%)': item.persentase?.toFixed(2)
        }));

        exportToCSV(exportData, `Detail_${title}_${selectedYear}`);
    };

    return (
        <div className="animate-in fade-in duration-500 space-y-6">
            {/* Regulatory Alert Banner */}
            <div className="bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 p-5 rounded-2xl flex gap-4 items-start">
                <div className="bg-blue-100 dark:bg-blue-800/50 p-2 rounded-xl shrink-0">
                    <Scale className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                    <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-1">Landasan Regulasi</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {regulationText}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                {/* Metric Gauge */}
                <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col relative overflow-hidden h-full">
                    <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full -z-10 opacity-10`} style={{ background: `linear-gradient(to bottom right, transparent, ${colorClass})` }}></div>
                    
                    <div className="flex items-center justify-between gap-4 mb-6 flex-1">
                        <div className="flex-1">
                            <h3 className="font-black text-gray-800 dark:text-white text-lg leading-tight mb-1">{title}</h3>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Target: {type === 'pegawai' ? 'Maksimal' : 'Minimal'} {threshold}%</p>
                            <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold" style={{ backgroundColor: `${colorClass}15`, color: colorClass }}>
                                {isCompliant ? <CheckCircle size={14}/> : <AlertTriangle size={14}/>}
                                {isCompliant ? 'MEMENUHI' : 'BELUM MEMENUHI'}
                            </div>
                        </div>

                        <div className="w-24 h-24 md:w-28 md:h-28 shrink-0 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadialBarChart cx="50%" cy="50%" innerRadius="75%" outerRadius="100%" barSize={12} data={gaugeData} startAngle={90} endAngle={-270}>
                                    <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                                    <RadialBar background={{ fill: 'rgba(128, 128, 128, 0.1)' }} clockWise dataKey="value" cornerRadius={10} />
                                </RadialBarChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                                <p className="text-xl md:text-2xl font-black" style={{ color: colorClass }}>
                                    {data.percentage.toFixed(1)}%
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="w-full space-y-3 mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 font-medium">Total APBD</span>
                            <span className="font-bold text-gray-800 dark:text-gray-200">{formatCurrency(data.totalAPBD)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 font-medium">Alokasi Belanja</span>
                            <span className="font-black text-gray-800 dark:text-gray-200 text-base">
                                {formatCurrency(type === 'pegawai' ? data.belanjaPegawaiUntukPerhitungan : type === 'infrastruktur' ? data.belanjaInfrastruktur : data.belanjaPendidikan)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* AI Analysis Section */}
                <div className="lg:col-span-2 h-full">
                    <div className="relative h-full flex flex-col">
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
                        
                        {showAnalysis && data && data.totalAPBD > 0 && (
                            <div className="text-xs text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-2 bg-white/30 dark:bg-gray-800/30 p-2 rounded-lg">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                </span>
                                <span>{title} | Alokasi: {formatCurrency(data.totalAPBD)} | Capaian: {data.percentage?.toFixed(2)}%</span>
                            </div>
                        )}
                        
                        {showAnalysis && (
                            <GeminiAnalysis 
                                getAnalysisPrompt={(query) => getAnalysisPrompt(type, data, query, namaPemda, selectedYear)} 
                                disabledCondition={!data || data.totalAPBD === 0} 
                                userCanUseAi={userCanUseAi}
                                allData={{
                                    type,
                                    title,
                                    data,
                                    threshold,
                                    namaPemda,
                                    selectedYear
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Top 15 Bar Chart - Hanya untuk Infrastruktur/Pendidikan (karena pegawai tidak memiliki detailItems) */}
            {type !== 'pegawai' && topItems.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700">
                    <h3 className="text-xl font-black text-gray-800 dark:text-white mb-6 flex items-center gap-3 border-l-4 border-indigo-500 pl-4">
                        Distribusi Alokasi Tertinggi (Top 15)
                    </h3>
                    <div className="w-full">
                        <ResponsiveContainer width="99%" height={450}>
                            <ComposedChart data={topItems} layout="vertical" margin={{ top: 5, right: 30, left: 160, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(128, 128, 128, 0.15)" />
                                <XAxis type="number" tickFormatter={(val) => `${(val / 1e9).toFixed(0)}M`} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                                <YAxis type="category" dataKey="chartName" tick={{ fontSize: 11, fontWeight: 500, fill: '#475569', width: 150 }} interval={0} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} />
                                <Legend wrapperStyle={{ paddingTop: '20px', fontWeight: 600, color: '#475569' }} iconType="circle"/>
                                <Bar dataKey="pagu" fill="#6366F1" name="Pagu Anggaran" radius={[0, 6, 6, 0]} barSize={16} />
                                <Bar dataKey="realisasi" fill="#10B981" name="Realisasi" radius={[0, 6, 6, 0]} barSize={16} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Detail Section dengan Tombol Rekomendasi - TAMPIL UNTUK SEMUA TIPE */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                        {type === 'pegawai' ? 'Informasi Belanja Pegawai' : 'Rincian Sub Kegiatan'}
                    </h3>
                    <div className="flex gap-2">
                        {/* Tombol Download Excel - Hanya jika ada data detail */}
                        {data.detailItems && data.detailItems.length > 0 && (
                            <button 
                                onClick={handleDownloadExcel}
                                className="flex justify-center items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-400 px-4 py-2 rounded-xl transition-colors font-semibold text-sm"
                            >
                                <Download size={16} />
                                Download Excel
                            </button>
                        )}
                        
                        {/* Tombol Rekomendasi Pemenuhan - TAMPIL UNTUK SEMUA TIPE (termasuk Pegawai) */}
                        <button
                            onClick={() => {
                                if (window.openRekomendasiModal) {
                                    window.openRekomendasiModal(type);
                                }
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg"
                        >
                            <Target size={16} />
                            Rekomendasi Pemenuhan
                        </button>
                    </div>
                </div>
                
                {/* Konten Tabel atau Pesan Info */}
                {data.detailItems && data.detailItems.length > 0 ? (
                    <div className="overflow-x-auto max-h-[500px]">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 relative">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/4">SKPD / Sub Unit</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/3">Kode & Sub Kegiatan</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Pagu</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Realisasi</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Serapan</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700/50">
                                {data.detailItems.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="px-6 py-4 text-sm align-top">
                                            <p className="font-bold text-gray-900 dark:text-white mb-1 break-words">{item.NamaSKPD}</p>
                                            <p className="text-xs text-gray-500 break-words">{item.NamaSubUnit}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm align-top">
                                            <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] rounded font-mono mb-2">
                                                {item.KodeSubKegiatan}
                                            </span>
                                            <p className="font-medium text-gray-800 dark:text-gray-200 leading-snug break-words whitespace-normal">{item.NamaSubKegiatan}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right font-medium text-gray-600 dark:text-gray-300 align-top whitespace-nowrap">
                                            {formatCurrency(item.pagu)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right font-bold text-indigo-600 dark:text-indigo-400 align-top whitespace-nowrap">
                                            {formatCurrency(item.realisasi)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-center align-top whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
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
                ) : type === 'pegawai' ? (
                    <div className="p-8 text-center text-gray-500">
                        <Info size={32} className="mx-auto mb-3 text-gray-400" />
                        <p className="font-medium">Detail rincian belanja pegawai per sub kegiatan tidak tersedia.</p>
                        <p className="text-sm mt-1">Namun, Anda dapat melihat analisis per SKPD pada tab <strong>"Pivot SKPD"</strong> di modal rekomendasi.</p>
                        <button
                            onClick={() => {
                                if (window.openRekomendasiModal) {
                                    window.openRekomendasiModal(type);
                                }
                            }}
                            className="mt-3 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-200 transition-colors"
                        >
                            Buka Rekomendasi & Pivot SKPD
                        </button>
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-500">
                        <Info size={32} className="mx-auto mb-3 text-gray-400" />
                        <p>Tidak ada data rincian untuk ditampilkan</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// ==============================================================================
// MAIN COMPONENT
// ==============================================================================
const MandatorySpendingView = ({ data, theme, namaPemda, selectedYear, userCanUseAi }) => {
    const { anggaran, realisasi, realisasiNonRkud } = data; 
    const [activeTab, setActiveTab] = useState('pegawai');
    const [refPendidikan, setRefPendidikan] = useState([]);
    const [refInfrastruktur, setRefInfrastruktur] = useState([]);
    const [showExecutiveInfo, setShowExecutiveInfo] = useState(true);
    const [showRekomendasi, setShowRekomendasi] = useState(false);
    const [rekomendasiType, setRekomendasiType] = useState('pegawai');

    const bukaRekomendasi = (type) => {
        setRekomendasiType(type);
        setShowRekomendasi(true);
    };

    window.openRekomendasiModal = bukaRekomendasi;

    useEffect(() => {
        const unsubFunctions = [];
        const fetchData = (type, setter) => {
            try {
                if (typeof collection === 'function') {
                    const ref = collection(db, "publicData", String(selectedYear), `referensi-${type}`);
                    const unsubscribe = onSnapshot(ref, (snapshot) => {
                        let fetchedData = [];
                        snapshot.forEach(doc => {
                            if (Array.isArray(doc.data().rows)) {
                                fetchedData.push(...doc.data().rows);
                            }
                        });
                        setter(fetchedData);
                    }, (err) => {
                        console.error(`Error fetching ${type} reference:`, err);
                        setter([]);
                    });
                    unsubFunctions.push(unsubscribe);
                }
            } catch (e) {
                console.warn("Firebase collection tidak terinisialisasi.");
                setter([]);
            }
        };

        fetchData('pendidikan', setRefPendidikan);
        fetchData('infrastruktur', setRefInfrastruktur);

        return () => unsubFunctions.forEach(unsub => unsub && unsub());
    }, [selectedYear]);

    // =========================================================================
    // LOGIKA ORIGINAL UNTUK MANDATORY SPENDING
    // =========================================================================
    const analysisData = useMemo(() => {
        if (!anggaran || anggaran.length === 0) {
            return { pegawai: {}, infrastruktur: {}, pendidikan: {} };
        }

        const normalizeRealisasiItem = (item, isNonRkud = false) => {
             if (!item) return null;
             const kodeSubKegiatan = isNonRkud ? item.KODESUBKEGIATAN : item.KodeSubKegiatan;
             const kodeRekening = isNonRkud ? item.KODEREKENING : item.KodeRekening;
             const namaSkpd = isNonRkud ? item.NAMASKPD : item.NamaSKPD;
             const namaSubUnit = isNonRkud ? item.NAMASUBSKPD : item.NamaSubSKPD; 
             const namaSubKegiatan = isNonRkud ? item.NAMASUBKEGIATAN : item.NamaSubKegiatan; 

             if (!namaSkpd) return null; 

             return { 
                 KodeSubKegiatan: kodeSubKegiatan || 'Tidak Ada Kode', 
                 KodeRekening: kodeRekening || 'Tidak Ada Kode', 
                 NamaSKPD: namaSkpd, 
                 NamaSubUnit: namaSubUnit || 'Tidak Ada Sub Unit', 
                 NamaSubKegiatan: namaSubKegiatan || 'Tidak Ada Nama Sub Kegiatan', 
                 nilai: item.nilai || 0 
             };
        };
        
        const allRealisasi = [
            ...Object.values(realisasi || {}).flat().map(item => normalizeRealisasiItem(item, false)),
            ...Object.values(realisasiNonRkud || {}).flat().map(item => normalizeRealisasiItem(item, true))
        ].filter(Boolean);

        const pendidikanCodes = new Set(refPendidikan.map(item => String(item['KODE SUB KEGIATAN']).trim()));
        const infrastrukturNormalCodes = new Set();
        const infrastrukturXxxNames = new Set();
        refInfrastruktur.forEach(item => {
            const code = String(item['KODE SUB KEGIATAN']).trim();
            const name = String(item['NAMA SUB KEGIATAN']).toLowerCase().trim();
            if (code.toUpperCase().startsWith('X.XX')) {
                infrastrukturXxxNames.add(name);
            } else {
                infrastrukturNormalCodes.add(code);
            }
        });

        const isPendidikan = (item) => {
             if (!item) return false;
             const kodeSubKegiatan = String(item.KodeSubKegiatan || '').trim();
             const namaSkpd = String(item.NamaSKPD || '').trim();
             const specialEducationActivities = [
                'Penyediaan Gaji dan Tunjangan ASN',
                'Penyuluhan dan Penyebarluasan Kebijakan Retribusi Daerah',
                'Sosialisasi Peraturan Perundang-Undangan'
             ];
             const namaSubKegiatan = String(item.NamaSubKegiatan || ''); 
             return pendidikanCodes.has(kodeSubKegiatan) || (namaSkpd === 'Dinas Pendidikan dan Kebudayaan' && specialEducationActivities.includes(namaSubKegiatan));
        };
        
        const isInfrastruktur = (item) => {
             if (!item) return false;
             const kodeSubKegiatan = String(item.KodeSubKegiatan || '').trim();
             const namaSubKegiatan = String(item.NamaSubKegiatan || '').toLowerCase().trim();
             return infrastrukturNormalCodes.has(kodeSubKegiatan) || infrastrukturXxxNames.has(namaSubKegiatan);
        };
       
        const aggregateDetails = (anggaranItems, relevantRealisasi) => {
            const aggregatedMap = new Map();

            anggaranItems.forEach(item => {
                if (!item) return; 
                
                let aggregationKey;
                const kodeSubKegiatanStr = String(item.KodeSubKegiatan || '').trim();
                 if (kodeSubKegiatanStr.toUpperCase().startsWith('X.XX')) {
                    aggregationKey = `${item.NamaSKPD}|${item.NamaSubUnit || ' '}|${item.NamaSubKegiatan}`;
                } else {
                    aggregationKey = `${item.NamaSKPD}|${item.NamaSubUnit || ' '}|${kodeSubKegiatanStr}`;
                }

                if (!aggregatedMap.has(aggregationKey)) {
                    aggregatedMap.set(aggregationKey, {
                        NamaSKPD: item.NamaSKPD,
                        NamaSubUnit: item.NamaSubUnit,
                        KodeSubKegiatan: item.KodeSubKegiatan, 
                        NamaSubKegiatan: item.NamaSubKegiatan,
                        pagu: 0,
                        realisasi: 0,
                        sisa: 0      
                    });
                }
                const entry = aggregatedMap.get(aggregationKey);
                entry.pagu += item.nilai;
            });

            relevantRealisasi.forEach(item => {
                 let aggregationKey;
                 const kodeSubKegiatanStr = String(item.KodeSubKegiatan || '').trim();
                 if (kodeSubKegiatanStr.toUpperCase().startsWith('X.XX')) {
                     aggregationKey = `${item.NamaSKPD}|${item.NamaSubUnit || ' '}|${item.NamaSubKegiatan}`;
                 } else {
                     aggregationKey = `${item.NamaSKPD}|${item.NamaSubUnit || ' '}|${kodeSubKegiatanStr}`;
                 }

                 if (aggregatedMap.has(aggregationKey)) {
                     const entry = aggregatedMap.get(aggregationKey);
                     entry.realisasi += item.nilai;
                 }
            });

            aggregatedMap.forEach((entry) => {
                entry.sisa = entry.pagu - entry.realisasi;
            });

            return Array.from(aggregatedMap.values()).map(item => ({
                ...item,
                persentase: item.pagu > 0 ? (item.realisasi / item.pagu) * 100 : 0
            }));
        };

        const totalAPBD = anggaran.reduce((sum, item) => sum + (item?.nilai || 0), 0);
        
        const excludedPegawaiCodes = [ '5.1.01.02.06.0064', '5.1.01.02.06.0066', '5.1.01.02.06.0070', '5.1.01.02.06.0072', '5.1.01.03.03.0001', '5.1.01.03.09.0001', '5.1.01.03.05.0001', '5.1.01.03.11.0001', '5.1.01.02.006.00064', '5.1.01.02.006.00070', '5.1.01.02.006.00066', '5.1.01.02.006.00072'];

        let totalBelanjaPegawai = 0;
        let belanjaPegawaiDikecualikan = 0;
        let belanjaPendidikan = 0;
        let belanjaInfrastruktur = 0;
        let rawDetailPendidikan = []; 
        let rawDetailInfrastruktur = []; 
        
        // Hitung belanja pegawai per SKPD untuk pivot table
        const skpdPegawaiMap = new Map();
        
        anggaran.forEach(item => {
            if (!item) return; 
            const kodeRekening = String(item.KodeRekening || '').trim();
            const nilai = item.nilai || 0;
            const skpd = item.NamaSKPD || 'Tanpa SKPD';
            const processedItem = { ...item, pagu: nilai }; 

            if (kodeRekening.startsWith('5.1.01')) {
                totalBelanjaPegawai += nilai;
                if (excludedPegawaiCodes.includes(kodeRekening)) {
                    belanjaPegawaiDikecualikan += nilai;
                }
                
                // Akumulasi per SKPD untuk pivot
                if (!skpdPegawaiMap.has(skpd)) {
                    skpdPegawaiMap.set(skpd, 0);
                }
                skpdPegawaiMap.set(skpd, skpdPegawaiMap.get(skpd) + nilai);
            }
            
            if (isPendidikan(item)) { 
                belanjaPendidikan += nilai;
                if(processedItem) rawDetailPendidikan.push(processedItem); 
            }

            if (isInfrastruktur(item)) { 
                belanjaInfrastruktur += nilai;
                 if(processedItem) rawDetailInfrastruktur.push(processedItem);
            }
        });
        
        const belanjaPegawaiUntukPerhitungan = totalBelanjaPegawai - belanjaPegawaiDikecualikan;
        
        // Konversi SKPD map ke array untuk pivot
        const skpdPegawaiDetails = Array.from(skpdPegawaiMap.entries()).map(([NamaSKPD, totalBelanjaPegawai]) => ({
            NamaSKPD,
            totalBelanjaPegawai
        }));
        
        const realisasiPendidikan = allRealisasi.filter(isPendidikan);
        const realisasiInfrastruktur = allRealisasi.filter(isInfrastruktur);

        const pegawai = {
            totalAPBD,
            totalBelanjaPegawai,
            belanjaPegawaiDikecualikan,
            belanjaPegawaiUntukPerhitungan,
            percentage: totalAPBD > 0 ? (belanjaPegawaiUntukPerhitungan / totalAPBD) * 100 : 0,
            detailItems: [],
            skpdDetails: skpdPegawaiDetails
        };

        const infrastruktur = {
            totalAPBD,
            belanjaInfrastruktur,
            percentage: totalAPBD > 0 ? (belanjaInfrastruktur / totalAPBD) * 100 : 0,
            detailItems: aggregateDetails(rawDetailInfrastruktur, realisasiInfrastruktur) 
        };
        
        const pendidikan = {
            totalAPBD,
            belanjaPendidikan,
            percentage: totalAPBD > 0 ? (belanjaPendidikan / totalAPBD) * 100 : 0,
            detailItems: aggregateDetails(rawDetailPendidikan, realisasiPendidikan) 
        };

        return { pegawai, infrastruktur, pendidikan };
    }, [anggaran, realisasi, realisasiNonRkud, refPendidikan, refInfrastruktur]);

    // Executive Summary
    const executiveSummary = useMemo(() => {
        if (!analysisData || !analysisData[activeTab]) return null;
        
        const data = analysisData[activeTab];
        const threshold = activeTab === 'pegawai' ? 30 : activeTab === 'infrastruktur' ? 40 : 20;
        const isCompliant = activeTab === 'pegawai' ? data.percentage <= threshold : data.percentage >= threshold;
        
        return {
            totalAPBD: data.totalAPBD,
            alokasi: activeTab === 'pegawai' ? data.belanjaPegawaiUntukPerhitungan : 
                     activeTab === 'infrastruktur' ? data.belanjaInfrastruktur : 
                     data.belanjaPendidikan,
            percentage: data.percentage,
            threshold,
            isCompliant,
            selisih: Math.abs(data.percentage - threshold),
            perluTindakan: activeTab === 'pegawai' ? data.percentage > threshold : data.percentage < threshold,
            title: activeTab === 'pegawai' ? 'Belanja Pegawai' :
                   activeTab === 'infrastruktur' ? 'Infrastruktur Publik' : 'Fungsi Pendidikan'
        };
    }, [analysisData, activeTab]);

    const getStatusColor = (percentage, threshold, type) => {
        if (type === 'pegawai') {
             if (percentage <= threshold) return 'from-emerald-500 to-green-500';
             if (percentage <= threshold * 1.2) return 'from-amber-500 to-yellow-500';
             return 'from-rose-500 to-red-500';
        } else {
             if (percentage >= threshold) return 'from-emerald-500 to-green-500';
             if (percentage >= threshold * 0.7) return 'from-amber-500 to-yellow-500';
             return 'from-rose-500 to-red-500';
        }
    };

    const renderExecutiveDashboard = () => {
        const currentData = analysisData[activeTab];
        const threshold = activeTab === 'pegawai' ? 30 : activeTab === 'infrastruktur' ? 40 : 20;
        const title = activeTab === 'pegawai' ? 'Belanja Pegawai' :
                      activeTab === 'infrastruktur' ? 'Infrastruktur Publik' : 'Fungsi Pendidikan';
        const targetDesc = activeTab === 'pegawai' ? 'Batas Maksimal' : 'Batas Minimal';
        
        if (!currentData || !currentData.totalAPBD) return null;

        return (
            <div className="mb-8">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-700 to-indigo-900 p-8 text-white shadow-2xl border border-white/10 group mb-6">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -mr-40 -mt-40"></div>
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-400/10 rounded-full blur-[80px] -ml-32 -mb-32"></div>
                    <div className="absolute top-8 right-12 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Crown size={120} className="text-yellow-400" />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-6 border-b border-white/20 pb-6">
                            <div className="p-4 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl shadow-lg shadow-yellow-500/30">
                                <Scale size={32} className="text-white" />
                            </div>
                            <div>
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black tracking-[0.2em] uppercase border border-white/30 mb-2">
                                    <Eye size={12} className="text-yellow-300" /> EXECUTIVE DASHBOARD
                                </div>
                                <h2 className="text-3xl font-black tracking-tighter leading-tight">
                                    RINGKASAN EKSEKUTIF {title} <br/>
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">TAHUN {selectedYear}</span>
                                </h2>
                            </div>
                            <button 
                                onClick={() => setShowExecutiveInfo(!showExecutiveInfo)}
                                className="ml-auto p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                            >
                                {showExecutiveInfo ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        {showExecutiveInfo && (
                            <>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                                    <div className="bg-black/20 backdrop-blur-md rounded-xl p-3 border border-white/10">
                                        <div className="flex items-center gap-2">
                                            <Coins size={16} className="text-yellow-400" />
                                            <p className="text-[10px] font-bold uppercase text-indigo-200">Total APBD</p>
                                        </div>
                                        <p className="text-xl font-black text-white mt-1">{formatCurrency(currentData.totalAPBD)}</p>
                                    </div>
                                    <div className="bg-black/20 backdrop-blur-md rounded-xl p-3 border border-white/10">
                                        <div className="flex items-center gap-2">
                                            <DollarSign size={16} className="text-emerald-400" />
                                            <p className="text-[10px] font-bold uppercase text-indigo-200">Alokasi {title}</p>
                                        </div>
                                        <p className="text-xl font-black text-emerald-300 mt-1">{formatCurrency(activeTab === 'pegawai' ? currentData.belanjaPegawaiUntukPerhitungan : activeTab === 'infrastruktur' ? currentData.belanjaInfrastruktur : currentData.belanjaPendidikan)}</p>
                                    </div>
                                    <div className="bg-black/20 backdrop-blur-md rounded-xl p-3 border border-white/10">
                                        <div className="flex items-center gap-2">
                                            <Gauge size={16} className="text-purple-400" />
                                            <p className="text-[10px] font-bold uppercase text-indigo-200">Persentase Saat Ini</p>
                                        </div>
                                        <p className={`text-xl font-black ${activeTab === 'pegawai' ? (currentData.percentage <= threshold ? 'text-green-300' : 'text-red-300') : (currentData.percentage >= threshold ? 'text-green-300' : 'text-red-300')}`}>
                                            {currentData.percentage.toFixed(2)}%
                                        </p>
                                    </div>
                                    <div className="bg-black/20 backdrop-blur-md rounded-xl p-3 border border-white/10">
                                        <div className="flex items-center gap-2">
                                            <Target size={16} className="text-blue-400" />
                                            <p className="text-[10px] font-bold uppercase text-indigo-200">{targetDesc}</p>
                                        </div>
                                        <p className="text-xl font-black text-blue-300 mt-1">{threshold}%</p>
                                    </div>
                                </div>

                                <div className={`p-5 rounded-2xl mb-4 ${activeTab === 'pegawai' 
                                    ? (currentData.percentage <= threshold ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-rose-500/20 border-rose-500/30')
                                    : (currentData.percentage >= threshold ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-rose-500/20 border-rose-500/30')
                                } border`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-3 rounded-xl ${
                                                (activeTab === 'pegawai' && currentData.percentage <= threshold) || 
                                                (activeTab !== 'pegawai' && currentData.percentage >= threshold)
                                                    ? 'bg-emerald-500/30' : 'bg-rose-500/30'
                                            }`}>
                                                {(activeTab === 'pegawai' && currentData.percentage <= threshold) || 
                                                 (activeTab !== 'pegawai' && currentData.percentage >= threshold)
                                                    ? <CheckCircle size={24} className="text-emerald-300" />
                                                    : <AlertTriangle size={24} className="text-rose-300" />
                                                }
                                            </div>
                                            <div>
                                                <p className="text-xl font-black text-white">
                                                    {(activeTab === 'pegawai' && currentData.percentage <= threshold) || 
                                                     (activeTab !== 'pegawai' && currentData.percentage >= threshold)
                                                        ? 'MEMENUHI KETENTUAN'
                                                        : 'BELUM MEMENUHI KETENTUAN'
                                                    }
                                                </p>
                                                <p className="text-sm text-indigo-200 mt-1">
                                                    {activeTab === 'pegawai' 
                                                        ? `Belanja pegawai ${currentData.percentage.toFixed(2)}% dari total APBD`
                                                        : `Alokasi ${title} ${currentData.percentage.toFixed(2)}% dari total APBD`
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-indigo-200">Selisih</p>
                                            <p className={`text-2xl font-black ${Math.abs(currentData.percentage - threshold) < 1 ? 'text-yellow-400' : (activeTab === 'pegawai' ? (currentData.percentage > threshold ? 'text-red-400' : 'text-green-400') : (currentData.percentage < threshold ? 'text-red-400' : 'text-green-400'))}`}>
                                                {Math.abs(currentData.percentage - threshold).toFixed(2)}%
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center gap-3 text-sm bg-purple-900/30 p-4 rounded-2xl border border-purple-500/30">
                                    <Lightbulb size={20} className="text-yellow-300 flex-shrink-0" />
                                    <p className="text-xs leading-relaxed text-indigo-100">
                                        <span className="font-bold text-white">CATATAN EKSEKUTIF:</span> {
                                            activeTab === 'pegawai'
                                                ? currentData.percentage <= threshold
                                                    ? `Belanja pegawai sebesar ${currentData.percentage.toFixed(2)}% masih di bawah batas maksimal 30%. Ruang fiskal tersedia untuk program prioritas.`
                                                    : `Belanja pegawai sebesar ${currentData.percentage.toFixed(2)}% melebihi batas maksimal 30%. Perlu efisiensi sebesar ${(currentData.percentage - threshold).toFixed(2)}% (${formatCurrency((currentData.percentage - threshold) / 100 * currentData.totalAPBD)}).`
                                                : currentData.percentage >= threshold
                                                    ? `Alokasi ${title} sebesar ${currentData.percentage.toFixed(2)}% telah memenuhi batas minimal ${threshold}%.`
                                                    : `Alokasi ${title} sebesar ${currentData.percentage.toFixed(2)}% belum memenuhi batas minimal ${threshold}%. Perlu tambahan alokasi sebesar ${(threshold - currentData.percentage).toFixed(2)}% (${formatCurrency((threshold - currentData.percentage) / 100 * currentData.totalAPBD)}).`
                                        }
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderAnalysisContent = () => {
        switch (activeTab) {
            case 'infrastruktur':
                return (
                    <div className="animate-in fade-in duration-500">
                        {renderExecutiveDashboard()}
                        <div className="relative">
                            <ModernAnalysisCard
                                title="Belanja Infrastruktur Pelayanan Publik"
                                data={analysisData.infrastruktur}
                                threshold={40}
                                type="infrastruktur"
                                getAnalysisPrompt={getAnalysisPrompt}
                                namaPemda={namaPemda}
                                selectedYear={selectedYear}
                                userCanUseAi={userCanUseAi}
                                regulationText="UU No. 1 Tahun 2022 Pasal 147 mengamanatkan daerah untuk mengalokasikan Belanja Infrastruktur Pelayanan Publik paling rendah 40% (empat puluh persen) dari total belanja APBD, di luar belanja bagi hasil dan/atau transfer kepada daerah/desa."
                            />
                        </div>
                    </div>
                );
            case 'pendidikan':
                return (
                    <div className="animate-in fade-in duration-500">
                        {renderExecutiveDashboard()}
                        <div className="relative">
                            <ModernAnalysisCard
                                title="Fungsi Pendidikan"
                                data={analysisData.pendidikan}
                                threshold={20}
                                type="pendidikan"
                                getAnalysisPrompt={getAnalysisPrompt}
                                namaPemda={namaPemda}
                                selectedYear={selectedYear}
                                userCanUseAi={userCanUseAi}
                                regulationText="Sesuai amanat UUD 1945, UU No. 20 Tahun 2003, serta ditegaskan dalam PP 12/2019 dan PMDN 77/2020, Pemerintah Daerah wajib mengalokasikan anggaran fungsi pendidikan minimal 20% (dua puluh persen) dari APBD."
                            />
                        </div>
                    </div>
                );
            case 'pegawai':
            default:
                return (
                    <div className="animate-in fade-in duration-500">
                        {renderExecutiveDashboard()}
                        <div className="relative">
                            <ModernAnalysisCard
                                title="Belanja Pegawai"
                                data={analysisData.pegawai}
                                threshold={30}
                                type="pegawai"
                                getAnalysisPrompt={getAnalysisPrompt}
                                namaPemda={namaPemda}
                                selectedYear={selectedYear}
                                userCanUseAi={userCanUseAi}
                                regulationText="UU No. 1 Tahun 2022 Pasal 146 menetapkan batas maksimal Belanja Pegawai daerah adalah 30% dari total belanja APBD, dengan pengecualian untuk belanja pegawai yang bersumber dari alokasi Dana Alokasi Khusus Nonfisik, dana darurat, belanja pegawai untuk kebutuhan tertentu yang diatur dengan Peraturan Pemerintah, dan penghasilan tertentu yang diatur dengan Undang-Undang."
                            />
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="space-y-6 max-w-full">
            <SectionTitle>ANALISA MANDATORY SPENDING</SectionTitle>
            
            {/* Glassmorphism Tab Navigation */}
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 rounded-2xl blur-xl"></div>
                <div className="relative flex overflow-x-auto no-scrollbar p-1.5 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/30 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
                    <button
                        onClick={() => setActiveTab('pegawai')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 font-bold text-sm rounded-xl transition-all duration-300 min-w-[160px] ${
                            activeTab === 'pegawai'
                                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-md ring-1 ring-black/5 dark:ring-white/10'
                                : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
                        }`}
                    >
                        <Users size={18}/> Belanja Pegawai
                    </button>
                    <button
                        onClick={() => setActiveTab('infrastruktur')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 font-bold text-sm rounded-xl transition-all duration-300 min-w-[160px] ${
                            activeTab === 'infrastruktur'
                                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-md ring-1 ring-black/5 dark:ring-white/10'
                                : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
                        }`}
                    >
                        <HardHat size={18}/> Infrastruktur
                    </button>
                    <button
                        onClick={() => setActiveTab('pendidikan')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 font-bold text-sm rounded-xl transition-all duration-300 min-w-[160px] ${
                            activeTab === 'pendidikan'
                                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-md ring-1 ring-black/5 dark:ring-white/10'
                                : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
                        }`}
                    >
                        <GraduationCap size={18}/> Fungsi Pendidikan
                    </button>
                </div>
            </div>
            
            {/* Content Container */}
            <div className="relative">
                {renderAnalysisContent()}
            </div>
            
            {/* Modal Rekomendasi */}
            {showRekomendasi && (
                <RekomendasiCard
                    data={analysisData[rekomendasiType]}
                    type={rekomendasiType}
                    onClose={() => setShowRekomendasi(false)}
                />
            )}
        </div>
    );
};

const getAnalysisPrompt = (type, data, customQuery, namaPemda, selectedYear) => {
    if (customQuery) {
        return `Berdasarkan data mandatory spending, berikan analisis untuk: "${customQuery}"`;
    }
    
    let promptIntro = `Anda adalah seorang analis anggaran ahli untuk ${namaPemda || 'pemerintah daerah'}. `;
    let analysisDetails = '';
    let recommendationFocus = '';

    switch (type) {
        case 'pegawai':
            analysisDetails = `
Analisis Mandatory Spending untuk Belanja Pegawai tahun ${selectedYear} berdasarkan formula ((Total Belanja Pegawai - Belanja Pegawai Dikecualikan) / Total APBD).

Data menunjukkan:
- Total APBD: ${formatCurrency(data.totalAPBD)}
- Total Belanja Pegawai: ${formatCurrency(data.totalBelanjaPegawai)}
- Belanja Pegawai Dikecualikan: ${formatCurrency(data.belanjaPegawaiDikecualikan)}
- Dasar Perhitungan Belanja Pegawai: ${formatCurrency(data.belanjaPegawaiUntukPerhitungan)}
- Persentase Mandatory Spending: ${data.percentage.toFixed(2)}%`;
            recommendationFocus = `Sesuai UU No 1 Tahun 2022 Pasal 146, batas maksimal adalah 30%. Apakah persentase belanja pegawai sebesar ${data.percentage.toFixed(2)}% ini mematuhi aturan tersebut? Apa implikasinya terhadap ruang fiskal? Berikan rekomendasi spesifik jika porsi belanja pegawai belum sesuai ketentuan.`;
            break;
        case 'infrastruktur':
            analysisDetails = `
Analisis Mandatory Spending untuk Belanja Infrastruktur Pelayanan Publik tahun ${selectedYear}.

Data menunjukkan:
- Total APBD: ${formatCurrency(data.totalAPBD)}
- Belanja Infrastruktur: ${formatCurrency(data.belanjaInfrastruktur)}
- Persentase dari Total APBD: ${data.percentage.toFixed(2)}%`;
            recommendationFocus = `Sesuai UU No 1 Tahun 2022 Pasal 147, batas minimal adalah 40%. Apakah persentase belanja infrastruktur sebesar ${data.percentage.toFixed(2)}% ini sudah memenuhi syarat minimal tersebut? Apa saja program/kegiatan yang menjadi pendorong utama? Berikan rekomendasi untuk optimalisasi alokasi belanja infrastruktur.`;
            break;
        case 'pendidikan':
            analysisDetails = `
Analisis Mandatory Spending untuk Fungsi Pendidikan tahun ${selectedYear}.

Data menunjukkan:
- Total APBD: ${formatCurrency(data.totalAPBD)}
- Belanja Fungsi Pendidikan: ${formatCurrency(data.belanjaPendidikan)}
- Persentase dari Total APBD: ${data.percentage.toFixed(2)}%`;
            recommendationFocus = `Merujuk UUD 1945, UU No 20/2003, PP 12/2019 dan PMDN 77/2020, batas minimal adalah 20%. Apakah persentase belanja fungsi pendidikan sebesar ${data.percentage.toFixed(2)}% ini sudah mematuhi regulasi? Apa saja program pendidikan yang mendapatkan alokasi terbesar? Berikan evaluasi atas capaian ini.`;
            break;
    }

    return `${promptIntro}${analysisDetails}\n\nBerikan analisis mengenai:\n${recommendationFocus}`;
};

export default MandatorySpendingView;