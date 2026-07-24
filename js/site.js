(function () {
  const nav = document.querySelector(".site-nav");
  const hero = document.querySelector(".hero-intro");

  if (nav) {
    const onScroll = () => {
      const scrolled = window.scrollY > 20;
      nav.classList.toggle("is-scrolled", scrolled);
      if (hero) {
        nav.classList.toggle("site-nav--hero", !scrolled && window.scrollY < hero.offsetHeight - nav.offsetHeight);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  document.querySelectorAll(".site-nav .nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      const collapse = document.querySelector("#siteNavMenu");
      if (collapse?.classList.contains("show") && window.bootstrap?.Collapse) {
        window.bootstrap.Collapse.getOrCreateInstance(collapse).hide();
      }
    });
  });

  const sectionIds = ["games", "about", "contact"];
  const navLinks = document.querySelectorAll('.site-nav .nav-link[href^="#"]');

  function setActiveNav() {
    if (!navLinks.length) return;

    const navHeight = nav?.offsetHeight ?? 56;
    const scrollBottom = window.scrollY + window.innerHeight;
    const pageBottom = document.documentElement.scrollHeight;
    let activeId = "top";

    if (scrollBottom >= pageBottom - 48) {
      activeId = sectionIds[sectionIds.length - 1];
    } else if (hero && window.scrollY < hero.offsetHeight - navHeight) {
      activeId = "top";
    } else {
      const probe = window.scrollY + navHeight + window.innerHeight * 0.35;

      for (const id of sectionIds) {
        const section = document.getElementById(id);
        if (!section) continue;

        const top = section.offsetTop;
        const bottom = top + section.offsetHeight;
        if (probe >= top && probe < bottom) {
          activeId = id;
          break;
        }
        if (probe >= top) {
          activeId = id;
        }
      }
    }

    navLinks.forEach((link) => {
      const href = link.getAttribute("href");
      const isActive = (activeId === "top" && href === "#top") || href === `#${activeId}`;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  if (sectionIds.some((id) => document.getElementById(id)) || hero) {
    window.addEventListener("scroll", setActiveNav, { passive: true });
    window.addEventListener("resize", setActiveNav, { passive: true });
    setActiveNav();
  }

  document.querySelectorAll(".games-block").forEach((block) => {
    const engineTabs = block.querySelectorAll(".games-tab[data-engine]");
    const categoryTabs = block.querySelectorAll(".games-subtab[data-category]");
    const subtabBar = block.querySelector(".games-subtabs");
    const cards = block.querySelectorAll(".game-card[data-engine]");
    const grid = block.querySelector(".games-grid");
    const emptyEngine = block.querySelector("[data-empty-engine]");
    const emptyCategory = block.querySelector("[data-empty-category]");
    if (!engineTabs.length) return;

    let engine = block.querySelector(".games-tab.is-active")?.dataset.engine || "unity";
    let category = "all";

    const setTabState = (tabs, activeTab) => {
      tabs.forEach((tab) => {
        const on = tab === activeTab;
        tab.classList.toggle("is-active", on);
        tab.setAttribute("aria-selected", on ? "true" : "false");
      });
    };

    const applyFilters = () => {
      let visible = 0;
      let engineTotal = 0;

      cards.forEach((card) => {
        const engineMatch = card.dataset.engine === engine;
        if (engineMatch) engineTotal += 1;

        const categories = (card.dataset.category || "").trim().split(/\s+/);
        const categoryMatch = category === "all" || categories.includes(category);
        const show = engineMatch && categoryMatch;

        card.classList.toggle("is-hidden", !show);
        if (show) visible += 1;
      });

      if (grid) grid.classList.toggle("is-hidden", visible === 0);

      const noEngine = engineTotal === 0;
      const noCategory = !noEngine && visible === 0;

      if (subtabBar) subtabBar.classList.toggle("is-hidden", engine !== "unity");
      if (emptyEngine) emptyEngine.classList.toggle("is-hidden", !noEngine);
      if (emptyCategory) emptyCategory.classList.toggle("is-hidden", !noCategory || engine !== "unity");
    };

    applyFilters();

    engineTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        engine = tab.dataset.engine;
        category = "all";
        setTabState(engineTabs, tab);
        if (categoryTabs.length) setTabState(categoryTabs, block.querySelector('.games-subtab[data-category="all"]'));
        applyFilters();
      });
    });

    categoryTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        category = tab.dataset.category;
        setTabState(categoryTabs, tab);
        applyFilters();
      });
    });
  });

  const heroVideo = document.querySelector(".hero-intro__video");
  if (heroVideo) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      heroVideo.autoplay = false;
      heroVideo.pause();
    } else {
      heroVideo.play().catch(() => {});
    }
    window.addEventListener("pagehide", () => heroVideo.pause());
  }
})();
