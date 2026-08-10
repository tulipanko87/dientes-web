import { defineConfig } from "tinacms";

const branch = process.env.NEXT_PUBLIC_TINA_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || process.env.HEAD || "main";

const imageField = (name: string, label: string) => ({ type: "image" as const, name, label });

export default defineConfig({
  branch,
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID,
  token: process.env.TINA_TOKEN,
  build: { outputFolder: "admin", publicFolder: "public" },
  media: { tina: { mediaRoot: "uploads", publicFolder: "public" } },
  schema: {
    collections: [
      {
        name: "home",
        label: "Domovská stránka",
        path: "content",
        format: "json",
        match: { include: "home" },
        fields: [
          { type: "string", name: "businessName", label: "Názov prevádzky" },
          { type: "string", name: "businessAddress", label: "Adresa prevádzky" },
          { type: "string", name: "businessPhone", label: "Telefón prevádzky" },
          { type: "string", name: "businessEmail", label: "E-mail prevádzky" },
          imageField("logoImage", "Logo / obrázok v hlavičke"),
          {
            type: "object", name: "header", label: "Hlavička", fields: [
              { type: "string", name: "brandTitle", label: "Názov v hlavičke" },
              { type: "string", name: "brandSubtitle", label: "Podnadpis v hlavičke" }
            ]
          },
          {
            type: "object",
            name: "displaySettings",
            label: "Zobrazenie sekcií",
            fields: [
              { type: "boolean", name: "showGallery", label: "Zobraziť galériu" },
              { type: "boolean", name: "showPriceSection", label: "Zobraziť cenník" }
            ]
          },
          {
            type: "object", name: "hero", label: "Úvodná sekcia", fields: [
              { type: "string", name: "badge", label: "Malý text v bubline" },
              { type: "string", name: "title", label: "Hlavný nadpis" },
              { type: "string", name: "subtitle", label: "Podnadpis" },
              { type: "string", name: "description", label: "Popis", ui: { component: "textarea" } },
              imageField("image", "Hlavný obrázok vpravo (záloha)"),
              { type: "string", name: "imageAlt", label: "Popis obrázka pre Google" },
              { type: "number", name: "sliderIntervalSeconds", label: "Čas prepínania obrázkov v sekundách" },
              {
                type: "object", name: "images", label: "Obrázky v úvodnom slajderi", list: true,
                ui: { itemProps: (item: { alt?: string; image?: string }) => ({ label: item?.alt || item?.image || "Obrázok" }) },
                fields: [
                  imageField("image", "Obrázok"),
                  { type: "string", name: "alt", label: "Popis obrázka pre Google" }
                ]
              },
              {
                type: "object", name: "stats", label: "Štatistiky pod obrázkom", list: true,
                ui: { itemProps: (item: { title?: string }) => ({ label: item?.title || "Štatistika" }) },
                fields: [
                  { type: "string", name: "title", label: "Nadpis" },
                  { type: "string", name: "subtitle", label: "Popis" }
                ]
              }
            ]
          },
          {
            type: "object", name: "servicesSection", label: "Sekcia služby", fields: [
              { type: "string", name: "label", label: "Malý nadpis" },
              { type: "string", name: "title", label: "Nadpis" },
              { type: "string", name: "description", label: "Popis", ui: { component: "textarea" } }
            ]
          },
          {
            type: "object", name: "benefits", label: "Karty služieb / benefitov", list: true,
            ui: { itemProps: (item: { title?: string }) => ({ label: item?.title || "Karta" }) },
            fields: [
              { type: "string", name: "title", label: "Nadpis" },
              { type: "string", name: "text", label: "Text", ui: { component: "textarea" } },
              imageField("image", "Obrázok karty (voliteľný)"),
              { type: "string", name: "imageAlt", label: "Popis obrázka" }
            ]
          },
          {
            type: "object", name: "gallery", label: "Galéria fotiek", fields: [
              { type: "string", name: "label", label: "Malý nadpis" },
              { type: "string", name: "title", label: "Nadpis" },
              { type: "string", name: "description", label: "Popis", ui: { component: "textarea" } },
              {
                type: "object", name: "items", label: "Fotky", list: true,
                ui: { itemProps: (item: { caption?: string }) => ({ label: item?.caption || "Fotka" }) },
                fields: [
                  imageField("image", "Fotka"),
                  { type: "string", name: "alt", label: "Popis fotky pre Google" },
                  { type: "string", name: "caption", label: "Krátky popis pod fotkou" }
                ]
              }
            ]
          },
          { type: "string", name: "steps", label: "Priebeh ošetrenia", list: true },
          {
            type: "object", name: "priceSection", label: "Cenník", fields: [
              { type: "string", name: "label", label: "Malý nadpis" },
              { type: "string", name: "title", label: "Nadpis" },
              { type: "string", name: "description", label: "Popis", ui: { component: "textarea" } },
              {
                type: "object", name: "items", label: "Položky cenníka", list: true,
                ui: { itemProps: (item: { name?: string }) => ({ label: item?.name || "Položka cenníka" }) },
                fields: [
                  { type: "string", name: "name", label: "Názov služby" },
                  { type: "string", name: "price", label: "Cena" }
                ]
              }
            ]
          },
          {
            type: "object", name: "bookingServices", label: "Služby v rezervácii", list: true,
            ui: { itemProps: (item: { name?: string }) => ({ label: item?.name || "Služba" }) },
            fields: [
              { type: "string", name: "id", label: "ID bez diakritiky" },
              { type: "string", name: "name", label: "Názov služby" },
              { type: "string", name: "duration", label: "Trvanie" },
              { type: "string", name: "price", label: "Cena" },
              { type: "string", name: "description", label: "Popis", ui: { component: "textarea" } }
            ]
          },

          {
            type: "object",
            name: "insuranceSection",
            label: "Príspevok zdravotných poisťovní",
            fields: [
              { type: "boolean", name: "enabled", label: "Zobraziť informáciu o poisťovniach" },
              { type: "string", name: "title", label: "Nadpis" },
              { type: "string", name: "description", label: "Text", ui: { component: "textarea" } },
              { type: "string", name: "doveraFrequency", label: "Dôvera – frekvencia príspevku" },
              { type: "string", name: "unionFrequency", label: "Union – frekvencia príspevku" },
              { type: "string", name: "helpText", label: "Doplňujúci text", ui: { component: "textarea" } }
            ]
          },

          {
            type: "object",
            name: "bookingSettings",
            label: "Otváracie hodiny a dostupnosť rezervácií",
            fields: [
              { type: "number", name: "daysAhead", label: "Koľko dní dopredu povoliť rezervácie" },
              { type: "number", name: "slotMinutes", label: "Dĺžka jedného termínu v minútach" },
              {
                type: "object",
                name: "weeklySchedule",
                label: "Bežné otváracie hodiny",
                list: true,
                ui: {
                  itemProps: (item: { day?: number; enabled?: boolean; startTime?: string; endTime?: string }) => {
                    const days: Record<number, string> = {
                      0: "Nedeľa",
                      1: "Pondelok",
                      2: "Utorok",
                      3: "Streda",
                      4: "Štvrtok",
                      5: "Piatok",
                      6: "Sobota",
                    };
                    const label = days[Number(item?.day)] || "Deň";
                    const status = item?.enabled ? `${item?.startTime || "?"}–${item?.endTime || "?"}` : "zatvorené";
                    return { label: `${label} (${status})` };
                  },
                },
                fields: [
                  {
                    type: "number",
                    name: "day",
                    label: "Deň v týždni (0=Nedeľa, 1=Pondelok, 2=Utorok, 3=Streda, 4=Štvrtok, 5=Piatok, 6=Sobota)",
                  },
                  { type: "boolean", name: "enabled", label: "Tento deň prijímať rezervácie" },
                  { type: "string", name: "startTime", label: "Začiatok objednávania (napr. 08:00)" },
                  { type: "string", name: "endTime", label: "Koniec objednávania (napr. 16:00)" },
                ],
              },
              {
                type: "object",
                name: "extraOpenDates",
                label: "Mimoriadne otvorené dni",
                list: true,
                ui: {
                  itemProps: (item: { date?: string; startTime?: string; endTime?: string }) => ({
                    label: `${item?.date ? new Date(item.date).toLocaleDateString("sk-SK") : "Vyberte dátum"} ${item?.startTime || ""}${item?.endTime ? `–${item.endTime}` : ""}`,
                  }),
                },
                fields: [
                  {
                    type: "datetime",
                    name: "date",
                    label: "Dátum",
                    ui: { dateFormat: "DD.MM.YYYY" },
                  },
                  { type: "string", name: "startTime", label: "Otvorené od (napr. 08:00)" },
                  { type: "string", name: "endTime", label: "Otvorené do (napr. 14:00)" },
                ],
              },
              {
                type: "object",
                name: "closedDateRanges",
                label: "Dovolenka / zatvorené obdobia",
                list: true,
                ui: {
                  itemProps: (item: { startDate?: string; endDate?: string; note?: string }) => ({
                    label: `${item?.startDate ? new Date(item.startDate).toLocaleDateString("sk-SK") : "Od"} – ${item?.endDate ? new Date(item.endDate).toLocaleDateString("sk-SK") : "Do"}${item?.note ? ` · ${item.note}` : ""}`,
                  }),
                },
                fields: [
                  {
                    type: "datetime",
                    name: "startDate",
                    label: "Od dátumu",
                    ui: { dateFormat: "DD.MM.YYYY" },
                  },
                  {
                    type: "datetime",
                    name: "endDate",
                    label: "Do dátumu",
                    ui: { dateFormat: "DD.MM.YYYY" },
                  },
                  {
                    type: "string",
                    name: "note",
                    label: "Poznámka (voliteľné, napr. Dovolenka)",
                  },
                ],
              },
            ],
          },
          {
            type: "object", name: "contactSection", label: "Kontakt a mapa", fields: [
              { type: "string", name: "label", label: "Malý nadpis" },
              { type: "string", name: "title", label: "Nadpis" },
              { type: "string", name: "description", label: "Popis", ui: { component: "textarea" } },
              { type: "string", name: "mapTitle", label: "Nadpis mapy" },
              { type: "string", name: "mapDescription", label: "Popis mapy", ui: { component: "textarea" } }
            ]
          }
        ]
      }
    ]
  }
});
