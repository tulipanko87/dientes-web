import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedDaysAhead = Number(searchParams.get("daysAhead") ?? 90);
    const daysAhead = Number.isFinite(requestedDaysAhead)
      ? Math.min(Math.max(requestedDaysAhead, 1), 365)
      : 90;

    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });

    const calendar = google.calendar({ version: "v3", auth });

    const now = new Date();
    const future = new Date();
    future.setDate(now.getDate() + daysAhead);

    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: now.toISOString(),
        timeMax: future.toISOString(),
        timeZone: "Europe/Bratislava",
        items: [
          {
            id: process.env.GOOGLE_CALENDAR_ID,
          },
        ],
      },
    });

    const calendarId = process.env.GOOGLE_CALENDAR_ID as string;
    const busy = response.data.calendars?.[calendarId]?.busy ?? [];

    return NextResponse.json({ busy });
  } catch (error) {
    console.error("Availability error:", error);
    return NextResponse.json(
      { error: "Nepodarilo sa načítať obsadené termíny." },
      { status: 500 },
    );
  }
}
