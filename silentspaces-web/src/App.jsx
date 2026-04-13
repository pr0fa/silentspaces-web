/*
  App.jsx
  the root component. its only job is to wrap everything in AuthProvider
  and hand off to AppRoutes, which handles all the actual routing.
  keeping them split lets AppRoutes call useAuth() without issues.
*/

import { Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import SplashScreen from "./views/SplashScreen/SplashScreen.jsx";

import MapPage             from "./controllers/MapPage/MapPage.jsx";
import SearchPage          from "./controllers/SearchPage/SearchPage.jsx";
import LocationDetailsPage from "./controllers/LocationDetailsPage/LocationDetailsPage.jsx";
import RatePage            from "./controllers/RatePage/RatePage.jsx";
import ProfilePage         from "./controllers/ProfilePage/ProfilePage.jsx";
import MyRatingsPage       from "./controllers/MyRatingsPage/MyRatingsPage.jsx";
import SavedLocationsPage  from "./controllers/SavedLocationsPage/SavedLocationsPage.jsx";
import SettingsPage        from "./controllers/SettingsPage/SettingsPage.jsx";
import AboutPage           from "./controllers/AboutPage/AboutPage.jsx";
import HelpPage            from "./controllers/HelpPage/HelpPage.jsx";
import LoginPage           from "./controllers/LoginPage/LoginPage.jsx";
import SignUpPage          from "./controllers/SignUpPage/SignUpPage.jsx";
import OnboardingPage      from "./controllers/OnboardingPage/OnboardingPage.jsx";
import AdminPage           from "./controllers/AdminPage/AdminPage.jsx";

import { Toaster }               from "react-hot-toast";
import BottomNav                 from "./views/BottomNav/BottomNav.jsx";
import { AuthProvider, useAuth } from "./contexts/AuthContext.jsx";

import "./App.css";


// pull the admin email from the env so it's easy to swap per-deploy.
// defaults to the dev email just in case the env var isn't set.
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "bleronajvazi7@hotmail.com";


// the main shell that wraps every "normal" page with the bottom nav / sidebar
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


// bounces logged-in users away from /login and /signup — they don't need to be there
function PublicOnlyRoute({ children }) {
  const { currentUser } = useAuth();
  if (currentUser) return <Navigate to="/map" replace />;
  return children;
}


// kicks un-authenticated users to /login if they try to access anything private
function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  return children;
}


// double-locked: must be signed in AND have the right email.
// anyone else just gets bounced to the map — no scary error page.
function AdminRoute({ children }) {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.email !== ADMIN_EMAIL) return <Navigate to="/map" replace />;
  return children;
}


function AppRoutes() {
  // only show the splash on the first page load per browser session.
  // sessionStorage clears when the tab closes, so it replays on a fresh open — intended.
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
      {/* toast notifications — bottom-center feels natural on mobile */}
      <Toaster position="bottom-center" />

      <Routes>
        {/* auth pages — deliberately have no nav bar */}
        <Route path="/login"      element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route path="/signup"     element={<PublicOnlyRoute><SignUpPage /></PublicOnlyRoute>} />
        <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />

        {/* admin panel — no nav bar, email-gated */}
        <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />

        {/* everything else gets the standard app shell with the nav bar */}
        <Route path="/*" element={
          <AppLayout>
            <Routes>
              <Route path="/"             element={<Navigate to="/map" replace />} />
              <Route path="/map"          element={<MapPage />} />
              <Route path="/search"       element={<SearchPage />} />
              <Route path="/location/:id" element={<LocationDetailsPage />} />
              <Route path="/about"        element={<AboutPage />} />
              <Route path="/help"         element={<HelpPage />} />

              {/* these pages require a signed-in user */}
              <Route path="/rate/:id"   element={<ProtectedRoute><RatePage /></ProtectedRoute>} />
              <Route path="/profile"    element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/my-ratings" element={<ProtectedRoute><MyRatingsPage /></ProtectedRoute>} />
              <Route path="/saved"      element={<ProtectedRoute><SavedLocationsPage /></ProtectedRoute>} />
              <Route path="/settings"   element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

              {/* legacy redirect — /rate with no id goes to search in rate mode */}
              <Route path="/rate" element={<Navigate to="/search?mode=rate" replace />} />
              <Route path="*"     element={<div style={{ padding: 16 }}>404 Not Found</div>} />
            </Routes>
          </AppLayout>
        } />
      </Routes>
    </>
  );
}


export default function App() {
  // AuthProvider must wrap everything because the route guards all call useAuth()
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
