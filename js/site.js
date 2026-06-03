(function () {
  const nav = document.querySelector(".site-nav");
  if (nav) {
    const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  document.querySelectorAll(".site-nav .nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      const collapse = document.querySelector("#siteNavMenu");
      if (collapse && collapse.classList.contains("show")) {
        bootstrap.Collapse.getOrCreateInstance(collapse).hide();
      }
    });
  });

  const sectionIds = ["about", "skills", "work", "contact"];
  const navLinks = document.querySelectorAll('.site-nav .nav-link[href^="#"]');

  function setActiveNav() {
    if (!navLinks.length) return;

    const offset = (nav?.offsetHeight ?? 56) + 120;
    const scrollPos = window.scrollY + offset;
    let activeId = "";

    for (const id of sectionIds) {
      const section = document.getElementById(id);
      if (section && section.offsetTop <= scrollPos) {
        activeId = id;
      }
    }

    navLinks.forEach((link) => {
      const href = link.getAttribute("href");
      const isActive = href === `#${activeId}`;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  if (sectionIds.some((id) => document.getElementById(id))) {
    window.addEventListener("scroll", setActiveNav, { passive: true });
    window.addEventListener("resize", setActiveNav, { passive: true });
    setActiveNav();
  }
})();
