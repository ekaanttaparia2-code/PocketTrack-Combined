// =====================================================================
// monetization.js — PocketTrack Pro · unlockable Premium themes
// ---------------------------------------------------------------------
// Slice 1 of the Monetization & Pro Themes feature.
//  • Persistent Pro subscription state (localStorage + Firestore mirror)
//  • Razorpay-style in-app checkout simulation
//  • 4 unlockable themes (Cyberpunk default is free; Emerald Luxury,
//    Sunset Glow, Midnight OLED are premium).
// The Future Money Simulator is the next slice and builds on isPro() here.
// =====================================================================

const PT_STORE = {
  pro: 'pocketTrack_pro',
  theme: 'pocketTrack_theme'
};

// =====================================================================
// BILINGUAL TEXT (en/hi) — Pro tab, themes, checkout and gates translate
// when the app language switches to Hindi.
// =====================================================================
const MONET = {
  uc_title:      { en:'Under construction', hi:'निर्माणाधीन' },
  uc_desc:       { en:'Pro & monetization are coming soon. For now, enjoy the full free experience — everything else works!',
                   hi:'Pro और भुगतान सुविधाएँ जल्द आ रही हैं। अभी पूरा फ्री अनुभव लें — बाकी सब कुछ काम करता है!' },
  uc_preview:    { en:'PocketTrack · preview build', hi:'PocketTrack · प्रीव्यू बिल्ड' },
  pro_active_badge:{ en:'PRO ACTIVE', hi:'PRO सक्रिय' },
  unlock_pt:     { en:'Unlock PocketTrack Pro', hi:'PocketTrack Pro अनलॉक करें' },
  pt_pro:        { en:'PocketTrack Pro', hi:'PocketTrack Pro' },
  pro_full_access:{ en:'You have full access. Enjoy every theme and all premium perks.',
                    hi:'आपके पास पूर्ण पहुंच है। हर थीम और सभी प्रीमियम सुविधाएँ आनंद लें।' },
  pro_teaser:    { en:'Premium themes, money projection, AI coach & more.', hi:'प्रीमियम थीम, धन अनुमान, AI कोच और बहुत कुछ।' },
  app_themes:    { en:'App Themes', hi:'ऐप थीम्स' },
  themes_desc:   { en:'Re-skin the whole app. The default theme is free; premium themes unlock with Pro.',
                   hi:'पूरे ऐप का रूप बदलें। डिफ़ॉल्ट थीम फ्री है; प्रीमियम थीम Pro से अनलॉक होती हैं।' },
  current:       { en:'CURRENT', hi:'वर्तमान' },
  active:        { en:'Active', hi:'सक्रिय' },
  tap_to_apply:  { en:'Tap to apply', hi:'लागू करने के लिए दबाएं' },
  tap_to_unlock: { en:'tap to unlock', hi:'अनलॉक करने के लिए दबाएं' },
  everything_pro:{ en:'Everything Pro', hi:'सब कुछ Pro' },
  perk_themes:   { en:'All premium themes (Emerald Luxury, Sunset Glow, Midnight OLED)', hi:'सभी प्रीमियम थीम (एमराल्ड लक्ज़री, सनसेट ग्लो, मिडनाइट OLED)' },
  perk_simulator:{ en:'Future Money Simulator — project your savings over 3, 6 & 12 months', hi:'फ्यूचर मनी सिम्युलेटर — 3, 6 और 12 महीनों में अपनी बचत का अनुमान लगाएं' },
  perk_early:    { en:'Faster, ad-free experience and early access to new features', hi:'तेज़, विज्ञापन-मुक्त अनुभव और नई सुविधाओं तक जल्दी पहुंच' },
  perk_sync:     { en:'Up to 10,000 entries & priority cloud sync', hi:'10,000 एंट्रीज़ तक और प्राथमिकता क्लाउड सिंक' },
  unlock_pro_cta:{ en:'Unlock Pro', hi:'Pro अनलॉक करें' },
  razorpay_cancel:{ en:'Razorpay-powered. Cancel anytime.', hi:'Razorpay द्वारा संचालित। कभी भी रद्द करें।' },
  theme_applied: { en:'theme applied', hi:'थीम लागू हुई' },
  applied:       { en:'applied', hi:'लागू हुई' },
  pro_only_unlock:{ en:'is Pro only — unlock to apply.', hi:'केवल Pro के लिए है — लागू करने के लिए अनलॉक करें।' },
  uc_themes:     { en:'🚧 Themes are under construction — coming soon.', hi:'🚧 थीम निर्माणाधीन हैं — जल्द आ रही हैं।' },
  uc_payments:   { en:'🚧 Payments are under construction — coming soon.', hi:'🚧 भुगतान निर्माणाधीन हैं — जल्द आ रहे हैं।' },
  checkout_sub:  { en:'Unlock every theme · money projection · more', hi:'हर थीम अनलॉक करें · धन अनुमान · और भी बहुत कुछ' },
  billed_razorpay:{ en:'✔ Billed via Razorpay', hi:'✔ Razorpay से बिल होता है' },
  upi:           { en:'UPI', hi:'यूपीआई' },
  card:          { en:'Card', hi:'कार्ड' },
  netbanking:    { en:'Netbanking', hi:'नेटबैंकिंग' },
  upi_id:        { en:'UPI ID', hi:'UPI ID' },
  card_number:   { en:'Card number', hi:'कार्ड नंबर' },
  select_bank:   { en:'Select your bank', hi:'अपना बैंक चुनें' },
  demo_note:     { en:'Demo checkout — no real money moves in this preview.', hi:'डेमो चेकआउट — इस प्रीव्यू में असली पैसा नहीं लगता।' },
  demo_note_card:{ en:'Demo checkout — no real money is charged in this preview.', hi:'डेमो चेकआउट — इस प्रीव्यू में कोई असली राशि नहीं काटी जाती।' },
  demo_note_bank:{ en:'Demo checkout, no real money is moved in this preview.', hi:'डेमो चेकआउट, इस प्रीव्यू में असली पैसा नहीं चलता।' },
  pay_now:       { en:'Pay now', hi:'अभी भुगतान करें' },
  maybe_later:   { en:'Maybe later', hi:'बाद में' },
  secured:       { en:'Secured by Razorpay', hi:'Razorpay द्वारा सुरक्षित' },
  verifying:     { en:'Verifying payment…', hi:'भुगतान सत्यापित हो रहा है…' },
  pro_unlocked:  { en:'👑 PocketTrack Pro unlocked', hi:'👑 PocketTrack Pro अनलॉक हुआ' },
  thanks_sub:    { en:'Thanks for subscribing.', hi:'सदस्यता के लिए धन्यवाद।' },
  lifetime_access:{ en:'lifetime access', hi:'लाइफटाइम एक्सेस' },
  plan_word:     { en:'plan', hi:'प्लान' },
  theme_word:    { en:'theme', hi:'थीम' },
  unlock_with_pro:{ en:'Unlock with Pro', hi:'Pro से अनलॉक करें' },
  razorpay_cancel_small:{ en:'Razorpay-powered · cancel anytime', hi:'Razorpay द्वारा संचालित · कभी भी रद्द करें' },
  gate_ledger_title:{ en:'Ledger', hi:'खाता' },
  gate_ledger_desc:{ en:'Track who owes you and what you owe — friends, family, roommates, all in one place. Unlocks with Pro.',
                     hi:'कौन आपसे कितना लेता है और आप पर कितना बकाया है — दोस्त, परिवार, रूममेट, सब एक जगह। Pro से अनलॉक होता है।' },
  gate_smart_title:{ en:'Smart Logger', hi:'स्मार्ट लॉगर' },
  gate_smart_desc:{ en:'Paste any UPI payment text and PocketTrack logs it automatically — no typing. Unlocks with Pro.',
                    hi:'कोई भी UPI भुगतान टेक्स्ट पेस्ट करें और PocketTrack इसे अपने आप लॉग करेगा — टाइपिंग नहीं। Pro से अनलॉक होता है।' },
  export_uc:     { en:'🚧 Copy & export are under construction', hi:'🚧 कॉपी और एक्सपोर्ट निर्माणाधीन हैं' },
  export_pro:    { en:'📊 Copy & export are Pro features', hi:'📊 कॉपी और एक्सपोर्ट Pro सुविधाएँ हैं' },
  unlock:        { en:'Unlock', hi:'अनलॉक करें' },
  reset_pro_confirm:{ en:'Turn off Pro and go back to the free version? Your data stays intact — only the Pro unlock is removed.',
                      hi:'Pro बंद करके फ्री वर्जन पर वापस जाएं? आपका डेटा सुरक्षित रहेगा — केवल Pro अनलॉक हटेगा।' },
  reset_pro_done:{ en:'Pro reset — you’re on the free tier now.', hi:'Pro रीसेट — अब आप फ्री टियर पर हैं।' },
  reset_pro_btn: { en:'Reset Pro', hi:'Pro रीसेट करें' },
  points_word:   { en:'points', hi:'पॉइंट्स' },
  apply_prefix:  { en:'apply', hi:'लागू करें' },
  off_at_checkout:{ en:'off at checkout', hi:'चेकआउट पर छूट' },
  forever_yours: { en:'One-time · yours forever', hi:'एक बार · हमेशा के लिए आपका' },
  per_month:     { en:'/mo', hi:'/माह' },
  best_value:    { en:'BEST VALUE', hi:'सबसे अच्छा' },
  own_forever:   { en:'Own it forever', hi:'हमेशा के लिए आपका' },
};
function mon(k){ return (MONET[k] && MONET[k][currentLang]) || (MONET[k] && MONET[k].en) || k; }
function mlabel(o){ if(o==null) return ''; return (o[currentLang] || o.en || String(o)); }
function pPeriod(p){ return (currentLang==='hi' && p.periodHi) ? p.periodHi : p.period; }
function ptPeriodStr(){ return currentLang==='hi' ? '/वर्ष' : PT_PERIOD; }
function ptPayLabel(p){ return currentLang==='hi' ? ptFormatINR(p.price)+' अभी भुगतान करें' : 'Pay '+ptFormatINR(p.price)+' now'; }

