'use strict';

/**
 * PocketTrack "Safe-to-Spend Today" Daily Burn Meter
 * Calculates exact daily spending allowance based on remaining days in the month
 * and remaining budget/income, giving users instant clarity on their daily burn rate.
 */

(function() {
  const s = document.createElement('style');
  s.textContent = `
    .burn-meter-card {
      background: linear-gradient(145deg, rgba(26, 22, 51, 0.8), rgba(15, 12, 34, 0.9));
      border: 1px solid rgba(139, 92, 246, 0.3);
      border-radius: 22px;
      padding: 18px 20px;
      margin: 16px 0;
      color: #fff;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      position: relative;
      overflow: hidden;
    }
    .burn-meter-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
    }
    .burn-meter-title {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: var(--accent-bright, #c4b5fd);
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .burn-days-chip {
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.08);
      color: var(--text-dim, #94a3b8);
      font-weight: 600;
    }
    .burn-meter-body {
      display: flex;
      align-items: center;
      gap: 18px;
    }
    .burn-gauge-wrap {
      position: relative;
      width: 76px;
      height: 76px;
      flex-shrink: 0;
    }
    .burn-gauge-svg {
      transform: rotate(-90deg);
      width: 100%;
      height: 100%;
    }
    .burn-gauge-bg {
      fill: none;
      stroke: rgba(255, 255, 255, 0.08);
      stroke-width: 7;
    }
    .burn-gauge-fill {
      fill: none;
      stroke-width: 7;
      stroke-linecap: round;
      transition: stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.3s;
    }
    .burn-gauge-icon {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }
    .burn-stats {
      flex: 1;
      min-width: 0;
    }
    .burn-allowance-val {
      font-size: 24px;
      font-weight: 800;
      font-family: 'Space Grotesk', sans-serif;
      line-height: 1.1;
      margin: 2px 0 4px;
    }
    .burn-sub-msg {
      font-size: 12px;
      color: var(--text-dim, #94a3b8);
      line-height: 1.4;
    }
  `;
  if (typeof document !== 'undefined') (document.head || document.documentElement || document.body)?.appendChild(s);
})();

function computeSafeToSpend() {
  const entries = (typeof mainEntries === 'function') ? mainEntries() : [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-11
  
  // Days in current month
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
  const currentDay = now.getDate();
  const remainingDays = Math.max(1, totalDays - currentDay + 1); // including today

  let monthIncome = 0;
  let monthSpent = 0;
  let todaySpent = 0;
  const todayStrVal = (typeof todayStr === 'function') ? todayStr() : new Date().toISOString().split('T')[0];

  entries.forEach(e => {
    if (!e.date) return;
    const parts = e.date.split('-');
    if (parts.length !== 3) return;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const amt = parseFloat(e.amt) || 0;

    if (y === currentYear && m === currentMonth) {
      if (e.type === 'income') monthIncome += amt;
      else if (e.type === 'expense') {
        monthSpent += amt;
        if (e.date === todayStrVal) todaySpent += amt;
      }
    }
  });

  // Effective budget pool
  let budgetPool = monthIncome;
  if (typeof weeklyBudget !== 'undefined' && weeklyBudget > 0) {
    budgetPool = Math.max(budgetPool, weeklyBudget * 4.2);
  }
  if (budgetPool <= 0) budgetPool = 25000; // Sensible default student/young-pro benchmark

  const remainingMonthPool = Math.max(0, budgetPool - monthSpent + todaySpent);
  const dailyAllowance = Math.max(100, Math.round(remainingMonthPool / remainingDays));
  const todayRemaining = dailyAllowance - todaySpent;
  const burnPercent = Math.min(100, Math.round((todaySpent / dailyAllowance) * 100));

  return {
    remainingDays,
    dailyAllowance,
    todaySpent,
    todayRemaining,
    burnPercent,
    isSafe: todayRemaining >= 0
  };
}

window.renderDailyBurnMeter = function() {
  const slot = document.getElementById('home-daily-burn-slot');
  if (!slot) return;

  const data = computeSafeToSpend();
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, data.burnPercent) / 100) * circumference;

  let gaugeColor = '#34d399'; // Green
  let statusEmoji = '🟢';
  let statusMsg = `₹${Math.max(0, data.todayRemaining).toLocaleString('en-IN')} left for today`;
  
  if (data.burnPercent > 100) {
    gaugeColor = '#f87171'; // Red
    statusEmoji = '🔴';
    statusMsg = `Over by ₹${Math.abs(data.todayRemaining).toLocaleString('en-IN')} today`;
  } else if (data.burnPercent > 70) {
    gaugeColor = '#fbbf24'; // Amber
    statusEmoji = '🟡';
  }

  slot.innerHTML = `
    <div class="burn-meter-card">
      <div class="burn-meter-header">
        <div class="burn-meter-title">
          <span>🎯 Safe-to-Spend Radar</span>
        </div>
        <div class="burn-days-chip">${data.remainingDays} days left in month</div>
      </div>
      <div class="burn-meter-body">
        <div class="burn-gauge-wrap">
          <svg class="burn-gauge-svg" viewBox="0 0 76 76">
            <circle class="burn-gauge-bg" cx="38" cy="38" r="${radius}"></circle>
            <circle class="burn-gauge-fill" cx="38" cy="38" r="${radius}"
              style="stroke: ${gaugeColor}; stroke-dasharray: ${circumference}; stroke-dashoffset: ${offset};">
            </circle>
          </svg>
          <div class="burn-gauge-icon">${data.isSafe ? '⚡' : '⚠️'}</div>
        </div>
        <div class="burn-stats">
          <div style="font-size:11px;color:var(--text-dim,#94a3b8);text-transform:uppercase;">Daily Allowance</div>
          <div class="burn-allowance-val" style="color:${gaugeColor};">₹${data.dailyAllowance.toLocaleString('en-IN')}<span style="font-size:12px;font-weight:500;color:var(--text-dim);">/day</span></div>
          <div class="burn-sub-msg">${statusEmoji} <b>${statusMsg}</b> · Spent ₹${data.todaySpent.toLocaleString('en-IN')}</div>
        </div>
      </div>
    </div>
  `;
};

// Initial Auto-render
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(window.renderDailyBurnMeter, 600));
} else {
  setTimeout(window.renderDailyBurnMeter, 600);
}
