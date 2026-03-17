import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { getLocations } from "../api/locationsApi";
import { Navigation } from "lucide-react";
import L from "leaflet";
import "./MapPage.css";

// REFINED: Profile preference keys so Map respects global defaults.
const LS_PREF_WIFI = "ss:pref:wifiRequired";
const LS_PREF_SEATING = "ss:pref:seatingRequired";
const LS_PREF_QUIET = "ss:pref:quietRequired";
const LS_PREF_SOCKETS = "ss:pref:socketsRequired";

function readBool(key, fallback = false) {
  const raw = localStorage.getItem(key);
  if (raw == null) return fallback;
  return raw === "true";
}

function getMarkerColor(type) {
  const t = String(type || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (t.includes("library")) return "#4F46E5";
  if (t.includes("cafe") || t.includes("coffee")) return "#9333EA";
  if (t.includes("park") || t.includes("garden")) return "#16A34A";
  if (t.includes("study space") || t.includes("cowork")) return "#F59E0B";

  return "#3B82F6";
}

function FitBounds({ points }) {
  const map = useMap();

  useEffect(() => {
    // When the visible marker set changes, update the viewport so all points are in view.
    if (!points || points.length === 0) return;

    // Create a bounding box around all marker coordinates.
    const bounds = L.latLngBounds(points);

    // Fit the map to the bounds with padding so markers are not glued to the edges.
    map.fitBounds(bounds, { padding: [30, 30] });
  }, [map, points]);

  // This component controls map behaviour only and does not render UI.
  return null;
}

function LocateMeButton() {
  const map = useMap();

  const handleLocate = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;

      map.setView([latitude, longitude], 15);
    });
  };

  return (
    <button className="mp-locateBtn" onClick={handleLocate}>
      <Navigation size={22} />
    </button>
  );
}

export default function MapPage() {
  const navigate = useNavigate();

  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const [suggestions, setSuggestions] = useState([]);

  const [showFilters, setShowFilters] = useState(false);

  // REFINED: Filters now initialise from Profile preferences.
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

  // Search suggestions for names and areas
  useEffect(() => {
    const q = query.trim().toLowerCase();

    if (!q) {
      setSuggestions([]);
      return;
    }

    const results = locations
      .filter((loc) => {
        const name = (loc.name || "").toLowerCase();
        const area = (loc.area || "").toLowerCase();
        return name.includes(q) || area.includes(q);
      })
      .slice(0, 5);

    setSuggestions(results);
  }, [query, locations]);

  const handleSuggestionClick = (loc) => {
    setQuery(loc.name);
    setSuggestions([]);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return locations.filter((loc) => {
      const name = (loc.name || "").toLowerCase();
      const area = (loc.area || "").toLowerCase();
      const type = (loc.type || "").toLowerCase();
      const matchesText =
        q === "" ||
        name.includes(q) ||
        area.includes(q) ||
        type.includes(q);

      const matchesWifi = !wifiOnly || !!loc.wifi;
      const matchesSeating = !seatingOnly || !!loc.seating;
      const matchesSockets = !socketsOnly || !!loc.sockets;

      const quietness = Number(loc.quietnessScore || 0);
      const matchesQuiet = !quietOnly || quietness >= 4.0;

      const lat = Number(loc.lat);
      const lng = Number(loc.lng);
      const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

      return (
        matchesText &&
        matchesWifi &&
        matchesSeating &&
        matchesSockets &&
        matchesQuiet &&
        hasCoords
      );
    });
  }, [locations, query, wifiOnly, seatingOnly, quietOnly, socketsOnly]);

  // Default center: London-ish. If there are results, center on the first.
  // FitBounds adjusts the viewport once markers exist; this is only the initial fallback.
  const defaultCenter = [51.5074, -0.1278];

  if (loading) return <div className="mp-state">Loading map…</div>;
  if (error) return <div className="mp-state">{error}</div>;

  return (
    <div className="mp-page">
      {/* ---------- Header Controls ---------- */}
      <div className="mp-header">
        <div className="mp-searchBar">
          <span className="mp-searchIcon">🔍</span>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or area..."
            className="mp-searchInput"
          />

          <button
            className="mp-filterBtn"
            onClick={() => setShowFilters(!showFilters)}
          >
            ☰
          </button>
        </div>

        {/* NEW: suggestions dropdown */}
        {suggestions.length > 0 && (
          <div className="mp-suggestions">
            {suggestions.map((loc) => (
              <div
                key={loc.id}
                className="mp-suggestionItem"
                onClick={() => handleSuggestionClick(loc)}
              >
                <strong>{loc.name}</strong>
                <span>{loc.area}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ---------- Filter Menu ---------- */}

      {showFilters && (
        <div className="mp-filterPanel">
          <label>
            <input
              type="checkbox"
              checked={wifiOnly}
              onChange={() => setWifiOnly((v) => !v)}
            />
            Wi-Fi
          </label>

          <label>
            <input
              type="checkbox"
              checked={seatingOnly}
              onChange={() => setSeatingOnly((v) => !v)}
            />
            Seating
          </label>

          <label>
            <input
              type="checkbox"
              checked={quietOnly}
              onChange={() => setQuietOnly((v) => !v)}
            />
            Quiet
          </label>

          <label>
            <input
              type="checkbox"
              checked={socketsOnly}
              onChange={() => setSocketsOnly((v) => !v)}
            />
            Power sockets
          </label>
        </div>
      )}

      {/* ---------- Map Container ---------- */}

      <div className="mp-map">
        <MapContainer
          center={defaultCenter}
          zoom={13}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FitBounds points={filtered.map((l) => [Number(l.lat), Number(l.lng)])} />

          <LocateMeButton />

          {filtered.map((loc) => (
            <Marker
              key={loc.id}
              position={[Number(loc.lat), Number(loc.lng)]}
              icon={L.divIcon({
                className: "custom-marker",
                html: `
                    <div class="mp-markerWrapper">
                      <div class="mp-markerLabel">${loc.type}</div>
                      <div class="mp-markerDot" style="background:${getMarkerColor(String(loc.type))}"></div>
                    </div>
                  `,
                iconSize: [30, 30],
                iconAnchor: [15, 30]
              })}
            >
              <Popup>
                <div>
                  <div style={{ fontWeight: 700 }}>{loc.name}</div>

                  <div style={{ fontSize: 12, opacity: 0.8 }}>
                    {loc.area} • {loc.type}
                  </div>

                  {/* Quietness summary is shown as '-' when no ratings exist */}
                  <div style={{ fontSize: 12, marginTop: 8 }}>
                    <b>Quietness:</b>{" "}
                    {Number(loc.ratingCount || 0) === 0
                      ? "-"
                      : loc.quietnessScore ?? "-"}{" "}
                    ({loc.ratingCount ?? 0})
                  </div>

                  {/* Facility indicators help users decide without leaving the map */}
                  <div style={{ fontSize: 12, opacity: 0.9, marginTop: 6 }}>
                    {loc.wifi ? "Wi-Fi ✅ " : "Wi-Fi ❌ "}
                    {loc.seating ? "Seating ✅ " : "Seating ❌ "}
                    {loc.sockets ? "Sockets ✅" : "Sockets ❌"}
                  </div>

                  {/* Navigate to the details page for full info and ratings */}
                  <div style={{ marginTop: 10 }}>
                    <button
                      type="button"
                      onClick={() => navigate(`/location/${loc.id}`)}
                    >
                      View details
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}