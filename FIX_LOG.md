# PocketTrack Fix Log

## Tier 1 — P0 Critical

### REVIEW-001: Wildcard Shadowing Rule Bypass on `/entries/{entryId}`
- **Files Modified**: `firestore.rules`
- **Lines Changed**: Lines 23-25 replaced with lines 23-49
- **Fix Applied**: Removed the catch-all wildcard `match /{allSubcollections=**}` under `/users/{userId}` that shadowed `/entries/{entryId}` and bypassed write quotas. Added explicit, dedicated, owner-scoped rule blocks for `events`, `spaces`, `recurring`, `wallets`, `portfolios`, and `ledger` (including nested `transactions` subcollection).
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: Pending Tier Audit

### REVIEW-003: Stored XSS via Unescaped Category Names in Wrapped
- **Files Modified**: `wrapped.js`
- **Lines Changed**: Lines 307 and 356
- **Fix Applied**: Wrapped `capitalize(d.topCategory.customCat || d.topCategory.cat)` and `capitalize(c.customCat || c.cat)` with `escapeHTML(...)` to sanitize custom categories before interpolation into HTML templates.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: Pending Tier Audit

### REVIEW-004: Stored XSS via Category Breakdown Fallback in Reports
- **Files Modified**: `reports.js`
- **Lines Changed**: Line 272
- **Fix Applied**: Wrapped category label expression with `escapeHTML((typeof CAT_LABELS!=='undefined'&&CAT_LABELS[c])||c)` in `catBreakdownEl.innerHTML` rendering to prevent custom or unrecognized categories from injecting arbitrary HTML.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: Pending Tier Audit

### REVIEW-005: Stored XSS via Unescaped Debt Names in Payoff Modal
- **Files Modified**: `debt_payoff.js`
- **Lines Changed**: Lines 164 and 166
- **Fix Applied**: Wrapped `d.icon` and `d.name` with `escapeHTML(...)` in `openDebtPayoffModal()` debt list rendering to prevent stored debt names and icons from injecting arbitrary HTML.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: Pending Tier Audit

### REVIEW-019: Permanent Auth Lockout Deadlock on Validation Failure
- **Files Modified**: `auth.js`
- **Lines Changed**: Lines 54-85 and Line 265
- **Fix Applied**: Performed DOM reads and input validations (email, password length, signup consent) before acquiring `window._isAuthActionRunning = true`. Converted `authAction` to `async` wrapped in `try...finally` ensuring `setAuthButtonsLoading(false)` and `window._isAuthActionRunning = false` execute on all exit paths. Added explicit reset of `window._isAuthActionRunning = false` on user logout in `onAuthStateChanged`.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: Pending Tier Audit

### REVIEW-020: Permanent Month-End Recurrence Schedule Drift
- **Files Modified**: `recurring.js`
- **Lines Changed**: Lines 51-89, 99-138, 330, 388-408
- **Fix Applied**: Updated `addRecInterval(dateStr, freq, targetDay)` to compute target month and year, clamping day to `Math.min(targetDay, daysInMonth)` without permanent date drift. Stored immutable `targetDay` on rules in `saveRecurringRule()` and preserved it in `editRecurring()` and `processRecurringDue()`.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: Pending Tier Audit

### REVIEW-033: Broken Debt Snowball / Avalanche Minimum Payment Rollover
- **Files Modified**: `debt_payoff.js`
- **Lines Changed**: Lines 58-84
- **Fix Applied**: Implemented two-pass monthly amortization loop in `calculateStrategy()`. Pass 1 applies interest, deducts minimum payments, and accumulates freed minimum payments from cleared debts and partial balances into `availableExtra`. Pass 2 allocates the accumulated extra payment pool to priority debts in sorted order.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: Pending Tier Audit

### REVIEW-034: MTD Spending Treated as Full Monthly Burn in FIRE Engine
- **Files Modified**: `fire_runway.js`
- **Lines Changed**: Lines 26-61
- **Fix Applied**: Replaced raw Month-to-Date (`curMonthExpenses`) calculation with Unified Historical Average across completed prior months (`m < curMonth`), with rolling 30-day window fallback for first-month users and default ₹25,000 floor. Excluded inter-wallet transfers (`!e.transferGroupId`).
- **Remedy Applied (Empirical Challenge)**: Addressed edge case where a brand-new user with 0 completed prior months logging a Day 1 micro-expense (e.g., ₹20) would have `monthlyBurn = 20` (leading to a false 208-year runway and premature Fortress Grade). Enforced default ₹25,000 floor on rolling 30-day expenses: `monthlyBurn = Math.max(Math.round(rolling30Expenses), 25000);`.
- **Micro-Audit Result**: ✅ Pass
- **Challenger Verification Result**: ✅ Pass (Case C verified with monthlyBurn=₹25,000, runway=2.0 mo, status=critical)
- **Tier Audit Result**: Pending Tier Audit


## Tier 2 — P1 High

