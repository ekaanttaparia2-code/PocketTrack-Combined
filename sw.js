const CACHE = 'pockettrack-v22-authready';
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
  './config.js',
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
  './upi_qr_generator.js',
  './goal_sip_planner.js',
  './finny.js',
  './envelopes.js',
  './fire_runway.js',
  './wealth_simulator.js',
  './debt_payoff.js',
  './receipt_scanner.js',
  './wallets.js',
  './NotoSansDevanagari-Regular.ttf',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js'
];

const TRUSTED_CDN_ORIGINS = [
  'https://cdnjs.cloudflare.com',
  'https://www.gstatic.com',
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
  'https://cdn.jsdelivr.net'
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

  let url;
  try {
    url = new URL(req.url);
  } catch (err) {
    return;
  }

  const isSameOrigin = (url.origin === self.location.origin);
  const isTrustedCdn = TRUSTED_CDN_ORIGINS.includes(url.origin);

  if (!isSameOrigin && !isTrustedCdn) return;

  // Never intercept or cache dynamic Firebase Auth/Firestore streaming/REST endpoints
  if (url.hostname.includes('firebaseio.com') ||
      url.pathname.includes('/google.firestore.') ||
      url.hostname.includes('identitytoolkit.googleapis.com') ||
      url.hostname.includes('securetoken.googleapis.com')) {
    return;
  }
  // Stale-While-Revalidate (SWR) strategy: instant load from cache while updating in background
  e.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req).then((networkRes) => {
        if (networkRes && networkRes.status === 200) {
          const copy = networkRes.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return networkRes;
      }).catch(() => null);

      return cached || fetchPromise.then((res) => res || caches.match('./'));
    })
  );
});