import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const API = process.env.API_URL ?? "http://localhost:3000";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true, // accessible depuis le téléphone sur le même wifi
    proxy: {
      "/api": {
        target: API,
        // En dev, Better-Auth fait confiance à sa propre origine : on la présente
        // pour que localhost, l'IP du PC et un tunnel HTTPS fonctionnent tous.
        configure: (proxy) => {
          proxy.on("proxyReq", (req) => req.setHeader("origin", API));
        },
      },
      "/ws": { target: API.replace(/^http/, "ws"), ws: true },
    },
  },
});
