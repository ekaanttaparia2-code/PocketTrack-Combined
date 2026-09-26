/* =====================================================================
   PocketTrack Website Engine — Interactive Layer & Reality Calculator
   ===================================================================== */

// --- 1. Web Audio Haptic Clicks ---
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function playSound(type = 'click') {
  try {
    if (!audioCtx && AudioCtx) audioCtx = new AudioCtx();
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;

    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(850, now);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.04);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'chime') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.setValueAtTime(880, now + 0.06);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.28);
    }
  } catch (e) {}
}

// --- 2. Interactive Future Savings Simulator (Pricing Page) ---
function updateSavingsSim() {
  const slider = document.getElementById('sim-spend-slider');
  const spendVal = document.getElementById('sim-spend-val');
  const save6mo = document.getElementById('sim-save-6mo');
  const save12mo = document.getElementById('sim-save-12mo');
  if (!slider || !spendVal) return;

  const monthlySpend = parseInt(slider.value) || 25000;
  spendVal.textContent = '₹' + monthlySpend.toLocaleString('en-IN');

  const monthlySaved = Math.round(monthlySpend * 0.18);
  if (save6mo) save6mo.textContent = '₹' + (monthlySaved * 6).toLocaleString('en-IN');
  if (save12mo) save12mo.textContent = '₹' + (monthlySaved * 12).toLocaleString('en-IN');
}

// --- 3. Interactive Money Leak Calculator (Homepage) ---
function updateLeakCalc() {
  const slider = document.getElementById('leak-income-slider');
  const incomeVal = document.getElementById('leak-income-val');
  const leak1yr = document.getElementById('leak-loss-1yr');
  const leak3yr = document.getElementById('leak-loss-3yr');
  const leak5yr = document.getElementById('leak-loss-5yr');
  if (!slider || !incomeVal) return;

  const income = parseInt(slider.value) || 45000;
  incomeVal.textContent = '₹' + income.toLocaleString('en-IN') + '/mo';

  // Average untracked leakage rate is ~14% of monthly income
  const monthlyLeak = Math.round(income * 0.14);
  if (leak1yr) leak1yr.textContent = '₹' + (monthlyLeak * 12).toLocaleString('en-IN');
  if (leak3yr) leak3yr.textContent = '₹' + (monthlyLeak * 36).toLocaleString('en-IN');
  if (leak5yr) leak5yr.textContent = '₹' + (monthlyLeak * 60).toLocaleString('en-IN');
}

// --- 4. Interactive Test-Drive Stage Simulator (Homepage Mockup) ---
let simBalance = 42850;
let simIncome = 28000;
let simSpent = 12400;

function simTestAddExpense() {
  playSound('click');
  simSpent += 350;
  simBalance -= 350;
  
  const balEl = document.getElementById('stage-sim-balance');
  const spentEl = document.getElementById('stage-sim-spent');
  const feedEl = document.getElementById('stage-sim-feed');
  
  if (balEl) balEl.textContent = '₹' + simBalance.toLocaleString('en-IN');
  if (spentEl) spentEl.textContent = '-₹' + simSpent.toLocaleString('en-IN') + ' Spent';
  
  if (feedEl) {
    feedEl.insertAdjacentHTML('afterbegin', `
      <div style="background:rgba(248,113,113,0.12);padding:10px 14px;border-radius:12px;display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;border:1px solid rgba(248,113,113,0.3);animation:popIn 0.2s ease;">
        <div><b>☕ Coffee with Rahul</b> · <i>Auto-connected to Rahul's Ledger</i></div>
        <div style="font-weight:700;color:#f87171">-₹350</div>
      </div>
    `);
  }
}

