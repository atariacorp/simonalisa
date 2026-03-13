import { useState, useEffect } from 'react';
import { auth } from '../utils/firebase';
import { db } from '../utils/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState('guest');
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setLoading(true);
            
            if (firebaseUser) {
                // User login, ambil data dari Firestore
                try {
                    const userDocRef = doc(db, 'users', firebaseUser.uid);
                    const userDocSnap = await getDoc(userDocRef);
                    
                    if (userDocSnap.exists()) {
                        const data = userDocSnap.data();
                        setUserData(data);
                        setUserRole(data.role || 'guest');
                    } else {
                        // User tidak ada di Firestore, buat default sebagai viewer
                        console.warn('User not found in Firestore, setting as viewer');
                        setUserRole('viewer');
                        setUserData({ role: 'viewer', email: firebaseUser.email });
                    }
                    
                    setUser(firebaseUser);
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    setUserRole('guest');
                    setUser(firebaseUser);
                }
            } else {
                // User logout
                setUser(null);
                setUserRole('guest');
                setUserData(null);
            }
            
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    // Helper functions untuk cek role
    const isAdmin = userRole === 'admin';
    const isEditor = userRole === 'editor';
    const isViewer = userRole === 'viewer';
    const canEdit = isAdmin || isEditor;
    const canViewAll = isAdmin || isEditor; // Admin dan editor bisa lihat semua, viewer dibatasi

    return { 
        user, 
        userRole, 
        userData,
        loading,
        isAdmin,
        isEditor,
        isViewer,
        canEdit,
        canViewAll
    };
};