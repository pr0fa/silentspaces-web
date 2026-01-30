import { Routes, Route, Navigate } from "react-router-dom";

import MapPage from "./pages/MapPage.jsx";
import SearchPage from "./pages/SearchPage.jsx";
import LocationDetailsPage from "./pages/LocationDetailsPage.jsx";
import RatePage from "./pages/RatePage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";

import BottomNav from "./components/BottomNav.jsx";

// Leaflet base styles (needed for tiles/controls/popups/icons)
import "leaflet/dist/leaflet.css";

function AppLayout({ children }) {
  // Bottom padding prevents pages being covered by the fixed nav bar.
  return <div style={{ paddingBottom: 74 }}>{children}<BottomNav /></div>;
}

function RateHub() {
  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>Rate</h2>
      <div style={{ opacity: 0.8, marginTop: 6 }}>
        Pick a location from Search or Map to submit a rating.
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/map" replace />} />

        <Route path="/map" element={<MapPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/location/:id" element={<LocationDetailsPage />} />

        {/* Nav tab route (low fidelity for now) */}
        <Route path="/rate" element={<RateHub />} />
        <Route path="/rate/:id" element={<RatePage />} />

        <Route path="/profile" element={<ProfilePage />} />

        <Route path="*" element={<div style={{ padding: 16 }}>404 Not Found</div>} />
      </Routes>
    </AppLayout>
  );
}
