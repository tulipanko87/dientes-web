# Bezpečnostný audit Dientes – 24. 10. 2026

Rozsah: lokálny zdrojový kód a závislosti vo vetve `security-audit`. Bez pushu, merge a nasadenia. Žiadne testovacie volania ostrého Google Calendar ani SMTP. Lokálny audit nenahrádza kontrolu oprávnení v TinaCloud, Google Cloud a Vercel.

## Zistenia a opravy

- Pôvodný `npm audit`: **55 nálezov (8 kritických, 34 vysokých, 12 stredných, 1 nízky)**. Ide o nálezy balíkov vrátane tranzitívnych a build nástrojov, nie o 55 potvrdených vzdialene zneužiteľných chýb webu. Podrobnosti: `security-audit-before.json`.
- Pri otvorení workspace neexistoval `node_modules` a Linux Node.js nebol dostupný. Pôvodné verzie boli overené v lockfile; prerušená inštalácia nie je dôkazom plnej nainštalovanej zostavy. Konečné verzie sa overujú priamo z nainštalovaných balíkov aj pomocou `npm ls`.
- API rezervácie: typy, dĺžky a riadiace znaky; JSON do 8 KiB; jedna e-mailová adresa; telefón; povinný súhlas; honeypot; limity podľa IP a adresy; kontrola pôvodu požiadaviek. Službu, trvanie, ordinačné hodiny, predstih a horizont naďalej určuje server podľa CMS. Viacriadkové poznámky zostávajú podporované.
- Chyby a chýbajúce odpovede freebusy sa už neinterpretujú ako voľný kalendár. Rozsah availability je celé číslo 1–365 dní.
- Potvrdenie a storno: GET iba zobrazí formulár, zmenu vykonáva POST. Pôvodné e-mailové odkazy a tokeny zostávajú použiteľné (vyžadujú kliknutie na tlačidlo). Formulár posiela token v tele POST; API odpovede majú no-store, no-referrer a noindex. Akčné stránky majú obmedzujúce CSP. Overuje sa formát tokenu a stav udalosti, platná expirácia a ETag pri zmene aj čistení expirovaných udalostí.
- Escapované používateľské údaje v potvrdení a interných HTML e-mailoch. Pacientske šablóny už escapovanie mali. Storno prednostne používa štruktúrované kontaktné údaje; staršie potvrdené udalosti podporuje pôvodným parserom.
- Odstránené logovanie celých chýb Google/SMTP, ktoré môže obsahovať osobné údaje alebo konfiguráciu.
- TinaCMS: generovaný klient obsahoval vložený token. Generované SDK a admin build sú vyradené zo sledovania Git a ignorované. Tina read token môže byť zámerne súčasťou browser SDK; nesmie mať oprávnenie zápisu ani sprístupňovať súkromný obsah. Token z histórie treba v TinaCloud preveriť a rotovať. Históriu Git tento audit neprepisuje.
- Preview Tina vetva prednostne používa `VERCEL_GIT_COMMIT_REF`; schéma a obsah zostávajú zachované. Klient už neimportuje celý zdrojový JSON; dostáva verejnú projekciu bez poznámok k uzavretým termínom. Schéma už poznámku neoznačuje za internú: obsah dostupný cez Tina read token treba považovať za verejný a nevkladať doň osobné údaje alebo tajomstvá.
- Presnejšie povolené domény odkazu na mapu a základné bezpečnostné HTTP hlavičky. Kanonická URL, metadáta, JSON-LD, robots pre verejnú stránku a vizuálna šablóna sa nemenia.

## Závislosti po aktualizácii

| Balík | Pôvodný lockfile | Overená inštalácia po oprave |
|---|---|---|
| next / eslint-config-next | 16.2.3 | 16.4.3 |
| react / react-dom | 19.2.4 | 19.3.1 |
| tinacms | 2.10.1 | 3.15.0 |
| @tinacms/cli | 1.12.6 | 4.0.3 (build/dev závislosť) |
| nodemailer | 9.0.0 | 10.2.1 |

Aktualizovaný je celý lockfile. Skutočné verzie boli skontrolované cez `npm ls --depth=0` aj `node_modules/*/package.json`. Node.js 22.23.4, npm 12.2.1 pri inštalácii (npm 10 zlyhal na internej chybe peer resolvera). Projekt podporuje Node.js 22 alebo 24 podľa požiadaviek Tina CLI. Npm 12 má povolené iba konkrétne skripty esbuild, unrs-resolver a better-sqlite3; informačný postinstall core-js nie je potrebný.

