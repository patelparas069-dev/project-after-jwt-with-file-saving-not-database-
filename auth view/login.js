/* ============================================================
   func.js — StockPulse Login
   - Floating particles
   - Card parallax
   - Password eye toggle
   - Form validation (blocks submit ONLY on error)
   - Loading state on valid submit (then form POSTs naturally)
   - Toast notifications
   ============================================================ */

/* ---- Floating Particle Canvas ---- */
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
      x:       Math.random() * W,
      y:       Math.random() * H,
      r:       0.6 + Math.random() * 1.8,
      speedX:  (Math.random() - 0.5) * 0.25,
      speedY:  -0.1 - Math.random() * 0.28,
      alpha:   0.1 + Math.random() * 0.45,
      hue:     Math.random() > 0.7 ? 30 : 22,
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
        p.x      = Math.random() * W;
        p.y      = H + 5;
        p.alpha  = 0.15 + Math.random() * 0.4;
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
  const card = document.getElementById('loginCard');
  if (!card) return;
  let targetX = 0, targetY = 0, currentX = 0, currentY = 0;

  document.addEventListener('mousemove', e => {
    const cx = window.innerWidth  / 2;
    const cy = window.innerHeight / 2;
    targetX =  ((e.clientX - cx) / cx) * 4;
    targetY = -((e.clientY - cy) / cy) * 3;
  });

  (function animate() {
    currentX += (targetX - currentX) * 0.06;
    currentY += (targetY - currentY) * 0.06;
    card.style.transform = `perspective(900px) rotateY(${currentX}deg) rotateX(${currentY}deg)`;
    requestAnimationFrame(animate);
  })();

  document.addEventListener('mouseleave', () => { targetX = 0; targetY = 0; });
})();


