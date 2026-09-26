/* ═══════════════════════════════════════════════════════════════
   FINNY MASCOT ENGINE — PocketTrack Combined
   A cute, interactive animated financial mascot companion.
   Ported & enhanced from Version B into vanilla JavaScript.
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // ── SVG Character Generator ──────────────────────────────────
  function generateFinnySVG(opts) {
    opts = opts || {};
    var pose = opts.pose || 'greeting';     // greeting | notetaking | thinking | calculating | celebrating
    var emotion = opts.emotion || 'smile';  // enjoying | smile | neutral | sad | very_sad
    var size = opts.size || 88;

    // Eyebrows based on emotion
    var eyebrowsSVG = '';
    if (emotion === 'enjoying') {
      eyebrowsSVG = '<g stroke="#061a14" stroke-width="2.5" stroke-linecap="round" fill="none"><path d="M56 64 Q63 58 70 64"/><path d="M90 64 Q97 58 104 64"/></g>';
    } else if (emotion === 'smile') {
      eyebrowsSVG = '<g stroke="#061a14" stroke-width="2" stroke-linecap="round" fill="none"><path d="M58 66 Q64 63 70 66"/><path d="M90 66 Q96 63 102 66"/></g>';
    } else if (emotion === 'neutral') {
      eyebrowsSVG = '<g stroke="#061a14" stroke-width="2" stroke-linecap="round"><line x1="58" y1="67" x2="69" y2="67"/><line x1="91" y1="67" x2="102" y2="67"/></g>';
    } else if (emotion === 'sad') {
      eyebrowsSVG = '<g stroke="#061a14" stroke-width="2.5" stroke-linecap="round"><line x1="57" y1="70" x2="68" y2="64"/><line x1="92" y1="64" x2="103" y2="70"/></g>';
    } else if (emotion === 'very_sad') {
      eyebrowsSVG = '<g stroke="#061a14" stroke-width="3" stroke-linecap="round"><line x1="55" y1="72" x2="69" y2="62"/><line x1="91" y1="62" x2="105" y2="72"/></g>';
    }

    // Cheeks
    var cheekOpacity = emotion === 'very_sad' ? 0.25 : (emotion === 'enjoying' ? 0.75 : 0.45);
    var cheekR = emotion === 'enjoying' ? 9.5 : 8;

    // Eyes
    var eyesSVG = '';
    if (emotion === 'enjoying') {
      eyesSVG = '<g stroke="#061a14" stroke-width="3.2" stroke-linecap="round" fill="none"><path d="M57 78 Q64 69 71 78"/><path d="M89 78 Q96 69 103 78"/></g>';
    } else if (emotion === 'very_sad') {
      eyesSVG = '<g class="finny-blink"><ellipse cx="64" cy="77" rx="9" ry="10.5" fill="#061a14"/><circle cx="62" cy="74" r="4.5" fill="#fff"/><circle cx="67" cy="80" r="2" fill="#fff"/><ellipse cx="96" cy="77" rx="9" ry="10.5" fill="#061a14"/><circle cx="94" cy="74" r="4.5" fill="#fff"/><circle cx="99" cy="80" r="2" fill="#fff"/></g>';
    } else {
      eyesSVG = '<g class="finny-blink"><ellipse cx="64" cy="76" rx="8.5" ry="10" fill="#061a14"/><circle cx="61.5" cy="73" r="3.5" fill="#fff"/><circle cx="66" cy="79" r="1.5" fill="#fff"/><ellipse cx="96" cy="76" rx="8.5" ry="10" fill="#061a14"/><circle cx="93.5" cy="73" r="3.5" fill="#fff"/><circle cx="98" cy="79" r="1.5" fill="#fff"/></g>';
    }

    // Tear for very_sad
    var tearSVG = emotion === 'very_sad'
      ? '<path d="M56 90 C56 90 53 96 53 99 C53 102 55.5 104 58 104 C60.5 104 63 102 63 99 C63 96 60 90 56 90 Z" fill="#38bdf8" filter="url(#finnyGlow)"/>'
      : '';

    // Mouth
    var mouthSVG = '';
    if (emotion === 'enjoying') {
      mouthSVG = '<path d="M70 84 Q80 99 90 84 Z" fill="#e11d48" stroke="#061a14" stroke-width="2.5" stroke-linejoin="round"/>';
    } else if (emotion === 'smile') {
      mouthSVG = '<path d="M73 87 Q80 94 87 87" stroke="#061a14" stroke-width="2.5" stroke-linecap="round" fill="none"/>';
    } else if (emotion === 'neutral') {
      mouthSVG = '<line x1="74" y1="88" x2="86" y2="88" stroke="#061a14" stroke-width="2.5" stroke-linecap="round"/>';
    } else if (emotion === 'sad') {
      mouthSVG = '<path d="M73 91 Q80 85 87 91" stroke="#061a14" stroke-width="2.5" stroke-linecap="round" fill="none"/>';
    } else if (emotion === 'very_sad') {
      mouthSVG = '<path d="M71 94 Q80 84 89 94" stroke="#061a14" stroke-width="3" stroke-linecap="round" fill="none"/>';
    }

    // Pose-specific accessories and limbs
    var poseSVG = '';
    if (pose === 'greeting') {
      poseSVG = '<g>' +
        '<ellipse cx="32" cy="94" rx="9" ry="11" fill="url(#finnyBodyGrad)" transform="rotate(20 32 94)"/>' +
        '<g class="finny-wave">' +
          '<ellipse cx="128" cy="74" rx="10" ry="13" fill="url(#finnyBodyGrad)" transform="rotate(-30 128 74)"/>' +
          '<path d="M136 56 L139 63 L146 66 L139 69 L136 76 L133 69 L126 66 L133 63 Z" fill="#fde047" class="finny-sparkle"/>' +
        '</g>' +
      '</g>';
    } else if (pose === 'notetaking') {
      poseSVG = '<g>' +
        '<rect x="94" y="80" width="30" height="38" rx="4" fill="#0f172a" stroke="#38bdf8" stroke-width="2"/>' +
        '<line x1="98" y1="88" x2="118" y2="88" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>' +
        '<line x1="98" y1="94" x2="114" y2="94" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>' +
        '<line x1="98" y1="100" x2="116" y2="100" stroke="#34d399" stroke-width="2" stroke-linecap="round"/>' +
        '<ellipse cx="90" cy="100" rx="9" ry="11" fill="url(#finnyBodyGrad)"/>' +
        '<g transform="rotate(-15 110 85)">' +
          '<rect x="110" y="72" width="4" height="20" rx="1.5" fill="#fbbf24" stroke="#d97706" stroke-width="1"/>' +
          '<polygon points="110,92 114,92 112,96" fill="#0f172a"/>' +
          '<ellipse cx="108" cy="85" rx="7" ry="8" fill="url(#finnyBodyGrad)"/>' +
        '</g>' +
      '</g>';
    } else if (pose === 'thinking') {
      poseSVG = '<g>' +
        '<ellipse cx="32" cy="96" rx="9" ry="11" fill="url(#finnyBodyGrad)"/>' +
        '<ellipse cx="94" cy="95" rx="9" ry="10" fill="url(#finnyBodyGrad)" transform="rotate(-25 94 95)"/>' +
        '<g>' +
          '<circle cx="124" cy="50" r="11" fill="rgba(245,158,11,0.2)" stroke="#f59e0b" stroke-width="1.8"/>' +
          '<text x="124" y="55" font-size="14" font-weight="bold" fill="#f59e0b" text-anchor="middle" font-family="system-ui,sans-serif">?</text>' +
        '</g>' +
      '</g>';
    } else if (pose === 'calculating') {
      poseSVG = '<g>' +
        '<ellipse cx="30" cy="86" rx="9" ry="11" fill="url(#finnyBodyGrad)" transform="rotate(35 30 86)"/>' +
        '<ellipse cx="130" cy="86" rx="9" ry="11" fill="url(#finnyBodyGrad)" transform="rotate(-35 130 86)"/>' +
        '<g transform="translate(68,14)">' +
          '<circle cx="12" cy="12" r="11" fill="url(#finnyCoinGrad)" stroke="#ca8a04" stroke-width="1.5" filter="url(#finnyGlow)"/>' +
          '<text x="12" y="16" font-size="12" font-weight="900" fill="#78350f" text-anchor="middle" font-family="system-ui,sans-serif">₹</text>' +
        '</g>' +
        '<text x="30" y="52" font-size="15" font-weight="bold" fill="#34d399" opacity="0.85" font-family="system-ui,sans-serif">+</text>' +
        '<text x="124" y="52" font-size="15" font-weight="bold" fill="#38bdf8" opacity="0.85" font-family="system-ui,sans-serif">%</text>' +
      '</g>';
    } else if (pose === 'celebrating') {
      poseSVG = '<g>' +
        '<g transform="translate(56,12)">' +
          '<polygon points="0,22 8,6 24,14 40,6 48,22" fill="url(#finnyCrownGrad)" stroke="#d97706" stroke-width="1.5" stroke-linejoin="round"/>' +
          '<rect x="0" y="21" width="48" height="5" rx="1.5" fill="#f59e0b" stroke="#b45309" stroke-width="1"/>' +
          '<circle cx="8" cy="6" r="3" fill="#ef4444"/>' +
          '<circle cx="24" cy="14" r="3" fill="#3b82f6"/>' +
          '<circle cx="40" cy="6" r="3" fill="#10b981"/>' +
        '</g>' +
        '<ellipse cx="32" cy="74" rx="9" ry="12" fill="url(#finnyBodyGrad)" transform="rotate(-40 32 74)"/>' +
        '<ellipse cx="128" cy="74" rx="9" ry="12" fill="url(#finnyBodyGrad)" transform="rotate(40 128 74)"/>' +
        '<circle cx="22" cy="46" r="2.5" fill="#fde047"/>' +
        '<circle cx="138" cy="46" r="2.5" fill="#38bdf8"/>' +
        '<circle cx="18" cy="66" r="2" fill="#f43f5e"/>' +
        '<circle cx="142" cy="66" r="2" fill="#10b981"/>' +
      '</g>';
    }

    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" class="finny-svg" role="img" aria-label="Finny Mascot">' +
      '<defs>' +
        '<linearGradient id="finnyBodyGrad" x1="20" y1="20" x2="140" y2="140" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#10b981"/><stop offset="50%" stop-color="#059669"/><stop offset="100%" stop-color="#047857"/></linearGradient>' +
        '<linearGradient id="finnyBellyGrad" x1="45" y1="70" x2="115" y2="135" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#34d399"/><stop offset="100%" stop-color="#059669"/></linearGradient>' +
        '<linearGradient id="finnyEarGrad" x1="0" y1="0" x2="30" y2="30" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#fbbf24"/><stop offset="100%" stop-color="#d97706"/></linearGradient>' +
        '<linearGradient id="finnyCrownGrad" x1="0" y1="0" x2="50" y2="35" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#fef08a"/><stop offset="50%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#b45309"/></linearGradient>' +
        '<linearGradient id="finnyCoinGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#fde047"/><stop offset="100%" stop-color="#ca8a04"/></linearGradient>' +
        '<filter id="finnyGlow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4" result="blur"/><feComposite in="SourceGraphic" in2="blur" operator="over"/></filter>' +
      '</defs>' +
      // Shadow
      '<ellipse cx="80" cy="148" rx="42" ry="7" fill="rgba(0,0,0,0.35)"/>' +
      // Ears
      '<g>' +
        '<ellipse cx="50" cy="40" rx="14" ry="20" fill="url(#finnyBodyGrad)" transform="rotate(-18 50 40)"/>' +
        '<ellipse cx="51" cy="41" rx="8" ry="12" fill="url(#finnyEarGrad)" transform="rotate(-18 51 41)"/>' +
        '<ellipse cx="110" cy="40" rx="14" ry="20" fill="url(#finnyBodyGrad)" transform="rotate(18 110 40)"/>' +
        '<ellipse cx="109" cy="41" rx="8" ry="12" fill="url(#finnyEarGrad)" transform="rotate(18 109 41)"/>' +
        '<circle cx="80" cy="24" r="5" fill="#fde047" filter="url(#finnyGlow)"/>' +
        '<path d="M80 28 L80 38" stroke="#10b981" stroke-width="3" stroke-linecap="round"/>' +
      '</g>' +
      // Body
      '<g>' +
        '<ellipse cx="80" cy="92" rx="52" ry="48" fill="url(#finnyBodyGrad)"/>' +
        '<ellipse cx="80" cy="98" rx="34" ry="30" fill="url(#finnyBellyGrad)" opacity="0.9"/>' +
        '<path d="M68 96 L74 96 L78 102 L86 102 L90 96 L94 96" stroke="rgba(255,255,255,0.4)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<circle cx="80" cy="112" r="3" fill="#fff" opacity="0.6"/>' +
      '</g>' +
      // Feet
      '<g>' +
        '<ellipse cx="62" cy="138" rx="14" ry="7" fill="#047857"/>' +
        '<ellipse cx="98" cy="138" rx="14" ry="7" fill="#047857"/>' +
      '</g>' +
      // Face
      '<g>' +
        eyebrowsSVG +
        '<circle cx="55" cy="88" r="' + cheekR + '" fill="#f43f5e" opacity="' + cheekOpacity + '"/>' +
        '<circle cx="105" cy="88" r="' + cheekR + '" fill="#f43f5e" opacity="' + cheekOpacity + '"/>' +
        eyesSVG + tearSVG + mouthSVG +
      '</g>' +
      // Pose items
      poseSVG +
    '</svg>';
  }

  // ── CSS Injection ───────────────────────────────────────────
  function injectFinnyStyles() {
    if (document.getElementById('finny-mascot-styles')) return;
    var style = document.createElement('style');
    style.id = 'finny-mascot-styles';
    style.textContent = [
      '@keyframes finnyBreathe { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-3px) scale(1.02)} }',
      '@keyframes finnyFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }',
      '@keyframes finnyWave { 0%,100%{transform:rotate(0)} 25%{transform:rotate(-18deg)} 75%{transform:rotate(14deg)} }',
      '@keyframes finnyBlink { 0%,96%,100%{transform:scaleY(1)} 98%{transform:scaleY(0.1)} }',
      '@keyframes finnySparkle { 0%,100%{opacity:0.3;transform:scale(0.8) rotate(0)} 50%{opacity:1;transform:scale(1.2) rotate(45deg)} }',
      '@keyframes finnySpeechPop { 0%{opacity:0;transform:translateY(6px) scale(0.96)} 100%{opacity:1;transform:translateY(0) scale(1)} }',
      '@keyframes finnyBounce { 0%,100%{transform:scale(1)} 40%{transform:scale(0.92) translateY(2px)} 70%{transform:scale(1.06) translateY(-4px)} }',
      '.finny-svg { filter:drop-shadow(0 10px 24px rgba(16,185,129,0.32)); animation:finnyBreathe 4s ease-in-out infinite; overflow:visible }',
      '.finny-blink { transform-origin:80px 78px; animation:finnyBlink 4s infinite }',
      '.finny-wave { transform-origin:122px 85px; animation:finnyWave 1.8s ease-in-out infinite }',
      '.finny-sparkle { animation:finnySparkle 2s infinite }',
      '.finny-widget { display:flex; align-items:center; gap:14px; padding:14px 16px; background:linear-gradient(145deg,rgba(16,185,129,0.1),rgba(15,23,42,0.6)); border:1px solid rgba(16,185,129,0.3); border-radius:20px; margin-bottom:12px; cursor:pointer; position:relative; overflow:hidden; transition:all 0.25s cubic-bezier(0.2,0.8,0.2,1); box-shadow:0 6px 20px rgba(0,0,0,0.25) }',
      '.finny-widget:hover { border-color:rgba(16,185,129,0.55); box-shadow:0 8px 26px rgba(16,185,129,0.2); transform:translateY(-1px) }',
      '.finny-widget:active { transform:scale(0.98) }',
      '.finny-widget.bouncing { animation:finnyBounce 0.4s ease-out }',
      '.finny-badge { display:inline-flex; align-items:center; gap:5px; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:#34d399; background:rgba(16,185,129,0.14); border:1px solid rgba(16,185,129,0.35); padding:2px 8px; border-radius:999px; margin-bottom:5px }',
      '.finny-speech { background:rgba(15,23,42,0.92); border:1px solid rgba(16,185,129,0.35); color:#e2e8f0; padding:8px 12px; border-radius:14px; font-size:12.5px; font-weight:500; line-height:1.42; position:relative; animation:finnySpeechPop 0.3s ease-out; box-shadow:0 4px 14px rgba(0,0,0,0.35) }',
      '.finny-speech::before { content:""; position:absolute; left:-6px; top:16px; width:0; height:0; border-top:6px solid transparent; border-bottom:6px solid transparent; border-right:6px solid rgba(16,185,129,0.45) }',
      '.finny-tap-hint { font-size:10px; color:var(--text-dim,#94a3b8); margin:5px 0 0 2px; opacity:0.75; display:flex; align-items:center; gap:4px }',
      '.finny-tap-hint span { color:#34d399 }'
    ].join('\n');
    document.head.appendChild(style);
  }

  // ── Contextual Dialogue Library ─────────────────────────────
  var finnyDialogues = {
    en: {
      no_entries: [
        "Hey there! Ready to track today? Just tap the mic to voice log! 🎙️",
        "Keep your streak going! Even a ₹10 chai entry counts ☕",
        "Your money goes where you tell it to. Let's log today's first entry! 📝",
        "A fresh day for smart money choices! What moved today? ✨"
      ],
      good_spending: [
        "Looking sharp! You're keeping spending well under control today! 🌟",
        "Smart financial discipline! Your future self is thanking you 💪",
        "Safe-to-spend is in the green! Keep this steady rhythm 🎯",
        "Remember the 50/30/20 rule: 50% Needs, 30% Wants, 20% Savings! 💡"
      ],
      overspending: [
        "Whoa, spending is running hot today! Let's pause and breathe 😬",
        "High daily burn alert! Maybe cook dinner instead of ordering in? 🍳",
        "Small daily leaks sink big ships. Check your Safe-to-Spend! ⛵",
        "Need vs. Want check: ask yourself if that expense is truly essential 🤔"
      ],
      celebration: [
        "AMAZING! Your streak is on fire! Keep crushing those money goals! 👑🔥",
        "Financial royalty status unlocked! Consistency always pays off 🏆",
        "Super discipline! You're building true wealth one day at a time 🚀"
      ],
      income: [
        "Cha-ching! Fresh income registered! Make every rupee count 💰🎉",
        "Income boost! Consider parking at least 20% directly into savings 🎯"
      ],
      tips: [
        "Rule of 72: Divide 72 by your expected annual return to see when money doubles! 📈",
        "Emergency Fund Rule: Keep 3 to 6 months of living expenses safe in liquid funds 🛡️",
        "Never spend money before you have earned it — avoid unnecessary EMI debt! 💳",
        "Tip: Check the 'My QR' tool in Command Hub to generate instant UPI payment codes ⚡"
      ]
    },
    hi: {
      no_entries: [
        "नमस्ते! आज का हिसाब लिखने के लिए तैयार? माइक दबाकर बोलें 🎙️",
        "अपनी स्ट्रीक बनाए रखें! ₹10 की चाय भी दर्ज करें ☕",
        "पैसों पर नज़र रखेंगे, तभी बचत होगी। आज की पहली एंट्री करें! 📝",
        "नया दिन, समझदार बचत! आज क्या खर्च हुआ? ✨"
      ],
      good_spending: [
        "शाबाश! आज आपका खर्च बिल्कुल बजट के अंदर चल रहा है! 🌟",
        "शानदार अनुशासन! हर दिन की बचत कल की दौलत बनती है 💪",
        "Safe-to-Spend हरा है! ऐसे ही बैलेंस बनाए रखें 🎯",
        "नियम याद रखें: 50% ज़रूरतें, 30% इच्छाएं, 20% बचत! 💡"
      ],
      overspending: [
        "अरे! आज खर्च थोड़ा तेज़ी से बढ़ रहा है, संभलकर चलें 😬",
        "दैनिक खर्च की सीमा पार हो रही है! बाहर खाने के बजाय घर पर बनाएं? 🍳",
        "छोटी-छोटी बचत बड़ा खज़ाना बनाती है। Safe-to-Spend जांचें! ⛵",
        "ज़रूरत या शौक? खरीदने से पहले 24 घंटे सोचें 🤔"
      ],
      celebration: [
        "कमाल कर दिया! आपकी स्ट्रीक लाजवाब चल रही है! 👑🔥",
        "बचत के असली चैंपियन! आपका वित्तीय भविष्य सुरक्षित है 🏆",
        "सुपर अनुशासन! रोज़ का ट्रैक रखने से ही अमीर बनते हैं 🚀"
      ],
      income: [
        "वाह! नई आय जुड़ गई! इसमें से कुछ हिस्सा बचत खाते में ज़रूर डालें 💰🎉",
        "सैलरी/आय मुबारक! कम से कम 20% तुरंत इन्वेस्ट करें 🎯"
      ],
      tips: [
        "आपातकालीन फंड: कम से कम 3-6 महीने का खर्च हमेशा तैयार रखें 🛡️",
        "क्रेडिट कार्ड का बिल हमेशा समय पर पूरा भरें, मिनिमम नहीं! 💳",
        "कमांड हब में 'My QR' टूल से झटपट UPI QR बनाएं ⚡"
      ]
    }
  };

  // ── Determine Finny State from App Data ──────────────────────
  var manualCycleIndex = 0;
  var customReaction = null;
  var customReactionTimeout = null;

  function getFinnyContext() {
    if (customReaction) {
      return customReaction;
    }

    var entries = [];
    if (typeof window.mainEntries === 'function') {
      entries = window.mainEntries() || [];
    } else if (Array.isArray(window.entries)) {
      entries = window.entries;
    } else {
      try {
        entries = JSON.parse(localStorage.getItem('pockettrack_entries') || '[]');
      } catch(e) {
        entries = [];
      }
    }
    if (!Array.isArray(entries)) entries = [];

    var today = new Date().toISOString().slice(0, 10);
    var todayEntries = entries.filter(function(e) {
      var d = String(e.date || '').slice(0, 10);
      return d === today;
    });

    var todayExpenses = todayEntries.filter(function(e) { return e.type === 'expense'; });
    var todayExpenseTotal = todayExpenses.reduce(function(s, e) {
      return s + (Number(e.amt || e.amount) || 0);
    }, 0);

    var streakCount = 0;
    try {
      streakCount = parseInt(localStorage.getItem('pockettrack_streak') || '0', 10) || 0;
    } catch(e) {}

    // Check Safe-to-Spend limit if available
    var safeAllowance = 1500;
    if (window.dailyBurnData && window.dailyBurnData.dailyAllowance) {
      safeAllowance = window.dailyBurnData.dailyAllowance;
    }

    if (todayEntries.length === 0) {
      return { pose: 'greeting', emotion: 'smile', category: 'no_entries' };
    }
    if (streakCount >= 7) {
      return { pose: 'celebrating', emotion: 'enjoying', category: 'celebration' };
    }
    if (todayExpenseTotal > safeAllowance * 1.25 || todayExpenseTotal > 2500) {
      return { pose: 'thinking', emotion: 'sad', category: 'overspending' };
    }
    if (todayExpenseTotal > 0 && todayExpenseTotal <= safeAllowance) {
      return { pose: 'calculating', emotion: 'enjoying', category: 'good_spending' };
    }
    return { pose: 'notetaking', emotion: 'smile', category: 'good_spending' };
  }

  function getDialogueText(category) {
    var isHi = (window.currentLang === 'hi') ||
               (localStorage.getItem('pockettrack_lang') === 'hi');
    var langObj = isHi ? finnyDialogues.hi : finnyDialogues.en;
    var list = langObj[category] || langObj.tips || finnyDialogues.en.tips;
    var idx = (manualCycleIndex++) % list.length;
    return list[idx];
  }

  // ── Render Widget into DOM ──────────────────────────────────
  function renderFinnyWidget() {
    var slot = document.getElementById('finny-mascot-slot');
    if (!slot) return;

    var ctx = getFinnyContext();
    var text = ctx.text || getDialogueText(ctx.category);
    var svg = generateFinnySVG({ pose: ctx.pose, emotion: ctx.emotion, size: 76 });

    var moodBadge = 'AI COMPANION';
    if (ctx.pose === 'celebrating') moodBadge = '🎉 CELEBRATING';
    else if (ctx.pose === 'thinking') moodBadge = '🤔 ADVISING';
    else if (ctx.pose === 'calculating') moodBadge = '📊 CALCULATING';

    slot.innerHTML =
      '<div class="finny-widget" id="finny-widget-card" onclick="window.FinnyMascot.cycle()" title="Tap Finny for new financial wisdom!">' +
        '<div style="flex-shrink:0;position:relative;" id="finny-svg-box">' +
          svg +
        '</div>' +
        '<div style="flex:1;min-width:0;">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">' +
            '<span class="finny-badge">' + moodBadge + '</span>' +
          '</div>' +
          '<div class="finny-speech" id="finny-speech-text">' +
            text +
          '</div>' +
          '<div class="finny-tap-hint">' +
            '<span>💡</span> Tap Finny for tips' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  // ── Interactive Actions ─────────────────────────────────────
  function cycleTip() {
    var card = document.getElementById('finny-widget-card');
    if (card) {
      card.classList.remove('bouncing');
      void card.offsetWidth; // trigger reflow
      card.classList.add('bouncing');
    }

    var poses = ['greeting', 'notetaking', 'calculating', 'celebrating', 'thinking'];
    var emotions = ['smile', 'enjoying', 'smile', 'enjoying', 'neutral'];
    var pIdx = manualCycleIndex % poses.length;

    customReaction = {
      pose: poses[pIdx],
      emotion: emotions[pIdx],
      category: 'tips',
      text: getDialogueText('tips')
    };

    renderFinnyWidget();

    if (customReactionTimeout) clearTimeout(customReactionTimeout);
    customReactionTimeout = setTimeout(function() {
      customReaction = null;
      renderFinnyWidget();
    }, 12000);
  }

  function reactToEvent(eventType, amount) {
    if (eventType === 'income') {
      customReaction = {
        pose: 'celebrating',
        emotion: 'enjoying',
        category: 'income',
        text: (window.currentLang === 'hi'
          ? 'वाह! ₹' + (amount || '') + ' की नई आय जुड़ गई! 💰🎉'
          : 'Cha-ching! ₹' + (amount || '') + ' income logged! Great work! 💰🎉')
      };
    } else if (eventType === 'expense') {
      var isHi = window.currentLang === 'hi';
      var numAmt = Number(amount) || 0;
      if (numAmt > 2000) {
        customReaction = {
          pose: 'thinking',
          emotion: 'sad',
          category: 'overspending',
          text: (isHi ? 'बड़ा खर्च दर्ज हुआ (₹' + numAmt + ')! संभलकर चलें। 😬' : 'Large expense logged (₹' + numAmt + ')! Watch your Safe-to-Spend today. 😬')
        };
      } else {
        customReaction = {
          pose: 'notetaking',
          emotion: 'smile',
          category: 'good_spending',
          text: (isHi ? 'एंट्री दर्ज हो गई! Finny आपके बजट पर नज़र रख रहा है 📝' : 'Entry tracked! Finny has updated your ledger 📝')
        };
      }
    }

    renderFinnyWidget();

    if (customReactionTimeout) clearTimeout(customReactionTimeout);
    customReactionTimeout = setTimeout(function() {
      customReaction = null;
      renderFinnyWidget();
    }, 8000);
  }

  // ── Public API ──────────────────────────────────────────────
  window.FinnyMascot = {
    render: renderFinnyWidget,
    cycle: cycleTip,
    reactTo: reactToEvent,
    getSVG: generateFinnySVG,
    getContext: getFinnyContext
  };

  // ── Auto Initialization ─────────────────────────────────────
  injectFinnyStyles();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(renderFinnyWidget, 400);
    });
  } else {
    setTimeout(renderFinnyWidget, 400);
  }

  // Hook into stats refresh if window.updateHeaderStats exists
  var origUpdateHeaderStats = window.updateHeaderStats;
  if (typeof origUpdateHeaderStats === 'function') {
    window.updateHeaderStats = function() {
      origUpdateHeaderStats.apply(this, arguments);
      try { renderFinnyWidget(); } catch(e) {}
    };
  }
})();
