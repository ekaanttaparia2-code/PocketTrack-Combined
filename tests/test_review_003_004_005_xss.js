/**
 * Challenge Test 2: REVIEW-003, REVIEW-004, REVIEW-005 (XSS Vectors)
 * Tests malicious payloads containing <script>, <img src=x onerror=...>, ", '
 * in wrapped.js, reports.js, and debt_payoff.js.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TEST 2: XSS Vectors (REVIEW-003, REVIEW-004, REVIEW-005) ===');

// Standard DOM textContent -> innerHTML behavior for text nodes
function createMockElement(tagName) {
  let _text = '';
  return {
    tagName: tagName.toUpperCase(),
    set textContent(val) {
      _text = String(val);
    },
    get textContent() {
      return _text;
    },
    get innerHTML() {
      // Browser DOM textContent serializer converts &, <, > into entities
      return _text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }
  };
}

const mockDocument = {
  createElement: (tag) => createMockElement(tag),
  getElementById: () => null,
  body: { appendChild: () => {} }
};

// app.js escapeHTML implementation
function escapeHTML(str) {
  const div = mockDocument.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function capitalize(s) {
  if (!s || typeof s !== 'string') return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Adversarial XSS payloads to test
const attackPayloads = [
  "<script>alert('XSS_SCRIPT')</script>",
  "<img src=x onerror=alert('XSS_IMG')>",
  "<svg/onload=alert('XSS_SVG')>",
  "<iframe src=\"javascript:alert('XSS_IFRAME')\"></iframe>",
  "\" onclick=\"alert('XSS_QUOTE')\"",
  "' onmouseover='alert(\"XSS_SQUOTE\")'",
  "<body onload=alert('XSS_BODY')>",
  "><script>alert('XSS_BREAKOUT')</script><",
  "<a href=\"javascript:alert('XSS_LINK')\">click</a>",
  "&<>'\"/test"
];

// Helper to check if raw active executable tags exist in rendered HTML
function assertNoRawExecutableTags(html, payloadDescription) {
  const dangerousPatterns = [
    /<script\b[^>]*>/i,
    /<img\b[^>]*onerror/i,
    /<svg\b[^>]*onload/i,
    /<iframe\b/i,
    /<body\b[^>]*onload/i
  ];

  dangerousPatterns.forEach(pattern => {
    assert(
      !pattern.test(html),
      `SECURITY VULNERABILITY DETECTED! Found unescaped tag matching ${pattern} with payload [${payloadDescription}]. HTML dump: ${html}`
    );
  });
}

// -------------------------------------------------------------
// 1. REVIEW-003: wrapped.js
// -------------------------------------------------------------
console.log('\n--- 1. Testing wrapped.js (REVIEW-003) ---');
const wrappedCode = fs.readFileSync(path.resolve(__dirname, '..', 'wrapped.js'), 'utf8');

// Verify wrapped.js actually uses escapeHTML around topCategory and catArray
assert(
  wrappedCode.includes('escapeHTML(capitalize(d.topCategory.customCat || d.topCategory.cat))'),
  'FAIL: wrapped.js line 307 must call escapeHTML(capitalize(...))'
);
assert(
  wrappedCode.includes('escapeHTML(capitalize(c.customCat || c.cat))'),
  'FAIL: wrapped.js line 356 must call escapeHTML(capitalize(...))'
);

attackPayloads.forEach(payload => {
  // Simulate topCategory rendering
  const d = {
    month: 10,
    year: 2026,
    incCount: 5,
    expCount: 10,
    totalTxns: 15,
    totalExpAmt: 50000,
    topCatAmt: 15000,
    yearlyOppAmt: 180000,
    oppItem: 'iPhone',
    topCategory: { customCat: payload, cat: 'custom' },
    catArray: [
      { customCat: payload, cat: 'custom', amt: 15000 }
    ],
    dna: { emoji: '🎯', title: 'Calculated', pct: 20 }
  };

  const topCatName = d.topCategory ? escapeHTML(capitalize(d.topCategory.customCat || d.topCategory.cat)) : 'N/A';
  const card2Html = `
    <div class="wrapped-card card-bg-2">
      <h2>The Brutal Truth</h2>
      <div class="sub-text">Your top spend was <strong>${topCatName}</strong> at ₹${d.topCatAmt.toLocaleString('en-IN')}.</div>
    </div>
  `;

  assertNoRawExecutableTags(card2Html, `wrapped topCategory: ${payload}`);
  assert(!card2Html.includes('<script>'), `Found raw <script> in wrapped topCategory`);
  assert(!card2Html.includes('<img '), `Found raw <img in wrapped topCategory`);

  // Simulate catArray legend rendering
  let legendHtml = '';
  d.catArray.forEach(c => {
    const pct = Math.round((c.amt / d.totalExpAmt) * 100);
    const color = '#ff0000';
    const name = escapeHTML(capitalize(c.customCat || c.cat));
    legendHtml += `
      <div class="legend-item">
        <div><span class="legend-dot" style="background-color: ${color};"></span>${name}</div>
        <div>₹${c.amt.toLocaleString('en-IN')} (${pct}%)</div>
      </div>
    `;
  });

  assertNoRawExecutableTags(legendHtml, `wrapped catArray: ${payload}`);
  assert(!legendHtml.includes('<script>'), `Found raw <script> in wrapped catArray`);
  assert(!legendHtml.includes('<img '), `Found raw <img in wrapped catArray`);
});
console.log('✔ PASS: wrapped.js properly escapes all attack payloads in topCategory and catArray');

// -------------------------------------------------------------
// 2. REVIEW-004: reports.js
// -------------------------------------------------------------
console.log('\n--- 2. Testing reports.js (REVIEW-004) ---');
const reportsCode = fs.readFileSync(path.resolve(__dirname, '..', 'reports.js'), 'utf8');

assert(
  reportsCode.includes('escapeHTML((typeof CAT_LABELS!==\'undefined\'&&CAT_LABELS[c])||c)'),
  'FAIL: reports.js line 272 must call escapeHTML on category breakdown label fallback'
);

const CAT_LABELS = { food: 'Food & Dining', travel: 'Transport' };
attackPayloads.forEach(payload => {
  const cats = {};
  cats[payload] = 5000;
  const maxCat = 5000;

  const renderedHtml = Object.entries(cats).sort((a,b)=>b[1]-a[1]).map(([c,a])=>`
    <div class="cat-bar">
      <span style="font-size:13px;min-width:110px;color:var(--text-dim)">${escapeHTML((typeof CAT_LABELS!=='undefined'&&CAT_LABELS[c])||c)}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.round(a/maxCat*100)}%;background:#9b95c2"></div></div>
      <span style="font-size:13px;font-weight:600;min-width:50px;text-align:right">₹${Number(a).toLocaleString('en-IN')}</span>
    </div>`).join('');

  assertNoRawExecutableTags(renderedHtml, `reports custom category: ${payload}`);
  assert(!renderedHtml.includes('<script>'), `Found raw <script> in reports`);
  assert(!renderedHtml.includes('<img '), `Found raw <img in reports`);
});
console.log('✔ PASS: reports.js properly escapes all attack payloads in custom category breakdown');

// -------------------------------------------------------------
// 3. REVIEW-005: debt_payoff.js
// -------------------------------------------------------------
console.log('\n--- 3. Testing debt_payoff.js (REVIEW-005) ---');
const debtPayoffCode = fs.readFileSync(path.resolve(__dirname, '..', 'debt_payoff.js'), 'utf8');

assert(
  debtPayoffCode.includes('escapeHTML(d.icon || \'💳\')'),
  'FAIL: debt_payoff.js line 173 must call escapeHTML(d.icon || ...)'
);
assert(
  debtPayoffCode.includes('escapeHTML(d.name || \'\')'),
  'FAIL: debt_payoff.js line 175 must call escapeHTML(d.name || ...)'
);

attackPayloads.forEach(payload => {
  const d = {
    id: 'test_1',
    name: payload,
    icon: payload,
    rate: 18,
    minPayment: 2000
  };

  const renderedItem = '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;margin-bottom:6px;">' +
    '<div style="display:flex;align-items:center;gap:8px;">' +
      '<span style="font-size:18px;">' + escapeHTML(d.icon || '💳') + '</span>' +
      '<div>' +
        '<strong style="font-size:13px;display:block;">' + escapeHTML(d.name || '') + '</strong>' +
        '<span style="font-size:10.5px;color:#f87171;">' + d.rate + '% APR · Min ₹' + d.minPayment.toLocaleString('en-IN') + '</span>' +
      '</div>' +
    '</div>' +
  '</div>';

  assertNoRawExecutableTags(renderedItem, `debt_payoff name/icon: ${payload}`);
  assert(!renderedItem.includes('<script>'), `Found raw <script> in debt_payoff`);
  assert(!renderedItem.includes('<img '), `Found raw <img in debt_payoff`);
});
console.log('✔ PASS: debt_payoff.js properly escapes all attack payloads in debt name and icon');

console.log('\n=== TEST 2 COMPLETE: ALL XSS VECTORS NEUTRALIZED ===\n');
