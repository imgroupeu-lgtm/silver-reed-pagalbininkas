// Silver Reed pagalbininkas – veikimas be interneto
const CACHE = 'spalvos-v27';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
// Ištrinami tik senesni spalvų programos podėliai (spalvos-v*); Toveli (srp-*) ir šriftų podėliai paliekami.
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => /^spalvos-v\d+$/.test(k) && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
// Šriftai (../fonts/*.woff2) – bendras su Toveli podėlis 'purla-fonts': pirmiausia podėlis, tada tinklas.
const FONT_CACHE = 'purla-fonts';
function fontFetch(req) {
  return caches.open(FONT_CACHE).then(c => c.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(r => { if (r && r.ok) c.put(req, r.clone()).catch(() => {}); return r; })));
}
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (/\/fonts\/[a-z0-9-]+\.woff2$/.test(new URL(e.request.url).pathname)) { e.respondWith(fontFetch(e.request)); return; }
  e.respondWith(
    fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {}); return r; })
      .catch(() => caches.match(e.request).then(m => m || caches.match('./index.html')))
  );
});
