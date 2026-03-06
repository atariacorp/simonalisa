import React, { useState, useMemo, useEffect } from 'react';
import { 
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Sector, ComposedChart, Line
} from 'recharts';
import { 
    TrendingUp, Award, AlertTriangle, CheckCircle, Info, 
    Bot, Sparkles, Loader2, RefreshCw, LayoutGrid, Lightbulb 
} from 'lucide-react';

// --- UTILITIES & CONSTANTS ---
const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value || 0);
};

const MONTHS_ARRAY = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const PIE_COLORS = {
    'Belanja Modal': '#10B981', // Emerald
    'Belanja Pegawai': '#EF4444', // Red
    'Belanja Barang & Jasa': '#F59E0B', // Amber
    'Belanja Transfer': '#3B82F6', // Blue
    'Belanja Tak Terduga': '#8B5CF6', // Purple
    'Lainnya': '#64748b' // Slate
};

// --- SUB-COMPONENTS ---

const SectionTitle = ({ children }) => (
    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 border-b-2 border-teal-500 pb-2 inline-block">
        {children}
    </h2>
);

const GeminiAnalysis = ({ getAnalysisPrompt, disabledCondition, userCanUseAi }) => {
    const [analysis, setAnalysis] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const generateAnalysis = async () => {
        if (disabledCondition) return;
        
        setLoading(true);
        setError(null);
        const apiKey = ""; // Environment provides key
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
                            parts: [{ text: `Anda adalah analis keuangan publik profesional. Berikan analisis singkat, padat, dan strategis dalam bahasa Indonesia yang berfokus pada evaluasi kualitas dan komposisi belanja daerah. Format dengan poin-poin tebal yang rapi.` }] 
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
        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 p-6 md:p-8 rounded-3xl border border-teal-100 dark:border-teal-800/50 mb-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <div className="bg-teal-600 p-3 rounded-2xl shadow-teal-500/30 shadow-lg">
                        <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-xl text-gray-800 dark:text-gray-100 flex items-center gap-2">
                            AI Insight: Analisis Kualitas Belanja
                            <Sparkles className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        </h3>
                        <p className="text-sm text-teal-700 dark:text-teal-400">Ringkasan cerdas komposisi anggaran berdasarkan data terkini</p>
                    </div>
                </div>
                <button
                    onClick={generateAnalysis}
                    disabled={loading || disabledCondition || (userCanUseAi === false)}
                    className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                        loading || disabledCondition || (userCanUseAi === false)
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500' 
                            : 'bg-teal-600 text-white hover:bg-teal-700 shadow-md hover:shadow-xl hover:-translate-y-0.5 active:scale-95'
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
                <div className="prose prose-teal dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap bg-white/70 dark:bg-gray-800/70 p-6 rounded-2xl backdrop-blur-md border border-white/50 dark:border-gray-700/50 shadow-inner">
                    {analysis}
                </div>
            ) : (
                !loading && (
                    <div className="bg-white/50 dark:bg-gray-800/50 p-6 rounded-2xl border border-dashed border-teal-200 dark:border-teal-800/50 text-center">
                        <Info className="w-8 h-8 text-teal-400 mx-auto mb-2 opacity-50" />
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            Belum ada analisis yang dibuat. Tekan tombol di atas untuk memerintahkan AI menganalisis komposisi belanja otomatis.
                        </p>
                    </div>
                )
            )}
            
            {loading && (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <Loader2 className="w-10 h-10 text-teal-500 animate-spin" />
                    <p className="text-teal-600 dark:text-teal-400 font-bold animate-pulse">Sedang mengevaluasi rasio belanja modal dan operasional...</p>
                </div>
            )}
        </div>
    );
};

// --- CUSTOM TOOLTIPS ---
const CustomDonutTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 min-w-[200px] z-50">
                <div className="flex items-center gap-2 mb-2 border-b border-gray-100 dark:border-gray-800 pb-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.fill }}></div>
                    <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">{data.name}</p>
                </div>
                <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-gray-500 dark:text-gray-400 font-medium">Nilai</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200">{formatCurrency(data.value)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 dark:text-gray-400 font-medium">Proporsi</span>
                    <span className="font-bold text-teal-600 dark:text-teal-400">
                        {data.persenPagu ? `${data.persenPagu.toFixed(2)}% dari Pagu` : `${data.percent.toFixed(2)}%`}
                    </span>
                </div>
            </div>
        );
    }
    return null;
};

