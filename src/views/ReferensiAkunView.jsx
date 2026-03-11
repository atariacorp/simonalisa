import React from 'react';
import SectionTitle from '../components/SectionTitle';
import { Upload } from 'lucide-react';
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from '../utils/firebase';

// --- REFACTORED ReferensiAkunView Component ---
const ReferensiAkunView = ({ theme, userRole, selectedYear, onUpload }) => {
    const [selectedRef, setSelectedRef] = React.useState('pendapatan');
    const [data, setData] = React.useState([]);
    const [error, setError] = React.useState('');
    const [uploadProgress, setUploadProgress] = React.useState('');
    const [isUploading, setIsUploading] = React.useState(false);
    const fileInputRef = React.useRef(null);

    const refOptions = {
        pendapatan: { title: 'Referensi Pendapatan', previewHeaders: ['kode rekening', 'uraian rekening'] },
        belanja: { title: 'Referensi Belanja', previewHeaders: ['kode rekening', 'uraian rekening'] },
    };

    React.useEffect(() => {
        const dataRef = collection(db, "publicData", String(selectedYear), `referensi-${selectedRef}`);
        const unsubscribe = onSnapshot(query(dataRef), (snapshot) => {
            let fetchedData = [];
            snapshot.forEach(doc => {
                if (Array.isArray(doc.data().rows)) {
                    fetchedData.push(...doc.data().rows);
                }
            });
            setData(fetchedData);
        }, (err) => {
            console.error(`Error fetching ${selectedRef} reference:`, err);
            setData([]);
            if (refOptions[selectedRef]) {
                 setError(`Gagal memuat data untuk ${refOptions[selectedRef].title}.`);
            }
        });
        return () => unsubscribe();
    }, [selectedYear, selectedRef]);

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
            
            const headers = Object.keys(jsonData[0]).map(h => h.toLowerCase().trim());
            const hasKode = headers.includes('kode rekening');
            const hasNama = headers.includes('uraian rekening');

            if (!hasKode || !hasNama) {
                setError("File harus memiliki kolom 'kode rekening' dan 'uraian rekening'.");
                setIsUploading(false);
                return;
            }

            onUpload(jsonData, selectedRef, setUploadProgress)
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

        if (fileExtension === 'csv' || file.name.endsWith('.csv')) {
            if (!window.Papa) { setError("Pustaka PapaParse (CSV) tidak tersedia."); setIsUploading(false); return; }
            window.Papa.parse(file, {
                header: true, skipEmptyLines: true,
                complete: (results) => results.errors.length ? setError("Gagal memproses file CSV.") : parseAndUpload(results.data),
                error: () => setError("Terjadi kesalahan fatal saat memproses file CSV.")
            });
        } else if (['xlsx', 'xls'].includes(fileExtension)) {
            if (!window.XLSX) { setError("Pustaka SheetJS (Excel) tidak tersedia."); setIsUploading(false); return; }
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const workbook = window.XLSX.read(e.target.result, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const json = window.XLSX.utils.sheet_to_json(worksheet);
                    parseAndUpload(json);
                } catch (err) {
                    console.error(err);
                    setError("Gagal memproses file Excel.");
                }
            };
            reader.readAsBinaryString(file);
        } else {
            setError("Format file tidak didukung. Harap unggah file CSV atau Excel.");
            setIsUploading(false);
        }
    };

    const currentRefConfig = refOptions[selectedRef];

    return (
        <div className="space-y-6">
            <SectionTitle>Referensi Akun Kode Rekening</SectionTitle>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1">
                        <label htmlFor="ref-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pilih Jenis Referensi:</label>
                        <select
                            id="ref-select"
                            value={selectedRef}
                            onChange={(e) => setSelectedRef(e.target.value)}
                            className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="pendapatan">Referensi Pendapatan</option>
                            <option value="belanja">Referensi Belanja</option>
                        </select>
                    </div>
                    <div className="flex-1 flex items-end">
                        <button onClick={() => fileInputRef.current.click()} disabled={isUploading || userRole !== 'admin'} className="w-full md:w-auto flex items-center justify-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            <Upload size={18} className="mr-2" /> Unggah File untuk {currentRefConfig.title}
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleFileUpload} />
                    </div>
                </div>
                {userRole !== 'admin' && <p className="text-xs text-center text-gray-500 dark:text-gray-400 mb-4">Hanya Admin yang dapat mengunggah data referensi.</p>}
                {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
                {uploadProgress && <p className="text-sm text-indigo-600 mb-2">{uploadProgress}</p>}
                
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Data {currentRefConfig.title}</h3>
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 max-h-96">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                            <tr>{currentRefConfig.previewHeaders.map(h => <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{h}</th>)}</tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {data.length > 0 ? data.map((item, index) => (
                                <tr key={index}>
                                    {currentRefConfig.previewHeaders.map(header => {
                                        const key = Object.keys(item).find(k => k.toLowerCase().trim().includes(header.toLowerCase().replace(/ /g,'')));
                                        return <td key={header} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item[key]}</td>
                                    })}
                                </tr>
                            )) : <tr><td colSpan={currentRefConfig.previewHeaders.length} className="text-center py-8 text-gray-500">Belum ada data referensi.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReferensiAkunView;
