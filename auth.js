/* Authentication flows and signed-in state handling. */

function getAuth(){
  if (typeof window !== 'undefined' && window.auth) return window.auth;
  if (typeof auth !== 'undefined' && auth) return auth;
  if (typeof firebase !== 'undefined' && typeof firebase.auth === 'function') {
    try {
      const a = firebase.auth();
      if (typeof window !== 'undefined') window.auth = a;
      return a;
    } catch(e) {
      return null;
    }
  }
  return null;
}
window.getAuth = getAuth;

function setAuthButtonsLoading(isLoading){
  const loginBtn=document.getElementById('auth-login-btn');
  const signupBtn=document.getElementById('auth-signup-btn');
  [loginBtn, signupBtn].forEach(btn=>{
    btn.disabled = isLoading;
    btn.style.opacity = isLoading ? '0.6' : '1';
    btn.style.cursor = isLoading ? 'not-allowed' : 'pointer';
  });
}

function showAuthError(msg){
  const errEl=document.getElementById('auth-error');
  if(errEl){
    errEl.textContent=msg;
    errEl.style.display='flex';
  } else if(typeof toast==='function'){
    toast(msg,'error');
  }
}

function hideAuthError(){
  const errEl=document.getElementById('auth-error');
  if(errEl){
    errEl.textContent='';
    errEl.style.display='none';
  }
}