const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 min-w-[240px] z-50">
                <p className="font-bold text-gray-800 dark:text-gray-100 text-sm mb-3 border-b border-gray-100 dark:border-gray-800 pb-2">{label}</p>
                
                {payload.map((entry, index) => (
                    <div key={`item-${index}`} className="flex flex-col mb-2 last:mb-0">
                        <div className="flex justify-between items-center text-xs mb-1">
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

// --- CUSTOM LEGEND ---
const renderCustomLegend = (props) => {
    const { payload } = props;
    return (
        <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 flex flex-col justify-center scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
            {payload.map((entry, index) => (
                <div key={`item-${index}`} className="flex items-center gap-3 cursor-help group">
                    <div className="w-3.5 h-3.5 rounded-full shrink-0 group-hover:scale-125 transition-transform" style={{ backgroundColor: entry.color }}></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium leading-snug break-words group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
                        {entry.value}
                    </span>
                </div>
            ))}
        </div>
    );
};

// --- MAIN COMPONENT ---
const AnalisisKualitasBelanjaView = ({ data, theme, selectedYear, userCanUseAi }) => {
    const { anggaran, realisasi, realisasiNonRkud } = data;
    const [selectedSkpd, setSelectedSkpd] = useState('Semua SKPD');
    const [startMonth, setStartMonth] = useState(MONTHS_ARRAY[0]);
    const [endMonth, setEndMonth] = useState(MONTHS_ARRAY[MONTHS_ARRAY.length - 1]);
    const [activePaguIndex, setActivePaguIndex] = useState(-1);
    const [activeRealisasiIndex, setActiveRealisasiIndex] = useState(-1);

    const skpdList = useMemo(() => {
        const skpds = new Set((anggaran || []).map(item => item.NamaSKPD).filter(Boolean));
        return Array.from(skpds).sort();
    }, [anggaran]);

    // Klasifikasi by Code (Untuk Anggaran & Realisasi RKUD)
    const classifyRekeningByCode = (kodeRekening) => {
        if (!kodeRekening) return 'Lainnya';
        const kode = String(kodeRekening);
        if (kode.startsWith('5.2')) return 'Belanja Modal';
        if (kode.startsWith('5.1.01')) return 'Belanja Pegawai';
        if (kode.startsWith('5.1.02')) return 'Belanja Barang & Jasa';
        if (kode.startsWith('5.1.05') || kode.startsWith('5.1.06')) return 'Belanja Transfer';
        if (kode.startsWith('5.3')) return 'Belanja Tak Terduga';
        return 'Lainnya';
    };

    // Klasifikasi by Name (Untuk Non-RKUD)
    const classifyRekeningByName = (namaRekening) => {
        if (!namaRekening) return 'Lainnya';
        const nama = String(namaRekening).toUpperCase();
        if (nama.includes('MODAL')) return 'Belanja Modal';
        if (nama.includes('PEGAWAI')) return 'Belanja Pegawai';
        if (nama.includes('BARANG') && nama.includes('JASA')) return 'Belanja Barang & Jasa';
        if (nama.includes('TRANSFER')) return 'Belanja Transfer';
        return 'Lainnya';
    };

    const qualityStats = useMemo(() => {
        const initialStats = {
            'Belanja Modal': { pagu: 0, realisasi: 0 },
            'Belanja Pegawai': { pagu: 0, realisasi: 0 },
            'Belanja Barang & Jasa': { pagu: 0, realisasi: 0 },
            'Belanja Transfer': { pagu: 0, realisasi: 0 },
            'Belanja Tak Terduga': { pagu: 0, realisasi: 0 },
            'Lainnya': { pagu: 0, realisasi: 0 },
        };

        const filteredAnggaran = selectedSkpd === 'Semua SKPD' ? (anggaran || []) : (anggaran || []).filter(item => item.NamaSKPD === selectedSkpd);
        
        filteredAnggaran.forEach(item => {
            const category = classifyRekeningByCode(item.KodeRekening);
            initialStats[category].pagu += (item.nilai || 0);
        });

        const startIndex = MONTHS_ARRAY.indexOf(startMonth);
        const endIndex = MONTHS_ARRAY.indexOf(endMonth);
        const actualStart = Math.min(startIndex, endIndex);
        const actualEnd = Math.max(startIndex, endIndex);
        const selectedMonths = MONTHS_ARRAY.slice(actualStart, actualEnd + 1);

        const realisasiBulanIni = selectedMonths.map(month => (realisasi || {})[month] || []).flat();
        const nonRkudBulanIni = selectedMonths.map(month => (realisasiNonRkud || {})[month] || []).flat();
        
        const filteredRealisasi = selectedSkpd === 'Semua SKPD' ? realisasiBulanIni : realisasiBulanIni.filter(item => item.NamaSKPD === selectedSkpd);
        const filteredNonRkud = selectedSkpd === 'Semua SKPD' ? nonRkudBulanIni : nonRkudBulanIni.filter(item => item.NAMASKPD === selectedSkpd);

        filteredRealisasi.forEach(item => {
            const category = classifyRekeningByCode(item.KodeRekening);
            initialStats[category].realisasi += (item.nilai || 0);
        });

        filteredNonRkud.forEach(item => {
            const category = classifyRekeningByName(item.NAMAREKENING);
            initialStats[category].realisasi += (item.nilai || 0);
        });
        
        const totalPagu = Object.values(initialStats).reduce((sum, item) => sum + item.pagu, 0);
        const totalRealisasi = Object.values(initialStats).reduce((sum, item) => sum + item.realisasi, 0);
        
        const tableData = Object.entries(initialStats).map(([name, values]) => ({
            name,
            ...values,
            persenPagu: totalPagu > 0 ? (values.pagu / totalPagu) * 100 : 0,
            persenRealisasi: totalRealisasi > 0 ? (values.realisasi / totalRealisasi) * 100 : 0,
            penyerapan: values.pagu > 0 ? (values.realisasi / values.pagu) * 100 : 0,
        }));

        // Data for Charts
        const paguChartData = tableData
            .filter(d => d.pagu > 0)
            .map(d => ({
                name: d.name,
                value: d.pagu,
                persenPagu: d.persenPagu,
                fill: PIE_COLORS[d.name]
            }))
            .sort((a, b) => b.value - a.value);

        const realisasiChartData = tableData
            .filter(d => d.realisasi > 0)
            .map(d => ({ 
                name: d.name, 
                value: d.realisasi,
                fill: PIE_COLORS[d.name]
            }))
            .sort((a, b) => b.value - a.value);

        // Calculate total percentages for formatting
        const totalRealisasiChartValue = realisasiChartData.reduce((sum, item) => sum + item.value, 0);
        const formattedRealisasiChartData = realisasiChartData.map(item => ({
            ...item,
            percent: totalRealisasiChartValue > 0 ? (item.value / totalRealisasiChartValue) * 100 : 0
        }));
        
        // Metrik Kualitas
        const belanjaModal = tableData.find(d => d.name === 'Belanja Modal') || { pagu: 0, realisasi: 0, penyerapan: 0 };
        const belanjaOperasi = ['Belanja Pegawai', 'Belanja Barang & Jasa', 'Belanja Transfer', 'Lainnya']
            .reduce((acc, cat) => {
                const item = tableData.find(d => d.name === cat) || { pagu: 0, realisasi: 0 };
                return {
                    pagu: acc.pagu + item.pagu,
                    realisasi: acc.realisasi + item.realisasi
                };
            }, { pagu: 0, realisasi: 0 });
        
        const rasioModal = totalPagu > 0 ? (belanjaModal.pagu / totalPagu) * 100 : 0;
        const rasioOperasi = totalPagu > 0 ? (belanjaOperasi.pagu / totalPagu) * 100 : 0;
        
        // Skor Kualitas (0-100)
        let skorKualitas = 0;
        if (rasioModal >= 30) skorKualitas += 40;
        else if (rasioModal >= 20) skorKualitas += 30;
        else if (rasioModal >= 10) skorKualitas += 20;
        else skorKualitas += 10;
        
        if (belanjaModal.penyerapan >= 80) skorKualitas += 30;
        else if (belanjaModal.penyerapan >= 60) skorKualitas += 20;
        else if (belanjaModal.penyerapan >= 40) skorKualitas += 10;
        
        if (totalRealisasi > 0 && totalPagu > 0) {
            const penyerapanTotal = (totalRealisasi / totalPagu) * 100;
            if (penyerapanTotal >= 80) skorKualitas += 30;
            else if (penyerapanTotal >= 60) skorKualitas += 20;
            else if (penyerapanTotal >= 40) skorKualitas += 10;
        }
        
        return { 
            tableData, 
            paguChartData, 
            formattedRealisasiChartData,
            totalPagu, 
            totalRealisasi,
            belanjaModal,
            belanjaOperasi,
            rasioModal,
            rasioOperasi,
            skorKualitas
        };

    }, [anggaran, realisasi, realisasiNonRkud, selectedSkpd, startMonth, endMonth]);

    const getAnalysisPrompt = (customQuery) => {
        if (customQuery) {
            return `Berdasarkan data kualitas belanja, berikan analisis untuk: "${customQuery}"`;
        }
        if (qualityStats.totalPagu === 0) return "Data anggaran tidak cukup untuk analisis.";
        
        const { totalPagu, totalRealisasi, belanjaModal, belanjaOperasi, rasioModal, rasioOperasi } = qualityStats;
        const period = startMonth === endMonth ? startMonth : `periode ${startMonth} - ${endMonth}`;

        return `
            Anda adalah seorang analis kebijakan fiskal. Lakukan analisis kualitas belanja untuk **${selectedSkpd}** pada **${period}** tahun ${selectedYear}.
            
            ### Komposisi Anggaran (Pagu)
            - **Total Anggaran Belanja**: ${formatCurrency(totalPagu)}
            - **Belanja Modal**: ${formatCurrency(belanjaModal.pagu)} (${rasioModal.toFixed(2)}%) - Idealnya >30%
            - **Belanja Operasi**: ${formatCurrency(belanjaOperasi.pagu)} (${rasioOperasi.toFixed(2)}%)
            
            ### Komposisi Realisasi (${period})
            - **Total Realisasi Belanja**: ${formatCurrency(totalRealisasi)}
            - **Realisasi Belanja Modal**: ${formatCurrency(belanjaModal.realisasi)} (Penyerapan: ${belanjaModal.penyerapan.toFixed(2)}%)
            - **Realisasi Belanja Operasi**: ${formatCurrency(belanjaOperasi.realisasi)}
            
            Berikan analisis mendalam mengenai:
            1.  **Kualitas Alokasi Anggaran**: Apakah rasio belanja modal (${rasioModal.toFixed(2)}%) sudah ideal? (Target ideal >30% untuk pembangunan jangka panjang).
            2.  **Kualitas Eksekusi Anggaran**: Bandingkan tingkat penyerapan antara belanja modal (${belanjaModal.penyerapan.toFixed(2)}%) dengan total penyerapan (${((totalRealisasi/totalPagu)*100).toFixed(2)}%). Apakah ada kendala dalam merealisasikan belanja modal?
            3.  **Rekomendasi Strategis**: Berikan rekomendasi konkret untuk meningkatkan kualitas belanja di masa depan.
        `;
    };
    
    const getScoreColor = (score) => {
        if (score >= 80) return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400';
        if (score >= 60) return 'text-amber-600 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-400';
        if (score >= 40) return 'text-orange-600 bg-orange-100 dark:bg-orange-900/40 dark:text-orange-400';
        return 'text-red-600 bg-red-100 dark:bg-red-900/40 dark:text-red-400';
    };

    const getScoreIcon = (score) => {
        if (score >= 80) return <CheckCircle className="text-emerald-600 dark:text-emerald-400" size={28} />;
        if (score >= 60) return <Award className="text-amber-600 dark:text-amber-400" size={28} />;
        if (score >= 40) return <Info className="text-orange-600 dark:text-orange-400" size={28} />;
        return <AlertTriangle className="text-red-600 dark:text-red-400" size={28} />;
    };

    // Active Shape for Donut Charts
    const renderActiveShape = (props) => {
        const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
        return (
            <g>
                <Sector
                    cx={cx}
                    cy={cy}
                    innerRadius={innerRadius}
                    outerRadius={outerRadius + 8}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    fill={fill}
                    cornerRadius={6}
                    style={{ filter: `drop-shadow(0px 4px 10px ${fill}60)`, zIndex: 10 }}
                />
            </g>
        );
    };

    return (
        <div className="space-y-8 max-w-full p-2 md:p-6 bg-gray-50/30 dark:bg-transparent min-h-screen">
            <SectionTitle>Analisis Kualitas Belanja</SectionTitle>

            {/* DEFINISI GRADIENT SVG UNTUK BAR CHART */}
            <svg width="0" height="0">
              <defs>
                <linearGradient id="colorBarPagu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.6}/>
                </linearGradient>
                <linearGradient id="colorBarRealisasi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0.6}/>
                </linearGradient>
              </defs>
            </svg>
            
            {/* DASHBOARD EKSEKUTIF */}
            <div className="bg-gradient-to-r from-teal-700 via-emerald-600 to-teal-800 rounded-3xl p-6 shadow-xl shadow-teal-500/20 text-white relative overflow-hidden mb-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mt-20 -mr-20"></div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                            <Lightbulb className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-xl uppercase tracking-wider text-teal-50">Dashboard Eksekutif</h3>
                            <p className="text-teal-100/80 text-sm mt-0.5">Pemantauan komposisi ideal belanja pembangunan daerah</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Card 1: Belanja Modal */}
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl hover:bg-white/20 transition-all flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                                    <span className="font-bold text-xs text-teal-100 uppercase tracking-wider">Rasio Belanja Modal</span>
                                </div>
                                <p className="text-3xl font-black text-white">{qualityStats.rasioModal?.toFixed(1)}%</p>
                            </div>
                            <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center text-xs">
                                <span className="text-teal-100/70">Target Ideal:</span>
                                <span className="font-bold text-emerald-300">&gt; 30%</span>
                            </div>
                        </div>

                        {/* Card 2: Penyerapan Modal */}
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl hover:bg-white/20 transition-all flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                                    <span className="font-bold text-xs text-teal-100 uppercase tracking-wider">Penyerapan Modal</span>
                                </div>
                                <p className="text-3xl font-black text-white">{qualityStats.belanjaModal?.penyerapan.toFixed(1)}%</p>
                            </div>
                            <div className="mt-4 pt-3 border-t border-white/10 text-xs text-teal-100/70 line-clamp-1">
                                Realisasi vs Pagu Modal
                            </div>
                        </div>

                        {/* Card 3: Skor Kualitas */}
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl hover:bg-white/20 transition-all flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                                        <span className="font-bold text-xs text-teal-100 uppercase tracking-wider">Skor Kualitas Belanja</span>
                                    </div>
                                    <p className="text-3xl font-black text-white">{qualityStats.skorKualitas || 0}<span className="text-lg text-teal-100/50 font-medium">/100</span></p>
                                </div>
                                <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm">
                                    <Award className="w-6 h-6 text-yellow-400" />
                                </div>
                            </div>
                            <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center text-xs font-bold">
                                <span className="text-teal-100/70 font-normal">Status:</span>
                                <span className="text-white uppercase tracking-wider">
                                    {qualityStats.skorKualitas >= 80 ? 'Sangat Baik' : 
                                     qualityStats.skorKualitas >= 60 ? 'Baik' :
                                     qualityStats.skorKualitas >= 40 ? 'Cukup' : 'Perlu Perbaikan'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <GeminiAnalysis 
                getAnalysisPrompt={getAnalysisPrompt} 
                disabledCondition={qualityStats.totalPagu === 0} 
                userCanUseAi={userCanUseAi}
            />
            
            <div className="bg-white dark:bg-gray-800 p-4 md:p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700">
                {/* FILTER SECTION */}
                <div className="flex flex-col xl:flex-row gap-6 mb-8 items-end">
                    <div className="w-full xl:w-1/3 relative">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Filter SKPD</label>
                        <select
                            value={selectedSkpd}
                            onChange={(e) => setSelectedSkpd(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all font-medium appearance-none"
                        >
                            <option value="Semua SKPD">🏢 Keseluruhan SKPD</option>
                            {skpdList.map(skpd => <option key={skpd} value={skpd}>{skpd}</option>)}
                        </select>
                    </div>
                    <div className="w-full xl:w-2/3">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Rentang Periode Realisasi</label>
                        <div className="grid grid-cols-2 gap-4">
                            <select value={startMonth} onChange={e => setStartMonth(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all font-medium appearance-none">
                                {MONTHS_ARRAY.map(month => <option key={`start-${month}`} value={month}>Mulai: {month}</option>)}
                            </select>
                            <select value={endMonth} onChange={e => setEndMonth(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all font-medium appearance-none">
                                {MONTHS_ARRAY.map(month => <option key={`end-${month}`} value={month}>Sampai: {month}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {qualityStats.totalPagu > 0 ? (
                    <div className="animate-in fade-in duration-500">
                        {/* Key Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-800">
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total Pagu</p>
                                <p className="text-xl font-bold text-gray-800 dark:text-white">{formatCurrency(qualityStats.totalPagu)}</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-800">
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total Realisasi</p>
                                <p className="text-xl font-bold text-teal-600 dark:text-teal-400">{formatCurrency(qualityStats.totalRealisasi)}</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-800">
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Penyerapan Total</p>
                                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                    {qualityStats.totalPagu > 0 ? ((qualityStats.totalRealisasi / qualityStats.totalPagu) * 100).toFixed(2) : 0}%
                                </p>
                            </div>
                            <div className={`p-5 rounded-2xl border flex items-center justify-between transition-colors ${getScoreColor(qualityStats.skorKualitas)} ${qualityStats.skorKualitas >= 80 ? 'border-emerald-200 dark:border-emerald-800/50' : qualityStats.skorKualitas >= 60 ? 'border-amber-200 dark:border-amber-800/50' : qualityStats.skorKualitas >= 40 ? 'border-orange-200 dark:border-orange-800/50' : 'border-red-200 dark:border-red-800/50'}`}>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider mb-1 opacity-80">Skor Kualitas</p>
                                    <p className="text-2xl font-black">{qualityStats.skorKualitas}</p>
                                </div>
                                <div className="bg-white/40 dark:bg-black/20 p-2 rounded-xl backdrop-blur-sm">
                                    {getScoreIcon(qualityStats.skorKualitas)}
                                </div>
                            </div>
                        </div>

                        {/* Donut Charts (Modern ECharts Style) */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                            <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                <div className="mb-6 border-b border-gray-100 dark:border-gray-700 pb-4 text-center">
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center justify-center gap-2">
                                        <span className="w-2 h-6 bg-blue-500 rounded-full inline-block"></span>
                                        Komposisi Pagu Anggaran
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Struktur alokasi belanja (Target ideal Modal &gt;30%)</p>
                                </div>
                                
                                <div className="w-full relative flex justify-center">
                                    <ResponsiveContainer width="99%" height={320}>
                                        <PieChart>
                                            <Tooltip content={<CustomDonutTooltip />} cursor={{fill: 'transparent'}} />
                                            <Legend 
                                                content={renderCustomLegend}
                                                layout="vertical" 
                                                verticalAlign="middle" 
                                                align="right"
                                                wrapperStyle={{ width: '45%', right: -10, top: '50%', transform: 'translateY(-50%)' }}
                                            />
                                            <Pie
                                                data={qualityStats.paguChartData}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="40%"
                                                cy="50%"
                                                innerRadius={80}
                                                outerRadius={120}
                                                paddingAngle={4}
                                                cornerRadius={6}
                                                stroke="none"
                                                activeIndex={activePaguIndex}
                                                activeShape={renderActiveShape}
                                                onMouseEnter={(_, index) => setActivePaguIndex(index)}
                                                onMouseLeave={() => setActivePaguIndex(-1)}
                                            >
                                                {qualityStats.paguChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} style={{ outline: 'none', cursor: 'pointer' }} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    {/* Inner Text */}
                                    <div className="absolute top-1/2 left-[40%] -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</p>
                                        <p className="text-lg font-black text-gray-800 dark:text-white leading-tight">100%</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                <div className="mb-6 border-b border-gray-100 dark:border-gray-700 pb-4 text-center">
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center justify-center gap-2">
                                        <span className="w-2 h-6 bg-teal-500 rounded-full inline-block"></span>
                                        Komposisi Realisasi
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Proporsi serapan aktual ({startMonth} - {endMonth})</p>
                                </div>
                                
                                <div className="w-full relative flex justify-center">
                                    <ResponsiveContainer width="99%" height={320}>
                                        <PieChart>
                                            <Tooltip content={<CustomDonutTooltip />} cursor={{fill: 'transparent'}} />
                                            <Legend 
                                                content={renderCustomLegend}
                                                layout="vertical" 
                                                verticalAlign="middle" 
                                                align="right"
                                                wrapperStyle={{ width: '45%', right: -10, top: '50%', transform: 'translateY(-50%)' }}
                                            />
                                            <Pie
                                                data={qualityStats.formattedRealisasiChartData}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="40%"
                                                cy="50%"
                                                innerRadius={80}
                                                outerRadius={120}
                                                paddingAngle={4}
                                                cornerRadius={6}
                                                stroke="none"
                                                activeIndex={activeRealisasiIndex}
                                                activeShape={renderActiveShape}
                                                onMouseEnter={(_, index) => setActiveRealisasiIndex(index)}
                                                onMouseLeave={() => setActiveRealisasiIndex(-1)}
                                            >
                                                {qualityStats.formattedRealisasiChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} style={{ outline: 'none', cursor: 'pointer' }} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    {/* Inner Text */}
                                    <div className="absolute top-1/2 left-[40%] -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Realisasi</p>
                                        <p className="text-lg font-black text-teal-600 dark:text-teal-400 leading-tight">
                                            {qualityStats.totalPagu > 0 ? ((qualityStats.totalRealisasi / qualityStats.totalPagu) * 100).toFixed(1) : 0}%
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bar Chart Perbandingan Pagu vs Realisasi (Modern Composed Chart) */}
                        <div className="mb-10 bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                            <div className="mb-8 border-b border-gray-100 dark:border-gray-700 pb-4">
                                <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                                    <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg">
                                        <TrendingUp size={20} className="text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    Perbandingan Pagu vs Realisasi Kategori Belanja
                                </h3>
                            </div>
                            
                            <div className="w-full mt-4">
                                <ResponsiveContainer width="99%" height={380}>
                                    <ComposedChart data={qualityStats.tableData.filter(d => d.pagu > 0)} margin={{ top: 20, right: 20, left: 10, bottom: 30 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128, 128, 128, 0.15)" />
                                        <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 500, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} dy={10} />
                                        <YAxis yAxisId="left" tickFormatter={(val) => `${(val / 1e9).toFixed(0)}M`} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                        <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tickFormatter={(val) => `${val}%`} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} />
                                        <Legend wrapperStyle={{ paddingTop: '25px', fontWeight: 600, fontSize: '13px', color: '#475569' }} iconType="circle" />
                                        
                                        <Bar yAxisId="left" dataKey="pagu" fill="url(#colorBarPagu)" name="Pagu Anggaran" radius={[6, 6, 0, 0]} barSize={40} />
                                        <Bar yAxisId="left" dataKey="realisasi" fill="url(#colorBarRealisasi)" name="Nilai Realisasi" radius={[6, 6, 0, 0]} barSize={40} />
                                        <Line yAxisId="right" type="monotone" dataKey="penyerapan" stroke="#F59E0B" strokeWidth={3} dot={{ r: 5, fill: '#F59E0B', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 8 }} name="Penyerapan (%)" />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Tabel Detail */}
                        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm mb-6">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-800/80">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Jenis Belanja</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pagu Anggaran</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Realisasi</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Proporsi Pagu</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Proporsi Serapan</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Penyerapan Aktual</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700/50">
                                    {qualityStats.tableData.map(item => (
                                        <tr key={item.name} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center">
                                                <span className="w-3 h-3 rounded-full mr-3 shadow-sm" style={{ backgroundColor: PIE_COLORS[item.name] }}></span>
                                                {item.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-600 dark:text-gray-300">{formatCurrency(item.pagu)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-teal-600 dark:text-teal-400">{formatCurrency(item.realisasi)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-500">{item.persenPagu.toFixed(2)}%</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-500">{item.persenRealisasi.toFixed(2)}%</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-black">
                                                <span className={`px-3 py-1.5 rounded-lg inline-block min-w-[70px] text-center ${
                                                    item.penyerapan >= 80 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                    item.penyerapan >= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                    {item.penyerapan.toFixed(1)}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Catatan Kaki */}
                        <div className="flex flex-wrap justify-center gap-6 mt-8 text-xs font-medium text-gray-500 dark:text-gray-400 p-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-700/50">
                            <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> Belanja Modal (Investasi)</span>
                            <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-red-500"></div> Belanja Pegawai (Rutin)</span>
                            <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div> Barang & Jasa (Operasional)</span>
                            <span className="flex items-center gap-2 border-l border-gray-300 dark:border-gray-600 pl-6 ml-2">🏆 Skor {qualityStats.skorKualitas}/100 (Indeks Kualitas)</span>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/30 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
                        <div className="mx-auto w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                            <AlertTriangle className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">Data Tidak Tersedia</p>
                        <p className="text-sm text-gray-500">Silakan unggah data anggaran dan realisasi terlebih dahulu atau ubah filter SKPD.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalisisKualitasBelanjaView;