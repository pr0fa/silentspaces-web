import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLocations } from "../api/locationsApi";

const LS_MY_RATINGS = "ss:myRatings";

// small helper to safely read ratings from localStorage
// since there is no authentication, this is device-based only
function readRatings() {
  try {
    const raw = localStorage.getItem(LS_MY_RATINGS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // if something breaks in storage parsing, just return empty
    return [];
  }
}

export default function MyRatingsPage() {
  const navigate = useNavigate();

  const [allLocations, setAllLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  // load all locations so we can map rating.locationId -> actual location name
  // this keeps the ratings page readable instead of just showing ids
  useEffect(() => {
    let alive = true;

    getLocations()
      .then((data) => {
        if (!alive) return;
        setAllLocations(Array.isArray(data) ? data : []);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  // read ratings from localStorage and sort them newest first
  // since we store createdAt, we can order properly
  const myRatings = useMemo(() => {
    const ratings = readRatings();

    return [...ratings].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }, []);

  // helper to get the name of the location from the loaded list
  // if location is missing for some reason, fallback to unknown
  const getLocationName = (id) => {
    const match = allLocations.find((l) => l.id === id);
    return match ? match.name : "Unknown location";
  };

  if (loading) {
    return <div style={{ padding: 16 }}>Loading…</div>;
  }

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>My Ratings</h2>

      {/* if user has not rated anything yet, show simple empty state */}
      {myRatings.length === 0 && (
        <div style={{ opacity: 0.7 }}>
          you haven’t rated any locations yet.
        </div>
      )}

      {/* render each rating as a simple clickable card */}
      {myRatings.map((r, index) => (
        <div
          key={index}
          onClick={() => navigate(`/location/${r.locationId}`)}
          style={{
            border: "1px solid #eee",
            borderRadius: 12,
            padding: 12,
            marginBottom: 12,
            cursor: "pointer"
          }}
        >
          <div style={{ fontWeight: 700 }}>
            {getLocationName(r.locationId)}
          </div>

          <div style={{ marginTop: 6 }}>
            rating: {"★".repeat(r.rating)}
          </div>

          {/* only show comment if user actually wrote something */}
          {r.comment && (
            <div style={{ marginTop: 6, fontSize: 13, opacity: 0.8 }}>
              {r.comment}
            </div>
          )}

          <div style={{ marginTop: 6, fontSize: 12, opacity: 0.6 }}>
            {new Date(r.createdAt).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}