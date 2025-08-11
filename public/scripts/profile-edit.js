// public/scripts/profile-edit.js (Comprehensive Version)

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('edit-profile-form');
    if (!form) return;

    // --- Helper function to populate all form fields ---
    const populateForm = (data) => {
        const profile = data.profile || {};
        const user = data.user || {};
        const orientation = data.orientation || {};

        // Section 1: Public Profile
        document.getElementById('profile_photo_preview').src = user.profilePicture || '/uploads/default-avatar.png';
        document.getElementById('bio').value = profile.bio || '';

        // Section 2 & 3: Preferences, Causes & Skills
        populateCheckboxes('boroughs_preferred', profile.boroughs_preferred);
        populateCheckboxes('opportunity_types', profile.opportunity_types);
        populateCheckboxes('causes', profile.causes);
        document.getElementById('skills').value = profile.skills ? profile.skills.join(', ') : '';

        // Section 4: Academic & Logistics
        document.getElementById('major_program').value = profile.major_program || '';
        document.getElementById('graduation_year').value = profile.graduation_year || '';
        document.getElementById('transport_mode').value = profile.transport_mode || '';
        document.getElementById('shirt_size').value = profile.shirt_size || '';

        // Section 5: Emergency & Consent
        document.getElementById('emergency_name').value = orientation.emergency_name || '';
        document.getElementById('emergency_relationship').value = orientation.emergency_relationship || '';
        document.getElementById('emergency_phone').value = orientation.emergency_phone || '';
        document.getElementById('comms_consent_email').checked = orientation.comms_consent_email || false;
        document.getElementById('comms_consent_sms').checked = orientation.comms_consent_sms || false;
    };
    
    // Helper for checkboxes
    const populateCheckboxes = (name, values) => {
        const valuesSet = new Set(values || []);
        document.querySelectorAll(`input[name="${name}"]`).forEach(checkbox => {
            checkbox.checked = valuesSet.has(checkbox.value);
        });
    };

    // --- Function to fetch all profile data on page load ---
    const loadProfileData = async () => {
        try {
            const res = await fetch('/api/profile/all');
            if (!res.ok) {
                alert("Failed to load your profile data. Please log in again.");
                window.location.href = '/login.html';
                return;
            }
            const allData = await res.json();
            populateForm(allData);
        } catch (error) {
            console.error('Failed to load profile data:', error);
        }
    };

    // --- Add submit listener to the form ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Helper for getting checkbox values
        const getCheckedValues = (name) => Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(cb => cb.value);

        // --- Gather all data from the form into two objects ---
        const profileData = {
            bio: document.getElementById('bio').value,
            skills: document.getElementById('skills').value.split(',').map(s => s.trim()).filter(Boolean),
            boroughs_preferred: getCheckedValues('boroughs_preferred'),
            opportunity_types: getCheckedValues('opportunity_types'),
            causes: getCheckedValues('causes'),
            major_program: document.getElementById('major_program').value,
            graduation_year: document.getElementById('graduation_year').value,
            transport_mode: document.getElementById('transport_mode').value,
            shirt_size: document.getElementById('shirt_size').value
        };

        const orientationData = {
            emergency_name: document.getElementById('emergency_name').value,
            emergency_relationship: document.getElementById('emergency_relationship').value,
            emergency_phone: document.getElementById('emergency_phone').value,
            comms_consent_email: document.getElementById('comms_consent_email').checked,
            comms_consent_sms: document.getElementById('comms_consent_sms').checked
        };

        // --- Send the structured data to the backend ---
        try {
            const res = await fetch('/api/profile/all', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profileData, orientationData })
            });

            if (res.ok) {
                alert('Profile updated successfully!');
            } else {
                alert('Failed to update profile.');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
        }

        // --- Handle Photo Upload (if a file was selected) ---
        const photoInput = document.getElementById('profile_photo');
        if (photoInput.files[0]) {
            const formData = new FormData();
            formData.append('profilePicture', photoInput.files[0]);
            try {
                // We need a separate route for file uploads
                const photoRes = await fetch('/api/profile/photo', { method: 'POST', body: formData });
                if (photoRes.ok) {
                    console.log('Photo uploaded successfully');
                } else {
                     console.error('Photo upload failed');
                }
            } catch(error) {
                 console.error('Error uploading photo:', error);
            }
        }
        // Reload after all operations to see changes
        window.location.reload();
    });

    // --- Initial page load ---
    loadProfileData();
});