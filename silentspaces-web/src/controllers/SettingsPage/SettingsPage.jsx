import { useNavigate } from "react-router-dom";
import "./SettingsPage.css";

const LS_FAVS = "ss:favourites";
const LS_MY_RATINGS = "ss:myRatings";
const LS_PREF_WIFI = "ss:pref:wifiRequired";
const LS_PREF_SEATING = "ss:pref:seatingRequired";
const LS_PREF_QUIET = "ss:pref:quietRequired";
const LS_PREF_SOCKETS = "ss:pref:socketsRequired";
const LS_NAME = "ss:profile:name";

export default function SettingsPage() {
  const navigate = useNavigate();

  // clear only saved locations
  const clearSaved = () => {
    if (!window.confirm("clear all saved locations?")) return;
    localStorage.removeItem(LS_FAVS);
    alert("saved locations cleared.");
  };

  // clear only ratings
  const clearRatings = () => {
    if (!window.confirm("clear all your ratings?")) return;
    localStorage.removeItem(LS_MY_RATINGS);
    alert("ratings cleared.");
  };

  // reset preferences only
  const resetPreferences = () => {
    if (!window.confirm("reset all preferences?")) return;

    localStorage.removeItem(LS_PREF_WIFI);
    localStorage.removeItem(LS_PREF_SEATING);
    localStorage.removeItem(LS_PREF_QUIET);
    localStorage.removeItem(LS_PREF_SOCKETS);

    alert("preferences reset.");
  };

  // nuclear option
  const resetAll = () => {
    if (!window.confirm("this will reset all local app data. continue?")) return;

    localStorage.removeItem(LS_FAVS);
    localStorage.removeItem(LS_MY_RATINGS);
    localStorage.removeItem(LS_PREF_WIFI);
    localStorage.removeItem(LS_PREF_SEATING);
    localStorage.removeItem(LS_PREF_QUIET);
    localStorage.removeItem(LS_PREF_SOCKETS);
    localStorage.removeItem(LS_NAME);

    alert("all local data cleared.");
    navigate("/map");
  };

  return (
    <div className="st-page">
      <h2 className="st-title">Settings</h2>

      {/* data management section */}
      <div className="st-section">
        <div className="st-sectionTitle">Data Management</div>

        <button className="st-btn" onClick={clearSaved}>
          Clear Saved Locations
        </button>

        <button className="st-btn" onClick={clearRatings}>
          Clear My Ratings
        </button>

        <button className="st-btn" onClick={resetPreferences}>
          Reset Preferences
        </button>

        <button className="st-btn st-danger" onClick={resetAll}>
          Reset All App Data
        </button>
      </div>

      {/* about section */}
      <div className="st-section">
        <div className="st-sectionTitle">About</div>

        <div className="st-about">
          SilentSpaces v1.0  
          <br />
          Built with React, Node, and MySQL  
          <br />
          Device-based profile (no authentication)
        </div>
      </div>
    </div>
  );
}