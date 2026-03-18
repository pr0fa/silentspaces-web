import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLocations } from "../../models/locationModel";
import "./SearchPage.css";

const LS_PREF_WIFI    = "ss:pref:wifiRequired";
const LS_PREF_SEATING = "ss:pref:seatingRequired";
const LS_PREF_SOCKETS = "ss:pref:socketsRequired";

function readBool(key, fallback = false) {
  const raw = localStorage.getItem(key);
  if (raw == null) return fallback;
  return raw === "true";
}

export default function SearchPage() {
  const navigate = useNavigate();

  const [locations, setLocations] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  const [query, setQuery]         = useState("");
  const [noiseLevel, setNoiseLevel] = useState("all");

  const [wifiOnly,    setWifiOnly]    = useState(() => readBool(LS_PREF_WIFI,    false));
  const [seatingOnly, setSeatingOnly] = useState(() => readBool(LS_PREF_SEATING, false));
  const [socketsOnly, setSocketsOnly] = useState(() => readBool(LS_PREF_SOCKETS, false));

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    getLocations()
      .then((data) => { if (alive) setLocations(Array.isArray(data) ? data : []); })
      .catch(()    => { if (alive) setError("Failed to load locations"); })
      .finally(()  => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return locations.filter((loc) => {
      const name = (loc.name || "").toLowerCase();
      const area = (loc.area || "").toLowerCase();
      const type = (loc.type || "").toLowerCase();

      const matchesText = q === "" || name.includes(q) || area.includes(q) || type.includes(q);

      const score = Number(loc.quietnessScore || 0);
      let matchesNoise = true;
      if (noiseLevel === "very-quiet") matchesNoise = score >= 4.0;
      if (noiseLevel === "quiet")      matchesNoise = score >= 2.5 && score < 4.0;
      if (noiseLevel === "moderate")   matchesNoise = score > 0 && score < 2.5;

      const matchesWifi    = !wifiOnly    || !!loc.wifi;
      const matchesSeating = !seatingOnly || !!loc.seating;
      const matchesSockets = !socketsOnly || !!loc.sockets;

      return matchesText && matchesNoise && matchesWifi && matchesSeating && matchesSockets;
    });
  }, [locations, query, noiseLevel, wifiOnly, seatingOnly, socketsOnly]);

  if (loading) return <div className="sp-state">Loading locations…</div>;
  if (error)   return <div className="sp-state">{error}</div>;

  return (
    <div className="sp-page">

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name, area, or type..."
        className="sp-search"
      />

      {/* Noise level selector */}
      <p className="sp-section-label">Noise Level</p>
      <div className="sp-chips">
        <button className={`sp-chip ${noiseLevel === "all"        ? "sp-chip--active" : ""}`} onClick={() => setNoiseLevel("all")}>All</button>
        <button className={`sp-chip ${noiseLevel === "very-quiet" ? "sp-chip--active" : ""}`} onClick={() => setNoiseLevel("very-quiet")}>🤫 Very Quiet</button>
        <button className={`sp-chip ${noiseLevel === "quiet"      ? "sp-chip--active" : ""}`} onClick={() => setNoiseLevel("quiet")}>🔉 Quiet</button>
        <button className={`sp-chip ${noiseLevel === "moderate"   ? "sp-chip--active" : ""}`} onClick={() => setNoiseLevel("moderate")}>🔊 Moderate</button>
      </div>

      {/* Facility toggles */}
      <p className="sp-section-label">Facilities</p>
      <div className="sp-chips">
        <button className={`sp-chip ${wifiOnly    ? "sp-chip--active" : ""}`} onClick={() => setWifiOnly(!wifiOnly)}>📶 Wi-Fi</button>
        <button className={`sp-chip ${seatingOnly ? "sp-chip--active" : ""}`} onClick={() => setSeatingOnly(!seatingOnly)}>🪑 Seating</button>
        <button className={`sp-chip ${socketsOnly ? "sp-chip--active" : ""}`} onClick={() => setSocketsOnly(!socketsOnly)}>🔌 Sockets</button>
      </div>

      <p className="sp-count">{filtered.length} location{filtered.length !== 1 ? "s" : ""} found</p>

      <div className="sp-grid">
        {filtered.map((loc) => {
          const score = Number(loc.quietnessScore || 0);
          let badgeLabel = "No ratings";
          let badgeClass = "sp-badge sp-badge--none";
          if (score >= 4.0) { badgeLabel = `🤫 ${score}`; badgeClass = "sp-badge sp-badge--very-quiet"; }
          else if (score >= 2.5) { badgeLabel = `🔉 ${score}`; badgeClass = "sp-badge sp-badge--quiet"; }
          else if (score > 0)    { badgeLabel = `🔊 ${score}`; badgeClass = "sp-badge sp-badge--moderate"; }

          return (
            <div
              key={loc.id}
              onClick={() => navigate(`/location/${loc.id}`)}
              className="sp-card"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") navigate(`/location/${loc.id}`);
              }}
            >
              <div className="sp-card-top">
                <div>
                  <div className="sp-cardTitle">{loc.name}</div>
                  <div className="sp-cardMeta">{loc.area} · {loc.type}</div>
                </div>
                <span className={badgeClass}>{badgeLabel}</span>
              </div>

              <div className="sp-card-bottom">
                <div className="sp-cardFacilities">
                  {loc.wifi    && <span className="sp-fac">📶 Wi-Fi</span>}
                  {loc.seating && <span className="sp-fac">🪑 Seating</span>}
                  {loc.sockets && <span className="sp-fac">🔌 Sockets</span>}
                </div>
                <span className="sp-cardDist">{Number(loc.distanceKm || 0).toFixed(1)} km</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