// =====================================================================
// TESTING BARRIER — while the app is shared for feedback, monetization
// and all Pro features are BLOCKED behind an "under construction" wall:
//   • no theme switching (free or premium)
//   • no checkout / payment UI
//   • Pro-gated tabs (Ledger, Smart Logger) show "under construction"
//   • report export/copy blocked
// Flip PT_TEST_MODE to false when real Razorpay payments go live.
// =====================================================================
const PT_TEST_MODE = false;
function ptTestMode(){ return !!PT_TEST_MODE; }

function ptUnderConstructionCard(){
  return `
    <div class="pt-gate-card">
      <div class="pt-gate-icon">🚧</div>
      <div class="pt-gate-title">${mon('uc_title')}</div>
      <div class="pt-gate-desc">${mon('uc_desc')}</div>
      <p style="font-size:10px;color:var(--text-faint);margin:8px 0 0">${mon('uc_preview')}</p>
    </div>`;
}

// --- 3-tier pricing model (User Requested: ₹50/mo, ₹100/mo, Lifetime) ---
const PT_PLANS = [
  { id:'monthly_50',  label:{en:'Monthly Starter',hi:'मासिक स्टार्टर'}, price:50,  period:'/month',  periodHi:'/माह', perMonth:50,  tag:{en:'MINIMAL',hi:'सस्ता'},        highlight:false },
  { id:'monthly_100', label:{en:'Pro Plus',hi:'प्रो प्लस'},           price:100, period:'/month',  periodHi:'/माह', perMonth:100, tag:{en:'POPULAR',hi:'पॉपुलर'},      highlight:true },
  { id:'life',        label:{en:'Lifetime Unlock',hi:'लाइफटाइम'},      price:999, period:'one-time', periodHi:'एक बार', perMonth:0,   tag:{en:'Own it forever',hi:'हमेशा के लिए आपका'}, highlight:false }
];
// Default / featured plan used as the anchor.
const PT_PRICE = '₹50';
const PT_PERIOD = '/month';
const PT_CURRENCY = 'INR';

