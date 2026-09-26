/* =====================================================================
   animations.js — PocketTrack Ultra-Smooth Animation & Audio Engine
   Features:
   1. Rolling Number Odometer (Smooth count-up/down for balances)
   2. Canvas Neon Confetti & Coin Particle Bursts
   3. Glassmorphism Dynamic Pointer Spotlight Follower
   4. Synthetic Web Audio API Haptic Sound Clicks (No audio files needed)
   5. Living Aurora Background Controller
   ===================================================================== */

// --- 1. Synthetic Web Audio API Haptics (Disabled by default for clean silent experience) ---
const AudioContextClass = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let soundFxEnabled = false;

function initAudioContext() {
  if (!audioCtx && AudioContextClass) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playHapticSound(type = 'click') {
  if (!soundFxEnabled) return;
  try {
    initAudioContext();
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'click') {
      // Crisp subtle UI pop
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'success') {
      // Euphoric chime (dual harmonic)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.06); // A5
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.28);
    } else if (type === 'coin') {
      // Metallic coin ping
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1318.51, now); // E6
      osc.frequency.setValueAtTime(1760, now + 0.05); // A6
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === 'delete') {
      // Soft low dismiss drop
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    }
  } catch (e) {
    // Silent fail if audio is not permitted
  }
}

// --- 2. Rolling Number Animation (Odometer Effect) ---
const _activeCounters = new Map();

function animateNumber(elementId, targetValue, prefix = '₹', suffix = '', duration = 650) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const target = parseFloat(targetValue) || 0;
  const currentText = el.textContent.replace(/[^0-9.-]+/g, '');
  const start = parseFloat(currentText) || 0;

  if (start === target) {
    el.textContent = `${prefix}${target.toLocaleString('en-IN')}${suffix}`;
    return;
  }

  if (_activeCounters.has(elementId)) {
    cancelAnimationFrame(_activeCounters.get(elementId));
  }

  const startTime = performance.now();

  function easeOutExpo(x) {
    return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
  }

  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);
    const eased = easeOutExpo(progress);
    const current = Math.round(start + (target - start) * eased);

    el.textContent = `${prefix}${current.toLocaleString('en-IN')}${suffix}`;

    if (progress < 1) {
      _activeCounters.set(elementId, requestAnimationFrame(update));
    } else {
      _activeCounters.delete(elementId);
      el.textContent = `${prefix}${target.toLocaleString('en-IN')}${suffix}`;
    }
  }

  _activeCounters.set(elementId, requestAnimationFrame(update));
}

// --- 3. Canvas Neon Particle & Coin Bursts ---
let particleCanvas = null;
let particleCtx = null;
let particles = [];
let animFrameId = null;

function initParticleCanvas() {
  if (particleCanvas) return;
  particleCanvas = document.createElement('canvas');
  particleCanvas.id = 'pt-particles-canvas';
  particleCanvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:999999;';
  document.body.appendChild(particleCanvas);
  particleCtx = particleCanvas.getContext('2d');

  function resize() {
    particleCanvas.width = window.innerWidth * window.devicePixelRatio;
    particleCanvas.height = window.innerHeight * window.devicePixelRatio;
    particleCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }
  window.addEventListener('resize', resize);
  resize();
}

function spawnCelebrationParticles(originX, originY, count = 35) {
  initParticleCanvas();
  playHapticSound('coin');

  const x = originX || window.innerWidth / 2;
  const y = originY || window.innerHeight / 2;

  const colors = ['#8b5cf6', '#ec4899', '#4ade80', '#fbbf24', '#60a5fa', '#ffffff'];
  const emojis = ['🪙', '✨', '💎', '🎉'];

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 9;
    const isEmoji = Math.random() > 0.65;

    particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      emoji: isEmoji ? emojis[Math.floor(Math.random() * emojis.length)] : null,
      size: isEmoji ? 18 : (3 + Math.random() * 5),
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 12,
      alpha: 1,
      gravity: 0.22,
      decay: 0.016 + Math.random() * 0.015
    });
  }

  if (!animFrameId) {
    animFrameId = requestAnimationFrame(renderParticles);
  }
}

function renderParticles() {
  if (!particleCtx) return;
  particleCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity;
    p.rotation += p.vRot;
    p.alpha -= p.decay;

    if (p.alpha <= 0) {
      particles.splice(i, 1);
      continue;
    }

    particleCtx.save();
    particleCtx.globalAlpha = Math.max(0, p.alpha);
    particleCtx.translate(p.x, p.y);
    particleCtx.rotate((p.rotation * Math.PI) / 180);

    if (p.emoji) {
      particleCtx.font = `${p.size}px sans-serif`;
      particleCtx.textAlign = 'center';
      particleCtx.textBaseline = 'middle';
      particleCtx.fillText(p.emoji, 0, 0);
    } else {
      particleCtx.fillStyle = p.color;
      particleCtx.shadowColor = p.color;
      particleCtx.shadowBlur = 8;
      particleCtx.beginPath();
      particleCtx.arc(0, 0, p.size, 0, Math.PI * 2);
      particleCtx.fill();
    }

    particleCtx.restore();
  }

  if (particles.length > 0) {
    animFrameId = requestAnimationFrame(renderParticles);
  } else {
    animFrameId = null;
    particleCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }
}

// --- 4. Celebratory Button Micro-Bursts ---
function initButtonMicroBursts() {
  document.querySelectorAll('.hero-action.primary, .btn.primary, .home-add-mini, #quick-composer-submit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const rect = btn.getBoundingClientRect();
      spawnCelebrationParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, 18);
    });
  });
}

// Auto-initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
  initButtonMicroBursts();
});

