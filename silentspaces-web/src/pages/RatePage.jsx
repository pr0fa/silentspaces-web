import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import locations from "../data/locations.mock.json";

export default function RatePage() {
  const navigate = useNavigate();
  const { id } = useParams();

  // Phase A: pull location name from local JSON so the page feels real.
  const loc = useMemo(() => locations.find((l) => l.id === id), [id]);

  const [stars, setStars] = useState(0);
  const [comments, setComments] = useState("");

  if (!loc) {
    return <div style={{ padding: 16 }}>Location not found.</div>;
  }

  const canSubmit = stars > 0;

  const onSubmit = () => {
    if (!canSubmit) return;

    // Phase A: mock submit only (no backend yet).
    alert("Rating submitted (mock) ✅");
    navigate(`/location/${loc.id}`);
  };

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
        <div style={{ fontWeight: 700, marginBottom: 8 }}>How quiet is it?</div>

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
