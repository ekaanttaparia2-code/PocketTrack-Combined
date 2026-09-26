/* =====================================================================
   smart_engine.js — PocketTrack Smart Context & Intent Engine (Phase 4)
   Understands user intent across Composer, Voice, Smart Logger & Activity.
   Auto-detects People, Ledgers, Spaces/Events, Recurring & Subscriptions.
   ===================================================================== */

const SMART_INTENTS = {
  LEDGER_PERSON: 'LEDGER_PERSON',
  EVENT_SPACE: 'EVENT_SPACE',
  RECURRING_SUBSCRIPTION: 'RECURRING_SUBSCRIPTION',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  NORMAL_ENTRY: 'NORMAL_ENTRY'
};

// --- Multi-intent Analyzer ---
function analyzeTransactionIntent(payload, rawText) {
  const text = ((payload.label || '') + ' ' + (payload.note || '') + ' ' + (rawText || '')).toLowerCase();
  const amt = parseFloat(payload.amt) || 0;

  // 1. People & Ledger Intelligence
  if (typeof ledgerPeople !== 'undefined' && Array.isArray(ledgerPeople) && ledgerPeople.length > 0) {
    for (const person of ledgerPeople) {
      if (!person || !person.name) continue;
      const pName = person.name.toLowerCase().trim();
      if (pName.length < 2) continue;

      // Word boundary match for person name
      const nameRegex = new RegExp('(?:^|\\s|to|from|with|ko|se)' + pName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:$|\\s|[.,!?])', 'i');
      if (nameRegex.test(text) || text.includes(pName)) {
        // Determine whether user gave or received money
        let ledgerType = 'gave';
        if (payload.type === 'income' || /reciev|receiv|got from|from|se|mila|aaye|credit/i.test(text)) {
          ledgerType = 'received';
        } else if (/gave|paid to|sent to|lent|diye|bheja|to|ko/i.test(text)) {
          ledgerType = 'gave';
        }

        const isReimbursement = /settle|cleared|paid back|reimburse|hisaab|hisab|chuka/i.test(text);

        return {
          intent: SMART_INTENTS.LEDGER_PERSON,
          confidence: 0.92,
          person: person,
          ledgerType: ledgerType,
          isReimbursement: isReimbursement,
          suggestedTitle: person.name,
          explanation: (currentLang === 'hi')
            ? `👤 "${person.name}" मिला। आपका ${person.name} के साथ खाता पहले से है। क्या इसे खाते में जोड़ें?`
            : `👤 ${person.name} detected. You already have a Ledger with ${person.name}. ₹${amt} looks like a Ledger payment. Connect to Ledger?`
        };
      }
    }
  }

  // 2. Events & Spaces Intelligence
  if (typeof events !== 'undefined' && Array.isArray(events) && events.length > 0) {
    for (const ev of events) {
      if (!ev || !ev.name) continue;
      const evName = ev.name.toLowerCase().trim();
      if (evName.length < 3) continue;

      const evRegex = new RegExp('(?:^|\\s)' + evName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:$|\\s|[.,!?])', 'i');
      if (evRegex.test(text) || text.includes(evName)) {
        return {
          intent: SMART_INTENTS.EVENT_SPACE,
          confidence: 0.88,
          event: ev,
          suggestedTitle: ev.name,
          explanation: (currentLang === 'hi')
            ? `🎉 "${ev.name}" आयोजन मिला। क्या इस ₹${amt} के खर्च को "${ev.name}" से जोड़ें?`
            : `🎉 "${ev.name}" space detected. Connect this ₹${amt} transaction to "${ev.name}"?`
        };
      }
    }
  }

  // 3. Subscription & Recurring Intelligence
  const subRegex = /netflix|spotify|prime|hotstar|youtube|apple|icloud|gym|wifi|broadband|rent|newspaper|tuition|sip|insurance|electricity|recharge/i;
  if (subRegex.test(text)) {
    const matchedSub = text.match(subRegex);
    const subName = matchedSub ? matchedSub[0].toUpperCase() : 'Subscription';
    return {
      intent: SMART_INTENTS.RECURRING_SUBSCRIPTION,
      confidence: 0.85,
      subscriptionName: subName,
      explanation: (currentLang === 'hi')
        ? `💳 ${subName} आवर्ती भुगतान (Subscription) लग रहा है। क्या इसका ऑटो-लॉग नियम बनाएं?`
        : `💳 ${subName} looks like a recurring subscription. Set up an auto-log recurring rule?`
    };
  }

  return { intent: SMART_INTENTS.NORMAL_ENTRY, confidence: 0.5 };
}

