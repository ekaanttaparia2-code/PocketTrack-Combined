'use strict';

// Inject CSS
(function() {
    const s = document.createElement('style');
    s.textContent = `
        .dna-card {
            position: relative;
            background: rgba(20, 20, 25, 0.6);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-radius: 20px;
            padding: 18px 16px;
            margin: 0;
            color: #fff;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            border: 1px solid var(--dna-border-color, rgba(255, 255, 255, 0.1));
            overflow: hidden;
            animation: dnaGlow 4s ease-in-out infinite alternate;
        }
        @keyframes dnaGlow {
            0% { box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2), 0 0 10px var(--dna-glow-start, rgba(155, 107, 255, 0.2)); }
            100% { box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2), 0 0 25px var(--dna-glow-end, rgba(155, 107, 255, 0.5)); }
        }
        .dna-header {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 12px;
        }
        .dna-emoji {
            font-size: 48px;
            line-height: 1;
        }
        .dna-title {
            font-size: 20px;
            font-weight: 700;
            margin: 0;
            background: linear-gradient(135deg, #fff, rgba(255, 255, 255, 0.7));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .dna-tagline {
            font-size: 14px;
            font-style: italic;
            color: rgba(255, 255, 255, 0.8);
            margin: 0 0 20px 0;
            line-height: 1.4;
        }
        .dna-metrics {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-bottom: 20px;
            background: rgba(0, 0, 0, 0.2);
            padding: 16px;
            border-radius: 12px;
        }
        .dna-metric {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .dna-metric-label {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.7);
            width: 80px;
            flex-shrink: 0;
        }
        .dna-metric-bar-bg {
            flex-grow: 1;
            height: 6px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
            overflow: hidden;
        }
        .dna-metric-bar-fill {
            height: 100%;
            border-radius: 3px;
            background: var(--dna-color);
            transition: width 1s ease-out;
        }
        .dna-metric-val {
            font-size: 12px;
            font-weight: 600;
            width: 40px;
            text-align: right;
        }
        .dna-tips {
            margin: 0;
            padding: 0 0 0 20px;
            list-style-type: none;
        }
        .dna-tips li {
            font-size: 13px;
            color: rgba(255, 255, 255, 0.9);
            margin-bottom: 8px;
            position: relative;
            line-height: 1.5;
        }
        .dna-tips li::before {
            content: "•";
            color: var(--dna-color);
            font-weight: bold;
            font-size: 20px;
            position: absolute;
            left: -16px;
            top: -4px;
        }
        .dna-footer {
            margin-top: 16px;
            font-size: 11px;
            color: rgba(255, 255, 255, 0.5);
            text-align: right;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .dna-share-btn {
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: #fff;
            padding: 6px 12px;
            border-radius: 12px;
            font-size: 11px;
            cursor: pointer;
            transition: background 0.2s;
        }
        .dna-share-btn:hover {
            background: rgba(255, 255, 255, 0.2);
        }
    `;
    if (typeof document !== 'undefined') (document.head || document.documentElement || document.body)?.appendChild(s);
})();

const DNA_TYPES = {
    AWAKENING: {
        id: 'AWAKENING',
        emoji: '🌱',
        title: 'The Awakening',
        tagline: 'You just did what 63% of Indian youth never do — you started paying attention.',
        color: '#4ade80', // Green
        tips: [
            'Log every single expense for the next 7 days, even the small ones.',
            "Don't worry about budgeting yet, just build the habit of tracking.",
            'Review your entries at the end of the week.'
        ]
    },
    PEOPLES_BANK: {
        id: 'PEOPLES_BANK',
        emoji: '🤹',
        title: "The People's Bank",
        tagline: "You're everyone's ATM. Let's make sure they pay it back.",
        color: '#06b6d4', // Cyan
        tips: [
            'Use the notes field to track who owes you what.',
            'Set a hard monthly limit for "Friends" category expenses.',
            "Don't be afraid to ask for your money back. It's yours."
        ]
    },
    STRATEGIST: {
        id: 'STRATEGIST',
        emoji: '🧠',
        title: 'The Strategist',
        tagline: 'You treat money like a chess game. Always 3 moves ahead.',
        color: '#a855f7', // Purple
        tips: [
            "You're doing great! Look into optimizing your investments next.",
            'Ensure your emergency fund is fully stocked (6 months of expenses).',
            "Allow yourself a \"fun money\" budget so you don't burn out."
        ]
    },
    SOCIAL_SPENDER: {
        id: 'SOCIAL_SPENDER',
        emoji: '🎉',
        title: 'The Social Spender',
        tagline: 'Everyone loves hanging out with you — because you always pay.',
        color: '#f43f5e', // Coral / Red
        tips: [
            'Suggest free or low-cost hangouts (parks, game nights at home).',
            'Eat before you go out to reduce restaurant spending.',
            'Calculate how many hours of work a night out costs you.'
        ]
    },
    ROLLERCOASTER: {
        id: 'ROLLERCOASTER',
        emoji: '🎢',
        title: 'The Rollercoaster',
        tagline: 'You earn well. Your money just has no seatbelt.',
        color: '#f59e0b', // Amber
        tips: [
            'Automate your savings the day you get paid.',
            'Implement the 24-hour rule for non-essential purchases.',
            'Try to establish a baseline daily spend to smooth out the drops.'
        ]
    },
    INVISIBLE_LEAKER: {
        id: 'INVISIBLE_LEAKER',
        emoji: '🕳️',
        title: 'The Invisible Leaker',
        tagline: "You don't have a spending problem. You have a visibility problem.",
        color: '#9f1239', // Dark Red
        tips: [
            "Review your recurring subscriptions. Cancel what you don't use.",
            'Try cash stuffing for a week to feel the money leaving.',
            'Those ₹100 purchases add up. Aim for 2 "no-spend" days a week.'
        ]
    }
};

