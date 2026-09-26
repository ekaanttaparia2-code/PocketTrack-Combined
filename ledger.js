(function() {
  const trans = (typeof window !== 'undefined' && window.TRANSLATIONS) ? window.TRANSLATIONS : ((typeof global !== 'undefined' && global.TRANSLATIONS) ? global.TRANSLATIONS : {});
  Object.assign(trans, {
  nav_ledger: { en: 'Ledger Accounts', hi: 'खाता प्रणाली' },
  btn_add_person: { en: '+ Add Contact', hi: '+ संपर्क जोड़ें' },
  ledger_total_owed_to_you: { en: 'Total You Will Receive', hi: 'आपको कुल मिलेगा' },
  ledger_total_you_owe: { en: 'Total You Owe', hi: 'आपको कुल देना है' },
  ledger_give: { en: 'Gave ₹', hi: '₹ दिए' },
  ledger_receive: { en: 'Received ₹', hi: '₹ मिले' },
  ledger_no_people: { en: 'No ledger contacts added yet.', hi: 'अभी तक कोई संपर्क नहीं जोड़ा गया है।' },
  ledger_person_name: { en: 'Contact Name (e.g. Rahul, Priya, Roommate)', hi: 'संपर्क नाम (जैसे राहुल, प्रिया)' },
  btn_delete_person: { en: 'Delete Contact', hi: 'संपर्क हटाएं' },
  ledger_no_contacts_title: { en: 'No Ledger Contacts Yet', hi: 'अभी तक कोई संपर्क नहीं' },
  ledger_empty_desc: { en: 'Keep track of money lent to or borrowed from friends, roommates, or vendors in one single place.', hi: 'दोस्तों, रूममेट्स या दुकानदारों से दिए या लिए गए पैसे को एक ही जगह ट्रैक करें।' },
  ledger_owes_you: { en: 'Owes you', hi: 'आपको मिलेगा' },
  ledger_you_owe: { en: 'You owe', hi: 'आपको देना है' },
  ledger_settled: { en: 'Settled', hi: 'सब चुकता' },
  ledger_tx_count: { en: 'transactions', hi: 'लेन-देन' },
  ledger_tap_history: { en: 'Tap for history →', hi: 'इतिहास के लिए दबाएं →' },
  ledger_added: { en: 'Added', hi: 'जोड़ा गया' },
  ledger_recorded: { en: 'Recorded', hi: 'दर्ज किया गया' },
  ledger_no_tx: { en: 'No transaction entries yet with', hi: 'अभी तक इसके साथ कोई लेन-देन नहीं' },
  ledger_history: { en: 'History', hi: 'इतिहास' },
  ledger_delete_entry: { en: 'Delete entry', hi: 'एंट्री हटाएं' }
  });
})();

let ledgerUnsubscribe = null;
let ledgerTxUnsubs = [];
let ledgerPeople = [];
window.ledgerPeople = ledgerPeople;
function getLedgerPeopleList() {
  return (typeof window !== 'undefined' && Array.isArray(window.ledgerPeople) && window.ledgerPeople.length) ? window.ledgerPeople : ledgerPeople;
}
const LOCAL_LEDGER_KEY = 'pockettrack_local_ledger';

function ledgerCacheKey(){
  return (typeof currentUser !== 'undefined' && currentUser) ? LOCAL_LEDGER_KEY + '_' + currentUser.uid : null;
}

function saveLocalLedgerCache() {
  const ck = ledgerCacheKey(); if(!ck) return;
  try { localStorage.setItem(ck, JSON.stringify(ledgerPeople)); } catch(e){ console.warn('Ledger cache save warning:', e.message); }
}

function detachLedgerListeners(){
  if (ledgerUnsubscribe) { try { ledgerUnsubscribe(); } catch(e){ console.warn('Unsubscribe error:', e.message); } ledgerUnsubscribe = null; }
  ledgerTxUnsubs.forEach(u => { try { u(); } catch(e){ console.warn('Tx unsubscribe error:', e.message); } });
  ledgerTxUnsubs = [];
}

