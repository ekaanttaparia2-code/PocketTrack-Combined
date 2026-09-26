/* PocketTrack application entry point. */

// --- Language / i18n ---
const TRANSLATIONS = {
  tagline:{en:'Track income & expenses, know your balance',hi:'आय और खर्च को ट्रैक करें, अपना बैलेंस जानें'},
  home_glance:{en:'Your money, at a glance.',hi:'आपका पैसा, एक नज़र में।'},
  home_available:{en:'Available across your tracked money',hi:'आपके ट्रैक किए गए पैसों का उपलब्ध बैलेंस'},
  home_add_expense:{en:'Add expense',hi:'खर्च जोड़ें'},
  home_add_income:{en:'Add income',hi:'आय जोड़ें'},
  home_voice:{en:'Voice',hi:'वॉइस'},
  home_recent_kicker:{en:'Recent activity',hi:'हाल की गतिविधि'},
  home_recent_title:{en:'What moved your money?',hi:'आपके पैसे में क्या बदलाव आया?'},
  home_view_all:{en:'View all',hi:'सभी देखें'},
  home_money_pulse:{en:'Money pulse',hi:'मनी पल्स'},
  home_money_pulse_empty:{en:'Once you have a few entries, PocketTrack will start surfacing useful patterns here.',hi:'कुछ एंट्रीज़ के बाद PocketTrack यहां उपयोगी पैटर्न दिखाना शुरू करेगा।'},
  home_command_hub:{en:'Financial Power Hub',hi:'वित्तीय कमांड हब',hinglish:'Financial Power Hub',mr:'आर्थिक कमांड हब',ta:'நிதி கட்டளை மையம்',te:'ఆర్థిక కమాండ్ హబ్',gu:'નાણાકીય કમાન્ડ હબ',bn:'আর্থিক কমান্ড হাব'},
  hub_tools_count:{en:'8 Tools Active',hi:'8 टूल्स सक्रिय',hinglish:'8 Tools Active',mr:'8 साधने सक्रिय',ta:'8 கருவிகள் செயலில்',te:'8 ఉపకరణాలు క్రియాశీలం',gu:'8 સાધનો સક્રિય',bn:'৮টি টুল সক্রিয়'},
  nav_hub:{en:'Hub',hi:'हब',hinglish:'Hub',mr:'हब',ta:'மையம்',te:'హబ్',gu:'હબ',bn:'হাব'},
  nav_activity:{en:'Activity',hi:'गतिविधि'},
  nav_add:{en:'Add',hi:'जोड़ें'},
  nav_insights:{en:'Insights',hi:'इनसाइट्स'},
  nav_more:{en:'Hub',hi:'हब'},
  nav_log:{en:'Log',hi:'एंट्री जोड़ें'},
  nav_home:{en:'Home',hi:'होम'},
  nav_entries:{en:'Entries',hi:'सभी एंट्रीज़'},
  nav_report:{en:'Report',hi:'रिपोर्ट'},
  nav_pro:{en:'Pro',hi:'Pro'},
  nav_smart_logger:{en:'Smart Logger',hi:'स्मार्ट लॉगर'},
  auth_sub:{en:'Sign in to sync your data',hi:'अपना डेटा सिंक करने के लिए साइन इन करें'},
  feature_voice_title:{en:'Voice Expense Entry',hi:'वॉइस खर्च एंट्री'},
  feature_voice_desc:{en:'Say e.g. "Spent 450 on groceries" or "Got 15000 salary"',hi:'बोलें जैसे "450 ग्रॉसरी पर खर्च" या "15000 सैलरी मिली"'},
  pro_themes:{en:'Pro & Themes',hi:'Pro और थीम'},
  nav_events:{en:'Events',hi:'आयोजन'},
  nav_logout:{en:'Log out',hi:'बाहर निकलें'},
  nav_language:{en:'Language',hi:'भाषा'},
  nav_rewards:{en:'Rewards',hi:'रिवॉर्ड्स'},
  rewards_your_points:{en:'Your points',hi:'आपके पॉइंट्स'},
  rewards_next_milestone:{en:'Next milestone',hi:'अगला माइलस्टोन'},
  rewards_badges:{en:'Your badges',hi:'आपके बैज'},
  rewards_how_title:{en:'How it works',hi:'यह कैसे काम करता है'},
  rewards_how_desc:{en:"Log at least one income or expense on a day to keep your streak alive and earn points. The longer your streak, the more badges you unlock. Points and badges aren't real money — they're yours to show off, unlock fun app themes, and prove you're actually on top of your money.",hi:'अपनी स्ट्रीक जिंदा रखने और पॉइंट्स कमाने के लिए हर दिन कम से कम एक आय या खर्च दर्ज करें। जितनी लंबी स्ट्रीक, उतने ज़्यादा बैज अनलॉक होंगे। पॉइंट्स और बैज असली पैसे नहीं हैं — ये दिखाने के लिए हैं, मज़ेदार ऐप थीम अनलॉक करने के लिए हैं, और यह साबित करने के लिए हैं कि आप वाकई अपने पैसों पर नज़र रखते हैं।'},
  sec_add_income:{en:'Add income',hi:'आय जोड़ें'},
  sec_add_expense:{en:'Add expense',hi:'खर्च जोड़ें'},
  sec_budget:{en:'Budget',hi:'बजट'},
  lbl_set_budget_weekly:{en:'Set weekly budget (₹)',hi:'साप्ताहिक बजट सेट करें (₹)'},
  lbl_set_budget_monthly:{en:'Set monthly budget (₹)',hi:'मासिक बजट सेट करें (₹)'},
  lbl_period:{en:'Period',hi:'अवधि'},
  lbl_to:{en:'To',hi:'तक'},
  period_week:{en:'Week',hi:'सप्ताह'},
  period_all:{en:'All time',hi:'सभी'},
  period_custom:{en:'Custom',hi:'कस्टम'},
  period_month:{en:'Month',hi:'महीना'},
  metric_total_income:{en:'Total income',hi:'कुल आय'},
  metric_total_spent:{en:'Total spent',hi:'कुल खर्च'},
  metric_balance_left:{en:'Balance left',hi:'बचा हुआ बैलेंस'},
  metric_entries:{en:'Entries',hi:'एंट्रीज़'},
  sec_cat:{en:'Spending by category',hi:'श्रेणी अनुसार खर्च'},
  sec_full:{en:'Full breakdown',hi:'पूरा विवरण'},
  btn_add_income:{en:'Add income',hi:'आय जोड़ें'},
  btn_add_expense:{en:'Add expense',hi:'खर्च जोड़ें'},
  btn_update_income:{en:'Update income',hi:'आय अपडेट करें'},
  btn_update_expense:{en:'Update expense',hi:'खर्च अपडेट करें'},
  sec_language:{en:'Language',hi:'भाषा'},
  lang_desc:{en:"Choose the language you'd like to use throughout the app.",hi:'ऐप में इस्तेमाल करने के लिए अपनी पसंदीदा भाषा चुनें।'},
  btn_save_budget:{en:'Save budget',hi:'बजट सेव करें'},
  btn_enable_notif:{en:'Enable notifications',hi:'सूचनाएं चालू करें'},
  btn_copy_report:{en:'Copy report',hi:'रिपोर्ट कॉपी करें'},
  btn_export_pdf:{en:'Export as PDF',hi:'PDF में सेव करें'},
  btn_clear_all:{en:'Clear all',hi:'सब हटाएं'},
  lbl_amount:{en:'Amount (₹)',hi:'राशि (₹)'},
  lbl_date:{en:'Date',hi:'तारीख'},
  lbl_category:{en:'Category',hi:'श्रेणी'},
  lbl_source:{en:'Source',hi:'स्रोत'},
  lbl_note:{en:'Note',hi:'नोट'},
  lbl_desc:{en:'Description',hi:'विवरण'},
  lbl_desc_opt:{en:'Description (optional)',hi:'विवरण (वैकल्पिक)'},
  lbl_specify:{en:'Please specify',hi:'कृपया बताएं'},
  lbl_custom_source:{en:'New source name',hi:'नए स्रोत का नाम'},
  btn_cancel_edit:{en:'Cancel edit',hi:'संपादन रद्द करें'},
  lbl_custom_category:{en:'New category name',hi:'नई श्रेणी का नाम'},
  lnk_manage_sources:{en:'Manage your custom sources',hi:'अपने कस्टम स्रोत प्रबंधित करें'},
  lnk_manage_categories:{en:'Manage your custom categories',hi:'अपनी कस्टम श्रेणियां प्रबंधित करें'},
  no_custom_sources:{en:"You haven't added any custom sources yet",hi:'आपने अभी तक कोई कस्टम स्रोत नहीं जोड़ा है'},
  no_custom_categories:{en:"You haven't added any custom categories yet",hi:'आपने अभी तक कोई कस्टम श्रेणी नहीं जोड़ी है'},
  give_source_name:{en:'Type a name for this source',hi:'इस स्रोत के लिए एक नाम लिखें'},
  sec_participants:{en:'Participants',hi:'प्रतिभागी'},
  participants_desc:{en:'Add your friends to split shared expenses and track who owes whom.',hi:'शेयर खर्च बांटने और यह ट्रैक करने के लिए अपने दोस्तों को जोड़ें कि किसने किसको देना है।'},
  btn_add:{en:'Add',hi:'जोड़ें'},
  lnk_manage_participants:{en:'Manage your participants',hi:'अपने प्रतिभागियों को प्रबंधित करें'},
  manage_participants_title:{en:'Manage participants',hi:'प्रतिभागी प्रबंधित करें'},
  lbl_received_by:{en:'Received by',hi:'प्राप्तकर्ता'},
  no_participants_manage:{en:'No participants yet',hi:'अभी तक कोई प्रतिभागी नहीं'},
  btn_edit_participant:{en:'Edit',hi:'बदलें'},
  sec_settlement:{en:'Settlement',hi:'सेटलमेंट'},
  settlement_desc:{en:'Smart calculation — minimizes the number of payments needed.',hi:'स्मार्ट कैल्कुलेशन — भुगतान की संख्या को कम करता है।'},
  all_settled:{en:'All settled up!',hi:'सब सेटल हो गया!'},
  exp_type_personal:{en:'Personal',hi:'व्यक्तिगत'},
  exp_type_shared:{en:'Shared / Split',hi:'शेयर / स्प्लिट'},
  lbl_paid_by:{en:'Paid by',hi:'भुगतान किसने किया'},
  lbl_split_among:{en:'Split among',hi:'किनके बीच बांटें'},
  btn_settle:{en:'Mark as settled',hi:'सेटल्ड मार्क करें'},
  no_participants:{en:'No participants yet. Add friends above!',hi:'अभी तक कोई प्रतिभागी नहीं। ऊपर दोस्तों को जोड़ें!'},
  owes:{en:'owes',hi:'देना है'},
  gets_back:{en:'gets back',hi:'वापस मिलेगा'},
  give_category_name:{en:'Type a name for this category',hi:'इस श्रेणी के लिए एक नाम लिखें'},
  sec_money_tip:{en:'Money-saving tip',hi:'पैसे बचाने की सलाह'},
  btn_next_tip:{en:'Show me another tip',hi:'दूसरी सलाह दिखाएं'},
  sec_entries:{en:'Entries',hi:'एंट्रीज़'},
  sec_your_events:{en:'Your events',hi:'आपके इवेंट्स'},
  btn_add_event:{en:'Add event',hi:'इवेंट जोड़ें'},
  events_desc:{en:'Track a birthday, wedding, trip or any occasion as its own mini ledger — with its own log, entries and totals.',hi:'किसी जन्मदिन, शादी, यात्रा या किसी भी मौके को अपने अलग मिनी-लेखे के रूप में ट्रैक करें — अपने खुद के लॉग, एंट्रीज़ और कुल योग के साथ।'},
  sec_create_event:{en:'Create a new event',hi:'नया इवेंट बनाएं'},
  lbl_email:{en:'Email',hi:'ईमेल'},
  lbl_password:{en:'Password',hi:'पासवर्ड'},
  lnk_forgot_pass:{en:'Forgot password?',hi:'पासवर्ड भूल गए?'},
  btn_login:{en:'Log in',hi:'लॉग इन करें'},
  btn_signup:{en:'Sign up',hi:'साइन अप करें'},
  lbl_or:{en:'or',hi:'या'},
  btn_google:{en:'Continue with Google',hi:'Google से जारी रखें'},
  btn_phone:{en:'Continue with phone',hi:'फोन से जारी रखें'},
  phone_title:{en:'Sign in with phone',hi:'फोन से साइन इन करें'},
  lbl_phone:{en:'Phone number',hi:'फोन नंबर'},
  phone_hint:{en:'Include your country code, e.g. +91 for India.',hi:'अपना देश कोड शामिल करें, जैसे भारत के लिए +91।'},
  btn_send_otp:{en:'Send code',hi:'कोड भेजें'},
  otp_title:{en:'Enter the code',hi:'कोड डालें'},
  lbl_otp:{en:'6-digit code',hi:'6 अंकों का कोड'},
  btn_verify:{en:'Verify',hi:'सत्यापित करें'},
  auth_footer_note:{en:'Your data is stored securely in the cloud and synced across your devices.',hi:'आपका डेटा सुरक्षित रूप से क्लाउड में सेव होता है और आपके सभी डिवाइस पर सिंक होता है।'},
  verify_banner_text:{en:'Please verify your email so you can recover your account if you lose access.',hi:'कृपया अपना ईमेल सत्यापित करें ताकि पहुंच खोने पर आप अपना अकाउंट वापस पा सकें।'},
  btn_resend_verify:{en:'Resend email',hi:'ईमेल फिर से भेजें'},
  lbl_event_type:{en:'Event type',hi:'इवेंट का प्रकार'},
  lbl_event_name:{en:'Event name',hi:'इवेंट का नाम'},
  btn_cancel:{en:'Cancel',hi:'रद्द करें'},
  btn_edit_event:{en:'Edit event',hi:'इवेंट एडिट करें'},
  btn_delete_event:{en:'Delete this event',hi:'यह इवेंट हटाएं'},
  btn_create_event:{en:'Create event',hi:'इवेंट बनाएं'},
  btn_save_changes:{en:'Save changes',hi:'बदलाव सेव करें'},
  btn_edit:{en:'Edit',hi:'एडिट करें'},
  sec_add_income_event:{en:'Add income to this event',hi:'इस इवेंट में आय जोड़ें'},
  sec_add_expense_event:{en:'Add expense to this event',hi:'इस इवेंट में खर्च जोड़ें'},
  sec_entries_event:{en:'Entries for this event',hi:'इस इवेंट की एंट्रीज़'},
  sec_upi:{en:'UPI connection',hi:'UPI कनेक्शन'},
  streak_sub:{en:'Log something every day to keep it going',hi:'इसे जारी रखने के लिए हर दिन कुछ लॉग करें'},
  sec_quick_add:{en:'Quick add',hi:'झटपट जोड़ें'},
  upi_desc:{en:'Connect your favorite UPI app to auto-track payments. This feature is a work in progress.',hi:'भुगतान अपने आप ट्रैक करने के लिए अपना पसंदीदा UPI ऐप कनेक्ट करें। यह फीचर अभी बन रहा है।'},
  nav_upi:{en:'Smart Logger',hi:'स्मार्ट लॉगर'},
  stat_income:{en:'Income',hi:'आय'},
  stat_spent:{en:'Spent',hi:'खर्च'},
  stat_balance:{en:'Balance',hi:'बैलेंस'},
  stat_entries:{en:'Entries',hi:'एंट्रीज़'},
  menu_title:{en:'Menu',hi:'मेन्यू'},
  lbl_from:{en:'From',hi:'से'},
  lbl_sort:{en:'Sort',hi:'छांटें'},
  lbl_till:{en:'Till',hi:'तक'},
  msg_no_entries:{en:'No entries yet — log something!',hi:'अभी तक कोई एंट्री नहीं — कुछ लॉग करें!'},
  smart_logger_desc:{en:'Copy any UPI payment notification and paste it here. PocketTrack auto-detects the amount, merchant, and type — no manual typing needed!',hi:'कोई भी UPI भुगतान सूचना कॉपी करें और यहां पेस्ट करें। PocketTrack अपने आप राशि, मर्चेंट और प्रकार पहचान लेता है — मैनुअल टाइपिंग की ज़रूरत नहीं!'},
  smart_logger_how:{en:'How it works',hi:'यह कैसे काम करता है'},
  smart_logger_paste:{en:'Paste UPI notification',hi:'UPI सूचना पेस्ट करें'},
  smart_logger_supported:{en:'Supported apps',hi:'समर्थित ऐप्स'},
  smart_logger_supported_desc:{en:'Works with any app that sends a payment notification. Just copy the notification text and paste it!',hi:'किसी भी ऐप के साथ काम करता है जो भुगतान सूचना भेजता है। बस नोटिफिकेशन टेक्स्ट कॉपी करें और पेस्ट करें!'},
  smart_logger_recent:{en:'Recent smart logs',hi:'हाल के स्मार्ट लॉग्स'},
  smart_logger_no_logs:{en:'No smart logs yet. Paste a notification to get started!',hi:'अभी तक कोई स्मार्ट लॉग नहीं। शुरू करने के लिए कोई नोटिफिकेशन पेस्ट करें!'},
  btn_paste:{en:'Paste from clipboard',hi:'क्लिपबोर्ड से पेस्ट करें'},
  btn_parse:{en:'Auto-detect & log',hi:'ऑटो-डिटेक्ट और लॉग करें'},
  btn_confirm_log:{en:'Confirm & save',hi:'कन्फर्म और सेव करें'},
  btn_dismiss:{en:'Dismiss',hi:'खारिज करें'},
  smart_log_saved:{en:'Smart log saved!',hi:'स्मार्ट लॉग सेव हुआ!'},
  smart_log_placeholder:{en:'Paste your UPI notification here…\n\ne.g. Paid ₹150 to Samosa Shop via Google Pay',hi:'UPI सूचना यहां पेस्ट करें…\n\nजैसे: Google Pay से Samosa Shop को ₹150 भुगतान किया'},
  smart_log_parsed:{en:'Payment detected!',hi:'भुगतान मिला!'},
  smart_log_not_detected:{en:'Could not detect a valid UPI payment. Please try copying the notification again.',hi:'मान्य UPI भुगतान नहीं मिला। कृपया नोटिफिकेशन फिर से कॉपी करके देखें।'},
  sec_smart_logger:{en:'Smart Logger',hi:'स्मार्ट लॉगर'},
  step_copy:{en:'1. Copy notification',hi:'1. नोटिफिकेशन कॉपी करें'},
  step_copy_desc:{en:'Long-press any UPI text and copy',hi:'किसी भी UPI टेक्स्ट को दबाकर कॉपी करें'},
  step_paste:{en:'2. Paste here',hi:'2. यहां पेस्ट करें'},
  step_paste_desc:{en:'Paste the text in the box below',hi:'नीचे बॉक्स में टेक्स्ट पेस्ट करें'},
  step_log:{en:'3. Auto-logged!',hi:'3. ऑटो-लॉग हो गया!'},
  step_log_desc:{en:"Confirm and it's saved instantly", hi:'कन्फर्म करें और तुरंत सेव हो जाएगा'},
  step3_desc:{en:"Confirm and it's saved instantly", hi:'कन्फर्म करें और तुरंत सेव हो जाएगा'},
  nav_ledger:{en:'Ledger',hi:'खाता',hinglish:'Ledger',mr:'खातेवही',ta:'லெட்ஜர்',te:'లెడ్జర్',gu:'ખાતાવહી',bn:'লেজার'},
  btn_add_person:{en:'Add Person',hi:'व्यक्ति जोड़ें',hinglish:'Add Person',mr:'व्यक्ती जोडा',ta:'நபரைச் சேர்',te:'వ్యక్తిని జోడించు',gu:'વ્યક્તિ ઉમેરો',bn:'ব্যক্তি যোগ করুন'},
  ledger_total_owed_to_you:{en:'Total Owed to You',hi:'आपको मिलना बाकी',hinglish:'You will receive',mr:'तुम्हाला मिळणे बाकी',ta:'உங்களுக்கு வரவேண்டியது',te:'మీకు రావలసినది',gu:'તમને મળવાનું બાકી',bn:'আপনি পাবেন'},
  ledger_total_you_owe:{en:'You Owe',hi:'आपको देना है',hinglish:'You have to give',mr:'तुम्हाला देणे आहे',ta:'நீங்கள் தரவேண்டியது',te:'మీరు ఇవ్వవలసినది',gu:'તમારે આપવાનું છે',bn:'আপনি দেবেন'},
  voice_entry_title:{en:'Voice Expense Entry',hi:'बोल कर एंट्री करें',hinglish:'Voice Expense Entry'},
};
window.TRANSLATIONS = TRANSLATIONS;
let currentLang = localStorage.getItem('pocketTrackLang') || 'en';
window.currentLang = currentLang;

