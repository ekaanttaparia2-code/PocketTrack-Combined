'use strict';

(function() {
    const s = document.createElement('style');
    s.textContent = `
        #wrapped-overlay {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100dvh;
            z-index: 100000 !important; background: #000; display: none;
            font-family: 'Space Grotesk', 'Inter', sans-serif;
            color: #fff; overflow: hidden;
        }
        #wrapped-overlay.active {
            display: block;
        }
        .wrapped-viewport {
            width: 100%; height: 100%; position: relative; overflow: hidden;
        }
        .wrapped-track {
            display: flex; height: 100%;
            transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            will-change: transform;
        }
        .wrapped-card {
            min-width: 100vw; min-height: 100%;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            padding: 40px 24px; box-sizing: border-box; text-align: center;
        }
        .wrapped-card h2 { font-size: 24px; font-family: 'Inter', sans-serif; opacity: 0.9; margin-bottom: 20px; font-weight: 500;}
        .wrapped-card .huge-number { font-size: 56px; font-weight: 700; margin: 10px 0; line-height: 1.1; }
        .wrapped-card .sub-text { font-size: 16px; opacity: 0.8; margin-top: 10px; font-family: 'Inter', sans-serif; line-height: 1.5; }
        
        /* Gradients */
        .card-bg-1 { background: linear-gradient(135deg, #4c1d95, #3730a3); }
        .card-bg-2 { background: linear-gradient(135deg, #991b1b, #be123c); }
        .card-bg-3 { background: linear-gradient(135deg, #0f766e, #059669); }
        .card-bg-4 { background: linear-gradient(135deg, #581c87, #6d28d9); }
        .card-bg-5 { background: linear-gradient(135deg, #0f172a, #1e3a8a); }
        
        .wrapped-close {
            position: absolute; top: calc(20px + env(safe-area-inset-top, 0px)); right: 20px;
            width: 44px; height: 44px; background: rgba(255,255,255,0.14);
            border-radius: 50%; display: flex; align-items: center; justify-content: center;
            font-size: 20px; cursor: pointer; z-index: 10001;
            border: 1px solid rgba(255,255,255,0.2); color: white; backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            transition: transform 0.2s, background 0.2s;
        }
        .wrapped-close:active { transform: scale(0.9); background: rgba(255,255,255,0.3); }
        .wrapped-nav-btn {
            position: absolute; top: 50%; transform: translateY(-50%);
            width: 44px; height: 44px; background: rgba(255,255,255,0.12);
            border: 1px solid rgba(255,255,255,0.2); border-radius: 50%;
            color: #fff; display: flex; align-items: center; justify-content: center;
            font-size: 22px; cursor: pointer; z-index: 10001; backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px); transition: all 0.2s;
        }
        .wrapped-nav-btn:active { transform: translateY(-50%) scale(0.9); }
        .wrapped-nav-prev { left: 16px; }
        .wrapped-nav-next { right: 16px; }
        @media(max-width: 480px) {
            .wrapped-nav-btn { display: none; }
        }
        .wrapped-dots {
            position: absolute; bottom: calc(30px + env(safe-area-inset-bottom, 0px)); left: 0; width: 100%;
            display: flex; justify-content: center; gap: 8px; z-index: 10001;
        }
        .wrapped-dot {
            width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.3);
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            cursor: pointer;
        }
        .wrapped-dot.active {
            background: #fff; width: 24px; border-radius: 12px;
        }
        
        /* Card 2 specific */
        .opp-cost { font-size: 32px; font-weight: 700; margin: 20px 0; color: #ffb4a2; }
        
        /* Card 4 specific */
        .bar-container { width: 100%; max-width: 320px; height: 24px; border-radius: 12px; display: flex; overflow: hidden; margin: 20px 0; background: rgba(255,255,255,0.1); }
        .bar-segment { height: 100%; }
        .cat-legend { display: flex; flex-direction: column; gap: 10px; width: 100%; max-width: 320px; text-align: left; }
        .legend-item { display: flex; justify-content: space-between; align-items: center; font-size: 14px; font-family: 'Inter', sans-serif;}
        .legend-dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; margin-right: 8px; }
        
        /* Card 5 specific */
        .health-score-circle {
            width: 160px; height: 160px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 48px; font-weight: 700; border: 8px solid #fff; margin: 20px 0;
            box-shadow: 0 0 20px rgba(0,0,0,0.3);
        }
        .share-btn {
            background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3);
            color: white; padding: 16px 24px; border-radius: 12px; font-size: 16px;
            font-weight: 600; cursor: pointer; margin-top: 30px; font-family: 'Inter', sans-serif;
            transition: background 0.2s; backdrop-filter: blur(4px); display: flex; align-items: center; gap: 8px;
        }
        .share-btn:active { background: rgba(255,255,255,0.25); transform: scale(0.98); }
        
        .wrapped-trigger-btn {
            background: linear-gradient(135deg, #8b5cf6, #f43f5e);
            color: white; border: none; padding: 0 20px; height: 52px; border-radius: 16px;
            font-size: 16px; font-weight: 600; width: 100%; cursor: pointer;
            box-shadow: 0 4px 15px rgba(244, 63, 94, 0.3); font-family: 'Inter', sans-serif;
            display: flex; align-items: center; justify-content: center; gap: 8px;
            transition: transform 0.2s, box-shadow 0.2s; margin: 20px 0;
        }
        .wrapped-trigger-btn:active { transform: scale(0.98); box-shadow: 0 2px 10px rgba(244, 63, 94, 0.2); }
    `;
    if (typeof document !== 'undefined') (document.head || document.documentElement || document.body)?.appendChild(s);
})();

// Application State
let wrappedData = null;
let currentCard = 0;
let touchStartX = 0;
let touchEndX = 0;
let overlayEl = null;
let trackEl = null;

const FALLBACK_COLORS = {
    food:'#4ade80', travel:'#60a5fa', friends:'#ffb84d', home:'#ff7eb3', 
    shopping:'#c084fc', entertainment:'#f472b6', health:'#fb7185', 
    education:'#fbbf24', work:'#22d3ee', other:'#9b95c2', custom:'#c4a8ff'
};
const colorsMap = (typeof CAT_COLORS !== 'undefined') ? CAT_COLORS : FALLBACK_COLORS;

window.getWrappedShareText = function() {
    if (!wrappedData) return '';
    const d = wrappedData;
    const catName = d.topCategory ? (d.topCategory.customCat || d.topCategory.cat) : 'N/A';
    const dnaName = d.dna ? d.dna.title : 'The Mystery';
    const dnaEmoji = d.dna ? d.dna.emoji : '🕵️';
    const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const mName = monthNames[d.month - 1] + ' ' + d.year;
    
    return `🎬 My PocketTrack Money Wrapped — ${mName}\n\n💰 Tracked: ₹${d.totalAmount.toLocaleString('en-IN')} across ${d.totalTxns} transactions\n🍔 Top spend: ${capitalize(catName)} (₹${d.topCatAmt.toLocaleString('en-IN')} — ${d.topCatPercent}%)\n💀 That's ₹${d.yearlyOppAmt.toLocaleString('en-IN')}/year — enough for ${d.oppItem}\n🧬 Financial DNA: ${dnaEmoji} ${dnaName}\n📊 Health Score: ${d.healthScore}/100\n\nKnow where YOUR money goes → PocketTrack`;
}

window.shareWrapped = async function() {
    const text = window.getWrappedShareText();
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'My Money Wrapped',
                text: text
            });
        } catch (e) {
            console.log('Share canceled or failed', e);
        }
    } else {
        navigator.clipboard.writeText(text).then(() => {
            const toastFn = getSafeFn('toast');
            if (toastFn) toastFn('Copied to clipboard!', 'success');
        });
    }
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getSafeFn(fnName) {
    return typeof window[fnName] === 'function' ? window[fnName] : null;
}

