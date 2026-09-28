/* Transaction syncing, entry management, and transaction-list UI. */

function getWalletBadgeHtml(entryOrId) {
  if (typeof window.getWalletBadgeHtml === 'function' && window.getWalletBadgeHtml !== getWalletBadgeHtml) {
    return window.getWalletBadgeHtml(entryOrId);
  }
  if (!entryOrId) return '';
  const wId = (typeof entryOrId === 'object' && entryOrId !== null)
    ? ((typeof resolveEntryWalletId === 'function') ? resolveEntryWalletId(entryOrId) : (entryOrId.walletId || 'cash'))
    : entryOrId;
  const wList = (typeof userWallets !== 'undefined' && userWallets.length) ? userWallets : [
    { id: 'cash', name: 'Cash', icon: '💵' },
    { id: 'bank', name: 'Bank / UPI', icon: '📱' },
    { id: 'card', name: 'Credit Card', icon: '💳' }
  ];
  const w = wList.find(x => x.id === wId) || { name: wId, icon: '💳' };
  const cls = wId === 'cash' ? 'wallet-tag-cash' : (wId === 'bank' ? 'wallet-tag-bank' : (wId === 'card' ? 'wallet-tag-card' : ''));
  const safeName = (typeof escapeHTML === 'function') ? escapeHTML(w.name) : (w.name || '');
  return `<span class="wallet-badge-tag ${cls}" style="margin-left:4px;">${w.icon || '💳'} ${safeName}</span>`;
}

function updateHeaderStats(){
  const list = mainEntries();
  const income=list.filter(e=>e.type==='income').reduce((s,e)=>s+e.amt,0);
  const spent=list.filter(e=>e.type==='expense').reduce((s,e)=>s+e.amt,0);

  // Sync hero balance precisely with wallet balances (including initial balances)
  let balance = 0;
  if (typeof window !== 'undefined' && typeof window.computeWalletBalances === 'function') {
    const balances = window.computeWalletBalances();
    const activeW = (typeof window !== 'undefined' && window.activeWalletId) ? window.activeWalletId : (typeof activeWalletId !== 'undefined' ? activeWalletId : 'all');
    if (activeW && activeW !== 'all' && balances[activeW] !== undefined) {
      balance = balances[activeW];
    } else {
      Object.values(balances).forEach(b => { balance += b; });
    }
  } else {
    balance = income - spent;
  }

  if (typeof animateNumber === 'function') {
    animateNumber('hdr-income', income);
    animateNumber('hdr-spent', spent);
    animateNumber('hdr-balance', balance);
    animateNumber('hdr-count', list.length, '', '');
    animateNumber('hero-income', income);
    animateNumber('hero-spent', spent);
    animateNumber('hero-count', list.length, '', '');
  } else {
    document.getElementById('hdr-income').textContent='₹'+income;
    document.getElementById('hdr-spent').textContent='₹'+spent;
    document.getElementById('hdr-balance').textContent='₹'+balance;
    document.getElementById('hdr-count').textContent=list.length;
    const heroIncome=document.getElementById('hero-income');
    const heroSpent=document.getElementById('hero-spent');
    const heroCount=document.getElementById('hero-count');
    if(heroIncome)heroIncome.textContent='₹'+income;
    if(heroSpent)heroSpent.textContent='₹'+spent;
    if(heroCount)heroCount.textContent=list.length;
  }
  renderHomeSnapshot();
  if (typeof window.FinnyMascot !== 'undefined' && window.FinnyMascot.render) {
    try { window.FinnyMascot.render(); } catch(e) {}
  }
  if (typeof window.Envelopes !== 'undefined' && window.Envelopes.render) {
    try { window.Envelopes.render(); } catch(e) {}
  }
  if (typeof window.renderWalletSwitcher === 'function') {
    try { window.renderWalletSwitcher(); } catch(e) {}
  }
  if (typeof window.renderDailyBurnMeter === 'function') {
    try { window.renderDailyBurnMeter(); } catch(e) {}
  }
  if (typeof window.updateFinancialDNA === 'function') {
    try { window.updateFinancialDNA(); } catch(e) {}
  }
  if (typeof window.renderActiveGoalCard === 'function') {
    try { window.renderActiveGoalCard(); } catch(e) {}
  }
}
window.updateHeaderStats = updateHeaderStats;

function renderHomeSnapshot(){
  const wrap=document.getElementById('home-recent-activity');
  const insight=document.getElementById('home-insight-text');
  if(!wrap)return;
  const list=mainEntries().slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))).slice(0,5);
  if(!list.length){
    wrap.innerHTML='<div class="empty-mini"><i class="ti ti-sparkles"></i><span>'+(currentLang==='hi'?'अपनी पहली आय या खर्च से शुरुआत करें।':'Start with your first income or expense.')+'</span></div>';
    if(insight)insight.textContent=currentLang==='hi'?'कुछ एंट्रीज़ के बाद PocketTrack यहां उपयोगी पैटर्न दिखाना शुरू करेगा।':'Once you have a few entries, PocketTrack will start surfacing useful patterns here.';
    return;
  }
  wrap.innerHTML=list.map(e=>{
    const income=e.type==='income';
    const label=displayCatLabel(e);
    const title=e.label||label||'Entry';
    const date=e.date||'';
    const wBadge = (typeof getWalletBadgeHtml === 'function') ? getWalletBadgeHtml(e) : '';
    return `<div class="home-entry-row">
      <span class="home-entry-icon ${income?'income':'expense'}"><i class="ti ${income?'ti-arrow-down-left':'ti-arrow-up-right'}"></i></span>
      <div class="home-entry-main"><strong>${escapeHTML(title)} ${wBadge}</strong><span>${escapeHTML(label)} · ${escapeHTML(date)}</span></div>
      <strong class="home-entry-amt ${income?'income':'expense'}">${income?'+':'−'}₹${Number(e.amt||0).toLocaleString('en-IN')}</strong>
    </div>`;
  }).join('');

  if(insight){
    const expenses=mainEntries().filter(e=>e.type==='expense');
    const totals={};
    expenses.forEach(e=>{const key=displayCatLabel(e)||'Other';totals[key]=(totals[key]||0)+Number(e.amt||0);});
    const top=Object.entries(totals).sort((a,b)=>b[1]-a[1])[0];
    if(top){
      const total=expenses.reduce((sum,e)=>sum+Number(e.amt||0),0);
      const pct=total?Math.round((top[1]/total)*100):0;
      insight.textContent=currentLang==='hi'?`${top[0]} अभी आपका सबसे बड़ा खर्च क्षेत्र है — कुल ट्रैक किए गए खर्च का ${pct}%.`:`${top[0]} is your biggest spending area so far — ${pct}% of tracked expenses.`;
    }else{
      insight.textContent=currentLang==='hi'?'अच्छी शुरुआत। लॉग करते रहें और PocketTrack आपकी गतिविधि से उपयोगी पैटर्न निकालेगा।':'Nice start. Keep logging and PocketTrack will turn your activity into useful patterns.';
    }
  }
}
window.renderHomeSnapshot = renderHomeSnapshot;

let editingId=null;
let composerMode='expense';
let composerSelection='food';
let composerWallet='cash';

function selectComposerWallet(btn, value){
  composerWallet = value;
  const group = btn.closest('.composer-chips');
  group?.querySelectorAll('.composer-chip').forEach(x=>x.classList.remove('active'));
  btn.classList.add('active');
}

function openQuickComposer(mode='expense', editEntry=null){
  const backdrop=document.getElementById('transaction-composer-backdrop');
  if(!backdrop)return;

  if (editEntry) {
    editingId = editEntry._id;
    composerMode = editEntry.type === 'income' ? 'income' : 'expense';
    document.getElementById('composer-amount').value = editEntry.amt || '';
    document.getElementById('composer-date').value = editEntry.date || todayStr();
    document.getElementById('composer-note').value = editEntry.note || editEntry.label || '';
    composerWallet = editEntry.walletId || ((typeof resolveEntryWalletId === 'function') ? resolveEntryWalletId(editEntry) : 'cash');
    composerSelection = (composerMode === 'expense') ? (editEntry.cat || 'other') : (editEntry.label || 'Salary');
    
    const titleEl = document.getElementById('composer-title');
    const subEl = document.getElementById('composer-subtitle');
    const isHi = (typeof currentLang !== 'undefined' && currentLang === 'hi');
    if (titleEl) titleEl.textContent = isHi ? 'एंट्री संपादित करें ✏️' : 'Edit Entry ✏️';
    if (subEl) subEl.textContent = isHi ? 'राशि, श्रेणी, खाता या नोट अपडेट करें।' : 'Update amount, category, account or note.';
  } else {
    editingId = null;
    composerMode = mode === 'income' ? 'income' : 'expense';
    document.getElementById('composer-amount').value = '';
    document.getElementById('composer-date').value = todayStr();
    document.getElementById('composer-note').value = '';
    composerWallet = (typeof activeWalletId !== 'undefined' && activeWalletId !== 'all') ? activeWalletId : 'cash';
    composerSelection = composerMode === 'expense' ? 'food' : 'Salary';
    
    const titleEl = document.getElementById('composer-title');
    const subEl = document.getElementById('composer-subtitle');
    const isHi = (typeof currentLang !== 'undefined' && currentLang === 'hi');
    if (titleEl) titleEl.textContent = isHi ? 'आपने क्या किया? 💜' : 'What did you do? 💜';
    if (subEl) subEl.textContent = isHi ? (composerMode === 'expense' ? 'कुछ ही टैप में खर्च जोड़ें।' : 'आसानी से आय जोड़ें।') : (composerMode === 'expense' ? 'Add it in a few taps.' : 'Capture money coming in just as quickly.');
  }
  
  const wChipsEl = document.getElementById('composer-wallet-chips');
  if (wChipsEl) {
    const wSection = wChipsEl.closest('div[style*="margin-bottom"]');
    if (wSection) wSection.style.display = 'block';
    const wList = (typeof userWallets !== 'undefined' && userWallets.length) ? userWallets : [
      { id: 'cash', name: 'Cash', icon: '💵' },
      { id: 'bank', name: 'Bank / UPI', icon: '📱' },
      { id: 'card', name: 'Credit Card', icon: '💳' }
    ];
    wChipsEl.innerHTML = wList.map(w => `
      <button type="button" class="composer-chip ${w.id === composerWallet ? 'active' : ''}" data-wallet="${w.id}" onclick="selectComposerWallet(this,'${w.id}')">
        ${w.icon || '💳'} ${(typeof escapeHTML === 'function') ? escapeHTML(w.name) : w.name}
      </button>
    `).join('');
  }

  setComposerMode(composerMode);
  backdrop.style.display='flex';
  document.body.classList.add('composer-open');
  setTimeout(()=>document.getElementById('composer-amount')?.focus(),180);
}

