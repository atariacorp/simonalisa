import { db, auth } from '../utils/firebase';
import { 
  collection, addDoc, writeBatch, deleteDoc, doc, 
  getDocs, query, where, setDoc 
} from 'firebase/firestore';

export const uploadData = async (collectionName, selectedYear, parsedData, month = 'annual', setProgress) => {
  const CHUNK_SIZE = 400;
  const collectionRef = collection(db, "publicData", String(selectedYear), collectionName);

  setProgress('Menghapus data lama...');
  const oldDocsQuery = query(collectionRef, where("month", "==", month));
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
      month: month,
      data: chunk,
    };
    await addDoc(collectionRef, docPayload);
  }

  if (collectionName === 'realisasi' || collectionName === 'realisasiPendapatan') {
    const metadataRef = doc(db, "publicData", String(selectedYear), "metadata", "lastUpdate");
    await setDoc(metadataRef, {
      timestamp: new Date(),
      updatedBy: auth.currentUser?.email || 'unknown'
    });
  }
};

export const deleteMonthlyData = async (collectionName, selectedYear, month, setProgress) => {
  const BATCH_SIZE = 400;
  const collectionRef = collection(db, "publicData", String(selectedYear), collectionName);
  const oldDocsQuery = query(collectionRef, where("month", "==", month));
  const oldDocsSnapshot = await getDocs(oldDocsQuery);
  
  if (oldDocsSnapshot.empty) {
    setProgress('Tidak ada data untuk dihapus pada bulan ini.');
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
};

export const fetchData = async (year, type) => {
  const collRef = collection(db, "publicData", String(year), type);
  const snapshot = await getDocs(collRef);
  return snapshot.docs.map(doc => doc.data());
};