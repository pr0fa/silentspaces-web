import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { getLocations } from "../../models/locationModel";
import { Navigation, Search, ListFilter, Wifi, Armchair, Zap, VolumeX } from "lucide-react";
import L from "leaflet";
import "./MapPage.css";

const LS_PREF_WIFI    = "ss:pref:wifiRequired";
const LS_PREF_SEATING = "ss:pref:seatingRequired";
const LS_PREF_QUIET   = "ss:pref:quietRequired";
const LS_PREF_SOCKETS = "ss:pref:socketsRequired";

function readBool(key, fallback = false) {
  const raw = localStorage.getItem(key);
  if (raw == null) return fallback;
  return raw === "true";
}

function getMarkerColor(type) {
  const t = String(type || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (t.includes("library"))                        return "#5B21B6";
  if (t.includes("cafe") || t.includes("coffee"))  return "#9333EA";
  if (t.includes("park") || t.includes("garden"))  return "#16A34A";
  if (t.includes("study") || t.includes("cowork")) return "#F59E0B";
  return "#7C3AED";
}

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points || points.length === 0) return;
    map.fitBounds(L.latLngBounds(points), { padding: [30, 30] });
  }, [map, points]);
  return null;
}

function LocateMeButton() {
  const map = useMap();
  const handleLocate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      map.setView([pos.coords.latitude, pos.coords.longitude], 15);
    });
  };
  return (
    <button className="mp-locateBtn" onClick={handleLocate}>
      <Navigation size={20} />
    </button>
  );
}

export default function MapPage() {
  const navigate = useNavigate();

  const [locations, setLocations]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [query, setQuery]             = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const [wifiOnly,    setWifiOnly]    = useState(() => readBool(LS_PREF_WIFI,    false));
  const [seatingOnly, setSeatingOnly] = useState(() => readBool(LS_PREF_SEATING, false));
  const [quietOnly,   setQuietOnly]   = useState(() => readBool(LS_PREF_QUIET,   false));
  const [socketsOnly, setSocketsOnly] = useState(() => readBool(LS_PREF_SOCKETS, false));

  useEffect(() => {
    let alive = true;
    getLocations()
      .then((data) => { if (alive) setLocations(Array.isArray(data) ? data : []); })
      .catch(() => { if (alive) setError("Failed to load locations"); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) { setSuggestions([]); return; }
    setSuggestions(
      locations
        .filter((loc) =>
          (loc.name || "").toLowerCase().includes(q) ||
          (loc.area || "").toLowerCase().includes(q)
        )
        .slice(0, 5)
    );
  }, [query, locations]);

  const handleSuggestionClick = (loc) => {
    setQuery(loc.name);
    setSuggestions([]);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return locations.filter((loc) => {
      const matchesText = !q ||
        (loc.name || "").toLowerCase().includes(q) ||
        (loc.area || "").toLowerCase().includes(q) ||
        (loc.type || "").toLowerCase().includes(q);
      if (!matchesText)                return false;
      if (wifiOnly    && !loc.wifi)    return false;
      if (seatingOnly && !loc.seating) return false;
      if (socketsOnly && !loc.sockets) return false;
      if (quietOnly && Number(loc.quietnessScore || 0) < 4.0) return false;
      const lat = Number(loc.lat);
      const lng = Number(loc.lng);
      return Number.isFinite(lat) && Number.isFinite(lng);
    });
  }, [locations, query, wifiOnly, seatingOnly, quietOnly, socketsOnly]);

  if (loading) return <div className="mp-state">Loading map…</div>;
  if (error)   return <div className="mp-state">{error}</div>;

  return (
    <div className="mp-page">

      {/* Search bar */}
      <div className="mp-header">
        <div className="mp-searchBar">
          <Search size={18} color="#9AA0A6" strokeWidth={2} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or area..."
            className="mp-searchInput"
          />
          <button className="mp-filterBtn" onClick={() => setShowFilters(!showFilters)}>
            <span className="mp-filterIcon">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>

        {suggestions.length > 0 && (
          <div className="mp-suggestions">
            {suggestions.map((loc) => (
              <div key={loc.id} className="mp-suggestionItem" onClick={() => handleSuggestionClick(loc)}>
                <strong>{loc.name}</strong>
                <span>{loc.area}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter chips */}
      {showFilters && (
        <div className="mp-filterPanel">
          <button className={`mp-chip ${wifiOnly    ? "mp-chip--active" : ""}`} onClick={() => setWifiOnly(v => !v)}>
            <Wifi size={13} /> Wi-Fi
          </button>
          <button className={`mp-chip ${seatingOnly ? "mp-chip--active" : ""}`} onClick={() => setSeatingOnly(v => !v)}>
            <Armchair size={13} /> Seating
          </button>
          <button className={`mp-chip ${socketsOnly ? "mp-chip--active" : ""}`} onClick={() => setSocketsOnly(v => !v)}>
            <Zap size={13} /> Sockets
          </button>
          <button className={`mp-chip ${quietOnly   ? "mp-chip--active" : ""}`} onClick={() => setQuietOnly(v => !v)}>
            <VolumeX size={13} /> Quiet
          </button>
        </div>
      )}

      {/* Map */}
      <div className="mp-map">
        <MapContainer
          center={[51.5074, -0.1278]}
          zoom={13}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />

          <FitBounds points={filtered.map((l) => [Number(l.lat), Number(l.lng)])} />
          <LocateMeButton />

          {filtered.map((loc) => (
            <Marker
              key={loc.id}
              position={[Number(loc.lat), Number(loc.lng)]}
              icon={L.divIcon({
                className: "custom-marker",
                html: `<div class="mp-markerWrapper"><div class="mp-markerLabel">${loc.type}</div><div class="mp-markerDot" style="background:${getMarkerColor(String(loc.type))}"></div></div>`,
                iconSize: [30, 30],
                iconAnchor: [15, 30],
              })}
            >
              <Popup>
                <div>
                  <div style={{ fontWeight: 700 }}>{loc.name}</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>{loc.area} · {loc.type}</div>
                  <div style={{ fontSize: 12, marginTop: 8 }}>
                    <b>Quietness:</b> {Number(loc.ratingCount || 0) === 0 ? "–" : loc.quietnessScore} ({loc.ratingCount ?? 0} ratings)
                  </div>
                  <div style={{ fontSize: 12, marginTop: 6 }}>
                    {loc.wifi    ? "✓ Wi-Fi  " : "✗ Wi-Fi  "}
                    {loc.seating ? "✓ Seating  " : "✗ Seating  "}
                    {loc.sockets ? "✓ Sockets" : "✗ Sockets"}
                  </div>
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
