
document.addEventListener('DOMContentLoaded', () => {
    const eventsGrid = document.getElementById('events-grid');
    const searchInput = document.getElementById('search-input');
    const collegeFilter = document.getElementById('college-filter');
    const filterAll = document.getElementById('filter-all');
    const filterCuny = document.getElementById('filter-cuny');
    const filterNonCuny = document.getElementById('filter-noncuny');
    const resetFiltersBtn = document.getElementById('reset-filters');
    const resultsCount = document.getElementById('results-count');
    const featuredEventSection = document.getElementById('featured-event');
    
    if (!eventsGrid || !searchInput || !collegeFilter) return;

    window.allPublicEvents = [];
    window.currentFilter = 'all'; // 'all', 'cuny', 'noncuny'

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

    // Check if college is a CUNY institution
    const isCunyCollege = (collegeName) => {
        const cunyColleges = [
            'Baruch College', 'Hunter College', 'Brooklyn College', 'City College', 'Queens College',
            'John Jay College', 'Lehman College', 'College of Staten Island', 'Medgar Evers College',
            'York College', 'City Tech', 'BMCC', 'Guttman Community College', 'Hostos Community College',
            'Kingsborough Community College', 'LaGuardia Community College', 'Queensborough Community College',
            'Bronx Community College', 'Graduate Center', 'Law School', 'School of Medicine', 'School of Public Health'
        ];
        
        return cunyColleges.some(cunyCollege => 
            collegeName.toLowerCase().includes(cunyCollege.toLowerCase()));
    };

    // Update filter pill states
    const updateFilterPills = (activeFilter) => {
        // Remove active class from all
        filterAll.classList.remove('active');
        filterCuny.classList.remove('active');
        filterNonCuny.classList.remove('active');
        
        // Add active class to selected filter
        if (activeFilter === 'all') {
            filterAll.classList.add('active');
        } else if (activeFilter === 'cuny') {
            filterCuny.classList.add('active');
        } else if (activeFilter === 'noncuny') {
            filterNonCuny.classList.add('active');
        }
        
        window.currentFilter = activeFilter;
    };

    // --- MODERN RENDERING FUNCTION ---
    const renderEvents = (eventsToRender) => {
        eventsGrid.innerHTML = '';
        
        // Update results count
        resultsCount.textContent = `${eventsToRender.length} event${eventsToRender.length !== 1 ? 's' : ''} found`;
        
        if (eventsToRender.length === 0) {
            eventsGrid.innerHTML = '<p class="col-span-full text-center text-gray-500 py-12">No events match your criteria. Try adjusting your filters.</p>';
            return;
        }

        eventsToRender.forEach(event => {
            const startDate = new Date(event.start);
            const formattedDate = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const formattedDay = startDate.toLocaleDateString('en-US', { weekday: 'short' });
            const formattedTime = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            
            // Determine if this is a CUNY event
            const isCunyEvent = isCunyCollege(event.partnerName);

            const eventCard = document.createElement('div');
            eventCard.className = `
                relative bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col
                transition-all duration-300 hover:-translate-y-1 hover:shadow-xl
            `;

            eventCard.innerHTML = `
                <!-- Card Header with College-specific Gradient -->
                <div class="h-28 ${isCunyEvent ? 'bg-gradient-to-r from-cuny-primary to-cuny-dark' : 'bg-gradient-to-r from-gray-600 to-gray-800'} flex items-center justify-center text-white font-semibold text-lg rounded-t-2xl relative overflow-hidden">
                    ${event.partnerName || 'CUNY Event'}
                    <span class="absolute top-2 right-2 px-2 py-1 text-xs rounded-full ${isCunyEvent ? 'cuny-badge' : 'non-cuny-badge'} text-white">
                        ${isCunyEvent ? 'CUNY' : 'External'}
                    </span>
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
                        class="add-to-calendar-btn bg-gradient-to-r from-cuny-primary to-cuny-dark text-white text-sm font-semibold px-4 py-2 rounded-full shadow-md
                            hover:scale-105 hover:shadow-lg transition-all duration-300">
                        + Add to Calendar
                    </button>
                </div>
            `;

            eventsGrid.appendChild(eventCard);
        });
    };

    // Update featured event section
    const updateFeaturedEvent = (events) => {
        if (!events || events.length === 0) {
            featuredEventSection.classList.add('hidden');
            return;
        }
        
        // Find a suitable featured event (could be based on date, importance, etc.)
        // For now, just pick the first event
        const featuredEvent = events[0];
        const startDate = new Date(featuredEvent.start);
        
        // Format date and time
        const formattedDate = startDate.toLocaleDateString('en-US', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        });
        const formattedTime = startDate.toLocaleTimeString('en-US', { 
            hour: 'numeric', minute: '2-digit', hour12: true 
        });
        
        // Update featured event section
        document.querySelector('.featured-event-title').textContent = featuredEvent.title;
        document.querySelector('.featured-event-description').textContent = 
            featuredEvent.description || 'Join us for this special event!';
        document.querySelector('.featured-event-date').textContent = formattedDate;
        document.querySelector('.featured-event-time').textContent = formattedTime;
        document.querySelector('.featured-event-location').textContent = 
            featuredEvent.location || featuredEvent.partnerName || 'CUNY Campus';
        document.querySelector('.featured-event-link').href = featuredEvent.sourceUrl || '#';
        
        // Show the section
        featuredEventSection.classList.remove('hidden');
    };

    const applyFilters = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedCollege = collegeFilter.value;
        let filteredEvents = window.allPublicEvents;

        // Apply search filter
        if (searchTerm) {
            filteredEvents = filteredEvents.filter(event => 
                event.title.toLowerCase().includes(searchTerm) || 
                (event.description && event.description.toLowerCase().includes(searchTerm))
            );
        }
        
        // Apply college filter
        if (selectedCollege) {
            filteredEvents = filteredEvents.filter(event => event.partnerName === selectedCollege);
        }
        
        // Apply CUNY/Non-CUNY filter
        if (window.currentFilter === 'cuny') {
            filteredEvents = filteredEvents.filter(event => isCunyCollege(event.partnerName));
        } else if (window.currentFilter === 'noncuny') {
            filteredEvents = filteredEvents.filter(event => !isCunyCollege(event.partnerName));
        }

        renderEvents(filteredEvents);
    };

    const populateCollegeFilter = () => {
        // Clear existing options except the first one
        while (collegeFilter.options.length > 1) {
            collegeFilter.remove(1);
        }
        
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

    const resetFilters = () => {
        searchInput.value = '';
        collegeFilter.value = '';
        updateFilterPills('all');
        applyFilters();
    };

    const loadPublicEvents = async () => {
        try {
            const response = await fetch('/api/public/events');
            if (!response.ok) throw new Error('Failed to fetch events');
            window.allPublicEvents = await response.json();
            
            populateCollegeFilter();
            updateFeaturedEvent(window.allPublicEvents);
            applyFilters();
        } catch (error) {
            console.error('Error loading public events:', error);
            eventsGrid.innerHTML = '<p class="col-span-full text-center text-red-500 py-12">Could not load events. Please try again later.</p>';
        }
    };

    // Event listeners
    searchInput.addEventListener('input', applyFilters);
    collegeFilter.addEventListener('change', applyFilters);
    filterAll.addEventListener('click', () => {
        updateFilterPills('all');
        applyFilters();
    });
    filterCuny.addEventListener('click', () => {
        updateFilterPills('cuny');
        applyFilters();
    });
    filterNonCuny.addEventListener('click', () => {
        updateFilterPills('noncuny');
        applyFilters();
    });
    resetFiltersBtn.addEventListener('click', resetFilters);
    
    eventsGrid.addEventListener('click', e => {
        if (e.target && e.target.classList.contains('add-to-calendar-btn')) {
            addToCalendar(e.target.dataset.eventId);
        }
    });

    // Initialize page
    updateFilterPills('all');
    loadPublicEvents();
});