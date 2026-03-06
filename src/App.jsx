import React from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import {
  Upload, DollarSign, ArrowDownCircle, Archive, LayoutDashboard,
  FileText, Calendar, Sparkles, Loader, TrendingUp, BarChartHorizontal,
  ChevronDown, BookCopy, Search, Sun, Moon, CheckCircle2, AlertCircle,
  Receipt, Globe, MinusCircle, Droplets, Settings, ArrowRightLeft,
  LogIn, LogOut, UserCircle, Trash2, UserPlus, ChevronsUpDown, Award,
  ChevronsLeft, ChevronsRight, PieChart as PieChartIcon, Building,
  Users, Briefcase, Shuffle, BookMarked, Columns, Edit, X, Tag,
  ChevronRight, Download, History, ChevronUp, BookOpen, Menu, HelpCircle
} from 'lucide-react';
import {
  collection, doc, onSnapshot, setDoc, getDocs,
  addDoc, deleteDoc, query, where, writeBatch, getDoc, updateDoc,
  orderBy
} from "firebase/firestore";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";

// Import dari firebase.js (konfigurasi terpusat)
import { db, auth } from './firebase';

// Import komponen yang sudah dipisah
import SectionTitle from './SectionTitle';
import Pagination from './Pagination';
import TabButton from './TabButton';
import ProgressCircle from './ProgressCircle';
import SelectInput from './SelectInput';
import AnalysisCard from './AnalysisCard';
import GeminiAnalysis from './GeminiAnalysis';
import { formatCurrency } from './formatCurrency';
import LoginView from './LoginView';
import DashboardView from './DashboardView';
import GuideView from './GuideView';
import { brandingConfig } from './assets/config/branding';

// ==================== IMPORT SEMUA VIEW ====================
import AnalisisKinerjaView from './AnalisisKinerjaView';
import AnalisisKualitasBelanjaView from './AnalisisKualitasBelanjaView';
import AnalisisLintasTahunView from './AnalisisLintasTahunView';
import AnalisisPotensiSiLPAView from './AnalisisPotensiSiLPAView';
import MandatorySpendingView from './MandatorySpendingView';
import LaporanTematikView from './LaporanTematikView';
import SumberDanaStatsView from './SumberDanaStatsView';
import SkpdBelanjaStatsView from './SkpdBelanjaStatsView';
import SkpdPendapatanStatsView from './SkpdPendapatanStatsView';
import SkpdRekeningStatsView from './SkpdRekeningStatsView';
import SkpdSubKegiatanStatsView from './SkpdSubKegiatanStatsView';
import PenandaanTematikView from './PenandaanTematikView';
import PengaturanView from './PengaturanView';
import DataUploadView from './DataUploadView';
import ReferensiAkunView from './ReferensiAkunView';
import PenandaanMandatoryView from './PenandaanMandatoryView';
import ReferensiPenandaanView from './ReferensiPenandaanView';
import ProsesPenandaanView from './ProsesPenandaanView';
import ActivityLogView from './ActivityLogView';

// --- Activity Logging Function ---
const logActivity = async (action, details = {}) => {
    try {
        const user = auth.currentUser;
        if (!user) return;

        await addDoc(collection(db, "logs"), {
            action: action,
            details: details,
            userEmail: user.email,
            userId: user.uid,
            timestamp: new Date(),
        });
    } catch (error) {
        console.error("Error logging activity:", error);
    }
};

