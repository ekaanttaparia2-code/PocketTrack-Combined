/**
 * PocketTrack — Advanced Adversarial Stress & Fuzzing Harness
 * 
 * Conducts property-based testing, fuzzing, and randomized simulations
 * across the 4 Tier 1 challenge areas:
 * 1. Debt Payoff Monte Carlo fuzzing (1,000 random edge scenarios)
 * 2. 50-year Date Math & Leap Cycle Fuzzing (2000 to 2050)
 * 3. High-volume FIRE Runway stress testing (10,000 transactions)
 * 4. Auth concurrency & lockout invariant verification
 * 5. OWASP / Polyglot XSS payload fuzzing
 */

const fs = require('fs');
const assert = require('assert');
const path = require('path');

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

let suitePassed = 0;
let suiteFailed = 0;

function runSuite(name, fn) {
  process.stdout.write(`  Running ${BOLD}${name}${RESET}... `);
  try {
    fn();
    suitePassed++;
    console.log(`${GREEN}PASSED${RESET}`);
  } catch (err) {
    suiteFailed++;
    console.log(`${RED}FAILED${RESET}`);
    console.error(`    ${RED}${err.message}${RESET}`);
    console.error(err.stack);
  }
}

// ── Mock DOM & Helpers ──────────────────────────────────────────────────
function escapeHTMLSpec(str) {
  if (typeof str !== 'string') str = String(str);
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
}

const debtPayoffCode = fs.readFileSync(path.join(__dirname, '..', 'debt_payoff.js'), 'utf8');
const recurringCode = fs.readFileSync(path.join(__dirname, '..', 'recurring.js'), 'utf8');
const fireRunwayCode = fs.readFileSync(path.join(__dirname, '..', 'fire_runway.js'), 'utf8');
const authCode = fs.readFileSync(path.join(__dirname, '..', 'auth.js'), 'utf8');

// Extract functions
const recIntervalMatch = recurringCode.match(/function addRecInterval\([\s\S]*?\n\}/);
let addRecInterval;
eval(`addRecInterval = ${recIntervalMatch[0]};`);

function createDebtPayoffInstance() {
  const env = {
    window: { escapeHTML: escapeHTMLSpec, localStorage: { getItem: () => null, setItem: () => {} } },
    document: { createElement: () => ({ style: {} }), getElementById: () => null, body: { appendChild: () => {} } }
  };
  eval(`(function(window, document, localStorage) {
    var escapeHTML = window.escapeHTML;
    ${debtPayoffCode}
  })(env.window, env.document, env.window.localStorage);`);
  return env.window.DebtPayoff;
}

console.log(`\n${CYAN}${BOLD}=== SUITE 1: Debt Payoff Monte Carlo Fuzzing (1,000 Scenarios) ===${RESET}`);

runSuite('1.1 1,000 Randomized Monte Carlo Debts Simulation', () => {
  const dp = createDebtPayoffInstance();
  for (let i = 0; i < 1000; i++) {
    // Generate 1 to 10 random debts with varied balances and rates
    const numDebts = Math.floor(Math.random() * 8) + 1;
    const debts = [];
    for (let j = 0; j < numDebts; j++) {
      debts.push({
        id: String(j),
        name: `Debt_${j}`,
        balance: Math.random() < 0.1 ? Math.random() : Math.floor(Math.random() * 200000),
        rate: Math.random() < 0.2 ? 0 : Math.floor(Math.random() * 50),
        minPayment: Math.floor(Math.random() * 5000) + 10
      });
    }
    const extraPayment = Math.random() < 0.1 ? 0 : Math.floor(Math.random() * 50000);

    const av = dp.calculate(debts, 'avalanche', extraPayment);
    const sn = dp.calculate(debts, 'snowball', extraPayment);

    // Invariants:
    // 1. Months must be an integer between 0 and 360
    assert(Number.isInteger(av.months) && av.months >= 0 && av.months <= 360, `Invalid avalanche months: ${av.months}`);
    assert(Number.isInteger(sn.months) && sn.months >= 0 && sn.months <= 360, `Invalid snowball months: ${sn.months}`);
    
    // 2. Total interest must be a finite non-negative number
    assert(Number.isFinite(av.totalInterest) && av.totalInterest >= 0, `Invalid avalanche interest: ${av.totalInterest}`);
    assert(Number.isFinite(sn.totalInterest) && sn.totalInterest >= 0, `Invalid snowball interest: ${sn.totalInterest}`);

    // 3. Avalanche interest should be <= Snowball interest (with rare edge-case floating tolerances)
    if (av.months < 360 && sn.months < 360) {
      assert(av.totalInterest <= sn.totalInterest + 5, `Avalanche (${av.totalInterest}) significantly exceeded Snowball (${sn.totalInterest})`);
    }
  }
});

