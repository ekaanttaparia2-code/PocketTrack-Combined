/* Firebase configuration and service initialization.
   API credentials are injected at deploy-time via GitHub Actions (never stored in source).
   For local development: copy config.example.js → config.js and add your values. */

// Guard: fail loudly if config was not injected rather than silently using a bad key
if (!window.APP_CONFIG || !window.APP_CONFIG.apiKey) {
  console.error('[PocketTrack] Firebase config missing. Copy config.example.js → config.js for local dev, or check GitHub Actions secrets for production.');
}

const firebaseConfig = window.APP_CONFIG || {};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// True offline-first: cache all synced data to IndexedDB and let the SDK queue
// writes made while offline, persisting the queue across app restarts (not just
// in-memory, which would lose pending changes if the app closes while offline).
db.enablePersistence({synchronizeTabs:true}).catch(err=>{
  if(err.code==='failed-precondition'){
    console.warn('Offline persistence: multiple tabs open without sync support — falling back to in-memory only.');
  } else if(err.code==='unimplemented'){
    console.warn('Offline persistence: not supported in this browser — falling back to in-memory only.');
  } else {
    console.warn('Offline persistence could not be enabled:', err.message);
  }
});
