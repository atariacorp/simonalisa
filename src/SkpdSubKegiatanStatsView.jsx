import React from 'react';
import SectionTitle from './SectionTitle';s

// --- GANTI SELURUH KOMPONEN DI BAWAH INI DENGAN VERSI YANG SUDAH DISEMPURNAKAN ---
const SkpdSubKegiatanStatsView = ({ data, theme, namaPemda, userRole }) => {
    const { anggaran, realisasi, realisasiNonRkud } = data;
    const [selectedSkpd, setSelectedSkpd] = React.useState('');
    const [selectedSubUnit, setSelectedSubUnit] = React.useState('Semua Sub Unit');
    
    const [subKegiatanStats, setSubKegiatanStats] = React.useState([]);
    const [currentPage, setCurrentPage] = React.useState(1);
    const [expandedRows, setExpandedRows] = React.useState(new Set());
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const [startMonth, setStartMonth] = React.useState(months[0]);
    const [endMonth, setEndMonth] = React.useState(months[months.length - 1]);
    const ITEMS_PER_PAGE = 10;

    const skpdList = React.useMemo(() => {
        const skpds = new Set((anggaran || []).map(item => item.NamaSKPD).filter(Boolean));
        return Array.from(skpds).sort();
    }, [anggaran]);
    
    const subUnitList = React.useMemo(() => {
        if (!selectedSkpd) return [];
        const filtered = (anggaran || []).filter(item => item.NamaSKPD === selectedSkpd);
        const subUnits = new Set(filtered.map(item => item.NamaSubUnit).filter(Boolean));
        return Array.from(subUnits).sort();
    }, [anggaran, selectedSkpd]);

    React.useEffect(() => {
        if (!selectedSkpd) {
            setSubKegiatanStats([]);
            return;
        }

        const normalizeRealisasiItem = (item, isNonRkud = false) => {
            if (!item) return null;
            return {
                NamaSKPD: isNonRkud ? item.NAMASKPD : item.NamaSKPD,
                NamaSubUnit: isNonRkud ? item.NAMASUBSKPD : item.NamaSubUnit,
                KodeSubKegiatan: isNonRkud ? item.KODESUBKEGIATAN : item.KodeSubKegiatan,
                NamaSubKegiatan: isNonRkud ? item.NAMASUBKEGIATAN : item.NamaSubKegiatan,
                NamaRekening: isNonRkud ? item.NAMAREKENING : item.NamaRekening,
                nilai: item.nilai || 0
            };
        };
        
        const combinedRealisasi = {};
        for (const month in realisasi) {
            combinedRealisasi[month] = (realisasi[month] || []).map(item => normalizeRealisasiItem(item, false));
        }
        for (const month in realisasiNonRkud) {
            if (!combinedRealisasi[month]) combinedRealisasi[month] = [];
            combinedRealisasi[month].push(...(realisasiNonRkud[month] || []).map(item => normalizeRealisasiItem(item, true)));
        }

        const statsMap = new Map();
        const startIndex = months.indexOf(startMonth);
        const endIndex = months.indexOf(endMonth);
        const selectedMonths = months.slice(startIndex, endIndex + 1);
        const realisasiBulanIni = selectedMonths.map(month => combinedRealisasi[month] || []).flat();

        let filteredAnggaran = (anggaran || []).filter(item => item.NamaSKPD === selectedSkpd);
        if (selectedSubUnit !== 'Semua Sub Unit') {
            filteredAnggaran = filteredAnggaran.filter(item => item.NamaSubUnit === selectedSubUnit);
        }
        
        let filteredRealisasi = realisasiBulanIni.filter(item => item.NamaSKPD === selectedSkpd);
        if (selectedSubUnit !== 'Semua Sub Unit') {
            filteredRealisasi = filteredRealisasi.filter(item => item.NamaSubUnit === selectedSubUnit);
        }
        
        filteredAnggaran.forEach(item => {
            const key = `${item.NamaSKPD}|${item.KodeSubKegiatan}`; 
            const rekeningKey = item.NamaRekening || 'Tanpa Nama Rekening';

            if (!statsMap.has(key)) {
                statsMap.set(key, {
                    kodeSubKegiatan: item.KodeSubKegiatan,
                    subKegiatan: item.NamaSubKegiatan || 'Tanpa Sub Kegiatan',
                    totalAnggaran: 0,
                    totalRealisasi: 0,
                    rekenings: new Map(),
                    sumberDanaSet: new Set()
                });
            }

            const subKegiatanData = statsMap.get(key);
            subKegiatanData.totalAnggaran += item.nilai || 0;
            if (item.NamaSumberDana) {
                subKegiatanData.sumberDanaSet.add(item.NamaSumberDana);
            }

            if (!subKegiatanData.rekenings.has(rekeningKey)) {
                subKegiatanData.rekenings.set(rekeningKey, { anggaran: 0, realisasi: 0 });
            }
            subKegiatanData.rekenings.get(rekeningKey).anggaran += item.nilai || 0;
        });

        filteredRealisasi.forEach(item => {
            const key = `${item.NamaSKPD}|${item.KodeSubKegiatan}`;
            const rekeningKey = item.NamaRekening || 'Tanpa Nama Rekening';

            if (statsMap.has(key)) {
                const subKegiatanData = statsMap.get(key);
                subKegiatanData.totalRealisasi += item.nilai || 0;

                if (subKegiatanData.rekenings.has(rekeningKey)) {
                    subKegiatanData.rekenings.get(rekeningKey).realisasi += item.nilai || 0;
                }
            }
        });

        const finalStats = Array.from(statsMap.values()).map(data => {
            const rekenings = Array.from(data.rekenings.entries()).map(([rekening, values]) => ({
                rekening,
                ...values,
                persentase: values.anggaran > 0 ? (values.realisasi / values.anggaran) * 100 : 0
            }));
            return {
                ...data,
                sumberDanaList: Array.from(data.sumberDanaSet),
                rekenings,
                persentase: data.totalAnggaran > 0 ? (data.totalRealisasi / data.totalAnggaran) * 100 : 0
            };
        }).sort((a, b) => b.totalAnggaran - a.totalAnggaran);

        setSubKegiatanStats(finalStats);

    }, [selectedSkpd, selectedSubUnit, anggaran, realisasi, realisasiNonRkud, startMonth, endMonth]);

    const totalPages = Math.ceil(subKegiatanStats.length / ITEMS_PER_PAGE);
    const paginatedData = subKegiatanStats.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handlePageChange = (page) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const toggleRow = (subKegiatanKey) => {
        const newExpandedRows = new Set(expandedRows);
        if (newExpandedRows.has(subKegiatanKey)) {
            newExpandedRows.delete(subKegiatanKey);
        } else {
            newExpandedRows.add(subKegiatanKey);
        }
        setExpandedRows(newExpandedRows);
    };

    React.useEffect(() => {
        setCurrentPage(1);
        setExpandedRows(new Set());
        setSelectedSubUnit('Semua Sub Unit');
    }, [selectedSkpd, startMonth, endMonth]);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [selectedSubUnit]);

    const getAnalysisPrompt = (customQuery) => {
        if (customQuery) {
            return `Berdasarkan data sub kegiatan SKPD, berikan analisis untuk permintaan berikut: "${customQuery}"`;
        }
        if (!selectedSkpd) return "Pilih SKPD untuk dianalisis.";
        const top5 = subKegiatanStats.slice(0, 5).map(s => `- **${s.subKegiatan}**: Anggaran ${formatCurrency(s.totalAnggaran)}, Realisasi ${formatCurrency(s.totalRealisasi)} (${s.persentase.toFixed(2)}%)`).join('\n');
        const period = startMonth === endMonth ? startMonth : `periode ${startMonth} - ${endMonth}`;
        return `
            Sebagai analis untuk ${namaPemda || 'pemerintah daerah'}, lakukan analisis kinerja penyerapan anggaran per Sub Kegiatan untuk SKPD: **${selectedSkpd}** pada **${period}**.
            Berikut adalah 5 sub kegiatan dengan anggaran terbesar:
            ${top5}
            
            Berikan analisis mendalam mengenai pola belanja SKPD ini. Fokus pada sub kegiatan dengan penyerapan tertinggi dan terendah. Identifikasi potensi masalah atau keberhasilan dalam eksekusi anggaran.
        `;
    };

    return (
        <div className="space-y-6">
            <SectionTitle>Statistik Sub Kegiatan & Rekening per SKPD</SectionTitle>
            <GeminiAnalysis 
                getAnalysisPrompt={getAnalysisPrompt} 
                disabledCondition={!selectedSkpd || subKegiatanStats.length === 0} 
                theme={theme}
                interactivePlaceholder="Cari sub kegiatan tentang pembangunan jalan..."
                userRole={userRole}
            />
             <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <select
                        value={selectedSkpd}
                        onChange={(e) => setSelectedSkpd(e.target.value)}
                        className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        <option value="">-- Pilih SKPD --</option>
                        {skpdList.map(skpd => <option key={skpd} value={skpd}>{skpd}</option>)}
                    </select>
                    
                    <select
                        value={selectedSubUnit}
                        onChange={(e) => setSelectedSubUnit(e.target.value)}
                        disabled={!selectedSkpd || subUnitList.length === 0}
                        className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                    >
                        <option>Semua Sub Unit</option>
                        {subUnitList.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                    </select>

                     <div className="grid grid-cols-2 gap-4">
                        <select value={startMonth} onChange={e => setStartMonth(e.target.value)} className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                            {months.map(month => <option key={`start-${month}`} value={month}>Dari: {month}</option>)}
                        </select>
                        <select value={endMonth} onChange={e => setEndMonth(e.target.value)} className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                            {months.map(month => <option key={`end-${month}`} value={month}>Sampai: {month}</option>)}
                        </select>
                    </div>
                </div>
                {selectedSkpd ? (
                    <div className="space-y-2">
                        {paginatedData.map(item => {
                            const subKegiatanKey = `${item.subKegiatan}-${item.kodeSubKegiatan}`; // --- KUNCI BARU YANG LEBIH UNIK ---
                            return (
                            <div key={subKegiatanKey} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                <div onClick={() => toggleRow(subKegiatanKey)} className="flex items-center p-4 cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <div className="flex-1">
                                        <h4 className="font-bold text-gray-800 dark:text-gray-200">{item.subKegiatan}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1">{item.kodeSubKegiatan}</p>
                                        <div className="flex items-center mt-2">
                                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5 mr-4">
                                                <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${item.persentase > 100 ? 100 : item.persentase}%` }}></div>
                                            </div>
                                            <div className="font-semibold text-green-700 dark:text-green-400 w-20 text-center">{item.persentase.toFixed(2)}%</div>
                                        </div>
                                    </div>
                                    <div className="w-40 text-right mx-4">
                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(item.totalAnggaran)}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Total Anggaran</p>
                                    </div>
                                    <div className="w-40 text-right mx-4">
                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(item.totalRealisasi)}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Total Realisasi</p>
                                    </div>
                                    <button className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
                                        {expandedRows.has(subKegiatanKey) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </button>
                                </div>
                                {expandedRows.has(subKegiatanKey) && (
                                    <div className="bg-white dark:bg-gray-800/50 p-4 border-t border-gray-200 dark:border-gray-700">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <h5 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">Sumber Dana:</h5>
                                                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                                    {item.sumberDanaList.length > 0 ? item.sumberDanaList.map(sd => <li key={sd}>{sd}</li>) : <li>Tidak Teridentifikasi</li>}
                                                </ul>
                                            </div>
                                            <div>
                                                <h5 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">Rincian Rekening:</h5>
                                                <div className="overflow-x-auto max-h-48">
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
                                                        {item.rekenings.map(rek => (
                                                            <tr key={rek.rekening}>
                                                                <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{rek.rekening}</td>
                                                                <td className="px-4 py-2 text-right text-sm text-gray-600 dark:text-gray-400">{formatCurrency(rek.anggaran)}</td>
                                                                <td className="px-4 py-2 text-right text-sm text-gray-600 dark:text-gray-400">{formatCurrency(rek.realisasi)}</td>
                                                                <td className="px-4 py-2 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">{rek.persentase.toFixed(2)}%</td>
                                                            </tr>
                                                        ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )})}
                        {subKegiatanStats.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 py-8">Tidak ada data sub kegiatan untuk filter ini.</p>}
                        {totalPages > 1 && (
                            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} theme={theme} />
                        )}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-10">Silakan pilih SKPD untuk melihat statistik sub kegiatan.</p>
                )}
            </div>
        </div>
    );
};

export default SkpdSubKegiatanStatsView;