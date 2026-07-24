(function () {
  const THEME_KEY = "portfolio-theme";
  const root = document.documentElement;
  const themeToggle = document.getElementById("theme-toggle");

  function getTheme() {
    return root.getAttribute("data-theme") === "light" ? "light" : "dark";
  }

  function setTheme(theme) {
    root.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
    if (themeToggle) {
      themeToggle.setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
      );
    }
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      setTheme(getTheme() === "dark" ? "light" : "dark");
    });
  }

  const nav = document.querySelector(".site-nav");
  const navHome = document.getElementById("nav-home");
  const toggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");
  const filterBtns = document.querySelectorAll(".filter-btn");
  const projectCards = document.querySelectorAll(".project-card[data-category]");

  if (toggle && navLinks) {
    toggle.addEventListener("click", () => {
      const open = navLinks.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open);
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  const sections = document.querySelectorAll("section[id]");
  const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');

  function setActiveNav() {
    if (!sections.length) return;

    const offset = (nav?.offsetHeight || 72) + 24;
    let current = sections[0].getAttribute("id") || "";

    const atPageBottom =
      window.scrollY + window.innerHeight >=
      document.documentElement.scrollHeight - 120;

    if (atPageBottom) {
      current = sections[sections.length - 1].getAttribute("id") || current;
    } else {
      sections.forEach((section) => {
        if (window.scrollY >= section.offsetTop - offset) {
          current = section.getAttribute("id") || current;
        }
      });
    }

    navAnchors.forEach((anchor) => {
      anchor.classList.toggle(
        "is-active",
        anchor.getAttribute("href") === `#${current}`
      );
    });
  }

  function onScroll() {
    setActiveNav();
    if (nav) {
      nav.classList.toggle("is-scrolled", window.scrollY > 20);
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (navHome) {
    navHome.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (navLinks) {
        navLinks.classList.remove("is-open");
      }
      if (toggle) {
        toggle.setAttribute("aria-expanded", "false");
      }
      history.replaceState(null, "", "#top");
    });
  }

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter;
      filterBtns.forEach((b) => b.classList.toggle("is-active", b === btn));

      projectCards.forEach((card) => {
        const categories = (card.dataset.category || "").trim().split(/\s+/);
        const show = filter === "all" || categories.includes(filter);
        card.classList.toggle("is-hidden", !show);
      });
    });
  });

  const HERO_PROJECTS = [
    {
      href: "battle.html",
      src: "assets/img/portfolio/fullsize/battle.png",
      alt: "Burglar Battle",
      label: "Burglar Battle",
      stats: [
        { icon: "bi-display", color: "icon-accent", title: "PlayStation 5", sub: "Platform" },
        { icon: "bi-unity", color: "icon-cyan", title: "Unity", sub: "Engine" },
        { icon: "bi-people", color: "icon-purple", title: "University", sub: "~50 student team" },
      ],
    },
    {
      href: "city.html",
      src: "assets/img/portfolio/fullsize/city.png",
      alt: "CityGo",
      label: "CityGo",
      stats: [
        { icon: "bi-phone", color: "icon-accent", title: "iOS & Android", sub: "Platform" },
        { icon: "bi-unity", color: "icon-cyan", title: "Unity", sub: "Engine" },
        { icon: "bi-geo-alt", color: "icon-purple", title: "Location-based", sub: "Game type" },
      ],
    },
    {
      href: "cuphead.html",
      src: "assets/img/portfolio/fullsize/MugHead.png",
      alt: "MugHead",
      label: "MugHead",
      stats: [
        { icon: "bi-controller", color: "icon-accent", title: "Atari 2600", sub: "Platform" },
        { icon: "bi-unity", color: "icon-cyan", title: "Unity", sub: "Engine" },
        { icon: "bi-calendar-event", color: "icon-purple", title: "2-week jam", sub: "Team of 6" },
      ],
    },
    {
      href: "lockedin.html",
      src: "assets/img/portfolio/fullsize/locked.png",
      alt: "LockedIn",
      label: "LockedIn",
      stats: [
        { icon: "bi-pc-display", color: "icon-accent", title: "PC", sub: "Platform" },
        { icon: "bi-unity", color: "icon-cyan", title: "Unity", sub: "Engine" },
        { icon: "bi-moon", color: "icon-purple", title: "PSX horror", sub: "4-week jam" },
      ],
    },
    {
      href: "root.html",
      src: "assets/img/portfolio/fullsize/roots.png",
      alt: "Root Odyssey",
      label: "Root Odyssey",
      stats: [
        { icon: "bi-pc-display", color: "icon-accent", title: "PC", sub: "Platform" },
        { icon: "bi-unity", color: "icon-cyan", title: "Unity", sub: "Engine" },
        { icon: "bi-calendar-event", color: "icon-purple", title: "2-day jam", sub: "Team of 6" },
      ],
    },
    {
      href: "natural.html",
      src: "assets/img/portfolio/fullsize/naturebg.png",
      alt: "Natural Explorer",
      label: "Natural Explorer",
      stats: [
        { icon: "bi-pc-display", color: "icon-accent", title: "PC", sub: "Platform" },
        { icon: "bi-code-slash", color: "icon-cyan", title: "Unity · C#", sub: "Engine & code" },
        { icon: "bi-map", color: "icon-purple", title: "Open world", sub: "Level design" },
      ],
    },
  ];

  function initHeroCarousel() {
    const showcase = document.getElementById("hero-showcase");
    const slidesEl = document.getElementById("hero-slides");
    const labelEl = document.getElementById("hero-showcase-label");
    const dotsEl = document.getElementById("hero-showcase-dots");
    const statsEl = document.getElementById("hero-stats");
    const statIcons = [0, 1, 2].map((i) => document.getElementById(`hero-stat-icon-${i}`));
    const statTitles = [0, 1, 2].map((i) => document.getElementById(`hero-stat-title-${i}`));
    const statSubs = [0, 1, 2].map((i) => document.getElementById(`hero-stat-sub-${i}`));
    if (!showcase || !slidesEl || !labelEl) return;

    function updateHeroStats(project) {
      if (!project.stats) return;
      if (statsEl) statsEl.classList.add("is-updating");
      project.stats.forEach((stat, i) => {
        const iconEl = statIcons[i];
        if (iconEl) {
          iconEl.className = `bi ${stat.icon} ${stat.color}`;
        }
        if (statTitles[i]) statTitles[i].textContent = stat.title;
        if (statSubs[i]) statSubs[i].textContent = stat.sub;
      });
      window.setTimeout(() => {
        if (statsEl) statsEl.classList.remove("is-updating");
      }, 200);
    }

    HERO_PROJECTS.forEach((project, i) => {
      const img = document.createElement("img");
      img.className = "hero-slide" + (i === 0 ? " is-active" : "");
      img.src = project.src;
      img.alt = project.alt;
      img.loading = i === 0 ? "eager" : "lazy";
      slidesEl.appendChild(img);

      if (dotsEl) {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "hero-showcase-dot" + (i === 0 ? " is-active" : "");
        dot.setAttribute("role", "tab");
        dot.setAttribute("aria-label", `Show ${project.label}`);
        dot.setAttribute("aria-selected", i === 0 ? "true" : "false");
        dot.dataset.index = String(i);
        dotsEl.appendChild(dot);
      }
    });

    const slides = slidesEl.querySelectorAll(".hero-slide");
    const dots = dotsEl ? dotsEl.querySelectorAll(".hero-showcase-dot") : [];
    let index = 0;
    let timer = null;
    const intervalMs = 4500;

    function setSlide(nextIndex) {
      if (nextIndex < 0 || nextIndex >= slides.length) return;
      slides[index].classList.remove("is-active");
      if (dots[index]) {
        dots[index].classList.remove("is-active");
        dots[index].setAttribute("aria-selected", "false");
      }
      index = nextIndex;
      slides[index].classList.add("is-active");
      if (dots[index]) {
        dots[index].classList.add("is-active");
        dots[index].setAttribute("aria-selected", "true");
      }
      const project = HERO_PROJECTS[index];
      showcase.href = project.href;
      showcase.title = `View ${project.label}`;
      labelEl.textContent = project.label;
      updateHeroStats(project);
    }

    function nextInOrder() {
      return (index + 1) % slides.length;
    }

    function startTimer() {
      stopTimer();
      timer = setInterval(() => setSlide(nextInOrder()), intervalMs);
    }

    function stopTimer() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach((dot) => {
      dot.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        setSlide(Number(dot.dataset.index));
        startTimer();
      });
    });

    const showcaseWrap = showcase.closest(".hero-showcase-wrap");
    const pauseTarget = showcaseWrap || showcase;
    pauseTarget.addEventListener("mouseenter", stopTimer);
    pauseTarget.addEventListener("mouseleave", startTimer);
    pauseTarget.addEventListener("focusin", stopTimer);
    pauseTarget.addEventListener("focusout", startTimer);

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!motionQuery.matches) {
      startTimer();
    }

    motionQuery.addEventListener("change", (e) => {
      if (e.matches) stopTimer();
      else startTimer();
    });
  }

  initHeroCarousel();

  const revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }
})();
