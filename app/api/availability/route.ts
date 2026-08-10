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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const requestedDaysAhead = Number(searchParams.get("daysAhead") ?? 90);
    const daysAhead = Number.isFinite(requestedDaysAhead)
      ? Math.min(Math.max(requestedDaysAhead, 1), 365)
      : 90;

    const calendarId = process.env.GOOGLE_CALENDAR_ID as string;

    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !calendarId) {
      return NextResponse.json(
        { error: "Chýbajú Google Calendar environment premenné." },
        { status: 500 }
      );
    }

    const calendar = getCalendarClient();

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const future = new Date(start);
    future.setDate(start.getDate() + daysAhead);

    // Vyčistenie expirovaných PENDING rezervácií
    const pendingEvents = await calendar.events.list({
      calendarId,
      timeMin: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      timeMax: future.toISOString(),
      privateExtendedProperty: ["status=pending"],
      singleEvents: true,
      maxResults: 2500,
    });

    const now = Date.now();

    await Promise.all(
      (pendingEvents.data.items ?? []).map(async (event) => {
        const expiresAt = event.extendedProperties?.private?.expiresAt;
        if (!event.id || !expiresAt) return;

        const expiresAtMs = new Date(expiresAt).getTime();

        if (!Number.isNaN(expiresAtMs) && expiresAtMs <= now) {
          await calendar.events
            .delete({
              calendarId,
              eventId: event.id,
            })
            .catch((error) => {
              console.error(
                `Nepodarilo sa odstrániť expirovanú pending rezerváciu ${event.id}:`,
                error
              );
            });
        }
      })
    );

    // Aktuálna obsadenosť vrátane platných PENDING rezervácií
    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: start.toISOString(),
        timeMax: future.toISOString(),
        timeZone: "Europe/Bratislava",
        items: [{ id: calendarId }],
      },
    });

    const busy = response.data.calendars?.[calendarId]?.busy ?? [];

    return NextResponse.json({ busy });
  } catch (error) {
    console.error("Availability error:", error);

    return NextResponse.json(
      { error: "Nepodarilo sa načítať dostupné termíny." },
      { status: 500 }
    );
  }
}
