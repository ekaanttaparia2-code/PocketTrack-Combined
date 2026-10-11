/**
 * Challenge Test 6: REVIEW-034 (fire_runway.js)
 * Tests runway calculations across 4 specific cases:
 * Case A: Multi-month user with Day 1 micro-expense (primary REVIEW-034 regression test)
 * Case B: Zero expense history (brand new user with no expenses)
 * Case C: Brand new user with 0 prior history and Day 1 micro-expense (adversarial challenge)
 * Case D: Multi-month user with normal spending history
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TEST 6: FIRE Runway Calculation Stress Test (REVIEW-034) ===');

function loadFireRunway(entries) {
  const code = fs.readFileSync(path.resolve(__dirname, '..', 'fire_runway.js'), 'utf8');
  const mockWindow = {
    entries: entries,
    currentLang: 'en'
  };
  const mockDoc = {
    createElement: () => ({ style: {} }),
    getElementById: () => null,
    body: { appendChild: () => {} }
  };
  const runner = new Function('window', 'document', 'localStorage', code);
  runner(mockWindow, mockDoc, { getItem: () => null, setItem: () => {} });
  assert(mockWindow.FireRunway, 'FAIL: FireRunway not exposed');
  return mockWindow.FireRunway.getData();
}

const now = new Date();
const curMonth = now.toISOString().slice(0, 7);
const todayStr = now.toISOString().slice(0, 10);

// Helper for past month strings
function getPastMonth(monthsAgo) {
  const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 15);
  return d.toISOString().slice(0, 7);
}

// -------------------------------------------------------------
// Case A: Multi-Month User with Day 1 micro-expense
// -------------------------------------------------------------
console.log('\n--- Case A: Multi-Month User with Day 1 Micro-Expense (Primary REVIEW-034 Test) ---');
{
  const m1 = getPastMonth(2);
  const m2 = getPastMonth(1);

  const entries = [
    { type: 'income', amt: 120000, date: `${m1}-01` },
    { type: 'expense', amt: 30000, date: `${m1}-15` },
    { type: 'expense', amt: 34000, date: `${m2}-15` },
    // Day 1 micro-expense in current month
    { type: 'expense', amt: 20, date: todayStr }
  ];

  const data = loadFireRunway(entries);
  console.log(`Multi-month user results:`, {
    liquidAssets: data.liquidAssets,
    monthlyBurn: data.monthlyBurn,
    runwayMonths: data.runwayMonths,
    status: data.status
  });

  // Expected monthly burn should be historical average: (30000 + 34000) / 2 = 32000
  assert.strictEqual(data.monthlyBurn, 32000, `Expected historical average ₹32,000, got ₹${data.monthlyBurn}`);
  assert.notStrictEqual(data.monthlyBurn, 20, `CRITICAL FAIL: Monthly burn must NOT be ₹20 from Day 1 micro-expense!`);
  
  // Liquid assets = 120,000 - 30,000 - 34,000 - 20 = 55,980
  // Runway = 55,980 / 32,000 = 1.7 months
  assert(data.runwayMonths < 3, `Runway should be realistic (< 3 months), got ${data.runwayMonths}`);
  assert.strictEqual(data.status, 'critical');
  console.log('✔ PASS: Multi-month user uses completed prior months average; Day 1 micro-expense does NOT distort burn.');
}

// -------------------------------------------------------------
// Case B: Zero Expense History
// -------------------------------------------------------------
console.log('\n--- Case B: User with Zero Expense History ---');
{
  const entries = [
    { type: 'income', amt: 100000, date: todayStr }
  ];

  const data = loadFireRunway(entries);
  console.log(`Zero expense history results:`, {
    liquidAssets: data.liquidAssets,
    monthlyBurn: data.monthlyBurn,
    runwayMonths: data.runwayMonths,
    status: data.status
  });

  // Fallback monthlyBurn is default floor: 25000
  assert.strictEqual(data.monthlyBurn, 25000, `Expected default fallback burn ₹25,000, got ₹${data.monthlyBurn}`);
  assert.strictEqual(data.liquidAssets, 100000);
  assert.strictEqual(data.runwayMonths, 4.0); // 100,000 / 25,000 = 4.0
  assert.strictEqual(data.status, 'fair');
  console.log('✔ PASS: Zero expense history correctly falls back to ₹25,000 default floor.');
}

// -------------------------------------------------------------
// Case C: Brand New User with 0 Prior History and Day 1 Micro-Expense
// -------------------------------------------------------------
console.log('\n--- Case C: Brand New User (0 Prior History) with Day 1 Micro-Expense ---');
{
  const entries = [
    { type: 'income', amt: 50000, date: todayStr },
    { type: 'expense', amt: 20, date: todayStr }
  ];

  const data = loadFireRunway(entries);
  console.log(`Brand new user results:`, {
    liquidAssets: data.liquidAssets,
    monthlyBurn: data.monthlyBurn,
    runwayMonths: data.runwayMonths,
    status: data.status
  });

  console.log(`Observation for Brand New User: monthlyBurn = ₹${data.monthlyBurn}, runwayMonths = ${data.runwayMonths} months (${(data.runwayMonths / 12).toFixed(1)} years), status = '${data.status}'`);

  // Verify that brand new user with Day 1 micro-expense does not collapse to pocket change burn
  const isBugPresent = (data.monthlyBurn === 20 && data.runwayMonths > 1000 && data.status === 'fortress');
  assert.strictEqual(isBugPresent, false, 'CRITICAL FAIL: Brand new user with ₹20 Day 1 expense evaluated with monthlyBurn=₹20 and 208 years of runway!');
  assert.strictEqual(data.monthlyBurn, 25000, `Expected default floor burn ₹25,000, got ₹${data.monthlyBurn}`);
  assert.strictEqual(data.runwayMonths, 2.0); // 49,980 / 25,000 = 1.999 -> 2.0
  assert.strictEqual(data.status, 'critical');
  console.log('✔ PASS: Brand new user with micro-expense protected by ₹25,000 floor (monthlyBurn=₹25,000, runway=2.0 mo, status=critical).');
}

// -------------------------------------------------------------
// Case D: Inter-Wallet Transfer Exclusion
// -------------------------------------------------------------
console.log('\n--- Case D: Inter-Wallet Transfer Exclusion ---');
{
  const m1 = getPastMonth(1);
  const entries = [
    { type: 'income', amt: 50000, date: `${m1}-01` },
    { type: 'expense', amt: 20000, date: `${m1}-05` },
    // Transfer marked with transferGroupId
    { type: 'expense', amt: 15000, date: `${m1}-10`, transferGroupId: 'transfer_123' }
  ];

  const data = loadFireRunway(entries);
  // Transfer must be excluded from both liquid assets deduction and monthly burn
  // Total expenses = 20,000 (excluding transfer)
  assert.strictEqual(data.monthlyBurn, 20000, `Expected transfer to be excluded from burn, got ₹${data.monthlyBurn}`);
  console.log('✔ PASS: Inter-wallet transfers (transferGroupId) correctly excluded from burn rate.');
}

console.log('\n=== TEST 6 RUN COMPLETE ===\n');
