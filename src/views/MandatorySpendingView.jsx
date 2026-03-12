import React, { useState, useMemo, useEffect } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
    ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis, Cell, ComposedChart
} from 'recharts';
import { 
    Users, Building2, GraduationCap, AlertTriangle, CheckCircle, Info, 
    Bot, Sparkles, Loader2, RefreshCw, LayoutGrid, Lightbulb, Scale, 
    HardHat, BookOpen, Activity, Download, DollarSign, Target, Eye, EyeOff,
    Award, Crown, Briefcase, Zap, Gauge, Brain, Coins, Rocket, Medal, Trophy,
    ArrowUpRight, ArrowDownRight, Clock, Shield, AlertOctagon
} from 'lucide-react';

// ==============================================================================
// MENGGUNAKAN SUMBER DATA FIREBASE ASLI DARI APLIKASI ANDA
// ==============================================================================
import { collection, onSnapshot } from "firebase/firestore";
import { db } from '../utils/firebase'; 
import GeminiAnalysis from '../components/GeminiAnalysis';

// --- UTILITIES ---
const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value || 0);
};

// --- EXPORT TO EXCEL UTILITY ---
const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) return;
    
    // Prepare header
    const headers = Object.keys(data[0]).join(',');
    
    // Prepare rows
    const rows = data.map(obj => {
        return Object.values(obj).map(val => {
            let formattedVal = val;
            if (typeof val === 'string') {
                // Escape quotes and wrap strings with commas in quotes
                formattedVal = `"${val.replace(/"/g, '""')}"`;
            }
            return formattedVal;
        }).join(',');
    });
    
    // Combine header and rows
    const csvContent = [headers, ...rows].join('\n');
    
    // Create Blob and trigger download
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

// ============================================================
// FITUR BARU: REKOMENDASI PEMENUHAN MANDATORY SPENDING
// ============================================================

/**
 * Menghitung rekomendasi penyesuaian anggaran untuk memenuhi mandatory spending
 * @param {Object} data - Data analisis mandatory spending
 * @param {string} type - Tipe mandatory ('pegawai', 'infrastruktur', 'pendidikan')
 * @param {number} targetPersentase - Target persentase yang ingin dicapai
 * @param {string} level - Level rekomendasi ('ekstrim', 'moderat', 'toleran')
 * @returns {Object} Rekomendasi penyesuaian
 */
