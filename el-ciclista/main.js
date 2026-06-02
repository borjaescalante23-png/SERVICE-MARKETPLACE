/* ============================================================================
   El Ciclista Cocktail Bar — main.js (v2)
   IIFE classic script. No imports, no exports. Works on file:// and Hostinger.
   ============================================================================ */
(function () {
  "use strict";

  /* ---------- Helpers ---------- */
  var data = (typeof window !== "undefined" && window.__ELCICLISTA__) || {};
  var $  = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); };
  var escHTML = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c];
    });
  };
  function safe(fn, name) { try { fn(); } catch (e) { console.warn("[" + name + "]", e); } }
  var fineHover = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var SVG_NS = "http://www.w3.org/2000/svg";

  /* ============================================================
     SESSION ICONS — SVG inline
     ============================================================ */
  function buildSessionIconSVG(kind) {
    if (kind === "vinyl") {
      return '<svg viewBox="0 0 100 100" fill="none" xmlns="' + SVG_NS + '">' +
        '<circle cx="50" cy="50" r="44" stroke="currentColor" stroke-width="1.2"/>' +
        '<circle cx="50" cy="50" r="36" stroke="currentColor" stroke-width=".6" opacity=".6"/>' +
        '<circle cx="50" cy="50" r="28" stroke="currentColor" stroke-width=".5" opacity=".4"/>' +
        '<circle cx="50" cy="50" r="20" stroke="currentColor" stroke-width=".5" opacity=".3"/>' +
        '<circle cx="50" cy="50" r="10" fill="currentColor"/>' +
        '<circle cx="50" cy="50" r="2" fill="#0E0B09"/>' +
        '</svg>';
    }
    if (kind === "house") {
      return '<svg viewBox="0 0 100 100" fill="none" xmlns="' + SVG_NS + '">' +
        '<g stroke="currentColor" stroke-width="3" stroke-linecap="round">' +
        '<line x1="14" y1="40" x2="14" y2="60"/>' +
        '<line x1="26" y1="28" x2="26" y2="72"/>' +
        '<line x1="38" y1="20" x2="38" y2="80"/>' +
        '<line x1="50" y1="10" x2="50" y2="90"/>' +
        '<line x1="62" y1="20" x2="62" y2="80"/>' +
        '<line x1="74" y1="28" x2="74" y2="72"/>' +
        '<line x1="86" y1="40" x2="86" y2="60"/>' +
        '</g></svg>';
    }
    if (kind === "disco") {
      return '<svg viewBox="0 0 100 100" fill="none" xmlns="' + SVG_NS + '">' +
        '<circle cx="50" cy="56" r="36" stroke="currentColor" stroke-width="1.4"/>' +
        '<path d="M50 20 L50 92 M14 56 L86 56 M22 30 L78 82 M78 30 L22 82" stroke="currentColor" stroke-width=".7" opacity=".7"/>' +
        '<circle cx="50" cy="56" r="36" stroke="currentColor" stroke-width=".5" stroke-dasharray="2 3" opacity=".5"/>' +
        '<line x1="50" y1="6" x2="50" y2="20" stroke="currentColor" stroke-width="1.4"/>' +
        '<rect x="42" y="2" width="16" height="6" stroke="currentColor" stroke-width="1.2"/>' +
        '</svg>';
    }
    if (kind === "wave") {
      return '<svg viewBox="0 0 100 100" fill="none" xmlns="' + SVG_NS + '">' +
        '<path d="M5 60 Q 17 30, 30 60 T 55 60 T 80 60 T 105 60" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M5 50 Q 17 20, 30 50 T 55 50 T 80 50 T 105 50" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" opacity=".55"/>' +
        '<path d="M5 70 Q 17 40, 30 70 T 55 70 T 80 70 T 105 70" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" opacity=".4"/>' +
        '</svg>';
    }
    return "";
  }

  /* ============================================================
     SPLASH
     ============================================================ */
  function initSplash() {
    var splash = $("[data-splash]");
    if (!splash) return;
    var hide = function () {
      splash.classList.add("is-out");
      setTimeout(function () { splash.style.display = "none"; }, 1200);
    };
    if (document.readyState === "complete") setTimeout(hide, 3000);
    else window.addEventListener("load", function () { setTimeout(hide, 2600); });
    setTimeout(hide, 4200);
  }

  /* ============================================================
     NAV
     ============================================================ */
  function initNav() {
    var nav = $("[data-nav]");
    if (!nav) return;
    var burger = $("[data-burger]", nav);

    var onScroll = function () {
      if (window.scrollY > 30) nav.classList.add("is-scrolled");
      else nav.classList.remove("is-scrolled");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (burger) {
      burger.addEventListener("click", function () {
        var isOpen = nav.classList.toggle("is-open");
        burger.setAttribute("aria-expanded", isOpen ? "true" : "false");
        document.body.style.overflow = isOpen ? "hidden" : "";
      });
    }

    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      if (nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        if (burger) burger.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      }
      var navH = 70;
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - navH,
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
      });
    });
  }

  /* ============================================================
     CUSTOM CURSOR
     ============================================================ */
  function initCursor() {
    if (!fineHover) return;
    var cursor = $(".cursor");
    var ring   = $(".cursor-ring");
    var dot    = $(".cursor-dot");
    var label  = $("[data-cursor-label]");
    if (!cursor || !ring || !dot) return;

    var firstMove = false;
    var mx = 0, my = 0, rx = 0, ry = 0;

    window.addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = "translate3d(" + mx + "px," + my + "px,0)";
      if (!firstMove) {
        firstMove = true;
        rx = mx; ry = my;
        ring.style.transform = "translate3d(" + rx + "px," + ry + "px,0)";
        cursor.classList.add("is-ready");
      }
    });

    function tick() {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      if (firstMove) ring.style.transform = "translate3d(" + rx + "px," + ry + "px,0)";
      requestAnimationFrame(tick);
    }
    tick();

    var hovers = $$("[data-cursor-hover], a, button, input, textarea, label, .session, .collage-item, .detalle");
    hovers.forEach(function (el) {
      el.addEventListener("mouseover", function (e) {
        if (el.contains(e.relatedTarget)) return;
        var l = el.getAttribute("data-cursor-hover") || "";
        if (label) label.textContent = l;
        cursor.classList.add("is-hover");
      });
      el.addEventListener("mouseout", function (e) {
        if (el.contains(e.relatedTarget)) return;
        cursor.classList.remove("is-hover");
        if (label) label.textContent = "";
      });
    });
  }

  /* ============================================================
     SPLIT TEXT
     ============================================================ */
  function splitChildren(el, mode) {
    var nodes = Array.prototype.slice.call(el.childNodes);
    var out = [];
    nodes.forEach(function (n) {
      if (n.nodeType === 3) {
        var txt = n.textContent;
        if (mode === "words" || mode === "lines") {
          var parts = txt.split(/(\s+)/);
          parts.forEach(function (p) {
            if (/^\s+$/.test(p)) out.push(document.createTextNode(p));
            else if (p.length) {
              var s = document.createElement("span");
              s.className = mode === "lines" ? "split-line" : "split-word";
              s.textContent = p;
              out.push(s);
            }
          });
        } else out.push(n);
      } else if (n.nodeName === "BR") {
        out.push(n.cloneNode(true));
      } else if (n.nodeType === 1) {
        var clone = n.cloneNode(false);
        var inner = splitChildren(n.cloneNode(true), mode);
        inner.forEach(function (c) { clone.appendChild(c); });
        out.push(clone);
      }
    });
    return out;
  }
  function initSplitText() {
    $$("[data-split]").forEach(function (el) {
      var mode = el.getAttribute("data-split") || "words";
      var newChildren = splitChildren(el, mode);
      el.innerHTML = "";
      newChildren.forEach(function (c) { el.appendChild(c); });
      var spans = el.querySelectorAll(mode === "lines" ? ".split-line" : ".split-word");
      spans.forEach(function (s, i) { s.style.setProperty("--i", i); });
    });
  }

  /* ============================================================
     REVEAL OBSERVER
     ============================================================ */
  function initReveals() {
    var els = $$(".reveal");
    if (!("IntersectionObserver" in window) || !els.length) {
      els.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.04, rootMargin: "0px 0px -4% 0px" });
    els.forEach(function (el) { io.observe(el); });

    setTimeout(function () {
      $$(".reveal:not(.is-visible)").forEach(function (el) {
        var top = el.getBoundingClientRect().top;
        if (top < window.innerHeight + 200) el.classList.add("is-visible");
      });
    }, 6000);
  }

  /* ============================================================
     SESSION ICONS mount
     ============================================================ */
  function mountSessionIcons() {
    $$("[data-session-icon]").forEach(function (el) {
      if (el.children.length > 0) return;
      var kind = el.getAttribute("data-session-icon");
      el.innerHTML = buildSessionIconSVG(kind);
    });
  }

  /* ============================================================
     HOURS — mark today's row + dynamic side-mark + hero foot
     ============================================================ */
  // Index: Sun=0, Mon=1 ... matching our DOM order in hours-list which is Mon..Sun
  var HOURS_INFO = [
    { closed: true,  open: "20:00", close: "02:00", label: "Cerrado lunes" },     // Mon
    { closed: true,  open: "20:00", close: "02:00", label: "Cerrado martes" },    // Tue
    { closed: false, open: "20:00", close: "02:00", label: "Abierto · 20:00 → 02:00" }, // Wed
    { closed: false, open: "20:00", close: "02:00", label: "Abierto · 20:00 → 02:00" }, // Thu
    { closed: false, open: "20:00", close: "03:00", label: "Abierto · 20:00 → 03:00" }, // Fri
    { closed: false, open: "20:00", close: "03:00", label: "Abierto · 20:00 → 03:00" }, // Sat
    { closed: false, open: "20:00", close: "02:00", label: "Abierto · 20:00 → 02:00" }  // Sun
  ];
  function todayIdx() {
    var d = new Date().getDay(); // 0=Sun..6=Sat
    return d === 0 ? 6 : d - 1; // map to our Mon..Sun array (0..6)
  }
  function initHours() {
    var rows = $$(".hours-row");
    var idx = todayIdx();
    if (rows[idx]) rows[idx].classList.add("is-today");

    // Hero foot: "Esta noche"
    var tonight = $("[data-tonight]");
    if (tonight) {
      var info = HOURS_INFO[idx];
      tonight.textContent = info.closed ? "Cerrado hoy" : info.open + " → " + info.close;
    }

    // Side mark
    var sideText = $("[data-side-mark-text]");
    if (sideText) {
      sideText.textContent = HOURS_INFO[idx].label;
    }
  }

  /* ============================================================
     COLLAGE parallax
     ============================================================ */
  function initCollageHover() {
    if (!fineHover) return;
    var collage = $("[data-collage]");
    if (!collage) return;
    var items = $$(".collage-item", collage);
    collage.addEventListener("mousemove", function (e) {
      var rect = collage.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;
      var y = (e.clientY - rect.top) / rect.height - 0.5;
      items.forEach(function (it, i) {
        var depth = (i + 1) * 6;
        it.style.transition = "transform .4s var(--ease-out)";
        var base = getComputedStyle(it).getPropertyValue("--base-rot") || "0deg";
        it.style.transform = "translate3d(" + (x * depth) + "px," + (y * depth) + "px,0) rotate(" + base + ")";
      });
    });
    collage.addEventListener("mouseleave", function () {
      items.forEach(function (it) {
        it.style.transition = "transform .8s var(--ease-out)";
        it.style.transform = "";
      });
    });
  }

  /* ============================================================
     DETALLES — entrance stagger
     ============================================================ */
  function initDetalles() {
    if (!("IntersectionObserver" in window)) return;
    var grid = $("[data-detalles]");
    if (!grid) return;
    var items = $$(".detalle", grid);
    items.forEach(function (it, i) {
      it.style.opacity = "0";
      it.style.transform = "translateY(28px)";
      it.style.transition = "opacity .8s var(--ease-out) " + (i * 70) + "ms, transform .8s var(--ease-out) " + (i * 70) + "ms";
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          items.forEach(function (it) {
            it.style.opacity = "1";
            it.style.transform = "translateY(0)";
          });
          io.disconnect();
        }
      });
    }, { threshold: 0.05 });
    io.observe(grid);

    setTimeout(function () {
      items.forEach(function (it) { it.style.opacity = "1"; it.style.transform = ""; });
    }, 6000);
  }

  /* ============================================================
     MENU TABS
     ============================================================ */
  function initMenu() {
    var tabsEl = $("[data-menu-tabs]");
    var panelsEl = $("[data-menu-panels]");
    if (!tabsEl || !panelsEl) return;
    tabsEl.addEventListener("click", function (e) {
      var tab = e.target.closest("[data-tab]");
      if (!tab) return;
      var id = tab.getAttribute("data-tab");
      $$("[data-tab]", tabsEl).forEach(function (t) {
        var on = t === tab;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
      });
      $$("[data-panel]", panelsEl).forEach(function (p) {
        p.classList.toggle("is-active", p.getAttribute("data-panel") === id);
      });
    });
  }

  /* ============================================================
     RESERVA → WhatsApp
     ============================================================ */
  function initReserva() {
    var form = $("[data-reserva]");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var f = new FormData(form);
      var nombre   = (f.get("nombre")   || "").toString().trim();
      var telefono = (f.get("telefono") || "").toString().trim();
      var dia      = (f.get("dia")      || "").toString().trim();
      var personas = (f.get("personas") || "").toString().trim();
      var nota     = (f.get("nota")     || "").toString().trim();
      var msg =
        "Hola El Ciclista, me gustaría reservar mesa.\n" +
        "Nombre: " + nombre + "\n" +
        "Personas: " + personas + "\n" +
        "Día y hora: " + dia + "\n" +
        "Teléfono: " + telefono +
        (nota ? "\nNota: " + nota : "");
      var url = "https://wa.me/34692805716?text=" + encodeURIComponent(msg);
      window.open(url, "_blank", "noopener");
    });
  }

  /* ============================================================
     AURORA mouse follow
     ============================================================ */
  function initAurora() {
    if (!fineHover) return;
    var aurora = $(".aurora");
    if (!aurora) return;
    var tx = 0, ty = 0, x = 0, y = 0;
    window.addEventListener("mousemove", function (e) {
      tx = (e.clientX / window.innerWidth - 0.5) * 12;
      ty = (e.clientY / window.innerHeight - 0.5) * 8;
    });
    function loop() {
      x += (tx - x) * 0.04;
      y += (ty - y) * 0.04;
      aurora.style.transform = "translate3d(" + x.toFixed(2) + "%," + y.toFixed(2) + "%,0)";
      requestAnimationFrame(loop);
    }
    loop();
  }

  /* ============================================================
     BOOT
     ============================================================ */
  function boot() {
    safe(mountSessionIcons, "mountSessionIcons");

    safe(initSplash, "initSplash");
    safe(initNav, "initNav");
    safe(initCursor, "initCursor");
    safe(initSplitText, "initSplitText");
    safe(initReveals, "initReveals");
    safe(initHours, "initHours");
    safe(initCollageHover, "initCollageHover");
    safe(initDetalles, "initDetalles");
    safe(initMenu, "initMenu");
    safe(initReserva, "initReserva");
    safe(initAurora, "initAurora");

    if (window.gsap && window.ScrollTrigger) {
      try { gsap.registerPlugin(ScrollTrigger); } catch (_) {}
    }

    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
