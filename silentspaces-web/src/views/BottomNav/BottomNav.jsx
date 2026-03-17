import { NavLink, useLocation, useNavigate } from "react-router-dom";
import "./BottomNav.css";

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  
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
          className={({ isActive }) =>`bn-item ${isActive ? "is-active" : ""}`}
        >
            <span className="bn-icon" aria-hidden="true">🔎</span>
            <span className="bn-label">Search</span>
        </NavLink>

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
