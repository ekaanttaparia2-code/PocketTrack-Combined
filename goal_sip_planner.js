'use strict';

/**
 * PocketTrack Goal & SIP Wealth Compounding Simulator
 * Helps youth and students visualize how disciplined monthly micro-investments
 * achieve real life goals (Laptop, Vacation, Emergency Fund, First ₹1 Lakh).
 */

(function() {
  const s = document.createElement('style');
  s.textContent = `
    .goal-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.78);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      z-index: 100000 !important;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.25s ease, visibility 0.25s;
    }
    .goal-modal-backdrop.active {
      opacity: 1;
      visibility: visible;
    }
    .goal-modal-panel {
      background: linear-gradient(160deg, #181432, #0d0a21);
      border: 1px solid rgba(139, 92, 246, 0.4);
      border-radius: 28px;
      padding: 24px 20px;
      box-shadow: 0 25px 70px rgba(0, 0, 0, 0.6);
      width: 100%;
      max-width: 440px;
      max-height: 90vh;
      overflow-y: auto;
      transform: scale(0.92);
      transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
      color: #fff;
      box-sizing: border-box;
    }
    .goal-modal-backdrop.active .goal-modal-panel {
      transform: scale(1);
    }
    
    .goal-planner-card {
      background: linear-gradient(145deg, rgba(20, 25, 45, 0.9), rgba(15, 12, 34, 0.95));
      border: 1px solid rgba(52, 211, 153, 0.35);
      border-radius: 22px;
      padding: 18px 16px;
      margin: 0;
      color: #fff;
      box-shadow: 0 10px 30px rgba(52, 211, 153, 0.1);
      position: relative;
    }
    .goal-stat-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin: 14px 0;
    }
    .goal-stat-box {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 12px;
      text-align: center;
    }
    .goal-slider-group {
      margin-bottom: 14px;
    }
    .goal-slider-label {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      color: #cbd5e1;
      margin-bottom: 6px;
      font-weight: 600;
    }
  `;
  if (typeof document !== 'undefined') (document.head || document.documentElement || document.body)?.appendChild(s);
})();

function getGoalStorageKey() {
  const uid = (typeof currentUser !== 'undefined' && currentUser) ? currentUser.uid : 'guest';
  return 'pockettrack_goal_sip_' + uid;
}

function getSavedGoal() {
  try {
    const raw = localStorage.getItem(getGoalStorageKey());
    return raw ? JSON.parse(raw) : { name: 'Emergency Fund', target: 50000, monthly: 2000, rate: 12 };
  } catch (e) {
    return { name: 'Emergency Fund', target: 50000, monthly: 2000, rate: 12 };
  }
}

function saveActiveGoal(goal) {
  try {
    localStorage.setItem(getGoalStorageKey(), JSON.stringify(goal));
  } catch (e) {}
}

function getOrCreateGoalModal() {
  let el = document.getElementById('goal-planner-modal-backdrop');
  if (!el) {
    el = document.createElement('div');
    el.id = 'goal-planner-modal-backdrop';
    el.className = 'goal-modal-backdrop';
    el.onclick = function(e) {
      if (e.target === el) window.closeGoalPlannerModal();
    };
    document.body.appendChild(el);
  }
  return el;
}

window.closeGoalPlannerModal = function() {
  const el = document.getElementById('goal-planner-modal-backdrop');
  if (el) el.classList.remove('active');
};

window.openGoalPlannerModal = function() {
  const goal = getSavedGoal();
  const modal = getOrCreateGoalModal();

  modal.innerHTML = `
    <div class="goal-modal-panel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <div>
          <div style="font-size:11px;font-weight:800;color:var(--green,#34d399);text-transform:uppercase;">Wealth Compounding</div>
          <h3 style="margin:2px 0 0;font-size:19px;color:#fff;font-family:'Space Grotesk',sans-serif;font-weight:800;">🎯 Financial Goal & SIP</h3>
        </div>
        <button onclick="closeGoalPlannerModal()" style="background:rgba(255,255,255,0.08);border:none;color:#fff;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:16px;">✕</button>
      </div>

      <div class="goal-slider-group">
        <div class="goal-slider-label">
          <span>Goal Name</span>
        </div>
        <input type="text" id="goal-input-name" value="${escapeHTML(goal.name)}" placeholder="e.g. New MacBook, Goa Trip, Emergency Fund" style="width:100%;padding:12px 14px;border-radius:14px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);color:#fff;font-size:14.5px;box-sizing:border-box;outline:none;">
      </div>

      <div class="goal-slider-group">
        <div class="goal-slider-label">
          <span>Target Goal Amount</span>
          <strong id="goal-target-display" style="color:var(--green,#34d399);font-size:15px;">₹${goal.target.toLocaleString('en-IN')}</strong>
        </div>
        <input type="range" id="goal-target-slider" min="10000" max="500000" step="5000" value="${goal.target}" style="width:100%;" oninput="updateGoalCalculation()"/>
      </div>

      <div class="goal-slider-group">
        <div class="goal-slider-label">
          <span>Monthly Contribution</span>
          <strong id="goal-monthly-display" style="color:#60a5fa;font-size:15px;">₹${goal.monthly.toLocaleString('en-IN')}/mo</strong>
        </div>
        <input type="range" id="goal-monthly-slider" min="500" max="25000" step="500" value="${goal.monthly}" style="width:100%;" oninput="updateGoalCalculation()"/>
      </div>

      <div class="goal-stat-row">
        <div class="goal-stat-box">
          <div style="font-size:11.5px;color:var(--text-dim,#94a3b8);">Time to Goal</div>
          <div id="goal-months-val" style="font-size:17px;font-weight:800;color:#fff;margin-top:2px;">--</div>
        </div>
        <div class="goal-stat-box">
          <div style="font-size:11.5px;color:var(--text-dim,#94a3b8);">Wealth Growth (12% CAGR)</div>
          <div id="goal-growth-val" style="font-size:17px;font-weight:800;color:var(--green,#34d399);margin-top:2px;">+₹0</div>
        </div>
      </div>

      <div style="display:flex;gap:10px;margin-top:16px;">
        <button class="btn" onclick="closeGoalPlannerModal()" style="flex:1;border-radius:14px;padding:12px;font-size:13px;">Close</button>
        <button class="btn primary" onclick="submitSaveGoal()" style="flex:1.4;border-radius:14px;padding:12px;font-size:13px;font-weight:700;background:linear-gradient(135deg,#10b981,#06b6d4);">Save to Home →</button>
      </div>
    </div>
  `;

  requestAnimationFrame(() => {
    modal.classList.add('active');
    updateGoalCalculation();
  });
};

