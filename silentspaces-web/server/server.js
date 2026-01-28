const express = require("express");
const cors = require("cors");
const { readLocations, writeLocations, makeId, avg } = require("./jsonStore");

const app = express();
app.use(cors());
app.use(express.json());

function parseRating(x) {
  const n = Number(x);
  if (!Number.isFinite(n) || n < 1 || n > 5) return null;
  return Math.round(n);
}

// Save rating
app.post("/api/locations/:id/ratings", async (req, res) => {
  try {
    const locationId = req.params.id;
    const { rating, comment } = req.body || {};

    const r = parseRating(rating);
    if (r === null) return res.status(400).json({ error: "rating must be 1 to 5" });

    const safeComment = typeof comment === "string" ? comment.trim().slice(0, 300) : "";

    const locations = await readLocations();
    const loc = locations.find((l) => l.id === locationId);
    if (!loc) return res.status(404).json({ error: "Location not found" });

    if (!Array.isArray(loc.ratings)) loc.ratings = [];

    const newRating = {
      id: makeId("rating"),
      rating: r,
      comment: safeComment,
      createdAt: new Date().toISOString()
    };

    loc.ratings.push(newRating);

    // Update summary fields I already have in JSON
    loc.ratingCount = loc.ratings.length;
    loc.quietnessScore = avg(loc.ratings);

    await writeLocations(locations);

    res.status(201).json({ saved: newRating, ratingCount: loc.ratingCount, quietnessScore: loc.quietnessScore });
  } catch {
    res.status(500).json({ error: "Failed to save rating" });
  }
});

// Fetch ratings + average
app.get("/api/locations/:id/ratings", async (req, res) => {
  try {
    const locationId = req.params.id;

    const locations = await readLocations();
    const loc = locations.find((l) => l.id === locationId);
    if (!loc) return res.status(404).json({ error: "Location not found" });

    const ratings = Array.isArray(loc.ratings) ? loc.ratings : [];
    const sorted = [...ratings].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    res.json({
      locationId,
      count: sorted.length,
      average: avg(sorted),
      ratings: sorted
    });
  } catch {
    res.status(500).json({ error: "Failed to load ratings" });
  }
});

app.get("/health", (req, res) => res.json({ ok: true }));

const PORT = 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
