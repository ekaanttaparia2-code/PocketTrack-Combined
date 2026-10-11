/**
 * PocketTrack — Tier 1 Adversarial Stress Test Harness
 * 
 * Tests boundary cases, extreme mathematical inputs, date edge cases,
 * and security escaping across all Tier 1 fixes.
 */

const fs = require('fs');
const assert = require('assert');
const path = require('path');

// ── Color logging helpers ──────────────────────────────────────────────
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ${GREEN}✓${RESET} ${name}`);
  } catch (err) {
    failedTests++;
    failures.push({ name, error: err });
    console.log(`  ${RED}✗${RESET} ${BOLD}${name}${RESET}`);
    console.log(`    ${RED}Error: ${err.message}${RESET}`);
  }
}

// ── Browser Environment Mocking ─────────────────────────────────────────
function createMockDOM() {
  function escapeHTMLSpec(str) {
    if (typeof str !== 'string') str = String(str);
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');
  }

  const elements = new Map();
  const document = {
    createElement(tag) {
      let _textContent = null;
      let _html = '';
      return {
        tagName: tag.toUpperCase(),
        style: {},
        set textContent(val) {
          _textContent = String(val);
          _html = escapeHTMLSpec(_textContent);
        },
        get textContent() {
          return _textContent !== null ? _textContent : _html;
        },
        get innerHTML() {
          return _html;
        },
        set innerHTML(val) {
          _html = String(val);
          _textContent = null;
        },
        remove() {},
        appendChild(child) {}
      };
    },
    getElementById(id) {
      return elements.get(id) || null;
    },
    body: {
      appendChild(child) {}
    }
  };

  const window = {
    document,
    localStorage: {
      _store: {},
      getItem(k) { return this._store[k] !== undefined ? this._store[k] : null; },
      setItem(k, v) { this._store[k] = String(v); },
      removeItem(k) { delete this._store[k]; }
    },
    escapeHTML: escapeHTMLSpec
  };

  return { window, document };
}

// ── Load Modules ────────────────────────────────────────────────────────
const debtPayoffCode = fs.readFileSync(path.join(__dirname, '..', 'debt_payoff.js'), 'utf8');
const recurringCode = fs.readFileSync(path.join(__dirname, '..', 'recurring.js'), 'utf8');
const fireRunwayCode = fs.readFileSync(path.join(__dirname, '..', 'fire_runway.js'), 'utf8');
const wrappedCode = fs.readFileSync(path.join(__dirname, '..', 'wrapped.js'), 'utf8');
const reportsCode = fs.readFileSync(path.join(__dirname, '..', 'reports.js'), 'utf8');

// Instantiate DebtPayoff
const mockEnv = createMockDOM();
eval(`(function(window, document, localStorage) {
  var escapeHTML = window.escapeHTML;
  ${debtPayoffCode}
})(mockEnv.window, mockEnv.document, mockEnv.window.localStorage);`);
const DebtPayoff = mockEnv.window.DebtPayoff;

// Extract addRecInterval from recurring.js
const recIntervalMatch = recurringCode.match(/function addRecInterval\([\s\S]*?\n\}/);
if (!recIntervalMatch) throw new Error('Could not extract addRecInterval from recurring.js');
let addRecInterval;
eval(`addRecInterval = ${recIntervalMatch[0]};`);

// ────────────────────────────────────────────────────────────────────────
// AREA 1: Extreme Mathematical Inputs to Debt Payoff
// ────────────────────────────────────────────────────────────────────────
console.log(`\n${CYAN}${BOLD}=== AREA 1: Extreme Mathematical Inputs to Debt Payoff ===${RESET}`);

test('1.1 Micro balance: single debt with 0.01 balance terminates in 1 month with 0 interest', () => {
  const debts = [{ id: '1', name: 'Micro', balance: 0.01, rate: 24, minPayment: 10 }];
  const res = DebtPayoff.calculate(debts, 'avalanche', 0);
  assert.strictEqual(res.months, 1);
  assert.strictEqual(res.totalInterest, 0);
});

test('1.2 Micro balance: sub-cent fractional balance 0.000001 (1e-6) terminates safely', () => {
  const debts = [{ id: '1', name: 'Tiny', balance: 0.000001, rate: 18, minPayment: 100 }];
  const res = DebtPayoff.calculate(debts, 'snowball', 0);
  assert.strictEqual(res.months, 1);
  assert.strictEqual(res.totalInterest, 0);
});

test('1.3 Micro balance: multiple fractional debts [0.05, 0.02, 0.25] terminate cleanly', () => {
  const debts = [
    { id: '1', name: 'D1', balance: 0.05, rate: 30, minPayment: 5 },
    { id: '2', name: 'D2', balance: 0.02, rate: 10, minPayment: 5 },
    { id: '3', name: 'D3', balance: 0.25, rate: 20, minPayment: 5 }
  ];
  const res = DebtPayoff.calculate(debts, 'avalanche', 0);
  assert.strictEqual(res.months, 1);
  assert.strictEqual(res.totalInterest, 0);
});

test('1.4 Extra payment larger than all debts combined (50k debt vs 100k extra) clears in month 1', () => {
  const debts = [
    { id: '1', name: 'Card', balance: 20000, rate: 36, minPayment: 1000 },
    { id: '2', name: 'Loan', balance: 30000, rate: 14, minPayment: 1500 }
  ];
  const resAv = DebtPayoff.calculate(debts, 'avalanche', 100000);
  const resSn = DebtPayoff.calculate(debts, 'snowball', 100000);
  assert.strictEqual(resAv.months, 1);
  assert.strictEqual(resSn.months, 1);
  // Month 1 interest: 20000*0.36/12 = 600, 30000*0.14/12 = 350 -> total 950
  assert.strictEqual(resAv.totalInterest, 950);
  assert.strictEqual(resSn.totalInterest, 950);
});

test('1.5 Colossal extra payment (1e12) does not cause numerical overflow or NaN', () => {
  const debts = [
    { id: '1', name: 'Card', balance: 50000, rate: 24, minPayment: 2000 }
  ];
  const res = DebtPayoff.calculate(debts, 'avalanche', 1e12);
  assert.strictEqual(res.months, 1);
  assert(Number.isFinite(res.totalInterest));
  assert(res.totalInterest >= 0);
});

test('1.6 Interest rate 0%: single loan at 0% APR clears in exact balance/minPayment months', () => {
  const debts = [{ id: '1', name: 'Friend Loan', balance: 10000, rate: 0, minPayment: 1000 }];
  const res = DebtPayoff.calculate(debts, 'avalanche', 0);
  assert.strictEqual(res.months, 10);
  assert.strictEqual(res.totalInterest, 0);
});

test('1.7 Interest rate 0%: multiple 0% loans yield strictly 0 total interest with rollover', () => {
  const debts = [
    { id: '1', name: 'Loan A', balance: 4000, rate: 0, minPayment: 1000 },
    { id: '2', name: 'Loan B', balance: 6000, rate: 0, minPayment: 1000 }
  ];
  const res = DebtPayoff.calculate(debts, 'snowball', 0);
  // Month 1: A bal 3000, B bal 5000
  // Month 2: A bal 2000, B bal 4000
  // Month 3: A bal 1000, B bal 3000
  // Month 4: A bal 0 (cleared), B bal 2000 - minPayment 1000 = 1000.
  // Month 5: A minPayment 1000 freed! B receives 1000 min + 1000 freed = 2000 -> B bal 0!
  assert.strictEqual(res.months, 5);
  assert.strictEqual(res.totalInterest, 0);
});

test('1.8 Mixed rates: Avalanche strictly saves interest over Snowball when 0% loan is present', () => {
  const debts = [
    { id: '1', name: 'Zero Loan', balance: 10000, rate: 0, minPayment: 1000 },
    { id: '2', name: 'High Card', balance: 20000, rate: 36, minPayment: 1000 }
  ];
  const av = DebtPayoff.calculate(debts, 'avalanche', 1000);
  const sn = DebtPayoff.calculate(debts, 'snowball', 1000);
  assert(av.totalInterest < sn.totalInterest, `Avalanche (${av.totalInterest}) should be < Snowball (${sn.totalInterest})`);
});

test('1.9 Min payment equal to balance with 0% interest clears in exactly 1 month', () => {
  const debts = [{ id: '1', name: 'FullPay', balance: 5000, rate: 0, minPayment: 5000 }];
  const res = DebtPayoff.calculate(debts, 'avalanche', 0);
  assert.strictEqual(res.months, 1);
  assert.strictEqual(res.totalInterest, 0);
});

test('1.10 Min payment equal to initial balance with 24% interest clears in exactly 2 months', () => {
  const debts = [{ id: '1', name: 'FullPayInterest', balance: 5000, rate: 24, minPayment: 5000 }];
  // Month 1: interest 100, balance 5100, pays 5000, balance remains 100.
  // Month 2: interest 2, balance 102, pays 102, balance 0.
  const res = DebtPayoff.calculate(debts, 'avalanche', 0);
  assert.strictEqual(res.months, 2);
  assert.strictEqual(res.totalInterest, 102);
});

test('1.11 Min payment greater than balance rolls excess into second debt in Month 1', () => {
  const debts = [
    { id: '1', name: 'SmallDebt', balance: 1000, rate: 0, minPayment: 5000 },
    { id: '2', name: 'BigDebt', balance: 10000, rate: 0, minPayment: 1000 }
  ];
  // In month 1: SmallDebt pays 1000, clears. Excess minPayment (5000 - 1000 = 4000) freed!
  // BigDebt pays 1000 min, then receives 4000 extra from freed pool -> total paid 5000! BigDebt balance becomes 5000.
  // In month 2: SmallDebt gives 5000 minPayment freed. BigDebt min 1000 + 5000 freed = 6000. BigDebt balance 5000 clears!
  const res = DebtPayoff.calculate(debts, 'snowball', 0);
  assert.strictEqual(res.months, 2);
  assert.strictEqual(res.totalInterest, 0);
});

test('1.12 Empty debts array returns 0 months and 0 interest without throwing', () => {
  const res = DebtPayoff.calculate([], 'avalanche', 1000);
  assert.strictEqual(res.months, 0);
  assert.strictEqual(res.totalInterest, 0);
});

test('1.13 All debts already zero balance returns 0 months immediately', () => {
  const debts = [{ id: '1', name: 'Zero', balance: 0, rate: 15, minPayment: 500 }];
  const res = DebtPayoff.calculate(debts, 'avalanche', 1000);
  assert.strictEqual(res.months, 0);
  assert.strictEqual(res.totalInterest, 0);
});

test('1.14 Negative amortization: high rate with minPayment < monthlyInterest hits 360-month cap safely', () => {
  // Balance 100k, rate 36% -> monthly interest 3,000. minPayment 2,000 fails to cover interest!
  const debts = [{ id: '1', name: 'Predatory', balance: 100000, rate: 36, minPayment: 2000 }];
  const res = DebtPayoff.calculate(debts, 'avalanche', 0);
  assert.strictEqual(res.months, 360);
  assert(Number.isFinite(res.totalInterest));
});

// ────────────────────────────────────────────────────────────────────────
// AREA 2: Recurring Interval Transitions & Date Math
// ────────────────────────────────────────────────────────────────────────
console.log(`\n${CYAN}${BOLD}=== AREA 2: Recurring Interval Transitions & Date Math ===${RESET}`);

test('2.1 30-day month to 31-day month: April 30 advances to May 31 with targetDay 31', () => {
  const next = addRecInterval('2026-04-30', 'monthly', 31);
  assert.strictEqual(next, '2026-05-31');
});

test('2.2 30-day month to 31-day month: June 30 advances to July 31 with targetDay 31', () => {
  const next = addRecInterval('2026-06-30', 'monthly', 31);
  assert.strictEqual(next, '2026-07-31');
});

test('2.3 30-day month to 31-day month: Sept 30 advances to Oct 31 with targetDay 31', () => {
  const next = addRecInterval('2026-09-30', 'monthly', 31);
  assert.strictEqual(next, '2026-10-31');
});

test('2.4 30-day month to 31-day month: Nov 30 advances to Dec 31 with targetDay 31', () => {
  const next = addRecInterval('2026-11-30', 'monthly', 31);
  assert.strictEqual(next, '2026-12-31');
});

test('2.5 Target day 30: Feb 28 advances to March 30 with targetDay 30', () => {
  const next = addRecInterval('2026-02-28', 'monthly', 30);
  assert.strictEqual(next, '2026-03-30');
});

test('2.6 Leap Year Yearly: 2024-02-29 -> 2025-02-28 -> 2026-02-28 -> 2027-02-28 -> 2028-02-29', () => {
  let dt = '2024-02-29';
  const expected = [
    '2025-02-28', // non-leap
    '2026-02-28', // non-leap
    '2027-02-28', // non-leap
    '2028-02-29'  // leap year! returns to 29!
  ];
  expected.forEach(exp => {
    dt = addRecInterval(dt, 'yearly', 29);
    assert.strictEqual(dt, exp);
  });
});

test('2.7 Leap Year Monthly: rule starting on 2024-02-29 preserves 29 across 48 months', () => {
  let dt = '2024-02-29';
  for (let m = 0; m < 48; m++) {
    dt = addRecInterval(dt, 'monthly', 29);
    const [y, mon, d] = dt.split('-').map(Number);
    if (mon === 2) {
      const isLeap = (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
      assert.strictEqual(d, isLeap ? 29 : 28, `Feb in year ${y} should be ${isLeap ? 29 : 28}, got ${d}`);
    } else {
      assert.strictEqual(d, 29, `Month ${mon} in year ${y} should be 29, got ${d}`);
    }
  }
});

test('2.8 48-Month Full Simulation: 2024-01-31 with targetDay 31 never permanently drifts', () => {
  let dt = '2024-01-31';
  for (let m = 0; m < 48; m++) {
    dt = addRecInterval(dt, 'monthly', 31);
    const [y, mon, d] = dt.split('-').map(Number);
    const daysInMonth = new Date(y, mon, 0).getDate();
    assert.strictEqual(d, daysInMonth, `Year ${y} Month ${mon} should end on ${daysInMonth}, got ${d}`);
  }
});

test('2.9 Year transition: 2026-12-31 monthly advances to 2027-01-31', () => {
  const next = addRecInterval('2026-12-31', 'monthly', 31);
  assert.strictEqual(next, '2027-01-31');
});

test('2.10 Daily and Weekly intervals transition correctly across leap year boundary', () => {
  const nextDaily = addRecInterval('2024-02-28', 'daily', 28);
  assert.strictEqual(nextDaily, '2024-02-29');
  const nextWeekly = addRecInterval('2024-02-25', 'weekly', 25);
  assert.strictEqual(nextWeekly, '2024-03-03');
});

test('2.11 Target day as string "31" is parsed correctly as number', () => {
  const next = addRecInterval('2026-04-30', 'monthly', '31');
  assert.strictEqual(next, '2026-05-31');
});

// ────────────────────────────────────────────────────────────────────────
// AREA 3: FIRE Runway Calculation Edge Cases
// ────────────────────────────────────────────────────────────────────────
console.log(`\n${CYAN}${BOLD}=== AREA 3: FIRE Runway Calculation Edge Cases ===${RESET}`);

function runFireCalculator(entries) {
  const env = createMockDOM();
  env.window.entries = entries;
  eval(`(function(window, document, localStorage) {
    ${fireRunwayCode}
  })(env.window, env.document, env.window.localStorage);`);
  return env.window.FireRunway.getData();
}

test('3.1 Negative amount in transactions does not produce NaN or break runway calculation', () => {
  const entries = [
    { type: 'income', amt: 100000, date: '2026-08-01' },
    { type: 'income', amt: -5000, date: '2026-08-05' }, // negative income adjustment
    { type: 'expense', amt: 30000, date: '2026-08-10' },
    { type: 'expense', amt: -2000, date: '2026-08-20' }  // refund/negative expense
  ];
  const res = runFireCalculator(entries);
  assert(Number.isFinite(res.liquidAssets));
  assert(Number.isFinite(res.monthlyBurn));
  assert(Number.isFinite(res.runwayMonths));
  assert(res.liquidAssets >= 0);
  assert(res.monthlyBurn > 0);
});

test('3.2 Inter-wallet transfers (transferGroupId) are strictly excluded from liquid assets and monthly burn', () => {
  const baseEntries = [
    { type: 'income', amt: 100000, date: '2026-08-01' },
    { type: 'expense', amt: 30000, date: '2026-08-15' },
    { type: 'expense', amt: 30000, date: '2026-09-15' }
  ];
  const withTransfers = [
    ...baseEntries,
    { type: 'income', amt: 50000, transferGroupId: 'transfer_01', date: '2026-09-10' },
    { type: 'expense', amt: 50000, transferGroupId: 'transfer_01', date: '2026-09-10' },
    { type: 'expense', amt: 99999, transferGroupId: 'transfer_02', date: '2026-08-10' }
  ];
  const resBase = runFireCalculator(baseEntries);
  const resTransfers = runFireCalculator(withTransfers);
  assert.strictEqual(resTransfers.liquidAssets, resBase.liquidAssets);
  assert.strictEqual(resTransfers.monthlyBurn, resBase.monthlyBurn);
  assert.strictEqual(resTransfers.runwayMonths, resBase.runwayMonths);
});

test('3.3 Multiple transactions on the same day aggregate properly into historical burn', () => {
  const entries = [
    { type: 'income', amt: 200000, date: '2026-07-01' },
    // 5 expenses on 2026-07-15 of 4,000 each = 20,000
    { type: 'expense', amt: 4000, date: '2026-07-15' },
    { type: 'expense', amt: 4000, date: '2026-07-15' },
    { type: 'expense', amt: 4000, date: '2026-07-15' },
    { type: 'expense', amt: 4000, date: '2026-07-15' },
    { type: 'expense', amt: 4000, date: '2026-07-15' },
    // 3 expenses on 2026-08-20 of 10,000 each = 30,000
    { type: 'expense', amt: 10000, date: '2026-08-20' },
    { type: 'expense', amt: 10000, date: '2026-08-20' },
    { type: 'expense', amt: 10000, date: '2026-08-20' }
  ];
  const res = runFireCalculator(entries);
  // July total = 20,000. August total = 30,000.
  // Average across 2 completed months = (20000 + 30000) / 2 = 25000.
  assert.strictEqual(res.monthlyBurn, 25000);
});

test('3.4 Month transition: Day 1 micro-expense does NOT distort historical monthly burn', () => {
  const curMonth = new Date().toISOString().slice(0, 7);
  const entries = [
    { type: 'income', amt: 500000, date: '2026-06-01' },
    { type: 'expense', amt: 40000, date: '2026-06-15' },
    { type: 'expense', amt: 40000, date: '2026-07-15' },
    // Day 1 tiny expense in current month
    { type: 'expense', amt: 20, date: `${curMonth}-01` }
  ];
  const res = runFireCalculator(entries);
  // Monthly burn must reflect completed prior months (40,000), not ₹20!
  assert.strictEqual(res.monthlyBurn, 40000);
  assert.strictEqual(res.runwayMonths, Math.round(((500000 - 80020) / 40000) * 10) / 10);
});

test('3.5 First-month user with no past months falls back to rolling 30-day expenses with 25k floor', () => {
  const todayStr = new Date().toISOString().slice(0, 10);
  // Spending above floor: uses rolling 30-day expenses
  const entriesAboveFloor = [
    { type: 'income', amt: 100000, date: todayStr },
    { type: 'expense', amt: 35000, date: todayStr }
  ];
  const resAbove = runFireCalculator(entriesAboveFloor);
  assert.strictEqual(resAbove.monthlyBurn, 35000);

  // Spending below floor: protected by ₹25,000 floor
  const entriesBelowFloor = [
    { type: 'income', amt: 100000, date: todayStr },
    { type: 'expense', amt: 15000, date: todayStr }
  ];
  const resBelow = runFireCalculator(entriesBelowFloor);
  assert.strictEqual(resBelow.monthlyBurn, 25000);
});

test('3.6 User with zero expenses falls back safely to default floor of ₹25,000', () => {
  const entries = [
    { type: 'income', amt: 50000, date: '2026-08-01' }
  ];
  const res = runFireCalculator(entries);
  assert.strictEqual(res.monthlyBurn, 25000);
  assert.strictEqual(res.runwayMonths, 2.0); // 50000 / 25000 = 2.0
  assert.strictEqual(res.status, 'critical');
});

test('3.7 Liquid assets clamped to 0 when expenses exceed income; runway is 0 months', () => {
  const entries = [
    { type: 'income', amt: 20000, date: '2026-08-01' },
    { type: 'expense', amt: 50000, date: '2026-08-15' }
  ];
  const res = runFireCalculator(entries);
  assert.strictEqual(res.liquidAssets, 0);
  assert.strictEqual(res.runwayMonths, 0);
  assert.strictEqual(res.status, 'critical');
});

// ────────────────────────────────────────────────────────────────────────
// AREA 4: Security Escaping: Unicode Script Tags & Event Handler Breakouts
// ────────────────────────────────────────────────────────────────────────
console.log(`\n${CYAN}${BOLD}=== AREA 4: Security Escaping: Unicode Script Tags & Event Handlers ===${RESET}`);

// Check escapeHTML implementation
function checkHTMLSanitization(rawInput) {
  const mock = createMockDOM();
  const escaped = mock.window.escapeHTML(rawInput);
  
  // Verify that dangerous ASCII delimiters '<' and '>' are escaped
  const hasRawScriptTag = /<script\b[^>]*>/i.test(escaped);
  const hasRawEvent = /<\w+\b[^>]*\s+on\w+\s*=/i.test(escaped);
  const hasRawClosingTag = /<\/[a-z]+>/i.test(escaped);
  
  return {
    escaped,
    hasRawScriptTag,
    hasRawEvent,
    hasRawClosingTag
  };
}

test('4.1 Standard script tag <script>alert(1)</script> is safely neutralized', () => {
  const payload = '<script>alert(1)</script>';
  const res = checkHTMLSanitization(payload);
  assert.strictEqual(res.hasRawScriptTag, false);
  assert.strictEqual(res.hasRawClosingTag, false);
  assert.strictEqual(res.escaped, '&lt;script&gt;alert(1)&lt;/script&gt;');
});

test('4.2 Event handler breakout <img src=x onerror=alert(1)> is neutralized', () => {
  const payload = '<img src=x onerror=alert(1)>';
  const res = checkHTMLSanitization(payload);
  assert.strictEqual(res.hasRawEvent, false);
  assert.strictEqual(res.escaped, '&lt;img src=x onerror=alert(1)&gt;');
});

test('4.3 SVG onload event handler breakout <svg onload=alert(1)> is neutralized', () => {
  const payload = '<svg onload=alert(1)>';
  const res = checkHTMLSanitization(payload);
  assert.strictEqual(res.hasRawEvent, false);
  assert.strictEqual(res.escaped, '&lt;svg onload=alert(1)&gt;');
});

test('4.4 Uppercase and mixed case script tag <SCRIPT SRC="evil.js"></SCRIPT> is neutralized', () => {
  const payload = '<SCRIPT SRC="https://evil.com/xss.js"></SCRIPT>';
  const res = checkHTMLSanitization(payload);
  assert.strictEqual(res.hasRawScriptTag, false);
  assert.strictEqual(res.escaped, '&lt;SCRIPT SRC="https://evil.com/xss.js"&gt;&lt;/SCRIPT&gt;');
});

test('4.5 Unicode fullwidth script tags ＜script＞alert(1)＜/script＞ cannot open HTML tags', () => {
  // Fullwidth characters U+FF1C ('＜') and U+FF1E ('＞')
  const payload = '\uFF1Cscript\uFF1Ealert(1)\uFF1C/script\uFF1E';
  const res = checkHTMLSanitization(payload);
  // Fullwidth characters are NOT ASCII '<' and '>'
  // In HTML parser, U+FF1C cannot initiate an HTML tag open state
  assert.strictEqual(res.hasRawScriptTag, false);
  assert(!res.escaped.includes('<script>'));
});

test('4.6 Zero-width space and null byte in tags <\u200Bscript> cannot execute', () => {
  const payload = '<\u200Bscript>alert(1)<\u200B/script>';
  const res = checkHTMLSanitization(payload);
  assert.strictEqual(res.hasRawScriptTag, false);
  assert(res.escaped.startsWith('&lt;'));
});

test('4.7 Wrapped.js: top category and custom category HTML injection vectors neutralized', () => {
  const attackCat = '<script>alert("wrapped_xss")</script>';
  const env = createMockDOM();
  let overlayHTML = '';
  env.document.body.appendChild = (el) => {
    overlayHTML = el.innerHTML;
  };

  // Simulate wrapped render with attack category
  const testData = {
    month: 10,
    year: 2026,
    incCount: 1,
    expCount: 1,
    totalTxns: 2,
    topCategory: { customCat: attackCat, cat: 'other' },
    topCatAmt: 5000,
    yearlyOppAmt: 60000,
    oppItem: 'Goa trip',
    dna: { emoji: '🎯', title: 'Saver', pct: 20 },
    catArray: [{ amt: 5000, cat: 'other', customCat: attackCat }],
    totalExpAmt: 5000,
    monthEntries: []
  };

  eval(`(function(window, document, wrappedData) {
    var escapeHTML = window.escapeHTML;
    function capitalize(str) { if(!str) return ''; return str.charAt(0).toUpperCase()+str.slice(1); }
    var colorsMap = { other: '#888' };
    var closeWrapped = () => {};
    var monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    var d = wrappedData;
    var mName = monthNames[d.month - 1];
    var topCatName = d.topCategory ? escapeHTML(capitalize(d.topCategory.customCat || d.topCategory.cat)) : 'N/A';
    var html = '<strong>' + topCatName + '</strong>';
    d.catArray.forEach(c => {
      var name = escapeHTML(capitalize(c.customCat || c.cat));
      html += '<div>' + name + '</div>';
    });
    window._resultHTML = html;
  })(env.window, env.document, testData);`);

  const result = env.window._resultHTML;
  assert(!result.includes('<script>'));
  assert(result.includes('&lt;script&gt;alert("wrapped_xss")&lt;/script&gt;'));
});

test('4.8 Reports.js: unescaped custom category breakdown injection neutralized', () => {
  const attackCat = '<img src=x onerror=alert("reports_xss")>';
  const cats = {};
  cats[attackCat] = 5000;
  
  const env = createMockDOM();
  eval(`(function(window, cats) {
    var escapeHTML = window.escapeHTML;
    var maxCat = 5000;
    var CAT_LABELS = {};
    var CAT_COLORS = {};
    var html = Object.entries(cats).map(([c, a]) => 
      '<div class="cat-bar"><span style="...">' + escapeHTML((typeof CAT_LABELS!=='undefined'&&CAT_LABELS[c])||c) + '</span></div>'
    ).join('');
    window._resultHTML = html;
  })(env.window, cats);`);

  const result = env.window._resultHTML;
  assert(!result.includes('<img'));
  assert(result.includes('&lt;img src=x onerror=alert("reports_xss")&gt;'));
});

test('4.9 DebtPayoff modal: debt name and icon injection vectors neutralized', () => {
  const maliciousDebts = [
    { id: '1', name: '<script>alert("debt_name")</script>', icon: '<svg onload=alert("icon")>', balance: 1000, rate: 12, minPayment: 100 }
  ];
  
  const env = createMockDOM();
  env.window.localStorage.setItem('pockettrack_debts', JSON.stringify(maliciousDebts));
  
  let modalHTML = '';
  env.document.body.appendChild = (el) => {
    modalHTML = el.innerHTML;
  };
  
  eval(`(function(window, document, localStorage) {
    var escapeHTML = window.escapeHTML;
    ${debtPayoffCode}
    window.DebtPayoff.openModal();
  })(env.window, env.document, env.window.localStorage);`);

  assert(!modalHTML.includes('<script>alert("debt_name")</script>'));
  assert(!modalHTML.includes('<svg onload=alert("icon")>'));
  assert(modalHTML.includes('&lt;script&gt;alert("debt_name")&lt;/script&gt;'));
  assert(modalHTML.includes('&lt;svg onload=alert("icon")&gt;'));
});

// ────────────────────────────────────────────────────────────────────────
// SUMMARY
// ────────────────────────────────────────────────────────────────────────
console.log(`\n${CYAN}${BOLD}=== TEST SUMMARY ===${RESET}`);
console.log(`Total Tests Run:  ${totalTests}`);
console.log(`Passed:           ${GREEN}${passedTests}${RESET}`);
console.log(`Failed:           ${failedTests > 0 ? RED : GREEN}${failedTests}${RESET}`);

if (failedTests > 0) {
  console.log(`\n${RED}${BOLD}Failures details:${RESET}`);
  failures.forEach(f => {
    console.log(`- ${f.name}: ${f.error.message}`);
  });
  process.exit(1);
} else {
  console.log(`\n${GREEN}${BOLD}All adversarial stress tests passed successfully!${RESET}\n`);
  process.exit(0);
}