// --- Smart Confirmation Modal System ---
function showSmartIntentConfirmation(intentData, payload, onProceedNormal, onProceedSmart) {
  let backdrop = document.getElementById('smart-intent-modal-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'smart-intent-modal-backdrop';
    backdrop.style.cssText = 'position:fixed;inset:0;background:rgba(10,8,26,0.78);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;';
    document.body.appendChild(backdrop);
  }

  let icon = '🧠';
  let title = 'Smart Context Suggestion';
  if (intentData.intent === SMART_INTENTS.LEDGER_PERSON) { icon = '👤'; title = 'Ledger Connection'; }
  else if (intentData.intent === SMART_INTENTS.EVENT_SPACE) { icon = '🎉'; title = 'Space Connection'; }
  else if (intentData.intent === SMART_INTENTS.RECURRING_SUBSCRIPTION) { icon = '💳'; title = 'Subscription Detected'; }

  backdrop.innerHTML = `
    <div class="card" style="width:100%;max-width:390px;background:var(--card-solid,#1f1840);border:1px solid rgba(139,92,246,0.35);box-shadow:0 20px 50px rgba(0,0,0,0.65);border-radius:24px;padding:24px 20px;position:relative;animation:popIn 0.25s ease;">
      <div style="text-align:center;margin-bottom:16px;">
        <div style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,var(--accent,#8b5cf6),var(--accent2,#ec4899));display:flex;align-items:center;justify-content:center;font-size:24px;color:#fff;margin:0 auto 12px;box-shadow:0 4px 18px rgba(139,92,246,0.45)">
          ${icon}
        </div>
        <h3 style="margin:0 0 6px;font-family:'Space Grotesk',sans-serif;font-size:18px;color:#fff">${title}</h3>
        <p style="margin:0;font-size:13.5px;color:var(--text-dim,#d1d5db);line-height:1.45">${intentData.explanation}</p>
      </div>

      <div class="btn-row" style="gap:10px;margin-top:18px;">
        <button class="btn" style="flex:1;padding:12px;font-size:13px;" id="smart-intent-btn-no">${currentLang==='hi'?'नहीं, सामान्य एंट्री':'Normal Entry'}</button>
        <button class="btn primary" style="flex:1.2;padding:12px;font-weight:700;font-size:13.5px;" id="smart-intent-btn-yes"><i class="ti ti-check"></i> ${currentLang==='hi'?'हाँ, कनेक्ट करें':'Yes, Connect'}</button>
      </div>
    </div>
  `;
  backdrop.style.display = 'flex';

  document.getElementById('smart-intent-btn-no').onclick = () => {
    backdrop.style.display = 'none';
    if (typeof onProceedNormal === 'function') onProceedNormal();
  };

  document.getElementById('smart-intent-btn-yes').onclick = () => {
    backdrop.style.display = 'none';
    if (typeof onProceedSmart === 'function') onProceedSmart();
  };
}

// --- Universal Smart Engine Guard (Integrated with Duplicate Guard) ---
async function maybeGuardAndSaveWithSmartEngine(payload, doSave, rawHint) {
  const runNormal = () => {
    if (typeof maybeGuardAndSave === 'function') {
      maybeGuardAndSave(payload, doSave);
    } else {
      Promise.resolve(doSave()).catch(e => toast('Could not save: ' + e.message, 'error'));
    }
  };

  const intentData = analyzeTransactionIntent(payload, rawHint);

  // If People / Ledger intent detected
  if (intentData.intent === SMART_INTENTS.LEDGER_PERSON && intentData.person) {
    showSmartIntentConfirmation(
      intentData,
      payload,
      runNormal,
      async () => {
        try {
          if (typeof saveLedgerTx === 'function') {
            await saveLedgerTx(
              intentData.person._id,
              intentData.ledgerType,
              payload.amt,
              payload.note || payload.label || 'Smart Ledger Entry'
            );
          } else {
            runNormal();
          }
        } catch(e) {
          console.warn('Smart ledger connection fallback:', e);
          runNormal();
        }
      }
    );
    return;
  }

  // If Event / Space intent detected
  if (intentData.intent === SMART_INTENTS.EVENT_SPACE && intentData.event) {
    showSmartIntentConfirmation(
      intentData,
      payload,
      runNormal,
      async () => {
        payload.event = intentData.event.name;
        payload.evId = intentData.event._id;
        runNormal();
        toast(`Connected to "${intentData.event.name}"!`, 'success');
      }
    );
    return;
  }

  // If Subscription intent detected
  if (intentData.intent === SMART_INTENTS.RECURRING_SUBSCRIPTION) {
    showSmartIntentConfirmation(
      intentData,
      payload,
      runNormal,
      async () => {
        runNormal();
        if (typeof openRecurringModal === 'function') {
          setTimeout(() => openRecurringModal({
            label: payload.label || intentData.subscriptionName,
            amt: payload.amt,
            cat: payload.cat || 'home',
            freq: 'monthly'
          }), 350);
        }
      }
    );
    return;
  }

  // Default: proceed with normal duplicate-guarded save
  runNormal();
}
