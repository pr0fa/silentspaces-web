/*
  ProfilePage.jsx
  the user's home base. shows their avatar, quick stats (ratings count, saved count),
  filter preferences (synced to Firestore), activity shortcuts, and a sign-out button.

  the preference toggles write to both Firestore and localStorage so MapPage can
  read them without a network call on every visit.
*/

import { useEffect, useMemo, useState } from "react";
import { useNavigate }                  from "react-router-dom";
import { useAuth }                      from "../../contexts/AuthContext";
import { db }                           from "../../config/firebase";
import { doc, getDoc, setDoc }          from "firebase/firestore";
import {
  Wifi, Armchair, VolumeX, Zap, Star, Bookmark,
  Settings, HelpCircle, Info, LayoutDashboard, LogOut,
} from "lucide-react";
import toast from "react-hot-toast";
import "./ProfilePage.css";


// localStorage keys for the filter prefs — same as MapPage so they stay in sync
const LS_PREF_WIFI    = "ss:pref:wifiRequired";
const LS_PREF_SEATING = "ss:pref:seatingRequired";
const LS_PREF_QUIET   = "ss:pref:quietRequired";
const LS_PREF_SOCKETS = "ss:pref:socketsRequired";

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "bleronajvazi7@hotmail.com";


// safely parse a JSON value from localStorage — returns the fallback on any error
function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}


