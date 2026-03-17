// src/api/locationsApi.js
// Reads location data directly from Firestore.
// The rest of the app calls these functions exactly as before.

import { db } from "../config/firebase";
import { collection, doc, getDocs, getDoc } from "firebase/firestore";

// Returns all locations as an array (used by SearchPage, MapPage, etc.)
export async function getLocations() {
  const snapshot = await getDocs(collection(db, "locations"));
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Returns a single location by its Firestore document ID
export async function getLocationById(id) {
  const snap = await getDoc(doc(db, "locations", id));
  if (!snap.exists()) throw new Error("Location not found");
  return { id: snap.id, ...snap.data() };
}