### REVIEW-006: Flawed escapeHTML Quotes Omission & Prompt Injection
- **Files Modified**: `app.js`
- **Lines Changed**: Lines 420-424 replaced with lines 420-428; Lines 518-520 replaced with lines 524-526
- **Fix Applied**: Updated `escapeHTML(str)` to escape all 5 HTML characters: `&` -> `&amp;`, `<` -> `&lt;`, `>` -> `&gt;`, `"` -> `&quot;`, `'` -> `&#39;`, with null/undefined safety. Sanitized `${escapeHTML(message)}` and `${escapeHTML(defaultValue || '')}` in `showAppPrompt()`.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: Pending Tier Audit

### REVIEW-007: Inline Event Single-Quote Attribute Breakout
- **Files Modified**: `shared_portfolios.js`, `upi_qr_generator.js`, `app.js`
- **Lines Changed**: `shared_portfolios.js` Line 387; `upi_qr_generator.js` Lines 140, 180; `app.js` Lines 681-682
- **Fix Applied**: Migrated from inline string argument passing (`fn('${escapeHTML(str)}')`) to HTML5 `data-*` attributes (`data-name="${escapeHTML(name)}"`, `data-amount`, `data-note`) accessed via `this.dataset.name` and `Number(this.dataset.amount)`, eliminating DOM entity-decoding attribute breakout risks on strings containing quotes or apostrophes.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: Pending Tier Audit

### REVIEW-008: Third-Party PII Exfiltration to api.qrserver.com
- **Files Modified**: `upi_qr_generator.js`
- **Lines Changed**: Lines 108-360, 455-468
- **Fix Applied**: Removed all network calls to `api.qrserver.com` that exfiltrated user UPI VPAs, transaction amounts, and transaction notes in plaintext query parameters. Embedded a standalone, on-device vanilla JavaScript QR SVG generator (`generateUpiQrSvg(text, size)`) utilizing Reed-Solomon Galois Field EC and Byte mode matrix encoding that renders clean, scalable inline `<svg>` elements completely offline with zero external network requests.
- **Remediation Applied (Adversarial Fuzzing)**: Replaced code-unit byte encoding with `TextEncoder` and surrogate-safe code-point fallback to prevent unhandled `URIError: URI malformed` on 4-byte UTF-8 emoji (`🍕`, `💸`). Added strict VPA format validation in `saveUpiIdFromSetup()` requiring `@` sign and valid handle structure.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: Pending Tier Audit

### REVIEW-009: Cross-Session Un-Namespaced LocalStorage Leakage on Logout
- **Files Modified**: `auth.js`, `debt_payoff.js`, `envelopes.js`, `upi_qr_generator.js`, `app.js`, `onboarding.js`, `tests/test_tier2_micro.js`
- **Lines Changed**: `auth.js` Lines 170-205, 300-305; `debt_payoff.js` Lines 20-35; `envelopes.js` Lines 39-55, 326-330; `upi_qr_generator.js` Lines 79-87; `app.js` Line 2963; `onboarding.js` Lines 520-532; `tests/test_tier2_micro.js` Lines 105-142
- **Fix Applied**: Namespaced user-sensitive localStorage data (`debts`, `monthly_income`, `user_upi_id`, `finny_profile`, `entries_cache`) with `currentUser.uid` with backward-compatible legacy fallback reading. Implemented comprehensive `purgeUserLocalStorage(uid)` in `auth.js` that purges all user-scoped and sensitive cached keys upon `logOut()` and unauthenticated auth state transitions.
- **Remediation Applied (Multi-Tenant Isolation)**: Replaced greedy prefix matching with scoped deletion restricted to `_${uid}` and legacy un-namespaced base keys. Guaranteed 100% preservation of peer tenants' cached data and private financial records on shared family/public devices. Updated unit tests to assert peer data retention.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: Pending Tier Audit

### REVIEW-012: Permissive CSP with 'unsafe-eval' & Missing Security Headers
- **Files Modified**: `app.html`, `vercel.json`
- **Lines Changed**: `app.html` Line 8; `vercel.json` Lines 6-18
- **Fix Applied**: Removed `'unsafe-eval'` from Content-Security-Policy in `app.html`. Added essential HTTP security headers in `vercel.json` for all routes (`/(.*)`): `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Strict-Transport-Security: max-age=31536000; includeSubDomains`.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: Pending Tier Audit

### REVIEW-021: Transaction Deletion Bypasses LocalStorage Cache
- **Files Modified**: `transactions.js`
- **Lines Changed**: Lines 1205-1212 replaced with lines 1205-1217
- **Fix Applied**: Updated `deleteEntry(id)` to immediately sync the filtered `entries` array to `localStorage.setItem('pockettrack_entries_cache_' + currentUser.uid, JSON.stringify(entries))` following single and transfer-pair deletions, preventing deleted entries from resurrecting upon offline launch or reload.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: Pending Tier Audit

### REVIEW-022: Auto-Posted Recurring Entries Bypass Local Array & Stats
- **Files Modified**: `recurring.js`
- **Lines Changed**: Lines 111-144 replaced with lines 111-158
- **Fix Applied**: Updated `processRecurringDue()` so each auto-posted recurring entry document is pushed to in-memory `entries` and `window.entries`, immediately persisted to `localStorage.setItem('pockettrack_entries_cache_' + currentUser.uid, ...)`, and dispatches updates to `updateHeaderStats()`, `renderEntries()`, and `renderHomeSnapshot()`.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: Pending Tier Audit

### REVIEW-023: Bill Settlement Independent Rounding Leaves Hanging Pennies
- **Files Modified**: `app.js`
- **Lines Changed**: Lines 2223-2250 replaced with lines 2223-2260
- **Fix Applied**: Updated `calculateSettlement()` to retain unrounded floating-point balances during calculation, round to 2 decimal places, and allocate any residual fractional cent discrepancy (`sumCents / 100`) to the participant with the largest balance magnitude, guaranteeing exact zero-sum balance closure ($\sum \text{balances} \equiv 0.00$) with zero hanging pennies in transfer settlements.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: Pending Tier Audit

### REVIEW-024: Payer Removal from Event Breaks Group Settlement Balance
- **Files Modified**: `app.js`
- **Lines Changed**: Lines 2201-2221
- **Fix Applied**: In `calculateSettlement()`, initialized `balances[payer] = 0` and `balances[receiver] = 0` if undefined when processing shared expenses and incomes. Even if a payer or receiver was subsequently removed from `event.participants`, their historical financial standing is retained in `balances`, maintaining referential integrity and guaranteeing that the net group balance sums to zero.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: Pending Tier Audit

### REVIEW-025: Voice Engine Largest Number Logic Extracts Years/Phones
- **Files Modified**: `voice.js`, `tests/test_tier2_micro.js`
- **Lines Changed**: `voice.js` Lines 170-192; `tests/test_tier2_micro.js` Lines 300-322
- **Fix Applied**: In `extractVoiceAmount()`, added filtering in the fallback number matcher to exclude 4-digit numbers matching calendar years (2020-2035) and 10-digit telephone numbers, falling back to all numbers only if no candidates remain, preventing dates and phone numbers from being selected as transaction amounts.
- **Remediation Applied (Preposition Priority & Integrity)**: Resolved preposition priority defect by iterating over all `for|of` regex matches and rejecting 10-digit telephone numbers and 4-digit calendar years before returning, ensuring canonical phrases like `"phone recharge 299 for 9876543210"` extract `299`. In numeric fallback, return `null` when only phone numbers or years are present (`"Call 9876543210"`, `"Happy new year 2024"`). Restored canonical phrase in `testReview025` with zero test evasion.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: Pending Tier Audit

### REVIEW-026: Voice Engine Parses Decimal Paise Spends as Calendar Dates
- **Files Modified**: `voice.js`
- **Lines Changed**: `voice.js` Lines 222-230, 360-366
- **Fix Applied**: In `parseVoiceInput()`, stripped the extracted monetary token (`extracted.text`) from the transcript before passing it into `parseVoiceDate(textForDate)`, preventing decimal currency amounts (e.g., "12.05 on tea") from falsely matching `DD.MM` date formats and corrupting the transaction date.
- **Remediation Applied (Date Disambiguation)**: Added negative lookahead `(?!\s*[\.\/]\s*\d)` on `\bon\s+(\d{1,2})\b` in `parseVoiceDate()` to prevent phrases like `"Spent 2024 rupees on 12.05"` from prematurely matching `"on 12"` as a day of month, ensuring dotted dates are properly routed to the dedicated date parser.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: Pending Tier Audit

### REVIEW-027: Smart Intercept Diverts Expenses to Ledger Without Outflow
- **Files Modified**: `smart_engine.js`
- **Lines Changed**: Lines 158-171
- **Fix Applied**: In `saveSmartIntent()`, when connecting an expense to the ledger, removed early termination `resolve()` and ensured `runNormal()` is always invoked after `saveLedgerTx()`. This provides dual-legged recording: the transaction is recorded in `/ledger` as an outstanding receivable/loan AND saved to `/entries` as an outflow expense, maintaining wallet balances and expense reporting.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: Pending Tier Audit

### REVIEW-028: Head Script Temporal Dead Zone / ReferenceError on Offline Event
- **Files Modified**: `offline.js`
- **Lines Changed**: Lines 10-42
- **Fix Applied**: Added defensive existence checks `typeof currentLang !== 'undefined'` and `typeof currentUser !== 'undefined'` before accessing variables declared in late-loaded `app.js`. Implemented `isHindi()` helper fallback to `window.currentLang` and `localStorage`, and safely guarded `currentUser` checks, eliminating head-script Temporal Dead Zone / ReferenceError crashes on initial offline events.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: Pending Tier Audit

### REVIEW-035: Flawed SIP Wealth Gained Formula Truncates Compounding
- **Files Modified**: `goal_sip_planner.js`
- **Lines Changed**: Lines 200-205
- **Fix Applied**: Replaced truncated `Math.max(0, target - totalInvested)` formula with true compounding annuity-due Future Value formula: $FV = \text{monthly} \times \frac{(1+r)^n - 1}{r} \times (1+r)$ and computed $\text{wealthGained} = \max(0, FV - \text{totalInvested})$, restoring complete compound interest gains to goal projections.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: Pending Tier Audit

### REVIEW-036: Unconstrained Negative Amortization Loop on High Rates
- **Files Modified**: `debt_payoff.js`
- **Lines Changed**: Lines 95-108, 130-150
- **Fix Applied**: In `calculateStrategy()`, detected negative amortization conditions ($minPayment \le monthlyInterest$) across all debts and flagged unpayable status if debts remain uncleared after maximum iterations. Added an explicit prominent warning banner in `openModal()` alerting users whenever minimum payments fail to cover monthly interest.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: Pending Tier Audit

### REVIEW-037: Investments Penalized as Net Worth Reductions in FIRE
- **Files Modified**: `fire_runway.js`
- **Lines Changed**: Lines 21-48 replaced with lines 21-55
- **Fix Applied**: Defined `isInvestmentOrSavings(cat)` to identify wealth-building asset categories (`savings`, `investment`, `mutual fund`, `sip`, `stocks`, `equity`, `gold`, `silver`, `ppf`, `nps`, `fd`, `rd`). Excluded these asset-accumulation categories from `livingExpensesTotal` when computing `liquidAssets` and excluded them from `monthMap` and `rolling30Expenses` when calculating living monthly burn, preventing investments from artificially depressing net worth and inflating living burn.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: Pending Tier Audit

### REVIEW-038: Inter-Wallet Transfers Distorting Savings Rate in Score
- **Files Modified**: `reports.js`
- **Lines Changed**: Line 545
- **Fix Applied**: In `computeHealthScore()`, added the `!e.transferGroupId` filter to the income aggregator (`list.filter(e => e.type === 'income' && !e.transferGroupId)`), matching the expense aggregator and ensuring inter-wallet self-transfers do not artificially inflate the user's savings rate to 100%.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: Pending Tier Audit

### REVIEW-039: Daily Burn Meter Mixes Single Wallet with All-Wallet Spends
- **Files Modified**: `daily_burn_meter.js`
- **Lines Changed**: Lines 113-134
- **Fix Applied**: When a specific active wallet is chosen (`activeW !== 'all'`), scoped transaction filtering in `daily_burn_meter.js` to only include entries matching `resolveEntryWalletId(e) === activeW`, ensuring `todaySpent`, `monthSpent`, and `monthIncome` align directly with the active wallet's liquid balance rather than aggregating all wallets.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: Pending Tier Audit

### REVIEW-040: Time Machine Wealth Projection Mismatch on Chip Click
- **Files Modified**: `aurasense.js`
- **Lines Changed**: Lines 232, 258-263, 288-295, 309-322
- **Fix Applied**: Extracted and unified Time Machine wealth projection math into a single helper `getTimeMachineProjection(totalBalance, months)`. Replaced divergent initial modal inline multiplier ($\text{balance} \times (1 + 0.18 \times 3)$) with `getTimeMachineProjection(metric.totalBalance, 3)`, guaranteeing that the projection displayed upon opening matches the projection computed when clicking the "+3 Mo" horizon chip.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: Pending Tier Audit

### REVIEW-041: Everyday Food Misclassified as "Want" in 50/30/20 Budget
- **Files Modified**: `envelopes.js`
- **Lines Changed**: Lines 13-27, 80-104
- **Fix Applied**: Moved `'food'` from `wants` to `needs` in `CATEGORY_MAP`, while retaining luxury dining and delivery keywords (`swiggy`, `zomato`, `restaurant`, `cafe`, `dining`) in `wants`. Updated `classifyEntry(entry)` to check discretionary wants prior to needs and implemented word-boundary matching `matchKeyword()` for short tokens (preventing substrings like `'order'` from falsely matching `'rd'`). Standard sustenance meals and groceries now correctly map to Needs (50%), while restaurant and delivery orders map to Wants (30%).
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: Pending Tier Audit

### REVIEW-042: Opening Balance Combines Single Wallet with All History
- **Files Modified**: `reports.js`
- **Lines Changed**: Lines 65, 96-112
- **Fix Applied**: In `getPeriodAccountingData()`, updated `prevIncome` and `prevSpent` calculation to inspect `eWallet = resolveEntryWalletId(e)`. When a specific wallet is selected (`activeW !== 'all'`), historical transactions prior to `startDate` are filtered to `eWallet === activeW` and include transfer legs for that specific wallet, preventing cash flow from other wallets from corrupting the selected wallet's opening balance.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: Pending Tier Audit

### REVIEW-051: Unthrottled 60 FPS Infinite Canvas Loop with Full Array Scan
- **Files Modified**: `aurasense.js`
- **Lines Changed**: Lines 75-140, 247
- **Fix Applied**: Introduced `getCachedFinancialVelocity()` with a 4-second TTL cache to prevent repeated 60 FPS array scans across all transactions during canvas rendering. Added defensive visibility checks (`document.hidden`, `auraCanvas.offsetParent === null`, `auraCanvas.isConnected === false`) in `renderAuraSense()` to pause `requestAnimationFrame` when the user leaves the tab or navigates away from the AuraSense canvas widget, and wired `visibilitychange` and `IntersectionObserver` listeners to restart the animation loop smoothly when the canvas returns to view.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: Pending Tier Audit

### REVIEW-052: Missing Service Worker Caching for External CDN SDKs
- **Files Modified**: `sw.js`
- **Lines Changed**: Lines 42-47, 50-56, 73-88
- **Fix Applied**: Added `TRUSTED_CDN_ORIGINS` (`cdnjs.cloudflare.com`, `www.gstatic.com`, `fonts.googleapis.com`, `fonts.gstatic.com`, `cdn.jsdelivr.net`) to `sw.js` and included external Firebase compat SDKs and jsPDF scripts in `SHELL`. Allowed caching for trusted CDN static resources while strictly excluding dynamic Firebase Auth/Firestore streaming/REST sync endpoints, ensuring the PWA can bootstrap completely offline.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: Pending Tier Audit

### REVIEW-053: Heavy Network-First SW Strategy Causes Weak-Network Delay
- **Files Modified**: `sw.js`
- **Lines Changed**: Lines 93-107
- **Fix Applied**: Replaced blocking network-first strategy with Stale-While-Revalidate (SWR) for shell assets and trusted CDN libraries in `sw.js`. Cached responses are returned immediately to eliminate 10-30 second timeouts on spotty 2G/3G connections, while a background fetch seamlessly revalidates and refreshes `CacheStorage` in the background with zero UI freeze.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: Pending Tier Audit

### REVIEW-054: Unbounded Firestore Reads on App Initialization
- **Files Modified**: `transactions.js`
- **Lines Changed**: Lines 800-818, 843-870
- **Fix Applied**: Replaced unbounded date range filter in `listenToEntries()` with `.orderBy('date', 'desc').limit(200)` on the initial real-time snapshot listener, capping initial snapshot memory and read quota consumption. Implemented `loadOlderEntries(batchSize = 100)` pagination helper using cursor query constraints to load and merge older historical transactions on demand.
- **Remediation Applied (Snapshot Pagination Retention)**: In `listenToEntries()`, merged real-time snapshot documents with existing out-of-window older entries (`e.date <= oldestSnapDate`) so that user-paginated historical transaction records are preserved across real-time synchronization updates without being evicted.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: Pending Tier Audit

### REVIEW-057: Fragile Script Execution Order & Global Namespace Clashes
- **Files Modified**: `app.html`, `app.js`, `wallets.js`
- **Lines Changed**: `app.html` Line 29; `app.js` Lines 2, 201, 392, 405, 435; `wallets.js` Lines 101-105, 122-133
- **Fix Applied**: Established the shared global namespace container `window.PT = window.PT || {};` across `app.html`, `app.js`, and `wallets.js`. Bound core functions and state (`PT.TRANSLATIONS`, `PT.currentLang`, `PT.entries`, `PT.mainEntries`, `PT.escapeHTML`, `PT.userWallets`, `PT.resolveEntryWalletId`) to `window.PT`, guarded global arrays (`window.userWallets`, `window.entries`) defensively against undefined or preloaded state wiping, and hardened cross-file access against script loading order variance.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: Pending Tier Audit


## Tier 3 — P2 Medium

### REVIEW-013: Cleartext OCR Receipt & Financial Data Leak in `console.log`
- **Files Modified**: `receipt_scanner.js`
- **Lines Changed**: Line 720 stripped
- **Fix Applied**: Removed diagnostic `console.log('PocketTrack OCR Raw Result:\n', extractedText);` from the image OCR parsing pipeline, preventing sensitive user financial details, merchant receipt data, and camera scan PII from leaking to the browser console.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: ✅ Pass (Certified Clean)

### REVIEW-014: Cleartext Password Exposure via `prompt()` in Account Deletion
- **Files Modified**: `app.js`
- **Lines Changed**: Lines 549-596 added; Lines 2713-2718 replaced
- **Fix Applied**: Implemented `showAppPasswordPrompt(message, onConfirm, title, onCancel)` and `promptPasswordModal(message, title)` presenting an in-app secure masked password dialog with `<input type="password">` and `autocomplete="current-password"`. Replaced synchronous cleartext `window.prompt()` in `deleteAccountAndPurgeData()` with `await promptPasswordModal()`, eliminating shoulder-surfing credential exposure during DPDP Act 2023 account deletion.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: ✅ Pass (Certified Clean)

