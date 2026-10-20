/// <reference lib="webworker" />
import { clientsClaim } from "workbox-core";
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { NetworkFirst } from "workbox-strategies";

declare const self: ServiceWorkerGlobalScope;

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// SPA : toutes les navigations servent index.html (sauf l'API)
registerRoute(
  new NavigationRoute(createHandlerBoundToURL("/index.html"), {
    denylist: [/^\/api\//, /^\/ws/],
  }),
);

// API en lecture : réseau d'abord, cache si hors-ligne ou lent.
// Jamais l'auth : une vieille réponse « pas de session » déconnecterait l'app hors-ligne.
registerRoute(
  ({ url, request }) =>
    request.method === "GET" &&
    url.pathname.startsWith("/api/") &&
    !url.pathname.startsWith("/api/auth/") &&
    !url.pathname.startsWith("/api/search"),
  new NetworkFirst({ cacheName: "api", networkTimeoutSeconds: 3 }),
);
