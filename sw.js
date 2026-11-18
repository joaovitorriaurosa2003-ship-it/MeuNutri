/* MeuNutri Cozinha: service worker (abre o app mesmo sem internet; os dados continuam vindo do Firebase) */
const VERSAO = 'meunutri-v2';
const CDN = ['cdnjs.cloudflare.com', 'unpkg.com', 'www.gstatic.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(['./', './index.html', './manifest.json', './icons/icon-192.png'])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // página e arquivos do app: tenta a rede primeiro (pega atualização), cai no cache se estiver offline
    e.respondWith(fetch(req).then(r => { if (r.ok) { const c = r.clone(); caches.open(VERSAO).then(x => x.put(req, c)); } return r; })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
  } else if (CDN.includes(url.hostname) && !url.pathname.includes('/v1/')) {
    // bibliotecas (React, Firebase, leitor, fontes): cache primeiro, versões fixas
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => { if (res.ok || res.type === 'opaque') { const c = res.clone(); caches.open(VERSAO).then(x => x.put(req, c)); } return res; })));
  }
  // Firestore, login e Open Food Facts passam direto pela rede
});
