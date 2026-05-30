// Service worker for SealQR — rebuild-safe caching.
//
// The previous version precached "/" and served *all* assets cache-first under a
// fixed cache name, so after a redeploy returning users could boot a stale HTML
// shell that referenced 404'd JS chunks → the app never hydrated and looked dead
// ("after a rebuild, nothing works"). This version is safe by construction:
//   • Navigations are network-first and fall back to a static offline page only
//     when truly offline — never a cached app shell.
//   • Only Next's immutable, content-hashed assets (/_next/static/*) are cached,
//     cache-first. New builds emit new filenames, so a cached asset can't go stale.
//   • Everything else goes straight to the network.
const CACHE = "sealqr-v2";
const OFFLINE = "/offline.html";
const PRECACHE = [OFFLINE, "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigations: always try the network, fall back to the offline page when
  // offline. Never serve a cached HTML shell — it would reference old chunks.
  if (request.mode === "navigate") {
    e.respondWith(fetch(request).catch(() => caches.match(OFFLINE)));
    return;
  }

  // Immutable hashed assets: cache-first (filenames change every build, so safe).
  if (url.pathname.startsWith("/_next/static/")) {
    e.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
            return res;
          }),
      ),
    );
    return;
  }

  // Precached shell (icon/manifest): cache-first; everything else: network.
  e.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
});