window.openMoneyWrapped = function(monthOffset = 0) {
    const mainEntriesFn = getSafeFn('mainEntries');
    if (!mainEntriesFn) {
        console.error('mainEntries function not found');
        return;
    }
    
    let entries = mainEntriesFn();
    
    const now = new Date();
    now.setMonth(now.getMonth() + monthOffset);
    const targetMonth = now.getMonth() + 1; // 1-12
    const targetYear = now.getFullYear();
    
    // Filter to month entries
    const monthEntries = entries.filter(e => {
        if (!e.date) return false;
        const parts = e.date.split('-');
        if (parts.length !== 3) return false;
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        return y === targetYear && m === targetMonth;
    });
    
    if (monthEntries.length < 3) {
        const toastFn = getSafeFn('toast');
        if (toastFn) toastFn("Not enough data for Wrapped yet. Keep logging!", 'info');
        return;
    }
    
    generateWrappedData(monthEntries, targetMonth, targetYear, entries);
    renderOverlay();
    openOverlay();
};

function generateWrappedData(monthEntries, m, y, allEntries) {
    let incCount = 0, expCount = 0, totalAmt = 0;
    let expenses = [];
    
    monthEntries.forEach(e => {
        const amt = parseFloat(e.amt) || 0;
        totalAmt += amt;
        if (e.type === 'income') {
            incCount++;
        } else {
            expCount++;
            expenses.push(e);
        }
    });
    
    let totalExpAmt = 0;
    let catTotals = {};
    expenses.forEach(e => {
        const amt = parseFloat(e.amt) || 0;
        totalExpAmt += amt;
        const key = e.cat === 'custom' ? `custom_${e.customCat}` : e.cat;
        if (!catTotals[key]) catTotals[key] = { amt: 0, cat: e.cat, customCat: e.customCat };
        catTotals[key].amt += amt;
    });
    
    const catArray = Object.values(catTotals).sort((a,b) => b.amt - a.amt);
    const topCat = catArray.length > 0 ? catArray[0] : null;
    
    // Opportunity Cost Calculations
    let yearlyOppAmt = 0;
    let oppItem = '';
    if (topCat) {
        yearlyOppAmt = topCat.amt * 12;
        if (yearlyOppAmt > 80000) oppItem = '1 iPhone 16 Pro 📱';
        else if (yearlyOppAmt > 50000) oppItem = '2 round trips to Goa 🏖️';
        else if (yearlyOppAmt > 30000) oppItem = '1 professional online course 🎓';
        else if (yearlyOppAmt > 15000) oppItem = '6 months of Netflix + Spotify 🎬';
        else if (yearlyOppAmt > 5000) oppItem = '50 books 📚';
        else oppItem = `${Math.floor(yearlyOppAmt / 15)} cups of chai ☕`;
    }
    
    // Financial Health Score
    let score = 50;
    const savingsRatio = totalAmt > 0 && incCount > 0 ? ((totalAmt - totalExpAmt) / totalAmt) : 0;
    if (savingsRatio > 0.3) score += 20;
    else if (savingsRatio > 0.1) score += 10;
    else if (savingsRatio < 0) score -= 20;
    
    if (expCount < 15) score += 10;
    if (catArray.length >= 4) score += 10;
    
    score = Math.max(0, Math.min(100, score));
    let verdict = "";
    if (score >= 80) verdict = "You're crushing it. 🏆";
    else if (score >= 60) verdict = "Good, not great. Room to grow. 📈";
    else if (score >= 40) verdict = "You're aware. That's the first step. 💡";
    else verdict = "Let's turn this around. Together. 💪";
    
    // Financial DNA Check
    let dnaObj = null;
    const calcDNA = getSafeFn('computeFinancialDNA');
    if (calcDNA) {
        dnaObj = calcDNA(allEntries);
    } else {
        const types = [
            { id: 'strategist', title: 'The Strategist', emoji: '♟️', pct: 12 },
            { id: 'social', title: 'The Social Spender', emoji: '🎉', pct: 28 },
            { id: 'leaker', title: 'The Leaker', emoji: '💧', pct: 24 }
        ];
        dnaObj = types[Math.floor(Math.random() * types.length)];
    }
    
    wrappedData = {
        month: m,
        year: y,
        totalAmount: totalAmt,
        incCount,
        expCount,
        totalTxns: monthEntries.length,
        topCategory: topCat,
        topCatAmt: topCat ? topCat.amt : 0,
        topCatPercent: topCat && totalExpAmt > 0 ? Math.round((topCat.amt / totalExpAmt) * 100) : 0,
        yearlyOppAmt,
        oppItem,
        dna: dnaObj,
        catArray: catArray.slice(0,4),
        totalExpAmt,
        healthScore: Math.round(score),
        verdict
    };
}

