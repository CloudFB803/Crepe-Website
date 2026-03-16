function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    }
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
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) && normalized.length <= 150;
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
  if (!phone) return true;

  const normalized = normalizePhoneForValidation(phone);

  if (!/^\+\d{6,17}$/.test(normalized)) return false;
  return true;
}

function isValidGuests(value = "") {
  if (!value) return true;
  return /^\d{1,6}$/.test(value);
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
  if (!value) return true;

  const normalized = normalizeText(value);
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

export default {
  async fetch(request) {
    if (request.method !== "POST") {
      return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
    }

    try {
      const contentLength = Number(request.headers.get("content-length") || "0");
      if (contentLength > 20000) {
        return jsonResponse({ ok: false, error: "Forespørselen er for stor." }, 413);
      }

      const contentType = request.headers.get("content-type") || "";
      const origin = request.headers.get("origin") || "";
      const host = request.headers.get("host") || "";

      if (
        !contentType.includes("application/json") &&
        !contentType.includes("multipart/form-data") &&
        !contentType.includes("application/x-www-form-urlencoded")
      ) {
        return jsonResponse({ ok: false, error: "Ugyldig innholdstype." }, 400);
      }

      if (origin) {
        try {
          const originUrl = new URL(origin);
          if (originUrl.host !== host) {
            return jsonResponse({ ok: false, error: "Ugyldig origin." }, 403);
          }
        } catch {
          return jsonResponse({ ok: false, error: "Ugyldig origin." }, 403);
        }
      }

      let data = {};

      if (contentType.includes("application/json")) {
        data = await request.json();
      } else {
        const formData = await request.formData();
        data = Object.fromEntries(formData.entries());
      }

      const honeypot = clamp(
        pickFirst(data.website, data.companyWebsite),
        200
      );

      if (honeypot) {
        return jsonResponse({ ok: true });
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

      if (!navn || !epost || !type || !setup) {
        return jsonResponse({
          ok: false,
          error: "Oppsett, navn, e-post og type arrangement er påkrevd."
        }, 400);
      }

      if (!isValidName(navn)) {
        return jsonResponse({
          ok: false,
          error: "Ugyldig navn."
        }, 400);
      }

      if (!isValidEmail(epost)) {
        return jsonResponse({
          ok: false,
          error: "Ugyldig e-postadresse."
        }, 400);
      }

      if (!isValidPhone(telefon)) {
        return jsonResponse({
          ok: false,
          error: "Ugyldig telefonnummer."
        }, 400);
      }

      if (!isValidGuests(gjester)) {
        return jsonResponse({
          ok: false,
          error: "Antall gjester må være et tall."
        }, 400);
      }

      if (gjester && Number(gjester) < 1) {
        return jsonResponse({
          ok: false,
          error: "Antall gjester må være minst 1."
        }, 400);
      }

      if (!isValidDateInput(dato)) {
        return jsonResponse({
          ok: false,
          error: "Ugyldig dato."
        }, 400);
      }

      if (!setup) {
        return jsonResponse({
          ok: false,
          error: "Ugyldig oppsett."
        }, 400);
      }

      if (!type) {
        return jsonResponse({
          ok: false,
          error: "Ugyldig arrangementstype."
        }, 400);
      }

      if (melding && melding.length < 12) {
        return jsonResponse({
          ok: false,
          error: "Meldingen er for kort."
        }, 400);
      }

      if (looksLikeSpamMessage(melding)) {
        return jsonResponse({
          ok: false,
          error: "Meldingen ser ugyldig ut. Skriv litt mer konkret om arrangementet."
        }, 400);
      }

      const resendApiKey = process.env.RESEND_API_KEY;
      const bookingToEmail = process.env.BOOKING_TO_EMAIL;
      const bookingFromEmail = process.env.BOOKING_FROM_EMAIL;

      if (!resendApiKey || !bookingToEmail || !bookingFromEmail) {
        return jsonResponse({
          ok: false,
          error: "Manglende environment variables på serveren."
        }, 500);
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
        console.error("Resend error:", resendData);
        return jsonResponse({
          ok: false,
          error: "Kunne ikke sende bookingforespørselen."
        }, 500);
      }

      return jsonResponse({ ok: true });
    } catch (error) {
      console.error("Booking API error:", error);
      return jsonResponse({
        ok: false,
        error: "Noe gikk galt på serveren."
      }, 500);
    }
  }
};
