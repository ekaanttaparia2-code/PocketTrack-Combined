/* =====================================================================
   recurring.js — PocketTrack Recurring Expenses (Phase 5)
   Rules auto-post entries when due: daily / weekly / monthly / yearly.
   Entries carry note '🔁 Recurring' so Insights & Smart Context can
   identify them later.
   ===================================================================== */

let recUnsubscribe = null;
let recurringRules = [];
const _recProcessed = new Set();

function detachRecurringListener(){
  if (recUnsubscribe) { try { recUnsubscribe(); } catch(e){} recUnsubscribe = null; }
}

function resetRecurringLocal(){
  detachRecurringListener();
  recurringRules = [];
  _recProcessed.clear();
}

function listenToRecurring(){
  if (!currentUser) return;
  detachRecurringListener();
  try {
    recUnsubscribe = db.collection('users').doc(currentUser.uid).collection('recurring')
      .onSnapshot(snap => {
        recurringRules = snap.docs.map(d => ({ ...d.data(), _id: d.id }));
        renderRecurring();
        if(typeof renderSubscriptionRadar==='function') renderSubscriptionRadar();
        processRecurringDue();
      }, err => {
        console.warn('Recurring listener warning:', err.message);
        renderRecurring();
        if(typeof renderSubscriptionRadar==='function') renderSubscriptionRadar();
      });
  } catch(e) {
    console.warn('Failed to attach recurring listener:', e);
  }
  if(typeof processRecurringDue==='function') setTimeout(processRecurringDue, 1200);
}

window.addEventListener('online', ()=>{ if(currentUser && typeof processRecurringDue==='function') setTimeout(processRecurringDue, 2500); });

function recFreqLabel(f){
  const en={daily:'Daily',weekly:'Weekly',monthly:'Monthly',yearly:'Yearly'};
  const hi={daily:'दैनिक',weekly:'साप्ताहिक',monthly:'मासिक',yearly:'वार्षिक'};
  return (currentLang==='hi'?hi:en)[f]||f;
}

function addRecInterval(dateStr, freq){
  const p=dateStr.split('-').map(Number);
  const dt=new Date(p[0],p[1]-1,p[2]);
  if(freq==='daily') dt.setDate(dt.getDate()+1);
  else if(freq==='weekly') dt.setDate(dt.getDate()+7);
  else if(freq==='monthly'){ const day=dt.getDate(); dt.setMonth(dt.getMonth()+1); if(dt.getDate()!==day) dt.setDate(0); }
  else if(freq==='yearly'){ const day=dt.getDate(), mo=dt.getMonth(); dt.setFullYear(dt.getFullYear()+1); if(dt.getMonth()!==mo||dt.getDate()!==day) dt.setDate(0); }
  return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0');
}

async function processRecurringDue(){
  if(!currentUser || typeof todayStr !== 'function') return;
  const today=todayStr();
  const due=recurringRules.filter(r=>r.active!==false && r.nextDate && r.nextDate<=today && !_recProcessed.has(r._id));
  if(!due.length) return;
  for(const rule of due){
    _recProcessed.add(rule._id);
    let next=rule.nextDate, posted=0;
    while(next<=today && posted<24){
      try{
        await db.collection('users').doc(currentUser.uid).collection('entries').add({
          type: rule.type==='income' ? 'income' : 'expense',
          cat: rule.type==='income' ? 'income' : (rule.cat||'other'),
          label: rule.label,
          note: '🔁 Recurring',
          amt: Math.round((Number(rule.amt)||0)*100)/100,
          date: next,
          createdAt: Date.now()
        });
        posted++;
      }catch(e){
        console.warn('Recurring entry failed:', e.message);
        if(posted===0){ _recProcessed.delete(rule._id); break; }
        break;
      }
      next=addRecInterval(next, rule.freq);
    }
    if(posted>0){
      try{ await db.collection('users').doc(currentUser.uid).collection('recurring').doc(rule._id).update({nextDate:next}); }catch(e){}
      toast((currentLang==='hi'?'🔁 आवर्ती दर्ज: ':'🔁 Logged recurring: ')+rule.label,'success');
      if(typeof showLocalNotification==='function') showLocalNotification('PocketTrack',(currentLang==='hi'?'आवर्ती दर्ज: ':'Logged recurring: ')+rule.label);
    }
  }
}