function renderOverlay() {
    if (!overlayEl) {
        overlayEl = document.createElement('div');
        overlayEl.id = 'wrapped-overlay';
        overlayEl.className = 'wrapped-overlay';
        document.body.appendChild(overlayEl);
    }
    
    const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const d = wrappedData;
    const mName = monthNames[d.month - 1];
    const topCatName = d.topCategory ? capitalize(d.topCategory.customCat || d.topCategory.cat) : 'N/A';
    
    let html = `
        <button class="wrapped-close" onclick="closeWrapped()">✕</button>
        <div class="wrapped-viewport">
            <div class="wrapped-track" id="wrapped-track">
                
                <!-- Card 1 -->
                <div class="wrapped-card card-bg-1">
                    <h2>${mName} ${d.year}</h2>
                    <div class="sub-text">Total Movement</div>
                    <div class="huge-number" id="wrapped-counter">₹0</div>
                    <div class="sub-text">${d.incCount} Income • ${d.expCount} Expenses<br/>${d.totalTxns} Total Transactions</div>
                </div>
                
                <!-- Card 2 -->
                <div class="wrapped-card card-bg-2">
                    <h2>The Brutal Truth</h2>
                    <div class="sub-text">Your top spend was <strong>${topCatName}</strong> at ₹${d.topCatAmt.toLocaleString('en-IN')}.</div>
                    <div class="sub-text" style="margin-top:20px;">If you keep this up...</div>
                    <div class="opp-cost">₹${d.yearlyOppAmt.toLocaleString('en-IN')}/year</div>
                    <div class="sub-text" style="font-size:20px;">= ${d.oppItem}</div>
                </div>
                
                <!-- Card 3 -->
                <div class="wrapped-card card-bg-3">
                    <h2>Your Financial DNA</h2>
                    <div class="huge-number" style="font-size: 80px; margin: 0;">${d.dna ? d.dna.emoji : '🧬'}</div>
                    <div style="font-size:32px; font-weight:700; margin:10px 0;">${d.dna ? d.dna.title : 'Unknown'}</div>
                    <div class="sub-text">Only ${d.dna && d.dna.pct ? d.dna.pct : 15}% of users share your type.</div>
                </div>
                
                <!-- Card 4 -->
                <div class="wrapped-card card-bg-4">
                    <h2>Your Spending Universe</h2>
                    <div class="bar-container">
    `;
    
    d.catArray.forEach(c => {
        const pct = (c.amt / d.totalExpAmt) * 100;
        const color = colorsMap[c.cat] || colorsMap.other;
        html += `<div class="bar-segment" style="width: ${pct}%; background-color: ${color};"></div>`;
    });
    
    html += `</div><div class="cat-legend">`;
    
    d.catArray.forEach(c => {
        const pct = Math.round((c.amt / d.totalExpAmt) * 100);
        const color = colorsMap[c.cat] || colorsMap.other;
        const name = capitalize(c.customCat || c.cat);
        html += `
            <div class="legend-item">
                <div><span class="legend-dot" style="background-color: ${color};"></span>${name}</div>
                <div>₹${c.amt.toLocaleString('en-IN')} (${pct}%)</div>
            </div>
        `;
    });
    
    html += `
                    </div>
                </div>
                
                <!-- Card 5 -->
                <div class="wrapped-card card-bg-5">
                    <h2>The Verdict</h2>
                    <div class="health-score-circle" style="border-color: ${d.healthScore > 70 ? '#4ade80' : d.healthScore > 40 ? '#fbbf24' : '#ef4444'}">
                        ${d.healthScore}
                    </div>
                    <div style="font-size: 20px; font-weight: 600; margin-bottom: 20px;">Health Score</div>
                    <div class="sub-text" style="font-size: 18px; max-width: 80%;">${d.verdict}</div>
                    
                    <button class="share-btn" onclick="shareWrapped()">
                        📤 Share My Wrapped
                    </button>
                </div>
                
            </div>
            
            <button class="wrapped-nav-btn wrapped-nav-prev" onclick="navWrappedPrev()" aria-label="Previous">‹</button>
            <button class="wrapped-nav-btn wrapped-nav-next" onclick="navWrappedNext()" aria-label="Next">›</button>

            <div class="wrapped-dots" id="wrapped-dots">
                <div class="wrapped-dot active" onclick="goToWrappedCard(0)"></div>
                <div class="wrapped-dot" onclick="goToWrappedCard(1)"></div>
                <div class="wrapped-dot" onclick="goToWrappedCard(2)"></div>
                <div class="wrapped-dot" onclick="goToWrappedCard(3)"></div>
                <div class="wrapped-dot" onclick="goToWrappedCard(4)"></div>
            </div>
        </div>
    `;
    
    overlayEl.innerHTML = html;
    trackEl = document.getElementById('wrapped-track');
    
    setupSwipe();
}