function promptConsentRequired(){
  const msg = (typeof currentLang !== 'undefined' && currentLang === 'hi')
    ? '⚠️ जारी रखने के लिए कृपया पुष्टि करें कि आप 18+ हैं और नियमों को स्वीकार करते हैं।'
    : '⚠️ Please check the box below to confirm you are 18+ and agree to the Terms.';
  showAuthError(msg);
  const box = document.getElementById('auth-consent-box');
  if(box){
    box.classList.remove('auth-consent-error');
    void box.offsetWidth;
    box.classList.add('auth-consent-error');
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function handleConsentChange(el){
  if(el && el.checked){
    hideAuthError();
    const box = document.getElementById('auth-consent-box');
    if(box) box.classList.remove('auth-consent-error');
  }
}
window.handleConsentChange = handleConsentChange;

async function authAction(mode){
  if (window._isAuthActionRunning) return;
  const emailEl = document.getElementById('auth-email');
  const passEl = document.getElementById('auth-pass');
  const email = emailEl ? emailEl.value.trim() : '';
  const pass = passEl ? passEl.value : '';
  hideAuthError();
  if(!email||!pass||pass.length<6){
    showAuthError(typeof currentLang !== 'undefined' && currentLang==='hi' ? 'सही ईमेल और कम से कम 6 अक्षरों का पासवर्ड डालें।' : 'Enter a valid email and a password with 6+ characters.');
    return;
  }
  if (mode === 'signup') {
    const consent = document.getElementById('auth-consent-check');
    if (consent && !consent.checked) {
      promptConsentRequired();
      return;
    }
  }
  const authInstance = getAuth();
  if(!authInstance){
    showAuthError(typeof currentLang !== 'undefined' && currentLang==='hi' ? 'प्रमाणीकरण सेवा उपलब्ध नहीं है।' : 'Authentication service is unavailable. Please reload.');
    return;
  }
  window._isAuthActionRunning = true;
  setAuthButtonsLoading(true);
  try {
    const action = mode==='login'
      ? authInstance.signInWithEmailAndPassword(email,pass)
      : authInstance.createUserWithEmailAndPassword(email,pass);
    const cred = await action;
    if(mode==='signup' && cred && cred.user && !cred.user.emailVerified){
      cred.user.sendEmailVerification().catch(e => console.warn('[Auth] Verification email delivery failed:', e && e.message ? e.message : e));
    }
  } catch(err) {
    showAuthError(err.message);
  } finally {
    setAuthButtonsLoading(false);
    window._isAuthActionRunning = false;
  }
}

function handleForgotPassword(){
  const email=document.getElementById('auth-email').value.trim();
  hideAuthError();
  if(!email){
    showAuthError(typeof currentLang !== 'undefined' && currentLang==='hi' ? 'पासवर्ड रीसेट लिंक पाने के लिए पहले अपना ईमेल डालें।' : 'Enter your email above first to get a reset link.');
    return;
  }
  const authInstance = getAuth();
  if(!authInstance){
    showAuthError('Authentication service is unavailable.');
    return;
  }
  authInstance.sendPasswordResetEmail(email).then(()=>{
    toast(typeof currentLang !== 'undefined' && currentLang==='hi' ? 'पासवर्ड रीसेट लिंक आपके ईमेल पर भेज दिया गया है' : 'Password reset link sent to your email', 'success');
  }).catch(err=>{
    showAuthError(err.message);
  });
}

function signInWithGoogle(){
  hideAuthError();
  const consent = document.getElementById('auth-consent-check');
  if (consent && !consent.checked) {
    promptConsentRequired();
    return;
  }
  const btn=document.getElementById('auth-google-btn');
  const originalHTML=btn ? btn.innerHTML : 'Continue with Google';
  if(btn){
    btn.disabled=true;
    btn.style.opacity='0.6';
    btn.innerHTML='<span class="mini-spinner"></span> ' + (typeof currentLang !== 'undefined' && currentLang === 'hi' ? 'कनेक्ट हो रहा है...' : 'Connecting...');
  }
  
  const authInstance = getAuth();
  if (!authInstance || typeof firebase === 'undefined' || !firebase.auth) {
    showAuthError(typeof currentLang !== 'undefined' && currentLang === 'hi' 
      ? 'Firebase उपलब्ध नहीं है। कृपया इंटरनेट कनेक्शन जांचें।' 
      : 'Firebase Authentication is unavailable. Please check your internet connection.');
    if(btn){
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.innerHTML = originalHTML;
    }
    return;
  }

  const provider = new firebase.auth.GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (isMobile) {
    authInstance.signInWithRedirect(provider).catch(err => {
      showAuthError(err.message || 'Google Sign-in failed. Please try email login.');
    });
    return; // Page will redirect
  }

  authInstance.signInWithPopup(provider).then(cred=>{
    hideAuthError();
  }).catch(err=>{
    if(err.code==='auth/popup-closed-by-user' || err.code==='auth/cancelled-popup-request'){
      // User voluntarily closed or cancelled the popup
      hideAuthError();
      return;
    }
    if(err.code==='auth/popup-blocked'){
      showAuthError(typeof currentLang !== 'undefined' && currentLang === 'hi'
        ? 'पॉपअप विंडो ब्लॉक हो गई। Google साइन-इन रीडायरेक्ट के ज़रिए खोला जा रहा है...'
        : 'Sign-in popup was blocked by your browser. Redirecting to Google...');
      authInstance.signInWithRedirect(provider).catch(redirErr=>{
        showAuthError(redirErr.message || 'Google Sign-in failed. Please try email login.');
      });
      return;
    }
    if (err.code === 'auth/unauthorized-domain') {
      showAuthError('This domain is not authorized in Firebase OAuth. Please add it in Firebase Console -> Auth -> Settings -> Authorized Domains.');
    } else {
      showAuthError(err.message || 'Google Sign-in failed. Please try again.');
    }
  }).finally(()=>{
    if(btn){
      btn.disabled=false;
      btn.style.opacity='1';
      btn.innerHTML=originalHTML;
    }
  });
}

function purgeUserLocalStorage(uid){
  const baseKeys = [
    'pockettrack_debts',
    'pockettrack_monthly_income',
    'pockettrack_user_upi_id',
    'pockettrack_finny_profile',
    'pockettrack_entries_cache',
    'pockettrack_wallets'
  ];
  baseKeys.forEach(k => {
    try {
      localStorage.removeItem(k);
      if (uid) localStorage.removeItem(k + '_' + uid);
    } catch(e) {}
  });
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (uid) {
        if (key.endsWith('_' + uid)) {
          localStorage.removeItem(key);
        }
      } else {
        if (
          key.startsWith('pockettrack_entries_cache_') ||
          key.startsWith('pockettrack_debts_') ||
          key.startsWith('pockettrack_monthly_income_') ||
          key.startsWith('pockettrack_user_upi_id_') ||
          key.startsWith('pockettrack_finny_profile_') ||
          key.startsWith('pockettrack_wallets_')
        ) {
          localStorage.removeItem(key);
        }
      }
    }
  } catch(e) {}
}
window.purgeUserLocalStorage = purgeUserLocalStorage;

function logOut(){
  showAppConfirm(currentLang==='hi'?'क्या आप लॉग आउट करना चाहते हैं?':'Log out?', ()=>{
    const uidToPurge = currentUser ? currentUser.uid : null;
    if(unsubscribeEntries) unsubscribeEntries();
    if(unsubscribeEvents) unsubscribeEvents();
    if(typeof resetLedgerLocal==='function') resetLedgerLocal();
    if(typeof resetRecurringLocal==='function') resetRecurringLocal();
    purgeUserLocalStorage(uidToPurge);
    const authObj = getAuth();
    if(authObj) authObj.signOut();
  });
}

