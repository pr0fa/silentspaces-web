import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { submitRating } from "../api/ratingsApi";
import { getLocationById } from "../api/locationsApi";
import "./RatePage.css";
import toast, { Toaster } from "react-hot-toast";


// LocalStorage key for storing the user's rating history
const LS_MY_RATINGS = "ss:myRatings";

/**
 * Saves a rating locally so it can be displayed on the user's profile.
 * No backend login = local-only storage.
 * REFINED: Ensures only one rating per location per device.
 */
function saveRatingToLocal(locationId, rating, comment) {
  const existing = JSON.parse(localStorage.getItem(LS_MY_RATINGS) || "[]");

  const filtered = existing.filter((r) => r.locationId !== locationId);

  filtered.push({
    locationId,
    rating,
    comment,
    createdAt: new Date().toISOString()
  });

  localStorage.setItem(LS_MY_RATINGS, JSON.stringify(filtered));
}

export default function RatePage() {
  const navigate = useNavigate();
  const { id } = useParams();

  // Location details loaded from backend
  const [loc, setLoc] = useState(null);
  const [loading, setLoading] = useState(true);

  // Rating fields
  const [stars, setStars] = useState(0);
  const [wifiAvailable, setWifiAvailable] = useState(null);
  const [seatingAvailable, setSeatingAvailable] = useState(null);
  const [bestTime, setBestTime] = useState("");
  const [comments, setComments] = useState("");

  // Prevent spam submissions
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Load the selected location using its ID from params.
   * Ensures Rate Page always shows correct place.
   */
  useEffect(() => {
    let alive = true;
    setLoading(true);

    getLocationById(id)
      .then((data) => alive && setLoc(data))
      .catch(() => alive && setLoc(null))
      .finally(() => alive && setLoading(false));

    return () => (alive = false);
  }, [id]);

  /**
   * Converts star number.
   */
  const ratingLabel = useMemo(() => {
    if (stars === 0) return "";
    if (stars <= 2) return "Not quiet";
    if (stars === 3) return "Okay";
    if (stars === 4) return "Quiet";
    return "Very Quiet";
  }, [stars]);

  if (loading) return <div className="rp-state">Loading…</div>;
  if (!loc) return <div className="rp-state">Location not found.</div>;

  const canSubmit = stars > 0 && !isSubmitting;

  /**
   * Handles the rating submission:
   * - Sends to backend
   * - Saves locally for ProfilePage
   * - Returns user to details page
   */
  const onSubmit = async () => {
  if (!canSubmit) return;
  try {
    setIsSubmitting(true);

    //UPDATED: bestTime is now passed to backend
    await submitRating(loc.id, stars, comments, bestTime);

    // Save the rating locally so ProfilePage can track user submissions
    saveRatingToLocal(loc.id, stars, comments);

    toast.success("Rating submitted!");

    // NEW: Redirect user to Map instead of Details page
    navigate("/map");

  } catch (err) {
    alert(err.message || "Failed to submit rating");
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className="rp-page">
      {/* Back navigation */}
      <button onClick={() => navigate(-1)} className="rp-back">
        ← Back
      </button>

      <h2 className="rp-title">Rate location</h2>
      <div className="rp-subtitle">{loc.name}</div>

      {/* STAR RATING BLOCK */}
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

      {/* FACILITY QUESTIONS */}
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
            className={`rp-toggle ${seatingAvailable === true ? "is-active" : ""}`}
            onClick={() => setSeatingAvailable(true)}
          >
            Yes
          </button>

          <button
            type="button"
            className={`rp-toggle ${seatingAvailable === false ? "is-active" : ""}`}
            onClick={() => setSeatingAvailable(false)}
          >
            No
          </button>
        </div>
      </div>

      {/* BEST TIME */}
      <div className="rp-block">
        <div className="rp-question">Best time to visit?</div>

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

      {/* COMMENTS */}
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

      {/* SUBMIT BUTTON */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit}
        className={`rp-submit ${canSubmit ? "" : "is-disabled"}`}
      >
        {isSubmitting ? "Submitting..." : "Submit rating"}
      </button>

      {!stars && <div className="rp-hint">Pick a star rating to submit.</div>}
    </div>
  );
}
