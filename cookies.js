/* ── GDPR-samtykke, Google Analytics og hendelsessporing ────────────────────
   Analytics lastes først når den besøkende trykker «Godta». Valget lagres i
   localStorage under "cookieConsent", så modalen vises bare én gang.

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
      /* Uten lagring vises modalen på nytt neste gang. Det er akseptabelt. */
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

  /* Sporer klikk på enhver lenke merket med data-cta, uansett side. Slik
     ser vi hvilken inngang som faktisk driver bookinger.

     Unntaket er knappene som åpner bookingskjemaet direkte
     (.js-open-booking). Bookingsiden sporer dem selv med nøyaktig samme
     hendelse, så uten unntaket her ville hvert klikk telles to ganger. */
  document.addEventListener('click', function (event) {
    if (!event.target || !event.target.closest) return;
    if (event.target.closest('.js-open-booking')) return;

    var target = event.target.closest('[data-cta]');
    if (!target) return;
    window.cdlcTrack('booking_cta_click', { cta_location: target.dataset.cta });
  }, true);

  var consent = readConsent();

  if (consent === 'accepted') {
    loadGA4();
    return;
  }
  if (consent === 'declined') {
    queued = [];
    return;
  }

  /* Ingen registrert samtykke — vis modalen.

     Personvernsiden er unntaket: der skal folk få lese hva de sier ja til
     før de må velge. Modalen møter dem på neste side i stedet. */
  if (/personvern/i.test(window.location.pathname)) return;

  var SURFACE = '#fbf7f1';
  var INK = '#3b2e2a';
  var ACCENT = '#c98376';

  /* Valget må tas før siden kan brukes, så modalen er bevisst umulig å
     lukke: ingen kryss, ingen Esc, og klikk utenfor gjør ingenting. */
  var style = document.createElement('style');
  style.id = 'cookieConsentStyle';
  style.textContent = [
    '#cookieConsent{position:fixed;inset:0;top:0;right:0;bottom:0;left:0;',
      'z-index:2147483000;display:flex;align-items:center;justify-content:center;',
      'background:rgba(0,0,0,0.45);',
      "font-family:'Manrope',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;}",
    '#cookieConsentBox{width:calc(100% - 32px);max-width:380px;box-sizing:border-box;',
      'background:' + SURFACE + ';color:' + INK + ';border-radius:14px;padding:24px;',
      'box-shadow:0 10px 36px rgba(0,0,0,0.18);}',
    '#cookieConsentTitle{margin:0 0 10px;font-size:17px;font-weight:700;color:' + INK + ';}',
    '#cookieConsentText{margin:0 0 20px;font-size:14px;line-height:1.55;color:' + INK + ';}',
    '#cookieConsentText a{color:' + ACCENT + ';text-decoration:underline;}',
    '#cookieConsentActions{display:flex;gap:10px;}',
    /* flex:1 1 0 med identisk padding og ramme gir to like store knapper.
       Datatilsynet krever at «Avvis» er like lett å trykke som «Godta». */
    '#cookieConsent button{flex:1 1 0;min-width:0;min-height:44px;padding:11px 12px;',
      'border-radius:10px;font-family:inherit;font-size:14px;font-weight:600;',
      'line-height:1.2;cursor:pointer;box-sizing:border-box;}',
    '#cookieAccept{background:' + ACCENT + ';color:' + SURFACE + ';border:1px solid ' + ACCENT + ';}',
    '#cookieDecline{background:transparent;color:' + ACCENT + ';border:1px solid ' + ACCENT + ';}',
    '#cookieConsent button:focus-visible{outline:2px solid ' + INK + ';outline-offset:2px;}'
  ].join('');
  document.head.appendChild(style);

  var modal = document.createElement('div');
  modal.id = 'cookieConsent';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'cookieConsentTitle');
  modal.setAttribute('aria-describedby', 'cookieConsentText');

  modal.innerHTML =
    '<div id="cookieConsentBox">' +
      '<h2 id="cookieConsentTitle">Informasjonskapsler</h2>' +
      '<p id="cookieConsentText">' +
        'Vi bruker Google Analytics for å forstå hvordan nettsiden brukes. ' +
        'Du kan lese mer i <a href="/personvern.html">personvernerklæringen</a>.' +
      '</p>' +
      '<div id="cookieConsentActions">' +
        '<button id="cookieAccept" type="button">Godta</button>' +
        '<button id="cookieDecline" type="button">Avvis</button>' +
      '</div>' +
    '</div>';

  document.body.appendChild(modal);

  /* Siden bak skal ikke kunne scrolles mens valget står ubesvart. */
  var rootEl = document.documentElement;
  var prevRootOverflow = rootEl.style.overflow;
  var prevBodyOverflow = document.body.style.overflow;
  rootEl.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';

  var acceptBtn = document.getElementById('cookieAccept');
  var declineBtn = document.getElementById('cookieDecline');

  /* Esc skal ikke lukke, og Tab skal ikke nå siden bak. Lytteren ligger på
     document i capture-fasen, så den tar tastetrykket før andre skript. */
  function onKeydown(event) {
    if (event.key === 'Escape' || event.key === 'Esc') {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (event.key !== 'Tab') return;

    var focusable = modal.querySelectorAll('a[href], button');
    if (!focusable.length) return;

    var first = focusable[0];
    var last = focusable[focusable.length - 1];

    if (!modal.contains(document.activeElement)) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  document.addEventListener('keydown', onKeydown, true);

  function dismiss() {
    document.removeEventListener('keydown', onKeydown, true);
    rootEl.style.overflow = prevRootOverflow;
    document.body.style.overflow = prevBodyOverflow;
    if (modal.parentNode) modal.parentNode.removeChild(modal);
    if (style.parentNode) style.parentNode.removeChild(style);
  }

  acceptBtn.addEventListener('click', function () {
    saveConsent('accepted');
    dismiss();
    loadGA4();
  });

  declineBtn.addEventListener('click', function () {
    saveConsent('declined');
    dismiss();
    queued = [];
  });

  acceptBtn.focus({ preventScroll: true });
})();
