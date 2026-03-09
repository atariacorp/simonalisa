import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../utils/firebase';

export const useData = (selectedYear) => {
  const [appData, setAppData] = useState({
    anggaran: [],
    pendapatan: [],
    penerimaanPembiayaan: [],
    pengeluaranPembiayaan: [],
    realisasi: {},
    realisasiPendapatan: {},
    realisasiNonRkud: {},
  });

  useEffect(() => {
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
            if (!acc[month]) acc[month] = [];
            acc[month].push(item);
            return acc;
          }, {});
          setAppData(prev => ({...prev, [dataType]: monthlyData }));
        } else {
          setAppData(prev => ({...prev, [dataType]: data }));
        }
      });
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [selectedYear]);

  return appData;
};