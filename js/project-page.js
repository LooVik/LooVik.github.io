(function () {
  const nav = document.querySelector(".site-nav");
  if (nav) {
    const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  const videos = [...document.querySelectorAll(".project-media video")];
  if (!videos.length) return;

  const pauseAll = () => videos.forEach((v) => v.pause());

  window.addEventListener("pagehide", pauseAll);
  document.addEventListener("click", (e) => {
    const link = e.target.closest("a[href]");
    if (!link || link.origin !== location.origin || link.pathname === location.pathname) return;
    pauseAll();
  });
})();
