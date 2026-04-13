/*
  RatingsPanel.jsx
  fetches and displays community ratings for a single location.

  the fallback props (fallbackAverage, fallbackCount) are used while the live
  data is loading — they come from the location doc itself, which is already
  loaded by LocationDetailsPage. this way the summary score never goes blank.

  the sort chips only appear when there are 5+ ratings — less than that and
  sorting doesn't add enough value to be worth the UI clutter.
*/

import { useEffect, useState } from "react";
import { getRatings }          from "../../models/ratingModel";
import "./RatingsPanel.css";


const SORT_OPTIONS = [
  { key: "newest",  label: "Newest"    },
  { key: "oldest",  label: "Oldest"    },
  { key: "highest", label: "Highest ★" },
  { key: "lowest",  label: "Lowest ★"  },
];


// returns a new sorted copy of the ratings array based on the selected sort key
function sortRatings(ratings, sort) {
  const list = [...ratings];
  if (sort === "newest")  return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (sort === "oldest")  return list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  if (sort === "highest") return list.sort((a, b) => b.rating - a.rating);
  if (sort === "lowest")  return list.sort((a, b) => a.rating - b.rating);
  return list;
}


export default function RatingsPanel({ locationId, fallbackAverage = 0, fallbackCount = 0 }) {
  const [data,  setData]  = useState({ average: 0, count: 0, ratings: [] });
  const [error, setError] = useState("");
  const [sort,  setSort]  = useState("newest");

  // fetch live ratings from Firestore whenever the locationId changes.
  // the `alive` flag prevents a stale setState if the component unmounts mid-fetch.
  useEffect(() => {
    let alive = true;
    setError("");

    getRatings(locationId)
      .then(res => { if (alive) setData(res); })
      .catch(e  => { if (alive) setError(e.message); });

    return () => { alive = false; };
  }, [locationId]);


  if (error) return <div className="rp-error">{error}</div>;

  const sorted = sortRatings(data.ratings, sort);

  return (
    <div className="rp-container">
      <div className="rp-title">Ratings</div>

      {/* show live data if we have it, otherwise fall back to the location doc values */}
      <div className="rp-summary">
        <strong>{data.count > 0 ? data.average : fallbackAverage}</strong> / 5{" "}
        <span className="rp-count">
          ({data.count > 0 ? data.count : fallbackCount} ratings)
        </span>
      </div>

      {/* only show sort chips when there's enough data to make sorting meaningful */}
      {data.count >= 5 && (
        <div className="rp-sort">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.key}
              className={`rp-sort-chip ${sort === opt.key ? "rp-sort-chip--active" : ""}`}
              onClick={() => setSort(opt.key)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {data.count === 0 && fallbackCount === 0 ? (
        <div className="rp-empty">No ratings yet. Be the first.</div>
      ) : data.count === 0 && fallbackCount > 0 ? (
        // this happens briefly while the live fetch is in-flight but the location doc
        // already has a count — reassures the user the score is real, just loading
        <div className="rp-empty">
          Ratings from previous contributors are included in the score above.
        </div>
      ) : (
        <ul className="rp-list">
          {sorted.map(r => (
            <li key={r.id} className="rp-item">
              <div className="rp-item-top">
                <span className="rp-stars">
                  {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                </span>
                <span className="rp-date">
                  {new Date(r.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </span>
              </div>
              {r.comment && <div className="rp-comment">"{r.comment}"</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
