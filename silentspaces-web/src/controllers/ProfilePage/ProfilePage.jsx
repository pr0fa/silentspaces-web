import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wifi, Armchair, VolumeX, Zap, Star, Bookmark, Settings, Info, HelpCircle } from "lucide-react";
import "./ProfilePage.css";

const LS_NAME          = "ss:profile:name";
const LS_PREF_WIFI     = "ss:pref:wifiRequired";
const LS_PREF_SEATING  = "ss:pref:seatingRequired";
const LS_PREF_QUIET    = "ss:pref:quietRequired";
const LS_PREF_SOCKETS  = "ss:pref:socketsRequired";
const LS_FAVS          = "ss:favourites";
const LS_MY_RATINGS    = "ss:myRatings";

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

  const [name, setName] = useState(() => readText(LS_NAME, "Guest User"));

  const [wifiRequired,    setWifiRequired]    = useState(() => readBool(LS_PREF_WIFI,     false));
  const [seatingRequired, setSeatingRequired] = useState(() => readBool(LS_PREF_SEATING,  false));
  const [quietRequired,   setQuietRequired]   = useState(() => readBool(LS_PREF_QUIET,    false));
  const [socketsRequired, setSocketsRequired] = useState(() => readBool(LS_PREF_SOCKETS,  false));

  const favouritesCount = useMemo(() => {
    const favs = readJson(LS_FAVS, []);
    return Array.isArray(favs) ? favs.length : 0;
  }, []);

  const ratingsCount = useMemo(() => {
    const list = readJson(LS_MY_RATINGS, []);
    return Array.isArray(list) ? list.length : 0;
  }, []);

  useEffect(() => { localStorage.setItem(LS_PREF_WIFI,     String(wifiRequired));    }, [wifiRequired]);
  useEffect(() => { localStorage.setItem(LS_PREF_SEATING,  String(seatingRequired)); }, [seatingRequired]);
  useEffect(() => { localStorage.setItem(LS_PREF_QUIET,    String(quietRequired));   }, [quietRequired]);
  useEffect(() => { localStorage.setItem(LS_PREF_SOCKETS,  String(socketsRequired)); }, [socketsRequired]);

  const onEditName = () => {
    const next = prompt("Display name", name);
    if (next == null) return;
    const clean = next.trim().slice(0, 28) || "Guest User";
    setName(clean);
    localStorage.setItem(LS_NAME, clean);
  };

  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="pf-page">

      <div className="pf-header">
        <div className="pf-avatar" onClick={onEditName}>
          {initials}
        </div>
        <div className="pf-name" onClick={onEditName}>
          {name}
        </div>
        <div className="pf-sub">Tap your name to edit</div>
      </div>

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

    </div>
  );
}
