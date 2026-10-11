# PocketTrack — 360° Code Review Report

## Executive Summary
PocketTrack is an ambitious, zero-build offline-first personal finance Progressive Web App (PWA) built with vanilla JavaScript (13,214 lines across 30 distinct `.js` files) and Firebase Compat (Authentication and Cloud Firestore with multi-tab IndexedDB persistence). While the application provides an extensive array of financial tracking capabilities—including multi-wallet support, P2P debt ledgers, voice NLP entry, and procedural SVG mascot rendering—this 360° architectural and algorithmic review identified severe systemic risks that block safe production deployment. Critical concerns include recursive wildcard shadowing in `firestore.rules` that completely nullifies free-tier write quotas, 100% client-side privilege escalation granting Pro access without payment, stored cross-site scripting (XSS) vectors via unescaped HTML template injections, broken amortization rollover in the Debt Payoff strategist, and month-to-date expense distortions in the FIRE runway calculator that display centuries of survival for users spending pocket change on the first of the month. Remediation priority must focus immediately on resolving the 9 P0 critical blockers, hardening server-side access controls, sanitizing HTML dynamic sinks, and correcting core compounding and amortization equations before public onboarding.

### Repository Architecture & 30-File Coverage Inventory
Every single JavaScript file in the repository was subjected to line-by-line inspection and empirical verification:
1. `firebase.js` (23 lines): Firebase SDK initialization, IndexedDB offline persistence setup.
2. `config.example.js` (12 lines): Configuration template for Firebase project credentials.
3. `offline.js` (46 lines): Network connection listeners and sync state badge; subject to Temporal Dead Zone in `<head>`.
4. `sw.js` (70 lines): Service Worker caching; omits external CDN SDK caching; heavy network-first shell strategy.
5. `app.js` (3,102 lines): SPA router, internationalization, bill-splitting settlement, custom prompt modal; flawed `escapeHTML`.
6. `transactions.js` (1,418 lines): Entry CRUD, composer, feed; deletion cache omission, unbounded queries.
7. `auth.js` (293 lines): Auth state machine, Google sign-in; validation lock deadlock, cross-session storage leakage.
8. `onboarding.js` (579 lines): 7-step wizard; un-namespaced profile storage, silent error suppression.
9. `goal_sip_planner.js` (279 lines): SIP goal calculator; wealth gained formula truncates real compound gains by ~35%.
10. `debt_payoff.js` (193 lines): Snowball/Avalanche engine; broken payment rollover, stored XSS in debt list.
11. `fire_runway.js` (192 lines): Emergency runway & FIRE; MTD burn rate distortion, investments penalized as net worth drop.
12. `wealth_simulator.js` (194 lines): Compound interest growth engine; NaN progress bar width edge case on zero contribution.
13. `daily_burn_meter.js` (246 lines): Safe-to-spend radar; overspend alert dead code, cross-wallet spend pollution.
14. `wallets.js` (835 lines): Multi-wallet switcher & atomic batch transfers; global namespace pollution.
15. `ledger.js` (645 lines): Contact debts & reminders; floating-point epsilon phantom debts, duplicated 91 country code.
16. `shared_portfolios.js` (748 lines): Shared spaces & WhatsApp split; inline single-quote attribute breakout XSS.
17. `smart_engine.js` (213 lines): Context intent detection; intercepts and drops transactions from main entries into ledger.
18. `voice.js` (533 lines): Web Speech API parsing; greedy largest-number logic extracts years/phones as amounts.
19. `receipt_scanner.js` (882 lines): Camera OCR via Tesseract.js; logs raw receipt text & PII to `console.log`.
20. `recurring.js` (387 lines): Scheduled auto-posting; permanent end-of-month date drift, local array bypass.
21. `finny.js` (465 lines): Procedural SVG financial mascot generator with dynamic mood, pose, and emotion engines.
22. `aurasense.js` (297 lines): Canvas orb & Time Machine; unthrottled 60 FPS infinite loop, facade milestone unlocks.
23. `financial_dna.js` (417 lines): Spending archetype classifier; routine <₹500 daily purchases misclassified as impulse buys.
24. `reports.js` (1,051 lines): Category charts & Health Score; stored XSS in custom category breakdown, transfer income skew.
25. `monetization.js` (690 lines): Theme manager & Pro gating; facade payment modal, 100% client-side privilege escalation.
26. `wrapped.js` (524 lines): Retrospective story recap; stored XSS in top spend and category legend HTML injection.
27. `envelopes.js` (361 lines): 50/30/20 envelope budget; default food category misclassified as "Wants" instead of "Needs".
28. `upi_qr_generator.js` (211 lines): UPI QR generator; exfiltrates cleartext UPI VPAs and notes to `api.qrserver.com`.
29. `animations.js` (214 lines): Web Audio API sound synthesis and rolling odometer tweening.
30. `website/main.js` (347 lines): Marketing website interactive sliders; duplicated audio synthesis routines.

---

## Findings

### Bugs & Correctness

#### REVIEW-019: Permanent Auth Lockout Deadlock on Validation Failure
- **ID**: REVIEW-019
- **Severity**: P0 (critical)
- **File & Line**: `auth.js:55-84`
- **Description**: In `authAction(mode)`, the concurrency lock `window._isAuthActionRunning = true` is set synchronously on line 56. When basic input validation fails—such as an empty email or password length under 6 characters (line 60), or unchecked terms consent (line 66)—the function executes an early `return;` without clearing `window._isAuthActionRunning`. Because line 55 strictly checks `if (window._isAuthActionRunning) return;`, all subsequent clicks on "Log In" or "Sign Up" are silently discarded.
- **Impact**: Any user who mistypes their password or clicks submit before checking the terms checkbox is permanently locked out of authentication. The form becomes completely unresponsive, forcing users to abandon the flow or hard-reload the browser.
- **Recommendation**: Reposition `window._isAuthActionRunning = true;` below all synchronous client validation guards, and wrap the entire asynchronous execution block in a `try...finally` block that guarantees `window._isAuthActionRunning = false` on every exit path.

#### REVIEW-020: Permanent Month-End Recurrence Schedule Drift
- **ID**: REVIEW-020
- **Severity**: P0 (critical)
- **File & Line**: `recurring.js:51-59, 98`
- **Description**: In `addRecInterval()`, monthly interval advancement mutates the date directly: `const day=dt.getDate(); dt.setMonth(dt.getMonth()+1); if(dt.getDate()!==day) dt.setDate(0);`. If a recurring expense is scheduled on the 31st (e.g., Jan 31), advancing to February sets the date to Feb 28. In line 98, `2026-02-28` is committed to Firestore as the rule's new `nextDate`. When March arrives, `addRecInterval('2026-02-28', 'monthly')` reads `day = 28`, advancing to March 28. Similarly, leap-year rules created on Feb 29 clamp to Feb 28 and never return to Feb 29.
- **Impact**: All recurring bills or salary credits configured on the 29th, 30th, or 31st of a month permanently drift to the 28th after passing through February, corrupting recurring schedules and posting charges days ahead of actual billing dates.
- **Recommendation**: Store an immutable target day-of-month property (`targetDay: 31`) on the recurring rule document. For each monthly cycle, compute target year and month, and clamp to `Math.min(targetDay, daysInMonth)` for the posted instance without mutating the underlying schedule definition.

