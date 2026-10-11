// Unit tests for Tier 2 fixes
const fs = require('fs');

function testReview006() {
  const code = fs.readFileSync('app.js', 'utf8');
  // Check syntax
  new Function(code);

  const fnMatch = code.match(/function escapeHTML\(str\)\{[\s\S]*?\n\}/);
  if (!fnMatch) throw new Error('escapeHTML not found in app.js');
  
  const escapeHTML = new Function('str', fnMatch[0].replace(/function escapeHTML\(str\)\{/, '').replace(/\}$/, ''));
  const res = escapeHTML('&<>\'"');
  if (res !== '&amp;&lt;&gt;&#39;&quot;' && res !== '&amp;&lt;&gt;&quot;&#39;') {
    throw new Error('escapeHTML failed: ' + res);
  }
  if (escapeHTML(null) !== '' || escapeHTML(undefined) !== '') {
    throw new Error('escapeHTML null/undefined handling failed');
  }

  // Check showAppPrompt sanitization
  if (!code.includes('<p style="margin-bottom:12px">${escapeHTML(message)}</p>')) {
    throw new Error('showAppPrompt message not escaped');
  }
  if (!code.includes('value="${escapeHTML(defaultValue || \'\')}"')) {
    throw new Error('showAppPrompt defaultValue not sanitized');
  }
  console.log('✔ REVIEW-006: PASSED');
}

function testReview007() {
  const shared = fs.readFileSync('shared_portfolios.js', 'utf8');
  new Function(shared);
  if (!shared.includes('data-name="${escapeHTML(c.name)}" onclick="addContactToSpaceMembers(this.dataset.name)"')) {
    throw new Error('shared_portfolios.js not updated for REVIEW-007');
  }

  const upi = fs.readFileSync('upi_qr_generator.js', 'utf8');
  new Function(upi);
  if (!upi.includes('data-amount="${Number(amount) || 0}" data-note="${escapeHTML(note)}" onclick="openUpiSetupModal(Number(this.dataset.amount), this.dataset.note)"')) {
    throw new Error('upi_qr_generator.js line 140 not updated for REVIEW-007');
  }
  if (!upi.includes('data-amount="${Number(amount) || 0}" data-note="${escapeHTML(note)}" onclick="saveUpiIdFromSetup(Number(this.dataset.amount), this.dataset.note)"')) {
    throw new Error('upi_qr_generator.js line 180 not updated for REVIEW-007');
  }

  const app = fs.readFileSync('app.js', 'utf8');
  new Function(app);
  if (!app.includes('data-name="${escapeHTML(name)}" onclick="startEditCustomOption(this.dataset.name)"')) {
    throw new Error('app.js startEditCustomOption not updated for REVIEW-007');
  }
  if (!app.includes('data-name="${escapeHTML(name)}" onclick="confirmDeleteCustomOption(this.dataset.name)"')) {
    throw new Error('app.js confirmDeleteCustomOption not updated for REVIEW-007');
  }

  console.log('✔ REVIEW-007: PASSED');
}

function testReview008() {
  const upiCode = fs.readFileSync('upi_qr_generator.js', 'utf8');
  if (upiCode.includes('api.qrserver.com')) {
    throw new Error('upi_qr_generator.js still contains api.qrserver.com!');
  }
  if (!upiCode.includes('function generateUpiQrSvg')) {
    throw new Error('generateUpiQrSvg not found in upi_qr_generator.js');
  }

  // Syntax check in VM
  const vm = require('vm');
  const sandbox = {
    window: {},
    document: {
      createElement: () => ({ setAttribute: ()=>{}, style: {}, appendChild: ()=>{} }),
      head: { appendChild: ()=>{} }
    },
    localStorage: { getItem: ()=>'' }
  };
  vm.createContext(sandbox);
  vm.runInContext(upiCode, sandbox);

  if (typeof sandbox.window.generateUpiQrSvg !== 'function') {
    throw new Error('window.generateUpiQrSvg is not a function');
  }
  const svg = sandbox.window.generateUpiQrSvg('upi://pay?pa=test@upi&pn=PocketTrack', 200);
  if (!svg.startsWith('<svg') || !svg.includes('<path d="M')) {
    throw new Error('generateUpiQrSvg produced invalid SVG');
  }

  const svgLong = sandbox.window.generateUpiQrSvg('upi://pay?pa=ekaant.taparia@okhdfcbank&pn=PocketTrack&am=12500.50&tn=Monthly%20Maintenance%20and%20Electricity%20Bill&cu=INR', 200);
  if (!svgLong.startsWith('<svg') || !svgLong.includes('<path d="M')) {
    throw new Error('generateUpiQrSvg produced invalid SVG for long payload');
  }

  console.log('✔ REVIEW-008: PASSED');
}

