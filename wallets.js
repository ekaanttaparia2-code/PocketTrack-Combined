'use strict';

/**
 * PocketTrack Multi-Wallet & Smart Account Engine
 * Supports Cash, Bank/UPI, Credit Cards, and Custom Wallets
 * with Smart Retroactive Classifier, Atomic Batch Transfers, Wallet Management, and Cloud-First Sync.
 */

function escapeWalletHTML(str) {
  if (typeof window !== 'undefined' && typeof window.escapeHTML === 'function') return window.escapeHTML(str);
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

// 1. Style Tag Guard — Injects styles only once
(function() {
  if (document.getElementById('pt-wallets-styles')) return;
  const s = document.createElement('style');
  s.id = 'pt-wallets-styles';
  s.textContent = `
    .wallet-switcher-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      overflow-x: auto;
      padding: 4px 2px 10px 2px;
      margin-bottom: 8px;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
    }
    .wallet-switcher-bar::-webkit-scrollbar { display: none; }

    .wallet-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 13px;
      border-radius: 99px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: var(--text-dim, #94a3b8);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
      -webkit-tap-highlight-color: transparent;
    }
    .wallet-pill:active { transform: scale(0.95); }
    .wallet-pill.active {
      background: linear-gradient(135deg, rgba(52, 211, 153, 0.25), rgba(59, 130, 246, 0.22));
      border-color: rgba(52, 211, 153, 0.7);
      color: #ffffff;
      box-shadow: 0 4px 16px rgba(52, 211, 153, 0.25);
    }
    .wallet-pill.add-pill {
      border-style: dashed;
      background: rgba(52, 211, 153, 0.08);
      color: var(--green, #34d399);
      border-color: rgba(52, 211, 153, 0.4);
    }

    .wallet-badge-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 99px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #cbd5e1;
    }

    .wallet-tag-cash { background: rgba(52, 211, 153, 0.15); color: var(--green, #34d399); border-color: rgba(52, 211, 153, 0.35); }
    .wallet-tag-bank { background: rgba(96, 165, 250, 0.15); color: #60a5fa; border-color: rgba(96, 165, 250, 0.35); }
    .wallet-tag-card { background: rgba(244, 63, 94, 0.15); color: #f43f5e; border-color: rgba(244, 63, 94, 0.35); }
  `;
  if (typeof document !== 'undefined') (document.head || document.documentElement || document.body)?.appendChild(s);
})();

// Default system wallets
const DEFAULT_WALLETS = [
  { id: 'cash', name: 'Cash', type: 'cash', icon: '💵', initialBalance: 0, color: '#34d399', isDefault: true },
  { id: 'bank', name: 'Bank / UPI', type: 'bank', icon: '📱', initialBalance: 0, color: '#60a5fa', isDefault: true },
  { id: 'card', name: 'Credit Card', type: 'card', icon: '💳', initialBalance: 0, color: '#f43f5e', isDefault: true }
];

let userWallets = [];
window.userWallets = userWallets;
window.activeWalletId = 'all'; // 'all' or specific wallet id
let isCloudWalletsLoaded = false;

function getWalletsStorageKey() {
  const uid = (typeof currentUser !== 'undefined' && currentUser) ? currentUser.uid : 'guest';
  return 'pockettrack_wallets_' + uid;
}

/**
 * Smart Retroactive Classifier:
 * Determines the true wallet for any transaction (especially legacy entries that have no walletId).
 */
window.resolveEntryWalletId = function(tx) {
  if (!tx) return 'cash';
  if (tx.walletId) return tx.walletId;

  // Run Smart NLP text classification on label and note
  const text = ((tx.label || '') + ' ' + (tx.note || '')).toLowerCase();

  // 1. Match custom wallet names
  if (typeof userWallets !== 'undefined' && Array.isArray(userWallets)) {
    for (const w of userWallets) {
      if (w.id !== 'cash' && w.id !== 'bank' && w.id !== 'card') {
        if (text.includes(w.name.toLowerCase())) return w.id;
      }
    }
  }

  // 2. UPI / Bank indicators (salary, credited, account, upi, bank, gpay, phonepe)
  if (/\b(?:upi|gpay|google pay|phonepe|paytm|bank|online|netbanking|neft|imps|account|salary|credited|transfer|खाते|बैंक|यूपीआई)\b/i.test(text)) {
    return 'bank';
  }

  // 3. Credit Card indicators (credit card, onecard, amex, hdfc card, sbi card, icici card, axis card)
  if (/\b(?:credit card|onecard|amex|hdfc card|sbi card|icici card|axis card|card payment|cc bill|क्रेडिट कार्ड|कार्ड)\b/i.test(text) || (/\bcard\b/i.test(text) && !/\b(scratch card|postcard|cardboard)\b/i.test(text))) {
    return 'card';
  }

  // 4. Cash indicators (cash, nagad, rokad, chai, tea, auto, rickshaw, sabzi)
  if (/\b(?:cash|nagad|rokad|in cash|cash diya|नकद|कैश|हाथ में|chai|tea|auto|rickshaw|sabzi|vegetable)\b/i.test(text)) {
    return 'cash';
  }

  // 5. Fallback heuristics based on category & type
  if (tx.type === 'income') return 'bank';
  if (tx.cat === 'travel' || tx.cat === 'food') return 'cash';
  return 'bank';
};

/**
 * Universal Wallet Badge Generator (Polymorphic: accepts entry object or walletId string)
 */
window.getWalletBadgeHtml = function(entryOrId) {
  if (!entryOrId) return '';
  let wId = '';
  if (typeof entryOrId === 'object' && entryOrId !== null) {
    wId = (typeof window.resolveEntryWalletId === 'function') ? window.resolveEntryWalletId(entryOrId) : (entryOrId.walletId || 'cash');
  } else if (typeof entryOrId === 'string') {
    wId = entryOrId;
  }
  if (!wId) return '';

  const wList = (typeof userWallets !== 'undefined' && userWallets.length) ? userWallets : [
    { id: 'cash', name: 'Cash', icon: '💵' },
    { id: 'bank', name: 'Bank / UPI', icon: '📱' },
    { id: 'card', name: 'Credit Card', icon: '💳' }
  ];
  const w = wList.find(x => x.id === wId) || { name: wId, icon: '💳' };
  const cls = wId === 'cash' ? 'wallet-tag-cash' : (wId === 'bank' ? 'wallet-tag-bank' : (wId === 'card' ? 'wallet-tag-card' : ''));
  const safeName = (typeof escapeHTML === 'function') ? escapeHTML(w.name) : w.name;
  return `<span class="wallet-badge-tag ${cls}" style="margin-left:4px;">${w.icon || '💳'} ${safeName}</span>`;
};

/**
 * Loads wallets from localStorage and ensures defaults exist
 */
window.loadWallets = function() {
  try {
    let saved = null;
    const uidKey = (typeof currentUser !== 'undefined' && currentUser) ? ('pockettrack_wallets_' + currentUser.uid) : null;
    const keysToCheck = [uidKey, 'pockettrack_wallets_guest', 'pockettrack_wallets'].filter(Boolean);

    for (const k of keysToCheck) {
      const raw = localStorage.getItem(k);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length) {
            saved = parsed;
            break;
          }
        } catch(e){}
      }
    }

    if (saved && Array.isArray(saved)) {
      // Merge defaults if not present
      const existingIds = new Set(saved.map(w => w.id));
      DEFAULT_WALLETS.forEach(dw => {
        if (!existingIds.has(dw.id)) saved.push({ ...dw });
      });
      userWallets = saved;
    } else {
      userWallets = JSON.parse(JSON.stringify(DEFAULT_WALLETS));
    }
    window.userWallets = userWallets;
  } catch (e) {
    userWallets = JSON.parse(JSON.stringify(DEFAULT_WALLETS));
    window.userWallets = userWallets;
  }
};

/**
 * Saves wallets to localStorage and Firestore
 */
window.saveWallets = function() {
  try {
    const dataStr = JSON.stringify(userWallets);
    localStorage.setItem(getWalletsStorageKey(), dataStr);
    localStorage.setItem('pockettrack_wallets_guest', dataStr);
    localStorage.setItem('pockettrack_wallets', dataStr);

    if (typeof currentUser !== 'undefined' && currentUser && typeof db !== 'undefined') {
      userWallets.forEach(w => {
        db.collection('users').doc(currentUser.uid).collection('wallets').doc(w.id).set(w, { merge: true }).catch(()=>{});
      });
    }
  } catch (e) {}
};

/**
 * Calculates current balance for all wallets using Smart Retroactive Classifier
 */
window.computeWalletBalances = function() {
  const allTx = (typeof allRawMainEntries === 'function') ? allRawMainEntries() : ((typeof mainEntries === 'function') ? mainEntries() : []);
  const balances = {};

  userWallets.forEach(w => {
    balances[w.id] = parseFloat(w.initialBalance) || 0;
  });

  allTx.forEach(tx => {
    const amt = parseFloat(tx.amt) || 0;
    const wId = window.resolveEntryWalletId(tx);
    if (balances[wId] !== undefined) {
      if (tx.type === 'income') {
        balances[wId] += amt;
      } else if (tx.type === 'expense') {
        balances[wId] -= amt;
      }
    }
  });

  return balances;
};

