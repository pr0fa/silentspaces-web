import { Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import SplashScreen from "./views/SplashScreen/SplashScreen.jsx";

import MapPage from "./controllers/MapPage/MapPage.jsx";
import SearchPage from "./controllers/SearchPage/SearchPage.jsx";
import LocationDetailsPage from "./controllers/LocationDetailsPage/LocationDetailsPage.jsx";
import RatePage from "./controllers/RatePage/RatePage.jsx";
import ProfilePage from "./controllers/ProfilePage/ProfilePage.jsx";
import MyRatingsPage from "./controllers/MyRatingsPage/MyRatingsPage.jsx";
import SavedLocationsPage from "./controllers/SavedLocationsPage/SavedLocationsPage.jsx";
import SettingsPage from "./controllers/SettingsPage/SettingsPage.jsx";
import { Toaster } from "react-hot-toast";

import BottomNav from "./views/BottomNav/BottomNav.jsx";

// Leaflet base styles (needed for tiles/controls/popups/icons)
import "leaflet/dist/leaflet.css";

function AppLayout({ children }) {
  // Bottom padding prevents pages being covered by the fixed nav bar.
  return <div style={{ paddingBottom: 74 }}>{children}<BottomNav /></div>;
}

export default function App() {
  const [showSplash, setShowSplash] = useState(
    () => !sessionStorage.getItem("ss:splashShown")
  );

  if (showSplash) {
    sessionStorage.setItem("ss:splashShown", "1");
    setTimeout(() => setShowSplash(false), 2300);
    return <SplashScreen />;
  }

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
        <Route path="*" element={<div style={{ padding: 16 }}>404 Not Found</div>} />
      </Routes>
    </AppLayout>
    
  );
}
