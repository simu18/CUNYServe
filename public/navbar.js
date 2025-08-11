fetch("navbar.html")
  .then(res => res.text())
  .then(data => {
    document.getElementById("navbar-placeholder").innerHTML = data;

    // Wait for DOM to update before attaching dropdown logic
    setTimeout(() => {
      const getInvolvedBtn = document.getElementById("getInvolvedBtn");
      const getInvolvedDropdown = document.getElementById("getInvolvedDropdown");

      const aboutBtn = document.getElementById("aboutBtn");
      const aboutDropdown = document.getElementById("aboutDropdown");

      // Toggle "Get Involved" dropdown
      if (getInvolvedBtn && getInvolvedDropdown) {
        getInvolvedBtn.addEventListener("click", () => {
          getInvolvedDropdown.classList.toggle("hidden");
        });
      }

      // Toggle "About" dropdown
      if (aboutBtn && aboutDropdown) {
        aboutBtn.addEventListener("click", () => {
          aboutDropdown.classList.toggle("hidden");
        });
      }

      // Close dropdowns when clicking outside
      document.addEventListener("click", (event) => {
        if (!event.target.closest("#getInvolvedWrapper")) {
          getInvolvedDropdown?.classList.add("hidden");
        }
        if (!event.target.closest("#aboutWrapper")) {
          aboutDropdown?.classList.add("hidden");
        }
      });
    }, 0);
  });
