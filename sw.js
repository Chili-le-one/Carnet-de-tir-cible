/* Service worker : permet d'utiliser le carnet hors ligne.
   La page est toujours rechargée depuis le réseau quand il y en a un (les mises à jour
   apparaissent donc dès l'ouverture suivante) ; le cache ne sert qu'en secours hors ligne.
   Changez le numéro de version ci-dessous à chaque mise à jour de l'application. */
const CACHE = 'carnet-tir-cible-v17';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './i18n.js', './themes.css', './style.css', './app.js', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(ASSETS.map(f => c.add(f).catch(() => {})))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    // Réseau d'abord, mais au plus 3 s : en salle, une connexion lente ne doit pas bloquer l'appli.
    const res = await Promise.race([
      fetch(req, { cache: 'no-cache' }),
      new Promise((_, reject) => setTimeout(reject, 3000))
    ]);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    return (await cache.match(req, { ignoreSearch: true })) || (await cache.match('./index.html')) || Response.error();
  }
}

async function cacheFirst(req) {
  const hit = await caches.match(req, { ignoreSearch: true });
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) { const c = await caches.open(CACHE); c.put(req, res.clone()); }
  return res;
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const isPage = req.mode === 'navigate' || ['document', 'script', 'style', 'manifest'].includes(req.destination);
  e.respondWith(isPage ? networkFirst(req) : cacheFirst(req));
});
