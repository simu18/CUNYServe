// public/scripts/navbar-dynamic.js (Premium Update)
const navUserSection = document.getElementById('nav-user-section');
const navUserSectionMobile = document.getElementById('nav-user-section-mobile');

async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login.html';
}

function renderNavbarState(user) {
    if (user) {
        const profileLink = user.onboardingStatus === 'profile_complete' ? '/dashboard.html' : '/onboarding-orientation.html';
        const loggedInHTML = `
            <a href="${profileLink}" class="text-gray-100 hover:text-white px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-[#00295c]">My Dashboard</a>
            <button id="navbar-logout-btn" class="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition">Logout</button>
        `;
        const loggedInHTMLMobile = `
            <div class="px-2 space-y-1">
                <a href="${profileLink}" class="block px-3 py-2 rounded-md text-base font-medium text-gray-100 hover:text-white hover:bg-[#00295c] transition">My Dashboard</a>
                <button id="navbar-logout-btn-mobile" class="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-100 hover:text-white hover:bg-[#00295c] transition">Logout</button>
            </div>
        `;
        navUserSection.innerHTML = loggedInHTML;
        navUserSectionMobile.innerHTML = loggedInHTMLMobile;
        document.getElementById('navbar-logout-btn')?.addEventListener('click', handleLogout);
        document.getElementById('navbar-logout-btn-mobile')?.addEventListener('click', handleLogout);
    } else {
        const loggedOutHTML = `<a href="/login.html" class="bg-white text-[#003f7f] px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition">Login</a>`;
        const loggedOutHTMLMobile = `<div class="px-2"><a href="/login.html" class="block w-full text-left bg-white text-[#003f7f] px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition">Login</a></div>`;
        navUserSection.innerHTML = loggedOutHTML;
        navUserSectionMobile.innerHTML = loggedOutHTMLMobile;
    }
}

// Main execution
if (!navUserSection || !navUserSectionMobile) {
    console.error('Navbar placeholder elements not found. Script will not run.');
} else {
    fetch('/api/auth/me')
        .then(response => response.ok ? response.json() : null)
        .then(user => renderNavbarState(user))
        .catch(error => {
            console.error('Error checking authentication status:', error);
            renderNavbarState(null);
        });
}
