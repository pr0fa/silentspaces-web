import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import { getLocations } from "../../models/locationModel";
import { Navigation, Search, ListFilter, Wifi, Armchair, Zap, VolumeX } from "lucide-react";
import L from "leaflet";
import "./MapPage.css";
import LoadingScreen from "../../views/LoadingScreen/LoadingScreen";

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
  if (t.includes("library"))                        return "#6366F1";
  if (t.includes("cafe") || t.includes("coffee"))  return "#14B8A6";
  if (t.includes("park") || t.includes("garden"))  return "#38BDF8";
  return "#6366F1";
}

function getQuietnessColour(score) {
  const s = Number(score || 0);
  if (s >= 4.0) return "#22C55E";
  if (s >= 2.5) return "#F59E0B";
  if (s > 0)    return "#EF4444";
  return "#D1D5DB";
}

function FitBounds({ points }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (fitted.current || !points || points.length === 0) return;
    map.fitBounds(L.latLngBounds(points), { padding: [30, 30] });
    fitted.current = true;
  }, [map, points]);
  return null;
}

function PanTo({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.setView(coords, 14);
  }, [coords, map]);
  return null;
}

function ZoomWatcher({ onZoom }) {
  useMapEvents({ zoomend: (e) => onZoom(e.target.getZoom()) });
  return null;
}

function LocateMeButton({ userLocation }) {
  const map = useMap();

  const handleLocate = () => {
    if (userLocation) {
      map.setView(userLocation, 16);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        map.setView([pos.coords.latitude, pos.coords.longitude], 16);
      });
    }
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
  const [userLocation, setUserLocation] = useState(null);
  const [panCoords, setPanCoords] = useState(null);
  const [zoom, setZoom] = useState(13);
  const geocodeTimer = useRef(null);

  const [wifiOnly,    setWifiOnly]    = useState(() => readBool(LS_PREF_WIFI,    false));
  const [seatingOnly, setSeatingOnly] = useState(() => readBool(LS_PREF_SEATING, false));
  const [quietOnly,   setQuietOnly]   = useState(() => readBool(LS_PREF_QUIET,   false));
  const [socketsOnly, setSocketsOnly] = useState(() => readBool(LS_PREF_SOCKETS, false));

  // Live location tracking
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      () => {}
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    let alive = true;
    getLocations()
      .then((data) => { if (alive) setLocations(Array.isArray(data) ? data : []); })
      .catch(() => { if (alive) setError("Failed to load locations"); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q) { setSuggestions([]); return; }

    // Local location matches
    const localMatches = locations
      .filter((loc) =>
        (loc.name || "").toLowerCase().includes(q.toLowerCase()) ||
        (loc.area || "").toLowerCase().includes(q.toLowerCase())
      )
      .slice(0, 3)
      .map((loc) => ({ ...loc, isArea: false }));

    setSuggestions(localMatches);

    // Debounce geocoding so we don't call on every keystroke
    clearTimeout(geocodeTimer.current);
    geocodeTimer.current = setTimeout(() => {
      const token = import.meta.env.VITE_MAPBOX_TOKEN;
      fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?country=gb&types=place,locality,neighborhood,district&access_token=${token}`
      )
        .then((r) => r.json())
        .then((data) => {
          const areas = (data.features || []).slice(0, 3).map((f) => ({
            id: f.id,
            name: f.text,
            area: f.place_name,
            coords: [f.center[1], f.center[0]],
            isArea: true,
          }));
          setSuggestions([...localMatches, ...areas]);
        })
        .catch(() => {});
    }, 400);
  }, [query, locations]);

  const handleSuggestionClick = (item) => {
    if (item.isArea) {
      setQuery(item.name);
      setPanCoords(item.coords);
      setSuggestions([]);
    } else {
      setQuery(item.name);
      setSuggestions([]);
    }
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

  if (loading) return <LoadingScreen message="Loading the map..." />;
  if (error)   return <div className="mp-state">{error}</div>;

  return (
    <div className="mp-page">

      {/* Search bar */}
      <div className="mp-header">
        <div className="mp-searchBar">
          <Search size={18} color="#9AA0A6" strokeWidth={2} />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!e.target.value.trim()) setSuggestions([]);
            }}
            onBlur={() => setTimeout(() => setSuggestions([]), 150)}
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
            {suggestions.map((item) => (
              <div key={item.id} className="mp-suggestionItem" onClick={() => handleSuggestionClick(item)}>
                <span className="mp-suggestionIcon">{item.isArea ? "🗺️" : "📍"}</span>
                <div className="mp-suggestionText">
                  <strong>{item.name}</strong>
                  <span>{item.isArea ? item.area : item.area}</span>
                </div>
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
        <div className="mp-legend">
          <div className="mp-legend-section">
            <span><span className="mp-legend-dot" style={{ background: "#6366F1" }}></span>Library</span>
            <span><span className="mp-legend-dot" style={{ background: "#14B8A6" }}></span>Café</span>
            <span><span className="mp-legend-dot" style={{ background: "#38BDF8" }}></span>Park</span>
          </div>
        </div>
        <MapContainer
          center={[51.5074, -0.1278]}
          zoom={13}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='© <a href="https://www.mapbox.com/">Mapbox</a>'
            url={`https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/{z}/{x}/{y}?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`}
            tileSize={512}
            zoomOffset={-1}
          />

          <FitBounds points={filtered.map((l) => [Number(l.lat), Number(l.lng)])} />
          <PanTo coords={panCoords} />
          <ZoomWatcher onZoom={setZoom} />
          <LocateMeButton userLocation={userLocation} />

          {userLocation && (
            <Marker
              position={userLocation}
              icon={L.divIcon({
                className: "",
                html: `<div class="mp-userDot"><div class="mp-userPulse"></div></div>`,
                iconSize: [16, 16],
                iconAnchor: [8, 8],
              })}
            />
          )}

          {filtered.map((loc) => (
            <Marker
              key={loc.id}
              position={[Number(loc.lat), Number(loc.lng)]}
              icon={L.divIcon({
                className: "custom-marker",
                html: zoom >= 15
                  ? `<div class="mp-pin-wrapper"><span class="mp-pin-label">${loc.name}</span><div class="mp-pin" style="background:${getMarkerColor(String(loc.type))}"><div class="mp-pin-inner"></div></div></div>`
                  : `<div class="mp-pin" style="background:${getMarkerColor(String(loc.type))}"><div class="mp-pin-inner"></div></div>`,
                iconSize: zoom >= 15 ? [120, 40] : [16, 22],
                iconAnchor: zoom >= 15 ? [60, 40] : [8, 22],
              })}
            >
              <Popup>
                <div className="mp-popup">
                  <div className="mp-popup-name">{loc.name}</div>
                  <div className="mp-popup-meta">{loc.area} · {loc.type}</div>
                  <div className="mp-popup-quietness">
                    {Number(loc.ratingCount || 0) === 0
                      ? "No ratings yet"
                      : `⭐ ${loc.quietnessScore} (${loc.ratingCount} ratings)`}
                  </div>
                  <div className="mp-popup-facilities">
                    {loc.wifi    && <span>📶 Wi-Fi</span>}
                    {loc.seating && <span>🪑 Seating</span>}
                    {loc.sockets && <span>🔌 Sockets</span>}
                  </div>
                  <button className="mp-popup-btn" type="button" onClick={() => navigate(`/location/${loc.id}`)}>
                    View details
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

    </div>
  );
}