function computeFinancialDNA() {
    let entries = [];
    if (typeof mainEntries === 'function') {
        entries = mainEntries();
    }
    
    if (!entries || entries.length === 0) {
        return { 
            ...DNA_TYPES.AWAKENING, 
            metrics: { savingsRatio: 0, socialSpendPct: 0, impulseRate: 0, totalIncome: 0, totalExpenses: 0, entryCount: 0 } 
        };
    }

    let totalIncome = 0;
    let totalExpenses = 0;
    let expenseCount = 0;
    let expensesUnder500 = 0;
    let expensesUnder300 = 0;
    let socialSpend = 0;
    let friendsSpend = 0;

    const dailyExpenses = {};

    entries.forEach(e => {
        const amt = parseFloat(e.amt) || 0;
        if (e.type === 'income') {
            totalIncome += amt;
        } else if (e.type === 'expense') {
            totalExpenses += amt;
            expenseCount++;

            if (amt < 500) expensesUnder500++;
            if (amt < 300) expensesUnder300++;

            const cat = (e.cat || '').toLowerCase();
            if (cat === 'food' || cat === 'friends' || cat === 'entertainment') {
                socialSpend += amt;
            }
            if (cat === 'friends') {
                friendsSpend += amt;
            }

            if (e.date) {
                dailyExpenses[e.date] = (dailyExpenses[e.date] || 0) + amt;
            }
        }
    });

    // Calculate metrics
    const savingsRatio = totalIncome > 0 ? (totalIncome - totalExpenses) / totalIncome : 0;
    const impulseRate = expenseCount > 0 ? expensesUnder500 / expenseCount : 0;
    const socialSpendRatio = totalExpenses > 0 ? socialSpend / totalExpenses : 0;
    const smallTxnRatio = expenseCount > 0 ? expensesUnder300 / expenseCount : 0;
    const friendsRatio = totalExpenses > 0 ? friendsSpend / totalExpenses : 0;

    // Calculate Spending Variance (Coefficient of Variation)
    let varianceCV = 0;
    const days = Object.values(dailyExpenses);
    if (days.length > 1) {
        const mean = days.reduce((a, b) => a + b, 0) / days.length;
        if (mean > 0) {
            const sumSqDiff = days.reduce((a, b) => a + Math.pow(b - mean, 2), 0);
            const stdDev = Math.sqrt(sumSqDiff / days.length);
            varianceCV = stdDev / mean;
        }
    }

    let dnaObj = DNA_TYPES.STRATEGIST; // Default fallback

    if (entries.length < 10) {
        dnaObj = DNA_TYPES.AWAKENING;
    } else if (friendsRatio > 0.25) {
        dnaObj = DNA_TYPES.PEOPLES_BANK;
    } else if (savingsRatio > 0.4 && impulseRate < 0.3) {
        dnaObj = DNA_TYPES.STRATEGIST;
    } else if (socialSpendRatio > 0.45) {
        dnaObj = DNA_TYPES.SOCIAL_SPENDER;
    } else if (varianceCV > 1.5) {
        dnaObj = DNA_TYPES.ROLLERCOASTER;
    } else if (smallTxnRatio > 0.6) {
        dnaObj = DNA_TYPES.INVISIBLE_LEAKER;
    }

    return {
        ...dnaObj,
        metrics: {
            savingsRatio: isNaN(savingsRatio) ? 0 : Math.max(0, Math.min(100, savingsRatio * 100)),
            socialSpendPct: isNaN(socialSpendRatio) ? 0 : Math.max(0, Math.min(100, socialSpendRatio * 100)),
            impulseRate: isNaN(impulseRate) ? 0 : Math.max(0, Math.min(100, impulseRate * 100)),
            totalIncome,
            totalExpenses,
            entryCount: entries.length
        }
    };
}

