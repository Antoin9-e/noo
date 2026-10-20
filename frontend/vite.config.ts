import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

const API = process.env.API_URL ?? "http://localhost:3000";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "autoUpdate",
      injectRegister: false,
      pwaAssets: { config: true },
      manifest: {
        name: "Noo",
        short_name: "Noo",
        description: "Votre petit monde à deux : agenda, envies et soirées.",
        lang: "fr",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        theme_color: "#fbf7f2",
        background_color: "#fbf7f2",
      },
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 800,
  },
  server: {
    host: true, // accessible depuis le téléphone sur le même wifi
    allowedHosts: [".trycloudflare.com"],
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
