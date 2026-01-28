import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {  // Forward API calls during development so the frontend can call /api
              // without hardcoding the backend URL or dealing with CORS.
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true
      }
    }
  }
});
