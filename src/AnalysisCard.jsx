import React, { useState, useMemo, useEffect } from 'react';
import AnalysisCard from './AnalysisCard';
import { Search, Download, ChevronDown, ChevronRight } from 'lucide-react';
import ProgressCircle from './ProgressCircle';
import Pagination from './Pagination';
// import GeminiAnalysis from './GeminiAnalysis'; // Akan diimpor setelah komponen ini dibuat

// Sementara definisikan formatCurrency di sini (nanti akan dipindah ke utils)
const formatCurrency = (value) => {
  if (typeof value !== 'number' || isNaN(value)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const AnalysisCard = ({ title, data, threshold, type, getAnalysisPrompt, namaPemda, selectedYear, theme }) => {
    const [isDetailsVisible, setIsDetailsVisible] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const isExceeding = type === 'pegawai' ? data.percentage > threshold : data.percentage < threshold;
    const description = {
        pegawai: "Belanja pegawai paling tinggi 30% (tiga puluh persen) dari total belanja APBD termasuk untuk ASN, kepala daerah, dan anggota DPRD, serta tidak termasuk untuk Tamsil guru, TKG, TPG, dan tunjangan sejenis lainnya yang bersumber dari TKD yang telah ditentukan penggunaannya.",
        infrastruktur: "Belanja infrastruktur pelayanan publik paling rendah 40% (empat puluh persen) dari total belanja APBD, di luar belanja bagi hasil dan/atau transfer kepada daerah dan/atau desa.",
        pendidikan: "Anggaran fungsi pendidikan paling sedikit 20% (dua puluh persen) dari total belanja APBD."
    };

    const detailItems = data.detailItems || [];
    const filteredDetails = useMemo(() => {
        return detailItems.filter(item =>
            Object.values(item).some(val =>
                String(val).toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
    }, [detailItems, searchTerm]);

    const totalDetailPages = Math.ceil(filteredDetails.length / ITEMS_PER_PAGE);
    const paginatedDetails = filteredDetails.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handleDetailPageChange = (page) => {
        if (page > 0 && page <= totalDetailPages) {
            setCurrentPage(page);
        }
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const handleDownloadExcel = () => {
        if (!filteredDetails || filteredDetails.length === 0) {
            alert("Tidak ada data untuk diunduh.");
            return;
        }
        if (!window.XLSX) {
            alert("Pustaka unduh Excel tidak tersedia.");
            return;
        }

        try {
            const dataForExport = filteredDetails.map(item => ({
                'Nama SKPD': item.NamaSKPD,
                'Nama Sub Unit': item.NamaSubUnit,
                'Kode Sub Kegiatan': item.KodeSubKegiatan,
                'Nama Sub Kegiatan': item.NamaSubKegiatan,
                'Pagu': item.pagu,
                'Realisasi': item.realisasi,
                'Sisa Anggaran': item.sisa,
                'Persentase (%)': item.persentase.toFixed(2)
            }));

            const worksheet = window.XLSX.utils.json_to_sheet(dataForExport);
            const workbook = window.XLSX.utils.book_new();
            window.XLSX.utils.book_append_sheet(workbook, worksheet, "Rincian Belanja");
            
            const fileName = `Rincian_Belanja_${title.replace(/ /g, "_")}_${selectedYear}.xlsx`;
            window.XLSX.writeFile(workbook, fileName);
        } catch (err) {
            console.error("Error creating Excel file:", err);
            alert("Gagal membuat file Excel.");
        }
    };

    const detailHeaders = ['Nama SKPD', 'Nama Sub Unit', 'Kode Sub Kegiatan', 'Nama Sub Kegiatan', 'Pagu', 'Realisasi', 'Sisa Anggaran', '%'];

    return (
        <div className="space-y-6">
            {data.percentage > 0 && isExceeding && (
                <div className={`${type === 'pegawai' ? 'bg-red-100 border-red-500 text-red-700' : 'bg-yellow-100 border-yellow-500 text-yellow-700'} border-l-4 p-4 rounded-md`} role="alert">
                    <p className="font-bold">{type === 'pegawai' ? 'Peringatan' : 'Perhatian'}</p>
                    <p>
                        Persentase {title} sebesar {data.percentage?.toFixed(2)}% {type === 'pegawai' ? 'telah melebihi' : 'belum mencapai'} batas {type === 'pegawai' ? 'maksimal' : 'minimal'} {threshold}% yang diatur.
                    </p>
                </div>
            )}
            
            {/* <GeminiAnalysis 
                getAnalysisPrompt={(customQuery) => getAnalysisPrompt(type, data, customQuery, namaPemda, selectedYear)}
                disabledCondition={!data.totalAPBD && !data.belanjaInfrastruktur && !data.belanjaPendidikan}
                theme={theme}
            /> */}

            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md">
                <div className="flex flex-col md:flex-row items-center justify-around gap-8">
                    <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6 text-center">{title}</h3>
                        <div className="mx-auto">
                            <ProgressCircle percentage={data.percentage || 0} threshold={threshold} type={type} />
                        </div>
                    </div>
                    <div className="flex-1 w-full">
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6">Rincian Perhitungan</h3>
                        <div className="space-y-4 text-lg text-gray-700 dark:text-gray-300">
                            {type === 'pegawai' ? (
                                <>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <span>A. Total APBD</span>
                                        <span className="font-semibold">{formatCurrency(data.totalAPBD)}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <span>B. Total Belanja Pegawai</span>
                                        <span className="font-semibold">{formatCurrency(data.totalBelanjaPegawai)}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <span>C. Dikecualikan</span>
                                        <span className="font-semibold text-red-500">(- {formatCurrency(data.belanjaPegawaiDikecualikan)})</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border-l-4 border-blue-500">
                                        <span className="font-medium">Dasar Perhitungan (B - C)</span>
                                        <span className="font-bold">{formatCurrency(data.belanjaPegawaiUntukPerhitungan)}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-t pt-4 mt-4 dark:border-gray-600">
                                        <span className="font-bold text-xl">Persentase ( (B-C) / A )</span>
                                        <span className={`font-bold text-2xl ${data.percentage > 30 ? 'text-red-500' : 'text-orange-500'}`}>
                                            {data.percentage.toFixed(2)}%
                                        </span>
                                    </div>
                                </>
                            ) : type === 'infrastruktur' ? (
                                <>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <span>A. Total APBD</span>
                                        <span className="font-semibold">{formatCurrency(data.totalAPBD)}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border-l-4 border-blue-500">
                                        <span className="font-medium">Total Belanja Infrastruktur</span>
                                        <span className="font-bold">{formatCurrency(data.belanjaInfrastruktur)}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-t pt-4 mt-4 dark:border-gray-600">
                                        <span className="font-bold text-xl">Persentase</span>
                                        <span className={`font-bold text-2xl ${data.percentage < 40 ? 'text-yellow-500' : 'text-green-500'}`}>
                                            {data.percentage.toFixed(2)}%
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <span>A. Total APBD</span>
                                        <span className="font-semibold">{formatCurrency(data.totalAPBD)}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border-l-4 border-blue-500">
                                        <span className="font-medium">Total Belanja Pendidikan</span>
                                        <span className="font-bold">{formatCurrency(data.belanjaPendidikan)}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-t pt-4 mt-4 dark:border-gray-600">
                                        <span className="font-bold text-xl">Persentase</span>
                                        <span className={`font-bold text-2xl ${data.percentage < 20 ? 'text-yellow-500' : 'text-green-500'}`}>
                                            {data.percentage.toFixed(2)}%
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-8 text-center max-w-3xl mx-auto bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-lg">
                    <b>Keterangan:</b> {description[type]}
                </p>
            </div>
            
            {detailItems.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Rincian Belanja yang Dihitung</h3>
                        <button onClick={() => setIsDetailsVisible(!isDetailsVisible)} className="text-blue-600 dark:text-blue-400 font-medium text-sm flex items-center">
                            {isDetailsVisible ? 'Sembunyikan' : 'Tampilkan'} Rincian
                            {isDetailsVisible ? <ChevronDown className="ml-1 h-4 w-4" /> : <ChevronRight className="ml-1 h-4 w-4" />}
                        </button>
                    </div>

                    {isDetailsVisible && (
                        <div>
                            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                                <div className="relative w-full sm:max-w-xs">
                                    <input
                                        type="text"
                                        placeholder="Cari..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                </div>
                                <button
                                    onClick={handleDownloadExcel}
                                    disabled={filteredDetails.length === 0}
                                    className="w-full sm:w-auto flex items-center justify-center px-4 py-2 border border-green-600 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Download size={16} className="mr-2" /> Download Excel
                                </button>
                            </div>
                            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            {detailHeaders.map(h => (
                                                <th key={h} className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${h.startsWith('Pagu') || h.startsWith('Real') || h.startsWith('Sisa') || h.startsWith('%') ? 'text-right' : ''}`}>
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {paginatedDetails.length > 0 ? paginatedDetails.map((item, index) => (
                                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{item.NamaSKPD}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{item.NamaSubUnit}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{item.KodeSubKegiatan}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{item.NamaSubKegiatan}</td>
                                                <td className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">{formatCurrency(item.pagu)}</td>
                                                <td className="px-6 py-4 text-right text-sm font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">{formatCurrency(item.realisasi)}</td>
                                                <td className="px-6 py-4 text-right text-sm font-semibold text-green-600 dark:text-green-400 whitespace-nowrap">{formatCurrency(item.sisa)}</td>
                                                <td className="px-6 py-4 text-right text-sm font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">{item.persentase.toFixed(2)}%</td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan={detailHeaders.length} className="text-center py-8 text-gray-500">Tidak ada data yang cocok.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {totalDetailPages > 1 && (
                                <Pagination currentPage={currentPage} totalPages={totalDetailPages} onPageChange={handleDetailPageChange} theme={theme} />
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AnalysisCard;