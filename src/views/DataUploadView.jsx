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
import { deleteMonthlyData, fetchData } from '../services/firebaseService';
import { useState, useEffect } from 'react';

// --- DataUploadView Component with Glassmorphism ---
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
  const [chartView, setChartView] = React.useState('bar');
  const ITEMS_PER_PAGE = 10;
  const [localIsDeleting, setLocalIsDeleting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // ==================== PERBAIKAN 1: Dynamic Preview Headers ====================
  const getPreviewHeaders = () => {
    if (title.includes('Pendapatan')) {
      return [
        'Kode SKPD', 
        'Nama SKPD', 
        'Kode Unit SKPD',
        'Nama Unit SKPD',
        'Kode Sub Kegiatan', 
        'Nama Sub Kegiatan', 
        'Kode Rekening', 
        'Nama Rekening',
        'Kode Akun Utama',
        'Nama Akun Utama',
        'Nomor Bukti',
        'Tanggal Bukti',
        'Nilai Realisasi (Rp)'
      ];
    } else if (title.includes('Belanja')) {
      return [
        'Kode SKPD', 
        'Nama SKPD', 
        'Kode Sub Kegiatan', 
        'Nama Sub Kegiatan', 
        'Kode Rekening', 
        'Nama Rekening',
        'Nomor SP2D',
        'Nilai Realisasi (Rp)'
      ];
    }
    return previewHeaders || [
      'Kode SKPD', 
      'Nama SKPD', 
      'Kode Sub Kegiatan', 
      'Nama Sub Kegiatan', 
      'Kode Rekening', 
      'Nama Rekening', 
      'Nilai Realisasi'
    ];
  };
  
  const defaultPreviewHeaders = getPreviewHeaders();
  const [visibleHeaders, setVisibleHeaders] = React.useState(defaultPreviewHeaders);
  const [isColumnSelectorOpen, setIsColumnSelectorOpen] = React.useState(false);
  const columnSelectorRef = React.useRef(null);

  // ==================== PERBAIKAN 2: Dynamic Mapping untuk Data Pendapatan ====================
  const getMappingForDataType = () => {
    if (title.includes('Pendapatan')) {
      return {
        KodeSKPD: ['kodeskpd', 'kode_skpd', 'kode skpd', 'kode_skpd', 'skpd_kode', 'kode_skpd_id'],
        NamaSKPD: ['namaskpd', 'nama_skpd', 'nama skpd', 'nama_skpd', 'skpd_nama'],
        KodeUnitSKPD: ['kodeunitskpd', 'kode_unit_skpd', 'kode_unit', 'kode_unit_skpd_id'],
        NamaUnitSKPD: ['namaunitskpd', 'nama_unit_skpd', 'nama_unit', 'unit_skpd_nama'],
        KodeSubKegiatan: ['kodesubkegiatan', 'kode_sub_kegiatan', 'kode_subkegiatan', 'sub_kegiatan_kode'],
        NamaSubKegiatan: ['namasubkegiatan', 'nama_sub_kegiatan', 'nama_subkegiatan', 'sub_kegiatan_nama'],
        KodeRekening: ['kodeakunrinci', 'kode_rekening', 'kode_rekening_rinci', 'kode_akun_rinci', 'akun_rinci_kode'],
        NamaRekening: ['namaakunrinci', 'nama_rekening', 'nama_rekening_rinci', 'nama_akun_rinci', 'akun_rinci_nama'],
        KodeAkunUtama: ['kodeakunutama', 'kode_akun_utama', 'kode_akun_utama', 'akun_utama_kode'],
        NamaAkunUtama: ['namaakunutama', 'nama_akun_utama', 'nama_akun_utama', 'akun_utama_nama'],
        KodeAkun: ['kodeakunobjek', 'kode_akun_objek', 'kode_akun', 'akun_kode'],
        NamaAkun: ['namaakun_objek', 'nama_akun_objek', 'nama_akun', 'akun_nama'],
        NilaiKredit: ['nilaikredit', 'nilai_kredit', 'kredit', 'jumlah_kredit', 'nilai', 'realisasi'],
        NilaiDebet: ['nilaidebet', 'nilai_debet', 'debet', 'jumlah_debet'],
        NomorBukti: ['nomorbukti', 'nomor_bukti', 'no_bukti', 'no_bukti_transaksi', 'nomor_transaksi'],
        TanggalBukti: ['tanggalbukti', 'tanggal_bukti', 'tgl_bukti', 'tanggal_transaksi'],
        Keterangan: ['keterangan', 'catatan', 'keterangan_transaksi', 'uraian']
      };
    }
    
    // Mapping untuk data belanja
    return {
      KodeSKPD: ['kodeskpd', 'kode_skpd', 'Kode SKPD', 'Kode_SKPD'],
      NamaSKPD: ['namaskpd', 'nama_skpd', 'Nama SKPD', 'Nama_SKPD'],
      KodeSubKegiatan: ['kodesubkegiatan', 'kode_sub_kegiatan', 'Kode Sub Kegiatan', 'Kode_Sub_Kegiatan'],
      NamaSubKegiatan: ['namasubkegiatan', 'nama_sub_kegiatan', 'Nama Sub Kegiatan', 'Nama_Sub_Kegiatan'],
      KodeRekening: ['kodeakunrinci', 'kode_rekening', 'Kode Rekening', 'Kode_Rekening'],
      NamaRekening: ['namaakunrinci', 'nama_rekening', 'Nama Rekening', 'Nama_Rekening'],
      Nilai: ['nilairealisasi', 'nilai_realisasi', 'Nilai Realisasi', 'nilai', 'realisasi'],
      NomorSP2D: ['nomorsp2d', 'nomor_sp2d', 'Nomor SP2D', 'no_sp2d'],
      Keterangan: ['keterangan', 'uraian', 'catatan']
    };
  };

  // ==================== PERBAIKAN 3: Enhanced Filter Baris Kosong ====================
  const filterEmptyRows = (jsonData) => {
    return jsonData.filter(row => {
      // Cek apakah baris memiliki data valid
      const hasTahun = row.tahun && String(row.tahun).trim() !== '';
      const hasNilaiKredit = row.nilaikredit && parseFloat(row.nilaikredit) !== 0;
      const hasNilaiDebet = row.nilaidebet && parseFloat(row.nilaidebet) !== 0;
      const hasKodeSKPD = row.kodeskpd && String(row.kodeskpd).trim() !== '';
      const hasNamaSKPD = row.namaskpd && String(row.namaskpd).trim() !== '';
      const hasKodeRekening = row.kodeakunrinci && String(row.kodeakunrinci).trim() !== '';
      
      // Cek apakah ada setidaknya satu nilai penting yang terisi
      const hasImportantData = hasTahun || hasNilaiKredit || hasNilaiDebet || 
                               hasKodeSKPD || hasNamaSKPD || hasKodeRekening;
      
      // Cek juga apakah baris tidak semua kolom kosong
      const hasAnyValue = Object.values(row).some(val => 
        val !== null && 
        val !== undefined && 
        val !== '' && 
        !(typeof val === 'string' && val.trim() === '')
      );
      
      return hasImportantData && hasAnyValue;
    });
  };

  // ==================== PERBAIKAN 4: Enhanced Find Header Function ====================
  const findHeader = (headers, possibleNames) => {
    const lowerCaseHeaders = headers.map(h => String(h).toLowerCase().replace(/\//g, " ").trim());
    
    for (const name of possibleNames) {
      const lowerCaseName = name.toLowerCase().replace(/\//g, " ").trim();
      
      // Cari exact match
      let index = lowerCaseHeaders.indexOf(lowerCaseName);
      if (index !== -1) return headers[index];
      
      // Cari includes match
      index = lowerCaseHeaders.findIndex(h => h === lowerCaseName || h.includes(lowerCaseName) || lowerCaseName.includes(h));
      if (index !== -1) return headers[index];
    }
    return null;
  };

  // ==================== PERBAIKAN 5: Enhanced Smart Parsing dengan Filter Pendapatan Daerah ====================
  const handleSmartParsing = (json) => {
    if (!json || json.length === 0) {
      setError("File tidak mengandung data atau format tidak dikenali.");
      return null;
    }

    // Filter baris kosong
    const nonEmptyJson = filterEmptyRows(json);
    
    if (nonEmptyJson.length === 0) {
      setError("File tidak mengandung data yang valid. Semua baris kosong atau tidak memiliki data penting.");
      return null;
    }

    console.log(`📊 Total baris: ${json.length}, Baris valid: ${nonEmptyJson.length}`);
    console.log(`📄 Tipe data: ${title}`);

    const headers = Object.keys(nonEmptyJson[0]);
    console.log(`📋 Kolom yang ditemukan: ${headers.slice(0, 10).join(', ')}...`);
    
    // Dapatkan mapping sesuai tipe data
    const mapping = getMappingForDataType();
    
    // ==================== FILTER KHUSUS UNTUK PENDAPATAN DAERAH ====================
    // Cari kolom namaakunutama
    const namaAkunUtamaHeader = findHeader(headers, mapping.NamaAkunUtama);
    
    if (title.includes('Pendapatan')) {
      if (!namaAkunUtamaHeader) {
        console.warn('⚠️ Kolom Nama Akun Utama tidak ditemukan, akan memproses semua data');
      } else {
        console.log(`🔍 Kolom Nama Akun Utama ditemukan: ${namaAkunUtamaHeader}`);
        
        // Filter hanya data dengan namaakunutama = "PENDAPATAN DAERAH"
        const filteredByAkun = nonEmptyJson.filter(row => {
          const akunValue = String(row[namaAkunUtamaHeader] || '').toUpperCase().trim();
          const isPendapatanDaerah = akunValue === 'PENDAPATAN DAERAH' || 
                                      akunValue.includes('PENDAPATAN DAERAH') ||
                                      akunValue === 'PENDAPATAN';
          
          if (!isPendapatanDaerah && akunValue !== '') {
            console.log(`⏭️ Melewati data dengan akun: ${akunValue}`);
          }
          
          return isPendapatanDaerah;
        });
        
        console.log(`📊 Data setelah filter PENDAPATAN DAERAH: ${filteredByAkun.length} dari ${nonEmptyJson.length} baris`);
        
        if (filteredByAkun.length === 0) {
          setError("Tidak ada data dengan Nama Akun Utama 'PENDAPATAN DAERAH'. Pastikan file Excel memiliki kolom namaakunutama dengan nilai 'PENDAPATAN DAERAH'.");
          return null;
        }
        
        // Gunakan data yang sudah difilter
        nonEmptyJson.length = 0;
        nonEmptyJson.push(...filteredByAkun);
      }
    }
    
    // Cari kolom nilai - PRIORITAS untuk pendapatan
    let nilaiHeader = null;
    let isKredit = true; // Flag untuk menentukan apakah menggunakan kredit atau debet
    
    if (title.includes('Pendapatan')) {
      // Untuk pendapatan, cari kolom nilaikredit terlebih dahulu
      nilaiHeader = findHeader(headers, mapping.NilaiKredit);
      if (!nilaiHeader) {
        nilaiHeader = findHeader(headers, mapping.NilaiDebet);
        isKredit = false;
      }
    } else {
      nilaiHeader = findHeader(headers, mapping.Nilai);
    }

    if (!nilaiHeader) {
      setError(`Kolom nilai tidak ditemukan. Pastikan file memiliki kolom: ${[...mapping.NilaiKredit, ...mapping.Nilai].join(', ')}`);
      return null;
    }

    console.log(`💰 Kolom nilai ditemukan: ${nilaiHeader} (${isKredit ? 'Kredit' : 'Debet'})`);

    // Cari kolom-kolom lainnya
    const kodeSKPDHeader = findHeader(headers, mapping.KodeSKPD);
    const namaSKPDHeader = findHeader(headers, mapping.NamaSKPD);
    const kodeUnitSKPDHeader = findHeader(headers, mapping.KodeUnitSKPD);
    const namaUnitSKPDHeader = findHeader(headers, mapping.NamaUnitSKPD);
    const kodeSubKegiatanHeader = findHeader(headers, mapping.KodeSubKegiatan);
    const namaSubKegiatanHeader = findHeader(headers, mapping.NamaSubKegiatan);
    const kodeRekeningHeader = findHeader(headers, mapping.KodeRekening);
    const namaRekeningHeader = findHeader(headers, mapping.NamaRekening);
    const kodeAkunUtamaHeader = findHeader(headers, mapping.KodeAkunUtama);
    const namaAkunUtamaHeader2 = findHeader(headers, mapping.NamaAkunUtama);
    const kodeAkunHeader = findHeader(headers, mapping.KodeAkun);
    const namaAkunHeader = findHeader(headers, mapping.NamaAkun);
    const nomorBuktiHeader = findHeader(headers, mapping.NomorBukti);
    const tanggalBuktiHeader = findHeader(headers, mapping.TanggalBukti);
    const keteranganHeader = findHeader(headers, mapping.Keterangan);

    console.log(`🔍 Mapping kolom:
      - Kode SKPD: ${kodeSKPDHeader || 'Tidak ditemukan'}
      - Nama SKPD: ${namaSKPDHeader || 'Tidak ditemukan'}
      - Kode Rekening: ${kodeRekeningHeader || 'Tidak ditemukan'}
      - Nama Rekening: ${namaRekeningHeader || 'Tidak ditemukan'}
      - Nama Akun Utama: ${namaAkunUtamaHeader2 || 'Tidak ditemukan'}
    `);

    const parsedData = nonEmptyJson.map((row, index) => {
      // Ambil nilai dengan konversi yang benar
      let nilaiRealisasi = 0;
      const rawValue = row[nilaiHeader];
      
      if (rawValue !== undefined && rawValue !== null && rawValue !== '') {
        // Handle berbagai format nilai
        let cleanValue = String(rawValue).trim();
        // Hapus titik separator ribuan, konversi koma ke titik
        cleanValue = cleanValue.replace(/\./g, '').replace(/,/g, '.');
        const parsed = parseFloat(cleanValue);
        nilaiRealisasi = isNaN(parsed) ? 0 : parsed;
      }
      
      // Untuk pendapatan, jika menggunakan nilai debet, konversi ke positif
      if (!isKredit && nilaiRealisasi < 0) {
        nilaiRealisasi = Math.abs(nilaiRealisasi);
      }
      
      // Ekstrak tahun dari berbagai kemungkinan sumber
      let tahun = selectedYear;
      if (row.tahun && String(row.tahun).trim()) {
        tahun = parseInt(String(row.tahun).trim());
      } else if (row.tahun_anggaran && String(row.tahun_anggaran).trim()) {
        tahun = parseInt(String(row.tahun_anggaran).trim());
      } else if (row.tanggalbukti && String(row.tanggalbukti).trim()) {
        const dateMatch = String(row.tanggalbukti).match(/\d{4}/);
        if (dateMatch) tahun = parseInt(dateMatch[0]);
      }
      
      // Ekstrak bulan
      let bulan = null;
      if (row.bulan && String(row.bulan).trim()) {
        bulan = parseInt(String(row.bulan).trim());
      } else if (isMonthly) {
        bulan = months.indexOf(selectedMonth) + 1;
      } else if (row.tanggalbukti && String(row.tanggalbukti).trim()) {
        const date = new Date(row.tanggalbukti);
        if (!isNaN(date.getTime())) bulan = date.getMonth() + 1;
      }
      
      // Buat data object
      const dataRow = {
        kode_skpd: kodeSKPDHeader ? row[kodeSKPDHeader] : null,
        nama_skpd: namaSKPDHeader ? row[namaSKPDHeader] : null,
        kode_unit_skpd: kodeUnitSKPDHeader ? row[kodeUnitSKPDHeader] : null,
        nama_unit_skpd: namaUnitSKPDHeader ? row[namaUnitSKPDHeader] : null,
        kode_sub_kegiatan: kodeSubKegiatanHeader ? row[kodeSubKegiatanHeader] : null,
        nama_sub_kegiatan: namaSubKegiatanHeader ? row[namaSubKegiatanHeader] : null,
        kode_rekening: kodeRekeningHeader ? row[kodeRekeningHeader] : null,
        nama_rekening: namaRekeningHeader ? row[namaRekeningHeader] : null,
        kode_akun_utama: kodeAkunUtamaHeader ? row[kodeAkunUtamaHeader] : null,
        nama_akun_utama: namaAkunUtamaHeader2 ? row[namaAkunUtamaHeader2] : 'PENDAPATAN DAERAH',
        kode_akun: kodeAkunHeader ? row[kodeAkunHeader] : null,
        nama_akun: namaAkunHeader ? row[namaAkunHeader] : null,
        nilai: nilaiRealisasi,
        tahun: tahun,
        bulan: bulan,
        nomor_bukti: nomorBuktiHeader ? row[nomorBuktiHeader] : null,
        tanggal_bukti: tanggalBuktiHeader ? row[tanggalBuktiHeader] : null,
        keterangan: keteranganHeader ? row[keteranganHeader] : (row.keterangan || row.catatan || null),
        // Simpan data mentah untuk debugging
        _raw: { ...row }
      };
      
      if (isMonthly) {
        dataRow.month = selectedMonth;
      }
      
      return dataRow;
    }).filter(row => {
      // Filter data yang benar-benar valid
      // Data valid jika memiliki SKPD ATAU memiliki nilai > 0
      const hasSKPD = row.kode_skpd || row.nama_skpd;
      const hasRekening = row.kode_rekening || row.nama_rekening;
      const hasValue = row.nilai > 0;
      const hasValueZero = row.nilai === 0;
      
      // Data tetap diproses jika memiliki SKPD/rekening ATAU nilai > 0
      // Data dengan nilai 0 tetap diproses jika memiliki SKPD/rekening
      return (hasSKPD || hasRekening) && (hasValue || hasValueZero);
    });

    console.log(`✅ Berhasil memproses ${parsedData.length} baris data`);
    console.log(`📈 Data dengan nilai > 0: ${parsedData.filter(d => d.nilai > 0).length}`);
    console.log(`📉 Data dengan nilai = 0: ${parsedData.filter(d => d.nilai === 0).length}`);
    
    if (parsedData.length > 0) {
      console.log('📝 Sample data pertama:', {
        ...parsedData[0],
        _raw: undefined // Hilangkan raw data dari log
      });
    }

    if (parsedData.length === 0) {
      setError("Tidak ada data yang valid. Pastikan kolom SKPD, rekening, dan nilai terisi dengan benar.");
      return null;
    }

    return parsedData;
  };

  // ==================== PERBAIKAN 6: Enhanced Upload Handler ====================
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    setError('');
    setUploadProgress('');
    if (!file) return;

    // Validasi ekstensi file
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(fileExtension)) {
      setError("Format file tidak didukung. Harap unggah file CSV atau Excel (.xlsx, .xls).");
      return;
    }

    // Validasi ukuran file (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError("Ukuran file terlalu besar. Maksimal 50MB.");
      return;
    }

    setIsUploading(true);
    setUploadProgress('📂 Membaca file...');

    const parseAndUpload = (jsonData) => {
      setUploadProgress('🔄 Memproses data...');
      
      // Filter baris kosong di awal
      const cleanJsonData = filterEmptyRows(jsonData);
      
      if (cleanJsonData.length === 0) {
        setError("File tidak mengandung data yang valid setelah difilter.");
        setIsUploading(false);
        return;
      }
      
      setUploadProgress(`📊 Memproses ${cleanJsonData.length} baris data...`);
      
      const parsedData = handleSmartParsing(cleanJsonData);
      if (parsedData && parsedData.length > 0) {
        setUploadProgress(`💾 Mengunggah ${parsedData.length} baris data ke database...`);
        
        onUpload(parsedData, isMonthly ? selectedMonth : null, setUploadProgress)
          .then(() => {
            setUploadProgress(`✅ Berhasil mengunggah ${parsedData.length} baris data!`);
            logActivity('Unggah Data', { 
              dataType: title, 
              fileName: file.name, 
              status: 'Berhasil', 
              rowCount: parsedData.length,
              month: isMonthly ? selectedMonth : null,
              year: selectedYear
            });
            setTimeout(() => setUploadProgress(''), 3000);
            // Reset file input
            if (fileInputRef.current) fileInputRef.current.value = '';
          })
          .catch((err) => {
            console.error('Upload error:', err);
            setError(`Gagal mengunggah data: ${err.message || 'Unknown error'}`);
            logActivity('Unggah Data', { 
              dataType: title, 
              fileName: file.name, 
              status: 'Gagal', 
              error: err.message 
            });
            setUploadProgress('');
          })
          .finally(() => setIsUploading(false));
      } else if (parsedData && parsedData.length === 0) {
        setIsUploading(false);
      } else {
        logActivity('Unggah Data', { 
          dataType: title, 
          fileName: file.name, 
          status: 'Gagal', 
          error: 'Gagal memproses file' 
        });
        setIsUploading(false);
      }
    };

    // Baca file berdasarkan ekstensi
    try {
      if (fileExtension === 'csv') {
        if (!window.Papa) {
          setError("Pustaka PapaParse (CSV) tidak tersedia. Silakan muat ulang halaman.");
          setIsUploading(false);
          return;
        }
        window.Papa.parse(file, {
          header: true, 
          skipEmptyLines: true,
          encoding: "UTF-8",
          complete: (results) => {
            if (results.errors.length) {
              console.warn('CSV parsing warnings:', results.errors);
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
          setError("Pustaka SheetJS (Excel) tidak tersedia. Silakan muat ulang halaman.");
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
      }
    } catch (err) {
      console.error('File read error:', err);
      setError(`Gagal membaca file: ${err.message}`);
      setIsUploading(false);
    }
  };

  // ==================== PERBAIKAN 7: Enhanced Data Preview ====================
  const dataToPreview = React.useMemo(() => {
    const rawData = isMonthly ? (data?.[selectedMonth] || []) : (data || []);
    
    if (!rawData.length) return [];
    
    return rawData.map(item => {
      const previewItem = {};
      
      if (title.includes('Pendapatan')) {
        previewItem['Kode SKPD'] = item.kode_skpd || '-';
        previewItem['Nama SKPD'] = item.nama_skpd || '-';
        previewItem['Kode Unit SKPD'] = item.kode_unit_skpd || '-';
        previewItem['Nama Unit SKPD'] = item.nama_unit_skpd || '-';
        previewItem['Kode Sub Kegiatan'] = item.kode_sub_kegiatan || '-';
        previewItem['Nama Sub Kegiatan'] = item.nama_sub_kegiatan || '-';
        previewItem['Kode Rekening'] = item.kode_rekening || '-';
        previewItem['Nama Rekening'] = item.nama_rekening || '-';
        previewItem['Kode Akun Utama'] = item.kode_akun_utama || '-';
        previewItem['Nama Akun Utama'] = item.nama_akun_utama || 'PENDAPATAN DAERAH';
        previewItem['Nomor Bukti'] = item.nomor_bukti || '-';
        previewItem['Tanggal Bukti'] = item.tanggal_bukti || '-';
        previewItem['Nilai Realisasi (Rp)'] = item.nilai || 0;
      } else {
        previewItem['Kode SKPD'] = item.kode_skpd || '-';
        previewItem['Nama SKPD'] = item.nama_skpd || '-';
        previewItem['Kode Sub Kegiatan'] = item.kode_sub_kegiatan || '-';
        previewItem['Nama Sub Kegiatan'] = item.nama_sub_kegiatan || '-';
        previewItem['Kode Rekening'] = item.kode_rekening || '-';
        previewItem['Nama Rekening'] = item.nama_rekening || '-';
        previewItem['Nilai Realisasi'] = item.nilai || 0;
      }
      
      return previewItem;
    });
  }, [isMonthly, data, selectedMonth, title]);

  // ==================== PERBAIKAN 8: Enhanced Summary Data ====================
  const summaryData = React.useMemo(() => {
    if (!isMonthly || !data) {
      return null;
    }
    
    const rawData = data[selectedMonth] || [];
    const totalBulanIni = rawData.reduce((sum, item) => sum + (item.nilai || 0), 0);
    const totalSemuaBulan = Object.values(data)
                                .flat()
                                .reduce((sum, item) => sum + (item.nilai || 0), 0);
    
    // Hitung statistik per bulan untuk chart
    const monthlyStats = months.map(month => {
      const monthData = data[month] || [];
      const total = monthData.reduce((sum, item) => sum + (item.nilai || 0), 0);
      const count = monthData.length;
      return {
        month: month.substring(0, 3),
        fullMonth: month,
        value: total / 1e9, // Konversi ke Miliar
        rawValue: total,
        count: count
      };
    }).filter(m => m.rawValue > 0 || m.count > 0);
    
    // Hitung distribusi berdasarkan SKPD
    const skpdMap = new Map();
    Object.values(data).forEach(items => {
      items.forEach(item => {
        const skpd = item.nama_skpd || item.kode_skpd || 'Tidak Diketahui';
        if (!skpdMap.has(skpd)) {
          skpdMap.set(skpd, { name: skpd, value: 0, count: 0 });
        }
        const entry = skpdMap.get(skpd);
        entry.value += (item.nilai || 0);
        entry.count++;
      });
    });
    
    const distributionData = Array.from(skpdMap.values())
      .map(d => ({ ...d, value: d.value / 1e9 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
    
    // Hitung statistik nilai 0 vs positif
    const zeroValueCount = rawData.filter(item => item.nilai === 0).length;
    const positiveValueCount = rawData.filter(item => item.nilai > 0).length;
    
    return { 
      type: title.includes('Pendapatan') ? 'pendapatan' : 'belanja',
      totalBulanIni, 
      totalSemuaBulan,
      monthlyStats,
      distributionData,
      itemCount: rawData.length,
      zeroValueCount,
      positiveValueCount,
      uniqueSKPD: new Set(rawData.map(item => item.kode_skpd).filter(Boolean)).size
    };
  }, [data, selectedMonth, isMonthly, title, months]);

  // ==================== FUNGSI HANDLE DELETE ====================
  const handleDeleteMonth = async () => {
    if (!window.confirm(`Yakin ingin menghapus semua data ${title} bulan ${selectedMonth} tahun ${selectedYear}?\n\nData yang dihapus tidak dapat dikembalikan.`)) {
      return;
    }
    
    if (!onDeleteMonth) return;
    
    setLocalIsDeleting(true);
    setUploadProgress('🗑️ Menghapus data...');
    
    try {
      // Tentukan tipe data berdasarkan title
      let dataType = '';
      if (title.includes('Pendapatan')) {
        dataType = 'realisasiPendapatan';
      } else if (title.includes('Belanja')) {
        dataType = 'realisasi';
      } else if (title.includes('Non RKUD')) {
        dataType = 'realisasiNonRkud';
      } else {
        dataType = 'realisasi';
      }
      
      // Panggil fungsi delete dengan progress tracking
      const result = await onDeleteMonth(dataType, selectedMonth, setUploadProgress);
      
      if (result && result.success) {
        setUploadProgress(`✅ Berhasil menghapus ${result.deletedCount} data ${selectedMonth} ${selectedYear}`);
        setTimeout(() => setUploadProgress(''), 3000);
        
        logActivity('Hapus Data', { 
          dataType: title, 
          month: selectedMonth, 
          year: selectedYear, 
          status: 'Berhasil',
          deletedCount: result.deletedCount
        });
      } else {
        throw new Error('Gagal menghapus data');
      }
      
    } catch (error) {
      console.error('Error deleting data:', error);
      setError(`Gagal menghapus data: ${error.message}`);
      setUploadProgress('');
      
      logActivity('Hapus Data', { 
        dataType: title, 
        month: selectedMonth, 
        year: selectedYear, 
        status: 'Gagal', 
        error: error.message 
      });
    } finally {
      setLocalIsDeleting(false);
    }
  };

  // ==================== Render Component ====================
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (columnSelectorRef.current && !columnSelectorRef.current.contains(event.target)) {
        setIsColumnSelectorOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const handleToggleHeader = (header) => {
    setVisibleHeaders(prev => 
      prev.includes(header) 
        ? prev.filter(h => h !== header) 
        : [...prev, header]
    );
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
      const worksheet = window.XLSX.utils.json_to_sheet(dataToPreview);
      const workbook = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
      
      const fileName = `${title.replace(/ /g, '_')}_${isMonthly ? selectedMonth : ''}_${selectedYear}.xlsx`;
      window.XLSX.writeFile(workbook, fileName);
    } catch (err) {
      console.error("Error creating Excel file:", err);
      setError("Gagal membuat file Excel.");
    }
  };

  const handleButtonClick = () => { 
    fileInputRef.current.click(); 
  };

  // Warna untuk visualisasi
  const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6B7280'];

  // Gunakan isDeleting dari props atau local state
  const deletingState = isDeleting !== undefined ? isDeleting : localIsDeleting;

  return (
    <div className="space-y-6">
        <SectionTitle>{title} - Tahun Anggaran {selectedYear}</SectionTitle>
        
        {/* Executive Dashboard */}
        {summaryData && summaryData.itemCount > 0 && (
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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
                            <p className="text-xs text-gray-500 dark:text-gray-400">SKPD Unik</p>
                            <p className="text-xl font-bold text-rose-600 dark:text-rose-400">{summaryData.uniqueSKPD || 0}</p>
                        </div>
                    </div>
                    
                    {/* Additional Stats */}
                    {(summaryData.zeroValueCount > 0 || summaryData.positiveValueCount > 0) && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-amber-50/50 dark:bg-amber-900/20 rounded-xl p-3 border border-amber-200 dark:border-amber-800">
                                <p className="text-xs text-amber-600 dark:text-amber-400">Data dengan Nilai 0</p>
                                <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{summaryData.zeroValueCount.toLocaleString()}</p>
                                <p className="text-xs text-amber-500 dark:text-amber-500">(Estimasi/Apropriasi)</p>
                            </div>
                            <div className="bg-emerald-50/50 dark:bg-emerald-900/20 rounded-xl p-3 border border-emerald-200 dark:border-emerald-800">
                                <p className="text-xs text-emerald-600 dark:text-emerald-400">Data dengan Nilai Lebih Kecil Dari 0</p>
                                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{summaryData.positiveValueCount.toLocaleString()}</p>
                                <p className="text-xs text-emerald-500 dark:text-emerald-500">(Realisasi Aktual)</p>
                            </div>
                        </div>
                    )}
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
                                    const monthTotal = data[month]?.reduce((sum, item) => sum + (item.nilai || 0), 0) || 0;
                                    return (
                                        <div 
                                            key={month} 
                                            className={`flex items-center justify-between p-3 rounded-xl backdrop-blur-sm border cursor-pointer transition-all ${
                                                hasData 
                                                    ? 'bg-emerald-50/70 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100/70' 
                                                    : 'bg-amber-50/70 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 hover:bg-amber-100/70'
                                            } ${selectedMonth === month ? 'ring-2 ring-indigo-500 shadow-lg' : ''}`}
                                            onClick={() => setSelectedMonth(month)}
                                        >
                                            <div className="flex items-center gap-2">
                                                {hasData ? 
                                                    <CheckCircle2 className="text-emerald-500" size={18} /> : 
                                                    <AlertCircle className="text-amber-500" size={18} />
                                                }
                                                <span className={`text-sm font-medium ${
                                                    hasData 
                                                        ? 'text-emerald-700 dark:text-emerald-300' 
                                                        : 'text-amber-700 dark:text-amber-300'
                                                }`}>{month}</span>
                                            </div>
                                            {hasData && (
                                                <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                                                    {formatCurrency(monthTotal).split(',')[0]}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Chart Section */}
                            {summaryData.monthlyStats?.length > 0 && (
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-semibold text-gray-700 dark:text-gray-300">Tren Bulanan (dalam Miliar Rupiah)</h4>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setChartView('bar')}
                                                className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                                                    chartView === 'bar' 
                                                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400' 
                                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                                }`}
                                            >
                                                <BarChart3 size={14} className="inline mr-1" />
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
                                                <PieChart size={14} className="inline mr-1" />
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
                                                        formatter={(value, name, props) => {
                                                            const data = props.payload;
                                                            return [`${value.toFixed(2)} Miliar`, `${data.fullMonth}`];
                                                        }}
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
                                                    <Tooltip formatter={(value) => `${value.toFixed(2)} Miliar`} />
                                                </RePieChart>
                                            )}
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}

                            {/* Distribution Chart */}
                            {summaryData.distributionData?.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">Distribusi per SKPD (Top 10)</h4>
                                    <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-xl p-4">
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={summaryData.distributionData} layout="vertical" margin={{ left: 100 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
                                                <XAxis type="number" tickFormatter={(val) => `${val}M`} />
                                                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                                                <Tooltip formatter={(value) => `${value.toFixed(2)} Miliar`} />
                                                <Bar dataKey="value" fill="#8884d8" barSize={20}>
                                                    {summaryData.distributionData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Bar>
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
                    
                    {/* Filter Info untuk Pendapatan */}
                    {title.includes('Pendapatan') && (
                        <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                <Info size={12} />
                                Filter Otomatis: Hanya data dengan <strong className="font-mono">Nama Akun Utama = "PENDAPATAN DAERAH"</strong> yang akan diproses
                            </p>
                        </div>
                    )}

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
                                onClick={handleDeleteMonth}
                                disabled={isUploading || deletingState || !data[selectedMonth] || data[selectedMonth].length === 0}
                                className="p-2.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold rounded-xl shadow-lg transition-all disabled:opacity-50"
                                title={`Hapus Data ${selectedMonth}`}
                            >
                               {deletingState ? <Loader className="animate-spin" size={18}/> : <Trash2 size={18}/>}
                            </button>
                        )}
                    </div>
                    {userRole !== 'admin' && (
                        <div className="mt-4 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2">
                            <Shield size={14} className="text-amber-500" />
                            <p className="text-xs text-amber-600 dark:text-amber-400">Hanya Admin yang dapat mengunggah data.</p>
                        </div>
                    )}
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept=".csv, .xlsx, .xls" 
                        onChange={handleFileUpload}
                    />
                </div>
                
                {error && (
                    <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg flex items-start gap-2 text-left">
                        <AlertCircle size={16} className="text-rose-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
                    </div>
                )}
                
                {uploadProgress && (
                    <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2">
                        {uploadProgress.includes('Berhasil') ? 
                            <CheckCircle2 size={16} className="text-emerald-500" /> : 
                            <RefreshCw size={16} className="text-emerald-500 animate-spin" />
                        }
                        <p className="text-sm text-emerald-600 dark:text-emerald-400">{uploadProgress}</p>
                    </div>
                )}
                
                {/* Tips Section */}
                <div className="mt-4 p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <Info size={12} />
                        Tips: Pastikan file Excel memiliki kolom: 
                        {title.includes('Pendapatan') ? (
                            <strong>Kode SKPD, Nama SKPD, Kode Rekening, Nama Akun Utama (berisi "PENDAPATAN DAERAH"), dan Nilai Realisasi</strong>
                        ) : (
                            <strong>Kode SKPD, Nama SKPD, Kode Rekening, dan Nilai Realisasi</strong>
                        )}
                        Data dengan nilai 0 akan tetap diproses (untuk estimasi/apropriasi).
                    </p>
                </div>
            </div>

            {/* Data Preview Section */}
            <div className="mt-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-500" />
                        Pratinjau Data {isMonthly ? `- ${selectedMonth}` : ''}
                        {dataToPreview.length > 0 && (
                            <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                                ({dataToPreview.length} baris)
                            </span>
                        )}
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="px-3 py-2 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-white/70 dark:hover:bg-gray-700/70 transition-colors flex items-center gap-1"
                        >
                            <Filter size={16} />
                            <span className="text-sm">Filter</span>
                        </button>
                        
                        {isMonthly && dataToPreview.length > 0 && (
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
                                    {visibleHeaders.map(header => (
                                        <label key={header} className="flex items-center px-2 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                checked={visibleHeaders.includes(header)}
                                                onChange={() => handleToggleHeader(header)}
                                            />
                                            <span className="ml-3 truncate">{header}</span>
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

                {/* Search/Filter Info */}
                {showFilters && searchTerm && (
                    <div className="mb-3 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-xs text-indigo-600 dark:text-indigo-400">
                        Menampilkan {filteredData.length} dari {dataToPreview.length} data untuk pencarian "{searchTerm}"
                    </div>
                )}

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
                        {paginatedData.length > 0 ? (
                            paginatedData.map((item, index) => {
                                const isEven = index % 2 === 0;
                                return (
                                    <tr key={index} className={`${isEven ? 'bg-white/30 dark:bg-gray-800/30' : 'bg-transparent'} hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors`}>
                                        {visibleHeaders.map((header) => {
                                            let cellValue = item[header];
                                            
                                            // Format nilai mata uang
                                            if (header.includes('Nilai') && typeof cellValue === 'number') {
                                                cellValue = formatCurrency(cellValue);
                                            } else if (cellValue === undefined || cellValue === null) {
                                                cellValue = '-';
                                            }
                                            
                                            return (
                                                <td key={header} className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                    <span className={header.includes('Kode') ? 'font-mono text-xs' : ''}>
                                                        {cellValue}
                                                    </span>
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
                    Format: CSV, XLSX, XLS (max 50MB)
                </span>
                <span className="flex items-center gap-1">
                    <Info size={12} />
                    Nilai 0 = Data estimasi/apropriasi
                </span>
                {title.includes('Pendapatan') && (
                    <span className="flex items-center gap-1 text-blue-500">
                        <Filter size={12} />
                        Filter: Hanya PENDAPATAN DAERAH
                    </span>
                )}
            </div>
        </div>
    </div>
  );
};

export default DataUploadView;