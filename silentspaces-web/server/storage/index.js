const jsonStore = require("./jsonRatingsStore");

function getStore() {
    // Storage backend is selected via env so the rest of the code can stay the same.
  const provider = (process.env.STORAGE_PROVIDER || "json").toLowerCase();
  if (provider === "mysql") {
     // Loaded only when needed to avoid requiring MySQL deps in JSON mode.
    return require("./mysqlRatingsStore");
  }
  return jsonStore;
}

module.exports = { getStore };
