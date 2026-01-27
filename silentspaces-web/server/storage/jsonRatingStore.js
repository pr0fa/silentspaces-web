// server/storage/jsonRatingsStore.js
const { readLocations, writeLocations, makeId, avg } = require("../jsonStore");

// adds a rating to a location and updates quietnessScore and ratingCount
async function addRating(locationId, rating, comment) {
  const locations = await readLocations();
  const loc = locations.find((l) => l.id === locationId);
  if (!loc) return null;

  if (!Array.isArray(loc.ratings)) loc.ratings = [];

  const newRating = {
    id: makeId("rating"),
    rating,
    comment: typeof comment === "string" ? comment.trim().slice(0, 300) : "",
    createdAt: new Date().toISOString()
  };

  loc.ratings.push(newRating);

  // keep fields consistent with stored ratings
  loc.ratingCount = loc.ratings.length;
  loc.quietnessScore = avg(loc.ratings);

  await writeLocations(locations);

  return {
    saved: newRating,
    ratingCount: loc.ratingCount,
    quietnessScore: loc.quietnessScore
  };
}

// returns rating stats and recent ratings for a location
async function getRatings(locationId) {
  const locations = await readLocations();
  const loc = locations.find((l) => l.id === locationId);
  if (!loc) return null;

  const ratings = Array.isArray(loc.ratings) ? loc.ratings : [];
  const sorted = [...ratings].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return {
    locationId,
    count: sorted.length,
    average: avg(sorted),
    ratings: sorted
  };
}

module.exports = { addRating, getRatings };
