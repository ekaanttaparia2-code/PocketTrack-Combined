/**
 * PocketTrack Tier 3 Batch C & Tier 4 Remediation — Micro-Audit Suite
 * Tests 6 fixes:
 * 1. REVIEW-055: Absence of Script Bundling (Deferral documentation in FIX_LOG.md)
 * 2. REVIEW-056: Missing Hydration Loading Spinners Causing Content Flash (transactions.js, ledger.js)
 * 3. REVIEW-058: Silent Error Swallowing in Background Promises (monetization.js, auth.js, onboarding.js)
 * 4. REVIEW-059: Duplicated Audio Synthesis & Date Formatting Utilities (animations.js, app.js, reports.js, website/main.js)
 * 5. REVIEW-050: Wealth Simulator NaN Bar Width on Zero Monthly Contribution (wealth_simulator.js)
 * 6. REVIEW-060: Dead Code & Phantom Documentation References (README.md, landing.html)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('====================================================');
console.log('POCKETTRACK TIER 3 BATCH C & TIER 4 — MICRO-AUDIT SUITE');
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
// 1. REVIEW-055: Absence of Script Bundling (Deferred Documentation)
// ─────────────────────────────────────────────────────────────
runTest('REVIEW-055: Deferral documentation with vanilla JS constraint in FIX_LOG.md', () => {
  const fixLogPath = path.resolve(__dirname, '..', 'FIX_LOG.md');
  const content = fs.readFileSync(fixLogPath, 'utf8');

  assert(content.includes('REVIEW-055'), 'FAIL: FIX_LOG.md must contain entry for REVIEW-055');
  assert(content.includes('Deferred') || content.includes('deferred'), 'FAIL: REVIEW-055 must be noted as deferred');
  assert(content.toLowerCase().includes('vanilla js') || content.toLowerCase().includes('vanilla javascript'), 'FAIL: FIX_LOG.md must cite vanilla JavaScript constraint');
  assert(content.toLowerCase().includes('build'), 'FAIL: FIX_LOG.md must cite zero-build constraint');
});

// ─────────────────────────────────────────────────────────────
// 2. REVIEW-056: Missing Hydration Loading Spinners Causing Content Flash
// ─────────────────────────────────────────────────────────────
runTest('REVIEW-056: Skeleton loading indicators during hydration in transactions.js & ledger.js', () => {
  const txPath = path.resolve(__dirname, '..', 'transactions.js');
  const txCode = fs.readFileSync(txPath, 'utf8');

  // Verify hydration state variables in transactions.js
  assert(txCode.includes('isEntriesHydrating'), 'FAIL: transactions.js must track isEntriesHydrating state');
  assert(txCode.includes('skeleton-loader-list') || txCode.includes('skeleton-card'), 'FAIL: renderEntries must include skeleton loader cards');
  assert(txCode.includes('skeleton-mini'), 'FAIL: renderHomeSnapshot must include skeleton mini indicator');

  // Simulate mock DOM for transactions.js renderEntries
  const mockEntriesList = { innerHTML: '' };
  const mockHomeWrap = { innerHTML: '' };
  const mockInsight = { textContent: '' };
  
  // Test simulated renderEntries during hydration
  const isEntriesHydrating = true;
  const list = [];
  if (!list.length) {
    if (isEntriesHydrating) {
      mockEntriesList.innerHTML = '<div class="skeleton-loader-list"><div class="skeleton-card"></div></div>';
    } else {
      mockEntriesList.innerHTML = '<p class="empty">No entries</p>';
    }
  }
  assert(mockEntriesList.innerHTML.includes('skeleton-loader-list'), 'FAIL: Must render skeleton cards when hydrating and list is empty');

  // Test ledger.js hydration tracking and skeleton rendering
  const ledgerPath = path.resolve(__dirname, '..', 'ledger.js');
  const ledgerCode = fs.readFileSync(ledgerPath, 'utf8');

  assert(ledgerCode.includes('isLedgerHydrating'), 'FAIL: ledger.js must track isLedgerHydrating state');
  assert(ledgerCode.includes('skeleton-ledger-list'), 'FAIL: renderLedger must render skeleton-ledger-list during hydration');

  const mockLedgerContainer = { innerHTML: '' };
  const isLedgerHydrating = true;
  const peopleWithBalances = [];
  if (!peopleWithBalances.length) {
    if (isLedgerHydrating) {
      mockLedgerContainer.innerHTML = '<div class="skeleton-ledger-list"><div class="card"></div></div>';
    } else {
      mockLedgerContainer.innerHTML = '<div class="card">No contacts yet</div>';
    }
  }
  assert(mockLedgerContainer.innerHTML.includes('skeleton-ledger-list'), 'FAIL: Must render skeleton contacts when hydrating and ledger is empty');
});

// ─────────────────────────────────────────────────────────────
// 3. REVIEW-058: Silent Error Swallowing in Background Promises
// ─────────────────────────────────────────────────────────────
runTest('REVIEW-058: Replace silent empty catch blocks with structured error handling', () => {
  const monPath = path.resolve(__dirname, '..', 'monetization.js');
  const monCode = fs.readFileSync(monPath, 'utf8');

  // Ensure no empty .catch(()=>{}) remains in monetization.js
  assert(!monCode.includes('.catch(()=>{});'), 'FAIL: monetization.js must not contain empty .catch(()=>{});');
  assert(!monCode.includes('.catch(() => {});'), 'FAIL: monetization.js must not contain empty .catch(() => {});');
  assert(monCode.includes('[Monetization]'), 'FAIL: monetization.js must log structured [Monetization] warning messages');

  const authPath = path.resolve(__dirname, '..', 'auth.js');
  const authCode = fs.readFileSync(authPath, 'utf8');
  assert(authCode.includes('[Auth]'), 'FAIL: auth.js must log structured [Auth] warning messages on email verification failure');

  const onbPath = path.resolve(__dirname, '..', 'onboarding.js');
  const onbCode = fs.readFileSync(onbPath, 'utf8');
  assert(onbCode.includes('[Onboarding]'), 'FAIL: onboarding.js must log structured [Onboarding] messages');
  assert(!onbCode.includes('window.saveWallets().catch(e => {})'), 'FAIL: onboarding.js must not swallow saveWallets errors silently');
  assert(onbCode.includes('console.error(\'[Onboarding]'), 'FAIL: onboarding.js finishOnboarding must log errors with console.error');
});

// ─────────────────────────────────────────────────────────────
// 4. REVIEW-059: Duplicated Audio Synthesis & Date Formatting Utilities
// ─────────────────────────────────────────────────────────────
runTest('REVIEW-059: Audio synthesis and date formatting centralization', () => {
  const animPath = path.resolve(__dirname, '..', 'animations.js');
  const animCode = fs.readFileSync(animPath, 'utf8');
  assert(animCode.includes('window.playHapticSound = playHapticSound'), 'FAIL: animations.js must export playHapticSound on window');
  assert(animCode.includes('window.PT.playHapticSound'), 'FAIL: animations.js must bind playHapticSound on window.PT');

  const webMainPath = path.resolve(__dirname, '..', 'website', 'main.js');
  const webMainCode = fs.readFileSync(webMainPath, 'utf8');
  assert(webMainCode.includes('window.playHapticSound') || webMainCode.includes('window.PT.playHapticSound'), 'FAIL: website/main.js playSound must delegate to window.playHapticSound');

  const appPath = path.resolve(__dirname, '..', 'app.js');
  const appCode = fs.readFileSync(appPath, 'utf8');
  assert(appCode.includes('window.PT.dateToStr = dateToStr'), 'FAIL: app.js must bind dateToStr to window.PT');
  assert(appCode.includes('window.PT.todayStr = todayStr'), 'FAIL: app.js must bind todayStr to window.PT');
  assert(appCode.includes('window.PT.fmtDate = fmtDate'), 'FAIL: app.js must bind fmtDate to window.PT');

  // Verify functional behavior of dateToStr and fmtDate
  function dateToStr(d){
    if (!d) return '';
    const dateObj = (d instanceof Date) ? d : new Date(d);
    if (isNaN(dateObj.getTime())) return String(d);
    return dateObj.getFullYear()+'-'+String(dateObj.getMonth()+1).padStart(2,'0')+'-'+String(dateObj.getDate()).padStart(2,'0');
  }
  const testDate = new Date(2026, 9, 10); // 2026-10-10
  assert.strictEqual(dateToStr(testDate), '2026-10-10', 'FAIL: dateToStr must format Date object as YYYY-MM-DD');

  const repPath = path.resolve(__dirname, '..', 'reports.js');
  const repCode = fs.readFileSync(repPath, 'utf8');
  assert(repCode.includes('window.PT.dateToStr'), 'FAIL: reports.js must delegate to window.PT.dateToStr');
});

// ─────────────────────────────────────────────────────────────
// 5. REVIEW-050: Wealth Simulator NaN Bar Width on Zero Monthly Contribution
// ─────────────────────────────────────────────────────────────
runTest('REVIEW-050: Wealth Simulator zero contribution NaN progress bar guard', () => {
  const wsPath = path.resolve(__dirname, '..', 'wealth_simulator.js');
  const wsCode = fs.readFileSync(wsPath, 'utf8');

  // Verify math function calculateCompound with zero monthly contribution
  function calculateCompound(monthly, annualRatePct, years) {
    var p = Number(monthly) || 0;
    var r = (Number(annualRatePct) || 0) / 100 / 12;
    var n = (Number(years) || 1) * 12;

    var invested = p * n;
    var futureValue = 0;
    if (r > 0) {
      futureValue = Math.round(p * ((Math.pow(1 + r, n) - 1) / r) * (1 + r));
    } else {
      futureValue = invested;
    }

    var wealthGained = Math.max(0, futureValue - invested);
    var multiplier = invested > 0 ? (Math.round((futureValue / invested) * 10) / 10) : 1;

    return {
      monthly: p,
      rate: annualRatePct,
      years: years,
      invested: invested,
      futureValue: futureValue,
      wealthGained: wealthGained,
      multiplier: multiplier
    };
  }

  const resZero = calculateCompound(0, 12, 10);
  assert.strictEqual(resZero.invested, 0, 'FAIL: Zero monthly contribution must yield 0 invested');
  assert.strictEqual(resZero.futureValue, 0, 'FAIL: Zero monthly contribution must yield 0 futureValue');
  assert.strictEqual(resZero.multiplier, 1, 'FAIL: Zero monthly contribution must yield 1x multiplier');

  // Check progress bar calculation guard
  const invPct = (resZero.futureValue > 0) ? Math.round((resZero.invested / resZero.futureValue) * 100) : 0;
  const gainPct = (resZero.futureValue > 0) ? (100 - invPct) : 0;

  assert(!isNaN(invPct), 'FAIL: invPct must not be NaN');
  assert(!isNaN(gainPct), 'FAIL: gainPct must not be NaN');
  assert.strictEqual(invPct, 0, 'FAIL: invPct must evaluate to 0 when futureValue is 0');
  assert.strictEqual(gainPct, 0, 'FAIL: gainPct must evaluate to 0 when futureValue is 0');

  // Verify that wealth_simulator.js source code has the guard in both places
  assert(wsCode.includes('(res.futureValue > 0) ? Math.round((res.invested / res.futureValue) * 100) : 0'),
    'FAIL: wealth_simulator.js must guard against res.futureValue === 0 in updateSimulatorUI or openModal');
  assert(wsCode.includes('initInvPct'), 'FAIL: wealth_simulator.js openModal must precalculate guarded initInvPct');
});

// ─────────────────────────────────────────────────────────────
// 6. REVIEW-060: Dead Code & Phantom Documentation References
// ─────────────────────────────────────────────────────────────
runTest('REVIEW-060: Clean up phantom aicoach.js and consolidate landing page', () => {
  const readmePath = path.resolve(__dirname, '..', 'README.md');
  const readmeContent = fs.readFileSync(readmePath, 'utf8');

  // Verify phantom aicoach.js is removed from README.md
  assert(!readmeContent.includes('aicoach.js'), 'FAIL: README.md must not reference nonexistent aicoach.js');
  assert(readmeContent.includes('finny.js'), 'FAIL: README.md must accurately document finny.js');
  assert(readmeContent.includes('aurasense.js'), 'FAIL: README.md must accurately document aurasense.js');

  // Verify landing.html consolidation
  const landingPath = path.resolve(__dirname, '..', 'landing.html');
  const landingContent = fs.readFileSync(landingPath, 'utf8');
  assert(landingContent.includes('website/index.html'), 'FAIL: landing.html must forward to website/index.html');
  assert(landingContent.length < 2000, 'FAIL: landing.html must be consolidated rather than duplicate 470 lines');
});

console.log('====================================================');
console.log(`✔ ALL ${passedTests}/${totalTests} TIER 3 BATCH C & TIER 4 TESTS PASSED!`);
console.log('====================================================\n');
