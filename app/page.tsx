"use client";

import { useMemo, useState } from "react";

type Reservation = {
  id: string;
  service: string;
  duration: string;
  price: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  email: string;
  note: string;
  createdAt: string;
  status: "Nová" | "Potvrdená" | "Zrušená";
};

const bookingServices = [
  {
    id: "vstupna",
    name: "Vstupná dentálna hygiena",
    duration: "60 min",
    price: "od 55 €",
    description: "Kompletné profesionálne čistenie, vstupná konzultácia a odporúčania."
  },
  {
    id: "pravidelna",
    name: "Pravidelná dentálna hygiena",
    duration: "45 min",
    price: "od 45 €",
    description: "Pravidelné odstránenie povlaku a pigmentov po vstupnom ošetrení."
  },
  {
    id: "konzultacia",
    name: "Kontrola a konzultácia",
    duration: "30 min",
    price: "podľa dohody",
    description: "Krátka konzultácia stavu ďasien, citlivosti alebo výberu hygieny."
  }
];

const bookingDates = [
  { day: "Po", date: "27", month: "máj" },
  { day: "Ut", date: "28", month: "máj" },
  { day: "St", date: "29", month: "máj" },
  { day: "Št", date: "30", month: "máj" },
  { day: "Pi", date: "31", month: "máj" }
];

const bookingTimes = ["08:30", "09:15", "10:00", "11:30", "13:00", "14:45", "16:00"];

function saveReservation(reservation: Reservation) {
  if (typeof window === "undefined") return;
  const current = JSON.parse(localStorage.getItem("dientesReservations") || "[]") as Reservation[];
  localStorage.setItem("dientesReservations", JSON.stringify([reservation, ...current]));
}

