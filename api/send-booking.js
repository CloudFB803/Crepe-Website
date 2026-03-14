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

function isValidEmail(email = "") {
  const normalized = String(email).trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) && normalized.length <= 150;
}

function isValidPhone(phone = "") {
  if (!phone) return true;
  return /^[0-9+()\-\s]{5,30}$/.test(phone);
}

function isValidDateInput(value = "") {
  if (!value) return true;
  return /^[0-9.\-\/\s]{4,40}$/.test(value);
}

function clampAndNormalize(value, maxLength) {
  return normalizeText(value).slice(0, maxLength);
}

function getAllowedTypes() {
  return [
    "Festivaler",
    "Firmaarrangementer",
    "Private arrangementer",
    "Festival",
    "Firmaarrangement",
    "Privat arrangement"
  ];
}

export default {
  async fetch(request) {
    if (request.method !== "POST") {
      return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
    }

    try {
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

      const honeypot = clampAndNormalize(data.website || data.companyWebsite || "", 200);
      if (honeypot) {
        return jsonResponse({ ok: true });
      }

      const navn = clampAndNormalize(data.navn || "", 80);
      const firma = clampAndNormalize(data.firma || "", 120);
      const epost = clampAndNormalize(data.epost || "", 150).toLowerCase();
      const telefon = clampAndNormalize(data.telefon || "", 30);
      const type = clampAndNormalize(data.type || "", 60);
      const dato = clampAndNormalize(data.dato || "", 40);
      const sted = clampAndNormalize(data.sted || "", 120);
      const gjester = clampAndNormalize(data.gjester || "", 40);
      const melding = clampAndNormalize(data.melding || "", 2000);

      if (!navn || !epost || !type) {
        return jsonResponse({
          ok: false,
          error: "Navn, e-post og type arrangement er påkrevd."
        }, 400);
      }

      if (navn.length < 2) {
        return jsonResponse({
          ok: false,
          error: "Navn er for kort."
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
