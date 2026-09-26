'use strict';

/**
 * PocketTrack Shared Portfolios & Multi-Member Expense Engine
 * Allows multiple members (roommates, couples, trip groups, family)
 * to track shared expenses together with live balance pools, Ledger integration, and WhatsApp settlement.
 */

// Inject styles for Portfolio switcher, Member Badges, and Shared Pool Cards
(function() {
  const s = document.createElement('style');
  s.textContent = `
    .portfolio-switcher-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      overflow-x: auto;
      padding: 4px 2px 10px 2px;
      margin-bottom: 10px;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
    }
    .portfolio-switcher-bar::-webkit-scrollbar { display: none; }
    
    .portfolio-pill {
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
    .portfolio-pill:active { transform: scale(0.95); }
    .portfolio-pill.active {
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(236, 72, 153, 0.25));
      border-color: rgba(139, 92, 246, 0.7);
      color: #ffffff;
      box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
    }
    .portfolio-pill.add-pill {
      border-style: dashed;
      background: rgba(139, 92, 246, 0.08);
      color: var(--accent-bright, #c4b5fd);
      border-color: rgba(139, 92, 246, 0.4);
    }
    
    .shared-pool-card {
      background: linear-gradient(165deg, rgba(28, 22, 54, 0.92), rgba(13, 10, 28, 0.96));
      border: 1px solid rgba(139, 92, 246, 0.4);
      border-radius: 24px;
      padding: 20px 18px;
      margin-bottom: 16px;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
      position: relative;
    }
    .shared-pool-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 14px;
    }
    .shared-pool-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 800;
      padding: 3px 9px;
      border-radius: 99px;
      background: rgba(52, 211, 153, 0.15);
      color: var(--green, #34d399);
      border: 1px solid rgba(52, 211, 153, 0.3);
    }
    
    .shared-settle-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(135px, 1fr));
      gap: 8px;
      margin: 12px 0;
    }
    .shared-settle-item {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 12px 10px;
      text-align: center;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .shared-settle-name { font-size: 13px; color: #fff; margin-bottom: 3px; font-weight: 700; }
    .shared-settle-amt { font-size: 14px; font-weight: 800; font-family: 'Space Grotesk', sans-serif; }
    
    .ledger-link-btn {
      margin-top: 6px;
      background: rgba(139, 92, 246, 0.15);
      border: 1px solid rgba(139, 92, 246, 0.35);
      color: var(--accent-bright, #c4b5fd);
      font-size: 10.5px;
      font-weight: 700;
      border-radius: 8px;
      padding: 4px 6px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .ledger-link-btn:active { transform: scale(0.95); background: rgba(139, 92, 246, 0.35); }

    .whatsapp-btn {
      background: #25D366;
      color: #ffffff;
      border: none;
      border-radius: 14px;
      padding: 12px 16px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      box-shadow: 0 4px 14px rgba(37, 211, 102, 0.35);
      transition: transform 0.2s, background 0.2s;
    }
    .whatsapp-btn:active { transform: scale(0.95); background: #1ebc59; }

    /* Dedicated Mobile & Desktop Modal System */
    .pt-sheet-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.78);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      z-index: 100000 !important;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.25s ease, visibility 0.25s;
    }
    .pt-sheet-backdrop.active {
      opacity: 1;
      visibility: visible;
    }
    .pt-sheet-panel {
      width: 100%;
      max-width: 460px;
      background: linear-gradient(175deg, #1f1a3a 0%, #120e24 100%);
      border: 1px solid rgba(139, 92, 246, 0.4);
      border-radius: 28px;
      padding: 24px 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7);
      transform: scale(0.92);
      transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
      box-sizing: border-box;
      max-height: 90vh;
      overflow-y: auto;
    }
    .pt-sheet-backdrop.active .pt-sheet-panel {
      transform: scale(1);
    }
    .pt-sheet-handle {
      width: 44px;
      height: 5px;
      border-radius: 3px;
      background: rgba(255, 255, 255, 0.25);
      margin: -10px auto 16px;
      display: none;
    }
    @media (max-width: 600px) {
      .pt-sheet-backdrop {
        align-items: flex-end;
        padding: 0;
      }
      .pt-sheet-panel {
        border-radius: 28px 28px 0 0;
        padding: 22px 18px calc(24px + env(safe-area-inset-bottom, 0px));
        transform: translateY(100%);
      }
      .pt-sheet-backdrop.active .pt-sheet-panel {
        transform: translateY(0);
      }
      .pt-sheet-handle {
        display: block;
      }
    }
  `;
  if (typeof document !== 'undefined') (document.head || document.documentElement || document.body)?.appendChild(s);
})();