function resetLedgerLocal() {
  detachLedgerListeners();
  ledgerPeople = [];
  try {
    Object.keys(localStorage)
      .filter(k => k === LOCAL_LEDGER_KEY || k.indexOf(LOCAL_LEDGER_KEY + '_') === 0)
      .forEach(k => localStorage.removeItem(k));
  } catch(e){ console.warn('Ledger cache clear warning:', e.message); }
}

function loadLocalLedgerCache() {
  ledgerPeople = [];
  const ck = ledgerCacheKey(); if(!ck) return;
  try { const cached = localStorage.getItem(ck); if (cached) ledgerPeople = JSON.parse(cached) || []; } catch(e){ console.warn('Ledger cache load error:', e.message); }
}

// Dedicated Custom Glassmorphism Modal System for Ledger (Zero browser prompts)
function openLedgerModal(htmlContent) {
  let backdrop = document.getElementById('ledger-custom-modal-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'ledger-custom-modal-backdrop';
    backdrop.style.cssText = 'position:fixed;inset:0;background:rgba(10,8,26,0.78);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);z-index:100000;display:flex;align-items:center;justify-content:center;padding:16px;';
    document.body.appendChild(backdrop);
  }
  backdrop.innerHTML = `
    <div class="card" style="width:100%;max-width:420px;background:var(--card-solid,#1f1840);border:1px solid rgba(255,255,255,0.15);box-shadow:0 20px 50px rgba(0,0,0,0.6);position:relative;padding:24px 20px;border-radius:24px;max-height:88vh;display:flex;flex-direction:column;box-sizing:border-box;">
      <button class="icon-btn" onclick="closeLedgerModal()" style="position:absolute;top:16px;right:16px;font-size:20px;color:var(--text-dim,#9ca3af);"><i class="ti ti-x"></i></button>
      ${htmlContent}
    </div>
  `;
  backdrop.style.display = 'flex';
}

function closeLedgerModal() {
  const backdrop = document.getElementById('ledger-custom-modal-backdrop');
  if (backdrop) backdrop.style.display = 'none';
}

function closeModal() {
  closeLedgerModal();
  if (typeof closeAppModal === 'function') closeAppModal();
}

function listenToLedger() {
  if (!currentUser) return;
  if (ledgerUnsubscribe) { try { ledgerUnsubscribe(); } catch(e){} }
  ledgerTxUnsubs.forEach(u => { try { u(); } catch(e){} });
  ledgerTxUnsubs = [];
  loadLocalLedgerCache();
  renderLedger();

  try {
    ledgerUnsubscribe = db.collection('users').doc(currentUser.uid).collection('ledger')
      .onSnapshot((snap) => {
        ledgerTxUnsubs.forEach(u => { try { u(); } catch(e){} });
        ledgerTxUnsubs = [];
        
        const docs = snap.docs;
        if (!docs.length) {
          ledgerPeople = [];
          saveLocalLedgerCache();
          renderLedger();
          return;
        }

        let newPeopleList = docs.map(d => ({
          _id: d.id,
          name: d.data().name || 'Contact',
          phone: d.data().phone || '',
          createdAt: d.data().createdAt ? d.data().createdAt.toMillis() : Date.now(),
          transactions: []
        }));

        let loadedCount = 0;
        newPeopleList.forEach(person => {
          const u = db.collection('users').doc(currentUser.uid).collection('ledger').doc(person._id).collection('transactions')
            .onSnapshot((txSnap) => {
              person.transactions = txSnap.docs.map(td => ({
                _id: td.id,
                amount: td.data().amount || 0,
                type: td.data().type || 'gave',
                note: td.data().note || '',
                date: td.data().date || '',
                createdAt: td.data().createdAt ? td.data().createdAt.toMillis() : Date.now()
              })).sort((a, b) => b.createdAt - a.createdAt);

              loadedCount++;
              if (loadedCount >= newPeopleList.length) {
                ledgerPeople = newPeopleList;
                saveLocalLedgerCache();
                renderLedger();
              }
            });
          ledgerTxUnsubs.push(u);
        });
      }, err => {
        console.warn('Ledger realtime offline fallback:', err.message);
      });
  } catch(e) {
    console.warn('Ledger error:', e);
  }
}