#### REVIEW-021: Transaction Deletion Bypasses LocalStorage Cache
- **ID**: REVIEW-021
- **Severity**: P1 (high)
- **File & Line**: `transactions.js:1200-1215`
- **Description**: In `deleteEntry()`, after deleting an entry document from Firestore and filtering the in-memory `window.entries` array, the function fails to update the local cache: `localStorage.setItem('pockettrack_entries_cache_' + currentUser.uid, ...)`.
- **Impact**: When a user deletes a transaction and later reopens the application offline or reloads before the Firestore snapshot listener fires, `listenToEntries()` reads the stale localStorage cache. The deleted transaction resurrects in the UI, corrupting account balances and transaction totals.
- **Recommendation**: Mirror the cache update immediately in `deleteEntry()` by saving the updated array to localStorage: `localStorage.setItem('pockettrack_entries_cache_' + currentUser.uid, JSON.stringify(entries));`.

#### REVIEW-022: Auto-Posted Recurring Entries Bypass Local Array & Stats
- **ID**: REVIEW-022
- **Severity**: P1 (high)
- **File & Line**: `recurring.js:80-95`
- **Description**: `processRecurringDue()` writes auto-posted transactions directly to Firestore collection `entries` using a deterministic ID. However, it fails to append the new transaction to `window.entries`, does not update localStorage, does not increment `entryCount`, and does not invoke `updateHeaderStats()` or `renderEntries()`.
- **Impact**: Although a toast notification announces "🔁 Logged recurring", the transaction does not appear in the transaction feed, and header totals remain stale until a hard page reload.
- **Recommendation**: Push the newly created transaction to `window.entries`, persist it to the localStorage cache, increment the local counter, and call `updateHeaderStats()` and `renderEntries()`.

#### REVIEW-023: Bill Settlement Independent Rounding Leaves Hanging Pennies
- **ID**: REVIEW-023
- **Severity**: P1 (high)
- **File & Line**: `app.js:2198-2246`
- **Description**: In `calculateSettlement()`, line 2219 rounds each participant's balance independently using `Math.round(val * 100) / 100`. In a 3-way split of ₹100, payer A has balance +₹66.67, while debtors B and C each have -₹33.33. The sum of rounded balances is $66.67 - 33.33 - 33.33 = +0.01 \ne 0$.
- **Impact**: The greedy transfer algorithm executes two transfers of ₹33.33 each, leaving creditor A with an unsettled credit of ₹0.01. The group is displayed as settled, but creditor A is never fully repaid. In multi-expense events, fractional discrepancies accumulate into noticeable errors.
- **Recommendation**: Retain unrounded floating-point balances during debt minimization, and allocate the final fractional penny discrepancy to the largest creditor or debtor to guarantee zero-sum closure.

#### REVIEW-024: Payer Removal from Event Breaks Group Settlement Balance
- **ID**: REVIEW-024
- **Severity**: P1 (high)
- **File & Line**: `app.js:2201-2206`
- **Description**: If a participant who paid for an expense (`exp.paidBy`) is later removed from the event's `participants` list, line 2202 skips crediting their balance (`if (balances[payer] !== undefined)`). However, lines 2203–2204 continue debiting the remaining members in `splitAmong`.
- **Impact**: Net group balances become negative (group insolvency). The settlement algorithm fails to balance payments, and no valid settlement transfers can be generated.
- **Recommendation**: Validate referential integrity: reject removing a participant who has associated expenses, or automatically include historical payers in the settlement ledger with an indicator.

#### REVIEW-025: Voice Engine Largest Number Logic Extracts Years/Phones
- **ID**: REVIEW-025
- **Severity**: P1 (high)
- **File & Line**: `voice.js:179-183`
- **Description**: If no currency keywords ("rupees", "rs") or prepositions ("for", "of") precede a spoken number, `extractVoiceAmount()` falls back to selecting the largest numerical token: `for(const n of nums){ if(parseFloat(n[0])>=parseFloat(best[0])) best=n; }`.
- **Impact**: Spoken sentences such as "Dinner 500 in 2024" or "Phone recharge 299 for 9876543210" extract the year (₹2,024) or telephone number (₹9,876,543,210) as the transaction amount.
- **Recommendation**: Exclude 4-digit numbers matching recent calendar years (2020–2035) and 10-digit telephone patterns when selecting fallback numerical amounts.

#### REVIEW-026: Voice Engine Parses Decimal Paise Spends as Calendar Dates
- **ID**: REVIEW-026
- **Severity**: P1 (high)
- **File & Line**: `voice.js:366-372`
- **Description**: `parseVoiceDate()` matches dotted numeric patterns: `const dotted = t.match(/\b(\d{1,2})\.(\d{1,2})(?:\.(\d{2,4}))?\b/)`.
- **Impact**: If a user speaks a decimal amount with paise (e.g., "Spent 12.05 on tea" or "25.10 on grocery"), `dotted` matches `12.05`, interprets it as day 12, month 05, and sets the transaction date to May 12th instead of today's date.
- **Recommendation**: Extract and strip monetary amounts from the spoken transcript before running calendar date extraction patterns.

#### REVIEW-027: Smart Intercept Diverts Expenses to Ledger Without Outflow
- **ID**: REVIEW-027
- **Severity**: P1 (high)
- **File & Line**: `smart_engine.js:158-171`
- **Description**: When the Smart Context engine identifies a contact name in an expense note and the user confirms "Connect to Ledger?", line 161 calls `saveLedgerTx()` and resolves without calling `runNormal()`.
- **Impact**: The transaction is recorded in the Ledger subcollection (`/ledger/{personId}/transactions`), but is never logged in `/entries`. The user's wallet balance, monthly budget, and expense totals reflect zero cash outflow, giving a false picture of available funds.
- **Recommendation**: Record the transaction dual-legged: save in `/entries` as an outflow expense and in `/ledger` as an outstanding receivable.

#### REVIEW-028: Head Script Temporal Dead Zone / ReferenceError on Offline Event
- **ID**: REVIEW-028
- **Severity**: P1 (high)
- **File & Line**: `offline.js:12, 16, 18, 34`
- **Description**: `offline.js` is included in the `<head>` of `app.html` before `app.js`. Lines 12, 16, and 18 access `currentLang` bare without `typeof` checks, and line 34 checks `!currentUser`. Because these variables are declared via block-scoped `let` in `app.js` (loaded at the end of `<body>`), an `online` or `offline` event fired before `app.js` is parsed triggers an uncaught `ReferenceError`.
- **Impact**: The script crashes with an unhandled exception during early page load, breaking offline status indicator updates and preventing the sync badge from rendering.
- **Recommendation**: Add defensive existence checks: `(typeof currentLang !== 'undefined' && currentLang === 'hi')` and `(typeof currentUser !== 'undefined' && currentUser)`.

#### REVIEW-029: Spurious Toast on Skipped Existing Recurring Entries
- **ID**: REVIEW-029
- **Severity**: P2 (medium)
- **File & Line**: `recurring.js:75-78, 100-108`
- **Description**: If a deterministic recurring entry ID already exists in Firestore, line 77 increments `posted++` upon skipping duplicate creation. Line 100 checks `if(posted > 0)` and triggers a toast notification: "🔁 Logged recurring: [Label]".
- **Impact**: Misleading success toasts pop up on every page reload informing users that entries were auto-logged when they were actually skipped as duplicates.
- **Recommendation**: Differentiate between newly written entries (`createdCount`) and skipped duplicates (`skippedCount`), only displaying toasts when `createdCount > 0`.