// --- Free Tier Feature Gating Limits ---
const PT_FREE_LIMITS = {
  voiceTransactions: 100,
  ledgerContacts: 5,
  spacesCount: 2
};

function getVoiceEntriesUsed() {
  return Number(localStorage.getItem('pockettrack_voice_used_count') || 0);
}

function incrementVoiceEntriesUsed() {
  const current = getVoiceEntriesUsed();
  localStorage.setItem('pockettrack_voice_used_count', String(current + 1));
}

function canUseVoiceEntry() {
  if (proEnabled()) return true;
  return getVoiceEntriesUsed() < PT_FREE_LIMITS.voiceTransactions;
}

function canAddLedgerContact(currentCount) {
  if (proEnabled()) return true;
  return currentCount < PT_FREE_LIMITS.ledgerContacts;
}

function canCreateSpace(currentCount) {
  if (proEnabled()) return true;
  return currentCount < PT_FREE_LIMITS.spacesCount;
}

function showProLimitModal(featureName, freeLimitText) {
  const isHi = (typeof currentLang !== 'undefined' && currentLang === 'hi');
  showAppConfirm(
    isHi 
      ? `🔒 आपने ${featureName} की फ्री सीमा (${freeLimitText}) पार कर ली है। असीमित उपयोग के लिए PocketTrack Pro में अपग्रेड करें (सिर्फ ₹50/माह)!`
      : `🔒 You have reached the Free limit for ${featureName} (${freeLimitText}). Upgrade to PocketTrack Pro (starting at just ₹50/mo) for unlimited access!`,
    () => {
      openProCheckout();
    },
    isHi ? '👑 Pro अनलॉक करें' : '👑 Upgrade to Pro'
  );
}

// --- PocketPoints → Pro discount (retention loop from streaks) ---
// 500 points = ₹50 off any Pro purchase, stackable up to one free month.
const PT_POINTS_KV = { deduct: 500, rupees: 50, maxMonths: 1, storeKey: 'pocketTrack_points_used' };
function pocketPointsBalance(){
  // Reuse the app's real rewards engine when available.
  if (typeof calculateRewardPoints === 'function') {
    try { return calculateRewardPoints() || 0; } catch(e){}
  }
  return 0;
}
function pocketPointsMaxDiscount(){
  // Cap the discount at one month of the chosen plan (use ₹99 monthly as the cap base).
  const cashable = Math.floor(pocketPointsBalance() / PT_POINTS_KV.deduct) * PT_POINTS_KV.rupees;
  return Math.min(cashable, PT_POINTS_KV.maxMonths * PT_PLANS[0].price);
}
function pocketPointsUsedToday(){ return Number(localStorage.getItem(PT_POINTS_KV.storeKey) || 0); }

// Reset Pro so you can preview the free experience (also removes locked themes).
function resetProForPreview(){
  showAppConfirm(
    mon('reset_pro_confirm'),
    ()=>{
      localStorage.removeItem(PT_STORE.pro);
      localStorage.removeItem(PT_STORE.theme);
      localStorage.removeItem(PT_STORE.theme + '_pend');
      if (typeof currentUser !== 'undefined' && currentUser && typeof db !== 'undefined') {
        db.collection('users').doc(currentUser.uid)
          .update({ pro: firebase.firestore.FieldValue.delete() })
          .catch(()=>{});
      }
      delete document.body.dataset.theme;
      if (typeof renderProTab === 'function') renderProTab();
      if (typeof ptSyncGates === 'function') ptSyncGates();
      toast(mon('reset_pro_done'), 'success');
    },
    mon('reset_pro_btn')
  );
}

