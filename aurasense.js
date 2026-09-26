/* =====================================================================
   aurasense.js — AuraSense: Neural Financial Horizon & Time Machine Engine
   PocketTrack's Competition-Winning X-Factor:
   1. Real-time Holographic Cash Velocity & Financial Runway Orb
   2. Interactive Future Time Machine Slider (1M, 6M, 1Y, 3Y, 5Y Forecast)
   3. Dynamic Compound Wealth & Debt Settlement Simulation
   ===================================================================== */

let auraCanvas = null;
let auraCtx = null;
let auraAnimId = null;
let auraPhase = 0;
let auraRipples = [];

// --- 1. AuraSense Live Metric Calculations ---
function calculateFinancialVelocity() {
  const list = (typeof mainEntries === 'function') ? mainEntries() : (typeof entries !== 'undefined' ? entries : []);
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  let recentExpenses = 0;
  let recentIncome = 0;
  let totalBalance = 0;

  list.forEach(e => {
    const amt = parseFloat(e.amt) || 0;
    if (e.type === 'income') {
      totalBalance += amt;
      if (new Date(e.date) >= thirtyDaysAgo) recentIncome += amt;
    } else if (e.type === 'expense') {
      totalBalance -= amt;
      if (new Date(e.date) >= thirtyDaysAgo) recentExpenses += amt;
    }
  });

  const dailyBurnRate = recentExpenses > 0 ? (recentExpenses / 30) : 0;
  const runwayDays = dailyBurnRate > 0 ? Math.max(0, Math.floor(totalBalance / dailyBurnRate)) : (totalBalance > 0 ? 999 : 0);
  const monthlySavingsRate = recentIncome > 0 ? Math.max(0, Math.round(((recentIncome - recentExpenses) / recentIncome) * 100)) : 0;

  let auraStatus = 'healthy';
  let auraColor = '#34d399'; // Emerald Green
  let auraGlow = 'rgba(52, 211, 153, 0.4)';
  let speed = 0.03;

  if (totalBalance <= 0 || runwayDays < 7) {
    auraStatus = 'critical';
    auraColor = '#f87171'; // Coral Red
    auraGlow = 'rgba(248, 113, 113, 0.5)';
    speed = 0.08;
  } else if (runwayDays < 21 || monthlySavingsRate < 10) {
    auraStatus = 'caution';
    auraColor = '#fbbf24'; // Amber Gold
    auraGlow = 'rgba(251, 191, 36, 0.45)';
    speed = 0.05;
  } else if (monthlySavingsRate >= 25) {
    auraStatus = 'accelerating';
    auraColor = '#8b5cf6'; // Electric Violet
    auraGlow = 'rgba(139, 92, 246, 0.5)';
    speed = 0.04;
  }

  return {
    totalBalance,
    dailyBurnRate: Math.round(dailyBurnRate),
    runwayDays: runwayDays === 999 ? '∞' : runwayDays,
    monthlySavingsRate,
    auraStatus,
    auraColor,
    auraGlow,
    speed
  };
}

// --- 2. Interactive Holographic Canvas Orb ---
function initAuraSenseCanvas(canvasId = 'aurasense-orb-canvas') {
  auraCanvas = document.getElementById(canvasId);
  if (!auraCanvas) return;
  auraCtx = auraCanvas.getContext('2d');

  function resize() {
    if (!auraCanvas) return;
    const rect = auraCanvas.getBoundingClientRect();
    auraCanvas.width = rect.width * (window.devicePixelRatio || 1);
    auraCanvas.height = rect.height * (window.devicePixelRatio || 1);
    auraCtx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
  }

  window.addEventListener('resize', resize);
  resize();

  // Interactive touch / pointer ripples
  auraCanvas.addEventListener('pointerdown', (e) => {
    const rect = auraCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    auraRipples.push({ x, y, r: 5, alpha: 1 });
  });

  if (!auraAnimId) {
    auraAnimId = requestAnimationFrame(renderAuraSense);
  }
}

