import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { getLocations } from "../api/locationsApi";
import L from "leaflet";
import "./styles/MapPage.css";

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
export default function MapPage() {
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
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
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return locations.filter((loc) => {
      const name = (loc.name || "").toLowerCase();
      const area = (loc.area || "").toLowerCase();
      const type = (loc.type || "").toLowerCase();
      const matchesText =
        q === "" || name.includes(q) || area.includes(q) || type.includes(q);
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
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search quiet spaces..."
          className="mp-search"
        />
        <div className="mp-filters">
          <label className="mp-chip">
            <input
              type="checkbox"
              checked={wifiOnly}
              onChange={() => setWifiOnly((v) => !v)}
            />
            Wi-Fi
          </label>
          <label className="mp-chip">
            <input
              type="checkbox"
              checked={seatingOnly}
              onChange={() => setSeatingOnly((v) => !v)}
            />
            Seating
          </label>
          <label className="mp-chip">
            <input
              type="checkbox"
              checked={quietOnly}
              onChange={() => setQuietOnly((v) => !v)}
            />
            Quiet
          </label>
          <label className="mp-chip">
            <input
              type="checkbox"
              checked={socketsOnly}
              onChange={() => setSocketsOnly((v) => !v)}
            />
            Sockets
          </label>
        </div>
      </div>
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
          {filtered.map((loc) => (
            <Marker key={loc.id} position={[Number(loc.lat), Number(loc.lng)]}>
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
                      : (loc.quietnessScore ?? "-")} ({loc.ratingCount ?? 0})
                  </div>
                  {/* Facility indicators help users decide without leaving the map */}
                  <div style={{ fontSize: 12, opacity: 0.9, marginTop: 6 }}>
                    {loc.wifi ? "Wi-Fi ✅ " : "Wi-Fi ❌ "}
                    {loc.seating ? "Seating ✅ " : "Seating ❌ "}
                    {loc.sockets ? "Sockets ✅" : "Sockets ❌"}
                  </div>
                  {/* Navigate to the details page for full info and ratings */}
                  <div style={{ marginTop: 10 }}>
                    <button type="button" onClick={() => navigate(`/location/${loc.id}`)}>
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
