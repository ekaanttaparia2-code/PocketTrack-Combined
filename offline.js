/* PocketTrack Offline-First status (Phase 2)
   Firestore's own IndexedDB persistence (enabled in firebase.js) already handles
   the hard parts: local cache, write queue, auto-reconnect sync, and duplicate-write
   protection (client-generated doc IDs mean a queued .add() never double-inserts).
   This file's only job is to surface accurate status to the user — it does not
   re-implement any syncing itself. */

const pendingWriteState = { entries:false, events:false };

function computeSyncLabel(){
  if(!navigator.onLine){
    return currentLang==='hi' ? '📴 ऑफ़लाइन' : '📴 Offline';
  }
  const anyPending = pendingWriteState.entries || pendingWriteState.events;
  if(anyPending){
    return currentLang==='hi' ? '⏳ सिंक हो रहा है…' : '⏳ Syncing…';
  }
  return currentLang==='hi' ? '✅ सिंक' : '✅ Synced';
}

function computeSyncDetail(){
  if(!navigator.onLine){
    return currentLang==='hi' ? 'ऑफ़लाइन हैं — बदलाव सेव हैं, वापस आते ही सिंक होंगे' : 'Offline — changes are safe and will sync when you reconnect';
  }
  const anyPending = pendingWriteState.entries || pendingWriteState.events;
  if(anyPending){
    return currentLang==='hi' ? 'आपके बदलाव क्लाउड पर सेव हो रहे हैं' : 'Your latest changes are being saved to the cloud';
  }
  return currentLang==='hi' ? 'सब कुछ क्लाउड से सिंक है' : 'Everything is synced to the cloud';
}

function updateSyncIndicator(){
  const el = document.getElementById('sync-status');
  if(!el || !currentUser) return;
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