function updateBottomBarVisibility(){
  const bar = document.getElementById('bottom-tab-bar');
  const voiceFab = document.getElementById('voice-fab');
  const authScreen = document.getElementById('auth-screen');
  const isAuthVisible = authScreen && authScreen.style.display !== 'none';
  const shouldShow = ((currentUser !== null || window.isGuestMode) && !isAuthVisible);
  if (bar) bar.style.display = shouldShow ? 'flex' : 'none';
  if (voiceFab) voiceFab.style.display = shouldShow ? 'flex' : 'none';
  if (document.body) document.body.classList.toggle('auth-active', !shouldShow);
}
window.updateBottomBarVisibility = updateBottomBarVisibility;

function continueAsGuest(){
  window.isGuestMode = true;
  try { localStorage.setItem('pockettrack_guest_mode', 'true'); } catch(e){}
  const authScreen = document.getElementById('auth-screen');
  if(authScreen) authScreen.style.display = 'none';
  updateBottomBarVisibility();
  const syncEl = document.getElementById('sync-status');
  if(syncEl) syncEl.textContent = (typeof currentLang!=='undefined' && currentLang==='hi') ? 'स्थानीय मोड' : 'Local';
  if(typeof listenToEntries === 'function') listenToEntries();
  if(typeof loadWallets === 'function') loadWallets();
  if(typeof renderWalletSwitcher === 'function') renderWalletSwitcher();
  if(typeof loadBudget === 'function') loadBudget();
  if(typeof updateHeaderStats === 'function') updateHeaderStats();
  if(typeof renderHomeSnapshot === 'function') renderHomeSnapshot();
  if(typeof renderEntries === 'function') renderEntries();
  if(typeof renderReport === 'function') renderReport();
  if(typeof updateVoiceFabVisibility === 'function') updateVoiceFabVisibility();
  if(typeof toast === 'function') {
    toast((typeof currentLang!=='undefined' && currentLang==='hi') ? 'अतिथि मोड सक्रिय — डेटा आपके डिवाइस पर सुरक्षित है' : 'Guest mode active — data saved locally on your device', 'info');
  }
}
window.continueAsGuest = continueAsGuest;

function openAuthScreen(){
  const authScreen = document.getElementById('auth-screen');
  if(authScreen) authScreen.style.display = 'flex';
  updateBottomBarVisibility();
}
window.openAuthScreen = openAuthScreen;

