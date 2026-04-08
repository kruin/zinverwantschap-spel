# Zinverwantschapspel

GitHub Pages-klare versie van het prototype voor `kruin/zinverwantschap-spel`.

## Doel

Deze repository zet het aangeleverde prototype om naar een zelfstandige React/Vite-site die zonder extra UI-bibliotheken op GitHub Pages kan draaien.

## Lokale start

Installeer eerst Node.js 20 of nieuwer.

```bash
npm install
npm run dev
```

Open daarna:

```text
http://localhost:5173
```

## Build

```bash
npm run build
```

De statische output komt dan in:

```text
dist/
```

## GitHub-repository

Gebruik voor publicatie:

```text
https://github.com/kruin/zinverwantschap-spel
```

De publieke Pages-URL wordt dan:

```text
https://kruin.github.io/zinverwantschap-spel/
```

## GitHub Pages activeren

1. Maak op GitHub de repository `zinverwantschap-spel` onder account `kruin`.
2. Upload alle bestanden uit deze map.
3. Open in GitHub: **Settings → Pages**.
4. Kies bij **Build and deployment** voor **Source: GitHub Actions**.
5. Push naar `main`.
6. Wacht tot de workflow **Deploy GitHub Pages** groen is.
7. Open daarna de Pages-URL.

## Belangrijk

In `vite.config.js` staat de productie-base op:

```js
/zinverwantschap-spel/
```

Als je later een andere repositorynaam gebruikt, pas die regel dan aan.

## Inhoud

- `src/App.jsx` – volledige spelinterface
- `src/styles.css` – styling zonder externe UI-kit
- `src/main.jsx` – React entry point
- `.github/workflows/deploy-pages.yml` – automatische GitHub Pages-deploy
- `public/.nojekyll` – voorkomt Jekyll-interferentie op Pages

