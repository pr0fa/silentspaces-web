import "./LoadingScreen.css";

export default function LoadingScreen({ message = "Finding quiet spaces..." }) {
  return (
    <div className="ls-overlay">
      <div className="ls-card">
        <div className="ls-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div className="ls-title">SilentSpaces</div>
        <div className="ls-message">{message}</div>
      </div>
    </div>
  );
}
