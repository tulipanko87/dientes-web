// tina/config.ts
import { defineConfig } from "tinacms";

// tina/icon-picker.tsx
import { useMemo, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
var ICONS = [
  ["headphones", "Sl\xFAchadl\xE1"],
  ["dentistry", "Zub"],
  ["health_and_safety", "Ochrana zdravia"],
  ["verified", "Overen\xE9"],
  ["favorite", "Srdce"],
  ["favorite_border", "Srdce \u2013 obrys"],
  ["auto_awesome", "Iskry"],
  ["workspace_premium", "Pr\xE9miov\xE9"],
  ["stars", "Hviezdi\u010Dky"],
  ["star", "Hviezda"],
  ["child_care", "Deti"],
  ["face", "Tv\xE1r"],
  ["family_restroom", "Rodina"],
  ["autorenew", "Opakovanie"],
  ["refresh", "Obnovi\u0165"],
  ["home", "Domov"],
  ["visibility", "Vy\u0161etrenie / oko"],
  ["school", "In\u0161trukt\xE1\u017E"],
  ["straighten", "Meranie"],
  ["air", "Pr\xFAdenie vzduchu"],
  ["cleaning_services", "\u010Cistenie"],
  ["water_drop", "Kvapka"],
  ["spa", "Relax"],
  ["medical_services", "Zdravotn\xE1 starostlivos\u0165"],
  ["vaccines", "O\u0161etrenie"],
  ["shield", "\u0160t\xEDt"],
  ["shield_with_heart", "\u0160t\xEDt so srdcom"],
  ["handshake", "Dohoda"],
  ["sentiment_satisfied", "\xDAsmev"],
  ["mood", "Spokojnos\u0165"],
  ["self_improvement", "Relax\xE1cia"],
  ["light_mode", "Slnko"],
  ["sunny", "Slne\u010Dno"],
  ["schedule", "\u010Cas"],
  ["calendar_month", "Kalend\xE1r"],
  ["event_available", "Vo\u013En\xFD term\xEDn"],
  ["event_busy", "Obsaden\xFD term\xEDn"],
  ["location_on", "Poloha"],
  ["call", "Telef\xF3n"],
  ["mail", "E-mail"],
  ["info", "Inform\xE1cia"],
  ["check_circle", "Potvrdenie"],
  ["task_alt", "Splnen\xE9"],
  ["thumb_up", "Palec hore"],
  ["support_agent", "Podpora"],
  ["volunteer_activism", "Starostlivos\u0165"],
  ["diamond", "Diamant"],
  ["brush", "Kefka"],
  ["flare", "\u017Diara"],
  ["bolt", "Energia"],
  ["local_hospital", "Ambulancia"],
  ["groups", "\u013Dudia"],
  ["eco", "Pr\xEDroda"],
  ["science", "Veda"]
];
var iconStyle = {
  fontFamily: "Material Symbols Outlined",
  fontWeight: "normal",
  fontStyle: "normal",
  fontSize: 27,
  lineHeight: 1,
  letterSpacing: "normal",
  textTransform: "none",
  display: "inline-block",
  whiteSpace: "nowrap",
  direction: "ltr",
  fontFeatureSettings: "liga",
  WebkitFontSmoothing: "antialiased"
};
function IconPicker({ field, input }) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const value = typeof input?.value === "string" ? input.value : "";
  const shown = useMemo(() => ICONS.filter(
    ([name, label]) => `${name} ${label}`.toLocaleLowerCase("sk").includes(query.toLocaleLowerCase("sk"))
  ), [query]);
  const setValue = (next) => input?.onChange?.(next);
  return jsxs("div", { style: { marginBottom: 18, fontFamily: "inherit" }, children: [
    jsx("link", { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,400,0,0" }),
    jsx("label", { style: { display: "block", fontWeight: 600, fontSize: 14, marginBottom: 8 }, htmlFor: input?.name, children: field?.label || "Ikona" }),
    jsxs("div", { style: { display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }, children: [
      jsx("span", { "aria-hidden": "true", style: { ...iconStyle, fontSize: 36, color: "#0d9488", minWidth: 46, textAlign: "center" }, children: value || "help" }),
      jsx(
        "input",
        {
          id: input?.name,
          name: input?.name,
          value,
          onBlur: input?.onBlur,
          onChange: (e) => setValue(e.target.value.trim().replace(/\s+/g, "_")),
          placeholder: "Napr. headphones alebo dentistry",
          style: { flex: 1, minWidth: 0, padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 7, background: "transparent", color: "inherit" }
        }
      )
    ] }),
    jsxs("div", { style: { display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 10 }, children: [
      jsx(
        "button",
        {
          type: "button",
          onClick: () => setExpanded(!expanded),
          style: { border: "1px solid #94a3b8", padding: "7px 11px", borderRadius: 7, cursor: "pointer", background: "transparent", color: "inherit" },
          children: expanded ? "Skry\u0165 v\xFDber ikon" : "Vybra\u0165 ikonu z gal\xE9rie"
        }
      ),
      jsx(
        "a",
        {
          href: "https://fonts.google.com/icons",
          target: "_blank",
          rel: "noopener noreferrer",
          style: { color: "#0d9488", textDecoration: "underline", fontSize: 13 },
          children: "Katal\xF3g v\u0161etk\xFDch ikon \u2197"
        }
      )
    ] }),
    expanded && jsxs("div", { style: { padding: 10, border: "1px solid #cbd5e1", borderRadius: 9 }, children: [
      jsx(
        "input",
        {
          "aria-label": "H\u013Eada\u0165 ikonu",
          value: query,
          onChange: (e) => setQuery(e.target.value),
          placeholder: "H\u013Eada\u0165 po slovensky alebo pod\u013Ea n\xE1zvu\u2026",
          style: { width: "100%", padding: "9px 10px", border: "1px solid #cbd5e1", borderRadius: 6, marginBottom: 10, boxSizing: "border-box", background: "transparent", color: "inherit" }
        }
      ),
      jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 7, maxHeight: 295, overflowY: "auto" }, children: shown.map(([name, label]) => jsxs(
        "button",
        {
          type: "button",
          onClick: () => setValue(name),
          title: name,
          "aria-pressed": value === name,
          style: { display: "flex", alignItems: "center", flexDirection: "column", gap: 5, padding: 9, borderRadius: 8, cursor: "pointer", color: "inherit", background: value === name ? "rgba(13,148,136,.13)" : "transparent", border: value === name ? "2px solid #0d9488" : "1px solid #cbd5e1" },
          children: [
            jsx("span", { "aria-hidden": "true", style: iconStyle, children: name }),
            jsx("span", { style: { fontSize: 11, textAlign: "center" }, children: label }),
            jsx("span", { style: { fontSize: 10, color: "#64748b", overflowWrap: "anywhere" }, children: name })
          ]
        },
        name
      )) }),
      shown.length === 0 && jsx("p", { style: { fontSize: 13 }, children: "Nena\u0161la sa ikona. Sk\xFAs in\xFD v\xFDraz alebo pou\u017Ei katal\xF3g." })
    ] }),
    jsx("p", { style: { fontSize: 12, color: "#64748b", marginTop: 7 }, children: "Ukladaj\xFA sa p\xF4vodn\xE9 n\xE1zvy Material Symbols. Vyber si z gal\xE9rie alebo zadaj n\xE1zov z katal\xF3gu." })
  ] });
}

