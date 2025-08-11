// public/scripts/onboarding-orientation.js

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('orientation-form');
    const allInputs = form.querySelectorAll('input, select, textarea');
    const ageCheckbox = document.getElementById('age_confirm_18_plus');
    const guardianFieldsDiv = document.getElementById('guardian-fields');
    const errorMessages = form.querySelectorAll('.form-error-msg');

    // --- Function to toggle guardian fields visibility ---
    const toggleGuardianFields = () => {
        // Show if "I am 18" is NOT checked
        guardianFieldsDiv.classList.toggle('hidden', ageCheckbox.checked);
    };

    // --- Function to auto-save data ---
    const autoSave = async (field) => {
        const data = {};
        if (field.type === 'checkbox') {
            data[field.id] = field.checked;
        } else if (field.type === 'radio') {
             if (field.checked) data[field.name] = field.value;
        } else {
            data[field.id] = field.value;
        }

        try {
            await fetch('/api/onboarding/orientation', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            // Optional: Show a small "saved" indicator
        } catch (error) {
            console.error('Auto-save failed:', error);
        }
    };

    // --- Function to populate form with existing data ---
    const populateForm = (data) => {
        allInputs.forEach(input => {
            const key = input.id || input.name;
            if (data.hasOwnProperty(key)) {
                if (input.type === 'checkbox') {
                    input.checked = data[key];
                } else if (input.type === 'radio') {
                    if(input.value === data[key]) {
                        input.checked = true;
                    }
                } else {
                    input.value = data[key];
                }
            }
        });
        toggleGuardianFields(); // Ensure guardian fields are shown/hidden based on loaded data
    };
    
    // --- Function to display validation errors ---
    const displayErrors = (errors) => {
        // Clear previous errors
        errorMessages.forEach(el => el.textContent = '');
        
        for (const key in errors) {
            const errorEl = form.querySelector(`.form-error-msg[data-for="${key}"]`);
            if (errorEl) {
                errorEl.textContent = errors[key];
                errorEl.style.color = 'red';
            }
        }
    };

    // --- Initial Load: Fetch existing data ---
    const initialize = async () => {
        try {
            const res = await fetch('/api/onboarding/orientation');
             if (!res.ok) {
                // If not logged in, our auth guard will kick in. Redirect just in case.
                window.location.href = '/login.html';
                return;
            }
            const data = await res.json();
            populateForm(data);
        } catch (error) {
            console.error('Failed to load orientation data:', error);
        }
    };

    // --- EVENT LISTENERS ---

    // Listen for changes on inputs to auto-save
    allInputs.forEach(input => {
        input.addEventListener('change', () => autoSave(input));
    });

    // Special listener for the age checkbox
    ageCheckbox.addEventListener('change', toggleGuardianFields);

    // Handle final form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/onboarding/orientation/complete', { method: 'POST' });
            const data = await res.json();

            if (res.ok) {
                // Success! Move to the next step.
                alert('Orientation Complete! Proceeding to Profile Setup.');
                window.location.href = '/onboarding-profile.html'; // We will create this page next
            } else {
                // Validation errors occurred
                if (data.errors) {
                    displayErrors(data.errors);
                }
                alert(data.msg || 'An error occurred. Please check the form.');
            }
        } catch (error) {
            console.error('Final submission failed:', error);
        }
    });

    // --- Run Initialization ---
    initialize();
});