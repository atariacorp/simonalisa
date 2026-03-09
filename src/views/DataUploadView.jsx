import React from 'react';
import SectionTitle from './components/SectionTitle';
import GeminiAnalysis from './components/GeminiAnalysis';
import Pagination from './components/Pagination';
import { 
    Upload, Calendar, Trash2, Loader, Download, Columns, Search, 
    CheckCircle2, AlertCircle, FileText, Database, TrendingUp, 
    BarChart3, PieChart, Info, X, ChevronDown, ChevronUp, Filter,
    Eye, EyeOff, RefreshCw, Sparkles, Shield, Clock, HardDrive
} from 'lucide-react';
import { formatCurrency } from './utils/formatCurrency';
import { logActivity } from './utils/logActivity';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from 'recharts';

// --- UPDATED DataUploadView Component with Glassmorphism ---
const DataUploadView = ({ title, data, instruction, isMonthly, columnMapping, previewHeaders, groupedColumns, dataFilter, theme, onUpload, onDeleteMonth, isDeleting, selectedYear, userRole, getAnalysisPrompt, namaPemda }) => {
  const fileInputRef = React.useRef(null);
  const [error, setError] = React.useState('');
  const [uploadProgress, setUploadProgress] = React.useState('');
  const [isUploading, setIsUploading] = React.useState(false);
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const [selectedMonth, setSelectedMonth] = React.useState(months[0]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [showFilters, setShowFilters] = React.useState(true);
  const [showStats, setShowStats] = React.useState(true);
  const [chartView, setChartView] = React.useState('bar'); // 'bar' atau 'pie'
  const ITEMS_PER_PAGE = 10;
  
  const [visibleHeaders, setVisibleHeaders] = React.useState(previewHeaders || []);
  const [isColumnSelectorOpen, setIsColumnSelectorOpen] = React.useState(false);
  const columnSelectorRef = React.useRef(null);

  // Warna untuk visualisasi
  const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6B7280'];

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

  const dataToPreview = React.useMemo(() => {
    const rawData = isMonthly ? (data?.[selectedMonth] || []) : (data || []);
    
    const invertedMapping = {};
    (previewHeaders || []).forEach(header => {
      const key = header.replace(/[^A-Za-z0-9]/g, ''); // 'NAMA SKPD' -> 'NAMASKPD'
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

  const summaryData = React.useMemo(() => {
    if (!isMonthly || !data) {
        return null;
    }
    
    const totalBulanIni = (data[selectedMonth] || []).reduce((sum, item) => sum + (item.nilai || 0), 0);
    const totalSemuaBulan = Object.values(data)
                                .flat()
                                .reduce((sum, item) => sum + (item.nilai || 0), 0);
    
    // Hitung statistik per bulan untuk chart
    const monthlyStats = months.map(month => {
        const total = (data[month] || []).reduce((sum, item) => sum + (item.nilai || 0), 0);
        return {
            month: month.substring(0, 3),
            fullMonth: month,
            value: total / 1e9, // Konversi ke Miliar
            rawValue: total
        };
    }).filter(m => m.rawValue > 0);
    
    // Hitung distribusi berdasarkan kolom pertama (misalnya SKPD)
    const firstGroupColumn = groupedColumns?.[0] || 'SKPD';
    const firstGroupKey = firstGroupColumn.replace(/[^A-Za-z0-9]/g, '');
    
    const distributionMap = new Map();
    Object.entries(data).forEach(([month, items]) => {
        items.forEach(item => {
            const group = item[firstGroupKey] || 'Lainnya';
            if (!distributionMap.has(group)) {
                distributionMap.set(group, { name: group, value: 0, count: 0 });
            }
            const entry = distributionMap.get(group);
            entry.value += (item.nilai || 0);
            entry.count++;
        });
    });
    
    const distributionData = Array.from(distributionMap.values())
        .map(d => ({ ...d, value: d.value / 1e9 }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
    
     if (title.includes('Realisasi Belanja') || title.includes('Non RKUD')) {
        return { 
            type: 'belanja', 
            totalBulanIni, 
            totalSemuaBulan,
            monthlyStats,
            distributionData,
            itemCount: Object.values(data).flat().length
        };
    }
    if (title.includes('Realisasi Pendapatan')) {
        return { 
            type: 'pendapatan', 
            totalBulanIni, 
            totalSemuaBulan,
            monthlyStats,
            distributionData,
            itemCount: Object.values(data).flat().length
        };
    }

    return null;
  }, [data, selectedMonth, isMonthly, title, groupedColumns]);

  const handleSmartParsing = (json) => {
    if (!json || json.length === 0) {
        setError("File tidak mengandung data atau format tidak dikenali.");
        return null;
    }

    const headers = Object.keys(json[0]);
    const findHeader = (possibleNames) => {
        const lowerCaseHeaders = headers.map(h => String(h).toLowerCase().replace(/\//g, " ").trim());
        
        for (const name of possibleNames) {
            const lowerCaseName = name.toLowerCase();
            const index = lowerCaseHeaders.indexOf(lowerCaseName);
            if (index !== -1) return headers[index];
        }
        return null;
    };
    
    const isRealisasiBelanja = title.includes('Realisasi Belanja');
    let sp2dHeaderName = null;
    if (isRealisasiBelanja) {
        sp2dHeaderName = findHeader(columnMapping['NomorSP2D']);
        if (!sp2dHeaderName) {
            setError("Kolom 'Nomor SP2D' tidak ditemukan di file Excel Anda. Kolom ini wajib ada untuk Realisasi Belanja.");
            return null;
        }
    }

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
                } else {
                     setError(`Kolom filter sekunder '${dataFilter.secondaryColumn}' tidak ditemukan.`);
                     return null;
                }
            }

            if (filteredJson.length === 0) {
                setError(`Tidak ada data yang cocok dengan filter yang diterapkan.`);
                return null;
            }
        } else {
            setError(`Kolom filter '${dataFilter.column}' tidak ditemukan di file.`);
            return null;
        }
    }
    
    const parsedData = filteredJson.map(row => {
        const rowData = {};
        let hasRequiredHeaders = true;

        previewHeaders.forEach(header => {
            const key = header.replace(/[^A-Za-z0-9]/g, '');
            const columnOptions = columnMapping[key];
            
            if (!columnOptions) {
                console.error(`Konfigurasi mapping hilang untuk header: ${header}`);
                hasRequiredHeaders = false;
                return;
            }

            const foundHeader = findHeader(columnOptions);
            if (foundHeader) {
                rowData[key] = row[foundHeader];
            } else {
                const optionalKeys = ['NamaSumberDana', 'KodeRekening', 'KodeSubKegiatan', 'NamaSubUnit', 'KodeKegiatan', 'NamaSubSKPD', 'NomorSP2D', 'KeteranganDokumen'];
                if (!optionalKeys.includes(key)) {
                    hasRequiredHeaders = false;
                }
            }
        });

        if (!hasRequiredHeaders) {
            return null;
        }
        
        const valueHeader = previewHeaders[previewHeaders.length - 1];
        const valueKey = valueHeader.replace(/[^A-Za-z0-9]/g, '');
        let nilaiRealisasi = parseFloat(String(rowData[valueKey]).replace(/[^0-9.-]+/g,"")) || 0;

        if (isRealisasiBelanja) {
            const sp2dValue = rowData.NomorSP2D;
            if (sp2dValue === null || sp2dValue === undefined || String(sp2dValue).trim() === '') {
                nilaiRealisasi = 0; 
            }
        }
        
        rowData.nilai = nilaiRealisasi;

        if (isMonthly) {
            rowData.month = selectedMonth;
        }

        return rowData;

    }).filter(Boolean); 

    if (parsedData.length === 0 && filteredJson.length > 0) {
        setError("Data ditemukan, namun tidak ada baris yang valid setelah diproses. Periksa kembali apakah semua kolom wajib (termasuk Nomor SP2D untuk Realisasi Belanja) telah terisi di file Anda.");
        return null;
    }
    
    return parsedData;
  };


  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    setError('');
    setUploadProgress('');
    if (!file) return;

    setIsUploading(true);
    setUploadProgress('Membaca file...');

    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    const parseAndUpload = (jsonData) => {
        const parsedData = handleSmartParsing(jsonData);
        if (parsedData) {
            onUpload(parsedData, isMonthly ? selectedMonth : null, setUploadProgress)
                .then(() => {
                    setUploadProgress('Unggah selesai!');
                    logActivity('Unggah Data', { dataType: title, fileName: file.name, status: 'Berhasil' });
                    setTimeout(() => setUploadProgress(''), 3000);
                })
                .catch((err) => {
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
                if (results.errors.length) {
                    setError("Gagal memproses file CSV. Pastikan formatnya benar.");
                    setIsUploading(false);
                    return;
                }
                parseAndUpload(results.data);
            },
            error: (err) => {
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
                const workbook = window.XLSX.read(e.target.result, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = window.XLSX.utils.sheet_to_json(worksheet);
                parseAndUpload(json);
            } catch (err) {
                console.error(err);
                setError("Gagal memproses file Excel. Periksa konsol untuk detailnya.");
                setIsUploading(false);
            }
        };
        reader.readAsBinaryString(file);
    } else {
        setError("Format file tidak didukung. Harap unggah file CSV atau Excel (.xlsx, .xls).");
        setIsUploading(false);
    }
  };

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
              previewHeaders.forEach(header => {
                  const key = header.replace(/[^A-Za-z0-9]/g, '');
                  if (header === previewHeaders[previewHeaders.length - 1]) {
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
          
          const fileName = `${title.replace(/ /g, '_')}_${isMonthly ? selectedMonth : ''}_${selectedYear}.xlsx`;
          window.XLSX.writeFile(workbook, fileName);
      } catch (err) {
          console.error("Error creating Excel file:", err);
          setError("Gagal membuat file Excel.");
      }
  };

  const handleButtonClick = () => { fileInputRef.current.click(); };
  
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

  return (
    <div className="space-y-6">
        <SectionTitle>{title} - Tahun Anggaran {selectedYear}</SectionTitle>
        
        {/* Executive Dashboard */}
        {summaryData && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 shadow-[0_8px_32px_rgba(0,0,0,0.12)] mb-6">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-emerald-400/10 to-teal-400/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
                
                <div className="relative p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-lg">
                            <Database className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Dashboard Data {title}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Ringkasan dan analisis data {title} tahun {selectedYear}
                            </p>
                        </div>
                    </div>
                    
                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-xl border border-white/40 dark:border-gray-700/50 p-4">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Total {selectedMonth}</p>
                            <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(summaryData.totalBulanIni)}</p>
                        </div>
                        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-xl border border-white/40 dark:border-gray-700/50 p-4">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Total Semua Bulan</p>
                            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(summaryData.totalSemuaBulan)}</p>
                        </div>
                        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-xl border border-white/40 dark:border-gray-700/50 p-4">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Jumlah Entri</p>
                            <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{summaryData.itemCount.toLocaleString()}</p>
                        </div>
                        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-xl border border-white/40 dark:border-gray-700/50 p-4">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Bulan dengan Data</p>
                            <p className="text-xl font-bold text-rose-600 dark:text-rose-400">{summaryData.monthlyStats?.length || 0}</p>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {getAnalysisPrompt && (
            <GeminiAnalysis 
                getAnalysisPrompt={(customQuery) => getAnalysisPrompt(isMonthly ? selectedMonth : 'annual', dataToPreview, customQuery)}
                disabledCondition={dataToPreview.length === 0}
                theme={theme}
                interactivePlaceholder={`Tanya tentang data ${title}...`}
            />
        )}

        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-gray-700/30 shadow-xl p-6">
            {/* Upload Status Section */}
            {isMonthly && summaryData && (
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-indigo-500" />
                            Status Unggahan Bulanan
                        </h3>
                        <button
                            onClick={() => setShowStats(!showStats)}
                            className="p-2 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-lg hover:bg-white/70 dark:hover:bg-gray-700/70 transition-colors"
                        >
                            {showStats ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    
                    {showStats && (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                                {months.map(month => {
                                    const hasData = data[month] && data[month].length > 0;
                                    return (
                                        <div 
                                            key={month} 
                                            className={`flex items-center p-3 rounded-xl backdrop-blur-sm border ${
                                                hasData 
                                                    ? 'bg-emerald-50/70 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' 
                                                    : 'bg-amber-50/70 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                                            } ${selectedMonth === month ? 'ring-2 ring-indigo-500' : ''}`}
                                            onClick={() => setSelectedMonth(month)}
                                        >
                                            {hasData ? 
                                                <CheckCircle2 className="text-emerald-500 mr-2" size={18} /> : 
                                                <AlertCircle className="text-amber-500 mr-2" size={18} />
                                            }
                                            <span className={`text-sm font-medium ${
                                                hasData 
                                                    ? 'text-emerald-700 dark:text-emerald-300' 
                                                    : 'text-amber-700 dark:text-amber-300'
                                            }`}>{month}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Chart Section */}
                            {summaryData.monthlyStats?.length > 0 && (
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-semibold text-gray-700 dark:text-gray-300">Tren Bulanan</h4>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setChartView('bar')}
                                                className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                                                    chartView === 'bar' 
                                                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400' 
                                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                                }`}
                                            >
                                                Bar
                                            </button>
                                            <button
                                                onClick={() => setChartView('pie')}
                                                className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                                                    chartView === 'pie' 
                                                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400' 
                                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                                }`}
                                            >
                                                Pie
                                            </button>
                                        </div>
                                    </div>
                                    <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-xl p-4">
                                        <ResponsiveContainer width="100%" height={250}>
                                            {chartView === 'bar' ? (
                                                <BarChart data={summaryData.monthlyStats}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
                                                    <XAxis dataKey="month" />
                                                    <YAxis tickFormatter={(val) => `${val}M`} />
                                                    <Tooltip 
                                                        formatter={(value) => `${value} Miliar`}
                                                        contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                                    />
                                                    <Bar dataKey="value" fill="url(#barGradient)" barSize={30} />
                                                    <defs>
                                                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="#6366F1" stopOpacity={0.8}/>
                                                            <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                                                        </linearGradient>
                                                    </defs>
                                                </BarChart>
                                            ) : (
                                                <RePieChart>
                                                    <Pie
                                                        data={summaryData.monthlyStats}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={90}
                                                        paddingAngle={2}
                                                        dataKey="value"
                                                        label={({ month, percent }) => `${month} ${(percent * 100).toFixed(0)}%`}
                                                    >
                                                        {summaryData.monthlyStats.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip formatter={(value) => `${value} Miliar`} />
                                                </RePieChart>
                                            )}
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}

                            {/* Distribution Chart */}
                            {summaryData.distributionData?.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">Distribusi per {groupedColumns?.[0] || 'Kategori'}</h4>
                                    <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-xl p-4">
                                        <ResponsiveContainer width="100%" height={200}>
                                            <BarChart data={summaryData.distributionData} layout="vertical">
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
                                                <XAxis type="number" tickFormatter={(val) => `${val}M`} />
                                                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} />
                                                <Tooltip formatter={(value) => `${value} Miliar`} />
                                                <Bar dataKey="value" fill="#8884d8" barSize={15} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Upload Section */}
            <div className="bg-gradient-to-br from-indigo-50/30 to-purple-50/30 dark:from-indigo-900/10 dark:to-purple-900/10 backdrop-blur-sm rounded-xl border-2 border-dashed border-indigo-200 dark:border-indigo-800 p-8 text-center">
                <div className="flex flex-col items-center justify-center">
                    <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-4">
                        <Upload className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Unggah Data {title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl mb-4">{instruction}</p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        {isMonthly && (
                            <div className="inline-flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
                                <Calendar className="ml-3 text-gray-400" size={18}/>
                                <select 
                                    value={selectedMonth} 
                                    onChange={e => setSelectedMonth(e.target.value)} 
                                    className="py-2.5 pl-2 pr-8 bg-transparent text-gray-700 dark:text-gray-300 font-medium focus:outline-none rounded-xl"
                                >
                                    {months.map(month => <option key={month} value={month}>{month}</option>)}
                                </select>
                            </div>
                        )}
                        <button 
                            onClick={handleButtonClick} 
                            disabled={isUploading || userRole !== 'admin'} 
                            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            {isUploading ? <Loader className="animate-spin" size={18} /> : <Upload size={18} />}
                            {isUploading ? 'Mengunggah...' : `Pilih File ${isMonthly ? selectedMonth : ''}`}
                        </button>
                        {isMonthly && onDeleteMonth && userRole === 'admin' && (
                            <button 
                                onClick={() => {
                                    const dataType = title.includes('Belanja') 
                                        ? 'realisasi' 
                                        : title.includes('Pendapatan') 
                                            ? 'realisasiPendapatan' 
                                            : 'realisasiNonRkud';
                                    onDeleteMonth(dataType, selectedMonth, setUploadProgress);
                                }}
                                disabled={isUploading || isDeleting || !data[selectedMonth] || data[selectedMonth].length === 0}
                                className="p-2.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold rounded-xl shadow-lg transition-all disabled:opacity-50"
                                title={`Hapus Data ${selectedMonth}`}
                            >
                               {isDeleting ? <Loader className="animate-spin" size={18}/> : <Trash2 size={18}/>}
                            </button>
                        )}
                    </div>
                    {userRole !== 'admin' && (
                        <div className="mt-4 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2">
                            <Shield size={14} className="text-amber-500" />
                            <p className="text-xs text-amber-600 dark:text-amber-400">Hanya Admin yang dapat mengunggah data.</p>
                        </div>
                    )}
                    <input type="file" ref={fileInputRef} className="hidden" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleFileUpload}/>
                </div>
                
                {error && (
                    <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg flex items-center gap-2">
                        <AlertCircle size={16} className="text-rose-500" />
                        <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
                    </div>
                )}
                
                {uploadProgress && (
                    <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2">
                        <RefreshCw size={16} className="text-emerald-500 animate-spin" />
                        <p className="text-sm text-emerald-600 dark:text-emerald-400">{uploadProgress}</p>
                    </div>
                )}
            </div>

            {/* Data Preview Section */}
            <div className="mt-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-500" />
                        Pratinjau Data {isMonthly ? `- ${selectedMonth}` : ''}
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="px-3 py-2 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-white/70 dark:hover:bg-gray-700/70 transition-colors flex items-center gap-1"
                        >
                            <Filter size={16} />
                            Filter
                        </button>
                        
                        {isMonthly && (
                            <button 
                                onClick={handleDownloadExcel} 
                                disabled={dataToPreview.length === 0} 
                                className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl shadow-lg transition-all disabled:opacity-50"
                            >
                                <Download size={16} className="mr-2"/>
                                Download
                            </button>
                        )}
                        
                        <div className="relative" ref={columnSelectorRef}>
                            <button 
                                onClick={() => setIsColumnSelectorOpen(prev => !prev)} 
                                className="flex items-center justify-center px-4 py-2 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-white/70 dark:hover:bg-gray-700/70 transition-colors"
                            >
                                <Columns size={16} className="mr-2"/>
                                Kolom
                            </button>
                            {isColumnSelectorOpen && (
                                <div className="absolute top-full right-0 mt-2 w-64 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-white/30 dark:border-gray-700/30 rounded-xl shadow-xl z-50 p-3">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 px-2 pb-2 border-b border-gray-200 dark:border-gray-700">Tampilkan/Sembunyikan Kolom</p>
                                    <div className="max-h-60 overflow-y-auto mt-2">
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
                        
                        <div className="relative flex-grow min-w-[200px]">
                            <input 
                                type="text"
                                placeholder="Cari data..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Table Preview */}
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm">
                            <tr>
                                {visibleHeaders.map(header => (
                                    <th key={header} className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {paginatedData.length > 0 ? (() => {
                            let lastGroupValues = {};
                            return paginatedData.map((item, index) => {
                                return (
                                <tr key={index} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                    {visibleHeaders.map((header, colIndex) => {
                                        const key = header.replace(/[^A-Za-z0-9]/g, '');
                                        const isGrouped = groupedColumns && groupedColumns.includes(header);
                                        let showValue = true;

                                        if (isGrouped) {
                                            const headerIndex = groupedColumns.indexOf(header);
                                            for (let i = 0; i < headerIndex; i++) {
                                                const parentHeader = groupedColumns[i];
                                                const parentKey = parentHeader.replace(/[^A-Za-z0-9]/g, '');
                                                if (item[parentKey] !== lastGroupValues[parentKey]) {
                                                    for (let j = i; j < groupedColumns.length; j++) {
                                                        lastGroupValues[groupedColumns[j].replace(/[^A-Za-z0-9]/g, '')] = null;
                                                    }
                                                    break;
                                                }
                                            }
                                            if (item[key] === lastGroupValues[key]) {
                                                showValue = false;
                                            } else {
                                                lastGroupValues[key] = item[key];
                                            }
                                        }
                                        
                                        let cellValue;
                                        if (colIndex === visibleHeaders.length - 1) {
                                            cellValue = formatCurrency(item.nilai);
                                        } else {
                                            cellValue = item[key];
                                        }
                                        
                                        return (
                                            <td key={header} className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                <span className={colIndex === 0 ? 'font-medium text-gray-900 dark:text-gray-200' : ''}>
                                                    {isGrouped && !showValue ? '' : cellValue}
                                                </span>
                                            </td>
                                        );
                                    })}
                                </tr>
                                );
                            });
                            })() : (
                            <tr>
                            <td colSpan={visibleHeaders.length} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                                <div className="flex flex-col items-center gap-2">
                                    <Database className="w-8 h-8 text-gray-400" />
                                    <p>Belum ada data yang diunggah</p>
                                    <p className="text-xs text-gray-400">Gunakan form di atas untuk mengunggah file</p>
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

            {/* Footer Info */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                    <HardDrive size={12} />
                    Total data: {dataToPreview.length} baris
                </span>
                <span className="flex items-center gap-1">
                    <Clock size={12} />
                    Update terakhir: {new Date().toLocaleDateString('id-ID')}
                </span>
                <span className="flex items-center gap-1">
                    <Shield size={12} />
                    Format: CSV, XLSX, XLS
                </span>
            </div>
        </div>
    </div>
  );
};

export default DataUploadView;
