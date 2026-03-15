/* ============================================================
   signup.js — StockPulse Sign Up Page
   ============================================================ */

/* ---- Floating Particles ---- */
(function initParticles() {
  var canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var W, H, particles;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function createParticles() {
    particles = Array.from({ length: 55 }, function () { return {
      x:      Math.random() * W,
      y:      Math.random() * H,
      r:      0.6 + Math.random() * 1.8,
      speedX: (Math.random() - 0.5) * 0.25,
      speedY: -0.1 - Math.random() * 0.28,
      alpha:  0.1 + Math.random() * 0.45,
      hue:    Math.random() > 0.7 ? 30 : 22,
    }; });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(function (p) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'hsla(' + p.hue + ', 100%, 58%, ' + p.alpha + ')';
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
  window.addEventListener('resize', function () { resize(); createParticles(); });
})();


/* ---- Card Parallax ---- */
(function initParallax() {
  var card = document.getElementById('signupCard');
  if (!card) return;
  var targetX = 0, targetY = 0, currentX = 0, currentY = 0;

  document.addEventListener('mousemove', function (e) {
    var cx = window.innerWidth  / 2;
    var cy = window.innerHeight / 2;
    targetX =  ((e.clientX - cx) / cx) * 3.5;
    targetY = -((e.clientY - cy) / cy) * 2.5;
  });

  (function animate() {
    currentX += (targetX - currentX) * 0.06;
    currentY += (targetY - currentY) * 0.06;
    card.style.transform = 'perspective(900px) rotateY(' + currentX + 'deg) rotateX(' + currentY + 'deg)';
    requestAnimationFrame(animate);
  })();

  document.addEventListener('mouseleave', function () { targetX = 0; targetY = 0; });
})();


/* ---- Eye Toggle Password ---- */
(function () {
  var btn   = document.getElementById('eyeBtn');
  var input = document.getElementById('password');
  var show  = document.getElementById('eyeShow');
  var hide  = document.getElementById('eyeHide');
  if (!btn) return;
  var vis = false;
  btn.addEventListener('click', function () {
    vis = !vis;
    input.type         = vis ? 'text' : 'password';
    show.style.display = vis ? 'none' : '';
    hide.style.display = vis ? ''     : 'none';
  });
})();


/* ---- Eye Toggle Confirm ---- */
(function () {
  var btn   = document.getElementById('eyeBtn2');
  var input = document.getElementById('confirm');
  var show  = document.getElementById('eyeShow2');
  var hide  = document.getElementById('eyeHide2');
  if (!btn) return;
  var vis = false;
  btn.addEventListener('click', function () {
    vis = !vis;
    input.type         = vis ? 'text' : 'password';
    show.style.display = vis ? 'none' : '';
    hide.style.display = vis ? ''     : 'none';
  });
})();


/* ---- Toast ---- */
function showToast(msg, type, duration) {
  type     = type     || 'success';
  duration = duration || 3000;
  var t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className   = 'toast ' + type + ' show';
  clearTimeout(t._tid);
  t._tid = setTimeout(function () { t.classList.remove('show'); }, duration);
}


/* ---- Error Helpers ---- */
function showErr(id, msg) {
  var el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.classList.add('visible');
}
function clearErr(id) {
  var el = document.getElementById(id);
  if (!el) return;
  el.textContent = '';
  el.classList.remove('visible');
}


/* ---- Password Strength ---- */
function calcStrength(val) {
  var score = 0;
  if (val.length >= 8)           score++;
  if (/[A-Z]/.test(val))         score++;
  if (/[0-9]/.test(val))         score++;
  if (/[^A-Za-z0-9]/.test(val))  score++;
  return score;
}

(function initStrength() {
  var input  = document.getElementById('password');
  var bar    = document.getElementById('strengthBar');
  var label  = document.getElementById('strengthLabel');
  var labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  var colors = ['', '#FF4444', '#FF8C00', '#FFCC00', '#50DC78'];
  if (!input || !bar || !label) return;

  input.addEventListener('input', function () {
    var val   = input.value;
    var level = val.length === 0 ? 0 : Math.max(1, calcStrength(val));
    bar.setAttribute('data-level', level);
    bar.style.width   = level === 0 ? '0%' : '';
    label.textContent = level === 0 ? 'Password strength' : labels[level];
    label.style.color = level === 0 ? '#7A6550' : colors[level];
  });
})();


/* ---- Validation Rules ---- */
function validateFullName(v) {
  if (!v || !v.trim())     return 'Full name is required.';
  if (v.trim().length < 2) return 'Enter your real name.';
  return null;
}
function validateUsername(v) {
  if (!v || !v.trim())     return 'Trader ID is required.';
  if (v.trim().length < 3) return 'At least 3 characters.';
  if (!/^[a-zA-Z0-9._@-]+$/.test(v.trim())) return 'Letters, numbers, . _ @ - only.';
  return null;
}
function validateEmail(v) {
  if (!v || !v.trim())     return 'Email address is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return 'Enter a valid email.';
  return null;
}
function validatePhone(v) {
  if (!v || !v.trim())     return null;
  if (!/^\+?[\d\s\-().]{7,20}$/.test(v.trim())) return 'Enter a valid phone number.';
  return null;
}
function validatePassword(v) {
  if (!v)          return 'Password is required.';
  if (v.length < 8) return 'At least 8 characters required.';
  if (calcStrength(v) < 2) return 'Too weak — add uppercase, numbers or symbols.';
  return null;
}
function validateConfirm(v, pass) {
  if (!v)        return 'Please confirm your password.';
  if (v !== pass) return 'Passwords do not match.';  // ← KEY CHECK
  return null;
}


/* ---- Card Shake ---- */
function shakeCard() {
  var card = document.getElementById('signupCard');
  if (!card) return;
  card.animate([
    { transform: 'translateX(0)'    },
    { transform: 'translateX(-6px)' },
    { transform: 'translateX(6px)'  },
    { transform: 'translateX(-4px)' },
    { transform: 'translateX(4px)'  },
    { transform: 'translateX(0)'    },
  ], { duration: 380, easing: 'ease-in-out' });
}


/* ---- Form Submit ---- */
(function initForm() {
  var form = document.getElementById('signupForm');
  if (!form) return;

  var fFullname = document.getElementById('fullname');
  var fUsername = document.getElementById('username');
  var fEmail    = document.getElementById('email');
  var fPhone    = document.getElementById('phone');
  var fPassword = document.getElementById('password');
  var fConfirm  = document.getElementById('confirm');
  var fTerms    = document.getElementById('agreeTerms');

  // Clear errors as user types
  fFullname && fFullname.addEventListener('input', function () { clearErr('fullnameErr'); });
  fUsername && fUsername.addEventListener('input', function () { clearErr('usernameErr'); });
  fEmail    && fEmail.addEventListener('input',    function () { clearErr('emailErr');    });
  fPhone    && fPhone.addEventListener('input',    function () { clearErr('phoneErr');    });
  fPassword && fPassword.addEventListener('input', function () { clearErr('passwordErr'); });
  fConfirm  && fConfirm.addEventListener('input',  function () { clearErr('confirmErr');  });

  // Also re-validate confirm when password changes
  fPassword && fPassword.addEventListener('input', function () {
    if (fConfirm && fConfirm.value) {
      var e = validateConfirm(fConfirm.value, fPassword.value);
      if (e) showErr('confirmErr', e);
      else   clearErr('confirmErr');
    }
  });

  // Blur validation
  fFullname && fFullname.addEventListener('blur', function () {
    var e = validateFullName(fFullname.value); if (e) showErr('fullnameErr', e);
  });
  fUsername && fUsername.addEventListener('blur', function () {
    var e = validateUsername(fUsername.value); if (e) showErr('usernameErr', e);
  });
  fEmail && fEmail.addEventListener('blur', function () {
    var e = validateEmail(fEmail.value); if (e) showErr('emailErr', e);
  });
  fPhone && fPhone.addEventListener('blur', function () {
    var e = validatePhone(fPhone.value); if (e) showErr('phoneErr', e);
  });
  fPassword && fPassword.addEventListener('blur', function () {
    var e = validatePassword(fPassword.value); if (e) showErr('passwordErr', e);
  });
  fConfirm && fConfirm.addEventListener('blur', function () {
    var e = validateConfirm(fConfirm.value, fPassword ? fPassword.value : '');
    if (e) showErr('confirmErr', e);
  });


  /* ---- SUBMIT ---- */
  form.addEventListener('submit', function (e) {
    e.preventDefault(); // hold — we call form.submit() manually after checks + animation

    var passVal    = fPassword ? fPassword.value : '';
    var confirmVal = fConfirm  ? fConfirm.value  : '';

    // Run all validations
    var eFullname = validateFullName(fFullname ? fFullname.value : '');
    var eUsername = validateUsername(fUsername ? fUsername.value : '');
    var eEmail    = validateEmail(fEmail       ? fEmail.value    : '');
    var ePhone    = validatePhone(fPhone       ? fPhone.value    : '');
    var ePassword = validatePassword(passVal);
    var eConfirm  = validateConfirm(confirmVal, passVal); // ← checks mismatch

    // Display all errors
    if (eFullname) showErr('fullnameErr', eFullname);
    if (eUsername) showErr('usernameErr', eUsername);
    if (eEmail)    showErr('emailErr',    eEmail);
    if (ePhone)    showErr('phoneErr',    ePhone);
    if (ePassword) showErr('passwordErr', ePassword);
    if (eConfirm)  showErr('confirmErr',  eConfirm); // ← "Passwords do not match." shows here

    var agreed   = fTerms && fTerms.checked;
    var hasError = eFullname || eUsername || eEmail || ePhone || ePassword || eConfirm;

    // ❌ BLOCK submit if any error or terms not checked
    if (hasError || !agreed) {
      shakeCard();
      if (hasError) showToast('Please fix the errors above.', 'error', 3500);
      if (!agreed)  showToast('Please agree to the Terms & Conditions.', 'error', 3500);
      return; // STOP — do not submit
    }

    // ✅ ALL VALID — animate then POST to server
    var btn     = document.getElementById('submitBtn');
    var btnText = document.getElementById('btnText');
    var spinner = document.getElementById('btnSpinner');

    btn.disabled          = true;
    btn.classList.add('loading');
    btnText.textContent   = 'Validating details...';
    btnText.style.display = '';
    spinner.style.display = '';

    setTimeout(function () {
      btnText.textContent = 'Securing your account...';
    }, 900);

    setTimeout(function () {
      btnText.textContent = 'Setting up portfolio...';
    }, 1800);

    setTimeout(function () {
      var card = document.getElementById('signupCard');
      card.style.transition = 'box-shadow 0.4s ease';
      card.style.boxShadow  = '0 0 0 2px #FF6A00, 0 40px 100px rgba(0,0,0,0.6), 0 0 60px rgba(255,106,0,0.25)';
      setTimeout(function () {
        card.style.boxShadow = '';
        form.submit(); // ✅ POST to Express server now
      }, 400);
    }, 2600);

  });

})();


/* ---- Terms Link ---- */
var termsLink = document.querySelector('.terms-link');
if (termsLink) {
  termsLink.addEventListener('click', function (e) {
    e.preventDefault();
    showToast('Terms & Conditions page coming soon.', 'success', 2500);
  });
}