/*
  OnboardingPage.jsx
  a two-step intro flow for new users. shown once right after sign-up.

  step 0: pick your preferred space types (library, café, park)
  step 1: toggle the features you care about (wifi, seating, quiet, sockets)

  when the user hits "go to map" we write their prefs to localStorage — the same
  keys MapPage and ProfilePage read — so their filters are ready immediately.
*/

import { useState }    from "react";
import { useNavigate } from "react-router-dom";
import { useAuth }     from "../../contexts/AuthContext";
import { Wifi, Armchair, VolumeX, Zap } from "lucide-react";
import "./OnboardingPage.css";


// localStorage keys — same ones used by MapPage and ProfilePage
const LS_PREF_WIFI    = "ss:pref:wifiRequired";
const LS_PREF_SEATING = "ss:pref:seatingRequired";
const LS_PREF_QUIET   = "ss:pref:quietRequired";
const LS_PREF_SOCKETS = "ss:pref:socketsRequired";
const LS_PREF_TYPES   = "ss:pref:spaceTypes";


// the three space types on step 0
const SPACE_TYPES = [
  { id: "library", label: "Library", emoji: "📚", desc: "Silent study, books, focused work" },
  { id: "cafe",    label: "Café",    emoji: "☕", desc: "Coffee, light background noise, relaxed" },
  { id: "park",    label: "Park",    emoji: "🌳", desc: "Outdoors, fresh air, calm surroundings" },
];

// the four feature toggles on step 1
const FEATURES = [
  { id: "wifi",    icon: <Wifi size={22} />,     label: "Wi-Fi",   desc: "Reliable internet connection" },
  { id: "seating", icon: <Armchair size={22} />, label: "Seating", desc: "Comfortable seats available"  },
  { id: "quiet",   icon: <VolumeX size={22} />,  label: "Quiet",   desc: "Low noise environment"        },
  { id: "sockets", icon: <Zap size={22} />,      label: "Sockets", desc: "Power outlets to charge up"   },
];


export default function OnboardingPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // step 0 = space types, step 1 = features
  const [step,    setStep]    = useState(0);
  const [types,   setTypes]   = useState(["library", "cafe", "park"]); // all on by default
  const [wifi,    setWifi]    = useState(false);
  const [seating, setSeating] = useState(false);
  const [quiet,   setQuiet]   = useState(false);
  const [sockets, setSockets] = useState(false);

  // grab the first name so the greeting feels personal ("Hey Bleron, …" not "Hey Bleron Ajvazi, …")
  const firstName = currentUser?.displayName?.split(" ")[0] || "there";

  const toggleType = (id) =>
    setTypes(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );

  const toggleFeature = (id) => {
    if (id === "wifi")    setWifi(v    => !v);
    if (id === "seating") setSeating(v => !v);
    if (id === "quiet")   setQuiet(v   => !v);
    if (id === "sockets") setSockets(v => !v);
  };

  const isFeatureOn = (id) => {
    if (id === "wifi")    return wifi;
    if (id === "seating") return seating;
    if (id === "quiet")   return quiet;
    if (id === "sockets") return sockets;
    return false;
  };

  const handleNext = () => {
    if (step === 0) {
      setStep(1);
      return;
    }

    // save everything to localStorage and head to the map
    localStorage.setItem(LS_PREF_TYPES,   JSON.stringify(types));
    localStorage.setItem(LS_PREF_WIFI,    String(wifi));
    localStorage.setItem(LS_PREF_SEATING, String(seating));
    localStorage.setItem(LS_PREF_QUIET,   String(quiet));
    localStorage.setItem(LS_PREF_SOCKETS, String(sockets));
    navigate("/map", { replace: true });
  };


  return (
    <div className="ob-page">

      {/* progress bar at the top — simple, honest, doesn't lie about steps */}
      <div className="ob-progress">
        <div className="ob-progress-track">
          <div className="ob-progress-fill" style={{ width: step === 0 ? "50%" : "100%" }} />
        </div>
        <span className="ob-progress-label">{step + 1} of 2</span>
      </div>

      <div className="ob-content">

        {step === 0 && (
          <>
            <div className="ob-heading">
              <h1>Hey {firstName}, what spaces do you prefer?</h1>
              <p>Select all that apply — we&apos;ll show them on your map.</p>
            </div>

            <div className="ob-type-grid">
              {SPACE_TYPES.map(({ id, label, emoji, desc }) => (
                <button
                  key={id}
                  type="button"
                  className={`ob-type-card ${types.includes(id) ? "ob-type-card--on" : ""}`}
                  onClick={() => toggleType(id)}
                >
                  <span className="ob-type-emoji">{emoji}</span>
                  <span className="ob-type-label">{label}</span>
                  <span className="ob-type-desc">{desc}</span>
                  <span className="ob-type-check">{types.includes(id) ? "✓" : ""}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="ob-heading">
              <h1>What do you need in a space?</h1>
              <p>Toggle the features that matter to you.</p>
            </div>

            <div className="ob-feat-list">
              {FEATURES.map(({ id, icon, label, desc }) => (
                <button
                  key={id}
                  type="button"
                  className={`ob-feat-row ${isFeatureOn(id) ? "ob-feat-row--on" : ""}`}
                  onClick={() => toggleFeature(id)}
                >
                  <span className="ob-feat-icon">{icon}</span>
                  <span className="ob-feat-text">
                    <span className="ob-feat-label">{label}</span>
                    <span className="ob-feat-desc">{desc}</span>
                  </span>
                  <span className={`ob-toggle ${isFeatureOn(id) ? "ob-toggle--on" : ""}`}>
                    <span className="ob-toggle-knob" />
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

      </div>

      <div className="ob-footer">
        <button
          className="ob-btn-next"
          onClick={handleNext}
          disabled={step === 0 && types.length === 0}
        >
          {step === 0 ? "Continue" : "Go to map →"}
        </button>

        {/* let them skip the whole thing — we'll set sensible defaults */}
        <button className="ob-btn-skip" onClick={() => navigate("/map", { replace: true })}>
          Skip for now
        </button>
      </div>

    </div>
  );
}