const PLACEHOLDER_TRANSLATIONS = {
  ph_email:{en:'you@example.com',hi:'you@example.com'},
  ph_pass:{en:'At least 6 characters',hi:'कम से कम 6 अक्षर'},
  ph_inc_note:{en:'e.g. Monthly allowance',hi:'जैसे मासिक भत्ता'},
  ph_exp_desc:{en:'e.g. Samosa at school, Auto to market...',hi:'जैसे स्कूल में समोसा, बाज़ार का ऑटो...'},
  ph_budget:{en:'e.g. 1000',hi:'जैसे 1000'},
  ph_event_name:{en:"e.g. Riya's Birthday Bash",hi:'जैसे रिया का जन्मदिन'},
  ph_event_desc:{en:'e.g. Turning 16, small get-together at home',hi:'जैसे 16 साल का जन्मदिन, घर पर छोटी सी पार्टी'},
  ph_ev_inc_note:{en:'e.g. From Grandma',hi:'जैसे दादी की तरफ से'},
  ph_ev_exp_desc:{en:'e.g. Cake order, Decorations...',hi:'जैसे केक ऑर्डर, सजावट...'},
  ph_sl_desc:{en:'Merchant or note',hi:'दुकान या नोट'},
  ph_sl_custom_cat:{en:'New category name',hi:'नई श्रेणी का नाम'},
  ph_inc_custom:{en:'e.g. Tuition income',hi:'जैसे ट्यूशन आय'},
  ph_exp_custom:{en:'e.g. Medical, Repairs',hi:'जैसे मेडिकल, मरम्मत'},
  ph_ev_inc_custom:{en:'e.g. Envelope gift',hi:'जैसे लिफाफे में उपहार'},
  ph_ev_exp_custom:{en:'e.g. Photography, Gifts',hi:'जैसे फोटोग्राफी, उपहार'},
};

function applyLanguage(){
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key = el.getAttribute('data-i18n');
    const entry = TRANSLATIONS[key];
    if(entry) el.textContent = entry[currentLang] || entry['hi'] || entry.en;
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(el=>{
    const key = el.getAttribute('data-i18n-ph');
    const entry = PLACEHOLDER_TRANSLATIONS[key];
    if(entry) el.placeholder = entry[currentLang] || entry['hi'] || entry.en;
  });
  document.querySelectorAll('option[data-hi]').forEach(opt=>{
    if(!opt.dataset.enText) opt.dataset.enText = opt.textContent; // cache original English on first run
    opt.textContent = (currentLang==='hi' || currentLang==='hinglish' || currentLang==='mr') ? opt.getAttribute('data-hi') : opt.dataset.enText;
  });
  updateLanguageTabUI();
  // re-render dynamic sections so their generated text (category names, empty states) updates too
  if(document.getElementById('tab-entries').style.display!=='none') {
    if(typeof renderEntries==='function') renderEntries();
  }
  if(document.getElementById('tab-report').style.display!=='none'){
    if(typeof renderReport==='function') renderReport();
    const tipEl=document.getElementById('money-tip-text');
    if(tipEl && lastTipIndex>=0) tipEl.textContent = MONEY_TIPS[lastTipIndex][currentLang] || MONEY_TIPS[lastTipIndex].en;
  }
  if(currentEventId) renderEventDetail();
  else if(document.getElementById('tab-events').style.display!=='none') renderEventsList();
  // Ledger + Pro are JS-generated — re-render so they translate too.
  if(typeof renderLedger==='function') renderLedger();
  if(typeof renderProTab==='function') renderProTab();
  if(typeof ptSyncGates==='function') ptSyncGates();
  checkBudget();
  renderStreak();
  if(typeof renderHomeSnapshot==='function') renderHomeSnapshot();
  if(typeof renderFinancialDNACard==='function') renderFinancialDNACard();
  if(typeof renderWrappedButton==='function') renderWrappedButton();
  if(typeof renderDailyBurnMeter==='function') renderDailyBurnMeter();
  if(typeof renderDigitalVault==='function') renderDigitalVault();
  if(typeof renderActiveGoalCard==='function') renderActiveGoalCard();
  if(typeof renderPortfolioSwitcher==='function') renderPortfolioSwitcher();
  updateSmartLogPlaceholder();
}

function updateSmartLogPlaceholder(){
  var ta = document.getElementById('smart-log-input');
  if(!ta) return;
  var entry = TRANSLATIONS['smart_log_placeholder'];
  if(entry) ta.placeholder = entry[currentLang] || entry.en;
}

const SUPPORTED_LANGS = {
  en: 'English',
  hi: 'हिंदी (Hindi)',
  hinglish: 'हिंग्लिश (Hinglish)',
  mr: 'मराठी (Marathi)',
  ta: 'தமிழ் (Tamil)',
  te: 'తెలుగు (Telugu)',
  gu: 'ગુજરાતી (Gujarati)',
  bn: 'বাংলা (Bengali)'
};

function updateLanguageTabUI(){
  Object.keys(SUPPORTED_LANGS).forEach(l => {
    const btn = document.getElementById('lang-opt-' + l);
    if(btn) btn.classList.toggle('active', currentLang === l);
  });
}

function setLanguage(lang){
  if(lang===currentLang)return;
  currentLang = lang;
  localStorage.setItem('pocketTrackLang', currentLang);
  applyLanguage();
  const label = SUPPORTED_LANGS[lang] || lang;
  toast('Switched language to ' + label, 'success');
}



let currentUser = null;
let unsubscribeEntries = null;

const CAT_LABELS_BI = {
  custom:{en:'Custom category',hi:'कस्टम श्रेणी'},
  food:{en:'Food & snacks',hi:'खाना और नाश्ता'},
  travel:{en:'Travel',hi:'यात्रा'},
  friends:{en:'Friends & social',hi:'दोस्त और सोशल'},
  home:{en:'Home & bills',hi:'घर और बिल'},
  shopping:{en:'Shopping',hi:'शॉपिंग'},
  entertainment:{en:'Entertainment',hi:'मनोरंजन'},
  health:{en:'Health',hi:'स्वास्थ्य'},
  education:{en:'Education',hi:'शिक्षा'},
  work:{en:'Work',hi:'काम'},
  other:{en:'Others',hi:'अन्य'},
  income:{en:'Income',hi:'आय'},
};
function CAT_LABEL(cat){ return (CAT_LABELS_BI[cat] && CAT_LABELS_BI[cat][currentLang]) || cat; }
function displayCatLabel(e){ return (e.cat==='custom' && e.customCat) ? e.customCat : CAT_LABEL(e.cat); }
window.CAT_LABEL = CAT_LABEL;
window.displayCatLabel = displayCatLabel;
const CAT_LABELS = new Proxy({}, { get: (_, cat) => CAT_LABEL(cat) }); // backward-compatible drop-in
window.CAT_LABELS = CAT_LABELS;

const MSG = {
  no_entries_log:{en:'No entries yet — log something!',hi:'अभी तक कोई एंट्री नहीं — कुछ लॉग करें!'},
  no_events_yet:{en:'No events yet — tap "Add event" to create your first one',hi:'अभी तक कोई इवेंट नहीं — अपना पहला इवेंट बनाने के लिए "Add event" दबाएं'},
  no_entries_event:{en:'No entries yet for this event',hi:'इस इवेंट में अभी तक कोई एंट्री नहीं'},
  no_entries_range:{en:'No entries in this range',hi:'इस अवधि में कोई एंट्री नहीं'},
  no_expenses:{en:'No expenses logged yet',hi:'अभी तक कोई खर्च दर्ज नहीं'},
  nothing_period:{en:'Nothing in this period',hi:'इस अवधि में कुछ नहीं'},
  income_added:{en:'Income added!',hi:'आय जोड़ी गई!'},
  income_updated:{en:'Income updated!',hi:'आय अपडेट हुई!'},
  expense_added:{en:'Expense added!',hi:'खर्च जोड़ा गया!'},
  expense_updated:{en:'Expense updated!',hi:'खर्च अपडेट हुआ!'},
  entry_deleted:{en:'Entry deleted',hi:'एंट्री हटाई गई'},
  event_created:{en:'Event created!',hi:'इवेंट बनाया गया!'},
  event_updated:{en:'Event updated!',hi:'इवेंट अपडेट हुआ!'},
  event_deleted:{en:'Event deleted',hi:'इवेंट हटाया गया'},
  income_added_event:{en:'Income added to event!',hi:'इवेंट में आय जोड़ी गई!'},
  expense_added_event:{en:'Expense added to event!',hi:'इवेंट में खर्च जोड़ा गया!'},
  budget_saved:{en:'Budget saved!',hi:'बजट सेव हुआ!'},
  notifs_enabled:{en:'Notifications enabled!',hi:'सूचनाएं चालू हुईं!'},
  editing_entry:{en:'Editing entry — make changes and save',hi:'एंट्री एडिट हो रही है — बदलाव करें और सेव करें'},
  give_event_name:{en:'Give your event a name',hi:'अपने इवेंट को एक नाम दें'},
  enter_valid_amount:{en:'Enter a valid amount between ₹0.01 and ₹1,00,00,000',hi:'₹0.01 से ₹1,00,00,000 के बीच सही राशि डालें'},
  enter_valid_date:{en:'Enter a valid date',hi:'सही तारीख डालें'},
  add_description:{en:'Add a description',hi:'विवरण जोड़ें'},
  all_cleared:{en:'All entries cleared',hi:'सभी एंट्रीज़ हटा दी गईं'},
  report_copied:{en:'Report copied to clipboard!',hi:'रिपोर्ट क्लिपबोर्ड में कॉपी हुई!'},
  not_logged_in:{en:'Not logged in',hi:'लॉग इन नहीं है'},
};
function TT(key){
  const entry = MSG[key] || TRANSLATIONS[key];
  if(!entry) return key;
  return entry[currentLang] || entry['hi'] || entry.en || key;
}
window.TT = TT;

// --- Money-saving tips (rotates a random tip each time, bilingual) ---
const MONEY_TIPS = [
  {en:"Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings. It's simple and keeps you on track without tracking every rupee.",hi:"50/30/20 नियम आज़माएं: 50% ज़रूरतें, 30% इच्छाएं, 20% बचत। यह सरल है और हर रुपया ट्रैक किए बिना भी आपको सही राह पर रखता है।"},
  {en:"Wait 24 hours before any non-essential purchase over ₹500. Most urges fade — and you'll save without even trying.",hi:"₹500 से ज़्यादा की किसी भी गैर-ज़रूरी खरीद से पहले 24 घंटे रुकें। ज़्यादातर इच्छाएं खुद खत्म हो जाती हैं — और आप बिना कोशिश किए बचत कर लेंगे।"},
  {en:"Round up every expense to the nearest ₹10 and put the difference aside. Small change adds up faster than you'd think.",hi:"हर खर्च को नज़दीकी ₹10 तक राउंड करें और बचा हुआ पैसा अलग रख दें। छोटी बचत सोच से जल्दी बढ़ती है।"},
  {en:"Set a weekly budget (you already can, right here!) — people who track weekly, not just monthly, catch overspending 3x faster.",hi:"साप्ताहिक बजट सेट करें (आप यह यहीं कर सकते हैं!) — जो लोग सिर्फ महीने भर की बजाय हर हफ्ते ट्रैक करते हैं, वे अधिक खर्च को 3 गुना तेज़ी से पकड़ लेते हैं।"},
  {en:"Before subscribing to anything, ask: 'Would I pay for this again next month?' If you hesitate, skip it.",hi:"किसी भी सब्सक्रिप्शन से पहले खुद से पूछें: 'क्या मैं अगले महीने भी इसके लिए भुगतान करूंगा?' अगर झिझक हो, तो छोड़ दें।"},
  {en:"Cook one extra meal at home each week instead of ordering — over a year, that alone can save thousands.",hi:"हर हफ्ते बाहर से मंगाने की बजाय एक अतिरिक्त बार घर पर खाना बनाएं — साल भर में यह अकेला हज़ारों रुपये बचा सकता है।"},
  {en:"Keep small cash gifts and change in a separate 'no-spend' jar — out of sight often means it actually gets saved.",hi:"छोटे नकद उपहार और बचे हुए पैसे एक अलग 'नो-स्पेंड' डिब्बे में रखें — आंखों से दूर होने पर अक्सर वह सच में बच जाता है।"},
  {en:"Review your category breakdown here once a week — just seeing where money goes tends to naturally reduce overspending.",hi:"यहां अपनी श्रेणी अनुसार खर्च की सूची हफ्ते में एक बार देखें — बस यह देखना कि पैसा कहां जा रहा है, अक्सर अपने आप ज़्यादा खर्च को कम कर देता है।"},
  {en:"Use the Events feature for big occasions — separating event spending from daily spending stops one wedding from wrecking your monthly budget.",hi:"बड़े मौकों के लिए Events फीचर का उपयोग करें — इवेंट के खर्च को रोज़ के खर्च से अलग रखने से एक शादी आपके महीने के बजट को नहीं बिगाड़ती।"},
  {en:"Name your savings goal (even something small like 'new shoes'). Money saved toward a named goal is far less likely to get spent on impulse.",hi:"अपने बचत लक्ष्य को एक नाम दें (जैसे 'नए जूते')। किसी नामित लक्ष्य के लिए बचाया गया पैसा जल्दी खर्च होने की संभावना बहुत कम होती है।"},
];
let lastTipIndex=-1;
function showNextTip(){
  let idx;
  do{ idx=Math.floor(Math.random()*MONEY_TIPS.length); }while(idx===lastTipIndex && MONEY_TIPS.length>1);
  lastTipIndex=idx;
  const tipEl=document.getElementById('money-tip-text');
  if(tipEl) tipEl.textContent = MONEY_TIPS[idx][currentLang] || MONEY_TIPS[idx].en;
}