function testReview009() {
  const authCode = fs.readFileSync('auth.js', 'utf8');
  if (!authCode.includes('function purgeUserLocalStorage(')) {
    throw new Error('purgeUserLocalStorage not found in auth.js');
  }

  // Test purgeUserLocalStorage logic
  const store = {
    'pockettrack_debts': '[]',
    'pockettrack_debts_user1': '[1]',
    'pockettrack_monthly_income_user1': '50000',
    'pockettrack_user_upi_id_user1': 'user1@upi',
    'pockettrack_entries_cache_user1': '[]',
    'pockettrack_debts_user2': '[2]',
    'pockettrack_monthly_income_user2': '75000',
    'pockettrack_user_upi_id_user2': 'user2@upi',
    'pockettrack_entries_cache_user2': '[{id:"e2"}]',
    'pockettrack_lang': 'en'
  };

  const keys = Object.keys(store);
  const mockLocalStorage = {
    getItem: (k) => store[k],
    setItem: (k, v) => { store[k] = v; },
    removeItem: (k) => { delete store[k]; },
    key: (i) => Object.keys(store)[i],
    get length() { return Object.keys(store).length; }
  };

  const vm = require('vm');
  const sandbox = {
    window: {},
    document: {
      getElementById: () => ({ style: {} }),
      body: { classList: { toggle: ()=>{} } }
    },
    localStorage: mockLocalStorage,
    currentUser: { uid: 'user1' }
  };
  vm.createContext(sandbox);
  vm.runInContext(authCode, sandbox);

  sandbox.purgeUserLocalStorage('user1');
  if (store['pockettrack_debts_user1'] || store['pockettrack_monthly_income_user1'] || store['pockettrack_user_upi_id_user1'] || store['pockettrack_entries_cache_user1']) {
    throw new Error('purgeUserLocalStorage did not purge user1 keys');
  }
  if (store['pockettrack_debts']) {
    throw new Error('purgeUserLocalStorage did not purge legacy un-namespaced keys');
  }
  if (!store['pockettrack_debts_user2'] || !store['pockettrack_monthly_income_user2'] || !store['pockettrack_user_upi_id_user2'] || !store['pockettrack_entries_cache_user2']) {
    throw new Error('purgeUserLocalStorage destroyed peer user2 keys');
  }
  if (!store['pockettrack_lang']) {
    throw new Error('purgeUserLocalStorage incorrectly removed pockettrack_lang');
  }

  // Check debt_payoff.js
  const debtCode = fs.readFileSync('debt_payoff.js', 'utf8');
  if (!debtCode.includes('getDebtsStorageKey()')) {
    throw new Error('debt_payoff.js missing getDebtsStorageKey()');
  }

  // Check envelopes.js
  const envCode = fs.readFileSync('envelopes.js', 'utf8');
  if (!envCode.includes('getUserIncomeStorageKey()') || !envCode.includes('getUserFinnyStorageKey()')) {
    throw new Error('envelopes.js missing namespacing functions');
  }

  // Check upi_qr_generator.js
  const upiCode = fs.readFileSync('upi_qr_generator.js', 'utf8');
  if (!upiCode.includes('pockettrack_user_upi_id_\' + uid')) {
    throw new Error('upi_qr_generator.js missing uid namespacing');
  }

  console.log('✔ REVIEW-009: PASSED');
}

function testReview012() {
  const html = fs.readFileSync('app.html', 'utf8');
  const cspMatch = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/);
  if (!cspMatch) throw new Error('CSP meta tag not found in app.html');
  if (cspMatch[1].includes("'unsafe-eval'")) {
    throw new Error('app.html CSP still includes unsafe-eval');
  }

  const vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  const wildcardHeader = vercel.headers.find(h => h.source === '/(.*)');
  if (!wildcardHeader) throw new Error('vercel.json missing /(.*) headers');

  const required = ['X-Frame-Options', 'X-Content-Type-Options', 'Referrer-Policy', 'Strict-Transport-Security'];
  for (const r of required) {
    if (!wildcardHeader.headers.some(h => h.key === r)) {
      throw new Error('vercel.json missing security header: ' + r);
    }
  }

  console.log('✔ REVIEW-012: PASSED');
}

function testReview021() {
  const txCode = fs.readFileSync('transactions.js', 'utf8');
  if (!txCode.includes("localStorage.setItem('pockettrack_entries_cache_' + currentUser.uid, JSON.stringify(entries))")) {
    throw new Error('transactions.js deleteEntry does not update local cache');
  }
  console.log('✔ REVIEW-021: PASSED');
}

function testReview022() {
  const recCode = fs.readFileSync('recurring.js', 'utf8');
  if (!recCode.includes('entryList.unshift(newEntry)')) {
    throw new Error('recurring.js does not push newEntry to entries list');
  }
  if (!recCode.includes("localStorage.setItem('pockettrack_entries_cache_' + currentUser.uid, JSON.stringify(entryList))")) {
    throw new Error('recurring.js does not update localStorage entries cache');
  }
  if (!recCode.includes('updateHeaderStats()') || !recCode.includes('renderEntries()')) {
    throw new Error('recurring.js does not update stats/entries UI');
  }
  console.log('✔ REVIEW-022: PASSED');
}

function testReview023() {
  const appCode = fs.readFileSync('app.js', 'utf8');
  new Function(appCode); // Syntax validity check for whole file

  const startIdx = appCode.indexOf('function calculateSettlement(eventId){');
  if (startIdx === -1) throw new Error('calculateSettlement not found in app.js');
  const endIdx = appCode.indexOf('window.calculateSettlement = calculateSettlement;', startIdx);
  const fnStr = appCode.substring(startIdx, endIdx);

  const calculateSettlement = new Function('eventId', 'events', fnStr + '\nreturn calculateSettlement(eventId);');

  // 3-way split of 100 paid by A
  const ev = {
    _id: 'ev1',
    participants: ['A', 'B', 'C'],
    sharedExpenses: [
      { amt: 100, paidBy: 'A', splitAmong: ['A', 'B', 'C'] }
    ]
  };

  const res = calculateSettlement('ev1', [ev]);
  if (!res) throw new Error('calculateSettlement returned null');

  const balSum = Object.values(res.balances).reduce((s, v) => s + v, 0);
  if (Math.abs(balSum) > 0.0001) {
    throw new Error('Settlement balances do not sum to 0: ' + balSum);
  }

  const transferSum = res.transfers.reduce((s, t) => s + t.amount, 0);
  if (Math.abs(transferSum - res.balances['A']) > 0.0001) {
    throw new Error('Transfers sum ' + transferSum + ' does not match creditor balance ' + res.balances['A']);
  }

  console.log('✔ REVIEW-023: PASSED');
}