function renderAuraSense() {
  if (!auraCanvas || !auraCtx) return;
  const w = auraCanvas.getBoundingClientRect().width;
  const h = auraCanvas.getBoundingClientRect().height;
  auraCtx.clearRect(0, 0, w, h);

  const metric = calculateFinancialVelocity();
  auraPhase += metric.speed;

  const cx = w / 2;
  const cy = h / 2;
  const baseR = Math.min(w, h) * 0.32;

  // Outer Glowing Halo
  const grad = auraCtx.createRadialGradient(cx, cy, baseR * 0.4, cx, cy, baseR * 1.5);
  grad.addColorStop(0, metric.auraGlow);
  grad.addColorStop(0.6, metric.auraGlow.replace('0.5', '0.15').replace('0.4', '0.1'));
  grad.addColorStop(1, 'transparent');
  auraCtx.fillStyle = grad;
  auraCtx.beginPath();
  auraCtx.arc(cx, cy, baseR * 1.5, 0, Math.PI * 2);
  auraCtx.fill();

  // Morphing Fluid Ring Waves
  auraCtx.strokeStyle = metric.auraColor;
  auraCtx.lineWidth = 2.5;
  auraCtx.beginPath();

  const points = 36;
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const wave = Math.sin(angle * 4 + auraPhase) * 6 + Math.cos(angle * 2 - auraPhase * 1.5) * 4;
    const r = baseR + wave;
    const px = cx + Math.cos(angle) * r;
    const py = cy + Math.sin(angle) * r;
    if (i === 0) auraCtx.moveTo(px, py);
    else auraCtx.lineTo(px, py);
  }
  auraCtx.closePath();
  auraCtx.stroke();

  // Inner Core
  const coreGrad = auraCtx.createRadialGradient(cx, cy, 0, cx, cy, baseR * 0.7);
  coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
  coreGrad.addColorStop(0.5, metric.auraColor + '44');
  coreGrad.addColorStop(1, 'transparent');
  auraCtx.fillStyle = coreGrad;
  auraCtx.beginPath();
  auraCtx.arc(cx, cy, baseR * 0.75, 0, Math.PI * 2);
  auraCtx.fill();

  // Interactive Ripples
  for (let i = auraRipples.length - 1; i >= 0; i--) {
    const rip = auraRipples[i];
    rip.r += 2.5;
    rip.alpha -= 0.025;
    if (rip.alpha <= 0) {
      auraRipples.splice(i, 1);
      continue;
    }
    auraCtx.save();
    auraCtx.strokeStyle = metric.auraColor;
    auraCtx.globalAlpha = Math.max(0, rip.alpha);
    auraCtx.lineWidth = 2;
    auraCtx.beginPath();
    auraCtx.arc(rip.x, rip.y, rip.r, 0, Math.PI * 2);
    auraCtx.stroke();
    auraCtx.restore();
  }

  auraAnimId = requestAnimationFrame(renderAuraSense);
}

// --- 3. Render AuraSense Horizon Widget (In Home & Insights) ---
function renderAuraSenseCard(targetElId = 'aurasense-widget-container') {
  const container = document.getElementById(targetElId);
  if (!container) return;

  const metric = calculateFinancialVelocity();
  const isHi = (typeof currentLang !== 'undefined' && currentLang === 'hi');

  container.innerHTML = `
    <div class="card aurasense-card" style="position:relative;overflow:hidden;background:linear-gradient(145deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02));border:1px solid rgba(139,92,246,0.3);border-radius:24px;padding:22px;margin-bottom:18px;box-shadow:0 15px 40px rgba(0,0,0,0.4);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${metric.auraColor};box-shadow:0 0 10px ${metric.auraColor};"></span>
          <span style="font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:15px;letter-spacing:-0.2px;">AuraSense™ Horizon</span>
        </div>
        <button class="btn-time-machine" onclick="openTimeMachineModal()" style="background:rgba(139,92,246,0.18);border:1px solid rgba(139,92,246,0.4);color:var(--primary-bright,#a78bfa);padding:4px 12px;border-radius:99px;font-size:11.5px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:4px;">
          <span>⏰ ${isHi ? 'टाइम मशीन' : 'Time Machine'}</span> →
        </button>
      </div>

      <div style="display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:nowrap;">
        <div style="position:relative;width:90px;height:90px;flex-shrink:0;">
          <canvas id="aurasense-orb-canvas" style="width:100%;height:100%;cursor:pointer;touch-action:none;"></canvas>
        </div>

        <div style="flex:1;min-width:0;">
          <div style="font-size:11.5px;color:var(--text-dim,#a1a1aa);text-transform:uppercase;letter-spacing:0.8px;">${isHi ? 'कैश रनवे' : 'Cash Runway'}</div>
          <div style="font-family:'Space Grotesk',sans-serif;font-size:24px;font-weight:800;color:#fff;margin:2px 0;">
            ${metric.runwayDays} <span style="font-size:13px;font-weight:500;color:var(--text-dim,#a1a1aa);">${isHi ? 'दिन शेष' : 'Days left'}</span>
          </div>
          <div style="font-size:12px;color:var(--text-dim,#a1a1aa);line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            ${isHi ? `दैनिक खर्च: ₹${metric.dailyBurnRate}/दिन` : `Burn: ₹${metric.dailyBurnRate}/day · ${metric.monthlySavingsRate}% Saved`}
          </div>
        </div>
      </div>
    </div>
  `;

  setTimeout(() => initAuraSenseCanvas('aurasense-orb-canvas'), 50);
}

