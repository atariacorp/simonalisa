// src/services/userService.js
import { db, auth } from '../utils/firebase';
import { 
  collection, doc, setDoc, getDocs, getDoc, 
  query, where, updateDoc, deleteDoc, addDoc,
  orderBy, limit, Timestamp
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  deleteUser,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';

export const userService = {
  // Membuat user baru (hanya untuk admin)
  async createUser(email, password, role, displayName = '') {
    try {
      // 1. Buat user di Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update profile dengan display name
      if (displayName) {
        await updateProfile(user, { displayName });
      }
      
      // 2. Simpan data user di Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: email,
        role: role,
        displayName: displayName || email.split('@')[0],
        createdAt: new Date().toISOString(),
        createdBy: auth.currentUser?.email || 'system',
        createdByUid: auth.currentUser?.uid || 'system',
        lastLogin: null,
        isActive: true
      });
      
      // 3. Jika role viewer, buat dokumen akses SKPD
      if (role === 'viewer') {
        await setDoc(doc(db, 'userSKPDAccess', user.uid), {
          canViewAllSKPD: false,
          allowedSKPD: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: auth.currentUser?.email
        });
      }
      
      // 4. Log aktivitas pembuatan user
      await this.logUserActivity('create_user', {
        targetEmail: email,
        targetRole: role,
        targetUid: user.uid
      });
      
      return { 
        uid: user.uid, 
        email, 
        role,
        success: true 
      };
    } catch (error) {
      console.error('Error creating user:', error);
      await this.logUserActivity('create_user_failed', {
        targetEmail: email,
        error: error.message
      });
      throw error;
    }
  },

  // Mendapatkan semua users
  async getAllUsers() {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const users = [];
      snapshot.forEach(doc => {
        users.push({
          uid: doc.id,
          ...doc.data()
        });
      });
      // Urutkan berdasarkan createdAt terbaru
      return users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  },

  // Mendapatkan user berdasarkan UID
  async getUserById(uid) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return {
          uid: userDoc.id,
          ...userDoc.data()
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting user by id:', error);
      throw error;
    }
  },

  // Mendapatkan user berdasarkan role
  async getUsersByRole(role) {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', role));
      const snapshot = await getDocs(q);
      const users = [];
      snapshot.forEach(doc => {
        users.push({
          uid: doc.id,
          ...doc.data()
        });
      });
      return users;
    } catch (error) {
      console.error('Error getting users by role:', error);
      throw error;
    }
  },

  // Mendapatkan user yang aktif
  async getActiveUsers() {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('isActive', '==', true));
      const snapshot = await getDocs(q);
      const users = [];
      snapshot.forEach(doc => {
        users.push({
          uid: doc.id,
          ...doc.data()
        });
      });
      return users;
    } catch (error) {
      console.error('Error getting active users:', error);
      throw error;
    }
  },

  // Update role user
  async updateUserRole(uid, newRole) {
    try {
      const oldUserData = await this.getUserById(uid);
      
      await updateDoc(doc(db, 'users', uid), {
        role: newRole,
        updatedAt: new Date().toISOString(),
        updatedBy: auth.currentUser?.email,
        updatedByUid: auth.currentUser?.uid
      });

      // Jika berubah menjadi viewer, pastikan ada dokumen akses
      if (newRole === 'viewer') {
        const accessDoc = await getDoc(doc(db, 'userSKPDAccess', uid));
        if (!accessDoc.exists()) {
          await setDoc(doc(db, 'userSKPDAccess', uid), {
            canViewAllSKPD: false,
            allowedSKPD: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            updatedBy: auth.currentUser?.email
          });
        }
      }
      
      // Log aktivitas
      await this.logUserActivity('update_user_role', {
        targetUid: uid,
        oldRole: oldUserData?.role,
        newRole: newRole
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  },

  // Aktifkan/Nonaktifkan user
  async toggleUserStatus(uid, isActive) {
    try {
      await updateDoc(doc(db, 'users', uid), {
        isActive: isActive,
        updatedAt: new Date().toISOString(),
        updatedBy: auth.currentUser?.email
      });
      
      await this.logUserActivity('toggle_user_status', {
        targetUid: uid,
        isActive: isActive
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error toggling user status:', error);
      throw error;
    }
  },

  // Delete user
  async deleteUser(uid) {
    try {
      // Dapatkan data user sebelum dihapus
      const userData = await this.getUserById(uid);
      
      // Hapus dari Firestore
      await deleteDoc(doc(db, 'users', uid));
      await deleteDoc(doc(db, 'userSKPDAccess', uid));
      
      // Hapus aktivitas user terkait
      const activitiesRef = collection(db, 'userActivities');
      const q = query(activitiesRef, where('userId', '==', uid));
      const activitiesSnapshot = await getDocs(q);
      const deleteBatch = [];
      activitiesSnapshot.forEach(doc => {
        deleteBatch.push(deleteDoc(doc.ref));
      });
      await Promise.all(deleteBatch);
      
      // Log aktivitas
      await this.logUserActivity('delete_user', {
        targetUid: uid,
        targetEmail: userData?.email,
        targetRole: userData?.role
      });
      
      return { 
        success: true, 
        message: 'User deleted from Firestore. Please delete from Authentication manually.' 
      };
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // Mendapatkan akses SKPD untuk viewer
  async getSKPDAccess(uid) {
    try {
      const accessDoc = await getDoc(doc(db, 'userSKPDAccess', uid));
      if (accessDoc.exists()) {
        return accessDoc.data();
      }
      return {
        canViewAllSKPD: false,
        allowedSKPD: []
      };
    } catch (error) {
      console.error('Error getting SKPD access:', error);
      throw error;
    }
  },

  // Update akses SKPD untuk viewer
  async updateSKPDAccess(uid, data) {
    try {
      await setDoc(doc(db, 'userSKPDAccess', uid), {
        canViewAllSKPD: data.canViewAllSKPD || false,
        allowedSKPD: data.allowedSKPD || [],
        updatedAt: new Date().toISOString(),
        updatedBy: auth.currentUser?.email,
        updatedByUid: auth.currentUser?.uid
      }, { merge: true });
      
      await this.logUserActivity('update_skpd_access', {
        targetUid: uid,
        canViewAllSKPD: data.canViewAllSKPD,
        allowedSKPDCount: data.allowedSKPD?.length || 0
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error updating SKPD access:', error);
      throw error;
    }
  },

  // Reset password
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      
      await this.logUserActivity('reset_password', {
        targetEmail: email
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  },

  // Update last login
  async updateLastLogin(uid) {
    try {
      await updateDoc(doc(db, 'users', uid), {
        lastLogin: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  },

  // Mendapatkan semua SKPD dari data realisasi pendapatan
  async getAllSKPD(selectedYear) {
    try {
      // Ambil dari koleksi realisasi pendapatan di tahun yang dipilih
      const pendapatanRef = collection(db, 'publicData', String(selectedYear), 'realisasiPendapatan');
      const snapshot = await getDocs(pendapatanRef);
      const skpdSet = new Set();
      
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.data && Array.isArray(data.data)) {
          data.data.forEach(item => {
            if (item.nama_skpd) {
              skpdSet.add(item.nama_skpd);
            }
            if (item.kode_skpd) {
              skpdSet.add(`${item.kode_skpd} - ${item.nama_skpd || ''}`.trim());
            }
          });
        }
      });
      
      // Jika tidak ada data pendapatan, ambil dari anggaran
      if (skpdSet.size === 0) {
        const anggaranRef = collection(db, 'publicData', String(selectedYear), 'anggaran');
        const anggaranSnapshot = await getDocs(anggaranRef);
        
        anggaranSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.data && Array.isArray(data.data)) {
            data.data.forEach(item => {
              if (item.NamaSKPD) {
                skpdSet.add(item.NamaSKPD);
              }
            });
          }
        });
      }
      
      return Array.from(skpdSet).sort();
    } catch (error) {
      console.error('Error getting all SKPD:', error);
      return [];
    }
  },

  // Mendapatkan SKPD yang memiliki data pendapatan
  async getSKPDWithPendapatan(selectedYear) {
    try {
      const pendapatanRef = collection(db, 'publicData', String(selectedYear), 'realisasiPendapatan');
      const snapshot = await getDocs(pendapatanRef);
      const skpdMap = new Map();
      
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.data && Array.isArray(data.data)) {
          data.data.forEach(item => {
            const skpdKey = item.kode_skpd || item.nama_skpd;
            if (skpdKey && !skpdMap.has(skpdKey)) {
              skpdMap.set(skpdKey, {
                kode: item.kode_skpd,
                nama: item.nama_skpd,
                totalNilai: 0
              });
            }
            const entry = skpdMap.get(skpdKey);
            if (entry) {
              entry.totalNilai += (item.nilai || 0);
            }
          });
        }
      });
      
      return Array.from(skpdMap.values()).sort((a, b) => b.totalNilai - a.totalNilai);
    } catch (error) {
      console.error('Error getting SKPD with pendapatan:', error);
      return [];
    }
  },

  // ==================== FUNGSI LOG AKTIVITAS USER ====================
  
  // Log aktivitas user
  async logUserActivity(action, details = {}) {
    try {
      const currentUser = auth.currentUser;
      const activitiesRef = collection(db, 'userActivities');
      
      await addDoc(activitiesRef, {
        action: action,
        userId: currentUser?.uid || 'system',
        userEmail: currentUser?.email || 'system',
        timestamp: Timestamp.now(),
        date: new Date().toISOString(),
        details: details,
        ipAddress: null, // Bisa ditambahkan jika perlu
        userAgent: navigator.userAgent
      });
    } catch (error) {
      console.error('Error logging user activity:', error);
      // Jangan throw error, cukup log ke console
    }
  },

  // Mendapatkan aktivitas user
  async getUserActivities(limitCount = 100, userId = null) {
    try {
      const activitiesRef = collection(db, 'userActivities');
      let q = query(activitiesRef, orderBy('timestamp', 'desc'), limit(limitCount));
      
      if (userId) {
        q = query(activitiesRef, where('userId', '==', userId), orderBy('timestamp', 'desc'), limit(limitCount));
      }
      
      const snapshot = await getDocs(q);
      const activities = [];
      snapshot.forEach(doc => {
        activities.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return activities;
    } catch (error) {
      console.error('Error getting user activities:', error);
      return [];
    }
  },

  // Mendapatkan statistik aktivitas user
  async getActivityStats(days = 7) {
    try {
      const activitiesRef = collection(db, 'userActivities');
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const q = query(activitiesRef, where('timestamp', '>=', Timestamp.fromDate(cutoffDate)));
      const snapshot = await getDocs(q);
      
      const stats = {
        total: snapshot.docs.length,
        byAction: {},
        byUser: new Map(),
        daily: {}
      };
      
      snapshot.forEach(doc => {
        const activity = doc.data();
        const action = activity.action;
        const userId = activity.userId;
        const date = activity.date?.split('T')[0] || 'unknown';
        
        // Hitung per aksi
        stats.byAction[action] = (stats.byAction[action] || 0) + 1;
        
        // Hitung per user
        if (!stats.byUser.has(userId)) {
          stats.byUser.set(userId, { count: 0, email: activity.userEmail });
        }
        stats.byUser.get(userId).count++;
        
        // Hitung per hari
        stats.daily[date] = (stats.daily[date] || 0) + 1;
      });
      
      // Konversi Map ke array
      stats.byUser = Array.from(stats.byUser.entries()).map(([userId, data]) => ({
        userId,
        ...data
      })).sort((a, b) => b.count - a.count);
      
      return stats;
    } catch (error) {
      console.error('Error getting activity stats:', error);
      return null;
    }
  },

  // ==================== FUNGSI VALIDASI ====================
  
  // Validasi apakah user memiliki akses ke SKPD tertentu
  async hasSKPDAccess(uid, skpdName) {
    try {
      const userData = await this.getUserById(uid);
      if (!userData) return false;
      
      // Admin dan operator memiliki akses semua
      if (userData.role === 'admin' || userData.role === 'operator') {
        return true;
      }
      
      // Viewer perlu dicek aksesnya
      const access = await this.getSKPDAccess(uid);
      if (access.canViewAllSKPD) return true;
      
      return access.allowedSKPD?.includes(skpdName) || false;
    } catch (error) {
      console.error('Error checking SKPD access:', error);
      return false;
    }
  },

  // Filter data berdasarkan akses user
  async filterDataByAccess(data, uid) {
    try {
      const userData = await this.getUserById(uid);
      if (!userData) return [];
      
      // Admin dan operator dapat melihat semua
      if (userData.role === 'admin' || userData.role === 'operator') {
        return data;
      }
      
      // Viewer hanya dapat melihat SKPD yang diizinkan
      const access = await this.getSKPDAccess(uid);
      if (access.canViewAllSKPD) return data;
      
      const allowedSKPD = access.allowedSKPD || [];
      return data.filter(item => {
        const skpdName = item.nama_skpd || item.NamaSKPD || item.skpd;
        return allowedSKPD.includes(skpdName);
      });
    } catch (error) {
      console.error('Error filtering data by access:', error);
      return [];
    }
  }
};

// Export default untuk kemudahan import
export default userService;