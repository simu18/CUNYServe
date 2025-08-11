document.addEventListener('DOMContentLoaded', async () => {
  // --- DOM Elements ---
  const calendarEl = document.getElementById('calendar');
  const welcomeMessage = document.getElementById('welcome-message');

  // Sidebar
  const sidebarAvatar = document.getElementById('sidebar-avatar');
  const sidebarName = document.getElementById('sidebar-name');
  const sidebarDetails = document.getElementById('sidebar-details');
  const sidebarProgress = document.getElementById('sidebar-progress-section');

  // Modal
  const eventModal = document.getElementById('event-modal');
  const eventForm = document.getElementById('event-form');
  const modalTitle = document.getElementById('modal-title');
  const eventIdInput = document.getElementById('event-id');
  const eventTitleInput = document.getElementById('event-title');
  const eventStartInput = document.getElementById('event-start');
  const eventEndInput = document.getElementById('event-end');
  const eventLocationInput = document.getElementById('event-location');
  const eventDescriptionInput = document.getElementById('event-description');
  const cancelEventBtn = document.getElementById('cancel-event-btn');
  const deleteEventBtn = document.getElementById('delete-event-btn');

  // --- State Check & Data Population (now uses /api/profile/all) ---
  let currentUser = null;
  let userProfile = null;

  try {
    const res = await fetch('/api/profile/all');
    if (!res.ok) {
      window.location.href = '/login.html';
      return;
    }

    const allData = await res.json();
    currentUser = allData.user;
    userProfile = allData.profile || {};

    // Welcome
    if (welcomeMessage && currentUser?.name) {
      welcomeMessage.textContent = `Welcome, ${currentUser.name.split(' ')[0]}!`;
    }

    // Sidebar identity
    if (sidebarAvatar) {
      sidebarAvatar.src = currentUser?.profilePicture || '/uploads/default-avatar.png';
    }
    if (sidebarName) {
      sidebarName.textContent = currentUser?.name || 'User';
    }

    // Sidebar details (enhanced)
    if (sidebarDetails) {
      let detailsHtml = `
        <div class="mb-4">
          <div class="font-semibold text-gray-800">Email</div>
          <div>${currentUser?.email || '—'}</div>
        </div>
        <div class="mb-4">
          <div class="font-semibold text-gray-800">Campus</div>
          <div>${currentUser?.campus || 'Not specified'}</div>
        </div>
      `;

      if (userProfile.bio) {
        detailsHtml += `
          <div class="mb-4">
            <div class="font-semibold text-gray-800">Bio</div>
            <p class="text-sm italic text-gray-600">"${userProfile.bio}"</p>
          </div>
        `;
      }

      if (Array.isArray(userProfile.skills) && userProfile.skills.length > 0) {
        detailsHtml += `
          <div class="mb-4">
            <div class="font-semibold text-gray-800">Skills</div>
            <div class="flex flex-wrap gap-2 mt-1">
              ${userProfile.skills
                .map(
                  (skill) =>
                    `<span class="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">${skill}</span>`
                )
                .join('')}
            </div>
          </div>
        `;
      }

      if (Array.isArray(userProfile.causes) && userProfile.causes.length > 0) {
        detailsHtml += `
          <div class="mb-4">
            <div class="font-semibold text-gray-800">Causes</div>
            <div class="flex flex-wrap gap-2 mt-1">
              ${userProfile.causes
                .map(
                  (cause) =>
                    `<span class="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">${cause}</span>`
                )
                .join('')}
            </div>
          </div>
        `;
      }

      sidebarDetails.innerHTML = detailsHtml;
    }

    // Sidebar progress + CTA
    if (sidebarProgress) {
      if (currentUser?.onboardingStatus !== 'profile_complete') {
        sidebarProgress.innerHTML = `
          <p class="text-sm text-yellow-700 bg-yellow-100 p-3 rounded-md">
            Your profile is incomplete. Finish setting up to get matched.
          </p>
          <a href="/onboarding-orientation.html"
             class="block w-full text-center mt-4 bg-[#00539B] text-white py-2 rounded hover:bg-[#003A70]">
            Continue Onboarding
          </a>
        `;
      } else {
        sidebarProgress.innerHTML = `
          <p class="text-sm text-green-700 bg-green-100 p-3 rounded-md">
            Your profile is complete!
          </p>
          <a href="/profile-edit.html"
             class="block w-full text-center mt-4 bg-gray-600 text-white py-2 rounded hover:bg-gray-700">
            View/Edit Profile
          </a>
        `;
      }
    }
  } catch (error) {
    console.error('Dashboard initialization failed:', error);
    window.location.href = '/login.html';
    return;
  }

  // --- Modal Control Functions (must be defined BEFORE calendar) ---
  const openModal = (data = {}) => {
    if (!eventForm) return;

    eventForm.reset();
    modalTitle.textContent = data.id ? 'Edit Schedule' : '+ Add Schedule';
    eventIdInput.value = data.id || '';
    eventTitleInput.value = data.title || '';
    eventStartInput.value = data.startStr ? data.startStr.slice(0, 16) : '';
    eventEndInput.value = data.endStr ? data.endStr.slice(0, 16) : '';
    eventLocationInput.value = data.extendedProps?.location || '';
    eventDescriptionInput.value = data.extendedProps?.description || '';

    if (deleteEventBtn) {
      deleteEventBtn.classList.toggle('hidden', !data.id);
    }

    eventModal.classList.remove('hidden');
    eventModal.classList.add('flex');
  };

  const closeModal = () => {
    eventModal.classList.add('hidden');
    eventModal.classList.remove('flex');
  };

  // --- FullCalendar Initialization ---
  if (!calendarEl || typeof FullCalendar === 'undefined') {
    console.error('Calendar cannot be initialized: element or FullCalendar missing.');
    return;
  }

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay addEventButton',
    },
    customButtons: {
      addEventButton: {
        text: '+ Add Schedule',
        click: () => openModal(),
      },
    },
    events: '/api/events',
    editable: true,
    selectable: true,

    dateClick: (info) => {
      openModal({ startStr: info.dateStr + 'T12:00' });
    },

    eventClick: (info) => {
      const startISO = info.event.start ? new Date(info.event.start).toISOString() : '';
      const endISO = info.event.end
        ? new Date(info.event.end).toISOString()
        : startISO || new Date().toISOString();

      const eventData = {
        id: info.event.id,
        title: info.event.title,
        startStr: startISO,
        endStr: endISO,
        extendedProps: {
          location: info.event.extendedProps.location,
          description: info.event.extendedProps.description,
        },
      };
      openModal(eventData);
    },
  });

  calendar.render();

  // --- Form Submission Logic ---
  if (eventForm) {
    eventForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const eventData = {
        title: eventTitleInput.value,
        start: eventStartInput.value,
        end: eventEndInput.value,
        location: eventLocationInput.value,
        description: eventDescriptionInput.value,
      };

      const eventId = eventIdInput.value;
      const isEditing = !!eventId;
      const url = isEditing ? `/api/events/${eventId}` : '/api/events';
      const method = isEditing ? 'PUT' : 'POST';

      try {
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData),
        });

        if (res.ok) {
          closeModal();
          calendar.refetchEvents();
        } else {
          alert('Error: Could not save event.');
        }
      } catch (error) {
        console.error('Failed to save event:', error);
      }
    });
  }

  // --- Delete Button Logic ---
  if (deleteEventBtn) {
    deleteEventBtn.addEventListener('click', async () => {
      const eventId = eventIdInput.value;
      if (!eventId) return;

      if (confirm('Are you sure you want to delete this event?')) {
        try {
          const res = await fetch(`/api/events/${eventId}`, { method: 'DELETE' });
          if (res.ok) {
            closeModal();
            calendar.refetchEvents();
          } else {
            alert('Failed to delete event.');
          }
        } catch (error) {
          console.error('Delete error:', error);
        }
      }
    });
  }

  // --- Modal Cancel Button ---
  if (cancelEventBtn) {
    cancelEventBtn.addEventListener('click', closeModal);
  }
});
