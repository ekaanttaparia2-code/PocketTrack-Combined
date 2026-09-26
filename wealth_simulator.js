/* ═══════════════════════════════════════════════════════════════
   WEALTH & SIP SIMULATOR — PocketTrack Combined
   Ported & enhanced from Version B into vanilla JavaScript.
   Interactive compound growth engine with dynamic sliders for
   monthly investment, expected annual return %, and tenure years.
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  function getLang() {
    return (window.currentLang === 'hi' || localStorage.getItem('pockettrack_lang') === 'hi') ? 'hi' : 'en';
  }

  var simState = {
    monthly: 10000,
    rate: 12,
    years: 15
  };

  function calculateCompound(monthly, annualRatePct, years) {
    var p = Number(monthly) || 0;
    var r = (Number(annualRatePct) || 0) / 100 / 12; // monthly rate
    var n = (Number(years) || 1) * 12; // total months

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

  function updateSimulatorUI() {
    var monthlyInput = document.getElementById('sim-monthly-val');
    var rateInput = document.getElementById('sim-rate-val');
    var yearsInput = document.getElementById('sim-years-val');

    if (monthlyInput) simState.monthly = Number(monthlyInput.value);
    if (rateInput) simState.rate = Number(rateInput.value);
    if (yearsInput) simState.years = Number(yearsInput.value);

    var res = calculateCompound(simState.monthly, simState.rate, simState.years);

    var fvEl = document.getElementById('sim-future-val');
    var invEl = document.getElementById('sim-invested-val');
    var gainEl = document.getElementById('sim-gain-val');
    var multEl = document.getElementById('sim-mult-val');
    var barInvested = document.getElementById('sim-bar-invested');
    var barGain = document.getElementById('sim-bar-gain');

    if (fvEl) fvEl.textContent = '₹' + res.futureValue.toLocaleString('en-IN');
    if (invEl) invEl.textContent = '₹' + res.invested.toLocaleString('en-IN');
    if (gainEl) gainEl.textContent = '₹' + res.wealthGained.toLocaleString('en-IN');
    if (multEl) multEl.textContent = res.multiplier + 'x Total Wealth';

    if (barInvested && barGain && res.futureValue > 0) {
      var invPct = Math.round((res.invested / res.futureValue) * 100);
      var gainPct = 100 - invPct;
      barInvested.style.width = invPct + '%';
      barGain.style.width = gainPct + '%';
    }

    // Update label text
    var mLabel = document.getElementById('sim-monthly-disp');
    var rLabel = document.getElementById('sim-rate-disp');
    var yLabel = document.getElementById('sim-years-disp');
    if (mLabel) mLabel.textContent = '₹' + simState.monthly.toLocaleString('en-IN') + '/mo';
    if (rLabel) rLabel.textContent = simState.rate + '% / year';
    if (yLabel) yLabel.textContent = simState.years + ' Years';
  }

  function openModal() {
    var isHi = getLang() === 'hi';
    var res = calculateCompound(simState.monthly, simState.rate, simState.years);

    var existing = document.getElementById('wealth-sim-modal-backdrop');
    if (existing) existing.remove();

    var modal = document.createElement('div');
    modal.id = 'wealth-sim-modal-backdrop';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(7,4,20,0.85);backdrop-filter:blur(20px);z-index:999999;display:flex;align-items:center;justify-content:center;padding:16px;animation:fadeIn 0.2s ease;';

    modal.onclick = function(e) {
      if (e.target === modal) modal.remove();
    };

    modal.innerHTML =
      '<div class="card" style="max-width:500px;width:100%;background:linear-gradient(160deg,#150e30,#0d0722);border:1px solid rgba(52,211,153,0.4);border-radius:28px;padding:26px 22px;box-shadow:0 25px 70px rgba(0,0,0,0.8);max-height:90vh;overflow-y:auto;color:#fff;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">' +
          '<div style="display:flex;align-items:center;gap:8px;">' +
            '<span style="font-size:24px;">📈</span>' +
            '<div>' +
              '<h3 style="margin:0;font-family:\'Space Grotesk\',sans-serif;font-size:20px;color:#fff;">' +
                (isHi ? 'वेल्थ व SIP सिम्युलेटर' : 'Wealth & Compound SIP Simulator') +
              '</h3>' +
              '<span style="font-size:11px;color:var(--text-dim,#a1a1aa);">' +
                (isHi ? 'चक्रवृद्धि ब्याज की जादुई शक्ति' : 'Power of Compounding Growth') +
              '</span>' +
            '</div>' +
          '</div>' +
          '<button onclick="document.getElementById(\'wealth-sim-modal-backdrop\').remove()" style="background:rgba(255,255,255,0.08);border:none;color:#fff;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:16px;">✕</button>' +
        '</div>' +

        // Result Card Hero
        '<div style="background:linear-gradient(145deg,rgba(16,185,129,0.15),rgba(15,23,42,0.8));border:1px solid rgba(16,185,129,0.35);border-radius:20px;padding:18px;margin-bottom:18px;text-align:center;">' +
          '<span style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#34d399;font-weight:700;">' +
            (isHi ? 'अनुमानित कुल संपत्ति' : 'Projected Total Wealth') +
          '</span>' +
          '<div id="sim-future-val" style="font-size:36px;font-weight:900;color:#fff;font-family:\'Space Grotesk\',sans-serif;margin:4px 0;">' +
            '₹' + res.futureValue.toLocaleString('en-IN') +
          '</div>' +
          '<div id="sim-mult-val" style="display:inline-block;background:rgba(16,185,129,0.2);color:#34d399;padding:2px 10px;border-radius:999px;font-size:11px;font-weight:700;">' +
            res.multiplier + 'x Total Wealth' +
          '</div>' +

          // Progress Bar: Invested vs Gain
          '<div style="width:100%;height:10px;background:rgba(255,255,255,0.1);border-radius:5px;overflow:hidden;margin:16px 0 8px;display:flex;">' +
            '<div id="sim-bar-invested" style="width:' + Math.round((res.invested / res.futureValue) * 100) + '%;background:#38bdf8;height:100%;"></div>' +
            '<div id="sim-bar-gain" style="width:' + (100 - Math.round((res.invested / res.futureValue) * 100)) + '%;background:#34d399;height:100%;"></div>' +
          '</div>' +

          '<div style="display:flex;justify-content:space-between;font-size:12px;">' +
            '<span style="color:#38bdf8;">● ' + (isHi ? 'जमा पूंजी: ' : 'Invested: ') + '<b id="sim-invested-val">₹' + res.invested.toLocaleString('en-IN') + '</b></span>' +
            '<span style="color:#34d399;">● ' + (isHi ? 'मुनाफा: ' : 'Wealth Gain: ') + '<b id="sim-gain-val">₹' + res.wealthGained.toLocaleString('en-IN') + '</b></span>' +
          '</div>' +
        '</div>' +

        // Controls Sliders
        '<div style="display:flex;flex-direction:column;gap:14px;margin-bottom:18px;">' +
          // Slider 1: Monthly
          '<div>' +
            '<div style="display:flex;justify-content:space-between;font-size:12px;font-weight:600;margin-bottom:6px;">' +
              '<span>' + (isHi ? 'मासिक निवेश (₹)' : 'Monthly Investment') + '</span>' +
              '<span id="sim-monthly-disp" style="color:#34d399;font-weight:700;">₹' + simState.monthly.toLocaleString('en-IN') + '/mo</span>' +
            '</div>' +
            '<input type="range" id="sim-monthly-val" min="500" max="100000" step="500" value="' + simState.monthly + '" class="ob-range-slider" oninput="window.WealthSimulator.update()">' +
          '</div>' +

          // Slider 2: Rate
          '<div>' +
            '<div style="display:flex;justify-content:space-between;font-size:12px;font-weight:600;margin-bottom:6px;">' +
              '<span>' + (isHi ? 'अपेक्षित वार्षिक रिटर्न (%)' : 'Expected Annual Return (%)') + '</span>' +
              '<span id="sim-rate-disp" style="color:#fbbf24;font-weight:700;">' + simState.rate + '% / year</span>' +
            '</div>' +
            '<input type="range" id="sim-rate-val" min="4" max="25" step="0.5" value="' + simState.rate + '" class="ob-range-slider" oninput="window.WealthSimulator.update()">' +
          '</div>' +

          // Slider 3: Years
          '<div>' +
            '<div style="display:flex;justify-content:space-between;font-size:12px;font-weight:600;margin-bottom:6px;">' +
              '<span>' + (isHi ? 'अवधि (वर्ष)' : 'Time Horizon (Years)') + '</span>' +
              '<span id="sim-years-disp" style="color:#38bdf8;font-weight:700;">' + simState.years + ' Years</span>' +
            '</div>' +
            '<input type="range" id="sim-years-val" min="1" max="35" step="1" value="' + simState.years + '" class="ob-range-slider" oninput="window.WealthSimulator.update()">' +
          '</div>' +
        '</div>' +

        '<button type="button" class="btn primary" onclick="document.getElementById(\'wealth-sim-modal-backdrop\').remove()" style="width:100%;padding:12px;font-weight:700;font-size:13.5px;background:linear-gradient(135deg,#10b981,#059669);border:none;border-radius:14px;cursor:pointer;">' +
          (isHi ? 'पूर्ण हुआ 👍' : 'Close Simulator 👍') +
        '</button>' +
      '</div>';

    document.body.appendChild(modal);
  }

  // ── Public API ──────────────────────────────────────────────
  window.WealthSimulator = {
    calculate: calculateCompound,
    update: updateSimulatorUI,
    openModal: openModal
  };

  window.openWealthSimulatorModal = openModal;
})();