### REVIEW-015: Total Absence of Schema, Type, and Size Validation
- **Files Modified**: `firestore.rules`
- **Lines Changed**: Lines 11-168 (replaced whole subcollection rule set with validated schema rules)
- **Fix Applied**: Introduced dedicated validation functions (`isValidUserProfile`, `isValidEntry`, `isValidEvent`, `isValidLedgerPerson`, `isValidLedgerTx`, `isValidSpace`, `isValidRecurring`, `isValidWallet`, `isValidPortfolio`) enforcing strict field whitelisting via `.keys().hasOnly(...)`, data type checks (`is number`, `is string`, `is bool`, `is list`), string length constraints (`size() <= ...`), and numerical boundary checks (`amt >= 0 && amt <= 10000000000`, `targetDay >= 1 && targetDay <= 31`) on all subcollection writes.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: ✅ Pass (Certified Clean)

### REVIEW-016: Unchecked Anonymous Auth Can Pollute Database
- **Files Modified**: `firestore.rules`
- **Lines Changed**: Lines 5-9, 107-160
- **Fix Applied**: Defined `isOwner(userId)` helper requiring `request.auth != null && request.auth.uid == userId && request.auth.token.firebase.sign_in_provider != 'anonymous'`. Applied this check to `/users/{userId}` and all subcollection read/write rules, blocking anonymous auth tokens from creating or mutating database documents and preventing database pollution from cycling anonymous credentials.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: ✅ Pass (Certified Clean)

### REVIEW-017: Missing Subresource Integrity (SRI) on CDN Scripts
- **Files Modified**: `app.html`, `receipt_scanner.js`
- **Lines Changed**: `app.html` Lines 21-24; `receipt_scanner.js` Lines 82-84
- **Fix Applied**: Added SHA-384 Subresource Integrity (`integrity="sha384-..."`) and `crossorigin="anonymous"` attributes to all external CDN scripts in `app.html` (`jspdf.umd.min.js`, `firebase-app-compat.js`, `firebase-auth-compat.js`, `firebase-firestore-compat.js`). Added `script.integrity = 'sha384-GJqSu7vueQ9qN0E9yLPb3Wtpd7OrgK8KmYzC8T1IysG1bcvxvIO4qtYR/D3A991F'` and `script.crossOrigin = 'anonymous'` to dynamic Tesseract.js script injection in `receipt_scanner.js`.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: ✅ Pass (Certified Clean)

### REVIEW-018: Camera Stream Track Persistence on OCR Exception
- **Files Modified**: `receipt_scanner.js`
- **Lines Changed**: Lines 561-680, 810-815
- **Fix Applied**: Hardened `stopLiveCamera()` to stop all tracks across both `activeCameraStream` and `video.srcObject`. Enclosed camera stream photo capture in `captureCameraPhoto()`, OCR parsing in `processReceiptSource()`, and modal closure in `closeReceiptScannerModal()` with `try...finally` blocks guaranteeing `stopLiveCamera()` executes regardless of exceptions, cancellations, or OCR processing errors. Added explicit error-path camera stoppage in `startLiveCamera()`.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: ✅ Pass (Certified Clean)

### REVIEW-029: Spurious Toast on Skipped Existing Recurring Entries
- **Files Modified**: `recurring.js`
- **Lines Changed**: Lines 100-160
- **Fix Applied**: Differentiated between newly created recurring entries (`createdCount`) and skipped duplicates (`skippedCount`) in `processRecurringDue()`. Updated the rule's `nextDate` when either count is positive to catch up schedules, but restricted UI re-rendering, local transaction caching, toast popups, and local push notifications strictly to `createdCount > 0`.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: ✅ Pass (Certified Clean)

### REVIEW-030: Floating-Point Residue Creates Phantom Ledger Debts
- **Files Modified**: `ledger.js`
- **Lines Changed**: Lines 164-213, 431-472, 526-536
- **Fix Applied**: Rounded calculated ledger person balances to 2 decimal places (`Math.round(balance * 100) / 100`) and sanitized balances with `Math.abs(balance) <= 0.01 ? 0 : balance`. Gated balance text display, WhatsApp reminder buttons, and 1-tap "Settle Up" action on `Math.abs(balance) > 0.01`, eliminating IEEE 754 precision residue phantom debts on settled accounts.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: ✅ Pass (Certified Clean)

### REVIEW-031: WhatsApp Link Duplicates Country Code `91`
- **Files Modified**: `ledger.js`
- **Lines Changed**: Lines 640-664
- **Fix Applied**: Sanitized contact telephone numbers in `sendPersonWhatsAppReminder()` to strip leading `+`, `+91`, and redundant `91` country code prefixes when phone numbers already include 12 digits or country code markers. Prepending `91` in `https://wa.me/91...` now reliably targets standard 10-digit Indian destination numbers without generating invalid `9191` URLs.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: ✅ Pass (Certified Clean)

### REVIEW-032: Voice Date Month Boundary Rollback Clamps Erroneously
- **Files Modified**: `voice.js`
- **Lines Changed**: Lines 366-398
- **Fix Applied**: Replaced raw `setMonth(getMonth() - 1)` month shifts in `parseVoiceDate()` with boundary-aware month rollback calculations. Explicitly computes `targetYear` and `targetMonth`, extracts target month maximum calendar days (`new Date(targetYear, targetMonth + 1, 0).getDate()`), and clamps `targetDay = Math.min(day, maxDays)` to prevent backward date rollbacks (e.g., "on the 31st" from March) from overflowing into March 3.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: ✅ Pass (Certified Clean)

