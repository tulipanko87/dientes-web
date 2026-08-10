import crypto from "crypto";
import { google } from "googleapis";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

function getCalendarClient() {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
  return google.calendar({ version: "v3", auth });
}
const transporter = nodemailer.createTransport({
  service: "gmail", auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});
function page(title: string, message: string, siteUrl: string) {
  return `<!doctype html><html lang="sk"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <body style="background:#F8FEFE;font-family:Arial,sans-serif;color:#174A4A"><div style="max-width:640px;margin:60px auto;padding:24px">
  <div style="background:#fff;border:1px solid #DDF3F3;border-radius:28px;padding:32px;text-align:center"><h1>${title}</h1>
  <p style="line-height:1.7;color:#4F7E7E">${message}</p><a href="${siteUrl}" style="display:inline-block;margin-top:18px;background:#1CC7C9;color:#fff;text-decoration:none;padding:13px 20px;border-radius:999px;font-weight:bold">Späť na stránku Dientes</a>
  </div></div></body></html>`;
}

export async function GET(request: Request) {
  const siteUrl = process.env.SITE_URL || "http://localhost:3000";
  try {
    const token = new URL(request.url).searchParams.get("token");
    if (!token) return new NextResponse(page("Neplatný odkaz", "Chýba potvrdzovací token.", siteUrl), { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } });

    const calendarId = process.env.GOOGLE_CALENDAR_ID as string;
    const calendar = getCalendarClient();
    const events = await calendar.events.list({
      calendarId, privateExtendedProperty: [`confirmationToken=${token}`], maxResults: 1, singleEvents: true,
    });
    const event = events.data.items?.[0];
    if (!event?.id) return new NextResponse(page("Odkaz už nie je platný", "Rezervácia nebola nájdená alebo už bola spracovaná.", siteUrl), { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } });

    const props = event.extendedProperties?.private ?? {};
    const expiresAt = props.expiresAt ? new Date(props.expiresAt) : null;
    if (props.status !== "pending" || !expiresAt || expiresAt.getTime() < Date.now()) {
      if (props.status === "pending") await calendar.events.delete({ calendarId, eventId: event.id }).catch(() => undefined);
      return new NextResponse(page("Platnosť rezervácie vypršala", "Termín bol uvoľnený. Vyberte si, prosím, nový termín.", siteUrl), { status: 410, headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    const service = props.service || "Dentálna hygiena";
    const name = props.customerName || "Klient";
    const email = props.customerEmail || "";
    const phone = props.customerPhone || "";
    const note = props.note || "";
    const cancelToken = crypto.randomUUID();
    const cancelUrl = `${siteUrl}/api/cancel-reservation?token=${cancelToken}`;
    const start = event.start?.dateTime ? new Date(event.start.dateTime) : null;
    const formattedDate = start?.toLocaleDateString("sk-SK", { timeZone: "Europe/Bratislava" }) || "";
    const formattedTime = start?.toLocaleTimeString("sk-SK", { timeZone: "Europe/Bratislava", hour: "2-digit", minute: "2-digit" }) || "";

    await calendar.events.patch({
      calendarId, eventId: event.id,
      requestBody: {
        summary: `Rezervácia: ${service}`,
        description: [`Meno: ${name}`, `Telefón: ${phone}`, `Email: ${email}`, note ? `Poznámka: ${note}` : null, `Storno odkaz: ${cancelUrl}`].filter(Boolean).join("\n"),
        extendedProperties: { private: { status: "confirmed", cancelToken } },
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM, to: email,
      subject: "Rezervácia potvrdená – Dientes dentálna hygiena",
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;line-height:1.6;color:#174A4A"><h2>Rezervácia je potvrdená</h2>
      <p>Dobrý deň ${name},</p><p>Vaša e-mailová adresa bola overená a rezervácia je potvrdená.</p>
      <p><strong>Služba:</strong> ${service}<br><strong>Dátum:</strong> ${formattedDate}<br><strong>Čas:</strong> ${formattedTime}</p>
      <p><strong>Dientes dentálna hygiena</strong><br>Pribinova 788/8<br>040 01 Košice</p>
      <p><a href="${cancelUrl}" style="display:inline-block;background:#1CC7C9;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:bold">Zrušiť rezerváciu</a></p></div>`,
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM, to: process.env.SMTP_USER,
      subject: `Nová potvrdená rezervácia – ${service}`,
      html: `<div style="font-family:Arial,sans-serif"><h2>Nová potvrdená rezervácia</h2>
      <p><strong>Služba:</strong> ${service}</p><p><strong>Dátum:</strong> ${formattedDate}</p><p><strong>Čas:</strong> ${formattedTime}</p>
      <p><strong>Meno:</strong> ${name}</p><p><strong>Telefón:</strong> ${phone}</p><p><strong>Email:</strong> ${email}</p>
      <p><strong>Poznámka:</strong> ${note || "Bez poznámky"}</p></div>`,
    });

    return new NextResponse(page("Rezervácia bola potvrdená", `Ďakujeme, ${name}. Váš termín ${formattedDate} o ${formattedTime} je úspešne rezervovaný.`, siteUrl), { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
  } catch (error) {
    console.error("Confirm reservation error:", error);
    return new NextResponse(page("Rezerváciu sa nepodarilo potvrdiť", "Skúste odkaz otvoriť znova.", siteUrl), { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
}
