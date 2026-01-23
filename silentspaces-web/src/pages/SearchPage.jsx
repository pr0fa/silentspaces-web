import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

// Sprint 1 : Local JSON so I can build the UI without backend
import locations from "../data/locations.mock.json";

export default function SearchPage() {
  const navigate = useNavigate();

  // Keeping it simple, search text + 3 basic filters that matter for study environments.
  const [query, setQuery] = useState("");
  const [wifiOnly, setWifiOnly] = useState(false);
  const [seatingOnly, setSeatingOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false); //  add: quiet feature
  const [socketsOnly, setSocketsOnly] = useState(false);


  /* 
  Filter results whenever the user changes search text or turns on a filter.
  useMemo is here so we do not re-filter on every re-render for no reason.
  Later: this can become server-side filtering once I set up an API
  */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return locations.filter((loc) => {
      // basic text search across name/type/area.
      const matchesText =
        q === "" ||
        loc.name.toLowerCase().includes(q) ||
        (loc.area && loc.area.toLowerCase().includes(q)) ||
        loc.type.toLowerCase().includes(q);

        

      
      // Filters are optional. If a checkbox is OFF, results don't get blocked.
      const matchesWifi = !wifiOnly || loc.wifi === true;
      const matchesSeating = !seatingOnly || loc.seating === true;
      const matchesQuiet = !quietOnly || loc.quietnessScore >= 4.0; // added: treat 4.0+ as "quiet enough" can change later on.
      const matchesSockets = !socketsOnly || loc.sockets === true;

      return matchesText && matchesWifi && matchesSeating && matchesSockets && matchesQuiet;
    });
  }, [query, wifiOnly, seatingOnly,quietOnly, socketsOnly]);

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

      {/* filter: quick toggles for the stuff users actually care about  */}
        
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

      {/*Feedback so users know filtering actually worked*/}

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
