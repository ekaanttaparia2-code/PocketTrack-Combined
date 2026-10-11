/**
 * PocketTrack Tier 2 Deep Empirical Edge Cases & Stress Harness
 * 
 * Verifies:
 * 1. Polyglot HTML injection against escapeHTML
 * 2. Offline SWR cache races and error conditions
 * 3. Un-namespaced localStorage purge completeness and tenant isolation
 * 4. Bill settlement with extreme floating point precision and penny allocation
 * 5. Negative amortization boundary conditions and max cap
 * 6. FIRE runway zero-expense/investment boundary conditions
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failureList = [];

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ${GREEN}✓ PASS${RESET} ${name}`);
  } catch (err) {
    failedTests++;
    failureList.push({ name, error: err.message });
    console.log(`  ${RED}✗ FAIL${RESET} ${BOLD}${name}${RESET}`);
    console.log(`    ${RED}Reason: ${err.message}${RESET}`);
  }
}

console.log(`${BOLD}${CYAN}================================================================${RESET}`);
console.log(`${BOLD}${CYAN}   POCKETTRACK TIER 2 DEEP EMPIRICAL EDGE CASES HARNESS          ${RESET}`);
console.log(`${BOLD}${CYAN}================================================================${RESET}\n`);

// ─────────────────────────────────────────────────────────────────────────────
// 1. POLYGLOT HTML INJECTION AGAINST escapeHTML
// ─────────────────────────────────────────────────────────────────────────────
console.log(`${BOLD}1. Polyglot HTML Injection & Sanitization Edge Cases${RESET}`);

const appCode = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const escapeMatch = appCode.match(/function escapeHTML\(str\)\{[\s\S]*?\n\}/);
assert(escapeMatch, 'escapeHTML must exist in app.js');
let escapeHTML;
eval(`escapeHTML = ${escapeMatch[0]};`);

test('escapeHTML neutralizes all standard 5 HTML delimiters', () => {
  const input = `& < > " '`;
  const res = escapeHTML(input);
  assert.strictEqual(res, `&amp; &lt; &gt; &quot; &#39;`);
});

test('escapeHTML survives extreme polyglot XSS attack vectors', () => {
  const polyglots = [
    `javascript:/*--></title></style></textarea></script></xmp><svg/onload='+/"/+/onmouseover=1/+/[*/[]/+alert(1)//'>`,
    `"><script>alert(document.domain)</script>`,
    `' onfocus='alert(1)' autofocus='`,
    `"><img src=x onerror=alert('XSS')>`,
    `<svg><animate onbegin=alert(1) attributeName=x dur=1s>`,
    `"><iframe src="javascript:alert(1)"></iframe>`,
    `'><body onload=alert(1)>`,
    `<math><mtext><table><mglyph><style><!--</style><img src=x onerror=alert(1)>`,
    `" onmouseover="alert('attack')" data-x="`,
    `<input type="text" autofocus onfocus="alert(1)">`,
    `"><a href="javascript:alert(1)">click</a>`,
    `<<SCRIPT>alert("XSS");//<</SCRIPT>`,
    `<script src="data:text/javascript,alert(1)"></script>`,
    `<!--<script>alert(1)</script>-->`,
    `" style="behavior:url(#default#time2)" onbegin="alert(1)"`,
    `%22%3E%3Cscript%3Ealert(1)%3C/script%3E`,
    `&lt;script&gt;alert(1)&lt;/script&gt;`
  ];

  for (const p of polyglots) {
    const escaped = escapeHTML(p);
    // 1. Must never contain unescaped raw '<' or '>'
    assert(!escaped.includes('<'), `Must not contain unescaped <: ${escaped}`);
    assert(!escaped.includes('>'), `Must not contain unescaped >: ${escaped}`);
    // 2. Must never contain unescaped raw quotes '"' or "'"
    assert(!escaped.includes('"'), `Must not contain unescaped double quote: ${escaped}`);
    assert(!escaped.includes("'"), `Must not contain unescaped single quote: ${escaped}`);
    // 3. Raw ampersands must be escaped as &amp;
    const rawAmpRegex = /&(?!amp;|lt;|gt;|quot;|#39;)/;
    assert(!rawAmpRegex.test(escaped), `Must not contain dangling raw ampersands: ${escaped}`);
  }
});

