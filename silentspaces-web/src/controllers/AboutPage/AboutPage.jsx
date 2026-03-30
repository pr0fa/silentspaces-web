import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import "./AboutPage.css";

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="ab-page">

      <div className="ab-header">
        <button className="ab-back" onClick={() => navigate("/profile")}>
          <ChevronLeft size={22} />
        </button>
        <span className="ab-heading">About</span>
      </div>

      {/* Hero */}
      <div className="ab-hero">
        <div className="ab-logo">
          <svg viewBox="0 0 40 48" width="40" height="48" fill="none">
            <path d="M20 0C10.06 0 2 8.06 2 18c0 13.5 18 30 18 30s18-16.5 18-30C38 8.06 29.94 0 20 0z" fill="white" fillOpacity="0.9"/>
            <circle cx="20" cy="18" r="7" fill="#7C3AED"/>
          </svg>
        </div>
        <div className="ab-app-name">SilentSpaces</div>
        <div className="ab-version">v1.0</div>
        <div className="ab-tagline">Find your quiet space in a busy city</div>
      </div>

      {/* Stats */}
      <div className="ab-stats">
        <div className="ab-stat">
          <span className="ab-stat-num">177+</span>
          <span className="ab-stat-label">Locations</span>
        </div>
        <div className="ab-stat-sep" />
        <div className="ab-stat">
          <span className="ab-stat-num">⭐</span>
          <span className="ab-stat-label">Community rated</span>
        </div>
        <div className="ab-stat-sep" />
        <div className="ab-stat">
          <span className="ab-stat-num">🔒</span>
          <span className="ab-stat-label">No account needed</span>
        </div>
      </div>

      {/* Mission */}
      <div className="ab-section">
        <div className="ab-section-title">Our Mission</div>
        <div className="ab-card ab-mission">
          SilentSpaces helps people discover quiet, productive spaces across London and beyond.
          Whether you need a calm café to work from, a peaceful library to study in, or a quiet
          park to unwind — we help you find it, rated by the community.
        </div>
      </div>

      {/* Built with */}
      <div className="ab-section">
        <div className="ab-section-title">Built With</div>
        <div className="ab-card ab-tech">
          <span className="ab-tech-pill">⚛️ React</span>
          <span className="ab-tech-pill">🔥 Firebase</span>
          <span className="ab-tech-pill">🗺️ Mapbox</span>
          <span className="ab-tech-pill">🌍 OpenStreetMap</span>
        </div>
      </div>

      {/* Developer */}
      <div className="ab-section">
        <div className="ab-section-title">Developer</div>
        <div className="ab-card ab-dev">
          <div className="ab-dev-name">Bleron Ajvazi</div>
          <div className="ab-dev-sub">Kingston University · Final Year Project · 2025</div>
        </div>
      </div>

    </div>
  );
}
