import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getLocations } from "../api/locationsApi";
import "./styles/SearchPage.css";

export default function SearchPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  // When Search is opened from the Rate tab, clicking a card should go to /rate/:id
  const rateMode = params.get("mode") === "rate";

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
    // Rate mode routes into the rating flow, normal mode routes into details.
    navigate(rateMode ? `/rate/${locId}` : `/location/${locId}`);
  };

  const exitRateMode = () => {
    // Remove mode=rate but keep the user on Search.
    params.delete("mode");
    setParams(params, { replace: true });
  };

  if (loading) return <div className="sp-state">Loading locations…</div>;
  if (error) return <div className="sp-state">{error}</div>;

  return (
    <div className="sp-page">
      <div className="sp-headerRow">
        <h2 className="sp-title">{rateMode ? "Pick a location to rate" : "Search"}</h2>

        {rateMode && (
          <button type="button" className="sp-exitRate" onClick={exitRateMode}>
            Exit
          </button>
        )}
      </div>

      {rateMode && (
        <div className="sp-rateHint">Select a location to rate.</div>
      )}

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
              {loc.area} • {loc.type} • {Number(loc.distanceMiles || 0).toFixed(1)} mi
            </div>

            <div className="sp-cardQuiet">
              Quietness: <b>{loc.quietnessScore ?? "-"}</b> ({loc.ratingCount ?? 0})
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
