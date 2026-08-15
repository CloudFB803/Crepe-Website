/* ── GDPR-samtykke, Google Analytics og hendelsessporing ────────────────────
   Analytics lastes først når den besøkende trykker «Godta». Valget lagres i
   localStorage under "cookieConsent", så banneret vises bare én gang.

   Andre skript sporer hendelser via window.cdlcTrack(navn, data, ferdig):

     cdlcTrack('booking_open', { entry_point: 'nav' });

   Funksjonen er alltid trygg å kalle. Har den besøkende ikke tatt stilling
   ennå, legges hendelsen i kø og sendes hvis de godtar. Har de avvist,
   forkastes den. Skript som bruker den trenger derfor ingen egne sjekker.
   ─────────────────────────────────────────────────────────────────────────── */
(function () {
  var GA4_ID = 'G-15J4MWRKKQ';
  var STORAGE_KEY = 'cookieConsent';
  var QUEUE_LIMIT = 50;

  var queued = [];
  var analyticsReady = false;

  /* localStorage kaster unntak i enkelte privat-modus-nettlesere. */
  function readConsent() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (err) {
      return null;
    }
  }

  function saveConsent(value) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch (err) {
      /* Uten lagring vises banneret på nytt neste gang. Det er akseptabelt. */
    }
  }

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

    analyticsReady = true;
    flushQueue();
  }

  function flushQueue() {
    if (!analyticsReady) return;
    for (var i = 0; i < queued.length; i++) {
      send(queued[i].name, queued[i].params, queued[i].done);
    }
    queued = [];
  }

  function send(name, params, done) {
    var payload = params || {};

    if (typeof done === 'function') {
      /* gtag er asynkron. Ved navigasjon rett etterpå kan hendelsen gå tapt,
         så vi venter på event_callback — med en tidsgrense i tilfelle den
         aldri kommer (blokkert av utvidelser, nettverksfeil). */
      var finished = false;
      var finish = function () {
        if (finished) return;
        finished = true;
        done();
      };
      payload.event_callback = finish;
      window.setTimeout(finish, 800);
      window.gtag('event', name, payload);
      return;
    }

    window.gtag('event', name, payload);
  }

  /* Offentlig sporings-API. Kaller aldri feil, uansett samtykkestatus. */
  window.cdlcTrack = function (name, params, done) {
    if (!name) return;

    var consent = readConsent();

    if (consent === 'declined') {
      if (typeof done === 'function') done();
      return;
    }

    if (analyticsReady && typeof window.gtag === 'function') {
      send(name, params, done);
      return;
    }

    /* Samtykke ikke tatt stilling til ennå — hold på hendelsen. */
    if (queued.length < QUEUE_LIMIT) {
      queued.push({ name: name, params: params, done: done });
    }

    /* Den som venter på callback skal ikke bli hengende hvis hendelsen
       aldri blir sendt. Slipp dem videre med én gang. */
    if (typeof done === 'function') done();
  };

  var consent = readConsent();

  if (consent === 'accepted') {
    loadGA4();
    return;
  }
  if (consent === 'declined') {
    queued = [];
    return;
  }

  /* Ingen registrert samtykke — vis banneret. */
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
    saveConsent('accepted');
    banner.style.display = 'none';
    loadGA4();
  });

  document.getElementById('cookieDecline').addEventListener('click', function () {
    saveConsent('declined');
    banner.style.display = 'none';
    queued = [];
  });
})();