const hitungRekomendasi = (data, type, targetPersentase, level) => {
    if (!data || !data.totalAPBD) return null;
    
    const totalAPBD = data.totalAPBD;
    const currentPercentage = data.percentage;
    const selisihPersentase = targetPersentase - currentPercentage;
    const selisihNominal = (selisihPersentase / 100) * totalAPBD;
    
    // Tentukan faktor toleransi berdasarkan level
    let faktorToleransi = 1.0;
    let deskripsiLevel = '';
    
    switch(level) {
        case 'ekstrim':
            faktorToleransi = 1.2; // 20% lebih agresif
            deskripsiLevel = '⚠️ REKOMENDASI EKSTRIM: Prioritas utama pemenuhan mandatory, dampak signifikan pada program lain';
            break;
        case 'moderat':
            faktorToleransi = 1.0; // Presisi
            deskripsiLevel = '⚖️ REKOMENDASI MODERAT: Keseimbangan antara pemenuhan mandatory dan program lain';
            break;
        case 'toleran':
            faktorToleransi = 0.8; // 20% lebih toleran
            deskripsiLevel = '🛡️ REKOMENDASI TOLERAN: Minimal intervensi, prioritaskan program existing';
            break;
        default:
            faktorToleransi = 1.0;
            deskripsiLevel = '📊 REKOMENDASI STANDAR';
    }
    
    const targetNominal = (targetPersentase / 100) * totalAPBD * faktorToleransi;
    const currentNominal = type === 'pegawai' ? data.belanjaPegawaiUntukPerhitungan :
                           type === 'infrastruktur' ? data.belanjaInfrastruktur :
                           data.belanjaPendidikan;
    
    const perluDitambah = selisihPersentase > 0;
    const nominalPenyesuaian = Math.abs(selisihNominal) * faktorToleransi;
    
    // Analisis sumber penyesuaian berdasarkan tipe mandatory
    let sumberPenyesuaian = [];
    let rekomendasiDetail = [];
    
    if (type === 'pegawai') {
        // Untuk pegawai: harus dikurangi jika melebihi batas
        if (currentPercentage > targetPersentase) {
            // Identifikasi belanja non-prioritas yang bisa dikurangi
            sumberPenyesuaian = [
                { nama: 'Belanja Perjalanan Dinas', prioritas: 'Rendah', estimasi: totalAPBD * 0.02 },
                { nama: 'Belanja ATK dan Perlengkapan', prioritas: 'Rendah', estimasi: totalAPBD * 0.015 },
                { nama: 'Belanja Pemeliharaan Rutin', prioritas: 'Sedang', estimasi: totalAPBD * 0.03 },
                { nama: 'Belanja Honorarium Non-ASN', prioritas: 'Sedang', estimasi: totalAPBD * 0.025 },
                { nama: 'Belanja Jasa Konsultan', prioritas: 'Rendah', estimasi: totalAPBD * 0.01 }
            ];
            
            rekomendasiDetail = [
                `Kurangi belanja perjalanan dinas sebesar ${formatCurrency(totalAPBD * 0.02)}`,
                `Efisiensi belanja ATK dan perlengkapan kantor ${formatCurrency(totalAPBD * 0.015)}`,
                `Tinjau ulang belanja pemeliharaan rutin yang tidak mendesak`,
                `Optimalkan penggunaan tenaga ASN, kurangi honorarium non-ASN`
            ];
        }
    } else {
        // Untuk infrastruktur & pendidikan: harus ditambah jika kurang
        if (currentPercentage < targetPersentase) {
            // Identifikasi belanja yang bisa dialihkan/ditunda
            sumberPenyesuaian = [
                { nama: 'Belanja Pembangunan Gedung Baru', prioritas: 'Tinggi', estimasi: totalAPBD * 0.05 },
                { nama: 'Belanja Rehabilitasi Sedang/Berat', prioritas: 'Tinggi', estimasi: totalAPBD * 0.04 },
                { nama: 'Belanja Pengadaan Peralatan', prioritas: 'Sedang', estimasi: totalAPBD * 0.03 },
                { nama: 'Belanja Peningkatan Jalan', prioritas: 'Tinggi', estimasi: totalAPBD * 0.06 },
                { nama: 'Belanja Pengadaan Buku/Perpustakaan', prioritas: 'Sedang', estimasi: totalAPBD * 0.01 }
            ];
            
            rekomendasiDetail = [
                `Alihkan dana dari belanja operasional rutin sebesar ${formatCurrency(totalAPBD * 0.02)}`,
                `Tunda belanja pembangunan gedung baru yang belum mendesak`,
                `Optimalkan realokasi anggaran dari SKPD dengan penyerapan rendah`,
                `Gunakan dana darurat untuk memenuhi kekurangan mandatory`
            ];
        }
    }
    
    // Hitung dampak terhadap komponen APBD lain
    const dampakAPBD = {
        belanjaOperasi: nominalPenyesuaian * 0.4,
        belanjaModal: nominalPenyesuaian * 0.35,
        belanjaTakTerduga: nominalPenyesuaian * 0.25,
        silpaEstimasi: perluDitambah ? -nominalPenyesuaian : nominalPenyesuaian
    };
    
    return {
        perluDitambah,
        currentPercentage,
        targetPersentase,
        selisihPersentase: Math.abs(selisihPersentase).toFixed(2),
        nominalPenyesuaian,
        sumberPenyesuaian: sumberPenyesuaian.slice(0, 3),
        rekomendasiDetail: rekomendasiDetail.slice(0, 3),
        dampakAPBD,
        deskripsiLevel,
        level
    };
};

