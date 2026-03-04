import React from 'react';
import SectionTitle from './SectionTitle';
import { exp } from "firebase/firestore/pipelines";

// UPDATED: MandatorySpendingView Component
const MandatorySpendingView = ({ data, theme, namaPemda, selectedYear }) => {
    const { anggaran, realisasi, realisasiNonRkud } = data; 
    const [activeTab, setActiveTab] = React.useState('pegawai');
    
    const [refPendidikan, setRefPendidikan] = React.useState([]);
    const [refInfrastruktur, setRefInfrastruktur] = React.useState([]);

    React.useEffect(() => {
        const unsubFunctions = [];
        const fetchData = (type, setter) => {
            const ref = collection(db, "publicData", String(selectedYear), `referensi-${type}`);
            const unsubscribe = onSnapshot(ref, (snapshot) => {
                let fetchedData = [];
                snapshot.forEach(doc => {
                    if (Array.isArray(doc.data().rows)) {
                        fetchedData.push(...doc.data().rows);
                    }
                });
                setter(fetchedData);
            }, (err) => {
                console.error(`Error fetching ${type} reference:`, err);
                setter([]);
            });
            unsubFunctions.push(unsubscribe);
        };

        fetchData('pendidikan', setRefPendidikan);
        fetchData('infrastruktur', setRefInfrastruktur);

        return () => unsubFunctions.forEach(unsub => unsub());
    }, [selectedYear]);


    const analysisData = React.useMemo(() => {
        if (!anggaran || anggaran.length === 0) {
            return { pegawai: {}, infrastruktur: {}, pendidikan: {} };
        }

        const normalizeRealisasiItem = (item, isNonRkud = false) => {
             if (!item) return null;
             const kodeSubKegiatan = isNonRkud ? item.KODESUBKEGIATAN : item.KodeSubKegiatan;
             const kodeRekening = isNonRkud ? item.KODEREKENING : item.KodeRekening;
             const namaSkpd = isNonRkud ? item.NAMASKPD : item.NamaSKPD;
             // --- PERBAIKAN DI SINI ---
             // Data RKUD (isNonRkud=false) menggunakan 'NamaSubSKPD' (dari mapping)
             // Data Non-RKUD (isNonRkud=true) menggunakan 'NAMASUBSKPD'
             const namaSubUnit = isNonRkud ? item.NAMASUBSKPD : item.NamaSubSKPD; 
             // --- AKHIR PERBAIKAN ---
             const namaSubKegiatan = isNonRkud ? item.NAMASUBKEGIATAN : item.NamaSubKegiatan; 

             if (!namaSkpd) return null; 

             return { 
                 KodeSubKegiatan: kodeSubKegiatan || 'Tidak Ada Kode', 
                 KodeRekening: kodeRekening || 'Tidak Ada Kode', 
                 NamaSKPD: namaSkpd, 
                 NamaSubUnit: namaSubUnit || 'Tidak Ada Sub Unit', 
                 NamaSubKegiatan: namaSubKegiatan || 'Tidak Ada Nama Sub Kegiatan', 
                 nilai: item.nilai || 0 
             };
        };
        
        const allRealisasi = [
            ...Object.values(realisasi || {}).flat().map(item => normalizeRealisasiItem(item, false)),
            ...Object.values(realisasiNonRkud || {}).flat().map(item => normalizeRealisasiItem(item, true))
        ].filter(Boolean);

        const pendidikanCodes = new Set(refPendidikan.map(item => String(item['KODE SUB KEGIATAN']).trim()));
        const infrastrukturNormalCodes = new Set();
        const infrastrukturXxxNames = new Set();
        refInfrastruktur.forEach(item => {
            const code = String(item['KODE SUB KEGIATAN']).trim();
            const name = String(item['NAMA SUB KEGIATAN']).toLowerCase().trim();
            if (code.toUpperCase().startsWith('X.XX')) {
                infrastrukturXxxNames.add(name);
            } else {
                infrastrukturNormalCodes.add(code);
            }
        });

        const isPendidikan = (item) => {
             if (!item) return false;
             const kodeSubKegiatan = String(item.KodeSubKegiatan || '').trim();
             const namaSkpd = String(item.NamaSKPD || '').trim();
             const specialEducationActivities = [
                'Penyediaan Gaji dan Tunjangan ASN',
                'Penyuluhan dan Penyebarluasan Kebijakan Retribusi Daerah',
                'Sosialisasi Peraturan Perundang-Undangan'
             ];
             // Pastikan NamaSubKegiatan ada sebelum memanggil includes
             const namaSubKegiatan = String(item.NamaSubKegiatan || ''); 
             return pendidikanCodes.has(kodeSubKegiatan) || (namaSkpd === 'Dinas Pendidikan dan Kebudayaan' && specialEducationActivities.includes(namaSubKegiatan));
        };
        const isInfrastruktur = (item) => {
             if (!item) return false;
             const kodeSubKegiatan = String(item.KodeSubKegiatan || '').trim();
             const namaSubKegiatan = String(item.NamaSubKegiatan || '').toLowerCase().trim();
             return infrastrukturNormalCodes.has(kodeSubKegiatan) || infrastrukturXxxNames.has(namaSubKegiatan);
        };
       
        // --- PERBAIKAN UTAMA: Fungsi Agregasi Detail ---
        const aggregateDetails = (anggaranItems, relevantRealisasi) => {
            const aggregatedMap = new Map();

            // 1. Agregasi Pagu Anggaran
            anggaranItems.forEach(item => {
                if (!item) return; 
                
                let aggregationKey;
                const kodeSubKegiatanStr = String(item.KodeSubKegiatan || '').trim();
                 if (kodeSubKegiatanStr.toUpperCase().startsWith('X.XX')) {
                    aggregationKey = `${item.NamaSKPD}|${item.NamaSubUnit || ' '}|${item.NamaSubKegiatan}`;
                } else {
                    aggregationKey = `${item.NamaSKPD}|${item.NamaSubUnit || ' '}|${kodeSubKegiatanStr}`;
                }

                if (!aggregatedMap.has(aggregationKey)) {
                    aggregatedMap.set(aggregationKey, {
                        NamaSKPD: item.NamaSKPD,
                        NamaSubUnit: item.NamaSubUnit,
                        KodeSubKegiatan: item.KodeSubKegiatan, 
                        NamaSubKegiatan: item.NamaSubKegiatan,
                        pagu: 0,
                        realisasi: 0, // Inisialisasi realisasi
                        sisa: 0      
                    });
                }
                const entry = aggregatedMap.get(aggregationKey);
                entry.pagu += item.pagu; // Gunakan item.pagu (nilai asli dari anggaran)
            });

            // 2. Agregasi Realisasi HANYA untuk item yang relevan
            relevantRealisasi.forEach(item => {
                 let aggregationKey;
                 const kodeSubKegiatanStr = String(item.KodeSubKegiatan || '').trim();
                 if (kodeSubKegiatanStr.toUpperCase().startsWith('X.XX')) {
                     aggregationKey = `${item.NamaSKPD}|${item.NamaSubUnit || ' '}|${item.NamaSubKegiatan}`;
                 } else {
                     aggregationKey = `${item.NamaSKPD}|${item.NamaSubUnit || ' '}|${kodeSubKegiatanStr}`;
                 }

                 if (aggregatedMap.has(aggregationKey)) {
                     const entry = aggregatedMap.get(aggregationKey);
                     entry.realisasi += item.nilai; // Tambahkan nilai realisasi ke entri yang cocok
                 }
            });

            // 3. Hitung Sisa dan Persentase
            aggregatedMap.forEach((entry) => {
                entry.sisa = entry.pagu - entry.realisasi;
            });

            return Array.from(aggregatedMap.values()).map(item => ({
                ...item,
                persentase: item.pagu > 0 ? (item.realisasi / item.pagu) * 100 : 0
            }));
        };
        // --- AKHIR PERBAIKAN UTAMA ---

        const totalAPBD = anggaran.reduce((sum, item) => sum + (item?.nilai || 0), 0);
        
        const excludedPegawaiCodes = [ '5.1.01.02.06.0064', '5.1.01.02.06.0066', '5.1.01.02.06.0070', '5.1.01.02.06.0072', '5.1.01.03.03.0001', '5.1.01.03.09.0001', '5.1.01.03.05.0001', '5.1.01.03.11.0001', '5.1.01.02.006.00064', '5.1.01.02.006.00070', '5.1.01.02.006.00066', '5.1.01.02.006.00072'];

        let totalBelanjaPegawai = 0;
        let belanjaPegawaiDikecualikan = 0;
        let belanjaPendidikan = 0;
        let belanjaInfrastruktur = 0;
        let rawDetailPendidikan = []; 
        let rawDetailInfrastruktur = []; 
        
        anggaran.forEach(item => {
            if (!item) return; 
            const kodeRekening = String(item.KodeRekening || '').trim();
            const nilai = item.nilai || 0;
            const processedItem = { ...item, pagu: nilai }; 

            // Pegawai
            if (kodeRekening.startsWith('5.1.01')) {
                totalBelanjaPegawai += nilai;
                if (excludedPegawaiCodes.includes(kodeRekening)) {
                    belanjaPegawaiDikecualikan += nilai;
                }
            }
            
            // Pendidikan
            if (isPendidikan(item)) { 
                belanjaPendidikan += nilai;
                if(processedItem) rawDetailPendidikan.push(processedItem); 
            }

            // Infrastruktur
            if (isInfrastruktur(item)) { 
                belanjaInfrastruktur += nilai;
                 if(processedItem) rawDetailInfrastruktur.push(processedItem);
            }
        });
        
        const belanjaPegawaiUntukPerhitungan = totalBelanjaPegawai - belanjaPegawaiDikecualikan;
        
        // Filter realisasi yang relevan untuk setiap kategori SEBELUM memanggil aggregateDetails
        const realisasiPendidikan = allRealisasi.filter(isPendidikan);
        const realisasiInfrastruktur = allRealisasi.filter(isInfrastruktur);

        const pegawai = {
            totalAPBD, totalBelanjaPegawai, belanjaPegawaiDikecualikan, belanjaPegawaiUntukPerhitungan,
            percentage: totalAPBD > 0 ? (belanjaPegawaiUntukPerhitungan / totalAPBD) * 100 : 0,
            detailItems: [] 
        };

        const infrastruktur = {
            totalAPBD, belanjaInfrastruktur,
            percentage: totalAPBD > 0 ? (belanjaInfrastruktur / totalAPBD) * 100 : 0,
            detailItems: aggregateDetails(rawDetailInfrastruktur, realisasiInfrastruktur) 
        };
        
        const pendidikan = {
            totalAPBD, belanjaPendidikan,
            percentage: totalAPBD > 0 ? (belanjaPendidikan / totalAPBD) * 100 : 0,
            detailItems: aggregateDetails(rawDetailPendidikan, realisasiPendidikan) 
        };

        return { pegawai, infrastruktur, pendidikan };
    }, [anggaran, realisasi, realisasiNonRkud, refPendidikan, refInfrastruktur]);

    const renderAnalysisContent = () => {
        switch (activeTab) {
            case 'infrastruktur':
                return <AnalysisCard
                    title="Belanja Infrastruktur Pelayanan Publik"
                    data={analysisData.infrastruktur}
                    threshold={40}
                    type="infrastruktur"
                    getAnalysisPrompt={getAnalysisPrompt}
                    namaPemda={namaPemda}
                    selectedYear={selectedYear}
                    theme={theme}
                />;
            case 'pendidikan':
                return <AnalysisCard
                    title="Fungsi Pendidikan"
                    data={analysisData.pendidikan}
                    threshold={20}
                    type="pendidikan"
                    getAnalysisPrompt={getAnalysisPrompt}
                    namaPemda={namaPemda}
                    selectedYear={selectedYear}
                    theme={theme}
                />;
            case 'pegawai':
            default:
                return <AnalysisCard
                    title="Belanja Pegawai"
                    data={analysisData.pegawai}
                    threshold={30}
                    type="pegawai"
                    getAnalysisPrompt={getAnalysisPrompt}
                    namaPemda={namaPemda}
                    selectedYear={selectedYear}
                    theme={theme}
                />;
        }
    };
    
    return (
        <div className="space-y-6">
            <SectionTitle>ANALISA MANDATORY SPENDING</SectionTitle>
            <div className="flex border-b dark:border-gray-700">
                <TabButton title="Belanja Pegawai" isActive={activeTab === 'pegawai'} onClick={() => setActiveTab('pegawai')} />
                <TabButton title="Belanja Infrastruktur" isActive={activeTab === 'infrastruktur'} onClick={() => setActiveTab('infrastruktur')} />
                <TabButton title="Fungsi Pendidikan" isActive={activeTab === 'pendidikan'} onClick={() => setActiveTab('pendidikan')} />
            </div>
            {renderAnalysisContent()}
        </div>
    );
};

