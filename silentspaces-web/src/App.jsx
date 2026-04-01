import { Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import SplashScreen from "./views/SplashScreen/SplashScreen.jsx";

import MapPage              from "./controllers/MapPage/MapPage.jsx";
import SearchPage           from "./controllers/SearchPage/SearchPage.jsx";
import LocationDetailsPage  from "./controllers/LocationDetailsPage/LocationDetailsPage.jsx";
import RatePage             from "./controllers/RatePage/RatePage.jsx";
import ProfilePage          from "./controllers/ProfilePage/ProfilePage.jsx";
import MyRatingsPage        from "./controllers/MyRatingsPage/MyRatingsPage.jsx";
import SavedLocationsPage   from "./controllers/SavedLocationsPage/SavedLocationsPage.jsx";
import SettingsPage         from "./controllers/SettingsPage/SettingsPage.jsx";
import AboutPage            from "./controllers/AboutPage/AboutPage.jsx";
import HelpPage             from "./controllers/HelpPage/HelpPage.jsx";
import LoginPage            from "./controllers/LoginPage/LoginPage.jsx";
import SignUpPage           from "./controllers/SignUpPage/SignUpPage.jsx";
import OnboardingPage       from "./controllers/OnboardingPage/OnboardingPage.jsx";
import AdminPage            from "./controllers/AdminPage/AdminPage.jsx";

import { Toaster }    from "react-hot-toast";
import BottomNav      from "./views/BottomNav/BottomNav.jsx";
import { AuthProvider, useAuth } from "./contexts/AuthContext.jsx";

import "./App.css";

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "bleronajvazi7@hotmail.com";

/* ── Layout with sidebar/bottom nav ── */
function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <BottomNav />
      <main className="app-main">
        {children}
      </main>
    </div>
  );
}

/* ── Redirect logged-in users away from auth pages ── */
function PublicOnlyRoute({ children }) {
  const { currentUser } = useAuth();
  if (currentUser) return <Navigate to="/map" replace />;
  return children;
}

/* ── Protect pages that require a logged-in user ── */
function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  return children;
}

/* ── Admin-only route ── */
function AdminRoute({ children }) {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.email !== ADMIN_EMAIL) return <Navigate to="/map" replace />;
  return children;
}

function AppRoutes() {
  const [showSplash, setShowSplash] = useState(
    () => !sessionStorage.getItem("ss:splashShown")
  );

  if (showSplash) {
    sessionStorage.setItem("ss:splashShown", "1");
    setTimeout(() => setShowSplash(false), 2300);
    return <SplashScreen />;
  }

  return (
    <>
      <Toaster position="bottom-center" />
      <Routes>
        {/* Auth pages — no nav bar */}
        <Route path="/login"      element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route path="/signup"     element={<PublicOnlyRoute><SignUpPage /></PublicOnlyRoute>} />
        <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />

        {/* Admin — no nav bar, protected by email */}
        <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />

        {/* Main app — with nav bar */}
        <Route path="/*" element={
          <AppLayout>
            <Routes>
              <Route path="/"          element={<Navigate to="/map" replace />} />
              <Route path="/map"       element={<MapPage />} />
              <Route path="/search"    element={<SearchPage />} />
              <Route path="/location/:id" element={<LocationDetailsPage />} />
              <Route path="/about"     element={<AboutPage />} />
              <Route path="/help"      element={<HelpPage />} />

              {/* Protected routes */}
              <Route path="/rate/:id"  element={<ProtectedRoute><RatePage /></ProtectedRoute>} />
              <Route path="/profile"   element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/my-ratings" element={<ProtectedRoute><MyRatingsPage /></ProtectedRoute>} />
              <Route path="/saved"     element={<ProtectedRoute><SavedLocationsPage /></ProtectedRoute>} />
              <Route path="/settings"  element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

              <Route path="/rate"      element={<Navigate to="/search?mode=rate" replace />} />
              <Route path="*"          element={<div style={{ padding: 16 }}>404 Not Found</div>} />
            </Routes>
          </AppLayout>
        } />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
