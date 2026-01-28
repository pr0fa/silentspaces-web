import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getLocations } from "../api/locationsApi";

export default function SearchPage() {
  const navigate = useNavigate();

  // Data loaded from the backend (MySQL)
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search + filters
  const [query, setQuery] = useState("");
  const [wifiOnly, setWifiOnly] = useState(false);
  const [seatingOnly, setSeatingOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);
  const [socketsOnly, setSocketsOnly] = useState(false);

  // Load locations once when the page mounts
  useEffect(() => {
    let alive = true;

    setLoading(true);
    setError("");

    getLocations()
      .then((data) => {
        if (!alive) return;
        setLocations(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!alive) return;
        setError("Failed to load locations");
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  // Client-side filtering for small datasets
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return locations.filter((loc) => {
      const name = (loc.name || "").toLowerCase();
      const area = (loc.area || "").toLowerCase();
      const type = (loc.type || "").toLowerCase();

      // Text match across common fields
      const matchesText = q === "" || name.includes(q) || area.includes(q) || type.includes(q);

      // Optional facility filters
      const matchesWifi = !wifiOnly || !!loc.wifi;
      const matchesSeating = !seatingOnly || !!loc.seating;
      const matchesSockets = !socketsOnly || !!loc.sockets;

      // Quietness filter uses a numeric score when available
      const quietness = Number(loc.quietnessScore || 0);
      const matchesQuiet = !quietOnly || quietness >= 4.0;

      return matchesText && matchesWifi && matchesSeating && matchesSockets && matchesQuiet;
    });
  }, [locations, query, wifiOnly, seatingOnly, quietOnly, socketsOnly]);

  if (loading) return <div style={{ padding: 16 }}>Loading locations…</div>;
  if (error) return <div style={{ padding: 16 }}>{error}</div>;

  return (
    <div style={{ padding: 16, maxWidth: 520, margin: "0 auto" }}>
      <h2 style={{ marginTop: 0 }}>Search</h2>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name, area, or type..."
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 12,
          border: "1px solid #ddd",
          outline: "none"
        }}
      />

      <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
        <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input type="checkbox" checked={wifiOnly} onChange={() => setWifiOnly(!wifiOnly)} />
          Wi-Fi
        </label>

        <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input type="checkbox" checked={seatingOnly} onChange={() => setSeatingOnly(!seatingOnly)} />
          Seating
        </label>

        <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input type="checkbox" checked={quietOnly} onChange={() => setQuietOnly(!quietOnly)} />
          Quiet
        </label>

        <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input type="checkbox" checked={socketsOnly} onChange={() => setSocketsOnly(!socketsOnly)} />
          Sockets
        </label>
      </div>

      <p style={{ marginTop: 12, fontSize: 13, opacity: 0.8 }}>
        Showing {filtered.length} location(s)
      </p>

      <div style={{ display: "grid", gap: 12 }}>
        {filtered.map((loc) => (
          <div
            key={loc.id}
            onClick={() => navigate(`/location/${loc.id}`)}
            style={{
              padding: 14,
              border: "1px solid #eee",
              borderRadius: 14,
              cursor: "pointer"
            }}
          >
            <div style={{ fontWeight: 800 }}>{loc.name}</div>

            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
              {loc.area} • {loc.type} • {Number(loc.distanceMiles || 0).toFixed(1)} mi
            </div>

            <div style={{ fontSize: 12, marginTop: 6 }}>
              Quietness: <b>{loc.quietnessScore ?? "-"}</b> ({loc.ratingCount ?? 0})
            </div>

            <div style={{ fontSize: 12, opacity: 0.9, marginTop: 6 }}>
              {loc.wifi ? "Wi-Fi ✅ " : "Wi-Fi ❌ "}
              {loc.seating ? "Seating ✅ " : "Seating ❌ "}
              {loc.sockets ? "Sockets ✅" : "Sockets ❌"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
