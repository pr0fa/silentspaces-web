import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import RatingsPanel from "../../views/RatingsPanel/RatingsPanel";
import { getLocationById } from "../../models/locationModel";
import { Wifi, Armchair, Zap, ChevronLeft } from "lucide-react";
import "./LocationDetailsPage.css";
import LoadingScreen from "../../views/LoadingScreen/LoadingScreen";

// localStorage key for storing favourite location IDs
const LS_FAVS = "ss:favourites";

/* Read list of favourite IDs (new helper) */
function readFavourites() {
  try {
    return JSON.parse(localStorage.getItem(LS_FAVS) || "[]");
  } catch {
    return [];
  }
}

/* Save updated favourite list (new helper) */
function writeFavourites(list) {
  localStorage.setItem(LS_FAVS, JSON.stringify(list));
}

export default function LocationDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loc, setLoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [favourite, setFavourite] = useState(false);

  // Load favourite state when ID changes
  useEffect(() => {
    const favs = readFavourites();
    setFavourite(favs.includes(id));
  }, [id]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getLocationById(id)
      .then((data) => { if (alive) setLoc(data); })
      .catch(() => { if (alive) setLoc(null); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [id]);

  if (loading) {
    return <LoadingScreen />;
  }

  // If someone writes down a random ID, don't crash the app.
  if (!loc) {
    return <div className="ldp-state">Location not found.</div>;
  }

  const distanceText = `${Number(loc.distanceKm || 0).toFixed(1)} km`;
  const ratingCount = Number(loc.ratingCount || 0);

  // Keep summary output stable even when values are missing.
  const quietnessText =
    ratingCount === 0 ? "-" : (loc.quietnessScore ?? "-");

  /* NEW: toggle favourite and persist to localStorage */
  const toggleFavourite = () => {
    const favs = readFavourites();
    let updated;

    if (favs.includes(id)) {
      updated = favs.filter((x) => x !== id);
    } else {
      updated = [...favs, id];
    }

    writeFavourites(updated);
    setFavourite(updated.includes(id));
  };

  return (
    <div className="ldp-page">

      <div className="ldp-header">
        <button onClick={() => navigate(-1)} className="ldp-back"><ChevronLeft size={28} /></button>
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
            <span className={`ldp-chip ${loc.wifi ? "is-available" : "is-missing"}`}>
              <Wifi size={13} /> Wi-Fi
            </span>
            <span className={`ldp-chip ${loc.seating ? "is-available" : "is-missing"}`}>
              <Armchair size={13} /> Seating
            </span>
            <span className={`ldp-chip ${loc.sockets ? "is-available" : "is-missing"}`}>
              <Zap size={13} /> Sockets
            </span>
          </div>
        </div>

        <div className="ldp-section">
          <b>Best time to visit:</b> {loc.bestTime}
        </div>
      </div>

      <a
        href={`https://www.google.com/maps?q=${loc.lat},${loc.lng}`}
        target="_blank"
        rel="noopener noreferrer"
        className="ldp-mapBtn"
      >
        Open in Google Maps
      </a>

      <div className="ldp-ratingsSection">
        <RatingsPanel locationId={loc.id} fallbackAverage={loc.quietnessScore} fallbackCount={ratingCount} />
      </div>

      <div className="ldp-footer">
        <button onClick={() => navigate(`/rate/${loc.id}`)} className="ldp-rateBtn">
          Rate this place
        </button>
      </div>
    </div>
  );
}