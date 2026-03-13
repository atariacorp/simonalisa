import React, { useState, useEffect, useMemo, useCallback } from 'react';
import SectionTitle from '../components/SectionTitle';
import Pagination from '../components/Pagination';
import { Upload, Search, Eye, EyeOff, Sparkles } from 'lucide-react';
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from '../utils/firebase';
import GeminiAnalysis from '../components/GeminiAnalysis';

// NEW: PenandaanTematikView Component
const PenandaanTematikView = ({ theme, userRole, selectedYear, onUpload }) => {
    const [selectedTematik, setSelectedTematik] = React.useState('spm');
    const [data, setData] = React.useState([]);
    const [error, setError] = React.useState('');
    const [uploadProgress, setUploadProgress] = React.useState('');
    const [isUploading, setIsUploading] = React.useState(false);
    const fileInputRef = React.useRef(null);
    
    const [searchTerm, setSearchTerm] = React.useState('');
    const [currentPage, setCurrentPage] = React.useState(1);
    const ITEMS_PER_PAGE = 15;
    const [showAnalysis, setShowAnalysis] = React.useState(true);

    const tematikOptions = {
        spm: { 
            title: 'Penandaan Standar Pelayanan Minimal', 
            dbKey: 'spm',
            previewHeaders: ['KODE SUB KEGIATAN', 'NAMA SUB KEGIATAN'],
            instruction: "Sistem akan menggabungkan beberapa kolom 'KODE SUB KEGIATAN' secara otomatis.",
            codePrefix: 'KODE SUB KEGIATAN',
            nameKey: 'NAMA SUB KEGIATAN'
        },
        stunting: { 
            title: 'Penandaan Penurunan Stunting', 
            dbKey: 'stunting',
            previewHeaders: ['KODE SUB KEGIATAN', 'NAMA SUB KEGIATAN'],
            instruction: "Sistem akan menggabungkan beberapa kolom 'KODE SUB KEGIATAN' secara otomatis.",
            codePrefix: 'KODE SUB KEGIATAN',
            nameKey: 'NAMA SUB KEGIATAN'
        },
        kemiskinan: { 
            title: 'Penandaan Penghapusan Kemiskinan Ekstrim', 
            dbKey: 'kemiskinan',
            previewHeaders: ['KODE SUB KEGIATAN', 'NAMA SUB KEGIATAN'],
            instruction: "Sistem akan menggabungkan beberapa kolom 'KODE SUB KEGIATAN' secara otomatis.",
            codePrefix: 'KODE SUB KEGIATAN',
            nameKey: 'NAMA SUB KEGIATAN'
        },
        inflasi: { 
            title: 'Penandaan Pengendalian Inflasi', 
            dbKey: 'inflasi',
            previewHeaders: ['KODE SUB KEGIATAN', 'NAMA SUB KEGIATAN'],
            instruction: "Sistem akan menggabungkan beberapa kolom 'KODE SUB KEGIATAN' secara otomatis.",
            codePrefix: 'KODE SUB KEGIATAN',
            nameKey: 'NAMA SUB KEGIATAN'
        },
        pengawasan: { 
            title: 'Penandaan Alokasi Anggaran Unsur Pengawasan', 
            dbKey: 'pengawasan',
            previewHeaders: ['KODE SUB KEGIATAN', 'NAMA SUB KEGIATAN'],
            instruction: "Sistem akan menggabungkan beberapa kolom 'KODE SUB KEGIATAN' secara otomatis.",
            codePrefix: 'KODE SUB KEGIATAN',
            nameKey: 'NAMA SUB KEGIATAN'
        }
    };

    const currentConfig = tematikOptions[selectedTematik];

    // ===== FUNGSI ANALYSIS PROMPT - MENGGUNAKAN useCallback =====
    const getAnalysisPrompt = useCallback((query, allData) => {
        // Jika user mengirim query khusus
        if (query && query.trim() !== '') {
            return `Berdasarkan data penandaan tematik ${currentConfig.title}, jawab pertanyaan ini: ${query}`;
        }
        
        // Analisis default
        if (data.length === 0) return "Data tidak cukup untuk dianalisis.";
        
        const totalItems = data.length;
        const uniqueCodes = new Set(data.map(item => item[currentConfig.previewHeaders[0]])).size;
        const sampleData = data.slice(0, 5);
        
        return `ANALISIS PENANDAAN TEMATIK
TAHUN: ${selectedYear}
JENIS PENANDAAN: ${currentConfig.title}

DATA RINGKAS:
- Total Item Referensi: ${totalItems}
- Total Kode Unik: ${uniqueCodes}
- Prefiks Kode: ${currentConfig.codePrefix}
- Kolom Referensi: ${currentConfig.previewHeaders.join(', ')}

CONTOH DATA (5 ITEM PERTAMA):
${sampleData.map((item, i) => `- ${item[currentConfig.previewHeaders[0]]}: ${item[currentConfig.previewHeaders[1]]}`).join('\n')}

BERIKAN ANALISIS MENDALAM MENGENAI:
1. Kualitas Data: Apakah data referensi ini sudah lengkap dan siap digunakan?
2. Cakupan Penandaan: Identifikasi pola kode yang muncul dan implikasinya.
3. Rekomendasi: Saran untuk optimalisasi penggunaan data referensi ini.

Gunakan bahasa profesional, langsung ke inti, tanpa basa-basi.`;
    }, [currentConfig, data, selectedYear]); // Dependencies
    // ===== END FUNGSI =====

    React.useEffect(() => {
        setData([]);
        setError('');
        const dataRef = collection(db, "publicData", String(selectedYear), `referensi-${currentConfig.dbKey}`);
        const unsubscribe = onSnapshot(query(dataRef), (snapshot) => {
            let fetchedData = [];
            snapshot.forEach(doc => {
                if (Array.isArray(doc.data().rows)) {
                    fetchedData.push(...doc.data().rows);
                }
            });
            setData(fetchedData);
        }, (err) => {
            console.error(`Error fetching ${currentConfig.dbKey} reference:`, err);
            setData([]);
            setError(`Gagal memuat data untuk ${currentConfig.title}.`);
        });
        return () => unsubscribe();
    }, [selectedYear, selectedTematik]);

    const filteredData = useMemo(() => {
        return data.filter(item =>
            Object.values(item).some(val =>
                String(val).toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
    }, [data, searchTerm]);

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const paginatedData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handlePageChange = (page) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page);
        }
    };
    
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedTematik]);

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setError('');
        setUploadProgress('Membaca file...');
        setIsUploading(true);

        const parseAndUpload = (jsonData) => {
            if (!jsonData || jsonData.length === 0) {
                setError("File tidak berisi data.");
                setIsUploading(false);
                return;
            }
            
            const fileHeaders = Object.keys(jsonData[0]);
            const codeColumnKeys = fileHeaders.filter(h => h.toUpperCase().startsWith(currentConfig.codePrefix) || h.startsWith('__EMPTY'));
            const nameColumnKey = fileHeaders.find(h => h.toUpperCase().startsWith(currentConfig.nameKey));

            if (codeColumnKeys.length === 0 || !nameColumnKey) {
                 setError(`Format file tidak sesuai. Pastikan kolom untuk '${currentConfig.codePrefix}' dan '${currentConfig.nameKey}' ada.`);
                 setIsUploading(false);
                 return;
            }

            const processedData = jsonData.map(row => {
                if (!row || !row[codeColumnKeys[0]]) return null;
                const mergedCode = codeColumnKeys.map(key => String(row[key] || '')).filter(Boolean).join('.');
                const newRow = {};
                newRow[currentConfig.previewHeaders[0]] = mergedCode;
                newRow[currentConfig.previewHeaders[1]] = row[nameColumnKey];
                return newRow;
            }).filter(Boolean);

            if(processedData.length === 0){
                setError("Tidak ada data valid yang dapat diproses dari file.");
                setIsUploading(false);
                return;
            }

            onUpload(processedData, currentConfig.dbKey, setUploadProgress)
                .then(() => {
                    setUploadProgress('Unggah selesai!');
                    setTimeout(() => setUploadProgress(''), 3000);
                })
                .catch((err) => {
                    setError(`Gagal mengunggah data: ${err.message}`);
                    setUploadProgress('');
                })
                .finally(() => setIsUploading(false));
        };

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const workbook = window.XLSX.read(e.target.result, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = window.XLSX.utils.sheet_to_json(worksheet, {raw: false});
                parseAndUpload(json);
            } catch (err) {
                console.error(err);
                setError("Gagal memproses file. Pastikan formatnya benar.");
                setIsUploading(false);
            }
        };
        reader.readAsBinaryString(file);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-10">
            <SectionTitle>Penandaan Tematik</SectionTitle>
            
            {/* AI Analysis Section dengan Toggle */}
            <div className="relative">
                <div className="flex justify-end mb-2">
                    <button
                        onClick={() => setShowAnalysis(!showAnalysis)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 bg-white/50 dark:bg-gray-800/50 rounded-xl hover:bg-white dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700"
                    >
                        {showAnalysis ? (
                            <>🗂️ Sembunyikan Analisis AI</>
                        ) : (
                            <>🤖 Tampilkan Analisis AI</>
                        )}
                    </button>
                </div>
                
                {/* Indikator Data */}
                {showAnalysis && data.length > 0 && (
                    <div className="text-xs text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-2 bg-white/30 dark:bg-gray-800/30 p-2 rounded-lg">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        <span>Jenis: {currentConfig.title} | Total Data: {data.length} item | Kode Unik: {new Set(data.map(item => item[currentConfig.previewHeaders[0]])).size}</span>
                    </div>
                )}
                
                {/* Komponen GeminiAnalysis dengan Conditional Rendering */}
                {showAnalysis && (
                    <GeminiAnalysis 
                        getAnalysisPrompt={getAnalysisPrompt} 
                        disabledCondition={data.length === 0} 
                        userCanUseAi={userRole === 'admin'}
                        allData={{
                            data: data.slice(0, 10),
                            totalItems: data.length,
                            selectedTematik,
                            config: currentConfig
                        }}
                    />
                )}
            </div>

            {/* Main Card */}
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/50 dark:border-gray-700/50 overflow-hidden transition-all duration-500 hover:shadow-3xl">
                {/* Filter Section */}
                <div className="p-8 bg-gradient-to-r from-white/50 to-white/30 dark:from-gray-800/50 dark:to-gray-900/50 border-b border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-black text-gray-800 dark:text-white flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
                            PANEL PENANDAAN TEMATIK
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Jenis Penandaan */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                <span className="text-indigo-500">📋</span> Jenis Penandaan
                            </label>
                            <select
                                value={selectedTematik}
                                onChange={(e) => setSelectedTematik(e.target.value)}
                                className="w-full px-4 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm font-medium"
                            >
                                {Object.entries(tematikOptions).map(([key, value]) => (
                                    <option key={key} value={key}>{value.title}</option>
                                ))}
                            </select>
                        </div>

                        {/* Search Filter */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                <Search size={14} className="text-indigo-500" /> Pencarian
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Cari kode atau nama sub kegiatan..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                />
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                            </div>
                        </div>
                    </div>

                    {/* Upload Section */}
                    <div className="mt-6 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-indigo-200/50 dark:border-indigo-800/50">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                                <Upload size={24} className="text-white" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-gray-800 dark:text-gray-200">Unggah Data Referensi {currentConfig.title}</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{currentConfig.instruction}</p>
                            </div>
                            <button
                                onClick={() => fileInputRef.current.click()}
                                disabled={isUploading || userRole !== 'admin'}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                <Upload size={18} className="group-hover:scale-110 transition-transform" />
                                {isUploading ? 'Mengunggah...' : 'Pilih File Excel'}
                            </button>
                            <input type="file" ref={fileInputRef} className="hidden" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} />
                        </div>
                        {userRole !== 'admin' && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-3 flex items-center gap-1">
                                <Info size={14} /> Hanya Admin yang dapat mengunggah data referensi.
                            </p>
                        )}
                        {error && (
                            <p className="text-sm text-red-600 dark:text-red-400 mt-3 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                                {error}
                            </p>
                        )}
                        {uploadProgress && (
                            <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-3 bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-lg">
                                {uploadProgress}
                            </p>
                        )}
                    </div>
                </div>

                {/* Table Section */}
                <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-md">
                                <span className="text-white font-black text-sm">📋</span>
                            </div>
                            <h3 className="font-black text-xl text-gray-800 dark:text-white">
                                Data {currentConfig.title}
                            </h3>
                        </div>
                        <div className="text-xs bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm px-3 py-1 rounded-full">
                            {filteredData.length} item ditemukan
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                        <table className="min-w-full">
                            <thead>
                                <tr className="bg-gradient-to-r from-gray-50/80 to-white/80 dark:from-gray-800/80 dark:to-gray-900/80">
                                    {currentConfig.previewHeaders.map(header => (
                                        <th key={header} className="px-6 py-4 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {paginatedData.length > 0 ? paginatedData.map((item, index) => (
                                    <tr key={index} className="hover:bg-indigo-500/5 transition-colors group">
                                        {currentConfig.previewHeaders.map(header => (
                                            <td key={header} className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 font-mono">
                                                {item[header]}
                                            </td>
                                        ))}
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={currentConfig.previewHeaders.length} className="text-center py-12 text-gray-500 font-bold">
                                            {searchTerm ? "Tidak ada data yang cocok dengan pencarian." : "Belum ada data referensi."}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="mt-8">
                            <Pagination 
                                currentPage={currentPage} 
                                totalPages={totalPages} 
                                onPageChange={handlePageChange} 
                                theme={theme} 
                            />
                        </div>
                    )}
                </div>

                {/* Footer Notes */}
                {data.length > 0 && (
                    <div className="px-8 py-5 bg-gradient-to-r from-gray-50/50 to-transparent dark:from-gray-800/50 border-t border-gray-200/50 dark:border-gray-700/50">
                        <div className="flex flex-wrap gap-6 text-xs">
                            <span className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-lg"></div>
                                <span className="font-medium text-gray-600 dark:text-gray-400">
                                    Total {data.length} item referensi
                                </span>
                            </span>
                            <span className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full shadow-lg"></div>
                                <span className="font-medium text-gray-600 dark:text-gray-400">
                                    {new Set(data.map(item => item[currentConfig.previewHeaders[0]])).size} kode unik
                                </span>
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PenandaanTematikView;