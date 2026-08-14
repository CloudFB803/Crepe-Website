/* ── GDPR Consent & GA4 — sitewide ──────────────────────────────────────────
   Replace G-XXXXXXXXXX below with your actual Google Analytics 4 Measurement
   ID (format: G-XXXXXXXXXX) and this script will handle consent + tracking on
   every page automatically.
   ─────────────────────────────────────────────────────────────────────────── */
(function () {
  var GA4_ID = 'G-XXXXXXXXXX';

  function loadGA4() {
    if (window.__ga4Loaded) return;
    window.__ga4Loaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA4_ID);
  }

  var consent = localStorage.getItem('cookieConsent');

  if (consent === 'accepted') {
    loadGA4();
    return;
  }
  if (consent === 'declined') {
    return;
  }

  /* No consent recorded yet — inject and show banner */
  var banner = document.createElement('div');
  banner.id = 'cookieConsent';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', 'Informasjonskapsler');
  banner.style.cssText = [
    'position:fixed', 'bottom:0', 'left:0', 'right:0', 'z-index:9999',
    'background:#2C2016', 'color:#FAF7F2',
    "font-family:'Manrope',sans-serif", 'font-size:14px',
    'padding:16px 24px', 'display:flex', 'align-items:center',
    'justify-content:space-between', 'gap:16px', 'flex-wrap:wrap',
    'box-shadow:0 -4px 24px rgba(0,0,0,0.25)'
  ].join(';');

  banner.innerHTML =
    '<p style="margin:0;flex:1;min-width:200px;line-height:1.5;">' +
      'Vi bruker informasjonskapsler (Google Analytics) for å forstå hvordan nettsiden brukes. ' +
      'Les mer i vår <a href="/personvern.html" style="color:#c98376;text-decoration:underline;">personvernerklæring</a>.' +
    '</p>' +
    '<div style="display:flex;gap:10px;flex-shrink:0;">' +
      '<button id="cookieAccept" type="button" style="background:#c98376;color:#FAF7F2;border:none;border-radius:6px;padding:10px 20px;font-family:\'Manrope\',sans-serif;font-size:14px;font-weight:600;cursor:pointer;">Godta</button>' +
      '<button id="cookieDecline" type="button" style="background:transparent;color:#FAF7F2;border:2px solid #c98376;border-radius:6px;padding:10px 20px;font-family:\'Manrope\',sans-serif;font-size:14px;font-weight:600;cursor:pointer;">Avvis</button>' +
    '</div>';

  document.body.appendChild(banner);

  document.getElementById('cookieAccept').addEventListener('click', function () {
    localStorage.setItem('cookieConsent', 'accepted');
    banner.style.display = 'none';
    loadGA4();
  });

  document.getElementById('cookieDecline').addEventListener('click', function () {
    localStorage.setItem('cookieConsent', 'declined');
    banner.style.display = 'none';
  });
})();
