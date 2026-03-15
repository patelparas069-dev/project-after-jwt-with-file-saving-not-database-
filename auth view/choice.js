/* ============================================================
   choice.js — StockPulse Welcome / Choice Page
   Features:
     - Floating particle canvas
     - Smooth card parallax on mouse move
     - Hero circle continuous float (CSS handles it)
     - Button ripple effect on click
     - Toast for help / terms / privacy links
     - Animated stat counters on page load
   ============================================================ */

/* ---- Floating Particles ---- */
(function initParticles() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function createParticles() {
    particles = Array.from({ length: 55 }, () => ({
      x:      Math.random() * W,
      y:      Math.random() * H,
      r:      0.6 + Math.random() * 1.8,
      speedX: (Math.random() - 0.5) * 0.25,
      speedY: -0.1 - Math.random() * 0.28,
      alpha:  0.1 + Math.random() * 0.45,
      hue:    Math.random() > 0.7 ? 30 : 22,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 100%, 58%, ${p.alpha})`;
      ctx.fill();
      p.x += p.speedX;
      p.y += p.speedY;
      p.alpha -= 0.0008;
      if (p.alpha <= 0.02 || p.y < -10) {
        p.x     = Math.random() * W;
        p.y     = H + 5;
        p.alpha = 0.15 + Math.random() * 0.4;
        p.speedY = -0.1 - Math.random() * 0.28;
      }
    });
    requestAnimationFrame(draw);
  }

  resize();
  createParticles();
  draw();
  window.addEventListener('resize', () => { resize(); createParticles(); });
})();


/* ---- Card Parallax ---- */
(function initParallax() {
  const card = document.getElementById('choiceCard');
  if (!card) return;
  let targetX = 0, targetY = 0, currentX = 0, currentY = 0;

  document.addEventListener('mousemove', e => {
    const cx = window.innerWidth  / 2;
    const cy = window.innerHeight / 2;
    targetX =  ((e.clientX - cx) / cx) * 3.5;
    targetY = -((e.clientY - cy) / cy) * 2.5;
  });

  (function animate() {
    currentX += (targetX - currentX) * 0.06;
    currentY += (targetY - currentY) * 0.06;
    card.style.transform = `perspective(900px) rotateY(${currentX}deg) rotateX(${currentY}deg)`;
    requestAnimationFrame(animate);
  })();

  document.addEventListener('mouseleave', () => { targetX = 0; targetY = 0; });
})();


/* ---- Toast ---- */
function showToast(msg, type = 'success', duration = 3000) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className   = `toast ${type} show`;
  clearTimeout(t._tid);
  t._tid = setTimeout(() => t.classList.remove('show'), duration);
}


/* ---- Button Ripple ---- */
function addRipple(btn) {
  btn.addEventListener('click', function (e) {
    const existing = this.querySelector('.ripple-effect');
    if (existing) existing.remove();

    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.8;
    const x    = e.clientX - rect.left;
    const y    = e.clientY - rect.top;

    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    Object.assign(ripple.style, {
      position:     'absolute',
      width:        size + 'px',
      height:       size + 'px',
      borderRadius: '50%',
      background:   'rgba(255,255,255,0.15)',
      transform:    'translate(-50%,-50%) scale(0)',
      left:         x + 'px',
      top:          y + 'px',
      pointerEvents:'none',
      animation:    'rippleOut 0.55s ease-out forwards',
    });

    // Inject keyframes once
    if (!document.getElementById('ripple-kf')) {
      const s = document.createElement('style');
      s.id = 'ripple-kf';
      s.textContent = `
        @keyframes rippleOut {
          to { transform: translate(-50%,-50%) scale(1); opacity: 0; }
        }
      `;
      document.head.appendChild(s);
    }

    this.style.position = 'relative';
    this.style.overflow = 'hidden';
    this.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
}

const signupBtn = document.getElementById('signupBtn');
const loginBtn  = document.getElementById('loginBtn');
if (signupBtn) addRipple(signupBtn);
if (loginBtn)  addRipple(loginBtn);


/* ---- Animated Stat Counters ---- */
(function initCounters() {
  const targets = [
    { el: document.querySelector('.stats-row .stat-item:nth-child(1) .stat-value'), end: 200, suffix: 'K+',  decimals: 0 },
    { el: document.querySelector('.stats-row .stat-item:nth-child(3) .stat-value'), end: 4.2, suffix: 'B',   decimals: 1, prefix: '$' },
    { el: document.querySelector('.stats-row .stat-item:nth-child(5) .stat-value'), end: 99.9, suffix: '%',  decimals: 1 },
  ];

  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  targets.forEach(({ el, end, suffix, decimals, prefix = '' }) => {
    if (!el) return;
    const duration = 1600;
    const startTime = performance.now() + 400; // slight delay

    function tick(now) {
      const elapsed = now - startTime;
      if (elapsed < 0) { requestAnimationFrame(tick); return; }
      const progress = Math.min(elapsed / duration, 1);
      const current  = end * easeOut(progress);
      el.textContent = prefix + current.toFixed(decimals) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
})();


/* ---- Link handlers ---- */
document.getElementById('helpLink')?.addEventListener('click', e => {
  e.preventDefault();
  showToast('Support: support@stockpulse.io', 'success', 3000);
});

document.getElementById('termsLink')?.addEventListener('click', e => {
  e.preventDefault();
  showToast('Terms & Conditions page coming soon.', 'success', 2500);
});

document.getElementById('privacyLink')?.addEventListener('click', e => {
  e.preventDefault();
  showToast('Privacy Policy page coming soon.', 'success', 2500);
});