/* ---- Password Eye Toggle ---- */
(function initEye() {
  const btn   = document.getElementById('eyeBtn');
  const input = document.getElementById('password');
  const show  = document.getElementById('eyeShow');
  const hide  = document.getElementById('eyeHide');
  if (!btn) return;

  let visible = false;
  btn.addEventListener('click', () => {
    visible     = !visible;
    input.type  = visible ? 'text'  : 'password';
    show.style.display = visible ? 'none' : '';
    hide.style.display = visible ? ''     : 'none';
  });
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


/* ---- Validation Helpers ---- */
function showError(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.classList.add('visible');
}
function clearError(el) {
  if (!el) return;
  el.textContent = '';
  el.classList.remove('visible');
}

function validateUsername(val) {
  if (!val || !val.trim())      return 'Username is required.';
  if (val.trim().length < 3)    return 'At least 3 characters required.';
  if (!/^[a-zA-Z0-9._@-]+$/.test(val.trim())) return 'Invalid characters in username.';
  return null;
}
function validatePassword(val) {
  if (!val)          return 'Password is required.';
  if (val.length < 6) return 'Password must be at least 6 characters.';
  return null;
}
function validateEmail(val) {
  if (!val || !val.trim()) return null; // optional field
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) return 'Enter a valid email address.';
  return null;
}


/* ---- Form Submit ---- */
(function initForm() {
  const form         = document.getElementById('loginForm');
  if (!form) return;

  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const emailInput    = document.getElementById('email');
  const usernameErr   = document.getElementById('usernameErr');
  const passwordErr   = document.getElementById('passwordErr');
  const emailErr      = document.getElementById('emailErr');

  // Clear errors live as user types
  usernameInput.addEventListener('input', () => clearError(usernameErr));
  passwordInput.addEventListener('input', () => clearError(passwordErr));
  emailInput.addEventListener('input',    () => clearError(emailErr));

  // Validate on blur (when user leaves field)
  usernameInput.addEventListener('blur', () => {
    const err = validateUsername(usernameInput.value);
    if (err) showError(usernameErr, err);
  });
  passwordInput.addEventListener('blur', () => {
    const err = validatePassword(passwordInput.value);
    if (err) showError(passwordErr, err);
  });
  emailInput.addEventListener('blur', () => {
    const err = validateEmail(emailInput.value);
    if (err) showError(emailErr, err);
  });

  form.addEventListener('submit', function (e) {
    const uErr = validateUsername(usernameInput.value);
    const pErr = validatePassword(passwordInput.value);
    const eErr = validateEmail(emailInput.value);

    // Show all errors at once
    if (uErr) showError(usernameErr, uErr);
    if (pErr) showError(passwordErr, pErr);
    if (eErr) showError(emailErr, eErr);

    // If ANY error — block submit, shake card, show toast
    if (uErr || pErr || eErr) {
      e.preventDefault(); // ← blocks form POST only on failure
      showToast('Please fix the errors above.', 'error');
      const card = document.getElementById('loginCard');
      card.animate([
        { transform: 'translateX(0)' },
        { transform: 'translateX(-6px)' },
        { transform: 'translateX(6px)' },
        { transform: 'translateX(-4px)' },
        { transform: 'translateX(4px)' },
        { transform: 'translateX(0)' },
      ], { duration: 380, easing: 'ease-in-out' });
      return;
    }

    // ✅ Validation passed — show animation first, then POST to server
    e.preventDefault(); // hold the submit temporarily for animation

    const btn     = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const spinner = document.getElementById('btnSpinner');

    const steps = [
      { delay: 0,    msg: 'Authenticating...'        },
      { delay: 900,  msg: 'Verifying credentials...' },
      { delay: 1800, msg: 'Loading your portfolio...' },
    ];

    // Show spinner immediately
    btn.classList.add('loading');
    btn.disabled          = true;
    btnText.style.display = 'none';
    spinner.style.display = '';

    // Cycle through messages
    steps.forEach(({ delay, msg }) => {
      setTimeout(() => {
        btnText.style.display = '';
        btnText.textContent   = msg;
        spinner.style.display = '';
      }, delay);
    });

    // Flash card border orange then actually submit
    setTimeout(() => {
      const card = document.getElementById('loginCard');
      card.style.transition = 'box-shadow 0.4s ease';
      card.style.boxShadow  = '0 0 0 2px #FF6A00, 0 40px 100px rgba(0,0,0,0.6), 0 0 60px rgba(255,106,0,0.25)';

      setTimeout(() => {
        card.style.boxShadow = '';
        form.submit(); // ← actually POST to server now
      }, 400);

    }, 2600);
  });
})();


/* ---- Forgot Password Link ---- */
(function () {
  const link = document.getElementById('forgotLink');
  if (!link) return;
  link.addEventListener('click', e => {
    e.preventDefault();
    showToast('Password reset link sent to your registered email.', 'success', 3200);
  });
})();


/* ---- Sign Up Link — navigate to signup page ---- */
(function () {
  const link = document.getElementById('signupLink');
  if (!link) return;
  link.addEventListener('click', e => {
    e.preventDefault();
    window.location.href = '/sign';
  });
})();


/* ---- Help Link ---- */
(function () {
  const link = document.getElementById('helpLink');
  if (!link) return;
  link.addEventListener('click', e => {
    e.preventDefault();
    showToast('Support: support@stockpulse.io', 'success', 3000);
  });
})();


/* ---- URL Query Error Handler ---- */
/* Handles:
     ?error=wrongpassword  → red error under password field
     ?error=wrongusername  → red error under username field
     ?error=notfound       → red error under username field
     ?error=blocked        → toast only (too many attempts)
     no query              → nothing, page loads clean
   ----------------------------------------------------------------
   In your Express route redirect like:
     res.redirect('/login?error=wrongpassword')
     res.redirect('/login?error=wrongusername')
   ---------------------------------------------------------------- */
(function handleQueryError() {
  const params = new URLSearchParams(window.location.search);
  const error  = params.get('error');

  // No query param — do nothing, clean page load
  if (!error) return;

  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const usernameErr   = document.getElementById('usernameErr');
  const passwordErr   = document.getElementById('passwordErr');
  const card          = document.getElementById('loginCard');

  // Map every possible error value to a field + message
  const errorMap = {
    wrongpassword:   { field: 'password', el: passwordErr,  msg: 'Incorrect password. Please try again.'         },
    wrong_password:  { field: 'password', el: passwordErr,  msg: 'Incorrect password. Please try again.'         },
    wrongusername:   { field: 'username', el: usernameErr,  msg: 'No account found with that username.'          },
    wrong_username:  { field: 'username', el: usernameErr,  msg: 'No account found with that username.'          },
    notfound:        { field: 'username', el: usernameErr,  msg: 'No account found with that username.'          },
    not_found:       { field: 'username', el: usernameErr,  msg: 'No account found with that username.'          },
    invalid:         { field: 'password', el: passwordErr,  msg: 'Invalid username or password.'                 },
    invalid_credentials: { field: 'password', el: passwordErr, msg: 'Invalid username or password.'             },
    blocked:         { field: null,       el: null,         msg: 'Too many failed attempts. Try again later.'    },
    expired:         { field: null,       el: null,         msg: 'Your session has expired. Please log in again.'},
  };

  const match = errorMap[error.toLowerCase()];

  if (match) {
    // Show inline field error if applicable
    if (match.el) {
      showError(match.el, match.msg);

      // Highlight the relevant input field
      const input = match.field === 'password' ? passwordInput : usernameInput;
      if (input) {
        input.classList.add('error');
        // Focus the problem field after a short delay
        setTimeout(() => input.focus(), 100);
        // Clear error when user starts typing
        input.addEventListener('input', () => {
          input.classList.remove('error');
          clearError(match.el);
        }, { once: true });
      }
    }

    // Always show toast for server errors
    showToast(match.msg, 'error', 4500);

    // Shake the card
    if (card) {
      setTimeout(() => {
        card.animate([
          { transform: 'translateX(0)'   },
          { transform: 'translateX(-7px)'},
          { transform: 'translateX(7px)' },
          { transform: 'translateX(-5px)'},
          { transform: 'translateX(5px)' },
          { transform: 'translateX(0)'   },
        ], { duration: 420, easing: 'ease-in-out' });
      }, 150);
    }

  } else {
    // Unknown error value — show generic message
    showToast('Something went wrong. Please try again.', 'error', 4000);
  }

  // ✅ Clean the URL so error doesn't show again on refresh
  window.history.replaceState({}, '', window.location.pathname);

})();