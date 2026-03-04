import React from 'react';
import SectionTitle from './SectionTitle';
import { exp } from "firebase/firestore/pipelines";

// --- UPDATED AnalisisLintasTahunView Component ---
const AnalisisLintasTahunView = ({ theme, user, selectedYear, namaPemda }) => {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    
    const [yearA, setYearA] = React.useState(selectedYear);
    const [yearB, setYearB] = React.useState(selectedYear - 1);
    const [startMonth, setStartMonth] = React.useState(months[0]);
    const [endMonth, setEndMonth] = React.useState(months[months.length - 1]);
    const [dataA, setDataA] = React.useState(null);
    const [dataB, setDataB] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [selectedSkpdBelanja, setSelectedSkpdBelanja] = React.useState('Semua SKPD');
    const [selectedSkpdPendapatan, setSelectedSkpdPendapatan] = React.useState('Semua SKPD');

    const fetchDataForYear = async (year) => {
        if (!user) return null;
        const dataTypes = ['anggaran', 'pendapatan', 'penerimaanPembiayaan', 'pengeluaranPembiayaan', 'realisasi', 'realisasiPendapatan', 'realisasiNonRkud'];
        const yearData = {};

        for (const dataType of dataTypes) {
            const collRef = collection(db, "publicData", String(year), dataType);
            const snapshot = await getDocs(query(collRef));
            let data = [];
            snapshot.forEach(doc => {
                data = [...data, ...doc.data().data];
            });
            
            if (dataType === 'realisasi' || dataType === 'realisasiPendapatan' || dataType === 'realisasiNonRkud') {
                const monthlyData = data.reduce((acc, item) => {
                    const month = item.month || 'Lainnya';
                    if (!acc[month]) acc[month] = [];
                    acc[month].push(item);
                    return acc;
                }, {});
                yearData[dataType] = monthlyData;
            } else {
                yearData[dataType] = data;
            }
        }
        return yearData;
    };

    React.useEffect(() => {
        const loadComparisonData = async () => {
            if (yearA === yearB) {
                setError("Silakan pilih dua tahun yang berbeda untuk perbandingan.");
                setDataA(null); setDataB(null);
                return;
            }
            setError(''); setIsLoading(true);
            try {
                const [fetchedDataA, fetchedDataB] = await Promise.all([
                    fetchDataForYear(yearA),
                    fetchDataForYear(yearB)
                ]);
                setDataA(fetchedDataA); setDataB(fetchedDataB);
            } catch (e) {
                console.error("Error fetching comparison data:", e);
                setError("Gagal memuat data perbandingan.");
            } finally {
                setIsLoading(false);
            }
        };

        if(user) { loadComparisonData(); }
    }, [yearA, yearB, user]);

    const { skpdListBelanja, skpdListPendapatan, comparisonData, skpdBelanjaComparison, skpdPendapatanComparison, monthlyComparisonData, monthlyPendapatanComparisonData } = React.useMemo(() => {
        if (!dataA || !dataB) return { skpdListBelanja: [], skpdListPendapatan: [], comparisonData: null, skpdBelanjaComparison: null, skpdPendapatanComparison: null, monthlyComparisonData: [], monthlyPendapatanComparisonData: [] };
        
        const startIndex = months.indexOf(startMonth);
        const endIndex = months.indexOf(endMonth);
        const selectedMonths = months.slice(startIndex, endIndex + 1);

        const calculateTotals = (data, monthsToProcess) => {
            const realisasiBelanjaBiasa = monthsToProcess.map(month => data.realisasi?.[month] || []).flat();
            const realisasiNonRkudData = monthsToProcess.map(month => data.realisasiNonRkud?.[month] || []).flat();
            const realisasiBelanjaData = [...realisasiBelanjaBiasa, ...realisasiNonRkudData];
            const realisasiPendapatanData = monthsToProcess.map(month => data.realisasiPendapatan?.[month] || []).flat();

            return {
                anggaran: (data.anggaran || []).reduce((s, i) => s + i.nilai, 0),
                pendapatan: (data.pendapatan || []).reduce((s, i) => s + i.nilai, 0),
                realisasiBelanja: realisasiBelanjaData.reduce((s, i) => s + i.nilai, 0),
                realisasiPendapatan: realisasiPendapatanData.reduce((s, i) => s + i.nilai, 0),
            };
        };

        const totalsA = calculateTotals(dataA, selectedMonths);
        const totalsB = calculateTotals(dataB, selectedMonths);
        const periodLabel = startMonth === endMonth ? startMonth : `${startMonth} - ${endMonth}`;

        const comparisonData = [
            { name: 'Anggaran Belanja', [yearA]: totalsA.anggaran, [yearB]: totalsB.anggaran },
            { name: 'Target Pendapatan', [yearA]: totalsA.pendapatan, [yearB]: totalsB.pendapatan },
            { name: `Realisasi Belanja (${periodLabel})`, [yearA]: totalsA.realisasiBelanja, [yearB]: totalsB.realisasiBelanja },
            { name: `Realisasi Pendapatan (${periodLabel})`, [yearA]: totalsA.realisasiPendapatan, [yearB]: totalsB.realisasiPendapatan },
        ];
        
        const skpdListBelanja = Array.from(new Set([...(dataA.anggaran?.map(d => d.NamaSKPD) || []), ...(dataB.anggaran?.map(d => d.NamaSKPD) || [])])).filter(Boolean).sort();
        const skpdListPendapatan = Array.from(new Set([...(dataA.pendapatan?.map(d => d.NamaOPD) || []), ...(dataB.pendapatan?.map(d => d.NamaOPD) || [])])).filter(Boolean).sort();

        let skpdBelanjaComparison = null;
        if(selectedSkpdBelanja && selectedSkpdBelanja !== 'Semua SKPD') {
            const realisasiAData = [...selectedMonths.map(month => dataA.realisasi?.[month] || []).flat(), ...selectedMonths.map(month => dataA.realisasiNonRkud?.[month] || []).flat()];
            const realisasiBData = [...selectedMonths.map(month => dataB.realisasi?.[month] || []).flat(), ...selectedMonths.map(month => dataB.realisasiNonRkud?.[month] || []).flat()];

            const anggaranA = (dataA.anggaran || []).filter(d => d.NamaSKPD === selectedSkpdBelanja).reduce((s, i) => s + i.nilai, 0);
            const realisasiA = realisasiAData.filter(d => (d.NamaSKPD || d.NAMASKPD) === selectedSkpdBelanja).reduce((s, i) => s + i.nilai, 0);
            const anggaranB = (dataB.anggaran || []).filter(d => d.NamaSKPD === selectedSkpdBelanja).reduce((s, i) => s + i.nilai, 0);
            const realisasiB = realisasiBData.filter(d => (d.NamaSKPD || d.NAMASKPD) === selectedSkpdBelanja).reduce((s, i) => s + i.nilai, 0);
            skpdBelanjaComparison = { anggaranA, realisasiA, anggaranB, realisasiB };
        }
        
        let skpdPendapatanComparison = null;
        if(selectedSkpdPendapatan && selectedSkpdPendapatan !== 'Semua SKPD') {
            const realisasiAData = selectedMonths.map(month => dataA.realisasiPendapatan?.[month] || []).flat();
            const realisasiBData = selectedMonths.map(month => dataB.realisasiPendapatan?.[month] || []).flat();
            const targetA = (dataA.pendapatan || []).filter(d => d.NamaOPD === selectedSkpdPendapatan).reduce((s, i) => s + i.nilai, 0);
            const realisasiA = realisasiAData.filter(d => d.SKPD === selectedSkpdPendapatan).reduce((s, i) => s + i.nilai, 0);
            const targetB = (dataB.pendapatan || []).filter(d => d.NamaOPD === selectedSkpdPendapatan).reduce((s, i) => s + i.nilai, 0);
            const realisasiB = realisasiBData.filter(d => d.SKPD === selectedSkpdPendapatan).reduce((s, i) => s + i.nilai, 0);
            skpdPendapatanComparison = { targetA, realisasiA, targetB, realisasiB };
        }
        
        let cumulativeRealisasiA = 0;
        let cumulativeRealisasiB = 0;
        const monthlyComparisonData = months.map(month => {
            const realisasiBulananA_biasa = ((dataA.realisasi || {})[month] || []).filter(item => selectedSkpdBelanja === 'Semua SKPD' || item.NamaSKPD === selectedSkpdBelanja).reduce((sum, item) => sum + item.nilai, 0);
            const realisasiBulananA_nonRkud = ((dataA.realisasiNonRkud || {})[month] || []).filter(item => selectedSkpdBelanja === 'Semua SKPD' || item.NAMASKPD === selectedSkpdBelanja).reduce((sum, item) => sum + item.nilai, 0);
            const realisasiBulananA = realisasiBulananA_biasa + realisasiBulananA_nonRkud;
            const realisasiBulananB_biasa = ((dataB.realisasi || {})[month] || []).filter(item => selectedSkpdBelanja === 'Semua SKPD' || item.NamaSKPD === selectedSkpdBelanja).reduce((sum, item) => sum + item.nilai, 0);
            const realisasiBulananB_nonRkud = ((dataB.realisasiNonRkud || {})[month] || []).filter(item => selectedSkpdBelanja === 'Semua SKPD' || item.NAMASKPD === selectedSkpdBelanja).reduce((sum, item) => sum + item.nilai, 0);
            const realisasiBulananB = realisasiBulananB_biasa + realisasiBulananB_nonRkud;
            cumulativeRealisasiA += realisasiBulananA;
            cumulativeRealisasiB += realisasiBulananB;
            return { month: month.substring(0,3), [`Realisasi Kumulatif ${yearA}`]: cumulativeRealisasiA, [`Realisasi Kumulatif ${yearB}`]: cumulativeRealisasiB };
        });
// --- BLOK KODE YANG HILANG DAN DITAMBAHKAN KEMBALI ---
        let cumulativePendapatanA = 0;
        let cumulativePendapatanB = 0;
        const monthlyPendapatanComparisonData = months.map(month => {
            const realisasiBulananA = ((dataA.realisasiPendapatan || {})[month] || []).filter(item => selectedSkpdPendapatan === 'Semua SKPD' || item.SKPD === selectedSkpdPendapatan).reduce((sum, item) => sum + item.nilai, 0);
            const realisasiBulananB = ((dataB.realisasiPendapatan || {})[month] || []).filter(item => selectedSkpdPendapatan === 'Semua SKPD' || item.SKPD === selectedSkpdPendapatan).reduce((sum, item) => sum + item.nilai, 0);
            
            cumulativePendapatanA += realisasiBulananA;
            cumulativePendapatanB += realisasiBulananB;
            
            return {
                month: month.substring(0, 3),
                [`Pendapatan Kumulatif ${yearA}`]: cumulativePendapatanA,
                [`Pendapatan Kumulatif ${yearB}`]: cumulativePendapatanB,
            };
        });
        // --- AKHIR DARI BLOK KODE YANG DITAMBAHKAN ---

        return { skpdListBelanja, skpdListPendapatan, comparisonData, skpdBelanjaComparison, skpdPendapatanComparison, monthlyComparisonData, monthlyPendapatanComparisonData };
    }, [dataA, dataB, yearA, yearB, selectedSkpdBelanja, selectedSkpdPendapatan, startMonth, endMonth]);

    const getAnalysisPrompt = (customQuery) => {
        if (customQuery) {
            return `Berdasarkan data perbandingan tahun ${yearA} dan ${yearB}, berikan analisis untuk permintaan berikut: "${customQuery}"`;
        }
        if (!comparisonData) return "Data tidak cukup untuk analisis.";
        const period = startMonth === endMonth ? startMonth : `periode ${startMonth} - ${endMonth}`;
        let prompt = `Anda adalah seorang analis keuangan ahli untuk ${namaPemda || 'pemerintah daerah'}. Lakukan analisis perbandingan APBD antara tahun ${yearA} dan ${yearB} untuk **${period}**.\n\nData Ringkas:\n`;
        comparisonData.forEach(item => {
            prompt += `- ${item.name}: ${yearA} (${formatCurrency(item[yearA])}) vs ${yearB} (${formatCurrency(item[yearB])})\n`;
        });

        if (skpdBelanjaComparison && selectedSkpdBelanja && selectedSkpdBelanja !== 'Semua SKPD') {
            prompt += `\nFokus Analisis Belanja SKPD: **${selectedSkpdBelanja}**\n`;
            prompt += `- Anggaran: ${yearA} (${formatCurrency(skpdBelanjaComparison.anggaranA)}) vs ${yearB} (${formatCurrency(skpdBelanjaComparison.anggaranB)})\n`;
            prompt += `- Realisasi (${period}): ${yearA} (${formatCurrency(skpdBelanjaComparison.realisasiA)}) vs ${yearB} (${formatCurrency(skpdBelanjaComparison.realisasiB)})\n`;
        }
        
        if (skpdPendapatanComparison && selectedSkpdPendapatan && selectedSkpdPendapatan !== 'Semua SKPD') {
            prompt += `\nFokus Analisis Pendapatan SKPD: **${selectedSkpdPendapatan}**\n`;
            prompt += `- Target: ${yearA} (${formatCurrency(skpdPendapatanComparison.targetA)}) vs ${yearB} (${formatCurrency(skpdPendapatanComparison.targetB)})\n`;
            prompt += `- Realisasi (${period}): ${yearA} (${formatCurrency(skpdPendapatanComparison.realisasiA)}) vs ${yearB} (${formatCurrency(skpdPendapatanComparison.realisasiB)})\n`;
        }

        prompt += "\nBerikan analisis mendalam tentang tren, perubahan signifikan, dan kemungkinan penyebabnya. Berikan juga rekomendasi strategis berdasarkan perbandingan ini.";
        return prompt;
    };

    const ComparisonCard = ({ title, valueA, valueB, yearA, yearB }) => {
        const change = valueA - valueB;
        const percentageChange = valueB !== 0 ? (change / valueB) * 100 : 0;
        const isIncrease = change > 0;
        const colorClass = isIncrease ? 'text-green-500' : 'text-red-500';

        return (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
                <h4 className="text-gray-500 dark:text-gray-400 font-medium mb-2">{title}</h4>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{formatCurrency(valueA)}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">vs {formatCurrency(valueB)} ({yearB})</p>
                <div className={`mt-2 flex items-center font-semibold ${colorClass}`}>
                    {change !== 0 && (isIncrease ? <TrendingUp size={16} className="mr-1"/> : <TrendingUp size={16} className="mr-1 transform rotate-180"/>)}
                    <span>{percentageChange.toFixed(2)}%</span>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <SectionTitle>Analisis Lintas Tahun</SectionTitle>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label htmlFor="yearA-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pilih Tahun Utama</label>
                        <select id="yearA-select" value={yearA} onChange={e => setYearA(parseInt(e.target.value))} className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="yearB-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bandingkan Dengan</label>
                        <select id="yearB-select" value={yearB} onChange={e => setYearB(parseInt(e.target.value))} className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="start-month-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dari Bulan</label>
                        <select id="start-month-select" value={startMonth} onChange={e => setStartMonth(e.target.value)} className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            {months.map(m => <option key={`start-${m}`} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="end-month-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sampai Bulan</label>
                        <select id="end-month-select" value={endMonth} onChange={e => setEndMonth(e.target.value)} className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            {months.map(m => <option key={`end-${m}`} value={m}>{m}</option>)}
                        </select>
                    </div>
                </div>

                {isLoading && <div className="text-center py-10"><Loader className="animate-spin mx-auto text-blue-500" size={40}/></div>}
                {error && <p className="text-center text-red-500 py-10">{error}</p>}

                {comparisonData && !isLoading && (
                    <div className="space-y-8">
                        <GeminiAnalysis 
                            getAnalysisPrompt={getAnalysisPrompt} 
                            disabledCondition={!comparisonData} 
                            theme={theme}
                            interactivePlaceholder="Bandingkan realisasi belanja Juli..."
                        />
                         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                            {comparisonData.map(item => (
                                <ComparisonCard key={item.name} title={item.name} valueA={item[yearA]} valueB={item[yearB]} yearA={yearA} yearB={yearB} />
                            ))}
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Grafik Perbandingan APBD</h3>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={comparisonData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                    <YAxis tickFormatter={(val) => `${(val / 1e9).toFixed(1)} M`} tick={{ fontSize: 12 }} />
                                    <Tooltip formatter={(value) => formatCurrency(value)} />
                                    <Legend />
                                    <Bar dataKey={yearA} fill="#435EBE" name={`Tahun ${yearA}`} radius={[4, 4, 0, 0]} />
                                    <Bar dataKey={yearB} fill="#1E293B" name={`Tahun ${yearB}`} radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        
                        {/* --- UPDATED: Restructured Layout --- */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg space-y-6">
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Statistik Belanja per SKPD</h3>
                                    <select value={selectedSkpdBelanja} onChange={e => setSelectedSkpdBelanja(e.target.value)} className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        <option value="Semua SKPD">Semua SKPD</option>
                                        {skpdListBelanja.map(skpd => <option key={skpd} value={skpd}>{skpd}</option>)}
                                    </select>
                                    {selectedSkpdBelanja !== 'Semua SKPD' && skpdBelanjaComparison && (
                                        <div className="mt-4 space-y-4">
                                            <ComparisonCard title={`Anggaran ${selectedSkpdBelanja}`} valueA={skpdBelanjaComparison.anggaranA} valueB={skpdBelanjaComparison.anggaranB} yearA={yearA} yearB={yearB} />
                                            <ComparisonCard title={`Realisasi ${selectedSkpdBelanja} (${startMonth} - ${endMonth})`} valueA={skpdBelanjaComparison.realisasiA} valueB={skpdBelanjaComparison.realisasiB} yearA={yearA} yearB={yearB} />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Pola Penyerapan Anggaran - {selectedSkpdBelanja}</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={monthlyComparisonData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                                            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                                            <YAxis tickFormatter={(val) => `${(val / 1e9).toFixed(1)}M`} tick={{ fontSize: 10 }} />
                                            <Tooltip formatter={(value) => formatCurrency(value)} />
                                            <Legend wrapperStyle={{fontSize: "12px"}}/>
                                            <Line type="monotone" dataKey={`Realisasi Kumulatif ${yearA}`} stroke="#8884d8" strokeWidth={2} name={`${yearA}`} />
                                            <Line type="monotone" dataKey={`Realisasi Kumulatif ${yearB}`} stroke="#82ca9d" strokeWidth={2} name={`${yearB}`} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg space-y-6">
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Statistik Pendapatan per SKPD</h3>
                                    <select value={selectedSkpdPendapatan} onChange={e => setSelectedSkpdPendapatan(e.target.value)} className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        <option value="Semua SKPD">Semua SKPD</option>
                                        {skpdListPendapatan.map(skpd => <option key={skpd} value={skpd}>{skpd}</option>)}
                                    </select>
                                    {selectedSkpdPendapatan !== 'Semua SKPD' && skpdPendapatanComparison && (
                                        <div className="mt-4 space-y-4">
                                            <ComparisonCard title={`Target ${selectedSkpdPendapatan}`} valueA={skpdPendapatanComparison.targetA} valueB={skpdPendapatanComparison.targetB} yearA={yearA} yearB={yearB} />
                                            <ComparisonCard title={`Realisasi ${selectedSkpdPendapatan} (${startMonth} - ${endMonth})`} valueA={skpdPendapatanComparison.realisasiA} valueB={skpdPendapatanComparison.realisasiB} yearA={yearA} yearB={yearB} />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Pola Pencapaian Pendapatan - {selectedSkpdPendapatan}</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={monthlyPendapatanComparisonData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                                            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                                            <YAxis tickFormatter={(val) => `${(val / 1e9).toFixed(1)}M`} tick={{ fontSize: 10 }} />
                                            <Tooltip formatter={(value) => formatCurrency(value)} />
                                            <Legend wrapperStyle={{fontSize: "12px"}}/>
                                            <Line type="monotone" dataKey={`Pendapatan Kumulatif ${yearA}`} stroke="#435EBE" strokeWidth={2} name={`${yearA}`} />
                                            <Line type="monotone" dataKey={`Pendapatan Kumulatif ${yearB}`} stroke="#F59E0B" strokeWidth={2} name={`${yearB}`} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalisisLintasTahunView;