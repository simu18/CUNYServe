// public/scripts/onboarding-profile.js (Corrected and Final)

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('profile-form');
    const allTextInputs = form.querySelectorAll('input[type="text"], input[type="number"], textarea');
    const allCheckboxes = form.querySelectorAll('input[type="checkbox"]');
    const errorMessages = form.querySelectorAll('.form-error-msg');
  
    // --- Function to auto-save data (unchanged) ---
    const autoSave = async (data) => {
      try {
        await fetch('/api/onboarding/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    };
  
    // --- Function to populate form with existing data (unchanged) ---
    const populateForm = (data) => {
      form.querySelector('#campus').value = data.campus || '';
      form.querySelector('#graduation_year').value = data.graduation_year || '';
      form.querySelector('#skills').value = data.skills ? data.skills.join(', ') : '';
      form.querySelector('#bio').value = data.bio || '';
  
      document.querySelectorAll('input[name="opportunity_types"]').forEach(cb => {
        cb.checked = data.opportunity_types && data.opportunity_types.includes(cb.value);
      });
      document.querySelectorAll('input[name="causes"]').forEach(cb => {
        cb.checked = data.causes && data.causes.includes(cb.value);
      });
    };
  
    // --- Function to display validation errors (unchanged) ---
    const displayErrors = (errors) => {
      errorMessages.forEach(el => el.textContent = '');
      for (const key in errors) {
        const errorEl = form.querySelector(`.form-error-msg[data-for="${key}"]`);
        if (errorEl) {
          errorEl.textContent = errors[key];
          errorEl.style.color = 'red';
        }
      }
    };
  
    // --- Initial Load: Fetch existing data (unchanged) ---
    const initialize = async () => {
      try {
        const res = await fetch('/api/onboarding/profile');
        if (!res.ok) { window.location.href = '/login.html'; return; }
        const data = await res.json();
        populateForm(data);
      } catch (error) {
        console.error('Failed to load profile data:', error);
      }
    };
  
    // --- EVENT LISTENERS (unchanged) ---
  
    // Auto-save for text fields on blur
    allTextInputs.forEach(input => {
      input.addEventListener('blur', () => autoSave({ [input.id]: input.value }));
    });
  
    // Auto-save for checkbox groups on change
    allCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        const checked = Array.from(document.querySelectorAll(`input[name="${checkbox.name}"]:checked`))
          .map(cb => cb.value);
        autoSave({ [checkbox.name]: checked });
      });
    });
  
    // --- UPDATED FINAL SUBMISSION HANDLER ---
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
  
      // 1) Gather ALL current form data at once
      const finalData = {
        campus: document.getElementById('campus').value,
        graduation_year: document.getElementById('graduation_year').value,
        bio: document.getElementById('bio').value,
        skills: document.getElementById('skills').value
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
        opportunity_types: Array.from(document.querySelectorAll('input[name="opportunity_types"]:checked'))
          .map(cb => cb.value),
        causes: Array.from(document.querySelectorAll('input[name="causes"]:checked'))
          .map(cb => cb.value)
      };
  
      try {
        // 2) FINAL save to ensure latest values hit the DB
        const saveResponse = await fetch('/api/onboarding/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalData)
        });
  
        if (!saveResponse.ok) {
          throw new Error('Could not save final profile data.');
        }
  
        // 3) Tell the server to validate and complete the step
        const completeResponse = await fetch('/api/onboarding/profile/complete', { method: 'POST' });
        const data = await completeResponse.json();
  
        if (completeResponse.ok) {
          alert('Profile Complete! Welcome to your CUNYServe dashboard.');
          window.location.href = '/dashboard.html';
        } else {
          // Show backend validation errors inline if present
          if (data.errors) displayErrors(data.errors);
          alert(data.msg || 'An error occurred. Please check the form.');
        }
      } catch (error) {
        console.error('Final submission failed:', error);
        alert('A critical error occurred while trying to complete your profile.');
      }
    });
  
    // --- Run Initialization ---
    initialize();
  });
  