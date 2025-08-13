// public/scripts/auth.js

document.addEventListener('DOMContentLoaded', () => {
  // ====== SIGNUP FORM ======
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('name')?.value;
      const email = document.getElementById('email')?.value;
      const password = document.getElementById('password')?.value;
      const campus = document.getElementById('campus')?.value;
      const errorEl = document.getElementById('signupError');

      try {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, campus })
        });
        const data = await res.json();

        if (res.ok) {
          // Show message or redirect to a "check your email" page if you like
          alert('Signup successful! Please verify your email before logging in.');
          window.location.href = '/login.html';
        } else {
          if (errorEl) {
            errorEl.textContent = data.msg || 'Signup failed.';
            errorEl.classList.remove('hidden');
          } else {
            alert(data.msg || 'Signup failed.');
          }
        }
      } catch (err) {
        if (errorEl) {
          errorEl.textContent = 'An error occurred. Please try again.';
          errorEl.classList.remove('hidden');
        } else {
          alert('An error occurred. Please try again.');
        }
      }
    });
  }

  // ====== LOGIN FORM ======
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email')?.value;
      const password = document.getElementById('password')?.value;
      const loginError = document.getElementById('loginError');

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (res.ok) {
          window.location.href = '/dashboard.html';
        } else {
          const msg = data.msg || 'Login failed.';
          if (loginError) {
            loginError.textContent = msg;
            loginError.classList.remove('hidden');
          } else {
            alert(msg);
          }
        }
      } catch (err) {
        if (loginError) {
          loginError.textContent = 'An error occurred. Please try again.';
          loginError.classList.remove('hidden');
        } else {
          alert('An error occurred. Please try again.');
        }
      }
    });
  }

  // ====== FORGOT PASSWORD FORM ======
  const forgotPasswordForm = document.getElementById('forgot-password-form');
  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email')?.value;
      const messageContainer = document.getElementById('message-container');

      try {
        const res = await fetch('/api/auth/forgotpassword', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();

        if (messageContainer) {
          messageContainer.innerHTML = `<div class="bg-green-100 text-green-700 p-4 rounded">${data.msg}</div>`;
          messageContainer.classList.remove('hidden');
        } else {
          alert(data.msg);
        }
        forgotPasswordForm.reset();
      } catch (err) {
        if (messageContainer) {
          messageContainer.innerHTML = `<div class="bg-red-100 text-red-700 p-4 rounded">An error occurred. Please try again.</div>`;
          messageContainer.classList.remove('hidden');
        } else {
          alert('An error occurred. Please try again.');
        }
      }
    });
  }

  // ====== RESET PASSWORD FORM ======
  const resetPasswordForm = document.getElementById('reset-password-form');
  if (resetPasswordForm) {
    resetPasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const password = document.getElementById('password')?.value;
      const confirmPassword = document.getElementById('confirmPassword')?.value;
      const messageContainer = document.getElementById('message-container');

      if (password !== confirmPassword) {
        if (messageContainer) {
          messageContainer.innerHTML = `<div class="bg-red-100 text-red-700 p-4 rounded">Passwords do not match.</div>`;
          messageContainer.classList.remove('hidden');
        } else {
          alert('Passwords do not match.');
        }
        return;
      }

      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      if (!token) {
        if (messageContainer) {
          messageContainer.innerHTML = `<div class="bg-red-100 text-red-700 p-4 rounded">Invalid or missing reset token.</div>`;
          messageContainer.classList.remove('hidden');
        } else {
          alert('Invalid or missing reset token.');
        }
        return;
      }

      try {
        const res = await fetch(`/api/auth/resetpassword/${token}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        });
        const data = await res.json();

        if (res.ok) {
          if (messageContainer) {
            messageContainer.innerHTML = `<div class="bg-green-100 text-green-700 p-4 rounded">${data.msg}</div>`;
            messageContainer.classList.remove('hidden');
          } else {
            alert(data.msg);
          }
          resetPasswordForm.style.display = 'none';
          setTimeout(() => { window.location.href = '/login.html'; }, 3000);
        } else {
          if (messageContainer) {
            messageContainer.innerHTML = `<div class="bg-red-100 text-red-700 p-4 rounded">${data.msg}</div>`;
            messageContainer.classList.remove('hidden');
          } else {
            alert(data.msg);
          }
        }
      } catch (err) {
        if (messageContainer) {
          messageContainer.innerHTML = `<div class="bg-red-100 text-red-700 p-4 rounded">An error occurred. Please try again.</div>`;
          messageContainer.classList.remove('hidden');
        } else {
          alert('An error occurred. Please try again.');
        }
      }
    });
  }
});
