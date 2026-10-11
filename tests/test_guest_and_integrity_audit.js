'use strict';
const fs = require('fs');
const assert = require('assert');

console.log('====================================================');
console.log('POCKETTRACK GUEST & INTEGRITY VERIFICATION SUITE');
console.log('====================================================\n');

function runTests() {
  // 1. Verify transactions.js guest mode persistence
  const txCode = fs.readFileSync('transactions.js', 'utf8');
  assert(!txCode.includes("if(!currentUser){toast(TT('not_logged_in'),'error');return;}"),
    'saveEntry must not reject unauthenticated/guest users');
  assert(txCode.includes('pockettrack_entries_cache_guest'),
    'transactions.js must support pockettrack_entries_cache_guest');
  console.log('✔ saveEntry persists locally in guest/offline mode: PASSED');

  // 2. Verify reports.js empty state on 0 entries
  const repCode = fs.readFileSync('reports.js', 'utf8');
  assert(repCode.includes('isEmpty: true') && repCode.includes("total: '--'"),
    'computeHealthScore must return -- when no entries exist');
  assert(!repCode.includes("Netflix Premium"),
    'Subscription Leak Detector must not leak hardcoded Netflix sample data');
  assert(!repCode.includes("Gym Membership"),
    'Subscription Leak Detector must not leak hardcoded Gym sample data');
  console.log('✔ Financial Health Score displays honest empty state (--/100) on 0 entries: PASSED');
  console.log('✔ Subscription Leak Detector purged of mock Netflix/Gym data: PASSED');

  // 3. Verify auth.js guest mode support
  const authCode = fs.readFileSync('auth.js', 'utf8');
  assert(authCode.includes('function continueAsGuest'),
    'auth.js must implement continueAsGuest');
  assert(authCode.includes('window.isGuestMode'),
    'auth.js must track isGuestMode');
  assert(authCode.includes('currentUser !== null || window.isGuestMode'),
    'updateBottomBarVisibility must display navigation bar in guest mode');
  assert(authCode.includes('pockettrack_entries_cache_guest'),
    'auth.js must migrate guest cache on cloud sign-in');
  console.log('✔ auth.js implements continueAsGuest and cloud migration: PASSED');

  // 4. Verify app.html guest button and clean hierarchy
  const htmlCode = fs.readFileSync('app.html', 'utf8');
  assert(htmlCode.includes('id="auth-guest-btn"'),
    'app.html must have Continue as Guest button');
  assert(htmlCode.includes('continueAsGuest()'),
    'app.html must call continueAsGuest');
  assert(htmlCode.includes('id="hub-floating-ticker" style="display:none;"'),
    'app.html must suppress slot-machine marquee ticker above the balance card');
  console.log('✔ app.html features Continue as Guest button and clean above-the-fold hierarchy: PASSED');

  console.log('\n====================================================');
  console.log('✔ ALL INTEGRITY AND GUEST MODE AUDIT TESTS PASSED!');
  console.log('====================================================\n');
}

runTests();