window.updateGoalCalculation = function() {
  const target = parseFloat(document.getElementById('goal-target-slider')?.value) || 50000;
  const monthly = parseFloat(document.getElementById('goal-monthly-slider')?.value) || 2000;
  const r = (12 / 12) / 100; // 12% annual rate = 1% monthly

  const targetEl = document.getElementById('goal-target-display');
  const monthlyEl = document.getElementById('goal-monthly-display');
  if (targetEl) targetEl.textContent = `₹${target.toLocaleString('en-IN')}`;
  if (monthlyEl) monthlyEl.textContent = `₹${monthly.toLocaleString('en-IN')}/mo`;

  const numerator = Math.log(1 + (target * r) / (monthly * (1 + r)));
  const denominator = Math.log(1 + r);
  const months = Math.ceil(numerator / denominator);
  const totalInvested = monthly * months;
  const wealthGained = Math.max(0, target - totalInvested);

  const monthsEl = document.getElementById('goal-months-val');
  const growthEl = document.getElementById('goal-growth-val');

  if (monthsEl) {
    const yrs = Math.floor(months / 12);
    const remM = months % 12;
    monthsEl.textContent = yrs > 0 ? `${yrs}y ${remM}m (${months}m)` : `${months} months`;
  }
  if (growthEl) {
    growthEl.textContent = `+₹${Math.round(wealthGained).toLocaleString('en-IN')}`;
  }
};

window.submitSaveGoal = function() {
  const name = document.getElementById('goal-input-name')?.value.trim() || 'Savings Goal';
  const target = parseFloat(document.getElementById('goal-target-slider')?.value) || 50000;
  const monthly = parseFloat(document.getElementById('goal-monthly-slider')?.value) || 2000;

  saveActiveGoal({ name, target, monthly, rate: 12 });
  window.closeGoalPlannerModal();
  renderActiveGoalCard();
  if (typeof toast === 'function') toast(`Saved "${name}" goal to Home!`, 'success');
};

window.renderActiveGoalCard = function() {
  const slot = document.getElementById('home-goal-slot');
  if (!slot) return;

  const goal = getSavedGoal();
  const entries = (typeof mainEntries === 'function') ? mainEntries() : [];
  
  let totalInc = 0, totalExp = 0;
  entries.forEach(e => {
    if (e.type === 'income') totalInc += (parseFloat(e.amt) || 0);
    else if (e.type === 'expense') totalExp += (parseFloat(e.amt) || 0);
  });
  const currentSaved = Math.max(0, totalInc - totalExp);
  const progressPct = Math.min(100, Math.round((currentSaved / goal.target) * 100));

  slot.innerHTML = `
    <div class="goal-planner-card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <div style="display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:700;color:var(--green,#34d399);text-transform:uppercase;">
          <span>🎯 ${escapeHTML(goal.name)}</span>
        </div>
        <button onclick="openGoalPlannerModal()" style="background:transparent;border:none;color:#94a3b8;font-size:12px;cursor:pointer;font-weight:600;">Edit ⚙️</button>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px;">
        <div style="font-size:22px;font-weight:800;font-family:'Space Grotesk',sans-serif;color:#fff;">₹${currentSaved.toLocaleString('en-IN')}<span style="font-size:13px;color:var(--text-dim);font-weight:500;"> / ₹${goal.target.toLocaleString('en-IN')}</span></div>
        <div style="font-size:13px;font-weight:700;color:var(--green,#34d399);">${progressPct}%</div>
      </div>

      <div style="width:100%;height:8px;border-radius:4px;background:rgba(255,255,255,0.08);overflow:hidden;margin-bottom:8px;">
        <div style="width:${progressPct}%;height:100%;background:linear-gradient(90deg,#10b981,#06b6d4);border-radius:4px;transition:width 0.8s;"></div>
      </div>

      <div style="font-size:11.5px;color:var(--text-dim);display:flex;justify-content:space-between;">
        <span>Saving ₹${goal.monthly.toLocaleString('en-IN')}/mo</span>
        <span>Goal Progress</span>
      </div>
    </div>
  `;
};

// Initial Auto-render
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(window.renderActiveGoalCard, 750));
} else {
  setTimeout(window.renderActiveGoalCard, 750);
}