// Data Store
let sharedPortfolios = [];
let activePortfolioId = 'personal'; // 'personal' or portfolio id

const DEFAULT_PORTFOLIO_ICONS = ['👥', '🏠', '✈️', '🍕', '🎉', '💼', '🚗', '⛺'];

function getSharedPortfoliosStorageKey() {
  const uid = (typeof currentUser !== 'undefined' && currentUser) ? currentUser.uid : 'guest';
  return 'pockettrack_shared_portfolios_' + uid;
}

function loadSharedPortfolios() {
  try {
    let allSpaces = [];
    const keysToCheck = [
      'pockettrack_shared_portfolios',
      'pockettrack_shared_portfolios_guest',
      'pockettrack_shared_spaces',
      'pockettrack_spaces'
    ];
    if (typeof currentUser !== 'undefined' && currentUser && currentUser.uid) {
      keysToCheck.unshift('pockettrack_shared_portfolios_' + currentUser.uid);
    }
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('pockettrack_shared_') || k.startsWith('pockettrack_spaces')) && !keysToCheck.includes(k)) {
        keysToCheck.push(k);
      }
    }

    for (const key of keysToCheck) {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach(space => {
              if (space && space.id && !allSpaces.some(s => s.id === space.id)) {
                allSpaces.push(space);
              }
            });
          }
        } catch(e){}
      }
    }
    sharedPortfolios = allSpaces;
  } catch (e) {
    sharedPortfolios = [];
  }
}

function saveSharedPortfolios() {
  try {
    const dataStr = JSON.stringify(sharedPortfolios);
    localStorage.setItem(getSharedPortfoliosStorageKey(), dataStr);
    localStorage.setItem('pockettrack_shared_portfolios', dataStr);
    localStorage.setItem('pockettrack_shared_portfolios_guest', dataStr);

    if (typeof currentUser !== 'undefined' && currentUser && typeof db !== 'undefined') {
      sharedPortfolios.forEach(space => {
        db.collection('users').doc(currentUser.uid).collection('spaces').doc(space.id).set(space, { merge: true }).catch(()=>{});
      });
    }
  } catch (e) {}
}

if (window.firebase && firebase.auth()) {
  firebase.auth().onAuthStateChanged((user) => {
    loadSharedPortfolios();
    renderPortfolioSwitcher();
    renderSharedPortfolioView();
    if (user && typeof db !== 'undefined') {
      try {
        db.collection('users').doc(user.uid).collection('spaces')
          .onSnapshot((snap) => {
            if (snap && !snap.empty) {
              const cloudSpaces = snap.docs.map(d => ({ ...d.data(), id: d.id }));
              let changed = false;
              cloudSpaces.forEach(cs => {
                const idx = sharedPortfolios.findIndex(s => s.id === cs.id);
                if (idx >= 0) {
                  sharedPortfolios[idx] = { ...sharedPortfolios[idx], ...cs };
                } else {
                  sharedPortfolios.push(cs);
                  changed = true;
                }
              });
              if (changed) {
                saveSharedPortfolios();
                renderPortfolioSwitcher();
                renderSharedPortfolioView();
              }
            }
          }, err => console.warn('Cloud spaces listener fallback:', err.message));
      } catch(e){}
    }
  });
}

/**
 * Renders the top switcher pill bar
 */
