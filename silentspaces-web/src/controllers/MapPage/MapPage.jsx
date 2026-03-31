import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useLoadScript } from "@react-google-maps/api";
import { getLocations } from "../../models/locationModel";
import { Navigation, Search, Wifi, Armchair, Zap, VolumeX } from "lucide-react";
import "./MapPage.css";
import LoadingScreen from "../../views/LoadingScreen/LoadingScreen";

const LS_PREF_WIFI    = "ss:pref:wifiRequired";
const LS_PREF_SEATING = "ss:pref:seatingRequired";
const LS_PREF_QUIET   = "ss:pref:quietRequired";
const LS_PREF_SOCKETS = "ss:pref:socketsRequired";

const CENTER = { lat: 51.5074, lng: -0.1278 };

// Passed to Map constructor — renderingType can ONLY be set at creation time
const MAP_INIT_OPTIONS = {
  center: CENTER,
  zoom: 12,
  disableDefaultUI: true,
  zoomControl: true,
  clickableIcons: false,
  gestureHandling: "greedy",
  renderingType: "VECTOR",       // WebGL vector tiles — smooth 60fps panning
  isFractionalZoomEnabled: true, // smooth pinch-zoom (no integer snapping)
};

function readBool(key, fallback = false) {
  const raw = localStorage.getItem(key);
  if (raw == null) return fallback;
  return raw === "true";
}

