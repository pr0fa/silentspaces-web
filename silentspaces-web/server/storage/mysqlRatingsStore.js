// server/storage/mysqlRatingsStore.js
// MySQL store (XAMPP). Handles locations + ratings.
// Requires: npm i mysql2 dotenv

const mysql = require("mysql2/promise");

let pool = null;

function getPool() {
  if (pool) return pool;

  pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "silentspaces",
    port: Number(process.env.DB_PORT || 3306),
    waitForConnections: true,
    connectionLimit: 10
  });

  return pool;
}

// -------- Locations --------

// Get all locations (used by search/list page)
async function getLocations() {
  const db = getPool();

  const [rows] = await db.execute(
    `
    SELECT
      l.id,
      l.name,
      l.type,
      l.area,
      l.distanceMiles,
      l.wifi,
      l.seating,
      l.sockets,
      l.lat,
      l.lng,
      l.bestTime,
      COALESCE(ROUND(AVG(r.rating), 1), 0) AS quietnessScore,
      COUNT(r.id) AS ratingCount
    FROM locations l
    LEFT JOIN ratings r ON r.location_id = l.id
    GROUP BY l.id
    ORDER BY l.id ASC
    `
  );

  return rows;
}

// Get one location by id (used by details + rate page)
async function getLocationById(id) {
  const db = getPool();

  const [rows] = await db.execute(
    `
    SELECT
      l.id,
      l.name,
      l.type,
      l.area,
      l.distanceMiles,
      l.wifi,
      l.seating,
      l.sockets,
      l.lat,
      l.lng,
      l.bestTime,
      COALESCE(ROUND(AVG(r.rating), 1), 0) AS quietnessScore,
      COUNT(r.id) AS ratingCount
    FROM locations l
    LEFT JOIN ratings r ON r.location_id = l.id
    WHERE l.id = ?
    GROUP BY l.id
    LIMIT 1
    `,
    [id]
  );

  return rows[0] || null;
}

// -------- Ratings --------

async function addRating(locationId, rating, comment, bestTime) {
  const db = getPool();
  const safeComment = typeof comment === "string" ? comment.trim().slice(0, 300) : "";

  // Insert rating
  await db.execute(
    "INSERT INTO ratings (location_id, rating, comment, bestTime) VALUES (?, ?, ?, ?)",
    [locationId, rating, safeComment, bestTime || null]
  );

  // Majority-based bestTime calculation
  await db.execute(
    `
    UPDATE locations l
    JOIN (
      SELECT bestTime
      FROM ratings
      WHERE location_id = ?
      GROUP BY bestTime
      ORDER BY COUNT(*) DESC
      LIMIT 1
    ) r ON 1=1
    SET l.bestTime = r.bestTime
    WHERE l.id = ?
    `,
    [locationId, locationId]
  );

  //  Return updated quietness stats
  const [stats] = await db.execute(
    "SELECT COUNT(*) AS count, COALESCE(ROUND(AVG(rating), 1), 0) AS average FROM ratings WHERE location_id = ?",
    [locationId]
  );

  return {
    saved: { rating, comment: safeComment, bestTime: bestTime || null },
    ratingCount: Number(stats[0].count),
    quietnessScore: Number(stats[0].average)
  };
}


async function getRatings(locationId) {
  const db = getPool();

  const [ratings] = await db.execute(
    "SELECT id, rating, comment, created_at AS createdAt FROM ratings WHERE location_id = ? ORDER BY created_at DESC LIMIT 50",
    [locationId]
  );

  const [stats] = await db.execute(
    "SELECT COUNT(*) AS count, COALESCE(ROUND(AVG(rating), 1), 0) AS average FROM ratings WHERE location_id = ?",
    [locationId]
  );

  return {
    locationId,
    count: Number(stats?.[0]?.count || 0),
    average: Number(stats?.[0]?.average || 0),
    ratings
  };
}

module.exports = { getLocations, getLocationById, addRating, getRatings };
