/*
  adminModel.js
  all the Firestore reads and writes that power the admin dashboard.
  none of this is called from user-facing pages — it's exclusively for AdminPage.
  the functions are intentionally verbose so future-me can scan them quickly.
*/

import { db } from "../config/firebase";
import {
  collection,
  collectionGroup,
  getDocs,
  deleteDoc,
  doc,
  addDoc,
  updateDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";


// grabs totals for the overview tab in one parallel round-trip.
// calculates the average quietness score across all locations that have been rated.
export async function getAdminStats() {
  const [locSnap, userSnap, ratingSnap] = await Promise.all([
    getDocs(collection(db, "locations")),
    getDocs(collection(db, "users")),
    getDocs(collectionGroup(db, "ratings")),
  ]);

  const locations    = locSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const totalRatings = ratingSnap.size;
  const totalUsers   = userSnap.size;

  // only include locations that actually have ratings in the average —
  // zeros would drag the number down and make the stat meaningless
  const scores = locations
    .map(l => Number(l.quietnessScore))
    .filter(s => s > 0);

  const avgQuietness =
    scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : 0;

  return {
    totalLocations: locations.length,
    totalRatings,
    totalUsers,
    avgQuietness,
  };
}


// returns all locations as a plain array for the Locations tab
export async function getAdminLocations() {
  const snap = await getDocs(collection(db, "locations"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}


// adds a brand-new location. coordinates come from the admin's geocode call —
// they're already validated before we get here.
export async function addLocation({ name, type, address, area, lat, lng, wifi, seating, sockets }) {
  const ref = await addDoc(collection(db, "locations"), {
    name,
    type,
    address,
    area:           area || "",
    lat:            Number(lat),
    lng:            Number(lng),
    wifi:           Boolean(wifi),
    seating:        Boolean(seating),
    sockets:        Boolean(sockets),
    quietnessScore: 0,
    ratingCount:    0,
    createdAt:      serverTimestamp(),
  });
  return ref.id;
}


// updates an existing location's metadata. note: we don't touch quietnessScore
// or ratingCount here — those are only ever updated by the rating transaction.
export async function updateLocation(locationId, { name, type, address, area, lat, lng, wifi, seating, sockets }) {
  await updateDoc(doc(db, "locations", locationId), {
    name,
    type,
    address,
    area:    area || "",
    lat:     Number(lat),
    lng:     Number(lng),
    wifi:    Boolean(wifi),
    seating: Boolean(seating),
    sockets: Boolean(sockets),
  });
}


// deletes a location AND all its ratings. we do the subcollection first because
// Firestore doesn't cascade deletes — orphaned rating docs would hang around forever.
export async function deleteLocation(locationId) {
  const ratingsSnap = await getDocs(
    collection(db, "locations", locationId, "ratings")
  );

  await Promise.all(ratingsSnap.docs.map(d => deleteDoc(d.ref)));
  await deleteDoc(doc(db, "locations", locationId));
}


// fetches every rating across all locations (collectionGroup query), sorted newest-first.
// capped at 200 so the admin table doesn't get ridiculous.
export async function getAdminRatings() {
  const snap = await getDocs(collectionGroup(db, "ratings"));

  return snap.docs
    .map(d => ({
      id:         d.id,
      locationId: d.ref.parent.parent.id,
      ...d.data(),
      createdAt:  d.data().createdAt?.toDate().toISOString() ?? "",
    }))
    .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
    .slice(0, 200);
}


// deletes a single rating and recalculates the parent location's running average
// inside a transaction — same pattern as submitRating but in reverse.
export async function deleteRating(locationId, ratingId) {
  const locationRef = doc(db, "locations", locationId);
  const ratingRef   = doc(db, "locations", locationId, "ratings", ratingId);

  await runTransaction(db, async (tx) => {
    const locSnap    = await tx.get(locationRef);
    const ratingSnap = await tx.get(ratingRef);

    // if either doc is already gone, just bail out gracefully
    if (!locSnap.exists() || !ratingSnap.exists()) return;

    const { ratingCount = 0, quietnessScore = 0 } = locSnap.data();
    const { rating } = ratingSnap.data();

    const newCount = Math.max(0, ratingCount - 1);
    const newScore =
      newCount === 0
        ? 0
        : Math.round(
            ((quietnessScore * ratingCount - rating) / newCount) * 10
          ) / 10;

    tx.delete(ratingRef);
    tx.update(locationRef, { ratingCount: newCount, quietnessScore: newScore });
  });
}


// returns all registered users for the Users tab
export async function getAdminUsers() {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
