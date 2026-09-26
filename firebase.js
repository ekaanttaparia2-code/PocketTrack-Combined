/* Firebase configuration and service initialization. */

// --- Firebase setup ---
const firebaseConfig = {
  apiKey: "AIzaSyCxs1ltKht43N9JuwAIKymk0drlGsjxCvM",
  authDomain: "pockettrack-23776.firebaseapp.com",
  projectId: "pockettrack-23776",
  storageBucket: "pockettrack-23776.firebasestorage.app",
  messagingSenderId: "376126656745",
  appId: "1:376126656745:web:58a906c7a272d058d6e078",
  measurementId: "G-89ZKVRGJ6R"
};
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
