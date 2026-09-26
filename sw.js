const CACHE = 'pockettrack-v14-full-suite';
const SHELL = [
  './',
  './index.html',
  './app.html',
  './landing.html',
  './styles.css',
  './icons.css',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-192.png',
  './icon-maskable-512.png',
  './firebase.js',
  './offline.js',
  './animations.js',
  './aurasense.js',
  './smart_engine.js',
  './app.js',
  './transactions.js',
  './auth.js',
  './onboarding.js',
  './voice.js',
  './ledger.js',
  './recurring.js',
  './reports.js',
  './monetization.js',
  './financial_dna.js',
  './wrapped.js',
  './shared_portfolios.js',
  './daily_burn_meter.js',
  './digital_vault.js',
  './upi_qr_generator.js',
  './goal_sip_planner.js',
  './NotoSansDevanagari-Regular.ttf'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => Promise.allSettled(SHELL.map((u) => c.add(u)))).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // Never intercept or cache cross-origin traffic (Firebase Auth/Firestore long-polls, CDNs)
  try { if (new URL(req.url).origin !== self.location.origin) return; } catch (err) { return; }
  // Network-first, then cache fallback (so pushes of updated files show online, cached offline)
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('./')))
  );
});