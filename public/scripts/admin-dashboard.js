// 

// public/scripts/admin-dashboard.js (Final Merged Version)

document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENT SELECTORS ---
    const elements = {
        startScrapeBtn: document.getElementById('start-scrape-btn'),
        tableContainer: document.getElementById('events-table-container'),
        historyContainer: document.getElementById('scrape-history-container'),
        scrapeBtnText: document.getElementById('scrape-btn-text'),
        scrapeBtnSpinner: document.getElementById('scrape-btn-spinner'),
        dashboardTitle: document.getElementById('dashboard-title'),
        notificationBell: document.getElementById('notification-bell'),
        notificationBadge: document.getElementById('notification-badge'),
        notificationPanel: document.getElementById('notification-panel'),
        notificationsContainer: document.getElementById('notifications-container'),
        clearNotifications: document.getElementById('clear-notifications'),
        statusIndicator: document.getElementById('status-indicator'),
        pendingCount: document.getElementById('pending-count'),
        approvedCount: document.getElementById('approved-count'),
        rejectedCount: document.getElementById('rejected-count'),
        refreshEvents: document.getElementById('refresh-events'),
        filterDropdown: document.getElementById('filter-dropdown'),
        filterCheckboxes: document.querySelectorAll('#filter-dropdown input[type="checkbox"]'),
        approveAllBtn: document.getElementById('approve-all-btn'),
    };

    // --- STATE ---
    let state = {
        events: [],
        history: [],
        activeFilters: ['unverified'],
        unreadNotifications: 0,
        lastScrapeStatus: 'idle',
    };

    // --- CSS ANIMATIONS ---
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse { 0%, 100% { transform: scale(1);} 50% { transform: scale(1.05);} }
        @keyframes shake { 0%,100% { transform: translateX(0);} 20%,60% { transform: translateX(-5px);} 40%,80% { transform: translateX(5px);} }
        .animate-pulse { animation: pulse 1.5s infinite; }
        .animate-shake { animation: shake 0.5s ease-in-out; }
        .fade-in { animation: fadeIn 0.3s ease-out; }
        .glow-green { box-shadow: 0 0 10px rgba(74, 222, 128, 0.7); }
        .glow-red { box-shadow: 0 0 10px rgba(248, 113, 113, 0.7); }
        .status-badge { transition: all 0.3s ease; position: relative; overflow: hidden; }
        .status-badge::after { content:''; position:absolute; top:-50%; left:-50%; width:200%; height:200%; background:rgba(255,255,255,0.2); transform:rotate(30deg); transition: all 0.3s ease;}
        .status-badge:hover::after { left:100%; }
    `;
    document.head.appendChild(style);

    // --- UI HELPERS ---
    const pulseAnimation = (el) => { el.classList.add('animate-pulse'); setTimeout(() => el.classList.remove('animate-pulse'), 2000); };
    const shakeAnimation = (el) => { el.classList.add('animate-shake'); setTimeout(() => el.classList.remove('animate-shake'), 500); };

    // --- NOTIFICATIONS ---
    const showNotification = (message, type = 'info') => {
        state.unreadNotifications++;
        elements.notificationBadge.textContent = state.unreadNotifications;
        elements.notificationBadge.classList.remove('hidden');
        pulseAnimation(elements.notificationBell);

        const notification = document.createElement('div');
        notification.className = `p-3 mb-2 rounded-lg border-l-4 ${
            type === 'error' ? 'bg-red-50 border-red-500 text-red-700' :
            type === 'success' ? 'bg-green-50 border-green-500 text-green-700' :
            'bg-blue-50 border-blue-500 text-blue-700'
        } fade-in`;
        notification.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <p class="font-medium">${type === 'error' ? 'Error' : type === 'success' ? 'Success' : 'Notice'}</p>
                    <p class="text-sm">${message}</p>
                </div>
                <button class="notification-close text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <div class="mt-1 text-xs text-gray-500">${new Date().toLocaleTimeString()}</div>
        `;
        elements.notificationPanel.insertBefore(notification, elements.notificationPanel.firstChild);
    };

    elements.notificationBell.addEventListener('click', () => {
        elements.notificationPanel.classList.toggle('hidden');
        if (!elements.notificationPanel.classList.contains('hidden')) {
            state.unreadNotifications = 0;
            elements.notificationBadge.classList.add('hidden');
        }
    });

    elements.notificationPanel.addEventListener('click', (e) => {
        if (e.target.classList.contains('notification-close')) {
            e.target.closest('div[class*="bg-"]').remove();
        }
    });

    // --- RENDER FUNCTIONS ---
    const updateStatCards = () => {
        elements.pendingCount.textContent = state.events.filter(e => e.status === 'unverified').length;
        elements.approvedCount.textContent = state.events.filter(e => e.status === 'approved').length;
        elements.rejectedCount.textContent = state.events.filter(e => e.status === 'rejected').length;
    };

    const renderEventsTable = () => {
        const filteredEvents = state.events.filter(e => state.activeFilters.includes(e.status));
        if (!filteredEvents.length) {
            elements.tableContainer.innerHTML = `<div class="text-center py-10"><h3 class="mt-2 text-lg font-medium">No events found</h3></div>`;
            return;
        }
        let html = `<div class="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <tr>
                        <th>Status</th><th>Event Date</th><th>Title</th><th>College</th><th>Actions</th>
                    </tr>
                </thead><tbody>`;
        filteredEvents.forEach(event => {
            const statusColor = {
                approved: { bg: 'bg-green-100', text: 'text-green-800', icon: '✓' },
                rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: '✗' },
                unverified: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⌛' }
            }[event.status];
            html += `<tr>
                <td><span class="status-badge px-3 py-1 inline-flex items-center rounded-full ${statusColor.bg} ${statusColor.text}">${statusColor.icon} ${event.status}</span></td>
                <td>${event.date || 'N/A'}</td>
                <td><a href="${event.sourceUrl}" target="_blank">${event.title}</a></td>
                <td>${event.college}</td>
                <td>
                    <button data-id="${event._id}" data-status="approved" class="approve-btn">Approve</button>
                    <button data-id="${event._id}" data-status="rejected" class="reject-btn">Reject</button>
                </td>
            </tr>`;
        });
        html += `</tbody></table></div>`;
        elements.tableContainer.innerHTML = html;
    };

    const renderHistory = () => {
        if (!state.history.length) {
            elements.historyContainer.innerHTML = `<p class="text-gray-500">No history found</p>`;
            return;
        }
        // keep your old history rendering logic here
    };

    // --- API FUNCTIONS ---
    const fetchAdminData = async () => {
        try {
            const [eventsRes, historyRes] = await Promise.all([
                fetch('/api/admin/scraped-events'),
                fetch('/api/admin/scrape-history')
            ]);
            if (!eventsRes.ok) throw new Error('Could not load events');
            state.events = await eventsRes.json();
            state.history = historyRes.ok ? await historyRes.json() : [];
            updateStatCards();
            renderEventsTable();
            renderHistory();
        } catch (err) {
            elements.tableContainer.innerHTML = `<p class="text-red-500">${err.message}</p>`;
        }
    };

    // --- EVENT HANDLERS ---
    elements.startScrapeBtn.addEventListener('click', () => {
        // keep your old modal confirmation logic here, calling fetch('/api/admin/scrape-events', { method: 'POST' }) and polling
    });

    elements.approveAllBtn.addEventListener('click', async () => {
        const unverified = state.events.filter(e => e.status === 'unverified');
        for (const ev of unverified) {
            await fetch(`/api/admin/scraped-events/${ev._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'approved' })
            });
        }
        fetchAdminData();
    });

    elements.tableContainer.addEventListener('click', async (e) => {
        const btn = e.target.closest('.approve-btn, .reject-btn');
        if (!btn) return;
        const id = btn.dataset.id;
        const status = btn.dataset.status;
        try {
            const res = await fetch(`/api/admin/scraped-events/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                showNotification(`Event ${status} successfully`, 'success');
                fetchAdminData();
            } else throw new Error('Update failed');
        } catch (err) {
            showNotification(err.message, 'error');
            shakeAnimation(btn);
        }
    });

    elements.filterCheckboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            state.activeFilters = Array.from(elements.filterCheckboxes)
                .filter(i => i.checked)
                .map(i => i.value);
            renderEventsTable();
        });
    });

    // --- INITIALIZATION ---
    fetchAdminData();
    elements.filterCheckboxes.forEach(cb => cb.checked = state.activeFilters.includes(cb.value));
});
