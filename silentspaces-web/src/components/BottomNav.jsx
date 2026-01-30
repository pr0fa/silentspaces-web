import { NavLink, useLocation, useNavigate } from "react-router-dom";
import "./BottomNav.css";

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const path = location.pathname;
  const isRateModeSearch =
    path === "/search" && new URLSearchParams(location.search).get("mode") === "rate";

  // Rate is considered active both on the rating form and on Search in rate mode.
  const rateActive = path.startsWith("/rate") || isRateModeSearch;

  const goRateMode = () => {
    navigate("/search?mode=rate");
  };

  return (
    <nav className="bn" aria-label="Bottom navigation">
      <div className="bn-inner">
        <NavLink
          to="/map"
          className={({ isActive }) => `bn-item ${isActive ? "is-active" : ""}`}
        >
          <span className="bn-icon" aria-hidden="true">🗺️</span>
          <span className="bn-label">Map</span>
        </NavLink>

        <NavLink
          to="/search"
          className={({ isActive }) =>
            `bn-item ${isActive && !isRateModeSearch ? "is-active" : ""}`
          }
        >
          <span className="bn-icon" aria-hidden="true">🔎</span>
          <span className="bn-label">Search</span>
        </NavLink>

        <button
          type="button"
          onClick={goRateMode}
          className={`bn-item bn-btn ${rateActive ? "is-active" : ""}`}
        >
          <span className="bn-icon" aria-hidden="true">⭐</span>
          <span className="bn-label">Rate</span>
        </button>

        <NavLink
          to="/profile"
          className={({ isActive }) => `bn-item ${isActive ? "is-active" : ""}`}
        >
          <span className="bn-icon" aria-hidden="true">👤</span>
          <span className="bn-label">Profile</span>
        </NavLink>
      </div>
    </nav>
  );
}
