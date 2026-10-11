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
  const uid = (typeof currentUser !== 'undefined' && currentUser) ? currentUser.uid : '';
  const key = uid ? 'pockettrack_user_upi_id_' + uid : 'pockettrack_user_upi_id';
  return localStorage.getItem(key) || (key !== 'pockettrack_user_upi_id' ? localStorage.getItem('pockettrack_user_upi_id') : '') || '';
};

window.setUserUpiId = function(upiId) {
  if (upiId) {
    const uid = (typeof currentUser !== 'undefined' && currentUser) ? currentUser.uid : '';
    const key = uid ? 'pockettrack_user_upi_id_' + uid : 'pockettrack_user_upi_id';
    localStorage.setItem(key, upiId.trim());
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

// --- Standalone On-Device Local QR SVG Generator (Vanilla JS, Zero Network Requests) ---
function generateUpiQrSvg(text, size = 200) {
  const GF_EXP = new Uint8Array(512);
  const GF_LOG = new Uint8Array(256);
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_EXP[i + 255] = x;
    GF_LOG[x] = i;
    x = (x << 1) ^ (x >= 128 ? 0x11d : 0);
  }

  function gfMul(a, b) {
    if (a === 0 || b === 0) return 0;
    return GF_EXP[GF_LOG[a] + GF_LOG[b]];
  }

  function gfPolyMul(p, q) {
    const r = new Uint8Array(p.length + q.length - 1);
    for (let i = 0; i < p.length; i++) {
      for (let j = 0; j < q.length; j++) {
        r[i + j] ^= gfMul(p[i], q[j]);
      }
    }
    return r;
  }

  function getRsGenPoly(numEc) {
    let poly = new Uint8Array([1]);
    for (let i = 0; i < numEc; i++) {
      poly = gfPolyMul(poly, new Uint8Array([1, GF_EXP[i]]));
    }
    return poly;
  }

  function rsEncode(data, numEc) {
    const gen = getRsGenPoly(numEc);
    const res = new Uint8Array(numEc);
    for (let i = 0; i < data.length; i++) {
      const coef = data[i] ^ res[0];
      res.copyWithin(0, 1);
      res[numEc - 1] = 0;
      for (let j = 0; j < numEc; j++) {
        res[j] ^= gfMul(gen[j + 1], coef);
      }
    }
    return res;
  }

  const VERSIONS = [
    null,
    { ver: 1, size: 21, dataCap: 16, ecBytes: 10, blocks: 1, align: [] },
    { ver: 2, size: 25, dataCap: 28, ecBytes: 16, blocks: 1, align: [6, 18] },
    { ver: 3, size: 29, dataCap: 44, ecBytes: 26, blocks: 1, align: [6, 22] },
    { ver: 4, size: 33, dataCap: 64, ecBytes: 18, blocks: 2, align: [6, 26] },
    { ver: 5, size: 37, dataCap: 86, ecBytes: 24, blocks: 2, align: [6, 30] },
    { ver: 6, size: 41, dataCap: 108, ecBytes: 16, blocks: 4, align: [6, 34] },
    { ver: 7, size: 45, dataCap: 124, ecBytes: 18, blocks: 4, align: [6, 22, 38] },
    { ver: 8, size: 49, dataCap: 154, ecBytes: 22, blocks: 4, align: [6, 24, 42] },
    { ver: 9, size: 53, dataCap: 182, ecBytes: 22, blocks: 5, align: [6, 26, 46] },
    { ver: 10, size: 57, dataCap: 216, ecBytes: 26, blocks: 5, align: [6, 28, 50] }
  ];

  const rawBytes = typeof TextEncoder !== 'undefined'
    ? Array.from(new TextEncoder().encode(text))
    : (() => {
        const bytes = [];
        for (let i = 0; i < text.length; i++) {
          const cp = text.codePointAt(i);
          const str = String.fromCodePoint(cp);
          if (cp > 0xFFFF) i++;
          const u = encodeURIComponent(str).split('%').filter(Boolean);
          u.forEach(h => bytes.push(parseInt(h, 16)));
        }
        return bytes;
      })();

  let chosenVer = null;
  for (let v = 1; v <= 10; v++) {
    const info = VERSIONS[v];
    const headerBits = 4 + (v < 10 ? 8 : 16);
    const requiredBits = headerBits + rawBytes.length * 8;
    if (requiredBits <= info.dataCap * 8) {
      chosenVer = info;
      break;
    }
  }
  if (!chosenVer) chosenVer = VERSIONS[10];

  const bitBuf = [];
  function putBits(val, len) {
    for (let i = len - 1; i >= 0; i--) bitBuf.push((val >>> i) & 1);
  }

  putBits(0b0100, 4);
  putBits(rawBytes.length, chosenVer.ver < 10 ? 8 : 16);
  for (let b of rawBytes) putBits(b, 8);

  const maxDataBits = chosenVer.dataCap * 8;
  const termBits = Math.min(4, maxDataBits - bitBuf.length);
  for (let i = 0; i < termBits; i++) bitBuf.push(0);
  while (bitBuf.length % 8 !== 0) bitBuf.push(0);

  const pad = [0xEC, 0x11];
  let padIdx = 0;
  while (bitBuf.length < maxDataBits) {
    putBits(pad[padIdx % 2], 8);
    padIdx++;
  }

  const dataBytes = new Uint8Array(chosenVer.dataCap);
  for (let i = 0; i < chosenVer.dataCap; i++) {
    let byteVal = 0;
    for (let b = 0; b < 8; b++) byteVal = (byteVal << 1) | bitBuf[i * 8 + b];
    dataBytes[i] = byteVal;
  }

  const numBlocks = chosenVer.blocks;
  const ecLen = chosenVer.ecBytes;
  const blockSize = Math.floor(chosenVer.dataCap / numBlocks);
  const remainder = chosenVer.dataCap % numBlocks;

  const dataBlocks = [];
  const ecBlocks = [];
  let offset = 0;
  for (let i = 0; i < numBlocks; i++) {
    const curBlockLen = blockSize + (i >= numBlocks - remainder ? 1 : 0);
    const slice = dataBytes.subarray(offset, offset + curBlockLen);
    offset += curBlockLen;
    dataBlocks.push(slice);
    ecBlocks.push(rsEncode(slice, ecLen));
  }

  const finalSequence = [];
  const maxBlockLen = blockSize + (remainder > 0 ? 1 : 0);
  for (let i = 0; i < maxBlockLen; i++) {
    for (let b = 0; b < numBlocks; b++) {
      if (i < dataBlocks[b].length) finalSequence.push(dataBlocks[b][i]);
    }
  }
  for (let i = 0; i < ecLen; i++) {
    for (let b = 0; b < numBlocks; b++) {
      finalSequence.push(ecBlocks[b][i]);
    }
  }

  const N = chosenVer.size;
  const matrix = Array.from({ length: N }, () => new Int8Array(N).fill(-1));

  function setFinder(r, c) {
    for (let y = -1; y <= 7; y++) {
      for (let x = -1; x <= 7; x++) {
        const nr = r + y, nc = c + x;
        if (nr >= 0 && nr < N && nc >= 0 && nc < N) {
          if (y >= 0 && y <= 6 && x >= 0 && x <= 6) {
            matrix[nr][nc] = (y === 0 || y === 6 || x === 0 || x === 6 || (y >= 2 && y <= 4 && x >= 2 && x <= 4)) ? 1 : 0;
          } else {
            matrix[nr][nc] = 0;
          }
        }
      }
    }
  }

  setFinder(0, 0);
  setFinder(0, N - 7);
  setFinder(N - 7, 0);

  for (let i = 8; i < N - 8; i++) {
    if (matrix[6][i] === -1) matrix[6][i] = (i % 2 === 0) ? 1 : 0;
    if (matrix[i][6] === -1) matrix[i][6] = (i % 2 === 0) ? 1 : 0;
  }

  const alignCoords = chosenVer.align;
  for (let i = 0; i < alignCoords.length; i++) {
    for (let j = 0; j < alignCoords.length; j++) {
      const r = alignCoords[i], c = alignCoords[j];
      if ((r <= 8 && c <= 8) || (r <= 8 && c >= N - 9) || (r >= N - 9 && c <= 8)) continue;
      for (let y = -2; y <= 2; y++) {
        for (let x = -2; x <= 2; x++) {
          matrix[r + y][c + x] = (Math.abs(y) === 2 || Math.abs(x) === 2 || (y === 0 && x === 0)) ? 1 : 0;
        }
      }
    }
  }

  matrix[4 * chosenVer.ver + 9][8] = 1;

  for (let i = 0; i < 9; i++) {
    if (matrix[8][i] === -1) matrix[8][i] = -2;
    if (matrix[i][8] === -1) matrix[i][8] = -2;
  }
  for (let i = 0; i < 8; i++) {
    if (matrix[8][N - 1 - i] === -1) matrix[8][N - 1 - i] = -2;
    if (matrix[N - 1 - i][8] === -1) matrix[N - 1 - i][8] = -2;
  }

  const finalBits = [];
  for (let byte of finalSequence) {
    for (let b = 7; b >= 0; b--) finalBits.push((byte >>> b) & 1);
  }

  let bitIdx = 0;
  let upwards = true;
  for (let right = N - 1; right > 0; right -= 2) {
    if (right === 6) right--;
    const cols = [right, right - 1];
    const rows = upwards ? Array.from({ length: N }, (_, i) => N - 1 - i) : Array.from({ length: N }, (_, i) => i);
    for (let r of rows) {
      for (let c of cols) {
        if (matrix[r][c] === -1) {
          const bit = bitIdx < finalBits.length ? finalBits[bitIdx++] : 0;
          const mask = ((r + c) % 2 === 0) ? 1 : 0;
          matrix[r][c] = bit ^ mask;
        }
      }
    }
    upwards = !upwards;
  }

  const formatBits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];
  matrix[8][0] = formatBits[0];
  matrix[8][1] = formatBits[1];
  matrix[8][2] = formatBits[2];
  matrix[8][3] = formatBits[3];
  matrix[8][4] = formatBits[4];
  matrix[8][5] = formatBits[5];
  matrix[8][7] = formatBits[6];
  matrix[8][8] = formatBits[7];
  matrix[7][8] = formatBits[8];
  matrix[5][8] = formatBits[9];
  matrix[4][8] = formatBits[10];
  matrix[3][8] = formatBits[11];
  matrix[2][8] = formatBits[12];
  matrix[1][8] = formatBits[13];
  matrix[0][8] = formatBits[14];

  for (let i = 0; i < 7; i++) matrix[N - 1 - i][8] = formatBits[i];
  for (let i = 0; i < 8; i++) matrix[8][N - 8 + i] = formatBits[7 + i];

  const margin = 2;
  const totalGrid = N + margin * 2;
  let paths = '';
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (matrix[r][c] === 1) {
        paths += `M${c + margin},${r + margin}h1v1h-1z `;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalGrid} ${totalGrid}" width="${size}" height="${size}" style="max-width:100%;height:auto;display:block;border-radius:12px;background:#ffffff;"><rect width="100%" height="100%" fill="#ffffff"/><path d="${paths}" fill="#0f172a"/></svg>`;
}
window.generateUpiQrSvg = generateUpiQrSvg;

