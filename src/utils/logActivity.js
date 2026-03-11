import { collection, addDoc } from "firebase/firestore";
import { db, auth } from './firebase';

export const logActivity = async (action, details = {}) => {
    try {
        const user = auth.currentUser;
        if (!user) return;

        await addDoc(collection(db, "logs"), {
            action: action,
            details: details,
            userEmail: user.email,
            userId: user.uid,
            timestamp: new Date(),
        });
    } catch (error) {
        console.error("Error logging activity:", error);
    }
};
 
 