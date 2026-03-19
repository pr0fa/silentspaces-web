import { NavLink } from "react-router-dom";
import { Map, Search, User } from "lucide-react";
import "./BottomNav.css";

export default function BottomNav() {
  return (
    <nav className="bn" aria-label="Bottom navigation">
      <div className="bn-inner">
        <NavLink to="/map" className={({ isActive }) => `bn-item ${isActive ? "is-active" : ""}`}>
          <Map size={22} />
          <span className="bn-label">Map</span>
        </NavLink>

        <NavLink to="/search" className={({ isActive }) => `bn-item ${isActive ? "is-active" : ""}`}>
          <Search size={22} />
          <span className="bn-label">Search</span>
        </NavLink>

        <NavLink to="/profile" className={({ isActive }) => `bn-item ${isActive ? "is-active" : ""}`}>
          <User size={22} />
          <span className="bn-label">Profile</span>
        </NavLink>
      </div>
    </nav>
  );
}