// tina/config.ts
var branch = process.env.NEXT_PUBLIC_TINA_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || process.env.HEAD || "main";
var str = (name, label, multiline = false) => ({ type: "string", name, label, ...multiline ? { ui: { component: "textarea" } } : {} });
var img = (name, label) => ({ type: "image", name, label });
var bool = (name, label) => ({ type: "boolean", name, label });
var num = (name, label) => ({ type: "number", name, label });
var namedList = (name, label, fields, key = "title") => ({ type: "object", name, label, list: true, ui: { itemProps: (item) => ({ label: String(item?.[key] ?? "Nov\xE1 polo\u017Eka") }) }, fields });
var iconField = { type: "string", name: "icon", label: "Ikona", ui: { component: IconPicker } };
var serviceFields = [str("id", "Jedine\u010Dn\xE9 ID slu\u017Eby (nemen\xED\u0165 po vytvoren\xED)"), bool("enabled", "Zobrazova\u0165 slu\u017Ebu"), bool("bookable", "Povoli\u0165 online rezerv\xE1ciu"), iconField, str("name", "N\xE1zov slu\u017Eby"), str("description", "Podrobn\xFD popis na karte", true), str("shortDescription", "Kr\xE1tky popis v cenn\xEDku", true), num("price", "Cena v \u20AC"), num("durationMinutes", "Trvanie v min\xFAtach"), img("image", "Volite\u013En\xE1 fotografia")];
var scheduleFields = [{ type: "number", name: "day", label: "De\u0148 (0=Ne, 1=Po, 2=Ut, 3=St, 4=\u0160t, 5=Pi, 6=So)" }, bool("enabled", "Ordinujeme"), str("startTime", "Od (HH:MM)"), str("endTime", "Do (HH:MM)")];
var emailFields = [str("subject", "Predmet e-mailu"), str("title", "Nadpis"), str("introduction", "Text spr\xE1vy", true), str("button", "Text tla\u010Didla"), str("closing", "Z\xE1vere\u010Dn\xFD text", true)];
var config_default = defineConfig({
  branch,
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID,
  token: process.env.TINA_TOKEN,
  build: { outputFolder: "admin", publicFolder: "public" },
  media: { tina: { mediaRoot: "uploads", publicFolder: "public" } },
  schema: { collections: [{
    name: "home",
    label: "Dientes \u2013 spr\xE1va webu",
    path: "content",
    format: "json",
    match: { include: "home" },
    fields: [
      { type: "object", name: "intro", label: "1. \xDAvod", fields: [
        str("badge", "Mal\xFD nadpis"),
        str("description", "Hlavn\xFD \xFAvodn\xFD popis", true),
        { type: "string", name: "comfortIcon", label: "Ikona pr\xE9miov\xE9ho komfortu", ui: { component: IconPicker } },
        str("comfortTitle", "Nadpis pr\xE9miov\xE9ho komfortu"),
        str("comfortDescription", "Popis pr\xE9miov\xE9ho komfortu", true),
        str("locationBadge", "Text na obr\xE1zku"),
        num("sliderIntervalSeconds", "Interval v\xFDmeny fotografi\xED (sekundy)"),
        namedList("images", "\xDAvodn\xE9 fotografie", [img("image", "Fotografia"), str("alt", "ALT popis")], "alt"),
        namedList("stats", "\u0160tyri informa\u010Dn\xE9 karty", [str("title", "Nadpis"), str("subtitle", "Text")])
      ] },
      { type: "object", name: "services", label: "2. Slu\u017Eby \u2013 centr\xE1lna spr\xE1va", fields: [
        str("eyebrow", "Mal\xFD nadpis"),
        str("title", "Nadpis sekcie"),
        str("description", "\xDAvodn\xFD text", true),
        namedList("items", "Slu\u017Eby (cena spolo\u010Dn\xE1 pre cel\xFD web)", serviceFields, "name")
      ] },
      { type: "object", name: "process", label: "3. Priebeh o\u0161etrenia", fields: [
        str("eyebrow", "Mal\xFD nadpis"),
        str("title", "Nadpis"),
        str("description", "\xDAvodn\xFD popis", true),
        namedList("steps", "Kroky o\u0161etrenia", [str("title", "N\xE1zov"), str("description", "Popis", true), str("caption", "Spodn\xFD text"), iconField])
      ] },
      { type: "object", name: "clinic", label: "4. O ambulancii", fields: [
        img("photo", "Fotografia hygieni\u010Dky"),
        str("photoAlt", "ALT fotografie"),
        str("personName", "Meno hygieni\u010Dky"),
        str("personSubtitle", "Text pod menom"),
        str("eyebrow", "Mal\xFD nadpis"),
        str("title", "Hlavn\xFD nadpis"),
        str("description", "Popis ambulancie", true),
        { type: "object", name: "insurance", label: "Union \u2013 r\xE1m\u010Dek pri hygieni\u010Dke", fields: [bool("enabled", "Zobrazova\u0165 r\xE1m\u010Dek"), iconField, str("title", "Nadpis"), str("badge", "Odznak"), str("description", "Text", true), str("disclaimer", "Pozn\xE1mka", true), str("footerNote", "Spodn\xFD text")] }
      ] },
      { type: "object", name: "prices", label: "5. Cenn\xEDk \u2013 iba texty", fields: [bool("enabled", "Zobrazova\u0165 cenn\xEDk"), str("eyebrow", "Mal\xFD nadpis"), str("title", "Hlavn\xFD nadpis"), str("description", "\xDAvodn\xFD popis", true)] },
      { type: "object", name: "contact", label: "6. Kontakt a p\xE4ti\u010Dka", fields: [
        str("description", "Popis pod nadpisom Kontakt", true),
        str("address", "Adresa prev\xE1dzky"),
        str("phone", "Telef\xF3n"),
        str("email", "E-mail"),
        str("ico", "I\u010CO prev\xE1dzkovate\u013Ea"),
        num("latitude", "Zemepisn\xE1 \u0161\xEDrka mapy"),
        num("longitude", "Zemepisn\xE1 d\u013A\u017Eka mapy"),
        str("mapLink", "Odkaz na Google Maps"),
        namedList("weeklySchedule", "Ordina\u010Dn\xE9 hodiny (7 dn\xED)", scheduleFields, "day"),
        str("footerTitle", "N\xE1zov v p\xE4ti\u010Dke"),
        str("footerDescription", "Popis v p\xE4ti\u010Dke", true),
        str("footerAccess", "Text o dostupnosti"),
        str("footerHoursNote", "Pozn\xE1mka pod ordina\u010Dn\xFDmi hodinami"),
        { type: "object", name: "footerInsurance", label: "Union \u2013 r\xE1m\u010Dek v p\xE4ti\u010Dke", fields: [bool("enabled", "Zobrazova\u0165 r\xE1m\u010Dek"), iconField, str("title", "Nadpis"), str("description", "Text", true)] }
      ] },
      { type: "object", name: "reservations", label: "7. Rezerv\xE1cie a e-maily", fields: [
        bool("enabled", "Povoli\u0165 online rezerv\xE1cie"),
        num("daysAhead", "Po\u010Det dn\xED dopredu"),
        num("slotMinutes", "Interval pon\xFAkan\xFDch term\xEDnov v min\xFAtach"),
        num("minimumNoticeHours", "Minim\xE1lny predstih v hodin\xE1ch"),
        namedList("extraOpenDates", "Mimoriadne otvoren\xE9 dni", [{ type: "datetime", name: "date", label: "D\xE1tum", ui: { dateFormat: "DD.MM.YYYY" } }, str("startTime", "Od"), str("endTime", "Do")], "date"),
        namedList("closedDateRanges", "Dovolenky a zatvoren\xE9 obdobia", [{ type: "datetime", name: "startDate", label: "Od", ui: { dateFormat: "DD.MM.YYYY" } }, { type: "datetime", name: "endDate", label: "Do", ui: { dateFormat: "DD.MM.YYYY" } }, str("type", "Typ v\xFDnimky (vacation/closed)"), str("note", "Intern\xE1 pozn\xE1mka"), str("publicMessage", "Spr\xE1va pre pacientov"), bool("showNotice", "Zobrazi\u0165 ozn\xE1menie")], "startDate"),
        { type: "object", name: "legal", label: "GDPR a storno podmienky", fields: [str("privacyTitle", "Nadpis GDPR"), str("privacyText", "Obsah GDPR", true), str("cancellationTitle", "Nadpis storno"), str("cancellationText", "Storno podmienky", true)] },
        { type: "object", name: "emailStyle", label: "Spolo\u010Dn\xFD vzh\u013Ead e-mailov", fields: [img("logoImage", "Logo"), str("primaryColor", "Farba tla\u010Didla (#RRGGBB)"), str("header", "Hlavi\u010Dka"), str("footer", "P\xE4ti\u010Dka"), str("signature", "Podpis")] },
        { type: "object", name: "emailTemplates", label: "Texty e-mailov", fields: [{ type: "object", name: "request", label: "\u017Diados\u0165 o potvrdenie", fields: emailFields }, { type: "object", name: "confirmed", label: "Potvrden\xE1 rezerv\xE1cia", fields: emailFields }, { type: "object", name: "cancelled", label: "Zru\u0161en\xE1 rezerv\xE1cia", fields: emailFields }] }
      ] },
      { type: "object", name: "gallery", label: "8. Gal\xE9ria fotografi\xED", fields: [bool("enabled", "Zobrazova\u0165 cel\xFA gal\xE9riu"), str("label", "Mal\xFD nadpis"), str("title", "Hlavn\xFD nadpis"), str("description", "Popis gal\xE9rie", true), namedList("items", "Fotografie \u2013 prid\xE1va\u0165, odobra\u0165, meni\u0165 poradie", [img("image", "Fotografia"), str("alt", "ALT popis fotografie"), str("caption", "Popis fotografie"), bool("enabled", "Zobrazova\u0165 t\xFAto fotografiu")], "alt")] },
      { type: "object", name: "seo", label: "9. SEO a Google", fields: [
        str("title", "Titulok pre Google (ide\xE1lne do pribli\u017Ene 60 znakov)"),
        str("description", "Meta popis (ide\xE1lne okolo 150\u2013160 znakov)", true),
        str("socialTitle", "Nadpis pri zdie\u013Ean\xED"),
        str("socialDescription", "Popis pri zdie\u013Ean\xED", true),
        img("socialImage", "Obr\xE1zok pre soci\xE1lne siete (ide\xE1lne 1200 \xD7 630)"),
        str("businessName", "N\xE1zov prev\xE1dzky pre vyh\u013Ead\xE1va\u010De"),
        str("businessDescription", "Popis prev\xE1dzky pre Google", true)
      ] },
      { type: "object", name: "faq", label: "10. \u010Casto kladen\xE9 ot\xE1zky", fields: [
        bool("enabled", "Zobrazi\u0165 FAQ na str\xE1nke"),
        str("eyebrow", "Mal\xFD nadpis nad ot\xE1zkami"),
        str("title", "Hlavn\xFD nadpis sekcie"),
        namedList("items", "Ot\xE1zky \u2013 klikni na n\xE1zov pre \xFApravu", [str("question", "Ot\xE1zka (n\xE1zov polo\u017Eky)"), str("answer", "Odpove\u010F", true), bool("enabled", "Zobrazova\u0165 ot\xE1zku")], "question")
      ] }
    ]
  }] }
});
export {
  config_default as default
};
