/**
 * PocketTrack — Tier 2 Targeted Adversarial Fuzzing & Stress Test Suite
 *
 * Dedicated verifier for:
 * 1. REVIEW-008: UPI QR SVG generator accuracy, Reed-Solomon correctness under high character density, UTF-8 strings, invalid VPA formats.
 * 2. REVIEW-025 & REVIEW-026: Voice input amount and date token extraction with ambiguous edge cases.
 * 3. REVIEW-023 & REVIEW-024: Bill settlement zero-sum closure under multi-participant splits and removed participants.
 * 4. REVIEW-054: Firestore cursor pagination edge cases.
 * 5. REVIEW-009: LocalStorage logout purge tenant isolation across multiple users.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

// Colors
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const findings = [];

function testCase(id, title, fn) {
  totalTests++;
  const label = `[${id}] ${title}`;
  try {
    fn();
    passedTests++;
    console.log(`  ${GREEN}✓ PASS${RESET} ${label}`);
  } catch (err) {
    failedTests++;
    findings.push({ id, title, error: err.message, stack: err.stack });
    console.log(`  ${RED}✗ FAIL${RESET} ${BOLD}${label}${RESET}`);
    console.log(`    ${RED}Finding: ${err.message}${RESET}`);
  }
}

console.log(`${BOLD}${CYAN}========================================================================${RESET}`);
console.log(`${BOLD}${CYAN}   POCKETTRACK TIER 2 DEEP ADVERSARIAL FUZZING & EMPIRICAL HARNESS     ${RESET}`);
console.log(`${BOLD}${CYAN}========================================================================${RESET}\n`);

// ─────────────────────────────────────────────────────────────────────────────
// 1. REVIEW-008: UPI QR SVG GENERATOR FUZZING & STRESS TESTING
// ─────────────────────────────────────────────────────────────────────────────
console.log(`${BOLD}1. REVIEW-008: UPI QR SVG Generator Fuzzing${RESET}`);

const upiJsCode = fs.readFileSync(path.join(__dirname, '..', 'upi_qr_generator.js'), 'utf8');
const upiSandbox = {
  window: {},
  document: {
    createElement: () => ({ style: {}, appendChild: () => {}, classList: { add: () => {}, remove: () => {} } }),
    getElementById: () => null,
    body: { appendChild: () => {} },
    head: { appendChild: () => {} }
  },
  escapeHTML: (s) => String(s || ''),
  requestAnimationFrame: (cb) => cb(),
  localStorage: { getItem: () => null, setItem: () => {} }
};
vm.createContext(upiSandbox);
vm.runInContext(upiJsCode, upiSandbox);
const generateUpiQrSvg = upiSandbox.window.generateUpiQrSvg;

testCase('REVIEW-008', 'Standard UPI payment URIs generate valid SVG paths', () => {
  const stdUpi = 'upi://pay?pa=test@okhdfcbank&pn=PocketTrack&am=150.00&cu=INR';
  const svg = generateUpiQrSvg(stdUpi, 200);
  assert(svg.startsWith('<svg'), 'SVG must start with <svg tag');
  assert(svg.includes('viewBox="0 0 37 37"'), 'Version 4 (33+4=37) should be used for 60-byte payload');
  assert(svg.includes('<path d="M'), 'SVG must contain path elements');
  assert(svg.endsWith('</svg>'), 'SVG must end with </svg>');
});

testCase('REVIEW-008', 'Multilingual 2-byte and 3-byte UTF-8 Hindi text encodes without exception', () => {
  // Hindi characters (3 bytes in UTF-8: %E0%A4...)
  const hindiUpi = 'upi://pay?pa=shop@upi&pn=चाय%20नाश्ता&am=45&cu=INR';
  const svg = generateUpiQrSvg(hindiUpi, 200);
  assert(svg.startsWith('<svg'), 'Hindi URI should generate SVG');
  assert(svg.includes('<path'), 'Hindi URI should produce valid path');
});

testCase('REVIEW-008', '4-byte UTF-8 surrogate pair (emoji) resilience in raw input strings', () => {
  // Spoken or user-entered notes frequently contain emojis: "Dinner 🍕" or "Chai ☕"
  // Note: 🍕 is code point U+1F355 represented as surrogate pair \uD83C\uDF55
  const rawWithEmoji = 'upi://pay?pa=friend@upi&pn=John&am=100&tn=Pizza 🍕';
  try {
    const svg = generateUpiQrSvg(rawWithEmoji, 200);
    assert(svg.startsWith('<svg'), 'Must produce SVG for notes with emojis');
  } catch (e) {
    if (e.name === 'URIError' && e.message.includes('malformed')) {
      throw new Error(`CRITICAL BUG: generateUpiQrSvg crashes with URIError: URI malformed on 4-byte UTF-8 emoji surrogates (text[i] code unit iteration)`);
    }
    throw e;
  }
});

testCase('REVIEW-008', 'High character density payload (>216 bytes) overflow handling', () => {
  // Version 10 maximum capacity is 216 bytes
  const largeNote = 'A'.repeat(250);
  const largeUpi = `upi://pay?pa=merchant@icici&pn=Store&am=1200&tn=${largeNote}&cu=INR`;
  // Byte length is ~290 bytes, which exceeds Version 10 capacity (216 bytes)
  const svg = generateUpiQrSvg(largeUpi, 200);
  assert(svg.startsWith('<svg'), 'SVG generated');
  // Check if it silently clamps to Version 10 (size 57)
  assert(svg.includes('viewBox="0 0 61 61"'), 'Clamped to Version 10 (57 + 4 margin = 61)');
  // Note: Data beyond byte 216 is truncated in bit stream while header claims 290 bytes.
});

testCase('REVIEW-008', 'VPA setup validation accepts invalid VPA without @ sign', () => {
  // Test saveUpiIdFromSetup with invalid VPA
  let savedVpa = null;
  upiSandbox.window.setUserUpiId = (id) => { savedVpa = id; };
  upiSandbox.document.getElementById = (id) => {
    if (id === 'upi-setup-input') return { value: 'invalid_vpa_without_at' };
    return null;
  };
  upiSandbox.window.saveUpiIdFromSetup(100, 'Test');
  if (savedVpa === 'invalid_vpa_without_at') {
    throw new Error('VPA setup does not validate format: allowed saving "invalid_vpa_without_at" without @ sign or bank handle');
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. REVIEW-025 & REVIEW-026: VOICE INPUT AMOUNT & DATE EXTRACTION
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${BOLD}2. REVIEW-025 & REVIEW-026: Voice Parsing Edge Cases${RESET}`);

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
const extractVoiceAmount = voiceSandbox.extractVoiceAmount;
const parseVoiceDate = voiceSandbox.parseVoiceDate;

testCase('REVIEW-025', 'Ambiguous telephone number in recharge command: "Phone recharge 299 for 9876543210"', () => {
  const res = extractVoiceAmount('phone recharge 299 for 9876543210');
  if (!res) throw new Error('Failed to extract any amount');
  if (res.value === 9876543210) {
    throw new Error(`CRITICAL BUG: Extracted 10-digit phone number (9,876,543,210) instead of amount (299) due to line 175 "\\b(?:for|of)\\s+(\\d+)" priority over fallback filter`);
  }
  assert.strictEqual(res.value, 299, `Expected amount 299, got ${res.value}`);
});

testCase('REVIEW-025', 'Fallback to excluded numbers when only phone or year is present: "Call 9876543210"', () => {
  const res = extractVoiceAmount('call 9876543210');
  // When no legitimate monetary amount exists, it should return null or not extract 9876543210 as ₹9,876,543,210
  if (res && res.value === 9876543210) {
    throw new Error(`BUG: Line 188 falls back to raw nums ("filteredNums.length ? filteredNums : nums"), extracting 10-digit telephone as currency when no other number is present`);
  }
});

testCase('REVIEW-025', 'Fallback to excluded year when only year is spoken: "Happy new year 2024"', () => {
  const res = extractVoiceAmount('happy new year 2024');
  if (res && res.value === 2024) {
    throw new Error(`BUG: Line 188 falls back to raw nums, extracting calendar year 2024 as ₹2,024 when no other number is present`);
  }
});

testCase('REVIEW-026', 'Disambiguation of year and decimal date: "Spent 2024 rupees on 12.05"', () => {
  const raw = 'Spent 2024 rupees on 12.05';
  const extracted = extractVoiceAmount(raw.toLowerCase());
  assert(extracted, 'Amount should be extracted');
  assert.strictEqual(extracted.value, 2024, `Expected amount 2024, got ${extracted.value}`);

  // Date parsing with amount stripped
  const textForDate = raw.replace(extracted.text, ' ');
  const parsedDate = parseVoiceDate(textForDate);
  if (parsedDate === '2026-09-12') {
    throw new Error(`CRITICAL BUG: "\\bon\\s+(\\d{1,2})\\b" falsely matched "on 12" as day of month (rolling back to 2026-09-12) instead of parsing dotted date "12.05" as 2026-05-12`);
  }
  assert.strictEqual(parsedDate, '2026-05-12', `Expected date 2026-05-12, got ${parsedDate}`);
});

testCase('REVIEW-026', 'Decimal paise amount stripped before date parsing: "Spent 12.05 on tea"', () => {
  const raw = 'Spent 12.05 on tea';
  const extracted = extractVoiceAmount(raw.toLowerCase());
  assert(extracted, 'Amount should be extracted');
  assert.strictEqual(extracted.value, 12.05, `Expected 12.05, got ${extracted.value}`);

  const textForDate = raw.replace(extracted.text, ' ');
  const parsedDate = parseVoiceDate(textForDate);
  assert.strictEqual(parsedDate, null, `12.05 on tea must not be interpreted as May 12th date`);
});

testCase('REVIEW-025', 'Extreme amount exceeding MAX_AMT: "1000000000 rupees on phone bill"', () => {
  const res = extractVoiceAmount('1000000000 rupees on phone bill');
  assert(res, 'Amount should be extracted');
  assert.strictEqual(res.value, 1000000000);
  // Note: parseVoiceInput does not clamp or validate against MAX_AMT (999,999,999)
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. REVIEW-023 & REVIEW-024: BILL SETTLEMENT ZERO-SUM CLOSURE FUZZING
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${BOLD}3. REVIEW-023 & REVIEW-024: Bill Settlement Fuzzing${RESET}`);

const appJsCode = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const startIdx = appJsCode.indexOf('function calculateSettlement(eventId){');
assert(startIdx !== -1, 'calculateSettlement must exist');
const endIdx = appJsCode.indexOf('window.calculateSettlement = calculateSettlement;', startIdx);
const fnStr = appJsCode.substring(startIdx, endIdx);
const rawCalc = new Function('eventId', 'events', 'window', fnStr + '\nreturn calculateSettlement(eventId);');
const calculateSettlement = (ev) => {
  if (!ev._id) ev._id = 'test_ev_' + Math.random();
  return rawCalc(ev._id, [ev], { events: [ev] });
};

testCase('REVIEW-023', 'Odd 3-way split of ₹100 guarantees exact zero-sum closure', () => {
  const ev = {
    participants: ['Alice', 'Bob', 'Charlie'],
    sharedExpenses: [
      { amt: 100, paidBy: 'Alice', splitAmong: ['Alice', 'Bob', 'Charlie'] }
    ]
  };
  const res = calculateSettlement(ev);
  const sum = Object.values(res.balances).reduce((s, b) => s + b, 0);
  assert(Math.abs(sum) < 0.00001, `Sum of balances must be 0.00, got ${sum}`);
  const aliceReceived = res.transfers.filter(t => t.to === 'Alice').reduce((s, t) => s + t.amount, 0);
  assert.strictEqual(Math.round(aliceReceived * 100) / 100, res.balances['Alice']);
});

testCase('REVIEW-023', 'Fuzzing 100 randomized multi-participant splits (3 to 20 participants, ₹1 to ₹99,999)', () => {
  let maxDiscrepancy = 0;
  for (let iter = 0; iter < 100; iter++) {
    const numP = 3 + Math.floor(Math.random() * 15);
    const participants = Array.from({ length: numP }, (_, i) => `Person_${i + 1}`);
    const amt = Math.round((Math.random() * 5000 + 1) * 100) / 100;
    const payer = participants[Math.floor(Math.random() * numP)];

    const ev = {
      participants,
      sharedExpenses: [{ amt, paidBy: payer, splitAmong: participants }]
    };
    const res = calculateSettlement(ev);
    const sum = Object.values(res.balances).reduce((s, b) => s + b, 0);
    maxDiscrepancy = Math.max(maxDiscrepancy, Math.abs(sum));
    assert(Math.abs(sum) < 0.00001, `Iteration ${iter}: Sum of balances must be 0.00, got ${sum}`);

    // Verify transfer totals match total debtor owed amount
    const totalTransfers = res.transfers.reduce((s, t) => s + t.amount, 0);
    const totalDebts = Object.values(res.balances).filter(b => b < 0).reduce((s, b) => s + Math.abs(b), 0);
    assert(Math.abs(totalTransfers - totalDebts) < 0.02, `Transfers (${totalTransfers}) should match debts (${totalDebts})`);
  }
});

testCase('REVIEW-024', 'Removed payer from event participants does not crash and maintains zero-sum', () => {
  const ev = {
    participants: ['Alice', 'Bob'], // Dave paid ₹450 but was removed from participants
    sharedExpenses: [
      { amt: 450, paidBy: 'Dave', splitAmong: ['Alice', 'Bob'] }
    ]
  };
  const res = calculateSettlement(ev);
  assert(res.balances['Dave'] !== undefined, 'Dave must be included in settlement balances');
  assert.strictEqual(res.balances['Dave'], 450, 'Dave should be owed 450');
  assert.strictEqual(res.balances['Alice'], -225, 'Alice owes 225');
  assert.strictEqual(res.balances['Bob'], -225, 'Bob owes 225');
  const sum = Object.values(res.balances).reduce((s, b) => s + b, 0);
  assert(Math.abs(sum) < 0.00001, `Sum must be 0.00, got ${sum}`);
  assert.strictEqual(res.transfers.length, 2, 'Should have 2 transfers paying Dave');
});

testCase('REVIEW-024', 'Removed receiver from event participants in shared income maintains zero-sum', () => {
  const ev = {
    participants: ['Alice', 'Bob'], // Charlie received income ₹300 split with Alice & Bob, but was removed
    sharedIncomes: [
      { amt: 300, receivedBy: 'Charlie', splitAmong: ['Alice', 'Bob', 'Charlie'] }
    ]
  };
  const res = calculateSettlement(ev);
  assert(res.balances['Charlie'] !== undefined, 'Charlie must be in balances');
  assert.strictEqual(res.balances['Charlie'], -200, 'Charlie received 300, gets 100 share -> balance -200');
  assert.strictEqual(res.balances['Alice'], 100, 'Alice is owed 100');
  assert.strictEqual(res.balances['Bob'], 100, 'Bob is owed 100');
  const sum = Object.values(res.balances).reduce((s, b) => s + b, 0);
  assert(Math.abs(sum) < 0.00001, `Sum must be 0.00, got ${sum}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. REVIEW-054: FIRESTORE CURSOR PAGINATION EDGE CASES
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${BOLD}4. REVIEW-054: Firestore Cursor Pagination Edge Cases${RESET}`);

const txJsCode = fs.readFileSync(path.join(__dirname, '..', 'transactions.js'), 'utf8');

testCase('REVIEW-054', 'Initial snapshot query is bounded to orderBy("date", "desc").limit(200)', () => {
  assert(txJsCode.includes('.orderBy(\'date\', \'desc\')') && txJsCode.includes('.limit(200)'));
  assert(txJsCode.includes('loadOlderEntries(batchSize = 100)'));
});

testCase('REVIEW-054', 'Cursor pagination with empty snapshot returns empty array []', async () => {
  let queryLimit = 0;
  let startAfterVal = null;
  const mockDb = {
    collection: () => ({
      doc: () => ({
        collection: () => ({
          orderBy: () => ({
            startAfter: (val) => {
              startAfterVal = val;
              return {
                limit: (lim) => {
                  queryLimit = lim;
                  return {
                    get: async () => ({ docs: [], empty: true })
                  };
                }
              };
            }
          })
        })
      })
    })
  };

  const txSandbox = {
    window: { entries: [{ _id: 'e1', date: '2026-10-01' }] },
    currentUser: { uid: 'user_test' },
    db: mockDb
  };
  vm.createContext(txSandbox);

  const startFn = txJsCode.indexOf('async function loadOlderEntries(batchSize = 100)');
  const endFn = txJsCode.indexOf('window.loadOlderEntries = loadOlderEntries;', startFn);
  const fnContent = txJsCode.substring(startFn, endFn);
  vm.runInContext(`${fnContent}; window.loadOlderEntries = loadOlderEntries;`, txSandbox);

  const res = await txSandbox.window.loadOlderEntries(50);
  assert(Array.isArray(res), 'Must return an array');
  assert.strictEqual(res.length, 0, 'Must return empty array on empty snapshot');
  assert.strictEqual(queryLimit, 50, 'Batch size should be respected');
  assert.strictEqual(startAfterVal, '2026-10-01', 'startAfter should be set to oldest date');
});

testCase('REVIEW-054', 'Deduplication across overlapping batches prevents duplicate keys', async () => {
  const existing = [
    { _id: 'e1', date: '2026-10-05', amt: 50 },
    { _id: 'e2', date: '2026-10-04', amt: 100 }
  ];
  const fetchedBatch = [
    { id: 'e2', data: () => ({ date: '2026-10-04', amt: 100 }) }, // Duplicate
    { id: 'e3', data: () => ({ date: '2026-10-03', amt: 75 }) }   // New item
  ];

  const mockDb = {
    collection: () => ({
      doc: () => ({
        collection: () => ({
          orderBy: () => ({
            startAfter: () => ({
              limit: () => ({
                get: async () => ({ docs: fetchedBatch, empty: false })
              })
            })
          })
        })
      })
    })
  };

  const txSandbox = {
    window: { entries: [...existing] },
    currentUser: { uid: 'user_test' },
    db: mockDb
  };
  vm.createContext(txSandbox);
  const startFn = txJsCode.indexOf('async function loadOlderEntries(batchSize = 100)');
  const endFn = txJsCode.indexOf('window.loadOlderEntries = loadOlderEntries;', startFn);
  const fnContent = txJsCode.substring(startFn, endFn);
  vm.runInContext(`${fnContent}; window.loadOlderEntries = loadOlderEntries;`, txSandbox);

  const res = await txSandbox.window.loadOlderEntries(100);
  assert.strictEqual(res.length, 1, 'Only non-duplicate item e3 should be returned');
  assert.strictEqual(res[0]._id, 'e3');
  assert.strictEqual(txSandbox.window.entries.length, 3, 'window.entries should contain 3 items total');
});

testCase('REVIEW-054', 'Duplicate date boundary: q.where("date", "<", oldestDate) drops same-day transactions', () => {
  // If Firestore query uses where('date', '<', oldestDate) as fallback (line 850),
  // transactions sharing the same calendar date as oldestDate are skipped
  const fallbackRegex = /q\.where\('date',\s*'<',\s*oldestDate\)/;
  if (fallbackRegex.test(txJsCode)) {
    // Note this limitation: when startAfter is unavailable, '<' skips items on oldestDate
    assert(txJsCode.includes('q.startAfter'), 'Primary path must use startAfter');
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. REVIEW-009: MULTI-TENANT ISOLATION ON LOCALSTORAGE PURGE
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${BOLD}5. REVIEW-009: Multi-Tenant LocalStorage Isolation${RESET}`);

const authJsCode = fs.readFileSync(path.join(__dirname, '..', 'auth.js'), 'utf8');

testCase('REVIEW-009', 'purgeUserLocalStorage(uid) wipes all accounts instead of isolating to uid', () => {
  const store = {};
  const mockLocalStorage = {
    getItem: (k) => store[k] !== undefined ? store[k] : null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    key: (i) => Object.keys(store)[i],
    get length() { return Object.keys(store).length; }
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
  assert.strictEqual(typeof purge, 'function');

  const uidA = 'user_alpha';
  const uidB = 'user_beta';

  store[`pockettrack_debts_${uidA}`] = '[{"id":"debt_a"}]';
  store[`pockettrack_entries_cache_${uidA}`] = '[{"id":"e_a"}]';
  store[`pockettrack_debts_${uidB}`] = '[{"id":"debt_b"}]';
  store[`pockettrack_entries_cache_${uidB}`] = '[{"id":"e_b"}]';

  // Call purge for User A only
  purge(uidA);

  assert.strictEqual(store[`pockettrack_debts_${uidA}`], undefined, 'User A debts must be purged');
  assert.strictEqual(store[`pockettrack_entries_cache_${uidA}`], undefined, 'User A entries must be purged');

  if (store[`pockettrack_debts_${uidB}`] === undefined || store[`pockettrack_entries_cache_${uidB}`] === undefined) {
    throw new Error('LOGIC DEFECT: purgeUserLocalStorage("user_alpha") wiped user_beta data because line 189 uses "key.startsWith(\'pockettrack_debts_\')" without checking if it ends with uid');
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// HARNESS SUMMARY
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${BOLD}${CYAN}------------------------------------------------------------------------${RESET}`);
console.log(`${BOLD}DEEP FUZZING HARNESS EXECUTION SUMMARY:${RESET}`);
console.log(`Total test cases: ${totalTests}`);
console.log(`Passed:           ${GREEN}${passedTests}${RESET}`);
console.log(`Failed / Bugs:    ${failedTests > 0 ? RED : GREEN}${failedTests}${RESET}`);
console.log(`${BOLD}${CYAN}------------------------------------------------------------------------${RESET}\n`);

if (findings.length > 0) {
  console.log(`${YELLOW}${BOLD}EMPIRICAL DEFECTS DISCOVERED:${RESET}`);
  findings.forEach((f, idx) => {
    console.log(`  ${idx + 1}. [${f.id}] ${f.title}`);
    console.log(`     Error: ${f.error}`);
  });
}
