import React from 'react';
import SectionTitle from './SectionTitle';
import { Download, Loader, UserPlus, Edit, Trash2 } from 'lucide-react';
import { collection, doc, setDoc, getDocs, addDoc, deleteDoc, updateDoc, onSnapshot, query } from "firebase/firestore";
import { db } from './firebase';
import { logActivity } from './utils/logActivity';

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

export default PengaturanView;/ /   f i n a l   f i x  
 / /   f i n a l   f i x  
 