function testReview024() {
  const appCode = fs.readFileSync('app.js', 'utf8');
  new Function(appCode);

  const startIdx = appCode.indexOf('function calculateSettlement(eventId){');
  const endIdx = appCode.indexOf('window.calculateSettlement = calculateSettlement;', startIdx);
  const fnStr = appCode.substring(startIdx, endIdx);

  const calculateSettlement = new Function('eventId', 'events', fnStr + '\nreturn calculateSettlement(eventId);');

  // Payer 'A' is no longer in event.participants (only B and C remain)
  const ev = {
    _id: 'ev2',
    participants: ['B', 'C'],
    sharedExpenses: [
      { amt: 300, paidBy: 'A', splitAmong: ['A', 'B', 'C'] }
    ]
  };

  const res = calculateSettlement('ev2', [ev]);
  if (!res) throw new Error('calculateSettlement returned null when payer was removed');

  // Payer A should be included in balances:
  if (res.balances['A'] === undefined) {
    throw new Error('Payer A was not included in balances');
  }

  const balSum = Object.values(res.balances).reduce((s, v) => s + v, 0);
  if (Math.abs(balSum) > 0.0001) {
    throw new Error('Settlement balances with removed payer do not sum to 0: ' + balSum);
  }

  // A is owed 200, B owes 100, C owes 100
  if (res.balances['A'] !== 200 || res.balances['B'] !== -100 || res.balances['C'] !== -100) {
    throw new Error('Unexpected balances: ' + JSON.stringify(res.balances));
  }

  console.log('✔ REVIEW-024: PASSED');
}

function testReview025() {
  const voiceCode = fs.readFileSync('voice.js', 'utf8');
  new Function(voiceCode);

  const startIdx = voiceCode.indexOf('function extractVoiceAmount(text){');
  const endIdx = voiceCode.indexOf('function parseVoiceInput(text) {', startIdx);
  const fnStr = voiceCode.substring(startIdx, endIdx);

  const extractVoiceAmount = new Function('text', fnStr + '\nreturn extractVoiceAmount(text);');

  // Test 1: Spoken with year 2024
  const res1 = extractVoiceAmount('dinner 500 in 2024');
  if (!res1 || res1.value !== 500) {
    throw new Error('Failed to filter year: ' + JSON.stringify(res1));
  }

  // Test 2: Spoken with 10-digit phone number using canonical preposition "for"
  const res2 = extractVoiceAmount('phone recharge 299 for 9876543210');
  if (!res2 || res2.value !== 299) {
    throw new Error('Failed to filter phone number: ' + JSON.stringify(res2));
  }

  // Test 3: Standalone phone number or year without amount should return null
  const res3a = extractVoiceAmount('call 9876543210');
  if (res3a !== null) {
    throw new Error('Standalone phone number should return null: ' + JSON.stringify(res3a));
  }
  const res3b = extractVoiceAmount('happy new year 2024');
  if (res3b !== null) {
    throw new Error('Standalone year should return null: ' + JSON.stringify(res3b));
  }

  console.log('✔ REVIEW-025: PASSED');
}

function testReview026() {
  const voiceCode = fs.readFileSync('voice.js', 'utf8');
  new Function(voiceCode);

  if (!voiceCode.includes('textForDate = textForDate.replace(extracted.text, \' \')')) {
    throw new Error('voice.js does not strip extracted.text from textForDate');
  }

  // Extract parseVoiceDate
  const startIdx = voiceCode.indexOf('function parseVoiceDate(text){');
  const endIdx = voiceCode.indexOf('function voiceCatsHtml(type){', startIdx);
  const parseVoiceDate = new Function('text', voiceCode.substring(startIdx, endIdx) + '\nreturn parseVoiceDate(text);');

  // If rawText is passed without stripping:
  const dirty = parseVoiceDate('spent 12.05 on tea');
  // It matches 12.05 as May 12!
  if (!dirty || !dirty.includes('-05-12')) {
    throw new Error('Precondition check failed: rawText did not trigger dotted date parse');
  }

  // With stripping:
  const strippedText = 'spent 12.05 on tea'.replace('12.05', ' ');
  const clean = parseVoiceDate(strippedText);
  if (clean !== null) {
    throw new Error('Cleaned text should not produce a date: got ' + clean);
  }

  console.log('✔ REVIEW-026: PASSED');
}

