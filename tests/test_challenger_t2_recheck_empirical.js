/**
 * PocketTrack — Empirical Challenger Tier 2 Recheck Comprehensive Verification Harness
 * Agent: challenger_t2_recheck_2
 *
 * Exhaustively stress-tests:
 * 1. REVIEW-008: upi_qr_generator.js (UTF-8 emojis, TextEncoder fallback, byte overflow, VPA validation)
 * 2. REVIEW-025 & REVIEW-026: voice.js (telephone numbers, calendar years, "for/of" ambiguity, dotted dates)
 * 3. REVIEW-009: auth.js (multi-tenant localStorage purge, peer data isolation, unnamespaced legacy cleanup)
 * 4. REVIEW-054: transactions.js (pagination preservation across real-time snapshot syncs, deduplication, sorting)
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

let passedCount = 0;
let failedCount = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passedCount++;
    console.log(`  ✓ PASS: ${name}`);
  } catch (err) {
    failedCount++;
    failures.push({ name, error: err.message, stack: err.stack });
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    Error: ${err.message}`);
  }
}

async function asyncTest(name, fn) {
  try {
    await fn();
    passedCount++;
    console.log(`  ✓ PASS: ${name}`);
  } catch (err) {
    failedCount++;
    failures.push({ name, error: err.message, stack: err.stack });
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    Error: ${err.message}`);
  }
}

console.log('========================================================================');
console.log('   CHALLENGER T2 RECHECK EMPIRICAL ADVERSARIAL STRESS TEST HARNESS      ');
console.log('========================================================================\n');

// ─────────────────────────────────────────────────────────────────────────────
// 1. DEFECT 1: REVIEW-008 — upi_qr_generator.js
// ─────────────────────────────────────────────────────────────────────────────
console.log('--- [1/4] Testing upi_qr_generator.js (REVIEW-008) ---');

const upiSource = fs.readFileSync(path.join(__dirname, '..', 'upi_qr_generator.js'), 'utf8');

function createUpiSandbox(options = {}) {
  const store = {};
  const toastCalls = [];
  const sandbox = {
    window: {},
    document: {
      createElement: () => ({ style: {}, appendChild: () => {}, classList: { add: () => {}, remove: () => {} } }),
      getElementById: (id) => sandbox._elements && sandbox._elements[id] ? sandbox._elements[id] : null,
      body: { appendChild: () => {} },
      head: { appendChild: () => {} }
    },
    toast: (msg, type) => toastCalls.push({ msg, type }),
    escapeHTML: (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'),
    requestAnimationFrame: (cb) => cb(),
    localStorage: {
      getItem: (k) => store[k] !== undefined ? store[k] : null,
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; }
    },
    currentUser: { uid: 'test_user_upi' },
    _store: store,
    _toastCalls: toastCalls
  };

  if (options.disableTextEncoder) {
    sandbox.TextEncoder = undefined;
  }

  vm.createContext(sandbox);
  vm.runInContext(upiSource, sandbox);
  return sandbox;
}

test('REVIEW-008: Emojis and multi-byte UTF-8 in payment notes (TextEncoder enabled)', () => {
  const sb = createUpiSandbox();
  const emojis = ['🍕', '💸', '☕', '🚀', '🎉', '🔥', '❤️', '💡', '💰'];
  for (const emoji of emojis) {
    const uri = `upi://pay?pa=test@upi&pn=Merchant&tn=Payment for ${emoji}&am=100`;
    const svg = sb.window.generateUpiQrSvg(uri, 200);
    assert(svg.startsWith('<svg'), `SVG generation failed for emoji ${emoji}`);
    assert(svg.includes('<path d="M'), `SVG missing path for emoji ${emoji}`);
  }
});

test('REVIEW-008: Emojis and multi-byte UTF-8 in payment notes (Fallback path without TextEncoder)', () => {
  // Simulate browser environment where TextEncoder is undefined
  const sb = createUpiSandbox({ disableTextEncoder: true });
  const multiByteNotes = [
    'Dinner 🍕 with team',
    'Chai ☕ and samosa',
    'चाय नाश्ता ₹50',
    'Crypto 🚀 to moon 🌕',
    'Compound emojis 👨‍👩‍👧‍👦 test'
  ];
  for (const note of multiByteNotes) {
    const uri = `upi://pay?pa=test@upi&pn=Store&tn=${encodeURIComponent(note)}&am=250`;
    const svg = sb.window.generateUpiQrSvg(uri, 200);
    assert(svg.startsWith('<svg'), `Fallback SVG generation failed for note: ${note}`);
    assert(svg.includes('<path d="M'), `Fallback SVG missing path for note: ${note}`);
  }
});

test('REVIEW-008: High character density and boundary payloads (> 216 bytes)', () => {
  const sb = createUpiSandbox();
  const lengths = [10, 50, 100, 150, 180, 215, 216, 217, 300, 600];
  for (const len of lengths) {
    const payload = 'upi://pay?pa=shop@bank&pn=' + 'X'.repeat(len);
    const svg = sb.window.generateUpiQrSvg(payload, 200);
    assert(svg.startsWith('<svg'), `SVG generation failed for length ${len}`);
    assert(svg.includes('<path d="M'), `SVG path missing for length ${len}`);
  }
});

test('REVIEW-008: VPA format validation in saveUpiIdFromSetup rejects invalid handles', () => {
  const sb = createUpiSandbox();
  const invalidVPAs = [
    '',
    '   ',
    'no_at_symbol',
    '@bank',
    'username@',
    '@',
    'plain_phone_number_9876543210'
  ];

  for (const vpa of invalidVPAs) {
    let saved = null;
    sb.window.setUserUpiId = (id) => { saved = id; };
    sb._elements = {
      'upi-setup-input': { value: vpa }
    };
    sb.window.saveUpiIdFromSetup(100, 'Test');
    assert.strictEqual(saved, null, `Should NOT save invalid VPA: "${vpa}"`);
  }
});

test('REVIEW-008: VPA format validation in saveUpiIdFromSetup accepts valid handles', () => {
  const sb = createUpiSandbox();
  const validVPAs = [
    'john.doe@okaxis',
    '9876543210@paytm',
    'shop@okhdfcbank',
    'merchant_123@icici',
    'user-name@ybl'
  ];

  for (const vpa of validVPAs) {
    let saved = null;
    sb.window.setUserUpiId = (id) => { saved = id; };
    sb._elements = {
      'upi-setup-input': { value: vpa },
      'upi-qr-modal': { innerHTML: '', classList: { add: () => {} } }
    };
    sb.window.saveUpiIdFromSetup(100, 'Test');
    assert.strictEqual(saved, vpa, `Should successfully save valid VPA: "${vpa}"`);
  }
});

test('REVIEW-008: appendUpiSuffix handles existing suffix replacement and fresh appending', () => {
  const sb = createUpiSandbox();
  const inputEl = { value: 'user' };
  sb._elements = { 'upi-setup-input': inputEl };

  sb.window.appendUpiSuffix('@okhdfcbank');
  assert.strictEqual(inputEl.value, 'user@okhdfcbank', 'Should append suffix when none exists');

  sb.window.appendUpiSuffix('@paytm');
  assert.strictEqual(inputEl.value, 'user@paytm', 'Should replace previous suffix with new suffix');
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. DEFECT 2: REVIEW-025 & REVIEW-026 — voice.js
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- [2/4] Testing voice.js (REVIEW-025 & REVIEW-026) ---');

const voiceSource = fs.readFileSync(path.join(__dirname, '..', 'voice.js'), 'utf8');

function createVoiceSandbox() {
  const sandbox = {
    window: {},
    document: { addEventListener: () => {}, getElementById: () => null },
    todayStr: () => '2026-10-05',
    currentLang: 'en',
    toast: () => {},
    TT: () => 'Error'
  };
  vm.createContext(sandbox);
  vm.runInContext(voiceSource, sandbox);
  return sandbox;
}

const vSb = createVoiceSandbox();
const extractVoiceAmount = vSb.extractVoiceAmount;
const parseVoiceDate = vSb.parseVoiceDate;

test('REVIEW-025: Phone numbers in recharge phrases with "for" preposition', () => {
  const testPhrases = [
    { input: 'phone recharge 299 for 9876543210', expected: 299 },
    { input: 'mobile recharge 199 for 9123456789', expected: 199 },
    { input: 'recharge for 9876543210 of 499', expected: 499 },
    { input: 'recharge of 399 for 9876543210', expected: 399 },
    { input: 'paid 666 for phone 9876543210', expected: 666 }
  ];

  for (const { input, expected } of testPhrases) {
    const res = extractVoiceAmount(input.toLowerCase());
    assert(res, `Failed to extract amount from "${input}"`);
    assert.strictEqual(res.value, expected, `Phrase "${input}" extracted ${res.value}, expected ${expected}`);
  }
});

test('REVIEW-025: Calendar years (2020-2035) are filtered from amounts', () => {
  const testPhrases = [
    { input: 'dinner 450 in 2024', expected: 450 },
    { input: 'hotel stay 3200 in 2025', expected: 3200 },
    { input: 'grocery 1500 for 2026 party', expected: 1500 },
    { input: 'flight ticket 5000 in year 2023', expected: 5000 }
  ];

  for (const { input, expected } of testPhrases) {
    const res = extractVoiceAmount(input.toLowerCase());
    assert(res, `Failed to extract amount from "${input}"`);
    assert.strictEqual(res.value, expected, `Phrase "${input}" extracted ${res.value}, expected ${expected}`);
  }
});

test('REVIEW-025: Standalone phone number or calendar year returns null', () => {
  const standaloneInputs = [
    'call 9876543210',
    'phone 9123456789',
    'contact 9988776655',
    'happy new year 2024',
    'welcome to 2025',
    'event in 2026'
  ];

  for (const input of standaloneInputs) {
    const res = extractVoiceAmount(input.toLowerCase());
    assert.strictEqual(res, null, `Standalone non-currency input "${input}" should return null, got ${JSON.stringify(res)}`);
  }
});

test('REVIEW-026: Dotted and slashed dates with "on" preposition correctly parsed', () => {
  // Today is 2026-10-05
  const dateCases = [
    { input: 'spent 2024 rupees on 12.05', expectedAmt: 2024, expectedDate: '2026-05-12' },
    { input: 'spent 500 on 12.05', expectedAmt: 500, expectedDate: '2026-05-12' },
    { input: 'spent 300 on 15/08', expectedAmt: 300, expectedDate: '2026-08-15' },
    { input: 'spent 1200 on 01/09', expectedAmt: 1200, expectedDate: '2026-09-01' },
    { input: 'spent 750 on 25.12.2025', expectedAmt: 750, expectedDate: '2025-12-25' }
  ];

  for (const { input, expectedAmt, expectedDate } of dateCases) {
    const ext = extractVoiceAmount(input.toLowerCase());
    assert(ext, `Amount extraction failed for "${input}"`);
    assert.strictEqual(ext.value, expectedAmt, `Wrong amount for "${input}"`);

    const textForDate = input.toLowerCase().replace(ext.text, ' ');
    const parsedDate = parseVoiceDate(textForDate);
    assert.strictEqual(parsedDate, expectedDate, `For "${input}", expected date ${expectedDate}, got ${parsedDate}`);
  }
});

test('REVIEW-026: Decimal paise amounts are NOT misinterpreted as dates', () => {
  const paiseCases = [
    'spent 12.05 on tea',
    'coffee 45.50 at cafe',
    'auto fare 25.75 for ride',
    'snacks 99.99'
  ];

  for (const input of paiseCases) {
    const ext = extractVoiceAmount(input.toLowerCase());
    assert(ext, `Failed to extract amount for "${input}"`);
    const textForDate = input.toLowerCase().replace(ext.text, ' ');
    const parsedDate = parseVoiceDate(textForDate);
    assert.strictEqual(parsedDate, null, `Paise amount in "${input}" should not produce date, got ${parsedDate}`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. DEFECT 3: REVIEW-009 — auth.js
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- [3/4] Testing auth.js (REVIEW-009) ---');

const authSource = fs.readFileSync(path.join(__dirname, '..', 'auth.js'), 'utf8');

function createAuthSandbox() {
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
    },
    _store: store
  };

  vm.createContext(sandbox);
  vm.runInContext(authSource, sandbox);
  return sandbox;
}

test('REVIEW-009: purgeUserLocalStorage(uid) strictly isolates to targeted user', () => {
  const sb = createAuthSandbox();
  const purge = sb.window.purgeUserLocalStorage;
  const store = sb._store;

  const uidA = 'user_alpha_123';
  const uidB = 'user_beta_456';

  // Seed data for user A
  store[`pockettrack_debts_${uidA}`] = 'debts_A';
  store[`pockettrack_monthly_income_${uidA}`] = 'income_A';
  store[`pockettrack_user_upi_id_${uidA}`] = 'upi_A';
  store[`pockettrack_finny_profile_${uidA}`] = 'finny_A';
  store[`pockettrack_entries_cache_${uidA}`] = 'entries_A';
  store[`pockettrack_wallets_${uidA}`] = 'wallets_A';

  // Seed data for user B
  store[`pockettrack_debts_${uidB}`] = 'debts_B';
  store[`pockettrack_monthly_income_${uidB}`] = 'income_B';
  store[`pockettrack_user_upi_id_${uidB}`] = 'upi_B';
  store[`pockettrack_finny_profile_${uidB}`] = 'finny_B';
  store[`pockettrack_entries_cache_${uidB}`] = 'entries_B';
  store[`pockettrack_wallets_${uidB}`] = 'wallets_B';

  // Seed legacy unnamespaced keys & non-user preferences
  store['pockettrack_debts'] = 'legacy_debts';
  store['pockettrack_entries_cache'] = 'legacy_entries';
  store['pockettrack_lang'] = 'en';
  store['pockettrack_theme'] = 'dark';

  // Purge User A
  purge(uidA);

  // Assert User A keys removed
  assert.strictEqual(store[`pockettrack_debts_${uidA}`], undefined, 'User A debts not purged');
  assert.strictEqual(store[`pockettrack_monthly_income_${uidA}`], undefined, 'User A income not purged');
  assert.strictEqual(store[`pockettrack_user_upi_id_${uidA}`], undefined, 'User A UPI ID not purged');
  assert.strictEqual(store[`pockettrack_finny_profile_${uidA}`], undefined, 'User A Finny not purged');
  assert.strictEqual(store[`pockettrack_entries_cache_${uidA}`], undefined, 'User A cache not purged');
  assert.strictEqual(store[`pockettrack_wallets_${uidA}`], undefined, 'User A wallets not purged');

  // Assert legacy keys removed
  assert.strictEqual(store['pockettrack_debts'], undefined, 'Legacy debts not removed');
  assert.strictEqual(store['pockettrack_entries_cache'], undefined, 'Legacy entries not removed');

  // Assert User B keys 100% PRESERVED
  assert.strictEqual(store[`pockettrack_debts_${uidB}`], 'debts_B', 'User B debts corrupted!');
  assert.strictEqual(store[`pockettrack_monthly_income_${uidB}`], 'income_B', 'User B income corrupted!');
  assert.strictEqual(store[`pockettrack_user_upi_id_${uidB}`], 'upi_B', 'User B UPI corrupted!');
  assert.strictEqual(store[`pockettrack_finny_profile_${uidB}`], 'finny_B', 'User B Finny corrupted!');
  assert.strictEqual(store[`pockettrack_entries_cache_${uidB}`], 'entries_B', 'User B cache corrupted!');
  assert.strictEqual(store[`pockettrack_wallets_${uidB}`], 'wallets_B', 'User B wallets corrupted!');

  // Assert app settings preserved
  assert.strictEqual(store['pockettrack_lang'], 'en', 'App lang setting wiped!');
  assert.strictEqual(store['pockettrack_theme'], 'dark', 'App theme setting wiped!');
});

test('REVIEW-009: purgeUserLocalStorage(null) cleans all user cache when uid unknown', () => {
  const sb = createAuthSandbox();
  const purge = sb.window.purgeUserLocalStorage;
  const store = sb._store;

  store['pockettrack_debts_u1'] = 'debts_1';
  store['pockettrack_entries_cache_u2'] = 'entries_2';
  store['pockettrack_lang'] = 'en';

  purge(null);

  assert.strictEqual(store['pockettrack_debts_u1'], undefined, 'User 1 debts should be purged');
  assert.strictEqual(store['pockettrack_entries_cache_u2'], undefined, 'User 2 cache should be purged');
  assert.strictEqual(store['pockettrack_lang'], 'en', 'Global preferences should still be preserved');
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. DEFECT 4: REVIEW-054 — transactions.js
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- [4/4] Testing transactions.js (REVIEW-054) ---');

const txSource = fs.readFileSync(path.join(__dirname, '..', 'transactions.js'), 'utf8');

test('REVIEW-054: listenToEntries preserves older paginated entries across snapshot events', () => {
  let snapshotCallback = null;
  const mockDb = {
    collection: () => ({
      doc: () => ({
        collection: () => ({
          orderBy: () => ({
            limit: () => ({
              onSnapshot: (opts, cb) => {
                snapshotCallback = cb;
                return () => {};
              }
            })
          })
        })
      })
    })
  };

  const store = {};
  const sb = {
    window: { addEventListener: () => {} },
    document: {
      getElementById: () => ({ textContent: '', style: {} }),
      addEventListener: () => {}
    },
    localStorage: {
      getItem: (k) => store[k] || null,
      setItem: (k, v) => { store[k] = String(v); }
    },
    currentUser: { uid: 'u_pagination_test' },
    todayStr: () => '2026-10-05',
    currentLang: 'en',
    currentEventId: null,
    mainEntries: () => [],
    TT: (k) => k,
    db: mockDb,
    renderEntries: () => {},
    renderReport: () => {},
    updateHeaderStats: () => {},
    checkBudget: () => {},
    refreshEventsViewsIfOpen: () => {},
    renderStreak: () => {},
    renderEventsList: () => {},
    renderQuickAdd: () => {}
  };

  vm.createContext(sb);
  vm.runInContext(txSource, sb);

  // Initialize listener
  sb.listenToEntries();
  assert(snapshotCallback, 'onSnapshot callback was not registered');

  // Initial snapshot: 2 entries
  const snap1 = {
    metadata: { hasPendingWrites: false },
    docs: [
      { id: 'tx_200', data: () => ({ date: '2026-10-05', amt: 50, desc: 'Recent 1' }) },
      { id: 'tx_199', data: () => ({ date: '2026-10-04', amt: 100, desc: 'Recent 2' }) }
    ]
  };
  snapshotCallback(snap1);

  assert.strictEqual(sb.window.entries.length, 2, 'Should have 2 entries from initial snapshot');

  // Simulate user loading older historical entries via loadOlderEntries
  // These entries have older dates (e.g. 2026-09-01)
  const olderEntries = [
    { _id: 'tx_old_1', date: '2026-09-01', amt: 300, desc: 'Old historical 1' },
    { _id: 'tx_old_2', date: '2026-08-15', amt: 400, desc: 'Old historical 2' }
  ];
  sb.window.entries = sb.window.entries.concat(olderEntries);
  assert.strictEqual(sb.window.entries.length, 4, 'Should now have 4 entries after pagination');

  // Now a real-time snapshot event fires (e.g. a new transaction added today)
  const snap2 = {
    metadata: { hasPendingWrites: false },
    docs: [
      { id: 'tx_201', data: () => ({ date: '2026-10-06', amt: 75, desc: 'Brand new' }) },
      { id: 'tx_200', data: () => ({ date: '2026-10-05', amt: 50, desc: 'Recent 1' }) },
      { id: 'tx_199', data: () => ({ date: '2026-10-04', amt: 100, desc: 'Recent 2' }) }
    ]
  };
  snapshotCallback(snap2);

  // CRITICAL ASSERTION: The 2 older entries MUST STILL BE PRESENT in sb.window.entries!
  assert.strictEqual(sb.window.entries.length, 5, `Expected 5 entries (3 from snap + 2 older preserved), got ${sb.window.entries.length}`);

  const ids = sb.window.entries.map(e => e._id);
  assert(ids.includes('tx_201'), 'Must include brand new tx_201');
  assert(ids.includes('tx_200'), 'Must include tx_200');
  assert(ids.includes('tx_199'), 'Must include tx_199');
  assert(ids.includes('tx_old_1'), 'Must preserve older entry tx_old_1 across snapshot sync');
  assert(ids.includes('tx_old_2'), 'Must preserve older entry tx_old_2 across snapshot sync');

  // Check ordering is descending by date
  for (let i = 0; i < sb.window.entries.length - 1; i++) {
    assert(sb.window.entries[i].date >= sb.window.entries[i + 1].date, 'Entries must be sorted descending by date');
  }
});

test('REVIEW-054: listenToEntries updates existing entry in snapshot without duplicating', () => {
  let snapshotCallback = null;
  const mockDb = {
    collection: () => ({
      doc: () => ({
        collection: () => ({
          orderBy: () => ({
            limit: () => ({
              onSnapshot: (opts, cb) => {
                snapshotCallback = cb;
                return () => {};
              }
            })
          })
        })
      })
    })
  };

  const sb = {
    window: { addEventListener: () => {} },
    document: { getElementById: () => ({ textContent: '', style: {} }), addEventListener: () => {} },
    localStorage: { getItem: () => null, setItem: () => {} },
    currentUser: { uid: 'u_test' },
    todayStr: () => '2026-10-05',
    currentLang: 'en',
    currentEventId: null,
    mainEntries: () => [],
    TT: (k) => k,
    db: mockDb,
    renderEntries: () => {},
    renderReport: () => {},
    updateHeaderStats: () => {},
    checkBudget: () => {},
    refreshEventsViewsIfOpen: () => {},
    renderStreak: () => {},
    renderEventsList: () => {},
    renderQuickAdd: () => {}
  };

  vm.createContext(sb);
  vm.runInContext(txSource, sb);
  sb.listenToEntries();

  // Snapshot with entry tx_1 amount 100
  snapshotCallback({
    metadata: { hasPendingWrites: false },
    docs: [{ id: 'tx_1', data: () => ({ date: '2026-10-05', amt: 100, desc: 'Dinner' }) }]
  });
  assert.strictEqual(sb.window.entries[0].amt, 100);

  // Snapshot update: entry tx_1 amount edited to 150
  snapshotCallback({
    metadata: { hasPendingWrites: false },
    docs: [{ id: 'tx_1', data: () => ({ date: '2026-10-05', amt: 150, desc: 'Dinner & Drinks' }) }]
  });
  assert.strictEqual(sb.window.entries.length, 1, 'Should have exactly 1 entry, not duplicated');
  assert.strictEqual(sb.window.entries[0].amt, 150, 'Updated amount should be reflected');
  assert.strictEqual(sb.window.entries[0].desc, 'Dinner & Drinks', 'Updated desc should be reflected');
});

test('REVIEW-054: Pagination stress test with 500 items across 10 snapshot cycles', () => {
  let snapshotCallback = null;
  const mockDb = {
    collection: () => ({
      doc: () => ({
        collection: () => ({
          orderBy: () => ({
            limit: () => ({
              onSnapshot: (opts, cb) => {
                snapshotCallback = cb;
                return () => {};
              }
            })
          })
        })
      })
    })
  };

  const sb = {
    window: { addEventListener: () => {} },
    document: { getElementById: () => ({ textContent: '', style: {} }), addEventListener: () => {} },
    localStorage: { getItem: () => null, setItem: () => {} },
    currentUser: { uid: 'u_stress_pagination' },
    todayStr: () => '2026-10-05',
    currentLang: 'en',
    currentEventId: null,
    mainEntries: () => [],
    TT: (k) => k,
    db: mockDb,
    renderEntries: () => {},
    renderReport: () => {},
    updateHeaderStats: () => {},
    checkBudget: () => {},
    refreshEventsViewsIfOpen: () => {},
    renderStreak: () => {},
    renderEventsList: () => {},
    renderQuickAdd: () => {}
  };

  vm.createContext(sb);
  vm.runInContext(txSource, sb);
  sb.listenToEntries();

  // Create initial 200 items (dates 2026-10-01 down to 2026-03-16)
  const initialDocs = [];
  for (let i = 200; i >= 1; i--) {
    const d = new Date(2026, 9, 1);
    d.setDate(d.getDate() - (200 - i));
    const dateStr = d.toISOString().slice(0, 10);
    initialDocs.push({
      id: `doc_${i}`,
      data: () => ({ date: dateStr, amt: i * 10, desc: `Entry ${i}` })
    });
  }
  snapshotCallback({ metadata: { hasPendingWrites: false }, docs: initialDocs });
  assert.strictEqual(sb.window.entries.length, 200);

  // User loads 300 older entries (total 500 entries)
  const olderEntries = [];
  for (let i = 500; i > 200; i--) {
    const d = new Date(2025, 0, 1);
    d.setDate(d.getDate() - (500 - i));
    const dateStr = d.toISOString().slice(0, 10);
    olderEntries.push({ _id: `doc_${i}`, date: dateStr, amt: i * 10, desc: `Older ${i}` });
  }
  sb.window.entries = sb.window.entries.concat(olderEntries);
  assert.strictEqual(sb.window.entries.length, 500);

  // Fire 10 snapshot events (e.g. real-time sync events with new transactions)
  for (let cycle = 1; cycle <= 10; cycle++) {
    const newDoc = {
      id: `new_doc_${cycle}`,
      data: () => ({ date: `2026-10-${String(5 + cycle).padStart(2, '0')}`, amt: cycle * 50, desc: `New ${cycle}` })
    };
    // Top 200 in Firestore now includes newDoc and 199 previous docs
    const currentSnapDocs = [newDoc, ...initialDocs.slice(0, 199)];
    snapshotCallback({ metadata: { hasPendingWrites: false }, docs: currentSnapDocs });

    // The older entries (including doc_200 which was pushed out of limit(200)) MUST BE RETAINED!
    assert(sb.window.entries.length >= 500, `Entries count dropped to ${sb.window.entries.length} on cycle ${cycle}`);
    // No duplicate IDs
    const idSet = new Set(sb.window.entries.map(e => e._id));
    assert.strictEqual(idSet.size, sb.window.entries.length, `Duplicate IDs detected on cycle ${cycle}`);
  }
});

test('REVIEW-009: Multi-tenant scale test with 50 concurrent tenant accounts', () => {
  const sb = createAuthSandbox();
  const purge = sb.window.purgeUserLocalStorage;
  const store = sb._store;

  // Populate 50 users
  for (let u = 1; u <= 50; u++) {
    const uid = `tenant_user_${u}`;
    store[`pockettrack_debts_${uid}`] = `debt_${u}`;
    store[`pockettrack_monthly_income_${uid}`] = `income_${u}`;
    store[`pockettrack_user_upi_id_${uid}`] = `upi_${u}`;
    store[`pockettrack_finny_profile_${uid}`] = `finny_${u}`;
    store[`pockettrack_entries_cache_${uid}`] = `cache_${u}`;
    store[`pockettrack_wallets_${uid}`] = `wallets_${u}`;
  }
  store['pockettrack_debts'] = 'legacy';
  store['pockettrack_lang'] = 'hi';

  assert.strictEqual(Object.keys(store).length, 50 * 6 + 2); // 302 keys

  // Purge user 25 only
  purge('tenant_user_25');

  // Verify only user 25 and legacy keys removed
  assert.strictEqual(store['pockettrack_debts_tenant_user_25'], undefined);
  assert.strictEqual(store['pockettrack_monthly_income_tenant_user_25'], undefined);
  assert.strictEqual(store['pockettrack_debts'], undefined);

  // Verify all other 49 users are completely intact
  for (let u = 1; u <= 50; u++) {
    if (u === 25) continue;
    const uid = `tenant_user_${u}`;
    assert.strictEqual(store[`pockettrack_debts_${uid}`], `debt_${u}`, `User ${u} debts damaged`);
    assert.strictEqual(store[`pockettrack_monthly_income_${uid}`], `income_${u}`, `User ${u} income damaged`);
    assert.strictEqual(store[`pockettrack_user_upi_id_${uid}`], `upi_${u}`, `User ${u} UPI damaged`);
    assert.strictEqual(store[`pockettrack_finny_profile_${uid}`], `finny_${u}`, `User ${u} finny damaged`);
    assert.strictEqual(store[`pockettrack_entries_cache_${uid}`], `cache_${u}`, `User ${u} cache damaged`);
    assert.strictEqual(store[`pockettrack_wallets_${uid}`], `wallets_${u}`, `User ${u} wallets damaged`);
  }
  assert.strictEqual(store['pockettrack_lang'], 'hi', 'Global preferences damaged');
});

test('REVIEW-025 & REVIEW-026: Combined voice sentences with phone numbers, prepositions, and dotted dates', () => {
  const combinedPhrases = [
    {
      phrase: 'recharge 299 for 9876543210 on 12.05',
      expectedAmt: 299,
      expectedDate: '2026-05-12'
    },
    {
      phrase: 'recharge 499 for 9123456789 on 15/08',
      expectedAmt: 499,
      expectedDate: '2026-08-15'
    },
    {
      phrase: '10 rupees recharge for 9876543210 on 05.06',
      expectedAmt: 10,
      expectedDate: '2026-06-05'
    }
  ];

  for (const item of combinedPhrases) {
    const ext = extractVoiceAmount(item.phrase.toLowerCase());
    assert(ext, `Amount extraction failed for "${item.phrase}"`);
    assert.strictEqual(ext.value, item.expectedAmt, `Amount mismatch for "${item.phrase}"`);

    const textForDate = item.phrase.toLowerCase().replace(ext.text, ' ');
    const parsedDate = parseVoiceDate(textForDate);
    assert.strictEqual(parsedDate, item.expectedDate, `Date mismatch for "${item.phrase}"`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n========================================================================');
console.log('CHALLENGER T2 RECHECK EMPIRICAL VERIFICATION SUMMARY:');
console.log(`Total tests:  ${passedCount + failedCount}`);
console.log(`Passed:       ${passedCount}`);
console.log(`Failed:       ${failedCount}`);
console.log('========================================================================\n');

if (failedCount > 0) {
  console.error('FAILURES DETECTED:');
  failures.forEach(f => console.error(`- ${f.name}: ${f.error}`));
  process.exit(1);
} else {
  console.log('✔ ALL EMPIRICAL CHALLENGER STRESS TESTS PASSED CLEANLY (100% SUCCESS)');
}
