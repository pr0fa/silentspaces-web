/*
  MyRatingsPage.jsx
  shows the user's rating history, pulled from localStorage.

  we also fetch all locations from Firestore so we can display the location name
  next to each rating — without that fetch, we'd only have the location ID.

  ratings are sorted newest-first and include a small summary stat block at the top.
*/

import { useEffect, useMemo, useState }                       from "react";
import { useNavigate }                                        from "react-router-dom";
import { useAuth }                                            from "../../contexts/AuthContext";
import { getLocations }                                       from "../../models/locationModel";
import { BookOpen, Coffee, Trees, Monitor, MapPin, Clock, Star, ChevronLeft } from "lucide-react";
import LoadingScreen                                          from "../../views/LoadingScreen/LoadingScreen";
import "./MyRatingsPage.css";


// grab the user's cached ratings from localStorage.
// returns an empty array if nothing's there or the JSON is malformed.
function readRatings(uid) {
  try {
    const raw    = localStorage.getItem(`ss:myRatings:${uid || "guest"}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}


// returns a relevant lucide icon for each location type.
// falls back to a generic map pin if the type doesn't match anything.
function typeIcon(type) {
  const t = (type || "").toLowerCase();
  if (t.includes("library"))                             return <BookOpen size={13} />;
  if (t.includes("cafe") || t.includes("coffee"))       return <Coffee size={13} />;
  if (t.includes("park") || t.includes("garden"))       return <Trees size={13} />;
  if (t.includes("study") || t.includes("cowork"))      return <Monitor size={13} />;
  return <MapPin size={13} />;
}


export default function MyRatingsPage() {
  const navigate       = useNavigate();
  const { currentUser } = useAuth();

  const [allLocations, setAllLocations] = useState([]);
  const [loading,      setLoading]      = useState(true);

  // fetch locations so we can look up names by ID
  useEffect(() => {
    let alive = true;

    getLocations()
      .then(data => { if (alive) setAllLocations(Array.isArray(data) ? data : []); })
      .finally(() => { if (alive) setLoading(false); });

    return () => { alive = false; };
  }, []);


  // read + sort ratings once. we don't put uid in deps because it's stable —
  // the user can't change their account mid-session.
  const allRatings = useMemo(() => {
    return [...readRatings(currentUser?.uid)].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  const average = useMemo(() => {
    if (allRatings.length === 0) return 0;
    const sum = allRatings.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / allRatings.length) * 10) / 10;
  }, [allRatings]);


  const getLocation = (id) => allLocations.find(l => l.id === id) ?? null;


  if (loading) return <LoadingScreen />;

  return (
    <div className="mr-page">

      <div className="mr-header">
        <button className="mr-back" onClick={() => navigate("/profile")}>
          <ChevronLeft size={28} />
        </button>
        <span className="mr-heading">My Ratings</span>
      </div>

      {/* summary stats — only shown when there's something to summarise */}
      {allRatings.length > 0 && (
        <div className="mr-summary">
          <div className="mr-summary-stat">
            <span className="mr-summary-num">{allRatings.length}</span>
            <span className="mr-summary-label">Total</span>
          </div>
          <div className="mr-summary-sep" />
          <div className="mr-summary-stat">
            <span className="mr-summary-num">★ {average}</span>
            <span className="mr-summary-label">Average</span>
          </div>
          <div className="mr-summary-sep" />
          <div className="mr-summary-stat">
            <span className="mr-summary-num">
              {allRatings.filter(r => r.rating >= 4).length}
            </span>
            <span className="mr-summary-label">4★ or above</span>
          </div>
        </div>
      )}

      <p className="mr-count">
        {allRatings.length} rating{allRatings.length !== 1 ? "s" : ""}
      </p>

      {allRatings.length === 0 && (
        <div className="mr-empty">
          <div className="mr-empty-icon"><Star size={32} /></div>
          <div className="mr-empty-text">No ratings yet</div>
          <div className="mr-empty-sub">Rate a location and it will appear here</div>
        </div>
      )}

      <div className="mr-list">
        {allRatings.map((r, index) => {
          const loc  = getLocation(r.locationId);
          const name = loc ? loc.name : "Unknown location";
          const type = loc ? loc.type : "";

          return (
            <div
              key={index}
              className="mr-card"
              onClick={() => navigate(`/location/${r.locationId}`)}
              role="button"
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === "Enter" || e.key === " ") navigate(`/location/${r.locationId}`);
              }}
            >
              <div className="mr-card-top">
                <div>
                  <div className="mr-name">{name}</div>
                  {type && (
                    <span className="mr-type-badge">
                      {typeIcon(type)} {type}
                    </span>
                  )}
                </div>
                <div className="mr-right">
                  <div className="mr-stars">
                    {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                  </div>
                  <span className="mr-chevron">›</span>
                </div>
              </div>

              {r.comment && r.comment.trim() !== "" && (
                <div className="mr-comment">"{r.comment}"</div>
              )}

              <div className="mr-card-bottom">
                {r.bestTime && r.bestTime.trim() !== "" && (
                  <span className="mr-best-time"><Clock size={12} /> {r.bestTime}</span>
                )}
                <span className="mr-date">
                  {new Date(r.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
