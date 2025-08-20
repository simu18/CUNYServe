// Global variables
let visibleProjectsCount = 6;
let filteredProjectsList = [];
let allProjectsData = [];
let selectedProjectItem = null;
let activeTagFiltersList = [];

document.addEventListener("DOMContentLoaded", () => {
    const projectGrid = document.getElementById("projectGrid");
    const addToCalendarBtn = document.getElementById("add-to-calendar-btn");
    const keywordInput = document.getElementById("keywordInput");
    const campusFilter = document.getElementById("campusFilter");
    const typeFilter = document.getElementById("typeFilter");
    const durationFilter = document.getElementById("durationFilter");
    const sortFilter = document.getElementById("sortFilter");
    const tagFilterButtons = document.querySelectorAll(".tag-filter-btn");
    const loadMoreBtn = document.getElementById("loadMoreBtn");
    const loadingIndicator = document.getElementById("loadingIndicator");
    const emptyState = document.getElementById("emptyState");
    const countDisplay = document.getElementById("projectCount");
    
    // Static project data as fallback
    const staticProjectData = [
        {
            id: "tech-mentorship-teens",
            title: "Tech Mentorship for Teens",
            org: "CodeLink NYC",
            type: "Mentoring",
            format: "Hybrid",
            campus: "Baruch College",
            location: "Baruch College Library + Zoom",
            tags: ["short-term", "cuny", "youth", "hybrid"],
            description: "Mentor high school students in coding and digital skills through workshops and 1:1 sessions.",
            dateTime: "Sat, Sept 14, 2025 | 12PM – 2PM",
            dateISO: "2025-09-14",
            address: "Baruch College Library",
            mapURL: "https://www.google.com/maps?q=Baruch+College+Library,+NYC&output=embed",
            directions: "Meet at Baruch Library. Virtual links provided 24hrs before each session.",
            logistics: "Must attend 1 in-person session per month. Commitment: 6 weeks. Training + support provided.",
            partnerInfo: "CodeLink NYC supports underrepresented youth in building tech skills. Learn more at www.codelinknyc.org",
            orientationLink: "https://codelinknyc.org/orientation",
            duration: "short-term"
        },
        {
            id: "community-garden-restoration",
            title: "Community Garden Restoration",
            org: "Greenspace Queens",
            type: "Environmental",
            format: "In-person",
            campus: "Queens College",
            location: "Green Path Garden, 85-19 Main St, Queens, NY 11367",
            tags: ["short-term", "cuny", "environment"],
            description: "Help clean, plant, and restore a local garden space used by families and seniors in Queens.",
            dateTime: "Sun, Sept 22, 2025 | 10AM – 1PM",
            dateISO: "2025-09-22",
            address: "85-19 Main St, Queens, NY 11367",
            mapURL: "https://www.google.com/maps?q=85-19+Main+St,+Queens,+NY&output=embed",
            directions: "Take the Q44 bus to Main St & 85th Ave. Meet at the garden gate at 9:50AM.",
            logistics: "Wear clothes you can get dirty. Gloves and tools provided. Rain date: Sept 29.",
            partnerInfo: "Greenspace Queens promotes urban gardening and food justice. Visit greenspacequeens.org for more.",
            orientationLink: "https://greenspacequeens.org/orientation",
            duration: "short-term"
        },
        {
            id: "digital-storytelling-immigrants",
            title: "Digital Storytelling for Immigrants",
            org: "Voices Without Borders",
            type: "Education",
            format: "Remote",
            campus: "Hunter College",
            location: "Remote via Zoom + Shared Docs",
            tags: ["long-term", "cuny", "remote", "education"],
            description: "Help immigrants share their journeys by editing video/audio stories and assisting with basic digital tools.",
            dateTime: "Flexible | 3–5 hours/week",
            dateISO: "",
            address: "Remote",
            mapURL: "https://www.google.com/maps?q=Hunter+College,+New+York&output=embed",
            directions: "Orientation via Zoom. Support team available for tech help.",
            logistics: "Must commit to 1 story project (2–3 weeks). Basic editing skills a plus, but not required.",
            partnerInfo: "Voices Without Borders helps immigrant voices reach the world. Learn more at voiceswithoutborders.org",
            orientationLink: "https://voiceswithoutborders.org/orientation",
            duration: "long-term"
        },
        {
            id: "rescue-good-food",
            title: "Rescue Good Food",
            org: "Rescuing Leftover Cuisine",
            type: "Food Justice",
            format: "In-person",
            campus: "City College",
            location: "Breads Bakery, 18 E 16th St, New York, NY 10003",
            tags: ["short-term", "cuny", "food"],
            description: "Rescue food from Union Square bakery and deliver it to a local shelter.",
            dateTime: "Sat Aug 9, 2025 | 8:15PM - 9PM",
            dateISO: "2025-08-09",
            address: "18 E 16th St, New York, NY 10003",
            mapURL: "https://www.google.com/maps?q=18+E+16th+St,+New+York,+NY+10003&output=embed",
            directions: "From Union Square station, head west on 16th Street. You will see the location on your left in the middle of the block.",
            logistics: "Must walk ~1 mile, stand for 1 hour, and carry 10–20 lbs. Drop-off is at 56 2nd Ave, 2nd floor, NY 10003.",
            partnerInfo: "Rescuing Leftover Cuisine helps reduce food waste by delivering excess food to shelters. www.rescuingleftovercuisine.org",
            orientationLink: "https://www.newyorkcares.org/orientation",
            duration: "short-term"
        },
        {
            "id": "aarp-community-volunteers-4c8e2a1b",
            "title": "AARP: Community Volunteers",
            "org": "AARP",
            "type": "Community Support",
            "format": "Hybrid",
            "campus": "Non-CUNY",
            "location": "",
            "tags": ["long-term","seniors","hybrid"],
            "description": "Join AARP's community of volunteers — in person or from home — to improve the lives of older Americans and their families.",
            "orientationLink": "https://www.aarp.org/volunteer/?CMP=KNC-DSO-Adobe-Bing-CTG-Brand-AARPVolunteer-Volunteer-Exact-General&gclid=92f932c3194f199c33955a5f1873b10f&gclsrc=3p.ds&msclkid=92f932c3194f199c33955a5f1873b10f&utm_source=bing&utm_medium=cpc&utm_campaign=CTG-Brand-AARPVolunteer-Volunteer-Exact&utm_term=volunteers%20aarp&utm_content=General",
            "duration": "long-term"
        },
        {
            "id": "americorps-service-ops-7f8a9b0c",
            "title": "AmeriCorps: Volunteer & Service Opportunities",
            "org": "AmeriCorps",
            "type": "Service Program",
            "format": "Hybrid",
            "campus": "Non-CUNY",
            "location": "",
            "tags": ["long-term"],
            "description": "Find service opportunities across the U.S. in education, health, disaster services, and more.",
            "applyUrl": "https://www.americorps.gov/join/find-volunteer-opportunity#/"
          },
          {
            "id": "bbbs-mentor-2a3b4c5d",
            "title": "Big Brothers Big Sisters",
            "org": "Big Brothers Big Sisters of America",
            "type": "Mentoring",
            "format": "In-Person",
            "campus": "Non-CUNY",
            "location": "",
            "tags": ["long-term","youth"],
            "description": "Mentor youth and support life-changing relationships.",
            "applyUrl": "https://www.bbbs.org/"
          },
          {
            "id": "catchafire-skills-based-9d8e7f6a",
            "title": "Catchafire: Skills-Based Volunteering",
            "org": "Catchafire",
            "type": "Skills-Based",
            "format": "Remote",
            "campus": "Non-CUNY",
            "location": "",
            "tags": ["long-term","remote","skills"],
            "description": "Volunteer your professional skills to nonprofits (remote projects).",
            "applyUrl": "https://www.catchafire.org/volunteer-explore/"
          },
          {
            "id": "childrens-aid-group-volunteering-3c2b1a0d",
            "title": "Children’s Aid – Group Volunteering",
            "org": "Children’s Aid",
            "type": "Community Support",
            "format": "In-Person",
            "campus": "Non-CUNY",
            "location": "",
            "tags": ["long-term","groups"],
            "description": "Group volunteerism to support children, youth, and families in NYC.",
            "applyUrl": "https://www.childrensaidnyc.org/programs/volunteering"
          },
          {
            "id": "dosomething-campaigns-7e6d5c4b",
            "title": "DoSomething",
            "org": "DoSomething.org",
            "type": "Civic Action",
            "format": "Hybrid",
            "campus": "Non-CUNY",
            "location": "",
            "tags": ["long-term","youth"],
            "description": "Join campaigns on climate, mental health, and more; act with other changemakers.",
            "applyUrl": "https://dosomething.org/"
          },
          {
            "id": "kings-bay-y-1a2b3c4d",
            "title": "Kings Bay Y – Volunteer",
            "org": "Kings Bay Y",
            "type": "Community Support",
            "format": "In-Person",
            "campus": "Non-CUNY",
            "location": "Brooklyn",
            "tags": ["long-term","brooklyn"],
            "description": "Support community programs and events in South Brooklyn.",
            "applyUrl": "https://www.kingsbayy.org/volunteer/"
          },
          {
            "id": "nypl-volunteer-0a9b8c7d",
            "title": "NYPL – Volunteer at the Library",
            "org": "New York Public Library",
            "type": "Education",
            "format": "In-Person",
            "campus": "Non-CUNY",
            "location": "NYC",
            "tags": ["long-term","libraries"],
            "description": "Volunteer across branches in NYC supporting literacy and programs.",
            "applyUrl": "https://www.nypl.org/about/volunteer-at-nypl"
          },
          {
            "id": "nyc-second-chance-rescue-8f7e6d5c",
            "title": "NYC Second Chance Rescue",
            "org": "NYC Second Chance Rescue",
            "type": "Animal Welfare",
            "format": "In-Person",
            "campus": "Non-CUNY",
            "location": "NYC",
            "tags": ["long-term","animals"],
            "description": "Support animal rescue operations for dogs and cats (21+).",
            "applyUrl": "https://nycsecondchancerescue.org/volunteer/"
          },
          {
            "id": "project-gutenberg-volunteer-4d3c2b1a",
            "title": "Project Gutenberg – Volunteer",
            "org": "Project Gutenberg",
            "type": "Digital Volunteering",
            "format": "Remote",
            "campus": "Non-CUNY",
            "location": "",
            "tags": ["long-term","remote","literacy"],
            "description": "Help with digitization and proofreading of public-domain books.",
            "applyUrl": "https://www.gutenberg.org/help/volunteers_faq.html"
          },
          {
            "id": "twb-translators-9a8b7c6d",
            "title": "Translators without Borders",
            "org": "Translators without Borders",
            "type": "Translation",
            "format": "Remote",
            "campus": "Non-CUNY",
            "location": "",
            "tags": ["long-term","remote","languages"],
            "description": "Use your language skills to support humanitarian and development projects.",
            "applyUrl": "https://translatorswithoutborders.org/meet-the-twb-community"
          },
          {
            "id": "unv-youth-volunteers-1b2c3d4e",
            "title": "United Nations Volunteers (including UN Youth Volunteers)",
            "org": "United Nations Volunteers",
            "type": "International Volunteering",
            "format": "Hybrid",
            "campus": "Non-CUNY",
            "location": "Global",
            "tags": ["long-term","international"],
            "description": "Volunteer with UN agencies on development and humanitarian operations worldwide.",
            "applyUrl": "https://app.unv.org/"
          },
          {
            "id": "voa-gn-ny-6e5d4c3b",
            "title": "Volunteers of America – Greater New York",
            "org": "Volunteers of America-Greater New York",
            "type": "Community Support",
            "format": "In-Person",
            "campus": "Non-CUNY",
            "location": "NYC",
            "tags": ["long-term"],
            "description": "Anti-poverty programs serving neighbors in need across NYC.",
            "applyUrl": "https://www.voa.org/affiliates/volunteers-of-america-greater-new-york/"
          },
          {
            "id": "ymca-volunteer-7c6b5a4d",
            "title": "YMCA – Volunteer",
            "org": "YMCA",
            "type": "Community Support",
            "format": "In-Person",
            "campus": "Non-CUNY",
            "location": "NYC + Nationwide",
            "tags": ["long-term"],
            "description": "Support youth mentoring, wellness programs, and community events.",
            "applyUrl": "https://www.ymca.org/get-involved/volunteer"
          },
          {
            "id": "acc-nyc-volunteer-2d3e4f5a",
            "title": "Animal Care Centers of NYC – Volunteer",
            "org": "ACC of NYC",
            "type": "Animal Welfare",
            "format": "In-Person",
            "campus": "Non-CUNY",
            "location": "NYC",
            "tags": ["long-term","animals"],
            "description": "Help care for animals in NYC shelters; various roles available.",
            "applyUrl": "https://www.nycacc.org/volunteer"
          },
          {
            "id": "aspca-volunteer-1a2b3c4d",
            "title": "ASPCA – Volunteer",
            "org": "ASPCA",
            "type": "Animal Welfare",
            "format": "In-Person",
            "campus": "Non-CUNY",
            "location": "NYC",
            "tags": ["long-term","animals"],
            "description": "Opportunities in adoptions, fostering, rescue & rehab, and advocacy.",
            "applyUrl": "https://www.aspca.org/get-involved/volunteer"
          },
          {
            "id": "best-friends-nyc-5f4e3d2c",
            "title": "Best Friends Animal Society – NYC",
            "org": "Best Friends Animal Society",
            "type": "Animal Welfare",
            "format": "In-Person",
            "campus": "Non-CUNY",
            "location": "NYC",
            "tags": ["long-term","animals"],
            "description": "Volunteer to help shelter pets find homes in NYC.",
            "applyUrl": "https://bestfriends.org/new-york-city/volunteer"
          },
          {
            "id": "rescue-city-volunteer-4c3b2a1d",
            "title": "Rescue City – Volunteer",
            "org": "Rescue City",
            "type": "Animal Welfare",
            "format": "In-Person",
            "campus": "Non-CUNY",
            "location": "NYC",
            "tags": ["long-term","animals"],
            "description": "Support rescue efforts for dogs; roles include transport, events, and more.",
            "applyUrl": "https://www.rescuecity.nyc/volunteering/"
          },
          {
            "id": "humane-society-ny-volunteer-0f1e2d3c",
            "title": "Humane Society of New York – Volunteer",
            "org": "Humane Society of New York",
            "type": "Animal Welfare",
            "format": "In-Person",
            "campus": "Non-CUNY",
            "location": "NYC",
            "tags": ["long-term","animals"],
            "description": "Volunteer in a variety of roles from advocacy to animal care.",
            "applyUrl": "https://www.humaneworld.org/en/take-action/volunteer#.UoqWadKkpc8"
          },
          {
            "id": "cuny-volunteer-corps-citizenship-now-2b1c3d4e",
            "title": "CUNY Volunteer Corps (Citizenship Now!)",
            "org": "CUNY",
            "type": "Civic Engagement",
            "format": "Hybrid",
            "campus": "Multi-CUNY",
            "location": "NYC",
            "tags": ["long-term","cuny"],
            "description": "Assist immigrant communities through Citizenship Now! volunteer efforts.",
            "applyUrl": "https://www.cuny.edu/about/administration/offices/communications-marketing/citizenship-now/volunteer/"
          },
          {
            "id": "baruch-alumni-volunteer-7a6b5c4d",
            "title": "Baruch College Alumni – Volunteer",
            "org": "Baruch College",
            "type": "Mentoring",
            "format": "Hybrid",
            "campus": "Baruch College",
            "location": "NYC",
            "tags": ["long-term","cuny"],
            "description": "Volunteer with Baruch alumni programs and mentorship.",
            "applyUrl": "https://www.alumni.baruch.cuny.edu/get-involved/volunteer"
          },
          {
            "id": "brooklyn-college-volunteer-intake-1c2b3a4d",
            "title": "Brooklyn College – Volunteer Intake",
            "org": "Brooklyn College",
            "type": "Campus Volunteering",
            "format": "Hybrid",
            "campus": "Brooklyn College",
            "location": "Brooklyn",
            "tags": ["long-term","cuny"],
            "description": "Submit volunteer interest to support campus initiatives.",
            "applyUrl": "https://www.brooklyn.edu/dosa/student-support-services/ce/volunteer-intake-form/"
          },
          {
            "id": "brooklyn-lifelong-learning-volunteer-5e6d7c8b",
            "title": "Brooklyn Lifelong Learning – Volunteer",
            "org": "Brooklyn College",
            "type": "Education",
            "format": "Hybrid",
            "campus": "Brooklyn College",
            "location": "Brooklyn",
            "tags": ["long-term","cuny"],
            "description": "Support the Brooklyn Lifelong Learning community programs.",
            "applyUrl": "https://www.brooklyn.edu/bll/volunteer/"
          },
          {
            "id": "city-tech-alumni-involved-3b2a1c4d",
            "title": "City Tech – Alumni Get Involved",
            "org": "City Tech (CUNY)",
            "type": "Mentoring",
            "format": "Hybrid",
            "campus": "City Tech",
            "location": "Brooklyn",
            "tags": ["long-term","cuny"],
            "description": "Volunteer with City Tech alumni programs.",
            "applyUrl": "https://www.citytech.cuny.edu/alumni/get-involved.aspx"
          },
          {
            "id": "ccny-food-policy-center-7d6c5b4a",
            "title": "CCNY – CUNY Career Mentorship Program (CMP)",
            "org": "City College of New York",
            "type": "Mentoring",
            "format": "Hybrid",
            "campus": "CCNY",
            "location": "NYC",
            "tags": ["long-term","cuny"],
            "description": "CUNY alumni mentor students who then mentor NYC high school students.",
            "applyUrl": "https://www.ccny.cuny.edu/oiacer/cmp"
          },
          {
            "id": "ccny-umaan-mentors-1d2c3b4a",
            "title": "CCNY – UMAAN (Urban Mentoring & Achievement Network)",
            "org": "City College of New York",
            "type": "Mentoring",
            "format": "Hybrid",
            "campus": "CCNY",
            "location": "NYC",
            "tags": ["long-term","cuny"],
            "description": "Peer mentoring, workshops, and resources for success.",
            "applyUrl": "https://www.ccny.cuny.edu/umaan/mentors"
          },
          {
            "id": "hunter-has-heart-6a5b4c3d",
            "title": "Hunter Has Heart (Triple H)",
            "org": "Hunter College",
            "type": "Campus Volunteering",
            "format": "Hybrid",
            "campus": "Hunter College",
            "location": "NYC",
            "tags": ["long-term","cuny"],
            "description": "Student engagement and service opportunities under the Triple H banner.",
            "applyUrl": "https://hunter.cuny.edu/students/campus-life/student-events-and-programs/hunter-has-heart-triple-h/"
          },
          {
            "id": "hunter-nyc-food-policy-center-4a3b2c1d",
            "title": "Hunter College – NYC Food Policy Center",
            "org": "Hunter College",
            "type": "Community Support",
            "format": "Hybrid",
            "campus": "Hunter College",
            "location": "NYC",
            "tags": ["long-term","cuny"],
            "description": "Volunteer to support research and programs in food policy.",
            "applyUrl": "https://www.nycfoodpolicy.org/"
          },
          {
            "id": "hunter-phmi-mentoring-8a7b6c5d",
            "title": "Hunter College – PHMI (Pre-Health Mentoring Initiative)",
            "org": "Hunter College",
            "type": "Mentoring",
            "format": "Hybrid",
            "campus": "Hunter College",
            "location": "NYC",
            "tags": ["long-term","pre-med","cuny"],
            "description": "Upper-class pre-health students mentor freshmen and first-year transfers.",
            "applyUrl": "https://www.hunter.cuny.edu/prehealth/mentoring-initiatives-1/about-phmi"
          },
          {
            "id": "hunter-orientation-leaders-9b8c7d6e",
            "title": "Hunter – Orientation Leaders",
            "org": "Hunter College",
            "type": "Campus Volunteering",
            "format": "In-Person",
            "campus": "Hunter College",
            "location": "NYC",
            "tags": ["long-term","cuny"],
            "description": "Support new students during orientation; share your Hunter experience.",
            "applyUrl": ""
          },
          {
            "id": "medgar-evers-peer-services-0a1b2c3d",
            "title": "Medgar Evers – Mentor & Peer Services",
            "org": "Medgar Evers College",
            "type": "Mentoring",
            "format": "Hybrid",
            "campus": "Medgar Evers College",
            "location": "Brooklyn",
            "tags": ["long-term","cuny"],
            "description": "Peer support services and mentoring programs.",
            "applyUrl": "https://www.mec.cuny.edu/academic-affairs/programs/predominately-black-institution/peer-support-services/"
          },
          {
            "id": "hunter-sal-program-1a0b2c3d",
            "title": "Hunter – Student Admissions Leader (SAL) Program",
            "org": "Hunter College",
            "type": "Campus Volunteering",
            "format": "Hybrid",
            "campus": "Hunter College",
            "location": "NYC",
            "tags": ["long-term","cuny"],
            "description": "Represent Hunter to prospective students via tours, events, texting, and social.",
            "applyUrl": "https://hunter.cuny.edu/students/admissions/undergraduate/student-ambassadors/"
          },
          {
            "id": "hunter-alumni-ambassador-5d4c3b2a",
            "title": "Hunter – Alumni Ambassador Program",
            "org": "Hunter College",
            "type": "Mentoring",
            "format": "Remote",
            "campus": "Hunter College",
            "location": "NYC",
            "tags": ["long-term","cuny"],
            "description": "Alumni connect with prospective students to share experiences.",
            "applyUrl": "https://webforms.hunter.cuny.edu/admissions/view.php?id=215025"
          },
          {
            "id": "bmcc-impact-peer-mentoring-2c3b4a5d",
            "title": "BMCC – IMPACT Peer Mentoring",
            "org": "BMCC",
            "type": "Mentoring",
            "format": "Hybrid",
            "campus": "BMCC",
            "location": "Manhattan",
            "tags": ["long-term","cuny"],
            "description": "Peer mentoring program where students support students purposefully.",
            "applyUrl": "https://www.bmcc.cuny.edu/student-affairs/peer-mentoring/"
          },
          {
            "id": "york-peer-mentoring-7a8b9c0d",
            "title": "York College – Peer Mentoring",
            "org": "York College",
            "type": "Mentoring",
            "format": "Hybrid",
            "campus": "York College",
            "location": "Queens",
            "tags": ["long-term","cuny"],
            "description": "Mentors guide students on academics and resources at York.",
            "applyUrl": "https://www.york.cuny.edu/student-development/mentoring"
          },
          {
            "id": "csi-new-student-mentoring-4a5b6c7d",
            "title": "CSI – New Student Mentoring Program",
            "org": "College of Staten Island",
            "type": "Mentoring",
            "format": "Hybrid",
            "campus": "CSI",
            "location": "Staten Island",
            "tags": ["long-term","cuny"],
            "description": "Peer mentoring support for first-year students at CSI.",
            "applyUrl": "https://www.csi.cuny.edu/admissions/new-student-guide/new-student-orientation/transitional-services/new-student-mentoring-program"
          },
          {
            "id": "baruch-academic-mentoring-3a4b5c6d",
            "title": "Baruch – Academic Mentoring Program",
            "org": "Baruch College",
            "type": "Mentoring",
            "format": "Hybrid",
            "campus": "Baruch College",
            "location": "NYC",
            "tags": ["long-term","cuny"],
            "description": "Academic mentoring via Executives on Campus.",
            "applyUrl": "https://www.alumni.baruch.cuny.edu/get-involved/executives-on-campus/mentees/prospective-mentees"
          }
        // Add all your other projects here
    ];

    // --- Render projects with load more capability ---
    const renderProjects = (projectsToRender) => {
        if (!projectGrid) return;
        
        // Store filtered projects for load more functionality
        filteredProjectsList = projectsToRender;
        
        // Show empty state if no projects
        if (projectsToRender.length === 0) {
            if (emptyState) emptyState.classList.remove('hidden');
            if (loadMoreBtn && loadMoreBtn.parentElement) loadMoreBtn.parentElement.classList.add('hidden');
            projectGrid.innerHTML = '';
            return;
        }
        
        if (emptyState) emptyState.classList.add('hidden');
        
        // Show only the number of projects based on visibleProjectsCount
        const projectsToShow = projectsToRender.slice(0, visibleProjectsCount);
        
        // Clear grid only if we're showing fewer projects than before
        if (projectsToShow.length < projectGrid.children.length) {
            projectGrid.innerHTML = '';
        }
        
        projectsToShow.forEach(project => {
            // Check if this project is already rendered
            const existingProject = document.querySelector(`[data-project-id="${project._id || project.id}"]`);
            if (existingProject) return;
            
            const projectCard = document.createElement("div");
            projectCard.className = "project-card bg-white p-6 rounded-xl shadow-md card-hover border-t-4 border-primary";
            projectCard.dataset.campus = project.campus || "Non-CUNY";
            projectCard.dataset.type = project.format || "In-person";
            projectCard.dataset.duration = project.duration || "short-term";
            projectCard.dataset.tags = (project.tags || []).join(',');
            projectCard.dataset.projectId = project._id || project.id;
            
            // Format tags
            const tagsHTML = (project.tags || []).map(tag => {
                let bgColor = 'bg-gray-100';
                let textColor = 'text-gray-800';
                
                if (tag === 'long-term') {
                    bgColor = 'bg-blue-100';
                    textColor = 'text-blue-800';
                } else if (tag === 'short-term') {
                    bgColor = 'bg-green-100';
                    textColor = 'text-green-800';
                } else if (tag === 'cuny') {
                    bgColor = 'bg-primary/10';
                    textColor = 'text-primary';
                } else if (tag === 'Non-CUNY') {
                    bgColor = 'bg-purple-100';
                    textColor = 'text-purple-800';
                }
                
                return `<span class="${bgColor} ${textColor} px-3 py-1 rounded-full text-xs tag-chip">${tag}</span>`;
            }).join('');
            
            // Format type badge
            let typeBadge = '';
            const format = project.format || "In-person";
            if (format === 'In-person') {
                typeBadge = '<span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs">📍 In-person</span>';
            } else if (format === 'Remote') {
                typeBadge = '<span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs">🖥️ Remote</span>';
            } else if (format === 'Hybrid') {
                typeBadge = '<span class="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs">🧑‍💻 Hybrid</span>';
            }
            
            // Campus badge
            const campus = project.campus || "Non-CUNY";
            const campusBadge = `<span class="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs">🎓 ${campus}</span>`;
            
            // Date formatting
            const startDate = project.start ? new Date(project.start) : null;
            const formattedDate = startDate ? startDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : "Flexible";
            const formattedTime = startDate ? startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "Flexible hours";
            
            projectCard.innerHTML = `
                <div class="flex justify-between items-start mb-3">
                    <h3 class="text-xl font-semibold">${project.title}</h3>
                    <button onclick="toggleBookmark(this, '${project.title.replace(/'/g, "\\'")}')" class="text-gray-400 hover:text-red-500 text-lg">
                        <i class="far fa-heart"></i>
                    </button>
                </div>
                <p class="text-gray-700 mb-4">${project.description}</p>
                <div class="flex flex-wrap gap-2 text-sm mb-4">
                    ${typeBadge}
                    ${campusBadge}
                    ${tagsHTML}
                </div>
                <div class="text-xs text-gray-500 mb-3">
                    <i class="far fa-clock mr-1"></i> ${formattedDate} at ${formattedTime}
                </div>
                <button onclick="openModalFromDB('${project._id || project.id}')" class="text-primary hover:text-blue-800 font-medium flex items-center mt-3">
                    View Details <i class="fas fa-arrow-right ml-2 text-xs"></i>
                </button>
            `;
            projectGrid.appendChild(projectCard);
        });
        
        // Show/hide load more button
        if (loadMoreBtn && loadMoreBtn.parentElement) {
            if (visibleProjectsCount < projectsToRender.length) {
                loadMoreBtn.parentElement.classList.remove('hidden');
                loadMoreBtn.textContent = `Load More (${projectsToRender.length - visibleProjectsCount} remaining)`;
            } else {
                loadMoreBtn.parentElement.classList.add('hidden');
            }
        }
        
        // Update count display
        if (countDisplay) {
            countDisplay.textContent = `Showing ${projectsToShow.length} of ${projectsToRender.length} volunteer opportunities`;
        }
    };

    // --- Function to handle loading more projects ---
    window.loadMoreProjects = function() {
        visibleProjectsCount += 6;
        renderProjects(filteredProjectsList);
        
        // Scroll to the newly loaded projects for better UX
        if (projectGrid && projectGrid.lastElementChild) {
            projectGrid.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    };

    // --- Filter function ---
    // Update the filterProjects function to fix the Non-CUNY tag filtering
function filterProjects() {
    if (!keywordInput || !campusFilter || !typeFilter || !durationFilter) return;
    
    const keyword = keywordInput.value.toLowerCase();
    const campus = campusFilter.value;
    const type = typeFilter.value;
    const duration = durationFilter.value;
    const sortBy = sortFilter ? sortFilter.value : "relevance";
    
    let filtered = allProjectsData.filter(project => {
        const text = `${project.title} ${project.description} ${project.org || ''} ${(project.tags || []).join(' ')}`.toLowerCase();
        const matchesKeyword = !keyword || text.includes(keyword);
        const projectCampus = project.campus || "Non-CUNY";
        const matchesCampus = !campus || projectCampus === campus;
        const projectType = project.format || "In-person";
        const matchesType = !type || projectType === type;
        const projectDuration = project.duration || "short-term";
        const matchesDuration = !duration || projectDuration === duration;
        
        // Fix for Non-CUNY tag filtering
        const matchesTags = activeTagFiltersList.length === 0 || 
            activeTagFiltersList.some(tag => {
                // Special handling for Non-CUNY tag
                if (tag === "Non-CUNY") {
                    return projectCampus === "Non-CUNY";
                }
                // Special handling for CUNY tag
                if (tag === "cuny") {
                    return projectCampus !== "Non-CUNY";
                }
                // Regular tag matching
                return (project.tags || []).includes(tag);
            });
        
        return matchesKeyword && matchesCampus && matchesType && matchesDuration && matchesTags;
    });
    
    // Sort results
    if (sortBy === 'title') {
        filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'date' && filtered[0] && filtered[0].start) {
        filtered.sort((a, b) => new Date(a.start || 0) - new Date(b.start || 0));
    }
    
    visibleProjectsCount = 6;
    renderProjects(filtered);
}

    // --- Open modal for selected project ---
    window.openModalFromDB = (projectId) => {
        selectedProjectItem = allProjectsData.find(p => (p._id === projectId) || (p.id === projectId));
        if (selectedProjectItem) {
            // Pass event data to your existing modal system
            openModal(
                selectedProjectItem.title,
                selectedProjectItem.partnerName || selectedProjectItem.org || "CUNY",
                selectedProjectItem.description,
                selectedProjectItem.orientationLink || "#",
                selectedProjectItem.start ? new Date(selectedProjectItem.start).toLocaleString() : "Flexible scheduling",
                selectedProjectItem.start ? new Date(selectedProjectItem.start).toISOString().split("T")[0] : "",
                selectedProjectItem.location || selectedProjectItem.address || "See details",
                selectedProjectItem.mapURL || `https://www.google.com/maps?q=${encodeURIComponent(selectedProjectItem.location || selectedProjectItem.address || "New York")}&output=embed`,
                selectedProjectItem.directions || "Details will be provided after registration",
                selectedProjectItem.logistics || "No special requirements",
                selectedProjectItem.partnerInfo || "Learn more during orientation"
            );
        }
    };

    // --- Event listeners for filters ---
    if (keywordInput) keywordInput.addEventListener("input", filterProjects);
    if (campusFilter) campusFilter.addEventListener("change", filterProjects);
    if (typeFilter) typeFilter.addEventListener("change", filterProjects);
    if (durationFilter) durationFilter.addEventListener("change", filterProjects);
    if (sortFilter) sortFilter.addEventListener("change", filterProjects);
    
    if (tagFilterButtons.length > 0) {
        tagFilterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tag = btn.dataset.tag;
                if (activeTagFiltersList.includes(tag)) {
                    activeTagFiltersList = activeTagFiltersList.filter(t => t !== tag);
                    btn.classList.remove('filter-active');
                } else {
                    activeTagFiltersList.push(tag);
                    btn.classList.add('filter-active');
                }
                filterProjects();
            });
        });
    }
    
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', window.loadMoreProjects);
    }

    // --- Fetch public events ---
    const fetchPublicEvents = async () => {
        try {
            // First try to fetch from API
            const res = await fetch("/api/events/public");
            if (res.ok) {
                allProjectsData = await res.json();
            } else {
                // If API fails, use the static project data
                throw new Error("API not available, using static data");
            }
        } catch (error) {
            console.error("Failed to fetch public events from API, using static data:", error);
            // Use the static project data as fallback
            allProjectsData = staticProjectData;
        }
        
        // Hide loading indicator
        if (loadingIndicator) loadingIndicator.classList.add('hidden');
        
        // Initial render
        filterProjects();
    };

    fetchPublicEvents();
});