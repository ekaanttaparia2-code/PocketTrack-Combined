/* ═══════════════════════════════════════════════════════════════
   ENHANCED INTERACTIVE ONBOARDING FLOW — PocketTrack Combined
   Ported & enhanced from Version B into vanilla JavaScript.
   Features real-time Finny Mascot reactions, stress slider,
   money leak triggers, 50/30/20 blueprint calibration.
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  var ONBOARDING_FLAG = 'pockettrack_onboarded_v2';
  var PROFILE_KEY = 'pockettrack_finny_profile';

  var state = {
    step: 0,
    totalSteps: 7, // 0: Welcome, 1: Stress, 2: Triggers, 3: Goals & Income, 4: Calibrating, 5: Blueprint, 6: Launch
    stressLevel: 3, // 1 to 5
    selectedTriggers: ['food_delivery', 'online_shopping', 'subscriptions'],
    primaryGoal: 'emergency_fund',
    monthlyIncome: 40000,
    userName: '',
    startingBalance: 5000,
    walletType: 'bank',
    calcProgress: 0
  };

  // Triggers data
  var triggersList = [
    { id: 'food_delivery', icon: '🍔', en: 'Food Delivery (Swiggy/Zomato)', hi: 'खाना डिलीवरी (Swiggy/Zomato)' },
    { id: 'online_shopping', icon: '🛍️', en: 'Online Shopping (Amazon/Myntra)', hi: 'ऑनलाइन शॉपिंग (Amazon/Myntra)' },
    { id: 'subscriptions', icon: '📺', en: 'Unused Subscriptions (OTT/Gym)', hi: 'अनावश्यक सब्सक्रिप्शन' },
    { id: 'chai_coffee', icon: '☕', en: 'Daily Chai & Coffee Outings', hi: 'दैनिक चाय व कैफे' },
    { id: 'weekend_party', icon: '🍻', en: 'Weekend Outings & Parties', hi: 'वीकेंड पार्टी और क्लब' },
    { id: 'late_night', icon: '🌙', en: 'Late Night Impulse Purchases', hi: 'देर रात अचानक खरीदारी' }
  ];

  var goalsList = [
    { id: 'emergency_fund', icon: '🛡️', en: 'Build Emergency Fund', hi: 'आपातकालीन फंड बनाएं' },
    { id: 'stop_overspending', icon: '🛑', en: 'Stop Overspending', hi: 'अनावश्यक खर्च रोकें' },
    { id: 'debt_free', icon: '💳', en: 'Clear Loans & Credit Cards', hi: 'कर्ज व क्रेडिट कार्ड चुकाएं' },
    { id: 'wealth_fire', icon: '🚀', en: 'Build Long-Term Wealth (FIRE)', hi: 'दीर्घकालिक संपत्ति (FIRE)' }
  ];

  var incomePresets = [
    { label: '₹300 (Student)', val: 300 },
    { label: '₹15,000', val: 15000 },
    { label: '₹40,000', val: 40000 },
    { label: '₹80,000', val: 80000 },
    { label: '₹1,50,000', val: 150000 }
  ];

  function getExistingAccountData() {
    var entries = [];
    if (typeof window.mainEntries === 'function') {
      try { entries = window.mainEntries(); } catch(e) {}
    } else if (Array.isArray(window.entries)) {
      entries = window.entries;
    }
    
    // Also check cached entries
    if (!entries || !entries.length) {
      try {
        var raw = localStorage.getItem('pockettrack_entries_cache') || (window.currentUser && localStorage.getItem('pockettrack_entries_cache_' + window.currentUser.uid));
        if (raw) {
          var p = JSON.parse(raw);
          if (Array.isArray(p) && p.length) entries = p;
        }
      } catch(e) {}
    }

    var balances = { cash: 0, bank: 0, card: 0 };
    if (typeof window.computeWalletBalances === 'function') {
      try {
        var b = window.computeWalletBalances();
        if (b && typeof b === 'object') balances = b;
      } catch(e) {}
    }

    var totalBal = 0;
    var hasNonZero = false;
    Object.keys(balances).forEach(function(k) {
      var val = Number(balances[k]) || 0;
      totalBal += val;
      if (val !== 0) hasNonZero = true;
    });

    var isExisting = (entries && entries.length > 0) || hasNonZero;
    return {
      isExisting: isExisting,
      entriesCount: entries ? entries.length : 0,
      totalBalance: totalBal,
      balances: balances
    };
  }

  function getLang() {
    return (window.currentLang === 'hi' || localStorage.getItem('pockettrack_lang') === 'hi') ? 'hi' : 'en';
  }

  function getFinnySVG(pose, emotion, size) {
    if (window.FinnyMascot && window.FinnyMascot.getSVG) {
      return window.FinnyMascot.getSVG({ pose: pose, emotion: emotion, size: size || 90 });
    }
    return '<div style="font-size:48px;">🐸</div>';
  }

  // ── Render Current Slide ────────────────────────────────────
  function renderSlide() {
    var lang = getLang();
    var isHi = lang === 'hi';
    var screen = document.getElementById('onboarding-screen');
    if (!screen) return;

    // Progress percentage
    var progressPct = Math.round(((state.step + 1) / state.totalSteps) * 100);

    var html = '';

    // Header bar
    html += '<div class="ob-header-bar">' +
      '<span class="ob-step-tag">' + (isHi ? 'चरण ' + (state.step + 1) + ' / ' + state.totalSteps : 'Step ' + (state.step + 1) + ' of ' + state.totalSteps) + '</span>' +
      (state.step < state.totalSteps - 1 ? '<button class="ob-skip-btn" onclick="window.finishOnboarding()">' + (isHi ? 'छोड़ें' : 'Skip') + '</button>' : '') +
    '</div>';

    // Progress bar
    html += '<div class="ob-progress-track">' +
      '<div class="ob-progress-fill" style="width:' + progressPct + '%;"></div>' +
    '</div>';

    html += '<div class="ob-content-card" id="ob-inner-content">';

    // ── STEP 0: Welcome & Language ────────────────────────────
    if (state.step === 0) {
      var svg = getFinnySVG('greeting', 'enjoying', 110);
      html += '<div style="margin-bottom:12px;">' + svg + '</div>' +
        '<h2 style="font-size:24px;font-weight:800;color:#fff;margin:0 0 6px;font-family:\'Space Grotesk\',sans-serif;">' +
          (isHi ? 'नमस्ते! मैं हूँ Finny 👋' : 'Meet Finny, Your Money Guide 👋') +
        '</h2>' +
        '<p style="font-size:13.5px;color:var(--text-dim,#94a3b8);line-height:1.5;max-width:340px;margin:0 auto 20px;">' +
          (isHi
            ? 'आपका 100% प्राइवेट, ऑफलाइन और स्मार्ट वित्तीय साथी। आइए 2 मिनट में आपका पर्सनल बजट तैयार करें।'
            : 'Your 100% private, offline-first financial companion. Let\'s set up your personalized budget plan in 2 minutes.') +
        '</p>' +
        '<div style="display:flex;gap:10px;justify-content:center;margin-bottom:24px;">' +
          '<button class="ob-lang-btn ' + (!isHi ? 'active' : '') + '" onclick="window.setObLang(\'en\')">🇬🇧 English</button>' +
          '<button class="ob-lang-btn ' + (isHi ? 'active' : '') + '" onclick="window.setObLang(\'hi\')">🇮🇳 हिन्दी</button>' +
        '</div>' +
        '<div class="ob-pill-row" style="margin-bottom:20px;">' +
          '<span class="ob-pill green">● 100% Offline &amp; Private</span>' +
          '<span class="ob-pill purple">⚡ 50/30/20 Envelopes</span>' +
        '</div>';
    }

    // ── STEP 1: Financial Stress Slider ───────────────────────
    else if (state.step === 1) {
      var stressConfig = [
        { pose: 'celebrating', emotion: 'enjoying', labelEn: '1/5: Totally Zen & In Control', labelHi: '1/5: बिल्कुल तनावमुक्त और सुरक्षित' },
        { pose: 'greeting', emotion: 'smile', labelEn: '2/5: Doing Fine, Need Optimization', labelHi: '2/5: सब ठीक, थोड़ी बचत बेहतर करनी है' },
        { pose: 'notetaking', emotion: 'neutral', labelEn: '3/5: Money Slipping Away by Month-End', labelHi: '3/5: महीने के अंत में पैसे कम पड़ते हैं' },
        { pose: 'thinking', emotion: 'sad', labelEn: '4/5: Constantly Worried About Bills', labelHi: '4/5: बिल और खर्चों की लगातार चिंता' },
        { pose: 'thinking', emotion: 'very_sad', labelEn: '5/5: Overwhelmed by Money Stress', labelHi: '5/5: अत्यधिक वित्तीय तनाव' }
      ];
      var curStress = stressConfig[state.stressLevel - 1] || stressConfig[2];
      var stressSVG = getFinnySVG(curStress.pose, curStress.emotion, 100);

      html += '<div id="ob-stress-svg-wrap" style="margin-bottom:10px;">' + stressSVG + '</div>' +
        '<h2 style="font-size:20px;font-weight:700;color:#fff;margin:0 0 6px;">' +
          (isHi ? 'अपने पैसे को लेकर कितना तनाव है?' : 'How stressed do you feel about money?') +
        '</h2>' +
        '<p id="ob-stress-label" style="font-size:13px;color:#34d399;font-weight:600;margin:0 0 16px;">' +
          (isHi ? curStress.labelHi : curStress.labelEn) +
        '</p>' +
        '<div style="width:100%;max-width:320px;margin:0 auto 20px;">' +
          '<input type="range" min="1" max="5" step="1" value="' + state.stressLevel + '" class="ob-range-slider" id="ob-stress-slider" oninput="window.updateObStress(this.value)">' +
          '<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-dim);margin-top:6px;">' +
            '<span>😌 ' + (isHi ? 'शांत' : 'Zen') + '</span>' +
            '<span>😰 ' + (isHi ? 'अधिक तनाव' : 'High Stress') + '</span>' +
          '</div>' +
        '</div>';
    }

    // ── STEP 2: Spending Leak Triggers ────────────────────────
    else if (state.step === 2) {
      var trigSVG = getFinnySVG('notetaking', 'smile', 80);
      html += '<div style="margin-bottom:8px;">' + trigSVG + '</div>' +
        '<h2 style="font-size:20px;font-weight:700;color:#fff;margin:0 0 4px;">' +
          (isHi ? 'पैसे कहाँ अनजाने में खर्च होते हैं?' : 'Where does your money secretly leak?') +
        '</h2>' +
        '<p style="font-size:12px;color:var(--text-dim);margin:0 0 14px;">' +
          (isHi ? 'Finny इन पर ऑटोमैटिक अलर्ट और लिमिट सेट करेगा (कई चुन सकते हैं):' : 'Finny will tailor limits to plug these leaks (select all that apply):') +
        '</p>' +
        '<div class="ob-triggers-grid">';

      triggersList.forEach(function(trig) {
        var isSelected = state.selectedTriggers.indexOf(trig.id) !== -1;
        html += '<button type="button" class="ob-trigger-chip ' + (isSelected ? 'selected' : '') + '" onclick="window.toggleObTrigger(\'' + trig.id + '\')">' +
          '<span style="font-size:18px;">' + trig.icon + '</span>' +
          '<span>' + (isHi ? trig.hi : trig.en) + '</span>' +
        '</button>';
      });

      html += '</div>';
    }

    // ── STEP 3: Goals & Monthly Income ────────────────────────
    else if (state.step === 3) {
      var calcSVG = getFinnySVG('calculating', 'smile', 80);
      html += '<div style="margin-bottom:8px;">' + calcSVG + '</div>' +
        '<h2 style="font-size:19px;font-weight:700;color:#fff;margin:0 0 4px;">' +
          (isHi ? 'आपकी मासिक आय और लक्ष्य' : 'Monthly Income & Primary Goal') +
        '</h2>' +
        '<p style="font-size:12px;color:var(--text-dim);margin:0 0 12px;">' +
          (isHi ? '50/30/20 लिफाफे और Safe-to-Spend की सटीक गणना के लिए:' : 'For precise 50/30/20 envelopes and daily Safe-to-Spend limits:') +
        '</p>' +
        // Income input
        '<div style="margin-bottom:14px;width:100%;max-width:320px;">' +
          '<label style="display:block;font-size:11px;font-weight:700;color:var(--text-dim);text-transform:uppercase;margin-bottom:4px;text-align:left;">' +
            (isHi ? 'मासिक आय / पॉकेट मनी (₹)' : 'Monthly Income / Pocket Allowance (₹)') +
          '</label>' +
          '<div style="position:relative;">' +
            '<span style="position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:16px;color:#34d399;font-weight:700;">₹</span>' +
            '<input type="number" id="ob-income-input" class="ob-text-input" style="padding-left:32px;" value="' + state.monthlyIncome + '" oninput="window.setObIncome(this.value)">' +
          '</div>' +
          // Presets
          '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;">';

      incomePresets.forEach(function(p) {
        var active = state.monthlyIncome === p.val;
        html += '<button type="button" class="ob-preset-chip ' + (active ? 'active' : '') + '" onclick="window.selectObIncomePreset(' + p.val + ')">' + p.label + '</button>';
      });

      html += '</div></div>' +
        // Goal selection
        '<div style="width:100%;max-width:320px;">' +
          '<label style="display:block;font-size:11px;font-weight:700;color:var(--text-dim);text-transform:uppercase;margin-bottom:6px;text-align:left;">' +
            (isHi ? 'प्राथमिक वित्तीय लक्ष्य' : 'Top Financial Goal') +
          '</label>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">';

      goalsList.forEach(function(g) {
        var isGoalSelected = state.primaryGoal === g.id;
        html += '<button type="button" class="ob-goal-btn ' + (isGoalSelected ? 'selected' : '') + '" onclick="window.setObGoal(\'' + g.id + '\')">' +
          '<span style="font-size:16px;">' + g.icon + '</span>' +
          '<span style="font-size:11px;font-weight:600;">' + (isHi ? g.hi : g.en) + '</span>' +
        '</button>';
      });

      html += '</div></div>';
    }

    // ── STEP 4: Live Calibration Animation ────────────────────
    else if (state.step === 4) {
      var crunchSVG = getFinnySVG('calculating', 'enjoying', 100);
      html += '<div style="margin-bottom:14px;">' + crunchSVG + '</div>' +
        '<h2 style="font-size:20px;font-weight:800;color:#fff;margin:0 0 6px;">' +
          (isHi ? 'Finny हिसाब लगा रहा है...' : 'Finny is Calibrating Your Plan...') +
        '</h2>' +
        '<div style="margin:20px auto;width:80px;height:80px;position:relative;">' +
          '<svg viewBox="0 0 36 36" style="width:100%;height:100%;transform:rotate(-90deg);">' +
            '<path stroke="rgba(255,255,255,0.1)" stroke-width="3.5" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>' +
            '<path stroke="#34d399" stroke-dasharray="' + state.calcProgress + ', 100" stroke-width="3.5" stroke-linecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>' +
          '</svg>' +
          '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;color:#fff;">' +
            state.calcProgress + '%' +
          '</div>' +
        '</div>' +
        '<div style="font-size:12.5px;color:var(--text-dim);line-height:1.8;max-width:280px;margin:0 auto;text-align:left;">' +
          '<div>' + (state.calcProgress >= 25 ? '✅' : '⏳') + ' ' + (isHi ? '50/30/20 बजट लिफाफे बनाए' : 'Structuring 50/30/20 Envelopes') + '</div>' +
          '<div>' + (state.calcProgress >= 50 ? '✅' : '⏳') + ' ' + (isHi ? 'दैनिक Safe-to-Spend सीमा तय की' : 'Setting Daily Safe-to-Spend Radar') + '</div>' +
          '<div>' + (state.calcProgress >= 75 ? '✅' : '⏳') + ' ' + (isHi ? state.selectedTriggers.length + ' लीक्स के लिए नियम तैयार' : 'Configuring rules for ' + state.selectedTriggers.length + ' triggers') + '</div>' +
          '<div>' + (state.calcProgress >= 100 ? '✅' : '⏳') + ' ' + (isHi ? 'ऑफलाइन डेटा वॉल्ट सक्रिय' : 'Encrypting local offline vault') + '</div>' +
        '</div>';
    }

    // ── STEP 5: Custom Blueprint Reveal ───────────────────────
    else if (state.step === 5) {
      var crownSVG = getFinnySVG('celebrating', 'enjoying', 95);
      var income = Math.max(Number(state.monthlyIncome) || 0, 0);
      var needs = Math.round(income * 0.5);
      var wants = Math.round(income * 0.3);
      var savings = Math.round(income * 0.2);
      var estSaved = Math.round(income * 0.18);

      html += '<div style="margin-bottom:8px;">' + crownSVG + '</div>' +
        '<h2 style="font-size:20px;font-weight:800;color:#fff;margin:0 0 4px;">' +
          (isHi ? 'आपका व्यक्तिगत वित्तीय ब्लूप्रिंट' : 'Your Personalized Blueprint') +
        '</h2>' +
        '<div class="ob-saved-badge" style="margin-bottom:14px;">' +
          '⚡ ' + (isHi ? 'अनुमानित बचत क्षमता: ₹' + estSaved.toLocaleString('en-IN') + '/माह' : 'Estimated Rescue Potential: ₹' + estSaved.toLocaleString('en-IN') + '/mo') +
        '</div>' +
        // 50/30/20 Envelopes Card
        '<div class="ob-blueprint-card">' +
          '<div class="ob-env-row">' +
            '<div style="display:flex;align-items:center;gap:6px;">' +
              '<span style="font-size:16px;">🏠</span>' +
              '<span style="font-size:12px;font-weight:700;color:#38bdf8;">' + (isHi ? 'ज़रूरतें (50%)' : 'Needs (50%)') + '</span>' +
            '</div>' +
            '<span style="font-size:13px;font-weight:700;color:#fff;">₹' + needs.toLocaleString('en-IN') + '</span>' +
          '</div>' +
          '<div class="ob-env-bar"><div style="width:50%;background:#38bdf8;height:100%;border-radius:3px;"></div></div>' +

          '<div class="ob-env-row" style="margin-top:10px;">' +
            '<div style="display:flex;align-items:center;gap:6px;">' +
              '<span style="font-size:16px;">🍿</span>' +
              '<span style="font-size:12px;font-weight:700;color:#fbbf24;">' + (isHi ? 'शौक व इच्छाएं (30%)' : 'Wants (30%)') + '</span>' +
            '</div>' +
            '<span style="font-size:13px;font-weight:700;color:#fff;">₹' + wants.toLocaleString('en-IN') + '</span>' +
          '</div>' +
          '<div class="ob-env-bar"><div style="width:30%;background:#fbbf24;height:100%;border-radius:3px;"></div></div>' +

          '<div class="ob-env-row" style="margin-top:10px;">' +
            '<div style="display:flex;align-items:center;gap:6px;">' +
              '<span style="font-size:16px;">📈</span>' +
              '<span style="font-size:12px;font-weight:700;color:#34d399;">' + (isHi ? 'बचत व निवेश (20%)' : 'Savings & SIP (20%)') + '</span>' +
            '</div>' +
            '<span style="font-size:13px;font-weight:700;color:#fff;">₹' + savings.toLocaleString('en-IN') + '</span>' +
          '</div>' +
          '<div class="ob-env-bar"><div style="width:20%;background:#34d399;height:100%;border-radius:3px;"></div></div>' +
        '</div>';
    }

    // ── STEP 6: Final Account Launch ──────────────────────────
    else if (state.step === 6) {
      var acct = getExistingAccountData();
      if (acct.isExisting) {
        // Returning user with existing transactions / wallets!
        var finnyWelcomeSVG = getFinnySVG('celebrating', 'enjoying', 92);
        var bBal = Math.round(acct.balances.bank || 0);
        var cBal = Math.round(acct.balances.cash || 0);
        var cardBal = Math.round(acct.balances.card || 0);

        html += '<div style="margin-bottom:8px;">' + finnyWelcomeSVG + '</div>' +
          '<h2 style="font-size:20px;font-weight:800;color:#fff;margin:0 0 4px;">' +
            (isHi ? 'क्या यह आपका वर्तमान बैलेंस है?' : 'Is this your current balance?') +
          '</h2>' +
          '<p style="font-size:12.5px;color:var(--text-dim);margin:0 0 14px;max-width:320px;margin-left:auto;margin-right:auto;">' +
            (isHi
              ? 'हमें आपके पिछले खाते का डेटा और ' + acct.entriesCount + ' लेन-देन मिले हैं। क्या यह बैलेंस सही है?'
              : 'We found your existing account with ' + acct.entriesCount + ' transactions. Please confirm your balance:') +
          '</p>' +
          // Existing Balance Card
          '<div style="background:rgba(15,23,42,0.85);border:1px solid rgba(52,211,153,0.35);border-radius:18px;padding:16px;max-width:320px;margin:0 auto 16px;text-align:center;box-shadow:0 8px 24px rgba(0,0,0,0.3);">' +
            '<div style="font-size:11px;font-weight:700;color:var(--text-dim);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">' +
              (isHi ? 'कुल उपलब्ध बैलेंस' : 'Current Tracked Balance') +
            '</div>' +
            '<div style="font-size:30px;font-weight:900;color:#34d399;font-family:\'Space Grotesk\',sans-serif;margin-bottom:14px;">' +
              '₹' + Math.round(acct.totalBalance).toLocaleString('en-IN') +
            '</div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;text-align:left;">' +
              '<div style="background:rgba(255,255,255,0.06);padding:8px 10px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);">' +
                '<div style="font-size:10.5px;color:var(--text-dim);display:flex;align-items:center;gap:4px;">📱 Bank / UPI</div>' +
                '<div style="font-size:13.5px;font-weight:700;color:#60a5fa;margin-top:2px;">₹' + bBal.toLocaleString('en-IN') + '</div>' +
              '</div>' +
              '<div style="background:rgba(255,255,255,0.06);padding:8px 10px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);">' +
                '<div style="font-size:10.5px;color:var(--text-dim);display:flex;align-items:center;gap:4px;">💵 Cash</div>' +
                '<div style="font-size:13.5px;font-weight:700;color:#34d399;margin-top:2px;">₹' + cBal.toLocaleString('en-IN') + '</div>' +
              '</div>' +
            '</div>' +
            (cardBal !== 0 ? '<div style="margin-top:8px;font-size:11px;color:#f43f5e;text-align:left;">💳 Credit Card: ₹' + Math.abs(cardBal).toLocaleString('en-IN') + '</div>' : '') +
          '</div>' +
          '<div style="font-size:11.5px;color:#94a3b8;line-height:1.4;max-width:300px;margin:0 auto 10px;">' +
            '🔒 ' + (isHi ? 'आपका लेन-देन इतिहास सुरक्षित है और Finny से जुड़ गया है।' : 'Your previous entries & wallet balances are preserved.') +
          '</div>';
      } else {
        // Brand new user flow
        var finnyReadySVG = getFinnySVG('greeting', 'enjoying', 90);
        html += '<div style="margin-bottom:8px;">' + finnyReadySVG + '</div>' +
          '<h2 style="font-size:20px;font-weight:800;color:#fff;margin:0 0 4px;">' +
            (isHi ? 'सब तैयार है! शुरू करें' : 'You\'re All Set to Win!') +
          '</h2>' +
          '<p style="font-size:12.5px;color:var(--text-dim);margin:0 0 16px;">' +
            (isHi ? 'शुरुआती बैलेंस दर्ज करें (बाद में भी बदल सकते हैं):' : 'Optionally set your starting balance:') +
          '</p>' +
          '<div style="width:100%;max-width:320px;margin:0 auto 16px;">' +
            '<label style="display:block;font-size:11px;font-weight:700;color:var(--text-dim);text-transform:uppercase;margin-bottom:4px;text-align:left;">' +
              (isHi ? 'शुरुआती वॉलेट बैलेंस (₹)' : 'Starting Balance (₹)') +
            '</label>' +
            '<input type="number" id="ob-start-bal" class="ob-text-input" value="' + state.startingBalance + '" oninput="window.setObStartBal(this.value)">' +
          '</div>' +
          '<div style="width:100%;max-width:320px;margin:0 auto 20px;">' +
            '<label style="display:block;font-size:11px;font-weight:700;color:var(--text-dim);text-transform:uppercase;margin-bottom:4px;text-align:left;">' +
              (isHi ? 'प्राथमिक वॉलेट' : 'Primary Account') +
            '</label>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +
              '<button type="button" class="ob-goal-btn ' + (state.walletType === 'bank' ? 'selected' : '') + '" onclick="window.setObWallet(\'bank\')">📱 Bank / UPI</button>' +
              '<button type="button" class="ob-goal-btn ' + (state.walletType === 'cash' ? 'selected' : '') + '" onclick="window.setObWallet(\'cash\')">💵 Cash Vault</button>' +
            '</div>' +
          '</div>';
      }
    }

    html += '</div>'; // End ob-content-card

    // Footer navigation
    var nextText = isHi ? 'आगे बढ़ें →' : 'Continue →';
    if (state.step === 0) nextText = isHi ? 'शुरू करें 🚀' : 'Get Started 🚀';
    else if (state.step === 5) nextText = isHi ? 'योजना स्वीकारें →' : 'Accept Blueprint →';
    else if (state.step === 6) {
      var acctCheck = getExistingAccountData();
      if (acctCheck.isExisting) {
        nextText = isHi ? 'हाँ, यह सही है 🚀' : 'Confirm & Continue 🚀';
      } else {
        nextText = isHi ? 'डैशबोर्ड खोलें 🚀' : 'Launch PocketTrack 🚀';
      }
    }

    // Don't show footer on calibrating slide (step 4 auto advances)
    if (state.step !== 4) {
      html += '<div class="ob-footer-controls">' +
        (state.step > 0 ? '<button class="ob-btn-back" onclick="window.prevObSlide()">' + (isHi ? '← पीछे' : '← Back') + '</button>' : '<div></div>') +
        '<button class="ob-btn-next" onclick="window.nextObSlide()">' + nextText + '</button>' +
      '</div>';
    }

    screen.innerHTML = html;
  }

  // ── Handlers & Navigation ───────────────────────────────────
  window.updateObStress = function(val) {
    state.stressLevel = parseInt(val, 10) || 3;
    var stressConfig = [
      { pose: 'celebrating', emotion: 'enjoying', labelEn: '1/5: Totally Zen & In Control', labelHi: '1/5: बिल्कुल तनावमुक्त और सुरक्षित' },
      { pose: 'greeting', emotion: 'smile', labelEn: '2/5: Doing Fine, Need Optimization', labelHi: '2/5: सब ठीक, थोड़ी बचत बेहतर करनी है' },
      { pose: 'notetaking', emotion: 'neutral', labelEn: '3/5: Money Slipping Away by Month-End', labelHi: '3/5: महीने के अंत में पैसे कम पड़ते हैं' },
      { pose: 'thinking', emotion: 'sad', labelEn: '4/5: Constantly Worried About Bills', labelHi: '4/5: बिल और खर्चों की लगातार चिंता' },
      { pose: 'thinking', emotion: 'very_sad', labelEn: '5/5: Overwhelmed by Money Stress', labelHi: '5/5: अत्यधिक वित्तीय तनाव' }
    ];
    var cur = stressConfig[state.stressLevel - 1] || stressConfig[2];
    var wrap = document.getElementById('ob-stress-svg-wrap');
    var lbl = document.getElementById('ob-stress-label');
    if (wrap && lbl) {
      wrap.innerHTML = getFinnySVG(cur.pose, cur.emotion, 100);
      lbl.textContent = (getLang() === 'hi') ? cur.labelHi : cur.labelEn;
    } else {
      renderSlide();
    }
  };

  window.toggleObTrigger = function(trigId) {
    var idx = state.selectedTriggers.indexOf(trigId);
    if (idx === -1) {
      state.selectedTriggers.push(trigId);
    } else {
      state.selectedTriggers.splice(idx, 1);
    }
    renderSlide();
  };

  window.setObIncome = function(val) {
    state.monthlyIncome = Math.max(0, parseInt(val, 10) || 0);
    var chips = document.querySelectorAll('.ob-preset-chip');
    if (chips && chips.length) {
      chips.forEach(function(chip, idx) {
        var p = incomePresets[idx];
        if (p) {
          if (p.val === state.monthlyIncome) chip.classList.add('active');
          else chip.classList.remove('active');
        }
      });
    }
  };

  window.selectObIncomePreset = function(val) {
    state.monthlyIncome = val;
    var input = document.getElementById('ob-income-input');
    if (input) input.value = val;
    window.setObIncome(val);
  };

  window.setObGoal = function(goalId) {
    state.primaryGoal = goalId;
    renderSlide();
  };

  window.setObStartBal = function(val) {
    state.startingBalance = parseInt(val, 10) || 0;
  };

  window.setObWallet = function(wType) {
    state.walletType = wType;
    renderSlide();
  };

  window.setObLang = function(lang) {
    if (typeof window.setLang === 'function') {
      window.setLang(lang);
    } else {
      window.currentLang = lang;
      try { localStorage.setItem('pockettrack_lang', lang); } catch(e) {}
    }
    renderSlide();
  };

  window.nextObSlide = function() {
    if (state.step < state.totalSteps - 1) {
      state.step++;

      // If entering Step 4 (calibrating), trigger progress animation
      if (state.step === 4) {
        state.calcProgress = 0;
        renderSlide();
        var timer = setInterval(function() {
          state.calcProgress += 5;
          if (state.calcProgress >= 100) {
            state.calcProgress = 100;
            clearInterval(timer);
            renderSlide();
            setTimeout(function() {
              state.step = 5;
              renderSlide();
            }, 500);
          } else {
            renderSlide();
          }
        }, 40);
        return;
      }

      renderSlide();
    } else {
      window.finishOnboarding();
    }
  };

  window.prevObSlide = function() {
    if (state.step > 0) {
      if (state.step === 5) state.step = 3; // skip back over calibration
      else state.step--;
      renderSlide();
    }
  };

  window.finishOnboarding = function() {
    var acct = getExistingAccountData();
    try {
      localStorage.setItem(ONBOARDING_FLAG, 'true');
      localStorage.setItem('pockettrack_onboarded', 'true');
      localStorage.setItem(PROFILE_KEY, JSON.stringify({
        stressLevel: state.stressLevel,
        selectedTriggers: state.selectedTriggers,
        primaryGoal: state.primaryGoal,
        monthlyIncome: state.monthlyIncome,
        startingBalance: acct.isExisting ? acct.totalBalance : state.startingBalance,
        walletType: state.walletType,
        isExistingAccount: acct.isExisting,
        completedAt: new Date().toISOString()
      }));
      localStorage.setItem('pockettrack_monthly_income', String(state.monthlyIncome));

      // For brand new accounts: assign starting balance to chosen wallet cleanly
      if (!acct.isExisting && state.startingBalance > 0) {
        if (typeof window.userWallets !== 'undefined' && Array.isArray(window.userWallets)) {
          var targetWallet = window.userWallets.find(function(w) { return w.id === state.walletType; });
          if (targetWallet) {
            targetWallet.initialBalance = Number(state.startingBalance) || 0;
            if (typeof window.saveWallets === 'function') window.saveWallets();
            if (typeof window.renderWallets === 'function') window.renderWallets();
            if (typeof window.renderWalletSwitcher === 'function') window.renderWalletSwitcher();
          }
        }
      }

      // Refresh Envelopes & Daily Burn Meter & Finny if loaded
      if (window.Envelopes && window.Envelopes.render) {
        window.Envelopes.render();
      }
      if (window.renderDailyBurnMeter) {
        window.renderDailyBurnMeter();
      }
      if (window.FinnyMascot && window.FinnyMascot.render) {
        window.FinnyMascot.render();
      }
      if (typeof window.updateHeaderStats === 'function') {
        window.updateHeaderStats();
      }
    } catch(e) {}

    var screen = document.getElementById('onboarding-screen');
    if (screen) {
      screen.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      screen.style.opacity = '0';
      screen.style.transform = 'scale(0.96)';
      setTimeout(function() {
        screen.style.display = 'none';
        screen.innerHTML = ''; // Wipe DOM so hidden SVG defs never shadow live dashboard Finny
        if (typeof window.openAgeModeModal === 'function') {
          window.openAgeModeModal();
        }
      }, 300);
    }
  };

  window.restartOnboarding = function() {
    state.step = 0;
    var screen = document.getElementById('onboarding-screen');
    if (screen) {
      screen.style.display = 'flex';
      screen.style.opacity = '1';
      screen.style.transform = 'scale(1)';
      renderSlide();
    }
  };

  // ── CSS Injection ───────────────────────────────────────────
  function injectOnboardingStyles() {
    if (document.getElementById('ob-v2-styles')) return;
    var s = document.createElement('style');
    s.id = 'ob-v2-styles';
    s.textContent = [
      '.ob-lang-btn { background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.15); color:#fff; padding:8px 16px; border-radius:12px; font-size:12.5px; font-weight:600; cursor:pointer; transition:all 0.2s }',
      '.ob-lang-btn.active { background:rgba(16,185,129,0.2); border-color:#10b981; color:#34d399 }',
      '.ob-range-slider { -webkit-appearance:none; width:100%; height:8px; border-radius:4px; background:rgba(255,255,255,0.15); outline:none; transition:background 0.2s }',
      '.ob-range-slider::-webkit-slider-thumb { -webkit-appearance:none; width:22px; height:22px; border-radius:50%; background:#10b981; cursor:pointer; box-shadow:0 0 10px rgba(16,185,129,0.6) }',
      '.ob-triggers-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:8px; width:100%; max-width:340px; margin:0 auto 16px; }',
      '.ob-trigger-chip { display:flex; flex-direction:column; align-items:center; gap:6px; padding:10px 8px; border-radius:14px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.12); color:#e2e8f0; font-size:10.5px; font-weight:600; cursor:pointer; transition:all 0.2s; text-align:center }',
      '.ob-trigger-chip.selected { background:rgba(16,185,129,0.16); border-color:#10b981; color:#34d399; transform:scale(1.02) }',
      '.ob-text-input { width:100%; box-sizing:border-box; background:rgba(15,23,42,0.8); border:1px solid rgba(255,255,255,0.2); color:#fff; padding:10px 14px; border-radius:12px; font-size:15px; font-weight:700; outline:none; transition:border-color 0.2s }',
      '.ob-text-input:focus { border-color:#10b981; }',
      '.ob-preset-chip { background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.14); color:var(--text-dim); padding:4px 8px; border-radius:8px; font-size:10.5px; font-weight:600; cursor:pointer }',
      '.ob-preset-chip.active { background:rgba(16,185,129,0.18); border-color:#10b981; color:#34d399 }',
      '.ob-goal-btn { display:flex; align-items:center; gap:8px; padding:10px 12px; border-radius:12px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.12); color:#fff; cursor:pointer; text-align:left; transition:all 0.2s }',
      '.ob-goal-btn.selected { background:rgba(16,185,129,0.16); border-color:#10b981; color:#34d399 }',
      '.ob-saved-badge { display:inline-flex; align-items:center; gap:6px; font-size:11.5px; font-weight:700; color:#34d399; background:rgba(16,185,129,0.12); border:1px solid rgba(16,185,129,0.3); padding:4px 12px; border-radius:999px }',
      '.ob-blueprint-card { width:100%; max-width:320px; background:rgba(15,23,42,0.7); border:1px solid rgba(255,255,255,0.12); border-radius:18px; padding:14px 16px; margin:0 auto 16px; text-align:left }',
      '.ob-env-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:4px }',
      '.ob-env-bar { width:100%; height:6px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden }',
      '.ob-btn-next { background:linear-gradient(135deg, #10b981, #059669); border:none; color:#fff; font-weight:700; font-size:13.5px; padding:12px 24px; border-radius:14px; cursor:pointer; box-shadow:0 4px 14px rgba(16,185,129,0.4); transition:all 0.2s }',
      '.ob-btn-next:active { transform:scale(0.96) }',
      '.ob-btn-back { background:transparent; border:none; color:var(--text-dim); font-size:13px; font-weight:600; cursor:pointer; padding:8px 12px }',
      '.ob-footer-controls { width:100%; max-width:440px; display:flex; justify-content:space-between; align-items:center; margin-top:16px }'
    ].join('\n');
    document.head.appendChild(s);
  }

  // ── Auto-Init ───────────────────────────────────────────────
  function initOnboarding() {
    injectOnboardingStyles();
    var isDone = false;
    try {
      isDone = localStorage.getItem(ONBOARDING_FLAG) === 'true' ||
               localStorage.getItem('pockettrack_onboarded') === 'true';
    } catch(e) {}

    var container = document.getElementById('onboarding-screen');
    if (!container) return;

    if (isDone) {
      container.style.display = 'none';
    } else {
      container.style.display = 'flex';
      renderSlide();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOnboarding);
  } else {
    initOnboarding();
  }
})();
