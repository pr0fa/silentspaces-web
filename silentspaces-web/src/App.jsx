import { Routes, Route, Navigate } from "react-router-dom";

import MapPage from "./controllers/MapPage/MapPage.jsx";
import SearchPage from "./controllers/SearchPage/SearchPage.jsx";
import LocationDetailsPage from "./controllers/LocationDetailsPage/LocationDetailsPage.jsx";
import RatePage from "./controllers/RatePage/RatePage.jsx";
import ProfilePage from "./controllers/ProfilePage/ProfilePage.jsx";
import MyRatingsPage from "./controllers/MyRatingsPage/MyRatingsPage.jsx";
import SavedLocationsPage from "./controllers/SavedLocationsPage/SavedLocationsPage.jsx";
import SettingsPage from "./controllers/SettingsPage/SettingsPage.jsx";
import SeedPage from "./controllers/SeedPage/SeedPage.jsx";
import { Toaster } from "react-hot-toast";

import BottomNav from "./views/BottomNav/BottomNav.jsx";

// Leaflet base styles (needed for tiles/controls/popups/icons)
import "leaflet/dist/leaflet.css";

function AppLayout({ children }) {
  // Bottom padding prevents pages being covered by the fixed nav bar.
  return <div style={{ paddingBottom: 74 }}>{children}<BottomNav /></div>;
}

export default function App() {
  return (
    <AppLayout>
      
       {/* Toast notifications container */}
      <Toaster position="bottom-center" />

      <Routes>
        <Route path="/" element={<Navigate to="/map" replace />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/rate/:id" element={<RatePage />} />
        <Route path="/location/:id" element={<LocationDetailsPage />} />
        {/* Nav tab route (low fidelity for now) */}
        <Route path="/rate" element={<Navigate to="/search?mode=rate" replace />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/my-ratings" element={<MyRatingsPage />} />
        <Route path="/saved" element={<SavedLocationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        {/* One-time DB seeding utility — visit /seed once to populate Firestore */}
        <Route path="/seed" element={<SeedPage />} />
        <Route path="*" element={<div style={{ padding: 16 }}>404 Not Found</div>} />
      </Routes>
    </AppLayout>
    
  );
}
