import { escapeHtml as esc, siteUrl as getSiteUrl, validToken, rateLimit, sameOrigin, privateHeaders, actionPage, actionToken } from "../../../lib/security";
import { patientMail } from "../../../lib/email-template";
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
  const token = new URL(request.url).searchParams.get('token');
  if (!validToken(token)) return new NextResponse('Neplatný odkaz.', {status: 400, headers: privateHeaders});
  if (!rateLimit(request, 'action-page', 60)) return new NextResponse('Príliš veľa požiadaviek.', {status: 429, headers: privateHeaders});
  return new NextResponse(actionPage('cancel-reservation', token, 'Zrušiť rezerváciu'), {headers: {...privateHeaders, 'Content-Type': 'text/html; charset=utf-8'}});
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return new NextResponse('Nepovolená požiadavka.', {status: 403, headers: privateHeaders});
  if (!rateLimit(request, 'action', 20)) return new NextResponse('Príliš veľa požiadaviek.', {status: 429, headers: privateHeaders});
  try {
    const token = await actionToken(request);

    if (!validToken(token)) {
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

    const props = event.extendedProperties?.private || {};
    if (props.status !== 'confirmed') return new NextResponse('Rezerváciu nemožno zrušiť.', {status: 409, headers: privateHeaders});
    const description = event.description || "";
    const customerEmail = props.customerEmail || description.match(/Email:\s*(.+)/)?.[1]?.trim();
    const customerName = props.customerName || description.match(/Meno:\s*(.+)/)?.[1]?.trim() || "Klient";

    if (!event.etag) throw new Error("Missing event version");
    await calendar.events.delete({
      calendarId,
      eventId: event.id,
    }, {headers: {"If-Match": event.etag}});

    if (customerEmail) {
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: customerEmail,
        ...patientMail('cancelled',{name:customerName}),
      });
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.SMTP_USER,
      subject: "Klient zrušil rezerváciu",
      html: `
        <div style="font-family:Arial,sans-serif">
          <h2>Zrušená rezervácia</h2>
          <p><strong>Meno:</strong> ${esc(customerName)}</p>
          <p><strong>Email:</strong> ${esc(customerEmail || "neuvedený")}</p>
          <p><strong>Služba:</strong> ${esc(event.summary)}</p>
        </div>
      `,
    });

    return new NextResponse(
      `
      <html>
        <body style="font-family:Arial,sans-serif;text-align:center;padding:40px">
          <h1>Rezervácia bola zrušená</h1>
          <p>Termín bol odstránený z kalendára a na stránke sa znova uvoľní.</p>
          <a href="${esc(getSiteUrl())}">Späť na stránku Dientes</a>
        </body>
      </html>
      `,
      {
        status: 200,
        headers: {
          ...privateHeaders, "Content-Type": "text/html; charset=utf-8",
        },
      }
    );
  } catch {
    console.error("Reservation action failed");

    return new NextResponse("Rezerváciu sa nepodarilo zrušiť.", {
      status: 500,
    });
  }
}