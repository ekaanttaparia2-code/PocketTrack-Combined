/* Authentication flows and signed-in state handling. */

function setAuthButtonsLoading(isLoading){
  const loginBtn=document.getElementById('auth-login-btn');
  const signupBtn=document.getElementById('auth-signup-btn');
  [loginBtn, signupBtn].forEach(btn=>{
    btn.disabled = isLoading;
    btn.style.opacity = isLoading ? '0.6' : '1';
    btn.style.cursor = isLoading ? 'not-allowed' : 'pointer';
  });
}

function authAction(mode){
  const email=document.getElementById('auth-email').value.trim();
  const pass=document.getElementById('auth-pass').value;
  const errEl=document.getElementById('auth-error');
  errEl.style.display='none';
  if(!email||!pass||pass.length<6){
    errEl.textContent = currentLang==='hi' ? 'सही ईमेल और कम से कम 6 अक्षरों का पासवर्ड डालें।' : 'Enter a valid email and a password with 6+ characters.';
    errEl.style.display='block';
    return;
  }
  setAuthButtonsLoading(true);
  const action = mode==='login'
    ? auth.signInWithEmailAndPassword(email,pass)
    : auth.createUserWithEmailAndPassword(email,pass);
  action.then(cred=>{
    if(mode==='signup' && cred.user && !cred.user.emailVerified){
      cred.user.sendEmailVerification().catch(e=>console.log('Verification email failed:',e));
    }
  }).catch(err=>{
    errEl.textContent=err.message;
    errEl.style.display='block';
  }).finally(()=>{
    setAuthButtonsLoading(false);
  });
}

function handleForgotPassword(){
  const email=document.getElementById('auth-email').value.trim();
  const errEl=document.getElementById('auth-error');
  errEl.style.display='none';
  if(!email){
    errEl.textContent = currentLang==='hi' ? 'पासवर्ड रीसेट लिंक पाने के लिए पहले अपना ईमेल डालें।' : 'Enter your email above first to get a reset link.';
    errEl.style.display='block';
    return;
  }
  auth.sendPasswordResetEmail(email).then(()=>{
    toast(currentLang==='hi' ? 'पासवर्ड रीसेट लिंक आपके ईमेल पर भेज दिया गया है' : 'Password reset link sent to your email', 'success');
  }).catch(err=>{
    errEl.textContent=err.message;
    errEl.style.display='block';
  });
}

function signInWithGoogle(){
  const errEl=document.getElementById('auth-error');
  errEl.style.display='none';
  const btn=document.getElementById('auth-google-btn');
  const originalHTML=btn.innerHTML;
  btn.disabled=true;
  btn.style.opacity='0.6';
  btn.innerHTML='<span class="mini-spinner"></span>';
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch(err=>{
    if(err.code==='auth/popup-blocked' || err.code==='auth/cancelled-popup-request'){
      auth.signInWithRedirect(provider);
      return;
    }
    if(err.code!=='auth/popup-closed-by-user'){
      errEl.textContent=err.message;
      errEl.style.display='block';
    }
  }).finally(()=>{
    btn.disabled=false;
    btn.style.opacity='1';
    btn.innerHTML=originalHTML;
  });
}

function logOut(){
  showAppConfirm(currentLang==='hi'?'क्या आप लॉग आउट करना चाहते हैं?':'Log out?', ()=>{
    if(unsubscribeEntries) unsubscribeEntries();
    if(unsubscribeEvents) unsubscribeEvents();
    if(typeof resetLedgerLocal==='function') resetLedgerLocal();
    if(typeof resetRecurringLocal==='function') resetRecurringLocal();
    auth.signOut();
  });
}

function updateBottomBarVisibility(){
  const bar = document.getElementById('bottom-tab-bar');
  const voiceFab = document.getElementById('voice-fab');
  const authScreen = document.getElementById('auth-screen');
  const isAuthVisible = authScreen && authScreen.style.display !== 'none';
  const shouldShow = (currentUser !== null && !isAuthVisible);
  if (bar) bar.style.display = shouldShow ? 'flex' : 'none';
  if (voiceFab) voiceFab.style.display = shouldShow ? 'flex' : 'none';
  if (document.body) document.body.classList.toggle('auth-active', !shouldShow);
}
window.updateBottomBarVisibility = updateBottomBarVisibility;

if (typeof auth !== 'undefined') {
  auth.onAuthStateChanged(user=>{
  if(user){
    currentUser=user;
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
    if(typeof db!=='undefined' && typeof PT_STORE!=='undefined'){
      db.collection('users').doc(user.uid).get().then(snap=>{
        const pro = !!(snap.exists && snap.data().pro === true);
        if(pro) localStorage.setItem(PT_STORE.pro,'1');
        else if(snap.exists) localStorage.removeItem(PT_STORE.pro);
        if(typeof renderProTab==='function') renderProTab();
        if(typeof ptSyncGates==='function') ptSyncGates();
      }).catch(()=>{});
    }
    document.getElementById('verify-banner').style.display = user.emailVerified ? 'none' : 'block';
    if (!localStorage.getItem('pockettrack_age_group') && !localStorage.getItem('pockettrack_app_mode_chosen')) {
      setTimeout(() => {
        if (typeof window.openAgeModeModal === 'function') {
          window.openAgeModeModal();
        }
      }, 400);
    }
  } else {
    currentUser=null;
    document.getElementById('auth-screen').style.display='flex';
    if(typeof updateBottomBarVisibility==='function') updateBottomBarVisibility();
    if(unsubscribeEntries) unsubscribeEntries();
    if(unsubscribeEvents) unsubscribeEvents();
    if(typeof updateVoiceFabVisibility === 'function') updateVoiceFabVisibility();
    if(typeof updateAIWidgetVisibility === 'function') updateAIWidgetVisibility();
    entries=[];
    if(typeof window !== 'undefined') window.entries = entries;
    if(typeof resetLedgerLocal==='function') resetLedgerLocal();
    if(typeof resetRecurringLocal==='function') resetRecurringLocal();
    if(typeof pendingWriteState!=='undefined'){ pendingWriteState.entries=false; pendingWriteState.events=false; }
    events=[];
    weeklyBudget=0;
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
