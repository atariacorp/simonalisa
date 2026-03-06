import React from 'react';
import SectionTitle from './SectionTitle';
import GeminiAnalysis from './GeminiAnalysis';
import SelectInput from './SelectInput';
import Pagination from './Pagination';
import { 
    Search, Tag, Edit, Trash2, ChevronDown, ChevronRight, Loader,
    Filter, Download, TrendingUp, AlertCircle, CheckCircle, Info,
    Layers, BarChart3, PieChart, Target, Flag, BookOpen, Sparkles,
    Database, Eye, EyeOff, X, ChevronsLeft, ChevronsRight
} from 'lucide-react';
import { collection, doc, setDoc, getDoc, updateDoc, deleteDoc, onSnapshot, writeBatch } from "firebase/firestore";
import { db } from './firebase';
import { formatCurrency } from './formatCurrency';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from 'recharts';

// --- UPDATED ProsesPenandaanView Component with Glassmorphism ---
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
    
    // --- NEW: State for expanded rows and UI controls ---
    const [expandedRows, setExpandedRows] = React.useState(new Set());
    const [showFilters, setShowFilters] = React.useState(true);
    const [viewMode, setViewMode] = React.useState('table'); // 'table' atau 'card'
    const [chartView, setChartView] = React.useState('bar'); // 'bar' atau 'pie'
    const [summaryStats, setSummaryStats] = React.useState({
        totalTagged: 0,
        totalAnggaran: 0,
        totalRealisasi: 0,
        rataPenyerapan: 0,
        byTag: {}
    });

    // Warna untuk visualisasi
    const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6B7280'];

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
        const items = taggedItems.map(item => {
            const realisasiTerkait = allRealisasi.filter(r => {
                const hasValidCodes = item.KodeSubKegiatan && item.KodeRekening && r.KodeSubKegiatan && r.KodeRekening;
                
                return hasValidCodes &&
                    r.KodeSubKegiatan === item.KodeSubKegiatan &&
                    r.KodeRekening === item.KodeRekening &&
                    r.NamaSKPD === item.NamaSKPD;
            });
            const totalRealisasi = realisasiTerkait.reduce((sum, r) => sum + r.nilai, 0);
            const persentase = item.nilai > 0 ? (totalRealisasi / item.nilai) * 100 : 0;
            return { ...item, totalRealisasi, persentase, realisasiDetails: realisasiTerkait };
        });
        
        // Hitung statistik ringkasan
        const totalAnggaran = items.reduce((sum, item) => sum + item.nilai, 0);
        const totalRealisasi = items.reduce((sum, item) => sum + (item.totalRealisasi || 0), 0);
        const byTag = {};
        
        items.forEach(item => {
            if (!byTag[item.tagName]) {
                byTag[item.tagName] = { count: 0, anggaran: 0, realisasi: 0 };
            }
            byTag[item.tagName].count++;
            byTag[item.tagName].anggaran += item.nilai;
            byTag[item.tagName].realisasi += (item.totalRealisasi || 0);
        });
        
        setSummaryStats({
            totalTagged: items.length,
            totalAnggaran,
            totalRealisasi,
            rataPenyerapan: totalAnggaran > 0 ? (totalRealisasi / totalAnggaran) * 100 : 0,
            byTag
        });
        
        return items;
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

    // Data untuk chart distribusi tag
    const tagChartData = React.useMemo(() => {
        return Object.entries(summaryStats.byTag).map(([name, data]) => ({
            name,
            value: data.anggaran / 1e9, // Konversi ke Miliar
            count: data.count,
            anggaran: data.anggaran,
            realisasi: data.realisasi,
            persentase: data.anggaran > 0 ? (data.realisasi / data.anggaran) * 100 : 0
        })).sort((a, b) => b.value - a.value);
    }, [summaryStats.byTag]);

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
    const rekeningList = React.useMemo(() => !selectedPaket ? [] : Array.from(new Set(anggaran.filter(item => item.NamaSKPD === selectedSkpd && item.NamaSubKegiatan === selectedSubKegiatan && item.NamaSumberDana === selectedSumberDana && item.NamaPaketKelompok === selectedPaket).map(item => item.NamaRekening).filter(Boolean))).sort(), [anggaran, selectedSkpd, selectedSubKegiatan, selectedSumberDana, selectedPaket, selectedRekening]);
    
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
    
    const toggleRow = (itemId) => {
        const newExpandedRows = new Set(expandedRows);
        if (newExpandedRows.has(itemId)) {
            newExpandedRows.delete(itemId);
        } else {
            newExpandedRows.add(itemId);
        }
        setExpandedRows(newExpandedRows);
    };

    // Gemini Analysis Prompt
    const getAnalysisPrompt = (customQuery) => {
        if (customQuery) {
            return `Berdasarkan data penandaan anggaran, berikan analisis untuk: "${customQuery}"`;
        }
        
        const topTags = tagChartData.slice(0, 3).map(t => 
            `- **${t.name}**: Rp ${(t.anggaran/1e9).toFixed(2)} Miliar (${t.persentase.toFixed(2)}% terserap)`
        ).join('\n');
        
        return `
            Anda adalah seorang analis kebijakan anggaran. Lakukan analisis terhadap hasil penandaan anggaran tahun ${selectedYear}.
            
            ### RINGKASAN EKSEKUTIF
            - **Total Item Ditandai**: ${summaryStats.totalTagged} item anggaran
            - **Total Anggaran Tertandai**: ${formatCurrency(summaryStats.totalAnggaran)}
            - **Total Realisasi**: ${formatCurrency(summaryStats.totalRealisasi)}
            - **Rata-rata Penyerapan**: ${summaryStats.rataPenyerapan.toFixed(2)}%
            - **Jenis Penandaan Aktif**: ${tagChartData.length} kategori
            
            ### 3 PENANDAAN DENGAN ALOKASI TERBESAR
            ${topTags}
            
            Berikan analisis mendalam mengenai:
            1.  **Efektivitas Penandaan**: Apakah penandaan yang dibuat sudah mencerminkan prioritas anggaran yang tepat?
            2.  **Kinerja Per Tag**: Identifikasi tag mana yang memiliki penyerapan tinggi dan rendah. Apa implikasinya?
            3.  **Rekomendasi Strategis**: Saran untuk optimalisasi alokasi anggaran berdasarkan pola penandaan yang ada.
        `;
    };

    return (
        <div className="space-y-6">
            <SectionTitle>PROSES PENANDAAN ANGGARAN</SectionTitle>
            
            {/* Executive Dashboard */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 shadow-[0_8px_32px_rgba(0,0,0,0.12)] mb-6">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-emerald-400/10 to-teal-400/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
                
                <div className="relative p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-lg">
                            <Tag className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Dashboard Penandaan Anggaran</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Ringkasan item anggaran yang telah ditandai berdasarkan kategori
                            </p>
                        </div>
                    </div>
                    
                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-xl border border-white/40 dark:border-gray-700/50 p-4">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Total Item Ditandai</p>
                            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{summaryStats.totalTagged}</p>
                        </div>
                        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-xl border border-white/40 dark:border-gray-700/50 p-4">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Total Anggaran</p>
                            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(summaryStats.totalAnggaran)}</p>
                        </div>
                        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-xl border border-white/40 dark:border-gray-700/50 p-4">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Total Realisasi</p>
                            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{formatCurrency(summaryStats.totalRealisasi)}</p>
                        </div>
                        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-xl border border-white/40 dark:border-gray-700/50 p-4">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Rata-rata Penyerapan</p>
                            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{summaryStats.rataPenyerapan.toFixed(1)}%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Gemini Analysis */}
            <GeminiAnalysis 
                getAnalysisPrompt={getAnalysisPrompt}
                disabledCondition={taggedItemsWithRealisasi.length === 0}
                theme={theme}
                interactivePlaceholder="Analisis pola penandaan anggaran..."
                userCanUseAi={userRole === 'admin'}
            />

            {/* Chart Section - Distribusi Tag */}
            {tagChartData.length > 0 && (
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-gray-700/30 shadow-xl p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-indigo-500" />
                            Distribusi Anggaran per Kategori Penandaan
                        </h3>
                        <div className="flex gap-2 mt-2 md:mt-0">
                            <button
                                onClick={() => setChartView('bar')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                    chartView === 'bar' 
                                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400' 
                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                }`}
                            >
                                Bar Chart
                            </button>
                            <button
                                onClick={() => setChartView('pie')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                    chartView === 'pie' 
                                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400' 
                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                }`}
                            >
                                Pie Chart
                            </button>
                        </div>
                    </div>
                    
                    <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-xl p-4 border border-white/40 dark:border-gray-700/50">
                        <ResponsiveContainer width="100%" height={400}>
                            {chartView === 'bar' ? (
                                <BarChart data={tagChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                    <defs>
                                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#6366F1" stopOpacity={0.8}/>
                                            <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} height={80} tick={{ fontSize: 10 }} />
                                    <YAxis tickFormatter={(val) => `${val}M`} tick={{ fontSize: 11 }} />
                                    <Tooltip 
                                        formatter={(value, name) => {
                                            if (name === 'value') return `${value} Miliar`;
                                            return value;
                                        }}
                                        content={({ payload }) => {
                                            if (payload && payload.length > 0) {
                                                const data = payload[0].payload;
                                                return (
                                                    <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl p-3 rounded-lg border shadow-lg">
                                                        <p className="font-bold text-sm">{data.name}</p>
                                                        <p className="text-xs text-gray-500">Anggaran: {formatCurrency(data.anggaran)}</p>
                                                        <p className="text-xs text-gray-500">Realisasi: {formatCurrency(data.realisasi)}</p>
                                                        <p className="text-xs text-gray-500">Penyerapan: {data.persentase.toFixed(1)}%</p>
                                                        <p className="text-xs text-gray-500">Jumlah Item: {data.count}</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Legend />
                                    <Bar dataKey="value" fill="url(#barGradient)" name="Anggaran (Miliar)" barSize={30} />
                                </BarChart>
                            ) : (
                                <RePieChart>
                                    <Pie
                                        data={tagChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={120}
                                        paddingAngle={2}
                                        dataKey="value"
                                        label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                                    >
                                        {tagChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        formatter={(value) => `${value} Miliar`}
                                        content={({ payload }) => {
                                            if (payload && payload.length > 0) {
                                                const data = payload[0].payload;
                                                return (
                                                    <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl p-3 rounded-lg border shadow-lg">
                                                        <p className="font-bold text-sm">{data.name}</p>
                                                        <p className="text-xs text-gray-500">Anggaran: {formatCurrency(data.anggaran)}</p>
                                                        <p className="text-xs text-gray-500">Realisasi: {formatCurrency(data.realisasi)}</p>
                                                        <p className="text-xs text-gray-500">Penyerapan: {data.persentase.toFixed(1)}%</p>
                                                        <p className="text-xs text-gray-500">Jumlah Item: {data.count}</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Legend />
                                </RePieChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Form Penandaan */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-gray-700/30 shadow-xl p-6">
                <div className="flex items-center gap-3 mb-6 border-b border-white/30 dark:border-gray-700/30 pb-4">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                        {editingItem ? <Edit className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> : <Tag className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                        {editingItem ? 'Edit Penandaan' : 'Tandai Item Anggaran Baru'}
                    </h3>
                </div>
                
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {editingItem ? 'Ubah penandaan untuk item anggaran yang sudah dipilih.' : 'Pilih item anggaran dari data yang sudah diunggah, lalu terapkan penandaan yang sesuai dari kamus.'}
                </p>
                
                {userRole === 'admin' ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <SelectInput label="Nama SKPD" value={selectedSkpd} onChange={setSelectedSkpd} options={skpdList} placeholder="-- Pilih SKPD --" disabled={!!editingItem} />
                            <SelectInput label="Nama Sub Kegiatan" value={selectedSubKegiatan} onChange={setSelectedSubKegiatan} options={subKegiatanList} placeholder="-- Pilih Sub Kegiatan --" disabled={!selectedSkpd || !!editingItem} />
                            <SelectInput label="Sumber Dana" value={selectedSumberDana} onChange={setSelectedSumberDana} options={sumberDanaList} placeholder="-- Pilih Sumber Dana --" disabled={!selectedSubKegiatan || !!editingItem} />
                            <SelectInput label="Paket/Kelompok" value={selectedPaket} onChange={setSelectedPaket} options={paketList} placeholder="-- Pilih Paket/Kelompok --" disabled={!selectedSumberDana || !!editingItem} />
                            <SelectInput label="Nama Rekening" value={selectedRekening} onChange={setSelectedRekening} options={rekeningList} placeholder="-- Pilih Rekening --" disabled={!selectedPaket || !!editingItem} />
                        </div>
                        
                        {selectedItem && (
                            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-gray-600 dark:text-gray-400">Pagu Anggaran Terpilih:</span>
                                    <span className="font-bold text-xl text-indigo-600 dark:text-indigo-400">{formatCurrency(selectedItem.nilai)}</span>
                                </div>
                            </div>
                        )}
                        
                        <div className="flex flex-col md:flex-row items-end gap-4 pt-4 border-t border-white/30 dark:border-gray-700/30">
                            <div className="flex-grow w-full">
                                <SelectInput label="Pilih Penandaan" value={selectedTag} onChange={setSelectedTag} options={kamusTags.map(t => ({ value: t.id, label: `${t.name} - ${t.description}` }))} placeholder="-- Pilih Penandaan --" disabled={!selectedItem} useObjectAsOption />
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                {editingItem && (
                                    <button 
                                        type="button" 
                                        onClick={resetForm} 
                                        className="w-full md:w-auto flex items-center justify-center px-6 py-2.5 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-xl shadow-lg transition-all"
                                    >
                                        Batal
                                    </button>
                                )}
                                <button 
                                    type="submit" 
                                    disabled={isLoading || !selectedItem || !selectedTag} 
                                    className="w-full md:w-auto flex items-center justify-center px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all disabled:opacity-50"
                                >
                                    {isLoading ? <Loader size={18} className="animate-spin mr-2" /> : <Tag size={18} className="mr-2" />}
                                    {editingItem ? 'Update Penandaan' : 'Simpan Penandaan'}
                                </button>
                            </div>
                        </div>
                    </form>
                ) : (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                        <p className="text-sm text-center text-amber-700 dark:text-amber-400">
                            Hanya Admin yang dapat melakukan proses penandaan.
                        </p>
                    </div>
                )}
                
                {error && (
                    <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg flex items-center gap-2">
                        <AlertCircle size={16} className="text-rose-500" />
                        <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
                    </div>
                )}
            </div>

            {/* Daftar Anggaran yang Sudah Ditandai */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-gray-700/30 shadow-xl overflow-hidden">
                {/* Filter Section */}
                <div className="p-6 border-b border-white/30 dark:border-gray-700/30">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                        <div className="flex items-center gap-2">
                            <Database className="w-5 h-5 text-indigo-500" />
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                                Daftar Anggaran yang Sudah Ditandai
                            </h3>
                        </div>
                        
                        <div className="flex gap-2">
                            <button
                                onClick={() => setViewMode('table')}
                                className={`p-2 rounded-lg transition-all ${
                                    viewMode === 'table' 
                                        ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' 
                                        : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                }`}
                                title="Table View"
                            >
                                <Layers size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('card')}
                                className={`p-2 rounded-lg transition-all ${
                                    viewMode === 'card' 
                                        ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' 
                                        : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                }`}
                                title="Card View"
                            >
                                <BarChart3 size={18} />
                            </button>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                <Filter size={18} />
                            </button>
                        </div>
                    </div>

                    {showFilters && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Filter Tag</label>
                                <select
                                    value={filterByTag}
                                    onChange={(e) => setFilterByTag(e.target.value)}
                                    className="w-full px-3 py-2 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">-- Semua Tag --</option>
                                    {tagFilterOptions.map(tag => (
                                        <option key={tag} value={tag}>{tag}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="relative">
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Cari</label>
                                <input 
                                    type="text" 
                                    placeholder="Cari SKPD, kegiatan, tag..." 
                                    value={searchTerm} 
                                    onChange={(e) => setSearchTerm(e.target.value)} 
                                    className="w-full pl-9 pr-4 py-2 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <Search className="absolute left-3 top-8 text-gray-400" size={16}/>
                            </div>

                            {userRole === 'admin' && selectedForDeletion.length > 0 && (
                                <div className="flex items-end">
                                    <button
                                        onClick={handleDeleteSelected}
                                        disabled={isLoading}
                                        className="w-full px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                                    >
                                        <Trash2 size={16} />
                                        Hapus {selectedForDeletion.length} Item
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Table/Card View */}
                {viewMode === 'table' ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm">
                                <tr>
                                    {userRole === 'admin' && (
                                        <th className="px-6 py-4 text-left">
                                            <input 
                                                type="checkbox" 
                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                onChange={handleSelectAllOnPage}
                                                checked={paginatedData.length > 0 && paginatedData.every(item => selectedForDeletion.includes(item.id))}
                                            />
                                        </th>
                                    )}
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tag</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">SKPD & Sub Kegiatan</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Rekening</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Pagu</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Realisasi</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">%</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm divide-y divide-gray-200 dark:divide-gray-700">
                                {paginatedData.length > 0 ? paginatedData.map(item => (
                                    <React.Fragment key={item.id}>
                                        <tr className={`${selectedForDeletion.includes(item.id) ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''} hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors`}>
                                            {userRole === 'admin' && (
                                                <td className="px-6 py-4">
                                                    <input 
                                                        type="checkbox" 
                                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                        checked={selectedForDeletion.includes(item.id)}
                                                        onChange={() => handleToggleDeletion(item.id)}
                                                    />
                                                </td>
                                            )}
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold rounded-full shadow-sm">
                                                    {item.tagName}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 max-w-xs">
                                                <p className="font-bold text-gray-800 dark:text-gray-200">{item.NamaSKPD}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.NamaSubKegiatan}</p>
                                            </td>
                                            <td className="px-6 py-4 max-w-xs">
                                                <p className="text-sm text-gray-600 dark:text-gray-400 break-words">{item.NamaRekening}</p>
                                            </td>
                                            <td className="px-6 py-4 text-right font-semibold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                                                {formatCurrency(item.nilai)}
                                            </td>
                                            <td className="px-6 py-4 text-right font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                                {formatCurrency(item.totalRealisasi)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                                                    item.persentase >= 80 ? 'bg-green-100 text-green-700' :
                                                    item.persentase >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                    {item.persentase.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end items-center gap-2">
                                                    <button 
                                                        onClick={() => toggleRow(item.id)} 
                                                        className="p-1.5 text-gray-500 hover:text-indigo-600 transition-colors"
                                                        title="Lihat Rincian"
                                                    >
                                                        {expandedRows.has(item.id) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                                    </button>
                                                    {userRole === 'admin' && (
                                                        <>
                                                            <button 
                                                                onClick={() => handleStartEditing(item)} 
                                                                className="p-1.5 text-blue-500 hover:text-blue-600 transition-colors"
                                                                title="Edit"
                                                            >
                                                                <Edit size={18}/>
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteTaggedItem(item.id)} 
                                                                className="p-1.5 text-rose-500 hover:text-rose-600 transition-colors"
                                                                title="Hapus"
                                                            >
                                                                <Trash2 size={18}/>
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedRows.has(item.id) && (
                                            <tr className="bg-indigo-50/30 dark:bg-indigo-900/10">
                                                <td colSpan={userRole === 'admin' ? 8 : 7} className="p-4">
                                                    <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4">
                                                        <h4 className="font-bold text-sm mb-3 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                            <Database size={14} className="text-indigo-500" />
                                                            Rincian Realisasi
                                                        </h4>
                                                        {item.realisasiDetails.length > 0 ? (
                                                            <div className="overflow-x-auto">
                                                                <table className="min-w-full">
                                                                    <thead>
                                                                        <tr className="border-b border-gray-200 dark:border-gray-700">
                                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Nomor SP2D</th>
                                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Keterangan</th>
                                                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Nilai</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                                                        {item.realisasiDetails.map((detail, idx) => (
                                                                            <tr key={idx}>
                                                                                <td className="px-4 py-2 text-sm font-mono text-gray-600 dark:text-gray-400">{detail.NomorSP2D || '-'}</td>
                                                                                <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{detail.KeteranganDokumen || '-'}</td>
                                                                                <td className="px-4 py-2 text-sm text-right font-medium text-emerald-600">{formatCurrency(detail.nilai)}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-gray-500 italic">Belum ada realisasi untuk item ini.</p>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                )) : (
                                    <tr>
                                        <td colSpan={userRole === 'admin' ? 8 : 7} className="text-center py-12 text-gray-500">
                                            <div className="flex flex-col items-center gap-2">
                                                <Database className="w-8 h-8 text-gray-400" />
                                                <p>Belum ada anggaran yang ditandai</p>
                                                <p className="text-sm text-gray-400">Gunakan form di atas untuk menambahkan penandaan</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    /* Card View */
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {paginatedData.length > 0 ? paginatedData.map(item => (
                            <div key={item.id} className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-lg transition-all">
                                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-transparent dark:from-indigo-900/10">
                                    <div className="flex justify-between items-start">
                                        <span className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold rounded-full">
                                            {item.tagName}
                                        </span>
                                        <div className="flex gap-1">
                                            <button onClick={() => toggleRow(item.id)} className="p-1 text-gray-400 hover:text-indigo-600">
                                                {expandedRows.has(item.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 space-y-2">
                                    <p className="font-bold text-gray-800 dark:text-white">{item.NamaSKPD}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{item.NamaSubKegiatan}</p>
                                    <div className="flex justify-between text-sm mt-3">
                                        <span className="text-gray-500">Pagu:</span>
                                        <span className="font-semibold text-indigo-600">{formatCurrency(item.nilai)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Realisasi:</span>
                                        <span className="font-semibold text-emerald-600">{formatCurrency(item.totalRealisasi)}</span>
                                    </div>
                                    <div className="mt-2">
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div 
                                                className={`h-2 rounded-full ${
                                                    item.persentase >= 80 ? 'bg-green-500' :
                                                    item.persentase >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                                }`}
                                                style={{ width: `${Math.min(item.persentase, 100)}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-right text-xs font-bold mt-1">{item.persentase.toFixed(1)}%</p>
                                    </div>
                                </div>
                                {userRole === 'admin' && (
                                    <div className="p-3 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                                        <button onClick={() => handleStartEditing(item)} className="p-1 text-blue-500 hover:text-blue-600">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => handleDeleteTaggedItem(item.id)} className="p-1 text-rose-500 hover:text-rose-600">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )) : (
                            <div className="col-span-full text-center py-12 text-gray-500">
                                <Database className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                <p>Belum ada anggaran yang ditandai</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-6 border-t border-white/30 dark:border-gray-700/30">
                        <Pagination 
                            currentPage={currentPage} 
                            totalPages={totalPages} 
                            onPageChange={handlePageChange} 
                            theme={theme} 
                        />
                    </div>
                )}

                {/* Footer Info */}
                <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-800/50 border-t border-white/30 dark:border-gray-700/30">
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                            Total {filteredTaggedItems.length} item ditandai
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                            Realisasi: {summaryStats.rataPenyerapan.toFixed(1)}%
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                            {tagChartData.length} kategori penandaan
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProsesPenandaanView;