import { Routes, Route, Navigate } from "react-router-dom";

import MapPage from "./pages/MapPage.jsx";
import SearchPage from "./pages/SearchPage.jsx";
import LocationDetailsPage from "./pages/LocationDetailsPage.jsx";
import RatePage from "./pages/RatePage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import MyRatingsPage from "./pages/MyRatingsPage.jsx";
import SavedLocationsPage from "./pages/SavedLocationsPage.jsx";
import { Toaster } from "react-hot-toast";

import BottomNav from "./components/BottomNav.jsx";

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
        <Route path="/location/:id" element={<LocationDetailsPage />} />
        

        {/* Nav tab route (low fidelity for now) */}
        <Route path="/rate" element={<Navigate to="/search?mode=rate" replace />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/my-ratings" element={<MyRatingsPage />} />
        <Route path="/saved" element={<SavedLocationsPage />} />
        <Route path="*" element={<div style={{ padding: 16 }}>404 Not Found</div>} />
      </Routes>
    </AppLayout>
    
  );
}