// Komponen Rekomendasi Card
const RekomendasiCard = ({ data, type, onClose }) => {
    const [level, setLevel] = useState('moderat');
    const [rekomendasi, setRekomendasi] = useState(null);
    
    const targetPersentase = type === 'pegawai' ? 30 : type === 'infrastruktur' ? 40 : 20;
    
    useEffect(() => {
        if (data) {
            setRekomendasi(hitungRekomendasi(data, type, targetPersentase, level));
        }
    }, [data, type, level, targetPersentase]);
    
    if (!rekomendasi) return null;
    
    const isPegawai = type === 'pegawai';
    const statusWarna = isPegawai 
        ? (rekomendasi.perluDitambah ? 'bg-red-500' : 'bg-green-500')
        : (rekomendasi.perluDitambah ? 'bg-green-500' : 'bg-red-500');
    
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
                {/* Header */}
                <div className={`p-6 bg-gradient-to-r ${statusWarna} to-${statusWarna}/80 text-white rounded-t-3xl`}>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white/20 rounded-2xl">
                                {isPegawai ? <Users size={28} /> : type === 'infrastruktur' ? <HardHat size={28} /> : <BookOpen size={28} />}
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
                        <button 
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                </div>
                
                {/* Level Selector */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
                        Pilih Level Rekomendasi:
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                        {['ekstrim', 'moderat', 'toleran'].map((lvl) => (
                            <button
                                key={lvl}
                                onClick={() => setLevel(lvl)}
                                className={`p-4 rounded-xl text-sm font-bold transition-all ${
                                    level === lvl
                                        ? lvl === 'ekstrim' ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' :
                                          lvl === 'moderat' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' :
                                          'bg-green-500 text-white shadow-lg shadow-green-500/30'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                            >
                                {lvl === 'ekstrim' && '⚠️ EKSTRIM'}
                                {lvl === 'moderat' && '⚖️ MODERAT'}
                                {lvl === 'toleran' && '🛡️ TOLERAN'}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-3 italic">
                        {rekomendasi.deskripsiLevel}
                    </p>
                </div>
                
                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Status Kepatuhan */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-2xl">
                            <p className="text-xs text-gray-500 mb-1">Kondisi Saat Ini</p>
                            <p className={`text-2xl font-black ${
                                (isPegawai && data.percentage <= targetPersentase) || 
                                (!isPegawai && data.percentage >= targetPersentase) 
                                    ? 'text-green-600' : 'text-red-600'
                            }`}>
                                {data.percentage.toFixed(2)}%
                            </p>
                            <p className="text-xs text-gray-400 mt-1">dari target {targetPersentase}%</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-2xl">
                            <p className="text-xs text-gray-500 mb-1">Selisih</p>
                            <p className="text-2xl font-black text-orange-600">
                                {rekomendasi.selisihPersentase}%
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                {rekomendasi.perluDitambah ? 'Perlu ditambah' : 'Perlu dikurangi'}
                            </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-2xl">
                            <p className="text-xs text-gray-500 mb-1">Nominal Penyesuaian</p>
                            <p className="text-2xl font-black text-indigo-600">
                                {formatCurrency(rekomendasi.nominalPenyesuaian)}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">(termasuk faktor toleransi)</p>
                        </div>
                    </div>
                    
                    {/* Sumber Penyesuaian */}
                    <div className="bg-blue-50/50 dark:bg-blue-900/20 p-5 rounded-2xl border border-blue-200 dark:border-blue-800">
                        <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-4 flex items-center gap-2">
                            <Target size={18} /> Sumber Penyesuaian Prioritas
                        </h4>
                        <div className="space-y-3">
                            {rekomendasi.sumberPenyesuaian.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-gray-200">{item.nama}</p>
                                        <p className="text-xs text-gray-500">Prioritas: {item.prioritas}</p>
                                    </div>
                                    <p className="font-bold text-indigo-600 dark:text-indigo-400">
                                        {formatCurrency(item.estimasi)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Rekomendasi Detail */}
                    <div className="bg-green-50/50 dark:bg-green-900/20 p-5 rounded-2xl border border-green-200 dark:border-green-800">
                        <h4 className="font-bold text-green-800 dark:text-green-300 mb-4 flex items-center gap-2">
                            <CheckCircle size={18} /> Rekomendasi Strategis
                        </h4>
                        <ul className="space-y-2">
                            {rekomendasi.rekomendasiDetail.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-3 text-sm">
                                    <span className="text-green-600 font-bold mt-0.5">✓</span>
                                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    
                    {/* Dampak terhadap APBD */}
                    <div className="bg-purple-50/50 dark:bg-purple-900/20 p-5 rounded-2xl border border-purple-200 dark:border-purple-800">
                        <h4 className="font-bold text-purple-800 dark:text-purple-300 mb-4 flex items-center gap-2">
                            <Activity size={18} /> Dampak terhadap Komponen APBD
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                                <p className="text-xs text-gray-500">Belanja Operasi</p>
                                <p className="font-bold text-gray-800 dark:text-gray-200">
                                    {formatCurrency(rekomendasi.dampakAPBD.belanjaOperasi)}
                                </p>
                            </div>
                            <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                                <p className="text-xs text-gray-500">Belanja Modal</p>
                                <p className="font-bold text-gray-800 dark:text-gray-200">
                                    {formatCurrency(rekomendasi.dampakAPBD.belanjaModal)}
                                </p>
                            </div>
                            <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                                <p className="text-xs text-gray-500">Belanja Tak Terduga</p>
                                <p className="font-bold text-gray-800 dark:text-gray-200">
                                    {formatCurrency(rekomendasi.dampakAPBD.belanjaTakTerduga)}
                                </p>
                            </div>
                            <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                                <p className="text-xs text-gray-500">Estimasi SiLPA</p>
                                <p className={`font-bold ${rekomendasi.dampakAPBD.silpaEstimasi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(Math.abs(rekomendasi.dampakAPBD.silpaEstimasi))}
                                    <span className="text-xs ml-1">{rekomendasi.dampakAPBD.silpaEstimasi > 0 ? '(+)' : '(-)'}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Catatan Kaki */}
                    <p className="text-xs text-gray-400 italic border-t border-gray-200 dark:border-gray-700 pt-4">
                        * Rekomendasi ini bersifat simulasi dan perlu dikaji lebih lanjut dengan mempertimbangkan 
                        prioritas pembangunan daerah, kapasitas fiskal, serta regulasi terkait.
                    </p>
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
                                // Fungsi untuk download rekomendasi sebagai PDF/Excel
                                alert('Fitur download akan segera tersedia');
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

// --- SUB-COMPONENTS ---

const SectionTitle = ({ children }) => (
    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 border-b-2 border-indigo-500 pb-2 inline-block">
        {children}
    </h2>
);

const TabButton = ({ title, isActive, onClick, icon }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 py-3 px-6 font-bold text-sm transition-all duration-300 border-b-4 ${
            isActive
                ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
    >
        {icon} {title}
    </button>
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

// Komponen Card Analisis Spesifik (Modern Analysis Card)
const ModernAnalysisCard = ({ title, data, threshold, type, getAnalysisPrompt, namaPemda, selectedYear, userCanUseAi, regulationText }) => {
    // State lokal untuk toggle analisis di card ini
    const [showAnalysis, setShowAnalysis] = useState(true);
    
    // Tentukan warna dan status berdasarkan tipe dan threshold
    let isCompliant = false;
    let colorClass = '';
    let metricTitle = '';
    
    if (type === 'pegawai') {
        isCompliant = data.percentage <= threshold; // Max 30%
        colorClass = isCompliant ? '#10B981' : '#EF4444'; // Green if <= 30, Red if > 30
        metricTitle = 'Maksimal 30%';
    } else {
        isCompliant = data.percentage >= threshold; // Min 40% or 20%
        colorClass = isCompliant ? '#10B981' : '#F59E0B'; // Green if >= threshold, Orange if < threshold
        metricTitle = `Minimal ${threshold}%`;
    }

    const gaugeData = [{ name: title, value: data.percentage, fill: colorClass }];
    
    // Sort and get top 15 for the bar chart
    const topItems = [...(data.detailItems || [])]
        .sort((a, b) => b.pagu - a.pagu)
        .slice(0, 15)
        .map(item => ({
            ...item,
            chartName: item.NamaSubKegiatan.length > 30 ? item.NamaSubKegiatan.substring(0, 30) + '...' : item.NamaSubKegiatan,
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
            'Penyerapan (%)': item.persentase.toFixed(2)
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
                {/* Metric Gauge - Modern Horizontal Layout */}
                <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col relative overflow-hidden h-full">
                    <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full -z-10 opacity-10`} style={{ background: `linear-gradient(to bottom right, transparent, ${colorClass})` }}></div>
                    
                    {/* Top: Info & Chart Aligned Horizontally */}
                    <div className="flex items-center justify-between gap-4 mb-6 flex-1">
                        <div className="flex-1">
                            <h3 className="font-black text-gray-800 dark:text-white text-lg leading-tight mb-1">{title}</h3>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Target: {metricTitle}</p>
                            <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold" style={{ backgroundColor: `${colorClass}15`, color: colorClass }}>
                                {isCompliant ? <CheckCircle size={14}/> : <AlertTriangle size={14}/>}
                                {isCompliant ? 'MEMENUHI' : 'BELUM MEMENUHI'}
                            </div>
                        </div>

                        {/* Circular Progress (Modern Donut Gauge) */}
                        <div className="w-24 h-24 md:w-28 md:h-28 shrink-0 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadialBarChart 
                                    cx="50%" cy="50%" 
                                    innerRadius="75%" outerRadius="100%" 
                                    barSize={12} data={gaugeData} 
                                    startAngle={90} endAngle={-270}
                                >
                                    <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                                    <RadialBar
                                        background={{ fill: 'rgba(128, 128, 128, 0.1)' }}
                                        clockWise
                                        dataKey="value"
                                        cornerRadius={10}
                                    />
                                </RadialBarChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                                <p className="text-xl md:text-2xl font-black" style={{ color: colorClass }}>
                                    {data.percentage.toFixed(1)}%
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom: Values */}
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

                {/* AI Analysis Section dengan Toggle */}
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
                        
                        {/* Indikator Data */}
                        {showAnalysis && data && data.totalAPBD > 0 && (
                            <div className="text-xs text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-2 bg-white/30 dark:bg-gray-800/30 p-2 rounded-lg">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                </span>
                                <span>{title} | Alokasi: {formatCurrency(data.totalAPBD)} | Capaian: {data.percentage?.toFixed(2)}%</span>
                            </div>
                        )}
                        
                        {/* Komponen GeminiAnalysis dengan Conditional Rendering */}
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

            {/* Top 15 Bar Chart */}
            {topItems.length > 0 && (
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

            {/* Detail Table with Export */}
            {data.detailItems && data.detailItems.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Rincian Sub Kegiatan</h3>
                        <div className="flex gap-2">
                            <button 
                                onClick={handleDownloadExcel}
                                className="flex justify-center items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-400 px-4 py-2 rounded-xl transition-colors font-semibold text-sm"
                            >
                                <Download size={16} />
                                Download Excel
                            </button>

                            {/* Tombol Rekomendasi - TAMBAHKAN INI */}
                            <button
                                onClick={() => {
                                    // Panggil fungsi dari props untuk membuka modal
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
                </div>
            )}
        </div>
    );
};

// --- MAIN VIEW COMPONENT ---
const MandatorySpendingView = ({ data, theme, namaPemda, selectedYear, userCanUseAi }) => {
    const { anggaran, realisasi, realisasiNonRkud } = data; 
    const [activeTab, setActiveTab] = useState('pegawai');
    const [refPendidikan, setRefPendidikan] = useState([]);
    const [refInfrastruktur, setRefInfrastruktur] = useState([]);
    
    // ===== STATE UNTUK INFO EKSEKUTIF DAN MODAL REKOMENDASI =====
    const [showExecutiveInfo, setShowExecutiveInfo] = useState(true);
    const [showRekomendasi, setShowRekomendasi] = useState(false);
    const [rekomendasiType, setRekomendasiType] = useState('pegawai');
    // ===== END STATE =====

    // ===== FUNGSI UNTUK MEMBUKA MODAL REKOMENDASI =====
    const bukaRekomendasi = (type) => {
        setRekomendasiType(type);
        setShowRekomendasi(true);
    };

    // Buat fungsi global agar bisa diakses dari komponen anak
    window.openRekomendasiModal = bukaRekomendasi;
    // ===== END FUNGSI =====

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
                console.warn("Firebase collection tidak terinisialisasi. Fitur fetch dimatikan di preview.");
                setter([]);
            }
        };

        fetchData('pendidikan', setRefPendidikan);
        fetchData('infrastruktur', setRefInfrastruktur);

        return () => unsubFunctions.forEach(unsub => unsub && unsub());
    }, [selectedYear]);

    // =========================================================================
    // INI ADALAH LOGIKA ORIGINAL YANG DIPULIHKAN 100% SESUAI PERMINTAAN ANDA
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
                entry.pagu += item.pagu;
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
        
        anggaran.forEach(item => {
            if (!item) return; 
            const kodeRekening = String(item.KodeRekening || '').trim();
            const nilai = item.nilai || 0;
            const processedItem = { ...item, pagu: nilai }; 

            if (kodeRekening.startsWith('5.1.01')) {
                totalBelanjaPegawai += nilai;
                if (excludedPegawaiCodes.includes(kodeRekening)) {
                    belanjaPegawaiDikecualikan += nilai;
                }
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
        
        const realisasiPendidikan = allRealisasi.filter(isPendidikan);
        const realisasiInfrastruktur = allRealisasi.filter(isInfrastruktur);

        const pegawai = {
            totalAPBD, totalBelanjaPegawai, belanjaPegawaiDikecualikan, belanjaPegawaiUntukPerhitungan,
            percentage: totalAPBD > 0 ? (belanjaPegawaiUntukPerhitungan / totalAPBD) * 100 : 0,
            detailItems: [] 
        };

        const infrastruktur = {
            totalAPBD, belanjaInfrastruktur,
            percentage: totalAPBD > 0 ? (belanjaInfrastruktur / totalAPBD) * 100 : 0,
            detailItems: aggregateDetails(rawDetailInfrastruktur, realisasiInfrastruktur) 
        };
        
        const pendidikan = {
            totalAPBD, belanjaPendidikan,
            percentage: totalAPBD > 0 ? (belanjaPendidikan / totalAPBD) * 100 : 0,
            detailItems: aggregateDetails(rawDetailPendidikan, realisasiPendidikan) 
        };

        return { pegawai, infrastruktur, pendidikan };
    }, [anggaran, realisasi, realisasiNonRkud, refPendidikan, refInfrastruktur]);
    // =========================================================================

    // === EXECUTIVE SUMMARY DATA ===
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

    // Fungsi untuk mendapatkan warna berdasarkan persentase dan threshold
    const getStatusColor = (percentage, threshold, type) => {
        if (type === 'pegawai') {
             // Pegawai max 30
             if (percentage <= threshold) return 'from-emerald-500 to-green-500';
             if (percentage <= threshold * 1.2) return 'from-amber-500 to-yellow-500';
             return 'from-rose-500 to-red-500';
        } else {
             // Infra & Pendidikan Min Threshold
             if (percentage >= threshold) return 'from-emerald-500 to-green-500';
             if (percentage >= threshold * 0.7) return 'from-amber-500 to-yellow-500';
             return 'from-rose-500 to-red-500';
        }
    };

    const getStatusIcon = (percentage, threshold, type) => {
         if (type === 'pegawai') {
             if (percentage <= threshold) return <CheckCircle className="w-6 h-6 text-white" />;
             if (percentage <= threshold * 1.2) return <Info className="w-6 h-6 text-white" />;
             return <AlertTriangle className="w-6 h-6 text-white" />;
         } else {
             if (percentage >= threshold) return <CheckCircle className="w-6 h-6 text-white" />;
             if (percentage >= threshold * 0.7) return <Info className="w-6 h-6 text-white" />;
             return <AlertTriangle className="w-6 h-6 text-white" />;
         }
    };

    // Dashboard Eksekutif untuk Mandatory Spending
    const renderExecutiveDashboard = () => {
        const currentData = analysisData[activeTab];
        const threshold = activeTab === 'pegawai' ? 30 : activeTab === 'infrastruktur' ? 40 : 20;
        const title = activeTab === 'pegawai' ? 'Belanja Pegawai' :
                      activeTab === 'infrastruktur' ? 'Infrastruktur Publik' : 'Fungsi Pendidikan';
        const targetDesc = activeTab === 'pegawai' ? 'Batas Maksimal' : 'Batas Minimal';
        
        if (!currentData || !currentData.totalAPBD) return null;

        return (
            <div className="mb-8">
                {/* Executive Header - PREMIUM GLASSMORPHISM */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-700 to-indigo-900 p-8 text-white shadow-2xl border border-white/10 group mb-6">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -mr-40 -mt-40"></div>
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-400/10 rounded-full blur-[80px] -ml-32 -mb-32"></div>
                    
                    {/* Crown Icon */}
                    <div className="absolute top-8 right-12 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Crown size={120} className="text-yellow-400" />
                    </div>
                    
                    <div className="relative z-10">
                        {/* Header */}
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
                                title={showExecutiveInfo ? 'Sembunyikan' : 'Tampilkan'}
                            >
                                {showExecutiveInfo ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        {showExecutiveInfo && (
                            <>
                                {/* Quick Stats */}
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

                                {/* Status Card */}
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

                                {/* Executive Note */}
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
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl pointer-events-none"></div>
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
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-2xl pointer-events-none"></div>
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
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 rounded-2xl pointer-events-none"></div>
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
                        <BookOpen size={18}/> Fungsi Pendidikan
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