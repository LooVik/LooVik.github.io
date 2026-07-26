/* Turns [data-back] into a real Back control: returns you to wherever you came
   from, scroll position intact. If you landed on the page directly — a search
   result, a shared link — the element's href takes over as a sensible fallback. */
(function () {
  const backLink = document.querySelector("[data-back]");
  if (!backLink) return;

  backLink.addEventListener("click", (event) => {
    let cameFromSite = false;
    try {
      cameFromSite = !!document.referrer && new URL(document.referrer).origin === location.origin;
    } catch (e) {
      cameFromSite = false;
    }

    if (cameFromSite && history.length > 1) {
      event.preventDefault();
      history.back();
    }
  });
})();
