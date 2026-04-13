/*
  BottomNav.jsx
  the main navigation component. on mobile it sits as a bottom tab bar.
  on desktop it becomes a left sidebar (CSS handles the layout switch).

  the admin tab only shows up for the admin account — everyone else never sees it.
*/

import { NavLink } from "react-router-dom";
import { Map, Search, User, LayoutDashboard } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import "./BottomNav.css";


// trim() here just in case the env var has trailing whitespace — caught a bug once
const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || "bleronajvazi7@hotmail.com").trim();


export default function BottomNav() {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.email?.trim() === ADMIN_EMAIL;

  return (
    <nav className={`bn ${isAdmin ? "bn--admin" : ""}`} aria-label="Bottom navigation">

      <div className="bn-logo">
        <svg viewBox="0 0 20 24" width="18" height="22" fill="none">
          <path
            d="M10 0C4.48 0 0 4.48 0 10c0 7.5 10 14 10 14S20 17.5 20 10C20 4.48 15.52 0 10 0z"
            fill="#7C3AED"
          />
          <circle cx="10" cy="10" r="3.5" fill="white" />
        </svg>
        <span>SilentSpaces</span>
      </div>

      {/* the three main nav items visible to everyone */}
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

        {/* on mobile, the admin tab appears inline in the bottom bar */}
        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `bn-item bn-item--admin bn-admin-mobile ${isActive ? "is-active" : ""}`
            }
          >
            <LayoutDashboard size={22} />
            <span className="bn-label">Admin</span>
          </NavLink>
        )}
      </div>

      {/* on desktop, the admin shortcut is pinned to the bottom of the sidebar instead */}
      {isAdmin && (
        <div className="bn-admin-footer">
          <NavLink
            to="/admin"
            className={({ isActive }) => `bn-item bn-item--admin ${isActive ? "is-active" : ""}`}
          >
            <LayoutDashboard size={20} />
            <span className="bn-label">Admin Dashboard</span>
          </NavLink>
        </div>
      )}

    </nav>
  );
}
