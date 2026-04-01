import { createContext, useContext, useEffect, useState } from "react";
import { auth, googleProvider, db } from "../config/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

// Write/update user doc in Firestore so admin dashboard can count users
async function ensureUserDoc(user) {
  try {
    await setDoc(
      doc(db, "users", user.uid),
      {
        displayName: user.displayName || "",
        email:       user.email       || "",
        photoURL:    user.photoURL    || "",
        lastSeen:    serverTimestamp(),
      },
      { merge: true }
    );
  } catch {
    // non-critical — never block the auth flow
  }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
      if (user) ensureUserDoc(user);
    });
    return unsubscribe;
  }, []);

  const signUp = async (email, password, name) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    await setDoc(doc(db, "users", cred.user.uid), {
      displayName: name,
      email,
      photoURL:  "",
      createdAt: serverTimestamp(),
      lastSeen:  serverTimestamp(),
    });
    setCurrentUser({ ...cred.user, displayName: name });
    return cred;
  };

  const signIn = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const signInWithGoogle = () =>
    signInWithPopup(auth, googleProvider);

  const signInWithGoogleRedirect = () =>
    signInWithRedirect(auth, googleProvider);

  const getGoogleRedirectResult = () =>
    getRedirectResult(auth);

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ currentUser, loading, signUp, signIn, signInWithGoogle, signInWithGoogleRedirect, getGoogleRedirectResult, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
