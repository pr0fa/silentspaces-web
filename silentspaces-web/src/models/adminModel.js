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

// ── Stats ──────────────────────────────────────────────────────────
export async function getAdminStats() {
  const [locSnap, userSnap, ratingSnap] = await Promise.all([
    getDocs(collection(db, "locations")),
    getDocs(collection(db, "users")),
    getDocs(collectionGroup(db, "ratings")),
  ]);

  const locations = locSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const totalRatings = ratingSnap.size;
  const totalUsers   = userSnap.size;

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

// ── Locations ─────────────────────────────────────────────────────
export async function getAdminLocations() {
  const snap = await getDocs(collection(db, "locations"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

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

export async function deleteLocation(locationId) {
  // Also delete all ratings in the subcollection
  const ratingsSnap = await getDocs(
    collection(db, "locations", locationId, "ratings")
  );
  await Promise.all(ratingsSnap.docs.map(d => deleteDoc(d.ref)));
  await deleteDoc(doc(db, "locations", locationId));
}

// ── Ratings ───────────────────────────────────────────────────────
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

export async function deleteRating(locationId, ratingId) {
  const locationRef = doc(db, "locations", locationId);
  const ratingRef   = doc(db, "locations", locationId, "ratings", ratingId);

  await runTransaction(db, async (tx) => {
    const locSnap    = await tx.get(locationRef);
    const ratingSnap = await tx.get(ratingRef);
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

// ── Users ─────────────────────────────────────────────────────────
export async function getAdminUsers() {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