const CAT_COLORS = {food:'#4ade80',travel:'#60a5fa',friends:'#ffb84d',home:'#ff7eb3',shopping:'#c084fc',entertainment:'#f472b6',health:'#fb7185',education:'#fbbf24',work:'#22d3ee',other:'#9b95c2',custom:'#c4a8ff'};
window.CAT_COLORS = CAT_COLORS;
var entries = (function() {
  try {
    const cached = localStorage.getItem('pockettrack_entries_cache');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch(e){}
  return [];
})();
window.entries = entries;

function mainEntries(){
  const list = (typeof window !== 'undefined' && Array.isArray(window.entries)) ? window.entries : (typeof entries !== 'undefined' && Array.isArray(entries) ? entries : []);
  const base = list.filter(e=>!e.event);
  const activeW = (typeof window !== 'undefined' && window.activeWalletId) ? window.activeWalletId : (typeof activeWalletId !== 'undefined' ? activeWalletId : 'all');
  if (activeW && activeW !== 'all') {
    return base.filter(e => {
      const wId = (typeof resolveEntryWalletId === 'function') ? resolveEntryWalletId(e) : (e.walletId || (e.type === 'income' ? 'bank' : 'cash'));
      return wId === activeW;
    });
  }
  return base;
}
window.mainEntries = mainEntries;
function allRawMainEntries(){
  const list = (typeof window !== 'undefined' && Array.isArray(window.entries)) ? window.entries : (typeof entries !== 'undefined' && Array.isArray(entries) ? entries : []);
  return list.filter(e=>!e.event);
}
window.allRawMainEntries = allRawMainEntries;
let period = 'week';
window.period = period;

function dateToStr(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function todayStr(){return dateToStr(new Date())}
function fmtDate(d){return new Date(d+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
window.dateToStr = dateToStr;
window.todayStr = todayStr;
window.fmtDate = fmtDate;

// --- Validation & sanitization helpers ---
const MAX_AMT = 999999999;
function escapeHTML(str){
  const div=document.createElement('div');
  div.textContent=str;
  return div.innerHTML;
}
window.escapeHTML = escapeHTML;
function isValidAmount(amt){
  return typeof amt==='number' && isFinite(amt) && amt>0 && amt<=MAX_AMT;
}
function isValidDate(d){
  if(!d) return false;
  const dt=new Date(d+'T00:00:00');
  if(isNaN(dt.getTime())) return false;
  const today=new Date(); today.setHours(0,0,0,0);
  const min=new Date('2000-01-01');
  const max=new Date(today); max.setFullYear(max.getFullYear()+1);
  return dt>=min && dt<=max;
}
window.isValidAmount = isValidAmount;
window.isValidDate = isValidDate;

// --- Shows/hides the "type your own" field when "+ Add Source/Category" is picked ---
// prefix: 'inc' -> inc-src, 'exp' -> exp-cat, 'ev-inc' -> ev-inc-src, 'ev-exp' -> ev-exp-cat, 'event-type' -> new-event-type
function toggleAddCustomField(prefix){
  const selectId = (prefix==='exp'||prefix==='ev-exp') ? prefix+'-cat' : (prefix==='event-type' ? 'new-event-type' : prefix+'-src');
  const wrapId = prefix+'-custom-wrap';
  const select=document.getElementById(selectId);
  const wrap=document.getElementById(wrapId);
  if(!select||!wrap)return;
  const isCustom = select.value==='__add_new__';
  wrap.style.display = isCustom ? 'block' : 'none';
  if(!isCustom){
    const input=wrap.querySelector('input');
    if(input) input.value='';
  }
}

// --- In-app toast notifications (replaces browser alert popups) ---
function toast(message, type){
  type = type || 'info'; // 'success', 'error', 'info'
  const colors = {success:'#4ade80', error:'#ff6b6b', info:'#9b6bff'};
  const el = document.createElement('div');
  el.textContent = message;
  el.style.cssText = `background:#1f1840;border:1px solid ${colors[type]};color:#fff;padding:10px 18px;border-radius:12px;font-size:13.5px;box-shadow:0 8px 24px rgba(0,0,0,0.4);opacity:0;transform:translateY(10px);transition:opacity 0.25s,transform 0.25s;max-width:90vw;text-align:center`;
  document.getElementById('toast-container').appendChild(el);
  requestAnimationFrame(()=>{el.style.opacity='1';el.style.transform='translateY(0)'});
  setTimeout(()=>{
    el.style.opacity='0'; el.style.transform='translateY(10px)';
    setTimeout(()=>el.remove(), 250);
  }, 2200);
}

// --- Custom in-app popups (replaces native browser alert/confirm) ---
function showAppAlert(message, title){
  title = title || (currentLang==='hi' ? 'सूचना' : 'Notice');
  document.getElementById('app-modal-title').textContent = title;
  document.getElementById('app-modal-message').textContent = message;
  const okLabel = currentLang==='hi' ? 'ठीक है' : 'OK';
  document.getElementById('app-modal-buttons').innerHTML = `<button class="btn primary" style="flex:1" onclick="closeAppModal()">${okLabel}</button>`;
  document.getElementById('app-modal-backdrop').style.display='flex';
}

function showAppConfirm(message, onConfirm, title){
  title = title || (currentLang==='hi' ? 'पुष्टि करें' : 'Please confirm');
  document.getElementById('app-modal-title').textContent = title;
  document.getElementById('app-modal-message').textContent = message;
  const yesLabel = currentLang==='hi' ? 'हां' : 'Yes';
  const cancelLabel = currentLang==='hi' ? 'रद्द करें' : 'Cancel';
  document.getElementById('app-modal-buttons').innerHTML = `
    <button class="btn" style="flex:1" onclick="closeAppModal()">${cancelLabel}</button>
    <button class="btn danger" style="flex:1" id="app-modal-confirm-btn">${yesLabel}</button>
  `;
  document.getElementById('app-modal-confirm-btn').onclick = ()=>{ closeAppModal(); onConfirm(); };
  document.getElementById('app-modal-backdrop').style.display='flex';
}


function showAppPrompt(message, defaultValue, onConfirm, title){
  title = title || (currentLang==='hi' ? 'नया नाम' : 'Enter new name');
  document.getElementById('app-modal-title').textContent = title;
  document.getElementById('app-modal-message').innerHTML = `
    <p style="margin-bottom:12px">${message}</p>
    <input type="text" id="app-prompt-input" value="${escapeHTML(defaultValue)}"
      style="width:100%;padding:10px 12px;border-radius:10px;border:1px solid var(--border);background:rgba(255,255,255,0.05);color:var(--text);font-size:14px"
      onkeydown="if(event.key==='Enter')document.getElementById('app-prompt-confirm-btn').click()"
    >
  `;
  const okLabel = currentLang==='hi' ? 'ठीक है' : 'OK';
  const cancelLabel = currentLang==='hi' ? 'रद्द करें' : 'Cancel';
  document.getElementById('app-modal-buttons').innerHTML = `
    <button class="btn" style="flex:1" onclick="closeAppModal()">${cancelLabel}</button>
    <button class="btn primary" style="flex:1" id="app-prompt-confirm-btn">${okLabel}</button>
  `;
  document.getElementById('app-prompt-confirm-btn').onclick = ()=>{
    const val = document.getElementById('app-prompt-input').value;
    closeAppModal();
    onConfirm(val);
  };
  document.getElementById('app-modal-backdrop').style.display='flex';
  setTimeout(()=>document.getElementById('app-prompt-input')?.focus(), 50);
}

function closeAppModal(){
  document.getElementById('app-modal-backdrop').style.display='none';
}

// --- Auth handling ---
// --- Generic helper: disables a button + shows a spinner while an async action runs ---
async function withButtonLoading(btnId, fn){
  const btn=document.getElementById(btnId);
  if(!btn){ await fn(); return; }
  if(btn.disabled) return; // already in-flight, ignore extra taps
  const originalHTML=btn.innerHTML;
  btn.disabled=true;
  btn.style.opacity='0.65';
  btn.style.cursor='not-allowed';
  btn.innerHTML='<span class="mini-spinner"></span>';
  try{
    await fn();
  } finally {
    btn.disabled=false;
    btn.style.opacity='1';
    btn.style.cursor='pointer';
    btn.innerHTML=originalHTML;
  }
}


let weeklyBudget=0;
let monthlyBudget=0;
let budgetPeriod='weekly'; // which one the Report card is currently showing/editing
// Multi-category budgets: { food: 3000, travel: 1000, ... } (0/absent = no cap)
let categoryBudgets = {};
// Ordered list of budgetable expense categories (standard + user-added custom ones)
function budgetableCats(){
  const base = ['food','travel','friends','home','shopping','entertainment','health','education','work','other'];
  const out = base.slice();
  (customExpenseCategories||[]).forEach(n=>{ if(!out.includes(n)) out.push(n); });
  return out;
}
function totalBudget(){ // sum of all category budgets (used for the Health Score)
  const sum = Object.values(categoryBudgets).reduce((a,b)=>a+(Number(b)||0),0);
  return sum || (budgetPeriod==='weekly'? weeklyBudget : monthlyBudget);
}
window.totalBudget = totalBudget;
window.weeklyBudget = weeklyBudget;
window.monthlyBudget = monthlyBudget;
window.budgetPeriod = budgetPeriod;

function setBudgetPeriod(period){
  budgetPeriod=period;
  document.querySelectorAll('#budget-period-toggle button').forEach((btn,i)=>{
    btn.classList.toggle('active', (period==='weekly'&&i===0)||(period==='monthly'&&i===1));
  });
  renderBudgetEditor();
  checkBudget();
}

let customIncomeSources=[];
let customExpenseCategories=[];

async function loadBudget(){
  if(!currentUser)return;
  try{
    const doc=await db.collection('users').doc(currentUser.uid).get();
    weeklyBudget = (doc.exists && doc.data().weeklyBudget) || 0;
    monthlyBudget = (doc.exists && doc.data().monthlyBudget) || 0;
    categoryBudgets = (doc.exists && doc.data().categoryBudgets) || {};
    customIncomeSources = (doc.exists && doc.data().customIncomeSources) || [];
    customExpenseCategories = (doc.exists && doc.data().customExpenseCategories) || [];
    renderBudgetEditor();
    checkBudget();
    renderCustomOptions();
  }catch(e){console.error(e);}
}

// --- Injects previously-created custom sources/categories into all 4 relevant dropdowns, right before "+ Add" ---
function renderCustomOptions(){
  const incomeSelects=['inc-src','ev-inc-src'];
  const expenseSelects=['exp-cat','ev-exp-cat'];

  incomeSelects.forEach(id=>{
    const sel=document.getElementById(id);
    if(!sel)return;
    const currentVal=sel.value;
    [...sel.querySelectorAll('option[data-custom]')].forEach(o=>o.remove());
    const addOpt=sel.querySelector('option[value="__add_new__"]');
    customIncomeSources.forEach(name=>{
      const opt=document.createElement('option');
      opt.value=name; opt.textContent=name; opt.setAttribute('data-custom','1');
      sel.insertBefore(opt, addOpt);
    });
    if([...sel.options].some(o=>o.value===currentVal)) sel.value=currentVal;
  });

  expenseSelects.forEach(id=>{
    const sel=document.getElementById(id);
    if(!sel)return;
    const currentVal=sel.value;
    [...sel.querySelectorAll('option[data-custom]')].forEach(o=>o.remove());
    const addOpt=sel.querySelector('option[value="__add_new__"]');
    customExpenseCategories.forEach(name=>{
      const opt=document.createElement('option');
      opt.value='custom:'+name; opt.textContent=name; opt.setAttribute('data-custom','1');
      sel.insertBefore(opt, addOpt);
    });
    if([...sel.options].some(o=>o.value===currentVal)) sel.value=currentVal;
  });

  renderCustomChips();
}

function renderCustomChips(){
  const incLink=document.getElementById('inc-manage-link');
  if(incLink) incLink.style.display = customIncomeSources.length ? 'block' : 'none';
  const expLink=document.getElementById('exp-manage-link');
  if(expLink) expLink.style.display = customExpenseCategories.length ? 'block' : 'none';
}

let manageOptionsMode=null; // 'income' or 'expense'

function openManageOptions(mode){
  manageOptionsMode=mode;
  document.getElementById('manage-modal-title').textContent = mode==='income' ? TT('lnk_manage_sources') : TT('lnk_manage_categories');
  renderManageOptionsList();
  document.getElementById('manage-modal-backdrop').style.display='flex';
}

function closeManageOptions(){
  document.getElementById('manage-modal-backdrop').style.display='none';
}

function renderManageOptionsList(){
  const list = manageOptionsMode==='income' ? customIncomeSources : customExpenseCategories;
  const listEl=document.getElementById('manage-modal-list');
  if(!list.length){
    listEl.innerHTML = `<p class="empty">${manageOptionsMode==='income' ? TT('no_custom_sources') : TT('no_custom_categories')}</p>`;
    return;
  }
  listEl.innerHTML = list.map(name=>`
    <div class="entry-row">
      <span style="flex:1;color:var(--text)">${escapeHTML(name)}</span>
      <div class="row-actions">
        <button class="icon-btn" onclick="startEditCustomOption('${escapeHTML(name).replace(/'/g,"\\'")}')" aria-label="edit">✏️</button>
        <button class="icon-btn" onclick="confirmDeleteCustomOption('${escapeHTML(name).replace(/'/g,"\\'")}')" aria-label="delete">🗑️</button>
      </div>
    </div>`).join('');
}

function startEditCustomOption(oldName){
  showAppPrompt(
    currentLang==='hi' ? 'नया नाम डालें:' : 'Enter new name:',
    oldName,
    (newName)=>{
      if(!newName || !newName.trim() || newName.trim()===oldName) return;
      const trimmed=newName.trim().slice(0,40);
      if(manageOptionsMode==='income') renameCustomIncomeSource(oldName, trimmed);
      else renameCustomExpenseCategory(oldName, trimmed);
    }
  );
}

function confirmDeleteCustomOption(name){
  showAppConfirm(
    currentLang==='hi' ? `"${name}" हटाएं?` : `Delete "${name}"?`,
    ()=>{
      if(manageOptionsMode==='income') removeCustomIncomeSource(name);
      else removeCustomExpenseCategory(name);
      setTimeout(renderManageOptionsList, 300);
    }
  );
}

async function renameCustomIncomeSource(oldName, newName){
  if(!currentUser)return;
  try{
    customIncomeSources = customIncomeSources.map(n=>n===oldName?newName:n);
    await db.collection('users').doc(currentUser.uid).update({
      customIncomeSources: firebase.firestore.FieldValue.arrayRemove(oldName)
    });
    await db.collection('users').doc(currentUser.uid).update({
      customIncomeSources: firebase.firestore.FieldValue.arrayUnion(newName)
    });
    toast(currentLang==='hi'?'स्रोत का नाम बदला गया':'Source renamed','success');
    renderCustomOptions();
    renderManageOptionsList();
  }catch(e){toast('Could not rename: '+e.message,'error');}
}

async function renameCustomExpenseCategory(oldName, newName){
  if(!currentUser)return;
  try{
    customExpenseCategories = customExpenseCategories.map(n=>n===oldName?newName:n);
    await db.collection('users').doc(currentUser.uid).update({
      customExpenseCategories: firebase.firestore.FieldValue.arrayRemove(oldName)
    });
    await db.collection('users').doc(currentUser.uid).update({
      customExpenseCategories: firebase.firestore.FieldValue.arrayUnion(newName)
    });
    toast(currentLang==='hi'?'श्रेणी का नाम बदला गया':'Category renamed','success');
    renderCustomOptions();
    renderManageOptionsList();
  }catch(e){toast('Could not rename: '+e.message,'error');}
}


async function removeCustomIncomeSource(name){
  if(!currentUser)return;
  customIncomeSources=customIncomeSources.filter(n=>n!==name);
  try{
    await db.collection('users').doc(currentUser.uid).set(
      {customIncomeSources: firebase.firestore.FieldValue.arrayRemove(name)}, {merge:true}
    );
    toast(currentLang==='hi'?'स्रोत हटाया गया':'Source removed','success');
    renderCustomOptions();
  }catch(e){toast('Could not remove: '+e.message,'error');}
}

async function removeCustomExpenseCategory(name){
  if(!currentUser)return;
  customExpenseCategories=customExpenseCategories.filter(n=>n!==name);
  try{
    await db.collection('users').doc(currentUser.uid).set(
      {customExpenseCategories: firebase.firestore.FieldValue.arrayRemove(name)}, {merge:true}
    );
    toast(currentLang==='hi'?'श्रेणी हटाई गई':'Category removed','success');
    renderCustomOptions();
  }catch(e){toast('Could not remove: '+e.message,'error');}
}

async function saveCustomIncomeSource(name){
  if(!currentUser || customIncomeSources.includes(name))return;
  customIncomeSources.push(name);
  try{
    await db.collection('users').doc(currentUser.uid).set(
      {customIncomeSources: firebase.firestore.FieldValue.arrayUnion(name)}, {merge:true}
    );
    renderCustomOptions();
  }catch(e){console.error('Could not save custom source:',e);}
}

async function saveCustomExpenseCategory(name){
  if(!currentUser || customExpenseCategories.includes(name))return;
  customExpenseCategories.push(name);
  try{
    await db.collection('users').doc(currentUser.uid).set(
      {customExpenseCategories: firebase.firestore.FieldValue.arrayUnion(name)}, {merge:true}
    );
    renderCustomOptions();
  }catch(e){console.error('Could not save custom category:',e);}
}

async function saveBudget(){
  if(!currentUser){toast(TT('not_logged_in'),'error');return;}
  const next = {};
  budgetableCats().forEach(c=>{
    const el = document.getElementById('budget-'+c);
    const v = el ? parseFloat(el.value) : NaN;
    if(isFinite(v) && v>=0) next[c] = v;
  });
  try{
    await db.collection('users').doc(currentUser.uid).set({categoryBudgets:next},{merge:true});
    categoryBudgets = next;
    toast(TT('budget_saved'),'success');
    renderBudgetEditor();
    checkBudget();
    if(typeof renderHealthScore==='function') renderHealthScore();
  }catch(e){toast('Could not save budget: '+e.message,'error');}
}

function getPeriodExpenseByCat(){
  const list = budgetPeriod==='weekly' ? getThisWeekEntries() : getThisMonthEntries();
  const map = {};
  list.filter(e=>e.type==='expense').forEach(e=>{ map[e.cat] = (map[e.cat]||0)+e.amt; });
  return map;
}

// Build the Budget editor with Simple 1-Number Mode by default + Optional Category Breakdown
window.budgetViewMode = localStorage.getItem('pockettrack_budget_view_mode') || 'simple';
window.budgetPeriod = localStorage.getItem('pockettrack_budget_period') || 'monthly';

window.setBudgetViewMode = function(mode) {
  window.budgetViewMode = mode;
  localStorage.setItem('pockettrack_budget_view_mode', mode);
  renderBudgetEditor();
};

window.setBudgetPeriod = function(period) {
  window.budgetPeriod = period;
  localStorage.setItem('pockettrack_budget_period', period);
  renderBudgetEditor();
  if (typeof renderReport === 'function') renderReport();
};

window.getSavedWeeklyBudget = function(wId) {
  const w = wId !== undefined ? wId : (typeof activeWalletId !== 'undefined' ? activeWalletId : 'all');
  if (w && w !== 'all') {
    const customKey = 'pockettrack_budget_weekly_' + w;
    const val = localStorage.getItem(customKey);
    if (val) return parseFloat(val) || 0;
    if (w === 'cash') return 1500;
    if (w === 'bank') return 5000;
    if (w === 'card') return 3000;
    return 2500;
  }
  return parseFloat(localStorage.getItem('pockettrack_total_weekly_budget')) || 3500;
};

window.getSavedMonthlyBudget = function(wId) {
  const w = wId !== undefined ? wId : (typeof activeWalletId !== 'undefined' ? activeWalletId : 'all');
  if (w && w !== 'all') {
    const customKey = 'pockettrack_budget_monthly_' + w;
    const val = localStorage.getItem(customKey);
    if (val) return parseFloat(val) || 0;
    if (w === 'cash') return 5000;
    if (w === 'bank') return 20000;
    if (w === 'card') return 10000;
    return 10000;
  }
  return parseFloat(localStorage.getItem('pockettrack_total_monthly_budget')) || 15000;
};

window.getSavedTotalBudget = function(period, wId) {
  const p = period || window.budgetPeriod || 'monthly';
  return (p === 'weekly') ? window.getSavedWeeklyBudget(wId) : window.getSavedMonthlyBudget(wId);
};

window.setSavedTotalBudget = function(amt, period, wId) {
  const p = period || window.budgetPeriod || 'monthly';
  const w = wId !== undefined ? wId : (typeof activeWalletId !== 'undefined' ? activeWalletId : 'all');
  if (amt > 0) {
    if (w && w !== 'all') {
      const key = `pockettrack_budget_${p}_${w}`;
      localStorage.setItem(key, amt);
      const wObj = (typeof userWallets !== 'undefined') ? userWallets.find(x => x.id === w) : null;
      const wLabel = wObj ? `${wObj.icon} ${wObj.name}` : w;
      if (typeof toast === 'function') toast(`${wLabel} ${p} budget set to ₹${amt.toLocaleString('en-IN')}`, 'success');
    } else {
      if (p === 'weekly') {
        localStorage.setItem('pockettrack_total_weekly_budget', amt);
        if (typeof toast === 'function') toast(`Weekly budget set to ₹${amt.toLocaleString('en-IN')}`, 'success');
      } else {
        localStorage.setItem('pockettrack_total_monthly_budget', amt);
        if (typeof toast === 'function') toast(`Monthly budget set to ₹${amt.toLocaleString('en-IN')}`, 'success');
      }
    }
    renderBudgetEditor();
    if (typeof renderReport === 'function') renderReport();
  }
};

window.openSetBudgetModal = function(preferredPeriod, targetWalletId) {
  let activeP = preferredPeriod || window.budgetPeriod || 'monthly';
  let curTargetW = targetWalletId !== undefined ? targetWalletId : ((typeof window.budgetSelectedWallet !== 'undefined' && window.budgetSelectedWallet) ? window.budgetSelectedWallet : ((typeof activeWalletId !== 'undefined') ? activeWalletId : 'all'));
  const isHi = (typeof currentLang !== 'undefined' && currentLang === 'hi');
  
  let container = document.getElementById('pt-sheet-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'pt-sheet-container';
    container.className = 'pt-sheet-backdrop';
    container.onclick = function(e) {
      if (e.target === container) window.closeCustomSheet();
    };
    document.body.appendChild(container);
  }

  function renderModalContent(p, wId) {
    activeP = p;
    curTargetW = wId !== undefined ? wId : curTargetW;
    const isWeek = (p === 'weekly');
    const wObj = (typeof userWallets !== 'undefined') ? userWallets.find(x => x.id === curTargetW) : null;
    const wLabel = wObj ? `${wObj.icon} ${wObj.name}` : (isHi ? '🌐 सभी वॉलेट' : '🌐 All Wallets');
    const current = isWeek ? window.getSavedWeeklyBudget(curTargetW) : window.getSavedMonthlyBudget(curTargetW);
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const divisor = isWeek ? 7 : daysInMonth;
    const initialDaily = Math.round(current / divisor);
    const chips = isWeek ? [2000, 3500, 5000, 7500, 10000] : [10000, 15000, 25000, 50000, 100000];

    const walletOptions = [
      { id: 'all', name: isHi ? 'सभी वॉलेट' : 'All Wallets', icon: '🌐' },
      ...((typeof userWallets !== 'undefined' && userWallets.length) ? userWallets : [
        { id: 'cash', name: 'Cash', icon: '💵' },
        { id: 'bank', name: 'Bank / UPI', icon: '📱' },
        { id: 'card', name: 'Credit Card', icon: '💳' }
      ])
    ];

    container.innerHTML = `
      <div class="pt-sheet-panel" style="max-width:460px;">
        <div class="pt-sheet-handle"></div>
        
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:24px;">🎯</span>
            <div>
              <h3 style="margin:0;font-size:18px;font-weight:800;color:#fff;font-family:'Space Grotesk',sans-serif;">${isHi ? 'वॉलेट बजट लक्ष्य' : 'Wallet Budget Target'}</h3>
              <span style="font-size:11.5px;color:var(--accent-bright,#c4b5fd);font-weight:700;">${wLabel}</span>
            </div>
          </div>
          <button onclick="closeCustomSheet()" style="background:rgba(255,255,255,0.08);border:none;color:#fff;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:16px;">✕</button>
        </div>

        <div style="margin-bottom:12px;">
          <label style="font-size:11.5px;font-weight:700;color:#cbd5e1;display:block;margin-bottom:6px;">${isHi ? 'वॉलेट चुनें:' : 'Select Wallet / Account:'}</label>
          <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:4px;" class="custom-scroll">
            ${walletOptions.map(w => `
              <button type="button" onclick="window._switchBudgetModalWallet('${w.id}')" style="background:${w.id === curTargetW ? 'linear-gradient(135deg,#8b5cf6,#6366f1)' : 'rgba(255,255,255,0.05)'};border:1px solid ${w.id === curTargetW ? '#a78bfa' : 'rgba(255,255,255,0.12)'};color:#fff;padding:6px 12px;border-radius:12px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;display:flex;align-items:center;gap:5px;">
                <span>${w.icon || '💳'}</span> <span>${escapeHTML(w.name)}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <div class="toggle-grp" style="margin-bottom:14px;width:100%;display:flex;">
          <button class="${isWeek ? 'active' : ''}" onclick="window._switchBudgetModalTab('weekly')" style="flex:1;">📅 ${isHi ? 'साप्ताहिक' : 'Weekly'}</button>
          <button class="${!isWeek ? 'active' : ''}" onclick="window._switchBudgetModalTab('monthly')" style="flex:1;">🗓️ ${isHi ? 'मासिक' : 'Monthly'}</button>
        </div>

        <p style="font-size:12px;color:var(--text-dim,#94a3b8);margin:0 0 12px;line-height:1.45;">
          ${isWeek ? (isHi ? `${wLabel} के लिए 7 दिनों के खर्च का लक्ष्य निर्धारित करें।` : `Set your 7-day spending limit for ${wLabel}.`) : (isHi ? `${wLabel} के लिए 30 दिनों के खर्च का लक्ष्य निर्धारित करें।` : `Set your 30-day spending limit for ${wLabel}.`)}
        </p>

        <label style="font-size:12px;font-weight:700;color:#cbd5e1;display:block;margin-bottom:6px;">${isWeek ? (isHi ? 'साप्ताहिक बजट राशि (₹)' : 'Weekly Target (₹)') : (isHi ? 'मासिक बजट राशि (₹)' : 'Monthly Target (₹)')}</label>
        <div style="position:relative;margin-bottom:12px;">
          <span style="position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:18px;font-weight:800;color:var(--green,#34d399);font-family:'Space Grotesk',sans-serif;">₹</span>
          <input type="number" id="in-app-budget-val" value="${current}" placeholder="${isWeek ? '3500' : '15000'}" style="width:100%;padding:14px 14px 14px 34px;border-radius:14px;background:rgba(255,255,255,0.06);border:1.5px solid rgba(139,92,246,0.4);color:#fff;font-size:20px;font-weight:800;font-family:'Space Grotesk',sans-serif;box-sizing:border-box;outline:none;" oninput="updateBudgetModalPreview('${p}')">
        </div>

        <div style="margin-bottom:14px;">
          <label style="font-size:11.5px;color:var(--text-dim);font-weight:600;display:block;margin-bottom:6px;">${isHi ? 'त्वरित सुझाव:' : 'Quick Targets:'}</label>
          <div style="display:flex;flex-wrap:wrap;gap:6px;">
            ${chips.map(amt => `
              <button type="button" onclick="document.getElementById('in-app-budget-val').value=${amt};updateBudgetModalPreview('${p}');" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);color:#fff;border-radius:99px;padding:5px 11px;font-size:12px;font-weight:700;cursor:pointer;transition:background 0.2s;">
                ₹${amt.toLocaleString('en-IN')}
              </button>
            `).join('')}
          </div>
        </div>

        <div id="budget-modal-preview" style="background:rgba(52,211,153,0.1);border:1px solid rgba(52,211,153,0.3);border-radius:14px;padding:10px 14px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:12px;color:#cbd5e1;">${isHi ? 'दैनिक सुरक्षित सीमा:' : 'Estimated Daily Limit:'}</span>
          <strong id="budget-modal-daily" style="font-size:15px;color:var(--green,#34d399);font-weight:800;">₹${initialDaily}/day</strong>
        </div>

        <div style="display:flex;gap:10px;">
          <button class="btn" onclick="closeCustomSheet()" style="flex:1;border-radius:14px;padding:12px;font-size:13px;">${isHi ? 'रद्द करें' : 'Cancel'}</button>
          <button class="btn primary" onclick="submitInAppBudget('${p}','${curTargetW}')" style="flex:1.4;border-radius:14px;padding:12px;font-weight:800;font-size:13.5px;background:linear-gradient(135deg,#8b5cf6,#10b981);">${isHi ? 'बजट सेव करें →' : 'Save Target →'}</button>
        </div>
      </div>
    `;

    setTimeout(() => {
      const input = document.getElementById('in-app-budget-val');
      if (input) { input.focus(); input.select(); }
    }, 100);
  }

  window._switchBudgetModalTab = function(p) {
    renderModalContent(p, curTargetW);
  };

  window._switchBudgetModalWallet = function(wId) {
    renderModalContent(activeP, wId);
  };

  renderModalContent(activeP, curTargetW);

  requestAnimationFrame(() => {
    container.classList.add('active');
  });
};

window.updateBudgetModalPreview = function(period) {
  const p = period || window.budgetPeriod || 'monthly';
  const isWeek = (p === 'weekly');
  const val = parseFloat(document.getElementById('in-app-budget-val')?.value) || 0;
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const divisor = isWeek ? 7 : daysInMonth;
  const daily = Math.round(val / divisor);
  const dailyEl = document.getElementById('budget-modal-daily');
  if (dailyEl) dailyEl.textContent = `₹${daily.toLocaleString('en-IN')}/day`;
};

window.submitInAppBudget = function(period, targetWalletId) {
  const p = period || window.budgetPeriod || 'monthly';
  const val = parseFloat(document.getElementById('in-app-budget-val')?.value);
  if (!val || isNaN(val) || val <= 0) {
    if (typeof toast === 'function') toast('Please enter a valid budget amount', 'error');
    return;
  }
  window.setBudgetPeriod(p);
  window.setSavedTotalBudget(val, p, targetWalletId);
  if (typeof window.closeCustomSheet === 'function') window.closeCustomSheet();
};

window.promptEditTotalBudget = function() {
  window.openSetBudgetModal();
};

window.setBudgetWalletFilter = function(wId) {
  window.budgetSelectedWallet = wId;
  renderBudgetEditor();
};

function renderBudgetEditor(){
  const host = document.getElementById('budget-editor');
  if(!host) return;

  const isHi = (typeof currentLang !== 'undefined' && currentLang === 'hi');
  const isSimple = (window.budgetViewMode === 'simple');
  const isWeek = (window.budgetPeriod === 'weekly');
  
  const selectedWId = (typeof window.budgetSelectedWallet !== 'undefined' && window.budgetSelectedWallet)
    ? window.budgetSelectedWallet
    : ((typeof activeWalletId !== 'undefined' && activeWalletId !== 'all') ? activeWalletId : 'all');

  const wObj = (typeof userWallets !== 'undefined') ? userWallets.find(x => x.id === selectedWId) : null;
  const wTag = wObj ? `${wObj.icon} ${wObj.name}` : (isHi ? '🌐 सभी वॉलेट' : '🌐 All Wallets');

  const walletOptions = [
    { id: 'all', name: isHi ? 'सभी वॉलेट' : 'All Wallets', icon: '🌐' },
    ...((typeof userWallets !== 'undefined' && userWallets.length) ? userWallets : [
      { id: 'cash', name: 'Cash', icon: '💵' },
      { id: 'bank', name: 'Bank / UPI', icon: '📱' },
      { id: 'card', name: 'Credit Card', icon: '💳' }
    ])
  ];

  const walletFilterBar = `
    <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:6px;margin-bottom:12px;" class="custom-scroll">
      ${walletOptions.map(w => `
        <button type="button" onclick="setBudgetWalletFilter('${w.id}')" style="background:${w.id === selectedWId ? 'linear-gradient(135deg,#8b5cf6,#6366f1)' : 'rgba(255,255,255,0.05)'};border:1px solid ${w.id === selectedWId ? '#a78bfa' : 'rgba(255,255,255,0.1)'};color:#fff;padding:5px 11px;border-radius:12px;font-size:11.5px;font-weight:700;cursor:pointer;white-space:nowrap;display:flex;align-items:center;gap:4px;">
          <span>${w.icon || '💳'}</span> <span>${escapeHTML(w.name)}</span>
        </button>
      `).join('')}
    </div>
  `;

  if (isSimple) {
    let list = isWeek ? getThisWeekEntries() : getThisMonthEntries();
    if (selectedWId !== 'all') {
      list = list.filter(e => (e.walletId || (e.type === 'income' ? 'bank' : 'cash')) === selectedWId);
    }
    const totalSpent = list.filter(e => e.type === 'expense').reduce((s, e) => s + (parseFloat(e.amt) || 0), 0);
    const totalBudget = isWeek ? window.getSavedWeeklyBudget(selectedWId) : window.getSavedMonthlyBudget(selectedWId);
    const budgetSpentPct = totalBudget > 0 ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0;
    const isOverBudget = totalSpent > totalBudget;

    const now = new Date();
    let remainingDays = 1;
    if (isWeek) {
      const day = now.getDay();
      remainingDays = Math.max(1, 7 - (day === 0 ? 7 : day));
    } else {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const currentDay = now.getDate();
      remainingDays = Math.max(1, daysInMonth - currentDay);
    }
    const remainingBudget = Math.max(0, totalBudget - totalSpent);
    const safeDailySpend = Math.round(remainingBudget / remainingDays);

    host.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
        <div class="toggle-grp" style="margin:0;">
          <button class="active" onclick="setBudgetViewMode('simple')">🎯 ${isHi ? 'सरल (1-नंबर)' : 'Simple'}</button>
          <button onclick="setBudgetViewMode('category')">🏷️ ${isHi ? 'श्रेणीवार' : 'Categories'}</button>
        </div>
        <div class="toggle-grp" style="margin:0;">
          <button class="${isWeek ? 'active' : ''}" onclick="setBudgetPeriod('weekly')">📅 ${isHi ? 'सप्ताह' : 'Week'}</button>
          <button class="${!isWeek ? 'active' : ''}" onclick="setBudgetPeriod('monthly')">🗓️ ${isHi ? 'माह' : 'Month'}</button>
        </div>
      </div>

      ${walletFilterBar}

      <div style="background:rgba(255,255,255,0.04);border-radius:18px;padding:16px;border:1px solid var(--border);margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <div>
            <span style="font-size:11px;color:var(--accent-bright,#c4b5fd);text-transform:uppercase;font-weight:700;">
              ${wTag} · ${isWeek ? (isHi ? 'साप्ताहिक बजट' : 'Weekly Budget') : (isHi ? 'मासिक बजट' : 'Monthly Budget')}
            </span>
            <div style="font-size:22px;font-weight:800;font-family:'Space Grotesk',sans-serif;color:#fff;margin-top:2px;">
              ₹${totalSpent.toLocaleString('en-IN')} <span style="font-size:13px;color:var(--text-dim);font-weight:500;">/ ₹${totalBudget.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:15px;font-weight:800;color:${isOverBudget ? 'var(--red,#f87171)' : 'var(--green,#34d399)'};">${budgetSpentPct}%</div>
            <button class="btn btn-sm" onclick="openSetBudgetModal('${isWeek ? 'weekly' : 'monthly'}', '${selectedWId}')" style="margin-top:4px;border-radius:8px;font-size:11px;padding:4px 10px;background:rgba(255,255,255,0.08);color:#fff;border:1px solid var(--border);">⚙️ ${isHi ? 'बजट बदलें' : 'Edit Target'}</button>
          </div>
        </div>

        <div style="width:100%;height:10px;border-radius:6px;background:rgba(255,255,255,0.08);overflow:hidden;margin-bottom:14px;">
          <div style="width:${budgetSpentPct}%;height:100%;background:${isOverBudget ? 'linear-gradient(90deg,#ef4444,#dc2626)' : 'linear-gradient(90deg,#10b981,#3b82f6)'};border-radius:6px;transition:width 0.8s;"></div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div style="background:rgba(0,0,0,0.22);padding:10px 12px;border-radius:14px;border:1px solid rgba(255,255,255,0.06);">
            <div style="font-size:11px;color:var(--text-dim);">${isHi ? 'दैनिक सुरक्षित सीमा' : 'Safe Daily Spend'}</div>
            <div style="font-size:16px;font-weight:800;color:var(--green,#34d399);margin-top:2px;">₹${safeDailySpend}/day</div>
          </div>
          <div style="background:rgba(0,0,0,0.22);padding:10px 12px;border-radius:14px;border:1px solid rgba(255,255,255,0.06);">
            <div style="font-size:11px;color:var(--text-dim);">${isWeek ? (isHi ? 'सप्ताह के शेष दिन' : 'Days in Week') : (isHi ? 'महीने के शेष दिन' : 'Days in Month')}</div>
            <div style="font-size:16px;font-weight:800;color:#fff;margin-top:2px;">${remainingDays} days</div>
          </div>
        </div>
      </div>
    `;
    return;
  }

  // Category Breakdown Mode
  const cats = budgetableCats();
  const spentByCat = getPeriodExpenseByCat();
  const catLabel = (c)=>(typeof CAT_LABEL==='function') ? CAT_LABEL(c) : c;
  const rows = cats.map(c=>{
    const budget = Number(categoryBudgets[c]||0);
    const spent = spentByCat[c]||0;
    const has = budget>0;
    const pct = has ? Math.min(Math.round(spent/budget*100),100) : 0;
    const over = has && spent>budget;
    return `
      <div class="budget-cat-row">
        <div class="budget-cat-head">
          <span class="budget-cat-name">${escapeHTML(catLabel(c))}</span>
          <input class="budget-cat-input" type="number" id="budget-${c}" value="${budget||''}" placeholder="0" min="0" step="1"/>
        </div>
        ${has
          ? `<div class="bar-track" style="height:6px;margin-top:6px"><div class="bar-fill" style="width:${pct}%;background:${over?'var(--red)':'var(--green)'}"></div></div>
             <div class="budget-cat-spent" style="color:${over?'var(--red)':'var(--text-dim)'}">₹${spent}${over?' / ₹'+budget:''} · ${pct}%</div>`
          : `<div class="budget-cat-spent" style="color:var(--text-faint)">${currentLang==='hi'?'कोई बजट नहीं':'no budget set'}</div>`}
      </div>`;
  }).join('');

  const totalB = totalBudget();
  const totalS = Object.values(spentByCat).reduce((a,b)=>a+b,0);
  const tPct = totalB ? Math.min(Math.round(totalS/totalB*100),100) : 0;
  const tOver = totalB>0 && totalS>totalB;

  host.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px;">
      <div class="toggle-grp" style="margin:0;">
        <button onclick="setBudgetViewMode('simple')">🎯 ${isHi ? 'सरल (1-नंबर)' : 'Simple'}</button>
        <button class="active" onclick="setBudgetViewMode('category')">🏷️ ${isHi ? 'श्रेणीवार' : 'Categories'}</button>
      </div>
      <div class="toggle-grp" id="budget-period-toggle" style="margin:0;">
        <button class="${budgetPeriod==='weekly'?'active':''}" onclick="setBudgetPeriod('weekly')">${isHi ? 'सप्ताह' : 'Week'}</button>
        <button class="${budgetPeriod==='monthly'?'active':''}" onclick="setBudgetPeriod('monthly')">${isHi ? 'माह' : 'Month'}</button>
      </div>
    </div>

    ${walletFilterBar}

    <div class="budget-total" style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-dim);margin-bottom:5px">
        <span>${currentLang==='hi'?'कुल श्रेणी खर्च':'Total category spent'}: <b style="color:var(--text)">₹${totalS}</b> / ₹${totalB||0}</span>
        <span style="color:${tOver?'var(--red)':'var(--text-dim)'}">${tPct}%</span>
      </div>
      <div class="bar-track" style="height:8px"><div class="bar-fill" style="width:${tPct}%;background:${tOver?'var(--red)':'var(--amber)'}"></div></div>
    </div>
    <div class="budget-cats" style="display:flex;flex-direction:column;gap:9px">${rows}</div>
    <button class="btn primary budget-save-btn" onclick="saveBudget()" style="margin-top:14px"><i class="ti ti-check"></i> <span>${TT('btn_save_budget')}</span></button>
  `;
}

function tryConnectUPI(appName){
  const msg = currentLang==='hi'
    ? 'आपका UPI कनेक्ट नहीं है।\n\nक्षमा करें, यह फीचर अभी बन रहा है। 🚧'
    : 'Your UPI is not connected.\n\nSorry, this feature is still under construction. 🚧';
  showAppAlert(msg, appName);
  showLocalNotification('UPI Connection', `${appName} — this feature is still under construction 🚧`);
}

function getThisWeekEntries(){
  const now=new Date();
  const day=now.getDay();
  const diff=now.getDate()-(day===0?6:day-1);
  const mon=new Date(now);mon.setDate(diff);
  const monStr=dateToStr(mon);
  const sun=new Date(mon);sun.setDate(mon.getDate()+6);
  const sunStr=dateToStr(sun);
  return mainEntries().filter(e=>e.date>=monStr&&e.date<=sunStr);
}

function getThisMonthEntries(){
  const now=new Date();
  const y=now.getFullYear(), m=now.getMonth();
    const start=dateToStr(new Date(y,m,1));
    const end=dateToStr(new Date(y,m+1,0));
  return mainEntries().filter(e=>e.date>=start&&e.date<=end);
}

function checkBudget(){
  const host = document.getElementById('budget-editor');
  if(!host) return;
  renderBudgetEditor();
  // One-time over-budget alert when any category crosses its cap
  const spentByCat = getPeriodExpenseByCat();
  const catLabel = (c)=>(typeof CAT_LABEL==='function') ? CAT_LABEL(c) : c;
  const overCats = budgetableCats().filter(c=>{
    const b = Number(categoryBudgets[c]||0);
    return b>0 && (spentByCat[c]||0)>b;
  });
  if(overCats.length && !window._budgetAlertShown){
    const names = overCats.map(catLabel).join(', ');
    const overText = currentLang==='hi'
      ? `बजट पार कर लिया! ${names}`
      : `Budget exceeded! ${names}`;
    toast('⚠️ '+overText,'error');
    if(typeof showLocalNotification==='function') showLocalNotification('Budget alert', overText);
    window._budgetAlertShown=true;
  }
  if(!overCats.length) window._budgetAlertShown=false;
}

// --- Local notifications (works while app is open/backgrounded — no server needed) ---
let notifPermissionAsked=false;
function requestNotifPermission(){
  if(!('Notification' in window)){toast('Notifications not supported on this browser','error');return;}
  if(Notification.permission==='granted'){toast('Notifications already enabled!','success');return;}
  if(Notification.permission==='denied'){toast('Notifications blocked — enable them in your browser/app settings','error');return;}
  Notification.requestPermission().then(perm=>{
    if(perm==='granted')toast(TT('notifs_enabled'),'success');
    else toast('Notifications not enabled','error');
  });
}

function showLocalNotification(title, body){
  if(!('Notification' in window))return;
  if(Notification.permission!=='granted'){
    if(!notifPermissionAsked){
      notifPermissionAsked=true;
      Notification.requestPermission().then(perm=>{
        if(perm==='granted') showLocalNotification(title, body);
      });
    }
    return;
  }
  if(navigator.serviceWorker && navigator.serviceWorker.ready){
    navigator.serviceWorker.ready.then(reg=>{
      reg.showNotification(title, {body, icon:'icon-192.png', badge:'icon-192.png'});
    }).catch(()=>{
      new Notification(title, {body, icon:'icon-192.png'});
    });
  } else {
    new Notification(title, {body, icon:'icon-192.png'});
  }
}

// --- Streak tracker: counts consecutive days (up to today) with at least one main-log entry ---
function getCurrentStreak(){
  const list=mainEntries();
  if(!list.length) return 0;
  const daysWithEntries = new Set(list.map(e=>e.date));
  let streak=0;
  let cursor=new Date(); cursor.setHours(0,0,0,0);
  if(!daysWithEntries.has(dateToStr(cursor))){
    cursor.setDate(cursor.getDate()-1);
  }
  while(daysWithEntries.has(dateToStr(cursor))){
    streak++;
    cursor.setDate(cursor.getDate()-1);
  }
  return streak;
}

function renderStreak(){
  const card=document.getElementById('streak-card');
  if(!card)return;
  const streak=getCurrentStreak();
  if(streak<1){ card.style.display='none'; return; }
  card.style.display='block';
  const text = currentLang==='hi' ? `${streak} दिन की स्ट्रीक` : `${streak} day${streak===1?'':'s'} streak`;
  document.getElementById('streak-count-text').textContent = text;
}

// --- Rewards: fully derived from entries data, no separate storage needed ---
const REWARD_MILESTONES = [
  {days:7,  bonus:1,  icon:'🥉', key:'badge_7'},
  {days:30, bonus:5,  icon:'🥈', key:'badge_30'},
  {days:100,bonus:20, icon:'🥇', key:'badge_100'},
  {days:365,bonus:100,icon:'💎', key:'badge_365'},
];

// Longest run of consecutive logged days ever achieved (not just the live streak — this is what points are based on)
function getLongestStreakEver(){
  const days=[...new Set(mainEntries().map(e=>e.date))].sort();
  if(!days.length)return 0;
  let longest=1, run=1;
  for(let i=1;i<days.length;i++){
    const dayMs=s=>{const p=s.split('-').map(Number);return Date.UTC(p[0],p[1]-1,p[2])};
    const diff=(dayMs(days[i])-dayMs(days[i-1]))/86400000;
    if(diff===1){ run++; } else { run=1; }
    if(run>longest) longest=run;
  }
  return longest;
}

// Points build up slowly — 1 point per completed week of your longest streak, plus a small milestone bonus
function calculateRewardPoints(){
  const longest=getLongestStreakEver();
  const weeklyPoints=Math.floor(longest/7);
  const bonusPoints=REWARD_MILESTONES.filter(m=>longest>=m.days).reduce((s,m)=>s+m.bonus,0);
  return weeklyPoints + bonusPoints;
}

function getTotalActiveDays(){
  return new Set(mainEntries().map(e=>e.date)).size;
}

function renderRewards(){
  const totalDays = getTotalActiveDays();
  const streak = getCurrentStreak();
  const longest = getLongestStreakEver();
  const points = calculateRewardPoints();

  document.getElementById('rewards-points-total').textContent = points.toLocaleString(currentLang==='hi'?'hi-IN':'en-IN');
  document.getElementById('rewards-streak-sub').textContent = currentLang==='hi'
    ? `${totalDays} दिन लॉग किए गए · अभी ${streak} दिन की स्ट्रीक`
    : `${totalDays} days logged · ${streak}-day streak right now`;

  const next = REWARD_MILESTONES.find(m=>longest<m.days);
  if(next){
    const prevThreshold = REWARD_MILESTONES.filter(m=>m.days<=longest).slice(-1)[0]?.days || 0;
    const pct = Math.min(Math.round(((longest-prevThreshold)/(next.days-prevThreshold))*100),100);
    document.getElementById('rewards-progress-label').textContent = currentLang==='hi'
      ? `${next.icon} ${next.days}-दिन बैज तक`
      : `${next.icon} ${next.days}-day badge`;
    document.getElementById('rewards-progress-pct').textContent = `${longest}/${next.days} ${currentLang==='hi'?'दिन':'days'}`;
    document.getElementById('rewards-progress-bar').style.width = pct+'%';
  } else {
    document.getElementById('rewards-progress-label').textContent = currentLang==='hi' ? 'सभी बैज हासिल कर लिए! 🎉' : "All badges unlocked! 🎉";
    document.getElementById('rewards-progress-pct').textContent = '';
    document.getElementById('rewards-progress-bar').style.width = '100%';
  }

  const badgesGrid=document.getElementById('rewards-badges-grid');
  badgesGrid.innerHTML = REWARD_MILESTONES.map(m=>{
    const unlocked = longest>=m.days;
    return `
    <div style="text-align:center;padding:12px 6px;border-radius:14px;border:1px solid var(--border);background:${unlocked?'rgba(255,184,77,0.12)':'var(--card)'};opacity:${unlocked?1:0.4}">
      <div style="font-size:26px">${m.icon}</div>
      <div style="font-size:11px;color:var(--text-dim);margin-top:4px">${m.days} ${currentLang==='hi'?'दिन':'days'}</div>
    </div>`;
  }).join('');
}

// --- Milestone celebration popup — fires once per streak milestone reached ---
function checkMilestoneCelebration(){
  const longest=getLongestStreakEver();
  const hit = REWARD_MILESTONES.find(m=>m.days===longest);
  if(!hit) return;
  const seenKey='pocketTrackMilestoneSeen_'+hit.key;
  if(localStorage.getItem(seenKey)) return;
  localStorage.setItem(seenKey,'1');
  const msg = currentLang==='hi'
    ? `${hit.icon} बधाई हो! आपने ${hit.days} दिन की स्ट्रीक पूरी की और +${hit.bonus} बोनस पॉइंट कमाए!`
    : `${hit.icon} Congrats! You hit a ${hit.days}-day streak and earned +${hit.bonus} bonus points!`;
  showAppAlert(msg, currentLang==='hi' ? 'नया बैज!' : 'New badge!');
}

// --- Coin-fly animation: a little coin flies from wherever you logged something,
//     straight to the Rewards shortcut on the Home screen ---
function flyCoinToRewards(originEl){
  const rewardsBtn=document.getElementById('home-rewards-btn') || document.getElementById('streak-card') || document.getElementById('hero-balance-card');
  if(!originEl || !rewardsBtn) return;
  const startRect=originEl.getBoundingClientRect();
  const endRect=rewardsBtn.getBoundingClientRect();
  const coin=document.createElement('div');
  coin.textContent='🪙';
  coin.style.cssText=`position:fixed;left:${startRect.left+startRect.width/2-12}px;top:${startRect.top+startRect.height/2-12}px;font-size:22px;z-index:1200;pointer-events:none;transition:left 0.7s cubic-bezier(.3,.8,.4,1),top 0.7s cubic-bezier(.3,.8,.4,1),opacity 0.7s ease,transform 0.7s ease;`;
  document.body.appendChild(coin);
  requestAnimationFrame(()=>{
    coin.style.left=(endRect.left+endRect.width/2-12)+'px';
    coin.style.top=(endRect.top+endRect.height/2-12)+'px';
    coin.style.transform='scale(0.4)';
    coin.style.opacity='0.3';
  });
  setTimeout(()=>{
    coin.remove();
    rewardsBtn.style.transform='scale(1.15)';
    setTimeout(()=>{ rewardsBtn.style.transform='scale(1)'; }, 150);
  }, 700);
}

function celebrateEntryLogged(btnId){
  const btn=document.getElementById(btnId);
  flyCoinToRewards(btn);
  renderRewards();
  checkMilestoneCelebration();
  if (typeof spawnCelebrationParticles === 'function') {
    const rect = btn ? btn.getBoundingClientRect() : null;
    spawnCelebrationParticles(
      rect ? rect.left + rect.width / 2 : window.innerWidth / 2,
      rect ? rect.top + rect.height / 2 : window.innerHeight / 2
    );
  }
}

function setTab(t){
  ['log','entries','report','events','rewards','upi','language','pro','ledger'].forEach((x)=>{
    const el=document.getElementById('tab-'+x);
    if(el){
      if(x===t){
        el.style.display='block';
        el.classList.remove('tab-enter');
        void el.offsetWidth; // force reflow so the animation replays every time
        el.classList.add('tab-enter');
      } else {
        el.style.display='none';
      }
    }
  });
  document.querySelectorAll('.side-menu-item').forEach(btn=>{
    btn.classList.toggle('active', btn.dataset.tab===t);
  });
  document.querySelectorAll('.bottom-tab').forEach(btn=>{
    btn.classList.toggle('active', btn.dataset.tab===t);
  });
  const statPills = document.getElementById('header-stat-pills');
  if (statPills) statPills.style.display = (t==='log'||t==='entries') ? 'flex' : 'none';
  if(t==='entries'){
    if(typeof renderEntries==='function') renderEntries();
  }
  if(t==='report'){
    if(typeof renderReport==='function') renderReport();
    if(typeof showNextTip==='function') showNextTip();
    if(typeof renderBudgetEditor==='function') renderBudgetEditor();
    if(typeof ptSyncGates === 'function') ptSyncGates();
  }
  if(t==='events'){
    if(typeof showEventsListView==='function') showEventsListView();
    if(typeof renderEventsList==='function') renderEventsList();
  }
  if(t==='ledger'){
    if(typeof ptSyncGates === 'function') ptSyncGates();
    if(typeof renderLedger === 'function') renderLedger();
  }
  if(t==='upi'){
    if(typeof ptSyncGates === 'function') ptSyncGates();
  }
  if(t==='pro'){
    if(typeof renderProTab === 'function') renderProTab();
  }
  if(t==='rewards'){
    if(typeof renderRewards==='function') renderRewards();
  }
  if(t==='language'){
    if(typeof updateLanguageTabUI==='function') updateLanguageTabUI();
  }
  if(typeof closeMenu==='function') closeMenu();
}
window.setTab = setTab;

// Side menu removed — these stay as safe no-ops for legacy callers.
function openMenu(){}
function closeMenu(){}

// ============ EVENTS MINI-APP ============
var events = [];
window.events = events;
let unsubscribeEvents = null;
var currentEventId = null;
window.currentEventId = currentEventId;
var currentEventName = null;
window.currentEventName = currentEventName;
var eventParticipants = {};
window.eventParticipants = eventParticipants;
const EVENT_ICONS = {Birthday:'🎂',Wedding:'💍',Trip:'✈️',Festival:'🎆',Party:'🎉',Other:'📌'};

function listenToEvents(){
  if(!currentUser) return;
  unsubscribeEvents = db.collection('users').doc(currentUser.uid).collection('events')
    .onSnapshot({includeMetadataChanges:true}, snap=>{
      events = snap.docs.map(d=>({...d.data(), _id:d.id}));
      if(typeof pendingWriteState!=='undefined') pendingWriteState.events = !!snap.metadata && snap.metadata.hasPendingWrites;
      if(typeof updateSyncIndicator==='function') updateSyncIndicator();
      if(document.getElementById('tab-events').style.display!=='none' && document.getElementById('events-list-view').style.display!=='none'){
        renderEventsList();
      }
      if(currentEventId){
        renderEventDetail();
      }
    }, err=>console.error(err));
}

let editingEventId=null;

function toggleAddEventForm(){
  const f=document.getElementById('add-event-form');
  f.style.display = f.style.display==='none' ? 'block' : 'none';
  if(f.style.display==='block' && !editingEventId){
    document.getElementById('event-form-title').innerHTML='<i class="ti ti-sparkles"></i>'+TT('sec_create_event');
    document.getElementById('event-form-submit-btn').innerHTML='<i class="ti ti-check"></i> '+TT('btn_create_event');
    document.getElementById('new-event-type').value='Birthday';
    document.getElementById('new-event-name').value='';
    document.getElementById('new-event-desc').value='';
    document.getElementById('new-event-from').value=todayStr();
    document.getElementById('new-event-till').value=todayStr();
  }
  if(f.style.display==='none'){
    editingEventId=null;
  }
}

function startEditEvent(id){
  const ev=events.find(e=>e._id===id);
  if(!ev)return;
  editingEventId=id;
  document.getElementById('event-form-title').innerHTML='<i class="ti ti-pencil"></i>'+TT('btn_edit_event');
  document.getElementById('event-form-submit-btn').innerHTML='<i class="ti ti-check"></i> '+TT('btn_save_changes');
  document.getElementById('new-event-type').value=ev.type||'Other';
  document.getElementById('new-event-name').value=ev.name||'';
  document.getElementById('new-event-desc').value=ev.desc||'';
  document.getElementById('new-event-from').value=ev.fromDate||ev.date||todayStr();
  document.getElementById('new-event-till').value=ev.tillDate||ev.date||todayStr();
  document.getElementById('add-event-form').style.display='block';
  document.getElementById('add-event-form').scrollIntoView({behavior:'smooth',block:'start'});
}

async function createNewEvent(){
  if(!currentUser){toast(TT('not_logged_in'),'error');return;}
  if(!editingEventId && typeof canCreateSpace === 'function' && !canCreateSpace((events || []).length)){
    if(typeof showProLimitModal === 'function'){
      showProLimitModal('Splitwise Spaces', '2 active spaces');
    } else {
      toast('Upgrade to Pro to create more than 2 spaces', 'info');
    }
    return;
  }
  const type=document.getElementById('new-event-type').value;
  const name=document.getElementById('new-event-name').value.trim().slice(0,40);
  const desc=document.getElementById('new-event-desc').value.trim().slice(0,100);
  let fromDate=document.getElementById('new-event-from').value||todayStr();
  let tillDate=document.getElementById('new-event-till').value||fromDate;
  if(tillDate<fromDate){ const tmp=fromDate; fromDate=tillDate; tillDate=tmp; } // auto-swap if entered backwards
  if(!name){toast(TT('give_event_name'),'error');return;}
  try{
    if(editingEventId){
      const oldEv=events.find(e=>e._id===editingEventId);
      const oldName=oldEv?oldEv.name:null;
      await db.collection('users').doc(currentUser.uid).collection('events').doc(editingEventId).update({type, name, desc, fromDate, tillDate});
      if(oldName && oldName!==name){
        const orphans=entries.filter(e=>e.event===oldName && !e.evId);
        for(let i=0;i<orphans.length;i+=400){
          const b=db.batch();
          orphans.slice(i,i+400).forEach(en=>b.update(db.collection('users').doc(currentUser.uid).collection('entries').doc(en._id),{evId:editingEventId}));
          await b.commit();
        }
      }
      toast(TT('event_updated'),'success');
    } else {
      await db.collection('users').doc(currentUser.uid).collection('events').add({
        type, name, desc, fromDate, tillDate, createdAt: Date.now()
      });
      toast(TT('event_created'),'success');
    }
    editingEventId=null;
    toggleAddEventForm();
  }catch(e){toast('Could not save event: '+e.message,'error');}
}

function eventStats(eventName, evId){
  const list = entries.filter(e => evId ? (e.evId ? e.evId===evId : (!e.evId && e.event===eventName)) : e.event===eventName);
  const income = list.filter(e=>e.type==='income').reduce((s,e)=>s+e.amt,0);
  const spent = list.filter(e=>e.type==='expense').reduce((s,e)=>s+e.amt,0);
  return {income, spent, balance: income-spent, count: list.length, list};
}

function renderEventsList(){
  const listEl=document.getElementById('events-list');
  if(!events.length){
    listEl.innerHTML=`<p class="empty" style="margin-top:12px">${TT('no_events_yet')}</p>`;
    return;
  }
  listEl.innerHTML = events.map(ev=>{
    const stats = eventStats(ev.name, ev._id);
    const sInc=(ev.sharedExpenses||[]).filter(x=>x.type==='income').reduce((s,e)=>s+e.amt,0);
    const sSpent=(ev.sharedExpenses||[]).filter(x=>x.type!=='income').reduce((s,e)=>s+e.amt,0);
    const net=stats.income+sInc-stats.spent-sSpent;
    const count=stats.count+(ev.sharedExpenses||[]).length;
    return `
    <div class="card" style="margin-top:10px">
      <div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer" onclick="openEventDetail('${ev._id}')">
        <div>
          <p style="font-weight:600;font-size:14.5px;margin-bottom:2px">${EVENT_ICONS[ev.type]||'📌'} ${escapeHTML(ev.name)}</p>
          <p style="font-size:11.5px;color:var(--text-faint)">${ev.fromDate?fmtDate(ev.fromDate)+(ev.tillDate&&ev.tillDate!==ev.fromDate?' – '+fmtDate(ev.tillDate):'')+' · ':''}${count} ${count===1?'entry':'entries'}${ev.desc?' · '+escapeHTML(ev.desc):''}</p>
        </div>
        <div style="text-align:right">
          <p style="font-size:14px;font-weight:700;color:${net>=0?'var(--green)':'var(--red)'}">₹${net}</p>
          <p style="font-size:11px;color:var(--text-faint)">net</p>
        </div>
      </div>
      <div style="margin-top:8px;text-align:right">
        <button class="icon-btn" onclick="event.stopPropagation();startEditEvent('${ev._id}')" aria-label="edit event">✏️ ${TT('btn_edit')}</button>
      </div>
    </div>`;
  }).join('');
}

function showEventsListView(){
  document.getElementById('events-list-view').style.display='block';
  document.getElementById('event-detail-view').style.display='none';
  currentEventId=null;
  currentEventName=null;
}

function openEventDetail(id){
  const ev = events.find(e=>e._id===id);
  if(!ev) return;
  currentEventId=id;
  currentEventName=ev.name;
  if(ev.participants) eventParticipants[id] = ev.participants;
  document.getElementById('events-list-view').style.display='none';
  document.getElementById('event-detail-view').style.display='block';
  document.getElementById('event-detail-title').innerHTML=`${EVENT_ICONS[ev.type]||'📌'} ${escapeHTML(ev.name)}`;
  document.getElementById('event-detail-desc').textContent = (ev.fromDate?fmtDate(ev.fromDate)+(ev.tillDate&&ev.tillDate!==ev.fromDate?' – '+fmtDate(ev.tillDate):'')+' · ':'') + (ev.desc || '');
  document.getElementById('ev-inc-date').value = todayStr();
  document.getElementById('ev-exp-date').value = todayStr();
  resetEventEntryEditState();
  currentExpenseType = 'personal';
  currentIncomeType = 'personal';
  if(typeof setExpenseType==='function') setExpenseType('personal');
  if(typeof setIncomeType==='function') setIncomeType('personal');
  renderEventDetail();
}
window.openEventDetail = openEventDetail;

function backToEventsList(){
  currentExpenseType = 'personal';
  currentIncomeType = 'personal';
  resetEventEntryEditState();
  showEventsListView();
  renderEventsList();
}
window.backToEventsList = backToEventsList;

let editingEventEntryId=null;

function startEditEventEntry(id){
  const entry=entries.find(e=>e._id===id);
  if(!entry)return;
  editingEventEntryId=id;
  if(entry.type==='income'){
    const srcSelect=document.getElementById('ev-inc-src');
    const knownValues=[...srcSelect.options].map(o=>o.value).filter(v=>v!=='__add_new__');
    if(knownValues.includes(entry.label)){
      srcSelect.value=entry.label;
      document.getElementById('ev-inc-custom-wrap').style.display='none';
    } else {
      srcSelect.value='__add_new__';
      document.getElementById('ev-inc-custom-wrap').style.display='block';
      document.getElementById('ev-inc-custom').value=entry.label;
    }
    document.getElementById('ev-inc-amt').value=entry.amt;
    document.getElementById('ev-inc-date').value=entry.date;
    document.getElementById('ev-inc-note').value=entry.note||'';
    document.getElementById('ev-inc-submit-btn').textContent=TT('btn_update_income');
    document.getElementById('ev-inc-submit-btn').scrollIntoView({behavior:'smooth',block:'center'});
  } else {
    if(entry.cat==='custom' && entry.customCat){
      const encodedVal='custom:'+entry.customCat;
      const catSelect=document.getElementById('ev-exp-cat');
      const hasOption=[...catSelect.options].some(o=>o.value===encodedVal);
      if(hasOption){
        catSelect.value=encodedVal;
        document.getElementById('ev-exp-custom-wrap').style.display='none';
      } else {
        catSelect.value='__add_new__';
        document.getElementById('ev-exp-custom-wrap').style.display='block';
        document.getElementById('ev-exp-custom').value=entry.customCat;
      }
    } else {
      document.getElementById('ev-exp-cat').value=entry.cat;
      document.getElementById('ev-exp-custom-wrap').style.display='none';
    }
    document.getElementById('ev-exp-amt').value=entry.amt;
    document.getElementById('ev-exp-date').value=entry.date;
    document.getElementById('ev-exp-desc').value=entry.label;
    document.getElementById('ev-exp-submit-btn').textContent=TT('btn_update_expense');
    document.getElementById('ev-exp-submit-btn').scrollIntoView({behavior:'smooth',block:'center'});
  }
  toast(TT('editing_entry'),'info');
}

function resetEventEntryEditState(){
  editingEventEntryId=null;
  document.getElementById('ev-inc-submit-btn').textContent=TT('btn_add_income');
  document.getElementById('ev-exp-submit-btn').textContent=TT('btn_add_expense');
}

async function savePersonalEventIncome(){
  if(!currentEventName){toast('No event selected','error');return;}
  let src=document.getElementById('ev-inc-src').value;
  let isNewCustom=false;
  if(src==='__add_new__'){
    const custom=document.getElementById('ev-inc-custom').value.trim().slice(0,40);
    if(!custom){toast(TT('give_source_name'),'error');return;}
    src=custom;
    isNewCustom=true;
  }
  const amt=parseFloat(document.getElementById('ev-inc-amt').value);
  const note=document.getElementById('ev-inc-note').value.trim().slice(0,60);
  const date=document.getElementById('ev-inc-date').value||todayStr();
  if(!isValidAmount(amt)){toast(TT('enter_valid_amount'),'error');return;}
  if(!isValidDate(date)){toast(TT('enter_valid_date'),'error');return;}
  const payload={type:'income',cat:'income',label:src,note,event:currentEventName,evId:currentEventId,amt:Math.round(amt*100)/100,date};
  try{
    if(editingEventEntryId){
      await updateEntry(editingEventEntryId, payload);
      toast(TT('income_updated'),'success');
      resetEventEntryEditState();
    } else {
      await saveEntry(payload);
      toast(TT('income_added_event'),'success');
      if(isNewCustom) saveCustomIncomeSource(src);
    }
    document.getElementById('ev-inc-amt').value='';
    document.getElementById('ev-inc-note').value='';
    document.getElementById('ev-inc-custom').value='';
    document.getElementById('ev-inc-custom-wrap').style.display='none';
  }catch(e){toast('Could not save: '+e.message,'error');}
}

async function addEventIncome(){
  if(currentIncomeType === 'shared'){
    await addSharedIncome();
  } else {
    await savePersonalEventIncome();
  }
}
window.addEventIncome = addEventIncome;

async function savePersonalEventExpense(){
  if(!currentEventName){toast('No event selected','error');return;}
  let cat=document.getElementById('ev-exp-cat').value;
  let customCat='';
  let isNewCustom=false;
  if(cat==='__add_new__'){
    customCat=document.getElementById('ev-exp-custom').value.trim().slice(0,40);
    if(!customCat){toast(TT('give_category_name'),'error');return;}
    cat='custom';
    isNewCustom=true;
  } else if(cat.startsWith('custom:')){
    customCat=cat.slice(7);
    cat='custom';
  }
  const amt=parseFloat(document.getElementById('ev-exp-amt').value);
  const desc=document.getElementById('ev-exp-desc').value.trim().slice(0,60);
  const date=document.getElementById('ev-exp-date').value||todayStr();
  if(!isValidAmount(amt)){toast(TT('enter_valid_amount'),'error');return;}
  if(!isValidDate(date)){toast(TT('enter_valid_date'),'error');return;}
  const payload={type:'expense',cat,customCat,label:desc,event:currentEventName,evId:currentEventId,amt:Math.round(amt*100)/100,date};
  try{
    if(editingEventEntryId){
      await updateEntry(editingEventEntryId, payload);
      toast(TT('expense_updated'),'success');
      resetEventEntryEditState();
    } else {
      await saveEntry(payload);
      toast(TT('expense_added_event'),'success');
      if(isNewCustom) saveCustomExpenseCategory(customCat);
    }
    document.getElementById('ev-exp-amt').value='';
    document.getElementById('ev-exp-desc').value='';
    document.getElementById('ev-exp-custom').value='';
    document.getElementById('ev-exp-custom-wrap').style.display='none';
  }catch(e){toast('Could not save: '+e.message,'error');}
}

async function addEventExpense(){
  if(currentExpenseType === 'shared'){
    await addSharedExpense();
  } else {
    await savePersonalEventExpense();
  }
}
window.addEventExpense = addEventExpense;

function editCurrentEventFromDetail(){
  const idToEdit = currentEventId;
  setTab('events');
  startEditEvent(idToEdit);
}

async function deleteCurrentEvent(){
  if(!currentEventId)return;
  const idToDelete = currentEventId;
  showAppConfirm(`Delete "${currentEventName}"? This won't delete its logged entries, just the event card.`, async ()=>{
    try{
      await db.collection('users').doc(currentUser.uid).collection('events').doc(idToDelete).delete();
      toast(TT('event_deleted'),'success');
      backToEventsList();
    }catch(e){toast('Could not delete: '+e.message,'error');}
  });
}

// ============ SPLITWISE KILLER: Bill Splitting Engine ============

var sharedExpenses = {};   // {eventId: [{id, desc, amt, paidBy, splitAmong: [], date}]}
var currentExpenseType = 'personal';

// --- Participants Management ---
function addParticipant(){
  const input = document.getElementById('new-participant-name');
  const name = input.value.trim().slice(0,20);
  if(!name){ toast('Enter a name','error'); return; }
  if(!currentEventId) return;

  if(!eventParticipants[currentEventId]) eventParticipants[currentEventId] = [];
  if(eventParticipants[currentEventId].includes(name)){
    toast(currentLang==='hi' ? 'यह नाम पहले से है' : 'This name is already added','error');
    return;
  }
  eventParticipants[currentEventId].push(name);
  input.value = '';
  saveParticipantsToFirestore();
  renderParticipants();
  renderPaidByDropdown();
  renderSplitAmongChips();
  toast(currentLang==='hi' ? `${name} जोड़ा गया` : `${name} added!`,'success');
}

function removeParticipant(name){
  if(!currentEventId || !eventParticipants[currentEventId]) return;
  eventParticipants[currentEventId] = eventParticipants[currentEventId].filter(n=>n!==name);
  saveParticipantsToFirestore();
  renderParticipants();
  renderPaidByDropdown();
  renderSplitAmongChips();
}

function renderParticipants(){
  // Render tags in the main card
  const tagsEl = document.getElementById('participants-tags-display');
  const linkEl = document.getElementById('manage-participants-link');
  if(!tagsEl) return;
  const list = eventParticipants[currentEventId] || [];
  if(!list.length){
    tagsEl.innerHTML = `<p style="font-size:12px;color:var(--text-faint)">${TT('no_participants')}</p>`;
    if(linkEl) linkEl.style.display = 'none';
    return;
  }
  // Show just the first few names as preview tags
  tagsEl.innerHTML = list.slice(0,5).map(name => `
    <span class="participant-tag">${escapeHTML(name)}</span>
  `).join('') + (list.length > 5 ? `<span style="font-size:12px;color:var(--text-faint)">+${list.length - 5} more</span>` : '');
  if(linkEl) linkEl.style.display = 'block';
}

function openManageParticipants(){
  const listEl = document.getElementById('manage-participants-list');
  const list = eventParticipants[currentEventId] || [];
  if(!list.length){
    listEl.innerHTML = `<p class="empty">${TT('no_participants_manage')}</p>`;
  } else {
    listEl.innerHTML = list.map(name => `
      <div class="entry-row">
        <span style="flex:1;color:var(--text)">${escapeHTML(name)}</span>
        <div class="row-actions">
          <button class="icon-btn" onclick="confirmRemoveParticipant('${escapeHTML(name).replace(/'/g,"\'")}')" aria-label="delete">🗑️</button>
        </div>
      </div>
    `).join('');
  }
  document.getElementById('manage-participants-backdrop').style.display='flex';
}

function closeManageParticipants(){
  document.getElementById('manage-participants-backdrop').style.display='none';
}

function confirmRemoveParticipant(name){
  showAppConfirm(
    currentLang==='hi' ? `"${name}" हटाएं?` : `Remove "${name}"?`,
    ()=>{
      removeParticipant(name);
      setTimeout(renderManageParticipantsList, 300);
    }
  );
}

function editParticipant(oldName){
  showAppPrompt(
    currentLang==='hi' ? 'नाम बदलें:' : 'Rename participant:',
    oldName,
    (newName)=>{
      if(!newName || !newName.trim() || newName.trim()===oldName) return;
      const trimmed = newName.trim().slice(0,20);
      if(!eventParticipants[currentEventId]) return;
      if(eventParticipants[currentEventId].includes(trimmed)){
        toast(currentLang==='hi'?'यह नाम पहले से है':'Already exists','error'); return;
      }
      eventParticipants[currentEventId] = eventParticipants[currentEventId].map(n=>n===oldName?trimmed:n);
      saveParticipantsToFirestore();
      renderParticipants();
      renderManageParticipantsList();
      renderPaidByDropdown();
      renderSplitAmongChips();
      renderIncSplitAmongChips();
    }
  );
}

function renderManageParticipantsList(){
  const listEl = document.getElementById('manage-participants-list');
  const list = eventParticipants[currentEventId] || [];
  if(!list.length){
    listEl.innerHTML = `<p class="empty">${TT('no_participants_manage')}</p>`;
    return;
  }
  listEl.innerHTML = list.map(name => `
    <div class="entry-row">
      <span style="flex:1;color:var(--text)">${escapeHTML(name)}</span>
      <div class="row-actions">
        <button class="icon-btn" onclick="editParticipant('${escapeHTML(name).replace(/'/g,"\'")}')" aria-label="edit">✏️</button>
        <button class="icon-btn" onclick="confirmRemoveParticipant('${escapeHTML(name).replace(/'/g,"\'")}')" aria-label="delete">🗑️</button>
      </div>
    </div>
  `).join('');
}

async function saveParticipantsToFirestore(){
  if(!currentUser || !currentEventId) return;
  const ev = events.find(e=>e._id===currentEventId);
  if(!ev) return;
  try{
    await db.collection('users').doc(currentUser.uid).collection('events').doc(currentEventId).update({
      participants: eventParticipants[currentEventId] || []
    });
  }catch(e){console.error('Could not save participants:',e);}
}

// --- Shared Expense Type Toggle ---
// --- Shared Income Toggle ---
let currentIncomeType = 'personal';

function setIncomeType(type){
  currentIncomeType = type;
  document.getElementById('inc-type-personal').classList.toggle('active', type==='personal');
  document.getElementById('inc-type-shared').classList.toggle('active', type==='shared');
  document.getElementById('shared-income-fields').style.display = type==='shared' ? 'block' : 'none';
  if(type==='shared'){
    renderReceivedByDropdown();
    renderIncSplitAmongChips();
  }
}

function renderReceivedByDropdown(){
  const sel = document.getElementById('ev-inc-received-by');
  if(!sel) return;
  const list = eventParticipants[currentEventId] || [];
  sel.innerHTML = list.map(name => `<option value="${escapeHTML(name)}">${escapeHTML(name)}</option>`).join('');
  if(!list.length) sel.innerHTML = `<option value="">${currentLang==='hi'?'पहले प्रतिभागी जोड़ें':'Add participants first'}</option>`;
}

function renderIncSplitAmongChips(){
  const wrap = document.getElementById('ev-inc-split-among');
  if(!wrap) return;
  const list = eventParticipants[currentEventId] || [];
  wrap.innerHTML = list.map(name => `
    <label class="split-chip selected" onclick="toggleSplitChip(this)">
      <input type="checkbox" checked value="${escapeHTML(name)}" style="display:none"/> ${escapeHTML(name)}
    </label>
  `).join('');
}

function toggleSplitChip(chip){
  if(!chip) return;
  chip.classList.toggle('selected');
  const inp = chip.querySelector('input');
  if(inp) inp.checked = chip.classList.contains('selected');
}
window.toggleSplitChip = toggleSplitChip;

async function addSharedIncome(){
  if(!currentEventName || !currentEventId){ toast('No event selected','error'); return; }

  let src = document.getElementById('ev-inc-src').value;
  let isNewCustom = false;
  if(src==='__add_new__'){
    const custom = document.getElementById('ev-inc-custom').value.trim().slice(0,40);
    if(!custom){ toast(TT('give_source_name'),'error'); return; }
    src = custom;
    isNewCustom = true;
  }

  const amt = parseFloat(document.getElementById('ev-inc-amt').value);
  const note = document.getElementById('ev-inc-note').value.trim().slice(0,60);
  const date = document.getElementById('ev-inc-date').value || todayStr();
  const receivedBy = document.getElementById('ev-inc-received-by').value;
  const splitAmong = getSelectedIncSplitAmong();

  if(!isValidAmount(amt)){ toast(TT('enter_valid_amount'),'error'); return; }
  if(!isValidDate(date)){ toast(TT('enter_valid_date'),'error'); return; }
  if(!receivedBy || !splitAmong.length){ toast(currentLang==='hi'?'प्राप्तकर्ता और स्प्लिट सदस्य चुनें':'Select who received and who to split with','error'); return; }

  const sharedInc = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2,6),
    desc: note || src, amt: Math.round(amt*100)/100, cat: 'income', label: src, receivedBy, splitAmong, date, isShared: true, type: 'income'
  };

  try{
    await db.collection('users').doc(currentUser.uid).collection('events').doc(currentEventId).update({
      sharedIncomes: firebase.firestore.FieldValue.arrayUnion(sharedInc)
    });
    toast(TT('income_added_event'),'success');

    document.getElementById('ev-inc-amt').value = '';
    document.getElementById('ev-inc-note').value = '';
    document.getElementById('ev-inc-custom').value = '';
    document.getElementById('ev-inc-custom-wrap').style.display = 'none';
    if(isNewCustom && typeof saveCustomIncomeSource === 'function') saveCustomIncomeSource(src);

    renderEventDetail();
  }catch(e){ toast('Could not save: '+e.message,'error'); }
}