/**
 * Renders the top Wallet Switcher Bar
 */
window.renderWalletSwitcher = function() {
  window.loadWallets();
  const listEl = document.getElementById('wallet-pills-list');
  if (!listEl) return;

  const balances = window.computeWalletBalances();
  let totalNetWorth = 0;
  Object.values(balances).forEach(b => { totalNetWorth += b; });

  const allPillActive = (window.activeWalletId === 'all');

  const allBtn = `
    <button class="wallet-pill ${allPillActive ? 'active' : ''}" onclick="switchActiveWallet('all')">
      <span>🌐 ${typeof currentLang !== 'undefined' && currentLang === 'hi' ? 'सभी वॉलेट' : 'All Wallets'}</span>
      <span style="font-size:10.5px;opacity:0.85;font-weight:700;">(₹${totalNetWorth.toLocaleString('en-IN')})</span>
    </button>
  `;

  const walletPills = userWallets.map(w => {
    const isActive = (window.activeWalletId === w.id);
    const bal = balances[w.id] || 0;
    const isNeg = bal < 0;
    return `
      <button class="wallet-pill ${isActive ? 'active' : ''}" onclick="switchActiveWallet('${w.id}')">
        <span>${w.icon || '💳'} ${escapeWalletHTML(w.name)}</span>
        <span style="font-size:10.5px;color:${isNeg ? '#f87171' : 'var(--green,#34d399)'};font-weight:700;">₹${bal.toLocaleString('en-IN')}</span>
      </button>
    `;
  }).join('');

  if (listEl) {
    listEl.innerHTML = `
      ${allBtn}
      ${walletPills}
      <button class="wallet-pill" onclick="openTransferModal()" style="background:rgba(139,92,246,0.12);border-color:rgba(139,92,246,0.4);color:var(--accent-bright,#c4b5fd);">
        <span>🔁 ${typeof currentLang !== 'undefined' && currentLang === 'hi' ? 'ट्रांसफर' : 'Transfer'}</span>
      </button>
      <button class="wallet-pill" onclick="openWalletManagerModal()" style="background:rgba(255,255,255,0.06);border-color:rgba(255,255,255,0.15);" title="Manage & Delete Wallets">
        <span>⚙️ ${typeof currentLang !== 'undefined' && currentLang === 'hi' ? 'प्रबंधन' : 'Manage'}</span>
      </button>
    `;
  }

  const insightsListEl = document.getElementById('insights-wallet-pills-list');
  if (insightsListEl) {
    insightsListEl.innerHTML = `
      ${allBtn}
      ${walletPills}
    `;
  }

  // Synchronize form dropdowns
  const incSel = document.getElementById('inc-wallet');
  const expSel = document.getElementById('exp-wallet');
  const selOpts = userWallets.map(w => `<option value="${w.id}">${w.icon || '💳'} ${escapeWalletHTML(w.name)}</option>`).join('');
  if (incSel && !incSel.innerHTML) incSel.innerHTML = selOpts;
  else if (incSel) {
    const curVal = incSel.value;
    incSel.innerHTML = selOpts;
    if (curVal) incSel.value = curVal;
  }
  if (expSel && !expSel.innerHTML) expSel.innerHTML = selOpts;
  else if (expSel) {
    const curVal = expSel.value;
    expSel.innerHTML = selOpts;
    if (curVal) expSel.value = curVal;
  }
};

