import { readJson, reservationInput, sameOrigin, rateLimit, siteUrl as getSiteUrl } from "../../../lib/security";
import { bookingCheck } from "../../../lib/booking-rules";
import { patientMail } from "../../../lib/email-template";
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
  service: "gmail",
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) return NextResponse.json({error: 'Nepovolený pôvod požiadavky.'}, {status: 403});
    if (!rateLimit(request, 'reservation', 5)) return NextResponse.json({error: 'Príliš veľa požiadaviek.'}, {status: 429, headers: {'Retry-After': '600'}});
    let raw: Record<string, unknown>;
    try { raw = await readJson(request); } catch { return NextResponse.json({error: 'Neplatná požiadavka.'}, {status: 400}); }
    const body = reservationInput(raw);
    if (!body) return NextResponse.json({error: 'Skontrolujte povinné údaje a súhlas s podmienkami.'}, {status: 400});
    const {service, name, email, phone, date, time, note} = body;
    if (!rateLimit(request, 'reservation-email', 3, 600_000, email.toLowerCase())) return NextResponse.json({error: 'Príliš veľa požiadaviek.'}, {status: 429});

    const check = bookingCheck(service,date,time);
    if (check.error || !check.startAt || !check.duration) {
      return NextResponse.json({error:check.error||'Neplatný termín.'},{status:400});
    }
    const start = check.startAt;
    const end = new Date(start.getTime() + check.duration * 60 * 1000);
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
    const availability = freebusy.data.calendars?.[calendarId];
    if (!availability || availability.errors?.length || !availability.busy) throw new Error("Calendar unavailable");
    const busy = availability.busy;
    if (busy.length) {
      return NextResponse.json({ error: "Tento termín je už obsadený." }, { status: 409 });
    }

    const confirmationToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const siteUrl = getSiteUrl();
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
          durationMinutes: String(check.duration), note: note || "",
        }},
      },
    });

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM, to: email,
        ...patientMail('request',{name,service,date:formattedDate,time,url:confirmUrl}),
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
  } catch {
    console.error("Reservation failed");
    return NextResponse.json({ error: "Rezerváciu sa nepodarilo pripraviť na potvrdenie." }, { status: 500 });
  }
}
