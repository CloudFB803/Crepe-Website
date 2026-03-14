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
  return /^\+\d{6,17}$/.test(phone);
}

function isValidGuests(value = "") {
  if (!value) return true;
  return /^\d{1,6}$/.test(value);
}

function isValidDateInput(value = "") {
  if (!value) return true;

  const singleDatePattern = /^\d{4}-\d{2}-\d{2}$/;
  const rangePattern = /^(\d{4}-\d{2}-\d{2}) - (\d{4}-\d{2}-\d{2})$/;

  if (singleDatePattern.test(value)) return true;

  const rangeMatch = value.match(rangePattern);
  if (!rangeMatch) return false;

  const from = rangeMatch[1];
  const to = rangeMatch[2];

  return to >= from;
}

function getAllowedTypes() {
  return [
    "Festivaler",
    "Firmaarrangementer",
    "Private arrangementer"
  ];
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

      const honeypot = clamp(data.website || data.companyWebsite || "", 200);
      if (honeypot) {
        return jsonResponse({ ok: true });
      }

      const navn = clamp(data.navn || "", 80);
      const firma = clamp(data.firma || "", 120);
      const epost = clamp(data.epost || "", 150).toLowerCase();
      const telefon = clamp(data.telefon || "", 30);
      const type = clamp(data.type || "", 60);
      const dato = clamp(data.dato || "", 60);
      const sted = clamp(data.sted || "", 120);
      const gjester = clamp(data.gjester || "", 6);
      const melding = clamp(data.melding || "", 1200);

      if (!navn || !epost || !type) {
        return jsonResponse({
          ok: false,
          error: "Navn, e-post og type arrangement er påkrevd."
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

      if (!isValidDateInput(dato)) {
        return jsonResponse({
          ok: false,
          error: "Ugyldig dato."
        }, 400);
      }

      const allowedTypes = getAllowedTypes();
      if (!allowedTypes.includes(type)) {
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

      const resendResponse = await fetch("https://api.resend.com/emails", {
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
        })
      });

      const resendData = await resendResponse.json();

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
