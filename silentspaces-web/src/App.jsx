import { Routes, Route, Navigate } from "react-router-dom";

import MapPage from "./pages/MapPage.jsx";
import SearchPage from "./pages/SearchPage.jsx";
import LocationDetailsPage from "./pages/LocationDetailsPage.jsx";
import RatePage from "./pages/RatePage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";

// Leaflet base styles (needed for tiles/controls/popups/icons)
import "leaflet/dist/leaflet.css";


export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/map" replace />} />

      <Route path="/map" element={<MapPage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/location/:id" element={<LocationDetailsPage />} />
      <Route path="/rate/:id" element={<RatePage />} />
      <Route path="/profile" element={<ProfilePage />} />

      <Route path="*" element={<div style={{ padding: 16 }}>404 Not Found</div>} />
    </Routes>
  );
}
