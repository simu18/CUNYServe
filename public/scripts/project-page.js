document.addEventListener("DOMContentLoaded", () => {
    const projectGrid = document.getElementById("project-grid");
    const addToCalendarBtn = document.getElementById("add-to-calendar-btn");

    let allProjects = []; // will store public events fetched from DB
    let selectedProject = null; // the one currently in the modal

    // --- Helper: parse times like "8:15PM" into [hours, minutes] ---
    function parseTime(timeStr) {
        if (!timeStr) return [12, 0]; // default to noon
        const lowerTime = timeStr.trim().toLowerCase();
        const isPM = lowerTime.includes("pm");
        let [hours, minutes] = lowerTime.replace("am", "").replace("pm", "").split(":").map(Number);
        minutes = minutes || 0;
        if (isPM && hours < 12) hours += 12;
        if (!isPM && hours === 12) hours = 0;
        return [hours, minutes];
    }

    // --- Render public projects ---
    const renderProjects = (projectsToRender) => {
        projectGrid.innerHTML = "";
        if (projectsToRender.length === 0) {
            projectGrid.innerHTML = "<p>No projects match your filters.</p>";
            return;
        }

        projectsToRender.forEach(project => {
            const projectCard = document.createElement("div");
            projectCard.className = "bg-white p-6 rounded-lg shadow-sm";

            const startDate = new Date(project.start);
            const formattedDate = startDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
            const formattedTime = startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

            projectCard.innerHTML = `
                <div class="flex items-start justify-between">
                    <span class="text-xs font-semibold uppercase text-red-600">${project.partnerName || "CUNY"}</span>
                </div>
                <h3 class="text-xl font-bold mt-2 text-gray-900">${project.title}</h3>
                <p class="text-sm text-gray-600 mt-2">${project.description.substring(0, 100)}...</p>
                <div class="mt-4 pt-4 border-t">
                    <div class="flex items-center text-sm text-gray-500">
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        <span>${formattedDate} at ${formattedTime}</span>
                    </div>
                    <div class="flex items-center text-sm text-gray-500 mt-2">
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        <span>${project.location || "See Source"}</span>
                    </div>
                    <button onclick="openModalFromDB('${project._id}')" class="text-[#00539B] hover:underline text-sm font-medium mt-3">View Details</button>
                </div>
            `;
            projectGrid.appendChild(projectCard);
        });
    };

    // --- Open modal for selected project ---
    window.openModalFromDB = (projectId) => {
        selectedProject = allProjects.find(p => p._id === projectId);
        if (selectedProject) {
            // Example: pass event data to your existing modal system
            openModal(
                selectedProject.title,
                selectedProject.partnerName,
                selectedProject.description,
                "#",
                new Date(selectedProject.start).toLocaleString(),
                new Date(selectedProject.start).toISOString().split("T")[0],
                selectedProject.address,
                selectedProject.mapURL
            );
        }
    };

    // --- Add to calendar button handler ---
    if (addToCalendarBtn) {
        addToCalendarBtn.addEventListener("click", async () => {
            if (!selectedProject) {
                alert("No project selected.");
                return;
            }

            // Check if user is logged in
            let isLoggedIn = false;
            try {
                const res = await fetch("/api/auth/me");
                if (res.ok) isLoggedIn = true;
            } catch (error) {
                isLoggedIn = false;
            }

            if (!isLoggedIn) {
                alert("Please log in to add events to your calendar.");
                window.location.href = "/login.html";
                return;
            }

            try {
                const startDate = new Date(selectedProject.start);
                const endDate = selectedProject.end
                    ? new Date(selectedProject.end)
                    : new Date(startDate.getTime() + 60 * 60 * 1000);

                if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                    throw new Error("Invalid event dates");
                }

                const eventData = {
                    title: selectedProject.title,
                    start: startDate.toISOString(),
                    end: endDate.toISOString(),
                    location: selectedProject.address,
                    description: `Volunteer for: ${selectedProject.partnerName}. More details on the site.`
                };

                const res = await fetch("/api/events", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(eventData)
                });

                if (res.ok) {
                    alert(`'${eventData.title}' has been added to your calendar!`);
                    if (window.closeModal) window.closeModal();
                } else {
                    alert("Failed to add event. It might already be in your schedule.");
                }
            } catch (error) {
                console.error("Error adding event to calendar:", error);
                alert("Could not process event time. Please try again.");
            }
        });
    }

    // --- Fetch public events ---
    const fetchPublicEvents = async () => {
        try {
            const res = await fetch("/api/events/public");
            allProjects = await res.json();
            renderProjects(allProjects);
        } catch (error) {
            console.error("Failed to fetch public events:", error);
            projectGrid.innerHTML = "<p>Could not load volunteer projects at this time.</p>";
        }
    };

    fetchPublicEvents();
});