function getSelectedIncSplitAmong(){
  const wrap = document.getElementById('ev-inc-split-among');
  if(!wrap) return [];
  const checked = wrap.querySelectorAll('.split-chip.selected input');
  return [...checked].map(inp => inp.value);
}

function setExpenseType(type){
  currentExpenseType = type;
  document.getElementById('exp-type-personal').classList.toggle('active', type==='personal');
  document.getElementById('exp-type-shared').classList.toggle('active', type==='shared');
  document.getElementById('shared-expense-fields').style.display = type==='shared' ? 'block' : 'none';
  if(type==='shared'){
    renderPaidByDropdown();
    renderSplitAmongChips();
  }
}

function renderPaidByDropdown(){
  const sel = document.getElementById('ev-exp-paid-by');
  if(!sel) return;
  const list = eventParticipants[currentEventId] || [];
  sel.innerHTML = list.map(name => `<option value="${escapeHTML(name)}">${escapeHTML(name)}</option>`).join('');
  if(!list.length) sel.innerHTML = `<option value="">${currentLang==='hi'?'पहले प्रतिभागी जोड़ें':'Add participants first'}</option>`;
}

function renderSplitAmongChips(){
  const wrap = document.getElementById('ev-exp-split-among');
  if(!wrap) return;
  const list = eventParticipants[currentEventId] || [];
  wrap.innerHTML = list.map(name => `
    <label class="split-chip selected" onclick="toggleSplitChip(this)">
      <input type="checkbox" checked value="${escapeHTML(name)}" style="display:none"/> ${escapeHTML(name)}
    </label>
  `).join('');
}

