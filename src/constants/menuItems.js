import { 
  LayoutDashboard, PieChart, Building2, BookCopy, Shuffle, 
  ArrowRightLeft, Award, BarChartHorizontal, TrendingUp, Droplets, 
  FileText, Archive, DollarSign, Globe, MinusCircle, ArrowDownCircle, 
  Settings, History, BookMarked, Tag, Briefcase, Users, HelpCircle
} from 'lucide-react';

export const menuDescriptions = {
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

export const menuItems = [
  { 
    id: 'dashboard-group', 
    label: 'Dashboard', 
    icon: LayoutDashboard,
    subMenus: [
      { id: 'dashboard', label: 'Dashboard Utama', icon: LayoutDashboard },
      { id: 'analisis-kualitas-belanja', label: 'Analisis Belanja', icon: PieChart },
      { id: 'mandatory-spending', label: 'Mandatory Spending', icon: Building2 },
      { id: 'laporan-tematik', label: 'Laporan Tematik', icon: BookCopy },
      { id: 'analisis-potensi-silpa', label: 'Analisis Potensi SiLPA', icon: Shuffle },
      { id: 'analisis-lintas-tahun', label: 'Analisis Lintas Tahun', icon: ArrowRightLeft },
      { id: 'analisis-kinerja', label: 'Analisis Kinerja', icon: Award },
      { id: 'skpd-stats', label: 'Statistik Belanja', icon: BarChartHorizontal },
      { id: 'skpd-pendapatan-stats', label: 'Statistik Pendapatan', icon: TrendingUp },
      { id: 'sumber-dana-stats', label: 'Statistik Sumber Dana', icon: Droplets },
      { id: 'skpd-rekening-stats', label: 'Statistik Rekening', icon: FileText },
      { id: 'skpd-subkegiatan-stats', label: 'Statistik Sub Kegiatan', icon: FileText },
      { id: 'panduan', label: 'Panduan', icon: HelpCircle, requiredRole: ['admin', 'editor', 'viewer'] }
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