import React from 'react';
import SectionTitle from './SectionTitle';
import SelectInput from './SelectInput';
import Pagination from './Pagination';
import { Search, Tag, Edit, Trash2, ChevronDown, ChevronRight, Loader } from 'lucide-react';
import { collection, doc, setDoc, getDoc, updateDoc, deleteDoc, onSnapshot, writeBatch } from "firebase/firestore";
import { db } from './firebase';
import { formatCurrency } from './formatCurrency';

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

export default ProsesPenandaanView;