const getAnalysisPrompt = (type, data, customQuery, namaPemda, selectedYear) => {
    if (customQuery) {
        return `Berdasarkan data mandatory spending, berikan analisis untuk: "${customQuery}"`;
    }
    
    let promptIntro = `Anda adalah seorang analis anggaran ahli untuk ${namaPemda || 'pemerintah daerah'}. `;
    let analysisDetails = '';
    let recommendationFocus = '';

    switch (type) {
        case 'pegawai':
            analysisDetails = `
Analisis Mandatory Spending untuk Belanja Pegawai tahun ${selectedYear} berdasarkan formula ((Total Belanja Pegawai - Belanja Pegawai Dikecualikan) / Total APBD).
Data menunjukkan:
- Total APBD: ${formatCurrency(data.totalAPBD)}
- Total Belanja Pegawai: ${formatCurrency(data.totalBelanjaPegawai)}
- Belanja Pegawai Dikecualikan: ${formatCurrency(data.belanjaPegawaiDikecualikan)}
- Dasar Perhitungan Belanja Pegawai: ${formatCurrency(data.belanjaPegawaiUntukPerhitungan)}
- Persentase Mandatory Spending: ${data.percentage.toFixed(2)}%`;
            recommendationFocus = `Apakah persentase belanja pegawai sebesar ${data.percentage.toFixed(2)}% ini berada dalam batas wajar (umumnya di bawah 30%)? Apa implikasinya terhadap ruang fiskal? Berikan rekomendasi jika porsi belanja pegawai dianggap terlalu tinggi.`;
            break;
        case 'infrastruktur':
            analysisDetails = `
Analisis Mandatory Spending untuk Belanja Infrastruktur Pelayanan Publik tahun ${selectedYear}.
Data menunjukkan:
- Total APBD: ${formatCurrency(data.totalAPBD)}
- Belanja Infrastruktur: ${formatCurrency(data.belanjaInfrastruktur)}
- Persentase dari Total APBD: ${data.percentage.toFixed(2)}%`;
            recommendationFocus = `Apakah persentase belanja infrastruktur sebesar ${data.percentage.toFixed(2)}% ini sudah memenuhi batas minimal 40%? Apa saja program/kegiatan yang menjadi pendorong utama? Berikan rekomendasi untuk meningkatkan alokasi belanja infrastruktur jika belum tercapai.`;
            break;
        case 'pendidikan':
            analysisDetails = `
Analisis Mandatory Spending untuk Fungsi Pendidikan tahun ${selectedYear}.
Data menunjukkan:
- Total APBD: ${formatCurrency(data.totalAPBD)}
- Belanja Fungsi Pendidikan: ${formatCurrency(data.belanjaPendidikan)}
- Persentase dari Total APBD: ${data.percentage.toFixed(2)}%`;
            recommendationFocus = `Apakah persentase belanja fungsi pendidikan sebesar ${data.percentage.toFixed(2)}% ini sudah memenuhi batas minimal 20%? Apa saja program pendidikan yang mendapatkan alokasi terbesar? Berikan rekomendasi untuk optimalisasi anggaran pendidikan.`;
            break;
    }

    return `${promptIntro}${analysisDetails}\n\nBerikan analisis mengenai:\n${recommendationFocus}`;
};

export default MandatorySpendingView;