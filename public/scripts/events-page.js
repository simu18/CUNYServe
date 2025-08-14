// public/scripts/events-page.js (Enhanced with Interactive Cards)

document.addEventListener('DOMContentLoaded', () => {
    const eventsGrid = document.getElementById('events-grid');
    if (!eventsGrid) return;

    // This function will handle the "Add to my Calendar" logic
    const addToCalendar = async (eventId) => {
        // 1. Check if user is logged in
        let isLoggedIn = false;
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) isLoggedIn = true;
        } catch (error) {
            isLoggedIn = false;
        }

        if (!isLoggedIn) {
            alert('Please log in to add events to your calendar.');
            window.location.href = '/login.html';
            return;
        }
        
        // 2. Find the full event data from the fetched list
        const eventToAdd = window.allPublicEvents.find(event => event._id === eventId);
        if (!eventToAdd) {
            alert('Could not find event details.');
            return;
        }
        
        // 3. Create the event payload for the user's private calendar
        const eventData = {
            title: eventToAdd.title,
            start: eventToAdd.start, // Already in ISO format
            end: eventToAdd.end,     // Already in ISO format
            location: eventToAdd.location,
            description: `From CUNY Events: ${eventToAdd.partnerName}. View original at ${eventToAdd.sourceUrl}`
        };

        // 4. Send the data to the user's private calendar API endpoint
        try {
            // Note: We are POSTing to /api/events, NOT /api/public/events
            const res = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventData)
            });

            if (res.ok) {
                alert(`'${eventData.title}' has been added to your dashboard calendar!`);
            } else {
                alert('Failed to add event. It might already be in your calendar.');
            }
        } catch (error) {
            console.error('Error adding event to calendar:', error);
        }
    };

    const loadPublicEvents = async () => {
        try {
            const response = await fetch('/api/public/events');
            if (!response.ok) throw new Error('Failed to fetch events');
            
            const events = await response.json();
            window.allPublicEvents = events; // Store events globally for our click handlers

            eventsGrid.innerHTML = ''; // Clear "Loading..."

            if (events.length === 0) {
                eventsGrid.innerHTML = '<p class="col-span-full text-center text-gray-500">No upcoming events found.</p>';
                return;
            }

            events.forEach(event => {
                const eventCard = document.createElement('div');
                eventCard.className = "bg-white rounded-lg shadow-md overflow-hidden flex flex-col";

                const startDate = new Date(event.start);
                const formattedDate = startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
                const formattedDay = startDate.toLocaleDateString('en-US', { weekday: 'long' });
                const formattedTime = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

                // === NEW INTERACTIVE CARD HTML ===
                eventCard.innerHTML = `
                    <div class="p-6 flex-grow">
                        <p class="text-sm font-semibold text-[#00539B]">${event.partnerName || 'CUNY Event'}</p>
                        <h3 class="text-xl font-bold mt-2 text-gray-900">${event.title}</h3>
                        <div class="mt-4 pt-4 border-t">
                            <div class="flex items-center text-sm text-gray-700">
                                <svg class="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                <span>${formattedDay}, ${formattedDate}</span>
                            </div>
                             <div class="flex items-center text-sm text-gray-700 mt-2">
                                 <svg class="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                <span>${formattedTime}</span>
                            </div>
                        </div>
                    </div>
                    <div class="px-6 py-3 bg-gray-50 border-t flex items-center justify-between gap-2">
                        <a href="${event.sourceUrl}" target="_blank" rel="noopener noreferrer" class="text-sm text-[#00539B] hover:underline">
                            View Source &rarr;
                        </a>
                        <button data-event-id="${event._id}" class="add-to-calendar-btn bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded hover:bg-blue-700">
                            + Add to my Calendar
                        </button>
                    </div>
                `;
                eventsGrid.appendChild(eventCard);
            });

        } catch (error) {
            console.error('Error loading public events:', error);
            eventsGrid.innerHTML = '<p class="col-span-full text-center text-red-500">Could not load events.</p>';
        }
    };

    // Use event delegation for the "Add to Calendar" buttons
    eventsGrid.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('add-to-calendar-btn')) {
            const eventId = e.target.dataset.eventId;
            addToCalendar(eventId);
        }
    });

    loadPublicEvents();
});