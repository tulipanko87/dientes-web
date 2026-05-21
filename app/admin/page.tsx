"use client";

import { useEffect, useMemo, useState } from "react";

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

const STORAGE_KEY = "dientesReservations";

export default function AdminDashboard() {
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>([]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as Reservation[];
    setReservations(stored);
  }, [isLoggedIn]);

  const stats = useMemo(() => {
    return {
      all: reservations.length,
      new: reservations.filter((item) => item.status === "Nová").length,
      confirmed: reservations.filter((item) => item.status === "Potvrdená").length,
      cancelled: reservations.filter((item) => item.status === "Zrušená").length
    };
  }, [reservations]);

  const saveReservations = (next: Reservation[]) => {
    setReservations(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const updateStatus = (id: string, status: Reservation["status"]) => {
    saveReservations(reservations.map((item) => (item.id === id ? { ...item, status } : item)));
  };

  const deleteReservation = (id: string) => {
    if (!confirm("Naozaj chcete vymazať túto rezerváciu?")) return;
    saveReservations(reservations.filter((item) => item.id !== id));
  };

  const exportCsv = () => {
    const header = ["Meno", "Telefón", "Email", "Služba", "Dátum", "Čas", "Status", "Poznámka"];
    const rows = reservations.map((r) => [r.name, r.phone, r.email, r.service, r.date, r.time, r.status, r.note]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dientes-rezervacie.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-[#F7F1EA] px-6 py-16 text-[#5F5148]">
        <div className="mx-auto max-w-md rounded-[2rem] border border-[#E2D4C7] bg-[#FBF8F3] p-8 shadow-[0_20px_60px_rgba(130,100,85,0.12)]">
          <a href="/" className="text-sm font-semibold text-[#B37E74]">← Späť na web</a>
          <h1 className="mt-6 font-serif text-4xl text-[#A86F67]">Admin dashboard</h1>
          <p className="mt-3 text-[#786960]">Prihlásenie do jednoduchej administrácie rezervácií.</p>
          <form
            className="mt-8 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (password === "dientes2026") setIsLoggedIn(true);
              else alert("Nesprávne heslo. Predvolené heslo je dientes2026.");
            }}
          >
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Heslo"
              className="w-full rounded-2xl border border-[#E0D2C5] bg-white px-4 py-3 outline-none focus:border-[#B37E74]"
            />
            <button className="w-full rounded-full bg-[#B37E74] px-6 py-4 font-semibold text-white hover:bg-[#9F6F66]">Prihlásiť sa</button>
          </form>
          <p className="mt-4 text-xs text-[#8B796D]">Demo heslo: <strong>dientes2026</strong></p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F1EA] px-6 py-10 text-[#5F5148]">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <a href="/" className="text-sm font-semibold text-[#B37E74]">← Späť na web</a>
            <h1 className="mt-3 font-serif text-5xl text-[#A86F67]">Admin dashboard</h1>
            <p className="mt-2 text-[#786960]">Prehľad rezervácií z webového formulára.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={exportCsv} className="rounded-full border border-[#DCCBBB] bg-[#FBF8F3] px-5 py-3 font-semibold text-[#8A7265] hover:bg-[#F4ECE4]">Export CSV</button>
            <button onClick={() => setIsLoggedIn(false)} className="rounded-full bg-[#6F5A4D] px-5 py-3 font-semibold text-white hover:bg-[#5C4A40]">Odhlásiť</button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Všetky", stats.all],
            ["Nové", stats.new],
            ["Potvrdené", stats.confirmed],
            ["Zrušené", stats.cancelled]
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-[1.5rem] border border-[#E5D8CB] bg-[#FBF8F3] p-5 shadow-sm">
              <div className="text-sm uppercase tracking-[0.16em] text-[#B37E74]">{label}</div>
              <div className="mt-2 font-serif text-4xl text-[#4E4139]">{value}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 overflow-hidden rounded-[2rem] border border-[#E2D4C7] bg-[#FBF8F3] shadow-[0_20px_60px_rgba(130,100,85,0.12)]">
          <div className="border-b border-[#E5D8CB] px-6 py-5">
            <h2 className="font-serif text-3xl text-[#A86F67]">Rezervácie</h2>
          </div>

          {reservations.length === 0 ? (
            <div className="p-8 text-[#786960]">Zatiaľ nie sú uložené žiadne rezervácie. Vytvorte testovaciu rezerváciu na hlavnej stránke.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="bg-[#F7F1EA] text-[#6E5F56]">
                  <tr>
                    <th className="px-5 py-4">Klient</th>
                    <th className="px-5 py-4">Kontakt</th>
                    <th className="px-5 py-4">Služba</th>
                    <th className="px-5 py-4">Termín</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Akcie</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((r) => (
                    <tr key={r.id} className="border-t border-[#E5D8CB] align-top">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-[#4E4139]">{r.name}</div>
                        <div className="mt-1 text-xs text-[#8B796D]">{new Date(r.createdAt).toLocaleString("sk-SK")}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div>{r.phone}</div>
                        <div className="text-[#8B796D]">{r.email}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold">{r.service}</div>
                        <div className="text-[#8B796D]">{r.duration} • {r.price}</div>
                        {r.note ? <div className="mt-2 max-w-xs text-[#8B796D]">Pozn.: {r.note}</div> : null}
                      </td>
                      <td className="px-5 py-4 font-semibold">{r.date} o {r.time}</td>
                      <td className="px-5 py-4">
                        <select value={r.status} onChange={(event) => updateStatus(r.id, event.target.value as Reservation["status"])} className="rounded-full border border-[#DCCBBB] bg-white px-3 py-2">
                          <option>Nová</option>
                          <option>Potvrdená</option>
                          <option>Zrušená</option>
                        </select>
                      </td>
                      <td className="px-5 py-4">
                        <button onClick={() => deleteReservation(r.id)} className="rounded-full bg-[#B37E74] px-4 py-2 font-semibold text-white hover:bg-[#9F6F66]">Vymazať</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
