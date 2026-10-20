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

// --- Notifications push ---
interface PushPayload {
  title: string;
  body: string;
  url: string;
  tag: string;
}

self.addEventListener("push", (event) => {
  const data = (event.data?.json() ?? {}) as Partial<PushPayload>;
  event.waitUntil(
    self.registration.showNotification(data.title ?? "Noo", {
      body: data.body,
      tag: data.tag,
      icon: "/pwa-192x192.png",
      badge: "/pwa-64x64.png",
      data: { url: data.url ?? "/" },
    }),
  );
});

// Ouvre (ou ramène au premier plan) l'app sur la bonne page
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL((event.notification.data?.url as string) ?? "/", self.location.origin).href;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const existing = windows.find((w) => w.url.startsWith(self.location.origin));
      if (existing) {
        await existing.focus();
        return existing.navigate(url);
      }
      return self.clients.openWindow(url);
    })(),
  );
});
