// src/api/locationsApi.js
// Small helper for talking to the backend locations endpoints.
// Keeps fetch logic in one place so pages/components stay clean.

export async function getLocations() {
  // Uses Vite proxy in dev (/api -> backend) so we don't hardcode URLs.
  const res = await fetch("/api/locations");

  // Fail fast if the backend responds with an error.
  if (!res.ok) throw new Error("Failed to load locations");

  return res.json();
}

export async function getLocationById(id) {
  // Fetch a single location for details/rate pages.
  const res = await fetch(`/api/locations/${id}`);

  if (!res.ok) throw new Error("Failed to load location");

  return res.json();
}
