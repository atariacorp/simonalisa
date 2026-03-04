import React from 'react';
import SectionTitle from './SectionTitle';
import { Loader, Edit, Trash2 } from 'lucide-react';
import { collection, addDoc, deleteDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from './firebase';
import { logActivity } from './utils/logActivity';

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

export default ReferensiPenandaanView;