function getMarkerColor(type) {
  const t = String(type || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (t.includes("library"))                       return "#7C3AED";
  if (t.includes("cafe") || t.includes("coffee")) return "#F87171";
  if (t.includes("park") || t.includes("garden")) return "#06B6D4";
  return "#7C3AED";
}

function makeTeardropSvg(color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36"><path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 22 14 22S28 24.5 28 14C28 6.268 21.732 0 14 0z" fill="${color}"/><circle cx="14" cy="14" r="6" fill="white" opacity="0.9"/></svg>`;
}

const USER_DOT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#4285F4" opacity="0.15"><animate attributeName="r" values="6;12;6" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite"/></circle><circle cx="12" cy="12" r="6" fill="#4285F4" stroke="white" stroke-width="2.5"/></svg>`;

export default function MapPage() {
  const navigate = useNavigate();
  const containerRef  = useRef(null); // DOM div for native map (set via callback ref)
  const mapRef        = useRef(null); // google.maps.Map instance
  const iwRef         = useRef(null); // google.maps.InfoWindow instance
  const iwContentRef  = useRef(document.createElement("div")); // portal target
  const markersRef    = useRef([]);
  const iconsRef      = useRef(null);
  const userMarkerRef = useRef(null);
  const fittedRef     = useRef(false);
  const geocodeTimer  = useRef(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const [locations,    setLocations]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [query,        setQuery]        = useState("");
  const [suggestions,  setSuggestions]  = useState([]);
  const [showFilters,  setShowFilters]  = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [selected,     setSelected]     = useState(null);
  const [mapReady,     setMapReady]     = useState(false);

  const [wifiOnly,    setWifiOnly]    = useState(() => readBool(LS_PREF_WIFI,    false));
  const [seatingOnly, setSeatingOnly] = useState(() => readBool(LS_PREF_SEATING, false));
  const [quietOnly,   setQuietOnly]   = useState(() => readBool(LS_PREF_QUIET,   false));
  const [socketsOnly, setSocketsOnly] = useState(() => readBool(LS_PREF_SOCKETS, false));

  // Live user location
  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // Load locations from Firestore
  useEffect(() => {
    let alive = true;
    getLocations()
      .then((data) => { if (alive) setLocations(Array.isArray(data) ? data : []); })
      .catch(() => { if (alive) setError("Failed to load locations"); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  // Search suggestions
  useEffect(() => {
    const q = query.trim();
    if (!q) { setSuggestions([]); return; }

    const localMatches = locations
      .filter((loc) =>
        (loc.name || "").toLowerCase().includes(q.toLowerCase()) ||
        (loc.area || "").toLowerCase().includes(q.toLowerCase())
      )
      .slice(0, 3)
      .map((loc) => ({ ...loc, isArea: false }));

    setSuggestions(localMatches);

    clearTimeout(geocodeTimer.current);
    geocodeTimer.current = setTimeout(() => {
      const token = import.meta.env.VITE_MAPBOX_TOKEN;
      fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?country=gb&types=place,locality,neighborhood,district&access_token=${token}`)
        .then((r) => r.json())
        .then((data) => {
          const areas = (data.features || []).slice(0, 3).map((f) => ({
            id: f.id, name: f.text, area: f.place_name,
            coords: { lat: f.center[1], lng: f.center[0] }, isArea: true,
          }));
          setSuggestions([...localMatches, ...areas]);
        })
        .catch(() => {});
    }, 400);
  }, [query, locations]);

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
      return Number.isFinite(Number(loc.lat)) && Number.isFinite(Number(loc.lng));
    });
  }, [locations, query, wifiOnly, seatingOnly, quietOnly, socketsOnly]);

  // Build icon cache once (3 icons, reused for all markers)
  const buildIcons = useCallback(() => {
    if (iconsRef.current) return iconsRef.current;
    const make = (color) => ({
      url: `data:image/svg+xml,${encodeURIComponent(makeTeardropSvg(color))}`,
      scaledSize: new window.google.maps.Size(18, 24),
      anchor:     new window.google.maps.Point(9, 24),
    });
    iconsRef.current = {
      "#7C3AED": make("#7C3AED"),
      "#F87171": make("#F87171"),
      "#06B6D4": make("#06B6D4"),
    };
    return iconsRef.current;
  }, []);

  // Callback ref — fires the moment the container div mounts in the DOM.
  // By that point isLoaded is guaranteed true (loading screen hides the div otherwise).
  const onContainerMount = useCallback((node) => {
    containerRef.current = node;
    if (!node || mapRef.current) return; // already created or unmounted

    const map = new window.google.maps.Map(node, MAP_INIT_OPTIONS);
    map.addListener("click", () => setSelected(null));
    mapRef.current = map;
    buildIcons();

    // Native InfoWindow — content is a DOM div we portal React JSX into
    const iw = new window.google.maps.InfoWindow({
      content:     iwContentRef.current,
      pixelOffset: new window.google.maps.Size(0, -28),
    });
    iw.addListener("closeclick", () => setSelected(null));
    iwRef.current = iw;

    setMapReady(true);
  }, [buildIcons]); // isLoaded not needed — container only mounts after loading screen clears

  // Show/hide InfoWindow when selected changes
  useEffect(() => {
    if (!iwRef.current || !mapRef.current) return;
    if (selected) {
      iwRef.current.setPosition({ lat: Number(selected.lat), lng: Number(selected.lng) });
      iwRef.current.open(mapRef.current);
    } else {
      iwRef.current.close();
    }
  }, [selected]);

  // Place markers natively — bypasses React reconciliation entirely
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    const icons = buildIcons();
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    filtered.forEach((loc) => {
      const color = getMarkerColor(loc.type);
      const marker = new window.google.maps.Marker({
        position: { lat: Number(loc.lat), lng: Number(loc.lng) },
        map: mapRef.current,
        icon: icons[color],
        title: loc.name,
        optimized: true, // canvas rendering — faster
      });
      marker.addListener("click", () => setSelected(loc));
      markersRef.current.push(marker);
    });

    return () => { markersRef.current.forEach((m) => m.setMap(null)); };
  }, [filtered, mapReady, buildIcons]);

  // User location dot
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    if (userMarkerRef.current) userMarkerRef.current.setMap(null);
    if (!userLocation) return;

    userMarkerRef.current = new window.google.maps.Marker({
      position: userLocation,
      map: mapRef.current,
      icon: {
        url: `data:image/svg+xml,${encodeURIComponent(USER_DOT_SVG)}`,
        scaledSize: new window.google.maps.Size(24, 24),
        anchor:     new window.google.maps.Point(12, 12),
      },
      zIndex: 999,
      optimized: false, // SVG animation requires this
    });
  }, [userLocation, mapReady]);

  // FitBounds once on first load
  useEffect(() => {
    if (fittedRef.current || !mapReady || filtered.length === 0) return;
    const bounds = new window.google.maps.LatLngBounds();
    filtered.forEach((loc) => bounds.extend({ lat: Number(loc.lat), lng: Number(loc.lng) }));
    mapRef.current.fitBounds(bounds, 40);
    fittedRef.current = true;
  }, [filtered, mapReady]);

  const handleSuggestionClick = (item) => {
    setQuery(item.name);
    setSuggestions([]);
    if (item.isArea && mapRef.current) {
      mapRef.current.panTo(item.coords);
      mapRef.current.setZoom(13);
    }
  };

  const handleLocateMe = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.panTo(userLocation);
      mapRef.current.setZoom(16);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (mapRef.current) { mapRef.current.panTo(coords); mapRef.current.setZoom(16); }
      });
    }
  };

  if (loading || !isLoaded) return <LoadingScreen message="Loading the map..." />;
  if (error || loadError)   return <div className="mp-state">{error || "Failed to load Google Maps"}</div>;

  return (
    <div className="mp-page">

      {/* Floating search bar */}
      <div className="mp-header">
        <div className="mp-searchBar">
          <Search size={18} color="#9AA0A6" strokeWidth={2} />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); if (!e.target.value.trim()) setSuggestions([]); }}
            onBlur={() => setTimeout(() => setSuggestions([]), 150)}
            placeholder="Search by name or area..."
            className="mp-searchInput"
          />
          <button className="mp-filterBtn" onClick={() => setShowFilters(!showFilters)}>
            <span className="mp-filterIcon"><span/><span/><span/></span>
          </button>
        </div>

        {suggestions.length > 0 && (
          <div className="mp-suggestions">
            {suggestions.map((item) => (
              <div key={item.id} className="mp-suggestionItem" onMouseDown={() => handleSuggestionClick(item)}>
                <span className="mp-suggestionIcon">{item.isArea ? "🗺️" : "📍"}</span>
                <div className="mp-suggestionText">
                  <strong>{item.name}</strong>
                  <span>{item.area}</span>
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
            <span><span className="mp-legend-dot" style={{ background: "#7C3AED" }}></span>Library</span>
            <span><span className="mp-legend-dot" style={{ background: "#F87171" }}></span>Café</span>
            <span><span className="mp-legend-dot" style={{ background: "#06B6D4" }}></span>Park</span>
          </div>
        </div>

        <button className="mp-locateBtn" onClick={handleLocateMe}>
          <Navigation size={20} />
        </button>

        {/* Native map container — map created when this div mounts via callback ref */}
        <div ref={onContainerMount} style={{ width: "100%", height: "100%" }} />

        {/* Popup content portalled into the native InfoWindow's DOM node */}
        {selected && createPortal(
          <div className="mp-popup">
            <div className="mp-popup-name">{selected.name}</div>
            <div className="mp-popup-meta">{selected.area} · {selected.type}</div>

            {Number(selected.ratingCount || 0) === 0 ? (
              <div className="mp-popup-no-ratings">No ratings yet</div>
            ) : (
              <div className="mp-popup-bars">
                <div className="mp-popup-bar-row">
                  <span className="mp-popup-bar-label">Quietness</span>
                  <div className="mp-popup-bar-track">
                    <div className="mp-popup-bar-fill mp-popup-bar--quiet"
                      style={{ width: `${(Number(selected.quietnessScore) / 5) * 100}%` }} />
                  </div>
                  <span className="mp-popup-bar-val">{selected.quietnessScore}</span>
                </div>
                <div className="mp-popup-bar-row">
                  <span className="mp-popup-bar-label">Busy</span>
                  <div className="mp-popup-bar-track">
                    <div className="mp-popup-bar-fill mp-popup-bar--busy"
                      style={{ width: selected.busynessLevel === "High" ? "100%" : selected.busynessLevel === "Mid" ? "55%" : "25%" }} />
                  </div>
                  <span className="mp-popup-bar-val">{selected.busynessLevel || "Low"}</span>
                </div>
              </div>
            )}

            <div className="mp-popup-facilities">
              {selected.wifi    && <span className="mp-popup-fac"><Wifi size={11} /> Wi-Fi</span>}
              {selected.seating && <span className="mp-popup-fac"><Armchair size={11} /> Seating</span>}
              {selected.sockets && <span className="mp-popup-fac"><Zap size={11} /> Sockets</span>}
            </div>

            <button className="mp-popup-btn" type="button" onClick={() => navigate(`/location/${selected.id}`)}>
              View details
            </button>
          </div>,
          iwContentRef.current
        )}
      </div>
    </div>
  );
}