### REVIEW-043: Overspend Alert Dead Code Due to Clamped Burn Percent
- **Files Modified**: `daily_burn_meter.js`
- **Lines Changed**: Lines 191-197, 217-234
- **Fix Applied**: Removed the artificial `Math.min(100, ...)` clamp from `burnPercent` in `computeSafeToSpend()`. Daily burn rate now calculates real percentage values above 100% on overspend, activating the previously unreachable `else if (data.burnPercent > 100)` branch in `renderDailyBurnMeter()` to display the red alert gauge and overspent amount while safely clamping the SVG circle dash-offset for rendering.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: ✅ Pass (Certified Clean)

### REVIEW-044: Lean FI & Fat FI UI Labels Disagree with Multipliers by 2.5x
- **Files Modified**: `fire_runway.js`
- **Lines Changed**: Lines 184, 194
- **Fix Applied**: Corrected UI labels in `openModal()` from `Lean FI (18x)` to `Lean FI (18.75x)` ($25\text{x} \times 0.75$) and from `Fat FI (35x)` to `Fat FI (37.5x)` ($25\text{x} \times 1.50$), reconciling a 2.5x annual expense discrepancy between displayed labels and mathematical calculations.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: ✅ Pass (Certified Clean)

### REVIEW-045: Lifetime Net Income Used as Single-Goal Savings Progress
- **Files Modified**: `goal_sip_planner.js`
- **Lines Changed**: Lines 166-184, 220-270
- **Fix Applied**: Replaced raw lifetime net savings calculation (`totalInc - totalExp`) in `renderActiveGoalCard()` with dedicated goal savings allocation. Enabled users to link a dedicated savings wallet or specify an allocated savings amount in the goal planner modal. Savings progress now tracks dedicated wallet balances, explicit allocations, and goal-tagged transactions instead of appropriating the user's entire lifetime net earnings.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: ✅ Pass (Certified Clean)

### REVIEW-046: Inaccurate 4.2 Multiplier for Monthly Budget Pool
- **Files Modified**: `daily_burn_meter.js`
- **Lines Changed**: Line 159
- **Fix Applied**: Replaced the inaccurate static 4.2 weekly budget multiplier with dynamic weeks in the current month (`weeklyBudget * (totalDays / 7)`). Accurately scales the monthly budget pool across 28, 29, 30, and 31-day months rather than artificially truncating monthly budgets to 29.4 days.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: ✅ Pass (Certified Clean)

### REVIEW-047: Zero Allowance with Zero Spend Sets 100% Red Burn Gauge
- **Files Modified**: `daily_burn_meter.js`
- **Lines Changed**: Lines 191-196
- **Fix Applied**: Updated `burnPercent` computation in `computeSafeToSpend()` to evaluate `burnPercent = (todaySpent > 0 ? 100 : 0)` when `dailyAllowance === 0`. If a user has a zero daily allowance and has incurred zero expenses today, `burnPercent` cleanly evaluates to 0% rather than 100%, preventing false red overspent radar gauges on inactive days.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: ✅ Pass (Certified Clean)

### REVIEW-048: Frugal Micro-Transactions <₹500 Labeled as Impulse Leaks
- **Files Modified**: `financial_dna.js`, `tests/test_tier3_b_micro.js`
- **Lines Changed**: `financial_dna.js` Lines 240-257; `tests/test_tier3_b_micro.js` Lines 368-435
- **Fix Applied**: Combined price thresholds (`< ₹500` and `< ₹300`) with discretionary non-essential category validation in `computeFinancialDNA()`. Whitelisted essential categories (`groceries`, `bills`, `health`, `transport`, `utilities`, `rent`, `fuel`) from impulse counting. Sub-₹500 micro-transactions are now only classified as impulse leaks if they fall under discretionary categories (`shopping`, `entertainment`, `gaming`, `leisure`) or luxury dining/delivery keywords (`swiggy`, `zomato`, `cafe`).
- **Remedy Applied (Forensic Audit Remediation)**: Restored the missing `} else if (e.type === 'expense' && !e.transferGroupId) {` control flow branch in `financial_dna.js` lines 241-244, re-establishing strict segregation between income accumulation and expense categorization. Hardened `tests/test_tier3_b_micro.js` Test 10 to execute `computeFinancialDNA()` directly in an isolated Node VM context across 4 empirical verification suites (Accounting Segregation, Frugal Essentials, Impulsive Discretionary, and Inter-Wallet Transfers) rather than relying on an internal simulation function.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: ✅ Pass (Certified Clean)

### REVIEW-049: Facade Financial Milestones Unlocked Solely by Slider
- **Files Modified**: `aurasense.js`
- **Lines Changed**: Lines 295-345, 375-400
- **Fix Applied**: Implemented `getTimeMachineMilestones()` to evaluate Time Machine financial milestones against actual user financial metrics rather than solely the slider position. Compares projected wealth against 3-month emergency fund requirements (`monthlyBurn * 3`), checks actual outstanding debts from the P2P ledger and debt tracker against projected savings, and requires projected wealth $\ge$ ₹1,00,000 for net worth milestones. Unearned milestone badges are replaced with real progress trajectories.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: ✅ Pass (Certified Clean)

