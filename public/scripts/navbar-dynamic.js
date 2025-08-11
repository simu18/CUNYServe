// public/scripts/navbar-dynamic.js (Final Simplified Version)

// This script assumes it is being loaded AFTER the navbar HTML has been injected into the DOM.
// The loader script in the main HTML files ensures this happens correctly.

const navUserSection = document.getElementById('nav-user-section');
const navUserSectionMobile = document.getElementById('nav-user-section-mobile');

async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login.html';
}

function renderNavbarState(user) {
    if (user) {
        // User is LOGGED IN
        const profileLink = user.onboardingStatus === 'profile_complete' ? '/dashboard.html' : '/onboarding-orientation.html';
        const loggedInHTML = `
            <a href="${profileLink}" class="text-gray-300 hover:bg-[#003A70] hover:text-white px-3 py-2 rounded-md text-sm font-medium">My Dashboard</a>
            <button id="navbar-logout-btn" class="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700">Logout</button>
        `;
        const loggedInHTMLMobile = `
            <div class="px-2 space-y-1">
                <a href="${profileLink}" class="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-[#003A70]">My Dashboard</a>
                <button id="navbar-logout-btn-mobile" class="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-[#003A70]">Logout</button>
            </div>
        `;
        navUserSection.innerHTML = loggedInHTML;
        navUserSectionMobile.innerHTML = loggedInHTMLMobile;
        document.getElementById('navbar-logout-btn')?.addEventListener('click', handleLogout);
        document.getElementById('navbar-logout-btn-mobile')?.addEventListener('click', handleLogout);
    } else {
        // User is LOGGED OUT
        const loggedOutHTML = `<a href="/login.html" class="bg-white text-[#00539B] px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200">Login</a>`;
        const loggedOutHTMLMobile = `<div class="px-2"><a href="/login.html" class="block w-full text-left bg-white text-[#00539B] px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200">Login</a></div>`;
        navUserSection.innerHTML = loggedOutHTML;
        navUserSectionMobile.innerHTML = loggedOutHTMLMobile;
    }
}

// Main execution
if (!navUserSection || !navUserSectionMobile) {
    console.error('Navbar placeholder elements not found. Script will not run.');
} else {
    fetch('/api/auth/me')
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            return null; // Resolve with null if not authenticated
        })
        .then(user => {
            renderNavbarState(user); // Render based on user object or null
        })
        .catch(error => {
            console.error('Error checking authentication status:', error);
            renderNavbarState(null); // Render logged-out state on error
        });
}