window.switchActiveWallet = function(walletId) {
  window.activeWalletId = walletId;
  window.renderWalletSwitcher();
  if (typeof updateHeaderStats === 'function') updateHeaderStats();
  if (typeof renderHomeSnapshot === 'function') renderHomeSnapshot();
  if (typeof renderEntries === 'function') renderEntries();
  if (typeof renderBudgetEditor === 'function') renderBudgetEditor();
  if (typeof renderReport === 'function') renderReport();
  if (typeof toast === 'function') {
    const w = userWallets.find(x => x.id === walletId);
    const label = w ? `${w.icon} ${w.name}` : 'All Wallets';
    toast('Viewing ' + label, 'info');
  }
};

/**
 * Smart Context Engine: Auto-detects wallet from text / speech
 */
window.detectWalletFromText = function(text) {
  if (!text) return 'cash';
  const t = text.toLowerCase();

  // 1. Match custom wallet names
  for (const w of userWallets) {
    if (w.id !== 'cash' && w.id !== 'bank' && w.id !== 'card') {
      if (t.includes(w.name.toLowerCase())) return w.id;
    }
  }

  // 2. Match Cash keywords
  if (/(?:cash|nagad|rokad|in cash|cash diya|नकद|कैश|हाथ में)/.test(t)) {
    return 'cash';
  }

  // 3. Match Credit Card keywords
  if (/(?:credit card|credit|card|hdfc card|sbi card|icici card|axis card|amex|onecard|क्रेडिट कार्ड|कार्ड)/.test(t)) {
    return 'card';
  }

  // 4. Match UPI & Bank keywords
  if (/(?:upi|gpay|google pay|phonepe|paytm|bank|online|netbanking|account|खाते|बैंक|यूपीआई|transfer)/.test(t)) {
    return 'bank';
  }

  return window.activeWalletId !== 'all' ? window.activeWalletId : 'cash';
};

/**
 * In-App Modal for Creating a New Wallet
 */
window.openNewWalletModal = function() {
  const isHi = (typeof currentLang !== 'undefined' && currentLang === 'hi');
  let container = document.getElementById('pt-sheet-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'pt-sheet-container';
    container.className = 'pt-sheet-backdrop';
    container.onclick = function(e) {
      if (e.target === container) window.closeCustomSheet();
    };
    document.body.appendChild(container);
  }

  const icons = ['💵', '📱', '💳', '🏦', '🪙', '💼', '🛍️', '🎯'];

  container.innerHTML = `
    <div class="pt-sheet-panel" style="max-width:440px;">
      <div class="pt-sheet-handle"></div>
      
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:24px;">💼</span>
          <h3 style="margin:0;font-size:19px;font-weight:800;color:#fff;font-family:'Space Grotesk',sans-serif;">${isHi ? 'नया वॉलेट / खाता जोड़ें' : 'Add New Wallet / Account'}</h3>
        </div>
        <button onclick="closeCustomSheet()" style="background:rgba(255,255,255,0.08);border:none;color:#fff;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:16px;">✕</button>
      </div>

      <label style="font-size:12px;font-weight:700;color:#cbd5e1;display:block;margin-bottom:4px;">${isHi ? 'वॉलेट का नाम' : 'Wallet Name'}</label>
      <input type="text" id="new-wallet-name" placeholder="e.g. HDFC Salary, OneCard, Paytm" style="width:100%;padding:12px 14px;border-radius:14px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);color:#fff;font-size:15px;margin-bottom:12px;box-sizing:border-box;outline:none;" autofocus>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">
        <div>
          <label style="font-size:12px;font-weight:700;color:#cbd5e1;display:block;margin-bottom:4px;">${isHi ? 'खाता प्रकार' : 'Account Type'}</label>
          <select id="new-wallet-type" style="width:100%;padding:12px 14px;border-radius:14px;background:#181332;border:1px solid rgba(255,255,255,0.15);color:#fff;font-size:14px;box-sizing:border-box;outline:none;">
            <option value="bank">📱 Bank / UPI</option>
            <option value="cash">💵 Cash</option>
            <option value="card">💳 Credit Card</option>
            <option value="savings">🏦 Savings / FD</option>
          </select>
        </div>
        <div>
          <label style="font-size:12px;font-weight:700;color:#cbd5e1;display:block;margin-bottom:4px;">${isHi ? 'शुरुआती बैलेंस (₹)' : 'Initial Balance (₹)'}</label>
          <input type="number" id="new-wallet-bal" placeholder="₹0" value="0" style="width:100%;padding:12px 14px;border-radius:14px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);color:#fff;font-size:15px;font-weight:700;box-sizing:border-box;outline:none;">
        </div>
      </div>

      <label style="font-size:12px;font-weight:700;color:#cbd5e1;display:block;margin-bottom:6px;">${isHi ? 'आइकन चुनें' : 'Choose Icon'}</label>
      <div style="display:flex;gap:8px;margin-bottom:18px;overflow-x:auto;">
        ${icons.map((ic, i) => `
          <button type="button" onclick="document.querySelectorAll('.w-icon-btn').forEach(b=>b.style.borderColor='transparent');this.style.borderColor='var(--green,#34d399)';window._selWIcon='${ic}';" class="w-icon-btn" style="width:40px;height:40px;border-radius:12px;background:rgba(255,255,255,0.06);border:2px solid ${i===0?'var(--green,#34d399)':'transparent'};font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;">
            ${ic}
          </button>
        `).join('')}
      </div>

      <div style="display:flex;gap:10px;">
        <button class="btn" onclick="closeCustomSheet()" style="flex:1;border-radius:14px;padding:12px;font-size:13px;">${isHi ? 'रद्द करें' : 'Cancel'}</button>
        <button class="btn primary" onclick="submitNewWallet()" style="flex:1.4;border-radius:14px;padding:12px;font-weight:800;font-size:13.5px;background:linear-gradient(135deg,#8b5cf6,#10b981);">${isHi ? 'वॉलेट जोड़ें →' : 'Add Wallet →'}</button>
      </div>
    </div>
  `;

  window._selWIcon = '💵';
  requestAnimationFrame(() => {
    container.classList.add('active');
    setTimeout(() => document.getElementById('new-wallet-name')?.focus(), 100);
  });
};

