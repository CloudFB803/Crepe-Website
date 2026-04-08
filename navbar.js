/* =============================================================
   navbar.js — Global site navigation
   Crêpe de la Crêpe
   =============================================================
   Usage: place the following as the FIRST element in <body>
   on every page:

     <script src="./navbar.js"></script>

   The script:
     1. Injects the League Spartan font into <head>
     2. Builds and inserts the navbar HTML into the DOM
     3. Marks the active link based on the current URL
     4. Wires up scroll behaviour and mobile-menu toggle
   ============================================================= */

(function () {
  'use strict';

  /* ── 1. Font injection ── */
  if (!document.querySelector('link[href*="League+Spartan"]')) {
    var fl = document.createElement('link');
    fl.rel  = 'stylesheet';
    fl.href = 'https://fonts.googleapis.com/css2?family=League+Spartan:wght@700;800;900&display=swap';
    document.head.appendChild(fl);
  }

  /* ── 2. Active-page detection + body class ── */
  var path = window.location.pathname;
  var page = path.indexOf('meny')     !== -1 ? 'meny'
           : path.indexOf('historie') !== -1 ? 'historie'
           : path.indexOf('book-oss') !== -1 ? 'book'
           : 'hjem';

  var isHome = (page === 'hjem');
  document.body.classList.add(isHome ? 'page-home' : 'page-inner');

  function navLink(href, key, label) {
    var cls = 'site-nav__link' + (key === page ? ' is-active' : '');
    return '<a href="' + href + '" class="' + cls + '">' + label + '</a>';
  }

  /* ── 3. Build navbar HTML ── */
  var html =
    '<header class="site-nav" id="siteNav" role="banner">' +

      '<div class="site-nav__inner">' +

        /* Left links: HJEM · MENY · VÅR HISTORIE */
        '<nav class="site-nav__left" aria-label="Venstre navigasjon">' +
          navLink('./index.html',    'hjem',     'HJEM')     +
          navLink('./meny.html',     'meny',     'MENY')     +
          navLink('./historie.html', 'historie', 'VÅR HISTORIE') +
        '</nav>' +

        /* Logo — absolutely centred in the viewport */
        '<a href="./index.html" class="site-nav__logo" aria-label="Crêpe de la Crêpe – forsiden">' +
          '<img src="./crepe-logo-transparent.png" alt="Crêpe de la Crêpe" width="56" height="56">' +
        '</a>' +

        /* Right links: LOKASJON · KONTAKT + CTA */
        '<div class="site-nav__right">' +
          '<div class="site-nav__right-links">' +
            navLink(isHome ? '#lokasjon' : './index.html#lokasjon', 'lokasjon', 'LOKASJON') +
            navLink(isHome ? '#kontakt' : './index.html#kontakt',  'kontakt',  'KONTAKT')  +
          '</div>' +
          '<a href="./book-oss.html" class="site-nav__cta' + (page === 'book' ? ' is-active' : '') + '">' +
            'Book oss' +
          '</a>' +
        '</div>' +

        /* Mobile hamburger */
        '<button class="site-nav__toggle" id="siteNavToggle"' +
                ' aria-label="Åpne meny" aria-expanded="false" aria-controls="siteNavMobile">' +
          '<span class="site-nav__bar"></span>' +
          '<span class="site-nav__bar"></span>' +
          '<span class="site-nav__bar"></span>' +
        '</button>' +

      '</div>' +

      /* Mobile dropdown */
      '<div class="site-nav__mobile" id="siteNavMobile" aria-hidden="true">' +
        navLink('./index.html',          'hjem',     'HJEM')         +
        navLink('./meny.html',           'meny',     'MENY')         +
        navLink('./historie.html',       'historie', 'VÅR HISTORIE') +
        navLink(isHome ? '#lokasjon' : './index.html#lokasjon', 'lokasjon', 'LOKASJON')     +
        navLink(isHome ? '#kontakt' : './index.html#kontakt',  'kontakt',  'KONTAKT')      +
        '<a href="./book-oss.html" class="site-nav__mobile-cta">Book oss</a>' +
      '</div>' +

    '</header>' +

    /* Floating CTA — desktop only, always visible (hidden via CSS on mobile) */
    '<a href="./book-oss.html" class="site-nav__floating-cta" aria-label="Book oss – Book Crêpe de la Crêpe">' +
      'Book oss' +
    '</a>';

  /* ── 4. Insert at top of <body> ── */
  document.body.insertAdjacentHTML('afterbegin', html);

  /* ── 5. Behaviour ── */
  function init() {
    var nav    = document.getElementById('siteNav');
    var toggle = document.getElementById('siteNavToggle');
    var mobile = document.getElementById('siteNavMobile');

    if (!nav) return;

    /* Desktop media query — all new scroll logic is desktop-only */
    var desktopMQ = window.matchMedia('(min-width: 861px)');

    var ticking = false;

    function updateNav() {
      var y = window.scrollY;

      if (desktopMQ.matches) {
        nav.classList.toggle('is-scrolled', y > 80);
        nav.classList.toggle('navbar-transparent', y <= 50);
      } else {
        /* Keep mobile navbar transparent on every page, even after scroll */
        nav.classList.remove('is-scrolled');
        nav.classList.remove('navbar-transparent');
      }

      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(updateNav);
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    updateNav(); /* run once on load */

    if (!toggle || !mobile) return;

    function closeMenu() {
      mobile.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      mobile.setAttribute('aria-hidden', 'true');
    }

    function openMenu() {
      mobile.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      mobile.setAttribute('aria-hidden', 'false');
    }

    /* Toggle on hamburger click */
    toggle.addEventListener('click', function () {
      mobile.classList.contains('is-open') ? closeMenu() : openMenu();
    });

    /* Close when a mobile link is tapped */
    mobile.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });

    /* Close on Escape */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });

    /* Close on outside click */
    document.addEventListener('click', function (e) {
      if (!nav.contains(e.target)) closeMenu();
    });

    /* Close when resized above mobile breakpoint */
    var mq = window.matchMedia('(min-width: 861px)');
    mq.addEventListener('change', function (e) {
      if (e.matches) closeMenu();
    });
  }

  /* Run after DOM is ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
