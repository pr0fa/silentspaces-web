// src/api/ratingsApi.js
// Reads and writes ratings directly to Firestore.
// Each location has a "ratings" subcollection: /locations/{id}/ratings/{ratingId}
// When a rating is submitted, the parent location doc is updated atomically
// so quietnessScore and ratingCount always stay in sync.

import { db } from "../config/firebase";
import {
  collection,
  doc,
  getDocs,
  runTransaction,
  serverTimestamp,
  orderBy,
  query,
} from "firebase/firestore";

// Fetches all ratings for a location and computes the average.
// Returns the same shape the old REST API did: { average, count, ratings[] }
export async function getRatings(locationId) {
  const ratingsRef = collection(db, "locations", locationId, "ratings");
  const q = query(ratingsRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  const ratings = snapshot.docs.map(d => ({
    id: d.id,
    ...d.data(),
    // Firestore Timestamps need converting to ISO strings for display
    createdAt: d.data().createdAt?.toDate().toISOString() ?? new Date().toISOString(),
  }));

  const count = ratings.length;
  const average =
    count > 0
      ? Math.round((ratings.reduce((sum, r) => sum + r.rating, 0) / count) * 10) / 10
      : 0;

  return { average, count, ratings };
}

// Adds a new rating and updates the location's quietnessScore + ratingCount
// inside a single transaction so the aggregates are always consistent.
export async function submitRating(locationId, rating, comment, bestTime) {
  const locationRef = doc(db, "locations", locationId);
  const ratingRef = doc(collection(db, "locations", locationId, "ratings"));

  let savedRating;

  await runTransaction(db, async (tx) => {
    const locSnap = await tx.get(locationRef);
    if (!locSnap.exists()) throw new Error("Location not found");

    const { ratingCount = 0, quietnessScore = 0, dayVisits = [0,0,0,0,0,0,0] } = locSnap.data();

    const newCount = ratingCount + 1;
    const newScore =
      Math.round(((quietnessScore * ratingCount + rating) / newCount) * 10) / 10;

    const newDayVisits = [...dayVisits];
    newDayVisits[new Date().getDay()]++;
    const maxDay = Math.max(...newDayVisits);
    const totalVisits = newDayVisits.reduce((a, b) => a + b, 0);
    const ratio = totalVisits > 0 ? maxDay / totalVisits : 0;
    const busynessLevel = ratio >= 0.35 ? "High" : ratio >= 0.2 ? "Mid" : "Low";

    tx.set(ratingRef, {
      rating,
      comment: comment ?? "",
      bestTime: bestTime ?? "",
      createdAt: serverTimestamp(),
    });

    tx.update(locationRef, {
      ratingCount: newCount,
      quietnessScore: newScore,
      dayVisits: newDayVisits,
      busynessLevel,
    });

    savedRating = {
      id: ratingRef.id,
      rating,
      comment: comment ?? "",
      bestTime: bestTime ?? "",
      createdAt: new Date().toISOString(),
    };
  });

  return savedRating;
}
