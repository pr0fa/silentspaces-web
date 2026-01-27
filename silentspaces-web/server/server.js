require("dotenv").config();

const express = require("express");
const cors = require("cors");

// keep here if i decide to use .env later (MySQL)
try {
  require("dotenv").config();
} catch (_) {}

const { getStore } = require("./storage");
const store = getStore();

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

    const result = await store.addRating(locationId, r, comment);
    if (!result) return res.status(404).json({ error: "Location not found" });

    res.status(201).json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to save rating" });
  }
});

// Fetch ratings + average
app.get("/api/locations/:id/ratings", async (req, res) => {
  try {
    const locationId = req.params.id;

    const result = await store.getRatings(locationId);
    if (!result) return res.status(404).json({ error: "Location not found" });

    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load ratings" });
  }
});

app.get("/health", (req, res) => res.json({ ok: true }));

const PORT = 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
