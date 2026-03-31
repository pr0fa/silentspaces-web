// src/firebase.js
// Initialises the Firebase app and exports the Firestore instance.
// Import `db` anywhere you need to read/write Firestore.

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBpVhVsottH7rgAN4ssuuCtVYwdkM2hj2s",
  authDomain: "silentspaces-38398.firebaseapp.com",
  projectId: "silentspaces-38398",
  storageBucket: "silentspaces-38398.firebasestorage.app",
  messagingSenderId: "500169237282",
  appId: "1:500169237282:web:0939906a9c725ec7167b7b",
  measurementId: "G-26EZCSDCNY"
};

const app = initializeApp(firebaseConfig);

export const db             = getFirestore(app);
export const auth           = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
