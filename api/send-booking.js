function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}

export default {
  async fetch(request) {
    if (request.method !== "POST") {
      return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
    }

    try {
      const contentType = request.headers.get("content-type") || "";
      let data = {};

      if (contentType.includes("application/json")) {
        data = await request.json();
      } else if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
        const formData = await request.formData();
        data = Object.fromEntries(formData.entries());
      } else {
        return jsonResponse({ ok: false, error: "Ugyldig innholdstype." }, 400);
      }

      const navn = String(data.navn || "").trim();
      const firma = String(data.firma || "").trim();
      const epost = String(data.epost || "").trim();
      const telefon = String(data.telefon || "").trim();
      const type = String(data.type || "").trim();
      const dato = String(data.dato || "").trim();
      const sted = String(data.sted || "").trim();
      const gjester = String(data.gjester || "").trim();
      const melding = String(data.melding || "").trim();

      if (!navn || !epost || !type) {
        return jsonResponse({
          ok: false,
          error: "Navn, e-post og type arrangement er påkrevd."
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

      const html = `
        <div style="font-family: Arial, Helvetica, sans-serif; color: #241711; line-height: 1.6;">
          <h2 style="margin: 0 0 16px;">Ny bookingforespørsel</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Navn</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${safeNavn}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Firma / arrangør</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${safeFirma || "-"}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>E-post</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${safeEpost}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Telefon</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${safeTelefon || "-"}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Type arrangement</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${safeType}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Dato</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${safeDato || "-"}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Sted</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${safeSted || "-"}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Antall gjester / forventet besøk</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${safeGjester || "-"}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Melding</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${safeMelding || "-"}</td></tr>
          </table>
        </div>
      `;

      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: bookingFromEmail,
          to: [bookingToEmail],
          reply_to: epost,
          subject: `Ny bookingforespørsel - ${navn}`,
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
