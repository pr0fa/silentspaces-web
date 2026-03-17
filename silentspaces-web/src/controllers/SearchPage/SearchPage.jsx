import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLocations } from "../../models/locationModel";
import "./SearchPage.css";

// REFINED: These keys match ProfilePage so preferences auto-apply.
const LS_PREF_WIFI = "ss:pref:wifiRequired";
const LS_PREF_SEATING = "ss:pref:seatingRequired";
const LS_PREF_QUIET = "ss:pref:quietRequired";
const LS_PREF_SOCKETS = "ss:pref:socketsRequired";

function readBool(key, fallback = false) {
  const raw = localStorage.getItem(key);
  if (raw == null) return fallback;
  return raw === "true";
}

export default function SearchPage() {
  const navigate = useNavigate();

  // Data loaded from the backend (MySQL)
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search + filters
  const [query, setQuery] = useState("");

  // REFINED: Preferences now automatically apply when page loads.
  const [wifiOnly, setWifiOnly] = useState(() =>
    readBool(LS_PREF_WIFI, false)
  );

  const [seatingOnly, setSeatingOnly] = useState(() =>
    readBool(LS_PREF_SEATING, false)
  );

  const [quietOnly, setQuietOnly] = useState(() =>
  readBool(LS_PREF_QUIET, false)
  );

  const [socketsOnly, setSocketsOnly] = useState(() =>
  readBool(LS_PREF_SOCKETS, false)
  );
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
      const matchesText =
        q === "" || name.includes(q) || area.includes(q) || type.includes(q);

      // Optional facility filters
      const matchesWifi = !wifiOnly || !!loc.wifi;
      const matchesSeating = !seatingOnly || !!loc.seating;
      const matchesSockets = !socketsOnly || !!loc.sockets;

      // Quietness filter uses a numeric score when available
      const quietness = Number(loc.quietnessScore || 0);
      const matchesQuiet = !quietOnly || quietness >= 4.0;

      return (
        matchesText &&
        matchesWifi &&
        matchesSeating &&
        matchesSockets &&
        matchesQuiet
      );
    });
  }, [locations, query, wifiOnly, seatingOnly, quietOnly, socketsOnly]);

  const goToCard = (locId) => {
    // REFINED: Search always routes to details.
    navigate(`/location/${locId}`);
  };

  if (loading) return <div className="sp-state">Loading locations…</div>;
  if (error) return <div className="sp-state">{error}</div>;

  return (
    <div className="sp-page">
      <h2 className="sp-title">Search</h2>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name, area, or type..."
        className="sp-search"
      />

      <div className="sp-filters">
        <label className="sp-filter">
          <input
            type="checkbox"
            checked={wifiOnly}
            onChange={() => setWifiOnly(!wifiOnly)}
          />
          Wi-Fi
        </label>

        <label className="sp-filter">
          <input
            type="checkbox"
            checked={seatingOnly}
            onChange={() => setSeatingOnly(!seatingOnly)}
          />
          Seating
        </label>

        <label className="sp-filter">
          <input
            type="checkbox"
            checked={quietOnly}
            onChange={() => setQuietOnly(!quietOnly)}
          />
          Quiet
        </label>

        <label className="sp-filter">
          <input
            type="checkbox"
            checked={socketsOnly}
            onChange={() => setSocketsOnly(!socketsOnly)}
          />
          Sockets
        </label>
      </div>

      <p className="sp-count">Showing {filtered.length} location(s)</p>

      <div className="sp-grid">
        {filtered.map((loc) => (
          <div
            key={loc.id}
            onClick={() => goToCard(loc.id)}
            className="sp-card"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                goToCard(loc.id);
              }
            }}
          >
            <div className="sp-cardTitle">{loc.name}</div>

            <div className="sp-cardMeta">
              {loc.area} • {loc.type} •{" "}
              {Number(loc.distanceKm || 0).toFixed(1)} km
            </div>

            <div className="sp-cardQuiet">
              Quietness: <b>{loc.quietnessScore ?? "-"}</b> (
              {loc.ratingCount ?? 0})
            </div>

            <div className="sp-cardFacilities">
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