/*
  LoadingScreen.jsx
  a full-screen loading state used while data is being fetched or the map script
  is still loading. the message prop lets each page give a bit of context
  ("Loading the map..." vs "Finding quiet spaces...").
*/

import "./LoadingScreen.css";


export default function LoadingScreen({ message = "Finding quiet spaces..." }) {
  return (
    <div className="ls-overlay">
      <div className="ls-card">
        <div className="ls-dots">
          <span /><span /><span />
        </div>
        <div className="ls-title">SilentSpaces</div>
        <div className="ls-message">{message}</div>
      </div>
    </div>
  );
}
