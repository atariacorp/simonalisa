import React from 'react';
import SectionTitle from './SectionTitle';
import GeminiAnalysis from './GeminiAnalysis';
import Pagination from './Pagination';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Search } from 'lucide-react';
import { formatCurrency } from './formatCurrency';

// --- UPDATED: SkpdPendapatanStatsView Component with Projection Feature ---
const SkpdPendapatanStatsView = ({ data, theme, namaPemda, userRole }) => {
    const { pendapatan, realisasiPendapatan } = data;
    const [selectedSkpd, setSelectedSkpd] = React.useState('Semua SKPD');
    // 1. State baru untuk pencarian
    const [searchTerm, setSearchTerm] = React.useState(""); 
    const [currentPage, setCurrentPage] = React.useState(1);
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
            name: rekening,
            Target: targetMap.get(rekening) || 0,
            Realisasi: realisasiMap.get(rekening) || 0,
        }));
        
        // 2. Logika Filter Pencarian
        if (searchTerm) {
            combinedData = combinedData.filter(item => 
                item.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        const chartData = combinedData.sort((a,b) => b.Target - a.Target);

        const tableData = chartData.map(item => ({
            sumberPendapatan: item.name,
            totalTarget: item.Target,
            totalRealisasi: item.Realisasi,
            persentase: item.Target > 0 ? (item.Realisasi / item.Target) * 100 : 0
        }));

        return { chartData, tableData };
    }, [pendapatan, realisasiPendapatan, selectedSkpd, startMonth, endMonth, searchTerm]); // Tambahkan searchTerm ke dependency

    const projectionData = React.useMemo(() => {
        if (!pendapatan || !realisasiPendapatan) return null;
        
        // Filter pendapatan berdasarkan SKPD dan Search Term (agar proyeksi relevan dengan filter)
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

        return { totalTarget, realisasiHinggaSaatIni, proyeksiAkhirTahun, persenProyeksi };

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
    }, [selectedSkpd, startMonth, endMonth, searchTerm]);

    const getAnalysisPrompt = (customQuery) => {
        if (customQuery) {
            return `Berdasarkan data statistik pendapatan, berikan analisis untuk permintaan berikut: "${customQuery}"`;
        }
        
        const topSources = stats.tableData.slice(0, 5).map(s => `- **${s.sumberPendapatan}**: Target ${formatCurrency(s.totalTarget)}, Realisasi ${formatCurrency(s.totalRealisasi)} (${s.persentase.toFixed(2)}%)`).join('\n');
        const period = startMonth === endMonth ? startMonth : `periode ${startMonth} - ${endMonth}`;
        const filterContext = searchTerm ? `dengan filter kata kunci "${searchTerm}"` : '';
        
        return `
            Anda adalah seorang analis keuangan ahli untuk ${namaPemda || 'pemerintah daerah'}. 
            Lakukan analisis terhadap kinerja pendapatan ${selectedSkpd === 'Semua SKPD' ? 'Daerah' : selectedSkpd} pada **${period}** ${filterContext}.
            
            Data teratas berdasarkan filter saat ini:
            ${topSources}
            
            Berikan analisis singkat mengenai:
            1.  Kinerja pencapaian target pendapatan pada item-item tersebut.
            2.  Rekomendasi strategis untuk optimalisasi pendapatan.
        `;
    };

    return (
        <div className="space-y-6">
            <SectionTitle>Statistik Pendapatan per SKPD</SectionTitle>
            <GeminiAnalysis 
                getAnalysisPrompt={getAnalysisPrompt} 
                disabledCondition={stats.tableData.length === 0} 
                theme={theme}
                interactivePlaceholder="Analisis target pendapatan dari retribusi..."
                userRole={userRole}
            />

            {projectionData && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md mb-6">
                    <div className="flex flex-col md:flex-row justify-between items-start mb-4">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 md:mb-0">Proyeksi Pendapatan Akhir Tahun {searchTerm && `(Filter: "${searchTerm}")`}</h3>
                        <div>
                            <label htmlFor="projection-month-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Proyeksi Berdasarkan Data s/d Bulan:</label>
                            <select
                                id="projection-month-select"
                                value={projectionMonth}
                                onChange={(e) => setProjectionMonth(e.target.value)}
                                className="w-full md:w-auto pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                            >
                                {months.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Target Tahunan</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{formatCurrency(projectionData.totalTarget)}</p>
                        </div>
                        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Realisasi s/d {projectionMonth}</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{formatCurrency(projectionData.realisasiHinggaSaatIni)}</p>
                        </div>
                        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Proyeksi s/d Desember</p>
                            <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">{formatCurrency(projectionData.proyeksiAkhirTahun)}</p>
                        </div>
                        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Potensi Capaian Target</p>
                            <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">{projectionData.persenProyeksi.toFixed(2)}%</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                {/* 3. Grid Filter & Search diperbarui */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <select
                        id="skpd-select-pendapatan"
                        value={selectedSkpd}
                        onChange={(e) => setSelectedSkpd(e.target.value)}
                        className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                        <option value="Semua SKPD">-- Semua SKPD --</option>
                        {skpdList.map(skpd => <option key={skpd} value={skpd}>{skpd}</option>)}
                    </select>

                    {/* Input Pencarian Baru */}
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Cari Sumber Pendapatan..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" 
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                    </div>

                    <select value={startMonth} onChange={e => setStartMonth(e.target.value)} className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
                        {months.map(month => <option key={`start-${month}`} value={month}>Dari: {month}</option>)}
                    </select>
                    <select value={endMonth} onChange={e => setEndMonth(e.target.value)} className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
                        {months.map(month => <option key={`end-${month}`} value={month}>Sampai: {month}</option>)}
                    </select>
                </div>

                {stats.tableData.length > 0 ? (
                    <>
                        <div className="mb-8">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Komposisi Pendapatan untuk {selectedSkpd} ({startMonth} - {endMonth})</h3>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={stats.chartData.slice(0, 15)} margin={{ top: 5, right: 30, left: 20, bottom: 100 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 12 }} />
                                    <YAxis tickFormatter={(val) => `${(val / 1e9).toFixed(1)} M`} tick={{ fontSize: 12 }} />
                                    <Tooltip formatter={(value) => formatCurrency(value)} />
                                    <Legend verticalAlign="top" />
                                    <Bar dataKey="Target" fill="#8884d8" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Realisasi" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sumber Pendapatan</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Target Tahunan</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Realisasi ({startMonth} - {endMonth})</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Persentase (%)</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {paginatedData.map((item, index) => (
                                    <tr key={index} className="odd:bg-white even:bg-gray-50 dark:odd:bg-gray-800 dark:even:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <td className="px-6 py-4 whitespace-normal text-sm font-medium text-gray-900 dark:text-gray-100 max-w-sm">{item.sumberPendapatan}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-blue-700 dark:text-blue-400">{formatCurrency(item.totalTarget)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-green-700 dark:text-green-400">{formatCurrency(item.totalRealisasi)}</td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${item.persentase > 90 ? 'text-green-600' : item.persentase < 70 ? 'text-red-600' : 'text-yellow-600'}`}>{item.persentase.toFixed(2)}%</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                             {stats.tableData.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 py-8">Tidak ada data pendapatan yang cocok dengan pencarian.</p>}
                        </div>
                        {totalPages > 1 && (
                            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} theme={theme} />
                        )}
                    </>
                ) : (
                    <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                        <p>Tidak ada data pendapatan untuk ditampilkan{searchTerm ? ' dengan kata kunci tersebut' : ''}.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SkpdPendapatanStatsView;