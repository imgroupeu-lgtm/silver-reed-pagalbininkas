// Toveli – veikimas be interneto
const CACHE = 'srp-v33';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png'];
// Šriftai (fonts/*.woff2, failų vardai nekinta) – atskirame podėlyje 'purla-fonts', bendrame su spalvų programa: pirmiausia podėlis.
// Įdiegiant iš anksto įrašomi lotyniški šriftai (veikia be interneto iškart); kiti (kirilica, Lora) – kai pirmą kartą prireikia.
const FONT_CACHE = 'purla-fonts';
const FONTS = ['fraunces-500', 'fraunces-600', 'fraunces-700', 'fraunces-500i', 'nunito-400', 'nunito-600', 'nunito-700', 'nunito-800', 'dmmono-500'].map(n => './fonts/' + n + '-latin.woff2');
self.addEventListener('install', e => { e.waitUntil(Promise.all([
  caches.open(CACHE).then(c => c.addAll(SHELL)),
  caches.open(FONT_CACHE).then(c => Promise.all(FONTS.map(u => c.match(u).then(h => h || c.add(u)).catch(() => {}))))
]).then(() => self.skipWaiting())); });
// Ištrinami tik senesni šios programos podėliai (srp-v*); spalvų programos ir šriftų podėliai paliekami.
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => /^srp-v\d+$/.test(k) && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
function fontFetch(req) {
  return caches.open(FONT_CACHE).then(c => c.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(r => { if (r && r.ok) c.put(req, r.clone()).catch(() => {}); return r; })));
}
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
  const p = new URL(e.request.url).pathname;
  if (/\/i18n\/[a-z]{2}\.js$/.test(p)) { e.respondWith(i18nFetch(e.request)); return; }
  if (/\/fonts\/[a-z0-9-]+\.woff2$/.test(p)) { e.respondWith(fontFetch(e.request)); return; }
  e.respondWith(
    fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {}); return r; })
      .catch(() => caches.match(e.request).then(m => m || caches.match('./index.html')))
  );
});