function renderRecurring(){
  const listEl=document.getElementById('recurring-list');
  if(!listEl) return;
  const totalEl=document.getElementById('rec-monthly-total');
  const addLbl=document.getElementById('rec-add-label');
  if(totalEl){
    const monthly=recurringRules.filter(r=>r.active!==false && r.type!=='income')
      .reduce((s,r)=>{
        const a=Number(r.amt)||0;
        if(r.freq==='daily') return s+a*30;
        if(r.freq==='weekly') return s+a*4.33;
        if(r.freq==='yearly') return s+a/12;
        return s+a;
      },0);
    totalEl.textContent = recurringRules.length
      ? (currentLang==='hi' ? `≈ ₹${Math.round(monthly)} /माह प्रतिबद्ध` : `≈ ₹${Math.round(monthly)}/mo committed`)
      : '';
  }
  if(addLbl) addLbl.textContent = currentLang==='hi' ? 'नियम जोड़ें' : 'Add rule';

  if(!recurringRules.length){
    listEl.innerHTML = `
      <div style="text-align:center;padding:26px 10px">
        <div style="font-size:40px;margin-bottom:8px">🔁</div>
        <p style="font-weight:600;margin:0 0 6px">${currentLang==='hi'?'कोई आवर्ती खर्च नहीं':'No recurring expenses yet'}</p>
        <p style="font-size:12px;color:var(--text-dim);margin:0">${currentLang==='hi'?'किराया, सब्सक्रिप्शन, EMI — एक बार जोड़ें, खुद दर्ज होगा।':'Rent, subscriptions, EMIs — add once, logged automatically.'}</p>
      </div>`;
    return;
  }
  const sorted=[...recurringRules].sort((a,b)=>(a.nextDate||'').localeCompare(b.nextDate||''));
  listEl.innerHTML = sorted.map(r=>{
    const active=r.active!==false;
    const due=active && r.nextDate && r.nextDate<=todayStr();
    const isInc=r.type==='income';
    return `
    <div class="entry-row" style="opacity:${active?1:0.55}">
      <span class="date-chip">${isInc?'📥':'🔁'} ${recFreqLabel(r.freq)}</span>
      <span style="flex:1;color:var(--text)">
        ${escapeHTML(r.label||'')}
        <span style="display:block;font-size:11px;color:var(--text-faint)">${currentLang==='hi'?'अगला':'Next'}: ${r.nextDate?fmtDate(r.nextDate):'—'}${due?` · <b style="color:var(--amber)">${currentLang==='hi'?'आज देय':'due now'}</b>`:''}</span>
      </span>
      <span style="font-weight:600;color:${isInc?'var(--green)':'var(--red)'}">₹${r.amt}</span>
      <div class="row-actions">
        <button class="icon-btn" onclick="editRecurring('${r._id}')" aria-label="edit">✏️</button>
        <button class="icon-btn" onclick="toggleRecurring('${r._id}')" aria-label="${active?'pause':'resume'}">${active?'⏸️':'▶️'}</button>
        <button class="icon-btn" onclick="deleteRecurring('${r._id}')" aria-label="delete">🗑️</button>
      </div>
    </div>`;
  }).join('');
}

/* ---------- Subscription Radar (Reports tab) ---------- */
function subRadarMonthly(r){
  const a=Number(r.amt)||0;
  if(r.freq==='daily') return a*30;
  if(r.freq==='weekly') return a*4.33;
  if(r.freq==='yearly') return a/12;
  return a;
}