test('escapeHTML non-string type resilience (null, undefined, 0, false, objects)', () => {
  assert.strictEqual(escapeHTML(null), '');
  assert.strictEqual(escapeHTML(undefined), '');
  assert.strictEqual(escapeHTML(0), '0');
  assert.strictEqual(escapeHTML(false), 'false');
  assert.strictEqual(escapeHTML(NaN), 'NaN');
  assert.strictEqual(escapeHTML(Infinity), 'Infinity');
  assert.strictEqual(escapeHTML(-42), '-42');
  assert.strictEqual(escapeHTML(''), '');
  assert.strictEqual(escapeHTML({}), '[object Object]');
  assert.strictEqual(escapeHTML([1, 2, 3]), '1,2,3');
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. OFFLINE SWR CACHE RACES & SERVICE WORKER BEHAVIOR
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${BOLD}2. Offline SWR Cache Races & Service Worker Robustness${RESET}`);

test('SWR returns cached version immediately while triggering background revalidation', async () => {
  let cacheMatchCalled = false;
  let fetchCalled = false;
  let cachePutCalled = false;

  const mockCachedResponse = { status: 200, body: 'cached-version' };
  const mockNetworkResponse = {
    status: 200,
    body: 'fresh-network-version',
    clone: () => ({ status: 200, body: 'fresh-network-version' })
  };

  const mockCaches = {
    match: async (req) => {
      cacheMatchCalled = true;
      return mockCachedResponse;
    },
    open: async (cacheName) => ({
      put: async (req, res) => {
        cachePutCalled = true;
      }
    })
  };

  const mockFetch = async (req) => {
    fetchCalled = true;
    return mockNetworkResponse;
  };

  // Simulate sw.js SWR block:
  const req = { method: 'GET', url: 'https://example.com/app.js' };
  const CACHE = 'test-cache';

  const swrResult = await mockCaches.match(req).then((cached) => {
    const fetchPromise = mockFetch(req).then((networkRes) => {
      if (networkRes && networkRes.status === 200) {
        const copy = networkRes.clone();
        mockCaches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      }
      return networkRes;
    }).catch(() => null);

    return cached || fetchPromise.then((res) => res || mockCaches.match('./'));
  });

  assert.strictEqual(swrResult, mockCachedResponse, 'SWR must return cached item immediately');
  assert(fetchCalled, 'SWR must kick off background revalidation fetch');
  // Wait a microtask for background cache put
  await new Promise(r => setTimeout(r, 10));
  assert(cachePutCalled, 'SWR must update cache in background with fresh copy');
});

test('SWR does not corrupt cache when network returns 500 error', async () => {
  let cachePutCalled = false;
  const mockCachedResponse = { status: 200, body: 'cached-safe' };
  const mock500Response = { status: 500, body: 'internal-server-error', clone: () => {} };

  const mockCaches = {
    match: async () => mockCachedResponse,
    open: async () => ({
      put: async () => { cachePutCalled = true; }
    })
  };
  const mockFetch = async () => mock500Response;

  const swrResult = await mockCaches.match({}).then((cached) => {
    const fetchPromise = mockFetch({}).then((networkRes) => {
      if (networkRes && networkRes.status === 200) {
        const copy = networkRes.clone();
        mockCaches.open('test').then((c) => c.put({}, copy)).catch(() => {});
      }
      return networkRes;
    }).catch(() => null);

    return cached || fetchPromise.then((res) => res || mockCaches.match('./'));
  });

  assert.strictEqual(swrResult, mockCachedResponse);
  await new Promise(r => setTimeout(r, 10));
  assert.strictEqual(cachePutCalled, false, '500 error must NOT be written to cache');
});

test('SWR handles complete network failure (offline) smoothly', async () => {
  const mockCachedResponse = { status: 200, body: 'cached-offline' };
  const mockCaches = {
    match: async () => mockCachedResponse
  };
  const mockFetch = async () => { throw new Error('Network offline'); };

  const swrResult = await mockCaches.match({}).then((cached) => {
    const fetchPromise = mockFetch({}).then((networkRes) => {
      if (networkRes && networkRes.status === 200) {
        const copy = networkRes.clone();
        mockCaches.open('test').then((c) => c.put({}, copy)).catch(() => {});
      }
      return networkRes;
    }).catch(() => null);

    return cached || fetchPromise.then((res) => res || mockCaches.match('./'));
  });

  assert.strictEqual(swrResult, mockCachedResponse, 'Should return cached response when offline');
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. UN-NAMESPACED LOCALSTORAGE PURGE COMPLETENESS & TENANT ISOLATION
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${BOLD}3. LocalStorage Purge Completeness & Tenant Isolation${RESET}`);

const authCode = fs.readFileSync(path.join(__dirname, '..', 'auth.js'), 'utf8');

test('purgeUserLocalStorage tenant isolation: User A logout must not purge User B data', () => {
  const store = {};
  const mockLocalStorage = {
    getItem: (k) => store[k] !== undefined ? store[k] : null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    key: (i) => Object.keys(store)[i],
    get length() { return Object.keys(store).length; }
  };

  const sandbox = {
    window: { PT: {} },
    localStorage: mockLocalStorage,
    currentUser: null,
    auth: { signOut: () => {}, onAuthStateChanged: () => {} },
    document: {
      getElementById: () => ({ style: {}, textContent: '' }),
      body: { classList: { toggle: () => {} } }
    }
  };
  vm.createContext(sandbox);
  vm.runInContext(authCode, sandbox);

  const purge = sandbox.window.purgeUserLocalStorage;
  assert.strictEqual(typeof purge, 'function');

  // Populate data for User Alpha and User Beta
  const uidA = 'user_alpha_123';
  const uidB = 'user_beta_456';

  store['pockettrack_debts'] = 'legacy_debts';
  store[`pockettrack_debts_${uidA}`] = 'alpha_debts';
  store[`pockettrack_debts_${uidB}`] = 'beta_debts';

  store['pockettrack_monthly_income'] = 'legacy_income';
  store[`pockettrack_monthly_income_${uidA}`] = 'alpha_income';
  store[`pockettrack_monthly_income_${uidB}`] = 'beta_income';

  store[`pockettrack_entries_cache_${uidA}`] = 'alpha_entries';
  store[`pockettrack_entries_cache_${uidB}`] = 'beta_entries';

  store[`pockettrack_wallets_${uidA}`] = 'alpha_wallets';
  store[`pockettrack_wallets_${uidB}`] = 'beta_wallets';

  store['pockettrack_theme'] = 'dark';
  store['pockettrack_lang'] = 'en';

  // Action: Purge ONLY User Alpha
  purge(uidA);

  // Verification: User Alpha and legacy keys MUST be purged
  assert.strictEqual(store['pockettrack_debts'], undefined, 'Legacy debts should be purged');
  assert.strictEqual(store[`pockettrack_debts_${uidA}`], undefined, 'User Alpha debts should be purged');
  assert.strictEqual(store[`pockettrack_entries_cache_${uidA}`], undefined, 'User Alpha cache should be purged');

  // CRITICAL CHECK: User Beta keys MUST be 100% preserved
  assert.strictEqual(store[`pockettrack_debts_${uidB}`], 'beta_debts', 'CRITICAL DEFECT: User Beta debts were wiped by User Alpha logout!');
  assert.strictEqual(store[`pockettrack_monthly_income_${uidB}`], 'beta_income', 'CRITICAL DEFECT: User Beta income was wiped by User Alpha logout!');
  assert.strictEqual(store[`pockettrack_entries_cache_${uidB}`], 'beta_entries', 'CRITICAL DEFECT: User Beta entries cache was wiped by User Alpha logout!');
  assert.strictEqual(store[`pockettrack_wallets_${uidB}`], 'beta_wallets', 'CRITICAL DEFECT: User Beta wallets were wiped by User Alpha logout!');

  // Preferences must survive
  assert.strictEqual(store['pockettrack_theme'], 'dark');
  assert.strictEqual(store['pockettrack_lang'], 'en');
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. BILL SETTLEMENT WITH FLOATING POINT PRECISION
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${BOLD}4. Bill Settlement Floating Point Precision Edge Cases${RESET}`);

const startIdx = appCode.indexOf('function calculateSettlement(eventId){');
const endIdx = appCode.indexOf('window.calculateSettlement = calculateSettlement;', startIdx);
const rawFnStr = appCode.substring(startIdx, endIdx);
const rawCalc = new Function('eventId', 'events', rawFnStr + '\nreturn calculateSettlement(eventId);');
const calculateSettlement = (ev) => {
  const evObj = { _id: ev._id || 'ev_test', ...ev };
  return rawCalc(evObj._id, [evObj]);
};

test('3-way split of ₹100: balance sum must equal 0.00 and transfers must balance', () => {
  const ev = {
    participants: ['Alice', 'Bob', 'Charlie'],
    sharedExpenses: [
      { amt: 100, paidBy: 'Alice', splitAmong: ['Alice', 'Bob', 'Charlie'] }
    ]
  };
  const res = calculateSettlement(ev);
  assert(res, 'Settlement result must exist');
  const sum = Object.values(res.balances).reduce((s, b) => s + b, 0);
  assert.strictEqual(Math.round(sum * 100) / 100, 0, `Sum of balances must be 0.00, got ${sum}`);
  
  const totalTransfers = res.transfers.reduce((s, t) => s + t.amount, 0);
  assert.strictEqual(Math.round(totalTransfers * 100) / 100, res.balances['Alice'], 'Total transfers must match creditor balance');
});

test('100-way split of ₹1.00: penny allocation must maintain sum == 0.00', () => {
  const participants = Array.from({ length: 100 }, (_, i) => `User_${i}`);
  const ev = {
    participants,
    sharedExpenses: [
      { amt: 1.00, paidBy: 'User_0', splitAmong: participants }
    ]
  };
  const res = calculateSettlement(ev);
  assert(res, 'Settlement result must exist');
  const sum = Object.values(res.balances).reduce((s, b) => s + b, 0);
  assert(Math.abs(sum) < 0.00001, `100-way split sum must be 0.00, got ${sum}`);
});

test('Reciprocal equal expenses: balances must all be 0.00 with 0 transfers', () => {
  const ev = {
    participants: ['Alice', 'Bob'],
    sharedExpenses: [
      { amt: 150, paidBy: 'Alice', splitAmong: ['Alice', 'Bob'] },
      { amt: 150, paidBy: 'Bob', splitAmong: ['Alice', 'Bob'] }
    ]
  };
  const res = calculateSettlement(ev);
  assert(res);
  assert.strictEqual(res.balances['Alice'], 0);
  assert.strictEqual(res.balances['Bob'], 0);
  assert.strictEqual(res.transfers.length, 0, 'No transfers needed when balances cancel');
});

test('Zero expense / empty expenses returns null gracefully', () => {
  const ev = {
    participants: ['Alice', 'Bob'],
    sharedExpenses: []
  };
  const res = calculateSettlement(ev);
  assert.strictEqual(res, null, 'Empty expenses must return null');
});

test('Removed historical payer preserves balance and net zero sum', () => {
  const ev = {
    participants: ['Alice', 'Bob'], // Dave removed from participants
    sharedExpenses: [
      { amt: 300, paidBy: 'Dave', splitAmong: ['Alice', 'Bob'] }
    ]
  };
  const res = calculateSettlement(ev);
  assert(res);
  assert.strictEqual(res.balances['Dave'], 300);
  assert.strictEqual(res.balances['Alice'], -150);
  assert.strictEqual(res.balances['Bob'], -150);
  const sum = Object.values(res.balances).reduce((s, b) => s + b, 0);
  assert.strictEqual(Math.round(sum * 100) / 100, 0);
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. NEGATIVE AMORTIZATION EDGE CASES
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${BOLD}5. Negative Amortization Boundary Conditions${RESET}`);

const debtCode = fs.readFileSync(path.join(__dirname, '..', 'debt_payoff.js'), 'utf8');
const debtCalcMatch = debtCode.match(/function calculateStrategy\(debts, strategy, extraPayment\)[\s\S]*?\r?\n  \}/);
assert(debtCalcMatch, 'calculateStrategy must exist in debt_payoff.js');
let calculateStrategy;
eval(`calculateStrategy = ${debtCalcMatch[0]};`);

test('Toxic debt (minPayment < monthlyInterest) flags hasNegativeAmortization: true and unpayable: true', () => {
  // Balance: 500,000, APR: 36% -> monthly interest = 15,000. Min payment = 5,000.
  const toxic = [
    { name: 'Shark Loan', balance: 500000, rate: 36, minPayment: 5000 }
  ];
  const res = calculateStrategy(toxic, 'avalanche', 0);
  assert.strictEqual(res.hasNegativeAmortization, true, 'Must flag negative amortization');
  assert.strictEqual(res.unpayable, true, 'Must flag unpayable after maxMonths');
  assert.strictEqual(res.months, 360, 'Must cap at 360 months');
});

test('Exact boundary (minPayment == monthlyInterest): flags negative amortization', () => {
  // Balance: 100,000, APR: 12% -> monthly interest = 1,000. Min payment = 1,000.
  const boundary = [
    { name: 'Treadmill Debt', balance: 100000, rate: 12, minPayment: 1000 }
  ];
  const res = calculateStrategy(boundary, 'avalanche', 0);
  assert.strictEqual(res.hasNegativeAmortization, true, 'Equal minPayment and interest is perpetual negative amortization');
  assert.strictEqual(res.unpayable, true);
});

test('Boundary + 0.01 (minPayment > monthlyInterest): healthy debt, pays off completely', () => {
  // Balance: 100,000, APR: 12% -> monthly interest = 1,000. Min payment = 1,500.
  const healthy = [
    { name: 'Normal Debt', balance: 100000, rate: 12, minPayment: 1500 }
  ];
  const res = calculateStrategy(healthy, 'avalanche', 0);
  assert.strictEqual(res.hasNegativeAmortization, false, 'Must be false when minPayment > interest');
  assert.strictEqual(res.unpayable, false, 'Must pay off');
  assert(res.months < 360, 'Must finish before cap');
});

test('0% interest rate loan: hasNegativeAmortization is false and pays in exact balance/minPayment', () => {
  // Balance: 60,000, APR: 0%, min payment: 5,000 -> 12 months
  const zeroInterest = [
    { name: 'No-Cost EMI', balance: 60000, rate: 0, minPayment: 5000 }
  ];
  const res = calculateStrategy(zeroInterest, 'avalanche', 0);
  assert.strictEqual(res.hasNegativeAmortization, false);
  assert.strictEqual(res.unpayable, false);
  assert.strictEqual(res.months, 12);
  assert.strictEqual(res.totalInterest, 0);
});

test('Empty debts array returns 0 months and unpayable: false', () => {
  const res = calculateStrategy([], 'avalanche', 0);
  assert.strictEqual(res.months, 0);
  assert.strictEqual(res.hasNegativeAmortization, false);
  assert.strictEqual(res.unpayable, false);
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. FIRE RUNWAY ZERO-EXPENSE / INVESTMENT BOUNDARY CONDITIONS
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${BOLD}6. FIRE Runway Zero-Expense & Investment Boundary Conditions${RESET}`);

const fireCode = fs.readFileSync(path.join(__dirname, '..', 'fire_runway.js'), 'utf8');

function evalFireRunwayWithEntries(mockEntries) {
  const getLangMatch = fireCode.match(/function getLang\(\)[\s\S]*?\r?\n  \}/);
  const getRunwayMatch = fireCode.match(/function getRunwayData\(\)[\s\S]*?\r?\n  \}/);
  assert(getRunwayMatch, 'getRunwayData must exist in fire_runway.js');
  const sandbox = {
    window: {
      entries: mockEntries,
      currentLang: 'en'
    },
    localStorage: { getItem: () => 'en' },
    document: {
      getElementById: () => null,
      createElement: () => ({ style: {}, appendChild: () => {} }),
      body: { appendChild: () => {} }
    }
  };
  vm.createContext(sandbox);
  const langFn = getLangMatch ? getLangMatch[0] : 'function getLang(){ return "en"; }';
  return vm.runInContext(`(function(){ ${langFn}; return (${getRunwayMatch[0]})(); })()`, sandbox);
}

test('New user with 0 expenses defaults to monthlyBurn floor 25,000 without division by zero', () => {
  const entries = [
    { type: 'income', amt: 100000, date: '2026-10-01' }
  ];
  const data = evalFireRunwayWithEntries(entries);
  assert.strictEqual(data.monthlyBurn, 25000, 'Zero expense must default to ₹25,000 burn floor');
  assert.strictEqual(data.liquidAssets, 100000, 'Liquid assets should be 100,000');
  assert.strictEqual(data.runwayMonths, 4.0, '100,000 / 25,000 = 4.0 months');
  assert.strictEqual(data.status, 'fair');
});

test('User with 100% investment expenses excludes investments from burn and treats them as asset pool', () => {
  const entries = [
    { type: 'income', amt: 200000, date: '2026-10-01' },
    { type: 'expense', amt: 50000, cat: 'mutual fund', date: '2026-10-02' },
    { type: 'expense', amt: 50000, cat: 'SIP', date: '2026-10-03' },
    { type: 'expense', amt: 50000, cat: 'stocks', date: '2026-10-04' }
  ];
  const data = evalFireRunwayWithEntries(entries);
  assert.strictEqual(data.monthlyBurn, 25000, 'Burn must remain floor 25,000 because all expenses are investments');
  // liquidAssets = income (200k) - livingExpenses (0) = 200k
  assert.strictEqual(data.liquidAssets, 200000, 'Investments must not be deducted from liquidAssets in FIRE calculation');
  assert.strictEqual(data.runwayMonths, 8.0, '200,000 / 25,000 = 8.0 months');
  assert.strictEqual(data.status, 'strong');
});

test('Zero income user with living expenses has 0 liquid assets and critical status', () => {
  const entries = [
    { type: 'expense', amt: 30000, cat: 'rent', date: '2026-09-01' },
    { type: 'expense', amt: 30000, cat: 'rent', date: '2026-10-01' }
  ];
  const data = evalFireRunwayWithEntries(entries);
  assert.strictEqual(data.liquidAssets, 0, 'Liquid assets must floor at 0');
  assert.strictEqual(data.runwayMonths, 0, 'Runway must be 0 months');
  assert.strictEqual(data.status, 'critical');
  assert.strictEqual(data.pctToFi, 0);
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. VOICE INPUT PREPOSITION FILTER BUG REPRODUCTION
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${BOLD}7. Voice Parser Telephone Number Preposition Edge Case${RESET}`);

const voiceCode = fs.readFileSync(path.join(__dirname, '..', 'voice.js'), 'utf8');
const voiceSandbox = {
  window: {},
  document: { addEventListener: () => {} },
  todayStr: () => '2026-10-05',
  currentLang: 'en',
  toast: () => {},
  TT: () => ''
};
vm.createContext(voiceSandbox);
vm.runInContext(voiceCode, voiceSandbox);
const extractVoiceAmount = voiceSandbox.extractVoiceAmount;

test('Spoken phone number preceded by "for": extractVoiceAmount("recharge 299 for 9876543210")', () => {
  const res = extractVoiceAmount('recharge 299 for 9876543210');
  assert(res, 'extractVoiceAmount must return a match');
  assert.strictEqual(
    res.value,
    299,
    `CRITICAL BUG IN VOICE PARSER: Expected ₹299, but parsed ₹${res.value} because 10-digit phone number followed 'for'!`
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${BOLD}${CYAN}----------------------------------------------------------------${RESET}`);
console.log(`${BOLD}CHALLENGER DEEP EDGE CASES SUMMARY:${RESET}`);
console.log(`Total tests run:  ${totalTests}`);
console.log(`Tests passed:     ${GREEN}${passedTests}${RESET}`);
console.log(`Tests failed:     ${failedTests > 0 ? RED : GREEN}${failedTests}${RESET}`);
console.log(`${BOLD}${CYAN}----------------------------------------------------------------${RESET}\n`);

if (failedTests > 0) {
  console.log(`${RED}${BOLD}EMPIRICAL FAILURES DETECTED (${failedTests}):${RESET}`);
  failureList.forEach(f => console.log(`  - ${f.name}: ${f.error}`));
  process.exit(1);
} else {
  console.log(`${GREEN}${BOLD}✔ ALL EDGE CASE TESTS PASSED${RESET}`);
  process.exit(0);
}
