// Silver Reed pagalbininkas – veikimas be interneto
const CACHE = 'srp-v19';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== I18N_CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
// Kalbų žodynai (i18n/<kalba>.js?v=...) – atskirame podėlyje, kuris neištrinamas keičiant versiją:
// pirmiausia podėlis; jei nėra – tinklas (senos to paties failo versijos išmetamos); be interneto – bet kuri turima versija.
const I18N_CACHE = 'srp-i18n';
function i18nFetch(req) {
  return caches.open(I18N_CACHE).then(c => c.match(req).then(hit => hit || fetch(req).then(r => {
    if (r && r.ok) {
      const copy = r.clone(), path = new URL(req.url).pathname;
      c.keys().then(ks => Promise.all(ks.filter(k => new URL(k.url).pathname === path && k.url !== req.url).map(k => c.delete(k))))
        .then(() => c.put(req, copy)).catch(() => {});
    }
    return r;
  }).catch(() => c.match(req, { ignoreSearch: true }).then(m => m || Response.error()))));
}
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (/\/i18n\/[a-z]{2}\.js$/.test(new URL(e.request.url).pathname)) { e.respondWith(i18nFetch(e.request)); return; }
  e.respondWith(
    fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {}); return r; })
      .catch(() => caches.match(e.request).then(m => m || caches.match('./index.html')))
  );
});
