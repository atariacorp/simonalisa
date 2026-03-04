import React from 'react';
import SectionTitle from './SectionTitle';

// --- UPDATED: SumberDanaStatsView dengan Sub Kegiatan ---
const SumberDanaStatsView = ({ data, theme, namaPemda, userRole }) => {
    const { anggaran, realisasi, realisasiNonRkud } = data;
    
    const [selectedSkpd, setSelectedSkpd] = React.useState('Semua SKPD');
    const [selectedSubKegiatan, setSelectedSubKegiatan] = React.useState('Semua Sub Kegiatan'); // <-- NEW
    const [selectedSumberDana, setSelectedSumberDana] = React.useState('Semua Sumber Dana');
    const [selectedRekening, setSelectedRekening] = React.useState('Semua Rekening');
    
    const [statsData, setStatsData] = React.useState([]);
    const [currentPage, setCurrentPage] = React.useState(1);
    const ITEMS_PER_PAGE = 15;

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
            // Include SubKegiatan in the key to separate budgets
            const key = `${item.NamaSKPD}|${item.NamaSubKegiatan}|${item.NamaSumberDana}|${item.NamaRekening}`;
            
            if (!dataMap.has(key)) {
                dataMap.set(key, {
                    skpd: item.NamaSKPD,
                    subKegiatan: item.NamaSubKegiatan, // <-- NEW
                    sumberDana: item.NamaSumberDana,
                    rekening: item.NamaRekening,
                    anggaran: 0,
                    realisasi: 0,
                });
            }
            dataMap.get(key).anggaran += item.nilai || 0;
        });
        
        // 2. Map Realization (aggregated by SKPD + Rekening for robustness)
        // Note: Since raw realization data often lacks clean SubActivity names matching Anggaran,
        // we use proportional distribution based on SKPD+Rekening totals.
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
        // Filter based on current view criteria (minus Sumber Dana itself to show distribution)
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

    // --- Handlers ---
    const handleDownloadExcel = () => {
        if (!window.XLSX) { alert("Pustaka unduh Excel tidak tersedia."); return; }
        if (filteredData.length === 0) { alert("Tidak ada data untuk diunduh."); return; }

        const dataForExport = filteredData.map(item => ({
            'SKPD': item.skpd,
            'Sub Kegiatan': item.subKegiatan, // <-- Added to Excel
            'Sumber Dana': item.sumberDana,
            'Nama Rekening': item.rekening,
            'Anggaran': item.anggaran,
            'Realisasi': item.realisasi,
            'Sisa Anggaran': item.sisaAnggaran,
            'Penyerapan (%)': item.persentase.toFixed(2),
        }));

        const worksheet = window.XLSX.utils.json_to_sheet(dataForExport);
        const workbook = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(workbook, worksheet, "Data Sumber Dana");
        window.XLSX.writeFile(workbook, `Statistik_Sumber_Dana_${selectedSkpd.substring(0,20)}.xlsx`);
    };
    
    const getAnalysisPrompt = (customQuery) => {
        if (customQuery) return `Berdasarkan data, analisis: "${customQuery}"`;
        
        const focus = selectedSkpd === 'Semua SKPD' ? 'keseluruhan APBD' : `SKPD ${selectedSkpd}`;
        const subActivityFocus = selectedSubKegiatan !== 'Semua Sub Kegiatan' ? `pada Sub Kegiatan: "${selectedSubKegiatan}"` : '';
        
        // Find lowest absorption items to highlight issues
        const issues = statsData
            .filter(d => d.anggaran > 100000000 && d.persentase < 40) // > 100jt and < 40%
            .slice(0, 3)
            .map(d => `- ${d.subKegiatan} (${d.sumberDana}): ${d.persentase.toFixed(1)}%`)
            .join('\n');

        return `
            Lakukan analisis mendalam mengenai efektivitas penggunaan Sumber Dana untuk **${focus}** ${subActivityFocus}.
            
            Fokuskan analisis pada:
            1.  Kesesuaian antara Sub Kegiatan dengan Sumber Dananya (misal: Apakah DAK fisik terserap dengan baik di kegiatan fisik?).
            2.  Identifikasi *bottleneck*. Berikut adalah beberapa aktivitas dengan penyerapan rendah yang mungkin perlu perhatian:
            ${issues}
            3.  Rekomendasi strategis untuk percepatan penyerapan sisa anggaran yang tersedia.
        `;
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#82ca9d'];

    return (
        <div className="space-y-6">
            <SectionTitle>Statistik Sumber Dana per SKPD & Sub Kegiatan</SectionTitle>
             <GeminiAnalysis 
                getAnalysisPrompt={getAnalysisPrompt} 
                disabledCondition={statsData.length === 0} 
                theme={theme}
                interactivePlaceholder="Analisis penyerapan DAK pada kegiatan fisik..."
                userRole={userRole}
            />
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* SKPD Filter */}
                    <div className="lg:col-span-1">
                        <label className="block text-xs font-medium text-gray-500 mb-1">SKPD</label>
                        <select value={selectedSkpd} onChange={(e) => setSelectedSkpd(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                            <option>Semua SKPD</option>
                            {skpdList.map(skpd => <option key={skpd} value={skpd}>{skpd}</option>)}
                        </select>
                    </div>

                    {/* Sub Kegiatan Filter - NEW */}
                    <div className="lg:col-span-1">
                         <label className="block text-xs font-medium text-gray-500 mb-1">Sub Kegiatan</label>
                        <select value={selectedSubKegiatan} onChange={(e) => setSelectedSubKegiatan(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                            <option>Semua Sub Kegiatan</option>
                            {subKegiatanList.map(sub => <option key={sub} value={sub}>{sub.length > 50 ? sub.substring(0,50)+'...' : sub}</option>)}
                        </select>
                    </div>

                    {/* Sumber Dana Filter */}
                    <div className="lg:col-span-1">
                         <label className="block text-xs font-medium text-gray-500 mb-1">Sumber Dana</label>
                        <select value={selectedSumberDana} onChange={(e) => setSelectedSumberDana(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                            <option>Semua Sumber Dana</option>
                            {sumberDanaList.map(dana => <option key={dana} value={dana}>{dana}</option>)}
                        </select>
                    </div>

                     {/* Download Button */}
                    <div className="lg:col-span-1 flex items-end">
                        <button onClick={handleDownloadExcel} disabled={filteredData.length === 0} className="w-full flex items-center justify-center px-4 py-2 border border-green-600 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                            <Download size={16} className="mr-2"/> Unduh Excel
                        </button>
                    </div>
                </div>

                {/* Summary Chart Section */}
                {selectedSkpd !== 'Semua SKPD' && summaryBySumberDana.length > 0 && (
                    <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-center">Komposisi Sumber Dana: {selectedSkpd}</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                                    <thead className="bg-gray-100 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-3 py-2 text-left font-medium text-gray-500">Sumber Dana</th>
                                            <th className="px-3 py-2 text-right font-medium text-gray-500">Anggaran</th>
                                            <th className="px-3 py-2 text-right font-medium text-gray-500">Penyerapan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {summaryBySumberDana.map(item => (
                                            <tr key={item.name}>
                                                <td className="px-3 py-2 text-gray-900 dark:text-gray-200">{item.name}</td>
                                                <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">{formatCurrency(item.anggaran)}</td>
                                                <td className={`px-3 py-2 text-right font-semibold ${item.penyerapan > 85 ? 'text-green-600' : item.penyerapan < 50 ? 'text-red-600' : 'text-gray-800'}`}>{item.penyerapan.toFixed(1)}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={summaryBySumberDana} dataKey="anggaran" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({percent}) => `${(percent * 100).toFixed(0)}%`}>
                                             {summaryBySumberDana.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => formatCurrency(value)} />
                                        <Legend wrapperStyle={{fontSize: '12px'}}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Table */}
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">SKPD / Sub Kegiatan</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sumber Dana</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rekening</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Anggaran</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Realisasi</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sisa</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">%</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {paginatedData.map((item, index) => (
                            <tr key={index} className="odd:bg-white even:bg-gray-50 dark:odd:bg-gray-800 dark:even:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700">
                                <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                                    <div className="font-semibold">{item.skpd}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.subKegiatan}</div>
                                </td>
                                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{item.sumberDana}</td>
                                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-normal max-w-xs">{item.rekening}</td>
                                <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.anggaran)}</td>
                                <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.realisasi)}</td>
                                <td className="px-4 py-3 text-right font-bold text-green-600 dark:text-green-400">{formatCurrency(item.sisaAnggaran)}</td>
                                <td className={`px-4 py-3 text-right font-semibold ${item.persentase > 85 ? 'text-green-600' : item.persentase < 50 ? 'text-red-600' : 'text-gray-700'}`}>{item.persentase.toFixed(1)}%</td>
                            </tr>
                        ))}
                        {filteredData.length === 0 && (
                            <tr><td colSpan="7" className="text-center py-8 text-gray-500">
                                Tidak ada data yang cocok dengan filter yang dipilih.
                            </td></tr>
                        )}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} theme={theme} />
                )}
            </div>
        </div>
    );
};

export default SumberDanaStatsView;
