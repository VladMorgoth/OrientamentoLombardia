// Shell: cache-first (instant, offline).
// Dati scuole: stale-while-revalidate, cosi l'elenco si aggiorna da solo quando c'e' rete.
const VERSION = 'v1';
const SHELL_CACHE = 'shell-' + VERSION;
const DATA_CACHE = 'data-' + VERSION;

const SHELL = [
    './',
    './index.html',
    './catalogo.js',
    './app.js',
    './manifest.webmanifest',
    './icon.svg',
    './icon-maskable.svg'
];

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(SHELL_CACHE)
            .then(c => c.addAll(SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(k => k !== SHELL_CACHE && k !== DATA_CACHE).map(k => caches.delete(k))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', e => {
    const req = e.request;
    if (req.method !== 'GET') return;

    const url = new URL(req.url);
    if (url.origin !== self.location.origin) return;   // CDN: lascia fare al browser

    if (url.pathname.includes('/data/')) {
        e.respondWith(staleWhileRevalidate(req));
    } else {
        e.respondWith(cacheFirst(req));
    }
});

async function cacheFirst(req) {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
        const res = await fetch(req);
        if (res.ok) (await caches.open(SHELL_CACHE)).put(req, res.clone());
        return res;
    } catch (err) {
        const fallback = await caches.match('./index.html');
        if (fallback) return fallback;
        throw err;
    }
}

async function staleWhileRevalidate(req) {
    const cache = await caches.open(DATA_CACHE);
    const cached = await cache.match(req);

    const refresh = fetch(req)
        .then(res => { if (res.ok) cache.put(req, res.clone()); return res; })
        .catch(() => null);

    if (cached) { refresh; return cached; }

    const res = await refresh;
    if (res) return res;
    return new Response(JSON.stringify({ error: 'offline' }), {
        status: 503, headers: { 'Content-Type': 'application/json' }
    });
}