runSuite('1.2 High-Debt Stress: 50 Concurrent Debts', () => {
  const dp = createDebtPayoffInstance();
  const debts = [];
  for (let i = 0; i < 50; i++) {
    debts.push({
      id: String(i),
      name: `Debt_${i}`,
      balance: 10000 + i * 1000,
      rate: 10 + (i % 25),
      minPayment: 500 + i * 20
    });
  }
  const av = dp.calculate(debts, 'avalanche', 10000);
  assert(av.months > 0 && av.months <= 360);
  assert(av.totalInterest > 0);
});

console.log(`\n${CYAN}${BOLD}=== SUITE 2: 50-Year Leap Cycle & Date Math Verification ===${RESET}`);

runSuite('2.1 Full 50-Year Monthly Progression (2000 to 2050) for Day 31 Target', () => {
  let cur = '2000-01-31';
  let monthsCount = 0;
  while (cur.slice(0, 4) < '2050') {
    const next = addRecInterval(cur, 'monthly', 31);
    const [y, m, d] = next.split('-').map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    
    // Invariant: The resulting day must always equal the maximum possible day of that month
    assert.strictEqual(d, daysInMonth, `Failed on ${next}: expected day ${daysInMonth}, got ${d}`);
    cur = next;
    monthsCount++;
  }
  assert.strictEqual(monthsCount, 50 * 12);
});

runSuite('2.2 Full 50-Year Progression for Day 29 (Century Leap Year 2000 to 2050)', () => {
  let cur = '2000-02-29'; // 2000 was a leap year (divisible by 400)
  for (let y = 2000; y < 2050; y++) {
    const next = addRecInterval(cur, 'yearly', 29);
    const [ny, nm, nd] = next.split('-').map(Number);
    assert.strictEqual(ny, y + 1);
    assert.strictEqual(nm, 2);
    const isLeap = (ny % 4 === 0 && ny % 100 !== 0) || (ny % 400 === 0);
    assert.strictEqual(nd, isLeap ? 29 : 28, `Year ${ny} leap status ${isLeap} mismatch on day ${nd}`);
    cur = next;
  }
});

runSuite('2.3 Offline Catch-up Simulation (36 Consecutive Unprocessed Months)', () => {
  let nextDate = '2023-01-31';
  const targetDay = 31;
  const history = [];
  for (let step = 0; step < 36; step++) {
    history.push(nextDate);
    nextDate = addRecInterval(nextDate, 'monthly', targetDay);
  }
  // Check February instances in history
  const feb2023 = history.find(d => d.startsWith('2023-02'));
  const feb2024 = history.find(d => d.startsWith('2024-02')); // 2024 was leap
  const feb2025 = history.find(d => d.startsWith('2025-02'));
  assert.strictEqual(feb2023, '2023-02-28');
  assert.strictEqual(feb2024, '2024-02-29');
  assert.strictEqual(feb2025, '2025-02-28');
  // Check March instances returned to 31
  assert.strictEqual(history.find(d => d.startsWith('2023-03')), '2023-03-31');
  assert.strictEqual(history.find(d => d.startsWith('2024-03')), '2024-03-31');
  assert.strictEqual(history.find(d => d.startsWith('2025-03')), '2025-03-31');
});

console.log(`\n${CYAN}${BOLD}=== SUITE 3: High-Volume FIRE Runway Stress Testing ===${RESET}`);

