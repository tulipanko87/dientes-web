# Úprava rezervačného systému

Upravené súbory:
- app/page.tsx

Čo sa zmenilo:
- odstránený Reservanto iframe
- pridaný vlastný rezervačný formulár priamo na stránke
- formulár má výber služby, dátumu, času, kontaktné údaje, poznámku a GDPR súhlas
- formulár je zatiaľ frontendový; na reálne ukladanie rezervácií treba doplniť backend / e-mail / databázu

Spustenie:
npm install
npm run dev

Overenie:
- TypeScript kontrola prešla cez `tsc --noEmit`
- `next build` sa v sandboxe nedal dokončiť, pretože Next.js sa pokúsil stiahnuť SWC balík z npm registra, ktorý je v tomto prostredí blokovaný.
