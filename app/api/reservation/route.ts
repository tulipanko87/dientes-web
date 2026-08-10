import crypto from "crypto";
import { google } from "googleapis";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

type ReservationBody = {
  service?: string; name?: string; email?: string; phone?: string;
  date?: string; time?: string; durationMinutes?: number; note?: string;
};

function getCalendarClient() {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
  return google.calendar({ version: "v3", auth });
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ReservationBody;
    const { service, name, email, phone, date, time, durationMinutes = 60, note } = body;

    if (!service || !name || !email || !phone || !date || !time) {
      return NextResponse.json({ error: "Chýbajú povinné údaje rezervácie." }, { status: 400 });
    }

    const start = new Date(`${date}T${time}:00+02:00`);
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    if (Number.isNaN(start.getTime())) {
      return NextResponse.json({ error: "Neplatný dátum alebo čas." }, { status: 400 });
    }

    const calendarId = process.env.GOOGLE_CALENDAR_ID as string;
    const calendar = getCalendarClient();
    const freebusy = await calendar.freebusy.query({
      requestBody: {
        timeMin: start.toISOString(), timeMax: end.toISOString(),
        timeZone: "Europe/Bratislava", items: [{ id: calendarId }],
      },
    });
    const busy = freebusy.data.calendars?.[calendarId]?.busy ?? [];
    if (busy.length) {
      return NextResponse.json({ error: "Tento termín je už obsadený." }, { status: 409 });
    }

    const confirmationToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const siteUrl = process.env.SITE_URL || "http://localhost:3000";
    const confirmUrl = `${siteUrl}/api/confirm-reservation?token=${encodeURIComponent(confirmationToken)}`;
    const formattedDate = new Date(`${date}T12:00:00`).toLocaleDateString("sk-SK");

    const pendingEvent = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: `ČAKÁ NA POTVRDENIE – ${service}`,
        description: [
          `Meno: ${name}`, `Telefón: ${phone}`, `Email: ${email}`,
          note ? `Poznámka: ${note}` : null,
          "Stav: Čaká na potvrdenie e-mailu",
          `Platnosť do: ${expiresAt.toISOString()}`,
        ].filter(Boolean).join("\n"),
        start: { dateTime: start.toISOString(), timeZone: "Europe/Bratislava" },
        end: { dateTime: end.toISOString(), timeZone: "Europe/Bratislava" },
        extendedProperties: { private: {
          status: "pending", confirmationToken, expiresAt: expiresAt.toISOString(),
          service, customerName: name, customerEmail: email, customerPhone: phone,
          durationMinutes: String(durationMinutes), note: note || "",
        }},
      },
    });

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM, to: email,
        subject: "Potvrďte rezerváciu – Dientes dentálna hygiena",
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;line-height:1.6;color:#174A4A">
          <h2>Potvrďte svoju rezerváciu</h2><p>Dobrý deň ${name},</p>
          <p>Pre dokončenie rezervácie potvrďte svoju e-mailovú adresu.</p>
          <p><strong>Služba:</strong> ${service}<br><strong>Dátum:</strong> ${formattedDate}<br><strong>Čas:</strong> ${time}</p>
          <p>Termín pre Vás držíme <strong>10 minút</strong>.</p>
          <p><a href="${confirmUrl}" style="display:inline-block;background:#1CC7C9;color:#fff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:bold">POTVRDIŤ REZERVÁCIU</a></p>
          <p style="font-size:13px;color:#6D8F8F">Ak ste túto rezerváciu nevytvorili, e-mail ignorujte.</p>
        </div>`,
      });
    } catch (mailError) {
      if (pendingEvent.data.id) {
        await calendar.events.delete({ calendarId, eventId: pendingEvent.data.id }).catch(() => undefined);
      }
      throw mailError;
    }

    return NextResponse.json({
      success: true, pending: true,
      message: "Na váš e-mail sme poslali odkaz na potvrdenie. Termín pre vás držíme 10 minút.",
    });
  } catch (error) {
    console.error("Reservation error:", error);
    return NextResponse.json({ error: "Rezerváciu sa nepodarilo pripraviť na potvrdenie." }, { status: 500 });
  }
}
