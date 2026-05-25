# Editácia stránky cez TinaCMS

## Lokálne spustenie

```bash
npm install
npm run dev
```

Web:

```txt
http://localhost:3000
```

Admin:

```txt
http://localhost:3000/admin
```

## Čo sa dá editovať

V administrácii upravíš:

- logo / obrázok v hlavičke,
- hlavný obrázok v úvode,
- texty v úvode,
- karty služieb a ich voliteľné obrázky,
- galériu fotiek,
- priebeh ošetrenia,
- cenník,
- rezervačné služby,
- adresu a mapu.

Obrázky sa ukladajú do:

```txt
public/uploads/
```

Obsah stránky je v:

```txt
content/home.json
```

## Dôležité

Keď bežíš lokálne, TinaCMS je v local mode. Po kliknutí na Save sa zmeny uložia do súborov v tvojom počítači.
Aby sa zmeny ukázali online, treba ich nahrať do GitHubu. Vercel potom automaticky spraví nový deploy.
