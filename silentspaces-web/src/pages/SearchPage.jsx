import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import locations from "../data/locations.mock.json";

export default function SearchPage() {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [wifiOnly, setWifiOnly] = useState(false);
  const [seatingOnly, setSeatingOnly] = useState(false);
  const [socketsOnly, setSocketsOnly] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return locations.filter((loc) => {
      const matchesText =
        q === "" ||
        loc.name.toLowerCase().includes(q) ||
        (loc.area && loc.area.toLowerCase().includes(q)) ||
        loc.type.toLowerCase().includes(q);

      const matchesWifi = !wifiOnly || loc.wifi === true;
      const matchesSeating = !seatingOnly || loc.seating === true;
      const matchesSockets = !socketsOnly || loc.sockets === true;

      return matchesText && matchesWifi && matchesSeating && matchesSockets;
    });
  }, [query, wifiOnly, seatingOnly, socketsOnly]);

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
              {loc.area} • {loc.type} • {loc.distanceKm} km
            </div>
            <div style={{ fontSize: 12, marginTop: 6 }}>
              Quietness: <b>{loc.quietnessScore}</b> ({loc.ratingCount})
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