// Currently selected plan id in the checkout / plan card.
let selectedPlanId = 'monthly_50';
function ptGetSelectedPlan(){ return PT_PLANS.find(p=>p.id===selectedPlanId) || PT_PLANS[0]; }
function ptFormatINR(n){ return '₹' + Number(n).toLocaleString('en-IN'); }

// Ordered list shown in the theme picker. Free themes apply instantly,
// premium themes require a Pro subscription.
const PT_THEMES = [
  { id:'cyber',   name:{en:'Cyberpunk Neo',hi:'साइबरपंक नियो'},  free:true,  tag:{en:'Default',hi:'डिफ़ॉल्ट'}, emoji:'🌆', desc:{en:'The classic neon arcade look. Always free.',hi:'क्लासिक नियॉन आर्केड लुक। हमेशा फ्री।'} },
  { id:'emerald', name:{en:'Emerald Luxury',hi:'एमराल्ड लक्ज़री'}, free:false, tag:{en:'Pro',hi:'Pro'}, emoji:'💚', desc:{en:'Deep green glass — refined & calm.',hi:'गहरा हरा ग्लास — परिष्कृत और शांत।'} },
  { id:'sunset',  name:{en:'Sunset Glow',hi:'सनसेट ग्लो'},  free:false, tag:{en:'Pro',hi:'Pro'}, emoji:'🌇', desc:{en:'Warm dusk tones — soft & cosy.',hi:'गर्म शाम के रंग — मुलायम और आरामदायक।'} },
  { id:'midnight',name:{en:'Midnight OLED',hi:'मिडनाइट OLED'}, free:false, tag:{en:'Pro',hi:'Pro'}, emoji:'🖤', desc:{en:'True black background — battery saver.',hi:'शुद्ध काला बैकग्राउंड — बैटरी बचाता है।'} }
];

// ---- Pro state -------------------------------------------------------
function proEnabled(){ return localStorage.getItem(PT_STORE.pro) === '1'; }

function setPro(on){
  if (on) localStorage.setItem(PT_STORE.pro, '1');
  else localStorage.removeItem(PT_STORE.pro);
  // Best-effort mirror to the user's Firestore doc so Pro survives reinstall.
  if (typeof currentUser !== 'undefined' && currentUser && typeof db !== 'undefined') {
    db.collection('users').doc(currentUser.uid)
      .update({ pro: on ? true : firebase.firestore.FieldValue.delete() })
      .catch(()=>{});
  }
}

// ---- middle-pane helpers you can reuse anywhere (e.g. Simulator next slice)
function pt(s){
  return (typeof escapeHTML === 'function') ? escapeHTML(String(s)) : String(s);
}
function esc(s){ return pt(s); }

// Theme server
function currentThemeId(){ return localStorage.getItem(PT_STORE.theme) || 'cyber'; }

function applyThemeOf(id){
  id = id || 'cyber';
  localStorage.setItem(PT_STORE.theme, id);
  const body = document.body;
  if (!body) return;
  const themeMap = {
    'cyber': 'cyberpunk',
    'midnight': 'oled',
    'emerald': 'emerald',
    'sunset': 'sunset'
  };
  const themeAttr = themeMap[id];
  if (themeAttr) {
    body.dataset.theme = themeAttr;
  } else {
    delete body.dataset.theme;
  }
}

function themeById(id){ return PT_THEMES.find(t=>t.id===id); }
function isThemeFree(id){ return !!(themeById(id) || { free:true }).free; }

// A single picker action: applies free themes; routes premium themes through Pro.
function ptPickTheme(id){
  if(ptTestMode()){
    toast(mon('uc_themes'), 'info');
    return;
  }
  const theme = themeById(id) || PT_THEMES[0];
  if (theme.free || proEnabled()){
    applyThemeOf(id);
    toast((theme.free ? mlabel(theme.tag) + ' ' + mon('theme_applied') : '💎 ' + mlabel(theme.name) + ' ' + mon('applied')), 'success');
    renderProTab();
    return;
  }
  // Premium but no Pro yet — invite the upgrade, remember which theme they wanted.
  localStorage.setItem(PT_STORE.theme + '_pend', id);
  toast('✨ ' + mlabel(theme.name) + ' ' + mon('pro_only_unlock'), 'info');
  setTimeout(()=>openProCheckout(mlabel(theme.name)), 250);
}

