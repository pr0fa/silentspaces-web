/*
  LocationDetailsPage.jsx
  shows everything we know about a single location: quietness score, facilities,
  popular times chart, community ratings, and a "rate this place" button.

  the favourite (heart) state is stored in localStorage keyed by user UID so it
  persists across sessions without needing a Firestore write.
*/

import { useParams, useNavigate }                         from "react-router-dom";
import { useEffect, useState }                            from "react";
import { useAuth }                                        from "../../contexts/AuthContext";
import { getLocationById }                                from "../../models/locationModel";
import RatingsPanel                                       from "../../views/RatingsPanel/RatingsPanel";
import PopularTimes                                       from "../../views/PopularTimes/PopularTimes";
import { Wifi, Armchair, Zap, ChevronLeft }               from "lucide-react";
import LoadingScreen                                      from "../../views/LoadingScreen/LoadingScreen";
import "./LocationDetailsPage.css";


// localStorage helpers — keep the key format in one place so it's easy to change
function favsKey(uid)       { return `ss:favourites:${uid || "guest"}`; }
function readFavourites(uid) {
  try { return JSON.parse(localStorage.getItem(favsKey(uid)) || "[]"); }
  catch { return []; }
}
function writeFavourites(uid, list) {
  localStorage.setItem(favsKey(uid), JSON.stringify(list));
}


export default function LocationDetailsPage() {
  const { id }         = useParams();
  const navigate       = useNavigate();
  const { currentUser } = useAuth();

  const [loc,       setLoc]       = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [favourite, setFavourite] = useState(false);

  // check whether this location is already saved when the ID changes
  useEffect(() => {
    const favs = readFavourites(currentUser?.uid);
    setFavourite(favs.includes(id));
  }, [id, currentUser]);

  // fetch the location doc from Firestore. the `alive` flag prevents a setState
  // call if the user navigates away before the fetch resolves.
  useEffect(() => {
    let alive = true;
    setLoading(true);

    getLocationById(id)
      .then(data  => { if (alive) setLoc(data); })
      .catch(()   => { if (alive) setLoc(null); })
      .finally(() => { if (alive) setLoading(false); });

    return () => { alive = false; };
  }, [id]);


  if (loading) return <LoadingScreen />;

  // if someone lands on a URL with a made-up ID, don't crash — show a graceful message
  if (!loc) return <div className="ldp-state">Location not found.</div>;

  const ratingCount   = Number(loc.ratingCount || 0);
  const distanceText  = `${Number(loc.distanceKm || 0).toFixed(1)} km`;

  // show a dash when there are no ratings yet so we don't imply a score of 0
  const quietnessText = ratingCount === 0 ? "-" : (loc.quietnessScore ?? "-");

  const toggleFavourite = () => {
    const uid     = currentUser?.uid;
    const favs    = readFavourites(uid);
    const updated = favs.includes(id)
      ? favs.filter(x => x !== id)
      : [...favs, id];

    writeFavourites(uid, updated);
    setFavourite(updated.includes(id));
  };


  return (
    <div className="ldp-page">

      <div className="ldp-header">
        <button onClick={() => navigate(-1)} className="ldp-back">
          <ChevronLeft size={28} />
        </button>

        <div className="ldp-header-info">
          <h2 className="ldp-title">{loc.name}</h2>
          <div className="ldp-meta">{loc.area} • {loc.type} • {distanceText}</div>
        </div>

        <button onClick={toggleFavourite} className="ldp-favBtn">
          {favourite ? "♥" : "♡"}
        </button>
      </div>

      <div className="ldp-card">

        <div className="ldp-ratingRow">
          <span className="ldp-ratingLabel">Quietness</span>
          {ratingCount === 0 ? (
            <span className="ldp-ratingEmpty">No ratings yet</span>
          ) : (
            <>
              <span className="ldp-stars">{"⭐".repeat(Math.round(loc.quietnessScore))}</span>
              <span className="ldp-ratingValue">{quietnessText} ({ratingCount} ratings)</span>
            </>
          )}
        </div>

        <div className="ldp-section">
          <b>Facilities:</b>
          <div className="ldp-facilities">
            <span className={`ldp-chip ${loc.wifi    ? "is-available" : "is-missing"}`}><Wifi size={13} /> Wi-Fi</span>
            <span className={`ldp-chip ${loc.seating ? "is-available" : "is-missing"}`}><Armchair size={13} /> Seating</span>
            <span className={`ldp-chip ${loc.sockets ? "is-available" : "is-missing"}`}><Zap size={13} /> Sockets</span>
          </div>
        </div>

        {loc.bestTime && (
          <div className="ldp-section">
            <b>Best time to visit:</b> {loc.bestTime}
          </div>
        )}

      </div>

      {/* the popular times bar chart — renders nothing if dayVisits is all zeros */}
      <PopularTimes dayVisits={loc.dayVisits} />

      <a
        href={`https://www.google.com/maps?q=${loc.lat},${loc.lng}`}
        target="_blank"
        rel="noopener noreferrer"
        className="ldp-mapBtn"
      >
        Open in Google Maps
      </a>

      <div className="ldp-ratingsSection">
        {/* RatingsPanel fetches the full ratings list live from Firestore.
            the fallback props are used for the score summary while it loads. */}
        <RatingsPanel
          locationId={loc.id}
          fallbackAverage={loc.quietnessScore}
          fallbackCount={ratingCount}
        />
      </div>

      <div className="ldp-footer">
        <button onClick={() => navigate(`/rate/${loc.id}`)} className="ldp-rateBtn">
          Rate this place
        </button>
      </div>

    </div>
  );
}