function closeTransactionComposer(){
  const backdrop=document.getElementById('transaction-composer-backdrop');
  if(backdrop)backdrop.style.display='none';
  document.body.classList.remove('composer-open');
  editingId=null;
}

function setComposerMode(mode){
  composerMode=mode==='income'?'income':'expense';
  const expenseTab=document.getElementById('composer-expense-tab');
  const incomeTab=document.getElementById('composer-income-tab');
  const expenseFields=document.getElementById('composer-expense-fields');
  const incomeFields=document.getElementById('composer-income-fields');
  const save=document.getElementById('composer-save');
  const sub=document.getElementById('composer-subtitle');
  const isHi = (typeof currentLang !== 'undefined' && currentLang === 'hi');

  expenseTab?.classList.toggle('active',composerMode==='expense');
  incomeTab?.classList.toggle('active',composerMode==='income');
  if(expenseFields)expenseFields.style.display=composerMode==='expense'?'block':'none';
  if(incomeFields)incomeFields.style.display=composerMode==='income'?'block':'none';
  
  if(save){
    if (editingId) {
      save.innerHTML = (isHi ? 'एंट्री अपडेट करें' : 'Update Entry') + ' <span>✓</span>';
    } else {
      save.innerHTML = (composerMode==='expense' ? (isHi ? 'खर्च सहेजें' : 'Save expense') : (isHi ? 'आय सहेजें' : 'Save income')) + ' <span>→</span>';
    }
  }

  if(sub && !editingId){
    sub.textContent = composerMode==='expense'
      ? (isHi ? 'कुछ ही टैप में खर्च जोड़ें।' : 'Add it in a few taps.')
      : (isHi ? 'आसानी से आय जोड़ें।' : 'Capture money coming in just as quickly.');
  }

  document.querySelectorAll('#composer-expense-fields .composer-chip, #composer-income-fields .composer-chip').forEach(btn => {
    const isCatMatch = (composerMode === 'expense' && btn.dataset.cat === composerSelection);
    const isSrcMatch = (composerMode === 'income' && btn.dataset.source === composerSelection);
    btn.classList.toggle('active', isCatMatch || isSrcMatch);
  });
}

function selectComposerChip(btn,value){
  composerSelection=value;
  const group=btn.closest('.composer-chips');
  group?.querySelectorAll('.composer-chip').forEach(x=>x.classList.remove('active'));
  btn.classList.add('active');
}

async function submitTransactionComposer(){
  const rawAmtStr = (document.getElementById('composer-amount')?.value || '').toString().replace(/[₹$,\s]/g, '');
  const amt = parseFloat(rawAmtStr);
  const date=document.getElementById('composer-date')?.value||todayStr();
  const note=(document.getElementById('composer-note')?.value||'').trim().slice(0,60);
  const checkAmt = (typeof isValidAmount === 'function') ? isValidAmount : ((typeof window !== 'undefined' && typeof window.isValidAmount === 'function') ? window.isValidAmount : ((a) => typeof a === 'number' && isFinite(a) && a > 0));
  const checkDate = (typeof isValidDate === 'function') ? isValidDate : ((typeof window !== 'undefined' && typeof window.isValidDate === 'function') ? window.isValidDate : ((d) => !!d));
  if(!checkAmt(amt)){toast(TT('enter_valid_amount'),'error');return;}
  if(!checkDate(date)){toast(TT('enter_valid_date'),'error');return;}
  
  if(!editingId && currentUser && !currentUser.emailVerified && (!currentUser.providerData || currentUser.providerData[0].providerId !== 'google.com') && entries.length >= 10){
    showAppAlert(currentLang==='hi'?'सीमा पूरी हुई':'Limit Reached',currentLang==='hi'?'अपनी एंट्रीज़ जोड़ना जारी रखने के लिए अपना ईमेल सत्यापित करें।':"Verify your email to continue adding entries.");
    return;
  }
  
  const btn=document.getElementById('composer-save');
  if(btn)btn.disabled=true;
  try{
    let payload;
    const chosenWallet = composerWallet || ((typeof activeWalletId !== 'undefined' && activeWalletId !== 'all') ? activeWalletId : 'cash');
    if(composerMode==='expense'){
      const labels={food:'Food & snacks',travel:'Travel/Convenience',friends:'Friends plan',home:'Household items',shopping:'Shopping',other:'Other'};
      const label=note||labels[composerSelection]||'Expense';
      payload={type:'expense',cat:composerSelection,label,note:note||label,amt:Math.round(amt*100)/100,walletId:chosenWallet,date};
    }else{
      const label=note||composerSelection||'Income';
      payload={type:'income',cat:'income',label,note:note||label,amt:Math.round(amt*100)/100,walletId:chosenWallet,date};
    }

    if (editingId) {
      await updateEntry(editingId, payload);
      if (typeof updateHeaderStats === 'function') updateHeaderStats();
      if (typeof renderEntries === 'function') renderEntries();
      if (typeof renderWalletSwitcher === 'function') renderWalletSwitcher();
      if(composerMode==='expense'){
        if(typeof checkBudget==='function') checkBudget();
        if(typeof showSpendMoodToast==='function') showSpendMoodToast(payload.amt);
        toast(TT('expense_updated') || (currentLang==='hi'?'खर्च अपडेट किया गया':'Expense updated'),'success');
      }else{
        toast(TT('income_updated') || (currentLang==='hi'?'आय अपडेट की गई':'Income updated'),'success');
      }
      closeTransactionComposer();
    } else {
      const guardFn = (typeof maybeGuardAndSaveWithSmartEngine === 'function') ? maybeGuardAndSaveWithSmartEngine : maybeGuardAndSave;
      await guardFn(payload, async()=>{
        await saveEntry(payload);
        if (typeof renderWalletSwitcher === 'function') renderWalletSwitcher();
        if(composerMode==='expense'){
          if(typeof checkBudget==='function') checkBudget();
          if(typeof showSpendMoodToast==='function') showSpendMoodToast(payload.amt);
          toast(TT('expense_added'),'success');
        }else{
          toast(TT('income_added'),'success');
        }
        if(typeof maybeOfferRecurring==='function') maybeOfferRecurring({type:payload.type,label:payload.label,amt:payload.amt,cat:payload.cat});
        closeTransactionComposer();
      }, note || composerSelection);
    }
  }catch(e){toast('Could not save: '+e.message,'error');}
  finally{if(btn)btn.disabled=false;}
}

function goMoreHub(){
  openCommandHubModal();
}

