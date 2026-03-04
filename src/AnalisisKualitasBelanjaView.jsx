// --- UPDATED AnalisisKualitasBelanjaView Component ---
const AnalisisKualitasBelanjaView = ({ data, theme, selectedYear }) => {
    // 1. Mengambil data realisasiNonRkud
    const { anggaran, realisasi, realisasiNonRkud } = data;
    const [selectedSkpd, setSelectedSkpd] = React.useState('Semua SKPD');
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const [startMonth, setStartMonth] = React.useState(months[0]);
    const [endMonth, setEndMonth] = React.useState(months[months.length - 1]);
    
    const skpdList = React.useMemo(() => {
        const skpds = new Set((anggaran || []).map(item => item.NamaSKPD).filter(Boolean));
        return Array.from(skpds).sort();
    }, [anggaran]);

    // Fungsi klasifikasi berdasarkan KODE rekening (untuk data anggaran & realisasi biasa)
    const classifyRekeningByCode = (kodeRekening) => {
        if (!kodeRekening) return 'Lainnya';
        const kode = String(kodeRekening);
        if (kode.startsWith('5.2')) return 'Belanja Modal';
        if (kode.startsWith('5.1.01')) return 'Belanja Pegawai';
        if (kode.startsWith('5.1.02')) return 'Belanja Barang & Jasa';
        if (kode.startsWith('5.1.05') || kode.startsWith('5.1.06')) return 'Belanja Transfer';
        if (kode.startsWith('5.3')) return 'Belanja Tak Terduga';
        return 'Lainnya';
    };

    // Fungsi klasifikasi baru berdasarkan NAMA rekening (khusus untuk data Non RKUD)
    const classifyRekeningByName = (namaRekening) => {
        if (!namaRekening) return 'Lainnya';
        const nama = String(namaRekening).toUpperCase();
        if (nama.includes('MODAL')) return 'Belanja Modal';
        if (nama.includes('PEGAWAI')) return 'Belanja Pegawai';
        if (nama.includes('BARANG') && nama.includes('JASA')) return 'Belanja Barang & Jasa';
        if (nama.includes('TRANSFER')) return 'Belanja Transfer';
        // BTT tidak dapat diidentifikasi dari nama, jadi akan masuk ke Lainnya
        return 'Lainnya';
    };

    const qualityStats = React.useMemo(() => {
        const initialStats = {
            'Belanja Modal': { pagu: 0, realisasi: 0 },
            'Belanja Pegawai': { pagu: 0, realisasi: 0 },
            'Belanja Barang & Jasa': { pagu: 0, realisasi: 0 },
            'Belanja Transfer': { pagu: 0, realisasi: 0 },
            'Belanja Tak Terduga': { pagu: 0, realisasi: 0 },
            'Lainnya': { pagu: 0, realisasi: 0 },
        };

        const filteredAnggaran = selectedSkpd === 'Semua SKPD' ? (anggaran || []) : (anggaran || []).filter(item => item.NamaSKPD === selectedSkpd);
        
        filteredAnggaran.forEach(item => {
            const category = classifyRekeningByCode(item.KodeRekening);
            initialStats[category].pagu += (item.nilai || 0);
        });

        const startIndex = months.indexOf(startMonth);
        const endIndex = months.indexOf(endMonth);
        const selectedMonths = months.slice(startIndex, endIndex + 1);

        // 2. Menggabungkan dan memfilter data realisasi
        const realisasiBulanIni = selectedMonths.map(month => (realisasi || {})[month] || []).flat();
        const nonRkudBulanIni = selectedMonths.map(month => (realisasiNonRkud || {})[month] || []).flat();
        
        const filteredRealisasi = selectedSkpd === 'Semua SKPD' ? realisasiBulanIni : realisasiBulanIni.filter(item => item.NamaSKPD === selectedSkpd);
        const filteredNonRkud = selectedSkpd === 'Semua SKPD' ? nonRkudBulanIni : nonRkudBulanIni.filter(item => item.NAMASKPD === selectedSkpd);

        // 3. Menghitung realisasi dari kedua sumber dengan metode klasifikasi yang berbeda
        filteredRealisasi.forEach(item => {
            const category = classifyRekeningByCode(item.KodeRekening);
            initialStats[category].realisasi += (item.nilai || 0);
        });

        filteredNonRkud.forEach(item => {
            const category = classifyRekeningByName(item.NAMAREKENING);
            initialStats[category].realisasi += (item.nilai || 0);
        });
        
        const totalPagu = Object.values(initialStats).reduce((sum, item) => sum + item.pagu, 0);
        const totalRealisasi = Object.values(initialStats).reduce((sum, item) => sum + item.realisasi, 0);
        
        const tableData = Object.entries(initialStats).map(([name, values]) => ({
            name,
            ...values,
            persenPagu: totalPagu > 0 ? (values.pagu / totalPagu) * 100 : 0,
            persenRealisasi: totalRealisasi > 0 ? (values.realisasi / totalRealisasi) * 100 : 0,
            penyerapan: values.pagu > 0 ? (values.realisasi / values.pagu) * 100 : 0,
        }));

        const paguChart = tableData.filter(d => d.pagu > 0).map(d => ({ name: d.name, value: d.pagu }));
        const realisasiChart = tableData.filter(d => d.realisasi > 0).map(d => ({ name: d.name, value: d.realisasi }));
        
        return { tableData, paguChart, realisasiChart, totalPagu, totalRealisasi };

    }, [anggaran, realisasi, realisasiNonRkud, selectedSkpd, startMonth, endMonth]); // Ditambahkan realisasiNonRkud

    const getAnalysisPrompt = (customQuery) => {
        if (customQuery) {
            return `Berdasarkan data kualitas belanja, berikan analisis untuk: "${customQuery}"`;
        }
        if (qualityStats.totalPagu === 0) return "Data anggaran tidak cukup untuk analisis.";
        
        const { tableData, totalPagu, totalRealisasi } = qualityStats;
        const belanjaModal = tableData.find(d => d.name === 'Belanja Modal');
        const belanjaOperasi = tableData.filter(d => ['Belanja Pegawai', 'Belanja Barang & Jasa', 'Lainnya'].includes(d.name)).reduce((acc, curr) => ({ pagu: acc.pagu + curr.pagu, realisasi: acc.realisasi + curr.realisasi }), { pagu: 0, realisasi: 0 });

        const rasioModalPagu = (belanjaModal.pagu / totalPagu) * 100;
        const rasioOperasiPagu = (belanjaOperasi.pagu / totalPagu) * 100;
        const period = startMonth === endMonth ? startMonth : `periode ${startMonth} - ${endMonth}`;

        return `
            Anda adalah seorang analis kebijakan fiskal. Lakukan analisis kualitas belanja untuk **${selectedSkpd}** pada **${period}**.
            
            ### Komposisi Anggaran (Pagu)
            - **Total Anggaran Belanja**: ${formatCurrency(totalPagu)}
            - **Belanja Modal**: ${formatCurrency(belanjaModal.pagu)} (${rasioModalPagu.toFixed(2)}%)
            - **Belanja Operasi (Pegawai, Barang/Jasa, Lainnya)**: ${formatCurrency(belanjaOperasi.pagu)} (${rasioOperasiPagu.toFixed(2)}%)
            
            ### Komposisi Realisasi (${period})
            - **Total Realisasi Belanja**: ${formatCurrency(totalRealisasi)}
            - **Realisasi Belanja Modal**: ${formatCurrency(belanjaModal.realisasi)} (Penyerapan: ${belanjaModal.penyerapan.toFixed(2)}%)
            - **Realisasi Belanja Operasi**: ${formatCurrency(belanjaOperasi.realisasi)}
            
            Berikan analisis mendalam mengenai:
            1.  **Kualitas Alokasi Anggaran**: Apakah rasio belanja modal terhadap belanja operasi sudah ideal? (Umumnya, porsi belanja modal yang lebih tinggi dianggap lebih berkualitas untuk pembangunan jangka panjang).
            2.  **Kualitas Eksekusi Anggaran**: Bandingkan tingkat penyerapan antara belanja modal dan jenis belanja lainnya. Apakah ada kendala dalam merealisasikan belanja modal?
            3.  **Rekomendasi**: Berikan rekomendasi konkret untuk meningkatkan kualitas belanja di masa depan, baik dari sisi perencanaan maupun eksekusi.
        `;
    };
    
    const PIE_COLORS = {
        'Belanja Modal': '#10B981', 
        'Belanja Pegawai': '#EF4444', 
        'Belanja Barang & Jasa': '#F59E0B', 
        'Belanja Transfer': '#3B82F6', 
        'Belanja Tak Terduga': '#6366F1', 
        'Lainnya': '#6B7280'
    };


    return (
        <div className="space-y-6">
            <SectionTitle>Analisis Belanja</SectionTitle>
            <GeminiAnalysis 
                getAnalysisPrompt={getAnalysisPrompt} 
                disabledCondition={qualityStats.totalPagu === 0} 
                theme={theme}
                interactivePlaceholder="Bandingkan porsi belanja modal dan pegawai..."
            />
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <select
                        value={selectedSkpd}
                        onChange={(e) => setSelectedSkpd(e.target.value)}
                        className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                        <option value="Semua SKPD">-- Semua SKPD --</option>
                        {skpdList.map(skpd => <option key={skpd} value={skpd}>{skpd}</option>)}
                    </select>
                     <div className="md:col-span-2 grid grid-cols-2 gap-4">
                        <select value={startMonth} onChange={e => setStartMonth(e.target.value)} className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
                            {months.map(month => <option key={`start-${month}`} value={month}>Dari: {month}</option>)}
                        </select>
                        <select value={endMonth} onChange={e => setEndMonth(e.target.value)} className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
                            {months.map(month => <option key={`end-${month}`} value={month}>Sampai: {month}</option>)}
                        </select>
                    </div>
                </div>

                {qualityStats.totalPagu > 0 ? (
                    <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-center">Komposisi Pagu Anggaran</h3>
                             <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie data={qualityStats.paguChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                        {qualityStats.paguChart.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => formatCurrency(value)} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-center">Komposisi Realisasi ({startMonth} - {endMonth})</h3>
                             <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie data={qualityStats.realisasiChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                        {qualityStats.realisasiChart.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => formatCurrency(value)} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Jenis Belanja</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Pagu Anggaran</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Realisasi</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">% Pagu</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">% Realisasi</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Penyerapan</th>
                                </tr>
                            </thead>
                             <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {qualityStats.tableData.map(item => (
                                    <tr key={item.name} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center">
                                            <span className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: PIE_COLORS[item.name] }}></span>
                                            {item.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">{formatCurrency(item.pagu)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">{formatCurrency(item.realisasi)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">{item.persenPagu.toFixed(2)}%</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">{item.persenRealisasi.toFixed(2)}%</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-700 dark:text-gray-300">{item.penyerapan.toFixed(2)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    </>
                ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-10">Tidak ada data anggaran untuk ditampilkan. Silakan unggah data terlebih dahulu.</p>
                )}
            </div>
        </div>
    );
};

export default AnalisisKualitasBelanjaView;