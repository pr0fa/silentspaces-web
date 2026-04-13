/*
  locationModel.js
  all Firestore reads for the "locations" collection live here.
  the rest of the app calls these functions — nothing talks to Firestore directly.
  if we ever swap the data source, this is the only file that needs to change.
*/

import { db } from "../config/firebase";
import { collection, doc, getDocs, getDoc } from "firebase/firestore";


// grabs every location in one go. used by SearchPage, MapPage, and anywhere
// else that needs the full list. returns a plain array — safe to map over.
export async function getLocations() {
  const snapshot = await getDocs(collection(db, "locations"));
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}


// fetches a single location by its Firestore document ID.
// throws if the doc doesn't exist so the caller can show a "not found" state.
export async function getLocationById(id) {
  const snap = await getDoc(doc(db, "locations", id));
  if (!snap.exists()) throw new Error("Location not found");
  return { id: snap.id, ...snap.data() };
}
