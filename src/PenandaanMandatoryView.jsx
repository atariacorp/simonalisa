import React from 'react';
import SectionTitle from './SectionTitle';
import Pagination from './Pagination';
import { Upload, Search } from 'lucide-react';
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from './firebase';

// UPDATED: PenandaanMandatoryView Component
const PenandaanMandatoryView = ({ theme, userRole, selectedYear, onUpload }) => {
    const [selectedMandatory, setSelectedMandatory] = React.useState('pendidikan');
    const [data, setData] = React.useState([]);
    const [error, setError] = React.useState('');
    const [uploadProgress, setUploadProgress] = React.useState('');
    const [isUploading, setIsUploading] = React.useState(false);
    const fileInputRef = React.useRef(null);
    
    const [searchTerm, setSearchTerm] = React.useState('');
    const [currentPage, setCurrentPage] = React.useState(1);
    const ITEMS_PER_PAGE = 15;

    const mandatoryOptions = {
        pendidikan: { 
            title: 'Penandaan Fungsi Pendidikan', 
            previewHeaders: ['KODE SUB KEGIATAN', 'NAMA SUB KEGIATAN'],
            instruction: "Sistem akan menggabungkan beberapa kolom 'KODE SUB KEGIATAN' secara otomatis.",
            codePrefix: 'KODE SUB KEGIATAN',
            nameKey: 'NAMA SUB KEGIATAN'
        },
        infrastruktur: { 
            title: 'Penandaan Belanja Infrastruktur', 
            previewHeaders: ['KODE SUB KEGIATAN', 'NAMA SUB KEGIATAN'],
            instruction: "Sistem akan menggabungkan beberapa kolom 'KODE SUB KEGIATAN' secara otomatis.",
            codePrefix: 'KODE SUB KEGIATAN',
            nameKey: 'NAMA SUB KEGIATAN'
        }
    };

    const currentConfig = mandatoryOptions[selectedMandatory];

    React.useEffect(() => {
        setData([]);
        setError('');
        const dataRef = collection(db, "publicData", String(selectedYear), `referensi-${selectedMandatory}`);
        const unsubscribe = onSnapshot(query(dataRef), (snapshot) => {
            let fetchedData = [];
            snapshot.forEach(doc => {
                if (Array.isArray(doc.data().rows)) {
                    fetchedData.push(...doc.data().rows);
                }
            });
            setData(fetchedData);
        }, (err) => {
            console.error(`Error fetching ${selectedMandatory} reference:`, err);
            setData([]);
            setError(`Gagal memuat data untuk ${currentConfig.title}.`);
        });
        return () => unsubscribe();
    }, [selectedYear, selectedMandatory]);

    const filteredData = React.useMemo(() => {
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
    }, [searchTerm, selectedMandatory]);


    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setError('');
        setUploadProgress('Membaca file...');
        setIsUploading(true);
        const fileExtension = file.name.split('.').pop().toLowerCase();

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
                
                const mergedCode = codeColumnKeys
                    .map(key => String(row[key] || '')) 
                    .filter(Boolean)
                    .join('.');

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

            onUpload(processedData, selectedMandatory, setUploadProgress)
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

        if (['xlsx', 'xls', 'csv'].includes(fileExtension) || file.name.endsWith('.csv')) {
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
        } else {
            setError("Format file tidak didukung.");
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            <SectionTitle>Penandaan Mandatory Spending</SectionTitle>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <div className="max-w-md mb-6">
                    <label htmlFor="mandatory-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pilih Jenis Mandatory Spending:</label>
                    <select
                        id="mandatory-select"
                        value={selectedMandatory}
                        onChange={(e) => setSelectedMandatory(e.target.value)}
                        className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="pendidikan">Fungsi Pendidikan</option>
                        <option value="infrastruktur">Belanja Infrastruktur</option>
                    </select>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900/50 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                     <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 font-semibold">Unggah File Referensi untuk {currentConfig.title}</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{currentConfig.instruction}</p>
                    <div className="mt-4">
                        <button onClick={() => fileInputRef.current.click()} disabled={isUploading || userRole !== 'admin'} className="flex items-center justify-center mx-auto px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            <Upload size={18} className="mr-2" /> Pilih File
                        </button>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleFileUpload} />
                </div>
                {userRole !== 'admin' && <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">Hanya Admin yang dapat mengunggah data referensi.</p>}
                {error && <p className="text-sm text-red-600 mt-2 text-center">{error}</p>}
                {uploadProgress && <p className="text-sm text-indigo-600 mt-2 text-center">{uploadProgress}</p>}
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Data {currentConfig.title}</h3>
                    <div className="relative w-full max-w-xs">
                        <input
                            type="text"
                            placeholder="Cari..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                    </div>
                </div>
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 max-h-96">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                            <tr>{currentConfig.previewHeaders.map(h => <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{h}</th>)}</tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {paginatedData.length > 0 ? paginatedData.map((item, index) => (
                                <tr key={index}>
                                    {currentConfig.previewHeaders.map(header => <td key={header} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item[header]}</td>)}
                                </tr>
                            )) : <tr><td colSpan={currentConfig.previewHeaders.length} className="text-center py-8 text-gray-500">
                                {searchTerm ? "Tidak ada data yang cocok dengan pencarian." : "Belum ada data referensi."}
                                </td></tr>}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} theme={theme} />
                )}
            </div>
        </div>
    );
};

export default PenandaanMandatoryView;