// --- Main App Component ---
const App = () => {
  const [scriptsLoaded, setScriptsLoaded] = React.useState(false);
  const [loadError, setLoadError] = React.useState(null);
  const [isDashboardOpen, setIsDashboardOpen] = React.useState(true);
  const [isPenganggaranOpen, setIsPenganggaranOpen] = React.useState(true);
  const [isPenatausahaanOpen, setIsPenatausahaanOpen] = React.useState(true);
  const [isReferensiOpen, setIsReferensiOpen] = React.useState(true);
  const [theme, setTheme] = React.useState('light');
  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear());
  const [appData, setAppData] = React.useState({
      anggaran: [],
      pendapatan: [],
      penerimaanPembiayaan: [],
      pengeluaranPembiayaan: [],
      realisasi: {},
      realisasiPendapatan: {},
      realisasiNonRkud: {},
  });
  const [isAuthLoading, setIsAuthLoading] = React.useState(true);
  const [user, setUser] = React.useState(null);
  const [userRole, setUserRole] = React.useState('guest');
  const [isSidebarMinimized, setIsSidebarMinimized] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [namaPemda, setNamaPemda] = React.useState('');
  const [lastUpdate, setLastUpdate] = React.useState(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [searchMenuTerm, setSearchMenuTerm] = React.useState('');
  const [activeView, setActiveView] = React.useState('dashboard');

  React.useEffect(() => {
    const loadScript = (src) => {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
              resolve();
              return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Gagal memuat skrip: ${src}`));
            document.body.appendChild(script);
        });
    };

    const loadScriptsAndAuth = async () => {
        try {
            await Promise.all([
                loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'),
                loadScript('https://cdn.jsdelivr.net/npm/papaparse@5.3.2/papaparse.min.js')
            ]);
            setScriptsLoaded(true);
            
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
          setIsAuthLoading(true);
          if(currentUser) {
                    const userDocRef = doc(db, "users", currentUser.uid);
                    const userDocSnap = await getDoc(userDocRef);
                    if (userDocSnap.exists()) {
                        const role = userDocSnap.data().role;
                        if (role === 'admin' || role === 'editor' || role === 'viewer') {
                            setUserRole(role);
                        } else {
                            setUserRole('guest');
                        }
                    } else {
                        setUserRole('guest');
                    }
                    setUser(currentUser);
                } else {
                    setUser(null);
                    setUserRole('guest');
                }
                setIsAuthLoading(false);
            });
            return () => unsubscribe();
        } catch(error) {
             console.error(error);
             setLoadError(error.message);
             setIsAuthLoading(false);
        }
    }
    
    loadScriptsAndAuth();

  }, []);
  
  React.useEffect(() => {
      if (isAuthLoading || !user) {
          setAppData({
            anggaran: [],
            pendapatan: [],
            penerimaanPembiayaan: [],
            pengeluaranPembiayaan: [],
            realisasi: {},
            realisasiPendapatan: {},
            realisasiNonRkud: {},
          });
          return;
      }
      
      const dataTypes = ['anggaran', 'pendapatan', 'penerimaanPembiayaan', 'pengeluaranPembiayaan', 'realisasi', 'realisasiPendapatan', 'realisasiNonRkud'];
      
      const unsubscribes = dataTypes.map(dataType => {
          const collRef = collection(db, "publicData", String(selectedYear), dataType);
          return onSnapshot(query(collRef), (snapshot) => {
              let data = [];
              snapshot.forEach(doc => {
                  data = [...data, ...doc.data().data];
              });
              
              if (dataType === 'realisasi' || dataType === 'realisasiPendapatan' || dataType === 'realisasiNonRkud') {
                   const monthlyData = data.reduce((acc, item) => {
                      const month = item.month || 'Lainnya';
                      if (!acc[month]) {
                          acc[month] = [];
                      }
                      acc[month].push(item);
                      return acc;
                  }, {});
                  setAppData(prev => ({...prev, [dataType]: monthlyData }));
              } else {
                  setAppData(prev => ({...prev, [dataType]: data }));
              }
          }, (error) => {
              console.error(`Error fetching ${dataType}:`, error);
          });
      });
      
      const settingsDocRef = doc(db, "publicSettings", "settings");
      const unsubSettings = onSnapshot(settingsDocRef, (docSnap) => {
          if (docSnap.exists()) {
              const settings = docSnap.data();
              setTheme(settings.theme || 'light');
              setNamaPemda(settings.namaPemda || '');
          }
      });

      const metadataRef = doc(db, "publicData", String(selectedYear), "metadata", "lastUpdate");
      const unsubMetadata = onSnapshot(metadataRef, (docSnap) => {
          if (docSnap.exists()) {
              setLastUpdate(docSnap.data().timestamp.toDate());
          } else {
              setLastUpdate(null);
          }
      });

      return () => {
          unsubscribes.forEach(unsub => unsub());
          unsubSettings();
          unsubMetadata();
      };
  }, [user, selectedYear, isAuthLoading]);

  React.useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  React.useEffect(() => {
    // Handle window resize untuk reset mobile menu
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const saveSettings = async (settings) => {
      if (userRole !== 'admin') return;
      const settingsDocRef = doc(db, "publicSettings", "settings");
      try {
        await setDoc(settingsDocRef, settings, { merge: true });
      } catch (e) {
        console.error("Error saving settings:", e);
        throw e; 
      }
  };

  const toggleTheme = () => {
      const newTheme = theme === 'light' ? 'dark' : 'light';
      setTheme(newTheme);
      saveSettings({ theme: newTheme });
  };
  
  const handleYearChange = (year) => {
      setSelectedYear(year);
      setActiveView('dashboard');
  };

  const handleLogout = async () => {
      try {
          await signOut(auth);
      } catch (error) {
          console.error("Logout error:", error);
      }
  };

  const { anggaran, pendapatan, penerimaanPembiayaan, pengeluaranPembiayaan, realisasi, realisasiPendapatan, realisasiNonRkud } = appData;
  const allData = { anggaran, pendapatan, penerimaanPembiayaan, pengeluaranPembiayaan, realisasi, realisasiPendapatan, realisasiNonRkud };
  
  const dataStatus = {
      anggaran: appData.anggaran && appData.anggaran.length > 0,
      pendapatan: appData.pendapatan && appData.pendapatan.length > 0,
      penerimaanPembiayaan: appData.penerimaanPembiayaan && appData.penerimaanPembiayaan.length > 0,
      pengeluaranPembiayaan: appData.pengeluaranPembiayaan && appData.pengeluaranPembiayaan.length > 0,
      realisasi: appData.realisasi && Object.keys(appData.realisasi).length > 0,
      realisasiPendapatan: appData.realisasiPendapatan && Object.keys(appData.realisasiPendapatan).length > 0,
      realisasiNonRkud: appData.realisasiNonRkud && Object.keys(appData.realisasiNonRkud).length > 0,
  };

  const menuDescriptions = {
    'dashboard': 'Menampilkan ringkasan visual APBD, termasuk total pendapatan, belanja, dan pembiayaan.',
    'analisis-kualitas-belanja': 'Menganalisis komposisi belanja berdasarkan jenisnya (modal, pegawai, barang/jasa) untuk menilai kualitas alokasi anggaran.',
    'mandatory-spending': 'Menganalisis pemenuhan alokasi belanja wajib, seperti porsi belanja pegawai terhadap total APBD.',
    'analisis-potensi-silpa': 'Memproyeksikan potensi Sisa Lebih Perhitungan Anggaran (SiLPA) di akhir tahun berdasarkan realisasi bulanan.',
    'analisis-lintas-tahun': 'Membandingkan data APBD antara dua tahun anggaran yang berbeda untuk melihat tren dan perubahan kinerja.',
    'analisis-kinerja': 'Membandingkan kinerja penyerapan anggaran atau pencapaian pendapatan antar SKPD dalam dua tahun berbeda.',
    'skpd-stats': 'Menampilkan statistik perbandingan antara pagu anggaran dan realisasi belanja untuk setiap SKPD.',
    'skpd-pendapatan-stats': 'Menampilkan statistik perbandingan antara target dan realisasi pendapatan untuk setiap SKPD.',
    'sumber-dana-stats': 'Merinci komposisi sumber pendanaan yang digunakan oleh masing-masing SKPD.',
    'skpd-rekening-stats': 'Merinci pagu anggaran dan realisasi belanja hingga ke level rekening untuk setiap SKPD.',
    'skpd-subkegiatan-stats': 'Merinci pagu anggaran dan realisasi belanja hingga ke level sub kegiatan beserta rincian rekening di dalamnya.',
    'panduan': 'Panduan penggunaan aplikasi SIMONALISA.'
  };
  
const menuItems = [
    { 
      id: 'dashboard-group', 
      label: 'Dashboard', 
      icon: LayoutDashboard,
      subMenus: [
          { id: 'dashboard', label: 'Dashboard Utama', icon: LayoutDashboard },
          { id: 'analisis-kualitas-belanja', label: 'Analisis Belanja', icon: PieChartIcon },
          { id: 'mandatory-spending', label: 'Mandatory Spending', icon: Building },
          { id: 'laporan-tematik', label: 'Laporan Tematik', icon: BookCopy },
          { id: 'analisis-potensi-silpa', label: 'Analisis Potensi SiLPA', icon: Shuffle },
          { id: 'analisis-lintas-tahun', label: 'Analisis Lintas Tahun', icon: ArrowRightLeft },
          { id: 'analisis-kinerja', label: 'Analisis Kinerja', icon: Award },
          { id: 'skpd-stats', label: 'Statistik Belanja', icon: BarChartHorizontal },
          { id: 'skpd-pendapatan-stats', label: 'Statistik Pendapatan', icon: TrendingUp },
          { id: 'sumber-dana-stats', label: 'Statistik Sumber Dana', icon: Droplets },
          { id: 'skpd-rekening-stats', label: 'Statistik Rekening', icon: FileText },
          { id: 'skpd-subkegiatan-stats', label: 'Statistik Sub Kegiatan', icon: FileText },
          { id: 'panduan', label: 'Panduan', icon: BookOpen, requiredRole: ['admin', 'editor', 'viewer'] }
      ]
    },
    {
      id: 'referensi-group',
      label: 'Referensi',
      icon: BookMarked,
      requiredRole: ['admin', 'editor', 'viewer'],
      subMenus: [
        { id: 'referensi-akun', label: 'Akun Kode Rekening', icon: FileText },
        { id: 'penandaan-mandatory', label: 'Penandaan Mandatory', icon: BookCopy },
        { id: 'penandaan-tematik', label: 'Penandaan Tematik', icon: Tag },
        { id: 'referensi-penandaan', label: 'Penandaan Anggaran', icon: Briefcase },
        { id: 'proses-penandaan', label: 'Proses Penandaan', icon: Tag },
      ]
    },
    { 
        id: 'penganggaran-group',
        label: 'Penganggaran',
        icon: Archive,
        requiredRole: ['admin', 'editor'],
        subMenus: [
            { id: 'anggaran', label: 'Anggaran', icon: Archive, statusKey: 'anggaran' },
            { id: 'pendapatan', label: 'Target Pendapatan', icon: DollarSign, statusKey: 'pendapatan' },
            { id: 'penerimaanPembiayaan', label: 'Penerimaan Pembiayaan', icon: Globe, statusKey: 'penerimaanPembiayaan' },
            { id: 'pengeluaranPembiayaan', label: 'Pengeluaran Pembiayaan', icon: MinusCircle, statusKey: 'pengeluaranPembiayaan' },
        ]
    },
    { 
        id: 'penatausahaan-group',
        label: 'Penatausahaan',
        icon: BookCopy,
        requiredRole: ['admin', 'editor'],
        subMenus: [
            { id: 'realisasi', label: 'Realisasi Belanja', icon: ArrowDownCircle, statusKey: 'realisasi' },
            { id: 'realisasiPendapatan', label: 'Realisasi Pendapatan', icon: TrendingUp, statusKey: 'realisasiPendapatan' },
            { id: 'realisasiNonRkud', label: 'Realisasi Non RKUD', icon: Shuffle, statusKey: 'realisasiNonRkud' },
        ]
    },
    {
        id: 'pengaturan',
        label: 'Pengaturan',
        icon: Settings,
    },
    {
        id: 'activity-log',
        label: 'Log Aktivitas',
        icon: History,
        requiredRole: ['admin']
    }
  ];

  // Filter menu berdasarkan pencarian
  const filteredMenuItems = React.useMemo(() => {
    if (!searchMenuTerm) return menuItems;
    
    return menuItems.map(item => {
      if (item.subMenus) {
        const filteredSubMenus = item.subMenus.filter(sub => 
          sub.label.toLowerCase().includes(searchMenuTerm.toLowerCase())
        );
        if (filteredSubMenus.length > 0) {
          return { ...item, subMenus: filteredSubMenus };
        }
      }
      if (item.label.toLowerCase().includes(searchMenuTerm.toLowerCase())) {
        return item;
      }
      return null;
    }).filter(Boolean);
  }, [searchMenuTerm]);

  const ANGGARAN_MAPPING = {
      NamaSKPD: ['Nama SKPD'],
      NamaSubUnit: ['Nama Sub Unit'],
      KodeBidangUrusan: ['Kode Bidang Urusan'],
      KodeKegiatan: ['Kode Kegiatan'],
      NamaKegiatan: ['Nama Kegiatan'],
      KodeSubKegiatan: ['Kode Sub Kegiatan'],
      NamaSubKegiatan: ['Nama Sub Kegiatan'],
      NamaSumberDana: ['Nama Sumber Dana'],
      KodeRekening: ['Kode Rekening'],
      NamaRekening: ['Nama Rekening'],
      NamaPaketKelompok: ['Nama Paket Kelompok'],
      Pagu: ['Pagu']
  };
  const ANGGARAN_PREVIEW_HEADERS = ['Nama SKPD', 'Nama Sub Unit', 'Kode Bidang Urusan', 'Kode Kegiatan', 'Nama Kegiatan', 'Kode Sub Kegiatan', 'Nama Sub Kegiatan', 'Nama Sumber Dana', 'Kode Rekening', 'Nama Rekening', 'Nama Paket Kelompok', 'Pagu'];
  const ANGGARAN_GROUPED_COLUMNS = ['Nama SKPD', 'Nama Sub Unit', 'Kode Bidang Urusan', 'Kode Kegiatan', 'Nama Kegiatan', 'Kode Sub Kegiatan', 'Nama Sub Kegiatan'];
  const ANGGARAN_INSTRUCTION = "Aplikasi akan mencari kolom: 'Nama SKPD', 'Nama Sub Unit', 'Kode Bidang Urusan', 'Kode Kegiatan', 'Nama Kegiatan', 'Kode Sub Kegiatan', 'Nama Sub Kegiatan', 'Nama Sumber Dana', 'Kode Rekening', 'Nama Rekening', 'Nama Paket Kelompok', dan 'Pagu'.";
  
  const PENDAPATAN_MAPPING = {
      NamaOPD: ['Nama OPD'],
      NamaAkun: ['nama akun'],
      Pagu: ['Pagu', 'Anggaran']
  };
  const PENDAPATAN_PREVIEW_HEADERS = ['Nama OPD', 'Nama Akun', 'Pagu'];
  const PENDAPATAN_GROUPED_COLUMNS = ['Nama OPD'];
  const PENDAPATAN_INSTRUCTION = "Aplikasi akan mencari kolom: 'Nama OPD', 'nama akun', dan 'Pagu'/'Anggaran'. Data yang diunggah akan ditambahkan ke data yang sudah ada.";

  const PEMBIAYAAN_MAPPING = {
      NamaOPD: ['Nama OPD'],
      Keterangan: ['Keterangan', 'Uraian'],
      Pagu: ['Pagu', 'Anggaran']
  };
  const PEMBIAYAAN_PREVIEW_HEADERS = ['Nama OPD', 'Keterangan', 'Pagu'];
  const PEMBIAYAAN_GROUPED_COLUMNS = ['Nama OPD'];
  const PEMBIAYAAN_INSTRUCTION = "Aplikasi akan mencari kolom: 'Nama OPD', 'Keterangan'/'Uraian', dan 'Pagu'/'Anggaran'. Data yang diunggah akan ditambahkan ke data yang sudah ada.";
  
  const REALISASI_BELANJA_MAPPING = {
      NamaSKPD: ['Nama SKPD'],
      NamaSubSKPD: ['Nama Sub SKPD'],
      KodeKegiatan: ['Kode Kegiatan'],
      NamaKegiatan: ['Nama Kegiatan'],
      KodeSubKegiatan: ['Kode Sub Kegiatan'],
      NamaSubKegiatan: ['Nama Sub Kegiatan'],
      KodeRekening: ['Kode Rekening', 'koderek'],
      NamaRekening: ['Nama Rekening'],
      KeteranganDokumen: ['Keterangan Dokumen'],
      NomorSP2D: ['Nomor SP2D'],
      NilaiRealisasi: ['Nilai Realisasi']
  };
  const REALISASI_BELANJA_PREVIEW_HEADERS = ['Nama SKPD', 'Nama Sub SKPD', 'Kode Kegiatan', 'Nama Kegiatan', 'Kode Sub Kegiatan', 'Nama Sub Kegiatan', 'Kode Rekening', 'Nama Rekening', 'Keterangan Dokumen', 'Nomor SP2D', 'Nilai Realisasi'];
  const REALISASI_BELANJA_GROUPED_COLUMNS = ['Nama SKPD', 'Nama Sub SKPD', 'Kode Kegiatan', 'Nama Kegiatan', 'Kode Sub Kegiatan', 'Nama Sub Kegiatan', 'Nama Rekening'];
  const REALISASI_BELANJA_INSTRUCTION = "Aplikasi akan mencari kolom: 'Nama SKPD', 'Nama Sub SKPD', 'Kode Kegiatan', 'Nama Kegiatan', 'Kode Sub Kegiatan', 'Nama Sub Kegiatan', 'Kode Rekening', 'Nama Rekening', 'Keterangan Dokumen', 'Nomor SP2D', dan 'Nilai Realisasi'.";
  
  const REALISASI_PENDAPATAN_MAPPING = {
      SKPD: ['namaskpd'],
      Keterangan: ['keterangan'],
      NamaRekening: ['namaakunsubrinci'],
      NilaiRealisasi: ['nilaikredit']
  };
  const REALISASI_PENDAPATAN_PREVIEW_HEADERS = ['SKPD', 'Keterangan', 'Nama Rekening', 'Nilai Realisasi'];
  const REALISASI_PENDAPATAN_GROUPED_COLUMNS = ['SKPD'];
  const REALISASI_PENDAPATAN_INSTRUCTION = "Ambil Data Dari SIPD AKLAP (Data Jurnal). Pastikan Kolom Excel Debet Kredit Di Cleansing. Realisasi Pendapatan diambil dari Kolom Kredit.";
  const REALISASI_PENDAPATAN_FILTER = { column: 'namaakunutama', value: 'PENDAPATAN DAERAH' };
  
  const REALISASI_NON_RKUD_MAPPING = {
    NAMASKPD: ['namaskpd', 'nama skpd', 'NAMA SKPD'],
    NAMASUBSKPD: ['namaunitskpd', 'nama sub skpd', 'NAMA SUB SKPD'],
    NAMAKEGIATAN: ['namakegiatan', 'nama kegiatan', 'NAMA KEGIATAN'],
    NAMASUBKEGIATAN: ['namasubkegiatan', 'nama sub kegiatan', 'NAMA SUB KEGIATAN'],
    NAMAREKENING: ['namaakunsubrinci', 'nama rekening', 'NAMA REKENING'],
    NILAIREALISASI: ['nilaidebet', 'nilai realisasi', 'NILAI REALISASI'],
    KETERANGANDOKUMEN: ['keterangan', 'keterangan dokumen', 'KETERANGAN DOKUMEN'],
    KODEREKENING: ['koderekening', 'kode rekening', 'KODE REKENING', 'kodeakunsubrinci'],
    KODESUBKEGIATAN: ['kodesubkegiatan', 'kode sub kegiatan', 'KODE SUB KEGIATAN'],
  };
  const REALISASI_NON_RKUD_PREVIEW_HEADERS = ['NAMA SKPD', 'NAMA SUB SKPD', 'NAMA KEGIATAN', 'NAMA SUB KEGIATAN', 'NAMA REKENING', 'NILAI REALISASI'];
  const REALISASI_NON_RKUD_GROUPED_COLUMNS = ['NAMA SKPD', 'NAMA SUB SKPD', 'NAMA KEGIATAN', 'NAMA SUB KEGIATAN'];
  const REALISASI_NON_RKUD_INSTRUCTION = "Ambil Data Dari SIPD AKLAP (Data Jurnal). Sesuaikan isi data sesuai format. Pastikan semua pencairan melalui Non RKUD. (BOK, BOS, BOSP, TPG, Tamsil, BLUD).";
  const REALISASI_NON_RKUD_FILTER = null;
  
  if (loadError) {
    return <div className="h-screen w-screen flex items-center justify-center bg-red-100 text-red-700 p-4">Error: {loadError}</div>;
  }

  if (isAuthLoading || !scriptsLoaded) {
    return <div className="h-screen w-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900"><div className="text-lg font-medium text-gray-600 dark:text-gray-300">Memuat aplikasi...</div></div>;
  }
  
  if (!user) {
      return <LoginView theme={theme} />;
  }
  
  const handleUpload = async (parsedData, month, setProgress) => {
      if (userRole !== 'admin') {
          throw new Error("Anda tidak memiliki izin untuk mengunggah data.");
      }
      
      const CHUNK_SIZE = 400;
      const collectionName = activeView;
      const collectionRef = collection(db, "publicData", String(selectedYear), collectionName);

      setProgress('Menghapus data lama...');
      const oldDocsQuery = query(collectionRef, where("month", "==", month || 'annual'));
      const oldDocsSnapshot = await getDocs(oldDocsQuery);
      const deleteBatch = writeBatch(db);
      oldDocsSnapshot.forEach(doc => deleteBatch.delete(doc.ref));
      await deleteBatch.commit();

      const chunks = [];
      for (let i = 0; i < parsedData.length; i += CHUNK_SIZE) {
          chunks.push(parsedData.slice(i, i + CHUNK_SIZE));
      }

      setProgress(`Membagi data menjadi ${chunks.length} bagian...`);

      for (let i = 0; i < chunks.length; i++) {
          setProgress(`Mengunggah bagian ${i + 1} dari ${chunks.length}...`);
          const chunk = chunks[i];
          const docPayload = {
              month: month || 'annual',
              data: chunk,
          };
          await addDoc(collectionRef, docPayload);
      }

      if (collectionName === 'realisasi' || collectionName === 'realisasiPendapatan') {
        const metadataRef = doc(db, "publicData", String(selectedYear), "metadata", "lastUpdate");
        await setDoc(metadataRef, {
            timestamp: new Date(),
            updatedBy: auth.currentUser.email
        });
      }
  };

  const handleDeleteMonthlyData = async (collectionName, month, setProgress) => {
    if (userRole !== 'admin') {
      setProgress('Error: Anda tidak memiliki izin untuk menghapus data.');
      setTimeout(() => setProgress(''), 5000);
      return;
    }
    if (!window.confirm(`APAKAH ANDA YAKIN? Tindakan ini akan menghapus semua data ${collectionName.replace(/([A-Z])/g, ' $1')} untuk bulan ${month} pada tahun ${selectedYear}. Tindakan ini tidak dapat diurungkan.`)) {
      return;
    }

    setIsDeleting(true);
    setProgress('Mempersiapkan penghapusan data...');

    try {
      const BATCH_SIZE = 400;
      const collectionRef = collection(db, "publicData", String(selectedYear), collectionName);
      const oldDocsQuery = query(collectionRef, where("month", "==", month));
      const oldDocsSnapshot = await getDocs(oldDocsQuery);
      
      if (oldDocsSnapshot.empty) {
        setProgress('Tidak ada data untuk dihapus pada bulan ini.');
        setTimeout(() => setProgress(''), 3000);
        setIsDeleting(false);
        return;
      }

      const deleteBatches = [];
      let currentBatch = writeBatch(db);
      let currentBatchSize = 0;

      oldDocsSnapshot.forEach((doc) => {
        currentBatch.delete(doc.ref);
        currentBatchSize++;
        if (currentBatchSize >= BATCH_SIZE) {
          deleteBatches.push(currentBatch);
          currentBatch = writeBatch(db);
          currentBatchSize = 0;
        }
      });

      if (currentBatchSize > 0) {
        deleteBatches.push(currentBatch);
      }

      for (let i = 0; i < deleteBatches.length; i++) {
        setProgress(`Menghapus data bulan ${month} (batch ${i + 1} dari ${deleteBatches.length})...`);
        await deleteBatches[i].commit();
      }
      
      setProgress(`Data untuk bulan ${month} berhasil dihapus.`);
      await logActivity('Hapus Data Bulanan', { dataType: collectionName, month: month, status: 'Berhasil' });

    } catch (err) {
      console.error("Error deleting monthly data:", err);
      setProgress(`Gagal menghapus data: ${err.message}`);
      await logActivity('Hapus Data Bulanan', { dataType: collectionName, month: month, status: 'Gagal', error: err.message });
    } finally {
      setIsDeleting(false);
      setTimeout(() => setProgress(''), 5000);
    }
  };

  const handleReferensiUpload = async (parsedData, dataType, setProgress) => {
    if (userRole !== 'admin') {
        throw new Error("Anda tidak memiliki izin untuk mengunggah data referensi.");
    }
    
    const CHUNK_SIZE = 400;
    const dataRef = collection(db, "publicData", String(selectedYear), `referensi-${dataType}`);

    setProgress('Menghapus data referensi lama...');
    const oldDocsSnapshot = await getDocs(dataRef);
    const deleteBatch = writeBatch(db);
    oldDocsSnapshot.forEach(doc => deleteBatch.delete(doc.ref));
    await deleteBatch.commit();

    const chunks = [];
    for (let i = 0; i < parsedData.length; i += CHUNK_SIZE) {
        chunks.push(parsedData.slice(i, i + CHUNK_SIZE));
    }

    setProgress(`Membagi data menjadi ${chunks.length} bagian...`);

    for (let i = 0; i < chunks.length; i++) {
        setProgress(`Mengunggah bagian ${i + 1} dari ${chunks.length}...`);
        const chunk = chunks[i];
        await addDoc(dataRef, { rows: chunk });
    }
  };
  
  const getAnggaranAnalysisPrompt = (period, data, customQuery) => {
      if (customQuery) {
          return `Berdasarkan data anggaran yang tersedia, berikan analisis untuk permintaan berikut: "${customQuery}"`;
      }
      const totalPagu = data.reduce((sum, item) => sum + item.nilai, 0);
      const skpdMap = new Map();
      data.forEach(item => {
          const skpd = item.NamaSKPD || 'Tanpa SKPD';
          skpdMap.set(skpd, (skpdMap.get(skpd) || 0) + item.nilai);
      });
      const topSkpd = Array.from(skpdMap, ([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 5);
      
      return `
        Analisis Data Anggaran untuk tahun ${selectedYear}. Total pagu anggaran adalah ${formatCurrency(totalPagu)}.
        Berikut adalah 5 SKPD dengan alokasi anggaran terbesar:
        ${topSkpd.map(s => `- **${s.name}**: ${formatCurrency(s.value)}`).join('\n')}
        
        Berikan analisis mengenai:
        1.  Fokus alokasi anggaran berdasarkan data SKPD teratas.
        2.  Potensi efisiensi atau area yang memerlukan perhatian lebih.
        3.  Rekomendasi strategis terkait perencanaan anggaran ke depan.
      `;
  };

  const getPendapatanAnalysisPrompt = (period, data, customQuery) => {
      if (customQuery) {
          return `Berdasarkan data target pendapatan yang tersedia, berikan analisis untuk permintaan berikut: "${customQuery}"`;
      }
      const totalTarget = data.reduce((sum, item) => sum + item.nilai, 0);
      const opdMap = new Map();
      data.forEach(item => {
          const opd = item.NamaOPD || 'Tanpa OPD';
          opdMap.set(opd, (opdMap.get(opd) || 0) + item.nilai);
      });
      const topOpd = Array.from(opdMap, ([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 5);

      return `
        Analisis Target Pendapatan untuk tahun ${selectedYear}. Total target adalah ${formatCurrency(totalTarget)}.
        Berikut adalah 5 OPD dengan target pendapatan terbesar:
        ${topOpd.map(s => `- **${s.name}**: ${formatCurrency(s.value)}`).join('\n')}
        
        Berikan analisis mengenai:
        1.  Sumber utama target pendapatan daerah.
        2.  Potensi risiko jika terlalu bergantung pada OPD tertentu.
        3.  Rekomendasi untuk diversifikasi atau intensifikasi sumber pendapatan.
      `;
  };
  
  const getPembiayaanAnalysisPrompt = (title, period, data, customQuery) => {
      if (customQuery) {
          return `Berdasarkan data ${title} yang tersedia, berikan analisis untuk permintaan berikut: "${customQuery}"`;
      }
      const totalNilai = data.reduce((sum, item) => sum + item.nilai, 0);
      const sumberMap = new Map();
      data.forEach(item => {
          const sumber = item.Keterangan || 'Lain-lain';
          sumberMap.set(sumber, (sumberMap.get(sumber) || 0) + item.nilai);
      });
      const topSumber = Array.from(sumberMap, ([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 5);

      return `
        Analisis ${title} untuk tahun ${selectedYear}. Total nilai adalah ${formatCurrency(totalNilai)}.
        Berikut adalah 5 sumber/tujuan utama:
        ${topSumber.map(s => `- **${s.name}**: ${formatCurrency(s.value)}`).join('\n')}
        
        Berikan analisis mengenai struktur pembiayaan ini dan implikasinya terhadap kesehatan fiskal daerah.
      `;
  };

  const getRealisasiBelanjaAnalysisPrompt = (month, data, customQuery) => {
      if (customQuery) {
          return `Berdasarkan data realisasi belanja bulan ${month} yang tersedia, berikan analisis untuk permintaan berikut: "${customQuery}"`;
      }
      const totalRealisasiBulan = data.reduce((sum, item) => sum + item.nilai, 0);
      const totalAnggaranTahunan = allData.anggaran.reduce((sum, item) => sum + item.nilai, 0);
      const persentaseBulanIni = totalAnggaranTahunan > 0 ? (totalRealisasiBulan / totalAnggaranTahunan) * 100 : 0;
      
      return `
        Analisis Realisasi Belanja untuk bulan **${month}** tahun ${selectedYear}.
        - Total realisasi bulan ini: **${formatCurrency(totalRealisasiBulan)}**.
        - Ini setara dengan **${persentaseBulanIni.toFixed(2)}%** dari total anggaran belanja tahunan.
        
        Berikan analisis mengenai:
        1.  Tingkat penyerapan anggaran pada bulan ini (apakah cepat, lambat, atau normal).
        2.  Identifikasi kemungkinan pola belanja berdasarkan data (misalnya, belanja modal, belanja pegawai).
        3.  Rekomendasi untuk menjaga ritme penyerapan anggaran yang sehat.
      `;
  };
  
  const getRealisasiPendapatanAnalysisPrompt = (month, data, customQuery) => {
      if (customQuery) {
          return `Berdasarkan data realisasi pendapatan bulan ${month} yang tersedia, berikan analisis untuk permintaan berikut: "${customQuery}"`;
      }
      const totalRealisasiBulan = data.reduce((sum, item) => sum + item.nilai, 0);
      const totalTargetTahunan = allData.pendapatan.reduce((sum, item) => sum + item.nilai, 0);
      const persentaseBulanIni = totalTargetTahunan > 0 ? (totalRealisasiBulan / totalTargetTahunan) * 100 : 0;

      return `
        Analisis Realisasi Pendapatan untuk bulan **${month}** tahun ${selectedYear}.
        - Total realisasi pendapatan bulan ini: **${formatCurrency(totalRealisasiBulan)}**.
        - Ini setara dengan **${persentaseBulanIni.toFixed(2)}%** dari total target pendapatan tahunan.
        
        Berikan analisis mengenai:
        1.  Kinerja pencapaian target pendapatan pada bulan ini.
        2.  Identifikasi sumber pendapatan yang mungkin menjadi kontributor utama.
        3.  Rekomendasi untuk optimalisasi penerimaan di bulan-bulan berikutnya.
      `;
  };

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <DashboardView data={allData} theme={theme} selectedYear={selectedYear} namaPemda={namaPemda} lastUpdate={lastUpdate} userRole={userRole} />;
      case 'analisis-kualitas-belanja': return <AnalisisKualitasBelanjaView data={allData} theme={theme} selectedYear={selectedYear} userRole={userRole} />;
      case 'mandatory-spending': return <MandatorySpendingView data={allData} theme={theme} namaPemda={namaPemda} selectedYear={selectedYear} userRole={userRole} />;
      case 'laporan-tematik': return <LaporanTematikView data={allData} theme={theme} namaPemda={namaPemda} selectedYear={selectedYear} userRole={userRole} />;
      case 'analisis-kinerja': return <AnalisisKinerjaView data={allData} theme={theme} user={user} selectedYear={selectedYear} namaPemda={namaPemda} userRole={userRole} />;
      case 'sumber-dana-stats': return <SumberDanaStatsView data={allData} theme={theme} namaPemda={namaPemda} userRole={userRole} />;
      case 'analisis-potensi-silpa': return <AnalisisPotensiSiLPAView data={allData} theme={theme} selectedYear={selectedYear} userRole={userRole} />;
      case 'skpd-stats': return <SkpdBelanjaStatsView data={allData} theme={theme} namaPemda={namaPemda} userRole={userRole} />;
      case 'skpd-pendapatan-stats': return <SkpdPendapatanStatsView data={allData} theme={theme} namaPemda={namaPemda} userRole={userRole} />;
      case 'analisis-lintas-tahun': return <AnalisisLintasTahunView theme={theme} user={user} selectedYear={selectedYear} namaPemda={namaPemda} />;
      case 'skpd-rekening-stats': return <SkpdRekeningStatsView data={allData} theme={theme} namaPemda={namaPemda} userRole={userRole} />;
      case 'skpd-subkegiatan-stats': return <SkpdSubKegiatanStatsView data={allData} theme={theme} namaPemda={namaPemda} userRole={userRole} />;
      case 'referensi-akun': return <ReferensiAkunView theme={theme} userRole={userRole} selectedYear={selectedYear} onUpload={handleReferensiUpload} />;
      case 'penandaan-mandatory': return <PenandaanMandatoryView theme={theme} userRole={userRole} selectedYear={selectedYear} onUpload={handleReferensiUpload} />;
      case 'penandaan-tematik': return <PenandaanTematikView theme={theme} userRole={userRole} selectedYear={selectedYear} onUpload={handleReferensiUpload} />;
      case 'referensi-penandaan': return <ReferensiPenandaanView userRole={userRole} selectedYear={selectedYear} />;
      case 'pengaturan': return <PengaturanView selectedYear={selectedYear} onYearChange={handleYearChange} theme={theme} userRole={userRole} saveSettings={saveSettings} namaPemda={namaPemda} />;
      case 'anggaran': return <DataUploadView title="Unggah Data Anggaran" data={anggaran} onUpload={handleUpload} instruction={ANGGARAN_INSTRUCTION} columnMapping={ANGGARAN_MAPPING} previewHeaders={ANGGARAN_PREVIEW_HEADERS} groupedColumns={ANGGARAN_GROUPED_COLUMNS} theme={theme} selectedYear={selectedYear} userRole={userRole} getAnalysisPrompt={getAnggaranAnalysisPrompt} namaPemda={namaPemda} />;
      case 'pendapatan': return <DataUploadView title="Unggah Data Target Pendapatan" data={pendapatan} onUpload={handleUpload} instruction={PENDAPATAN_INSTRUCTION} columnMapping={PENDAPATAN_MAPPING} previewHeaders={PENDAPATAN_PREVIEW_HEADERS} groupedColumns={PENDAPATAN_GROUPED_COLUMNS} theme={theme} selectedYear={selectedYear} userRole={userRole} getAnalysisPrompt={getPendapatanAnalysisPrompt} namaPemda={namaPemda} />;
      case 'penerimaanPembiayaan': return <DataUploadView title="Unggah Data Penerimaan Pembiayaan" data={penerimaanPembiayaan} onUpload={handleUpload} instruction={PEMBIAYAAN_INSTRUCTION} columnMapping={PEMBIAYAAN_MAPPING} previewHeaders={PEMBIAYAAN_PREVIEW_HEADERS} groupedColumns={PEMBIAYAAN_GROUPED_COLUMNS} theme={theme} selectedYear={selectedYear} userRole={userRole} getAnalysisPrompt={(period, data, customQuery) => getPembiayaanAnalysisPrompt('Penerimaan Pembiayaan', period, data, customQuery)} namaPemda={namaPemda} />;
      case 'pengeluaranPembiayaan': return <DataUploadView title="Unggah Data Pengeluaran Pembiayaan" data={pengeluaranPembiayaan} onUpload={handleUpload} instruction={PEMBIAYAAN_INSTRUCTION} columnMapping={PEMBIAYAAN_MAPPING} previewHeaders={PEMBIAYAAN_PREVIEW_HEADERS} groupedColumns={PEMBIAYAAN_GROUPED_COLUMNS} theme={theme} selectedYear={selectedYear} userRole={userRole} getAnalysisPrompt={(period, data, customQuery) => getPembiayaanAnalysisPrompt('Pengeluaran Pembiayaan', period, data, customQuery)} namaPemda={namaPemda} />;
      case 'realisasi': return <DataUploadView title="Unggah Data Realisasi Belanja" data={realisasi} onUpload={handleUpload} instruction={REALISASI_BELANJA_INSTRUCTION} columnMapping={REALISASI_BELANJA_MAPPING} previewHeaders={REALISASI_BELANJA_PREVIEW_HEADERS} groupedColumns={REALISASI_BELANJA_GROUPED_COLUMNS} isMonthly={true} theme={theme} selectedYear={selectedYear} userRole={userRole} getAnalysisPrompt={getRealisasiBelanjaAnalysisPrompt} namaPemda={namaPemda} onDeleteMonth={handleDeleteMonthlyData} isDeleting={isDeleting} />;
      case 'realisasiPendapatan': return <DataUploadView title="Unggah Data Realisasi Pendapatan" data={realisasiPendapatan} onUpload={handleUpload} instruction={REALISASI_PENDAPATAN_INSTRUCTION} columnMapping={REALISASI_PENDAPATAN_MAPPING} previewHeaders={REALISASI_PENDAPATAN_PREVIEW_HEADERS} groupedColumns={REALISASI_PENDAPATAN_GROUPED_COLUMNS} isMonthly={true} dataFilter={REALISASI_PENDAPATAN_FILTER} theme={theme} selectedYear={selectedYear} userRole={userRole} getAnalysisPrompt={getRealisasiPendapatanAnalysisPrompt} namaPemda={namaPemda} onDeleteMonth={handleDeleteMonthlyData} isDeleting={isDeleting} />;
      case 'realisasiNonRkud': return <DataUploadView title="Unggah Data Realisasi Non RKUD" data={realisasiNonRkud} onUpload={handleUpload} instruction={REALISASI_NON_RKUD_INSTRUCTION} columnMapping={REALISASI_NON_RKUD_MAPPING} previewHeaders={REALISASI_NON_RKUD_PREVIEW_HEADERS} groupedColumns={REALISASI_NON_RKUD_GROUPED_COLUMNS}  isMonthly={true} dataFilter={REALISASI_NON_RKUD_FILTER} theme={theme} selectedYear={selectedYear} userRole={userRole} onDeleteMonth={handleDeleteMonthlyData} isDeleting={isDeleting} />;
      case 'proses-penandaan': return <ProsesPenandaanView data={allData} theme={theme} userRole={userRole} selectedYear={selectedYear} />;
      case 'activity-log': return <ActivityLogView theme={theme} />;
      case 'panduan': return <GuideView />;
      default: return <DashboardView data={allData} theme={theme} selectedYear={selectedYear}/>;
    }
  };

  return (
    <div className={`${theme} min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 font-sans flex`}>
      {/* Mobile Menu Button - Hanya muncul di layar kecil */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-xl shadow-lg border border-white/30 dark:border-gray-700/30 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-all"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Overlay untuk mobile saat sidebar terbuka */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR GLASSMORPHISM */}
      <nav className={`
  fixed lg:relative z-50 h-full
  transition-all duration-300 ease-in-out
  ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
  lg:translate-x-0
  ${isSidebarMinimized ? 'lg:w-16' : 'lg:w-64'}
  w-72
  backdrop-blur-xl bg-gradient-to-b from-white/80 to-white/70 dark:from-gray-800/80 dark:to-gray-900/80 
  border-r border-white/30 dark:border-gray-700/30 shadow-2xl flex-shrink-0 flex flex-col justify-between
  overflow-hidden
      `}>
        {/* Decorative Background Elements */}
        <div className="absolute top-0 -left-20 w-64 h-64 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-0 -right-20 w-64 h-64 bg-gradient-to-tr from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse-slow animation-delay-2000"></div>
        
        <div className="relative z-10 h-full flex flex-col">
          {/* Header with Logo */}
<div className={`p-6 ${!isSidebarMinimized ? 'border-b border-white/30 dark:border-gray-700/30' : ''}`}>
  <div className={`flex items-center gap-3 ${isSidebarMinimized ? 'justify-center' : ''}`}>
    {/* Logo Container with Glassmorphism */}
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur-md opacity-60 group-hover:opacity-80 transition-opacity"></div>
      <div className="relative p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-white/50 dark:border-gray-600/50 transform group-hover:scale-105 transition-transform">
        <img 
          src={brandingConfig.logo.path} // Ini akan mengambil "/logo.png"
          alt={brandingConfig.logo.alt}
          width={isSidebarMinimized ? brandingConfig.logo.sidebarMinimizedWidth : brandingConfig.logo.sidebarWidth}
          height={isSidebarMinimized ? brandingConfig.logo.sidebarMinimizedWidth : brandingConfig.logo.sidebarWidth}
          className="rounded-xl"
          onError={(e) => {
            e.target.src = `https://ui-avatars.com/api/?name=SIM&background=4f46e5&color=fff&rounded=true&bold=true&size=${isSidebarMinimized ? 32 : 40}`;
          }}
        />
      </div>
      {/* Tooltip untuk minimized mode */}
      {isSidebarMinimized && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
          {brandingConfig.text.appName}
        </div>
      )}
    </div>

    {!isSidebarMinimized && (
      <div className="flex-1 animate-fadeIn">
        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
          {brandingConfig.text.sidebarTitle}
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">Tahun Anggaran {selectedYear}</p>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-1 truncate max-w-[200px]" title={namaPemda}>
          {namaPemda || brandingConfig.text.subTitle}
        </p>
      </div>
    )}
    
    {/* Theme Toggle - Only visible when sidebar expanded */}
    {!isSidebarMinimized && (
      <button 
        onClick={toggleTheme} 
        className="p-2 rounded-xl bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-white/30 dark:border-gray-600/30 text-gray-600 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-700/80 transition-all hover:scale-105"
        title="Ganti Tema"
      >
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>
    )}
  </div>
</div>

          {/* User Info */}
          <div className={`p-4 ${!isSidebarMinimized ? 'mx-4 mt-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-white/30 dark:border-gray-700/30' : ''}`}>
            <div className={`flex items-center ${isSidebarMinimized ? 'justify-center' : 'gap-3'}`}>
              <div className="relative group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 transform group-hover:scale-105 transition-transform">
                  <div className="w-full h-full rounded-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                      {user?.email?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                </div>
                {!isSidebarMinimized && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></div>
                )}
                {/* Tooltip untuk minimized mode */}
                {isSidebarMinimized && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                    {user?.email || 'User'}
                  </div>
                )}
              </div>

              {!isSidebarMinimized && (
                <div className="flex-1 overflow-hidden animate-fadeIn">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                    {user?.email || 'User'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-sm">
                      {userRole === 'admin' ? 'Administrator' : userRole === 'editor' ? 'Editor' : 'Viewer'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {!isSidebarMinimized && (
              <button 
                onClick={handleLogout} 
                className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold rounded-xl shadow-lg shadow-rose-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-sm group"
              >
                <LogOut size={16} className="group-hover:rotate-12 transition-transform" />
                Keluar
              </button>
            )}
          </div>

          {/* Search Bar - Only when expanded */}
          {!isSidebarMinimized && (
            <div className="px-4 mb-4 animate-fadeIn">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari menu..."
                  value={searchMenuTerm}
                  onChange={(e) => setSearchMenuTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/30 dark:border-gray-600/30 rounded-xl text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
                {searchMenuTerm && (
                  <button
                    onClick={() => setSearchMenuTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Menu Items with Scroll */}
          <ul className="flex-1 overflow-y-auto px-3 space-y-1 scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent">
            {filteredMenuItems.filter(item => {
                if (userRole === 'guest') return item.id === 'dashboard-group';
                if (!item.requiredRole) return true;
                return item.requiredRole.includes(userRole);
            }).map(item => {
                const isGroupActive = (item.subMenus && item.subMenus.some(sm => sm.id === activeView)) || item.id === activeView;
                const isDropdown = !!item.subMenus;
                let isOpen, setIsOpen;
                if (item.id === 'dashboard-group') [isOpen, setIsOpen] = [isDashboardOpen, setIsDashboardOpen];
                else if (item.id === 'referensi-group') [isOpen, setIsOpen] = [isReferensiOpen, setIsReferensiOpen];
                else if (item.id === 'penganggaran-group') [isOpen, setIsOpen] = [isPenganggaranOpen, setIsPenganggaranOpen];
                else if (item.id === 'penatausahaan-group') [isOpen, setIsOpen] = [isPenatausahaanOpen, setIsPenatausahaanOpen];

                // Jika menu tidak memiliki submenus dan tidak cocok dengan pencarian, sembunyikan
                if (!item.subMenus && searchMenuTerm && !item.label.toLowerCase().includes(searchMenuTerm.toLowerCase())) {
                  return null;
                }

                return (
                <li key={item.id} className="mb-1">
                    {isDropdown ? (
                    <div>
                        <button 
                          onClick={() => setIsOpen(!isOpen)} 
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${
                            isSidebarMinimized ? 'justify-center' : ''
                          } ${
                            isGroupActive 
                              ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50' 
                              : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50 hover:backdrop-blur-sm'
                          }`}
                          title={item.label}
                        >
                          <div className="flex items-center">
                            <item.icon size={20} className={`${!isSidebarMinimized ? "mr-3" : ""} ${isGroupActive ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
                            {!isSidebarMinimized && (
                              <span className="text-sm font-medium">{item.label}</span>
                            )}
                          </div>
                          {!isSidebarMinimized && (
                            <ChevronDown 
                              size={16} 
                              className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${isGroupActive ? 'text-indigo-600' : 'text-gray-400'}`}
                            />
                          )}
                        </button>

                        {isOpen && !isSidebarMinimized && (
                          <ul className="mt-1 ml-4 space-y-1 animate-slideDown">
                            {item.subMenus.map(subItem => (
                              <li key={subItem.id}>
                                <button 
                                  onClick={() => {
                                    setActiveView(subItem.id);
                                    // Auto close sidebar on mobile after selection
                                    if (window.innerWidth < 1024) {
                                      setIsMobileMenuOpen(false);
                                    }
                                  }} 
                                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-all ${
                                    activeView === subItem.id 
                                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md shadow-indigo-500/30' 
                                      : 'text-gray-500 dark:text-gray-400 hover:bg-white/40 dark:hover:bg-gray-800/40 hover:backdrop-blur-sm'
                                  }`}
                                  title={menuDescriptions[subItem.id] || subItem.label}
                                >
                                  <div className="flex items-center gap-3">
                                    <subItem.icon size={16} />
                                    <span className="font-medium">{subItem.label}</span>
                                  </div>
                                  {subItem.statusKey && (
                                    dataStatus[subItem.statusKey]
                                      ? <CheckCircle2 size={14} className="text-emerald-500 animate-pulse" />
                                      : <AlertCircle size={14} className="text-amber-500" />
                                  )}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                    </div>
                    ) : (
                    <button 
                      onClick={() => {
                        setActiveView(item.id);
                        // Auto close sidebar on mobile after selection
                        if (window.innerWidth < 1024) {
                          setIsMobileMenuOpen(false);
                        }
                      }} 
                      className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                        isSidebarMinimized ? 'justify-center' : ''
                      } ${
                        activeView === item.id 
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md shadow-indigo-500/30' 
                          : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50 hover:backdrop-blur-sm'
                      }`}
                      title={item.label}
                    >
                      <item.icon size={20} className={`${!isSidebarMinimized ? "mr-3" : ""} ${activeView === item.id ? 'text-white' : ''}`} />
                      {!isSidebarMinimized && (
                        <span className="text-sm font-medium">{item.label}</span>
                      )}
                    </button>
                    )}
                </li>
                )
            })}
          </ul>

          {/* Sidebar Footer */}
          <div className="relative z-10 p-4 border-t border-white/30 dark:border-gray-700/30">
            <button 
              onClick={() => setIsSidebarMinimized(!isSidebarMinimized)} 
              className="w-full flex items-center justify-center p-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-gray-700/70 text-gray-600 dark:text-gray-300 rounded-xl border border-white/30 dark:border-gray-600/30 transition-all group"
              title={isSidebarMinimized ? "Perluas Sidebar" : "Persempit Sidebar"}
            >
              {isSidebarMinimized ? (
                <ChevronsRight size={18} className="group-hover:translate-x-1 transition-transform" />
              ) : (
                <ChevronsLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              )}
              {!isSidebarMinimized && <span className="ml-2 text-xs font-medium">Persempit</span>}
            </button>
            
            {/* Copyright - Only show when expanded */}
            {!isSidebarMinimized && (
  <div className="mt-4 text-center animate-fadeIn">
    <p className="text-[10px] text-gray-400 dark:text-gray-500">
      {brandingConfig.text.footer}
    </p>
    <p className="text-[8px] text-gray-300 dark:text-gray-600 mt-1">
      v4.0.0
    </p>
  </div>
)}
          </div>
        </div>
      </nav>

      {/* Main Content - LEBIH RAPAT */}
<main className={`
  flex-1 transition-all duration-300
  ${isSidebarMinimized ? 'lg:ml-18' : 'lg:ml-59'}
  ml-0
  p-3 md:p-5 overflow-y-auto
  bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800
`}>
  {/* Mobile Header - Only visible on mobile */}
  <div className="lg:hidden mb-3 flex items-center justify-between">
    <div className="flex-1"></div>
    <div className="flex items-center gap-2">
      <button
        onClick={toggleTheme}
        className="p-1.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700"
      >
        {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
      </button>
    </div>
  </div>

  {renderView()}
</main>
    </div>
  );
};

export default App;