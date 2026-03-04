import React from 'react';
import SectionTitle from './SectionTitle';
import { exp } from "firebase/firestore/pipelines";

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

export default ActivityLogView;