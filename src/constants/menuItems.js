import { 
  LayoutDashboard, PieChart, Building2, BookCopy, Shuffle, 
  ArrowRightLeft, Award, BarChartHorizontal, TrendingUp, Droplets, 
  FileText, Archive, DollarSign, Globe, MinusCircle, ArrowDownCircle, 
  Settings, History, BookMarked, Tag, Briefcase, Users, HelpCircle,
  BookOpen, Activity
} from 'lucide-react';

export const menuDescriptions = {
  'dashboard': 'Menampilkan ringkasan visual APBD, termasuk total pendapatan, belanja, dan pembiayaan.',
  'analisis-kualitas-belanja': 'Menganalisis komposisi belanja berdasarkan jenisnya (modal, pegawai, barang/jasa) untuk menilai kualitas alokasi anggaran.',
  'mandatory-spending': 'Menganalisis pemenuhan alokasi belanja wajib, seperti porsi belanja pegawai terhadap total APBD.',
  'laporan-tematik': 'Menampilkan laporan tematik berdasarkan program prioritas daerah.',
  'analisis-potensi-silpa': 'Memproyeksikan potensi Sisa Lebih Perhitungan Anggaran (SiLPA) di akhir tahun berdasarkan realisasi bulanan.',
  'analisis-lintas-tahun': 'Membandingkan data APBD antara dua tahun anggaran yang berbeda untuk melihat tren dan perubahan kinerja.',
  'analisis-kinerja': 'Membandingkan kinerja penyerapan anggaran atau pencapaian pendapatan antar SKPD dalam dua tahun berbeda.',
  'skpd-stats': 'Menampilkan statistik perbandingan antara pagu anggaran dan realisasi belanja untuk setiap SKPD.',
  'skpd-pendapatan-stats': 'Menampilkan statistik perbandingan antara target dan realisasi pendapatan untuk setiap SKPD.',
  'sumber-dana-stats': 'Merinci komposisi sumber pendanaan yang digunakan oleh masing-masing SKPD.',
  'skpd-rekening-stats': 'Merinci pagu anggaran dan realisasi belanja hingga ke level rekening untuk setiap SKPD.',
  'skpd-subkegiatan-stats': 'Merinci pagu anggaran dan realisasi belanja hingga ke level sub kegiatan beserta rincian rekening di dalamnya.',
  'panduan': 'Panduan penggunaan aplikasi SIMONALISA.',
  'referensi-akun': 'Kelola data referensi kode rekening untuk mapping data.',
  'penandaan-mandatory': 'Kelola penandaan untuk belanja mandatory (pendidikan, kesehatan, infrastruktur).',
  'penandaan-tematik': 'Kelola penandaan untuk program tematik prioritas daerah.',
  'referensi-penandaan': 'Kelola data penandaan anggaran untuk berbagai keperluan analisis.',
  'proses-penandaan': 'Proses penandaan otomatis pada data anggaran dan realisasi.',
  'anggaran': 'Unggah dan kelola data anggaran belanja per SKPD.',
  'pendapatan': 'Unggah dan kelola data target pendapatan daerah.',
  'penerimaanPembiayaan': 'Unggah data penerimaan pembiayaan daerah.',
  'pengeluaranPembiayaan': 'Unggah data pengeluaran pembiayaan daerah.',
  'realisasi': 'Unggah data realisasi belanja per bulan.',
  'realisasiPendapatan': 'Unggah data realisasi pendapatan per bulan.',
  'realisasiNonRkud': 'Unggah data realisasi belanja non RKUD (BOS, BOK, dll).',
  'pengaturan': 'Pengaturan aplikasi, termasuk tahun anggaran dan tema.',
  'activity-log': 'Lihat log aktivitas pengguna dalam aplikasi.',
  'manage-viewer-access': 'Kelola akses SKPD untuk pengguna dengan peran Viewer. Tentukan SKPD mana saja yang dapat dilihat oleh masing-masing viewer.' // <-- TAMBAHKAN
};

