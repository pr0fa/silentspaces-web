import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Bookmark, Star, RotateCcw, Trash2, ChevronLeft } from "lucide-react";
import "./SettingsPage.css";

const LS_FAVS         = "ss:favourites";
const LS_MY_RATINGS   = "ss:myRatings";
const LS_PREF_WIFI    = "ss:pref:wifiRequired";
const LS_PREF_SEATING = "ss:pref:seatingRequired";
const LS_PREF_QUIET   = "ss:pref:quietRequired";
const LS_PREF_SOCKETS = "ss:pref:socketsRequired";
const LS_NAME         = "ss:profile:name";

export default function SettingsPage() {
  const navigate = useNavigate();

  const clearSaved = () => {
    localStorage.removeItem(LS_FAVS);
    toast.success("Saved locations cleared");
  };

  const clearRatings = () => {
    localStorage.removeItem(LS_MY_RATINGS);
    toast.success("Ratings cleared");
  };

  const resetPreferences = () => {
    localStorage.removeItem(LS_PREF_WIFI);
    localStorage.removeItem(LS_PREF_SEATING);
    localStorage.removeItem(LS_PREF_QUIET);
    localStorage.removeItem(LS_PREF_SOCKETS);
    toast.success("Preferences reset");
  };

  const resetAll = () => {
    localStorage.removeItem(LS_FAVS);
    localStorage.removeItem(LS_MY_RATINGS);
    localStorage.removeItem(LS_PREF_WIFI);
    localStorage.removeItem(LS_PREF_SEATING);
    localStorage.removeItem(LS_PREF_QUIET);
    localStorage.removeItem(LS_PREF_SOCKETS);
    localStorage.removeItem(LS_NAME);
    toast.success("All app data cleared");
    navigate("/map");
  };

  return (
    <div className="st-page">

      <div className="st-header">
        <button className="st-back" onClick={() => navigate("/profile")}><ChevronLeft size={28} /></button>
        <span className="st-heading">Settings</span>
      </div>

      <div className="st-section">
        <div className="st-section-title">Data Management</div>
        <div className="st-card">
          <button className="st-btn" onClick={clearSaved}>
            <Bookmark size={18} className="st-btn-icon" />
            <span className="st-btn-label">Clear Saved Locations</span>
            <span className="st-btn-arrow">›</span>
          </button>
          <div className="st-divider" />
          <button className="st-btn" onClick={clearRatings}>
            <Star size={18} className="st-btn-icon" />
            <span className="st-btn-label">Clear My Ratings</span>
            <span className="st-btn-arrow">›</span>
          </button>
          <div className="st-divider" />
          <button className="st-btn" onClick={resetPreferences}>
            <RotateCcw size={18} className="st-btn-icon" />
            <span className="st-btn-label">Reset Preferences</span>
            <span className="st-btn-arrow">›</span>
          </button>
        </div>
      </div>

      <div className="st-section">
        <div className="st-section-title">Danger Zone</div>
        <div className="st-card">
          <button className="st-btn st-btn--danger" onClick={resetAll}>
            <Trash2 size={18} className="st-btn-icon" />
            <span className="st-btn-label">Reset All App Data</span>
            <span className="st-btn-arrow">›</span>
          </button>
        </div>
      </div>


    </div>
  );
}