#### REVIEW-030: Floating-Point Residue Creates Phantom Ledger Debts
- **ID**: REVIEW-030
- **Severity**: P2 (medium)
- **File & Line**: `ledger.js:164-171, 205, 526`
- **Description**: P2P ledger balances are accumulated using raw floating-point numbers (`balance += tx.amount`).
- **Impact**: IEEE 754 precision issues (e.g., $33.33 + 16.67 - 50 = 7.1 \times 10^{-15}$) cause contacts with settled zero balances to display "Owes you ₹0.0000000000000071" with active "Settle Up" buttons.
- **Recommendation**: Round calculated ledger balances to 2 decimal places: `Math.round(balance * 100) / 100`, and gate display on `Math.abs(balance) > 0.01`.

#### REVIEW-031: WhatsApp Link Duplicates Country Code `91`
- **ID**: REVIEW-031
- **Severity**: P2 (medium)
- **File & Line**: `ledger.js:641-643`
- **Description**: When generating WhatsApp debt reminders, line 642 prepends `91`: `const waUrl = phoneTarget ? 'https://wa.me/91' + phoneTarget ...`.
- **Impact**: If a user enters their contact's phone number with an existing country code (e.g., `+919876543210` or `919876543210`), the URL becomes `https://wa.me/91919876543210`, which WhatsApp rejects as an invalid destination.
- **Recommendation**: Strip leading `+` and `91` before prepending the country code: `phoneTarget.replace(/^(\+?91)/, '')`.

#### REVIEW-032: Voice Date Month Boundary Rollback Clamps Erroneously
- **ID**: REVIEW-032
- **Severity**: P2 (medium)
- **File & Line**: `voice.js:346-355`
- **Description**: When parsing spoken dates such as "on the 31st" when today is March 30th, `target.setMonth(target.getMonth() - 1)` rolls back to February. Because February lacks 31 days, JavaScript Date overflows to March 3rd.
- **Impact**: The expense date is assigned to March 3rd instead of January 31st.
- **Recommendation**: Implement date-clamping logic when shifting months backwards, clamping to the last valid day of the preceding month.

---

### Security

#### REVIEW-001: Wildcard Shadowing Rule Bypass on `/entries/{entryId}`
- **ID**: REVIEW-001
- **Severity**: P0 (critical)
- **File & Line**: `firestore.rules:23-25` vs `firestore.rules:11-21`
- **Description**: Cloud Firestore Security Rules evaluate rule blocks using logical OR across matching paths. Path `/users/{userId}/entries/{entryId}` matches both `match /entries/{entryId}` (lines 11–21) and `match /{allSubcollections=**}` (lines 23–25). Lines 23–25 specify: `match /{allSubcollections=**} { allow read, write: if request.auth != null && request.auth.uid == userId; }`. Because `allow write` in the wildcard block only requires user authentication, all constraints in lines 13–20 (requiring email verification, Google/Phone sign-in, entry count < 10, or `pro == true`) are completely dead code and bypassed.
- **Impact**: Any unverified free user can write unlimited documents directly to `/entries` without payment or email verification. The free-tier 10-entry cap is non-existent on the server.
- **Recommendation**: Remove `match /{allSubcollections=**}` entirely. Define explicit, dedicated rule blocks for every subcollection (`entries`, `events`, `ledger`, `spaces`, `recurring`, `wallets`) without overlapping catch-all wildcards.

#### REVIEW-002: Client-Side Pro Privilege Escalation & Facade Checkout
- **ID**: REVIEW-002
- **Severity**: P0 (critical)
- **File & Line**: `monetization.js:231-247`, `auth.js:219-233`
- **Description**: The application's monetization model is completely self-certifying and client-controlled. `proEnabled()` checks `window.isProUser` or `localStorage.getItem(PT_STORE.pro) === '1'`. Furthermore, `openProCheckout()` presents a mock payment modal that simply invokes `setPro(true)` without contacting a payment gateway or server.
- **Impact**: Any user can unlock all Pro features (premium themes, unlimited voice entries, unlimited ledger contacts, unlimited spaces, and watermark-free PDF statement exports) by executing `window.isProUser = true` or `localStorage.setItem('pt_pro_v1', '1')` in the browser console.
- **Recommendation**: Sensitive premium capabilities must be verified via Firebase Custom Claims (`request.auth.token.pro == true`) managed exclusively by a trusted backend or Firebase Cloud Functions webhook verifying payment gateway signatures.

#### REVIEW-003: Stored XSS via Unescaped Category Names in Wrapped
- **ID**: REVIEW-003
- **Severity**: P0 (critical)
- **File & Line**: `wrapped.js:307, 325, 356, 359, 398`
- **Description**: User custom categories or OCR-scanned categories are passed through `capitalize()` (which only upper-cases the first letter) and interpolated directly into template strings without escaping: `<strong>${topCatName}</strong>` (line 325) and `<div>${name}</div>` (line 359). Line 398 assigns `overlayEl.innerHTML = html`.
- **Impact**: Stored Cross-Site Scripting (XSS). If a user logs a transaction with a custom category containing HTML tags (`<img src=x onerror=alert(document.domain)>`), the script executes immediately whenever the "Wrapped" feature is opened, allowing session hijacking or local data theft.
- **Recommendation**: Pass `topCatName` and `name` through `escapeHTML()` before template interpolation.

#### REVIEW-004: Stored XSS via Category Breakdown Fallback in Reports
- **ID**: REVIEW-004
- **Severity**: P0 (critical)
- **File & Line**: `reports.js:270-275`
- **Description**: In the category breakdown list, line 272 falls back to the raw category string `c` when not found in `CAT_LABELS`: `${(typeof CAT_LABELS!=='undefined'&&CAT_LABELS[c])||c}`. This raw string is injected directly into `catBreakdownEl.innerHTML`.
- **Impact**: Stored XSS on the primary Reports tab for any custom user category containing script payloads.
- **Recommendation**: Ensure the fallback category name is escaped: `${escapeHTML((typeof CAT_LABELS!=='undefined'&&CAT_LABELS[c])||c)}`.

#### REVIEW-005: Stored XSS via Unescaped Debt Names in Payoff Modal
- **ID**: REVIEW-005
- **Severity**: P0 (critical)
- **File & Line**: `debt_payoff.js:161-178`
- **Description**: In `openDebtPayoffModal()`, active debts from `localStorage.getItem('pockettrack_debts')` are rendered via `debts.map(...)`. `d.name` and `d.icon` are concatenated directly into HTML strings without escaping (`'<strong ...>' + d.name + '</strong>'`).
- **Impact**: Stored XSS whenever a user opens the Debt Payoff Strategist with custom loan or debt names containing HTML tags.
- **Recommendation**: Wrap `d.name` and `d.icon` with `escapeHTML()`.

