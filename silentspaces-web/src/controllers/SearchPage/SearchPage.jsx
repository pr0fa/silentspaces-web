import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLocations } from "../../models/locationModel";
import { Wifi, Armchair, Zap, Search } from "lucide-react";
import "./SearchPage.css";
import LoadingScreen from "../../views/LoadingScreen/LoadingScreen";

export default function SearchPage() {
  const navigate   = useNavigate();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [query, setQuery]         = useState("");
  const [noiseLevel, setNoiseLevel] = useState("all");
  const [wifiOnly,    setWifiOnly]    = useState(false);
  const [seatingOnly, setSeatingOnly] = useState(false);
  const [socketsOnly, setSocketsOnly] = useState(false);

  useEffect(() => {
    getLocations().then((data) => {
      setLocations(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    return locations.filter((loc) => {
      const q = query.toLowerCase();
      if (q && !loc.name?.toLowerCase().includes(q) && !loc.area?.toLowerCase().includes(q)) return false;
      if (wifiOnly    && !loc.wifi)    return false;
      if (seatingOnly && !loc.seating) return false;
      if (socketsOnly && !loc.sockets) return false;
      const score = Number(loc.quietnessScore || 0);
      if (noiseLevel === "very-quiet" && score < 4.0)  return false;
      if (noiseLevel === "quiet"      && (score < 2.5 || score >= 4.0)) return false;
      if (noiseLevel === "moderate"   && score >= 2.5) return false;
      return true;
    });
  }, [locations, query, wifiOnly, seatingOnly, socketsOnly, noiseLevel]);


  if (loading) return <LoadingScreen />;

  return (
    <div className="sp-page">

      <div className="sp-search-bar">
        <Search size={16} className="sp-search-icon" />
        <input
          className="sp-input"
          placeholder="Search locations..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="sp-filters">
        <div className="sp-chips">
          <button className={`sp-chip ${noiseLevel === "all"        ? "sp-chip--active" : ""}`} onClick={() => setNoiseLevel("all")}>All</button>
          <button className={`sp-chip ${noiseLevel === "very-quiet" ? "sp-chip--active" : ""}`} onClick={() => setNoiseLevel("very-quiet")}>Very Quiet</button>
          <button className={`sp-chip ${noiseLevel === "quiet"      ? "sp-chip--active" : ""}`} onClick={() => setNoiseLevel("quiet")}>Quiet</button>
          <button className={`sp-chip ${noiseLevel === "moderate"   ? "sp-chip--active" : ""}`} onClick={() => setNoiseLevel("moderate")}>Moderate</button>
        </div>
        <div className="sp-chips">
          <button className={`sp-chip ${wifiOnly    ? "sp-chip--active" : ""}`} onClick={() => setWifiOnly(!wifiOnly)}><Wifi size={14} /> Wi-Fi</button>
          <button className={`sp-chip ${seatingOnly ? "sp-chip--active" : ""}`} onClick={() => setSeatingOnly(!seatingOnly)}><Armchair size={14} /> Seating</button>
          <button className={`sp-chip ${socketsOnly ? "sp-chip--active" : ""}`} onClick={() => setSocketsOnly(!socketsOnly)}><Zap size={14} /> Sockets</button>
        </div>
      </div>

      <p className="sp-count">{filtered.length} location{filtered.length !== 1 ? "s" : ""}</p>

      <div className="sp-list-container">
      <div className="sp-list">
        {filtered.map((loc) => {
          const score = Number(loc.quietnessScore || 0);
          let badgeLabel = "No ratings";
          let badgeClass = "sp-badge sp-badge--none";
          if (score >= 4.0)      { badgeLabel = `Very Quiet ${score}`; badgeClass = "sp-badge sp-badge--very-quiet"; }
          else if (score >= 2.5) { badgeLabel = `Quiet ${score}`;      badgeClass = "sp-badge sp-badge--quiet"; }
          else if (score > 0)    { badgeLabel = `Moderate ${score}`;   badgeClass = "sp-badge sp-badge--moderate"; }


          return (
            <div key={loc.id} className="sp-card" onClick={() => navigate(`/location/${loc.id}`)}>
              <div className="sp-card-top">
                <div>
                  <div className="sp-name">{loc.name}</div>
                  <div className="sp-meta">{loc.area} · {loc.distanceKm} km</div>
                </div>
                <div className="sp-right">
                  <span className={badgeClass}>{badgeLabel}</span>
                  <span className="sp-chevron">›</span>
                </div>
              </div>
              <div className="sp-facilities">
                {loc.wifi    && <span className="sp-fac"><Wifi size={12} /> Wi-Fi</span>}
                {loc.seating && <span className="sp-fac"><Armchair size={12} /> Seating</span>}
                {loc.sockets && <span className="sp-fac"><Zap size={12} /> Sockets</span>}
              </div>
            </div>
          );
        })}
      </div>
      </div>

    </div>
  );
}