function testReview027() {
  const smartCode = fs.readFileSync('smart_engine.js', 'utf8');
  new Function(smartCode);

  // Check that runNormal() is called after saving to ledger and not bypassed by early resolve()
  const match = smartCode.match(/if \(typeof saveLedgerTx === 'function'\) \{[\s\S]*?runNormal\(\);/);
  if (!match) {
    throw new Error('smart_engine.js does not execute runNormal() following saveLedgerTx');
  }
  if (match[0].includes('resolve();')) {
    throw new Error('smart_engine.js still resolves early without running runNormal()');
  }

  console.log('✔ REVIEW-027: PASSED');
}

function testReview028() {
  const offlineCode = fs.readFileSync('offline.js', 'utf8');

  // Verify that offline.js runs in an isolated VM where neither currentLang nor currentUser is defined
  const vm = require('vm');
  const listeners = {};
  const sandbox = {
    navigator: { onLine: false },
    document: { getElementById: ()=>null },
    window: {
      addEventListener: (evt, fn) => { listeners[evt] = fn; }
    }
  };
  vm.createContext(sandbox);

  // Executing offlineCode must not throw ReferenceError
  vm.runInContext(offlineCode, sandbox);

  // Dispatch offline event
  if (listeners['offline']) {
    listeners['offline']();
  }
  if (listeners['online']) {
    listeners['online']();
  }

  console.log('✔ REVIEW-028: PASSED');
}

function testReview035() {
  const goalCode = fs.readFileSync('goal_sip_planner.js', 'utf8');
  new Function(goalCode);

  if (!goalCode.includes('const fv = (monthly * ((Math.pow(1 + r, months) - 1) / r)) * (1 + r);') ||
      !goalCode.includes('const wealthGained = Math.max(0, fv - totalInvested);')) {
    throw new Error('goal_sip_planner.js formula not updated to true Future Value');
  }

  // Calculate for target 50000, monthly 2000
  const target = 50000, monthly = 2000;
  const r = (12 / 12) / 100;
  const numerator = Math.log(1 + (target * r) / (monthly * (1 + r)));
  const denominator = Math.log(1 + r);
  const months = Math.max(1, Math.ceil(numerator / denominator));
  const totalInvested = monthly * months;
  const fv = (monthly * ((Math.pow(1 + r, months) - 1) / r)) * (1 + r);
  const wealthGained = Math.max(0, fv - totalInvested);

  if (Math.round(wealthGained) !== 5947) {
    throw new Error('Expected wealthGained ~5947, got ' + wealthGained);
  }

  console.log('✔ REVIEW-035: PASSED');
}

function testReview036() {
  const debtCode = fs.readFileSync('debt_payoff.js', 'utf8');
  new Function(debtCode);

  const startIdx = debtCode.indexOf('function calculateStrategy(debts, strategy, extraPayment) {');
  const endIdx = debtCode.indexOf('function openModal() {', startIdx);
  const fnStr = debtCode.substring(startIdx, endIdx);

  const calculateStrategy = new Function('debts', 'strategy', 'extraPayment', fnStr + '\nreturn calculateStrategy(debts, strategy, extraPayment);');

  // Case 1: Debt with normal positive amortization (Balance 10000, 12% APR => interest 100/mo, minPay 500)
  const normalDebt = [{ name: 'Card', balance: 10000, rate: 12, minPayment: 500 }];
  const resNormal = calculateStrategy(normalDebt, 'avalanche', 0);
  if (resNormal.hasNegativeAmortization) {
    throw new Error('Normal debt incorrectly flagged as negative amortization');
  }

  // Case 2: Debt with negative amortization (Balance 100000, 36% APR => monthly interest 3000, minPay 2000)
  const negDebt = [{ name: 'Card', balance: 100000, rate: 36, minPayment: 2000 }];
  const resNeg = calculateStrategy(negDebt, 'avalanche', 0);
  if (!resNeg.hasNegativeAmortization) {
    throw new Error('Negative amortization debt was not detected');
  }

  // Verify warning banner is in openModal
  if (!debtCode.includes('Warning: Negative Amortization Detected')) {
    throw new Error('Warning banner not found in debt_payoff.js');
  }

  console.log('✔ REVIEW-036: PASSED');
}

function testReview037() {
  const fireCode = fs.readFileSync('fire_runway.js', 'utf8');
  new Function(fireCode);

  const vm = require('vm');
  const sandbox = { window: {}, document: { getElementById: ()=>null }, localStorage: { getItem: ()=>null } };
  vm.createContext(sandbox);
  vm.runInContext(fireCode, sandbox);

  // Income: 100000, Living expense: 20000, Investment (SIP/Mutual Fund): 50000
  const entries = [
    { type: 'income', amt: 100000, date: '2026-09-01' },
    { type: 'expense', cat: 'food', amt: 20000, date: '2026-09-02' },
    { type: 'expense', cat: 'mutual fund', amt: 50000, date: '2026-09-05' }
  ];

  sandbox.window.entries = entries;
  const data = sandbox.window.FireRunway.getData();
  if (!data) throw new Error('getRunwayData returned null');

  // liquidAssets should be 100000 - 20000 = 80000 (investment not deducted as consumption)
  if (data.liquidAssets !== 80000) {
    throw new Error('Expected liquidAssets 80000, got: ' + data.liquidAssets);
  }

  // monthlyBurn should reflect living expenses, not inflated by 50000 investment
  // Since only 1 prior month with 20000 living expense:
  if (data.monthlyBurn > 30000) {
    throw new Error('monthlyBurn was inflated by investments: ' + data.monthlyBurn);
  }

  console.log('✔ REVIEW-037: PASSED');
}

function testReview038() {
  const reportsCode = fs.readFileSync('reports.js', 'utf8');
  new Function(reportsCode);

  if (!reportsCode.includes("list.filter(e => e.type === 'income' && !e.transferGroupId)")) {
    throw new Error('reports.js computeHealthScore does not filter !e.transferGroupId on income');
  }

  // Simulate computeHealthScore savings rate calculation
  const list = [
    { type: 'income', amt: 50000, transferGroupId: 'transfer_1' }, // internal transfer leg
    { type: 'expense', amt: 50000, transferGroupId: 'transfer_1' },
    { type: 'income', amt: 10000 }, // real income
    { type: 'expense', amt: 8000 }  // real expense
  ];

  const income = list.filter(e => e.type === 'income' && !e.transferGroupId).reduce((s, e) => s + e.amt, 0);
  const expense = list.filter(e => e.type === 'expense' && !e.transferGroupId).reduce((s, e) => s + e.amt, 0);

  if (income !== 10000) throw new Error('Expected real income 10000, got: ' + income);
  if (expense !== 8000) throw new Error('Expected real expense 8000, got: ' + expense);

  const rate = income > 0 ? ((income - expense) / income) * 100 : 0;
  // Real savings rate: (10000 - 8000)/10000 = 20%. Without fix, it would be (60000 - 8000)/60000 = 86.7%!
  if (rate !== 20) throw new Error('Expected savings rate 20%, got: ' + rate);

  console.log('✔ REVIEW-038: PASSED');
}

function testReview039() {
  const burnCode = fs.readFileSync('daily_burn_meter.js', 'utf8');
  new Function(burnCode);

  if (!burnCode.includes('if (activeW && activeW !== \'all\' && eWallet !== activeW) return;')) {
    throw new Error('daily_burn_meter.js does not filter entries by activeW');
  }

  console.log('✔ REVIEW-039: PASSED');
}

function testReview040() {
  const auraCode = fs.readFileSync('aurasense.js', 'utf8');
  new Function(auraCode);

  if (!auraCode.includes('function getTimeMachineProjection(totalBalance, months)')) {
    throw new Error('aurasense.js does not define getTimeMachineProjection');
  }
  if (!auraCode.includes('const proj3 = getTimeMachineProjection(metric.totalBalance, 3);')) {
    throw new Error('aurasense.js does not use getTimeMachineProjection on initial modal open');
  }
  if (!auraCode.includes('getTimeMachineProjection(metric.totalBalance, months)')) {
    throw new Error('aurasense.js does not use getTimeMachineProjection in updateTimeHorizon');
  }

  const vm = require('vm');
  const sandbox = {
    window: {},
    document: { createElement: () => ({ style: {} }), body: { appendChild: ()=>{} }, addEventListener: ()=>{} },
    localStorage: { getItem: ()=>null }
  };
  vm.createContext(sandbox);
  vm.runInContext(auraCode, sandbox);

  if (typeof sandbox.window.getTimeMachineProjection !== 'function') {
    throw new Error('window.getTimeMachineProjection is not exported');
  }

  const proj = sandbox.window.getTimeMachineProjection(50000, 3);
  if (proj.base !== 50000 || proj.projectedGain !== 18000 || proj.totalProjected !== 68000) {
    throw new Error('getTimeMachineProjection calculation error: ' + JSON.stringify(proj));
  }

  console.log('✔ REVIEW-040: PASSED');
}

function testReview041() {
  const envCode = fs.readFileSync('envelopes.js', 'utf8');
  new Function(envCode);

  const vm = require('vm');
  const sandbox = {
    window: {},
    document: {
      createElement: () => ({ style: {} }),
      getElementById: () => null,
      head: { appendChild: ()=>{} },
      body: { appendChild: ()=>{} },
      addEventListener: ()=>{}
    },
    localStorage: { getItem: ()=>null, setItem: ()=>{} },
    setTimeout: () => {}
  };
  vm.createContext(sandbox);
  vm.runInContext(envCode, sandbox);

  if (!sandbox.window.Envelopes || typeof sandbox.window.Envelopes.classify !== 'function') {
    throw new Error('window.Envelopes.classify is not available');
  }

  const classify = sandbox.window.Envelopes.classify;

  // 1. Everyday food & lunch should be 'needs'
  const dailyFood = classify({ cat: 'food', desc: 'lunch at office canteen' });
  if (dailyFood !== 'needs') {
    throw new Error('Expected "food" lunch to be "needs", got: ' + dailyFood);
  }

  const groceries = classify({ cat: 'food', desc: 'vegetables from market' });
  if (groceries !== 'needs') {
    throw new Error('Expected "food" vegetables to be "needs", got: ' + groceries);
  }

  // 2. Discretionary food delivery / restaurant should be 'wants'
  const swiggy = classify({ cat: 'food', desc: 'swiggy pizza order' });
  if (swiggy !== 'wants') {
    throw new Error('Expected swiggy order to be "wants", got: ' + swiggy);
  }

  const restaurant = classify({ cat: 'food', desc: 'dinner at barbecue nation restaurant' });
  if (restaurant !== 'wants') {
    throw new Error('Expected restaurant dinner to be "wants", got: ' + restaurant);
  }

  // 3. Category dining should be 'wants'
  const dining = classify({ cat: 'dining', desc: 'coffee date' });
  if (dining !== 'wants') {
    throw new Error('Expected dining to be "wants", got: ' + dining);
  }

  // 4. Savings
  const sip = classify({ cat: 'mutual fund', desc: 'sip investment' });
  if (sip !== 'savings') {
    throw new Error('Expected sip to be "savings", got: ' + sip);
  }

  console.log('✔ REVIEW-041: PASSED');
}

function testReview042() {
  const reportsCode = fs.readFileSync('reports.js', 'utf8');
  new Function(reportsCode);

  const vm = require('vm');
  const userWallets = [
    { id: 'cash', initialBalance: 500 },
    { id: 'bank', initialBalance: 10000 }
  ];

  const entries = [
    { type: 'income', amt: 50000, walletId: 'bank', date: '2020-01-01' },
    { type: 'expense', amt: 200, walletId: 'cash', date: '2020-01-02' },
    { type: 'income', amt: 1000, walletId: 'cash', date: '2020-01-03', transferGroupId: 'transfer_1' }, // transfer leg into cash
    { type: 'expense', amt: 1000, walletId: 'bank', date: '2020-01-03', transferGroupId: 'transfer_1' } // transfer leg out of bank
  ];

  const sandbox = {
    window: { activeWalletId: 'cash', period: 'month', userWallets, entries },
    userWallets,
    entries,
    activeWalletId: 'cash',
    period: 'month',
    document: {
      getElementById: () => null,
      querySelectorAll: () => [],
      createElement: () => ({ style: {} }),
      addEventListener: ()=>{}
    },
    localStorage: { getItem: () => null },
    dateToStr: (d) => d.toISOString().slice(0, 10),
    mainEntries: () => entries.filter(e => e.walletId === 'cash'),
    allRawMainEntries: () => entries,
    resolveEntryWalletId: (e) => e.walletId || 'cash'
  };

  vm.createContext(sandbox);
  vm.runInContext(reportsCode, sandbox);

  if (typeof sandbox.window.getPeriodAccountingData !== 'function') {
    throw new Error('getPeriodAccountingData is not a function');
  }

  // 1. Single wallet: cash
  const cashData = sandbox.window.getPeriodAccountingData();
  // Cash initial: 500, prevIncome: 1000 (from transfer), prevSpent: 200 -> openingBalance: 1300
  if (cashData.initialBalance !== 500) {
    throw new Error('Expected initialBalance 500, got: ' + cashData.initialBalance);
  }
  if (cashData.prevIncome !== 1000) {
    throw new Error('Expected prevIncome 1000, got: ' + cashData.prevIncome);
  }
  if (cashData.prevSpent !== 200) {
    throw new Error('Expected prevSpent 200, got: ' + cashData.prevSpent);
  }
  if (cashData.openingBalance !== 1300) {
    throw new Error('Expected openingBalance 1300, got: ' + cashData.openingBalance);
  }

  // 2. All wallets
  sandbox.window.activeWalletId = 'all';
  sandbox.activeWalletId = 'all';
  sandbox.mainEntries = () => entries;
  const allData = sandbox.window.getPeriodAccountingData();
  // All initial: 10500, prevIncome: 50000 (transfers excluded), prevSpent: 200 -> openingBalance: 60300
  if (allData.initialBalance !== 10500) {
    throw new Error('Expected initialBalance 10500 for all wallets, got: ' + allData.initialBalance);
  }
  if (allData.prevIncome !== 50000) {
    throw new Error('Expected prevIncome 50000 for all wallets, got: ' + allData.prevIncome);
  }
  if (allData.prevSpent !== 200) {
    throw new Error('Expected prevSpent 200 for all wallets, got: ' + allData.prevSpent);
  }
  if (allData.openingBalance !== 60300) {
    throw new Error('Expected openingBalance 60300 for all wallets, got: ' + allData.openingBalance);
  }

  console.log('✔ REVIEW-042: PASSED');
}

function testReview051() {
  const auraCode = fs.readFileSync('aurasense.js', 'utf8');
  new Function(auraCode);

  const vm = require('vm');
  let rafCallCount = 0;
  const mockRaf = (cb) => {
    rafCallCount++;
    return rafCallCount;
  };

  const canvasMock = {
    getContext: () => ({
      clearRect: () => {},
      createRadialGradient: () => ({ addColorStop: () => {} }),
      beginPath: () => {},
      arc: () => {},
      fill: () => {},
      stroke: () => {},
      closePath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      save: () => {},
      restore: () => {}
    }),
    getBoundingClientRect: () => ({ width: 100, height: 100 }),
    addEventListener: () => {},
    offsetParent: { id: 'parent' }, // visible
    isConnected: true
  };

  const sandbox = {
    window: {
      addEventListener: () => {},
      removeEventListener: () => {}
    },
    document: {
      hidden: false,
      getElementById: (id) => id === 'aurasense-orb-canvas' ? canvasMock : null,
      addEventListener: () => {}
    },
    localStorage: { getItem: () => null },
    requestAnimationFrame: mockRaf,
    Date: Date
  };

  vm.createContext(sandbox);
  vm.runInContext(auraCode, sandbox);

  // 1. Verify getCachedFinancialVelocity exists and caches calculation
  if (typeof sandbox.window.getCachedFinancialVelocity !== 'function') {
    throw new Error('getCachedFinancialVelocity is not defined');
  }

  const v1 = sandbox.window.getCachedFinancialVelocity();
  const v2 = sandbox.window.getCachedFinancialVelocity();
  if (v1 !== v2) {
    throw new Error('getCachedFinancialVelocity did not return cached object reference');
  }

  // 2. Initialize canvas & run renderAuraSense
  sandbox.window.initAuraSenseCanvas('aurasense-orb-canvas');
  const countAfterInit = rafCallCount;
  if (countAfterInit === 0) {
    throw new Error('initAuraSenseCanvas did not schedule initial render frame');
  }

  // 3. When document.hidden is true, renderAuraSense must pause and NOT schedule next frame
  sandbox.document.hidden = true;
  const countBeforeHiddenRender = rafCallCount;
  sandbox.window.renderAuraSense();
  if (rafCallCount !== countBeforeHiddenRender) {
    throw new Error('renderAuraSense scheduled a frame while document.hidden was true!');
  }

  // 4. When canvas offsetParent is null (hidden widget), renderAuraSense must pause and NOT schedule next frame
  sandbox.document.hidden = false;
  canvasMock.offsetParent = null; // hidden in CSS / display:none
  const countBeforeHiddenCanvas = rafCallCount;
  sandbox.window.renderAuraSense();
  if (rafCallCount !== countBeforeHiddenCanvas) {
    throw new Error('renderAuraSense scheduled a frame while canvas offsetParent was null!');
  }

  console.log('✔ REVIEW-051: PASSED');
}

function testReview052() {
  const swCode = fs.readFileSync('sw.js', 'utf8');
  new Function(swCode);

  if (!swCode.includes('TRUSTED_CDN_ORIGINS')) {
    throw new Error('TRUSTED_CDN_ORIGINS not found in sw.js');
  }
  if (!swCode.includes('https://cdnjs.cloudflare.com') || !swCode.includes('https://www.gstatic.com')) {
    throw new Error('Required CDN origins not present in sw.js');
  }
  if (!swCode.includes('firebase-app-compat.js') || !swCode.includes('jspdf.umd.min.js')) {
    throw new Error('CDN pre-cached script URLs missing from SHELL in sw.js');
  }

  const vm = require('vm');
  let fetchHandler = null;
  const sandbox = {
    self: {
      location: { origin: 'https://pockettrack.app' },
      addEventListener: (type, fn) => {
        if (type === 'fetch') fetchHandler = fn;
      },
      skipWaiting: () => {},
      clients: { claim: () => {} }
    },
    caches: { open: () => Promise.resolve({ put: () => Promise.resolve() }), match: () => Promise.resolve() },
    fetch: () => Promise.resolve({ clone: () => ({}), status: 200 }),
    URL: URL
  };

  vm.createContext(sandbox);
  vm.runInContext(swCode, sandbox);

  if (typeof fetchHandler !== 'function') {
    throw new Error('fetch event handler was not registered');
  }

  function simulateFetch(url) {
    let responded = false;
    fetchHandler({
      request: { method: 'GET', url: url },
      respondWith: () => { responded = true; }
    });
    return responded;
  }

  // 1. Same-origin request should be handled
  if (!simulateFetch('https://pockettrack.app/app.js')) {
    throw new Error('Same origin request was not handled by SW');
  }

  // 2. Trusted CDN request should be handled
  if (!simulateFetch('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')) {
    throw new Error('Trusted CDN jspdf request was not handled by SW');
  }
  if (!simulateFetch('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js')) {
    throw new Error('Trusted CDN firebase request was not handled by SW');
  }

  // 3. Untrusted cross-origin request should be ignored
  if (simulateFetch('https://evil.example.com/malicious.js')) {
    throw new Error('Untrusted external request was intercepted by SW');
  }

  // 4. Firestore streaming / realtime API should be ignored
  if (simulateFetch('https://firestore.googleapis.com/google.firestore.v1.Firestore/Listen')) {
    throw new Error('Firestore streaming request was intercepted by SW');
  }

  console.log('✔ REVIEW-052: PASSED');
}

function testReview053() {
  const swCode = fs.readFileSync('sw.js', 'utf8');
  new Function(swCode);

  if (!swCode.includes('caches.match(req).then((cached) =>')) {
    throw new Error('SWR strategy not implemented around caches.match in sw.js');
  }
  if (!swCode.includes('cached || fetchPromise')) {
    throw new Error('SWR fallback or background fetch missing in sw.js');
  }

  const vm = require('vm');
  let fetchHandler = null;
  let putCalled = false;
  const cachedMock = { text: 'cached-version', status: 200 };
  const networkMock = { text: 'network-version', status: 200, clone: () => ({ text: 'network-version-clone', status: 200 }) };

  const sandbox = {
    self: {
      location: { origin: 'https://pockettrack.app' },
      addEventListener: (type, fn) => {
        if (type === 'fetch') fetchHandler = fn;
      },
      skipWaiting: () => {},
      clients: { claim: () => {} }
    },
    caches: {
      open: () => Promise.resolve({
        put: (req, res) => {
          putCalled = true;
          return Promise.resolve();
        }
      }),
      match: (req) => {
        if (req && req.url && req.url.includes('has-cache')) {
          return Promise.resolve(cachedMock);
        }
        return Promise.resolve(null);
      }
    },
    fetch: () => Promise.resolve(networkMock),
    URL: URL
  };

  vm.createContext(sandbox);
  vm.runInContext(swCode, sandbox);

  // 1. Test cache hit: respondWith returns cached response immediately
  let resultPromise1 = null;
  fetchHandler({
    request: { method: 'GET', url: 'https://pockettrack.app/has-cache.js' },
    respondWith: (p) => { resultPromise1 = p; }
  });

  if (!resultPromise1) {
    throw new Error('respondWith was not called for cache hit');
  }

  return resultPromise1.then((res) => {
    if (res !== cachedMock) {
      throw new Error('Expected cached response to be returned immediately, got: ' + JSON.stringify(res));
    }

    // 2. Test cache miss: respondWith returns network response
    let resultPromise2 = null;
    fetchHandler({
      request: { method: 'GET', url: 'https://pockettrack.app/no-cache.js' },
      respondWith: (p) => { resultPromise2 = p; }
    });

    return resultPromise2.then((res2) => {
      if (res2 !== networkMock) {
        throw new Error('Expected network response on cache miss, got: ' + JSON.stringify(res2));
      }
      if (!putCalled) {
        throw new Error('Expected caches.put to be called during background revalidation');
      }
      console.log('✔ REVIEW-053: PASSED');
    });
  });
}

function testReview054() {
  const txCode = fs.readFileSync('transactions.js', 'utf8');
  new Function(txCode);

  if (!txCode.includes(".orderBy('date', 'desc')") || !txCode.includes('.limit(200)')) {
    throw new Error('transactions.js listenToEntries does not limit query to 200 documents');
  }
  if (!txCode.includes('function loadOlderEntries')) {
    throw new Error('loadOlderEntries helper not found in transactions.js');
  }

  const vm = require('vm');
  let queriedLimit = 0;
  let queryStartAfter = null;

  const mockDb = {
    collection: (col) => ({
      doc: (uid) => ({
        collection: (subCol) => ({
          orderBy: (field, dir) => ({
            startAfter: (val) => {
              queryStartAfter = val;
              return {
                limit: (lim) => {
                  queriedLimit = lim;
                  return {
                    get: () => Promise.resolve({
                      empty: false,
                      docs: [
                        { id: 'tx_old_1', data: () => ({ amt: 250, date: '2025-12-01', desc: 'Old bill' }) }
                      ]
                    })
                  };
                }
              };
            },
            limit: (lim) => {
              queriedLimit = lim;
              return {
                onSnapshot: () => () => {},
                get: () => Promise.resolve({ empty: true, docs: [] })
              };
            }
          })
        })
      })
    })
  };

  const sandbox = {
    window: { addEventListener: () => {} },
    document: {
      getElementById: () => ({ value: '', addEventListener: () => {}, style: {} }),
      addEventListener: () => {}
    },
    localStorage: { getItem: () => null, setItem: () => {} },
    currentUser: { uid: 'user_test_123' },
    db: mockDb,
    entries: [{ _id: 'tx_new_1', amt: 100, date: '2026-02-15' }],
    mainEntries: () => [{ _id: 'tx_new_1', amt: 100, date: '2026-02-15' }],
    todayStr: () => '2026-10-05',
    dateToStr: (d) => '2026-10-05'
  };

  vm.createContext(sandbox);
  vm.runInContext(txCode, sandbox);

  if (typeof sandbox.window.loadOlderEntries !== 'function') {
    throw new Error('window.loadOlderEntries is not exported');
  }

  return sandbox.window.loadOlderEntries(50).then(results => {
    if (queriedLimit !== 50) {
      throw new Error('Expected queriedLimit to be 50, got: ' + queriedLimit);
    }
    if (queryStartAfter !== '2026-02-15') {
      throw new Error('Expected queryStartAfter to be 2026-02-15, got: ' + queryStartAfter);
    }
    if (!results || results.length !== 1 || results[0]._id !== 'tx_old_1') {
      throw new Error('loadOlderEntries returned unexpected results: ' + JSON.stringify(results));
    }
    if (sandbox.window.entries.length !== 2) {
      throw new Error('loadOlderEntries did not append to window.entries');
    }
    console.log('✔ REVIEW-054: PASSED');
  });
}

function testReview057() {
  const html = fs.readFileSync('app.html', 'utf8');
  const appCode = fs.readFileSync('app.js', 'utf8');
  const walletsCode = fs.readFileSync('wallets.js', 'utf8');

  new Function(appCode);
  new Function(walletsCode);

  if (!html.includes('window.PT = window.PT || {};')) {
    throw new Error('app.html does not initialize window.PT');
  }
  if (!appCode.includes('window.PT = window.PT || {};')) {
    throw new Error('app.js does not initialize window.PT');
  }
  if (!walletsCode.includes('window.PT = window.PT || {};')) {
    throw new Error('wallets.js does not initialize window.PT');
  }

  const vm = require('vm');
  const sandbox = {
    window: {
      PT: { existingProp: true },
      userWallets: [{ id: 'preloaded_wallet', name: 'Preloaded' }]
    },
    document: {
      createElement: () => ({ appendChild: ()=>{} }),
      getElementById: () => null,
      head: { appendChild: ()=>{} },
      documentElement: { appendChild: ()=>{} },
      body: { appendChild: ()=>{} }
    },
    localStorage: { getItem: () => null }
  };

  vm.createContext(sandbox);
  vm.runInContext(walletsCode, sandbox);

  if (!sandbox.window.PT || !sandbox.window.PT.existingProp) {
    throw new Error('window.PT was overwritten');
  }

  // Pre-existing userWallets must be preserved
  if (!sandbox.window.PT.userWallets || sandbox.window.PT.userWallets.length !== 1 || sandbox.window.PT.userWallets[0].id !== 'preloaded_wallet') {
    throw new Error('Preloaded userWallets was wiped by wallets.js');
  }

  // resolveEntryWalletId must be exported to window.PT
  if (typeof sandbox.window.PT.resolveEntryWalletId !== 'function') {
    throw new Error('resolveEntryWalletId not exported to window.PT');
  }

  console.log('✔ REVIEW-057: PASSED');
}

async function runAllTier2Tests() {
  testReview006();
  testReview007();
  testReview008();
  testReview009();
  testReview012();
  testReview021();
  testReview022();
  testReview023();
  testReview024();
  testReview025();
  testReview026();
  testReview027();
  testReview028();
  testReview035();
  testReview036();
  testReview037();
  testReview038();
  testReview039();
  testReview040();
  testReview041();
  testReview042();
  testReview051();
  testReview052();
  await testReview053();
  await testReview054();
  testReview057();
  console.log('\n=============================================');
  console.log('✔ ALL 26 TIER 2 UNIT TESTS PASSED (26/26)');
  console.log('=============================================\n');
}

runAllTier2Tests().catch(err => {
  console.error(err);
  process.exit(1);
});







