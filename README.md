# Olaf — Portfolio & speelveld

Een Nederlandstalig portfolio (`index.html`) en twee browsergames (`games.html`): Memory en een reactietest met een lokaal bewaard persoonlijk record.

## Starten

Geen dependencies, API-sleutels of buildstap nodig. Vanuit `/workspace/Website`:

```sh
python3 -m http.server 8000 --bind 0.0.0.0
```

Open de site via je ontwikkelomgeving op poort 8000. Op je eigen computer kun je `http://localhost:8000` gebruiken. Stop de server met Ctrl+C.

Lettertypen, stijlen en spelcode worden lokaal geladen. Alleen de beste reactietijd wordt in `localStorage` opgeslagen. Er is geen backend, tracking of gebruikersaccount.

## Online via GitHub Pages

De site kan direct vanuit deze repository worden gepubliceerd. Open op GitHub **Settings → Pages**, kies **Deploy from a branch**, selecteer **main** en **/ (root)** en klik op **Save**. Het bestand `.nojekyll` zorgt dat GitHub de statische bestanden zonder Jekyll verwerkt.

Na een geslaagde publicatie staat de site op `https://olafheijl.github.io/Website/`. Latere wijzigingen op `main` worden automatisch gepubliceerd.

## Browsercontroles

In deze cloudomgeving zijn Playwright en Chromium beschikbaar:

```sh
node --test tests/website.test.cjs
```

De tests starten zelf een tijdelijke HTTP-server en controleren navigatie, mobiele weergave, een volledig Memory-spel, resetten tijdens een beurt, te vroeg reageren, een geldige reactie en het bewaren van het record. Buiten deze omgeving zijn `playwright` en Chromium nodig; stel zo nodig `CHROMIUM_PATH` in op het browserpad.

## Verder bouwen

Teksten en projectkaarten staan in de HTML-bestanden, gedeelde vormgeving in `assets/style.css` en spelcode in `assets/games.js`. Het AI-project is voorlopig alleen een idee. Een chatbot of model kan later als aparte toepassing worden toegevoegd, met een eigen backend voor eventuele API-sleutels en expliciete keuzes over testgegevens.