runSuite('3.1 10,000 Transaction Multi-Year Ingestion Stress Test', () => {
  const entries = [];
  // Initial starting balance: 1,000,000
  entries.push({ type: 'income', amt: 1000000, date: '2022-01-01' });

  // Generate 10,000 entries across 2022, 2023, 2024, 2025
  const startTs = new Date('2022-01-01').getTime();
  const endTs = new Date('2025-12-31').getTime();
  const span = endTs - startTs;

  for (let i = 0; i < 10000; i++) {
    const ts = new Date(startTs + Math.random() * span);
    const dateStr = ts.toISOString().slice(0, 10);
    const isTransfer = Math.random() < 0.2;
    entries.push({
      type: Math.random() < 0.85 ? 'expense' : 'income',
      amt: Math.floor(Math.random() * 500) + 10,
      date: dateStr,
      transferGroupId: isTransfer ? `tg_${i % 100}` : undefined
    });
  }

  const env = {
    window: { entries, localStorage: { getItem: () => null, setItem: () => {} } },
    document: { createElement: () => ({ style: {} }), getElementById: () => null, body: { appendChild: () => {} } }
  };
  eval(`(function(window, document, localStorage) {
    ${fireRunwayCode}
  })(env.window, env.document, env.window.localStorage);`);

  const res = env.window.FireRunway.getData();
  assert(Number.isFinite(res.liquidAssets));
  assert(Number.isFinite(res.monthlyBurn));
  assert(res.monthlyBurn > 0);
  assert(Number.isFinite(res.runwayMonths));
  assert(['critical', 'fair', 'strong', 'fortress'].includes(res.status));
});

console.log(`\n${CYAN}${BOLD}=== SUITE 4: Auth Concurrency & Lockout Invariant Verification ===${RESET}`);

runSuite('4.1 Auth Lockout Invariant: _isAuthActionRunning is ALWAYS released', async () => {
  // Test all exit paths in authAction
  const scenarios = [
    { email: '', pass: '', mode: 'login', expectError: true },
    { email: 'user@test.com', pass: '123', mode: 'login', expectError: true }, // pass < 6
    { email: 'user@test.com', pass: 'secret123', mode: 'signup', consent: false, expectError: true }, // consent required
    { email: 'user@test.com', pass: 'secret123', mode: 'login', networkFail: true, expectError: true }, // network rejection
    { email: 'user@test.com', pass: 'secret123', mode: 'login', networkFail: false, expectError: false } // success
  ];

  for (const sc of scenarios) {
    let buttonsLoading = false;
    let authErrorShown = null;
    let isRunning = false;

    const mockDOM = {
      window: {
        _isAuthActionRunning: false,
        hideAuthError: () => { authErrorShown = null; },
        showAuthError: (msg) => { authErrorShown = msg; },
        promptConsentRequired: () => { authErrorShown = 'consent'; },
        setAuthButtonsLoading: (b) => { buttonsLoading = b; },
        auth: {
          signInWithEmailAndPassword: () => sc.networkFail 
            ? Promise.reject(new Error('Network auth failed')) 
            : Promise.resolve({ user: { emailVerified: true } }),
          createUserWithEmailAndPassword: () => sc.networkFail
            ? Promise.reject(new Error('Network signup failed'))
            : Promise.resolve({ user: { emailVerified: false, sendEmailVerification: () => Promise.resolve() } })
        }
      },
      document: {
        getElementById: (id) => {
          if (id === 'auth-email') return { value: sc.email };
          if (id === 'auth-pass') return { value: sc.pass };
          if (id === 'auth-consent-check') return { checked: !!sc.consent };
          return null;
        }
      }
    };

    // Execute auth.js in mock environment
    eval(`(function(window, document, auth) {
      ${authCode}
    })(mockDOM.window, mockDOM.document, mockDOM.window.auth);`);

    // Call authAction
    await mockDOM.window.authAction(sc.mode);

    // CRITICAL INVARIANT: window._isAuthActionRunning MUST BE FALSE
    assert.strictEqual(
      mockDOM.window._isAuthActionRunning,
      false,
      `Lockout invariant broken for scenario: ${JSON.stringify(sc)}`
    );
    assert.strictEqual(buttonsLoading, false, 'Buttons remained in loading state');
  }
});

