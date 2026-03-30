import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import "./HelpPage.css";

const FAQ = [
  {
    q: "How are quietness scores calculated?",
    a: "Scores are based on community ratings submitted by users. The average is updated every time someone rates a location.",
  },
  {
    q: "Is my data private?",
    a: "All your profile data, saved locations and ratings are stored locally on your device only. No account or personal information is required.",
  },
  {
    q: "How do I save a location?",
    a: "Open any location and tap the heart icon in the top right corner. Find all your saved locations under Profile → Saved Locations.",
  },
  {
    q: "How do I rate a place?",
    a: "Open a location and tap 'Rate this place' at the bottom. You can rate quietness, facilities and add a comment.",
  },
];

export default function HelpPage() {
  const navigate = useNavigate();

  return (
    <div className="hp-page">

      <div className="hp-header">
        <button className="hp-back" onClick={() => navigate("/profile")}>
          <ChevronLeft size={22} />
        </button>
        <span className="hp-heading">Help & Support</span>
      </div>

      {/* Contact */}
      <div className="hp-section">
        <div className="hp-section-title">Contact Us</div>
        <div className="hp-card">
          <a href="mailto:k2372662@kingston.ac.uk" className="hp-contact-row">
            <span>📧</span>
            <span>k2372662@kingston.ac.uk</span>
          </a>
          <div className="hp-divider" />
          <a href="https://github.com/pr0fa/silentspaces-web/issues" target="_blank" rel="noopener noreferrer" className="hp-contact-row">
            <span>🐛</span>
            <span>Report an issue on GitHub</span>
          </a>
        </div>
      </div>

      {/* FAQ */}
      <div className="hp-section">
        <div className="hp-section-title">Frequently Asked Questions</div>
        <div className="hp-card">
          {FAQ.map((item, i) => (
            <div key={i} className={`hp-faq-item ${i < FAQ.length - 1 ? "hp-faq-border" : ""}`}>
              <div className="hp-faq-q">❓ {item.q}</div>
              <div className="hp-faq-a">{item.a}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
