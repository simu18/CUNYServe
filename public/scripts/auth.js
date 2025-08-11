// public/js/auth.js

document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');
  
    // Helper: safely get element value
    const val = (id) => (document.getElementById(id)?.value ?? '').trim();
  
    // Helper: show an error either inline (if slot exists) or via alert
    function showError(message, slotId) {
      const slot = slotId ? document.getElementById(slotId) : null;
      if (slot) {
        slot.textContent = message || 'Something went wrong.';
        slot.classList.remove('hidden');
      } else {
        alert(message || 'Something went wrong.');
      }
    }
  
    // Helper: button state toggle
    function setSubmitting(form, isSubmitting, submittingText) {
      const btn = form.querySelector('button[type="submit"]');
      if (!btn) return () => {};
      const original = btn.textContent;
      btn.disabled = isSubmitting;
      btn.textContent = isSubmitting ? (submittingText || 'Please wait…') : original;
      return () => {
        btn.disabled = false;
        btn.textContent = original;
      };
    }
  
    // -------------------------
    // SIGNUP
    // -------------------------
    if (signupForm) {
      signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
  
        const name = val('name');
        const email = val('email');
        const password = val('password');
        const confirmPassword = val('confirmPassword');
        const campusSelected = val('campus');
        const otherCampus = val('otherCampus');
  
        // Build extras if present in the DOM
        const interestsSelect = document.getElementById('interests');
        const interests = interestsSelect
          ? Array.from(interestsSelect.selectedOptions).map((o) => o.value)
          : [];
  
        const availability = Array.from(
          document.querySelectorAll('input[name="availability"]:checked')
        ).map((cb) => cb.value);
  
        const bio = val('bio');
  
        // Client-side checks
        if (password !== confirmPassword) {
          return showError('Passwords do not match.');
        }
        if (!campusSelected) {
          return showError('Please select your campus.');
        }
        if (campusSelected === 'Other' && !otherCampus) {
          return showError('Please specify your campus in the "Other" field.');
        }
  
        const campus = campusSelected === 'Other' ? otherCampus : campusSelected;
  
        const userData = {
          name,
          email,
          password,
          campus,
          // Optional additional profile fields
          // (your backend maps these to new names if needed)
          interests,
          availability,
          bio,
        };
  
        const restore = setSubmitting(signupForm, true, 'Signing up…');
  
        try {
          const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
            credentials: 'include',
          });
  
          let payload = {};
          try { payload = await response.json(); } catch (_) {}
  
          if (response.ok) {
            alert(payload.msg || 'Signup successful! Redirecting to login…');
            window.location.href = '/login.html';
          } else {
            showError(payload.msg || 'Signup failed. Please try again.');
          }
        } catch (err) {
          console.error('Signup error:', err);
          showError('An error occurred during signup. Please try again.');
        } finally {
          restore();
        }
      });
    }
  
    // -------------------------
    // LOGIN (with onboarding redirect)
    // -------------------------
    if (loginForm) {
      const errorSlotId = 'loginError'; // present in your updated login.html
  
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
  
        // Hide previous error if visible
        const slot = document.getElementById(errorSlotId);
        if (slot) slot.classList.add('hidden');
  
        const email = val('email');
        const password = val('password');
  
        const restore = setSubmitting(loginForm, true, 'Logging in…');
  
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            credentials: 'include',
          });
  
          // Parse once for both success/error paths
          let payload = {};
          try { payload = await response.json(); } catch (_) {}
  
          if (response.ok) {
            // NEW: redirect based on onboarding status
            const user = payload || {};
            const status =
              (user.onboardingStatus || user.onboarding_status || '').toLowerCase();
  
            if (status === 'profile_complete') {
              window.location.href = '/dashboard.html';
            } else {
              // Not finished onboarding -> send to orientation start
              window.location.href = '/onboarding-orientation.html';
            }
          } else {
            showError(payload?.msg || 'Login failed. Please check your credentials.', errorSlotId);
          }
        } catch (err) {
          console.error('Login error:', err);
          showError('An error occurred during login. Please try again.', errorSlotId);
        } finally {
          restore();
        }
      });
    }
  });
  