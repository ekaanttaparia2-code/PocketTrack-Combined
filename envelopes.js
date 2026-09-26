/* ═══════════════════════════════════════════════════════════════
   50/30/20 ENVELOPE BUDGETS ENGINE — PocketTrack Combined
   Ported & enhanced from Version B into vanilla JavaScript.
   Auto-calculates Needs (50%), Wants (30%), Savings (20%)
   allocations, tracks category spending, and renders visual
   progress bars with real-time feedback.
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  var CATEGORY_MAP = {
    needs: [
      'groceries', 'grocery', 'rent', 'utilities', 'bills', 'bill',
      'electricity', 'gas', 'water', 'wifi', 'broadband', 'medical',
      'medicine', 'health', 'hospital', 'fuel', 'petrol', 'diesel',
      'transport', 'commute', 'auto', 'metro', 'bus', 'cab', 'school',
      'education', 'fees', 'emi', 'loan', 'insurance', 'kirana', 'ration'
    ],
    wants: [
      'food', 'dining', 'restaurant', 'cafe', 'coffee', 'chai', 'tea',
      'shopping', 'clothes', 'clothing', 'apparel', 'entertainment',
      'movies', 'cinema', 'netflix', 'prime', 'hotstar', 'spotify',
      'gaming', 'games', 'travel', 'vacation', 'trip', 'swiggy', 'zomato',
      'blinkit', 'zepto', 'instamart', 'salon', 'spa', 'beauty',
      'gadgets', 'electronics', 'hobby', 'gifts', 'party', 'outing'
    ],
    savings: [
      'savings', 'investment', 'investments', 'mutual fund', 'sip',
      'stocks', 'equity', 'gold', 'silver', 'chillar', 'vault',
      'fd', 'rd', 'emergency fund', 'ppf', 'nps', 'crypto'
    ]
  };

  function getLang() {
    return (window.currentLang === 'hi' || localStorage.getItem('pockettrack_lang') === 'hi') ? 'hi' : 'en';
  }

  function getMonthlyIncome() {
    var stored = localStorage.getItem('pockettrack_monthly_income');
    if (stored && !isNaN(Number(stored)) && Number(stored) > 0) {
      return Number(stored);
    }
    // Try profile
    try {
      var prof = JSON.parse(localStorage.getItem('pockettrack_finny_profile') || '{}');
      if (prof.monthlyIncome && prof.monthlyIncome > 0) {
        return Number(prof.monthlyIncome);
      }
    } catch(e) {}

    // Try computing from current month's income entries
    var entries = [];
    if (typeof window.mainEntries === 'function') entries = window.mainEntries();
    else if (Array.isArray(window.entries)) entries = window.entries;
    if (!Array.isArray(entries)) entries = [];

    var curMonth = new Date().toISOString().slice(0, 7);
    var monthIncome = entries
      .filter(function(e) { return e.type === 'income' && String(e.date || '').slice(0, 7) === curMonth; })
      .reduce(function(s, e) { return s + (Number(e.amt || e.amount) || 0); }, 0);

    if (monthIncome > 0) return monthIncome;
    return 40000; // Default sensible fallback
  }

  function classifyEntry(entry) {
    var cat = String(entry.cat || entry.category || '').toLowerCase().trim();
    var desc = String(entry.desc || entry.description || entry.note || '').toLowerCase().trim();
    var text = cat + ' ' + desc;

    for (var i = 0; i < CATEGORY_MAP.savings.length; i++) {
      if (text.indexOf(CATEGORY_MAP.savings[i]) !== -1) return 'savings';
    }
    for (var j = 0; j < CATEGORY_MAP.needs.length; j++) {
      if (text.indexOf(CATEGORY_MAP.needs[j]) !== -1) return 'needs';
    }
    for (var k = 0; k < CATEGORY_MAP.wants.length; k++) {
      if (text.indexOf(CATEGORY_MAP.wants[k]) !== -1) return 'wants';
    }

    // Default classification: essential-sounding categories map to needs, others to wants
    return 'wants';
  }

  function getEnvelopeSummary() {
    var income = getMonthlyIncome();
    var targetNeeds = Math.round(income * 0.50);
    var targetWants = Math.round(income * 0.30);
    var targetSavings = Math.round(income * 0.20);

    var entries = [];
    if (typeof window.mainEntries === 'function') entries = window.mainEntries();
    else if (Array.isArray(window.entries)) entries = window.entries;
    if (!Array.isArray(entries)) entries = [];

    var curMonth = new Date().toISOString().slice(0, 7);
    var monthExpenses = entries.filter(function(e) {
      return e.type === 'expense' && String(e.date || '').slice(0, 7) === curMonth;
    });

    var spentNeeds = 0;
    var spentWants = 0;
    var savedAmount = 0;

    monthExpenses.forEach(function(e) {
      var amt = Number(e.amt || e.amount) || 0;
      var group = classifyEntry(e);
      if (group === 'needs') spentNeeds += amt;
      else if (group === 'savings') savedAmount += amt;
      else spentWants += amt;
    });

    // Also include savings from investment / vault if recorded as income or transfer
    var monthSavingsEntries = entries.filter(function(e) {
      return String(e.date || '').slice(0, 7) === curMonth && classifyEntry(e) === 'savings';
    });
    monthSavingsEntries.forEach(function(e) {
      if (e.type !== 'expense') {
        savedAmount += (Number(e.amt || e.amount) || 0);
      }
    });

    return {
      income: income,
      needs: {
        allocated: targetNeeds,
        spent: spentNeeds,
        remaining: targetNeeds - spentNeeds,
        pct: targetNeeds > 0 ? Math.round((spentNeeds / targetNeeds) * 100) : 0
      },
      wants: {
        allocated: targetWants,
        spent: spentWants,
        remaining: targetWants - spentWants,
        pct: targetWants > 0 ? Math.round((spentWants / targetWants) * 100) : 0
      },
      savings: {
        allocated: targetSavings,
        spent: savedAmount,
        remaining: targetSavings - savedAmount,
        pct: targetSavings > 0 ? Math.round((savedAmount / targetSavings) * 100) : 0
      }
    };
  }

  // ── CSS Injection ───────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('envelopes-styles')) return;
    var s = document.createElement('style');
    s.id = 'envelopes-styles';
    s.textContent = [
      '.envelope-widget-card { background:linear-gradient(145deg,rgba(26,22,51,0.85),rgba(15,12,34,0.92)); border:1px solid rgba(139,92,246,0.3); border-radius:22px; padding:18px 20px; margin:16px 0; color:#fff; box-shadow:0 10px 30px rgba(0,0,0,0.3); position:relative; overflow:hidden }',
      '.env-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(210px, 1fr)); gap:12px; margin-top:14px; }',
      '.env-item-card { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:16px; padding:14px; display:flex; flex-direction:column; gap:8px; transition:border-color 0.2s }',
      '.env-item-card:hover { border-color:rgba(255,255,255,0.2) }',
      '.env-bar-track { width:100%; height:7px; background:rgba(255,255,255,0.08); border-radius:4px; overflow:hidden; margin:4px 0; }',
      '.env-bar-fill { height:100%; border-radius:4px; transition:width 0.4s ease; }',
      '.env-modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.7); backdrop-filter:blur(6px); z-index:99999; display:flex; align-items:center; justify-content:center; padding:20px; }',
      '.env-modal-box { width:100%; max-width:380px; background:#161033; border:1px solid rgba(139,92,246,0.35); border-radius:22px; padding:22px; box-shadow:0 20px 50px rgba(0,0,0,0.6); color:#fff; }'
    ].join('\n');
    document.head.appendChild(s);
  }

  // ── Render Envelopes Widget ─────────────────────────────────
  function renderEnvelopes() {
    var slot = document.getElementById('home-envelopes-slot');
    if (!slot) return;

    var isHi = getLang() === 'hi';
    var data = getEnvelopeSummary();

    function getBarColor(env, defaultColor) {
      if (env.spent > env.allocated && env.allocated > 0) return '#f43f5e'; // Red (over budget)
      if (env.pct >= 80) return '#fbbf24'; // Amber (caution)
      return defaultColor;
    }

    var needsColor = getBarColor(data.needs, '#38bdf8');
    var wantsColor = getBarColor(data.wants, '#ec4899');
    var savingsColor = '#10b981';

    slot.innerHTML =
      '<div class="envelope-widget-card">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">' +
          '<div>' +
            '<div style="font-size:12px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:#c4b5fd;display:flex;align-items:center;gap:6px;">' +
              '<span>📊 ' + (isHi ? '50/30/20 बजट लिफाफे' : '50/30/20 Envelope Budgets') + '</span>' +
            '</div>' +
            '<div style="font-size:11px;color:var(--text-dim,#94a3b8);margin-top:2px;">' +
              (isHi
                ? 'मासिक आय: ₹' + data.income.toLocaleString('en-IN') + ' · 50% ज़रूरतें • 30% इच्छाएं • 20% बचत'
                : 'Monthly Income: ₹' + data.income.toLocaleString('en-IN') + ' · 50% Needs • 30% Wants • 20% Savings') +
            '</div>' +
          '</div>' +
          '<button type="button" class="btn" onclick="window.Envelopes.openEditModal()" style="font-size:11px;padding:5px 12px;border-radius:10px;background:rgba(139,92,246,0.18);border:1px solid rgba(139,92,246,0.4);color:#c4b5fd;cursor:pointer;display:flex;align-items:center;gap:4px;">' +
            '<span>✏️ ' + (isHi ? 'प्लान बदलें' : 'Edit Plan') + '</span>' +
          '</button>' +
        '</div>' +

        '<div class="env-grid">' +
          // 1. NEEDS
          '<div class="env-item-card" style="border-top:3px solid #38bdf8;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;">' +
              '<span style="font-size:12px;font-weight:700;color:#38bdf8;">🏠 ' + (isHi ? 'ज़रूरतें (50%)' : 'Needs (50%)') + '</span>' +
              '<span style="font-size:11px;font-weight:700;color:' + needsColor + ';">' + data.needs.pct + '%</span>' +
            '</div>' +
            '<div style="font-size:18px;font-weight:800;color:#fff;">₹' + data.needs.spent.toLocaleString('en-IN') +
              '<span style="font-size:12px;font-weight:500;color:var(--text-dim);"> / ₹' + data.needs.allocated.toLocaleString('en-IN') + '</span>' +
            '</div>' +
            '<div class="env-bar-track">' +
              '<div class="env-bar-fill" style="width:' + Math.min(100, data.needs.pct) + '%;background:' + needsColor + ';"></div>' +
            '</div>' +
            '<div style="font-size:10.5px;color:var(--text-dim);">' +
              (data.needs.remaining >= 0
                ? (isHi ? 'बचा हुआ: ₹' : 'Left: ₹') + data.needs.remaining.toLocaleString('en-IN')
                : (isHi ? '⚠️ सीमा से अधिक: ₹' : '⚠️ Over by ₹') + Math.abs(data.needs.remaining).toLocaleString('en-IN')) +
            '</div>' +
          '</div>' +

          // 2. WANTS
          '<div class="env-item-card" style="border-top:3px solid #ec4899;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;">' +
              '<span style="font-size:12px;font-weight:700;color:#ec4899;">🍿 ' + (isHi ? 'इच्छाएं (30%)' : 'Wants (30%)') + '</span>' +
              '<span style="font-size:11px;font-weight:700;color:' + wantsColor + ';">' + data.wants.pct + '%</span>' +
            '</div>' +
            '<div style="font-size:18px;font-weight:800;color:#fff;">₹' + data.wants.spent.toLocaleString('en-IN') +
              '<span style="font-size:12px;font-weight:500;color:var(--text-dim);"> / ₹' + data.wants.allocated.toLocaleString('en-IN') + '</span>' +
            '</div>' +
            '<div class="env-bar-track">' +
              '<div class="env-bar-fill" style="width:' + Math.min(100, data.wants.pct) + '%;background:' + wantsColor + ';"></div>' +
            '</div>' +
            '<div style="font-size:10.5px;color:var(--text-dim);">' +
              (data.wants.remaining >= 0
                ? (isHi ? 'बचा हुआ: ₹' : 'Left: ₹') + data.wants.remaining.toLocaleString('en-IN')
                : (isHi ? '⚠️ सीमा से अधिक: ₹' : '⚠️ Over by ₹') + Math.abs(data.wants.remaining).toLocaleString('en-IN')) +
            '</div>' +
          '</div>' +

          // 3. SAVINGS
          '<div class="env-item-card" style="border-top:3px solid #10b981;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;">' +
              '<span style="font-size:12px;font-weight:700;color:#34d399;">📈 ' + (isHi ? 'बचत व SIP (20%)' : 'Savings (20%)') + '</span>' +
              '<span style="font-size:11px;font-weight:700;color:#34d399;">' + data.savings.pct + '%</span>' +
            '</div>' +
            '<div style="font-size:18px;font-weight:800;color:#fff;">₹' + data.savings.spent.toLocaleString('en-IN') +
              '<span style="font-size:12px;font-weight:500;color:var(--text-dim);"> / ₹' + data.savings.allocated.toLocaleString('en-IN') + '</span>' +
            '</div>' +
            '<div class="env-bar-track">' +
              '<div class="env-bar-fill" style="width:' + Math.min(100, data.savings.pct) + '%;background:' + savingsColor + ';"></div>' +
            '</div>' +
            '<div style="font-size:10.5px;color:var(--text-dim);">' +
              (data.savings.spent >= data.savings.allocated
                ? (isHi ? '🎉 मासिक लक्ष्य पूरा हुआ!' : '🎉 Target achieved this month!')
                : (isHi ? 'लक्ष्य तक शेष: ₹' : 'Target remaining: ₹') + (data.savings.allocated - data.savings.spent).toLocaleString('en-IN')) +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  // ── Edit Salary Plan Modal ──────────────────────────────────
  function openEditModal() {
    var isHi = getLang() === 'hi';
    var curIncome = getMonthlyIncome();

    var existing = document.getElementById('env-modal-backdrop');
    if (existing) existing.remove();

    var modal = document.createElement('div');
    modal.id = 'env-modal-backdrop';
    modal.className = 'env-modal-backdrop';
    modal.onclick = function(e) {
      if (e.target === modal) modal.remove();
    };

    modal.innerHTML =
      '<div class="env-modal-box">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">' +
          '<h3 style="font-size:16px;font-weight:700;margin:0;color:#fff;">' + (isHi ? 'मासिक बजट प्लान बदलें' : 'Set Envelope Plan') + '</h3>' +
          '<button onclick="document.getElementById(\'env-modal-backdrop\').remove()" style="background:none;border:none;color:var(--text-dim);font-size:18px;cursor:pointer;">✕</button>' +
        '</div>' +
        '<p style="font-size:12px;color:var(--text-dim);margin:0 0 14px;line-height:1.4;">' +
          (isHi
            ? 'अपनी मासिक आय दर्ज करें। Finny 50% ज़रूरतें, 30% शौक और 20% बचत के नियम अनुसार तुरंत बजट तैयार कर देगा।'
            : 'Enter your monthly take-home salary or pocket allowance to calibrate your 50/30/20 envelopes.') +
        '</p>' +
        '<div style="margin-bottom:14px;">' +
          '<label style="display:block;font-size:11px;font-weight:700;color:var(--text-dim);text-transform:uppercase;margin-bottom:4px;">' +
            (isHi ? 'मासिक आय (₹)' : 'Monthly Income (₹)') +
          '</label>' +
          '<input type="number" id="env-salary-input" class="ob-text-input" value="' + curIncome + '" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:10px 14px;border-radius:12px;width:100%;box-sizing:border-box;font-size:16px;font-weight:700;">' +
        '</div>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:18px;">' +
          '<button type="button" class="ob-preset-chip" onclick="document.getElementById(\'env-salary-input\').value=300">₹300 (Student)</button>' +
          '<button type="button" class="ob-preset-chip" onclick="document.getElementById(\'env-salary-input\').value=15000">₹15,000</button>' +
          '<button type="button" class="ob-preset-chip" onclick="document.getElementById(\'env-salary-input\').value=40000">₹40,000</button>' +
          '<button type="button" class="ob-preset-chip" onclick="document.getElementById(\'env-salary-input\').value=80000">₹80,000</button>' +
          '<button type="button" class="ob-preset-chip" onclick="document.getElementById(\'env-salary-input\').value=150000">₹1,50,000</button>' +
        '</div>' +
        '<div style="display:flex;gap:10px;justify-content:flex-end;">' +
          '<button type="button" class="btn" onclick="document.getElementById(\'env-modal-backdrop\').remove()" style="padding:8px 14px;border-radius:10px;background:rgba(255,255,255,0.08);color:#fff;border:none;cursor:pointer;">' + (isHi ? 'रद्द करें' : 'Cancel') + '</button>' +
          '<button type="button" class="btn primary" onclick="window.Envelopes.saveIncomePlan()" style="padding:8px 18px;border-radius:10px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;border:none;font-weight:700;cursor:pointer;">' + (isHi ? 'लागू करें ✨' : 'Apply Plan ✨') + '</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);
  }

  function saveIncomePlan() {
    var input = document.getElementById('env-salary-input');
    if (!input) return;
    var val = Math.max(100, Number(input.value) || 0);

    try {
      localStorage.setItem('pockettrack_monthly_income', String(val));
    } catch(e) {}

    var modal = document.getElementById('env-modal-backdrop');
    if (modal) modal.remove();

    renderEnvelopes();

    if (window.renderDailyBurnMeter) {
      window.renderDailyBurnMeter();
    }
    if (window.FinnyMascot && window.FinnyMascot.render) {
      window.FinnyMascot.render();
    }
  }

  // ── Public API ──────────────────────────────────────────────
  window.Envelopes = {
    render: renderEnvelopes,
    getSummary: getEnvelopeSummary,
    openEditModal: openEditModal,
    saveIncomePlan: saveIncomePlan,
    classify: classifyEntry
  };

  // ── Auto Initialization ─────────────────────────────────────
  injectStyles();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(renderEnvelopes, 650);
    });
  } else {
    setTimeout(renderEnvelopes, 650);
  }

  // Hook into stats refresh
  var origUpdateHeaderStats = window.updateHeaderStats;
  if (typeof origUpdateHeaderStats === 'function') {
    window.updateHeaderStats = function() {
      origUpdateHeaderStats.apply(this, arguments);
      try { renderEnvelopes(); } catch(e) {}
    };
  }
})();