export const menuItems = [
  { 
    id: 'dashboard-group', 
    label: 'Dashboard', 
    icon: LayoutDashboard,
    requiredRole: ['admin', 'editor', 'viewer'],
    subMenus: [
      { id: 'dashboard', label: 'Dashboard Utama', icon: LayoutDashboard, statusKey: null, requiredRole: ['admin', 'editor', 'viewer'] },
      { id: 'analisis-kualitas-belanja', label: 'Analisis Belanja', icon: PieChart, statusKey: 'anggaran', requiredRole: ['admin', 'editor', 'viewer'] },
      { id: 'mandatory-spending', label: 'Mandatory Spending', icon: Building2, statusKey: 'anggaran', requiredRole: ['admin', 'editor', 'viewer'] },
      { id: 'laporan-tematik', label: 'Laporan Tematik', icon: BookCopy, statusKey: 'realisasi', requiredRole: ['admin', 'editor', 'viewer'] },
      { id: 'analisis-potensi-silpa', label: 'Analisis Potensi SiLPA', icon: Shuffle, statusKey: 'realisasi', requiredRole: ['admin', 'editor', 'viewer'] },
      { id: 'analisis-lintas-tahun', label: 'Analisis Lintas Tahun', icon: ArrowRightLeft, statusKey: null, requiredRole: ['admin', 'editor', 'viewer'] },
      { id: 'analisis-kinerja', label: 'Analisis Kinerja', icon: Award, statusKey: 'realisasi', requiredRole: ['admin', 'editor', 'viewer'] },
      { id: 'skpd-stats', label: 'Statistik Belanja', icon: BarChartHorizontal, statusKey: 'anggaran', requiredRole: ['admin', 'editor', 'viewer'] },
      { id: 'skpd-pendapatan-stats', label: 'Statistik Pendapatan', icon: TrendingUp, statusKey: 'pendapatan', requiredRole: ['admin', 'editor', 'viewer'] },
      { id: 'sumber-dana-stats', label: 'Statistik Sumber Dana', icon: Droplets, statusKey: 'anggaran', requiredRole: ['admin', 'editor', 'viewer'] },
      { id: 'skpd-rekening-stats', label: 'Statistik Rekening', icon: FileText, statusKey: 'anggaran', requiredRole: ['admin', 'editor', 'viewer'] },
      { id: 'skpd-subkegiatan-stats', label: 'Statistik Sub Kegiatan', icon: BookOpen, statusKey: 'anggaran', requiredRole: ['admin', 'editor', 'viewer'] },
      { id: 'panduan', label: 'Panduan', icon: HelpCircle, statusKey: null, requiredRole: ['admin', 'editor', 'viewer'] }
    ]
  },
  {
    id: 'referensi-group',
    label: 'Referensi',
    icon: BookMarked,
    requiredRole: ['admin', 'editor'],
    subMenus: [
      { id: 'referensi-akun', label: 'Akun Kode Rekening', icon: FileText, statusKey: null, requiredRole: ['admin', 'editor'] },
      { id: 'penandaan-mandatory', label: 'Penandaan Mandatory', icon: BookCopy, statusKey: null, requiredRole: ['admin', 'editor'] },
      { id: 'penandaan-tematik', label: 'Penandaan Tematik', icon: Tag, statusKey: null, requiredRole: ['admin', 'editor'] },
      { id: 'referensi-penandaan', label: 'Penandaan Anggaran', icon: Briefcase, statusKey: null, requiredRole: ['admin', 'editor'] },
      { id: 'proses-penandaan', label: 'Proses Penandaan', icon: Activity, statusKey: null, requiredRole: ['admin', 'editor'] },
    ]
  },
  { 
    id: 'penganggaran-group',
    label: 'Penganggaran',
    icon: Archive,
    requiredRole: ['admin', 'editor'],
    subMenus: [
      { id: 'anggaran', label: 'Anggaran', icon: Archive, statusKey: 'anggaran', requiredRole: ['admin', 'editor'] },
      { id: 'pendapatan', label: 'Target Pendapatan', icon: DollarSign, statusKey: 'pendapatan', requiredRole: ['admin', 'editor'] },
      { id: 'penerimaanPembiayaan', label: 'Penerimaan Pembiayaan', icon: Globe, statusKey: 'penerimaanPembiayaan', requiredRole: ['admin', 'editor'] },
      { id: 'pengeluaranPembiayaan', label: 'Pengeluaran Pembiayaan', icon: MinusCircle, statusKey: 'pengeluaranPembiayaan', requiredRole: ['admin', 'editor'] },
    ]
  },
  { 
    id: 'penatausahaan-group',
    label: 'Penatausahaan',
    icon: BookCopy,
    requiredRole: ['admin', 'editor'],
    subMenus: [
      { id: 'realisasi', label: 'Realisasi Belanja', icon: ArrowDownCircle, statusKey: 'realisasi', requiredRole: ['admin', 'editor'] },
      { id: 'realisasiPendapatan', label: 'Realisasi Pendapatan', icon: TrendingUp, statusKey: 'realisasiPendapatan', requiredRole: ['admin', 'editor'] },
      { id: 'realisasiNonRkud', label: 'Realisasi Non RKUD', icon: Shuffle, statusKey: 'realisasiNonRkud', requiredRole: ['admin', 'editor'] },
    ]
  },
  // MENU TUNGGAL - TANPA SUBMENU
  { 
    id: 'pengaturan', 
    label: 'Pengaturan Umum', 
    icon: Settings, 
    requiredRole: ['admin'] 
  },
  { 
    id: 'manage-viewer-access', 
    label: 'Kelola Akses Viewer', 
    icon: Users, 
    requiredRole: ['admin'] 
  },
  { 
    id: 'activity-log', 
    label: 'Log Aktivitas', 
    icon: History, 
    requiredRole: ['admin'] 
  }
];