function renderSubscriptionRadar(){
  const el=document.getElementById('sub-radar');
  if(!el) return;
  const act=recurringRules.filter(r=>r.active!==false && r.type!=='income');
  if(!act.length){ el.innerHTML=''; return; }
  const isHi=currentLang==='hi';
  const total=Math.round(act.reduce((s,r)=>s+subRadarMonthly(r),0));
  const maxM=Math.max(...act.map(subRadarMonthly),1);
  const sorted=[...act].sort((a,b)=>subRadarMonthly(b)-subRadarMonthly(a));
  const rows=sorted.map(r=>{
    const m=subRadarMonthly(r);
    const pct=Math.max(6,Math.round(m/maxM*100));
    const per=isHi?'माह':'mo';
    return `
      <div style="margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:12.5px">
          <span style="color:var(--text);font-weight:600">${escapeHTML(r.label||'')}</span>
          <span style="white-space:nowrap;color:var(--red);font-weight:700">₹${m%1?m.toFixed(2):Math.round(m)}/${per}</span>
        </div>
        <div style="height:6px;border-radius:3px;background:rgba(255,255,255,.07);margin-top:5px;overflow:hidden">
          <div style="height:100%;width:${pct}%;border-radius:3px;background:linear-gradient(90deg,var(--accent,#8b5cf6),var(--accent2,#ff7eb3))"></div>
        </div>
        <div style="font-size:10.5px;color:var(--text-faint);margin-top:3px">${recFreqLabel(r.freq)} · ${isHi?'अगला':'next'} ${r.nextDate?fmtDate(r.nextDate):'—'}</div>
      </div>`;
  }).join('');
  el.innerHTML=`
    <div class="card" style="margin-bottom:0.9rem">
      <p class="sec-title"><i class="ti ti-report-money"></i><span>${isHi?'📡 सब्सक्रिप्शन रडार':'📡 Subscription radar'}</span></p>
      <p style="font-size:12.5px;color:var(--text-dim);margin:0 0 12px">${isHi
        ?`आपके बताए आवर्ती खर्चों का अनुमानित प्रतिबद्धता: <b style="color:var(--red)">₹${total}/माह</b>`
        :`Estimated locked-in spending from your recurring rules: <b style="color:var(--red)">₹${total}/mo</b>`}</p>
      ${rows}
    </div>`;
}

/* ---------- Smart detection: offer to make an entry recurring ---------- */
const _REC_TRIVIAL = ['voice expense','voice income','expense','income'];

function looksRecurring(text){
  const t=String(text||'').toLowerCase();
  return /(recurr|every\s*(month|week|year)|each\s*(month|week|year)|monthly|har\s*mahin|हर\s*महीने|हर\s*महीना|हर\s*hafte|subscription|netflix|prime\s*video|hotstar|spotify|youtube\s*premium|\bemi\b|\bkist\b|किस्त|kiraya|किराया|\brent\b|मकान|\bbill\b|\bbijli\b|बिजली|wifi|recharge|insurance|बीमा|gym)/.test(t);
}

function maybeOfferRecurring(data){
  try{
    if(!currentUser || typeof showAppConfirm!=='function') return;
    const label=String(data&&data.label||'').trim().slice(0,40);
    const amt=Math.abs(Number(data&&data.amt)||0);
    if(!label || !_REC_TRIVIAL.every(x=>x!==label.toLowerCase())) return;
    const haystack=label+' '+String((data&&data.hint)||'');
    if(!looksRecurring(haystack)) return;
    const dupe=recurringRules.some(r=>r.active!==false && String(r.label).toLowerCase()===label.toLowerCase() && Math.abs((Number(r.amt)||0)-amt)<0.01);
    if(dupe) return;
    const isHi=currentLang==='hi';
    showAppConfirm(
      isHi?`🔁 "${label}" बार-बार आने वाला लगता है — इसे अपने आप दर्ज करवाएं?`:`🔁 "${label}" looks like a recurring expense — should PocketTrack log it automatically?`,
      ()=>showAddRecurringModal({label, amt, type:(data.type==='income'?'income':'expense'), cat:data.cat})
    );
  }catch(e){ console.warn('recurring offer failed:', e); }
}

/* ---------- Bottom-sheet manager (opened from the composer 🔁 button) ---------- */
let _recSheet=null;

function toggleRecurringSheet(){
  if(_recSheet){ closeRecurringSheet(); return; }
  _recSheet=document.createElement('div');
  _recSheet.className='transaction-composer-backdrop';
  _recSheet.id='rec-sheet-backdrop';
  _recSheet.style.zIndex='900';
  _recSheet.innerHTML=`
    <div class="transaction-composer" role="dialog" aria-modal="true">
      <button class="composer-close" onclick="closeRecurringSheet()" aria-label="Close">×</button>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:2px;padding-right:26px">
        <h2 style="margin:0;font-family:'Space Grotesk',sans-serif">${currentLang==='hi'?'आवर्ती खर्च':'Recurring'}</h2>
        <span id="rec-monthly-total" style="font-size:12px;color:var(--text-dim);text-align:right"></span>
      </div>
      <p style="font-size:12px;color:var(--text-dim);margin:2px 0 10px">${currentLang==='hi'?'देय तारीख पर खुद दर्ज हो जाता है':'Logged automatically when due'}</p>
      <div id="recurring-list"><p class="empty">…</p></div>
      <button class="btn primary" style="width:100%;margin-top:14px" onclick="showAddRecurringModal()"><span id="rec-add-label">Add rule</span></button>
    </div>`;
  document.body.appendChild(_recSheet);
  document.body.classList.add('composer-open');
  requestAnimationFrame(()=>{ if(_recSheet) _recSheet.style.display='flex'; });
  renderRecurring();
}