Konečný audit: **20 nálezov, 0 kritických, 14 vysokých, 4 stredné a 2 nízke**. `npm audit --omit=dev`: **8 nálezov, 6 vysokých a 2 nízke**. Tieto počty zahŕňajú nadradené balíky ovplyvnené rovnakými koreňovými chybami. Strojové výsledky: `security-audit-after.json` a `security-audit-production.json`.

Zostávajúce koreňové problémy:

| Balík a advisory | Nainštalované / opravené | Posúdenie |
|---|---|---|
| @graphql-tools/utils, GHSA-7mx3-vvmw-hjmv | vnorené 9.2.1 / >=12.0.1 (iné časti už majú 12.1.0) | Starý GraphQL loader Tina CLI vyžaduje staršiu hlavnú vetvu. Žiadny verejný GraphQL gateway v aplikácii nie je; dev server nepublikovať. Vynútený major override by nebol overenou kompatibilnou opravou. |
| zod, GHSA-mrhx-c7xc-m3w5 | 3.25.76 / >=4.6.6 | Tina balíky a ESLint stále používajú v3 API. Verejné rezervačné API zod neimportuje a požiadavky sú obmedzené na 8 KiB. Nejde o preukázanú zneužiteľnosť rezervačného endpointu. Vyžaduje opravu/migráciu upstream závislostí. |
| postcss-selector-parser, GHSA-rj75-hqrm-r3gf | vnorené 6.0.10 a 6.1.5 / >=7.1.6 | Tailwind 3/typography v Tina build nástrojoch. Web používa Tailwind 4. Build CSS je zo zdrojov repozitára, nie z verejných API vstupov. |
| katex, GHSA-238p-pmpm-9mq7 | 0.16.47 / >=0.18.2 | Mermaid v TinaCMS. Web neimplementuje používateľský matematický alebo Mermaid renderer. Vynútenie novšej vetvy bez overenia CMS rendererov by nebolo kompatibilnou opravou. |

`npm audit fix --force` pri TinaCMS navrhuje downgrade až na 1.2.1 alebo CLI 1.0.4. Tento downgrade nebol vykonaný. Pred produkciou treba vyhodnotiť tieto zvyšné nálezy a sledovať opravené vydania TinaCMS; audit nie je čistý.

## Zostávajúce riziká a kroky pred produkciou

1. **Rotácia Tina tokenu a kontrola prístupov:** odstránenie zo zdroja nezneplatňuje token v histórii, starších deployoch alebo ich artefaktoch. Overiť read-only oprávnenia, obmedzenie povolených domén a prístup editorov. Táto zmena nič nemení v účtoch poskytovateľov.
2. **Distribuovaný rate limiting a bot ochrana:** lokálny limiter je iba doplnkový, platí na proces a po cold starte sa obnoví. IP hlavička musí pochádzať z dôveryhodného proxy; mimo Vercel ju treba nastaviť. Pred produkciou nakonfigurovať zdieľaný limiter/WAF a podľa zaťaženia serverom overovaný bot challenge. Honeypot ani origin kontrola nezastavia cieleného bota.
3. **Súbeh nových rezervácií:** Google freebusy + insert nie sú transakcia. ETag chráni existujúcu udalosť, ale nezabráni dvom novým prekrývajúcim sa udalostiam. Pre úplnú garanciu treba spoločný transakčný zámok/úložisko pre celý interval, vrátane paralelných inštancií. Nebola zavedená neoverená databáza ani nový platený účet.
4. **Doručenie po potvrdení/storne:** zmena kalendára a SMTP nie sú jedna transakcia. Výpadok po úspešnej zmene môže spôsobiť chýbajúcu notifikáciu. Pre spoľahlivé opakovanie treba outbox/frontu a monitorovanie; opätovný POST nesmie opakovane meniť udalosť.
5. **Tokeny a osobné údaje:** linky sú prenosné bearer oprávnenia. URL prvého GET môže zachytiť infraštruktúrny access log; treba redigovať query parametre. Obmedziť prístup ku kalendáru a nastaviť retenciu osobných údajov. API availability stále môže vykonávať čistenie; chráni ho limiter a podmienené mazanie.
6. **Tina major upgrade:** overiť prihlásenie editora a ukladanie obsahu na izolovanom preview až po povolení nasadenia. Build nemôže overiť účet TinaCloud ani jeho autentifikačné nastavenia.

## Overenie

