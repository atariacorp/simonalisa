import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  ArrowDownCircle, Receipt, Globe, MinusCircle, Loader
} from 'lucide-react';
import SectionTitle from './SectionTitle';
import GeminiAnalysis from './GeminiAnalysis';
import { formatCurrency } from './formatCurrency';
import StatCard from './StatCard'; // jika StatCard sudah dipisah

const DashboardView = ({ data = {}, theme, selectedYear, namaPemda, lastUpdate, userRole, includeNonRKUD, totalRealisasiNonRKUD, userCanUseAi }) => {
  const { anggaran, pendapatan, penerimaanPembiayaan, pengeluaranPembiayaan, realisasi, realisasiPendapatan } = data;
  
  if (!anggaran || !pendapatan || !realisasi || !realisasiPendapatan) {
    return <div className="flex justify-center items-center h-64"><Loader className="animate-spin text-blue-500" size={40} /></div>;
  }
  
  const lastUpdateString = lastUpdate 
    ? new Date(lastUpdate).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric' 
      }) 
    : null;
  
  const {
      totalAnggaran,
      totalPendapatan,
      totalRealisasiBelanja,
      totalGabunganBelanja,
      totalRealisasiPendapatan,
      totalPenerimaanPembiayaan,
      totalPengeluaranPembiayaan
  } = useMemo(() => {
      const totalAnggaran = (anggaran || []).reduce((sum, item) => sum + (item.nilai || 0), 0);
      const totalPendapatan = (pendapatan || []).reduce((sum, item) => sum + (item.nilai || 0), 0);
      
      const totalRealisasiBelanja = Object.values(realisasi || {}).flat().reduce((sum, item) => sum + (item.nilai || 0), 0);
      const totalGabunganBelanja = includeNonRKUD ? totalRealisasiBelanja + totalRealisasiNonRKUD : totalRealisasiBelanja;
      
      const totalRealisasiPendapatan = Object.values(realisasiPendapatan || {}).flat().reduce((sum, item) => sum + (item.nilai || 0), 0);
      const totalPenerimaanPembiayaan = (penerimaanPembiayaan || []).reduce((sum, item) => sum + (item.nilai || 0), 0);
      const totalPengeluaranPembiayaan = (pengeluaranPembiayaan || []).reduce((sum, item) => sum + (item.nilai || 0), 0);

      return {
          totalAnggaran, totalPendapatan, totalRealisasiBelanja,
          totalGabunganBelanja, totalRealisasiPendapatan, totalPenerimaanPembiayaan, totalPengeluaranPembiayaan
      };
  }, [anggaran, pendapatan, penerimaanPembiayaan, pengeluaranPembiayaan, realisasi, realisasiPendapatan, includeNonRKUD, totalRealisasiNonRKUD]);

  const penyerapanAnggaranPercentage = totalAnggaran > 0 ? (totalGabunganBelanja / totalAnggaran) * 100 : 0;
  const pencapaianPendapatanPercentage = totalPendapatan > 0 ? (totalRealisasiPendapatan / totalPendapatan) * 100 : 0;
  const penyerapanRkudPercentage = totalAnggaran > 0 ? (totalRealisasiBelanja / totalAnggaran) * 100 : 0;
  const penyerapanNonRkudPercentage = totalAnggaran > 0 ? (totalRealisasiNonRKUD / totalAnggaran) * 100 : 0;

  const sumberDanaData = useMemo(() => {
    const danaMap = new Map();
    (anggaran || []).forEach(item => {
        const sumber = item.NamaSumberDana || 'Tidak Diketahui';
        danaMap.set(sumber, (danaMap.get(sumber) || 0) + item.nilai);
    });
    return Array.from(danaMap, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [anggaran]);

  const anggaranPerSkpd = useMemo(() => {
    const skpdMap = new Map();
    (anggaran || []).forEach(item => {
        const skpd = item.NamaSKPD || 'Tanpa SKPD';
        const currentValue = skpdMap.get(skpd) || 0;
        skpdMap.set(skpd, currentValue + (item.nilai || 0));
    });
    return Array.from(skpdMap, ([NamaSKPD, nilai]) => ({ NamaSKPD, nilai }))
                .sort((a, b) => b.nilai - a.nilai);
  }, [anggaran]);
  
  const pendapatanPerOpd = useMemo(() => {
    const opdMap = new Map();
    (pendapatan || []).forEach(item => {
        const opd = item.NamaOPD || 'Tanpa OPD';
        const currentValue = opdMap.get(opd) || 0;
        opdMap.set(opd, currentValue + (item.nilai || 0));
    });
    return Array.from(opdMap, ([NamaOPD, nilai]) => ({ NamaOPD, nilai }))
                .sort((a, b) => b.nilai - a.nilai);
  }, [pendapatan]);

  const getDashboardAnalysisPrompt = (customQuery, allData) => {
    if (customQuery) {
        let prompt = `Anda adalah seorang analis keuangan ahli untuk ${namaPemda || 'pemerintah daerah'} tahun ${selectedYear}.\n`;
        prompt += `Berdasarkan data yang tersedia, berikan analisis untuk permintaan berikut: "${customQuery}"\n\n`;

        const queryLower = customQuery.toLowerCase();
        let dataFound = false;
        
        const entityName = queryLower.replace(/analisis|untuk|skpd|dinas|badan|kantor|opd|anggaran|pendapatan|realisasi/g, "").trim();

        if (entityName) {
            const filteredAnggaran = (allData.anggaran || []).filter(item => item.NamaSKPD?.toLowerCase().includes(entityName));
            const filteredPendapatan = (allData.pendapatan || []).filter(item => item.NamaOPD?.toLowerCase().includes(entityName));
            const filteredRealisasiBelanja = Object.values(allData.realisasi || {}).flat().filter(item => item.NamaSKPD?.toLowerCase().includes(entityName));
            const filteredRealisasiPendapatan = Object.values(allData.realisasiPendapatan || {}).flat().filter(item => item.SKPD?.toLowerCase().includes(entityName));

            if (filteredAnggaran.length > 0) {
                dataFound = true;
                const total = filteredAnggaran.reduce((s, i) => s + i.nilai, 0);
                prompt += `Data Anggaran untuk "${entityName}":\n- Total Pagu Anggaran: ${formatCurrency(total)}\n`;
            }
            if (filteredPendapatan.length > 0) {
                dataFound = true;
                const total = filteredPendapatan.reduce((s, i) => s + i.nilai, 0);
                prompt += `Data Target Pendapatan untuk "${entityName}":\n- Total Target: ${formatCurrency(total)}\n`;
            }
            if (filteredRealisasiBelanja.length > 0) {
                dataFound = true;
                const total = filteredRealisasiBelanja.reduce((s, i) => s + i.nilai, 0);
                prompt += `Data Realisasi Belanja untuk "${entityName}":\n- Total Realisasi: ${formatCurrency(total)}\n`;
            }
            if (filteredRealisasiPendapatan.length > 0) {
                dataFound = true;
                const total = filteredRealisasiPendapatan.reduce((s, i) => s + i.nilai, 0);
                prompt += `Data Realisasi Pendapatan untuk "${entityName}":\n- Total Realisasi: ${formatCurrency(total)}\n`;
            }
        }

        if (!dataFound) {
            prompt += "Tidak ada data spesifik yang ditemukan untuk permintaan itu. Berikan analisis umum berdasarkan data keseluruhan yang tersedia.";
        } else {
             prompt += "\nBerikan analisis mendalam, temukan anomali, dan berikan rekomendasi yang dapat ditindaklanjuti berdasarkan data yang disaring ini.";
        }
        return prompt;
    }
    
    return `
    Anda adalah seorang Auditor Ahli dan Penasihat Keuangan Daerah untuk ${namaPemda || 'pemerintah daerah'}.
    Tugas Anda adalah menganalisis data ringkas APBD tahun ${selectedYear} berikut dan memberikan peringatan dini serta rekomendasi kebijakan yang tajam.
    
    Data Ringkas:
    - Target Pendapatan: ${formatCurrency(totalPendapatan)}
    - Realisasi Pendapatan: ${formatCurrency(totalRealisasiPendapatan)} (${pencapaianPendapatanPercentage.toFixed(2)}%)
    - Pagu Anggaran Belanja: ${formatCurrency(totalAnggaran)}
    - Realisasi Belanja (Gabungan): ${formatCurrency(totalGabunganBelanja)} (${penyerapanAnggaranPercentage.toFixed(2)}%)
     - (Rincian: RKUD ${formatCurrency(totalRealisasiBelanja)}, Non-RKUD ${formatCurrency(totalRealisasiNonRKUD)})
    - Target Penerimaan Pembiayaan: ${formatCurrency(totalPenerimaanPembiayaan)}
    - Target Pengeluaran Pembiayaan: ${formatCurrency(totalPengeluaranPembiayaan)}
    
    Format Laporan Anda HARUS JELAS dan TEGAS. Gunakan format Markdown:
    
    ### 1. PERINGATAN UTAMA (TEMUAN PALING KRITIS)
    (Identifikasi 1-2 masalah paling mendesak. Misalnya: Penyerapan anggaran sangat rendah? Realisasi pendapatan jauh dari target?)
    
    ### 2. ANALISIS RISIKO
    (Jelaskan 2-3 risiko utama yang mungkin terjadi jika peringatan di atas tidak ditangani. Misalnya: Risiko SiLPA tinggi, Risiko gagal bayar proyek, Risiko target PAD tidak tercapai.)
    
    ### 3. REKOMENDASI KEBIJAKAN YANG DAPAT DITINDAKLANJUTI
    (Berikan 3-5 poin rekomendasi yang spesifik, konkret, dan langsung dapat dieksekusi oleh pimpinan daerah untuk mengatasi risiko tersebut.)
    `;
  };
  
  const apbdChartData = [
      { name: 'Pendapatan Daerah', Target: totalPendapatan, Realisasi: totalRealisasiPendapatan },
      { name: 'Belanja Daerah', Target: totalAnggaran, Realisasi: totalGabunganBelanja },
      { name: 'Penerimaan Pembiayaan', Target: totalPenerimaanPembiayaan, Realisasi: 0 },
      { name: 'Pengeluaran Pembiayaan', Target: totalPengeluaranPembiayaan, Realisasi: 0 },
  ];
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560', '#8884d8', '#82ca9d'];

  return (
    <div className="space-y-8">
        <div className="flex justify-between items-center">
            <SectionTitle>Dashboard & Analisis Interaktif</SectionTitle>
            {lastUpdateString && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Data Realisasi Diperbarui Pada: {lastUpdateString}
                </p>
            )}
        </div>
        <GeminiAnalysis 
            getAnalysisPrompt={getDashboardAnalysisPrompt} 
            disabledCondition={totalAnggaran === 0 && totalPendapatan === 0} 
            theme={theme}
            allData={data}
            selectedYear={selectedYear}
            interactivePlaceholder="Contoh: Analisis anggaran untuk Dinas Pendidikan"
            userRole={userRole}
            userCanUseAi={userCanUseAi}
        />
       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <StatCard 
                icon={<ArrowDownCircle className="text-blue-500" size={24} />}
                title="Pendapatan Daerah"
                target={totalPendapatan}
                realisasi={totalRealisasiPendapatan}
                percentage={pencapaianPendapatanPercentage}
                colorClass="blue"
            />
            <StatCard 
                icon={<Receipt className="text-red-500" size={24} />}
                title="Belanja Daerah"
                target={totalAnggaran}
                realisasi={totalGabunganBelanja}
                percentage={penyerapanAnggaranPercentage}
                colorClass="red"
                rkud={totalRealisasiBelanja}
                nonRkud={totalRealisasiNonRKUD}
                rkudPercentage={penyerapanRkudPercentage}
                nonRkudPercentage={penyerapanNonRkudPercentage}
            />
            <StatCard 
                icon={<Globe className="text-gray-500" size={24} />}
                title="Penerimaan Pembiayaan"
                target={totalPenerimaanPembiayaan}
                realisasi={0}
                percentage={0}
                colorClass="gray"
            />
            <StatCard 
                icon={<MinusCircle className="text-green-500" size={24} />}
                title="Pengeluaran Pembiayaan"
                target={totalPengeluaranPembiayaan}
                realisasi={0}
                percentage={0}
                colorClass="green"
            />
       </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Grafik APBD</h3>
            <ResponsiveContainer width="100%" height={400}>
                <BarChart data={apbdChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(val) => `${(val / 1e9).toFixed(1)} M`} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="Target" fill="#435EBE" name="Target/Pagu" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Realisasi" fill="#1E293B" name="Realisasi" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Anggaran Belanja per SKPD (Top 10)</h3>
                <ResponsiveContainer width="100%" height={450}>
                    <BarChart data={anggaranPerSkpd.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 30, left: 150, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                        <XAxis type="number" tickFormatter={(val) => `${(val / 1e9).toFixed(1)} M`} tick={{ fontSize: 12 }} />
                        <YAxis type="category" dataKey="NamaSKPD" tick={{ fontSize: 12, width: 140 }} />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Bar dataKey="nilai" name="Anggaran">
                            {anggaranPerSkpd.slice(0, 10).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Komposisi Pendapatan per OPD (Top 10)</h3>
                <ResponsiveContainer width="100%" height={450}>
                    <BarChart data={pendapatanPerOpd.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                        <XAxis type="number" tickFormatter={(val) => `${(val / 1e9).toFixed(1)} M`} tick={{ fontSize: 12 }} />
                        <YAxis type="category" dataKey="NamaOPD" tick={{ fontSize: 12, width: 90 }}/>
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Bar dataKey="nilai" name="Target Pendapatan">
                            {pendapatanPerOpd.slice(0, 10).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mt-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Komposisi Sumber Dana</h3>
            <ResponsiveContainer width="100%" height={450}>
                <BarChart data={sumberDanaData} margin={{ top: 5, right: 30, left: 20, bottom: 120 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(val) => `${(val / 1e9).toFixed(1)} M`} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="value" name="Pagu Anggaran" radius={[4, 4, 0, 0]}>
                        {sumberDanaData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    </div>
  );
};

export default DashboardView;