export default function DentalHygienaPage() {
  const [selectedService, setSelectedService] = useState("vstupna");
  const [selectedDate, setSelectedDate] = useState("27");
  const [selectedTime, setSelectedTime] = useState("09:15");
  const [gdprAccepted, setGdprAccepted] = useState(false);
  const [sent, setSent] = useState(false);

  const activeService = useMemo(
    () => bookingServices.find((service) => service.id === selectedService) ?? bookingServices[0],
    [selectedService]
  );

  const handleBookingSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    if (!gdprAccepted) {
      alert("Prosím, potvrďte súhlas so spracovaním osobných údajov.");
      return;
    }

    const reservation: Reservation = {
      id: crypto.randomUUID(),
      service: activeService.name,
      duration: activeService.duration,
      price: activeService.price,
      date: `${selectedDate}. máj`,
      time: selectedTime,
      name: String(formData.get("name") || ""),
      phone: String(formData.get("phone") || ""),
      email: String(formData.get("email") || ""),
      note: String(formData.get("note") || ""),
      createdAt: new Date().toISOString(),
      status: "Nová"
    };

    saveReservation(reservation);
    setSent(true);
    event.currentTarget.reset();
    setGdprAccepted(false);
  };

  return (
    <div className="min-h-screen bg-[#F7F1EA] text-[#5F5148]">
      <header className="sticky top-0 z-50 border-b border-[#E4D7CA]/80 bg-[#FBF8F3]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="#top" className="flex items-center gap-3">
            <img src="/logo.png" alt="Dientes logo" className="h-12 w-12 rounded-full object-contain" />
            <div>
              <div className="font-serif text-2xl tracking-[0.18em] text-[#B37E74]">DIENTES</div>
              <div className="-mt-1 text-sm italic text-[#B79A73]">dentálna hygiena</div>
            </div>
          </a>
          <nav className="hidden items-center gap-8 lg:flex">
            <a href="#sluzby" className="text-sm font-medium hover:text-[#B37E74]">Služby</a>
            <a href="#rezervacia" className="text-sm font-medium hover:text-[#B37E74]">Rezervácia</a>
            <a href="/admin" className="text-sm font-medium hover:text-[#B37E74]">Admin</a>
          </nav>
          <a href="#rezervacia" className="rounded-full bg-[#B37E74] px-5 py-3 text-sm font-semibold text-white hover:bg-[#9F6F66]">
            Rezervovať termín
          </a>
        </div>
      </header>

      <main id="top">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(179,126,116,0.16),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(183,154,115,0.18),_transparent_28%)]" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:py-24">
            <div>
              <span className="inline-flex rounded-full border border-[#E6D7C8] bg-[#FBF8F3] px-4 py-2 text-sm text-[#B37E74] shadow-sm">
                Elegantná a šetrná starostlivosť o úsmev
              </span>
              <h1 className="mt-7 font-serif text-5xl leading-[1.05] text-[#A86F67] md:text-6xl">Dientes</h1>
              <p className="mt-2 text-2xl italic text-[#B79A73] md:text-3xl">dentálna hygiena</p>
              <p className="mt-8 max-w-2xl text-lg leading-relaxed text-[#75665D] md:text-xl">
                Jemná, moderná a profesionálna dentálna hygiena v elegantnom štýle. Rezervujte si termín online bez telefonovania.
              </p>
              <div className="mt-9 flex flex-col gap-4 sm:flex-row">
                <a href="#rezervacia" className="rounded-full bg-[#B37E74] px-7 py-4 text-center font-semibold text-white shadow-lg shadow-[#B37E74]/20 hover:bg-[#9F6F66]">
                  Rezervovať termín
                </a>
                <a href="#sluzby" className="rounded-full border border-[#DCCBBB] bg-[#FBF8F3] px-7 py-4 text-center font-semibold text-[#8A7265] hover:bg-[#F4ECE4]">
                  Pozrieť služby
                </a>
              </div>
            </div>
            <div className="rounded-[2rem] border border-[#E2D4C7] bg-[#FBF8F3] p-8 shadow-[0_20px_60px_rgba(130,100,85,0.12)]">
              <div className="flex justify-center">
                <img src="/logo.png" alt="Dientes" className="h-72 w-auto object-contain md:h-80" />
              </div>
              <div className="mt-8 grid grid-cols-2 gap-4">
                {["30–60 min", "Jemný prístup", "Prevencia", "Online rezervácia"].map((item) => (
                  <div key={item} className="rounded-2xl border border-[#E7DBCF] bg-[#F7F1EA] p-4 font-serif text-xl text-[#A86F67]">{item}</div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="sluzby" className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#B37E74]">Služby</p>
          <h2 className="mt-4 max-w-3xl font-serif text-4xl text-[#4E4139] md:text-5xl">Profesionálna hygiena v pokojnom prostredí</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {bookingServices.map((service) => (
              <div key={service.id} className="rounded-[1.75rem] border border-[#E5D8CB] bg-[#FBF8F3] p-6 shadow-sm">
                <h3 className="font-serif text-2xl text-[#5B4D45]">{service.name}</h3>
                <p className="mt-3 leading-relaxed text-[#7B6D64]">{service.description}</p>
                <div className="mt-5 flex justify-between text-sm"><span>{service.duration}</span><strong>{service.price}</strong></div>
              </div>
            ))}
          </div>
        </section>

        <section id="rezervacia" className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#B37E74]">Online rezervácia</p>
              <h2 className="mt-4 font-serif text-4xl text-[#4E4139] md:text-5xl">Rezervujte si termín pohodlne online</h2>
              <p className="mt-5 text-lg leading-relaxed text-[#786960]">
                Klient si vyberie službu, dátum, čas a odošle údaje. Rezervácie sa ukladajú do lokálneho admin dashboardu.
              </p>
              <a href="/admin" className="mt-8 inline-flex rounded-full border border-[#DCCBBB] bg-[#FBF8F3] px-6 py-3 font-semibold text-[#8A7265] hover:bg-[#F4ECE4]">
                Otvoriť admin dashboard
              </a>
            </div>

            <form onSubmit={handleBookingSubmit} className="overflow-hidden rounded-[2rem] border border-[#E2D4C7] bg-[#FBF8F3] shadow-[0_20px_60px_rgba(130,100,85,0.12)]">
              <div className="border-b border-[#E5D8CB] px-6 py-5">
                <div className="font-serif text-2xl text-[#A86F67]">Objednávka na dentálnu hygienu</div>
                <div className="text-sm text-[#8B796D]">Dientes dentálna hygiena</div>
              </div>

              <div className="space-y-8 p-6">
                <div>
                  <h3 className="mb-4 font-serif text-2xl text-[#4E4139]">1. Vyberte službu</h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    {bookingServices.map((service) => {
                      const isSelected = selectedService === service.id;
                      return (
                        <button key={service.id} type="button" onClick={() => setSelectedService(service.id)} className={`rounded-[1.35rem] border p-4 text-left transition ${isSelected ? "border-[#B37E74] bg-[#F1E2DA]" : "border-[#E7DBCF] bg-white/70 hover:bg-[#F7F1EA]"}`}>
                          <h4 className="font-semibold text-[#564943]">{service.name}</h4>
                          <p className="mt-3 text-sm leading-relaxed text-[#7B6D64]">{service.description}</p>
                          <div className="mt-4 flex justify-between text-sm"><span>{service.duration}</span><strong>{service.price}</strong></div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="mb-4 font-serif text-2xl text-[#4E4139]">2. Vyberte termín</h3>
                  <div className="mb-5 flex gap-3 overflow-x-auto pb-2">
                    {bookingDates.map((item) => {
                      const isSelected = selectedDate === item.date;
                      return (
                        <button key={item.date} type="button" onClick={() => setSelectedDate(item.date)} className={`min-w-24 rounded-2xl border p-4 text-center transition ${isSelected ? "border-[#B37E74] bg-[#B37E74] text-white" : "border-[#E7DBCF] bg-white/70 text-[#6B5B52] hover:bg-[#F1E2DA]"}`}>
                          <p className="text-sm opacity-80">{item.day}</p><p className="font-serif text-3xl">{item.date}</p><p className="text-sm opacity-80">{item.month}</p>
                        </button>
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-7">
                    {bookingTimes.map((time) => {
                      const isSelected = selectedTime === time;
                      return <button key={time} type="button" onClick={() => setSelectedTime(time)} className={`rounded-2xl border py-3 font-semibold transition ${isSelected ? "border-[#B37E74] bg-[#B37E74] text-white" : "border-[#E7DBCF] bg-white/70 text-[#6B5B52] hover:bg-[#F1E2DA]"}`}>{time}</button>;
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="mb-4 font-serif text-2xl text-[#4E4139]">3. Vaše údaje</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <input name="name" required className="rounded-2xl border border-[#E0D2C5] bg-white px-4 py-3 outline-none focus:border-[#B37E74]" placeholder="Meno a priezvisko" />
                    <input name="phone" required className="rounded-2xl border border-[#E0D2C5] bg-white px-4 py-3 outline-none focus:border-[#B37E74]" placeholder="Telefón" />
                    <input name="email" required type="email" className="rounded-2xl border border-[#E0D2C5] bg-white px-4 py-3 outline-none focus:border-[#B37E74] md:col-span-2" placeholder="E-mail" />
                    <textarea name="note" className="min-h-24 rounded-2xl border border-[#E0D2C5] bg-white px-4 py-3 outline-none focus:border-[#B37E74] md:col-span-2" placeholder="Poznámka" />
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-[#E5D8CB] bg-[#F7F1EA] p-5 text-sm">
                  <h4 className="font-serif text-2xl text-[#A86F67]">Súhrn rezervácie</h4>
                  <div className="mt-4 space-y-3 text-[#6E5F56]">
                    <div className="flex justify-between gap-4"><span>Služba</span><strong>{activeService.name}</strong></div>
                    <div className="flex justify-between"><span>Trvanie</span><strong>{activeService.duration}</strong></div>
                    <div className="flex justify-between"><span>Termín</span><strong>{selectedDate}. máj o {selectedTime}</strong></div>
                    <div className="flex justify-between"><span>Cena</span><strong>{activeService.price}</strong></div>
                  </div>
                </div>

                <label className="flex gap-3 rounded-2xl border border-[#E5D8CB] bg-white/70 p-4 text-sm leading-relaxed text-[#6E5F56]">
                  <input type="checkbox" checked={gdprAccepted} onChange={(event) => setGdprAccepted(event.target.checked)} className="mt-1 h-4 w-4" />
                  <span>Súhlasím so spracovaním osobných údajov za účelom vybavenia rezervácie.</span>
                </label>

                <button type="submit" className="w-full rounded-full bg-[#B37E74] px-7 py-4 font-semibold text-white shadow-lg shadow-[#B37E74]/20 hover:bg-[#9F6F66]">Potvrdiť rezerváciu</button>

                {sent ? <div className="rounded-2xl border border-[#C9D9BE] bg-[#F0F6EA] p-4 text-sm font-medium text-[#526C45]">Ďakujeme, rezervácia bola uložená. Nájdete ju v admin dashboarde.</div> : null}
              </div>
            </form>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#E5D8CB] bg-[#6F5A4D] text-[#F5EDE4]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row">
          <div><div className="font-serif text-2xl tracking-[0.14em]">DIENTES</div><div className="text-sm italic text-[#E0CCB7]">dentálna hygiena</div></div>
          <div className="text-sm text-[#EBDDCE]">© 2026 Dientes • Elegantná dentálna hygiena</div>
        </div>
      </footer>
    </div>
  );
}
