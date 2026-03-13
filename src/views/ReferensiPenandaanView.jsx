import React, { useState, useEffect, useMemo, useCallback } from 'react';
import SectionTitle from '../components/SectionTitle';
import Pagination from '../components/Pagination';
import GeminiAnalysis from '../components/GeminiAnalysis';
import { 
    Loader, Edit, Trash2, Search, Tag, Eye, EyeOff, AlertTriangle, 
    CheckCircle, Info, Award, Crown, Briefcase, Lightbulb, Activity, 
    Zap, Target, Layers, BarChart3, Shield, AlertOctagon, Gauge, 
    Brain, Coins, Scale, Rocket, Star, Users, Database, FileText, 
    Hash, Clock, Sparkles, Trophy, Medal, Gem, Diamond, Flower2, 
    TrendingUp, Percent, BadgePercent, BookOpen, ChevronDown, ChevronUp,
    Plus, X, Save, RefreshCw, Filter, Download, Upload
} from 'lucide-react';
import { collection, addDoc, deleteDoc, updateDoc, onSnapshot, doc } from "firebase/firestore";
import { db } from '../utils/firebase';
import { logActivity } from '../utils/logActivity';
import { formatCurrency } from '../utils/formatCurrency';

// --- REFERENSI PENANDAAN VIEW ---
const ReferensiPenandaanView = ({ userRole, selectedYear }) => {
    const [tags, setTags] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState('');
    
    const [tagName, setTagName] = React.useState('');
    const [tagDescription, setTagDescription] = React.useState('');
    const [tagColor, setTagColor] = React.useState('blue');
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [editingTag, setEditingTag] = React.useState(null);
    
    // ===== STATE UNTUK SEARCH, FILTER, PAGINATION =====
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    
    // ===== STATE UNTUK TOGGLE ANALISIS AI DAN INFO EKSEKUTIF =====
    const [showExecutiveInfo, setShowExecutiveInfo] = useState(true);
    const [showAnalysis, setShowAnalysis] = useState(true);
    // ===== END STATE =====

    const colorOptions = [
        { value: 'blue', label: 'Biru', bg: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
        { value: 'green', label: 'Hijau', bg: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
        { value: 'red', label: 'Merah', bg: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
        { value: 'yellow', label: 'Kuning', bg: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
        { value: 'purple', label: 'Ungu', bg: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
        { value: 'pink', label: 'Pink', bg: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300' },
        { value: 'indigo', label: 'Indigo', bg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300' },
        { value: 'teal', label: 'Teal', bg: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300' },
        { value: 'orange', label: 'Orange', bg: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' },
        { value: 'cyan', label: 'Cyan', bg: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300' },
    ];

    const tagsCollectionRef = collection(db, "publicData", String(selectedYear), "referensi-penandaan");

    // ===== FETCH DATA =====
    useEffect(() => {
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

    // ===== EXECUTIVE SUMMARY DATA =====
    const executiveSummary = useMemo(() => {
        if (!tags.length) return null;
        
        const totalTags = tags.length;
        const tagsWithDescription = tags.filter(t => t.description && t.description.trim() !== '').length;
        const completionRate = totalTags > 0 ? (tagsWithDescription / totalTags) * 100 : 0;
        
        return {
            totalTags,
            tagsWithDescription,
            completionRate,
            lastUpdate: new Date().toLocaleDateString('id-ID')
        };
    }, [tags]);

    // ===== FILTER TAGS BERDASARKAN SEARCH =====
    const filteredTags = useMemo(() => {
        if (!searchTerm) return tags;
        
        return tags.filter(tag => 
            (tag.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             tag.description?.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [tags, searchTerm]);

    // ===== PAGINATION =====
    const totalPages = Math.ceil(filteredTags.length / itemsPerPage);
    const paginatedTags = filteredTags.slice(
        (currentPage - 1) * itemsPerPage, 
        currentPage * itemsPerPage
    );

    const handlePageChange = (page) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // ===== CRUD OPERATIONS =====
    const handleAddTag = async (e) => {
        e.preventDefault();
        if (!tagName) {
            setError("Nama penandaan tidak boleh kosong.");
            return;
        }
        setIsSubmitting(true);
        setError('');
        
        const formattedName = tagName.startsWith('#') ? tagName : `#${tagName}`;
        const newTagData = {
            name: formattedName,
            description: tagDescription,
            color: tagColor,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        try {
            await addDoc(tagsCollectionRef, newTagData);
            await logActivity('Tambah Penandaan', { 
                tagName: formattedName,
                year: selectedYear 
            });
            setTagName('');
            setTagDescription('');
            setTagColor('blue');
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
            const formattedName = editingTag.name.startsWith('#') ? editingTag.name : `#${editingTag.name}`;
            await updateDoc(tagDocRef, {
                name: formattedName,
                description: editingTag.description,
                color: editingTag.color,
                updatedAt: new Date().toISOString()
            });
            await logActivity('Update Penandaan', { 
                tagName: formattedName,
                year: selectedYear 
            });
            setEditingTag(null);
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
                await logActivity('Hapus Penandaan', { 
                    tagName,
                    year: selectedYear 
                });
            } catch (err) {
                console.error("Error deleting tag:", err);
                setError("Gagal menghapus penandaan.");
            }
        }
    };
    
    const startEditing = (tag) => {
        setEditingTag({ 
            ...tag, 
            name: tag.name.startsWith('#') ? tag.name.substring(1) : tag.name 
        });
    };

    const cancelEditing = () => {
        setEditingTag(null);
    };

    // ===== FUNGSI ANALYSIS PROMPT =====
    const getAnalysisPrompt = useCallback((query, allData) => {
        if (query && query.trim() !== '') {
            return `Berdasarkan data kamus penandaan anggaran, jawab pertanyaan ini: ${query}`;
        }
        
        if (tags.length === 0) return "Data tidak cukup untuk dianalisis.";
        
        const totalTags = tags.length;
        const sampleTags = tags.slice(0, 5);
        
        return `ANALISIS KAMUS PENANDAAN ANGGARAN
TAHUN ANGGARAN: ${selectedYear}

DATA RINGKAS EKSEKUTIF:
- Total Penandaan: ${totalTags} item
- Kelengkapan Deskripsi: ${executiveSummary?.tagsWithDescription || 0} item (${executiveSummary?.completionRate.toFixed(1)}%)
- Update Terakhir: ${executiveSummary?.lastUpdate || '-'}

DAFTAR PENANDAAN (5 ITEM PERTAMA):
${sampleTags.map((t, i) => `- **${t.name}**: ${t.description || '(tanpa deskripsi)'}`).join('\n')}

BERIKAN ANALISIS MENDALAM MENGENAI:
1. Kualitas Data: Apakah kamus penandaan ini sudah lengkap dan siap digunakan?
2. Cakupan Penandaan: Identifikasi pola penamaan yang muncul.
3. Rekomendasi: Saran untuk optimalisasi kamus penandaan.

Gunakan bahasa profesional, langsung ke inti, tanpa basa-basi.`;
    }, [tags, executiveSummary, selectedYear]);

    // ===== GET COLOR CLASS =====
    const getTagColorClass = (color) => {
        const colorOption = colorOptions.find(c => c.value === color);
        return colorOption ? colorOption.bg : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-10">
            <SectionTitle>Kamus Penandaan Anggaran</SectionTitle>
            
            {/* === EXECUTIVE DASHBOARD - INFORMASI UNTUK PIMPINAN === */}
            {showExecutiveInfo && executiveSummary && (
                <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-600 rounded-3xl p-10 text-white shadow-2xl border border-white/10 group mb-8">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -mr-40 -mt-40 transition-transform duration-1000 group-hover:scale-110"></div>
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-400/10 rounded-full blur-[80px] -ml-32 -mb-32"></div>
                    <div className="absolute top-20 left-40 w-40 h-40 bg-violet-400/10 rounded-full blur-[60px]"></div>
                    
                    {/* Animated Particles */}
                    <div className="absolute inset-0 overflow-hidden">
                        {[...Array(15)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute rounded-full bg-white/5 animate-float"
                                style={{
                                    width: `${Math.random() * 6 + 3}px`,
                                    height: `${Math.random() * 6 + 3}px`,
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 10}s`,
                                    animationDuration: `${Math.random() * 20 + 10}s`
                                }}
                            />
                        ))}
                    </div>
                    
                    {/* Crown Icon for Leadership */}
                    <div className="absolute top-8 right-12 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Trophy size={140} className="text-yellow-300" />
                    </div>
                    
                    <div className="relative z-10">
                        {/* Header */}
                        <div className="flex items-center gap-5 mb-6 border-b border-white/20 pb-6">
                            <div className="p-5 bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-400 rounded-2xl shadow-lg shadow-amber-500/30">
                                <Tag size={40} className="text-white" />
                            </div>
                            <div className="flex-1">
                                <div className="inline-flex items-center gap-3 px-5 py-2 bg-white/20 backdrop-blur-2xl rounded-full text-sm font-black tracking-[0.3em] uppercase border border-white/30 mb-3">
                                    <Sparkles size={16} className="text-yellow-300 animate-pulse" /> 
                                    EXECUTIVE DASHBOARD
                                </div>
                                <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight">
                                    RINGKASAN EKSEKUTIF <br/>
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-300 text-5xl md:text-6xl">
                                        KAMUS PENANDAAN
                                    </span>
                                </h2>
                                <p className="text-lg text-white/80 mt-2 max-w-3xl">
                                    Analisis komprehensif kamus penandaan anggaran untuk pengelompokan program prioritas
                                </p>
                            </div>
                            <button 
                                onClick={() => setShowExecutiveInfo(false)}
                                className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/20"
                                title="Sembunyikan"
                            >
                                <EyeOff size={22} />
                            </button>
                        </div>

                        {/* Quick Stats - DIPERBESAR */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="bg-black/30 backdrop-blur-xl rounded-xl p-5 border border-white/20 hover:bg-black/40 transition-all">
                                <div className="flex items-center gap-3 mb-2">
                                    <Tag size={22} className="text-yellow-400" />
                                    <p className="text-xs font-bold uppercase text-indigo-200 tracking-wider">Total Penandaan</p>
                                </div>
                                <p className="text-3xl md:text-4xl font-black text-white">{executiveSummary.totalTags}</p>
                                <p className="text-xs text-indigo-200/70 mt-1">item aktif</p>
                            </div>
                            <div className="bg-black/30 backdrop-blur-xl rounded-xl p-5 border border-white/20 hover:bg-black/40 transition-all">
                                <div className="flex items-center gap-3 mb-2">
                                    <FileText size={22} className="text-emerald-400" />
                                    <p className="text-xs font-bold uppercase text-indigo-200 tracking-wider">Dengan Deskripsi</p>
                                </div>
                                <p className="text-3xl md:text-4xl font-black text-emerald-300">{executiveSummary.tagsWithDescription}</p>
                                <p className="text-xs text-indigo-200/70 mt-1">item lengkap</p>
                            </div>
                            <div className="bg-black/30 backdrop-blur-xl rounded-xl p-5 border border-white/20 hover:bg-black/40 transition-all">
                                <div className="flex items-center gap-3 mb-2">
                                    <Percent size={22} className="text-purple-400" />
                                    <p className="text-xs font-bold uppercase text-indigo-200 tracking-wider">Kelengkapan</p>
                                </div>
                                <p className="text-3xl md:text-4xl font-black text-purple-300">{executiveSummary.completionRate.toFixed(1)}%</p>
                                <p className="text-xs text-indigo-200/70 mt-1">data terisi</p>
                            </div>
                        </div>

                        {/* Executive Note */}
                        <div className="flex items-start gap-5 text-base bg-gradient-to-r from-indigo-800/50 to-purple-800/50 p-6 rounded-2xl border border-indigo-500/30 backdrop-blur-sm">
                            <div className="p-4 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl shadow-lg shrink-0">
                                <Lightbulb size={32} className="text-white" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-xl font-black text-white flex items-center gap-2">
                                    <Sparkles size={20} className="text-yellow-300" />
                                    EXECUTIVE SUMMARY
                                </p>
                                <p className="text-base leading-relaxed text-indigo-100">
                                    <span className="font-bold text-white">RINGKASAN:</span> Kamus penandaan memiliki 
                                    <span className="font-black text-yellow-300 text-lg mx-1">{executiveSummary.totalTags}</span> item dengan tingkat kelengkapan deskripsi 
                                    <span className="font-black text-emerald-300 text-lg mx-1">{executiveSummary.completionRate.toFixed(1)}%</span>. 
                                    Data terakhir diperbarui pada <span className="font-black text-white">{executiveSummary.lastUpdate}</span>.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!showExecutiveInfo && (
                <button 
                    onClick={() => setShowExecutiveInfo(true)}
                    className="mb-6 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-base flex items-center gap-3 shadow-xl hover:shadow-2xl transition-all group hover:scale-105"
                >
                    <Eye size={22} className="group-hover:scale-110 transition-transform" /> 
                    TAMPILKAN EXECUTIVE DASHBOARD
                </button>
            )}

            {/* AI Analysis Section dengan Toggle */}
            <div className="relative">
                <div className="flex justify-end mb-2">
                    <button
                        onClick={() => setShowAnalysis(!showAnalysis)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 bg-white/50 dark:bg-gray-800/50 rounded-xl hover:bg-white dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700"
                    >
                        {showAnalysis ? (
                            <>🗂️ Sembunyikan Analisis AI</>
                        ) : (
                            <>🤖 Tampilkan Analisis AI</>
                        )}
                    </button>
                </div>
                
                {/* Indikator Data */}
                {showAnalysis && tags.length > 0 && (
                    <div className="text-xs text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-2 bg-white/30 dark:bg-gray-800/30 p-2 rounded-lg">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        <span>Total Penandaan: {tags.length} | Kelengkapan: {executiveSummary?.completionRate.toFixed(1)}%</span>
                    </div>
                )}
                
                {/* Komponen GeminiAnalysis dengan Conditional Rendering */}
                {showAnalysis && (
                    <GeminiAnalysis 
                        getAnalysisPrompt={getAnalysisPrompt} 
                        disabledCondition={tags.length === 0} 
                        userCanUseAi={userRole === 'admin'}
                        allData={{
                            tags: tags.slice(0, 10),
                            totalItems: tags.length,
                            executiveSummary
                        }}
                    />
                )}
            </div>

            {/* Main Card */}
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/50 dark:border-gray-700/50 overflow-hidden transition-all duration-500 hover:shadow-3xl">
                {/* Form Section */}
                <div className="p-8 bg-gradient-to-r from-white/50 to-white/30 dark:from-gray-800/50 dark:to-gray-900/50 border-b border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                            {editingTag ? <Edit size={24} className="text-white" /> : <Plus size={24} className="text-white" />}
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-800 dark:text-white">
                                {editingTag ? 'Edit Penandaan' : 'Buat Penandaan Baru'}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {editingTag 
                                    ? 'Ubah nama atau deskripsi penandaan yang sudah ada.' 
                                    : 'Gunakan kamus ini untuk mengelompokkan berbagai kegiatan di lintas SKPD ke dalam satu tema strategis, seperti #PenurunanStunting atau #InfrastrukturPrioritas.'}
                            </p>
                        </div>
                    </div>

                    {userRole === 'admin' ? (
                        <form onSubmit={editingTag ? handleUpdateTag : handleAddTag} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Nama Penandaan */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                        <Tag size={14} className="text-indigo-500" /> Nama Penandaan
                                    </label>
                                    <input 
                                        type="text"
                                        value={editingTag ? editingTag.name : tagName}
                                        onChange={(e) => editingTag ? setEditingTag({...editingTag, name: e.target.value}) : setTagName(e.target.value)}
                                        placeholder="#ContohPenandaan"
                                        className="w-full px-4 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                        disabled={isSubmitting}
                                    />
                                </div>

                                {/* Warna Tag */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                        <Layers size={14} className="text-purple-500" /> Warna Tag
                                    </label>
                                    <select
                                        value={editingTag ? editingTag.color || 'blue' : tagColor}
                                        onChange={(e) => editingTag ? setEditingTag({...editingTag, color: e.target.value}) : setTagColor(e.target.value)}
                                        className="w-full px-4 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                        disabled={isSubmitting}
                                    >
                                        {colorOptions.map(option => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Tombol Aksi */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider opacity-0">Aksi</label>
                                    <div className="flex gap-2">
                                        <button 
                                            type="submit" 
                                            disabled={isSubmitting} 
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isSubmitting ? (
                                                <Loader size={18} className="animate-spin" />
                                            ) : editingTag ? (
                                                <Save size={18} />
                                            ) : (
                                                <Plus size={18} />
                                            )}
                                            {isSubmitting ? 'Menyimpan...' : (editingTag ? 'Update' : 'Tambah')}
                                        </button>
                                        
                                        {editingTag && (
                                            <button 
                                                type="button" 
                                                onClick={cancelEditing} 
                                                className="px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-bold text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                                            >
                                                <X size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Deskripsi */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                    <FileText size={14} className="text-emerald-500" /> Deskripsi (Opsional)
                                </label>
                                <input 
                                    type="text"
                                    value={editingTag ? editingTag.description || '' : tagDescription}
                                    onChange={(e) => editingTag ? setEditingTag({...editingTag, description: e.target.value}) : setTagDescription(e.target.value)}
                                    placeholder="Kegiatan terkait, contoh: Semua kegiatan yang mendukung penurunan stunting"
                                    className="w-full px-4 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </form>
                    ) : (
                        <div className="p-6 bg-yellow-50/50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200/50 dark:border-yellow-800/50">
                            <p className="text-sm text-center text-yellow-700 dark:text-yellow-400 flex items-center justify-center gap-2">
                                <Shield size={18} /> Hanya Admin yang dapat mengelola kamus penandaan.
                            </p>
                        </div>
                    )}
                    
                    {error && (
                        <div className="mt-4 p-4 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-200 dark:border-rose-800">
                            <p className="text-sm text-rose-600 dark:text-rose-400 flex items-center gap-2">
                                <AlertTriangle size={16} /> {error}
                            </p>
                        </div>
                    )}
                </div>

                {/* Table Section */}
                <div className="p-8">
                    {/* Search Bar */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-md">
                                <Database size={20} className="text-white" />
                            </div>
                            <h3 className="font-black text-lg text-gray-800 dark:text-white">
                                Daftar Penandaan Aktif
                            </h3>
                            <span className="text-xs bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm px-3 py-1 rounded-full">
                                {filteredTags.length} item
                            </span>
                        </div>
                        
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Cari penandaan atau deskripsi..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                        <table className="min-w-full">
                            <thead>
                                <tr className="bg-gradient-to-r from-gray-50/80 to-white/80 dark:from-gray-800/80 dark:to-gray-900/80">
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nama Penandaan</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">Deskripsi</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">Warna</th>
                                    {userRole === 'admin' && (
                                        <th className="px-6 py-4 text-right text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">Aksi</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={userRole === 'admin' ? 4 : 3} className="text-center py-12">
                                            <Loader className="animate-spin mx-auto text-indigo-500" size={32} />
                                        </td>
                                    </tr>
                                ) : paginatedTags.length > 0 ? paginatedTags.map(tag => {
                                    const colorClass = getTagColorClass(tag.color);
                                    return (
                                        <tr key={tag.id} className="hover:bg-indigo-500/5 transition-colors group">
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-block ${colorClass}`}>
                                                    {tag.name}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                                {tag.description || <span className="text-gray-400 italic">(tanpa deskripsi)</span>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-block ${colorClass}`}>
                                                    {colorOptions.find(c => c.value === tag.color)?.label || 'Biru'}
                                                </span>
                                            </td>
                                            {userRole === 'admin' && (
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end items-center gap-2">
                                                        <button
                                                            onClick={() => startEditing(tag)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteTag(tag.id, tag.name)}
                                                            className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                                                            title="Hapus"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan={userRole === 'admin' ? 4 : 3} className="text-center py-12 text-gray-500 font-bold">
                                            {searchTerm ? "Tidak ada data yang cocok dengan pencarian." : "Belum ada kamus penandaan yang dibuat."}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-8">
                            <Pagination 
                                currentPage={currentPage} 
                                totalPages={totalPages} 
                                onPageChange={handlePageChange} 
                                theme={theme} 
                            />
                        </div>
                    )}
                </div>

                {/* Footer Notes */}
                {tags.length > 0 && (
                    <div className="px-8 py-5 bg-gradient-to-r from-gray-50/50 to-transparent dark:from-gray-800/50 border-t border-gray-200/50 dark:border-gray-700/50">
                        <div className="flex flex-wrap gap-6 text-xs">
                            <span className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-lg"></div>
                                <span className="font-medium text-gray-600 dark:text-gray-400">
                                    Total {tags.length} penandaan aktif
                                </span>
                            </span>
                            <span className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full shadow-lg"></div>
                                <span className="font-medium text-gray-600 dark:text-gray-400">
                                    Kelengkapan: {executiveSummary?.completionRate.toFixed(1)}%
                                </span>
                            </span>
                        </div>
                    </div>
                )}
            </div>
            
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0) translateX(0); }
                    25% { transform: translateY(-10px) translateX(6px); }
                    50% { transform: translateY(-5px) translateX(-6px); }
                    75% { transform: translateY(-15px) translateX(4px); }
                }
                .animate-float {
                    animation: float linear infinite;
                }
            `}</style>
        </div>
    );
};

export default ReferensiPenandaanView;