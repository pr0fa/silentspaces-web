import { useEffect, useState } from "react";
import { getRatings } from "../../models/ratingModel";
import "./PopularTimes.css";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function PopularTimes({ locationId }) {
  const [counts, setCounts] = useState(Array(7).fill(0));
  const [peakDay, setPeakDay] = useState(null);
  const [quietDay, setQuietDay] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    getRatings(locationId).then(({ ratings }) => {
      if (!alive) return;

      const tally = Array(7).fill(0);
      ratings.forEach((r) => {
        const day = new Date(r.createdAt).getDay();
        tally[day]++;
      });

      const max = Math.max(...tally);
      const min = Math.min(...tally.filter((v) => v > 0));
      setPeakDay(max > 0 ? tally.indexOf(max) : null);
      setQuietDay(min > 0 ? tally.indexOf(min) : null);
      setCounts(tally);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [locationId]);

  if (loading) return null;

  const total = counts.reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  const max = Math.max(...counts);

  return (
    <div className="pt-container">
      <div className="pt-title">Popular Times</div>
      <div className="pt-subtitle">Based on visitor ratings</div>

      <div className="pt-chart">
        {DAYS.map((day, i) => {
          const height = max > 0 ? Math.round((counts[i] / max) * 100) : 0;
          const isPeak  = i === peakDay;
          const isQuiet = i === quietDay && counts[i] > 0;
          return (
            <div key={day} className="pt-bar-col">
              <div className="pt-bar-wrap">
                <div
                  className={`pt-bar ${isPeak ? "pt-bar--peak" : isQuiet ? "pt-bar--quiet" : ""}`}
                  style={{ height: `${Math.max(height, 4)}%` }}
                />
              </div>
              <div className={`pt-day ${isPeak ? "pt-day--peak" : ""}`}>{day}</div>
            </div>
          );
        })}
      </div>

      <div className="pt-legend">
        {peakDay !== null && <span className="pt-peak-label">🔴 Busiest: {DAYS[peakDay]}</span>}
        {quietDay !== null && quietDay !== peakDay && <span className="pt-quiet-label">🟢 Quietest: {DAYS[quietDay]}</span>}
      </div>
    </div>
  );
}
