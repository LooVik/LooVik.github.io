/* Temporary password gate — remove or disable before going public.
   To go public: set GATE_ENABLED to false, commit, push. That's it.
   To change the password: open scripts/hash-password.html, type your new
   password, paste the hex it gives you over PASSWORD_HASH below. */
(function () {
  const GATE_ENABLED = true;
  const PASSWORD_HASH = "60bc51eb8a95edff160247c673d3289c717b0eb58e476b3056ced3b3ceb887cf";

  const FLAG = "loovik-gate";

  if (!GATE_ENABLED) return;
  try {
    if (sessionStorage.getItem(FLAG) === "1") return;
  } catch (e) {
    /* storage blocked — fall through and prompt */
  }

  const root = document.documentElement;
  root.classList.add("gate-locked");

  const style = document.createElement("style");
  style.textContent = `
    html.gate-locked, html.gate-locked body { overflow: hidden !important; height: 100%; }
    html.gate-locked body > *:not(.gate) { display: none !important; }
    .gate {
      position: fixed; inset: 0; z-index: 9999;
      display: flex; align-items: center; justify-content: center;
      padding: 1.5rem;
      background: #12151c;
      font-family: var(--font-body, system-ui, sans-serif);
    }
    .gate__box { width: 100%; max-width: 22rem; text-align: center; }
    .gate__title {
      margin: 0 0 .5rem;
      font-family: var(--font-display, Georgia, serif);
      font-size: clamp(1.75rem, 6vw, 2.5rem);
      font-weight: 700;
      color: var(--hero-ink, #f8f6f2);
    }
    .gate__note {
      margin: 0 0 1.75rem;
      font-size: .95rem;
      color: var(--hero-muted, rgba(248, 246, 242, .78));
    }
    .gate__field { display: flex; flex-direction: column; gap: .75rem; }
    .gate__input {
      width: 100%; padding: .75rem 1rem;
      font: inherit; font-size: 1rem;
      color: var(--hero-ink, #f8f6f2);
      background: rgba(255, 255, 255, .06);
      border: 1px solid rgba(248, 246, 242, .28);
      border-radius: var(--radius, 8px);
      outline: none;
    }
    .gate__input:focus { border-color: var(--accent, #c2563a); background: rgba(255, 255, 255, .1); }
    .gate__btn {
      padding: .75rem 1rem;
      font: inherit; font-size: 1rem; font-weight: 600;
      color: #fff; background: var(--accent, #c2563a);
      border: 0; border-radius: var(--radius, 8px); cursor: pointer;
    }
    .gate__btn:hover { background: var(--accent-hover, #a84830); }
    .gate__error {
      min-height: 1.25rem; margin: .85rem 0 0;
      font-size: .875rem; color: #e8836a;
    }
    .gate--shake { animation: gate-shake .32s ease; }
    @keyframes gate-shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-7px); }
      75% { transform: translateX(7px); }
    }
    @media (prefers-reduced-motion: reduce) { .gate--shake { animation: none; } }
  `;
  (document.head || root).appendChild(style);

  /* Stop the hero video downloading behind the gate — it's ~16 MB.
     The element doesn't exist yet, so catch it as the parser creates it. */
  let parkedVideo = null;
  const observer = new MutationObserver(() => {
    const video = document.querySelector(".hero-intro__video");
    if (!video) return;
    observer.disconnect();
    parkedVideo = {
      el: video,
      sources: [...video.querySelectorAll("source")].map((s) => ({ el: s, src: s.getAttribute("src") })),
    };
    video.removeAttribute("autoplay");
    parkedVideo.sources.forEach(({ el }) => el.removeAttribute("src"));
    video.load();
  });
  observer.observe(root, { childList: true, subtree: true });

  function releaseVideo() {
    observer.disconnect();
    if (!parkedVideo) return;
    parkedVideo.sources.forEach(({ el, src }) => src && el.setAttribute("src", src));
    parkedVideo.el.load();
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      parkedVideo.el.play().catch(() => {});
    }
    parkedVideo = null;
  }

  async function sha256Hex(text) {
    const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  function build() {
    const gate = document.createElement("div");
    gate.className = "gate";
    gate.innerHTML = `
      <div class="gate__box">
        <h1 class="gate__title">Loo Vik</h1>
        <p class="gate__note">Portfolio in progress.</p>
        <form class="gate__field" novalidate>
          <input class="gate__input" id="gate-pw" type="password" autocomplete="current-password"
                 placeholder="Password" aria-label="Password" aria-describedby="gate-error" />
          <button class="gate__btn" type="submit">Enter</button>
        </form>
        <p class="gate__error" id="gate-error" role="status" aria-live="polite"></p>
      </div>`;
    document.body.appendChild(gate);

    const form = gate.querySelector("form");
    const input = gate.querySelector(".gate__input");
    const error = gate.querySelector(".gate__error");
    const box = gate.querySelector(".gate__box");

    input.focus();

    function reject(message) {
      error.textContent = message;
      input.select();
      box.classList.remove("gate--shake");
      void box.offsetWidth; /* restart the animation */
      box.classList.add("gate--shake");
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!window.crypto || !crypto.subtle) {
        reject("Open the site over http://localhost, not as a file.");
        return;
      }
      const hash = await sha256Hex(input.value);
      if (hash !== PASSWORD_HASH) {
        reject("Not quite.");
        return;
      }
      try {
        sessionStorage.setItem(FLAG, "1");
      } catch (e) {
        /* unlocking this page still works without storage */
      }
      gate.remove();
      style.remove();
      root.classList.remove("gate-locked");
      releaseVideo();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
