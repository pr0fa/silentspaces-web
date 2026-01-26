const fs = require("fs/promises");
const path = require("path");

const FILE_PATH = path.join(__dirname, "data", "locations.mock.json");

// simple queue so writes don't overlap
let writeQueue = Promise.resolve();

async function readLocations() {
  const raw = await fs.readFile(FILE_PATH, "utf-8");
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) throw new Error("JSON must be an array of locations");
  return data;
}

function writeLocations(locations) {
  writeQueue = writeQueue.then(async () => {
    const tmp = `${FILE_PATH}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(locations, null, 2), "utf-8");
    await fs.rename(tmp, FILE_PATH);
  });
  return writeQueue;
}

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function avg(ratings) {
  if (!ratings.length) return 0;
  const sum = ratings.reduce((s, r) => s + Number(r.rating), 0);
  return Math.round((sum / ratings.length) * 10) / 10;
}

module.exports = { readLocations, writeLocations, makeId, avg };