function simTestAddIncome() {
  playSound('chime');
  simIncome += 5000;
  simBalance += 5000;

  const balEl = document.getElementById('stage-sim-balance');
  const incEl = document.getElementById('stage-sim-income');
  const feedEl = document.getElementById('stage-sim-feed');
  
  if (balEl) balEl.textContent = '₹' + simBalance.toLocaleString('en-IN');
  if (incEl) incEl.textContent = '+₹' + simIncome.toLocaleString('en-IN') + ' Income';

  if (feedEl) {
    feedEl.insertAdjacentHTML('afterbegin', `
      <div style="background:rgba(52,211,153,0.12);padding:10px 14px;border-radius:12px;display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;border:1px solid rgba(52,211,153,0.3);animation:popIn 0.2s ease;">
        <div><b>💼 Freelance Gig Payment</b> · <i>Income Recorded</i></div>
        <div style="font-weight:700;color:var(--accent-green)">+₹5,000</div>
      </div>
    `);
  }
}

// --- 5. Dynamic Cursor Spotlight Lighting ---
document.addEventListener('pointermove', (e) => {
  const cards = document.querySelectorAll('.card-glass, .navbar, .btn, .calculator-box, .device-mockup-wrap');
  const x = e.clientX;
  const y = e.clientY;

  cards.forEach((card) => {
    const rect = card.getBoundingClientRect();
    if (
      x >= rect.left - 40 &&
      x <= rect.right + 40 &&
      y >= rect.top - 40 &&
      y <= rect.bottom + 40
    ) {
      card.style.setProperty('--mouse-x', `${x - rect.left}px`);
      card.style.setProperty('--mouse-y', `${y - rect.top}px`);
    }
  });
});

// --- 6. Scroll Reveal Observer ---
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .card-glass, .faq-item').forEach(el => {
  revealObserver.observe(el);
});

// --- 7. Hero Stat Counters Animation ---
function animateCounters() {
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseInt(el.dataset.count, 10);
    if (isNaN(target)) return;
    const duration = 1600;
    const start = performance.now();
    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
}

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounters();
      statsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });

document.querySelectorAll('.hero-stats, .live-active-banner, .grid-stats').forEach(el => statsObserver.observe(el));

// --- 8. Showcase Carousel Slider ---
const track = document.getElementById('showcase-track');
const dots = document.querySelectorAll('.showcase-dot');
let currentSlide = 0;
const totalSlides = dots.length || 5;
let carouselTimer = null;
let carouselPaused = false;

function goToSlide(idx) {
  currentSlide = idx;
  if (track) {
    const slideWidth = track.children[0] ? track.children[0].offsetWidth + 24 : 344;
    track.style.transform = 'translateX(' + (-idx * slideWidth) + 'px)';
  }
  dots.forEach((d, i) => d.classList.toggle('active', i === idx));
}

function nextSlide() {
  if (carouselPaused) return;
  goToSlide((currentSlide + 1) % totalSlides);
}

dots.forEach(d => {
  d.addEventListener('click', () => {
    const idx = parseInt(d.dataset.slide, 10);
    goToSlide(idx);
    resetCarouselTimer();
  });
});

function resetCarouselTimer() {
  if (carouselTimer) clearInterval(carouselTimer);
  carouselTimer = setInterval(nextSlide, 4000);
}

const carouselEl = document.getElementById('showcase-carousel');
if (carouselEl) {
  carouselEl.addEventListener('mouseenter', () => { carouselPaused = true; });
  carouselEl.addEventListener('mouseleave', () => { carouselPaused = false; });
  carouselEl.addEventListener('touchstart', () => { carouselPaused = true; }, { passive: true });
  carouselEl.addEventListener('touchend', () => {
    setTimeout(() => { carouselPaused = false; }, 2000);
  }, { passive: true });
  resetCarouselTimer();
}

