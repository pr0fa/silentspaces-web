// src/pages/SeedPage.jsx
// One-time utility page to seed the Firestore "locations" collection
// from the local mock JSON file.

import { useState } from "react";
import { db } from "../../config/firebase";
import { doc, setDoc, collection, getDocs } from "firebase/firestore";
import locations from "../../data/locations.mock.json";

export default function SeedPage() {
  const [status, setStatus] = useState("idle"); // idle | seeding | done | error
  const [message, setMessage] = useState("");

  async function handleSeed() {
    setStatus("seeding");
    setMessage("");

    try {
      // Check if the collection already has documents — avoid double-seeding
      const existing = await getDocs(collection(db, "locations"));
      if (!existing.empty) {
        setStatus("done");
        setMessage(`Already seeded — ${existing.size} locations found in Firestore. Nothing was changed.`);
        return;
      }

      // Write each location as its own document, stripping the local "ratings" array
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

  const btnLabel =
    status === "seeding" ? "Seeding…" : status === "done" ? "Done ✓" : "Seed Database";

  return (
    <div style={{ padding: 32, maxWidth: 500, margin: "0 auto", fontFamily: "sans-serif" }}>
      <h2 style={{ marginBottom: 8 }}>🔥 Seed Firestore</h2>
      <p style={{ color: "#555", marginBottom: 24 }}>
        Loads the <strong>{locations.length} mock locations</strong> into your Firebase
        Firestore database. Run this <strong>once only</strong> — it will not overwrite
        data if the collection already exists.
      </p>

      <button
        onClick={handleSeed}
        disabled={status === "seeding" || status === "done"}
        style={{
          padding: "12px 24px",
          backgroundColor:
            status === "done" ? "#4caf50" : status === "error" ? "#f44336" : "#1a73e8",
          color: "white",
          border: "none",
          borderRadius: 8,
          cursor: status === "seeding" || status === "done" ? "not-allowed" : "pointer",
          fontSize: 16,
          fontWeight: 600,
        }}
      >
        {btnLabel}
      </button>

      {message && (
        <p
          style={{
            marginTop: 20,
            padding: 14,
            background: "#f5f5f5",
            borderRadius: 8,
            lineHeight: 1.5,
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}
