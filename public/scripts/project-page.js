document.addEventListener('DOMContentLoaded', () => {
    const addToCalendarBtn = document.getElementById('add-to-calendar-btn');
    if (!addToCalendarBtn) return;

    // Helper function to parse times like "8:15PM" into [hours, minutes]
    function parseTime(timeStr) {
        if (!timeStr) return [12, 0]; // Default to noon
        const lowerTime = timeStr.trim().toLowerCase();
        const isPM = lowerTime.includes('pm');
        let [hours, minutes] = lowerTime.replace('am', '').replace('pm', '').split(':').map(Number);
        minutes = minutes || 0;
        if (isPM && hours < 12) hours += 12;
        if (!isPM && hours === 12) hours = 0;
        return [hours, minutes];
    }

    addToCalendarBtn.addEventListener('click', async () => {
        // ... (login check remains the same) ...
        let isLoggedIn = false;
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) isLoggedIn = true;
        } catch (error) { isLoggedIn = false; }

        if (!isLoggedIn) {
            alert('Please log in to add events to your calendar.');
            window.location.href = '/login.html';
            return;
        }

        if (!window.currentProject || !window.currentProject.dateTime || !window.currentProject.dateISO) {
            alert('Could not find complete project details. Please try again.');
            return;
        }

        try {
            // --- NEW, BULLETPROOF DATE CONSTRUCTION ---
            const dateISO = window.currentProject.dateISO; // e.g., "2025-08-09"
            const timePart = window.currentProject.dateTime.split(' | ')[1];
            const timeParts = timePart.split(' - ');
            const startTimeStr = timeParts[0];
            const endTimeStr = timeParts.length > 1 ? timeParts[1] : null;

            // 1. Parse the YYYY-MM-DD string into numbers.
            const [year, month, day] = dateISO.split('-').map(Number);

            // 2. Parse the start and end times.
            const [startHours, startMinutes] = parseTime(startTimeStr);
            
            // 3. Create the start date using UTC components to avoid timezone issues.
            // Note: The month is 0-indexed in JavaScript (0=Jan, 1=Feb, etc.), so we subtract 1.
            const startDate = new Date(Date.UTC(year, month - 1, day, startHours, startMinutes));

            let endDate;
            if (endTimeStr) {
                const [endHours, endMinutes] = parseTime(endTimeStr);
                endDate = new Date(Date.UTC(year, month - 1, day, endHours, endMinutes));
            } else {
                // Default to 1 hour after start if no end time is provided.
                endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
            }
            
            // 4. Check if the created dates are valid BEFORE calling toISOString().
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                // If they are not valid, throw an error to be caught below.
                throw new Error("Constructed date is invalid");
            }
            // --- END NEW LOGIC ---

            const eventData = {
                title: window.currentProject.title,
                start: startDate.toISOString(), // This is now safe to call
                end: endDate.toISOString(),     // This is also safe
                location: window.currentProject.address,
                description: `Volunteer for: ${window.currentProject.partner}. Original project details available on the site.`
            };

            const res = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventData)
            });

            if (res.ok) {
                alert(`'${eventData.title}' has been added to your calendar!`);
                if (window.closeModal) window.closeModal();
            } else {
                alert('Failed to add event. It might already be in your schedule.');
            }
        } catch (error) {
            console.error('Error adding event to calendar:', error);
            alert('Could not parse the event time. Please check the format and try again.');
        }
    });
});