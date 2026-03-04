const SkpdRekeningStatsView = ({ data, theme, namaPemda, userCanUseAi }) => {
    const { anggaran, realisasi, realisasiNonRkud } = data;
    const [selectedSkpd, setSelectedSkpd] = React.useState('Semua SKPD');
    const [rekeningStats, setRekeningStats] = React.useState([]);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [sortOrder, setSortOrder] = React.useState('realisasi-desc');
    const [currentPage, setCurrentPage] = React.useState(1);
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const [startMonth, setStartMonth] = React.useState(months[0]);
    const [endMonth, setEndMonth] = React.useState(months[months.length - 1]);
    const ITEMS_PER_PAGE = 10;
    
    const [expandedRekening, setExpandedRekening] = React.useState(null);

    const skpdList = React.useMemo(() => {
        const skpds = new Set((anggaran || []).map(item => item.NamaSKPD).filter(Boolean));
        return Array.from(skpds).sort();
    }, [anggaran]);

    React.useEffect(() => {
        if (!anggaran) {
            setRekeningStats([]);
            return;
        }

        const normalizeRealisasiItem = (item, isNonRkud = false) => {
            if (!item) return null;
            return {
                NamaSKPD: isNonRkud ? item.NAMASKPD : item.NamaSKPD,
                KodeRekening: isNonRkud ? item.KODEREKENING : item.KodeRekening,
                NamaRekening: isNonRkud ? item.NAMAREKENING : item.NamaRekening,
                nilai: item.nilai || 0
            };
        };

        const combinedRealisasi = {};
        for (const month in realisasi) { combinedRealisasi[month] = (realisasi[month] || []).map(item => normalizeRealisasiItem(item, false)); }
        for (const month in realisasiNonRkud) {
            if (!combinedRealisasi[month]) combinedRealisasi[month] = [];
            combinedRealisasi[month].push(...(realisasiNonRkud[month] || []).map(item => normalizeRealisasiItem(item, true)));
        }

        const filteredAnggaran = selectedSkpd === 'Semua SKPD' 
            ? anggaran 
            : anggaran.filter(item => item.NamaSKPD === selectedSkpd);

        const dataMap = new Map();
        
        filteredAnggaran.forEach(item => {
            const key = item.NamaRekening || 'Tanpa Nama Rekening';
            if (!dataMap.has(key)) {
                dataMap.set(key, {
                    kodeRekening: item.KodeRekening,
                    rekening: key,
                    totalAnggaran: 0,
                    totalRealisasi: 0,
                    skpdDetails: new Map(),
                    sumberDanaSet: new Set(),
                });
            }
            const data = dataMap.get(key);
            data.totalAnggaran += item.nilai || 0;
            if (item.NamaSumberDana) data.sumberDanaSet.add(item.NamaSumberDana);

            const skpdKey = item.NamaSKPD || 'Tanpa SKPD';
            if (!data.skpdDetails.has(skpdKey)) {
                data.skpdDetails.set(skpdKey, { anggaran: 0, realisasi: 0 });
            }
            data.skpdDetails.get(skpdKey).anggaran += item.nilai || 0;
        });

        const startIndex = months.indexOf(startMonth);
        const endIndex = months.indexOf(endMonth);
        const selectedMonths = months.slice(startIndex, endIndex + 1);
        const realisasiBulanIni = selectedMonths.map(month => combinedRealisasi[month] || []).flat();
        
        const filteredRealisasi = selectedSkpd === 'Semua SKPD' ? realisasiBulanIni : realisasiBulanIni.filter(item => item.NamaSKPD === selectedSkpd);
        
        filteredRealisasi.forEach(item => {
            const key = item.NamaRekening || 'Tanpa Nama Rekening';
            if (!dataMap.has(key)) {
                 const correspondingAnggaranItem = (anggaran || []).find(a => a.NamaRekening === key);
                 dataMap.set(key, {
                    kodeRekening: correspondingAnggaranItem ? correspondingAnggaranItem.KodeRekening : (item.KodeRekening || 'N/A'),
                    rekening: key, totalAnggaran: 0, totalRealisasi: 0,
                    skpdDetails: new Map(),
                    sumberDanaSet: new Set(),
                });
            }
            const data = dataMap.get(key);
            data.totalRealisasi += item.nilai || 0;
            
            const skpdKey = item.NamaSKPD || 'Tanpa SKPD';
            if (!data.skpdDetails.has(skpdKey)) {
                data.skpdDetails.set(skpdKey, { anggaran: 0, realisasi: 0 });
            }
            data.skpdDetails.get(skpdKey).realisasi += item.nilai || 0;
        });

        const stats = Array.from(dataMap.values()).map(item => {
            const persentase = item.totalAnggaran > 0 ? (item.totalRealisasi / item.totalAnggaran) * 100 : 0;
            const sisaAnggaran = item.totalAnggaran - item.totalRealisasi;
            
            const skpdDetailsArray = Array.from(item.skpdDetails.entries()).map(([skpd, values]) => ({
                skpd,
                anggaran: values.anggaran,
                realisasi: values.realisasi,
                sisa: values.anggaran - values.realisasi,
                persen: values.anggaran > 0 ? (values.realisasi / values.anggaran) * 100 : 0
            })).sort((a,b) => b.anggaran - a.anggaran);

            return { 
                ...item, persentase, sisaAnggaran,
                skpdList: skpdDetailsArray,
                sumberDanaList: Array.from(item.sumberDanaSet),
            };
        });

        setRekeningStats(stats);
    }, [selectedSkpd, anggaran, realisasi, realisasiNonRkud, startMonth, endMonth]);
    
    const sortedAndFilteredData = React.useMemo(() => {
        const filtered = rekeningStats.filter(item => 
            item.rekening.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.kodeRekening && String(item.kodeRekening).toLowerCase().includes(searchTerm.toLowerCase()))
        );

        const [key, direction] = sortOrder.split('-');
        
        return filtered.sort((a, b) => {
            let valA, valB;
            switch(key) {
                case 'realisasi': valA = a.totalRealisasi; valB = b.totalRealisasi; break;
                case 'anggaran': valA = a.totalAnggaran; valB = b.totalAnggaran; break;
                case 'persentase': valA = a.persentase; valB = b.persentase; break;
                case 'sisa': valA = a.sisaAnggaran; valB = b.sisaAnggaran; break;
                case 'nama':
                    valA = a.rekening; valB = b.rekening;
                    return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                default: return 0;
            }
            return direction === 'asc' ? valA - valB : valB - valA;
        });
    }, [rekeningStats, searchTerm, sortOrder]);

    const totalPages = Math.ceil(sortedAndFilteredData.length / ITEMS_PER_PAGE);
    const paginatedData = sortedAndFilteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    
    const handlePageChange = (page) => {
        if (page > 0 && page <= totalPages) setCurrentPage(page);
    };
    
    React.useEffect(() => {
        setCurrentPage(1);
        setExpandedRekening(null);
    }, [searchTerm, selectedSkpd, startMonth, endMonth, sortOrder]);
    
    // --- Fitur Baru: Fungsi untuk Download Excel ---
    const handleDownloadExcel = () => {
        if (!sortedAndFilteredData || sortedAndFilteredData.length === 0) {
            alert("Tidak ada data untuk diunduh.");
            return;
        }
        if (!window.XLSX) {
            alert("Pustaka unduh Excel tidak tersedia.");
            return;
        }

        try {
            const dataForExport = sortedAndFilteredData.map(item => ({
                'Kode Rekening': item.kodeRekening,
                'Nama Rekening': item.rekening,
                'Anggaran Tahunan': item.totalAnggaran,
                'Realisasi': item.totalRealisasi,
                'Sisa Anggaran': item.sisaAnggaran,
                'Penyerapan (%)': item.persentase.toFixed(2)
            }));

            const worksheet = window.XLSX.utils.json_to_sheet(dataForExport);
            const workbook = window.XLSX.utils.book_new();
            window.XLSX.utils.book_append_sheet(workbook, worksheet, "Statistik Rekening");
            
            const fileName = `Statistik_Rekening_${selectedSkpd.replace(/ /g, "_")}_(${startMonth}-${endMonth}).xlsx`;
            window.XLSX.writeFile(workbook, fileName);
        } catch (err) {
            console.error("Error creating Excel file:", err);
            alert("Gagal membuat file Excel.");
        }
    };

    const getAnalysisPrompt = (customQuery) => {
        if (customQuery) {
            return `Berdasarkan data rekening SKPD, berikan analisis untuk permintaan berikut: "${customQuery}"`;
        }
        
        const focus = selectedSkpd === 'Semua SKPD' ? 'keseluruhan APBD' : `SKPD: **${selectedSkpd}**`;
        const top5 = sortedAndFilteredData.slice(0, 5).map(s => `- **${s.rekening} (${s.kodeRekening})**: Anggaran ${formatCurrency(s.totalAnggaran)}, Realisasi ${formatCurrency(s.totalRealisasi)}, Sisa ${formatCurrency(s.sisaAnggaran)} (${s.persentase.toFixed(2)}%)`).join('\n');
        const period = startMonth === endMonth ? startMonth : `periode ${startMonth} - ${endMonth}`;
        
        return `
            Sebagai analis untuk ${namaPemda || 'pemerintah daerah'}, lakukan analisis kinerja penyerapan anggaran per rekening untuk **${focus}** pada **${period}**.
            Berikut adalah 5 rekening teratas berdasarkan urutan yang dipilih:
            ${top5}
            
            Berikan analisis singkat mengenai pola belanja ini. Fokus pada rekening dengan sisa anggaran terbesar dan penyerapan terendah. Berikan rekomendasi spesifik.
        `;
    };

    const toggleRincian = (rekening) => {
        setExpandedRekening(prev => (prev === rekening ? null : rekening));
    };

    return (
        <div className="space-y-6">
            <SectionTitle>Statistik Rekening per SKPD</SectionTitle>
            <GeminiAnalysis getAnalysisPrompt={getAnalysisPrompt} disabledCondition={rekeningStats.length === 0} theme={theme} interactivePlaceholder="Analisis belanja ATK di dinas..." userCanUseAi={userCanUseAi} />
             <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <select value={selectedSkpd} onChange={(e) => setSelectedSkpd(e.target.value)} className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="Semua SKPD">-- Semua SKPD --</option>
                        {skpdList.map(skpd => <option key={skpd} value={skpd}>{skpd}</option>)}
                    </select>
                     <div className="relative">
                        <input type="text" placeholder="Cari Nama/Kode Rekening..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <select value={startMonth} onChange={e => setStartMonth(e.target.value)} className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            {months.map(month => <option key={`start-${month}`} value={month}>Dari: {month}</option>)}
                        </select>
                        <select value={endMonth} onChange={e => setEndMonth(e.target.value)} className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            {months.map(month => <option key={`end-${month}`} value={month}>Sampai: {month}</option>)}
                        </select>
                    </div>
                    {/* --- Dropdown Urutan yang Diperbarui --- */}
                    <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="realisasi-desc">Realisasi Tertinggi</option>
                        <option value="realisasi-asc">Realisasi Terendah</option>
                        <option value="anggaran-desc">Anggaran Tertinggi</option>
                        <option value="anggaran-asc">Anggaran Terendah</option>
                        <option value="persentase-desc">Penyerapan Tertinggi (%)</option>
                        <option value="persentase-asc">Penyerapan Terendah (%)</option>
                        <option value="sisa-desc">Sisa Anggaran Tertinggi</option>
                        <option value="sisa-asc">Sisa Anggaran Terendah</option>
                        <option value="nama-asc">Nama Rekening (A-Z)</option>
                    </select>
                    {/* --- Tombol Download Excel Ditambahkan di Sini --- */}
                    <button 
                        onClick={handleDownloadExcel} 
                        disabled={sortedAndFilteredData.length === 0} 
                        className="lg:col-start-4 flex items-center justify-center px-4 py-2 border border-green-600 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download size={16} className="mr-2"/>
                        Download Excel
                    </button>
                </div>

                <div className="space-y-4">
                    {paginatedData.map(item => (
                        <div key={item.rekening} className="border border-gray-200 dark:border-gray-700 rounded-lg transition-shadow hover:shadow-lg">
                            <div className="p-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h4 className="font-bold text-gray-800 dark:text-gray-200">{item.rekening}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{item.kodeRekening}</p>
                                    </div>
                                    <button onClick={() => toggleRincian(item.rekening)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 ml-4">
                                        {expandedRekening === item.rekening ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </button>
                                </div>
                                <div className="mt-4">
                                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                                        <span>Realisasi: {formatCurrency(item.totalRealisasi)}</span>
                                        <span>Pagu: {formatCurrency(item.totalAnggaran)}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-4 relative overflow-hidden">
                                        <div className="bg-indigo-600 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ width: `${item.persentase > 100 ? 100 : item.persentase}%` }}>
                                           {item.persentase.toFixed(2)}%
                                        </div>
                                    </div>
                                     <p className="text-right text-xs text-green-600 dark:text-green-400 mt-1">Sisa Anggaran: {formatCurrency(item.sisaAnggaran)}</p>
                                </div>
                            </div>
                            
                            {expandedRekening === item.rekening && (
                                <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                                        <div>
                                            <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Rincian per SKPD:</h5>
                                            <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                                                {item.skpdList.length > 0 ? item.skpdList.map(skpdDetail => (
                                                    <div key={skpdDetail.skpd}>
                                                        <p className="font-bold text-gray-800 dark:text-gray-200">{skpdDetail.skpd}</p>
                                                        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1 mt-1">
                                                            <p>Anggaran: <span className="float-right">{formatCurrency(skpdDetail.anggaran)}</span></p>
                                                            <p>Realisasi: <span className="float-right">{formatCurrency(skpdDetail.realisasi)}</span></p>
                                                            <p>Sisa: <span className="float-right">{formatCurrency(skpdDetail.sisa)}</span></p>
                                                            <p>Penyerapan: <span className="font-bold float-right">{skpdDetail.persen.toFixed(2)}%</span></p>
                                                        </div>
                                                    </div>
                                                )) : <p className="text-gray-500">-</p>}
                                            </div>
                                        </div>
                                        <div>
                                            <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Sumber Dana:</h5>
                                             <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                                                {item.sumberDanaList.length > 0 ? item.sumberDanaList.map(sd => <li key={sd}>{sd}</li>) : <li>Tidak Teridentifikasi</li>}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {sortedAndFilteredData.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 py-8">Tidak ada data rekening yang ditemukan.</p>}
                </div>
                 {totalPages > 1 && ( <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} theme={theme} /> )}
            </div>
        </div>
    );
};

export default SkpdRekeningStatsView;   