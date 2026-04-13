/*
  PopularTimes.jsx
  a bar chart showing which days of the week this location gets the most visits,
  based on when users have submitted ratings.

  renders nothing if dayVisits is all zeros — no point showing an empty chart.
  the colour coding mirrors what you'd expect: green = quiet, amber = moderate, red = busy.
*/

import "./PopularTimes.css";


const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];


export default function PopularTimes({ dayVisits }) {
  // bail out early if there's no data — the location details page won't show this section at all
  if (!dayVisits || dayVisits.every(v => v === 0)) return null;

  const max     = Math.max(...dayVisits);
  const peakDay = dayVisits.indexOf(max);

  // find the quietest day (lowest non-zero count)
  const nonZero  = dayVisits.filter(v => v > 0);
  const minVal   = Math.min(...nonZero);
  const quietDay = dayVisits.indexOf(minVal);

  return (
    <div className="pt-container">
      <div className="pt-title">Popular Times</div>
      <div className="pt-subtitle">Based on visitor ratings</div>

      <div className="pt-chart">
        {DAYS.map((day, i) => {
          const height = max > 0 ? Math.round((dayVisits[i] / max) * 100) : 0;
          const ratio  = max > 0 ? dayVisits[i] / max : 0;

          // colour the bar based on how busy this day is relative to the peak
          const colour =
            ratio === 0  ? "#e5e7eb"  // no data — grey
            : ratio < 0.35 ? "#22C55E"  // quiet — green
            : ratio < 0.7  ? "#F59E0B"  // moderate — amber
            :                "#EF4444"; // busy — red

          return (
            <div key={day} className="pt-bar-col">
              <div className="pt-bar-wrap">
                <div
                  className="pt-bar"
                  style={{
                    height:     `${Math.max(height, 4)}%`, // min 4% so the bar is always visible
                    background: colour,
                  }}
                />
              </div>
              <div className={`pt-day ${i === peakDay ? "pt-day--peak" : ""}`}>
                {day}
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-legend">
        <span className="pt-peak-label">🔴 Busiest: {DAYS[peakDay]}</span>
        {quietDay !== peakDay && (
          <span className="pt-quiet-label">🟢 Quietest: {DAYS[quietDay]}</span>
        )}
      </div>
    </div>
  );
}
