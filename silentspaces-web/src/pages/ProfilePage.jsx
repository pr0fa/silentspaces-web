import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./styles/ProfilePage.css";

const LS_NAME = "ss:profile:name";
const LS_MEMBER_SINCE = "ss:profile:memberSince";
const LS_PREF_WIFI = "ss:pref:wifiRequired";
const LS_PREF_SEATING = "ss:pref:seatingRequired";
const LS_PREF_NOTIFS = "ss:pref:notifications";

// Optional local keys if you already store these elsewhere.
const LS_FAVS = "ss:favourites";

// NEW: key for ratings you store locally when user submits a rating
const LS_MY_RATINGS = "ss:myRatings";

function readBool(key, fallback = false) {
  const raw = localStorage.getItem(key);
  if (raw == null) return fallback;
  return raw === "true";
}

function readText(key, fallback) {
  const raw = localStorage.getItem(key);
  if (raw == null || raw.trim() === "") return fallback;
  return raw;
}

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
  const navigate = useNavigate();

  // Profile identity is local-only until authentication exists.
  const [name, setName] = useState(() => readText(LS_NAME, "Bleron Ajvazi"));
  const memberSince = useMemo(() => readText(LS_MEMBER_SINCE, "2025"), []);

  // Preferences are stored locally and can be used later for default filters.
  const [wifiRequired, setWifiRequired] = useState(() =>
    readBool(LS_PREF_WIFI, false)
  );
  const [seatingRequired, setSeatingRequired] = useState(() =>
    readBool(LS_PREF_SEATING, false)
  );
  const [notifications, setNotifications] = useState(() =>
    readBool(LS_PREF_NOTIFS, false)
  );

  // Favourites count can be shown even before the full saved list UI exists.
  const favouritesCount = useMemo(() => {
    const favs = readJson(LS_FAVS, []);
    return Array.isArray(favs) ? favs.length : 0;
  }, []);

  // Ratings count is a placeholder until you add user accounts.
  // NEW: Now reading real local ratings saved on RatePage
  const ratingsCount = useMemo(() => {
    const list = readJson(LS_MY_RATINGS, []);
    return Array.isArray(list) ? list.length : 0;
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_PREF_WIFI, String(wifiRequired));
  }, [wifiRequired]);

  useEffect(() => {
    localStorage.setItem(LS_PREF_SEATING, String(seatingRequired));
  }, [seatingRequired]);

  useEffect(() => {
    localStorage.setItem(LS_PREF_NOTIFS, String(notifications));
  }, [notifications]);

  const onEditName = () => {
    // Uses a simple prompt for now so the UI stays minimal and commit-friendly.
    const next = prompt("Display name", name);
    if (next == null) return;

    const clean = next.trim().slice(0, 28) || "Bleron Ajvazi";
    setName(clean);
    localStorage.setItem(LS_NAME, clean);
  };

  return (
    <div className="pf-page">
      <div className="pf-title">Profile</div>

      <div className="pf-card">
        <div className="pf-avatarWrap">
          <div className="pf-avatarOuter">
            <div className="pf-avatarInner" />
          </div>
        </div>

        <button type="button" className="pf-nameBtn" onClick={onEditName} title="Edit name">
          {name}
        </button>

        <div className="pf-sub">Member since {memberSince}</div>

        <div className="pf-divider" />

        <div className="pf-stats">
          <div className="pf-stat">
            <div className="pf-statNum">{ratingsCount}</div>
            <div className="pf-statLabel">Ratings</div>
          </div>

          <div className="pf-statSep" />

          <div className="pf-stat">
            <div className="pf-statNum">{favouritesCount}</div>
            <div className="pf-statLabel">Favorites</div>
          </div>
        </div>
      </div>

      <div className="pf-sectionLabel">Preferences</div>

      <div className="pf-card pf-cardPad">
        <div className="pf-row">
          <div className="pf-rowText">Wi-Fi Required</div>
          <label className="pf-switch">
            <input
              type="checkbox"
              checked={wifiRequired}
              onChange={() => setWifiRequired((v) => !v)}
            />
            <span className="pf-slider" />
          </label>
        </div>

        <div className="pf-row">
          <div className="pf-rowText">Seating Required</div>
          <label className="pf-switch">
            <input
              type="checkbox"
              checked={seatingRequired}
              onChange={() => setSeatingRequired((v) => !v)}
            />
            <span className="pf-slider" />
          </label>
        </div>

        <div className="pf-row">
          <div className="pf-rowText">Notifications</div>
          <label className="pf-switch">
            <input
              type="checkbox"
              checked={notifications}
              onChange={() => setNotifications((v) => !v)}
            />
            <span className="pf-slider" />
          </label>
        </div>
      </div>

      <div className="pf-card pf-cardPad pf-actions">
        <button type="button" className="pf-actionBtn" onClick={() => navigate("/rate")}>
          <span>My Ratings</span>
          <span className="pf-actionIcon" aria-hidden="true" />
        </button>

        <button type="button" className="pf-actionBtn" onClick={() => navigate("/saved")}>
          <span>Saved Locations</span>
          <span className="pf-actionIcon" aria-hidden="true" />
        </button>

        <button type="button" className="pf-actionBtn" onClick={() => navigate("/settings")}>
          <span>Settings</span>
          <span className="pf-actionIcon" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
