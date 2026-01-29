import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { getLocations } from "../api/locationsApi";
import "./styles/MapPage.css";

export default function MapPage() {
  const navigate = useNavigate();

  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search + filters
  const [query, setQuery] = useState("");
  const [wifiOnly, setWifiOnly] = useState(false);
  const [seatingOnly, setSeatingOnly] = useState(false);
  const [quietOnly, setQuietOnly] = useState(false);

  useEffect(() => {
    let alive = true;

    setLoading(true);
    setError("");

    getLocations()
      .then((data) => {
        if (!alive) return;
        setLocations(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!alive) return;
        setError("Failed to load locations");
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return locations.filter((loc) => {
      const name = (loc.name || "").toLowerCase();
      const area = (loc.area || "").toLowerCase();
      const type = (loc.type || "").toLowerCase();

      const matchesText =
        q === "" || name.includes(q) || area.includes(q) || type.includes(q);

      const matchesWifi = !wifiOnly || !!loc.wifi;
      const matchesSeating = !seatingOnly || !!loc.seating;

      const quietness = Number(loc.quietnessScore || 0);
      const matchesQuiet = !quietOnly || quietness >= 4.0;

      const lat = Number(loc.lat);
      const lng = Number(loc.lng);
      const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

      return matchesText && matchesWifi && matchesSeating && matchesQuiet && hasCoords;
    });
  }, [locations, query, wifiOnly, seatingOnly, quietOnly]);

  // Default center: London-ish. If there are results, center on the first.
  const center = useMemo(() => {
    if (filtered.length > 0) {
      return [Number(filtered[0].lat), Number(filtered[0].lng)];
    }
    return [51.5074, -0.1278];
  }, [filtered]);

  if (loading) return <div className="mp-state">Loading map…</div>;
  if (error) return <div className="mp-state">{error}</div>;

  return (
    <div className="mp-page">
      <div className="mp-controls">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search quiet spaces..."
          className="mp-search"
        />

        <div className="mp-filters">
          <label className="mp-filter">
            <input
              type="checkbox"
              checked={wifiOnly}
              onChange={() => setWifiOnly((v) => !v)}
            />
            Wi-Fi
          </label>

          <label className="mp-filter">
            <input
              type="checkbox"
              checked={seatingOnly}
              onChange={() => setSeatingOnly((v) => !v)}
            />
            Seating
          </label>

          <label className="mp-filter">
            <input
              type="checkbox"
              checked={quietOnly}
              onChange={() => setQuietOnly((v) => !v)}
            />
            Quiet
          </label>
        </div>

        <div className="mp-count">Showing {filtered.length} location(s)</div>
      </div>

      <div className="mp-mapLeaflet">
        <MapContainer center={center} zoom={13} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {filtered.map((loc) => (
            <Marker key={loc.id} position={[Number(loc.lat), Number(loc.lng)]}>
              <Popup>
                <div>
                  <div style={{ fontWeight: 700 }}>{loc.name}</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>
                    {loc.area} • {loc.type}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <button type="button" onClick={() => navigate(`/location/${loc.id}`)}>
                      View details
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
