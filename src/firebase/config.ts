/// <reference types="vite/client" />
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyC9quSO76Er4J4E-3EDqt_zaMDlvg60eBE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "online-9f1bf.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "online-9f1bf",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "online-9f1bf.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "917304515219",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:917304515219:web:5a211d40a255283fc40b66",
  measurementId: "G-VGXE21RRNW"
};

let app, auth, db, storage, initError, analytics;

try {
  if (!firebaseConfig.apiKey) {
    console.error("FIREBASE API KEY IS MISSING! Please add it to your environment variables.");
  }
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = initializeFirestore(app, {
      experimentalForceLongPolling: true
    });
    storage = getStorage(app);
  } else {
    app = getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  }
  
  if (typeof window !== 'undefined') {
    isSupported().then(supported => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    }).catch(console.error);
  }
} catch (error: any) {
  initError = error;
  console.error("Firebase initialization error. Please check your config.", error);
  try {
    fetch('/api/debug-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
         errorMsg: error?.message, 
         config: firebaseConfig,
         stack: error?.stack
      })
    });
  } catch (e) {}
}

export { app, auth, db, storage, analytics, initError, firebaseConfig };
