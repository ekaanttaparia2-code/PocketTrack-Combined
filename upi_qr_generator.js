'use strict';

/**
 * PocketTrack 1-Tap UPI QR Code & Instant Settlement Generator
 * Renders universal scannable UPI QR codes compatible with GPay, PhonePe, Paytm, CRED, BHIM.
 */

(function() {
  const s = document.createElement('style');
  s.textContent = `
    .upi-qr-backdrop {
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
    .upi-qr-backdrop.active {
      opacity: 1;
      visibility: visible;
    }
    .upi-qr-panel {
      background: #ffffff;
      color: #0f172a;
      border-radius: 28px;
      padding: 24px 20px;
      text-align: center;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);
      width: 100%;
      max-width: 340px;
      transform: scale(0.92);
      transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
    }
    .upi-qr-backdrop.active .upi-qr-panel {
      transform: scale(1);
    }
    .upi-qr-img-wrap {
      width: 210px;
      height: 210px;
      margin: 14px auto;
      border-radius: 18px;
      padding: 10px;
      background: #f8fafc;
      border: 1.5px dashed #cbd5e1;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .upi-qr-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      border-radius: 12px;
    }
    .upi-apps-row {
      display: flex;
      justify-content: center;
      gap: 10px;
      margin-top: 12px;
      font-size: 11px;
      color: #64748b;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  `;
  if (typeof document !== 'undefined') (document.head || document.documentElement || document.body)?.appendChild(s);
})();

window.getUserUpiId = function() {
  return localStorage.getItem('pockettrack_user_upi_id') || '';
};

window.setUserUpiId = function(upiId) {
  if (upiId) {
    localStorage.setItem('pockettrack_user_upi_id', upiId.trim());
  }
};

function getOrCreateUpiModal() {
  let el = document.getElementById('upi-qr-modal-backdrop');
  if (!el) {
    el = document.createElement('div');
    el.id = 'upi-qr-modal-backdrop';
    el.className = 'upi-qr-backdrop';
    el.onclick = function(e) {
      if (e.target === el) window.closeUpiQrModal();
    };
    document.body.appendChild(el);
  }
  return el;
}

window.closeUpiQrModal = function() {
  const el = document.getElementById('upi-qr-modal-backdrop');
  if (el) el.classList.remove('active');
};

