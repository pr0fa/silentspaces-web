import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";


const LS_NAME = "ss:profile:name";
const LS_MEMBER_SINCE = "ss:profile:memberSince";
const LS_PREF_WIFI = "ss:pref:wifiRequired";
const LS_PREF_SEATING = "ss:pref:seatingRequired";
const LS_PREF_NOTIFS = "ss:pref:notifications";

// Optional local keys if you already store these elsewhere.
const LS_FAVS = "ss:favourites";

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
  const [wifiRequired, setWifiRequired] = useState(() => readBool(LS_PREF_WIFI, false));
  const [seatingRequired, setSeatingRequired] = useState(() => readBool(LS_PREF_SEATING, false));
  const [notifications, setNotifications] = useState(() => readBool(LS_PREF_NOTIFS, false));

  // Favourites count can be shown even before the full saved list UI exists.
  const favouritesCount = useMemo(() => {
    const favs = readJson(LS_FAVS, []);
    return Array.isArray(favs) ? favs.length : 0;
  }, []);

  // Ratings count is a placeholder until you add user accounts.
  const ratingsCount = 0;

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
  return null;
}




