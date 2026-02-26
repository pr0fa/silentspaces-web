require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { getStore } = require("./storage");
const store = getStore();

const app = express();
app.use(cors());
app.use(express.json());

// ----------------------
// Utility
// ----------------------

function parseRating(x) {
  const n = Number(x);
  if (!Number.isFinite(n) || n < 1 || n > 5) return null;
  return Math.round(n);
}

// ----------------------
// Locations (DB-backed)
// ----------------------

// List all locations (Search page)
app.get("/api/locations", async (req, res) => {
  try {
    const locations = await store.getLocations();
    res.json(locations);
  } catch (e) {
    console.error("GET /api/locations failed:", e?.sqlMessage || e?.message || e);
    res.status(500).json({ error: "Failed to load locations" });
  }
});

// Get single location (Details + Rate header)
app.get("/api/locations/:id", async (req, res) => {
  try {
    const loc = await store.getLocationById(req.params.id);
    if (!loc) {
      return res.status(404).json({ error: "Location not found" });
    }
    res.json(loc);
  } catch (e) {
    console.error("GET /api/locations/:id failed:", e?.sqlMessage || e?.message || e);
    res.status(500).json({ error: "Failed to load location" });
  }
});

// ----------------------
// Ratings
// ----------------------

// Save rating (with bestTime support)
app.post("/api/locations/:id/ratings", async (req, res) => {
  try {
    const locationId = req.params.id;
    const { rating, comment, bestTime } = req.body || {};

    const r = parseRating(rating);
    if (r === null) {
      return res.status(400).json({ error: "rating must be 1 to 5" });
    }

    const result = await store.addRating(locationId, r, comment, bestTime);
    if (!result) {
      return res.status(404).json({ error: "Location not found" });
    }

    res.status(201).json(result);
  } catch (e) {
    console.error(
      "POST /api/locations/:id/ratings failed:",
      e?.sqlMessage || e?.message || e
    );
    res.status(500).json({ error: "Failed to save rating" });
  }
});

// Fetch ratings + average
app.get("/api/locations/:id/ratings", async (req, res) => {
  try {
    const locationId = req.params.id;

    const result = await store.getRatings(locationId);
    if (!result) {
      return res.status(404).json({ error: "Location not found" });
    }

    res.json(result);
  } catch (e) {
    console.error(
      "GET /api/locations/:id/ratings failed:",
      e?.sqlMessage || e?.message || e
    );
    res.status(500).json({ error: "Failed to load ratings" });
  }
});

// ----------------------
// Health Checks
// ----------------------

// Basic server health
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// Database health
app.get("/health/db", async (req, res) => {
  try {
    await store.getLocations(); // simple query
    res.json({ ok: true, db: "connected" });
  } catch (e) {
    console.error("DB health check failed:", e?.sqlMessage || e?.message || e);
    res.status(500).json({ ok: false, db: "error" });
  }
});

// ----------------------
// Startup DB Verification
// ----------------------

(async () => {
  try {
    await store.getLocations();
    console.log("Database connection verified on startup");
  } catch (e) {
    console.error(
      "Database verification failed on startup:",
      e?.sqlMessage || e?.message || e
    );
  }
})();

// ----------------------
// Start Server
// ----------------------

const PORT = 3001;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});