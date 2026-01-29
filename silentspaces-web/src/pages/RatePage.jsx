import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { submitRating } from "../api/ratingsApi";
import { getLocationById } from "../api/locationsApi";
import "./styles/RatePage.css";

export default function RatePage() {
  const navigate = useNavigate();
  const { id } = useParams();

  // Location loaded from backend so the header matches the selected item
  const [loc, setLoc] = useState(null);
  const [loading, setLoading] = useState(true);

  // Ratings UI state
  const [stars, setStars] = useState(0);

  // Yes/No toggles (null means “not answered yet”).
  const [wifiAvailable, setWifiAvailable] = useState(null); // true/false/null
  const [seatingAvailable, setSeatingAvailable] = useState(null);

  // simple “select time” input.
  const [bestTime, setBestTime] = useState("");

  const [comments, setComments] = useState("");

  // Submitting state so user can’t spam-submit
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load location when route id changes
  useEffect(() => {
    let alive = true;

    setLoading(true);

    getLocationById(id)
      .then((data) => {
        if (!alive) return;
        setLoc(data);
      })
      .catch(() => {
        if (!alive) return;
        setLoc(null);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [id]);

  // Simple label so users understand what their star pick means.
  const ratingLabel = useMemo(() => {
    if (stars === 0) return "";
    if (stars <= 2) return "Not quiet";
    if (stars === 3) return "Okay";
    if (stars === 4) return "Quiet";
    return "Very Quiet";
  }, [stars]);

  if (loading) {
    return <div className="rp-state">Loading…</div>;
  }

  if (!loc) {
    return <div className="rp-state">Location not found.</div>;
  }

  // keeping it minimal for now
  const canSubmit = stars > 0 && !isSubmitting;

  const onSubmit = async () => {
    if (!canSubmit) return;

    try {
      setIsSubmitting(true);

      // send stars + comments only
      // Backend expects: { rating, comment }
      await submitRating(loc.id, stars, comments);

      alert("Rating submitted ✅");

      // Send user back to details after submission.
      navigate(`/location/${loc.id}`);
    } catch (err) {
      alert(err.message || "Failed to submit rating");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rp-page">
      <button onClick={() => navigate(-1)} className="rp-back">
        ← Back
      </button>

      <h2 className="rp-title">Rate location</h2>
      <div className="rp-subtitle">{loc.name}</div>

      <div className="rp-block">
        <div className="rp-question">How quiet is this space?</div>

        <div className="rp-starsRow">
          {[1, 2, 3, 4, 5].map((n) => {
            const active = n <= stars;
            return (
              <button
                key={n}
                type="button"
                onClick={() => setStars(n)}
                className={`rp-star ${active ? "is-active" : ""}`}
                aria-label={`Rate ${n} star`}
              >
                ★
              </button>
            );
          })}
        </div>

        {ratingLabel && <div className="rp-label">{ratingLabel}</div>}
      </div>

      <div className="rp-block">
        <div className="rp-question">Wi-Fi Available?</div>
        <div className="rp-toggleRow">
          <button
            type="button"
            className={`rp-toggle ${wifiAvailable === true ? "is-active" : ""}`}
            onClick={() => setWifiAvailable(true)}
          >
            Yes
          </button>
          <button
            type="button"
            className={`rp-toggle ${wifiAvailable === false ? "is-active" : ""}`}
            onClick={() => setWifiAvailable(false)}
          >
            No
          </button>
        </div>
      </div>

      <div className="rp-block">
        <div className="rp-question">Seating Available?</div>
        <div className="rp-toggleRow">
          <button
            type="button"
            className={`rp-toggle ${
              seatingAvailable === true ? "is-active" : ""
            }`}
            onClick={() => setSeatingAvailable(true)}
          >
            Yes
          </button>
          <button
            type="button"
            className={`rp-toggle ${
              seatingAvailable === false ? "is-active" : ""
            }`}
            onClick={() => setSeatingAvailable(false)}
          >
            No
          </button>
        </div>
      </div>

      <div className="rp-block">
        <div className="rp-question">Best time to visit?</div>

        {/* Simple dropdown for now. Later I will replace with a time picker. */}
        <select
          value={bestTime}
          onChange={(e) => setBestTime(e.target.value)}
          className="rp-select"
        >
          <option value="">Select time</option>
          <option value="Morning">Morning</option>
          <option value="Afternoon">Afternoon</option>
          <option value="Evening">Evening</option>
        </select>
      </div>

      <div className="rp-block">
        <div className="rp-question">Additional comments</div>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Share your experience..."
          rows={4}
          className="rp-textarea"
        />
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit}
        className={`rp-submit ${canSubmit ? "" : "is-disabled"}`}
      >
        {isSubmitting ? "Submitting..." : "Submit rating"}
      </button>

      {!stars && (
        <div className="rp-hint">Pick a star rating to submit.</div>
      )}
    </div>
  );
}