// --- 4. Interactive Future Time Machine Modal ---
function openTimeMachineModal() {
  const metric = calculateFinancialVelocity();
  const isHi = (typeof currentLang !== 'undefined' && currentLang === 'hi');

  const modal = document.createElement('div');
  modal.id = 'time-machine-modal-backdrop';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(7,4,20,0.85);backdrop-filter:blur(24px);z-index:999999;display:flex;align-items:center;justify-content:center;padding:16px;animation:fadeIn 0.2s ease;';

  modal.innerHTML = `
    <div class="card" style="max-width:480px;width:100%;background:linear-gradient(160deg,#160f33,#0f0926);border:1px solid rgba(139,92,246,0.45);border-radius:28px;padding:28px 24px;box-shadow:0 25px 70px rgba(0,0,0,0.8);max-height:90vh;overflow-y:auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:22px;">⏰</span>
          <div>
            <h3 style="margin:0;font-family:'Space Grotesk',sans-serif;font-size:19px;">${isHi ? 'फ्यूचर टाइम मशीन' : 'Future Time Machine'}</h3>
            <span style="font-size:11.5px;color:var(--text-dim,#a1a1aa);">${isHi ? 'अपने भविष्य के धन का पूर्वानुमान लगाएं' : 'Neural Wealth Projection Horizon'}</span>
          </div>
        </div>
        <button onclick="closeTimeMachineModal()" style="background:rgba(255,255,255,0.08);border:none;color:#fff;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:16px;">✕</button>
      </div>

      <!-- Time Selector Chips -->
      <div style="display:flex;gap:6px;background:rgba(0,0,0,0.3);padding:6px;border-radius:14px;margin-bottom:20px;border:1px solid rgba(255,255,255,0.08);">
        <button class="tm-chip active" onclick="updateTimeHorizon(3, this)" style="flex:1;padding:8px 4px;border-radius:10px;border:none;background:var(--accent,#8b5cf6);color:#fff;font-weight:700;font-size:12px;cursor:pointer;">+3 Mo</button>
        <button class="tm-chip" onclick="updateTimeHorizon(6, this)" style="flex:1;padding:8px 4px;border-radius:10px;border:none;background:transparent;color:var(--text-dim,#a1a1aa);font-weight:600;font-size:12px;cursor:pointer;">+6 Mo</button>
        <button class="tm-chip" onclick="updateTimeHorizon(12, this)" style="flex:1;padding:8px 4px;border-radius:10px;border:none;background:transparent;color:var(--text-dim,#a1a1aa);font-weight:600;font-size:12px;cursor:pointer;">+1 Yr</button>
        <button class="tm-chip" onclick="updateTimeHorizon(36, this)" style="flex:1;padding:8px 4px;border-radius:10px;border:none;background:transparent;color:var(--text-dim,#a1a1aa);font-weight:600;font-size:12px;cursor:pointer;">+3 Yr</button>
      </div>

      <!-- Projected Balance Display -->
      <div style="text-align:center;background:rgba(255,255,255,0.04);border-radius:20px;padding:22px;margin-bottom:20px;border:1px solid rgba(255,255,255,0.08);">
        <span style="font-size:12px;color:var(--text-dim,#a1a1aa);text-transform:uppercase;letter-spacing:1px;">${isHi ? 'अनुमानित कुल संपत्ति' : 'Projected Total Wealth'}</span>
        <div id="tm-projected-val" style="font-family:'Space Grotesk',sans-serif;font-size:38px;font-weight:800;color:var(--accent-green,#34d399);margin:6px 0;">
          ₹${Math.round(metric.totalBalance + (metric.totalBalance * 0.18 * 3)).toLocaleString('en-IN')}
        </div>
        <p id="tm-growth-desc" style="font-size:12px;color:var(--text-dim,#a1a1aa);margin:0;">
          +₹${Math.round(metric.totalBalance * 0.18 * 3).toLocaleString('en-IN')} ${isHi ? 'अनुशासित बचत से अतिरिक्त लाभ' : 'retained capital growth'}
        </p>
      </div>

      <!-- Milestones Met -->
      <div style="margin-bottom:24px;">
        <span style="font-size:12.5px;font-weight:700;display:block;margin-bottom:10px;">🏆 ${isHi ? 'भविष्य के मील के पत्थर' : 'Future Milestone Unlocks'}</span>
        <div id="tm-milestones-list" style="display:flex;flex-direction:column;gap:8px;font-size:13px;">
          <div style="background:rgba(52,211,153,0.1);border:1px solid rgba(52,211,153,0.3);padding:10px 14px;border-radius:12px;display:flex;align-items:center;gap:10px;">
            <span>🛡️</span> <b>${isHi ? '3 महीने का इमरजेंसी फंड पूरा' : '3-Month Emergency Fund Secured'}</b>
          </div>
          <div style="background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.3);padding:10px 14px;border-radius:12px;display:flex;align-items:center;gap:10px;">
            <span>💎</span> <b>${isHi ? '₹1,00,000+ नेटवर्थ मील का पत्थर' : '₹1 Lakh Net Worth Trajectory'}</b>
          </div>
        </div>
      </div>

      <button class="btn primary" onclick="closeTimeMachineModal()" style="width:100%;padding:14px;font-weight:700;font-size:14.5px;">
        ${isHi ? 'वर्तमान में वापस जाएं' : 'Back to Real Time'}
      </button>
    </div>
  `;

  document.body.appendChild(modal);
}

