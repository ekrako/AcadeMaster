import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';
import { getAuth, Auth } from 'firebase/auth';

// Firebase configuration with environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate that we have all required configuration
function validateFirebaseConfig() {
  const requiredFields = [
    'apiKey',
    'authDomain', 
    'databaseURL',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
  ];

  for (const field of requiredFields) {
    const value = firebaseConfig[field as keyof typeof firebaseConfig];
    if (!value) {
      console.error(`Missing Firebase configuration: ${field}`);
      return false;
    }
  }
  return true;
}

// Initialize Firebase
let app: FirebaseApp | null = null;
let db: Database | null = null; 
let auth: Auth | null = null;

try {
  if (validateFirebaseConfig()) {
    // Initialize Firebase only if it hasn't been initialized already
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    
    // Initialize services
    db = getDatabase(app);
    auth = getAuth(app);
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
}

// Export Firebase services
export { db, auth };