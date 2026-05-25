"use client";

import { useMemo, useState } from "react";

export default function DentalHygienaPage() {
  const benefits = [
    {
      title: "Profesionálne odstránenie povlaku a zubného kameňa",
      text: "Šetrné a dôkladné odstránenie nánosov pre čistý, svieži a zdravší úsmev."
    },
    {
      title: "Prevencia zápalu ďasien a kazov",
      text: "Pravidelná dentálna hygiena pomáha predchádzať problémom a udržiava chrup v dobrej kondícii."
    },
    {
      title: "Jemný a individuálny prístup",
      text: "Každé ošetrenie prispôsobujeme citlivosti, stavu chrupu aj vašim potrebám."
    },
    {
      title: "Odporúčania pre domácu starostlivosť",
      text: "Ukážeme vám, ako si výsledok udržať čo najdlhšie aj mimo ambulancie."
    }
  ];

  const steps = [
    "Vyšetrenie stavu chrupu a ďasien",
    "Odstránenie zubného kameňa a povlakov",
    "Pieskovanie a jemné dočistenie povrchov",
    "Leštenie zubov pre hladký a príjemný pocit",
    "Odporúčania pre domácu hygienu a prevenciu"
  ];

  const prices = [
    { name: "Vstupná dentálna hygiena", price: "od 55 €" },
    { name: "Pravidelná dentálna hygiena", price: "od 45 €" },
    { name: "Kontrola a konzultácia", price: "podľa dohody" }
  ];

  const businessAddress = "Pribinova 788/8, 040 01 Košice";
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(businessAddress)}&output=embed`;
  const navItems = [
    { label: "Služby", href: "#sluzby" },
    { label: "Priebeh", href: "#priebeh" },
    { label: "Rezervácia", href: "#rezervacia" },
    { label: "Cenník", href: "#cennik" },
    { label: "Kontakt", href: "#kontakt" }
  ];

  const heroStats = [
    ["30–60 min", "trvanie ošetrenia"],
    ["Jemný prístup", "aj pri citlivosti"],
    ["Prevencia", "zdravšie ďasná a zuby"],
    ["Starostlivosť", "na mieru pre vás"]
  ];

  const bookingServices = [
    {
      id: "vstupna",
      name: "Vstupná dentálna hygiena",
      duration: "60 min",
      price: "od 55 €",
      description: "Kompletné profesionálne čistenie, vstupná konzultácia a odporúčania na domácu starostlivosť."
    },
    {
      id: "pravidelna",
      name: "Pravidelná dentálna hygiena",
      duration: "45 min",
      price: "od 45 €",
      description: "Pravidelné odstránenie povlaku a pigmentov pre klientov po vstupnom ošetrení."
    },
    {
      id: "konzultacia",
      name: "Kontrola a konzultácia",
      duration: "30 min",
      price: "podľa dohody",
      description: "Krátka konzultácia stavu ďasien, citlivosti alebo odporúčanie vhodného typu hygieny."
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

    if (!gdprAccepted) {
      alert("Prosím, potvrďte súhlas so spracovaním osobných údajov.");
      return;
    }

    setSent(true);
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

          <a
            href="#rezervacia"
            className="rounded-full bg-[#B37E74] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#9F6F66]"
          >
            Rezervovať termín
          </a>
        </div>
      </header>

      <main id="top">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(179,126,116,0.16),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(183,154,115,0.18),_transparent_28%)]" />
          <div className="relative mx-auto max-w-7xl px-6 py-16 lg:py-24">
            <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <span className="inline-flex items-center rounded-full border border-[#E6D7C8] bg-[#FBF8F3] px-4 py-2 text-sm text-[#B37E74] shadow-sm">
                  Elegantná a šetrná starostlivosť o úsmev
                </span>

                <h1 className="mt-7 max-w-3xl font-serif text-5xl leading-[1.05] text-[#A86F67] md:text-6xl">
                  Dientes
                </h1>
                <p className="mt-2 text-2xl italic text-[#B79A73] md:text-3xl">dentálna hygiena</p>

                <p className="mt-8 max-w-2xl text-lg leading-relaxed text-[#75665D] md:text-xl">
                  Jemná, moderná a profesionálna dentálna hygiena v elegantnom štýle, ktorý pôsobí čisto,
                  pokojne a dôveryhodne. Pomôžeme vám získať zdravší úsmev aj lepší pocit z vašich zubov.
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

                <div className="relative rounded-[2rem] border border-[#E2D4C7] bg-[#FBF8F3] p-8 shadow-[0_20px_60px_rgba(130,100,85,0.12)]">
                  <div className="flex justify-center">
                    <img src="/logo.png" alt="Dientes" className="h-72 w-auto object-contain md:h-80" />
                  </div>

                  <div className="mt-8 grid grid-cols-2 gap-4">
                    {heroStats.map(([title, subtitle]) => (
                      <div key={title} className="rounded-2xl border border-[#E7DBCF] bg-[#F7F1EA] p-4">
                        <div className="font-serif text-xl text-[#A86F67]">{title}</div>
                        <div className="mt-1 text-sm text-[#8A7669]">{subtitle}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="sluzby" className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#B37E74]">Služby a benefity</p>
            <h2 className="mt-4 font-serif text-4xl text-[#4E4139] md:text-5xl">
              Profesionálna hygiena v štýle, ktorý ladí s vaším úsmevom
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-[#786960]">
              Dizajn stránky sme zladili podľa loga Dientes – jemné púdrové tóny, elegantná typografia a čisté
              rozloženie vytvárajú prémiový, no stále príjemný dojem.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {benefits.map((item) => (
              <div
                key={item.title}
                className="rounded-[1.75rem] border border-[#E5D8CB] bg-[#FBF8F3] p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EEDFD6] text-lg font-bold text-[#B37E74]">
                  ✦
                </div>
                <h3 className="mt-5 font-serif text-2xl leading-snug text-[#5B4D45]">{item.title}</h3>
                <p className="mt-3 leading-relaxed text-[#7B6D64]">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="priebeh" className="border-y border-[#E5D8CB] bg-[#FBF8F3]">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-2 lg:items-start lg:py-20">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#B37E74]">Priebeh ošetrenia</p>
              <h2 className="mt-4 font-serif text-4xl text-[#4E4139] md:text-5xl">
                Jednoduchý proces, príjemná skúsenosť
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-[#786960]">
                Každý krok je navrhnutý tak, aby ošetrenie pôsobilo profesionálne, pokojne a bez zbytočného stresu.
              </p>
            </div>

            <div className="space-y-4">
              {steps.map((step, index) => (
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

        <section id="rezervacia" className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#B37E74]">Online rezervácia</p>
              <h2 className="mt-4 font-serif text-4xl text-[#4E4139] md:text-5xl">
                Rezervujte si termín pohodlne online
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-[#786960]">
                Namiesto externého Reservanto okna je rezervácia priamo súčasťou webu. Klient si vyberie službu,
                dátum, čas a odošle svoje údaje v čistom Dientes dizajne.
              </p>

              <div className="mt-8 rounded-[1.75rem] border border-[#E5D8CB] bg-[#FBF8F3] p-6 shadow-sm">
                <h3 className="font-serif text-2xl text-[#A86F67]">Čo formulár rieši</h3>
                <div className="mt-5 space-y-4">
                  {[
                    "výber služby podľa dĺžky a ceny",
                    "výber dostupného dátumu a času",
                    "kontaktné údaje klienta",
                    "poznámka k citlivosti, strojčeku alebo ďasnám",
                    "GDPR súhlas pred odoslaním"
                  ].map((item) => (
                    <div key={item} className="flex gap-3 rounded-2xl border border-[#E7DBCF] bg-white/60 p-4">
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
                <div className="font-serif text-2xl text-[#A86F67]">Objednávka na dentálnu hygienu</div>
                <div className="text-sm text-[#8B796D]">Dientes dentálna hygiena</div>
              </div>

              <div className="space-y-8 p-6">
                <div>
                  <div className="mb-4 flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#B37E74] font-semibold text-white">
                      1
                    </span>
                    <div>
                      <h3 className="font-serif text-2xl text-[#4E4139]">Vyberte službu</h3>
                      <p className="text-sm text-[#8E7C70]">Zvoľte typ návštevy podľa potreby.</p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    {bookingServices.map((service) => {
                      const isSelected = selectedService === service.id;

                      return (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() => setSelectedService(service.id)}
                          className={`rounded-[1.35rem] border p-4 text-left transition ${
                            isSelected
                              ? "border-[#B37E74] bg-[#F1E2DA] shadow-sm"
                              : "border-[#E7DBCF] bg-white/70 hover:border-[#B37E74]/60 hover:bg-[#F7F1EA]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="font-semibold text-[#564943]">{service.name}</h4>
                            {isSelected ? <span className="text-[#B37E74]">●</span> : null}
                          </div>
                          <p className="mt-3 text-sm leading-relaxed text-[#7B6D64]">{service.description}</p>
                          <div className="mt-4 flex items-center justify-between text-sm">
                            <span className="text-[#8E7C70]">{service.duration}</span>
                            <strong className="text-[#A86F67]">{service.price}</strong>
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
                      <h3 className="font-serif text-2xl text-[#4E4139]">Vyberte termín</h3>
                      <p className="text-sm text-[#8E7C70]">Ukážkové dostupné časy pripravené na napojenie databázy.</p>
                    </div>
                  </div>

                  <div className="mb-5 flex gap-3 overflow-x-auto pb-2">
                    {bookingDates.map((item) => {
                      const isSelected = selectedDate === item.date;

                      return (
                        <button
                          key={item.date}
                          type="button"
                          onClick={() => setSelectedDate(item.date)}
                          className={`min-w-24 rounded-2xl border p-4 text-center transition ${
                            isSelected
                              ? "border-[#B37E74] bg-[#B37E74] text-white"
                              : "border-[#E7DBCF] bg-white/70 text-[#6B5B52] hover:bg-[#F1E2DA]"
                          }`}
                        >
                          <p className="text-sm opacity-80">{item.day}</p>
                          <p className="font-serif text-3xl">{item.date}</p>
                          <p className="text-sm opacity-80">{item.month}</p>
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-7">
                    {bookingTimes.map((time) => {
                      const isSelected = selectedTime === time;

                      return (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setSelectedTime(time)}
                          className={`rounded-2xl border py-3 font-semibold transition ${
                            isSelected
                              ? "border-[#B37E74] bg-[#B37E74] text-white"
                              : "border-[#E7DBCF] bg-white/70 text-[#6B5B52] hover:bg-[#F1E2DA]"
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="mb-4 flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#B37E74] font-semibold text-white">
                      3
                    </span>
                    <div>
                      <h3 className="font-serif text-2xl text-[#4E4139]">Vaše údaje</h3>
                      <p className="text-sm text-[#8E7C70]">Po odoslaní sa zobrazí potvrdenie rezervácie.</p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-[#6E5F56]">Meno a priezvisko</span>
                      <input
                        required
                        className="w-full rounded-2xl border border-[#E0D2C5] bg-white px-4 py-3 text-[#4E4139] outline-none transition focus:border-[#B37E74] focus:ring-4 focus:ring-[#B37E74]/10"
                        placeholder="Jana Nováková"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-[#6E5F56]">Telefón</span>
                      <input
                        required
                        className="w-full rounded-2xl border border-[#E0D2C5] bg-white px-4 py-3 text-[#4E4139] outline-none transition focus:border-[#B37E74] focus:ring-4 focus:ring-[#B37E74]/10"
                        placeholder="+421 900 123 456"
                      />
                    </label>
                    <label className="block md:col-span-2">
                      <span className="mb-2 block text-sm font-semibold text-[#6E5F56]">E-mail</span>
                      <input
                        required
                        type="email"
                        className="w-full rounded-2xl border border-[#E0D2C5] bg-white px-4 py-3 text-[#4E4139] outline-none transition focus:border-[#B37E74] focus:ring-4 focus:ring-[#B37E74]/10"
                        placeholder="jana@email.sk"
                      />
                    </label>
                    <label className="block md:col-span-2">
                      <span className="mb-2 block text-sm font-semibold text-[#6E5F56]">Poznámka</span>
                      <textarea
                        className="min-h-24 w-full rounded-2xl border border-[#E0D2C5] bg-white px-4 py-3 text-[#4E4139] outline-none transition focus:border-[#B37E74] focus:ring-4 focus:ring-[#B37E74]/10"
                        placeholder="Napr. citlivé ďasná, strojček, tehotenstvo..."
                      />
                    </label>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-[#E5D8CB] bg-[#F7F1EA] p-5">
                  <h4 className="font-serif text-2xl text-[#A86F67]">Súhrn rezervácie</h4>
                  <div className="mt-4 space-y-3 text-sm text-[#6E5F56]">
                    <div className="flex justify-between gap-4">
                      <span>Služba</span>
                      <strong className="text-right text-[#4E4139]">{activeService.name}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Trvanie</span>
                      <strong className="text-[#4E4139]">{activeService.duration}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Termín</span>
                      <strong className="text-[#4E4139]">{selectedDate}. máj o {selectedTime}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Cena</span>
                      <strong className="text-[#4E4139]">{activeService.price}</strong>
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
                    Súhlasím so spracovaním osobných údajov za účelom vybavenia rezervácie a beriem na vedomie
                    storno podmienky.
                  </span>
                </label>

                <button
                  type="submit"
                  className="w-full rounded-full bg-[#B37E74] px-7 py-4 text-center font-semibold text-white shadow-lg shadow-[#B37E74]/20 transition hover:-translate-y-0.5 hover:bg-[#9F6F66]"
                >
                  Potvrdiť rezerváciu
                </button>

                {sent ? (
                  <div className="rounded-2xl border border-[#C9D9BE] bg-[#F0F6EA] p-4 text-sm font-medium text-[#526C45]">
                    Ďakujeme, vaša rezervácia bola pripravená na odoslanie. Ďalší krok je napojiť formulár na databázu
                    alebo e-mail, aby sa rezervácie reálne ukladali.
                  </div>
                ) : null}
              </div>
            </form>
          </div>
        </section>

        <section id="cennik" className="border-y border-[#E5D8CB] bg-[#FBF8F3]">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-2 lg:items-start lg:py-20">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#B37E74]">Cenník</p>
              <h2 className="mt-4 font-serif text-4xl text-[#4E4139] md:text-5xl">
                Transparentné ceny bez prekvapení
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-[#786960]">
                Cenník je pripravený na úpravu podľa vašich finálnych služieb a cien.
              </p>
            </div>

            <div className="overflow-hidden rounded-[1.75rem] border border-[#E5D8CB] bg-white shadow-sm">
              {prices.map((item, index) => {
                const borderClass = index !== prices.length - 1 ? "border-b border-[#E5D8CB]" : "";

                return (
                  <div key={item.name} className={`flex items-center justify-between px-6 py-5 ${borderClass}`}>
                    <span className="text-lg text-[#65574F]">{item.name}</span>
                    <span className="font-serif text-2xl text-[#A86F67]">{item.price}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="kontakt" className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#B37E74]">Kontakt a mapa</p>
              <h2 className="mt-4 font-serif text-4xl text-[#4E4139] md:text-5xl">
                Kde nás nájdete
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-[#786960]">
                Prevádzku Dientes nájdete jednoducho podľa mapy.              </p>

              <div className="mt-8 space-y-4">
                <div className="rounded-[1.5rem] border border-[#E5D8CB] bg-[#FBF8F3] p-5">
                  <div className="text-sm font-semibold uppercase tracking-[0.16em] text-[#B37E74]">Adresa prevádzky</div>
                  <div className="mt-2 font-serif text-2xl text-[#4E4139]">Dientes dentálna hygiena</div>
                  <p className="mt-2 text-[#7B6D64]">Pribinova 788/8, 040 01 Košice</p>
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
                <h3 className="font-serif text-3xl text-[#A86F67]">Mapa prevádzky</h3>
                <p className="mt-1 text-[#88766A]">Kliknutím na mapu si viete pozrieť polohu alebo naplánovať trasu.</p>
              </div>

              <iframe
                title="Mapa prevádzky Dientes"
                src={mapSrc}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-[420px] w-full border-0"
                allowFullScreen
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#E5D8CB] bg-[#6F5A4D] text-[#F5EDE4]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row">
          <div>
            <div className="font-serif text-2xl tracking-[0.14em]">DIENTES</div>
            <div className="text-sm italic text-[#E0CCB7]">dentálna hygiena</div>
          </div>
          <div className="text-sm text-[#EBDDCE]">© 2026 Dientes • Elegantná dentálna hygiena</div>
        </div>
      </footer>
    </div>
  );
}
