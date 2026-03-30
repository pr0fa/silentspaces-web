import "./PopularTimes.css";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function PopularTimes({ dayVisits }) {
  if (!dayVisits || dayVisits.every((v) => v === 0)) return null;

  const max = Math.max(...dayVisits);
  const peakDay  = dayVisits.indexOf(max);
  const nonZero  = dayVisits.filter((v) => v > 0);
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
          const colour = ratio === 0   ? "#e5e7eb"
                       : ratio < 0.35 ? "#22C55E"
                       : ratio < 0.7  ? "#F59E0B"
                       :                "#EF4444";
          return (
            <div key={day} className="pt-bar-col">
              <div className="pt-bar-wrap">
                <div
                  className="pt-bar"
                  style={{ height: `${Math.max(height, 4)}%`, background: colour }}
                />
              </div>
              <div className={`pt-day ${i === peakDay ? "pt-day--peak" : ""}`}>{day}</div>
            </div>
          );
        })}
      </div>

      <div className="pt-legend">
        <span className="pt-peak-label">🔴 Busiest: {DAYS[peakDay]}</span>
        {quietDay !== peakDay && <span className="pt-quiet-label">🟢 Quietest: {DAYS[quietDay]}</span>}
      </div>
    </div>
  );
}
