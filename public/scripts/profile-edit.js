// public/scripts/profile-edit.js (Upload-first + Save + Redirect)

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('edit-profile-form');
    if (!form) return;
  
    // --- Small helpers to avoid null errors ---
    const byId = (id) => document.getElementById(id);
    const setValue = (id, val) => { const el = byId(id); if (el) el.value = val ?? ''; };
    const setChecked = (id, val) => { const el = byId(id); if (el) el.checked = !!val; };
    const setSrc = (id, val, fallback) => { const el = byId(id); if (el) el.src = val || fallback || ''; };
  
    // --- Helper for checkboxes ---
    const populateCheckboxes = (name, values) => {
      const valuesSet = new Set(values || []);
      document.querySelectorAll(`input[name="${name}"]`).forEach((checkbox) => {
        checkbox.checked = valuesSet.has(checkbox.value);
      });
    };
  
    // --- Populate all form fields ---
    const populateForm = (data) => {
      const profile = data.profile || {};
      const user = data.user || {};
      const orientation = data.orientation || {};
  
      // Section 1: Public Profile
      setSrc('profile_photo_preview', user.profilePicture, '/uploads/default-avatar.png');
      setValue('bio', profile.bio || '');
  
      // Section 2 & 3: Preferences, Causes & Skills
      populateCheckboxes('boroughs_preferred', profile.boroughs_preferred);
      populateCheckboxes('opportunity_types', profile.opportunity_types);
      populateCheckboxes('causes', profile.causes);
      setValue('skills', Array.isArray(profile.skills) ? profile.skills.join(', ') : '');
  
      // Section 4: Academic & Logistics
      setValue('major_program', profile.major_program || '');
      setValue('graduation_year', profile.graduation_year || '');
      setValue('transport_mode', profile.transport_mode || '');
      setValue('shirt_size', profile.shirt_size || '');
  
      // Section 5: Emergency & Consent
      setValue('emergency_name', orientation.emergency_name || '');
      setValue('emergency_relationship', orientation.emergency_relationship || '');
      setValue('emergency_phone', orientation.emergency_phone || '');
      setChecked('comms_consent_email', orientation.comms_consent_email || false);
      setChecked('comms_consent_sms', orientation.comms_consent_sms || false);
    };
  
    // --- Fetch profile data on page load ---
    const loadProfileData = async () => {
      try {
        const res = await fetch('/api/profile/all');
        if (!res.ok) {
          alert('Failed to load your profile data. Please log in again.');
          window.location.href = '/login.html';
          return;
        }
        const allData = await res.json();
        populateForm(allData);
      } catch (error) {
        console.error('Failed to load profile data:', error);
        alert('Network error while loading your profile. Please try again.');
      }
    };
  
    // Immediate preview when selecting a photo
    const photoInput = byId('profile_photo');
    if (photoInput) {
      photoInput.addEventListener('change', () => {
        const file = photoInput.files && photoInput.files[0];
        if (!file) return;
        const preview = byId('profile_photo_preview');
        if (preview) {
          const reader = new FileReader();
          reader.onload = (e) => (preview.src = e.target.result);
          reader.readAsDataURL(file);
        }
      });
    }
  
    // --- Form submit: Upload photo first, then save text data, then redirect ---
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
  
      // Optional UX: disable submit button
      const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
  
      // Step 1: Upload photo (if any)
      try {
        if (photoInput && photoInput.files && photoInput.files[0]) {
          const formData = new FormData();
          formData.append('profilePicture', photoInput.files[0]);
          const photoRes = await fetch('/api/profile/photo', { method: 'POST', body: formData });
          if (!photoRes.ok) {
            console.warn('Photo upload failed with status', photoRes.status);
            alert('Could not upload the new photo, but other changes will be saved.');
          }
        }
      } catch (error) {
        console.error('Error uploading photo:', error);
        alert('A network error occurred while uploading the photo. Other changes will still be saved.');
      }
  
      // Step 2: Gather and save all text data
      const getCheckedValues = (name) =>
        Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map((cb) => cb.value);
  
      const profileData = {
        bio: byId('bio') ? byId('bio').value : '',
        skills: (byId('skills') ? byId('skills').value : '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        boroughs_preferred: getCheckedValues('boroughs_preferred'),
        opportunity_types: getCheckedValues('opportunity_types'),
        causes: getCheckedValues('causes'),
        major_program: byId('major_program') ? byId('major_program').value : '',
        graduation_year: byId('graduation_year') ? byId('graduation_year').value : '',
        transport_mode: byId('transport_mode') ? byId('transport_mode').value : '',
        shirt_size: byId('shirt_size') ? byId('shirt_size').value : '',
      };
  
      const orientationData = {
        emergency_name: byId('emergency_name') ? byId('emergency_name').value : '',
        emergency_relationship: byId('emergency_relationship') ? byId('emergency_relationship').value : '',
        emergency_phone: byId('emergency_phone') ? byId('emergency_phone').value : '',
        comms_consent_email: byId('comms_consent_email') ? byId('comms_consent_email').checked : false,
        comms_consent_sms: byId('comms_consent_sms') ? byId('comms_consent_sms').checked : false,
      };
  
      try {
        const res = await fetch('/api/profile/all', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profileData, orientationData }),
        });
  
        if (res.ok) {
          alert('Profile updated successfully! Redirecting to dashboard...');
          window.location.href = '/dashboard.html';
        } else {
          const msg = `Failed to update profile details. (${res.status})`;
          alert(msg);
          if (submitBtn) submitBtn.disabled = false;
        }
      } catch (error) {
        console.error('Error updating profile:', error);
        alert('Network error while saving your changes. Please try again.');
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  
    // --- Initial page load ---
    loadProfileData();
  });
  