function getSelectedSplitAmong(){
  const wrap = document.getElementById('ev-exp-split-among');
  if(!wrap) return [];
  const checked = wrap.querySelectorAll('.split-chip.selected input');
  return [...checked].map(inp => inp.value);
}

async function addSharedExpense(){
  if(!currentEventName || !currentEventId){ toast('No event selected','error'); return; }

  let cat = document.getElementById('ev-exp-cat').value;
  let customCat = '';
  let isNewCustom = false;
  if(cat==='__add_new__'){
    customCat = document.getElementById('ev-exp-custom').value.trim().slice(0,40);
    if(!customCat){ toast(TT('give_category_name'),'error'); return; }
    cat = 'custom';
    isNewCustom = true;
  } else if(cat.startsWith('custom:')){
    customCat = cat.slice(7);
    cat = 'custom';
  }

  const amt = parseFloat(document.getElementById('ev-exp-amt').value);
  const desc = document.getElementById('ev-exp-desc').value.trim().slice(0,60);
  const date = document.getElementById('ev-exp-date').value || todayStr();
  const paidBy = document.getElementById('ev-exp-paid-by').value;
  const splitAmong = getSelectedSplitAmong();

  if(!isValidAmount(amt)){ toast(TT('enter_valid_amount'),'error'); return; }
  if(!isValidDate(date)){ toast(TT('enter_valid_date'),'error'); return; }
  if(!paidBy || !splitAmong.length){ toast(currentLang==='hi'?'भुगतानकर्ता और स्प्लिट सदस्य चुनें':'Select who paid and who to split with','error'); return; }

  const sharedExp = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2,6),
    desc, amt: Math.round(amt*100)/100, cat, customCat, paidBy, splitAmong, date, isShared: true, type: 'expense'
  };

  try{
    await db.collection('users').doc(currentUser.uid).collection('events').doc(currentEventId).update({
      sharedExpenses: firebase.firestore.FieldValue.arrayUnion(sharedExp)
    });

    toast(TT('expense_added_event'),'success');

    document.getElementById('ev-exp-amt').value = '';
    document.getElementById('ev-exp-desc').value = '';
    document.getElementById('ev-exp-custom').value = '';
    document.getElementById('ev-exp-custom-wrap').style.display = 'none';
    if(isNewCustom && typeof saveCustomExpenseCategory === 'function') saveCustomExpenseCategory(customCat);

    renderEventDetail();
  }catch(e){ toast('Could not save: '+e.message,'error'); }
}

