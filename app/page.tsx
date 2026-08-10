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

type ClosedDateRange = {
  startDate?: string;
  endDate?: string;
  note?: string;
};

type BookingSettings = {
  daysAhead: number;
  slotMinutes: number;
  startTime?: string;
  endTime?: string;
  allowedWeekdays?: number[];
  weeklySchedule: WeeklyScheduleDay[];
  extraOpenDates: ExtraOpenDate[];
  closedDateRanges: ClosedDateRange[];
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
  closedDateRanges: [],
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

function normalizeCmsDate(value?: string) {
  if (!value) return "";
  return value.slice(0, 10);
}

function isDateInClosedRange(value: string, settings: BookingSettings) {
  return settings.closedDateRanges.some((range) => {
    const start = normalizeCmsDate(range?.startDate);
    const end = normalizeCmsDate(range?.endDate) || start;
    return Boolean(start && value >= start && value <= end);
  });
}

function getExtraOpenDateSettings(value: string, settings: BookingSettings) {
  return settings.extraOpenDates.find((item) => {
    if (typeof item === "string") return normalizeCmsDate(item) === value;
    return normalizeCmsDate(item?.date) === value;
  });
}

function getScheduleForDate(value: string, settings: BookingSettings) {
  if (!value) return null;
  if (isDateInClosedRange(value, settings)) return null;

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

function getDateAvailabilityReason(value: string, settings: BookingSettings) {
  if (!value) return "";

  if (isDateInClosedRange(value, settings)) {
    return "V tento deň je ambulancia zatvorená / máme dovolenku. Vyberte, prosím, iný termín.";
  }

  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "";

  const extraOpenDate = getExtraOpenDateSettings(value, settings);
  if (extraOpenDate) return "";

  const weekday = date.getDay();
  const schedule = settings.weeklySchedule.find(
    (item) => Number(item.day) === weekday,
  );

  if (schedule) {
    if (!schedule.enabled || !schedule.startTime || !schedule.endTime) {
      return "V tento deň neprijímame rezervácie. Vyberte, prosím, iný termín.";
    }
    return "";
  }

  if (!settings.allowedWeekdays?.includes(weekday)) {
    return "V tento deň neprijímame rezervácie. Vyberte, prosím, iný termín.";
  }

  return "";
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
  const businessPhone = data.businessPhone ?? "";
  const businessEmail = data.businessEmail ?? "";
  const showGallery = data.displaySettings?.showGallery !== false;
  const showPriceSection = data.displaySettings?.showPriceSection !== false;
  const insuranceSection = data.insuranceSection ?? {};
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(businessAddress)}&output=embed`;
  const navItems = [
    { label: "Služby", href: "#sluzby" },
    { label: "Priebeh", href: "#priebeh" },
    ...(showGallery ? [{ label: "Galéria", href: "#galeria" }] : []),
    { label: "Rezervácia", href: "#rezervacia" },
    ...(showPriceSection ? [{ label: "Cenník", href: "#cennik" }] : []),
    { label: "Kontakt", href: "#kontakt" },
  ];
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

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
    setIsMounted(true);
  }, []);

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
      closedDateRanges: source.closedDateRanges ?? [],
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
  const selectedDateReason = getDateAvailabilityReason(
    selectedDate,
    bookingSettings,
  );
  const nearestAllowedDate = useMemo(
    () => findFirstAllowedDate(bookingSettings),
    [bookingSettings],
  );

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

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const note = String(formData.get("note") ?? "").trim();

    const nextFieldErrors: Record<string, string> = {};

    if (!name) nextFieldErrors.name = "Vyplňte meno a priezvisko.";
    if (!phone) {
      nextFieldErrors.phone = "Vyplňte telefónne číslo.";
    } else if (!/^\+?[0-9]{9,15}$/.test(phone)) {
      nextFieldErrors.phone = "Zadajte platné telefónne číslo bez medzier, iba číslice a prípadne +.";
    }
    if (!email) {
      nextFieldErrors.email = "Vyplňte e-mailovú adresu.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextFieldErrors.email = "Zadajte platnú e-mailovú adresu.";
    }
    if (!gdprAccepted) {
      nextFieldErrors.gdpr = "Potvrďte súhlas so spracovaním osobných údajov.";
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setReservationError("Skontrolujte zvýraznené polia.");

      window.setTimeout(() => {
        const firstField = Object.keys(nextFieldErrors)[0];
        const target = document.querySelector(
          firstField === "gdpr" ? '[name="gdpr"]' : `[name="${firstField}"]`,
        ) as HTMLElement | null;

        target?.scrollIntoView({ behavior: "smooth", block: "center" });
        target?.focus?.();
      }, 0);

      return;
    }

    setFieldErrors({});

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
      setFieldErrors({});
      setReservationSuccess(
        result.message ||
          "Na váš e-mail sme poslali odkaz na potvrdenie rezervácie. Termín pre vás držíme 10 minút."
      );
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
    <div className="min-h-screen overflow-x-hidden bg-[#F8FEFE] text-[#174A4A]">
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-[#DDF3F3]/80 bg-[#FFFFFF]/95 shadow-sm backdrop-blur-xl">
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
              <div className="truncate font-serif text-xl tracking-[0.14em] text-[#1CC7C9] sm:text-2xl sm:tracking-[0.18em]">
                {data.header?.brandTitle ?? "DIENTES"}
              </div>
              <div className="-mt-1 truncate text-xs italic text-[#17B4B6] sm:text-sm">
                {data.header?.brandSubtitle ?? "dentálna hygiena"}
              </div>
            </div>
          </a>

          <nav className="hidden items-center gap-8 lg:flex">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-[#6D8F8F] transition hover:text-[#1CC7C9]"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <a
              href="#rezervacia"
              className="rounded-full bg-[#1CC7C9] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#17B4B6]"
            >
              Rezervovať termín
            </a>
          </div>

          <button
            type="button"
            aria-label={mobileMenuOpen ? "Zavrieť menu" : "Otvoriť menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#DDF3F3] bg-white/70 text-[#6D8F8F] shadow-sm transition hover:bg-[#E8FAFA] lg:hidden"
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
          className={`fixed right-0 top-0 z-[60] flex h-dvh w-[86%] max-w-sm flex-col border-l border-[#DDF3F3] bg-[#FFFFFF] px-6 py-6 shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
            mobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-serif text-2xl tracking-[0.16em] text-[#1CC7C9]">
                {data.header?.brandTitle ?? "DIENTES"}
              </div>
              <div className="-mt-1 text-sm italic text-[#17B4B6]">
                {data.header?.brandSubtitle ?? "dentálna hygiena"}
              </div>
            </div>
            <button
              type="button"
              aria-label="Zavrieť menu"
              onClick={() => setMobileMenuOpen(false)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[#DDF3F3] bg-white text-2xl leading-none text-[#6D8F8F]"
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
                className="rounded-2xl border border-[#DDF3F3] bg-white/70 px-5 py-4 text-lg font-semibold text-[#3D6666] transition hover:border-[#1CC7C9]/50 hover:bg-[#E8FAFA]"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <a
            href="#rezervacia"
            onClick={() => setMobileMenuOpen(false)}
            className="mt-8 rounded-full bg-[#1CC7C9] px-6 py-4 text-center font-semibold text-white shadow-lg shadow-[#1CC7C9]/20 transition hover:bg-[#17B4B6]"
          >
            Rezervovať termín
          </a>
        </aside>
      </header>

      <main id="top" className="pt-16 sm:pt-20">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(28,199,201,0.12),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(126,221,215,0.18),_transparent_28%)]" />
          <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:py-24">
            <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
              <div>
                <span className="inline-flex items-center rounded-full border border-[#DDF3F3] bg-[#FFFFFF] px-4 py-2 text-sm text-[#1CC7C9] shadow-sm">
                  {data.hero?.badge ??
                    "Elegantná a šetrná starostlivosť o úsmev"}
                </span>

                <h1 className="mt-6 max-w-3xl font-serif text-4xl leading-[1.08] text-[#17B4B6] sm:text-5xl md:text-6xl">
                  {data.hero?.title ?? "Dientes"}
                </h1>
                <p className="mt-2 text-xl italic text-[#17B4B6] sm:text-2xl md:text-3xl">
                  {data.hero?.subtitle ?? "dentálna hygiena"}
                </p>

                <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#4F7E7E] sm:text-lg md:text-xl">
                  {data.hero?.description ??
                    "Jemná, moderná a profesionálna dentálna hygiena v elegantnom štýle."}
                </p>

                <div className="mt-9 flex flex-col gap-4 sm:flex-row">
                  <a
                    href="#rezervacia"
                    className="rounded-full bg-[#1CC7C9] px-7 py-4 text-center font-semibold text-white shadow-lg shadow-[#1CC7C9]/20 transition hover:-translate-y-0.5 hover:bg-[#17B4B6]"
                  >
                    Rezervovať termín
                  </a>
                  <a
                    href="#sluzby"
                    className="rounded-full border border-[#DDF3F3] bg-[#FFFFFF] px-7 py-4 text-center font-semibold text-[#6D8F8F] transition hover:bg-[#E8FAFA]"
                  >
                    Pozrieť služby
                  </a>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-4 top-10 hidden h-24 w-24 rounded-full bg-[#E8FAFA] blur-2xl lg:block" />
                <div className="absolute -right-6 bottom-10 hidden h-28 w-28 rounded-full bg-[#BFEFEF]/50 blur-3xl lg:block" />

                <div className="relative rounded-[1.5rem] border border-[#DDF3F3] bg-[#FFFFFF] p-4 sm:rounded-[2rem] sm:p-8 shadow-[0_20px_60px_rgba(28,199,201,0.10)]">
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
                            className={`h-2.5 rounded-full transition-all ${index === activeHeroImage ? "w-8 bg-[#1CC7C9]" : "w-2.5 bg-[#DDF3F3]"}`}
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4">
                    {heroStats.map((stat: any) => (
                      <div
                        key={stat.title}
                        className="rounded-2xl border border-[#DDF3F3] bg-[#F8FEFE] p-4"
                      >
                        <div className="font-serif text-xl text-[#17B4B6]">
                          {stat.title}
                        </div>
                        <div className="mt-1 text-sm text-[#6D8F8F]">
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
          className="scroll-mt-24 mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20"
        >
          <div className="max-w-3xl">
            <p className="text-base font-semibold uppercase tracking-[0.18em] text-[#1CC7C9]">
              {data.servicesSection?.label ?? "Služby a benefity"}
            </p>
            <h2 className="mt-4 font-serif text-3xl text-[#174A4A] sm:text-4xl md:text-5xl">
              {data.servicesSection?.title ?? "Profesionálna hygiena"}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[#4F7E7E] sm:mt-5 sm:text-lg">
              {data.servicesSection?.description ??
                "Jemná a profesionálna dentálna hygiena."}
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {benefits.map((item: any) => (
              <div
                key={item.title}
                className="rounded-[1.75rem] border border-[#DDF3F3] bg-[#FFFFFF] p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.imageAlt || item.title}
                    className="mb-5 h-40 w-full rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#DDF3F3] text-lg font-bold text-[#1CC7C9]">
                    ✦
                  </div>
                )}
                <h3 className="mt-5 font-serif text-2xl leading-snug text-[#174A4A]">
                  {item.title}
                </h3>
                <p className="mt-3 leading-relaxed text-[#6D8F8F]">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {showGallery && data.gallery?.items?.length ? (
          <section
            id="galeria"
            className="scroll-mt-24 mx-auto max-w-7xl px-4 pb-12 sm:px-6 sm:pb-16 lg:pb-20"
          >
            <div className="max-w-3xl">
              <p className="text-base font-semibold uppercase tracking-[0.18em] text-[#1CC7C9]">
                {data.gallery?.label ?? "Galéria"}
              </p>
              <h2 className="mt-4 font-serif text-3xl text-[#174A4A] sm:text-4xl md:text-5xl">
                {data.gallery?.title ?? "Fotky prevádzky"}
              </h2>
              {data.gallery?.description ? (
                <p className="mt-4 text-base leading-relaxed text-[#4F7E7E] sm:mt-5 sm:text-lg">
                  {data.gallery.description}
                </p>
              ) : null}
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {data.gallery.items.map((photo: any) => (
                <figure
                  key={photo.image}
                  className="overflow-hidden rounded-[1.75rem] border border-[#DDF3F3] bg-[#FFFFFF] shadow-sm"
                >
                  <img
                    src={photo.image}
                    alt={photo.alt || photo.caption || "Fotka"}
                    className="h-72 w-full object-cover"
                  />
                  {photo.caption ? (
                    <figcaption className="px-5 py-4 text-sm text-[#6D8F8F]">
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
          className="scroll-mt-24 border-y border-[#DDF3F3] bg-[#FFFFFF]"
        >
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
            <p className="text-base font-semibold uppercase tracking-[0.18em] text-[#1CC7C9]">
              Priebeh ošetrenia
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:gap-5">
              {steps.map((step: string, index: number) => (
                <div
                  key={step}
                  className="flex min-h-28 items-center gap-4 rounded-[1.5rem] border border-[#DDF3F3] bg-[#F8FEFE] p-5"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1CC7C9] font-semibold text-white">
                    {index + 1}
                  </div>
                  <div className="text-base leading-relaxed text-[#4F7E7E] sm:text-lg">
                    {step}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="rezervacia"
          className="scroll-mt-24 mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20"
        >
          <div className="mx-auto w-full max-w-5xl">
            <div>
              <p className="text-base font-semibold uppercase tracking-[0.18em] text-[#1CC7C9]">
                Online rezervácia
              </p>
              <h2 className="mt-4 max-w-3xl font-serif text-3xl text-[#174A4A] sm:text-4xl md:text-5xl">
                Rezervujte si termín pohodlne online
              </h2>

              {insuranceSection.enabled !== false ? (
                <div className="mt-6 rounded-[1.5rem] border border-[#DDF3F3] bg-[#F8FEFE] p-5 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="max-w-3xl">
                      <h3 className="font-serif text-2xl text-[#174A4A]">
                        {insuranceSection.title ?? "Príspevok od zdravotnej poisťovne"}
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-[#4F7E7E] sm:text-base">
                        {insuranceSection.description ??
                          "Ambulancia Dientes nie je zmluvným partnerom zdravotných poisťovní, napriek tomu si môžete príspevok na dentálnu hygienu uplatniť zo svojho benefitného programu."}
                      </p>
                    </div>

                    <div className="grid shrink-0 grid-cols-1 gap-2 sm:min-w-56 sm:grid-cols-2">
                      <div className="rounded-2xl border border-[#DDF3F3] bg-white px-4 py-3 text-center">
                        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1CC7C9]">
                          Dôvera
                        </div>
                        <div className="mt-1 font-serif text-xl text-[#174A4A]">
                          {insuranceSection.doveraFrequency ?? "2× ročne"}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-[#DDF3F3] bg-white px-4 py-3 text-center">
                        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1CC7C9]">
                          Union
                        </div>
                        <div className="mt-1 font-serif text-xl text-[#174A4A]">
                          {insuranceSection.unionFrequency ?? "2× ročne"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 text-sm font-medium text-[#3D6666] sm:text-base">
                    {insuranceSection.helpText ??
                      "S vybavením príspevku vám radi pomôžeme priamo v ambulancii."}
                  </p>
                </div>
              ) : null}
            </div>

            <form
              onSubmit={handleBookingSubmit}
              noValidate
              className="mt-8 overflow-hidden rounded-[2rem] border border-[#DDF3F3] bg-[#FFFFFF] shadow-[0_20px_60px_rgba(28,199,201,0.10)] sm:mt-10"
            >
              <div className="space-y-7 p-4 sm:space-y-8 sm:p-6">
                <div>
                  <div className="mb-4 flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1CC7C9] font-semibold text-white">
                      1
                    </span>
                    <div>
                      <h3 className="font-serif text-2xl text-[#174A4A]">
                        Vyberte službu
                      </h3>
                      <p className="text-sm text-[#6D8F8F]">
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
                              ? "border-[#1CC7C9] bg-[#E8FAFA] shadow-sm"
                              : "border-[#DDF3F3] bg-white/70 hover:border-[#1CC7C9]/60 hover:bg-[#F8FEFE]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="font-semibold text-[#174A4A]">
                              {service.name}
                            </h4>
                            {isSelected ? (
                              <span className="text-[#1CC7C9]">●</span>
                            ) : null}
                          </div>
                          <p className="mt-3 text-sm leading-relaxed text-[#6D8F8F]">
                            {service.description}
                          </p>
                          <div className="mt-4 flex items-center justify-between text-sm">
                            <span className="text-[#6D8F8F]">
                              {service.duration}
                            </span>
                            <strong className="text-[#17B4B6]">
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
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1CC7C9] font-semibold text-white">
                      2
                    </span>
                    <div>
                      <h3 className="font-serif text-2xl text-[#174A4A]">
                        Vyberte termín
                      </h3>
                      <p className="text-sm text-[#6D8F8F]">
                        Vyberte si dostupný termín podľa aktuálnej obsadenosti kalendára.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-[#3D6666]">
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
                        className="w-full rounded-2xl border border-[#DDF3F3] bg-white px-4 py-3 text-[#174A4A] outline-none transition focus:border-[#1CC7C9] focus:ring-4 focus:ring-[#1CC7C9]/10"
                      />
                    </label>
                    <div className="rounded-2xl border border-[#DDF3F3] bg-white/70 px-4 py-3 text-sm text-[#3D6666]">
                      <strong className="block text-[#174A4A]">{formatDateLong(selectedDate)}</strong>
                      <span>{selectedDate ? DAY_LABELS[new Date(`${selectedDate}T12:00:00`).getDay()] : ""}</span>
                    </div>
                  </div>

                  {!selectedDateAllowed ? (
                    <div className="mt-4 rounded-2xl border border-[#E25555] bg-[#FFF5F5] p-4 text-sm text-[#C83E3E]">
                      <p className="font-semibold">
                        {selectedDateReason ||
                          "Tento dátum momentálne nie je otvorený na rezervácie."}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDate(nearestAllowedDate);
                          setReservationError("");
                          setReservationSuccess("");
                          setSent(false);
                        }}
                        className="mt-3 inline-flex rounded-full bg-[#1CC7C9] px-4 py-2 font-semibold text-white transition hover:bg-[#17B4B6]"
                      >
                        Prejsť na najbližší voľný termín
                      </button>
                    </div>
                  ) : null}

                  {availabilityLoading ? (
                    <div className="mt-4 rounded-2xl border border-[#DDF3F3] bg-white/70 p-4 text-sm text-[#3D6666]">
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
                              ? "border-[#1CC7C9] bg-[#1CC7C9] text-white"
                              : isDisabled
                                ? "cursor-not-allowed border-[#DDF3F3] bg-[#F0FBFB] text-[#6D8F8F] line-through"
                                : "border-[#DDF3F3] bg-white/70 text-[#3D6666] hover:bg-[#E8FAFA]"
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>

                  {selectedDateAllowed && !availableBookingTimes.length && !availabilityLoading ? (
                    <div className="mt-4 rounded-2xl border border-[#DDF3F3] bg-[#F8FEFE] p-4 text-sm text-[#174A4A]">
                      Na tento deň už nie sú dostupné voľné časy.
                    </div>
                  ) : null}
                </div>

                <div>
                  <div className="mb-4 flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1CC7C9] font-semibold text-white">
                      3
                    </span>
                    <div>
                      <h3 className="font-serif text-2xl text-[#174A4A]">
                        Vaše údaje
                      </h3>
                      <p className="text-sm text-[#6D8F8F]">
                        Po odoslaní sa zobrazí potvrdenie rezervácie.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-[#3D6666]">
                        Meno a priezvisko
                      </span>
                      <input
                        name="name"
                        aria-invalid={Boolean(fieldErrors.name)}
                        onChange={() =>
                          setFieldErrors((current) => {
                            if (!current.name) return current;
                            const next = { ...current };
                            delete next.name;
                            return next;
                          })
                        }
                        className={`w-full rounded-2xl border bg-white px-4 py-3 text-[#174A4A] outline-none transition focus:ring-4 ${
                          fieldErrors.name
                            ? "border-[#E25555] bg-[#FFF5F5] focus:border-[#E25555] focus:ring-[#E25555]/10"
                            : "border-[#DDF3F3] focus:border-[#1CC7C9] focus:ring-[#1CC7C9]/10"
                        }`}
                        placeholder="Jana Nováková"
                      />
                      {fieldErrors.name ? (
                        <span className="mt-2 block text-sm font-medium text-[#C83E3E]">
                          {fieldErrors.name}
                        </span>
                      ) : null}
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-[#3D6666]">
                        Telefón
                      </span>
                      <input
                        name="phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        maxLength={16}
                        aria-invalid={Boolean(fieldErrors.phone)}
                        onInput={(event) => {
                          const input = event.currentTarget;
                          let value = input.value.replace(/[^0-9+]/g, "");

                          if (value.includes("+")) {
                            value =
                              (value.startsWith("+") ? "+" : "") +
                              value.replace(/\+/g, "");
                          }

                          input.value = value;
                        }}
                        onChange={() =>
                          setFieldErrors((current) => {
                            if (!current.phone) return current;
                            const next = { ...current };
                            delete next.phone;
                            return next;
                          })
                        }
                        className={`w-full rounded-2xl border bg-white px-4 py-3 text-[#174A4A] outline-none transition focus:ring-4 ${
                          fieldErrors.phone
                            ? "border-[#E25555] bg-[#FFF5F5] focus:border-[#E25555] focus:ring-[#E25555]/10"
                            : "border-[#DDF3F3] focus:border-[#1CC7C9] focus:ring-[#1CC7C9]/10"
                        }`}
                        placeholder="+421900123456"
                      />
                      {fieldErrors.phone ? (
                        <span className="mt-2 block text-sm font-medium text-[#C83E3E]">
                          {fieldErrors.phone}
                        </span>
                      ) : null}
                    </label>
                    <label className="block md:col-span-2">
                      <span className="mb-2 block text-sm font-semibold text-[#3D6666]">
                        E-mail
                      </span>
                      <input
                        name="email"
                        type="email"
                        aria-invalid={Boolean(fieldErrors.email)}
                        onChange={() =>
                          setFieldErrors((current) => {
                            if (!current.email) return current;
                            const next = { ...current };
                            delete next.email;
                            return next;
                          })
                        }
                        className={`w-full rounded-2xl border bg-white px-4 py-3 text-[#174A4A] outline-none transition focus:ring-4 ${
                          fieldErrors.email
                            ? "border-[#E25555] bg-[#FFF5F5] focus:border-[#E25555] focus:ring-[#E25555]/10"
                            : "border-[#DDF3F3] focus:border-[#1CC7C9] focus:ring-[#1CC7C9]/10"
                        }`}
                        placeholder="jana@email.sk"
                      />
                      {fieldErrors.email ? (
                        <span className="mt-2 block text-sm font-medium text-[#C83E3E]">
                          {fieldErrors.email}
                        </span>
                      ) : null}
                    </label>
                    <label className="block md:col-span-2">
                      <span className="mb-2 block text-sm font-semibold text-[#3D6666]">
                        Poznámka
                      </span>
                      <textarea
                        name="note"
                        className="min-h-24 w-full rounded-2xl border border-[#DDF3F3] bg-white px-4 py-3 text-[#174A4A] outline-none transition focus:border-[#1CC7C9] focus:ring-4 focus:ring-[#1CC7C9]/10"
                        placeholder="Napr. citlivé ďasná, strojček, tehotenstvo..."
                      />
                    </label>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-[#DDF3F3] bg-[#F8FEFE] p-5">
                  <h4 className="font-serif text-2xl text-[#17B4B6]">
                    Súhrn rezervácie
                  </h4>
                  <div className="mt-4 space-y-3 text-sm text-[#3D6666]">
                    <div className="flex justify-between gap-4">
                      <span>Služba</span>
                      <strong className="text-right text-[#174A4A]">
                        {activeService.name}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Trvanie</span>
                      <strong className="text-[#174A4A]">
                        {activeService.duration}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Termín</span>
                      <strong className="text-[#174A4A]">
                        {formatDateLong(selectedDate)} o {selectedTime || "—"}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Cena</span>
                      <strong className="text-[#174A4A]">
                        {activeService.price}
                      </strong>
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    className={`flex gap-3 rounded-2xl border p-4 text-sm leading-relaxed transition ${
                      fieldErrors.gdpr
                        ? "border-[#E25555] bg-[#FFF5F5] text-[#C83E3E]"
                        : "border-[#DDF3F3] bg-white/70 text-[#3D6666]"
                    }`}
                  >
                    <input
                      name="gdpr"
                      type="checkbox"
                      checked={gdprAccepted}
                      aria-invalid={Boolean(fieldErrors.gdpr)}
                      onChange={(event) => {
                        setGdprAccepted(event.target.checked);
                        if (event.target.checked) {
                          setFieldErrors((current) => {
                            if (!current.gdpr) return current;
                            const next = { ...current };
                            delete next.gdpr;
                            return next;
                          });
                        }
                      }}
                      className="mt-1 h-4 w-4 rounded border-[#DDF3F3]"
                    />
                    <span>
                      Súhlasím so spracovaním osobných údajov za účelom vybavenia
                      rezervácie a beriem na vedomie storno podmienky.
                    </span>
                  </label>
                  {fieldErrors.gdpr ? (
                    <span className="mt-2 block text-sm font-medium text-[#C83E3E]">
                      {fieldErrors.gdpr}
                    </span>
                  ) : null}
                </div>

                <button
                  type="submit"
                  disabled={!isMounted || submitting || !selectedDateAllowed || !selectedTime}
                  className="w-full rounded-full bg-[#1CC7C9] px-7 py-4 text-center font-semibold text-white shadow-lg shadow-[#1CC7C9]/20 transition hover:-translate-y-0.5 hover:bg-[#17B4B6] disabled:cursor-not-allowed disabled:bg-[#A7DCDC] disabled:shadow-none"
                >
                  {submitting ? "Odosielam rezerváciu..." : "Potvrdiť rezerváciu"}
                </button>

                {reservationError ? (
                  <div className="rounded-2xl border border-[#E25555] bg-[#FFF5F5] p-4 text-sm font-semibold text-[#C83E3E]">
                    {reservationError}
                  </div>
                ) : null}

                {sent || reservationSuccess ? (
                  <div className="mx-auto w-full max-w-[900px] rounded-[1.75rem] border-2 border-[#1CC7C9] bg-[#F4FEFE] p-5 sm:p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1CC7C9] text-2xl text-white">
                        ✉
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#1CC7C9]">
                          Ešte jeden krok
                        </p>
                        <h4 className="mt-1 font-serif text-2xl font-semibold text-[#174A4A] sm:text-3xl">
                          Vaša rezervácia ešte nie je potvrdená
                        </h4>

                        <p className="mt-3 text-base leading-relaxed text-[#3D6666]">
                          Na vašu e-mailovú adresu sme poslali správu s tlačidlom
                          <strong> „Potvrdiť rezerváciu“</strong>.
                        </p>

                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                          <div className="rounded-2xl border border-[#DDF3F3] bg-white p-4 text-center">
                            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-[#E8FAFA] font-bold text-[#1CC7C9]">
                              1
                            </div>
                            <p className="mt-2 text-sm font-semibold text-[#174A4A]">
                              Otvorte e-mail
                            </p>
                          </div>

                          <div className="rounded-2xl border border-[#DDF3F3] bg-white p-4 text-center">
                            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-[#E8FAFA] font-bold text-[#1CC7C9]">
                              2
                            </div>
                            <p className="mt-2 text-sm font-semibold text-[#174A4A]">
                              Kliknite „Potvrdiť rezerváciu“
                            </p>
                          </div>

                          <div className="rounded-2xl border border-[#DDF3F3] bg-white p-4 text-center">
                            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-[#E8FAFA] font-bold text-[#1CC7C9]">
                              3
                            </div>
                            <p className="mt-2 text-sm font-semibold text-[#174A4A]">
                              Hotovo ✓
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 rounded-2xl border border-[#DDF3F3] bg-white px-4 py-3">
                          <p className="font-semibold text-[#174A4A]">
                            ⏱ Termín pre vás držíme 10 minút.
                          </p>
                          <p className="mt-1 text-sm leading-relaxed text-[#6D8F8F]">
                            Ak rezerváciu do 10 minút nepotvrdíte, termín sa automaticky uvoľní pre ďalších klientov.
                          </p>
                        </div>

                        <p className="mt-4 text-sm text-[#6D8F8F]">
                          <strong>E-mail nevidíte?</strong> Skontrolujte aj priečinok Spam alebo Nevyžiadaná pošta.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </form>
          </div>
        </section>

        {showPriceSection ? (
        <section id="cennik" className="scroll-mt-24 border-y border-[#DDF3F3] bg-[#FFFFFF]">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:items-start lg:gap-10 lg:py-20">
            <div>
              <p className="text-base font-semibold uppercase tracking-[0.18em] text-[#1CC7C9]">
                {data.priceSection?.label ?? "Cenník"}
              </p>
              <h2 className="mt-4 font-serif text-3xl text-[#174A4A] sm:text-4xl md:text-5xl">
                {data.priceSection?.title ?? "Transparentné ceny"}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[#4F7E7E] sm:mt-5 sm:text-lg">
                {data.priceSection?.description ?? ""}
              </p>
            </div>

            <div className="overflow-hidden rounded-[1.75rem] border border-[#DDF3F3] bg-white shadow-sm">
              {prices.map((item: any, index: number) => {
                const borderClass =
                  index !== prices.length - 1
                    ? "border-b border-[#DDF3F3]"
                    : "";

                return (
                  <div
                    key={item.name}
                    className={`flex flex-col gap-2 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 ${borderClass}`}
                  >
                    <span className="text-lg text-[#4F7E7E]">{item.name}</span>
                    <span className="font-serif text-2xl text-[#17B4B6]">
                      {item.price}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        ) : null}

        <section
          id="kontakt"
          className="scroll-mt-24 mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20"
        >
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-10">
            <div>
              <p className="text-base font-semibold uppercase tracking-[0.18em] text-[#1CC7C9]">
                {data.contactSection?.label ?? "Kontakt a mapa"}
              </p>
              <h2 className="mt-4 font-serif text-3xl text-[#174A4A] sm:text-4xl md:text-5xl">
                {data.contactSection?.title ?? "Kde nás nájdete"}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[#4F7E7E] sm:mt-5 sm:text-lg">
                {data.contactSection?.description ??
                  "Prevádzku nájdete jednoducho podľa mapy."}
              </p>

              <div className="mt-8 space-y-4">
                <div className="rounded-[1.5rem] border border-[#DDF3F3] bg-[#FFFFFF] p-5">
                  <div className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1CC7C9]">
                    Adresa prevádzky
                  </div>
                  <div className="mt-2 font-serif text-2xl text-[#174A4A]">
                    {data.businessName ?? "Dientes dentálna hygiena"}
                  </div>
                  <p className="mt-2 text-[#6D8F8F]">{businessAddress}</p>
                  {businessPhone ? (
                    <p className="mt-3 text-[#6D8F8F]">
                      <strong className="text-[#174A4A]">Telefón:</strong>{" "}
                      <a href={`tel:${businessPhone.replace(/\s+/g, "")}`} className="hover:text-[#1CC7C9]">
                        {businessPhone}
                      </a>
                    </p>
                  ) : null}
                  {businessEmail ? (
                    <p className="mt-2 text-[#6D8F8F]">
                      <strong className="text-[#174A4A]">E-mail:</strong>{" "}
                      <a href={`mailto:${businessEmail}`} className="hover:text-[#1CC7C9]">
                        {businessEmail}
                      </a>
                    </p>
                  ) : null}
                </div>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(businessAddress)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-full bg-[#1CC7C9] px-6 py-3 font-semibold text-white shadow-lg shadow-[#1CC7C9]/20 transition hover:-translate-y-0.5 hover:bg-[#17B4B6]"
                >
                  Otvoriť trasu v Google Maps
                </a>
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-[#DDF3F3] bg-[#FFFFFF] shadow-[0_20px_60px_rgba(28,199,201,0.10)]">
              <div className="border-b border-[#DDF3F3] px-6 py-5">
                <h3 className="font-serif text-3xl text-[#17B4B6]">
                  {data.contactSection?.mapTitle ?? "Mapa prevádzky"}
                </h3>
                <p className="mt-1 text-[#6D8F8F]">
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

      <footer className="border-t border-[#DDF3F3] bg-[#3D6666] text-[#F8FEFE]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-center sm:px-6 md:flex-row md:text-left">
          <div>
            <div className="font-serif text-2xl tracking-[0.14em]">
              {data.header?.brandTitle ?? "DIENTES"}
            </div>
            <div className="text-sm italic text-[#DDF3F3]">
              {data.header?.brandSubtitle ?? "dentálna hygiena"}
            </div>
          </div>
          <div className="text-sm text-[#E8FAFA]">
            © 2026 Dientes • Elegantná dentálna hygiena
          </div>
        </div>
      </footer>
    </div>
  );
}