function closeRecurringSheet(){
  if(!_recSheet) return;
  const s=_recSheet; _recSheet=null;
  s.remove();
  document.body.classList.remove('composer-open');
}

function openRecurringModal(htmlContent){
  let backdrop=document.getElementById('recurring-modal-backdrop');
  if(!backdrop){
    backdrop=document.createElement('div');
    backdrop.id='recurring-modal-backdrop';
    backdrop.style.cssText='position:fixed;inset:0;background:rgba(10,8,26,0.78);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);z-index:99998;display:flex;align-items:center;justify-content:center;padding:20px;';
    document.body.appendChild(backdrop);
  }
  backdrop.innerHTML=`
    <div class="card" style="width:100%;max-width:420px;background:var(--card-solid,#1f1840);border:1px solid rgba(255,255,255,0.15);box-shadow:0 20px 50px rgba(0,0,0,0.6);padding:24px 20px;border-radius:20px;max-height:88vh;display:flex;flex-direction:column;">
      <button class="icon-btn" onclick="closeRecurringModal()" style="position:absolute;top:16px;right:16px;font-size:20px;color:var(--text-dim,#9ca3af);"><i class="ti ti-x"></i></button>
      ${htmlContent}
    </div>`;
  backdrop.style.display='flex';
}

function closeRecurringModal(){
  _recEditingId=null;
  const b=document.getElementById('recurring-modal-backdrop');
  if(b) b.remove();
}

let _recEditingId=null;

function editRecurring(id){
  const r=recurringRules.find(x=>x._id===id);
  if(!r) return;
  _recEditingId=id;
  showAddRecurringModal({label:r.label,amt:r.amt,type:r.type,cat:r.cat,freq:r.freq,nextDate:r.nextDate});
}

function showAddRecurringModal(prefill){
  if(!currentUser){ toast(TT('not_logged_in'),'error'); return; }
  const pf=prefill||{};
  const isHi=currentLang==='hi';
  let catOptions='';
  ['food','travel','friends','home','shopping','entertainment','health','education','work','other'].forEach(c=>{
    catOptions+=`<option value="${c}"${pf.cat===c?' selected':''}>${CAT_LABEL(c)}</option>`;
  });
  openRecurringModal(`
    <h3 style="margin:0 0 14px;font-family:'Space Grotesk',sans-serif;">${isHi?(_recEditingId?'✏️ नियम बदलें':'🔁 आवर्ती नियम जोड़ें'):(_recEditingId?'✏️ Edit Recurring Rule':'🔁 Add Recurring Rule')}</h3>
    <label style="font-size:11px;color:var(--text-dim)">${isHi?'क्या':'What'}</label>
    <input id="rec-label" type="text" maxlength="40" value="${pf.label?escapeHTML(pf.label):''}" placeholder="${isHi?'जैसे Netflix, किराया, EMI':'e.g. Netflix, Rent, EMI'}" style="width:100%;box-sizing:border-box"/>
    <label style="font-size:11px;color:var(--text-dim);margin-top:8px;display:block">${isHi?'कितना':'Amount (₹)'}</label>
    <input id="rec-amt" type="number" min="1" step="0.01" ${pf.amt?`value="${pf.amt}"`:''} style="width:100%;box-sizing:border-box"/>
    <label style="font-size:11px;color:var(--text-dim);margin-top:8px;display:block">${isHi?'प्रकार':'Type'}</label>
    <select id="rec-type" onchange="document.getElementById('rec-cat-wrap').style.display=this.value==='income'?'none':'block'" style="width:100%">
      <option value="expense"${pf.type!=='income'?' selected':''}>${isHi?'खर्च':'Expense'}</option>
      <option value="income"${pf.type==='income'?' selected':''}>${isHi?'आय':'Income'}</option>
    </select>
    <div id="rec-cat-wrap"${pf.type==='income'?' style="display:none"':''}>
      <label style="font-size:11px;color:var(--text-dim);margin-top:8px;display:block">${isHi?'श्रेणी':'Category'}</label>
      <select id="rec-cat" style="width:100%">${catOptions}</select>
    </div>
    <label style="font-size:11px;color:var(--text-dim);margin-top:8px;display:block">${isHi?'कितनी बार':'How often'}</label>
    <select id="rec-freq" style="width:100%">
      <option value="monthly"${pf.freq==='monthly'?' selected':''}>${isHi?'हर महीने':'Every month'}</option>
      <option value="weekly"${pf.freq==='weekly'?' selected':''}>${isHi?'हर हफ्ते':'Every week'}</option>
      <option value="yearly"${pf.freq==='yearly'?' selected':''}>${isHi?'हर साल':'Every year'}</option>
      <option value="daily"${pf.freq==='daily'?' selected':''}>${isHi?'हर दिन':'Every day'}</option>
    </select>
    <label style="font-size:11px;color:var(--text-dim);margin-top:8px;display:block">${isHi?(_recEditingId?'अगली तारीख':'पहली तारीख'):(_recEditingId?'Next due date':'First due date')}</label>
    <input id="rec-date" type="date" value="${pf.nextDate||todayStr()}" style="width:100%"/>
    <button class="btn primary" style="width:100%;margin-top:16px" onclick="saveRecurringRule()">${isHi?'सेव करें':'Save rule'}</button>
    <p style="font-size:10.5px;color:var(--text-faint);margin:10px 0 0;text-align:center">${isHi?'देय तारीख पर PocketTrack खुद एंट्री बनाएगा':'PocketTrack will log it automatically when due'}</p>
  `);
}

