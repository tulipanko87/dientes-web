import nodemailer from "nodemailer";
import { google } from "googleapis";
import { NextResponse } from "next/server";

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return new NextResponse("Chýba token rezervácie.", { status: 400 });
    }

    const calendarId = process.env.GOOGLE_CALENDAR_ID as string;
    const calendar = getCalendarClient();

    const events = await calendar.events.list({
      calendarId,
      privateExtendedProperty: [`cancelToken=${token}`],
      maxResults: 1,
      singleEvents: true,
    });

    const event = events.data.items?.[0];

    if (!event?.id) {
      return new NextResponse("Rezervácia nebola nájdená alebo už bola zrušená.", {
        status: 404,
      });
    }

    const description = event.description || "";
    const customerEmail = description.match(/Email:\s*(.+)/)?.[1]?.trim();
    const customerName = description.match(/Meno:\s*(.+)/)?.[1]?.trim() || "Klient";

    await calendar.events.delete({
      calendarId,
      eventId: event.id,
    });

    if (customerEmail) {
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: customerEmail,
        subject: "Rezervácia bola zrušená – Dientes dentálna hygiena",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;line-height:1.6">
            <h2>Rezervácia bola zrušená</h2>
            <p>Dobrý deň ${customerName},</p>
            <p>Vaša rezervácia bola úspešne zrušená.</p>
            <p>Ak išlo o omyl, môžete si vytvoriť novú rezerváciu na stránke Dientes.</p>
            <p>
              <strong>Dientes dentálna hygiena</strong><br>
              Pribinova 788/8<br>
              Košice
            </p>
          </div>
        `,
      });
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.SMTP_USER,
      subject: "Klient zrušil rezerváciu",
      html: `
        <div style="font-family:Arial,sans-serif">
          <h2>Zrušená rezervácia</h2>
          <p><strong>Meno:</strong> ${customerName}</p>
          <p><strong>Email:</strong> ${customerEmail || "neuvedený"}</p>
          <p><strong>Služba:</strong> ${event.summary}</p>
        </div>
      `,
    });

    return new NextResponse(
      `
      <html>
        <body style="font-family:Arial,sans-serif;text-align:center;padding:40px">
          <h1>Rezervácia bola zrušená</h1>
          <p>Termín bol odstránený z kalendára a na stránke sa znova uvoľní.</p>
          <a href="${process.env.SITE_URL}">Späť na stránku Dientes</a>
        </body>
      </html>
      `,
      {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      }
    );
  } catch (error) {
    console.error("Cancel reservation error:", error);

    return new NextResponse("Rezerváciu sa nepodarilo zrušiť.", {
      status: 500,
    });
  }
}