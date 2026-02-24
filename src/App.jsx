import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Upload, DollarSign, ArrowDownCircle, Archive, LayoutDashboard, FileText, Calendar, Sparkles, Loader, TrendingUp, BarChartHorizontal, ChevronDown, BookCopy, Search, Sun, Moon, CheckCircle2, AlertCircle, Receipt, Globe, MinusCircle, Droplets, Settings, ArrowRightLeft, LogIn, LogOut, UserCircle, Trash2, UserPlus, ChevronsUpDown, Award, ChevronsLeft, ChevronsRight, PieChart as PieChartIcon, Building, Users, Briefcase, Shuffle, BookMarked, Columns, Edit, X, Tag, ChevronRight, Download, History, ChevronUp } from 'lucide-react';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, onSnapshot, setDoc, collection, getDocs, addDoc, deleteDoc, query, where, writeBatch, getDoc, updateDoc, orderBy, FieldValue } from "firebase/firestore";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";


// --- Firebase Configuration ---
// Konfigurasi dari proyek Firebase Anda
const firebaseConfig = {
  apiKey: "AIzaSyCE_IJlJdEHJKBOiNBMzNCNH_fKH0ln-NA",
  authDomain: "analisis-apbd.firebaseapp.com",
  projectId: "analisis-apbd",
  storageBucket: "analisis-apbd.appspot.com",
  messagingSenderId: "805666292304",
  appId: "1:805666292304:web:247f1e25e3e4d88621c755",
  measurementId: "G-6YDJ88NGWD"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- NEW: Activity Logging Function ---
const logActivity = async (action, details = {}) => {
    try {
        const user = auth.currentUser;
        // Hanya log jika ada pengguna yang masuk
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


// Helper function to format numbers to Indonesian Rupiah
const formatCurrency = (value) => {
  if (typeof value !== 'number' || isNaN(value)) {
    return 'Rp 0';
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// --- Reusable UI Components ---
const SectionTitle = ({ children }) => (
  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">{children}</h2>
);

const Pagination = ({ currentPage, totalPages, onPageChange, theme }) => {
    const getPageNumbers = () => {
        const pageNumbers = [];
        const maxPagesToShow = 3;
        const halfPages = Math.floor(maxPagesToShow / 2);

        if (totalPages <= maxPagesToShow + 2) {
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i);
            }
        } else {
            pageNumbers.push(1);
            if (currentPage > 2 + halfPages) {
                pageNumbers.push('...');
            }

            let start = Math.max(2, currentPage - halfPages);
            let end = Math.min(totalPages - 1, currentPage + halfPages);

            if (currentPage <= 2 + halfPages) {
                start = 2;
                end = maxPagesToShow + 1;
            }
            if (currentPage >= totalPages - 1 - halfPages) {
                start = totalPages - maxPagesToShow;
                end = totalPages - 1;
            }

            for (let i = start; i <= end; i++) {
                pageNumbers.push(i);
            }

            if (currentPage < totalPages - 1 - halfPages) {
                pageNumbers.push('...');
            }
            pageNumbers.push(totalPages);
        }
        return pageNumbers;
    };

    const pages = getPageNumbers();
    const buttonBaseClasses = "px-4 py-2 text-sm rounded-md transition-colors";
    const buttonIdleClasses = "bg-white dark:bg-gray-700 border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600";
    const buttonActiveClasses = "bg-blue-600 text-white border border-blue-600";
    const buttonDisabledClasses = "opacity-50 cursor-not-allowed";

    return (
        <div className="flex justify-center items-center mt-6 space-x-2">
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className={`${buttonBaseClasses} ${buttonIdleClasses} ${currentPage === 1 ? buttonDisabledClasses : ''}`}>Sebelumnya</button>
            {pages.map((page, index) =>
                typeof page === 'number' ? (
                    <button key={index} onClick={() => onPageChange(page)} className={`${buttonBaseClasses} ${currentPage === page ? buttonActiveClasses : buttonIdleClasses}`}>{page}</button>
                ) : (
                    <span key={index} className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">...</span>
                )
            )}
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className={`${buttonBaseClasses} ${buttonIdleClasses} ${currentPage === totalPages ? buttonDisabledClasses : ''}`}>Selanjutnya</button>
        </div>
    );
};

// --- TAMBAHKAN BLOK KODE BARU DI SINI ---
const TabButton = ({ title, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium transition-colors ${isActive ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
    >
        {title}
    </button>
);
// --- AKHIR BLOK KODE BARU ---

// --- Gemini Analysis Component ---
const GeminiAnalysis = ({ getAnalysisPrompt, disabledCondition, theme, allData = null, selectedYear = new Date().getFullYear(), interactivePlaceholder = "Ajukan pertanyaan tentang data...", userRole }) => {
    const [analysis, setAnalysis] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [customQuery, setCustomQuery] = React.useState('');

    // --- NEW: Hide component for viewers ---
    if (userRole === 'viewer') {
        return null;
    }

    const handleGetAnalysis = async (query) => {
        setIsLoading(true);
        setAnalysis('');
        setError('');
        const prompt = getAnalysisPrompt(query, allData);

        try {
            const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
            const payload = { contents: chatHistory };

            // Use serverless proxy to keep API key secret
            const response = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`API call failed with status: ${response.status}`);
            }

            const result = await response.json();

            // Parse result into a plain text string
            const parseGeminiResult = (res) => {
                if (!res) return null;
                if (typeof res === 'string') return res;
                if (res.raw && typeof res.raw === 'string') return res.raw;

                // Common candidate-based shape
                const candidate = res.candidates?.[0] || res.output?.[0] || res;

                // content.parts (Gemini generateContent)
                const parts = candidate?.content?.parts || candidate?.content?.parts?.[0];
                if (Array.isArray(parts) && parts.length > 0) {
                    return parts.map(p => (p && (p.text || p)) || '').join('\n');
                }

                // simple text fields
                if (candidate?.text) return candidate.text;
                if (candidate?.outputText) return candidate.outputText;

                // fallback: try JSON -> string
                try {
                    return JSON.stringify(res);
                } catch (e) {
                    return String(res);
                }
            };

            const text = parseGeminiResult(result);
            if (text) {
                setAnalysis(text);
            } else {
                throw new Error("Respons dari API tidak memiliki format yang diharapkan.");
            }
        } catch (err) {
            console.error("Gemini API error:", err);
            setError("Gagal mendapatkan analisis. Silakan coba lagi nanti.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const renderFormattedText = (text) => {
        const lines = text.split('\n');
        return lines.map((line, index) => {
            if (line.startsWith('### ')) return <h3 key={index} className="text-lg font-bold mt-4 mb-2 text-gray-800 dark:text-gray-200">{line.substring(4)}</h3>;
            if (line.startsWith('## ')) return <h2 key={index} className="text-xl font-bold mt-4 mb-2 text-gray-800 dark:text-gray-200">{line.substring(3)}</h2>;
            if (line.startsWith('# ')) return <h1 key={index} className="text-2xl font-bold mt-4 mb-2 text-gray-800 dark:text-gray-200">{line.substring(2)}</h1>;
            if (line.startsWith('* ')) return <li key={index} className="ml-5 list-disc" dangerouslySetInnerHTML={{ __html: line.substring(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></li>;
            if (line.trim() === '') return <br key={index} />;
            return <p key={index} className="mb-2" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />;
        });
    };

    return (
        <div className="my-8">
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-2 items-center">
                    <input
                        type="text"
                        value={customQuery}
                        onChange={(e) => setCustomQuery(e.target.value)}
                        placeholder={interactivePlaceholder}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                        onClick={() => handleGetAnalysis(customQuery)}
                        disabled={isLoading || disabledCondition || !customQuery}
                        className="flex-shrink-0 flex items-center justify-center w-full md:w-auto px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg shadow-md hover:bg-gray-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Loader className="animate-spin mr-2" size={20} /> : <Search className="mr-2" size={20} />}
                        Tanya AI
                    </button>
                </div>
                <div className="flex justify-end">
                    <button
                        onClick={() => handleGetAnalysis('')}
                        disabled={isLoading || disabledCondition}
                        className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold rounded-lg shadow-md hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Sparkles className="mr-2" size={20} />
                        Beri Analisa & Rekomendasi
                    </button>
                </div>
            </div>
            {(isLoading || analysis || error) && (
                <div className="mt-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border-l-4 border-purple-500">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">Hasil Analisis AI</h3>
                    {isLoading && <div className="flex items-center justify-center h-40"><Loader className="animate-spin text-purple-500" size={40}/></div>}
                    {error && <p className="text-red-600">{error}</p>}
                    {analysis && <div className="prose max-w-none text-gray-700 dark:text-gray-300">{renderFormattedText(analysis)}</div>}
                </div>
            )}
        </div>
    );
};


// --- Main Application Views ---

// 1. Dashboard View: The main overview screen
const DashboardView = ({ data = {}, theme, selectedYear, namaPemda, lastUpdate, userRole, includeNonRKUD, totalRealisasiNonRKUD, userCanUseAi }) => {
  const { anggaran, pendapatan, penerimaanPembiayaan, pengeluaranPembiayaan, realisasi, realisasiPendapatan } = data;
  
  if (!anggaran || !pendapatan || !realisasi || !realisasiPendapatan) {
    return <div className="flex justify-center items-center h-64"><Loader className="animate-spin text-blue-500" size={40} /></div>;
  }
  
  const lastUpdateString = lastUpdate 
    ? new Date(lastUpdate).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric' 
      }) 
    : null;
  
  const {
      totalAnggaran,
      totalPendapatan,
      totalRealisasiBelanja,
      totalGabunganBelanja,
      totalRealisasiPendapatan,
      totalPenerimaanPembiayaan,
      totalPengeluaranPembiayaan
  } = React.useMemo(() => {
      const totalAnggaran = (anggaran || []).reduce((sum, item) => sum + (item.nilai || 0), 0);
      const totalPendapatan = (pendapatan || []).reduce((sum, item) => sum + (item.nilai || 0), 0);
      
      const totalRealisasiBelanja = Object.values(realisasi || {}).flat().reduce((sum, item) => sum + (item.nilai || 0), 0);
      const totalGabunganBelanja = includeNonRKUD ? totalRealisasiBelanja + totalRealisasiNonRKUD : totalRealisasiBelanja;
      
      const totalRealisasiPendapatan = Object.values(realisasiPendapatan || {}).flat().reduce((sum, item) => sum + (item.nilai || 0), 0);
      const totalPenerimaanPembiayaan = (penerimaanPembiayaan || []).reduce((sum, item) => sum + (item.nilai || 0), 0);
      const totalPengeluaranPembiayaan = (pengeluaranPembiayaan || []).reduce((sum, item) => sum + (item.nilai || 0), 0);

      return {
          totalAnggaran, totalPendapatan, totalRealisasiBelanja,
          totalGabunganBelanja, totalRealisasiPendapatan, totalPenerimaanPembiayaan, totalPengeluaranPembiayaan
      };
  }, [anggaran, pendapatan, penerimaanPembiayaan, pengeluaranPembiayaan, realisasi, realisasiPendapatan, includeNonRKUD, totalRealisasiNonRKUD]);

  const penyerapanAnggaranPercentage = totalAnggaran > 0 ? (totalGabunganBelanja / totalAnggaran) * 100 : 0;
  const pencapaianPendapatanPercentage = totalPendapatan > 0 ? (totalRealisasiPendapatan / totalPendapatan) * 100 : 0;
  const penyerapanRkudPercentage = totalAnggaran > 0 ? (totalRealisasiBelanja / totalAnggaran) * 100 : 0;
  const penyerapanNonRkudPercentage = totalAnggaran > 0 ? (totalRealisasiNonRKUD / totalAnggaran) * 100 : 0;

  const sumberDanaData = React.useMemo(() => {
    const danaMap = new Map();
    (anggaran || []).forEach(item => {
        const sumber = item.NamaSumberDana || 'Tidak Diketahui';
        danaMap.set(sumber, (danaMap.get(sumber) || 0) + item.nilai);
    });
    return Array.from(danaMap, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [anggaran]);

  const anggaranPerSkpd = React.useMemo(() => {
    const skpdMap = new Map();
    (anggaran || []).forEach(item => {
        const skpd = item.NamaSKPD || 'Tanpa SKPD';
        const currentValue = skpdMap.get(skpd) || 0;
        skpdMap.set(skpd, currentValue + (item.nilai || 0));
    });
    return Array.from(skpdMap, ([NamaSKPD, nilai]) => ({ NamaSKPD, nilai }))
                .sort((a, b) => b.nilai - a.nilai);
  }, [anggaran]);
  
  const pendapatanPerOpd = React.useMemo(() => {
    const opdMap = new Map();
    (pendapatan || []).forEach(item => {
        const opd = item.NamaOPD || 'Tanpa OPD';
        const currentValue = opdMap.get(opd) || 0;
        opdMap.set(opd, currentValue + (item.nilai || 0));
    });
    return Array.from(opdMap, ([NamaOPD, nilai]) => ({ NamaOPD, nilai }))
                .sort((a, b) => b.nilai - a.nilai);
  }, [pendapatan]);

  const getDashboardAnalysisPrompt = (customQuery, allData) => {
    if (customQuery) {
        let prompt = `Anda adalah seorang analis keuangan ahli untuk ${namaPemda || 'pemerintah daerah'} tahun ${selectedYear}.\n`;
        prompt += `Berdasarkan data yang tersedia, berikan analisis untuk permintaan berikut: "${customQuery}"\n\n`;

        const queryLower = customQuery.toLowerCase();
        let dataFound = false;
        
        const entityName = queryLower.replace(/analisis|untuk|skpd|dinas|badan|kantor|opd|anggaran|pendapatan|realisasi/g, "").trim();

        if (entityName) {
            const filteredAnggaran = (allData.anggaran || []).filter(item => item.NamaSKPD?.toLowerCase().includes(entityName));
            const filteredPendapatan = (allData.pendapatan || []).filter(item => item.NamaOPD?.toLowerCase().includes(entityName));
            const filteredRealisasiBelanja = Object.values(allData.realisasi || {}).flat().filter(item => item.NamaSKPD?.toLowerCase().includes(entityName));
            const filteredRealisasiPendapatan = Object.values(allData.realisasiPendapatan || {}).flat().filter(item => item.SKPD?.toLowerCase().includes(entityName));

            if (filteredAnggaran.length > 0) {
                dataFound = true;
                const total = filteredAnggaran.reduce((s, i) => s + i.nilai, 0);
                prompt += `Data Anggaran untuk "${entityName}":\n- Total Pagu Anggaran: ${formatCurrency(total)}\n`;
            }
            if (filteredPendapatan.length > 0) {
                dataFound = true;
                const total = filteredPendapatan.reduce((s, i) => s + i.nilai, 0);
                prompt += `Data Target Pendapatan untuk "${entityName}":\n- Total Target: ${formatCurrency(total)}\n`;
            }
            if (filteredRealisasiBelanja.length > 0) {
                dataFound = true;
                const total = filteredRealisasiBelanja.reduce((s, i) => s + i.nilai, 0);
                prompt += `Data Realisasi Belanja untuk "${entityName}":\n- Total Realisasi: ${formatCurrency(total)}\n`;
            }
            if (filteredRealisasiPendapatan.length > 0) {
                dataFound = true;
                const total = filteredRealisasiPendapatan.reduce((s, i) => s + i.nilai, 0);
                prompt += `Data Realisasi Pendapatan untuk "${entityName}":\n- Total Realisasi: ${formatCurrency(total)}\n`;
            }
        }

        if (!dataFound) {
            prompt += "Tidak ada data spesifik yang ditemukan untuk permintaan itu. Berikan analisis umum berdasarkan data keseluruhan yang tersedia.";
        } else {
             prompt += "\nBerikan analisis mendalam, temukan anomali, dan berikan rekomendasi yang dapat ditindaklanjuti berdasarkan data yang disaring ini.";
        }
        return prompt;
    }
    
    // --- INI ADALAH PROMPT BARU (AUDITOR AHLI) ---
    return `
    Anda adalah seorang Auditor Ahli dan Penasihat Keuangan Daerah untuk ${namaPemda || 'pemerintah daerah'}.
    Tugas Anda adalah menganalisis data ringkas APBD tahun ${selectedYear} berikut dan memberikan peringatan dini serta rekomendasi kebijakan yang tajam.
    
    Data Ringkas:
    - Target Pendapatan: ${formatCurrency(totalPendapatan)}
    - Realisasi Pendapatan: ${formatCurrency(totalRealisasiPendapatan)} (${pencapaianPendapatanPercentage.toFixed(2)}%)
    - Pagu Anggaran Belanja: ${formatCurrency(totalAnggaran)}
    - Realisasi Belanja (Gabungan): ${formatCurrency(totalGabunganBelanja)} (${penyerapanAnggaranPercentage.toFixed(2)}%)
     - (Rincian: RKUD ${formatCurrency(totalRealisasiBelanja)}, Non-RKUD ${formatCurrency(totalRealisasiNonRKUD)})
    - Target Penerimaan Pembiayaan: ${formatCurrency(totalPenerimaanPembiayaan)}
    - Target Pengeluaran Pembiayaan: ${formatCurrency(totalPengeluaranPembiayaan)}
    
    Format Laporan Anda HARUS JELAS dan TEGAS. Gunakan format Markdown:
    
    ### 1. PERINGATAN UTAMA (TEMUAN PALING KRITIS)
    (Identifikasi 1-2 masalah paling mendesak. Misalnya: Penyerapan anggaran sangat rendah? Realisasi pendapatan jauh dari target?)
    
    ### 2. ANALISIS RISIKO
    (Jelaskan 2-3 risiko utama yang mungkin terjadi jika peringatan di atas tidak ditangani. Misalnya: Risiko SiLPA tinggi, Risiko gagal bayar proyek, Risiko target PAD tidak tercapai.)
    
    ### 3. REKOMENDASI KEBIJAKAN YANG DAPAT DITINDAKLANJUTI
    (Berikan 3-5 poin rekomendasi yang spesifik, konkret, dan langsung dapat dieksekusi oleh pimpinan daerah untuk mengatasi risiko tersebut.)
    `;
    // --- AKHIR DARI PROMPT BARU ---
  };
  
  const apbdChartData = [
      { name: 'Pendapatan Daerah', Target: totalPendapatan, Realisasi: totalRealisasiPendapatan },
      { name: 'Belanja Daerah', Target: totalAnggaran, Realisasi: totalGabunganBelanja },
      { name: 'Penerimaan Pembiayaan', Target: totalPenerimaanPembiayaan, Realisasi: 0 },
      { name: 'Pengeluaran Pembiayaan', Target: totalPengeluaranPembiayaan, Realisasi: 0 },
  ];
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560', '#8884d8', '#82ca9d'];

  // --- KOMPONEN KARTU STATISTIK YANG DIPERBARUI ---
  const StatCard = ({ icon, title, target, realisasi, percentage, colorClass, rkud, nonRkud, rkudPercentage, nonRkudPercentage }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md flex flex-col justify-between min-h-[220px]">
        <div>
            <div className="flex justify-between items-center mb-4">
                <div className={`p-2 rounded-full bg-${colorClass}-100 dark:bg-${colorClass}-900/50`}>
                    {icon}
                </div>
                <h3 className="font-bold text-gray-700 dark:text-gray-300">{title}</h3>
            </div>
            {title === 'Belanja Daerah' ? (
                <>
                    <p className="text-3xl font-bold text-gray-800 dark:text-gray-200">{formatCurrency(target)}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Pagu Anggaran</p>
                    <div className="mt-4 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                        <p>Realisasi Riil (RKUD): <span className="font-semibold float-right">{formatCurrency(rkud)} ({rkudPercentage.toFixed(2)}%)</span></p>
                        <p>Realisasi Riil (Non RKUD): <span className="font-semibold float-right">{formatCurrency(nonRkud)} ({nonRkudPercentage.toFixed(2)}%)</span></p>
                        <p className="font-bold">Total Realisasi Riil: <span className="font-bold float-right">{formatCurrency(realisasi)} ({percentage.toFixed(2)}%)</span></p>
                    </div>
                </>
            ) : (
                <>
                    <p className="text-3xl font-bold text-gray-800 dark:text-gray-200">{formatCurrency(target)}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Realisasi Riil {formatCurrency(realisasi)}</p>
                </>
            )}
        </div>
        <div className="mt-6">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className={`h-2 bg-${colorClass}-500 rounded-full`} style={{ width: `${percentage > 100 ? 100 : percentage}%` }}></div>
            </div>
            <p className={`text-right mt-2 font-bold text-sm text-${colorClass}-600 dark:text-${colorClass}-400`}>{percentage.toFixed(2)}%</p>
        </div>
    </div>
  );
  // --- AKHIR DARI KOMPONEN KARTU STATISTIK ---

  return (
    <div className="space-y-8">
        <div className="flex justify-between items-center">
            <SectionTitle>Dashboard & Analisis Interaktif</SectionTitle>
            {lastUpdateString && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Data Realisasi Diperbarui Pada: {lastUpdateString}
                </p>
            )}
        </div>
        <GeminiAnalysis 
            getAnalysisPrompt={getDashboardAnalysisPrompt} 
            disabledCondition={totalAnggaran === 0 && totalPendapatan === 0} 
            theme={theme}
            allData={data}
            selectedYear={selectedYear}
            interactivePlaceholder="Contoh: Analisis anggaran untuk Dinas Pendidikan"
            userRole={userRole}
            userCanUseAi={userCanUseAi} // <-- TAMBAHKAN BARIS VIEWE TIDAK DAPAT FITUR AI
        />
       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <StatCard 
                icon={<ArrowDownCircle className="text-blue-500" size={24} />}
                title="Pendapatan Daerah"
                target={totalPendapatan}
                realisasi={totalRealisasiPendapatan}
                percentage={pencapaianPendapatanPercentage}
                colorClass="blue"
            />
            {/* --- KARTU BELANJA YANG DIPERBARUI --- */}
            <StatCard 
                icon={<Receipt className="text-red-500" size={24} />}
                title="Belanja Daerah"
                target={totalAnggaran}
                realisasi={totalGabunganBelanja}
                percentage={penyerapanAnggaranPercentage}
                colorClass="red"
                rkud={totalRealisasiBelanja}
                nonRkud={totalRealisasiNonRKUD}
                rkudPercentage={penyerapanRkudPercentage}
                nonRkudPercentage={penyerapanNonRkudPercentage}
            />
            <StatCard 
                icon={<Globe className="text-gray-500" size={24} />}
                title="Penerimaan Pembiayaan"
                target={totalPenerimaanPembiayaan}
                realisasi={0}
                percentage={0}
                colorClass="gray"
            />
            <StatCard 
                icon={<MinusCircle className="text-green-500" size={24} />}
                title="Pengeluaran Pembiayaan"
                target={totalPengeluaranPembiayaan}
                realisasi={0}
                percentage={0}
                colorClass="green"
            />
       </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Grafik APBD</h3>
            <ResponsiveContainer width="100%" height={400}>
                <BarChart data={apbdChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(val) => `${(val / 1e9).toFixed(1)} M`} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="Target" fill="#435EBE" name="Target/Pagu" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Realisasi" fill="#1E293B" name="Realisasi" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Anggaran Belanja per SKPD (Top 10)</h3>
                <ResponsiveContainer width="100%" height={450}>
                    <BarChart data={anggaranPerSkpd.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 30, left: 150, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                        <XAxis type="number" tickFormatter={(val) => `${(val / 1e9).toFixed(1)} M`} tick={{ fontSize: 12 }} />
                        <YAxis type="category" dataKey="NamaSKPD" tick={{ fontSize: 12, width: 140 }} />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Bar dataKey="nilai" name="Anggaran">
                            {anggaranPerSkpd.slice(0, 10).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Komposisi Pendapatan per OPD (Top 10)</h3>
                <ResponsiveContainer width="100%" height={450}>
                    <BarChart data={pendapatanPerOpd.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                        <XAxis type="number" tickFormatter={(val) => `${(val / 1e9).toFixed(1)} M`} tick={{ fontSize: 12 }} />
                        <YAxis type="category" dataKey="NamaOPD" tick={{ fontSize: 12, width: 90 }}/>
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Bar dataKey="nilai" name="Target Pendapatan">
                            {pendapatanPerOpd.slice(0, 10).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mt-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Komposisi Sumber Dana</h3>
            <ResponsiveContainer width="100%" height={450}>
                <BarChart data={sumberDanaData} margin={{ top: 5, right: 30, left: 20, bottom: 120 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(val) => `${(val / 1e9).toFixed(1)} M`} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="value" name="Pagu Anggaran" radius={[4, 4, 0, 0]}>
                        {sumberDanaData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    </div>
  );
};

// --- Analisis Kinerja View ---
const AnalisisKinerjaView = ({ theme, user, selectedYear, namaPemda }) => {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    const [yearA, setYearA] = React.useState(selectedYear);
    const [yearB, setYearB] = React.useState(selectedYear - 1);
    const [startMonth, setStartMonth] = React.useState(months[0]);
    const [endMonth, setEndMonth] = React.useState(months[months.length - 1]);
    const [analysisType, setAnalysisType] = React.useState('Belanja'); // 'Belanja' atau 'Pendapatan'
    const [dataA, setDataA] = React.useState(null);
    const [dataB, setDataB] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [sortConfig, setSortConfig] = React.useState({ key: 'kinerjaA', direction: 'descending' });
    const [selectedSkpd, setSelectedSkpd] = React.useState('Semua SKPD');

    // 1. Memperbarui fungsi untuk mengambil data realisasiNonRkud
    const fetchDataForYear = async (year) => {
        if (!user) return null;
        const dataTypes = ['anggaran', 'pendapatan', 'realisasi', 'realisasiPendapatan', 'realisasiNonRkud'];
        const yearData = {};
        for (const dataType of dataTypes) {
            const collRef = collection(db, "publicData", String(year), dataType);
            const snapshot = await getDocs(query(collRef));
            let data = [];
            snapshot.forEach(doc => { data = [...data, ...doc.data().data]; });
            // Menambahkan realisasiNonRkud ke dalam logika data bulanan
            if (dataType === 'realisasi' || dataType === 'realisasiPendapatan' || dataType === 'realisasiNonRkud') {
                yearData[dataType] = data.reduce((acc, item) => {
                    const month = item.month || 'Lainnya';
                    if (!acc[month]) acc[month] = [];
                    acc[month].push(item);
                    return acc;
                }, {});
            } else {
                yearData[dataType] = data;
            }
        }
        return yearData;
    };

    React.useEffect(() => {
        const loadComparisonData = async () => {
            if (yearA === yearB) {
                setError("Silakan pilih dua tahun yang berbeda untuk perbandingan.");
                setDataA(null); setDataB(null);
                return;
            }
            setError(''); setIsLoading(true);
            try {
                const [fetchedDataA, fetchedDataB] = await Promise.all([fetchDataForYear(yearA), fetchDataForYear(yearB)]);
                setDataA(fetchedDataA); setDataB(fetchedDataB);
            } catch (e) {
                console.error("Error fetching comparison data:", e);
                setError("Gagal memuat data perbandingan.");
            } finally {
                setIsLoading(false);
            }
        };
        if (user) { loadComparisonData(); }
    }, [yearA, yearB, user]);

    const { performanceData, skpdList, radarData } = React.useMemo(() => {
        if (!dataA || !dataB) return { performanceData: [], skpdList: [], radarData: [] };

        let skpdMap = new Map();
        const processData = (data, year, type) => {
            const startIndex = months.indexOf(startMonth);
            const endIndex = months.indexOf(endMonth);
            const selectedMonths = months.slice(startIndex, endIndex + 1);

            // 2. Menggabungkan data realisasi biasa dengan realisasi Non RKUD
            let realisasiData = [];
            if (type === 'Belanja') {
                const realisasiBiasa = selectedMonths.map(month => data.realisasi?.[month] || []).flat();
                const realisasiNonRkudData = selectedMonths.map(month => data.realisasiNonRkud?.[month] || []).flat();
                realisasiData = [...realisasiBiasa, ...realisasiNonRkudData];
            } else { // Pendapatan
                realisasiData = selectedMonths.map(month => data.realisasiPendapatan?.[month] || []).flat();
            }

            const targetData = data[type === 'Belanja' ? 'anggaran' : 'pendapatan'] || [];

            targetData.forEach(item => {
                const skpdName = item.NamaSKPD || item.NamaOPD || 'Tanpa SKPD/OPD';
                if (!skpdMap.has(skpdName)) skpdMap.set(skpdName, { skpd: skpdName });
                const skpd = skpdMap.get(skpdName);
                if (type === 'Belanja') {
                    skpd[`pagu${year}`] = (skpd[`pagu${year}`] || 0) + (item.nilai || 0);
                } else {
                    skpd[`target${year}`] = (skpd[`target${year}`] || 0) + (item.nilai || 0);
                }
            });

            realisasiData.forEach(item => {
                // 3. Menyamakan nama kolom (NamaSKPD vs NAMASKPD)
                const skpdName = item.NamaSKPD || item.SKPD || item.NAMASKPD || 'Tanpa SKPD/OPD';
                if (!skpdMap.has(skpdName)) skpdMap.set(skpdName, { skpd: skpdName });
                const skpd = skpdMap.get(skpdName);
                skpd[`realisasi${year}`] = (skpd[`realisasi${year}`] || 0) + (item.nilai || 0);
            });
        };

        processData(dataA, 'A', analysisType);
        processData(dataB, 'B', analysisType);
        
        const skpdList = Array.from(skpdMap.keys()).sort();

        const performanceData = Array.from(skpdMap.values()).map(skpd => {
            if (analysisType === 'Belanja') {
                const paguA = skpd.paguA || 0;
                const realisasiA = skpd.realisasiA || 0;
                const paguB = skpd.paguB || 0;
                const realisasiB = skpd.realisasiB || 0;
                return {
                    ...skpd, paguA, realisasiA, paguB, realisasiB,
                    kinerjaA: paguA > 0 ? (realisasiA / paguA) * 100 : 0,
                    kinerjaB: paguB > 0 ? (realisasiB / paguB) * 100 : 0,
                };
            } else { // Pendapatan
                const targetA = skpd.targetA || 0;
                const realisasiA = skpd.realisasiA || 0;
                const targetB = skpd.targetB || 0;
                const realisasiB = skpd.realisasiB || 0;
                return {
                    ...skpd, targetA, realisasiA, targetB, realisasiB,
                    kinerjaA: targetA > 0 ? (realisasiA / targetA) * 100 : 0,
                    kinerjaB: targetB > 0 ? (realisasiB / targetB) * 100 : 0,
                };
            }
        });
        
        let radarData = [];
        if (selectedSkpd !== 'Semua SKPD') {
            const skpdData = performanceData.find(d => d.skpd === selectedSkpd);
            if (skpdData) {
                const targetLabel = analysisType === 'Belanja' ? 'Pagu' : 'Target';
                radarData = [
                    { subject: targetLabel, A: skpdData[analysisType === 'Belanja' ? 'paguA' : 'targetA'], B: skpdData[analysisType === 'Belanja' ? 'paguB' : 'targetB'], fullMark: Math.max(skpdData[analysisType === 'Belanja' ? 'paguA' : 'targetA'], skpdData[analysisType === 'Belanja' ? 'paguB' : 'targetB']) * 1.1 },
                    { subject: 'Realisasi', A: skpdData.realisasiA, B: skpdData.realisasiB, fullMark: Math.max(skpdData.realisasiA, skpdData.realisasiB) * 1.1 },
                    { subject: 'Kinerja (%)', A: skpdData.kinerjaA, B: skpdData.kinerjaB, fullMark: 100 },
                ];
            }
        }

        return { performanceData, skpdList, radarData };

    }, [dataA, dataB, analysisType, startMonth, endMonth, selectedSkpd]);

    const sortedData = React.useMemo(() => {
        let dataToDisplay = performanceData;
        if (selectedSkpd !== 'Semua SKPD') {
            dataToDisplay = performanceData.filter(item => item.skpd === selectedSkpd);
        }
        
        if (sortConfig.key) {
            return [...dataToDisplay].sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return dataToDisplay;
    }, [performanceData, sortConfig, selectedSkpd]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };
    
    const getAnalysisPrompt = (customQuery) => {
        if (customQuery) return `Berdasarkan data kinerja ${analysisType}, berikan analisis untuk: "${customQuery}"`;
        if (sortedData.length === 0) return "Data tidak cukup untuk analisis.";
        
        const top5 = sortedData.slice(0, 5);
        const bottom5 = sortedData.slice(-5).reverse();
        const period = startMonth === endMonth ? startMonth : `periode ${startMonth} - ${endMonth}`;

        const formatItem = (item) => analysisType === 'Belanja'
            ? `- **${item.skpd}**: Kinerja ${yearA}: ${item.kinerjaA.toFixed(2)}%, Kinerja ${yearB}: ${item.kinerjaB.toFixed(2)}%`
            : `- **${item.skpd}**: Kinerja ${yearA}: ${item.kinerjaA.toFixed(2)}%, Kinerja ${yearB}: ${item.kinerjaB.toFixed(2)}%`;

        return `
            Anda adalah seorang analis kinerja untuk ${namaPemda || 'pemerintah daerah'}. Lakukan analisis perbandingan kinerja **${analysisType}** SKPD antara tahun **${yearA}** dan **${yearB}** untuk **${period}**.
            ${selectedSkpd !== 'Semua SKPD' ? `Fokus analisis pada: **${selectedSkpd}**.` : ''}

            ### SKPD Kinerja Tertinggi (${yearA})
            ${top5.map(formatItem).join('\n')}

            ### SKPD Kinerja Terendah (${yearA})
            ${bottom5.map(formatItem).join('\n')}

            Berikan analisis mendalam mengenai:
            1.  Perubahan kinerja yang signifikan antara dua tahun. Identifikasi SKPD yang menunjukkan peningkatan atau penurunan drastis.
            2.  Kemungkinan faktor penyebab di balik kinerja tinggi atau rendah (misalnya, efektivitas program, perubahan target, dll.).
            3.  Rekomendasi strategis untuk SKPD berkinerja rendah dan cara mempertahankan atau meningkatkan kinerja bagi SKPD berkinerja tinggi.
        `;
    };
    
    const renderSortIcon = (key) => {
        if (sortConfig.key !== key) return <ChevronsUpDown size={14} className="ml-1 text-gray-400" />;
        return sortConfig.direction === 'ascending' ? <ChevronDown size={14} className="ml-1" /> : <ChevronDown size={14} className="ml-1 transform rotate-180" />;
    };

    const renderGrowth = (valA, valB) => {
        const change = valA - valB;
        if (valA === 0 && valB === 0) return <span className="text-gray-500">-</span>;
        const color = change >= 0 ? 'text-green-500' : 'text-red-500';
        return <span className={color}>{change.toFixed(2)} pp</span>;
    };
    
    const tableHeaders = analysisType === 'Belanja'
        ? [
            { key: 'skpd', label: 'Nama SKPD' },
            { key: 'paguB', label: `Pagu ${yearB}` },
            { key: 'paguA', label: `Pagu ${yearA}` },
            { key: 'realisasiB', label: `Realisasi ${yearB}` },
            { key: 'realisasiA', label: `Realisasi ${yearA}` },
            { key: 'kinerjaB', label: `Penyerapan ${yearB} (%)` },
            { key: 'kinerjaA', label: `Penyerapan ${yearA} (%)` },
            { key: 'growth', label: 'Perubahan Kinerja (pp)' },
          ]
        : [
            { key: 'skpd', label: 'Nama SKPD/OPD' },
            { key: 'targetB', label: `Target ${yearB}` },
            { key: 'targetA', label: `Target ${yearA}` },
            { key: 'realisasiB', label: `Realisasi ${yearB}` },
            { key: 'realisasiA', label: `Realisasi ${yearA}` },
            { key: 'kinerjaB', label: `Pencapaian ${yearB} (%)` },
            { key: 'kinerjaA', label: `Pencapaian ${yearA} (%)` },
            { key: 'growth', label: 'Perubahan Kinerja (pp)' },
          ];

    return (
        <div className="space-y-6">
            <SectionTitle>Analisis Kinerja SKPD</SectionTitle>
            <GeminiAnalysis getAnalysisPrompt={getAnalysisPrompt} disabledCondition={sortedData.length === 0} theme={theme} />
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <select value={yearA} onChange={e => setYearA(parseInt(e.target.value))} className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <select value={yearB} onChange={e => setYearB(parseInt(e.target.value))} className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <select value={analysisType} onChange={e => setAnalysisType(e.target.value)} className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                        <option>Belanja</option>
                        <option>Pendapatan</option>
                    </select>
                    <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <select value={startMonth} onChange={e => setStartMonth(e.target.value)} className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                            {months.map(m => <option key={`start-${m}`} value={m}>Dari: {m}</option>)}
                        </select>
                        <select value={endMonth} onChange={e => setEndMonth(e.target.value)} className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                            {months.map(m => <option key={`end-${m}`} value={m}>Sampai: {m}</option>)}
                        </select>
                        <select value={selectedSkpd} onChange={e => setSelectedSkpd(e.target.value)} className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                            <option>Semua SKPD</option>
                            {skpdList.map(skpd => <option key={skpd} value={skpd}>{skpd}</option>)}
                        </select>
                    </div>
                </div>
                {isLoading && <div className="text-center py-10"><Loader className="animate-spin mx-auto text-purple-500" size={40}/></div>}
                {error && <p className="text-center text-red-500 py-10">{error}</p>}
                {!isLoading && !error && (
                    <>
                    {selectedSkpd !== 'Semua SKPD' && radarData.length > 0 && (
                        <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 text-center">Perbandingan Kinerja Head-to-Head: {selectedSkpd}</h3>
                            <ResponsiveContainer width="100%" height={400}>
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="subject" />
                                    <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} tickFormatter={(value, index) => index === 2 ? `${value}%` : ''} />
                                    <Tooltip formatter={(value, name, props) => props.payload.subject === 'Kinerja (%)' ? `${value.toFixed(2)}%` : formatCurrency(value)} />
                                    <Legend />
                                    <Radar name={yearA} dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                                    <Radar name={yearB} dataKey="B" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    {tableHeaders.map(header => (
                                        <th key={header.key} onClick={() => header.key !== 'growth' && requestSort(header.key)} className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${header.key !== 'growth' ? 'cursor-pointer' : ''}`}>
                                            <div className="flex items-center">{header.label} {header.key !== 'growth' && renderSortIcon(header.key)}</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {sortedData.map((item) => (
                                    <tr key={item.skpd} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100 max-w-xs whitespace-normal break-words">{item.skpd}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">{formatCurrency(analysisType === 'Belanja' ? item.paguB : item.targetB)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">{formatCurrency(analysisType === 'Belanja' ? item.paguA : item.targetA)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">{formatCurrency(item.realisasiB)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">{formatCurrency(item.realisasiA)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold" style={{ color: item.kinerjaB > 85 ? '#10B981' : item.kinerjaB < 50 ? '#EF4444' : 'inherit' }}>{item.kinerjaB.toFixed(2)}%</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold" style={{ color: item.kinerjaA > 85 ? '#10B981' : item.kinerjaA < 50 ? '#EF4444' : 'inherit' }}>{item.kinerjaA.toFixed(2)}%</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold">{renderGrowth(item.kinerjaA, item.kinerjaB)}</td>
                                    </tr>
                                ))}
                                {sortedData.length === 0 && <tr><td colSpan={tableHeaders.length} className="text-center py-8 text-gray-500">Tidak ada data untuk ditampilkan.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                    </>
                )}
            </div>
        </div>
    );
};
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
        <div className="space-y-6">
            <SectionTitle>Penandaan Tematik</SectionTitle>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <div className="max-w-md mb-6">
                    <label htmlFor="tematik-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pilih Jenis Penandaan Tematik:</label>
                    <select
                        id="tematik-select"
                        value={selectedTematik}
                        onChange={(e) => setSelectedTematik(e.target.value)}
                        className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        {Object.entries(tematikOptions).map(([key, value]) => (
                            <option key={key} value={key}>{value.title}</option>
                        ))}
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


// --- UPDATED: SumberDanaStatsView dengan Sub Kegiatan ---
const SumberDanaStatsView = ({ data, theme, namaPemda, userRole }) => {
    const { anggaran, realisasi, realisasiNonRkud } = data;
    
    const [selectedSkpd, setSelectedSkpd] = React.useState('Semua SKPD');
    const [selectedSubKegiatan, setSelectedSubKegiatan] = React.useState('Semua Sub Kegiatan'); // <-- NEW
    const [selectedSumberDana, setSelectedSumberDana] = React.useState('Semua Sumber Dana');
    const [selectedRekening, setSelectedRekening] = React.useState('Semua Rekening');
    
    const [statsData, setStatsData] = React.useState([]);
    const [currentPage, setCurrentPage] = React.useState(1);
    const ITEMS_PER_PAGE = 15;

    // --- Memoized Lists for Filters ---
    const skpdList = React.useMemo(() => Array.from(new Set((anggaran || []).map(item => item.NamaSKPD).filter(Boolean))).sort(), [anggaran]);
    
    const subKegiatanList = React.useMemo(() => {
        let filtered = (anggaran || []);
        if (selectedSkpd !== 'Semua SKPD') {
            filtered = filtered.filter(item => item.NamaSKPD === selectedSkpd);
        }
        return Array.from(new Set(filtered.map(item => item.NamaSubKegiatan).filter(Boolean))).sort();
    }, [anggaran, selectedSkpd]);

    const sumberDanaList = React.useMemo(() => {
        let filtered = (anggaran || []);
        if (selectedSkpd !== 'Semua SKPD') filtered = filtered.filter(item => item.NamaSKPD === selectedSkpd);
        if (selectedSubKegiatan !== 'Semua Sub Kegiatan') filtered = filtered.filter(item => item.NamaSubKegiatan === selectedSubKegiatan);
        return Array.from(new Set(filtered.map(item => item.NamaSumberDana).filter(Boolean))).sort();
    }, [anggaran, selectedSkpd, selectedSubKegiatan]);

    const rekeningList = React.useMemo(() => {
        let filtered = (anggaran || []);
        if (selectedSkpd !== 'Semua SKPD') filtered = filtered.filter(item => item.NamaSKPD === selectedSkpd);
        if (selectedSubKegiatan !== 'Semua Sub Kegiatan') filtered = filtered.filter(item => item.NamaSubKegiatan === selectedSubKegiatan);
        if (selectedSumberDana !== 'Semua Sumber Dana') filtered = filtered.filter(item => item.NamaSumberDana === selectedSumberDana);
        return Array.from(new Set(filtered.map(item => item.NamaRekening).filter(Boolean))).sort();
    }, [anggaran, selectedSkpd, selectedSubKegiatan, selectedSumberDana]);

    // --- Data Processing ---
    React.useEffect(() => {
        const normalizeRealisasiItem = (item, isNonRkud = false) => {
            if (!item) return null;
            return {
                NamaSKPD: isNonRkud ? item.NAMASKPD : item.NamaSKPD,
                NamaRekening: isNonRkud ? item.NAMAREKENING : item.NamaRekening,
                nilai: item.nilai || 0
            };
        };

        const allRealisasi = [
            ...Object.values(realisasi || {}).flat().map(item => normalizeRealisasiItem(item, false)),
            ...Object.values(realisasiNonRkud || {}).flat().map(item => normalizeRealisasiItem(item, true))
        ].filter(Boolean);
        
        // 1. Group Budget by SKPD + SubKegiatan + SumberDana + Rekening
        const dataMap = new Map();

        (anggaran || []).forEach(item => {
            if (!item || !item.NamaSumberDana || !item.NamaRekening) return;
            // Include SubKegiatan in the key to separate budgets
            const key = `${item.NamaSKPD}|${item.NamaSubKegiatan}|${item.NamaSumberDana}|${item.NamaRekening}`;
            
            if (!dataMap.has(key)) {
                dataMap.set(key, {
                    skpd: item.NamaSKPD,
                    subKegiatan: item.NamaSubKegiatan, // <-- NEW
                    sumberDana: item.NamaSumberDana,
                    rekening: item.NamaRekening,
                    anggaran: 0,
                    realisasi: 0,
                });
            }
            dataMap.get(key).anggaran += item.nilai || 0;
        });
        
        // 2. Map Realization (aggregated by SKPD + Rekening for robustness)
        // Note: Since raw realization data often lacks clean SubActivity names matching Anggaran,
        // we use proportional distribution based on SKPD+Rekening totals.
        const realisasiPerRekening = new Map();
        allRealisasi.forEach(item => {
            if (!item || !item.NamaSKPD || !item.NamaRekening) return;
            const key = `${item.NamaSKPD}|${item.NamaRekening}`;
            realisasiPerRekening.set(key, (realisasiPerRekening.get(key) || 0) + (item.nilai || 0));
        });

        const anggaranPerRekening = new Map();
        dataMap.forEach((value) => {
            const key = `${value.skpd}|${value.rekening}`;
            anggaranPerRekening.set(key, (anggaranPerRekening.get(key) || 0) + value.anggaran);
        });

        // 3. Distribute Realization
        dataMap.forEach((value) => {
            const key = `${value.skpd}|${value.rekening}`;
            const totalRealisasiForRekening = realisasiPerRekening.get(key) || 0;
            const totalAnggaranForRekening = anggaranPerRekening.get(key) || 0;
            
            if (totalAnggaranForRekening > 0) {
                const proportion = value.anggaran / totalAnggaranForRekening;
                value.realisasi = totalRealisasiForRekening * proportion;
            }
        });

        const finalData = Array.from(dataMap.values()).map(item => ({
            ...item,
            sisaAnggaran: item.anggaran - item.realisasi,
            persentase: item.anggaran > 0 ? (item.realisasi / item.anggaran) * 100 : 0,
        }));

        setStatsData(finalData.sort((a, b) => b.anggaran - a.anggaran));
    }, [anggaran, realisasi, realisasiNonRkud]);

    // --- Filtering ---
    const filteredData = React.useMemo(() => {
        return statsData.filter(item => {
            const skpdMatch = selectedSkpd === 'Semua SKPD' || item.skpd === selectedSkpd;
            const subKegiatanMatch = selectedSubKegiatan === 'Semua Sub Kegiatan' || item.subKegiatan === selectedSubKegiatan;
            const sumberDanaMatch = selectedSumberDana === 'Semua Sumber Dana' || item.sumberDana === selectedSumberDana;
            const rekeningMatch = selectedRekening === 'Semua Rekening' || item.rekening === selectedRekening;
            return skpdMatch && subKegiatanMatch && sumberDanaMatch && rekeningMatch;
        });
    }, [statsData, selectedSkpd, selectedSubKegiatan, selectedSumberDana, selectedRekening]);
    
    // --- Summary Logic ---
    const summaryBySumberDana = React.useMemo(() => {
        if (selectedSkpd === 'Semua SKPD') return [];

        const summaryMap = new Map();
        // Filter based on current view criteria (minus Sumber Dana itself to show distribution)
        statsData
            .filter(item => item.skpd === selectedSkpd && (selectedSubKegiatan === 'Semua Sub Kegiatan' || item.subKegiatan === selectedSubKegiatan))
            .forEach(item => {
                const sumber = item.sumberDana || 'Tidak Diketahui';
                if (!summaryMap.has(sumber)) {
                    summaryMap.set(sumber, { anggaran: 0, realisasi: 0 });
                }
                const current = summaryMap.get(sumber);
                current.anggaran += item.anggaran;
                current.realisasi += item.realisasi;
            });
            
        return Array.from(summaryMap, ([name, values]) => ({
            name,
            anggaran: values.anggaran,
            realisasi: values.realisasi,
            sisaAnggaran: values.anggaran - values.realisasi,
            penyerapan: values.anggaran > 0 ? (values.realisasi / values.anggaran) * 100 : 0
        })).sort((a, b) => b.anggaran - a.anggaran);

    }, [statsData, selectedSkpd, selectedSubKegiatan]);

    // --- Pagination & Reset Effects ---
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const paginatedData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handlePageChange = (page) => {
        if (page > 0 && page <= totalPages) setCurrentPage(page);
    };
    
    React.useEffect(() => { 
        setSelectedSubKegiatan('Semua Sub Kegiatan'); 
        setSelectedSumberDana('Semua Sumber Dana'); 
        setSelectedRekening('Semua Rekening'); 
        setCurrentPage(1); 
    }, [selectedSkpd]);
    
    React.useEffect(() => { 
        setSelectedSumberDana('Semua Sumber Dana'); 
        setSelectedRekening('Semua Rekening'); 
        setCurrentPage(1); 
    }, [selectedSubKegiatan]);

    // --- Handlers ---
    const handleDownloadExcel = () => {
        if (!window.XLSX) { alert("Pustaka unduh Excel tidak tersedia."); return; }
        if (filteredData.length === 0) { alert("Tidak ada data untuk diunduh."); return; }

        const dataForExport = filteredData.map(item => ({
            'SKPD': item.skpd,
            'Sub Kegiatan': item.subKegiatan, // <-- Added to Excel
            'Sumber Dana': item.sumberDana,
            'Nama Rekening': item.rekening,
            'Anggaran': item.anggaran,
            'Realisasi': item.realisasi,
            'Sisa Anggaran': item.sisaAnggaran,
            'Penyerapan (%)': item.persentase.toFixed(2),
        }));

        const worksheet = window.XLSX.utils.json_to_sheet(dataForExport);
        const workbook = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(workbook, worksheet, "Data Sumber Dana");
        window.XLSX.writeFile(workbook, `Statistik_Sumber_Dana_${selectedSkpd.substring(0,20)}.xlsx`);
    };
    
    const getAnalysisPrompt = (customQuery) => {
        if (customQuery) return `Berdasarkan data, analisis: "${customQuery}"`;
        
        const focus = selectedSkpd === 'Semua SKPD' ? 'keseluruhan APBD' : `SKPD ${selectedSkpd}`;
        const subActivityFocus = selectedSubKegiatan !== 'Semua Sub Kegiatan' ? `pada Sub Kegiatan: "${selectedSubKegiatan}"` : '';
        
        // Find lowest absorption items to highlight issues
        const issues = statsData
            .filter(d => d.anggaran > 100000000 && d.persentase < 40) // > 100jt and < 40%
            .slice(0, 3)
            .map(d => `- ${d.subKegiatan} (${d.sumberDana}): ${d.persentase.toFixed(1)}%`)
            .join('\n');

        return `
            Lakukan analisis mendalam mengenai efektivitas penggunaan Sumber Dana untuk **${focus}** ${subActivityFocus}.
            
            Fokuskan analisis pada:
            1.  Kesesuaian antara Sub Kegiatan dengan Sumber Dananya (misal: Apakah DAK fisik terserap dengan baik di kegiatan fisik?).
            2.  Identifikasi *bottleneck*. Berikut adalah beberapa aktivitas dengan penyerapan rendah yang mungkin perlu perhatian:
            ${issues}
            3.  Rekomendasi strategis untuk percepatan penyerapan sisa anggaran yang tersedia.
        `;
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#82ca9d'];

    return (
        <div className="space-y-6">
            <SectionTitle>Statistik Sumber Dana per SKPD & Sub Kegiatan</SectionTitle>
             <GeminiAnalysis 
                getAnalysisPrompt={getAnalysisPrompt} 
                disabledCondition={statsData.length === 0} 
                theme={theme}
                interactivePlaceholder="Analisis penyerapan DAK pada kegiatan fisik..."
                userRole={userRole}
            />
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* SKPD Filter */}
                    <div className="lg:col-span-1">
                        <label className="block text-xs font-medium text-gray-500 mb-1">SKPD</label>
                        <select value={selectedSkpd} onChange={(e) => setSelectedSkpd(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                            <option>Semua SKPD</option>
                            {skpdList.map(skpd => <option key={skpd} value={skpd}>{skpd}</option>)}
                        </select>
                    </div>

                    {/* Sub Kegiatan Filter - NEW */}
                    <div className="lg:col-span-1">
                         <label className="block text-xs font-medium text-gray-500 mb-1">Sub Kegiatan</label>
                        <select value={selectedSubKegiatan} onChange={(e) => setSelectedSubKegiatan(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                            <option>Semua Sub Kegiatan</option>
                            {subKegiatanList.map(sub => <option key={sub} value={sub}>{sub.length > 50 ? sub.substring(0,50)+'...' : sub}</option>)}
                        </select>
                    </div>

                    {/* Sumber Dana Filter */}
                    <div className="lg:col-span-1">
                         <label className="block text-xs font-medium text-gray-500 mb-1">Sumber Dana</label>
                        <select value={selectedSumberDana} onChange={(e) => setSelectedSumberDana(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                            <option>Semua Sumber Dana</option>
                            {sumberDanaList.map(dana => <option key={dana} value={dana}>{dana}</option>)}
                        </select>
                    </div>

                     {/* Download Button */}
                    <div className="lg:col-span-1 flex items-end">
                        <button onClick={handleDownloadExcel} disabled={filteredData.length === 0} className="w-full flex items-center justify-center px-4 py-2 border border-green-600 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                            <Download size={16} className="mr-2"/> Unduh Excel
                        </button>
                    </div>
                </div>

                {/* Summary Chart Section */}
                {selectedSkpd !== 'Semua SKPD' && summaryBySumberDana.length > 0 && (
                    <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-center">Komposisi Sumber Dana: {selectedSkpd}</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                                    <thead className="bg-gray-100 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-3 py-2 text-left font-medium text-gray-500">Sumber Dana</th>
                                            <th className="px-3 py-2 text-right font-medium text-gray-500">Anggaran</th>
                                            <th className="px-3 py-2 text-right font-medium text-gray-500">Penyerapan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {summaryBySumberDana.map(item => (
                                            <tr key={item.name}>
                                                <td className="px-3 py-2 text-gray-900 dark:text-gray-200">{item.name}</td>
                                                <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">{formatCurrency(item.anggaran)}</td>
                                                <td className={`px-3 py-2 text-right font-semibold ${item.penyerapan > 85 ? 'text-green-600' : item.penyerapan < 50 ? 'text-red-600' : 'text-gray-800'}`}>{item.penyerapan.toFixed(1)}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={summaryBySumberDana} dataKey="anggaran" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({percent}) => `${(percent * 100).toFixed(0)}%`}>
                                             {summaryBySumberDana.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => formatCurrency(value)} />
                                        <Legend wrapperStyle={{fontSize: '12px'}}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Table */}
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">SKPD / Sub Kegiatan</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sumber Dana</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rekening</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Anggaran</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Realisasi</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sisa</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">%</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {paginatedData.map((item, index) => (
                            <tr key={index} className="odd:bg-white even:bg-gray-50 dark:odd:bg-gray-800 dark:even:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700">
                                <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                                    <div className="font-semibold">{item.skpd}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.subKegiatan}</div>
                                </td>
                                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{item.sumberDana}</td>
                                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-normal max-w-xs">{item.rekening}</td>
                                <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.anggaran)}</td>
                                <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.realisasi)}</td>
                                <td className="px-4 py-3 text-right font-bold text-green-600 dark:text-green-400">{formatCurrency(item.sisaAnggaran)}</td>
                                <td className={`px-4 py-3 text-right font-semibold ${item.persentase > 85 ? 'text-green-600' : item.persentase < 50 ? 'text-red-600' : 'text-gray-700'}`}>{item.persentase.toFixed(1)}%</td>
                            </tr>
                        ))}
                        {filteredData.length === 0 && (
                            <tr><td colSpan="7" className="text-center py-8 text-gray-500">
                                Tidak ada data yang cocok dengan filter yang dipilih.
                            </td></tr>
                        )}
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


// NEW: SkpdBelanjaStatsView Component
const SkpdBelanjaStatsView = ({ data, theme, namaPemda }) => {
    const { anggaran, realisasi, realisasiNonRkud } = data; // Ditambahkan realisasiNonRkud
    const [currentPage, setCurrentPage] = React.useState(1);
    const [skpdStats, setSkpdStats] = React.useState([]);
    const [searchTerm, setSearchTerm] = React.useState("");
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const [startMonth, setStartMonth] = React.useState(months[0]);
    const [endMonth, setEndMonth] = React.useState(months[months.length - 1]);
    const ITEMS_PER_PAGE = 10;

    React.useEffect(() => {
        const anggaranMap = new Map();
        (anggaran || []).forEach(item => {
            const skpd = item.NamaSKPD || 'Tanpa SKPD';
            anggaranMap.set(skpd, (anggaranMap.get(skpd) || 0) + item.nilai);
        });

        const startIndex = months.indexOf(startMonth);
        const endIndex = months.indexOf(endMonth);
        const selectedMonths = months.slice(startIndex, endIndex + 1);

        // --- LOGIKA BARU: Menggabungkan Realisasi Belanja & Non RKUD ---
        const normalizeRealisasiItem = (item, isNonRkud = false) => {
            if (!item) return null;
            return {
                NamaSKPD: isNonRkud ? item.NAMASKPD : item.NamaSKPD,
                nilai: item.nilai || 0
            };
        };
        
        const combinedRealisasi = [];
        selectedMonths.forEach(month => {
            if (realisasi && realisasi[month]) {
                combinedRealisasi.push(...realisasi[month].map(item => normalizeRealisasiItem(item, false)));
            }
            if (realisasiNonRkud && realisasiNonRkud[month]) {
                combinedRealisasi.push(...realisasiNonRkud[month].map(item => normalizeRealisasiItem(item, true)));
            }
        });
        // --- AKHIR LOGIKA BARU ---

        const realisasiMap = new Map();
        combinedRealisasi.forEach(item => { // Menggunakan data realisasi gabungan
            if (!item) return;
            const skpd = item.NamaSKPD || 'Tanpa SKPD';
            realisasiMap.set(skpd, (realisasiMap.get(skpd) || 0) + item.nilai);
        });

        const stats = Array.from(anggaranMap.keys()).map(skpd => {
            const totalAnggaran = anggaranMap.get(skpd) || 0;
            const totalRealisasi = realisasiMap.get(skpd) || 0;
            const persentase = totalAnggaran > 0 ? (totalRealisasi / totalAnggaran) * 100 : 0;
            return { skpd, totalAnggaran, totalRealisasi, persentase };
        });

        setSkpdStats(stats.sort((a,b) => b.persentase - a.persentase));
    }, [anggaran, realisasi, realisasiNonRkud, startMonth, endMonth]); // Ditambahkan realisasiNonRkud

    const filteredData = skpdStats.filter(item => item.skpd.toLowerCase().includes(searchTerm.toLowerCase()));
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const paginatedData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handlePageChange = (page) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page);
        }
    };
    
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, startMonth, endMonth]);

    const getAnalysisPrompt = (customQuery) => {
        if (customQuery) {
            return `Berdasarkan data statistik belanja SKPD, berikan analisis untuk permintaan berikut: "${customQuery}"`;
        }
        const topPerformers = skpdStats.slice(0, 3).map(s => `- ${s.skpd}: ${s.persentase.toFixed(2)}%`).join('\n');
        const bottomPerformers = skpdStats.slice(-3).reverse().map(s => `- ${s.skpd}: ${s.persentase.toFixed(2)}%`).join('\n');
        const period = startMonth === endMonth ? startMonth : `periode ${startMonth} - ${endMonth}`;
        return `
            Sebagai analis untuk ${namaPemda || 'pemerintah daerah'}, lakukan analisis kinerja penyerapan anggaran belanja per SKPD untuk **${period}**.
            Data menunjukkan 3 SKPD dengan penyerapan tertinggi adalah:
            ${topPerformers}
            
            Dan 3 SKPD dengan penyerapan terendah adalah:
            ${bottomPerformers}
            
            Berikan analisis singkat mengenai kemungkinan penyebab perbedaan kinerja ini dan berikan rekomendasi untuk SKPD dengan penyerapan rendah.
        `;
    };

    return (
        <div className="space-y-6">
            <SectionTitle>Statistik Anggaran vs Realisasi Belanja per SKPD</SectionTitle>
            <GeminiAnalysis 
                getAnalysisPrompt={getAnalysisPrompt} 
                disabledCondition={skpdStats.length === 0} 
                theme={theme}
                interactivePlaceholder="Bandingkan penyerapan Dinas A dan Dinas B..."
            />
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="relative md:col-span-1">
                        <input 
                            type="text"
                            placeholder="Cari SKPD..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                    </div>
                    <div className="md:col-span-2 grid grid-cols-2 gap-4">
                        <select value={startMonth} onChange={e => setStartMonth(e.target.value)} className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            {months.map(month => <option key={`start-${month}`} value={month}>Dari: {month}</option>)}
                        </select>
                        <select value={endMonth} onChange={e => setEndMonth(e.target.value)} className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            {months.map(month => <option key={`end-${month}`} value={month}>Sampai: {month}</option>)}
                        </select>
                    </div>
                </div>
                <div className="space-y-4">
                    {paginatedData.map(item => (
                        <div key={item.skpd} className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <h4 className="font-bold text-gray-800 dark:text-gray-200">{item.skpd}</h4>
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-2">
                                <div className="flex-1 mb-2 md:mb-0">
                                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${item.persentase > 100 ? 100 : item.persentase}%` }}></div>
                                    </div>
                                </div>
                                <div className="font-semibold text-blue-700 dark:text-blue-400 w-24 text-center">{item.persentase.toFixed(2)}%</div>
                                <div className="w-48 text-right">
                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(item.totalAnggaran)}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Anggaran Tahunan</p>
                                </div>
                                <div className="w-48 text-right">
                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(item.totalRealisasi)}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Realisasi ({startMonth} - {endMonth})</p>
                                </div>
                            </div>
                        </div>
                    ))}
                     {filteredData.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 py-8">Tidak ada data yang ditemukan.</p>}
                </div>
                 {totalPages > 1 && (
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} theme={theme} />
                )}
            </div>
        </div>
    );
};

// --- UPDATED: SkpdPendapatanStatsView Component with Projection Feature ---
const SkpdPendapatanStatsView = ({ data, theme, namaPemda, userRole }) => {
    const { pendapatan, realisasiPendapatan } = data;
    const [selectedSkpd, setSelectedSkpd] = React.useState('Semua SKPD');
    // 1. State baru untuk pencarian
    const [searchTerm, setSearchTerm] = React.useState(""); 
    const [currentPage, setCurrentPage] = React.useState(1);
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const [startMonth, setStartMonth] = React.useState(months[0]);
    const [endMonth, setEndMonth] = React.useState(months[months.length - 1]);
    const ITEMS_PER_PAGE = 10;
    
    const lastMonthWithData = React.useMemo(() => {
        if (!realisasiPendapatan) return months[0];
        for (let i = months.length - 1; i >= 0; i--) {
            if (realisasiPendapatan[months[i]] && realisasiPendapatan[months[i]].length > 0) {
                return months[i];
            }
        }
        return months[0];
    }, [realisasiPendapatan]);

    const [projectionMonth, setProjectionMonth] = React.useState(lastMonthWithData);

    React.useEffect(() => {
        setProjectionMonth(lastMonthWithData);
    }, [lastMonthWithData]);

    const skpdList = React.useMemo(() => {
        if (!pendapatan) return [];
        const skpds = new Set(pendapatan.map(item => item.NamaOPD).filter(Boolean));
        return Array.from(skpds).sort();
    }, [pendapatan]);

    const stats = React.useMemo(() => {
        if (!pendapatan || !realisasiPendapatan) return { chartData: [], tableData: [] };
        const startIndex = months.indexOf(startMonth);
        const endIndex = months.indexOf(endMonth);
        const selectedMonths = months.slice(startIndex, endIndex + 1);
        const allRealisasiForPeriod = selectedMonths.map(month => realisasiPendapatan[month] || []).flat();

        const dataToProcess = {
            pendapatan: selectedSkpd === 'Semua SKPD'
                ? pendapatan
                : pendapatan.filter(item => item.NamaOPD === selectedSkpd),
            realisasi: selectedSkpd === 'Semua SKPD'
                ? allRealisasiForPeriod
                : allRealisasiForPeriod.filter(item => item.SKPD === selectedSkpd),
        };

        const targetMap = new Map();
        dataToProcess.pendapatan.forEach(item => {
            const rekening = item.NamaAkun || 'Lain-lain';
            targetMap.set(rekening, (targetMap.get(rekening) || 0) + item.nilai);
        });

        const realisasiMap = new Map();
        dataToProcess.realisasi.forEach(item => {
            const rekening = item.NamaRekening || 'Lain-lain';
            realisasiMap.set(rekening, (realisasiMap.get(rekening) || 0) + item.nilai);
        });

        const allRekeningKeys = new Set([...targetMap.keys(), ...realisasiMap.keys()]);

        let combinedData = Array.from(allRekeningKeys).map(rekening => ({
            name: rekening,
            Target: targetMap.get(rekening) || 0,
            Realisasi: realisasiMap.get(rekening) || 0,
        }));
        
        // 2. Logika Filter Pencarian
        if (searchTerm) {
            combinedData = combinedData.filter(item => 
                item.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        const chartData = combinedData.sort((a,b) => b.Target - a.Target);

        const tableData = chartData.map(item => ({
            sumberPendapatan: item.name,
            totalTarget: item.Target,
            totalRealisasi: item.Realisasi,
            persentase: item.Target > 0 ? (item.Realisasi / item.Target) * 100 : 0
        }));

        return { chartData, tableData };
    }, [pendapatan, realisasiPendapatan, selectedSkpd, startMonth, endMonth, searchTerm]); // Tambahkan searchTerm ke dependency

    const projectionData = React.useMemo(() => {
        if (!pendapatan || !realisasiPendapatan) return null;
        
        // Filter pendapatan berdasarkan SKPD dan Search Term (agar proyeksi relevan dengan filter)
        let filteredPendapatan = selectedSkpd === 'Semua SKPD'
            ? pendapatan
            : pendapatan.filter(item => item.NamaOPD === selectedSkpd);
            
        if (searchTerm) {
            filteredPendapatan = filteredPendapatan.filter(item => 
                (item.NamaAkun || '').toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        const totalTarget = filteredPendapatan.reduce((sum, item) => sum + (item.nilai || 0), 0);
        
        const projectionMonthIndex = months.indexOf(projectionMonth);
        const monthsPassed = projectionMonthIndex + 1;
        const monthsRemaining = 12 - monthsPassed;
        const passedMonths = months.slice(0, monthsPassed);

        let relevantRealisasi = passedMonths
            .map(month => realisasiPendapatan[month] || [])
            .flat()
            .filter(item => selectedSkpd === 'Semua SKPD' || item.SKPD === selectedSkpd);
            
        if (searchTerm) {
            relevantRealisasi = relevantRealisasi.filter(item => 
                (item.NamaRekening || '').toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        const realisasiHinggaSaatIni = relevantRealisasi.reduce((sum, item) => sum + (item.nilai || 0), 0);

        const rataRataBulanan = monthsPassed > 0 ? realisasiHinggaSaatIni / monthsPassed : 0;
        const proyeksiSisaBulan = rataRataBulanan * monthsRemaining;
        const proyeksiAkhirTahun = realisasiHinggaSaatIni + proyeksiSisaBulan;
        const persenProyeksi = totalTarget > 0 ? (proyeksiAkhirTahun / totalTarget) * 100 : 0;

        return { totalTarget, realisasiHinggaSaatIni, proyeksiAkhirTahun, persenProyeksi };

    }, [pendapatan, realisasiPendapatan, selectedSkpd, projectionMonth, searchTerm]);


    const totalPages = Math.ceil(stats.tableData.length / ITEMS_PER_PAGE);
    const paginatedData = stats.tableData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handlePageChange = (page) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page);
        }
    };
    
    React.useEffect(() => {
        setCurrentPage(1);
    }, [selectedSkpd, startMonth, endMonth, searchTerm]);

    const getAnalysisPrompt = (customQuery) => {
        if (customQuery) {
            return `Berdasarkan data statistik pendapatan, berikan analisis untuk permintaan berikut: "${customQuery}"`;
        }
        
        const topSources = stats.tableData.slice(0, 5).map(s => `- **${s.sumberPendapatan}**: Target ${formatCurrency(s.totalTarget)}, Realisasi ${formatCurrency(s.totalRealisasi)} (${s.persentase.toFixed(2)}%)`).join('\n');
        const period = startMonth === endMonth ? startMonth : `periode ${startMonth} - ${endMonth}`;
        const filterContext = searchTerm ? `dengan filter kata kunci "${searchTerm}"` : '';
        
        return `
            Anda adalah seorang analis keuangan ahli untuk ${namaPemda || 'pemerintah daerah'}. 
            Lakukan analisis terhadap kinerja pendapatan ${selectedSkpd === 'Semua SKPD' ? 'Daerah' : selectedSkpd} pada **${period}** ${filterContext}.
            
            Data teratas berdasarkan filter saat ini:
            ${topSources}
            
            Berikan analisis singkat mengenai:
            1.  Kinerja pencapaian target pendapatan pada item-item tersebut.
            2.  Rekomendasi strategis untuk optimalisasi pendapatan.
        `;
    };

    return (
        <div className="space-y-6">
            <SectionTitle>Statistik Pendapatan per SKPD</SectionTitle>
            <GeminiAnalysis 
                getAnalysisPrompt={getAnalysisPrompt} 
                disabledCondition={stats.tableData.length === 0} 
                theme={theme}
                interactivePlaceholder="Analisis target pendapatan dari retribusi..."
                userRole={userRole}
            />

            {projectionData && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md mb-6">
                    <div className="flex flex-col md:flex-row justify-between items-start mb-4">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 md:mb-0">Proyeksi Pendapatan Akhir Tahun {searchTerm && `(Filter: "${searchTerm}")`}</h3>
                        <div>
                            <label htmlFor="projection-month-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Proyeksi Berdasarkan Data s/d Bulan:</label>
                            <select
                                id="projection-month-select"
                                value={projectionMonth}
                                onChange={(e) => setProjectionMonth(e.target.value)}
                                className="w-full md:w-auto pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                            >
                                {months.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Target Tahunan</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{formatCurrency(projectionData.totalTarget)}</p>
                        </div>
                        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Realisasi s/d {projectionMonth}</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{formatCurrency(projectionData.realisasiHinggaSaatIni)}</p>
                        </div>
                        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Proyeksi s/d Desember</p>
                            <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">{formatCurrency(projectionData.proyeksiAkhirTahun)}</p>
                        </div>
                        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Potensi Capaian Target</p>
                            <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">{projectionData.persenProyeksi.toFixed(2)}%</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                {/* 3. Grid Filter & Search diperbarui */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <select
                        id="skpd-select-pendapatan"
                        value={selectedSkpd}
                        onChange={(e) => setSelectedSkpd(e.target.value)}
                        className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                        <option value="Semua SKPD">-- Semua SKPD --</option>
                        {skpdList.map(skpd => <option key={skpd} value={skpd}>{skpd}</option>)}
                    </select>

                    {/* Input Pencarian Baru */}
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Cari Sumber Pendapatan..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" 
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                    </div>

                    <select value={startMonth} onChange={e => setStartMonth(e.target.value)} className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
                        {months.map(month => <option key={`start-${month}`} value={month}>Dari: {month}</option>)}
                    </select>
                    <select value={endMonth} onChange={e => setEndMonth(e.target.value)} className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
                        {months.map(month => <option key={`end-${month}`} value={month}>Sampai: {month}</option>)}
                    </select>
                </div>

                {stats.tableData.length > 0 ? (
                    <>
                        <div className="mb-8">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Komposisi Pendapatan untuk {selectedSkpd} ({startMonth} - {endMonth})</h3>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={stats.chartData.slice(0, 15)} margin={{ top: 5, right: 30, left: 20, bottom: 100 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 12 }} />
                                    <YAxis tickFormatter={(val) => `${(val / 1e9).toFixed(1)} M`} tick={{ fontSize: 12 }} />
                                    <Tooltip formatter={(value) => formatCurrency(value)} />
                                    <Legend verticalAlign="top" />
                                    <Bar dataKey="Target" fill="#8884d8" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Realisasi" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sumber Pendapatan</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Target Tahunan</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Realisasi ({startMonth} - {endMonth})</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Persentase (%)</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {paginatedData.map((item, index) => (
                                    <tr key={index} className="odd:bg-white even:bg-gray-50 dark:odd:bg-gray-800 dark:even:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <td className="px-6 py-4 whitespace-normal text-sm font-medium text-gray-900 dark:text-gray-100 max-w-sm">{item.sumberPendapatan}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-blue-700 dark:text-blue-400">{formatCurrency(item.totalTarget)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-green-700 dark:text-green-400">{formatCurrency(item.totalRealisasi)}</td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${item.persentase > 90 ? 'text-green-600' : item.persentase < 70 ? 'text-red-600' : 'text-yellow-600'}`}>{item.persentase.toFixed(2)}%</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                             {stats.tableData.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 py-8">Tidak ada data pendapatan yang cocok dengan pencarian.</p>}
                        </div>
                        {totalPages > 1 && (
                            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} theme={theme} />
                        )}
                    </>
                ) : (
                    <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                        <p>Tidak ada data pendapatan untuk ditampilkan{searchTerm ? ' dengan kata kunci tersebut' : ''}.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const SkpdRekeningStatsView = ({ data, theme, namaPemda, userCanUseAi }) => {
    const { anggaran, realisasi, realisasiNonRkud } = data;
    const [selectedSkpd, setSelectedSkpd] = React.useState('Semua SKPD');
    const [rekeningStats, setRekeningStats] = React.useState([]);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [sortOrder, setSortOrder] = React.useState('realisasi-desc');
    const [currentPage, setCurrentPage] = React.useState(1);
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const [startMonth, setStartMonth] = React.useState(months[0]);
    const [endMonth, setEndMonth] = React.useState(months[months.length - 1]);
    const ITEMS_PER_PAGE = 10;
    
    const [expandedRekening, setExpandedRekening] = React.useState(null);

    const skpdList = React.useMemo(() => {
        const skpds = new Set((anggaran || []).map(item => item.NamaSKPD).filter(Boolean));
        return Array.from(skpds).sort();
    }, [anggaran]);

    React.useEffect(() => {
        if (!anggaran) {
            setRekeningStats([]);
            return;
        }

        const normalizeRealisasiItem = (item, isNonRkud = false) => {
            if (!item) return null;
            return {
                NamaSKPD: isNonRkud ? item.NAMASKPD : item.NamaSKPD,
                KodeRekening: isNonRkud ? item.KODEREKENING : item.KodeRekening,
                NamaRekening: isNonRkud ? item.NAMAREKENING : item.NamaRekening,
                nilai: item.nilai || 0
            };
        };

        const combinedRealisasi = {};
        for (const month in realisasi) { combinedRealisasi[month] = (realisasi[month] || []).map(item => normalizeRealisasiItem(item, false)); }
        for (const month in realisasiNonRkud) {
            if (!combinedRealisasi[month]) combinedRealisasi[month] = [];
            combinedRealisasi[month].push(...(realisasiNonRkud[month] || []).map(item => normalizeRealisasiItem(item, true)));
        }

        const filteredAnggaran = selectedSkpd === 'Semua SKPD' 
            ? anggaran 
            : anggaran.filter(item => item.NamaSKPD === selectedSkpd);

        const dataMap = new Map();
        
        filteredAnggaran.forEach(item => {
            const key = item.NamaRekening || 'Tanpa Nama Rekening';
            if (!dataMap.has(key)) {
                dataMap.set(key, {
                    kodeRekening: item.KodeRekening,
                    rekening: key,
                    totalAnggaran: 0,
                    totalRealisasi: 0,
                    skpdDetails: new Map(),
                    sumberDanaSet: new Set(),
                });
            }
            const data = dataMap.get(key);
            data.totalAnggaran += item.nilai || 0;
            if (item.NamaSumberDana) data.sumberDanaSet.add(item.NamaSumberDana);

            const skpdKey = item.NamaSKPD || 'Tanpa SKPD';
            if (!data.skpdDetails.has(skpdKey)) {
                data.skpdDetails.set(skpdKey, { anggaran: 0, realisasi: 0 });
            }
            data.skpdDetails.get(skpdKey).anggaran += item.nilai || 0;
        });

        const startIndex = months.indexOf(startMonth);
        const endIndex = months.indexOf(endMonth);
        const selectedMonths = months.slice(startIndex, endIndex + 1);
        const realisasiBulanIni = selectedMonths.map(month => combinedRealisasi[month] || []).flat();
        
        const filteredRealisasi = selectedSkpd === 'Semua SKPD' ? realisasiBulanIni : realisasiBulanIni.filter(item => item.NamaSKPD === selectedSkpd);
        
        filteredRealisasi.forEach(item => {
            const key = item.NamaRekening || 'Tanpa Nama Rekening';
            if (!dataMap.has(key)) {
                 const correspondingAnggaranItem = (anggaran || []).find(a => a.NamaRekening === key);
                 dataMap.set(key, {
                    kodeRekening: correspondingAnggaranItem ? correspondingAnggaranItem.KodeRekening : (item.KodeRekening || 'N/A'),
                    rekening: key, totalAnggaran: 0, totalRealisasi: 0,
                    skpdDetails: new Map(),
                    sumberDanaSet: new Set(),
                });
            }
            const data = dataMap.get(key);
            data.totalRealisasi += item.nilai || 0;
            
            const skpdKey = item.NamaSKPD || 'Tanpa SKPD';
            if (!data.skpdDetails.has(skpdKey)) {
                data.skpdDetails.set(skpdKey, { anggaran: 0, realisasi: 0 });
            }
            data.skpdDetails.get(skpdKey).realisasi += item.nilai || 0;
        });

        const stats = Array.from(dataMap.values()).map(item => {
            const persentase = item.totalAnggaran > 0 ? (item.totalRealisasi / item.totalAnggaran) * 100 : 0;
            const sisaAnggaran = item.totalAnggaran - item.totalRealisasi;
            
            const skpdDetailsArray = Array.from(item.skpdDetails.entries()).map(([skpd, values]) => ({
                skpd,
                anggaran: values.anggaran,
                realisasi: values.realisasi,
                sisa: values.anggaran - values.realisasi,
                persen: values.anggaran > 0 ? (values.realisasi / values.anggaran) * 100 : 0
            })).sort((a,b) => b.anggaran - a.anggaran);

            return { 
                ...item, persentase, sisaAnggaran,
                skpdList: skpdDetailsArray,
                sumberDanaList: Array.from(item.sumberDanaSet),
            };
        });

        setRekeningStats(stats);
    }, [selectedSkpd, anggaran, realisasi, realisasiNonRkud, startMonth, endMonth]);
    
    const sortedAndFilteredData = React.useMemo(() => {
        const filtered = rekeningStats.filter(item => 
            item.rekening.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.kodeRekening && String(item.kodeRekening).toLowerCase().includes(searchTerm.toLowerCase()))
        );

        const [key, direction] = sortOrder.split('-');
        
        return filtered.sort((a, b) => {
            let valA, valB;
            switch(key) {
                case 'realisasi': valA = a.totalRealisasi; valB = b.totalRealisasi; break;
                case 'anggaran': valA = a.totalAnggaran; valB = b.totalAnggaran; break;
                case 'persentase': valA = a.persentase; valB = b.persentase; break;
                case 'sisa': valA = a.sisaAnggaran; valB = b.sisaAnggaran; break;
                case 'nama':
                    valA = a.rekening; valB = b.rekening;
                    return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                default: return 0;
            }
            return direction === 'asc' ? valA - valB : valB - valA;
        });
    }, [rekeningStats, searchTerm, sortOrder]);

    const totalPages = Math.ceil(sortedAndFilteredData.length / ITEMS_PER_PAGE);
    const paginatedData = sortedAndFilteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    
    const handlePageChange = (page) => {
        if (page > 0 && page <= totalPages) setCurrentPage(page);
    };
    
    React.useEffect(() => {
        setCurrentPage(1);
        setExpandedRekening(null);
    }, [searchTerm, selectedSkpd, startMonth, endMonth, sortOrder]);
    
    // --- Fitur Baru: Fungsi untuk Download Excel ---
    const handleDownloadExcel = () => {
        if (!sortedAndFilteredData || sortedAndFilteredData.length === 0) {
            alert("Tidak ada data untuk diunduh.");
            return;
        }
        if (!window.XLSX) {
            alert("Pustaka unduh Excel tidak tersedia.");
            return;
        }

        try {
            const dataForExport = sortedAndFilteredData.map(item => ({
                'Kode Rekening': item.kodeRekening,
                'Nama Rekening': item.rekening,
                'Anggaran Tahunan': item.totalAnggaran,
                'Realisasi': item.totalRealisasi,
                'Sisa Anggaran': item.sisaAnggaran,
                'Penyerapan (%)': item.persentase.toFixed(2)
            }));

            const worksheet = window.XLSX.utils.json_to_sheet(dataForExport);
            const workbook = window.XLSX.utils.book_new();
            window.XLSX.utils.book_append_sheet(workbook, worksheet, "Statistik Rekening");
            
            const fileName = `Statistik_Rekening_${selectedSkpd.replace(/ /g, "_")}_(${startMonth}-${endMonth}).xlsx`;
            window.XLSX.writeFile(workbook, fileName);
        } catch (err) {
            console.error("Error creating Excel file:", err);
            alert("Gagal membuat file Excel.");
        }
    };

    const getAnalysisPrompt = (customQuery) => {
        if (customQuery) {
            return `Berdasarkan data rekening SKPD, berikan analisis untuk permintaan berikut: "${customQuery}"`;
        }
        
        const focus = selectedSkpd === 'Semua SKPD' ? 'keseluruhan APBD' : `SKPD: **${selectedSkpd}**`;
        const top5 = sortedAndFilteredData.slice(0, 5).map(s => `- **${s.rekening} (${s.kodeRekening})**: Anggaran ${formatCurrency(s.totalAnggaran)}, Realisasi ${formatCurrency(s.totalRealisasi)}, Sisa ${formatCurrency(s.sisaAnggaran)} (${s.persentase.toFixed(2)}%)`).join('\n');
        const period = startMonth === endMonth ? startMonth : `periode ${startMonth} - ${endMonth}`;
        
        return `
            Sebagai analis untuk ${namaPemda || 'pemerintah daerah'}, lakukan analisis kinerja penyerapan anggaran per rekening untuk **${focus}** pada **${period}**.
            Berikut adalah 5 rekening teratas berdasarkan urutan yang dipilih:
            ${top5}
            
            Berikan analisis singkat mengenai pola belanja ini. Fokus pada rekening dengan sisa anggaran terbesar dan penyerapan terendah. Berikan rekomendasi spesifik.
        `;
    };

    const toggleRincian = (rekening) => {
        setExpandedRekening(prev => (prev === rekening ? null : rekening));
    };

    return (
        <div className="space-y-6">
            <SectionTitle>Statistik Rekening per SKPD</SectionTitle>
            <GeminiAnalysis getAnalysisPrompt={getAnalysisPrompt} disabledCondition={rekeningStats.length === 0} theme={theme} interactivePlaceholder="Analisis belanja ATK di dinas..." userCanUseAi={userCanUseAi} />
             <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <select value={selectedSkpd} onChange={(e) => setSelectedSkpd(e.target.value)} className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="Semua SKPD">-- Semua SKPD --</option>
                        {skpdList.map(skpd => <option key={skpd} value={skpd}>{skpd}</option>)}
                    </select>
                     <div className="relative">
                        <input type="text" placeholder="Cari Nama/Kode Rekening..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <select value={startMonth} onChange={e => setStartMonth(e.target.value)} className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            {months.map(month => <option key={`start-${month}`} value={month}>Dari: {month}</option>)}
                        </select>
                        <select value={endMonth} onChange={e => setEndMonth(e.target.value)} className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            {months.map(month => <option key={`end-${month}`} value={month}>Sampai: {month}</option>)}
                        </select>
                    </div>
                    {/* --- Dropdown Urutan yang Diperbarui --- */}
                    <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="realisasi-desc">Realisasi Tertinggi</option>
                        <option value="realisasi-asc">Realisasi Terendah</option>
                        <option value="anggaran-desc">Anggaran Tertinggi</option>
                        <option value="anggaran-asc">Anggaran Terendah</option>
                        <option value="persentase-desc">Penyerapan Tertinggi (%)</option>
                        <option value="persentase-asc">Penyerapan Terendah (%)</option>
                        <option value="sisa-desc">Sisa Anggaran Tertinggi</option>
                        <option value="sisa-asc">Sisa Anggaran Terendah</option>
                        <option value="nama-asc">Nama Rekening (A-Z)</option>
                    </select>
                    {/* --- Tombol Download Excel Ditambahkan di Sini --- */}
                    <button 
                        onClick={handleDownloadExcel} 
                        disabled={sortedAndFilteredData.length === 0} 
                        className="lg:col-start-4 flex items-center justify-center px-4 py-2 border border-green-600 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download size={16} className="mr-2"/>
                        Download Excel
                    </button>
                </div>

                <div className="space-y-4">
                    {paginatedData.map(item => (
                        <div key={item.rekening} className="border border-gray-200 dark:border-gray-700 rounded-lg transition-shadow hover:shadow-lg">
                            <div className="p-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h4 className="font-bold text-gray-800 dark:text-gray-200">{item.rekening}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{item.kodeRekening}</p>
                                    </div>
                                    <button onClick={() => toggleRincian(item.rekening)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 ml-4">
                                        {expandedRekening === item.rekening ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </button>
                                </div>
                                <div className="mt-4">
                                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                                        <span>Realisasi: {formatCurrency(item.totalRealisasi)}</span>
                                        <span>Pagu: {formatCurrency(item.totalAnggaran)}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-4 relative overflow-hidden">
                                        <div className="bg-indigo-600 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ width: `${item.persentase > 100 ? 100 : item.persentase}%` }}>
                                           {item.persentase.toFixed(2)}%
                                        </div>
                                    </div>
                                     <p className="text-right text-xs text-green-600 dark:text-green-400 mt-1">Sisa Anggaran: {formatCurrency(item.sisaAnggaran)}</p>
                                </div>
                            </div>
                            
                            {expandedRekening === item.rekening && (
                                <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                                        <div>
                                            <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Rincian per SKPD:</h5>
                                            <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                                                {item.skpdList.length > 0 ? item.skpdList.map(skpdDetail => (
                                                    <div key={skpdDetail.skpd}>
                                                        <p className="font-bold text-gray-800 dark:text-gray-200">{skpdDetail.skpd}</p>
                                                        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1 mt-1">
                                                            <p>Anggaran: <span className="float-right">{formatCurrency(skpdDetail.anggaran)}</span></p>
                                                            <p>Realisasi: <span className="float-right">{formatCurrency(skpdDetail.realisasi)}</span></p>
                                                            <p>Sisa: <span className="float-right">{formatCurrency(skpdDetail.sisa)}</span></p>
                                                            <p>Penyerapan: <span className="font-bold float-right">{skpdDetail.persen.toFixed(2)}%</span></p>
                                                        </div>
                                                    </div>
                                                )) : <p className="text-gray-500">-</p>}
                                            </div>
                                        </div>
                                        <div>
                                            <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Sumber Dana:</h5>
                                             <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                                                {item.sumberDanaList.length > 0 ? item.sumberDanaList.map(sd => <li key={sd}>{sd}</li>) : <li>Tidak Teridentifikasi</li>}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {sortedAndFilteredData.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 py-8">Tidak ada data rekening yang ditemukan.</p>}
                </div>
                 {totalPages > 1 && ( <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} theme={theme} /> )}
            </div>
        </div>
    );
};

// --- GANTI SELURUH KOMPONEN DI BAWAH INI DENGAN VERSI YANG SUDAH DISEMPURNAKAN ---
const SkpdSubKegiatanStatsView = ({ data, theme, namaPemda, userRole }) => {
    const { anggaran, realisasi, realisasiNonRkud } = data;
    const [selectedSkpd, setSelectedSkpd] = React.useState('');
    const [selectedSubUnit, setSelectedSubUnit] = React.useState('Semua Sub Unit');
    
    const [subKegiatanStats, setSubKegiatanStats] = React.useState([]);
    const [currentPage, setCurrentPage] = React.useState(1);
    const [expandedRows, setExpandedRows] = React.useState(new Set());
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const [startMonth, setStartMonth] = React.useState(months[0]);
    const [endMonth, setEndMonth] = React.useState(months[months.length - 1]);
    const ITEMS_PER_PAGE = 10;

    const skpdList = React.useMemo(() => {
        const skpds = new Set((anggaran || []).map(item => item.NamaSKPD).filter(Boolean));
        return Array.from(skpds).sort();
    }, [anggaran]);
    
    const subUnitList = React.useMemo(() => {
        if (!selectedSkpd) return [];
        const filtered = (anggaran || []).filter(item => item.NamaSKPD === selectedSkpd);
        const subUnits = new Set(filtered.map(item => item.NamaSubUnit).filter(Boolean));
        return Array.from(subUnits).sort();
    }, [anggaran, selectedSkpd]);

    React.useEffect(() => {
        if (!selectedSkpd) {
            setSubKegiatanStats([]);
            return;
        }

        const normalizeRealisasiItem = (item, isNonRkud = false) => {
            if (!item) return null;
            return {
                NamaSKPD: isNonRkud ? item.NAMASKPD : item.NamaSKPD,
                NamaSubUnit: isNonRkud ? item.NAMASUBSKPD : item.NamaSubUnit,
                KodeSubKegiatan: isNonRkud ? item.KODESUBKEGIATAN : item.KodeSubKegiatan,
                NamaSubKegiatan: isNonRkud ? item.NAMASUBKEGIATAN : item.NamaSubKegiatan,
                NamaRekening: isNonRkud ? item.NAMAREKENING : item.NamaRekening,
                nilai: item.nilai || 0
            };
        };
        
        const combinedRealisasi = {};
        for (const month in realisasi) {
            combinedRealisasi[month] = (realisasi[month] || []).map(item => normalizeRealisasiItem(item, false));
        }
        for (const month in realisasiNonRkud) {
            if (!combinedRealisasi[month]) combinedRealisasi[month] = [];
            combinedRealisasi[month].push(...(realisasiNonRkud[month] || []).map(item => normalizeRealisasiItem(item, true)));
        }

        const statsMap = new Map();
        const startIndex = months.indexOf(startMonth);
        const endIndex = months.indexOf(endMonth);
        const selectedMonths = months.slice(startIndex, endIndex + 1);
        const realisasiBulanIni = selectedMonths.map(month => combinedRealisasi[month] || []).flat();

        let filteredAnggaran = (anggaran || []).filter(item => item.NamaSKPD === selectedSkpd);
        if (selectedSubUnit !== 'Semua Sub Unit') {
            filteredAnggaran = filteredAnggaran.filter(item => item.NamaSubUnit === selectedSubUnit);
        }
        
        let filteredRealisasi = realisasiBulanIni.filter(item => item.NamaSKPD === selectedSkpd);
        if (selectedSubUnit !== 'Semua Sub Unit') {
            filteredRealisasi = filteredRealisasi.filter(item => item.NamaSubUnit === selectedSubUnit);
        }
        
        filteredAnggaran.forEach(item => {
            const key = `${item.NamaSKPD}|${item.KodeSubKegiatan}`; 
            const rekeningKey = item.NamaRekening || 'Tanpa Nama Rekening';

            if (!statsMap.has(key)) {
                statsMap.set(key, {
                    kodeSubKegiatan: item.KodeSubKegiatan,
                    subKegiatan: item.NamaSubKegiatan || 'Tanpa Sub Kegiatan',
                    totalAnggaran: 0,
                    totalRealisasi: 0,
                    rekenings: new Map(),
                    sumberDanaSet: new Set()
                });
            }

            const subKegiatanData = statsMap.get(key);
            subKegiatanData.totalAnggaran += item.nilai || 0;
            if (item.NamaSumberDana) {
                subKegiatanData.sumberDanaSet.add(item.NamaSumberDana);
            }

            if (!subKegiatanData.rekenings.has(rekeningKey)) {
                subKegiatanData.rekenings.set(rekeningKey, { anggaran: 0, realisasi: 0 });
            }
            subKegiatanData.rekenings.get(rekeningKey).anggaran += item.nilai || 0;
        });

        filteredRealisasi.forEach(item => {
            const key = `${item.NamaSKPD}|${item.KodeSubKegiatan}`;
            const rekeningKey = item.NamaRekening || 'Tanpa Nama Rekening';

            if (statsMap.has(key)) {
                const subKegiatanData = statsMap.get(key);
                subKegiatanData.totalRealisasi += item.nilai || 0;

                if (subKegiatanData.rekenings.has(rekeningKey)) {
                    subKegiatanData.rekenings.get(rekeningKey).realisasi += item.nilai || 0;
                }
            }
        });

        const finalStats = Array.from(statsMap.values()).map(data => {
            const rekenings = Array.from(data.rekenings.entries()).map(([rekening, values]) => ({
                rekening,
                ...values,
                persentase: values.anggaran > 0 ? (values.realisasi / values.anggaran) * 100 : 0
            }));
            return {
                ...data,
                sumberDanaList: Array.from(data.sumberDanaSet),
                rekenings,
                persentase: data.totalAnggaran > 0 ? (data.totalRealisasi / data.totalAnggaran) * 100 : 0
            };
        }).sort((a, b) => b.totalAnggaran - a.totalAnggaran);

        setSubKegiatanStats(finalStats);

    }, [selectedSkpd, selectedSubUnit, anggaran, realisasi, realisasiNonRkud, startMonth, endMonth]);

    const totalPages = Math.ceil(subKegiatanStats.length / ITEMS_PER_PAGE);
    const paginatedData = subKegiatanStats.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handlePageChange = (page) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const toggleRow = (subKegiatanKey) => {
        const newExpandedRows = new Set(expandedRows);
        if (newExpandedRows.has(subKegiatanKey)) {
            newExpandedRows.delete(subKegiatanKey);
        } else {
            newExpandedRows.add(subKegiatanKey);
        }
        setExpandedRows(newExpandedRows);
    };

    React.useEffect(() => {
        setCurrentPage(1);
        setExpandedRows(new Set());
        setSelectedSubUnit('Semua Sub Unit');
    }, [selectedSkpd, startMonth, endMonth]);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [selectedSubUnit]);

    const getAnalysisPrompt = (customQuery) => {
        if (customQuery) {
            return `Berdasarkan data sub kegiatan SKPD, berikan analisis untuk permintaan berikut: "${customQuery}"`;
        }
        if (!selectedSkpd) return "Pilih SKPD untuk dianalisis.";
        const top5 = subKegiatanStats.slice(0, 5).map(s => `- **${s.subKegiatan}**: Anggaran ${formatCurrency(s.totalAnggaran)}, Realisasi ${formatCurrency(s.totalRealisasi)} (${s.persentase.toFixed(2)}%)`).join('\n');
        const period = startMonth === endMonth ? startMonth : `periode ${startMonth} - ${endMonth}`;
        return `
            Sebagai analis untuk ${namaPemda || 'pemerintah daerah'}, lakukan analisis kinerja penyerapan anggaran per Sub Kegiatan untuk SKPD: **${selectedSkpd}** pada **${period}**.
            Berikut adalah 5 sub kegiatan dengan anggaran terbesar:
            ${top5}
            
            Berikan analisis mendalam mengenai pola belanja SKPD ini. Fokus pada sub kegiatan dengan penyerapan tertinggi dan terendah. Identifikasi potensi masalah atau keberhasilan dalam eksekusi anggaran.
        `;
    };

    return (
        <div className="space-y-6">
            <SectionTitle>Statistik Sub Kegiatan & Rekening per SKPD</SectionTitle>
            <GeminiAnalysis 
                getAnalysisPrompt={getAnalysisPrompt} 
                disabledCondition={!selectedSkpd || subKegiatanStats.length === 0} 
                theme={theme}
                interactivePlaceholder="Cari sub kegiatan tentang pembangunan jalan..."
                userRole={userRole}
            />
             <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <select
                        value={selectedSkpd}
                        onChange={(e) => setSelectedSkpd(e.target.value)}
                        className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        <option value="">-- Pilih SKPD --</option>
                        {skpdList.map(skpd => <option key={skpd} value={skpd}>{skpd}</option>)}
                    </select>
                    
                    <select
                        value={selectedSubUnit}
                        onChange={(e) => setSelectedSubUnit(e.target.value)}
                        disabled={!selectedSkpd || subUnitList.length === 0}
                        className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                    >
                        <option>Semua Sub Unit</option>
                        {subUnitList.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                    </select>

                     <div className="grid grid-cols-2 gap-4">
                        <select value={startMonth} onChange={e => setStartMonth(e.target.value)} className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                            {months.map(month => <option key={`start-${month}`} value={month}>Dari: {month}</option>)}
                        </select>
                        <select value={endMonth} onChange={e => setEndMonth(e.target.value)} className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                            {months.map(month => <option key={`end-${month}`} value={month}>Sampai: {month}</option>)}
                        </select>
                    </div>
                </div>
                {selectedSkpd ? (
                    <div className="space-y-2">
                        {paginatedData.map(item => {
                            const subKegiatanKey = `${item.subKegiatan}-${item.kodeSubKegiatan}`; // --- KUNCI BARU YANG LEBIH UNIK ---
                            return (
                            <div key={subKegiatanKey} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                <div onClick={() => toggleRow(subKegiatanKey)} className="flex items-center p-4 cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <div className="flex-1">
                                        <h4 className="font-bold text-gray-800 dark:text-gray-200">{item.subKegiatan}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1">{item.kodeSubKegiatan}</p>
                                        <div className="flex items-center mt-2">
                                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5 mr-4">
                                                <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${item.persentase > 100 ? 100 : item.persentase}%` }}></div>
                                            </div>
                                            <div className="font-semibold text-green-700 dark:text-green-400 w-20 text-center">{item.persentase.toFixed(2)}%</div>
                                        </div>
                                    </div>
                                    <div className="w-40 text-right mx-4">
                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(item.totalAnggaran)}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Total Anggaran</p>
                                    </div>
                                    <div className="w-40 text-right mx-4">
                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(item.totalRealisasi)}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Total Realisasi</p>
                                    </div>
                                    <button className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
                                        {expandedRows.has(subKegiatanKey) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </button>
                                </div>
                                {expandedRows.has(subKegiatanKey) && (
                                    <div className="bg-white dark:bg-gray-800/50 p-4 border-t border-gray-200 dark:border-gray-700">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <h5 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">Sumber Dana:</h5>
                                                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                                    {item.sumberDanaList.length > 0 ? item.sumberDanaList.map(sd => <li key={sd}>{sd}</li>) : <li>Tidak Teridentifikasi</li>}
                                                </ul>
                                            </div>
                                            <div>
                                                <h5 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">Rincian Rekening:</h5>
                                                <div className="overflow-x-auto max-h-48">
                                                    <table className="min-w-full">
                                                        <thead className="bg-gray-100 dark:bg-gray-700">
                                                            <tr>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Nama Rekening</th>
                                                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Anggaran</th>
                                                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Realisasi</th>
                                                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Persentase</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                                        {item.rekenings.map(rek => (
                                                            <tr key={rek.rekening}>
                                                                <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{rek.rekening}</td>
                                                                <td className="px-4 py-2 text-right text-sm text-gray-600 dark:text-gray-400">{formatCurrency(rek.anggaran)}</td>
                                                                <td className="px-4 py-2 text-right text-sm text-gray-600 dark:text-gray-400">{formatCurrency(rek.realisasi)}</td>
                                                                <td className="px-4 py-2 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">{rek.persentase.toFixed(2)}%</td>
                                                            </tr>
                                                        ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )})}
                        {subKegiatanStats.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 py-8">Tidak ada data sub kegiatan untuk filter ini.</p>}
                        {totalPages > 1 && (
                            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} theme={theme} />
                        )}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-10">Silakan pilih SKPD untuk melihat statistik sub kegiatan.</p>
                )}
            </div>
        </div>
    );
};

// NEW: Reusable Progress Circle Component
const ProgressCircle = ({ percentage, threshold, type }) => {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const isExceeding = type === 'pegawai' ? percentage > threshold : percentage < threshold;
    const strokeColor = percentage === 0 ? '#d1d5db' : (isExceeding ? '#EF4444' : '#10B981');
    const progress = Math.min(percentage, 100); // Cap at 100 for visual representation
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center w-40 h-40">
            <svg className="transform -rotate-90 w-full h-full">
                <circle cx="50%" cy="50%" r={radius} stroke="#e5e7eb" strokeWidth="12" fill="transparent" className="dark:stroke-gray-700" />
                <circle
                    cx="50%"
                    cy="50%"
                    r={radius}
                    stroke={strokeColor}
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                />
            </svg>
            <span className="absolute text-3xl font-bold" style={{ color: strokeColor }}>
                {percentage.toFixed(2)}%
            </span>
        </div>
    );
};

// UPDATED: MandatorySpendingView Component
const MandatorySpendingView = ({ data, theme, namaPemda, selectedYear }) => {
    const { anggaran, realisasi, realisasiNonRkud } = data; 
    const [activeTab, setActiveTab] = React.useState('pegawai');
    
    const [refPendidikan, setRefPendidikan] = React.useState([]);
    const [refInfrastruktur, setRefInfrastruktur] = React.useState([]);

    React.useEffect(() => {
        const unsubFunctions = [];
        const fetchData = (type, setter) => {
            const ref = collection(db, "publicData", String(selectedYear), `referensi-${type}`);
            const unsubscribe = onSnapshot(ref, (snapshot) => {
                let fetchedData = [];
                snapshot.forEach(doc => {
                    if (Array.isArray(doc.data().rows)) {
                        fetchedData.push(...doc.data().rows);
                    }
                });
                setter(fetchedData);
            }, (err) => {
                console.error(`Error fetching ${type} reference:`, err);
                setter([]);
            });
            unsubFunctions.push(unsubscribe);
        };

        fetchData('pendidikan', setRefPendidikan);
        fetchData('infrastruktur', setRefInfrastruktur);

        return () => unsubFunctions.forEach(unsub => unsub());
    }, [selectedYear]);


    const analysisData = React.useMemo(() => {
        if (!anggaran || anggaran.length === 0) {
            return { pegawai: {}, infrastruktur: {}, pendidikan: {} };
        }

        const normalizeRealisasiItem = (item, isNonRkud = false) => {
             if (!item) return null;
             const kodeSubKegiatan = isNonRkud ? item.KODESUBKEGIATAN : item.KodeSubKegiatan;
             const kodeRekening = isNonRkud ? item.KODEREKENING : item.KodeRekening;
             const namaSkpd = isNonRkud ? item.NAMASKPD : item.NamaSKPD;
             // --- PERBAIKAN DI SINI ---
             // Data RKUD (isNonRkud=false) menggunakan 'NamaSubSKPD' (dari mapping)
             // Data Non-RKUD (isNonRkud=true) menggunakan 'NAMASUBSKPD'
             const namaSubUnit = isNonRkud ? item.NAMASUBSKPD : item.NamaSubSKPD; 
             // --- AKHIR PERBAIKAN ---
             const namaSubKegiatan = isNonRkud ? item.NAMASUBKEGIATAN : item.NamaSubKegiatan; 

             if (!namaSkpd) return null; 

             return { 
                 KodeSubKegiatan: kodeSubKegiatan || 'Tidak Ada Kode', 
                 KodeRekening: kodeRekening || 'Tidak Ada Kode', 
                 NamaSKPD: namaSkpd, 
                 NamaSubUnit: namaSubUnit || 'Tidak Ada Sub Unit', 
                 NamaSubKegiatan: namaSubKegiatan || 'Tidak Ada Nama Sub Kegiatan', 
                 nilai: item.nilai || 0 
             };
        };
        
        const allRealisasi = [
            ...Object.values(realisasi || {}).flat().map(item => normalizeRealisasiItem(item, false)),
            ...Object.values(realisasiNonRkud || {}).flat().map(item => normalizeRealisasiItem(item, true))
        ].filter(Boolean);

        const pendidikanCodes = new Set(refPendidikan.map(item => String(item['KODE SUB KEGIATAN']).trim()));
        const infrastrukturNormalCodes = new Set();
        const infrastrukturXxxNames = new Set();
        refInfrastruktur.forEach(item => {
            const code = String(item['KODE SUB KEGIATAN']).trim();
            const name = String(item['NAMA SUB KEGIATAN']).toLowerCase().trim();
            if (code.toUpperCase().startsWith('X.XX')) {
                infrastrukturXxxNames.add(name);
            } else {
                infrastrukturNormalCodes.add(code);
            }
        });

        const isPendidikan = (item) => {
             if (!item) return false;
             const kodeSubKegiatan = String(item.KodeSubKegiatan || '').trim();
             const namaSkpd = String(item.NamaSKPD || '').trim();
             const specialEducationActivities = [
                'Penyediaan Gaji dan Tunjangan ASN',
                'Penyuluhan dan Penyebarluasan Kebijakan Retribusi Daerah',
                'Sosialisasi Peraturan Perundang-Undangan'
             ];
             // Pastikan NamaSubKegiatan ada sebelum memanggil includes
             const namaSubKegiatan = String(item.NamaSubKegiatan || ''); 
             return pendidikanCodes.has(kodeSubKegiatan) || (namaSkpd === 'Dinas Pendidikan dan Kebudayaan' && specialEducationActivities.includes(namaSubKegiatan));
        };
        const isInfrastruktur = (item) => {
             if (!item) return false;
             const kodeSubKegiatan = String(item.KodeSubKegiatan || '').trim();
             const namaSubKegiatan = String(item.NamaSubKegiatan || '').toLowerCase().trim();
             return infrastrukturNormalCodes.has(kodeSubKegiatan) || infrastrukturXxxNames.has(namaSubKegiatan);
        };
       
        // --- PERBAIKAN UTAMA: Fungsi Agregasi Detail ---
        const aggregateDetails = (anggaranItems, relevantRealisasi) => {
            const aggregatedMap = new Map();

            // 1. Agregasi Pagu Anggaran
            anggaranItems.forEach(item => {
                if (!item) return; 
                
                let aggregationKey;
                const kodeSubKegiatanStr = String(item.KodeSubKegiatan || '').trim();
                 if (kodeSubKegiatanStr.toUpperCase().startsWith('X.XX')) {
                    aggregationKey = `${item.NamaSKPD}|${item.NamaSubUnit || ' '}|${item.NamaSubKegiatan}`;
                } else {
                    aggregationKey = `${item.NamaSKPD}|${item.NamaSubUnit || ' '}|${kodeSubKegiatanStr}`;
                }

                if (!aggregatedMap.has(aggregationKey)) {
                    aggregatedMap.set(aggregationKey, {
                        NamaSKPD: item.NamaSKPD,
                        NamaSubUnit: item.NamaSubUnit,
                        KodeSubKegiatan: item.KodeSubKegiatan, 
                        NamaSubKegiatan: item.NamaSubKegiatan,
                        pagu: 0,
                        realisasi: 0, // Inisialisasi realisasi
                        sisa: 0      
                    });
                }
                const entry = aggregatedMap.get(aggregationKey);
                entry.pagu += item.pagu; // Gunakan item.pagu (nilai asli dari anggaran)
            });

            // 2. Agregasi Realisasi HANYA untuk item yang relevan
            relevantRealisasi.forEach(item => {
                 let aggregationKey;
                 const kodeSubKegiatanStr = String(item.KodeSubKegiatan || '').trim();
                 if (kodeSubKegiatanStr.toUpperCase().startsWith('X.XX')) {
                     aggregationKey = `${item.NamaSKPD}|${item.NamaSubUnit || ' '}|${item.NamaSubKegiatan}`;
                 } else {
                     aggregationKey = `${item.NamaSKPD}|${item.NamaSubUnit || ' '}|${kodeSubKegiatanStr}`;
                 }

                 if (aggregatedMap.has(aggregationKey)) {
                     const entry = aggregatedMap.get(aggregationKey);
                     entry.realisasi += item.nilai; // Tambahkan nilai realisasi ke entri yang cocok
                 }
            });

            // 3. Hitung Sisa dan Persentase
            aggregatedMap.forEach((entry) => {
                entry.sisa = entry.pagu - entry.realisasi;
            });

            return Array.from(aggregatedMap.values()).map(item => ({
                ...item,
                persentase: item.pagu > 0 ? (item.realisasi / item.pagu) * 100 : 0
            }));
        };
        // --- AKHIR PERBAIKAN UTAMA ---

        const totalAPBD = anggaran.reduce((sum, item) => sum + (item?.nilai || 0), 0);
        
        const excludedPegawaiCodes = [ '5.1.01.02.06.0064', '5.1.01.02.06.0066', '5.1.01.02.06.0070', '5.1.01.02.06.0072', '5.1.01.03.03.0001', '5.1.01.03.09.0001', '5.1.01.03.05.0001', '5.1.01.03.11.0001', '5.1.01.02.006.00064', '5.1.01.02.006.00070', '5.1.01.02.006.00066', '5.1.01.02.006.00072'];

        let totalBelanjaPegawai = 0;
        let belanjaPegawaiDikecualikan = 0;
        let belanjaPendidikan = 0;
        let belanjaInfrastruktur = 0;
        let rawDetailPendidikan = []; 
        let rawDetailInfrastruktur = []; 
        
        anggaran.forEach(item => {
            if (!item) return; 
            const kodeRekening = String(item.KodeRekening || '').trim();
            const nilai = item.nilai || 0;
            const processedItem = { ...item, pagu: nilai }; 

            // Pegawai
            if (kodeRekening.startsWith('5.1.01')) {
                totalBelanjaPegawai += nilai;
                if (excludedPegawaiCodes.includes(kodeRekening)) {
                    belanjaPegawaiDikecualikan += nilai;
                }
            }
            
            // Pendidikan
            if (isPendidikan(item)) { 
                belanjaPendidikan += nilai;
                if(processedItem) rawDetailPendidikan.push(processedItem); 
            }

            // Infrastruktur
            if (isInfrastruktur(item)) { 
                belanjaInfrastruktur += nilai;
                 if(processedItem) rawDetailInfrastruktur.push(processedItem);
            }
        });
        
        const belanjaPegawaiUntukPerhitungan = totalBelanjaPegawai - belanjaPegawaiDikecualikan;
        
        // Filter realisasi yang relevan untuk setiap kategori SEBELUM memanggil aggregateDetails
        const realisasiPendidikan = allRealisasi.filter(isPendidikan);
        const realisasiInfrastruktur = allRealisasi.filter(isInfrastruktur);

        const pegawai = {
            totalAPBD, totalBelanjaPegawai, belanjaPegawaiDikecualikan, belanjaPegawaiUntukPerhitungan,
            percentage: totalAPBD > 0 ? (belanjaPegawaiUntukPerhitungan / totalAPBD) * 100 : 0,
            detailItems: [] 
        };

        const infrastruktur = {
            totalAPBD, belanjaInfrastruktur,
            percentage: totalAPBD > 0 ? (belanjaInfrastruktur / totalAPBD) * 100 : 0,
            detailItems: aggregateDetails(rawDetailInfrastruktur, realisasiInfrastruktur) 
        };
        
        const pendidikan = {
            totalAPBD, belanjaPendidikan,
            percentage: totalAPBD > 0 ? (belanjaPendidikan / totalAPBD) * 100 : 0,
            detailItems: aggregateDetails(rawDetailPendidikan, realisasiPendidikan) 
        };

        return { pegawai, infrastruktur, pendidikan };
    }, [anggaran, realisasi, realisasiNonRkud, refPendidikan, refInfrastruktur]);

    const renderAnalysisContent = () => {
        switch (activeTab) {
            case 'infrastruktur':
                return <AnalysisCard
                    title="Belanja Infrastruktur Pelayanan Publik"
                    data={analysisData.infrastruktur}
                    threshold={40}
                    type="infrastruktur"
                    getAnalysisPrompt={getAnalysisPrompt}
                    namaPemda={namaPemda}
                    selectedYear={selectedYear}
                    theme={theme}
                />;
            case 'pendidikan':
                return <AnalysisCard
                    title="Fungsi Pendidikan"
                    data={analysisData.pendidikan}
                    threshold={20}
                    type="pendidikan"
                    getAnalysisPrompt={getAnalysisPrompt}
                    namaPemda={namaPemda}
                    selectedYear={selectedYear}
                    theme={theme}
                />;
            case 'pegawai':
            default:
                return <AnalysisCard
                    title="Belanja Pegawai"
                    data={analysisData.pegawai}
                    threshold={30}
                    type="pegawai"
                    getAnalysisPrompt={getAnalysisPrompt}
                    namaPemda={namaPemda}
                    selectedYear={selectedYear}
                    theme={theme}
                />;
        }
    };
    
    return (
        <div className="space-y-6">
            <SectionTitle>ANALISA MANDATORY SPENDING</SectionTitle>
            <div className="flex border-b dark:border-gray-700">
                <TabButton title="Belanja Pegawai" isActive={activeTab === 'pegawai'} onClick={() => setActiveTab('pegawai')} />
                <TabButton title="Belanja Infrastruktur" isActive={activeTab === 'infrastruktur'} onClick={() => setActiveTab('infrastruktur')} />
                <TabButton title="Fungsi Pendidikan" isActive={activeTab === 'pendidikan'} onClick={() => setActiveTab('pendidikan')} />
            </div>
            {renderAnalysisContent()}
        </div>
    );
};

// --- GANTI SELURUH KOMPONEN DI BAWAH INI ---
const AnalysisCard = ({ title, data, threshold, type, getAnalysisPrompt, namaPemda, selectedYear, theme }) => {
    const [isDetailsVisible, setIsDetailsVisible] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [currentPage, setCurrentPage] = React.useState(1);
    const ITEMS_PER_PAGE = 10;

    const isExceeding = type === 'pegawai' ? data.percentage > threshold : data.percentage < threshold;
    const description = {
        pegawai: "Belanja pegawai paling tinggi 30% (tiga puluh persen) dari total belanja APBD termasuk untuk ASN, kepala daerah, dan anggota DPRD, serta tidak termasuk untuk Tamsil guru, TKG, TPG, dan tunjangan sejenis lainnya yang bersumber dari TKD yang telah ditentukan penggunaannya.",
        infrastruktur: "Belanja infrastruktur pelayanan publik paling rendah 40% (empat puluh persen) dari total belanja APBD, di luar belanja bagi hasil dan/atau transfer kepada daerah dan/atau desa.",
        pendidikan: "Anggaran fungsi pendidikan paling sedikit 20% (dua puluh persen) dari total belanja APBD."
    };

    const detailItems = data.detailItems || [];
    const filteredDetails = React.useMemo(() => {
        return detailItems.filter(item =>
            Object.values(item).some(val =>
                String(val).toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
    }, [detailItems, searchTerm]);

    const totalDetailPages = Math.ceil(filteredDetails.length / ITEMS_PER_PAGE);
    const paginatedDetails = filteredDetails.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handleDetailPageChange = (page) => {
        if (page > 0 && page <= totalDetailPages) {
            setCurrentPage(page);
        }
    };
    
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // --- DIPERBARUI: Fungsi download Excel ---
    const handleDownloadExcel = () => {
        if (!filteredDetails || filteredDetails.length === 0) {
            alert("Tidak ada data untuk diunduh.");
            return;
        }
        if (!window.XLSX) {
            alert("Pustaka unduh Excel tidak tersedia.");
            return;
        }

        try {
            const dataForExport = filteredDetails.map(item => ({
                'Nama SKPD': item.NamaSKPD,
                'Nama Sub Unit': item.NamaSubUnit,
                'Kode Sub Kegiatan': item.KodeSubKegiatan,
                'Nama Sub Kegiatan': item.NamaSubKegiatan,
                'Pagu': item.pagu, // <-- Gunakan .pagu
                'Realisasi': item.realisasi, // <-- Tambahkan .realisasi
                'Sisa Anggaran': item.sisa, // <-- Tambahkan .sisa
                'Persentase (%)': item.persentase.toFixed(2) // <-- Tambahkan .persentase
            }));

            const worksheet = window.XLSX.utils.json_to_sheet(dataForExport);
            const workbook = window.XLSX.utils.book_new();
            window.XLSX.utils.book_append_sheet(workbook, worksheet, "Rincian Belanja");
            
            const fileName = `Rincian_Belanja_${title.replace(/ /g, "_")}_${selectedYear}.xlsx`;
            window.XLSX.writeFile(workbook, fileName);
        } catch (err) {
            console.error("Error creating Excel file:", err);
            alert("Gagal membuat file Excel.");
        }
    };

    // --- DIPERBARUI: Header tabel ---
    const detailHeaders = ['Nama SKPD', 'Nama Sub Unit', 'Kode Sub Kegiatan', 'Nama Sub Kegiatan', 'Pagu', 'Realisasi', 'Sisa Anggaran', '%'];
    
    return (
        <div className="space-y-6">
            {data.percentage > 0 && isExceeding && (
                <div className={`${type === 'pegawai' ? 'bg-red-100 border-red-500 text-red-700' : 'bg-yellow-100 border-yellow-500 text-yellow-700'} border-l-4 p-4 rounded-md`} role="alert">
                    <p className="font-bold">{type === 'pegawai' ? 'Peringatan' : 'Perhatian'}</p>
                    <p>
                        Persentase {title} sebesar {data.percentage?.toFixed(2)}% {type === 'pegawai' ? 'telah melebihi' : 'belum mencapai'} batas {type === 'pegawai' ? 'maksimal' : 'minimal'} {threshold}% yang diatur.
                    </p>
                </div>
            )}
             <GeminiAnalysis 
                getAnalysisPrompt={(customQuery) => getAnalysisPrompt(type, data, customQuery, namaPemda, selectedYear)}
                disabledCondition={!data.totalAPBD && !data.belanjaInfrastruktur && !data.belanjaPendidikan}
                theme={theme}
            />
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md">
                <div className="flex flex-col md:flex-row items-center justify-around gap-8">
                     <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6 text-center">{title}</h3>
                        <div className="mx-auto">
                            <ProgressCircle percentage={data.percentage || 0} threshold={threshold} type={type} />
                        </div>
                    </div>
                    <div className="flex-1 w-full">
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6">Rincian Perhitungan</h3>
                        <div className="space-y-4 text-lg text-gray-700 dark:text-gray-300">
                             {type === 'pegawai' ? (
                                <>
                                 <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"><span>A. Total APBD</span><span className="font-semibold">{formatCurrency(data.totalAPBD)}</span></div>
                                 <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"><span>B. Total Belanja Pegawai</span><span className="font-semibold">{formatCurrency(data.totalBelanjaPegawai)}</span></div>
                                 <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"><span>C. Dikecualikan</span><span className="font-semibold text-red-500">(- {formatCurrency(data.belanjaPegawaiDikecualikan)})</span></div>
                                 <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border-l-4 border-blue-500"><span className="font-medium">Dasar Perhitungan (B - C)</span><span className="font-bold">{formatCurrency(data.belanjaPegawaiUntukPerhitungan)}</span></div>
                                 <div className="flex justify-between items-center border-t pt-4 mt-4 dark:border-gray-600"><span className="font-bold text-xl">Persentase ( (B-C) / A )</span><span className={`font-bold text-2xl ${data.percentage > 30 ? 'text-red-500' : 'text-orange-500'}`}>{data.percentage.toFixed(2)}%</span></div>
                                </>
                            ) : type === 'infrastruktur' ? (
                                <>
                                 <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"><span>A. Total APBD</span><span className="font-semibold">{formatCurrency(data.totalAPBD)}</span></div>
                                 <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border-l-4 border-blue-500"><span className="font-medium">Total Belanja Infrastruktur</span><span className="font-bold">{formatCurrency(data.belanjaInfrastruktur)}</span></div>
                                  <div className="flex justify-between items-center border-t pt-4 mt-4 dark:border-gray-600"><span className="font-bold text-xl">Persentase</span><span className={`font-bold text-2xl ${data.percentage < 40 ? 'text-yellow-500' : 'text-green-500'}`}>{data.percentage.toFixed(2)}%</span></div>
                                </>
                            ) : (
                                <>
                                 <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"><span>A. Total APBD</span><span className="font-semibold">{formatCurrency(data.totalAPBD)}</span></div>
                                 <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border-l-4 border-blue-500"><span className="font-medium">Total Belanja Pendidikan</span><span className="font-bold">{formatCurrency(data.belanjaPendidikan)}</span></div>
                                 <div className="flex justify-between items-center border-t pt-4 mt-4 dark:border-gray-600"><span className="font-bold text-xl">Persentase</span><span className={`font-bold text-2xl ${data.percentage < 20 ? 'text-yellow-500' : 'text-green-500'}`}>{data.percentage.toFixed(2)}%</span></div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                 <p className="text-xs text-gray-500 dark:text-gray-400 mt-8 text-center max-w-3xl mx-auto bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-lg">
                    <b>Keterangan:</b> {description[type]}
                </p>

            </div>
            
            {detailItems.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Rincian Belanja yang Dihitung</h3>
                        <button onClick={() => setIsDetailsVisible(!isDetailsVisible)} className="text-blue-600 dark:text-blue-400 font-medium text-sm flex items-center">
                            {isDetailsVisible ? 'Sembunyikan' : 'Tampilkan'} Rincian
                            {isDetailsVisible ? <ChevronDown className="ml-1 h-4 w-4" /> : <ChevronRight className="ml-1 h-4 w-4" />}
                        </button>
                    </div>

                    {isDetailsVisible && (
                        <div>
                             <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                                 <div className="relative w-full sm:max-w-xs">
                                    <input type="text" placeholder="Cari..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                                </div>
                                <button 
                                    onClick={handleDownloadExcel} 
                                    disabled={filteredDetails.length === 0} 
                                    className="w-full sm:w-auto flex items-center justify-center px-4 py-2 border border-green-600 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Download size={16} className="mr-2"/> Download Excel
                                </button>
                             </div>
                            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            {detailHeaders.map(h => (
                                                <th key={h} className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${h.startsWith('Pagu') || h.startsWith('Real') || h.startsWith('Sisa') || h.startsWith('%') ? 'text-right' : ''}`}>
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {paginatedDetails.length > 0 ? paginatedDetails.map((item, index) => (
                                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{item.NamaSKPD}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{item.NamaSubUnit}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{item.KodeSubKegiatan}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{item.NamaSubKegiatan}</td>
                                                <td className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">{formatCurrency(item.pagu)}</td>
                                                <td className="px-6 py-4 text-right text-sm font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">{formatCurrency(item.realisasi)}</td>
                                                <td className="px-6 py-4 text-right text-sm font-semibold text-green-600 dark:text-green-400 whitespace-nowrap">{formatCurrency(item.sisa)}</td>
                                                <td className="px-6 py-4 text-right text-sm font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">{item.persentase.toFixed(2)}%</td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan={detailHeaders.length} className="text-center py-8 text-gray-500">Tidak ada data yang cocok.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {totalDetailPages > 1 && (
                                <Pagination currentPage={currentPage} totalPages={totalDetailPages} onPageChange={handleDetailPageChange} theme={theme} />
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
// --- AKHIR BLOK PENGGANTIAN ---

const getAnalysisPrompt = (type, data, customQuery, namaPemda, selectedYear) => {
    if (customQuery) {
        return `Berdasarkan data mandatory spending, berikan analisis untuk: "${customQuery}"`;
    }
    
    let promptIntro = `Anda adalah seorang analis anggaran ahli untuk ${namaPemda || 'pemerintah daerah'}. `;
    let analysisDetails = '';
    let recommendationFocus = '';

    switch (type) {
        case 'pegawai':
            analysisDetails = `
Analisis Mandatory Spending untuk Belanja Pegawai tahun ${selectedYear} berdasarkan formula ((Total Belanja Pegawai - Belanja Pegawai Dikecualikan) / Total APBD).
Data menunjukkan:
- Total APBD: ${formatCurrency(data.totalAPBD)}
- Total Belanja Pegawai: ${formatCurrency(data.totalBelanjaPegawai)}
- Belanja Pegawai Dikecualikan: ${formatCurrency(data.belanjaPegawaiDikecualikan)}
- Dasar Perhitungan Belanja Pegawai: ${formatCurrency(data.belanjaPegawaiUntukPerhitungan)}
- Persentase Mandatory Spending: ${data.percentage.toFixed(2)}%`;
            recommendationFocus = `Apakah persentase belanja pegawai sebesar ${data.percentage.toFixed(2)}% ini berada dalam batas wajar (umumnya di bawah 30%)? Apa implikasinya terhadap ruang fiskal? Berikan rekomendasi jika porsi belanja pegawai dianggap terlalu tinggi.`;
            break;
        case 'infrastruktur':
            analysisDetails = `
Analisis Mandatory Spending untuk Belanja Infrastruktur Pelayanan Publik tahun ${selectedYear}.
Data menunjukkan:
- Total APBD: ${formatCurrency(data.totalAPBD)}
- Belanja Infrastruktur: ${formatCurrency(data.belanjaInfrastruktur)}
- Persentase dari Total APBD: ${data.percentage.toFixed(2)}%`;
            recommendationFocus = `Apakah persentase belanja infrastruktur sebesar ${data.percentage.toFixed(2)}% ini sudah memenuhi batas minimal 40%? Apa saja program/kegiatan yang menjadi pendorong utama? Berikan rekomendasi untuk meningkatkan alokasi belanja infrastruktur jika belum tercapai.`;
            break;
        case 'pendidikan':
            analysisDetails = `
Analisis Mandatory Spending untuk Fungsi Pendidikan tahun ${selectedYear}.
Data menunjukkan:
- Total APBD: ${formatCurrency(data.totalAPBD)}
- Belanja Fungsi Pendidikan: ${formatCurrency(data.belanjaPendidikan)}
- Persentase dari Total APBD: ${data.percentage.toFixed(2)}%`;
            recommendationFocus = `Apakah persentase belanja fungsi pendidikan sebesar ${data.percentage.toFixed(2)}% ini sudah memenuhi batas minimal 20%? Apa saja program pendidikan yang mendapatkan alokasi terbesar? Berikan rekomendasi untuk optimalisasi anggaran pendidikan.`;
            break;
    }

    return `${promptIntro}${analysisDetails}\n\nBerikan analisis mengenai:\n${recommendationFocus}`;
};

// --- UPDATED: LaporanTematikView Component ---
const LaporanTematikView = ({ data, theme, namaPemda, userRole, selectedYear }) => {
    const { anggaran, realisasi } = data;
    const [selectedTematik, setSelectedTematik] = React.useState('spm');
    const [refData, setRefData] = React.useState([]);
    const [reportData, setReportData] = React.useState([]);
    const [chartData, setChartData] = React.useState([]);
    const [summaryData, setSummaryData] = React.useState({ pagu: 0, realisasi: 0, percentage: 0 }); 
    const [currentPage, setCurrentPage] = React.useState(1);
    const [expandedRows, setExpandedRows] = React.useState(new Set());
    const ITEMS_PER_PAGE = 15;

    const tematikOptions = {
        spm: { title: 'Standar Pelayanan Minimal', dbKey: 'spm' },
        stunting: { title: 'Penurunan Stunting', dbKey: 'stunting' },
        kemiskinan: { title: 'Penghapusan Kemiskinan Ekstrim', dbKey: 'kemiskinan' },
        inflasi: { title: 'Pengendalian Inflasi', dbKey: 'inflasi' },
        pengawasan: { title: 'Alokasi Anggaran Unsur Pengawasan', dbKey: 'pengawasan' }
    };

    React.useEffect(() => {
        const dbKey = tematikOptions[selectedTematik].dbKey;
        const dataRef = collection(db, "publicData", String(selectedYear), `referensi-${dbKey}`);
        const unsubscribe = onSnapshot(query(dataRef), (snapshot) => {
            let fetchedData = [];
            snapshot.forEach(doc => {
                if (Array.isArray(doc.data().rows)) {
                    fetchedData.push(...doc.data().rows);
                }
            });
            setRefData(fetchedData);
        }, (err) => {
            console.error(`Error fetching ${dbKey} reference:`, err);
            setRefData([]);
        });
        return () => unsubscribe();
    }, [selectedYear, selectedTematik]);

    React.useEffect(() => {
        if (!anggaran.length || !refData.length) {
            setReportData([]);
            setChartData([]);
            setSummaryData({ pagu: 0, realisasi: 0, percentage: 0 });
            return;
        }

        const totalAPBD = anggaran.reduce((sum, item) => sum + (item.nilai || 0), 0);
        const allRealisasi = Object.values(realisasi).flat();
        const refCodes = new Set(refData.map(item => String(item['KODE SUB KEGIATAN']).trim()));
        
        let filteredAnggaran = anggaran.filter(item => item && refCodes.has(String(item.KodeSubKegiatan).trim()));
        let filteredRealisasi = allRealisasi.filter(realItem => realItem && refCodes.has(String(realItem.KodeSubKegiatan).trim()));

        // --- NEW LOGIC: Filter for 'pengawasan' theme ---
        if (selectedTematik === 'pengawasan') {
            const isInspektorat = (item) => 
                (item.NamaSKPD && item.NamaSKPD.toLowerCase().includes('inspektorat')) ||
                (item.NamaSubUnit && item.NamaSubUnit.toLowerCase().includes('inspektorat'));
            
            filteredAnggaran = filteredAnggaran.filter(isInspektorat);
            filteredRealisasi = filteredRealisasi.filter(isInspektorat);
        }
        
        const subKegiatanMap = new Map();

        filteredAnggaran.forEach(item => {
            const key = `${item.NamaSKPD}|${item.NamaSubKegiatan}`;
            if (!subKegiatanMap.has(key)) {
                subKegiatanMap.set(key, {
                    skpd: item.NamaSKPD,
                    subKegiatan: item.NamaSubKegiatan,
                    pagu: 0,
                    realisasi: 0,
                    details: new Map()
                });
            }

            const entry = subKegiatanMap.get(key);
            entry.pagu += item.nilai || 0;
            
            const detailKey = item.NamaRekening;
            if (!entry.details.has(detailKey)) {
                entry.details.set(detailKey, {
                    rekening: item.NamaRekening,
                    anggaran: 0,
                    realisasi: 0
                });
            }
            entry.details.get(detailKey).anggaran += item.nilai || 0;
        });
        
        filteredRealisasi.forEach(realItem => {
            const key = `${realItem.NamaSKPD}|${realItem.NamaSubKegiatan}`;
            if (subKegiatanMap.has(key)) {
                const entry = subKegiatanMap.get(key);
                entry.realisasi += realItem.nilai || 0;
                
                const detailKey = realItem.NamaRekening;
                 if (entry.details.has(detailKey)) {
                    entry.details.get(detailKey).realisasi += realItem.nilai || 0;
                }
            }
        });
        
        const finalData = Array.from(subKegiatanMap.values()).map(item => ({
            ...item,
            details: Array.from(item.details.values()).map(d => ({...d, persentase: d.anggaran > 0 ? (d.realisasi / d.anggaran) * 100 : 0})),
            persentase: item.pagu > 0 ? (item.realisasi / item.pagu) * 100 : 0
        })).sort((a, b) => b.pagu - a.pagu);

        setReportData(finalData);
        
        let totalPaguTematik = 0;
        let totalRealisasiTematik = 0;
        finalData.forEach(item => {
            totalPaguTematik += item.pagu;
            totalRealisasiTematik += item.realisasi;
        });

        const percentage = totalAPBD > 0 ? (totalPaguTematik / totalAPBD) * 100 : 0;
        setSummaryData({ pagu: totalPaguTematik, realisasi: totalRealisasiTematik, percentage: percentage });

        const finalChartData = finalData
            .map(item => ({
                name: item.subKegiatan,
                Pagu: item.pagu,
                Realisasi: item.realisasi,
            }))
            .sort((a, b) => b.Pagu - a.Pagu)
            .slice(0, 15);
        setChartData(finalChartData);

    }, [anggaran, realisasi, refData, selectedTematik]);

    const totalPages = Math.ceil(reportData.length / ITEMS_PER_PAGE);
    const paginatedData = reportData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handlePageChange = (page) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page);
        }
    };
    
    const toggleRow = (key) => {
        const newExpandedRows = new Set(expandedRows);
        if (newExpandedRows.has(key)) {
            newExpandedRows.delete(key);
        } else {
            newExpandedRows.add(key);
        }
        setExpandedRows(newExpandedRows);
    };

    const handleDownloadExcel = () => {
        if (!reportData || reportData.length === 0) {
            alert("Tidak ada data untuk diunduh.");
            return;
        }
        if (!window.XLSX) {
            alert("Pustaka unduh Excel tidak tersedia.");
            return;
        }

        try {
            const dataForExport = reportData.flatMap(item => 
                item.details.map(d => ({
                    'Sub Unit': item.skpd, // Changed header
                    'Sub Kegiatan': item.subKegiatan,
                    'Nama Rekening': d.rekening,
                    'Anggaran': d.anggaran,
                    'Realisasi': d.realisasi,
                    'Persentase (%)': d.persentase.toFixed(2),
                }))
            );

            const worksheet = window.XLSX.utils.json_to_sheet(dataForExport);
            const workbook = window.XLSX.utils.book_new();
            window.XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Tematik");
            
            const fileName = `Laporan_Tematik_${tematikOptions[selectedTematik].title.replace(/ /g, "_")}_${selectedYear}.xlsx`;
            window.XLSX.writeFile(workbook, fileName);
        } catch (err) {
            console.error("Error creating Excel file:", err);
            alert("Gagal membuat file Excel.");
        }
    };

    const currentTagConfig = tematikOptions[selectedTematik];
    
    const getAnalysisPrompt = (customQuery) => {
        if (customQuery) {
            return `Berdasarkan data laporan tematik untuk "${currentTagConfig.title}", berikan analisis untuk permintaan berikut: "${customQuery}"`;
        }
        if (reportData.length === 0) return "Data tidak cukup untuk analisis.";
        
        const top5 = reportData.slice(0, 5).map(item => `- **${item.subKegiatan}** (${item.skpd}): Pagu ${formatCurrency(item.pagu)}, Realisasi ${formatCurrency(item.realisasi)}`).join('\n');
        
        return `
            Anda adalah seorang analis kebijakan publik untuk ${namaPemda || 'pemerintah daerah'}. 
            Lakukan analisis mendalam terhadap alokasi dan realisasi anggaran untuk tema: **${currentTagConfig.title}** pada tahun ${selectedYear}.

            ### Ringkasan Data:
            - **Total Anggaran Teridentifikasi**: ${formatCurrency(summaryData.pagu)}
            - **Total Realisasi Terdistribusi**: ${formatCurrency(summaryData.realisasi)}
            - **Tingkat Penyerapan Keseluruhan**: ${(summaryData.pagu > 0 ? (summaryData.realisasi / summaryData.pagu) * 100 : 0).toFixed(2)}%

            ### 5 Sub Kegiatan dengan Alokasi Terbesar:
            ${top5}

            Berikan analisis mengenai:
            1.  **Efektivitas Alokasi**: Apakah alokasi anggaran sudah terdistribusi dengan baik di antara SKPD-SKPD terkait untuk mendukung tema ini?
            2.  **Kinerja Penyerapan**: Identifikasi SKPD atau sub kegiatan dengan penyerapan tertinggi dan terendah. Apa kemungkinan penyebabnya?
            3.  **Rekomendasi Strategis**: Berdasarkan data, berikan 2-3 rekomendasi konkret untuk meningkatkan efektivitas program pada tema ini di tahun berikutnya.
        `;
    };

    return (
        <div className="space-y-6">
            <SectionTitle>Laporan Tematik</SectionTitle>
            <GeminiAnalysis 
                getAnalysisPrompt={getAnalysisPrompt}
                disabledCondition={reportData.length === 0}
                theme={theme}
                userRole={userRole}
                interactivePlaceholder={`Tanya tentang ${currentTagConfig.title}...`}
            />
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <div className="flex flex-col md:flex-row gap-4 mb-6 items-end">
                    <div className="flex-1">
                        <label htmlFor="tematik-select-report" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pilih Jenis Laporan Tematik:</label>
                        <select
                            id="tematik-select-report"
                            value={selectedTematik}
                            onChange={(e) => setSelectedTematik(e.target.value)}
                            className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {Object.entries(tematikOptions).map(([key, value]) => (
                                <option key={key} value={key}>{value.title}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={handleDownloadExcel}
                        disabled={reportData.length === 0}
                        className="flex-shrink-0 flex items-center justify-center px-4 py-2 border border-green-600 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download size={16} className="mr-2" />
                        Download Excel
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Total Anggaran Tematik</p>
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">{formatCurrency(summaryData.pagu)}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg border border-green-200 dark:border-green-700">
                        <p className="text-sm font-medium text-green-800 dark:text-green-300">Total Realisasi Tematik</p>
                        <p className="text-2xl font-bold text-green-900 dark:text-green-200">{formatCurrency(summaryData.realisasi)}</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
                        <p className="text-sm font-medium text-purple-800 dark:text-purple-300">Persentase Terhadap APBD</p>
                        <p className="text-2xl font-bold text-purple-900 dark:text-purple-200">{summaryData.percentage.toFixed(2)}%</p>
                    </div>
                </div>

                {chartData.length > 0 && (
                    <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-center">
                            Grafik Pagu vs Realisasi Tematik per Sub Unit (Top 15)
                        </h3>
                        <ResponsiveContainer width="100%" height={400}>
                            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 120 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                                <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 10 }} />
                                <YAxis tickFormatter={(val) => `${(val / 1e9).toFixed(1)} M`} tick={{ fontSize: 12 }} />
                                <Tooltip formatter={(value) => formatCurrency(value)} />
                                <Legend verticalAlign="top" />
                                <Line type="monotone" dataKey="Pagu" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 8 }} />
                                <Line type="monotone" dataKey="Realisasi" stroke="#82ca9d" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}


                <div className="space-y-2">
                    {paginatedData.length > 0 ? (
                        paginatedData.map(item => {
                            const rowKey = `${item.skpd}-${item.subKegiatan}`;
                            return (
                                <div key={rowKey} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                    <div onClick={() => toggleRow(rowKey)} className="flex items-center p-4 cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-800 dark:text-gray-200">{item.subKegiatan}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{item.skpd}</p>
                                        </div>
                                        <div className="w-40 text-right mx-4">
                                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(item.pagu)}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Pagu Anggaran</p>
                                        </div>
                                        <div className="w-40 text-right mx-4">
                                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(item.realisasi)}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Total Realisasi</p>
                                        </div>
                                        <button className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
                                            {expandedRows.has(rowKey) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                        </button>
                                    </div>
                                    {expandedRows.has(rowKey) && (
                                        <div className="bg-white dark:bg-gray-800/50 p-4 border-t border-gray-200 dark:border-gray-700">
                                            <h5 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">Rincian Rekening:</h5>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full">
                                                    <thead className="bg-gray-100 dark:bg-gray-700">
                                                        <tr>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Nama Rekening</th>
                                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Anggaran</th>
                                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Realisasi</th>
                                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Persentase</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                                    {item.details.map((d, i) => (
                                                        <tr key={i}>
                                                            <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{d.rekening}</td>
                                                            <td className="px-4 py-2 text-right text-sm text-gray-600 dark:text-gray-400">{formatCurrency(d.anggaran)}</td>
                                                            <td className="px-4 py-2 text-right text-sm text-gray-600 dark:text-gray-400">{formatCurrency(d.realisasi)}</td>
                                                            <td className="px-4 py-2 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">{d.persentase.toFixed(2)}%</td>
                                                        </tr>
                                                    ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })
                    ) : (
                        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                            <p>Tidak ada data anggaran yang cocok dengan penandaan tematik yang dipilih.</p>
                            <p className="text-sm">Pastikan Anda sudah mengunggah file referensi yang sesuai di menu "Penandaan Tematik".</p>
                        </div>
                    )}
                    {totalPages > 1 && (
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} theme={theme} />
                    )}
                </div>
            </div>
        </div>
    );
};

// --- UPDATED AnalisisLintasTahunView Component ---
const AnalisisLintasTahunView = ({ theme, user, selectedYear, namaPemda }) => {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    
    const [yearA, setYearA] = React.useState(selectedYear);
    const [yearB, setYearB] = React.useState(selectedYear - 1);
    const [startMonth, setStartMonth] = React.useState(months[0]);
    const [endMonth, setEndMonth] = React.useState(months[months.length - 1]);
    const [dataA, setDataA] = React.useState(null);
    const [dataB, setDataB] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [selectedSkpdBelanja, setSelectedSkpdBelanja] = React.useState('Semua SKPD');
    const [selectedSkpdPendapatan, setSelectedSkpdPendapatan] = React.useState('Semua SKPD');

    const fetchDataForYear = async (year) => {
        if (!user) return null;
        const dataTypes = ['anggaran', 'pendapatan', 'penerimaanPembiayaan', 'pengeluaranPembiayaan', 'realisasi', 'realisasiPendapatan', 'realisasiNonRkud'];
        const yearData = {};

        for (const dataType of dataTypes) {
            const collRef = collection(db, "publicData", String(year), dataType);
            const snapshot = await getDocs(query(collRef));
            let data = [];
            snapshot.forEach(doc => {
                data = [...data, ...doc.data().data];
            });
            
            if (dataType === 'realisasi' || dataType === 'realisasiPendapatan' || dataType === 'realisasiNonRkud') {
                const monthlyData = data.reduce((acc, item) => {
                    const month = item.month || 'Lainnya';
                    if (!acc[month]) acc[month] = [];
                    acc[month].push(item);
                    return acc;
                }, {});
                yearData[dataType] = monthlyData;
            } else {
                yearData[dataType] = data;
            }
        }
        return yearData;
    };

    React.useEffect(() => {
        const loadComparisonData = async () => {
            if (yearA === yearB) {
                setError("Silakan pilih dua tahun yang berbeda untuk perbandingan.");
                setDataA(null); setDataB(null);
                return;
            }
            setError(''); setIsLoading(true);
            try {
                const [fetchedDataA, fetchedDataB] = await Promise.all([
                    fetchDataForYear(yearA),
                    fetchDataForYear(yearB)
                ]);
                setDataA(fetchedDataA); setDataB(fetchedDataB);
            } catch (e) {
                console.error("Error fetching comparison data:", e);
                setError("Gagal memuat data perbandingan.");
            } finally {
                setIsLoading(false);
            }
        };

        if(user) { loadComparisonData(); }
    }, [yearA, yearB, user]);

    const { skpdListBelanja, skpdListPendapatan, comparisonData, skpdBelanjaComparison, skpdPendapatanComparison, monthlyComparisonData, monthlyPendapatanComparisonData } = React.useMemo(() => {
        if (!dataA || !dataB) return { skpdListBelanja: [], skpdListPendapatan: [], comparisonData: null, skpdBelanjaComparison: null, skpdPendapatanComparison: null, monthlyComparisonData: [], monthlyPendapatanComparisonData: [] };
        
        const startIndex = months.indexOf(startMonth);
        const endIndex = months.indexOf(endMonth);
        const selectedMonths = months.slice(startIndex, endIndex + 1);

        const calculateTotals = (data, monthsToProcess) => {
            const realisasiBelanjaBiasa = monthsToProcess.map(month => data.realisasi?.[month] || []).flat();
            const realisasiNonRkudData = monthsToProcess.map(month => data.realisasiNonRkud?.[month] || []).flat();
            const realisasiBelanjaData = [...realisasiBelanjaBiasa, ...realisasiNonRkudData];
            const realisasiPendapatanData = monthsToProcess.map(month => data.realisasiPendapatan?.[month] || []).flat();

            return {
                anggaran: (data.anggaran || []).reduce((s, i) => s + i.nilai, 0),
                pendapatan: (data.pendapatan || []).reduce((s, i) => s + i.nilai, 0),
                realisasiBelanja: realisasiBelanjaData.reduce((s, i) => s + i.nilai, 0),
                realisasiPendapatan: realisasiPendapatanData.reduce((s, i) => s + i.nilai, 0),
            };
        };

        const totalsA = calculateTotals(dataA, selectedMonths);
        const totalsB = calculateTotals(dataB, selectedMonths);
        const periodLabel = startMonth === endMonth ? startMonth : `${startMonth} - ${endMonth}`;

        const comparisonData = [
            { name: 'Anggaran Belanja', [yearA]: totalsA.anggaran, [yearB]: totalsB.anggaran },
            { name: 'Target Pendapatan', [yearA]: totalsA.pendapatan, [yearB]: totalsB.pendapatan },
            { name: `Realisasi Belanja (${periodLabel})`, [yearA]: totalsA.realisasiBelanja, [yearB]: totalsB.realisasiBelanja },
            { name: `Realisasi Pendapatan (${periodLabel})`, [yearA]: totalsA.realisasiPendapatan, [yearB]: totalsB.realisasiPendapatan },
        ];
        
        const skpdListBelanja = Array.from(new Set([...(dataA.anggaran?.map(d => d.NamaSKPD) || []), ...(dataB.anggaran?.map(d => d.NamaSKPD) || [])])).filter(Boolean).sort();
        const skpdListPendapatan = Array.from(new Set([...(dataA.pendapatan?.map(d => d.NamaOPD) || []), ...(dataB.pendapatan?.map(d => d.NamaOPD) || [])])).filter(Boolean).sort();

        let skpdBelanjaComparison = null;
        if(selectedSkpdBelanja && selectedSkpdBelanja !== 'Semua SKPD') {
            const realisasiAData = [...selectedMonths.map(month => dataA.realisasi?.[month] || []).flat(), ...selectedMonths.map(month => dataA.realisasiNonRkud?.[month] || []).flat()];
            const realisasiBData = [...selectedMonths.map(month => dataB.realisasi?.[month] || []).flat(), ...selectedMonths.map(month => dataB.realisasiNonRkud?.[month] || []).flat()];

            const anggaranA = (dataA.anggaran || []).filter(d => d.NamaSKPD === selectedSkpdBelanja).reduce((s, i) => s + i.nilai, 0);
            const realisasiA = realisasiAData.filter(d => (d.NamaSKPD || d.NAMASKPD) === selectedSkpdBelanja).reduce((s, i) => s + i.nilai, 0);
            const anggaranB = (dataB.anggaran || []).filter(d => d.NamaSKPD === selectedSkpdBelanja).reduce((s, i) => s + i.nilai, 0);
            const realisasiB = realisasiBData.filter(d => (d.NamaSKPD || d.NAMASKPD) === selectedSkpdBelanja).reduce((s, i) => s + i.nilai, 0);
            skpdBelanjaComparison = { anggaranA, realisasiA, anggaranB, realisasiB };
        }
        
        let skpdPendapatanComparison = null;
        if(selectedSkpdPendapatan && selectedSkpdPendapatan !== 'Semua SKPD') {
            const realisasiAData = selectedMonths.map(month => dataA.realisasiPendapatan?.[month] || []).flat();
            const realisasiBData = selectedMonths.map(month => dataB.realisasiPendapatan?.[month] || []).flat();
            const targetA = (dataA.pendapatan || []).filter(d => d.NamaOPD === selectedSkpdPendapatan).reduce((s, i) => s + i.nilai, 0);
            const realisasiA = realisasiAData.filter(d => d.SKPD === selectedSkpdPendapatan).reduce((s, i) => s + i.nilai, 0);
            const targetB = (dataB.pendapatan || []).filter(d => d.NamaOPD === selectedSkpdPendapatan).reduce((s, i) => s + i.nilai, 0);
            const realisasiB = realisasiBData.filter(d => d.SKPD === selectedSkpdPendapatan).reduce((s, i) => s + i.nilai, 0);
            skpdPendapatanComparison = { targetA, realisasiA, targetB, realisasiB };
        }
        
        let cumulativeRealisasiA = 0;
        let cumulativeRealisasiB = 0;
        const monthlyComparisonData = months.map(month => {
            const realisasiBulananA_biasa = ((dataA.realisasi || {})[month] || []).filter(item => selectedSkpdBelanja === 'Semua SKPD' || item.NamaSKPD === selectedSkpdBelanja).reduce((sum, item) => sum + item.nilai, 0);
            const realisasiBulananA_nonRkud = ((dataA.realisasiNonRkud || {})[month] || []).filter(item => selectedSkpdBelanja === 'Semua SKPD' || item.NAMASKPD === selectedSkpdBelanja).reduce((sum, item) => sum + item.nilai, 0);
            const realisasiBulananA = realisasiBulananA_biasa + realisasiBulananA_nonRkud;
            const realisasiBulananB_biasa = ((dataB.realisasi || {})[month] || []).filter(item => selectedSkpdBelanja === 'Semua SKPD' || item.NamaSKPD === selectedSkpdBelanja).reduce((sum, item) => sum + item.nilai, 0);
            const realisasiBulananB_nonRkud = ((dataB.realisasiNonRkud || {})[month] || []).filter(item => selectedSkpdBelanja === 'Semua SKPD' || item.NAMASKPD === selectedSkpdBelanja).reduce((sum, item) => sum + item.nilai, 0);
            const realisasiBulananB = realisasiBulananB_biasa + realisasiBulananB_nonRkud;
            cumulativeRealisasiA += realisasiBulananA;
            cumulativeRealisasiB += realisasiBulananB;
            return { month: month.substring(0,3), [`Realisasi Kumulatif ${yearA}`]: cumulativeRealisasiA, [`Realisasi Kumulatif ${yearB}`]: cumulativeRealisasiB };
        });
// --- BLOK KODE YANG HILANG DAN DITAMBAHKAN KEMBALI ---
        let cumulativePendapatanA = 0;
        let cumulativePendapatanB = 0;
        const monthlyPendapatanComparisonData = months.map(month => {
            const realisasiBulananA = ((dataA.realisasiPendapatan || {})[month] || []).filter(item => selectedSkpdPendapatan === 'Semua SKPD' || item.SKPD === selectedSkpdPendapatan).reduce((sum, item) => sum + item.nilai, 0);
            const realisasiBulananB = ((dataB.realisasiPendapatan || {})[month] || []).filter(item => selectedSkpdPendapatan === 'Semua SKPD' || item.SKPD === selectedSkpdPendapatan).reduce((sum, item) => sum + item.nilai, 0);
            
            cumulativePendapatanA += realisasiBulananA;
            cumulativePendapatanB += realisasiBulananB;
            
            return {
                month: month.substring(0, 3),
                [`Pendapatan Kumulatif ${yearA}`]: cumulativePendapatanA,
                [`Pendapatan Kumulatif ${yearB}`]: cumulativePendapatanB,
            };
        });
        // --- AKHIR DARI BLOK KODE YANG DITAMBAHKAN ---

        return { skpdListBelanja, skpdListPendapatan, comparisonData, skpdBelanjaComparison, skpdPendapatanComparison, monthlyComparisonData, monthlyPendapatanComparisonData };
    }, [dataA, dataB, yearA, yearB, selectedSkpdBelanja, selectedSkpdPendapatan, startMonth, endMonth]);

    const getAnalysisPrompt = (customQuery) => {
        if (customQuery) {
            return `Berdasarkan data perbandingan tahun ${yearA} dan ${yearB}, berikan analisis untuk permintaan berikut: "${customQuery}"`;
        }
        if (!comparisonData) return "Data tidak cukup untuk analisis.";
        const period = startMonth === endMonth ? startMonth : `periode ${startMonth} - ${endMonth}`;
        let prompt = `Anda adalah seorang analis keuangan ahli untuk ${namaPemda || 'pemerintah daerah'}. Lakukan analisis perbandingan APBD antara tahun ${yearA} dan ${yearB} untuk **${period}**.\n\nData Ringkas:\n`;
        comparisonData.forEach(item => {
            prompt += `- ${item.name}: ${yearA} (${formatCurrency(item[yearA])}) vs ${yearB} (${formatCurrency(item[yearB])})\n`;
        });

        if (skpdBelanjaComparison && selectedSkpdBelanja && selectedSkpdBelanja !== 'Semua SKPD') {
            prompt += `\nFokus Analisis Belanja SKPD: **${selectedSkpdBelanja}**\n`;
            prompt += `- Anggaran: ${yearA} (${formatCurrency(skpdBelanjaComparison.anggaranA)}) vs ${yearB} (${formatCurrency(skpdBelanjaComparison.anggaranB)})\n`;
            prompt += `- Realisasi (${period}): ${yearA} (${formatCurrency(skpdBelanjaComparison.realisasiA)}) vs ${yearB} (${formatCurrency(skpdBelanjaComparison.realisasiB)})\n`;
        }
        
        if (skpdPendapatanComparison && selectedSkpdPendapatan && selectedSkpdPendapatan !== 'Semua SKPD') {
            prompt += `\nFokus Analisis Pendapatan SKPD: **${selectedSkpdPendapatan}**\n`;
            prompt += `- Target: ${yearA} (${formatCurrency(skpdPendapatanComparison.targetA)}) vs ${yearB} (${formatCurrency(skpdPendapatanComparison.targetB)})\n`;
            prompt += `- Realisasi (${period}): ${yearA} (${formatCurrency(skpdPendapatanComparison.realisasiA)}) vs ${yearB} (${formatCurrency(skpdPendapatanComparison.realisasiB)})\n`;
        }

        prompt += "\nBerikan analisis mendalam tentang tren, perubahan signifikan, dan kemungkinan penyebabnya. Berikan juga rekomendasi strategis berdasarkan perbandingan ini.";
        return prompt;
    };

    const ComparisonCard = ({ title, valueA, valueB, yearA, yearB }) => {
        const change = valueA - valueB;
        const percentageChange = valueB !== 0 ? (change / valueB) * 100 : 0;
        const isIncrease = change > 0;
        const colorClass = isIncrease ? 'text-green-500' : 'text-red-500';

        return (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
                <h4 className="text-gray-500 dark:text-gray-400 font-medium mb-2">{title}</h4>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{formatCurrency(valueA)}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">vs {formatCurrency(valueB)} ({yearB})</p>
                <div className={`mt-2 flex items-center font-semibold ${colorClass}`}>
                    {change !== 0 && (isIncrease ? <TrendingUp size={16} className="mr-1"/> : <TrendingUp size={16} className="mr-1 transform rotate-180"/>)}
                    <span>{percentageChange.toFixed(2)}%</span>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <SectionTitle>Analisis Lintas Tahun</SectionTitle>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label htmlFor="yearA-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pilih Tahun Utama</label>
                        <select id="yearA-select" value={yearA} onChange={e => setYearA(parseInt(e.target.value))} className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="yearB-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bandingkan Dengan</label>
                        <select id="yearB-select" value={yearB} onChange={e => setYearB(parseInt(e.target.value))} className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="start-month-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dari Bulan</label>
                        <select id="start-month-select" value={startMonth} onChange={e => setStartMonth(e.target.value)} className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            {months.map(m => <option key={`start-${m}`} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="end-month-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sampai Bulan</label>
                        <select id="end-month-select" value={endMonth} onChange={e => setEndMonth(e.target.value)} className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            {months.map(m => <option key={`end-${m}`} value={m}>{m}</option>)}
                        </select>
                    </div>
                </div>

                {isLoading && <div className="text-center py-10"><Loader className="animate-spin mx-auto text-blue-500" size={40}/></div>}
                {error && <p className="text-center text-red-500 py-10">{error}</p>}

                {comparisonData && !isLoading && (
                    <div className="space-y-8">
                        <GeminiAnalysis 
                            getAnalysisPrompt={getAnalysisPrompt} 
                            disabledCondition={!comparisonData} 
                            theme={theme}
                            interactivePlaceholder="Bandingkan realisasi belanja Juli..."
                        />
                         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                            {comparisonData.map(item => (
                                <ComparisonCard key={item.name} title={item.name} valueA={item[yearA]} valueB={item[yearB]} yearA={yearA} yearB={yearB} />
                            ))}
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Grafik Perbandingan APBD</h3>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={comparisonData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                    <YAxis tickFormatter={(val) => `${(val / 1e9).toFixed(1)} M`} tick={{ fontSize: 12 }} />
                                    <Tooltip formatter={(value) => formatCurrency(value)} />
                                    <Legend />
                                    <Bar dataKey={yearA} fill="#435EBE" name={`Tahun ${yearA}`} radius={[4, 4, 0, 0]} />
                                    <Bar dataKey={yearB} fill="#1E293B" name={`Tahun ${yearB}`} radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        
                        {/* --- UPDATED: Restructured Layout --- */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg space-y-6">
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Statistik Belanja per SKPD</h3>
                                    <select value={selectedSkpdBelanja} onChange={e => setSelectedSkpdBelanja(e.target.value)} className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        <option value="Semua SKPD">Semua SKPD</option>
                                        {skpdListBelanja.map(skpd => <option key={skpd} value={skpd}>{skpd}</option>)}
                                    </select>
                                    {selectedSkpdBelanja !== 'Semua SKPD' && skpdBelanjaComparison && (
                                        <div className="mt-4 space-y-4">
                                            <ComparisonCard title={`Anggaran ${selectedSkpdBelanja}`} valueA={skpdBelanjaComparison.anggaranA} valueB={skpdBelanjaComparison.anggaranB} yearA={yearA} yearB={yearB} />
                                            <ComparisonCard title={`Realisasi ${selectedSkpdBelanja} (${startMonth} - ${endMonth})`} valueA={skpdBelanjaComparison.realisasiA} valueB={skpdBelanjaComparison.realisasiB} yearA={yearA} yearB={yearB} />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Pola Penyerapan Anggaran - {selectedSkpdBelanja}</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={monthlyComparisonData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                                            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                                            <YAxis tickFormatter={(val) => `${(val / 1e9).toFixed(1)}M`} tick={{ fontSize: 10 }} />
                                            <Tooltip formatter={(value) => formatCurrency(value)} />
                                            <Legend wrapperStyle={{fontSize: "12px"}}/>
                                            <Line type="monotone" dataKey={`Realisasi Kumulatif ${yearA}`} stroke="#8884d8" strokeWidth={2} name={`${yearA}`} />
                                            <Line type="monotone" dataKey={`Realisasi Kumulatif ${yearB}`} stroke="#82ca9d" strokeWidth={2} name={`${yearB}`} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg space-y-6">
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Statistik Pendapatan per SKPD</h3>
                                    <select value={selectedSkpdPendapatan} onChange={e => setSelectedSkpdPendapatan(e.target.value)} className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        <option value="Semua SKPD">Semua SKPD</option>
                                        {skpdListPendapatan.map(skpd => <option key={skpd} value={skpd}>{skpd}</option>)}
                                    </select>
                                    {selectedSkpdPendapatan !== 'Semua SKPD' && skpdPendapatanComparison && (
                                        <div className="mt-4 space-y-4">
                                            <ComparisonCard title={`Target ${selectedSkpdPendapatan}`} valueA={skpdPendapatanComparison.targetA} valueB={skpdPendapatanComparison.targetB} yearA={yearA} yearB={yearB} />
                                            <ComparisonCard title={`Realisasi ${selectedSkpdPendapatan} (${startMonth} - ${endMonth})`} valueA={skpdPendapatanComparison.realisasiA} valueB={skpdPendapatanComparison.realisasiB} yearA={yearA} yearB={yearB} />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Pola Pencapaian Pendapatan - {selectedSkpdPendapatan}</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={monthlyPendapatanComparisonData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                                            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                                            <YAxis tickFormatter={(val) => `${(val / 1e9).toFixed(1)}M`} tick={{ fontSize: 10 }} />
                                            <Tooltip formatter={(value) => formatCurrency(value)} />
                                            <Legend wrapperStyle={{fontSize: "12px"}}/>
                                            <Line type="monotone" dataKey={`Pendapatan Kumulatif ${yearA}`} stroke="#435EBE" strokeWidth={2} name={`${yearA}`} />
                                            <Line type="monotone" dataKey={`Pendapatan Kumulatif ${yearB}`} stroke="#F59E0B" strokeWidth={2} name={`${yearB}`} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


// --- UPDATED PengaturanView Component ---
const PengaturanView = ({ selectedYear, onYearChange, theme, userRole, saveSettings, namaPemda: initialNamaPemda }) => {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
    
    const [users, setUsers] = React.useState([]);
    const [newUserUid, setNewUserUid] = React.useState('');
    const [newUserEmail, setNewUserEmail] = React.useState('');
    const [newUserRole, setNewUserRole] = React.useState('viewer');
    const [error, setError] = React.useState('');
    
    const [namaPemda, setNamaPemda] = React.useState(initialNamaPemda || '');
    const [isSaving, setIsSaving] = React.useState(false);
    
    const [isBackingUp, setIsBackingUp] = React.useState(false);
    const [backupStatus, setBackupStatus] = React.useState('');

    // --- NEW: States for editing users ---
    const [editingUserId, setEditingUserId] = React.useState(null);
    const [editingUserRole, setEditingUserRole] = React.useState('');

    React.useEffect(() => {
        setNamaPemda(initialNamaPemda || '');
    }, [initialNamaPemda]);

    const handleBackupData = async () => {
        if (!window.confirm(`Anda akan mengunduh semua data untuk tahun ${selectedYear}. Proses ini mungkin memerlukan beberapa waktu. Lanjutkan?`)) {
            return;
        }

        setIsBackingUp(true);
        setBackupStatus('Mempersiapkan...');
        
        try {
            const backupData = {};
            const dataTypes = [
                'anggaran', 'pendapatan', 'penerimaanPembiayaan', 'pengeluaranPembiayaan', 
                'realisasi', 'realisasiPendapatan', 'referensi-pendapatan', 'referensi-belanja',
                'referensi-penandaan', 'penandaan-anggaran', 'referensi-pendidikan', 'referensi-infrastruktur'
            ];
            
            for (const dataType of dataTypes) {
                setBackupStatus(`Mengambil data: ${dataType}...`);
                const collRef = collection(db, "publicData", String(selectedYear), dataType);
                const snapshot = await getDocs(query(collRef));
                let allDocsData = [];
                snapshot.forEach(doc => {
                    const docData = doc.data();
                    if (docData.data) allDocsData.push(...docData.data);
                    if (docData.rows) allDocsData.push(...docData.rows);
                });
                backupData[dataType] = allDocsData;
            }

            const globalCollections = ['users', 'logs'];
            for (const collName of globalCollections) {
                 setBackupStatus(`Mengambil data: ${collName}...`);
                 const collRef = collection(db, collName);
                 const snapshot = await getDocs(query(collRef));
                 backupData[collName] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            }
            
            setBackupStatus('Mengambil data: pengaturan...');
            const settingsDocRef = doc(db, "publicSettings", "settings");
            const settingsDoc = await getDoc(settingsDocRef);
            if(settingsDoc.exists()) {
                backupData['publicSettings'] = settingsDoc.data();
            }

            setBackupStatus('Membuat file unduhan...');
            const jsonString = JSON.stringify(backupData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup-apbd-${selectedYear}-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            setBackupStatus('Backup berhasil diunduh!');
            await logActivity('Backup Data', { year: selectedYear, status: 'Berhasil' });

        } catch (err) {
            console.error("Backup error:", err);
            setError("Gagal membuat file backup. Periksa konsol untuk detail.");
            setBackupStatus('');
            await logActivity('Backup Data', { year: selectedYear, status: 'Gagal', error: err.message });
        } finally {
            setIsBackingUp(false);
            setTimeout(() => setBackupStatus(''), 5000);
        }
    };

    React.useEffect(() => {
        if (userRole === 'admin') {
            const usersCollectionRef = collection(db, "users");
            const unsubscribe = onSnapshot(usersCollectionRef, (snapshot) => {
                const userList = [];
                snapshot.forEach(doc => {
                    userList.push({ id: doc.id, ...doc.data() });
                });
                setUsers(userList);
            });
            return () => unsubscribe();
        }
    }, [userRole]);

    const handleAddUser = async (e) => {
        e.preventDefault();
        setError('');
        if (!newUserUid || !newUserEmail) {
            setError('UID dan Email pengguna harus diisi.');
            return;
        }
        try {
            const userDocRef = doc(db, "users", newUserUid);
            await setDoc(userDocRef, {
                email: newUserEmail,
                role: newUserRole
            });
            await logActivity('Tambah Pengguna', { addedUserEmail: newUserEmail, role: newUserRole });
            setNewUserUid('');
            setNewUserEmail('');
            setNewUserRole('viewer');
        } catch (err) {
            console.error("Error adding user:", err);
            setError('Gagal menambahkan pengguna.');
        }
    };
    
    // --- NEW: Function to start editing a user ---
    const handleStartEditing = (user) => {
        setEditingUserId(user.id);
        setEditingUserRole(user.role);
    };

    // --- NEW: Function to cancel editing ---
    const handleCancelEditing = () => {
        setEditingUserId(null);
        setEditingUserRole('');
    };
    
    // --- NEW: Function to update user role ---
    const handleUpdateUserRole = async (userId, userEmail) => {
        setError('');
        const userDocRef = doc(db, "users", userId);
        try {
            await updateDoc(userDocRef, { role: editingUserRole });
            await logActivity('Ubah Peran Pengguna', { updatedUserEmail: userEmail, newRole: editingUserRole });
            handleCancelEditing(); // Exit editing mode
        } catch (err) {
            console.error("Error updating user role:", err);
            setError('Gagal memperbarui peran pengguna.');
        }
    };


    const handleDeleteUser = async (uid, email) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus peran pengguna ini? Pengguna tidak akan dihapus dari sistem, hanya perannya.')) {
            try {
                const userDocRef = doc(db, "users", uid);
                await deleteDoc(userDocRef);
                await logActivity('Hapus Pengguna', { deletedUserEmail: email });
            } catch (err) {
                console.error("Error deleting user:", err);
                setError('Gagal menghapus pengguna.');
            }
        }
    };

    const handleSaveNamaPemda = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await saveSettings({ namaPemda: namaPemda });
            await logActivity('Simpan Nama Instansi', { newName: namaPemda });
        } catch (err) {
            setError('Gagal menyimpan nama Pemda.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <SectionTitle>Pengaturan Aplikasi</SectionTitle>
            
            {userRole === 'admin' && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Informasi Instansi</h3>
                    <form onSubmit={handleSaveNamaPemda} className="flex items-end gap-4">
                        <div className="flex-grow">
                            <label htmlFor="namaPemda" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nama Instansi/Pemda</label>
                            <input
                                id="namaPemda"
                                type="text"
                                value={namaPemda}
                                onChange={(e) => setNamaPemda(e.target.value)}
                                placeholder="Contoh: Pemerintah Kota Medan"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:opacity-50">
                            {isSaving ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </form>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Pengaturan Tahun Anggaran</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Pilih tahun anggaran yang ingin Anda analisis atau unggah datanya. Semua data yang ditampilkan dan diunggah akan terikat pada tahun yang dipilih.
                </p>
                <div className="max-w-xs">
                    <label htmlFor="year-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tahun Anggaran:</label>
                    <select
                        id="year-select"
                        value={selectedYear}
                        onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
                        className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {years.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
            </div>

            {userRole === 'admin' && (
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Manajemen Pengguna</h3>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="font-semibold">Cara Menambahkan Pengguna Baru:</p>
                        <ol className="list-decimal list-inside mt-2 space-y-1">
                            <li>Pastikan pengguna sudah membuat akun dan login ke aplikasi ini setidaknya satu kali.</li>
                            <li>Buka <a href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/users`} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Firebase Console &rarr; Authentication</a>.</li>
                            <li>Salin "User UID" untuk pengguna yang ingin Anda tambahkan.</li>
                            <li>Tempel UID tersebut beserta email dan peran yang diinginkan di formulir bawah ini.</li>
                        </ol>
                    </div>
                    <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-6">
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">User UID</label>
                            <input type="text" value={newUserUid} onChange={e => setNewUserUid(e.target.value)} placeholder="UID dari Firebase Auth" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Email</label>
                            <input type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} placeholder="Email Pengguna" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Peran</label>
                            <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="viewer">Viewer</option>
                                <option value="editor">Editor</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <button type="submit" className="flex items-center justify-center h-10 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors">
                            <UserPlus size={18} className="mr-2" /> Tambah
                        </button>
                    </form>
                    {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                             <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Peran</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {users.map(user => (
                                    <tr key={user.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{user.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {editingUserId === user.id ? (
                                                <select
                                                    value={editingUserRole}
                                                    onChange={(e) => setEditingUserRole(e.target.value)}
                                                    className="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700"
                                                >
                                                    <option value="viewer">Viewer</option>
                                                    <option value="editor">Editor</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            ) : (
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.role === 'admin' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : user.role === 'editor' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'}`}>
                                                    {user.role}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {editingUserId === user.id ? (
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleUpdateUserRole(user.id, user.email)} className="text-green-600 hover:text-green-800 font-semibold">Simpan</button>
                                                    <button onClick={handleCancelEditing} className="text-gray-600 hover:text-gray-800">Batal</button>
                                                </div>
                                            ) : (
                                                <div className="flex justify-end gap-4">
                                                    <button onClick={() => handleStartEditing(user)} className="text-blue-600 hover:text-blue-800"><Edit size={18}/></button>
                                                    <button onClick={() => handleDeleteUser(user.id, user.email)} className="text-red-600 hover:text-red-800"><Trash2 size={18}/></button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {userRole === 'admin' && (
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Cadangkan Data</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Unduh salinan lengkap dari semua data aplikasi (anggaran, realisasi, pengguna, log, dll.) untuk tahun anggaran yang dipilih sebagai file JSON.
                    </p>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={handleBackupData} 
                            disabled={isBackingUp} 
                            className="flex items-center justify-center px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isBackingUp ? <Loader size={18} className="animate-spin mr-2" /> : <Download size={18} className="mr-2" />}
                            {isBackingUp ? 'Memproses...' : `Unduh Backup Tahun ${selectedYear}`}
                        </button>
                        {backupStatus && <p className="text-sm text-gray-500 dark:text-gray-400">{backupStatus}</p>}
                    </div>
                </div>
            )}
        </div>
    );
};


// --- UPDATED DataUploadView Component with Delete per Month button ---
const DataUploadView = ({ title, data, instruction, isMonthly, columnMapping, previewHeaders, groupedColumns, dataFilter, theme, onUpload, onDeleteMonth, isDeleting, selectedYear, userRole, getAnalysisPrompt, namaPemda }) => {
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
    
     if (title.includes('Realisasi Belanja') || title.includes('Non RKUD')) {
        return { type: 'belanja', totalBulanIni, totalSemuaBulan };
    }
    if (title.includes('Realisasi Pendapatan')) {
        return { type: 'pendapatan', totalBulanIni, totalSemuaBulan };
    }

    return null;
  }, [data, selectedMonth, isMonthly, title]);

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
          
          const fileName = `${title} - ${isMonthly ? selectedMonth : ''} ${selectedYear}.xlsx`;
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
                                const hasData = data[month] && data[month].length > 0;
                                return (
                                    <div key={month} className={`flex items-center p-3 rounded-lg ${hasData ? 'bg-green-100 dark:bg-green-900/50' : 'bg-yellow-100 dark:bg-yellow-900/50'}`}>
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
                                <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Total Belanja Semua Bulan (s/d Desember)</p>
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
                                <p className="text-sm font-medium text-teal-800 dark:text-teal-300">Total Pendapatan Semua Bulan (s/d Desember)</p>
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
                            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="py-2 pl-2 pr-4 bg-transparent text-gray-700 dark:text-gray-300 font-medium focus:outline-none">
                                {months.map(month => <option key={month} value={month}>{month}</option>)}
                            </select>
                        </div>
                    )}
                    <button onClick={handleButtonClick} disabled={isUploading || userRole !== 'admin'} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {isUploading ? 'Mengunggah...' : `Pilih File untuk ${isMonthly ? selectedMonth : 'Data'}`}
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
                            className="p-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={`Hapus Data ${selectedMonth}`}
                        >
                           {isDeleting ? <Loader className="animate-spin" size={20}/> : <Trash2 size={20}/>}
                        </button>
                    )}
                </div>
                {userRole !== 'admin' && <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Hanya Admin yang dapat mengunggah data.</p>}
                <input type="file" ref={fileInputRef} className="hidden" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleFileUpload}/>
                {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
                {uploadProgress && <p className="mt-4 text-sm text-blue-600">{uploadProgress}</p>}
            </div>

            <div className="mt-8">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                    <h3 className="font-bold text-lg text-gray-700 dark:text-gray-300">Pratinjau Data {isMonthly ? `untuk ${selectedMonth}` : ''}</h3>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        {isMonthly && (
                            <button onClick={handleDownloadExcel} disabled={dataToPreview.length === 0} className="flex items-center justify-center px-4 py-2 border border-green-600 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 disabled:opacity-50 disabled:cursor-not-allowed">
                                <Download size={16} className="mr-2"/>
                                Download
                            </button>
                        )}
                        <div className="relative flex-grow" ref={columnSelectorRef}>
                            <button onClick={() => setIsColumnSelectorOpen(prev => !prev)} className="flex items-center justify-center w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
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
                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
                                placeholder="Cari..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
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
                    {paginatedData.length > 0 ? (() => {
                        let lastGroupValues = {};
                        return paginatedData.map((item, index) => {
                            return (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
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
                                        <td key={header} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            <span className={colIndex === 0 ? 'font-medium text-gray-900 dark:text-gray-100' : ''}>{isGrouped && !showValue ? '' : cellValue}</span>
                                        </td>
                                    );
                                })}
                            </tr>
                            );
                        });
                        })() : (
                        <tr>
                        <td colSpan={visibleHeaders.length} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">Belum ada data yang diunggah atau tidak ditemukan.</td>
                        </tr>
                    )}
                    </tbody>
                </table>
                </div>
                {totalPages > 1 && (
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} theme={theme} />
                )}
            </div>
        </div>
    </div>
  );
};

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

// NEW: ReferensiPenandaanView (Functional)
const ReferensiPenandaanView = ({ userRole, selectedYear }) => {
    const [tags, setTags] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState('');
    
    const [tagName, setTagName] = React.useState('');
    const [tagDescription, setTagDescription] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const [editingTag, setEditingTag] = React.useState(null); // State to hold the tag being edited

    const tagsCollectionRef = collection(db, "publicData", String(selectedYear), "referensi-penandaan");

    React.useEffect(() => {
        const unsubscribe = onSnapshot(tagsCollectionRef, (snapshot) => {
            const tagsList = [];
            snapshot.forEach(doc => {
                tagsList.push({ id: doc.id, ...doc.data() });
            });
            setTags(tagsList);
            setIsLoading(false);
        }, (err) => {
            console.error("Error fetching tags:", err);
            setError("Gagal memuat data penandaan.");
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [selectedYear]);
    
    const handleAddTag = async (e) => {
        e.preventDefault();
        if (!tagName) {
            setError("Nama penandaan tidak boleh kosong.");
            return;
        }
        setIsSubmitting(true);
        setError('');
        
        const newTagData = {
            name: tagName.startsWith('#') ? tagName : `#${tagName}`,
            description: tagDescription,
        };

        try {
            await addDoc(tagsCollectionRef, newTagData);
            await logActivity('Tambah Penandaan', { tagName: newTagData.name });
            setTagName('');
            setTagDescription('');
        } catch (err) {
            console.error("Error adding tag:", err);
            setError("Gagal menambahkan penandaan baru.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleUpdateTag = async (e) => {
        e.preventDefault();
        if (!editingTag || !editingTag.name) {
            setError("Nama penandaan tidak boleh kosong.");
            return;
        }
        setIsSubmitting(true);
        setError('');

        const tagDocRef = doc(db, "publicData", String(selectedYear), "referensi-penandaan", editingTag.id);
        
        try {
            await updateDoc(tagDocRef, {
                name: editingTag.name,
                description: editingTag.description,
            });
            await logActivity('Update Penandaan', { tagName: editingTag.name });
            setEditingTag(null); // Close the edit form
        } catch (err) {
            console.error("Error updating tag:", err);
            setError("Gagal memperbarui penandaan.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteTag = async (tagId, tagName) => {
        if (window.confirm(`Apakah Anda yakin ingin menghapus penandaan "${tagName}"?`)) {
            try {
                const tagDocRef = doc(db, "publicData", String(selectedYear), "referensi-penandaan", tagId);
                await deleteDoc(tagDocRef);
                await logActivity('Hapus Penandaan', { tagName: tagName });
            } catch (err) {
                console.error("Error deleting tag:", err);
                setError("Gagal menghapus penandaan.");
            }
        }
    };
    
    const startEditing = (tag) => {
        setEditingTag({ ...tag });
    };

    return (
        <div className="space-y-6">
            <SectionTitle>Kamus Penandaan Anggaran</SectionTitle>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Buat Kamus Penandaan Baru</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Gunakan kamus ini untuk mengelompokkan berbagai kegiatan di lintas SKPD ke dalam satu tema strategis, seperti #PenurunanStunting atau #InfrastrukturPrioritas.
                </p>
                {userRole === 'admin' ? (
                    <form onSubmit={editingTag ? handleUpdateTag : handleAddTag} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start mb-6">
                        <div>
                            <label htmlFor="tagName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Penandaan</label>
                            <input 
                                id="tagName"
                                type="text"
                                value={editingTag ? editingTag.name : tagName}
                                onChange={(e) => editingTag ? setEditingTag({...editingTag, name: e.target.value}) : setTagName(e.target.value)}
                                placeholder="#ContohPenandaan"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="tagDesc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deskripsi</label>
                            <div className="flex gap-2">
                                <input 
                                    id="tagDesc"
                                    type="text"
                                    value={editingTag ? editingTag.description : tagDescription}
                                    onChange={(e) => editingTag ? setEditingTag({...editingTag, description: e.target.value}) : setTagDescription(e.target.value)}
                                    placeholder="Kegiatan terkait..."
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                    disabled={isSubmitting}
                                />
                                <button type="submit" disabled={isSubmitting} className="flex-shrink-0 flex items-center justify-center h-10 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                    {isSubmitting ? <Loader size={18} className="animate-spin" /> : (editingTag ? 'Update' : 'Tambah')}
                                </button>
                                {editingTag && (
                                    <button type="button" onClick={() => setEditingTag(null)} className="flex-shrink-0 flex items-center justify-center h-10 px-4 bg-gray-500 text-white font-semibold rounded-lg shadow-md hover:bg-gray-600 transition-colors">
                                        Batal
                                    </button>
                                )}
                            </div>
                        </div>
                    </form>
                ) : (
                    <p className="text-sm text-center text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/40 p-3 rounded-lg mb-4">Hanya Admin yang dapat mengelola kamus penandaan.</p>
                )}
                {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
                
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-8 mb-4">Daftar Penandaan Aktif</h3>
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nama</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Deskripsi</th>
                                {userRole === 'admin' && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Aksi</th>}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {isLoading ? (
                                <tr><td colSpan={userRole === 'admin' ? 3 : 2} className="text-center py-8"><Loader className="animate-spin mx-auto text-blue-500" /></td></tr>
                            ) : tags.length > 0 ? tags.map(tag => (
                                <tr key={tag.id}>
                                    <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-sm font-medium rounded-full">{tag.name}</span></td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{tag.description}</td>
                                    {userRole === 'admin' && (
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-4">
                                                <button onClick={() => startEditing(tag)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"><Edit size={18}/></button>
                                                <button onClick={() => handleDeleteTag(tag.id, tag.name)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"><Trash2 size={18}/></button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            )) : (
                                <tr><td colSpan={userRole === 'admin' ? 3 : 2} className="text-center py-8 text-gray-500">Belum ada kamus penandaan yang dibuat.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

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

// --- UPDATED ProsesPenandaanView Component ---
const ProsesPenandaanView = ({ data, theme, userRole, selectedYear }) => {
    const { anggaran, realisasi } = data;
    const [kamusTags, setKamusTags] = React.useState([]);
    const [taggedItems, setTaggedItems] = React.useState([]);
    
    // Form states
    const [selectedSkpd, setSelectedSkpd] = React.useState('');
    const [selectedSubKegiatan, setSelectedSubKegiatan] = React.useState('');
    const [selectedSumberDana, setSelectedSumberDana] = React.useState('');
    const [selectedPaket, setSelectedPaket] = React.useState('');
    const [selectedRekening, setSelectedRekening] = React.useState('');
    const [selectedItem, setSelectedItem] = React.useState(null);
    const [selectedTag, setSelectedTag] = React.useState('');
    
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [editingItem, setEditingItem] = React.useState(null);

    // States for search, pagination, and bulk delete
    const [searchTerm, setSearchTerm] = React.useState('');
    const [currentPage, setCurrentPage] = React.useState(1);
    const [selectedForDeletion, setSelectedForDeletion] = React.useState([]);
    const ITEMS_PER_PAGE = 10;
    
    // State for the tag filter dropdown
    const [filterByTag, setFilterByTag] = React.useState('');
    
    // --- NEW: State for expanded rows ---
    const [expandedRows, setExpandedRows] = React.useState(new Set());


    // Fetch tag dictionary and tagged items
    React.useEffect(() => {
        const kamusRef = collection(db, "publicData", String(selectedYear), "referensi-penandaan");
        const taggedRef = collection(db, "publicData", String(selectedYear), "penandaan-anggaran");

        const unsubKamus = onSnapshot(kamusRef, snapshot => {
            setKamusTags(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        
        const unsubTagged = onSnapshot(taggedRef, snapshot => {
            setTaggedItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
            unsubKamus();
            unsubTagged();
        };
    }, [selectedYear]);

    const allRealisasi = React.useMemo(() => Object.values(realisasi).flat(), [realisasi]);

    const taggedItemsWithRealisasi = React.useMemo(() => {
        return taggedItems.map(item => {
            const realisasiTerkait = allRealisasi.filter(r => {
                const hasValidCodes = item.KodeSubKegiatan && item.KodeRekening && r.KodeSubKegiatan && r.KodeRekening;
                
                return hasValidCodes &&
                    r.KodeSubKegiatan === item.KodeSubKegiatan &&
                    r.KodeRekening === item.KodeRekening &&
                    r.NamaSKPD === item.NamaSKPD;
            });
            const totalRealisasi = realisasiTerkait.reduce((sum, r) => sum + r.nilai, 0);
            const persentase = item.nilai > 0 ? (totalRealisasi / item.nilai) * 100 : 0;
            // --- NEW: Include realization details for dropdown ---
            return { ...item, totalRealisasi, persentase, realisasiDetails: realisasiTerkait };
        });
    }, [taggedItems, allRealisasi]);

    const tagFilterOptions = React.useMemo(() => {
        return [...new Set(taggedItems.map(item => item.tagName))].sort();
    }, [taggedItems]);

    const filteredTaggedItems = React.useMemo(() => {
        let items = taggedItemsWithRealisasi;

        if (filterByTag) {
            items = items.filter(item => item.tagName === filterByTag);
        }

        if (searchTerm) {
            items = items.filter(item =>
                item.tagName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.NamaSKPD?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.NamaSubKegiatan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.NamaRekening?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        return items;
    }, [taggedItemsWithRealisasi, searchTerm, filterByTag]);

    const totalPages = Math.ceil(filteredTaggedItems.length / ITEMS_PER_PAGE);
    const paginatedData = filteredTaggedItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handlePageChange = (page) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterByTag]);

    const handleToggleDeletion = (itemId) => {
        setSelectedForDeletion(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const handleSelectAllOnPage = () => {
        const currentPageIds = paginatedData.map(item => item.id);
        const allSelectedOnPage = currentPageIds.length > 0 && currentPageIds.every(id => selectedForDeletion.includes(id));

        if (allSelectedOnPage) {
            setSelectedForDeletion(prev => prev.filter(id => !currentPageIds.includes(id)));
        } else {
            setSelectedForDeletion(prev => [...new Set([...prev, ...currentPageIds])]);
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedForDeletion.length === 0) {
            setError("Tidak ada item yang dipilih untuk dihapus.");
            return;
        }
        if (window.confirm(`Apakah Anda yakin ingin menghapus ${selectedForDeletion.length} penandaan yang dipilih?`)) {
            setIsLoading(true);
            const batch = writeBatch(db);
            selectedForDeletion.forEach(itemId => {
                const docRef = doc(db, "publicData", String(selectedYear), "penandaan-anggaran", itemId);
                batch.delete(docRef);
            });
            try {
                await batch.commit();
                setSelectedForDeletion([]);
            } catch (err) {
                console.error("Error deleting selected items:", err);
                setError("Gagal menghapus penandaan yang dipilih.");
            } finally {
                setIsLoading(false);
            }
        }
    };

    const skpdList = React.useMemo(() => Array.from(new Set(anggaran.map(item => item.NamaSKPD).filter(Boolean))).sort(), [anggaran]);
    const subKegiatanList = React.useMemo(() => !selectedSkpd ? [] : Array.from(new Set(anggaran.filter(item => item.NamaSKPD === selectedSkpd).map(item => item.NamaSubKegiatan).filter(Boolean))).sort(), [anggaran, selectedSkpd]);
    const sumberDanaList = React.useMemo(() => !selectedSubKegiatan ? [] : Array.from(new Set(anggaran.filter(item => item.NamaSKPD === selectedSkpd && item.NamaSubKegiatan === selectedSubKegiatan).map(item => item.NamaSumberDana).filter(Boolean))).sort(), [anggaran, selectedSkpd, selectedSubKegiatan]);
    const paketList = React.useMemo(() => !selectedSumberDana ? [] : Array.from(new Set(anggaran.filter(item => item.NamaSKPD === selectedSkpd && item.NamaSubKegiatan === selectedSubKegiatan && item.NamaSumberDana === selectedSumberDana).map(item => item.NamaPaketKelompok).filter(Boolean))).sort(), [anggaran, selectedSkpd, selectedSubKegiatan, selectedSumberDana]);
    const rekeningList = React.useMemo(() => !selectedPaket ? [] : Array.from(new Set(anggaran.filter(item => item.NamaSKPD === selectedSkpd && item.NamaSubKegiatan === selectedSubKegiatan && item.NamaSumberDana === selectedSumberDana && item.NamaPaketKelompok === selectedPaket).map(item => item.NamaRekening).filter(Boolean))).sort(), [anggaran, selectedSkpd, selectedSubKegiatan, selectedSumberDana, selectedPaket]);
    
    React.useEffect(() => {
        if (selectedSkpd && selectedSubKegiatan && selectedSumberDana && selectedPaket && selectedRekening) {
            const item = anggaran.find(i => i.NamaSKPD === selectedSkpd && i.NamaSubKegiatan === selectedSubKegiatan && i.NamaSumberDana === selectedSumberDana && i.NamaPaketKelompok === selectedPaket && i.NamaRekening === selectedRekening);
            setSelectedItem(item || null);
        } else {
            setSelectedItem(null);
        }
    }, [selectedSkpd, selectedSubKegiatan, selectedSumberDana, selectedPaket, selectedRekening, anggaran]);
    
    const resetForm = () => {
        setSelectedSkpd(''); setSelectedSubKegiatan(''); setSelectedSumberDana(''); setSelectedPaket(''); setSelectedRekening(''); setSelectedTag(''); setSelectedItem(null); setEditingItem(null);
    };

    React.useEffect(() => { if (!editingItem) { setSelectedSubKegiatan(''); setSelectedSumberDana(''); setSelectedPaket(''); setSelectedRekening(''); } }, [selectedSkpd, editingItem]);
    React.useEffect(() => { if (!editingItem) { setSelectedSumberDana(''); setSelectedPaket(''); setSelectedRekening(''); } }, [selectedSubKegiatan, editingItem]);
    React.useEffect(() => { if (!editingItem) { setSelectedPaket(''); setSelectedRekening(''); } }, [selectedSumberDana, editingItem]);
    React.useEffect(() => { if (!editingItem) { setSelectedRekening(''); } }, [selectedPaket, editingItem]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedItem || !selectedTag) { setError("Harap lengkapi semua pilihan dan pilih penandaan."); return; }
        setIsLoading(true); setError('');
        
        try {
            const tagData = kamusTags.find(t => t.id === selectedTag);
            if (!tagData) throw new Error("Data penandaan tidak ditemukan.");

            if (editingItem) {
                const docRef = doc(db, "publicData", String(selectedYear), "penandaan-anggaran", editingItem.id);
                await updateDoc(docRef, { tagId: selectedTag, tagName: tagData.name });
            } else {
                const budgetItemId = `${selectedItem.NamaSKPD}-${selectedItem.NamaSubKegiatan}-${selectedItem.NamaRekening}`.replace(/[^a-zA-Z0-9-]/g, '');
                const docRef = doc(db, "publicData", String(selectedYear), "penandaan-anggaran", budgetItemId);
                
                const existingDoc = await getDoc(docRef);
                if (existingDoc.exists()) throw new Error("Item anggaran ini sudah pernah ditandai sebelumnya.");

                await setDoc(docRef, { ...selectedItem, tagId: selectedTag, tagName: tagData.name, timestamp: new Date() });
            }
            resetForm();
        } catch (err) {
            console.error("Error saving tagged item:", err);
            setError(`Gagal menyimpan: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDeleteTaggedItem = async (itemId) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus penandaan ini?")) {
            const docRef = doc(db, "publicData", String(selectedYear), "penandaan-anggaran", itemId);
            try { await deleteDoc(docRef); } catch (err) { console.error("Error deleting tagged item:", err); setError("Gagal menghapus penandaan."); }
        }
    };

    const handleStartEditing = (item) => {
        setEditingItem(item); setSelectedSkpd(item.NamaSKPD); setSelectedSubKegiatan(item.NamaSubKegiatan); setSelectedSumberDana(item.NamaSumberDana); setSelectedPaket(item.NamaPaketKelompok); setSelectedRekening(item.NamaRekening); setSelectedTag(item.tagId);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    
    // --- NEW: Toggle function for expandable rows ---
    const toggleRow = (itemId) => {
        const newExpandedRows = new Set(expandedRows);
        if (newExpandedRows.has(itemId)) {
            newExpandedRows.delete(itemId);
        } else {
            newExpandedRows.add(itemId);
        }
        setExpandedRows(newExpandedRows);
    };

    return (
        <div className="space-y-6">
            <SectionTitle>Proses Penandaan Anggaran</SectionTitle>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">{editingItem ? 'Edit Penandaan' : 'Tandai Item Anggaran'}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{editingItem ? 'Ubah penandaan untuk item anggaran yang sudah dipilih.' : 'Pilih item anggaran dari data yang sudah diunggah, lalu terapkan penandaan yang sesuai dari kamus.'}</p>
                {userRole === 'admin' ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <SelectInput label="Nama SKPD" value={selectedSkpd} onChange={setSelectedSkpd} options={skpdList} placeholder="-- Pilih SKPD --" disabled={!!editingItem} />
                            <SelectInput label="Nama Sub Kegiatan" value={selectedSubKegiatan} onChange={setSelectedSubKegiatan} options={subKegiatanList} placeholder="-- Pilih Sub Kegiatan --" disabled={!selectedSkpd || !!editingItem} />
                            <SelectInput label="Sumber Dana" value={selectedSumberDana} onChange={setSelectedSumberDana} options={sumberDanaList} placeholder="-- Pilih Sumber Dana --" disabled={!selectedSubKegiatan || !!editingItem} />
                            <SelectInput label="Paket/Kelompok" value={selectedPaket} onChange={setSelectedPaket} options={paketList} placeholder="-- Pilih Paket/Kelompok --" disabled={!selectedSumberDana || !!editingItem} />
                            <SelectInput label="Nama Rekening" value={selectedRekening} onChange={setSelectedRekening} options={rekeningList} placeholder="-- Pilih Rekening --" disabled={!selectedPaket || !!editingItem} />
                        </div>
                        {selectedItem && <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border dark:border-gray-600 text-sm"><span className="font-semibold text-gray-600 dark:text-gray-400">Pagu Anggaran Terpilih:</span> <span className="ml-2 font-bold text-lg text-blue-600 dark:text-blue-400">{formatCurrency(selectedItem.nilai)}</span></div>}
                        <div className="flex flex-col md:flex-row items-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex-grow w-full"><SelectInput label="Pilih Penandaan" value={selectedTag} onChange={setSelectedTag} options={kamusTags.map(t => ({ value: t.id, label: `${t.name} - ${t.description}` }))} placeholder="-- Pilih Penandaan --" disabled={!selectedItem} useObjectAsOption /></div>
                            <div className="flex gap-2 w-full md:w-auto">{editingItem && <button type="button" onClick={resetForm} className="w-full md:w-auto flex items-center justify-center px-6 py-2 bg-gray-500 text-white font-semibold rounded-lg shadow-md hover:bg-gray-600 transition-colors">Batal</button>}<button type="submit" disabled={isLoading || !selectedItem || !selectedTag} className="w-full md:w-auto flex items-center justify-center px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{isLoading ? <Loader size={18} className="animate-spin mr-2" /> : <Tag size={18} className="mr-2" />}{editingItem ? 'Update Penandaan' : 'Simpan Penandaan'}</button></div>
                        </div>
                    </form>
                ) : <p className="text-sm text-center text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/40 p-3 rounded-lg mb-4">Hanya Admin yang dapat melakukan proses penandaan.</p>}
                 {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
            </div>

             <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Daftar Anggaran yang Sudah Ditandai</h3>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <select
                            value={filterByTag}
                            onChange={(e) => setFilterByTag(e.target.value)}
                            className="w-full md:w-64 pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">-- Filter Berdasarkan Tag --</option>
                            {tagFilterOptions.map(tag => (
                                <option key={tag} value={tag}>{tag}</option>
                            ))}
                        </select>
                        <div className="relative w-full md:w-auto">
                            <input type="text" placeholder="Cari..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                        </div>
                    </div>
                </div>
                 <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                {userRole === 'admin' && <th className="px-6 py-3 text-left"><input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" onChange={handleSelectAllOnPage} checked={paginatedData.length > 0 && paginatedData.every(item => selectedForDeletion.includes(item.id))} /></th>}
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Penandaan</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">SKPD & Sub Kegiatan</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rekening</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Pagu</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Realisasi</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Penyerapan (%)</th>
                                {userRole === 'admin' && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Aksi</th>}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {paginatedData.length > 0 ? paginatedData.map(item => (
                                <React.Fragment key={item.id}>
                                    <tr className={`${selectedForDeletion.includes(item.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''} hover:bg-gray-50 dark:hover:bg-gray-700/50`}>
                                        {userRole === 'admin' && <td className="px-6 py-4"><input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" checked={selectedForDeletion.includes(item.id)} onChange={() => handleToggleDeletion(item.id)} /></td>}
                                        <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-sm font-medium rounded-full">{item.tagName}</span></td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs whitespace-normal break-words"><div className="font-semibold text-gray-800 dark:text-gray-200">{item.NamaSKPD}</div><div>{item.NamaSubKegiatan}</div></td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs whitespace-normal break-words">{item.NamaRekening}</td>
                                        <td className="px-6 py-4 text-right text-sm font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(item.nilai)}</td>
                                        <td className="px-6 py-4 text-right text-sm text-gray-800 dark:text-gray-200">{formatCurrency(item.totalRealisasi)}</td>
                                        <td className="px-6 py-4 text-right text-sm font-bold text-gray-800 dark:text-gray-200">{item.persentase.toFixed(2)}%</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end items-center gap-4">
                                                <button onClick={() => toggleRow(item.id)} className="text-gray-500 hover:text-gray-800" title="Lihat Rincian Realisasi">
                                                    {expandedRows.has(item.id) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                                </button>
                                                {userRole === 'admin' && (
                                                    <>
                                                    <button onClick={() => handleStartEditing(item)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"><Edit size={18}/></button>
                                                    <button onClick={() => handleDeleteTaggedItem(item.id)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"><Trash2 size={18}/></button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedRows.has(item.id) && (
                                        <tr className="bg-gray-50 dark:bg-gray-900/30">
                                            <td colSpan={userRole === 'admin' ? 8 : 7} className="p-4">
                                                <h4 className="font-semibold text-sm mb-2 text-gray-700 dark:text-gray-300">Rincian Realisasi:</h4>
                                                {item.realisasiDetails.length > 0 ? (
                                                    <div className="overflow-x-auto rounded border dark:border-gray-600">
                                                        <table className="min-w-full">
                                                            <thead className="bg-gray-100 dark:bg-gray-700">
                                                                <tr>
                                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Nomor SP2D</th>
                                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Keterangan</th>
                                                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Nilai</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                                                {item.realisasiDetails.map((detail, idx) => (
                                                                    <tr key={idx}>
                                                                        <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 font-mono">{detail.NomorSP2D || '-'}</td>
                                                                        <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">{detail.KeteranganDokumen || '-'}</td>
                                                                        <td className="px-4 py-2 text-right text-sm text-gray-600 dark:text-gray-300">{formatCurrency(detail.nilai)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                ) : <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada realisasi untuk item anggaran ini.</p>}
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            )) : <tr><td colSpan={userRole === 'admin' ? 8 : 7} className="text-center py-8 text-gray-500">Belum ada anggaran yang ditandai atau tidak ditemukan.</td></tr>}
                        </tbody>
                    </table>
                 </div>
                 {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} theme={theme} />}
            </div>
        </div>
    );
};

const SelectInput = ({ label, value, onChange, options, placeholder, disabled = false, useObjectAsOption = false }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-800"
        >
            <option value="">{placeholder}</option>
            {useObjectAsOption ? 
                options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>) :
                options.map(opt => <option key={opt} value={opt}>{opt}</option>)
            }
        </select>
    </div>
);

// NEW: Login View Component
const LoginView = ({ theme }) => {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // onAuthStateChanged will handle the redirect
        } catch (err) {
            setError("Gagal login. Periksa kembali email dan password Anda.");
            console.error("Login error:", err);
            setIsLoading(false);
        }
    };

    return (
        <div className={`min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 ${theme}`}>
            <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">Sistem Informasi Analisa APBD Kota Medan</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Silakan login untuk melanjutkan</p>
                </div>
                <form className="space-y-6" onSubmit={handleLogin}>
                    <div>
                        <label htmlFor="email" className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Alamat Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="nama@email.com"
                        />
                    </div>
                    <div>
                        <label htmlFor="password"className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="********"
                        />
                    </div>
                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <Loader className="animate-spin mr-2" size={20} /> : <LogIn className="mr-2" size={20} />}
                            {isLoading ? 'Memproses...' : 'Login'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- UPDATED AnalisisKualitasBelanjaView Component ---
const AnalisisKualitasBelanjaView = ({ data, theme, selectedYear }) => {
    // 1. Mengambil data realisasiNonRkud
    const { anggaran, realisasi, realisasiNonRkud } = data;
    const [selectedSkpd, setSelectedSkpd] = React.useState('Semua SKPD');
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const [startMonth, setStartMonth] = React.useState(months[0]);
    const [endMonth, setEndMonth] = React.useState(months[months.length - 1]);
    
    const skpdList = React.useMemo(() => {
        const skpds = new Set((anggaran || []).map(item => item.NamaSKPD).filter(Boolean));
        return Array.from(skpds).sort();
    }, [anggaran]);

    // Fungsi klasifikasi berdasarkan KODE rekening (untuk data anggaran & realisasi biasa)
    const classifyRekeningByCode = (kodeRekening) => {
        if (!kodeRekening) return 'Lainnya';
        const kode = String(kodeRekening);
        if (kode.startsWith('5.2')) return 'Belanja Modal';
        if (kode.startsWith('5.1.01')) return 'Belanja Pegawai';
        if (kode.startsWith('5.1.02')) return 'Belanja Barang & Jasa';
        if (kode.startsWith('5.1.05') || kode.startsWith('5.1.06')) return 'Belanja Transfer';
        if (kode.startsWith('5.3')) return 'Belanja Tak Terduga';
        return 'Lainnya';
    };

    // Fungsi klasifikasi baru berdasarkan NAMA rekening (khusus untuk data Non RKUD)
    const classifyRekeningByName = (namaRekening) => {
        if (!namaRekening) return 'Lainnya';
        const nama = String(namaRekening).toUpperCase();
        if (nama.includes('MODAL')) return 'Belanja Modal';
        if (nama.includes('PEGAWAI')) return 'Belanja Pegawai';
        if (nama.includes('BARANG') && nama.includes('JASA')) return 'Belanja Barang & Jasa';
        if (nama.includes('TRANSFER')) return 'Belanja Transfer';
        // BTT tidak dapat diidentifikasi dari nama, jadi akan masuk ke Lainnya
        return 'Lainnya';
    };

    const qualityStats = React.useMemo(() => {
        const initialStats = {
            'Belanja Modal': { pagu: 0, realisasi: 0 },
            'Belanja Pegawai': { pagu: 0, realisasi: 0 },
            'Belanja Barang & Jasa': { pagu: 0, realisasi: 0 },
            'Belanja Transfer': { pagu: 0, realisasi: 0 },
            'Belanja Tak Terduga': { pagu: 0, realisasi: 0 },
            'Lainnya': { pagu: 0, realisasi: 0 },
        };

        const filteredAnggaran = selectedSkpd === 'Semua SKPD' ? (anggaran || []) : (anggaran || []).filter(item => item.NamaSKPD === selectedSkpd);
        
        filteredAnggaran.forEach(item => {
            const category = classifyRekeningByCode(item.KodeRekening);
            initialStats[category].pagu += (item.nilai || 0);
        });

        const startIndex = months.indexOf(startMonth);
        const endIndex = months.indexOf(endMonth);
        const selectedMonths = months.slice(startIndex, endIndex + 1);

        // 2. Menggabungkan dan memfilter data realisasi
        const realisasiBulanIni = selectedMonths.map(month => (realisasi || {})[month] || []).flat();
        const nonRkudBulanIni = selectedMonths.map(month => (realisasiNonRkud || {})[month] || []).flat();
        
        const filteredRealisasi = selectedSkpd === 'Semua SKPD' ? realisasiBulanIni : realisasiBulanIni.filter(item => item.NamaSKPD === selectedSkpd);
        const filteredNonRkud = selectedSkpd === 'Semua SKPD' ? nonRkudBulanIni : nonRkudBulanIni.filter(item => item.NAMASKPD === selectedSkpd);

        // 3. Menghitung realisasi dari kedua sumber dengan metode klasifikasi yang berbeda
        filteredRealisasi.forEach(item => {
            const category = classifyRekeningByCode(item.KodeRekening);
            initialStats[category].realisasi += (item.nilai || 0);
        });

        filteredNonRkud.forEach(item => {
            const category = classifyRekeningByName(item.NAMAREKENING);
            initialStats[category].realisasi += (item.nilai || 0);
        });
        
        const totalPagu = Object.values(initialStats).reduce((sum, item) => sum + item.pagu, 0);
        const totalRealisasi = Object.values(initialStats).reduce((sum, item) => sum + item.realisasi, 0);
        
        const tableData = Object.entries(initialStats).map(([name, values]) => ({
            name,
            ...values,
            persenPagu: totalPagu > 0 ? (values.pagu / totalPagu) * 100 : 0,
            persenRealisasi: totalRealisasi > 0 ? (values.realisasi / totalRealisasi) * 100 : 0,
            penyerapan: values.pagu > 0 ? (values.realisasi / values.pagu) * 100 : 0,
        }));

        const paguChart = tableData.filter(d => d.pagu > 0).map(d => ({ name: d.name, value: d.pagu }));
        const realisasiChart = tableData.filter(d => d.realisasi > 0).map(d => ({ name: d.name, value: d.realisasi }));
        
        return { tableData, paguChart, realisasiChart, totalPagu, totalRealisasi };

    }, [anggaran, realisasi, realisasiNonRkud, selectedSkpd, startMonth, endMonth]); // Ditambahkan realisasiNonRkud

    const getAnalysisPrompt = (customQuery) => {
        if (customQuery) {
            return `Berdasarkan data kualitas belanja, berikan analisis untuk: "${customQuery}"`;
        }
        if (qualityStats.totalPagu === 0) return "Data anggaran tidak cukup untuk analisis.";
        
        const { tableData, totalPagu, totalRealisasi } = qualityStats;
        const belanjaModal = tableData.find(d => d.name === 'Belanja Modal');
        const belanjaOperasi = tableData.filter(d => ['Belanja Pegawai', 'Belanja Barang & Jasa', 'Lainnya'].includes(d.name)).reduce((acc, curr) => ({ pagu: acc.pagu + curr.pagu, realisasi: acc.realisasi + curr.realisasi }), { pagu: 0, realisasi: 0 });

        const rasioModalPagu = (belanjaModal.pagu / totalPagu) * 100;
        const rasioOperasiPagu = (belanjaOperasi.pagu / totalPagu) * 100;
        const period = startMonth === endMonth ? startMonth : `periode ${startMonth} - ${endMonth}`;

        return `
            Anda adalah seorang analis kebijakan fiskal. Lakukan analisis kualitas belanja untuk **${selectedSkpd}** pada **${period}**.
            
            ### Komposisi Anggaran (Pagu)
            - **Total Anggaran Belanja**: ${formatCurrency(totalPagu)}
            - **Belanja Modal**: ${formatCurrency(belanjaModal.pagu)} (${rasioModalPagu.toFixed(2)}%)
            - **Belanja Operasi (Pegawai, Barang/Jasa, Lainnya)**: ${formatCurrency(belanjaOperasi.pagu)} (${rasioOperasiPagu.toFixed(2)}%)
            
            ### Komposisi Realisasi (${period})
            - **Total Realisasi Belanja**: ${formatCurrency(totalRealisasi)}
            - **Realisasi Belanja Modal**: ${formatCurrency(belanjaModal.realisasi)} (Penyerapan: ${belanjaModal.penyerapan.toFixed(2)}%)
            - **Realisasi Belanja Operasi**: ${formatCurrency(belanjaOperasi.realisasi)}
            
            Berikan analisis mendalam mengenai:
            1.  **Kualitas Alokasi Anggaran**: Apakah rasio belanja modal terhadap belanja operasi sudah ideal? (Umumnya, porsi belanja modal yang lebih tinggi dianggap lebih berkualitas untuk pembangunan jangka panjang).
            2.  **Kualitas Eksekusi Anggaran**: Bandingkan tingkat penyerapan antara belanja modal dan jenis belanja lainnya. Apakah ada kendala dalam merealisasikan belanja modal?
            3.  **Rekomendasi**: Berikan rekomendasi konkret untuk meningkatkan kualitas belanja di masa depan, baik dari sisi perencanaan maupun eksekusi.
        `;
    };
    
    const PIE_COLORS = {
        'Belanja Modal': '#10B981', 
        'Belanja Pegawai': '#EF4444', 
        'Belanja Barang & Jasa': '#F59E0B', 
        'Belanja Transfer': '#3B82F6', 
        'Belanja Tak Terduga': '#6366F1', 
        'Lainnya': '#6B7280'
    };


    return (
        <div className="space-y-6">
            <SectionTitle>Analisis Belanja</SectionTitle>
            <GeminiAnalysis 
                getAnalysisPrompt={getAnalysisPrompt} 
                disabledCondition={qualityStats.totalPagu === 0} 
                theme={theme}
                interactivePlaceholder="Bandingkan porsi belanja modal dan pegawai..."
            />
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <select
                        value={selectedSkpd}
                        onChange={(e) => setSelectedSkpd(e.target.value)}
                        className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                        <option value="Semua SKPD">-- Semua SKPD --</option>
                        {skpdList.map(skpd => <option key={skpd} value={skpd}>{skpd}</option>)}
                    </select>
                     <div className="md:col-span-2 grid grid-cols-2 gap-4">
                        <select value={startMonth} onChange={e => setStartMonth(e.target.value)} className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
                            {months.map(month => <option key={`start-${month}`} value={month}>Dari: {month}</option>)}
                        </select>
                        <select value={endMonth} onChange={e => setEndMonth(e.target.value)} className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
                            {months.map(month => <option key={`end-${month}`} value={month}>Sampai: {month}</option>)}
                        </select>
                    </div>
                </div>

                {qualityStats.totalPagu > 0 ? (
                    <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-center">Komposisi Pagu Anggaran</h3>
                             <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie data={qualityStats.paguChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                        {qualityStats.paguChart.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => formatCurrency(value)} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-center">Komposisi Realisasi ({startMonth} - {endMonth})</h3>
                             <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie data={qualityStats.realisasiChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                        {qualityStats.realisasiChart.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => formatCurrency(value)} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Jenis Belanja</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Pagu Anggaran</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Realisasi</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">% Pagu</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">% Realisasi</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Penyerapan</th>
                                </tr>
                            </thead>
                             <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {qualityStats.tableData.map(item => (
                                    <tr key={item.name} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center">
                                            <span className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: PIE_COLORS[item.name] }}></span>
                                            {item.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">{formatCurrency(item.pagu)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">{formatCurrency(item.realisasi)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">{item.persenPagu.toFixed(2)}%</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">{item.persenRealisasi.toFixed(2)}%</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-700 dark:text-gray-300">{item.penyerapan.toFixed(2)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    </>
                ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-10">Tidak ada data anggaran untuk ditampilkan. Silakan unggah data terlebih dahulu.</p>
                )}
            </div>
        </div>
    );
};

// NEW: AnalisisPotensiSiLPAView Component
const AnalisisPotensiSiLPAView = ({ data, theme, selectedYear, userRole }) => {
    // 1. Mengambil data realisasiNonRkud
    const { anggaran, realisasi, realisasiNonRkud } = data;
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    const lastMonthWithData = React.useMemo(() => {
        // Cek kedua sumber realisasi untuk bulan terakhir
        for (let i = months.length - 1; i >= 0; i--) {
            if ((realisasi && realisasi[months[i]] && realisasi[months[i]].length > 0) || 
                (realisasiNonRkud && realisasiNonRkud[months[i]] && realisasiNonRkud[months[i]].length > 0)) {
                return months[i];
            }
        }
        return months[0];
    }, [realisasi, realisasiNonRkud]);

    const [projectionMonth, setProjectionMonth] = React.useState(lastMonthWithData);
    
    React.useEffect(() => {
        setProjectionMonth(lastMonthWithData);
    }, [lastMonthWithData]);

    const silpaData = React.useMemo(() => {
        const skpdAnggaranMap = new Map();
        (anggaran || []).forEach(item => {
            const skpd = item.NamaSKPD || 'Tanpa SKPD';
            skpdAnggaranMap.set(skpd, (skpdAnggaranMap.get(skpd) || 0) + item.nilai);
        });

        const projectionMonthIndex = months.indexOf(projectionMonth);
        const monthsPassed = projectionMonthIndex + 1;
        const monthsRemaining = 12 - monthsPassed;
        const passedMonths = months.slice(0, monthsPassed);

        // --- LOGIKA BARU: Menggabungkan Realisasi RKUD & Non RKUD ---
        const skpdRealisasiMap = new Map();
        passedMonths.forEach(month => {
            // Proses realisasi biasa (RKUD)
            ((realisasi || {})[month] || []).forEach(item => {
                const skpd = item.NamaSKPD || 'Tanpa SKPD';
                skpdRealisasiMap.set(skpd, (skpdRealisasiMap.get(skpd) || 0) + item.nilai);
            });
            // Proses realisasi Non RKUD
            ((realisasiNonRkud || {})[month] || []).forEach(item => {
                const skpd = item.NAMASKPD || 'Tanpa SKPD';
                skpdRealisasiMap.set(skpd, (skpdRealisasiMap.get(skpd) || 0) + item.nilai);
            });
        });
        // --- AKHIR LOGIKA BARU ---

        const tableData = Array.from(skpdAnggaranMap.keys()).map(skpd => {
            const totalAnggaran = skpdAnggaranMap.get(skpd) || 0;
            const realisasiHinggaSaatIni = skpdRealisasiMap.get(skpd) || 0;
            
            const rataRataBulanan = monthsPassed > 0 ? realisasiHinggaSaatIni / monthsPassed : 0;
            const proyeksiSisaBulan = rataRataBulanan * monthsRemaining;
            const proyeksiAkhirTahun = realisasiHinggaSaatIni + proyeksiSisaBulan;
            
            const potensiSiLPA = totalAnggaran - proyeksiAkhirTahun;
            const persenSiLPA = totalAnggaran > 0 ? (potensiSiLPA / totalAnggaran) * 100 : 0;

            return { skpd, totalAnggaran, realisasiHinggaSaatIni, proyeksiAkhirTahun, potensiSiLPA, persenSiLPA };
        }).sort((a, b) => b.potensiSiLPA - a.potensiSiLPA);
        
        const totals = tableData.reduce((acc, curr) => ({
            totalAnggaran: acc.totalAnggaran + curr.totalAnggaran,
            proyeksiAkhirTahun: acc.proyeksiAkhirTahun + curr.proyeksiAkhirTahun,
            potensiSiLPA: acc.potensiSiLPA + curr.potensiSiLPA,
        }), { totalAnggaran: 0, proyeksiAkhirTahun: 0, potensiSiLPA: 0 });
        
        const chartData = tableData.slice(0, 10);

        return { tableData, totals, chartData };
    }, [anggaran, realisasi, realisasiNonRkud, projectionMonth]);

    const getAnalysisPrompt = (customQuery) => {
        if (customQuery) {
            return `Berdasarkan data potensi SiLPA, berikan analisis untuk: "${customQuery}"`;
        }
        if (silpaData.tableData.length === 0) return "Data tidak cukup untuk analisis.";

        const { tableData, totals } = silpaData;
        const top5SiLPA = tableData.slice(0, 5);

        return `
            Anda adalah seorang ahli perencanaan dan evaluasi anggaran pemerintah.
            Berdasarkan proyeksi realisasi hingga akhir tahun ${selectedYear} (dihitung dari data s/d bulan ${projectionMonth}), ditemukan potensi SiLPA (Sisa Lebih Perhitungan Anggaran) sebesar **${formatCurrency(totals.potensiSiLPA)}**.

            SiLPA yang tinggi dapat mengindikasikan perencanaan yang kurang matang atau eksekusi program yang lambat.
            
            Berikut adalah 5 SKPD dengan potensi SiLPA terbesar:
            ${top5SiLPA.map(s => `- **${s.skpd}**: Potensi SiLPA ${formatCurrency(s.potensiSiLPA)} (${s.persenSiLPA.toFixed(2)}% dari anggarannya)`).join('\n')}

            Berikan analisis mendalam mengenai:
            1.  Implikasi dari potensi SiLPA sebesar ini terhadap APBD secara keseluruhan.
            2.  Faktor-faktor yang mungkin menyebabkan tingginya potensi SiLPA di SKPD-SKPD tersebut.
            3.  Rekomendasi strategis yang dapat segera diambil oleh pimpinan daerah, seperti percepatan lelang/kegiatan, atau perencanaan pergeseran anggaran untuk program yang lebih mendesak.
        `;
    };
    
    return (
        <div className="space-y-6">
            <SectionTitle>Analisis Potensi SiLPA</SectionTitle>
            <GeminiAnalysis 
                getAnalysisPrompt={getAnalysisPrompt}
                disabledCondition={silpaData.tableData.length === 0}
                theme={theme}
                selectedYear={selectedYear}
                interactivePlaceholder="Analisis potensi SiLPA untuk Dinas Kesehatan..."
                userRole={userRole}
            />
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div>
                        <label htmlFor="projection-month-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Proyeksi Berdasarkan Data s/d Bulan:</label>
                        <select
                            id="projection-month-select"
                            value={projectionMonth}
                            onChange={(e) => setProjectionMonth(e.target.value)}
                            className="w-full md:w-auto pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            {months.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                     <div className="text-center md:text-right">
                        <p className="text-gray-600 dark:text-gray-400">Total Potensi SiLPA APBD</p>
                        <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{formatCurrency(silpaData.totals.potensiSiLPA)}</p>
                    </div>
                </div>

                {/* --- DIAGRAM DIPINDAHKAN KE ATAS --- */}
                {silpaData.chartData.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg mb-8">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Grafik Potensi SiLPA per SKPD (Top 10)</h3>
                        <ResponsiveContainer width="100%" height={450}>
                            <BarChart data={silpaData.chartData} margin={{ top: 5, right: 30, left: 20, bottom: 150 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                                <XAxis dataKey="skpd" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 12 }} />
                                <YAxis tickFormatter={(val) => `${(val / 1e9).toFixed(1)} M`} tick={{ fontSize: 12 }} />
                                <Tooltip formatter={(value) => formatCurrency(value)} />
                                <Legend verticalAlign="top" />
                                <Bar dataKey="totalAnggaran" fill="#435EBE" name="Total Anggaran" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="realisasiHinggaSaatIni" fill="#82ca9d" name={`Realisasi s/d ${projectionMonth}`} radius={[4, 4, 0, 0]} />
                                <Bar dataKey="proyeksiAkhirTahun" fill="#ffc658" name="Proyeksi Realisasi" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="potensiSiLPA" fill="#d03f3f" name="Potensi SiLPA" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
                {/* --- AKHIR BAGIAN DIAGRAM --- */}

                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nama SKPD</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Anggaran</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Realisasi s/d {projectionMonth}</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Proyeksi Akhir Tahun</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Potensi SiLPA</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">% SiLPA</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {silpaData.tableData.length > 0 ? silpaData.tableData.map(item => (
                                <tr key={item.skpd} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4 whitespace-normal break-words text-sm font-medium text-gray-900 dark:text-gray-100 max-w-xs">{item.skpd}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">{formatCurrency(item.totalAnggaran)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">{formatCurrency(item.realisasiHinggaSaatIni)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">{formatCurrency(item.proyeksiAkhirTahun)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-purple-700 dark:text-purple-400">{formatCurrency(item.potensiSiLPA)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-purple-700 dark:text-purple-400">{item.persenSiLPA.toFixed(2)}%</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="text-center py-8 text-gray-500">Data tidak cukup untuk melakukan proyeksi.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// --- KOMPONEN ACTIVITY LOG VIEW YANG DIPERBARUI ---
const ActivityLogView = ({ theme }) => {
    const [logs, setLogs] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState('');
    const [currentPage, setCurrentPage] = React.useState(1);
    const ITEMS_PER_PAGE = 15;

    React.useEffect(() => {
        const logsCollectionRef = collection(db, "logs");
        const q = query(logsCollectionRef, orderBy("timestamp", "desc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const logsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp ? doc.data().timestamp.toDate() : new Date()
            }));
            setLogs(logsData);
            setIsLoading(false);
        }, (err) => {
            console.error("Error fetching logs:", err);
            setError("Gagal memuat log aktivitas.");
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // --- FITUR BARU: Menghitung User Unik ---
    const userStats = React.useMemo(() => {
        const stats = {};
        logs.forEach(log => {
            if (!log.userEmail) return;
            if (!stats[log.userEmail]) {
                stats[log.userEmail] = {
                    email: log.userEmail,
                    userId: log.userId,
                    lastActive: log.timestamp,
                    actionCount: 0
                };
            }
            stats[log.userEmail].actionCount += 1;
            // Update waktu terakhir aktif jika log ini lebih baru
            if (log.timestamp > stats[log.userEmail].lastActive) {
                stats[log.userEmail].lastActive = log.timestamp;
            }
        });
        // Urutkan berdasarkan waktu terakhir aktif
        return Object.values(stats).sort((a, b) => b.lastActive - a.lastActive);
    }, [logs]);

    const totalPages = Math.ceil(logs.length / ITEMS_PER_PAGE);
    const paginatedLogs = logs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handlePageChange = (page) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const formatDetails = (details) => {
        if (typeof details === 'object' && details !== null) {
            return Object.entries(details)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ');
        }
        return String(details);
    };

    return (
        <div className="space-y-6">
            <SectionTitle>Log Aktivitas Pengguna</SectionTitle>
            
            {/* --- Bagian Baru: Ringkasan Pengguna Aktif --- */}
            {!isLoading && !error && userStats.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                        <Users className="mr-2" size={20}/>
                        Daftar Pengguna yang Pernah Login/Aktif
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {userStats.map(user => (
                            <div key={user.email} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border-l-4 border-indigo-500 shadow-sm flex flex-col">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-bold text-gray-800 dark:text-white truncate max-w-[200px]" title={user.email}>
                                        {user.email}
                                    </h4>
                                    <span className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 rounded-full">
                                        {user.actionCount} Aksi
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-auto">
                                    <span className="font-semibold">Terakhir Aktif:</span><br/>
                                    {user.lastActive.toLocaleString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- Tabel Log Aktivitas --- */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Catatan detail semua aktivitas yang dilakukan oleh pengguna.
                </p>
                {isLoading ? (
                    <div className="text-center py-10"><Loader className="animate-spin mx-auto text-blue-500" size={40}/></div>
                ) : error ? (
                    <p className="text-center text-red-500 py-10">{error}</p>
                ) : (
                    <>
                        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Waktu</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Pengguna</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Aksi</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Detail</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {paginatedLogs.map(log => (
                                        <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{log.timestamp.toLocaleString('id-ID')}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{log.userEmail}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                                <span className={`px-2 py-1 rounded text-xs font-semibold ${log.action.includes('Hapus') ? 'bg-red-100 text-red-800' : log.action.includes('Tambah') ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-md whitespace-normal break-words">{formatDetails(log.details)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} theme={theme} />}
                    </>
                )}
            </div>
        </div>
    );
};

// --- Main App Component ---

const App = () => {
  const [scriptsLoaded, setScriptsLoaded] = React.useState(false);
  const [loadError, setLoadError] = React.useState(null);
  const [isDashboardOpen, setIsDashboardOpen] = React.useState(true);
  const [isPenganggaranOpen, setIsPenganggaranOpen] = React.useState(true);
  const [isPenatausahaanOpen, setIsPenatausahaanOpen] = React.useState(true);
  const [isReferensiOpen, setIsReferensiOpen] = React.useState(true); // State for new menu
  const [theme, setTheme] = React.useState('light');
  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear());
  const [appData, setAppData] = React.useState({
      anggaran: [],
      pendapatan: [],
      penerimaanPembiayaan: [],
      pengeluaranPembiayaan: [],
      realisasi: {},
      realisasiPendapatan: {},
      realisasiNonRkud: {}, // Initialized non-RKUD data
  });
  const [isAuthLoading, setIsAuthLoading] = React.useState(true);
  const [user, setUser] = React.useState(null);
  const [userRole, setUserRole] = React.useState('guest');
  const [isSidebarMinimized, setIsSidebarMinimized] = React.useState(false);
  const [namaPemda, setNamaPemda] = React.useState('');
  const [lastUpdate, setLastUpdate] = React.useState(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

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
                loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'),
                loadScript('https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.2/papaparse.min.js')
            ]);
            setScriptsLoaded(true);
            
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
          setIsAuthLoading(true); // Start loading on auth state change
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
                setIsAuthLoading(false); // Stop loading after auth check is complete
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

  const [activeView, setActiveView] = React.useState('dashboard');

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
    'skpd-subkegiatan-stats': 'Merinci pagu anggaran dan realisasi belanja hingga ke level sub kegiatan beserta rincian rekening di dalamnya.'
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
        requiredRole: ['admin'] // Hanya admin yang bisa melihat
}
  ];

  const ANGGARAN_MAPPING = {
      NamaSKPD: ['Nama SKPD'],
      NamaSubUnit: ['Nama Sub Unit'],
      KodeBidangUrusan: ['Kode Bidang Urusan'], // <-- DITAMBAHKAN
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
      NomorSP2D: ['Nomor SP2D'], // <-- Kolom baru ditambahkan
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
  
  // --- UPDATE BLOK KODE NON RKUD BERIKUT ---
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
  
  // Baris ini hilang dan perlu ditambahkan
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

// ... (Fungsi Inti penghapusan data di database) ...
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
      default: return <DashboardView data={allData} theme={theme} selectedYear={selectedYear}/>;
    }
  };

  return (
    <div className={`${theme} min-h-screen bg-gray-100 dark:bg-gray-900 font-sans flex`}>
      <nav className={`transition-all duration-300 ${isSidebarMinimized ? 'w-20' : 'w-64'} bg-white dark:bg-gray-800 shadow-lg flex-shrink-0 flex flex-col justify-between`}>
        <div>
            <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                <div className={`flex items-center gap-2 ${isSidebarMinimized ? 'justify-center w-full' : ''}`}>
                    {!isSidebarMinimized && (
                        <div>
                            <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">Analisis APBD</h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Tahun: {selectedYear}</p>
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-1 truncate" title={namaPemda}>
                                {namaPemda || 'Nama Instansi Belum Diatur'}
                            </p>
                        </div>
                    )}
                </div>
                 <button onClick={toggleTheme} className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 ${isSidebarMinimized ? 'hidden' : ''}`}>
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
            </div>
             <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className={`flex items-center ${isSidebarMinimized ? 'justify-center' : ''}`}>
                    <UserCircle size={isSidebarMinimized ? 32 : 40} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
                    {!isSidebarMinimized && (
                        <div className="ml-3 overflow-hidden">
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{user.email}</p>
                            <p className="text-xs font-medium text-white px-2 py-0.5 rounded-full inline-block" style={{backgroundColor: userRole === 'admin' ? '#10B981' : (userRole === 'editor' ? '#F59E0B' : '#6B7280')}}>{userRole}</p>
                        </div>
                    )}
                </div>
                {!isSidebarMinimized && (
                    <button onClick={handleLogout} className="w-full mt-4 flex items-center justify-center px-4 py-2 bg-red-500 text-white font-semibold rounded-lg shadow-sm hover:bg-red-600 transition-colors text-sm">
                        <LogOut size={16} className="mr-2" />
                        Logout
                    </button>
                )}
            </div>
        
            <ul className="mt-4 flex-1 overflow-y-auto">
            {menuItems.filter(item => {
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

                return (
                <li key={item.id} className="px-4">
                    {isDropdown ? (
                    <>
                        <button onClick={() => setIsOpen(!isOpen)} title={item.label} className={`w-full flex items-center justify-between px-4 py-3 my-1 text-sm font-medium rounded-lg transition-colors duration-200 ${isSidebarMinimized ? 'justify-center' : ''} ${isGroupActive ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                        <div className="flex items-center">
                            <item.icon size={20} className={!isSidebarMinimized ? "mr-3" : ""} />
                            {!isSidebarMinimized && item.label}
                        </div>
                        {!isSidebarMinimized && <ChevronDown className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} size={16}/>}
                        </button>
                        {isOpen && !isSidebarMinimized && (
                        <ul className="pl-4 mt-1">
                            {item.subMenus.map(subItem => (
                            <li key={subItem.id}>
                                <button onClick={() => setActiveView(subItem.id)} title={menuDescriptions[subItem.id] || subItem.label} className={`w-full flex items-center justify-between px-4 py-2 my-1 text-sm font-medium rounded-lg transition-colors duration-200 ${activeView === subItem.id ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                                <div className="flex items-center">
                                    <subItem.icon size={18} className="mr-3"/>
                                    {subItem.label}
                                </div>
                                {subItem.statusKey && (
                                    dataStatus[subItem.statusKey]
                                    ? <CheckCircle2 size={16} className="text-green-500" />
                                    : <AlertCircle size={16} className="text-yellow-500" />
                                )}
                                </button>
                            </li>
                            ))}
                        </ul>
                        )}
                    </>
                    ) : (
                    <button onClick={() => setActiveView(item.id)} title={item.label} className={`w-full flex items-center px-4 py-3 my-1 text-sm font-medium rounded-lg transition-colors duration-200 ${isSidebarMinimized ? 'justify-center' : ''} ${activeView === item.id ? 'bg-blue-500 text-white shadow-md' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                        <div className="flex items-center">
                            <item.icon size={20} className={!isSidebarMinimized ? "mr-3" : ""} />
                            {!isSidebarMinimized && item.label}
                        </div>
                    </button>
                    )}
                </li>
                )
            })}
            </ul>
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
             <button onClick={() => setIsSidebarMinimized(!isSidebarMinimized)} className="w-full flex items-center justify-center p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
                {isSidebarMinimized ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
             </button>
        </div>
      </nav>
      <main className="flex-1 p-8 overflow-y-auto">{renderView()}</main>
    </div>
  );
};

export default App;