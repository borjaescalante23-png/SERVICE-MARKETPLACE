/* ══════════════════════════════════════════════
   LA SCRIMA — main.js
   IIFE pattern · safe() wrapper · No modules
   ══════════════════════════════════════════════ */
;(function () {
  'use strict';

  var M = window.__LASCRIMA__ || {};

  function safe(fn, name) {
    try { fn(); }
    catch (e) { console.warn('[La Scrima] ' + (name || 'unknown') + ' failed:', e); }
  }

  /* ── Splash — double safety net ── */
  safe(function () {
    var splash = document.getElementById('splash');
    if (!splash) return;

    // JS hide after 3.2s (CSS backup at 4.5s)
    setTimeout(function () {
      splash.classList.add('hide');
      document.body.style.overflow = '';
    }, 3200);

    // Absolute safety: 6s
    setTimeout(function () {
      if (splash.parentNode) {
        splash.style.display = 'none';
      }
    }, 6000);
  }, 'splash');

  /* ── Nav scroll state ── */
  safe(function () {
    var nav = document.querySelector('.nav');
    if (!nav) return;
    var last = 0;
    window.addEventListener('scroll', function () {
      var y = window.pageYOffset;
      if (y > 60) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
      last = y;
    }, { passive: true });
  }, 'navScroll');

  /* ── Burger menu ── */
  safe(function () {
    var burger = document.querySelector('.nav__burger');
    var mobile = document.querySelector('.nav__mobile');
    if (!burger || !mobile) return;

    burger.addEventListener('click', function () {
      burger.classList.toggle('open');
      mobile.classList.toggle('open');
      document.body.style.overflow = mobile.classList.contains('open') ? 'hidden' : '';
    });

    mobile.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        burger.classList.remove('open');
        mobile.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }, 'burger');

  /* ── Custom cursor ── */
  safe(function () {
    if (!window.matchMedia('(hover: hover)').matches) return;

    var ring = document.querySelector('.cursor-ring');
    var label = document.querySelector('.cursor-label');
    if (!ring || !label) return;

    var mx = 0, my = 0, cx = 0, cy = 0;

    document.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
    });

    (function loop() {
      cx += (mx - cx) * 0.15;
      cy += (my - cy) * 0.15;
      ring.style.left = cx + 'px';
      ring.style.top = cy + 'px';
      label.style.left = cx + 'px';
      label.style.top = cy + 'px';
      requestAnimationFrame(loop);
    })();

    document.querySelectorAll('[data-cursor]').forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        label.textContent = el.getAttribute('data-cursor');
        label.classList.add('show');
        ring.style.width = '60px';
        ring.style.height = '60px';
      });
      el.addEventListener('mouseleave', function () {
        label.classList.remove('show');
        ring.style.width = '40px';
        ring.style.height = '40px';
      });
    });
  }, 'cursor');

  /* ── Reveal (IntersectionObserver) ── */
  safe(function () {
    var els = document.querySelectorAll('.reveal');
    if (!els.length) return;

    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05 });

    els.forEach(function (el) { observer.observe(el); });

    // Safety timeout: reveal everything after 6s
    setTimeout(function () {
      els.forEach(function (el) { el.classList.add('is-visible'); });
    }, 6000);
  }, 'reveal');

  /* ── GSAP + ScrollTrigger animations ── */
  safe(function () {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    // Hero elements
    var tl = gsap.timeline({ delay: 3.4 });
    tl.from('.hero__kicker', { opacity: 0, y: 20, duration: 0.8, ease: 'power3.out' })
      .from('.hero__title', { opacity: 0, y: 40, duration: 1, ease: 'power3.out' }, '-=0.5')
      .from('.hero__slogan', { opacity: 0, y: 20, duration: 0.8, ease: 'power3.out' }, '-=0.6')
      .from('.hero__ctas', { opacity: 0, y: 20, duration: 0.8, ease: 'power3.out' }, '-=0.5');

    // Section titles
    gsap.utils.toArray('.section__title').forEach(function (el) {
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        opacity: 0, y: 40, duration: 1, ease: 'power3.out'
      });
    });

    // Service cards stagger
    gsap.utils.toArray('.service-card').forEach(function (el, i) {
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        opacity: 0, y: 30, duration: 0.7, delay: i * 0.1, ease: 'power3.out'
      });
    });

    // Review cards
    gsap.utils.toArray('.review-card').forEach(function (el, i) {
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        opacity: 0, y: 30, duration: 0.7, delay: i * 0.12, ease: 'power3.out'
      });
    });

    // Team cards
    gsap.utils.toArray('.team-card').forEach(function (el, i) {
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        opacity: 0, x: i % 2 === 0 ? -30 : 30, duration: 0.8, ease: 'power3.out'
      });
    });

    // Parallax on hero image
    var heroImg = document.querySelector('.hero__image');
    if (heroImg) {
      gsap.to(heroImg, {
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 },
        y: 100, opacity: 0.05
      });
    }
  }, 'gsapAnims');

  /* ── Booking form → WhatsApp ── */
  safe(function () {
    var form = document.getElementById('bookingForm');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var name = form.querySelector('[name="name"]').value.trim();
      var phone = form.querySelector('[name="phone"]').value.trim();
      var service = form.querySelector('[name="service"]').value;
      var day = form.querySelector('[name="day"]').value.trim();
      var note = form.querySelector('[name="note"]').value.trim();

      if (!name || !phone || !service) return;

      var msg = 'Hola La Scrima! Quiero reservar:\n\n'
        + 'Nombre: ' + name + '\n'
        + 'Tel: ' + phone + '\n'
        + 'Servicio: ' + service + '\n'
        + (day ? 'Dia preferido: ' + day + '\n' : '')
        + (note ? 'Nota: ' + note + '\n' : '')
        + '\nEnviado desde lascrima.com';

      var url = 'https://wa.me/' + (M.phoneRaw || '34609134077')
        + '?text=' + encodeURIComponent(msg);
      window.open(url, '_blank');
    });
  }, 'booking');

  /* ── Smooth scroll for anchor links ── */
  safe(function () {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var target = document.querySelector(a.getAttribute('href'));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }, 'smoothScroll');

})();
