import { auth } from './firebase';
import { 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  AuthError
} from 'firebase/auth';

const googleProvider = new GoogleAuthProvider();
// Add additional scopes for better user info
googleProvider.addScope('profile');
googleProvider.addScope('email');

export const signInWithGoogle = async (useRedirect = false) => {
  try {
    if (useRedirect) {
      // Use redirect method as fallback
      await signInWithRedirect(auth, googleProvider);
      return null; // User will be available after redirect
    } else {
      // Use popup method (default)
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    }
  } catch (error) {
    const authError = error as AuthError;
    console.error('Error signing in with Google:', authError.code);
    throw error;
  }
};

export const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    return result?.user || null;
  } catch (error) {
    const authError = error as AuthError;
    console.error('Error handling redirect result:', authError.code);
    throw error;
  }
};

export const signOut = async (onSignOutComplete?: () => void) => {
  try {
    await firebaseSignOut(auth);
    if (onSignOutComplete) {
      onSignOutComplete();
    }
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};