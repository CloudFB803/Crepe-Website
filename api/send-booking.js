function jsonResponse(body, status = 200, requestId = "") {
  const headers = {
    "Content-Type": "application/json; charset=utf-8"
  };

  if (requestId) {
    headers["X-Request-ID"] = requestId;
  }

  return new Response(JSON.stringify(body), {
    status,
    headers
  });
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeText(value = "") {
  return String(value)
    .replace(/\r/g, "")
    .trim();
}

function normalizeHeaderValue(value = "") {
  return String(value)
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clamp(value, maxLength) {
  return normalizeText(value).slice(0, maxLength);
}

function pickFirst(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return "";
}

function normalizePhoneForValidation(phone = "") {
  return String(phone).replace(/[^\d+]/g, "");
}

function normalizeSetup(value = "") {
  const raw = normalizeText(value).toLowerCase();

  if (!raw) return "";
  if (raw === "wagon" || raw === "crepe de la crepe wagon") return "Wagon";
  if (raw === "stand" || raw === "crepe de la crepe stand") return "Stand";
  if (
    raw === "pop-up" ||
    raw === "popup" ||
    raw === "pop up" ||
    raw === "crepe de la crepe pop-up" ||
    raw === "crepe de la crepe popup"
  ) {
    return "Pop-Up";
  }

  return "";
}

function normalizeEventType(value = "") {
  const raw = normalizeText(value).toLowerCase();

  if (!raw) return "";
  if (raw === "festival" || raw === "festivaler") return "Festival";
  if (raw === "firmaarrangement" || raw === "firmaarrangementer") return "Firmaarrangement";
  if (raw === "privat arrangement" || raw === "private arrangementer") return "Privat arrangement";

  return "";
}

function isValidEmail(email = "") {
  const normalized = String(email).trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(normalized) && normalized.length <= 150;
}

function isValidName(name = "") {
  const trimmed = String(name).trim();

  if (trimmed.length < 2 || trimmed.length > 80) return false;
  if (/\d/.test(trimmed)) return false;
  if (/([a-zA-ZæøåÆØÅ])\1{3,}/.test(trimmed)) return false;

  const lettersOnly = trimmed.replace(/[^A-Za-zÀ-ÖØ-öø-ÿĀ-žЀ-ӿ'’\-\s]/g, "");
  const letterCount = lettersOnly.replace(/[\s'’\-]/g, "").length;

  if (letterCount < 2) return false;
  if (!/^[A-Za-zÀ-ÖØ-öø-ÿĀ-žЀ-ӿ'’\-\s]+$/.test(trimmed)) return false;

  return true;
}

function isValidPhone(phone = "") {
  const normalized = normalizePhoneForValidation(phone);
  return /^\+\d{6,17}$/.test(normalized);
}

function isValidGuests(value = "") {
  if (!/^\d{1,6}$/.test(value)) return false;

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 999999;
}

function isValidLocation(value = "") {
  const trimmed = normalizeText(value);
  return trimmed.length >= 2 && trimmed.length <= 120;
}

function parseRealDate(value = "") {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

function isPastDateString(value = "") {
  const date = parseRealDate(value);
  if (!date) return true;

  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  return date.getTime() < todayUtc;
}

function isValidDateInput(value = "") {
  const normalized = normalizeText(value);
  if (!normalized) return false;

  const singleDatePattern = /^\d{4}-\d{2}-\d{2}$/;
  const rangePatternDash = /^(\d{4}-\d{2}-\d{2}) - (\d{4}-\d{2}-\d{2})$/;
  const rangePatternTil = /^(\d{4}-\d{2}-\d{2}) til (\d{4}-\d{2}-\d{2})$/i;

  if (singleDatePattern.test(normalized)) {
    const date = parseRealDate(normalized);
    if (!date) return false;
    if (isPastDateString(normalized)) return false;
    return true;
  }

  const rangeMatch = normalized.match(rangePatternDash) || normalized.match(rangePatternTil);
  if (!rangeMatch) return false;

  const from = rangeMatch[1];
  const to = rangeMatch[2];

  const fromDate = parseRealDate(from);
  const toDate = parseRealDate(to);

  if (!fromDate || !toDate) return false;
  if (to < from) return false;
  if (isPastDateString(from) || isPastDateString(to)) return false;

  return true;
}

function looksLikeSpamMessage(message = "") {
  if (!message) return false;

  const text = message.toLowerCase().trim();
  if (!text) return false;

  if (text.length > 1200) return true;
  if (/https?:\/\/|www\./i.test(text)) return true;
  if (/([a-z])\1{5,}/i.test(text)) return true;
  if (/\b(?:test|asdf|qwerty|awd|awdawd|jaf+ia?|heiheihei)\b/i.test(text)) return true;

  const repeatedChunkPattern = /(.{12,40}?)\1{2,}/i;
  if (repeatedChunkPattern.test(text.replace(/\s+/g, " "))) return true;

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return false;

  const longWord = words.some((word) => word.length > 35);
  if (longWord) return true;

  if (words.length >= 20) {
    const uniqueWords = new Set(words).size;
    const uniqueRatio = uniqueWords / words.length;
    if (uniqueRatio < 0.35) return true;
  }

  return false;
}

function parseAllowedOrigins(raw = "") {
  if (!raw || typeof raw !== "string") return [];

  const origins = raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const unique = new Set();

  for (const origin of origins) {
    let parsed;

    try {
      parsed = new URL(origin);
    } catch {
      continue;
    }

    if (!parsed.protocol || !parsed.host) continue;
    if (parsed.username || parsed.password) continue;
    if (parsed.pathname !== "/" || parsed.search || parsed.hash) continue;

    unique.add(parsed.origin);
  }

  return Array.from(unique);
}

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
// NOTE: In-memory limiter only. This is not a durable distributed production rate limiter.
const rateLimitStore = new Map();

function isRateLimited(ip = "") {
  const now = Date.now();

  for (const [storedIp, entry] of rateLimitStore.entries()) {
    if (!entry || now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
      rateLimitStore.delete(storedIp);
    }
  }

  const key = ip || "unknown";
  const current = rateLimitStore.get(key);

  if (!current) {
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return false;
  }

  if (now - current.windowStart >= RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return false;
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  current.count += 1;
  rateLimitStore.set(key, current);
  return false;
}

function getClientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("x-vercel-forwarded-for") ||
    request.headers.get("cf-connecting-ip") ||
    ""
  ).trim();
}

function logEvent(level, event, requestId, details = {}) {
  const payload = {
    level,
    event,
    requestId,
    ...details
  };

  if (level === "error") {
    console.error(JSON.stringify(payload));
  } else {
    console.warn(JSON.stringify(payload));
  }
}

export default {
  async fetch(request) {
    const requestId = crypto.randomUUID();
    const ip = getClientIp(request);

    if (request.method !== "POST") {
      return jsonResponse({ ok: false, error: "Method not allowed" }, 405, requestId);
    }

    try {
      const contentLength = Number(request.headers.get("content-length") || "0");
      if (Number.isFinite(contentLength) && contentLength > 20000) {
        return jsonResponse({ ok: false, error: "Forespørselen er for stor." }, 413, requestId);
      }

      const contentType = request.headers.get("content-type") || "";
      if (!contentType.toLowerCase().includes("application/json")) {
        logEvent("warn", "validation_failed", requestId, { reason: "invalid_content_type" });
        return jsonResponse({ ok: false, error: "Ugyldig innholdstype." }, 400, requestId);
      }

      const allowedOrigins = parseAllowedOrigins(process.env.ALLOWED_ORIGINS || "");
      if (allowedOrigins.length === 0) {
        logEvent("error", "unexpected_failure", requestId, { reason: "missing_allowed_origins" });
        return jsonResponse({
          ok: false,
          error: "Noe gikk galt. Prøv igjen senere."
        }, 500, requestId);
      }

      const origin = request.headers.get("origin") || "";
      if (!origin) {
        logEvent("warn", "origin_failed", requestId, { reason: "origin_missing" });
        return jsonResponse({ ok: false, error: "Ugyldig origin." }, 403, requestId);
      }

      let originValue = "";
      try {
        const originUrl = new URL(origin);
        originValue = originUrl.origin;
      } catch {
        logEvent("warn", "origin_failed", requestId, { reason: "origin_malformed" });
        return jsonResponse({ ok: false, error: "Ugyldig origin." }, 403, requestId);
      }

      if (!allowedOrigins.includes(originValue)) {
        logEvent("warn", "origin_failed", requestId, { reason: "origin_not_allowed", origin: originValue });
        return jsonResponse({ ok: false, error: "Ugyldig origin." }, 403, requestId);
      }

      const secFetchSite = (request.headers.get("sec-fetch-site") || "").toLowerCase();
      if (secFetchSite === "cross-site") {
        logEvent("warn", "origin_failed", requestId, { reason: "cross_site_request" });
        return jsonResponse({ ok: false, error: "Ugyldig forespørsel." }, 403, requestId);
      }

      let data = {};
      try {
        data = await request.json();
      } catch {
        logEvent("warn", "validation_failed", requestId, { reason: "invalid_json" });
        return jsonResponse({ ok: false, error: "Ugyldig JSON-data." }, 400, requestId);
      }

      const honeypot = clamp(
        pickFirst(data.website, data.companyWebsite),
        200
      );

      if (honeypot) {
        return jsonResponse({ ok: true }, 200, requestId);
      }

      if (isRateLimited(ip)) {
        logEvent("warn", "rate_limit", requestId, { ip: ip || "unknown" });
        return jsonResponse({
          ok: false,
          error: "For mange forespørsler. Prøv igjen senere."
        }, 429, requestId);
      }

      const navn = clamp(pickFirst(data.name, data.navn), 80);
      const firma = clamp(pickFirst(data.company, data.firma), 120);
      const epost = clamp(pickFirst(data.email, data.epost), 150).toLowerCase();
      const telefonRaw = clamp(pickFirst(data.phone, data.telefon), 30);
      const telefon = normalizeText(telefonRaw);
      const setup = normalizeSetup(clamp(pickFirst(data.setup, data.oppsett), 40));
      const type = normalizeEventType(clamp(data.type || "", 60));
      const dato = clamp(pickFirst(data.date, data.dato), 80);
      const sted = clamp(pickFirst(data.location, data.sted), 120);
      const gjester = clamp(pickFirst(data.guests, data.gjester), 6);
      const melding = clamp(pickFirst(data.message, data.melding), 1200);

      if (!setup || !navn || !epost || !telefon || !type || !dato || !sted || !gjester) {
        logEvent("warn", "validation_failed", requestId, { reason: "missing_required_fields" });
        return jsonResponse({
          ok: false,
          error: "Oppsett, navn, e-post, telefon, arrangementstype, dato, sted og antall gjester er påkrevd."
        }, 400, requestId);
      }

      if (!isValidName(navn)) {
        logEvent("warn", "validation_failed", requestId, { reason: "invalid_name" });
        return jsonResponse({ ok: false, error: "Ugyldig navn." }, 400, requestId);
      }

      if (!isValidEmail(epost)) {
        logEvent("warn", "validation_failed", requestId, { reason: "invalid_email" });
        return jsonResponse({ ok: false, error: "Ugyldig e-postadresse." }, 400, requestId);
      }

      if (!isValidPhone(telefon)) {
        logEvent("warn", "validation_failed", requestId, { reason: "invalid_phone" });
        return jsonResponse({ ok: false, error: "Ugyldig telefonnummer." }, 400, requestId);
      }

      if (!isValidGuests(gjester)) {
        logEvent("warn", "validation_failed", requestId, { reason: "invalid_guests" });
        return jsonResponse({ ok: false, error: "Antall gjester må være et tall mellom 1 og 999999." }, 400, requestId);
      }

      if (!isValidDateInput(dato)) {
        logEvent("warn", "validation_failed", requestId, { reason: "invalid_date" });
        return jsonResponse({ ok: false, error: "Ugyldig dato." }, 400, requestId);
      }

      if (!isValidLocation(sted)) {
        logEvent("warn", "validation_failed", requestId, { reason: "invalid_location" });
        return jsonResponse({ ok: false, error: "Sted må være mellom 2 og 120 tegn." }, 400, requestId);
      }

      if (!setup) {
        logEvent("warn", "validation_failed", requestId, { reason: "invalid_setup" });
        return jsonResponse({ ok: false, error: "Ugyldig oppsett." }, 400, requestId);
      }

      if (!type) {
        logEvent("warn", "validation_failed", requestId, { reason: "invalid_event_type" });
        return jsonResponse({ ok: false, error: "Ugyldig arrangementstype." }, 400, requestId);
      }

      if (melding && melding.length < 12) {
        logEvent("warn", "validation_failed", requestId, { reason: "message_too_short" });
        return jsonResponse({ ok: false, error: "Meldingen er for kort." }, 400, requestId);
      }

      if (looksLikeSpamMessage(melding)) {
        logEvent("warn", "validation_failed", requestId, { reason: "message_flagged_as_spam" });
        return jsonResponse({
          ok: false,
          error: "Meldingen ser ugyldig ut. Skriv litt mer konkret om arrangementet."
        }, 400, requestId);
      }

      const resendApiKey = process.env.RESEND_API_KEY;
      const bookingToEmail = process.env.BOOKING_TO_EMAIL;
      const bookingFromEmail = process.env.BOOKING_FROM_EMAIL;

      if (!resendApiKey || !bookingToEmail || !bookingFromEmail) {
        logEvent("error", "unexpected_failure", requestId, { reason: "missing_email_configuration" });
        return jsonResponse({
          ok: false,
          error: "Noe gikk galt. Prøv igjen senere."
        }, 500, requestId);
      }

      const safeNavn = escapeHtml(navn);
      const safeFirma = escapeHtml(firma);
      const safeEpost = escapeHtml(epost);
      const safeTelefon = escapeHtml(telefon);
      const safeSetup = escapeHtml(setup);
      const safeType = escapeHtml(type);
      const safeDato = escapeHtml(dato);
      const safeSted = escapeHtml(sted);
      const safeGjester = escapeHtml(gjester);
      const safeMelding = escapeHtml(melding).replace(/\n/g, "<br>");

      const safeReplyTo = normalizeHeaderValue(epost);
      const safeSubjectName = normalizeHeaderValue(navn).slice(0, 60);

      const html = `
        <div style="font-family: Arial, Helvetica, sans-serif; color: #241711; line-height: 1.6;">
          <h2 style="margin: 0 0 16px;">Ny bookingforespørsel</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Oppsett</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${safeSetup}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Navn</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${safeNavn}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Firma / arrangør</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${safeFirma || "-"}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>E-post</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${safeEpost}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Telefon</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${safeTelefon || "-"}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Type arrangement</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${safeType}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Dato</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${safeDato || "-"}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Sted</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${safeSted || "-"}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Antall gjester / forventet besøk</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${safeGjester || "-"}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Melding</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${safeMelding || "-"}</td>
            </tr>
          </table>
        </div>
      `;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      let resendResponse;
      let resendData;

      try {
        resendResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: bookingFromEmail,
            to: [bookingToEmail],
            reply_to: safeReplyTo,
            subject: `Ny bookingforespørsel - ${safeSubjectName}`,
            html
          }),
          signal: controller.signal
        });

        resendData = await resendResponse.json();
      } finally {
        clearTimeout(timeout);
      }

      if (!resendResponse.ok) {
        logEvent("error", "resend_failed", requestId, {
          status: resendResponse.status,
          resendError: typeof resendData?.error === "string" ? resendData.error : "unknown"
        });
        return jsonResponse({
          ok: false,
          error: "Noe gikk galt. Prøv igjen senere."
        }, 500, requestId);
      }

      return jsonResponse({ ok: true }, 200, requestId);
    } catch (error) {
      logEvent("error", "unexpected_failure", requestId, {
        errorName: error?.name || "Error",
        errorMessage: error?.message || "unknown"
      });
      return jsonResponse({
        ok: false,
        error: "Noe gikk galt. Prøv igjen senere."
      }, 500, requestId);
    }
  }
};