function calculateSettlement(eventId){
  const allEvents = (typeof window !== 'undefined' && Array.isArray(window.events) && window.events.length) ? window.events : (typeof events !== 'undefined' ? events : []);
  const curEvId = eventId || ((typeof currentEventId !== 'undefined' && currentEventId) ? currentEventId : ((typeof window !== 'undefined' && window.currentEventId) ? window.currentEventId : (allEvents.length ? allEvents[0]._id : null)));
  const ev = allEvents.find(e=>e._id===curEvId);
  const pMap = (typeof eventParticipants !== 'undefined' && eventParticipants && eventParticipants[curEvId]) ? eventParticipants : (typeof window !== 'undefined' ? window.eventParticipants : {});
  const participants = (curEvId && pMap && pMap[curEvId]) ? pMap[curEvId] : (ev?.participants || []);
  if(!ev || !participants.length || participants.length < 2) return null;

  const sharedExps = (ev.sharedExpenses || []).filter(x => x.type !== 'income');
  const sharedIncs = [
    ...(ev.sharedIncomes || []),
    ...(ev.sharedExpenses || []).filter(x => x.type === 'income')
  ];
  if(!sharedExps.length && !sharedIncs.length) return null;

  const balances = {};
  participants.forEach(p => balances[p] = 0);

  // 1. Shared Expenses
  sharedExps.forEach(exp => {
    if (!exp.splitAmong || !exp.splitAmong.length) return;
    const share = exp.amt / exp.splitAmong.length;
    const payer = exp.paidBy;
    if(balances[payer] !== undefined) balances[payer] += exp.amt;
    exp.splitAmong.forEach(person => {
      if(balances[person] !== undefined) balances[person] -= share;
    });
  });

  // 2. Shared Incomes
  sharedIncs.forEach(inc => {
    if (!inc.splitAmong || !inc.splitAmong.length) return;
    const share = inc.amt / inc.splitAmong.length;
    const receiver = inc.receivedBy || inc.paidBy;
    inc.splitAmong.forEach(person => {
      if(balances[person] !== undefined) balances[person] += share;
    });
    if(balances[receiver] !== undefined) balances[receiver] -= inc.amt;
  });

  Object.keys(balances).forEach(p => balances[p] = Math.round(balances[p] * 100) / 100);

  const creditors = [];
  const debtors = [];
  Object.entries(balances).forEach(([name, balance]) => {
    if(balance > 0.01) creditors.push({name, amount: balance});
    else if(balance < -0.01) debtors.push({name, amount: -balance});
  });

  creditors.sort((a,b) => b.amount - a.amount);
  debtors.sort((a,b) => b.amount - a.amount);

  const transfers = [];
  let i = 0, j = 0;
  while(i < creditors.length && j < debtors.length){
    const amt = Math.min(creditors[i].amount, debtors[j].amount);
    if(amt > 0.01){
      transfers.push({
        from: debtors[j].name,
        to: creditors[i].name,
        amount: Math.round(amt * 100) / 100
      });
    }
    creditors[i].amount -= amt;
    debtors[j].amount -= amt;
    if(creditors[i].amount < 0.01) i++;
    if(debtors[j].amount < 0.01) j++;
  }

  return { balances, transfers };
}
window.calculateSettlement = calculateSettlement;
window.renderSettlement = renderSettlement;