function renderPortfolioSwitcher() {
  loadSharedPortfolios();
  const bar = document.getElementById('portfolio-switcher-bar');
  if (!bar) return;

  const listEl = document.getElementById('portfolio-pills-list');
  if (!listEl) return;

  const personalBtn = document.getElementById('port-pill-personal');
  if (personalBtn) {
    personalBtn.classList.toggle('active', activePortfolioId === 'personal');
  }

  listEl.innerHTML = sharedPortfolios.map(p => {
    const isActive = activePortfolioId === p.id;
    return `
      <button class="portfolio-pill ${isActive ? 'active' : ''}" onclick="switchActivePortfolio('${p.id}')">
        <span>${p.icon || '👥'} ${escapeHTML(p.name)}</span>
      </button>
    `;
  }).join('');
}

/**
 * Hide / Show Personal vs Shared Home elements
 */
function updateHomeVisibilityForActivePortfolio() {
  const isShared = activePortfolioId !== 'personal';
  const heroCard = document.getElementById('hero-balance-card');
  const recentSection = document.getElementById('home-recent-activity');
  const recentHead = document.querySelector('.home-section-head');
  const powerHub = document.getElementById('more-features-card');
  const powerWidgets = document.querySelector('.home-power-widgets-row');
  const dailyBurn = document.getElementById('home-daily-burn-slot');
  const streakCard = document.getElementById('streak-card');
  const greeting = document.querySelector('.home-greeting');

  if (heroCard) heroCard.style.display = isShared ? 'none' : 'block';
  if (recentSection) recentSection.style.display = isShared ? 'none' : 'block';
  if (recentHead) recentHead.style.display = isShared ? 'none' : 'flex';
  if (powerHub) powerHub.style.display = isShared ? 'none' : 'block';
  if (powerWidgets) powerWidgets.style.display = isShared ? 'none' : 'grid';
  if (dailyBurn) dailyBurn.style.display = isShared ? 'none' : 'block';
  if (streakCard) streakCard.style.display = 'none';
  if (greeting) greeting.style.display = isShared ? 'none' : 'flex';
}

window.switchActivePortfolio = function(portfolioId) {
  activePortfolioId = portfolioId;
  renderPortfolioSwitcher();
  updateHomeVisibilityForActivePortfolio();
  renderSharedPortfolioView();
  if (typeof renderHomeSnapshot === 'function') renderHomeSnapshot();
  if (typeof toast === 'function') {
    const p = sharedPortfolios.find(x => x.id === portfolioId);
    const label = p ? p.name : 'Personal Vault';
    toast('Switched to ' + label, 'info');
  }
};

/**
 * Creates a dedicated Sheet Backdrop container
 */
function getOrCreateSheetContainer() {
  let el = document.getElementById('pt-sheet-container');
  if (!el) {
    el = document.createElement('div');
    el.id = 'pt-sheet-container';
    el.className = 'pt-sheet-backdrop';
    el.onclick = function(e) {
      if (e.target === el) window.closeCustomSheet();
    };
    document.body.appendChild(el);
  }
  return el;
}

window.closeCustomSheet = function() {
  const el = document.getElementById('pt-sheet-container');
  if (el) el.classList.remove('active');
};

/**
 * Creates a new Shared Portfolio Modal (with 1-Tap Ledger Contacts Import)
 */
