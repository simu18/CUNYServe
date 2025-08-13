// public/scripts/dashboard-new.js (Final Version with Full CRUD + eventDataTransform fix)

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

  // --- Initial Data Fetch and Population ---
  let currentUser = null;
  let userProfile = null;

  try {
    const res = await fetch('/api/profile/all');
    if (!res.ok) {
      window.location.href = '/login.html';
      return;
    }
    const allData = await res.json();
    currentUser = allData.user || {};
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

    // Sidebar details
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

      if (userProfile?.bio) {
        detailsHtml += `
          <div class="mb-4">
            <div class="font-semibold text-gray-800">Bio</div>
            <p class="text-sm italic text-gray-600">"${userProfile.bio}"</p>
          </div>
        `;
      }

      if (Array.isArray(userProfile?.skills) && userProfile.skills.length > 0) {
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

      if (Array.isArray(userProfile?.causes) && userProfile.causes.length > 0) {
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

  // --- Guards ---
  if (!calendarEl || typeof FullCalendar === 'undefined') {
    console.error('Calendar cannot be initialized: element or FullCalendar missing.');
    return;
  }
  if (!eventModal || !eventForm) {
    console.error('Event modal or form not found.');
    return;
  }

  // Util: Date -> "YYYY-MM-DDTHH:MM" in local time (for datetime-local inputs)
  const toLocalISOString = (date) => {
    if (!date) return '';
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  // --- Modal Control ---
  const openModal = (data = {}) => {
    eventForm.reset();

    // Normalize data: accept either a raw object or FullCalendar EventApi
    const isEventApi = typeof data.getProp === 'function'; // EventApi has getProp
    const normalized = isEventApi
      ? {
          id: data.id,
          title: data.title,
          start: data.start,
          end: data.end,
          extendedProps: data.extendedProps || {},
        }
      : {
          id: data.id || data._id || '',
          title: data.title || '',
          start: data.start || data.startStr || '',
          end: data.end || data.endStr || '',
          extendedProps: data.extendedProps || {
            location: data.location,
            description: data.description,
          },
        };

    modalTitle.textContent = normalized.id ? 'Edit Schedule' : '+ Add Schedule';
    eventIdInput.value = normalized.id || '';
    eventTitleInput.value = normalized.title || '';
    eventStartInput.value = toLocalISOString(normalized.start);
    eventEndInput.value = toLocalISOString(normalized.end);
    eventLocationInput.value = normalized.extendedProps?.location || '';
    eventDescriptionInput.value = normalized.extendedProps?.description || '';

    if (deleteEventBtn) {
      deleteEventBtn.classList.toggle('hidden', !normalized.id);
    }

    eventModal.classList.remove('hidden');
    eventModal.classList.add('flex');
  };

  const closeModal = () => {
    eventModal.classList.add('hidden');
    eventModal.classList.remove('flex');
  };

  // --- FullCalendar Initialization (Corrected Version) ---
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

    // Fetch events from API with failure handler
    events: {
      url: '/api/events',
      failure: function () {
        alert('There was an error while fetching events!');
      },
    },

    // === CRITICAL FIX: map MongoDB shape to FullCalendar ===
    eventDataTransform: function (eventInfo) {
      return {
        id: eventInfo._id, // map _id -> id
        title: eventInfo.title,
        start: eventInfo.start,
        end: eventInfo.end,
        extendedProps: {
          location: eventInfo.location,
          description: eventInfo.description,
        },
      };
    },

    editable: true,
    selectable: true,

    dateClick: (info) => {
      // Open modal pre-filled with the clicked date
      openModal({ start: info.date, end: info.date });
    },

    eventClick: (info) => {
      // info.event.id now correctly contains MongoDB _id
      openModal(info.event);
    },
  });

  calendar.render();

  // --- Create/Update ---
  eventForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const eventData = {
      title: eventTitleInput.value,
      start: eventStartInput.value, // "YYYY-MM-DDTHH:MM"
      end: eventEndInput.value || null,
      location: eventLocationInput.value,
      description: eventDescriptionInput.value,
    };

    const eventId = eventIdInput.value;
    const isEditing = !!eventId;
    const url = isEditing ? `/api/events/${encodeURIComponent(eventId)}` : '/api/events';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });

      if (res.ok) {
        closeModal();
        calendar.refetchEvents(); // refresh from server
      } else {
        alert('Error: Could not save event.');
      }
    } catch (error) {
      console.error('Failed to save event:', error);
      alert('Network error while saving the event.');
    }
  });

  // --- Delete ---
  if (deleteEventBtn) {
    deleteEventBtn.addEventListener('click', async () => {
      const eventId = eventIdInput.value;
      if (!eventId) return;

      if (confirm('Are you sure you want to delete this event? This cannot be undone.')) {
        try {
          const res = await fetch(`/api/events/${encodeURIComponent(eventId)}`, { method: 'DELETE' });
          if (res.ok) {
            closeModal();
            calendar.refetchEvents();
          } else {
            alert('Failed to delete event.');
          }
        } catch (error) {
          console.error('Delete error:', error);
          alert('Network error while deleting the event.');
        }
      }
    });
  }

  // --- Cancel ---
  if (cancelEventBtn) {
    cancelEventBtn.addEventListener('click', closeModal);
  }
});
