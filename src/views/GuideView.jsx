import React from 'react';
import SectionTitle from '../components/SectionTitle';
import { 
  BookOpen, FileText, HelpCircle, ArrowRight, CheckCircle, 
  BarChart3, TrendingUp, DollarSign, PieChart, Layers, Users,
  Wallet, Building2, Scale, Target, Download, Bot, Sparkles,
  Award, Briefcase, Calendar, Eye, EyeOff, Filter, Search,
  DownloadCloud, AlertTriangle, Info, Lightbulb, Zap,
  Activity, LineChart, Radar, PieChart as PieChartIcon,
  GitBranch, FolderTree, Database, HardDrive, Shield,
  Clock, Globe, Lock, Unlock, Star, Medal, Trophy,
  Rocket, Cpu, Brain, Gauge, Coins, CreditCard,
  BookMarked, GraduationCap, HardHat, BookCopy,
  LayoutDashboard, Settings, LogOut, UserCircle,
  ChevronRight, ChevronDown, ChevronUp, Menu
} from 'lucide-react';

const GuideView = () => {
  const mainFeatures = [
    {
      title: "📊 DASHBOARD UTAMA",
      icon: <LayoutDashboard className="w-8 h-8 text-blue-500" />,
      color: "blue",
      description: "Ringkasan eksekutif APBD dalam satu tampilan",
      items: [
        "Total anggaran, realisasi, dan sisa anggaran",
        "Ringkasan pendapatan dan belanja daerah",
        "Grafik perbandingan target vs realisasi",
        "Heatmap penyerapan per SKPD",
        "Status sinkronisasi data terkini",
        "Quick stats untuk eksekutif"
      ],
      analysis: [
        "Evaluasi capaian APBD secara keseluruhan",
        "Identifikasi tren realisasi bulanan",
        "Pemantauan risiko fiskal",
        "Analisis distribusi sumber dana"
      ]
    },
    {
      title: "🤖 ANALISIS AI",
      icon: <Bot className="w-8 h-8 text-purple-500" />,
      color: "purple",
      description: "Asisten cerdas untuk analisis APBD",
      items: [
        "Klik 'Beri Analisa & Rekomendasi' untuk analisis otomatis",
        "Ajukan pertanyaan spesifik di kolom 'Tanya AI'",
        "Analisis tren dan pola belanja",
        "Rekomendasi strategis berbasis data",
        "Identifikasi risiko dan peluang",
        "Dapatkan insight eksekutif"
      ],
      examples: [
        "Analisis realisasi belanja Dinas PU bulan Maret",
        "Bandingkan penyerapan anggaran Dinas Pendidikan dan Dinas Kesehatan",
        "Identifikasi SKPD dengan penyerapan terendah",
        "Proyeksi SiLPA akhir tahun"
      ]
    }
  ];

  const analysisMenus = [
    {
      title: "📈 ANALISIS KINERJA SKPD",
      icon: <Activity className="w-8 h-8 text-emerald-500" />,
      color: "emerald",
      description: "Perbandingan kinerja antar SKPD",
      items: [
        "Bandingkan kinerja penyerapan antar SKPD",
        "Lihat tren realisasi per bulan",
        "Identifikasi SKPD dengan penyerapan tinggi/rendah",
        "Analisis pagu vs realisasi per SKPD",
        "Perbandingan target vs realisasi pendapatan",
        "Head-to-head analysis SKPD"
      ],
      features: [
        "Filter berdasarkan tahun dan periode",
        "Sortir berdasarkan pagu, realisasi, atau persentase",
        "Radar chart untuk perbandingan detail",
        "Export data ke Excel"
      ]
    },
    {
      title: "💰 STATISTIK BELANJA",
      icon: <Wallet className="w-8 h-8 text-indigo-500" />,
      color: "indigo",
      description: "Analisis belanja per SKPD",
      items: [
        "Rincian anggaran belanja per SKPD",
        "Perbandingan pagu vs realisasi",
        "Analisis penyerapan anggaran",
        "Distribusi belanja per sub kegiatan",
        "Rekening detail per SKPD",
        "Sumber dana per belanja"
      ],
      features: [
        "Filter SKPD dan periode",
        "Chart visual untuk top 10 SKPD",
        "Detail rincian rekening",
        "Download data Excel"
      ]
    },
    {
      title: "📊 STATISTIK PENDAPATAN",
      icon: <TrendingUp className="w-8 h-8 text-green-500" />,
      color: "green",
      description: "Analisis pendapatan per SKPD",
      items: [
        "Target vs realisasi pendapatan",
        "Perbandingan antar OPD/SKPD",
        "Analisis sumber pendapatan",
        "Proyeksi pendapatan akhir tahun",
        "Kinerja pencapaian target",
        "Distribusi pendapatan per sumber"
      ],
      features: [
        "Proyeksi dengan indikator risiko",
        "Executive summary dashboard",
        "Filter berdasarkan periode",
        "Export ke Excel"
      ]
    },
    {
      title: "🔄 ANALISIS LINTAS TAHUN",
      icon: <GitBranch className="w-8 h-8 text-amber-500" />,
      color: "amber",
      description: "Perbandingan kinerja 3 tahun anggaran",
      items: [
        "Bandingkan anggaran belanja 3 tahun (2024, 2025, 2026)",
        "Perbandingan target pendapatan antar tahun",
        "Tren realisasi belanja dan pendapatan",
        "Growth rates tahunan",
        "Analisis pola musiman",
        "Kinerja SKPD lintas tahun"
      ],
      features: [
        "3 tahun perbandingan simultan",
        "Selector tahun fleksibel",
        "Chart bar dan area chart",
        "Kurva kumulatif penyerapan",
        "Growth indicators dengan persentase"
      ]
    },
    {
      title: "⚠️ ANALISIS POTENSI SILPA",
      icon: <AlertTriangle className="w-8 h-8 text-orange-500" />,
      color: "orange",
      description: "Estimasi sisa anggaran akhir tahun",
      items: [
        "Proyeksi SiLPA berdasarkan realisasi terkini",
        "Identifikasi SKPD dengan risiko SiLPA tinggi",
        "Analisis penyerapan per SKPD",
        "Estimasi sisa anggaran per rekening",
        "Kategori risiko (kritis, waspada, aman)",
        "Rekomendasi mitigasi"
      ],
      features: [
        "Proyeksi linier berdasarkan rata-rata bulanan",
        "Filter tingkat risiko",
        "Chart visualisasi top 10 SKPD",
        "Executive dashboard dengan quick stats",
        "Download data Excel"
      ]
    },
    {
      title: "⚖️ MANDATORY SPENDING",
      icon: <Scale className="w-8 h-8 text-rose-500" />,
      color: "rose",
      description: "Analisis pemenuhan belanja wajib",
      items: [
        "Belanja Pegawai (maksimal 30%)",
        "Infrastruktur Publik (minimal 40%)",
        "Fungsi Pendidikan (minimal 20%)",
        "Status kepatuhan terhadap regulasi",
        "Rekomendasi pemenuhan dengan 3 level",
        "Analisis dampak terhadap APBD"
      ],
      features: [
        "Radial gauge chart untuk visualisasi",
        "Status MEMENUHI / BELUM MEMENUHI",
        "Tombol Rekomendasi Pemenuhan",
        "3 level rekomendasi (Ekstrim, Moderat, Toleran)",
        "Analisis sumber penyesuaian prioritas",
        "Dampak terhadap komponen APBD",
        "Executive dashboard terintegrasi"
      ],
      regulation: [
        "UU No. 1 Tahun 2022 Pasal 146 (Pegawai)",
        "UU No. 1 Tahun 2022 Pasal 147 (Infrastruktur)",
        "UUD 1945 & UU No. 20/2003 (Pendidikan)"
      ]
    },
    {
      title: "📋 LAPORAN TEMATIK",
      icon: <BookCopy className="w-8 h-8 text-cyan-500" />,
      color: "cyan",
      description: "Laporan khusus untuk kebutuhan analisis",
      items: [
        "Laporan mandatory spending",
        "Analisis belanja infrastruktur",
        "Laporan fungsi pendidikan",
        "Laporan belanja pegawai",
        "Ringkasan eksekutif"
      ]
    },
    {
      title: "🌊 STATISTIK SUMBER DANA",
      icon: <Database className="w-8 h-8 text-teal-500" />,
      color: "teal",
      description: "Rincian penggunaan sumber dana",
      items: [
        "DAK (Dana Alokasi Khusus)",
        "DAU (Dana Alokasi Umum)",
        "DBH (Dana Bagi Hasil)",
        "PAD (Pendapatan Asli Daerah)",
        "Hibah dan bantuan",
        "Analisis per sub kegiatan"
      ],
      features: [
        "Filter berdasarkan SKPD, sub kegiatan",
        "Pie chart komposisi sumber dana",
        "Tabel rinci dengan pagu dan realisasi",
        "Download data Excel"
      ]
    },
    {
      title: "📁 STATISTIK REKENING",
      icon: <CreditCard className="w-8 h-8 text-blue-600" />,
      color: "blue",
      description: "Analisis belanja per rekening",
      items: [
        "Rincian per kode rekening",
        "Analisis belanja operasi (5.1)",
        "Belanja modal (5.2)",
        "Belanja tak terduga (5.3)",
        "Risiko rekening dengan penyerapan rendah"
      ],
      features: [
        "Sortir berdasarkan realisasi, anggaran, persentase",
        "Expandable details per SKPD",
        "Sumber dana per rekening",
        "Executive dashboard terintegrasi"
      ]
    },
    {
      title: "📂 STATISTIK SUB KEGIATAN",
      icon: <FolderTree className="w-8 h-8 text-purple-600" />,
      color: "purple",
      description: "Analisis hingga level sub kegiatan",
      items: [
        "Rincian per sub kegiatan",
        "Analisis per SKPD dan sub unit",
        "Sumber dana per sub kegiatan",
        "Rekening detail per sub kegiatan",
        "Identifikasi sub kegiatan prioritas"
      ],
      features: [
        "Filter SKPD dan sub unit",
        "Expandable rows untuk detail",
        "Progress bar visualisasi penyerapan",
        "Tabel rekening dengan pagu dan realisasi"
      ]
    }
  ];

  const dataManagement = [
    {
      title: "📤 UPLOAD DATA",
      icon: <DownloadCloud className="w-8 h-8 text-emerald-600" />,
      color: "emerald",
      description: "Menu untuk mengunggah data APBD",
      items: [
        "Anggaran Belanja",
        "Target Pendapatan",
        "Realisasi Belanja (RKUD & Non RKUD)",
        "Realisasi Pendapatan",
        "Penerimaan & Pengeluaran Pembiayaan"
      ]
    },
    {
      title: "📚 REFERENSI",
      icon: <BookMarked className="w-8 h-8 text-indigo-600" />,
      color: "indigo",
      description: "Data referensi untuk mandatory spending",
      items: [
        "Referensi Pendidikan (kode sub kegiatan)",
        "Referensi Infrastruktur",
        "Penandaan mandatory spending"
      ]
    },
    {
      title: "⚙️ PENGATURAN",
      icon: <Settings className="w-8 h-8 text-gray-600" />,
      color: "gray",
      description: "Konfigurasi aplikasi",
      items: [
        "Nama instansi / pemerintah daerah",
        "Tahun anggaran aktif",
        "Manajemen pengguna (admin, editor, viewer)",
        "Backup data",
        "Tema (light/dark mode)"
      ]
    },
    {
      title: "📋 LOG AKTIVITAS",
      icon: <Activity className="w-8 h-8 text-amber-600" />,
      color: "amber",
      description: "Riwayat aktivitas pengguna",
      items: [
        "Log upload data",
        "Log perubahan pengguna",
        "Log backup data",
        "Tracking aktivitas admin"
      ]
    }
  ];

  const executiveFeatures = [
    {
      title: "🏢 DASHBOARD EKSEKUTIF",
      icon: <Award className="w-8 h-8 text-yellow-500" />,
      items: [
        "Total anggaran dan realisasi ringkas",
        "Status kepatuhan mandatory spending",
        "Proyeksi SiLPA dan risiko fiskal",
        "Top performers SKPD",
        "Catatan eksekutif otomatis"
      ]
    },
    {
      title: "📊 QUICK STATS",
      icon: <Gauge className="w-8 h-8 text-blue-500" />,
      items: [
        "Rata-rata penyerapan anggaran",
        "Jumlah SKPD dengan risiko tinggi",
        "Konsentrasi sumber dana",
        "Estimasi pertumbuhan tahunan"
      ]
    },
    {
      title: "🎯 FITUR REKOMENDASI",
      icon: <Target className="w-8 h-8 text-green-500" />,
      items: [
        "Rekomendasi pemenuhan mandatory (3 level)",
        "Analisis sumber penyesuaian prioritas",
        "Dampak terhadap komponen APBD",
        "Strategi mitigasi risiko"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 text-white">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -mr-40 -mt-40"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-400/10 rounded-full blur-[80px] -ml-32 -mb-32"></div>
        <div className="absolute top-20 left-20 w-40 h-40 bg-yellow-400/10 rounded-full blur-[60px]"></div>
        
        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/5 animate-float"
              style={{
                width: `${Math.random() * 8 + 2}px`,
                height: `${Math.random() * 8 + 2}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${Math.random() * 20 + 10}s`
              }}
            />
          ))}
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-xl rounded-full text-sm font-medium mb-6 border border-white/30">
                <Sparkles size={16} className="text-yellow-300" />
                <span>Sistem Informasi Analisa APBD</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4">
                PANDUAN <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300">
                  PENGGUNAAN APLIKASI
                </span>
              </h1>
              <p className="text-xl text-indigo-100 max-w-2xl leading-relaxed">
                Selamat datang di <strong>Sistem Informasi Analisa APBD</strong>. 
                Aplikasi ini membantu Anda menganalisis Anggaran Pendapatan dan Belanja Daerah 
                dengan dukungan AI dan visualisasi data interaktif.
              </p>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="relative w-64 h-64">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-[2rem] rotate-6 opacity-30 blur-xl"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-[2rem] -rotate-6 opacity-30 blur-xl"></div>
                <div className="relative bg-white/10 backdrop-blur-2xl rounded-[2rem] p-8 border border-white/20 shadow-2xl flex items-center justify-center h-full">
                  <LayoutDashboard size={80} className="text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-16">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900 dark:text-white">22+</p>
                <p className="text-xs text-gray-500">Menu Analisis</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <Bot className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900 dark:text-white">AI</p>
                <p className="text-xs text-gray-500">Analisis Cerdas</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                <Download className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900 dark:text-white">Excel</p>
                <p className="text-xs text-gray-500">Export Data</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                <Gauge className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900 dark:text-white">3 Level</p>
                <p className="text-xs text-gray-500">Rekomendasi</p>
              </div>
            </div>
          </div>
        </div>

        {/* SectionTitle dengan background */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-3xl blur-xl"></div>
          <div className="relative">
            <SectionTitle>🎯 FITUR UTAMA</SectionTitle>
          </div>
        </div>

        {/* Main Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mainFeatures.map((feature, idx) => (
            <div 
              key={idx} 
              className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1"
            >
              {/* Background Gradient */}
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-${feature.color}-500/10 to-transparent rounded-bl-full group-hover:scale-150 transition-transform duration-700`}></div>
              
              <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`p-4 bg-gradient-to-br from-${feature.color}-500 to-${feature.color}-600 rounded-2xl shadow-lg`}>
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white">{feature.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{feature.description}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <CheckCircle size={16} className={`text-${feature.color}-500`} />
                      Fitur Utama
                    </h4>
                    <ul className="space-y-2">
                      {feature.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <span className={`text-${feature.color}-500 mt-1`}>•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {feature.analysis && (
                    <div>
                      <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <Brain size={16} className={`text-${feature.color}-500`} />
                        Analisis yang Dapat Dilakukan
                      </h4>
                      <ul className="space-y-2">
                        {feature.analysis.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <span className={`text-${feature.color}-500 mt-1`}>→</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {feature.examples && (
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-800">
                      <h4 className="text-xs font-bold text-purple-700 dark:text-purple-300 mb-2 flex items-center gap-2">
                        <Sparkles size={14} className="text-yellow-500" />
                        Contoh Pertanyaan
                      </h4>
                      <ul className="space-y-1">
                        {feature.examples.map((item, i) => (
                          <li key={i} className="text-xs text-gray-600 dark:text-gray-400 italic">"{item}"</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* SectionTitle untuk Menu Analisis */}
        <div className="relative mt-12">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-3xl blur-xl"></div>
          <div className="relative">
            <SectionTitle>📊 MENU ANALISIS APBD</SectionTitle>
          </div>
        </div>

        {/* Analysis Menus Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {analysisMenus.map((menu, idx) => (
            <div 
              key={idx} 
              className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-${menu.color}-500/10 to-transparent rounded-bl-full`}></div>
              
              <div className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className={`p-3 bg-gradient-to-br from-${menu.color}-500 to-${menu.color}-600 rounded-xl shadow-lg shrink-0`}>
                    {menu.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">{menu.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{menu.description}</p>
                  </div>
                </div>

                <ul className="space-y-2 mb-4">
                  {menu.items.slice(0, 4).map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <span className={`text-${menu.color}-500 mt-1`}>•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                {menu.features && (
                  <div className="border-t border-gray-100 dark:border-gray-700 pt-3 mt-3">
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Fitur:</h4>
                    <div className="flex flex-wrap gap-1">
                      {menu.features.slice(0, 3).map((feature, i) => (
                        <span key={i} className={`text-[10px] px-2 py-1 bg-${menu.color}-50 dark:bg-${menu.color}-900/20 text-${menu.color}-700 dark:text-${menu.color}-300 rounded-full`}>
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {menu.regulation && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Regulasi:</h4>
                    <ul className="space-y-1">
                      {menu.regulation.map((reg, i) => (
                        <li key={i} className="text-[10px] text-gray-500 dark:text-gray-400 italic">📜 {reg}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* SectionTitle untuk Manajemen Data */}
        <div className="relative mt-12">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-3xl blur-xl"></div>
          <div className="relative">
            <SectionTitle>📁 MANAJEMEN DATA & REFERENSI</SectionTitle>
          </div>
        </div>

        {/* Data Management Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dataManagement.map((menu, idx) => (
            <div 
              key={idx} 
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 bg-gradient-to-br from-${menu.color}-500 to-${menu.color}-600 rounded-xl shadow-lg`}>
                  {menu.icon}
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white">{menu.title}</h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{menu.description}</p>
              <ul className="space-y-1">
                {menu.items.map((item, i) => (
                  <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <span className={`w-1 h-1 rounded-full bg-${menu.color}-500`}></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Executive Features Section */}
        <div className="relative mt-12">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-3xl blur-xl"></div>
          <div className="relative">
            <SectionTitle>👑 FITUR EKSEKUTIF</SectionTitle>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {executiveFeatures.map((feature, idx) => (
            <div key={idx} className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl shadow-lg">
                  {feature.icon}
                </div>
                <h3 className="font-black text-gray-900 dark:text-white">{feature.title}</h3>
              </div>
              <ul className="space-y-2">
                {feature.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="text-yellow-500 mt-1">✨</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Tips Section */}
        <div className="relative mt-8">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 rounded-3xl blur-xl"></div>
          <div className="relative bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-3xl p-8 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start gap-4">
              <div className="p-4 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-2xl shadow-lg shrink-0">
                <Lightbulb size={32} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">💡 Tips Penggunaan AI</h3>
                <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
                  Gunakan pertanyaan yang spesifik untuk mendapatkan analisis yang lebih akurat.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
                    <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-2">✅ Contoh Pertanyaan Baik:</p>
                    <ul className="space-y-2">
                      <li className="text-sm text-gray-600 dark:text-gray-400">• "Analisis realisasi belanja Dinas PU bulan Maret"</li>
                      <li className="text-sm text-gray-600 dark:text-gray-400">• "Bandingkan penyerapan Dinas Pendidikan dan Dinas Kesehatan"</li>
                      <li className="text-sm text-gray-600 dark:text-gray-400">• "Identifikasi SKPD dengan penyerapan terendah tahun ini"</li>
                    </ul>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
                    <p className="text-sm font-bold text-amber-600 dark:text-amber-400 mb-2">⚠️ Contoh Pertanyaan Kurang Baik:</p>
                    <ul className="space-y-2">
                      <li className="text-sm text-gray-600 dark:text-gray-400">• "Analisis APBD" (terlalu umum)</li>
                      <li className="text-sm text-gray-600 dark:text-gray-400">• "Kasih tahu data" (tidak spesifik)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © 2026 Sistem Informasi Analisa APBD. All rights reserved.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            v4.0.0 | Pemerintah Daerah Kota Medan & atariacorp2026
          </p>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-10px) translateX(5px); }
          50% { transform: translateY(-5px) translateX(-5px); }
          75% { transform: translateY(-15px) translateX(3px); }
        }
        .animate-float {
          animation: float linear infinite;
        }
      `}</style>
    </div>
  );
};

export default GuideView;