import { db, auth } from '../utils/firebase';
import { 
  collection, 
  addDoc, 
  writeBatch, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  setDoc,
  getDoc
} from 'firebase/firestore';

// Helper untuk memberikan jeda antar batch (mencegah rate limiting & contention)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ==================== FUNGSI UPLOAD DATA (ENHANCED) ====================
export const uploadData = async (collectionName, selectedYear, parsedData, month = 'annual', setProgress) => {
  const CHUNK_SIZE = 400;
  const DELETE_BATCH_SIZE = 250; 
  const collectionRef = collection(db, "publicData", String(selectedYear), collectionName);

  try {
    // 1. HAPUS DATA LAMA SECARA BERTAHAP (Iterative Batching)
    setProgress('Memeriksa data lama...');
    const oldDocsQuery = query(collectionRef, where("month", "==", month));
    const oldDocsSnapshot = await getDocs(oldDocsQuery);
    
    if (!oldDocsSnapshot.empty) {
      const docs = oldDocsSnapshot.docs;
      const totalDocs = docs.length;
      setProgress(`Menghapus ${totalDocs} data lama...`);
      
      for (let i = 0; i < totalDocs; i += DELETE_BATCH_SIZE) {
        const batch = writeBatch(db);
        const chunk = docs.slice(i, i + DELETE_BATCH_SIZE);
        
        chunk.forEach((d) => batch.delete(d.ref));
        
        setProgress(`Membersihkan data lama: Bagian ${Math.floor(i/DELETE_BATCH_SIZE) + 1}...`);
        await batch.commit();
        await delay(150); // Jeda antar batch
      }
      setProgress(`✅ Data lama berhasil dibersihkan`);
    }

    if (!parsedData || parsedData.length === 0) {
      setProgress('Tidak ada data baru untuk diunggah');
      return;
    }

    // 2. UPLOAD DATA BARU DALAM CHUNK (HINDARI LIMIT 1MB FIRESTORE)
    const totalChunks = Math.ceil(parsedData.length / CHUNK_SIZE);
    setProgress(`Membagi ${parsedData.length} data menjadi ${totalChunks} bagian...`);

    for (let i = 0; i < parsedData.length; i += CHUNK_SIZE) {
      const chunk = parsedData.slice(i, i + CHUNK_SIZE);
      const partNumber = Math.floor(i / CHUNK_SIZE) + 1;
      
      setProgress(`Mengunggah bagian ${partNumber} dari ${totalChunks}...`);
      
      await addDoc(collectionRef, {
        month: month,
        data: chunk,
        uploadedAt: new Date(),
        uploadedBy: auth.currentUser?.email || 'unknown',
        totalItems: chunk.length,
        year: selectedYear,
        part: partNumber
      });
      
      await delay(100); 
    }

    // 3. UPDATE METADATA
    const trackedCols = ['realisasi', 'realisasiPendapatan', 'realisasiNonRkud'];
    if (trackedCols.includes(collectionName)) {
      const metadataRef = doc(db, "publicData", String(selectedYear), "metadata", "lastUpdate");
      await setDoc(metadataRef, {
        timestamp: new Date(),
        updatedBy: auth.currentUser?.email || 'unknown',
        collectionName: collectionName,
        month: month,
        totalUploaded: parsedData.length,
        chunksCount: totalChunks
      }, { merge: true });
    }
    
    setProgress(`✅ Berhasil mengupload ${parsedData.length} data`);
    
  } catch (error) {
    console.error('Error in uploadData:', error);
    setProgress(`❌ Error: ${error.message}`);
    throw error;
  }
};

// ==================== FUNGSI HAPUS DATA BULANAN (ENHANCED) ====================
export const deleteMonthlyData = async (collectionName, selectedYear, month, setProgress) => {
  // Kita perkecil ke 50 agar benar-benar aman dari "Transaction too big"
  const BATCH_SIZE = 50; 
  const MAX_RETRIES = 3;
  const collectionRef = collection(db, "publicData", String(selectedYear), collectionName);
  
  try {
    setProgress(`Mencari data bulan ${month}...`);
    const oldDocsSnapshot = await getDocs(query(collectionRef, where("month", "==", month)));
    
    if (oldDocsSnapshot.empty) {
      setProgress('Tidak ada data untuk dihapus pada bulan ini.');
      return { success: true, deletedCount: 0 };
    }

    const docs = oldDocsSnapshot.docs;
    const totalDocs = docs.length;
    let deletedCount = 0;

    // PROSES Sequential Batching
    for (let i = 0; i < totalDocs; i += BATCH_SIZE) {
      const chunk = docs.slice(i, i + BATCH_SIZE);
      let retryCount = 0;
      let success = false;

      while (!success && retryCount < MAX_RETRIES) {
        try {
          const batch = writeBatch(db);
          chunk.forEach(d => batch.delete(d.ref));
          
          setProgress(`Menghapus data: ${deletedCount + chunk.length} dari ${totalDocs}...`);
          
          await batch.commit();
          
          deletedCount += chunk.length;
          success = true;
          
          // Jeda agar Firestore tidak lelah
          await delay(500); 
          
        } catch (err) {
          retryCount++;
          console.error(`Gagal pada batch, mencoba ulang...`, err);
          if (retryCount >= MAX_RETRIES) throw err;
          setProgress(`⚠️ Gagal, mencoba ulang (${retryCount}/${MAX_RETRIES})...`);
          await delay(1500 * retryCount);
        }
      }
    }

    // UPDATE METADATA
    try {
      const metadataRef = doc(db, "publicData", String(selectedYear), "metadata", "lastDelete");
      await setDoc(metadataRef, {
        timestamp: new Date(),
        deletedBy: auth.currentUser?.email || 'unknown',
        collectionName: collectionName,
        month: month,
        deletedCount: deletedCount
      }, { merge: true });
    } catch (e) {
      console.warn("Gagal update metadata");
    }

    setProgress(`✅ Berhasil menghapus ${deletedCount} data bulan ${month}`);
    return { success: true, deletedCount };
    
  } catch (error) {
    console.error('Error final di deleteMonthlyData:', error);
    setProgress(`❌ Error Hapus: ${error.message}`);
    throw error;
  }
};

