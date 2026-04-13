/*
  ErrorBoundary.jsx
  catches any unhandled React rendering errors and shows a friendly fallback
  instead of a blank screen. wraps the entire app in main.jsx.

  this is a class component because React error boundaries can't be written
  as function components (no hook equivalent for componentDidCatch yet).
*/

import { Component } from "react";


export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    // flip the flag — next render will show the fallback UI
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display:        "flex",
          flexDirection:  "column",
          alignItems:     "center",
          justifyContent: "center",
          minHeight:      "60vh",
          padding:        "32px",
          textAlign:      "center",
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>😔</div>

          <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a", marginBottom: 8 }}>
            Something went wrong
          </div>

          <div style={{ fontSize: 14, color: "#888", marginBottom: 24 }}>
            We couldn't load this page. Please try again.
          </div>

          <button
            onClick={() => window.location.reload()}
            style={{
              padding:      "10px 24px",
              background:   "#5B21B6",
              color:        "#fff",
              border:       "none",
              borderRadius: "999px",
              fontSize:     14,
              fontWeight:   600,
              cursor:       "pointer",
            }}
          >
            Reload app
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
