// src/services/userService.js
import { db, auth } from '../utils/firebase';
import { 
  collection, doc, setDoc, getDocs, getDoc, 
  query, where, updateDoc, deleteDoc 
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  deleteUser,
  sendPasswordResetEmail 
} from 'firebase/auth';

export const userService = {
  // Membuat user baru (hanya untuk admin)
  async createUser(email, password, role, displayName = '') {
    try {
      // 1. Buat user di Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // 2. Simpan data user di Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: email,
        role: role,
        displayName: displayName || email.split('@')[0],
        createdAt: new Date().toISOString(),
        createdBy: auth.currentUser?.email || 'system',
        lastLogin: null
      });
      
      // 3. Jika role viewer, buat dokumen akses SKPD
      if (role === 'viewer') {
        await setDoc(doc(db, 'userSKPDAccess', user.uid), {
          canViewAllSKPD: false,
          allowedSKPD: [],
          updatedAt: new Date().toISOString(),
          updatedBy: auth.currentUser?.email
        });
      }
      
      return { 
        uid: user.uid, 
        email, 
        role,
        success: true 
      };
    } catch (error) {
      console.error('Error creating user:', error);
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
      return users;
    } catch (error) {
      console.error('Error getting users:', error);
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

  // Update role user
  async updateUserRole(uid, newRole) {
    try {
      await updateDoc(doc(db, 'users', uid), {
        role: newRole,
        updatedAt: new Date().toISOString(),
        updatedBy: auth.currentUser?.email
      });

      // Jika berubah menjadi viewer, pastikan ada dokumen akses
      if (newRole === 'viewer') {
        const accessDoc = await getDoc(doc(db, 'userSKPDAccess', uid));
        if (!accessDoc.exists()) {
          await setDoc(doc(db, 'userSKPDAccess', uid), {
            canViewAllSKPD: false,
            allowedSKPD: [],
            updatedAt: new Date().toISOString(),
            updatedBy: auth.currentUser?.email
          });
        }
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  },

  // Delete user
  async deleteUser(uid) {
    try {
      // Hapus dari Firestore
      await deleteDoc(doc(db, 'users', uid));
      await deleteDoc(doc(db, 'userSKPDAccess', uid));
      
      // Note: Untuk hapus dari Authentication perlu Firebase Admin SDK
      // atau Firebase Functions. Untuk sekarang, kita hapus manual di Firebase Console
      return { success: true, message: 'User deleted from Firestore. Please delete from Authentication manually.' };
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
        updatedBy: auth.currentUser?.email
      }, { merge: true });
      
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

  // Mendapatkan semua SKPD dari data anggaran
  async getAllSKPD(selectedYear) {
    try {
      // Ambil dari koleksi anggaran di tahun yang dipilih
      const anggaranRef = collection(db, 'publicData', String(selectedYear), 'anggaran');
      const snapshot = await getDocs(anggaranRef);
      const skpdSet = new Set();
      
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.data && Array.isArray(data.data)) {
          data.data.forEach(item => {
            if (item.NamaSKPD) {
              skpdSet.add(item.NamaSKPD);
            }
          });
        }
      });
      
      return Array.from(skpdSet).sort();
    } catch (error) {
      console.error('Error getting all SKPD:', error);
      return [];
    }
  }
};