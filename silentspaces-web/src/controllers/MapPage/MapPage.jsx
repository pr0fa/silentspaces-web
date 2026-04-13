import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useLoadScript } from "@react-google-maps/api";
import { Navigation, Search, Wifi, Armchair, Zap, VolumeX } from "lucide-react";
import { getLocations } from "../../models/locationModel";
import LoadingScreen from "../../views/LoadingScreen/LoadingScreen";
import { useMapLogic, geocodeAddress, readBool, LS_PREF_WIFI, LS_PREF_SEATING, LS_PREF_QUIET, LS_PREF_SOCKETS } from "./useMapLogic";
import "./MapPage.css";
export default function MapPage() {
  const navigate = useNavigate();
  const { isLoaded, loadError } = useLoadScript({ googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY });
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    getLocations().then(d => alive && setLocations(Array.isArray(d) ? d : [])).catch(() => alive && setError("Failed to load locations")).finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(() => ({ wifi: readBool(LS_PREF_WIFI, false), seating: readBool(LS_PREF_SEATING, false), quiet: readBool(LS_PREF_QUIET, false), sockets: readBool(LS_PREF_SOCKETS, false) }));
  useEffect(() => { [[LS_PREF_WIFI, filters.wifi], [LS_PREF_SEATING, filters.seating], [LS_PREF_QUIET, filters.quiet], [LS_PREF_SOCKETS, filters.sockets]].forEach(([k, v]) => localStorage.setItem(k, String(v))); }, [filters]);
  const toggleFilter = key => setFilters(f => ({ ...f, [key]: !f[key] }));
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return locations.filter(loc => {
      if (!Number.isFinite(Number(loc.lat)) || !Number.isFinite(Number(loc.lng))) return false;
      if (q && !`${loc.name||""} ${loc.area||""} ${loc.type||""}`.toLowerCase().includes(q)) return false;
      if (filters.wifi && !loc.wifi) return false;
      if (filters.seating && !loc.seating) return false;
      if (filters.sockets && !loc.sockets) return false;
      if (filters.quiet && +(loc.quietnessScore || 0) < 4.0) return false;
      return true;
    });
  }, [locations, query, filters]);
  const { onContainerMount, selected, setSelected, handleLocateMe, panTo, iwContentRef } = useMapLogic(filtered);
  const onSuggest = useCallback(item => { setQuery(item.name); if (item.isArea) panTo(item.coords, 13); }, [panTo]);
  if (loading || !isLoaded) return <LoadingScreen message="Loading the map..." />;
  if (error || loadError)   return <div className="mp-state">{error || "Failed to load Google Maps"}</div>;
  return (
    <div className="mp-page">
      <SearchBar query={query} onQueryChange={setQuery} locations={locations} onSuggestionClick={onSuggest} onFilterToggle={() => setShowFilters(v => !v)} />
      {showFilters && <FilterPanel filters={filters} onToggle={toggleFilter} />}
      <div className="mp-map">
        <MapLegend />
        <button className="mp-locateBtn flex-center" onClick={handleLocateMe} aria-label="Locate me"><Navigation size={20} /></button>
        <div ref={onContainerMount} style={{ width: "100%", height: "100%" }} />
        {selected && createPortal(<LocationPopup selected={selected} onViewDetails={() => navigate(`/location/${selected.id}`)} onClose={() => setSelected(null)} />, iwContentRef.current)}
      </div>
    </div>
  );
}

