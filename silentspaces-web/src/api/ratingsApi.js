// src/api/ratingsApi.js
// Uses Vite proxy, so /api goes to http://localhost:3001

// Submit a new rating for a location.
// Now also sends "bestTime" so it can be saved to the database.
export async function submitRating(id, rating, comment, bestTime) {
  return fetch(`/api/locations/${id}/ratings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      rating,
      comment,
      bestTime // new field sent to backend
    })
  }).then(res => {
    if (!res.ok) throw new Error("Failed to submit rating");
    return res.json();
  });
}


export async function getRatings(locationId) {
  const res = await fetch(`/api/locations/${locationId}/ratings`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to load ratings");
  }

  return res.json();
}