function openCommandHubModal(){
  const isHi = (typeof currentLang !== 'undefined' && currentLang === 'hi');
  const existing = document.getElementById('command-hub-modal-backdrop');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'command-hub-modal-backdrop';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(7,4,20,0.85);backdrop-filter:blur(24px);z-index:999999;display:flex;align-items:center;justify-content:center;padding:16px;animation:fadeIn 0.2s ease;';

  modal.innerHTML = `
    <div class="card" style="max-width:520px;width:100%;background:linear-gradient(160deg,#160f33,#0f0926);border:1px solid rgba(139,92,246,0.45);border-radius:28px;padding:26px 22px;box-shadow:0 25px 70px rgba(0,0,0,0.8);max-height:90vh;overflow-y:auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:22px;">⚡</span>
          <div>
            <h3 style="margin:0;font-family:'Space Grotesk',sans-serif;font-size:20px;">${isHi ? 'वित्तीय कमांड हब' : 'Financial Command Hub'}</h3>
            <span style="font-size:11.5px;color:var(--text-dim,#a1a1aa);">${isHi ? 'सभी टूल्स और उन्नत नियंत्रण' : 'All Power Tools & Advanced Controls'}</span>
          </div>
        </div>
        <button onclick="closeCommandHubModal()" style="background:rgba(255,255,255,0.08);border:none;color:#fff;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:16px;">✕</button>
      </div>

      <!-- Power Tools Grid (Including Shifted Home Widgets) -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px;">
        <!-- 1. Save to Spend / Daily Burn -->
        <div onclick="closeCommandHubModal();openDailyBurnModal();" style="background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.35);border-radius:18px;padding:16px;cursor:pointer;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
          <div style="font-size:24px;margin-bottom:6px;">⚡</div>
          <strong style="display:block;font-size:14px;color:#fbbf24;">${isHi ? 'सेव टू स्पेंड (दैनिक बर्न)' : 'Save to Spend'}</strong>
          <span style="font-size:11px;color:var(--text-dim,#a1a1aa);">${isHi ? 'दैनिक सुरक्षित खर्च सीमा' : 'Daily burn pace & radar'}</span>
        </div>

        <!-- 2. 50/30/20 Envelope Budget -->
        <div onclick="closeCommandHubModal();openEnvelopesModal();" style="background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.35);border-radius:18px;padding:16px;cursor:pointer;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
          <div style="font-size:24px;margin-bottom:6px;">✉️</div>
          <strong style="display:block;font-size:14px;color:#38bdf8;">${isHi ? '50/30/20 लिफाफा बजट' : '50/30/20 Envelopes'}</strong>
          <span style="font-size:11px;color:var(--text-dim,#a1a1aa);">${isHi ? 'ज़रूरतें, इच्छाएं व बचत' : 'Needs, wants & savings'}</span>
        </div>

        <!-- 3. Invisible Leaker / Financial DNA -->
        <div onclick="closeCommandHubModal();openFinancialDnaModal();" style="background:rgba(168,85,247,0.1);border:1px solid rgba(168,85,247,0.35);border-radius:18px;padding:16px;cursor:pointer;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
          <div style="font-size:24px;margin-bottom:6px;">🧬</div>
          <strong style="display:block;font-size:14px;color:#c4b5fd;">${isHi ? 'इनविजिबल लीकर (DNA)' : 'Invisible Leaker'}</strong>
          <span style="font-size:11px;color:var(--text-dim,#a1a1aa);">${isHi ? 'खर्च व्यक्तित्व और लीक्स' : 'DNA archetype & cash drag'}</span>
        </div>

        <!-- 4. Smart Receipt Scanner -->
        <div onclick="closeCommandHubModal();triggerReceiptScanner();" style="background:rgba(14,165,233,0.12);border:1px solid rgba(14,165,233,0.45);border-radius:18px;padding:16px;cursor:pointer;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
          <div style="font-size:24px;margin-bottom:6px;">📷</div>
          <strong style="display:block;font-size:14px;color:#38bdf8;">${isHi ? 'रसीद स्कैनर (OCR)' : 'Receipt Scanner'}</strong>
          <span style="font-size:11px;color:var(--text-dim,#a1a1aa);">${isHi ? 'बिल स्कैन करें और ऑटो-लॉग' : 'Scan bills & instant OCR'}</span>
        </div>

        <!-- 5. Emergency Fund & Goal SIP -->
        <div onclick="closeCommandHubModal();if(typeof openGoalPlannerModal==='function')openGoalPlannerModal();" style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.35);border-radius:18px;padding:16px;cursor:pointer;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
          <div style="font-size:24px;margin-bottom:6px;">🎯</div>
          <strong style="display:block;font-size:14px;color:#34d399;">${isHi ? 'इमरजेंसी फंड व लक्ष्य' : 'Emergency Fund & SIP'}</strong>
          <span style="font-size:11px;color:var(--text-dim,#a1a1aa);">${isHi ? 'लक्ष्य आधारित बचत व ग्रोथ' : 'Emergency buffer & goals'}</span>
        </div>

        <!-- 6. Wallets & Accounts -->
        <div onclick="closeCommandHubModal();if(typeof openWalletManagerModal==='function')openWalletManagerModal();" style="background:rgba(139,92,246,0.12);border:1px solid rgba(139,92,246,0.45);border-radius:18px;padding:16px;cursor:pointer;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
          <div style="font-size:24px;margin-bottom:6px;">💳</div>
          <strong style="display:block;font-size:14px;color:var(--accent-bright,#c4b5fd);">${isHi ? 'वॉलेट और खाते' : 'Wallets & Accounts'}</strong>
          <span style="font-size:11px;color:var(--text-dim,#a1a1aa);">${isHi ? 'कैश, बैंक, कार्ड प्रबंधन' : 'Manage & custom wallets'}</span>
        </div>

        <!-- 7. Ledger Accounts -->
        <div onclick="selectHubTool('ledger')" style="background:rgba(255,255,255,0.04);border:1px solid rgba(52,211,153,0.3);border-radius:18px;padding:16px;cursor:pointer;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
          <div style="font-size:24px;margin-bottom:6px;">📑</div>
          <strong style="display:block;font-size:14px;color:#fff;">${isHi ? 'खाता (Ledger)' : 'Ledger Accounts'}</strong>
          <span style="font-size:11px;color:var(--text-dim,#a1a1aa);">${isHi ? 'मित्रों का ऋण और बकाया' : 'P2P debts & settlement'}</span>
        </div>

        <!-- 8. Splitwise Spaces -->
        <div onclick="selectHubTool('events')" style="background:rgba(255,255,255,0.04);border:1px solid rgba(139,92,246,0.3);border-radius:18px;padding:16px;cursor:pointer;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
          <div style="font-size:24px;margin-bottom:6px;">👥</div>
          <strong style="display:block;font-size:14px;color:#fff;">${isHi ? 'स्पेस (Spaces)' : 'Splitwise Spaces'}</strong>
          <span style="font-size:11px;color:var(--text-dim,#a1a1aa);">${isHi ? 'ग्रुप ट्रिप और बिल बंटवारा' : 'Group trips & split bills'}</span>
        </div>

        <!-- 9. Smart UPI Logger -->
        <div onclick="selectHubTool('upi')" style="background:rgba(255,255,255,0.04);border:1px solid rgba(251,191,36,0.3);border-radius:18px;padding:16px;cursor:pointer;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
          <div style="font-size:24px;margin-bottom:6px;">⚡</div>
          <strong style="display:block;font-size:14px;color:#fff;">${isHi ? 'स्मार्ट UPI लॉगर' : 'Smart UPI Logger'}</strong>
          <span style="font-size:11px;color:var(--text-dim,#a1a1aa);">${isHi ? 'पेस्ट करें और ऑटो-लॉग' : 'Paste & auto-detect'}</span>
        </div>

        <!-- 10. FIRE & Runway Horizon -->
        <div onclick="closeCommandHubModal();if(typeof openFireRunwayModal==='function')openFireRunwayModal();" style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.4);border-radius:18px;padding:16px;cursor:pointer;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
          <div style="font-size:24px;margin-bottom:6px;">🔥</div>
          <strong style="display:block;font-size:14px;color:#fbbf24;">${isHi ? 'FIRE व इमरजेंसी रनवे' : 'FIRE & Runway Horizon'}</strong>
          <span style="font-size:11px;color:var(--text-dim,#a1a1aa);">${isHi ? '4% नियम व वित्तीय आज़ादी' : 'Survival months & FI target'}</span>
        </div>

        <!-- 11. Wealth & SIP Simulator -->
        <div onclick="closeCommandHubModal();if(typeof openWealthSimulatorModal==='function')openWealthSimulatorModal();" style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.35);border-radius:18px;padding:16px;cursor:pointer;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
          <div style="font-size:24px;margin-bottom:6px;">📈</div>
          <strong style="display:block;font-size:14px;color:#34d399;">${isHi ? 'वेल्थ व SIP सिम्युलेटर' : 'Wealth & SIP Simulator'}</strong>
          <span style="font-size:11px;color:var(--text-dim,#a1a1aa);">${isHi ? 'चक्रवृद्धि विकास प्रोजेक्टर' : 'Compound growth projector'}</span>
        </div>

        <!-- 12. Debt Payoff Strategist -->
        <div onclick="closeCommandHubModal();if(typeof openDebtPayoffModal==='function')openDebtPayoffModal();" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.35);border-radius:18px;padding:16px;cursor:pointer;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
          <div style="font-size:24px;margin-bottom:6px;">🎯</div>
          <strong style="display:block;font-size:14px;color:#f87171;">${isHi ? 'कर्ज मुक्ति (Debt Payoff)' : 'Debt Payoff Strategist'}</strong>
          <span style="font-size:11px;color:var(--text-dim,#a1a1aa);">${isHi ? 'एवलांच व स्नोबॉल विधि' : 'Avalanche vs Snowball'}</span>
        </div>

        <!-- 13. Pro & Luxury Themes -->
        <div onclick="selectHubTool('pro')" style="background:rgba(236,72,153,0.08);border:1px solid rgba(236,72,153,0.35);border-radius:18px;padding:16px;cursor:pointer;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
          <div style="font-size:24px;margin-bottom:6px;">👑</div>
          <strong style="display:block;font-size:14px;color:#f472b6;">${isHi ? 'Pro और थीम' : 'Pro & Luxury Themes'}</strong>
          <span style="font-size:11px;color:var(--text-dim,#a1a1aa);">${isHi ? 'OLED, Emerald, Sunset' : 'OLED, Emerald, Sunset'}</span>
        </div>

        <!-- 14. Rewards & Badges -->
        <div onclick="selectHubTool('rewards')" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:16px;cursor:pointer;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
          <div style="font-size:24px;margin-bottom:6px;">🏆</div>
          <strong style="display:block;font-size:14px;color:#fff;">${isHi ? 'रिवॉर्ड्स और बैज' : 'Rewards & Badges'}</strong>
          <span style="font-size:11px;color:var(--text-dim,#a1a1aa);">${isHi ? 'स्ट्रीक पॉइंट्स और छूट' : 'Streak points & perks'}</span>
        </div>

        <!-- 15. Language & Region -->
        <div onclick="selectHubTool('language')" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:16px;cursor:pointer;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
          <div style="font-size:24px;margin-bottom:6px;">🌐</div>
          <strong style="display:block;font-size:14px;color:#fff;">${isHi ? 'भाषा (Language)' : 'Language & Region'}</strong>
          <span style="font-size:11px;color:var(--text-dim,#a1a1aa);">${isHi ? 'हिंदी, English + 6 और' : 'Hindi, English + 6 more'}</span>
        </div>

        <!-- 16. Replay Finny Tour -->
        <div onclick="closeCommandHubModal();if(typeof restartOnboarding==='function')restartOnboarding();" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:18px;padding:16px;cursor:pointer;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
          <div style="font-size:24px;margin-bottom:6px;">🎓</div>
          <strong style="display:block;font-size:14px;color:#fff;">${isHi ? 'टूर दोबारा देखें' : 'Replay Finny Tour'}</strong>
          <span style="font-size:11px;color:var(--text-dim,#a1a1aa);">${isHi ? 'ऑनबोर्डिंग व 50/30/20' : 'Interactive wizard'}</span>
        </div>

        <!-- 17. Help & Grievance Support -->
        <div onclick="closeCommandHubModal();if(typeof openSupportModal==='function')openSupportModal();" style="background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.35);border-radius:18px;padding:16px;cursor:pointer;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
          <div style="font-size:24px;margin-bottom:6px;">🛡️</div>
          <strong style="display:block;font-size:14px;color:#c4b5fd;">${isHi ? 'सहायता व कानूनी' : 'Support & Legal'}</strong>
          <span style="font-size:11px;color:var(--text-dim,#a1a1aa);">${isHi ? 'DPDP, नियम व संपर्क' : 'DPDP 2023, Terms & Help'}</span>
        </div>

        <!-- 18. Install App (PWA) -->
        <div id="hub-install-app-item" onclick="closeCommandHubModal();if(typeof promptInstallApp==='function')promptInstallApp();" style="background:rgba(52,211,153,0.08);border:1px solid rgba(52,211,153,0.35);border-radius:18px;padding:16px;cursor:pointer;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
          <div style="font-size:24px;margin-bottom:6px;">📲</div>
          <strong style="display:block;font-size:14px;color:#34d399;">${isHi ? 'ऐप इंस्टॉल करें (PWA)' : 'Install App (PWA)'}</strong>
          <span style="font-size:11px;color:var(--text-dim,#a1a1aa);">${isHi ? 'होम स्क्रीन पर जोड़ें' : 'Add to home screen'}</span>
        </div>

        <!-- 19. Delete Account (Purge Data) -->
        <div onclick="closeCommandHubModal();if(typeof deleteAccountAndPurgeData==='function')deleteAccountAndPurgeData();" style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.35);border-radius:18px;padding:16px;cursor:pointer;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
          <div style="font-size:24px;margin-bottom:6px;">🗑️</div>
          <strong style="display:block;font-size:14px;color:#f87171;">${isHi ? 'खाता व डेटा हटाएं' : 'Delete Account'}</strong>
          <span style="font-size:11px;color:var(--text-dim,#a1a1aa);">${isHi ? 'स्थायी 1-टैप डेटा पर्ज' : '1-Tap Permanent Purge'}</span>
        </div>
      </div>

      <div style="margin:14px 0 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:10px 12px;font-size:11px;color:var(--text-dim,#94a3b8);line-height:1.5;">
        ⚖️ <b>${isHi ? 'कानूनी अस्वीकरण' : 'Legal Disclaimer'}:</b> ${isHi ? 'PocketTrack एक व्यक्तिगत व्यय ट्रैकर है और प्रमाणित वित्तीय या निवेश सलाह प्रदान नहीं करता है। सभी भविष्यवाणियां गणितीय सिमुलेशन हैं।' : 'PocketTrack is a personal expense tracking and budgeting tool and does not provide certified financial or investment advice. All projections are educational mathematical simulations.'}
      </div>

      <div style="display:flex;gap:10px;">
        <button class="btn danger" onclick="closeCommandHubModal();logOut();" style="flex:1;padding:12px;font-size:13px;">
          <i class="ti ti-logout"></i> ${isHi ? 'लॉग आउट' : 'Sign Out'}
        </button>
        <button class="btn" onclick="closeCommandHubModal();" style="flex:1;padding:12px;font-size:13px;">
          ${isHi ? 'बंद करें' : 'Close'}
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

function closeCommandHubModal(){
  const modal = document.getElementById('command-hub-modal-backdrop');
  if(modal) modal.remove();
}

function selectHubTool(tabName){
  closeCommandHubModal();
  setTab(tabName);
}

// ===== Power Hub Shifted Modals =====
window.openDailyBurnModal = function() {
  const isHi = (typeof currentLang !== 'undefined' && currentLang === 'hi');
  const data = (typeof computeSafeToSpend === 'function') ? computeSafeToSpend() : {
    remainingDays: 1, dailyAllowance: 0, todaySpent: 0, todayRemaining: 0, burnPercent: 0, isSafe: true
  };
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, data.burnPercent) / 100) * circumference;
  let gaugeColor = '#34d399';
  let statusEmoji = '🟢';
  let statusMsg = isHi ? `आज के लिए ₹${Math.max(0, data.todayRemaining).toLocaleString('en-IN')} शेष` : `₹${Math.max(0, data.todayRemaining).toLocaleString('en-IN')} safe to spend today`;
  if (data.burnPercent > 100) {
    gaugeColor = '#f87171';
    statusEmoji = '🔴';
    statusMsg = isHi ? `आज ₹${Math.abs(data.todayRemaining).toLocaleString('en-IN')} अधिक खर्च हो गया!` : `Exceeded daily burn by ₹${Math.abs(data.todayRemaining).toLocaleString('en-IN')}`;
  } else if (data.burnPercent > 70) {
    gaugeColor = '#fbbf24';
    statusEmoji = '🟡';
    statusMsg = isHi ? `सावधानी: दैनिक सीमा के निकट` : `Caution: Approaching daily safe limit`;
  }

  const existing = document.getElementById('daily-burn-modal-backdrop');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'daily-burn-modal-backdrop';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(7,4,20,0.85);backdrop-filter:blur(24px);z-index:999999;display:flex;align-items:center;justify-content:center;padding:16px;animation:fadeIn 0.2s ease;';

  modal.innerHTML = `
    <div class="card" style="max-width:440px;width:100%;background:linear-gradient(160deg,#181432,#0d0a21);border:1px solid rgba(251,191,36,0.4);border-radius:28px;padding:24px 20px;box-shadow:0 25px 70px rgba(0,0,0,0.8);max-height:90vh;overflow-y:auto;color:#fff;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:24px;">⚡</span>
          <div>
            <h3 style="margin:0;font-family:'Space Grotesk',sans-serif;font-size:18px;color:#fff;">${isHi ? 'सेव टू स्पेंड (दैनिक बर्न मीटर)' : 'Save to Spend · Daily Burn Meter'}</h3>
            <span style="font-size:11px;color:#fbbf24;font-weight:600;">${data.remainingDays} ${isHi ? 'दिन महीने में बाकी' : 'days remaining in month'}</span>
          </div>
        </div>
        <button onclick="document.getElementById('daily-burn-modal-backdrop').remove()" style="background:rgba(255,255,255,0.08);border:none;color:#fff;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:16px;">✕</button>
      </div>

      <div style="display:flex;align-items:center;justify-content:center;margin:16px 0;">
        <div style="position:relative;width:96px;height:96px;display:flex;align-items:center;justify-content:center;">
          <svg viewBox="0 0 96 96" style="width:96px;height:96px;transform:rotate(-90deg);">
            <circle cx="48" cy="48" r="${radius}" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="8"></circle>
            <circle cx="48" cy="48" r="${radius}" fill="none" stroke="${gaugeColor}" stroke-width="8" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" stroke-linecap="round" style="transition:stroke-dashoffset 0.6s ease;"></circle>
          </svg>
          <div style="position:absolute;font-size:26px;">${data.isSafe ? '⚡' : '⚠️'}</div>
        </div>
      </div>

      <div style="text-align:center;margin-bottom:18px;">
        <div style="font-size:32px;font-weight:800;font-family:'Space Grotesk',sans-serif;color:${gaugeColor};">
          ₹${data.dailyAllowance.toLocaleString('en-IN')}<span style="font-size:14px;color:var(--text-dim,#94a3b8);font-weight:500;">/day</span>
        </div>
        <div style="font-size:13px;margin-top:4px;color:#e2e8f0;">
          ${statusEmoji} <b>${statusMsg}</b>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:14px;">
        <div>
          <span style="font-size:10px;text-transform:uppercase;color:var(--text-dim,#94a3b8);display:block;">${isHi ? 'आज का खर्च' : 'Spent Today'}</span>
          <strong style="font-size:16px;color:#f87171;display:block;margin-top:2px;">₹${data.todaySpent.toLocaleString('en-IN')}</strong>
        </div>
        <div>
          <span style="font-size:10px;text-transform:uppercase;color:var(--text-dim,#94a3b8);display:block;">${isHi ? 'आज की बची सीमा' : 'Remaining Today'}</span>
          <strong style="font-size:16px;color:${gaugeColor};display:block;margin-top:2px;">₹${Math.max(0, data.todayRemaining).toLocaleString('en-IN')}</strong>
        </div>
      </div>

      <p style="font-size:11.5px;color:var(--text-dim,#94a3b8);line-height:1.5;margin:0 0 16px;background:rgba(251,191,36,0.06);border:1px solid rgba(251,191,36,0.2);border-radius:14px;padding:10px 12px;">
        💡 <b>${isHi ? 'स्मार्ट टिप' : 'Smart Pace Rule'}:</b> ${isHi ? 'यदि आप आज इस सीमा के भीतर रहते हैं, तो महीने के अंत तक आपका बजट कभी खत्म नहीं होगा।' : 'Staying within your daily burn allowance ensures you never run out of money before month-end.'}
      </p>

      <button onclick="document.getElementById('daily-burn-modal-backdrop').remove();openQuickComposer('expense');" class="btn primary" style="width:100%;padding:12px;font-size:13px;font-weight:700;">
        + ${isHi ? 'खर्च दर्ज करें' : 'Log Expense'}
      </button>
    </div>
  `;
  document.body.appendChild(modal);
};

window.openEnvelopesModal = function() {
  const isHi = (typeof currentLang !== 'undefined' && currentLang === 'hi');
  const data = (window.Envelopes && typeof window.Envelopes.getSummary === 'function') 
    ? window.Envelopes.getSummary() 
    : { income: 0, needs: { allocated: 0, spent: 0, pct: 0 }, wants: { allocated: 0, spent: 0, pct: 0 }, savings: { allocated: 0, spent: 0, pct: 0 } };

  const existing = document.getElementById('envelopes-modal-backdrop');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'envelopes-modal-backdrop';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(7,4,20,0.85);backdrop-filter:blur(24px);z-index:999999;display:flex;align-items:center;justify-content:center;padding:16px;animation:fadeIn 0.2s ease;';

  modal.innerHTML = `
    <div class="card" style="max-width:460px;width:100%;background:linear-gradient(160deg,#181432,#0d0a21);border:1px solid rgba(139,92,246,0.4);border-radius:28px;padding:24px 20px;box-shadow:0 25px 70px rgba(0,0,0,0.8);max-height:90vh;overflow-y:auto;color:#fff;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:24px;">✉️</span>
          <div>
            <h3 style="margin:0;font-family:'Space Grotesk',sans-serif;font-size:18px;">${isHi ? '50/30/20 लिफाफा बजट' : '50/30/20 Envelope Budget'}</h3>
            <span style="font-size:11px;color:var(--text-dim,#94a3b8);">${isHi ? 'मासिक आय' : 'Tracked Income'}: ₹${data.income.toLocaleString('en-IN')}</span>
          </div>
        </div>
        <button onclick="document.getElementById('envelopes-modal-backdrop').remove()" style="background:rgba(255,255,255,0.08);border:none;color:#fff;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:16px;">✕</button>
      </div>

      <div style="display:flex;flex-direction:column;gap:12px;margin:16px 0;">
        <div style="background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.3);border-radius:18px;padding:14px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <strong style="color:#38bdf8;font-size:14px;">🏠 ${isHi ? 'ज़रूरतें (Needs - 50%)' : 'Needs (50%)'}</strong>
            <span style="font-size:12px;font-weight:700;color:#fff;">₹${(data.needs.spent||0).toLocaleString('en-IN')} / ₹${(data.needs.allocated||0).toLocaleString('en-IN')}</span>
          </div>
          <div style="width:100%;height:7px;background:rgba(255,255,255,0.1);border-radius:4px;overflow:hidden;">
            <div style="width:${Math.min(100, data.needs.pct||0)}%;height:100%;background:#38bdf8;border-radius:4px;"></div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:10.5px;color:var(--text-dim,#94a3b8);margin-top:4px;">
            <span>${isHi ? 'किराया, राशन, बिजली, दवा' : 'Rent, groceries, utilities'}</span>
            <span>${(data.needs.pct||0)}% used</span>
          </div>
        </div>

        <div style="background:rgba(236,72,153,0.08);border:1px solid rgba(236,72,153,0.3);border-radius:18px;padding:14px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <strong style="color:#f472b6;font-size:14px;">🍿 ${isHi ? 'इच्छाएं (Wants - 30%)' : 'Wants (30%)'}</strong>
            <span style="font-size:12px;font-weight:700;color:#fff;">₹${(data.wants.spent||0).toLocaleString('en-IN')} / ₹${(data.wants.allocated||0).toLocaleString('en-IN')}</span>
          </div>
          <div style="width:100%;height:7px;background:rgba(255,255,255,0.1);border-radius:4px;overflow:hidden;">
            <div style="width:${Math.min(100, data.wants.pct||0)}%;height:100%;background:#ec4899;border-radius:4px;"></div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:10.5px;color:var(--text-dim,#94a3b8);margin-top:4px;">
            <span>${isHi ? 'डाइनिंग, शॉपिंग, नेटफ्लिक्स' : 'Dining out, shopping, hobbies'}</span>
            <span>${(data.wants.pct||0)}% used</span>
          </div>
        </div>

        <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.3);border-radius:18px;padding:14px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <strong style="color:#34d399;font-size:14px;">📈 ${isHi ? 'बचत व निवेश (Savings - 20%)' : 'Savings & Investment (20%)'}</strong>
            <span style="font-size:12px;font-weight:700;color:#34d399;">₹${(data.savings.allocated||0).toLocaleString('en-IN')}</span>
          </div>
          <div style="width:100%;height:7px;background:rgba(255,255,255,0.1);border-radius:4px;overflow:hidden;">
            <div style="width:100%;height:100%;background:#10b981;border-radius:4px;"></div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:10.5px;color:var(--text-dim,#94a3b8);margin-top:4px;">
            <span>${isHi ? 'इमरजेंसी फंड, SIP, सोना' : 'Emergency fund, SIP & stocks'}</span>
            <span>20% Locked</span>
          </div>
        </div>
      </div>

      <div style="display:flex;gap:10px;">
        <button onclick="document.getElementById('envelopes-modal-backdrop').remove();if(window.Envelopes&&window.Envelopes.openEditModal)window.Envelopes.openEditModal();" class="btn" style="flex:1;padding:12px;font-size:12.5px;background:rgba(139,92,246,0.18);border-color:rgba(139,92,246,0.4);color:#c4b5fd;">
          ✏️ ${isHi ? 'प्लान बदलें' : 'Edit Allocation'}
        </button>
        <button onclick="document.getElementById('envelopes-modal-backdrop').remove();" class="btn" style="flex:1;padding:12px;font-size:12.5px;">
          ${isHi ? 'बंद करें' : 'Close'}
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
};

window.openFinancialDnaModal = function() {
  const isHi = (typeof currentLang !== 'undefined' && currentLang === 'hi');
  const dna = (typeof computeFinancialDNA === 'function') ? computeFinancialDNA() : {
    type: 'awakening', title: 'The Awakening', emoji: '🌱',
    tagline: 'You started paying attention. Build the tracking habit.', color: '#4ade80',
    tips: ['Log every single expense for the next 7 days, even the small ones.', 'Build the habit of tracking your transactions.'],
    metrics: { savingsRatio: 0, socialSpendPct: 0, impulseRate: 0, entryCount: 0 }
  };
  const m = dna.metrics || { savingsRatio: 0, socialSpendPct: 0, impulseRate: 0, entryCount: 0 };

  const existing = document.getElementById('financial-dna-modal-backdrop');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'financial-dna-modal-backdrop';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(7,4,20,0.85);backdrop-filter:blur(24px);z-index:999999;display:flex;align-items:center;justify-content:center;padding:16px;animation:fadeIn 0.2s ease;';

  modal.innerHTML = `
    <div class="card" style="max-width:460px;width:100%;background:linear-gradient(160deg,#181432,#0d0a21);border:1px solid rgba(168,85,247,0.4);border-radius:28px;padding:24px 20px;box-shadow:0 25px 70px rgba(0,0,0,0.8);max-height:90vh;overflow-y:auto;color:#fff;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:24px;">🧬</span>
          <div>
            <h3 style="margin:0;font-family:'Space Grotesk',sans-serif;font-size:18px;">${isHi ? 'फाइनेंशियल डीएनए व लीकर' : 'Financial DNA & Invisible Leaker'}</h3>
            <span style="font-size:11px;color:var(--text-dim,#94a3b8);">${isHi ? 'व्यवहार अर्थशास्त्र विश्लेषण' : 'Behavioral Economics Archetype'}</span>
          </div>
        </div>
        <button onclick="document.getElementById('financial-dna-modal-backdrop').remove()" style="background:rgba(255,255,255,0.08);border:none;color:#fff;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:16px;">✕</button>
      </div>

      <div style="background:rgba(168,85,247,0.12);border:1px solid rgba(168,85,247,0.35);border-radius:20px;padding:18px 16px;text-align:center;margin-bottom:16px;">
        <div style="font-size:42px;margin-bottom:4px;">${dna.emoji}</div>
        <h4 style="margin:0;font-size:19px;font-weight:700;color:#c4b5fd;">${dna.title}</h4>
        <p style="margin:6px 0 0;font-size:12.5px;color:rgba(255,255,255,0.8);font-style:italic;">"${dna.tagline}"</p>
      </div>

      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:14px;margin-bottom:16px;">
        <div style="margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;">
            <span>${isHi ? 'बचत दर' : 'Savings Rate'}</span>
            <strong style="color:#34d399;">${m.savingsRatio.toFixed(0)}%</strong>
          </div>
          <div style="width:100%;height:6px;background:rgba(255,255,255,0.08);border-radius:3px;overflow:hidden;">
            <div style="width:${Math.min(100, m.savingsRatio)}%;height:100%;background:#34d399;border-radius:3px;"></div>
          </div>
        </div>

        <div style="margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;">
            <span>${isHi ? 'सामाजिक खर्च (दोस्तों पर)' : 'Social Spend Ratio'}</span>
            <strong style="color:#fbbf24;">${m.socialSpendPct.toFixed(0)}%</strong>
          </div>
          <div style="width:100%;height:6px;background:rgba(255,255,255,0.08);border-radius:3px;overflow:hidden;">
            <div style="width:${Math.min(100, m.socialSpendPct)}%;height:100%;background:#fbbf24;border-radius:3px;"></div>
          </div>
        </div>

        <div>
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;">
            <span>${isHi ? 'आवेगपूर्ण खर्च दर' : 'Impulse Purchase Rate'}</span>
            <strong style="color:#f87171;">${m.impulseRate.toFixed(0)}%</strong>
          </div>
          <div style="width:100%;height:6px;background:rgba(255,255,255,0.08);border-radius:3px;overflow:hidden;">
            <div style="width:${Math.min(100, m.impulseRate)}%;height:100%;background:#f87171;border-radius:3px;"></div>
          </div>
        </div>
      </div>

      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:12px 14px;margin-bottom:16px;">
        <strong style="display:block;font-size:12px;color:#c4b5fd;margin-bottom:6px;">🎯 ${isHi ? 'आपके लिए विशेष सलाह' : 'Personalized Anti-Leak Tips'}:</strong>
        <ul style="margin:0;padding-left:18px;font-size:11.5px;color:#cbd5e1;line-height:1.6;">
          ${(dna.tips||[]).map(t => `<li>${t}</li>`).join('')}
        </ul>
      </div>

      <div style="display:flex;gap:10px;">
        <button onclick="if(window.shareFinancialDNA)window.shareFinancialDNA();" class="btn primary" style="flex:1;padding:12px;font-size:12.5px;">
          📤 ${isHi ? 'डीएनए शेयर करें' : 'Share DNA'}
        </button>
        <button onclick="document.getElementById('financial-dna-modal-backdrop').remove();" class="btn" style="flex:1;padding:12px;font-size:12.5px;">
          ${isHi ? 'बंद करें' : 'Close'}
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
};


function listenToEntries(){
  if(!currentUser) return;

  // 1. Instantly hydrate from local cache strictly scoped to current user
  try {
    const userCache = localStorage.getItem('pockettrack_entries_cache_' + currentUser.uid);
    if (userCache) {
      const parsed = JSON.parse(userCache);
      if (Array.isArray(parsed) && parsed.length && (!entries || !entries.length)) {
        entries = parsed;
        if (typeof window !== 'undefined') window.entries = entries;
        renderEntries();
        renderReport();
        updateHeaderStats();
        if(typeof renderHomeSnapshot === 'function') renderHomeSnapshot();
        if(typeof window.FinnyMascot !== 'undefined' && window.FinnyMascot.render) {
          try { window.FinnyMascot.render(); } catch(e) {}
        }
        if(typeof window.Envelopes !== 'undefined' && window.Envelopes.render) {
          try { window.Envelopes.render(); } catch(e) {}
        }
        if(typeof window.renderDailyBurnMeter === 'function') {
          try { window.renderDailyBurnMeter(); } catch(e) {}
        }
        if(typeof window.updateFinancialDNA === 'function') {
          try { window.updateFinancialDNA(); } catch(e) {}
        }
      }
    }
  } catch(e){}

  // 2. Real-time Firestore sync
  unsubscribeEntries = db.collection('users').doc(currentUser.uid).collection('entries')
    .onSnapshot({includeMetadataChanges:true}, snap=>{
      entries = snap.docs.map(d=>({...d.data(), _id:d.id})).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
      if (typeof window !== 'undefined') window.entries = entries;
      try {
        localStorage.setItem('pockettrack_entries_cache_' + currentUser.uid, JSON.stringify(entries));
      } catch(e){}
      if(typeof pendingWriteState!=='undefined') pendingWriteState.entries = !!snap.metadata && snap.metadata.hasPendingWrites;
      if(typeof updateSyncIndicator==='function') updateSyncIndicator();
      renderEntries();
      renderReport();
      if(typeof renderSubscriptionRadar==='function') renderSubscriptionRadar();
      updateHeaderStats();
      if(typeof renderHomeSnapshot === 'function') renderHomeSnapshot();
      if(typeof renderWalletSwitcher === 'function') renderWalletSwitcher();
      if(typeof window.FinnyMascot !== 'undefined' && window.FinnyMascot.render) {
        try { window.FinnyMascot.render(); } catch(e) {}
      }
      if(typeof window.Envelopes !== 'undefined' && window.Envelopes.render) {
        try { window.Envelopes.render(); } catch(e) {}
      }
      if(typeof window.renderDailyBurnMeter === 'function') {
        try { window.renderDailyBurnMeter(); } catch(e) {}
      }
      if(typeof window.updateFinancialDNA === 'function') {
        try { window.updateFinancialDNA(); } catch(e) {}
      }
      checkBudget();
      refreshEventsViewsIfOpen();
      renderStreak();
      renderQuickAdd();
      if(typeof checkEntryLimit !== 'undefined') checkEntryLimit();
    }, err=>{
      console.error(err);
      const sEl = document.getElementById('sync-status');
      if (sEl) sEl.textContent = (typeof currentLang!=='undefined' && currentLang==='hi') ? 'सिंक त्रुटि — कनेक्शन जांचें' : 'Sync error — check connection';
    });
}

// --- Quick-add: surfaces your 4 most-repeated exact entries as one-tap chips ---
function renderQuickAdd(){
  const card=document.getElementById('quick-add-card');
  const wrap=document.getElementById('quick-add-chips');
  if(!card||!wrap)return;
  const list=mainEntries().filter(e=>e.type==='expense');
  if(list.length<3){ card.style.display='none'; return; }
  const counts={};
  list.forEach(e=>{
    const key=e.cat+'|'+e.label.toLowerCase()+'|'+e.amt;
    if(!counts[key]) counts[key]={count:0,cat:e.cat,label:e.label,amt:e.amt};
    counts[key].count++;
  });
  const top = Object.values(counts).filter(c=>c.count>=2).sort((a,b)=>b.count-a.count).slice(0,4);
  if(!top.length){ card.style.display='none'; return; }
  card.style.display='block';
  wrap.innerHTML = top.map((t,i)=>`
    <button class="quick-chip" data-qidx="${i}">
      <span>${escapeHTML(t.label)}</span><span class="chip-amt">₹${t.amt}</span>
    </button>`).join('');
  wrap.querySelectorAll('.quick-chip').forEach(btn=>{
    const i=Number(btn.dataset.qidx);
    btn.addEventListener('click', ()=>quickAddExpense(top[i].cat, top[i].label, top[i].amt));
  });
}

async function quickAddExpense(cat, label, amt){
  try{
    await saveEntry({type:'expense',cat,label,amt,date:todayStr()});
    toast(TT('expense_added'),'success');
    checkBudget();
    showSpendMoodToast(amt);
    if(typeof maybeOfferRecurring==='function') maybeOfferRecurring({type:'expense',label:String(label||''),amt,cat});
  }catch(e){toast('Could not save: '+e.message,'error');}
}

// --- Spending mood: light, non-judgmental feedback comparing an expense to your own average ---
function showSpendMoodToast(amt){
  const expenses=mainEntries().filter(e=>e.type==='expense');
  if(expenses.length<4)return; // not enough history for a meaningful average yet
  const avg = expenses.reduce((s,e)=>s+e.amt,0)/expenses.length;
  if(amt > avg*1.5){
    toast(currentLang==='hi' ? '😬 यह आपके औसत से काफी ज्यादा है' : "😬 That's well above your usual spend", 'info');
  } else if(amt < avg*0.5){
    toast(currentLang==='hi' ? '👍 बढ़िया, यह आपके औसत से कम है' : '👍 Nice, that\'s below your usual spend', 'info');
  }
}

function refreshEventsViewsIfOpen(){
  const eventsTab=document.getElementById('tab-events');
  if(!eventsTab || eventsTab.style.display==='none')return;
  if(currentEventId){ renderEventDetail(); }
  else if(document.getElementById('events-list-view').style.display!=='none'){ renderEventsList(); }
}



async function saveEntry(entry){
  if(!currentUser){toast(TT('not_logged_in'),'error');return;}
  const tempId = 'temp_' + Date.now();
  const optimisticItem = { ...entry, _id: tempId };
  if (!Array.isArray(entries)) entries = [];
  entries.unshift(optimisticItem);
  if (typeof window !== 'undefined') window.entries = entries;
  try {
    localStorage.setItem('pockettrack_entries_cache_' + currentUser.uid, JSON.stringify(entries));
  } catch(e) {}

  if (typeof updateHeaderStats === 'function') updateHeaderStats();
  if (typeof renderEntries === 'function') renderEntries();
  if (typeof renderWalletSwitcher === 'function') renderWalletSwitcher();
  if (typeof renderHomeSnapshot === 'function') renderHomeSnapshot();
  if (typeof window.FinnyMascot !== 'undefined' && window.FinnyMascot.render) {
    try { window.FinnyMascot.render(); } catch(e) {}
  }
  if (typeof window.Envelopes !== 'undefined' && window.Envelopes.render) {
    try { window.Envelopes.render(); } catch(e) {}
  }
  if (typeof window.renderDailyBurnMeter === 'function') {
    try { window.renderDailyBurnMeter(); } catch(e) {}
  }
  if (typeof window.updateFinancialDNA === 'function') {
    try { window.updateFinancialDNA(); } catch(e) {}
  }
  if (typeof checkBudget === 'function') checkBudget();
  if (typeof renderStreak === 'function') renderStreak();

  const docRef = await db.collection('users').doc(currentUser.uid).collection('entries').add(entry);
  optimisticItem._id = docRef.id;
  try {
    localStorage.setItem('pockettrack_entries_cache_' + currentUser.uid, JSON.stringify(entries));
  } catch(e) {}
}

/* --- Smart duplicate guard: same amount + similar label within 3 days --- */
function _dupNorm(s){return String(s||'').toLowerCase().replace(/[^a-z0-9\u0900-\u097F]+/g,'');}
function _dupUTC(d){return Date.UTC(+d.slice(0,4),+d.slice(5,7)-1,+d.slice(8,10));}

function findDuplicateEntry(payload){
  try{
    if(!payload || payload.transferGroupId || payload.isRecurring || payload.allowDuplicate) return null;
    if(!Array.isArray(entries)||!entries.length)return null;
    const amt=Math.round((Number(payload.amt)||0)*100)/100;
    if(!(amt>0))return null;
    const tLabel=_dupNorm(payload.label);
    const tNote=_dupNorm(payload.note);
    const target=tLabel.length>=3?tLabel:tNote;
    if(target.length<3)return null;
    const today=todayStr();
    if(!/^\d{4}-\d{2}-\d{2}$/.test(today))return null;
    const tNow=_dupUTC(today);
    let best=null,bestDelta=1e9;
    for(const e of entries){
      if((e.type||'expense')!==payload.type)continue;
      if(Math.round((Number(e.amt)||0)*100)/100!==amt)continue;
      if(!e.date||!/^\d{4}-\d{2}-\d{2}$/.test(e.date))continue;
      const dd=Math.round((tNow-_dupUTC(e.date))/86400000);
      if(dd<0||dd>3)continue;
      const eLabel=_dupNorm(e.label);
      const hay=(eLabel+' '+_dupNorm(e.note)).trim();
      if(!(hay.includes(target)||(eLabel.length>=3&&target.includes(eLabel))))continue;
      if(dd<bestDelta){best=e;bestDelta=dd;}
    }
    return best;
  }catch(err){return null;}
}

function maybeGuardAndSave(payload,doSave){
  const run=()=>Promise.resolve(doSave()).catch(e=>toast('Could not save: '+e.message,'error'));
  const dup=findDuplicateEntry(payload);
  if(!dup){run();return;}
  
  // If the duplicate was literally just created (within 5 seconds), it's a double-tap bug.
  // Silently drop it to prevent annoyance.
  let isRecent = false;
  if (dup._id && dup._id.startsWith('temp_')) {
    const ts = parseInt(dup._id.split('_')[1]);
    if (!isNaN(ts) && Date.now() - ts < 5000) isRecent = true;
  }
  if (isRecent) {
    console.warn('Silently dropping double-tap duplicate');
    return;
  }

  const isHi=currentLang==='hi';
  const dd=Math.max(0,Math.round((_dupUTC(todayStr())-_dupUTC(dup.date))/86400000));
  const when=isHi?(dd===0?'आज ही':dd===1?'कल':dd+' दिन पहले'):(dd===0?'earlier today':dd===1?'yesterday':dd+' days ago');
  const safeLabel = (typeof escapeHTML === 'function') ? escapeHTML(dup.label) : String(dup.label).replace(/</g, '&lt;');
  showAppConfirm(
    isHi?`⚠️ "${safeLabel}" ₹${dup.amt} ${when} दर्ज हो चुका है। फिर से जोड़ें?`
        :`⚠️ "${safeLabel}" ₹${dup.amt} was already logged ${when}. Add it again?`,
    run
  );
}

async function updateEntry(id, entry){
  const allList = (typeof window !== 'undefined' && Array.isArray(window.entries)) ? window.entries : entries;
  const idx = allList.findIndex(e => e._id === id);
  if (idx !== -1) {
    allList[idx] = { ...allList[idx], ...entry, _id: id };
    entries = allList;
    if (typeof window !== 'undefined') window.entries = entries;
  }
  
  if (currentUser && typeof db !== 'undefined') {
    try {
      await db.collection('users').doc(currentUser.uid).collection('entries').doc(id).update(entry);
      try {
        localStorage.setItem('pockettrack_entries_cache_' + currentUser.uid, JSON.stringify(entries));
      } catch(e){}
    } catch(e) {
      console.warn('Firestore update warning:', e.message);
    }
  } else {
    try {
      localStorage.setItem('pockettrack_entries_cache', JSON.stringify(entries));
    } catch(e) {}
  }
  if (typeof updateHeaderStats === 'function') updateHeaderStats();
  if (typeof renderEntries === 'function') renderEntries();
  if (typeof renderHomeSnapshot === 'function') renderHomeSnapshot();
  if (typeof renderReport === 'function') renderReport();
}

async function removeEntry(id){
  if(!currentUser) return;
  await db.collection('users').doc(currentUser.uid).collection('entries').doc(id).delete();
}

document.getElementById('inc-date').value=todayStr();
document.getElementById('exp-date').value=todayStr();

async function addIncome(){
  await withButtonLoading('add-income-btn', async ()=>{
    if(!editingId && currentUser && !currentUser.emailVerified && (!currentUser.providerData || currentUser.providerData[0].providerId !== 'google.com') && entries.length >= 10){
      showAppAlert(currentLang==='hi'?'सीमा पूरी हुई':'Limit Reached', currentLang==='hi'?'अपनी एंट्रीज़ जोड़ना जारी रखने के लिए अपना ईमेल सत्यापित करें। आपने अपनी सभी 10 मुफ़्त एंट्रीज़ का उपयोग कर लिया है।':"Verify your email to continue adding entries. You've used all 10 free entries.");
      return;
    }
    let src=document.getElementById('inc-src').value;
    let isNewCustom=false;
    if(src==='__add_new__'){
      const custom=document.getElementById('inc-custom').value.trim().slice(0,40);
      if(!custom){toast(TT('give_source_name'),'error');return;}
      src=custom;
      isNewCustom=true;
    }
    const amt=parseFloat(document.getElementById('inc-amt').value);
    const note=document.getElementById('inc-note').value.trim().slice(0,60);
    const date=document.getElementById('inc-date').value||todayStr();
    if(!isValidAmount(amt)){toast(TT('enter_valid_amount'),'error');return;}
    if(!note){toast(TT('add_description'),'error');return;}
    if(!isValidDate(date)){toast(TT('enter_valid_date'),'error');return;}
    const chosenW = document.getElementById('inc-wallet')?.value || ((typeof activeWalletId !== 'undefined' && activeWalletId !== 'all') ? activeWalletId : 'cash');
    const payload={type:'income',cat:'income',label:src,note,amt:Math.round(amt*100)/100,walletId:chosenW,date};
    try{
      if(editingId){
        await updateEntry(editingId, payload);
        toast(TT('income_updated'),'success');
        cancelEdit();
      } else {
        const guardFn = (typeof maybeGuardAndSaveWithSmartEngine === 'function') ? maybeGuardAndSaveWithSmartEngine : maybeGuardAndSave;
        await guardFn(payload, async()=>{
          await saveEntry(payload);
          if (typeof renderWalletSwitcher === 'function') renderWalletSwitcher();
          toast(TT('income_added'),'success');
          if(typeof maybeOfferRecurring==='function') maybeOfferRecurring({type:'income',label:src,amt,cat:'income'});
          if(isNewCustom) saveCustomIncomeSource(src);
        }, note || src);
      }
      document.getElementById('inc-amt').value='';
      document.getElementById('inc-note').value='';
      document.getElementById('inc-custom').value='';
      document.getElementById('inc-custom-wrap').style.display='none';
    }catch(e){toast('Could not save: '+e.message,'error');}
  });
}

async function addExpense(){
  await withButtonLoading('add-expense-btn', async ()=>{
    if(!editingId && currentUser && !currentUser.emailVerified && (!currentUser.providerData || currentUser.providerData[0].providerId !== 'google.com') && entries.length >= 10){
      showAppAlert(currentLang==='hi'?'सीमा पूरी हुई':'Limit Reached', currentLang==='hi'?'अपनी एंट्रीज़ जोड़ना जारी रखने के लिए अपना ईमेल सत्यापित करें। आपने अपनी सभी 10 मुफ़्त एंट्रीज़ का उपयोग कर लिया है।':"Verify your email to continue adding entries. You've used all 10 free entries.");
      return;
    }
    let cat=document.getElementById('exp-cat').value;
    let customCat='';
    let isNewCustom=false;
    if(cat==='__add_new__'){
      customCat=document.getElementById('exp-custom').value.trim().slice(0,40);
      if(!customCat){toast(TT('give_category_name'),'error');return;}
      cat='custom';
      isNewCustom=true;
    } else if(cat.startsWith('custom:')){
      customCat=cat.slice(7);
      cat='custom';
    }
    const amt=parseFloat(document.getElementById('exp-amt').value);
    const desc=document.getElementById('exp-desc').value.trim().slice(0,60);
    const date=document.getElementById('exp-date').value||todayStr();
    if(!isValidAmount(amt)){toast(TT('enter_valid_amount'),'error');return;}
    if(!desc){toast(TT('add_description'),'error');return;}
    if(!isValidDate(date)){toast(TT('enter_valid_date'),'error');return;}
    const chosenExpW = document.getElementById('exp-wallet')?.value || ((typeof activeWalletId !== 'undefined' && activeWalletId !== 'all') ? activeWalletId : 'cash');
    const payload={type:'expense',cat,customCat,label:desc,amt:Math.round(amt*100)/100,walletId:chosenExpW,date};
    try{
      if(editingId){
        await updateEntry(editingId, payload);
        toast(TT('expense_updated'),'success');
        cancelEdit();
      } else {
        const guardFn = (typeof maybeGuardAndSaveWithSmartEngine === 'function') ? maybeGuardAndSaveWithSmartEngine : maybeGuardAndSave;
        await guardFn(payload, async()=>{
          await saveEntry(payload);
          if (typeof renderWalletSwitcher === 'function') renderWalletSwitcher();
          toast(TT('expense_added'),'success');
          checkBudget();
          showSpendMoodToast(payload.amt);
          if(typeof maybeOfferRecurring==='function') maybeOfferRecurring({type:'expense',label:desc,amt,cat});
          if(isNewCustom) saveCustomExpenseCategory(customCat);
        }, desc);
      }
      document.getElementById('exp-amt').value='';
      document.getElementById('exp-desc').value='';
      document.getElementById('exp-custom').value='';
      document.getElementById('exp-custom-wrap').style.display='none';
    }catch(e){toast('Could not save: '+e.message,'error');}
  });
}

function startEdit(id){
  const allList = (typeof window !== 'undefined' && Array.isArray(window.entries) && window.entries.length) ? window.entries : entries;
  const entry = allList.find(e => e._id === id);
  if(!entry) return;
  openQuickComposer(entry.type, entry);
  const isHi = (typeof currentLang !== 'undefined' && currentLang === 'hi');
  toast(isHi ? 'एंट्री संपादन मोड ✏️' : 'Editing entry ✏️', 'info');
}

function cancelEdit(){
  editingId=null;
  closeTransactionComposer();
}

function deleteEntry(id){
  const allList = (typeof window !== 'undefined' && Array.isArray(window.entries) && window.entries.length) ? window.entries : entries;
  const target = allList.find(e => e._id === id);
  const isHi = (typeof currentLang !== 'undefined' && currentLang === 'hi');
  return showAppConfirm(isHi ? 'क्या आप इस एंट्री को हटाना चाहते हैं?' : 'Delete this entry?', async ()=>{
    try {
      if (target && target.transferPeerId) {
        await removeEntry(id);
        await removeEntry(target.transferPeerId);
        entries = entries.filter(e => e._id !== id && e._id !== target.transferPeerId);
        if (typeof window !== 'undefined') window.entries = entries;
      } else {
        await removeEntry(id);
        entries = entries.filter(e => e._id !== id);
        if (typeof window !== 'undefined') window.entries = entries;
      }
      updateHeaderStats();
      renderEntries();
      if (typeof renderHomeSnapshot === 'function') renderHomeSnapshot();
      if (typeof renderWalletSwitcher === 'function') renderWalletSwitcher();
      toast(TT('entry_deleted'),'success');
    } catch(e) {
      toast('Could not delete: '+e.message,'error');
    }
  });
}
window.deleteEntry = deleteEntry;

function resetFilter(){
  document.getElementById('filter-from').value='';
  document.getElementById('filter-to').value='';
  renderEntries();
}

// "Today"/"Yesterday" for the day-group headers (falls back to fmtDate)
function friendlyDay(d){
  const today=new Date();
  const tStr=dateToStr(today);
  const yest=new Date(today); yest.setDate(today.getDate()-1);
  const yStr=dateToStr(yest);
  if(d===tStr) return currentLang==='hi'?'आज':'Today';
  if(d===yStr) return currentLang==='hi'?'कल':'Yesterday';
  return fmtDate(d);
}

function renderEntries(){
  const from=document.getElementById('filter-from').value;
  const to=document.getElementById('filter-to').value;
  const sortMode=document.getElementById('entry-sort')?document.getElementById('entry-sort').value:'date-desc';
  let list=mainEntries().map(e=>({...e}));
  if(from)list=list.filter(e=>e.date>=from);
  if(to)list=list.filter(e=>e.date<=to);
  const el=document.getElementById('entries-list');
  if(!list.length){el.innerHTML=`<p class="empty">${TT('no_entries_range')}</p>`;return;}

  // Group entries by date to compute per-day balance
  const byDate={};
  list.forEach(e=>{
    if(!byDate[e.date])byDate[e.date]={income:0,expense:0,items:[]};
    if(e.type==='income')byDate[e.date].income+=e.amt;else byDate[e.date].expense+=e.amt;
    byDate[e.date].items.push(e);
  });

  let dateKeys=Object.keys(byDate);
  if(sortMode==='date-desc')dateKeys.sort((a,b)=>b.localeCompare(a));
  else if(sortMode==='date-asc')dateKeys.sort((a,b)=>a.localeCompare(b));
  else if(sortMode==='amt-desc')dateKeys.sort((a,b)=>(byDate[b].income-byDate[b].expense)-(byDate[a].income-byDate[a].expense));
  else if(sortMode==='amt-asc')dateKeys.sort((a,b)=>(byDate[a].income-byDate[a].expense)-(byDate[b].income-byDate[b].expense));

  el.innerHTML=dateKeys.map(d=>{
    const grp=byDate[d];
    const bal=grp.income-grp.expense;
    const balColor=bal>0?'var(--green)':(bal<0?'var(--red)':'var(--text-dim)');
    const items=[...grp.items].sort((a,b)=>sortMode.startsWith('amt')?b.amt-a.amt:0);
    const rows=items.map(e=>{
      const catKey=(e.cat&&e.cat!=='income'?e.cat:'other');
      const dotColor=(typeof CAT_COLORS!=='undefined'&&CAT_COLORS[catKey])||'var(--text-faint)';
      const meta=escapeHTML(displayCatLabel(e))+(e.note?' · '+escapeHTML(e.note):'');
      const wBadge=getWalletBadgeHtml(e);
      return `
      <div class="entry-row entry-card">
        <span class="cat-dot" style="background:${dotColor};color:${dotColor}"></span>
        <div class="entry-main">
          <span class="entry-label">${escapeHTML(e.label)}${e.event?' <span class="event-tag">🎉 '+escapeHTML(e.event)+'</span>':''}${wBadge}</span>
          <span class="entry-meta">${meta}</span>
        </div>
        <span class="entry-amt ${e.type==='income'?'income':'expense'}">${e.type==='income'?'+':'-'}₹${e.amt}</span>
        <div class="row-actions">
          <button class="icon-btn" onclick="startEdit('${e._id}')" aria-label="edit">✏️</button>
          <button class="icon-btn" onclick="deleteEntry('${e._id}')" aria-label="delete">🗑️</button>
        </div>
      </div>`;
    }).join('');
    const dLabel=(typeof friendlyDay==='function')?friendlyDay(d):fmtDate(d);
    return `
      <div class="day-group">
        <div class="day-group-head">
          <span class="day-group-title">${dLabel}</span>
          <span class="day-group-bal" style="color:${balColor}">${bal>=0?'+':'-'}₹${Math.abs(bal)}</span>
        </div>
        ${rows}
      </div>`;
  }).join('');
}
window.renderEntries = renderEntries;

function checkEntryLimit(){
  const banner = document.getElementById('limit-banner');
  if(!banner) return;
  if(!currentUser) { banner.style.display='none'; return; }
  const isGoogle = currentUser.providerData && currentUser.providerData[0].providerId === 'google.com';
  if(!isGoogle && !currentUser.emailVerified){
    banner.style.display = 'block';
    const count = entries.length;
    if(count >= 10) {
      banner.style.background = 'rgba(255,107,107,0.15)';
      banner.style.borderColor = 'rgba(255,107,107,0.3)';
      document.getElementById('limit-banner-text').textContent = currentLang === 'hi' 
        ? 'आपने सभी 10 मुफ्त एंट्रीज़ का उपयोग कर लिया है। असीमित एंट्रीज़ के लिए अपना ईमेल सत्यापित करें।'
        : "You've used all 10 free entries. Verify email for unlimited.";
    } else {
      banner.style.background = 'rgba(255,184,77,0.1)';
      banner.style.borderColor = 'rgba(255,184,77,0.3)';
      document.getElementById('limit-banner-text').textContent = currentLang === 'hi'
        ? `${count}/10 मुफ्त एंट्रीज़ का उपयोग किया गया। असीमित के लिए ईमेल सत्यापित करें।`
        : `${count}/10 free entries used. Verify email for unlimited.`;
    }
  } else {
    banner.style.display = 'none';
  }
}


// ===== PocketTrack Mobile Foundation =====
// Keep the bottom navigation/composer/voice FAB keyboard-aware on mobile.
(function initMobileViewportHandling(){
  const applyViewportState = () => {
    const vv = window.visualViewport;
    if (!vv) return;
    const keyboardOpen = (window.innerHeight - vv.height) > 140;
    document.documentElement.classList.toggle('keyboard-open', keyboardOpen);
    document.documentElement.style.setProperty('--pt-visual-height', `${Math.round(vv.height)}px`);
  };
  const bind = () => {
    applyViewportState();
    window.visualViewport?.addEventListener('resize', applyViewportState, {passive:true});
    window.visualViewport?.addEventListener('scroll', applyViewportState, {passive:true});
    window.addEventListener('resize', applyViewportState, {passive:true});
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, {once:true});
  else bind();
})();

// ===== Manifest app-shortcut actions (?action=expense|income|report) =====
(function initShortcutAction(){
  const run = () => {
    if (typeof location === 'undefined' || !location.search) return;
    const action = new URLSearchParams(location.search).get('action');
    if(!action) return;
    if(action==='expense' || action==='income'){ if(typeof openQuickComposer==='function') openQuickComposer(action); }
    else if(action==='report'){ if(typeof setTab==='function') setTab('report'); }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, {once:true});
  else run();
})();

window.openQuickComposer = openQuickComposer;
window.closeTransactionComposer = closeTransactionComposer;
window.setComposerMode = setComposerMode;
window.submitTransactionComposer = submitTransactionComposer;
window.startEdit = startEdit;
window.cancelEdit = cancelEdit;
window.updateEntry = updateEntry;
window.deleteEntry = deleteEntry;

