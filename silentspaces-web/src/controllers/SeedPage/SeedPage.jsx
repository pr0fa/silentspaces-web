// src/pages/SeedPage.jsx
// One-time utility page to seed the Firestore "locations" collection
// from the local mock JSON file.

import { useState } from "react";
import { db } from "../../config/firebase";
import { doc, setDoc, deleteDoc, collection, getDocs } from "firebase/firestore";
import locations from "../../data/locations.mock.json";

export default function SeedPage() {
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  async function handleSeed(force = false) {
    setStatus("seeding");
    setMessage("");

    try {
      const existing = await getDocs(collection(db, "locations"));

      if (!existing.empty && !force) {
        setStatus("done");
        setMessage(`Already seeded — ${existing.size} locations found. Use Force Re-seed to overwrite.`);
        return;
      }

      // Delete existing documents if force re-seeding
      if (force && !existing.empty) {
        setMessage(`Clearing ${existing.size} existing locations...`);
        for (const d of existing.docs) {
          await deleteDoc(doc(db, "locations", d.id));
        }
      }

      // Write each location
      for (const { id, ratings: _ratings, ...fields } of locations) {
        await setDoc(doc(db, "locations", id), fields);
      }

      setStatus("done");
      setMessage(`✅ Seeded ${locations.length} locations into Firestore successfully!`);
    } catch (e) {
      setStatus("error");
      setMessage(`❌ Error: ${e.message}`);
    }
  }

  return (
    <div style={{ padding: 32, maxWidth: 500, margin: "0 auto", fontFamily: "sans-serif" }}>
      <h2 style={{ marginBottom: 8 }}>🔥 Seed Firestore</h2>
      <p style={{ color: "#555", marginBottom: 24 }}>
        Loads <strong>{locations.length} locations</strong> into Firestore.
        Use <strong>Force Re-seed</strong> to clear and replace existing data.
      </p>

      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={() => handleSeed(false)}
          disabled={status === "seeding"}
          style={{
            padding: "12px 24px",
            backgroundColor: status === "done" ? "#4caf50" : "#1a73e8",
            color: "white", border: "none", borderRadius: 8,
            cursor: status === "seeding" ? "not-allowed" : "pointer",
            fontSize: 15, fontWeight: 600,
          }}
        >
          {status === "seeding" ? "Seeding…" : "Seed Database"}
        </button>

        <button
          onClick={() => handleSeed(true)}
          disabled={status === "seeding"}
          style={{
            padding: "12px 24px",
            backgroundColor: "#f44336",
            color: "white", border: "none", borderRadius: 8,
            cursor: status === "seeding" ? "not-allowed" : "pointer",
            fontSize: 15, fontWeight: 600,
          }}
        >
          Force Re-seed
        </button>
      </div>

      {message && (
        <p style={{ marginTop: 20, padding: 14, background: "#f5f5f5", borderRadius: 8, lineHeight: 1.5 }}>
          {message}
        </p>
      )}
    </div>
  );
}
