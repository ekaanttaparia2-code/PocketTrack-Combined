/**
 * PocketTrack — Challenger Tier 2 Remediation Re-check Suite
 *
 * Empirical verification and stress testing for:
 * 1. voice.js: Phone numbers, calendar years, dotted dates, currency precedence, fallback filters
 * 2. auth.js: Multi-tenant shared device logout isolation, UID collisions, global settings preservation
 * 3. upi_qr_generator.js: Emoji notes (surrogate pairs, ZWJ sequences, skin tone modifiers), TextEncoder vs fallback,
 *    DOM attribute escaping & dataset retrieval, payload overflow
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const projectRoot = path.resolve(__dirname, '..');

let totalAsserts = 0;
let passedAsserts = 0;
let failedAsserts = 0;
const failures = [];

function check(title, fn) {
  totalAsserts++;
  try {
    fn();
    passedAsserts++;
    console.log(`  ✓ [PASS] ${title}`);
  } catch (err) {
    failedAsserts++;
    failures.push({ title, error: err.message, stack: err.stack });
    console.log(`  ✗ [FAIL] ${title}`);
    console.log(`     Error: ${err.message}`);
  }
}

console.log('========================================================================');
console.log('   CHALLENGER T2 RECHECK: ADVERSARIAL EDGE CASE SUITE');
console.log('========================================================================\n');

// ─────────────────────────────────────────────────────────────────────────────
// PART 1: voice.js — Phone Numbers, Years, Dotted Dates, Currency Ambiguity
// ─────────────────────────────────────────────────────────────────────────────
console.log('--- PART 1: voice.js Edge Cases ---');

const voiceSource = fs.readFileSync(path.join(projectRoot, 'voice.js'), 'utf8');
const voiceSandbox = {
  window: {},
  document: {
    addEventListener: () => {},
    getElementById: () => null
  },
  todayStr: () => '2026-10-05',
  currentLang: 'en',
  toast: () => {},
  TT: () => 'Error'
};
vm.createContext(voiceSandbox);
vm.runInContext(voiceSource, voiceSandbox);

const extractVoiceAmount = voiceSandbox.extractVoiceAmount;
const parseVoiceDate = voiceSandbox.parseVoiceDate;
const parseVoiceInput = voiceSandbox.parseVoiceInput;

// 1.1 Phone number rejection with prepositions
check('extractVoiceAmount: "phone recharge 299 for 9876543210" extracts 299', () => {
  const res = extractVoiceAmount('phone recharge 299 for 9876543210');
  assert(res, 'Must extract an amount');
  assert.strictEqual(res.value, 299, `Expected 299, got ${res.value}`);
});

check('extractVoiceAmount: "recharge of 399 for 9876543210" extracts 399', () => {
  const res = extractVoiceAmount('recharge of 399 for 9876543210');
  assert(res, 'Must extract an amount');
  assert.strictEqual(res.value, 399, `Expected 399, got ${res.value}`);
});

check('extractVoiceAmount: "recharge 199 on 9876543210" extracts 199', () => {
  const res = extractVoiceAmount('recharge 199 on 9876543210');
  assert(res, 'Must extract an amount');
  assert.strictEqual(res.value, 199, `Expected 199, got ${res.value}`);
});

check('extractVoiceAmount: "call 9876543210" returns null (does not extract phone number as amount)', () => {
  const res = extractVoiceAmount('call 9876543210');
  assert.strictEqual(res, null, `Expected null, got ${JSON.stringify(res)}`);
});

check('extractVoiceAmount: "recharge for 9876543210" returns null (phone only after for)', () => {
  const res = extractVoiceAmount('recharge for 9876543210');
  assert.strictEqual(res, null, `Expected null, got ${JSON.stringify(res)}`);
});

// 1.2 Calendar year filtering
check('extractVoiceAmount: "happy new year 2024" returns null', () => {
  const res = extractVoiceAmount('happy new year 2024');
  assert.strictEqual(res, null, `Expected null, got ${JSON.stringify(res)}`);
});

check('extractVoiceAmount: "party in 2026" returns null', () => {
  const res = extractVoiceAmount('party in 2026');
  assert.strictEqual(res, null, `Expected null, got ${JSON.stringify(res)}`);
});

check('extractVoiceAmount: "dinner for 2025" returns null (year after for)', () => {
  const res = extractVoiceAmount('dinner for 2025');
  assert.strictEqual(res, null, `Expected null, got ${JSON.stringify(res)}`);
});

check('extractVoiceAmount: "spent 2024 rupees" extracts 2024 (legitimate currency marker)', () => {
  const res = extractVoiceAmount('spent 2024 rupees');
  assert(res, 'Must extract amount');
  assert.strictEqual(res.value, 2024, `Expected 2024, got ${res.value}`);
});

check('extractVoiceAmount: "₹2025 for tickets" extracts 2025 (currency symbol)', () => {
  const res = extractVoiceAmount('₹2025 for tickets');
  assert(res, 'Must extract amount');
  assert.strictEqual(res.value, 2025, `Expected 2025, got ${res.value}`);
});

// 1.3 Dotted date parsing & disambiguation
check('parseVoiceDate: "Spent 2024 rupees on 12.05" parses date as 2026-05-12', () => {
  const raw = 'Spent 2024 rupees on 12.05';
  const extracted = extractVoiceAmount(raw.toLowerCase());
  assert(extracted, 'Amount must be extracted');
  assert.strictEqual(extracted.value, 2024);
  const textForDate = raw.replace(extracted.text, ' ');
  const parsedDate = parseVoiceDate(textForDate);
  assert.strictEqual(parsedDate, '2026-05-12', `Expected 2026-05-12, got ${parsedDate}`);
});

check('parseVoiceDate: "Spent 12.05 on tea" does NOT parse 12.05 as date when extracted as amount', () => {
  const raw = 'Spent 12.05 on tea';
  const extracted = extractVoiceAmount(raw.toLowerCase());
  assert(extracted, 'Amount must be extracted');
  assert.strictEqual(extracted.value, 12.05);
  const textForDate = raw.replace(extracted.text, ' ');
  const parsedDate = parseVoiceDate(textForDate);
  assert.strictEqual(parsedDate, null, `Expected null for date, got ${parsedDate}`);
});

check('parseVoiceDate: "Paid 500 on 15.08" parses dotted date 15.08 as 2026-08-15', () => {
  const raw = 'Paid 500 on 15.08';
  const extracted = extractVoiceAmount(raw.toLowerCase());
  assert(extracted);
  const textForDate = raw.replace(extracted.text, ' ');
  const parsedDate = parseVoiceDate(textForDate);
  assert.strictEqual(parsedDate, '2026-08-15', `Expected 2026-08-15, got ${parsedDate}`);
});

check('parseVoiceDate: "on 12" parses 12th day of past/current month', () => {
  const parsedDate = parseVoiceDate('paid rent on 12');
  assert(parsedDate, 'Must parse a date');
  // Today is 2026-10-05, so "on 12" (without future keyword) refers to 2026-09-12
  assert.strictEqual(parsedDate, '2026-09-12', `Expected 2026-09-12, got ${parsedDate}`);
});

check('parseVoiceDate: invalid dates like "31.02" return null', () => {
  const parsedDate = parseVoiceDate('spent on 31.02');
  assert.strictEqual(parsedDate, null, 'Invalid February 31 date must return null');
});

// ─────────────────────────────────────────────────────────────────────────────
// PART 2: auth.js — Multi-Tenant Shared Device Logout Isolation
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- PART 2: auth.js Multi-Tenant Shared Device Logout Isolation ---');

const authSource = fs.readFileSync(path.join(projectRoot, 'auth.js'), 'utf8');

function createAuthEnv() {
  const store = {};
  const mockLocalStorage = {
    getItem: (k) => (store[k] !== undefined ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    key: (i) => Object.keys(store)[i],
    get length() { return Object.keys(store).length; },
    _store: store
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
  vm.runInContext(authSource, sandbox);
  return { sandbox, store };
}

check('auth.js: purgeUserLocalStorage(uid) selectively purges only target user data', () => {
  const { sandbox, store } = createAuthEnv();
  const purge = sandbox.window.purgeUserLocalStorage;

  const uidUserA = 'user_alpha_abc123';
  const uidUserB = 'user_beta_xyz789';

  // Seed User A data
  store[`pockettrack_debts_${uidUserA}`] = 'debts_A';
  store[`pockettrack_monthly_income_${uidUserA}`] = 'income_A';
  store[`pockettrack_user_upi_id_${uidUserA}`] = 'upi_A';
  store[`pockettrack_finny_profile_${uidUserA}`] = 'finny_A';
  store[`pockettrack_entries_cache_${uidUserA}`] = 'entries_A';
  store[`pockettrack_wallets_${uidUserA}`] = 'wallets_A';
  store[`pockettrack_custom_settings_${uidUserA}`] = 'custom_A';

  // Seed User B data
  store[`pockettrack_debts_${uidUserB}`] = 'debts_B';
  store[`pockettrack_monthly_income_${uidUserB}`] = 'income_B';
  store[`pockettrack_user_upi_id_${uidUserB}`] = 'upi_B';
  store[`pockettrack_finny_profile_${uidUserB}`] = 'finny_B';
  store[`pockettrack_entries_cache_${uidUserB}`] = 'entries_B';
  store[`pockettrack_wallets_${uidUserB}`] = 'wallets_B';
  store[`pockettrack_custom_settings_${uidUserB}`] = 'custom_B';

  // Global settings
  store['pockettrack_theme'] = 'dark';
  store['pockettrack_lang'] = 'hi';

  // User A logs out
  purge(uidUserA);

  // User A data must be completely gone
  assert.strictEqual(store[`pockettrack_debts_${uidUserA}`], undefined);
  assert.strictEqual(store[`pockettrack_monthly_income_${uidUserA}`], undefined);
  assert.strictEqual(store[`pockettrack_user_upi_id_${uidUserA}`], undefined);
  assert.strictEqual(store[`pockettrack_finny_profile_${uidUserA}`], undefined);
  assert.strictEqual(store[`pockettrack_entries_cache_${uidUserA}`], undefined);
  assert.strictEqual(store[`pockettrack_wallets_${uidUserA}`], undefined);
  assert.strictEqual(store[`pockettrack_custom_settings_${uidUserA}`], undefined);

  // User B data must be 100% intact
  assert.strictEqual(store[`pockettrack_debts_${uidUserB}`], 'debts_B');
  assert.strictEqual(store[`pockettrack_monthly_income_${uidUserB}`], 'income_B');
  assert.strictEqual(store[`pockettrack_user_upi_id_${uidUserB}`], 'upi_B');
  assert.strictEqual(store[`pockettrack_finny_profile_${uidUserB}`], 'finny_B');
  assert.strictEqual(store[`pockettrack_entries_cache_${uidUserB}`], 'entries_B');
  assert.strictEqual(store[`pockettrack_wallets_${uidUserB}`], 'wallets_B');
  assert.strictEqual(store[`pockettrack_custom_settings_${uidUserB}`], 'custom_B');

  // Global preferences preserved
  assert.strictEqual(store['pockettrack_theme'], 'dark');
  assert.strictEqual(store['pockettrack_lang'], 'hi');
});

check('auth.js: purgeUserLocalStorage(null) removes un-namespaced and all user prefixed cache keys', () => {
  const { sandbox, store } = createAuthEnv();
  const purge = sandbox.window.purgeUserLocalStorage;

  store['pockettrack_debts_user1'] = 'debts1';
  store['pockettrack_debts_user2'] = 'debts2';
  store['pockettrack_entries_cache_user1'] = 'cache1';
  store['pockettrack_theme'] = 'dark';

  purge(null);

  assert.strictEqual(store['pockettrack_debts_user1'], undefined);
  assert.strictEqual(store['pockettrack_debts_user2'], undefined);
  assert.strictEqual(store['pockettrack_entries_cache_user1'], undefined);
  // Unrelated keys preserved
  assert.strictEqual(store['pockettrack_theme'], 'dark');
});

check('auth.js: purgeUserLocalStorage does not suffer false prefix matches with overlapping UIDs', () => {
  const { sandbox, store } = createAuthEnv();
  const purge = sandbox.window.purgeUserLocalStorage;

  const uidShort = 'user1';
  const uidLong = 'user1_extended';

  store[`pockettrack_debts_${uidShort}`] = 'short_data';
  store[`pockettrack_debts_${uidLong}`] = 'long_data';

  purge(uidShort);

  assert.strictEqual(store[`pockettrack_debts_${uidShort}`], undefined, 'Short UID must be purged');
  assert.strictEqual(store[`pockettrack_debts_${uidLong}`], 'long_data', 'Long UID ending differently must be preserved');
});

// ─────────────────────────────────────────────────────────────────────────────
// PART 3: upi_qr_generator.js — Emojis in Notes, UTF-8 Encoding, DOM Safety
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- PART 3: upi_qr_generator.js Emoji Notes & Encoding Robustness ---');

const upiSource = fs.readFileSync(path.join(projectRoot, 'upi_qr_generator.js'), 'utf8');

function createUpiEnv() {
  const store = {};
  const elements = {};
  const sandbox = {
    window: {},
    document: {
      createElement: (tag) => {
        const el = {
          tagName: tag,
          style: {},
          dataset: {},
          classList: { add: () => {}, remove: () => {} },
          appendChild: () => {},
          innerHTML: ''
        };
        return el;
      },
      getElementById: (id) => elements[id] || null,
      body: { appendChild: (el) => { if (el && el.id) elements[el.id] = el; } },
      head: { appendChild: () => {} },
      documentElement: { appendChild: () => {} }
    },
    escapeHTML: (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'),
    requestAnimationFrame: (cb) => cb(),
    localStorage: {
      getItem: (k) => (store[k] !== undefined ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; }
    },
    toast: () => {},
    TextEncoder: global.TextEncoder
  };
  vm.createContext(sandbox);
  vm.runInContext(upiSource, sandbox);
  return { sandbox, store, elements };
}

check('upi_qr_generator.js: generateUpiQrSvg survives common food & activity emojis (🍕, ☕, 🍻)', () => {
  const { sandbox } = createUpiEnv();
  const gen = sandbox.window.generateUpiQrSvg;

  const emojis = ['🍕', '☕', '🍻', '🍔', '🎉', '💸', '🎬'];
  for (const emoji of emojis) {
    const payload = `upi://pay?pa=friend@upi&pn=PocketTrack&am=250&tn=Dinner ${emoji}&cu=INR`;
    const svg = gen(payload, 200);
    assert(svg.startsWith('<svg'), `Failed for emoji ${emoji}`);
    assert(svg.includes('<path d="M'), `SVG missing path for ${emoji}`);
  }
});

check('upi_qr_generator.js: generateUpiQrSvg survives complex ZWJ and modifier emojis', () => {
  const { sandbox } = createUpiEnv();
  const gen = sandbox.window.generateUpiQrSvg;

  const complexEmojis = [
    '👍🏽', // Skin tone modifier
    '👨‍👩‍👧‍👦', // Family ZWJ sequence
    '🇮🇳', // Regional indicator flag
    '🏳️‍🌈' // Multi-symbol sequence
  ];
  for (const emoji of complexEmojis) {
    const payload = `upi://pay?pa=user@upi&pn=PT&am=100&tn=Test ${emoji}&cu=INR`;
    const svg = gen(payload, 200);
    assert(svg.startsWith('<svg'), `Failed for complex emoji ${emoji}`);
  }
});

check('upi_qr_generator.js: Fallback encoder (when TextEncoder is undefined) correctly handles 4-byte emojis', () => {
  // Test fallback code path
  const { sandbox } = createUpiEnv();
  // Remove TextEncoder in context
  sandbox.TextEncoder = undefined;
  // Re-run script with TextEncoder undefined
  vm.runInContext(upiSource, sandbox);
  const gen = sandbox.window.generateUpiQrSvg;

  const payload = 'upi://pay?pa=test@upi&pn=PocketTrack&am=150&tn=Pizza 🍕 Chai ☕&cu=INR';
  const svg = gen(payload, 200);
  assert(svg.startsWith('<svg'), 'Fallback encoder must successfully produce SVG');
  assert(svg.includes('<path d="M'), 'Fallback encoder must include valid paths');
});

check('upi_qr_generator.js: openUpiQrModal escapes notes with quotes, HTML tags, and emojis in DOM attributes', () => {
  const { sandbox, store } = createUpiEnv();
  store['pockettrack_user_upi_id'] = 'merchant@okaxis';

  const adversarialNote = 'Dinner "special" & <drinks> 🍕\'party\'';
  sandbox.window.openUpiQrModal(500, adversarialNote);

  const modal = sandbox.document.getElementById('upi-qr-modal-backdrop');
  assert(modal, 'Modal must be created');
  assert(modal.innerHTML.includes('&quot;special&quot;'), 'Quotes must be escaped in HTML');
  assert(modal.innerHTML.includes('&lt;drinks&gt;'), 'Angle brackets must be escaped');
  assert(modal.innerHTML.includes('&#39;party&#39;'), 'Single quotes must be escaped');
});

check('upi_qr_generator.js: saveUpiIdFromSetup enforces valid VPA format before generating QR', () => {
  const { sandbox, elements } = createUpiEnv();

  let setupInputVal = 'invalid-no-at';
  elements['upi-setup-input'] = {
    get value() { return setupInputVal; },
    set value(v) { setupInputVal = v; }
  };

  let modalOpenedWith = null;
  sandbox.window.openUpiQrModal = (amt, note) => {
    modalOpenedWith = { amt, note };
  };

  // 1. Invalid: no @
  setupInputVal = 'plainuser';
  sandbox.window.saveUpiIdFromSetup(100, '🍕');
  assert.strictEqual(modalOpenedWith, null, 'Must reject UPI ID without @');

  // 2. Invalid: starts with @
  setupInputVal = '@okhdfcbank';
  sandbox.window.saveUpiIdFromSetup(100, '🍕');
  assert.strictEqual(modalOpenedWith, null, 'Must reject UPI ID starting with @');

  // 3. Invalid: ends with @
  setupInputVal = 'myname@';
  sandbox.window.saveUpiIdFromSetup(100, '🍕');
  assert.strictEqual(modalOpenedWith, null, 'Must reject UPI ID ending with @');

  // 4. Valid: user@bank with emoji note passed through
  setupInputVal = 'rahul@okhdfcbank';
  sandbox.window.saveUpiIdFromSetup(350, 'Dinner 🍕');
  assert(modalOpenedWith, 'Valid UPI ID must trigger openUpiQrModal');
  assert.strictEqual(modalOpenedWith.amt, 350);
  assert.strictEqual(modalOpenedWith.note, 'Dinner 🍕');
});

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY REPORT
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n========================================================================');
console.log(`SUMMARY: ${passedAsserts} / ${totalAsserts} asserts passed`);
if (failedAsserts > 0) {
  console.log(`FAILED: ${failedAsserts}`);
  process.exit(1);
} else {
  console.log('✔ ALL ADVERSARIAL EDGE CASE TESTS PASSED CLEANLY');
  console.log('========================================================================\n');
}
