import React from 'react';
import SectionTitle from '../components/SectionTitle';
import GeminiAnalysis from '../components/GeminiAnalysis';
import Pagination from '../components/Pagination';
import { 
    Upload, Calendar, Trash2, Loader, Download, Columns, Search, 
    CheckCircle2, AlertCircle, FileText, Database, TrendingUp, 
    BarChart3, PieChart, Info, X, ChevronDown, ChevronUp, Filter,
    Eye, EyeOff, RefreshCw, Sparkles, Shield, Clock, HardDrive
} from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import { logActivity } from '../utils/logActivity';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from 'recharts';
import { useState, useEffect } from 'react';

// ==================== DATA UPLOAD VIEW COMPONENT ====================
// Menggunakan logika dari dataupload dari gemini.txt
const DataUploadView = ({ 
  title, 
  data, 
  instruction, 
  isMonthly, 
  columnMapping,  // PENTING: mapping dari parent component
  previewHeaders, // PENTING: headers yang ditampilkan
  groupedColumns, 
  dataFilter, 
  theme, 
  onUpload, 
  onDeleteMonth, 
  isDeleting, 
  selectedYear, 
  userRole, 
  getAnalysisPrompt, 
  namaPemda 
}) => {
  const fileInputRef = React.useRef(null);
  const [error, setError] = React.useState('');
  const [uploadProgress, setUploadProgress] = React.useState('');
  const [isUploading, setIsUploading] = React.useState(false);
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const [selectedMonth, setSelectedMonth] = React.useState(months[0]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const ITEMS_PER_PAGE = 10;
  
  const [visibleHeaders, setVisibleHeaders] = React.useState(previewHeaders || []);
  const [isColumnSelectorOpen, setIsColumnSelectorOpen] = React.useState(false);
  const columnSelectorRef = React.useRef(null);

  React.useEffect(() => {
    setVisibleHeaders(previewHeaders || []);
  }, [previewHeaders]);
  
  React.useEffect(() => {
    const handleClickOutside = (event) => {
        if (columnSelectorRef.current && !columnSelectorRef.current.contains(event.target)) {
            setIsColumnSelectorOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleHeader = (header) => {
    setVisibleHeaders(prev => 
        prev.includes(header) 
        ? prev.filter(h => h !== header) 
        : [...prev, header]
    );
  };

  // ==================== DATA PREVIEW ====================
  const dataToPreview = React.useMemo(() => {
    const rawData = isMonthly ? (data?.[selectedMonth] || []) : (data || []);
    
    // Buat inverted mapping dari previewHeaders ke internal keys
    const invertedMapping = {};
    (previewHeaders || []).forEach(header => {
      // Hapus karakter non-alfanumerik untuk dijadikan key internal
      const key = header.replace(/[^A-Za-z0-9]/g, '');
      invertedMapping[key] = header;
    });

    return rawData.map(item => {
      const displayItem = { ...item }; 
      for (const internalKey in invertedMapping) {
        if (item[internalKey] !== undefined) {
          const displayHeader = invertedMapping[internalKey];
          displayItem[displayHeader] = item[internalKey];
        }
      }
      return displayItem;
    });
  }, [isMonthly, data, selectedMonth, previewHeaders]);

  // ==================== SUMMARY DATA ====================
  const summaryData = React.useMemo(() => {
    if (!isMonthly || !data) {
        return null;
    }
    
    const totalBulanIni = (data[selectedMonth] || []).reduce((sum, item) => sum + (item.nilai || 0), 0);
    const totalSemuaBulan = Object.values(data)
                                .flat()
                                .reduce((sum, item) => sum + (item.nilai || 0), 0);
    
    if (title.includes('Realisasi Belanja') || title.includes('Non RKUD') || title.includes('Belanja')) {
        return { type: 'belanja', totalBulanIni, totalSemuaBulan };
    }
    if (title.includes('Realisasi Pendapatan') || title.includes('Pendapatan')) {
        return { type: 'pendapatan', totalBulanIni, totalSemuaBulan };
    }

    return null;
  }, [data, selectedMonth, isMonthly, title]);

  // ==================== SMART PARSING (dari Gemini) ====================
  const handleSmartParsing = (json) => {
    if (!json || json.length === 0) {
        setError("File tidak mengandung data atau format tidak dikenali.");
        return null;
    }

    const headers = Object.keys(json[0]);
    console.log('📋 Headers dari file Excel:', headers);
    
    // Fungsi findHeader internal
    const findHeader = (possibleNames) => {
        if (!possibleNames) return null;
        const lowerCaseHeaders = headers.map(h => String(h).toLowerCase().replace(/\//g, " ").trim());
        
        for (const name of possibleNames) {
            const lowerCaseName = name.toLowerCase();
            const index = lowerCaseHeaders.indexOf(lowerCaseName);
            if (index !== -1) return headers[index];
        }
        return null;
    };
    
    // Validasi untuk Realisasi Belanja (wajib ada Nomor SP2D)
    const isRealisasiBelanja = title.includes('Realisasi Belanja') || title.includes('Belanja');
    let sp2dHeaderName = null;
    if (isRealisasiBelanja && columnMapping && columnMapping.NomorSP2D) {
        sp2dHeaderName = findHeader(columnMapping.NomorSP2D);
        if (!sp2dHeaderName) {
            console.warn("Kolom 'Nomor SP2D' tidak ditemukan, melanjutkan tanpa validasi SP2D");
        }
    }

    // Filter data jika ada dataFilter
    let filteredJson = json;
    if (dataFilter) {
        const filterColumnHeader = findHeader([dataFilter.column]);
        if (filterColumnHeader) {
            if (typeof dataFilter.value === 'number') {
                filteredJson = json.filter(row => String(row[filterColumnHeader]).startsWith(String(dataFilter.value)));
            } else {
                filteredJson = json.filter(row => row[filterColumnHeader] === dataFilter.value);
            }
            
            if (dataFilter.secondaryColumn && dataFilter.secondaryValues) {
                const secondaryFilterHeader = findHeader([dataFilter.secondaryColumn]);
                if (secondaryFilterHeader) {
                    filteredJson = filteredJson.filter(row => {
                        const cellValue = String(row[secondaryFilterHeader] || '').toUpperCase();
                        return dataFilter.secondaryValues.some(val => cellValue.includes(val));
                    });
                }
            }

            if (filteredJson.length === 0) {
                setError(`Tidak ada data yang cocok dengan filter yang diterapkan.`);
                return null;
            }
        }
    }
    
    // Parsing data berdasarkan columnMapping dan previewHeaders
    const parsedData = filteredJson.map(row => {
        const rowData = {};
        let hasRequiredHeaders = true;

        // Iterasi setiap header yang akan ditampilkan
        (previewHeaders || []).forEach(header => {
            // Buat key internal (tanpa karakter khusus)
            const key = header.replace(/[^A-Za-z0-9]/g, '');
            
            // Dapatkan column options dari mapping
            const columnOptions = columnMapping ? columnMapping[key] : null;
            
            if (!columnOptions) {
                // Jika tidak ada mapping, coba cari header yang sama persis
                const exactMatch = headers.find(h => h === header);
                if (exactMatch) {
                    rowData[key] = row[exactMatch];
                } else {
                    console.warn(`Tidak ada mapping untuk header: ${header}`);
                    rowData[key] = null;
                }
                return;
            }

            const foundHeader = findHeader(columnOptions);
            if (foundHeader) {
                rowData[key] = row[foundHeader];
            } else {
                // Kolom opsional yang tidak wajib
                const optionalKeys = ['NamaSumberDana', 'KodeRekening', 'KodeSubKegiatan', 'NamaSubUnit', 'KodeKegiatan', 'NamaSubSKPD', 'NomorSP2D', 'KeteranganDokumen', 'KodeSKPD', 'NamaSKPD'];
                if (!optionalKeys.includes(key)) {
                    hasRequiredHeaders = false;
                }
            }
        });

        if (!hasRequiredHeaders) {
            return null;
        }
        
        // Ambil nilai realisasi (kolom terakhir biasanya)
        const valueHeader = previewHeaders ? previewHeaders[previewHeaders.length - 1] : 'Nilai Realisasi';
        const valueKey = valueHeader.replace(/[^A-Za-z0-9]/g, '');
        let nilaiRealisasi = 0;
        
        if (rowData[valueKey]) {
            const rawValue = String(rowData[valueKey]).replace(/[^0-9.-]+/g, "");
            nilaiRealisasi = parseFloat(rawValue) || 0;
        }

        // Jika ini data belanja dan tidak ada SP2D, nilai dianggap 0
        if (isRealisasiBelanja && sp2dHeaderName) {
            const sp2dValue = rowData.NomorSP2D;
            if (sp2dValue === null || sp2dValue === undefined || String(sp2dValue).trim() === '') {
                nilaiRealisasi = 0;
            }
        }
        
        rowData.nilai = nilaiRealisasi;

        if (isMonthly) {
            rowData.month = selectedMonth;
            rowData.bulan = months.indexOf(selectedMonth) + 1;
        }
        
        rowData.tahun = selectedYear;

        return rowData;
    }).filter(Boolean); // Hapus baris null

    console.log(`✅ Berhasil memproses ${parsedData.length} baris data`);
    if (parsedData.length > 0) {
        console.log('📝 Sample data pertama:', parsedData[0]);
    }

    if (parsedData.length === 0 && filteredJson.length > 0) {
        setError("Data ditemukan, namun tidak ada baris yang valid setelah diproses. Periksa kembali apakah semua kolom wajib telah terisi di file Anda.");
        return null;
    }
    
    return parsedData;
  };

  // ==================== HANDLE UPLOAD FILE ====================
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    setError('');
    setUploadProgress('');
    if (!file) return;

    setIsUploading(true);
    setUploadProgress('📂 Membaca file...');

    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    const parseAndUpload = (jsonData) => {
        setUploadProgress('🔄 Memproses data...');
        const parsedData = handleSmartParsing(jsonData);
        if (parsedData && parsedData.length > 0) {
            setUploadProgress(`💾 Mengunggah ${parsedData.length} baris...`);
            onUpload(parsedData, isMonthly ? selectedMonth : null, setUploadProgress)
                .then(() => {
                    setUploadProgress(`✅ Berhasil! ${parsedData.length} baris diunggah`);
                    logActivity('Unggah Data', { dataType: title, fileName: file.name, status: 'Berhasil', rowCount: parsedData.length });
                    setTimeout(() => setUploadProgress(''), 3000);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                })
                .catch((err) => {
                    console.error('Upload error:', err);
                    setError(`Gagal mengunggah data: ${err.message}`);
                    logActivity('Unggah Data', { dataType: title, fileName: file.name, status: 'Gagal', error: err.message });
                    setUploadProgress('');
                })
                .finally(() => setIsUploading(false));
        } else {
            logActivity('Unggah Data', { dataType: title, fileName: file.name, status: 'Gagal', error: 'Gagal memproses file' });
            setIsUploading(false);
        }
    };

    if (fileExtension === 'csv') {
        if (!window.Papa) {
          setError("Pustaka PapaParse (CSV) tidak tersedia.");
          setIsUploading(false);
          return;
        }
        window.Papa.parse(file, {
            header: true, skipEmptyLines: true,
            complete: (results) => {
                if (results.errors && results.errors.length) {
                    console.warn('CSP parsing warnings:', results.errors);
                }
                parseAndUpload(results.data);
            },
            error: (err) => {
                console.error('CSV parse error:', err);
                setError("Terjadi kesalahan fatal saat memproses file CSV.");
                setIsUploading(false);
            },
        });
    } else if (['xlsx', 'xls'].includes(fileExtension)) {
        if (!window.XLSX) {
            setError("Pustaka SheetJS (Excel) tidak tersedia.");
            setIsUploading(false);
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = window.XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = window.XLSX.utils.sheet_to_json(worksheet, { defval: "" });
                parseAndUpload(json);
            } catch (err) {
                console.error('Excel parse error:', err);
                setError(`Gagal memproses file Excel: ${err.message}`);
                setIsUploading(false);
            }
        };
        reader.onerror = () => {
            setError("Gagal membaca file Excel.");
            setIsUploading(false);
        };
        reader.readAsArrayBuffer(file);
    } else {
        setError("Format file tidak didukung. Harap unggah file CSV atau Excel (.xlsx, .xls).");
        setIsUploading(false);
    }
  };

  // ==================== HANDLE DELETE ====================
  const handleDeleteMonth = () => {
    if (!onDeleteMonth) return;
    const dataType = title.includes('Belanja') 
        ? 'realisasi' 
        : title.includes('Pendapatan') 
            ? 'realisasiPendapatan' 
            : 'realisasiNonRkud';
    onDeleteMonth(dataType, selectedMonth, setUploadProgress);
  };

  // ==================== HANDLE DOWNLOAD ====================
  const handleDownloadExcel = () => {
      if (!dataToPreview || dataToPreview.length === 0) {
          setError("Tidak ada data untuk diunduh.");
          return;
      }
      if (!window.XLSX) {
          setError("Pustaka unduh Excel tidak tersedia.");
          return;
      }

      try {
          const dataForExport = dataToPreview.map(item => {
              const row = {};
              (previewHeaders || []).forEach(header => {
                  const key = header.replace(/[^A-Za-z0-9]/g, '');
                  if (header === (previewHeaders[previewHeaders.length - 1])) {
                      row[header] = item.nilai;
                  } else {
                      row[header] = item[key];
                  }
              });
              return row;
          });

          const worksheet = window.XLSX.utils.json_to_sheet(dataForExport);
          const workbook = window.XLSX.utils.book_new();
          window.XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
          
          const fileName = `${title.replace(/ /g, '_')}${isMonthly ? `_${selectedMonth}` : ''}_${selectedYear}.xlsx`;
          window.XLSX.writeFile(workbook, fileName);
      } catch (err) {
          console.error("Error creating Excel file:", err);
          setError("Gagal membuat file Excel.");
      }
  };

  const handleButtonClick = () => { fileInputRef.current.click(); };
  
  // Filter dan pagination
  const filteredData = React.useMemo(() => dataToPreview.filter(item => {
      return Object.values(item).some(val => 
          String(val).toLowerCase().includes(searchTerm.toLowerCase())
      );
  }), [dataToPreview, searchTerm]);
  
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedMonth]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  
  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Warna untuk chart
  const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6B7280'];

  return (
    <div className="space-y-6">
        <SectionTitle>{title} - Tahun {selectedYear}</SectionTitle>
        
        {getAnalysisPrompt && (
            <GeminiAnalysis 
                getAnalysisPrompt={(customQuery) => getAnalysisPrompt(isMonthly ? selectedMonth : 'annual', dataToPreview, customQuery)}
                disabledCondition={dataToPreview.length === 0}
                theme={theme}
                interactivePlaceholder={`Tanya tentang data ${title}...`}
            />
        )}

        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md">
            {isMonthly && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <div>
                         <h3 className="font-bold text-lg text-gray-700 dark:text-gray-300 mb-4">Status Unggahan Bulanan</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {months.map(month => {
                                const hasData = data && data[month] && data[month].length > 0;
                                return (
                                    <div key={month} className={`flex items-center p-3 rounded-lg cursor-pointer ${hasData ? 'bg-green-100 dark:bg-green-900/50' : 'bg-yellow-100 dark:bg-yellow-900/50'} ${selectedMonth === month ? 'ring-2 ring-indigo-500' : ''}`} onClick={() => setSelectedMonth(month)}>
                                        {hasData ? <CheckCircle2 className="text-green-500 mr-2" size={20} /> : <AlertCircle className="text-yellow-500 mr-2" size={20} />}
                                        <span className={`font-medium ${hasData ? 'text-green-800 dark:text-green-300' : 'text-yellow-800 dark:text-yellow-300'}`}>{month}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    {summaryData && summaryData.type === 'belanja' && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg text-gray-700 dark:text-gray-300">Ringkasan Belanja</h3>
                            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Total Belanja Bulan {selectedMonth}</p>
                                <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">{formatCurrency(summaryData.totalBulanIni)}</p>
                            </div>
                            <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-lg border border-indigo-200 dark:border-indigo-700">
                                <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Total Belanja Semua Bulan</p>
                                <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-200">{formatCurrency(summaryData.totalSemuaBulan)}</p>
                            </div>
                        </div>
                    )}
                    {summaryData && summaryData.type === 'pendapatan' && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg text-gray-700 dark:text-gray-300">Ringkasan Pendapatan</h3>
                            <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg border border-green-200 dark:border-green-700">
                                <p className="text-sm font-medium text-green-800 dark:text-green-300">Total Pendapatan Bulan {selectedMonth}</p>
                                <p className="text-2xl font-bold text-green-900 dark:text-green-200">{formatCurrency(summaryData.totalBulanIni)}</p>
                            </div>
                            <div className="bg-teal-50 dark:bg-teal-900/30 p-4 rounded-lg border border-teal-200 dark:border-teal-700">
                                <p className="text-sm font-medium text-teal-800 dark:text-teal-300">Total Pendapatan Semua Bulan</p>
                                <p className="text-2xl font-bold text-teal-900 dark:text-teal-200">{formatCurrency(summaryData.totalSemuaBulan)}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="bg-gray-50 dark:bg-gray-900/50 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 font-semibold">Pilih file CSV atau Excel untuk diunggah.</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{instruction}</p>

                <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2">
                    {isMonthly && (
                        <div className="inline-flex items-center bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
                            <span className="pl-3 text-gray-500 dark:text-gray-400"><Calendar size={20}/></span>
                            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="py-2 pl-2 pr-4 bg-transparent text-gray-700 dark:text-gray-300 font-medium focus:outline-none rounded-lg">
                                {months.map(month => <option key={month} value={month}>{month}</option>)}
                            </select>
                        </div>
                    )}
                    <button onClick={handleButtonClick} disabled={isUploading || userRole !== 'admin'} className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        {isUploading ? <Loader className="animate-spin inline mr-2" size={18} /> : <Upload className="inline mr-2" size={18} />}
                        {isUploading ? 'Mengunggah...' : `Pilih File untuk ${isMonthly ? selectedMonth : 'Data'}`}
                    </button>
                    {isMonthly && onDeleteMonth && userRole === 'admin' && (
                        <button 
                            onClick={handleDeleteMonth}
                            disabled={isUploading || isDeleting || !data || !data[selectedMonth] || data[selectedMonth].length === 0}
                            className="p-2 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            title={`Hapus Data ${selectedMonth}`}
                        >
                           {isDeleting ? <Loader className="animate-spin" size={20}/> : <Trash2 size={20}/>}
                        </button>
                    )}
                </div>
                {userRole !== 'admin' && <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Hanya Admin yang dapat mengunggah data.</p>}
                <input type="file" ref={fileInputRef} className="hidden" accept=".csv, .xlsx, .xls" onChange={handleFileUpload}/>
                {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
                {uploadProgress && <p className="mt-4 text-sm text-blue-600">{uploadProgress}</p>}
            </div>

            <div className="mt-8">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                    <h3 className="font-bold text-lg text-gray-700 dark:text-gray-300">Pratinjau Data {isMonthly ? `untuk ${selectedMonth}` : ''}</h3>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        {isMonthly && dataToPreview.length > 0 && (
                            <button onClick={handleDownloadExcel} disabled={dataToPreview.length === 0} className="flex items-center justify-center px-4 py-2 border border-green-600 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 disabled:opacity-50">
                                <Download size={16} className="mr-2"/>
                                Download
                            </button>
                        )}
                        <div className="relative flex-grow" ref={columnSelectorRef}>
                            <button onClick={() => setIsColumnSelectorOpen(prev => !prev)} className="flex items-center justify-center w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                <Columns size={16} className="mr-2"/>
                                Kolom
                            </button>
                            {isColumnSelectorOpen && (
                                <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 p-2">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 px-2 pb-2">Tampilkan/Sembunyikan Kolom</p>
                                    <div className="max-h-60 overflow-y-auto">
                                    {(previewHeaders || []).map(header => (
                                        <label key={header} className="flex items-center px-2 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                checked={visibleHeaders.includes(header)}
                                                onChange={() => handleToggleHeader(header)}
                                            />
                                            <span className="ml-3">{header}</span>
                                        </label>
                                    ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="relative flex-grow">
                            <input 
                                type="text"
                                placeholder="Cari data..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                {visibleHeaders.map(header => (
                                    <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{header}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {paginatedData.length > 0 ? (
                            paginatedData.map((item, index) => {
                                return (
                                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        {visibleHeaders.map((header, colIndex) => {
                                            let cellValue = item[header];
                                            
                                            if (colIndex === visibleHeaders.length - 1 && typeof cellValue === 'number') {
                                                cellValue = formatCurrency(cellValue);
                                            } else if (cellValue === undefined || cellValue === null) {
                                                cellValue = '-';
                                            }
                                            
                                            return (
                                                <td key={header} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    <span className={colIndex === 0 ? 'font-medium text-gray-900 dark:text-gray-100' : ''}>{cellValue}</span>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={visibleHeaders.length} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                                    <div className="flex flex-col items-center gap-2">
                                        <Database className="w-8 h-8 text-gray-400" />
                                        <p>Belum ada data yang diunggah</p>
                                        <p className="text-xs text-gray-400">Gunakan form di atas untuk mengunggah file Excel atau CSV</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                    <div className="mt-6">
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} theme={theme} />
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default DataUploadView;