import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { submitRating } from "../../models/ratingModel";
import { getLocationById } from "../../models/locationModel";
import toast from "react-hot-toast";
import { Wifi, Armchair, Check, X, ChevronLeft } from "lucide-react";
import "./RatePage.css";
import LoadingScreen from "../../views/LoadingScreen/LoadingScreen";

const LS_MY_RATINGS = "ss:myRatings";

function saveRatingToLocal(locationId, rating, comment, bestTime) {
  const existing = JSON.parse(localStorage.getItem(LS_MY_RATINGS) || "[]");
  const filtered = existing.filter((r) => r.locationId !== locationId);
  filtered.push({ locationId, rating, comment, bestTime, createdAt: new Date().toISOString() });
  localStorage.setItem(LS_MY_RATINGS, JSON.stringify(filtered));
}

export default function RatePage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loc, setLoc]                   = useState(null);
  const [loading, setLoading]           = useState(true);
  const [stars, setStars]               = useState(0);
  const [wifiAvailable, setWifiAvailable]     = useState(null);
  const [seatingAvailable, setSeatingAvailable] = useState(null);
  const [bestTime, setBestTime]         = useState("");
  const [comments, setComments]         = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getLocationById(id)
      .then((data) => { if (alive) setLoc(data); })
      .catch(() => { if (alive) setLoc(null); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [id]);

  const ratingLabel = useMemo(() => {
    if (stars === 0) return "";
    if (stars <= 2)  return "Not quiet";
    if (stars === 3) return "Okay";
    if (stars === 4) return "Quiet";
    return "Very Quiet";
  }, [stars]);

  if (loading) return <LoadingScreen />;
  if (!loc)    return <div className="rp-state">Location not found.</div>;

  const canSubmit = stars > 0 && !isSubmitting;

  const onSubmit = async () => {
    if (!canSubmit) return;
    try {
      setIsSubmitting(true);
      await submitRating(loc.id, stars, comments, bestTime);
      saveRatingToLocal(loc.id, stars, comments, bestTime);
      toast.success("Rating submitted!");
      navigate("/map");
    } catch (err) {
      toast.error(err.message || "Failed to submit rating");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rp-page">

      <div className="rp-header">
        <button className="rp-back" onClick={() => navigate(-1)}><ChevronLeft size={28} /></button>
        <div>
          <div className="rp-heading">Rate Location</div>
          <div className="rp-location-name">{loc.name}</div>
        </div>
      </div>

      <div className="rp-card">

      <div className="rp-block">
        <div className="rp-question">How quiet is this space?</div>
        <div className="rp-starsRow">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setStars(n)}
              className={`rp-star ${n <= stars ? "is-active" : ""}`}
            >
              ★
            </button>
          ))}
        </div>
        {ratingLabel && <div className="rp-label">{ratingLabel}</div>}
      </div>

      <div className="rp-block">
        <div className="rp-question">Wi-Fi Available?</div>
        <div className="rp-toggleRow">
          <button type="button" className={`rp-toggle ${wifiAvailable === true  ? "is-active" : ""}`} onClick={() => setWifiAvailable(true)}><Wifi size={15} /> Yes</button>
          <button type="button" className={`rp-toggle ${wifiAvailable === false ? "is-active" : ""}`} onClick={() => setWifiAvailable(false)}><X size={15} /> No</button>
        </div>
      </div>

      <div className="rp-block">
        <div className="rp-question">Seating Available?</div>
        <div className="rp-toggleRow">
          <button type="button" className={`rp-toggle ${seatingAvailable === true  ? "is-active" : ""}`} onClick={() => setSeatingAvailable(true)}><Armchair size={15} /> Yes</button>
          <button type="button" className={`rp-toggle ${seatingAvailable === false ? "is-active" : ""}`} onClick={() => setSeatingAvailable(false)}><X size={15} /> No</button>
        </div>
      </div>

      <div className="rp-block">
        <div className="rp-question">Best time to visit?</div>
        <div className="rp-toggleRow">
          {[
            { label: "Morning",   icon: "🌅" },
            { label: "Afternoon", icon: "☀️" },
            { label: "Evening",   icon: "🌙" },
            { label: "Weekends",  icon: "📅" },
          ].map(({ label, icon }) => (
            <button
              key={label}
              type="button"
              className={`rp-time-chip ${bestTime === label ? "is-active" : ""}`}
              onClick={() => setBestTime(bestTime === label ? "" : label)}
            >
              <span>{icon}</span> {label}
            </button>
          ))}
        </div>
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

      </div>{/* end rp-card */}

      <button type="button" onClick={onSubmit} disabled={!canSubmit} className={`rp-submit ${canSubmit ? "" : "is-disabled"}`}>
        {isSubmitting ? "Submitting..." : "Submit rating"}
      </button>

      {!stars && <div className="rp-hint">Pick a star rating to submit.</div>}

    </div>
  );
}
