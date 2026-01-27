// server/storage/mysqlRatingsStore.js
// MySQL ratings store (XAMPP). Exposes simple functions: addRating, getRatings.
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

async function addRating(locationId, rating, comment) {
  const db = getPool();
  const safeComment = typeof comment === "string" ? comment.trim().slice(0, 300) : "";

  // Insert rating (created_at handled by DB default)
  await db.execute(
    "INSERT INTO ratings (location_id, rating, comment) VALUES (?, ?, ?)",
    [locationId, rating, safeComment]
  );

  // Return updated stats
  const [stats] = await db.execute(
    "SELECT COUNT(*) AS count, ROUND(AVG(rating), 1) AS average FROM ratings WHERE location_id = ?",
    [locationId]
  );

  const count = Number(stats?.[0]?.count || 0);
  const average = Number(stats?.[0]?.average || 0);

  return {
    saved: { rating, comment: safeComment },
    ratingCount: count,
    quietnessScore: average
  };
}

async function getRatings(locationId) {
  const db = getPool();

  const [ratings] = await db.execute(
    "SELECT id, rating, comment, created_at AS createdAt FROM ratings WHERE location_id = ? ORDER BY created_at DESC LIMIT 50",
    [locationId]
  );

  const [stats] = await db.execute(
    "SELECT COUNT(*) AS count, ROUND(AVG(rating), 1) AS average FROM ratings WHERE location_id = ?",
    [locationId]
  );

  return {
    locationId,
    count: Number(stats?.[0]?.count || 0),
    average: Number(stats?.[0]?.average || 0),
    ratings
  };
}

module.exports = { addRating, getRatings };
