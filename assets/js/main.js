/* SoloTrail — main.js
   - sticky header scrolled state
   - DE/EN language toggle (persists in localStorage)
   - scroll-reveal via IntersectionObserver
   - hero route path length init (for stroke-dasharray animation)
   - elevation profile chart generation
*/

(() => {
  /* ============ Header scrolled state ============ */
  const header = document.querySelector(".site-header");
  function updateHeaderState() {
    if (!header) return;
    header.toggleAttribute("data-scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", updateHeaderState, { passive: true });
  updateHeaderState();

  /* ============ Language toggle ============ */
  const LANG_KEY = "solotrail-lang";
  const buttons = document.querySelectorAll(".lang-toggle [data-lang]");
  const supported = ["de", "en"];

  function getLang() {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored && supported.includes(stored)) return stored;
    const browser = (navigator.language || "de").slice(0, 2).toLowerCase();
    return supported.includes(browser) ? browser : "de";
  }

  function applyLang(lang) {
    if (!supported.includes(lang)) lang = "de";
    document.documentElement.lang = lang;

    // Swap text content / innerHTML for any node with data-i18n-<lang>
    document.querySelectorAll(`[data-i18n-${lang}]`).forEach(node => {
      const value = node.getAttribute(`data-i18n-${lang}`);
      if (value == null) return;
      // Preserve attribute version of original content if not yet preserved
      if (!node.dataset.i18nOrig) {
        node.dataset.i18nOrig = node.innerHTML;
      }
      node.innerHTML = value;
    });

    // Update toggle buttons
    buttons.forEach(btn => {
      btn.setAttribute("aria-pressed", String(btn.dataset.lang === lang));
    });

    // Persist
    try { localStorage.setItem(LANG_KEY, lang); } catch(_) {}
  }

  buttons.forEach(btn => {
    btn.addEventListener("click", () => applyLang(btn.dataset.lang));
  });

  // Initial
  applyLang(getLang());

  /* ============ Scroll reveals ============ */
  const reveals = document.querySelectorAll(".reveal");

  // Reveal-on-scroll, with two safety nets:
  // 1) anything already in/above the viewport on load is revealed immediately
  // 2) hard fallback after 900ms reveals anything still hidden — guarantees
  //    the page is never stuck invisible if IntersectionObserver misfires
  //    (e.g. inside certain iframe contexts).
  function revealNow(el) {
    if (!el.hasAttribute("data-visible")) el.setAttribute("data-visible", "");
  }

  function inViewportNow(el) {
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    return r.top < vh * 0.95 && r.bottom > 0;
  }

  // Initial pass — reveal anything visible at load
  reveals.forEach(el => { if (inViewportNow(el)) revealNow(el); });

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          revealNow(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
    reveals.forEach(el => io.observe(el));

    // Scroll fallback in case IO is flaky
    const onScroll = () => {
      reveals.forEach(el => { if (!el.hasAttribute("data-visible") && inViewportNow(el)) revealNow(el); });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
  } else {
    const onScroll = () => {
      reveals.forEach(el => { if (!el.hasAttribute("data-visible") && inViewportNow(el)) revealNow(el); });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // Hard fallback: never let anything stay invisible
  setTimeout(() => { reveals.forEach(revealNow); }, 900);

  /* ============ Hero route path length ============ */
  // Set CSS custom prop --len to the actual path length so the dasharray
  // animation snaps cleanly to it regardless of viewport.
  const heroPath = document.getElementById("hero-route");
  if (heroPath) {
    try {
      const length = heroPath.getTotalLength();
      heroPath.style.setProperty("--len", length);
      heroPath.style.strokeDasharray = length;
      heroPath.style.strokeDashoffset = length;
    } catch(_) {}
  }

  /* ============ Elevation profile chart ============ */
  // A plausible Hochschwab elevation profile: 14.8 km, +426 m,
  // start 1700 m, rolling, summit 2123 m at ~70%, descent to 1750 m.
  const elevData = generateElevation();
  drawElevation(elevData);

  function generateElevation() {
    // 60 sample points spanning 0..14.8 km
    const points = [];
    const samples = 60;
    for (let i = 0; i < samples; i++) {
      const t = i / (samples - 1);
      const km = t * 14.8;

      // Base profile: start 1700, rise to ~2123 at t=0.70, descend
      // Use a couple of cosine humps for character
      const base = 1700
        + 300 * (1 - Math.cos(t * Math.PI)) / 2   // rolling up
        + 120 * Math.sin(t * Math.PI * 1.2)
        + 80  * Math.sin(t * Math.PI * 4.3 + 1.2); // small undulations

      // Force summit near t=0.70
      const summitBoost = 90 * Math.exp(-Math.pow((t - 0.70) / 0.10, 2));
      // Descent at the end
      const tailDescent = -110 * Math.max(0, (t - 0.80) / 0.20);

      const elevation = base + summitBoost + tailDescent;
      points.push({ km, t, elevation });
    }
    return points;
  }

  function drawElevation(points) {
    const line = document.getElementById("elev-line");
    const area = document.getElementById("elev-area");
    const summitG = document.getElementById("elev-summit");
    if (!line || !area) return;

    const W = 800;
    const H = 240;
    const padL = 44, padR = 16, padT = 20, padB = 16;
    const minE = 1600, maxE = 2200; // matches y axis labels

    const xFor = t => padL + t * (W - padL - padR);
    const yFor = e => padT + (1 - (e - minE) / (maxE - minE)) * (H - padT - padB);

    // Build path d
    let d = "";
    points.forEach((p, i) => {
      const x = xFor(p.t);
      const y = yFor(p.elevation);
      d += (i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : ` L ${x.toFixed(1)} ${y.toFixed(1)}`);
    });

    line.setAttribute("d", d);

    // Area path: same line, then down to baseline, then close
    const last = points[points.length - 1];
    const first = points[0];
    const baseY = H - padB + 0.5;
    const areaD = d
      + ` L ${xFor(last.t).toFixed(1)} ${baseY.toFixed(1)}`
      + ` L ${xFor(first.t).toFixed(1)} ${baseY.toFixed(1)} Z`;
    area.setAttribute("d", areaD);

    // Animate stroke drawing — IO when available, hard fallback otherwise.
    try {
      const len = line.getTotalLength();
      line.style.transition = "none";
      line.style.strokeDasharray = len;
      line.style.strokeDashoffset = len;

      const fire = () => {
        line.style.transition = "stroke-dashoffset 2400ms cubic-bezier(.6,.05,.25,1)";
        requestAnimationFrame(() => { line.style.strokeDashoffset = "0"; });
      };

      let fired = false;
      const fireOnce = () => { if (fired) return; fired = true; fire(); };

      const chartHost = document.getElementById("elev-chart");
      if (chartHost && "IntersectionObserver" in window) {
        const observer = new IntersectionObserver((entries, obs) => {
          entries.forEach(e => {
            if (e.isIntersecting) { fireOnce(); obs.disconnect(); }
          });
        }, { threshold: 0.2 });
        observer.observe(chartHost);
      }
      // Fallback: fire on scroll-near or after 1.5s regardless.
      const onScroll = () => {
        if (!chartHost) return;
        const r = chartHost.getBoundingClientRect();
        const vh = window.innerHeight || 800;
        if (r.top < vh * 0.95 && r.bottom > 0) {
          fireOnce();
          window.removeEventListener("scroll", onScroll);
        }
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
      setTimeout(fireOnce, 1500);
    } catch(_) {}

    // Mark summit
    let summit = points[0];
    points.forEach(p => { if (p.elevation > summit.elevation) summit = p; });
    if (summitG) {
      const sx = xFor(summit.t).toFixed(1);
      const sy = yFor(summit.elevation).toFixed(1);
      summitG.innerHTML = `
        <line x1="${sx}" y1="${sy}" x2="${sx}" y2="${(parseFloat(sy) - 22).toFixed(1)}"
              stroke="#1a1f1c" stroke-width="0.8" stroke-dasharray="2 3"/>
        <circle cx="${sx}" cy="${sy}" r="4" fill="#c44a2a" stroke="#efe9dc" stroke-width="1.5"/>
        <g transform="translate(${sx}, ${(parseFloat(sy) - 30).toFixed(1)})">
          <rect x="-32" y="-13" width="64" height="18" rx="2" fill="#1a1f1c"/>
          <text x="0" y="-1" fill="#efe9dc" font-family="IBM Plex Mono, monospace"
                font-size="10" text-anchor="middle" letter-spacing="0.6">2 123 m</text>
        </g>
      `;
    }
  }
})();
