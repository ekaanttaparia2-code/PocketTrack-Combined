/* PocketTrack Offline-First status (Phase 2)
   Firestore's own IndexedDB persistence (enabled in firebase.js) already handles
   the hard parts: local cache, write queue, auto-reconnect sync, and duplicate-write
   protection (client-generated doc IDs mean a queued .add() never double-inserts).
   This file's only job is to surface accurate status to the user — it does not
   re-implement any syncing itself. */

const pendingWriteState = { entries:false, events:false };

function isHindi(){
  return (typeof currentLang !== 'undefined' && currentLang === 'hi') ||
         (typeof window !== 'undefined' && window.currentLang === 'hi') ||
         (typeof localStorage !== 'undefined' && localStorage.getItem('pockettrack_lang') === 'hi');
}

function computeSyncLabel(){
  if(!navigator.onLine){
    return isHindi() ? '📴 ऑफ़लाइन' : '📴 Offline';
  }
  const anyPending = pendingWriteState.entries || pendingWriteState.events;
  if(anyPending){
    return isHindi() ? '⏳ सिंक हो रहा है…' : '⏳ Syncing…';
  }
  return isHindi() ? '✅ सिंक' : '✅ Synced';
}

function computeSyncDetail(){
  if(!navigator.onLine){
    return isHindi() ? 'ऑफ़लाइन हैं — बदलाव सेव हैं, वापस आते ही सिंक होंगे' : 'Offline — changes are safe and will sync when you reconnect';
  }
  const anyPending = pendingWriteState.entries || pendingWriteState.events;
  if(anyPending){
    return isHindi() ? 'आपके बदलाव क्लाउड पर सेव हो रहे हैं' : 'Your latest changes are being saved to the cloud';
  }
  return isHindi() ? 'सब कुछ क्लाउड से सिंक है' : 'Everything is synced to the cloud';
}

function updateSyncIndicator(){
  const el = document.getElementById('sync-status');
  const user = (typeof currentUser !== 'undefined') ? currentUser : ((typeof window !== 'undefined') ? window.currentUser : null);
  if(!el || !user) return;
  el.textContent = computeSyncLabel();
  el.title = computeSyncDetail();
  const pill = el.closest('.pill');
  if(pill){
    pill.classList.toggle('pill-offline', !navigator.onLine);
    pill.classList.toggle('pill-syncing', navigator.onLine && (pendingWriteState.entries||pendingWriteState.events));
  }
}

window.addEventListener('online', updateSyncIndicator);
window.addEventListener('offline', updateSyncIndicator);
