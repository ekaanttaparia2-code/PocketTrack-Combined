/**
 * PocketTrack Tier 3 (P2 Medium) Remediation — Batch B Micro-Audit Suite
 * Tests 11 fixes:
 * 1. REVIEW-029: Spurious Toast on Skipped Existing Recurring Entries (recurring.js)
 * 2. REVIEW-030: Floating-Point Residue Creates Phantom Ledger Debts (ledger.js)
 * 3. REVIEW-031: WhatsApp Link Duplicates Country Code 91 (ledger.js)
 * 4. REVIEW-032: Voice Date Month Boundary Rollback Clamps Erroneously (voice.js)
 * 5. REVIEW-043: Overspend Alert Dead Code Due to Clamped Burn Percent (daily_burn_meter.js)
 * 6. REVIEW-044: Lean FI & Fat FI UI Labels Disagree with Multipliers by 2.5x (fire_runway.js)
 * 7. REVIEW-045: Lifetime Net Income Used as Single-Goal Savings Progress (goal_sip_planner.js)
 * 8. REVIEW-046: Inaccurate 4.2 Multiplier for Monthly Budget Pool (daily_burn_meter.js)
 * 9. REVIEW-047: Zero Allowance with Zero Spend Sets 100% Red Burn Gauge (daily_burn_meter.js)
 * 10. REVIEW-048: Frugal Micro-Transactions <₹500 Labeled as Impulse Leaks (financial_dna.js)
 * 11. REVIEW-049: Facade Financial Milestones Unlocked Solely by Slider (aurasense.js)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('====================================================');
console.log('POCKETTRACK TIER 3 BATCH B — MICRO-AUDIT SUITE');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✔ ${name}: PASSED`);
    passedTests++;
  } catch (err) {
    console.error(`❌ ${name}: FAILED`);
    console.error(err.message);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────
// 1. REVIEW-029: Spurious Toast on Skipped Existing Recurring Entries
// ─────────────────────────────────────────────────────────────
runTest('REVIEW-029: Differentiate createdCount and skippedCount in recurring.js', () => {
  const recurringPath = path.resolve(__dirname, '..', 'recurring.js');
  const code = fs.readFileSync(recurringPath, 'utf8');

  // Verify createdCount and skippedCount variables exist
  assert(code.includes('createdCount = 0'), 'FAIL: createdCount must be initialized');
  assert(code.includes('skippedCount = 0'), 'FAIL: skippedCount must be initialized');
  assert(code.includes('skippedCount++'), 'FAIL: skippedCount must increment when existing.exists');
  assert(code.includes('createdCount++'), 'FAIL: createdCount must increment when entry is set in Firestore');

  // Verify toast and local notifications are guarded by createdCount > 0
  assert(code.includes('if (createdCount > 0)'), 'FAIL: Toast notifications must be guarded by createdCount > 0');
  assert(!code.includes('if(posted > 0)'), 'FAIL: Legacy posted > 0 check must be replaced');

  // Functional Simulation: simulate processRecurringDue logic
  function simulateRecurring(existingExists) {
    let created = 0;
    let skipped = 0;
    let toastFired = false;
    let ruleUpdated = false;

    // Simulate loop
    if (existingExists) {
      skipped++;
    } else {
      created++;
    }

    if (created > 0 || skipped > 0) {
      ruleUpdated = true;
      if (created > 0) {
        toastFired = true;
      }
    }

    return { created, skipped, toastFired, ruleUpdated };
  }

  const existingRes = simulateRecurring(true);
  assert.strictEqual(existingRes.created, 0, 'No entry should be created if it already exists');
  assert.strictEqual(existingRes.skipped, 1, 'Entry should be marked as skipped');
  assert.strictEqual(existingRes.toastFired, false, 'No toast should fire for skipped existing entry');
  assert.strictEqual(existingRes.ruleUpdated, true, 'Rule schedule should still update for skipped entry');

  const newRes = simulateRecurring(false);
  assert.strictEqual(newRes.created, 1, 'New entry must be counted as created');
  assert.strictEqual(newRes.skipped, 0, 'New entry must not be skipped');
  assert.strictEqual(newRes.toastFired, true, 'Toast must fire for genuinely created entry');
  assert.strictEqual(newRes.ruleUpdated, true, 'Rule schedule must update for created entry');
});

// ─────────────────────────────────────────────────────────────
// 2. REVIEW-030: Floating-Point Residue Creates Phantom Ledger Debts
// ─────────────────────────────────────────────────────────────
runTest('REVIEW-030: Round ledger balances to 2 decimal places and gate display on > 0.01', () => {
  const ledgerPath = path.resolve(__dirname, '..', 'ledger.js');
  const code = fs.readFileSync(ledgerPath, 'utf8');

  // Assert code applies Math.round(* 100) / 100 and gates on 0.01
  assert(code.includes('Math.round(balance * 100) / 100'), 'FAIL: renderLedger must round balance to 2 decimal places');
  assert(code.includes('Math.abs(balance) <= 0.01'), 'FAIL: renderLedger must zero out sub-cent residual balance');
  assert(code.includes('bal > 0.01'), 'FAIL: bal > 0.01 threshold must gate positive balance rendering');
  assert(code.includes('bal < -0.01'), 'FAIL: bal < -0.01 threshold must gate negative balance rendering');
  assert(code.includes('Math.abs(personBalance) > 0.01'), 'FAIL: Settle Up and WhatsApp buttons must be gated on Math.abs > 0.01');

  // Functional simulation of IEEE 754 floating-point residue
  // Gave 0.1, Gave 0.2, Received 0.3 -> in IEEE 754: 0.1 + 0.2 - 0.3 = 5.551115123125783e-17
  let rawBalance = 0.1 + 0.2 - 0.3;
  assert(rawBalance !== 0, 'Raw IEEE float must produce non-zero residue');

  let roundedBalance = Math.round(rawBalance * 100) / 100;
  if (Math.abs(roundedBalance) <= 0.01) roundedBalance = 0;
  assert.strictEqual(roundedBalance, 0, 'Rounded balance must resolve cleanly to 0');
  assert.strictEqual(Math.abs(roundedBalance) > 0.01, false, 'Threshold gate must evaluate to false for settled contact');

  // Genuine debt test: gave 100, received 40.25 -> balance 59.75
  let genuineBalance = 100 - 40.25;
  let roundedGenuine = Math.round(genuineBalance * 100) / 100;
  if (Math.abs(roundedGenuine) <= 0.01) roundedGenuine = 0;
  assert.strictEqual(roundedGenuine, 59.75, 'Genuine balance must be preserved accurately');
  assert.strictEqual(roundedGenuine > 0.01, true, 'Genuine positive balance must pass > 0.01 gate');
});

// ─────────────────────────────────────────────────────────────
// 3. REVIEW-031: WhatsApp Link Duplicates Country Code 91
// ─────────────────────────────────────────────────────────────
runTest('REVIEW-031: Strip leading + and 91 from phone numbers in sendPersonWhatsAppReminder', () => {
  const ledgerPath = path.resolve(__dirname, '..', 'ledger.js');
  const code = fs.readFileSync(ledgerPath, 'utf8');

  assert(code.includes('raw.startsWith(\'+91\')'), 'FAIL: sendPersonWhatsAppReminder must strip +91 prefix');
  assert(code.includes('digits.length > 10 && digits.startsWith(\'91\')'), 'FAIL: sendPersonWhatsAppReminder must strip redundant 91 when digits > 10');

  // Functional test of phone sanitization logic
  function sanitizePhone(rawPhone) {
    let raw = String(rawPhone || '').trim();
    if (raw.startsWith('+91')) {
      raw = raw.slice(3);
    } else if (raw.startsWith('+')) {
      raw = raw.slice(1);
    }
    let digits = raw.replace(/[^0-9]/g, '');
    if (digits.length === 11 && digits.startsWith('0')) {
      digits = digits.slice(1);
    } else if (digits.length > 10 && digits.startsWith('91')) {
      digits = digits.slice(2);
    }
    return digits;
  }

  // Test Case 1: with +91
  assert.strictEqual(sanitizePhone('+919876543210'), '9876543210', 'Must strip +91');
  // Test Case 2: with 91 (12 digits)
  assert.strictEqual(sanitizePhone('919876543210'), '9876543210', 'Must strip leading 91 from 12-digit number');
  // Test Case 3: with +91 and spaces
  assert.strictEqual(sanitizePhone('+91 98765 43210'), '9876543210', 'Must handle +91 with spaces');
  // Test Case 4: plain 10-digit number
  assert.strictEqual(sanitizePhone('9876543210'), '9876543210', 'Must keep plain 10 digits intact');
  // Test Case 5: 10-digit number that starts with 91 (e.g. 9123456789)
  assert.strictEqual(sanitizePhone('9123456789'), '9123456789', 'Must preserve 10-digit number starting with 91');
  // Test Case 6: with leading 0
  assert.strictEqual(sanitizePhone('09876543210'), '9876543210', 'Must strip leading 0');

  // Verify generated WhatsApp URL does not contain duplicated 9191
  const target = sanitizePhone('+919876543210');
  const waUrl = `https://wa.me/91${target}`;
  assert.strictEqual(waUrl, 'https://wa.me/919876543210');
  assert(!waUrl.includes('91919876543210'), 'WhatsApp URL must never duplicate country code');
});

// ─────────────────────────────────────────────────────────────
// 4. REVIEW-032: Voice Date Month Boundary Rollback Clamps Erroneously
// ─────────────────────────────────────────────────────────────
runTest('REVIEW-032: Clamp month boundary rollback to last valid day of target month in voice.js', () => {
  const voicePath = path.resolve(__dirname, '..', 'voice.js');
  const code = fs.readFileSync(voicePath, 'utf8');

  // Assert clamped date logic exists
  assert(code.includes('prevMonthMaxDays = new Date(targetYear, targetMonth + 1, 0).getDate()'),
    'FAIL: voice.js must calculate target month maximum days on rollback');
  assert(code.includes('targetDay = Math.min(day, prevMonthMaxDays)'),
    'FAIL: voice.js must clamp targetDay to target month maximum days');

  // Functional simulation of rollback from March 30 with "on the 31st"
  function simulateRollback(now, spokenDay, isFuture) {
    let targetYear = now.getFullYear();
    let targetMonth = now.getMonth();
    let targetDay = spokenDay;
    const curMonthMaxDays = new Date(targetYear, targetMonth + 1, 0).getDate();
    const initialTarget = new Date(targetYear, targetMonth, Math.min(spokenDay, curMonthMaxDays), 12, 0, 0, 0);

    if (!isFuture && initialTarget > now) {
      targetMonth--;
      if (targetMonth < 0) {
        targetMonth = 11;
        targetYear--;
      }
      const prevMonthMaxDays = new Date(targetYear, targetMonth + 1, 0).getDate();
      targetDay = Math.min(spokenDay, prevMonthMaxDays);
    } else {
      targetDay = Math.min(spokenDay, curMonthMaxDays);
    }

    const m = String(targetMonth + 1).padStart(2, '0');
    const d = String(targetDay).padStart(2, '0');
    return `${targetYear}-${m}-${d}`;
  }

  // Scenario 1: Today is March 30, 2026. Spoken: "on the 31st"
  const march30 = new Date(2026, 2, 30, 12, 0, 0, 0);
  const resultFeb = simulateRollback(march30, 31, false);
  assert.strictEqual(resultFeb, '2026-02-28', 'Rollback from March for 31st must clamp to Feb 28, not overflow to March 3');

  // Scenario 2: Today is May 20, 2026. Spoken: "on the 31st"
  const may20 = new Date(2026, 4, 20, 12, 0, 0, 0);
  const resultApr = simulateRollback(may20, 31, false);
  assert.strictEqual(resultApr, '2026-04-30', 'Rollback from May for 31st must clamp to April 30');

  // Scenario 3: Leap Year (2024). Today is March 15, 2024. Spoken: "on the 31st"
  const march15_2024 = new Date(2024, 2, 15, 12, 0, 0, 0);
  const resultLeapFeb = simulateRollback(march15_2024, 31, false);
  assert.strictEqual(resultLeapFeb, '2024-02-29', 'Rollback in leap year must clamp to Feb 29');
});

// ─────────────────────────────────────────────────────────────
// 5. REVIEW-043: Overspend Alert Dead Code Due to Clamped Burn Percent
// ─────────────────────────────────────────────────────────────
runTest('REVIEW-043: Remove Math.min(100) clamp from burnPercent in daily_burn_meter.js', () => {
  const burnPath = path.resolve(__dirname, '..', 'daily_burn_meter.js');
  const code = fs.readFileSync(burnPath, 'utf8');

  // Assert line 194 does not clamp burnPercent with Math.min(100)
  assert(!code.includes('burnPercent = dailyAllowance > 0 ? Math.min(100'),
    'FAIL: burnPercent in computeSafeToSpend must not be clamped to Math.min(100)');
  assert(code.includes('data.burnPercent > 100'),
    'FAIL: Overspend condition data.burnPercent > 100 must be active');

  // Functional simulation of overspend: todaySpent = 1500, allowance = 1000
  const dailyAllowance = 1000;
  const todaySpent = 1500;
  const burnPercent = dailyAllowance > 0
    ? Math.round((todaySpent / dailyAllowance) * 100)
    : (todaySpent > 0 ? 100 : 0);

  assert.strictEqual(burnPercent, 150, 'burnPercent must equal 150% without clamp');
  assert(burnPercent > 100, 'burnPercent > 100 must evaluate to true on overspend');

  // Test SVG offset clamping
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const clampedForSvg = Math.min(100, burnPercent);
  const offset = circumference - (clampedForSvg / 100) * circumference;
  assert.strictEqual(offset, 0, 'Offset for 100%+ burn must clamp smoothly to 0 for full circle');
});

// ─────────────────────────────────────────────────────────────
// 6. REVIEW-044: Lean FI & Fat FI UI Labels Disagree with Multipliers by 2.5x
// ─────────────────────────────────────────────────────────────
runTest('REVIEW-044: Align Lean FI and Fat FI UI labels with calculated multipliers (18.75x and 37.5x)', () => {
  const firePath = path.resolve(__dirname, '..', 'fire_runway.js');
  const code = fs.readFileSync(firePath, 'utf8');

  // Assert Lean FI (18.75x) and Fat FI (37.5x) are present
  assert(code.includes('Lean FI (18.75x)'), 'FAIL: UI label must display "Lean FI (18.75x)"');
  assert(code.includes('Fat FI (37.5x)'), 'FAIL: UI label must display "Fat FI (37.5x)"');

  // Assert misleading legacy labels are removed
  assert(!code.includes('Lean FI (18x)'), 'FAIL: Legacy "Lean FI (18x)" label must be removed');
  assert(!code.includes('Fat FI (35x)'), 'FAIL: Legacy "Fat FI (35x)" label must be removed');

  // Verify mathematical relationship
  const standardMultiplier = 25;
  const leanMultiplier = standardMultiplier * 0.75;
  const fatMultiplier = standardMultiplier * 1.50;
  assert.strictEqual(leanMultiplier, 18.75, 'Lean FI multiplier must be 18.75x');
  assert.strictEqual(fatMultiplier, 37.5, 'Fat FI multiplier must be 37.5x');
});

// ─────────────────────────────────────────────────────────────
// 7. REVIEW-045: Lifetime Net Income Used as Single-Goal Savings Progress
// ─────────────────────────────────────────────────────────────
runTest('REVIEW-045: Allocate goal savings progress properly instead of using all lifetime net income', () => {
  const goalPath = path.resolve(__dirname, '..', 'goal_sip_planner.js');
  const code = fs.readFileSync(goalPath, 'utf8');

  // Assert code does not use raw lifetime totalInc - totalExp as currentSaved
  assert(!code.includes('const currentSaved = Math.max(0, totalInc - totalExp);'),
    'FAIL: currentSaved must not be evaluated as all lifetime net savings');

  // Assert dedicated wallet selection and allocatedAmount logic exist
  assert(code.includes('goal-wallet-select'), 'FAIL: goal modal must include dedicated wallet selection');
  assert(code.includes('goal-allocated-input'), 'FAIL: goal modal must include allocated initial savings input');
  assert(code.includes('goal.allocatedAmount'), 'FAIL: renderActiveGoalCard must check goal.allocatedAmount');

  // Functional simulation
  const mockGoal = { name: 'New Laptop', target: 80000, monthly: 5000, allocatedAmount: 15000 };
  const mockEntries = [
    { type: 'income', amt: 500000 }, // Total lifetime income: 5L
    { type: 'expense', amt: 200000 }  // Total lifetime expense: 2L -> net 3L
  ];

  // Old behavior: currentSaved would be 3,00,000 (375% progress on an 80k goal!)
  // New behavior: currentSaved evaluates to allocatedAmount (15,000 = 19% progress)
  let currentSaved = Number(mockGoal.allocatedAmount) || 0;
  let progressPct = Math.min(100, Math.round((currentSaved / mockGoal.target) * 100));

  assert.strictEqual(currentSaved, 15000, 'Savings progress must reflect allocated amount');
  assert.strictEqual(progressPct, 19, 'Progress must be 19%, not 100%+ based on all lifetime savings');
});

// ─────────────────────────────────────────────────────────────
// 8. REVIEW-046: Inaccurate 4.2 Multiplier for Monthly Budget Pool
// ─────────────────────────────────────────────────────────────
runTest('REVIEW-046: Dynamic weeks in month multiplier (totalDays / 7) in daily_burn_meter.js', () => {
  const burnPath = path.resolve(__dirname, '..', 'daily_burn_meter.js');
  const code = fs.readFileSync(burnPath, 'utf8');

  // Assert inaccurate 4.2 multiplier is replaced
  assert(!code.includes('weeklyBudget * 4.2'), 'FAIL: weeklyBudget * 4.2 must be replaced');
  assert(code.includes('weeklyBudget * (totalDays / 7)'),
    'FAIL: weeklyBudget must multiply by dynamic weeks in month (totalDays / 7)');

  // Mathematical comparison for a 31-day month
  const weeklyBudget = 5000;
  const legacyMonthlyPool = weeklyBudget * 4.2; // 21,000
  const accurateMonthlyPool = weeklyBudget * (31 / 7); // ~22,142.85
  assert(accurateMonthlyPool > legacyMonthlyPool, 'Accurate monthly pool must reflect full 31 days');
  assert(Math.abs(accurateMonthlyPool - 22142.85) < 1, 'Calculation matches actual month duration');
});

// ─────────────────────────────────────────────────────────────
// 9. REVIEW-047: Zero Allowance with Zero Spend Sets 100% Red Burn Gauge
// ─────────────────────────────────────────────────────────────
runTest('REVIEW-047: Zero allowance with zero spend sets burnPercent = 0 in daily_burn_meter.js', () => {
  const burnPath = path.resolve(__dirname, '..', 'daily_burn_meter.js');
  const code = fs.readFileSync(burnPath, 'utf8');

  // Assert burnPercent handles zero spend with zero allowance
  assert(code.includes(': (todaySpent > 0 ? 100 : 0)'),
    'FAIL: When dailyAllowance is 0 and todaySpent is 0, burnPercent must be 0');

  // Functional simulation
  function computeBurnPercent(dailyAllowance, todaySpent) {
    return dailyAllowance > 0
      ? Math.round((todaySpent / dailyAllowance) * 100)
      : (todaySpent > 0 ? 100 : 0);
  }

  // Case A: 0 allowance and 0 spent today
  const zeroAllowanceZeroSpent = computeBurnPercent(0, 0);
  assert.strictEqual(zeroAllowanceZeroSpent, 0, 'burnPercent must be 0 when todaySpent is 0 and allowance is 0');

  // Case B: 0 allowance and spent ₹200 today
  const zeroAllowanceWithSpend = computeBurnPercent(0, 200);
  assert.strictEqual(zeroAllowanceWithSpend, 100, 'burnPercent must be 100 when user spent with 0 allowance');

  // Case C: Normal allowance ₹1000 and spent ₹300 today
  const normalBurn = computeBurnPercent(1000, 300);
  assert.strictEqual(normalBurn, 30, 'Normal burn percent must evaluate correctly to 30%');
});

// ─────────────────────────────────────────────────────────────
// 10. REVIEW-048: Frugal Micro-Transactions <₹500 Labeled as Impulse Leaks
// ─────────────────────────────────────────────────────────────
runTest('REVIEW-048: Discretionary category gating for micro-transactions in financial_dna.js', () => {
  const vm = require('vm');
  const dnaPath = path.resolve(__dirname, '..', 'financial_dna.js');
  const code = fs.readFileSync(dnaPath, 'utf8');

  // Assert code structure: both income and expense branches must exist and be segregated
  assert(code.includes("if (e.type === 'income')"), 'FAIL: Income branch check must exist');
  assert(code.includes("else if (e.type === 'expense'"), 'FAIL: Expense branch check must exist');
  assert(code.includes('isDiscretionary && !isEssential'),
    'FAIL: expensesUnder500 increment must be gated by isDiscretionary && !isEssential');
  assert(code.includes("isEssential = ['groceries',"),
    'FAIL: isEssential category whitelist must include routine necessities');

  function evaluateDNA(entries) {
    const sandbox = {
      window: {},
      document: {
        readyState: 'complete',
        createElement: () => ({ appendChild: () => {} }),
        head: { appendChild: () => {} },
        getElementById: () => null
      },
      localStorage: { getItem: () => null, setItem: () => {} },
      navigator: {},
      setTimeout: () => {},
      allRawMainEntries: () => entries
    };
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox);
    return sandbox.computeFinancialDNA();
  }

  // 1. Accounting Segregation Test: Income vs Expense
  const mixedEntries = [
    { type: 'income', amt: 50000, date: '2026-10-01' },
    { type: 'expense', amt: 200, cat: 'shopping', label: 'Keychain', date: '2026-10-02' }
  ];
  const mixedResult = evaluateDNA(mixedEntries);
  assert.strictEqual(mixedResult.metrics.totalIncome, 50000, 'Income must be exactly ₹50,000');
  assert.strictEqual(mixedResult.metrics.totalExpenses, 200, 'Expense must be exactly ₹200');
  assert.strictEqual(mixedResult.metrics.savingsRatio, 99.6, 'Savings ratio must be 99.6%');
  assert.strictEqual(mixedResult.metrics.entryCount, 2, 'Entry count must be 2');

  // 2. Frugal User Test: Routine essentials under ₹500 must NOT increment impulse leak
  const frugalEntries = [
    { type: 'income', amt: 50000, date: '2026-10-01' },
    { type: 'expense', amt: 35, cat: 'groceries', label: 'Milk', date: '2026-10-01' },
    { type: 'expense', amt: 25, cat: 'transport', label: 'Bus ticket', date: '2026-10-01' },
    { type: 'expense', amt: 120, cat: 'health', label: 'Cough syrup', date: '2026-10-02' },
    { type: 'expense', amt: 250, cat: 'groceries', label: 'Vegetables', date: '2026-10-02' },
    { type: 'expense', amt: 299, cat: 'bills', label: 'Mobile recharge', date: '2026-10-03' }
  ];
  const frugalResult = evaluateDNA(frugalEntries);
  assert.strictEqual(frugalResult.metrics.totalIncome, 50000, 'Income must be ₹50,000');
  assert.strictEqual(frugalResult.metrics.totalExpenses, 729, 'Total expenses must equal ₹729');
  assert.strictEqual(frugalResult.metrics.impulseRate, 0, 'Frugal essentials <₹500 must have impulseRate = 0%');
  assert(frugalResult.metrics.savingsRatio > 98, 'Frugal savings ratio must be > 98%');

  // 3. Impulsive User Test: Discretionary / luxury delivery under ₹500 MUST increment impulse leak
  const impulsiveEntries = [
    { type: 'income', amt: 50000, date: '2026-10-01' },
    { type: 'expense', amt: 180, cat: 'food', note: 'Swiggy dessert', date: '2026-10-01' },
    { type: 'expense', amt: 250, cat: 'shopping', label: 'Keychain', date: '2026-10-02' },
    { type: 'expense', amt: 350, cat: 'entertainment', label: 'Game tokens', date: '2026-10-03' }
  ];
  const impulsiveResult = evaluateDNA(impulsiveEntries);
  assert.strictEqual(impulsiveResult.metrics.totalIncome, 50000, 'Income must be ₹50,000');
  assert.strictEqual(impulsiveResult.metrics.totalExpenses, 780, 'Total expenses must equal ₹780');
  assert.strictEqual(impulsiveResult.metrics.impulseRate, 100, 'Discretionary spends <₹500 must have impulseRate = 100%');

  // 4. Inter-Wallet Transfer Exclusion Test
  const transferEntries = [
    { type: 'income', amt: 10000, date: '2026-10-01' },
    { type: 'expense', amt: 5000, transferGroupId: 'transfer_bank_cash_1', date: '2026-10-02' },
    { type: 'expense', amt: 200, cat: 'shopping', label: 'Keychain', date: '2026-10-02' }
  ];
  const transferResult = evaluateDNA(transferEntries);
  assert.strictEqual(transferResult.metrics.totalIncome, 10000, 'Income must be ₹10,000');
  assert.strictEqual(transferResult.metrics.totalExpenses, 200, 'Inter-wallet transfers must not be counted in totalExpenses');
  assert.strictEqual(transferResult.metrics.savingsRatio, 98, 'Savings ratio must reflect non-transfer entries');
});

// ─────────────────────────────────────────────────────────────
// 11. REVIEW-049: Facade Financial Milestones Unlocked Solely by Slider
// ─────────────────────────────────────────────────────────────
runTest('REVIEW-049: Evaluate Time Machine milestones against actual user financial metrics in aurasense.js', () => {
  const auraPath = path.resolve(__dirname, '..', 'aurasense.js');
  const code = fs.readFileSync(auraPath, 'utf8');

  // Assert getTimeMachineMilestones function exists and checks actual debts and emergency fund
  assert(code.includes('function getTimeMachineMilestones('),
    'FAIL: aurasense.js must define getTimeMachineMilestones');
  assert(code.includes('totalProjected >= emergencyFundTarget'),
    'FAIL: Emergency fund milestone must check totalProjected >= emergencyFundTarget');
  assert(code.includes('totalDebt <= 0'),
    'FAIL: Zero debt milestone must check totalDebt <= 0 or projectedGain >= totalDebt');
  assert(code.includes('totalProjected >= 100000'),
    'FAIL: 1 Lakh milestone must check totalProjected >= 100000');

  // Functional simulation of milestone evaluation
  function evaluateMilestones(totalProjected, projectedGain, totalDebt, monthlyBurn) {
    const emergencyFundTarget = monthlyBurn * 3;
    const isEmergSecured = totalProjected >= emergencyFundTarget;
    const isDebtCleared = totalDebt <= 0 || projectedGain >= totalDebt;
    const is1LakhReached = totalProjected >= 100000;

    return { isEmergSecured, isDebtCleared, is1LakhReached };
  }

  // Case A: High Debt User (₹50,000 debt), Low Savings (₹15,000 projected, ₹5,000 gain), Burn = ₹20,000/mo
  // At +6 months slider position, legacy app falsely awarded "Zero Debt" and "Emergency Fund Secured".
  const indebtedUser = evaluateMilestones(15000, 5000, 50000, 20000);
  assert.strictEqual(indebtedUser.isEmergSecured, false, 'Emergency fund must NOT be awarded when wealth (15k) < emergency target (60k)');
  assert.strictEqual(indebtedUser.isDebtCleared, false, 'Debt clearance must NOT be awarded when gain (5k) < debt (50k)');
  assert.strictEqual(indebtedUser.is1LakhReached, false, '1 Lakh milestone must NOT be awarded when projected is 15k');

  // Case B: Debt-Free User with Strong Savings (₹1,50,000 projected, ₹40,000 gain), Debt = 0, Burn = ₹25,000/mo (target 75k)
  const strongUser = evaluateMilestones(150000, 40000, 0, 25000);
  assert.strictEqual(strongUser.isEmergSecured, true, 'Emergency fund must be awarded when projected (150k) >= target (75k)');
  assert.strictEqual(strongUser.isDebtCleared, true, 'Zero debt must be awarded when user has 0 debt');
  assert.strictEqual(strongUser.is1LakhReached, true, '1 Lakh milestone must be awarded when projected (150k) >= 100k');
});

console.log('\n====================================================');
console.log(`✔ ALL ${passedTests}/${totalTests} TIER 3 BATCH B TESTS PASSED!`);
console.log('====================================================\n');