// ==================== FUNGSI FETCH DATA ====================
export const fetchData = async (year, type) => {
  try {
    const collRef = collection(db, "publicData", String(year), type);
    const snapshot = await getDocs(collRef);
    const result = {};
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const month = data.month;
      if (!result[month]) result[month] = [];
      if (data.data && Array.isArray(data.data)) {
        result[month].push(...data.data);
      }
    });
    return result;
  } catch (error) {
    console.error('Error in fetchData:', error);
    throw error;
  }
};

// ==================== FUNGSI FETCH DATA DENGAN FILTER ====================
export const fetchDataWithFilter = async (year, type, month = null) => {
  try {
    const collRef = collection(db, "publicData", String(year), type);
    let q = month ? query(collRef, where("month", "==", month)) : collRef;
    
    const snapshot = await getDocs(q);
    const result = [];
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.data && Array.isArray(data.data)) result.push(...data.data);
    });
    return result;
  } catch (error) {
    console.error('Error in fetchDataWithFilter:', error);
    throw error;
  }
};

// ==================== FUNGSI HELPER: GET DATA STATISTICS ====================
export const getDataStats = async (collectionName, selectedYear, month = null) => {
  try {
    const collectionRef = collection(db, "publicData", String(selectedYear), collectionName);
    let q = month ? query(collectionRef, where("month", "==", month)) : collectionRef;
    const snapshot = await getDocs(q);
    
    let totalItems = 0;
    let monthsData = {};
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const docMonth = data.month;
      const itemsCount = data.data?.length || 0;
      totalItems += itemsCount;
      if (!monthsData[docMonth]) monthsData[docMonth] = { documents: 0, items: 0 };
      monthsData[docMonth].documents++;
      monthsData[docMonth].items += itemsCount;
    });
    
    return { documentCount: snapshot.docs.length, totalItems, monthsData };
  } catch (error) {
    console.error('Error getting stats:', error);
    return null;
  }
};

// ==================== FUNGSI HELPER: CLEANUP DUPLICATE DATA ====================
export const cleanupDuplicateData = async (collectionName, selectedYear, month, setProgress) => {
  try {
    const collectionRef = collection(db, "publicData", String(selectedYear), collectionName);
    const snapshot = await getDocs(query(collectionRef, where("month", "==", month)));
    
    if (snapshot.docs.length <= 1) return { success: true, removedCount: 0 };
    
    const dataMap = new Map();
    const duplicates = [];
    
    snapshot.docs.forEach(doc => {
      const dataHash = JSON.stringify(doc.data().data);
      if (dataMap.has(dataHash)) duplicates.push(doc);
      else dataMap.set(dataHash, doc);
    });

    if (duplicates.length === 0) return { success: true, removedCount: 0 };

    const batch = writeBatch(db);
    duplicates.forEach(d => batch.delete(d.ref));
    await batch.commit();
    
    return { success: true, removedCount: duplicates.length };
  } catch (error) {
    console.error('Error cleaning up duplicates:', error);
    throw error;
  }
};

// ==================== FUNGSI HELPER: METADATA ====================
export const getMetadata = async (selectedYear) => {
  try {
    const upRef = doc(db, "publicData", String(selectedYear), "metadata", "lastUpdate");
    const delRef = doc(db, "publicData", String(selectedYear), "metadata", "lastDelete");
    const [upSnap, delSnap] = await Promise.all([getDoc(upRef), getDoc(delRef)]);
    
    return {
      lastUpdate: upSnap.exists() ? upSnap.data() : null,
      lastDelete: delSnap.exists() ? delSnap.data() : null
    };
  } catch (error) {
    console.error('Error getting metadata:', error);
    return null;
  }
};

// ==================== FUNGSI HELPER: DELETE ALL DATA IN COLLECTION ====================
export const deleteAllDataInCollection = async (collectionName, selectedYear, setProgress) => {
  try {
    const collectionRef = collection(db, "publicData", String(selectedYear), collectionName);
    const snapshot = await getDocs(collectionRef);
    if (snapshot.empty) return { success: true, deletedCount: 0 };

    const docs = snapshot.docs;
    for (let i = 0; i < docs.length; i += 100) {
      const batch = writeBatch(db);
      docs.slice(i, i + 100).forEach(d => batch.delete(d.ref));
      if (setProgress) setProgress(`Menghapus data (${i + 100}/${docs.length})...`);
      await batch.commit();
      await delay(300);
    }
    return { success: true, deletedCount: docs.length };
  } catch (error) {
    console.error('Error deleting all data:', error);
    throw error;
  }
};