import { google } from "googleapis";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

type ReservationBody = {
  service?: string;
  name?: string;
  email?: string;
  phone?: string;
  date?: string;
  time?: string;
  durationMinutes?: number;
  note?: string;
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
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ReservationBody;

    const {
      service,
      name,
      email,
      phone,
      date,
      time,
      durationMinutes = 60,
      note,
    } = body;

    if (!service || !name || !phone || !date || !time) {
      return NextResponse.json(
        { error: "Chýbajú povinné údaje rezervácie." },
        { status: 400 }
      );
    }

    const start = new Date(`${date}T${time}:00+02:00`);
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

    const calendar = getCalendarClient();

    const freebusy = await calendar.freebusy.query({
      requestBody: {
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
        timeZone: "Europe/Bratislava",
        items: [{ id: process.env.GOOGLE_CALENDAR_ID }],
      },
    });

    const busy =
      freebusy.data.calendars?.[process.env.GOOGLE_CALENDAR_ID as string]?.busy ?? [];

    if (busy.length > 0) {
      return NextResponse.json(
        { error: "Tento termín je už obsadený." },
        { status: 409 }
      );
    }

    const event = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      requestBody: {
        summary: `Rezervácia: ${service}`,
        description: [
          `Meno: ${name}`,
          `Telefón: ${phone}`,
          email ? `Email: ${email}` : null,
          note ? `Poznámka: ${note}` : null,
        ]
          .filter(Boolean)
          .join("\n"),
        start: {
          dateTime: start.toISOString(),
          timeZone: "Europe/Bratislava",
        },
        end: {
          dateTime: end.toISOString(),
          timeZone: "Europe/Bratislava",
        },
      },
    });

    if (email) {
      const formattedDate = new Date(`${date}T${time}:00`).toLocaleDateString("sk-SK");

      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: "Potvrdenie rezervácie – Dientes dentálna hygiena",
        html: `
          <div style="font-family: Arial, sans-serif; max-width:600px; line-height:1.6">
            <h2>Ďakujeme za rezerváciu</h2>
            <p>Dobrý deň ${name},</p>
            <p>Vaša rezervácia bola úspešne vytvorená.</p>

            <p>
              <strong>Služba:</strong> ${service}<br>
              <strong>Dátum:</strong> ${formattedDate}<br>
              <strong>Čas:</strong> ${time}
            </p>

            <p>
              <strong>Dientes dentálna hygiena</strong><br>
              Pribinova 788/8<br>
              040 01 Košice
            </p>

            <p>Tešíme sa na Vašu návštevu.</p>
          </div>
        `,
      });
    }

    return NextResponse.json({
      success: true,
      eventId: event.data.id,
      message: "Rezervácia bola úspešne vytvorená.",
    });
  } catch (error) {
    console.error("Reservation error:", error);

    return NextResponse.json(
      { error: "Rezerváciu sa nepodarilo vytvoriť." },
      { status: 500 }
    );
  }
}