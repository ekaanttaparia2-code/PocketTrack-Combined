/**
 * PocketTrack — Tier 2 Adversarial Stress Test & Challenger Verification Suite
 *
 * EMPIRICAL CHALLENGER: challenger_t2
 * Verification across 5 dimensions:
 * 1. Security: escapeHTML 5-char entity escaping, prompt modal & data-* attribute breakout resistance
 * 2. Offline QR: Reed-Solomon SVG QR generator offline purity & payload fuzzing (zero network calls)
 * 3. Session Storage: User-namespaced localStorage keys, tenant isolation, and purgeUserLocalStorage()
 * 4. Calculations:
 *    - Settlement zero-sum closure (sum == 0.00) with fractional cents & removed payers
 *    - Voice parser: years (2020-2035), 10-digit phone numbers, and decimal paise dates
 *    - Smart Intercept dual-legged recording & fallback resilience
 *    - Goal SIP annuity-due Future Value & wealth gained calculation
 *    - Negative amortization warning detection & UI banner condition
 *    - FIRE runway living burn exclusion of capital/investment assets
 *    - Reports health score transfer exclusion on income & expense
 *    - Daily burn meter single-wallet spend scoping
 *    - AuraSense Time Machine 3-month projection alignment
 *    - Envelopes 50/30/20 category map: basic food as Needs vs luxury dining as Wants
 * 5. Performance & SW:
 *    - AuraSense requestAnimationFrame pause on document.hidden / canvas detachment
 *    - Service Worker SWR caching, shell asset list, and TRUSTED_CDN_ORIGINS isolation
 *    - transactions.js .limit(200) query bounding and loadOlderEntries pagination
 *    - window.PT shared namespace container integrity
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const http = require('http');
const https = require('https');

// Terminal formatting
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failureDetails = [];

function runTest(category, name, testFn) {
  totalTests++;
  const label = `[${category}] ${name}`;
  try {
    testFn();
    passedTests++;
    console.log(`  ${GREEN}✓ PASS${RESET} ${label}`);
  } catch (err) {
    failedTests++;
    failureDetails.push({ category, name, error: err });
    console.log(`  ${RED}✗ FAIL${RESET} ${BOLD}${label}${RESET}`);
    console.log(`    ${RED}Reason: ${err.message}${RESET}`);
    if (err.stack) {
      const firstStack = err.stack.split('\n').slice(1, 4).join('\n');
      console.log(`    ${firstStack}`);
    }
  }
}

console.log(`${BOLD}${CYAN}================================================================${RESET}`);
console.log(`${BOLD}${CYAN}   POCKETTRACK TIER 2 ADVERSARIAL CHALLENGER VERIFICATION SUITE   ${RESET}`);
console.log(`${BOLD}${CYAN}================================================================${RESET}\n`);

// ─────────────────────────────────────────────────────────────────────────────
// 1. SECURITY & XSS ATTRIBUTE BREAKOUT TESTING
// ─────────────────────────────────────────────────────────────────────────────
console.log(`${BOLD}1. Security & Attribute Breakout Resistance${RESET}`);

const appJsCode = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

// Load escapeHTML in isolated VM
const escapeMatch = appJsCode.match(/function escapeHTML\(str\)\{[\s\S]*?\n\}/);
assert(escapeMatch, 'escapeHTML definition must exist in app.js');
let escapeHTML;
eval(`escapeHTML = ${escapeMatch[0]};`);

runTest('Security', 'escapeHTML properly sanitizes all 5 HTML-sensitive characters (&, <, >, ", \')', () => {
  assert.strictEqual(typeof escapeHTML, 'function', 'escapeHTML should be a defined function');
  
  const raw = `& < > " '`;
  const escaped = escapeHTML(raw);
  assert.strictEqual(escaped, `&amp; &lt; &gt; &quot; &#39;`);
  
  // Mixed / concatenated test
  assert.strictEqual(escapeHTML(`"><script>alert('xss')</script>`), `&quot;&gt;&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;`);
  assert.strictEqual(escapeHTML(`" onfocus="alert(1)"`), `&quot; onfocus=&quot;alert(1)&quot;`);
  assert.strictEqual(escapeHTML(`' onmouseover='alert(1)'`), `&#39; onmouseover=&#39;alert(1)&#39;`);
  assert.strictEqual(escapeHTML(`a & b < c > d " e ' f`), `a &amp; b &lt; c &gt; d &quot; e &#39; f`);

  // Null, undefined, empty, number resilience
  assert.strictEqual(escapeHTML(null), '');
  assert.strictEqual(escapeHTML(undefined), '');
  assert.strictEqual(escapeHTML(''), '');
  assert.strictEqual(escapeHTML(12345), '12345');
  assert.strictEqual(escapeHTML(0), '0');
  assert.strictEqual(escapeHTML(false), 'false');
});

runTest('Security', 'showAppPrompt modal input attribute breakout resistance', () => {
  const elements = {};
  const mockDom = {
    getElementById: (id) => {
      if (!elements[id]) {
        elements[id] = {
          id,
          style: {},
          textContent: '',
          innerHTML: '',
          value: '',
          focus: () => {}
        };
      }
      return elements[id];
    },
    querySelectorAll: () => []
  };

  const promptMatch = appJsCode.match(/function showAppPrompt\(message, defaultValue, onConfirm, title\)\{[\s\S]*?\n\}/);
  assert(promptMatch, 'showAppPrompt definition must exist in app.js');
  const promptSandbox = {
    window: { PT: {} },
    document: mockDom,
    currentLang: 'en',
    closeAppModal: () => {},
    setTimeout: (fn) => fn(),
    escapeHTML: escapeHTML
  };
  vm.createContext(promptSandbox);
  vm.runInContext(`${promptMatch[0]}; window.showAppPrompt = showAppPrompt;`, promptSandbox);

  const testPayloads = [
    `" onfocus="alert('XSS_FOCUS')" autofocus="`,
    `"><script>window._xssFired=true;</script>`,
    `" style="display:none" data-x="`,
    `' onmouseover='alert("XSS_MOUSE")'`,
    `&quot; onkeydown=&quot;alert(1)&quot;`,
    `<img src=x onerror=alert('IMG')>`
  ];

  for (const payload of testPayloads) {
    promptSandbox.window.showAppPrompt('Please enter your name:', payload, () => {}, 'Test Prompt');
    const messageHtml = elements['app-modal-message'].innerHTML;

    // Verify input value attribute does NOT break out of value="..."
    // In unescaped code, a double quote closes value and starts new attributes.
    // In escaped code, value="${escapeHTML(...)}" will contain &quot; and NEVER an unescaped "
    const inputMatch = messageHtml.match(/<input[^>]+id="app-prompt-input"[^>]*>/);
    assert(inputMatch, 'Input element must exist in generated modal HTML');
    const inputTag = inputMatch[0];

    // Check that no executable attributes were injected into the <input> element tag itself (outside value)
    const outsideValue = inputTag.replace(/value="[^"]*"/, '');
    assert(!/\b(onfocus|onmouseover|onerror|onload)\s*=/i.test(outsideValue), `Tag should not contain unescaped injected event handler outside value: ${inputTag}`);
    assert(!outsideValue.includes('<script>'), `Tag should not contain unescaped script tag: ${inputTag}`);
    assert(!outsideValue.includes('<img'), `Tag should not contain unescaped img tag: ${inputTag}`);
    
    // Check that the payload double quotes were replaced with &quot;
    if (payload.includes('"')) {
      assert(inputTag.includes('&quot;'), `Double quotes in value must be converted to &quot;: ${inputTag}`);
    }
  }
});

runTest('Security', 'Inline data-* attribute handlers in shared_portfolios, upi_qr_generator, and app.js', () => {
  const sharedCode = fs.readFileSync(path.join(__dirname, '..', 'shared_portfolios.js'), 'utf8');
  const upiCode = fs.readFileSync(path.join(__dirname, '..', 'upi_qr_generator.js'), 'utf8');
  
  // 1. shared_portfolios: contactChipsHtml
  // Must use data-name="${escapeHTML(c.name)}" and this.dataset.name, NOT onclick="...('${c.name}')"
  assert(
    sharedCode.includes('data-name="${escapeHTML(c.name)}" onclick="addContactToSpaceMembers(this.dataset.name)"'),
    'shared_portfolios.js must pass contact name via data-name and read via this.dataset.name'
  );
  assert(
    !sharedCode.includes('addContactToSpaceMembers(\'${'),
    'shared_portfolios.js must not interpolate raw string into inline function call'
  );

  // 2. upi_qr_generator: edit and setup modal buttons
  assert(
    upiCode.includes('data-amount="${Number(amount) || 0}" data-note="${escapeHTML(note)}" onclick="openUpiSetupModal(Number(this.dataset.amount), this.dataset.note)"'),
    'upi_qr_generator.js edit button must pass data-amount and data-note via dataset'
  );
  assert(
    upiCode.includes('data-amount="${Number(amount) || 0}" data-note="${escapeHTML(note)}" onclick="saveUpiIdFromSetup(Number(this.dataset.amount), this.dataset.note)"'),
    'upi_qr_generator.js save button must pass data-amount and data-note via dataset'
  );

  // 3. app.js: custom income/expense category edit & delete buttons
  assert(
    appJsCode.includes('data-name="${escapeHTML(name)}" onclick="startEditCustomOption(this.dataset.name)"'),
    'app.js must pass custom option name via data-name and read via this.dataset.name on edit'
  );
  assert(
    appJsCode.includes('data-name="${escapeHTML(name)}" onclick="confirmDeleteCustomOption(this.dataset.name)"'),
    'app.js must pass custom option name via data-name and read via this.dataset.name on delete'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. OFFLINE QR GENERATION ROBUSTNESS & ZERO NETWORK CALLS
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${BOLD}2. Offline QR Generator Robustness & Network Isolation${RESET}`);

const upiJsCode = fs.readFileSync(path.join(__dirname, '..', 'upi_qr_generator.js'), 'utf8');

runTest('Offline QR', 'Verify zero network calls & complete absence of external QR services', () => {
  // Confirm api.qrserver.com or any external QR endpoint is completely deleted from codebase
  assert(!upiJsCode.includes('api.qrserver.com'), 'upi_qr_generator.js must not contain any reference to api.qrserver.com');
  assert(!upiJsCode.includes('chart.googleapis.com'), 'upi_qr_generator.js must not contain any Google Chart QR URL');
  assert(!upiJsCode.includes('qrcode-monkey.com'), 'upi_qr_generator.js must not contain third-party QR URLs');

  // Intercept all network traffic during QR generation
  let networkCalls = 0;
  const originalHttp = http.request;
  const originalHttps = https.request;
  http.request = function() { networkCalls++; throw new Error('Network call attempted during QR generation!'); };
  https.request = function() { networkCalls++; throw new Error('Network call attempted during QR generation!'); };

  try {
    const qrSandbox = {
      window: { PT: {} },
      document: {
        createElement: () => ({ setAttribute: () => {}, style: {}, appendChild: () => {} }),
        head: { appendChild: () => {} }
      },
      localStorage: { getItem: () => 'test@okhdfcbank' },
      fetch: () => { networkCalls++; throw new Error('fetch attempted!'); },
      XMLHttpRequest: function() { networkCalls++; throw new Error('XHR attempted!'); }
    };
    vm.createContext(qrSandbox);
    vm.runInContext(upiJsCode, qrSandbox);

    const generateSvg = qrSandbox.window.generateUpiQrSvg;
    assert.strictEqual(typeof generateSvg, 'function', 'generateUpiQrSvg must be exposed on window');

    // Test a variety of UPI payloads:
    const payloads = [
      'upi://pay?pa=9876543210@paytm&pn=John Doe&am=150.00&cu=INR',
      'upi://pay?pa=ekaant.taparia@okhdfcbank&pn=PocketTrack&am=0&cu=INR',
      'upi://pay?pa=merchant@icici&pn=Shop%20Name&am=99999.99&tn=Payment%20for%20order%20%2312345&cu=INR',
      'upi://pay?pa=user@axis&pn=Special+Chars+!%40%23%24%25%5E%26*()&am=12.50&tn=Chai%20%26%20Samosa',
      'upi://pay?pa=hindi@upi&pn=%E0%A4%AA%E0%A5%89%E0%A4%95%E0%A5%87%E0%A4%9F%E0%A4%9F%E0%A5%8D%E0%A4%B0%E0%A5%88%E0%A4%95&am=500',
      'upi://pay?pa=test@upi&pn=LongNote&am=100&tn=' + 'A'.repeat(80)
    ];

    for (const p of payloads) {
      const svg = generateSvg(p, 240);
      assert(svg && typeof svg === 'string', 'generateUpiQrSvg must return string');
      assert(svg.startsWith('<svg'), `Output must start with <svg: ${svg.slice(0, 30)}`);
      assert(svg.includes('viewBox='), 'SVG must include viewBox attribute');
      assert(svg.includes('<path d="M'), 'SVG must include path d="M...');
      assert(svg.endsWith('</svg>'), 'SVG must end with </svg>');
    }

    assert.strictEqual(networkCalls, 0, 'Zero network calls must be executed during offline QR generation');
  } finally {
    http.request = originalHttp;
    https.request = originalHttps;
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. SESSION STORAGE & USER ISOLATION
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${BOLD}3. Session Storage & User-Scoped Isolation${RESET}`);

const authJsCode = fs.readFileSync(path.join(__dirname, '..', 'auth.js'), 'utf8');

runTest('Session Storage', 'purgeUserLocalStorage completely cleans user data and leaves peer accounts untouched', () => {
  const store = {};
  const mockLocalStorage = {
    getItem: (k) => store[k] !== undefined ? store[k] : null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    key: (i) => Object.keys(store)[i],
    get length() { return Object.keys(store).length; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  };

  const authSandbox = {
    window: { PT: {} },
    localStorage: mockLocalStorage,
    currentUser: null,
    auth: { signOut: () => {}, onAuthStateChanged: () => {} },
    document: {
      getElementById: () => ({ style: {}, textContent: '' }),
      body: { classList: { toggle: () => {} } }
    }
  };
  vm.createContext(authSandbox);
  vm.runInContext(authJsCode, authSandbox);

  const purge = authSandbox.window.purgeUserLocalStorage;
  assert.strictEqual(typeof purge, 'function', 'purgeUserLocalStorage must be a function');

  // Setup multiple users and legacy un-namespaced keys
  const uidA = 'user_alpha_123';
  const uidB = 'user_beta_456';

  // Legacy keys
  store['pockettrack_debts'] = JSON.stringify([{ id: 'debt1', amount: 5000 }]);
  store['pockettrack_monthly_income'] = '75000';
  store['pockettrack_user_upi_id'] = 'alpha@upi';
  store['pockettrack_finny_profile'] = 'profile_a';
  store['pockettrack_entries_cache'] = JSON.stringify([{ id: 'e1' }]);
  store['pockettrack_wallets'] = JSON.stringify([{ id: 'cash' }]);

  // User A keys
  store[`pockettrack_debts_${uidA}`] = JSON.stringify([{ id: 'debt_a', amount: 10000 }]);
  store[`pockettrack_monthly_income_${uidA}`] = '90000';
  store[`pockettrack_user_upi_id_${uidA}`] = 'alpha_real@upi';
  store[`pockettrack_finny_profile_${uidA}`] = 'profile_a_private';
  store[`pockettrack_entries_cache_${uidA}`] = JSON.stringify([{ id: 'ea1' }, { id: 'ea2' }]);
  store[`pockettrack_wallets_${uidA}`] = JSON.stringify([{ id: 'bank_a' }]);

  // User B keys (should NOT be affected when purging user A)
  store[`pockettrack_debts_${uidB}`] = JSON.stringify([{ id: 'debt_b', amount: 20000 }]);
  store[`pockettrack_monthly_income_${uidB}`] = '120000';
  store[`pockettrack_user_upi_id_${uidB}`] = 'beta_real@upi';
  store[`pockettrack_finny_profile_${uidB}`] = 'profile_b_private';
  store[`pockettrack_entries_cache_${uidB}`] = JSON.stringify([{ id: 'eb1' }]);
  store[`pockettrack_wallets_${uidB}`] = JSON.stringify([{ id: 'bank_b' }]);

  // Other non-sensitive app settings
  store['pockettrack_theme'] = 'dark';
  store['pockettrack_lang'] = 'en';

  // Purge User A
  purge(uidA);

  // Assert User A keys and legacy un-namespaced keys are deleted
  assert.strictEqual(store['pockettrack_debts'], undefined, 'Legacy debts must be purged');
  assert.strictEqual(store['pockettrack_monthly_income'], undefined, 'Legacy income must be purged');
  assert.strictEqual(store['pockettrack_user_upi_id'], undefined, 'Legacy UPI must be purged');
  assert.strictEqual(store['pockettrack_finny_profile'], undefined, 'Legacy Finny profile must be purged');
  assert.strictEqual(store['pockettrack_entries_cache'], undefined, 'Legacy entries cache must be purged');
  assert.strictEqual(store['pockettrack_wallets'], undefined, 'Legacy wallets must be purged');

  assert.strictEqual(store[`pockettrack_debts_${uidA}`], undefined, 'User A debts must be purged');
  assert.strictEqual(store[`pockettrack_monthly_income_${uidA}`], undefined, 'User A income must be purged');
  assert.strictEqual(store[`pockettrack_user_upi_id_${uidA}`], undefined, 'User A UPI must be purged');
  assert.strictEqual(store[`pockettrack_finny_profile_${uidA}`], undefined, 'User A Finny profile must be purged');
  assert.strictEqual(store[`pockettrack_entries_cache_${uidA}`], undefined, 'User A cache must be purged');
  assert.strictEqual(store[`pockettrack_wallets_${uidA}`], undefined, 'User A wallets must be purged');

  // Assert User B keys remain 100% intact
  assert.strictEqual(store[`pockettrack_debts_${uidB}`], JSON.stringify([{ id: 'debt_b', amount: 20000 }]));
  assert.strictEqual(store[`pockettrack_monthly_income_${uidB}`], '120000');
  assert.strictEqual(store[`pockettrack_user_upi_id_${uidB}`], 'beta_real@upi');
  assert.strictEqual(store[`pockettrack_entries_cache_${uidB}`], JSON.stringify([{ id: 'eb1' }]));

  // Global app preferences remain intact
  assert.strictEqual(store['pockettrack_theme'], 'dark');
  assert.strictEqual(store['pockettrack_lang'], 'en');
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. FINANCIAL CALCULATIONS STRESS TESTING
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${BOLD}4. Financial Calculations Exactness & Stress Testing${RESET}`);

// --- 4.1 Bill settlement zero-sum closure ---
const startIdx = appJsCode.indexOf('function calculateSettlement(eventId){');
assert(startIdx !== -1, 'calculateSettlement definition must exist in app.js');
const endIdx = appJsCode.indexOf('window.calculateSettlement = calculateSettlement;', startIdx);
const fnStr = appJsCode.substring(startIdx, endIdx);
const rawCalc = new Function('eventId', 'events', 'window', fnStr + '\nreturn calculateSettlement(eventId);');
const calculateSettlement = (ev) => {
  if (!ev._id) ev._id = 'test_ev_' + Math.random();
  return rawCalc(ev._id, [ev], { events: [ev] });
};

runTest('Calculations', 'calculateSettlement guarantees exact zero-sum closure (sum == 0.00) across fractional splits', () => {
  // Test 1: 3-way split of 100 (66.67, -33.33, -33.33 => discrepancy +0.01)
  const ev1 = {
    participants: ['Alice', 'Bob', 'Charlie'],
    sharedExpenses: [
      { amt: 100, paidBy: 'Alice', splitAmong: ['Alice', 'Bob', 'Charlie'] }
    ]
  };
  const res1 = calculateSettlement(ev1);
  const sum1 = Object.values(res1.balances).reduce((s, b) => s + b, 0);
  assert(Math.abs(sum1) < 0.00001, `Sum of balances must be 0.00, got ${sum1}`);
  // Sum of transfers received by Alice must be exactly Alice's balance
  const aliceReceived = res1.transfers.filter(t => t.to === 'Alice').reduce((s, t) => s + t.amount, 0);
  assert.strictEqual(Math.round(aliceReceived * 100) / 100, res1.balances['Alice'], 'Transfers must fully satisfy creditor');

  // Test 2: 7-way split of 1000
  const ev2 = {
    participants: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7'],
    sharedExpenses: [
      { amt: 1000, paidBy: 'P1', splitAmong: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7'] }
    ]
  };
  const res2 = calculateSettlement(ev2);
  const sum2 = Object.values(res2.balances).reduce((s, b) => s + b, 0);
  assert(Math.abs(sum2) < 0.00001, `7-way split sum must be 0.00, got ${sum2}`);

  // Test 3: 11-way split of 333.33
  const ev3 = {
    participants: Array.from({ length: 11 }, (_, i) => `User_${i + 1}`),
    sharedExpenses: [
      { amt: 333.33, paidBy: 'User_1', splitAmong: Array.from({ length: 11 }, (_, i) => `User_${i + 1}`) }
    ]
  };
  const res3 = calculateSettlement(ev3);
  const sum3 = Object.values(res3.balances).reduce((s, b) => s + b, 0);
  assert(Math.abs(sum3) < 0.00001, `11-way split sum must be 0.00, got ${sum3}`);

  // Test 4: Removed payer scenario (Paid by Dave, but Dave was removed from participants)
  const ev4 = {
    participants: ['Alice', 'Bob'], // Dave removed from participants
    sharedExpenses: [
      { amt: 300, paidBy: 'Dave', splitAmong: ['Alice', 'Bob'] }
    ]
  };
  const res4 = calculateSettlement(ev4);
  assert(res4.balances['Dave'] !== undefined, 'Removed payer Dave must be initialized in balances');
  assert.strictEqual(res4.balances['Dave'], 300, 'Dave should be owed 300');
  assert.strictEqual(res4.balances['Alice'], -150, 'Alice owes 150');
  assert.strictEqual(res4.balances['Bob'], -150, 'Bob owes 150');
  const sum4 = Object.values(res4.balances).reduce((s, b) => s + b, 0);
  assert(Math.abs(sum4) < 0.00001, `Removed payer scenario sum must be 0.00, got ${sum4}`);
  assert.strictEqual(res4.transfers.length, 2, 'Should have 2 transfers to Dave');
});

// --- 4.2 Voice parsing ---
const voiceJsCode = fs.readFileSync(path.join(__dirname, '..', 'voice.js'), 'utf8');
const voiceSandbox = {
  window: {},
  document: { addEventListener: () => {}, getElementById: () => null },
  todayStr: () => '2026-10-05',
  currentLang: 'en',
  toast: () => {},
  TT: () => 'Error'
};
vm.createContext(voiceSandbox);
vm.runInContext(voiceJsCode, voiceSandbox);

runTest('Calculations', 'Voice parsing excludes years, phone numbers, and decimal paise dates', () => {
  const extractAmount = voiceSandbox.extractVoiceAmount;
  assert.strictEqual(typeof extractAmount, 'function', 'extractVoiceAmount must be defined');

  // Years filter (2020-2035)
  const resYear1 = extractAmount('dinner 500 in 2024');
  assert.strictEqual(resYear1.value, 500, `Expected 500, got ${resYear1.value}`);

  const resYear2 = extractAmount('spent 1200 for hotel in 2025');
  assert.strictEqual(resYear2.value, 1200, `Expected 1200, got ${resYear2.value}`);

  // Phone numbers filter (10 digits)
  const resPhone = extractAmount('phone recharge 299 for 9876543210');
  assert.strictEqual(resPhone.value, 299, `Expected 299, got ${resPhone.value}`);

  // Paise decimal spends
  const resPaise = extractAmount('spent 12.05 on tea');
  assert.strictEqual(resPaise.value, 12.05, `Expected 12.05, got ${resPaise.value}`);

  // Date parsing collision test: "12.05 on tea" must NOT set date to 12.05 (May 12)
  const parseDate = voiceSandbox.parseVoiceDate;
  // If amount token "12.05" is stripped before date parsing as implemented in parseVoiceInput:
  const rawSpoken = 'Spent 12.05 on tea';
  const extracted = extractAmount(rawSpoken.toLowerCase());
  let textForDate = rawSpoken.replace(extracted.text, ' ');
  const parsedDate = parseDate(textForDate);
  assert.strictEqual(parsedDate, null, '12.05 stripped must not match any date pattern');
});

// --- 4.3 Smart intercept dual-legged recording ---
const smartJsCode = fs.readFileSync(path.join(__dirname, '..', 'smart_engine.js'), 'utf8');

runTest('Calculations', 'Smart intercept saves both expense in /entries and receivable in /ledger', async () => {
  let ledgerSaved = false;
  let normalRan = false;

  const smartSandbox = {
    window: { PT: {} },
    SMART_INTENTS: { LEDGER_PERSON: 'LEDGER_PERSON' },
    analyzeTransactionIntent: () => ({
      intent: 'LEDGER_PERSON',
      person: { _id: 'person_123', name: 'Ramesh' },
      ledgerType: 'gave'
    }),
    showSmartIntentConfirmation: (data, payload, onCancel, onConfirm) => {
      // Simulate user clicking "Yes, connect to ledger"
      onConfirm();
    },
    saveLedgerTx: async (personId, type, amt, note) => {
      assert.strictEqual(personId, 'person_123');
      assert.strictEqual(amt, 500);
      ledgerSaved = true;
    }
  };
  vm.createContext(smartSandbox);
  vm.runInContext(smartJsCode, smartSandbox);

  const payload = { amt: 500, label: 'Lunch with Ramesh', type: 'expense' };
  const runNormal = () => { normalRan = true; };

  // Call intercept
  smartSandbox.interceptAndConfirmSmartTransaction(payload, runNormal, 'hint');
  
  // Wait a microtask for async execution
  await new Promise(r => setImmediate(r));

  assert(ledgerSaved, 'saveLedgerTx must be called for smart intercept');
  assert(normalRan, 'runNormal must be called for dual-legged recording in /entries');
});

// --- 4.4 SIP Compounding annuity formula ---
const sipJsCode = fs.readFileSync(path.join(__dirname, '..', 'goal_sip_planner.js'), 'utf8');

runTest('Calculations', 'Goal SIP calculates true annuity-due Future Value and wealth gained (FV - totalInvested)', () => {
  const target = 50000;
  const monthly = 2000;
  const r = (12 / 12) / 100; // 1% per month

  const numerator = Math.log(1 + (target * r) / (monthly * (1 + r)));
  const denominator = Math.log(1 + r);
  const months = Math.max(1, Math.ceil(numerator / denominator));
  const totalInvested = monthly * months;

  // Exact annuity-due future value formula
  const expectedFv = (monthly * ((Math.pow(1 + r, months) - 1) / r)) * (1 + r);
  const expectedWealthGained = Math.max(0, expectedFv - totalInvested);

  assert(months === 23, `Target 50,000 at 2,000/mo @ 12% should take 23 months, got ${months}`);
  assert(expectedFv >= target, `Future value (${expectedFv}) must reach or exceed target (${target})`);
  assert(expectedWealthGained > 5000, `Wealth gained should be ~5,400, got ${expectedWealthGained}`);

  // Verify the implementation in goal_sip_planner.js matches this
  assert(
    sipJsCode.includes('const fv = (monthly * ((Math.pow(1 + r, months) - 1) / r)) * (1 + r);'),
    'goal_sip_planner.js must use annuity-due compounding formula for fv'
  );
  assert(
    sipJsCode.includes('const wealthGained = Math.max(0, fv - totalInvested);'),
    'goal_sip_planner.js must compute wealth gained as fv - totalInvested'
  );
});

// --- 4.5 Negative amortization warning banner ---
const debtJsCode = fs.readFileSync(path.join(__dirname, '..', 'debt_payoff.js'), 'utf8');

runTest('Calculations', 'Negative amortization detection triggers warning banner when minPayment <= monthlyInterest', () => {
  const debtSandbox = {
    window: { escapeHTML: s => s, localStorage: { getItem: () => null } },
    document: {
      getElementById: () => null,
      createElement: () => ({ style: {}, remove: () => {} }),
      body: { appendChild: () => {} }
    }
  };
  vm.createContext(debtSandbox);
  vm.runInContext(debtJsCode, debtSandbox);

  const calculateStrategyMatch = debtJsCode.match(/function calculateStrategy\(debts, strategy, extraPayment\)[\s\S]*?\r?\n  \}/);
  assert(calculateStrategyMatch, 'calculateStrategy must exist in debt_payoff.js');
  let calculateStrategy;
  eval(`calculateStrategy = ${calculateStrategyMatch[0]};`);

  // Scenario 1: Negative amortization (Credit card 100k @ 36% APR -> interest is 3,000/mo, min payment is 2,500)
  const toxicDebts = [
    { name: 'Credit Card', balance: 100000, rate: 36, minPayment: 2500 }
  ];
  const toxicRes = calculateStrategy(toxicDebts, 'avalanche', 0);
  assert.strictEqual(toxicRes.hasNegativeAmortization, true, 'hasNegativeAmortization should be true for 2500 <= 3000');

  // Scenario 2: Healthy debt (Car loan 100k @ 10% APR -> interest is 833/mo, min payment is 3,000)
  const healthyDebts = [
    { name: 'Car Loan', balance: 100000, rate: 10, minPayment: 3000 }
  ];
  const healthyRes = calculateStrategy(healthyDebts, 'avalanche', 0);
  assert.strictEqual(healthyRes.hasNegativeAmortization, false, 'hasNegativeAmortization should be false for healthy debt');

  // Check that openModal includes the warning banner markup
  assert(debtJsCode.includes('Warning: Negative Amortization Detected'), 'Warning banner text must be present in debt_payoff.js');
});

// --- 4.6 FIRE Runway investment exclusions ---
const fireJsCode = fs.readFileSync(path.join(__dirname, '..', 'fire_runway.js'), 'utf8');

runTest('Calculations', 'FIRE Runway excludes investment & asset categories from living expense burn', () => {
  assert(
    fireJsCode.includes('isInvestmentOrSavings(cat)'),
    'fire_runway.js must define isInvestmentOrSavings helper'
  );
  assert(
    fireJsCode.includes('savings|investment|investments|mutual fund|sip|stocks|equity|gold|silver|ppf|nps|fd|rd'),
    'fire_runway.js must check all standard investment categories'
  );

  // Extract isInvestmentOrSavings
  const isInvestMatch = fireJsCode.match(/function isInvestmentOrSavings\(cat\)[\s\S]*?\n    \}/);
  assert(isInvestMatch);
  let isInvestmentOrSavings;
  eval(`isInvestmentOrSavings = ${isInvestMatch[0]};`);

  assert.strictEqual(isInvestmentOrSavings('mutual fund'), true);
  assert.strictEqual(isInvestmentOrSavings('SIP'), true);
  assert.strictEqual(isInvestmentOrSavings('stocks'), true);
  assert.strictEqual(isInvestmentOrSavings('gold'), true);
  assert.strictEqual(isInvestmentOrSavings('investments'), true);
  assert.strictEqual(isInvestmentOrSavings('groceries'), false);
  assert.strictEqual(isInvestmentOrSavings('rent'), false);
  assert.strictEqual(isInvestmentOrSavings('food'), false);
});

// --- 4.7 Reports health score inter-wallet transfer exclusions ---
const reportsJsCode = fs.readFileSync(path.join(__dirname, '..', 'reports.js'), 'utf8');

runTest('Calculations', 'Reports health score filters out inter-wallet transfers from both income and expense', () => {
  assert(
    reportsJsCode.includes('const income = list.filter(e => e.type === \'income\' && !e.transferGroupId).reduce((s,e)=>s+e.amt,0);'),
    'reports.js computeHealthScore must filter !e.transferGroupId on income'
  );
  assert(
    reportsJsCode.includes('const expense = list.filter(e => e.type === \'expense\' && !e.transferGroupId).reduce((s,e)=>s+e.amt,0);'),
    'reports.js computeHealthScore must filter !e.transferGroupId on expense'
  );
});

// --- 4.8 Daily burn meter single-wallet spend scoping ---
const burnJsCode = fs.readFileSync(path.join(__dirname, '..', 'daily_burn_meter.js'), 'utf8');

runTest('Calculations', 'Daily burn meter filters todaySpent and monthSpent by active wallet', () => {
  assert(
    burnJsCode.includes('const activeW = (typeof window !== \'undefined\' && window.activeWalletId) ? window.activeWalletId : \'all\';'),
    'daily_burn_meter.js must read activeWalletId'
  );
  assert(
    burnJsCode.includes('if (activeW && activeW !== \'all\' && eWallet !== activeW) return;'),
    'daily_burn_meter.js must skip transactions from other wallets when activeW !== all'
  );
});

// --- 4.9 Time Machine unified 3-month projection ---
const auraJsCode = fs.readFileSync(path.join(__dirname, '..', 'aurasense.js'), 'utf8');

runTest('Calculations', 'AuraSense Time Machine uses unified getTimeMachineProjection for modal & chips', () => {
  assert(
    auraJsCode.includes('function getTimeMachineProjection(totalBalance, months)'),
    'aurasense.js must define getTimeMachineProjection'
  );
  assert(
    auraJsCode.includes('const proj3 = getTimeMachineProjection(metric.totalBalance, 3);'),
    'openTimeMachineModal must use getTimeMachineProjection for initial 3mo view'
  );
  assert(
    auraJsCode.includes('const { projectedGain, totalProjected } = getTimeMachineProjection(metric.totalBalance, months);'),
    'updateTimeHorizon must use getTimeMachineProjection on chip clicks'
  );

  // Extract getTimeMachineProjection
  const getProjMatch = auraJsCode.match(/function getTimeMachineProjection\(totalBalance, months\)[\s\S]*?\n\}/);
  assert(getProjMatch);
  let getTimeMachineProjection;
  eval(`getTimeMachineProjection = ${getProjMatch[0]};`);

  const p50k = getTimeMachineProjection(50000, 3);
  // base = 50000, monthlySaveEstimate = 50000 * 0.12 = 6000, gain = 6000 * 3 = 18000, total = 68000
  assert.strictEqual(p50k.base, 50000);
  assert.strictEqual(p50k.projectedGain, 18000);
  assert.strictEqual(p50k.totalProjected, 68000);

  // Same equation across both paths guarantees zero divergence
});

// --- 4.10 Envelopes food classification ---
const envJsCode = fs.readFileSync(path.join(__dirname, '..', 'envelopes.js'), 'utf8');

runTest('Calculations', 'Envelopes classifies general food as Needs while preserving luxury dining as Wants', () => {
  const mockDoc = {
    readyState: 'complete',
    getElementById: () => null,
    createElement: () => ({ style: {} }),
    head: { appendChild: () => {} },
    addEventListener: () => {}
  };
  const envSandbox = {
    window: { document: mockDoc },
    document: mockDoc,
    currentUser: { uid: 'user_test' },
    localStorage: { getItem: () => null },
    setTimeout: () => {}
  };
  vm.createContext(envSandbox);
  vm.runInContext(envJsCode, envSandbox);

  const classifyEntryMatch = envJsCode.match(/function classifyEntry\(entry\)[\s\S]*?\n  \}/);
  assert(classifyEntryMatch);
  let classifyEntry;
  const matchKeywordMatch = envJsCode.match(/function matchKeyword\(text, kw\)[\s\S]*?\n  \}/);
  const catMapMatch = envJsCode.match(/var CATEGORY_MAP = \{[\s\S]*?\n  \};/);
  eval(`${catMapMatch[0]}\n${matchKeywordMatch[0]}\nclassifyEntry = ${classifyEntryMatch[0]};`);

  // Basic sustenance food -> Needs
  assert.strictEqual(classifyEntry({ cat: 'food', desc: 'Lunch mess' }), 'needs');
  assert.strictEqual(classifyEntry({ cat: 'groceries', desc: 'Vegetables' }), 'needs');
  assert.strictEqual(classifyEntry({ cat: 'food', desc: 'Ration' }), 'needs');

  // Discretionary dining / delivery -> Wants
  assert.strictEqual(classifyEntry({ cat: 'food', desc: 'Swiggy biryani' }), 'wants');
  assert.strictEqual(classifyEntry({ cat: 'food', desc: 'Zomato order' }), 'wants');
  assert.strictEqual(classifyEntry({ cat: 'food', desc: 'Dinner at Italian restaurant' }), 'wants');
  assert.strictEqual(classifyEntry({ cat: 'cafe', desc: 'Starbucks' }), 'wants');
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. PERFORMANCE & SERVICE WORKER STRESS TESTING
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${BOLD}5. Performance, Service Worker & Namespacing${RESET}`);

runTest('Performance & SW', 'AuraSense pauses animation loop when tab is hidden or canvas is detached', () => {
  let animRequested = 0;
  let animId = null;

  const mockCanvas = {
    isConnected: true,
    offsetParent: {},
    getBoundingClientRect: () => ({ width: 100, height: 100 }),
    width: 100,
    height: 100
  };

  const auraSandbox = {
    window: { PT: {} },
    document: { hidden: false },
    auraCanvas: mockCanvas,
    auraCtx: {
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
    },
    getCachedFinancialVelocity: () => ({ speed: 0.02, auraGlow: 'rgba(139,92,246,0.5)', auraColor: '#8b5cf6' }),
    auraPhase: 0,
    auraRipples: [],
    requestAnimationFrame: (cb) => {
      animRequested++;
      return 42;
    },
    auraAnimId: 1
  };

  // Extract renderAuraSense function
  const renderAuraMatch = auraJsCode.match(/function renderAuraSense\(\)[\s\S]*?\n\}/);
  assert(renderAuraMatch);
  vm.createContext(auraSandbox);
  vm.runInContext(renderAuraMatch[0], auraSandbox);

  // 1. When tab is active:
  auraSandbox.document.hidden = false;
  auraSandbox.renderAuraSense();
  assert(animRequested > 0, 'requestAnimationFrame must be invoked when active');

  // 2. When tab is hidden:
  const prevCount = animRequested;
  auraSandbox.document.hidden = true;
  auraSandbox.renderAuraSense();
  assert.strictEqual(animRequested, prevCount, 'requestAnimationFrame must NOT be called when document.hidden is true');
  assert.strictEqual(auraSandbox.auraAnimId, null, 'auraAnimId must be reset to null when hidden');

  // 3. When canvas is detached:
  auraSandbox.document.hidden = false;
  mockCanvas.isConnected = false;
  auraSandbox.renderAuraSense();
  assert.strictEqual(animRequested, prevCount, 'requestAnimationFrame must NOT be called when canvas is disconnected');
});

runTest('Performance & SW', 'Service Worker enforces SWR caching and restricts cross-origin fetch to trusted CDNs', () => {
  const swCode = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');

  // Check TRUSTED_CDN_ORIGINS
  assert(swCode.includes('const TRUSTED_CDN_ORIGINS = ['), 'sw.js must define TRUSTED_CDN_ORIGINS');
  assert(swCode.includes('https://cdnjs.cloudflare.com'), 'Must trust cdnjs');
  assert(swCode.includes('https://www.gstatic.com'), 'Must trust gstatic');
  assert(swCode.includes('https://fonts.googleapis.com'), 'Must trust Google Fonts api');
  assert(swCode.includes('https://cdn.jsdelivr.net'), 'Must trust jsdelivr');

  // Check that external fetch filters out untrusted cross-origin requests
  assert(
    swCode.includes('if (!isSameOrigin && !isTrustedCdn) return;'),
    'sw.js must immediately return and not cache untrusted third-party origins'
  );

  // Check Stale-While-Revalidate pattern
  assert(
    swCode.includes('caches.match(req).then((cached) => {'),
    'sw.js must check cache first'
  );
  assert(
    swCode.includes('const copy = networkRes.clone();'),
    'sw.js must clone network response to update cache in background'
  );
  assert(
    swCode.includes('return cached || fetchPromise'),
    'sw.js must return cached immediately if available'
  );

  // Check exclusion of dynamic Firebase streaming endpoints
  assert(
    swCode.includes('url.hostname.includes(\'firebaseio.com\')'),
    'sw.js must not intercept or cache firebaseio.com'
  );
  assert(
    swCode.includes('url.pathname.includes(\'/google.firestore.\')'),
    'sw.js must not intercept or cache /google.firestore.'
  );
});

runTest('Performance & SW', 'transactions.js bounds initial query to limit(200) and implements loadOlderEntries pagination', () => {
  const txCode = fs.readFileSync(path.join(__dirname, '..', 'transactions.js'), 'utf8');

  assert(
    txCode.includes('.orderBy(\'date\', \'desc\')') && txCode.includes('.limit(200)'),
    'transactions.js listenToEntries must limit initial snapshot query to 200 items'
  );

  assert(
    txCode.includes('async function loadOlderEntries(batchSize = 100)'),
    'transactions.js must define loadOlderEntries pagination helper'
  );
  assert(
    txCode.includes('window.loadOlderEntries = loadOlderEntries;'),
    'transactions.js must expose loadOlderEntries on window'
  );
});

runTest('Performance & SW', 'Shared window.PT namespace container initialization & integrity', () => {
  const appHtml = fs.readFileSync(path.join(__dirname, '..', 'app.html'), 'utf8');

  // Verify app.html head initialization
  assert(
    appHtml.includes('window.PT = window.PT || {};'),
    'app.html must initialize window.PT container in head'
  );

  // Verify app.js attaches to PT
  assert(
    appJsCode.includes('window.PT = window.PT || {};'),
    'app.js must initialize/attach to window.PT'
  );
  assert(
    appJsCode.includes('window.PT.escapeHTML = escapeHTML;'),
    'app.js must bind escapeHTML to window.PT'
  );

  // Verify wallets.js attaches to PT
  const walletsCode = fs.readFileSync(path.join(__dirname, '..', 'wallets.js'), 'utf8');
  assert(
    walletsCode.includes('window.PT = window.PT || {};'),
    'wallets.js must attach to window.PT'
  );
  assert(
    walletsCode.includes('window.PT.userWallets = userWallets;'),
    'wallets.js must bind userWallets to window.PT'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// EXECUTION SUMMARY
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${BOLD}${CYAN}----------------------------------------------------------------${RESET}`);
console.log(`${BOLD}EXECUTION SUMMARY:${RESET}`);
console.log(`Total tests run:  ${totalTests}`);
console.log(`Tests passed:     ${GREEN}${passedTests}${RESET}`);
console.log(`Tests failed:     ${failedTests > 0 ? RED : GREEN}${failedTests}${RESET}`);
console.log(`${BOLD}${CYAN}----------------------------------------------------------------${RESET}\n`);

if (failedTests > 0) {
  console.error(`${RED}${BOLD}VERDICT: FAILURES DETECTED (${failedTests})${RESET}`);
  process.exit(1);
} else {
  console.log(`${GREEN}${BOLD}✔ ALL TIER 2 ADVERSARIAL CHALLENGE TESTS PASSED (100% SUCCESS)${RESET}`);
  process.exit(0);
}
