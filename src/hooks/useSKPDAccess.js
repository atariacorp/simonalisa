// src/hooks/useSKPDAccess.js
import { useState, useEffect } from 'react';
import { db } from '../utils/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const useSKPDAccess = (user, userRole, selectedYear) => {
  const [skpdAccess, setSkpdAccess] = useState({
    canViewAllSKPD: false,
    allowedSKPD: [],
    loading: true
  });

  useEffect(() => {
    const fetchSKPDAccess = async () => {
      // Jika bukan viewer, otomatis bisa lihat semua
      if (!user || userRole !== 'viewer') {
        setSkpdAccess({
          canViewAllSKPD: true,
          allowedSKPD: [],
          loading: false
        });
        return;
      }

      // Jika viewer, ambil data akses dari Firestore
      try {
        const accessDoc = await getDoc(doc(db, 'userSKPDAccess', user.uid));
        
        if (accessDoc.exists()) {
          const data = accessDoc.data();
          setSkpdAccess({
            canViewAllSKPD: data.canViewAllSKPD || false,
            allowedSKPD: data.allowedSKPD || [],
            loading: false
          });
        } else {
          // Jika belum ada data akses, buat default
          setSkpdAccess({
            canViewAllSKPD: false,
            allowedSKPD: [],
            loading: false
          });
        }
      } catch (error) {
        console.error('Error fetching SKPD access:', error);
        setSkpdAccess({
          canViewAllSKPD: false,
          allowedSKPD: [],
          loading: false
        });
      }
    };

    fetchSKPDAccess();
  }, [user, userRole, selectedYear]);

  // Helper: Filter data berdasarkan akses SKPD
  const filterDataBySKPDAccess = (data, skpdField = 'NamaSKPD') => {
    if (!data || !Array.isArray(data)) return [];
    
    // Admin/editor atau viewer dengan akses semua
    if (userRole !== 'viewer' || skpdAccess.canViewAllSKPD) {
      return data;
    }
    
    // Viewer dengan akses terbatas
    const allowedSet = new Set(skpdAccess.allowedSKPD);
    return data.filter(item => allowedSet.has(item[skpdField]));
  };

  // Helper: Filter data bulanan (realisasi) berdasarkan akses SKPD
  const filterMonthlyDataBySKPDAccess = (monthlyData, skpdField = 'NamaSKPD') => {
    if (!monthlyData || typeof monthlyData !== 'object') return {};
    
    // Admin/editor atau viewer dengan akses semua
    if (userRole !== 'viewer' || skpdAccess.canViewAllSKPD) {
      return monthlyData;
    }
    
    // Viewer dengan akses terbatas
    const allowedSet = new Set(skpdAccess.allowedSKPD);
    const filtered = {};
    
    Object.keys(monthlyData).forEach(month => {
      const monthData = monthlyData[month];
      if (Array.isArray(monthData)) {
        const filteredMonth = monthData.filter(item => allowedSet.has(item[skpdField]));
        if (filteredMonth.length > 0) {
          filtered[month] = filteredMonth;
        }
      }
    });
    
    return filtered;
  };

  // Helper: Cek apakah user bisa akses SKPD tertentu
  const canAccessSKPD = (skpdName) => {
    if (userRole !== 'viewer' || skpdAccess.canViewAllSKPD) {
      return true;
    }
    return skpdAccess.allowedSKPD.includes(skpdName);
  };

  // Helper: Dapatkan daftar SKPD yang bisa diakses
  const getAccessibleSKPD = (allSKPD) => {
    if (!allSKPD || !Array.isArray(allSKPD)) return [];
    
    if (userRole !== 'viewer' || skpdAccess.canViewAllSKPD) {
      return allSKPD;
    }
    
    return allSKPD.filter(skpd => skpdAccess.allowedSKPD.includes(skpd));
  };

  return {
    ...skpdAccess,
    filterDataBySKPDAccess,
    filterMonthlyDataBySKPDAccess,
    canAccessSKPD,
    getAccessibleSKPD
  };
};