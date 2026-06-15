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
          imageField("logoImage", "Logo / obrázok v hlavičke"),
          {
            type: "object", name: "header", label: "Hlavička", fields: [
              { type: "string", name: "brandTitle", label: "Názov v hlavičke" },
              { type: "string", name: "brandSubtitle", label: "Podnadpis v hlavičke" }
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
            name: "bookingSettings",
            label: "Nastavenia rezervácií",
            fields: [
              { type: "number", name: "daysAhead", label: "Koľko dní dopredu povoliť rezervácie" },
              { type: "number", name: "slotMinutes", label: "Dĺžka jedného termínu v minútach" },
              { type: "string", name: "startTime", label: "Začiatok objednávania, napr. 08:00" },
              { type: "string", name: "endTime", label: "Koniec objednávania, napr. 16:00" },
              {
                type: "number",
                name: "allowedWeekdays",
                label: "Povolené dni v týždni",
                list: true,
                description: "0 = nedeľa, 1 = pondelok, 2 = utorok, 3 = streda, 4 = štvrtok, 5 = piatok, 6 = sobota"
              },
              {
                type: "string",
                name: "extraOpenDates",
                label: "Výnimočne otvorené dátumy",
                list: true,
                description: "Formát dátumu: RRRR-MM-DD, napr. 2026-07-11"
              },
              {
                type: "string",
                name: "closedDates",
                label: "Zatvorené dátumy / dovolenka",
                list: true,
                description: "Formát dátumu: RRRR-MM-DD, napr. 2026-08-04"
              }
            ]
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
