/*
  main.jsx
  the very first thing that runs. all we do here is mount React onto the #root div,
  wrap it in BrowserRouter so react-router-dom works, and drop in an ErrorBoundary
  so a crash in one component doesn't wipe out the whole app. nothing fancy — clean launch pad.
*/

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import ErrorBoundary from "./views/ErrorBoundary/ErrorBoundary.jsx";
import "./index.css";


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>
);
