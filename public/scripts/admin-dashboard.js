// public/scripts/admin-dashboard.js

document.addEventListener('DOMContentLoaded', () => {
    const startScrapeBtn = document.getElementById('start-scrape-btn');
    const tableContainer = document.getElementById('events-table-container');

    const fetchAndRenderEvents = async () => {
        try {
            const res = await fetch('/api/admin/scraped-events');
            if (!res.ok) {
                if (res.status === 403) alert('Admin access required.');
                tableContainer.innerHTML = '<p class="text-red-500">Could not load events. You may not be logged in as an admin.</p>';
                return;
            }
            const events = await res.json();
            
            if (events.length === 0) {
                tableContainer.innerHTML = '<p>No scraped events found. Try starting a new scrape.</p>';
                return;
            }

            let tableHTML = `
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50"><tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">College</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr></thead>
                    <tbody class="bg-white divide-y divide-gray-200">`;
            
            events.forEach(event => {
                tableHTML += `
                    <tr>
                        <td class="px-6 py-4"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${event.status === 'approved' ? 'bg-green-100 text-green-800' : 
                              event.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}">
                            ${event.status}
                        </span></td>
                        <td class="px-6 py-4 text-sm text-gray-900"><a href="${event.sourceUrl}" target="_blank" class="hover:underline">${event.title}</a></td>
                        <td class="px-6 py-4 text-sm text-gray-500">${event.college}</td>
                        <td class="px-6 py-4 text-sm font-medium">
                            <button data-id="${event._id}" data-status="approved" class="approve-btn text-green-600 hover:text-green-900 mr-4">Approve</button>
                            <button data-id="${event._id}" data-status="rejected" class="reject-btn text-red-600 hover:text-red-900">Reject</button>
                        </td>
                    </tr>`;
            });

            tableHTML += `</tbody></table>`;
            tableContainer.innerHTML = tableHTML;
        } catch (error) {
            console.error(error);
        }
    };

    startScrapeBtn.addEventListener('click', async () => {
        if (!confirm('This will start the scraping process, which can take several minutes. Continue?')) return;
        
        try {
            const res = await fetch('/api/admin/scrape-events', { method: 'POST' });
            const data = await res.json();
            alert(data.msg);
        } catch (error) {
            alert('Failed to start scraper.');
        }
    });
    
    tableContainer.addEventListener('click', async (e) => {
        const target = e.target;
        if (target.matches('.approve-btn, .reject-btn')) {
            const id = target.dataset.id;
            const status = target.dataset.status;
            
            try {
                const res = await fetch(`/api/admin/scraped-events/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status })
                });
                if (res.ok) {
                    fetchAndRenderEvents(); // Refresh table on success
                } else {
                    alert('Failed to update status.');
                }
            } catch (error) {
                console.error(error);
            }
        }
    });

    fetchAndRenderEvents(); // Initial load
});