/* Service worker : le jeu reste jouable sans reseau une fois installe.
   Le document passe par le reseau en priorite pour que les mises a jour
   arrivent vite ; les images et polices sont servies depuis le cache. */
const CACHE = 'classic-blocks-v3';
const FICHIERS = [
  "./",
  "index.html",
  "manifest.json",
  "icon-v2-192.png",
  "icon-v2-512.png",
  "icon-v2-maskable-512.png",
  "assets/blocs/bloc-ambre.png",
  "assets/blocs/bloc-bleu.png",
  "assets/blocs/bloc-jaune.png",
  "assets/blocs/bloc-orange.png",
  "assets/blocs/bloc-rose.png",
  "assets/blocs/bloc-rouge.png",
  "assets/blocs/bloc-turquoise.png",
  "assets/blocs/bloc-vert.png",
  "assets/blocs/bloc-violet.png",
  "assets/decor/gemmes-droite.png",
  "assets/decor/gemmes-gauche.png",
  "assets/panneaux/bouton-poser-enfonce.png",
  "assets/panneaux/bouton-poser.png",
  "assets/panneaux/panneau-carte-carree.png",
  "assets/panneaux/panneau-pilule-courte.png",
  "assets/panneaux/panneau-pilule-longue.png",
  "assets/panneaux/panneau-plateau.png",
  "assets/touches/touche-bas.png",
  "assets/touches/touche-droite.png",
  "assets/touches/touche-gauche.png",
  "assets/touches/touche-pause.png",
  "assets/touches/touche-reglages.png",
  "assets/touches/touche-rotation.png",
  "assets/fonts/fredoka-500.woff2",
  "assets/fonts/fredoka-600.woff2",
  "assets/fonts/fredoka-700.woff2"
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      // addAll echoue en bloc si un seul fichier manque : on les ajoute un par un
      .then(c => Promise.all(FICHIERS.map(f => c.add(f).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

  // document : reseau d'abord, cache en secours si hors ligne
  if (req.mode === 'navigate' || req.destination === 'document') {
    e.respondWith(
      fetch(req)
        .then(r => {
          const copie = r.clone();
          caches.open(CACHE).then(c => c.put(req, copie)).catch(() => {});
          return r;
        })
        .catch(() => caches.match(req).then(r => r || caches.match('index.html')))
    );
    return;
  }

  // reste : cache d'abord, puis reseau
  e.respondWith(
    caches.match(req).then(r => r || fetch(req).then(resp => {
      if (resp && resp.ok) {
        const copie = resp.clone();
        caches.open(CACHE).then(c => c.put(req, copie)).catch(() => {});
      }
      return resp;
    }))
  );
});
