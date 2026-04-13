/*
  AuthContext.jsx
  the single source of truth for everything auth-related. wrap the app in
  <AuthProvider> and then call useAuth() anywhere you need the current user
  or an auth function. don't call firebase auth directly from pages — go through here.
*/

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

// the hook — call this anywhere inside the AuthProvider tree
export const useAuth = () => useContext(AuthContext);


// writes (or updates) the user's doc in Firestore so the admin dashboard
// can count users and show last-seen timestamps. this runs silently in the
// background — if it fails we don't want it to block the login flow at all.
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
      { merge: true } // merge so we don't wipe fields set elsewhere
    );
  } catch {
    // non-critical — swallow the error so auth never gets blocked by a Firestore hiccup
  }
}


export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading,     setLoading]     = useState(true);

  // listen to Firebase auth state changes. this fires immediately on mount with
  // the persisted session (if any), which is why we wait for loading to be false
  // before rendering children, avoids a flash of the login page for signed-in users.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);

      // keep the Firestore user doc fresh every time auth state resolves
      if (user) ensureUserDoc(user);
    });

    return unsubscribe; // clean up the listener when the provider unmounts
  }, []);


  // creates a new account, sets the display name, and writes the user doc to Firestore
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

    // manually update local state because Firebase doesn't emit a new onAuthStateChanged
    // immediately after updateProfile — the name would be blank until the next reload otherwise
    setCurrentUser({ ...cred.user, displayName: name });

    return cred;
  };


  const signIn = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);


  // desktop google sign-in uses a popup — faster and no page reload
  const signInWithGoogle = () =>
    signInWithPopup(auth, googleProvider);


  // mobile google sign-in uses a redirect — popups are blocked on most mobile browsers
  const signInWithGoogleRedirect = () =>
    signInWithRedirect(auth, googleProvider);


  // call this on mount in auth pages to pick up the result after a redirect flow
  const getGoogleRedirectResult = () =>
    getRedirectResult(auth);


  const logout = () => signOut(auth);


  return (
    <AuthContext.Provider value={{
      currentUser,
      loading,
      signUp,
      signIn,
      signInWithGoogle,
      signInWithGoogleRedirect,
      getGoogleRedirectResult,
      logout,
    }}>
      {/* don't render children until we know the auth state — prevents flicker */}
      {!loading && children}
    </AuthContext.Provider>
  );
}