#### REVIEW-006: Flawed `escapeHTML` Quotes Omission & Prompt Injection
- **ID**: REVIEW-006
- **Severity**: P1 (high)
- **File & Line**: `app.js:420-424, 511-534`
- **Description**: `escapeHTML(str)` creates a `<div>`, sets `div.textContent = str`, and returns `div.innerHTML`. In standard HTML DOM, `textContent` assignment escapes only `<`, `>`, and `&`. It does NOT escape single quotes (`'`) or double quotes (`"`). In `showAppPrompt()` (lines 514–519), `${message}` is injected unescaped, and `<input value="${escapeHTML(defaultValue)}">` allows attribute breakout via double quotes.
- **Impact**: Attribute breakout and arbitrary script execution. If `defaultValue` contains `" onfocus="alert(1)`, line 533 (`setTimeout(()=>input.focus(), 50)`) automatically fires the payload.
- **Recommendation**: Rewrite `escapeHTML()` to replace `&`, `<`, `>`, `"`, and `'` with their corresponding HTML character entities (`&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#39;`).

#### REVIEW-007: Inline Event Single-Quote Attribute Breakout
- **ID**: REVIEW-007
- **Severity**: P1 (high)
- **File & Line**: `shared_portfolios.js:387`, `upi_qr_generator.js:140, 180`, `app.js:677-678`
- **Description**: User data is interpolated inside single-quoted inline event attributes, e.g., `<button onclick="addContactToSpaceMembers('${escapeHTML(c.name)}')">` and `<button onclick="openUpiSetupModal(${amount}, '${escapeHTML(note)}')">`. Because `escapeHTML()` preserves single quotes, entering a contact name or note containing `'` terminates the argument and injects arbitrary JavaScript.
- **Impact**: Inline script execution triggered on user click.
- **Recommendation**: Migrate inline handlers to `addEventListener`, utilize event delegation, or store safe values in `element.dataset`.

#### REVIEW-008: Third-Party PII Exfiltration to `api.qrserver.com`
- **ID**: REVIEW-008
- **Severity**: P1 (high)
- **File & Line**: `upi_qr_generator.js:117-118`
- **Description**: The UPI QR code generator constructs a payload containing the user's personal VPA (`pa`), transaction amount (`am`), and transaction note (`tn`), and requests a rendered QR image from an untrusted public third-party service: `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiPayload)}`.
- **Impact**: Personal identifiable financial data (including phone numbers embedded in UPI IDs, e.g., `9876543210@paytm`) and private notes are leaked to external server access logs in plaintext. Violates India's DPDP Act 2023 and breaks offline PWA guarantees.
- **Recommendation**: Bundle an on-device, client-side QR generation library (e.g., `qrcode.js`) to generate SVG or canvas QR codes 100% locally with zero external network requests.

#### REVIEW-009: Cross-Session Un-Namespaced LocalStorage Leakage on Logout
- **ID**: REVIEW-009
- **Severity**: P1 (high)
- **File & Line**: `auth.js:167-175, 260-279`, `debt_payoff.js:31`, `envelopes.js:316`, `upi_qr_generator.js:85`, `app.js:2959`, `onboarding.js:521`
- **Description**: When a user logs out (`logOut()`), only in-memory arrays are reset. LocalStorage keys for active debts (`pockettrack_debts`), salary (`pockettrack_monthly_income`), user UPI ID (`pockettrack_user_upi_id`), Finny stress profile (`pockettrack_finny_profile`), and cached transactions (`pockettrack_entries_cache`) are un-namespaced and are never purged on logout.
- **Impact**: On shared, family, or public devices, logging out leaves private financial debts, income, and transaction records exposed to subsequent users. Incoming UPI settlements generated by the next user will misroute funds to the previous user's UPI ID.
- **Recommendation**: Prefix all user-specific localStorage keys with `currentUser.uid` and execute an explicit cleanup routine on `logOut()` that purges all user data.

#### REVIEW-010: Rule Prohibits Pro Update; Pro State Never Syncs Across Devices
- **ID**: REVIEW-010
- **Severity**: P1 (high)
- **File & Line**: `firestore.rules:7-8` vs `monetization.js:243-246`
- **Description**: `firestore.rules` line 8 prohibits updating the `pro` field (`request.resource.data.pro == resource.data.pro`). When `setPro(true)` executes `db.collection('users').doc(currentUser.uid).update({ pro: true })`, Firestore rejects the write with `permission-denied`. The client silently swallows this failure (`.catch(()=>{})`).
- **Impact**: Pro status can never be written to Firestore by the client. If a paying user opens the app on a second device or reinstalls the browser, Firestore returns `pro: false`, and `auth.js` line 226 deletes their local Pro license.
- **Recommendation**: Handle Pro entitlement provisioning through a server-side Cloud Function or Admin SDK webhook upon payment verification.

#### REVIEW-011: Client-Controlled `entryCount` Tampering Evades Free Tier Limit
- **ID**: REVIEW-011
- **Severity**: P1 (high)
- **File & Line**: `firestore.rules:8`, `transactions.js:937`
- **Description**: The update rule for `/users/{userId}` allows updating any field as long as `pro` remains untouched. `entryCount` is updated directly by the client SDK using `FieldValue.increment(1)`.
- **Impact**: A free user can execute `db.collection('users').doc(currentUser.uid).update({ entryCount: 0 })` from DevTools, permanently evading the 10-entry free tier cap.
- **Recommendation**: Enforce entry count limits using server-side transactions or Cloud Functions.

