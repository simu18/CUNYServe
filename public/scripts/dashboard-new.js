document.addEventListener('DOMContentLoaded', async () => {
  // ======================
  // 1. DOM Elements Setup
  // ======================
  const calendarEl = document.getElementById('calendar');
  const welcomeMessage = document.getElementById('welcome-message');
  const themeToggle = document.getElementById('theme-toggle');
  const sunIcon = document.getElementById('sun-icon');
  const moonIcon = document.getElementById('moon-icon');

  // Sidebar Elements
  const sidebarAvatar = document.getElementById('sidebar-avatar');
  const sidebarName = document.getElementById('sidebar-name');
  const sidebarDetails = document.getElementById('sidebar-details');
  const sidebarProgress = document.getElementById('sidebar-progress-section');

  // Modal Elements
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
  const modalCloseBtn = document.getElementById('modal-close-btn');

  // ======================
  // 2. Theme Management
  // ======================
  function initTheme() {
      const darkMode = localStorage.getItem('darkMode') === 'true';
      document.documentElement.classList.toggle('dark', darkMode);
      moonIcon.classList.toggle('hidden', !darkMode);
      sunIcon.classList.toggle('hidden', darkMode);
  }

  themeToggle.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('darkMode', isDark);
      moonIcon.classList.toggle('hidden', !isDark);
      sunIcon.classList.toggle('hidden', isDark);
  });

  // ======================
  // 3. User Data Loading
  // ======================
  let currentUser = null;
  let userProfile = null;

  async function loadUserData() {
      try {
          const res = await fetch('/api/profile/all');
          if (!res.ok) throw new Error('Failed to fetch user data');
          
          const allData = await res.json();
          currentUser = allData.user || {};
          userProfile = allData.profile || {};
          
          updateUI();
      } catch (error) {
          console.error('Error loading user data:', error);
          window.location.href = '/login.html';
      }
  }

  function updateUI() {
      // Welcome Message with Time-Based Greeting
      updateGreeting();
      
      // Avatar and Name
      if (sidebarAvatar) sidebarAvatar.src = currentUser?.profilePicture || '/uploads/default-avatar.png';
      if (sidebarName) sidebarName.textContent = currentUser?.name || 'User';
      
      // Populate Sidebar Cards
      populateSidebarDetails();
      
      // Onboarding Status
      updateOnboardingStatus();
  }

  function updateGreeting() {
      const hour = new Date().getHours();
      const greetings = {
          morning: "🌤️ Good morning",
          afternoon: "☀️ Good afternoon", 
          evening: "🌙 Good evening"
      };
      const period = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
      
      if (welcomeMessage) {
          welcomeMessage.textContent = `${greetings[period]}, ${currentUser?.name?.split(' ')[0] || 'there'}!`;
      }
  }

  function populateSidebarDetails() {
      if (!sidebarDetails) return;

      const createCard = (title, contentHtml) => `
          <div class="group perspective-1000">
              <div class="sidebar-card transition-all duration-300 group-hover:rotate-y-6">
                  <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">${title}</h3>
                  <div class="text-sm">${contentHtml}</div>
              </div>
          </div>
      `;

      let detailsHtml = '';

      // Bio
      if (userProfile?.bio) {
          detailsHtml += createCard('Bio', `<p class="text-gray-700 italic">"${userProfile.bio}"</p>`);
      }

      // Contact Info
      detailsHtml += createCard('Contact', `
          ${currentUser?.email ? `<p class="mb-1"><span class="font-medium">Email:</span> ${currentUser.email}</p>` : ''}
          ${currentUser?.phone ? `<p><span class="font-medium">Phone:</span> ${currentUser.phone}</p>` : ''}
      `);

      // Skills
      if (userProfile?.skills?.length) {
          detailsHtml += createCard('Skills', `
              <div class="flex flex-wrap gap-1">
                  ${userProfile.skills.map(skill => `
                      <span class="tag tag-blue">${skill}</span>
                  `).join('')}
              </div>
          `);
      }

      // Causes
      if (userProfile?.causes?.length) {
          detailsHtml += createCard('Causes', `
              <div class="flex flex-wrap gap-1">
                  ${userProfile.causes.map(cause => `
                      <span class="tag tag-green">${cause}</span>
                  `).join('')}
              </div>
          `);
      }

      sidebarDetails.innerHTML = detailsHtml;
  }

  function updateOnboardingStatus() {
      if (!sidebarProgress) return;

      const isComplete = currentUser?.onboardingStatus === 'profile_complete';
      
      sidebarProgress.innerHTML = `
          <div class="group perspective-1000">
              <div class="sidebar-card transition-all duration-300 group-hover:rotate-y-6">
                  <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Profile Status</h3>
                  <div class="flex items-center justify-between">
                      <span class="status-badge ${isComplete ? 'status-complete' : 'status-incomplete'}">
                          ${isComplete ? '✓ Complete' : '! Incomplete'}
                      </span>
                      <a href="${isComplete ? '/profile-edit.html' : '/onboarding-orientation.html'}" 
                         class="text-sm ${isComplete ? 'text-blue-600 hover:text-blue-800' : 'text-amber-600 hover:text-amber-800'} font-medium">
                          ${isComplete ? 'View Profile' : 'Continue Setup'}
                      </a>
                  </div>
              </div>
          </div>
      `;
  }

  // ======================
  // 4. Calendar Setup
  // ======================
  function initCalendar() {
      const calendar = new FullCalendar.Calendar(calendarEl, {
          initialView: 'dayGridMonth',
          headerToolbar: {
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay addEventButton'
          },
          customButtons: {
              addEventButton: {
                  text: '+ Add Schedule',
                  click: () => openModal()
              }
          },
          events: { 
              url: '/api/events',
              failure: () => showToast('Error loading events', 'error')
          },
          eventDataTransform: (eventInfo) => ({
              id: eventInfo._id,
              title: eventInfo.title,
              start: eventInfo.start,
              end: eventInfo.end,
              extendedProps: {
                  location: eventInfo.location,
                  description: eventInfo.description
              }
          }),
          editable: true,
          selectable: true,
          dayMaxEvents: true,
          eventDidMount: (info) => {
              // Add online meeting icon
              if (info.event.extendedProps?.location?.toLowerCase().includes('online')) {
                  info.el.classList.add('fc-event-online');
                  const icon = document.createElement('span');
                  icon.innerHTML = ' 📹';
                  info.el.querySelector('.fc-event-title').appendChild(icon);
              }
          },
          dateClick: (info) => {
              // Auto-set times for new events
              const start = new Date(info.date);
              const end = new Date(start);
              end.setHours(start.getHours() + 1);
              
              openModal({
                  start: start,
                  end: end
              });
          },
          eventClick: (info) => openModal(info.event)
      });

      calendar.render();
      return calendar;
  }

  // ======================
  // 5. Modal Control
  // ======================
  function openModal(data = {}) {
      const isEventApi = typeof data.getProp === 'function';
      const normalized = isEventApi ? {
          id: data.id,
          title: data.title,
          start: data.start,
          end: data.end,
          extendedProps: data.extendedProps || {}
      } : {
          id: data.id || '',
          title: data.title || '',
          start: data.start || data.startStr || '',
          end: data.end || data.endStr || '',
          extendedProps: data.extendedProps || {}
      };

      modalTitle.textContent = normalized.id ? 'Edit Schedule' : 'Add Schedule';
      eventIdInput.value = normalized.id || '';
      eventTitleInput.value = normalized.title || '';
      eventStartInput.value = toLocalISOString(normalized.start);
      eventEndInput.value = toLocalISOString(normalized.end);
      eventLocationInput.value = normalized.extendedProps?.location || '';
      eventDescriptionInput.value = normalized.extendedProps?.description || '';

      deleteEventBtn.classList.toggle('hidden', !normalized.id);
      eventModal.classList.remove('hidden');
      document.body.classList.add('overflow-hidden');
  }

  function closeModal() {
      eventModal.classList.add('hidden');
      document.body.classList.remove('overflow-hidden');
  }

  function toLocalISOString(date) {
      if (!date) return '';
      const d = new Date(date);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      return d.toISOString().slice(0, 16);
  }

  // ======================
  // 6. Event Management
  // ======================
  async function handleEventSubmit(e) {
      e.preventDefault();
      
      // Auto-set end time if missing
      let endTime = eventEndInput.value;
      if (!endTime && eventStartInput.value) {
          const start = new Date(eventStartInput.value);
          start.setHours(start.getHours() + 1);
          endTime = start.toISOString().slice(0, 16);
      }

      const eventData = {
          title: eventTitleInput.value.trim(),
          start: eventStartInput.value,
          end: endTime,
          location: eventLocationInput.value.trim(),
          description: eventDescriptionInput.value.trim()
      };

      const eventId = eventIdInput.value;
      const url = eventId ? `/api/events/${encodeURIComponent(eventId)}` : '/api/events';
      const method = eventId ? 'PUT' : 'POST';

      try {
          const res = await fetch(url, {
              method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(eventData)
          });

          if (res.ok) {
              closeModal();
              calendar.refetchEvents();
              showToast(`Event ${eventId ? 'updated' : 'created'} successfully`);
          } else {
              throw new Error(await res.text());
          }
      } catch (error) {
          console.error('Event save error:', error);
          showToast('Failed to save event', 'error');
      }
  }

  async function handleEventDelete() {
      const eventId = eventIdInput.value;
      if (!eventId) return;

      if (confirm('Are you sure you want to delete this event?')) {
          try {
              const res = await fetch(`/api/events/${encodeURIComponent(eventId)}`, {
                  method: 'DELETE'
              });

              if (res.ok) {
                  closeModal();
                  calendar.refetchEvents();
                  showToast('Event deleted');
              } else {
                  throw new Error(await res.text());
              }
          } catch (error) {
              console.error('Delete error:', error);
              showToast('Failed to delete event', 'error');
          }
      }
  }

  // ======================
  // 7. Utility Functions
  // ======================
  function showToast(message, type = 'success') {
      const toast = document.createElement('div');
      toast.className = `fixed bottom-6 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-md shadow-lg text-white ${
          type === 'error' ? 'bg-red-500' : 'bg-green-500'
      } animate-fade-in-out z-50`;
      toast.textContent = message;
      document.body.appendChild(toast);
      
      setTimeout(() => {
          toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
          setTimeout(() => toast.remove(), 300);
      }, 3000);
  }

  // ======================
  // 8. Initialize Everything
  // ======================
  initTheme();
  await loadUserData();
  const calendar = initCalendar();

  // Event Listeners
  eventForm.addEventListener('submit', handleEventSubmit);
  deleteEventBtn.addEventListener('click', handleEventDelete);
  cancelEventBtn.addEventListener('click', closeModal);
  modalCloseBtn.addEventListener('click', closeModal);

  // Date Copy on Calendar Click
  calendarEl.addEventListener('click', (e) => {
      const dayEl = e.target.closest('.fc-day');
      if (dayEl && dayEl.dataset.date) {
          navigator.clipboard.writeText(dayEl.dataset.date);
          showToast(`Copied ${dayEl.dataset.date} to clipboard`);
      }
  });

  // Update greeting every minute
  setInterval(updateGreeting, 60000);
});