/**
 * Challenge Test 3: REVIEW-019 (auth.js)
 * Tests all validation failure paths, simulates lock acquisition/release under async success/failure,
 * and asserts that deadlock is impossible.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TEST 3: Auth Lockout & Deadlock Prevention (REVIEW-019) ===');

// Setup mock browser environment
function createAuthEnvironment() {
  const elements = {};
  function getElement(id) {
    if (!elements[id]) {
      elements[id] = {
        value: '',
        checked: false,
        style: {},
        classList: { add: () => {}, remove: () => {} },
        scrollIntoView: () => {}
      };
    }
    return elements[id];
  }

  const windowMock = {
    _isAuthActionRunning: false,
    currentLang: 'en'
  };

  const documentMock = {
    getElementById: (id) => getElement(id)
  };

  let authErrorShown = null;
  let authButtonsLoading = false;
  let consentPrompted = false;

  const hideAuthError = () => { authErrorShown = null; };
  const showAuthError = (msg) => { authErrorShown = msg; };
  const promptConsentRequired = () => { consentPrompted = true; };
  const setAuthButtonsLoading = (val) => { authButtonsLoading = val; };

  let currentAuthMock = {
    signInWithEmailAndPassword: async () => ({ user: { uid: 'u1' } }),
    createUserWithEmailAndPassword: async () => ({ user: { uid: 'u2', emailVerified: false, sendEmailVerification: async () => {} } })
  };

  const authProxy = {
    signInWithEmailAndPassword: (...args) => currentAuthMock.signInWithEmailAndPassword(...args),
    createUserWithEmailAndPassword: (...args) => currentAuthMock.createUserWithEmailAndPassword(...args)
  };

  // Extract authAction from auth.js
  const authCode = fs.readFileSync(path.resolve(__dirname, '..', 'auth.js'), 'utf8');
  const fnMatch = authCode.match(/async\s+function\s+authAction\(mode\)[\s\S]*?\n\}/);
  assert(fnMatch, 'FAIL: Could not locate async function authAction in auth.js');

  const runner = new Function(
    'window', 'document', 'auth', 'hideAuthError', 'showAuthError',
    'promptConsentRequired', 'setAuthButtonsLoading',
    fnMatch[0] + '\nreturn authAction;'
  );

  const authAction = runner(
    windowMock, documentMock, authProxy, hideAuthError, showAuthError,
    promptConsentRequired, setAuthButtonsLoading
  );

  return {
    windowMock,
    documentMock,
    getElement,
    get authErrorShown() { return authErrorShown; },
    get authButtonsLoading() { return authButtonsLoading; },
    get consentPrompted() { return consentPrompted; },
    setAuthMock: (mock) => { currentAuthMock = mock; },
    authAction
  };
}

async function runTests() {
  // 1. Test validation failure paths - verify lock is NEVER left true
  console.log('\n--- 1. Testing Validation Failure Paths ---');

  const validationCases = [
    { name: 'Empty email and password', email: '', pass: '', mode: 'login' },
    { name: 'Whitespace email and empty password', email: '   ', pass: '', mode: 'login' },
    { name: 'Valid email, short password (<6 chars)', email: 'user@example.com', pass: '12345', mode: 'login' },
    { name: 'Empty email, valid password', email: '', pass: 'secret123', mode: 'login' },
    { name: 'Signup without consent checked', email: 'user@example.com', pass: 'secret123', mode: 'signup', consent: false }
  ];

  for (const tc of validationCases) {
    const env = createAuthEnvironment();
    env.getElement('auth-email').value = tc.email;
    env.getElement('auth-pass').value = tc.pass;
    if (tc.consent !== undefined) {
      env.getElement('auth-consent-check').checked = tc.consent;
    }

    assert.strictEqual(env.windowMock._isAuthActionRunning, false, 'Precondition: lock must be false');
    await env.authAction(tc.mode);
    
    assert.strictEqual(
      env.windowMock._isAuthActionRunning,
      false,
      `DEADLOCK DETECTED! Lock remained true after validation failure: [${tc.name}]`
    );
    assert.strictEqual(env.authButtonsLoading, false, 'Buttons must not remain in loading state');
    console.log(`✔ PASS: [${tc.name}] failed validation safely without locking.`);
  }

  // 2. Test successful retry after validation failure (reproducing the original bug scenario)
  console.log('\n--- 2. Testing Retry After Validation Failure ---');
  {
    const env = createAuthEnvironment();
    // Step 1: User types short password
    env.getElement('auth-email').value = 'alice@pockettrack.test';
    env.getElement('auth-pass').value = '123';
    await env.authAction('login');
    assert.strictEqual(env.windowMock._isAuthActionRunning, false);

    // Step 2: User fixes password and clicks Login again
    env.getElement('auth-pass').value = '123456';
    let calledNetwork = false;
    env.setAuthMock({
      signInWithEmailAndPassword: async (e, p) => {
        calledNetwork = true;
        assert.strictEqual(e, 'alice@pockettrack.test');
        assert.strictEqual(p, '123456');
        return { user: { uid: 'alice_1' } };
      }
    });

    const p = env.authAction('login');
    // While running, lock is active
    assert.strictEqual(env.windowMock._isAuthActionRunning, true, 'Lock should be active during network call');
    assert.strictEqual(env.authButtonsLoading, true, 'Buttons should be loading during network call');

    await p;
    assert.strictEqual(calledNetwork, true, 'Network call must have executed on retry');
    assert.strictEqual(env.windowMock._isAuthActionRunning, false, 'Lock must be released after completion');
    assert.strictEqual(env.authButtonsLoading, false, 'Buttons must be restored after completion');
    console.log('✔ PASS: User can retry and succeed after validation failure without page refresh');
  }

  // 3. Test Network Rejection / Firebase Auth Error path
  console.log('\n--- 3. Testing Network / Auth Failure Path ---');
  {
    const env = createAuthEnvironment();
    env.getElement('auth-email').value = 'bob@pockettrack.test';
    env.getElement('auth-pass').value = 'wrongpassword';
    env.setAuthMock({
      signInWithEmailAndPassword: async () => {
        throw new Error('auth/wrong-password: The password is invalid');
      }
    });

    await env.authAction('login');
    assert.strictEqual(env.windowMock._isAuthActionRunning, false, 'Lock must be released on rejection');
    assert.strictEqual(env.authButtonsLoading, false, 'Loading must be cleared on rejection');
    assert(env.authErrorShown.includes('auth/wrong-password'), 'Error message must be shown to user');
    console.log('✔ PASS: Lock safely released after Firebase Auth error rejection');
  }

  // 4. Test Concurrency Throttling (no double-submissions)
  console.log('\n--- 4. Testing Concurrency Throttling ---');
  {
    const env = createAuthEnvironment();
    env.getElement('auth-email').value = 'concurrent@pockettrack.test';
    env.getElement('auth-pass').value = 'password123';

    let networkCalls = 0;
    let resolveNetwork;
    env.setAuthMock({
      signInWithEmailAndPassword: () => {
        networkCalls++;
        return new Promise(res => { resolveNetwork = res; });
      }
    });

    // Call 1
    const p1 = env.authAction('login');
    assert.strictEqual(networkCalls, 1);
    assert.strictEqual(env.windowMock._isAuthActionRunning, true);

    // Call 2 (rapid double-click)
    const p2 = env.authAction('login');
    assert.strictEqual(networkCalls, 1, 'Second click while running must NOT trigger second network call');

    // Call 3
    const p3 = env.authAction('login');
    assert.strictEqual(networkCalls, 1, 'Third click while running must NOT trigger network call');

    // Complete the in-flight request
    resolveNetwork({ user: { uid: 'c1' } });
    await p1;
    assert.strictEqual(env.windowMock._isAuthActionRunning, false, 'Lock released after completion');
    
    // Now a subsequent click can proceed
    env.setAuthMock({
      signInWithEmailAndPassword: async () => {
        networkCalls++;
        return { user: { uid: 'c2' } };
      }
    });
    await env.authAction('login');
    assert.strictEqual(networkCalls, 2, 'New call after completion must proceed');
    console.log('✔ PASS: Concurrent rapid clicks safely discarded, lock released upon resolution');
  }

  // 5. Test Synchronous Exception in Auth SDK
  console.log('\n--- 5. Testing Synchronous Exception in Auth SDK ---');
  {
    const env = createAuthEnvironment();
    env.getElement('auth-email').value = 'sync-error@pockettrack.test';
    env.getElement('auth-pass').value = 'password123';

    env.setAuthMock({
      signInWithEmailAndPassword: () => {
        throw new Error('Unexpected synchronous exception in SDK');
      }
    });

    await env.authAction('login');
    assert.strictEqual(env.windowMock._isAuthActionRunning, false, 'Lock must be released even on sync error');
    assert.strictEqual(env.authButtonsLoading, false, 'Buttons must reset on sync error');
    assert(env.authErrorShown.includes('Unexpected synchronous exception'), 'Error caught and displayed');
    console.log('✔ PASS: try...finally guarantees lock release even on synchronous exceptions');
  }

  console.log('\n=== TEST 3 COMPLETE: NO DEADLOCK POSSIBLE ===\n');
}

runTests().catch(err => {
  console.error('TEST 3 FAILURE:', err);
  process.exit(1);
});
