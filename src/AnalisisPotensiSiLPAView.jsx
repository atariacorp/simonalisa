import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Coins, 
  Calendar, 
  PieChart,
  Bot,
  Sparkles,
  Loader2,
  RefreshCw
} from 'lucide-react';

// --- UTILITIES ---
const formatCurrency = (value) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// --- SUB-COMPONENTS ---

const SectionTitle = ({ children }) => (
  <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 border-b-2 border-purple-500 pb-2 inline-block">
    {children}
  </h2>
);

const GeminiAnalysis = ({ getAnalysisPrompt, disabledCondition, theme, selectedYear, userRole }) => {
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateAnalysis = async () => {
    if (disabledCondition) return;
    
    setLoading(true);
    setError(null);
    const apiKey = ""; // Environment provides key
    const prompt = getAnalysisPrompt("Berikan analisis mendalam mengenai potensi SiLPA tahun berjalan berdasarkan data yang ada, identifikasi SKPD berisiko tinggi, dan berikan rekomendasi mitigasi.");

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
              parts: [{ text: `Anda adalah pakar keuangan daerah di Indonesia. Analisis data berdasarkan PP 12/2019. Gunakan bahasa yang profesional namun mudah dimengerti oleh ${userRole}.` }] 
            }
          })
        }
      );

      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      setAnalysis(text || "Gagal menghasilkan analisis.");
    } catch (err) {
      setError("Gagal menghubungi AI. Silakan coba lagi nanti.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-purple-900/20 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 mb-8 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bot className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2">
            AI Insight: Analisis Strategis
            <Sparkles className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          </h3>
        </div>
        <button
          onClick={generateAnalysis}
          disabled={loading || disabledCondition}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
            loading || disabledCondition 
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg active:scale-95'
          }`}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {analysis ? 'Perbarui Analisis' : 'Mulai Analisis AI'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-100 text-red-700 rounded-lg mb-4 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {analysis ? (
        <div className="prose prose-indigo dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
          {analysis}
        </div>
      ) : (
        !loading && (
          <p className="text-gray-500 dark:text-gray-400 italic text-sm">
            Klik tombol di atas untuk mendapatkan analisis otomatis dari AI mengenai potensi SiLPA berdasarkan tren realisasi saat ini.
          </p>
        )
      )}
      
      {loading && (
        <div className="flex flex-col items-center py-10 gap-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-indigo-600 dark:text-indigo-400 font-medium animate-pulse">Menghitung proyeksi dan menganalisis risiko...</p>
        </div>
      )}
    </div>
  );
};

// --- MAIN VIEW COMPONENT ---

const AnalisisPotensiSiLPAView = ({ data = {}, theme, selectedYear, userRole }) => {
    // Fallback default data structure if props are missing
    const { 
        anggaran = [], 
        realisasi = {}, 
        realisasiNonRkud = {} 
    } = data;

    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    const COLORS = {
        anggaran: '#435EBE',
        realisasi: '#10B981',
        proyeksi: '#F59E0B',
        silpa: '#EF4444'
    };

    const lastMonthWithData = useMemo(() => {
        for (let i = months.length - 1; i >= 0; i--) {
            const hasRkud = realisasi[months[i]] && realisasi[months[i]].length > 0;
            const hasNonRkud = realisasiNonRkud[months[i]] && realisasiNonRkud[months[i]].length > 0;
            if (hasRkud || hasNonRkud) return months[i];
        }
        return months[0];
    }, [realisasi, realisasiNonRkud, months]);

    const [projectionMonth, setProjectionMonth] = useState(lastMonthWithData);
    const [riskLevel, setRiskLevel] = useState('semua');
    
    useEffect(() => {
        setProjectionMonth(lastMonthWithData);
    }, [lastMonthWithData]);

    const silpaData = useMemo(() => {
        const skpdAnggaranMap = new Map();
        (anggaran || []).forEach(item => {
            const skpd = item.NamaSKPD || 'Tanpa SKPD';
            skpdAnggaranMap.set(skpd, (skpdAnggaranMap.get(skpd) || 0) + item.nilai);
        });

        const projectionMonthIndex = months.indexOf(projectionMonth);
        const monthsPassed = projectionMonthIndex + 1;
        const monthsRemaining = 12 - monthsPassed;
        const passedMonths = months.slice(0, monthsPassed);

        const skpdRealisasiMap = new Map();
        passedMonths.forEach(month => {
            (realisasi[month] || []).forEach(item => {
                const skpd = item.NamaSKPD || 'Tanpa SKPD';
                skpdRealisasiMap.set(skpd, (skpdRealisasiMap.get(skpd) || 0) + item.nilai);
            });
            (realisasiNonRkud[month] || []).forEach(item => {
                const skpd = item.NAMASKPD || 'Tanpa SKPD';
                skpdRealisasiMap.set(skpd, (skpdRealisasiMap.get(skpd) || 0) + item.nilai);
            });
        });

        const tableData = Array.from(skpdAnggaranMap.keys()).map(skpd => {
            const totalAnggaran = skpdAnggaranMap.get(skpd) || 0;
            const realisasiHinggaSaatIni = skpdRealisasiMap.get(skpd) || 0;
            
            const rataRataBulanan = monthsPassed > 0 ? realisasiHinggaSaatIni / monthsPassed : 0;
            const proyeksiSisaBulan = rataRataBulanan * monthsRemaining;
            const proyeksiAkhirTahun = realisasiHinggaSaatIni + proyeksiSisaBulan;
            
            const potensiSiLPA = Math.max(0, totalAnggaran - proyeksiAkhirTahun);
            const persenSiLPA = totalAnggaran > 0 ? (potensiSiLPA / totalAnggaran) * 100 : 0;
            
            let riskCategory = 'aman';
            if (persenSiLPA >= 20) riskCategory = 'kritis';
            else if (persenSiLPA >= 10) riskCategory = 'waspada';

            return { 
                skpd, 
                totalAnggaran, 
                realisasiHinggaSaatIni, 
                proyeksiAkhirTahun, 
                potensiSiLPA, 
                persenSiLPA,
                riskCategory
            };
        }).sort((a, b) => b.potensiSiLPA - a.potensiSiLPA);
        
        const totals = tableData.reduce((acc, curr) => ({
            totalAnggaran: acc.totalAnggaran + curr.totalAnggaran,
            potensiSiLPA: acc.potensiSiLPA + curr.potensiSiLPA,
        }), { totalAnggaran: 0, potensiSiLPA: 0 });
        
        const filteredData = riskLevel === 'semua' 
            ? tableData 
            : tableData.filter(item => item.riskCategory === riskLevel);
            
        const chartData = filteredData.slice(0, 10);

        return { 
            tableData, 
            filteredData,
            totals, 
            chartData,
            monthsPassed,
            monthsRemaining
        };
    }, [anggaran, realisasi, realisasiNonRkud, projectionMonth, riskLevel, months]);

    const getAnalysisPrompt = (customQuery) => {
        return `Data Potensi SiLPA untuk tahun ${selectedYear}: 
        Total Pagu: ${formatCurrency(silpaData.totals.totalAnggaran)}, 
        Estimasi SiLPA: ${formatCurrency(silpaData.totals.potensiSiLPA)} (${((silpaData.totals.potensiSiLPA / silpaData.totals.totalAnggaran) * 100).toFixed(2)}%).
        Bulan berjalan: ${projectionMonth}.
        SKPD Teratas dengan SiLPA: ${silpaData.chartData.map(d => `${d.skpd}: ${d.persenSiLPA.toFixed(1)}%`).join(', ')}.
        Pertanyaan: ${customQuery}`;
    };

    return (
        <div className="space-y-6 max-w-full p-2 md:p-6">
            <SectionTitle>Analisis Potensi SiLPA</SectionTitle>
            
            <div className="mb-4 p-5 bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-600 rounded-r-2xl shadow-sm">
                <div className="flex items-start gap-4">
                    <div className="bg-purple-100 dark:bg-purple-800 p-2 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-purple-700 dark:text-purple-200" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-purple-800 dark:text-purple-300 text-lg mb-1 uppercase tracking-wide">
                            Dashboard Proyeksi SiLPA
                        </h3>
                        <p className="text-sm text-purple-700 dark:text-purple-400">
                            Estimasi sisa anggaran di akhir tahun berdasarkan tren belanja rata-rata bulanan. 
                            Membantu identifikasi dini SKPD dengan penyerapan rendah sesuai PP 12/2019.
                        </p>
                    </div>
                </div>
            </div>

            <GeminiAnalysis 
                getAnalysisPrompt={getAnalysisPrompt}
                disabledCondition={!silpaData.tableData || silpaData.tableData.length === 0}
                theme={theme}
                selectedYear={selectedYear}
                userRole={userRole}
            />
            
            <div className="bg-white dark:bg-gray-800 p-4 md:p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700">
                {/* Controls & Summary */}
                <div className="flex flex-col lg:flex-row gap-6 mb-10 items-end">
                    <div className="w-full lg:w-1/4">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            <Calendar className="w-4 h-4 text-indigo-500" />
                            Proyeksi s/d Bulan:
                        </label>
                        <select
                            value={projectionMonth}
                            onChange={(e) => setProjectionMonth(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                        >
                            {months.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    
                    <div className="w-full lg:w-1/4">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                            Filter Tingkat Risiko:
                        </label>
                        <select
                            value={riskLevel}
                            onChange={(e) => setRiskLevel(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                        >
                            <option value="semua">Semua SKPD</option>
                            <option value="kritis">Kritis (&gt; 20%)</option>
                            <option value="waspada">Waspada (10-20%)</option>
                            <option value="aman">Aman (&lt; 10%)</option>
                        </select>
                    </div>
                    
                    <div className="flex-1 flex justify-end w-full">
                        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-[2px] rounded-2xl w-full md:w-auto shadow-lg">
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-[14px] flex items-center gap-4">
                                <div className="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-xl">
                                    <Coins className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Potensi SiLPA</p>
                                    <p className="text-2xl font-black text-purple-700 dark:text-purple-400">
                                        {formatCurrency(silpaData.totals?.potensiSiLPA || 0)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-600 hover:shadow-md transition-shadow">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Total Pagu Anggaran</p>
                        <p className="text-lg font-bold text-gray-800 dark:text-white">
                            {formatCurrency(silpaData.totals?.totalAnggaran || 0)}
                        </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-600 hover:shadow-md transition-shadow">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Bulan dengan Data</p>
                        <p className="text-lg font-bold text-blue-600 flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            {silpaData.monthsPassed || 0} bulan
                        </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-600 hover:shadow-md transition-shadow">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Estimasi Sisa Bulan</p>
                        <p className="text-lg font-bold text-yellow-600 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            {silpaData.monthsRemaining || 0} bulan
                        </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-600 hover:shadow-md transition-shadow">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Rasio SiLPA Pagu</p>
                        <p className={`text-lg font-bold flex items-center gap-2 ${
                            (silpaData.totals?.potensiSiLPA / silpaData.totals?.totalAnggaran) > 0.1 ? 'text-red-500' : 'text-green-600'
                        }`}>
                            <PieChart className="w-5 h-5" />
                            {silpaData.totals?.totalAnggaran > 0 ? ((silpaData.totals?.potensiSiLPA / silpaData.totals?.totalAnggaran) * 100).toFixed(2) : 0}%
                        </p>
                    </div>
                </div>

                {/* Main Chart */}
                {silpaData.chartData && silpaData.chartData.length > 0 ? (
                    <div className="bg-gray-50 dark:bg-gray-900/30 p-4 md:p-8 rounded-3xl border border-gray-100 dark:border-gray-700 mb-10 shadow-inner">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-2 h-8 bg-purple-600 rounded-full"></div>
                            <h3 className="font-bold text-xl text-gray-900 dark:text-white">
                                Top 10 SKPD dengan Potensi SiLPA Tertinggi
                            </h3>
                        </div>
                        <div className="h-[500px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={silpaData.chartData} margin={{ top: 20, right: 30, left: 40, bottom: 120 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                    <XAxis 
                                        dataKey="skpd" 
                                        angle={-45} 
                                        textAnchor="end" 
                                        interval={0} 
                                        height={100} 
                                        tick={{ fontSize: 11, fill: '#6b7280' }}
                                    />
                                    <YAxis 
                                        tickFormatter={(val) => `${(val / 1e9).toFixed(1)}M`} 
                                        tick={{ fontSize: 12, fill: '#6b7280' }}
                                        label={{ value: 'Nilai (Miliar IDR)', angle: -90, position: 'insideLeft', offset: -20, fill: '#6b7280' }}
                                    />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#fff' }}
                                        formatter={(value) => [formatCurrency(value), '']} 
                                    />
                                    <Legend verticalAlign="top" height={36}/>
                                    <Bar 
                                        dataKey="totalAnggaran" 
                                        fill="#435EBE" 
                                        name="Pagu Anggaran" 
                                        radius={[4, 4, 0, 0]} 
                                        barSize={40}
                                    />
                                    <Bar 
                                        dataKey="potensiSiLPA" 
                                        fill="#EF4444" 
                                        name="Estimasi SiLPA" 
                                        radius={[4, 4, 0, 0]} 
                                        barSize={40}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                ) : (
                    <div className="py-20 text-center bg-gray-50 dark:bg-gray-900/20 rounded-3xl mb-10 border border-dashed border-gray-300">
                        <p className="text-gray-500">Data grafik tidak tersedia dengan filter saat ini.</p>
                    </div>
                )}

                {/* Detailed Table */}
                <div className="relative">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
                        <h3 className="font-bold text-xl text-gray-900 dark:text-white">
                            Rincian Estimasi Per SKPD
                        </h3>
                    </div>
                    <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nama SKPD</th>
                                    <th className="px-6 py-4 text-right text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pagu Anggaran</th>
                                    <th className="px-6 py-4 text-right text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">Potensi SiLPA</th>
                                    <th className="px-6 py-4 text-right text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">% SiLPA</th>
                                    <th className="px-6 py-4 text-center text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tingkat Risiko</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                                {silpaData.filteredData && silpaData.filteredData.length > 0 ? silpaData.filteredData.map((item, idx) => (
                                    <tr key={item.skpd} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                            {item.skpd}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600 dark:text-gray-300">
                                            {formatCurrency(item.totalAnggaran)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-purple-700 dark:text-purple-400">
                                            {formatCurrency(item.potensiSiLPA)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600 dark:text-gray-300">
                                            {item.persenSiLPA.toFixed(2)}%
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                                                item.riskCategory === 'kritis' 
                                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' 
                                                    : item.riskCategory === 'waspada' 
                                                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' 
                                                        : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                            }`}>
                                                {item.riskCategory === 'kritis' && <AlertCircle className="w-3 h-3" />}
                                                {item.riskCategory === 'waspada' && <AlertTriangle className="w-3 h-3" />}
                                                {item.riskCategory === 'aman' && <CheckCircle2 className="w-3 h-3" />}
                                                {item.riskCategory}
                                            </span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="text-center py-20 text-gray-400 italic">
                                            Tidak ada data untuk kriteria filter yang dipilih.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Export as default App for the environment
export default AnalisisPotensiSiLPAView;