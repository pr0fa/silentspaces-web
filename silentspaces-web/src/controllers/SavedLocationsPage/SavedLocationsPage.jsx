import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLocations } from "../../models/locationModel";
import "./SavedLocationsPage.css";

const LS_FAVS = "ss:favourites";

function readFavourites() {
  try {
    const raw = localStorage.getItem(LS_FAVS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getBadge(score) {
  if (score >= 4.0)  return { label: `🤫 ${score}`, cls: "sl-badge sl-badge--very-quiet" };
  if (score >= 2.5)  return { label: `🔉 ${score}`, cls: "sl-badge sl-badge--quiet" };
  if (score > 0)     return { label: `🔊 ${score}`, cls: "sl-badge sl-badge--moderate" };
  return { label: "No ratings", cls: "sl-badge sl-badge--none" };
}

export default function SavedLocationsPage() {
  const navigate = useNavigate();

  const [saved, setSaved]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLocations().then((data) => {
      const favIds = readFavourites();
      const all = Array.isArray(data) ? data : [];
      setSaved(all.filter((loc) => favIds.includes(String(loc.id))));
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="sl-state">Loading…</div>;

  return (
    <div className="sl-page">

      <div className="sl-header">
        <button className="sl-back" onClick={() => navigate("/profile")}>‹</button>
        <span className="sl-heading">Saved Locations</span>
      </div>

      <div className="sl-count">
        <span className="sl-count-num">{saved.length}</span>
        <span className="sl-count-label">saved location{saved.length !== 1 ? "s" : ""}</span>
      </div>

      {saved.length === 0 && (
        <div className="sl-empty">
          <div className="sl-empty-icon">🔖</div>
          <div className="sl-empty-text">No saved locations</div>
          <div className="sl-empty-sub">Save a location and it will appear here</div>
        </div>
      )}

      <div className="sl-list">
        {saved.map((loc) => {
          const badge = getBadge(Number(loc.quietnessScore || 0));

          return (
            <div key={loc.id} className="sl-card" onClick={() => navigate(`/location/${loc.id}`)}>

              <div className="sl-card-top">
                <div>
                  <div className="sl-name">{loc.name}</div>
                  <div className="sl-meta">
                    {loc.area} · {loc.type}
                    {loc.ratingCount > 0 && <span className="sl-rating-count"> · {loc.ratingCount} ratings</span>}
                  </div>
                </div>
                <div className="sl-right">
                  <span className={badge.cls}>{badge.label}</span>
                  <span className="sl-chevron">›</span>
                </div>
              </div>

              <div className="sl-facilities">
                {loc.wifi    && <span className="sl-fac">📶 Wi-Fi</span>}
                {loc.seating && <span className="sl-fac">🪑 Seating</span>}
                {loc.sockets && <span className="sl-fac">🔌 Sockets</span>}
              </div>

              <div className="sl-card-bottom">
                {loc.bestTime && <span className="sl-best-time">🕐 {loc.bestTime}</span>}
                <span className="sl-distance">{Number(loc.distanceKm || 0).toFixed(1)} km away</span>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