function renderSettlement(){
  const section = document.getElementById('settlement-section');
  const balancesEl = document.getElementById('settlement-balances');
  const transfersEl = document.getElementById('settlement-transfers');
  const settledEl = document.getElementById('settlement-settled');

  if(!section || !balancesEl || !transfersEl) return;

  const result = calculateSettlement();
  if(!result){
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';

  // Render balances
  const participants = eventParticipants[currentEventId] || [];
  balancesEl.innerHTML = `
    <div style="font-size:11px;color:var(--text-faint);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.3px">${currentLang==='hi'?'बैलेंस':'Balances'}</div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px">
      ${participants.map(p => {
        const bal = result.balances[p] || 0;
        const cls = bal > 0.01 ? 'balance-positive' : (bal < -0.01 ? 'balance-negative' : 'balance-zero');
        const sign = bal > 0 ? '+' : '';
        return `<div style="text-align:center;flex:1;min-width:80px">
          <div style="font-size:11px;color:var(--text-dim);margin-bottom:2px">${escapeHTML(p)}</div>
          <div class="${cls}">${sign}₹${Math.abs(bal)}</div>
        </div>`;
      }).join('')}
    </div>
  `;

  // Render transfers
  if(result.transfers.length === 0){
    transfersEl.innerHTML = '';
    settledEl.style.display = 'block';
  } else {
    settledEl.style.display = 'none';
    transfersEl.innerHTML = `
      <div style="font-size:11px;color:var(--text-faint);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.3px">${currentLang==='hi'?'भुगतान करें':'Who pays whom'}</div>
      ${result.transfers.map(t => `
        <div class="settlement-card">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div style="display:flex;align-items:center;flex-wrap:wrap">
              <span style="font-weight:600;color:var(--red)">${escapeHTML(t.from)}</span>
              <span class="settlement-arrow">→</span>
              <span style="font-weight:600;color:var(--green)">${escapeHTML(t.to)}</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:15px;font-weight:700;color:var(--text)">₹${t.amount}</span>
            </div>
          </div>
        </div>
      `).join('')}
    `;
  }
}

function renderEventDetail(){
  if(!currentEventName || !currentEventId) return;

  const stats = eventStats(currentEventName, currentEventId);
  const ev = events.find(e=>e._id===currentEventId);
  const participants = ev?.participants || [];
  const sharedExps = (ev?.sharedExpenses || []).filter(x => x.type !== 'income');
  const sharedIncs = [
    ...(ev?.sharedIncomes || []),
    ...(ev?.sharedExpenses || []).filter(x => x.type === 'income')
  ];

  const totalInc = stats.income + sharedIncs.reduce((s,e)=>s+e.amt, 0);
  const totalSpent = stats.spent + sharedExps.reduce((s,e)=>s+e.amt, 0);
  const totalCount = stats.count + sharedExps.length + sharedIncs.length;

  document.getElementById('ev-income').textContent = '₹' + totalInc;
  document.getElementById('ev-spent').textContent = '₹' + totalSpent;
  document.getElementById('ev-balance').textContent = '₹' + (totalInc - totalSpent);
  document.getElementById('ev-count').textContent = totalCount;

  if(!eventParticipants[currentEventId]) eventParticipants[currentEventId] = participants;
  renderParticipants();

  const sorted = [...stats.list].sort((a,b) => b.date.localeCompare(a.date));
  const allEntries = [
    ...sorted.map(e => ({...e, isShared: false})),
    ...sharedExps.map(e => ({...e, isShared: true, type: 'expense'})),
    ...sharedIncs.map(e => ({...e, isShared: true, type: 'income'}))
  ].sort((a,b) => b.date.localeCompare(a.date));

  const listEl = document.getElementById('event-entries-list');
  if (listEl) {
    listEl.innerHTML = allEntries.length ? allEntries.map(e => {
      const isShared = e.isShared;
      const personLabel = e.type === 'income' ? (e.receivedBy || e.paidBy || '') : (e.paidBy || '');
      const sharedBadge = isShared ? `<span class="shared-expense-badge">👥 ${escapeHTML(personLabel)}</span>` : '';
      const splitInfo = isShared ? `<span style="font-size:10.5px;color:var(--text-faint);margin-left:4px">${currentLang==='hi'?'बांटा गया':'split'} ${e.splitAmong?.length || 0} ${currentLang==='hi'?'लोगों में':'ways'}</span>` : '';

      return `
      <div class="entry-row">
        <span class="date-chip">${fmtDate(e.date)}</span>
        ${e.type==='expense' && e.cat ? `<span class="badge ${e.cat}">${escapeHTML(isShared ? (e.customCat || CAT_LABEL(e.cat)) : displayCatLabel(e))}</span>` : ''}
        <span style="flex:1;color:var(--text)">${escapeHTML(e.label || e.desc || '')}${e.note ? ' — '+escapeHTML(e.note) : ''}${sharedBadge}${splitInfo}</span>
        <span style="font-weight:600;color:${e.type==='income'?'var(--green)':'var(--red)'}">${e.type==='income'?'+':'-'}₹${e.amt}</span>
        <div class="row-actions">
          ${isShared ? (e.type==='income' ? `<button class="icon-btn" onclick="deleteSharedIncome('${e.id}')" aria-label="delete">🗑️</button>` : `<button class="icon-btn" onclick="deleteSharedExpense('${e.id}')" aria-label="delete">🗑️</button>`) :
            `<button class="icon-btn" onclick="startEditEventEntry('${e._id}')" aria-label="edit">✏️</button>
             <button class="icon-btn" onclick="deleteEntry('${e._id}')" aria-label="delete">🗑️</button>`}
        </div>
      </div>`;
    }).join('') : `<p class="empty">${TT('no_entries_event')}</p>`;
  }

  renderSettlement();
}
window.renderEventDetail = renderEventDetail;

async function deleteSharedExpense(expId){
  if(!currentUser || !currentEventId) return;
  const ev = events.find(e=>e._id===currentEventId);
  if(!ev || !ev.sharedExpenses) return;

  const updated = ev.sharedExpenses.filter(e => e.id !== expId);
  try{
    await db.collection('users').doc(currentUser.uid).collection('events').doc(currentEventId).update({
      sharedExpenses: updated
    });
    toast(TT('entry_deleted'),'success');
    renderEventDetail();
  }catch(e){ toast('Could not delete: '+e.message,'error'); }
}
window.deleteSharedExpense = deleteSharedExpense;

async function deleteSharedIncome(incId){
  if(!currentUser || !currentEventId) return;
  const ev = events.find(e=>e._id===currentEventId);
  if(!ev) return;
  const sharedIncs = ev.sharedIncomes || [];
  const updatedIncs = sharedIncs.filter(e => e.id !== incId);
  const legacyShared = (ev.sharedExpenses || []).filter(e => !(e.type === 'income' && e.id === incId));
  
  try{
    await db.collection('users').doc(currentUser.uid).collection('events').doc(currentEventId).update({
      sharedIncomes: updatedIncs,
      sharedExpenses: legacyShared
    });
    toast(TT('entry_deleted'),'success');
    renderEventDetail();
  }catch(e){ toast('Could not delete: '+e.message,'error'); }
}
window.deleteSharedIncome = deleteSharedIncome;

// We patch the functions after they're defined by wrapping them
// This is done at the bottom of the script


// ============ SMART UPI NOTIFICATION LOGGER ============
const MERCHANT_CATEGORY_MAP = {
  food:{keywords:['swiggy','zomato','food','cafe','restaurant','pizza','burger','mcdonald','domino','kfc','subway','chai','samosa','mess','canteen','biryani','hotel','paratha','dosa','bhel','pani puri','vada pav','pav bhaji','bakery','cake','juice','smoothie','starbucks','barista','pizza hut','burger king','haldiram','sweet','mithai','grocery','bigbasket','blinkit','zepto','instamart','dmart','reliance fresh','supermarket']},
  travel:{keywords:['uber','ola','rapido','metro','irctc','train','bus','flight','makemytrip','ixigo','redbus','auto','taxi','cab','petrol','diesel','fuel','parking','toll','airport']},
  friends:{keywords:['movie','cinema','pvr','inox','game','gaming','steam','playstation','netflix','hotstar','prime video','spotify','concert','party','bar','pub','club','event','ticket','bookmyshow']},
  home:{keywords:['electricity','bill','water','gas','internet','broadband','jio','airtel','vi ','bsnl','recharge','rent','maintenance','amazon','flipkart','meesho','ajio','myntra','shopping']},
};

function parseUpiNotification(text) {
  if (!text || !text.trim()) return null;
  const raw = text.trim();
  let app = 'UPI App';
  if (/google\s*pay|gpay/i.test(raw)) app = 'Google Pay';
  else if (/phonepe|phone\s*pe/i.test(raw)) app = 'PhonePe';
  else if (/paytm/i.test(raw)) app = 'Paytm';
  else if (/bhim/i.test(raw)) app = 'BHIM';
  else if (/amazon\s*pay|amazon/i.test(raw)) app = 'Amazon Pay';
  else if (/cred/i.test(raw)) app = 'CRED';

  let direction = 'sent';
  if (/reciev|receiv|rsvd|rs\s*rcvd|rcv|credit|deposited|प्राप्त|क्रेडिट|जमा हुआ|rcvd|recvd/i.test(raw)) direction = 'received';

  let amount = null;
  const amountPatterns = [
    /(?:₹|रु\.?|Rs\.?|INR)\s*(\d+(?:,\d{2,3})*(?:\.\d{1,2})?)/i,
    /(?:paid|sent|received|transferred|reciev|reieved)\s+(?:₹|Rs\.?|INR)?\s*(\d+(?:,\d{2,3})*(?:\.\d{1,2})?)/i,
    /(\d+(?:,\d{2,3})*(?:\.\d{1,2})?)\s*(?:to|se|from|ko|via)/i,
  ];
  for (const pat of amountPatterns) {
    const match = raw.match(pat);
    if (match) { amount = parseFloat(match[1].replace(/,/g, '')); if (amount > 0 && amount <= 10000000) break; amount = null; }
  }

  let merchant = '';
  const merchantPatterns = [/(?:to|ko|को)\s+([A-Za-z0-9\s@._-]{3,40}?)(?:\s+on|\s+via|\s+UPI|\s+Ref)/i, /(?:from|se|से)\s+([A-Za-z0-9\s@._-]{3,40}?)(?:\s+on|\s+via|\s+UPI)/i];
  for (const pat of merchantPatterns) {
    const match = raw.match(pat);
    if (match && match[1]) { merchant = match[1].trim().replace(/\s*(via|using|on|UPI|Ref).*$/i, '').trim(); if (merchant.length > 1 && merchant.length < 40) break; merchant = ''; }
  }

  let suggestedCat = 'other';
  const lowerRaw = (raw + ' ' + merchant).toLowerCase();
  for (const [cat, config] of Object.entries(MERCHANT_CATEGORY_MAP)) {
    if (config.keywords.some(kw => lowerRaw.includes(kw))) { suggestedCat = cat; break; }
  }
  return { amount, direction, merchant, app, suggestedCat, raw };
}

function pasteFromClipboard() {
  if (navigator.clipboard && navigator.clipboard.readText) {
    navigator.clipboard.readText().then(text => { document.getElementById('smart-log-input').value = text; onSmartLogInput(); }).catch(() => toast('Paste manually','error'));
  } else { toast('Paste manually','error'); }
}
function onSmartLogInput() {
  const input = document.getElementById('smart-log-input');
  const text = input.value.trim();
  const parseBtn = document.getElementById('smart-log-parse-btn');
  parseBtn.style.display = text.length > 10 ? 'inline-flex' : 'none';
  // Toggle green border when content is detected
  if(text.length > 10) {
    input.classList.add('has-content');
  } else {
    input.classList.remove('has-content');
  }
}
function populateSmartLogCategories(){
  var sel = document.getElementById('smart-log-cat');
  if(!sel) return;
  var html = '';
  var cats = [
    {value:'food', label:'Food & snacks'},
    {value:'travel', label:'Travel'},
    {value:'friends', label:'Friends & social'},
    {value:'home', label:'Home & bills'},
    {value:'shopping', label:'Shopping'},
    {value:'entertainment', label:'Entertainment'},
    {value:'health', label:'Health'},
    {value:'education', label:'Education'},
    {value:'work', label:'Work'},
    {value:'other', label:'Other'}
  ];
  cats.forEach(function(c){
    html += '<option value="'+c.value+'">'+c.label+'</option>';
  });
  if(typeof customExpenseCategories !== 'undefined'){
    customExpenseCategories.forEach(function(name){
      html += '<option value="custom:'+name+'">'+name+'</option>';
    });
  }
  html += '<option value="__add_new__">+ Add new category</option>';
  sel.innerHTML = html;
  sel.onchange = function(){
    const wrap = document.getElementById('smart-log-custom-wrap');
    if(wrap) wrap.style.display = this.value === '__add_new__' ? 'block' : 'none';
  };
}

let smartLogType = 'expense';

function setSmartLogType(type) {
  smartLogType = type === 'income' ? 'income' : 'expense';
  const expBtn = document.getElementById('smart-log-type-exp');
  const incBtn = document.getElementById('smart-log-type-inc');
  const badge = document.getElementById('smart-log-direction-badge');
  if (expBtn) expBtn.classList.toggle('active', smartLogType === 'expense');
  if (incBtn) incBtn.classList.toggle('active', smartLogType === 'income');
  if (badge) {
    if (smartLogType === 'income') {
      badge.className = 'smart-log-badge received';
      badge.textContent = '📥 Income';
    } else {
      badge.className = 'smart-log-badge sent';
      badge.textContent = '📤 Expense';
    }
  }
}

function parseSmartLog() {
  try {
    var inputText = document.getElementById('smart-log-input').value;
    var result = parseUpiNotification(inputText);
    if (!result || !result.amount) { toast(TT('smart_log_not_detected'), 'error'); return; }
    document.getElementById('smart-log-parsed').style.display = 'block';
    document.getElementById('smart-log-amt').value = result.amount;
    // Populate category dropdown THEN set value
    populateSmartLogCategories();
    var catSel = document.getElementById('smart-log-cat');
    if(catSel) catSel.value = result.suggestedCat;
    // Always fill date and description
    var dateEl = document.getElementById('smart-log-date');
    if(dateEl) dateEl.value = todayStr();
    var descEl = document.getElementById('smart-log-desc');
    if(descEl) descEl.value = result.merchant || 'UPI payment';
    document.getElementById('smart-log-app-badge').textContent = result.app;
    setSmartLogType(result.direction === 'received' ? 'income' : 'expense');
    document.getElementById('smart-log-parsed').scrollIntoView({ behavior: 'smooth', block: 'center' });
    toast(TT('smart_log_parsed'), 'success');
  } catch(e) {
    console.error('parseSmartLog error:', e);
    toast(TT('smart_log_not_detected'), 'error');
  }
}
async function confirmSmartLog() {
  try {
    const amt = parseFloat(document.getElementById('smart-log-amt').value);
    const cat = document.getElementById('smart-log-cat').value;
    const date = document.getElementById('smart-log-date').value || todayStr();
    const desc = document.getElementById('smart-log-desc').value.trim().slice(0, 60) || 'UPI payment';
    const badge = document.getElementById('smart-log-direction-badge');
    const isIncome = smartLogType === 'income' || (badge && (badge.textContent.includes('Received') || badge.textContent.includes('Income')));
    if (!isValidAmount(amt)) { toast(TT('enter_valid_amount'), 'error'); return; }
    let finalCat = isIncome ? 'income' : cat;
    if(cat === '__add_new__'){
      const customInput = document.getElementById('smart-log-custom-cat');
      const customVal = customInput ? customInput.value.trim() : '';
      if(!customVal){ toast(currentLang==='hi'?'श्रेणी का नाम लिखें':'Enter a category name', 'error'); return; }
      finalCat = 'custom:' + customVal;
      saveCustomExpenseCategory(customVal);
    }
    const payload = { type: isIncome ? 'income' : 'expense', cat: finalCat, label: desc, note: '⚡ Smart Logger', amt: Math.round(amt * 100) / 100, date };
    const rawInputEl = document.getElementById('smart-log-input');
    const hint = rawInputEl ? String(rawInputEl.value || '') : '';
    const guardFn = (typeof maybeGuardAndSaveWithSmartEngine === 'function') ? maybeGuardAndSaveWithSmartEngine : (typeof maybeGuardAndSave === 'function' ? maybeGuardAndSave : null);
    if (guardFn) {
      await guardFn(payload, async () => {
        await saveEntry(payload);
        toast(TT('smart_log_saved'), 'success');
        dismissSmartLog();
        if (!isIncome) { checkBudget(); showSpendMoodToast(amt); }
        if (typeof maybeOfferRecurring === 'function') maybeOfferRecurring({ ...payload, hint });
      }, hint || desc);
    } else {
      await saveEntry(payload);
      toast(TT('smart_log_saved'), 'success');
      dismissSmartLog();
      if (!isIncome) { checkBudget(); showSpendMoodToast(amt); }
    }
  } catch(e) { toast('Could not save: '+e.message, 'error'); }
}
function dismissSmartLog() { document.getElementById('smart-log-parsed').style.display = 'none'; document.getElementById('smart-log-input').value = ''; document.getElementById('smart-log-parse-btn').style.display = 'none'; }
function renderSmartLogHistory() {
  const el = document.getElementById('smart-log-history'); if (!el) return;
  const logs = mainEntries().filter(e => e.note && e.note.includes('Smart Logger')).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
  if (!logs.length) { el.innerHTML = '<p class="empty">No smart logs yet.</p>'; return; }
  el.innerHTML = logs.map(e => '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);font-size:13px"><span class="smart-log-badge '+(e.type==='income'?'received':'sent')+'">'+(e.type==='income'?'📥 +':'📤 -')+'₹'+e.amt+'</span><span style="flex:1;color:var(--text)">'+escapeHTML(e.label)+'</span><span style="font-size:11px;color:var(--text-faint)">'+fmtDate(e.date)+'</span></div>').join('');
}

function clearAll(){
  if(!currentUser)return;
  showAppConfirm('Clear ALL entries? This cannot be undone.', async ()=>{
    const snap = await db.collection('users').doc(currentUser.uid).collection('entries').get();
    let batch=db.batch(), ops=0;
    for(const d of snap.docs){
      batch.delete(d.ref); ops++;
      if(ops===400){ await batch.commit(); batch=db.batch(); ops=0; }
    }
    if(ops) await batch.commit();
    toast(TT('all_cleared'),'success');
  });
}

if (typeof renderReport === 'function') renderReport();
applyLanguage();

// --- PWA: installable app (manifest + service worker). This enables
// "Add to Home Screen" / install as an app on Android & iOS. For a REAL
// standalone APK (not PWA), wrap the app with Capacitor/Cordova — see notes.
if('serviceWorker' in navigator){
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('sw.js').catch(err=>console.log('SW registration failed:',err));
  });
}
// --- PWA: capture the install prompt so an "Install app" button can be offered ---
let deferredPrompt=null;
function refreshInstallButton(){
  const btn=document.getElementById('install-app-btn');
  if(!btn) return;
  const standalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const show = !standalone && (deferredPrompt || ios);
  btn.style.display = show ? 'inline-flex' : 'none';
}
window.addEventListener('beforeinstallprompt',(e)=>{
  e.preventDefault();
  deferredPrompt=e;
  refreshInstallButton();
});
window.addEventListener('appinstalled',()=>{
  deferredPrompt=null;
  refreshInstallButton();
});
function promptInstallApp(){
  if(deferredPrompt && deferredPrompt.prompt){
    deferredPrompt.prompt();
    deferredPrompt.userChoice && deferredPrompt.userChoice.then(()=>{ deferredPrompt=null; refreshInstallButton(); });
    return;
  }
  // iOS Safari has no prompt() — guide the user to "Add to Home Screen"
  showAppConfirm(
    'To install PocketTrack as an app on iPhone/iPad:\n\n1) Tap the Share (⤴) button in Safari\n2) Scroll and tap "Add to Home Screen"\n3) Tap Add',
    ()=>{}, 'Install PocketTrack'
  );
}
document.addEventListener('DOMContentLoaded', ()=>{ setTimeout(refreshInstallButton, 300); });