async function saveRecurringRule(){
  if(!currentUser) return;
  const label=document.getElementById('rec-label').value.trim().slice(0,40);
  const amt=parseFloat(document.getElementById('rec-amt').value);
  const type=document.getElementById('rec-type').value;
  const freq=document.getElementById('rec-freq').value;
  const startDate=document.getElementById('rec-date').value||todayStr();
  const cat=type==='income' ? 'income' : document.getElementById('rec-cat').value;
  if(!label){ toast(currentLang==='hi'?'नाम लिखें':'Enter a name','error'); return; }
  if(!isFinite(amt)||amt<=0||(typeof isValidAmount==='function'&&!isValidAmount(amt))){ toast(currentLang==='hi'?'सही राशि डालें':'Enter a valid amount','error'); return; }
  try{
    if(_recEditingId){
      const editId=_recEditingId;
      _recEditingId=null;
      await db.collection('users').doc(currentUser.uid).collection('recurring').doc(editId).update({
        type, cat, label, amt: Math.round(amt*100)/100, freq, nextDate: startDate
      });
      closeRecurringModal();
      toast(currentLang==='hi'?'✏️ नियम अपडेट हो गया':'✏️ Rule updated','success');
      return;
    }
    await db.collection('users').doc(currentUser.uid).collection('recurring').add({
      type, cat, label, amt: Math.round(amt*100)/100, freq,
      nextDate: startDate, active: true, createdAt: Date.now()
    });
    closeRecurringModal();
    toast(currentLang==='hi'?'🔁 आवर्ती नियम जोड़ा गया':'🔁 Recurring rule added','success');
  }catch(e){ _recEditingId=null; toast('Could not save: '+e.message,'error'); }
}

function toggleRecurring(id){
  const r=recurringRules.find(x=>x._id===id);
  if(!r) return;
  db.collection('users').doc(currentUser.uid).collection('recurring').doc(id)
    .update({active: r.active===false}).catch(e=>toast('Could not update: '+e.message,'error'));
}

function deleteRecurring(id){
  const isHi=currentLang==='hi';
  showAppConfirm(isHi?'आवर्ती नियम हटाएं? पहले से दर्ज एंट्रीज़ सुरक्षित रहेंगी।':'Delete this recurring rule? Already-logged entries stay.', ()=>{
    db.collection('users').doc(currentUser.uid).collection('recurring').doc(id).delete()
      .catch(e=>toast('Could not delete: '+e.message,'error'));
  });
}