const authInit = getAuth();
if (authInit) {
  if (typeof authInit.getRedirectResult === 'function') {
    authInit.getRedirectResult().catch(err => {
      if (err && err.code !== 'auth/popup-closed-by-user') {
        const errEl = document.getElementById('auth-error');
        if (errEl && err.message) {
          errEl.textContent = err.message;
          errEl.style.display = 'block';
        }
      }
    });
  }

  authInit.onAuthStateChanged(user=>{
  if(user){
    currentUser=user;
    window.isGuestMode = false;
    try {
      const guestCache = localStorage.getItem('pockettrack_entries_cache_guest');
      if (guestCache) {
        const guestList = JSON.parse(guestCache);
        if (Array.isArray(guestList) && guestList.length > 0 && typeof db !== 'undefined') {
          const batch = db.batch();
          const userRef = db.collection('users').doc(user.uid);
          let count = 0;
          guestList.forEach(item => {
            const copy = { ...item };
            delete copy._id;
            delete copy._createdLocallyAt;
            const newRef = userRef.collection('entries').doc();
            batch.set(newRef, copy);
            count++;
          });
          batch.set(userRef, {
            entryCount: firebase.firestore.FieldValue.increment(count)
          }, {merge:true});
          batch.commit().then(() => {
            localStorage.removeItem('pockettrack_entries_cache_guest');
            localStorage.removeItem('pockettrack_guest_mode');
            if (typeof toast === 'function') {
              toast((typeof currentLang!=='undefined' && currentLang==='hi') ? 'अतिथि प्रविष्टियां आपके खाते में सिंक हो गईं!' : 'Guest entries synced to your account!', 'success');
            }
          }).catch(e => console.warn('Guest migration batch error:', e));
        }
      }
    } catch(e) {}
    if (typeof loadWallets === 'function') loadWallets();
    if (typeof renderWalletSwitcher === 'function') renderWalletSwitcher();
    document.getElementById('auth-screen').style.display='none';
    updateBottomBarVisibility();
    if(typeof updateSyncIndicator==='function') updateSyncIndicator();
    else document.getElementById('sync-status').textContent = (typeof currentLang!=='undefined' && currentLang==='hi') ? 'क्लाउड से जुड़ा' : 'Synced to cloud';
    listenToEntries();
    listenToEvents();
    if(typeof listenToLedger === 'function') listenToLedger();
    if(typeof listenToRecurring === 'function') listenToRecurring();
    if(typeof updateVoiceFabVisibility === 'function') updateVoiceFabVisibility();
    if(typeof updateAIWidgetVisibility === 'function') updateAIWidgetVisibility();
    loadBudget();
    if(typeof updateHeaderStats === 'function') updateHeaderStats();
    window.isProUser = false;
    if(typeof db!=='undefined' && typeof PT_STORE!=='undefined'){
      // Set up real-time listener for user document to catch Pro status changes
      db.collection('users').doc(user.uid).onSnapshot(snap => {
        const pro = !!(snap.exists && snap.data().pro === true);
        window.isProUser = pro;
        if(pro) localStorage.setItem(PT_STORE.pro,'1');
        else if(snap.exists) localStorage.removeItem(PT_STORE.pro);
        
        if(typeof renderProTab==='function') renderProTab();
        if(typeof ptSyncGates==='function') ptSyncGates();
      }, err => {
        console.warn('Failed to listen to user doc:', err);
      });
    }
    document.getElementById('verify-banner').style.display = user.emailVerified ? 'none' : 'block';
    
    // Refresh Finny mascot & Envelopes if loaded
    if (typeof window.FinnyMascot !== 'undefined' && window.FinnyMascot.render) {
      try { window.FinnyMascot.render(); } catch(e) {}
    }
    if (typeof window.Envelopes !== 'undefined' && window.Envelopes.render) {
      try { window.Envelopes.render(); } catch(e) {}
    }
    if (typeof window.renderDailyBurnMeter === 'function') {
      try { window.renderDailyBurnMeter(); } catch(e) {}
    }

    // Prompt user for age group ONLY if onboarding is already completed
    const isOnboarded = localStorage.getItem('pockettrack_onboarded_v2') === 'true' ||
                        localStorage.getItem('pockettrack_onboarded') === 'true';
    if (isOnboarded && !localStorage.getItem('pockettrack_age_group') && !localStorage.getItem('pockettrack_app_mode_chosen')) {
      setTimeout(() => {
        const onboardingEl = document.getElementById('onboarding-screen');
        const isOnboardingActive = onboardingEl && onboardingEl.style.display !== 'none';
        const isComposerOpen = document.body.classList.contains('composer-open');
        if (!isOnboardingActive && !isComposerOpen && typeof window.openAgeModeModal === 'function') {
          window.openAgeModeModal();
        }
      }, 400);
    }
  } else {
    const prevUid = currentUser ? currentUser.uid : null;
    currentUser=null;
    window._isAuthActionRunning = false;
    if (prevUid) purgeUserLocalStorage(prevUid);
    
    const isGuest = localStorage.getItem('pockettrack_guest_mode') === 'true';
    if (isGuest) {
      window.isGuestMode = true;
      document.getElementById('auth-screen').style.display='none';
      if(typeof updateBottomBarVisibility==='function') updateBottomBarVisibility();
      const syncEl = document.getElementById('sync-status');
      if(syncEl) syncEl.textContent = (typeof currentLang!=='undefined' && currentLang==='hi') ? 'स्थानीय मोड' : 'Local';
      if(typeof listenToEntries === 'function') listenToEntries();
      if(typeof loadWallets === 'function') loadWallets();
      if(typeof renderWalletSwitcher === 'function') renderWalletSwitcher();
      if(typeof updateVoiceFabVisibility === 'function') updateVoiceFabVisibility();
      if(typeof updateAIWidgetVisibility === 'function') updateAIWidgetVisibility();
      loadBudget();
      if(typeof updateHeaderStats === 'function') updateHeaderStats();
    } else {
      window.isGuestMode = false;
      document.getElementById('auth-screen').style.display='flex';
      if(typeof updateBottomBarVisibility==='function') updateBottomBarVisibility();
      if(unsubscribeEntries) unsubscribeEntries();
      if(unsubscribeEvents) unsubscribeEvents();
      if(typeof updateVoiceFabVisibility === 'function') updateVoiceFabVisibility();
      if(typeof updateAIWidgetVisibility === 'function') updateAIWidgetVisibility();
      entries=[];
      if(typeof window !== 'undefined') window.entries = entries;
      if (typeof loadWallets === 'function') loadWallets();
      if (typeof renderWalletSwitcher === 'function') renderWalletSwitcher();
      if (typeof updateHeaderStats === 'function') updateHeaderStats();
      if(typeof resetLedgerLocal==='function') resetLedgerLocal();
      if(typeof resetRecurringLocal==='function') resetRecurringLocal();
      if(typeof pendingWriteState!=='undefined'){ pendingWriteState.entries=false; pendingWriteState.events=false; }
      events=[];
      weeklyBudget=0;
    }
  }
  });
}

function resendVerification(){
  if(!currentUser)return;
  currentUser.sendEmailVerification().then(()=>{
    toast(currentLang==='hi' ? 'सत्यापन ईमेल फिर से भेजा गया' : 'Verification email sent again', 'success');
  }).catch(e=>{
    toast('Could not send: '+e.message, 'error');
  });
}



