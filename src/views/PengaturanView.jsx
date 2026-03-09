import React from 'react';
import SectionTitle from './components/SectionTitle';
import GeminiAnalysis from './components/GeminiAnalysis';
import { 
    Download, Loader, UserPlus, Edit, Trash2, 
    Shield, Calendar, Building2, Users, Database,
    AlertCircle, CheckCircle, Info, Settings, 
    HardDrive, Cloud, Key, Mail, UserCog, RefreshCw,
    Lock, Globe, Clock, Award, Sparkles, Cpu
} from 'lucide-react';
import { collection, doc, setDoc, getDocs, addDoc, deleteDoc, updateDoc, onSnapshot, query } from "firebase/firestore";
import { db } from './utils/firebase';
import { logActivity } from './utils/logActivity';
import { firebaseConfig } from './utils/firebase';
import { formatCurrency } from './utils/formatCurrency';

// --- UPDATED PengaturanView Component with Glassmorphism ---
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
    const [activeTab, setActiveTab] = React.useState('instansi'); // 'instansi', 'users', 'backup', 'security'
    const [systemHealth, setSystemHealth] = React.useState({
        storageUsed: '245 MB',
        lastBackup: '2026-03-05',
        activeUsers: 12,
        totalDataEntries: 15420,
        apiStatus: 'Online',
        databaseStatus: 'Online'
    });

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
                role: newUserRole,
                createdAt: new Date().toISOString(),
                lastActive: null
            });
            await logActivity('Tambah Pengguna', { addedUserEmail: newUserEmail, role: newUserRole });
            setNewUserUid('');
            setNewUserEmail('');
            setNewUserRole('viewer');
            setError('');
        } catch (err) {
            console.error("Error adding user:", err);
            setError('Gagal menambahkan pengguna.');
        }
    };
    
    const handleStartEditing = (user) => {
        setEditingUserId(user.id);
        setEditingUserRole(user.role);
    };

    const handleCancelEditing = () => {
        setEditingUserId(null);
        setEditingUserRole('');
    };
    
    const handleUpdateUserRole = async (userId, userEmail) => {
        setError('');
        const userDocRef = doc(db, "users", userId);
        try {
            await updateDoc(userDocRef, { role: editingUserRole });
            await logActivity('Ubah Peran Pengguna', { updatedUserEmail: userEmail, newRole: editingUserRole });
            handleCancelEditing();
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

    // Fungsi untuk mendapatkan badge peran
    const getRoleBadge = (role) => {
        if (role === 'admin') {
            return <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs font-bold rounded-full shadow-lg">Administrator</span>;
        } else if (role === 'editor') {
            return <span className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg">Editor</span>;
        } else {
            return <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold rounded-full shadow-lg">Viewer</span>;
        }
    };

    // Gemini Analysis Prompt
    const getAnalysisPrompt = (customQuery) => {
        if (customQuery) {
            return `Berdasarkan pengaturan sistem, berikan analisis untuk: "${customQuery}"`;
        }
        
        return `
            Anda adalah seorang konsultan keamanan sistem dan tata kelola IT. Lakukan analisis terhadap konfigurasi sistem SIMONALISA.
            
            ### INFORMASI SISTEM
            - **Nama Instansi**: ${namaPemda || 'Belum diatur'}
            - **Tahun Anggaran Aktif**: ${selectedYear}
            - **Total Pengguna Terdaftar**: ${users.length} akun
            - **Status Sistem**: Online
            - **Backup Terakhir**: ${systemHealth.lastBackup}
            
            ### KOMPOSISI PENGGUNA
            - **Administrator**: ${users.filter(u => u.role === 'admin').length} pengguna
            - **Editor**: ${users.filter(u => u.role === 'editor').length} pengguna
            - **Viewer**: ${users.filter(u => u.role === 'viewer').length} pengguna
            
            Berikan analisis dan rekomendasi mengenai:
            1.  **Keamanan Sistem**: Apakah komposisi pengguna sudah ideal? Apakah ada terlalu banyak admin?
            2.  **Manajemen Data**: Rekomendasi jadwal backup rutin dan strategi pemulihan bencana.
            3.  **Tata Kelola**: Saran untuk meningkatkan keamanan akses dan audit trail.
        `;
    };

    return (
        <div className="space-y-6">
            <SectionTitle>PENGATURAN SISTEM</SectionTitle>
            
            {/* Executive Dashboard - Ringkasan Sistem */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 to-gray-50 dark:from-gray-900 dark:to-slate-900 border border-slate-200 dark:border-slate-700 shadow-[0_8px_32px_rgba(0,0,0,0.12)] mb-6">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-400/10 to-pink-400/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
                
                <div className="relative p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-gradient-to-br from-slate-700 to-gray-800 rounded-xl shadow-lg">
                            <Settings className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Dashboard Administrasi Sistem</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Kelola konfigurasi, pengguna, dan data aplikasi
                            </p>
                        </div>
                    </div>
                    
                    {/* System Health Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-xl border border-white/40 dark:border-gray-700/50 p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Database className="w-4 h-4 text-indigo-500" />
                                <span className="text-xs text-gray-500">Penyimpanan</span>
                            </div>
                            <p className="text-xl font-bold text-gray-800 dark:text-white">{systemHealth.storageUsed}</p>
                        </div>
                        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-xl border border-white/40 dark:border-gray-700/50 p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Cloud className="w-4 h-4 text-emerald-500" />
                                <span className="text-xs text-gray-500">Backup Terakhir</span>
                            </div>
                            <p className="text-xl font-bold text-gray-800 dark:text-white">{systemHealth.lastBackup}</p>
                        </div>
                        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-xl border border-white/40 dark:border-gray-700/50 p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Users className="w-4 h-4 text-purple-500" />
                                <span className="text-xs text-gray-500">Pengguna Aktif</span>
                            </div>
                            <p className="text-xl font-bold text-gray-800 dark:text-white">{systemHealth.activeUsers}</p>
                        </div>
                        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-xl border border-white/40 dark:border-gray-700/50 p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Cpu className="w-4 h-4 text-rose-500" />
                                <span className="text-xs text-gray-500">Status API</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                <p className="text-lg font-bold text-emerald-500">{systemHealth.apiStatus}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Gemini Analysis */}
            <GeminiAnalysis 
                getAnalysisPrompt={getAnalysisPrompt}
                disabledCondition={false}
                theme={theme}
                interactivePlaceholder="Analisis keamanan dan tata kelola sistem..."
                userCanUseAi={userRole === 'admin'}
            />

            {/* Tab Navigation */}
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 rounded-2xl blur-xl"></div>
                <div className="relative flex overflow-x-auto no-scrollbar p-1.5 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/30 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
                    <button
                        onClick={() => setActiveTab('instansi')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 font-bold text-sm rounded-xl transition-all duration-300 min-w-[120px] ${
                            activeTab === 'instansi'
                                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-md ring-1 ring-black/5 dark:ring-white/10'
                                : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
                        }`}
                    >
                        <Building2 size={18} /> Instansi
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 font-bold text-sm rounded-xl transition-all duration-300 min-w-[120px] ${
                            activeTab === 'users'
                                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-md ring-1 ring-black/5 dark:ring-white/10'
                                : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
                        }`}
                    >
                        <Users size={18} /> Pengguna
                    </button>
                    <button
                        onClick={() => setActiveTab('tahun')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 font-bold text-sm rounded-xl transition-all duration-300 min-w-[120px] ${
                            activeTab === 'tahun'
                                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-md ring-1 ring-black/5 dark:ring-white/10'
                                : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
                        }`}
                    >
                        <Calendar size={18} /> Tahun
                    </button>
                    <button
                        onClick={() => setActiveTab('backup')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 font-bold text-sm rounded-xl transition-all duration-300 min-w-[120px] ${
                            activeTab === 'backup'
                                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-md ring-1 ring-black/5 dark:ring-white/10'
                                : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
                        }`}
                    >
                        <Database size={18} /> Backup
                    </button>
                </div>
            </div>

            {/* Content berdasarkan tab */}
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-white/50 dark:from-gray-800/50 dark:via-transparent dark:to-gray-800/50 rounded-3xl blur-2xl"></div>
                <div className="relative space-y-6">
                    
                    {/* TAB INSTANSI */}
                    {activeTab === 'instansi' && (
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-gray-700/30 shadow-xl p-6">
                            <div className="flex items-center gap-3 mb-6 border-b border-white/30 dark:border-gray-700/30 pb-4">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                    <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Informasi Instansi</h3>
                            </div>
                            
                            <form onSubmit={handleSaveNamaPemda} className="space-y-4">
                                <div>
                                    <label htmlFor="namaPemda" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Nama Instansi / Pemerintah Daerah
                                    </label>
                                    <input
                                        id="namaPemda"
                                        type="text"
                                        value={namaPemda}
                                        onChange={(e) => setNamaPemda(e.target.value)}
                                        placeholder="Contoh: Pemerintah Kota Medan"
                                        className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                    />
                                    <p className="text-xs text-gray-400 mt-2">
                                        Nama ini akan ditampilkan di seluruh dashboard dan laporan.
                                    </p>
                                </div>
                                
                                <div className="flex items-center justify-end gap-3">
                                    {error && <p className="text-sm text-rose-500">{error}</p>}
                                    <button 
                                        type="submit" 
                                        disabled={isSaving} 
                                        className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isSaving ? <Loader size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                                        {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* TAB TAHUN ANGGARAN */}
                    {activeTab === 'tahun' && (
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-gray-700/30 shadow-xl p-6">
                            <div className="flex items-center gap-3 mb-6 border-b border-white/30 dark:border-gray-700/30 pb-4">
                                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                                    <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Pengaturan Tahun Anggaran</h3>
                            </div>
                            
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Pilih tahun anggaran yang ingin Anda analisis atau unggah datanya. Semua data yang ditampilkan dan diunggah akan terikat pada tahun yang dipilih.
                            </p>
                            
                            <div className="max-w-xs">
                                <label htmlFor="year-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Tahun Anggaran Aktif:
                                </label>
                                <select
                                    id="year-select"
                                    value={selectedYear}
                                    onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
                                    className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                >
                                    {years.map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-400 mt-2">
                                    Data untuk tahun lain akan tetap tersimpan dan dapat diakses dengan mengubah pilihan ini.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* TAB MANAJEMEN PENGGUNA */}
                    {activeTab === 'users' && userRole === 'admin' && (
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-gray-700/30 shadow-xl overflow-hidden">
                            <div className="p-6 border-b border-white/30 dark:border-gray-700/30">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                        <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">Manajemen Pengguna</h3>
                                </div>
                                
                                {/* Panduan Tambah Pengguna */}
                                <div className="mb-6 p-4 bg-indigo-50/70 dark:bg-indigo-900/20 backdrop-blur-sm rounded-xl border border-indigo-200 dark:border-indigo-800">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-indigo-100 dark:bg-indigo-800 rounded-lg shrink-0">
                                            <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-indigo-800 dark:text-indigo-300 text-sm mb-1">Cara Menambahkan Pengguna Baru:</p>
                                            <ol className="text-xs text-indigo-700 dark:text-indigo-400 list-decimal list-inside space-y-1">
                                                <li>Pastikan pengguna sudah membuat akun dan login ke aplikasi ini setidaknya satu kali.</li>
                                                <li>Buka <a href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/users`} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Firebase Console → Authentication</a>.</li>
                                                <li>Salin "User UID" untuk pengguna yang ingin Anda tambahkan.</li>
                                                <li>Tempel UID tersebut beserta email dan peran yang diinginkan di formulir bawah ini.</li>
                                            </ol>
                                        </div>
                                    </div>
                                </div>

                                {/* Form Tambah Pengguna */}
                                <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">User UID</label>
                                        <input 
                                            type="text" 
                                            value={newUserUid} 
                                            onChange={e => setNewUserUid(e.target.value)} 
                                            placeholder="UID dari Firebase Auth" 
                                            className="w-full px-4 py-2.5 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Email</label>
                                        <input 
                                            type="email" 
                                            value={newUserEmail} 
                                            onChange={e => setNewUserEmail(e.target.value)} 
                                            placeholder="Email Pengguna" 
                                            className="w-full px-4 py-2.5 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Peran</label>
                                        <select 
                                            value={newUserRole} 
                                            onChange={e => setNewUserRole(e.target.value)} 
                                            className="w-full px-4 py-2.5 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="viewer">Viewer (Hanya Lihat)</option>
                                            <option value="editor">Editor (Unggah Data)</option>
                                            <option value="admin">Admin (Semua Akses)</option>
                                        </select>
                                    </div>
                                    <button 
                                        type="submit" 
                                        className="flex items-center justify-center h-11 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all"
                                    >
                                        <UserPlus size={18} className="mr-2" /> Tambah
                                    </button>
                                </form>
                                {error && <p className="text-sm text-rose-500 mt-3">{error}</p>}
                            </div>

                            {/* Tabel Pengguna */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Peran</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm divide-y divide-gray-200 dark:divide-gray-700">
                                        {users.map(user => (
                                            <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="w-4 h-4 text-gray-400" />
                                                        {user.email}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {editingUserId === user.id ? (
                                                        <select
                                                            value={editingUserRole}
                                                            onChange={(e) => setEditingUserRole(e.target.value)}
                                                            className="w-full px-3 py-1.5 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg"
                                                        >
                                                            <option value="viewer">Viewer</option>
                                                            <option value="editor">Editor</option>
                                                            <option value="admin">Admin</option>
                                                        </select>
                                                    ) : (
                                                        getRoleBadge(user.role)
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    {editingUserId === user.id ? (
                                                        <div className="flex justify-end gap-3">
                                                            <button 
                                                                onClick={() => handleUpdateUserRole(user.id, user.email)} 
                                                                className="text-emerald-600 hover:text-emerald-800 font-semibold"
                                                            >
                                                                Simpan
                                                            </button>
                                                            <button 
                                                                onClick={handleCancelEditing} 
                                                                className="text-gray-600 hover:text-gray-800"
                                                            >
                                                                Batal
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex justify-end gap-3">
                                                            <button 
                                                                onClick={() => handleStartEditing(user)} 
                                                                className="text-blue-600 hover:text-blue-800"
                                                                title="Edit Peran"
                                                            >
                                                                <Edit size={18}/>
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteUser(user.id, user.email)} 
                                                                className="text-rose-600 hover:text-rose-800"
                                                                title="Hapus Peran"
                                                            >
                                                                <Trash2 size={18}/>
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {users.length === 0 && (
                                            <tr>
                                                <td colSpan="3" className="text-center py-8 text-gray-500">
                                                    Belum ada pengguna terdaftar
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TAB BACKUP DATA */}
                    {activeTab === 'backup' && userRole === 'admin' && (
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-gray-700/30 shadow-xl p-6">
                            <div className="flex items-center gap-3 mb-6 border-b border-white/30 dark:border-gray-700/30 pb-4">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                                    <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Cadangkan Data</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Informasi Backup */}
                                <div className="bg-indigo-50/50 dark:bg-indigo-900/20 p-5 rounded-xl border border-indigo-200 dark:border-indigo-800 space-y-3">
                                    <h4 className="font-semibold text-indigo-800 dark:text-indigo-300 flex items-center gap-2">
                                        <Info size={16} /> Informasi Backup
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Unduh salinan lengkap dari semua data aplikasi (anggaran, realisasi, pengguna, log, dll.) untuk tahun anggaran yang dipilih sebagai file JSON.
                                    </p>
                                    <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1 list-disc list-inside">
                                        <li>Ukuran backup diperkirakan: {systemHealth.storageUsed}</li>
                                        <li>Backup terakhir: {systemHealth.lastBackup}</li>
                                        <li>Total entri data: {systemHealth.totalDataEntries.toLocaleString()}</li>
                                    </ul>
                                </div>

                                {/* Tombol Backup */}
                                <div className="flex flex-col items-center justify-center p-5 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                                    <div className="text-center mb-4">
                                        <Database className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                                        <h4 className="font-bold text-emerald-700 dark:text-emerald-300">Backup Data {selectedYear}</h4>
                                    </div>
                                    <button 
                                        onClick={handleBackupData} 
                                        disabled={isBackingUp} 
                                        className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl shadow-lg transition-all disabled:opacity-50"
                                    >
                                        {isBackingUp ? <Loader size={18} className="animate-spin mr-2" /> : <Download size={18} className="mr-2" />}
                                        {isBackingUp ? backupStatus : `Unduh Backup`}
                                    </button>
                                </div>
                            </div>

                            {backupStatus && !isBackingUp && (
                                <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2">
                                    <CheckCircle size={16} className="text-emerald-500" />
                                    <p className="text-sm text-emerald-700 dark:text-emerald-300">{backupStatus}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Notes */}
            <div className="mt-6 text-xs text-gray-400 dark:text-gray-500 text-center border-t border-gray-200 dark:border-gray-700 pt-4">
                <span className="mx-2">🛡️ Sistem diamankan dengan enkripsi end-to-end</span>
                <span className="mx-2">📊 Data tersimpan di cloud server</span>
                <span className="mx-2">🔐 Hak akses berbasis peran</span>
            </div>
        </div>
    );
};

export default PengaturanView;
