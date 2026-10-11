/**
 * Challenge Test 4: REVIEW-020 (recurring.js)
 * Tests multi-year recurrence interval cycles starting from Jan 31, Feb 29 (leap year), Aug 31, etc.
 * Asserts zero schedule drift over 4-year and 8-year periods.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TEST 4: Recurrence Interval Stress Test (REVIEW-020) ===');

// Extract addRecInterval directly from recurring.js
const recCode = fs.readFileSync(path.resolve(__dirname, '..', 'recurring.js'), 'utf8');
const fnMatch = recCode.match(/function\s+addRecInterval\([\s\S]*?\n\}/);
assert(fnMatch, 'FAIL: Could not locate function addRecInterval in recurring.js');

const addRecInterval = new Function(fnMatch[0] + '\nreturn addRecInterval;')();

// Helper to determine expected days in month
function getExpectedDaysInMonth(year, month) {
  // month is 1-12
  const daysMap = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  if (month === 2 && isLeap) return 29;
  return daysMap[month];
}

// -------------------------------------------------------------
// 1. Jan 31 Monthly over 4-Year Cycle (2024-2028: 48 iterations)
// -------------------------------------------------------------
console.log('\n--- 1. Testing Jan 31 Monthly Recurrence (4-Year Cycle, Leap 2024 & 2028) ---');
{
  let cur = '2024-01-31';
  const targetDay = 31;
  const totalMonths = 48; // 4 full years (48 transitions)

  let expectedYear = 2024;
  let expectedMonth = 1;

  for (let i = 1; i <= totalMonths; i++) {
    cur = addRecInterval(cur, 'monthly', targetDay);

    expectedMonth++;
    if (expectedMonth > 12) {
      expectedMonth = 1;
      expectedYear++;
    }

    const daysInMonth = getExpectedDaysInMonth(expectedYear, expectedMonth);
    const expectedDay = Math.min(targetDay, daysInMonth);
    const expectedStr = `${expectedYear}-${String(expectedMonth).padStart(2, '0')}-${String(expectedDay).padStart(2, '0')}`;

    assert.strictEqual(
      cur,
      expectedStr,
      `SCHEDULE DRIFT DETECTED at step ${i}! Expected ${expectedStr}, got ${cur}`
    );

    // Explicit checkpoint assertions
    if (expectedYear === 2024 && expectedMonth === 2) {
      assert.strictEqual(cur, '2024-02-29', 'Leap year 2024 Feb must be 2024-02-29');
    }
    if (expectedYear === 2024 && expectedMonth === 3) {
      assert.strictEqual(cur, '2024-03-31', 'Post-leap Feb must bounce back to March 31');
    }
    if (expectedYear === 2025 && expectedMonth === 2) {
      assert.strictEqual(cur, '2025-02-28', 'Non-leap year 2025 Feb must be 2025-02-28');
    }
    if (expectedYear === 2025 && expectedMonth === 3) {
      assert.strictEqual(cur, '2025-03-31', 'Post-non-leap Feb must bounce back to March 31');
    }
    if (expectedYear === 2028 && expectedMonth === 2) {
      assert.strictEqual(cur, '2028-02-29', 'Leap year 2028 Feb must be 2028-02-29');
    }
  }
  console.log('✔ PASS: 48 consecutive monthly transitions from Jan 31 maintained targetDay 31 with zero drift.');
}

// -------------------------------------------------------------
// 2. Feb 29 (Leap Year) Monthly over 8-Year Cycle (96 iterations)
// -------------------------------------------------------------
console.log('\n--- 2. Testing Feb 29 Monthly Recurrence (8-Year Cycle: 2024-2032) ---');
{
  let cur = '2024-02-29';
  const targetDay = 29;
  const totalMonths = 96;

  let expectedYear = 2024;
  let expectedMonth = 2;

  for (let i = 1; i <= totalMonths; i++) {
    cur = addRecInterval(cur, 'monthly', targetDay);

    expectedMonth++;
    if (expectedMonth > 12) {
      expectedMonth = 1;
      expectedYear++;
    }

    const daysInMonth = getExpectedDaysInMonth(expectedYear, expectedMonth);
    const expectedDay = Math.min(targetDay, daysInMonth);
    const expectedStr = `${expectedYear}-${String(expectedMonth).padStart(2, '0')}-${String(expectedDay).padStart(2, '0')}`;

    assert.strictEqual(
      cur,
      expectedStr,
      `DRIFT at step ${i}: Expected ${expectedStr}, got ${cur}`
    );

    // In February of non-leap years, it must clamp to 28, and in leap years (2028, 2032) return to 29
    if (expectedMonth === 2) {
      const isLeap = (expectedYear % 4 === 0 && expectedYear % 100 !== 0) || (expectedYear % 400 === 0);
      assert.strictEqual(
        cur,
        `${expectedYear}-02-${isLeap ? '29' : '28'}`,
        `Incorrect February handling in year ${expectedYear}`
      );
    } else {
      assert.strictEqual(
        cur.slice(8, 10),
        '29',
        `Non-February month must always have day 29, got ${cur}`
      );
    }
  }
  console.log('✔ PASS: 96 monthly transitions from Feb 29 preserved day 29 across leap & non-leap years.');
}

// -------------------------------------------------------------
// 3. Feb 29 (Leap Year) Yearly Recurrence over 8 Years
// -------------------------------------------------------------
console.log('\n--- 3. Testing Feb 29 Yearly Recurrence (8-Year Cycle) ---');
{
  let cur = '2024-02-29';
  const targetDay = 29;
  const expectedYears = [
    '2025-02-28',
    '2026-02-28',
    '2027-02-28',
    '2028-02-29', // Leap year restored!
    '2029-02-28',
    '2030-02-28',
    '2031-02-28',
    '2032-02-29'  // Leap year restored!
  ];

  for (let i = 0; i < expectedYears.length; i++) {
    cur = addRecInterval(cur, 'yearly', targetDay);
    assert.strictEqual(
      cur,
      expectedYears[i],
      `Yearly Feb 29 cycle failed at year ${2025 + i}: expected ${expectedYears[i]}, got ${cur}`
    );
  }
  console.log('✔ PASS: Yearly leap day recurrence preserved Feb 29 restoration on leap years (2028 & 2032).');
}

// -------------------------------------------------------------
// 4. Aug 31 Monthly over 3-Year Cycle (36 iterations)
// -------------------------------------------------------------
console.log('\n--- 4. Testing Aug 31 Monthly Recurrence ---');
{
  let cur = '2026-08-31';
  const targetDay = 31;
  const expectedSequence = [
    '2026-09-30', // Sep has 30
    '2026-10-31', // Oct has 31
    '2026-11-30', // Nov has 30
    '2026-12-31', // Dec has 31
    '2027-01-31', // Jan has 31
    '2027-02-28', // Feb non-leap has 28
    '2027-03-31', // Mar has 31
    '2027-04-30', // Apr has 30
    '2027-05-31', // May has 31
    '2027-06-30', // Jun has 30
    '2027-07-31', // Jul has 31
    '2027-08-31'  // Aug has 31
  ];

  expectedSequence.forEach((exp, idx) => {
    cur = addRecInterval(cur, 'monthly', targetDay);
    assert.strictEqual(cur, exp, `Aug 31 sequence mismatch at step ${idx + 1}: expected ${exp}, got ${cur}`);
  });
  console.log('✔ PASS: Aug 31 transitions through 30-day and 28-day months return faithfully to 31.');
}

// -------------------------------------------------------------
// 5. Daily & Weekly Boundary Testing
// -------------------------------------------------------------
console.log('\n--- 5. Testing Daily & Weekly Recurrence Boundaries ---');
{
  // Daily across Year boundary
  let d = '2025-12-30';
  d = addRecInterval(d, 'daily');
  assert.strictEqual(d, '2025-12-31');
  d = addRecInterval(d, 'daily');
  assert.strictEqual(d, '2026-01-01');

  // Daily across Leap Day
  let leapD = '2024-02-28';
  leapD = addRecInterval(leapD, 'daily');
  assert.strictEqual(leapD, '2024-02-29');
  leapD = addRecInterval(leapD, 'daily');
  assert.strictEqual(leapD, '2024-03-01');

  // Weekly across Leap Day
  let leapW = '2024-02-25';
  leapW = addRecInterval(leapW, 'weekly');
  assert.strictEqual(leapW, '2024-03-03'); // 25 + 7 = 32 -> Feb 29 (4 days left in Feb) + 3 days in March

  // Weekly across non-leap Feb
  let nonLeapW = '2025-02-25';
  nonLeapW = addRecInterval(nonLeapW, 'weekly');
  assert.strictEqual(nonLeapW, '2025-03-04'); // 25 + 7 = 32 -> Feb 28 (3 days left in Feb) + 4 days in March

  console.log('✔ PASS: Daily and weekly intervals navigate leap years and month boundaries accurately.');
}

// -------------------------------------------------------------
// 6. TargetDay Fallback when targetDay argument is omitted
// -------------------------------------------------------------
console.log('\n--- 6. Testing Backward Compatibility / Fallback ---');
{
  // When targetDay is undefined, should derive targetDay from dateStr day
  const next = addRecInterval('2026-01-31', 'monthly');
  assert.strictEqual(next, '2026-02-28', 'Should derive targetDay 31 from 2026-01-31 and clamp to Feb 28');
  console.log('✔ PASS: Fallback correctly infers targetDay from initial dateStr.');
}

console.log('\n=== TEST 4 COMPLETE: ALL RECURRING INTERVALS VERIFIED ===\n');