function renderFinancialDNACard() {
    const slot = document.getElementById('home-dna-slot');
    if (!slot) return;

    const dna = computeFinancialDNA();
    if (!dna) return;

    const m = dna.metrics;
    
    // Create color variants for styles
    const rgbMatch = dna.color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    let r=255, g=255, b=255;
    if (rgbMatch) {
        r = parseInt(rgbMatch[1], 16);
        g = parseInt(rgbMatch[2], 16);
        b = parseInt(rgbMatch[3], 16);
    }
    
    slot.innerHTML = `
        <div class="dna-card" style="
            --dna-color: ${dna.color}; 
            --dna-border-color: rgba(${r}, ${g}, ${b}, 0.2);
            --dna-glow-start: rgba(${r}, ${g}, ${b}, 0.15);
            --dna-glow-end: rgba(${r}, ${g}, ${b}, 0.4);
        ">
            <div class="dna-header">
                <div class="dna-emoji">${dna.emoji}</div>
                <div>
                    <h3 class="dna-title">${dna.title}</h3>
                </div>
            </div>
            <p class="dna-tagline">"${dna.tagline}"</p>
            
            <div class="dna-metrics">
                <div class="dna-metric">
                    <div class="dna-metric-label">Savings Rate</div>
                    <div class="dna-metric-bar-bg">
                        <div class="dna-metric-bar-fill" style="width: ${m.savingsRatio.toFixed(1)}%;"></div>
                    </div>
                    <div class="dna-metric-val">${m.savingsRatio.toFixed(0)}%</div>
                </div>
                <div class="dna-metric">
                    <div class="dna-metric-label">Social Spend</div>
                    <div class="dna-metric-bar-bg">
                        <div class="dna-metric-bar-fill" style="width: ${m.socialSpendPct.toFixed(1)}%;"></div>
                    </div>
                    <div class="dna-metric-val">${m.socialSpendPct.toFixed(0)}%</div>
                </div>
                <div class="dna-metric">
                    <div class="dna-metric-label">Impulse Rate</div>
                    <div class="dna-metric-bar-bg">
                        <div class="dna-metric-bar-fill" style="width: ${m.impulseRate.toFixed(1)}%;"></div>
                    </div>
                    <div class="dna-metric-val">${m.impulseRate.toFixed(0)}%</div>
                </div>
            </div>

            <ul class="dna-tips">
                ${dna.tips.map(tip => `<li>${tip}</li>`).join('')}
            </ul>

            <div class="dna-footer">
                <span>Based on ${m.entryCount} entries</span>
                <button class="dna-share-btn" onclick="shareFinancialDNA()">Share ↗</button>
            </div>
        </div>
    `;
}

function getFinancialDNAShareText() {
    const dna = computeFinancialDNA();
    const m = dna.metrics;
    return `🧬 My Financial DNA: ${dna.emoji} ${dna.title}\n"${dna.tagline}"\n📊 Savings Rate: ${m.savingsRatio.toFixed(0)}% | Social Spend: ${m.socialSpendPct.toFixed(0)}% | Impulse Rate: ${m.impulseRate.toFixed(0)}%\nDiscover yours → PocketTrack`;
}

window.shareFinancialDNA = function() {
    const text = getFinancialDNAShareText();
    if (navigator.share) {
        navigator.share({
            title: 'My Financial DNA',
            text: text
        }).catch(err => console.log('Share failed', err));
    } else {
        navigator.clipboard.writeText(text).then(() => {
            if (typeof toast === 'function') {
                toast('Copied to clipboard!', 'success');
            }
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            if (typeof toast === 'function') toast('Could not copy to clipboard', 'error');
        });
    }
};

// Auto-render logic
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(renderFinancialDNACard, 800));
} else {
    setTimeout(renderFinancialDNACard, 800);
}

// Optional hook for main app to re-render
window.updateFinancialDNA = renderFinancialDNACard;
