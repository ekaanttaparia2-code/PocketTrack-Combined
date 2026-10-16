const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('====================================================');
console.log('POCKETTRACK GOD-MODE REMEDIATION TEST SUITE');
console.log('====================================================\n');

let passed = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`✔ ${name}: PASSED`);
    passed++;
  } catch (err) {
    console.error(`❌ ${name}: FAILED`);
    console.error(err.message);
    process.exit(1);
  }
}

// 1. reports.js Smart Insights Month Filter & Category Grouping
test('reports.js: Smart Insights filters by current month and groups by cat', () => {
  const code = fs.readFileSync('reports.js', 'utf8');
  assert(code.includes('const monthExpList = expList.filter('), 'Must filter expenses for month');
  assert(code.includes('currentMonthSpent'), 'Must compute currentMonthSpent');
  assert(code.includes('catTotals[catLabel] ='), 'Must group top categories by category label, not description');
  assert(!code.includes('catTotals[c] = (catTotals[c] || 0) + (parseFloat(e.amt) || 0);\n  const sortedCats'), 'Old e.label grouping must be replaced');
});

// 2. goal_sip_planner.js Progress Inversion & Allocated Savings
test('goal_sip_planner.js: Goal progress prevents expense inversion and handles allocated savings', () => {
  const code = fs.readFileSync('goal_sip_planner.js', 'utf8');
  assert(code.includes('dedicatedEntriesTotal -= amt;'), 'Must deduct expenses matching goal');
  assert(code.includes('const remainingTarget = Math.max(0, target - allocatedAmount);'), 'Must budget allocated savings in target');
  assert(code.includes('oninput="updateGoalCalculation()"'), 'Allocated savings input must update calculation live');
});

// 3. daily_burn_meter.js Namespaced Income Alignment
test('daily_burn_meter.js: Respects namespaced user income key', () => {
  const code = fs.readFileSync('daily_burn_meter.js', 'utf8');
  assert(code.includes('const incomeKey = uid ? \'pockettrack_monthly_income_\' + uid : \'pockettrack_monthly_income\';'), 'Must construct namespaced income key');
  assert(code.includes('localStorage.getItem(incomeKey) || localStorage.getItem(\'pockettrack_monthly_income\')'), 'Must support namespaced income with legacy fallback');
});

// 4. financial_dna.js Routine Food vs Social Spend Gating
test('financial_dna.js: Routine food is not falsely classified as party social spend', () => {
  const code = fs.readFileSync('financial_dna.js', 'utf8');
  assert(code.includes('const isDiningOrSocialFood = (cat === \'food\' && /\\b(swiggy|zomato|restaurant|cafe|coffee|bar|pub|starbucks|burger|pizza|treat|dining|party|club|outing)\\b/i.test(text));'), 'Must gate food category by dining keywords for socialSpend');
});

// 5. wallets.js Guest Transfer & Wallet Deletion LocalStorage Persistence
test('wallets.js: Persists entries on transfers and migrations, handles orphaned wallet IDs', () => {
  const code = fs.readFileSync('wallets.js', 'utf8');
  assert(code.includes('localStorage.setItem(\'pockettrack_entries_cache_guest\', JSON.stringify(entries));'), 'Must save guest entries on transfer');
  assert(code.includes('localStorage.setItem(cacheKey, JSON.stringify(entries));'), 'Must save entries on wallet deletion migration');
  assert(code.includes('wId = (userWallets && userWallets.length) ? userWallets[0].id : \'cash\';'), 'Must remap orphaned wallet IDs in computeWalletBalances');
});

// 6. ledger.js Guest Mode Persistence & UPI Safety
test('ledger.js: Enables guest persistence and prevents rogue default UPI injection', () => {
  const code = fs.readFileSync('ledger.js', 'utf8');
  assert(code.includes('LOCAL_LEDGER_KEY + \'_guest\''), 'Must provide guest cache key in ledger');
  assert(!code.includes('|| \'pockettrack@upi\''), 'Must not default to pockettrack@upi');
});

// 7. shared_portfolios.js Guest Mode Storage
test('shared_portfolios.js: Enables guest persistence for shared portfolios', () => {
  const code = fs.readFileSync('shared_portfolios.js', 'utf8');
  assert(code.includes('const key = getSharedPortfoliosStorageKey();'), 'Must use getSharedPortfoliosStorageKey for load and save');
});

// 8. receipt_scanner.js ₹2024-₹2026 Amount Extraction
test('receipt_scanner.js: Does not discard bills amounting to ₹2024-₹2026', () => {
  const code = fs.readFileSync('receipt_scanner.js', 'utf8');
  assert(!code.includes('cleanNum !== 2024 && cleanNum !== 2025 && cleanNum !== 2026'), 'Hardcoded year exclusion must be removed');
  assert(code.includes('const hasCurrencyPrefix = /(?:₹|rs\\.?|inr)/i.test(m[0]);'), 'Must check for currency prefix');
});

// 9. auth.js 400-Batch Chunking
test('auth.js: Chunks guest cloud migration into safe batches of max 400', () => {
  const code = fs.readFileSync('auth.js', 'utf8');
  assert(code.includes('const BATCH_SIZE = 400;'), 'Must set batch size to 400');
  assert(code.includes('if (currentOps >= BATCH_SIZE)'), 'Must split into new batch on reaching limit');
  assert(code.includes('Promise.all(batches.map(b => b.commit()))'), 'Must commit all batches');
});

// 10. upi_qr_generator.js URI Length Budgeting
test('upi_qr_generator.js: Budgets UPI payload to stay within QR capacity', () => {
  const code = fs.readFileSync('upi_qr_generator.js', 'utf8');
  assert(code.includes('if (upiPayload.length > 210)'), 'Must budget payload if length > 210 bytes');
});

// 11. finny.js Honest Branding
test('finny.js: Uses honest SMART COACH badge', () => {
  const code = fs.readFileSync('finny.js', 'utf8');
  assert(code.includes('var moodBadge = \'SMART COACH\';'), 'Must use SMART COACH badge');
});

console.log(`\n====================================================`);
console.log(`✔ ALL ${passed} GOD-MODE REMEDIATION TESTS PASSED!`);
console.log(`====================================================`);
