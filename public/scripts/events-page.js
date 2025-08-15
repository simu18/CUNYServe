// public/scripts/events-page.js (Modern Event Cards + Existing Filtering + Add to Calendar)
document.addEventListener('DOMContentLoaded', () => {
    const eventsGrid = document.getElementById('events-grid');
    const searchInput = document.getElementById('search-input');
    const collegeFilter = document.getElementById('college-filter');
    if (!eventsGrid || !searchInput || !collegeFilter) return;

    window.allPublicEvents = [];

    const addToCalendar = async (eventId) => {
        let isLoggedIn = false;
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) isLoggedIn = true;
        } catch { isLoggedIn = false; }

        if (!isLoggedIn) {
            alert('Please log in to add events to your calendar.');
            window.location.href = '/login.html';
            return;
        }

        const eventToAdd = window.allPublicEvents.find(event => event._id === eventId);
        if (!eventToAdd) { alert('Could not find event details.'); return; }

        const eventData = {
            title: eventToAdd.title,
            start: eventToAdd.start,
            end: eventToAdd.end,
            location: eventToAdd.location,
            description: `From CUNY Events: ${eventToAdd.partnerName}. View original at ${eventToAdd.sourceUrl}`
        };

        try {
            const res = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventData)
            });
            if (res.ok) alert(`'${eventData.title}' has been added to your dashboard calendar!`);
            else alert('Failed to add event. It might already be in your calendar.');
        } catch (error) {
            console.error('Error adding event to calendar:', error);
        }
    };

    // --- MODERN RENDERING FUNCTION ---
    const renderEvents = (eventsToRender) => {
        eventsGrid.innerHTML = '';
        if (eventsToRender.length === 0) {
            eventsGrid.innerHTML = '<p class="col-span-full text-center text-gray-500">No events match your criteria.</p>';
            return;
        }

        eventsToRender.forEach(event => {
            const startDate = new Date(event.start);
            const formattedDate = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const formattedDay = startDate.toLocaleDateString('en-US', { weekday: 'short' });
            const formattedTime = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

            const eventCard = document.createElement('div');
            eventCard.className = `
                relative bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col
                transition-transform duration-300 hover:scale-105 hover:shadow-2xl
            `;

            eventCard.innerHTML = `
    <!-- Card Header with Gradient -->
    <div class="h-28 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-lg rounded-t-2xl">
        ${event.partnerName || 'CUNY Event'}
    </div>

    <!-- Event Content -->
    <div class="p-5 flex-grow flex flex-col justify-between">
        <div>
            <h3 class="text-xl font-bold text-gray-900 mb-2">${event.title}</h3>
            <p class="text-gray-600 text-sm line-clamp-3">${event.description || 'Event details not provided.'}</p>
        </div>

        <!-- Date and Time Badges -->
        <div class="mt-4 flex flex-wrap gap-2 text-sm">
            <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-semibold">${formattedDay}, ${formattedDate}</span>
            <span class="px-3 py-1 bg-gray-100 text-gray-800 rounded-full">${formattedTime}</span>
        </div>
    </div>

    <!-- Card Footer Buttons -->
    <div class="px-5 py-3 bg-gray-50 border-t flex items-center justify-between gap-2">
        <a href="${event.sourceUrl}" target="_blank" rel="noopener noreferrer"
            class="text-sm text-blue-600 font-semibold hover:underline transition-colors duration-200">
            View Source &rarr;
        </a>
        <button data-event-id="${event._id}" 
            class="add-to-calendar-btn bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-md
                   hover:scale-105 hover:shadow-xl transition-all duration-300">
            + Add to Calendar
        </button>
    </div>
`;


            eventsGrid.appendChild(eventCard);
        });
    };

    const applyFilters = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedCollege = collegeFilter.value;
        let filteredEvents = window.allPublicEvents;

        if (searchTerm) filteredEvents = filteredEvents.filter(event => event.title.toLowerCase().includes(searchTerm));
        if (selectedCollege) filteredEvents = filteredEvents.filter(event => event.partnerName === selectedCollege);

        renderEvents(filteredEvents);
    };

    const populateCollegeFilter = () => {
        const colleges = [...new Set(window.allPublicEvents.map(e => e.partnerName))].sort();
        colleges.forEach(college => {
            if (college) {
                const option = document.createElement('option');
                option.value = college;
                option.textContent = college;
                collegeFilter.appendChild(option);
            }
        });
    };

    const loadPublicEvents = async () => {
        try {
            const response = await fetch('/api/public/events');
            if (!response.ok) throw new Error('Failed to fetch events');
            window.allPublicEvents = await response.json();
            populateCollegeFilter();
            renderEvents(window.allPublicEvents);
        } catch (error) {
            console.error('Error loading public events:', error);
            eventsGrid.innerHTML = '<p class="col-span-full text-center text-red-500">Could not load events.</p>';
        }
    };

    searchInput.addEventListener('input', applyFilters);
    collegeFilter.addEventListener('change', applyFilters);
    eventsGrid.addEventListener('click', e => {
        if (e.target && e.target.classList.contains('add-to-calendar-btn')) {
            addToCalendar(e.target.dataset.eventId);
        }
    });

    loadPublicEvents();
});
