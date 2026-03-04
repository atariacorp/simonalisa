import React from 'react';
import SectionTitle from './SectionTitle';
import GeminiAnalysis from './GeminiAnalysis';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from './formatCurrency';

// NEW: AnalisisPotensiSiLPAView Component
const AnalisisPotensiSiLPAView = ({ data, theme, selectedYear, userRole }) => {
    // 1. Mengambil data realisasiNonRkud
    const { anggaran, realisasi, realisasiNonRkud } = data;
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    const lastMonthWithData = React.useMemo(() => {
        // Cek kedua sumber realisasi untuk bulan terakhir
        for (let i = months.length - 1; i >= 0; i--) {
            if ((realisasi && realisasi[months[i]] && realisasi[months[i]].length > 0) || 
                (realisasiNonRkud && realisasiNonRkud[months[i]] && realisasiNonRkud[months[i]].length > 0)) {
                return months[i];
            }
        }
        return months[0];
    }, [realisasi, realisasiNonRkud]);

    const [projectionMonth, setProjectionMonth] = React.useState(lastMonthWithData);
    
    React.useEffect(() => {
        setProjectionMonth(lastMonthWithData);
    }, [lastMonthWithData]);

    const silpaData = React.useMemo(() => {
        const skpdAnggaranMap = new Map();
        (anggaran || []).forEach(item => {
            const skpd = item.NamaSKPD || 'Tanpa SKPD';
            skpdAnggaranMap.set(skpd, (skpdAnggaranMap.get(skpd) || 0) + item.nilai);
        });

        const projectionMonthIndex = months.indexOf(projectionMonth);
        const monthsPassed = projectionMonthIndex + 1;
        const monthsRemaining = 12 - monthsPassed;
        const passedMonths = months.slice(0, monthsPassed);

        // --- LOGIKA BARU: Menggabungkan Realisasi RKUD & Non RKUD ---
        const skpdRealisasiMap = new Map();
        passedMonths.forEach(month => {
            // Proses realisasi biasa (RKUD)
            ((realisasi || {})[month] || []).forEach(item => {
                const skpd = item.NamaSKPD || 'Tanpa SKPD';
                skpdRealisasiMap.set(skpd, (skpdRealisasiMap.get(skpd) || 0) + item.nilai);
            });
            // Proses realisasi Non RKUD
            ((realisasiNonRkud || {})[month] || []).forEach(item => {
                const skpd = item.NAMASKPD || 'Tanpa SKPD';
                skpdRealisasiMap.set(skpd, (skpdRealisasiMap.get(skpd) || 0) + item.nilai);
            });
        });
        // --- AKHIR LOGIKA BARU ---

        const tableData = Array.from(skpdAnggaranMap.keys()).map(skpd => {
            const totalAnggaran = skpdAnggaranMap.get(skpd) || 0;
            const realisasiHinggaSaatIni = skpdRealisasiMap.get(skpd) || 0;
            
            const rataRataBulanan = monthsPassed > 0 ? realisasiHinggaSaatIni / monthsPassed : 0;
            const proyeksiSisaBulan = rataRataBulanan * monthsRemaining;
            const proyeksiAkhirTahun = realisasiHinggaSaatIni + proyeksiSisaBulan;
            
            const potensiSiLPA = totalAnggaran - proyeksiAkhirTahun;
            const persenSiLPA = totalAnggaran > 0 ? (potensiSiLPA / totalAnggaran) * 100 : 0;

            return { skpd, totalAnggaran, realisasiHinggaSaatIni, proyeksiAkhirTahun, potensiSiLPA, persenSiLPA };
        }).sort((a, b) => b.potensiSiLPA - a.potensiSiLPA);
        
        const totals = tableData.reduce((acc, curr) => ({
            totalAnggaran: acc.totalAnggaran + curr.totalAnggaran,
            proyeksiAkhirTahun: acc.proyeksiAkhirTahun + curr.proyeksiAkhirTahun,
            potensiSiLPA: acc.potensiSiLPA + curr.potensiSiLPA,
        }), { totalAnggaran: 0, proyeksiAkhirTahun: 0, potensiSiLPA: 0 });
        
        const chartData = tableData.slice(0, 10);

        return { tableData, totals, chartData };
    }, [anggaran, realisasi, realisasiNonRkud, projectionMonth]);

    const getAnalysisPrompt = (customQuery) => {
        if (customQuery) {
            return `Berdasarkan data potensi SiLPA, berikan analisis untuk: "${customQuery}"`;
        }
        if (silpaData.tableData.length === 0) return "Data tidak cukup untuk analisis.";

        const { tableData, totals } = silpaData;
        const top5SiLPA = tableData.slice(0, 5);

        return `
            Anda adalah seorang ahli perencanaan dan evaluasi anggaran pemerintah.
            Berdasarkan proyeksi realisasi hingga akhir tahun ${selectedYear} (dihitung dari data s/d bulan ${projectionMonth}), ditemukan potensi SiLPA (Sisa Lebih Perhitungan Anggaran) sebesar **${formatCurrency(totals.potensiSiLPA)}**.

            SiLPA yang tinggi dapat mengindikasikan perencanaan yang kurang matang atau eksekusi program yang lambat.
            
            Berikut adalah 5 SKPD dengan potensi SiLPA terbesar:
            ${top5SiLPA.map(s => `- **${s.skpd}**: Potensi SiLPA ${formatCurrency(s.potensiSiLPA)} (${s.persenSiLPA.toFixed(2)}% dari anggarannya)`).join('\n')}

            Berikan analisis mendalam mengenai:
            1.  Implikasi dari potensi SiLPA sebesar ini terhadap APBD secara keseluruhan.
            2.  Faktor-faktor yang mungkin menyebabkan tingginya potensi SiLPA di SKPD-SKPD tersebut.
            3.  Rekomendasi strategis yang dapat segera diambil oleh pimpinan daerah, seperti percepatan lelang/kegiatan, atau perencanaan pergeseran anggaran untuk program yang lebih mendesak.
        `;
    };
    
    return (
        <div className="space-y-6">
            <SectionTitle>Analisis Potensi SiLPA</SectionTitle>
            <GeminiAnalysis 
                getAnalysisPrompt={getAnalysisPrompt}
                disabledCondition={silpaData.tableData.length === 0}
                theme={theme}
                selectedYear={selectedYear}
                interactivePlaceholder="Analisis potensi SiLPA untuk Dinas Kesehatan..."
                userRole={userRole}
            />
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div>
                        <label htmlFor="projection-month-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Proyeksi Berdasarkan Data s/d Bulan:</label>
                        <select
                            id="projection-month-select"
                            value={projectionMonth}
                            onChange={(e) => setProjectionMonth(e.target.value)}
                            className="w-full md:w-auto pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            {months.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                     <div className="text-center md:text-right">
                        <p className="text-gray-600 dark:text-gray-400">Total Potensi SiLPA APBD</p>
                        <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{formatCurrency(silpaData.totals.potensiSiLPA)}</p>
                    </div>
                </div>

                {/* --- DIAGRAM DIPINDAHKAN KE ATAS --- */}
                {silpaData.chartData.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg mb-8">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Grafik Potensi SiLPA per SKPD (Top 10)</h3>
                        <ResponsiveContainer width="100%" height={450}>
                            <BarChart data={silpaData.chartData} margin={{ top: 5, right: 30, left: 20, bottom: 150 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                                <XAxis dataKey="skpd" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 12 }} />
                                <YAxis tickFormatter={(val) => `${(val / 1e9).toFixed(1)} M`} tick={{ fontSize: 12 }} />
                                <Tooltip formatter={(value) => formatCurrency(value)} />
                                <Legend verticalAlign="top" />
                                <Bar dataKey="totalAnggaran" fill="#435EBE" name="Total Anggaran" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="realisasiHinggaSaatIni" fill="#82ca9d" name={`Realisasi s/d ${projectionMonth}`} radius={[4, 4, 0, 0]} />
                                <Bar dataKey="proyeksiAkhirTahun" fill="#ffc658" name="Proyeksi Realisasi" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="potensiSiLPA" fill="#d03f3f" name="Potensi SiLPA" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
                {/* --- AKHIR BAGIAN DIAGRAM --- */}

                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nama SKPD</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Anggaran</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Realisasi s/d {projectionMonth}</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Proyeksi Akhir Tahun</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Potensi SiLPA</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">% SiLPA</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {silpaData.tableData.length > 0 ? silpaData.tableData.map(item => (
                                <tr key={item.skpd} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4 whitespace-normal break-words text-sm font-medium text-gray-900 dark:text-gray-100 max-w-xs">{item.skpd}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">{formatCurrency(item.totalAnggaran)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">{formatCurrency(item.realisasiHinggaSaatIni)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">{formatCurrency(item.proyeksiAkhirTahun)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-purple-700 dark:text-purple-400">{formatCurrency(item.potensiSiLPA)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-purple-700 dark:text-purple-400">{item.persenSiLPA.toFixed(2)}%</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="text-center py-8 text-gray-500">Data tidak cukup untuk melakukan proyeksi.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AnalisisPotensiSiLPAView;