window.navWrappedNext = function() {
    if (currentCard < 4) {
        currentCard++;
        updateCardPosition();
    }
};

window.navWrappedPrev = function() {
    if (currentCard > 0) {
        currentCard--;
        updateCardPosition();
    }
};

window.goToWrappedCard = function(idx) {
    if (idx >= 0 && idx <= 4) {
        currentCard = idx;
        updateCardPosition();
    }
};

function setupSwipe() {
    if (!trackEl) return;
    trackEl.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, {passive: true});
    
    trackEl.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, {passive: true});
}

function handleSwipe() {
    const minSwipe = 30;
    if (touchEndX < touchStartX - minSwipe) {
        window.navWrappedNext();
    }
    if (touchEndX > touchStartX + minSwipe) {
        window.navWrappedPrev();
    }
}

function updateCardPosition() {
    if (!trackEl) return;
    trackEl.style.transform = `translateX(-${currentCard * 100}vw)`;
    
    const dots = document.querySelectorAll('.wrapped-dot');
    dots.forEach((d, i) => {
        if (i === currentCard) d.classList.add('active');
        else d.classList.remove('active');
    });
}

window.closeWrapped = function() {
    if (overlayEl) {
        overlayEl.classList.remove('active');
        document.body.style.overflow = '';
    }
    currentCard = 0;
};

// Global keyboard handler for wrapped overlay
document.addEventListener('keydown', (e) => {
    if (!overlayEl || !overlayEl.classList.contains('active')) return;
    if (e.key === 'ArrowRight' || e.key === ' ') {
        window.navWrappedNext();
    } else if (e.key === 'ArrowLeft') {
        window.navWrappedPrev();
    } else if (e.key === 'Escape') {
        window.closeWrapped();
    }
});

function openOverlay() {
    if (!overlayEl) return;
    currentCard = 0;
    updateCardPosition();
    overlayEl.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    const counterEl = document.getElementById('wrapped-counter');
    if (counterEl && wrappedData) {
        animateValue(counterEl, 0, wrappedData.totalAmount, 1500);
    }
}

function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 4); // easeOutQuart
        const current = Math.floor(ease * (end - start));
        obj.innerHTML = '₹' + (start + current).toLocaleString('en-IN');
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.innerHTML = '₹' + end.toLocaleString('en-IN');
        }
    };
    window.requestAnimationFrame(step);
}

window.renderWrappedButton = function() {
    const slot = document.getElementById('home-wrapped-slot');
    if (!slot) return;
    
    slot.innerHTML = `
        <button class="wrapped-trigger-btn" onclick="openMoneyWrapped(0)">
            ✨ See Your Money Wrapped →
        </button>
    `;
};

document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.renderWrappedButton === 'function') {
        window.renderWrappedButton();
    }
});