### REVIEW-055: Absence of Script Bundling (~780 KB Across 32 Scripts)
- **Files Modified**: None (Deferred by Technology Constraints)
- **Lines Changed**: N/A
- **Fix Applied**: Deferred. Bundling is prohibited by strict technology constraints requiring a zero-build, vanilla JavaScript architecture without npm packages, Node bundlers (Vite/webpack/esbuild), or build steps. Script tags are loaded natively in `app.html` with HTTP/2 multiplexing, Service Worker asset caching (SWR), and Subresource Integrity (SRI) hashes mitigating connection overhead.
- **Micro-Audit Result**: ✅ Pass (Constraint compliant deferral documented)
- **Tier Audit Result**: ✅ Pass (Certified Clean)

### REVIEW-056: Missing Hydration Loading Spinners Causing Content Flash
- **Files Modified**: `transactions.js`, `ledger.js`
- **Lines Changed**: `transactions.js` Lines 92-96, 769-848, 1307-1333; `ledger.js` Lines 96-155, 210-237
- **Fix Applied**: Added skeleton loading indicators during initial Firestore cache and network hydration. In `transactions.js`, tracked `isEntriesHydrating` to render pulsed skeleton cards in `#entries-list` and `#home-recent-activity` when transactions are unpopulated, resolving immediately upon local cache hit or snapshot arrival. In `ledger.js`, tracked `isLedgerHydrating` to render contact skeleton cards in `#ledger-people-list` until contacts or empty snapshot resolve, eliminating "No transactions" and "No contacts" startup content flash.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: ✅ Pass (Certified Clean)

### REVIEW-058: Silent Error Swallowing in Background Promises
- **Files Modified**: `monetization.js`, `auth.js`, `onboarding.js`
- **Lines Changed**: `monetization.js` Lines 205-207, 245-247; `auth.js` Line 80; `onboarding.js` Lines 543, 563-565
- **Fix Applied**: Replaced empty `.catch(()=>{})` blocks and empty `try...catch` handlers with structured console logging. In `monetization.js`, added structured `console.warn('[Monetization]...')` logging for Firestore Pro updates and deletions. In `auth.js`, formatted verification email failures with `console.warn('[Auth]...')`. In `onboarding.js`, added `console.warn('[Onboarding]...')` for initial wallet persistence failures and `console.error('[Onboarding]...')` for profile finalization exceptions.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: ✅ Pass (Certified Clean)

### REVIEW-059: Duplicated Audio Synthesis & Date Formatting Utilities
- **Files Modified**: `animations.js`, `website/main.js`, `app.js`, `reports.js`
- **Lines Changed**: `animations.js` Lines 25-80; `website/main.js` Lines 5-39; `app.js` Lines 416-435; `reports.js` Lines 88, 91
- **Fix Applied**: Deduplicated audio synthesis and date formatting routines by delegating to central utilities. Extended `playHapticSound(type, force)` in `animations.js` to support chime/success audio synthesis and exposed it on `window.playHapticSound` and `window.PT.playHapticSound`. Updated `website/main.js`'s `playSound()` to delegate directly to `window.playHapticSound`. Centralized `dateToStr`, `todayStr`, and `fmtDate` in `app.js` with date-instance and null guarding, bound them to `window.PT`, and delegated `reports.js` date resolution to `window.PT.dateToStr`.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: ✅ Pass (Certified Clean)


## Tier 4 — P3 Low

### REVIEW-050: Wealth Simulator NaN Bar Width on Zero Monthly Contribution
- **Files Modified**: `wealth_simulator.js`
- **Lines Changed**: Lines 71-76, 89-91, 132-135
- **Fix Applied**: Guarded progress bar percentage computations against zero future values (`res.futureValue > 0 ? Math.round((res.invested / res.futureValue) * 100) : 0`). Both `openModal()` initial markup and `updateSimulatorUI()` input handlers evaluate `invPct = 0%` and `gainPct = 0%` when monthly contribution or future value is zero, eliminating invalid `style="width: NaN%"` CSS attributes.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: ✅ Pass (Certified Clean)

### REVIEW-060: Dead Code & Phantom Documentation References
- **Files Modified**: `README.md`, `landing.html`
- **Lines Changed**: `README.md` Lines 27-28, 52-54; `landing.html` Lines 1-18
- **Fix Applied**: Removed phantom references to nonexistent `aicoach.js` from `README.md` features and repository tree, replacing them with accurate documentation of `reports.js`, `finny.js` (mascot engine), and `aurasense.js` (Time Machine). Consolidated duplicate 470-line `landing.html` file into a clean canonical redirect to the authoritative `website/index.html` showcase template.
- **Micro-Audit Result**: ✅ Pass
- **Tier Audit Result**: ✅ Pass (Certified Clean)