function SearchBar({ query, onQueryChange, locations, onSuggestionClick, onFilterToggle }) {
  const [suggestions, setSuggestions] = useState([]);
  const [panning, setPanning] = useState(false);
  const geocodeTimer = useRef(null), panTimer = useRef(null), justSelected = useRef(false);
  useEffect(() => () => { clearTimeout(geocodeTimer.current); clearTimeout(panTimer.current); }, []);
  useEffect(() => {
    if (justSelected.current) { justSelected.current = false; return; }
    const q = query.trim(); if (!q) return void setSuggestions([]);
    const local = locations.filter(l => `${l.name} ${l.area}`.toLowerCase().includes(q.toLowerCase())).slice(0, 3).map(l => ({ ...l, isArea: false }));
    setSuggestions(local); clearTimeout(geocodeTimer.current);
    geocodeTimer.current = setTimeout(() =>
      geocodeAddress(q, import.meta.env.VITE_MAPBOX_TOKEN)
        .then(d => setSuggestions([...local, ...(d.features||[]).slice(0, 3).map(f => ({ id: f.id, name: f.text, area: f.place_name, coords: { lat: f.center[1], lng: f.center[0] }, isArea: true }))]))
        .catch(() => {}), 400);
    return () => clearTimeout(geocodeTimer.current);
  }, [query, locations]);
  const pick = item => {
    justSelected.current = true; setSuggestions([]);
    if (item.isArea) { setPanning(true); clearTimeout(panTimer.current); panTimer.current = setTimeout(() => setPanning(false), 700); }
    onSuggestionClick(item);
  };
  return (
    <div className="mp-header"><div className="mp-searchBar">
      {panning ? <span className="mp-searchSpinner" /> : <Search size={18} color="#9AA0A6" strokeWidth={2} />}
      <input value={query} onChange={e => { onQueryChange(e.target.value); if (!e.target.value.trim()) setSuggestions([]); }} onBlur={() => setTimeout(() => setSuggestions([]), 150)} placeholder="Search by name or area..." className="mp-searchInput" />
      <button className="mp-filterBtn" onClick={onFilterToggle} aria-label="Toggle filters"><span className="mp-filterIcon"><span /><span /><span /></span></button>
    </div>
    {suggestions.length > 0 && <div className="mp-suggestions">{suggestions.map(s => (
      <div key={s.id} className="mp-suggestionItem" onMouseDown={() => pick(s)}>
        <span className="mp-suggestionIcon">{s.isArea ? "🗺️" : "📍"}</span>
        <div className="mp-suggestionText"><strong>{s.name}</strong><span>{s.area}</span></div>
      </div>
    ))}</div>}
    </div>
  );
}
const CHIPS = [{ key: "wifi", icon: <Wifi size={13} />, label: "Wi-Fi" }, { key: "seating", icon: <Armchair size={13} />, label: "Seating" }, { key: "sockets", icon: <Zap size={13} />, label: "Sockets" }, { key: "quiet", icon: <VolumeX size={13} />, label: "Quiet" }];
function FilterPanel({ filters, onToggle }) {
  return <div className="mp-filterPanel">{CHIPS.map(({ key, icon, label }) => (
    <button key={key} className={`mp-chip${filters[key] ? " mp-chip--active" : ""}`} onClick={() => onToggle(key)}>{icon} {label}</button>
  ))}</div>;
}
const MapLegend = () => <div className="mp-legend mp-card"><div className="mp-legend-section">{[["library", "Library"], ["cafe", "Café"], ["park", "Park"]].map(([t, l]) => <span key={l}><span className={`mp-legend-dot mp-legend-dot--${t}`} />{l}</span>)}</div></div>;
function LocationPopup({ selected: s, onViewDetails }) {
  const busyW = s.busynessLevel === "High" ? "100%" : s.busynessLevel === "Mid" ? "55%" : "25%";
  return (
    <div className="mp-popup mp-card">
      <div className="mp-popup-name">{s.name}</div>
      <div className="mp-popup-meta">{s.area} · {s.type}</div>
      {!Number(s.ratingCount || 0) ? <div className="mp-popup-no-ratings">No ratings yet</div> : (
        <div className="mp-popup-bars">{[["Quietness","mp-popup-bar--quiet",`${(+s.quietnessScore/5)*100}%`,s.quietnessScore],["Busy","mp-popup-bar--busy",busyW,s.busynessLevel||"Low"]].map(([lbl,cls,w,val]) => (
          <div key={lbl} className="mp-popup-bar-row">
            <span className="mp-popup-bar-label">{lbl}</span>
            <div className="mp-popup-bar-track"><div className={`mp-popup-bar-fill ${cls}`} style={{ width: w }} /></div>
            <span className="mp-popup-bar-val">{val}</span>
          </div>
        ))}</div>
      )}
      <div className="mp-popup-facilities">{[["wifi",<Wifi size={11}/>,"Wi-Fi"],["seating",<Armchair size={11}/>,"Seating"],["sockets",<Zap size={11}/>,"Sockets"]].filter(([k])=>s[k]).map(([k,ic,lb])=><span key={k} className="mp-popup-fac">{ic} {lb}</span>)}</div>
      <button className="mp-popup-btn" type="button" onClick={onViewDetails}>View details</button>
    </div>
  );
}
