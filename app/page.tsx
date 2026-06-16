"use client";

import { useEffect, useMemo, useState } from "react";
import homeContent from "../content/home.json";


type BusySlot = { start?: string; end?: string };

type WeeklyScheduleDay = {
  day: number;
  enabled: boolean;
  startTime?: string;
  endTime?: string;
};

type ExtraOpenDate =
  | string
  | {
      date?: string;
      startTime?: string;
      endTime?: string;
    };

type BookingSettings = {
  daysAhead: number;
  slotMinutes: number;
  startTime?: string;
  endTime?: string;
  allowedWeekdays?: number[];
  weeklySchedule: WeeklyScheduleDay[];
  extraOpenDates: ExtraOpenDate[];
  closedDates: string[];
};

const DEFAULT_WEEKLY_SCHEDULE: WeeklyScheduleDay[] = [
  { day: 1, enabled: false, startTime: "", endTime: "" },
  { day: 2, enabled: true, startTime: "08:00", endTime: "16:00" },
  { day: 3, enabled: true, startTime: "16:00", endTime: "18:00" },
  { day: 4, enabled: true, startTime: "15:00", endTime: "18:00" },
  { day: 5, enabled: true, startTime: "08:00", endTime: "14:00" },
  { day: 6, enabled: false, startTime: "", endTime: "" },
  { day: 0, enabled: false, startTime: "", endTime: "" },
];

const DEFAULT_BOOKING_SETTINGS: BookingSettings = {
  daysAhead: 90,
  slotMinutes: 45,
  startTime: "08:00",
  endTime: "16:00",
  allowedWeekdays: [2, 4],
  weeklySchedule: DEFAULT_WEEKLY_SCHEDULE,
  extraOpenDates: [],
  closedDates: [],
};

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function parseTimeToMinutes(time: string) {
  const [hours = "0", minutes = "0"] = time.split(":");
  return Number(hours) * 60 + Number(minutes);
}

function minutesToTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function formatDateLong(value: string) {
  if (!value) return "Nevybraný dátum";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("sk-SK", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getExtraOpenDateSettings(value: string, settings: BookingSettings) {
  return settings.extraOpenDates.find((item) => {
    if (typeof item === "string") return item === value;
    return item?.date === value;
  });
}

function getScheduleForDate(value: string, settings: BookingSettings) {
  if (!value) return null;
  if (settings.closedDates.includes(value)) return null;

  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;

  const extraOpenDate = getExtraOpenDateSettings(value, settings);
  if (extraOpenDate) {
    if (typeof extraOpenDate === "string") {
      return {
        startTime: settings.startTime || "08:00",
        endTime: settings.endTime || "16:00",
      };
    }

    return {
      startTime: extraOpenDate.startTime || settings.startTime || "08:00",
      endTime: extraOpenDate.endTime || settings.endTime || "16:00",
    };
  }

  const weekday = date.getDay();
  const schedule = settings.weeklySchedule.find((item) => Number(item.day) === weekday);

  if (schedule) {
    if (!schedule.enabled || !schedule.startTime || !schedule.endTime) return null;
    return {
      startTime: schedule.startTime,
      endTime: schedule.endTime,
    };
  }

  if (settings.allowedWeekdays?.includes(weekday)) {
    return {
      startTime: settings.startTime || "08:00",
      endTime: settings.endTime || "16:00",
    };
  }

  return null;
}

function isDateAllowed(value: string, settings: BookingSettings) {
  return Boolean(getScheduleForDate(value, settings));
}

function findFirstAllowedDate(settings: BookingSettings) {
  const today = new Date();
  for (let i = 0; i <= settings.daysAhead; i += 1) {
    const value = toDateInputValue(addDays(today, i));
    if (isDateAllowed(value, settings)) return value;
  }
  return toDateInputValue(today);
}

function generateBookingTimesForDate(dateValue: string, settings: BookingSettings) {
  const daySchedule = getScheduleForDate(dateValue, settings);
  if (!daySchedule) return [];

  const start = parseTimeToMinutes(daySchedule.startTime);
  const end = parseTimeToMinutes(daySchedule.endTime);
  const times: string[] = [];

  for (let current = start; current + settings.slotMinutes <= end; current += settings.slotMinutes) {
    times.push(minutesToTime(current));
  }

  return times;
}

function getServiceDurationMinutes(service: any, fallback: number) {
  const match = String(service?.duration ?? "").match(/\d+/);
  return match ? Number(match[0]) : fallback;
}

function getServiceId(service: any, index: number) {
  return String(service?.id || service?.name || `sluzba-${index}`);
}

function isSlotBusy(date: string, time: string, durationMinutes: number, busySlots: BusySlot[]) {
  if (!date || !time) return false;

  const start = new Date(`${date}T${time}:00`);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  return busySlots.some((slot) => {
    if (!slot.start || !slot.end) return false;
    const busyStart = new Date(slot.start);
    const busyEnd = new Date(slot.end);
    return start < busyEnd && end > busyStart;
  });
}
const DAY_LABELS: Record<number, string> = {
  0: "Nedeľa",
  1: "Pondelok",
  2: "Utorok",
  3: "Streda",
  4: "Štvrtok",
  5: "Piatok",
  6: "Sobota",
};
export default function DentalHygienaPage() {
  const data = homeContent as any;
  const benefits: any[] = data.benefits ?? [];

  const steps: string[] = data.steps ?? [];

  const prices: any[] = data.priceSection?.items ?? [];

  const businessAddress =
    data.businessAddress ?? "Pribinova 788/8, 040 01 Košice";
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(businessAddress)}&output=embed`;
  const navItems = [
    { label: "Služby", href: "#sluzby" },
    { label: "Priebeh", href: "#priebeh" },
    { label: "Galéria", href: "#galeria" },
    { label: "Rezervácia", href: "#rezervacia" },
    { label: "Cenník", href: "#cennik" },
    { label: "Kontakt", href: "#kontakt" },
  ];
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const heroStats: any[] = data.hero?.stats ?? [];
  const heroImages: any[] = (
    data.hero?.images?.length
      ? data.hero.images
      : [
          {
            image: data.hero?.image ?? data.logoImage ?? "/logo.png",
            alt: data.hero?.imageAlt ?? "Dientes",
          },
        ]
  ).filter((item: any) => item?.image);
  const heroSliderIntervalSeconds = Number(
    data.hero?.sliderIntervalSeconds ?? 5,
  );
  const heroSliderIntervalMs = Math.max(heroSliderIntervalSeconds, 1) * 1000;
  const [activeHeroImage, setActiveHeroImage] = useState(0);
  const currentHeroImage = heroImages[activeHeroImage] ?? heroImages[0];

  useEffect(() => {
    if (heroImages.length <= 1) return;

    const timer = window.setInterval(() => {
      setActiveHeroImage((current) => (current + 1) % heroImages.length);
    }, heroSliderIntervalMs);

    return () => window.clearInterval(timer);
  }, [heroImages.length, heroSliderIntervalMs]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const bookingServices: any[] = data.bookingServices ?? [];

  const bookingSettings: BookingSettings = useMemo(() => {
    const source = data.bookingSettings ?? {};
    const hasWeeklySchedule = Array.isArray(source.weeklySchedule) && source.weeklySchedule.length > 0;

    return {
      ...DEFAULT_BOOKING_SETTINGS,
      ...source,
      weeklySchedule: hasWeeklySchedule ? source.weeklySchedule : DEFAULT_BOOKING_SETTINGS.weeklySchedule,
      allowedWeekdays:
        source.allowedWeekdays?.length
          ? source.allowedWeekdays
          : DEFAULT_BOOKING_SETTINGS.allowedWeekdays,
      extraOpenDates: source.extraOpenDates ?? [],
      closedDates: source.closedDates ?? [],
    };
  }, [data.bookingSettings]);

  const todayValue = toDateInputValue(new Date());
  const maxDateValue = toDateInputValue(addDays(new Date(), bookingSettings.daysAhead));

  const [selectedService, setSelectedService] = useState(() => getServiceId(bookingServices[0], 0));
  const [selectedDate, setSelectedDate] = useState(() => findFirstAllowedDate(bookingSettings));
  const [selectedTime, setSelectedTime] = useState("");
  const [gdprAccepted, setGdprAccepted] = useState(false);
  const [sent, setSent] = useState(false);
  const [busySlots, setBusySlots] = useState<BusySlot[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reservationError, setReservationError] = useState("");
  const [reservationSuccess, setReservationSuccess] = useState("");

  const activeService = useMemo(
    () =>
      bookingServices.find((service: any, index: number) => getServiceId(service, index) === selectedService) ??
      bookingServices[0],
    [bookingServices, selectedService],
  );

  const activeServiceDurationMinutes = getServiceDurationMinutes(
    activeService,
    bookingSettings.slotMinutes,
  );

  const bookingTimes = useMemo(
    () => generateBookingTimesForDate(selectedDate, bookingSettings),
    [bookingSettings, selectedDate],
  );

  const selectedDateAllowed = isDateAllowed(selectedDate, bookingSettings);

  const availableBookingTimes = useMemo(
    () =>
      selectedDateAllowed
        ? bookingTimes.filter(
            (time) => !isSlotBusy(selectedDate, time, activeServiceDurationMinutes, busySlots),
          )
        : [],
    [activeServiceDurationMinutes, bookingTimes, busySlots, selectedDate, selectedDateAllowed],
  );

  useEffect(() => {
    if (!isDateAllowed(selectedDate, bookingSettings)) {
      setSelectedDate(findFirstAllowedDate(bookingSettings));
    }
  }, [bookingSettings, selectedDate]);

  useEffect(() => {
    const loadAvailability = async () => {
      setAvailabilityLoading(true);
      try {
        const response = await fetch(`/api/availability?daysAhead=${bookingSettings.daysAhead}`);
        const result = await response.json();
        setBusySlots(result.busy ?? []);
      } catch (error) {
        console.error("Availability load error:", error);
      } finally {
        setAvailabilityLoading(false);
      }
    };

    loadAvailability();
  }, [bookingSettings.daysAhead, sent]);

  useEffect(() => {
    if (!availableBookingTimes.length) {
      setSelectedTime("");
      return;
    }

    if (!availableBookingTimes.includes(selectedTime)) {
      setSelectedTime(availableBookingTimes[0]);
    }
  }, [availableBookingTimes, selectedTime]);

  const handleBookingSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;

    setReservationError("");
    setReservationSuccess("");

    if (!gdprAccepted) {
      setReservationError("Prosím, potvrďte súhlas so spracovaním osobných údajov.");
      return;
    }

    if (!selectedDateAllowed) {
      setReservationError("Vybraný dátum nie je dostupný na rezerváciu.");
      return;
    }

    if (!selectedTime) {
      setReservationError("Vyberte dostupný čas rezervácie.");
      return;
    }

    if (isSlotBusy(selectedDate, selectedTime, activeServiceDurationMinutes, busySlots)) {
      setReservationError("Tento termín je už obsadený. Vyberte iný čas.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const note = String(formData.get("note") ?? "").trim();

    if (!name || !phone || !email) {
      setReservationError("Vyplňte meno, telefón a e-mail.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: activeService?.name ?? "Dentálna hygiena",
          name,
          email,
          phone,
          date: selectedDate,
          time: selectedTime,
          durationMinutes: activeServiceDurationMinutes,
          note,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Rezerváciu sa nepodarilo vytvoriť.");
      }

      setSent(true);
      setReservationSuccess("Ďakujeme, rezervácia bola úspešne vytvorená a termín je zapísaný v kalendári.");
      setBusySlots((current) => [
        ...current,
        {
          start: new Date(`${selectedDate}T${selectedTime}:00`).toISOString(),
          end: new Date(
            new Date(`${selectedDate}T${selectedTime}:00`).getTime() +
              activeServiceDurationMinutes * 60 * 1000,
          ).toISOString(),
        },
      ]);
      form.reset();
      setGdprAccepted(false);
    } catch (error) {
      setReservationError(error instanceof Error ? error.message : "Rezerváciu sa nepodarilo vytvoriť.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F7F1EA] text-[#5F5148]">
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-[#E4D7CA]/80 bg-[#FBF8F3]/95 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:py-4">
          <a
            href="#top"
            className="flex min-w-0 items-center gap-3"
            onClick={() => setMobileMenuOpen(false)}
          >
            <img
              src={data.logoImage ?? "/logo.png"}
              alt="Dientes logo"
              className="h-10 w-10 rounded-full object-contain sm:h-12 sm:w-12"
            />
            <div className="min-w-0">
              <div className="truncate font-serif text-xl tracking-[0.14em] text-[#B37E74] sm:text-2xl sm:tracking-[0.18em]">
                {data.header?.brandTitle ?? "DIENTES"}
              </div>
              <div className="-mt-1 truncate text-xs italic text-[#B79A73] sm:text-sm">
                {data.header?.brandSubtitle ?? "dentálna hygiena"}
              </div>
            </div>
          </a>

          <nav className="hidden items-center gap-8 lg:flex">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-[#7D6A60] transition hover:text-[#B37E74]"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <a
              href="#rezervacia"
              className="rounded-full bg-[#B37E74] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#9F6F66]"
            >
              Rezervovať termín
            </a>
          </div>

          <button
            type="button"
            aria-label={mobileMenuOpen ? "Zavrieť menu" : "Otvoriť menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#E4D7CA] bg-white/70 text-[#8A7265] shadow-sm transition hover:bg-[#F4ECE4] lg:hidden"
          >
            <span className="sr-only">Menu</span>
            <span className="relative flex h-5 w-5 flex-col justify-center gap-1.5">
              <span
                className={`block h-0.5 w-5 rounded-full bg-current transition ${mobileMenuOpen ? "translate-y-2 rotate-45" : ""}`}
              />
              <span
                className={`block h-0.5 w-5 rounded-full bg-current transition ${mobileMenuOpen ? "opacity-0" : ""}`}
              />
              <span
                className={`block h-0.5 w-5 rounded-full bg-current transition ${mobileMenuOpen ? "-translate-y-2 -rotate-45" : ""}`}
              />
            </span>
          </button>
        </div>

        <div
          className={`fixed inset-0 z-[55] bg-[#3F332C]/35 backdrop-blur-sm transition-opacity lg:hidden ${
            mobileMenuOpen
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0"
          }`}
          onClick={() => setMobileMenuOpen(false)}
        />
        <aside
          className={`fixed right-0 top-0 z-[60] flex h-dvh w-[86%] max-w-sm flex-col border-l border-[#E4D7CA] bg-[#FBF8F3] px-6 py-6 shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
            mobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-serif text-2xl tracking-[0.16em] text-[#B37E74]">
                {data.header?.brandTitle ?? "DIENTES"}
              </div>
              <div className="-mt-1 text-sm italic text-[#B79A73]">
                {data.header?.brandSubtitle ?? "dentálna hygiena"}
              </div>
            </div>
            <button
              type="button"
              aria-label="Zavrieť menu"
              onClick={() => setMobileMenuOpen(false)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E4D7CA] bg-white text-2xl leading-none text-[#8A7265]"
            >
              ×
            </button>
          </div>

          <nav className="mt-10 flex flex-col gap-2">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-2xl border border-[#E7DBCF] bg-white/70 px-5 py-4 text-lg font-semibold text-[#6F5A4D] transition hover:border-[#B37E74]/50 hover:bg-[#F4ECE4]"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <a
            href="#rezervacia"
            onClick={() => setMobileMenuOpen(false)}
            className="mt-8 rounded-full bg-[#B37E74] px-6 py-4 text-center font-semibold text-white shadow-lg shadow-[#B37E74]/20 transition hover:bg-[#9F6F66]"
          >
            Rezervovať termín
          </a>
        </aside>
      </header>

      <main id="top" className="pt-16 sm:pt-20">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(179,126,116,0.16),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(183,154,115,0.18),_transparent_28%)]" />
          <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:py-24">
            <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
              <div>
                <span className="inline-flex items-center rounded-full border border-[#E6D7C8] bg-[#FBF8F3] px-4 py-2 text-sm text-[#B37E74] shadow-sm">
                  {data.hero?.badge ??
                    "Elegantná a šetrná starostlivosť o úsmev"}
                </span>

                <h1 className="mt-6 max-w-3xl font-serif text-4xl leading-[1.08] text-[#A86F67] sm:text-5xl md:text-6xl">
                  {data.hero?.title ?? "Dientes"}
                </h1>
                <p className="mt-2 text-xl italic text-[#B79A73] sm:text-2xl md:text-3xl">
                  {data.hero?.subtitle ?? "dentálna hygiena"}
                </p>

                <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#75665D] sm:text-lg md:text-xl">
                  {data.hero?.description ??
                    "Jemná, moderná a profesionálna dentálna hygiena v elegantnom štýle."}
                </p>

                <div className="mt-9 flex flex-col gap-4 sm:flex-row">
                  <a
                    href="#rezervacia"
                    className="rounded-full bg-[#B37E74] px-7 py-4 text-center font-semibold text-white shadow-lg shadow-[#B37E74]/20 transition hover:-translate-y-0.5 hover:bg-[#9F6F66]"
                  >
                    Rezervovať termín
                  </a>
                  <a
                    href="#sluzby"
                    className="rounded-full border border-[#DCCBBB] bg-[#FBF8F3] px-7 py-4 text-center font-semibold text-[#8A7265] transition hover:bg-[#F4ECE4]"
                  >
                    Pozrieť služby
                  </a>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-4 top-10 hidden h-24 w-24 rounded-full bg-[#E9DED1] blur-2xl lg:block" />
                <div className="absolute -right-6 bottom-10 hidden h-28 w-28 rounded-full bg-[#D9B6A7]/50 blur-3xl lg:block" />

                <div className="relative rounded-[1.5rem] border border-[#E2D4C7] bg-[#FBF8F3] p-4 sm:rounded-[2rem] sm:p-8 shadow-[0_20px_60px_rgba(130,100,85,0.12)]">
                  <div className="relative overflow-hidden rounded-3xl bg-white/60">
                    <img
                      key={currentHeroImage?.image}
                      src={
                        currentHeroImage?.image ?? data.logoImage ?? "/logo.png"
                      }
                      alt={
                        currentHeroImage?.alt ??
                        data.hero?.imageAlt ??
                        "Dientes"
                      }
                      className="h-64 w-full object-contain transition-opacity duration-700 sm:h-72 md:h-80"
                    />

                    {heroImages.length > 1 ? (
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                        {heroImages.map((image: any, index: number) => (
                          <button
                            key={`${image.image}-${index}`}
                            type="button"
                            aria-label={`Zobraziť obrázok ${index + 1}`}
                            onClick={() => setActiveHeroImage(index)}
                            className={`h-2.5 rounded-full transition-all ${index === activeHeroImage ? "w-8 bg-[#B37E74]" : "w-2.5 bg-[#DCCBBB]"}`}
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4">
                    {heroStats.map((stat: any) => (
                      <div
                        key={stat.title}
                        className="rounded-2xl border border-[#E7DBCF] bg-[#F7F1EA] p-4"
                      >
                        <div className="font-serif text-xl text-[#A86F67]">
                          {stat.title}
                        </div>
                        <div className="mt-1 text-sm text-[#8A7669]">
                          {stat.subtitle}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="sluzby"
          className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20"
        >
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#B37E74]">
              {data.servicesSection?.label ?? "Služby a benefity"}
            </p>
            <h2 className="mt-4 font-serif text-3xl text-[#4E4139] sm:text-4xl md:text-5xl">
              {data.servicesSection?.title ?? "Profesionálna hygiena"}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[#786960] sm:mt-5 sm:text-lg">
              {data.servicesSection?.description ??
                "Jemná a profesionálna dentálna hygiena."}
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {benefits.map((item: any) => (
              <div
                key={item.title}
                className="rounded-[1.75rem] border border-[#E5D8CB] bg-[#FBF8F3] p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.imageAlt || item.title}
                    className="mb-5 h-40 w-full rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EEDFD6] text-lg font-bold text-[#B37E74]">
                    ✦
                  </div>
                )}
                <h3 className="mt-5 font-serif text-2xl leading-snug text-[#5B4D45]">
                  {item.title}
                </h3>
                <p className="mt-3 leading-relaxed text-[#7B6D64]">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {data.gallery?.items?.length ? (
          <section
            id="galeria"
            className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 sm:pb-16 lg:pb-20"
          >
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#B37E74]">
                {data.gallery?.label ?? "Galéria"}
              </p>
              <h2 className="mt-4 font-serif text-3xl text-[#4E4139] sm:text-4xl md:text-5xl">
                {data.gallery?.title ?? "Fotky prevádzky"}
              </h2>
              {data.gallery?.description ? (
                <p className="mt-4 text-base leading-relaxed text-[#786960] sm:mt-5 sm:text-lg">
                  {data.gallery.description}
                </p>
              ) : null}
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {data.gallery.items.map((photo: any) => (
                <figure
                  key={photo.image}
                  className="overflow-hidden rounded-[1.75rem] border border-[#E5D8CB] bg-[#FBF8F3] shadow-sm"
                >
                  <img
                    src={photo.image}
                    alt={photo.alt || photo.caption || "Fotka"}
                    className="h-72 w-full object-cover"
                  />
                  {photo.caption ? (
                    <figcaption className="px-5 py-4 text-sm text-[#7B6D64]">
                      {photo.caption}
                    </figcaption>
                  ) : null}
                </figure>
              ))}
            </div>
          </section>
        ) : null}

        <section
          id="priebeh"
          className="border-y border-[#E5D8CB] bg-[#FBF8F3]"
        >
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:items-start lg:gap-10 lg:py-20">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#B37E74]">
                Priebeh ošetrenia
              </p>
              <h2 className="mt-4 font-serif text-3xl text-[#4E4139] sm:text-4xl md:text-5xl">
                Jednoduchý proces, príjemná skúsenosť
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[#786960] sm:mt-5 sm:text-lg">
                Každý krok je navrhnutý tak, aby ošetrenie pôsobilo
                profesionálne, pokojne a bez zbytočného stresu.
              </p>
            </div>

            <div className="space-y-4">
              {steps.map((step: string, index: number) => (
                <div
                  key={step}
                  className="flex gap-4 rounded-[1.5rem] border border-[#E7DBCF] bg-[#F7F1EA] p-5"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#B37E74] font-semibold text-white">
                    {index + 1}
                  </div>
                  <div className="pt-2 text-lg text-[#65574F]">{step}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="rezervacia"
          className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20"
        >
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-10">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#B37E74]">
                Online rezervácia
              </p>
              <h2 className="mt-4 font-serif text-3xl text-[#4E4139] sm:text-4xl md:text-5xl">
                Rezervujte si termín pohodlne online
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[#786960] sm:mt-5 sm:text-lg">
                Namiesto externého Reservanto okna je rezervácia priamo súčasťou
                webu. Klient si vyberie službu, dátum, čas a odošle svoje údaje
                v čistom Dientes dizajne.
              </p>

              <div className="mt-8 rounded-[1.75rem] border border-[#E5D8CB] bg-[#FBF8F3] p-6 shadow-sm">
                <h3 className="font-serif text-2xl text-[#A86F67]">
                  Čo formulár rieši
                </h3>
                <div className="mt-5 space-y-4">
                  {[
                    "výber služby podľa dĺžky a ceny",
                    "výber dostupného dátumu a času",
                    "kontaktné údaje klienta",
                    "poznámka k citlivosti, strojčeku alebo ďasnám",
                    "GDPR súhlas pred odoslaním",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex gap-3 rounded-2xl border border-[#E7DBCF] bg-white/60 p-4"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#B37E74] text-sm text-white">
                        ✓
                      </span>
                      <span className="text-[#6E5F56]">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <form
              onSubmit={handleBookingSubmit}
              className="overflow-hidden rounded-[2rem] border border-[#E2D4C7] bg-[#FBF8F3] shadow-[0_20px_60px_rgba(130,100,85,0.12)]"
            >
              <div className="border-b border-[#E5D8CB] px-6 py-5">
                <div className="font-serif text-2xl text-[#A86F67]">
                  Objednávka na dentálnu hygienu
                </div>
                <div className="text-sm text-[#8B796D]">
                  Dientes dentálna hygiena
                </div>
              </div>

              <div className="space-y-7 p-4 sm:space-y-8 sm:p-6">
                <div>
                  <div className="mb-4 flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#B37E74] font-semibold text-white">
                      1
                    </span>
                    <div>
                      <h3 className="font-serif text-2xl text-[#4E4139]">
                        Vyberte službu
                      </h3>
                      <p className="text-sm text-[#8E7C70]">
                        Zvoľte typ návštevy podľa potreby.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {bookingServices.map((service: any, index: number) => {
                      const serviceId = getServiceId(service, index);
                      const isSelected = selectedService === serviceId;

                      return (
                        <button
                          key={serviceId}
                          type="button"
                          onClick={() => setSelectedService(serviceId)}
                          className={`rounded-[1.35rem] border p-4 text-left transition ${
                            isSelected
                              ? "border-[#B37E74] bg-[#F1E2DA] shadow-sm"
                              : "border-[#E7DBCF] bg-white/70 hover:border-[#B37E74]/60 hover:bg-[#F7F1EA]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="font-semibold text-[#564943]">
                              {service.name}
                            </h4>
                            {isSelected ? (
                              <span className="text-[#B37E74]">●</span>
                            ) : null}
                          </div>
                          <p className="mt-3 text-sm leading-relaxed text-[#7B6D64]">
                            {service.description}
                          </p>
                          <div className="mt-4 flex items-center justify-between text-sm">
                            <span className="text-[#8E7C70]">
                              {service.duration}
                            </span>
                            <strong className="text-[#A86F67]">
                              {service.price}
                            </strong>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="mb-4 flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#B37E74] font-semibold text-white">
                      2
                    </span>
                    <div>
                      <h3 className="font-serif text-2xl text-[#4E4139]">
                        Vyberte termín
                      </h3>
                      <p className="text-sm text-[#8E7C70]">
                        Vyberte si dostupný termín podľa aktuálnej obsadenosti kalendára.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-[#6E5F56]">
                        Vyberte dátum
                      </span>
                      <input
                        type="date"
                        min={todayValue}
                        max={maxDateValue}
                        value={selectedDate}
                        onChange={(event) => {
                          setSelectedDate(event.target.value);
                          setReservationError("");
                          setReservationSuccess("");
                          setSent(false);
                        }}
                        className="w-full rounded-2xl border border-[#E0D2C5] bg-white px-4 py-3 text-[#4E4139] outline-none transition focus:border-[#B37E74] focus:ring-4 focus:ring-[#B37E74]/10"
                      />
                    </label>
                    <div className="rounded-2xl border border-[#E7DBCF] bg-white/70 px-4 py-3 text-sm text-[#6E5F56]">
                      <strong className="block text-[#4E4139]">{formatDateLong(selectedDate)}</strong>
                      <span>{selectedDate ? DAY_LABELS[new Date(`${selectedDate}T12:00:00`).getDay()] : ""}</span>
                    </div>
                  </div>

                  {!selectedDateAllowed ? (
                    <div className="mt-4 rounded-2xl border border-[#E8C9B7] bg-[#FFF4EE] p-4 text-sm text-[#8A4D38]">
                      Tento dátum momentálne nie je otvorený na rezervácie. Upravte týždenný rozvrh alebo ho pridajte v administrácii do výnimočne otvorených dátumov.
                    </div>
                  ) : null}

                  {availabilityLoading ? (
                    <div className="mt-4 rounded-2xl border border-[#E7DBCF] bg-white/70 p-4 text-sm text-[#6E5F56]">
                      Načítavam dostupné termíny z Google Kalendára...
                    </div>
                  ) : null}

                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
                    {bookingTimes.map((time) => {
                      const isSelected = selectedTime === time;
                      const isBusy = isSlotBusy(selectedDate, time, activeServiceDurationMinutes, busySlots);
                      const isDisabled = !selectedDateAllowed || isBusy;

                      return (
                        <button
                          key={time}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => setSelectedTime(time)}
                          className={`rounded-2xl border py-3 font-semibold transition ${
                            isSelected && !isDisabled
                              ? "border-[#B37E74] bg-[#B37E74] text-white"
                              : isDisabled
                                ? "cursor-not-allowed border-[#E7DBCF] bg-[#EFE8E0] text-[#A9968A] line-through"
                                : "border-[#E7DBCF] bg-white/70 text-[#6B5B52] hover:bg-[#F1E2DA]"
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>

                  {selectedDateAllowed && !availableBookingTimes.length && !availabilityLoading ? (
                    <div className="mt-4 rounded-2xl border border-[#E8C9B7] bg-[#FFF4EE] p-4 text-sm text-[#8A4D38]">
                      Na tento deň už nie sú dostupné voľné časy.
                    </div>
                  ) : null}
                </div>

                <div>
                  <div className="mb-4 flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#B37E74] font-semibold text-white">
                      3
                    </span>
                    <div>
                      <h3 className="font-serif text-2xl text-[#4E4139]">
                        Vaše údaje
                      </h3>
                      <p className="text-sm text-[#8E7C70]">
                        Po odoslaní sa zobrazí potvrdenie rezervácie.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-[#6E5F56]">
                        Meno a priezvisko
                      </span>
                      <input
                        required
                        name="name"
                        className="w-full rounded-2xl border border-[#E0D2C5] bg-white px-4 py-3 text-[#4E4139] outline-none transition focus:border-[#B37E74] focus:ring-4 focus:ring-[#B37E74]/10"
                        placeholder="Jana Nováková"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-[#6E5F56]">
                        Telefón
                      </span>
                      <input
                        required
                        name="phone"
                        className="w-full rounded-2xl border border-[#E0D2C5] bg-white px-4 py-3 text-[#4E4139] outline-none transition focus:border-[#B37E74] focus:ring-4 focus:ring-[#B37E74]/10"
                        placeholder="+421 900 123 456"
                      />
                    </label>
                    <label className="block md:col-span-2">
                      <span className="mb-2 block text-sm font-semibold text-[#6E5F56]">
                        E-mail
                      </span>
                      <input
                        required
                        name="email"
                        type="email"
                        className="w-full rounded-2xl border border-[#E0D2C5] bg-white px-4 py-3 text-[#4E4139] outline-none transition focus:border-[#B37E74] focus:ring-4 focus:ring-[#B37E74]/10"
                        placeholder="jana@email.sk"
                      />
                    </label>
                    <label className="block md:col-span-2">
                      <span className="mb-2 block text-sm font-semibold text-[#6E5F56]">
                        Poznámka
                      </span>
                      <textarea
                        name="note"
                        className="min-h-24 w-full rounded-2xl border border-[#E0D2C5] bg-white px-4 py-3 text-[#4E4139] outline-none transition focus:border-[#B37E74] focus:ring-4 focus:ring-[#B37E74]/10"
                        placeholder="Napr. citlivé ďasná, strojček, tehotenstvo..."
                      />
                    </label>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-[#E5D8CB] bg-[#F7F1EA] p-5">
                  <h4 className="font-serif text-2xl text-[#A86F67]">
                    Súhrn rezervácie
                  </h4>
                  <div className="mt-4 space-y-3 text-sm text-[#6E5F56]">
                    <div className="flex justify-between gap-4">
                      <span>Služba</span>
                      <strong className="text-right text-[#4E4139]">
                        {activeService.name}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Trvanie</span>
                      <strong className="text-[#4E4139]">
                        {activeService.duration}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Termín</span>
                      <strong className="text-[#4E4139]">
                        {formatDateLong(selectedDate)} o {selectedTime || "—"}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Cena</span>
                      <strong className="text-[#4E4139]">
                        {activeService.price}
                      </strong>
                    </div>
                  </div>
                </div>

                <label className="flex gap-3 rounded-2xl border border-[#E5D8CB] bg-white/70 p-4 text-sm leading-relaxed text-[#6E5F56]">
                  <input
                    type="checkbox"
                    checked={gdprAccepted}
                    onChange={(event) => setGdprAccepted(event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-[#D8C8BB]"
                  />
                  <span>
                    Súhlasím so spracovaním osobných údajov za účelom vybavenia
                    rezervácie a beriem na vedomie storno podmienky.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={submitting || !selectedDateAllowed || !selectedTime}
                  className="w-full rounded-full bg-[#B37E74] px-7 py-4 text-center font-semibold text-white shadow-lg shadow-[#B37E74]/20 transition hover:-translate-y-0.5 hover:bg-[#9F6F66] disabled:cursor-not-allowed disabled:bg-[#C8B7AE] disabled:shadow-none"
                >
                  {submitting ? "Odosielam rezerváciu..." : "Potvrdiť rezerváciu"}
                </button>

                {reservationError ? (
                  <div className="rounded-2xl border border-[#E8C9B7] bg-[#FFF4EE] p-4 text-sm font-medium text-[#8A4D38]">
                    {reservationError}
                  </div>
                ) : null}

                {sent || reservationSuccess ? (
                  <div className="rounded-2xl border border-[#C9D9BE] bg-[#F0F6EA] p-4 text-sm font-medium text-[#526C45]">
                    {reservationSuccess || "Ďakujeme, vaša rezervácia bola úspešne vytvorená."}
                  </div>
                ) : null}
              </div>
            </form>
          </div>
        </section>

        <section id="cennik" className="border-y border-[#E5D8CB] bg-[#FBF8F3]">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:items-start lg:gap-10 lg:py-20">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#B37E74]">
                {data.priceSection?.label ?? "Cenník"}
              </p>
              <h2 className="mt-4 font-serif text-3xl text-[#4E4139] sm:text-4xl md:text-5xl">
                {data.priceSection?.title ?? "Transparentné ceny"}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[#786960] sm:mt-5 sm:text-lg">
                {data.priceSection?.description ?? ""}
              </p>
            </div>

            <div className="overflow-hidden rounded-[1.75rem] border border-[#E5D8CB] bg-white shadow-sm">
              {prices.map((item: any, index: number) => {
                const borderClass =
                  index !== prices.length - 1
                    ? "border-b border-[#E5D8CB]"
                    : "";

                return (
                  <div
                    key={item.name}
                    className={`flex flex-col gap-2 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 ${borderClass}`}
                  >
                    <span className="text-lg text-[#65574F]">{item.name}</span>
                    <span className="font-serif text-2xl text-[#A86F67]">
                      {item.price}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section
          id="kontakt"
          className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20"
        >
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-10">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#B37E74]">
                {data.contactSection?.label ?? "Kontakt a mapa"}
              </p>
              <h2 className="mt-4 font-serif text-3xl text-[#4E4139] sm:text-4xl md:text-5xl">
                {data.contactSection?.title ?? "Kde nás nájdete"}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[#786960] sm:mt-5 sm:text-lg">
                {data.contactSection?.description ??
                  "Prevádzku nájdete jednoducho podľa mapy."}
              </p>

              <div className="mt-8 space-y-4">
                <div className="rounded-[1.5rem] border border-[#E5D8CB] bg-[#FBF8F3] p-5">
                  <div className="text-sm font-semibold uppercase tracking-[0.16em] text-[#B37E74]">
                    Adresa prevádzky
                  </div>
                  <div className="mt-2 font-serif text-2xl text-[#4E4139]">
                    {data.businessName ?? "Dientes dentálna hygiena"}
                  </div>
                  <p className="mt-2 text-[#7B6D64]">{businessAddress}</p>
                </div>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(businessAddress)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-full bg-[#B37E74] px-6 py-3 font-semibold text-white shadow-lg shadow-[#B37E74]/20 transition hover:-translate-y-0.5 hover:bg-[#9F6F66]"
                >
                  Otvoriť trasu v Google Maps
                </a>
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-[#E2D4C7] bg-[#FBF8F3] shadow-[0_20px_60px_rgba(130,100,85,0.12)]">
              <div className="border-b border-[#E5D8CB] px-6 py-5">
                <h3 className="font-serif text-3xl text-[#A86F67]">
                  {data.contactSection?.mapTitle ?? "Mapa prevádzky"}
                </h3>
                <p className="mt-1 text-[#88766A]">
                  {data.contactSection?.mapDescription ??
                    "Kliknutím na mapu si viete pozrieť polohu alebo naplánovať trasu."}
                </p>
              </div>

              <iframe
                title="Mapa prevádzky Dientes"
                src={mapSrc}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-[320px] w-full border-0 sm:h-[420px]"
                allowFullScreen
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#E5D8CB] bg-[#6F5A4D] text-[#F5EDE4]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-center sm:px-6 md:flex-row md:text-left">
          <div>
            <div className="font-serif text-2xl tracking-[0.14em]">
              {data.header?.brandTitle ?? "DIENTES"}
            </div>
            <div className="text-sm italic text-[#E0CCB7]">
              {data.header?.brandSubtitle ?? "dentálna hygiena"}
            </div>
          </div>
          <div className="text-sm text-[#EBDDCE]">
            © 2026 Dientes • Elegantná dentálna hygiena
          </div>
        </div>
      </footer>
    </div>
  );
}
