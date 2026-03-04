import React from 'react';
import SectionTitle from './SectionTitle';

// --- UPDATED: LaporanTematikView Component ---
const LaporanTematikView = ({ data, theme, namaPemda, userRole, selectedYear }) => {
    const { anggaran, realisasi } = data;
    const [selectedTematik, setSelectedTematik] = React.useState('spm');
    const [refData, setRefData] = React.useState([]);
    const [reportData, setReportData] = React.useState([]);
    const [chartData, setChartData] = React.useState([]);
    const [summaryData, setSummaryData] = React.useState({ pagu: 0, realisasi: 0, percentage: 0 }); 
    const [currentPage, setCurrentPage] = React.useState(1);
    const [expandedRows, setExpandedRows] = React.useState(new Set());
    const ITEMS_PER_PAGE = 15;

    const tematikOptions = {
        spm: { title: 'Standar Pelayanan Minimal', dbKey: 'spm' },
        stunting: { title: 'Penurunan Stunting', dbKey: 'stunting' },
        kemiskinan: { title: 'Penghapusan Kemiskinan Ekstrim', dbKey: 'kemiskinan' },
        inflasi: { title: 'Pengendalian Inflasi', dbKey: 'inflasi' },
        pengawasan: { title: 'Alokasi Anggaran Unsur Pengawasan', dbKey: 'pengawasan' }
    };

    React.useEffect(() => {
        const dbKey = tematikOptions[selectedTematik].dbKey;
        const dataRef = collection(db, "publicData", String(selectedYear), `referensi-${dbKey}`);
        const unsubscribe = onSnapshot(query(dataRef), (snapshot) => {
            let fetchedData = [];
            snapshot.forEach(doc => {
                if (Array.isArray(doc.data().rows)) {
                    fetchedData.push(...doc.data().rows);
                }
            });
            setRefData(fetchedData);
        }, (err) => {
            console.error(`Error fetching ${dbKey} reference:`, err);
            setRefData([]);
        });
        return () => unsubscribe();
    }, [selectedYear, selectedTematik]);

    React.useEffect(() => {
        if (!anggaran.length || !refData.length) {
            setReportData([]);
            setChartData([]);
            setSummaryData({ pagu: 0, realisasi: 0, percentage: 0 });
            return;
        }

        const totalAPBD = anggaran.reduce((sum, item) => sum + (item.nilai || 0), 0);
        const allRealisasi = Object.values(realisasi).flat();
        const refCodes = new Set(refData.map(item => String(item['KODE SUB KEGIATAN']).trim()));
        
        let filteredAnggaran = anggaran.filter(item => item && refCodes.has(String(item.KodeSubKegiatan).trim()));
        let filteredRealisasi = allRealisasi.filter(realItem => realItem && refCodes.has(String(realItem.KodeSubKegiatan).trim()));

        // --- NEW LOGIC: Filter for 'pengawasan' theme ---
        if (selectedTematik === 'pengawasan') {
            const isInspektorat = (item) => 
                (item.NamaSKPD && item.NamaSKPD.toLowerCase().includes('inspektorat')) ||
                (item.NamaSubUnit && item.NamaSubUnit.toLowerCase().includes('inspektorat'));
            
            filteredAnggaran = filteredAnggaran.filter(isInspektorat);
            filteredRealisasi = filteredRealisasi.filter(isInspektorat);
        }
        
        const subKegiatanMap = new Map();

        filteredAnggaran.forEach(item => {
            const key = `${item.NamaSKPD}|${item.NamaSubKegiatan}`;
            if (!subKegiatanMap.has(key)) {
                subKegiatanMap.set(key, {
                    skpd: item.NamaSKPD,
                    subKegiatan: item.NamaSubKegiatan,
                    pagu: 0,
                    realisasi: 0,
                    details: new Map()
                });
            }

            const entry = subKegiatanMap.get(key);
            entry.pagu += item.nilai || 0;
            
            const detailKey = item.NamaRekening;
            if (!entry.details.has(detailKey)) {
                entry.details.set(detailKey, {
                    rekening: item.NamaRekening,
                    anggaran: 0,
                    realisasi: 0
                });
            }
            entry.details.get(detailKey).anggaran += item.nilai || 0;
        });
        
        filteredRealisasi.forEach(realItem => {
            const key = `${realItem.NamaSKPD}|${realItem.NamaSubKegiatan}`;
            if (subKegiatanMap.has(key)) {
                const entry = subKegiatanMap.get(key);
                entry.realisasi += realItem.nilai || 0;
                
                const detailKey = realItem.NamaRekening;
                 if (entry.details.has(detailKey)) {
                    entry.details.get(detailKey).realisasi += realItem.nilai || 0;
                }
            }
        });
        
        const finalData = Array.from(subKegiatanMap.values()).map(item => ({
            ...item,
            details: Array.from(item.details.values()).map(d => ({...d, persentase: d.anggaran > 0 ? (d.realisasi / d.anggaran) * 100 : 0})),
            persentase: item.pagu > 0 ? (item.realisasi / item.pagu) * 100 : 0
        })).sort((a, b) => b.pagu - a.pagu);

        setReportData(finalData);
        
        let totalPaguTematik = 0;
        let totalRealisasiTematik = 0;
        finalData.forEach(item => {
            totalPaguTematik += item.pagu;
            totalRealisasiTematik += item.realisasi;
        });

        const percentage = totalAPBD > 0 ? (totalPaguTematik / totalAPBD) * 100 : 0;
        setSummaryData({ pagu: totalPaguTematik, realisasi: totalRealisasiTematik, percentage: percentage });

        const finalChartData = finalData
            .map(item => ({
                name: item.subKegiatan,
                Pagu: item.pagu,
                Realisasi: item.realisasi,
            }))
            .sort((a, b) => b.Pagu - a.Pagu)
            .slice(0, 15);
        setChartData(finalChartData);

    }, [anggaran, realisasi, refData, selectedTematik]);

    const totalPages = Math.ceil(reportData.length / ITEMS_PER_PAGE);
    const paginatedData = reportData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handlePageChange = (page) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page);
        }
    };
    
    const toggleRow = (key) => {
        const newExpandedRows = new Set(expandedRows);
        if (newExpandedRows.has(key)) {
            newExpandedRows.delete(key);
        } else {
            newExpandedRows.add(key);
        }
        setExpandedRows(newExpandedRows);
    };

    const handleDownloadExcel = () => {
        if (!reportData || reportData.length === 0) {
            alert("Tidak ada data untuk diunduh.");
            return;
        }
        if (!window.XLSX) {
            alert("Pustaka unduh Excel tidak tersedia.");
            return;
        }

        try {
            const dataForExport = reportData.flatMap(item => 
                item.details.map(d => ({
                    'Sub Unit': item.skpd, // Changed header
                    'Sub Kegiatan': item.subKegiatan,
                    'Nama Rekening': d.rekening,
                    'Anggaran': d.anggaran,
                    'Realisasi': d.realisasi,
                    'Persentase (%)': d.persentase.toFixed(2),
                }))
            );

            const worksheet = window.XLSX.utils.json_to_sheet(dataForExport);
            const workbook = window.XLSX.utils.book_new();
            window.XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Tematik");
            
            const fileName = `Laporan_Tematik_${tematikOptions[selectedTematik].title.replace(/ /g, "_")}_${selectedYear}.xlsx`;
            window.XLSX.writeFile(workbook, fileName);
        } catch (err) {
            console.error("Error creating Excel file:", err);
            alert("Gagal membuat file Excel.");
        }
    };

    const currentTagConfig = tematikOptions[selectedTematik];
    
    const getAnalysisPrompt = (customQuery) => {
        if (customQuery) {
            return `Berdasarkan data laporan tematik untuk "${currentTagConfig.title}", berikan analisis untuk permintaan berikut: "${customQuery}"`;
        }
        if (reportData.length === 0) return "Data tidak cukup untuk analisis.";
        
        const top5 = reportData.slice(0, 5).map(item => `- **${item.subKegiatan}** (${item.skpd}): Pagu ${formatCurrency(item.pagu)}, Realisasi ${formatCurrency(item.realisasi)}`).join('\n');
        
        return `
            Anda adalah seorang analis kebijakan publik untuk ${namaPemda || 'pemerintah daerah'}. 
            Lakukan analisis mendalam terhadap alokasi dan realisasi anggaran untuk tema: **${currentTagConfig.title}** pada tahun ${selectedYear}.

            ### Ringkasan Data:
            - **Total Anggaran Teridentifikasi**: ${formatCurrency(summaryData.pagu)}
            - **Total Realisasi Terdistribusi**: ${formatCurrency(summaryData.realisasi)}
            - **Tingkat Penyerapan Keseluruhan**: ${(summaryData.pagu > 0 ? (summaryData.realisasi / summaryData.pagu) * 100 : 0).toFixed(2)}%

            ### 5 Sub Kegiatan dengan Alokasi Terbesar:
            ${top5}

            Berikan analisis mengenai:
            1.  **Efektivitas Alokasi**: Apakah alokasi anggaran sudah terdistribusi dengan baik di antara SKPD-SKPD terkait untuk mendukung tema ini?
            2.  **Kinerja Penyerapan**: Identifikasi SKPD atau sub kegiatan dengan penyerapan tertinggi dan terendah. Apa kemungkinan penyebabnya?
            3.  **Rekomendasi Strategis**: Berdasarkan data, berikan 2-3 rekomendasi konkret untuk meningkatkan efektivitas program pada tema ini di tahun berikutnya.
        `;
    };

    return (
        <div className="space-y-6">
            <SectionTitle>Laporan Tematik</SectionTitle>
            <GeminiAnalysis 
                getAnalysisPrompt={getAnalysisPrompt}
                disabledCondition={reportData.length === 0}
                theme={theme}
                userRole={userRole}
                interactivePlaceholder={`Tanya tentang ${currentTagConfig.title}...`}
            />
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <div className="flex flex-col md:flex-row gap-4 mb-6 items-end">
                    <div className="flex-1">
                        <label htmlFor="tematik-select-report" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pilih Jenis Laporan Tematik:</label>
                        <select
                            id="tematik-select-report"
                            value={selectedTematik}
                            onChange={(e) => setSelectedTematik(e.target.value)}
                            className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {Object.entries(tematikOptions).map(([key, value]) => (
                                <option key={key} value={key}>{value.title}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={handleDownloadExcel}
                        disabled={reportData.length === 0}
                        className="flex-shrink-0 flex items-center justify-center px-4 py-2 border border-green-600 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download size={16} className="mr-2" />
                        Download Excel
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Total Anggaran Tematik</p>
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">{formatCurrency(summaryData.pagu)}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg border border-green-200 dark:border-green-700">
                        <p className="text-sm font-medium text-green-800 dark:text-green-300">Total Realisasi Tematik</p>
                        <p className="text-2xl font-bold text-green-900 dark:text-green-200">{formatCurrency(summaryData.realisasi)}</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
                        <p className="text-sm font-medium text-purple-800 dark:text-purple-300">Persentase Terhadap APBD</p>
                        <p className="text-2xl font-bold text-purple-900 dark:text-purple-200">{summaryData.percentage.toFixed(2)}%</p>
                    </div>
                </div>

                {chartData.length > 0 && (
                    <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-center">
                            Grafik Pagu vs Realisasi Tematik per Sub Unit (Top 15)
                        </h3>
                        <ResponsiveContainer width="100%" height={400}>
                            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 120 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                                <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 10 }} />
                                <YAxis tickFormatter={(val) => `${(val / 1e9).toFixed(1)} M`} tick={{ fontSize: 12 }} />
                                <Tooltip formatter={(value) => formatCurrency(value)} />
                                <Legend verticalAlign="top" />
                                <Line type="monotone" dataKey="Pagu" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 8 }} />
                                <Line type="monotone" dataKey="Realisasi" stroke="#82ca9d" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}


                <div className="space-y-2">
                    {paginatedData.length > 0 ? (
                        paginatedData.map(item => {
                            const rowKey = `${item.skpd}-${item.subKegiatan}`;
                            return (
                                <div key={rowKey} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                    <div onClick={() => toggleRow(rowKey)} className="flex items-center p-4 cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-800 dark:text-gray-200">{item.subKegiatan}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{item.skpd}</p>
                                        </div>
                                        <div className="w-40 text-right mx-4">
                                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(item.pagu)}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Pagu Anggaran</p>
                                        </div>
                                        <div className="w-40 text-right mx-4">
                                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(item.realisasi)}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Total Realisasi</p>
                                        </div>
                                        <button className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
                                            {expandedRows.has(rowKey) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                        </button>
                                    </div>
                                    {expandedRows.has(rowKey) && (
                                        <div className="bg-white dark:bg-gray-800/50 p-4 border-t border-gray-200 dark:border-gray-700">
                                            <h5 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">Rincian Rekening:</h5>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full">
                                                    <thead className="bg-gray-100 dark:bg-gray-700">
                                                        <tr>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Nama Rekening</th>
                                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Anggaran</th>
                                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Realisasi</th>
                                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Persentase</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                                    {item.details.map((d, i) => (
                                                        <tr key={i}>
                                                            <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{d.rekening}</td>
                                                            <td className="px-4 py-2 text-right text-sm text-gray-600 dark:text-gray-400">{formatCurrency(d.anggaran)}</td>
                                                            <td className="px-4 py-2 text-right text-sm text-gray-600 dark:text-gray-400">{formatCurrency(d.realisasi)}</td>
                                                            <td className="px-4 py-2 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">{d.persentase.toFixed(2)}%</td>
                                                        </tr>
                                                    ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })
                    ) : (
                        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                            <p>Tidak ada data anggaran yang cocok dengan penandaan tematik yang dipilih.</p>
                            <p className="text-sm">Pastikan Anda sudah mengunggah file referensi yang sesuai di menu "Penandaan Tematik".</p>
                        </div>
                    )}
                    {totalPages > 1 && (
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} theme={theme} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default LaporanTematikView;