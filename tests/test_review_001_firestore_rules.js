/**
 * Challenge Test 1: REVIEW-001 (firestore.rules)
 * Verifies elimination of recursive wildcard shadowing and explicit subcollection definitions.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TEST 1: firestore.rules (REVIEW-001) ===');

const rulesPath = path.resolve(__dirname, '..', 'firestore.rules');
const content = fs.readFileSync(rulesPath, 'utf8');

// 1. Assert no wildcard subcollection rule exists
const hasWildcardSubcollection = content.includes('{allSubcollections=**}');
assert.strictEqual(hasWildcardSubcollection, false, 'FAIL: firestore.rules must not contain {allSubcollections=**}');
console.log('✔ PASS: No {allSubcollections=**} found');

// 1b. Check that no other recursive wildcard exists inside /users/{userId}
function extractBlock(text, startPattern) {
  const match = text.match(startPattern);
  if (!match) return null;
  const startIdx = match.index + match[0].length;
  const braceStart = text.indexOf('{', startIdx);
  if (braceStart === -1) return null;
  let depth = 1;
  let i = braceStart + 1;
  while (i < text.length && depth > 0) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') depth--;
    i++;
  }
  return text.substring(braceStart + 1, i - 1);
}

const usersBlock = extractBlock(content, /match\s+\/users\/\{userId\}/);
assert(usersBlock, 'FAIL: Could not extract /users/{userId} block');
const recursiveWildcards = usersBlock.match(/\{[a-zA-Z0-9_]+=\*\*\}/g);
assert.strictEqual(recursiveWildcards, null, 'FAIL: Found recursive wildcard inside /users/{userId}: ' + JSON.stringify(recursiveWildcards));
console.log('✔ PASS: No recursive wildcards inside /users/{userId}');

// 2. Assert explicit rules exist for all required subcollections
const requiredSubcollections = [
  'entries',
  'events',
  'ledger',
  'spaces',
  'recurring',
  'wallets',
  'portfolios'
];

requiredSubcollections.forEach(sub => {
  const re = new RegExp(`match\\s+\\/${sub}\\/\\{[a-zA-Z0-9_]+\\}`);
  const match = usersBlock.match(re);
  assert(match, `FAIL: Missing explicit rule for subcollection '${sub}'`);
  console.log(`✔ PASS: Explicit rule exists for '${sub}' -> ${match[0]}`);
});

// 3. Verify nested subcollection for ledger: /ledger/{personId}/transactions/{txId}
const ledgerTxMatch = content.match(/match\s+\/transactions\/\{txId\}/);
assert(ledgerTxMatch, 'FAIL: Missing explicit rule for nested /ledger/{personId}/transactions/{txId}');
console.log('✔ PASS: Nested subcollection rule exists for ledger transactions');

// 4. Verify default deny catch-all at root
const rootDefaultDeny = content.match(/match\s+\/\{document=\*\*\}\s*\{\s*allow\s+read,\s*write:\s*if\s+false;\s*\}/);
assert(rootDefaultDeny, 'FAIL: Root default deny match /{document=**} missing or modified');
console.log('✔ PASS: Root default deny match /{document=**} is present and blocks unauthorized paths');

// 5. Verify /entries/{entryId} has guarded write rule (not shadowed)
const entriesRuleMatch = usersBlock.match(/match\s+\/entries\/\{entryId\}\s*\{([\s\S]*?)\}/);
assert(entriesRuleMatch, 'FAIL: /entries/{entryId} block missing');
const entriesBody = entriesRuleMatch[1];
assert(entriesBody.includes('entryCount'), 'FAIL: entries rule does not reference entryCount');
assert(entriesBody.includes('pro'), 'FAIL: entries rule does not reference pro');
assert(entriesBody.includes('email_verified'), 'FAIL: entries rule does not reference email_verified');
console.log('✔ PASS: /entries/{entryId} rule preserves email verification, quota, and pro checks without wildcard bypass');

console.log('=== TEST 1 COMPLETE: ALL ASSERTIONS PASSED ===\n');
