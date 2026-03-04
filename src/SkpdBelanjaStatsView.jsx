// NEW: SkpdBelanjaStatsView Component
const SkpdBelanjaStatsView = ({ data, theme, namaPemda }) => {
    const { anggaran, realisasi, realisasiNonRkud } = data; // Ditambahkan realisasiNonRkud
    const [currentPage, setCurrentPage] = React.useState(1);
    const [skpdStats, setSkpdStats] = React.useState([]);
    const [searchTerm, setSearchTerm] = React.useState("");
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const [startMonth, setStartMonth] = React.useState(months[0]);
    const [endMonth, setEndMonth] = React.useState(months[months.length - 1]);
    const ITEMS_PER_PAGE = 10;

    React.useEffect(() => {
        const anggaranMap = new Map();
        (anggaran || []).forEach(item => {
            const skpd = item.NamaSKPD || 'Tanpa SKPD';
            anggaranMap.set(skpd, (anggaranMap.get(skpd) || 0) + item.nilai);
        });

        const startIndex = months.indexOf(startMonth);
        const endIndex = months.indexOf(endMonth);
        const selectedMonths = months.slice(startIndex, endIndex + 1);

        // --- LOGIKA BARU: Menggabungkan Realisasi Belanja & Non RKUD ---
        const normalizeRealisasiItem = (item, isNonRkud = false) => {
            if (!item) return null;
            return {
                NamaSKPD: isNonRkud ? item.NAMASKPD : item.NamaSKPD,
                nilai: item.nilai || 0
            };
        };
        
        const combinedRealisasi = [];
        selectedMonths.forEach(month => {
            if (realisasi && realisasi[month]) {
                combinedRealisasi.push(...realisasi[month].map(item => normalizeRealisasiItem(item, false)));
            }
            if (realisasiNonRkud && realisasiNonRkud[month]) {
                combinedRealisasi.push(...realisasiNonRkud[month].map(item => normalizeRealisasiItem(item, true)));
            }
        });
        // --- AKHIR LOGIKA BARU ---

        const realisasiMap = new Map();
        combinedRealisasi.forEach(item => { // Menggunakan data realisasi gabungan
            if (!item) return;
            const skpd = item.NamaSKPD || 'Tanpa SKPD';
            realisasiMap.set(skpd, (realisasiMap.get(skpd) || 0) + item.nilai);
        });

        const stats = Array.from(anggaranMap.keys()).map(skpd => {
            const totalAnggaran = anggaranMap.get(skpd) || 0;
            const totalRealisasi = realisasiMap.get(skpd) || 0;
            const persentase = totalAnggaran > 0 ? (totalRealisasi / totalAnggaran) * 100 : 0;
            return { skpd, totalAnggaran, totalRealisasi, persentase };
        });

        setSkpdStats(stats.sort((a,b) => b.persentase - a.persentase));
    }, [anggaran, realisasi, realisasiNonRkud, startMonth, endMonth]); // Ditambahkan realisasiNonRkud

    const filteredData = skpdStats.filter(item => item.skpd.toLowerCase().includes(searchTerm.toLowerCase()));
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const paginatedData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handlePageChange = (page) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page);
        }
    };
    
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, startMonth, endMonth]);

    const getAnalysisPrompt = (customQuery) => {
        if (customQuery) {
            return `Berdasarkan data statistik belanja SKPD, berikan analisis untuk permintaan berikut: "${customQuery}"`;
        }
        const topPerformers = skpdStats.slice(0, 3).map(s => `- ${s.skpd}: ${s.persentase.toFixed(2)}%`).join('\n');
        const bottomPerformers = skpdStats.slice(-3).reverse().map(s => `- ${s.skpd}: ${s.persentase.toFixed(2)}%`).join('\n');
        const period = startMonth === endMonth ? startMonth : `periode ${startMonth} - ${endMonth}`;
        return `
            Sebagai analis untuk ${namaPemda || 'pemerintah daerah'}, lakukan analisis kinerja penyerapan anggaran belanja per SKPD untuk **${period}**.
            Data menunjukkan 3 SKPD dengan penyerapan tertinggi adalah:
            ${topPerformers}
            
            Dan 3 SKPD dengan penyerapan terendah adalah:
            ${bottomPerformers}
            
            Berikan analisis singkat mengenai kemungkinan penyebab perbedaan kinerja ini dan berikan rekomendasi untuk SKPD dengan penyerapan rendah.
        `;
    };

    return (
        <div className="space-y-6">
            <SectionTitle>Statistik Anggaran vs Realisasi Belanja per SKPD</SectionTitle>
            <GeminiAnalysis 
                getAnalysisPrompt={getAnalysisPrompt} 
                disabledCondition={skpdStats.length === 0} 
                theme={theme}
                interactivePlaceholder="Bandingkan penyerapan Dinas A dan Dinas B..."
            />
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="relative md:col-span-1">
                        <input 
                            type="text"
                            placeholder="Cari SKPD..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                    </div>
                    <div className="md:col-span-2 grid grid-cols-2 gap-4">
                        <select value={startMonth} onChange={e => setStartMonth(e.target.value)} className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            {months.map(month => <option key={`start-${month}`} value={month}>Dari: {month}</option>)}
                        </select>
                        <select value={endMonth} onChange={e => setEndMonth(e.target.value)} className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            {months.map(month => <option key={`end-${month}`} value={month}>Sampai: {month}</option>)}
                        </select>
                    </div>
                </div>
                <div className="space-y-4">
                    {paginatedData.map(item => (
                        <div key={item.skpd} className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <h4 className="font-bold text-gray-800 dark:text-gray-200">{item.skpd}</h4>
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-2">
                                <div className="flex-1 mb-2 md:mb-0">
                                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${item.persentase > 100 ? 100 : item.persentase}%` }}></div>
                                    </div>
                                </div>
                                <div className="font-semibold text-blue-700 dark:text-blue-400 w-24 text-center">{item.persentase.toFixed(2)}%</div>
                                <div className="w-48 text-right">
                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(item.totalAnggaran)}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Anggaran Tahunan</p>
                                </div>
                                <div className="w-48 text-right">
                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(item.totalRealisasi)}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Realisasi ({startMonth} - {endMonth})</p>
                                </div>
                            </div>
                        </div>
                    ))}
                     {filteredData.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 py-8">Tidak ada data yang ditemukan.</p>}
                </div>
                 {totalPages > 1 && (
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} theme={theme} />
                )}
            </div>
        </div>
    );
};

export default SkpdBelanjaStatsView;