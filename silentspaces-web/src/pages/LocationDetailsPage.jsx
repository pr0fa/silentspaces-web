import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import RatingsPanel from "../components/RatingsPanel";
import { getLocationById } from "../api/locationsApi";
import "./styles/LocationDetailsPage.css";

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

  // Location is loaded from the backend (MySQL)
  const [loc, setLoc] = useState(null);
  const [loading, setLoading] = useState(true);

  // favourite set as UI state no login or database yet.
  // Later: store it per user/device.
  const [favourite, setFavourite] = useState(false);

  // NEW: Load favourite state when ID changes
  useEffect(() => {
    const favs = readFavourites();
    setFavourite(favs.includes(id)); // checks if THIS location is saved
  }, [id]);

  // Load location when the route id changes
  useEffect(() => {
    let alive = true;

    setLoading(true);

    getLocationById(id)
      .then((data) => {
        if (!alive) return;
        setLoc(data);
      })
      .catch(() => {
        if (!alive) return;
        setLoc(null);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) {
    return <div className="ldp-state">Loading…</div>;
  }

  // If someone writes down a random ID, don't crash the app.
  if (!loc) {
    return <div className="ldp-state">Location not found.</div>;
  }

  const distanceText = `${Number(loc.distanceMiles || 0).toFixed(1)} mi`;
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
      <button onClick={() => navigate(-1)} className="ldp-back">
        ← Back
      </button>

      {/* Location name (was missing) */}
      <div className="ldp-titleRow">
        <h2 className="ldp-title">{loc.name}</h2>

        <span className="ldp-rating">
          ⭐ {quietnessText}
        </span>
      </div>

      <div className="ldp-headerRow">
        <div className="ldp-meta">
          {loc.area} • {loc.type} • {distanceText}
        </div>

        {/* NEW: uses toggleFavourite instead of setFavourite */}
        <button
          onClick={toggleFavourite}
          title="Save to favourites"
          className="ldp-favBtn"
        >
          {favourite ? "♥" : "♡"}
        </button>
      </div>
      
      <div className="ldp-card">
        <div className="ldp-ratingRow">
          <span className="ldp-ratingLabel">Quietness</span>
          <span className="ldp-stars">
            {"⭐".repeat(Math.round(loc.quietnessScore || 0))}
          </span>
          <span className="ldp-ratingValue">
            {quietnessText} ({ratingCount} ratings)
          </span>
        </div>
        <div className="ldp-section">
          <b>Facilities:</b>
        <div className="ldp-facilities">
          <span className={`ldp-chip ${loc.wifi ? "is-available" : "is-missing"}`}>
            {loc.wifi ? "📶 Wi-Fi" : "❌ Wi-Fi"}
          </span>
          <span className={`ldp-chip ${loc.seating ? "is-available" : "is-missing"}`}>
            {loc.seating ? "💺 Seating" : "❌ Seating"}
          </span>
          <span className={`ldp-chip ${loc.sockets ? "is-available" : "is-missing"}`}>
            {loc.sockets ? "🔌 Sockets" : "❌ Sockets"}
          </span>
        </div>
      </div>

        <div className="ldp-section">
          <b>Best time to visit:</b> {loc.bestTime}
        </div>
      </div>

      <div className="ldp-section">
          <a
            href={`https://www.google.com/maps?q=${loc.lat},${loc.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ldp-mapBtn"
          >
            Open in Google Maps
          </a>
        </div>

      {/* show stored ratings + average */}
      <div className="ldp-ratingsSection">
        <RatingsPanel locationId={loc.id} />
      </div>

      <div className="ldp-footer">
        <button
          onClick={() => navigate(`/rate/${loc.id}`)}
          className="ldp-rateBtn"
        >
          Rate this place
        </button>
      </div>
    </div>
  );
}