window.openUpiQrModal = function(amount = 0, note = 'PocketTrack') {
  const currentUpi = window.getUserUpiId();

  if (!currentUpi) {
    window.openUpiSetupModal(amount, note);
    return;
  }

  const amtStr = amount > 0 ? `&am=${amount}` : '';
  const upiPayload = `upi://pay?pa=${encodeURIComponent(currentUpi)}&pn=PocketTrack${amtStr}&tn=${encodeURIComponent(note)}&cu=INR`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiPayload)}&margin=10`;

  const modal = getOrCreateUpiModal();
  modal.innerHTML = `
    <div class="upi-qr-panel">
      <button onclick="closeUpiQrModal()" style="position:absolute;top:16px;right:16px;background:rgba(0,0,0,0.06);border:none;width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:15px;color:#64748b;">✕</button>

      <div style="font-size:11px;font-weight:800;letter-spacing:1px;color:#8b5cf6;text-transform:uppercase;">PocketTrack UPI QR</div>
      <h3 style="margin:4px 0 2px;font-size:19px;color:#0f172a;font-family:'Space Grotesk',sans-serif;font-weight:800;">Scan to Pay via UPI</h3>
      <p style="margin:0;font-size:12.5px;color:#64748b;font-weight:500;">${escapeHTML(currentUpi)}</p>
      
      ${amount > 0 ? `<div style="font-size:26px;font-weight:800;color:#0f172a;margin:10px 0 -4px;font-family:'Space Grotesk',sans-serif;">₹${amount.toLocaleString('en-IN')}</div>` : ''}

      <div class="upi-qr-img-wrap">
        <img class="upi-qr-img" src="${qrUrl}" alt="UPI QR Code" onerror="this.src='icon-192.png'"/>
      </div>

      <div class="upi-apps-row">
        <span>GPay</span> · <span>PhonePe</span> · <span>Paytm</span> · <span>CRED</span>
      </div>

      <div style="display:flex;gap:8px;margin-top:18px;">
        <button class="btn" style="flex:1;background:#f1f5f9;color:#334155;border:none;border-radius:14px;padding:12px;font-size:13px;font-weight:600;" onclick="openUpiSetupModal(${amount}, '${escapeHTML(note)}')">Edit UPI ID</button>
        <button class="btn primary" style="flex:1;border-radius:14px;padding:12px;font-size:13px;font-weight:700;background:#8b5cf6;" onclick="closeUpiQrModal()">Done</button>
      </div>
    </div>
  `;

  requestAnimationFrame(() => {
    modal.classList.add('active');
  });
};

window.openUpiSetupModal = function(amount = 0, note = 'PocketTrack') {
  const currentUpi = window.getUserUpiId();
  const modal = getOrCreateUpiModal();

  modal.innerHTML = `
    <div class="upi-qr-panel" style="text-align:left;">
      <button onclick="closeUpiQrModal()" style="position:absolute;top:16px;right:16px;background:rgba(0,0,0,0.06);border:none;width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:15px;color:#64748b;">✕</button>

      <div style="font-size:28px;margin-bottom:8px;">⚡</div>
      <h3 style="margin:0 0 4px;font-size:19px;color:#0f172a;font-family:'Space Grotesk',sans-serif;font-weight:800;">Set Your UPI ID</h3>
      <p style="margin:0 0 14px;font-size:13px;color:#64748b;line-height:1.45;">Enter your UPI ID so friends can scan your QR code and settle debts instantly.</p>

      <label style="font-size:12px;font-weight:700;color:#334155;display:block;margin-bottom:6px;">Your UPI ID / VPA</label>
      <input type="text" id="upi-setup-input" value="${escapeHTML(currentUpi)}" placeholder="e.g. 9876543210 or yourname" style="width:100%;padding:13px 14px;border-radius:14px;background:#f8fafc;border:1.5px solid #cbd5e1;color:#0f172a;font-size:14.5px;font-weight:500;box-sizing:border-box;outline:none;margin-bottom:8px;">

      <!-- 1-Tap Quick Bank Provider Pills -->
      <div style="margin-bottom:18px;">
        <div style="font-size:11px;font-weight:700;color:#64748b;margin-bottom:6px;">Quick Bank Suffix:</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          <button type="button" class="btn" style="padding:4px 9px;font-size:11.5px;border-radius:8px;background:#f1f5f9;color:#334155;border:1px solid #cbd5e1;" onclick="appendUpiSuffix('@okhdfcbank')">@okhdfcbank</button>
          <button type="button" class="btn" style="padding:4px 9px;font-size:11.5px;border-radius:8px;background:#f1f5f9;color:#334155;border:1px solid #cbd5e1;" onclick="appendUpiSuffix('@paytm')">@paytm</button>
          <button type="button" class="btn" style="padding:4px 9px;font-size:11.5px;border-radius:8px;background:#f1f5f9;color:#334155;border:1px solid #cbd5e1;" onclick="appendUpiSuffix('@okaxis')">@okaxis</button>
          <button type="button" class="btn" style="padding:4px 9px;font-size:11.5px;border-radius:8px;background:#f1f5f9;color:#334155;border:1px solid #cbd5e1;" onclick="appendUpiSuffix('@ybl')">@ybl</button>
          <button type="button" class="btn" style="padding:4px 9px;font-size:11.5px;border-radius:8px;background:#f1f5f9;color:#334155;border:1px solid #cbd5e1;" onclick="appendUpiSuffix('@ibl')">@ibl</button>
        </div>
      </div>

      <div style="display:flex;gap:8px;">
        <button class="btn" style="flex:1;background:#f1f5f9;color:#334155;border:none;border-radius:14px;padding:12px;font-size:13px;" onclick="closeUpiQrModal()">Cancel</button>
        <button class="btn primary" style="flex:1.3;border-radius:14px;padding:12px;font-size:13px;font-weight:700;background:#8b5cf6;" onclick="saveUpiIdFromSetup(${amount}, '${escapeHTML(note)}')">Generate QR →</button>
      </div>
    </div>
  `;

  requestAnimationFrame(() => {
    modal.classList.add('active');
  });
};

window.appendUpiSuffix = function(suffix) {
  const input = document.getElementById('upi-setup-input');
  if (!input) return;
  let val = input.value.trim();
  if (val.includes('@')) {
    val = val.split('@')[0];
  }
  input.value = (val ? val : '') + suffix;
};

window.saveUpiIdFromSetup = function(amount, note) {
  const input = document.getElementById('upi-setup-input');
  if (!input || !input.value.trim()) {
    if (typeof toast === 'function') toast('Please enter a valid UPI ID', 'error');
    return;
  }

  window.setUserUpiId(input.value.trim());
  if (typeof toast === 'function') toast('UPI ID saved successfully!', 'success');
  window.openUpiQrModal(amount, note);
};
