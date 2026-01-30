import { NavLink } from "react-router-dom";
import "./BottomNav.css";

// Single nav item wrapper so active styling is consistent
function NavItem({ to, label }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        "bn-item" + (isActive ? " bn-itemActive" : "")
      }
    >
      {/* Low-fidelity icon placeholder (replace with real icons later) */}
      <div className="bn-icon" aria-hidden="true" />
      <div className="bn-label">{label}</div>
    </NavLink>
  );
}

export default function BottomNav() {
  return (
    <nav className="bn-bar" aria-label="Bottom navigation">
      <NavItem to="/map" label="Map" />
      <NavItem to="/search" label="Search" />
      <NavItem to="/rate" label="Rate" />
      <NavItem to="/profile" label="Profile" />
    </nav>
  );
}
