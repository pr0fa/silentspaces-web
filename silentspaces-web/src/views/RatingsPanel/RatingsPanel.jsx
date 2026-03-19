import { useEffect, useState } from "react";
import { getRatings } from "../../models/ratingModel";
import "./RatingsPanel.css";

export default function RatingsPanel({ locationId, fallbackAverage = 0, fallbackCount = 0 }) {
  // Holds ratings list + computed stats returned from the API
  const [data, setData] = useState({ average: 0, count: 0, ratings: [] });

  // Stores request failure message for display
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    // Clear any previous error when the location changes
    setError("");

    // Fetch ratings for the current location id
    getRatings(locationId)
      .then((res) => {
        // Prevent state updates if the component unmounts mid-request
        if (alive) setData(res);
      })
      .catch((e) => {
        if (alive) setError(e.message);
      });

    return () => {
      alive = false;
    };
  }, [locationId]);

  // Error state is rendered in-place of the panel
  if (error) return <div className="rp-error">{error}</div>;

  return (
    <div className="rp-container">
      <div className="rp-title">Ratings</div>

      <div className="rp-summary">
        <strong>{data.count > 0 ? data.average : fallbackAverage}</strong> / 5{" "}
        <span className="rp-count">({data.count > 0 ? data.count : fallbackCount} ratings)</span>
      </div>

      {data.count === 0 && fallbackCount === 0 ? (
        <div className="rp-empty">No ratings yet. Be the first.</div>
      ) : data.count === 0 && fallbackCount > 0 ? (
        <div className="rp-empty">Ratings from previous contributors are included in the score above.</div>
      ) : (
        <ul className="rp-list">
          {/* Show up to 5 most recent ratings */}
          {data.ratings.slice(0, 5).map((r) => (
            <li key={r.id} className="rp-item">
              <strong>{r.rating}/5</strong>
              {r.comment ? ` - ${r.comment}` : ""}
              <div className="rp-date">
                {new Date(r.createdAt).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
