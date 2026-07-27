/* Renders the resume PDF straight onto a canvas.
   Embedding the PDF instead would bring the browser's own viewer chrome with it
   — toolbar, thumbnail sidebar — and phones mostly refuse to render it at all. */
(function () {
  const canvas = document.getElementById("resume-canvas");
  if (!canvas || !window.pdfjsLib) return;

  const stage = canvas.parentElement;
  const url = canvas.dataset.pdf;
  const status = document.querySelector(".resume-status");

  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

  let page = null;
  let renderTask = null;

  function draw() {
    if (!page) return;

    const cssWidth = stage.clientWidth;
    if (!cssWidth) return;

    const unscaled = page.getViewport({ scale: 1 });
    const scale = cssWidth / unscaled.width;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const viewport = page.getViewport({ scale: scale * dpr });

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    canvas.style.width = "100%";
    canvas.style.height = "auto";

    if (renderTask) renderTask.cancel();
    renderTask = page.render({ canvasContext: canvas.getContext("2d"), viewport });
    renderTask.promise.catch(() => {});
  }

  pdfjsLib
    .getDocument(url)
    .promise.then((pdf) => pdf.getPage(1))
    .then((firstPage) => {
      page = firstPage;
      if (status) status.remove();
      canvas.hidden = false;
      draw();
    })
    .catch(() => {
      if (status) {
        status.textContent = "Couldn't display the resume here — use the download button above.";
      }
    });

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(draw, 150);
  });
})();
