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
     4. Wires up scroll frosting and mobile-menu toggle
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

  /* ── 2. Active-page detection ── */
  var path = window.location.pathname;
  var page = path.indexOf('meny')     !== -1 ? 'meny'
           : path.indexOf('historie') !== -1 ? 'historie'
           : path.indexOf('book-oss') !== -1 ? 'book'
           : 'hjem';

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
            navLink('./index.html#lokasjon', 'lokasjon', 'LOKASJON') +
            navLink('./index.html#kontakt',  'kontakt',  'KONTAKT')  +
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
        navLink('./index.html#lokasjon', 'lokasjon', 'LOKASJON')     +
        navLink('./index.html#kontakt',  'kontakt',  'KONTAKT')      +
        '<a href="./book-oss.html" class="site-nav__mobile-cta">Book oss</a>' +
      '</div>' +

    '</header>';

  /* ── 4. Insert at top of <body> ── */
  document.body.insertAdjacentHTML('afterbegin', html);

  /* ── 5. Behaviour ── */
  function init() {
    var nav    = document.getElementById('siteNav');
    var toggle = document.getElementById('siteNavToggle');
    var mobile = document.getElementById('siteNavMobile');

    if (!nav) return;

    /* Scroll → frosted glass */
    function onScroll() {
      nav.classList.toggle('is-scrolled', window.scrollY > 40);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); /* run once on load */

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