window.openUpiQrModal = function(amount = 0, note = 'PocketTrack') {
  const currentUpi = window.getUserUpiId();

  if (!currentUpi) {
    window.openUpiSetupModal(amount, note);
    return;
  }

  const amtStr = amount > 0 ? `&am=${amount}` : '';
  const upiPayload = `upi://pay?pa=${encodeURIComponent(currentUpi)}&pn=PocketTrack${amtStr}&tn=${encodeURIComponent(note)}&cu=INR`;
  const qrSvg = generateUpiQrSvg(upiPayload, 200);

  const modal = getOrCreateUpiModal();
  modal.innerHTML = `
    <div class="upi-qr-panel">
      <button onclick="closeUpiQrModal()" style="position:absolute;top:16px;right:16px;background:rgba(0,0,0,0.06);border:none;width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:15px;color:#64748b;">✕</button>

      <div style="font-size:11px;font-weight:800;letter-spacing:1px;color:#8b5cf6;text-transform:uppercase;">PocketTrack UPI QR</div>
      <h3 style="margin:4px 0 2px;font-size:19px;color:#0f172a;font-family:'Space Grotesk',sans-serif;font-weight:800;">Scan to Pay via UPI</h3>
      <p style="margin:0;font-size:12.5px;color:#64748b;font-weight:500;">${escapeHTML(currentUpi)}</p>
      
      ${amount > 0 ? `<div style="font-size:26px;font-weight:800;color:#0f172a;margin:10px 0 -4px;font-family:'Space Grotesk',sans-serif;">₹${amount.toLocaleString('en-IN')}</div>` : ''}

      <div class="upi-qr-img-wrap">
        ${qrSvg}
      </div>

      <div class="upi-apps-row">
        <span>GPay</span> · <span>PhonePe</span> · <span>Paytm</span> · <span>CRED</span>
      </div>

      <div style="display:flex;gap:8px;margin-top:18px;">
        <button class="btn" style="flex:1;background:#f1f5f9;color:#334155;border:none;border-radius:14px;padding:12px;font-size:13px;font-weight:600;" data-amount="${Number(amount) || 0}" data-note="${escapeHTML(note)}" onclick="openUpiSetupModal(Number(this.dataset.amount), this.dataset.note)">Edit UPI ID</button>
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
        <button class="btn primary" style="flex:1.3;border-radius:14px;padding:12px;font-size:13px;font-weight:700;background:#8b5cf6;" data-amount="${Number(amount) || 0}" data-note="${escapeHTML(note)}" onclick="saveUpiIdFromSetup(Number(this.dataset.amount), this.dataset.note)">Generate QR →</button>
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
  const val = input ? input.value.trim() : '';
  if (!val || !val.includes('@') || val.startsWith('@') || val.endsWith('@')) {
    if (typeof toast === 'function') toast('Please enter a valid UPI ID (e.g. name@bank)', 'error');
    return;
  }

  window.setUserUpiId(val);
  if (typeof toast === 'function') toast('UPI ID saved successfully!', 'success');
  window.openUpiQrModal(amount, note);
};
