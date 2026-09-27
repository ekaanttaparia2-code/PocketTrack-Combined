/* ═══════════════════════════════════════════════════════════════
   FIRE & EMERGENCY RUNWAY HORIZON — PocketTrack Combined
   Ported & enhanced from Version B into vanilla JavaScript.
   Calculates emergency runway months, FI targets (Lean, Standard,
   Fat), years to financial freedom, and purchasing power.
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  function getLang() {
    return (window.currentLang === 'hi' || localStorage.getItem('pockettrack_lang') === 'hi') ? 'hi' : 'en';
  }

  function getRunwayData() {
    var entries = [];
    if (typeof window.mainEntries === 'function') entries = window.mainEntries();
    else if (Array.isArray(window.entries)) entries = window.entries;
    if (!Array.isArray(entries)) entries = [];

    // Calculate total liquid balance
    var incomeTotal = entries.filter(function(e) { return e.type === 'income'; }).reduce(function(s, e) { return s + (Number(e.amt || e.amount) || 0); }, 0);
    var expenseTotal = entries.filter(function(e) { return e.type === 'expense'; }).reduce(function(s, e) { return s + (Number(e.amt || e.amount) || 0); }, 0);
    var liquidAssets = Math.max(0, incomeTotal - expenseTotal);

    // Calculate monthly burn (current month or 30-day average)
    var curMonth = new Date().toISOString().slice(0, 7);
    var curMonthExpenses = entries
      .filter(function(e) { return e.type === 'expense' && String(e.date || '').slice(0, 7) === curMonth; })
      .reduce(function(s, e) { return s + (Number(e.amt || e.amount) || 0); }, 0);

    var monthlyBurn = curMonthExpenses > 0 ? curMonthExpenses : 25000;
    var runwayMonths = monthlyBurn > 0 ? Math.round((liquidAssets / monthlyBurn) * 10) / 10 : 999;

    var status = 'critical';
    var labelEn = 'Critical (< 3 Months)';
    var labelHi = 'गंभीर स्थिति (< 3 महीने)';
    var color = '#ef4444';

    if (runwayMonths >= 12) {
      status = 'fortress';
      labelEn = 'Fortress Grade (12+ Months)';
      labelHi = 'अभेद्य सुरक्षा (12+ महीने)';
      color = '#10b981';
    } else if (runwayMonths >= 6) {
      status = 'strong';
      labelEn = 'Strong Runway (6–12 Months)';
      labelHi = 'मजबूत रनवे (6–12 महीने)';
      color = '#38bdf8';
    } else if (runwayMonths >= 3) {
      status = 'fair';
      labelEn = 'Fair (3–6 Months)';
      labelHi = 'संतोषजनक (3–6 महीने)';
      color = '#f59e0b';
    }

    // Annual expenses & FI Numbers (4% rule: 25x annual expenses)
    var annualExpenses = monthlyBurn * 12;
    var standardFi = annualExpenses * 25;
    var leanFi = Math.round(standardFi * 0.75);
    var fatFi = Math.round(standardFi * 1.50);

    var netWorth = liquidAssets;
    var pctToFi = standardFi > 0 ? Math.min(100, Math.round((netWorth / standardFi) * 100)) : 0;

    return {
      liquidAssets: liquidAssets,
      monthlyBurn: monthlyBurn,
      runwayMonths: runwayMonths,
      status: status,
      label: getLang() === 'hi' ? labelHi : labelEn,
      color: color,
      annualExpenses: annualExpenses,
      standardFi: standardFi,
      leanFi: leanFi,
      fatFi: fatFi,
      netWorth: netWorth,
      pctToFi: pctToFi
    };
  }

  function openModal() {
    var isHi = getLang() === 'hi';
    var data = getRunwayData();

    var existing = document.getElementById('fire-runway-modal-backdrop');
    if (existing) existing.remove();

    var modal = document.createElement('div');
    modal.id = 'fire-runway-modal-backdrop';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(7,4,20,0.85);backdrop-filter:blur(20px);z-index:999999;display:flex;align-items:center;justify-content:center;padding:16px;animation:fadeIn 0.2s ease;';

    modal.onclick = function(e) {
      if (e.target === modal) modal.remove();
    };

    modal.innerHTML =
      '<div class="card" style="max-width:520px;width:100%;background:linear-gradient(160deg,#181035,#0e0824);border:1px solid rgba(245,158,11,0.4);border-radius:28px;padding:26px 22px;box-shadow:0 25px 70px rgba(0,0,0,0.8);max-height:90vh;overflow-y:auto;color:#fff;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">' +
          '<div style="display:flex;align-items:center;gap:8px;">' +
            '<span style="font-size:24px;">🔥</span>' +
            '<div>' +
              '<h3 style="margin:0;font-family:\'Space Grotesk\',sans-serif;font-size:20px;color:#fff;">' +
                (isHi ? 'FIRE और इमरजेंसी रनवे' : 'FIRE & Emergency Runway') +
              '</h3>' +
              '<span style="font-size:11px;color:var(--text-dim,#a1a1aa);">' +
                (isHi ? 'वित्तीय स्वतंत्रता (4% नियम) और बचत रनवे' : 'Financial Independence & Survival Horizon') +
              '</span>' +
            '</div>' +
          '</div>' +
          '<button onclick="document.getElementById(\'fire-runway-modal-backdrop\').remove()" style="background:rgba(255,255,255,0.08);border:none;color:#fff;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:16px;">✕</button>' +
        '</div>' +

        // Card 1: Emergency Runway
        '<div style="background:rgba(255,255,255,0.04);border:1px solid ' + data.color + ';border-radius:20px;padding:16px;margin-bottom:14px;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
            '<span style="font-size:12px;font-weight:700;text-transform:uppercase;color:var(--text-dim);">' +
              (isHi ? '🛡️ इमरजेंसी सर्वाइवल रनवे' : '🛡️ Emergency Survival Runway') +
            '</span>' +
            '<span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:8px;background:' + data.color + '22;color:' + data.color + ';border:1px solid ' + data.color + '44;">' +
              data.label +
            '</span>' +
          '</div>' +
          '<div style="display:flex;align-items:baseline;gap:8px;margin-bottom:10px;">' +
            '<span style="font-size:36px;font-weight:900;color:' + data.color + ';font-family:\'Space Grotesk\',sans-serif;">' +
              (data.runwayMonths >= 999 ? '∞' : data.runwayMonths) +
            '</span>' +
            '<span style="font-size:14px;color:var(--text-dim);">' + (isHi ? 'महीने की सुरक्षा' : 'months of expenses covered') + '</span>' +
          '</div>' +
          '<div style="width:100%;height:8px;background:rgba(255,255,255,0.1);border-radius:4px;overflow:hidden;">' +
            '<div style="width:' + Math.min(100, Math.round((data.runwayMonths / 12) * 100)) + '%;background:' + data.color + ';height:100%;border-radius:4px;transition:width 0.4s ease;"></div>' +
          '</div>' +
          '<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-dim);margin-top:6px;">' +
            '<span>' + (isHi ? 'उपलब्ध नकदी: ₹' : 'Liquid Assets: ₹') + data.liquidAssets.toLocaleString('en-IN') + '</span>' +
            '<span>' + (isHi ? 'मासिक खर्च: ₹' : 'Monthly Burn: ₹') + data.monthlyBurn.toLocaleString('en-IN') + '/mo</span>' +
          '</div>' +
        '</div>' +

        // Card 2: FIRE Targets Grid
        '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:16px;margin-bottom:14px;">' +
          '<div style="font-size:12px;font-weight:700;text-transform:uppercase;color:#fbbf24;margin-bottom:12px;">' +
            (isHi ? '🎯 आपके FIRE लक्ष्य (4% वार्षिक निकासी नियम)' : '🎯 Your FI Numbers (4% Safe Withdrawal Rule)') +
          '</div>' +
          '<div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:8px;text-align:center;">' +
            '<div style="background:rgba(255,255,255,0.04);border-radius:14px;padding:10px 6px;">' +
              '<span style="display:block;font-size:11px;color:var(--text-dim);font-weight:600;">Lean FI (18x)</span>' +
              '<strong style="display:block;font-size:14px;color:#38bdf8;margin-top:4px;">₹' + Math.round(data.leanFi / 100000) + 'L</strong>' +
              '<span style="font-size:9.5px;color:var(--text-dim);">' + (isHi ? 'बुनियादी ज़रूरतें' : 'Essentials only') + '</span>' +
            '</div>' +
            '<div style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:14px;padding:10px 6px;">' +
              '<span style="display:block;font-size:11px;color:#fbbf24;font-weight:700;">Standard (25x)</span>' +
              '<strong style="display:block;font-size:14px;color:#fff;margin-top:4px;">₹' + Math.round(data.standardFi / 100000) + 'L</strong>' +
              '<span style="font-size:9.5px;color:#fbbf24;">' + (isHi ? 'पूर्ण आज़ादी' : 'True Freedom') + '</span>' +
            '</div>' +
            '<div style="background:rgba(255,255,255,0.04);border-radius:14px;padding:10px 6px;">' +
              '<span style="display:block;font-size:11px;color:var(--text-dim);font-weight:600;">Fat FI (35x)</span>' +
              '<strong style="display:block;font-size:14px;color:#ec4899;margin-top:4px;">₹' + Math.round(data.fatFi / 100000) + 'L</strong>' +
              '<span style="font-size:9.5px;color:var(--text-dim);">' + (isHi ? 'आलीशान जीवन' : 'Luxury Life') + '</span>' +
            '</div>' +
          '</div>' +
          '<div style="margin-top:14px;">' +
            '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;">' +
              '<span style="color:var(--text-dim);">' + (isHi ? 'Standard FI तक प्रगति:' : 'Progress to Standard FI:') + '</span>' +
              '<strong style="color:#fbbf24;">' + data.pctToFi + '%</strong>' +
            '</div>' +
            '<div style="width:100%;height:8px;background:rgba(255,255,255,0.1);border-radius:4px;overflow:hidden;">' +
              '<div style="width:' + data.pctToFi + '%;background:linear-gradient(90deg,#fbbf24,#f59e0b);height:100%;border-radius:4px;"></div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<p style="font-size:10.5px;color:var(--text-dim);text-align:center;margin:0 0 12px;line-height:1.4;">⚖️ <i>' +
          (isHi ? 'यह केवल एक गणितीय सिमुलेशन है, निवेश सलाह नहीं।' : 'Educational simulation based on the 4% rule. Not certified financial advice.') +
        '</i></p>' +

        '<button type="button" class="btn primary" onclick="document.getElementById(\'fire-runway-modal-backdrop\').remove()" style="width:100%;padding:12px;font-weight:700;font-size:13.5px;background:linear-gradient(135deg,#f59e0b,#d97706);border:none;border-radius:14px;cursor:pointer;">' +
          (isHi ? 'समझ गया 👍' : 'Got It 👍') +
        '</button>' +
      '</div>';

    document.body.appendChild(modal);
  }

  // ── Public API ──────────────────────────────────────────────
  window.FireRunway = {
    getData: getRunwayData,
    openModal: openModal
  };

  window.openFireRunwayModal = openModal;
})();
