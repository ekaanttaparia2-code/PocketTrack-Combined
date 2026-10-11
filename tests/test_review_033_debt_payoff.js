/**
 * Challenge Test 5: REVIEW-033 (debt_payoff.js)
 * Tests Snowball vs Avalanche strategies across diverse debt scenarios:
 * - Single debt
 * - 2 debts (tension case & equal interest case)
 * - 5 debts (diverse rates & balances)
 * - High vs low vs zero extra payments
 * - Rollover invariant validation (total monthly cashflow preservation)
 * - 100-scenario randomized portfolio fuzzing asserting I_avalanche <= I_snowball.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TEST 5: Debt Payoff Amortization & Rollover (REVIEW-033) ===');

// Load calculateStrategy via window.DebtPayoff.calculate
const dpCode = fs.readFileSync(path.resolve(__dirname, '..', 'debt_payoff.js'), 'utf8');
const mockWindow = {};
const mockDoc = { createElement: () => ({ style: {} }), getElementById: () => null, body: { appendChild: () => {} } };
const runner = new Function('window', 'document', 'localStorage', dpCode);
runner(mockWindow, mockDoc, { getItem: () => null, setItem: () => {} });

assert(mockWindow.DebtPayoff && typeof mockWindow.DebtPayoff.calculate === 'function', 'FAIL: DebtPayoff.calculate not exposed');
const calculateStrategy = mockWindow.DebtPayoff.calculate;

// -------------------------------------------------------------
// 1. Rollover Invariant Verification
// -------------------------------------------------------------
console.log('\n--- 1. Testing Rollover Invariant ---');
{
  // 2 debts: Debt 1 has balance 3000, min 2000, rate 12%. Debt 2 has balance 20000, min 1000, rate 24%.
  // In month 1: Debt 1 gets 2000 min. Balance becomes ~1030.
  // In month 2: Debt 1 has 1030 balance. Min payment of 2000 pays 1030. Excess 970 MUST roll into Debt 2!
  // In month 3: Debt 1 is 0. Full 2000 min MUST roll into Debt 2!
  const debts = [
    { name: 'Small Debt', balance: 3000, rate: 12, minPayment: 2000 },
    { name: 'Big Debt', balance: 20000, rate: 24, minPayment: 1000 }
  ];

  const av = calculateStrategy(debts, 'avalanche', 500);
  const sn = calculateStrategy(debts, 'snowball', 500);

  // Without rollover, Debt 2 would take 20000/(1000+500) = ~14 months after Debt 1 finishes.
  // With rollover, Debt 2 gets 1000 + 2000 + 500 = 3500/mo, finishing in ~7-8 months!
  assert(av.months < 10, `Rollover failed: Avalanche took too many months (${av.months})`);
  assert(sn.months < 10, `Rollover failed: Snowball took too many months (${sn.months})`);
  console.log(`✔ PASS: Minimum payment rollover verified: Debt paid off in ${av.months} months (avalanche) and ${sn.months} months (snowball).`);
}

// -------------------------------------------------------------
// 2. Scenario Suite: Diverse Portfolio Configurations
// -------------------------------------------------------------
console.log('\n--- 2. Testing Diverse Scenarios ---');

const scenarios = [
  {
    name: 'Single Debt',
    extra: 1000,
    debts: [
      { name: 'Personal Loan', balance: 50000, rate: 15, minPayment: 2500 }
    ],
    assertMatch: true // Avalanche and Snowball must produce exact same result for single debt
  },
  {
    name: '2 Debts: Conflict Case (Small Low-Rate vs Large High-Rate)',
    extra: 2000,
    debts: [
      { name: 'Credit Card (High Rate)', balance: 80000, rate: 36, minPayment: 3000 },
      { name: 'Bike Loan (Low Rate)', balance: 20000, rate: 10, minPayment: 1500 }
    ],
    assertStrictlyBetter: true // Avalanche MUST beat Snowball on interest
  },
  {
    name: '2 Debts: Equal Interest Rates (18% APR each)',
    extra: 1500,
    debts: [
      { name: 'Card A', balance: 40000, rate: 18, minPayment: 2000 },
      { name: 'Card B', balance: 60000, rate: 18, minPayment: 3000 }
    ]
  },
  {
    name: '5 Diverse Debts (Credit card, Personal loan, Car EMI, Education, Gadget)',
    extra: 5000,
    debts: [
      { name: 'Credit Card', balance: 45000, rate: 42, minPayment: 2500 },
      { name: 'Personal Loan', balance: 120000, rate: 16, minPayment: 4000 },
      { name: 'Car Loan', balance: 350000, rate: 9.5, minPayment: 8500 },
      { name: 'Education Loan', balance: 200000, rate: 8.5, minPayment: 3000 },
      { name: 'Gadget EMI', balance: 15000, rate: 24, minPayment: 1500 }
    ],
    assertStrictlyBetter: true
  },
  {
    name: 'High Extra Payment (₹25,000 extra)',
    extra: 25000,
    debts: [
      { name: 'Card', balance: 50000, rate: 36, minPayment: 2500 },
      { name: 'Loan', balance: 100000, rate: 14, minPayment: 3000 }
    ]
  },
  {
    name: 'Low Extra Payment (₹100 extra)',
    extra: 100,
    debts: [
      { name: 'Card', balance: 30000, rate: 30, minPayment: 1500 },
      { name: 'Loan', balance: 50000, rate: 12, minPayment: 2000 }
    ]
  },
  {
    name: 'Zero Extra Payment (₹0 extra, pure minimums + rollover)',
    extra: 0,
    debts: [
      { name: 'Card', balance: 30000, rate: 30, minPayment: 1500 },
      { name: 'Loan', balance: 50000, rate: 12, minPayment: 2000 }
    ]
  },
  {
    name: '0% APR EMI mixed with High APR Card',
    extra: 2000,
    debts: [
      { name: 'Zero Interest EMI', balance: 30000, rate: 0, minPayment: 3000 },
      { name: 'High APR Card', balance: 40000, rate: 36, minPayment: 2000 }
    ],
    assertStrictlyBetter: true
  },
  {
    name: 'Immediate Partial Rollover (Balance < Min Payment)',
    extra: 1000,
    debts: [
      { name: 'Tiny Residue Debt', balance: 500, rate: 12, minPayment: 2000 },
      { name: 'Major Loan', balance: 60000, rate: 20, minPayment: 2500 }
    ]
  }
];

scenarios.forEach((sc, idx) => {
  const av = calculateStrategy(sc.debts, 'avalanche', sc.extra);
  const sn = calculateStrategy(sc.debts, 'snowball', sc.extra);

  assert(
    av.totalInterest <= sn.totalInterest,
    `VIOLATION OF AMORTIZATION THEOREM in [${sc.name}]! Avalanche interest (${av.totalInterest}) > Snowball interest (${sn.totalInterest})`
  );

  if (sc.assertMatch) {
    assert.strictEqual(
      av.totalInterest,
      sn.totalInterest,
      `Single debt must yield identical interest: av=${av.totalInterest}, sn=${sn.totalInterest}`
    );
    assert.strictEqual(
      av.months,
      sn.months,
      `Single debt must yield identical months: av=${av.months}, sn=${sn.months}`
    );
  }

  if (sc.assertStrictlyBetter) {
    assert(
      av.totalInterest < sn.totalInterest,
      `Expected Avalanche to save strictly more interest than Snowball in [${sc.name}]: av=${av.totalInterest}, sn=${sn.totalInterest}`
    );
  }

  console.log(`✔ PASS: [${sc.name}] -> Avalanche: ${av.months} mos, ₹${av.totalInterest} int | Snowball: ${sn.months} mos, ₹${sn.totalInterest} int | Diff: ₹${sn.totalInterest - av.totalInterest}`);
});

// -------------------------------------------------------------
// 3. Fuzzing Generator: 100 Random Portfolios
// -------------------------------------------------------------
console.log('\n--- 3. Running 100-Scenario Randomized Fuzzing ---');
let fuzzSuccessCount = 0;

for (let seed = 1; seed <= 100; seed++) {
  // Deterministic pseudo-random based on seed
  function rnd(min, max) {
    const x = Math.sin(seed * 997 + min * 37 + max * 13) * 10000;
    return min + Math.floor((x - Math.floor(x)) * (max - min + 1));
  }

  const numDebts = rnd(2, 6);
  const extra = rnd(0, 10) * 500; // 0 to 5,000
  const randomDebts = [];

  for (let d = 0; d < numDebts; d++) {
    const balance = rnd(10, 150) * 1000; // 10,000 to 150,000
    const rate = rnd(8, 42); // 8% to 42% APR
    // Ensure min payment covers at least monthly interest + small principal
    const monthlyInt = (balance * (rate / 100)) / 12;
    const minPayment = Math.max(Math.round(monthlyInt + rnd(500, 2000)), 1000);

    randomDebts.push({
      name: `Debt_${d + 1}`,
      balance,
      rate,
      minPayment
    });
  }

  const av = calculateStrategy(randomDebts, 'avalanche', extra);
  const sn = calculateStrategy(randomDebts, 'snowball', extra);

  assert(
    av.totalInterest <= sn.totalInterest,
    `FUZZ TEST FAILED at seed ${seed}: Avalanche interest (${av.totalInterest}) exceeded Snowball interest (${sn.totalInterest})`
  );
  fuzzSuccessCount++;
}

console.log(`✔ PASS: 100/100 randomized debt portfolios verified. In 100% of cases, I_avalanche <= I_snowball.`);

console.log('\n=== TEST 5 COMPLETE: ALL DEBT PAYOFF ASSERTIONS PASSED ===\n');
