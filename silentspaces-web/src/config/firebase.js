/*
  firebase.js
  initialises the Firebase app and exports the three things the rest of the
  app will need: db (Firestore), auth (Firebase Auth), and googleProvider.
  import from here, never initialise Firebase elsewhere — one instance only.
*/

import { initializeApp }               from "firebase/app";
import { getFirestore }                from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";


const firebaseConfig = {
  apiKey:            "AIzaSyBpVhVsottH7rgAN4ssuuCtVYwdkM2hj2s",
  authDomain:        "silentspaces-38398.firebaseapp.com",
  projectId:         "silentspaces-38398",
  storageBucket:     "silentspaces-38398.firebasestorage.app",
  messagingSenderId: "500169237282",
  appId:             "1:500169237282:web:0939906a9c725ec7167b7b",
  measurementId:     "G-26EZCSDCNY",
};

const app = initializeApp(firebaseConfig);

export const db             = getFirestore(app);
export const auth           = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
