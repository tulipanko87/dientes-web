// tina/config.ts
import { defineConfig } from "tinacms";
var branch = process.env.NEXT_PUBLIC_TINA_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || process.env.HEAD || "main";
var imageField = (name, label) => ({ type: "image", name, label });
var config_default = defineConfig({
  branch,
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID,
  token: process.env.TINA_TOKEN,
  build: { outputFolder: "admin", publicFolder: "public" },
  media: { tina: { mediaRoot: "uploads", publicFolder: "public" } },
  schema: {
    collections: [
      {
        name: "home",
        label: "Domovsk\xE1 str\xE1nka",
        path: "content",
        format: "json",
        match: { include: "home" },
        fields: [
          { type: "string", name: "businessName", label: "N\xE1zov prev\xE1dzky" },
          { type: "string", name: "businessAddress", label: "Adresa prev\xE1dzky" },
          imageField("logoImage", "Logo / obr\xE1zok v hlavi\u010Dke"),
          {
            type: "object",
            name: "header",
            label: "Hlavi\u010Dka",
            fields: [
              { type: "string", name: "brandTitle", label: "N\xE1zov v hlavi\u010Dke" },
              { type: "string", name: "brandSubtitle", label: "Podnadpis v hlavi\u010Dke" }
            ]
          },
          {
            type: "object",
            name: "hero",
            label: "\xDAvodn\xE1 sekcia",
            fields: [
              { type: "string", name: "badge", label: "Mal\xFD text v bubline" },
              { type: "string", name: "title", label: "Hlavn\xFD nadpis" },
              { type: "string", name: "subtitle", label: "Podnadpis" },
              { type: "string", name: "description", label: "Popis", ui: { component: "textarea" } },
              imageField("image", "Hlavn\xFD obr\xE1zok vpravo (z\xE1loha)"),
              { type: "string", name: "imageAlt", label: "Popis obr\xE1zka pre Google" },
              { type: "number", name: "sliderIntervalSeconds", label: "\u010Cas prep\xEDnania obr\xE1zkov v sekund\xE1ch" },
              {
                type: "object",
                name: "images",
                label: "Obr\xE1zky v \xFAvodnom slajderi",
                list: true,
                ui: { itemProps: (item) => ({ label: item?.alt || item?.image || "Obr\xE1zok" }) },
                fields: [
                  imageField("image", "Obr\xE1zok"),
                  { type: "string", name: "alt", label: "Popis obr\xE1zka pre Google" }
                ]
              },
              {
                type: "object",
                name: "stats",
                label: "\u0160tatistiky pod obr\xE1zkom",
                list: true,
                ui: { itemProps: (item) => ({ label: item?.title || "\u0160tatistika" }) },
                fields: [
                  { type: "string", name: "title", label: "Nadpis" },
                  { type: "string", name: "subtitle", label: "Popis" }
                ]
              }
            ]
          },
          {
            type: "object",
            name: "servicesSection",
            label: "Sekcia slu\u017Eby",
            fields: [
              { type: "string", name: "label", label: "Mal\xFD nadpis" },
              { type: "string", name: "title", label: "Nadpis" },
              { type: "string", name: "description", label: "Popis", ui: { component: "textarea" } }
            ]
          },
          {
            type: "object",
            name: "benefits",
            label: "Karty slu\u017Eieb / benefitov",
            list: true,
            ui: { itemProps: (item) => ({ label: item?.title || "Karta" }) },
            fields: [
              { type: "string", name: "title", label: "Nadpis" },
              { type: "string", name: "text", label: "Text", ui: { component: "textarea" } },
              imageField("image", "Obr\xE1zok karty (volite\u013En\xFD)"),
              { type: "string", name: "imageAlt", label: "Popis obr\xE1zka" }
            ]
          },
          {
            type: "object",
            name: "gallery",
            label: "Gal\xE9ria fotiek",
            fields: [
              { type: "string", name: "label", label: "Mal\xFD nadpis" },
              { type: "string", name: "title", label: "Nadpis" },
              { type: "string", name: "description", label: "Popis", ui: { component: "textarea" } },
              {
                type: "object",
                name: "items",
                label: "Fotky",
                list: true,
                ui: { itemProps: (item) => ({ label: item?.caption || "Fotka" }) },
                fields: [
                  imageField("image", "Fotka"),
                  { type: "string", name: "alt", label: "Popis fotky pre Google" },
                  { type: "string", name: "caption", label: "Kr\xE1tky popis pod fotkou" }
                ]
              }
            ]
          },
          { type: "string", name: "steps", label: "Priebeh o\u0161etrenia", list: true },
          {
            type: "object",
            name: "priceSection",
            label: "Cenn\xEDk",
            fields: [
              { type: "string", name: "label", label: "Mal\xFD nadpis" },
              { type: "string", name: "title", label: "Nadpis" },
              { type: "string", name: "description", label: "Popis", ui: { component: "textarea" } },
              {
                type: "object",
                name: "items",
                label: "Polo\u017Eky cenn\xEDka",
                list: true,
                ui: { itemProps: (item) => ({ label: item?.name || "Polo\u017Eka cenn\xEDka" }) },
                fields: [
                  { type: "string", name: "name", label: "N\xE1zov slu\u017Eby" },
                  { type: "string", name: "price", label: "Cena" }
                ]
              }
            ]
          },
          {
            type: "object",
            name: "bookingServices",
            label: "Slu\u017Eby v rezerv\xE1cii",
            list: true,
            ui: { itemProps: (item) => ({ label: item?.name || "Slu\u017Eba" }) },
            fields: [
              { type: "string", name: "id", label: "ID bez diakritiky" },
              { type: "string", name: "name", label: "N\xE1zov slu\u017Eby" },
              { type: "string", name: "duration", label: "Trvanie" },
              { type: "string", name: "price", label: "Cena" },
              { type: "string", name: "description", label: "Popis", ui: { component: "textarea" } }
            ]
          },
          {
            type: "object",
            name: "bookingSettings",
            label: "Nastavenia rezerv\xE1ci\xED",
            fields: [
              { type: "number", name: "daysAhead", label: "Ko\u013Eko dn\xED dopredu povoli\u0165 rezerv\xE1cie" },
              { type: "number", name: "slotMinutes", label: "D\u013A\u017Eka jedn\xE9ho term\xEDnu v min\xFAtach" },
              {
                type: "object",
                name: "weeklySchedule",
                label: "T\xFD\u017Edenn\xFD rozvrh objedn\xE1vania",
                list: true,
                ui: {
                  itemProps: (item) => {
                    const days = {
                      0: "Nede\u013Ea",
                      1: "Pondelok",
                      2: "Utorok",
                      3: "Streda",
                      4: "\u0160tvrtok",
                      5: "Piatok",
                      6: "Sobota"
                    };
                    const label = days[Number(item?.day)] || "De\u0148";
                    const status = item?.enabled ? `${item?.startTime || "?"}\u2013${item?.endTime || "?"}` : "zatvoren\xE9";
                    return { label: `${label} (${status})` };
                  }
                },
                fields: [
                  {
                    type: "number",
                    name: "day",
                    label: "De\u0148 v t\xFD\u017Edni (0=Nede\u013Ea, 1=Pondelok, 2=Utorok, 3=Streda, 4=\u0160tvrtok, 5=Piatok, 6=Sobota)"
                  },
                  { type: "boolean", name: "enabled", label: "Tento de\u0148 prij\xEDma\u0165 rezerv\xE1cie" },
                  { type: "string", name: "startTime", label: "Za\u010Diatok objedn\xE1vania (napr. 08:00)" },
                  { type: "string", name: "endTime", label: "Koniec objedn\xE1vania (napr. 16:00)" }
                ]
              },
              {
                type: "object",
                name: "extraOpenDates",
                label: "V\xFDnimo\u010Dne otvoren\xE9 d\xE1tumy",
                list: true,
                ui: { itemProps: (item) => ({ label: `${item?.date || "D\xE1tum"} ${item?.startTime || ""}\u2013${item?.endTime || ""}` }) },
                fields: [
                  { type: "string", name: "date", label: "D\xE1tum vo form\xE1te RRRR-MM-DD" },
                  { type: "string", name: "startTime", label: "Od" },
                  { type: "string", name: "endTime", label: "Do" }
                ]
              },
              { type: "string", name: "closedDates", label: "Zatvoren\xE9 d\xE1tumy / dovolenka (RRRR-MM-DD)", list: true }
            ]
          },
          {
            type: "object",
            name: "contactSection",
            label: "Kontakt a mapa",
            fields: [
              { type: "string", name: "label", label: "Mal\xFD nadpis" },
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
export {
  config_default as default
};