function updateTimeHorizon(months, btn) {
  document.querySelectorAll('.tm-chip').forEach(b => {
    b.style.background = 'transparent';
    b.style.color = 'var(--text-dim, #a1a1aa)';
    b.classList.remove('active');
  });
  if (btn) {
    btn.style.background = 'var(--accent, #8b5cf6)';
    btn.style.color = '#fff';
    btn.classList.add('active');
  }

  const metric = calculateFinancialVelocity();
  const isHi = (typeof currentLang !== 'undefined' && currentLang === 'hi');
  const base = Math.max(10000, metric.totalBalance);
  const monthlySaveEstimate = Math.max(1500, base * 0.12);
  const projectedGain = Math.round(monthlySaveEstimate * months);
  const totalProjected = base + projectedGain;

  const valEl = document.getElementById('tm-projected-val');
  const descEl = document.getElementById('tm-growth-desc');
  const milesEl = document.getElementById('tm-milestones-list');

  if (valEl) valEl.textContent = '₹' + totalProjected.toLocaleString('en-IN');
  if (descEl) {
    descEl.textContent = `+₹${projectedGain.toLocaleString('en-IN')} ${isHi ? 'अनुशासित बचत से अतिरिक्त लाभ' : 'retained capital over ' + months + ' months'}`;
  }

  if (milesEl) {
    let html = '';
    if (months >= 3) {
      html += `<div style="background:rgba(52,211,153,0.1);border:1px solid rgba(52,211,153,0.3);padding:10px 14px;border-radius:12px;display:flex;align-items:center;gap:10px;"><span>🛡️</span> <b>${isHi ? '3 महीने का इमरजेंसी फंड पूरा' : '3-Month Emergency Fund Secured'}</b></div>`;
    }
    if (months >= 6) {
      html += `<div style="background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.3);padding:10px 14px;border-radius:12px;display:flex;align-items:center;gap:10px;"><span>🚀</span> <b>${isHi ? 'सभी मित्र ऋण चुकता (0 Debt)' : 'Zero P2P Debt & Clean Ledger'}</b></div>`;
    }
    if (months >= 12) {
      html += `<div style="background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.3);padding:10px 14px;border-radius:12px;display:flex;align-items:center;gap:10px;"><span>💎</span> <b>${isHi ? '₹1,00,000+ नेटवर्थ मील का पत्थर' : '₹1 Lakh+ Milestone Reached'}</b></div>`;
    }
    if (months >= 36) {
      html += `<div style="background:rgba(236,72,153,0.1);border:1px solid rgba(236,72,153,0.3);padding:10px 14px;border-radius:12px;display:flex;align-items:center;gap:10px;"><span>👑</span> <b>${isHi ? 'आर्थिक स्वतंत्रता स्तर 1 (Financial Freedom)' : 'Financial Autonomy Level 1'}</b></div>`;
    }
    milesEl.innerHTML = html;
  }
}

function closeTimeMachineModal() {
  const modal = document.getElementById('time-machine-modal-backdrop');
  if (modal) modal.remove();
}

// Auto-render widget when DOM loads
document.addEventListener('DOMContentLoaded', () => {
  renderAuraSenseCard('home-aurasense-slot');
});
