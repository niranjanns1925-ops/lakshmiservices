import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface AppUser {
  uid: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  phone: string;
}

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, appUser: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const docRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setAppUser(docSnap.data() as AppUser);
          } else {
            // Default to minimal user if profile not fully created yet
            setAppUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || 'User',
              role: firebaseUser.email === 'niranjanns1925@gmail.com' ? 'admin' : 'user',
              phone: ''
            });
          }
        } catch (error: any) {
          console.error("Error fetching user role:", error);
          if (error.message && error.message.includes("client is offline")) {
            console.error("CRITICAL: Firestore is offline. Did you create the Firestore Database in the Firebase Console?");
            // Fallback for admin if firestore is uncreatable or blocked
            setAppUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || 'User',
              role: firebaseUser.email === 'niranjanns1925@gmail.com' ? 'admin' : 'user',
              phone: ''
            });
          }
        }
      } else {
        setAppUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, appUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
