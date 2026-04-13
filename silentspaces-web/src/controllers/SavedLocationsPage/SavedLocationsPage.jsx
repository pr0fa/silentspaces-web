/*
  SavedLocationsPage.jsx
  shows the locations the user has bookmarked (their "favourites").

  the list of saved IDs comes from localStorage — no Firestore read needed for that.
  we do fetch all locations from Firestore so we can show full details (name, score,
  facilities) rather than just the raw IDs.
*/

import { useEffect, useState }                                    from "react";
import { useNavigate }                                            from "react-router-dom";
import { useAuth }                                                from "../../contexts/AuthContext";
import { getLocations }                                           from "../../models/locationModel";
import { Wifi, Armchair, Zap, Clock, Bookmark, ChevronLeft }     from "lucide-react";
import LoadingScreen                                              from "../../views/LoadingScreen/LoadingScreen";
import "./SavedLocationsPage.css";


function readFavourites(uid) {
  try {
    const raw    = localStorage.getItem(`ss:favourites:${uid || "guest"}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}


// maps a quietness score to a badge label + CSS class.
// extracted here so the map callback stays clean.
function getBadge(score) {
  if (score >= 4.0) return { label: `Very Quiet ${score}`, cls: "sl-badge sl-badge--very-quiet" };
  if (score >= 2.5) return { label: `Quiet ${score}`,      cls: "sl-badge sl-badge--quiet"      };
  if (score > 0)    return { label: `Moderate ${score}`,   cls: "sl-badge sl-badge--moderate"   };
  return { label: "No ratings", cls: "sl-badge sl-badge--none" };
}


export default function SavedLocationsPage() {
  const navigate       = useNavigate();
  const { currentUser } = useAuth();

  const [saved,   setSaved]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLocations().then(data => {
      const favIds = readFavourites(currentUser?.uid);
      const all    = Array.isArray(data) ? data : [];

      // filter the full list down to only the favourited ones
      setSaved(all.filter(loc => favIds.includes(String(loc.id))));
      setLoading(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  if (loading) return <LoadingScreen />;

  return (
    <div className="sl-page">

      <div className="sl-header">
        <button className="sl-back" onClick={() => navigate("/profile")}>
          <ChevronLeft size={28} />
        </button>
        <span className="sl-heading">Saved Locations</span>
      </div>

      <div className="sl-count">
        <span className="sl-count-num">{saved.length}</span>
        <span className="sl-count-label">saved location{saved.length !== 1 ? "s" : ""}</span>
      </div>

      {saved.length === 0 && (
        <div className="sl-empty">
          <div className="sl-empty-icon"><Bookmark size={32} /></div>
          <div className="sl-empty-text">No saved locations</div>
          <div className="sl-empty-sub">Save a location and it will appear here</div>
        </div>
      )}

      <div className="sl-list">
        {saved.map(loc => {
          const badge = getBadge(Number(loc.quietnessScore || 0));

          return (
            <div
              key={loc.id}
              className="sl-card"
              onClick={() => navigate(`/location/${loc.id}`)}
            >
              <div className="sl-card-top">
                <div>
                  <div className="sl-name">{loc.name}</div>
                  <div className="sl-meta">
                    {loc.area} · {loc.type}
                    {loc.ratingCount > 0 && (
                      <span className="sl-rating-count"> · {loc.ratingCount} ratings</span>
                    )}
                  </div>
                </div>
                <div className="sl-right">
                  <span className={badge.cls}>{badge.label}</span>
                  <span className="sl-chevron">›</span>
                </div>
              </div>

              <div className="sl-facilities">
                {loc.wifi    && <span className="sl-fac"><Wifi size={12} /> Wi-Fi</span>}
                {loc.seating && <span className="sl-fac"><Armchair size={12} /> Seating</span>}
                {loc.sockets && <span className="sl-fac"><Zap size={12} /> Sockets</span>}
              </div>

              <div className="sl-card-bottom">
                {loc.bestTime && (
                  <span className="sl-best-time"><Clock size={12} /> {loc.bestTime}</span>
                )}
                <span className="sl-distance">
                  {Number(loc.distanceKm || 0).toFixed(1)} km away
                </span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
