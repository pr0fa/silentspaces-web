/*
  SettingsPage.jsx
  lets the user nuke their local app data — saved locations, ratings cache,
  and filter preferences. everything here is localStorage-only so no Firestore
  writes are needed.

  heads up: "reset all" sends them back to /map after clearing everything because
  staying on settings with no data would look broken.
*/

import { useNavigate } from "react-router-dom";
import { useAuth }     from "../../contexts/AuthContext";
import { Bookmark, Star, RotateCcw, Trash2, ChevronLeft } from "lucide-react";
import toast from "react-hot-toast";
import "./SettingsPage.css";


// the four filter pref keys — same ones ProfilePage and MapPage use
const PREF_KEYS = [
  "ss:pref:wifiRequired",
  "ss:pref:seatingRequired",
  "ss:pref:quietRequired",
  "ss:pref:socketsRequired",
];


export default function SettingsPage() {
  const navigate       = useNavigate();
  const { currentUser } = useAuth();
  const uid            = currentUser?.uid || "guest";

  const clearSaved = () => {
    if (!window.confirm("Clear all saved locations?")) return;
    localStorage.removeItem(`ss:favourites:${uid}`);
    toast.success("Saved locations cleared");
  };

  const clearRatings = () => {
    if (!window.confirm("Clear your local ratings history?")) return;
    localStorage.removeItem(`ss:myRatings:${uid}`);
    toast.success("Ratings cleared");
  };

  const resetPreferences = () => {
    if (!window.confirm("Reset all filter preferences to default?")) return;
    PREF_KEYS.forEach(k => localStorage.removeItem(k));
    toast.success("Preferences reset");
  };

  // the nuclear option — clears everything and redirects to the map
  const resetAll = () => {
    if (!window.confirm("This will clear all your local app data. Are you sure?")) return;

    localStorage.removeItem(`ss:favourites:${uid}`);
    localStorage.removeItem(`ss:myRatings:${uid}`);
    PREF_KEYS.forEach(k => localStorage.removeItem(k));
    localStorage.removeItem("ss:profile:name");

    toast.success("All app data cleared");
    navigate("/map");
  };


  return (
    <div className="st-page">

      <div className="st-header">
        <button className="st-back" onClick={() => navigate("/profile")}>
          <ChevronLeft size={28} />
        </button>
        <span className="st-heading">Settings</span>
      </div>

      <p className="st-section-label">Data Management</p>

      <div className="st-card">

        <div className="st-row">
          <div className="st-row-icon st-row-icon--blue"><Bookmark size={16} /></div>
          <div className="st-row-body">
            <div className="st-row-title">Saved Locations</div>
            <div className="st-row-desc">Remove all your bookmarked places</div>
          </div>
          <button className="st-action-btn" onClick={clearSaved}>Clear</button>
        </div>

        <div className="st-row-divider" />

        <div className="st-row">
          <div className="st-row-icon st-row-icon--yellow"><Star size={16} /></div>
          <div className="st-row-body">
            <div className="st-row-title">Ratings History</div>
            <div className="st-row-desc">Remove your local ratings cache</div>
          </div>
          <button className="st-action-btn" onClick={clearRatings}>Clear</button>
        </div>

        <div className="st-row-divider" />

        <div className="st-row">
          <div className="st-row-icon st-row-icon--purple"><RotateCcw size={16} /></div>
          <div className="st-row-body">
            <div className="st-row-title">Filter Preferences</div>
            <div className="st-row-desc">Reset Wi-Fi, seating and quiet filters</div>
          </div>
          <button className="st-action-btn" onClick={resetPreferences}>Reset</button>
        </div>

      </div>

      <p className="st-section-label st-section-label--danger">Danger Zone</p>

      <div className="st-card st-card--danger">
        <div className="st-row">
          <div className="st-row-icon st-row-icon--red"><Trash2 size={16} /></div>
          <div className="st-row-body">
            <div className="st-row-title st-row-title--danger">Reset All App Data</div>
            <div className="st-row-desc">Clears everything stored locally on this device</div>
          </div>
          <button className="st-action-btn st-action-btn--danger" onClick={resetAll}>Reset</button>
        </div>
      </div>

    </div>
  );
}
