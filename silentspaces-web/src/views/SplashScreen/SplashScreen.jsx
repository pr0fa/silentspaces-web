import "./SplashScreen.css";

export default function SplashScreen() {
  return (
    <div className="splash-overlay">
      <div className="splash-content">

        {/* Logo mark — map pin with sound waves */}
        <div className="splash-logo">
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Map pin body */}
            <path
              d="M36 6C24.95 6 16 14.95 16 26C16 40 36 66 36 66C36 66 56 40 56 26C56 14.95 47.05 6 36 6Z"
              fill="white"
              fillOpacity="0.95"
            />
            {/* Sound wave lines inside pin */}
            <line x1="29" y1="22" x2="29" y2="30" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="34" y1="19" x2="34" y2="33" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="39" y1="22" x2="39" y2="30" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="44" y1="24" x2="44" y2="28" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="24" y1="24" x2="24" y2="28" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </div>

        <div className="splash-title">SilentSpaces</div>
        <div className="splash-tagline">Find your quiet place</div>

      </div>
    </div>
  );
}
