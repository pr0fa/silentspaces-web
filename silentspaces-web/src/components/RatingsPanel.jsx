import { useEffect, useState } from "react";
import { getRatings } from "../api/ratingsApi";

export default function RatingsPanel({ locationId }) {
  const [data, setData] = useState({ average: 0, count: 0, ratings: [] });
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setError("");

    getRatings(locationId)
      .then((res) => alive && setData(res))
      .catch((e) => alive && setError(e.message));

    return () => {
      alive = false;
    };
  }, [locationId]);

  if (error) return <div style={{ color: "crimson" }}>{error}</div>;

  return (
    <div style={{ marginTop: 18, padding: 14, border: "1px solid #ddd", borderRadius: 12 }}>
      <div style={{ fontWeight: 800, marginBottom: 6 }}>Ratings</div>

      <div style={{ marginBottom: 10 }}>
        <strong>{data.average}</strong> / 5{" "}
        <span style={{ opacity: 0.8 }}>({data.count} ratings)</span>
      </div>

      {data.count === 0 ? (
        <div style={{ opacity: 0.8 }}>No ratings yet. Be the first.</div>
      ) : (
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {data.ratings.slice(0, 5).map((r) => (
            <li key={r.id} style={{ marginBottom: 8 }}>
              <strong>{r.rating}/5</strong>
              {r.comment ? ` - ${r.comment}` : ""}
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                {new Date(r.createdAt).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