// --- Bottom tab bar visibility (hide on the auth/login screen) ---
if (typeof window.updateBottomBarVisibility !== 'function') {
  window.updateBottomBarVisibility = function() {
    const bar = document.getElementById('bottom-tab-bar');
    const auth = document.getElementById('auth-screen');
    if(!bar) return;
    const onAuthScreen = auth && auth.style.display !== 'none';
    bar.style.display = onAuthScreen ? 'none' : 'flex';
  };
}

// =====================================================================
// DUAL-MODE ENGINE (SIMPLE 40+ / SENIOR & YOUTH POWER MODE)
// =====================================================================
window.currentAppMode = localStorage.getItem('pockettrack_app_mode') || 'power';

window.setAppMode = function(mode, save = true) {
  window.currentAppMode = mode;
  const isSimple = (mode === 'simple');
  
  if (document.body) document.body.classList.toggle('app-mode-simple', isSimple);
  if (document.documentElement) document.documentElement.classList.toggle('app-mode-simple', isSimple);
  
  const iconEl = document.getElementById('mode-icon');
  const labelEl = document.getElementById('mode-label');

  if (isSimple) {
    if (iconEl) iconEl.textContent = '👴';
    if (labelEl) labelEl.textContent = 'Simple';
    if (save) {
      localStorage.setItem('pockettrack_app_mode', 'simple');
      if (typeof toast === 'function') toast('Switched to Simple Mode (40+)', 'success');
    }
  } else {
    if (iconEl) iconEl.textContent = '⚡';
    if (labelEl) labelEl.textContent = 'Power';
    if (save) {
      localStorage.setItem('pockettrack_app_mode', 'power');
      if (typeof toast === 'function') toast('Switched to Power Mode', 'success');
    }
  }
};

window.toggleAppMode = function() {
  window.openAgeModeModal();
};

window.triggerManualSync = async function() {
  const statusEl = document.getElementById('sync-status');
  const dotEl = document.querySelector('#sync-pill-btn .dot');
  if (statusEl) statusEl.textContent = 'Syncing...';
  if (dotEl) dotEl.style.background = '#f59e0b';
  
  try {
    if (typeof currentUser !== 'undefined' && currentUser && typeof db !== 'undefined') {
      const snap = await db.collection('users').doc(currentUser.uid).collection('entries').limit(500).get();
      if (!snap.empty) {
        entries = snap.docs.map(d => ({ _id: d.id, ...d.data() })).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
        if (typeof window !== 'undefined') window.entries = entries;
        try {
          localStorage.setItem('pockettrack_entries_cache_' + currentUser.uid, JSON.stringify(entries));
          localStorage.setItem('pockettrack_entries_cache', JSON.stringify(entries));
        } catch(e){}
        if (typeof updateHeaderStats === 'function') updateHeaderStats();
        if (typeof renderEntries === 'function') renderEntries();
        if (typeof renderHomeSnapshot === 'function') renderHomeSnapshot();
        if (typeof renderReport === 'function') renderReport();
      }
      if (typeof loadWallets === 'function') loadWallets();
      if (typeof renderWalletSwitcher === 'function') renderWalletSwitcher();
      
      if (statusEl) statusEl.textContent = 'Synced';
      if (dotEl) dotEl.style.background = 'var(--green,#34d399)';
      if (typeof toast === 'function') toast('☁️ Cloud Firestore backup complete (All data up to date)', 'success');
    } else {
      if (statusEl) statusEl.textContent = 'Local';
      if (dotEl) dotEl.style.background = 'var(--green,#34d399)';
      if (typeof toast === 'function') toast('📱 Local mode — Sign in with Google to backup to Cloud', 'info');
    }
  } catch (e) {
    if (statusEl) statusEl.textContent = 'Offline';
    if (dotEl) dotEl.style.background = '#ef4444';
    if (typeof toast === 'function') toast('Sync notice: ' + (e.message || 'Offline ready'), 'info');
  }
};

window.openAgeModeModal = function() {
  const isHi = (typeof currentLang !== 'undefined' && currentLang === 'hi');
  const existing = document.getElementById('age-mode-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'age-mode-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(7,4,20,0.88);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);z-index:999999;display:flex;align-items:center;justify-content:center;padding:16px;animation:fadeIn 0.25s ease;';

  const currentMode = window.currentAppMode || localStorage.getItem('pockettrack_app_mode') || 'power';

  modal.innerHTML = `
    <div style="max-width:440px;width:100%;background:linear-gradient(160deg,#1a133d,#0d0a21);border:1px solid rgba(139,92,246,0.5);border-radius:28px;padding:26px 22px;box-shadow:0 25px 70px rgba(0,0,0,0.85);color:#fff;text-align:center;position:relative;">
      <div style="font-size:38px;margin-bottom:8px;">🎯</div>
      <h3 style="margin:0 0 6px;font-family:'Space Grotesk',sans-serif;font-size:21px;font-weight:800;">
        ${isHi ? 'अपनी आयु चुनें' : 'Choose Your Experience'}
      </h3>
      <p style="font-size:12.5px;color:#cbd5e1;line-height:1.45;margin:0 0 20px;">
        ${isHi ? 'हम आपके लिए सबसे आसान और उपयुक्त इंटरफ़ेस सेट करेंगे।' : 'Tailors text size, contrast, and features for your needs. Switch anytime.'}
      </p>

      <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:16px;">
        <!-- Option 1: 40+ Senior / Simple -->
        <div onclick="selectAgeExperience('40_plus')" style="background:${currentMode==='simple'?'rgba(52,211,153,0.15)':'rgba(255,255,255,0.04)'};border:2px solid ${currentMode==='simple'?'var(--green,#34d399)':'rgba(52,211,153,0.35)'};border-radius:20px;padding:16px;cursor:pointer;text-align:left;display:flex;align-items:center;gap:14px;transition:all 0.18s;">
          <div style="font-size:34px;width:44px;text-align:center;">👴</div>
          <div style="flex:1;">
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <div style="font-size:15.5px;font-weight:800;color:#34d399;">${isHi ? '40+ वर्ष (सरल मोड)' : '40+ Years (Simple Mode)'}</div>
              ${currentMode==='simple'?'<span style="font-size:11px;background:#34d399;color:#000;font-weight:800;padding:2px 8px;border-radius:99px;">ACTIVE</span>':''}
            </div>
            <div style="font-size:12px;color:#94a3b8;margin-top:3px;line-height:1.35;">
              ${isHi ? 'बड़ा टेक्स्ट, हाई कंट्रास्ट, 1-नंबर बजट, आसान पासबुक खाता और शून्य उलझन।' : 'Extra large readable text, high contrast, 1-number budget, simple passbook & zero clutter.'}
            </div>
          </div>
        </div>

        <!-- Option 2: Below 40 Power Mode -->
        <div onclick="selectAgeExperience('under_40')" style="background:${currentMode==='power'?'rgba(139,92,246,0.18)':'rgba(255,255,255,0.04)'};border:2px solid ${currentMode==='power'?'var(--accent,#8b5cf6)':'rgba(139,92,246,0.35)'};border-radius:20px;padding:16px;cursor:pointer;text-align:left;display:flex;align-items:center;gap:14px;transition:all 0.18s;">
          <div style="font-size:34px;width:44px;text-align:center;">⚡</div>
          <div style="flex:1;">
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <div style="font-size:15.5px;font-weight:800;color:#a78bfa;">${isHi ? '40 से कम (पावर मोड)' : 'Under 40 (Power Mode)'}</div>
              ${currentMode==='power'?'<span style="font-size:11px;background:#8b5cf6;color:#fff;font-weight:800;padding:2px 8px;border-radius:99px;">ACTIVE</span>':''}
            </div>
            <div style="font-size:12px;color:#94a3b8;margin-top:3px;line-height:1.35;">
              ${isHi ? 'मल्टी-वॉलेट्स, फ्यूचर मनी सिम्युलेटर, चिल्लर वॉल्ट, वित्तीय डीएनए और प्रो टूल्स।' : 'Multi-wallets & accounts, Future Simulator, Chillar Vault, Financial DNA & Pro tools.'}
            </div>
          </div>
        </div>
      </div>

      <button onclick="document.getElementById('age-mode-modal')?.remove()" style="background:transparent;border:none;color:var(--text-dim,#94a3b8);font-size:12px;cursor:pointer;padding:6px 12px;">
        ${isHi ? 'बाद में तय करें ✕' : 'Close / Decide Later ✕'}
      </button>
    </div>
  `;

  document.body.appendChild(modal);
};

window.selectAgeExperience = function(ageGroup) {
  localStorage.setItem('pockettrack_age_group', ageGroup);
  localStorage.setItem('pockettrack_app_mode_chosen', 'true');
  const targetMode = (ageGroup === '40_plus') ? 'simple' : 'power';
  window.setAppMode(targetMode, true);
  const m = document.getElementById('age-mode-modal');
  if (m) m.remove();
  if (typeof toast === 'function') {
    toast(targetMode === 'simple' ? '👴 Set to Simple 40+ Mode' : '⚡ Set to Power Mode', 'success');
  }
};

window.openFirstTimeModeSelector = function() {
  window.openAgeModeModal();
};

// Initial App Mode Setup on load
document.addEventListener('DOMContentLoaded', () => {
  const savedMode = localStorage.getItem('pockettrack_app_mode') || 'power';
  window.setAppMode(savedMode, false);
  
  // Prompt user for age group if not already set
  if (!localStorage.getItem('pockettrack_age_group') && !localStorage.getItem('pockettrack_app_mode_chosen')) {
    const onboardingEl = document.getElementById('onboarding-screen');
    const isOnboardingActive = onboardingEl && onboardingEl.style.display !== 'none';
    if (!isOnboardingActive) {
      setTimeout(() => {
        const authEl = document.getElementById('auth-screen');
        const isAuthShowing = authEl && authEl.style.display !== 'none';
        if (!isAuthShowing && typeof window.openAgeModeModal === 'function') {
          window.openAgeModeModal();
        }
      }, 400);
    }
  }
});

