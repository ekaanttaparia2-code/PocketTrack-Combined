/**
 * Unified Test Runner for Challenger Tier 1 Verification Suite
 * Executes all 6 challenge test harnesses and outputs aggregate report.
 */

const { execSync } = require('child_process');
const path = require('path');

const testScripts = [
  'test_review_001_firestore_rules.js',
  'test_review_003_004_005_xss.js',
  'test_review_019_auth_deadlock.js',
  'test_review_020_recurring_intervals.js',
  'test_review_033_debt_payoff.js',
  'test_review_034_fire_runway.js'
];

console.log('====================================================');
console.log('POCKETTRACK TIER 1 FIXES — EMPIRICAL CHALLENGE SUITE');
console.log('====================================================\n');

let allPassed = true;
const results = [];

testScripts.forEach((script, idx) => {
  const fullPath = path.resolve(__dirname, script);
  process.stdout.write(`[${idx + 1}/${testScripts.length}] Running ${script}... `);
  try {
    const output = execSync(`node "${fullPath}"`, { encoding: 'utf8' });
    results.push({ script, status: 'PASS', output });
    console.log('PASSED');
  } catch (err) {
    allPassed = false;
    results.push({ script, status: 'FAIL', error: err.stdout || err.message });
    console.log('FAILED');
  }
});

console.log('\n----------------------------------------------------');
console.log('EXECUTION SUMMARY:');
results.forEach(r => {
  console.log(`- ${r.script}: ${r.status}`);
});
console.log('----------------------------------------------------');

if (!allPassed) {
  console.error('\n❌ ONE OR MORE TESTS FAILED');
  process.exit(1);
} else {
  console.log('\n✔ ALL 6 TEST HARNESSES EXECUTED SUCCESSFULLY');
}
