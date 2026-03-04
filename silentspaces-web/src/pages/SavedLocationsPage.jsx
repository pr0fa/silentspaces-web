import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLocations } from "../api/locationsApi";
import "./styles/SavedLocationsPage.css";

const LS_FAVS = "ss:favourites";

// small helper to safely read favourites from localStorage
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

export default function SavedLocationsPage() {
  const navigate = useNavigate();

  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    getLocations()
      .then((data) => {
        if (!alive) return;
        setLocations(Array.isArray(data) ? data : []);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  // match favourites with full location objects
  const saved = useMemo(() => {
    const favIds = readFavourites();

    return locations.filter((loc) =>
      favIds.includes(String(loc.id))
    );
  }, [locations]);

  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;

  return (
    <div className="sl-page">
      <h2 className="sl-title">Saved Locations</h2>

      {saved.length === 0 && (
        <div className="sl-empty">
          you haven’t saved any locations yet.
        </div>
      )}

      {saved.map((loc) => (
        <div
          key={loc.id}
          className="sl-card"
          onClick={() => navigate(`/location/${loc.id}`)}
        >
          <div className="sl-name">{loc.name}</div>

          <div className="sl-meta">
            {loc.area} • {loc.type}
          </div>

          <div className="sl-facilities">
            {loc.wifi ? "Wi-Fi ✅ " : ""}
            {loc.seating ? "Seating ✅ " : ""}
            {loc.sockets ? "Sockets ✅" : ""}
          </div>
        </div>
      ))}
    </div>
  );
}