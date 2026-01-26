// src/api/ratingsApi.js
// Uses Vite proxy, so /api goes to http://localhost:3001

export async function submitRating(locationId, rating, comment) {
  const res = await fetch(`/api/locations/${locationId}/ratings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rating, comment })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to submit rating");
  }

  return res.json();
}

export async function getRatings(locationId) {
  const res = await fetch(`/api/locations/${locationId}/ratings`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to load ratings");
  }

  return res.json();
}
