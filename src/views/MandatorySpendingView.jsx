import React, { useState, useMemo, useEffect } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
    ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis, Cell, ComposedChart
} from 'recharts';
import { 
    Users, Building2, GraduationCap, AlertTriangle, CheckCircle, Info, 
    Bot, Sparkles, Loader2, RefreshCw, LayoutGrid, Lightbulb, Scale, 
    HardHat, BookOpen, Activity, Download, DollarSign, Target
} from 'lucide-react';

// ==============================================================================
// MENGGUNAKAN SUMBER DATA FIREBASE ASLI DARI APLIKASI ANDA
// ==============================================================================
import { collection, onSnapshot } from "firebase/firestore";
import { db } from './utils/firebase'; 

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

const GeminiAnalysis = ({ getAnalysisPrompt, disabledCondition, userCanUseAi }) => {
    const [analysis, setAnalysis] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const generateAnalysis = async () => {
        if (disabledCondition) return;
        
        setLoading(true);
        setError(null);
        const apiKey = ""; // Disediakan oleh environment
        const prompt = getAnalysisPrompt("");

        const fetchWithRetry = async (url, options, retries = 5, backoff = 1000) => {
            try {
                const response = await fetch(url, options);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return await response.json();
            } catch (err) {
                if (retries > 0) {
                    await new Promise(resolve => setTimeout(resolve, backoff));
                    return fetchWithRetry(url, options, retries - 1, backoff * 2);
                }
                throw err;
            }
        };

        try {
            const result = await fetchWithRetry(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        systemInstruction: { 
                            parts: [{ text: `Anda adalah auditor ahli keuangan daerah. Berikan analisis singkat, padat, dan strategis dalam bahasa Indonesia mengenai kepatuhan Mandatory Spending daerah sesuai UU 1/2022, PP 12/2019, dan PMDN 77/2020.` }] 
                        }
                    })
                }
            );

            const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
            setAnalysis(text || "Gagal menghasilkan analisis.");
        } catch (err) {
            setError("Gagal menghubungi layanan AI. Silakan coba lagi nanti.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-indigo-900/20 p-6 md:p-8 rounded-3xl border border-indigo-100 dark:border-indigo-800/50 mb-8 shadow-sm h-full flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <div className="bg-indigo-600 p-3 rounded-2xl shadow-indigo-500/30 shadow-lg shrink-0">
                        <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-xl text-gray-800 dark:text-gray-100 flex items-center gap-2">
                            AI Insight: Evaluasi Kepatuhan
                            <Sparkles className="w-5 h-5 text-yellow-500 fill-yellow-500 shrink-0" />
                        </h3>
                        <p className="text-sm text-indigo-700 dark:text-indigo-400">Analisis cerdas kewajiban belanja daerah</p>
                    </div>
                </div>
                <button
                    onClick={generateAnalysis}
                    disabled={loading || disabledCondition || (userCanUseAi === false)}
                    className={`flex shrink-0 items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                        loading || disabledCondition || (userCanUseAi === false)
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500' 
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-xl hover:-translate-y-0.5 active:scale-95'
                    }`}
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                    {analysis ? 'Analisis Ulang' : 'Mulai Analisis AI'}
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-2xl mb-4 text-sm font-medium border border-red-200 dark:border-red-800">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    {error}
                </div>
            )}

            {analysis ? (
                <div className="prose prose-indigo dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap bg-white/70 dark:bg-gray-800/70 p-6 rounded-2xl backdrop-blur-md border border-white/50 dark:border-gray-700/50 shadow-inner flex-grow">
                    {analysis}
                </div>
            ) : (
                !loading && (
                    <div className="bg-white/50 dark:bg-gray-800/50 p-6 rounded-2xl border border-dashed border-indigo-200 dark:border-indigo-800/50 text-center flex-grow flex flex-col justify-center">
                        <Info className="w-8 h-8 text-indigo-400 mx-auto mb-2 opacity-50" />
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            Klik tombol di atas untuk memerintahkan AI mengevaluasi batas persentase anggaran secara otomatis.
                        </p>
                    </div>
                )
            )}
            
            {loading && (
                <div className="flex flex-col items-center justify-center py-12 gap-4 flex-grow">
                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                    <p className="text-indigo-600 dark:text-indigo-400 font-bold animate-pulse text-center">Meninjau persentase terhadap regulasi UU No. 1 Tahun 2022...</p>
                </div>
            )}
        </div>
    );
};

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

                {/* Gemini AI Analysis Container */}
                <div className="lg:col-span-2 h-full">
                    <GeminiAnalysis 
                        getAnalysisPrompt={(q) => getAnalysisPrompt(type, data, q, namaPemda, selectedYear)} 
                        disabledCondition={data.totalAPBD === 0} 
                        userCanUseAi={userCanUseAi}
                    />
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
                        <button 
                            onClick={handleDownloadExcel}
                            className="flex justify-center items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-400 px-4 py-2 rounded-xl transition-colors font-semibold text-sm"
                        >
                            <Download size={16} />
                            Download Excel
                        </button>
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
        const currentData = activeTab === 'pegawai' ? analysisData.pegawai :
                            activeTab === 'infrastruktur' ? analysisData.infrastruktur :
                            analysisData.pendidikan;
        
        const threshold = activeTab === 'pegawai' ? 30 : activeTab === 'infrastruktur' ? 40 : 20;
        const title = activeTab === 'pegawai' ? 'Belanja Pegawai' :
                      activeTab === 'infrastruktur' ? 'Infrastruktur Publik' : 'Fungsi Pendidikan';
                      
        const targetDesc = activeTab === 'pegawai' ? 'Batas Maksimal' : 'Batas Minimal';
        
        if (!currentData || !currentData.totalAPBD) return null;

        return (
            <div className="mb-8">
                {/* Glassmorphism Header Card */}
                <div className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
                    {/* Background Gradient Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-blue-500/5 pointer-events-none"></div>
                    
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-400/10 to-blue-400/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-emerald-400/10 to-teal-400/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
                    
                    <div className="relative p-6">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                            <div>
                                <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                                    <Scale size={16} /> Mandatory Spending {title}
                                </h3>
                                <p className="text-3xl font-black bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                                    {formatCurrency(currentData.totalAPBD)}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Total APBD Tahun {selectedYear}
                                </p>
                            </div>
                            <div className="flex flex-col items-end">
                                <div className={`px-4 py-2 rounded-xl flex items-center gap-3 bg-gradient-to-r ${getStatusColor(currentData.percentage, threshold, activeTab)} shadow-lg text-white`}>
                                    {getStatusIcon(currentData.percentage, threshold, activeTab)}
                                    <div>
                                        <p className="text-xs font-medium opacity-90">{targetDesc} {threshold}%</p>
                                        <p className="text-xl font-bold leading-tight">{currentData.percentage.toFixed(2)}%</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Key Metrics Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Alokasi Card */}
                            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-xl border border-white/40 dark:border-gray-700/50 p-4 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg">
                                        <DollarSign className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Alokasi Anggaran {title}</p>
                                </div>
                                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                                    {activeTab === 'pegawai' ? formatCurrency(currentData.belanjaPegawaiUntukPerhitungan) :
                                     activeTab === 'infrastruktur' ? formatCurrency(currentData.belanjaInfrastruktur) :
                                     formatCurrency(currentData.belanjaPendidikan)}
                                </p>
                                <div className="mt-3 h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full bg-gradient-to-r ${getStatusColor(currentData.percentage, threshold, activeTab)}`}
                                        style={{ width: `${Math.min(currentData.percentage, 100)}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Info Card Khusus */}
                            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-xl border border-white/40 dark:border-gray-700/50 p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-center">
                                {activeTab === 'pegawai' ? (
                                    <>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Total Belanja Pegawai</span>
                                            <span className="font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(currentData.totalBelanjaPegawai)}</span>
                                        </div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Belanja Dikecualikan</span>
                                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">-{formatCurrency(currentData.belanjaPegawaiDikecualikan)}</span>
                                        </div>
                                        <div className="w-full border-t border-gray-200 dark:border-gray-700 my-1"></div>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Dasar Perhitungan</span>
                                            <span className="font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(currentData.belanjaPegawaiUntukPerhitungan)}</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-start gap-3">
                                        <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                            {activeTab === 'infrastruktur' 
                                                ? "Perhitungan mengacu pada daftar sub-kegiatan infrastruktur publik, di luar belanja bagi hasil dan transfer daerah sesuai ketentuan UU 1/2022." 
                                                : "Perhitungan mencakup seluruh alokasi anggaran yang mendukung fungsi pendidikan sesuai pemetaan kodefikasi."}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
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
                                regulationText="UU No. 1 Tahun 2022 Pasal 146 menetapkan batas maksimal Belanja Pegawai daerah adalah 30% (tiga puluh persen) dari total belanja APBD (di luar tunjangan guru yang dialokasikan melalui TKD) guna menjaga ruang fiskal pembangunan."
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