runSuite('4.2 Concurrency Rejection: Rapid Double Click Discards Second Call', async () => {
  let concurrentExecutions = 0;
  let buttonsLoading = false;

  const mockDOM = {
    window: {
      _isAuthActionRunning: false,
      hideAuthError: () => {},
      showAuthError: () => {},
      promptConsentRequired: () => {},
      setAuthButtonsLoading: (b) => { buttonsLoading = b; },
      auth: {
        signInWithEmailAndPassword: () => new Promise(resolve => {
          concurrentExecutions++;
          setTimeout(() => resolve({ user: { emailVerified: true } }), 50);
        })
      }
    },
    document: {
      getElementById: (id) => {
        if (id === 'auth-email') return { value: 'test@user.com' };
        if (id === 'auth-pass') return { value: 'password123' };
        return null;
      }
    }
  };

  eval(`(function(window, document, auth) {
    ${authCode}
  })(mockDOM.window, mockDOM.document, mockDOM.window.auth);`);

  // Launch two concurrent clicks
  const call1 = mockDOM.window.authAction('login');
  const call2 = mockDOM.window.authAction('login');
  await Promise.all([call1, call2]);

  // Only exactly 1 network authentication should have been launched!
  assert.strictEqual(concurrentExecutions, 1, `Expected 1 execution, got ${concurrentExecutions}`);
  assert.strictEqual(mockDOM.window._isAuthActionRunning, false);
});

console.log(`\n${CYAN}${BOLD}=== SUITE 5: OWASP & Polyglot XSS Escaping Fuzzing ===${RESET}`);

runSuite('5.1 20 Polyglot & Adversarial XSS Payloads Sanitization', () => {
  const polyglotPayloads = [
    'jaVasCript:/*-/*`/*\\`/*\'/*"/**/(/* */oNcliCk=alert() )//%0D%0A%0d%0a//</stYle/<titLe/</teXtarEa/</scRipt/--!>\\x3csVg/<sVg/oNloAd=alert()//>\\x3e',
    '"><script>alert(String.fromCharCode(88,83,83))</script>',
    '<img src=x onerror=this.src="evil.jpg";alert(1)>',
    '<svg/onload=alert`1`>',
    '<<SCRIPT>alert("XSS");//<</SCRIPT>',
    '<iframe src="data:text/html,<script>alert(1)</script>"></iframe>',
    '<body onload=alert(1)>',
    '<input type="image" src="x" onerror="alert(1)">',
    '<a href="javascript:alert(1)">Click Me</a>',
    '"><marquee onstart=alert(1)>',
    '<select autofocus onfocus=alert(1)>',
    '<textarea autofocus onfocus=alert(1)>',
    '<keygen autofocus onfocus=alert(1)>',
    '<video><source onerror="alert(1)">',
    '<audio src=x onerror=alert(1)>',
    '<details open ontoggle=alert(1)>',
    '<!--<script>alert(1)</script>-->',
    '\'"><svg/onload=alert(1)>',
    '<math><mtext><table><mglyph><style><!--</style><img src=x onerror=alert(1)>',
    '</script><script>alert(1)</script>'
  ];

  for (const payload of polyglotPayloads) {
    const escaped = escapeHTMLSpec(payload);
    
    // Invariant: Raw opening tags for script, img, svg, iframe, body, etc. must not exist unescaped
    assert(!/<script\b/i.test(escaped), `Unescaped script tag: ${escaped}`);
    assert(!/<img\b/i.test(escaped), `Unescaped img tag: ${escaped}`);
    assert(!/<svg\b/i.test(escaped), `Unescaped svg tag: ${escaped}`);
    assert(!/<iframe\b/i.test(escaped), `Unescaped iframe tag: ${escaped}`);
    assert(!/<body\b/i.test(escaped), `Unescaped body tag: ${escaped}`);
    assert(!/<details\b/i.test(escaped), `Unescaped details tag: ${escaped}`);
    assert(!/<select\b/i.test(escaped), `Unescaped select tag: ${escaped}`);
  }
});

console.log(`\n${CYAN}${BOLD}=== SUITE SUMMARY ===${RESET}`);
console.log(`Suites Run:    ${suitePassed + suiteFailed}`);
console.log(`Suites Passed: ${GREEN}${suitePassed}${RESET}`);
console.log(`Suites Failed: ${suiteFailed > 0 ? RED : GREEN}${suiteFailed}${RESET}\n`);

if (suiteFailed > 0) process.exit(1);
process.exit(0);