// =====================================================================
//  PRO TAB
// =====================================================================
function renderProTab(){
  const host = document.getElementById('pro-content');
  if (!host) return;

  if(ptTestMode()){
    host.innerHTML = `
      <div class="card" style="padding:22px;background:linear-gradient(135deg, rgba(155,107,255,0.10), rgba(255,126,179,0.08));border-color:rgba(155,107,255,0.25)">
        ${ptUnderConstructionCard()}
      </div>`;
    return;
  }

  const isPro = proEnabled();
  const cur = currentThemeId();

  const planCards = PT_PLANS.map(p=>{
    const priceLine = p.id==='life' ? `${ptFormatINR(p.price)} ${pPeriod(p)}` : `${ptFormatINR(p.price)}${pPeriod(p)}`;
    const perLine = p.id==='life' ? mon('forever_yours') : (p.perMonth ? `≈ ${ptFormatINR(p.perMonth)}${mon('per_month')}` : '');
    return `
      <div class="pt-plan ${p.highlight?'featured':''}" onclick="ptPickPlan('${p.id}')" role="button" tabindex="0"
        onkeydown="if(event.key==='Enter')ptPickPlan('${p.id}')">
        <div class="pt-plan-top">
          <span class="pt-plan-name">${mlabel(p.label)}</span>
          ${p.tag && p.tag.en ? `<span class="pt-plan-tag">${mlabel(p.tag)}</span>` : ''}
        </div>
        <div class="pt-plan-price">${priceLine}</div>
        <div class="pt-plan-per">${perLine}</div>
      </div>`;
  }).join('');

  const planCard = `
    <div class="card" style="padding:18px;background:linear-gradient(135deg, rgba(155,107,255,0.12), rgba(255,126,179,0.08));border-color:rgba(155,107,255,0.25)">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:12px">
          <span style="font-size:30px">${isPro?'👑':'⭐'}</span>
          <div>
            <p style="font-weight:700;font-size:16px;margin:0;font-family:'Space Grotesk',sans-serif">
              ${isPro ? mon('pt_pro') : mon('unlock_pt')}
            </p>
            <p style="font-size:11.5px;color:var(--text-dim);margin:2px 0 0">
              ${isPro
                ? mon('pro_full_access')
                : mon('pro_teaser')}
            </p>
          </div>
        </div>
        <div style="text-align:right">
          ${isPro
            ? '<span class="pro-badge" style="background:linear-gradient(135deg,#f59e0b,#ec4899)">'+mon('pro_active_badge')+'</span>'
            : `<span class="pro-badge" style="background:linear-gradient(135deg,#8b5cf6,#ec4899)">${PT_PRICE}${ptPeriodStr()}</span>`}
          ${isPro ? '' : `<br><button class="btn primary" style="margin-top:8px;padding:7px 14px;font-size:12.5px" onclick="openProCheckout()"><i class="ti ti-crown"></i> ${mon('unlock_pro_cta')}</button>`}
        </div>
      </div>
      ${isPro
        ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);text-align:center">
             <button class="btn" style="font-size:12px" onclick="resetProForPreview()"><i class="ti ti-rotate"></i> ${mon('reset_pro_btn')} <span style="opacity:.7">(${currentLang==='hi'?'फ्री अनुभव देखें':'view free experience'})</span></button>
           </div>`
        : `<div class="pt-plan-grid" style="margin-top:14px">${planCards}</div>`}
    </div>
  `;

  const themeCards = PT_THEMES.map(t=>{
    const locked = !t.free && !isPro;
    const isCur = cur === t.id;
    return `
      <div class="theme-card ${locked ? 'locked' : ''} ${isCur?'current':''}" onclick="ptPickTheme('${t.id}')" role="button" tabindex="0"
        onkeydown="if(event.key==='Enter')ptPickTheme('${t.id}')">
        <div class="theme-preview" data-theme-prev="${t.id}">
          <span class="theme-preview-emoji">${t.emoji}</span>
          ${isCur ? `<span class="theme-current-tag">${mon('current')}</span>` : ''}
        </div>
        <div style="flex:1;padding:10px 12px 12px">
          <div style="display:flex;align-items:center;gap:6px">
            <span style="font-weight:600;font-size:13px">${pt(mlabel(t.name))}</span>
            ${locked ? '<span style="font-size:11px">🔒</span>' : ''}
          </div>
          <p style="font-size:11px;color:var(--text-dim);margin:3px 0 8px;line-height:1.35">${pt(mlabel(t.desc))}</p>
          ${locked
            ? `<span class="chip chip-gold" style="font-size:10.5px">${mlabel(t.tag)} · ${mon('tap_to_unlock')}</span>`
            : `<span class="chip" style="font-size:10.5px">${isCur ? mon('active') : mon('tap_to_apply')}</span>`}
        </div>
      </div>`;
  }).join('');

  const themesCard = `
    <div class="card">
      <p class="sec-title"><i class="ti ti-palette"></i><span>${mon('app_themes')}</span></p>
      <p style="font-size:12px;color:var(--text-dim);margin:2px 0 14px">
        ${mon('themes_desc')}
      </p>
      <div class="theme-grid">${themeCards}</div>
    </div>
  `;

  const perks = isPro ? '' : `
    <div class="card">
      <p class="sec-title"><i class="ti ti-sparkles"></i><span>${mon('everything_pro')}</span></p>
      <ul class="pro-benefits">
        <li>💎 ${mon('perk_themes')}</li>
        <li>🔮 ${mon('perk_simulator')}</li>
        <li>🗑️ ${mon('perk_early')}</li>
        <li>☁️ ${mon('perk_sync')}</li>
      </ul>
      <button class="btn primary" style="width:100%;margin-top:6px" onclick="openProCheckout()">
        <i class="ti ti-crown"></i> ${mon('unlock_pro_cta')} — from ${ptFormatINR(50)}${mon('per_month')}
      </button>
      <p style="font-size:10.5px;color:var(--text-faint);margin:10px 0 0;text-align:center">
        ${mon('razorpay_cancel')}
      </p>
    </div>
  `;

  host.innerHTML = planCard + themesCard + perks;
}

// =========================================================================
// PRO CHECKOUT (Razorpay-style in-app paywall)
// ========================================================================
function openProCheckout(themeName){
  // reuse a shared glassy overlay we add once
  let overlay = document.getElementById('pro-checkout-backdrop');
  if(!overlay){
    overlay = document.createElement('div');
    overlay.id = 'pro-checkout-backdrop';
    overlay.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:960;align-items:center;justify-content:center;padding:18px;backdrop-filter:blur(4px)';
    overlay.onclick = (e)=>{ if(e.target===overlay) closeProCheckout(); };
    document.body.appendChild(overlay);
  }
  if(ptTestMode()){
    overlay.innerHTML = `
      <div style="width:100%;max-width:380px;background:linear-gradient(160deg,var(--card-solid),#1f1840);border:1px solid rgba(255,255,255,0.14);border-radius:22px;padding:22px;box-shadow:0 24px 60px rgba(0,0,0,0.6);position:relative;color:var(--text)">
        <button class="icon-btn" onclick="closeProCheckout()" style="position:absolute;top:14px;right:14px"><i class="ti ti-x"></i></button>
        ${ptUnderConstructionCard()}
      </div>`;
    overlay.style.display = 'flex';
    return;
  }
  const header = themeName
      ? `<p style="margin:0 0 4px;font-size:12px;color:var(--amber);font-weight:600">💎 ${pt(themeName)} ${mon('theme_word')}</p>`
      : '';
  overlay.innerHTML = `
    <div style="width:100%;max-width:380px;background:linear-gradient(160deg,var(--card-solid),#1f1840);border:1px solid rgba(255,255,255,0.14);border-radius:22px;padding:22px;box-shadow:0 24px 60px rgba(0,0,0,0.6);position:relative;color:var(--text)">
      <button class="icon-btn" onclick="closeProCheckout()" style="position:absolute;top:14px;right:14px"><i class="ti ti-x"></i></button>
      ${header}
      <div style="display:flex;justify-content:center;margin:4px 0 10px">
        <span style="font-size:44px">👑</span>
      </div>
      <h3 style="text-align:center;font-family:'Space Grotesk',sans-serif;margin:0 0 2px">${mon('pt_pro')}</h3>
      <p style="text-align:center;color:var(--text-dim);font-size:12px;margin:0 0 14px">${mon('checkout_sub')}</p>

      <div id="pt-selected-summary" style="text-align:center;margin-bottom:14px">
        <span id="pt-plan-price" style="font-size:30px;font-weight:700;font-family:'Space Grotesk',sans-serif">₹599</span>
        <span id="pt-plan-period" style="color:var(--text-dim);font-size:13px">/year</span>
        <p style="font-size:10.5px;color:var(--green);margin:2px 0 0">${mon('billed_razorpay')}</p>
      </div>

      <div id="pt-plan-tabs" style="display:flex;gap:6px;margin-bottom:8px">
        ${PT_PLANS.map(p=>`
          <button class="pt-plan-tab ${p.id===selectedPlanId?'active':''}" data-id="${p.id}" onclick="ptSelectPlan('${p.id}')">
            ${mlabel(p.label)}${(p.tag&&p.tag.en)?`<small> ${mlabel(p.tag)}</small>`:''}
          </button>`).join('')}
      </div>
      <div id="pt-points-line" style="font-size:11px;color:var(--text-dim);text-align:center;margin:0 0 12px"></div>

      <div class="pay-tabs" style="display:flex;gap:6px;margin-bottom:12px">
        <button class="pay-tab active" onclick="ptPayTab(this,'upi',event)">${mon('upi')}</button>
        <button class="pay-tab" onclick="ptPayTab(this,'card',event)">${mon('card')}</button>
        <button class="pay-tab" onclick="ptPayTab(this,'bank',event)">${mon('netbanking')}</button>
      </div>

      <div id="pt-pay-body">
        <label style="font-size:11px;color:var(--text-dim)">${mon('upi_id')}</label>
        <input id="pt-upi-input" type="text" value="you@upi" style="width:100%;padding:11px 12px;border-radius:12px;border:1px solid var(--border);background:rgba(255,255,255,0.05);color:var(--text);font-size:13px;margin:4px 0 10px;box-sizing:border-box"/>
        <p style="font-size:10.5px;color:var(--text-faint)">${mon('demo_note')}</p>
      </div>

      <button class="btn primary" id="pt-pay-now" style="width:100%;margin-top:12px" onclick="payForPro()">
        <span id="pt-pay-label">${mon('pay_now')}</span>
      </button>
      <button class="btn" style="width:100%;margin-top:8px" onclick="closeProCheckout()">${mon('maybe_later')}</button>
      <p style="text-align:center;font-size:10px;color:var(--text-faint);margin:12px 0 0;display:flex;justify-content:center;gap:4px;align-items:center">
        <i class="ti ti-shield-check"></i> ${mon('secured')} <i class="ti ti-lock"></i>
      </p>
    </div>
  `;
  overlay.style.display = 'flex';
  reflectPlanUI();
}

// Highlight the chosen plan on the pricing cards in the Pro tab.
function ptPickPlan(id){
  const idx=PT_PLANS.findIndex(p=>p.id===id);
  document.querySelectorAll('.pt-plan').forEach((el,i)=>el.classList.toggle('selected', i===idx));
  // Remember the choice, then open checkout with that plan.
  ptSelectPlan(id);
  openProCheckout();
}

function reflectPlanUI(){
  const p = ptGetSelectedPlan();
  document.getElementById('pt-plan-price').textContent = ptFormatINR(p.price);
  document.getElementById('pt-plan-period').textContent = ' ' + p.period;
  document.querySelectorAll('.pt-plan-tab').forEach(b=> b.classList.toggle('active', b.dataset.id===p.id));
  document.getElementById('pt-pay-label').textContent = ptPayLabel(p);

  // PocketPoints discount affordance (visual only; real money is server-side later).
  const bal = pocketPointsBalance();
  const ptsEl = document.getElementById('pt-points-line');
  if(ptsEl){
    ptsEl.style.display = bal >= PT_POINTS_KV.deduct ? 'block' : 'none';
    if(bal >= PT_POINTS_KV.deduct){
      ptsEl.textContent = `🎟️ ${bal} ${mon('points_word')} — ${mon('apply_prefix')} ${ptFormatINR(pocketPointsMaxDiscount())} ${mon('off_at_checkout')}`;
    }
  }
}

function ptSelectPlan(id){
  selectedPlanId = id;
  document.querySelectorAll('.pt-plan-tab').forEach(b=> b.classList.toggle('active', b.dataset.id===id));
  reflectPlanUI();
}

function closeProCheckout(){
  const el = document.getElementById('pro-checkout-backdrop');
  if(el) el.style.display = 'none';
}

function ptPayTab(btn, method, ev){
  if(ev) ev.stopPropagation();
  document.querySelectorAll('.pay-tab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  const body = document.getElementById('pt-pay-body');
  if(method === 'upi'){
    body.innerHTML = `
      <label style="font-size:11px;color:var(--text-dim)">${mon('upi_id')}</label>
      <input id="pt-upi-input" type="text" value="you@upi" style="width:100%;padding:11px 12px;border-radius:12px;border:1px solid var(--border);background:rgba(255,255,255,0.05);color:var(--text);font-size:14px;margin:4px 0 10px;box-sizing:border-box"/>
      <p style="font-size:10.5px;color:var(--text-faint)">${mon('demo_note')}</p>`;
  } else if(method === 'card'){
    body.innerHTML = `
      <label style="font-size:11px;color:var(--text-dim)">${mon('card_number')}</label>
      <input type="text" value="4242 4242 4242 4242" style="width:100%;padding:11px 12px;border-radius:12px;border:1px solid var(--border);background:rgba(255,255,255,0.05);color:var(--text);font-size:14px;margin:4px 0 10px;box-sizing:border-box"/>
      <div style="display:flex;gap:8px">
        <input type="text" placeholder="MM/YY" style="flex:1;padding:11px 12px;border-radius:12px;border:1px solid var(--border);background:rgba(255,255,255,0.05);color:var(--text);font-size:14px;box-sizing:border-box"/>
        <input type="password" placeholder="CVV" style="flex:1;padding:11px 12px;border-radius:12px;border:1px solid var(--border);background:rgba(255,255,255,0.05);color:var(--text);font-size:14px;box-sizing:border-box"/>
      </div>
      <p style="font-size:10.5px;color:var(--text-faint)">${mon('demo_note_card')}</p>`;
  } else {
    body.innerHTML = `
      <label style="font-size:11px;color:var(--text-dim)">${mon('select_bank')}</label>
      <select style="width:100%;padding:11px 12px;border-radius:12px;border:1px solid var(--border);background:rgba(255,255,255,0.05);color:var(--text);font-size:14px;margin:4px 0 10px;box-sizing:border-box">
        <option>HDFC Bank</option><option>State Bank of India</option><option>ICICI Bank</option><option>Axis Bank</option>
      </select>
      <p style="font-size:10.5px;color:var(--text-faint)">${mon('demo_note_bank')}</p>`;
  }
  // Reset the pay button label back to normal (selected plan).
  const p = ptGetSelectedPlan();
  document.getElementById('pt-pay-label').textContent = ptPayLabel(p);
}

async function payForPro(){
  if(ptTestMode()){
    if(typeof openProCheckout === 'function') openProCheckout();
    toast(mon('uc_payments'), 'info');
    return;
  }
  const btn = document.getElementById('pt-pay-now');
  const label = document.getElementById('pt-pay-label');
  if(!btn) return;
  const plan = ptGetSelectedPlan();
  btn.disabled = true;
  label.textContent = mon('verifying');
  document.querySelectorAll('.pay-tab').forEach(b=>b.style.pointerEvents='none');

  // Simulate the Razorpay payment flow (order → then success).
  await new Promise(r=>setTimeout(r, 1400));

  setPro(true);
  closeProCheckout();
  if(typeof ptSyncGates === 'function') ptSyncGates();
  const planMsg = plan.id==='life' ? ' ' + mon('lifetime_access') : (' ' + mlabel(plan.label) + ' ' + mon('plan_word'));
  toast(mon('pro_unlocked') + planMsg + '! ' + mon('thanks_sub'), 'success');

  // Apply any theme they were aiming for (they are Pro now).
  const pend = localStorage.getItem(PT_STORE.theme + '_pend');
  localStorage.removeItem(PT_STORE.theme + '_pend');
  if(pend && themeById(pend)) applyThemeOf(pend);

  if(typeof renderProTab === 'function') renderProTab();
}

function isThemePremium(id){
  const t = themeById(id);
  return t ? !t.free : false;
}

// =========================================================================
// PRO GATING — Ledger, Smart Logger, and Report export are Pro features.
// Free users see the real content blurred behind an upgrade card
// (per spec: never hide premium features — make them visible + desirable).
// =========================================================================

// Wrap a whole tab's children in a blur + overlay an upgrade card.
function ptGateTab(tabId, icon, title, desc){
  const tab = document.getElementById(tabId);
  if(!tab) return;
  if(tab.querySelector('.pt-gate-overlay')) return; // already gated
  tab.style.position = 'relative';
  const wrap = document.createElement('div');
  wrap.className = 'pt-gate-wrap';
  while(tab.firstChild) wrap.appendChild(tab.firstChild);
  tab.appendChild(wrap);

  const ov = document.createElement('div');
  ov.className = 'pt-gate-overlay';
  // In testing mode these features are blocked entirely — no unlock button.
  ov.innerHTML = ptTestMode()
    ? ptUnderConstructionCard()
    : `
    <div class="pt-gate-card">
      <div class="pt-gate-icon">${icon}</div>
      <div class="pt-gate-title">${pt(title)}</div>
      <div class="pt-gate-desc">${pt(desc)}</div>
      <button class="btn primary" style="padding:9px 16px;font-size:13px" onclick="openProCheckout()"><i class="ti ti-crown"></i> ${mon('unlock_with_pro')}</button>
      <p style="font-size:10px;color:var(--text-faint);margin:8px 0 0">${mon('razorpay_cancel_small')}</p>
    </div>`;
  tab.appendChild(ov);
}

// Remove the gate from a whole tab (restore original DOM).
function ptUnGateTab(tabId){
  const tab = document.getElementById(tabId);
  if(!tab) return;
  const ov = tab.querySelector('.pt-gate-overlay');
  if(ov) ov.remove();
  const wrap = tab.querySelector('.pt-gate-wrap');
  if(wrap){
    while(wrap.firstChild) tab.insertBefore(wrap.firstChild, wrap);
    wrap.remove();
  }
  tab.style.position = '';
}

function ptUnGateAll(){
  ['tab-ledger','tab-upi'].forEach(id=>ptUnGateTab(id));
}

// Gate the Report tab's Copy/Export buttons only (view stays free).
function ptGateReportExports(){
  const tab = document.getElementById('tab-report');
  if(!tab) return;
  const row = tab.querySelector('.btn-row');
  if(!row) return;
  // Preview mode: exports are unlocked for testers. Live mode: only Pro can export.
  const isPro = proEnabled() || ptTestMode();
  row.querySelectorAll('button').forEach(b=>{
    const oc = (b.getAttribute('onclick') || '');
    const isExport = oc.indexOf('exportPDF') !== -1 || oc.indexOf('copyReport') !== -1;
    if(isExport){
      b.style.filter = isPro ? '' : 'blur(4px)';
      b.style.opacity = isPro ? '' : '0.55';
      b.style.pointerEvents = isPro ? '' : 'none';
    }
  });
  let chip = row.querySelector('.pt-export-gate');
  if(isPro){ if(chip) chip.remove(); return; }
  if(!chip){
    chip = document.createElement('div');
    chip.className = 'pt-export-gate';
    chip.innerHTML = ptTestMode()
      ? `<span style="font-size:11px;color:var(--text-dim)">${mon('export_uc')}</span>`
      : `
      <span style="font-size:11px;color:var(--text-dim)">${mon('export_pro')}</span>
      <button class="btn primary" style="padding:6px 12px;font-size:12px" onclick="openProCheckout()"><i class="ti ti-crown"></i> ${mon('unlock')}</button>`;
    row.appendChild(chip);
  }
}

// Refresh every gate against the current Pro state (call after pro toggles).
// PREVIEW MODE: features are UNLOCKED for testers (they can try Ledger, Smart
// Logger, export, Health Score, Leak Detector) — only the Pro & Themes purchase
// stays under construction. Live mode: non-Pro users see the blur gates.
function ptSyncGates(){
  if(typeof proEnabled !== 'function') return;
  if(!ptTestMode() && !proEnabled()){
    ptGateTab('tab-ledger','📒',mon('gate_ledger_title'),mon('gate_ledger_desc'));
    ptGateTab('tab-upi','📋',mon('gate_smart_title'),mon('gate_smart_desc'));
  } else {
    ptUnGateAll();
  }
  ptGateReportExports();
}

// Boot: apply saved theme as early as possible + expose globals.
(function(){
  const id = localStorage.getItem(PT_STORE.theme) || 'cyber';
  if(id !== 'cyber'){
    document.addEventListener('readystatechange', function onRS(){
      if(document.readyState === 'interactive' || document.readyState === 'complete'){
        document.removeEventListener('readystatechange', onRS);
        const b = document.body;
        if(b){ b.dataset.theme = id; }
      }
    });
  }
})();