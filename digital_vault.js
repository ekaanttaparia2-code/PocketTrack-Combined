'use strict';

/**
 * PocketTrack "Digital Chillar" Round-Up Vault Simulator
 * Automatically calculates spare change round-ups on every expense
 * to demonstrate how painless micro-savings accumulate into substantial wealth.
 */

(function() {
  const s = document.createElement('style');
  s.textContent = `
    .vault-card {
      background: linear-gradient(135deg, rgba(30, 24, 54, 0.85), rgba(48, 28, 70, 0.75));
      border: 1px solid rgba(251, 191, 36, 0.35);
      border-radius: 22px;
      padding: 18px 16px;
      margin: 0;
      color: #fff;
      box-shadow: 0 10px 30px rgba(251, 191, 36, 0.1);
      position: relative;
      overflow: hidden;
    }
    .vault-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .vault-title {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: #fbbf24;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .vault-body {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .vault-piggy-wrap {
      width: 58px;
      height: 58px;
      border-radius: 18px;
      background: rgba(251, 191, 36, 0.15);
      border: 1px solid rgba(251, 191, 36, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      flex-shrink: 0;
      cursor: pointer;
      transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .vault-piggy-wrap:active { transform: scale(0.85) rotate(-10deg); }
    .vault-amt {
      font-size: 24px;
      font-weight: 800;
      font-family: 'Space Grotesk', sans-serif;
      color: #fbbf24;
      line-height: 1.1;
      margin: 2px 0 4px;
    }
    .vault-sub {
      font-size: 12px;
      color: var(--text-dim, #94a3b8);
      line-height: 1.4;
    }
  `;
  if (typeof document !== 'undefined') (document.head || document.documentElement || document.body)?.appendChild(s);
})();

function computeRoundUpVault() {
  const entries = (typeof mainEntries === 'function') ? mainEntries() : [];
  let totalSaved = 0;
  let monthSaved = 0;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  entries.forEach(e => {
    if (e.type !== 'expense') return;
    const amt = parseFloat(e.amt) || 0;
    if (amt <= 0) return;

    // Round up to nearest ₹10 (or ₹50 if amount > ₹200)
    const roundBase = amt > 200 ? 50 : 10;
    const remainder = amt % roundBase;
    const roundUp = remainder > 0 ? (roundBase - remainder) : 0;

    totalSaved += roundUp;

    if (e.date) {
      const parts = e.date.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        if (y === currentYear && m === currentMonth) {
          monthSaved += roundUp;
        }
      }
    }
  });

  return {
    totalSaved: Math.round(totalSaved),
    monthSaved: Math.round(monthSaved)
  };
}

window.renderDigitalVault = function() {
  const slot = document.getElementById('home-vault-slot');
  if (!slot) return;

  const data = computeRoundUpVault();
  const displayAmt = data.monthSaved > 0 ? data.monthSaved : 450; // default preview if low data

  slot.innerHTML = `
    <div class="vault-card">
      <div class="vault-head">
        <div class="vault-title">
          <span>🪙 Digital Chillar Vault</span>
        </div>
        <span style="font-size:11px;color:#fbbf24;font-weight:600;">Passive Round-Ups</span>
      </div>
      <div class="vault-body">
        <div class="vault-piggy-wrap" onclick="shakeVaultPiggy()" title="Tap to shake piggy bank!">
          🪙
        </div>
        <div>
          <div style="font-size:11px;color:var(--text-dim,#94a3b8);text-transform:uppercase;">Round-Up Savings This Month</div>
          <div class="vault-amt">₹${displayAmt.toLocaleString('en-IN')}</div>
          <div class="vault-sub">Saved silently from rounding up daily micro-expenses!</div>
        </div>
      </div>
    </div>
  `;
};

window.shakeVaultPiggy = function() {
  if (typeof toast === 'function') {
    toast('🪙 Clink! Digital spare change saved in your Vault!', 'success');
  }
};

// Initial Auto-render
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(window.renderDigitalVault, 700));
} else {
  setTimeout(window.renderDigitalVault, 700);
}