window.openNewPortfolioModal = function() {
  const container = getOrCreateSheetContainer();
  const ledgerContacts = (typeof ledgerPeople !== 'undefined' && Array.isArray(ledgerPeople)) ? ledgerPeople : [];

  let contactChipsHtml = '';
  if (ledgerContacts.length) {
    contactChipsHtml = `
      <div style="margin-bottom:14px;">
        <label style="font-size:11.5px;font-weight:700;color:var(--text-dim);display:block;margin-bottom:6px;">📑 Tap to add from your Ledger Contacts:</label>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${ledgerContacts.map(c => `
            <button type="button" onclick="addContactToSpaceMembers('${escapeHTML(c.name)}')" style="background:rgba(139,92,246,0.16);border:1px solid rgba(139,92,246,0.4);color:#fff;border-radius:99px;padding:4px 10px;font-size:11.5px;cursor:pointer;font-weight:600;">
              + ${escapeHTML(c.name)}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="pt-sheet-panel">
      <div class="pt-sheet-handle"></div>
      
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <h3 style="margin:0;font-size:19px;font-weight:700;color:#fff;font-family:'Space Grotesk',sans-serif;">👥 Create Shared Space</h3>
        <button onclick="closeCustomSheet()" style="background:rgba(255,255,255,0.08);border:none;color:#fff;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:16px;">✕</button>
      </div>

      <p style="font-size:12.5px;color:var(--text-dim,#94a3b8);margin:0 0 14px;line-height:1.45;">
        Track pooled expenses with flatmates, friends, partners, or trip groups.
      </p>
      
      <label style="font-size:12px;font-weight:600;color:#cbd5e1;display:block;margin-bottom:4px;">Space / Group Name</label>
      <input type="text" id="new-port-name" placeholder="e.g. Flat 302, Goa Trip, Family" style="width:100%;padding:12px 14px;border-radius:14px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);color:#fff;font-size:14.5px;margin-bottom:12px;box-sizing:border-box;outline:none;">
      
      ${contactChipsHtml}

      <label style="font-size:12px;font-weight:600;color:#cbd5e1;display:block;margin-bottom:4px;">Members (comma-separated)</label>
      <input type="text" id="new-port-members" placeholder="e.g. Rahul, Priya, Amit, Me" value="Me" style="width:100%;padding:12px 14px;border-radius:14px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);color:#fff;font-size:14.5px;margin-bottom:18px;box-sizing:border-box;outline:none;">
      
      <div style="display:flex;gap:10px;">
        <button class="btn" onclick="closeCustomSheet()" style="flex:1;border-radius:14px;padding:12px;font-size:13px;">Cancel</button>
        <button class="btn primary" onclick="submitNewPortfolio()" style="flex:1.4;border-radius:14px;padding:12px;font-size:13px;background:linear-gradient(135deg,#8b5cf6,#ec4899);font-weight:700;">Create Space →</button>
      </div>
    </div>
  `;

  requestAnimationFrame(() => {
    container.classList.add('active');
    setTimeout(() => document.getElementById('new-port-name')?.focus(), 100);
  });
};

window.addContactToSpaceMembers = function(name) {
  const input = document.getElementById('new-port-members');
  if (!input) return;
  let members = input.value.split(',').map(m => m.trim()).filter(Boolean);
  if (!members.includes(name)) {
    members.push(name);
    input.value = members.join(', ');
  }
};

window.submitNewPortfolio = function() {
  const nameEl = document.getElementById('new-port-name');
  const membersEl = document.getElementById('new-port-members');
  if (!nameEl || !nameEl.value.trim()) {
    if (typeof toast === 'function') toast('Please enter a space name', 'error');
    return;
  }

  const rawMembers = membersEl ? membersEl.value.split(',').map(m => m.trim()).filter(Boolean) : ['Me'];
  if (!rawMembers.includes('Me')) rawMembers.unshift('Me');

  const randomIcon = DEFAULT_PORTFOLIO_ICONS[Math.floor(Math.random() * DEFAULT_PORTFOLIO_ICONS.length)];
  const newPortfolio = {
    id: 'port_' + Date.now(),
    name: nameEl.value.trim(),
    icon: randomIcon,
    members: rawMembers,
    inviteCode: 'PT' + Math.floor(1000 + Math.random() * 9000),
    expenses: [],
    createdAt: Date.now()
  };

  sharedPortfolios.push(newPortfolio);
  saveSharedPortfolios();
  window.closeCustomSheet();
  switchActivePortfolio(newPortfolio.id);
  if (typeof toast === 'function') toast(`Created "${newPortfolio.name}"!`, 'success');
};

/**
 * Syncs a Space debt directly into the member's Ledger Khata Account!
 */
window.syncSpaceDebtToLedger = function(memberName, amount, spaceName) {
  if (memberName === 'Me') return;
  const absAmt = Math.abs(Math.round(amount));
  if (absAmt <= 0) return;

  if (typeof addLedgerPerson === 'function' && typeof saveLedgerTx === 'function') {
    let person = (ledgerPeople || []).find(p => p.name.toLowerCase() === memberName.toLowerCase());
    if (!person) {
      addLedgerPerson(memberName);
      person = (ledgerPeople || []).find(p => p.name.toLowerCase() === memberName.toLowerCase());
    }
    
    if (person) {
      saveLedgerTx(person._id, amount < 0 ? 'gave' : 'received', absAmt, `${spaceName} Space split`);
      if (typeof toast === 'function') toast(`📑 Recorded ₹${absAmt} into ${memberName}'s Ledger account!`, 'success');
    }
  } else {
    if (typeof toast === 'function') toast(`Recorded ₹${absAmt} to Ledger!`, 'success');
  }
};

