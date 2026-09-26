/* ═══════════════════════════════════════════════════════════════
   DEBT PAYOFF STRATEGY PLANNER — PocketTrack Combined
   Ported & enhanced from Version B into vanilla JavaScript.
   Calculates debt elimination timelines using Avalanche (highest
   interest first) vs Snowball (smallest balance first).
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  function getLang() {
    return (window.currentLang === 'hi' || localStorage.getItem('pockettrack_lang') === 'hi') ? 'hi' : 'en';
  }

  var defaultDebts = [
    { id: '1', name: 'Credit Card Bill', balance: 35000, rate: 36, minPayment: 2000, icon: '💳' },
    { id: '2', name: 'Personal Loan', balance: 80000, rate: 14, minPayment: 3500, icon: '🏦' },
    { id: '3', name: 'Gadget EMI', balance: 25000, rate: 16, minPayment: 2500, icon: '📱' }
  ];

  function getStoredDebts() {
    try {
      var d = JSON.parse(localStorage.getItem('pockettrack_debts'));
      if (Array.isArray(d) && d.length > 0) return d;
    } catch(e) {}
    return defaultDebts;
  }

  function saveDebts(debts) {
    try {
      localStorage.setItem('pockettrack_debts', JSON.stringify(debts));
    } catch(e) {}
  }

  function calculateStrategy(debts, strategy, extraPayment) {
    extraPayment = Number(extraPayment) || 0;
    var list = debts.map(function(d) {
      return {
        name: d.name,
        balance: Number(d.balance) || 0,
        rate: Number(d.rate) || 0,
        minPayment: Number(d.minPayment) || 0
      };
    });

    if (strategy === 'avalanche') {
      list.sort(function(a, b) { return b.rate - a.rate; }); // Highest rate first
    } else {
      list.sort(function(a, b) { return a.balance - b.balance; }); // Smallest balance first
    }

    var totalInterest = 0;
    var months = 0;
    var maxMonths = 360; // 30 years safety cap

    while (list.some(function(d) { return d.balance > 0; }) && months < maxMonths) {
      months++;
      var availableExtra = extraPayment;

      for (var i = 0; i < list.length; i++) {
        var d = list[i];
        if (d.balance <= 0) continue;

        var monthlyInterest = (d.balance * (d.rate / 100)) / 12;
        totalInterest += monthlyInterest;
        d.balance += monthlyInterest;

        var pay = Math.min(d.balance, d.minPayment);
        d.balance -= pay;

        // Apply extra payment to priority debt
        if (availableExtra > 0 && d.balance > 0) {
          var extraPay = Math.min(d.balance, availableExtra);
          d.balance -= extraPay;
          availableExtra -= extraPay;
        }
      }
    }

    return {
      months: months,
      totalInterest: Math.round(totalInterest),
      strategy: strategy
    };
  }

  function openModal() {
    var isHi = getLang() === 'hi';
    var debts = getStoredDebts();
    var totalDebt = debts.reduce(function(s, d) { return s + Number(d.balance); }, 0);

    var resAvalanche = calculateStrategy(debts, 'avalanche', 3000);
    var resSnowball = calculateStrategy(debts, 'snowball', 3000);
    var interestSaved = Math.max(0, resSnowball.totalInterest - resAvalanche.totalInterest);

    var existing = document.getElementById('debt-payoff-modal-backdrop');
    if (existing) existing.remove();

    var modal = document.createElement('div');
    modal.id = 'debt-payoff-modal-backdrop';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(7,4,20,0.85);backdrop-filter:blur(20px);z-index:999999;display:flex;align-items:center;justify-content:center;padding:16px;animation:fadeIn 0.2s ease;';

    modal.onclick = function(e) {
      if (e.target === modal) modal.remove();
    };

    modal.innerHTML =
      '<div class="card" style="max-width:520px;width:100%;background:linear-gradient(160deg,#190f33,#0d0822);border:1px solid rgba(239,68,68,0.35);border-radius:28px;padding:26px 22px;box-shadow:0 25px 70px rgba(0,0,0,0.8);max-height:90vh;overflow-y:auto;color:#fff;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">' +
          '<div style="display:flex;align-items:center;gap:8px;">' +
            '<span style="font-size:24px;">🎯</span>' +
            '<div>' +
              '<h3 style="margin:0;font-family:\'Space Grotesk\',sans-serif;font-size:20px;color:#fff;">' +
                (isHi ? 'कर्ज मुक्ति योजना (Debt Payoff)' : 'Debt Payoff Strategist') +
              '</h3>' +
              '<span style="font-size:11px;color:var(--text-dim,#a1a1aa);">' +
                (isHi ? 'एवलांच बनाम स्नोबॉल विधि' : 'Avalanche vs Snowball Elimination') +
              '</span>' +
            '</div>' +
          '</div>' +
          '<button onclick="document.getElementById(\'debt-payoff-modal-backdrop\').remove()" style="background:rgba(255,255,255,0.08);border:none;color:#fff;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:16px;">✕</button>' +
        '</div>' +

        // Summary Hero
        '<div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:20px;padding:16px;margin-bottom:16px;text-align:center;">' +
          '<span style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#f87171;font-weight:700;">' +
            (isHi ? 'कुल बकाया कर्ज' : 'Total Outstanding Debt') +
          '</span>' +
          '<div style="font-size:34px;font-weight:900;color:#fff;font-family:\'Space Grotesk\',sans-serif;margin:4px 0;">' +
            '₹' + totalDebt.toLocaleString('en-IN') +
          '</div>' +
          '<span style="font-size:12px;color:var(--text-dim);">' +
            (isHi ? '3 सक्रिय ऋण • एवलांच से ₹' + interestSaved.toLocaleString('en-IN') + ' की बचत' : '3 active debts • Avalanche saves ₹' + interestSaved.toLocaleString('en-IN')) +
          '</span>' +
        '</div>' +

        // Comparison Strategy Grid
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px;">' +
          // Strategy 1: Avalanche
          '<div style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.35);border-radius:16px;padding:14px;">' +
            '<span style="font-size:10.5px;color:#34d399;font-weight:700;text-transform:uppercase;display:block;">⚡ ' + (isHi ? 'एवलांच (अनुशंसित)' : 'Avalanche (Optimal)') + '</span>' +
            '<span style="font-size:11px;color:var(--text-dim);display:block;margin:2px 0 8px;">' + (isHi ? 'सबसे ज़्यादा ब्याज पहले' : 'Highest interest rate first') + '</span>' +
            '<div style="font-size:20px;font-weight:800;color:#fff;">' + resAvalanche.months + ' ' + (isHi ? 'महीने' : 'Months') + '</div>' +
            '<div style="font-size:11px;color:var(--text-dim);margin-top:4px;">' + (isHi ? 'कुल ब्याज: ₹' : 'Total Interest: ₹') + resAvalanche.totalInterest.toLocaleString('en-IN') + '</div>' +
          '</div>' +

          // Strategy 2: Snowball
          '<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.12);border-radius:16px;padding:14px;">' +
            '<span style="font-size:10.5px;color:#38bdf8;font-weight:700;text-transform:uppercase;display:block;">❄️ ' + (isHi ? 'स्नोबॉल' : 'Snowball') + '</span>' +
            '<span style="font-size:11px;color:var(--text-dim);display:block;margin:2px 0 8px;">' + (isHi ? 'सबसे छोटा कर्ज पहले' : 'Smallest balance first') + '</span>' +
            '<div style="font-size:20px;font-weight:800;color:#fff;">' + resSnowball.months + ' ' + (isHi ? 'महीने' : 'Months') + '</div>' +
            '<div style="font-size:11px;color:var(--text-dim);margin-top:4px;">' + (isHi ? 'कुल ब्याज: ₹' : 'Total Interest: ₹') + resSnowball.totalInterest.toLocaleString('en-IN') + '</div>' +
          '</div>' +
        '</div>' +

        // Debts List
        '<div style="margin-bottom:16px;">' +
          '<div style="font-size:12px;font-weight:700;text-transform:uppercase;color:var(--text-dim);margin-bottom:8px;">' +
            (isHi ? '📋 आपके ऋण विवरण' : '📋 Active Debts Breakdown') +
          '</div>' +
          debts.map(function(d) {
            return '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;margin-bottom:6px;">' +
              '<div style="display:flex;align-items:center;gap:8px;">' +
                '<span style="font-size:18px;">' + (d.icon || '💳') + '</span>' +
                '<div>' +
                  '<strong style="font-size:13px;display:block;">' + d.name + '</strong>' +
                  '<span style="font-size:10.5px;color:#f87171;">' + d.rate + '% APR · Min ₹' + d.minPayment.toLocaleString('en-IN') + '</span>' +
                '</div>' +
              '</div>' +
              '<span style="font-size:14px;font-weight:800;color:#fff;">₹' + d.balance.toLocaleString('en-IN') + '</span>' +
            '</div>';
          }).join('') +
        '</div>' +

        '<button type="button" class="btn primary" onclick="document.getElementById(\'debt-payoff-modal-backdrop\').remove()" style="width:100%;padding:12px;font-weight:700;font-size:13.5px;background:linear-gradient(135deg,#ef4444,#dc2626);border:none;border-radius:14px;cursor:pointer;">' +
          (isHi ? 'समझ गया 👍' : 'Close Strategist 👍') +
        '</button>' +
      '</div>';

    document.body.appendChild(modal);
  }

  // ── Public API ──────────────────────────────────────────────
  window.DebtPayoff = {
    getDebts: getStoredDebts,
    saveDebts: saveDebts,
    calculate: calculateStrategy,
    openModal: openModal
  };

  window.openDebtPayoffModal = openModal;
})();
