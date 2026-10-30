const BUILD = '2026.10.30.2';
const PREFIX = 'hidden-faces-tv:';
const CACHE = PREFIX + BUILD;
const BASE = new URL('./', self.location.href);
const ASSETS = ["./", "index.html", "display.html", "releases/2026.10.30.2/locations.mjs", "releases/2026.10.30.2/offline.mjs", "releases/2026.10.30.2/photo-deck.mjs", "releases/2026.10.30.2/runtime.mjs", "releases/2026.10.30.2/setup.css", "releases/2026.10.30.2/setup.mjs", "releases/2026.10.30.2/tv.css", "releases/2026.10.30.2/tv.mjs", "releases/2026.10.30.1/assets/slides/education-center/slide-01.webp", "releases/2026.10.30.1/assets/slides/education-center/slide-02.webp", "releases/2026.10.30.1/assets/slides/education-center/slide-03.webp", "releases/2026.10.30.1/assets/slides/education-center/slide-04.webp", "releases/2026.10.30.1/assets/slides/education-center/slide-05.webp", "releases/2026.10.30.1/assets/slides/education-center/slide-06.webp", "releases/2026.10.30.1/assets/slides/fitness/slide-01.webp", "releases/2026.10.30.1/assets/slides/fitness/slide-02.webp", "releases/2026.10.30.1/assets/slides/fitness/slide-03.webp", "releases/2026.10.30.1/assets/slides/fitness/slide-04.webp", "releases/2026.10.30.1/assets/slides/fitness/slide-05.webp", "releases/2026.10.30.1/assets/slides/fitness/slide-06.webp", "releases/2026.10.30.1/assets/slides/general-store/slide-01.webp", "releases/2026.10.30.1/assets/slides/general-store/slide-02.webp", "releases/2026.10.30.1/assets/slides/general-store/slide-03.webp", "releases/2026.10.30.1/assets/slides/general-store/slide-04.webp", "releases/2026.10.30.1/assets/slides/general-store/slide-05.webp", "releases/2026.10.30.1/assets/slides/general-store/slide-06.webp", "releases/2026.10.30.1/assets/slides/living-room/slide-01.webp", "releases/2026.10.30.1/assets/slides/living-room/slide-02.webp", "releases/2026.10.30.1/assets/slides/living-room/slide-03.webp", "releases/2026.10.30.1/assets/slides/living-room/slide-04.webp", "releases/2026.10.30.1/assets/slides/living-room/slide-05.webp", "releases/2026.10.30.1/assets/slides/living-room/slide-06.webp", "releases/2026.10.30.1/assets/slides/wellness-center/slide-01.webp", "releases/2026.10.30.1/assets/slides/wellness-center/slide-02.webp", "releases/2026.10.30.1/assets/slides/wellness-center/slide-03.webp", "releases/2026.10.30.1/assets/slides/wellness-center/slide-04.webp", "releases/2026.10.30.1/assets/slides/wellness-center/slide-05.webp", "releases/2026.10.30.1/assets/slides/wellness-center/slide-06.webp"].map(file => new URL(file, BASE).href);
const ALLOWED = new Set(ASSETS);

self.addEventListener('install', event => event.waitUntil((async () => {
  const cache = await caches.open(CACHE);
  // Installation succeeds only after the complete menu, display and all decks save.
  await cache.addAll(ASSETS.map(url => new Request(url, {cache: 'reload'})));
  await self.skipWaiting();
})()));

self.addEventListener('activate', event => event.waitUntil((async () => {
  const previous = (await caches.keys()).filter(name => name.startsWith(PREFIX) && name !== CACHE);
  await Promise.all(previous.slice(0, -1).map(name => caches.delete(name)));
  await self.clients.claim();
})()));

self.addEventListener('message', event => {
  if (event.data?.type !== 'OFFLINE_STATUS' || !event.ports?.[0]) return;
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const complete = (await Promise.all(ASSETS.map(url => cache.match(url)))).every(Boolean);
    if (complete) event.ports[0].postMessage({type: 'OFFLINE_READY', build: BUILD});
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  // Guest photos, live feeds, other projects and private staff data stay online.
  if (request.method !== 'GET' || url.origin !== BASE.origin || !url.pathname.startsWith(BASE.pathname)) return;
  const canonical = new URL(url.pathname, BASE.origin).href;
  if (!ALLOWED.has(canonical)) return;
  if (request.mode === 'navigate' && url.searchParams.has('v') && url.searchParams.get('v') !== BUILD) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const saved = await cache.match(canonical);
    if (saved) return saved;
    const response = await fetch(request);
    if (response.ok) await cache.put(canonical, response.clone());
    return response;
  })());
});