// --- 9. Steps Vertical Line Fill on Scroll ---
const stepsLineFill = document.getElementById('steps-line-fill');
const howSection = document.getElementById('how-it-works');
function updateStepsLine() {
  if (!stepsLineFill || !howSection) return;
  const rect = howSection.getBoundingClientRect();
  const vh = window.innerHeight;
  const sectionHeight = rect.height;
  const scrolled = -rect.top;
  const start = vh * 0.3;
  const end = sectionHeight - vh * 0.3;
  const progress = Math.max(0, Math.min(1, (scrolled - start) / (end - start)));
  stepsLineFill.style.height = (progress * 100) + '%';
}
window.addEventListener('scroll', updateStepsLine, { passive: true });

// (3D Perspective tilt removed for rock-solid stability)

// --- 11. CTA Celebratory Emoji Particle Burst ---
document.querySelectorAll('.btn-primary, .cta-btn-glow').forEach(btn => {
  btn.addEventListener('mouseenter', () => {
    for (let i = 0; i < 7; i++) {
      const p = document.createElement('span');
      p.textContent = ['✨', '💜', '⚡', '🪙', '🎉'][Math.floor(Math.random() * 5)];
      p.style.cssText = 'position:fixed;font-size:14px;pointer-events:none;z-index:99999;transition:all 0.8s cubic-bezier(.25,.8,.25,1);opacity:1';
      const rect = btn.getBoundingClientRect();
      p.style.left = (rect.left + rect.width * Math.random()) + 'px';
      p.style.top = (rect.top + rect.height * Math.random()) + 'px';
      document.body.appendChild(p);
      requestAnimationFrame(() => {
        p.style.transform = 'translateY(-' + (50 + Math.random() * 40) + 'px) translateX(' + (Math.random() * 60 - 30) + 'px) scale(0.3)';
        p.style.opacity = '0';
      });
      setTimeout(() => p.remove(), 850);
    }
  });
});

// --- 12. Smart App Launcher Link Resolver (Routes to app.html on all hosting environments) ---
function launchPocketTrackApp(event) {
  if (event && event.preventDefault) {
    event.preventDefault();
  }
  
  var loc = window.location;
  
  // 1. Local file protocol (double click file:///...)
  if (loc.protocol === 'file:') {
    var p = loc.pathname;
    if (p.indexOf('/website/') !== -1 || p.indexOf('\\website\\') !== -1) {
      loc.href = '../app.html';
    } else {
      loc.href = 'app.html';
    }
    return false;
  }
  
  // 2. Web hosting (GitHub Pages, Netlify, Vercel, Firebase, Localhost)
  var pathname = loc.pathname || '/';
  
  // Check if we are inside a "/website" subfolder
  var websiteIdx = pathname.indexOf('/website');
  if (websiteIdx !== -1) {
    var prefix = pathname.substring(0, websiteIdx);
    loc.href = (prefix ? prefix : '') + '/app.html';
    return false;
  }
  
  // If at root landing page
  var repoPath = pathname.substring(0, pathname.lastIndexOf('/'));
  loc.href = (repoPath ? repoPath : '') + '/app.html';
  return false;
}
window.launchPocketTrackApp = launchPocketTrackApp;

function bindAppLaunchLinks() {
  document.querySelectorAll('a[href="../index.html"], a[href="index.html"].btn, a[href*="index.html"].btn, a.nav-cta, a.cta-btn-glow').forEach(link => {
    const text = (link.textContent || '').toLowerCase();
    const href = link.getAttribute('href') || '';
    if (href === '../index.html' || text.includes('launch') || text.includes('open') || text.includes('get started') || text.includes('starter') || text.includes('pro plus') || text.includes('forever')) {
      link.addEventListener('click', launchPocketTrackApp);
    }
  });
}

// --- 14. Scroll-Driven Reveal Observer ---
function initScrollReveals() {
  if (!('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.card-glass, .reality-section, .stage-section, .testimonial-card, .cta-banner, .feature-detail-card, .calculator-box').forEach(el => {
    el.classList.add('reveal-on-scroll');
    observer.observe(el);
  });
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  initScrollReveals();
  updateSavingsSim();
  updateLeakCalc();
  updateStepsLine();
  bindAppLaunchLinks();
});