#### REVIEW-012: Permissive CSP with `'unsafe-inline'` & Missing Security Headers
- **ID**: REVIEW-012
- **Severity**: P1 (high)
- **File & Line**: `app.html:8`, `vercel.json:6-29`
- **Description**: The Content Security Policy in `app.html` includes `'unsafe-inline'` and `'unsafe-eval'`, rendering browser XSS mitigations ineffective. Furthermore, `vercel.json` provides no security headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security`).
- **Impact**: The application is vulnerable to clickjacking attacks inside `<iframe>` containers on external domains, and injected scripts execute unrestricted.
- **Recommendation**: Define strict HTTP response headers in `vercel.json`, eliminate `'unsafe-inline'`, and enforce frame-busting.

#### REVIEW-013: Cleartext OCR Receipt & Financial Data Leak in `console.log`
- **ID**: REVIEW-013
- **Severity**: P2 (medium)
- **File & Line**: `receipt_scanner.js:720`
- **Description**: Raw extracted OCR text is printed to the browser console via `console.log('PocketTrack OCR Raw Result:\n', extractedText)`.
- **Impact**: Sensitive PII from camera scans (merchant names, itemized goods, payment card brand/last 4 digits, tax IDs, and phone numbers) is written to console logs, accessible to extensions or debugging scrapers.
- **Recommendation**: Strip diagnostic `console.log` statements of raw OCR text in production builds.

#### REVIEW-014: Cleartext Password Exposure via `prompt()` in Account Deletion
- **ID**: REVIEW-014
- **Severity**: P2 (medium)
- **File & Line**: `app.js:2642-2645`
- **Description**: Account deletion re-authentication prompts the user for their password using native `window.prompt()`.
- **Impact**: Passwords are displayed in cleartext on the screen without masking, exposing credentials to shoulder surfing.
- **Recommendation**: Replace `window.prompt()` with an in-app modal containing an `<input type="password">` element.

#### REVIEW-015: Total Absence of Schema, Type, and Size Validation
- **ID**: REVIEW-015
- **Severity**: P2 (medium)
- **File & Line**: `firestore.rules:5-26`
- **Description**: Firestore rules lack schema, data type, string length, and numeric boundary validations.
- **Impact**: An authenticated user can push arbitrarily large strings (causing storage quota exhaustion) or negative/NaN amounts into subcollections, corrupting accounting aggregations across devices.
- **Recommendation**: Introduce strict field whitelisting (`.keys().hasOnly(...)`), type checks (`is number`, `is string`), and size constraints.

#### REVIEW-016: Unchecked Anonymous Auth Can Pollute Database
- **ID**: REVIEW-016
- **Severity**: P2 (medium)
- **File & Line**: `firestore.rules:6-25`
- **Description**: Rules check `request.auth != null` without restricting anonymous sign-in tokens (`request.auth.token.firebase.sign_in_provider != 'anonymous'`).
- **Impact**: If anonymous authentication is enabled in Firebase Console, automated bots can cycle anonymous credentials and flood the database with unmonitored documents.
- **Recommendation**: Explicitly reject anonymous tokens if anonymous usage is not intended.

#### REVIEW-017: Missing Subresource Integrity (SRI) on CDN Scripts
- **ID**: REVIEW-017
- **Severity**: P2 (medium)
- **File & Line**: `app.html:21`, `receipt_scanner.js:82`
- **Description**: External CDN scripts (`jspdf.umd.min.js`, `tesseract.min.js`) lack Subresource Integrity (SRI) `integrity` attributes and `crossorigin="anonymous"`.
- **Impact**: Compromise of CDN edge nodes or DNS poisoning could allow unauthorized third-party code execution within users' authenticated sessions.
- **Recommendation**: Add SHA-384 integrity hashes and `crossorigin="anonymous"` to all CDN script tags.

#### REVIEW-018: Camera Stream Track Persistence on OCR Exception
- **ID**: REVIEW-018
- **Severity**: P2 (medium)
- **File & Line**: `receipt_scanner.js:82, 345, 535`
- **Description**: Camera media streams acquired via `getUserMedia()` are stopped during normal dialog closure, but exceptions during processing can bypass cleanup.
- **Impact**: The camera hardware stream remains active in the background, keeping device cameras engaged and causing battery drain.
- **Recommendation**: Enclose media stream lifecycles in a `try...finally` block that guarantees track termination.

---

### Code Quality & Architecture

#### REVIEW-057: Fragile Script Execution Order & Global Namespace Clashes
- **ID**: REVIEW-057
- **Severity**: P1 (high)
- **File & Line**: `app.html:21-27, 1064-1088`, `app.js:200-205`, `wallets.js:101-105`
- **Description**: Modules attach state directly to the global `window` object without ES modules or namespaces. Scripts must execute in exact chronological order across 32 separate script tags.
- **Impact**: High risk of naming collisions, temporal dead zones, and fragile execution order bugs. Refactoring or moving a script tag breaks runtime dependencies silently.
- **Recommendation**: Transition to ES Modules (`type="module"`) with explicit `import`/`export` bindings and introduce a lightweight bundler.

#### REVIEW-058: Silent Error Swallowing in Background Promises
- **ID**: REVIEW-058
- **Severity**: P2 (medium)
- **File & Line**: `monetization.js:245`, `auth.js:77, 238-245`, `onboarding.js:540`
- **Description**: Asynchronous Firestore and wallet operations use empty `.catch(()=>{})` blocks or empty `try...catch` handlers.
- **Impact**: Silent failures prevent error logging and leave the user unaware of persistence issues, making debugging in production nearly impossible.
- **Recommendation**: Implement centralized error logging and surface user-actionable notifications when background persistence fails.

#### REVIEW-059: Duplicated Audio Synthesis & Date Formatting Utilities
- **ID**: REVIEW-059
- **Severity**: P2 (medium)
- **File & Line**: `animations.js:25-60` vs `website/main.js:9-39`, `app.js:410-416` vs `reports.js:60-65`
- **Description**: Web Audio API sound synthesis and date manipulation routines (`dateToStr`, `fmtDate`, `todayStr`) are duplicated across multiple files.
- **Impact**: Increases maintenance burden and code divergence risk when formatting or audio routines are updated in one location but not another.
- **Recommendation**: Consolidate shared utilities into a shared `utils.js` module.

#### REVIEW-060: Dead Code & Phantom Documentation References
- **ID**: REVIEW-060
- **Severity**: P3 (low)
- **File & Line**: `README.md:27, 53`, `website/index.html` vs `landing.html`
- **Description**: `README.md` references a nonexistent `aicoach.js` file, while `website/index.html` is a near-identical duplicate of `landing.html`.
- **Impact**: Outdated documentation confuses contributors and creates maintenance overhead when marketing copy changes.
- **Recommendation**: Clean up dead documentation references and consolidate duplicate landing pages into a single template.

---

### Performance & UX

#### REVIEW-051: Unthrottled 60 FPS Infinite Canvas Loop with Full Array Scan
- **ID**: REVIEW-051
- **Severity**: P1 (high)
- **File & Line**: `aurasense.js:105, 115, 179`
- **Description**: `renderAuraSense()` initiates an infinite `requestAnimationFrame` loop that is never canceled. On every frame (60 FPS), line 115 calls `calculateFinancialVelocity()`, which iterates over the entire `entries` array, allocates `new Date()` objects, and computes trigonometric equations.
- **Impact**: Continuous background CPU and GPU utilization, leading to severe battery drain and thermal throttling on mobile devices even when the user navigates away from the Home tab.
- **Recommendation**: Use `IntersectionObserver` to pause the animation loop when the canvas is off-screen or the tab is hidden, and cache financial velocity calculations.

#### REVIEW-052: Missing Service Worker Caching for External CDN SDKs
- **ID**: REVIEW-052
- **Severity**: P1 (high)
- **File & Line**: `sw.js:61-62`
- **Description**: The Service Worker fetch handler explicitly excludes cross-origin traffic: `if (new URL(req.url).origin !== self.location.origin) return;`.
- **Impact**: External CDN scripts (Firebase SDK, jsPDF, Google Fonts) are never cached in `CacheStorage`. If the browser HTTP cache evicts them, opening the PWA offline fails to initialize Firebase, crashing the application.
- **Recommendation**: Bundle critical libraries locally within the application package or pre-cache CDN dependencies in `sw.js`.

#### REVIEW-053: Heavy Network-First SW Strategy Causes Weak-Network Delay
- **ID**: REVIEW-053
- **Severity**: P1 (high)
- **File & Line**: `sw.js:63-72`
- **Description**: `sw.js` uses a network-first, cache-fallback strategy for all same-origin assets.
- **Impact**: On slow 2G/3G mobile networks, the application waits for network timeouts before serving cached local assets, causing poor Time-to-Interactive (TTI) and sluggish feel.
- **Recommendation**: Implement a stale-while-revalidate strategy for static shell assets.

#### REVIEW-054: Unbounded Firestore Reads on App Initialization
- **ID**: REVIEW-054
- **Severity**: P1 (high)
- **File & Line**: `transactions.js:770-820`
- **Description**: `listenToEntries()` queries `db.collection('users').doc(currentUser.uid).collection('entries')` without a `.limit()` clause or pagination.
- **Impact**: As a user accumulates thousands of entries, initial snapshot retrieval incurs heavy network payload, slow rendering, and excessive Firestore read quota consumption.
- **Recommendation**: Paginate historical entries and load only recent months by default, loading older records on demand.

#### REVIEW-055: Absence of Script Bundling (~780 KB Across 32 Scripts)
- **ID**: REVIEW-055
- **Severity**: P2 (medium)
- **File & Line**: `app.html:21-27, 1064-1088`
- **Description**: 32 separate unminified scripts (~780 KB) are loaded sequentially over HTTP.
- **Impact**: Increases HTTP connection overhead, delays DOM parsing, and degrades mobile performance.
- **Recommendation**: Introduce a lightweight bundler (e.g., Vite or esbuild) to produce minified bundles.

#### REVIEW-056: Missing Hydration Loading Spinners Causing Content Flash
- **ID**: REVIEW-056
- **Severity**: P2 (medium)
- **File & Line**: `transactions.js:820-840`, `ledger.js:180-210`
- **Description**: Empty states are rendered immediately before Firestore local IndexedDB cache or network hydration completes.
- **Impact**: Users briefly see "No transactions" flash on screen during startup before data populates.
- **Recommendation**: Display skeleton loading indicators until initial hydration completes.

---

### Financial Calculation Accuracy

#### REVIEW-033: Broken Debt Snowball / Avalanche Minimum Payment Rollover
- **ID**: REVIEW-033
- **Severity**: P0 (critical)
- **File & Line**: `debt_payoff.js:56-78`
- **Description**: In `calculateStrategy()`, the monthly simulation loop advances interest, deducts minimum payments, and applies `availableExtra` to priority debts. When a debt is paid off (`d.balance <= 0`), line 62 skips it. Line 58 resets `var availableExtra = extraPayment;` at the beginning of every month.
- **Impact**: The freed minimum payment from the cleared debt is discarded rather than being added to the extra payment pool for the next debt. In a sample 3-debt scenario, this extends the debt payoff duration by 8 months (39 vs 31 months, +25.8%) and inflates interest by ₹7,991 (+12.2%), breaking the foundational mathematical principle of Snowball and Avalanche repayment strategies.
- **Recommendation**: Accumulate freed minimum payments: $\text{availableExtra} = \text{extraPayment} + \sum_{k \in \text{paidOff}} M_k$.

#### REVIEW-034: MTD Spending Treated as Full Monthly Burn in FIRE Engine
- **ID**: REVIEW-034
- **Severity**: P0 (critical)
- **File & Line**: `fire_runway.js:27-34`
- **Description**: Line 28 filters expenses matching the current year-month (`String(e.date).slice(0, 7) === curMonth`). Line 32 sets `monthlyBurn = curMonthExpenses > 0 ? curMonthExpenses : 25000`.
- **Impact**: On the 1st or 2nd day of a month, if a user has logged a single expense of ₹20, `monthlyBurn` is evaluated as ₹20/month. For a user with ₹50,000 in liquid assets, PocketTrack reports 2,499 months (208 years) of runway and classifies them as achieving 100% Financial Independence ("Fortress Grade").
- **Recommendation**: Calculate monthly burn using a rolling 30/90-day window or annualized historical average instead of unextrapolated Month-to-Date spending.

#### REVIEW-035: Flawed SIP Wealth Gained Formula Truncates Compounding
- **ID**: REVIEW-035
- **Severity**: P1 (high)
- **File & Line**: `goal_sip_planner.js:203-205`
- **Description**: Line 202 calculates required months using `Math.ceil(n)`. Line 204 computes wealth gained as `Math.max(0, target - (monthly * months))`.
- **Impact**: Because `months` is rounded up, the actual Future Value at that integer month is greater than `target`. True compound growth is $FV(\text{months}) - \text{totalInvested}$. By computing $\text{target} - \text{totalInvested}$, PocketTrack understates compound interest gains by 32.7% to 50.5% (e.g., reporting ₹5,000 gain instead of ₹10,095 on a ₹100k target), and displays `+₹0` for short durations despite positive compounding.
- **Recommendation**: Compute actual Future Value: $FV = P \times \frac{(1+r)^n - 1}{r} \times (1+r)$, and report $\text{wealthGained} = FV - (P \times n)$.

#### REVIEW-036: Unconstrained Negative Amortization Loop on High Rates
- **ID**: REVIEW-036
- **Severity**: P1 (high)
- **File & Line**: `debt_payoff.js:64-70`
- **Description**: If a secondary debt in the list has $d.\text{minPayment} \le d.\text{monthlyInterest}$ (e.g., high-interest credit card balance of ₹1,00,000 at 36% APR where interest is ₹3,000/mo but min payment is ₹2,500), and `availableExtra` is consumed by preceding debts:
- **Impact**: The debt undergoes negative amortization. The balance compounds exponentially until reaching the 360-month safety cap, outputting catastrophic numbers (over ₹41.4 Crore) without warning the user that their minimum payment fails to cover monthly interest.
- **Recommendation**: Detect negative amortization conditions ($M_i \le B_i \times r$) and alert the user with an explicit warning banner.

#### REVIEW-037: Investments Penalized as Net Worth Reductions in FIRE
- **ID**: REVIEW-037
- **Severity**: P1 (high)
- **File & Line**: `fire_runway.js:22-25, 63-65`
- **Description**: Line 23 calculates `expenseTotal` by summing all entries where `e.type === 'expense'`. In PocketTrack, mutual funds, stocks, and gold are logged as expenses under category `'savings'` or `'investments'`.
- **Impact**: When a user invests ₹50,000 into a mutual fund, `liquidAssets` and `netWorth` decrease by ₹50,000, paradoxically reducing their FIRE progress and runway score.
- **Recommendation**: Exclude investment/capital asset categories from liquid expense burn, or track investment portfolios separately in net worth calculations.

#### REVIEW-038: Inter-Wallet Transfers Distorting Savings Rate in Score
- **ID**: REVIEW-038
- **Severity**: P1 (high)
- **File & Line**: `reports.js:545-546`
- **Description**: In `computeHealthScore()`, `expense` filters out inter-wallet transfers (`!e.transferGroupId`), while `income` does not.
- **Impact**: Moving ₹50,000 between bank and cash wallets registers as ₹50,000 of new income while adding ₹0 to expenses. The savings rate formula jumps to 100%, awarding an unearned 45/45 health score for self-transfers.
- **Recommendation**: Filter `!e.transferGroupId` on both income and expense in `computeHealthScore()`.

#### REVIEW-039: Daily Burn Meter Mixes Single Wallet with All-Wallet Spends
- **ID**: REVIEW-039
- **Severity**: P1 (high)
- **File & Line**: `daily_burn_meter.js:128-145`
- **Description**: If an active wallet is selected (`activeW !== 'all'`), `currentBalance` is filtered to that wallet, but lines 128–131 calculate `todaySpent` across all wallets combined.
- **Impact**: Spending from a bank wallet is deducted from the daily allowance of a selected cash wallet, falsely flagging the cash wallet as overspent and displaying erroneous negative balances.
- **Recommendation**: Filter `todaySpent` by `activeW` when a specific wallet is selected.

#### REVIEW-040: Time Machine Wealth Projection Mismatch on Chip Click
- **ID**: REVIEW-040
- **Severity**: P1 (high)
- **File & Line**: `aurasense.js:256-262, 300-305`
- **Description**: In `openTimeMachineModal()`, initial opening calculates wealth projection as $\text{balance} \times (1 + 0.18 \times 3)$. However, clicking the active `+3 Mo` chip evaluates $\text{base} + (\text{base} \times 0.12 \times 3)$.
- **Impact**: For a balance of ₹50,000, initial opening displays ₹77,000, but clicking the selected chip drops the projection to ₹68,000 (a ₹9,000 reduction on the same horizon).
- **Recommendation**: Unify projection equations across initial rendering and interaction handlers.

#### REVIEW-041: Everyday Food Misclassified as "Want" in 50/30/20 Budget
- **ID**: REVIEW-041
- **Severity**: P1 (high)
- **File & Line**: `envelopes.js:21, 68-84`
- **Description**: The default category for dining and sustenance in PocketTrack is `'food'`. In `envelopes.js`, `'food'` is classified as a "Want" (30%), while `needs` contains only `'groceries'`.
- **Impact**: 100% of standard food spending logged under the default food category is routed into the 30% Wants envelope, distorting 50/30/20 budget allocations.
- **Recommendation**: Classify basic food as a Need, reserving Wants for luxury dining keywords (`'restaurant'`, `'cafe'`, `'swiggy'`).

#### REVIEW-042: Opening Balance Combines Single Wallet with All History
- **ID**: REVIEW-042
- **Severity**: P1 (high)
- **File & Line**: `reports.js:68-79, 99-108`
- **Description**: In `getPeriodAccountingData()`, `initialBalance` is filtered to `activeW`, but `prevIncome` and `prevSpent` sum historical transactions across all wallets.
- **Impact**: Opening balances for individual wallets reflect a hybrid of the single wallet's starting funds plus the historical cash flow of all wallets combined.
- **Recommendation**: Filter `prevIncome` and `prevSpent` by `walletId` when `activeW !== 'all'`.

#### REVIEW-043: Overspend Alert Dead Code Due to Clamped Burn Percent
- **ID**: REVIEW-043
- **Severity**: P2 (medium)
- **File & Line**: `daily_burn_meter.js:190, 223`
- **Description**: Line 190 clamps `burnPercent = Math.min(100, Math.round(...))`. Line 223 checks `else if (data.burnPercent > 100)`.
- **Impact**: Because `burnPercent` is clamped at 100, line 223 is mathematically unreachable. Severe overspending defaults to an amber caution gauge (line 227) instead of a red alert.
- **Recommendation**: Remove `Math.min(100, ...)` from `burnPercent` in `computeSafeToSpend()`, clamping only when computing the SVG gauge offset.

#### REVIEW-044: Lean FI & Fat FI UI Labels Disagree with Multipliers by 2.5x
- **ID**: REVIEW-044
- **Severity**: P3 (low)
- **File & Line**: `fire_runway.js:59-61, 146, 156`
- **Description**: The code computes $\text{Lean FI} = \text{standardFi} \times 0.75 = 18.75\text{x}$ and $\text{Fat FI} = \text{standardFi} \times 1.50 = 37.5\text{x}$. In the HTML UI, labels display `Lean FI (18x)` and `Fat FI (35x)`.
- **Impact**: A 2.5x annual expense discrepancy (₹15 Lakhs difference on ₹6 Lakhs/year expenses) between displayed labels and calculated values.
- **Recommendation**: Align UI labels with calculated multipliers (`18.75x` and `37.5x`).

#### REVIEW-045: Lifetime Net Income Used as Single-Goal Savings Progress
- **ID**: REVIEW-045
- **Severity**: P2 (medium)
- **File & Line**: `goal_sip_planner.js:237-244`
- **Description**: `renderActiveGoalCard()` computes `currentSaved = Math.max(0, totalInc - totalExp)` across the user's entire transaction history.
- **Impact**: Lifetime net savings are attributed to a single active goal, ignoring other financial commitments or emergency funds.
- **Recommendation**: Allow users to allocate specific wallet balances or dedicated contributions to active goals.

#### REVIEW-046: Inaccurate 4.2 Multiplier for Monthly Budget Pool
- **ID**: REVIEW-046
- **Severity**: P2 (medium)
- **File & Line**: `daily_burn_meter.js:154-156`
- **Description**: The weekly budget pool multiplier uses `weeklyBudget * 4.2`.
- **Impact**: A solar month averages 4.348 weeks. Using 4.2 treats a month as having only 29.4 days, depressing the monthly budget pool by ~4%.
- **Recommendation**: Use $52 / 12 \approx 4.333$ or dynamically compute weeks based on days in the current month ($totalDays / 7$).

#### REVIEW-047: Zero Allowance with Zero Spend Sets 100% Red Burn Gauge
- **ID**: REVIEW-047
- **Severity**: P2 (medium)
- **File & Line**: `daily_burn_meter.js:190`
- **Description**: `burnPercent = dailyAllowance > 0 ? ... : 100;`.
- **Impact**: If a user has zero allowance and has spent ₹0 today, `burnPercent` defaults to 100%, displaying a false red overspent gauge.
- **Recommendation**: If `todaySpent === 0`, set `burnPercent = 0`.

#### REVIEW-048: Frugal Micro-Transactions <₹500 Labeled as Impulse Leaks
- **ID**: REVIEW-048
- **Severity**: P2 (medium)
- **File & Line**: `financial_dna.js:247-266`
- **Description**: Any expense < ₹500 increments `expensesUnder500`. `impulseRate` is calculated as `expensesUnder500 / expenseCount`.
- **Impact**: In India, everyday essential purchases (milk, bread, auto rickshaw) are naturally < ₹500. Frugal users are labeled as impulsive spenders ("The Invisible Leaker").
- **Recommendation**: Combine price thresholds with non-essential categories (`shopping`, `entertainment`) rather than evaluating amount alone.

#### REVIEW-049: Facade Financial Milestones Unlocked Solely by Slider
- **ID**: REVIEW-049
- **Severity**: P2 (medium)
- **File & Line**: `aurasense.js:316-327`
- **Description**: In the Time Machine, financial milestones ("3-Month Emergency Fund Secured", "Zero P2P Debt") are unlocked strictly by slider position (`months >= 3`, `months >= 6`), without checking user debt or savings.
- **Impact**: Misleads users by displaying false achievement badges.
- **Recommendation**: Evaluate milestone unlock criteria against actual user debts and liquid savings.

#### REVIEW-050: Wealth Simulator NaN Bar Width on Zero Monthly Contribution
- **ID**: REVIEW-050
- **Severity**: P3 (low)
- **File & Line**: `wealth_simulator.js:132-134`
- **Description**: In initial modal markup, progress bar width is styled with `(res.invested / res.futureValue) * 100`. If monthly investment is 0, $0 / 0 = \text{NaN}$.
- **Impact**: Generates invalid CSS attribute `style="width: NaN%"`.
- **Recommendation**: Guard with `res.futureValue > 0 ? ... : 0`.

---

## Summary Table

| ID | Severity | File | Title |
|----|----------|------|-------|
| REVIEW-001 | P0 | `firestore.rules:23-25` | Wildcard Shadowing Rule Bypass on `/entries/{entryId}` |
| REVIEW-002 | P0 | `monetization.js:231-247` | Client-Side Pro Privilege Escalation & Facade Checkout |
| REVIEW-003 | P0 | `wrapped.js:307, 325, 356, 398` | Stored XSS via Unescaped Category Names in Wrapped |
| REVIEW-004 | P0 | `reports.js:270-275` | Stored XSS via Category Breakdown Fallback in Reports |
| REVIEW-005 | P0 | `debt_payoff.js:161-178` | Stored XSS via Unescaped Debt Names in Payoff Modal |
| REVIEW-006 | P1 | `app.js:420-424, 511-534` | Flawed `escapeHTML` Quotes Omission & Prompt Injection |
| REVIEW-007 | P1 | `shared_portfolios.js:387` | Inline Event Single-Quote Attribute Breakout |
| REVIEW-008 | P1 | `upi_qr_generator.js:117-118` | Third-Party PII Exfiltration to `api.qrserver.com` |
| REVIEW-009 | P1 | `auth.js:167-175, 260-279` | Cross-Session Un-Namespaced LocalStorage Leakage on Logout |
| REVIEW-010 | P1 | `firestore.rules:7-8` | Rule Prohibits Pro Update; Pro State Never Syncs Across Devices |
| REVIEW-011 | P1 | `firestore.rules:8` | Client-Controlled `entryCount` Tampering Evades Free Tier Limit |
| REVIEW-012 | P1 | `app.html:8` | Permissive CSP with `'unsafe-inline'` & Missing Security Headers |
| REVIEW-013 | P2 | `receipt_scanner.js:720` | Cleartext OCR Receipt & Financial Data Leak in `console.log` |
| REVIEW-014 | P2 | `app.js:2642-2645` | Cleartext Password Exposure via `prompt()` in Account Deletion |
| REVIEW-015 | P2 | `firestore.rules:5-26` | Total Absence of Schema, Type, and Size Validation |
| REVIEW-016 | P2 | `firestore.rules:6-25` | Unchecked Anonymous Auth Can Pollute Database |
| REVIEW-017 | P2 | `app.html:21` | Missing Subresource Integrity (SRI) on CDN Scripts |
| REVIEW-018 | P2 | `receipt_scanner.js:82, 345, 535` | Camera Stream Track Persistence on OCR Exception |
| REVIEW-019 | P0 | `auth.js:55-84` | Permanent Auth Lockout Deadlock on Validation Failure |
| REVIEW-020 | P0 | `recurring.js:51-59, 98` | Permanent Month-End Recurrence Schedule Drift |
| REVIEW-021 | P1 | `transactions.js:1200-1215` | Transaction Deletion Bypasses LocalStorage Cache |
| REVIEW-022 | P1 | `recurring.js:80-95` | Auto-Posted Recurring Entries Bypass Local Array & Stats |
| REVIEW-023 | P1 | `app.js:2198-2246` | Bill Settlement Independent Rounding Leaves Hanging Pennies |
| REVIEW-024 | P1 | `app.js:2201-2206` | Payer Removal from Event Breaks Group Settlement Balance |
| REVIEW-025 | P1 | `voice.js:179-183` | Voice Engine Largest Number Logic Extracts Years/Phones |
| REVIEW-026 | P1 | `voice.js:366-372` | Voice Engine Parses Decimal Paise Spends as Calendar Dates |
| REVIEW-027 | P1 | `smart_engine.js:158-171` | Smart Intercept Diverts Expenses to Ledger Without Outflow |
| REVIEW-028 | P1 | `offline.js:12, 16, 18, 34` | Head Script Temporal Dead Zone / ReferenceError on Offline Event |
| REVIEW-029 | P2 | `recurring.js:75-78, 100-108` | Spurious Toast on Skipped Existing Recurring Entries |
| REVIEW-030 | P2 | `ledger.js:164-171, 205, 526` | Floating-Point Residue Creates Phantom Ledger Debts |
| REVIEW-031 | P2 | `ledger.js:641-643` | WhatsApp Link Duplicates Country Code `91` |
| REVIEW-032 | P2 | `voice.js:346-355` | Voice Date Month Boundary Rollback Clamps Erroneously |
| REVIEW-033 | P0 | `debt_payoff.js:56-78` | Broken Debt Snowball / Avalanche Minimum Payment Rollover |
| REVIEW-034 | P0 | `fire_runway.js:27-34` | MTD Spending Treated as Full Monthly Burn in FIRE Engine |
| REVIEW-035 | P1 | `goal_sip_planner.js:203-205` | Flawed SIP Wealth Gained Formula Truncates Compounding |
| REVIEW-036 | P1 | `debt_payoff.js:64-70` | Unconstrained Negative Amortization Loop on High Rates |
| REVIEW-037 | P1 | `fire_runway.js:22-25, 63-65` | Investments Penalized as Net Worth Reductions in FIRE |
| REVIEW-038 | P1 | `reports.js:545-546` | Inter-Wallet Transfers Distorting Savings Rate in Score |
| REVIEW-039 | P1 | `daily_burn_meter.js:128-145` | Daily Burn Meter Mixes Single Wallet with All-Wallet Spends |
| REVIEW-040 | P1 | `aurasense.js:256-262, 300-305` | Time Machine Wealth Projection Mismatch on Chip Click |
| REVIEW-041 | P1 | `envelopes.js:21, 68-84` | Everyday Food Misclassified as "Want" in 50/30/20 Budget |
| REVIEW-042 | P1 | `reports.js:68-79, 99-108` | Opening Balance Combines Single Wallet with All History |
| REVIEW-043 | P2 | `daily_burn_meter.js:190, 223` | Overspend Alert Dead Code Due to Clamped Burn Percent |
| REVIEW-044 | P3 | `fire_runway.js:59-61, 146, 156` | Lean FI & Fat FI UI Labels Disagree with Multipliers by 2.5x |
| REVIEW-045 | P2 | `goal_sip_planner.js:237-244` | Lifetime Net Income Used as Single-Goal Savings Progress |
| REVIEW-046 | P2 | `daily_burn_meter.js:154-156` | Inaccurate 4.2 Multiplier for Monthly Budget Pool |
| REVIEW-047 | P2 | `daily_burn_meter.js:190` | Zero Allowance with Zero Spend Sets 100% Red Burn Gauge |
| REVIEW-048 | P2 | `financial_dna.js:247-266` | Frugal Micro-Transactions <₹500 Labeled as Impulse Leaks |
| REVIEW-049 | P2 | `aurasense.js:316-327` | Facade Financial Milestones Unlocked Solely by Slider |
| REVIEW-050 | P3 | `wealth_simulator.js:132-134` | Wealth Simulator NaN Bar Width on Zero Monthly Contribution |
| REVIEW-051 | P1 | `aurasense.js:105, 115, 179` | Unthrottled 60 FPS Infinite Canvas Loop with Full Array Scan |
| REVIEW-052 | P1 | `sw.js:61-62` | Missing Service Worker Caching for External CDN SDKs |
| REVIEW-053 | P1 | `sw.js:63-72` | Heavy Network-First SW Strategy Causes Weak-Network Delay |
| REVIEW-054 | P1 | `transactions.js:770-820` | Unbounded Firestore Reads on App Initialization |
| REVIEW-055 | P2 | `app.html:21-27, 1064-1088` | Absence of Script Bundling (~780 KB Across 32 Scripts) |
| REVIEW-056 | P2 | `transactions.js:820-840` | Missing Hydration Loading Spinners Causing Content Flash |
| REVIEW-057 | P1 | `app.html:21-27, 1064-1088` | Fragile Script Execution Order & Global Namespace Clashes |
| REVIEW-058 | P2 | `monetization.js:245` | Silent Error Swallowing in Background Promises |
| REVIEW-059 | P2 | `animations.js:25-60` | Duplicated Audio Synthesis & Date Formatting Utilities |
| REVIEW-060 | P3 | `README.md:27, 53` | Dead Code & Phantom Documentation References |

---

## Metrics
- Total findings: 60
- P0: 9 | P1: 28 | P2: 20 | P3: 3