/**
 * Renders the isolated Shared Portfolio view on the Home Tab
 */
function renderSharedPortfolioView() {
  const container = document.getElementById('home-shared-portfolio-slot');
  if (!container) return;

  updateHomeVisibilityForActivePortfolio();

  if (activePortfolioId === 'personal') {
    container.innerHTML = '';
    return;
  }

  const portfolio = sharedPortfolios.find(p => p.id === activePortfolioId);
  if (!portfolio) {
    activePortfolioId = 'personal';
    renderPortfolioSwitcher();
    updateHomeVisibilityForActivePortfolio();
    container.innerHTML = '';
    return;
  }

  let totalPoolSpend = 0;
  const memberSpent = {};
  portfolio.members.forEach(m => { memberSpent[m] = 0; });

  (portfolio.expenses || []).forEach(e => {
    const amt = parseFloat(e.amt) || 0;
    totalPoolSpend += amt;
    const paidBy = e.paidBy || 'Me';
    memberSpent[paidBy] = (memberSpent[paidBy] || 0) + amt;
  });

  const memberCount = Math.max(1, portfolio.members.length);
  const perPersonShare = totalPoolSpend / memberCount;

  const balances = {};
  portfolio.members.forEach(m => {
    balances[m] = (memberSpent[m] || 0) - perPersonShare;
  });

  const settleCardsHtml = portfolio.members.map(m => {
    const net = balances[m] || 0;
    const isOwed = net > 0;
    const isZero = Math.abs(net) < 1;
    const color = isZero ? 'var(--text-dim,#94a3b8)' : (isOwed ? 'var(--green,#34d399)' : 'var(--red,#f87171)');
    const label = isZero ? 'Settled Up' : (isOwed ? `Gets back ₹${Math.round(net).toLocaleString('en-IN')}` : `Owes ₹${Math.abs(Math.round(net)).toLocaleString('en-IN')}`);
    
    return `
      <div class="shared-settle-item">
        <div class="shared-settle-name">${escapeHTML(m)}</div>
        <div class="shared-settle-amt" style="color:${color};">${label}</div>
        <div style="font-size:10.5px;color:var(--text-dim);margin-top:2px;">Paid: ₹${(memberSpent[m] || 0).toLocaleString('en-IN')}</div>
        ${(m !== 'Me' && !isZero) ? `
          <button class="ledger-link-btn" onclick="syncSpaceDebtToLedger('${escapeHTML(m)}', ${net}, '${escapeHTML(portfolio.name)}')">
            📑 Post to Ledger
          </button>
        ` : ''}
      </div>
    `;
  }).join('');

  const expListHtml = (portfolio.expenses && portfolio.expenses.length) ? portfolio.expenses.map(e => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;margin-bottom:6px;">
      <div>
        <div style="font-size:13.5px;font-weight:700;color:#fff;">${escapeHTML(e.desc || 'Expense')}</div>
        <div style="font-size:11px;color:var(--text-dim);">Paid by <b>${escapeHTML(e.paidBy || 'Me')}</b> · ${e.date || ''}</div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-size:15px;font-weight:800;font-family:'Space Grotesk',sans-serif;color:var(--red,#f87171);">₹${parseFloat(e.amt || 0).toLocaleString('en-IN')}</span>
        <button onclick="deleteSharedExpense('${portfolio.id}', '${e.id}')" style="background:transparent;border:none;color:var(--red,#f87171);cursor:pointer;padding:2px;"><i class="ti ti-trash"></i></button>
      </div>
    </div>
  `).join('') : `<p style="text-align:center;color:var(--text-dim);font-size:12.5px;padding:16px 0;">No shared entries yet. Log the first group expense below!</p>`;

  container.innerHTML = `
    <!-- Top Shared Space Card -->
    <div class="shared-pool-card">
      <div class="shared-pool-head">
        <div>
          <div class="shared-pool-badge">👥 SHARED SPACE ACTIVE</div>
          <h2 style="margin:4px 0 2px 0;font-size:22px;color:#fff;font-family:'Space Grotesk',sans-serif;font-weight:800;">${portfolio.icon || '👥'} ${escapeHTML(portfolio.name)}</h2>
          <p style="margin:0;font-size:12px;color:var(--text-dim);">Code: <b>${portfolio.inviteCode}</b> · ${portfolio.members.length} Members</p>
        </div>
        <div style="text-align:right;">
          <div style="font-size:10.5px;color:var(--text-dim);text-transform:uppercase;">Pool Total</div>
          <div style="font-size:24px;font-weight:800;color:#fff;font-family:'Space Grotesk',sans-serif;">₹${totalPoolSpend.toLocaleString('en-IN')}</div>
          <div style="font-size:11px;color:var(--accent-bright,#a78bfa);">₹${Math.round(perPersonShare).toLocaleString('en-IN')}/person</div>
        </div>
      </div>

      <div style="font-size:11px;font-weight:700;color:var(--text-dim);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Member Split Balances</div>
      <div class="shared-settle-grid">
        ${settleCardsHtml}
      </div>

      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px;">
        <button class="btn primary" style="flex:1.2;border-radius:14px;padding:12px 14px;font-size:13.5px;font-weight:700;" onclick="openAddSharedExpenseModal('${portfolio.id}')">
          <i class="ti ti-plus"></i> Add Group Expense
        </button>
        <button class="whatsapp-btn" style="flex:1;" onclick="sharePortfolioOnWhatsApp('${portfolio.id}')">
          <span>💬 Settle on WhatsApp</span>
        </button>
      </div>
    </div>

    <!-- Shared Entries Section -->
    <div class="card" style="border-radius:22px;padding:16px 14px;border:1px solid rgba(255,255,255,0.08);background:linear-gradient(145deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02));margin-bottom:14px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <h4 style="margin:0;font-family:'Space Grotesk',sans-serif;font-size:15px;color:#fff;">📜 ${escapeHTML(portfolio.name)} Activity</h4>
        <button class="btn btn-sm" onclick="switchActivePortfolio('personal')" style="border-radius:10px;font-size:11px;padding:3px 10px;">← Personal Vault</button>
      </div>
      <div>
        ${expListHtml}
      </div>
    </div>
  `;
}

window.deleteSharedExpense = function(portfolioId, expenseId) {
  const p = sharedPortfolios.find(x => x.id === portfolioId);
  if (!p) return;
  p.expenses = (p.expenses || []).filter(e => e.id !== expenseId);
  saveSharedPortfolios();
  renderSharedPortfolioView();
  if (typeof toast === 'function') toast('Entry deleted', 'success');
};

window.openAddSharedExpenseModal = function(portfolioId) {
  const p = sharedPortfolios.find(x => x.id === portfolioId);
  if (!p) return;

  const memberOptions = p.members.map(m => `<option value="${escapeHTML(m)}">${escapeHTML(m)}</option>`).join('');
  const container = getOrCreateSheetContainer();

  container.innerHTML = `
    <div class="pt-sheet-panel">
      <div class="pt-sheet-handle"></div>
      
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <h3 style="margin:0;font-size:19px;font-weight:700;color:#fff;font-family:'Space Grotesk',sans-serif;">➕ Add Group Expense</h3>
        <button onclick="closeCustomSheet()" style="background:rgba(255,255,255,0.08);border:none;color:#fff;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:16px;">✕</button>
      </div>
      
      <label style="font-size:12px;color:#cbd5e1;display:block;margin-bottom:4px;font-weight:600;">Description</label>
      <input type="text" id="shared-exp-desc" placeholder="e.g. Dinner at Dhaba, Groceries, Petrol" style="width:100%;padding:12px 14px;border-radius:14px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);color:#fff;font-size:14.5px;margin-bottom:12px;box-sizing:border-box;outline:none;" autofocus>
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px;">
        <div>
          <label style="font-size:12px;color:#cbd5e1;display:block;margin-bottom:4px;font-weight:600;">Amount (₹)</label>
          <input type="number" id="shared-exp-amt" placeholder="₹0" style="width:100%;padding:12px 14px;border-radius:14px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);color:#fff;font-size:16px;font-weight:700;box-sizing:border-box;outline:none;">
        </div>
        <div>
          <label style="font-size:12px;color:#cbd5e1;display:block;margin-bottom:4px;font-weight:600;">Who Paid?</label>
          <select id="shared-exp-payer" style="width:100%;padding:12px 14px;border-radius:14px;background:#1a1438;border:1px solid rgba(255,255,255,0.15);color:#fff;font-size:14.5px;box-sizing:border-box;outline:none;">
            ${memberOptions}
          </select>
        </div>
      </div>
      
      <div style="display:flex;gap:10px;">
        <button class="btn" onclick="closeCustomSheet()" style="flex:1;border-radius:14px;padding:12px;font-size:13px;">Cancel</button>
        <button class="btn primary" onclick="submitSharedExpense('${p.id}')" style="flex:1.4;border-radius:14px;padding:12px;font-weight:700;font-size:13.5px;">Save &amp; Split →</button>
      </div>
    </div>
  `;

  requestAnimationFrame(() => {
    container.classList.add('active');
    setTimeout(() => document.getElementById('shared-exp-desc')?.focus(), 100);
  });
};

window.submitSharedExpense = function(portfolioId) {
  const desc = document.getElementById('shared-exp-desc')?.value.trim();
  const amt = parseFloat(document.getElementById('shared-exp-amt')?.value);
  const paidBy = document.getElementById('shared-exp-payer')?.value || 'Me';

  if (!desc || isNaN(amt) || amt <= 0) {
    if (typeof toast === 'function') toast('Please enter valid description and amount', 'error');
    return;
  }

  const p = sharedPortfolios.find(x => x.id === portfolioId);
  if (!p) return;

  if (!p.expenses) p.expenses = [];
  p.expenses.unshift({
    id: 'exp_' + Date.now(),
    desc,
    amt,
    paidBy,
    date: (typeof todayStr === 'function') ? todayStr() : new Date().toISOString().split('T')[0],
    createdAt: Date.now()
  });

  saveSharedPortfolios();
  window.closeCustomSheet();
  renderSharedPortfolioView();
  if (typeof toast === 'function') toast(`Added ₹${amt} by ${paidBy}!`, 'success');
};

/**
 * 1-Tap WhatsApp Settlement Reminder Generator
 */
window.sharePortfolioOnWhatsApp = function(portfolioId) {
  const p = sharedPortfolios.find(x => x.id === portfolioId);
  if (!p) return;

  let totalPoolSpend = 0;
  const memberSpent = {};
  p.members.forEach(m => { memberSpent[m] = 0; });

  (p.expenses || []).forEach(e => {
    const amt = parseFloat(e.amt) || 0;
    totalPoolSpend += amt;
    const paidBy = e.paidBy || 'Me';
    memberSpent[paidBy] = (memberSpent[paidBy] || 0) + amt;
  });

  const memberCount = Math.max(1, p.members.length);
  const perPersonShare = totalPoolSpend / memberCount;

  let message = `👋 *PocketTrack Expense Split — ${p.name}*\n`;
  message += `💰 *Total Pool:* ₹${totalPoolSpend.toLocaleString('en-IN')} (₹${Math.round(perPersonShare).toLocaleString('en-IN')}/person)\n\n`;
  message += `📊 *Current Balances:*\n`;

  p.members.forEach(m => {
    const net = (memberSpent[m] || 0) - perPersonShare;
    if (net > 0) {
      message += `🟢 *${m}:* gets back ₹${Math.round(net).toLocaleString('en-IN')}\n`;
    } else if (net < 0) {
      message += `🔴 *${m}:* owes ₹${Math.abs(Math.round(net)).toLocaleString('en-IN')}\n`;
    } else {
      message += `⚪ *${m}:* settled\n`;
    }
  });

  message += `\n⚡ Tracked in real-time with PocketTrack`;

  const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
};

// Initial Auto-Load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    renderPortfolioSwitcher();
    renderSharedPortfolioView();
  });
} else {
  renderPortfolioSwitcher();
  renderSharedPortfolioView();
}
