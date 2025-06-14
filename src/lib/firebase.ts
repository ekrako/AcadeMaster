import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAlDryAVcnj6x4vwexXaX8m1CRro5fBmUU",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "academaster-1.firebaseapp.com",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://academaster-1-default-rtdb.us-central1.firebasedatabase.app/",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "academaster-1",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "academaster-1.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "498616340571",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:498616340571:web:5a2bc5acc6a3a838f4ef7e",
};

// Initialize Firebase only if it hasn't been initialized already
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Realtime Database
let database: any = null;

try {
  database = getDatabase(app);
} catch (error) {
  console.error('Failed to initialize Firebase Realtime Database:', error);
}

export const db = database;

export const auth = getAuth(app);