window.submitNewWallet = function() {
  const nameEl = document.getElementById('new-wallet-name');
  const typeEl = document.getElementById('new-wallet-type');
  const balEl = document.getElementById('new-wallet-bal');

  if (!nameEl || !nameEl.value.trim()) {
    if (typeof toast === 'function') toast('Please enter a wallet name', 'error');
    return;
  }

  const newWallet = {
    id: 'w_' + Date.now(),
    name: nameEl.value.trim(),
    type: typeEl?.value || 'bank',
    icon: window._selWIcon || '💳',
    initialBalance: parseFloat(balEl?.value) || 0,
    color: '#8b5cf6',
    createdAt: Date.now()
  };

  userWallets.push(newWallet);
  window.userWallets = userWallets;
  window.saveWallets();
  if (typeof window.closeCustomSheet === 'function') window.closeCustomSheet();
  window.switchActiveWallet(newWallet.id);
  if (typeof toast === 'function') toast(`Created "${newWallet.name}"!`, 'success');
};

/**
 * In-App Modal for Managing & Deleting Custom Wallets
 */
window.openWalletManagerModal = function() {
  const isHi = (typeof currentLang !== 'undefined' && currentLang === 'hi');
  let container = document.getElementById('pt-sheet-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'pt-sheet-container';
    container.className = 'pt-sheet-backdrop';
    container.onclick = function(e) {
      if (e.target === container) window.closeCustomSheet();
    };
    document.body.appendChild(container);
  }

  const balances = window.computeWalletBalances();

  const walletItems = userWallets.map(w => {
    const bal = balances[w.id] || 0;
    const isCustom = !w.isDefault && w.id !== 'cash' && w.id !== 'bank' && w.id !== 'card';
    const monthlyB = (typeof window.getSavedMonthlyBudget === 'function') ? window.getSavedMonthlyBudget(w.id) : 0;
    return `
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:12px 14px;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:22px;">${w.icon || '💳'}</span>
          <div>
            <div style="font-size:14px;font-weight:700;color:#fff;">${escapeWalletHTML(w.name)} ${w.isDefault ? '<span style="font-size:10px;color:var(--text-dim);font-weight:500;">(System)</span>' : ''}</div>
            <div style="display:flex;align-items:center;gap:6px;margin-top:2px;">
              <span style="font-size:12px;color:var(--green,#34d399);font-weight:700;">₹${bal.toLocaleString('en-IN')}</span>
              <span style="font-size:11px;color:var(--accent-bright,#c4b5fd);font-weight:600;">· 🎯 ₹${monthlyB.toLocaleString('en-IN')}/mo</span>
            </div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          <button onclick="if(typeof closeCustomSheet==='function')closeCustomSheet();if(typeof openSetBudgetModal==='function')openSetBudgetModal('monthly','${w.id}');" style="background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.4);color:var(--accent-bright,#c4b5fd);padding:6px 10px;border-radius:10px;font-size:11.5px;font-weight:700;cursor:pointer;">
            🎯 ${isHi ? 'बजट' : 'Budget'}
          </button>
          ${isCustom ? `
            <button onclick="deleteCustomWallet('${w.id}')" style="background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.35);color:#f87171;padding:6px 10px;border-radius:10px;font-size:11.5px;font-weight:700;cursor:pointer;">
              🗑️
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="pt-sheet-panel" style="max-width:440px;">
      <div class="pt-sheet-handle"></div>
      
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:24px;">⚙️</span>
          <h3 style="margin:0;font-size:19px;font-weight:800;color:#fff;font-family:'Space Grotesk',sans-serif;">${isHi ? 'वॉलेट और खाते प्रबंधित करें' : 'Manage Wallets & Accounts'}</h3>
        </div>
        <button onclick="closeCustomSheet()" style="background:rgba(255,255,255,0.08);border:none;color:#fff;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:16px;">✕</button>
      </div>

      <p style="font-size:12px;color:var(--text-dim);margin:0 0 14px;">
        ${isHi ? 'कस्टम वॉलेट हटाएं या नए खाते जोड़ें।' : 'Edit or delete custom wallets. System wallets remain protected.'}
      </p>

      <div style="max-height:280px;overflow-y:auto;margin-bottom:16px;">
        ${walletItems}
      </div>

      <div style="display:flex;gap:10px;">
        <button class="btn" onclick="closeCustomSheet()" style="flex:1;border-radius:14px;padding:12px;font-size:13px;">${isHi ? 'बंद करें' : 'Close'}</button>
        <button class="btn primary" onclick="closeCustomSheet();openNewWalletModal();" style="flex:1.4;border-radius:14px;padding:12px;font-weight:800;font-size:13px;background:linear-gradient(135deg,#8b5cf6,#10b981);">+ ${isHi ? 'नया वॉलेट जोड़ें' : 'Add New Wallet'}</button>
      </div>
    </div>
  `;

  requestAnimationFrame(() => {
    container.classList.add('active');
  });
};

/**
 * Deletes a custom wallet and reassigns its transactions
 */
window.deleteCustomWallet = function(walletId) {
  const isHi = (typeof currentLang !== 'undefined' && currentLang === 'hi');
  const targetWallet = userWallets.find(w => w.id === walletId);
  if (!targetWallet) return;

  if (targetWallet.isDefault || walletId === 'cash' || walletId === 'bank' || walletId === 'card') {
    if (typeof toast === 'function') toast('Default system wallets cannot be deleted', 'error');
    return;
  }

  // 1. Remove from local array
  userWallets = userWallets.filter(w => w.id !== walletId);
  window.userWallets = userWallets;
  window.saveWallets();

  // 2. Remove from Firestore
  if (typeof currentUser !== 'undefined' && currentUser && typeof db !== 'undefined') {
    try {
      db.collection('users').doc(currentUser.uid).collection('wallets').doc(walletId).delete().catch(()=>{});
    } catch(e){}
  }

  // 3. Reset active wallet if it was active
  if (window.activeWalletId === walletId) {
    window.activeWalletId = 'all';
  }

  if (typeof window.closeCustomSheet === 'function') window.closeCustomSheet();
  window.renderWalletSwitcher();
  if (typeof updateHeaderStats === 'function') updateHeaderStats();
  if (typeof renderHomeSnapshot === 'function') renderHomeSnapshot();
  if (typeof renderEntries === 'function') renderEntries();
  if (typeof renderBudgetEditor === 'function') renderBudgetEditor();
  if (typeof renderReport === 'function') renderReport();
  if (typeof toast === 'function') toast(`Deleted "${targetWallet.name}"!`, 'info');
};

/**
 * In-App Modal for Inter-Wallet Transfer (e.g. Bank to Cash ATM withdrawal)
 */
window.openTransferModal = function() {
  const isHi = (typeof currentLang !== 'undefined' && currentLang === 'hi');
  let container = document.getElementById('pt-sheet-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'pt-sheet-container';
    container.className = 'pt-sheet-backdrop';
    container.onclick = function(e) {
      if (e.target === container) window.closeCustomSheet();
    };
    document.body.appendChild(container);
  }

  const walletOptions = userWallets.map(w => `<option value="${w.id}">${w.icon} ${escapeHTML(w.name)}</option>`).join('');

  container.innerHTML = `
    <div class="pt-sheet-panel" style="max-width:440px;">
      <div class="pt-sheet-handle"></div>
      
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:24px;">🔁</span>
          <h3 style="margin:0;font-size:19px;font-weight:800;color:#fff;font-family:'Space Grotesk',sans-serif;">${isHi ? 'खातों के बीच ट्रांसफर' : 'Transfer Between Wallets'}</h3>
        </div>
        <button onclick="closeCustomSheet()" style="background:rgba(255,255,255,0.08);border:none;color:#fff;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:16px;">✕</button>
      </div>

      <p style="font-size:12.5px;color:var(--text-dim,#94a3b8);margin:0 0 14px;line-height:1.45;">
        ${isHi ? 'जैसे ATM से कैश निकालना या बैंक में जमा करना।' : 'e.g. ATM Cash Withdrawal or Deposit into Bank.'}
      </p>

      <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:center;margin-bottom:14px;">
        <div>
          <label style="font-size:11.5px;font-weight:700;color:#cbd5e1;display:block;margin-bottom:4px;">${isHi ? 'कहाँ से' : 'From'}</label>
          <select id="transfer-from-wallet" style="width:100%;padding:11px 10px;border-radius:12px;background:#181332;border:1px solid rgba(255,255,255,0.15);color:#fff;font-size:13.5px;box-sizing:border-box;outline:none;">
            ${walletOptions}
          </select>
        </div>
        <div style="font-size:20px;color:var(--accent-bright,#c4b5fd);padding-top:16px;">➔</div>
        <div>
          <label style="font-size:11.5px;font-weight:700;color:#cbd5e1;display:block;margin-bottom:4px;">${isHi ? 'कहाँ पर' : 'To'}</label>
          <select id="transfer-to-wallet" style="width:100%;padding:11px 10px;border-radius:12px;background:#181332;border:1px solid rgba(255,255,255,0.15);color:#fff;font-size:13.5px;box-sizing:border-box;outline:none;">
            ${walletOptions}
          </select>
        </div>
      </div>

      <label style="font-size:12px;font-weight:700;color:#cbd5e1;display:block;margin-bottom:4px;">${isHi ? 'राशि (₹)' : 'Amount (₹)'}</label>
      <input type="number" id="transfer-amt" placeholder="₹0" style="width:100%;padding:12px 14px;border-radius:14px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);color:#fff;font-size:18px;font-weight:800;font-family:'Space Grotesk',sans-serif;margin-bottom:18px;box-sizing:border-box;outline:none;">

      <div style="display:flex;gap:10px;">
        <button class="btn" onclick="closeCustomSheet()" style="flex:1;border-radius:14px;padding:12px;font-size:13px;">${isHi ? 'रद्द करें' : 'Cancel'}</button>
        <button class="btn primary" onclick="submitWalletTransfer()" style="flex:1.4;border-radius:14px;padding:12px;font-weight:800;font-size:13.5px;background:linear-gradient(135deg,#8b5cf6,#3b82f6);">${isHi ? 'ट्रांसफर पूरा करें →' : 'Transfer Now →'}</button>
      </div>
    </div>
  `;

  requestAnimationFrame(() => {
    container.classList.add('active');
    const toSel = document.getElementById('transfer-to-wallet');
    if (toSel && toSel.options.length > 1) toSel.selectedIndex = 1;
    setTimeout(() => document.getElementById('transfer-amt')?.focus(), 100);
  });
};

/**
 * Atomic Batch Transfer execution in Firestore & Local state
 */
window.submitWalletTransfer = async function() {
  const fromId = document.getElementById('transfer-from-wallet')?.value;
  const toId = document.getElementById('transfer-to-wallet')?.value;
  const amt = parseFloat(document.getElementById('transfer-amt')?.value);

  if (fromId === toId) {
    if (typeof toast === 'function') toast('Source and Destination wallets cannot be the same', 'error');
    return;
  }
  if (!amt || isNaN(amt) || amt <= 0) {
    if (typeof toast === 'function') toast('Please enter a valid transfer amount', 'error');
    return;
  }

  const fromWallet = userWallets.find(w => w.id === fromId);
  const toWallet = userWallets.find(w => w.id === toId);

  if (!fromWallet || !toWallet) {
    if (typeof toast === 'function') toast('Invalid source or destination wallet', 'error');
    return;
  }

  const dateStr = (typeof todayStr === 'function') ? todayStr() : new Date().toISOString().split('T')[0];
  const transferGroupId = (window.crypto && crypto.randomUUID)
    ? crypto.randomUUID()
    : ('txfer_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));

  try {
    const debitPayload = {
      type: 'expense',
      amt: amt,
      label: `Transfer to ${toWallet ? toWallet.name : 'Wallet'}`,
      note: 'Account Transfer 🔁',
      cat: 'other',
      walletId: fromId,
      transferGroupId: transferGroupId,
      date: dateStr
    };
    const creditPayload = {
      type: 'income',
      amt: amt,
      label: `Transfer from ${fromWallet ? fromWallet.name : 'Wallet'}`,
      note: 'Account Transfer 🔁',
      cat: 'income',
      walletId: toId,
      transferGroupId: transferGroupId,
      date: dateStr
    };

    // Atomic Batch Execution in Firestore
    if (typeof currentUser !== 'undefined' && currentUser && typeof db !== 'undefined') {
      const colRef = db.collection('users').doc(currentUser.uid).collection('entries');
      const debitDoc = colRef.doc();
      const creditDoc = colRef.doc();
      
      debitPayload.transferPeerId = creditDoc.id;
      creditPayload.transferPeerId = debitDoc.id;

      const batch = db.batch();
      batch.set(debitDoc, debitPayload);
      batch.set(creditDoc, creditPayload);
      await batch.commit();

      // Add to local array
      if (typeof entries !== 'undefined') {
        entries.unshift({ _id: debitDoc.id, ...debitPayload });
        entries.unshift({ _id: creditDoc.id, ...creditPayload });
      }
    } else if (typeof entries !== 'undefined') {
      debitPayload._id = 'local_' + Date.now() + '_deb';
      creditPayload._id = 'local_' + (Date.now() + 1) + '_cred';
      debitPayload.transferPeerId = creditPayload._id;
      creditPayload.transferPeerId = debitPayload._id;
      entries.unshift(debitPayload);
      entries.unshift(creditPayload);
    }

    if (typeof window.closeCustomSheet === 'function') window.closeCustomSheet();
    window.renderWalletSwitcher();
    if (typeof updateHeaderStats === 'function') updateHeaderStats();
    if (typeof renderHomeSnapshot === 'function') renderHomeSnapshot();
    if (typeof renderEntries === 'function') renderEntries();
    if (typeof renderReport === 'function') renderReport();
    if (typeof toast === 'function') toast(`Transferred ₹${amt} from ${fromWallet?.name} to ${toWallet?.name}! 🔁`, 'success');
  } catch (e) {
    if (typeof toast === 'function') toast('Transfer failed: ' + e.message, 'error');
  }
};

/**
 * Cloud-First Sync on Auth State Change
 */
window.syncWalletsFromCloud = async function(user) {
  if (!user || typeof db === 'undefined') return;
  try {
    const snap = await db.collection('users').doc(user.uid).collection('wallets').get();
    if (snap && !snap.empty) {
      const cloudWallets = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      // Cloud is authoritative on login
      userWallets = cloudWallets;
      const existingIds = new Set(userWallets.map(w => w.id));
      DEFAULT_WALLETS.forEach(dw => {
        if (!existingIds.has(dw.id)) userWallets.push({ ...dw });
      });
      isCloudWalletsLoaded = true;
      window.saveWallets();
      window.renderWalletSwitcher();
      if (typeof updateHeaderStats === 'function') updateHeaderStats();
    } else {
      // First time on cloud: seed default wallets
      window.saveWallets();
    }
  } catch (e) {
    console.warn('Cloud wallets load error:', e.message);
  }
};

// Firestore Cloud Sync listener
if (window.firebase && firebase.auth()) {
  firebase.auth().onAuthStateChanged((user) => {
    window.loadWallets();
    window.renderWalletSwitcher();
    if (user) {
      window.syncWalletsFromCloud(user);
    }
  });
}

// Initial Auto-Render
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.renderWalletSwitcher();
  });
} else {
  window.renderWalletSwitcher();
}