function renderLedger() {
  const container = document.getElementById('ledger-people-list');
  if (!container) return;

  let totalYouWillReceive = 0;
  let totalYouOwe = 0;

  const peopleWithBalances = (ledgerPeople || []).map(person => {
    let balance = 0;
    (person.transactions || []).forEach(tx => {
      if (tx.type === 'gave') balance += tx.amount;
      else if (tx.type === 'received') balance -= tx.amount;
    });
    if (balance > 0) totalYouWillReceive += balance;
    else if (balance < 0) totalYouOwe += Math.abs(balance);
    return { ...person, balance };
  });

  const recEl = document.getElementById('ledger-total-receive');
  const oweEl = document.getElementById('ledger-total-owe');
  if (recEl) recEl.textContent = '₹' + totalYouWillReceive.toLocaleString('en-IN');
  if (oweEl) oweEl.textContent = '₹' + totalYouOwe.toLocaleString('en-IN');

  if (!peopleWithBalances.length) {
    container.innerHTML = `
      <div class="card" style="text-align:center; padding:38px 20px; border-radius:24px;">
        <div style="font-size:44px; margin-bottom:12px;">📑</div>
        <h3 style="margin:0 0 6px; font-family:'Space Grotesk',sans-serif; font-size:18px;">${TT('ledger_no_contacts_title')}</h3>
        <p style="color:var(--text-dim); font-size:13px; max-width:320px; margin:0 auto 20px; line-height:1.45;">${TT('ledger_empty_desc')}</p>
        <button class="btn primary" onclick="showAddPersonModal()" style="border-radius:14px; padding:12px 22px; font-weight:700;">${TT('btn_add_person')}</button>
      </div>
    `;
    return;
  }

  const isHi = (typeof currentLang !== 'undefined' && currentLang === 'hi');

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
      <h3 style="margin:0; font-family:'Space Grotesk',sans-serif; font-size:16px; color:#fff;">${isHi ? 'आपके संपर्क' : 'Your Contacts'} (${peopleWithBalances.length})</h3>
      <button class="btn btn-sm primary" onclick="showAddPersonModal()" style="border-radius:12px; font-size:12px; padding:6px 14px;">${TT('btn_add_person')}</button>
    </div>
    <div style="display:grid; grid-template-columns:1fr; gap:10px;">
      ${peopleWithBalances.map(person => {
        const bal = person.balance;
        let balColor = 'var(--text-dim,#9ca3af)';
        let balText = TT('ledger_settled');
        let balBadge = 'background:rgba(255,255,255,0.06); color:var(--text-dim,#9ca3af); border:1px solid var(--border);';

        if (bal > 0) {
          balColor = 'var(--green,#4ade80)';
          balText = `${TT('ledger_owes_you')} ₹${bal.toLocaleString('en-IN')}`;
          balBadge = 'background:rgba(74,222,128,0.15); color:var(--green,#4ade80); border:1px solid rgba(74,222,128,0.3);';
        } else if (bal < 0) {
          balColor = 'var(--red,#f87171)';
          balText = `${TT('ledger_you_owe')} ₹${Math.abs(bal).toLocaleString('en-IN')}`;
          balBadge = 'background:rgba(248,113,113,0.15); color:var(--red,#f87171); border:1px solid rgba(248,113,113,0.3);';
        }

        const avatarLetter = (person.name || 'P').charAt(0).toUpperCase();

        return `
          <div class="card" onclick="showPersonDetail('${person._id}')" style="cursor:pointer; padding:14px 16px; border-radius:20px; transition:transform 0.15s, border-color 0.15s; border:1px solid var(--border); background:linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02)); display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; align-items:center; gap:12px;">
              <div style="width:42px; height:42px; border-radius:50%; background:linear-gradient(135deg, var(--accent,#8b5cf6), var(--accent2,#ec4899)); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:17px; color:#fff; flex-shrink:0;">
                ${avatarLetter}
              </div>
              <div>
                <div style="font-weight:700; font-size:15px; color:#fff;">${escapeHTML(person.name)}</div>
                <div style="font-size:11.5px; color:var(--text-dim); margin-top:2px;">
                  ${person.phone ? `📞 ${escapeHTML(person.phone)} · ` : ''}${(person.transactions || []).length} ${TT('ledger_tx_count')}
                </div>
              </div>
            </div>
            <div style="text-align:right;">
              <span style="display:inline-block; padding:4px 10px; border-radius:12px; font-size:12px; font-weight:700; ${balBadge}">
                ${balText}
              </span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// In-App Modal for Adding a Contact (No browser prompt)
function showAddPersonModal() {
  if (typeof canAddLedgerContact === 'function' && !canAddLedgerContact((ledgerPeople || []).length)) {
    if (typeof showProLimitModal === 'function') {
      showProLimitModal('Ledger Accounts', '5 contacts');
    } else {
      toast('Upgrade to Pro to add more than 5 contacts', 'info');
    }
    return;
  }
  const isHi = (typeof currentLang !== 'undefined' && currentLang === 'hi');
  const title = isHi ? 'नया संपर्क जोड़ें' : 'Add New Contact';
  const desc = isHi ? 'मित्र, रूममेट या संपर्क का नाम व मोबाइल नंबर' : 'Enter friend name & optional WhatsApp number';
  const btnSave = isHi ? '+ संपर्क जोड़ें' : '+ Save Contact';
  
  const html = `
    <div style="text-align:center; margin-bottom:16px;">
      <div style="font-size:36px; margin-bottom:4px;">📑</div>
      <h3 style="margin:0 0 4px; font-family:'Space Grotesk',sans-serif; font-size:20px; font-weight:800;">${title}</h3>
      <p style="color:var(--text-dim); font-size:12.5px; margin:0;">${desc}</p>
    </div>
    
    <div style="margin-bottom:12px;">
      <label style="font-size:12px; font-weight:600; color:var(--text-dim); display:block; margin-bottom:4px;">${isHi ? 'नाम' : 'Contact Name'}</label>
      <input type="text" id="new-person-name-input" placeholder="${isHi ? 'जैसे राहुल, प्रिया' : 'e.g. Rahul, Priya'}" style="width:100%; padding:12px 14px; border-radius:14px; border:1px solid var(--border); background:rgba(0,0,0,0.3); color:#fff; font-size:14.5px; box-sizing:border-box;" autofocus onkeydown="if(event.key==='Enter')document.getElementById('new-person-phone-input')?.focus()"/>
    </div>

    <div style="margin-bottom:20px;">
      <label style="font-size:12px; font-weight:600; color:var(--text-dim); display:block; margin-bottom:4px;">${isHi ? 'मोबाइल नंबर (WhatsApp के लिए)' : 'Mobile Number (for WhatsApp reminders)'}</label>
      <input type="tel" id="new-person-phone-input" placeholder="e.g. 9876543210" style="width:100%; padding:12px 14px; border-radius:14px; border:1px solid var(--border); background:rgba(0,0,0,0.3); color:#fff; font-size:14.5px; box-sizing:border-box;" onkeydown="if(event.key==='Enter')submitAddPersonModal()"/>
    </div>

    <div class="btn-row" style="gap:10px;">
      <button class="btn" style="flex:1" onclick="closeLedgerModal()">${isHi ? 'रद्द करें' : 'Cancel'}</button>
      <button class="btn primary" style="flex:1.2; padding:12px; font-weight:700;" onclick="submitAddPersonModal()">${btnSave}</button>
    </div>
  `;
  openLedgerModal(html);
  setTimeout(() => document.getElementById('new-person-name-input')?.focus(), 100);
}

function submitAddPersonModal() {
  const inputEl = document.getElementById('new-person-name-input');
  const phoneEl = document.getElementById('new-person-phone-input');
  if (!inputEl) return;
  const name = inputEl.value.trim();
  const phone = phoneEl ? phoneEl.value.trim() : '';
  if (!name) {
    toast('Please enter a contact name', 'error');
    return;
  }
  closeLedgerModal();
  addLedgerPerson(name, phone);
}

async function addLedgerPerson(name, phone = '') {
  const newPerson = {
    _id: 'local_' + Date.now(),
    name: name,
    phone: phone,
    createdAt: Date.now(),
    transactions: []
  };

  ledgerPeople.unshift(newPerson);
  saveLocalLedgerCache();
  renderLedger();

  if (currentUser) {
    try {
      const docRef = await db.collection('users').doc(currentUser.uid).collection('ledger').add({
        name, phone, createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      newPerson._id = docRef.id;
      saveLocalLedgerCache();
    } catch (e) {
      console.warn('Firestore write warning:', e.message);
    }
  }

  toast(TT('ledger_added') + ' ' + name, 'success');
}

// In-App Modal for Adding a Transaction (Gave ₹ / Received ₹)
function showAddTxModal(personId, type) {
  const person = ledgerPeople.find(p => p._id === personId);
  if (!person) return;
  
  const isHi = (typeof currentLang !== 'undefined' && currentLang === 'hi');
  const isGave = type === 'gave';
  const badgeColor = isGave ? 'var(--green,#4ade80)' : 'var(--red,#f87171)';
  const btnClass = isGave ? 'primary' : 'danger';
  
  const html = `
    <div style="text-align:center; margin-bottom:16px;">
      <h3 style="margin:0 0 4px; font-family:'Space Grotesk',sans-serif; font-size:20px; font-weight:800;">${escapeHTML(person.name)}</h3>
      <span style="display:inline-block; padding:3px 12px; border-radius:12px; font-size:12px; font-weight:700; background:rgba(255,255,255,0.08); color:${badgeColor}; border:1px solid ${badgeColor}44;">
        ${isGave ? '↗ Gave ₹' : '↘ Received ₹'}
      </span>
    </div>
    
    <div style="margin-bottom:12px;">
      <label style="font-size:12px; font-weight:600; color:var(--text-dim); display:block; margin-bottom:4px;">${isHi ? 'राशि (₹)' : 'Amount (₹)'}</label>
      <input type="number" id="ledger-tx-amt-input" placeholder="0" min="1" step="1" style="width:100%; padding:12px 14px; border-radius:14px; border:1px solid var(--border); background:rgba(0,0,0,0.3); color:#fff; font-size:18px; font-weight:800; box-sizing:border-box;" autofocus onkeydown="if(event.key==='Enter')document.getElementById('ledger-tx-note-input')?.focus()"/>
    </div>

    <div style="margin-bottom:18px;">
      <label style="font-size:12px; font-weight:600; color:var(--text-dim); display:block; margin-bottom:4px;">${isHi ? 'विवरण (ऐच्छिक)' : 'Note / Reason (optional)'}</label>
      <input type="text" id="ledger-tx-note-input" placeholder="${isHi ? 'जैसे लंच, किराया, पेट्रोल' : 'e.g. Lunch share, Rent, Petrol'}" style="width:100%; padding:12px 14px; border-radius:14px; border:1px solid var(--border); background:rgba(0,0,0,0.3); color:#fff; font-size:14px; box-sizing:border-box;" onkeydown="if(event.key==='Enter')submitAddTxModal('${personId}', '${type}')"/>
    </div>

    <div class="btn-row" style="gap:10px;">
      <button class="btn" style="flex:1" onclick="showPersonDetail('${personId}')">${isHi ? 'रद्द करें' : 'Cancel'}</button>
      <button class="btn ${btnClass}" style="flex:1; padding:12px; font-weight:700;" onclick="submitAddTxModal('${personId}', '${type}')">${isHi ? 'सहेजें' : 'Save Entry'}</button>
    </div>
  `;
  openLedgerModal(html);
  setTimeout(() => document.getElementById('ledger-tx-amt-input')?.focus(), 100);
}

function submitAddTxModal(personId, type) {
  const amtEl = document.getElementById('ledger-tx-amt-input');
  const noteEl = document.getElementById('ledger-tx-note-input');
  if (!amtEl) return;

  const amount = parseFloat(amtEl.value);
  if (isNaN(amount) || amount <= 0) {
    toast('Please enter a valid amount', 'error');
    return;
  }

  const note = noteEl ? noteEl.value.trim() : '';
  closeLedgerModal();
  saveLedgerTx(personId, type, amount, note);
}

async function saveLedgerTx(personId, type, amount, note) {
  const person = ledgerPeople.find(p => p._id === personId);
  if (!person) return;

  const dateStr = (typeof todayStr === 'function' ? todayStr() : new Date().toISOString().split('T')[0]);
  const newTx = {
    _id: 'local_tx_' + Date.now(),
    type: type,
    amount: amount,
    note: note,
    date: dateStr,
    createdAt: Date.now()
  };

  if (!person.transactions) person.transactions = [];
  person.transactions.unshift(newTx);
  saveLocalLedgerCache();
  renderLedger();
  showPersonDetail(personId);

  if (currentUser && !personId.startsWith('local_')) {
    try {
      await db.collection('users').doc(currentUser.uid).collection('ledger').doc(personId).collection('transactions').add({
        amount: amount,
        type: type,
        note: note,
        date: dateStr,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch(e) {
      console.warn('Firestore tx write warning:', e.message);
    }
  }

  const isHi = (typeof currentLang !== 'undefined' && currentLang === 'hi');
  toast(isHi
    ? (type === 'gave' ? `₹${amount} दिए — दर्ज किया गया` : `₹${amount} मिले — दर्ज किया गया`)
    : 'Recorded ' + (type === 'gave' ? 'Gave' : 'Received') + ' ₹' + amount, 'success');
}

// 1-Tap Settle Debt Function
window.settlePersonDebt = function(personId, currentBalance) {
  if (currentBalance === 0) return;
  const isHi = (typeof currentLang !== 'undefined' && currentLang === 'hi');
  const type = currentBalance > 0 ? 'received' : 'gave';
  const amount = Math.abs(currentBalance);
  
  if (typeof showAppConfirm === 'function') {
    showAppConfirm(isHi ? `क्या आप ₹${amount} का हिसाब पूरा चुकता (Settle) करना चाहते हैं?` : `Mark ₹${amount} debt as completely settled?`, () => {
      saveLedgerTx(personId, type, amount, 'Full Debt Settlement 🤝');
      toast(isHi ? 'हिसाब चुकता हो गया 🤝' : 'Debt settled successfully 🤝', 'success');
    });
  } else {
    saveLedgerTx(personId, type, amount, 'Full Debt Settlement 🤝');
    toast('Debt settled successfully 🤝', 'success');
  }
};

// Sleek In-App Person Detail Card Modal
function showPersonDetail(personId) {
  const person = ledgerPeople.find(p => p._id === personId);
  if (!person) return;
  
  const isHi = (typeof currentLang !== 'undefined' && currentLang === 'hi');
  let personBalance = 0;
  (person.transactions || []).forEach(tx => {
    if (tx.type === 'gave') personBalance += tx.amount;
    else if (tx.type === 'received') personBalance -= tx.amount;
  });

  const avatarLetter = (person.name || 'P').charAt(0).toUpperCase();
  let balStatusText = '';
  let balBadgeStyle = '';

  if (personBalance > 0) {
    balStatusText = isHi ? `आपको ₹${personBalance} मिलेगा` : `Owes you ₹${personBalance}`;
    balBadgeStyle = 'background:rgba(74,222,128,0.15); color:var(--green,#4ade80); border:1px solid rgba(74,222,128,0.3);';
  } else if (personBalance < 0) {
    balStatusText = isHi ? `आपको ₹${Math.abs(personBalance)} देना है` : `You owe ₹${Math.abs(personBalance)}`;
    balBadgeStyle = 'background:rgba(248,113,113,0.15); color:var(--red,#f87171); border:1px solid rgba(248,113,113,0.3);';
  } else {
    balStatusText = isHi ? 'सब चुकता (₹0)' : 'Settled up (₹0)';
    balBadgeStyle = 'background:rgba(255,255,255,0.08); color:var(--text-dim,#9ca3af); border:1px solid var(--border);';
  }

  let txHtml = (person.transactions && person.transactions.length) ? person.transactions.map(tx => `
    <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.25); padding:12px 14px; border-radius:14px; margin-bottom:8px; border:1px solid var(--border)">
      <div>
        <div style="font-weight:700; font-size:14px; color:${tx.type === 'gave' ? 'var(--green,#4ade80)' : 'var(--red,#f87171)'}">
          ${tx.type === 'gave' ? (isHi ? '↗ दिए' : '↗ Gave') : (isHi ? '↘ मिले' : '↘ Received')} ₹${tx.amount}
        </div>
        <div style="font-size:11.5px; color:var(--text-dim); margin-top:2px;">${tx.date || ''} ${tx.note ? '• ' + escapeHTML(tx.note) : ''}</div>
      </div>
      <button class="icon-btn" onclick="deleteLedgerTx('${personId}', '${tx._id}')" title="${TT('ledger_delete_entry')}" style="color:var(--red,#f87171); padding:4px;"><i class="ti ti-trash"></i></button>
    </div>
  `).join('') : `<p style="text-align:center; color:var(--text-dim); padding:24px 0; font-size:13px;">${TT('ledger_no_tx')} ${escapeHTML(person.name)}</p>`;

  const deleteBtnText = isHi ? '🗑️ संपर्क हटाएं' : '🗑️ Delete Contact';

  let sharedSpacesHtml = '';
  if (typeof sharedPortfolios !== 'undefined' && Array.isArray(sharedPortfolios)) {
    const matchedSpaces = sharedPortfolios.filter(sp => (sp.members || []).some(m => m.toLowerCase() === person.name.toLowerCase()));
    if (matchedSpaces.length) {
      sharedSpacesHtml = `
        <div style="margin-bottom:12px;background:rgba(139,92,246,0.12);border:1px solid rgba(139,92,246,0.35);border-radius:14px;padding:8px 12px;text-align:left;">
          <div style="font-size:11px;font-weight:700;color:var(--accent-bright,#c4b5fd);margin-bottom:5px;">👥 Connected Shared Spaces:</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;">
            ${matchedSpaces.map(sp => `
              <button onclick="closeLedgerModal();setTab('log');switchActivePortfolio('${sp.id}');" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.18);color:#fff;border-radius:99px;padding:4px 10px;font-size:11.5px;cursor:pointer;display:inline-flex;align-items:center;gap:4px;">
                ${sp.icon || '👥'} ${escapeHTML(sp.name)} →
              </button>
            `).join('')}
          </div>
        </div>
      `;
    }
  }

  const html = `
    <div style="text-align:center; margin-bottom:16px;">
      <div style="width:50px; height:50px; border-radius:50%; background:linear-gradient(135deg, var(--accent,#8b5cf6), var(--accent2,#ec4899)); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:22px; color:#fff; margin:0 auto 8px; box-shadow:0 4px 16px rgba(139,92,246,0.4);">
        ${avatarLetter}
      </div>
      <h3 style="margin:0 0 4px; font-family:'Space Grotesk',sans-serif; font-size:20px; font-weight:800;">${escapeHTML(person.name)}</h3>
      ${person.phone ? `<p style="margin:0 0 8px; font-size:12px; color:var(--text-dim);">📞 ${escapeHTML(person.phone)}</p>` : ''}
      <span style="display:inline-block; padding:4px 14px; border-radius:14px; font-size:12.5px; font-weight:700; ${balBadgeStyle}">
        ${balStatusText}
      </span>
    </div>

    ${sharedSpacesHtml}

    <div class="btn-row" style="margin-bottom:10px; gap:8px;">
      <button class="btn primary" style="flex:1; padding:12px; font-weight:700;" onclick="showAddTxModal('${personId}', 'gave')"><i class="ti ti-arrow-up-right"></i> ${TT('ledger_give')}</button>
      <button class="btn danger" style="flex:1; padding:12px; font-weight:700;" onclick="showAddTxModal('${personId}', 'received')"><i class="ti ti-arrow-down-left"></i> ${TT('ledger_receive')}</button>
    </div>

    ${personBalance !== 0 ? `
    <div style="display:flex; gap:8px; margin-bottom:14px;">
      ${personBalance > 0 ? `
      <button class="btn" style="flex:1.2; padding:11px; background:#25D366; color:#fff; border:none; font-weight:700; border-radius:12px; display:flex; align-items:center; justify-content:center; gap:6px; cursor:pointer;" onclick="sendPersonWhatsAppReminder('${personId}', ${personBalance})">
        💬 WhatsApp Reminder
      </button>` : ''}
      <button class="btn" style="flex:1; padding:11px; background:rgba(52,211,153,0.18); color:var(--green,#34d399); border:1px solid rgba(52,211,153,0.4); font-weight:700; border-radius:12px; cursor:pointer;" onclick="settlePersonDebt('${personId}', ${personBalance})">
        🤝 Settle Up
      </button>
    </div>` : ''}

    <div style="font-size:11.5px; font-weight:700; color:var(--text-dim); margin-bottom:6px; text-transform:uppercase; letter-spacing:0.5px;">${TT('ledger_history')}</div>
    
    <div style="max-height:200px; overflow-y:auto; margin-bottom:16px; padding-right:2px;">
      ${txHtml}
    </div>

    <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border); padding-top:12px;">
      <button class="btn" style="background:rgba(248,113,113,0.12); color:var(--red,#f87171); border-color:rgba(248,113,113,0.3); font-size:12px;" onclick="deleteLedgerPerson('${personId}')">${deleteBtnText}</button>
      <button class="btn" onclick="closeLedgerModal()">${isHi ? 'बंद करें' : 'Close'}</button>
    </div>
  `;
  openLedgerModal(html);
}

async function deleteLedgerPerson(personId) {
  const isHi = (typeof currentLang !== 'undefined' && currentLang === 'hi');
  const msg = isHi ? 'संपर्क और सभी लेनदेन इतिहास हटाएं?' : 'Delete contact and all transaction history?';
  
  if (typeof showAppConfirm === 'function') {
    showAppConfirm(msg, async () => {
      ledgerPeople = ledgerPeople.filter(p => p._id !== personId);
      saveLocalLedgerCache();
      closeLedgerModal();
      renderLedger();

      if (currentUser && !personId.startsWith('local_')) {
        try {
          const txSnap = await db.collection('users').doc(currentUser.uid).collection('ledger').doc(personId).collection('transactions').get();
          let batch = db.batch(), ops = 0;
          for (const t of txSnap.docs) {
            batch.delete(t.ref); ops++;
            if (ops >= 400) { await batch.commit(); batch = db.batch(); ops = 0; }
          }
          if (ops > 0) await batch.commit();
          await db.collection('users').doc(currentUser.uid).collection('ledger').doc(personId).delete();
        } catch(e) {
          console.warn('Firestore person delete warning:', e.message);
        }
      }
      toast(isHi ? 'संपर्क हटाया गया' : 'Contact deleted', 'success');
    });
  }
}

async function deleteLedgerTx(personId, txId) {
  const person = ledgerPeople.find(p => p._id === personId);
  if (!person) return;

  person.transactions = (person.transactions || []).filter(t => t._id !== txId);
  saveLocalLedgerCache();
  renderLedger();
  showPersonDetail(personId);

  if (currentUser && !txId.startsWith('local_')) {
    try {
      await db.collection('users').doc(currentUser.uid).collection('ledger').doc(personId).collection('transactions').doc(txId).delete();
    } catch(e) {
      console.warn('Firestore tx delete warning:', e.message);
    }
  }
  toast('Entry deleted', 'success');
}

// Attach listener on auth change
if (window.firebase && firebase.auth()) {
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      listenToLedger();
    } else {
      if (ledgerUnsubscribe) { ledgerUnsubscribe(); ledgerUnsubscribe = null; }
      ledgerPeople = [];
    }
  });
}

window.sendPersonWhatsAppReminder = function(personId, amount) {
  const list = getLedgerPeopleList();
  const person = list.find(p => p._id === personId);
  if (!person) return;
  const isHi = (typeof currentLang !== 'undefined' && currentLang === 'hi');
  const userUpi = (typeof getUserUpiId === 'function' ? getUserUpiId() : '') || 'pockettrack@upi';
  const upiPayLink = `upi://pay?pa=${encodeURIComponent(userUpi)}&pn=PocketTrack&am=${amount}&cu=INR`;
  
  const msg = isHi 
    ? `नमस्ते ${person.name}! 🙏 PocketTrack रिमाइंडर: आपका बकाया ₹${amount.toLocaleString('en-IN')} है।\n⚡ UPI से सीधे भुगतान करें: ${upiPayLink}\n\nधन्यवाद!`
    : `👋 Hey ${person.name}!\nQuick PocketTrack reminder: You have a pending balance of ₹${amount.toLocaleString('en-IN')}.\n⚡ Pay instantly via UPI: ${upiPayLink}\n\nThanks!`;
  
  const phoneTarget = person.phone ? person.phone.replace(/[^0-9]/g, '') : '';
  const waUrl = phoneTarget ? `https://wa.me/91${phoneTarget}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
  window.open(waUrl, '_blank');
};
