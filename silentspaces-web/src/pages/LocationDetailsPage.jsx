import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import RatingsPanel from "../components/RatingsPanel";
import { getLocationById } from "../api/locationsApi";

export default function LocationDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Location is loaded from the backend (MySQL)
  const [loc, setLoc] = useState(null);
  const [loading, setLoading] = useState(true);

  // favourite set as UI state no login or database yet.
  // Later: store it per user/device.
  const [favourite, setFavourite] = useState(false);

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
    return <div style={{ padding: 16 }}>Loading…</div>;
  }

  // If someone writes down a random ID, don't crash the app.
  if (!loc) {
    return <div style={{ padding: 16 }}>Location not found.</div>;
  }

  return (
    <div style={{ padding: 16, maxWidth: 520, margin: "0 auto" }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: 12 }}>
        ← Back
      </button>

      {/* Location name (was missing) */}
      <h2 style={{ margin: 0 }}>{loc.name}</h2>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          marginTop: 8
        }}
      >
        <div>
          <div style={{ opacity: 0.8, marginTop: 4, fontSize: 13 }}>
            {loc.area} • {loc.type} • {Number(loc.distanceMiles || 0).toFixed(1)} mi
          </div>
        </div>

        <button
          onClick={() => setFavourite((v) => !v)}
          title="Save to favourites"
          style={{
            fontSize: 18,
            borderRadius: 12,
            padding: "8px 12px",
            cursor: "pointer"
          }}
        >
          {favourite ? "♥" : "♡"}
        </button>
      </div>

      <div
        style={{
          marginTop: 16,
          padding: 14,
          border: "1px solid #eee",
          borderRadius: 14
        }}
      >
        <div>
          <b>Quietness:</b> {loc.quietnessScore ?? "-"} ({loc.ratingCount ?? 0} ratings)
        </div>

        <div style={{ marginTop: 10 }}>
          <b>Facilities:</b>
          <div style={{ marginTop: 6 }}>
            Wi-Fi: {loc.wifi ? "Yes" : "No"} <br />
            Seating: {loc.seating ? "Yes" : "No"} <br />
            Sockets: {loc.sockets ? "Yes" : "No"}
          </div>
        </div>

        <div style={{ marginTop: 10 }}>
          <b>Best time to visit:</b> {loc.bestTime}
        </div>
      </div>

      {/*  show stored ratings + average */}
      <RatingsPanel locationId={loc.id} />

      <button
        onClick={() => navigate(`/rate/${loc.id}`)}
        style={{
          marginTop: 16,
          width: "100%",
          padding: 12,
          borderRadius: 14,
          cursor: "pointer"
        }}
      >
        Rate this place
      </button>
    </div>
  );
}
