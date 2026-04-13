/*
  ratingModel.js
  reads and writes ratings to Firestore.

  the data structure:
    /locations/{locationId}/ratings/{ratingId}

  every time someone submits a rating we run a Firestore transaction that:
    1. reads the current location doc to get the running average
    2. writes the new rating doc into the subcollection
    3. updates quietnessScore and ratingCount on the parent location doc
  doing it in a single transaction means those two values are always in sync —
  no chance of a half-written state if the network drops mid-save.
*/

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


// fetches all ratings for a location, sorted newest-first.
// also calculates the current average so the UI doesn't have to do the math.
export async function getRatings(locationId) {
  const ratingsRef = collection(db, "locations", locationId, "ratings");
  const q = query(ratingsRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  const ratings = snapshot.docs.map(d => ({
    id: d.id,
    ...d.data(),
    // Firestore Timestamps aren't plain strings — convert them so components
    // can just call new Date(r.createdAt) without any extra fuss
    createdAt: d.data().createdAt?.toDate().toISOString() ?? new Date().toISOString(),
  }));

  const count = ratings.length;
  const average =
    count > 0
      ? Math.round((ratings.reduce((sum, r) => sum + r.rating, 0) / count) * 10) / 10
      : 0;

  return { average, count, ratings };
}


// submits a new rating and atomically updates the location's aggregates.
// the transaction guarantees quietnessScore and ratingCount stay consistent
// even if two users submit at the exact same millisecond.
export async function submitRating(locationId, rating, comment, bestTime) {
  const locationRef = doc(db, "locations", locationId);
  const ratingRef   = doc(collection(db, "locations", locationId, "ratings"));

  let savedRating;

  await runTransaction(db, async (tx) => {
    const locSnap = await tx.get(locationRef);
    if (!locSnap.exists()) throw new Error("Location not found");

    const {
      ratingCount   = 0,
      quietnessScore = 0,
      dayVisits      = [0, 0, 0, 0, 0, 0, 0],
    } = locSnap.data();

    // recalculate the running average with the new rating included
    const newCount = ratingCount + 1;
    const newScore = Math.round(
      ((quietnessScore * ratingCount + rating) / newCount) * 10
    ) / 10;

    // track which day of the week this visit happened so we can power the
    // "popular times" chart on the location details page
    const newDayVisits = [...dayVisits];
    newDayVisits[new Date().getDay()]++;

    // figure out busyness level based on how evenly visits are spread across the week
    const maxDay     = Math.max(...newDayVisits);
    const totalVisits = newDayVisits.reduce((a, b) => a + b, 0);
    const ratio       = totalVisits > 0 ? maxDay / totalVisits : 0;
    const busynessLevel = ratio >= 0.35 ? "High" : ratio >= 0.2 ? "Mid" : "Low";

    tx.set(ratingRef, {
      rating,
      comment:   comment  ?? "",
      bestTime:  bestTime ?? "",
      createdAt: serverTimestamp(),
    });

    tx.update(locationRef, {
      ratingCount:    newCount,
      quietnessScore: newScore,
      dayVisits:      newDayVisits,
      busynessLevel,
    });

    // build the return value now — after the transaction commits we can't re-read
    // serverTimestamp so we use a plain Date as a close-enough approximation
    savedRating = {
      id:        ratingRef.id,
      rating,
      comment:   comment  ?? "",
      bestTime:  bestTime ?? "",
      createdAt: new Date().toISOString(),
    };
  });

  return savedRating;
}
