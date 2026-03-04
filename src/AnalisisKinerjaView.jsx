// --- Analisis Kinerja View ---
const AnalisisKinerjaView = ({ theme, user, selectedYear, namaPemda }) => {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    const [yearA, setYearA] = React.useState(selectedYear);
    const [yearB, setYearB] = React.useState(selectedYear - 1);
    const [startMonth, setStartMonth] = React.useState(months[0]);
    const [endMonth, setEndMonth] = React.useState(months[months.length - 1]);
    const [analysisType, setAnalysisType] = React.useState('Belanja'); // 'Belanja' atau 'Pendapatan'
    const [dataA, setDataA] = React.useState(null);
    const [dataB, setDataB] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [sortConfig, setSortConfig] = React.useState({ key: 'kinerjaA', direction: 'descending' });
    const [selectedSkpd, setSelectedSkpd] = React.useState('Semua SKPD');

    // 1. Memperbarui fungsi untuk mengambil data realisasiNonRkud
    const fetchDataForYear = async (year) => {
        if (!user) return null;
        const dataTypes = ['anggaran', 'pendapatan', 'realisasi', 'realisasiPendapatan', 'realisasiNonRkud'];
        const yearData = {};
        for (const dataType of dataTypes) {
            const collRef = collection(db, "publicData", String(year), dataType);
            const snapshot = await getDocs(query(collRef));
            let data = [];
            snapshot.forEach(doc => { data = [...data, ...doc.data().data]; });
            // Menambahkan realisasiNonRkud ke dalam logika data bulanan
            if (dataType === 'realisasi' || dataType === 'realisasiPendapatan' || dataType === 'realisasiNonRkud') {
                yearData[dataType] = data.reduce((acc, item) => {
                    const month = item.month || 'Lainnya';
                    if (!acc[month]) acc[month] = [];
                    acc[month].push(item);
                    return acc;
                }, {});
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
                const [fetchedDataA, fetchedDataB] = await Promise.all([fetchDataForYear(yearA), fetchDataForYear(yearB)]);
                setDataA(fetchedDataA); setDataB(fetchedDataB);
            } catch (e) {
                console.error("Error fetching comparison data:", e);
                setError("Gagal memuat data perbandingan.");
            } finally {
                setIsLoading(false);
            }
        };
        if (user) { loadComparisonData(); }
    }, [yearA, yearB, user]);

    const { performanceData, skpdList, radarData } = React.useMemo(() => {
        if (!dataA || !dataB) return { performanceData: [], skpdList: [], radarData: [] };

        let skpdMap = new Map();
        const processData = (data, year, type) => {
            const startIndex = months.indexOf(startMonth);
            const endIndex = months.indexOf(endMonth);
            const selectedMonths = months.slice(startIndex, endIndex + 1);

            // 2. Menggabungkan data realisasi biasa dengan realisasi Non RKUD
            let realisasiData = [];
            if (type === 'Belanja') {
                const realisasiBiasa = selectedMonths.map(month => data.realisasi?.[month] || []).flat();
                const realisasiNonRkudData = selectedMonths.map(month => data.realisasiNonRkud?.[month] || []).flat();
                realisasiData = [...realisasiBiasa, ...realisasiNonRkudData];
            } else { // Pendapatan
                realisasiData = selectedMonths.map(month => data.realisasiPendapatan?.[month] || []).flat();
            }

            const targetData = data[type === 'Belanja' ? 'anggaran' : 'pendapatan'] || [];

            targetData.forEach(item => {
                const skpdName = item.NamaSKPD || item.NamaOPD || 'Tanpa SKPD/OPD';
                if (!skpdMap.has(skpdName)) skpdMap.set(skpdName, { skpd: skpdName });
                const skpd = skpdMap.get(skpdName);
                if (type === 'Belanja') {
                    skpd[`pagu${year}`] = (skpd[`pagu${year}`] || 0) + (item.nilai || 0);
                } else {
                    skpd[`target${year}`] = (skpd[`target${year}`] || 0) + (item.nilai || 0);
                }
            });

            realisasiData.forEach(item => {
                // 3. Menyamakan nama kolom (NamaSKPD vs NAMASKPD)
                const skpdName = item.NamaSKPD || item.SKPD || item.NAMASKPD || 'Tanpa SKPD/OPD';
                if (!skpdMap.has(skpdName)) skpdMap.set(skpdName, { skpd: skpdName });
                const skpd = skpdMap.get(skpdName);
                skpd[`realisasi${year}`] = (skpd[`realisasi${year}`] || 0) + (item.nilai || 0);
            });
        };

        processData(dataA, 'A', analysisType);
        processData(dataB, 'B', analysisType);
        
        const skpdList = Array.from(skpdMap.keys()).sort();

        const performanceData = Array.from(skpdMap.values()).map(skpd => {
            if (analysisType === 'Belanja') {
                const paguA = skpd.paguA || 0;
                const realisasiA = skpd.realisasiA || 0;
                const paguB = skpd.paguB || 0;
                const realisasiB = skpd.realisasiB || 0;
                return {
                    ...skpd, paguA, realisasiA, paguB, realisasiB,
                    kinerjaA: paguA > 0 ? (realisasiA / paguA) * 100 : 0,
                    kinerjaB: paguB > 0 ? (realisasiB / paguB) * 100 : 0,
                };
            } else { // Pendapatan
                const targetA = skpd.targetA || 0;
                const realisasiA = skpd.realisasiA || 0;
                const targetB = skpd.targetB || 0;
                const realisasiB = skpd.realisasiB || 0;
                return {
                    ...skpd, targetA, realisasiA, targetB, realisasiB,
                    kinerjaA: targetA > 0 ? (realisasiA / targetA) * 100 : 0,
                    kinerjaB: targetB > 0 ? (realisasiB / targetB) * 100 : 0,
                };
            }
        });
        
        let radarData = [];
        if (selectedSkpd !== 'Semua SKPD') {
            const skpdData = performanceData.find(d => d.skpd === selectedSkpd);
            if (skpdData) {
                const targetLabel = analysisType === 'Belanja' ? 'Pagu' : 'Target';
                radarData = [
                    { subject: targetLabel, A: skpdData[analysisType === 'Belanja' ? 'paguA' : 'targetA'], B: skpdData[analysisType === 'Belanja' ? 'paguB' : 'targetB'], fullMark: Math.max(skpdData[analysisType === 'Belanja' ? 'paguA' : 'targetA'], skpdData[analysisType === 'Belanja' ? 'paguB' : 'targetB']) * 1.1 },
                    { subject: 'Realisasi', A: skpdData.realisasiA, B: skpdData.realisasiB, fullMark: Math.max(skpdData.realisasiA, skpdData.realisasiB) * 1.1 },
                    { subject: 'Kinerja (%)', A: skpdData.kinerjaA, B: skpdData.kinerjaB, fullMark: 100 },
                ];
            }
        }

        return { performanceData, skpdList, radarData };

    }, [dataA, dataB, analysisType, startMonth, endMonth, selectedSkpd]);

    const sortedData = React.useMemo(() => {
        let dataToDisplay = performanceData;
        if (selectedSkpd !== 'Semua SKPD') {
            dataToDisplay = performanceData.filter(item => item.skpd === selectedSkpd);
        }
        
        if (sortConfig.key) {
            return [...dataToDisplay].sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return dataToDisplay;
    }, [performanceData, sortConfig, selectedSkpd]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };
    
    const getAnalysisPrompt = (customQuery) => {
        if (customQuery) return `Berdasarkan data kinerja ${analysisType}, berikan analisis untuk: "${customQuery}"`;
        if (sortedData.length === 0) return "Data tidak cukup untuk analisis.";
        
        const top5 = sortedData.slice(0, 5);
        const bottom5 = sortedData.slice(-5).reverse();
        const period = startMonth === endMonth ? startMonth : `periode ${startMonth} - ${endMonth}`;

        const formatItem = (item) => analysisType === 'Belanja'
            ? `- **${item.skpd}**: Kinerja ${yearA}: ${item.kinerjaA.toFixed(2)}%, Kinerja ${yearB}: ${item.kinerjaB.toFixed(2)}%`
            : `- **${item.skpd}**: Kinerja ${yearA}: ${item.kinerjaA.toFixed(2)}%, Kinerja ${yearB}: ${item.kinerjaB.toFixed(2)}%`;

        return `
            Anda adalah seorang analis kinerja untuk ${namaPemda || 'pemerintah daerah'}. Lakukan analisis perbandingan kinerja **${analysisType}** SKPD antara tahun **${yearA}** dan **${yearB}** untuk **${period}**.
            ${selectedSkpd !== 'Semua SKPD' ? `Fokus analisis pada: **${selectedSkpd}**.` : ''}

            ### SKPD Kinerja Tertinggi (${yearA})
            ${top5.map(formatItem).join('\n')}

            ### SKPD Kinerja Terendah (${yearA})
            ${bottom5.map(formatItem).join('\n')}

            Berikan analisis mendalam mengenai:
            1.  Perubahan kinerja yang signifikan antara dua tahun. Identifikasi SKPD yang menunjukkan peningkatan atau penurunan drastis.
            2.  Kemungkinan faktor penyebab di balik kinerja tinggi atau rendah (misalnya, efektivitas program, perubahan target, dll.).
            3.  Rekomendasi strategis untuk SKPD berkinerja rendah dan cara mempertahankan atau meningkatkan kinerja bagi SKPD berkinerja tinggi.
        `;
    };
    
    const renderSortIcon = (key) => {
        if (sortConfig.key !== key) return <ChevronsUpDown size={14} className="ml-1 text-gray-400" />;
        return sortConfig.direction === 'ascending' ? <ChevronDown size={14} className="ml-1" /> : <ChevronDown size={14} className="ml-1 transform rotate-180" />;
    };

    const renderGrowth = (valA, valB) => {
        const change = valA - valB;
        if (valA === 0 && valB === 0) return <span className="text-gray-500">-</span>;
        const color = change >= 0 ? 'text-green-500' : 'text-red-500';
        return <span className={color}>{change.toFixed(2)} pp</span>;
    };
    
    const tableHeaders = analysisType === 'Belanja'
        ? [
            { key: 'skpd', label: 'Nama SKPD' },
            { key: 'paguB', label: `Pagu ${yearB}` },
            { key: 'paguA', label: `Pagu ${yearA}` },
            { key: 'realisasiB', label: `Realisasi ${yearB}` },
            { key: 'realisasiA', label: `Realisasi ${yearA}` },
            { key: 'kinerjaB', label: `Penyerapan ${yearB} (%)` },
            { key: 'kinerjaA', label: `Penyerapan ${yearA} (%)` },
            { key: 'growth', label: 'Perubahan Kinerja (pp)' },
          ]
        : [
            { key: 'skpd', label: 'Nama SKPD/OPD' },
            { key: 'targetB', label: `Target ${yearB}` },
            { key: 'targetA', label: `Target ${yearA}` },
            { key: 'realisasiB', label: `Realisasi ${yearB}` },
            { key: 'realisasiA', label: `Realisasi ${yearA}` },
            { key: 'kinerjaB', label: `Pencapaian ${yearB} (%)` },
            { key: 'kinerjaA', label: `Pencapaian ${yearA} (%)` },
            { key: 'growth', label: 'Perubahan Kinerja (pp)' },
          ];

    return (
        <div className="space-y-6">
            <SectionTitle>Analisis Kinerja SKPD</SectionTitle>
            <GeminiAnalysis getAnalysisPrompt={getAnalysisPrompt} disabledCondition={sortedData.length === 0} theme={theme} />
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <select value={yearA} onChange={e => setYearA(parseInt(e.target.value))} className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <select value={yearB} onChange={e => setYearB(parseInt(e.target.value))} className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <select value={analysisType} onChange={e => setAnalysisType(e.target.value)} className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                        <option>Belanja</option>
                        <option>Pendapatan</option>
                    </select>
                    <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <select value={startMonth} onChange={e => setStartMonth(e.target.value)} className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                            {months.map(m => <option key={`start-${m}`} value={m}>Dari: {m}</option>)}
                        </select>
                        <select value={endMonth} onChange={e => setEndMonth(e.target.value)} className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                            {months.map(m => <option key={`end-${m}`} value={m}>Sampai: {m}</option>)}
                        </select>
                        <select value={selectedSkpd} onChange={e => setSelectedSkpd(e.target.value)} className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                            <option>Semua SKPD</option>
                            {skpdList.map(skpd => <option key={skpd} value={skpd}>{skpd}</option>)}
                        </select>
                    </div>
                </div>
                {isLoading && <div className="text-center py-10"><Loader className="animate-spin mx-auto text-purple-500" size={40}/></div>}
                {error && <p className="text-center text-red-500 py-10">{error}</p>}
                {!isLoading && !error && (
                    <>
                    {selectedSkpd !== 'Semua SKPD' && radarData.length > 0 && (
                        <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 text-center">Perbandingan Kinerja Head-to-Head: {selectedSkpd}</h3>
                            <ResponsiveContainer width="100%" height={400}>
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="subject" />
                                    <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} tickFormatter={(value, index) => index === 2 ? `${value}%` : ''} />
                                    <Tooltip formatter={(value, name, props) => props.payload.subject === 'Kinerja (%)' ? `${value.toFixed(2)}%` : formatCurrency(value)} />
                                    <Legend />
                                    <Radar name={yearA} dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                                    <Radar name={yearB} dataKey="B" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    {tableHeaders.map(header => (
                                        <th key={header.key} onClick={() => header.key !== 'growth' && requestSort(header.key)} className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${header.key !== 'growth' ? 'cursor-pointer' : ''}`}>
                                            <div className="flex items-center">{header.label} {header.key !== 'growth' && renderSortIcon(header.key)}</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {sortedData.map((item) => (
                                    <tr key={item.skpd} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100 max-w-xs whitespace-normal break-words">{item.skpd}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">{formatCurrency(analysisType === 'Belanja' ? item.paguB : item.targetB)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">{formatCurrency(analysisType === 'Belanja' ? item.paguA : item.targetA)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">{formatCurrency(item.realisasiB)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">{formatCurrency(item.realisasiA)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold" style={{ color: item.kinerjaB > 85 ? '#10B981' : item.kinerjaB < 50 ? '#EF4444' : 'inherit' }}>{item.kinerjaB.toFixed(2)}%</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold" style={{ color: item.kinerjaA > 85 ? '#10B981' : item.kinerjaA < 50 ? '#EF4444' : 'inherit' }}>{item.kinerjaA.toFixed(2)}%</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold">{renderGrowth(item.kinerjaA, item.kinerjaB)}</td>
                                    </tr>
                                ))}
                                {sortedData.length === 0 && <tr><td colSpan={tableHeaders.length} className="text-center py-8 text-gray-500">Tidak ada data untuk ditampilkan.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AnalisisKinerjaView;