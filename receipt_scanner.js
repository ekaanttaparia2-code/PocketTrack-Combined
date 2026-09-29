// receipt_scanner.js — Client-Side Smart Receipt & Bill OCR Scanner for PocketTrack
// 100% on-device OCR using Tesseract.js — zero external backend, DPDP Act 2023 compliant.

(function () {
  'use strict';

  let ocrWorker = null;
  let isScanning = false;
  let lastScannedData = null;
  let activeCameraStream = null;
  let currentFacingMode = 'environment';

  // Top known merchant directory for instant high-confidence classification in India & globally
  const KNOWN_MERCHANTS = [
    { name: "Starbucks", cat: "food" },
    { name: "McDonald's", cat: "food" },
    { name: "KFC", cat: "food" },
    { name: "Domino's Pizza", cat: "food" },
    { name: "Pizza Hut", cat: "food" },
    { name: "Subway", cat: "food" },
    { name: "Burger King", cat: "food" },
    { name: "Haldiram's", cat: "food" },
    { name: "Bikanervala", cat: "food" },
    { name: "Chai Point", cat: "food" },
    { name: "Chaayos", cat: "food" },
    { name: "Swiggy", cat: "food" },
    { name: "Zomato", cat: "food" },
    { name: "Blue Tokai", cat: "food" },
    { name: "Barista", cat: "food" },
    { name: "Third Wave Coffee", cat: "food" },
    { name: "Wow Momo", cat: "food" },
    { name: "Barbeque Nation", cat: "food" },
    { name: "Blinkit", cat: "home" },
    { name: "Zepto", cat: "home" },
    { name: "Instamart", cat: "home" },
    { name: "BigBasket", cat: "home" },
    { name: "DMart", cat: "home" },
    { name: "Reliance Fresh", cat: "home" },
    { name: "Reliance Smart", cat: "home" },
    { name: "Nature's Basket", cat: "home" },
    { name: "Apollo Pharmacy", cat: "health" },
    { name: "Medplus", cat: "health" },
    { name: "Tata 1mg", cat: "health" },
    { name: "Netmeds", cat: "health" },
    { name: "Zara", cat: "shopping" },
    { name: "H&M", cat: "shopping" },
    { name: "Uniqlo", cat: "shopping" },
    { name: "Westside", cat: "shopping" },
    { name: "Pantaloons", cat: "shopping" },
    { name: "Trends", cat: "shopping" },
    { name: "Croma", cat: "shopping" },
    { name: "Vijay Sales", cat: "shopping" },
    { name: "Reliance Digital", cat: "shopping" },
    { name: "Decathlon", cat: "shopping" },
    { name: "Miniso", cat: "shopping" },
    { name: "Indian Oil", cat: "travel" },
    { name: "HPCL", cat: "travel" },
    { name: "BPCL", cat: "travel" },
    { name: "Shell", cat: "travel" },
    { name: "Uber", cat: "travel" },
    { name: "Ola", cat: "travel" },
    { name: "Rapido", cat: "travel" },
    { name: "PVR", cat: "entertainment" },
    { name: "INOX", cat: "entertainment" },
    { name: "Cinepolis", cat: "entertainment" }
  ];

  // Dynamically load Tesseract.js CDN script
  function loadTesseractLibrary() {
    return new Promise((resolve, reject) => {
      if (window.Tesseract) {
        return resolve(window.Tesseract);
      }
      const existingScript = document.getElementById('tesseract-cdn-script');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(window.Tesseract));
        existingScript.addEventListener('error', (err) => reject(err));
        return;
      }
      const script = document.createElement('script');
      script.id = 'tesseract-cdn-script';
      script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
      script.async = true;
      script.onload = () => resolve(window.Tesseract);
      script.onerror = (err) => reject(new Error('Failed to load OCR vision engine. Check internet connection.'));
      document.head.appendChild(script);
    });
  }

  // Ensure hidden camera / file input exists
  function getFileInput() {
    let input = document.getElementById('receipt-scanner-input');
    if (!input) {
      input = document.createElement('input');
      input.type = 'file';
      input.id = 'receipt-scanner-input';
      input.accept = 'image/*';
      input.style.display = 'none';
      input.addEventListener('change', function () {
        if (this.files && this.files[0]) {
          processReceiptFile(this.files[0]);
        }
      });
      document.body.appendChild(input);
    }
    return input;
  }

  // Trigger file selection from device storage / gallery
  window.triggerFileInput = function () {
    stopLiveCamera();
    const input = getFileInput();
    input.value = '';
    input.click();
  };

  // Public entry trigger: opens live camera viewfinder directly
  window.triggerReceiptScanner = function () {
    const modal = ensureScannerModal();
    modal.style.display = 'flex';
    startLiveCamera();
  };

  // Image pre-processing for higher OCR accuracy on faded / thermal receipts
  function preprocessImage(imgElement) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const maxDim = 1600;
    let width = imgElement.naturalWidth || imgElement.width;
    let height = imgElement.naturalHeight || imgElement.height;

    if (width > maxDim || height > maxDim) {
      if (width > height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(imgElement, 0, 0, width, height);

    // Grayscale and dynamic contrast stretch
    try {
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        // Luminance formula
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        // Contrast enhancement
        const contrast = 1.25; // mild contrast boost
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
        const enhanced = Math.min(255, Math.max(0, factor * (gray - 128) + 128));
        data[i] = enhanced;
        data[i + 1] = enhanced;
        data[i + 2] = enhanced;
      }
      ctx.putImageData(imgData, 0, 0);
    } catch (e) {
      console.warn('Canvas filter bypass:', e);
    }

    return canvas;
  }

  // Parse raw OCR text into structured transaction fields
  function parseReceiptText(text) {
    if (!text) return null;
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const fullTextLower = text.toLowerCase();

    // 1. Merchant Detection
    let merchant = "";
    let category = "";

    for (const m of KNOWN_MERCHANTS) {
      if (fullTextLower.includes(m.name.toLowerCase())) {
        merchant = m.name;
        category = m.cat;
        break;
      }
    }

    if (!merchant) {
      const skipRegex = /^(tax invoice|tax memo|retail invoice|cash bill|invoice|cash memo|welcome|receipt|original|duplicate|customer copy|tel|phone|gstin|fssai|cin|date|time)/i;
      for (let i = 0; i < Math.min(lines.length, 6); i++) {
        const line = lines[i];
        if (line.length >= 3 && line.length <= 40 && !skipRegex.test(line) && !/^\d+$/.test(line) && !line.includes('@') && !line.includes('www.')) {
          merchant = line;
          break;
        }
      }
      if (!merchant) merchant = "Receipt Expense";
    }

    // Category detection fallback heuristics
    if (!category) {
      if (/restaurant|cafe|coffee|burger|pizza|kitchen|bakery|bar|dhaba|bistro|meals|food|swiggy|zomato|dining|tea|chai|sweets/i.test(fullTextLower)) {
        category = "food";
      } else if (/petrol|diesel|fuel|cng|shell|hpcl|bpcl|ioc|gas station|auto|cab|uber|ola|toll|parking|metro/i.test(fullTextLower)) {
        category = "travel";
      } else if (/pharmacy|chemist|apollo|medplus|clinic|hospital|doctor|medicine|tablets|health/i.test(fullTextLower)) {
        category = "health";
      } else if (/supermarket|groceries|kirana|provisions|mart|blinkit|zepto|instamart|dmart/i.test(fullTextLower)) {
        category = "home";
      } else if (/apparel|clothing|fashion|shoes|footwear|mall|croma|digital|wear|zara|h&m|amazon/i.test(fullTextLower)) {
        category = "shopping";
      } else {
        category = "food";
      }
    }

    // 2. Date Detection
    let date = "";
    const datePatterns = [
      /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})\b/,
      /\b(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})\b/,
      /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})\b/,
      /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+(\d{4})\b/i
    ];

    for (const pat of datePatterns) {
      const match = text.match(pat);
      if (match) {
        try {
          if (match[3] && match[3].length === 4 && pat === datePatterns[0]) {
            const d = match[1].padStart(2, '0');
            const m = match[2].padStart(2, '0');
            const y = match[3];
            date = `${y}-${m}-${d}`;
            break;
          } else if (match[1].length === 4) {
            const y = match[1];
            const m = match[2].padStart(2, '0');
            const d = match[3].padStart(2, '0');
            date = `${y}-${m}-${d}`;
            break;
          } else if (match[2] && isNaN(match[2])) {
            const months = { jan:1, feb:2, mar:3, apr:4, may:5, jun:6, jul:7, aug:8, sep:9, oct:10, nov:11, dec:12 };
            const mNum = months[match[2].toLowerCase().slice(0, 3)] || 1;
            const d = match[1].padStart(2, '0');
            const m = String(mNum).padStart(2, '0');
            const y = match[3];
            date = `${y}-${m}-${d}`;
            break;
          }
        } catch (err) {}
      }
    }

    if (!date) {
      const now = new Date();
      date = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }

    // 3. Amount Detection
    let detectedAmount = 0;
    const totalKeywords = [
      'grand total', 'net payable', 'net total', 'total amount',
      'total payable', 'amount paid', 'bill total', 'bill amount',
      'sub total', 'subtotal', 'total', 'balance due', 'paid amt'
    ];

    for (const kw of totalKeywords) {
      const matchingLines = lines.filter(l => l.toLowerCase().includes(kw));
      for (const line of matchingLines) {
        const numMatches = [...line.matchAll(/(?:(?:₹|rs\.?|inr)\s*)?(\b\d{1,3}(?:,\d{2,3})+(?:\.\d{1,2})?\b|\b\d{1,6}(?:\.\d{1,2})?\b)/gi)];
        for (const m of numMatches) {
          if (!m[1]) continue;
          const cleanNum = parseFloat(m[1].replace(/,/g, ''));
          if (cleanNum > 0 && cleanNum < 1000000 && cleanNum !== 2024 && cleanNum !== 2025 && cleanNum !== 2026) {
            detectedAmount = cleanNum;
            break;
          }
        }
        if (detectedAmount > 0) break;
      }
      if (detectedAmount > 0) break;
    }

    // Fallback: search for numbers explicitly prefixed with currency symbol anywhere
    if (!detectedAmount) {
      const currencyMatches = [...text.matchAll(/(?:₹|rs\.?|inr)\s*(\b\d{1,3}(?:,\d{2,3})+(?:\.\d{1,2})?\b|\b\d{1,6}(?:\.\d{1,2})?\b)/gi)];
      for (const m of currencyMatches) {
        if (!m[1]) continue;
        const num = parseFloat(m[1].replace(/,/g, ''));
        if (num > 0 && num < 1000000 && num !== 2024 && num !== 2025 && num !== 2026) {
          detectedAmount = Math.max(detectedAmount, num);
        }
      }
    }

    return {
      merchant,
      category,
      amount: detectedAmount,
      date,
      rawText: text
    };
  }

  // Create or retrieve scanning modal
  function ensureScannerModal() {
    let modal = document.getElementById('receipt-scanner-modal-backdrop');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'receipt-scanner-modal-backdrop';
      modal.style.cssText = `
        position: fixed; inset: 0; background: rgba(7, 4, 20, 0.92);
        backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
        z-index: 999999; display: none; align-items: center; justify-content: center;
        padding: 16px; animation: fadeIn 0.2s ease;
      `;
      modal.innerHTML = `
        <div class="card" style="
          max-width: 480px; width: 100%; background: linear-gradient(165deg, #171133, #0d0922);
          border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 26px; padding: 20px;
          box-shadow: 0 25px 70px rgba(0, 0, 0, 0.85); position: relative; overflow: hidden;
        ">
          <!-- Close button -->
          <button type="button" onclick="closeReceiptScannerModal()" style="
            position: absolute; top: 16px; right: 16px; background: rgba(255,255,255,0.08);
            border: none; color: #fff; width: 32px; height: 32px; border-radius: 50%;
            cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; z-index: 20;
          ">✕</button>

          <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
            <div style="width:38px;height:38px;border-radius:12px;background:rgba(56,189,248,0.15);border:1px solid rgba(56,189,248,0.4);display:flex;align-items:center;justify-content:center;font-size:20px;">📷</div>
            <div>
              <h3 style="margin:0;font-family:'Space Grotesk',sans-serif;font-size:18px;color:#fff;">Smart Receipt Camera</h3>
              <p style="margin:2px 0 0;font-size:11.5px;color:var(--text-dim,#a1a1aa);">Live camera scan · 100% on-device OCR</p>
            </div>
          </div>

          <!-- Viewfinder Frame -->
          <div id="receipt-viewfinder" style="
            position: relative; width: 100%; height: 280px; border-radius: 18px;
            background: #000; overflow: hidden; border: 1.5px solid rgba(56,189,248,0.35);
            display: flex; align-items: center; justify-content: center; margin-bottom: 12px;
          ">
            <!-- Video stream -->
            <video id="receipt-camera-video" autoplay playsinline muted style="width:100%;height:100%;object-fit:cover;display:none;"></video>

            <!-- Image Preview when photo captured or uploaded -->
            <img id="receipt-preview-img" style="max-width:100%;max-height:100%;object-fit:contain;display:none;" alt="Receipt Preview"/>
            
            <!-- Reticle Alignment Guides -->
            <div id="receipt-reticle" style="position:absolute;inset:18px;pointer-events:none;display:none;z-index:4;">
              <div style="position:absolute;top:0;left:0;width:24px;height:24px;border-top:3px solid #38bdf8;border-left:3px solid #38bdf8;border-top-left-radius:8px;box-shadow:-2px -2px 10px rgba(56,189,248,0.5);"></div>
              <div style="position:absolute;top:0;right:0;width:24px;height:24px;border-top:3px solid #38bdf8;border-right:3px solid #38bdf8;border-top-right-radius:8px;box-shadow:2px -2px 10px rgba(56,189,248,0.5);"></div>
              <div style="position:absolute;bottom:0;left:0;width:24px;height:24px;border-bottom:3px solid #38bdf8;border-left:3px solid #38bdf8;border-bottom-left-radius:8px;box-shadow:-2px 2px 10px rgba(56,189,248,0.5);"></div>
              <div style="position:absolute;bottom:0;right:0;width:24px;height:24px;border-bottom:3px solid #38bdf8;border-right:3px solid #38bdf8;border-bottom-right-radius:8px;box-shadow:2px 2px 10px rgba(56,189,248,0.5);"></div>
              
              <div style="position:absolute;top:10px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.68);backdrop-filter:blur(6px);padding:4px 12px;border-radius:14px;font-size:11px;color:#e0f2fe;font-weight:600;white-space:nowrap;letter-spacing:0.2px;border:1px solid rgba(56,189,248,0.35);">
                Align receipt inside frame
              </div>
            </div>

            <!-- Shutter Flash Overlay -->
            <div id="receipt-camera-flash" style="position:absolute;inset:0;background:#ffffff;opacity:0;pointer-events:none;transition:opacity 0.15s ease;z-index:9;"></div>

            <!-- Scanning Laser Line -->
            <div id="receipt-scanner-laser" style="
              position: absolute; left: 0; right: 0; height: 3px;
              background: linear-gradient(90deg, transparent, #38bdf8, #a855f7, #38bdf8, transparent);
              box-shadow: 0 0 12px #38bdf8, 0 0 25px #a855f7;
              animation: scannerLaserSweep 2s ease-in-out infinite alternate;
              z-index: 6; display: none;
            "></div>

            <div id="receipt-placeholder-text" style="color:rgba(255,255,255,0.4);font-size:12px;text-align:center;">
              Connecting to camera...
            </div>
          </div>

          <!-- Live Camera Controls (Shutter, Gallery, Flip) -->
          <div id="receipt-camera-controls" style="display:none;align-items:center;justify-content:space-around;padding:6px 12px 10px;">
            <button type="button" onclick="triggerFileInput()" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:#fff;border-radius:14px;padding:9px 14px;font-size:12px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:all 0.2s ease;">
              <span>📁</span><span>Gallery</span>
            </button>

            <button type="button" id="receipt-shutter-btn" onclick="captureCameraPhoto()" style="width:64px;height:64px;border-radius:50%;background:#ffffff;border:4px solid #38bdf8;box-shadow:0 0 24px rgba(56,189,248,0.7);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform 0.15s ease;" onmousedown="this.style.transform='scale(0.92)'" onmouseup="this.style.transform='scale(1)'" ontouchstart="this.style.transform='scale(0.92)'" ontouchend="this.style.transform='scale(1)'" title="Capture and Scan">
              <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#38bdf8,#818cf8);"></div>
            </button>

            <button type="button" id="receipt-flip-btn" onclick="flipCameraFacingMode()" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:#fff;border-radius:14px;padding:9px 14px;font-size:12px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:all 0.2s ease;">
              <span>🔄</span><span>Flip</span>
            </button>
          </div>

          <!-- Progress / Status bar -->
          <div id="receipt-status-section" style="margin-bottom:14px;display:none;">
            <div style="display:flex;justify-content:space-between;font-size:11.5px;color:#38bdf8;font-weight:600;margin-bottom:6px;">
              <span id="receipt-status-label">Initializing OCR engine...</span>
              <span id="receipt-status-percent">0%</span>
            </div>
            <div style="width:100%;height:6px;background:rgba(255,255,255,0.08);border-radius:3px;overflow:hidden;">
              <div id="receipt-progress-bar" style="width:0%;height:100%;background:linear-gradient(90deg,#38bdf8,#818cf8,#c084fc);transition:width 0.2s ease;"></div>
            </div>
          </div>

          <!-- Extracted Result Preview (Hidden until finished) -->
          <div id="receipt-result-card" style="display:none;background:rgba(255,255,255,0.04);border:1px solid rgba(56,189,248,0.3);border-radius:16px;padding:14px;margin-bottom:16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
              <span style="font-size:11px;text-transform:uppercase;color:#38bdf8;font-weight:700;letter-spacing:0.5px;">✓ Detected Details</span>
              <span id="receipt-result-badge" style="font-size:10.5px;background:rgba(52,211,153,0.15);color:#34d399;border:1px solid rgba(52,211,153,0.35);padding:2px 8px;border-radius:10px;">High Confidence</span>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:8px;">
              <div>
                <label style="font-size:10.5px;color:var(--text-dim,#a1a1aa);display:block;margin-bottom:2px;">Store / Merchant</label>
                <input type="text" id="receipt-extracted-merchant" style="width:100%;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.15);color:#fff;border-radius:8px;padding:6px 8px;font-size:12.5px;font-weight:600;"/>
              </div>
              <div>
                <label style="font-size:10.5px;color:var(--text-dim,#a1a1aa);display:block;margin-bottom:2px;">Total Amount (₹)</label>
                <input type="number" id="receipt-extracted-amount" step="0.01" style="width:100%;background:rgba(0,0,0,0.3);border:1px solid rgba(56,189,248,0.4);color:#38bdf8;border-radius:8px;padding:6px 8px;font-size:14px;font-weight:700;"/>
              </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <div>
                <label style="font-size:10.5px;color:var(--text-dim,#a1a1aa);display:block;margin-bottom:2px;">Category</label>
                <select id="receipt-extracted-cat" style="width:100%;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.15);color:#fff;border-radius:8px;padding:6px 8px;font-size:12px;">
                  <option value="food">🍔 Food & snacks</option>
                  <option value="travel">🚕 Travel / Fuel</option>
                  <option value="home">🏠 Home & bills</option>
                  <option value="shopping">🛍️ Shopping</option>
                  <option value="friends">👯 Friends / Social</option>
                  <option value="health">💊 Health & Pharmacy</option>
                  <option value="other">📦 Other</option>
                </select>
              </div>
              <div>
                <label style="font-size:10.5px;color:var(--text-dim,#a1a1aa);display:block;margin-bottom:2px;">Date</label>
                <input type="date" id="receipt-extracted-date" style="width:100%;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.15);color:#fff;border-radius:8px;padding:6px 8px;font-size:12px;"/>
              </div>
            </div>
          </div>

          <!-- Bottom Action Buttons -->
          <div id="receipt-actions-scan" style="display:none;display:flex;gap:10px;">
            <button type="button" class="btn" onclick="closeReceiptScannerModal()" style="flex:1;border-radius:14px;padding:12px;font-size:12.5px;">Cancel</button>
            <button type="button" class="btn primary" onclick="startLiveCamera()" style="flex:1.4;border-radius:14px;padding:12px;font-size:12.5px;font-weight:700;">📷 Retake / Camera</button>
          </div>

          <div id="receipt-actions-result" style="display:none;display:flex;gap:10px;">
            <button type="button" class="btn" onclick="applyReceiptToComposer()" style="flex:1;border-radius:14px;padding:12px;font-size:12.5px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:#fff;font-weight:600;">
              ✏️ Review in Add
            </button>
            <button type="button" class="btn primary" onclick="quickSaveReceiptEntry()" style="flex:1.3;border-radius:14px;padding:12px;font-size:13px;font-weight:700;background:linear-gradient(135deg,#38bdf8,#818cf8);border:none;color:#fff;box-shadow:0 8px 24px rgba(56,189,248,0.35);">
              ⚡ Quick Save Now
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      // Inject Laser Animation Keyframes if needed
      if (!document.getElementById('receipt-laser-keyframes')) {
        const style = document.createElement('style');
        style.id = 'receipt-laser-keyframes';
        style.textContent = `
          @keyframes scannerLaserSweep {
            0% { top: 4%; }
            100% { top: 94%; }
          }
          .composer-scan-btn {
            background: linear-gradient(135deg, rgba(56,189,248,0.18), rgba(129,140,248,0.14));
            border: 1px solid rgba(56,189,248,0.45);
            color: #38bdf8;
            font-size: 13px;
            font-weight: 600;
            padding: 10px 14px;
            border-radius: 14px;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .composer-scan-btn:hover {
            background: linear-gradient(135deg, rgba(56,189,248,0.28), rgba(129,140,248,0.24));
            transform: translateY(-1px);
            box-shadow: 0 4px 15px rgba(56,189,248,0.25);
          }
        `;
        document.head.appendChild(style);
      }
    }
    return modal;
  }

  // Live Camera Viewfinder logic
  async function startLiveCamera() {
    ensureScannerModal();
    const video = document.getElementById('receipt-camera-video');
    const previewImg = document.getElementById('receipt-preview-img');
    const laser = document.getElementById('receipt-scanner-laser');
    const reticle = document.getElementById('receipt-reticle');
    const placeholder = document.getElementById('receipt-placeholder-text');
    const cameraControls = document.getElementById('receipt-camera-controls');
    const statusSection = document.getElementById('receipt-status-section');
    const resultCard = document.getElementById('receipt-result-card');
    const actionsScan = document.getElementById('receipt-actions-scan');
    const actionsResult = document.getElementById('receipt-actions-result');

    if (previewImg) previewImg.style.display = 'none';
    if (laser) laser.style.display = 'none';
    if (statusSection) statusSection.style.display = 'none';
    if (resultCard) resultCard.style.display = 'none';
    if (actionsScan) actionsScan.style.display = 'none';
    if (actionsResult) actionsResult.style.display = 'none';
    if (placeholder) {
      placeholder.innerHTML = 'Connecting to camera...';
      placeholder.style.display = 'block';
    }

    stopLiveCamera();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      handleCameraFallback('Live camera access is not supported by this browser. You can select an image file directly.');
      return;
    }

    try {
      let stream = null;
      try {
        // Preferred facing mode (environment for rear camera)
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: currentFacingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        });
      } catch (modeErr) {
        // Fallback to any camera available (e.g. desktop webcam)
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      activeCameraStream = stream;
      if (video) {
        video.srcObject = stream;
        video.style.display = 'block';
        await video.play();
      }

      if (placeholder) placeholder.style.display = 'none';
      if (reticle) reticle.style.display = 'block';
      if (cameraControls) cameraControls.style.display = 'flex';

    } catch (err) {
      console.warn('Live camera access error:', err);
      handleCameraFallback(err.name === 'NotAllowedError'
        ? 'Camera permission was denied. Please allow camera access in browser settings, or select a photo from your device.'
        : 'Could not activate camera. You can choose an image file from your device.');
    }
  }

  function stopLiveCamera() {
    if (activeCameraStream) {
      try {
        activeCameraStream.getTracks().forEach(t => t.stop());
      } catch (e) {}
      activeCameraStream = null;
    }
    const video = document.getElementById('receipt-camera-video');
    if (video) {
      try {
        video.pause();
        video.srcObject = null;
      } catch (e) {}
      video.style.display = 'none';
    }
    const reticle = document.getElementById('receipt-reticle');
    if (reticle) reticle.style.display = 'none';
    const cameraControls = document.getElementById('receipt-camera-controls');
    if (cameraControls) cameraControls.style.display = 'none';
  }

  function handleCameraFallback(msg) {
    stopLiveCamera();
    const placeholder = document.getElementById('receipt-placeholder-text');
    const cameraControls = document.getElementById('receipt-camera-controls');
    if (cameraControls) cameraControls.style.display = 'none';

    if (placeholder) {
      placeholder.innerHTML = `
        <div style="padding:16px 20px;text-align:center;">
          <div style="font-size:32px;margin-bottom:8px;">📷</div>
          <div style="font-weight:700;color:#fff;font-size:14px;margin-bottom:6px;">Camera Access</div>
          <div style="font-size:12px;color:var(--text-dim,#a1a1aa);line-height:1.4;margin-bottom:14px;">${escapeHTML(msg)}</div>
          <button type="button" class="btn primary" onclick="triggerFileInput()" style="border-radius:12px;padding:9px 18px;font-size:12.5px;font-weight:600;">
            📁 Pick Receipt File
          </button>
        </div>
      `;
      placeholder.style.display = 'block';
    }
  }

  window.startLiveCamera = startLiveCamera;
  window.stopLiveCamera = stopLiveCamera;

  window.flipCameraFacingMode = function () {
    currentFacingMode = (currentFacingMode === 'environment') ? 'user' : 'environment';
    startLiveCamera();
  };

  window.captureCameraPhoto = function () {
    const video = document.getElementById('receipt-camera-video');
    if (!video || !activeCameraStream) {
      triggerFileInput();
      return;
    }

    const flash = document.getElementById('receipt-camera-flash');
    if (flash) {
      flash.style.opacity = '0.9';
      setTimeout(() => { flash.style.opacity = '0'; }, 150);
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    stopLiveCamera();

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    processReceiptSource(dataUrl);
  };

  window.closeReceiptScannerModal = function () {
    stopLiveCamera();
    const modal = document.getElementById('receipt-scanner-modal-backdrop');
    if (modal) modal.style.display = 'none';
    isScanning = false;
  };

  // Main processing pipeline (supports DataURL string, Blob, or File)
  async function processReceiptSource(source) {
    const modal = ensureScannerModal();
    modal.style.display = 'flex';

    stopLiveCamera();

    const previewImg = document.getElementById('receipt-preview-img');
    const laser = document.getElementById('receipt-scanner-laser');
    const placeholder = document.getElementById('receipt-placeholder-text');
    const statusLabel = document.getElementById('receipt-status-label');
    const statusPercent = document.getElementById('receipt-status-percent');
    const progressBar = document.getElementById('receipt-progress-bar');
    const statusSection = document.getElementById('receipt-status-section');
    const resultCard = document.getElementById('receipt-result-card');
    const actionsScan = document.getElementById('receipt-actions-scan');
    const actionsResult = document.getElementById('receipt-actions-result');
    const cameraControls = document.getElementById('receipt-camera-controls');

    if (cameraControls) cameraControls.style.display = 'none';
    statusSection.style.display = 'block';
    resultCard.style.display = 'none';
    actionsScan.style.display = 'flex';
    actionsResult.style.display = 'none';
    laser.style.display = 'block';
    placeholder.style.display = 'none';
    previewImg.style.display = 'block';

    statusLabel.textContent = 'Loading receipt preview...';
    statusPercent.textContent = '10%';
    progressBar.style.width = '10%';

    let objectUrlToRevoke = null;
    if (typeof source === 'string') {
      previewImg.src = source;
    } else if (source instanceof Blob || source instanceof File) {
      objectUrlToRevoke = URL.createObjectURL(source);
      previewImg.src = objectUrlToRevoke;
    }

    await new Promise(r => { previewImg.onload = r; });

    try {
      statusLabel.textContent = 'Loading Vision OCR Engine...';
      statusPercent.textContent = '25%';
      progressBar.style.width = '25%';

      const tesseract = await loadTesseractLibrary();

      statusLabel.textContent = 'Optimizing image contrast...';
      statusPercent.textContent = '40%';
      progressBar.style.width = '40%';

      const optimizedCanvas = preprocessImage(previewImg);

      statusLabel.textContent = 'Scanning text & line items...';
      statusPercent.textContent = '60%';
      progressBar.style.width = '60%';

      // Run recognition
      const result = await tesseract.recognize(optimizedCanvas, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text' && m.progress != null) {
            const pct = Math.round(60 + m.progress * 35);
            statusPercent.textContent = `${pct}%`;
            progressBar.style.width = `${pct}%`;
          }
        }
      });

      const extractedText = result.data.text || '';
      console.log('PocketTrack OCR Raw Result:\n', extractedText);

      statusLabel.textContent = 'Extracting totals & merchant...';
      statusPercent.textContent = '98%';
      progressBar.style.width = '98%';

      const parsed = parseReceiptText(extractedText);
      lastScannedData = parsed;

      // Reveal Result Screen
      setTimeout(() => {
        laser.style.display = 'none';
        statusSection.style.display = 'none';
        resultCard.style.display = 'block';
        actionsScan.style.display = 'none';
        actionsResult.style.display = 'flex';

        document.getElementById('receipt-extracted-merchant').value = parsed.merchant || 'Receipt Expense';
        document.getElementById('receipt-extracted-amount').value = parsed.amount ? parsed.amount.toFixed(2) : '';
        document.getElementById('receipt-extracted-cat').value = parsed.category || 'food';
        document.getElementById('receipt-extracted-date').value = parsed.date || new Date().toISOString().split('T')[0];

        const badge = document.getElementById('receipt-result-badge');
        if (parsed.amount > 0) {
          badge.textContent = '✓ Amount Found';
          badge.style.color = '#34d399';
          badge.style.background = 'rgba(52,211,153,0.15)';
          if (typeof toast === 'function') toast(`✨ Found ₹${parsed.amount} at ${parsed.merchant}!`, 'success');
        } else {
          badge.textContent = '⚠️ Check Amount';
          badge.style.color = '#fbbf24';
          badge.style.background = 'rgba(251,191,36,0.15)';
          if (typeof toast === 'function') toast('Could not auto-detect total. Please confirm amount.', 'info');
        }

        if (objectUrlToRevoke) {
          try { URL.revokeObjectURL(objectUrlToRevoke); } catch (e) {}
        }
      }, 400);

    } catch (err) {
      console.error('Receipt OCR Error:', err);
      laser.style.display = 'none';
      statusLabel.textContent = 'Recognition Failed';
      statusLabel.style.color = '#f87171';
      
      const isNetwork = err.message && err.message.includes('internet connection');
      if (typeof toast === 'function') {
        toast(isNetwork ? 'Offline mode: Please enter receipt details manually.' : 'Could not auto-read receipt. Please enter manually.', isNetwork ? 'warning' : 'error');
      }

      // Show result card anyway so user is not stuck and can manually input
      setTimeout(() => {
        statusSection.style.display = 'none';
        resultCard.style.display = 'block';
        actionsScan.style.display = 'none';
        actionsResult.style.display = 'flex';
        
        document.getElementById('receipt-extracted-merchant').value = 'Receipt Expense';
        document.getElementById('receipt-extracted-amount').value = '';
        document.getElementById('receipt-extracted-cat').value = 'food';
        document.getElementById('receipt-extracted-date').value = new Date().toISOString().split('T')[0];
        
        const badge = document.getElementById('receipt-result-badge');
        badge.textContent = '⚠️ Manual Entry';
        badge.style.color = '#fbbf24';
        badge.style.background = 'rgba(251,191,36,0.15)';
      }, 500);
    }
  }

  function processReceiptFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      if (typeof toast === 'function') toast('Please select a valid image of a receipt or bill', 'error');
      return;
    }
    processReceiptSource(file);
  }

  // Apply parsed receipt details into Transaction Composer modal
  window.applyReceiptToComposer = function () {
    const merchant = document.getElementById('receipt-extracted-merchant')?.value || 'Receipt Expense';
    const amountStr = document.getElementById('receipt-extracted-amount')?.value || '';
    const cat = document.getElementById('receipt-extracted-cat')?.value || 'food';
    const date = document.getElementById('receipt-extracted-date')?.value || '';

    closeReceiptScannerModal();

    if (typeof openQuickComposer === 'function') {
      openQuickComposer('expense');

      setTimeout(() => {
        if (amountStr) {
          const amtInput = document.getElementById('composer-amount');
          if (amtInput) amtInput.value = amountStr;
        }
        if (merchant) {
          const noteInput = document.getElementById('composer-note');
          if (noteInput) noteInput.value = merchant.slice(0, 60);
        }
        if (date) {
          const dateInput = document.getElementById('composer-date');
          if (dateInput) dateInput.value = date;
        }

        // Select matching category chip
        const chip = document.querySelector(`#composer-expense-fields .composer-chip[data-cat="${cat}"]`);
        if (chip && typeof selectComposerChip === 'function') {
          selectComposerChip(chip, cat);
        }
      }, 200);
    }
  };

  // 1-Tap Quick Save directly into database
  window.quickSaveReceiptEntry = async function () {
    const merchant = (document.getElementById('receipt-extracted-merchant')?.value || 'Receipt Expense').trim();
    const amountVal = parseFloat(document.getElementById('receipt-extracted-amount')?.value || '0');
    const cat = document.getElementById('receipt-extracted-cat')?.value || 'food';
    const date = document.getElementById('receipt-extracted-date')?.value || (new Date().toISOString().split('T')[0]);

    if (!amountVal || amountVal <= 0 || isNaN(amountVal)) {
      if (typeof toast === 'function') toast('Please enter a valid amount before saving', 'error');
      document.getElementById('receipt-extracted-amount')?.focus();
      return;
    }

    const chosenWallet = (typeof activeWalletId !== 'undefined' && activeWalletId !== 'all') ? activeWalletId : 'cash';
    const payload = {
      type: 'expense',
      cat: cat,
      label: merchant,
      note: `Receipt: ${merchant}`,
      amt: Math.round(amountVal * 100) / 100,
      walletId: chosenWallet,
      date: date
    };

    closeReceiptScannerModal();

    try {
      const guardFn = (typeof maybeGuardAndSaveWithSmartEngine === 'function') ? maybeGuardAndSaveWithSmartEngine : (typeof maybeGuardAndSave === 'function' ? maybeGuardAndSave : null);
      if (guardFn) {
        await guardFn(payload, async () => {
          if (typeof saveEntry === 'function') await saveEntry(payload);
          if (typeof renderWalletSwitcher === 'function') renderWalletSwitcher();
          if (typeof checkBudget === 'function') checkBudget();
          if (typeof showSpendMoodToast === 'function') showSpendMoodToast(payload.amt);
          if (typeof toast === 'function') toast(`✓ Logged ₹${payload.amt} for ${merchant}!`, 'success');
        });
      } else if (typeof saveEntry === 'function') {
        await saveEntry(payload);
        if (typeof renderWalletSwitcher === 'function') renderWalletSwitcher();
        if (typeof toast === 'function') toast(`✓ Logged ₹${payload.amt} for ${merchant}!`, 'success');
      }
    } catch (err) {
      console.error('Quick save error:', err);
      if (typeof toast === 'function') toast('Failed to save receipt entry', 'error');
    }
  };

})();