| Kontrola | Výsledok |
|---|---|
| `npm run typecheck` (`tsc --noEmit`) | Úspech, 0 chýb |
| `npm run lint` | Úspech, 0 chýb, 3 upozornenia na existujúce externé fonty v layout a icon-picker |
| `npm test` (Vitest) | 17/17 testov, 2 súbory |
| Tina produkčný admin build | Úspech; `tinacms build --skip-cloud-checks --skip-search-index`, testovacie placeholder údaje, žiadne uploadovanie indexu |
| Next.js produkčný build | Úspech; `next build --webpack`, vrátane vstavanej TypeScript kontroly a generovania všetkých 9 stránok |
| Lokálny HTTP smoke test produkčného buildu | 7/7 očakávaných odpovedí; HTML hlavnej stránky a adminu, kanonická URL, JSON-LD, formuláre potvrdenia/storna, neplatné API vstupy a bezpečnostné hlavičky |
| `git diff --check` | Úspech |
| Skutočne nainštalované verzie vs. lockfile | Zhoda všetkých 17 priamych balíkov; `security-installed-versions.json` |
| Vzorový scan aktuálne sledovaných zdrojov na kľúče/tokeny | Bez ďalšieho nálezu po vyradení generovaného klienta; nie je zárukou neprítomnosti všetkých tajomstiev ani scan celej histórie |

Bezpečnostné testy používajú náhrady celého `googleapis` a transportu Nodemailer. Pokrývajú typy a limity JSON, e-mailové a telefónne vstupy, honeypot, súhlas, escapovanie, rate limiting, cudzí pôvod aj dôveryhodný preview Host, tokeny v POST formulári, GET bez vedľajších účinkov, ETag súbeh, neplatnú expiráciu, správneho adresáta storna, serverové trvanie rezervácie, rollback po zlyhaní SMTP, chybu freebusy, skutočné pravidlá termínov z CMS a verejnú projekciu bez poznámok.

Build bežal nad kópiou aktuálnych aplikačných zdrojov v `/tmp/dientes-deps`, kde sú závislosti fyzicky nainštalované. Turbopack v tomto prostredí odmietol externý symlink na `node_modules` a následne narazil na blokované vytvorenie lokálneho portu. Preto bol finálny produkčný build overený podporovaným Webpackom mimo sandboxu. Pred jeho posledným úspešným opakovaním bola odstránená iba cache vytvorená auditom, pretože `/tmp` má limit 3,9 GB. Predvolený projektový `npm run build` zostáva zachovaný (`tinacms build --skip-cloud-checks && next build`); úspech predvoleného Turbopack buildu v tomto prostredí sa netvrdí.

Build aj lokálny server dostali prostredie bez Google/SMTP/Tina prihlasovacích údajov; build používal iba explicitné neplatné Tina placeholder údaje a vetvu `security-audit`. HTTP test `availability` očakával 500 pre chýbajúcu konfiguráciu, nie odpoveď ostrého kalendára. `security-smoke-results.json` zaznamenáva všetkých 7 výsledkov. Skutočné doručenie pošty, Google oprávnenia a TinaCloud prihlásenie neboli testované. Vizuálna šablóna, CSS, obsah a SEO layout nemajú zmeny; automatizovaný vizuálny test v prehliadači sa nevykonal.

Generované súbory sú lokálne zachované a ich odstránenie zo sledovania je už pripravené v Git indexe; aplikačné opravy sú pracovné zmeny. Commit, push, merge ani nasadenie neboli vykonané.

## Návrat zmien

Pred nasadením uchovať predchádzajúci artefakt. V prípade regresie vrátiť tento balík zmien spolu s pôvodnými `package.json` a lockfile a znova zostaviť. Nevkladať späť historický token ani generované SDK do Git. Existujúce kalendárové udalosti nevyžadujú migráciu a staré e-mailové odkazy sú podporované. Návrat na zraniteľné závislosti môže byť len dočasný núdzový krok.

Zdroje: [Next.js bezpečnostná aktualizácia](https://nextjs.org/blog/nextjs-security-update-october-14-2026), [React vydania](https://react.dev/versions), [aktualizácie TinaCMS](https://tina.io/docs/guides/upgrade-to-latest-version), [ignorovanie generovaných súborov TinaCMS](https://tina.io/blog/tina-config-rearrangements), [podmienené zmeny Google Calendar cez ETag](https://developers.google.com/workspace/calendar/api/guides/version-resources), register npm a jeho audit počas tohto overenia.
