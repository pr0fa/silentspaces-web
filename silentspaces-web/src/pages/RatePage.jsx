import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import locations from "../data/locations.mock.json";

export default function RatePage() {
  const navigate = useNavigate();
  const { id } = useParams();

  // Pull location info from local data so the page feels real.
  const loc = useMemo(() => locations.find((l) => l.id === id), [id]);

  // Ratings UI state (not saved yet, just proving the flow works).
  const [stars, setStars] = useState(0);

  // Yes/No toggles (null means “not answered yet”).
  const [wifiAvailable, setWifiAvailable] = useState(null);   // true/false/null
  const [seatingAvailable, setSeatingAvailable] = useState(null);

  // simple “select time” input.
  const [bestTime, setBestTime] = useState("");

  const [comments, setComments] = useState("");

  // Simple label so users understand what their star pick means.
  const ratingLabel = useMemo(() => {
    if (stars === 0) return "";
    if (stars <= 2) return "Not quiet";
    if (stars === 3) return "Okay";
    if (stars === 4) return "Quiet";
    return "Very Quiet";
  }, [stars]);

  if (!loc) {
    return <div style={{ padding: 16 }}>Location not found.</div>;
  }

  const canSubmit = stars > 0; // keep it minimal for now

  const onSubmit = () => {
    if (!canSubmit) return;

    // Phase A: just prove submission flow works.
    // Later: POST /ratings with stars + wifi/seating + bestTime + comments.
    alert("Rating submitted (mock) ✅");

    // Send user back to details after submission.
    navigate(`/location/${loc.id}`);
  };

  const toggleStyle = (active) => ({
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid #ddd",
    cursor: "pointer",
    background: active ? "#111" : "#fff",
    color: active ? "#fff" : "#111",
    minWidth: 80,
    textAlign: "center"
  });

  const starStyle = (active) => ({
    width: 42,
    height: 42,
    borderRadius: 12,
    border: "1px solid #ddd",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    background: active ? "#111" : "#fff",
    color: active ? "#fff" : "#111"
  });

  return (
    <div style={{ padding: 16, maxWidth: 520, margin: "0 auto" }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: 12 }}>
        ← Back
      </button>

      <h2 style={{ margin: 0 }}>Rate location</h2>
      <div style={{ opacity: 0.8, marginTop: 6 }}>{loc.name}</div>

      <div style={{ marginTop: 18 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>How quiet is this space?</div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setStars(n)}
              style={starStyle(n <= stars)}
              aria-label={`Rate ${n} star`}
            >
              ★
            </button>
          ))}
        </div>

        {ratingLabel && (
          <div style={{ marginTop: 8, opacity: 0.8 }}>{ratingLabel}</div>
        )}
      </div>

      <div style={{ marginTop: 22 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Wi-Fi Available?</div>
        <div style={{ display: "flex", gap: 12 }}>
          <button type="button" style={toggleStyle(wifiAvailable === true)} onClick={() => setWifiAvailable(true)}>
            Yes
          </button>
          <button type="button" style={toggleStyle(wifiAvailable === false)} onClick={() => setWifiAvailable(false)}>
            No
          </button>
        </div>
      </div>

      <div style={{ marginTop: 22 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Seating Available?</div>
        <div style={{ display: "flex", gap: 12 }}>
          <button type="button" style={toggleStyle(seatingAvailable === true)} onClick={() => setSeatingAvailable(true)}>
            Yes
          </button>
          <button type="button" style={toggleStyle(seatingAvailable === false)} onClick={() => setSeatingAvailable(false)}>
            No
          </button>
        </div>
      </div>

      <div style={{ marginTop: 22 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Best time to visit?</div>

        {/* Simple dropdown for now. Later you can replace with a time picker. */}
        <select
          value={bestTime}
          onChange={(e) => setBestTime(e.target.value)}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 12,
            border: "1px solid #ddd",
            background: "#fff"
          }}
        >
          <option value="">Select time</option>
          <option value="Morning">Morning</option>
          <option value="Afternoon">Afternoon</option>
          <option value="Evening">Evening</option>
        </select>
      </div>

      <div style={{ marginTop: 22 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Additional comments</div>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Share your experience..."
          rows={4}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 12,
            border: "1px solid #ddd",
            resize: "vertical"
          }}
        />
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit}
        style={{
          marginTop: 22,
          width: "100%",
          padding: 12,
          borderRadius: 14,
          cursor: canSubmit ? "pointer" : "not-allowed",
          opacity: canSubmit ? 1 : 0.5
        }}
      >
        Submit rating
      </button>

      {!canSubmit && (
        <div style={{ marginTop: 10, fontSize: 13, opacity: 0.8 }}>
          Pick a star rating to submit.
        </div>
      )}
    </div>
  );
}