export default function ProfilePage() {
  const navigate       = useNavigate();
  const { currentUser, logout } = useAuth();

  const [wifiRequired,    setWifiRequired]    = useState(false);
  const [seatingRequired, setSeatingRequired] = useState(false);
  const [quietRequired,   setQuietRequired]   = useState(false);
  const [socketsRequired, setSocketsRequired] = useState(false);

  // we use this flag to avoid writing back to Firestore before we've loaded the
  // current values — otherwise the save useEffect would overwrite prefs on mount
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  const isAdmin = currentUser?.email === ADMIN_EMAIL;

  // load preferences from Firestore on mount.
  // falls back to localStorage for first-time users who haven't synced yet.
  useEffect(() => {
    if (!currentUser) return;

    getDoc(doc(db, "users", currentUser.uid))
      .then(snap => {
        const prefs = snap.data()?.preferences;

        if (prefs) {
          setWifiRequired(!!prefs.wifiRequired);
          setSeatingRequired(!!prefs.seatingRequired);
          setQuietRequired(!!prefs.quietRequired);
          setSocketsRequired(!!prefs.socketsRequired);
        } else {
          // brand new user — grab whatever's in localStorage from onboarding
          setWifiRequired(localStorage.getItem(LS_PREF_WIFI)    === "true");
          setSeatingRequired(localStorage.getItem(LS_PREF_SEATING) === "true");
          setQuietRequired(localStorage.getItem(LS_PREF_QUIET)   === "true");
          setSocketsRequired(localStorage.getItem(LS_PREF_SOCKETS) === "true");
        }
      })
      .catch(() => {})
      .finally(() => setPrefsLoaded(true));
  }, [currentUser]);


  // sync prefs to Firestore + localStorage whenever a toggle changes.
  // the prefsLoaded guard stops this from firing before we've loaded the initial values.
  useEffect(() => {
    if (!prefsLoaded || !currentUser) return;

    const prefs = { wifiRequired, seatingRequired, quietRequired, socketsRequired };

    // write to Firestore so prefs sync across devices
    setDoc(doc(db, "users", currentUser.uid), { preferences: prefs }, { merge: true }).catch(() => {});

    // also keep localStorage in sync so MapPage can read them without a network call
    localStorage.setItem(LS_PREF_WIFI,    String(wifiRequired));
    localStorage.setItem(LS_PREF_SEATING, String(seatingRequired));
    localStorage.setItem(LS_PREF_QUIET,   String(quietRequired));
    localStorage.setItem(LS_PREF_SOCKETS, String(socketsRequired));
  }, [wifiRequired, seatingRequired, quietRequired, socketsRequired, prefsLoaded, currentUser]);


  // read counts from localStorage — no Firestore read needed for these
  const favouritesCount = useMemo(() => {
    const favs = readJson(`ss:favourites:${currentUser?.uid || "guest"}`, []);
    return Array.isArray(favs) ? favs.length : 0;
  }, [currentUser]);

  const ratingsCount = useMemo(() => {
    const list = readJson(`ss:myRatings:${currentUser?.uid || "guest"}`, []);
    return Array.isArray(list) ? list.length : 0;
  }, [currentUser]);


  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch {
      toast.error("Failed to sign out.");
    }
  };

  // derive display values from currentUser
  const name     = currentUser?.displayName || "User";
  const email    = currentUser?.email       || "";
  const photoURL = currentUser?.photoURL;
  const initials = name.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("");


  return (
    <div className="pf-page">

      <div className="pf-header">
        <div className="pf-avatar">
          {photoURL
            ? <img src={photoURL} alt={name} className="pf-avatar-img" />
            : initials
          }
        </div>
        <div className="pf-name">{name}</div>
        <div className="pf-sub">{email}</div>
      </div>

      {/* quick stats — tappable to jump straight to the relevant page */}
      <div className="pf-stats-row">
        <div className="pf-stat" onClick={() => navigate("/my-ratings")}>
          <div className="pf-stat-num">{ratingsCount}</div>
          <div className="pf-stat-label">Ratings</div>
        </div>
        <div className="pf-stat-sep" />
        <div className="pf-stat" onClick={() => navigate("/saved")}>
          <div className="pf-stat-num">{favouritesCount}</div>
          <div className="pf-stat-label">Saved</div>
        </div>
      </div>

      <p className="pf-section-label">Preferences</p>
      <p className="pf-section-desc">Synced to your account — available on any device</p>

      <div className="pf-card">
        <div className="pf-row">
          <span className="pf-row-text"><Wifi size={16} /> Wi-Fi Required</span>
          <label className="pf-switch">
            <input type="checkbox" checked={wifiRequired} onChange={() => setWifiRequired(v => !v)} />
            <span className="pf-slider" />
          </label>
        </div>

        <div className="pf-row">
          <span className="pf-row-text"><Armchair size={16} /> Seating Required</span>
          <label className="pf-switch">
            <input type="checkbox" checked={seatingRequired} onChange={() => setSeatingRequired(v => !v)} />
            <span className="pf-slider" />
          </label>
        </div>

        <div className="pf-row">
          <span className="pf-row-text"><VolumeX size={16} /> Quiet Required</span>
          <label className="pf-switch">
            <input type="checkbox" checked={quietRequired} onChange={() => setQuietRequired(v => !v)} />
            <span className="pf-slider" />
          </label>
        </div>

        <div className="pf-row">
          <span className="pf-row-text"><Zap size={16} /> Sockets Required</span>
          <label className="pf-switch">
            <input type="checkbox" checked={socketsRequired} onChange={() => setSocketsRequired(v => !v)} />
            <span className="pf-slider" />
          </label>
        </div>
      </div>

      <p className="pf-section-label">My Activity</p>
      <div className="pf-card">
        <button type="button" className="pf-link-btn" onClick={() => navigate("/my-ratings")}>
          <span className="pf-link-left"><Star size={16} /> My Ratings</span>
          <span className="pf-chevron">›</span>
        </button>
        <button type="button" className="pf-link-btn" onClick={() => navigate("/saved")}>
          <span className="pf-link-left"><Bookmark size={16} /> Saved Locations</span>
          <span className="pf-chevron">›</span>
        </button>
        <button type="button" className="pf-link-btn" onClick={() => navigate("/settings")}>
          <span className="pf-link-left"><Settings size={16} /> Settings</span>
          <span className="pf-chevron">›</span>
        </button>
        <button type="button" className="pf-link-btn" onClick={() => navigate("/help")}>
          <span className="pf-link-left"><HelpCircle size={16} /> Help & Support</span>
          <span className="pf-chevron">›</span>
        </button>
        <button type="button" className="pf-link-btn" onClick={() => navigate("/about")}>
          <span className="pf-link-left"><Info size={16} /> About</span>
          <span className="pf-chevron">›</span>
        </button>
      </div>

      {/* only show the admin shortcut to the admin account — no one else needs to see it */}
      {isAdmin && (
        <button className="pf-admin-btn" onClick={() => navigate("/admin")}>
          <LayoutDashboard size={17} />
          Switch to Admin Dashboard
        </button>
      )}

      <button className="pf-signout-btn" onClick={handleLogout}>
        <LogOut size={16} />
        Sign out
      </button>

    </div>
  );
}
