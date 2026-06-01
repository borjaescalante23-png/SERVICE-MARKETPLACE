/* ============================================================================
   El Ciclista Cocktail Bar — main.js
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
  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[" + name + "]", e); }
  }
  var fineHover = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var reduced   = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SVG_NS = "http://www.w3.org/2000/svg";

  /* ============================================================
     COCKTAIL ART — 8 line-art SVG copas (poligonal, no realista)
     ============================================================ */
  function buildGlassSVG(type, liquid, accent) {
    /* Cada tipo es un objeto con paths para silueta y para líquido.
       Coordenadas en viewBox 400x500 con centro en (200, 280). */
    var defs = '<defs><linearGradient id="liq-' + type + '-' + Math.random().toString(36).slice(2,7) + '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="' + liquid + '" stop-opacity="0.95"/><stop offset="1" stop-color="' + liquid + '" stop-opacity="0.65"/></linearGradient></defs>';
    var glassStroke = "";
    var glassLiquid = "";
    var glassDetail = "";

    if (type === "martini") {
      // V-shape, long stem
      glassStroke =
        '<path class="glass-stroke" d="M 80 110 L 320 110 L 200 290 L 200 410 L 250 430 L 150 430 L 200 410"/>' +
        '<ellipse class="glass-stroke" cx="200" cy="110" rx="120" ry="8"/>';
      glassLiquid =
        '<path class="glass-liquid" d="M 96 118 L 304 118 L 200 280 L 200 290 Z" fill="' + liquid + '" opacity="0.92"/>' +
        '<ellipse class="glass-liquid" cx="200" cy="118" rx="104" ry="6" fill="' + liquid + '" opacity="0.85"/>';
      glassDetail =
        '<line class="glass-detail" x1="280" y1="80" x2="320" y2="60" stroke="' + accent + '" stroke-width="2" stroke-linecap="round"/>' +
        '<circle class="glass-detail" cx="324" cy="58" r="6" fill="none" stroke="' + accent + '" stroke-width="1.6"/>' +
        '<line class="glass-detail" x1="324" y1="58" x2="324" y2="50" stroke="' + accent + '" stroke-width="1.6"/>';
    }
    else if (type === "highball") {
      // tall straight cylinder
      glassStroke =
        '<path class="glass-stroke" d="M 130 80 L 130 420 Q 130 440 150 440 L 250 440 Q 270 440 270 420 L 270 80"/>' +
        '<ellipse class="glass-stroke" cx="200" cy="80" rx="70" ry="8"/>' +
        '<ellipse class="glass-stroke" cx="200" cy="440" rx="65" ry="6" opacity="0.6"/>';
      glassLiquid =
        '<path class="glass-liquid" d="M 132 180 L 132 420 Q 132 438 150 438 L 250 438 Q 268 438 268 420 L 268 180 Z" fill="' + liquid + '" opacity="0.88"/>' +
        '<ellipse class="glass-liquid" cx="200" cy="180" rx="68" ry="6" fill="' + liquid + '" opacity="0.9"/>';
      glassDetail =
        // ice cubes
        '<rect class="glass-detail" x="148" y="220" width="42" height="40" rx="3" fill="none" stroke="#F2EBDA" stroke-width="1.2" opacity="0.6" transform="rotate(8 169 240)"/>' +
        '<rect class="glass-detail" x="200" y="260" width="48" height="44" rx="3" fill="none" stroke="#F2EBDA" stroke-width="1.2" opacity="0.55" transform="rotate(-12 224 282)"/>' +
        '<rect class="glass-detail" x="160" y="300" width="40" height="38" rx="3" fill="none" stroke="#F2EBDA" stroke-width="1.2" opacity="0.45" transform="rotate(15 180 319)"/>' +
        // straw
        '<line class="glass-detail" x1="232" y1="60" x2="220" y2="240" stroke="' + accent + '" stroke-width="2.4" stroke-linecap="round"/>';
    }
    else if (type === "old_fashioned") {
      // short stocky tumbler
      glassStroke =
        '<path class="glass-stroke" d="M 110 150 L 110 410 Q 110 430 130 430 L 270 430 Q 290 430 290 410 L 290 150"/>' +
        '<ellipse class="glass-stroke" cx="200" cy="150" rx="90" ry="8"/>' +
        '<ellipse class="glass-stroke" cx="200" cy="430" rx="80" ry="6" opacity="0.6"/>';
      glassLiquid =
        '<path class="glass-liquid" d="M 112 240 L 112 408 Q 112 428 130 428 L 270 428 Q 288 428 288 408 L 288 240 Z" fill="' + liquid + '" opacity="0.92"/>' +
        '<ellipse class="glass-liquid" cx="200" cy="240" rx="88" ry="6" fill="' + liquid + '" opacity="0.9"/>';
      glassDetail =
        // one big ice cube
        '<rect class="glass-detail" x="158" y="270" width="92" height="86" rx="6" fill="none" stroke="#F2EBDA" stroke-width="1.4" opacity="0.65" transform="rotate(6 204 313)"/>' +
        // orange peel spiral
        '<path class="glass-detail" d="M 180 180 Q 220 160 240 195 Q 230 220 200 215 Q 195 200 210 195" stroke="' + accent + '" stroke-width="2" fill="none" stroke-linecap="round"/>';
    }
    else if (type === "rocks") {
      // similar to old_fashioned but slightly wider & lower
      glassStroke =
        '<path class="glass-stroke" d="M 100 170 L 100 410 Q 100 430 120 430 L 280 430 Q 300 430 300 410 L 300 170"/>' +
        '<ellipse class="glass-stroke" cx="200" cy="170" rx="100" ry="9"/>' +
        '<ellipse class="glass-stroke" cx="200" cy="430" rx="85" ry="6" opacity="0.6"/>';
      glassLiquid =
        '<path class="glass-liquid" d="M 102 260 L 102 408 Q 102 428 120 428 L 280 428 Q 298 428 298 408 L 298 260 Z" fill="' + liquid + '" opacity="0.9"/>' +
        '<ellipse class="glass-liquid" cx="200" cy="260" rx="98" ry="7" fill="' + liquid + '" opacity="0.85"/>';
      glassDetail =
        '<rect class="glass-detail" x="140" y="280" width="58" height="56" rx="4" fill="none" stroke="#F2EBDA" stroke-width="1.4" opacity="0.6" transform="rotate(-10 169 308)"/>' +
        '<rect class="glass-detail" x="200" y="300" width="62" height="58" rx="4" fill="none" stroke="#F2EBDA" stroke-width="1.4" opacity="0.55" transform="rotate(14 231 329)"/>' +
        '<circle class="glass-detail" cx="200" cy="200" r="6" fill="' + accent + '"/>';
    }
    else if (type === "flute") {
      // narrow tall champagne flute
      glassStroke =
        '<path class="glass-stroke" d="M 165 80 Q 160 220 180 320 L 180 380 L 220 380 L 220 320 Q 240 220 235 80"/>' +
        '<ellipse class="glass-stroke" cx="200" cy="80" rx="35" ry="6"/>' +
        '<line class="glass-stroke" x1="200" y1="380" x2="200" y2="440"/>' +
        '<ellipse class="glass-stroke" cx="200" cy="445" rx="50" ry="6"/>';
      glassLiquid =
        '<path class="glass-liquid" d="M 167 120 Q 162 224 181 318 L 219 318 Q 238 224 233 120 Z" fill="' + liquid + '" opacity="0.88"/>' +
        '<ellipse class="glass-liquid" cx="200" cy="120" rx="33" ry="4" fill="' + liquid + '" opacity="0.95"/>';
      // bubbles
      glassDetail = "";
      for (var i = 0; i < 9; i++) {
        var cx = 180 + Math.floor(Math.random() * 40);
        var cy = 200 + Math.floor(Math.random() * 100);
        var r  = 1.6 + Math.random() * 2.4;
        glassDetail += '<circle class="glass-detail" cx="' + cx + '" cy="' + cy + '" r="' + r.toFixed(1) + '" fill="' + accent + '" opacity="0.7"/>';
      }
    }
    else if (type === "coupe") {
      // shallow saucer with stem
      glassStroke =
        '<path class="glass-stroke" d="M 70 140 Q 200 280 330 140"/>' +
        '<ellipse class="glass-stroke" cx="200" cy="140" rx="130" ry="14"/>' +
        '<line class="glass-stroke" x1="200" y1="278" x2="200" y2="410"/>' +
        '<ellipse class="glass-stroke" cx="200" cy="416" rx="60" ry="7"/>';
      glassLiquid =
        '<path class="glass-liquid" d="M 82 150 Q 200 260 318 150 L 200 250 Z" fill="' + liquid + '" opacity="0.88"/>' +
        '<ellipse class="glass-liquid" cx="200" cy="148" rx="125" ry="11" fill="' + liquid + '" opacity="0.78"/>';
      glassDetail =
        '<circle class="glass-detail" cx="200" cy="135" r="6" fill="' + accent + '" opacity="0.85"/>' +
        '<line class="glass-detail" x1="200" y1="135" x2="200" y2="100" stroke="' + accent + '" stroke-width="1.4"/>' +
        '<path class="glass-detail" d="M 200 100 Q 210 92 220 96" stroke="' + accent + '" stroke-width="1.4" fill="none" stroke-linecap="round"/>';
    }
    else {
      // fallback simple shape
      glassStroke =
        '<path class="glass-stroke" d="M 110 120 L 290 120 L 200 300 L 200 410 L 250 430 L 150 430 L 200 410"/>';
      glassLiquid =
        '<path class="glass-liquid" d="M 124 128 L 276 128 L 200 280 Z" fill="' + liquid + '" opacity="0.9"/>';
    }

    return '<svg viewBox="0 0 400 500" xmlns="' + SVG_NS + '" aria-hidden="true">' +
      defs +
      // subtle halo behind glass
      '<ellipse cx="200" cy="280" rx="180" ry="40" fill="' + accent + '" opacity="0.04" filter="blur(8px)"/>' +
      glassLiquid +
      glassStroke +
      glassDetail +
      '</svg>';
  }

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
      // pulsing waveform bars
      return '<svg viewBox="0 0 100 100" fill="none" xmlns="' + SVG_NS + '">' +
        '<g stroke="currentColor" stroke-width="3" stroke-linecap="round">' +
        '<line x1="14" y1="40" x2="14" y2="60"/>' +
        '<line x1="26" y1="28" x2="26" y2="72"/>' +
        '<line x1="38" y1="20" x2="38" y2="80"/>' +
        '<line x1="50" y1="10" x2="50" y2="90"/>' +
        '<line x1="62" y1="20" x2="62" y2="80"/>' +
        '<line x1="74" y1="28" x2="74" y2="72"/>' +
        '<line x1="86" y1="40" x2="86" y2="60"/>' +
        '</g>' +
        '</svg>';
    }
    if (kind === "disco") {
      // disco ball: circle with facets
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
    // belt and suspenders
    setTimeout(hide, 4200);
  }

  /* ============================================================
     NAV — burger + scrolled state + smooth anchors
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
      // close menu on mobile
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
      if (firstMove) {
        ring.style.transform = "translate3d(" + rx + "px," + ry + "px,0)";
      }
      requestAnimationFrame(tick);
    }
    tick();

    var hovers = $$("[data-cursor-hover], a, button, input, textarea, label, .cocktail, .session, .collage-item, .gallery-tile");
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
     SPLIT TEXT (preserves <br>, <em>, etc.)
     ============================================================ */
  function splitChildren(el, mode) {
    var nodes = Array.prototype.slice.call(el.childNodes);
    var out = [];
    nodes.forEach(function (n) {
      if (n.nodeType === 3) {
        // text node — split by words or by lines depending on mode
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
        // recursive split inside inline elements
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
      // Wrap each direct text child set
      var newChildren = splitChildren(el, mode);
      // Set the indices for staggered animation
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

    // safety net at 6s
    setTimeout(function () {
      $$(".reveal:not(.is-visible)").forEach(function (el) {
        var top = el.getBoundingClientRect().top;
        if (top < window.innerHeight + 200) el.classList.add("is-visible");
      });
    }, 6000);
  }

  /* ============================================================
     MOUNT COCKTAILS — render the 8 cocktails into the track
     ============================================================ */
  function mountCocktails() {
    var track = $("[data-coctel-track]");
    var list  = data.cocktails || [];
    if (!track || !list.length) return;
    // Idempotent: if first card was hardcoded, replace it cleanly
    track.innerHTML = "";

    list.forEach(function (c, i) {
      var article = document.createElement("article");
      article.className = "cocktail cocktail-" + c.id;
      article.style.setProperty("--accent", c.accent);

      var artHTML = '<div class="cocktail-art" data-cocktail-art="' + c.glass + '" style="--accent:' + c.accent + '">' +
        buildGlassSVG(c.glass, c.liquid, c.accent) +
      '</div>';

      var body =
        '<div class="cocktail-body">' +
          '<span class="cocktail-serie">' + escHTML(c.serie) + ' · ' + ("0" + (i+1)).slice(-2) + '</span>' +
          '<h3 class="cocktail-name">' + escHTML(c.name) + '</h3>' +
          '<p class="cocktail-sub">' + escHTML(c.subtitle) + '</p>' +
          '<ul class="cocktail-ing">' +
            c.ingredients.map(function (ing) { return '<li>' + escHTML(ing) + '</li>'; }).join("") +
          '</ul>' +
          '<p class="cocktail-desc">' + escHTML(c.description) + '</p>' +
        '</div>';

      article.innerHTML = artHTML + body;
      track.appendChild(article);
    });
  }

  /* ============================================================
     COCKTAIL PIN — pin + horizontal scroll (desktop) + observer for art reveal (both)
     ============================================================ */
  function initCocktailPin() {
    var section = $("[data-coctel]");
    var pin = $("[data-coctel-pin]");
    var track = $("[data-coctel-track]");
    var now = $("[data-coctel-now]");
    var fill = $("[data-coctel-fill]");
    if (!section || !pin || !track) return;

    var cards = $$(".cocktail", track);
    var total = cards.length;
    if (!total) return;

    function setProgress(idx) {
      var n = Math.max(0, Math.min(total - 1, Math.round(idx)));
      if (now) now.textContent = ("0" + (n + 1)).slice(-2);
      if (fill) fill.style.width = ((n + 1) / total * 100) + "%";
    }
    setProgress(0);

    // Reveal each cocktail art when its card enters viewport (works for desktop + mobile)
    var artIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var art = e.target.querySelector(".cocktail-art");
        if (e.isIntersecting && art) art.classList.add("is-drawn");
      });
    }, { threshold: 0.25 });
    cards.forEach(function (c) { artIO.observe(c); });

    // Safety net for art
    setTimeout(function () {
      $$(".cocktail-art:not(.is-drawn)").forEach(function (a) { a.classList.add("is-drawn"); });
    }, 6500);

    var isDesktop = matchMedia("(min-width: 960px)").matches;

    if (isDesktop && window.gsap && window.ScrollTrigger) {
      // desktop: pin section + translate track
      var trackW = function () { return track.scrollWidth; };
      var vw     = function () { return window.innerWidth; };
      var maxX   = function () { return -(trackW() - vw()); };

      gsap.to(track, {
        x: maxX,
        ease: "none",
        scrollTrigger: {
          trigger: pin,
          start: "top top+=" + 0,
          end: function () { return "+=" + (trackW() - vw()); },
          scrub: 0.6,
          pin: true,
          invalidateOnRefresh: true,
          onUpdate: function (self) {
            var idx = self.progress * (total - 1);
            setProgress(idx);
          }
        }
      });

      // Reset transforms on resize between desktop/mobile
      window.addEventListener("resize", function () {
        ScrollTrigger.refresh();
      });
    } else {
      // mobile: native horizontal swipe. Update progress via scroll listener.
      track.style.transform = "";
      track.addEventListener("scroll", function () {
        var sx = track.scrollLeft;
        var card = cards[0];
        var w = card ? card.getBoundingClientRect().width + parseFloat(getComputedStyle(track).gap || 0) : vw();
        var idx = sx / w;
        setProgress(idx);
      }, { passive: true });
    }
  }

  /* ============================================================
     SESSION ICONS — inject SVGs
     ============================================================ */
  function mountSessionIcons() {
    $$("[data-session-icon]").forEach(function (el) {
      if (el.children.length > 0) return;
      var kind = el.getAttribute("data-session-icon");
      el.innerHTML = buildSessionIconSVG(kind);
    });
  }

  /* ============================================================
     GALLERY — mount 3 rows of tiles (duplicated for seamless loop)
     ============================================================ */
  function mountGallery() {
    var rows = $$("[data-gallery-row]");
    var pics = (data.gallery || []).slice();
    if (!pics.length || !rows.length) return;
    rows.forEach(function (row) {
      if (row.children.length > 0) return;
      var which = row.getAttribute("data-gallery-row");
      var list = pics.slice();
      // shuffle by row identity (deterministic)
      var seed = which === "fast" ? 3 : which === "slow" ? 7 : 11;
      list = list.map(function (v, i) { return { v: v, k: (i * seed) % list.length }; })
                 .sort(function (a, b) { return a.k - b.k; })
                 .map(function (o) { return o.v; });
      // duplicate so the loop is seamless
      var doubled = list.concat(list);
      doubled.forEach(function (src, i) {
        var fig = document.createElement("div");
        fig.className = "gallery-tile";
        fig.innerHTML = '<img src="' + escHTML(src) + '" alt="" loading="lazy" decoding="async"/>';
        row.appendChild(fig);
      });
    });
  }

  /* ============================================================
     COLLAGE — subtle parallax on mouse
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
        var base = it.style.getPropertyValue("--base-rot") ||
                   getComputedStyle(it).getPropertyValue("--base-rot") || "0deg";
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
     RESERVA — submit → WhatsApp message
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
     AURORA — react slightly to mouse (subtle)
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
    // 1. Mounts first (idempotent)
    safe(mountCocktails, "mountCocktails");
    safe(mountSessionIcons, "mountSessionIcons");
    safe(mountGallery, "mountGallery");

    // 2. Inits that don't depend on GSAP
    safe(initSplash, "initSplash");
    safe(initNav, "initNav");
    safe(initCursor, "initCursor");
    safe(initSplitText, "initSplitText");
    safe(initReveals, "initReveals");
    safe(initCollageHover, "initCollageHover");
    safe(initReserva, "initReserva");
    safe(initAurora, "initAurora");

    // 3. GSAP-dependent inits
    if (window.gsap && window.ScrollTrigger) {
      try { gsap.registerPlugin(ScrollTrigger); } catch (_) {}
      safe(initCocktailPin, "initCocktailPin");
    } else {
      // fallback: still run the cocktail observers (for mobile)
      safe(initCocktailPin, "initCocktailPin (no gsap)");
    }

    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
