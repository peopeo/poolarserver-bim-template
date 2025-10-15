import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const API_BASE = process.env.VITE_API_BASE_URL || "http://localhost:5000";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": {
        target: API_BASE,
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, "")
      }
    }
  }
});
